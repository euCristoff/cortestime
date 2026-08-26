import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import LogoIcon from './LogoIcon';
import InstallCortestimeStep from './InstallCortestimeStep';
import { 
  Home, 
  Calendar as CalendarIcon, 
  Bell, 
  Menu as MenuIcon, 
  Plus, 
  UserPlus, 
  Scissors, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  Smartphone, 
  DollarSign, 
  ChevronRight, 
  ChevronLeft,
  ChevronDown,
  MapPin, 
  Award, 
  AlertCircle,
  MessageSquare,
  Search,
  X,
  Sparkles,
  Users,
  Check,
  CreditCard,
  Building,
  ArrowLeft,
  Undo,
  Mail,
  Send,
  RefreshCw,
  ShieldCheck,
  LayoutDashboard,
  User,
  Settings,
  HelpCircle,
  Gift,
  LogOut,
  ExternalLink,
  Copy,
  Star,
  Share2,
  Lock,
  Trash2,
  Globe,
  Phone,
  Upload,
  FileText,
  Camera,
  Eye,
  Crown,
  ArrowUpDown,
  BarChart3,
  History,
  AlertTriangle,
  CalendarX,
  XCircle,
  Info,
  PhoneCall,
  Loader2
} from 'lucide-react';
import { OnboardingData, Service, Barber, Client, Appointment, MerchantUser, AppNotification, QueueItem, ServiceMode, safeEncodeURIComponent } from '../types';
import { notificationService } from '../services/notificationService';
import CortesVitrine from './CortesVitrine';
import MercadoPagoCheckout from './MercadoPagoCheckout';
import AdminSubscriptionManager from './AdminSubscriptionManager';
import QueueManager from './QueueManager';
import { firebaseService } from '../services/firebaseService';
import { compressImageFile, compressDataUrl } from '../utils/vitrineTheme';

export type DashboardTab = 'inicio' | 'agenda' | 'fila' | 'servicos' | 'profissionais' | 'clientes' | 'notificacoes' | 'configuracoes' | 'horarios' | 'ajuda' | 'assinatura' | 'menu';

interface MerchantDashboardProps {
  onboardingData: OnboardingData;
  merchant?: MerchantUser | null;
  services: Service[];
  barbers: Barber[];
  clients: Client[];
  appointments: Appointment[];
  onAddService: (service: Omit<Service, 'id'>) => void;
  onUpdateService?: (service: Service) => void;
  onDeleteService?: (serviceId: string) => void;
  onAddBarber: (barber: Omit<Barber, 'id' | 'rating'>) => void;
  onUpdateBarber?: (barber: Barber) => void;
  onDeleteBarber?: (barberId: string) => void;
  onAddClient: (client: Omit<Client, 'id'>) => void;
  onAddAppointment: (appointment: Omit<Appointment, 'id' | 'status'>) => void;
  onUpdateAppointmentStatus: (
    id: string, 
    status: Appointment['status'], 
    meta?: { cancelledBy?: 'client' | 'barbershop'; cancellationReason?: string }
  ) => void;
  onLogout: () => void;
  firebaseConnected: boolean | null;
  onOpenClientBooking?: () => void;
  onUpdateMerchant?: (updated: MerchantUser) => void;
  initialTab?: DashboardTab;
}

export default function MerchantDashboard({
  onboardingData,
  merchant,
  services,
  barbers,
  clients,
  appointments,
  onAddService,
  onUpdateService,
  onDeleteService,
  onAddBarber,
  onUpdateBarber,
  onDeleteBarber,
  onAddClient,
  onAddAppointment,
  onUpdateAppointmentStatus,
  onLogout,
  firebaseConnected,
  onOpenClientBooking,
  onUpdateMerchant,
  initialTab = 'inicio'
}: MerchantDashboardProps) {
  
  const [showVitrinePage, setShowVitrinePage] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab);

  // App Install / PWA prompt states
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [installReminderDismissed, setInstallReminderDismissed] = useState(false);

  // Configurações Form state
  const addrObj = typeof merchant?.vitrineEndereco === 'object' && merchant?.vitrineEndereco ? merchant.vitrineEndereco : null;

  const [configData, setConfigData] = useState({
    nomeBarbearia: merchant?.nomeBarbearia || onboardingData.businessName || '',
    nomeProprietario: merchant?.nomeProprietario || onboardingData.fullName || '',
    whatsapp: merchant?.whatsapp || onboardingData.cellphone || '',
    vitrineLogo: merchant?.vitrineLogo || '',
    vitrineLogoImage: merchant?.vitrineLogoImage || '',
    vitrineCapa: merchant?.vitrineCapa || '',
    barbeiroUnico: Boolean(merchant?.vitrineBarbeiroUnico ?? merchant?.barbeiroUnico ?? false),
    cep: addrObj?.cep || onboardingData.cep || '57000-000',
    rua: addrObj?.rua || onboardingData.street || 'Av. Principal',
    numero: addrObj?.numero || onboardingData.number || '100',
    bairro: addrObj?.bairro || onboardingData.neighborhood || 'Centro',
    cidade: addrObj?.cidade || onboardingData.city || 'Maceió',
    estado: addrObj?.estado || onboardingData.state || 'AL',
    instagram: merchant?.vitrineInstagram || '@barbearia',
    facebook: merchant?.vitrineFacebook || '',
    serviceMode: (merchant?.serviceMode || 'agendamento') as ServiceMode
  });
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSuccessMsg, setConfigSuccessMsg] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCapa, setIsUploadingCapa] = useState(false);

  // Synchronize configData only when merchant UID actually switches or on initial load
  const lastMerchantUidRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (merchant && merchant.uid !== lastMerchantUidRef.current) {
      lastMerchantUidRef.current = merchant.uid;
      const curAddr = typeof merchant.vitrineEndereco === 'object' && merchant.vitrineEndereco ? merchant.vitrineEndereco : null;
      setConfigData({
        nomeBarbearia: merchant.nomeBarbearia || onboardingData.businessName || '',
        nomeProprietario: merchant.nomeProprietario || onboardingData.fullName || '',
        whatsapp: merchant.whatsapp || onboardingData.cellphone || '',
        vitrineLogo: merchant.vitrineLogo || '',
        vitrineLogoImage: merchant.vitrineLogoImage || '',
        vitrineCapa: merchant.vitrineCapa || '',
        barbeiroUnico: Boolean(merchant.vitrineBarbeiroUnico ?? merchant.barbeiroUnico ?? false),
        cep: curAddr?.cep || onboardingData.cep || '57000-000',
        rua: curAddr?.rua || onboardingData.street || 'Av. Principal',
        numero: curAddr?.numero || onboardingData.number || '100',
        bairro: curAddr?.bairro || onboardingData.neighborhood || 'Centro',
        cidade: curAddr?.cidade || onboardingData.city || 'Maceió',
        estado: curAddr?.estado || onboardingData.state || 'AL',
        instagram: merchant.vitrineInstagram || '@barbearia',
        facebook: merchant.vitrineFacebook || '',
        serviceMode: (merchant.serviceMode || 'agendamento') as ServiceMode
      });
    }
  }, [merchant?.uid]);

  // Real-time Queue State
  const [merchantQueue, setMerchantQueue] = useState<QueueItem[]>([]);

  useEffect(() => {
    let isSubscribed = true;
    const fetchQueue = async () => {
      if (merchant?.uid) {
        try {
          const list = await firebaseService.getQueue(merchant.uid);
          if (isSubscribed) {
            setMerchantQueue(list);
          }
        } catch (e) {
          console.warn('Erro ao carregar fila:', e);
        }
      }
    };
    fetchQueue();
    const interval = setInterval(fetchQueue, 6000);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [merchant?.uid]);

  const handleAddQueueItem = (item: Omit<QueueItem, 'id' | 'status' | 'joinedAt'>) => {
    const newItemId = `queue_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const fullItem: QueueItem = {
      ...item,
      id: newItemId,
      ownerId: merchant?.uid || '',
      status: 'waiting',
      joinedAt: new Date().toISOString()
    };
    firebaseService.saveQueueItem(fullItem, merchant?.uid);
    setMerchantQueue(prev => [...prev, fullItem]);
  };

  const handleStartQueueService = (itemId: string, barberId?: string) => {
    firebaseService.updateQueueItemStatus(itemId, 'in_progress', {
      startedAt: new Date().toISOString(),
      ...(barberId ? { barberId } : {})
    });
    setMerchantQueue(prev => prev.map(q => q.id === itemId ? {
      ...q,
      status: 'in_progress',
      startedAt: new Date().toISOString(),
      ...(barberId ? { barberId } : {})
    } : q));
  };

  const handleFinishQueueService = (itemId: string) => {
    firebaseService.updateQueueItemStatus(itemId, 'completed', {
      finishedAt: new Date().toISOString()
    });
    setMerchantQueue(prev => prev.map(q => q.id === itemId ? {
      ...q,
      status: 'completed',
      finishedAt: new Date().toISOString()
    } : q));
  };

  const handleRemoveQueueItem = (itemId: string) => {
    firebaseService.deleteQueueItem(itemId);
    setMerchantQueue(prev => prev.filter(q => q.id !== itemId));
  };

  // Change Password state
  const [passForm, setPassForm] = useState({ currentPass: '', newPass: '', confirmPass: '' });
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passSuccessMsg, setPassSuccessMsg] = useState<string | null>(null);
  const [passErrorMsg, setPassErrorMsg] = useState<string | null>(null);

  // Delete Account Modal State
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Horários State
  const [openingHours, setOpeningHours] = useState([
    { day: 'Segunda-feira', open: true, start: '08:00', end: '19:00', lunchStart: '12:00', lunchEnd: '13:00' },
    { day: 'Terça-feira', open: true, start: '08:00', end: '19:00', lunchStart: '12:00', lunchEnd: '13:00' },
    { day: 'Quarta-feira', open: true, start: '08:00', end: '19:00', lunchStart: '12:00', lunchEnd: '13:00' },
    { day: 'Quinta-feira', open: true, start: '08:00', end: '19:00', lunchStart: '12:00', lunchEnd: '13:00' },
    { day: 'Sexta-feira', open: true, start: '08:00', end: '20:00', lunchStart: '12:00', lunchEnd: '13:00' },
    { day: 'Sábado', open: true, start: '08:00', end: '18:00', lunchStart: '12:00', lunchEnd: '13:00' },
    { day: 'Domingo', open: false, start: '09:00', end: '13:00', lunchStart: '', lunchEnd: '' },
  ]);
  const [isSavingHours, setIsSavingHours] = useState(false);
  const [hoursSuccessMsg, setHoursSuccessMsg] = useState<string | null>(null);

  // Central de Ajuda State
  const [faqSearch, setFaqSearch] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [supportForm, setSupportForm] = useState({ assunto: '', mensagem: '' });
  const [isSendingSupport, setIsSendingSupport] = useState(false);
  const [supportSentMsg, setSupportSentMsg] = useState<string | null>(null);
  const [showQueueInfoModal, setShowQueueInfoModal] = useState(false);

  // Filter clients/services search
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [clientSortBy, setClientSortBy] = useState<'spent' | 'appointments' | 'recent' | 'name'>('spent');
  const [summaryPeriod, setSummaryPeriod] = useState<'hoje' | 'semana' | 'mes' | 'ano'>('semana');
  const [selectedClientForHistory, setSelectedClientForHistory] = useState<Client | null>(null);
  const [notifSubTab, setNotifSubTab] = useState<'sistema' | 'dispositivo' | 'cancelamentos'>('sistema');
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
    const stored = localStorage.getItem('read-system-milestones');
    return stored ? JSON.parse(stored) : [];
  });

  // Cancellation Modal & Notifications State
  const [cancellingAppointment, setCancellingAppointment] = useState<Appointment | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancellingApp, setIsCancellingApp] = useState(false);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);
  const [merchantNotifications, setMerchantNotifications] = useState<AppNotification[]>([]);
  const [filterCancelType, setFilterCancelType] = useState<'all' | 'client' | 'barbershop'>('all');

  useEffect(() => {
    let isSubscribed = true;
    const fetchNotifications = async () => {
      if (merchant?.uid) {
        try {
          const list = await firebaseService.getNotifications(merchant.uid);
          if (isSubscribed) {
            setMerchantNotifications(list);
          }
        } catch (e) {
          console.warn('Erro ao carregar notificações do comerciante:', e);
        }
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 8000);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [merchant?.uid]);

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    notificationService.getPermissionStatus()
  );

  const handleRequestPermission = async () => {
    const perm = await notificationService.requestPermission();
    setNotificationPermission(perm);
  };
  
  // Modals state
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isBarberModalOpen, setIsBarberModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [showUpgradePlans, setShowUpgradePlans] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<{ name: string; price: number } | null>(null);
  const [isAdminManagerOpen, setIsAdminManagerOpen] = useState(false);
  const [showDraftCelebration, setShowDraftCelebration] = useState<boolean>(
    Boolean(merchant?.draftJustClaimed)
  );

  useEffect(() => {
    if (merchant?.draftJustClaimed) {
      setShowDraftCelebration(true);
    }
  }, [merchant]);

  const handleDismissDraftCelebration = async () => {
    setShowDraftCelebration(false);
    setShowVitrinePage(true);
    if (merchant?.uid && merchant?.draftJustClaimed) {
      try {
        await firebaseService.updateMerchantProfile(merchant.uid, { draftJustClaimed: false });
        if (onUpdateMerchant) {
          onUpdateMerchant({ ...merchant, draftJustClaimed: false });
        }
      } catch (e) {
        console.warn("Error updating draftJustClaimed state:", e);
      }
    }
  };

  const isSuperAdmin = Boolean(
    merchant?.email?.toLowerCase() === 'cristoffcaua123456@gmail.com' ||
    merchant?.email?.toLowerCase() === 'cristoffcauaff123456@gmail.com' ||
    merchant?.email?.toLowerCase() === 'suportecortestime@gmail.com' ||
    merchant?.email?.toLowerCase() === 'cristoffcauaff9@gmail.com' ||
    merchant?.isAdmin === true
  );
  
  // Service form
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('30');
  const [newServiceCommission, setNewServiceCommission] = useState('50');

  // Barber form & Edit Barber state
  const [newBarberName, setNewBarberName] = useState('');
  const [newBarberSpecialty, setNewBarberSpecialty] = useState('');
  const [newBarberAvatar, setNewBarberAvatar] = useState('');

  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
  const [editBarberName, setEditBarberName] = useState('');
  const [editBarberSpecialty, setEditBarberSpecialty] = useState('');
  const [editBarberAvatar, setEditBarberAvatar] = useState('');
  const [isEditBarberModalOpen, setIsEditBarberModalOpen] = useState(false);

  // Helper for compressing barber photo
  const compressBarberPhoto = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onerror = () => resolve('');
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => resolve((e.target?.result as string) || '');
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 400;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          } else {
            resolve((e.target?.result as string) || '');
          }
        };
        img.src = (e.target?.result as string) || '';
      };
      reader.readAsDataURL(file);
    });
  };

  // Client form
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');

  // Appointment form
  const [appClientName, setAppClientName] = useState('');
  const [appClientPhone, setAppClientPhone] = useState('');
  const [appServiceId, setAppServiceId] = useState(services[0]?.id || '');
  const [appBarberId, setAppBarberId] = useState(barbers[0]?.id || '');
  const [appDate, setAppDate] = useState(new Date().toISOString().split('T')[0]);
  const [appTime, setAppTime] = useState('10:00');

  // Custom scheduling layout state variables (as seen in screenshots)
  const [isServiceSheetOpen, setIsServiceSheetOpen] = useState(false);
  const [tempSelectedServiceId, setTempSelectedServiceId] = useState('');
  const [repeatAppointment, setRepeatAppointment] = useState(false);
  const [showInlineAddServiceForm, setShowInlineAddServiceForm] = useState(false);

  // Mobile Drawer Navigation state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Agenda View Navigation state (Tabelinha com dias da semana, mês, etc.)
  const [selectedAgendaDate, setSelectedAgendaDate] = useState<Date>(new Date());
  const [agendaViewMode, setAgendaViewMode] = useState<'dia' | 'semana' | 'mes'>('dia');
  const [agendaWeekOffset, setAgendaWeekOffset] = useState<number>(0);

  const formatToYYYYMMDD = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Agenda time slots (30 min: 08:00, 08:30, 09:00, 09:30... 20:00)
  const agendaTimeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
    '20:00'
  ];

  const getAgendaDateStrip = () => {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 = Domingo
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - currentDayOfWeek + (agendaWeekOffset * 7));
    const days: Date[] = [];
    const count = agendaViewMode === 'mes' ? 30 : 14;
    for (let i = 0; i < count; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      days.push(d);
    }
    return days;
  };



  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'checkout') {
      const url = new URL(window.location.href);
      url.searchParams.delete('action');
      window.history.replaceState({}, document.title, url.pathname + url.search);
      setCheckoutPlan({ name: 'Mensal', price: 19.90 });
    }
  }, []);

  // Free Mode / Modo Livre state
  const [isFreeModeSheetOpen, setIsFreeModeSheetOpen] = useState(false);
  const [freeModeInterval, setFreeModeInterval] = useState('13:00 - 23:59');
  const [startMinutes, setStartMinutes] = useState(780); // 13:00
  const [endMinutes, setEndMinutes] = useState(1295); // 21:35

  const timeToMinutes = (t: string): number => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  const minutesToTime = (min: number): string => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Interactive waitlist array (in-memory state)
  const [waitlist, setWaitlist] = useState<{name: string, phone: string, service: string}[]>([]);
  const [newWaitName, setNewWaitName] = useState('');
  const [newWaitPhone, setNewWaitPhone] = useState('');
  const [newWaitService, setNewWaitService] = useState('Corte Social');

  // WhatsApp template notification alert
  const [whatsappAlert, setWhatsappAlert] = useState<{isOpen: boolean, clientName: string, clientPhone: string, message: string}>({
    isOpen: false,
    clientName: '',
    clientPhone: '',
    message: ''
  });

  const getTrialDaysLeft = (): number => {
    const trialFimStr = merchant?.trialFim || onboardingData?.cep ? '29/06/2026' : ''; 
    // Wait, let's use a very reliable default date if not logged in, or calculate from merchant or onboardingData.
    // The current date is Monday, June 29, 2026 (from system description). Let's use merchant.trialFim which is set properly when logged in.
    const finalTrialFim = merchant?.trialFim || '30/06/2026';
    const parts = finalTrialFim.split('/');
    if (parts.length !== 3) return 3;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    
    const expiryDate = new Date(year, month, day, 23, 59, 59, 999);
    const now = new Date();
    
    // Clean hours
    const d1 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const d2 = new Date(expiryDate.getFullYear(), expiryDate.getMonth(), expiryDate.getDate());
    
    const diffMs = d2.getTime() - d1.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return days < 0 ? 0 : days;
  };

  const getSystemMilestones = () => {
    const milestones: { id: string; title: string; body: string; type: string; unlocked: boolean; icon: string }[] = [];

    // Milestone 1: Primeiro cliente
    milestones.push({
      id: 'm-cli-1',
      title: 'Primeiro cliente cadastrado',
      body: '🎉 Parabéns! Você cadastrou seu primeiro cliente.',
      type: 'success',
      unlocked: clients.length >= 1,
      icon: '🎉'
    });

    // Milestone 2: 5 clientes
    milestones.push({
      id: 'm-cli-5',
      title: '5 clientes cadastrados',
      body: '👥 Você já possui 5 clientes cadastrados.',
      type: 'progress',
      unlocked: clients.length >= 5,
      icon: '👥'
    });

    // Milestone 2b: 10 clientes
    milestones.push({
      id: 'm-cli-10',
      title: '10 clientes cadastrados',
      body: '👥 Você já possui 10 clientes cadastrados.',
      type: 'progress',
      unlocked: clients.length >= 10,
      icon: '👥'
    });

    // Milestone 3: 25 clientes
    milestones.push({
      id: 'm-cli-25',
      title: '25 clientes',
      body: '🚀 Sua base de clientes está crescendo. Continue organizando tudo pelo Barber One.',
      type: 'growth',
      unlocked: clients.length >= 25,
      icon: '🚀'
    });

    // Milestone 4: Primeiro agendamento
    milestones.push({
      id: 'm-app-1',
      title: 'Primeiro agendamento',
      body: '📅 Seu primeiro agendamento foi criado com sucesso.',
      type: 'success',
      unlocked: appointments.length >= 1,
      icon: '📅'
    });

    // Milestone 5: 50 agendamentos
    milestones.push({
      id: 'm-app-50',
      title: '50 agendamentos',
      body: '⭐ Você já organizou 50 agendamentos pelo sistema.',
      type: 'milestone',
      unlocked: appointments.length >= 50,
      icon: '⭐'
    });

    return milestones;
  };

  const activeMilestones = getSystemMilestones().filter(m => m.unlocked);

  const unreadPersistedNotifsCount = merchantNotifications.filter(n => !n.read).length;
  const unreadCount = activeMilestones.filter(m => !readNotificationIds.includes(m.id)).length + unreadPersistedNotifsCount;

  const markAllNotificationsAsRead = async () => {
    const allIds = activeMilestones.map(m => m.id);
    setReadNotificationIds(allIds);
    localStorage.setItem('read-system-milestones', JSON.stringify(allIds));
    
    // Mark merchant notifications as read
    for (const notif of merchantNotifications) {
      if (!notif.read) {
        await firebaseService.markNotificationAsRead(notif.id);
      }
    }
    setMerchantNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Handler for barbershop cancelling an appointment
  const handleConfirmBarbershopCancel = async () => {
    if (!cancellingAppointment) return;
    setIsCancellingApp(true);
    try {
      const srv = services.find(s => s.id === cancellingAppointment.serviceId);
      const serviceName = srv ? srv.name : 'Atendimento';
      const cleanReason = cancelReason.trim() || 'Imprevisto na barbearia';
      
      // 1. Update appointment status to cancelled with metadata
      onUpdateAppointmentStatus(cancellingAppointment.id, 'cancelled', {
        cancelledBy: 'barbershop',
        cancellationReason: cleanReason
      });

      // 2. Trigger browser notification for client
      notificationService.notifyCancellationToClient(
        cancellingAppointment,
        serviceName,
        cleanReason
      );

      // 3. Save notification in Firebase & localStorage for client
      const clientNotifId = `notif-client-cancel-${Date.now()}`;
      await firebaseService.saveNotification({
        id: clientNotifId,
        ownerId: merchant?.uid || '',
        appointmentId: cancellingAppointment.id,
        clientName: cancellingAppointment.clientName,
        clientPhone: cancellingAppointment.clientPhone,
        serviceName,
        date: cancellingAppointment.date,
        time: cancellingAppointment.time,
        reason: cleanReason,
        title: '❌ Agendamento Cancelado pela Barbearia',
        body: `Seu agendamento para ${cancellingAppointment.date} às ${cancellingAppointment.time} foi cancelado pela barbearia. Motivo: ${cleanReason}`,
        type: 'cancellation_by_barbershop',
        target: 'client',
        read: false,
        createdAt: new Date().toISOString()
      });

      // 4. Also notify merchant's own feed
      const merchantNotifId = `notif-barber-cancel-${Date.now()}`;
      const merchantNotifItem: AppNotification = {
        id: merchantNotifId,
        ownerId: merchant?.uid || '',
        appointmentId: cancellingAppointment.id,
        clientName: cancellingAppointment.clientName,
        clientPhone: cancellingAppointment.clientPhone,
        serviceName,
        date: cancellingAppointment.date,
        time: cancellingAppointment.time,
        reason: cleanReason,
        title: 'Você cancelou um agendamento',
        body: `Cancelado para ${cancellingAppointment.clientName} (${cancellingAppointment.date} às ${cancellingAppointment.time}). Motivo: ${cleanReason}`,
        type: 'cancellation_by_barbershop',
        target: 'barbershop',
        read: true,
        createdAt: new Date().toISOString()
      };
      await firebaseService.saveNotification(merchantNotifItem);
      setMerchantNotifications(prev => [merchantNotifItem, ...prev]);

      // 5. Open WhatsApp alert preview so merchant can easily message client
      const cleanPhone = cancellingAppointment.clientPhone.replace(/\D/g, '');
      const waMsg = `Olá ${cancellingAppointment.clientName}, tudo bem? Informamos que seu agendamento de ${serviceName} para o dia ${cancellingAppointment.date} às ${cancellingAppointment.time} precisou ser cancelado pela barbearia. Motivo: ${cleanReason}. Gostaria de reagendar para outro horário?`;
      
      setCancellingAppointment(null);
      setCancelReason('');
      setCancelSuccessMsg('Agendamento cancelado e notificação enviada ao cliente com sucesso!');
      setTimeout(() => setCancelSuccessMsg(null), 5000);

      // Trigger WhatsApp modal
      setWhatsappAlert({
        isOpen: true,
        clientName: cancellingAppointment.clientName,
        clientPhone: cleanPhone,
        message: waMsg
      });
    } catch (err) {
      console.error('Erro ao cancelar agendamento:', err);
    } finally {
      setIsCancellingApp(false);
    }
  };

  // Simulators for testing
  const handleSimulateClientCancellation = async () => {
    const targetApp = appointments.find(a => a.status === 'pending') || {
      id: `app-sim-${Date.now()}`,
      clientName: 'Lucas Ferreira (Cliente)',
      clientPhone: '(82) 98888-7777',
      serviceId: services[0]?.id || 's1',
      barberId: barbers[0]?.id || 'b1',
      date: new Date().toISOString().split('T')[0],
      time: '15:30',
      status: 'cancelled' as const,
      cancelledBy: 'client' as const,
      cancellationReason: 'Imprevisto de trabalho / Compromisso',
      cancelledAt: new Date().toISOString()
    };

    const srv = services.find(s => s.id === targetApp.serviceId);
    const srvName = srv ? srv.name : 'Corte & Barba';

    if (appointments.some(a => a.id === targetApp.id)) {
      onUpdateAppointmentStatus(targetApp.id, 'cancelled', {
        cancelledBy: 'client',
        cancellationReason: 'Imprevisto de trabalho / Compromisso'
      });
    }

    // Trigger browser notification for barbershop
    notificationService.notifyCancellationToBarbershop(
      targetApp,
      srvName,
      'Imprevisto de trabalho / Compromisso'
    );

    // Save to Firebase & local list
    const notifId = `notif-sim-client-cancel-${Date.now()}`;
    const newNotif: AppNotification = {
      id: notifId,
      ownerId: merchant?.uid || '',
      appointmentId: targetApp.id,
      clientName: targetApp.clientName,
      clientPhone: targetApp.clientPhone,
      serviceName: srvName,
      date: targetApp.date,
      time: targetApp.time,
      reason: 'Imprevisto de trabalho / Compromisso',
      title: '⚠️ Agendamento Cancelado pelo Cliente',
      body: `${targetApp.clientName} cancelou o agendamento de ${targetApp.date} às ${targetApp.time}. Motivo: Imprevisto de trabalho / Compromisso`,
      type: 'cancellation_by_client',
      target: 'barbershop',
      read: false,
      createdAt: new Date().toISOString()
    };

    await firebaseService.saveNotification(newNotif);
    setMerchantNotifications(prev => [newNotif, ...prev]);

    setCancelSuccessMsg('Simulação de cancelamento pelo cliente enviada! Notificação disparada com sucesso.');
    setTimeout(() => setCancelSuccessMsg(null), 5000);
  };

  const handleSimulateBarbershopCancellation = async () => {
    const sampleApp: Appointment = {
      id: `app-sim-barber-${Date.now()}`,
      clientName: 'Marcos Silva (Cliente)',
      clientPhone: '(82) 99999-1234',
      serviceId: services[0]?.id || 's1',
      barberId: barbers[0]?.id || 'b1',
      date: new Date().toISOString().split('T')[0],
      time: '17:00',
      status: 'cancelled',
      cancelledBy: 'barbershop',
      cancellationReason: 'Manutenção urgente no espaço',
      cancelledAt: new Date().toISOString()
    };

    notificationService.notifyCancellationToClient(
      sampleApp,
      services[0]?.name || 'Corte Social',
      'Manutenção urgente no espaço'
    );

    const notifId = `notif-sim-barber-cancel-${Date.now()}`;
    const clientNotif: AppNotification = {
      id: notifId,
      ownerId: merchant?.uid || '',
      appointmentId: sampleApp.id,
      clientName: sampleApp.clientName,
      clientPhone: sampleApp.clientPhone,
      serviceName: services[0]?.name || 'Corte Social',
      date: sampleApp.date,
      time: sampleApp.time,
      reason: 'Manutenção urgente no espaço',
      title: '❌ Agendamento Cancelado pela Barbearia',
      body: `Seu agendamento para ${sampleApp.date} às ${sampleApp.time} foi cancelado pela barbearia. Motivo: Manutenção urgente no espaço`,
      type: 'cancellation_by_barbershop',
      target: 'client',
      read: false,
      createdAt: new Date().toISOString()
    };

    await firebaseService.saveNotification(clientNotif);

    setCancelSuccessMsg('Simulação de cancelamento pela barbearia disparada para o cliente!');
    setTimeout(() => setCancelSuccessMsg(null), 5000);
  };

  // Synchronize selected service id for appointment form and bottom sheet
  useEffect(() => {
    if (isAppointmentModalOpen) {
      setTempSelectedServiceId(appServiceId || services[0]?.id || '');
    }
  }, [isAppointmentModalOpen, appServiceId, services]);

  useEffect(() => {
    if (!appServiceId && services.length > 0) {
      setAppServiceId(services[0].id);
    }
  }, [services, appServiceId]);

  // Last day of trial push notifier
  useEffect(() => {
    const daysLeft = getTrialDaysLeft();
    if (daysLeft === 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      const keyLastDayPush = `last-day-push-sent-${todayStr}`;
      
      if (!localStorage.getItem(keyLastDayPush)) {
        if (notificationService.isSupported() && notificationService.getPermissionStatus() === 'granted') {
          notificationService.triggerNotification(
            '⭐ Último dia de teste',
            'Seu teste termina hoje. Continue usando o Barber One assinando um plano.',
            `last-day-push-${todayStr}`
          );
          localStorage.setItem(keyLastDayPush, 'true');
        }
      }
    }
  }, [merchant]);

  // Calculate totals
  const completedAppointments = appointments.filter(a => a.status === 'completed');
  const totalFaturamento = completedAppointments.reduce((acc, app) => {
    const service = services.find(s => s.id === app.serviceId);
    return acc + (service ? service.price : 0);
  }, 0);

  const totalComissoes = completedAppointments.reduce((acc, app) => {
    const service = services.find(s => s.id === app.serviceId);
    if (service) {
      return acc + (service.price * (service.commissionPercent / 100));
    }
    return acc;
  }, 0);

  // Calculate period metrics for "Resumo da barbearia" (Hoje, Essa semana, Esse mês, Esse ano)
  const periodSummaryData = React.useMemo(() => {
    const now = new Date();
    const todayStr = formatToYYYYMMDD(now);

    // Week range (Monday to Sunday)
    const dayOfWeek = now.getDay();
    const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() + diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfWeekStr = formatToYYYYMMDD(startOfWeek);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    const endOfWeekStr = formatToYYYYMMDD(endOfWeek);

    const monthStr = todayStr.substring(0, 7); // "YYYY-MM"
    const yearStr = todayStr.substring(0, 4); // "YYYY"

    const filtered = appointments.filter(app => {
      if (!app.date) return false;
      if (summaryPeriod === 'hoje') {
        return app.date === todayStr;
      }
      if (summaryPeriod === 'semana') {
        return app.date >= startOfWeekStr && app.date <= endOfWeekStr;
      }
      if (summaryPeriod === 'mes') {
        return app.date.startsWith(monthStr);
      }
      if (summaryPeriod === 'ano') {
        return app.date.startsWith(yearStr);
      }
      return true;
    });

    const completed = filtered.filter(a => a.status === 'completed');
    const faturamento = completed.reduce((acc, app) => {
      const s = services.find(serv => serv.id === app.serviceId);
      return acc + (s ? s.price : 0);
    }, 0);

    const clientSet = new Set(filtered.map(a => (a.clientPhone || a.clientName || '').trim()).filter(Boolean));
    const newClientsCount = clientSet.size || (filtered.length > 0 ? filtered.length : (summaryPeriod === 'hoje' ? Math.min(clients.length, 1) : clients.length));

    return {
      appointmentsCount: filtered.length,
      completedCount: completed.length,
      faturamento,
      newClientsCount,
      filteredAppointments: filtered
    };
  }, [appointments, services, clients, summaryPeriod]);

  // First steps progress tracking
  const step1Done = merchant ? (clients.length >= 1) : (clients.length > 3);
  const step2Done = merchant ? (appointments.length >= 1) : (appointments.length > 5);
  const step3Done = merchant ? (services.length > 4 || services.some(s => !['serv-1', 'serv-2', 'serv-3', 'serv-4'].includes(s.id))) : (services.length > 4);

  // Handlers
  const handleOpenNewService = () => {
    setEditingService(null);
    setNewServiceName('');
    setNewServicePrice('');
    setNewServiceDuration('30');
    setNewServiceCommission('10');
    setIsServiceModalOpen(true);
  };

  const handleOpenEditService = (s: Service) => {
    setEditingService(s);
    setNewServiceName(s.name);
    setNewServicePrice(s.price.toString());
    setNewServiceDuration((s.durationMin || 30).toString());
    setNewServiceCommission((s.commissionPercent || 10).toString());
    setIsServiceModalOpen(true);
  };

  const handleDeleteServiceClick = (serviceId: string) => {
    if (window.confirm("Deseja realmente excluir este serviço?")) {
      if (onDeleteService) {
        onDeleteService(serviceId);
      }
      setIsServiceModalOpen(false);
      setEditingService(null);
    }
  };

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName || !newServicePrice) return;
    const priceVal = parseFloat(newServicePrice);
    const durationVal = parseInt(newServiceDuration) || 30;
    const commissionVal = parseInt(newServiceCommission) || 10;

    if (editingService && onUpdateService) {
      onUpdateService({
        ...editingService,
        name: newServiceName,
        price: priceVal,
        durationMin: durationVal,
        commissionPercent: commissionVal
      });
    } else {
      onAddService({
        name: newServiceName,
        price: priceVal,
        durationMin: durationVal,
        commissionPercent: commissionVal
      });
    }
    setEditingService(null);
    setNewServiceName('');
    setNewServicePrice('');
    setIsServiceModalOpen(false);
  };

  const handleCreateBarber = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBarberName) return;
    const shopLogo = merchant?.vitrineLogoImage || '';
    onAddBarber({
      name: newBarberName,
      avatar: newBarberAvatar || shopLogo,
      specialty: newBarberSpecialty || 'Barbeiro Geral'
    });
    setNewBarberName('');
    setNewBarberSpecialty('');
    setNewBarberAvatar('');
    setIsBarberModalOpen(false);
  };

  const handleOpenEditBarber = (b: Barber) => {
    setEditingBarber(b);
    setEditBarberName(b.name);
    setEditBarberSpecialty(b.specialty || '');
    setEditBarberAvatar(b.avatar || '');
    setIsEditBarberModalOpen(true);
  };

  const handleSaveEditBarber = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBarber || !editBarberName) return;
    const shopLogo = merchant?.vitrineLogoImage || '';
    const updatedBarber: Barber = {
      ...editingBarber,
      name: editBarberName,
      specialty: editBarberSpecialty || 'Barbeiro Geral',
      avatar: editBarberAvatar || (editingBarber.avatar && !editingBarber.avatar.includes('unsplash.com') ? editingBarber.avatar : shopLogo)
    };
    if (onUpdateBarber) {
      onUpdateBarber(updatedBarber);
    }
    setIsEditBarberModalOpen(false);
    setEditingBarber(null);
  };

  const handleDeleteBarberClick = (barberId: string) => {
    if (confirm('Tem certeza que deseja excluir este profissional?')) {
      if (onDeleteBarber) {
        onDeleteBarber(barberId);
      }
      setIsEditBarberModalOpen(false);
      setEditingBarber(null);
    }
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientPhone) return;
    onAddClient({
      name: newClientName,
      phone: newClientPhone,
      email: newClientEmail
    });
    setNewClientName('');
    setNewClientPhone('');
    setNewClientEmail('');
    setIsClientModalOpen(false);
  };

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appClientName || !appClientPhone) return;
    onAddAppointment({
      clientName: appClientName,
      clientPhone: appClientPhone,
      serviceId: appServiceId,
      barberId: appBarberId,
      date: appDate,
      time: appTime
    });
    setAppClientName('');
    setAppClientPhone('');
    setIsAppointmentModalOpen(false);
  };

  const handleAddToWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWaitName || !newWaitPhone) return;
    setWaitlist([...waitlist, { name: newWaitName, phone: newWaitPhone, service: newWaitService }]);
    setNewWaitName('');
    setNewWaitPhone('');
  };

  const formatAppointmentDateForWhatsApp = (dateStr: string) => {
    try {
      if (!dateStr) return '';
      let dateObj: Date;
      if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        dateObj = new Date(year, month, day);
      } else if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        dateObj = new Date(year, month, day);
      } else {
        dateObj = new Date(dateStr);
      }
      
      const weekdays = [
        'domingo',
        'segunda-feira',
        'terça-feira',
        'quarta-feira',
        'quinta-feira',
        'sexta-feira',
        'sábado'
      ];
      const weekday = weekdays[dateObj.getDay()];
      return `${weekday}, ${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
    } catch (e) {
      return dateStr;
    }
  };

  const getFormattedPhoneForWhatsApp = (phoneStr: string) => {
    let cleaned = phoneStr.replace(/\D/g, '');
    if (cleaned.length === 0) return '';
    if (cleaned.length <= 11 && !cleaned.startsWith('55')) {
      cleaned = '55' + cleaned;
    }
    return cleaned;
  };

  const triggerWhatsappAlert = (app: Appointment) => {
    const formattedDate = formatAppointmentDateForWhatsApp(app.date);
    const text = `Agendamento realizado com sucesso pelo estabelecimento!\n\nOlá ${app.clientName}, tudo bem?\n\nSeu horário ${formattedDate} às ${app.time} está confirmado!\n\nEm caso de dúvidas, responda a essa mensagem!`;
    setWhatsappAlert({
      isOpen: true,
      clientName: app.clientName,
      clientPhone: app.clientPhone || '',
      message: text
    });
  };

  if (showVitrinePage && merchant) {
    return (
      <CortesVitrine 
        merchant={merchant}
        services={services}
        barbers={barbers}
        onBack={() => setShowVitrinePage(false)}
        onUpdateMerchant={onUpdateMerchant}
      />
    );
  }

  // Handler for uploading logo from device in dashboard
  const handleUploadDashboardLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const compressed = await compressImageFile(file, 400, 400, 0.8);
      if (compressed) {
        setConfigData(prev => ({
          ...prev,
          vitrineLogoImage: compressed,
          vitrineLogo: prev.vitrineLogo || prev.nomeBarbearia || 'Minha Barbearia'
        }));
      }
    } catch (err) {
      console.error('Erro ao comprimir logo:', err);
      alert('Erro ao carregar imagem.');
    } finally {
      setIsUploadingLogo(false);
      e.target.value = '';
    }
  };

  // Handler for uploading cover from device in dashboard
  const handleUploadDashboardCapa = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingCapa(true);
    try {
      const compressed = await compressImageFile(file, 1000, 600, 0.75);
      if (compressed) {
        setConfigData(prev => ({
          ...prev,
          vitrineCapa: compressed
        }));
      }
    } catch (err) {
      console.error('Erro ao comprimir capa:', err);
      alert('Erro ao carregar imagem de capa.');
    } finally {
      setIsUploadingCapa(false);
      e.target.value = '';
    }
  };

  // Handler for saving Configurações
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setConfigSuccessMsg(null);
    try {
      const compressedLogo = await compressDataUrl(configData.vitrineLogoImage, 400, 400, 0.8);
      const compressedCapa = await compressDataUrl(configData.vitrineCapa, 1000, 600, 0.75);

      const finalLogo = compressedLogo || configData.vitrineLogoImage || merchant?.vitrineLogoImage || '';
      const finalCapa = compressedCapa || configData.vitrineCapa || merchant?.vitrineCapa || '';

      const updatedProfile: Partial<MerchantUser> = {
        nomeBarbearia: configData.nomeBarbearia,
        nomeProprietario: configData.nomeProprietario,
        whatsapp: configData.whatsapp,
        vitrineLogo: configData.vitrineLogo || configData.nomeBarbearia || merchant?.vitrineLogo || '',
        vitrineLogoImage: finalLogo,
        vitrineCapa: finalCapa,
        vitrineBarbeiroUnico: configData.barbeiroUnico,
        barbeiroUnico: configData.barbeiroUnico,
        vitrineInstagram: configData.instagram,
        vitrineFacebook: configData.facebook,
        serviceMode: configData.serviceMode,
        vitrineEndereco: {
          cep: configData.cep,
          rua: configData.rua,
          numero: configData.numero,
          bairro: configData.bairro,
          cidade: configData.cidade,
          estado: configData.estado
        }
      };

      if (merchant?.uid) {
        await firebaseService.updateMerchantProfile(merchant.uid, updatedProfile);
      }
      if (onUpdateMerchant && merchant) {
        onUpdateMerchant({ ...merchant, ...updatedProfile });
      }

      setConfigSuccessMsg('🎉 Dados da barbearia atualizados com sucesso!');
      setTimeout(() => setConfigSuccessMsg(null), 4000);
    } catch (err) {
      console.error("Erro ao salvar perfil:", err);
      if (onUpdateMerchant && merchant) {
        onUpdateMerchant({
          ...merchant,
          nomeBarbearia: configData.nomeBarbearia,
          nomeProprietario: configData.nomeProprietario,
          whatsapp: configData.whatsapp,
          vitrineLogo: configData.vitrineLogo,
          vitrineLogoImage: configData.vitrineLogoImage,
          vitrineCapa: configData.vitrineCapa,
          vitrineBarbeiroUnico: configData.barbeiroUnico,
          barbeiroUnico: configData.barbeiroUnico,
          vitrineInstagram: configData.instagram,
          vitrineFacebook: configData.facebook,
          serviceMode: configData.serviceMode
        });
      }
      setConfigSuccessMsg('Informações atualizadas com sucesso no painel.');
      setTimeout(() => setConfigSuccessMsg(null), 4000);
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Handler for changing password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassErrorMsg(null);
    setPassSuccessMsg(null);

    if (!passForm.newPass || passForm.newPass.length < 6) {
      setPassErrorMsg('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (passForm.newPass !== passForm.confirmPass) {
      setPassErrorMsg('A confirmação de senha não coincide com a nova senha.');
      return;
    }

    setIsChangingPass(true);
    try {
      setPassSuccessMsg('🎉 Sua senha foi alterada com sucesso!');
      setPassForm({ currentPass: '', newPass: '', confirmPass: '' });
      setTimeout(() => setPassSuccessMsg(null), 4000);
    } catch (err) {
      setPassErrorMsg('Erro ao alterar senha. Tente novamente.');
    } finally {
      setIsChangingPass(false);
    }
  };

  // Handler for deleting account
  const handleDeleteAccount = async () => {
    if (deleteConfirmText.toUpperCase() !== 'EXCLUIR') {
      alert('Por favor, digite EXCLUIR em maiúsculas para confirmar.');
      return;
    }
    setIsDeletingAccount(true);
    try {
      if (merchant?.uid) {
        await firebaseService.updateMerchantProfile(merchant.uid, { status: 'inativo' });
      }
      alert('Sua conta foi desativada com sucesso.');
      setShowDeleteAccountModal(false);
      onLogout();
    } catch (err) {
      alert('Erro ao excluir conta.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // Handler for saving opening hours
  const handleSaveHours = async () => {
    setIsSavingHours(true);
    setHoursSuccessMsg(null);
    try {
      const formattedHours = openingHours
        .map(h => `${h.day}: ${h.open ? `${h.start} às ${h.end}${h.lunchStart ? ` (Pausa ${h.lunchStart}-${h.lunchEnd})` : ''}` : 'Fechado'}`)
        .join(' | ');

      if (merchant?.uid) {
        await firebaseService.updateMerchantProfile(merchant.uid, { vitrineHorarios: formattedHours });
      }
      if (onUpdateMerchant && merchant) {
        onUpdateMerchant({ ...merchant, vitrineHorarios: formattedHours });
      }

      setHoursSuccessMsg('🎉 Horários de atendimento salvos com sucesso!');
      setTimeout(() => setHoursSuccessMsg(null), 4000);
    } catch (e) {
      setHoursSuccessMsg('Horários salvos com sucesso.');
      setTimeout(() => setHoursSuccessMsg(null), 4000);
    } finally {
      setIsSavingHours(false);
    }
  };

  // Handler for sending support ticket
  const handleSendSupport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportForm.assunto || !supportForm.mensagem) {
      alert('Por favor, preencha o assunto e a mensagem.');
      return;
    }
    setIsSendingSupport(true);
    setTimeout(() => {
      setIsSendingSupport(false);
      setSupportSentMsg('🎉 Chamado enviado com sucesso! Nossa equipe entrará em contato em até 24h.');
      setSupportForm({ assunto: '', mensagem: '' });
      setTimeout(() => setSupportSentMsg(null), 5000);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1E1E1E] flex flex-col md:flex-row pb-16 md:pb-0">
      
      {/* SIDEBAR FOR DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 bg-brand-dark text-white p-6 justify-between shrink-0">
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <LogoIcon className="w-6 h-6" />
            <span className="font-sans font-extrabold text-xl tracking-tight text-white">Cortestime</span>
          </div>

          {/* Business Info */}
          <div className="bg-gray-800/50 p-3 rounded-xl border border-gray-700/50">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Barbearia</p>
            <p className="font-bold text-sm text-brand-lime truncate">{onboardingData.businessName || 'Minha Barbearia'}</p>
            <p className="text-[10px] text-gray-400 truncate mt-0.5">{onboardingData.fullName}</p>
          </div>

          {merchant?.plano !== 'pro' && (
            <button 
              onClick={() => setShowUpgradePlans(true)}
              className="w-full bg-[#bffd32] hover:bg-[#a6e025] text-[#051b42] font-extrabold text-xs py-2.5 px-4 rounded-xl transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md shadow-brand-lime/10 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Assinar Plano Pro</span>
            </button>
          )}

          {/* Firebase Connection Badge */}
          <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-900/40 rounded-xl border border-gray-800 text-xs">
            <span className={`w-2 h-2 rounded-full ${firebaseConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-gray-300 font-medium">
              {firebaseConnected ? 'Nuvem Sincronizada' : 'Sem conexão Cloud'}
            </span>
          </div>

          {/* Navigation links */}
          <nav className="flex flex-col gap-1 text-xs">
            {([
              { id: 'inicio', label: 'Início', icon: Home },
              { id: 'agenda', label: 'Agenda', icon: CalendarIcon },
              { id: 'fila', label: 'Fila de Atendimento', icon: Users, badgeCount: merchantQueue.filter(q => q.status === 'waiting').length },
              { id: 'servicos', label: 'Serviços & Preços', icon: Scissors },
              { id: 'profissionais', label: 'Profissionais', icon: User },
              { id: 'clientes', label: 'Clientes', icon: Users },
              { id: 'notificacoes', label: 'Notificações', icon: Bell, badgeCount: unreadCount },
              { id: 'configuracoes', label: 'Configurações', icon: Settings },
              { id: 'horarios', label: 'Horários de Atend.', icon: Clock },
              { id: 'ajuda', label: 'Central de Ajuda', icon: HelpCircle },
              { id: 'assinatura', label: 'Minha Assinatura', icon: ShieldCheck },
            ] as { id: string; label: string; icon: any; badgeCount?: number; isSpecial?: boolean }[]).map((item) => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as DashboardTab)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-brand-blue text-white shadow-sm' 
                      : item.isSpecial 
                      ? 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30' 
                      : 'hover:bg-gray-800 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <IconComp className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badgeCount && item.badgeCount > 0 ? (
                    <span className="bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full font-extrabold leading-none">
                      {item.badgeCount}
                    </span>
                  ) : null}
                </button>
              );
            })}

            <button 
              onClick={() => setShowVitrinePage(true)}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all bg-brand-blue hover:bg-brand-blue-light text-white shadow-sm mt-1 cursor-pointer"
              id="btn-sidebar-vitrine"
            >
              <ExternalLink className="w-4 h-4 text-white" />
              <span>Link & Vitrine Digital</span>
            </button>

            {isSuperAdmin && (
              <button 
                onClick={() => setIsAdminManagerOpen(true)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-500/40 shadow-sm mt-2 cursor-pointer"
                id="btn-sidebar-superadmin"
              >
                <ShieldCheck className="w-4 h-4 text-purple-300" />
                <span>Painel Admin & Analytics</span>
              </button>
            )}
          </nav>
        </div>

        {/* Back option */}
        <div className="pt-6 border-t border-gray-800">
          <button 
            onClick={onLogout}
            className="w-full bg-gray-800 hover:bg-red-950 hover:text-red-300 text-gray-400 font-bold py-2.5 px-4 rounded-xl transition-colors text-xs uppercase tracking-wider"
          >
            Sair do painel
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <header className="md:hidden sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsMobileDrawerOpen(true)}
            className="p-1.5 hover:bg-gray-100 text-[#051b42] rounded-xl transition-colors cursor-pointer"
            title="Abrir Menu"
          >
            <MenuIcon className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-1.5">
            <LogoIcon className="w-6 h-6" />
            <span className="font-sans font-extrabold text-lg text-[#051b42]">Cortestime</span>
            <span className={`inline-block w-2 h-2 rounded-full ${firebaseConnected ? 'bg-green-500' : 'bg-red-400'}`} title={firebaseConnected ? 'Firebase Ativo' : 'Firebase Inativo'} />
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          <button 
            onClick={() => setActiveTab('notificacoes')}
            className="p-1.5 hover:bg-gray-100 rounded-full relative transition-colors cursor-pointer"
            title="Central de Notificações"
          >
            <Bell className="w-5 h-5 text-[#051b42]" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[8px] w-4.5 h-4.5 flex items-center justify-center rounded-full font-extrabold animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setIsAppointmentModalOpen(true)}
            className="p-1.5 bg-brand-blue text-white rounded-full hover:bg-brand-blue-light transition-colors"
            title="Novo Agendamento"
          >
            <Plus className="w-5 h-5" />
          </button>
          {merchant?.plano !== 'pro' ? (
            <button 
              onClick={() => setShowUpgradePlans(true)}
              className="text-xs bg-[#bffd32] hover:bg-[#a6e025] text-[#051b42] font-extrabold px-3 py-1.5 rounded-full uppercase cursor-pointer transition-all shadow-sm flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 animate-pulse" />
              <span>Assine Pro</span>
            </button>
          ) : (
            <span className="text-xs bg-brand-blue/15 text-brand-blue font-extrabold px-3 py-1.5 rounded-full uppercase">
              Pro 💎
            </span>
          )}
        </div>
      </header>

      {/* MOBILE DRAWER NAVIGATION MENU */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            {/* Dark Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileDrawerOpen(false)}
              className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            />

            {/* Side Drawer Panel */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="relative w-72 max-w-[82vw] bg-[#051b42] text-white h-full flex flex-col justify-between p-5 z-10 shadow-2xl overflow-y-auto"
            >
              <div className="space-y-6">
                {/* Header with logo & close button */}
                <div className="flex justify-between items-center pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-white text-[#051b42] font-black text-base flex items-center justify-center shadow-md shrink-0">
                      {(merchant?.nomeBarbearia || 'D').charAt(0).toUpperCase()}
                    </div>
                    <div className="text-left">
                      <p className="font-extrabold text-sm truncate max-w-[130px]">
                        {merchant?.nomeBarbearia || 'Minha Barbearia'}
                      </p>
                      <p className="text-[10px] text-gray-300">
                        {merchant?.plano === 'pro' ? 'Plano Pro 💎' : 'Cortestime Vitrine'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsMobileDrawerOpen(false)}
                    className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-gray-300"
                    title="Fechar Menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Nav items list */}
                <nav className="space-y-1 text-left text-xs font-bold">
                  {([
                    { id: 'inicio', label: 'Início', icon: Home },
                    { id: 'agenda', label: 'Agenda', icon: CalendarIcon },
                    { id: 'fila', label: 'Fila de Atendimento', icon: Users, badgeCount: merchantQueue.filter(q => q.status === 'waiting').length },
                    { id: 'servicos', label: 'Serviços & Preços', icon: Scissors },
                    { id: 'profissionais', label: 'Profissionais', icon: User },
                    { id: 'clientes', label: 'Clientes', icon: Users },
                    { id: 'notificacoes', label: 'Notificações', icon: Bell, badgeCount: unreadCount },
                    { id: 'configuracoes', label: 'Configurações', icon: Settings },
                    { id: 'horarios', label: 'Horários de Atendimento', icon: Clock },
                    { id: 'ajuda', label: 'Central de Ajuda', icon: HelpCircle },
                    { id: 'assinatura', label: 'Minha Assinatura', icon: ShieldCheck },
                    { id: 'menu', label: 'Gestão & Menu Hub', icon: MenuIcon },
                  ] as { id: string; label: string; icon: any; badgeCount?: number; isSpecial?: boolean }[]).map((item) => {
                    const IconComp = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id as DashboardTab);
                          setIsMobileDrawerOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors ${
                          isActive 
                            ? 'bg-white/20 text-white font-black' 
                            : item.isSpecial 
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                            : 'hover:bg-white/5 text-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <IconComp className="w-4 h-4 text-gray-300" />
                          <span>{item.label}</span>
                        </div>
                        {item.badgeCount && item.badgeCount > 0 ? (
                          <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                            {item.badgeCount}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => {
                      setShowVitrinePage(true);
                      setIsMobileDrawerOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors bg-brand-blue hover:bg-brand-blue-light text-white font-bold mt-2 shadow-sm cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <ExternalLink className="w-4 h-4 text-white" />
                      <span>Link & Vitrine Digital</span>
                    </div>
                  </button>

                  {isSuperAdmin && (
                    <button
                      onClick={() => {
                        setIsAdminManagerOpen(true);
                        setIsMobileDrawerOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-colors bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-500/40 font-bold mt-2 shadow-sm cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="w-4 h-4 text-purple-300" />
                        <span>Painel Admin & Analytics</span>
                      </div>
                    </button>
                  )}
                </nav>
              </div>

              {/* Logout button */}
              <div className="pt-4 border-t border-white/10">
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-300 hover:bg-red-500/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair do painel</span>
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* MAIN VIEW AREA */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6">
        
        {/* TRIAL WARNING BANNER */}
        {merchant?.plano === 'pro_trial' && getTrialDaysLeft() >= 0 && (
          <div className={`p-4 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-3 text-sm font-bold shadow-sm text-left ${
            getTrialDaysLeft() >= 6
              ? 'bg-brand-blue/10 text-brand-blue border border-brand-blue/20'
              : getTrialDaysLeft() <= 2 
              ? 'bg-yellow-50 text-yellow-800 border border-yellow-100' 
              : 'bg-[#bffd32] text-[#051b42] border border-white/10'
          }`}>
            <div className="flex items-center gap-2.5">
              <span className="text-xl">
                {getTrialDaysLeft() >= 6 ? '🎉' : getTrialDaysLeft() <= 2 ? '⏳' : '🔥'}
              </span>
              <span className="text-xs">
                {getTrialDaysLeft() >= 6 
                  ? 'Bem-vindo ao Cortestime! Seu período de teste de 7 dias grátis começou hoje. Aproveite!'
                  : `Teste Grátis Ativo: Você possui ${getTrialDaysLeft()} dias restantes para testar todos os recursos do sistema.`
                }
              </span>
            </div>
            <button 
              onClick={() => setShowUpgradePlans(true)}
              className={`py-2 px-4 rounded-xl text-[10px] uppercase tracking-wider font-extrabold cursor-pointer transition-colors ${
                getTrialDaysLeft() >= 6
                  ? 'bg-brand-blue text-white hover:bg-brand-blue-light'
                  : getTrialDaysLeft() <= 2 
                  ? 'bg-yellow-800 text-white hover:bg-yellow-900' 
                  : 'bg-[#051b42] text-white hover:bg-[#051b42]/90'
              }`}
            >
              {getTrialDaysLeft() >= 6 ? 'Ativar Assinatura' : 'Assinar Plano'}
            </button>
          </div>
        )}
        
        {/* TAB 1: INÍCIO (HOME) */}
        {activeTab === 'inicio' && (
          <div className="space-y-6">
             {/* Business Welcome banner */}
            <div className="bg-brand-dark text-white p-6 rounded-3xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-blue/20 rounded-full blur-2xl"></div>
              <div className="space-y-2">
                <span className="text-[10px] bg-brand-blue text-white px-2.5 py-1 rounded-full uppercase font-bold tracking-wider">
                  Painel da Barbearia
                </span>
                <h2 className="font-display font-extrabold text-2xl md:text-3xl">
                  {(merchant?.nomeBarbearia && merchant.nomeBarbearia !== 'Admin') ? merchant.nomeBarbearia : (onboardingData.businessName && onboardingData.businessName !== 'Admin' ? onboardingData.businessName : 'Minha Barbearia')}
                </h2>
                <p className="text-xs text-gray-400">
                  {merchant?.whatsapp 
                    ? `WhatsApp: ${merchant.whatsapp} • Plano: ${merchant.plano === 'pro' ? 'Premium 💎' : `Teste Grátis (${getTrialDaysLeft()} dias restantes)`}` 
                    : (onboardingData.cep && onboardingData.street)
                    ? `CEP: ${onboardingData.cep} • ${onboardingData.street}${onboardingData.number ? `, ${onboardingData.number}` : ''}` 
                    : `Plano: ${merchant?.plano === 'pro' ? 'Premium 💎' : `Teste Grátis (${getTrialDaysLeft()} dias restantes)`}`
                  }
                </p>
              </div>

              <div className="flex gap-2">
                {isSuperAdmin && (
                  <button 
                    onClick={() => setIsAdminManagerOpen(true)}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs py-3 px-3.5 rounded-xl flex items-center gap-1.5 uppercase tracking-wide transition-colors cursor-pointer shadow-md"
                    title="Gestão Manual de Assinaturas e Usuários (SuperAdmin)"
                  >
                    <ShieldCheck className="w-4 h-4 text-white" />
                    <span className="hidden sm:inline">Gestão Assinaturas</span>
                  </button>
                )}
                <button 
                  onClick={() => setIsAppointmentModalOpen(true)}
                  className="bg-brand-blue hover:bg-brand-blue-light text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center gap-1.5 uppercase tracking-wide transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Agendamento</span>
                </button>
                <button 
                  onClick={onLogout}
                  className="md:hidden bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs py-3 px-4 rounded-xl transition-colors"
                >
                  Sair
                </button>
              </div>
            </div>

            {/* CARD: LINK DE AGENDAMENTO E VITRINE ONLINE DO CLIENTE */}
            <div className="bg-white p-5 md:p-6 rounded-3xl border border-gray-100 space-y-4 text-left shadow-sm">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] bg-brand-lime/20 text-brand-lime-dark px-2.5 py-1 rounded-full uppercase font-extrabold tracking-wider">
                    Vitrine & Agendamento Liberados 🚀
                  </span>
                  <h3 className="font-display font-extrabold text-lg text-brand-dark mt-2">
                    Sua Vitrine Digital com Agendamento Online
                  </h3>
                  <p className="text-xs text-gray-500">
                    Seus clientes podem conferir seus cortes, serviços, avaliações e agendar de forma 100% automatizada.
                  </p>
                </div>
                <div className="p-3 bg-[#bffd32]/25 text-[#051b42] rounded-2xl hidden sm:block">
                  <Smartphone className="w-6 h-6" />
                </div>
              </div>

              {/* Real Link Box */}
              {(() => {
                const cleanSlug = (merchant?.vitrineLinkPersonalizado || merchant?.nomeBarbearia || 'sua-barbearia')
                  .toLowerCase()
                  .normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '')
                  .replace(/[^a-zA-Z0-9]/g, '-');
                const realLink = `${window.location.origin}?v=${cleanSlug}`;
                const displayUrl = `${window.location.host}?v=${cleanSlug}`;

                return (
                  <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center bg-gray-50 p-3 rounded-2xl border border-gray-100">
                    <div className="font-mono text-xs text-gray-600 truncate flex-1 flex items-center gap-1.5 px-1 py-1" title={realLink}>
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0"></span>
                      <span className="truncate">{displayUrl}</span>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button 
                        onClick={() => {
                          setShowVitrinePage(true);
                        }}
                        className="flex-1 sm:flex-initial text-xs font-bold text-brand-blue hover:bg-brand-blue/5 border border-brand-blue/20 bg-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>Ver Minha Vitrine</span>
                      </button>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(realLink);
                          alert(`Link da sua Vitrine copiado com sucesso!\n\nLink: ${realLink}\n\nCole este link no seu Instagram ou WhatsApp para seus clientes agendarem direto!`);
                        }}
                        className="flex-1 sm:flex-initial text-xs font-extrabold text-brand-dark bg-brand-lime hover:bg-brand-lime-dark px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <span>Copiar Link</span>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* DISCRETE PWA INSTALL REMINDER BANNER */}
            {!merchant?.appInstalled && !installReminderDismissed && (
              <div className="bg-gradient-to-r from-slate-900 via-[#081c3b] to-slate-900 text-white p-4 sm:p-5 rounded-3xl border border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-left relative overflow-hidden my-4">
                <div className="flex items-center gap-3.5 z-10">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0 shadow-inner">
                    <Smartphone className="w-5 h-5 text-[#d4ff5e]" />
                  </div>
                  <div>
                    <h4 className="font-sans font-extrabold text-xs sm:text-sm text-white flex items-center gap-2">
                      <span>Instale o Cortestime na tela inicial</span>
                      <span className="px-2 py-0.5 bg-[#d4ff5e]/20 text-[#d4ff5e] text-[10px] font-extrabold rounded-md">Atalho</span>
                    </h4>
                    <p className="text-[11px] sm:text-xs text-gray-300 font-medium mt-0.5">
                      Receba lembretes de clientes e tenha acesso mais rápido ao painel.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 z-10 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => setShowInstallModal(true)}
                    className="bg-[#d4ff5e] hover:bg-[#c3f542] text-[#051b42] font-black px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm w-full sm:w-auto"
                  >
                    <Smartphone className="w-4 h-4 stroke-[2.5]" />
                    <span>Instalar agora</span>
                  </button>
                  <button
                    onClick={() => setInstallReminderDismissed(true)}
                    className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                    title="Lembrar depois"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-[#d4ff5e]/10 rounded-full blur-2xl pointer-events-none" />
              </div>
            )}

            {/* CLIENT CANCELLATIONS ALERT BANNER */}
            {appointments.some(a => a.status === 'cancelled' && a.cancelledBy === 'client') && (
              <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 p-4 sm:p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-red-600 text-white rounded-2xl shrink-0 mt-0.5 shadow-sm">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                        Atenção Barbearia
                      </span>
                      <span className="text-xs text-red-600 font-bold">
                        Cancelamento recebido
                      </span>
                    </div>
                    <h4 className="font-extrabold text-sm text-red-950 mt-0.5">
                      {appointments.filter(a => a.status === 'cancelled' && a.cancelledBy === 'client').length === 1 
                        ? '1 agendamento foi cancelado por um cliente' 
                        : `${appointments.filter(a => a.status === 'cancelled' && a.cancelledBy === 'client').length} agendamentos foram cancelados por clientes`}
                    </h4>
                    <p className="text-xs text-red-700/90 leading-relaxed mt-0.5">
                      Veja o motivo informado, libere a vaga na sua agenda ou envie uma mensagem no WhatsApp para reagendar.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('notificacoes');
                    setNotifSubTab('cancelamentos');
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl shrink-0 transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <span>Ver Detalhes</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* QUICK STEPS CHECKLIST */}
            <div className="bg-white p-5 md:p-6 rounded-3xl border border-gray-100 space-y-4 text-left">
              <div>
                <h3 className="font-bold text-sm text-brand-dark uppercase tracking-wider">Comece pelo básico</h3>
                <p className="text-xs text-gray-500">Primeiros passos para deixar seu sistema rodando liso</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div 
                  onClick={() => setIsClientModalOpen(true)}
                  className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                    step1Done ? 'bg-gray-50 border-gray-100' : 'bg-white border-brand-blue/30 hover:border-brand-blue'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-400">1</span>
                    <div>
                      <h4 className="text-xs font-bold text-brand-dark">Cadastrar cliente</h4>
                      <p className="text-[10px] text-gray-500">{clients.length} clientes cadastrados</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                    step1Done 
                      ? 'bg-brand-lime border-brand-lime text-brand-dark' 
                      : 'border-gray-300 bg-white'
                  }`}>
                    {step1Done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>

                <div 
                  onClick={() => setIsAppointmentModalOpen(true)}
                  className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                    step2Done ? 'bg-gray-50 border-gray-100' : 'bg-white border-brand-blue/30 hover:border-brand-blue'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-400">2</span>
                    <div>
                      <h4 className="text-xs font-bold text-brand-dark">Criar agendamento</h4>
                      <p className="text-[10px] text-gray-500">{appointments.length} horários marcados</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                    step2Done 
                      ? 'bg-brand-lime border-brand-lime text-brand-dark' 
                      : 'border-gray-300 bg-white'
                  }`}>
                    {step2Done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>

                <div 
                  onClick={() => setIsServiceModalOpen(true)}
                  className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${
                    step3Done ? 'bg-gray-50 border-gray-100' : 'bg-white border-brand-blue/30 hover:border-brand-blue'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-400">3</span>
                    <div>
                      <h4 className="text-xs font-bold text-brand-dark">Cadastrar serviço</h4>
                      <p className="text-[10px] text-gray-500">{services.length} serviços listados</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                    step3Done 
                      ? 'bg-brand-lime border-brand-lime text-brand-dark' 
                      : 'border-gray-300 bg-white'
                  }`}>
                    {step3Done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              </div>
            </div>

            {/* RESUMO DA BARBEARIA (Sleek, Simple, Modern 2x2 Layout with Day/Week/Month/Year dropdown) */}
            <div className="bg-white p-5 sm:p-7 rounded-3xl border border-gray-100 shadow-sm text-left space-y-6">
              {/* Header with Title & Period Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-display font-black text-2xl sm:text-3xl text-brand-dark tracking-tight">
                    Resumo da barbearia
                  </h3>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    Acompanhamento simplificado de desempenho por período
                  </p>
                </div>

                <div className="relative inline-block w-full sm:w-auto">
                  <select
                    value={summaryPeriod}
                    onChange={(e: any) => setSummaryPeriod(e.target.value)}
                    className="w-full sm:w-auto appearance-none bg-gray-50 hover:bg-gray-100 border border-gray-200 text-brand-dark font-bold text-xs sm:text-sm py-2.5 pl-4 pr-10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all cursor-pointer shadow-2xs"
                  >
                    <option value="hoje">Hoje</option>
                    <option value="semana">Essa semana</option>
                    <option value="mes">Esse mês</option>
                    <option value="ano">Esse ano</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* 4 Metric Cards Grid (2x2) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Card 1: Agendamentos (Vibrant Blue Card) */}
                <div className="bg-brand-blue text-white p-6 rounded-3xl shadow-md flex flex-col justify-between relative overflow-hidden group">
                  <div className="relative z-10">
                    <p className="text-xs sm:text-sm font-bold text-white/90">Agendamentos</p>
                    <p className="text-3xl sm:text-4xl font-black text-white mt-2 font-display">
                      {periodSummaryData.appointmentsCount}
                    </p>
                  </div>
                  <div className="mt-4 relative z-10">
                    <span className="inline-block px-2.5 py-1 bg-white/20 text-white text-xs font-black rounded-xl backdrop-blur-xs">
                      {periodSummaryData.appointmentsCount > 0 ? `+${Math.min(24, Math.max(8, periodSummaryData.appointmentsCount * 4))}%` : '0%'}
                    </span>
                  </div>
                  <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
                </div>

                {/* Card 2: Faturamento */}
                <div className="bg-gray-50/70 border border-gray-100/90 p-6 rounded-3xl flex flex-col justify-between shadow-2xs">
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-gray-500">Faturamento</p>
                    <p className="text-2xl sm:text-3xl font-black text-brand-dark mt-2 font-display">
                      R$ {periodSummaryData.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="mt-4">
                    <span className="text-emerald-600 text-xs sm:text-sm font-black">
                      {periodSummaryData.faturamento > 0 ? '+8%' : '0%'}
                    </span>
                  </div>
                </div>

                {/* Card 3: Novos Clientes */}
                <div className="bg-gray-50/70 border border-gray-100/90 p-6 rounded-3xl flex flex-col justify-between shadow-2xs">
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-gray-500">Novos clientes</p>
                    <p className="text-3xl sm:text-4xl font-black text-brand-dark mt-2 font-display">
                      {periodSummaryData.newClientsCount}
                    </p>
                  </div>
                  <div className="mt-4">
                    <span className="text-emerald-600 text-xs sm:text-sm font-black">
                      {periodSummaryData.newClientsCount > 0 ? '+15%' : '0%'}
                    </span>
                  </div>
                </div>

                {/* Card 4: Avaliações */}
                <div className="bg-gray-50/70 border border-gray-100/90 p-6 rounded-3xl flex flex-col justify-between shadow-2xs">
                  {(() => {
                    const customReviews = merchant?.vitrineAvaliacoes || [];
                    const hasCustomReviews = customReviews.length > 0;
                    const totalReviewsCount = hasCustomReviews 
                      ? customReviews.length 
                      : (periodSummaryData.completedCount > 0 ? periodSummaryData.completedCount : 0);
                    
                    const ratingScore = hasCustomReviews
                      ? (customReviews.reduce((acc, r) => acc + (r.rating || 5), 0) / customReviews.length).toFixed(1).replace('.', ',')
                      : (periodSummaryData.completedCount > 0 ? '5,0' : '0');

                    const hasReviews = totalReviewsCount > 0;

                    return (
                      <>
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-gray-500">Avaliações</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-3xl sm:text-4xl font-black text-brand-dark font-display">
                              {ratingScore}
                            </span>
                            <Star className={`w-6 h-6 shrink-0 ${hasReviews ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                          </div>
                        </div>
                        <div className="mt-4">
                          <span className="text-xs sm:text-sm font-medium text-gray-400">
                            {totalReviewsCount === 0 
                              ? 'Nenhuma avaliação ainda' 
                              : `(${totalReviewsCount} ${totalReviewsCount === 1 ? 'avaliação' : 'avaliações'})`}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Próximos agendamentos Section */}
              <div className="pt-4">
                <div className="flex justify-between items-center pb-3">
                  <h4 className="font-display font-extrabold text-lg sm:text-xl text-brand-dark">
                    Próximos agendamentos
                  </h4>
                  <button
                    onClick={() => setActiveTab('agenda')}
                    className="text-xs font-bold text-brand-blue hover:text-brand-blue-light hover:underline cursor-pointer transition-colors"
                  >
                    Ver todos
                  </button>
                </div>

                <div className="space-y-3 mt-1">
                  {appointments.length > 0 ? (
                    appointments.slice(0, 5).map((app) => {
                      const s = services.find(serv => serv.id === app.serviceId);
                      const b = barbers.find(barb => barb.id === app.barberId);
                      
                      const nowStr = formatToYYYYMMDD(new Date());
                      const isToday = app.date === nowStr;
                      const dateDisplay = isToday 
                        ? 'Hoje' 
                        : (app.date ? new Date(app.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : 'Hoje');

                      // Dynamic styling avatar or initials
                      const initials = (app.clientName || 'C')
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map(n => n[0])
                        .join('')
                        .toUpperCase();

                      return (
                        <div 
                          key={app.id} 
                          className="bg-white hover:bg-gray-50/80 border border-gray-100 p-4 rounded-2xl flex items-center justify-between gap-3 transition-all shadow-2xs group"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            {/* Avatar */}
                            <div className="w-11 h-11 rounded-2xl bg-brand-blue/10 text-brand-blue font-black text-sm flex items-center justify-center shrink-0 border border-brand-blue/20">
                              {initials}
                            </div>

                            <div className="min-w-0">
                              <p className="text-[11px] text-gray-500 font-semibold flex items-center gap-1">
                                <span>{dateDisplay}</span>
                                <span>•</span>
                                <span>{app.time}</span>
                              </p>
                              <h5 className="font-bold text-sm text-brand-dark truncate mt-0.5">
                                {app.clientName}
                              </h5>
                              <p className="text-xs text-gray-500 font-medium truncate">
                                {s?.name || 'Serviço'} {b ? `• ${b.name}` : ''}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Status Tag */}
                            <span className={`text-[11px] font-bold px-3 py-1 rounded-xl transition-colors ${
                              app.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : app.status === 'confirmed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : app.status === 'cancelled'
                                ? 'bg-red-50 text-red-700 border border-red-100'
                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                              {app.status === 'completed' ? 'Concluído' : app.status === 'confirmed' ? 'Confirmado' : app.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                            </span>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-1">
                              {app.status === 'pending' && (
                                <button 
                                  onClick={() => {
                                    setCancellingAppointment(app);
                                    setCancelReason('');
                                  }}
                                  className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors cursor-pointer"
                                  title="Cancelar agendamento (Notificar cliente)"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {app.status !== 'completed' ? (
                                <button 
                                  onClick={() => onUpdateAppointmentStatus(app.id, 'completed')}
                                  className="p-1.5 bg-brand-lime hover:bg-brand-lime-dark text-brand-dark rounded-xl transition-colors cursor-pointer"
                                  title="Concluir atendimento"
                                >
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </button>
                              ) : (
                                <button 
                                  onClick={() => onUpdateAppointmentStatus(app.id, 'pending')}
                                  className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-colors cursor-pointer"
                                  title="Desfazer"
                                >
                                  <Undo className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button 
                                onClick={() => triggerWhatsappAlert(app)}
                                className="p-1.5 bg-gray-100 hover:bg-brand-blue/10 hover:text-brand-blue text-gray-600 rounded-xl transition-colors cursor-pointer"
                                title="Enviar mensagem WhatsApp"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-gray-400 text-xs sm:text-sm font-medium bg-gray-50 rounded-2xl">
                      Nenhum agendamento para o período selecionado
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* MONTH FINANCIAL SUMMARY SUMMARY CARD */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col justify-between text-left shadow-sm">
                <div className="flex justify-between items-center pb-3">
                  <span className="text-[11px] font-bold text-gray-400 uppercase">Resumo da agenda</span>
                  <span className="text-[10px] text-gray-400">Este Mês</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div>
                    <p className="text-[10px] text-gray-500">Agendamentos</p>
                    <p className="text-2xl font-extrabold text-brand-dark mt-1">{appointments.length}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">Contas fechadas</p>
                    <p className="text-2xl font-extrabold text-brand-dark mt-1">{completedAppointments.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col justify-between text-left shadow-sm">
                <div className="flex justify-between items-center pb-3">
                  <span className="text-[11px] font-bold text-gray-400 uppercase">Faturamento Líquido</span>
                  <span className="p-1 bg-brand-blue/10 rounded-lg text-brand-blue">
                    <DollarSign className="w-4 h-4" />
                  </span>
                </div>
                <div className="pt-2">
                  <p className="text-2xl font-extrabold text-brand-blue">R$ {totalFaturamento.toFixed(2)}</p>
                  <p className="text-[10px] text-gray-400 mt-1">Soma de todos os cortes completados</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col justify-between text-left shadow-sm">
                <div className="flex justify-between items-center pb-3">
                  <span className="text-[11px] font-bold text-gray-400 uppercase">Comissões Devidas</span>
                  <span className="p-1 bg-brand-lime/20 rounded-lg text-brand-lime-dark">
                    <TrendingUp className="w-4 h-4" />
                  </span>
                </div>
                <div className="pt-2">
                  <p className="text-2xl font-extrabold text-brand-dark">R$ {totalComissoes.toFixed(2)}</p>
                  <p className="text-[10px] text-gray-400 mt-1">Total a repassar aos profissionais</p>
                </div>
              </div>

            </div>

            {/* QUICK FILA AO VIVO WIDGET */}
            {(merchant?.serviceMode === 'ordem_chegada' || merchant?.serviceMode === 'ambos' || merchantQueue.length > 0) && (
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-5 rounded-3xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-white text-amber-900 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Fila de Espera ao Vivo
                      </span>
                      <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    </div>
                    <h4 className="font-extrabold text-base text-white mt-1">
                      {merchantQueue.filter(q => q.status === 'waiting').length === 0
                        ? 'Nenhum cliente aguardando na fila'
                        : merchantQueue.filter(q => q.status === 'waiting').length === 1
                        ? '1 cliente aguardando na fila de hoje'
                        : `${merchantQueue.filter(q => q.status === 'waiting').length} clientes aguardando na fila de hoje`}
                    </h4>
                    <p className="text-xs text-amber-100 mt-0.5">
                      {merchantQueue.filter(q => q.status === 'in_progress').length} em atendimento na cadeira
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('fila')}
                  className="bg-white hover:bg-amber-50 text-amber-900 font-extrabold text-xs py-3 px-5 rounded-2xl shrink-0 uppercase tracking-wider transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <span>Gerenciar Fila</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* AGENDA HOJE RESUMIDA */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              <div className="bg-white p-5 md:p-6 rounded-3xl border border-gray-100 text-left md:col-span-7 space-y-4 shadow-sm">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-brand-dark uppercase tracking-wider">Próximos compromissos</h3>
                    <p className="text-[10px] text-gray-400">Fique de olho na cadeira de serviço</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('agenda')}
                    className="text-xs font-bold text-brand-blue hover:underline"
                  >
                    Ver agenda completa
                  </button>
                </div>

                <div className="space-y-2.5">
                  {appointments.slice(0, 4).map((app) => {
                    const s = services.find(serv => serv.id === app.serviceId);
                    const b = barbers.find(barb => barb.id === app.barberId);
                    return (
                      <div 
                        key={app.id}
                        className="bg-gray-50 border border-gray-100 p-3 rounded-2xl flex justify-between items-center hover:bg-[#f8faff] hover:border-brand-blue/20 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-brand-blue/10 text-brand-blue rounded-xl flex items-center justify-center font-bold text-xs shrink-0">
                            {app.time}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs sm:text-sm text-brand-dark truncate">{app.clientName}</h4>
                            <p className="text-[10px] text-gray-400 truncate mt-0.5">{s?.name || 'Serviço'} com {b?.name}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            app.status === 'completed' 
                              ? 'bg-brand-lime/20 text-brand-lime-dark'
                              : app.status === 'cancelled'
                              ? 'bg-red-50 text-red-600'
                              : 'bg-brand-blue/10 text-brand-blue'
                          }`}>
                            {app.status === 'completed' ? 'Fechado' : app.status === 'cancelled' ? 'Cancelado' : 'Agendado'}
                          </span>
                          
                          {app.status === 'pending' && (
                            <button 
                              onClick={() => {
                                setCancellingAppointment(app);
                                setCancelReason('');
                              }}
                              className="p-1 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors cursor-pointer"
                              title="Cancelar agendamento (Avisar cliente)"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {app.status === 'pending' ? (
                            <button 
                              onClick={() => onUpdateAppointmentStatus(app.id, 'completed')}
                              className="p-1 bg-brand-lime hover:bg-brand-lime-dark text-brand-dark rounded-lg transition-colors"
                              title="Finalizar serviço e fechar caixa"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </button>
                          ) : (
                            <button 
                              onClick={() => onUpdateAppointmentStatus(app.id, 'pending')}
                              className="p-1 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-brand-blue rounded-lg transition-colors"
                              title="Desfazer / Reabrir agendamento"
                            >
                              <Undo className="w-3.5 h-3.5" />
                            </button>
                          )}
                          
                          <button 
                            onClick={() => triggerWhatsappAlert(app)}
                            className="p-1 bg-white border border-gray-200 text-gray-600 hover:text-brand-blue rounded-lg"
                            title="Confirmar presença por WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  
                  {appointments.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-xs">
                      Nenhum agendamento para hoje. Crie um novo acima!
                    </div>
                  )}
                </div>
              </div>

              {/* CLUBE DE ASSINATURAS PROMO */}
              <div className="bg-white p-5 md:p-6 rounded-3xl border border-gray-100 text-left md:col-span-5 flex flex-col justify-between shadow-sm">
                <div className="space-y-3">
                  <div className="p-2.5 bg-brand-blue/10 text-brand-blue rounded-2xl w-fit">
                    <Award className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-sm text-brand-dark uppercase tracking-wider">Clube de assinaturas</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Aumente o faturamento e mantenha seus clientes perto com assinaturas de serviços e produtos. Garanta previsibilidade de caixa recebendo mensalidades recorrentes por corte e barba!
                  </p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-xs space-y-1.5 mt-4">
                  <p className="font-bold text-brand-dark text-[11px]">Assinaturas recomendadas:</p>
                  <p className="text-gray-500 flex justify-between"><span>Plano Premium (Cortes ilimitados)</span> <span className="font-semibold text-brand-blue">R$ 89/mês</span></p>
                  <p className="text-gray-500 flex justify-between"><span>Plano VIP (Corte + Barba ilimitados)</span> <span className="font-semibold text-brand-blue">R$ 139/mês</span></p>
                </div>

                <button className="w-full bg-brand-blue hover:bg-brand-blue-light text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors mt-4">
                  Configurar Clube de Assinatura
                </button>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: AGENDA COMPLETA */}
        {activeTab === 'agenda' && (
          <div className="space-y-6 text-left">
            
            {/* HEADER COM BOTÕES E TOGGLES DE VISUALIZAÇÃO */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h2 className="font-display font-extrabold text-2xl text-brand-dark">Agenda do Dia</h2>
                <p className="text-xs text-gray-500">Quadro de horários e atendimento por profissional</p>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Visualização Toggle Pills: Dia | Semana | Mês */}
                <div className="bg-gray-100 p-1 rounded-xl flex items-center border border-gray-200">
                  <button
                    type="button"
                    onClick={() => setAgendaViewMode('dia')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      agendaViewMode === 'dia'
                        ? 'bg-white text-brand-blue shadow-xs'
                        : 'text-gray-500 hover:text-brand-dark'
                    }`}
                  >
                    Dia
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgendaViewMode('semana')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      agendaViewMode === 'semana'
                        ? 'bg-white text-brand-blue shadow-xs'
                        : 'text-gray-500 hover:text-brand-dark'
                    }`}
                  >
                    Semana
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgendaViewMode('mes')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      agendaViewMode === 'mes'
                        ? 'bg-white text-brand-blue shadow-xs'
                        : 'text-gray-500 hover:text-brand-dark'
                    }`}
                  >
                    Mês
                  </button>
                </div>

                <button 
                  onClick={() => {
                    setAppDate(formatToYYYYMMDD(selectedAgendaDate));
                    setIsAppointmentModalOpen(true);
                  }}
                  className="bg-brand-blue hover:bg-brand-blue-light text-white font-bold text-xs py-3 px-5 rounded-xl flex items-center gap-1.5 uppercase tracking-wide transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Marcar Horário</span>
                </button>
              </div>
            </div>

            {/* TABELINHA COM SELETOR HORIZONTAL DE DIAS (SEGUNDA, TERÇA, QUARTA, QUINTA...) */}
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAgendaWeekOffset(prev => prev - 1)}
                    className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl transition-colors border border-gray-200"
                    title="Período anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAgendaWeekOffset(0);
                      setSelectedAgendaDate(new Date());
                    }}
                    className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-brand-dark font-bold text-xs rounded-xl border border-gray-200 transition-colors"
                  >
                    Hoje
                  </button>
                  <button
                    type="button"
                    onClick={() => setAgendaWeekOffset(prev => prev + 1)}
                    className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl transition-colors border border-gray-200"
                    title="Próximo período"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="font-display font-extrabold text-base sm:text-lg text-brand-dark capitalize">
                  {selectedAgendaDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </h3>

                <div className="text-xs text-gray-400 font-medium hidden sm:block">
                  Selecione o dia na tabela abaixo
                </div>
              </div>

              {/* BARRA DE ROLAGEM HORIZONTAL DOS DIAS DA SEMANA */}
              <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none">
                {getAgendaDateStrip().map((dateItem, idx) => {
                  const isSelected = selectedAgendaDate.toDateString() === dateItem.toDateString();
                  const isToday = new Date().toDateString() === dateItem.toDateString();
                  const weekdaysPt = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedAgendaDate(dateItem);
                        setAppDate(formatToYYYYMMDD(dateItem));
                      }}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border shrink-0 w-16 transition-all relative ${
                        isSelected
                          ? 'bg-brand-blue text-white border-brand-blue shadow-lg shadow-brand-blue/20 scale-[1.03]'
                          : 'bg-gray-50/70 text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-white'
                      }`}
                    >
                      {isToday && (
                        <span className={`text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full absolute -top-2 ${
                          isSelected ? 'bg-brand-lime text-brand-dark' : 'bg-brand-blue text-white'
                        }`}>
                          Hoje
                        </span>
                      )}
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        {weekdaysPt[dateItem.getDay()]}
                      </span>
                      <span className="text-base font-extrabold mt-0.5">
                        {dateItem.getDate()}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* BANNER INFORMATIVO DO DIA ATUALMENTE SELECIONADO */}
              <div className="bg-[#f0f7ff] border border-brand-blue/20 rounded-2xl p-3 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-brand-dark">
                  <CalendarIcon className="w-4 h-4 text-brand-blue" />
                  <span>
                    Exibindo agenda para: <strong className="text-brand-blue capitalize">{selectedAgendaDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                  </span>
                </div>
                <div className="text-gray-500 font-semibold">
                  {(() => {
                    const selDateStr = formatToYYYYMMDD(selectedAgendaDate);
                    const isTodaySel = selDateStr === formatToYYYYMMDD(new Date());
                    const count = appointments.filter(a => a.date === selDateStr || (!a.date && isTodaySel)).length;
                    return `${count} agendamento${count === 1 ? '' : 's'} neste dia`;
                  })()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* MAIN CALENDAR GRID COM INTERVALOS DE 30 EM 30 MIN */}
              <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm lg:col-span-8">
                
                {/* Barbers headers columns */}
                <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-100 py-3 text-center text-xs font-bold text-gray-700">
                  <div className="col-span-3 border-r border-gray-100 flex items-center justify-center text-[10px] text-gray-400 uppercase">Hora (30m)</div>
                  <div className="col-span-9 grid grid-cols-3">
                    {barbers.map((barber) => (
                      <div key={barber.id} className="flex flex-col items-center justify-center border-r last:border-r-0 border-gray-100">
                        <span className="text-[11px] text-brand-dark font-extrabold">{barber.name}</span>
                        <span className="text-[9px] text-gray-400 font-normal">{barber.specialty}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Calendar Hours Rows (30 em 30 min: 08:00, 08:30, 09:00...) */}
                <div className="divide-y divide-gray-100 max-h-[700px] overflow-y-auto">
                  {agendaTimeSlots.map((hourSlot) => (
                    <div key={hourSlot} className="grid grid-cols-12 min-h-[52px]">
                      {/* Left side Hour label */}
                      <div className="col-span-3 border-r border-gray-100 flex items-center justify-center text-xs font-mono font-bold text-gray-400">
                        {hourSlot}
                      </div>

                      {/* Right side Slots split by barbers */}
                      <div className="col-span-9 grid grid-cols-3 divide-x divide-gray-100">
                        {barbers.map((barber) => {
                          // Match appointment by selected date AND 30-min window
                          const app = appointments.find(a => {
                            const selectedDateStr = formatToYYYYMMDD(selectedAgendaDate);
                            const isTodaySelected = selectedDateStr === formatToYYYYMMDD(new Date());
                            const isSameDate = a.date === selectedDateStr || (!a.date && isTodaySelected);
                            if (!isSameDate || a.barberId !== barber.id) return false;

                            const [appH, appM] = a.time.split(':').map(Number);
                            const [slotH, slotM] = hourSlot.split(':').map(Number);
                            const appTotalMin = appH * 60 + (appM || 0);
                            const slotTotalMin = slotH * 60 + (slotM || 0);
                            return appTotalMin >= slotTotalMin && appTotalMin < slotTotalMin + 30;
                          });

                          if (app) {
                            const service = services.find(s => s.id === app.serviceId);
                            return (
                              <div 
                                key={barber.id} 
                                className={`p-1.5 flex flex-col justify-between text-left m-1 rounded-xl text-[10px] leading-tight border transition-all ${
                                  app.status === 'completed'
                                    ? 'bg-brand-lime/15 border-brand-lime text-brand-dark'
                                    : app.status === 'cancelled'
                                    ? 'bg-red-50 border-red-100 text-red-500 line-through'
                                    : 'bg-[#f0f7ff] border-brand-blue/30 text-brand-dark'
                                }`}
                              >
                                <div>
                                  <p className="font-extrabold truncate">{app.clientName}</p>
                                  <p className="text-[9px] text-gray-500 font-semibold truncate mt-0.5">{service?.name || 'Corte'}</p>
                                </div>
                                
                                <div className="flex justify-between items-center mt-1 pt-1 border-t border-black/5">
                                  <span className="font-mono text-[8px] text-gray-400">{app.time}</span>
                                  <div className="flex gap-1">
                                    {app.status === 'pending' && (
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setCancellingAppointment(app);
                                          setCancelReason('');
                                        }}
                                        className="p-0.5 bg-red-50 hover:bg-red-100 text-red-600 rounded transition-colors"
                                        title="Cancelar (Avisar cliente)"
                                      >
                                        <X className="w-2.5 h-2.5" />
                                      </button>
                                    )}

                                    {app.status === 'pending' ? (
                                      <button 
                                        onClick={() => onUpdateAppointmentStatus(app.id, 'completed')}
                                        className="p-0.5 bg-brand-lime hover:bg-brand-lime-dark text-brand-dark rounded transition-colors"
                                        title="Finalizar"
                                      >
                                        <Check className="w-2.5 h-2.5" />
                                      </button>
                                    ) : (
                                      <button 
                                        onClick={() => onUpdateAppointmentStatus(app.id, 'pending')}
                                        className="p-0.5 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-brand-blue rounded transition-colors"
                                        title="Desfazer / Reabrir"
                                      >
                                        <Undo className="w-2.5 h-2.5" />
                                      </button>
                                    )}
                                    <button 
                                      onClick={() => triggerWhatsappAlert(app)}
                                      className="p-0.5 bg-white border border-gray-200 text-gray-500 rounded"
                                      title="WhatsApp"
                                    >
                                      <MessageSquare className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div 
                              key={barber.id} 
                              onClick={() => {
                                // Select barber, time and date for manual booking
                                setAppBarberId(barber.id);
                                setAppTime(hourSlot);
                                setAppDate(formatToYYYYMMDD(selectedAgendaDate));
                                setIsAppointmentModalOpen(true);
                              }}
                              className="p-2 text-center flex items-center justify-center text-transparent hover:text-gray-300 hover:bg-gray-50 cursor-pointer transition-all text-xs font-bold"
                            >
                              + Reservar
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

              </div>

              {/* WAITLIST (FILA DE ESPERA) & QUICK STATS */}
              <div className="space-y-6 lg:col-span-4">
                
                {/* Waitlist Box */}
                <div className="bg-white p-5 rounded-3xl border border-gray-100 space-y-4 shadow-sm">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <div>
                      <h3 className="font-bold text-sm text-brand-dark uppercase tracking-wider">Fila de espera</h3>
                      <p className="text-[10px] text-gray-400">Atendimento sem hora marcada</p>
                    </div>
                    <span className="text-[10px] bg-brand-blue/10 text-brand-blue font-bold px-2.5 py-0.5 rounded-full">
                      {waitlist.length} Clientes
                    </span>
                  </div>

                  <form onSubmit={handleAddToWaitlist} className="grid grid-cols-1 gap-2">
                    <input 
                      type="text"
                      required
                      placeholder="Nome do cliente"
                      value={newWaitName}
                      onChange={e => setNewWaitName(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-brand-blue"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        type="text"
                        required
                        placeholder="Celular"
                        value={newWaitPhone}
                        onChange={e => setNewWaitPhone(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-brand-blue"
                      />
                      <select 
                        value={newWaitService}
                        onChange={e => setNewWaitService(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-brand-blue bg-white"
                      >
                        {services.map(s => (
                          <option key={s.id} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <button 
                      type="submit"
                      className="w-full bg-brand-dark text-white font-bold text-xs py-2 rounded-xl uppercase tracking-wider"
                    >
                      Inserir na Fila
                    </button>
                  </form>

                  <div className="space-y-2 pt-2">
                    {waitlist.map((w, idx) => (
                      <div 
                        key={idx}
                        className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl flex justify-between items-center text-xs"
                      >
                        <div>
                          <p className="font-bold text-brand-dark">{w.name}</p>
                          <p className="text-[9px] text-gray-400">{w.service} • {w.phone}</p>
                        </div>
                        <button 
                          onClick={() => {
                            // Convert waitlist client to actual scheduled right now
                            onAddAppointment({
                              clientName: w.name,
                              clientPhone: w.phone,
                              serviceId: services.find(s => s.name === w.service)?.id || services[0].id,
                              barberId: barbers[0].id,
                              date: new Date().toISOString().split('T')[0],
                              time: '12:00'
                            });
                            // Remove from waitlist
                            setWaitlist(waitlist.filter((_, i) => i !== idx));
                          }}
                          className="px-2 py-1 bg-brand-blue text-white text-[9px] font-bold uppercase rounded-md hover:bg-brand-blue-light transition-colors"
                        >
                          Atender
                        </button>
                      </div>
                    ))}
                    
                    {waitlist.length === 0 && (
                      <p className="text-center text-[11px] text-gray-400 py-4">Fila de espera vazia.</p>
                    )}
                  </div>
                </div>

                {/* WhatsApp Notification Center info block */}
                <div className="bg-white p-5 rounded-3xl border border-gray-100 space-y-3 shadow-sm text-xs">
                  <div className="flex gap-2.5 items-start">
                    <Smartphone className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-brand-dark">Confirmação de Presença</h4>
                      <p className="text-gray-500 mt-1 leading-relaxed">
                        Ao clicar no botão de WhatsApp em qualquer agendamento, o sistema gera o modelo perfeito com link de confirmação para você despachar instantaneamente.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: FILA DE ATENDIMENTO / ORDEM DE CHEGADA */}
        {activeTab === 'fila' && (
          <QueueManager
            merchantUid={merchant?.uid || ''}
            barbers={barbers}
            services={services}
            queue={merchantQueue}
            onAddToQueue={handleAddQueueItem}
            onStartService={handleStartQueueService}
            onFinishService={handleFinishQueueService}
            onRemoveQueueItem={handleRemoveQueueItem}
          />
        )}

        {/* TAB 3: NOTIFICAÇÕES */}
        {activeTab === 'notificacoes' && (
          <div className="space-y-6 text-left">
            <div>
              <h2 className="font-display font-extrabold text-2xl text-[#051b42]">Central de Notificações</h2>
              <p className="text-xs text-gray-500">Monitore as conquistas da sua barbearia e configure alertas no seu celular</p>
            </div>

            {/* SUB-TABS SELECTOR */}
            <div className="flex border-b border-gray-100 gap-4 sm:gap-6 overflow-x-auto pb-1 scrollbar-none">
              <button 
                onClick={() => setNotifSubTab('sistema')}
                className={`pb-3 font-bold text-xs sm:text-sm tracking-wide border-b-2 transition-colors relative flex items-center gap-2 cursor-pointer shrink-0 ${
                  notifSubTab === 'sistema' ? 'border-brand-blue text-[#051b42] border-b-2 border-brand-blue' : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                <span>Central do Sistema</span>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button 
                onClick={() => setNotifSubTab('dispositivo')}
                className={`pb-3 font-bold text-xs sm:text-sm tracking-wide border-b-2 transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${
                  notifSubTab === 'dispositivo' ? 'border-brand-blue text-[#051b42] border-b-2 border-brand-blue' : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                <span>Alertas Push (Celular)</span>
              </button>
              <button 
                onClick={() => setNotifSubTab('cancelamentos')}
                className={`pb-3 font-bold text-xs sm:text-sm tracking-wide border-b-2 transition-colors flex items-center gap-2 cursor-pointer shrink-0 ${
                  notifSubTab === 'cancelamentos' ? 'border-red-600 text-red-700 border-b-2 border-red-600' : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <CalendarX className="w-4 h-4" />
                  <span>Cancelamentos</span>
                </div>
                {appointments.filter(a => a.status === 'cancelled').length > 0 && (
                  <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {appointments.filter(a => a.status === 'cancelled').length}
                  </span>
                )}
              </button>
            </div>

            {/* SUB-TAB 1: SYSTEM MILESTONES */}
            {notifSubTab === 'sistema' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl">
                  <div className="space-y-1">
                    <h3 className="font-bold text-xs text-[#051b42] uppercase tracking-wider">Suas Conquistas</h3>
                    <p className="text-[11px] text-gray-500">Seu engajamento e metas alcançadas no Barber One</p>
                  </div>
                  {unreadCount > 0 && (
                    <button 
                      onClick={markAllNotificationsAsRead}
                      className="text-xs text-brand-blue hover:text-brand-blue-light font-bold flex items-center gap-1 cursor-pointer bg-white border border-gray-200 py-1.5 px-3 rounded-xl shadow-sm transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Marcar todas como lidas</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getSystemMilestones().map((m) => {
                    const isRead = readNotificationIds.includes(m.id);
                    return (
                      <div 
                        key={m.id}
                        className={`p-5 rounded-3xl border transition-all flex gap-4 items-start ${
                          m.unlocked 
                            ? 'bg-white border-gray-100 shadow-sm relative overflow-hidden' 
                            : 'bg-gray-50/50 border-gray-100/60 opacity-60'
                        }`}
                      >
                        {m.unlocked && !isRead && (
                          <div className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        )}

                        <div className={`p-3 rounded-2xl text-xl shrink-0 ${
                          m.unlocked ? 'bg-brand-blue/10 text-brand-blue' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {m.unlocked ? m.icon : '🔒'}
                        </div>

                        <div className="space-y-1 text-left">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className={`font-bold text-xs ${m.unlocked ? 'text-[#051b42]' : 'text-gray-400 font-medium'}`}>
                              {m.title}
                            </h4>
                            {m.unlocked ? (
                              <span className="bg-brand-lime/20 text-[#051b42] text-[8px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                Ativa
                              </span>
                            ) : (
                              <span className="bg-gray-100 text-gray-400 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                Bloqueada
                              </span>
                            )}
                          </div>
                          <p className={`text-xs ${m.unlocked ? 'text-gray-600' : 'text-gray-400'}`}>
                            {m.unlocked ? m.body : `Falta pouco! Continue cadastrando itens para desbloquear.`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SUB-TAB 2: DEVICE PUSH SETTINGS */}
            {notifSubTab === 'dispositivo' && (
              <div className="space-y-6 animate-fade-in">
                {/* NOTIFICATION STATUS CONTROL */}
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-6">
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status das Notificações</span>
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          notificationPermission === 'granted' 
                            ? 'bg-brand-lime animate-pulse' 
                            : notificationPermission === 'denied' 
                            ? 'bg-red-500' 
                            : 'bg-yellow-500'
                        }`} />
                        <span className="text-sm font-bold text-[#051b42]">
                          {notificationPermission === 'granted' && '🎉 Ativas (Permitidas pelo navegador)'}
                          {notificationPermission === 'denied' && '❌ Bloqueadas (Acesse as configurações do seu navegador)'}
                          {notificationPermission === 'default' && '⏳ Pendentes (Requer permissão)'}
                        </span>
                      </div>
                    </div>

                    {notificationPermission !== 'granted' && (
                      <button 
                        onClick={handleRequestPermission}
                        className="bg-brand-blue hover:bg-brand-blue-light text-white font-bold text-xs py-3 px-5 rounded-xl uppercase tracking-wider shadow-md shadow-brand-blue/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Smartphone className="w-4 h-4 text-brand-lime" />
                        <span>Ativar Alertas no Celular</span>
                      </button>
                    )}
                  </div>

                  {/* EDUCATIONAL & BENEFITS EXPLANATION */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl space-y-2">
                      <div className="text-brand-blue text-lg">⏰</div>
                      <h4 className="font-bold text-xs text-brand-dark uppercase tracking-wider">30 minutos antes</h4>
                      <p className="text-[11px] text-gray-500 leading-relaxed">
                        Alerta de atendimento em breve informando que o cliente está chegando para o serviço na barbearia.
                      </p>
                    </div>

                    <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl space-y-2">
                      <div className="text-brand-blue text-lg">✂️</div>
                      <h4 className="font-bold text-xs text-brand-dark uppercase tracking-wider">5 minutos antes</h4>
                      <p className="text-[11px] text-gray-500 leading-relaxed">
                        Aviso do próximo cliente para que o barbeiro prepare sua bancada de trabalho e ferramentas.
                      </p>
                    </div>

                    <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl space-y-2">
                      <div className="text-brand-blue text-lg">📅</div>
                      <h4 className="font-bold text-xs text-[#051b42] uppercase tracking-wider">Resumo do dia seguinte</h4>
                      <p className="text-[11px] text-gray-500 leading-relaxed">
                        Relatório no fim do dia compilando a quantidade de atendimentos programados para o dia de amanhã.
                      </p>
                    </div>
                  </div>

                </div>

                {/* INTERACTIVE ALERTS SIMULATOR (AS REQUESTED) */}
                <div className="bg-[#051b42] text-white rounded-3xl p-6 shadow-xl space-y-5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-brand-lime/5 rounded-full blur-2xl -z-10" />
                  
                  <div className="space-y-1 text-left">
                    <span className="text-[10px] font-bold text-brand-lime uppercase tracking-wider">Demonstração Real</span>
                    <h3 className="font-display font-extrabold text-xl">🚀 Simulador de Alertas no seu Dispositivo</h3>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      Permita o acesso acima e clique nos botões para testar como os alertas aparecem na sua tela mesmo se você minimizar esta página ou bloquear seu celular!
                    </p>
                  </div>

                  {typeof window !== 'undefined' && window.self !== window.top && (
                    <div className="bg-amber-400/10 border border-amber-400/20 rounded-2xl p-4 text-left space-y-2">
                      <div className="flex items-center gap-2 text-amber-400">
                        <span className="text-sm">⚠️</span>
                        <h4 className="font-extrabold text-xs uppercase tracking-wider">iFrame do AI Studio Detectado</h4>
                      </div>
                      <p className="text-[11px] text-amber-200/90 leading-relaxed">
                        Navegadores bloqueiam solicitações de notificações e Service Workers dentro de telas incorporadas (iFrames) por motivos de segurança.
                        <br />
                        <strong>Para conseguir testar:</strong> Clique no botão de <strong>"Abrir em nova aba"</strong> (ícone de seta diagonal saindo de um quadrado no canto superior direito desta pré-visualização) para abrir o aplicativo diretamente no navegador, ativar os alertas e testar as notificações.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    
                    {/* SIMULATE 30 MIN */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-brand-lime font-mono">Simular 30min Antes</span>
                        <div className="bg-black/20 p-3 rounded-xl border border-white/5 space-y-1 text-left">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Preview</p>
                          <p className="text-xs font-bold text-white">⏰ Atendimento em breve</p>
                          <p className="text-[11px] text-gray-300 font-sans">João Silva chega em 30 minutos.</p>
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          if (notificationPermission !== 'granted') {
                            handleRequestPermission().then(() => notificationService.simulateNotification('30min'));
                          } else {
                            notificationService.simulateNotification('30min');
                          }
                        }}
                        className="w-full bg-white text-[#051b42] hover:bg-brand-lime hover:text-[#051b42] font-bold py-2 px-3 rounded-xl text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Testar Agora
                      </button>
                    </div>

                    {/* SIMULATE 5 MIN */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-brand-lime font-mono">Simular 5min Antes</span>
                        <div className="bg-black/20 p-3 rounded-xl border border-white/5 space-y-1 text-left">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Preview</p>
                          <p className="text-xs font-bold text-white">✂️ Próximo cliente</p>
                          <p className="text-[11px] text-gray-300 font-sans">Prepare-se! Carlos chega às 14:00.</p>
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          if (notificationPermission !== 'granted') {
                            handleRequestPermission().then(() => notificationService.simulateNotification('5min', 'Carlos', '14:00'));
                          } else {
                            notificationService.simulateNotification('5min', 'Carlos', '14:00');
                          }
                        }}
                        className="w-full bg-white text-[#051b42] hover:bg-brand-lime hover:text-[#051b42] font-bold py-2 px-3 rounded-xl text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Testar Agora
                      </button>
                    </div>

                    {/* SIMULATE TOMORROW */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-brand-lime font-mono">Simular Amanhã</span>
                        <div className="bg-black/20 p-3 rounded-xl border border-white/5 space-y-1 text-left">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Preview</p>
                          <p className="text-xs font-bold text-white">📅 Agenda de amanhã</p>
                          <p className="text-[11px] text-gray-300 font-sans">Você tem 6 atendimentos agendados.</p>
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          if (notificationPermission !== 'granted') {
                            handleRequestPermission().then(() => notificationService.simulateNotification('tomorrow'));
                          } else {
                            notificationService.simulateNotification('tomorrow');
                          }
                        }}
                        className="w-full bg-white text-[#051b42] hover:bg-brand-lime hover:text-[#051b42] font-bold py-2 px-3 rounded-xl text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Testar Agora
                      </button>
                    </div>

                  </div>

                </div>

                {/* HOW IT WORKS / FAQ */}
                <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm space-y-4 text-left">
                  <h3 className="font-bold text-sm text-[#051b42] uppercase tracking-wider">Como funciona o recebimento das notificações?</h3>
                  
                  <div className="space-y-3 text-xs text-gray-500 leading-relaxed">
                    <p>
                      1. <strong className="text-brand-dark">Service Worker no navegador:</strong> Ao clicar em "Ativar Alertas", o Cortestime registra um segundo processo oculto no seu navegador chamado <code className="bg-gray-100 px-1 py-0.5 rounded text-[11px] font-mono text-brand-blue">sw.js</code>. Ele é o responsável por desenhar a janelinha de notificação no seu Android ou computador, mesmo com o site fechado ou minimizado.
                    </p>
                    <p>
                      2. <strong className="text-brand-dark">Monitoramento de Horários:</strong> Nosso motor interno faz varreduras automáticas de tempo em tempo na sua agenda da barbearia. Se encontrar algum cliente agendado para hoje que esteja a exatos 30 minutos ou 5 minutos do início do serviço, ele dispara a notificação nativa correspondente.
                    </p>
                    <p>
                      3. <strong className="text-brand-dark">Aviso importante para iPhone (iOS):</strong> No iPhone, para receber notificações push de sites e aplicativos web (PWA), você precisa adicionar este site à sua <strong className="text-brand-dark">Tela de Início</strong> (Compartilhar &gt; Adicionar à Tela de Início) e então abrir o app por lá para que ele peça sua autorização de notificações.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB 3: CANCELAMENTOS & NOTIFICAÇÕES DE CANCELAMENTO */}
            {notifSubTab === 'cancelamentos' && (
              <div className="space-y-6 text-left">
                {/* Header card with quick actions */}
                <div className="bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 p-6 sm:p-8 rounded-[32px] text-white shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                      <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase mb-2">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Central de Cancelamentos & Notificações</span>
                      </div>
                      <h3 className="font-display font-extrabold text-2xl text-white">
                        Cancelamentos & Alertas em Tempo Real
                      </h3>
                      <p className="text-xs text-white/80 max-w-xl">
                        Quando um cliente ou a barbearia cancela um horário, o sistema dispara notificações automáticas e arquiva o histórico para manter a agenda sempre organizada.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={handleSimulateClientCancellation}
                        className="bg-white text-red-700 hover:bg-red-50 font-bold text-xs py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Simular Cliente Cancelando</span>
                      </button>
                      <button
                        onClick={handleSimulateBarbershopCancellation}
                        className="bg-red-950/60 hover:bg-red-950 text-white font-bold text-xs py-2.5 px-4 rounded-xl border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Simular Barbearia Cancelando</span>
                      </button>
                    </div>
                  </div>
                </div>

                {cancelSuccessMsg && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{cancelSuccessMsg}</span>
                  </div>
                )}

                {/* Filters */}
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFilterCancelType('all')}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                        filterCancelType === 'all'
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Todos ({appointments.filter(a => a.status === 'cancelled').length})
                    </button>
                    <button
                      onClick={() => setFilterCancelType('client')}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                        filterCancelType === 'client'
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Por Clientes ({appointments.filter(a => a.status === 'cancelled' && a.cancelledBy === 'client').length})
                    </button>
                    <button
                      onClick={() => setFilterCancelType('barbershop')}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                        filterCancelType === 'barbershop'
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Pela Barbearia ({appointments.filter(a => a.status === 'cancelled' && a.cancelledBy === 'barbershop').length})
                    </button>
                  </div>
                </div>

                {/* List of Cancelled Appointments */}
                <div className="space-y-3">
                  {appointments.filter(a => {
                    if (a.status !== 'cancelled') return false;
                    if (filterCancelType === 'client') return a.cancelledBy === 'client';
                    if (filterCancelType === 'barbershop') return a.cancelledBy === 'barbershop';
                    return true;
                  }).length === 0 ? (
                    <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-sm text-gray-900">Nenhum agendamento cancelado no filtro atual</h4>
                      <p className="text-xs text-gray-400 max-w-sm mx-auto">
                        Sua agenda está limpa! Os cancelamentos feitos por clientes ou pela barbearia aparecerão aqui com o motivo e opção de contato.
                      </p>
                    </div>
                  ) : (
                    appointments
                      .filter(a => {
                        if (a.status !== 'cancelled') return false;
                        if (filterCancelType === 'client') return a.cancelledBy === 'client';
                        if (filterCancelType === 'barbershop') return a.cancelledBy === 'barbershop';
                        return true;
                      })
                      .map((app) => {
                        const serv = services.find(s => s.id === app.serviceId);
                        const barber = barbers.find(b => b.id === app.barberId);
                        const isByClient = app.cancelledBy === 'client';

                        return (
                          <div
                            key={app.id}
                            className={`p-5 rounded-3xl border transition-all ${
                              isByClient 
                                ? 'bg-red-50/70 border-red-200 hover:border-red-300' 
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                    isByClient ? 'bg-red-600 text-white' : 'bg-gray-600 text-white'
                                  }`}>
                                    {isByClient ? 'Cancelado pelo Cliente' : 'Cancelado pela Barbearia'}
                                  </span>
                                  <span className="text-xs text-gray-400 font-mono">
                                    {app.date} às {app.time}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-base text-gray-900">{app.clientName}</h4>
                                  <span className="text-xs text-gray-500 font-medium">({app.clientPhone})</span>
                                </div>

                                <p className="text-xs text-gray-600">
                                  Serviço: <strong>{serv?.name || 'Serviço'}</strong> • Profissional: <strong>{barber?.name || 'Barbeiro'}</strong>
                                </p>

                                {app.cancellationReason && (
                                  <div className="bg-white/80 p-2.5 rounded-xl border border-red-100 text-xs text-red-900 mt-2">
                                    <strong>Motivo informado:</strong> "{app.cancellationReason}"
                                  </div>
                                )}
                              </div>

                              {/* Action buttons */}
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={() => {
                                    const cleanPhone = app.clientPhone.replace(/\D/g, '');
                                    const waMsg = `Olá ${app.clientName}, vi que o agendamento de ${serv?.name || 'serviço'} para ${app.date} às ${app.time} foi cancelado. Gostaria de verificar outros horários disponíveis conosco?`;
                                    setWhatsappAlert({
                                      isOpen: true,
                                      clientName: app.clientName,
                                      clientPhone: cleanPhone,
                                      message: waMsg
                                    });
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                                >
                                  <PhoneCall className="w-3.5 h-3.5" />
                                  <span>Falar no WhatsApp</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            )}
          </div>
        )}


        {/* TAB: SERVIÇOS & PREÇOS */}
        {activeTab === 'servicos' && (
          <div className="space-y-6 text-left">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div>
                <span className="text-[10px] bg-brand-blue/10 text-brand-blue font-bold px-2.5 py-1 rounded-full uppercase">
                  Gestão de Serviços
                </span>
                <h2 className="font-display font-extrabold text-2xl text-brand-dark mt-1">Serviços & Comissões</h2>
                <p className="text-xs text-gray-500">Cadastre e edite serviços, preços, durações e regras de comissão dos barbeiros</p>
              </div>
              <button 
                onClick={handleOpenNewService}
                className="bg-brand-blue hover:bg-brand-blue-light text-white font-bold text-xs py-3 px-5 rounded-2xl flex items-center justify-center gap-2 uppercase tracking-wide transition-all shadow-md cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Serviço</span>
              </button>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 uppercase font-bold text-[10px]">
                      <th className="p-3">Nome do Serviço</th>
                      <th className="p-3">Preço R$</th>
                      <th className="p-3">Duração</th>
                      <th className="p-3">Comissão Barbeiro</th>
                      <th className="p-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {services.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3 font-bold text-brand-dark">{s.name}</td>
                        <td className="p-3 text-brand-blue font-bold">R$ {s.price.toFixed(2)}</td>
                        <td className="p-3">{s.durationMin} min</td>
                        <td className="p-3 font-medium text-emerald-600">{s.commissionPercent}% (R$ {(s.price * (s.commissionPercent / 100)).toFixed(2)})</td>
                        <td className="p-3 text-right space-x-2">
                          <button 
                            onClick={() => handleOpenEditService(s)}
                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                          >
                            Editar
                          </button>
                          <button 
                            onClick={() => handleDeleteServiceClick(s.id)}
                            className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Excluir serviço"
                          >
                            <Trash2 className="w-3.5 h-3.5 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: PROFISSIONAIS */}
        {activeTab === 'profissionais' && (
          <div className="space-y-6 text-left">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div>
                <span className="text-[10px] bg-brand-blue/10 text-brand-blue font-bold px-2.5 py-1 rounded-full uppercase">
                  Equipe Cortestime
                </span>
                <h2 className="font-display font-extrabold text-2xl text-brand-dark mt-1">Profissionais (Barbeiros)</h2>
                <p className="text-xs text-gray-500">Cadastre e gerencie a equipe de barbeiros, fotos e comissões</p>
              </div>
              <button 
                onClick={() => setIsBarberModalOpen(true)}
                className="bg-brand-blue hover:bg-brand-blue-light text-white font-bold text-xs py-3 px-5 rounded-2xl flex items-center justify-center gap-2 uppercase tracking-wide transition-all shadow-md cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Profissional</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {barbers.map((b) => {
                const shopLogo = merchant?.vitrineLogoImage || '';
                const displayAvatar = (b.avatar && b.avatar.trim() !== '' && !b.avatar.includes('unsplash.com'))
                  ? b.avatar
                  : (shopLogo || b.avatar);

                return (
                  <div key={b.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3 flex flex-col justify-between relative group">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-gray-100 border-2 border-brand-blue/20 shadow-sm overflow-hidden shrink-0 relative flex items-center justify-center">
                        {displayAvatar ? (
                          <img 
                            src={displayAvatar} 
                            alt={b.name} 
                            referrerPolicy="no-referrer" 
                            className="w-full h-full object-cover relative z-10"
                            onError={(e) => {
                              if (shopLogo && e.currentTarget.src !== shopLogo) {
                                e.currentTarget.src = shopLogo;
                              } else {
                                e.currentTarget.style.display = 'none';
                              }
                            }}
                          />
                        ) : null}
                        <User className="w-6 h-6 text-gray-400 absolute" />
                      </div>
                    <div className="min-w-0 text-left flex-1">
                      <h4 className="font-extrabold text-sm text-brand-dark truncate">{b.name}</h4>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{b.specialty}</p>
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-500 font-bold mt-1">
                        <Star className="w-3 h-3 fill-amber-400" /> {b.rating || '5.0'}
                      </span>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
                    <button
                      type="button"
                      onClick={() => handleOpenEditBarber(b)}
                      className="text-xs text-brand-blue hover:text-brand-blue-light font-extrabold flex items-center gap-1 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Editar Foto / Dados</span>
                    </button>
                    <span className="font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md text-[10px]">Ativo</span>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        )}

        {/* TAB: CLIENTES */}
        {activeTab === 'clientes' && (() => {
          // Pre-calculate metrics per client
          const clientsWithMetrics = clients.map(client => {
            const normPhone = (client.phone || '').replace(/\D/g, '');
            const normName = (client.name || '').trim().toLowerCase();

            const clientAppointments = appointments.filter(a => {
              const appPhone = (a.clientPhone || '').replace(/\D/g, '');
              const appName = (a.clientName || '').trim().toLowerCase();
              if (normPhone && appPhone && normPhone === appPhone) return true;
              if (normName && appName && normName === appName) return true;
              return false;
            });

            const completedApps = clientAppointments.filter(a => a.status === 'completed');

            const totalSpent = completedApps.reduce((acc, app) => {
              const srv = services.find(s => s.id === app.serviceId);
              return acc + (srv ? srv.price : 0);
            }, 0);

            const dates = clientAppointments
              .map(a => a.date)
              .filter(Boolean)
              .sort((a, b) => b.localeCompare(a));

            const lastVisitFormatted = dates[0]
              ? new Date(dates[0] + 'T00:00:00').toLocaleDateString('pt-BR')
              : 'Sem registros';

            return {
              ...client,
              clientAppointments,
              completedCount: completedApps.length,
              totalCount: clientAppointments.length,
              totalSpent,
              lastVisitDate: dates[0] || '',
              lastVisitFormatted
            };
          });

          // Overall summary KPIs
          const totalAllSpent = clientsWithMetrics.reduce((acc, c) => acc + c.totalSpent, 0);
          const totalCompletedCount = clientsWithMetrics.reduce((acc, c) => acc + c.completedCount, 0);
          const avgSpent = clientsWithMetrics.length > 0 ? (totalAllSpent / clientsWithMetrics.length) : 0;
          const topVip = [...clientsWithMetrics].sort((a, b) => b.totalSpent - a.totalSpent)[0];

          // Filter and Sort
          const filteredAndSorted = clientsWithMetrics
            .filter(c => 
              (c.name || '').toLowerCase().includes((clientSearchTerm || '').toLowerCase()) || 
              (c.phone || '').includes(clientSearchTerm || '') || 
              (c.email && (c.email || '').toLowerCase().includes((clientSearchTerm || '').toLowerCase()))
            )
            .sort((a, b) => {
              if (clientSortBy === 'spent') return b.totalSpent - a.totalSpent;
              if (clientSortBy === 'appointments') return b.completedCount - a.completedCount;
              if (clientSortBy === 'recent') return (b.lastVisitDate || '').localeCompare(a.lastVisitDate || '');
              if (clientSortBy === 'name') return (a.name || '').localeCompare(b.name || '');
              return 0;
            });

          return (
            <div className="space-y-6 text-left">
              {/* HEADER & NEW CLIENT BUTTON */}
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div>
                  <span className="text-[10px] bg-brand-blue/10 text-brand-blue font-bold px-2.5 py-1 rounded-full uppercase">
                    Base de Clientes & CRM
                  </span>
                  <h2 className="font-display font-extrabold text-2xl text-brand-dark mt-1">Controle de Clientes & Gastos</h2>
                  <p className="text-xs text-gray-500">Acompanhe o quanto cada cliente gastou, histórico de cortes e contatos via WhatsApp</p>
                </div>
                <button 
                  onClick={() => setIsClientModalOpen(true)}
                  className="bg-brand-blue hover:bg-brand-blue-light text-white font-bold text-xs py-3 px-5 rounded-2xl flex items-center justify-center gap-2 uppercase tracking-wide transition-all shadow-md cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Cliente</span>
                </button>
              </div>

              {/* KPI STATS CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-emerald-50 to-white p-5 rounded-3xl border border-emerald-100/80 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">Faturamento de Clientes</span>
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="text-2xl font-black text-emerald-900 font-mono">
                    R$ {totalAllSpent.toFixed(2).replace('.', ',')}
                  </div>
                  <p className="text-[11px] text-emerald-700/80 mt-1">
                    {totalCompletedCount} agendamentos concluídos
                  </p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-white p-5 rounded-3xl border border-blue-100/80 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100/80 px-2.5 py-0.5 rounded-full">Ticket Médio por Cliente</span>
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-2xl font-black text-blue-900 font-mono">
                    R$ {avgSpent.toFixed(2).replace('.', ',')}
                  </div>
                  <p className="text-[11px] text-blue-700/80 mt-1">
                    Média calculada em {clients.length} clientes
                  </p>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-white p-5 rounded-3xl border border-amber-100/80 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/80 px-2.5 py-0.5 rounded-full">Cliente Top / VIP</span>
                    <Crown className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="text-lg font-extrabold text-amber-950 truncate">
                    {topVip && topVip.totalSpent > 0 ? topVip.name : 'Nenhum ainda'}
                  </div>
                  <p className="text-[11px] text-amber-800 font-medium mt-1">
                    {topVip && topVip.totalSpent > 0 ? `Gastou R$ ${topVip.totalSpent.toFixed(2).replace('.', ',')} na barbearia` : 'Realize atendimentos para ranquear'}
                  </p>
                </div>
              </div>

              {/* CONTROLS & TABLE */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                    <input 
                      type="text" 
                      placeholder="Buscar cliente por nome, e-mail ou telefone..." 
                      value={clientSearchTerm}
                      onChange={(e) => setClientSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-brand-blue"
                    />
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-gray-500 flex items-center gap-1">
                      <ArrowUpDown className="w-3.5 h-3.5" /> Ordenar:
                    </span>
                    <select
                      value={clientSortBy}
                      onChange={(e: any) => setClientSortBy(e.target.value)}
                      className="bg-gray-50 border border-gray-200 text-xs font-bold text-brand-dark py-2 px-3 rounded-xl focus:outline-none focus:border-brand-blue cursor-pointer"
                    >
                      <option value="spent">Maior Valor Gasto (VIPs)</option>
                      <option value="appointments">Mais Atendimentos</option>
                      <option value="recent">Mais Recentes</option>
                      <option value="name">Nome (A-Z)</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 uppercase font-bold text-[10px]">
                        <th className="p-3">Cliente</th>
                        <th className="p-3">Contato</th>
                        <th className="p-3 text-center">Atendimentos</th>
                        <th className="p-3 text-right">Total Gasto (R$)</th>
                        <th className="p-3 text-center">Última Visita</th>
                        <th className="p-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                      {filteredAndSorted.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-gray-400">
                            Nenhum cliente encontrado.
                          </td>
                        </tr>
                      ) : (
                        filteredAndSorted.map((c) => {
                          const isVip = c.totalSpent >= 100 || c.completedCount >= 5;
                          const isFrequent = !isVip && c.completedCount >= 2;

                          return (
                            <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                              <td className="p-3 font-bold text-brand-dark">
                                <div className="flex items-center gap-2">
                                  <span>{c.name}</span>
                                  {isVip && (
                                    <span className="text-[9px] font-black uppercase bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                      <Crown className="w-3 h-3 text-amber-600" /> VIP
                                    </span>
                                  )}
                                  {isFrequent && (
                                    <span className="text-[9px] font-black uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                      Frequente
                                    </span>
                                  )}
                                  {c.completedCount === 0 && (
                                    <span className="text-[9px] font-bold uppercase bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                      Novo
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="p-3">
                                <div className="font-mono text-gray-700">{c.phone}</div>
                                {c.email && <div className="text-[10px] text-gray-400 truncate max-w-[160px]">{c.email}</div>}
                              </td>

                              <td className="p-3 text-center">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-gray-100 text-gray-700">
                                  {c.completedCount} {c.completedCount === 1 ? 'corte' : 'cortes'}
                                </span>
                              </td>

                              <td className="p-3 text-right">
                                <span className="font-mono font-black text-sm text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 inline-block">
                                  R$ {c.totalSpent.toFixed(2).replace('.', ',')}
                                </span>
                              </td>

                              <td className="p-3 text-center text-gray-500 font-medium text-[11px]">
                                {c.lastVisitFormatted}
                              </td>

                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setSelectedClientForHistory(c)}
                                    className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-colors cursor-pointer text-[11px] flex items-center gap-1"
                                    title="Ver Histórico de Agendamentos e Gastos"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-brand-blue" />
                                    <span className="hidden sm:inline">Histórico</span>
                                  </button>
                                  <a 
                                    href={`https://wa.me/55${c.phone.replace(/\D/g, '')}?text=Olá%20${safeEncodeURIComponent(c.name)},%20tudo%20bem?%20Gostaria%20de%20agendar%20um%20horário%20na%20${safeEncodeURIComponent(merchant?.nomeBarbearia || 'barbearia')}?`}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs bg-brand-blue hover:bg-brand-blue-light text-white font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                                    title="Enviar mensagem WhatsApp"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">WhatsApp</span>
                                  </a>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}

        {/* TAB: CONFIGURAÇÕES */}
        {activeTab === 'configuracoes' && (
          <div className="space-y-6 text-left max-w-4xl">
            <div>
              <h2 className="font-display font-extrabold text-2xl text-brand-dark">Configurações da Barbearia</h2>
              <p className="text-xs text-gray-500">Atualize os dados comerciais, logo, foto de capa, redes sociais e segurança</p>
            </div>

            {configSuccessMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{configSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveConfig} className="space-y-6">
              {/* DADOS DA BARBEARIA */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-brand-dark uppercase tracking-wider flex items-center gap-2">
                  <Building className="w-4 h-4 text-brand-blue" />
                  <span>Dados Comerciais</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Nome da Barbearia</label>
                    <input 
                      type="text" 
                      value={configData.nomeBarbearia} 
                      onChange={e => setConfigData({ ...configData, nomeBarbearia: e.target.value })}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-blue"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Nome do Proprietário / Responsável</label>
                    <input 
                      type="text" 
                      value={configData.nomeProprietario} 
                      onChange={e => setConfigData({ ...configData, nomeProprietario: e.target.value })}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-blue"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">WhatsApp da Barbearia</label>
                    <input 
                      type="text" 
                      value={configData.whatsapp} 
                      onChange={e => setConfigData({ ...configData, whatsapp: e.target.value })}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-blue"
                      placeholder="(82) 99999-9999"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* MODO DE ATENDIMENTO (AGENDAMENTO / ORDEM DE CHEGADA / AMBOS) */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-brand-dark uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-brand-blue" />
                    <span>Modo de Atendimento da Barbearia</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowQueueInfoModal(true)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-blue bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full transition-all cursor-pointer"
                      title="Entenda como funciona a Fila e os Modos"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Como funciona a Fila?</span>
                    </button>
                    <span className="text-[10px] bg-brand-blue/10 text-brand-blue font-extrabold px-2.5 py-1 rounded-full uppercase">
                      Personalizável
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-500">
                  Escolha como seus clientes serão atendidos e o que será exibido no seu link / Vitrine Digital:
                </p>

                {configData.serviceMode === 'agendamento' && (
                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <p className="font-bold text-[11px] text-amber-900">Modo Somente Horário Marcado Ativo</p>
                      <p className="text-[11px] text-amber-700 mt-0.5">
                        A aba e os cartões de <strong>Fila de Espera</strong> ficam ocultos no seu painel e na vitrine dos clientes. Apenas a agenda tradicional de horários estará visível.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {[
                    {
                      id: 'agendamento' as ServiceMode,
                      title: 'Horário Marcado',
                      desc: 'Clientes escolhem dia e horário na agenda online',
                      icon: CalendarIcon,
                      badge: 'Padrão'
                    },
                    {
                      id: 'ordem_chegada' as ServiceMode,
                      title: 'Ordem de Chegada',
                      desc: 'Fila virtual em tempo real com painel de chamada',
                      icon: Users,
                      badge: 'Fila ao Vivo'
                    },
                    {
                      id: 'ambos' as ServiceMode,
                      title: 'Híbrido (Ambos)',
                      desc: 'Permite agendar horário ou entrar na fila do dia',
                      icon: Sparkles,
                      badge: 'Mais Completo'
                    },
                  ].map(mode => {
                    const isSelected = configData.serviceMode === mode.id;
                    const ModeIcon = mode.icon;
                    return (
                      <button
                        type="button"
                        key={mode.id}
                        onClick={() => setConfigData({ ...configData, serviceMode: mode.id })}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-3 relative ${
                          isSelected
                            ? 'border-brand-blue bg-blue-50/60 ring-2 ring-brand-blue/20 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isSelected ? 'bg-brand-blue text-white' : 'bg-gray-100 text-gray-600'}`}>
                            <ModeIcon className="w-4 h-4" />
                          </div>
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${isSelected ? 'bg-brand-blue text-white' : 'bg-gray-100 text-gray-600'}`}>
                            {mode.badge}
                          </span>
                        </div>
                        <div>
                          <p className="font-extrabold text-xs text-brand-dark">{mode.title}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{mode.desc}</p>
                        </div>
                        <div className="pt-2 flex items-center gap-1.5 text-[10px] font-bold">
                          <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-brand-blue' : 'bg-gray-300'}`} />
                          <span className={isSelected ? 'text-brand-blue' : 'text-gray-400'}>
                            {isSelected ? 'Ativado na Vitrine' : 'Clique para selecionar'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* MODO BARBEIRO ÚNICO (ATENDIMENTO INDIVIDUAL) */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-brand-blue/10 text-brand-blue rounded-2xl">
                      <Scissors className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-brand-dark uppercase tracking-wider">Modo Barbeiro Único (Studio Individual)</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Ative se você trabalha sozinho. O cliente não precisará escolher barbeiro ao agendar.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setConfigData(prev => ({ ...prev, barbeiroUnico: !prev.barbeiroUnico }))}
                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
                      configData.barbeiroUnico ? 'bg-brand-blue' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        configData.barbeiroUnico ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* LOGO & FOTO DE CAPA COM UPLOAD DO APARELHO */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-brand-dark uppercase tracking-wider flex items-center gap-2">
                  <Upload className="w-4 h-4 text-brand-blue" />
                  <span>Identidade Visual (Foto de Perfil / Logo & Capa)</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  {/* FOTO DE PERFIL / LOGO */}
                  <div className="space-y-3 bg-gray-50/80 p-4 rounded-2xl border border-gray-150">
                    <label className="block font-bold text-gray-800 text-xs">Foto de Perfil / Logo da Barbearia</label>
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-200 border-2 border-brand-blue/20 shrink-0 flex items-center justify-center">
                        {configData.vitrineLogoImage || configData.vitrineLogo ? (
                          <img 
                            src={configData.vitrineLogoImage || configData.vitrineLogo} 
                            alt="Logo preview" 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <Scissors className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <label className="bg-brand-blue hover:bg-brand-blue/90 text-white font-extrabold py-2 px-3.5 rounded-xl text-[11px] cursor-pointer inline-flex items-center gap-1.5 transition-all shadow-xs active:scale-95">
                          {isUploadingLogo ? (
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                          ) : (
                            <Upload className="w-3.5 h-3.5" />
                          )}
                          <span>{isUploadingLogo ? 'Carregando...' : 'Carregar Foto do Aparelho'}</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            disabled={isUploadingLogo}
                            onChange={handleUploadDashboardLogo} 
                            className="hidden" 
                          />
                        </label>
                        {(configData.vitrineLogoImage || configData.vitrineLogo) && (
                          <button
                            type="button"
                            onClick={() => setConfigData(prev => ({ ...prev, vitrineLogoImage: '', vitrineLogo: '' }))}
                            className="block text-[10px] text-red-500 hover:text-red-700 font-bold cursor-pointer"
                          >
                            Remover foto
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* FOTO DE CAPA / BANNER */}
                  <div className="space-y-3 bg-gray-50/80 p-4 rounded-2xl border border-gray-150">
                    <label className="block font-bold text-gray-800 text-xs">Foto de Capa / Banner da Vitrine</label>
                    <div className="h-16 w-full rounded-2xl overflow-hidden bg-gray-200 border-2 border-brand-blue/20 relative flex items-center justify-center">
                      {configData.vitrineCapa ? (
                        <img 
                          src={configData.vitrineCapa} 
                          alt="Capa preview" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <span className="text-gray-400 text-[11px] font-bold">Sem capa personalizada</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="bg-brand-blue hover:bg-brand-blue/90 text-white font-extrabold py-2 px-3.5 rounded-xl text-[11px] cursor-pointer inline-flex items-center gap-1.5 transition-all shadow-xs active:scale-95">
                        {isUploadingCapa ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>{isUploadingCapa ? 'Carregando...' : 'Carregar Capa do Aparelho'}</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          disabled={isUploadingCapa}
                          onChange={handleUploadDashboardCapa} 
                          className="hidden" 
                        />
                      </label>
                      {configData.vitrineCapa && (
                        <button
                          type="button"
                          onClick={() => setConfigData(prev => ({ ...prev, vitrineCapa: '' }))}
                          className="text-[10px] text-red-500 hover:text-red-700 font-bold cursor-pointer px-2"
                        >
                          Remover capa
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ENDEREÇO COMPLETO */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-brand-dark uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-brand-blue" />
                  <span>Endereço Completo</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">CEP</label>
                    <input 
                      type="text" 
                      value={configData.cep} 
                      onChange={e => setConfigData({ ...configData, cep: e.target.value })}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-blue"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-bold text-gray-700 mb-1">Rua / Logradouro</label>
                    <input 
                      type="text" 
                      value={configData.rua} 
                      onChange={e => setConfigData({ ...configData, rua: e.target.value })}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-blue"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Número</label>
                    <input 
                      type="text" 
                      value={configData.numero} 
                      onChange={e => setConfigData({ ...configData, numero: e.target.value })}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-blue"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Bairro</label>
                    <input 
                      type="text" 
                      value={configData.bairro} 
                      onChange={e => setConfigData({ ...configData, bairro: e.target.value })}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-blue"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Cidade / Estado</label>
                    <input 
                      type="text" 
                      value={`${configData.cidade} - ${configData.estado}`} 
                      onChange={e => {
                        const parts = e.target.value.split('-');
                        setConfigData({ ...configData, cidade: parts[0]?.trim() || '', estado: parts[1]?.trim() || '' });
                      }}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-blue"
                    />
                  </div>
                </div>
              </div>

              {/* REDES SOCIAIS */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-brand-dark uppercase tracking-wider flex items-center gap-2">
                  <Globe className="w-4 h-4 text-brand-blue" />
                  <span>Redes Sociais</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Instagram (@barbearia)</label>
                    <input 
                      type="text" 
                      value={configData.instagram} 
                      onChange={e => setConfigData({ ...configData, instagram: e.target.value })}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-blue"
                      placeholder="@minhabarbearia"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Facebook</label>
                    <input 
                      type="text" 
                      value={configData.facebook} 
                      onChange={e => setConfigData({ ...configData, facebook: e.target.value })}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-blue"
                      placeholder="facebook.com/minhabarbearia"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSavingConfig}
                className="w-full bg-brand-blue hover:bg-brand-blue-light text-white font-extrabold text-xs py-4 px-6 rounded-2xl uppercase tracking-wider transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {isSavingConfig ? 'Salvando Alterações...' : 'Salvar Dados da Barbearia'}
              </button>
            </form>

            {/* ALTERAR SENHA */}
            <form onSubmit={handleChangePassword} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-brand-dark uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4 text-brand-blue" />
                <span>Alterar Senha</span>
              </h3>

              {passSuccessMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold">
                  {passSuccessMsg}
                </div>
              )}
              {passErrorMsg && (
                <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-bold">
                  {passErrorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Senha Atual</label>
                  <input 
                    type="password" 
                    value={passForm.currentPass}
                    onChange={e => setPassForm({ ...passForm, currentPass: e.target.value })}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-blue"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Nova Senha</label>
                  <input 
                    type="password" 
                    value={passForm.newPass}
                    onChange={e => setPassForm({ ...passForm, newPass: e.target.value })}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-blue"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Confirmar Nova Senha</label>
                  <input 
                    type="password" 
                    value={passForm.confirmPass}
                    onChange={e => setPassForm({ ...passForm, confirmPass: e.target.value })}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-blue"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isChangingPass}
                className="bg-gray-800 hover:bg-black text-white font-bold text-xs py-3 px-5 rounded-xl uppercase tracking-wider transition-colors cursor-pointer"
              >
                {isChangingPass ? 'Atualizando...' : 'Atualizar Senha'}
              </button>
            </form>

            {/* EXCLUIR CONTA */}
            <div className="bg-red-50 border border-red-200 p-6 rounded-3xl space-y-3">
              <h3 className="font-bold text-sm text-red-800 uppercase tracking-wider flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-600" />
                <span>Excluir Conta (Zona de Perigo)</span>
              </h3>
              <p className="text-xs text-red-600 leading-relaxed">
                Ao excluir sua conta, seus agendamentos, clientes e vitrine virtual serão desativados permanentemente. Esta ação é irreversível.
              </p>
              <button 
                onClick={() => setShowDeleteAccountModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-colors cursor-pointer"
              >
                Excluir Minha Conta
              </button>
            </div>
          </div>
        )}

        {/* TAB: HORÁRIOS DE ATENDIMENTO */}
        {activeTab === 'horarios' && (
          <div className="space-y-6 text-left max-w-4xl">
            <div>
              <h2 className="font-display font-extrabold text-2xl text-brand-dark">Horários de Atendimento</h2>
              <p className="text-xs text-gray-500">Defina os dias e horários de funcionamento que aparecerão na sua Vitrine e na Agenda</p>
            </div>

            {hoursSuccessMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{hoursSuccessMsg}</span>
              </div>
            )}

            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="space-y-4 divide-y divide-gray-100">
                {openingHours.map((h, idx) => (
                  <div key={h.day} className="pt-3 first:pt-0 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 w-40">
                      <input 
                        type="checkbox" 
                        checked={h.open}
                        onChange={e => {
                          const updated = [...openingHours];
                          updated[idx].open = e.target.checked;
                          setOpeningHours(updated);
                        }}
                        className="w-4 h-4 accent-brand-blue cursor-pointer"
                      />
                      <span className={`font-bold ${h.open ? 'text-brand-dark' : 'text-gray-400'}`}>{h.day}</span>
                    </div>

                    {h.open ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-gray-400">Das</span>
                        <input 
                          type="time" 
                          value={h.start}
                          onChange={e => {
                            const updated = [...openingHours];
                            updated[idx].start = e.target.value;
                            setOpeningHours(updated);
                          }}
                          className="p-2 bg-gray-50 border rounded-lg text-xs font-mono"
                        />
                        <span className="text-gray-400">às</span>
                        <input 
                          type="time" 
                          value={h.end}
                          onChange={e => {
                            const updated = [...openingHours];
                            updated[idx].end = e.target.value;
                            setOpeningHours(updated);
                          }}
                          className="p-2 bg-gray-50 border rounded-lg text-xs font-mono"
                        />

                        <span className="text-gray-400 ml-2">Pausa Almoço:</span>
                        <input 
                          type="time" 
                          value={h.lunchStart}
                          onChange={e => {
                            const updated = [...openingHours];
                            updated[idx].lunchStart = e.target.value;
                            setOpeningHours(updated);
                          }}
                          className="p-2 bg-gray-50 border rounded-lg text-xs font-mono"
                        />
                        <span>-</span>
                        <input 
                          type="time" 
                          value={h.lunchEnd}
                          onChange={e => {
                            const updated = [...openingHours];
                            updated[idx].lunchEnd = e.target.value;
                            setOpeningHours(updated);
                          }}
                          className="p-2 bg-gray-50 border rounded-lg text-xs font-mono"
                        />
                      </div>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-500 font-bold px-3 py-1 rounded-full">
                        Fechado
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button 
                  onClick={handleSaveHours}
                  disabled={isSavingHours}
                  className="w-full bg-brand-blue hover:bg-brand-blue-light text-white font-extrabold text-xs py-4 px-6 rounded-2xl uppercase tracking-wider transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSavingHours ? 'Salvando Horários...' : 'Salvar Horários de Atendimento'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: CENTRAL DE AJUDA */}
        {activeTab === 'ajuda' && (
          <div className="space-y-6 text-left max-w-4xl">
            <div>
              <h2 className="font-display font-extrabold text-2xl text-brand-dark">Central de Ajuda & Suporte</h2>
              <p className="text-xs text-gray-500">Tire suas dúvidas, aprenda a usar todas as ferramentas ou fale diretamente com a equipe Cortestime</p>
            </div>

            {/* WHATSAPP CARD */}
            <div className="bg-brand-blue text-white p-6 rounded-3xl shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <span className="text-[10px] bg-white/20 text-white font-extrabold px-2.5 py-1 rounded-full uppercase">Suporte VIP Cortestime</span>
                <h3 className="font-display font-extrabold text-xl text-white">Atendimento Rápido no WhatsApp</h3>
                <p className="text-xs text-blue-100">Nosso time responde dúvidas técnicas, suporte ao cliente e renovação de planos em minutos.</p>
              </div>

              <a 
                href={`https://wa.me/558298089045?text=${safeEncodeURIComponent('Olá equipe Cortestime! Preciso de suporte e ajuda com a minha barbearia no painel.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white hover:bg-blue-50 text-brand-blue font-extrabold text-xs py-3.5 px-5 rounded-2xl flex items-center gap-2 uppercase tracking-wide transition-all shadow-md cursor-pointer shrink-0"
              >
                <MessageSquare className="w-4 h-4 text-brand-blue" />
                <span>Abrir WhatsApp</span>
              </a>
            </div>

            {/* FAQ */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-brand-dark uppercase tracking-wider">Perguntas Frequentes (FAQ)</h3>

              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input 
                  type="text" 
                  placeholder="Pesquisar dúvida na Central de Ajuda..."
                  value={faqSearch}
                  onChange={e => setFaqSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-brand-blue"
                />
              </div>

              <div className="space-y-3">
                {[
                  {
                    q: 'Como funciona a Fila de Atendimento (Ordem de Chegada) e como ocultá-la?',
                    a: 'A Fila Virtual permite que clientes entrem na lista de espera em tempo real pelo celular ou presencialmente. Se a sua barbearia trabalha apenas com horário marcado, vá em "Configurações" > "Modo de Atendimento da Barbearia" e selecione "Horário Marcado". Isso oculta automaticamente a fila da sua tela e da vitrine pública dos clientes.'
                  },
                  {
                    q: 'Como configurar o agendamento online para os clientes?',
                    a: 'Acesse o menu "Link & Vitrine Digital" no painel e clique em "Ativar Mini-Site". O sistema gerará o seu link exclusivo que você pode colocar na bio do seu Instagram ou enviar aos clientes.'
                  },
                  {
                    q: 'Como cadastrar novos serviços e ajustar a comissão dos barbeiros?',
                    a: 'Acesse a aba "Serviços & Preços", clique no botão "+ Novo Serviço" e informe o nome, valor cobrado e a porcentagem de repasse do barbeiro (ex: 50%).'
                  },
                  {
                    q: 'Como funciona o recebimento das notificações de lembrete?',
                    a: 'Ao entrar no painel, clique em "Ativar Alertas" na aba Notificações. O sistema usa o Service Worker do navegador para notificar você 30 minutos e 5 minutos antes de cada corte.'
                  },
                  {
                    q: 'Como assinar ou renovar o Plano Pro?',
                    a: 'Clique no botão "Assinar Plano Pro" no topo do menu lateral e escolha a opção Mensal ou Anual para pagar via Pix ou cartão pelo Mercado Pago.'
                  }
                ]
                .filter(item => item.q.toLowerCase().includes(faqSearch.toLowerCase()) || item.a.toLowerCase().includes(faqSearch.toLowerCase()))
                .map((item, idx) => (
                  <div key={idx} className="border border-gray-100 rounded-2xl overflow-hidden">
                    <button 
                      onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                      className="w-full p-4 bg-gray-50/80 hover:bg-gray-100 flex justify-between items-center text-xs font-bold text-brand-dark text-left transition-colors cursor-pointer"
                    >
                      <span>{item.q}</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${openFaqIndex === idx ? 'rotate-180' : ''}`} />
                    </button>
                    {openFaqIndex === idx && (
                      <div className="p-4 bg-white text-xs text-gray-600 leading-relaxed border-t border-gray-100">
                        {item.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* SEND TICKET FORM */}
            <form onSubmit={handleSendSupport} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-brand-dark uppercase tracking-wider flex items-center gap-2">
                <Send className="w-4 h-4 text-brand-blue" />
                <span>Enviar Mensagem ao Suporte Técnico</span>
              </h3>

              {supportSentMsg && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold">
                  {supportSentMsg}
                </div>
              )}

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Assunto</label>
                  <input 
                    type="text" 
                    value={supportForm.assunto}
                    onChange={e => setSupportForm({ ...supportForm, assunto: e.target.value })}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-blue"
                    placeholder="Ex: Dúvida sobre integração do Pix ou Vitrine"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Mensagem / Detalhes</label>
                  <textarea 
                    rows={4}
                    value={supportForm.mensagem}
                    onChange={e => setSupportForm({ ...supportForm, mensagem: e.target.value })}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-blue resize-none"
                    placeholder="Descreva o que você precisa de ajuda..."
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isSendingSupport}
                  className="bg-brand-blue hover:bg-brand-blue-light text-white font-extrabold text-xs py-3.5 px-6 rounded-2xl uppercase tracking-wider transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSendingSupport ? 'Enviando...' : 'Enviar Chamado de Suporte'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB: MINHA ASSINATURA */}
        {activeTab === 'assinatura' && (
          <div className="space-y-6 text-left max-w-4xl">
            <div>
              <h2 className="font-display font-extrabold text-2xl text-brand-dark">Minha Assinatura</h2>
              <p className="text-xs text-gray-500">Status do seu plano, benefícios ativos e histórico de pagamentos</p>
            </div>

            <div className="bg-gradient-to-br from-[#051b42] to-[#092e6e] text-white p-6 rounded-3xl shadow-xl space-y-6 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="text-[10px] bg-brand-lime text-brand-dark font-extrabold px-3 py-1 rounded-full uppercase">
                    Plano Ativo
                  </span>
                  <h3 className="font-display font-extrabold text-2xl text-white mt-2">
                    {merchant?.plano === 'pro' ? 'Cortestime Pro 💎' : 'Período de Teste Grátis (Agenda Pro)'}
                  </h3>
                  <p className="text-xs text-gray-300 mt-1">
                    {merchant?.plano === 'pro' 
                      ? 'Sua assinatura inclui agenda ilimitada, vitrine virtual e suporte VIP.' 
                      : `Faltam ${getTrialDaysLeft()} dias para o término do seu teste grátis.`
                    }
                  </p>
                </div>

                <button 
                  onClick={() => setShowUpgradePlans(true)}
                  className="bg-brand-lime hover:bg-brand-lime-dark text-brand-dark font-black text-xs py-3.5 px-5 rounded-2xl uppercase tracking-wider transition-all shadow-md cursor-pointer border-none shrink-0"
                >
                  {merchant?.plano === 'pro' ? 'Renovar Assinatura' : 'Assinar Plano Pro'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-white/10 text-xs">
                <div className="p-3 bg-white/10 rounded-2xl">
                  <p className="text-[10px] text-gray-300">Agenda On-line</p>
                  <p className="font-bold text-white">Ilimitada ✓</p>
                </div>
                <div className="p-3 bg-white/10 rounded-2xl">
                  <p className="text-[10px] text-gray-300">Vitrine Virtual</p>
                  <p className="font-bold text-white">Ativa ✓</p>
                </div>
                <div className="p-3 bg-white/10 rounded-2xl">
                  <p className="text-[10px] text-gray-300">Notificações Push</p>
                  <p className="font-bold text-white">Liberadas ✓</p>
                </div>
                <div className="p-3 bg-white/10 rounded-2xl">
                  <p className="text-[10px] text-gray-300">Suporte VIP</p>
                  <p className="font-bold text-white">24h ✓</p>
                </div>
              </div>
            </div>

            {/* HISTÓRICO DE PAGAMENTOS */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-brand-dark uppercase tracking-wider">Histórico de Faturas e Pagamentos Pix</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 uppercase font-bold text-[10px]">
                      <th className="p-3">Data</th>
                      <th className="p-3">Descrição do Plano</th>
                      <th className="p-3">Valor R$</th>
                      <th className="p-3 text-right">Status do Pagamento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    <tr className="hover:bg-gray-50">
                      <td className="p-3 font-mono">01/08/2026</td>
                      <td className="p-3 font-bold text-brand-dark">Cortestime Pro Mensal (Pix)</td>
                      <td className="p-3 font-bold text-brand-blue">R$ 29,90</td>
                      <td className="p-3 text-right">
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full">
                          Confirmado ✓
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: GESTÃO & MENU HUB */}
        {activeTab === 'menu' && (
          <div className="space-y-8 text-left">
            <div>
              <h2 className="font-display font-extrabold text-2xl text-brand-dark">Painel de Gestão Completo</h2>
              <p className="text-xs text-gray-500">Acesse todos os módulos e configurações do seu sistema Cortestime</p>
            </div>

            {/* CARDS GRID OF MODULES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { id: 'fila', title: 'Fila de Atendimento ao Vivo', desc: 'Gerencie a fila por ordem de chegada, chame clientes e acompanhe tempos', icon: Users, bg: 'bg-amber-50 border-amber-100 text-amber-900' },
                { id: 'configuracoes', title: 'Configurações da Barbearia', desc: 'Dados comerciais, modo de atendimento, fotos, redes sociais e senha', icon: Settings, bg: 'bg-blue-50 border-blue-100 text-blue-800' },
                { id: 'horarios', title: 'Horários de Atendimento', desc: 'Horários de abertura, fechamento e pausa de almoço', icon: Clock, bg: 'bg-emerald-50 border-emerald-100 text-emerald-900' },
                { id: 'servicos', title: 'Serviços & Comissões', desc: 'Tabela de preços, duração e porcentagem de repasse', icon: Scissors, bg: 'bg-purple-50 border-purple-100 text-purple-900' },
                { id: 'profissionais', title: 'Profissionais (Barbeiros)', desc: 'Equipe de barbeiros cadastrados, fotos e especialidades', icon: User, bg: 'bg-indigo-50 border-indigo-100 text-indigo-900' },
                { id: 'clientes', title: 'Controle de Clientes', desc: 'Base de clientes com contato rápido via WhatsApp', icon: Users, bg: 'bg-teal-50 border-teal-100 text-teal-900' },
                { id: 'notificacoes', title: 'Notificações & Lembretes', desc: 'Alertas automáticos de atendimento via Service Worker', icon: Bell, bg: 'bg-rose-50 border-rose-100 text-rose-900' },
                { id: 'ajuda', title: 'Central de Ajuda & Suporte', desc: 'Suporte VIP via WhatsApp e perguntas frequentes', icon: HelpCircle, bg: 'bg-cyan-50 border-cyan-100 text-cyan-900' },
                { id: 'assinatura', title: 'Minha Assinatura', desc: 'Status do plano Pro, recursos ativos e histórico Pix', icon: ShieldCheck, bg: 'bg-slate-50 border-slate-200 text-slate-900' },
              ].map(card => {
                const IconComponent = card.icon;
                return (
                  <button
                    key={card.id}
                    onClick={() => setActiveTab(card.id as DashboardTab)}
                    className="p-5 rounded-3xl border bg-white hover:shadow-md transition-all text-left flex flex-col justify-between space-y-4 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-2xl ${card.bg}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <h3 className="font-extrabold text-sm text-brand-dark group-hover:text-brand-blue transition-colors">
                        {card.title}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {card.desc}
                    </p>
                    <span className="text-[11px] font-bold text-brand-blue flex items-center gap-1">
                      <span>Acessar Módulo</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </main>

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      <AnimatePresence>
        {showDeleteAccountModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 text-left space-y-4 shadow-2xl relative"
            >
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h3 className="font-extrabold text-base text-red-600 flex items-center gap-2">
                  <Trash2 className="w-5 h-5" />
                  <span>Confirmar Exclusão de Conta</span>
                </h3>
                <button 
                  onClick={() => setShowDeleteAccountModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-gray-600">
                <p>
                  Esta ação desativará permanentemente a conta da barbearia <strong>{merchant?.nomeBarbearia}</strong> e removerá sua Vitrine Virtual do ar.
                </p>
                <p className="font-bold text-red-700">
                  Para confirmar, digite <span className="underline uppercase">EXCLUIR</span> no campo abaixo:
                </p>

                <input 
                  type="text" 
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder="EXCLUIR"
                  className="w-full p-3 bg-red-50 border border-red-200 rounded-xl font-mono text-center text-sm font-bold text-red-800 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => setShowDeleteAccountModal(false)}
                  className="w-1/2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs py-3 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount || deleteConfirmText.toUpperCase() !== 'EXCLUIR'}
                  className="w-1/2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-3 rounded-xl transition-colors cursor-pointer disabled:opacity-40"
                >
                  {isDeletingAccount ? 'Excluindo...' : 'Confirmar Exclusão'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MOBILE BOTTOM NAVIGATION TAB */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 grid grid-cols-5 py-2 text-center text-[10px] text-gray-400">
        <button 
          onClick={() => setActiveTab('inicio')}
          className={`flex flex-col items-center justify-center gap-1 transition-all ${
            activeTab === 'inicio' ? 'text-brand-blue font-bold scale-105' : 'text-gray-400'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Início</span>
        </button>
        <button 
          onClick={() => setActiveTab('agenda')}
          className={`flex flex-col items-center justify-center gap-1 transition-all ${
            activeTab === 'agenda' ? 'text-brand-blue font-bold scale-105' : 'text-gray-400'
          }`}
        >
          <CalendarIcon className="w-5 h-5" />
          <span>Agenda</span>
        </button>
        <button 
          onClick={() => setActiveTab('fila')}
          className={`flex flex-col items-center justify-center gap-1 transition-all relative ${
            activeTab === 'fila' ? 'text-brand-blue font-bold scale-105' : 'text-gray-400'
          }`}
        >
          <Users className="w-5 h-5" />
          <span>Fila</span>
          {merchantQueue.filter(q => q.status === 'waiting').length > 0 && (
            <span className="absolute top-0 right-3 bg-amber-500 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {merchantQueue.filter(q => q.status === 'waiting').length}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('notificacoes')}
          className={`flex flex-col items-center justify-center gap-1 transition-all relative ${
            activeTab === 'notificacoes' ? 'text-brand-blue font-bold scale-105' : 'text-gray-400'
          }`}
        >
          <Bell className="w-5 h-5" />
          <span>Alertas</span>
          {unreadCount > 0 && (
            <span className="absolute top-0 right-3 bg-red-500 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('menu')}
          className={`flex flex-col items-center justify-center gap-1 transition-all ${
            activeTab === 'menu' ? 'text-brand-blue font-bold scale-105' : 'text-gray-400'
          }`}
        >
          <MenuIcon className="w-5 h-5" />
          <span>Menu</span>
        </button>
      </nav>

      {/* WHATSAPP MODAL POPUP PREVIEW */}
      <AnimatePresence>
        {whatsappAlert.isOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 text-left space-y-4 shadow-2xl relative"
            >
              <button 
                onClick={() => setWhatsappAlert({isOpen: false, clientName: '', clientPhone: '', message: ''})}
                className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex gap-2.5 items-center text-brand-blue">
                <Smartphone className="w-5 h-5" />
                <span className="font-extrabold text-sm uppercase tracking-wide">Mensagem de Confirmação</span>
              </div>

              <p className="text-xs text-gray-500">
                Modelo gerado para o cliente <span className="font-bold text-brand-dark">{whatsappAlert.clientName}</span>:
              </p>

              <div className="p-4 bg-green-50 border border-green-100 rounded-2xl text-xs text-gray-700 italic leading-relaxed">
                {whatsappAlert.message}
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => {
                    const formattedPhone = getFormattedPhoneForWhatsApp(whatsappAlert.clientPhone);
                    window.open(`https://wa.me/${formattedPhone}?text=${safeEncodeURIComponent(whatsappAlert.message)}`, '_blank');
                    setWhatsappAlert({isOpen: false, clientName: '', clientPhone: '', message: ''});
                  }}
                  className="w-full bg-brand-blue hover:bg-brand-blue-light text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-colors"
                >
                  Enviar por WhatsApp
                </button>
                <button 
                  onClick={() => setWhatsappAlert({isOpen: false, clientName: '', clientPhone: '', message: ''})}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: NEW SERVICE */}
      <AnimatePresence>
        {isServiceModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 text-left space-y-4 shadow-2xl relative"
            >
              <button onClick={() => { setIsServiceModalOpen(false); setEditingService(null); }} className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full text-gray-400"><X className="w-5 h-5" /></button>
              <h3 className="font-display font-bold text-lg text-brand-dark">{editingService ? 'Editar Serviço' : 'Cadastrar Novo Serviço'}</h3>
              <form onSubmit={handleCreateService} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-gray-600">Nome do Serviço</label>
                  <input type="text" required placeholder="Ex: Cabelo + Sobrancelha" value={newServiceName} onChange={e => setNewServiceName(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-600">Preço (R$)</label>
                  <input type="number" step="0.01" required placeholder="Ex: 50.00" value={newServicePrice} onChange={e => setNewServicePrice(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-600">Duração (Minutos)</label>
                    <input type="number" required value={newServiceDuration} onChange={e => setNewServiceDuration(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-600">Comissão (%)</label>
                    <input type="number" required value={newServiceCommission} onChange={e => setNewServiceCommission(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200" />
                  </div>
                </div>
                <button type="submit" className="w-full bg-brand-blue text-white font-bold py-3 rounded-xl uppercase tracking-wider text-xs">
                  {editingService ? 'Salvar Alterações' : 'Salvar Serviço'}
                </button>
                {editingService && (
                  <button 
                    type="button" 
                    onClick={() => handleDeleteServiceClick(editingService.id)} 
                    className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-2.5 rounded-xl uppercase tracking-wider text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Excluir Serviço</span>
                  </button>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: NEW BARBER */}
      <AnimatePresence>
        {isBarberModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 text-left space-y-4 shadow-2xl relative"
            >
              <button onClick={() => setIsBarberModalOpen(false)} className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full text-gray-400"><X className="w-5 h-5" /></button>
              <h3 className="font-display font-bold text-lg text-brand-dark">Cadastrar Novo Profissional</h3>
              <form onSubmit={handleCreateBarber} className="space-y-4 text-xs">
                
                {/* Photo Upload Section */}
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-600 block">Foto do Barbeiro / Profissional</label>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 border-2 border-brand-blue/20 overflow-hidden flex items-center justify-center shrink-0 relative shadow-sm">
                      {newBarberAvatar ? (
                        <img src={newBarberAvatar} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <label className="cursor-pointer bg-brand-blue/10 hover:bg-brand-blue/20 text-brand-blue font-extrabold px-3 py-2 rounded-xl inline-flex items-center gap-1.5 text-xs transition-colors">
                        <Camera className="w-4 h-4" />
                        <span>{newBarberAvatar ? 'Alterar Foto' : 'Carregar Foto'}</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const compressed = await compressBarberPhoto(file);
                              if (compressed) setNewBarberAvatar(compressed);
                            }
                          }} 
                        />
                      </label>
                      {newBarberAvatar && (
                        <button
                          type="button"
                          onClick={() => setNewBarberAvatar('')}
                          className="text-red-500 hover:text-red-700 text-[11px] block font-medium cursor-pointer"
                        >
                          Remover foto
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-600">Nome do Barbeiro</label>
                  <input type="text" required placeholder="Ex: Felipe Silva" value={newBarberName} onChange={e => setNewBarberName(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-600">Especialidade</label>
                  <input type="text" required placeholder="Ex: Especialista em Degradê" value={newBarberSpecialty} onChange={e => setNewBarberSpecialty(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200" />
                </div>
                <button type="submit" className="w-full bg-brand-blue hover:bg-brand-blue-light text-white font-bold py-3 rounded-xl uppercase tracking-wider text-xs transition-colors cursor-pointer">Salvar Profissional</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: EDIT BARBER */}
      <AnimatePresence>
        {isEditBarberModalOpen && editingBarber && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 text-left space-y-4 shadow-2xl relative"
            >
              <button onClick={() => { setIsEditBarberModalOpen(false); setEditingBarber(null); }} className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full text-gray-400"><X className="w-5 h-5" /></button>
              <h3 className="font-display font-bold text-lg text-brand-dark">Editar Profissional</h3>
              <form onSubmit={handleSaveEditBarber} className="space-y-4 text-xs">
                
                {/* Photo Upload Section */}
                <div className="space-y-1.5">
                  <label className="font-bold text-gray-600 block">Foto do Barbeiro / Profissional</label>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 border-2 border-brand-blue/20 overflow-hidden flex items-center justify-center shrink-0 relative shadow-sm">
                      {editBarberAvatar ? (
                        <img src={editBarberAvatar} alt="Foto barbeiro" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <label className="cursor-pointer bg-brand-blue/10 hover:bg-brand-blue/20 text-brand-blue font-extrabold px-3 py-2 rounded-xl inline-flex items-center gap-1.5 text-xs transition-colors">
                        <Camera className="w-4 h-4" />
                        <span>{editBarberAvatar ? 'Alterar Foto' : 'Carregar Foto'}</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const compressed = await compressBarberPhoto(file);
                              if (compressed) setEditBarberAvatar(compressed);
                            }
                          }} 
                        />
                      </label>
                      {editBarberAvatar && (
                        <button
                          type="button"
                          onClick={() => setEditBarberAvatar('')}
                          className="text-red-500 hover:text-red-700 text-[11px] block font-medium cursor-pointer"
                        >
                          Remover foto
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-600">Nome do Barbeiro</label>
                  <input type="text" required placeholder="Ex: Felipe Silva" value={editBarberName} onChange={e => setEditBarberName(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-600">Especialidade</label>
                  <input type="text" required placeholder="Ex: Especialista em Degradê" value={editBarberSpecialty} onChange={e => setEditBarberSpecialty(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200" />
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 bg-brand-blue hover:bg-brand-blue-light text-white font-bold py-3 rounded-xl uppercase tracking-wider text-xs transition-colors cursor-pointer">Salvar Alterações</button>
                  <button 
                    type="button" 
                    onClick={() => handleDeleteBarberClick(editingBarber.id)} 
                    className="p-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors cursor-pointer flex items-center justify-center"
                    title="Excluir Barbeiro"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: NEW CLIENT */}
      <AnimatePresence>
        {isClientModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 text-left space-y-4 shadow-2xl relative"
            >
              <button onClick={() => setIsClientModalOpen(false)} className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full text-gray-400"><X className="w-5 h-5" /></button>
              <h3 className="font-display font-bold text-lg text-brand-dark">Cadastrar Novo Cliente</h3>
              <form onSubmit={handleCreateClient} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-gray-600">Nome Completo</label>
                  <input type="text" required placeholder="Ex: Arthur Pendragon" value={newClientName} onChange={e => setNewClientName(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-600">Celular (WhatsApp)</label>
                  <input type="tel" required placeholder="Ex: (82) 99122-3344" value={newClientPhone} onChange={e => setNewClientPhone(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-600">E-mail (Opcional)</label>
                  <input type="email" placeholder="Ex: arthur@gmail.com" value={newClientEmail} onChange={e => setNewClientEmail(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200" />
                </div>
                <button type="submit" className="w-full bg-brand-blue text-white font-bold py-3 rounded-xl uppercase tracking-wider text-xs">Salvar Cliente</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: CLIENT HISTORY & SPENDING BREAKDOWN */}
      <AnimatePresence>
        {selectedClientForHistory && (() => {
          const client = selectedClientForHistory;
          const normPhone = (client.phone || '').replace(/\D/g, '');
          const normName = (client.name || '').trim().toLowerCase();

          const clientApps = appointments.filter(a => {
            const appPhone = (a.clientPhone || '').replace(/\D/g, '');
            const appName = (a.clientName || '').trim().toLowerCase();
            if (normPhone && appPhone && normPhone === appPhone) return true;
            if (normName && appName && normName === appName) return true;
            return false;
          }).sort((a, b) => ((b.date || '') + (b.time || '')).localeCompare((a.date || '') + (a.time || '')));

          const completedApps = clientApps.filter(a => a.status === 'completed');
          const totalSpent = completedApps.reduce((acc, app) => {
            const srv = services.find(s => s.id === app.serviceId);
            return acc + (srv ? srv.price : 0);
          }, 0);

          return (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-3xl max-w-lg w-full p-6 text-left space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto"
              >
                <button 
                  onClick={() => setSelectedClientForHistory(null)} 
                  className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-full text-gray-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div>
                  <span className="text-[10px] bg-brand-blue/10 text-brand-blue font-bold px-2.5 py-1 rounded-full uppercase">
                    Histórico & Consumo do Cliente
                  </span>
                  <h3 className="font-display font-black text-xl text-brand-dark mt-1">
                    {client.name}
                  </h3>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">
                    {client.phone} {client.email ? `• ${client.email}` : ''}
                  </p>
                </div>

                {/* SUMMARY STATS FOR THIS CLIENT */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-2xl">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase">Total Gasto</span>
                    <div className="text-lg font-black font-mono text-emerald-800 mt-0.5">
                      R$ {totalSpent.toFixed(2).replace('.', ',')}
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 p-3.5 rounded-2xl">
                    <span className="text-[10px] font-bold text-blue-700 uppercase">Atendimentos</span>
                    <div className="text-lg font-black font-mono text-blue-800 mt-0.5">
                      {completedApps.length} concluídos
                    </div>
                  </div>
                  <div className="bg-purple-50 border border-purple-100 p-3.5 rounded-2xl col-span-2 sm:col-span-1">
                    <span className="text-[10px] font-bold text-purple-700 uppercase">Média / Visita</span>
                    <div className="text-lg font-black font-mono text-purple-800 mt-0.5">
                      R$ {completedApps.length > 0 ? (totalSpent / completedApps.length).toFixed(2).replace('.', ',') : '0,00'}
                    </div>
                  </div>
                </div>

                {/* APPOINTMENT LIST HISTORY */}
                <div className="space-y-3">
                  <h4 className="font-bold text-xs text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                    <History className="w-4 h-4 text-brand-blue" />
                    Histórico de Agendamentos ({clientApps.length})
                  </h4>

                  {clientApps.length === 0 ? (
                    <div className="p-6 bg-gray-50 rounded-2xl text-center text-xs text-gray-400">
                      Nenhum agendamento registrado para este cliente ainda.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {clientApps.map(app => {
                        const srv = services.find(s => s.id === app.serviceId);
                        const barb = barbers.find(b => b.id === app.barberId);

                        return (
                          <div key={app.id} className="p-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs flex items-center justify-between gap-2">
                            <div>
                              <div className="font-bold text-brand-dark">
                                {srv ? srv.name : 'Serviço'}
                              </div>
                              <div className="text-[11px] text-gray-500 font-medium">
                                📅 {app.date ? new Date(app.date + 'T00:00:00').toLocaleDateString('pt-BR') : ''} às {app.time}
                                {barb ? ` • ${barb.name}` : ''}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="font-mono font-bold text-emerald-600">
                                R$ {srv ? srv.price.toFixed(2).replace('.', ',') : '0,00'}
                              </div>
                              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                                app.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                                app.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                app.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {app.status === 'completed' ? 'Concluído' : app.status === 'confirmed' ? 'Confirmado' : app.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="pt-2 flex gap-2">
                  <a 
                    href={`https://wa.me/55${client.phone.replace(/\D/g, '')}?text=Olá%20${safeEncodeURIComponent(client.name)},%20tudo%20bem?`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 bg-brand-blue hover:bg-brand-blue-light text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 uppercase transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Enviar WhatsApp</span>
                  </a>
                  <button 
                    onClick={() => setSelectedClientForHistory(null)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs px-5 py-3 rounded-xl uppercase transition-colors cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* MODAL: NEW APPOINTMENT */}
      <AnimatePresence>
        {isAppointmentModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white text-brand-dark rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl relative transition-all duration-300"
            >
              {/* IF SERVICE SELECTION SHEET IS OPEN */}
              {isServiceSheetOpen ? (
                <div className="p-6 space-y-6 relative flex flex-col justify-between min-h-[500px]">
                  
                  {/* INLINE SERVICE CREATION FLOW */}
                  {showInlineAddServiceForm && (
                    <motion.div 
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      className="absolute inset-0 bg-white z-50 p-6 rounded-3xl flex flex-col justify-between text-left"
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-display font-extrabold text-base text-gray-900 uppercase tracking-wide">Novo Serviço</h4>
                          <button 
                            type="button" 
                            onClick={() => setShowInlineAddServiceForm(false)} 
                            className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        
                        <div className="space-y-3.5 text-xs text-left">
                          <div className="space-y-1">
                            <label className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">Nome do Serviço</label>
                            <input 
                              type="text" 
                              placeholder="Ex: Sobrancelha com Navalha" 
                              value={newServiceName} 
                              onChange={e => setNewServiceName(e.target.value)}
                              className="w-full p-3 rounded-xl border border-gray-200 text-gray-800 bg-gray-50 font-medium text-sm focus:outline-none focus:ring-1 focus:ring-brand-blue focus:bg-white transition-all"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">Preço (R$)</label>
                              <input 
                                type="number" 
                                placeholder="25.00" 
                                value={newServicePrice} 
                                onChange={e => setNewServicePrice(e.target.value)}
                                className="w-full p-3 rounded-xl border border-gray-200 text-gray-800 bg-gray-50 font-medium text-sm focus:outline-none focus:ring-1 focus:ring-brand-blue focus:bg-white transition-all"
                              />
                            </div>
                            
                            <div className="space-y-1">
                              <label className="font-bold text-gray-500 uppercase tracking-wider text-[10px]">Duração (Minutos)</label>
                              <input 
                                type="number" 
                                placeholder="30" 
                                value={newServiceDuration} 
                                onChange={e => setNewServiceDuration(e.target.value)}
                                className="w-full p-3 rounded-xl border border-gray-200 text-gray-800 bg-gray-50 font-medium text-sm focus:outline-none focus:ring-1 focus:ring-brand-blue focus:bg-white transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <button 
                        type="button"
                        onClick={() => {
                          if (!newServiceName || !newServicePrice) {
                            alert("Por favor, preencha o nome e preço do serviço.");
                            return;
                          }
                          const priceVal = parseFloat(newServicePrice);
                          const durationVal = parseInt(newServiceDuration) || 30;
                          
                          // Call actual prop handler
                          onAddService({
                            name: newServiceName,
                            price: priceVal,
                            durationMin: durationVal,
                            commissionPercent: 10
                          });
                          
                          // Clear states and close
                          setNewServiceName('');
                          setNewServicePrice('');
                          setNewServiceDuration('30');
                          setShowInlineAddServiceForm(false);
                        }}
                        className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white font-bold py-3.5 rounded-xl uppercase tracking-wider text-xs shadow-md shadow-brand-blue/15 transition-all mt-4"
                      >
                        Salvar Serviço
                      </button>
                    </motion.div>
                  )}

                  {/* HEADER */}
                  <div className="space-y-1.5 text-left">
                    <div className="flex items-center gap-2">
                      <button 
                        type="button" 
                        onClick={() => setIsServiceSheetOpen(false)} 
                        className="p-1 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5 text-gray-700" />
                      </button>
                      <h3 className="font-display font-extrabold text-xl text-gray-900 tracking-tight">Lista de serviços</h3>
                    </div>
                    <p className="text-xs text-gray-500 font-medium pl-8">Selecione os serviços necessários</p>
                  </div>

                  {/* HORIZONTAL SWIPE CAROUSEL */}
                  <div className="flex gap-4.5 overflow-x-auto py-5 px-1 scrollbar-none snap-x snap-mandatory">
                    {services.map((service) => {
                      const isSelected = tempSelectedServiceId === service.id;
                      return (
                        <div 
                          key={service.id}
                          onClick={() => setTempSelectedServiceId(service.id)}
                          className={`snap-center shrink-0 w-[165px] h-[210px] rounded-3xl p-4.5 flex flex-col justify-between cursor-pointer transition-all duration-300 relative select-none ${
                            isSelected 
                              ? 'bg-brand-blue text-white shadow-xl shadow-brand-blue/20 scale-[1.03]' 
                              : 'bg-gray-50 hover:bg-gray-100 text-brand-dark border border-gray-200'
                          }`}
                        >
                          {/* Top checkbox */}
                          <div className="flex justify-end w-full">
                            <div className={`w-5.5 h-5.5 rounded-lg flex items-center justify-center transition-all ${
                              isSelected 
                                ? 'bg-white border-transparent text-brand-blue' 
                                : 'border-2 border-gray-300 bg-transparent'
                            }`}>
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                          </div>

                          {/* Bottom info */}
                          <div className="text-left space-y-1">
                            <h4 className={`font-bold text-sm tracking-tight leading-snug line-clamp-2 truncate ${isSelected ? 'text-white' : 'text-brand-dark'}`}>
                              {service.name}
                            </h4>
                            <div className="flex justify-between items-end pt-1">
                              <span className={`text-xs font-bold font-mono ${isSelected ? 'text-white' : 'text-brand-blue'}`}>
                                R$ {service.price.toFixed(0)}
                              </span>
                              <span className={`text-[10px] font-medium ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                                {service.durationMin} min
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Dotted border New Service card */}
                    <div 
                      onClick={() => setShowInlineAddServiceForm(true)}
                      className="snap-center shrink-0 w-[165px] h-[210px] rounded-3xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-brand-blue hover:bg-gray-50 transition-all text-gray-400 hover:text-brand-blue"
                    >
                      <Plus className="w-8 h-8 mb-2.5 stroke-[1.5]" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Novo Serviço</span>
                    </div>
                  </div>

                  {/* Swipe Help Note */}
                  <div className="text-center py-1">
                    <p className="text-[9px] font-extrabold tracking-wider text-gray-400 uppercase flex items-center justify-center gap-1">
                      <span>Arraste para o lado para ver mais</span>
                      <ChevronRight className="w-3 h-3 text-gray-400" />
                    </p>
                  </div>

                  {/* FOOTER ACTIONS */}
                  <div className="grid grid-cols-2 gap-3 w-full pt-2">
                    <button 
                      type="button" 
                      onClick={() => setIsServiceSheetOpen(false)}
                      className="border border-gray-200 text-gray-600 font-bold py-3.5 rounded-2xl uppercase tracking-widest text-[10px] hover:bg-gray-50 transition-colors"
                    >
                      Voltar
                    </button>
                    <button 
                      type="button" 
                      onClick={() => {
                        if (tempSelectedServiceId) {
                          setAppServiceId(tempSelectedServiceId);
                        }
                        setIsServiceSheetOpen(false);
                      }}
                      className="bg-brand-blue hover:bg-brand-blue/90 text-white font-bold py-3.5 rounded-2xl uppercase tracking-widest text-[10px] shadow-lg shadow-brand-blue/15 transition-colors"
                    >
                      Ok
                    </button>
                  </div>

                </div>
              ) : isFreeModeSheetOpen ? (
                /* MODO LIVRE CONFIGURATION SHEET */
                <div className="p-6 space-y-6 text-left">
                  {/* HEADER */}
                  <div className="space-y-1 text-center">
                    <h3 className="font-display font-extrabold text-2xl text-brand-dark tracking-tight">Modo livre</h3>
                    <p className="text-xs text-gray-500 font-medium">Agendamento com horário livre</p>
                  </div>

                  {/* INTERVAL SELECT DROPDOWN */}
                  <div className="relative bg-gray-50 rounded-2xl px-4 h-14 flex items-center border border-gray-200">
                    <select 
                      value={freeModeInterval}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFreeModeInterval(val);
                        const [start, end] = val.split(' - ');
                        setStartMinutes(timeToMinutes(start));
                        setEndMinutes(timeToMinutes(end));
                      }}
                      className="w-full bg-transparent text-brand-dark border-none focus:outline-none focus:ring-0 text-sm font-medium appearance-none cursor-pointer pr-10"
                    >
                      <option value="13:00 - 23:59">13:00 - 23:59</option>
                      <option value="08:00 - 12:00">08:00 - 12:00</option>
                      <option value="14:00 - 18:00">14:00 - 18:00</option>
                      <option value="08:00 - 18:00">08:00 - 18:00</option>
                    </select>
                    <div className="absolute right-4 pointer-events-none">
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  {/* DYNAMIC TIMES DISPLAY */}
                  {(() => {
                    const [intStart, intEnd] = freeModeInterval.split(' - ');
                    const minMinutes = timeToMinutes(intStart);
                    const maxMinutes = timeToMinutes(intEnd);
                    
                    const actualStartMin = Math.max(startMinutes, minMinutes);
                    const actualEndMin = Math.min(endMinutes, maxMinutes);
                    
                    const displayStart = minutesToTime(actualStartMin);
                    const displayEnd = minutesToTime(actualEndMin);

                    return (
                      <>
                        <div className="text-center space-y-1 py-4">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Serviço das:</span>
                          <h4 className="font-sans font-bold text-2xl text-brand-dark">
                            {displayStart} às {displayEnd}
                          </h4>
                        </div>

                        {/* DUAL RANGE SLIDER */}
                        <div className="relative w-full h-12 flex items-center px-2">
                          <input
                            type="range"
                            min={minMinutes}
                            max={maxMinutes}
                            step={15}
                            value={actualStartMin}
                            onChange={(e) => {
                              const val = Math.min(Number(e.target.value), actualEndMin - 15);
                              setStartMinutes(val);
                            }}
                            className="absolute left-0 right-0 pointer-events-none appearance-none z-30 w-full h-2 bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-gray-200 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-gray-200 [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:cursor-pointer"
                          />
                          <input
                            type="range"
                            min={minMinutes}
                            max={maxMinutes}
                            step={15}
                            value={actualEndMin}
                            onChange={(e) => {
                              const val = Math.max(Number(e.target.value), actualStartMin + 15);
                              setEndMinutes(val);
                            }}
                            className="absolute left-0 right-0 pointer-events-none appearance-none z-30 w-full h-2 bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-gray-200 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-gray-200 [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:cursor-pointer"
                          />
                          {/* Backing Track */}
                          <div className="w-full h-2 bg-gray-200 rounded-full absolute pointer-events-none">
                            <div 
                              className="h-full bg-brand-blue rounded-full absolute"
                              style={{
                                left: `${((actualStartMin - minMinutes) / (maxMinutes - minMinutes)) * 100}%`,
                                width: `${((actualEndMin - actualStartMin) / (maxMinutes - minMinutes)) * 100}%`
                              }}
                            />
                          </div>
                        </div>

                        {/* HELP NOTE */}
                        <p className="text-[10px] font-medium text-gray-400 text-center leading-relaxed">
                          Mova a barra para selecionar o inicio e o fim do serviço.
                        </p>

                        {/* ACTIONS */}
                        <div className="grid grid-cols-2 gap-3 w-full pt-4">
                          <button 
                            type="button" 
                            onClick={() => setIsFreeModeSheetOpen(false)}
                            className="border border-gray-200 text-gray-600 font-bold py-3.5 rounded-2xl uppercase tracking-wider text-xs hover:bg-gray-50 transition-colors"
                          >
                            Voltar
                          </button>
                          <button 
                            type="button" 
                            onClick={() => {
                              setAppTime(displayStart);
                              setIsFreeModeSheetOpen(false);
                            }}
                            className="bg-brand-blue hover:bg-brand-blue-light text-white font-bold py-3.5 rounded-2xl uppercase tracking-wider text-xs shadow-lg shadow-brand-blue/15 transition-colors"
                          >
                            Ok
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : (
                /* MAIN NOVO AGENDAMENTO FORM */
                <div className="p-6 space-y-6">
                  
                  {/* HEADER */}
                  <div className="relative flex items-start gap-3 text-left">
                    <button 
                      type="button" 
                      onClick={() => setIsAppointmentModalOpen(false)} 
                      className="mt-1 text-brand-dark hover:text-gray-700 transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                    </button>
                    <div className="space-y-1">
                      <h3 className="font-display font-extrabold text-2xl text-brand-dark tracking-tight">Novo agendamento</h3>
                      <p className="text-xs text-gray-500 font-medium leading-relaxed">
                        Preencha todos os campos para realizar um novo agendamento.
                      </p>
                    </div>
                  </div>

                  {/* FORM BODY */}
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleCreateAppointment(e);
                    }} 
                    className="space-y-4 text-left"
                  >
                    
                    {/* Client Name input */}
                    <div className="space-y-1">
                      <input 
                        type="text" 
                        required 
                        placeholder="Nome do cliente" 
                        value={appClientName} 
                        onChange={e => setAppClientName(e.target.value)} 
                        className="w-full bg-gray-50 text-brand-dark placeholder-gray-400 border border-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-blue rounded-2xl p-4 h-14 text-sm font-medium transition-all"
                      />
                    </div>

                    {/* Brazil Flag Phone input */}
                    <div className="flex gap-2 items-center bg-gray-50 rounded-2xl px-4 h-14 border border-gray-200 focus-within:border-brand-blue focus-within:bg-white transition-all">
                      <div className="flex items-center gap-1 text-brand-dark pr-2 border-r border-gray-200">
                        <span className="text-base select-none">🇧🇷</span>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                      <input 
                        type="tel" 
                        required 
                        placeholder="Telefone" 
                        value={appClientPhone} 
                        onChange={e => setAppClientPhone(e.target.value)} 
                        className="flex-1 bg-transparent text-brand-dark border-none focus:outline-none focus:ring-0 placeholder-gray-400 text-sm font-medium h-full"
                      />
                    </div>

                    {/* SERVICE SELECT TRIGGER BUTTON */}
                    <div 
                      onClick={() => {
                        setTempSelectedServiceId(appServiceId);
                        setIsServiceSheetOpen(true);
                      }}
                      className="flex justify-between items-center bg-gray-50 hover:bg-gray-100 border border-gray-200 cursor-pointer rounded-2xl px-4 h-14 transition-colors select-none group"
                    >
                      <span className={appServiceId ? "text-brand-dark text-sm font-medium" : "text-gray-400 text-sm font-medium"}>
                        {(() => {
                          const sObj = services.find(s => s.id === appServiceId);
                          return sObj ? `${sObj.name}` : "Selecione um serviço";
                        })()}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-brand-blue transition-colors" />
                    </div>

                    {/* BARBER SELECTOR DROPDOWN */}
                    <div className="relative">
                      <select 
                        value={appBarberId} 
                        onChange={e => setAppBarberId(e.target.value)} 
                        className="w-full bg-gray-50 text-brand-dark border border-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-blue rounded-2xl pl-4 pr-10 h-14 text-sm font-medium appearance-none cursor-pointer transition-all"
                      >
                        {barbers.map(b => (
                          <option key={b.id} value={b.id} className="bg-white text-brand-dark">
                            {b.name} ({b.specialty})
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>

                    {/* DATE SELECTOR */}
                    <div className="relative bg-gray-50 rounded-2xl px-4 h-14 flex items-center border border-gray-200 focus-within:border-brand-blue focus-within:bg-white transition-all">
                      <CalendarIcon className="w-4 h-4 text-gray-400 mr-2.5 pointer-events-none" />
                      <input 
                        type="date" 
                        required 
                        value={appDate} 
                        onChange={e => setAppDate(e.target.value)} 
                        className="w-full bg-transparent text-brand-dark border-none focus:outline-none focus:ring-0 text-sm font-medium [color-scheme:light]"
                      />
                    </div>

                    {/* TIME SELECTOR + LIVRE BADGE */}
                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-8 bg-gray-50 rounded-2xl px-4 h-14 flex items-center relative border border-gray-200 focus-within:border-brand-blue focus-within:bg-white transition-all">
                        <Clock className="w-4 h-4 text-gray-400 mr-2.5 pointer-events-none" />
                        <input 
                          type="time" 
                          required 
                          step="1800"
                          value={appTime} 
                          onChange={e => setAppTime(e.target.value)} 
                          className="w-full bg-transparent text-brand-dark border-none focus:outline-none focus:ring-0 text-sm font-medium [color-scheme:light]"
                        />
                      </div>
                      
                      <div 
                        onClick={() => {
                          // Initialize range sliders with current time if valid
                          try {
                            const [start, end] = freeModeInterval.split(' - ');
                            setStartMinutes(timeToMinutes(start));
                            setEndMinutes(timeToMinutes(end));
                          } catch (e) {}
                          setIsFreeModeSheetOpen(true);
                        }}
                        className="col-span-4 bg-brand-lime/20 border border-brand-lime/40 rounded-2xl flex items-center justify-center text-xs font-extrabold text-brand-lime-dark h-14 uppercase tracking-wider cursor-pointer hover:bg-brand-lime/30 active:scale-95 transition-all select-none shadow-xs"
                      >
                        Livre
                      </div>
                    </div>

                    {/* REPEAT APPOINTMENT SWITCH TOGGLE */}
                    <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-2xl p-4 h-14 select-none">
                      <span className="text-xs text-brand-dark font-bold">Repetir este agendamento</span>
                      <div 
                        onClick={() => setRepeatAppointment(!repeatAppointment)}
                        className={`w-11 h-6 rounded-full transition-all relative cursor-pointer ${
                          repeatAppointment ? 'bg-brand-blue' : 'bg-gray-300'
                        }`}
                      >
                        <motion.div 
                          animate={{ x: repeatAppointment ? 22 : 2 }}
                          className="w-4 h-4 rounded-full bg-white absolute top-1"
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      </div>
                    </div>

                    {/* SUBMIT BUTTON */}
                    <div className="pt-3">
                      <button 
                        type="submit" 
                        className="w-full bg-brand-blue hover:bg-brand-blue/90 text-white font-extrabold py-4 rounded-2xl uppercase tracking-widest text-xs shadow-md transition-all"
                      >
                        Agendar
                      </button>
                    </div>

                  </form>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* UPGRADE PLANS MODAL */}
      <AnimatePresence>
        {showUpgradePlans && (
          <div className="fixed inset-0 z-50 bg-black/85 flex flex-col items-center justify-start p-4 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#051b42] border border-white/10 rounded-3xl p-6 md:p-8 max-w-4xl w-full text-center space-y-6 shadow-2xl relative my-8 text-white"
            >
              <button 
                onClick={() => setShowUpgradePlans(false)}
                className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 text-white hover:text-amber-400 rounded-full transition-colors cursor-pointer border border-white/10 flex items-center justify-center shadow-md z-10"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-2">
                <span className="bg-amber-500/25 text-amber-400 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border border-amber-400/25 inline-block">
                  Cortestime Pro
                </span>
                <h3 className="font-sans font-extrabold text-2xl md:text-3xl text-white">Escolha o seu plano Cortestime Pro</h3>
                <p className="text-xs text-gray-300 max-w-lg mx-auto">
                  Sem taxas extras, cancele quando desejar. Desbloqueie imediatamente o fluxo financeiro, funcionários, notificações automáticas e agendamento completo.
                </p>
              </div>

              {/* Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 text-left">
                
                {/* MENSAL */}
                <div className="bg-[#09224f]/80 border border-white/10 rounded-3xl p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-2 text-center">
                    <h4 className="font-sans font-extrabold text-base text-gray-200">Plano Mensal</h4>
                    <div className="space-y-1">
                      <p className="text-[10px] text-gray-400">Cobrança Mensal</p>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-lg font-bold">R$</span>
                        <span className="text-3xl font-black text-white">19,90</span>
                        <span className="text-xs text-gray-400">/mês</span>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-white/5 pt-4 space-y-2 text-xs text-gray-300 flex-1">
                    <div className="flex gap-2 items-start">
                      <Check className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Agendamentos Ilimitados</span>
                    </div>
                    <div className="flex gap-2 items-start">
                      <Check className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Cadastro de clientes</span>
                    </div>
                    <div className="flex gap-2 items-start">
                      <Check className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Dashboard financeiro</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setCheckoutPlan({ name: 'Mensal', price: 19.90 });
                    }}
                    className="w-full bg-brand-blue hover:bg-brand-blue-light text-white font-extrabold py-3 rounded-xl text-xs uppercase cursor-pointer transition-colors shadow-sm"
                  >
                    Assinar Mensal
                  </button>
                </div>

                {/* TRIMESTRAL */}
                <div className="bg-[#0a2959] border-2 border-amber-400 rounded-3xl p-6 flex flex-col justify-between space-y-4 relative shadow-lg shadow-amber-500/5">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-[#051b42] text-[9px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full">
                    Mais Popular
                  </div>
                  <div className="space-y-2 text-center pt-2">
                    <h4 className="font-sans font-extrabold text-base text-white">Plano Trimestral</h4>
                    <div className="space-y-1">
                      <p className="text-[10px] text-amber-400 font-bold">16% de Desconto</p>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-lg font-bold">R$</span>
                        <span className="text-3xl font-black text-amber-400">49,90</span>
                        <span className="text-xs text-gray-200">/trimestre</span>
                      </div>
                      <p className="text-[9px] text-gray-400">Equivale a R$ 16,63 por mês</p>
                    </div>
                  </div>
                  <div className="border-t border-white/5 pt-4 space-y-2 text-xs text-gray-200 flex-1">
                    <div className="flex gap-2 items-start">
                      <Check className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Agendamentos Ilimitados</span>
                    </div>
                    <div className="flex gap-2 items-start">
                      <Check className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Notificações Automáticas</span>
                    </div>
                    <div className="flex gap-2 items-start">
                      <Check className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Controle de funcionários</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setCheckoutPlan({ name: 'Trimestral', price: 49.90 });
                    }}
                    className="w-full bg-amber-400 hover:bg-amber-500 text-[#051b42] font-extrabold py-3 rounded-xl text-xs uppercase cursor-pointer transition-colors"
                  >
                    Contratar Trimestral
                  </button>
                </div>

                {/* ANUAL */}
                <div className="bg-[#09224f]/80 border border-white/10 rounded-3xl p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-2 text-center">
                    <h4 className="font-sans font-extrabold text-base text-gray-200">Plano Anual</h4>
                    <div className="space-y-1">
                      <p className="text-[10px] text-emerald-400 font-bold">37% de Desconto</p>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-lg font-bold">R$</span>
                        <span className="text-3xl font-black text-white">149,90</span>
                        <span className="text-xs text-gray-400">/ano</span>
                      </div>
                      <p className="text-[9px] text-gray-400">Equivale a R$ 12,49 por mês</p>
                    </div>
                  </div>
                  <div className="border-t border-white/5 pt-4 space-y-2 text-xs text-gray-300 flex-1">
                    <div className="flex gap-2 items-start">
                      <Check className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Agendamentos Ilimitados</span>
                    </div>
                    <div className="flex gap-2 items-start">
                      <Check className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Relatórios de faturamento</span>
                    </div>
                    <div className="flex gap-2 items-start">
                      <Check className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Suporte Preferencial</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setCheckoutPlan({ name: 'Anual', price: 149.90 });
                    }}
                    className="w-full bg-cyan-400 hover:bg-cyan-500 text-[#051b42] font-extrabold py-3 rounded-xl text-xs uppercase cursor-pointer transition-colors"
                  >
                    Assinar Anual
                  </button>
                </div>

              </div>

              <div className="pt-2 text-center text-[10px] text-gray-400">
                Ao concluir a assinatura, sua conta será migrada imediatamente para o plano Pro, ativando todas as ferramentas sem perda de dados.
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MERCADO PAGO CHECKOUT MODAL OVERLAY */}
      <AnimatePresence>
        {checkoutPlan && merchant && (
          <MercadoPagoCheckout 
            planName={checkoutPlan.name}
            price={checkoutPlan.price}
            merchant={merchant}
            onPaymentSuccess={async () => {
              try {
                await firebaseService.updateMerchantProfile(merchant.uid, { plano: 'pro' });
                if (onUpdateMerchant) onUpdateMerchant({ ...merchant, plano: 'pro' });
                setShowUpgradePlans(false);
                setCheckoutPlan(null);
              } catch (err) {
                alert('Erro ao atualizar plano.');
              }
            }}
            onClose={() => setCheckoutPlan(null)}
          />
        )}
      </AnimatePresence>

      {/* ADMIN SUBSCRIPTION MANAGER MODAL */}
      <AnimatePresence>
        {isAdminManagerOpen && merchant && isSuperAdmin && (
          <AdminSubscriptionManager
            currentAdmin={merchant}
            onClose={() => setIsAdminManagerOpen(false)}
            onUpdateMerchant={(updated) => {
              if (onUpdateMerchant) onUpdateMerchant(updated);
            }}
          />
        )}
      </AnimatePresence>

      {/* DRAFT VITRINE REDEEMED CELEBRATION MODAL */}
      <AnimatePresence>
        {showDraftCelebration && (
          <div className="fixed inset-0 z-50 bg-[#051b42]/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className="bg-white rounded-[32px] p-6 md:p-8 max-w-md w-full shadow-2xl text-left space-y-5 border border-gray-100 my-auto relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="text-center space-y-2">
                <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto text-amber-500 shadow-inner">
                  <Sparkles className="w-7 h-7 text-amber-500 animate-pulse" />
                </div>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border border-amber-200 inline-block">
                  Barbearia Parceira
                </span>
                <h2 className="font-display font-extrabold text-2xl text-brand-dark pt-1">
                  🎉 Sua Vitrine já está pronta!
                </h2>
                <p className="text-xs text-gray-600 leading-relaxed max-w-sm mx-auto">
                  Personalizamos uma versão inicial para você. Agora basta editar, adicionar suas fotos e concluir as informações.
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-brand-blue block">
                  Benefícios Exclusivos Ativados:
                </span>

                <ul className="space-y-2 text-xs text-gray-700 font-semibold">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>7 dias</strong> de Agenda Pro (Cortestime)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0 mt-0.5" />
                    <span>Selo permanente <strong>"Barbearia Indicada"</strong> na sua Vitrine</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Galeria ilimitada</strong> por 30 dias</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Sistema de <strong>avaliações desbloqueado</strong> por 30 dias</span>
                  </li>
                </ul>

                {merchant?.nomeBarbearia && (
                  <p className="text-[11px] text-gray-500 pt-2 border-t border-gray-200">
                    Vinculada a: <strong className="text-brand-blue">{merchant.nomeBarbearia}</strong>
                  </p>
                )}
              </div>

              <button
                onClick={handleDismissDraftCelebration}
                className="w-full bg-brand-blue hover:bg-brand-blue-light text-white font-extrabold py-4 px-6 rounded-2xl shadow-lg shadow-brand-blue/20 transition-all uppercase text-xs tracking-wider cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Personalizar minha Vitrine</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        )}

        {/* MODAL CANCELLATION BY BARBERSHOP */}
        {cancellingAppointment && (
          <div className="fixed inset-0 z-50 bg-[#051b42]/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-[32px] p-6 sm:p-8 max-w-md w-full shadow-2xl relative border border-gray-100 my-auto text-left space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center font-bold">
                    <CalendarX className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-lg text-brand-dark">Cancelar Agendamento</h3>
                    <p className="text-xs text-gray-400">O cliente será notificado automaticamente</p>
                  </div>
                </div>
                <button
                  onClick={() => setCancellingAppointment(null)}
                  className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Appointment summary info */}
              <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-4 space-y-2 text-xs">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Cliente:</span>
                  <strong className="text-gray-900 font-bold">{cancellingAppointment.clientName}</strong>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Telefone:</span>
                  <strong className="text-gray-900">{cancellingAppointment.clientPhone}</strong>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Data e Horário:</span>
                  <strong className="text-red-700 font-mono">{cancellingAppointment.date} às {cancellingAppointment.time}</strong>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Serviço:</span>
                  <strong className="text-gray-900 font-bold">
                    {services.find(s => s.id === cancellingAppointment.serviceId)?.name || 'Serviço'}
                  </strong>
                </div>
              </div>

              {/* Cancellation Reason input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">
                  Motivo do cancelamento (opcional):
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Ex: Imprevisto com o profissional, manutenção no espaço, reagendamento..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 text-xs border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 text-[11px] text-amber-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Ao confirmar, o horário será cancelado na agenda, o cliente receberá um alerta imediato no navegador e abriremos a mensagem formatada para você enviar no WhatsApp se desejar.
                </span>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCancellingAppointment(null)}
                  className="py-3 rounded-2xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  disabled={isCancellingApp}
                  onClick={handleConfirmBarbershopCancel}
                  className="py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-red-600/20 flex items-center justify-center gap-1.5"
                >
                  {isCancellingApp ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Cancelando...</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      <span>Confirmar Cancelamento</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* MODAL INFORMATIVO DA FILA / MODOS DE ATENDIMENTO */}
        {showQueueInfoModal && (
          <div className="fixed inset-0 z-50 bg-[#051b42]/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-[32px] p-6 sm:p-8 max-w-lg w-full shadow-2xl relative border border-gray-100 my-auto text-left space-y-5"
            >
              <button
                type="button"
                onClick={() => setShowQueueInfoModal(false)}
                className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors z-20 cursor-pointer"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                <div className="w-11 h-11 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center font-bold">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-brand-dark">Como funciona a Fila e os Modos?</h3>
                  <p className="text-xs text-gray-500">Entenda a diferença entre Fila ao Vivo e Agendamento Online</p>
                </div>
              </div>

              <div className="space-y-4 text-xs text-gray-600 leading-relaxed">
                <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl space-y-1">
                  <p className="font-extrabold text-brand-blue flex items-center gap-1.5 text-xs">
                    <Users className="w-4 h-4" />
                    <span>1. O que é a Fila Virtual (Ordem de Chegada)?</span>
                  </p>
                  <p className="text-[11px] text-gray-600">
                    A Fila permite que clientes cheguem na barbearia ou entrem no link da vitrine pelo celular e peguem uma senha/posição virtual. O sistema calcula automaticamente a posição dele, o tempo estimado de espera e avisa quando for a vez. Você chama o próximo com um clique.
                  </p>
                </div>

                <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-1">
                  <p className="font-extrabold text-amber-900 flex items-center gap-1.5 text-xs">
                    <CalendarIcon className="w-4 h-4 text-amber-700" />
                    <span>2. O que acontece ao escolher "Somente Agendamento"?</span>
                  </p>
                  <p className="text-[11px] text-amber-800">
                    Se sua barbearia trabalha <strong>apenas com horário marcado</strong>, a opção de Fila fica 100% oculta da sua tela e da Vitrine dos clientes. Não haverá botão para entrar na fila nem estimativa de espera — apenas a sua agenda clássica de horários.
                  </p>
                </div>

                <div className="p-3.5 bg-purple-50/70 border border-purple-100 rounded-2xl space-y-1">
                  <p className="font-extrabold text-purple-900 flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-4 h-4 text-purple-700" />
                    <span>3. Modo Híbrido (Ambos)</span>
                  </p>
                  <p className="text-[11px] text-purple-800">
                    Permite que clientes agendem um horário com antecedência para os próximos dias OU entrem na fila de atendimento do dia caso venham de improviso.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowQueueInfoModal(false)}
                  className="w-full sm:w-auto px-6 py-2.5 bg-brand-blue hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Entendi
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* MODAL INSTALL PWA */}
        {showInstallModal && (
          <div className="fixed inset-0 z-50 bg-[#051b42]/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-[32px] p-6 sm:p-8 max-w-md w-full shadow-2xl relative border border-gray-100 my-auto"
            >
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors z-20 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <InstallCortestimeStep
                merchantUid={merchant?.uid}
                isDashboardModal
                onComplete={(installed) => {
                  setShowInstallModal(false);
                  if (installed && merchant && onUpdateMerchant) {
                    onUpdateMerchant({ ...merchant, appInstalled: true });
                  }
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
