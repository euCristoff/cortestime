import { db } from "../firebase";
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit 
} from "firebase/firestore";
import { 
  UTMData, 
  AnalyticsVisit, 
  AnalyticsEvent, 
  AnalyticsEventType, 
  MerchantUser, 
  MerchantAnalyticsSummary,
  MerchantActivityStatus,
  FunnelStage,
  SourceMetric,
  CampaignMetric,
  Appointment
} from "../types";

const COLL_VISITS = "analytics_visits";
const COLL_EVENTS = "analytics_events";

const STORAGE_FIRST_UTM = "cortestime_first_utm";
const STORAGE_LAST_UTM = "cortestime_last_utm";
const STORAGE_VISITOR_ID = "cortestime_visitor_id";
const STORAGE_LOCAL_VISITS = "cortestime_analytics_visits";
const STORAGE_LOCAL_EVENTS = "cortestime_analytics_events";

function generateUUID(prefix = "ct"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function normalizeSource(sourceParam: string | null, referrer: string): string {
  if (sourceParam && sourceParam.trim()) {
    const s = sourceParam.trim().toLowerCase();
    if (s.includes("face") || s === "fb") return "facebook";
    if (s.includes("insta") || s === "ig") return "instagram";
    if (s.includes("whats") || s === "wpp" || s === "zap") return "whatsapp";
    if (s.includes("goog")) return "google";
    if (s.includes("tik")) return "tiktok";
    if (s.includes("you") || s === "yt") return "youtube";
    return s;
  }

  if (referrer) {
    const r = referrer.toLowerCase();
    if (r.includes("facebook.com") || r.includes("fb.com")) return "facebook";
    if (r.includes("instagram.com") || r.includes("l.instagram.com")) return "instagram";
    if (r.includes("whatsapp.com") || r.includes("wa.me")) return "whatsapp";
    if (r.includes("google.com")) return "google";
    if (r.includes("tiktok.com")) return "tiktok";
    if (r.includes("youtube.com")) return "youtube";
  }

  return "direto";
}

export const analyticsTracker = {
  getVisitorId(): string {
    let vid = localStorage.getItem(STORAGE_VISITOR_ID);
    if (!vid) {
      vid = generateUUID("visitor");
      localStorage.setItem(STORAGE_VISITOR_ID, vid);
    }
    return vid;
  },

  getSessionId(): string {
    let sid = sessionStorage.getItem("cortestime_session_id");
    if (!sid) {
      sid = generateUUID("session");
      sessionStorage.setItem("cortestime_session_id", sid);
    }
    return sid;
  },

  initTracking(): UTMData {
    const urlParams = new URLSearchParams(window.location.search);
    const rawSource = urlParams.get("utm_source") || urlParams.get("source") || urlParams.get("src") || urlParams.get("ref");
    const rawMedium = urlParams.get("utm_medium") || urlParams.get("medium");
    const rawCampaign = urlParams.get("utm_campaign") || urlParams.get("campaign") || urlParams.get("campanha");
    const referrer = document.referrer || "";
    const source = normalizeSource(rawSource, referrer);

    const visitorId = this.getVisitorId();
    const sessionId = this.getSessionId();
    const nowIso = new Date().toISOString();
    const dateStr = nowIso.split("T")[0];

    const currentUtmData: UTMData = {
      source,
      medium: rawMedium || undefined,
      campaign: rawCampaign || undefined,
      referrer: referrer || undefined,
      timestamp: nowIso,
      path: window.location.pathname,
      visitorId
    };

    // 1. Guardar Primeira Visita (First-Touch Attribution) se ainda não existir
    const existingFirst = localStorage.getItem(STORAGE_FIRST_UTM);
    if (!existingFirst) {
      localStorage.setItem(STORAGE_FIRST_UTM, JSON.stringify(currentUtmData));
    }

    // 2. Guardar Última Visita (Last-Touch Attribution)
    localStorage.setItem(STORAGE_LAST_UTM, JSON.stringify(currentUtmData));

    // 3. Registrar visita de sessão (somente 1 por sessão para não duplicar se der refresh na mesma página)
    const sessionRecordedKey = `cortestime_visit_rec_${sessionId}_${window.location.pathname}`;
    if (!sessionStorage.getItem(sessionRecordedKey)) {
      sessionStorage.setItem(sessionRecordedKey, "true");

      const visitRecord: AnalyticsVisit = {
        id: generateUUID("visit"),
        visitorId,
        sessionId,
        utmSource: source,
        utmMedium: rawMedium || undefined,
        utmCampaign: rawCampaign || undefined,
        referrer: referrer || undefined,
        path: window.location.pathname,
        timestamp: nowIso,
        dateStr
      };

      // Gravar no Firestore
      try {
        setDoc(doc(db, COLL_VISITS, visitRecord.id), visitRecord).catch(err => {
          console.warn("Analytics visit Firestore save notice:", err);
        });
      } catch (e) {
        console.warn("Analytics visit error:", e);
      }

      // Gravar no cache LocalStorage
      try {
        const storedVisitsRaw = localStorage.getItem(STORAGE_LOCAL_VISITS);
        const list: AnalyticsVisit[] = storedVisitsRaw ? JSON.parse(storedVisitsRaw) : [];
        list.unshift(visitRecord);
        localStorage.setItem(STORAGE_LOCAL_VISITS, JSON.stringify(list.slice(0, 300)));
      } catch (e) {}
    }

    return currentUtmData;
  },

  getAttributionData(): {
    utmSource: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmReferrer?: string;
    firstVisitAt?: string;
    lastVisitAt?: string;
  } {
    try {
      const firstRaw = localStorage.getItem(STORAGE_FIRST_UTM);
      const lastRaw = localStorage.getItem(STORAGE_LAST_UTM);

      const first: UTMData | null = firstRaw ? JSON.parse(firstRaw) : null;
      const last: UTMData | null = lastRaw ? JSON.parse(lastRaw) : null;

      const chosen = first || last;

      return {
        utmSource: chosen?.source || "direto",
        utmMedium: chosen?.medium,
        utmCampaign: chosen?.campaign,
        utmReferrer: chosen?.referrer,
        firstVisitAt: first?.timestamp,
        lastVisitAt: last?.timestamp || new Date().toISOString()
      };
    } catch (e) {
      return {
        utmSource: "direto",
        lastVisitAt: new Date().toISOString()
      };
    }
  },

  async trackEvent(
    merchantUid: string,
    merchantName: string | undefined,
    eventType: AnalyticsEventType,
    eventLabel: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    if (!merchantUid) return;

    const nowIso = new Date().toISOString();
    const dateStr = nowIso.split("T")[0];
    const eventId = generateUUID("event");

    const eventRecord: AnalyticsEvent = {
      id: eventId,
      merchantUid,
      merchantName: merchantName || "Barbearia",
      eventType,
      eventLabel,
      metadata: metadata || {},
      timestamp: nowIso,
      dateStr
    };

    // 1. Gravar evento no Firestore
    try {
      setDoc(doc(db, COLL_EVENTS, eventId), eventRecord).catch(err => {
        console.warn("Analytics event Firestore save warning:", err);
      });
    } catch (e) {
      console.warn("Analytics trackEvent Firestore error:", e);
    }

    // 2. Atualizar atividade recente no perfil do Merchant
    try {
      const userRef = doc(db, "users", merchantUid);
      const updateData: any = {
        lastActivityAt: nowIso,
        lastActivityLabel: eventLabel
      };
      if (eventType === "login") {
        updateData.lastLoginAt = nowIso;
      }
      setDoc(userRef, updateData, { merge: true }).catch(() => {});
    } catch (e) {}

    // 3. Gravar no LocalStorage cache
    try {
      const raw = localStorage.getItem(STORAGE_LOCAL_EVENTS);
      const list: AnalyticsEvent[] = raw ? JSON.parse(raw) : [];
      list.unshift(eventRecord);
      localStorage.setItem(STORAGE_LOCAL_EVENTS, JSON.stringify(list.slice(0, 500)));

      // Também salvar sessão local
      const sessionKey = "cortestime_merchant_session";
      const sessStr = localStorage.getItem(sessionKey);
      if (sessStr) {
        const parsed = JSON.parse(sessStr);
        if (parsed.uid === merchantUid) {
          parsed.lastActivityAt = nowIso;
          parsed.lastActivityLabel = eventLabel;
          if (eventType === "login") parsed.lastLoginAt = nowIso;
          localStorage.setItem(sessionKey, JSON.stringify(parsed));
        }
      }
    } catch (e) {}
  },

  async getAllVisits(): Promise<AnalyticsVisit[]> {
    let firestoreList: AnalyticsVisit[] = [];
    try {
      const snap = await getDocs(collection(db, COLL_VISITS));
      firestoreList = snap.docs.map(d => d.data() as AnalyticsVisit);
    } catch (e) {
      console.warn("Error getting visits from Firestore:", e);
    }

    let localList: AnalyticsVisit[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_LOCAL_VISITS);
      if (raw) localList = JSON.parse(raw);
    } catch (e) {}

    const map = new Map<string, AnalyticsVisit>();
    for (const v of [...localList, ...firestoreList]) {
      if (v.id) map.set(v.id, v);
    }

    const merged = Array.from(map.values());
    merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return merged;
  },

  async getAllEvents(): Promise<AnalyticsEvent[]> {
    let firestoreList: AnalyticsEvent[] = [];
    try {
      const snap = await getDocs(collection(db, COLL_EVENTS));
      firestoreList = snap.docs.map(d => d.data() as AnalyticsEvent);
    } catch (e) {
      console.warn("Error getting events from Firestore:", e);
    }

    let localList: AnalyticsEvent[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_LOCAL_EVENTS);
      if (raw) localList = JSON.parse(raw);
    } catch (e) {}

    const map = new Map<string, AnalyticsEvent>();
    for (const ev of [...localList, ...firestoreList]) {
      if (ev.id) map.set(ev.id, ev);
    }

    const merged = Array.from(map.values());
    merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return merged;
  },

  formatTimeAgo(isoString?: string): string {
    if (!isoString) return "Nunca";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "Recente";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return "Agora há pouco";
    if (diffMin === 1) return "Há 1 minuto";
    if (diffMin < 60) return `Há ${diffMin} minutos`;
    if (diffHours === 1) return "Há 1 hora";
    if (diffHours < 24) return `Há ${diffHours} horas`;
    if (diffDays === 1) return "Ontem";
    if (diffDays < 7) return `Há ${diffDays} dias`;
    if (diffDays < 30) return `Há ${Math.floor(diffDays / 7)} semanas`;
    return `Há ${Math.floor(diffDays / 30)} meses`;
  },

  formatExactDate(isoString?: string): string {
    if (!isoString) return "Sem registro";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;

    const now = new Date();
    const isToday = now.toDateString() === date.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = yesterday.toDateString() === date.toDateString();

    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const timeStr = `${hours}:${minutes}`;

    if (isToday) return `Hoje às ${timeStr}`;
    if (isYesterday) return `Ontem às ${timeStr}`;

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year} às ${timeStr}`;
  },

  calculateMerchantSummary(
    merchant: MerchantUser,
    allEvents: AnalyticsEvent[],
    appointments: Appointment[]
  ): MerchantAnalyticsSummary {
    const merchantEvents = allEvents.filter(e => e.merchantUid === merchant.uid);
    const merchantApps = appointments.filter(a => a.ownerId === merchant.uid);

    // Compute most recent activity timestamp
    let latestActivityIso = merchant.lastActivityAt || merchant.criadoEm;
    if (merchantEvents.length > 0) {
      const topEvent = merchantEvents[0];
      if (new Date(topEvent.timestamp).getTime() > new Date(latestActivityIso).getTime()) {
        latestActivityIso = topEvent.timestamp;
      }
    }

    const now = new Date();
    const lastActivityDate = new Date(latestActivityIso);
    const diffDays = Math.floor((now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));

    // Status: 🟢 Ativa (<= 7 dias) | 🟡 Pouco ativa (8 a 30 dias) | 🔴 Inativa (> 30 dias)
    let status: MerchantActivityStatus = "active";
    if (diffDays > 30) {
      status = "inactive";
    } else if (diffDays >= 8) {
      status = "low_activity";
    } else {
      status = "active";
    }

    // Active days count in 7, 30, 90 days
    const activeDatesSet7d = new Set<string>();
    const activeDatesSet30d = new Set<string>();
    const activeDatesSet90d = new Set<string>();

    const ms7d = 7 * 24 * 60 * 60 * 1000;
    const ms30d = 30 * 24 * 60 * 60 * 1000;
    const ms90d = 90 * 24 * 60 * 60 * 1000;

    merchantEvents.forEach(ev => {
      const evDate = new Date(ev.timestamp);
      const diff = now.getTime() - evDate.getTime();
      const dayKey = evDate.toISOString().split("T")[0];

      if (diff <= ms7d) activeDatesSet7d.add(dayKey);
      if (diff <= ms30d) activeDatesSet30d.add(dayKey);
      if (diff <= ms90d) activeDatesSet90d.add(dayKey);
    });

    const activeDays30d = Math.max(activeDatesSet30d.size, status === "active" ? 1 : 0);
    const activeDays7d = Math.max(activeDatesSet7d.size, status === "active" ? 1 : 0);
    const activeDays90d = Math.max(activeDatesSet90d.size, activeDays30d);

    const frequencyText = `${activeDays30d} ${activeDays30d === 1 ? 'dia ativo' : 'dias ativos'} nos últimos 30 dias`;
    const lastAccessFormatted = this.formatExactDate(merchant.lastLoginAt || merchant.lastActivityAt || merchant.criadoEm);
    
    let lastActivityFormatted = "Cadastro realizado";
    if (merchant.lastActivityLabel) {
      lastActivityFormatted = `${merchant.lastActivityLabel} (${this.formatTimeAgo(latestActivityIso)})`;
    } else if (merchantEvents.length > 0) {
      lastActivityFormatted = `${merchantEvents[0].eventLabel} (${this.formatTimeAgo(merchantEvents[0].timestamp)})`;
    } else {
      lastActivityFormatted = `Cadastro ${this.formatTimeAgo(merchant.criadoEm)}`;
    }

    return {
      merchant,
      status,
      lastAccessFormatted,
      lastActivityFormatted,
      frequencyText,
      activeDays7d,
      activeDays30d,
      activeDays90d,
      totalAppointments: merchantApps.length,
      totalClients: 0,
      totalBarbers: 0,
      totalServices: 0,
      recentEvents: merchantEvents.slice(0, 30)
    };
  }
};
