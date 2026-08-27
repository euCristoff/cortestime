export interface Service {
  id: string;
  ownerId?: string;
  name: string;
  price: number;
  durationMin: number;
  commissionPercent: number;
}

export interface Barber {
  id: string;
  ownerId?: string;
  name: string;
  avatar: string;
  rating: number;
  specialty: string;
}

export interface Client {
  id: string;
  ownerId?: string;
  name: string;
  phone: string;
  email: string;
}

export interface Appointment {
  id: string;
  ownerId?: string;
  clientName: string;
  clientPhone: string;
  serviceId: string;
  serviceName?: string;
  barberId: string;
  barberName?: string;
  price?: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  cancelledBy?: 'client' | 'barbershop';
  cancellationReason?: string;
  cancelledAt?: string;
  notes?: string;
  isWaitlist?: boolean;
}

export interface AppNotification {
  id: string;
  ownerId?: string;
  clientPhone?: string;
  target: 'barbershop' | 'client';
  type: 'cancellation_by_client' | 'cancellation_by_barbershop' | 'appointment_created' | 'reminder' | 'system';
  title: string;
  body: string;
  appointmentId?: string;
  clientName?: string;
  serviceName?: string;
  date?: string;
  time?: string;
  barberName?: string;
  reason?: string;
  createdAt: string;
  read: boolean;
}

export interface OnboardingData {
  fullName: string;
  cellphone: string;
  whatsapp?: string;
  email: string;
  businessName: string;
  serviceMode?: ServiceMode;
  objectives: string[];
  cep: string;
  neighborhood: string;
  street: string;
  number: string;
  complement: string;
  city?: string;
  state?: string;
}

export interface MerchantUser {
  uid: string;
  id?: string;
  isDraftVitrine?: boolean;
  codigo?: string;
  nomeBarbearia: string;
  nomeProprietario: string;
  email: string;
  whatsapp: string;
  plano: 'vitrine' | 'pro_trial' | 'pro' | 'trial' | 'partner';
  trialInicio: string; // DD/MM/YYYY
  trialFim: string; // DD/MM/YYYY
  status: 'ativo' | 'suspenso' | 'expirado' | 'inativo';
  criadoEm: string;
  onboardingCompleted?: boolean;
  onboardingData?: OnboardingData;
  isAdmin?: boolean;
  
  // Subscription & Manual Payment fields
  dataExpiracaoAssinatura?: string;
  pagamentoPendente?: boolean;
  planoPendente?: string;
  dataPagamentoSolicitado?: string;
  
  // Optional vitrine fields
  vitrineLogo?: string;
  vitrineLogoImage?: string;
  vitrineSlogan?: string;
  vitrineCapa?: string;
  vitrineLinkPersonalizado?: string;
  vitrineHorarios?: string;
  vitrineLocalizacao?: string;
  vitrineEndereco?: string | { cep?: string; rua?: string; numero?: string; bairro?: string; cidade?: string; estado?: string };
  vitrineWhatsApp?: string;
  vitrinePermitirAgendamentoWhatsApp?: boolean;
  vitrineInstagram?: string;
  vitrineFacebook?: string;
  vitrineLinkBio?: string;
  vitrineProdutos?: { id: string; name: string; price: number; durationMin?: number; imageUrl?: string; description?: string }[];
  vitrineGaleria?: string[];
  galeria?: string[];
  servicos?: { id?: string; name: string; price: number; durationMin?: number; description?: string }[];
  vitrineAvaliacoes?: { id: string; author: string; rating: number; comment: string; timeAgo?: string; date?: string }[];
  
  // Vitrine Action Mode & WhatsApp Direct Configuration
  vitrineModoAcao?: 'agendamento' | 'whatsapp';
  vitrineMensagemWhatsApp?: string;
  vitrineMensagemWhatsAppPersonalizada?: string;
  vitrineMensagemWhatsAppAgendamento?: string;
  vitrineMensagemWhatsAppOrdemChegada?: string;
  vitrineUsarSaudacaoHorarioWhatsApp?: boolean;
  mensagemWhatsAppAgendamento?: string;
  mensagemWhatsAppOrdemChegada?: string;
  mensagemWhatsAppPersonalizada?: string;

  // Vitrine Template & Theme Styling
  vitrineTemplate?: 'modelo1' | 'modelo2';
  vitrinePrimaryColor?: string;
  vitrineSecondaryColor?: string;
  vitrineGradientEnabled?: boolean;
  vitrineThemePreset?: string;

  // Horário & Atendimento de Hoje (Recurso Dinâmico)
  vitrineHorarioHoje?: VitrineHorarioHoje;

  // Single Barber Mode (Oculta seleção/ícone de barbeiro no agendamento e equipe na vitrine)
  barbeiroUnico?: boolean;
  vitrineBarbeiroUnico?: boolean;

  // Invite code / Draft vitrine redemption fields
  codigoConviteResgatado?: string;
  vitrineDraftResgatada?: boolean;
  draftJustClaimed?: boolean;

  // Partner Campaign fields
  isPartner?: boolean;
  hasPartnerBadge?: boolean;
  partnerBenefitsExpiry?: string; // Expiration date for 30-day gallery and reviews
  partnerStoryConfirmed?: boolean;
  partnerWelcomeShown?: boolean;

  // PWA / App Installation tracking
  appInstalled?: boolean;
  installRemindersDismissed?: boolean;

  // Service Mode (Agendamento, Ordem de Chegada / Fila, ou Ambos)
  serviceMode?: ServiceMode;

  // UTM & Analytics Attribution fields
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmReferrer?: string;
  firstVisitAt?: string;
  lastVisitAt?: string;
  lastLoginAt?: string;
  lastActivityAt?: string;
  lastActivityLabel?: string;
  activeDaysCount30d?: number;
}

export type ServiceMode = 'agendamento' | 'ordem_chegada' | 'ambos';

export interface UTMData {
  source: string;
  medium?: string;
  campaign?: string;
  referrer?: string;
  timestamp: string;
  path?: string;
  visitorId: string;
}

export interface AnalyticsVisit {
  id: string;
  visitorId: string;
  sessionId: string;
  utmSource: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
  path: string;
  timestamp: string;
  dateStr: string;
  userUid?: string;
}

export type AnalyticsEventType = 
  | 'login' 
  | 'signup'
  | 'dashboard_open' 
  | 'appointment_create' 
  | 'appointment_status_update' 
  | 'client_create' 
  | 'barber_create' 
  | 'service_create' 
  | 'service_update' 
  | 'billing_view' 
  | 'vitrine_view' 
  | 'vitrine_customization' 
  | 'config_update' 
  | 'queue_add' 
  | 'queue_start' 
  | 'queue_finish'
  | 'onboarding_complete';

export interface AnalyticsEvent {
  id: string;
  merchantUid: string;
  merchantName?: string;
  eventType: AnalyticsEventType;
  eventLabel: string;
  metadata?: Record<string, any>;
  timestamp: string;
  dateStr: string;
}

export type MerchantActivityStatus = 'active' | 'low_activity' | 'inactive';

export interface MerchantAnalyticsSummary {
  merchant: MerchantUser;
  status: MerchantActivityStatus;
  lastAccessFormatted: string;
  lastActivityFormatted: string;
  frequencyText: string;
  activeDays7d: number;
  activeDays30d: number;
  activeDays90d: number;
  totalAppointments: number;
  totalClients: number;
  totalBarbers: number;
  totalServices: number;
  recentEvents: AnalyticsEvent[];
}

export interface FunnelStage {
  id: string;
  title: string;
  description: string;
  count: number;
  percentage: number;
  dropoffPercentage?: number;
}

export interface SourceMetric {
  source: string;
  visits: number;
  signups: number;
  conversionRate: number;
}

export interface CampaignMetric {
  campaign: string;
  source: string;
  visits: number;
  signups: number;
  conversionRate: number;
}

export interface QueueItem {
  id: string;
  ownerId?: string;
  clientName: string;
  clientPhone: string;
  serviceId: string;
  barberId?: string;
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled';
  joinedAt: string;
  startedAt?: string;
  finishedAt?: string;
  notes?: string;
}

export interface DraftVitrine {
  id: string;
  codigo: string; // e.g. "BARBER-7XK29"
  nomeBarbearia: string;
  nomeProprietario?: string;
  whatsapp?: string;
  instagram?: string;
  endereco?: string;
  vitrineEndereco?: string;
  vitrineLocalizacao?: string;
  vitrineLinkPersonalizado?: string;
  slogan?: string;
  logoUrl?: string;
  vitrineLogoImage?: string;
  capaUrl?: string;
  vitrineCapa?: string;
  galeria?: string[]; // Portfólio de fotos dos cortes e trabalhos
  vitrineGaleria?: string[];
  horarios?: string;
  vitrineHorarioHoje?: VitrineHorarioHoje;
  horarioHoje?: VitrineHorarioHoje;
  servicos?: { id?: string; name: string; price: number; durationMin: number; description?: string }[];
  vitrineProdutos?: { id: string; name: string; price: number; durationMin?: number; description?: string }[];
  barbeiroUnico?: boolean; // Se ativo, oculta seleção/ícones de barbeiro no agendamento e vitrine
  mensagemWhatsAppAgendamento?: string;
  mensagemWhatsAppOrdemChegada?: string;
  mensagemWhatsAppPersonalizada?: string;
  vitrineMensagemWhatsAppAgendamento?: string;
  vitrineMensagemWhatsAppOrdemChegada?: string;
  vitrineMensagemWhatsAppPersonalizada?: string;
  vitrinePermitirAgendamentoWhatsApp?: boolean;
  vitrineUsarSaudacaoHorarioWhatsApp?: boolean;
  themePreset?: string;
  primaryColor?: string;
  secondaryColor?: string;
  gradientEnabled?: boolean;
  template?: 'modelo1' | 'modelo2';
  modoAcao?: 'agendamento' | 'whatsapp';
  usado: boolean;
  resgatadoPorEmail?: string;
  resgatadoPorUid?: string;
  dataResgate?: string;
  criadoEm: string;
  criadoPorAdmin?: string;
}

export interface VitrineHorarioHoje {
  ativo: boolean; // se o status especial de hoje está ativo
  status: 'atendendo' | 'nao_atende';
  inicio?: string; // ex: '09:00' ou '14:00'
  fim?: string; // ex: '18:00' ou '20:00'
  temIntervalo?: boolean;
  intervaloInicio?: string; // ex: '12:00'
  intervaloFim?: string; // ex: '14:00'
  proximoAtendimento?: string; // ex: 'Amanhã, das 09:00 às 18:00'
  mensagem?: string; // aviso rápido opcional
  dataAtualizacao?: string; // data em que foi publicado (ex: '2026-08-20')
}

export function safeEncodeURIComponent(val: string = ''): string {
  if (!val) return '';
  try {
    const sanitized = String(val).replace(
      /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g,
      ''
    );
    return encodeURIComponent(sanitized);
  } catch (_) {
    try {
      return encodeURI(String(val));
    } catch (_) {
      return String(val)
        .replace(/&/g, '%26')
        .replace(/\+/g, '%2B')
        .replace(/#/g, '%23')
        .replace(/\s/g, '%20');
    }
  }
}

export function safeDecodeURIComponent(val: string = ''): string {
  if (!val) return '';
  try {
    return decodeURIComponent(String(val));
  } catch (_) {
    try {
      return decodeURI(String(val));
    } catch (_) {
      return String(val);
    }
  }
}


