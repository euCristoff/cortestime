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
  Plus
} from 'lucide-react';
import { MerchantUser } from '../types';
import { firebaseService } from '../services/firebaseService';

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
  const [merchants, setMerchants] = useState<MerchantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'todos' | 'pendentes' | 'pro' | 'trial' | 'vitrine'>('todos');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantUser | null>(null);
  const [customDays, setCustomDays] = useState<number>(30);

  const loadMerchants = async () => {
    setLoading(true);
    try {
      const data = await firebaseService.getAllMerchants();
      setMerchants(data);
    } catch (err) {
      console.error("Error loading merchants for admin:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMerchants();
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

      setActionSuccess(`Assinatura de ${merchant.nomeBarbearia} foi alterada para o Plano Gratuito (Vitrine).`);
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

  const totalUsers = merchants.length;
  const totalPro = merchants.filter(m => m.plano === 'pro').length;
  const totalTrial = merchants.filter(m => m.plano === 'pro_trial' || m.plano === 'trial').length;
  const totalPendentes = merchants.filter(m => m.pagamentoPendente === true).length;

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
              <span>Painel de Controle do Administrador</span>
            </div>
            <h2 className="font-display font-extrabold text-2xl text-brand-dark">
              Gestão Manual de Assinaturas
            </h2>
            <p className="text-xs text-gray-500">
              Ative, renove ou cancele assinaturas de barbeiros e aprove pagamentos via Pix manualmente.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadMerchants}
              disabled={loading}
              className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Atualizar lista"
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

        {/* FOOTER */}
        <div className="flex justify-between items-center pt-3 border-t border-gray-100 text-xs text-gray-400 shrink-0">
          <span>Cortestime Pro • Gestão de Usuários</span>
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
