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
import { Service, Barber, Client, Appointment, MerchantUser, OnboardingData, DraftVitrine } from "../types";

// Collection Names
const COLL_SERVICES = "services";
const COLL_BARBERS = "barbers";
const COLL_CLIENTS = "clients";
const COLL_APPOINTMENTS = "appointments";
const COLL_DRAFT_VITRINES = "draft_vitrines";

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
    inviteCode?: string
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
    
    const expiry7Days = new Date();
    expiry7Days.setDate(today.getDate() + 7);
    const trialFim = formatDate(expiry7Days);

    const expiry30Days = new Date();
    expiry30Days.setDate(today.getDate() + 30);
    const partnerBenefitsExpiry = formatDate(expiry30Days);
    
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

  async saveGoogleMerchantProfile(user: FirebaseUser, nomeBarbearia: string, nomeProprietario: string, whatsapp: string): Promise<MerchantUser> {
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
      onboardingCompleted: false
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
    const cleanSlug = (slug || '').toLowerCase().trim();
    if (!cleanSlug) return null;

    try {
      // 1. Check by exact vitrineLinkPersonalizado field
      const q = query(collection(db, "users"), where("vitrineLinkPersonalizado", "==", cleanSlug));
      const snap = await withTimeout(getDocs(q), 10000);
      if (!snap.empty) {
        return snap.docs[0].data() as MerchantUser;
      }

      // 2. Fallback: Search all users in Firestore matching normalized nomeBarbearia or uid
      const qAll = query(collection(db, "users"));
      const snapAll = await withTimeout(getDocs(qAll), 10000);
      if (!snapAll.empty) {
        for (const docSnap of snapAll.docs) {
          const data = docSnap.data() as MerchantUser;
          const normName = (data.nomeBarbearia || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9]/g, '-');
          if (normName === cleanSlug || data.uid === cleanSlug) {
            return data;
          }
        }
      }
    } catch (err) {
      console.warn("Error looking up merchant by slug in Firestore:", err);
    }

    // 3. Fallback: Check local storage for merchant profile/session
    try {
      const cached = localStorage.getItem("cortestime_merchant_session") || localStorage.getItem("cortestime_merchant_profile");
      if (cached) {
        const parsed = JSON.parse(cached) as MerchantUser;
        const normName = (parsed.nomeBarbearia || '')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-zA-Z0-9]/g, '-');
        if (parsed.vitrineLinkPersonalizado === cleanSlug || normName === cleanSlug || parsed.uid === cleanSlug || cleanSlug === 'sua-barbearia' || cleanSlug === 'barbearia') {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Error reading cached merchant for slug lookup:", e);
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

  async updateAppointmentStatus(id: string, status: Appointment['status']): Promise<void> {
    const docRef = doc(db, COLL_APPOINTMENTS, id);
    await withTimeout(
      updateDoc(docRef, { status }),
      15000,
      "Tempo limite excedido ao atualizar status do agendamento."
    );
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
  }
};
