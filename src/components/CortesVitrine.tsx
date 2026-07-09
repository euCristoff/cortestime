import React, { useState } from 'react';
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
  Copy
} from 'lucide-react';
import { MerchantUser, Service } from '../types';
import { firebaseService } from '../services/firebaseService';
import MercadoPagoCheckout from './MercadoPagoCheckout';

interface CortesVitrineProps {
  merchant: MerchantUser;
  services: Service[];
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

export default function CortesVitrine({ 
  merchant, 
  services, 
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
  const [instagram, setInstagram] = useState(merchant.vitrineInstagram || '@cortestime_barber');
  const [linkBio, setLinkBio] = useState(merchant.vitrineLinkBio || 'instagram.com/cortestime_barber');
  const [logoText, setLogoText] = useState(merchant.vitrineLogo || merchant.nomeBarbearia || 'Cortes Vitrine');
  const [slogan, setSlogan] = useState(merchant.vitrineSlogan || 'Corte, Barba & Estilo de Alto Padrão');
  const [capa, setCapa] = useState(merchant.vitrineCapa || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&auto=format&fit=crop&q=80');
  const [linkPersonalizado, setLinkPersonalizado] = useState(merchant.vitrineLinkPersonalizado || merchant.nomeBarbearia.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase());
  
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

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showUpgradePlans, setShowUpgradePlans] = useState(false);
  const [subscribingPlan, setSubscribingPlan] = useState<string | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<{ name: string; price: number } | null>(null);

  const [downgradeNotice, setDowngradeNotice] = useState<string | null>(() => {
    return localStorage.getItem('cortestime_downgrade_notice');
  });

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
      const dataToUpdate: Partial<MerchantUser> = {
        vitrineHorarios: horarios,
        vitrineLocalizacao: localizacao,
        vitrineWhatsApp: whatsapp,
        vitrineInstagram: instagram,
        vitrineLinkBio: linkBio,
        vitrineLogo: logoText,
        vitrineSlogan: slogan,
        vitrineCapa: capa,
        vitrineLinkPersonalizado: linkPersonalizado,
        vitrineProdutos: products,
        vitrineGaleria: gallery,
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
    } catch (e) {
      console.error('Error saving vitrine:', e);
      alert('Não foi possível salvar os dados. Verifique sua conexão com o Firebase.');
    } finally {
      setIsSaving(false);
    }
  };

  const formattedWhatsAppUrl = `https://wa.me/${whatsapp.replace(/\D/g, '') || '5582987243056'}`;
  const formattedInstagramUrl = instagram.startsWith('http') ? instagram : `https://instagram.com/${instagram.replace('@', '')}`;
  const bioLinkDisplay = linkBio.startsWith('http') ? linkBio : `https://${linkBio}`;

  // Custom QR Code link - Points to actual window.location.origin to be fully functional
  const cleanSlug = (linkPersonalizado || merchant.nomeBarbearia || 'barbearia')
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

  if (isPublicAccess) {
    return (
      <div className="min-h-screen bg-[#faf9f6] text-brand-dark flex flex-col items-center py-0 sm:py-8 px-0 sm:px-4 relative z-10">
        {/* Background visual glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-blue/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-blue/10 rounded-full blur-3xl -z-10" />

        <div className="w-full max-w-md bg-white sm:rounded-[40px] sm:shadow-2xl sm:border border-gray-100 flex flex-col min-h-screen sm:min-h-0 overflow-hidden relative">
          
          {/* Cover banner */}
          <div className="h-44 w-full relative overflow-hidden shrink-0">
            <img src={capa} alt="Capa" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            
            {onBack && (
              <button 
                onClick={onBack}
                className="absolute top-4 left-4 bg-black/40 backdrop-blur-md hover:bg-black/60 text-xs font-black text-white py-2 px-3.5 rounded-full transition-all flex items-center gap-1 cursor-pointer border border-white/10"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar</span>
              </button>
            )}
          </div>

          {/* Inner container */}
          <div className="p-6 pt-4 flex-1 flex flex-col text-left">
            
            {/* Profile Info */}
            <div className="text-center pb-6 border-b border-gray-100 -mt-14 relative z-10">
              <div className="w-20 h-20 rounded-full bg-[#051b42] text-[#bffd32] border-4 border-white flex items-center justify-center font-sans font-black text-2xl mx-auto shadow-md mb-3 overflow-hidden">
                {logoText.charAt(0).toUpperCase()}
              </div>
              <h2 className="font-sans font-extrabold text-xl tracking-tight text-[#051b42]">
                {logoText}
              </h2>
              {slogan && (
                <p className="text-xs text-gray-500 italic mt-1 font-medium max-w-[280px] mx-auto leading-relaxed">
                  "{slogan}"
                </p>
              )}
              <span className="text-[10px] text-brand-blue font-bold uppercase tracking-widest mt-3.5 bg-brand-blue/5 inline-block px-3 py-1 rounded-full">
                Vitrine Digital Oficial ✂️
              </span>
            </div>

            {/* Operational details */}
            <div className="py-5 space-y-4 border-b border-gray-100">
              <div className="flex gap-3 items-start text-xs text-gray-600">
                <Clock className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Nossos Horários</p>
                  <p className="font-semibold text-brand-dark mt-0.5">{horarios}</p>
                </div>
              </div>

              <div className="flex gap-3 items-start text-xs text-gray-600">
                <MapPin className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Endereço</p>
                  <p className="font-semibold text-brand-dark mt-0.5">{localizacao}</p>
                </div>
              </div>
            </div>

            {/* Services listing */}
            <div className="py-6 border-b border-gray-100">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                Tabela de Serviços & Preços
              </h4>
              <div className="space-y-3.5">
                {services.length === 0 ? (
                  <p className="text-xs text-gray-400">Nenhum serviço cadastrado.</p>
                ) : (
                  services.map(s => (
                    <div key={s.id} className="flex justify-between items-center text-xs">
                      <span className="font-bold text-brand-dark truncate pr-2">{s.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-gray-400">{s.durationMin}min</span>
                        <span className="font-mono font-bold text-brand-blue bg-brand-blue/5 px-2.5 py-1 rounded-lg">R$ {s.price.toFixed(0)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Products Showcase */}
            {products.length > 0 && (
              <div className="py-6 border-b border-gray-100">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                  Produtos Recomendados
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {products.map(p => (
                    <div key={p.id} className="bg-gray-50/50 p-3 rounded-2xl border border-gray-100 flex flex-col justify-between">
                      <div>
                        <p className="text-xs font-bold text-brand-dark leading-snug line-clamp-2">{p.name}</p>
                      </div>
                      <p className="text-xs font-mono font-bold text-brand-blue mt-2.5">R$ {p.price.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio Gallery */}
            {gallery.length > 0 && (
              <div className="py-6 border-b border-gray-100">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5 text-brand-blue" />
                  <span>Nosso Portfólio</span>
                </h4>
                <div className="grid grid-cols-2 gap-2.5">
                  {gallery.map((img, idx) => (
                    <div key={idx} className="aspect-square rounded-2xl overflow-hidden bg-gray-100">
                      <img src={img} alt="Corte" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact shortcuts */}
            <div className="py-6 space-y-3">
              {onBookOnline && (
                <button 
                  onClick={onBookOnline}
                  className="w-full bg-[#051b42] text-white font-black py-4 rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#072456] transition-colors cursor-pointer shadow-lg shadow-[#051b42]/10"
                >
                  <Sparkles className="w-4 h-4 text-brand-lime animate-pulse" />
                  <span>Agendar Online (Cortestime)</span>
                </button>
              )}

              <a 
                href={formattedWhatsAppUrl} 
                target="_blank" 
                rel="noreferrer"
                className="w-full bg-[#10b981] text-white font-extrabold py-4 rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#0d9f6e] transition-colors"
              >
                <MessageSquare className="w-4 h-4 fill-current" />
                <span>Agendar via WhatsApp</span>
              </a>

              <div className="grid grid-cols-2 gap-2.5">
                <a 
                  href={formattedInstagramUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="bg-white text-brand-dark border border-gray-200 font-extrabold py-3 rounded-xl text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                  <span>Instagram</span>
                </a>
                <a 
                  href={bioLinkDisplay} 
                  target="_blank" 
                  rel="noreferrer"
                  className="bg-white text-brand-dark border border-gray-200 font-extrabold py-3 rounded-xl text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Link da Bio</span>
                </a>
              </div>
            </div>

            {/* Branding badge */}
            <div className="text-center py-4 text-[10px] text-gray-400 font-medium">
              Desenvolvido por <strong className="text-brand-blue">Cortestime Vitrine</strong>
            </div>

          </div>
        </div>
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
                    ? 'Seu período de teste de 3 dias do Cortestime Pro chegou ao fim. Para que você continue divulgando seus serviços, sua conta foi alterada automaticamente para o plano gratuito Cortes Vitrine.' 
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
          <div className="bg-[#09224f] p-1 rounded-2xl border border-white/10 flex gap-1">
            <button
              onClick={() => setActiveSubTab('editor')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeSubTab === 'editor' 
                  ? 'bg-brand-lime text-brand-dark shadow-md' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Editar Informações
            </button>
            <button
              onClick={() => setActiveSubTab('preview')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeSubTab === 'preview' 
                  ? 'bg-brand-lime text-brand-dark shadow-md' 
                  : 'text-gray-400 hover:text-white'
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
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Logo / Nome de Exibição</label>
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

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Foto de Capa (URL)</label>
                <input 
                  type="text" 
                  value={capa}
                  onChange={e => setCapa(e.target.value)}
                  placeholder="Link de uma imagem bonita do Unsplash ou outra fonte"
                  className="w-full bg-[#051b42] text-white border border-white/10 rounded-2xl p-4 text-xs font-medium focus:outline-none focus:border-brand-lime transition-all"
                />
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
          <div className={`lg:col-span-5 ${activeSubTab === 'preview' ? 'block' : 'hidden lg:block'}`}>
            <div className="sticky top-28 flex flex-col items-center">
              
              <span className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-3 flex items-center gap-1">
                <span>📱 Celular do Cliente (Visualização Real)</span>
              </span>

              {/* PHONE FRAME */}
              <div className="w-[320px] h-[640px] bg-black rounded-[40px] p-3 shadow-2xl border-4 border-[#12284f] relative overflow-hidden flex flex-col">
                
                {/* Speaker top notch */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-b-2xl z-50 flex justify-center items-start">
                  <div className="w-12 h-1 bg-gray-800 rounded-full mt-1.5" />
                </div>

                {/* Inner screen content */}
                <div className="flex-1 bg-[#faf9f6] rounded-[30px] overflow-y-auto text-brand-dark flex flex-col p-4 pt-4 relative scrollbar-none">
                  
                  {/* Cover banner */}
                  <div className="h-24 w-full relative rounded-t-[20px] -mt-4 -mx-4 overflow-hidden shrink-0">
                    <img src={capa} alt="Capa" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>

                  {/* Profile Info */}
                  <div className="text-center pb-6 border-b border-gray-200 -mt-8 relative z-10">
                    <div className="w-16 h-16 rounded-full bg-[#051b42] text-[#bffd32] border-2 border-[#faf9f6] flex items-center justify-center font-sans font-black text-xl mx-auto shadow-md mb-2 overflow-hidden">
                      {logoText.charAt(0).toUpperCase()}
                    </div>
                    <h2 className="font-sans font-extrabold text-base tracking-tight text-[#051b42]">
                      {logoText}
                    </h2>
                    {slogan && (
                      <p className="text-[11px] text-gray-500 italic mt-1 font-medium max-w-[220px] mx-auto leading-tight">
                        "{slogan}"
                      </p>
                    )}
                    <p className="text-[9px] text-brand-blue font-bold uppercase tracking-widest mt-2 bg-brand-blue/5 inline-block px-2.5 py-0.5 rounded-full">
                      Vitrine Digital ✂️
                    </p>
                  </div>

                  {/* Operational details */}
                  <div className="py-4 space-y-3.5 border-b border-gray-100 text-left">
                    <div className="flex gap-2.5 items-start text-xs text-gray-600">
                      <Clock className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Nossos Horários</p>
                        <p className="font-medium text-brand-dark mt-0.5">{horarios}</p>
                      </div>
                    </div>

                    <div className="flex gap-2.5 items-start text-xs text-gray-600">
                      <MapPin className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-[10px] text-gray-400 uppercase tracking-wider">Endereço</p>
                        <p className="font-medium text-brand-dark mt-0.5">{localizacao}</p>
                      </div>
                    </div>
                  </div>

                  {/* Services listing */}
                  <div className="py-5 border-b border-gray-100 text-left">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3.5">
                      Tabela de Serviços & Preços
                    </h4>
                    <div className="space-y-3">
                      {services.length === 0 ? (
                        <p className="text-xs text-gray-400">Nenhum serviço cadastrado.</p>
                      ) : (
                        services.map(s => (
                          <div key={s.id} className="flex justify-between items-center text-xs">
                            <span className="font-bold text-brand-dark truncate pr-2">{s.name}</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] text-gray-400">{s.durationMin}min</span>
                              <span className="font-mono font-bold text-brand-blue bg-brand-blue/5 px-2 py-0.5 rounded-lg">R$ {s.price.toFixed(0)}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Products Showcase */}
                  <div className="py-5 border-b border-gray-100 text-left">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3.5">
                      Produtos Recomendados
                    </h4>
                    <div className="grid grid-cols-2 gap-2.5">
                      {products.map(p => (
                        <div key={p.id} className="bg-white p-2.5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
                          <div>
                            <p className="text-[11px] font-bold text-brand-dark leading-snug line-clamp-2">{p.name}</p>
                          </div>
                          <p className="text-xs font-mono font-bold text-brand-blue mt-2">R$ {p.price.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Portfolio Gallery */}
                  <div className="py-5 border-b border-gray-100 text-left">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5 text-brand-blue" />
                      <span>Nosso Portfólio</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {gallery.map((img, idx) => (
                        <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                          <img src={img} alt="Corte" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Contact shortcuts */}
                  <div className="py-5 space-y-2.5">
                    <a 
                      href={formattedWhatsAppUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="w-full bg-[#10b981] text-white font-extrabold py-3.5 rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4 fill-current" />
                      <span>Agendar via WhatsApp</span>
                    </a>

                    <div className="grid grid-cols-2 gap-2">
                      <a 
                        href={formattedInstagramUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="bg-white text-brand-dark border border-gray-200 font-extrabold py-3 rounded-xl text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors"
                      >
                        <Instagram className="w-4 h-4" />
                        <span>Instagram</span>
                      </a>
                      <a 
                        href={bioLinkDisplay} 
                        target="_blank" 
                        rel="noreferrer"
                        className="bg-white text-brand-dark border border-gray-200 font-extrabold py-3 rounded-xl text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Link da Bio</span>
                      </a>
                    </div>
                  </div>

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
          <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#051b42] border border-white/10 rounded-3xl p-6 md:p-8 max-w-4xl w-full text-center space-y-6 shadow-2xl relative my-8"
            >
              <button 
                onClick={() => setShowUpgradePlans(false)}
                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white cursor-pointer text-xl font-bold"
              >
                &times;
              </button>

              <div className="space-y-2">
                <span className="bg-amber-500/25 text-amber-400 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border border-amber-400/25">
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

    </div>
  );
}
