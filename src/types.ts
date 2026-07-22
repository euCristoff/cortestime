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
  email: string;
  businessName: string;
  objectives: string[];
  cep: string;
  neighborhood: string;
  street: string;
  number: string;
  complement: string;
}

export interface MerchantUser {
  uid: string;
  nomeBarbearia: string;
  nomeProprietario: string;
  email: string;
  whatsapp: string;
  plano: 'vitrine' | 'pro_trial' | 'pro' | 'trial';
  trialInicio: string; // DD/MM/YYYY
  trialFim: string; // DD/MM/YYYY
  status: 'ativo' | 'suspenso' | 'expirado';
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
  vitrineSlogan?: string;
  vitrineCapa?: string;
  vitrineLinkPersonalizado?: string;
  vitrineHorarios?: string;
  vitrineLocalizacao?: string;
  vitrineWhatsApp?: string;
  vitrineInstagram?: string;
  vitrineLinkBio?: string;
  vitrineProdutos?: { id: string; name: string; price: number; imageUrl?: string }[];
  vitrineGaleria?: string[];
}

