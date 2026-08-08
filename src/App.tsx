import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import AuthPage from './components/AuthPage';
import TrialBlockedPage from './components/TrialBlockedPage';
import OnboardingWizard from './components/OnboardingWizard';
import MerchantDashboard from './components/MerchantDashboard';
import ClientBooking from './components/ClientBooking';
import CortesVitrine from './components/CortesVitrine';
import { Service, Barber, Client, Appointment, OnboardingData, MerchantUser } from './types';
import { firebaseService } from './services/firebaseService';
import { notificationService } from './services/notificationService';

function isTrialActive(trialFimStr: string): boolean {
  // Format is DD/MM/YYYY
  const parts = trialFimStr.split('/');
  if (parts.length !== 3) return false;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  
  const expiryDate = new Date(year, month, day, 23, 59, 59, 999);
  const currentDate = new Date();
  
  return currentDate <= expiryDate;
}

function isUserActive(merchant: MerchantUser): boolean {
  if (merchant.plano === 'pro' || merchant.plano === 'vitrine') return true;
  return isTrialActive(merchant.trialFim);
}

function shouldShowDashboard(merchant: MerchantUser | null): boolean {
  if (!merchant) return false;
  return true;
}

export default function App() {
  const [currentMerchant, setCurrentMerchant] = useState<MerchantUser | null>(() => {
    try {
      const saved = localStorage.getItem('cortestime_merchant_session');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [bypassBlocked, setBypassBlocked] = useState(false);

  const [viewMode, setViewMode] = useState<'landing' | 'auth' | 'onboarding' | 'dashboard' | 'clientBooking'>(() => {
    try {
      const saved = localStorage.getItem('cortestime_merchant_session');
      if (saved) {
        const merchant = JSON.parse(saved) as MerchantUser;
        return shouldShowDashboard(merchant) ? 'dashboard' : 'onboarding';
      }
    } catch (e) {}
    return 'landing';
  });

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [firebaseConnected, setFirebaseConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('cortestime_merchant_session');
      return !saved; // No long full-screen spinner if we can mount straight to the dashboard
    } catch (e) {
      return true;
    }
  });

  // Initial registered business info (Onboarding defaults)
  const defaultOnboarding: OnboardingData = {
    fullName: 'Cristoff Cauã',
    cellphone: '(82) 98724-3056',
    email: 'cristoff@gmail.com',
    businessName: 'Cortestime Barber Style',
    objectives: ['Organizar agenda', 'Implementar agendamento online'],
    cep: '57150-000',
    neighborhood: 'Antares',
    street: 'Avenida Menino Marcelo',
    number: '4200',
    complement: 'Salas 3 e 4'
  };

  // Default services list
  const defaultServices: Service[] = [
    { id: 'serv-1', name: 'Corte Social / Degradê', price: 45.00, durationMin: 30, commissionPercent: 50 },
    { id: 'serv-2', name: 'Barba Terapia com Toalha Quente', price: 35.00, durationMin: 30, commissionPercent: 50 },
    { id: 'serv-3', name: 'Cabelo & Barba Completo', price: 75.00, durationMin: 60, commissionPercent: 45 },
    { id: 'serv-4', name: 'Pezinho & Sobrancelha', price: 25.00, durationMin: 15, commissionPercent: 60 },
  ];

  // Default barbers (professionals)
  const defaultBarbers: Barber[] = [
    { id: 'barb-1', name: 'Henrique Souza', avatar: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=200&auto=format&fit=crop&q=60', rating: 4.9, specialty: 'Cortes & Degradê' },
    { id: 'barb-2', name: 'Gustavo Alencar', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=60', rating: 4.8, specialty: 'Barba Terapia' },
    { id: 'barb-3', name: 'Carlos Penna', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=60', rating: 5.0, specialty: 'Cortes Clássicos' },
  ];

  // Default Clients
  const defaultClients: Client[] = [
    { id: 'cli-1', name: 'Lucas de Souza', phone: '(82) 99872-4305', email: 'lucas@gmail.com' },
    { id: 'cli-2', name: 'Roberto Silva', phone: '(82) 99120-1049', email: 'roberto@yahoo.com' },
    { id: 'cli-3', name: 'André Albuquerque', phone: '(82) 98844-0392', email: 'andre.albu@gmail.com' },
  ];

  // Default appointments
  const defaultAppointments: Appointment[] = [
    { id: 'app-1', clientName: 'Roberto Silva', clientPhone: '(82) 99120-1049', serviceId: 'serv-1', barberId: 'barb-1', date: new Date().toISOString().split('T')[0], time: '09:00', status: 'pending' },
    { id: 'app-2', clientName: 'André Albuquerque', clientPhone: '(82) 98844-0392', serviceId: 'serv-2', barberId: 'barb-2', date: new Date().toISOString().split('T')[0], time: '10:00', status: 'pending' },
    { id: 'app-3', clientName: 'Carlos Penna', clientPhone: '(82) 98724-1111', serviceId: 'serv-3', barberId: 'barb-3', date: new Date().toISOString().split('T')[0], time: '11:00', status: 'pending' },
    { id: 'app-completed-1', clientName: 'Douglas Costa', clientPhone: '(82) 99341-2290', serviceId: 'serv-1', barberId: 'barb-1', date: new Date().toISOString().split('T')[0], time: '08:00', status: 'completed' },
    { id: 'app-completed-2', clientName: 'Renato Gaúcho', clientPhone: '(82) 99611-0012', serviceId: 'serv-2', barberId: 'barb-2', date: new Date().toISOString().split('T')[0], time: '08:30', status: 'completed' },
  ];

  const [services, setServices] = useState<Service[]>(defaultServices);
  const [barbers, setBarbers] = useState<Barber[]>(defaultBarbers);
  const [clients, setClients] = useState<Client[]>(defaultClients);
  const [appointments, setAppointments] = useState<Appointment[]>(defaultAppointments);
  const [dashboardTab, setDashboardTab] = useState<'inicio' | 'agenda' | 'notificacoes' | 'menu'>('inicio');

  const [publicVitrineMerchant, setPublicVitrineMerchant] = useState<MerchantUser | null>(null);
  const [publicVitrineServices, setPublicVitrineServices] = useState<Service[]>([]);
  const [isPublicVitrineLoading, setIsPublicVitrineLoading] = useState(false);

  // Set default document title on mount
  useEffect(() => {
    document.title = "Cortestime — Agendamento para Barbearias";
  }, []);

  // Check for public vitrine slug on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('v') || params.get('vitrine');
    if (slug) {
      setIsPublicVitrineLoading(true);
      firebaseService.getMerchantBySlug(slug).then(async (m) => {
        if (m) {
          setPublicVitrineMerchant(m);
          const vitrineTitle = `${m.vitrineLogo || m.nomeBarbearia} — Vitrine & Agendamento | Cortestime`;
          document.title = vitrineTitle;

          // Update OG meta tags dynamically for client
          const ogTitle = document.querySelector('meta[property="og:title"]');
          if (ogTitle) ogTitle.setAttribute('content', vitrineTitle);
          const ogDesc = document.querySelector('meta[property="og:description"]');
          if (ogDesc) ogDesc.setAttribute('content', m.vitrineSlogan || `Agende seu horário na ${m.nomeBarbearia} pelo Cortestime.`);
          if (m.vitrineLogoImage || m.vitrineCapa) {
            const ogImg = document.querySelector('meta[property="og:image"]');
            if (ogImg) ogImg.setAttribute('content', m.vitrineLogoImage || m.vitrineCapa || '');
          }

          try {
            const fetchedServices = await firebaseService.getServices(m.uid);
            setPublicVitrineServices(fetchedServices.length > 0 ? fetchedServices : defaultServices);
            
            const fetchedBarbers = await firebaseService.getBarbers(m.uid);
            if (fetchedBarbers.length > 0) {
              setBarbers(fetchedBarbers);
            }
          } catch (e) {
            console.error("Error loading services for public vitrine:", e);
            setPublicVitrineServices(defaultServices);
          }
        } else {
          alert('Barbearia / Vitrine não encontrada.');
          // Clear query parameters
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }).catch((err) => {
        console.error("Error fetching merchant by slug:", err);
      }).finally(() => {
        setIsPublicVitrineLoading(false);
      });
    }
  }, []);

  // Check for Mercado Pago payment callbacks on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment_status');
    const merchantUid = params.get('uid');
    
    if (paymentStatus === 'success' && merchantUid) {
      firebaseService.updateMerchantProfile(merchantUid, { plano: 'pro' })
        .then(() => {
          if (currentMerchant && currentMerchant.uid === merchantUid) {
            const updated = { ...currentMerchant, plano: 'pro' as const };
            setCurrentMerchant(updated);
            localStorage.setItem('cortestime_merchant_session', JSON.stringify(updated));
            setViewMode('dashboard');
          }
          alert('Parabéns! Sua assinatura do plano Cortestime Pro foi ativada com sucesso!');
        })
        .catch(err => {
          console.error('Erro ao atualizar plano após pagamento:', err);
        })
        .finally(() => {
          // Clean up url parameters
          window.history.replaceState({}, document.title, window.location.pathname);
        });
    }
  }, [currentMerchant]);


  // Compute OnboardingData dynamically based on current logged in Merchant
  const onboardingData: OnboardingData = currentMerchant ? {
    fullName: currentMerchant.nomeProprietario,
    cellphone: currentMerchant.whatsapp,
    email: currentMerchant.email,
    businessName: currentMerchant.nomeBarbearia,
    objectives: ['Organizar agenda'],
    cep: '57150-000',
    neighborhood: 'Centro',
    street: 'Rua Principal',
    number: '123',
    complement: ''
  } : defaultOnboarding;

  // Listen to Auth State Changes (with LocalStorage session persistence)
  useEffect(() => {
    // Process pending Google Redirect result first at the top level
    firebaseService.handleRedirectResult().then(async (redirectResult) => {
      if (redirectResult) {
        console.log("Google redirect result processed at root:", redirectResult);
        let m: MerchantUser;
        if (redirectResult.merchant) {
          m = { ...redirectResult.merchant, onboardingCompleted: true };
        } else {
          // Auto-create or repair profile for Google user
          const today = new Date();
          const formatDate = (d: Date) => {
            const dd = String(d.getDate()).padStart(2, '0');
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const yyyy = d.getFullYear();
            return `${dd}/${mm}/${yyyy}`;
          };
          const expiry = new Date();
          expiry.setDate(today.getDate() + 7);

          m = {
            uid: redirectResult.user.uid,
            nomeBarbearia: redirectResult.user.displayName ? `Barbearia de ${redirectResult.user.displayName}` : 'Minha Barbearia',
            nomeProprietario: redirectResult.user.displayName || redirectResult.user.email?.split('@')[0] || 'Proprietário',
            email: redirectResult.user.email || '',
            whatsapp: '',
            plano: 'pro_trial',
            trialInicio: formatDate(today),
            trialFim: formatDate(expiry),
            status: 'ativo',
            criadoEm: new Date().toISOString(),
            onboardingCompleted: true
          };

          try {
            await firebaseService.saveMerchantProfile(m);
          } catch (e) {
            console.warn("Error saving redirect merchant profile:", e);
          }
        }
        setCurrentMerchant(m);
        localStorage.setItem('cortestime_merchant_session', JSON.stringify(m));
        setIsLoading(false);
        setViewMode('dashboard');
      }
    }).catch(err => {
      console.warn("handleRedirectResult error in App startup:", err);
    });

    const unsubscribe = firebaseService.onAuthChanged((fbUser) => {
      try {
        if (fbUser) {
          setFirebaseConnected(true);
          setIsLoading(false);

          // 1. Immediately resolve session or construct optimistic profile
          const cachedSession = localStorage.getItem('cortestime_merchant_session');
          let currentSessionMerchant: MerchantUser | null = null;
          if (cachedSession) {
            try {
              const parsed = JSON.parse(cachedSession) as MerchantUser;
              if (parsed.uid === fbUser.uid) {
                currentSessionMerchant = { ...parsed, onboardingCompleted: true };
              }
            } catch (e) {}
          }

          if (!currentSessionMerchant) {
            const today = new Date();
            const formatDate = (d: Date) => {
              const dd = String(d.getDate()).padStart(2, '0');
              const mm = String(d.getMonth() + 1).padStart(2, '0');
              const yyyy = d.getFullYear();
              return `${dd}/${mm}/${yyyy}`;
            };
            const expiry = new Date();
            expiry.setDate(today.getDate() + 7);

            currentSessionMerchant = {
              uid: fbUser.uid,
              nomeBarbearia: fbUser.displayName ? `Barbearia de ${fbUser.displayName}` : 'Minha Barbearia',
              nomeProprietario: fbUser.displayName || fbUser.email?.split('@')[0] || 'Proprietário',
              email: fbUser.email || '',
              whatsapp: '',
              plano: 'pro_trial',
              trialInicio: formatDate(today),
              trialFim: formatDate(expiry),
              status: 'ativo',
              criadoEm: new Date().toISOString(),
              onboardingCompleted: true
            };
          }

          // Instantly transition user to dashboard
          setCurrentMerchant(currentSessionMerchant);
          localStorage.setItem('cortestime_merchant_session', JSON.stringify(currentSessionMerchant));
          setViewMode(prev => (prev === 'landing' || prev === 'auth' || prev === 'onboarding') ? 'dashboard' : prev);

          // 2. Asynchronously sync/fetch Firestore data in background without blocking UI
          firebaseService.getMerchant(fbUser.uid).then(async (freshMerchant) => {
            let merchant = freshMerchant;
            if (!merchant && fbUser.email) {
              merchant = await firebaseService.getMerchantByEmail(fbUser.email);
            }
            if (merchant) {
              const updated = { ...merchant, uid: fbUser.uid, onboardingCompleted: true };
              setCurrentMerchant(updated);
              localStorage.setItem('cortestime_merchant_session', JSON.stringify(updated));
            } else if (currentSessionMerchant) {
              firebaseService.saveMerchantProfile(currentSessionMerchant).catch(() => {});
            }
          }).catch(err => {
            console.warn("Background merchant sync failed, using local session:", err);
          });
        } else {
          // fbUser is null. Check if we have a persistent fallback session
          const saved = localStorage.getItem('cortestime_merchant_session');
          if (saved) {
            try {
              const merchant = JSON.parse(saved) as MerchantUser;
              setCurrentMerchant(merchant);
              setFirebaseConnected(true);
              setIsLoading(false);
              setViewMode(prev => (prev === 'landing' || prev === 'auth' || prev === 'onboarding') ? 'dashboard' : prev);
            } catch (e) {
              setCurrentMerchant(null);
              setIsLoading(false);
            }
          } else {
            setCurrentMerchant(null);
            setIsLoading(false);
            // Fallback to static defaults when logged out (so the client booking doesn't crash)
            setServices(defaultServices);
            setBarbers(defaultBarbers);
            setClients(defaultClients);
            setAppointments(defaultAppointments);
            setFirebaseConnected(true);
          }
        }
      } catch (err) {
        console.error("Auth listener error:", err);
        setFirebaseConnected(false);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Safety timeout to prevent getting stuck on the loading spinner if Firebase is slow/offline
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        console.warn("Loading safety timeout triggered - taking too long to connect to Firebase.");
        setIsLoading(false);
        // Fallback: search for local merchant session and load it instantly in offline/cached mode
        const cachedSession = localStorage.getItem('cortestime_merchant_session');
        if (cachedSession) {
          try {
            const cachedMerchant = JSON.parse(cachedSession) as MerchantUser;
            setCurrentMerchant(cachedMerchant);
            setFirebaseConnected(false); // Flagged as offline/cache-fallback
            if (isUserActive(cachedMerchant)) {
              setViewMode(cachedMerchant.onboardingCompleted ? 'dashboard' : 'onboarding');
            } else if (cachedMerchant.plano === 'pro_trial') {
              setViewMode('dashboard');
            }
          } catch (e) {}
        }
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Auto-downgrade plan on trial expiration or subscription expiration/cancellation
  useEffect(() => {
    if (!currentMerchant) return;

    const isTrialExpired = (currentMerchant.plano === 'pro_trial' || currentMerchant.plano === 'trial') && 
      !isTrialActive(currentMerchant.trialFim);

    const isSubscriptionExpired = currentMerchant.plano === 'pro' && 
      (currentMerchant.status === 'expirado' || currentMerchant.status === 'suspenso');

    if (isTrialExpired || isSubscriptionExpired) {
      const reason = isTrialExpired ? 'trial_expired' : 'subscription_expired';
      
      console.log(`Auto-downgrading merchant ${currentMerchant.uid} to vitrine due to: ${reason}`);
      
      // Update plan immediately in Firestore
      firebaseService.updateMerchantProfile(currentMerchant.uid, {
        plano: 'vitrine',
        status: 'ativo'
      }).then(() => {
        const updated: MerchantUser = { 
          ...currentMerchant, 
          plano: 'vitrine', 
          status: 'ativo' 
        };
        setCurrentMerchant(updated);
        localStorage.setItem('cortestime_merchant_session', JSON.stringify(updated));
        localStorage.setItem('cortestime_downgrade_notice', reason);
        setViewMode('dashboard');
      }).catch(err => {
        console.error("Error auto-downgrading merchant plan:", err);
      });
    }
  }, [currentMerchant]);

  // Load cached lists from localStorage instantly to bypass Firestore network lag
  useEffect(() => {
    if (!currentMerchant) {
      setServices(defaultServices);
      setBarbers(defaultBarbers);
      setClients(defaultClients);
      setAppointments(defaultAppointments);
      return;
    }

    const uid = currentMerchant.uid;
    try {
      const cachedServices = localStorage.getItem(`cortestime_services_${uid}`);
      const cachedBarbers = localStorage.getItem(`cortestime_barbers_${uid}`);
      const cachedClients = localStorage.getItem(`cortestime_clients_${uid}`);
      const cachedAppointments = localStorage.getItem(`cortestime_appointments_${uid}`);

      if (cachedServices) setServices(JSON.parse(cachedServices));
      if (cachedBarbers) setBarbers(JSON.parse(cachedBarbers));
      if (cachedClients) setClients(JSON.parse(cachedClients));
      if (cachedAppointments) setAppointments(JSON.parse(cachedAppointments));
    } catch (e) {
      console.error("Error loading cached lists:", e);
    }
  }, [currentMerchant]);

  // Fetch and load merchant data from Firestore in the background
  useEffect(() => {
    if (!currentMerchant) return;
    
    let isMounted = true;
    const loadMerchantData = async () => {
      try {
        if (currentMerchant.onboardingCompleted) {
          const [fbServices, fbBarbers, fbClients, fbAppointments] = await Promise.all([
            firebaseService.getServices(currentMerchant.uid),
            firebaseService.getBarbers(currentMerchant.uid),
            firebaseService.getClients(currentMerchant.uid),
            firebaseService.getAppointments(currentMerchant.uid)
          ]);

          if (isMounted) {
            const uid = currentMerchant.uid;
            
            if (fbServices.length > 0) {
              setServices(fbServices);
              localStorage.setItem(`cortestime_services_${uid}`, JSON.stringify(fbServices));
            }
            if (fbBarbers.length > 0) {
              setBarbers(fbBarbers);
              localStorage.setItem(`cortestime_barbers_${uid}`, JSON.stringify(fbBarbers));
            }
            
            setClients(fbClients);
            localStorage.setItem(`cortestime_clients_${uid}`, JSON.stringify(fbClients));
            
            setAppointments(fbAppointments);
            localStorage.setItem(`cortestime_appointments_${uid}`, JSON.stringify(fbAppointments));
            
            setFirebaseConnected(true);
          }
        } else {
          // Keep clean/empty for new users who are about to start onboarding
          setServices([]);
          setBarbers([]);
          setClients([]);
          setAppointments([]);
        }
      } catch (err) {
        console.error("Error loading merchant data in background:", err);
      }
    };

    loadMerchantData();
    return () => {
      isMounted = false;
    };
  }, [currentMerchant]);

  // Automated background notifications scanning
  useEffect(() => {
    if (notificationService.isSupported() && notificationService.getPermissionStatus() === 'granted') {
      notificationService.registerServiceWorker();
    }

    // Run initially
    notificationService.scanAndNotify(appointments, services);

    // Run every 30 seconds
    const interval = setInterval(() => {
      notificationService.scanAndNotify(appointments, services);
    }, 30000);

    return () => clearInterval(interval);
  }, [appointments, services]);

  // Action methods to mutate state and push to Firestore
  const handleAddService = async (newService: Omit<Service, 'id'>) => {
    const id = `serv-${Date.now()}`;
    const item: Service = { id, ...newService };
    setServices(prev => [...prev, item]);
    if (firebaseConnected && currentMerchant) {
      await firebaseService.saveService(item, currentMerchant.uid);
    }
  };

  const handleAddBarber = async (newBarber: Omit<Barber, 'id' | 'rating'>) => {
    const id = `barb-${Date.now()}`;
    const item: Barber = { id, rating: 4.9, ...newBarber };
    setBarbers(prev => [...prev, item]);
    if (firebaseConnected && currentMerchant) {
      await firebaseService.saveBarber(item, currentMerchant.uid);
    }
  };

  const handleUpdateBarber = async (updatedBarber: Barber) => {
    setBarbers(prev => prev.map(b => b.id === updatedBarber.id ? updatedBarber : b));
    if (firebaseConnected && currentMerchant) {
      await firebaseService.saveBarber(updatedBarber, currentMerchant.uid);
    }
  };

  const handleDeleteBarber = async (barberId: string) => {
    setBarbers(prev => prev.filter(b => b.id !== barberId));
    if (firebaseConnected && currentMerchant) {
      await firebaseService.deleteBarber(barberId);
    }
  };

  const handleAddClient = async (newClient: Omit<Client, 'id'>) => {
    const id = `cli-${Date.now()}`;
    const item: Client = { id, ...newClient };
    setClients(prev => [...prev, item]);
    if (firebaseConnected && currentMerchant) {
      await firebaseService.saveClient(item, currentMerchant.uid);
    }
  };

  const handleAddAppointment = async (newApp: Omit<Appointment, 'id' | 'status'>) => {
    const id = `app-${Date.now()}`;
    const item: Appointment = { id, status: 'pending', ...newApp };
    setAppointments(prev => [item, ...prev]);
    if (firebaseConnected && currentMerchant) {
      await firebaseService.saveAppointment(item, currentMerchant.uid);
    }
  };

  const handleUpdateAppointmentStatus = async (id: string, status: Appointment['status']) => {
    setAppointments(prev => prev.map(app => 
      app.id === id ? { ...app, status } : app
    ));
    if (firebaseConnected) {
      await firebaseService.updateAppointmentStatus(id, status);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await firebaseService.signOut();
    } catch (e) {
      console.error("Logout error:", e);
    }
    localStorage.removeItem('cortestime_merchant_session');
    setCurrentMerchant(null);
    setBypassBlocked(false);
    setViewMode('landing');
    setIsLoading(false);
  };

  const handleAuthSuccess = (merchant: MerchantUser) => {
    const updatedMerchant = { ...merchant, onboardingCompleted: true };
    setCurrentMerchant(updatedMerchant);
    setBypassBlocked(false);
    localStorage.setItem('cortestime_merchant_session', JSON.stringify(updatedMerchant));
    setIsLoading(false);
    setViewMode('dashboard');
  };

  const isExpired = currentMerchant && (currentMerchant.plano === 'pro_trial' || currentMerchant.plano === 'trial') 
    ? !isTrialActive(currentMerchant.trialFim) 
    : false;

  if (isPublicVitrineLoading) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 rounded-full border-4 border-[#051b42]/25 border-t-[#051b42] animate-spin mb-3"></div>
        <p className="font-sans font-medium text-[#051b42] text-sm">Carregando Vitrine Digital...</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-full border-4 border-brand-blue/20 border-t-brand-blue animate-spin mb-4"></div>
        <p className="font-sans font-medium text-[#051b42]">Iniciando Cortestime...</p>
        <p className="font-mono text-xs text-gray-400 mt-2">Conectando ao Firebase Firestore...</p>
      </div>
    );
  }

  const handleUpdatePlan = async (newPlan: 'vitrine' | 'pro') => {
    if (!currentMerchant) return;
    setIsLoading(true);
    try {
      await firebaseService.updateMerchantProfile(currentMerchant.uid, { plano: newPlan });
      const updated = { ...currentMerchant, plano: newPlan };
      setCurrentMerchant(updated);
      localStorage.setItem('cortestime_merchant_session', JSON.stringify(updated));
    } catch (e) {
      console.error("Error updating plan:", e);
      alert("Houve um erro ao atualizar o plano. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtendTrial = async () => {
    if (!currentMerchant) return;
    setIsLoading(true);
    try {
      const today = new Date();
      const expiry = new Date();
      expiry.setDate(today.getDate() + 15); // +15 days
      const formatDate = (date: Date) => {
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yyyy = date.getFullYear();
        return `${dd}/${mm}/${yyyy}`;
      };
      const newTrialFim = formatDate(expiry);
      
      await firebaseService.updateMerchantProfile(currentMerchant.uid, { 
        trialFim: newTrialFim,
        plano: 'pro_trial'
      });
      
      const updated = { ...currentMerchant, trialFim: newTrialFim, plano: 'pro_trial' as const };
      setCurrentMerchant(updated);
      localStorage.setItem('cortestime_merchant_session', JSON.stringify(updated));
      setViewMode('dashboard');
      alert("Seu período de teste grátis foi estendido com sucesso por mais 15 dias! Aproveite para testar a agenda e os envios de notificações.");
    } catch (e) {
      console.error("Error extending trial:", e);
      alert("Houve um erro ao estender o período de teste. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // Active Block for Trial Expiration
  if (currentMerchant && isExpired && !bypassBlocked) {
    return (
      <TrialBlockedPage 
        merchant={currentMerchant} 
        onLogout={handleLogout} 
        onUpdatePlan={handleUpdatePlan} 
        onBypass={() => setBypassBlocked(true)}
      />
    );
  }

  return (
    <div className="min-h-screen">
      {viewMode === 'landing' && (
        <LandingPage 
          onStartTrial={() => {
            if (currentMerchant) {
              setViewMode(currentMerchant.onboardingCompleted ? 'dashboard' : 'onboarding');
            } else {
              setAuthMode('signup');
              setViewMode('auth');
            }
          }}
          onLogin={() => {
            if (currentMerchant) {
              setViewMode(currentMerchant.onboardingCompleted ? 'dashboard' : 'onboarding');
            } else {
              setAuthMode('login');
              setViewMode('auth');
            }
          }}
          currentMerchant={currentMerchant}
          firebaseConnected={firebaseConnected}
        />
      )}

      {viewMode === 'auth' && (
        <AuthPage 
          onAuthSuccess={handleAuthSuccess}
          onBackToLanding={() => setViewMode('landing')}
          initialMode={authMode}
        />
      )}

      {viewMode === 'onboarding' && (
        <OnboardingWizard 
          initialData={currentMerchant ? {
            fullName: currentMerchant.nomeProprietario,
            cellphone: currentMerchant.whatsapp,
            email: currentMerchant.email,
            businessName: currentMerchant.nomeBarbearia
          } : undefined}
          onComplete={async (data) => {
            if (currentMerchant) {
              try {
                setIsLoading(true);
                // 1. Salva o status de onboarding concluído no Firestore
                await firebaseService.completeOnboarding(currentMerchant.uid, data);
                
                // 2. Busca o perfil atualizado do barbeiro
                const updatedMerchant = await firebaseService.getMerchant(currentMerchant.uid);
                if (updatedMerchant) {
                  setCurrentMerchant(updatedMerchant);
                  localStorage.setItem('cortestime_merchant_session', JSON.stringify(updatedMerchant));
                }

                // 3. Fornece apenas serviços e barbeiros modelo, mantendo clientes e agendamentos zerados
                if (firebaseConnected) {
                  const existingServices = await firebaseService.getServices(currentMerchant.uid);
                  if (existingServices.length === 0) {
                    for (const s of defaultServices) {
                      await firebaseService.saveService(s, currentMerchant.uid);
                    }
                    setServices(defaultServices);
                  } else {
                    setServices(existingServices);
                  }
                  
                  const existingBarbers = await firebaseService.getBarbers(currentMerchant.uid);
                  if (existingBarbers.length === 0) {
                    for (const b of defaultBarbers) {
                      await firebaseService.saveBarber(b, currentMerchant.uid);
                    }
                    setBarbers(defaultBarbers);
                  } else {
                    setBarbers(existingBarbers);
                  }

                  // Garante que a lista de clientes e de agendamentos fictícios esteja vazia para o usuário novo
                  setClients([]);
                  setAppointments([]);
                }

                setDashboardTab('agenda');
                setViewMode('dashboard');
              } catch (e) {
                console.error("Erro ao salvar onboarding:", e);
                alert("Houve um erro ao salvar o onboarding. Por favor, tente novamente.");
              } finally {
                setIsLoading(false);
              }
            } else {
              setDashboardTab('agenda');
              setViewMode('dashboard');
            }
          }}
          onBackToLanding={() => {
            handleLogout();
          }}
        />
      )}

      {publicVitrineMerchant ? (
        viewMode === 'clientBooking' ? (
          <ClientBooking 
            businessName={publicVitrineMerchant.nomeBarbearia}
            businessLogo={publicVitrineMerchant.vitrineLogoImage}
            services={publicVitrineServices}
            barbers={barbers}
            onBookAppointment={async (app) => {
              // Save booking to public merchant's appointments
              try {
                const id = `app-${Date.now()}`;
                const item: Appointment = { id, status: 'pending', ...app };
                await firebaseService.saveAppointment(item, publicVitrineMerchant.uid);
              } catch (e) {
                console.error("Error booking public app:", e);
              }
            }}
            onClose={() => setViewMode('landing')}
          />
        ) : (
          <CortesVitrine 
            merchant={publicVitrineMerchant}
            services={publicVitrineServices}
            barbers={barbers}
            isOnlyView={true}
            isPublicAccess={true}
            onBack={() => {
              setPublicVitrineMerchant(null);
              // Clean search parameters
              window.history.replaceState({}, document.title, window.location.pathname);
              setViewMode('landing');
            }}
            onBookOnline={() => {
              setViewMode('clientBooking');
            }}
          />
        )
      ) : (
        <>
          {viewMode === 'clientBooking' && (
            <ClientBooking 
              businessName={currentMerchant?.nomeBarbearia || onboardingData.businessName}
              businessLogo={currentMerchant?.vitrineLogoImage}
              services={services}
              barbers={barbers}
              onBookAppointment={handleAddAppointment}
              onClose={() => setViewMode(currentMerchant ? 'dashboard' : 'landing')}
            />
          )}

          {viewMode === 'dashboard' && (
            <MerchantDashboard 
              onboardingData={onboardingData}
              merchant={currentMerchant}
              services={services}
              barbers={barbers}
              clients={clients}
              appointments={appointments}
              onAddService={handleAddService}
              onAddBarber={handleAddBarber}
              onUpdateBarber={handleUpdateBarber}
              onDeleteBarber={handleDeleteBarber}
              onAddClient={handleAddClient}
              onAddAppointment={handleAddAppointment}
              onUpdateAppointmentStatus={handleUpdateAppointmentStatus}
              onLogout={handleLogout}
              firebaseConnected={firebaseConnected}
              onOpenClientBooking={() => setViewMode('clientBooking')}
              onUpdateMerchant={(updated) => {
                setCurrentMerchant(updated);
                localStorage.setItem('cortestime_merchant_session', JSON.stringify(updated));
              }}
              initialTab={dashboardTab}
            />
          )}
        </>
      )}
    </div>
  );
}

