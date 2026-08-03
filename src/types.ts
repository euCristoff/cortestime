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
  barberId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  isWaitlist?: boolean;
}

export interface OnboardingData {
  fullName: string;
  cellphone: string;
  whatsapp?: string;
  email: string;
  businessName: string;
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
  vitrineInstagram?: string;
  vitrineFacebook?: string;
  vitrineLinkBio?: string;
  vitrineProdutos?: { id: string; name: string; price: number; imageUrl?: string }[];
  vitrineGaleria?: string[];
  
  // Invite code / Draft vitrine redemption fields
  codigoConviteResgatado?: string;
  vitrineDraftResgatada?: boolean;
  draftJustClaimed?: boolean;
  indicacoesHistorico?: { id?: string; barbeariaName: string; data: string; status: string; statusTipo: 'ativado' | 'pendente' }[];

  // Partner Campaign fields
  isPartner?: boolean;
  hasPartnerBadge?: boolean; // ⭐ Barbearia Indicada (permanente)
  partnerBenefitsExpiry?: string; // Expiration date for 30-day gallery and reviews
  partnerStoryConfirmed?: boolean;
  partnerWelcomeShown?: boolean;

  // PWA / App Installation tracking
  appInstalled?: boolean;
  installRemindersDismissed?: boolean;
}

export interface DraftVitrine {
  id: string;
  codigo: string; // e.g. "BARBER-7XK29"
  nomeBarbearia: string;
  nomeProprietario?: string;
  whatsapp?: string;
  instagram?: string;
  endereco?: string;
  slogan?: string;
  logoUrl?: string;
  capaUrl?: string;
  horarios?: string;
  servicos?: { name: string; price: number; durationMin: number }[];
  usado: boolean;
  resgatadoPorEmail?: string;
  resgatadoPorUid?: string;
  dataResgate?: string;
  criadoEm: string;
  criadoPorAdmin?: string;
}

