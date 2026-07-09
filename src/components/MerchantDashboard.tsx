import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import LogoIcon from './LogoIcon';
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
  RefreshCw
} from 'lucide-react';
import { OnboardingData, Service, Barber, Client, Appointment, MerchantUser } from '../types';
import { notificationService } from '../services/notificationService';
import CortesVitrine from './CortesVitrine';
import MercadoPagoCheckout from './MercadoPagoCheckout';
import { firebaseService } from '../services/firebaseService';

interface MerchantDashboardProps {
  onboardingData: OnboardingData;
  merchant?: MerchantUser | null;
  services: Service[];
  barbers: Barber[];
  clients: Client[];
  appointments: Appointment[];
  onAddService: (service: Omit<Service, 'id'>) => void;
  onAddBarber: (barber: Omit<Barber, 'id' | 'rating'>) => void;
  onAddClient: (client: Omit<Client, 'id'>) => void;
  onAddAppointment: (appointment: Omit<Appointment, 'id' | 'status'>) => void;
  onUpdateAppointmentStatus: (id: string, status: Appointment['status']) => void;
  onLogout: () => void;
  firebaseConnected: boolean | null;
  onOpenClientBooking?: () => void;
  onUpdateMerchant?: (updated: MerchantUser) => void;
  initialTab?: 'inicio' | 'agenda' | 'notificacoes' | 'menu';
}

export default function MerchantDashboard({
  onboardingData,
  merchant,
  services,
  barbers,
  clients,
  appointments,
  onAddService,
  onAddBarber,
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
  const [activeTab, setActiveTab] = useState<'inicio' | 'agenda' | 'notificacoes' | 'menu'>(initialTab);
  const [notifSubTab, setNotifSubTab] = useState<'sistema' | 'dispositivo'>('sistema');
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
    const stored = localStorage.getItem('read-system-milestones');
    return stored ? JSON.parse(stored) : [];
  });

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    notificationService.getPermissionStatus()
  );

  const handleRequestPermission = async () => {
    const perm = await notificationService.requestPermission();
    setNotificationPermission(perm);
  };
  
  // Modals state
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isBarberModalOpen, setIsBarberModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [showUpgradePlans, setShowUpgradePlans] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<{ name: string; price: number } | null>(null);
  
  // Service form
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDuration, setNewServiceDuration] = useState('30');
  const [newServiceCommission, setNewServiceCommission] = useState('50');

  // Barber form
  const [newBarberName, setNewBarberName] = useState('');
  const [newBarberSpecialty, setNewBarberSpecialty] = useState('');

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



  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

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
  const [waitlist, setWaitlist] = useState<{name: string, phone: string, service: string}[]>([
    { name: 'Marcus Aurelio', phone: '(82) 99312-3321', service: 'Corte Social' },
    { name: 'Felipe Melo', phone: '(82) 98842-1209', service: 'Cabelo + Barba' }
  ]);
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

  const unreadCount = activeMilestones.filter(m => !readNotificationIds.includes(m.id)).length;

  const markAllNotificationsAsRead = () => {
    const allIds = activeMilestones.map(m => m.id);
    setReadNotificationIds(allIds);
    localStorage.setItem('read-system-milestones', JSON.stringify(allIds));
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

  // First steps progress tracking
  const step1Done = merchant ? (clients.length >= 1) : (clients.length > 3);
  const step2Done = merchant ? (appointments.length >= 1) : (appointments.length > 5);
  const step3Done = merchant ? (services.length > 4 || services.some(s => !['serv-1', 'serv-2', 'serv-3', 'serv-4'].includes(s.id))) : (services.length > 4);

  // Handlers
  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName || !newServicePrice) return;
    onAddService({
      name: newServiceName,
      price: parseFloat(newServicePrice),
      durationMin: parseInt(newServiceDuration),
      commissionPercent: parseInt(newServiceCommission)
    });
    setNewServiceName('');
    setNewServicePrice('');
    setIsServiceModalOpen(false);
  };

  const handleCreateBarber = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBarberName) return;
    onAddBarber({
      name: newBarberName,
      avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 500000)}?w=100&auto=format&fit=crop&q=60`,
      specialty: newBarberSpecialty || 'Barbeiro Geral'
    });
    setNewBarberName('');
    setNewBarberSpecialty('');
    setIsBarberModalOpen(false);
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
        onBack={() => setShowVitrinePage(false)}
        onUpdateMerchant={onUpdateMerchant}
      />
    );
  }

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
          <nav className="flex flex-col gap-1">
            <button 
              onClick={() => setActiveTab('inicio')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                activeTab === 'inicio' ? 'bg-brand-blue text-white' : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Início</span>
            </button>
            <button 
              onClick={() => setActiveTab('agenda')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                activeTab === 'agenda' ? 'bg-brand-blue text-white' : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Agenda</span>
            </button>
            <button 
              onClick={() => setActiveTab('notificacoes')}
              className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-colors w-full ${
                activeTab === 'notificacoes' ? 'bg-brand-blue text-white' : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4" />
                <span>Notificações</span>
              </div>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold leading-none shrink-0 min-w-[18px] text-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <button 
              onClick={() => setActiveTab('menu')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                activeTab === 'menu' ? 'bg-brand-blue text-white' : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              <MenuIcon className="w-4 h-4" />
              <span>Gestão & Menu</span>
            </button>

            <button 
              onClick={() => setShowVitrinePage(true)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all hover:bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 bg-emerald-500/5 mt-2 cursor-pointer"
              id="btn-sidebar-vitrine"
            >
              <Scissors className="w-4 h-4 text-emerald-400" />
              <span>Cortes Vitrine (Grátis)</span>
            </button>
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
        <div className="flex items-center gap-1.5">
          <LogoIcon className="w-6 h-6" />
          <span className="font-sans font-extrabold text-lg text-[#051b42]">Cortestime</span>
          <span className={`inline-block w-2 h-2 rounded-full ${firebaseConnected ? 'bg-green-500' : 'bg-red-400'}`} title={firebaseConnected ? 'Firebase Ativo' : 'Firebase Inativo'} />
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
              Plano Pro 💎
            </span>
          )}
        </div>
      </header>

      {/* MAIN VIEW AREA */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6">
        
        {/* TRIAL WARNING BANNER */}
        {merchant?.plano === 'pro_trial' && getTrialDaysLeft() >= 0 && (
          <div className={`p-4 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-3 text-sm font-bold shadow-sm text-left ${
            getTrialDaysLeft() === 3
              ? 'bg-brand-blue/10 text-brand-blue border border-brand-blue/20'
              : getTrialDaysLeft() === 2 
              ? 'bg-yellow-50 text-yellow-800 border border-yellow-100' 
              : 'bg-[#bffd32] text-[#051b42] border border-white/10'
          }`}>
            <div className="flex items-center gap-2.5">
              <span className="text-xl">
                {getTrialDaysLeft() === 3 ? '🎉' : getTrialDaysLeft() === 2 ? '⏳' : '🔥'}
              </span>
              <span className="text-xs">
                {getTrialDaysLeft() === 3 
                  ? 'Bem-vindo ao Cortestime! Seu período de teste de 3 dias grátis começou hoje. Aproveite!'
                  : `Teste Grátis Ativo: Você possui ${getTrialDaysLeft()} dias restantes para testar todos os recursos do sistema.`
                }
              </span>
            </div>
            <button 
              onClick={() => setShowUpgradePlans(true)}
              className={`py-2 px-4 rounded-xl text-[10px] uppercase tracking-wider font-extrabold cursor-pointer transition-colors ${
                getTrialDaysLeft() === 3
                  ? 'bg-brand-blue text-white hover:bg-brand-blue-light'
                  : getTrialDaysLeft() === 2 
                  ? 'bg-yellow-800 text-white hover:bg-yellow-900' 
                  : 'bg-[#051b42] text-white hover:bg-[#051b42]/90'
              }`}
            >
              {getTrialDaysLeft() === 3 ? 'Ativar Assinatura' : 'Assinar Plano'}
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
                  Painel Administrativo
                </span>
                <h2 className="font-display font-extrabold text-2xl md:text-3xl">
                  {merchant?.nomeBarbearia || onboardingData.businessName || 'Minha Barbearia'}
                </h2>
                <p className="text-xs text-gray-400">
                  {merchant?.whatsapp 
                    ? `WhatsApp: ${merchant.whatsapp} • Plano: ${merchant.plano === 'pro' ? 'Premium 💎' : `Teste Grátis (${getTrialDaysLeft()} dias restantes)`}` 
                    : onboardingData.cep 
                    ? `CEP: ${onboardingData.cep} • ${onboardingData.street}, ${onboardingData.number}` 
                    : 'Acesse todos os recursos abaixo'
                  }
                </p>
              </div>

              <div className="flex gap-2">
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

            {/* CARD: LINK DE AGENDAMENTO ONLINE DO CLIENTE */}
            <div className="bg-white p-5 md:p-6 rounded-3xl border border-gray-100 space-y-4 text-left shadow-sm">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] bg-brand-lime/20 text-brand-lime-dark px-2.5 py-1 rounded-full uppercase font-extrabold tracking-wider">
                    Agendamento Online Liberado 🚀
                  </span>
                  <h3 className="font-display font-extrabold text-lg text-brand-dark mt-2">
                    Sua Página de Agendamento Online
                  </h3>
                  <p className="text-xs text-gray-500">
                    Seus clientes podem agendar de forma 100% automatizada. Compartilhe o link nas redes sociais e comece a receber agendamentos!
                  </p>
                </div>
                <div className="p-3 bg-[#bffd32]/25 text-[#051b42] rounded-2xl hidden sm:block">
                  <Smartphone className="w-6 h-6" />
                </div>
              </div>

              {/* Mock Link Box */}
              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center bg-gray-50 p-3 rounded-2xl border border-gray-100">
                <div className="font-mono text-xs text-gray-600 truncate flex-1 flex items-center gap-1.5 px-1 py-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0"></span>
                  <span>cortestime.com/agendar/{merchant?.nomeBarbearia ? merchant.nomeBarbearia.toLowerCase().replace(/\s+/g, '-') : 'sua-barbearia'}</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      if (onOpenClientBooking) {
                        onOpenClientBooking();
                      }
                    }}
                    className="flex-1 sm:flex-initial text-xs font-bold text-brand-blue hover:bg-brand-blue/5 border border-brand-blue/20 bg-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Testar Página</span>
                  </button>
                  <button 
                    onClick={() => {
                      const link = `https://cortestime.com/agendar/${merchant?.nomeBarbearia ? merchant.nomeBarbearia.toLowerCase().replace(/\s+/g, '-') : 'sua-barbearia'}`;
                      navigator.clipboard.writeText(link);
                      alert("Link de agendamento copiado com sucesso! Compartilhe com seus clientes no Instagram e WhatsApp.");
                    }}
                    className="flex-1 sm:flex-initial text-xs font-extrabold text-brand-dark bg-brand-lime hover:bg-brand-lime-dark px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span>Copiar Link</span>
                  </button>
                </div>
              </div>
            </div>

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
            
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div>
                <h2 className="font-display font-extrabold text-2xl text-brand-dark">Agenda do Dia</h2>
                <p className="text-xs text-gray-500">Quadro de horários e atendimento por profissional</p>
              </div>
              
              <button 
                onClick={() => setIsAppointmentModalOpen(true)}
                className="bg-brand-blue hover:bg-brand-blue-light text-white font-bold text-xs py-3 px-5 rounded-xl flex items-center gap-1.5 uppercase tracking-wide transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Marcar Horário</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* MAIN CALENDAR GRID */}
              <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm lg:col-span-8">
                
                {/* Barbers headers columns */}
                <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-100 py-3 text-center text-xs font-bold text-gray-700">
                  <div className="col-span-3 border-r border-gray-100 flex items-center justify-center text-[10px] text-gray-400 uppercase">Hora</div>
                  <div className="col-span-9 grid grid-cols-3">
                    {barbers.map((barber) => (
                      <div key={barber.id} className="flex flex-col items-center justify-center border-r last:border-r-0 border-gray-100">
                        <span className="text-[11px] text-brand-dark font-extrabold">{barber.name}</span>
                        <span className="text-[9px] text-gray-400 font-normal">{barber.specialty}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Calendar Hours Rows */}
                <div className="divide-y divide-gray-100">
                  {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map((hourSlot) => (
                    <div key={hourSlot} className="grid grid-cols-12 min-h-[55px]">
                      {/* Left side Hour label */}
                      <div className="col-span-3 border-r border-gray-100 flex items-center justify-center text-xs font-mono font-bold text-gray-400">
                        {hourSlot}
                      </div>

                      {/* Right side Slots split by barbers */}
                      <div className="col-span-9 grid grid-cols-3 divide-x divide-gray-100">
                        {barbers.map((barber) => {
                          // Find appointment for this hour slot (hour and barber matches)
                          const app = appointments.find(a => {
                            const [appHour] = a.time.split(':');
                            const [slotHour] = hourSlot.split(':');
                            return appHour === slotHour && a.barberId === barber.id;
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
                                // Select barber and time for manual booking
                                setAppBarberId(barber.id);
                                setAppTime(hourSlot);
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

        {/* TAB 3: NOTIFICAÇÕES */}
        {activeTab === 'notificacoes' && (
          <div className="space-y-6 text-left">
            <div>
              <h2 className="font-display font-extrabold text-2xl text-[#051b42]">Central de Notificações</h2>
              <p className="text-xs text-gray-500">Monitore as conquistas da sua barbearia e configure alertas no seu celular</p>
            </div>

            {/* SUB-TABS SELECTOR */}
            <div className="flex border-b border-gray-100 gap-6">
              <button 
                onClick={() => setNotifSubTab('sistema')}
                className={`pb-3 font-bold text-sm tracking-wide border-b-2 transition-colors relative flex items-center gap-2 cursor-pointer ${
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
                className={`pb-3 font-bold text-sm tracking-wide border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                  notifSubTab === 'dispositivo' ? 'border-brand-blue text-[#051b42] border-b-2 border-brand-blue' : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                <span>Alertas Push (Celular)</span>
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
          </div>
        )}


        {/* TAB 4: MENU (GESTÃO DE CLIENTES, SERVIÇOS, COMISSÕES, ETC.) */}
        {activeTab === 'menu' && (
          <div className="space-y-8 text-left">
            <div>
              <h2 className="font-display font-extrabold text-2xl text-brand-dark">Painel de Gestão Completo</h2>
              <p className="text-xs text-gray-500">Administre serviços, preços, comissões, profissionais cadastrados e faturamento</p>
            </div>

            {/* CORTES VITRINE PROMO CARD */}
            <div className="bg-[#051b42] text-white p-6 rounded-3xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-emerald-500/25 shadow-lg shadow-emerald-500/5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
              <div className="space-y-2 text-left">
                <span className="text-[10px] bg-emerald-500/25 text-emerald-400 px-2.5 py-1 rounded-full uppercase font-extrabold tracking-wider border border-emerald-400/20">
                  Novidade • Cortes Vitrine (Grátis)
                </span>
                <h3 className="font-display font-extrabold text-xl">
                  Mini-site digital para divulgar sua barbearia!
                </h3>
                <p className="text-xs text-gray-300 max-w-xl leading-relaxed">
                  Crie uma versão gratuita do seu catálogo de serviços, produtos recomendados, galeria de cortes e link para as redes sociais. Ative o mini-site para colocar na bio do seu Instagram agora mesmo.
                </p>
              </div>

              <button 
                onClick={() => setShowVitrinePage(true)}
                className="bg-[#10b981] hover:bg-[#059669] text-white font-extrabold text-xs py-3.5 px-5 rounded-2xl flex items-center gap-2 uppercase tracking-wide transition-all shadow-md cursor-pointer shrink-0 border border-emerald-400/20"
                id="btn-menu-tab-vitrine"
              >
                <Scissors className="w-4 h-4" />
                <span>Gerar Meu Mini-Site</span>
              </button>
            </div>

            {/* SECTION: SERVICES & COMISSIONS */}
            <section className="bg-white p-5 md:p-6 rounded-3xl border border-gray-100 space-y-4 shadow-sm">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-brand-dark uppercase tracking-wider">Tabela de Serviços & Comissões</h3>
                  <p className="text-[10px] text-gray-400">Configure os valores cobrados e as porcentagens de repasse dos barbeiros</p>
                </div>
                
                <button 
                  onClick={() => setIsServiceModalOpen(true)}
                  className="bg-brand-blue hover:bg-brand-blue-light text-white font-bold text-xs py-2 px-3.5 rounded-lg flex items-center gap-1 uppercase transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Serviço</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 uppercase font-bold text-[10px]">
                      <th className="p-3">Nome</th>
                      <th className="p-3">Preço</th>
                      <th className="p-3">Duração</th>
                      <th className="p-3">Comissão Barbeiro</th>
                      <th className="p-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {services.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="p-3 font-bold text-brand-dark">{s.name}</td>
                        <td className="p-3 text-brand-blue font-bold">R$ {s.price.toFixed(2)}</td>
                        <td className="p-3">{s.durationMin} min</td>
                        <td className="p-3">{s.commissionPercent}% (R$ {(s.price * (s.commissionPercent / 100)).toFixed(2)})</td>
                        <td className="p-3 text-right text-gray-400 text-[10px]">Editável</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* SECTION: BARBERS (PROFISSIONAIS) */}
            <section className="bg-white p-5 md:p-6 rounded-3xl border border-gray-100 space-y-4 shadow-sm">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-brand-dark uppercase tracking-wider">Profissionais cadastrados</h3>
                  <p className="text-[10px] text-gray-400">Gerencie a equipe e especialidades</p>
                </div>
                
                <button 
                  onClick={() => setIsBarberModalOpen(true)}
                  className="bg-brand-blue hover:bg-brand-blue-light text-white font-bold text-xs py-2 px-3.5 rounded-lg flex items-center gap-1 uppercase transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Profissional</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {barbers.map((barber) => (
                  <div key={barber.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 flex gap-3 items-center">
                    <img 
                      src={barber.avatar} 
                      alt={barber.name} 
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-brand-dark truncate">{barber.name}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">{barber.specialty}</p>
                      <p className="text-[10px] text-yellow-500 font-bold mt-0.5">★ {barber.rating} (Classificação)</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* SECTION: CLIENTS MANAGEMENT */}
            <section className="bg-white p-5 md:p-6 rounded-3xl border border-gray-100 space-y-4 shadow-sm">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <div>
                  <h3 className="font-bold text-sm text-brand-dark uppercase tracking-wider">Controle de Clientes</h3>
                  <p className="text-[10px] text-gray-400">Listagem de clientes com histórico e telefone para marketing</p>
                </div>
                
                <button 
                  onClick={() => setIsClientModalOpen(true)}
                  className="bg-brand-blue hover:bg-brand-blue-light text-white font-bold text-xs py-2 px-3.5 rounded-lg flex items-center gap-1 uppercase transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Novo Cliente</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 uppercase font-bold text-[10px]">
                      <th className="p-3">Nome do Cliente</th>
                      <th className="p-3">Telefone</th>
                      <th className="p-3">E-mail</th>
                      <th className="p-3 text-right">Status de Marketing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {clients.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="p-3 font-bold text-brand-dark">{c.name}</td>
                        <td className="p-3 font-mono">{c.phone}</td>
                        <td className="p-3 text-gray-400">{c.email || 'Não informado'}</td>
                        <td className="p-3 text-right">
                          <span className="text-[9px] bg-brand-lime/20 text-brand-lime-dark font-bold px-2 py-0.5 rounded-full">
                            WhatsApp Pronto
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

          </div>
        )}

      </main>

      {/* MOBILE BOTTOM NAVIGATION TAB */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 grid grid-cols-4 py-2 text-center text-[10px] text-gray-400">
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
          onClick={() => setActiveTab('notificacoes')}
          className={`flex flex-col items-center justify-center gap-1 transition-all ${
            activeTab === 'notificacoes' ? 'text-brand-blue font-bold scale-105' : 'text-gray-400'
          }`}
        >
          <Bell className="w-5 h-5" />
          <span>Notificações</span>
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
                    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(whatsappAlert.message)}`, '_blank');
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
              <button onClick={() => setIsServiceModalOpen(false)} className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full text-gray-400"><X className="w-5 h-5" /></button>
              <h3 className="font-display font-bold text-lg text-brand-dark">Cadastrar Novo Serviço</h3>
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
                <button type="submit" className="w-full bg-brand-blue text-white font-bold py-3 rounded-xl uppercase tracking-wider text-xs">Salvar Serviço</button>
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
                <div className="space-y-1">
                  <label className="font-bold text-gray-600">Nome do Barbeiro</label>
                  <input type="text" required placeholder="Ex: Felipe Silva" value={newBarberName} onChange={e => setNewBarberName(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-600">Especialidade</label>
                  <input type="text" required placeholder="Ex: Especialista em Degradê" value={newBarberSpecialty} onChange={e => setNewBarberSpecialty(e.target.value)} className="w-full p-3 rounded-xl border border-gray-200" />
                </div>
                <button type="submit" className="w-full bg-brand-blue text-white font-bold py-3 rounded-xl uppercase tracking-wider text-xs">Salvar Profissional</button>
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
          <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#051b42] border border-white/10 rounded-3xl p-6 md:p-8 max-w-4xl w-full text-center space-y-6 shadow-2xl relative my-8 text-white"
            >
              <button 
                onClick={() => setShowUpgradePlans(false)}
                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white cursor-pointer text-xl font-bold"
              >
                &times;
              </button>

              <div className="space-y-2">
                <span className="bg-amber-500/25 text-amber-400 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border border-amber-400/25 inline-block">
                  🛡️ Assinatura Cortestime Pro
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
                    className="w-full bg-emerald-400 hover:bg-emerald-500 text-[#051b42] font-extrabold py-3 rounded-xl text-xs uppercase cursor-pointer transition-colors"
                  >
                    Assinar Mensal
                  </button>
                </div>

                {/* TRIMESTRAL */}
                <div className="bg-[#0a2959] border-2 border-amber-400 rounded-3xl p-6 flex flex-col justify-between space-y-4 relative shadow-lg shadow-amber-500/5">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-[#051b42] text-[9px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full">
                    Mais Popular ✨
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
                    Assinar Trimestral
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

    </div>
  );
}
