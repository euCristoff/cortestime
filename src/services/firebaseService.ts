import { db, auth } from "../firebase";
import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  updateDoc,
  deleteDoc,
  query,
  where
} from "firebase/firestore";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  signInWithPopup
} from "firebase/auth";
import { Service, Barber, Client, Appointment, MerchantUser, OnboardingData, DraftVitrine, AppNotification, QueueItem, AnalyticsVisit, AnalyticsEvent } from "../types";
import { analyticsTracker } from "./analyticsTracker";
import { extractAddressString } from "../utils/addressUtils";

// Collection Names
const COLL_SERVICES = "services";
const COLL_BARBERS = "barbers";
const COLL_CLIENTS = "clients";
const COLL_APPOINTMENTS = "appointments";
const COLL_DRAFT_VITRINES = "draft_vitrines";
const COLL_NOTIFICATIONS = "notifications";
const COLL_QUEUE = "queue";

// Auxiliar de Timeout para requisições do Firebase (previne carregamento infinito em conexões instáveis)
function withTimeout<T>(
  promise: Promise<T>, 
  ms: number = 25000, 
  errorMsg: string = "Tempo limite de conexão excedido. Verifique sua conexão de internet ou se o banco de dados do Firebase está ativo."
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errorMsg)), ms))
  ]);
}

export const firebaseService = {
  // Test connection
  async checkConnection(): Promise<boolean> {
    try {
      const testDoc = doc(db, "connection_test", "status");
      await withTimeout(setDoc(testDoc, { connected: true, timestamp: Date.now() }, { merge: true }), 15000);
      return true;
    } catch (e) {
      console.error("Firebase connection error:", e);
      return false;
    }
  },

  // Auth operations
  async signUp(
    email: string, 
    password: string, 
    nomeBarbearia: string, 
    nomeProprietario: string, 
    whatsapp: string,
    inviteCode?: string,
    customTrialDays?: number
  ): Promise<MerchantUser> {
    let draft: DraftVitrine | null = null;
    const hasCode = Boolean(inviteCode && inviteCode.trim());
    const normCode = inviteCode ? inviteCode.trim().toUpperCase() : '';

    if (hasCode) {
      draft = await this.getDraftVitrineByCode(normCode);
      if (draft && draft.usado) {
        throw new Error("Este código de convite já foi utilizado por outro usuário.");
      }
    }

    const userCredential = await withTimeout(
      createUserWithEmailAndPassword(auth, email, password), 
      30000, 
      "O servidor de cadastro do Firebase demorou muito para responder. Verifique sua conexão com a internet."
    );
    const user = userCredential.user;
    
    // Calculate dates
    const today = new Date();
    const formatDate = (date: Date) => {
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yyyy = date.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    };
    
    const trialInicio = formatDate(today);
    
    // Check if a custom trial period was provided (e.g. 15 days from invite or query param)
    const customDays = customTrialDays && customTrialDays > 0 ? customTrialDays : 7;
    const expiryDate = new Date();
    expiryDate.setDate(today.getDate() + customDays);
    const trialFim = formatDate(expiryDate);

    const expiry30Days = new Date();
    expiry30Days.setDate(today.getDate() + 30);
    const partnerBenefitsExpiry = formatDate(expiry30Days);
    
    // Get UTM / Attribution data
    const attribution = analyticsTracker.getAttributionData();

    const merchant: MerchantUser = {
      uid: user.uid,
      nomeBarbearia: draft?.nomeBarbearia || nomeBarbearia,
      nomeProprietario: draft?.nomeProprietario || nomeProprietario,
      email,
      whatsapp: draft?.whatsapp || whatsapp,
      plano: hasCode ? 'partner' : 'pro_trial',
      trialInicio,
      trialFim,
      status: 'ativo',
      criadoEm: new Date().toISOString(),
      onboardingCompleted: false,

      // UTM & Attribution tracking
      utmSource: attribution.utmSource,
      utmMedium: attribution.utmMedium,
      utmCampaign: attribution.utmCampaign,
      utmReferrer: attribution.utmReferrer,
      firstVisitAt: attribution.firstVisitAt,
      lastVisitAt: attribution.lastVisitAt,
      lastLoginAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      lastActivityLabel: "Cadastro realizado",

      // Partner campaign fields
      isPartner: hasCode,
      hasPartnerBadge: hasCode,
      partnerBenefitsExpiry: hasCode ? partnerBenefitsExpiry : undefined,
      partnerWelcomeShown: false,
      codigoConviteResgatado: normCode || undefined,

      ...(draft ? {
        vitrineLogo: draft.nomeBarbearia || '',
        vitrineLogoImage: draft.logoUrl || (draft as any).vitrineLogoImage || '',
        vitrineCapa: draft.capaUrl || (draft as any).vitrineCapa || '',
        vitrineSlogan: draft.slogan || '',
        vitrineHorarios: draft.horarios || '',
        vitrineLocalizacao: draft.endereco || '',
        vitrineWhatsApp: draft.whatsapp || whatsapp,
        vitrineInstagram: draft.instagram || '',
        codigoConviteResgatado: draft.codigo,
        vitrineDraftResgatada: true,
        draftJustClaimed: true,
        barbeiroUnico: draft.barbeiroUnico !== undefined ? draft.barbeiroUnico : true,
        vitrineBarbeiroUnico: draft.barbeiroUnico !== undefined ? draft.barbeiroUnico : true,
        vitrineThemePreset: draft.themePreset,
        vitrinePrimaryColor: draft.primaryColor,
        vitrineSecondaryColor: draft.secondaryColor,
        vitrineGradientEnabled: draft.gradientEnabled,
        vitrineTemplate: draft.template,
        vitrineModoAcao: draft.modoAcao,
        vitrineGaleria: draft.galeria || (draft as any).vitrineGaleria || [],
        vitrineMensagemWhatsAppAgendamento: draft.mensagemWhatsAppAgendamento || draft.vitrineMensagemWhatsAppAgendamento,
        vitrineMensagemWhatsAppOrdemChegada: draft.mensagemWhatsAppOrdemChegada || draft.vitrineMensagemWhatsAppOrdemChegada,
        vitrineMensagemWhatsAppPersonalizada: draft.mensagemWhatsAppPersonalizada || draft.vitrineMensagemWhatsAppPersonalizada,
        vitrinePermitirAgendamentoWhatsApp: draft.vitrinePermitirAgendamentoWhatsApp ?? (draft as any).permitirWhatsApp ?? true,
        vitrineUsarSaudacaoHorarioWhatsApp: draft.vitrineUsarSaudacaoHorarioWhatsApp ?? (draft as any).usarSaudacaoHorario ?? true,
        vitrineProdutos: (draft.servicos && draft.servicos.length > 0)
          ? draft.servicos.map((s, idx) => ({ id: s.id || `p-${idx}`, name: s.name, price: s.price, durationMin: s.durationMin || 30 }))
          : (draft as any).vitrineProdutos || []
      } : {})
    };

    // Populate draft services if present
    if (draft && draft.servicos && draft.servicos.length > 0) {
      for (const s of draft.servicos) {
        try {
          await this.saveService({
            name: s.name,
            price: s.price,
            durationMin: s.durationMin,
            commissionPercent: 50
          }, user.uid);
        } catch (e) {
          console.warn("Error saving draft service during signup:", e);
        }
      }
    }

    // Mark code as claimed
    if (draft) {
      await this.claimDraftVitrine(draft.codigo, user.uid, email);
    }
    
    // Save to Firestore 'users' collection
    await withTimeout(
      setDoc(doc(db, "users", user.uid), merchant), 
      15000, 
      "Não foi possível salvar o perfil no banco de dados. Tempo limite esgotado."
    );

    // Sync with Brevo asynchronously (client-side proxy call)
    try {
      fetch("/api/brevo/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: merchant.email,
          nomeProprietario: merchant.nomeProprietario,
          nomeBarbearia: merchant.nomeBarbearia,
          whatsapp: merchant.whatsapp,
          plano: merchant.plano
        })
      }).catch(err => console.error("Error triggering Brevo sync in signup:", err));
    } catch (err) {
      console.error("Failed to run Brevo fetch in signup:", err);
    }

    return merchant;
  },

  async signIn(email: string, password: string): Promise<MerchantUser> {
    const userCredential = await withTimeout(
      signInWithEmailAndPassword(auth, email, password), 
      30000, 
      "O servidor de login demorou muito para responder. Verifique sua conexão de internet."
    );
    const user = userCredential.user;
    
    const docRef = doc(db, "users", user.uid);
    let snap = null;
    try {
      snap = await withTimeout(
        getDoc(docRef), 
        15000, 
        "Não foi possível ler as informações de cadastro do banco de dados (Tempo esgotado)."
      );
    } catch (e) {
      console.warn("Could not fetch doc by UID during signIn, attempting fallback...", e);
    }

    if (snap && snap.exists()) {
      return snap.data() as MerchantUser;
    }

    // Try finding profile by email if doc by UID is missing
    const existingByEmail = await this.getMerchantByEmail(user.email || email);
    if (existingByEmail) {
      const updatedMerchant = { ...existingByEmail, uid: user.uid };
      await setDoc(docRef, updatedMerchant, { merge: true }).catch(() => {});
      return updatedMerchant;
    }

    // Auto-create fallback profile if no document exists in Firestore
    const today = new Date();
    const formatDate = (date: Date) => {
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yyyy = date.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    };
    const trialInicio = formatDate(today);
    const expiry = new Date();
    expiry.setDate(today.getDate() + 7);
    const trialFim = formatDate(expiry);

    const fallbackMerchant: MerchantUser = {
      uid: user.uid,
      nomeBarbearia: user.displayName ? `Barbearia de ${user.displayName}` : "Minha Barbearia",
      nomeProprietario: user.displayName || email.split('@')[0] || "Proprietário",
      email: user.email || email,
      whatsapp: "",
      plano: 'pro_trial',
      trialInicio,
      trialFim,
      status: 'ativo',
      criadoEm: new Date().toISOString(),
      onboardingCompleted: false
    };

    await setDoc(docRef, fallbackMerchant, { merge: true }).catch(err => {
      console.warn("Error creating fallback merchant profile in signIn:", err);
    });

    return fallbackMerchant;
  },

  async signInWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
  },

  async signInWithGooglePopup(): Promise<{ user: FirebaseUser; isNew: boolean; merchant?: MerchantUser }> {
    const provider = new GoogleAuthProvider();
    const userCredential = await withTimeout(
      signInWithPopup(auth, provider),
      60000,
      "O popup do Google demorou muito para responder. Tente novamente."
    );
    const user = userCredential.user;
    
    const docRef = doc(db, "users", user.uid);
    let snap = null;
    try {
      snap = await withTimeout(
        getDoc(docRef),
        15000,
        "Tempo limite esgotado ao buscar perfil do usuário no banco de dados."
      );
    } catch (e) {
      console.warn("Error fetching Google user doc by UID:", e);
    }

    if (snap && snap.exists()) {
      return { user, isNew: false, merchant: snap.data() as MerchantUser };
    }

    // Check by email fallback
    if (user.email) {
      const existingByEmail = await this.getMerchantByEmail(user.email);
      if (existingByEmail) {
        const updatedMerchant = { ...existingByEmail, uid: user.uid };
        await setDoc(docRef, updatedMerchant, { merge: true }).catch(() => {});
        return { user, isNew: false, merchant: updatedMerchant };
      }
    }

    return { user, isNew: true };
  },

  async handleRedirectResult(): Promise<{ user: FirebaseUser; isNew: boolean; merchant?: MerchantUser } | null> {
    const userCredential = await withTimeout(
      getRedirectResult(auth),
      15000,
      "Tempo limite esgotado ao processar retorno do Google."
    ).catch(err => {
      console.warn("getRedirectResult timeout/error, ignoring:", err);
      return null;
    });
    if (!userCredential) return null;
    const user = userCredential.user;
    
    const docRef = doc(db, "users", user.uid);
    let snap = null;
    try {
      snap = await withTimeout(
        getDoc(docRef),
        15000,
        "Tempo esgotado ao buscar perfil do usuário após redirecionamento."
      );
    } catch (e) {
      console.warn("Error fetching redirect user doc by UID:", e);
    }

    if (snap && snap.exists()) {
      return { user, isNew: false, merchant: snap.data() as MerchantUser };
    }

    if (user.email) {
      const existingByEmail = await this.getMerchantByEmail(user.email);
      if (existingByEmail) {
        const updatedMerchant = { ...existingByEmail, uid: user.uid };
        await setDoc(docRef, updatedMerchant, { merge: true }).catch(() => {});
        return { user, isNew: false, merchant: updatedMerchant };
      }
    }

    return { user, isNew: true };
  },

  async saveGoogleMerchantProfile(user: FirebaseUser, nomeBarbearia: string, nomeProprietario: string, whatsapp: string, customTrialDays?: number): Promise<MerchantUser> {
    const today = new Date();
    const formatDate = (date: Date) => {
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yyyy = date.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    };
    
    const trialInicio = formatDate(today);
    
    const customDays = customTrialDays && customTrialDays > 0 ? customTrialDays : 7;
    const expiry = new Date();
    expiry.setDate(today.getDate() + customDays);
    const trialFim = formatDate(expiry);
    
    const attribution = analyticsTracker.getAttributionData();

    const merchant: MerchantUser = {
      uid: user.uid,
      nomeBarbearia,
      nomeProprietario,
      email: user.email || "",
      whatsapp,
      plano: 'pro_trial',
      trialInicio,
      trialFim,
      status: 'ativo',
      criadoEm: new Date().toISOString(),
      onboardingCompleted: false,

      // UTM & Attribution
      utmSource: attribution.utmSource,
      utmMedium: attribution.utmMedium,
      utmCampaign: attribution.utmCampaign,
      utmReferrer: attribution.utmReferrer,
      firstVisitAt: attribution.firstVisitAt,
      lastVisitAt: attribution.lastVisitAt,
      lastLoginAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      lastActivityLabel: "Cadastro realizado (Google)"
    };
    
    await withTimeout(
      setDoc(doc(db, "users", user.uid), merchant),
      15000,
      "Tempo limite excedido ao salvar perfil do Google."
    );
    return merchant;
  },

  async signOut(): Promise<void> {
    await fbSignOut(auth);
  },

  async getMerchant(uid: string): Promise<MerchantUser | null> {
    try {
      const docRef = doc(db, "users", uid);
      const snap = await withTimeout(
        getDoc(docRef), 
        15000, 
        "Não foi possível carregar o perfil da barbearia (tempo esgotado)."
      );
      if (snap.exists()) {
        return snap.data() as MerchantUser;
      }
    } catch (e) {
      console.warn("getMerchant error for UID:", uid, e);
    }
    return null;
  },

  async getMerchantByEmail(email: string): Promise<MerchantUser | null> {
    if (!email || typeof email !== 'string') return null;
    try {
      const q = query(collection(db, "users"), where("email", "==", email.toLowerCase().trim()));
      const snap = await withTimeout(getDocs(q), 15000);
      if (!snap.empty) {
        return snap.docs[0].data() as MerchantUser;
      }
    } catch (e) {
      console.warn("getMerchantByEmail error:", e);
    }
    return null;
  },

  async saveMerchantProfile(merchant: MerchantUser): Promise<void> {
    const docRef = doc(db, "users", merchant.uid);
    const cleanData = JSON.parse(JSON.stringify(merchant, (_k, v) => (v === undefined ? null : v)));
    await withTimeout(
      setDoc(docRef, cleanData, { merge: true }),
      20000,
      "Tempo limite excedido ao salvar perfil da barbearia."
    );
    try {
      localStorage.setItem("cortestime_merchant_session", JSON.stringify(merchant));
      localStorage.setItem("cortestime_merchant_profile", JSON.stringify(merchant));
    } catch (_) {}
  },

  async updateMerchantProfile(uid: string, data: Partial<MerchantUser>): Promise<void> {
    let targetUid = uid;
    if (!targetUid) {
      try {
        const cached = localStorage.getItem('cortestime_merchant_session');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.uid) targetUid = parsed.uid;
        }
      } catch (_) {}
    }

    // Sanitize data: remove undefined values which cause Firestore updateDoc/setDoc to fail
    const cleanData = JSON.parse(
      JSON.stringify(data, (_key, value) => (value === undefined ? null : value))
    );

    // Sync immediately to LocalStorage so changes persist locally without waiting or failing
    try {
      const cached = localStorage.getItem('cortestime_merchant_session');
      const base = cached ? JSON.parse(cached) : {};
      const merged = { ...base, ...cleanData, ...(targetUid ? { uid: targetUid } : {}) };
      localStorage.setItem('cortestime_merchant_session', JSON.stringify(merged));
      localStorage.setItem('cortestime_merchant_profile', JSON.stringify(merged));
      if (targetUid) {
        localStorage.setItem(`cortestime_merchant_${targetUid}`, JSON.stringify(merged));
      }

      const rawAll = localStorage.getItem('cortestime_merchants');
      if (rawAll) {
        const list: MerchantUser[] = JSON.parse(rawAll);
        const idx = list.findIndex((x) => x.uid === targetUid);
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...cleanData };
          localStorage.setItem('cortestime_merchants', JSON.stringify(list));
        }
      }
    } catch (localErr) {
      console.warn("Could not sync local cache in updateMerchantProfile:", localErr);
    }

    if (targetUid) {
      const docRef = doc(db, "users", targetUid);
      try {
        await withTimeout(
          setDoc(docRef, cleanData, { merge: true }),
          15000,
          "Tempo limite esgotado ao atualizar perfil."
        );
      } catch (err) {
        console.warn("Aviso ao atualizar perfil no Firestore (cache local preservado):", err);
      }
    }

    // Sync with Brevo asynchronously if key details or subscription plans are updated
    if (targetUid && (data.plano !== undefined || data.nomeProprietario !== undefined || data.nomeBarbearia !== undefined || data.whatsapp !== undefined)) {
      try {
        const docRef = doc(db, "users", targetUid);
        getDoc(docRef).then((snap) => {
          if (snap.exists()) {
            const fullUser = snap.data() as MerchantUser;
            fetch("/api/brevo/contact", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: fullUser.email,
                nomeProprietario: fullUser.nomeProprietario,
                nomeBarbearia: fullUser.nomeBarbearia,
                whatsapp: fullUser.whatsapp,
                plano: fullUser.plano
              })
            }).catch(() => {});
          }
        }).catch(() => {});
      } catch (_) {}
    }
  },

  async getMerchantBySlug(slug: string): Promise<MerchantUser | null> {
    if (!slug) return null;
    
    // Clean and normalize the query slug in multiple ways
    let rawSlug = '';
    try {
      rawSlug = decodeURIComponent(slug).trim();
    } catch (_) {
      rawSlug = (slug || '').trim();
    }
    if (rawSlug.startsWith('@')) rawSlug = rawSlug.substring(1);
    
    const normalizeText = (text: string = ''): string => {
      return (text || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
    };

    const toAlphaNum = (text: string = ''): string => {
      return normalizeText(text).replace(/[^a-z0-9]/g, '');
    };

    const toKebab = (text: string = ''): string => {
      return normalizeText(text).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    };

    const targetLower = normalizeText(rawSlug);
    const targetAlpha = toAlphaNum(rawSlug);
    const targetKebab = toKebab(rawSlug);

    if (!targetAlpha && !targetLower) return null;

    // Helper to evaluate if a MerchantUser matches the slug
    const matchesMerchant = (m: Partial<MerchantUser>): boolean => {
      if (!m) return false;

      // 1. Match uid or custom link
      if (m.uid && (m.uid === rawSlug || toAlphaNum(m.uid) === targetAlpha)) return true;
      if (m.vitrineLinkPersonalizado) {
        const linkRaw = normalizeText(m.vitrineLinkPersonalizado);
        const linkAlpha = toAlphaNum(m.vitrineLinkPersonalizado);
        const linkKebab = toKebab(m.vitrineLinkPersonalizado);
        if (linkRaw === targetLower || linkAlpha === targetAlpha || linkKebab === targetKebab) return true;
      }

      // 2. Match nomeBarbearia
      if (m.nomeBarbearia) {
        const nameRaw = normalizeText(m.nomeBarbearia);
        const nameAlpha = toAlphaNum(m.nomeBarbearia);
        const nameKebab = toKebab(m.nomeBarbearia);
        if (nameRaw === targetLower || nameAlpha === targetAlpha || nameKebab === targetKebab) return true;
      }

      // 3. Match onboarding businessName
      if (m.onboardingData?.businessName) {
        const bNameRaw = normalizeText(m.onboardingData.businessName);
        const bNameAlpha = toAlphaNum(m.onboardingData.businessName);
        const bNameKebab = toKebab(m.onboardingData.businessName);
        if (bNameRaw === targetLower || bNameAlpha === targetAlpha || bNameKebab === targetKebab) return true;
      }

      // 4. Match nomeProprietario or onboarding fullName
      if (m.nomeProprietario) {
        const propAlpha = toAlphaNum(m.nomeProprietario);
        const propKebab = toKebab(m.nomeProprietario);
        if (propAlpha === targetAlpha || propKebab === targetKebab) return true;
      }
      if (m.onboardingData?.fullName) {
        const fnAlpha = toAlphaNum(m.onboardingData.fullName);
        const fnKebab = toKebab(m.onboardingData.fullName);
        if (fnAlpha === targetAlpha || fnKebab === targetKebab) return true;
      }

      // 5. Match invite code
      if (m.codigoConviteResgatado && toAlphaNum(m.codigoConviteResgatado) === targetAlpha) return true;

      // 6. Match WhatsApp digits if slug has 8+ digits
      if (m.whatsapp && targetAlpha.length >= 8) {
        const phoneDigits = m.whatsapp.replace(/\D/g, '');
        if (phoneDigits && (phoneDigits.includes(targetAlpha) || targetAlpha.includes(phoneDigits))) return true;
      }

      // 7. Match email prefix (e.g. nbarber@gmail.com -> nbarber)
      if (m.email) {
        const emailPrefix = toAlphaNum(m.email.split('@')[0]);
        if (emailPrefix && emailPrefix === targetAlpha) return true;
      }

      return false;
    };

    // Helper to evaluate if a DraftVitrine matches
    const draftToMerchant = (d: DraftVitrine): MerchantUser => {
      const logo = d.logoUrl || (d as any).vitrineLogoImage || '';
      const capa = d.capaUrl || (d as any).vitrineCapa || '';
      const gal = (d.galeria && d.galeria.length > 0) ? d.galeria : ((d as any).vitrineGaleria || []);
      const servs = (d.servicos && d.servicos.length > 0)
        ? d.servicos.map((s, idx) => ({ id: s.id || `p-${idx}`, name: s.name, price: typeof s.price === 'number' ? s.price : (parseFloat(s.price as any) || 0), durationMin: s.durationMin || 30 }))
        : (d as any).vitrineProdutos || [];
      const endFormatted = extractAddressString(d) || d.endereco || '';

      return {
        uid: d.id || `draft_${d.codigo}`,
        email: d.resgatadoPorEmail || 'contato@cortestime.com',
        nomeProprietario: d.nomeProprietario || 'Barbeiro',
        nomeBarbearia: d.nomeBarbearia || 'Barbearia',
        whatsapp: d.whatsapp || '',
        plano: 'vitrine',
        status: 'ativo',
        trialInicio: '01/01/2026',
        trialFim: '31/12/2099',
        criadoEm: d.criadoEm || new Date().toISOString(),
        onboardingCompleted: true,
        vitrineWhatsApp: d.whatsapp,
        vitrineInstagram: d.instagram,
        vitrineEndereco: endFormatted,
        vitrineLocalizacao: endFormatted,
        vitrineSlogan: d.slogan || 'Sua Barbearia de Confiança',
        vitrineHorarios: d.horarios || 'Seg - Sáb: 08:00 às 20:00',
        vitrineLogoImage: logo,
        vitrineLogo: d.nomeBarbearia,
        vitrineCapa: capa,
        vitrineLinkPersonalizado: d.nomeBarbearia ? toKebab(d.nomeBarbearia) : d.codigo,
        codigoConviteResgatado: d.codigo,
        barbeiroUnico: d.barbeiroUnico !== undefined ? d.barbeiroUnico : true,
        vitrineBarbeiroUnico: d.barbeiroUnico !== undefined ? d.barbeiroUnico : true,
        vitrineThemePreset: d.themePreset,
        vitrinePrimaryColor: d.primaryColor,
        vitrineSecondaryColor: d.secondaryColor,
        vitrineGradientEnabled: d.gradientEnabled,
        vitrineTemplate: d.template,
        vitrineModoAcao: d.modoAcao,
        vitrineGaleria: gal,
        vitrineProdutos: servs,
        servicos: servs,
        vitrineMensagemWhatsAppAgendamento: d.mensagemWhatsAppAgendamento || d.vitrineMensagemWhatsAppAgendamento,
        vitrineMensagemWhatsAppOrdemChegada: d.mensagemWhatsAppOrdemChegada || d.vitrineMensagemWhatsAppOrdemChegada,
        vitrineMensagemWhatsAppPersonalizada: d.mensagemWhatsAppPersonalizada || d.vitrineMensagemWhatsAppPersonalizada,
        vitrinePermitirAgendamentoWhatsApp: d.vitrinePermitirAgendamentoWhatsApp ?? (d as any).permitirWhatsApp ?? true,
        vitrineUsarSaudacaoHorarioWhatsApp: d.vitrineUsarSaudacaoHorarioWhatsApp ?? (d as any).usarSaudacaoHorario ?? true
      };
    };

    const enhanceUserAddress = (u: MerchantUser): MerchantUser => {
      const resolvedAddress = extractAddressString(u);
      if (resolvedAddress && (!u.vitrineLocalizacao || typeof u.vitrineLocalizacao !== 'string' || !u.vitrineLocalizacao.trim())) {
        return {
          ...u,
          vitrineLocalizacao: resolvedAddress,
          vitrineEndereco: u.vitrineEndereco || resolvedAddress
        };
      }
      return u;
    };

    // 1. Search in Firestore "users"
    try {
      // First try quick exact queries on vitrineLinkPersonalizado
      const qExact = query(collection(db, "users"), where("vitrineLinkPersonalizado", "==", rawSlug));
      const snapExact = await withTimeout(getDocs(qExact), 8000);
      if (!snapExact.empty) {
        return enhanceUserAddress(snapExact.docs[0].data() as MerchantUser);
      }

      // Scan all users with timeout protection
      const qAll = query(collection(db, "users"));
      const snapAll = await withTimeout(getDocs(qAll), 10000);
      if (!snapAll.empty) {
        for (const docSnap of snapAll.docs) {
          const user = docSnap.data() as MerchantUser;
          if (matchesMerchant(user)) {
            return enhanceUserAddress(user);
          }
        }
      }
    } catch (err) {
      console.warn("Error querying users in Firestore:", err);
    }

    // 2. Search in Firestore "draft_vitrines"
    try {
      const qDrafts = query(collection(db, COLL_DRAFT_VITRINES));
      const snapDrafts = await withTimeout(getDocs(qDrafts), 8000);
      if (!snapDrafts.empty) {
        for (const docSnap of snapDrafts.docs) {
          const draft = docSnap.data() as DraftVitrine;
          if (
            (draft.codigo && (draft.codigo.trim().toUpperCase() === rawSlug.toUpperCase() || toAlphaNum(draft.codigo) === targetAlpha)) ||
            (draft.nomeBarbearia && (toKebab(draft.nomeBarbearia) === targetKebab || toAlphaNum(draft.nomeBarbearia) === targetAlpha)) ||
            (draft.id === rawSlug)
          ) {
            return draftToMerchant(draft);
          }
        }
      }
    } catch (err) {
      console.warn("Error querying draft_vitrines in Firestore:", err);
    }

    // 3. Search in LocalStorage (session, cached profiles, drafts)
    try {
      const cachedSession = localStorage.getItem("cortestime_merchant_session");
      if (cachedSession) {
        const parsed = JSON.parse(cachedSession) as MerchantUser;
        if (matchesMerchant(parsed)) return parsed;
      }

      const cachedProfile = localStorage.getItem("cortestime_merchant_profile");
      if (cachedProfile) {
        const parsed = JSON.parse(cachedProfile) as MerchantUser;
        if (matchesMerchant(parsed)) return parsed;
      }

      const rawDrafts = localStorage.getItem("cortestime_draft_vitrines");
      if (rawDrafts) {
        const drafts: DraftVitrine[] = JSON.parse(rawDrafts);
        for (const draft of drafts) {
          if (
            (draft.codigo && (draft.codigo.trim().toUpperCase() === rawSlug.toUpperCase() || toAlphaNum(draft.codigo) === targetAlpha)) ||
            (draft.nomeBarbearia && (toKebab(draft.nomeBarbearia) === targetKebab || toAlphaNum(draft.nomeBarbearia) === targetAlpha)) ||
            (draft.id === rawSlug)
          ) {
            return draftToMerchant(draft);
          }
        }
      }
    } catch (e) {
      console.warn("Error reading local cache for slug lookup:", e);
    }

    // 4. Fallback for generic preview slugs (e.g. sua-barbearia, barbearia, demo)
    if (['sua-barbearia', 'barbearia', 'demo', 'preview', 'modelo'].includes(targetKebab)) {
      const cached = localStorage.getItem("cortestime_merchant_session") || localStorage.getItem("cortestime_merchant_profile");
      if (cached) {
        try {
          return JSON.parse(cached) as MerchantUser;
        } catch (_) {}
      }
    }

    return null;
  },

  async completeOnboarding(uid: string, data: OnboardingData): Promise<void> {
    const docRef = doc(db, "users", uid);
    await withTimeout(
      updateDoc(docRef, {
        onboardingCompleted: true,
        nomeBarbearia: data.businessName,
        nomeProprietario: data.fullName,
        whatsapp: data.cellphone,
        onboardingData: data
      }),
      15000,
      "Tempo limite esgotado ao salvar onboarding."
    );
  },

  onAuthChanged(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  // Services (Isolated)
  async saveService(service: Service, ownerId: string): Promise<void> {
    const docRef = doc(db, COLL_SERVICES, service.id);
    await withTimeout(
      setDoc(docRef, { ...service, ownerId }),
      15000,
      "Tempo esgotado ao salvar serviço."
    );
  },

  async deleteService(serviceId: string): Promise<void> {
    const docRef = doc(db, COLL_SERVICES, serviceId);
    await withTimeout(
      deleteDoc(docRef),
      15000,
      "Tempo esgotado ao excluir serviço."
    );
  },

  async getServices(ownerId: string): Promise<Service[]> {
    try {
      const q = query(collection(db, COLL_SERVICES), where("ownerId", "==", ownerId));
      const querySnapshot = await withTimeout(
        getDocs(q),
        25000,
        "Tempo limite excedido ao buscar lista de serviços."
      );
      const list: Service[] = [];
      querySnapshot.forEach((doc) => {
        list.push(doc.data() as Service);
      });
      return list;
    } catch (e) {
      console.warn("Aviso ao buscar serviços no Firebase (usando cache local):", e);
      return [];
    }
  },

  // Barbers (Isolated)
  async saveBarber(barber: Barber, ownerId: string): Promise<void> {
    const docRef = doc(db, COLL_BARBERS, barber.id);
    await withTimeout(
      setDoc(docRef, { ...barber, ownerId }),
      25000,
      "Tempo esgotado ao salvar profissional."
    );
  },

  async deleteBarber(barberId: string): Promise<void> {
    const docRef = doc(db, COLL_BARBERS, barberId);
    await withTimeout(
      deleteDoc(docRef),
      25000,
      "Tempo esgotado ao excluir profissional."
    );
  },

  async getBarbers(ownerId: string): Promise<Barber[]> {
    try {
      const q = query(collection(db, COLL_BARBERS), where("ownerId", "==", ownerId));
      const querySnapshot = await withTimeout(
        getDocs(q),
        25000,
        "Tempo limite excedido ao buscar lista de barbeiros."
      );
      const list: Barber[] = [];
      querySnapshot.forEach((doc) => {
        list.push(doc.data() as Barber);
      });
      return list;
    } catch (e) {
      console.warn("Aviso ao buscar barbeiros no Firebase (usando cache local):", e);
      return [];
    }
  },

  // Clients (Isolated)
  async saveClient(client: Client, ownerId: string): Promise<void> {
    const docRef = doc(db, COLL_CLIENTS, client.id);
    await withTimeout(
      setDoc(docRef, { ...client, ownerId }),
      25000,
      "Tempo esgotado ao salvar cliente."
    );
  },

  async getClients(ownerId: string): Promise<Client[]> {
    try {
      const q = query(collection(db, COLL_CLIENTS), where("ownerId", "==", ownerId));
      const querySnapshot = await withTimeout(
        getDocs(q),
        25000,
        "Tempo limite excedido ao buscar lista de clientes."
      );
      const list: Client[] = [];
      querySnapshot.forEach((doc) => {
        list.push(doc.data() as Client);
      });
      return list;
    } catch (e) {
      console.warn("Aviso ao buscar clientes no Firebase (usando cache local):", e);
      return [];
    }
  },

  // Appointments (Isolated)
  async saveAppointment(app: Appointment, ownerId: string): Promise<void> {
    const docRef = doc(db, COLL_APPOINTMENTS, app.id);
    await withTimeout(
      setDoc(docRef, { ...app, ownerId }),
      25000,
      "Tempo esgotado ao salvar agendamento."
    );
  },

  async getAppointments(ownerId: string): Promise<Appointment[]> {
    try {
      const q = query(collection(db, COLL_APPOINTMENTS), where("ownerId", "==", ownerId));
      const querySnapshot = await withTimeout(
        getDocs(q),
        25000,
        "Tempo limite excedido ao buscar agendamentos."
      );
      const list: Appointment[] = [];
      querySnapshot.forEach((doc) => {
        list.push(doc.data() as Appointment);
      });
      return list;
    } catch (e) {
      console.warn("Aviso ao buscar agendamentos no Firebase (usando cache local):", e);
      return [];
    }
  },

  async updateAppointmentStatus(
    id: string, 
    status: Appointment['status'], 
    extra?: { cancelledBy?: 'client' | 'barbershop'; cancellationReason?: string }
  ): Promise<void> {
    const docRef = doc(db, COLL_APPOINTMENTS, id);
    const payload: any = { status };
    if (extra?.cancelledBy) {
      payload.cancelledBy = extra.cancelledBy;
      payload.cancelledAt = new Date().toISOString();
    }
    if (extra?.cancellationReason !== undefined) {
      payload.cancellationReason = extra.cancellationReason;
    }
    await withTimeout(
      updateDoc(docRef, payload),
      15000,
      "Tempo limite excedido ao atualizar status do agendamento."
    );
  },

  // Live Queue / Ordem de Chegada (Isolated & Synced)
  async saveQueueItem(item: QueueItem, ownerId: string): Promise<void> {
    const docRef = doc(db, COLL_QUEUE, item.id);
    await withTimeout(
      setDoc(docRef, { ...item, ownerId }),
      20000,
      "Tempo esgotado ao salvar item na fila."
    );

    try {
      const localKey = `cortestime_queue_${ownerId}`;
      const stored = localStorage.getItem(localKey);
      const list: QueueItem[] = stored ? JSON.parse(stored) : [];
      const updated = [item, ...list.filter(q => q.id !== item.id)];
      localStorage.setItem(localKey, JSON.stringify(updated));
    } catch (_) {}
  },

  async getQueue(ownerId: string): Promise<QueueItem[]> {
    try {
      const q = query(collection(db, COLL_QUEUE), where("ownerId", "==", ownerId));
      const querySnapshot = await withTimeout(
        getDocs(q),
        20000,
        "Tempo limite excedido ao buscar fila de espera."
      );
      const list: QueueItem[] = [];
      querySnapshot.forEach((doc) => {
        list.push(doc.data() as QueueItem);
      });
      list.sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());

      try {
        localStorage.setItem(`cortestime_queue_${ownerId}`, JSON.stringify(list));
      } catch (_) {}

      return list;
    } catch (e) {
      console.warn("Aviso ao buscar fila no Firebase (usando cache local):", e);
      try {
        const stored = localStorage.getItem(`cortestime_queue_${ownerId}`);
        if (stored) return JSON.parse(stored);
      } catch (_) {}
      return [];
    }
  },

  async updateQueueItemStatus(
    id: string, 
    status: QueueItem['status'], 
    extra?: { barberId?: string; startedAt?: string; finishedAt?: string }
  ): Promise<void> {
    const docRef = doc(db, COLL_QUEUE, id);
    const payload: any = { status };
    if (extra?.barberId) payload.barberId = extra.barberId;
    if (extra?.startedAt) payload.startedAt = extra.startedAt;
    if (extra?.finishedAt) payload.finishedAt = extra.finishedAt;

    await withTimeout(
      updateDoc(docRef, payload),
      15000,
      "Tempo limite excedido ao atualizar status na fila."
    );
  },

  async deleteQueueItem(id: string): Promise<void> {
    const docRef = doc(db, COLL_QUEUE, id);
    await withTimeout(
      deleteDoc(docRef),
      15000,
      "Tempo esgotado ao remover cliente da fila."
    );
  },

  // Notifications system (Isolated & Synced)
  async saveNotification(notif: AppNotification): Promise<void> {
    try {
      const docRef = doc(db, COLL_NOTIFICATIONS, notif.id);
      await withTimeout(
        setDoc(docRef, notif),
        15000,
        "Tempo limite ao salvar notificação."
      );
    } catch (e) {
      console.warn("Aviso ao salvar notificação no Firebase (usando cache local):", e);
    }

    // Local storage sync
    try {
      const localKey = notif.ownerId ? `cortestime_notifs_${notif.ownerId}` : 'cortestime_notifications';
      const stored = localStorage.getItem(localKey);
      const list: AppNotification[] = stored ? JSON.parse(stored) : [];
      const updated = [notif, ...list.filter(n => n.id !== notif.id)];
      localStorage.setItem(localKey, JSON.stringify(updated.slice(0, 50)));

      if (notif.clientPhone) {
        const clientKey = `cortestime_client_notifs_${notif.clientPhone.replace(/\D/g, '')}`;
        const storedClient = localStorage.getItem(clientKey);
        const listClient: AppNotification[] = storedClient ? JSON.parse(storedClient) : [];
        localStorage.setItem(clientKey, JSON.stringify([notif, ...listClient.filter(n => n.id !== notif.id)].slice(0, 30)));
      }
    } catch (e) {
      console.error("Erro no cache local de notificações:", e);
    }
  },

  async getNotifications(ownerId: string): Promise<AppNotification[]> {
    try {
      const q = query(collection(db, COLL_NOTIFICATIONS), where("ownerId", "==", ownerId));
      const querySnapshot = await withTimeout(
        getDocs(q),
        15000,
        "Tempo limite excedido ao buscar notificações."
      );
      const list: AppNotification[] = [];
      querySnapshot.forEach((doc) => {
        list.push(doc.data() as AppNotification);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Update local cache
      try {
        localStorage.setItem(`cortestime_notifs_${ownerId}`, JSON.stringify(list));
      } catch (_) {}
      
      return list;
    } catch (e) {
      console.warn("Aviso ao buscar notificações no Firebase, buscando cache local:", e);
      try {
        const stored = localStorage.getItem(`cortestime_notifs_${ownerId}`);
        if (stored) return JSON.parse(stored);
      } catch (_) {}
      return [];
    }
  },

  async getClientNotifications(clientPhone: string, ownerId?: string): Promise<AppNotification[]> {
    const cleanPhone = (clientPhone || '').replace(/\D/g, '');
    if (!cleanPhone) return [];

    try {
      const q = query(
        collection(db, COLL_NOTIFICATIONS), 
        where("clientPhone", "==", cleanPhone)
      );
      const querySnapshot = await withTimeout(
        getDocs(q),
        15000,
        "Tempo limite ao buscar notificações do cliente."
      );
      const list: AppNotification[] = [];
      querySnapshot.forEach((doc) => {
        const n = doc.data() as AppNotification;
        if (!ownerId || !n.ownerId || n.ownerId === ownerId) {
          list.push(n);
        }
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return list;
    } catch (e) {
      console.warn("Aviso ao buscar notificações do cliente no Firebase, buscando local:", e);
      try {
        const stored = localStorage.getItem(`cortestime_client_notifs_${cleanPhone}`);
        if (stored) return JSON.parse(stored);
      } catch (_) {}
      return [];
    }
  },

  async markNotificationAsRead(id: string, ownerId?: string): Promise<void> {
    try {
      const docRef = doc(db, COLL_NOTIFICATIONS, id);
      await withTimeout(
        updateDoc(docRef, { read: true }),
        10000,
        "Tempo limite ao atualizar notificação."
      );
    } catch (e) {
      console.warn("Erro ao marcar notificação como lida no Firebase:", e);
    }

    if (ownerId) {
      try {
        const localKey = `cortestime_notifs_${ownerId}`;
        const stored = localStorage.getItem(localKey);
        if (stored) {
          const list: AppNotification[] = JSON.parse(stored);
          const updated = list.map(n => n.id === id ? { ...n, read: true } : n);
          localStorage.setItem(localKey, JSON.stringify(updated));
        }
      } catch (_) {}
    }
  },

  // Seeds initial defaults to Firestore if it's empty for this merchant
  async seedInitialDataForMerchant(ownerId: string, defaults: {
    services: Service[],
    barbers: Barber[],
    clients: Client[],
    appointments: Appointment[]
  }): Promise<void> {
    try {
      // Check and seed services
      const currentServices = await this.getServices(ownerId);
      if (currentServices.length === 0) {
        for (const s of defaults.services) {
          await this.saveService(s, ownerId);
        }
      }

      // Check and seed barbers
      const currentBarbers = await this.getBarbers(ownerId);
      if (currentBarbers.length === 0) {
        for (const b of defaults.barbers) {
          await this.saveBarber(b, ownerId);
        }
      }

      // Check and seed clients
      const currentClients = await this.getClients(ownerId);
      if (currentClients.length === 0) {
        for (const c of defaults.clients) {
          await this.saveClient(c, ownerId);
        }
      }

      // Check and seed appointments
      const currentApps = await this.getAppointments(ownerId);
      if (currentApps.length === 0) {
        for (const a of defaults.appointments) {
          await this.saveAppointment(a, ownerId);
        }
      }
    } catch (e) {
      console.error("Error seeding initial Firebase data for merchant:", e);
    }
  },

  async getAllMerchants(): Promise<MerchantUser[]> {
    try {
      const snap = await withTimeout(
        getDocs(collection(db, "users")),
        15000,
        "Tempo limite ao carregar barbeiros cadastrados."
      );
      return snap.docs.map((docSnap) => docSnap.data() as MerchantUser);
    } catch (e) {
      console.error("Error fetching all merchants:", e);
      return [];
    }
  },

  // Draft Vitrines / Invite Codes operations
  async getDraftVitrineByCode(codigo: string): Promise<DraftVitrine | null> {
    if (!codigo) return null;
    const norm = codigo.trim().toUpperCase();

    // 1. Try Firestore
    try {
      const q = query(collection(db, COLL_DRAFT_VITRINES), where("codigo", "==", norm));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docData = snap.docs[0].data() as DraftVitrine;
        const item: DraftVitrine = { ...docData, id: snap.docs[0].id || docData.id };

        // Keep LocalStorage updated
        try {
          const raw = localStorage.getItem("cortestime_draft_vitrines");
          const list: DraftVitrine[] = raw ? JSON.parse(raw) : [];
          const idx = list.findIndex(d => (d.codigo && d.codigo.trim().toUpperCase() === norm) || d.id === item.id);
          if (idx >= 0) {
            list[idx] = { ...list[idx], ...item };
          } else {
            list.unshift(item);
          }
          localStorage.setItem("cortestime_draft_vitrines", JSON.stringify(list));
        } catch (_) {}

        return item;
      }
    } catch (err) {
      console.warn("Firestore draft vitrine fetch error, checking LocalStorage:", err);
    }

    // 2. Check LocalStorage fallback
    try {
      const raw = localStorage.getItem("cortestime_draft_vitrines");
      if (raw) {
        const list: DraftVitrine[] = JSON.parse(raw);
        const found = list.find(d => d.codigo && d.codigo.trim().toUpperCase() === norm);
        if (found) return found;
      }
    } catch (e) {
      console.error("LocalStorage draft vitrines parse error:", e);
    }

    return null;
  },

  async claimDraftVitrine(codigo: string, userUid: string, userEmail: string): Promise<boolean> {
    if (!codigo) return false;
    const norm = codigo.trim().toUpperCase();
    const dataResgate = new Date().toISOString();

    // Update in Firestore
    try {
      const q = query(collection(db, COLL_DRAFT_VITRINES), where("codigo", "==", norm));
      const snap = await getDocs(q);
      if (!snap.empty) {
        for (const docSnap of snap.docs) {
          await updateDoc(docSnap.ref, {
            usado: true,
            resgatadoPorEmail: userEmail,
            resgatadoPorUid: userUid,
            dataResgate
          });
        }
      }
    } catch (err) {
      console.warn("Firestore update draft vitrine error:", err);
    }

    // Update LocalStorage
    try {
      const raw = localStorage.getItem("cortestime_draft_vitrines");
      let list: DraftVitrine[] = raw ? JSON.parse(raw) : [];
      list = list.map(item => {
        if (item.codigo && item.codigo.trim().toUpperCase() === norm) {
          return {
            ...item,
            usado: true,
            resgatadoPorEmail: userEmail,
            resgatadoPorUid: userUid,
            dataResgate
          };
        }
        return item;
      });
      localStorage.setItem("cortestime_draft_vitrines", JSON.stringify(list));
    } catch (e) {
      console.error("Error updating LocalStorage draft vitrine:", e);
    }

    return true;
  },

  async createDraftVitrine(draftData: Partial<DraftVitrine>): Promise<DraftVitrine> {
    const rawCode = draftData.codigo && draftData.codigo.trim() 
      ? draftData.codigo.trim().toUpperCase() 
      : `BARBER-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const id = draftData.id || `draft_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    const logo = draftData.logoUrl || (draftData as any)?.vitrineLogoImage || '';
    const capa = draftData.capaUrl || (draftData as any)?.vitrineCapa || '';
    const gal = draftData.galeria || (draftData as any)?.vitrineGaleria || [];
    const servs = draftData.servicos || (draftData as any)?.vitrineProdutos || [
      { name: 'Corte de Cabelo', price: 35, durationMin: 30 },
      { name: 'Barba Completa', price: 25, durationMin: 20 },
      { name: 'Combo Cabelo + Barba', price: 55, durationMin: 45 }
    ];
    const newDraft: DraftVitrine = {
      id,
      codigo: rawCode,
      nomeBarbearia: draftData.nomeBarbearia || 'Nova Barbearia',
      nomeProprietario: draftData.nomeProprietario || '',
      whatsapp: draftData.whatsapp || '',
      instagram: draftData.instagram || '',
      endereco: draftData.endereco || '',
      slogan: draftData.slogan || '',
      logoUrl: logo,
      vitrineLogoImage: logo,
      capaUrl: capa,
      vitrineCapa: capa,
      galeria: gal,
      vitrineGaleria: gal,
      horarios: draftData.horarios || 'Seg - Sáb: 08:00 às 20:00',
      servicos: servs,
      vitrineProdutos: (draftData as any)?.vitrineProdutos || servs.map((s, idx) => ({ id: s.id || `p-${idx}`, name: s.name, price: s.price, durationMin: s.durationMin || 30 })),
      barbeiroUnico: draftData.barbeiroUnico !== undefined ? draftData.barbeiroUnico : true,
      mensagemWhatsAppAgendamento: draftData.mensagemWhatsAppAgendamento || (draftData as any)?.vitrineMensagemWhatsAppAgendamento,
      mensagemWhatsAppOrdemChegada: draftData.mensagemWhatsAppOrdemChegada || (draftData as any)?.vitrineMensagemWhatsAppOrdemChegada,
      mensagemWhatsAppPersonalizada: draftData.mensagemWhatsAppPersonalizada || (draftData as any)?.vitrineMensagemWhatsAppPersonalizada,
      vitrineMensagemWhatsAppAgendamento: draftData.vitrineMensagemWhatsAppAgendamento || draftData.mensagemWhatsAppAgendamento,
      vitrineMensagemWhatsAppOrdemChegada: draftData.vitrineMensagemWhatsAppOrdemChegada || draftData.mensagemWhatsAppOrdemChegada,
      vitrineMensagemWhatsAppPersonalizada: draftData.vitrineMensagemWhatsAppPersonalizada || draftData.mensagemWhatsAppPersonalizada,
      vitrinePermitirAgendamentoWhatsApp: draftData.vitrinePermitirAgendamentoWhatsApp ?? (draftData as any)?.permitirWhatsApp ?? true,
      vitrineUsarSaudacaoHorarioWhatsApp: draftData.vitrineUsarSaudacaoHorarioWhatsApp ?? (draftData as any)?.usarSaudacaoHorario ?? true,
      themePreset: draftData.themePreset || 'cortestime',
      primaryColor: draftData.primaryColor || '#051b42',
      secondaryColor: draftData.secondaryColor || '#2563eb',
      gradientEnabled: draftData.gradientEnabled ?? true,
      template: draftData.template || 'modelo1',
      modoAcao: draftData.modoAcao || 'agendamento',
      usado: false,
      criadoEm: new Date().toISOString(),
      criadoPorAdmin: draftData.criadoPorAdmin || 'Admin'
    };

    // Save in Firestore
    try {
      await setDoc(doc(db, COLL_DRAFT_VITRINES, id), newDraft);
    } catch (err) {
      console.warn("Firestore save draft vitrine error, saved to LocalStorage:", err);
    }

    // Save in LocalStorage
    try {
      const raw = localStorage.getItem("cortestime_draft_vitrines");
      const list: DraftVitrine[] = raw ? JSON.parse(raw) : [];
      const updated = [newDraft, ...list.filter(d => d.id !== id && d.codigo !== rawCode)];
      localStorage.setItem("cortestime_draft_vitrines", JSON.stringify(updated));
    } catch (e) {
      console.error("Error saving draft vitrine to LocalStorage:", e);
    }

    return newDraft;
  },

  async updateDraftVitrine(draftId: string, draftData: Partial<DraftVitrine>): Promise<DraftVitrine> {
    const raw = localStorage.getItem("cortestime_draft_vitrines");
    let currentList: DraftVitrine[] = raw ? JSON.parse(raw) : [];
    const targetCode = (draftData.codigo || '').trim().toUpperCase();
    const existing = currentList.find(d => (draftId && d.id === draftId) || (targetCode && (d.codigo || '').trim().toUpperCase() === targetCode));

    const finalId = draftId || existing?.id || `draft_${Date.now()}`;
    const finalCode = draftData.codigo || existing?.codigo || `BARBER-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const incomingLogo = draftData.logoUrl !== undefined 
      ? draftData.logoUrl 
      : (draftData as any)?.vitrineLogoImage !== undefined 
      ? (draftData as any).vitrineLogoImage 
      : (existing?.logoUrl ?? (existing as any)?.vitrineLogoImage ?? '');

    const incomingCapa = draftData.capaUrl !== undefined 
      ? draftData.capaUrl 
      : (draftData as any)?.vitrineCapa !== undefined 
      ? (draftData as any).vitrineCapa 
      : (existing?.capaUrl ?? (existing as any)?.vitrineCapa ?? '');

    const incomingGaleria = draftData.galeria !== undefined
      ? draftData.galeria
      : (draftData as any)?.vitrineGaleria !== undefined
      ? (draftData as any).vitrineGaleria
      : (existing?.galeria ?? (existing as any)?.vitrineGaleria ?? []);

    const incomingServicos = draftData.servicos !== undefined
      ? draftData.servicos
      : (draftData as any)?.vitrineProdutos !== undefined
      ? (draftData as any).vitrineProdutos
      : (existing?.servicos ?? (existing as any)?.vitrineProdutos ?? []);

    const merged: DraftVitrine = {
      id: finalId,
      codigo: finalCode,
      nomeBarbearia: draftData.nomeBarbearia !== undefined ? draftData.nomeBarbearia : (existing?.nomeBarbearia ?? 'Barbearia'),
      nomeProprietario: draftData.nomeProprietario !== undefined ? draftData.nomeProprietario : (existing?.nomeProprietario ?? ''),
      whatsapp: draftData.whatsapp !== undefined ? draftData.whatsapp : (existing?.whatsapp ?? ''),
      instagram: draftData.instagram !== undefined ? draftData.instagram : (existing?.instagram ?? ''),
      endereco: draftData.endereco !== undefined ? draftData.endereco : (existing?.endereco ?? ''),
      slogan: draftData.slogan !== undefined ? draftData.slogan : (existing?.slogan ?? ''),
      logoUrl: incomingLogo,
      vitrineLogoImage: incomingLogo,
      capaUrl: incomingCapa,
      vitrineCapa: incomingCapa,
      galeria: incomingGaleria,
      vitrineGaleria: incomingGaleria,
      horarios: draftData.horarios !== undefined ? draftData.horarios : (existing?.horarios ?? 'Seg - Sáb: 08:00 às 20:00'),
      servicos: incomingServicos,
      vitrineProdutos: (draftData as any)?.vitrineProdutos || incomingServicos.map((s: any, idx: number) => ({ id: s.id || `p-${idx}`, name: s.name, price: s.price, durationMin: s.durationMin || 30 })),
      barbeiroUnico: draftData.barbeiroUnico !== undefined ? draftData.barbeiroUnico : (existing?.barbeiroUnico ?? true),
      mensagemWhatsAppAgendamento: draftData.mensagemWhatsAppAgendamento !== undefined ? draftData.mensagemWhatsAppAgendamento : (existing?.mensagemWhatsAppAgendamento ?? (existing as any)?.vitrineMensagemWhatsAppAgendamento),
      mensagemWhatsAppOrdemChegada: draftData.mensagemWhatsAppOrdemChegada !== undefined ? draftData.mensagemWhatsAppOrdemChegada : (existing?.mensagemWhatsAppOrdemChegada ?? (existing as any)?.vitrineMensagemWhatsAppOrdemChegada),
      mensagemWhatsAppPersonalizada: draftData.mensagemWhatsAppPersonalizada !== undefined ? draftData.mensagemWhatsAppPersonalizada : (existing?.mensagemWhatsAppPersonalizada ?? (existing as any)?.vitrineMensagemWhatsAppPersonalizada),
      vitrineMensagemWhatsAppAgendamento: draftData.vitrineMensagemWhatsAppAgendamento !== undefined ? draftData.vitrineMensagemWhatsAppAgendamento : (draftData.mensagemWhatsAppAgendamento ?? (existing?.vitrineMensagemWhatsAppAgendamento ?? existing?.mensagemWhatsAppAgendamento)),
      vitrineMensagemWhatsAppOrdemChegada: draftData.vitrineMensagemWhatsAppOrdemChegada !== undefined ? draftData.vitrineMensagemWhatsAppOrdemChegada : (draftData.mensagemWhatsAppOrdemChegada ?? (existing?.vitrineMensagemWhatsAppOrdemChegada ?? existing?.mensagemWhatsAppOrdemChegada)),
      vitrineMensagemWhatsAppPersonalizada: draftData.vitrineMensagemWhatsAppPersonalizada !== undefined ? draftData.vitrineMensagemWhatsAppPersonalizada : (draftData.mensagemWhatsAppPersonalizada ?? (existing?.vitrineMensagemWhatsAppPersonalizada ?? existing?.mensagemWhatsAppPersonalizada)),
      vitrinePermitirAgendamentoWhatsApp: draftData.vitrinePermitirAgendamentoWhatsApp !== undefined ? draftData.vitrinePermitirAgendamentoWhatsApp : (draftData as any)?.permitirWhatsApp !== undefined ? (draftData as any).permitirWhatsApp : (existing?.vitrinePermitirAgendamentoWhatsApp ?? (existing as any)?.permitirWhatsApp ?? true),
      vitrineUsarSaudacaoHorarioWhatsApp: draftData.vitrineUsarSaudacaoHorarioWhatsApp !== undefined ? draftData.vitrineUsarSaudacaoHorarioWhatsApp : (draftData as any)?.usarSaudacaoHorario !== undefined ? (draftData as any).usarSaudacaoHorario : (existing?.vitrineUsarSaudacaoHorarioWhatsApp ?? (existing as any)?.usarSaudacaoHorario ?? true),
      themePreset: draftData.themePreset !== undefined ? draftData.themePreset : (existing?.themePreset || 'cortestime'),
      primaryColor: draftData.primaryColor !== undefined ? draftData.primaryColor : (existing?.primaryColor || '#051b42'),
      secondaryColor: draftData.secondaryColor !== undefined ? draftData.secondaryColor : (existing?.secondaryColor || '#2563eb'),
      gradientEnabled: draftData.gradientEnabled !== undefined ? draftData.gradientEnabled : (existing?.gradientEnabled ?? true),
      template: draftData.template !== undefined ? draftData.template : (existing?.template || 'modelo1'),
      modoAcao: draftData.modoAcao !== undefined ? draftData.modoAcao : (existing?.modoAcao || 'agendamento'),
      usado: draftData.usado !== undefined ? draftData.usado : (existing?.usado ?? false),
      resgatadoPorEmail: draftData.resgatadoPorEmail !== undefined ? draftData.resgatadoPorEmail : existing?.resgatadoPorEmail,
      resgatadoPorUid: draftData.resgatadoPorUid !== undefined ? draftData.resgatadoPorUid : existing?.resgatadoPorUid,
      dataResgate: draftData.dataResgate !== undefined ? draftData.dataResgate : existing?.dataResgate,
      criadoEm: existing?.criadoEm || new Date().toISOString(),
      criadoPorAdmin: existing?.criadoPorAdmin || 'Admin'
    };

    // Clean data for Firestore
    const cleanData = JSON.parse(JSON.stringify(merged, (_k, v) => (v === undefined ? null : v)));

    // Save in Firestore
    try {
      if (finalId) {
        await setDoc(doc(db, COLL_DRAFT_VITRINES, finalId), cleanData, { merge: true });
      }
      // Also query by codigo in Firestore in case doc ID differs
      if (finalCode) {
        const q = query(collection(db, COLL_DRAFT_VITRINES), where("codigo", "==", finalCode));
        const snap = await getDocs(q);
        if (!snap.empty) {
          for (const d of snap.docs) {
            await setDoc(d.ref, cleanData, { merge: true });
          }
        }
      }
    } catch (err) {
      console.warn("Firestore update draft vitrine error:", err);
    }

    // Save in LocalStorage
    try {
      const idx = currentList.findIndex(d => d.id === finalId || (finalCode && d.codigo === finalCode));
      if (idx >= 0) {
        currentList[idx] = merged;
      } else {
        currentList.unshift(merged);
      }
      localStorage.setItem("cortestime_draft_vitrines", JSON.stringify(currentList));
    } catch (e) {
      console.error("Error updating draft vitrine in LocalStorage:", e);
    }

    return merged;
  },

  async getAllDraftVitrines(): Promise<DraftVitrine[]> {
    let firestoreList: DraftVitrine[] = [];
    try {
      const snap = await getDocs(collection(db, COLL_DRAFT_VITRINES));
      firestoreList = snap.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as DraftVitrine));
    } catch (err) {
      console.warn("Error fetching draft vitrines from Firestore:", err);
    }

    let localList: DraftVitrine[] = [];
    try {
      const raw = localStorage.getItem("cortestime_draft_vitrines");
      if (raw) {
        localList = JSON.parse(raw);
      } else {
        // Seed initial sample draft vitrines if none exist!
        localList = [
          {
            id: 'draft_sample_1',
            codigo: 'BARBER-7XK29',
            nomeBarbearia: 'Barbearia Premium Club',
            nomeProprietario: 'Ricardo Alves',
            whatsapp: '(11) 98888-7777',
            instagram: '@barbearia.premium.club',
            endereco: 'Av. Paulista, 1000 - São Paulo, SP',
            slogan: 'Estilo e tradição para o homem moderno',
            horarios: 'Seg - Sáb: 09:00 às 20:00',
            logoUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80',
            vitrineLogoImage: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&q=80',
            capaUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200&q=80',
            vitrineCapa: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200&q=80',
            servicos: [
              { name: 'Corte Social / Fade', price: 40, durationMin: 35 },
              { name: 'Barba Alinhada na Toalha Quente', price: 30, durationMin: 25 },
              { name: 'Combo Executivo (Cabelo + Barba)', price: 65, durationMin: 50 }
            ],
            barbeiroUnico: true,
            themePreset: 'cortestime',
            primaryColor: '#051b42',
            secondaryColor: '#2563eb',
            gradientEnabled: true,
            template: 'modelo1',
            modoAcao: 'agendamento',
            usado: false,
            criadoEm: new Date().toISOString(),
            criadoPorAdmin: 'Admin Cortestime'
          },
          {
            id: 'draft_sample_2',
            codigo: 'CORTES-AB123',
            nomeBarbearia: 'Studio Cortes & Estilo',
            nomeProprietario: 'Mateus Silva',
            whatsapp: '(21) 99777-6655',
            instagram: '@studiocortes.estilo',
            endereco: 'Rua das Flores, 250 - Rio de Janeiro, RJ',
            slogan: 'Sua melhor versão começa aqui',
            horarios: 'Ter - Sáb: 08:30 às 19:30',
            servicos: [
              { name: 'Corte Masculino Moderno', price: 35, durationMin: 30 },
              { name: 'Barboterapia Especial', price: 35, durationMin: 30 }
            ],
            barbeiroUnico: true,
            themePreset: 'esmeralda',
            primaryColor: '#064e3b',
            secondaryColor: '#10b981',
            gradientEnabled: true,
            template: 'modelo2',
            modoAcao: 'agendamento',
            usado: false,
            criadoEm: new Date().toISOString(),
            criadoPorAdmin: 'Admin Cortestime'
          },
          {
            id: 'draft_sample_3',
            codigo: 'PREMIUM-019',
            nomeBarbearia: 'Barbearia Don Corleone',
            nomeProprietario: 'Gabriel Santos',
            whatsapp: '(31) 99555-4433',
            instagram: '@barberia.doncorleone',
            endereco: 'Rua Bahia, 500 - Belo Horizonte, MG',
            slogan: 'A verdadeira experiência clássica',
            horarios: 'Seg - Sáb: 09:00 às 21:00',
            servicos: [
              { name: 'Corte Tesoura e Máquina', price: 45, durationMin: 40 },
              { name: 'Sobrancelha Navalhada', price: 15, durationMin: 15 }
            ],
            barbeiroUnico: false,
            themePreset: 'dourado',
            primaryColor: '#1a1408',
            secondaryColor: '#d97706',
            gradientEnabled: true,
            template: 'modelo1',
            modoAcao: 'agendamento',
            usado: false,
            criadoEm: new Date().toISOString(),
            criadoPorAdmin: 'Admin Cortestime'
          }
        ];
        localStorage.setItem("cortestime_draft_vitrines", JSON.stringify(localList));
      }
    } catch (e) {
      console.error("Error reading LocalStorage draft vitrines:", e);
    }

    // Deduplicate and merge lists: Firestore is the primary source of truth
    const mergedList: DraftVitrine[] = [];

    // 1. Add all Firestore items
    for (const fItem of firestoreList) {
      if (!fItem) continue;
      const logo = fItem.logoUrl || (fItem as any).vitrineLogoImage || '';
      const capa = fItem.capaUrl || (fItem as any).vitrineCapa || '';
      const gal = fItem.galeria || (fItem as any).vitrineGaleria || [];
      const servs = fItem.servicos || (fItem as any).vitrineProdutos || [];
      mergedList.push({
        ...fItem,
        logoUrl: logo,
        vitrineLogoImage: logo,
        capaUrl: capa,
        vitrineCapa: capa,
        galeria: gal,
        vitrineGaleria: gal,
        servicos: servs,
        vitrineProdutos: (fItem as any).vitrineProdutos || servs.map((s, idx) => ({ id: s.id || `p-${idx}`, name: s.name, price: s.price, durationMin: s.durationMin || 30 })),
        mensagemWhatsAppAgendamento: fItem.mensagemWhatsAppAgendamento || (fItem as any).vitrineMensagemWhatsAppAgendamento,
        mensagemWhatsAppOrdemChegada: fItem.mensagemWhatsAppOrdemChegada || (fItem as any).vitrineMensagemWhatsAppOrdemChegada,
        mensagemWhatsAppPersonalizada: fItem.mensagemWhatsAppPersonalizada || (fItem as any).vitrineMensagemWhatsAppPersonalizada,
        vitrineMensagemWhatsAppAgendamento: fItem.vitrineMensagemWhatsAppAgendamento || fItem.mensagemWhatsAppAgendamento,
        vitrineMensagemWhatsAppOrdemChegada: fItem.vitrineMensagemWhatsAppOrdemChegada || fItem.mensagemWhatsAppOrdemChegada,
        vitrineMensagemWhatsAppPersonalizada: fItem.vitrineMensagemWhatsAppPersonalizada || fItem.mensagemWhatsAppPersonalizada,
      });
    }

    // 2. Merge local items if not in Firestore, or backfill any missing data
    for (const lItem of localList) {
      if (!lItem) continue;
      const itemId = lItem.id ? String(lItem.id).trim() : '';
      const itemCode = lItem.codigo ? lItem.codigo.trim().toUpperCase() : '';

      const existingIdx = mergedList.findIndex(existing => {
        const existingId = existing.id ? String(existing.id).trim() : '';
        const existingCode = existing.codigo ? existing.codigo.trim().toUpperCase() : '';
        return (itemId && existingId && itemId === existingId) || (itemCode && existingCode && itemCode === existingCode);
      });

      const lLogo = lItem.logoUrl || (lItem as any).vitrineLogoImage || '';
      const lCapa = lItem.capaUrl || (lItem as any).vitrineCapa || '';
      const lGal = lItem.galeria || (lItem as any).vitrineGaleria || [];
      const lServs = lItem.servicos || (lItem as any).vitrineProdutos || [];

      if (existingIdx >= 0) {
        const current = mergedList[existingIdx];
        mergedList[existingIdx] = {
          ...lItem,
          ...current,
          logoUrl: current.logoUrl || lLogo,
          vitrineLogoImage: current.vitrineLogoImage || current.logoUrl || lLogo,
          capaUrl: current.capaUrl || lCapa,
          vitrineCapa: current.vitrineCapa || current.capaUrl || lCapa,
          galeria: (current.galeria && current.galeria.length > 0) ? current.galeria : lGal,
          vitrineGaleria: (current.galeria && current.galeria.length > 0) ? current.galeria : lGal,
          servicos: (current.servicos && current.servicos.length > 0) ? current.servicos : lServs,
          vitrineProdutos: (current.vitrineProdutos && current.vitrineProdutos.length > 0) ? current.vitrineProdutos : ((current.servicos && current.servicos.length > 0) ? current.servicos.map((s, idx) => ({ id: s.id || `p-${idx}`, name: s.name, price: s.price, durationMin: s.durationMin || 30 })) : lServs),
          mensagemWhatsAppAgendamento: current.mensagemWhatsAppAgendamento || lItem.mensagemWhatsAppAgendamento || (lItem as any).vitrineMensagemWhatsAppAgendamento,
          mensagemWhatsAppOrdemChegada: current.mensagemWhatsAppOrdemChegada || lItem.mensagemWhatsAppOrdemChegada || (lItem as any).vitrineMensagemWhatsAppOrdemChegada,
          mensagemWhatsAppPersonalizada: current.mensagemWhatsAppPersonalizada || lItem.mensagemWhatsAppPersonalizada || (lItem as any).vitrineMensagemWhatsAppPersonalizada,
          vitrineMensagemWhatsAppAgendamento: current.vitrineMensagemWhatsAppAgendamento || current.mensagemWhatsAppAgendamento || lItem.vitrineMensagemWhatsAppAgendamento || lItem.mensagemWhatsAppAgendamento,
          vitrineMensagemWhatsAppOrdemChegada: current.vitrineMensagemWhatsAppOrdemChegada || current.mensagemWhatsAppOrdemChegada || lItem.vitrineMensagemWhatsAppOrdemChegada || lItem.mensagemWhatsAppOrdemChegada,
          vitrineMensagemWhatsAppPersonalizada: current.vitrineMensagemWhatsAppPersonalizada || current.mensagemWhatsAppPersonalizada || lItem.vitrineMensagemWhatsAppPersonalizada || lItem.mensagemWhatsAppPersonalizada,
          id: current.id || lItem.id,
          codigo: current.codigo || lItem.codigo
        };
      } else {
        mergedList.push({
          ...lItem,
          logoUrl: lLogo,
          vitrineLogoImage: lLogo,
          capaUrl: lCapa,
          vitrineCapa: lCapa,
          galeria: lGal,
          vitrineGaleria: lGal,
          servicos: lServs,
          vitrineProdutos: (lItem as any).vitrineProdutos || lServs.map((s: any, idx: number) => ({ id: s.id || `p-${idx}`, name: s.name, price: s.price, durationMin: s.durationMin || 30 })),
          mensagemWhatsAppAgendamento: lItem.mensagemWhatsAppAgendamento || (lItem as any).vitrineMensagemWhatsAppAgendamento,
          mensagemWhatsAppOrdemChegada: lItem.mensagemWhatsAppOrdemChegada || (lItem as any).vitrineMensagemWhatsAppOrdemChegada,
          mensagemWhatsAppPersonalizada: lItem.mensagemWhatsAppPersonalizada || (lItem as any).vitrineMensagemWhatsAppPersonalizada,
          vitrineMensagemWhatsAppAgendamento: lItem.vitrineMensagemWhatsAppAgendamento || lItem.mensagemWhatsAppAgendamento,
          vitrineMensagemWhatsAppOrdemChegada: lItem.vitrineMensagemWhatsAppOrdemChegada || lItem.mensagemWhatsAppOrdemChegada,
          vitrineMensagemWhatsAppPersonalizada: lItem.vitrineMensagemWhatsAppPersonalizada || lItem.mensagemWhatsAppPersonalizada,
        });
      }
    }

    // Update local storage with fresh merged list
    try {
      localStorage.setItem("cortestime_draft_vitrines", JSON.stringify(mergedList));
    } catch (_) {}

    return mergedList;
  },

  async deleteDraftVitrine(draftId: string, codigo: string): Promise<void> {
    try {
      if (draftId) {
        await deleteDoc(doc(db, COLL_DRAFT_VITRINES, draftId));
      }
      if (codigo) {
        const q = query(collection(db, COLL_DRAFT_VITRINES), where("codigo", "==", codigo.trim().toUpperCase()));
        const snap = await getDocs(q);
        for (const d of snap.docs) {
          await deleteDoc(d.ref);
        }
      }
    } catch (e) {
      console.warn("Firestore delete draft error:", e);
    }

    try {
      const raw = localStorage.getItem("cortestime_draft_vitrines");
      if (raw) {
        let list: DraftVitrine[] = JSON.parse(raw);
        const targetCode = (codigo || '').trim().toUpperCase();
        list = list.filter(item => item.id !== draftId && (item.codigo || '').trim().toUpperCase() !== targetCode);
        localStorage.setItem("cortestime_draft_vitrines", JSON.stringify(list));
      }
    } catch (e) {
      console.error("LocalStorage delete draft error:", e);
    }
  },

  async getAllAppointmentsAdmin(): Promise<Appointment[]> {
    try {
      const snap = await getDocs(collection(db, COLL_APPOINTMENTS));
      return snap.docs.map(docSnap => docSnap.data() as Appointment);
    } catch (e) {
      console.warn("getAllAppointmentsAdmin error:", e);
      return [];
    }
  },

  async getAllClientsAdmin(): Promise<Client[]> {
    try {
      const snap = await getDocs(collection(db, COLL_CLIENTS));
      return snap.docs.map(docSnap => docSnap.data() as Client);
    } catch (e) {
      console.warn("getAllClientsAdmin error:", e);
      return [];
    }
  },

  async getAllServicesAdmin(): Promise<Service[]> {
    try {
      const snap = await getDocs(collection(db, COLL_SERVICES));
      return snap.docs.map(docSnap => docSnap.data() as Service);
    } catch (e) {
      console.warn("getAllServicesAdmin error:", e);
      return [];
    }
  },

  async getAllBarbersAdmin(): Promise<Barber[]> {
    try {
      const snap = await getDocs(collection(db, COLL_BARBERS));
      return snap.docs.map(docSnap => docSnap.data() as Barber);
    } catch (e) {
      console.warn("getAllBarbersAdmin error:", e);
      return [];
    }
  }
};
