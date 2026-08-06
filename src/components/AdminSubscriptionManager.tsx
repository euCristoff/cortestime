import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Search, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Sparkles, 
  X, 
  RefreshCw, 
  Calendar, 
  MessageSquare, 
  DollarSign, 
  ChevronRight, 
  Lock,
  UserCheck,
  UserX,
  Plus,
  Ticket,
  Gift,
  Copy,
  Check,
  Trash2,
  Store,
  ExternalLink,
  Tag,
  Eye
} from 'lucide-react';
import { MerchantUser, DraftVitrine } from '../types';
import { firebaseService } from '../services/firebaseService';
import CortesVitrine from './CortesVitrine';

interface AdminSubscriptionManagerProps {
  currentAdmin: MerchantUser;
  onClose: () => void;
  onUpdateMerchant?: (updated: MerchantUser) => void;
}

export default function AdminSubscriptionManager({
  currentAdmin,
  onClose,
  onUpdateMerchant
}: AdminSubscriptionManagerProps) {
  const [adminTab, setAdminTab] = useState<'users' | 'drafts'>('users');
  const [merchants, setMerchants] = useState<MerchantUser[]>([]);
  const [draftVitrines, setDraftVitrines] = useState<DraftVitrine[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'todos' | 'pendentes' | 'pro' | 'trial' | 'vitrine'>('todos');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [previewDraft, setPreviewDraft] = useState<DraftVitrine | null>(null);

  // Draft Creation Modal state
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [draftNomeBarbearia, setDraftNomeBarbearia] = useState('');
  const [draftNomeProprietario, setDraftNomeProprietario] = useState('');
  const [draftWhatsapp, setDraftWhatsapp] = useState('');
  const [draftInstagram, setDraftInstagram] = useState('');
  const [draftEndereco, setDraftEndereco] = useState('');
  const [draftSlogan, setDraftSlogan] = useState('');
  const [draftHorarios, setDraftHorarios] = useState('Seg - Sáb: 08:00 às 20:00');
  const [draftCodigo, setDraftCodigo] = useState('');
  const [draftServicos, setDraftServicos] = useState<Array<{ name: string; price: number; durationMin: number }>>([
    { name: 'Corte de Cabelo', price: 40, durationMin: 30 },
    { name: 'Barba Alinhada', price: 30, durationMin: 25 },
    { name: 'Combo Cabelo + Barba', price: 60, durationMin: 45 }
  ]);

  // Temporary new service form for draft
  const [newSvcName, setNewSvcName] = useState('');
  const [newSvcPrice, setNewSvcPrice] = useState('');
  const [newSvcDuration, setNewSvcDuration] = useState('30');

  const loadData = async () => {
    setLoading(true);
    try {
      const [merchantsData, draftsData] = await Promise.all([
        firebaseService.getAllMerchants(),
        firebaseService.getAllDraftVitrines()
      ]);
      setMerchants(merchantsData);
      setDraftVitrines(draftsData);
    } catch (err) {
      console.error("Error loading admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatDate = (d: Date) => {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const handleActivatePro = async (merchant: MerchantUser, daysToAdd: number = 30) => {
    try {
      const today = new Date();
      const expiry = new Date();
      expiry.setDate(today.getDate() + daysToAdd);

      const updateData: Partial<MerchantUser> = {
        plano: 'pro',
        pagamentoPendente: false,
        dataExpiracaoAssinatura: formatDate(expiry),
        status: 'ativo'
      };

      await firebaseService.updateMerchantProfile(merchant.uid, updateData);
      
      const updatedList = merchants.map(m => m.uid === merchant.uid ? { ...m, ...updateData } : m);
      setMerchants(updatedList);
      
      if (currentAdmin.uid === merchant.uid && onUpdateMerchant) {
        onUpdateMerchant({ ...currentAdmin, ...updateData });
      }

      setActionSuccess(`Plano Pro ativado com sucesso para ${merchant.nomeBarbearia}! Válido até ${formatDate(expiry)}.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (e: any) {
      alert(`Erro ao ativar plano: ${e?.message || 'Tente novamente'}`);
    }
  };

  const handleRenewSubscription = async (merchant: MerchantUser, daysToAdd: number = 30) => {
    try {
      let baseDate = new Date();
      if (merchant.dataExpiracaoAssinatura) {
        const parts = merchant.dataExpiracaoAssinatura.split('/');
        if (parts.length === 3) {
          const parsed = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          if (!isNaN(parsed.getTime()) && parsed > baseDate) {
            baseDate = parsed;
          }
        }
      }

      baseDate.setDate(baseDate.getDate() + daysToAdd);
      const newExpiryStr = formatDate(baseDate);

      const updateData: Partial<MerchantUser> = {
        plano: 'pro',
        pagamentoPendente: false,
        dataExpiracaoAssinatura: newExpiryStr,
        status: 'ativo'
      };

      await firebaseService.updateMerchantProfile(merchant.uid, updateData);

      const updatedList = merchants.map(m => m.uid === merchant.uid ? { ...m, ...updateData } : m);
      setMerchants(updatedList);

      if (currentAdmin.uid === merchant.uid && onUpdateMerchant) {
        onUpdateMerchant({ ...currentAdmin, ...updateData });
      }

      setActionSuccess(`Assinatura renovada para ${merchant.nomeBarbearia}! Nova data de expiração: ${newExpiryStr}.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (e: any) {
      alert(`Erro ao renovar assinatura: ${e?.message || 'Tente novamente'}`);
    }
  };

  const handleCancelSubscription = async (merchant: MerchantUser) => {
    if (!confirm(`Tem certeza que deseja cancelar o plano Pro da barbearia "${merchant.nomeBarbearia}" e retornar ao plano gratuito Cortes Vitrine?`)) {
      return;
    }

    try {
      const updateData: Partial<MerchantUser> = {
        plano: 'vitrine',
        pagamentoPendente: false,
        dataExpiracaoAssinatura: undefined
      };

      await firebaseService.updateMerchantProfile(merchant.uid, updateData);

      const updatedList = merchants.map(m => m.uid === merchant.uid ? { ...m, ...updateData } : m);
      setMerchants(updatedList);

      if (currentAdmin.uid === merchant.uid && onUpdateMerchant) {
        onUpdateMerchant({ ...currentAdmin, ...updateData });
      }

      setActionSuccess(`Plano de ${merchant.nomeBarbearia} alterado para Cortes Vitrine (Gratuito).`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (e: any) {
      alert(`Erro ao cancelar assinatura: ${e?.message || 'Tente novamente'}`);
    }
  };

  const handleExtendTrial = async (merchant: MerchantUser, daysToAdd: number = 7) => {
    try {
      let baseDate = new Date();
      if (merchant.trialFim) {
        const parts = merchant.trialFim.split('/');
        if (parts.length === 3) {
          const parsed = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
          if (!isNaN(parsed.getTime()) && parsed > baseDate) {
            baseDate = parsed;
          }
        }
      }

      baseDate.setDate(baseDate.getDate() + daysToAdd);
      const newTrialFim = formatDate(baseDate);

      const updateData: Partial<MerchantUser> = {
        plano: 'pro_trial',
        trialFim: newTrialFim
      };

      await firebaseService.updateMerchantProfile(merchant.uid, updateData);

      const updatedList = merchants.map(m => m.uid === merchant.uid ? { ...m, ...updateData } : m);
      setMerchants(updatedList);

      setActionSuccess(`Teste grátis de ${merchant.nomeBarbearia} estendido até ${newTrialFim}!`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (e: any) {
      alert(`Erro ao extender teste: ${e?.message || 'Tente novamente'}`);
    }
  };

  // Draft Vitrine Handlers
  const handleGenerateCode = () => {
    const prefixes = ['BARBER', 'CORTES', 'PREMIUM', 'STYLE', 'STUDIO'];
    const pfx = prefixes[Math.floor(Math.random() * prefixes.length)];
    const rnd = Math.random().toString(36).substring(2, 7).toUpperCase();
    setDraftCodigo(`${pfx}-${rnd}`);
  };

  const handleAddDraftService = () => {
    if (!newSvcName.trim()) return;
    setDraftServicos(prev => [
      ...prev,
      {
        name: newSvcName.trim(),
        price: parseFloat(newSvcPrice) || 0,
        durationMin: parseInt(newSvcDuration) || 30
      }
    ]);
    setNewSvcName('');
    setNewSvcPrice('');
  };

  const handleRemoveDraftService = (index: number) => {
    setDraftServicos(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateDraftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftNomeBarbearia.trim()) {
      alert("Por favor, informe o Nome da Barbearia.");
      return;
    }

    try {
      const finalCode = draftCodigo.trim() 
        ? draftCodigo.trim().toUpperCase() 
        : `BARBER-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

      const newDraft = await firebaseService.createDraftVitrine({
        codigo: finalCode,
        nomeBarbearia: draftNomeBarbearia,
        nomeProprietario: draftNomeProprietario,
        whatsapp: draftWhatsapp,
        instagram: draftInstagram,
        endereco: draftEndereco,
        slogan: draftSlogan,
        horarios: draftHorarios,
        servicos: draftServicos,
        criadoPorAdmin: currentAdmin.email
      });

      setDraftVitrines(prev => [newDraft, ...prev.filter(d => d.codigo !== newDraft.codigo)]);
      setIsDraftModalOpen(false);
      setActionSuccess(`🎉 Vitrine Rascunho criada! Código gerado: ${newDraft.codigo}`);
      setTimeout(() => setActionSuccess(null), 4000);

      // Clear fields
      setDraftNomeBarbearia('');
      setDraftNomeProprietario('');
      setDraftWhatsapp('');
      setDraftInstagram('');
      setDraftEndereco('');
      setDraftSlogan('');
      setDraftCodigo('');
    } catch (err: any) {
      alert(`Erro ao criar vitrine rascunho: ${err?.message || 'Tente novamente'}`);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDeleteDraft = async (draft: DraftVitrine) => {
    if (!confirm(`Tem certeza que deseja excluir o código "${draft.codigo}" (${draft.nomeBarbearia})?`)) return;
    try {
      await firebaseService.deleteDraftVitrine(draft.id, draft.codigo);
      setDraftVitrines(prev => prev.filter(d => d.id !== draft.id && d.codigo !== draft.codigo));
      setActionSuccess(`Código ${draft.codigo} removido com sucesso.`);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (e: any) {
      alert("Erro ao remover código rascunho.");
    }
  };

  const filteredMerchants = merchants.filter(m => {
    const term = search.toLowerCase();
    const matchesSearch = 
      (m.nomeBarbearia || '').toLowerCase().includes(term) ||
      (m.nomeProprietario || '').toLowerCase().includes(term) ||
      (m.email || '').toLowerCase().includes(term) ||
      (m.whatsapp || '').includes(term);

    if (!matchesSearch) return false;

    if (filter === 'pendentes') return m.pagamentoPendente === true;
    if (filter === 'pro') return m.plano === 'pro';
    if (filter === 'trial') return m.plano === 'pro_trial' || m.plano === 'trial';
    if (filter === 'vitrine') return m.plano === 'vitrine';
    return true;
  });

  const filteredDrafts = draftVitrines.filter(d => {
    const term = search.toLowerCase();
    return (
      (d.codigo || '').toLowerCase().includes(term) ||
      (d.nomeBarbearia || '').toLowerCase().includes(term) ||
      (d.nomeProprietario || '').toLowerCase().includes(term) ||
      (d.resgatadoPorEmail || '').toLowerCase().includes(term)
    );
  });

  const totalUsers = merchants.length;
  const totalPro = merchants.filter(m => m.plano === 'pro').length;
  const totalTrial = merchants.filter(m => m.plano === 'pro_trial' || m.plano === 'trial').length;
  const totalPendentes = merchants.filter(m => m.pagamentoPendente === true).length;
  const totalDraftsPending = draftVitrines.filter(d => !d.usado).length;

  return (
    <div className="fixed inset-0 z-50 bg-[#051b42]/90 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -10 }}
        className="bg-white rounded-[32px] max-w-5xl w-full p-6 md:p-8 shadow-2xl relative space-y-6 my-auto text-left max-h-[92vh] flex flex-col border border-gray-100"
      >
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-gray-100 shrink-0">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 bg-brand-blue/10 text-brand-blue px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border border-brand-blue/20">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-blue" />
              <span>Painel do Administrador (SuperAdmin)</span>
            </div>
            <h2 className="font-display font-extrabold text-2xl text-brand-dark">
              Gestão de Assinaturas & Vitrines Pré-Criadas
            </h2>
            <p className="text-xs text-gray-500">
              Gerencie usuários, ative planos Pro ou crie Vitrines Rascunho com códigos de convite para novas barbearias.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Atualizar dados"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-brand-dark transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TABS SELECTOR */}
        <div className="flex border-b border-gray-100 shrink-0 gap-6">
          <button
            onClick={() => setAdminTab('users')}
            className={`pb-3 text-xs md:text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              adminTab === 'users'
                ? 'border-brand-blue text-brand-blue'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Assinaturas & Usuários ({totalUsers})</span>
          </button>

          <button
            onClick={() => setAdminTab('drafts')}
            className={`pb-3 text-xs md:text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              adminTab === 'drafts'
                ? 'border-brand-blue text-brand-blue'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Ticket className="w-4 h-4 text-brand-blue" />
            <span>Vitrines Pré-Criadas ({draftVitrines.length})</span>
            {totalDraftsPending > 0 && (
              <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.2 rounded-full">
                {totalDraftsPending} disponíveis
              </span>
            )}
          </button>
        </div>

        {/* NOTIFICATION FEEDBACK */}
        {actionSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="bg-emerald-500/15 border border-emerald-500/30 p-4 rounded-2xl text-xs text-emerald-800 font-bold flex items-center gap-2.5 shrink-0"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </motion.div>
        )}

        {/* TAB 1: USER SUBSCRIPTIONS */}
        {adminTab === 'users' && (
          <>
            {/* STATS CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
              <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-gray-400">Total Usuários</span>
                <div className="text-xl font-extrabold text-brand-dark">{totalUsers}</div>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-600">Planos Pro Ativos</span>
                <div className="text-xl font-extrabold text-emerald-700">{totalPro}</div>
              </div>
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-blue-600">Em Teste Grátis</span>
                <div className="text-xl font-extrabold text-blue-700">{totalTrial}</div>
              </div>
              <div className={`p-4 rounded-2xl space-y-1 border transition-all ${
                totalPendentes > 0 
                  ? 'bg-amber-500/10 border-amber-400/50 text-amber-900 animate-pulse' 
                  : 'bg-gray-50 border-gray-100 text-gray-500'
              }`}>
                <span className="text-[10px] uppercase font-bold flex items-center gap-1">
                  {totalPendentes > 0 && <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />}
                  <span>Pix Pendentes</span>
                </span>
                <div className={`text-xl font-extrabold ${totalPendentes > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                  {totalPendentes}
                </div>
              </div>
            </div>

            {/* FILTERS AND SEARCH */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between shrink-0">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Buscar por barbearia, email, whatsapp..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-brand-blue outline-none transition-all"
                />
              </div>

              <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto text-[11px] font-bold">
                <button 
                  onClick={() => setFilter('todos')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${filter === 'todos' ? 'bg-white text-brand-dark shadow-sm' : 'text-gray-500 hover:text-brand-dark'}`}
                >
                  Todos ({totalUsers})
                </button>
                <button 
                  onClick={() => setFilter('pendentes')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${filter === 'pendentes' ? 'bg-amber-500 text-white shadow-sm' : 'text-amber-600 hover:bg-amber-50'}`}
                >
                  <span>⚡ Pix Pendentes</span>
                  {totalPendentes > 0 && <span className="bg-white/30 px-1.5 py-0.2 rounded-full text-[9px]">{totalPendentes}</span>}
                </button>
                <button 
                  onClick={() => setFilter('pro')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${filter === 'pro' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:text-brand-dark'}`}
                >
                  Pro 💎 ({totalPro})
                </button>
                <button 
                  onClick={() => setFilter('trial')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${filter === 'trial' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-brand-dark'}`}
                >
                  Teste ⏳ ({totalTrial})
                </button>
                <button 
                  onClick={() => setFilter('vitrine')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${filter === 'vitrine' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-500 hover:text-brand-dark'}`}
                >
                  Gratuitos ⚪
                </button>
              </div>
            </div>

            {/* USER LIST TABLE */}
            <div className="overflow-y-auto flex-1 border border-gray-100 rounded-2xl">
              {loading ? (
                <div className="py-16 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-brand-blue animate-spin mx-auto" />
                  <p className="text-xs text-gray-400 font-medium">Carregando lista de barbeiros cadastrados...</p>
                </div>
              ) : filteredMerchants.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <Users className="w-10 h-10 text-gray-300 mx-auto" />
                  <p className="text-sm font-bold text-gray-600">Nenhum barbeiro encontrado</p>
                  <p className="text-xs text-gray-400">Tente ajustar o termo de busca ou filtro selecionado.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredMerchants.map((merchant) => {
                    const isPro = merchant.plano === 'pro';
                    const isTrial = merchant.plano === 'pro_trial' || merchant.plano === 'trial';
                    const isPendingPix = merchant.pagamentoPendente === true;

                    return (
                      <div 
                        key={merchant.uid} 
                        className={`p-4 hover:bg-gray-50/80 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                          isPendingPix ? 'bg-amber-50/40 border-l-4 border-amber-500' : ''
                        }`}
                      >
                        {/* MERCHANT INFO */}
                        <div className="space-y-1.5 max-w-md">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-sm text-brand-dark">
                              {merchant.nomeBarbearia || 'Barbearia sem nome'}
                            </span>
                            
                            {/* PLAN BADGES */}
                            {isPro && (
                              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-md uppercase">
                                PRO 💎
                              </span>
                            )}
                            {isTrial && (
                              <span className="bg-blue-100 text-blue-800 border border-blue-300 text-[10px] font-black px-2 py-0.5 rounded-md uppercase">
                                Teste Grátis ⏳
                              </span>
                            )}
                            {!isPro && !isTrial && (
                              <span className="bg-gray-100 text-gray-600 border border-gray-200 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                                Gratuito (Vitrine)
                              </span>
                            )}

                            {/* PENDING PIX ALERT */}
                            {isPendingPix && (
                              <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider animate-pulse flex items-center gap-1">
                                <span>⚡ Pix Informado</span>
                              </span>
                            )}

                            {merchant.codigoConviteResgatado && (
                              <span className="bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Ticket className="w-3 h-3 text-purple-600" />
                                <span>Código: {merchant.codigoConviteResgatado}</span>
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-gray-500 space-y-0.5">
                            <p><strong className="text-gray-700">Proprietário:</strong> {merchant.nomeProprietario || 'Não informado'}</p>
                            <p className="flex items-center gap-3 text-[11px] text-gray-400">
                              <span>Email: {merchant.email}</span>
                              {merchant.whatsapp && (
                                <a 
                                  href={`https://wa.me/55${merchant.whatsapp.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-emerald-600 hover:underline flex items-center gap-1 font-bold"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                  <span>{merchant.whatsapp}</span>
                                </a>
                              )}
                            </p>
                          </div>

                          {/* EXPIRATION / TRIAL INFO */}
                          <div className="text-[11px] text-gray-500 flex items-center gap-2 pt-0.5">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            {isPro && merchant.dataExpiracaoAssinatura ? (
                              <span>Assinatura ativa até: <strong className="text-emerald-700">{merchant.dataExpiracaoAssinatura}</strong></span>
                            ) : isPro ? (
                              <span className="text-emerald-700 font-bold">Assinatura Pro Ativa (Sem expiração definida)</span>
                            ) : isTrial && merchant.trialFim ? (
                              <span>Teste grátis até: <strong className="text-blue-700">{merchant.trialFim}</strong></span>
                            ) : (
                              <span className="text-gray-400">Sem assinatura ativa</span>
                            )}
                          </div>
                        </div>

                        {/* ACTIONS BAR */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                          {/* 1. APPROVE/ACTIVATE PRO */}
                          {isPendingPix && (
                            <button
                              onClick={() => handleActivatePro(merchant, 30)}
                              className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer animate-bounce"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Aprovar Pix & Ativar Pro</span>
                            </button>
                          )}

                          {!isPro && !isPendingPix && (
                            <button
                              onClick={() => handleActivatePro(merchant, 30)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Ativar Pro (30d)</span>
                            </button>
                          )}

                          {/* 2. RENEW PRO */}
                          {isPro && (
                            <button
                              onClick={() => handleRenewSubscription(merchant, 30)}
                              className="bg-brand-blue hover:bg-brand-blue-light text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                              title="Adicionar +30 dias de assinatura"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Renovar (+30d)</span>
                            </button>
                          )}

                          {/* 3. EXTEND TRIAL */}
                          {isTrial && (
                            <button
                              onClick={() => handleExtendTrial(merchant, 7)}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>+7d Teste</span>
                            </button>
                          )}

                          {/* 4. CANCEL / MUTE TO FREE */}
                          {isPro && (
                            <button
                              onClick={() => handleCancelSubscription(merchant)}
                              className="bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 font-bold text-xs py-2 px-3 rounded-xl flex items-center gap-1 transition-all cursor-pointer border border-gray-200"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>Cancelar Pro</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* TAB 2: DRAFT VITRINES & CODES */}
        {adminTab === 'drafts' && (
          <>
            {/* ACTION BAR */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between shrink-0">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Buscar código ou nome da barbearia..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-brand-blue outline-none transition-all"
                />
              </div>

              <button
                onClick={() => {
                  handleGenerateCode();
                  setIsDraftModalOpen(true);
                }}
                className="w-full sm:w-auto bg-brand-blue hover:bg-brand-blue-light text-white font-bold py-2.5 px-5 rounded-xl shadow-md transition-all text-xs flex items-center justify-center gap-2 uppercase tracking-wider cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Criar Vitrine Rascunho</span>
              </button>
            </div>

            {/* DRAFT LIST */}
            <div className="overflow-y-auto flex-1 border border-gray-100 rounded-2xl">
              {loading ? (
                <div className="py-16 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-brand-blue animate-spin mx-auto" />
                  <p className="text-xs text-gray-400 font-medium">Carregando Vitrines Pré-Criadas...</p>
                </div>
              ) : filteredDrafts.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <Ticket className="w-10 h-10 text-gray-300 mx-auto" />
                  <p className="text-sm font-bold text-gray-600">Nenhuma Vitrine Rascunho encontrada</p>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">
                    Clique no botão acima para pré-criar uma Vitrine inicial e gerar um código de convite exclusivo para um cliente.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredDrafts.map((draft) => {
                    const isUsed = draft.usado === true;

                    return (
                      <div key={draft.id} className="p-4 hover:bg-gray-50/80 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        {/* CODE & BARBERSHOP DETAILS */}
                        <div className="space-y-2 max-w-md">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-mono font-black text-sm text-brand-blue bg-brand-blue/10 border border-brand-blue/20 px-3 py-1 rounded-xl tracking-wider flex items-center gap-1.5">
                              <Ticket className="w-3.5 h-3.5 text-brand-blue" />
                              <span>{draft.codigo}</span>
                            </span>

                            {isUsed ? (
                              <span className="bg-gray-100 text-gray-600 border border-gray-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-gray-500" /> Resgatado
                              </span>
                            ) : (
                              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-emerald-600" /> Aguardando Resgate
                              </span>
                            )}
                          </div>

                          <div className="space-y-1 text-xs">
                            <h4 className="font-extrabold text-brand-dark text-sm">
                              {draft.nomeBarbearia}
                            </h4>
                            <div className="text-gray-500 space-y-0.5 text-[11px]">
                              {draft.nomeProprietario && <p><strong>Proprietário:</strong> {draft.nomeProprietario}</p>}
                              {draft.whatsapp && <p><strong>WhatsApp:</strong> {draft.whatsapp}</p>}
                              {draft.instagram && <p><strong>Instagram:</strong> {draft.instagram}</p>}
                              {draft.endereco && <p><strong>Endereço:</strong> {draft.endereco}</p>}
                              {draft.servicos && draft.servicos.length > 0 && (
                                <p className="text-brand-blue font-semibold">
                                  {draft.servicos.length} serviços pré-configurados
                                </p>
                              )}
                            </div>
                          </div>

                          {/* CLAIM DETAILS IF USED */}
                          {isUsed && (
                            <div className="p-2 bg-gray-50 border border-gray-200 rounded-xl text-[11px] text-gray-600 space-y-0.5">
                              <p className="font-bold text-gray-700">Detalhes do Resgate:</p>
                              <p>Email: <span className="font-semibold text-brand-dark">{draft.resgatadoPorEmail || 'Não informado'}</span></p>
                              {draft.dataResgate && <p>Data: {new Date(draft.dataResgate).toLocaleString('pt-BR')}</p>}
                            </div>
                          )}
                        </div>

                        {/* ACTIONS */}
                        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                          {/* PREVIEW VITRINE BUTTON */}
                          <button
                            onClick={() => setPreviewDraft(draft)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs py-2 px-3 rounded-xl flex items-center gap-1.5 transition-all border border-gray-200 cursor-pointer"
                            title="Visualizar a Vitrine do Rascunho"
                          >
                            <Eye className="w-4 h-4 text-brand-blue" />
                            <span>Ver Vitrine</span>
                          </button>

                          {/* COPY CODE BUTTON */}
                          <button
                            onClick={() => handleCopyCode(draft.codigo)}
                            className="bg-brand-blue hover:bg-brand-blue-light text-white font-bold text-xs py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                          >
                            {copiedCode === draft.codigo ? (
                              <>
                                <Check className="w-4 h-4 text-brand-lime" />
                                <span>Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                <span>Copiar Código</span>
                              </>
                            )}
                          </button>

                          {/* DELETE DRAFT BUTTON */}
                          <button
                            onClick={() => handleDeleteDraft(draft)}
                            className="p-2 rounded-xl bg-gray-100 hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors cursor-pointer border border-gray-200"
                            title="Excluir Rascunho"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* MODAL TO CREATE DRAFT VITRINE */}
        {isDraftModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-auto text-left border border-gray-100 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-brand-blue/10 rounded-xl text-brand-blue">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-lg text-brand-dark">Criar Vitrine Rascunho</h3>
                    <p className="text-[11px] text-gray-500">Gere uma Vitrine pré-pronta com código de convite exclusivo</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsDraftModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateDraftSubmit} className="space-y-4 text-xs">
                {/* CODE GENERATOR FIELD */}
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Código Exclusivo de Convite</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Ticket className="w-4 h-4 absolute left-3 top-3 text-brand-blue" />
                      <input 
                        type="text" 
                        required
                        value={draftCodigo}
                        onChange={e => setDraftCodigo(e.target.value)}
                        placeholder="Ex: BARBER-7XK29"
                        className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono font-bold uppercase focus:bg-white focus:border-brand-blue outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerateCode}
                      className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors shrink-0"
                    >
                      Gerar Código
                    </button>
                  </div>
                </div>

                {/* BARBERSHOP NAME */}
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Nome da Barbearia *</label>
                  <input 
                    type="text" 
                    required
                    value={draftNomeBarbearia}
                    onChange={e => setDraftNomeBarbearia(e.target.value)}
                    placeholder="Ex: Barbearia Premium Club"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:border-brand-blue outline-none"
                  />
                </div>

                {/* PROPRIETARIO & WHATSAPP */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Nome Proprietário</label>
                    <input 
                      type="text" 
                      value={draftNomeProprietario}
                      onChange={e => setDraftNomeProprietario(e.target.value)}
                      placeholder="Ex: Ricardo Alves"
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:border-brand-blue outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">WhatsApp</label>
                    <input 
                      type="tel" 
                      value={draftWhatsapp}
                      onChange={e => setDraftWhatsapp(e.target.value)}
                      placeholder="Ex: (11) 98888-7777"
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:border-brand-blue outline-none"
                    />
                  </div>
                </div>

                {/* INSTAGRAM & ENDERECO */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Instagram</label>
                    <input 
                      type="text" 
                      value={draftInstagram}
                      onChange={e => setDraftInstagram(e.target.value)}
                      placeholder="Ex: @barbeariapremium"
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:border-brand-blue outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Endereço</label>
                    <input 
                      type="text" 
                      value={draftEndereco}
                      onChange={e => setDraftEndereco(e.target.value)}
                      placeholder="Ex: Av. Paulista, 1000"
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:border-brand-blue outline-none"
                    />
                  </div>
                </div>

                {/* SLOGAN & HORARIOS */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Slogan</label>
                    <input 
                      type="text" 
                      value={draftSlogan}
                      onChange={e => setDraftSlogan(e.target.value)}
                      placeholder="Ex: Estilo & Tradição"
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:border-brand-blue outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-gray-700">Horários</label>
                    <input 
                      type="text" 
                      value={draftHorarios}
                      onChange={e => setDraftHorarios(e.target.value)}
                      placeholder="Ex: Seg-Sáb: 08:00 - 20:00"
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:border-brand-blue outline-none"
                    />
                  </div>
                </div>

                {/* SERVICES PRE-CONFIGURATION */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-gray-700">Serviços Iniciais ({draftServicos.length})</label>
                  </div>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {draftServicos.map((svc, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded-xl border border-gray-200 text-[11px]">
                        <span className="font-bold text-gray-800">{svc.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-emerald-700">R$ {svc.price.toFixed(2)}</span>
                          <span className="text-gray-400">({svc.durationMin}min)</span>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveDraftService(idx)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ADD INLINE SERVICE */}
                  <div className="flex gap-2 pt-1">
                    <input 
                      type="text" 
                      placeholder="Nome do serviço" 
                      value={newSvcName}
                      onChange={e => setNewSvcName(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                    />
                    <input 
                      type="number" 
                      placeholder="R$" 
                      value={newSvcPrice}
                      onChange={e => setNewSvcPrice(e.target.value)}
                      className="w-16 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddDraftService}
                      className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 font-bold text-gray-700 rounded-lg text-xs"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* SUBMIT BUTTON */}
                <button 
                  type="submit"
                  className="w-full bg-brand-blue hover:bg-brand-blue-light text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-lg shadow-brand-blue/20 transition-all uppercase text-xs tracking-wider mt-3 flex justify-center items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-brand-lime" />
                  <span>Salvar Vitrine Rascunho & Gerar Código</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* MODAL TO PREVIEW DRAFT VITRINE */}
        {previewDraft && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-2 md:p-6">
            <div className="bg-brand-dark rounded-3xl w-full max-w-4xl h-[90vh] overflow-hidden flex flex-col border border-white/10 shadow-2xl">
              <div className="p-4 bg-brand-dark/95 border-b border-white/10 flex justify-between items-center text-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-lime/10 rounded-xl text-brand-lime">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white">Visualização de Vitrine Rascunho: {previewDraft.nomeBarbearia}</h3>
                    <p className="text-[11px] text-gray-400">Código de Convite: <span className="font-mono text-brand-lime font-bold">{previewDraft.codigo}</span></p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewDraft(null)}
                  className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                  title="Fechar pré-visualização"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto bg-gray-900 p-2 md:p-4">
                <CortesVitrine
                  merchant={{
                    uid: previewDraft.id || 'draft-preview',
                    email: previewDraft.resgatadoPorEmail || 'rascunho@cortestime.com',
                    nomeBarbearia: previewDraft.nomeBarbearia,
                    nomeProprietario: previewDraft.nomeProprietario || 'Proprietário',
                    whatsapp: previewDraft.whatsapp || '',
                    vitrineWhatsApp: previewDraft.whatsapp,
                    vitrineInstagram: previewDraft.instagram,
                    vitrineEndereco: previewDraft.endereco,
                    vitrineSlogan: previewDraft.slogan || 'Sua Barbearia de Confiança',
                    vitrineHorarios: previewDraft.horarios || 'Seg - Sáb: 08:00 às 20:00',
                    vitrineLogoImage: previewDraft.logoUrl,
                    vitrineCapa: previewDraft.capaUrl,
                    plano: 'pro',
                    trialInicio: '01/01/2026',
                    trialFim: '01/01/2030',
                    status: 'ativo',
                    criadoEm: '01/01/2026'
                  }}
                  services={(previewDraft.servicos || []).map((s, idx) => ({
                    id: `s-${idx}`,
                    name: s.name,
                    price: s.price,
                    durationMin: s.durationMin || 30,
                    commissionPercent: 0
                  }))}
                  barbers={[
                    {
                      id: 'b-1',
                      name: previewDraft.nomeProprietario || 'Barbeiro Principal',
                      avatar: previewDraft.logoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
                      rating: 5,
                      specialty: 'Barbeiro Master'
                    }
                  ]}
                  isOnlyView={true}
                />
              </div>
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="flex justify-between items-center pt-3 border-t border-gray-100 text-xs text-gray-400 shrink-0">
          <span>Cortestime Pro • Gestão de Usuários & Vitrines</span>
          <button
            onClick={onClose}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-5 rounded-xl transition-all cursor-pointer"
          >
            Fechar Painel
          </button>
        </div>
      </motion.div>
    </div>
  );
}
