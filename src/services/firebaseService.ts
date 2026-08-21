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
        vitrineLogo: draft.logoUrl || '',
        vitrineCapa: draft.capaUrl || '',
        vitrineSlogan: draft.slogan || '',
        vitrineHorarios: draft.horarios || '',
        vitrineLocalizacao: draft.endereco || '',
        vitrineWhatsApp: draft.whatsapp || whatsapp,
        vitrineInstagram: draft.instagram || '',
        codigoConviteResgatado: draft.codigo,
        vitrineDraftResgatada: true,
        draftJustClaimed: true
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
    await withTimeout(
      setDoc(docRef, merchant, { merge: true }),
      15000,
      "Tempo limite excedido ao salvar perfil da barbearia."
    );
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
        vitrineEndereco: d.endereco,
        vitrineSlogan: d.slogan || 'Sua Barbearia de Confiança',
        vitrineHorarios: d.horarios || 'Seg - Sáb: 08:00 às 20:00',
        vitrineLogoImage: d.logoUrl,
        vitrineCapa: d.capaUrl,
        vitrineLinkPersonalizado: d.nomeBarbearia ? toKebab(d.nomeBarbearia) : d.codigo,
        codigoConviteResgatado: d.codigo
      };
    };

    // 1. Search in Firestore "users"
    try {
      // First try quick exact queries on vitrineLinkPersonalizado
      const qExact = query(collection(db, "users"), where("vitrineLinkPersonalizado", "==", rawSlug));
      const snapExact = await withTimeout(getDocs(qExact), 8000);
      if (!snapExact.empty) {
        return snapExact.docs[0].data() as MerchantUser;
      }

      // Scan all users with timeout protection
      const qAll = query(collection(db, "users"));
      const snapAll = await withTimeout(getDocs(qAll), 10000);
      if (!snapAll.empty) {
        for (const docSnap of snapAll.docs) {
          const user = docSnap.data() as MerchantUser;
          if (matchesMerchant(user)) {
            return user;
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

  async updateMerchantProfile(uid: string, data: Partial<MerchantUser>): Promise<void> {
    const docRef = doc(db, "users", uid);
    
    // Sanitize data: remove undefined values which cause Firestore updateDoc/setDoc to fail
    const cleanData = JSON.parse(
      JSON.stringify(data, (_key, value) => (value === undefined ? null : value))
    );

    try {
      await withTimeout(
        setDoc(docRef, cleanData, { merge: true }),
        15000,
        "Tempo limite esgotado ao atualizar perfil."
      );
    } catch (err) {
      console.error("Erro ao atualizar perfil no Firestore:", err);
      // Fallback: Tenta updateDoc se setDoc falhar por algum motivo específico de regra
      try {
        await updateDoc(docRef, cleanData);
      } catch (err2) {
        console.error("Fallback updateDoc também falhou:", err2);
        throw err;
      }
    }

    // Sync with Brevo asynchronously if key details or subscription plans are updated
    if (data.plano !== undefined || data.nomeProprietario !== undefined || data.nomeBarbearia !== undefined || data.whatsapp !== undefined) {
      try {
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
            }).catch(err => console.error("Error triggering Brevo sync in update:", err));
          }
        }).catch(err => console.error("Error fetching updated user for Brevo sync:", err));
      } catch (err) {
        console.error("Failed to run Brevo fetch in update:", err);
      }
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
        return { ...docData, id: snap.docs[0].id };
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
        const docRef = snap.docs[0].ref;
        await updateDoc(docRef, {
          usado: true,
          resgatadoPorEmail: userEmail,
          resgatadoPorUid: userUid,
          dataResgate
        });
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

    const id = `draft_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
    const newDraft: DraftVitrine = {
      id,
      codigo: rawCode,
      nomeBarbearia: draftData.nomeBarbearia || 'Nova Barbearia',
      nomeProprietario: draftData.nomeProprietario || '',
      whatsapp: draftData.whatsapp || '',
      instagram: draftData.instagram || '',
      endereco: draftData.endereco || '',
      slogan: draftData.slogan || '',
      logoUrl: draftData.logoUrl || '',
      capaUrl: draftData.capaUrl || '',
      horarios: draftData.horarios || 'Seg-Sáb: 08:00 - 20:00',
      servicos: draftData.servicos || [
        { name: 'Corte de Cabelo', price: 35, durationMin: 30 },
        { name: 'Barba Completa', price: 25, durationMin: 20 },
        { name: 'Combo Cabelo + Barba', price: 55, durationMin: 45 }
      ],
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
      list.unshift(newDraft);
      localStorage.setItem("cortestime_draft_vitrines", JSON.stringify(list));
    } catch (e) {
      console.error("Error saving draft vitrine to LocalStorage:", e);
    }

    return newDraft;
  },

  async getAllDraftVitrines(): Promise<DraftVitrine[]> {
    let firestoreList: DraftVitrine[] = [];
    try {
      const snap = await getDocs(collection(db, COLL_DRAFT_VITRINES));
      firestoreList = snap.docs.map(docSnap => docSnap.data() as DraftVitrine);
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
            capaUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200&q=80',
            servicos: [
              { name: 'Corte Social / Fade', price: 40, durationMin: 35 },
              { name: 'Barba Alinhada na Toalha Quente', price: 30, durationMin: 25 },
              { name: 'Combo Executivo (Cabelo + Barba)', price: 65, durationMin: 50 }
            ],
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
            usado: false,
            criadoEm: new Date().toISOString(),
            criadoPorAdmin: 'Admin Cortestime'
          },
          {
            id: 'draft_sample_3',
            codigo: 'PREMIUM-019',
            nomeBarbearia: 'Barberia Don Corleone',
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

    // Merge lists by id/codigo, preferring used status if any
    const map = new Map<string, DraftVitrine>();
    for (const item of [...localList, ...firestoreList]) {
      const key = item.codigo ? item.codigo.trim().toUpperCase() : item.id;
      const existing = map.get(key);
      if (!existing || item.usado) {
        map.set(key, item);
      }
    }

    return Array.from(map.values());
  },

  async deleteDraftVitrine(draftId: string, codigo: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLL_DRAFT_VITRINES, draftId));
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
