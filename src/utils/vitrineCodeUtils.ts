import { MerchantUser, DraftVitrine } from '../types';

/**
 * Returns a clean, deterministic, shareable code for any vitrine/merchant.
 */
export function getVitrineCode(merchant?: Partial<MerchantUser> | null, draft?: Partial<DraftVitrine> | null): string {
  if (draft?.codigo && draft.codigo.trim()) {
    return draft.codigo.trim().toUpperCase();
  }
  if (merchant?.codigoConviteResgatado && merchant.codigoConviteResgatado.trim()) {
    return merchant.codigoConviteResgatado.trim().toUpperCase();
  }
  if (merchant?.codigo && merchant.codigo.trim()) {
    return merchant.codigo.trim().toUpperCase();
  }
  if (merchant?.codigoVitrine && merchant.codigoVitrine.trim()) {
    return merchant.codigoVitrine.trim().toUpperCase();
  }
  
  // Deterministic clean code derived from UID or id or business name
  const rawId = merchant?.uid || merchant?.id || (merchant as any)?.draftId || '';
  if (rawId) {
    const clean = String(rawId).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (clean.length >= 5) {
      return `BARBER-${clean.slice(-5)}`;
    }
  }
  const rawName = merchant?.nomeBarbearia || merchant?.vitrineLogo || 'CORTES';
  const cleanName = String(rawName).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return `BARBER-${(cleanName + '7XK29').slice(0, 5)}`;
}

/**
 * Converts any MerchantUser profile into a DraftVitrine structure
 * for seamless cloning and code redemption across accounts.
 */
export function merchantToDraftVitrine(m: MerchantUser, customCode?: string): DraftVitrine {
  const code = customCode || getVitrineCode(m);
  const logo = m.vitrineLogoImage || '';
  const capa = m.vitrineCapa || '';
  const gal = (m.vitrineGaleria && m.vitrineGaleria.length > 0) 
    ? m.vitrineGaleria 
    : (m.galeria || []);
  const servs = (m.servicos && m.servicos.length > 0)
    ? m.servicos.map((s, idx) => ({ 
        id: s.id || `p-${idx}`, 
        name: s.name, 
        price: typeof s.price === 'number' ? s.price : (parseFloat(s.price as any) || 0), 
        durationMin: s.durationMin || 30 
      }))
    : (m.vitrineProdutos && m.vitrineProdutos.length > 0)
    ? m.vitrineProdutos.map((s: any, idx: number) => ({ 
        id: s.id || `p-${idx}`, 
        name: s.name, 
        price: typeof s.price === 'number' ? s.price : (parseFloat(s.price as any) || 0), 
        durationMin: s.durationMin || 30 
      }))
    : [];

  const enderecoStr = (typeof m.vitrineEndereco === 'string' && m.vitrineEndereco.trim())
    ? m.vitrineEndereco.trim()
    : (typeof m.vitrineLocalizacao === 'string' && m.vitrineLocalizacao.trim())
    ? m.vitrineLocalizacao.trim()
    : (typeof m.endereco === 'string' && m.endereco.trim())
    ? m.endereco.trim()
    : '';

  return {
    id: m.uid || `merchant_${code}`,
    codigo: code,
    nomeBarbearia: m.nomeBarbearia || m.vitrineLogo || 'Barbearia',
    nomeProprietario: m.nomeProprietario || 'Barbeiro',
    whatsapp: m.vitrineWhatsApp || m.whatsapp || '',
    instagram: m.vitrineInstagram || '',
    endereco: enderecoStr,
    slogan: m.vitrineSlogan || '',
    horarios: m.vitrineHorarios || m.horarios || 'Segunda a Sábado: 09:00 às 19:00',
    logoUrl: logo,
    capaUrl: capa,
    themePreset: m.vitrineThemePreset || 'cortestime',
    primaryColor: m.vitrinePrimaryColor || '#051b42',
    secondaryColor: m.vitrineSecondaryColor || '#2563eb',
    gradientEnabled: m.vitrineGradientEnabled ?? true,
    template: m.vitrineTemplate || 'modelo1',
    modoAcao: m.vitrineModoAcao || 'agendamento',
    barbeiroUnico: m.vitrineBarbeiroUnico ?? m.barbeiroUnico ?? true,
    servicos: servs,
    galeria: gal,
    vitrineHorarioHoje: m.vitrineHorarioHoje,
    vitrinePermitirAgendamentoWhatsApp: m.vitrinePermitirAgendamentoWhatsApp ?? true,
    vitrineMensagemWhatsAppAgendamento: m.vitrineMensagemWhatsAppAgendamento || m.mensagemWhatsAppAgendamento || '',
    vitrineMensagemWhatsAppOrdemChegada: m.vitrineMensagemWhatsAppOrdemChegada || m.mensagemWhatsAppOrdemChegada || '',
    vitrineMensagemWhatsAppPersonalizada: m.vitrineMensagemWhatsAppPersonalizada || m.mensagemWhatsAppPersonalizada || '',
    criadoEm: m.criadoEm || new Date().toISOString(),
    usado: false
  };
}
