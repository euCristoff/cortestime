import { db, auth } from "../firebase";
import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  updateDoc,
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
import { Service, Barber, Client, Appointment, MerchantUser, OnboardingData } from "../types";

// Collection Names
const COLL_SERVICES = "services";
const COLL_BARBERS = "barbers";
const COLL_CLIENTS = "clients";
const COLL_APPOINTMENTS = "appointments";

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
  async signUp(email: string, password: string, nomeBarbearia: string, nomeProprietario: string, whatsapp: string): Promise<MerchantUser> {
    const userCredential = await withTimeout(
      createUserWithEmailAndPassword(auth, email, password), 
      30000, 
      "O servidor de cadastro do Firebase demorou muito para responder. Verifique sua conexão com a internet."
    );
    const user = userCredential.user;
    
    // Calculate trial dates: today and 7 days later
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
      email,
      whatsapp,
      plano: 'pro_trial',
      trialInicio,
      trialFim,
      status: 'ativo',
      criadoEm: new Date().toISOString(),
      onboardingCompleted: false
    };
    
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
    if (!email) return null;
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
    const q = query(collection(db, "users"), where("vitrineLinkPersonalizado", "==", slug));
    const snap = await withTimeout(getDocs(q), 15000);
    if (!snap.empty) {
      return snap.docs[0].data() as MerchantUser;
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
  }
};
