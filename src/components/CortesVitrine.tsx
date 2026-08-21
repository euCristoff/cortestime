import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Scissors, 
  MapPin, 
  Clock, 
  Instagram, 
  MessageSquare, 
  QrCode, 
  Globe, 
  Plus, 
  Trash2, 
  Camera, 
  Sparkles, 
  Award, 
  ShoppingBag, 
  ArrowLeft, 
  ExternalLink,
  Check,
  Save,
  Star,
  Loader2,
  Download,
  Copy,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Lock,
  ShieldCheck,
  X,
  Calendar,
  User,
  AlertTriangle,
  Ban,
  Search,
  LogOut,
  Bell,
  Users,
  Radio,
  CheckCircle2,
  ChevronRight,
  Info,
  Palette,
  Layout,
  Phone,
  Share2,
  Crown,
  Sun,
  Send,
  PauseCircle,
  PlayCircle
} from 'lucide-react';
import { MerchantUser, Service, Barber, Appointment, AppNotification, QueueItem, VitrineHorarioHoje } from '../types';
import { firebaseService } from '../services/firebaseService';
import { notificationService } from '../services/notificationService';
import MercadoPagoCheckout from './MercadoPagoCheckout';
import ClientBooking from './ClientBooking';

export interface ThemePreset {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  gradient?: boolean;
  textLight?: boolean;
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: 'classico', name: 'Clássico', primary: '#78350f', secondary: '#d97706', gradient: true, textLight: true },
  { id: 'dark', name: 'Dark', primary: '#0f172a', secondary: '#e11d48', gradient: false, textLight: true },
  { id: 'carvao', name: 'Carvão', primary: '#18181b', secondary: '#ca8a04', gradient: true, textLight: true },
  { id: 'premium', name: 'Premium', primary: '#ca8a04', secondary: '#09090b', gradient: true, textLight: true },
  { id: 'negresco', name: 'Negresco', primary: '#000000', secondary: '#eab308', gradient: false, textLight: true },
  { id: 'aco', name: 'Aço', primary: '#334155', secondary: '#64748b', gradient: true, textLight: true },
  { id: 'cortestime', name: 'Cortestime', primary: '#051b42', secondary: '#2563eb', gradient: true, textLight: true },
  { id: 'esmeralda', name: 'Esmeralda', primary: '#064e3b', secondary: '#10b981', gradient: true, textLight: true },
];

interface CortesVitrineProps {
  merchant: MerchantUser;
  services: Service[];
  barbers?: Barber[];
  onBack?: () => void;
  onUpdateMerchant?: (updated: MerchantUser) => void;
  isOnlyView?: boolean; // if true, they are a 'vitrine' user and this is their main dashboard
  onLogout?: () => void;
  isPublicAccess?: boolean;
  onBookOnline?: () => void;
}

const DEFAULT_HAIRCUTS = [
  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80'
];

const DEFAULT_COVER_URL = 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&auto=format&fit=crop&q=80';

function compressImageFile(file: File, maxWidth = 900, maxHeight = 900, quality = 0.75): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve('');
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => resolve((e.target?.result as string) || '');
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve((e.target?.result as string) || '');
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = (e.target?.result as string) || '';
    };
    reader.readAsDataURL(file);
  });
}

function compressDataUrl(dataUrl: string, maxWidth = 800, maxHeight = 800, quality = 0.75): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image') || dataUrl.length < 80000) {
    return Promise.resolve(dataUrl);
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.onerror = () => resolve(dataUrl);
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = dataUrl;
  });
}

export default function CortesVitrine({ 
  merchant, 
  services,
  barbers = [], 
  onBack, 
  onUpdateMerchant,
  isOnlyView = false,
  onLogout,
  isPublicAccess = false,
  onBookOnline
}: CortesVitrineProps) {
  const [activeSubTab, setActiveSubTab] = useState<'editor' | 'preview'>('editor');
  
  // Local state for Vitrine inputs
  const [horarios, setHorarios] = useState(merchant.vitrineHorarios || 'Segunda a Sábado: 09:00 às 19:00');
  const [localizacao, setLocalizacao] = useState(merchant.vitrineLocalizacao || 'Av. Principal, 123 - Centro');
  const [whatsapp, setWhatsapp] = useState(merchant.vitrineWhatsApp || merchant.whatsapp || '');
  const [permitirWhatsApp, setPermitirWhatsApp] = useState<boolean>(merchant.vitrinePermitirAgendamentoWhatsApp ?? true);
  
  // Modo de Ação da Vitrine: 'agendamento' (fluxo no sistema) ou 'whatsapp' (direto para o WhatsApp)
  const [modoAcao, setModoAcao] = useState<'agendamento' | 'whatsapp'>(
    merchant.vitrineModoAcao || 'agendamento'
  );
  // Mensagem personalizada para o WhatsApp
  const [mensagemWhatsAppCustom, setMensagemWhatsAppCustom] = useState<string>(
    merchant.vitrineMensagemWhatsAppPersonalizada || ''
  );
  // Usar saudação dinâmica por horário (Bom dia / Boa tarde / Boa noite)
  const [usarSaudacaoHorario, setUsarSaudacaoHorario] = useState<boolean>(
    merchant.vitrineUsarSaudacaoHorarioWhatsApp ?? true
  );

  const [showSiteBookingModal, setShowSiteBookingModal] = useState<boolean>(false);
  const [showClientAreaModal, setShowClientAreaModal] = useState<boolean>(false);
  const [showHorarioHojeDetails, setShowHorarioHojeDetails] = useState<boolean>(false);
  const [clientPhone, setClientPhone] = useState<string>('');
  const [clientPass, setClientPass] = useState<string>('');
  const [instagram, setInstagram] = useState(merchant.vitrineInstagram || '@cortestime_barber');
  const [linkBio, setLinkBio] = useState(merchant.vitrineLinkBio || 'instagram.com/cortestime_barber');
  const [logoText, setLogoText] = useState(merchant.vitrineLogo || merchant.nomeBarbearia || 'Cortes Vitrine');
  const [logoImage, setLogoImage] = useState(merchant.vitrineLogoImage || '');
  const [slogan, setSlogan] = useState(merchant.vitrineSlogan || 'Corte, Barba & Estilo de Alto Padrão');

  // Helpers de Saudação e Mensagem Dinâmica do WhatsApp
  const getSaudacaoHorario = () => {
    if (!usarSaudacaoHorario) return 'Olá';
    const hora = new Date().getHours();
    if (hora >= 5 && hora < 12) return 'Bom dia';
    if (hora >= 12 && hora < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const getNomeBarbeiro = () => {
    return merchant.nomeProprietario || merchant.nomeBarbearia || 'Barbeiro';
  };

  const getNomeBarbearia = () => {
    return logoText || merchant.nomeBarbearia || 'Barbearia';
  };

  const getMensagemWhatsAppGerada = (servicoEscolhido?: string) => {
    const saudacao = getSaudacaoHorario();
    const nomeBarbeiro = getNomeBarbeiro();
    const nomeBarbearia = getNomeBarbearia();

    if (mensagemWhatsAppCustom && mensagemWhatsAppCustom.trim()) {
      return mensagemWhatsAppCustom
        .replace(/\{saudacao\}/gi, saudacao)
        .replace(/\{barbeiro\}/gi, nomeBarbeiro)
        .replace(/\{barbearia\}/gi, nomeBarbearia)
        .replace(/\{servico\}/gi, servicoEscolhido || 'corte de cabelo');
    }

    if (servicoEscolhido) {
      return `Olá ${nomeBarbeiro}, ${saudacao}! Vi a vitrine da ${nomeBarbearia} e gostaria de agendar o serviço: *${servicoEscolhido}*. Vocês estão abertos hoje e têm horário disponível?`;
    }
    return `Olá ${nomeBarbeiro}, ${saudacao}! Vi a vitrine da ${nomeBarbearia}. Vocês estão atendendo hoje? Gostaria de saber se tem horário disponível!`;
  };

  const getWhatsAppLink = (servicoEscolhido?: string) => {
    const cleanPhone = (whatsapp || merchant.whatsapp || '').replace(/\D/g, '') || '5582987243056';
    const msg = getMensagemWhatsAppGerada(servicoEscolhido);
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('A imagem é muito grande. Escolha uma foto com menos de 10MB.');
        return;
      }
      try {
        const compressed = await compressImageFile(file, 400, 400, 0.8);
        if (compressed) setLogoImage(compressed);
      } catch (err) {
        console.error('Erro ao processar logo:', err);
      }
    }
  };

  const handleCapaFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('A imagem é muito grande. Escolha uma foto com menos de 10MB.');
        return;
      }
      try {
        const compressed = await compressImageFile(file, 1000, 600, 0.75);
        if (compressed) setCapa(compressed);
      } catch (err) {
        console.error('Erro ao processar foto de capa:', err);
      }
    }
  };

  const [capa, setCapa] = useState(merchant?.vitrineCapa || DEFAULT_COVER_URL);
  const [linkPersonalizado, setLinkPersonalizado] = useState(
    merchant?.vitrineLinkPersonalizado || 
    (merchant?.nomeBarbearia || 'barbearia').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
  );
  
  // Local state for products
  const [products, setProducts] = useState<{ id: string; name: string; price: number }[]>(
    merchant.vitrineProdutos || [
      { id: 'p1', name: 'Pomada Efeito Matte Premium', price: 45.00 },
      { id: 'p2', name: 'Óleo Hidratante para Barba', price: 35.00 }
    ]
  );
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');

  // Local state for gallery
  const [gallery, setGallery] = useState<string[]>(
    merchant.vitrineGaleria || DEFAULT_HAIRCUTS
  );
  const [newGalleryUrl, setNewGalleryUrl] = useState('');

  // Model & Theme Customization State
  const [template, setTemplate] = useState<'modelo1' | 'modelo2'>(merchant.vitrineTemplate || 'modelo1');
  const [themePreset, setThemePreset] = useState<string>(merchant.vitrineThemePreset || 'cortestime');
  const [primaryColor, setPrimaryColor] = useState<string>(merchant.vitrinePrimaryColor || '#051b42');
  const [secondaryColor, setSecondaryColor] = useState<string>(merchant.vitrineSecondaryColor || '#2563eb');
  const [gradientEnabled, setGradientEnabled] = useState<boolean>(merchant.vitrineGradientEnabled ?? true);
  const [showTemplateModal, setShowTemplateModal] = useState<boolean>(false);

  // Horário de Hoje (Recurso Dinâmico e Ágil)
  const [horarioHoje, setHorarioHoje] = useState<VitrineHorarioHoje>(() => {
    if (merchant.vitrineHorarioHoje) {
      return {
        ativo: merchant.vitrineHorarioHoje.ativo ?? true,
        status: merchant.vitrineHorarioHoje.status || 'atendendo',
        inicio: merchant.vitrineHorarioHoje.inicio || '09:00',
        fim: merchant.vitrineHorarioHoje.fim || '19:00',
        temIntervalo: merchant.vitrineHorarioHoje.temIntervalo ?? false,
        intervaloInicio: merchant.vitrineHorarioHoje.intervaloInicio || '12:00',
        intervaloFim: merchant.vitrineHorarioHoje.intervaloFim || '13:30',
        proximoAtendimento: merchant.vitrineHorarioHoje.proximoAtendimento || 'Amanhã, das 09:00 às 18:00',
        mensagem: merchant.vitrineHorarioHoje.mensagem || '',
        dataAtualizacao: merchant.vitrineHorarioHoje.dataAtualizacao || new Date().toISOString().split('T')[0]
      };
    }
    return {
      ativo: true,
      status: 'atendendo',
      inicio: '09:00',
      fim: '19:00',
      temIntervalo: false,
      intervaloInicio: '12:00',
      intervaloFim: '13:30',
      proximoAtendimento: 'Amanhã, das 09:00 às 18:00',
      mensagem: '',
      dataAtualizacao: new Date().toISOString().split('T')[0]
    };
  });

  const [publicandoHoje, setPublicandoHoje] = useState(false);
  const [publicadoHojeSucesso, setPublicadoHojeSucesso] = useState(false);

  const getHojeData = () => {
    const agora = new Date();
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
    const dataExtenso = agora.toLocaleDateString('pt-BR', options);
    const diaSemana = agora.toLocaleDateString('pt-BR', { weekday: 'long' });
    const dataCurta = agora.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    return {
      dataExtenso: `Hoje, ${dataExtenso}`,
      diaSemana: diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1),
      dataCurta,
      dataIso: agora.toISOString().split('T')[0]
    };
  };

  const handlePublishHorarioHoje = async () => {
    setPublicandoHoje(true);
    try {
      const updatedHorarioHoje: VitrineHorarioHoje = {
        ...horarioHoje,
        ativo: true,
        dataAtualizacao: new Date().toISOString().split('T')[0]
      };

      await firebaseService.updateMerchantProfile(merchant.uid, {
        vitrineHorarioHoje: updatedHorarioHoje
      });

      if (onUpdateMerchant) {
        onUpdateMerchant({
          ...merchant,
          vitrineHorarioHoje: updatedHorarioHoje
        });
      }

      setPublicadoHojeSucesso(true);
      setTimeout(() => setPublicadoHojeSucesso(false), 3500);
    } catch (err) {
      console.error('Erro ao publicar horário de hoje:', err);
      alert('Erro ao salvar horário de hoje. Tente novamente.');
    } finally {
      setPublicandoHoje(false);
    }
  };

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showUpgradePlans, setShowUpgradePlans] = useState(false);
  const [showReviewsProModal, setShowReviewsProModal] = useState(false);
  const [subscribingPlan, setSubscribingPlan] = useState<string | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<{ name: string; price: number } | null>(null);

  const [downgradeNotice, setDowngradeNotice] = useState<string | null>(() => {
    return localStorage.getItem('cortestime_downgrade_notice');
  });

  // Client Area State
  const [isClientLoggedIn, setIsClientLoggedIn] = useState<boolean>(false);
  const [clientAppointments, setClientAppointments] = useState<Appointment[]>([]);
  const [clientNotifications, setClientNotifications] = useState<AppNotification[]>([]);
  const [isLoadingClientData, setIsLoadingClientData] = useState<boolean>(false);
  const [clientAreaError, setClientAreaError] = useState<string | null>(null);
  const [cancellingClientApp, setCancellingClientApp] = useState<Appointment | null>(null);
  const [clientCancelReason, setClientCancelReason] = useState<string>('');
  const [clientCancelSuccessMsg, setClientCancelSuccessMsg] = useState<string | null>(null);

  // Live Queue / Fila ao Vivo State
  const [liveQueue, setLiveQueue] = useState<QueueItem[]>([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState<boolean>(false);
  const [showJoinQueueModal, setShowJoinQueueModal] = useState<boolean>(false);
  const [joinQueueName, setJoinQueueName] = useState<string>('');
  const [joinQueuePhone, setJoinQueuePhone] = useState<string>('');
  const [joinQueueServiceId, setJoinQueueServiceId] = useState<string>(services[0]?.id || '');
  const [joinQueueBarberId, setJoinQueueBarberId] = useState<string>('');
  const [isJoiningQueue, setIsJoiningQueue] = useState<boolean>(false);
  const [joinQueueError, setJoinQueueError] = useState<string | null>(null);
  const [activeQueueItemId, setActiveQueueItemId] = useState<string | null>(() => {
    // Restore client's active queue token if exists in session
    return localStorage.getItem(`cortestime_my_queue_${merchant?.uid || 'guest'}`);
  });

  // Real-time polling for public vitrine live queue
  useEffect(() => {
    let isSubscribed = true;
    const fetchLiveQueue = async () => {
      if (!merchant?.uid) return;
      try {
        const list = await firebaseService.getQueue(merchant.uid);
        if (isSubscribed) {
          setLiveQueue(list);
        }
      } catch (err) {
        console.warn('Erro ao sincronizar fila ao vivo da vitrine:', err);
      }
    };

    fetchLiveQueue();
    const interval = setInterval(fetchLiveQueue, 5000);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [merchant?.uid]);

  // Derived queue metrics
  const waitingQueue = liveQueue.filter(q => q.status === 'waiting');
  const inProgressQueue = liveQueue.filter(q => q.status === 'in_progress');
  
  // Calculate average service duration based on registered services
  const defaultAvgServiceMin = services.length > 0
    ? Math.round(services.reduce((acc, s) => acc + (s.durationMin || 30), 0) / services.length)
    : 30;
  
  const activeBarbersCount = Math.max((barbers && barbers.length > 0 ? barbers.length : 1), 1);
  
  // Estimate wait time based on service duration of waiting clients
  const calculateEstimatedTimeForPosition = (positionZeroIndexed: number) => {
    if (positionZeroIndexed <= 0) return 0;
    const itemsAhead = waitingQueue.slice(0, positionZeroIndexed);
    const sumDuration = itemsAhead.reduce((acc, item) => {
      const serv = services.find(s => s.id === item.serviceId);
      return acc + (serv?.durationMin || defaultAvgServiceMin);
    }, 0);
    return Math.max(Math.ceil(sumDuration / activeBarbersCount), 5);
  };

  // Check if current user is in queue
  const myQueueItem = activeQueueItemId
    ? liveQueue.find(q => q.id === activeQueueItemId)
    : null;

  const myQueuePosition = myQueueItem && myQueueItem.status === 'waiting'
    ? waitingQueue.findIndex(q => q.id === myQueueItem.id) + 1
    : 0;

  const myQueueEstimatedMinutes = myQueuePosition > 0
    ? calculateEstimatedTimeForPosition(myQueuePosition - 1)
    : 0;

  const handleJoinQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinQueueName.trim()) {
      setJoinQueueError('Por favor, informe seu nome.');
      return;
    }
    const cleanPhone = joinQueuePhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      setJoinQueueError('Por favor, informe seu WhatsApp para avisos.');
      return;
    }

    setIsJoiningQueue(true);
    setJoinQueueError(null);

    try {
      const newItemId = `queue_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const selectedService = services.find(s => s.id === joinQueueServiceId) || services[0];
      
      const newQueueItem: QueueItem = {
        id: newItemId,
        ownerId: merchant.uid || '',
        clientName: joinQueueName.trim(),
        clientPhone: joinQueuePhone.trim(),
        serviceId: selectedService?.id || 'service-default',
        barberId: joinQueueBarberId || undefined,
        status: 'waiting',
        joinedAt: new Date().toISOString()
      };

      await firebaseService.saveQueueItem(newQueueItem, merchant.uid || '');
      setLiveQueue(prev => [...prev, newQueueItem]);
      setActiveQueueItemId(newItemId);
      localStorage.setItem(`cortestime_my_queue_${merchant?.uid || 'guest'}`, newItemId);

      setShowJoinQueueModal(false);
      setJoinQueueName('');
      setJoinQueuePhone('');
    } catch (err) {
      console.error('Erro ao entrar na fila:', err);
      setJoinQueueError('Não foi possível entrar na fila agora. Tente novamente.');
    } finally {
      setIsJoiningQueue(false);
    }
  };

  const handleLeaveQueue = async () => {
    if (!activeQueueItemId) return;
    if (!confirm('Deseja realmente sair da fila de espera?')) return;

    try {
      await firebaseService.deleteQueueItem(activeQueueItemId);
      setLiveQueue(prev => prev.filter(q => q.id !== activeQueueItemId));
      setActiveQueueItemId(null);
      localStorage.removeItem(`cortestime_my_queue_${merchant?.uid || 'guest'}`);
    } catch (err) {
      console.error('Erro ao sair da fila:', err);
    }
  };

  const fetchClientData = async (phoneToFetch: string) => {
    const raw = phoneToFetch.replace(/\D/g, '');
    if (!raw || raw.length < 8) return;
    setIsLoadingClientData(true);
    setClientAreaError(null);

    try {
      // 1. Fetch appointments
      let allApps: Appointment[] = [];
      if (merchant.uid) {
        const remoteApps = await firebaseService.getAppointments(merchant.uid);
        allApps = remoteApps.filter(a => a.clientPhone.replace(/\D/g, '') === raw || a.clientPhone.includes(raw));
      } else {
        const localKeys = Object.keys(localStorage).filter(k => k.startsWith('cortestime_appointments_') || k === 'cortestime_guest_appointments');
        const list: Appointment[] = [];
        for (const k of localKeys) {
          try {
            const parsed = JSON.parse(localStorage.getItem(k) || '[]');
            list.push(...parsed);
          } catch (_) {}
        }
        allApps = list.filter(a => a.clientPhone.replace(/\D/g, '') === raw || a.clientPhone.includes(raw));
      }
      setClientAppointments(allApps);

      // 2. Fetch client notifications (including cancellation notices from barbershop)
      const notifs = await firebaseService.getClientNotifications(raw);
      setClientNotifications(notifs);
    } catch (err) {
      console.error('Error loading client area data:', err);
    } finally {
      setIsLoadingClientData(false);
    }
  };

  const handleClientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientPhone.trim() || clientPhone.replace(/\D/g, '').length < 8) {
      setClientAreaError('Por favor, informe um telefone válido com DDD.');
      return;
    }
    setClientAreaError(null);
    setIsClientLoggedIn(true);
    await fetchClientData(clientPhone);
  };

  const handleConfirmCancelFromClientArea = async () => {
    if (!cancellingClientApp) return;

    const serv = services.find(s => s.id === cancellingClientApp.serviceId);
    const barber = (barbers || []).find(b => b.id === cancellingClientApp.barberId);

    try {
      // 1. Update appointment in Firebase & LocalStorage
      await firebaseService.updateAppointmentStatus(cancellingClientApp.id, 'cancelled', {
        cancelledBy: 'client',
        cancellationReason: clientCancelReason.trim() || 'Cancelado pelo cliente na Área do Cliente'
      });

      // 2. Trigger push notification for Barbershop
      notificationService.notifyCancellationToBarbershop(
        cancellingClientApp,
        serv?.name,
        clientCancelReason.trim()
      );

      // 3. Save notification for barbershop
      const notif: AppNotification = {
        id: `notif-cancel-${cancellingClientApp.id}-${Date.now()}`,
        ownerId: merchant.uid || cancellingClientApp.ownerId || '',
        clientPhone: cancellingClientApp.clientPhone,
        target: 'barbershop',
        type: 'cancellation_by_client',
        title: '🚫 Cancelamento pelo Cliente (Área do Cliente)',
        body: `O cliente ${cancellingClientApp.clientName} cancelou o agendamento de ${serv?.name || 'Serviço'} (${cancellingClientApp.date} às ${cancellingClientApp.time}).${clientCancelReason.trim() ? ` Motivo: "${clientCancelReason.trim()}"` : ''}`,
        appointmentId: cancellingClientApp.id,
        clientName: cancellingClientApp.clientName,
        serviceName: serv?.name || '',
        barberName: barber?.name || '',
        date: cancellingClientApp.date,
        time: cancellingClientApp.time,
        reason: clientCancelReason.trim(),
        createdAt: new Date().toISOString(),
        read: false
      };
      await firebaseService.saveNotification(notif);

      // Update state
      setClientAppointments(prev => prev.map(a => a.id === cancellingClientApp.id ? {
        ...a,
        status: 'cancelled',
        cancelledBy: 'client',
        cancellationReason: clientCancelReason.trim(),
        cancelledAt: new Date().toISOString()
      } : a));

      setClientCancelSuccessMsg(`Horário do dia ${cancellingClientApp.date} às ${cancellingClientApp.time} cancelado com sucesso. A barbearia foi avisada!`);
      setCancellingClientApp(null);
      setClientCancelReason('');
    } catch (err) {
      console.error('Error cancelling appointment in client area:', err);
      alert('Erro ao cancelar o agendamento. Tente novamente.');
    }
  };

  const handleCloseDowngradeNotice = () => {
    localStorage.removeItem('cortestime_downgrade_notice');
    setDowngradeNotice(null);
  };

  const handleAddProduct = () => {
    if (!newProdName || !newProdPrice) return;
    const price = parseFloat(newProdPrice);
    if (isNaN(price)) return;
    
    setProducts(prev => [
      ...prev,
      { id: `p-${Date.now()}`, name: newProdName, price }
    ]);
    setNewProdName('');
    setNewProdPrice('');
  };

  const handleRemoveProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const handleAddGalleryUrl = () => {
    if (!newGalleryUrl) return;
    setGallery(prev => [...prev, newGalleryUrl]);
    setNewGalleryUrl('');
  };

  const handleRemoveGalleryItem = (index: number) => {
    setGallery(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      // Compress large images in background before saving to prevent Firestore 1MB limit crash
      const compressedLogo = await compressDataUrl(logoImage, 400, 400, 0.8);
      const compressedCapa = await compressDataUrl(capa, 1000, 600, 0.75);
      
      const compressedGallery = await Promise.all(
        gallery.map(img => compressDataUrl(img, 800, 800, 0.7))
      );

      const dataToUpdate: Partial<MerchantUser> = {
        vitrineHorarios: horarios || '',
        vitrineLocalizacao: localizacao || '',
        vitrineWhatsApp: whatsapp || '',
        vitrinePermitirAgendamentoWhatsApp: permitirWhatsApp,
        vitrineModoAcao: modoAcao,
        vitrineMensagemWhatsAppPersonalizada: mensagemWhatsAppCustom,
        vitrineUsarSaudacaoHorarioWhatsApp: usarSaudacaoHorario,
        vitrineInstagram: instagram || '',
        vitrineLinkBio: linkBio || '',
        vitrineLogo: logoText || '',
        vitrineLogoImage: compressedLogo || '',
        vitrineSlogan: slogan || '',
        vitrineCapa: compressedCapa || DEFAULT_COVER_URL,
        vitrineLinkPersonalizado: linkPersonalizado || '',
        vitrineProdutos: products || [],
        vitrineGaleria: compressedGallery || [],
        vitrineTemplate: template,
        vitrinePrimaryColor: primaryColor,
        vitrineSecondaryColor: secondaryColor,
        vitrineGradientEnabled: gradientEnabled,
        vitrineThemePreset: themePreset,
        vitrineHorarioHoje: horarioHoje,
      };

      await firebaseService.updateMerchantProfile(merchant.uid, dataToUpdate);
      
      if (onUpdateMerchant) {
        onUpdateMerchant({
          ...merchant,
          ...dataToUpdate
        });
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
      console.error('Error saving vitrine:', e);
      // Always sync state locally so user doesn't lose modifications
      if (onUpdateMerchant) {
        onUpdateMerchant({
          ...merchant,
          vitrineHorarios: horarios,
          vitrineLocalizacao: localizacao,
          vitrineWhatsApp: whatsapp,
          vitrinePermitirAgendamentoWhatsApp: permitirWhatsApp,
          vitrineModoAcao: modoAcao,
          vitrineMensagemWhatsAppPersonalizada: mensagemWhatsAppCustom,
          vitrineUsarSaudacaoHorarioWhatsApp: usarSaudacaoHorario,
          vitrineInstagram: instagram,
          vitrineLinkBio: linkBio,
          vitrineLogo: logoText,
          vitrineLogoImage: logoImage,
          vitrineSlogan: slogan,
          vitrineCapa: capa,
          vitrineLinkPersonalizado: linkPersonalizado,
          vitrineProdutos: products,
          vitrineGaleria: gallery,
          vitrineTemplate: template,
          vitrinePrimaryColor: primaryColor,
          vitrineSecondaryColor: secondaryColor,
          vitrineGradientEnabled: gradientEnabled,
          vitrineThemePreset: themePreset,
          vitrineHorarioHoje: horarioHoje,
        });
      }

      const errorStr = String(e?.message || e || '');
      if (errorStr.includes('exceeds maximum size') || errorStr.includes('1048576')) {
        alert('As imagens da vitrine ou galeria estão muito pesadas. Tente remover algumas fotos da galeria ou escolher fotos menores.');
      } else {
        alert('Não foi possível salvar os dados no servidor. Suas alterações foram mantidas nesta sessão.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const formattedWhatsAppUrl = getWhatsAppLink();
  const formattedInstagramUrl = instagram.startsWith('http') ? instagram : `https://instagram.com/${instagram.replace('@', '')}`;
  const bioLinkDisplay = linkBio.startsWith('http') ? linkBio : `https://${linkBio}`;

  // Custom QR Code link - Points to actual window.location.origin to be fully functional
  const cleanSlug = (linkPersonalizado || merchant?.nomeBarbearia || 'barbearia')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '-');
  
  const realUrl = `${window.location.origin}?v=${cleanSlug}`;
  const displayUrl = `cortestime.com/vitrine/${cleanSlug}`;

  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(realUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQRCode = () => {
    const svgElement = document.getElementById('qr-code-svg-element');
    if (!svgElement) return;
    
    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `qr-code-${cleanSlug}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };

  const renderBarbersSection = (isPreview = false) => {
    if (!barbers || barbers.length === 0) return null;
    return (
      <div className={`border-b border-gray-100 ${isPreview ? 'py-3' : 'py-5'}`}>
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1">
          <Users className="w-3.5 h-3.5 text-brand-blue" />
          <span>Nossa Equipe de Barbeiros</span>
        </h4>
        <div className="grid grid-cols-2 gap-2.5">
          {barbers.map(b => (
            <div key={b.id} className="bg-white p-2.5 rounded-2xl border border-gray-100 flex items-center gap-2.5 shadow-2xs">
              <div className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                {b.avatar ? (
                  <img src={b.avatar} alt={b.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-xs text-gray-600">
                    {b.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <span className="font-bold text-xs text-gray-900 block truncate">{b.name}</span>
                <span className="text-[10px] text-gray-400 truncate block">{b.specialty || 'Barbeiro'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderGallerySection = (isPreview = false) => {
    if (!gallery || gallery.length === 0) return null;
    return (
      <div className={`border-b border-gray-100 ${isPreview ? 'py-3' : 'py-5'}`}>
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1">
          <Camera className="w-3.5 h-3.5 text-brand-blue" />
          <span>Nosso Portfólio</span>
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {gallery.map((img, idx) => (
            <div key={idx} className="aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-2xs border border-gray-100">
              <img src={img} alt="Corte" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderReviewsSection = (isPreview = false) => {
    if (!merchant.vitrineAvaliacoes || merchant.vitrineAvaliacoes.length === 0) return null;
    const avg = (merchant.vitrineAvaliacoes.reduce((acc, r) => acc + (r.rating || 5), 0) / merchant.vitrineAvaliacoes.length).toFixed(1).replace('.', ',');
    return (
      <div className={`border-b border-gray-100 space-y-2.5 text-left ${isPreview ? 'py-3' : 'py-5'}`}>
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full text-amber-900 text-[10px] font-extrabold shadow-2xs">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{avg} de 5 ({merchant.vitrineAvaliacoes.length} {merchant.vitrineAvaliacoes.length === 1 ? 'avaliação' : 'avaliações'})</span>
          </div>
        </div>
        <div className="space-y-2">
          {merchant.vitrineAvaliacoes.map((rev, idx) => (
            <div key={rev.id || idx} className="bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs space-y-1">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < (rev.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                  ))}
                </div>
                {rev.timeAgo && <span className="text-[9px] text-gray-400 font-medium">{rev.timeAgo}</span>}
              </div>
              <p className="text-[11px] font-medium text-gray-800">"{rev.comment}"</p>
              <span className="text-[9px] text-gray-500 font-bold block">— {rev.author}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderQueueSection = (isPreview = false) => {
    return (
      <div className={`rounded-2xl border border-gray-100 bg-white space-y-3 shadow-2xs ${isPreview ? 'p-3 my-2' : 'p-4 my-3'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                <span>✂️ Fila ao vivo</span>
                {waitingQueue.length > 0 && (
                  <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.2 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Aberta
                  </span>
                )}
              </h4>
              <p className="text-[9px] text-gray-400">Atendimento por ordem de chegada</p>
            </div>
          </div>

          {waitingQueue.length > 0 ? (
            <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              {waitingQueue.length} {waitingQueue.length === 1 ? 'pessoa' : 'pessoas'} na fila
            </span>
          ) : (
            <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-lg">
              Fila livre
            </span>
          )}
        </div>

        {/* STATUS BANNER DO CLIENTE CASO ELE JÁ ESTEJA NA FILA */}
        {myQueueItem && myQueueItem.status === 'waiting' && (
          <div className="bg-gradient-to-br from-emerald-50 to-blue-50 border-2 border-emerald-400/80 rounded-2xl p-3 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded-md">
                Sua Posição
              </span>
              <span className="text-xs text-gray-600 font-bold">
                {myQueueItem.clientName}
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-0.5">
              <div>
                <span className="text-2xl font-black text-emerald-950 font-display">
                  #{myQueuePosition}
                </span>
                <p className="text-[11px] font-semibold text-emerald-800 mt-0.5">
                  {myQueuePosition === 1 ? (
                    <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                      🎉 Você é o próximo!
                    </span>
                  ) : (
                    <span>{myQueuePosition - 1} {myQueuePosition - 1 === 1 ? 'pessoa' : 'pessoas'} na sua frente</span>
                  )}
                </p>
              </div>

              <div className="text-right">
                <div className="flex items-center justify-end gap-1 text-xs font-mono font-black text-brand-blue">
                  <Clock className="w-3 h-3" />
                  <span>~{myQueueEstimatedMinutes} min</span>
                </div>
                <span className="text-[9px] text-gray-400 block mt-0.5">
                  Tempo estimado
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[10px]">
              <span className="text-gray-500 italic text-[9px]">
                Avisaremos você quando sua vez chegar!
              </span>
              <button
                type="button"
                onClick={handleLeaveQueue}
                className="text-red-600 hover:text-red-800 font-bold hover:underline cursor-pointer"
              >
                Desistir / Sair
              </button>
            </div>
          </div>
        )}

        {myQueueItem && myQueueItem.status === 'in_progress' && (
          <div className="bg-blue-50 border-2 border-blue-400 rounded-2xl p-3 text-center space-y-1">
            <span className="text-xs font-black text-blue-900 flex items-center justify-center gap-1.5">
              <Scissors className="w-3.5 h-3.5 text-blue-600 animate-bounce" />
              Sua vez chegou!
            </span>
            <p className="text-[11px] text-blue-700">
              Você está sendo atendido na cadeira agora. Bom corte!
            </p>
          </div>
        )}

        {/* SE O CLIENTE NÃO ESTÁ NA FILA */}
        {!myQueueItem && (
          <div className="space-y-2">
            {waitingQueue.length === 0 ? (
              <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 text-center space-y-0.5">
                <p className="text-xs text-gray-600 font-medium">
                  No momento não há clientes na fila.
                </p>
                <p className="text-[9px] text-gray-400">
                  Entre na fila agora para ser o primeiro atendido!
                </p>
              </div>
            ) : (
              <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 space-y-1">
                <div className="flex justify-between items-center text-xs text-gray-700">
                  <span className="font-medium">Tempo médio de espera:</span>
                  <span className="font-mono font-bold text-gray-900 flex items-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3 text-brand-blue" />
                    ~{calculateEstimatedTimeForPosition(waitingQueue.length)} min
                  </span>
                </div>
                <p className="text-[9px] text-gray-400 leading-tight">
                  * O tempo é uma estimativa calculada pela duração dos serviços.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowJoinQueueModal(true)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Entrar na Fila ao Vivo</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderVitrineContent = (isPreview = false) => {
    if (template === 'modelo2') {
      return (
        <div className={`w-full flex flex-col flex-1 ${isPreview ? 'p-0 text-left' : 'text-left'}`}>
          {/* TOP HERO CONTAINER (THEMED / GRADIENT) */}
          <div 
            className={`relative overflow-hidden text-white transition-all ${
              isPreview 
                ? 'p-4 pt-6 pb-7 rounded-t-[24px] -mt-4 -mx-4' 
                : 'p-6 pt-8 pb-10 sm:rounded-t-[36px]'
            }`}
            style={{
              background: gradientEnabled
                ? `linear-gradient(145deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
                : primaryColor
            }}
          >
            {/* Ambient Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />

            {/* Back button (Only in public full view) */}
            {!isPreview && onBack && (
              <button 
                onClick={onBack}
                className="absolute top-4 left-4 bg-black/35 backdrop-blur-md hover:bg-black/55 text-xs font-black text-white py-1.5 px-3 rounded-full transition-all flex items-center gap-1 cursor-pointer border border-white/15 z-20"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar</span>
              </button>
            )}

            {/* Logo Circle */}
            <div className="text-center relative z-10">
              <div className={`${isPreview ? 'w-16 h-16 text-xl mb-2' : 'w-20 h-20 text-2xl mb-3'} rounded-full bg-white/10 backdrop-blur-md border-2 border-white/80 p-0.5 flex items-center justify-center font-sans font-black mx-auto shadow-xl overflow-hidden`}>
                {logoImage ? (
                  <img src={logoImage} alt={logoText} className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span className="text-white">{logoText.charAt(0).toUpperCase()}</span>
                )}
              </div>

              <h2 className={`font-sans font-black tracking-tight text-white drop-shadow-sm ${isPreview ? 'text-lg' : 'text-2xl'}`}>
                {logoText}
              </h2>

              {slogan && (
                <p className={`text-white/80 italic mt-0.5 font-medium max-w-[260px] mx-auto leading-tight ${isPreview ? 'text-[10px]' : 'text-xs'}`}>
                  "{slogan}"
                </p>
              )}

              {/* Rating Stars */}
              <div className="flex items-center justify-center gap-1 mt-2">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`${isPreview ? 'w-3 h-3' : 'w-3.5 h-3.5'} fill-amber-400 text-amber-400`} />
                  ))}
                </div>
                <span className={`font-bold text-amber-300 ml-1 ${isPreview ? 'text-[10px]' : 'text-xs'}`}>5.0</span>
              </div>

              {/* Action Button & Quick Contacts */}
              <div className="flex items-center justify-center gap-2 mt-4">
                {modoAcao === 'whatsapp' ? (
                  <button
                    type="button"
                    onClick={() => {
                      window.open(getWhatsAppLink(), '_blank');
                    }}
                    className={`flex-1 max-w-[240px] bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-emerald-950 font-black py-2.5 px-4 rounded-full transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 ${
                      isPreview ? 'text-xs' : 'text-xs sm:text-sm py-3'
                    }`}
                  >
                    <Phone className="w-4 h-4 fill-current shrink-0" />
                    <span>Chamar no WhatsApp</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (onBookOnline) onBookOnline();
                      else setShowSiteBookingModal(true);
                    }}
                    className={`flex-1 max-w-[200px] bg-white hover:bg-gray-100 active:scale-95 text-gray-950 font-black py-2.5 px-4 rounded-full transition-all shadow-lg cursor-pointer ${
                      isPreview ? 'text-xs' : 'text-xs sm:text-sm py-3'
                    }`}
                  >
                    Agendar agora
                  </button>
                )}

                {whatsapp && modoAcao !== 'whatsapp' && (
                  <a
                    href={formattedWhatsAppUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`${isPreview ? 'w-8 h-8' : 'w-10 h-10'} rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all shadow-md shrink-0 cursor-pointer`}
                    title="WhatsApp"
                  >
                    <Phone className={`${isPreview ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
                  </a>
                )}

                {instagram && (
                  <a
                    href={formattedInstagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`${isPreview ? 'w-8 h-8' : 'w-10 h-10'} rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all shadow-md shrink-0 cursor-pointer`}
                    title="Instagram"
                  >
                    <Instagram className={`${isPreview ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
                  </a>
                )}
              </div>

              {/* Horário de Hoje (Linha Única Compacta: Ícone + Atendendo hoje + Data + Horário + >) */}
              {horarioHoje.ativo && (
                <button
                  type="button"
                  onClick={() => setShowHorarioHojeDetails(true)}
                  className={`mt-3 w-full max-w-sm mx-auto flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-xl text-left transition-all backdrop-blur-md border shadow-2xs cursor-pointer group active:scale-98 ${
                    horarioHoje.status === 'atendendo'
                      ? 'bg-emerald-950/40 hover:bg-emerald-950/60 border-emerald-400/30 text-white'
                      : 'bg-black/30 hover:bg-black/45 border-white/15 text-white'
                  }`}
                  title="Toque para ver detalhes de atendimento e horários"
                >
                  <div className="flex items-center gap-1.5 min-w-0 overflow-hidden text-[11px] sm:text-xs">
                    <Clock className={`w-3.5 h-3.5 shrink-0 ${
                      horarioHoje.status === 'atendendo' ? 'text-emerald-400' : 'text-sky-300'
                    }`} />
                    
                    {horarioHoje.status === 'atendendo' ? (
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-extrabold text-emerald-400 shrink-0 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Atendendo hoje
                        </span>
                        <span className="text-emerald-400/40 shrink-0 font-bold">·</span>
                        <span className="font-semibold text-white/80 shrink-0">
                          {getHojeData().dataCurta}
                        </span>
                        <span className="text-white/30 shrink-0 font-bold">·</span>
                        <span className="font-mono font-bold text-white truncate">
                          {horarioHoje.inicio || '09:00'} às {horarioHoje.fim || '19:00'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-extrabold text-sky-300 shrink-0 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                          Não atende hoje
                        </span>
                        <span className="text-sky-300/40 shrink-0 font-bold">·</span>
                        <span className="font-semibold text-white/80 shrink-0">
                          {getHojeData().dataCurta}
                        </span>
                        <span className="text-white/30 shrink-0 font-bold">·</span>
                        <span className="font-medium text-white/80 text-[10px] truncate">
                          {horarioHoje.proximoAtendimento || 'Amanhã'}
                        </span>
                      </div>
                    )}
                  </div>

                  <ChevronRight className="w-3.5 h-3.5 text-white/50 group-hover:text-white shrink-0 transition-transform group-hover:translate-x-0.5" />
                </button>
              )}

              {/* Location Card */}
              <div 
                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(localizacao)}`, '_blank')}
                className={`mt-3.5 bg-black/25 hover:bg-black/35 backdrop-blur-md border border-white/10 rounded-2xl text-left transition-all cursor-pointer shadow-xs ${
                  isPreview ? 'p-2.5' : 'p-3.5'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-white text-xs">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Localização</span>
                </div>
                <p className={`text-white/85 font-medium mt-0.5 leading-snug ${isPreview ? 'text-[10px]' : 'text-[11px]'}`}>
                  {localizacao}
                </p>
              </div>

              {/* Client Area Quick Card */}
              <div 
                onClick={() => setShowClientAreaModal(true)}
                className={`mt-2 bg-white text-gray-900 rounded-2xl text-left flex items-center justify-between shadow-md hover:bg-gray-50 transition-all cursor-pointer ${
                  isPreview ? 'p-2.5' : 'p-3'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 shrink-0">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className={`font-black text-gray-900 leading-tight ${isPreview ? 'text-[11px]' : 'text-xs'}`}>Já é cliente?</p>
                    <p className="text-[9px] text-gray-500 font-medium">Acesse e gerencie seus agendamentos</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
              </div>
            </div>
          </div>

          {/* LOWER WHITE SHEET / SERVICES & QUEUE */}
          <div className={`bg-[#faf9f6] rounded-t-[28px] relative z-10 space-y-4 text-left flex-1 flex flex-col ${
            isPreview ? 'p-3.5 -mt-3.5' : 'p-5 -mt-4'
          }`}>
            {/* Nossos Serviços */}
            <div>
              <h3 className={`font-black text-gray-900 uppercase tracking-wider mb-2.5 ${isPreview ? 'text-[10px]' : 'text-xs'}`}>
                Nossos serviços
              </h3>
              <div className="space-y-2">
                {services.length === 0 ? (
                  <p className="text-xs text-gray-400">Nenhum serviço cadastrado.</p>
                ) : (
                  services.map(s => (
                    <div
                      key={s.id}
                      onClick={() => {
                        if (modoAcao === 'whatsapp') {
                          window.open(getWhatsAppLink(s.name), '_blank');
                        } else {
                          if (onBookOnline) onBookOnline();
                          else setShowSiteBookingModal(true);
                        }
                      }}
                      className={`bg-white hover:bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-between shadow-2xs transition-all cursor-pointer group ${
                        isPreview ? 'p-2.5' : 'p-3.5'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <span className={`font-extrabold text-gray-900 block truncate group-hover:text-brand-blue transition-colors ${
                          isPreview ? 'text-xs' : 'text-sm'
                        }`}>
                          {s.name}
                        </span>
                        <span className={`text-gray-500 font-medium flex items-center gap-1 mt-0.5 ${
                          isPreview ? 'text-[10px]' : 'text-xs'
                        }`}>
                          <Clock className="w-3 h-3 text-gray-400" />
                          {s.durationMin} min
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`font-mono font-black text-gray-900 bg-gray-50 px-2 py-0.5 rounded-xl border border-gray-100 ${
                          isPreview ? 'text-xs' : 'text-sm px-2.5 py-1'
                        }`}>
                          R$ {s.price.toFixed(2)}
                        </span>
                        {modoAcao === 'whatsapp' && (
                          <span className="bg-emerald-500 hover:bg-emerald-600 text-white p-1.5 rounded-xl flex items-center justify-center transition-colors shadow-2xs" title="Agendar pelo WhatsApp">
                            <Phone className="w-3 h-3 fill-current" />
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Fila ao Vivo (se aplicável) */}
            {(merchant?.serviceMode === 'ordem_chegada' || merchant?.serviceMode === 'ambos') && (
              renderQueueSection(isPreview)
            )}

            {/* Equipe / Barbeiros */}
            {barbers && barbers.length > 0 && (
              renderBarbersSection(isPreview)
            )}

            {/* Galeria de Cortes */}
            {gallery.length > 0 && (
              renderGallerySection(isPreview)
            )}

            {/* Avaliações dos Clientes */}
            {merchant.vitrineAvaliacoes && merchant.vitrineAvaliacoes.length > 0 && (
              renderReviewsSection(isPreview)
            )}

            {/* Footer Branding */}
            <div className="text-center pt-4 pb-2 mt-auto text-[10px] text-gray-400 font-medium flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
              <span>Tecnologia Cortestime</span>
            </div>
          </div>
        </div>
      );
    }

    // MODELO 1 (CLÁSSICO COMPLETO)
    return (
      <div className={`w-full flex flex-col flex-1 ${isPreview ? 'p-0 text-left' : 'text-left'}`}>
        {/* Cover banner with curved bottom arch */}
        <div className={`w-full relative overflow-hidden shrink-0 ${
          isPreview ? 'h-32 sm:h-36' : 'h-48 sm:h-56'
        }`}>
          <img src={capa} alt="Capa" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          {!isPreview && onBack && (
            <button 
              onClick={onBack}
              className="absolute top-4 left-4 bg-black/40 backdrop-blur-md hover:bg-black/60 text-xs font-black text-white py-2 px-3.5 rounded-full transition-all flex items-center gap-1 cursor-pointer border border-white/10 z-20"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar</span>
            </button>
          )}

          {/* Smooth bottom curve transitioning into white body */}
          <div className="absolute -bottom-1 left-0 right-0 overflow-hidden leading-none z-10 pointer-events-none">
            <svg viewBox="0 0 500 60" preserveAspectRatio="none" className="w-full h-7 sm:h-10 fill-[#faf9f6]">
              <path d="M0,60 C180,0 320,0 500,60 L500,60 L0,60 Z" />
            </svg>
          </div>
        </div>

        {/* Inner container */}
        <div className={`flex-1 flex flex-col text-left ${isPreview ? 'p-0 px-3 pt-0' : 'p-6 pt-0'}`}>
          {/* Profile Info */}
          <div className={`text-center pb-4 relative z-20 ${
            isPreview ? '-mt-7' : '-mt-10'
          }`}>
            <div 
              className={`${
                isPreview ? 'w-16 h-16 text-xl' : 'w-20 h-20 text-2xl'
              } rounded-full text-white border-4 border-white flex items-center justify-center font-sans font-black mx-auto shadow-xl mb-2 overflow-hidden bg-white`}
              style={{
                background: logoImage ? '#ffffff' : (gradientEnabled
                  ? `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
                  : primaryColor)
              }}
            >
              {logoImage ? (
                <img src={logoImage} alt={logoText} className="w-full h-full object-cover" />
              ) : (
                logoText.charAt(0).toUpperCase()
              )}
            </div>

            <h2 className={`font-sans font-black tracking-tight text-gray-900 ${
              isPreview ? 'text-lg' : 'text-2xl'
            }`}>
              {logoText || 'Barbearia'}
            </h2>

            {slogan ? (
              <p className={`text-gray-500 italic mt-0.5 font-medium max-w-[280px] mx-auto leading-relaxed ${
                isPreview ? 'text-[11px]' : 'text-xs'
              }`}>
                "{slogan}"
              </p>
            ) : (
              <p className={`text-gray-500 italic mt-0.5 font-medium max-w-[280px] mx-auto leading-relaxed ${
                isPreview ? 'text-[11px]' : 'text-xs'
              }`}>
                "Corte, Barba & Estilo de Alto Padrão"
              </p>
            )}

            <div className="mt-2.5">
              <span className="text-[10px] text-gray-600 font-extrabold uppercase tracking-widest bg-[#edf0f5] inline-block px-4 py-1 rounded-full shadow-2xs">
                Vitrine Digital Oficial
              </span>
            </div>

            {/* Horário de Hoje - Status Pill Conforme Designer */}
            {horarioHoje.ativo && (
              <button
                type="button"
                onClick={() => setShowHorarioHojeDetails(true)}
                className={`w-full max-w-sm mx-auto mt-3 flex items-center justify-between gap-1.5 px-3.5 py-2.5 rounded-2xl transition-all text-left cursor-pointer border shadow-2xs group active:scale-98 ${
                  horarioHoje.status === 'atendendo'
                    ? 'bg-[#f0faf4] hover:bg-[#e4f6eb] border-[#c2ebd1] text-emerald-950'
                    : 'bg-[#f0f6ff] hover:bg-[#e4efff] border-[#bfdbfe] text-blue-950'
                }`}
                title="Toque para ver detalhes de atendimento e horários"
              >
                <div className="flex items-center justify-between w-full min-w-0 text-[11px] sm:text-xs font-sans">
                  {/* Left: Clock Icon + Status */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Clock className={`w-4 h-4 shrink-0 ${
                      horarioHoje.status === 'atendendo' ? 'text-emerald-700' : 'text-blue-700'
                    }`} />
                    
                    {horarioHoje.status === 'atendendo' ? (
                      <span className="font-extrabold text-emerald-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                        <span>Atendendo hoje</span>
                      </span>
                    ) : (
                      <span className="font-extrabold text-blue-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                        <span>Hoje não atendemos</span>
                      </span>
                    )}
                  </div>

                  <span className="text-gray-300 font-light mx-1">|</span>

                  {/* Middle: Current Date */}
                  <span className="font-semibold text-gray-600 shrink-0 text-[11px]">
                    {getHojeData().dataCurta}
                  </span>

                  <span className="text-gray-300 font-light mx-1">|</span>

                  {/* Right: Hours */}
                  {horarioHoje.status === 'atendendo' ? (
                    <span className="font-bold text-gray-900 shrink-0 text-[11px] tracking-tight">
                      {horarioHoje.inicio || '09:00'} – {horarioHoje.fim || '19:00'}
                    </span>
                  ) : (
                    <span className="font-medium text-gray-700 shrink-0 text-[10px] truncate max-w-[90px]">
                      {horarioHoje.proximoAtendimento || 'Amanhã'}
                    </span>
                  )}
                </div>
              </button>
            )}
          </div>

          {/* Operational Details (Endereço Card) */}
          <div className="pt-1 pb-4">
            {/* Endereço Card */}
            <div 
              onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(localizacao || 'Centro')}`, '_blank')}
              className="bg-white rounded-2xl p-3.5 border border-gray-100/90 shadow-2xs flex items-center gap-3 hover:bg-gray-50/80 transition-colors cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-black text-[9px] sm:text-[10px] text-gray-400 uppercase tracking-wider">
                  ENDEREÇO
                </p>
                <p className="font-bold text-gray-800 text-xs mt-0.5 leading-snug truncate">
                  {localizacao || 'Av. Principal, 123 - Centro'}
                </p>
              </div>
            </div>
          </div>

          {/* Services listing */}
          <div className={`border-b border-gray-100 ${isPreview ? 'py-4' : 'py-6'}`}>
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3.5">
              Tabela de Serviços & Preços
            </h4>
            <div className="space-y-2.5">
              {services.length === 0 ? (
                <p className="text-xs text-gray-400">Nenhum serviço cadastrado.</p>
              ) : (
                services.map(s => (
                  <div key={s.id} className="flex justify-between items-center text-xs p-2.5 rounded-2xl bg-gray-50/70 hover:bg-gray-100/70 transition-colors">
                    <div className="min-w-0 pr-2">
                      <span className="font-bold text-gray-900 block truncate">{s.name}</span>
                      <span className="text-[10px] text-gray-400 font-medium">{s.durationMin} min</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono font-bold text-gray-900 bg-white px-2.5 py-1 rounded-xl border border-gray-100 shadow-2xs">R$ {s.price.toFixed(0)}</span>
                      {modoAcao === 'whatsapp' ? (
                        <button
                          type="button"
                          onClick={() => {
                            window.open(getWhatsAppLink(s.name), '_blank');
                          }}
                          className="text-white text-[10px] font-extrabold px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs bg-emerald-600 hover:bg-emerald-500 active:scale-95 flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3 fill-current" />
                          <span>WhatsApp</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (onBookOnline) onBookOnline();
                            else setShowSiteBookingModal(true);
                          }}
                          className="text-white text-[10px] font-extrabold px-3 py-1.5 rounded-xl transition-colors cursor-pointer shadow-2xs active:scale-95"
                          style={{
                            background: gradientEnabled
                              ? `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
                              : primaryColor
                          }}
                        >
                          Agendar
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Fila ao Vivo (se aplicável) */}
          {(merchant?.serviceMode === 'ordem_chegada' || merchant?.serviceMode === 'ambos') && (
            renderQueueSection(isPreview)
          )}

          {/* Equipe / Barbeiros */}
          {barbers && barbers.length > 0 && (
            renderBarbersSection(isPreview)
          )}

          {/* Products Showcase */}
          {products.length > 0 && (
            <div className={`border-b border-gray-100 ${isPreview ? 'py-4' : 'py-6'}`}>
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3.5">
                Produtos Recomendados
              </h4>
              <div className="grid grid-cols-2 gap-2.5">
                {products.map(p => (
                  <div key={p.id} className="bg-gray-50/70 p-2.5 rounded-2xl border border-gray-100 flex flex-col justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-gray-800 leading-snug line-clamp-2">{p.name}</p>
                    </div>
                    <p className="text-xs font-mono font-bold text-blue-600 mt-2">R$ {p.price.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Galeria de Cortes */}
          {gallery.length > 0 && (
            renderGallerySection(isPreview)
          )}

          {/* Avaliações dos Clientes */}
          {merchant.vitrineAvaliacoes && merchant.vitrineAvaliacoes.length > 0 && (
            renderReviewsSection(isPreview)
          )}

          {/* Hero Booking / WhatsApp Card (Apenas se serviceMode for 'agendamento' (padrão) ou 'ambos') */}
          {(merchant?.serviceMode !== 'ordem_chegada') && (
            <div className={`bg-white rounded-3xl shadow-sm border border-gray-100 text-center space-y-4 my-4 ${
              isPreview ? 'p-4' : 'p-6 sm:p-8'
            }`}>
              {modoAcao === 'whatsapp' ? (
                <>
                  <div className="space-y-1">
                    <h3 className={`font-light tracking-tight text-gray-900 leading-tight ${isPreview ? 'text-2xl' : 'text-3xl sm:text-4xl'}`}>
                      Atendimento direto no
                    </h3>
                    <div className="flex items-center justify-center gap-2 flex-nowrap">
                      <span className={`font-light tracking-tight text-gray-900 ${isPreview ? 'text-2xl' : 'text-3xl sm:text-4xl'}`}>
                        seu
                      </span>
                      <div 
                        className={`relative inline-flex items-center text-white font-extrabold rounded-2xl shadow-2xs transform -rotate-1 shrink-0 bg-emerald-600 ${
                          isPreview ? 'text-base px-2.5 py-0.5' : 'text-xl sm:text-2xl px-4 py-1'
                        }`}
                      >
                        WhatsApp
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-white animate-pulse" />
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 font-normal max-w-xs mx-auto leading-relaxed">
                    Fale com {getNomeBarbeiro()} e tire suas dúvidas ou combine seu horário na hora
                  </p>

                  <div className="pt-2 space-y-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        window.open(getWhatsAppLink(), '_blank');
                      }}
                      className="w-full max-w-xs mx-auto text-white font-black text-sm py-3 px-6 rounded-full transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 active:scale-95 bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
                    >
                      <Phone className="w-4 h-4 fill-current" />
                      <span>Chamar no WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowClientAreaModal(true)}
                      className="text-xs font-semibold text-gray-700 hover:text-blue-600 transition-colors py-1 cursor-pointer block mx-auto"
                    >
                      Área do Cliente
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <h3 className={`font-light tracking-tight text-gray-900 leading-tight ${isPreview ? 'text-2xl' : 'text-3xl sm:text-4xl'}`}>
                      Agende seu
                    </h3>
                    <div className="flex items-center justify-center gap-2 flex-nowrap">
                      <span className={`font-light tracking-tight text-gray-900 ${isPreview ? 'text-2xl' : 'text-3xl sm:text-4xl'}`}>
                        horário
                      </span>
                      <div 
                        className={`relative inline-flex items-center text-white font-extrabold rounded-2xl shadow-2xs transform -rotate-1 shrink-0 ${
                          isPreview ? 'text-base px-2.5 py-0.5' : 'text-xl sm:text-2xl px-4 py-1'
                        }`}
                        style={{
                          background: gradientEnabled
                            ? `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
                            : primaryColor
                        }}
                      >
                        online
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full ring-2 ring-white" />
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 font-normal max-w-xs mx-auto leading-relaxed">
                    Escolha o serviço, dia e horário que deseja ser atendido
                  </p>

                  <div className="pt-2 space-y-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (onBookOnline) onBookOnline();
                        else setShowSiteBookingModal(true);
                      }}
                      className="w-full max-w-xs mx-auto text-white font-bold text-sm py-3 px-6 rounded-full transition-all shadow-md cursor-pointer block active:scale-95"
                      style={{
                        background: gradientEnabled
                          ? `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
                          : primaryColor
                      }}
                    >
                      Agendar
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowClientAreaModal(true)}
                      className="text-xs font-semibold text-gray-700 hover:text-blue-600 transition-colors py-1 cursor-pointer block mx-auto"
                    >
                      Área do Cliente
                    </button>
                  </div>

                  {permitirWhatsApp && whatsapp && (
                    <div className="pt-1 flex justify-center">
                      <a
                        href={formattedWhatsAppUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-emerald-600 transition-colors"
                        title="Agendar via WhatsApp"
                      >
                        <MessageSquare className="w-5 h-5 fill-current" />
                      </a>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Branding badge */}
          <div className="text-center py-3 text-[10px] text-gray-400 font-medium">
            Desenvolvido por <strong className="text-gray-700">Cortestime Vitrine</strong>
          </div>
        </div>
      </div>
    );
  };

  const renderHorarioHojeDetailsModal = () => (
    <AnimatePresence>
      {showHorarioHojeDetails && (
        <div className="fixed inset-0 z-50 bg-[#051b42]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl p-5 sm:p-6 relative text-left"
          >
            <button
              type="button"
              onClick={() => setShowHorarioHojeDetails(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              {/* Header & Status */}
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                  horarioHoje.status === 'atendendo' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  <Clock className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                    horarioHoje.status === 'atendendo'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${horarioHoje.status === 'atendendo' ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
                    {horarioHoje.status === 'atendendo' ? 'Atendendo Hoje' : 'Hoje Não Atendemos'}
                  </span>
                  <h3 className="text-sm font-black text-gray-900 mt-0.5">{getHojeData().dataExtenso}</h3>
                </div>
              </div>

              {/* Informações Principais de Hoje */}
              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 space-y-2">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Horário de Atendimento Hoje</p>
                  {horarioHoje.status === 'atendendo' ? (
                    <p className="text-lg font-mono font-black text-gray-900 mt-0.5">
                      {horarioHoje.inicio || '09:00'} <span className="text-gray-400 text-xs font-normal">às</span> {horarioHoje.fim || '19:00'}
                    </p>
                  ) : (
                    <p className="text-xs font-bold text-gray-800 mt-0.5">
                      Próximo atendimento: <span className="text-blue-700 font-extrabold">{horarioHoje.proximoAtendimento || 'Amanhã, das 09:00 às 18:00'}</span>
                    </p>
                  )}
                </div>

                {horarioHoje.status === 'atendendo' && horarioHoje.temIntervalo && horarioHoje.intervaloInicio && (
                  <div className="pt-2 border-t border-gray-200/60 flex items-center gap-1.5 text-xs text-amber-900 font-medium">
                    <span>⏸️</span>
                    <span>Pausa / Intervalo: <strong>{horarioHoje.intervaloInicio} às {horarioHoje.intervaloFim}</strong></span>
                  </div>
                )}

                {horarioHoje.mensagem && (
                  <div className="pt-2 border-t border-gray-200/60 text-xs text-gray-700 italic bg-white p-2.5 rounded-xl border border-gray-100">
                    "{horarioHoje.mensagem}"
                  </div>
                )}
              </div>

              {/* Informações Gerais do Estabelecimento */}
              <div className="space-y-2 text-xs text-gray-600 pt-0.5">
                <div className="flex items-start gap-2 bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
                  <Calendar className="w-3.5 h-3.5 text-brand-blue shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Horário Geral da Semana</p>
                    <p className="font-semibold text-gray-800 mt-0.5 leading-snug">{horarios || 'Segunda a Sábado: 09:00 às 19:00'}</p>
                  </div>
                </div>

                <div 
                  onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(localizacao)}`, '_blank')}
                  className="flex items-start gap-2 bg-gray-50/80 p-2.5 rounded-xl border border-gray-100 hover:bg-gray-100/80 transition-colors cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Localização (Abrir no Mapa)</p>
                    <p className="font-semibold text-gray-800 mt-0.5 leading-snug">{localizacao || 'Centro da Cidade'}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-1" />
                </div>
              </div>

              {/* Botão de Ação Rápida */}
              <div className="pt-1">
                {modoAcao === 'whatsapp' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowHorarioHojeDetails(false);
                      window.open(getWhatsAppLink(), '_blank');
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-3 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Phone className="w-3.5 h-3.5 fill-current" />
                    <span>Chamar no WhatsApp</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setShowHorarioHojeDetails(false);
                      if (onBookOnline) onBookOnline();
                      else setShowSiteBookingModal(true);
                    }}
                    className="w-full bg-brand-blue hover:bg-blue-600 text-white font-extrabold text-xs py-3 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Agendar Horário Online</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (isPublicAccess) {
    return (
      <div className="min-h-screen bg-[#faf9f6] text-brand-dark flex flex-col items-center py-0 sm:py-8 px-0 sm:px-4 relative z-10">
        {/* Background visual glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-blue/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-blue/10 rounded-full blur-3xl -z-10" />

        <div className="w-full max-w-md bg-white sm:rounded-[40px] sm:shadow-2xl sm:border border-gray-100 flex flex-col min-h-screen sm:min-h-0 overflow-hidden relative">
          {renderVitrineContent(false)}
        </div>

        {/* DETAILS MODAL FOR HORÁRIO DE HOJE */}
        {renderHorarioHojeDetailsModal()}

        {/* CLIENT BOOKING MODAL FOR SITE BOOKING IN PUBLIC ACCESS */}
        <AnimatePresence>
          {showSiteBookingModal && (
            <div className="fixed inset-0 z-50 bg-[#051b42]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="w-full max-w-lg my-auto relative"
              >
                <ClientBooking
                  businessName={merchant.vitrineLogo || merchant.nomeBarbearia || 'Cortes Vitrine'}
                  businessLogo={merchant.vitrineLogoImage || logoImage}
                  services={services}
                  barbers={
                    barbers && barbers.length > 0
                      ? barbers.map(b => ({
                          ...b,
                          avatar: (b.avatar && b.avatar.trim() !== '' && !b.avatar.includes('unsplash.com'))
                            ? b.avatar
                            : (merchant.vitrineLogoImage || logoImage || b.avatar)
                        }))
                      : [
                          {
                            id: 'b-default',
                            name: merchant.nomeProprietario || 'Barbeiro Principal',
                            avatar: merchant.vitrineLogoImage || logoImage || '',
                            rating: 5.0,
                            specialty: 'Cortes & Barba'
                          }
                        ]
                  }
                  onBookAppointment={async (appointmentData) => {
                    try {
                      const fullApp: Appointment = {
                        id: `app-${Date.now()}`,
                        status: 'pending',
                        ...appointmentData
                      };
                      await firebaseService.saveAppointment(fullApp, merchant.uid);
                    } catch (err) {
                      console.error('Error adding appointment:', err);
                    }
                  }}
                  onClose={() => setShowSiteBookingModal(false)}
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* CLIENT AREA MODAL IN PUBLIC ACCESS */}
        <AnimatePresence>
          {showClientAreaModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col"
              >
                <div 
                  className="h-24 relative flex items-center justify-center shrink-0"
                  style={{
                    background: gradientEnabled
                      ? `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
                      : primaryColor
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setShowClientAreaModal(false);
                      setIsClientLoggedIn(false);
                    }}
                    className="absolute top-3 right-3 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 p-1.5 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  
                  <div className="absolute -bottom-7 w-16 h-16 rounded-full bg-white border-4 border-white shadow-md flex items-center justify-center font-extrabold text-xs text-center p-1 overflow-hidden">
                    {logoImage ? (
                      <img src={logoImage} alt={logoText} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span className="line-clamp-2 leading-tight">{logoText}</span>
                    )}
                  </div>
                </div>

                <div className="pt-10 pb-6 px-6 text-center space-y-4 overflow-y-auto flex-1 text-left">
                  {!isClientLoggedIn ? (
                    <div className="space-y-4 text-center">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          Área do Cliente
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Consulte e gerencie seus agendamentos na {merchant.nomeBarbearia || 'Barbearia'}
                        </p>
                      </div>

                      {clientAreaError && (
                        <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100">
                          {clientAreaError}
                        </div>
                      )}

                      <form onSubmit={handleClientLogin} className="space-y-3 text-left">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-700">Informe seu WhatsApp ou Telefone</label>
                          <input
                            type="tel"
                            value={clientPhone}
                            onChange={(e) => setClientPhone(e.target.value)}
                            placeholder="(00) 00000-0000"
                            required
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-medium focus:outline-none focus:border-brand-blue"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={isLoadingClientData}
                          className="w-full bg-brand-blue hover:bg-blue-600 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {isLoadingClientData ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Buscando agendamentos...</span>
                            </>
                          ) : (
                            <>
                              <Search className="w-4 h-4" />
                              <span>Acessar Meus Agendamentos</span>
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <div>
                          <h4 className="text-sm font-extrabold text-gray-900">Seus Agendamentos</h4>
                          <p className="text-[11px] text-gray-500">{clientPhone}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsClientLoggedIn(false);
                            setClientAppointments([]);
                          }}
                          className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sair</span>
                        </button>
                      </div>

                      {clientCancelSuccessMsg && (
                        <div className="p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                          <span>{clientCancelSuccessMsg}</span>
                        </div>
                      )}

                      {clientAppointments.length === 0 ? (
                        <div className="text-center py-6 space-y-2">
                          <Calendar className="w-8 h-8 text-gray-300 mx-auto" />
                          <p className="text-xs text-gray-500">Nenhum agendamento encontrado para este número.</p>
                          <button
                            type="button"
                            onClick={() => {
                              setShowClientAreaModal(false);
                              setShowSiteBookingModal(true);
                            }}
                            className="bg-brand-blue text-white text-xs font-bold px-4 py-2 rounded-xl mt-2 cursor-pointer"
                          >
                            Agendar Novo Horário
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                          {clientAppointments.map((app) => (
                            <div key={app.id} className="bg-gray-50 p-3 rounded-2xl border border-gray-100 space-y-2 text-xs">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="font-extrabold text-gray-900 block">{app.serviceName}</span>
                                  <span className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                                    <Clock className="w-3 h-3 text-gray-400" />
                                    {app.date} às {app.time}
                                  </span>
                                </div>
                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                  app.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                                  app.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                  app.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                  'bg-amber-100 text-amber-800'
                                }`}>
                                  {app.status === 'confirmed' ? 'Confirmado' :
                                   app.status === 'cancelled' ? 'Cancelado' :
                                   app.status === 'completed' ? 'Concluído' : 'Pendente'}
                                </span>
                              </div>

                              <div className="flex justify-between items-center pt-1 border-t border-gray-200/60 text-[11px]">
                                <span className="font-mono font-bold text-gray-700">R$ {app.price?.toFixed(2)}</span>
                                {app.status !== 'cancelled' && app.status !== 'completed' && (
                                  <button
                                    type="button"
                                    onClick={() => setCancellingClientApp(app)}
                                    className="text-red-600 hover:text-red-700 font-bold text-[11px] cursor-pointer"
                                  >
                                    Cancelar agendamento
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* JOIN QUEUE MODAL IN PUBLIC ACCESS */}
        <AnimatePresence>
          {showJoinQueueModal && (
            <div className="fixed inset-0 z-50 bg-[#051b42]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl p-6 relative text-left"
              >
                <button
                  type="button"
                  onClick={() => setShowJoinQueueModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="mb-4">
                  <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[11px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider mb-2">
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                    <span>Fila ao Vivo</span>
                  </div>
                  <h3 className="text-lg font-black text-gray-900">Entrar na Fila de Espera</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Informe seus dados para entrar na fila por ordem de chegada.
                  </p>
                </div>

                {joinQueueError && (
                  <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100 mb-3">
                    {joinQueueError}
                  </div>
                )}

                <form onSubmit={handleJoinQueue} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Seu Nome Completo</label>
                    <input
                      type="text"
                      value={joinQueueName}
                      onChange={(e) => setJoinQueueName(e.target.value)}
                      placeholder="Ex: João da Silva"
                      required
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-medium focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Seu WhatsApp (para avisarmos sua vez)</label>
                    <input
                      type="tel"
                      value={joinQueuePhone}
                      onChange={(e) => setJoinQueuePhone(e.target.value)}
                      placeholder="(00) 00000-0000"
                      required
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-medium focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">Serviço Desejado</label>
                    <select
                      value={joinQueueServiceId}
                      onChange={(e) => setJoinQueueServiceId(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 font-medium focus:outline-none focus:border-emerald-600"
                    >
                      {services.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} - R$ {s.price.toFixed(2)} ({s.durationMin} min)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs text-gray-500 bg-gray-50 p-3 rounded-xl">
                    <span>Sua posição será:</span>
                    <span className="font-mono font-bold text-emerald-700">#{waitingQueue.length + 1}</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isJoiningQueue}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                  >
                    {isJoiningQueue ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Entrando na fila...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Confirmar e Entrar na Fila</span>
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#051b42] text-white flex flex-col relative overflow-x-hidden">
      {/* Background visual glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-lime/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-blue/10 rounded-full blur-3xl -z-10" />

      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-[#051b42]/95 backdrop-blur-md border-b border-white/10 px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {!isOnlyView && onBack && (
              <button 
                onClick={onBack}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-300 hover:text-white cursor-pointer"
                id="btn-back-to-dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <Scissors className="w-5 h-5 text-brand-lime" />
                <h1 className="font-sans font-extrabold text-lg md:text-xl tracking-tight text-white uppercase">
                  Cortes Vitrine
                </h1>
                <span className="bg-emerald-500/25 text-emerald-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full tracking-wider uppercase">
                  Grátis
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {isOnlyView ? `Painel Digital • ${merchant.nomeBarbearia}` : 'Divulgue sua barbearia com o mini-site gratuito'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isOnlyView && onLogout && (
              <button 
                onClick={onLogout}
                className="bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 hover:text-white py-2 px-4 rounded-xl border border-white/10 transition-colors cursor-pointer mr-2"
                id="btn-vitrine-logout"
              >
                Sair
              </button>
            )}

            <button
              onClick={() => setShowQR(true)}
              className="bg-white/5 hover:bg-white/10 text-xs font-bold text-brand-lime py-2 px-3.5 rounded-xl border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
              id="btn-show-qr-code"
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">QR Code</span>
            </button>
          </div>
        </div>
      </header>

      {/* CORE LAYOUT */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 py-8">
        
        {/* DOWNGRADE NOTICE BANNER */}
        {downgradeNotice && (
          <div className="mb-6 bg-amber-400 text-[#051b42] p-5 rounded-3xl border border-amber-300/20 text-left relative overflow-hidden shadow-xl shadow-amber-400/5">
            <button 
              onClick={handleCloseDowngradeNotice}
              className="absolute top-4 right-4 text-[#051b42]/60 hover:text-[#051b42] font-bold text-lg cursor-pointer"
            >
              &times;
            </button>
            <div className="flex gap-4 items-start pr-6">
              <div className="p-2.5 bg-[#051b42] text-amber-400 rounded-2xl shrink-0">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-sans font-extrabold text-sm uppercase tracking-wider">
                  {downgradeNotice === 'trial_expired' 
                    ? 'Seu período de teste grátis terminou' 
                    : 'Sua assinatura Pro expirou ou foi cancelada'}
                </h4>
                <p className="text-xs leading-relaxed font-medium">
                  {downgradeNotice === 'trial_expired' 
                    ? 'Seu período de teste grátis do Cortestime Pro chegou ao fim. Para que você continue divulgando seus serviços, sua conta foi alterada automaticamente para o plano gratuito Cortes Vitrine.' 
                    : 'Sua assinatura Pro venceu ou foi cancelada. Para garantir que seus clientes continuem visualizando sua barbearia, sua conta retornou automaticamente para o plano gratuito Cortes Vitrine.'}
                </p>
                <p className="text-xs font-bold underline">
                  Não se preocupe: todos os seus agendamentos, clientes e dados de profissionais estão salvos com segurança absoluta e sem nenhuma perda!
                </p>
                <div className="pt-2 flex flex-wrap gap-2">
                  <button 
                    onClick={() => {
                      setShowUpgradePlans(true);
                      handleCloseDowngradeNotice();
                    }}
                    className="bg-[#051b42] hover:bg-[#072558] text-[#bffd32] text-[10px] font-black uppercase tracking-wider px-4 py-2 rounded-xl transition-all cursor-pointer border-none"
                  >
                    Assinar Cortestime Pro
                  </button>
                  <button 
                    onClick={handleCloseDowngradeNotice}
                    className="bg-transparent hover:bg-[#051b42]/5 text-[#051b42] text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* SUBTAB BAR */}
        <div className="flex justify-center mb-8">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setActiveSubTab('editor')}
              className={`px-7 py-3 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer border ${
                activeSubTab === 'editor' 
                  ? 'bg-transparent text-white border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.6)] ring-1 ring-blue-400/80' 
                  : 'bg-transparent hover:bg-white/5 text-gray-200 border-white/40 hover:border-white/70'
              }`}
            >
              Editar Informações
            </button>
            <button
              onClick={() => {
                setActiveSubTab('preview');
                const target = document.getElementById('client-preview-section');
                if (target) {
                  target.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className={`px-7 py-3 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer border active:scale-95 ${
                activeSubTab === 'preview'
                  ? 'bg-transparent text-white border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.6)] ring-1 ring-blue-400/80'
                  : 'bg-transparent hover:bg-white/5 text-gray-200 border-white/40 hover:border-white/70'
              }`}
            >
              Visualizar Minha Vitrine
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* EDITOR COLUMN */}
          <div className={`lg:col-span-7 space-y-6 ${activeSubTab === 'editor' ? 'block' : 'hidden lg:block'}`}>
            
            {/* EXPLAINER CARD */}
            <div className="bg-[#09224f]/90 border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-brand-lime/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex gap-4 items-start text-left">
                <div className="p-3 bg-brand-lime/20 text-brand-lime rounded-2xl shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-white uppercase tracking-wider">Como funciona o Cortes Vitrine?</h3>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Este é um mini-site promocional totalmente gratuito gerado para divulgar os produtos e cortes da sua barbearia. Preencha as informações abaixo para manter seu portfólio impecável nas redes sociais!
                  </p>
                  <div className="pt-2 flex items-center gap-1.5 text-xs text-brand-lime font-bold">
                    <Globe className="w-3.5 h-3.5" />
                    <span className="truncate">Seu link público: {displayUrl}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* PREMIUM UPGRADE CARD */}
            {merchant.plano === 'vitrine' && (
              <div className="bg-gradient-to-br from-[#072456] to-[#0d3472] border border-amber-400/35 rounded-3xl p-6 shadow-xl relative overflow-hidden text-left space-y-4">
                <div className="absolute top-0 right-0 w-36 h-36 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center justify-between">
                  <span className="bg-amber-400 text-[#051b42] text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                    ⭐ Upgrade Premium • Cortestime Pro
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="font-sans font-extrabold text-lg text-white">
                    Desbloqueie todo o potencial da sua barbearia!
                  </h3>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Migre para o plano Pro do Cortestime e tenha o controle absoluto do seu negócio. Ganhe agilidade e aumente o seu faturamento com recursos profissionais exclusivos:
                  </p>
                </div>

                {/* Benefits grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-gray-300">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Agendamentos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Cadastro de clientes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Controle financeiro</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Funcionários</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Relatórios</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Notificações automáticas</span>
                  </div>
                  <div className="flex items-center gap-2 col-span-2">
                    <Check className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Dashboard completo</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={() => setShowUpgradePlans(true)}
                    className="w-full bg-amber-400 hover:bg-amber-500 text-[#051b42] font-black py-3.5 px-6 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-amber-500/10 cursor-pointer flex items-center justify-center gap-2 border border-amber-300/20"
                    id="btn-vitrine-upgrade-pro"
                  >
                    <Star className="w-4 h-4 fill-current text-[#051b42]" />
                    <span>Conhecer Planos de Assinatura</span>
                  </button>
                </div>
              </div>
            )}

            {/* FORM CARD */}
            <div className="bg-[#09224f]/40 border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl space-y-6 text-left">
              
              <h3 className="text-sm font-bold uppercase tracking-wider text-brand-lime border-b border-white/10 pb-3 flex items-center gap-2">
                <Award className="w-4 h-4" />
                <span>Dados de Identidade</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nome de Exibição da Vitrine</label>
                  <input 
                    type="text" 
                    value={logoText}
                    onChange={e => setLogoText(e.target.value)}
                    placeholder="Ex: Barber Style Club"
                    className="w-full bg-[#051b42] text-white border border-white/10 rounded-2xl p-4 text-xs font-medium focus:outline-none focus:border-brand-lime transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Usuário do Instagram</label>
                  <div className="flex items-center bg-[#051b42] border border-white/10 rounded-2xl px-4">
                    <span className="text-gray-500 text-xs font-mono mr-1">@</span>
                    <input 
                      type="text" 
                      value={instagram.replace('@', '')}
                      onChange={e => setInstagram(`@${e.target.value}`)}
                      placeholder="cortestime_barber"
                      className="w-full bg-transparent text-white border-none focus:outline-none py-4 text-xs font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Foto / Imagem da Logo */}
              <div className="space-y-3 bg-[#051b42]/60 p-4 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-brand-lime" />
                    <span>Foto / Imagem da Logo da Vitrine</span>
                  </label>
                  {logoImage && (
                    <button 
                      type="button"
                      onClick={() => setLogoImage('')}
                      className="text-[11px] text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remover Foto</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Preview Circular Avatar */}
                  <div className="w-16 h-16 rounded-full bg-[#051b42] text-[#bffd32] border-2 border-brand-lime/40 flex items-center justify-center font-sans font-black text-xl shrink-0 overflow-hidden shadow-md">
                    {logoImage ? (
                      <img src={logoImage} alt="Preview logo" className="w-full h-full object-cover" />
                    ) : (
                      logoText.charAt(0).toUpperCase()
                    )}
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    <div className="flex items-center gap-2">
                      <label className="bg-brand-lime hover:bg-lime-400 text-[#051b42] font-black py-2.5 px-4 rounded-xl text-xs cursor-pointer inline-flex items-center gap-1.5 transition-all shadow-sm">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Carregar Foto da Logo</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleLogoFileUpload} 
                          className="hidden" 
                        />
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Ou insira o link direto da foto (URL):</span>
                    </div>
                    <input 
                      type="text" 
                      value={logoImage}
                      onChange={e => setLogoImage(e.target.value)}
                      placeholder="Ex: https://exemplo.com/logo-barbearia.png"
                      className="w-full bg-[#051b42] text-white border border-white/10 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:border-brand-lime transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">WhatsApp de Contato</label>
                  <input 
                    type="text" 
                    value={whatsapp}
                    onChange={e => setWhatsapp(e.target.value)}
                    placeholder="Ex: (82) 99122-3344"
                    className="w-full bg-[#051b42] text-white border border-white/10 rounded-2xl p-4 text-xs font-medium focus:outline-none focus:border-brand-lime transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Link para Bio do Instagram</label>
                  <input 
                    type="text" 
                    value={linkBio}
                    onChange={e => setLinkBio(e.target.value)}
                    placeholder="Ex: linktr.ee/cortestime_barber"
                    className="w-full bg-[#051b42] text-white border border-white/10 rounded-2xl p-4 text-xs font-medium focus:outline-none focus:border-brand-lime transition-all"
                  />
                </div>
              </div>

              {/* MODO DE ATENDIMENTO DA VITRINE (AGENDAMENTO VS WHATSAPP DIRETO) */}
              <div className="bg-[#051b42] p-5 sm:p-6 rounded-3xl border border-white/10 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div>
                    <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                      <Phone className="w-4 h-4 text-emerald-400" />
                      <span>Modo de Atendimento da Vitrine</span>
                    </h4>
                    <p className="text-[11px] text-gray-300 mt-0.5">
                      Escolha como o cliente interage ao clicar nos botões e serviços da sua vitrine
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border self-start sm:self-center ${
                    modoAcao === 'whatsapp' 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                      : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  }`}>
                    {modoAcao === 'whatsapp' ? '💬 Direto pro WhatsApp' : '📅 Agenda no Sistema'}
                  </span>
                </div>

                {/* Opções de Modo em Cards Selecionáveis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Card 1: Agendamento no Sistema */}
                  <div
                    onClick={() => setModoAcao('agendamento')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-2 relative ${
                      modoAcao === 'agendamento'
                        ? 'bg-[#092861] border-blue-400 ring-2 ring-blue-400/20 shadow-lg'
                        : 'bg-[#041533] border-white/10 hover:border-white/20 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          modoAcao === 'agendamento' ? 'bg-blue-500 text-white' : 'bg-white/10 text-gray-400'
                        }`}>
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-white">Agendamento no Sistema</p>
                          <p className="text-[10px] text-blue-300 font-medium">Fluxo de agenda online completo</p>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        modoAcao === 'agendamento' ? 'border-blue-400 bg-blue-400' : 'border-gray-500'
                      }`}>
                        {modoAcao === 'agendamento' && <div className="w-1.5 h-1.5 rounded-full bg-[#051b42]" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-300 leading-relaxed">
                      O cliente escolhe serviço, barbeiro, data e horário diretamente na página da vitrine.
                    </p>
                  </div>

                  {/* Card 2: Direto para o WhatsApp */}
                  <div
                    onClick={() => setModoAcao('whatsapp')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-2 relative ${
                      modoAcao === 'whatsapp'
                        ? 'bg-emerald-950/40 border-emerald-400 ring-2 ring-emerald-400/20 shadow-lg shadow-emerald-950/50'
                        : 'bg-[#041533] border-white/10 hover:border-white/20 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          modoAcao === 'whatsapp' ? 'bg-emerald-500 text-emerald-950' : 'bg-white/10 text-gray-400'
                        }`}>
                          <Phone className="w-5 h-5 fill-current" />
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-white">Direto para o WhatsApp</p>
                          <p className="text-[10px] text-emerald-400 font-medium">Sem agendamento no site</p>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        modoAcao === 'whatsapp' ? 'border-emerald-400 bg-emerald-400' : 'border-gray-500'
                      }`}>
                        {modoAcao === 'whatsapp' && <div className="w-1.5 h-1.5 rounded-full bg-[#051b42]" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-300 leading-relaxed">
                      Ao clicar em "Agendar" ou em qualquer serviço, o cliente é direcionado para o seu WhatsApp com uma mensagem pronta!
                    </p>
                  </div>
                </div>

                {/* PAINEL DE CONFIGURAÇÃO ESPECÍFICO QUANDO "DIRETO PRO WHATSAPP" ESTÁ SELECIONADO */}
                {modoAcao === 'whatsapp' ? (
                  <div className="bg-gradient-to-br from-[#06263b] to-[#041b2c] p-4 sm:p-5 rounded-2xl border border-emerald-500/30 space-y-4 animate-fade-in">
                    
                    {/* Saudação Inteligente por Horário */}
                    <div className="bg-[#031522]/80 p-3.5 rounded-xl border border-emerald-500/20 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-white">Saudação Automática conforme o Horário</p>
                            <p className="text-[10px] text-gray-300">
                              Insere automaticamente <strong>Bom dia</strong>, <strong>Boa tarde</strong> ou <strong>Boa noite</strong> de acordo com a hora em que o cliente abre o WhatsApp.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setUsarSaudacaoHorario(!usarSaudacaoHorario)}
                          className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
                            usarSaudacaoHorario ? 'bg-emerald-400' : 'bg-gray-700'
                          }`}
                        >
                          <div
                            className={`bg-[#051b42] w-4 h-4 rounded-full shadow-md transform transition-transform ${
                              usarSaudacaoHorario ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Horários e Saudação Ativa */}
                      <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[10px]">
                        <div className="flex flex-wrap items-center gap-1.5 text-gray-400">
                          <span className="bg-white/5 px-2 py-0.5 rounded-md border border-white/5">🌅 05h-12h: Bom dia</span>
                          <span className="bg-white/5 px-2 py-0.5 rounded-md border border-white/5">☀️ 12h-18h: Boa tarde</span>
                          <span className="bg-white/5 px-2 py-0.5 rounded-md border border-white/5">🌙 18h-05h: Boa noite</span>
                        </div>
                        <span className="font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          Saudação agora: "{getSaudacaoHorario()}"
                        </span>
                      </div>
                    </div>

                    {/* Mensagem Personalizada */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Mensagem Padrão do WhatsApp (Editável)</span>
                        </label>
                        {mensagemWhatsAppCustom && (
                          <button
                            type="button"
                            onClick={() => setMensagemWhatsAppCustom('')}
                            className="text-[10px] text-gray-400 hover:text-white transition-colors cursor-pointer"
                          >
                            Restaurar padrão
                          </button>
                        )}
                      </div>

                      <textarea
                        rows={3}
                        value={mensagemWhatsAppCustom}
                        onChange={e => setMensagemWhatsAppCustom(e.target.value)}
                        placeholder={`Olá {barbeiro}, {saudacao}! Vi a vitrine da {barbearia}. Vocês estão atendendo hoje? Gostaria de saber se tem horário disponível!`}
                        className="w-full bg-[#031422] text-white border border-emerald-500/30 focus:border-emerald-400 rounded-xl p-3 text-xs font-medium focus:outline-none transition-all leading-relaxed"
                      />

                      {/* Tags Rápidas para Inserir */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          Clique nas variáveis para inserir na sua mensagem:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => setMensagemWhatsAppCustom((prev) => (prev ? `${prev} {saudacao}` : '{saudacao}'))}
                            className="bg-white/5 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer"
                            title="Insere Bom dia / Boa tarde / Boa noite automaticamente"
                          >
                            + {'{saudacao}'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setMensagemWhatsAppCustom((prev) => (prev ? `${prev} {barbeiro}` : '{barbeiro}'))}
                            className="bg-white/5 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer"
                            title="Insere o nome do barbeiro / proprietário"
                          >
                            + {'{barbeiro}'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setMensagemWhatsAppCustom((prev) => (prev ? `${prev} {barbearia}` : '{barbearia}'))}
                            className="bg-white/5 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer"
                            title="Insere o nome de exibição da barbearia"
                          >
                            + {'{barbearia}'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setMensagemWhatsAppCustom((prev) => (prev ? `${prev} {servico}` : '{servico}'))}
                            className="bg-white/5 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer"
                            title="Insere o nome do serviço quando o cliente clica na tabela"
                          >
                            + {'{servico}'}
                          </button>
                        </div>
                      </div>

                      {/* Sugestões de Mensagens Prontas */}
                      <div className="pt-2 space-y-1.5 border-t border-white/5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          Ou escolha um modelo pronto:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setMensagemWhatsAppCustom('Olá {barbeiro}, {saudacao}! Vi sua vitrine da {barbearia}. Vocês estão abertos hoje? Gostaria de saber os horários disponíveis!')}
                            className="bg-white/5 hover:bg-white/10 text-left p-2 rounded-xl text-[10px] text-gray-300 border border-white/5 transition-all cursor-pointer leading-tight"
                          >
                            <span className="font-bold text-white block mb-0.5">🟢 Perguntar se está aberto</span>
                            "Vocês estão abertos hoje? Gostaria de saber os horários..."
                          </button>
                          <button
                            type="button"
                            onClick={() => setMensagemWhatsAppCustom('Olá {barbeiro}, {saudacao}! Vi a vitrine da {barbearia} e gostaria de agendar um horário com você hoje para {servico}. Como está a agenda?')}
                            className="bg-white/5 hover:bg-white/10 text-left p-2 rounded-xl text-[10px] text-gray-300 border border-white/5 transition-all cursor-pointer leading-tight"
                          >
                            <span className="font-bold text-white block mb-0.5">✂️ Agendamento de serviço</span>
                            "Gostaria de agendar um horário com você hoje para..."
                          </button>
                          <button
                            type="button"
                            onClick={() => setMensagemWhatsAppCustom('Olá {barbeiro}, {saudacao}! Vi a vitrine da {barbearia} e queria consultar se tem horário livre para agora ou mais tarde.')}
                            className="bg-white/5 hover:bg-white/10 text-left p-2 rounded-xl text-[10px] text-gray-300 border border-white/5 transition-all cursor-pointer leading-tight"
                          >
                            <span className="font-bold text-white block mb-0.5">⚡ Horário livre</span>
                            "Queria consultar se tem horário livre para agora..."
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* PRÉVIA VISUAL DO WHATSAPP (SIMULAÇÃO REALISTA) */}
                    <div className="bg-[#0b141a] p-3.5 rounded-2xl border border-white/10 space-y-2 text-left">
                      <div className="flex items-center justify-between text-[10px] text-gray-400 border-b border-white/5 pb-1.5">
                        <span className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-emerald-400">
                          <Phone className="w-3 h-3 fill-current" />
                          <span>Como o cliente vai mandar para você no WhatsApp:</span>
                        </span>
                        <span className="text-[9px] text-gray-500">Prévia em tempo real</span>
                      </div>

                      {/* Balão do WhatsApp */}
                      <div className="flex justify-end pt-1">
                        <div className="max-w-[90%] bg-[#005c4b] text-white p-3 rounded-2xl rounded-tr-none shadow-md text-xs leading-relaxed relative">
                          <p className="font-normal whitespace-pre-wrap">
                            {getMensagemWhatsAppGerada('Degradê & Barba')}
                          </p>
                          <div className="flex items-center justify-end gap-1 text-[9px] text-emerald-200 mt-1">
                            <span>{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                            <span>✓✓</span>
                          </div>
                        </div>
                      </div>

                      {/* Botão de Testar Envio */}
                      <div className="pt-2 flex justify-end">
                        <a
                          href={getWhatsAppLink()}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black text-xs py-2 px-4 rounded-xl transition-all flex items-center gap-1.5 shadow-md cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Testar envio no WhatsApp agora</span>
                        </a>
                      </div>
                    </div>

                  </div>
                ) : (
                  /* OPÇÃO ADICIONAL QUANDO AGENDAMENTO NO SISTEMA ESTÁ SELECIONADO */
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-white">Permitir também botão do WhatsApp na vitrine</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Exibe o ícone do WhatsApp para os clientes que preferirem mandar mensagem diretamente.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPermitirWhatsApp(!permitirWhatsApp)}
                      className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
                        permitirWhatsApp ? 'bg-[#d4ff5e]' : 'bg-gray-700'
                      }`}
                    >
                      <div
                        className={`bg-[#051b42] w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          permitirWhatsApp ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                )}

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Slogan da Barbearia</label>
                  <input 
                    type="text" 
                    value={slogan}
                    onChange={e => setSlogan(e.target.value)}
                    placeholder="Ex: Corte, Barba & Estilo de Alto Padrão"
                    className="w-full bg-[#051b42] text-white border border-white/10 rounded-2xl p-4 text-xs font-medium focus:outline-none focus:border-brand-lime transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Link Personalizado (Slug)</label>
                  <div className="flex items-center bg-[#051b42] border border-white/10 rounded-2xl px-4">
                    <span className="text-gray-500 text-xs font-mono mr-1">/vitrine/</span>
                    <input 
                      type="text" 
                      value={linkPersonalizado}
                      onChange={e => setLinkPersonalizado(e.target.value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase())}
                      placeholder="minha-barbearia"
                      className="w-full bg-transparent text-white border-none focus:outline-none py-4 text-xs font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* ATENDIMENTO DE HOJE (RECURSO DINÂMICO E ÁGIL) */}
              <div className="bg-gradient-to-br from-[#092352] via-[#051b42] to-[#041533] p-4 sm:p-5 rounded-3xl border-2 border-emerald-500/40 shadow-xl space-y-4 text-left relative overflow-hidden">
                {/* Glow decorativo sutil */}
                <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex flex-wrap items-center justify-between gap-2 relative z-10 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white flex items-center gap-2">
                        <span>📅 Atendimento de hoje</span>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          {getHojeData().dataCurta}
                        </span>
                      </h3>
                      <p className="text-[11px] text-gray-300 font-medium">
                        {getHojeData().dataExtenso} • <span className="capitalize">{getHojeData().diaSemana}</span>
                      </p>
                    </div>
                  </div>

                  {/* Toggle para ativar/desativar exibição do horário de hoje */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 font-semibold">Exibir na vitrine:</span>
                    <button
                      type="button"
                      onClick={() => setHorarioHoje(prev => ({ ...prev, ativo: !prev.ativo }))}
                      className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
                        horarioHoje.ativo ? 'bg-emerald-500' : 'bg-gray-700'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          horarioHoje.ativo ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {horarioHoje.ativo && (
                  <div className="space-y-4 relative z-10">
                    {/* Botões Rápidos de Status */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                        Status do Dia:
                      </label>
                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <button
                          type="button"
                          onClick={() => setHorarioHoje(prev => ({ ...prev, status: 'atendendo' }))}
                          className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                            horarioHoje.status === 'atendendo'
                              ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-md ring-1 ring-emerald-400/50'
                              : 'bg-black/20 border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-black text-white">🟢 Atendendo hoje</p>
                            <p className="text-[10px] text-gray-300">Barbearia aberta e ativa</p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setHorarioHoje(prev => ({ ...prev, status: 'nao_atende' }))}
                          className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                            horarioHoje.status === 'nao_atende'
                              ? 'bg-blue-500/20 border-blue-400 text-white shadow-md ring-1 ring-blue-400/50'
                              : 'bg-black/20 border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <span className="w-3 h-3 rounded-full bg-blue-400 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-black text-white">🔵 Não atendo hoje</p>
                            <p className="text-[10px] text-gray-300">Fechado / Folga / Feriado</p>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* CAMPOS QUANDO "ATENDENDO HOJE" */}
                    {horarioHoje.status === 'atendendo' && (
                      <div className="space-y-3.5 bg-black/25 p-3.5 sm:p-4 rounded-2xl border border-white/10">
                        {/* Horários de Início e Fim */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-gray-300 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Início do Atendimento:</span>
                            </label>
                            <input
                              type="time"
                              value={horarioHoje.inicio || '09:00'}
                              onChange={e => setHorarioHoje(prev => ({ ...prev, inicio: e.target.value }))}
                              className="w-full bg-[#051b42] text-white border border-white/15 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-emerald-400"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-gray-300 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Fim do Atendimento:</span>
                            </label>
                            <input
                              type="time"
                              value={horarioHoje.fim || '19:00'}
                              onChange={e => setHorarioHoje(prev => ({ ...prev, fim: e.target.value }))}
                              className="w-full bg-[#051b42] text-white border border-white/15 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-emerald-400"
                            />
                          </div>
                        </div>

                        {/* Atalhos Rápidos de Horário */}
                        <div className="pt-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                            Atalhos Rápidos:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { label: '09:00 às 19:00', ini: '09:00', fim: '19:00' },
                              { label: '08:00 às 18:00', ini: '08:00', fim: '18:00' },
                              { label: '14:00 às 20:00', ini: '14:00', fim: '20:00' },
                              { label: '10:00 às 20:00', ini: '10:00', fim: '20:00' },
                              { label: '13:00 às 21:00', ini: '13:00', fim: '21:00' }
                            ].map((preset, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setHorarioHoje(prev => ({ ...prev, inicio: preset.ini, fim: preset.fim }))}
                                className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                                  horarioHoje.inicio === preset.ini && horarioHoje.fim === preset.fim
                                    ? 'bg-emerald-500 text-black border-emerald-400 shadow-xs'
                                    : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
                                }`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Toggle de Intervalo */}
                        <div className="pt-2 border-t border-white/10 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-gray-200 flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={horarioHoje.temIntervalo ?? false}
                                onChange={e => setHorarioHoje(prev => ({ ...prev, temIntervalo: e.target.checked }))}
                                className="rounded text-emerald-500 focus:ring-emerald-400 w-4 h-4 cursor-pointer"
                              />
                              <span>Tenho intervalo / pausa para almoço</span>
                            </label>
                            {horarioHoje.temIntervalo && (
                              <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
                                Intervalo Ativo
                              </span>
                            )}
                          </div>

                          {horarioHoje.temIntervalo && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 pl-5">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400">De (Início intervalo):</label>
                                <input
                                  type="time"
                                  value={horarioHoje.intervaloInicio || '12:00'}
                                  onChange={e => setHorarioHoje(prev => ({ ...prev, intervaloInicio: e.target.value }))}
                                  className="w-full bg-[#051b42] text-white border border-white/15 rounded-xl px-3 py-1.5 text-xs font-mono font-bold focus:outline-none focus:border-amber-400"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400">Até (Fim intervalo):</label>
                                <input
                                  type="time"
                                  value={horarioHoje.intervaloFim || '13:30'}
                                  onChange={e => setHorarioHoje(prev => ({ ...prev, intervaloFim: e.target.value }))}
                                  className="w-full bg-[#051b42] text-white border border-white/15 rounded-xl px-3 py-1.5 text-xs font-mono font-bold focus:outline-none focus:border-amber-400"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Recado / Aviso rápido opcional */}
                        <div className="pt-2 border-t border-white/10 space-y-1">
                          <label className="text-[11px] font-bold text-gray-300">
                            Aviso ou recado rápido para os clientes (Opcional):
                          </label>
                          <input
                            type="text"
                            value={horarioHoje.mensagem || ''}
                            onChange={e => setHorarioHoje(prev => ({ ...prev, mensagem: e.target.value }))}
                            placeholder="Ex: Hoje atendendo por ordem de chegada! ou Poucas vagas hoje."
                            className="w-full bg-[#051b42] text-white border border-white/15 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-emerald-400"
                          />
                        </div>
                      </div>
                    )}

                    {/* CAMPOS QUANDO "NÃO ATENDO HOJE" */}
                    {horarioHoje.status === 'nao_atende' && (
                      <div className="space-y-3 bg-black/25 p-3.5 sm:p-4 rounded-2xl border border-white/10">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-blue-400" />
                            <span>Informar Próximo Atendimento:</span>
                          </label>
                          <input
                            type="text"
                            value={horarioHoje.proximoAtendimento || 'Amanhã, das 09:00 às 18:00'}
                            onChange={e => setHorarioHoje(prev => ({ ...prev, proximoAtendimento: e.target.value }))}
                            placeholder="Ex: Amanhã, das 09:00 às 18:00"
                            className="w-full bg-[#051b42] text-white border border-white/15 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:border-blue-400"
                          />
                        </div>

                        {/* Sugestões Rápidas de Próximo Atendimento */}
                        <div className="pt-1">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                            Sugestões Rápidas:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              'Amanhã, das 09:00 às 18:00',
                              'Amanhã, das 08:00 às 19:00',
                              'Amanhã, a partir das 14:00',
                              'Segunda-feira, às 08:00',
                              'Terça-feira, às 09:00'
                            ].map((sug, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setHorarioHoje(prev => ({ ...prev, proximoAtendimento: sug }))}
                                className={`text-[10px] font-medium px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                                  horarioHoje.proximoAtendimento === sug
                                    ? 'bg-blue-500 text-white border-blue-400 font-bold shadow-xs'
                                    : 'bg-white/5 hover:bg-white/10 text-gray-300 border-white/10'
                                }`}
                              >
                                {sug}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* BOTÃO DE AÇÃO RÁPIDA: PUBLICAR HORÁRIO DE HOJE */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div>
                        {publicadoHojeSucesso && (
                          <span className="text-emerald-400 text-xs font-bold flex items-center gap-1.5 animate-fade-in">
                            <Check className="w-4 h-4" />
                            Horário de hoje publicado com sucesso na sua Vitrine!
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handlePublishHorarioHoje}
                        disabled={publicandoHoje}
                        className="bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50 ml-auto"
                      >
                        {publicandoHoje ? (
                          <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent animate-spin rounded-full" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>{publicandoHoje ? 'Publicando...' : 'Publicar Horário de Hoje'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* SELEÇÃO DO MODELO DA VITRINE */}
              <div 
                onClick={() => setShowTemplateModal(true)}
                className="bg-[#051b42] border border-white/10 hover:border-white/25 p-4 sm:p-5 rounded-2xl flex items-center justify-between transition-all cursor-pointer group"
              >
                <div className="space-y-0.5 text-left">
                  <h4 className="text-sm font-extrabold text-white group-hover:text-amber-400 transition-colors">
                    {template === 'modelo1' ? 'Modelo 1' : 'Modelo 2'}
                  </h4>
                  <p className="text-xs text-gray-300">
                    {template === 'modelo1' 
                      ? 'Completo, com carrossel e seções' 
                      : 'Moderno, com degradê e seções em destaque'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTemplateModal(true);
                  }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/15 active:scale-95 text-white border border-white/20 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  Trocar
                </button>
              </div>

              {/* PERSONALIZAÇÃO DE CORES E DEGRADÊ */}
              <div className="space-y-4 bg-[#051b42]/60 p-4 sm:p-5 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-brand-lime" />
                    <span>Personalização de Cores & Degradê</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setPrimaryColor('#051b42');
                      setSecondaryColor('#1e40af');
                      setGradientEnabled(true);
                      setThemePreset('custom');
                    }}
                    className="text-[11px] text-gray-400 hover:text-brand-lime font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restaurar Cores</span>
                  </button>
                </div>
                <p className="text-[11px] text-gray-300 leading-relaxed">
                  Personalize a paleta visual da sua vitrine. Escolha cores sólidas ou combine duas cores para criar um efeito de degradê moderno.
                </p>

                {/* Paletas Prontas (Presets Rápidos) */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Paletas de Cores Prontas:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {THEME_PRESETS.map(preset => {
                      const isSelected = themePreset === preset.id || (
                        primaryColor === preset.primary &&
                        secondaryColor === preset.secondary &&
                        gradientEnabled === preset.gradient
                      );

                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setThemePreset(preset.id);
                            setPrimaryColor(preset.primary);
                            setSecondaryColor(preset.secondary);
                            setGradientEnabled(preset.gradient);
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 cursor-pointer ${
                            isSelected
                              ? 'border-brand-lime bg-white/10 shadow-sm ring-1 ring-brand-lime/50'
                              : 'border-white/10 bg-[#051b42] hover:bg-white/5'
                          }`}
                        >
                          <div 
                            className="w-7 h-7 rounded-lg shrink-0 border border-white/20 shadow-xs"
                            style={{
                              background: preset.gradient
                                ? `linear-gradient(135deg, ${preset.primary} 0%, ${preset.secondary} 100%)`
                                : preset.primary
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <span className="text-[11px] font-bold text-white block truncate">{preset.name}</span>
                            <span className="text-[9px] text-gray-400 block truncate">
                              {preset.gradient ? 'Degradê' : 'Sólido'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Seletor Manual de Cores & Toggle Degradê */}
                <div className="pt-3 border-t border-white/10 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Cor Primária */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-300 flex items-center justify-between">
                        <span>Cor Principal</span>
                        <span className="text-[10px] font-mono text-gray-400 uppercase">{primaryColor}</span>
                      </label>
                      <div className="flex items-center gap-2 bg-[#051b42] border border-white/10 rounded-2xl p-2">
                        <input
                          type="color"
                          value={primaryColor}
                          onChange={(e) => {
                            setPrimaryColor(e.target.value);
                            setThemePreset('custom');
                          }}
                          className="w-9 h-9 rounded-xl border-none cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={primaryColor}
                          onChange={(e) => {
                            setPrimaryColor(e.target.value);
                            setThemePreset('custom');
                          }}
                          className="flex-1 bg-transparent text-white text-xs font-mono font-bold focus:outline-none uppercase"
                          maxLength={7}
                        />
                      </div>
                    </div>

                    {/* Cor Secundária (Degradê) */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-300 flex items-center justify-between">
                        <span>Cor Secundária (Degradê)</span>
                        <span className="text-[10px] font-mono text-gray-400 uppercase">{secondaryColor}</span>
                      </label>
                      <div className={`flex items-center gap-2 bg-[#051b42] border border-white/10 rounded-2xl p-2 ${!gradientEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
                        <input
                          type="color"
                          value={secondaryColor}
                          disabled={!gradientEnabled}
                          onChange={(e) => {
                            setSecondaryColor(e.target.value);
                            setThemePreset('custom');
                          }}
                          className="w-9 h-9 rounded-xl border-none cursor-pointer bg-transparent disabled:cursor-not-allowed"
                        />
                        <input
                          type="text"
                          value={secondaryColor}
                          disabled={!gradientEnabled}
                          onChange={(e) => {
                            setSecondaryColor(e.target.value);
                            setThemePreset('custom');
                          }}
                          className="flex-1 bg-transparent text-white text-xs font-mono font-bold focus:outline-none uppercase disabled:cursor-not-allowed"
                          maxLength={7}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Toggle Ativar / Desativar Degradê */}
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="text-xs font-bold text-white">Efeito Degradê (Gradiente Suave)</p>
                      <p className="text-[10px] text-gray-400">Mescla a cor principal com a cor secundária</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setGradientEnabled(!gradientEnabled);
                        setThemePreset('custom');
                      }}
                      className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
                        gradientEnabled ? 'bg-brand-lime' : 'bg-gray-700'
                      }`}
                    >
                      <div
                        className={`bg-[#051b42] w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          gradientEnabled ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Visual Preview Bar */}
                  <div className="pt-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                      Amostra Visual das Cores Selecionadas:
                    </span>
                    <div 
                      className="h-10 w-full rounded-xl border border-white/20 shadow-inner flex items-center justify-center text-white text-xs font-black drop-shadow-sm"
                      style={{
                        background: gradientEnabled
                          ? `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
                          : primaryColor
                      }}
                    >
                      <span>{logoText || 'Minha Barbearia'} • Amostra</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Foto de Capa / Banner da Vitrine */}
              <div className="space-y-3 bg-[#051b42]/60 p-4 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-brand-lime" />
                    <span>Banner / Foto de Capa da Vitrine</span>
                  </label>
                  {capa !== DEFAULT_COVER_URL && (
                    <button 
                      type="button"
                      onClick={() => setCapa(DEFAULT_COVER_URL)}
                      className="text-[11px] text-gray-400 hover:text-brand-lime font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restaurar Padrão</span>
                    </button>
                  )}
                </div>

                {/* Banner Preview */}
                <div className="h-28 w-full rounded-xl overflow-hidden relative border border-white/10 shadow-inner">
                  <img src={capa || DEFAULT_COVER_URL} alt="Preview Capa" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-2.5">
                    <span className="text-[10px] font-bold text-white bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20">
                      {capa === DEFAULT_COVER_URL || !capa ? 'Banner Padrão' : 'Banner Personalizado'}
                    </span>
                  </div>
                </div>

                {/* File Upload & Gallery Selection */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="bg-brand-lime hover:bg-lime-400 text-[#051b42] font-black py-2.5 px-4 rounded-xl text-xs cursor-pointer inline-flex items-center gap-1.5 transition-all shadow-sm">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Carregar Foto do Aparelho</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleCapaFileUpload} 
                        className="hidden" 
                      />
                    </label>
                  </div>

                  {/* Select from Galeria if photos exist */}
                  {gallery && gallery.length > 0 && (
                    <div className="pt-2 border-t border-white/5">
                      <span className="text-[10px] text-gray-300 font-bold uppercase block mb-1.5">Ou selecione uma foto da sua Galeria de Cortes:</span>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                        {gallery.map((imgUrl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setCapa(imgUrl)}
                            className={`w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer relative ${capa === imgUrl ? 'border-brand-lime scale-105 shadow-md ring-2 ring-brand-lime/50' : 'border-transparent opacity-70 hover:opacity-100'}`}
                            title="Usar esta foto como Banner"
                          >
                            <img src={imgUrl} alt={`Galeria ${idx + 1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Direct Link Input */}
                  <div className="pt-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase block mb-1">Ou insira o link/URL da imagem:</span>
                    <input 
                      type="text" 
                      value={capa}
                      onChange={e => setCapa(e.target.value)}
                      placeholder="Ex: https://images.unsplash.com/..."
                      className="w-full bg-[#051b42] text-white border border-white/10 rounded-xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:border-brand-lime transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Horários de Funcionamento</label>
                <input 
                  type="text" 
                  value={horarios}
                  onChange={e => setHorarios(e.target.value)}
                  placeholder="Ex: Seg a Sáb: 08:00 às 20:00"
                  className="w-full bg-[#051b42] text-white border border-white/10 rounded-2xl p-4 text-xs font-medium focus:outline-none focus:border-brand-lime transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Localização / Endereço</label>
                <input 
                  type="text" 
                  value={localizacao}
                  onChange={e => setLocalizacao(e.target.value)}
                  placeholder="Ex: Rua Getúlio Vargas, 420 - Centro"
                  className="w-full bg-[#051b42] text-white border border-white/10 rounded-2xl p-4 text-xs font-medium focus:outline-none focus:border-brand-lime transition-all"
                />
              </div>

              {/* PRODUCTS MANAGEMENT */}
              <h3 className="text-sm font-bold uppercase tracking-wider text-brand-lime border-b border-white/10 pb-3 pt-4 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                <span>Nossos Produtos</span>
              </h3>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newProdName}
                    onChange={e => setNewProdName(e.target.value)}
                    placeholder="Nome do produto (ex: Cera Modeladora)"
                    className="flex-1 bg-[#051b42] text-white border border-white/10 rounded-2xl p-3 text-xs font-medium focus:outline-none"
                  />
                  <input 
                    type="number" 
                    value={newProdPrice}
                    onChange={e => setNewProdPrice(e.target.value)}
                    placeholder="Preço R$"
                    className="w-24 bg-[#051b42] text-white border border-white/10 rounded-2xl p-3 text-xs font-medium focus:outline-none"
                  />
                  <button 
                    onClick={handleAddProduct}
                    className="bg-brand-lime hover:bg-brand-lime-dark text-brand-dark px-4 rounded-2xl font-bold text-xs flex items-center justify-center cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="divide-y divide-white/5 border border-white/10 rounded-2xl overflow-hidden bg-[#051b42]/30">
                  {products.length === 0 ? (
                    <p className="p-4 text-xs text-center text-gray-500 font-medium">Nenhum produto cadastrado na vitrine.</p>
                  ) : (
                    products.map(p => (
                      <div key={p.id} className="p-3.5 flex justify-between items-center text-xs">
                        <div className="text-left font-medium">
                          <p className="text-white">{p.name}</p>
                          <p className="text-brand-lime font-bold mt-0.5">R$ {p.price.toFixed(2)}</p>
                        </div>
                        <button 
                          onClick={() => handleRemoveProduct(p.id)}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* GALLERY MANAGEMENT */}
              <h3 className="text-sm font-bold uppercase tracking-wider text-brand-lime border-b border-white/10 pb-3 pt-4 flex items-center gap-2">
                <Camera className="w-4 h-4" />
                <span>Galeria de Fotos (Cortes & Estilo)</span>
              </h3>

              <div className="space-y-4">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newGalleryUrl}
                    onChange={e => setNewGalleryUrl(e.target.value)}
                    placeholder="Adicionar link de foto do portfólio (Unsplash, etc.)"
                    className="flex-1 bg-[#051b42] text-white border border-white/10 rounded-2xl p-3 text-xs font-medium focus:outline-none"
                  />
                  <button 
                    onClick={handleAddGalleryUrl}
                    className="bg-brand-lime hover:bg-brand-lime-dark text-brand-dark px-4 rounded-2xl font-bold text-xs flex items-center justify-center cursor-pointer"
                  >
                    Adicionar
                  </button>
                </div>

                {/* Previews of gallery */}
                <div className="grid grid-cols-4 gap-3">
                  {gallery.map((img, idx) => (
                    <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-black/40 border border-white/10 relative group">
                      <img src={img} alt={`Portfólio ${idx}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => handleRemoveGalleryItem(idx)}
                        className="absolute top-1 right-1 p-1 bg-red-600/80 hover:bg-red-600 rounded-md text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* SAVE ACTION */}
              <div className="pt-6 border-t border-white/10 flex items-center justify-between gap-4">
                <div className="text-left">
                  {saveSuccess && (
                    <span className="text-emerald-400 text-xs font-bold flex items-center gap-1 animate-fade-in">
                      <Check className="w-4 h-4" />
                      Alterações salvas com sucesso no Firebase!
                    </span>
                  )}
                </div>
                
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-brand-lime hover:bg-brand-lime-dark text-brand-dark px-6 py-3.5 rounded-2xl font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-xl shadow-brand-lime/10 cursor-pointer disabled:opacity-50"
                  id="btn-save-vitrine"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-brand-dark border-t-transparent animate-spin rounded-full"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{isSaving ? 'Salvando...' : 'Salvar Vitrine'}</span>
                </button>
              </div>

            </div>

          </div>

          {/* CLIENT PREVIEW COLUMN */}
          <div id="client-preview-section" className={`lg:col-span-5 ${activeSubTab === 'preview' ? 'block' : 'hidden lg:block'}`}>
            <div className="sticky top-28 flex flex-col items-center">
              
              <div className="flex items-center justify-between w-[326px] mb-3 px-1">
                <span className="text-xs text-gray-200 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                  <span>📱 CELULAR DO CLIENTE</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(true)}
                  className="text-[11px] font-extrabold text-amber-300 bg-[#041126] hover:bg-[#071a3d] px-3 py-1 rounded-full border border-amber-400/40 transition-colors cursor-pointer"
                  title="Trocar modelo da vitrine"
                >
                  {template === 'modelo2' ? 'Modelo 2' : 'Modelo 1'}
                </button>
              </div>

              {/* PHONE FRAME */}
              <div className="w-[326px] h-[650px] bg-[#020b18] rounded-[44px] p-2.5 shadow-2xl border-4 border-[#12284f] relative overflow-hidden flex flex-col">
                
                {/* Speaker top notch */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-5 bg-[#020b18] rounded-b-2xl z-50 flex justify-center items-start">
                  <div className="w-12 h-1 bg-gray-700 rounded-full mt-1.5" />
                </div>

                {/* Inner screen content */}
                <div className="flex-1 bg-[#faf9f6] rounded-[34px] overflow-y-auto text-brand-dark flex flex-col relative scrollbar-none">
                  {renderVitrineContent(true)}
                </div>
              </div>

            </div>
          </div>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="bg-brand-dark/30 py-8 px-4 text-center text-xs text-gray-500 border-t border-white/5 mt-16">
        <p>&copy; {new Date().getFullYear()} Cortestime Vitrine Digital S.A. Todos os direitos reservados.</p>
      </footer>

      {/* QR CODE MODAL OVERLAY */}
      <AnimatePresence>
        {showQR && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#09224f] border border-white/10 rounded-3xl p-8 max-w-sm w-full text-center space-y-6 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowQR(false)}
                className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
              >
                &times;
              </button>

              <div className="space-y-1">
                <h3 className="font-display font-extrabold text-xl text-white">QR Code da Barbearia</h3>
                <p className="text-xs text-gray-400">Exiba no balcão da barbearia ou envie para clientes!</p>
              </div>

              {/* Real SVG QR code containing the link */}
              <div className="bg-white p-4 rounded-3xl inline-block shadow-lg mx-auto">
                <QRCodeSVG
                  id="qr-code-svg-element"
                  value={realUrl}
                  size={200}
                  bgColor="#ffffff"
                  fgColor="#051b42"
                  level="H"
                  includeMargin={true}
                  className="mx-auto rounded-xl"
                />
              </div>

              <div className="flex gap-2 justify-center">
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-xs text-white font-bold py-2.5 px-4 rounded-xl border border-white/10 transition-all cursor-pointer"
                  title="Copiar Link"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-brand-lime" />
                      <span className="text-brand-lime">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Link</span>
                    </>
                  )}
                </button>

                <button
                  onClick={downloadQRCode}
                  className="flex items-center gap-1.5 bg-[#bffd32] hover:bg-[#a6e025] text-[#051b42] font-black text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer"
                  title="Baixar QR Code (SVG)"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar QR</span>
                </button>
              </div>

              <div className="bg-[#051b42]/60 rounded-2xl p-3.5 border border-white/5 text-left text-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <p className="font-bold text-gray-300">Link codificado no QR Code:</p>
                </div>
                <p 
                  onClick={handleCopyLink}
                  className="font-mono text-brand-lime select-all cursor-pointer break-all hover:underline"
                >
                  {realUrl}
                </p>
              </div>

              <button
                onClick={() => setShowQR(false)}
                className="w-full bg-brand-blue hover:bg-brand-blue-dark text-white py-3.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider cursor-pointer border border-white/10"
              >
                Voltar
              </button>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* UPGRADE PLANS OVERLAY MODAL */}
      <AnimatePresence>
        {showUpgradePlans && (
          <div className="fixed inset-0 z-50 bg-black/85 flex flex-col items-center justify-start p-4 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#051b42] border border-white/10 rounded-3xl p-6 md:p-8 max-w-4xl w-full text-center space-y-6 shadow-2xl relative my-8"
            >
              <button 
                onClick={() => setShowUpgradePlans(false)}
                className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 text-white hover:text-amber-400 rounded-full transition-colors cursor-pointer border border-white/10 flex items-center justify-center shadow-md z-10"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-2">
                <span className="bg-amber-500/25 text-amber-400 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border border-amber-400/25">
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

      {/* REVIEWS PRO BENEFITS MODAL */}
      <AnimatePresence>
        {showReviewsProModal && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#051b42] border border-white/10 rounded-3xl p-6 md:p-8 max-w-md w-full text-left space-y-6 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowReviewsProModal(false)}
                className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 text-white hover:text-amber-400 rounded-full transition-colors cursor-pointer border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-2">
                <span className="bg-amber-500/20 text-amber-400 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border border-amber-400/20 inline-flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>Avaliações de Clientes Pro</span>
                </span>
                <h3 className="font-sans font-extrabold text-2xl text-white">Desbloqueie a Prova Social e Venda Mais</h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Avaliações reais de clientes aumentam dramaticamente a taxa de conversão da sua Vitrine Digital.
                </p>
              </div>

              <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3 text-xs text-gray-200">
                <div className="flex items-start gap-3">
                  <div className="p-1 bg-amber-400/20 rounded-lg text-amber-400 shrink-0 mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-white block font-bold">Exibir avaliações reais dos clientes</strong>
                    <span className="text-gray-400 text-[11px]">Seus clientes deixam comentários e nota de 1 a 5 estrelas.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 bg-amber-400/20 rounded-lg text-amber-400 shrink-0 mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-white block font-bold">Aumentar a confiança de novos clientes</strong>
                    <span className="text-gray-400 text-[11px]">Quem acessa seu link da bio tem certeza do excelente serviço.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 bg-amber-400/20 rounded-lg text-amber-400 shrink-0 mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-white block font-bold">Melhorar a conversão da Vitrine</strong>
                    <span className="text-gray-400 text-[11px]">Transforme visitantes do Instagram em clientes pagantes.</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1 bg-amber-400/20 rounded-lg text-amber-400 shrink-0 mt-0.5">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-white block font-bold">Personalizar avaliações em destaque</strong>
                    <span className="text-gray-400 text-[11px]">Escolha os elogios mais marcantes para fixar no topo.</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  onClick={() => {
                    setShowReviewsProModal(false);
                    setShowUpgradePlans(true);
                  }}
                  className="w-full bg-brand-lime hover:bg-brand-lime-dark text-brand-dark font-black py-4 rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg transition-transform hover:scale-[1.02]"
                >
                  <Sparkles className="w-4 h-4 fill-current" />
                  <span>Conhecer o Cortestime Pro</span>
                </button>

                <button
                  onClick={() => setShowReviewsProModal(false)}
                  className="w-full bg-transparent hover:bg-white/5 text-gray-400 font-bold py-2 rounded-xl text-xs transition-colors"
                >
                  Voltar para a Vitrine
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MERCADO PAGO CHECKOUT MODAL OVERLAY */}
      <AnimatePresence>
        {checkoutPlan && (
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

      {/* CLIENT BOOKING MODAL FOR SITE BOOKING */}
      <AnimatePresence>
        {showSiteBookingModal && (
          <div className="fixed inset-0 z-50 bg-[#051b42]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg my-auto relative"
            >
              <ClientBooking
                businessName={merchant.vitrineLogo || merchant.nomeBarbearia || 'Cortes Vitrine'}
                businessLogo={merchant.vitrineLogoImage || logoImage}
                services={services}
                barbers={
                  barbers && barbers.length > 0
                    ? barbers.map(b => ({
                        ...b,
                        avatar: (b.avatar && b.avatar.trim() !== '' && !b.avatar.includes('unsplash.com'))
                          ? b.avatar
                          : (merchant.vitrineLogoImage || logoImage || b.avatar)
                      }))
                    : [
                        {
                          id: 'b-default',
                          name: merchant.nomeProprietario || 'Barbeiro Principal',
                          avatar: merchant.vitrineLogoImage || logoImage || '',
                          rating: 5.0,
                          specialty: 'Cortes & Barba'
                        }
                      ]
                }
                onBookAppointment={async (appointmentData) => {
                  try {
                    const fullApp: Appointment = {
                      id: `app-${Date.now()}`,
                      status: 'pending',
                      ...appointmentData
                    };
                    await firebaseService.saveAppointment(fullApp, merchant.uid);
                  } catch (err) {
                    console.error('Error adding appointment:', err);
                  }
                }}
                onClose={() => setShowSiteBookingModal(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CLIENT AREA MODAL & DASHBOARD */}
      <AnimatePresence>
        {showClientAreaModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col"
            >
              {/* Top Blue Header Banner */}
              <div className="h-24 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 relative flex items-center justify-center shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowClientAreaModal(false);
                    setIsClientLoggedIn(false);
                  }}
                  className="absolute top-3 right-3 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 p-1.5 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                
                {/* Circle Logo Container */}
                <div className="absolute -bottom-7 w-16 h-16 rounded-full bg-white border-4 border-white shadow-md flex items-center justify-center text-blue-600 font-extrabold text-xs text-center p-1 overflow-hidden">
                  {logoImage ? (
                    <img src={logoImage} alt={logoText} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <span className="line-clamp-2 leading-tight">{logoText}</span>
                  )}
                </div>
              </div>

              {/* Modal Body */}
              <div className="pt-10 pb-6 px-6 text-center space-y-4 overflow-y-auto flex-1 text-left">
                {!isClientLoggedIn ? (
                  <div className="space-y-4 text-center">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Área do Cliente
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Consulte e gerencie seus agendamentos na {merchant.nomeBarbearia || 'Barbearia'}
                      </p>
                    </div>

                    {clientAreaError && (
                      <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-100">
                        {clientAreaError}
                      </div>
                    )}

                    <form onSubmit={handleClientLogin} className="space-y-3 text-left">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">
                          Telefone (WhatsApp)
                        </label>
                        <input
                          type="tel"
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          placeholder="(11) 99999-9999"
                          required
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">
                          Senha (opcional)
                        </label>
                        <input
                          type="password"
                          value={clientPass}
                          onChange={(e) => setClientPass(e.target.value)}
                          placeholder="Digite se tiver uma senha"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isLoadingClientData}
                        className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-sm py-3.5 rounded-full transition-colors shadow-md shadow-blue-500/20 cursor-pointer mt-2 flex items-center justify-center gap-2"
                      >
                        {isLoadingClientData ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Entrando...</span>
                          </>
                        ) : (
                          <span>Acessar Meus Agendamentos</span>
                        )}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Logged in Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <div>
                        <h3 className="text-base font-bold text-gray-900">
                          Meus Agendamentos
                        </h3>
                        <p className="text-xs text-gray-500">
                          {clientPhone}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsClientLoggedIn(false);
                          setClientAppointments([]);
                          setClientCancelSuccessMsg(null);
                        }}
                        className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 cursor-pointer bg-red-50 px-2.5 py-1 rounded-lg"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sair</span>
                      </button>
                    </div>

                    {clientCancelSuccessMsg && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{clientCancelSuccessMsg}</span>
                      </div>
                    )}

                    {/* BARBERSHOP CANCELLATION NOTIFICATIONS ALERT BANNER */}
                    {clientAppointments.some(a => a.status === 'cancelled' && a.cancelledBy === 'barbershop') && (
                      <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-3.5 space-y-2">
                        <div className="flex items-center gap-2 text-red-800 font-bold text-xs">
                          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                          <span>Atenção: Agendamento Cancelado pela Barbearia</span>
                        </div>
                        {clientAppointments
                          .filter(a => a.status === 'cancelled' && a.cancelledBy === 'barbershop')
                          .slice(0, 2)
                          .map((cancelledItem) => {
                            const serv = services.find(s => s.id === cancelledItem.serviceId);
                            return (
                              <div key={cancelledItem.id} className="bg-white/80 p-2.5 rounded-xl text-xs space-y-1 text-red-950">
                                <p className="font-semibold">
                                  {serv?.name || 'Serviço'} - {cancelledItem.date} às {cancelledItem.time}
                                </p>
                                {cancelledItem.cancellationReason && (
                                  <p className="text-[11px] text-red-700 italic">
                                    Motivo informado: "{cancelledItem.cancellationReason}"
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        <button
                          type="button"
                          onClick={() => {
                            setShowClientAreaModal(false);
                            if (onBookOnline) {
                              onBookOnline();
                            } else {
                              setShowSiteBookingModal(true);
                            }
                          }}
                          className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reagendar Novo Horário</span>
                        </button>
                      </div>
                    )}

                    {/* APPOINTMENTS LIST */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Seus Horários ({clientAppointments.length})
                        </h4>
                        <button
                          type="button"
                          onClick={() => fetchClientData(clientPhone)}
                          className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                        >
                          Atualizar
                        </button>
                      </div>

                      {isLoadingClientData ? (
                        <div className="py-8 text-center text-xs text-gray-400">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                          <p>Carregando seus agendamentos...</p>
                        </div>
                      ) : clientAppointments.length === 0 ? (
                        <div className="py-8 text-center text-xs text-gray-400 bg-gray-50 rounded-2xl border border-gray-100 p-4 space-y-2">
                          <Calendar className="w-8 h-8 text-gray-300 mx-auto" />
                          <p>Nenhum agendamento encontrado para este número.</p>
                          <button
                            type="button"
                            onClick={() => {
                              setShowClientAreaModal(false);
                              if (onBookOnline) {
                                onBookOnline();
                              } else {
                                setShowSiteBookingModal(true);
                              }
                            }}
                            className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                          >
                            + Agendar um horário agora
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                          {clientAppointments.map((app) => {
                            const serv = services.find(s => s.id === app.serviceId);
                            const barber = (barbers || []).find(b => b.id === app.barberId);
                            const isCancelled = app.status === 'cancelled';
                            const isCancelledByBarbershop = isCancelled && app.cancelledBy === 'barbershop';
                            const isCancelledByClient = isCancelled && app.cancelledBy === 'client';

                            return (
                              <div
                                key={app.id}
                                className={`p-4 rounded-2xl border transition-all text-left space-y-2.5 ${
                                  isCancelledByBarbershop
                                    ? 'bg-red-50/60 border-red-200'
                                    : isCancelled
                                    ? 'bg-gray-50 border-gray-200 opacity-70'
                                    : 'bg-white border-gray-200 hover:border-blue-300 shadow-xs'
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h5 className="font-bold text-sm text-gray-900">{serv?.name || 'Serviço'}</h5>
                                    <p className="text-xs text-gray-500">
                                      Profissional: <strong>{barber?.name || 'Barbeiro'}</strong>
                                    </p>
                                  </div>

                                  {isCancelled ? (
                                    <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                      Cancelado
                                    </span>
                                  ) : app.status === 'completed' ? (
                                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                      Concluído
                                    </span>
                                  ) : (
                                    <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                                      Confirmado
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-3 text-xs text-gray-700 pt-1 border-t border-gray-100 font-medium">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                                    {app.date}
                                  </span>
                                  <span className="flex items-center gap-1 font-mono">
                                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                                    {app.time}
                                  </span>
                                  {serv?.price ? (
                                    <span className="text-gray-500 font-normal ml-auto">
                                      R$ {serv.price.toFixed(0)}
                                    </span>
                                  ) : null}
                                </div>

                                {isCancelledByBarbershop && (
                                  <p className="text-[11px] text-red-700 bg-red-100/60 p-2 rounded-lg italic">
                                    Cancelado pela barbearia{app.cancellationReason ? `: "${app.cancellationReason}"` : ''}
                                  </p>
                                )}

                                {isCancelledByClient && (
                                  <p className="text-[11px] text-gray-500 bg-gray-100 p-2 rounded-lg italic">
                                    Cancelado por você{app.cancellationReason ? `: "${app.cancellationReason}"` : ''}
                                  </p>
                                )}

                                {!isCancelled && app.status !== 'completed' && (
                                  <div className="pt-2 flex justify-end">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCancellingClientApp(app);
                                        setClientCancelReason('');
                                      }}
                                      className="text-xs bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 font-semibold px-3 py-1.5 rounded-xl border border-red-200 transition-colors flex items-center gap-1 cursor-pointer"
                                    >
                                      <Ban className="w-3.5 h-3.5" />
                                      <span>Cancelar Horário</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowClientAreaModal(false);
                          if (onBookOnline) {
                            onBookOnline();
                          } else {
                            setShowSiteBookingModal(true);
                          }
                        }}
                        className="flex-1 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-xs py-3 rounded-xl transition-colors cursor-pointer shadow-md shadow-blue-500/20 text-center"
                      >
                        + Novo Agendamento
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE CONFIRMAÇÃO DE CANCELAMENTO PELO CLIENTE NA VITRINE */}
      <AnimatePresence>
        {cancellingClientApp && (
          <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 text-left border border-gray-100"
            >
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
                <Ban className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-base font-bold text-gray-900">Cancelar Agendamento?</h3>
                <p className="text-xs text-gray-500">
                  Data: <strong>{cancellingClientApp.date} às {cancellingClientApp.time}</strong>
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 block">
                  Motivo do cancelamento (opcional):
                </label>
                <textarea
                  value={clientCancelReason}
                  onChange={(e) => setClientCancelReason(e.target.value)}
                  placeholder="Ex: Tive um imprevisto..."
                  rows={2}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                />
              </div>

              <p className="text-[11px] text-gray-500 leading-relaxed">
                Ao confirmar o cancelamento, seu horário será liberado e enviaremos um alerta imediato para a barbearia.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCancellingClientApp(null)}
                  className="py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancelFromClientArea}
                  className="py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-md shadow-red-600/20"
                >
                  Confirmar Cancelamento
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: ENTRAR NA FILA AO VIVO */}
      <AnimatePresence>
        {showJoinQueueModal && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 text-left space-y-4 relative"
            >
              <button
                type="button"
                onClick={() => {
                  setShowJoinQueueModal(false);
                  setJoinQueueError(null);
                }}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                  <Scissors className="w-3 h-3 text-emerald-600" />
                  <span>Fila ao vivo</span>
                </div>
                <h3 className="text-lg font-black text-gray-900 leading-tight">
                  Entrar na Fila de Espera
                </h3>
                <p className="text-xs text-gray-500">
                  Preencha seus dados para garantir sua posição na fila por ordem de chegada.
                </p>
              </div>

              {joinQueueError && (
                <div className="bg-red-50 text-red-700 border border-red-200 text-xs p-3 rounded-xl">
                  {joinQueueError}
                </div>
              )}

              <form onSubmit={handleJoinQueue} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Seu Nome Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={joinQueueName}
                    onChange={(e) => setJoinQueueName(e.target.value)}
                    placeholder="Ex: Carlos Silva"
                    className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium text-gray-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    WhatsApp para Avisos <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={joinQueuePhone}
                    onChange={(e) => setJoinQueuePhone(e.target.value)}
                    placeholder="Ex: (11) 99999-9999"
                    className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium text-gray-900"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Enviaremos alertas quando seu atendimento for se aproximar.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    Serviço Desejado
                  </label>
                  <select
                    value={joinQueueServiceId}
                    onChange={(e) => setJoinQueueServiceId(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium text-gray-900 cursor-pointer"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} - R$ {s.price.toFixed(2)} ({s.durationMin} min)
                      </option>
                    ))}
                  </select>
                </div>

                {barbers && barbers.length > 0 && (
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Preferência de Barbeiro (Opcional)
                    </label>
                    <select
                      value={joinQueueBarberId}
                      onChange={(e) => setJoinQueueBarberId(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium text-gray-900 cursor-pointer"
                    >
                      <option value="">Qualquer barbeiro disponível</option>
                      {barbers.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="bg-emerald-50/70 border border-emerald-100 p-3 rounded-xl text-[11px] text-emerald-900 space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span>Posição estimada:</span>
                    <span>#{waitingQueue.length + 1}</span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-800">
                    <span>Tempo de espera aprox.:</span>
                    <span>~{calculateEstimatedTimeForPosition(waitingQueue.length)} min</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isJoiningQueue}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isJoiningQueue ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Entrando na fila...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Confirmar Entrada na Fila</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* MODAL: ESCOLHA DO MODELO DA SUA PÁGINA (VITRINE) */}
        {showTemplateModal && (
          <div className="fixed inset-0 z-50 bg-[#020b18]/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#071739] border border-white/15 text-white rounded-[32px] p-5 sm:p-7 max-w-4xl w-full shadow-2xl relative my-auto space-y-5"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-white/10 pb-4">
                <div className="space-y-1 text-left pr-8">
                  <h3 className="text-lg sm:text-2xl font-black text-white tracking-tight">
                    Escolha o modelo da sua página
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-300">
                    Veja o preview rodando e toque no que combina com sua barbearia.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="p-2 sm:p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors cursor-pointer shrink-0"
                  title="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Swipeable Models Carousel on Mobile / 2-Columns on Desktop */}
              <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-3 pt-1 px-1 -mx-2 sm:mx-0 sm:grid sm:grid-cols-2 text-left max-h-[72vh] overflow-y-auto scrollbar-none">
                
                {/* MODELO 1 */}
                <div
                  onClick={() => setTemplate('modelo1')}
                  className={`w-[84vw] max-w-[340px] sm:w-full shrink-0 snap-center rounded-[28px] border-2 transition-all p-3.5 sm:p-4 cursor-pointer relative flex flex-col justify-between group ${
                    template === 'modelo1'
                      ? 'border-amber-500 bg-[#092254] ring-2 ring-amber-500/30 shadow-xl shadow-amber-500/10'
                      : 'border-white/10 bg-[#05183d] hover:border-white/25 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div>
                    {/* Top Badge */}
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs font-black text-white flex items-center gap-1.5">
                        <span>Modelo 1</span>
                      </span>
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 ${
                        template === 'modelo1'
                          ? 'bg-amber-500 text-black'
                          : 'bg-white/10 text-gray-300'
                      }`}>
                        Recomendado {template === 'modelo1' ? '✓' : ''}
                      </span>
                    </div>

                    {/* Smartphone Screen Mockup - MODELO 1 (CLÁSSICO CLEAN) */}
                    <div className="rounded-2xl bg-[#faf9f6] border border-white/20 overflow-hidden shadow-inner flex flex-col text-gray-900 text-left">
                      {/* Top Banner with back button */}
                      <div className="relative h-16 w-full bg-gray-800 overflow-hidden shrink-0">
                        <img
                          src={capa || (gallery && gallery[0]) || DEFAULT_COVER_URL}
                          alt="Banner Capa"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                        <div className="absolute top-1.5 left-1.5 bg-black/50 text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          <span>‹ Voltar</span>
                        </div>
                      </div>

                      {/* Header with Floating Avatar */}
                      <div className="p-2 pt-0 text-center relative -mt-5 space-y-1">
                        <div 
                          className="w-9 h-9 rounded-full border-2 border-white mx-auto shadow-md overflow-hidden flex items-center justify-center p-0.5"
                          style={{
                            background: gradientEnabled
                              ? `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
                              : primaryColor
                          }}
                        >
                          {logoImage ? (
                            <img src={logoImage} alt="Logo" className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <span className="text-white text-[10px] font-black">
                              {(logoText || merchant.nomeBarbearia || 'B').charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>

                        <h4 className="text-[11px] font-black text-gray-900 leading-tight truncate">
                          {logoText || merchant.nomeBarbearia || 'Sua Barbearia'}
                        </h4>
                        <p className="text-[7.5px] text-gray-500 italic line-clamp-1">
                          "{slogan || 'Corte, Barba & Estilo de Alto Padrão'}"
                        </p>
                        
                        <div className="inline-block bg-gray-100 text-gray-600 text-[6.5px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Vitrine Digital Oficial ✂
                        </div>

                        {/* Hours & Address quick pills */}
                        {horarioHoje.ativo && (
                          <div className="bg-emerald-50/80 border border-emerald-200/70 px-1.5 py-0.5 rounded-lg text-left flex items-center justify-between gap-1 mt-1 text-[6.5px]">
                            <div className="flex items-center gap-1 truncate font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                              <span className="text-emerald-800 shrink-0">{horarioHoje.status === 'atendendo' ? 'Atendendo hoje' : 'Fechado'}</span>
                              <span className="text-gray-400">·</span>
                              <span className="text-gray-600 shrink-0">{getHojeData().dataCurta}</span>
                              <span className="text-gray-400">·</span>
                              <span className="font-mono text-gray-900 truncate">{horarioHoje.status === 'atendendo' ? `${horarioHoje.inicio} às ${horarioHoje.fim}` : 'Amanhã'}</span>
                            </div>
                            <ChevronRight className="w-2 h-2 text-gray-400 shrink-0" />
                          </div>
                        )}

                        <div className="bg-white p-1.5 rounded-xl border border-gray-100 space-y-1 text-[7px] text-left text-gray-600 mt-1">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5 text-blue-600 shrink-0" />
                            <span className="text-gray-600 truncate">{localizacao || 'Av. Principal, 123 - Centro'}</span>
                          </div>
                        </div>

                        {/* Tabela de Serviços Reais */}
                        <div className="text-left pt-1">
                          <span className="text-[7px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                            Tabela de Serviços & Preços
                          </span>
                          <div className="space-y-1">
                            {(services && services.length > 0 ? services.slice(0, 2) : [
                              { id: '1', name: 'Corte Social / Degradê', durationMin: 30, price: 45 },
                              { id: '2', name: 'Barba Terapia Completa', durationMin: 30, price: 35 }
                            ]).map((s) => (
                              <div key={s.id} className="bg-white p-1.5 rounded-xl border border-gray-100 flex items-center justify-between shadow-2xs">
                                <div className="min-w-0 pr-1 truncate">
                                  <p className="font-bold text-gray-900 text-[8px] truncate">{s.name}</p>
                                  <p className="text-gray-400 text-[6.5px]">{s.durationMin} min</p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className="font-bold text-gray-800 text-[7.5px] bg-gray-50 px-1 py-0.5 rounded border border-gray-100">
                                    R$ {s.price.toFixed(0)}
                                  </span>
                                  {modoAcao === 'whatsapp' ? (
                                    <span className="text-white font-bold text-[6.5px] px-1.5 py-0.5 rounded bg-emerald-600 flex items-center gap-0.5">
                                      <Phone className="w-1.5 h-1.5 fill-current" />
                                      <span>Zap</span>
                                    </span>
                                  ) : (
                                    <span 
                                      className="text-white font-bold text-[6.5px] px-1.5 py-0.5 rounded"
                                      style={{
                                        background: gradientEnabled
                                          ? `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
                                          : primaryColor
                                      }}
                                    >
                                      Agendar
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 2x2 Mini Portfolio grid */}
                        <div className="text-left pt-1">
                          <span className="text-[7px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                            Nosso Portfólio
                          </span>
                          <div className="grid grid-cols-2 gap-1">
                            <div className="aspect-square bg-gray-900 rounded-lg overflow-hidden">
                              <img src={(gallery && gallery[0]) || DEFAULT_HAIRCUTS[0]} alt="Corte 1" className="w-full h-full object-cover" />
                            </div>
                            <div className="aspect-square bg-gray-900 rounded-lg overflow-hidden">
                              <img src={(gallery && gallery[1]) || DEFAULT_HAIRCUTS[1]} alt="Corte 2" className="w-full h-full object-cover" />
                            </div>
                          </div>
                        </div>

                        {/* Mini Hero CTA Button */}
                        <div className="bg-white p-1.5 rounded-xl border border-gray-100 text-center space-y-1 shadow-2xs mt-1">
                          <p className="text-[8px] font-black text-gray-800">
                            {modoAcao === 'whatsapp' ? 'Atendimento no WhatsApp' : 'Agende seu horário online'}
                          </p>
                          {modoAcao === 'whatsapp' ? (
                            <div className="text-white font-black text-[7.5px] py-1 rounded-lg bg-emerald-600 flex items-center justify-center gap-1">
                              <Phone className="w-2 h-2 fill-current" />
                              <span>WhatsApp</span>
                            </div>
                          ) : (
                            <div 
                              className="text-white font-black text-[7.5px] py-1 rounded-lg"
                              style={{
                                background: gradientEnabled
                                  ? `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
                                  : primaryColor
                              }}
                            >
                              Agendar
                            </div>
                          )}
                          <p className="text-[6.5px] text-gray-400 font-medium">Área do Cliente</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description & Selection state */}
                  <div className="mt-3 space-y-2">
                    <div>
                      <p className="text-xs font-extrabold text-white">Modelo 1</p>
                      <p className="text-[10px] sm:text-[11px] text-gray-300 leading-tight mt-0.5">
                        Clássico Clean: Banner no topo com logo flutuante, fundo claro, tabela de serviços completa e galeria em grade.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTemplate('modelo1');
                      }}
                      className={`w-full py-2 sm:py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        template === 'modelo1'
                          ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      {template === 'modelo1' ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Modelo Selecionado</span>
                        </>
                      ) : (
                        <span>Escolher Modelo 1</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* MODELO 2 */}
                <div
                  onClick={() => setTemplate('modelo2')}
                  className={`w-[84vw] max-w-[340px] sm:w-full shrink-0 snap-center rounded-[28px] border-2 transition-all p-3.5 sm:p-4 cursor-pointer relative flex flex-col justify-between group ${
                    template === 'modelo2'
                      ? 'border-amber-500 bg-[#092254] ring-2 ring-amber-500/30 shadow-xl shadow-amber-500/10'
                      : 'border-white/10 bg-[#05183d] hover:border-white/25 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div>
                    {/* Top Badge */}
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs font-black text-white flex items-center gap-1.5">
                        <span>Modelo 2</span>
                      </span>
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 ${
                        template === 'modelo2'
                          ? 'bg-amber-500 text-black'
                          : 'bg-white/10 text-gray-300'
                      }`}>
                        Moderno & Degradê {template === 'modelo2' ? '✓' : ''}
                      </span>
                    </div>

                    {/* Smartphone Screen Mockup - MODELO 2 (MODERNO & DEGRADÊ) */}
                    <div className="rounded-2xl bg-[#faf9f6] border border-white/20 overflow-hidden shadow-inner flex flex-col text-left">
                      {/* Top Immersive Themed / Gradient Hero Container */}
                      <div
                        className="p-3 pt-4 pb-4 text-center text-white relative overflow-hidden space-y-1.5"
                        style={{
                          background: gradientEnabled
                            ? `linear-gradient(145deg, ${primaryColor} 0%, ${secondaryColor} 100%)`
                            : primaryColor
                        }}
                      >
                        {/* Ambient glow */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />

                        {/* Circular Logo */}
                        <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border-2 border-white mx-auto overflow-hidden flex items-center justify-center shadow-lg p-0.5">
                          {logoImage ? (
                            <img src={logoImage} alt="Logo" className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <span className="text-white text-xs font-black">
                              {(logoText || merchant.nomeBarbearia || 'B').charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>

                        {/* Title & Slogan */}
                        <div>
                          <h4 className="text-xs font-black text-white truncate drop-shadow-xs">
                            {logoText || merchant.nomeBarbearia || 'Sua Barbearia'}
                          </h4>
                          <p className="text-[7.5px] text-white/85 italic line-clamp-1 drop-shadow-xs">
                            "{slogan || 'Corte, Barba & Estilo de Alto Padrão'}"
                          </p>
                        </div>

                        {/* Rating stars */}
                        <div className="flex items-center justify-center gap-0.5 text-[7px] text-amber-300 font-bold">
                          <span>★★★★★</span>
                          <span className="text-white font-bold ml-0.5">5.0</span>
                        </div>

                        {/* Action buttons in Header */}
                        <div className="flex items-center justify-center gap-1 pt-0.5">
                          {modoAcao === 'whatsapp' ? (
                            <div className="flex-1 max-w-[130px] bg-emerald-500 text-emerald-950 font-black text-[7.5px] py-1.5 px-2 rounded-full text-center shadow-md flex items-center justify-center gap-1">
                              <Phone className="w-2 h-2 fill-current" />
                              <span>Chamar no WhatsApp</span>
                            </div>
                          ) : (
                            <div className="flex-1 max-w-[110px] bg-white text-gray-950 font-black text-[7.5px] py-1.5 px-2 rounded-full text-center shadow-md">
                              Agendar agora
                            </div>
                          )}
                          {modoAcao !== 'whatsapp' && (
                            <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shrink-0">
                              <Phone className="w-2.5 h-2.5" />
                            </div>
                          )}
                          <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shrink-0">
                            <Instagram className="w-2.5 h-2.5" />
                          </div>
                        </div>

                        {/* Horário de Hoje Mini Pill */}
                        {horarioHoje.ativo && (
                          <div className="bg-black/35 backdrop-blur-md border border-emerald-400/40 px-1.5 py-0.5 rounded-lg text-left flex items-center justify-between gap-1 mt-1 text-[6.5px]">
                            <div className="flex items-center gap-1 truncate font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                              <span className="text-emerald-300 shrink-0">{horarioHoje.status === 'atendendo' ? 'Atendendo hoje' : 'Fechado'}</span>
                              <span className="text-white/40">·</span>
                              <span className="text-white/70 shrink-0">{getHojeData().dataCurta}</span>
                              <span className="text-white/40">·</span>
                              <span className="font-mono text-white truncate">{horarioHoje.status === 'atendendo' ? `${horarioHoje.inicio} às ${horarioHoje.fim}` : 'Amanhã'}</span>
                            </div>
                            <ChevronRight className="w-2 h-2 text-white/50 shrink-0" />
                          </div>
                        )}

                        {/* Location Quick Card */}
                        <div className="bg-black/25 backdrop-blur-md border border-white/15 rounded-xl p-1.5 text-left space-y-0.5">
                          <div className="flex items-center gap-1 text-[7px] font-bold text-amber-300">
                            <MapPin className="w-2 h-2 shrink-0" />
                            <span>Localização</span>
                          </div>
                          <p className="text-[6.5px] text-white/90 truncate font-medium">
                            {localizacao || 'Av. Principal, 123 - Centro'}
                          </p>
                        </div>

                        {/* Client Area Quick Card */}
                        <div className="bg-white text-gray-900 rounded-xl p-1.5 text-left flex items-center justify-between shadow-xs">
                          <div className="flex items-center gap-1 min-w-0">
                            <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 shrink-0">
                              <User className="w-2.5 h-2.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-black text-gray-900 text-[7px] leading-tight truncate">Já é cliente?</p>
                              <p className="text-[5.5px] text-gray-500 font-medium truncate">Acesse e gerencie seus agendamentos</p>
                            </div>
                          </div>
                          <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
                        </div>
                      </div>

                      {/* Lower White Sheet with Services */}
                      <div className="bg-[#faf9f6] p-2.5 space-y-2 rounded-t-2xl -mt-2 relative z-10 border-t border-gray-100">
                        <div>
                          <span className="text-[7.5px] font-black text-gray-900 uppercase tracking-wider block mb-1">
                            Nossos Serviços
                          </span>
                          <div className="space-y-1">
                            {(services && services.length > 0 ? services.slice(0, 2) : [
                              { id: '1', name: 'Corte Social / Degradê', durationMin: 30, price: 45 },
                              { id: '2', name: 'Barba Terapia Completa', durationMin: 30, price: 35 }
                            ]).map((s) => (
                              <div key={s.id} className="bg-white p-1.5 rounded-xl border border-gray-100 flex items-center justify-between shadow-2xs">
                                <div className="min-w-0 pr-1 truncate">
                                  <p className="font-extrabold text-gray-900 text-[8px] truncate">{s.name}</p>
                                  <p className="text-gray-400 text-[6.5px] flex items-center gap-0.5">
                                    <Clock className="w-2 h-2 text-gray-400" />
                                    {s.durationMin} min
                                  </p>
                                </div>
                                <div className="shrink-0">
                                  <span className="font-mono font-bold text-gray-900 text-[7.5px] bg-gray-50 px-1.5 py-0.5 rounded-lg border border-gray-100">
                                    R$ {s.price.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Mini Footer Branding */}
                        <div className="text-center pt-1 text-[6px] text-gray-400 font-medium flex items-center justify-center gap-1">
                          <ShieldCheck className="w-2.5 h-2.5 text-gray-400" />
                          <span>Tecnologia Cortestime</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description & Selection state */}
                  <div className="mt-3 space-y-2">
                    <div>
                      <p className="text-xs font-extrabold text-white">Modelo 2</p>
                      <p className="text-[10px] sm:text-[11px] text-gray-300 leading-tight mt-0.5">
                        Moderno & Degradê: Cabeçalho imersivo personalizável, botões rápidos de contato, área do cliente integrada e lista de serviços clean.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTemplate('modelo2');
                      }}
                      className={`w-full py-2 sm:py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        template === 'modelo2'
                          ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      {template === 'modelo2' ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Modelo Selecionado</span>
                        </>
                      ) : (
                        <span>Escolher Modelo 2</span>
                      )}
                    </button>
                  </div>
                </div>

              </div>

              {/* Mobile Swipe Indicator Dots */}
              <div className="flex sm:hidden justify-center items-center gap-1.5 pt-1">
                <span className={`w-2.5 h-1 rounded-full transition-all ${template === 'modelo1' ? 'bg-amber-500 w-5' : 'bg-white/30'}`} />
                <span className={`w-2.5 h-1 rounded-full transition-all ${template === 'modelo2' ? 'bg-amber-500 w-5' : 'bg-white/30'}`} />
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-gray-300">
                  Modelo ativo: <strong className="text-amber-400 font-bold">{template === 'modelo1' ? 'Modelo 1' : 'Modelo 2'}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="px-6 py-2.5 bg-brand-blue hover:bg-blue-600 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Confirmar e Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAILS MODAL FOR HORÁRIO DE HOJE IN DASHBOARD */}
      {renderHorarioHojeDetailsModal()}

    </div>
  );
}
