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
  Eye,
  BarChart3,
  Edit3,
  Palette,
  Scissors,
  Save,
  Phone,
  Globe
} from 'lucide-react';
import { MerchantUser, DraftVitrine } from '../types';
import { firebaseService } from '../services/firebaseService';
import CortesVitrine from './CortesVitrine';
import AdminAnalyticsDashboard from './AdminAnalyticsDashboard';
import { THEME_PRESETS } from '../utils/vitrineTheme';

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
  const [adminTab, setAdminTab] = useState<'users' | 'drafts' | 'analytics'>('users');
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
  const [draftBarbeiroUnico, setDraftBarbeiroUnico] = useState(false);
  const [draftThemePreset, setDraftThemePreset] = useState('cortestime');
  const [draftPrimaryColor, setDraftPrimaryColor] = useState('#051b42');
  const [draftSecondaryColor, setDraftSecondaryColor] = useState('#2563eb');
  const [draftGradientEnabled, setDraftGradientEnabled] = useState(true);
  const [draftTemplate, setDraftTemplate] = useState<'modelo1' | 'modelo2'>('modelo1');
  const [draftModoAcao, setDraftModoAcao] = useState<'agendamento' | 'whatsapp'>('agendamento');
  const [draftServicos, setDraftServicos] = useState<Array<{ name: string; price: number; durationMin: number }>>([
    { name: 'Corte de Cabelo', price: 40, durationMin: 30 },
    { name: 'Barba Alinhada', price: 30, durationMin: 25 },
    { name: 'Combo Cabelo + Barba', price: 60, durationMin: 45 }
  ]);

  // Draft Editing Modal state
  const [editingDraft, setEditingDraft] = useState<DraftVitrine | null>(null);
  const [editNomeBarbearia, setEditNomeBarbearia] = useState('');
  const [editNomeProprietario, setEditNomeProprietario] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editInstagram, setEditInstagram] = useState('');
  const [editEndereco, setEditEndereco] = useState('');
  const [editSlogan, setEditSlogan] = useState('');
  const [editHorarios, setEditHorarios] = useState('');
  const [editBarbeiroUnico, setEditBarbeiroUnico] = useState(false);
  const [editThemePreset, setEditThemePreset] = useState('cortestime');
  const [editPrimaryColor, setEditPrimaryColor] = useState('#051b42');
  const [editSecondaryColor, setEditSecondaryColor] = useState('#2563eb');
  const [editGradientEnabled, setEditGradientEnabled] = useState(true);
  const [editTemplate, setEditTemplate] = useState<'modelo1' | 'modelo2'>('modelo1');
  const [editModoAcao, setEditModoAcao] = useState<'agendamento' | 'whatsapp'>('agendamento');
  const [editServicos, setEditServicos] = useState<Array<{ name: string; price: number; durationMin: number }>>([]);
  const [editNewSvcName, setEditNewSvcName] = useState('');
  const [editNewSvcPrice, setEditNewSvcPrice] = useState('');
  const [editNewSvcDuration, setEditNewSvcDuration] = useState('30');
  const [isSavingEditDraft, setIsSavingEditDraft] = useState(false);

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
        barbeiroUnico: draftBarbeiroUnico,
        themePreset: draftThemePreset,
        primaryColor: draftPrimaryColor,
        secondaryColor: draftSecondaryColor,
        gradientEnabled: draftGradientEnabled,
        template: draftTemplate,
        modoAcao: draftModoAcao,
        criadoPorAdmin: currentAdmin.email
      });

      setDraftVitrines(prev => [newDraft, ...prev.filter(d => d.id !== newDraft.id && d.codigo !== newDraft.codigo)]);
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
      setDraftBarbeiroUnico(false);
      setDraftThemePreset('cortestime');
      setDraftPrimaryColor('#051b42');
      setDraftSecondaryColor('#2563eb');
      setDraftGradientEnabled(true);
      setDraftTemplate('modelo1');
      setDraftModoAcao('agendamento');
    } catch (err: any) {
      alert(`Erro ao criar vitrine rascunho: ${err?.message || 'Tente novamente'}`);
    }
  };

  // Open Edit Draft Modal
  const handleOpenEditDraft = (draft: DraftVitrine) => {
    setEditingDraft(draft);
    setEditNomeBarbearia(draft.nomeBarbearia || '');
    setEditNomeProprietario(draft.nomeProprietario || '');
    setEditWhatsapp(draft.whatsapp || '');
    setEditInstagram(draft.instagram || '');
    setEditEndereco(draft.endereco || '');
    setEditSlogan(draft.slogan || '');
    setEditHorarios(draft.horarios || 'Seg - Sáb: 08:00 às 20:00');
    setEditBarbeiroUnico(draft.barbeiroUnico ?? false);
    setEditThemePreset(draft.themePreset || 'cortestime');
    setEditPrimaryColor(draft.primaryColor || '#051b42');
    setEditSecondaryColor(draft.secondaryColor || '#2563eb');
    setEditGradientEnabled(draft.gradientEnabled ?? true);
    setEditTemplate(draft.template || 'modelo1');
    setEditModoAcao(draft.modoAcao || 'agendamento');
    setEditServicos(draft.servicos ? [...draft.servicos] : []);
    setEditNewSvcName('');
    setEditNewSvcPrice('');
    setEditNewSvcDuration('30');
  };

  // Edit Draft Service Handlers
  const handleAddEditDraftService = () => {
    if (!editNewSvcName.trim()) return;
    setEditServicos(prev => [
      ...prev,
      {
        name: editNewSvcName.trim(),
        price: parseFloat(editNewSvcPrice) || 0,
        durationMin: parseInt(editNewSvcDuration) || 30
      }
    ]);
    setEditNewSvcName('');
    setEditNewSvcPrice('');
    setEditNewSvcDuration('30');
  };

  const handleRemoveEditDraftService = (index: number) => {
    setEditServicos(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateEditDraftService = (index: number, field: 'name' | 'price' | 'durationMin', value: any) => {
    setEditServicos(prev => prev.map((s, i) => {
      if (i !== index) return s;
      return {
        ...s,
        [field]: field === 'price' ? (parseFloat(value) || 0) : field === 'durationMin' ? (parseInt(value) || 0) : value
      };
    }));
  };

  // Save Edited Draft to Firestore & Local state
  const handleSaveEditDraftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDraft) return;
    if (!editNomeBarbearia.trim()) {
      alert("Por favor, informe o Nome da Barbearia.");
      return;
    }

    setIsSavingEditDraft(true);
    try {
      const updatedFields: Partial<DraftVitrine> = {
        nomeBarbearia: editNomeBarbearia.trim(),
        nomeProprietario: editNomeProprietario.trim(),
        whatsapp: editWhatsapp.trim(),
        instagram: editInstagram.trim(),
        endereco: editEndereco.trim(),
        slogan: editSlogan.trim(),
        horarios: editHorarios.trim(),
        barbeiroUnico: editBarbeiroUnico,
        themePreset: editThemePreset,
        primaryColor: editPrimaryColor,
        secondaryColor: editSecondaryColor,
        gradientEnabled: editGradientEnabled,
        template: editTemplate,
        modoAcao: editModoAcao,
        servicos: editServicos
      };

      await firebaseService.updateDraftVitrine(editingDraft.id, updatedFields);

      const mergedDraft: DraftVitrine = {
        ...editingDraft,
        ...updatedFields
      };

      setDraftVitrines(prev => prev.map(d => (d.id === editingDraft.id || d.codigo === editingDraft.codigo) ? mergedDraft : d));

      if (previewDraft && (previewDraft.id === editingDraft.id || previewDraft.codigo === editingDraft.codigo)) {
        setPreviewDraft(mergedDraft);
      }

      setEditingDraft(null);
      setActionSuccess(`✅ Vitrine personalizada de "${mergedDraft.nomeBarbearia}" salva com sucesso!`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert(`Erro ao salvar alterações da vitrine: ${err?.message || 'Tente novamente'}`);
    } finally {
      setIsSavingEditDraft(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCopyLink15Days = (draft?: DraftVitrine) => {
    const origin = window.location.origin;
    let url = `${origin}/?dias=15`;
    if (draft) {
      url = `${origin}/?dias=15&convite=${encodeURIComponent(draft.codigo)}`;
    }
    navigator.clipboard.writeText(url);
    const key = draft ? `link-${draft.codigo}` : 'link-15';
    setCopiedCode(key);
    setActionSuccess(`🔗 Link especial de 15 dias copiado com sucesso! Envie para o barbeiro.`);
    setTimeout(() => {
      setCopiedCode(null);
      setActionSuccess(null);
    }, 4000);
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
            onClick={() => setAdminTab('analytics')}
            className={`pb-3 text-xs md:text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              adminTab === 'analytics'
                ? 'border-brand-blue text-brand-blue'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-amber-500" />
            <span>Analytics & Métricas</span>
            <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.2 rounded-full">
              Privado
            </span>
          </button>

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

        {/* TAB 0: ANALYTICS DASHBOARD */}
        {adminTab === 'analytics' && (
          <div className="flex-1 overflow-y-auto rounded-2xl -mx-4 md:-mx-8 -mb-4 md:-mb-8">
            <AdminAnalyticsDashboard currentMerchant={currentAdmin} />
          </div>
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
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between shrink-0">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Buscar barbearia, proprietário, email ou WhatsApp..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:border-brand-blue outline-none transition-all"
                />
              </div>

              <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl overflow-x-auto text-[11px] font-bold shrink-0 no-scrollbar">
                <button 
                  onClick={() => setFilter('todos')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${filter === 'todos' ? 'bg-white text-brand-dark shadow-sm' : 'text-gray-500 hover:text-brand-dark'}`}
                >
                  Todos ({totalUsers})
                </button>
                <button 
                  onClick={() => setFilter('pendentes')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${filter === 'pendentes' ? 'bg-amber-500 text-white shadow-sm font-extrabold' : 'text-amber-700 hover:bg-amber-50'}`}
                >
                  <span>⚡ Pix Pendentes</span>
                  {totalPendentes > 0 && <span className="bg-white/30 px-1.5 py-0.2 rounded-full text-[9px] font-black">{totalPendentes}</span>}
                </button>
                <button 
                  onClick={() => setFilter('pro')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${filter === 'pro' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-500 hover:text-brand-dark'}`}
                >
                  💎 Pro ({totalPro})
                </button>
                <button 
                  onClick={() => setFilter('trial')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${filter === 'trial' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-brand-dark'}`}
                >
                  ⏳ Teste ({totalTrial})
                </button>
                <button 
                  onClick={() => setFilter('vitrine')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer whitespace-nowrap ${filter === 'vitrine' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-500 hover:text-brand-dark'}`}
                >
                  ⚪ Vitrine Grátis
                </button>
              </div>
            </div>

            {/* USER LIST TABLE */}
            <div className="overflow-y-auto flex-1 border border-gray-100 rounded-2xl bg-gray-50/40 p-2 sm:p-3">
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
                <div className="space-y-3">
                  {filteredMerchants.map((merchant, merchantIdx) => {
                    const isPro = merchant.plano === 'pro';
                    const isTrial = merchant.plano === 'pro_trial' || merchant.plano === 'trial';
                    const isPendingPix = merchant.pagamentoPendente === true;

                    return (
                      <div 
                        key={`merchant-row-${merchant.uid || 'uid'}-${merchant.email || 'email'}-${merchantIdx}`} 
                        className={`p-4 bg-white rounded-2xl border transition-all flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shadow-xs ${
                          isPendingPix 
                            ? 'border-amber-400 bg-amber-50/30 ring-1 ring-amber-400/40' 
                            : isPro 
                            ? 'border-emerald-200/80 hover:border-emerald-300' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {/* MERCHANT INFO */}
                        <div className="space-y-2 max-w-xl w-full">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-extrabold text-sm text-brand-dark">
                              {merchant.nomeBarbearia || 'Barbearia sem nome'}
                            </h3>
                            
                            {/* PLAN BADGES */}
                            {isPro && (
                              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                                PRO 💎
                              </span>
                            )}
                            {isTrial && (
                              <span className="bg-blue-100 text-blue-800 border border-blue-300 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                                Teste Grátis ⏳
                              </span>
                            )}
                            {!isPro && !isTrial && (
                              <span className="bg-gray-100 text-gray-600 border border-gray-200 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                                Vitrine Grátis ⚪
                              </span>
                            )}

                            {/* PENDING PIX ALERT */}
                            {isPendingPix && (
                              <span className="bg-amber-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider animate-pulse flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                <span>Pix Informado (Aguardando Aprovação)</span>
                              </span>
                            )}

                            {merchant.codigoConviteResgatado && (
                              <span className="bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Ticket className="w-3 h-3 text-purple-600" />
                                <span>Convite: {merchant.codigoConviteResgatado}</span>
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-gray-500 grid grid-cols-1 sm:grid-cols-2 gap-1.5 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                            <div>
                              <span className="text-gray-400 block text-[10px] uppercase font-bold">Proprietário</span>
                              <span className="font-semibold text-gray-800">{merchant.nomeProprietario || 'Não informado'}</span>
                            </div>
                            <div>
                              <span className="text-gray-400 block text-[10px] uppercase font-bold">Contato / WhatsApp</span>
                              {merchant.whatsapp ? (
                                <a 
                                  href={`https://wa.me/55${merchant.whatsapp.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-emerald-700 hover:text-emerald-800 flex items-center gap-1 font-bold"
                                >
                                  <MessageSquare className="w-3 h-3 text-emerald-600" />
                                  <span>{merchant.whatsapp}</span>
                                </a>
                              ) : (
                                <span className="text-gray-400 italic">Não informado</span>
                              )}
                            </div>
                            <div className="sm:col-span-2">
                              <span className="text-gray-400 block text-[10px] uppercase font-bold">Email de Acesso</span>
                              <span className="font-mono text-gray-700 text-[11px]">{merchant.email}</span>
                            </div>
                          </div>

                          {/* EXPIRATION / TRIAL INFO */}
                          <div className="text-[11px] text-gray-600 flex items-center gap-2 pt-0.5">
                            <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            {isPro && merchant.dataExpiracaoAssinatura ? (
                              <span>Assinatura ativa até: <strong className="text-emerald-700 font-bold">{merchant.dataExpiracaoAssinatura}</strong></span>
                            ) : isPro ? (
                              <span className="text-emerald-700 font-bold">Assinatura Pro Ativa (Vitalícia / Sem expiração)</span>
                            ) : isTrial && merchant.trialFim ? (
                              <span>Período de teste até: <strong className="text-blue-700 font-bold">{merchant.trialFim}</strong></span>
                            ) : (
                              <span className="text-gray-400">Plano Vitrine Gratuito (Sem expiração)</span>
                            )}
                          </div>
                        </div>

                        {/* ACTIONS BAR */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                          {/* 1. APPROVE/ACTIVATE PRO */}
                          {isPendingPix && (
                            <button
                              onClick={() => handleActivatePro(merchant, 30)}
                              className="bg-amber-500 hover:bg-amber-600 text-white font-black text-xs py-2.5 px-4 rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer animate-bounce"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Aprovar Pix & Ativar Pro (30d)</span>
                            </button>
                          )}

                          {!isPro && !isPendingPix && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleActivatePro(merchant, 30)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                                title="Ativar 30 dias de Plano Pro"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Ativar Pro (30d)</span>
                              </button>
                              <button
                                onClick={() => handleActivatePro(merchant, 90)}
                                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2 px-2.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                                title="Ativar 90 dias de Plano Pro (Trimestral)"
                              >
                                <span>+90d</span>
                              </button>
                            </div>
                          )}

                          {/* 2. RENEW PRO */}
                          {isPro && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleRenewSubscription(merchant, 30)}
                                className="bg-brand-blue hover:bg-brand-blue-light text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                                title="Adicionar +30 dias de assinatura"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Renovar (+30d)</span>
                              </button>
                              <button
                                onClick={() => handleRenewSubscription(merchant, 90)}
                                className="bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs py-2 px-2.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                                title="Adicionar +90 dias de assinatura (Trimestre)"
                              >
                                <span>+90d</span>
                              </button>
                            </div>
                          )}

                          {/* 3. EXTEND TRIAL */}
                          {isTrial && (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleExtendTrial(merchant, 7)}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-2.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                                title="Estender teste grátis por +7 dias"
                              >
                                <Clock className="w-3.5 h-3.5" />
                                <span>+7d Teste</span>
                              </button>
                              <button
                                onClick={() => handleExtendTrial(merchant, 15)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-2.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                                title="Conceder +15 dias de teste grátis para este barbeiro"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                <span>+15d Teste</span>
                              </button>
                            </div>
                          )}

                          {/* 4. CANCEL / MUTE TO FREE */}
                          {isPro && (
                            <button
                              onClick={() => handleCancelSubscription(merchant)}
                              className="bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 font-bold text-xs py-2 px-3 rounded-xl flex items-center gap-1 transition-all cursor-pointer border border-gray-200"
                              title="Retornar para o plano gratuito Cortes Vitrine"
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

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleCopyLink15Days()}
                  className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white font-extrabold py-2.5 px-4 rounded-xl shadow-md transition-all text-xs flex items-center justify-center gap-1.5 uppercase tracking-wider cursor-pointer shrink-0"
                  title="Copiar link especial que concede 15 dias de teste grátis para qualquer barbeiro"
                >
                  {copiedCode === 'link-15' ? (
                    <>
                      <Check className="w-4 h-4 text-brand-lime" />
                      <span>Link 15 Dias Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-white" />
                      <span>Copiar Link Teste 15 Dias</span>
                    </>
                  )}
                </button>

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
            </div>

            {/* DRAFT LIST */}
            <div className="overflow-y-auto flex-1 border border-gray-100 rounded-2xl bg-gray-50/40 p-2 sm:p-3">
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
                <div className="space-y-3">
                  {filteredDrafts.map((draft, draftIdx) => {
                    const isUsed = draft.usado === true;

                    return (
                      <div 
                        key={`draft-row-${draft.id || 'id'}-${draft.codigo || 'code'}-${draftIdx}`} 
                        className="p-4 bg-white rounded-2xl border border-gray-200 hover:border-gray-300 transition-all flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shadow-xs"
                      >
                        {/* CODE & BARBERSHOP DETAILS */}
                        <div className="space-y-2 max-w-xl w-full">
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
                                <Sparkles className="w-3 h-3 text-emerald-600" /> Disponível para Resgate
                              </span>
                            )}
                            {/* BADGES */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {draft.barbeiroUnico && (
                                <span className="bg-purple-100 text-purple-800 border border-purple-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                                  <UserCheck className="w-3 h-3 text-purple-600" /> Barbeiro Único
                                </span>
                              )}
                              {draft.template && (
                                <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  {draft.template === 'modelo2' ? 'Modelo 2' : 'Modelo 1'}
                                </span>
                              )}
                              {draft.primaryColor && (
                                <div className="flex items-center gap-1 text-[10px] text-gray-500 font-mono">
                                  <span className="w-3 h-3 rounded-full border border-black/20" style={{ backgroundColor: draft.primaryColor }} />
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1 text-xs">
                            <h4 className="font-extrabold text-brand-dark text-sm">
                              {draft.nomeBarbearia}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-[11px] text-gray-600">
                              {draft.nomeProprietario && (
                                <p><strong className="text-gray-700">Proprietário:</strong> {draft.nomeProprietario}</p>
                              )}
                              {draft.whatsapp && (
                                <p><strong className="text-gray-700">WhatsApp:</strong> {draft.whatsapp}</p>
                              )}
                              {draft.instagram && (
                                <p><strong className="text-gray-700">Instagram:</strong> @{draft.instagram.replace('@', '')}</p>
                              )}
                              {draft.endereco && (
                                <p className="sm:col-span-2 truncate"><strong className="text-gray-700">Endereço:</strong> {draft.endereco}</p>
                              )}
                              {draft.servicos && draft.servicos.length > 0 && (
                                <p className="sm:col-span-2 text-brand-blue font-bold">
                                  ✂️ {draft.servicos.length} serviços pré-configurados
                                </p>
                              )}
                            </div>
                          </div>

                          {/* CLAIM DETAILS IF USED */}
                          {isUsed && (
                            <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[11px] text-gray-600 space-y-0.5">
                              <p className="font-bold text-gray-700">Detalhes do Resgate:</p>
                              <p>Email do Barbeiro: <span className="font-semibold text-brand-dark">{draft.resgatadoPorEmail || 'Não informado'}</span></p>
                              {draft.dataResgate && <p>Data do Resgate: {new Date(draft.dataResgate).toLocaleString('pt-BR')}</p>}
                            </div>
                          )}
                        </div>

                        {/* ACTIONS */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                          {/* EDIT VITRINE BUTTON */}
                          <button
                            onClick={() => handleOpenEditDraft(draft)}
                            className="bg-brand-blue/10 hover:bg-brand-blue/20 text-brand-blue font-bold text-xs py-2 px-3 rounded-xl flex items-center gap-1.5 transition-all border border-brand-blue/30 cursor-pointer"
                            title="Personalizar serviços, cores e configurações da vitrine"
                          >
                            <Edit3 className="w-4 h-4 text-brand-blue" />
                            <span>Editar Vitrine</span>
                          </button>

                          {/* PREVIEW VITRINE BUTTON */}
                          <button
                            onClick={() => setPreviewDraft(draft)}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs py-2 px-3 rounded-xl flex items-center gap-1.5 transition-all border border-gray-200 cursor-pointer"
                            title="Visualizar a Vitrine do Rascunho"
                          >
                            <Eye className="w-4 h-4 text-brand-blue" />
                            <span>Ver Vitrine</span>
                          </button>

                          {/* COPY 15-DAY LINK BUTTON */}
                          <button
                            onClick={() => handleCopyLink15Days(draft)}
                            className="bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                            title="Copiar link de convite que já carrega este rascunho com 15 dias de teste grátis"
                          >
                            {copiedCode === `link-${draft.codigo}` ? (
                              <>
                                <Check className="w-4 h-4 text-brand-lime" />
                                <span>Link 15d Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4 text-white" />
                                <span>Link 15 Dias</span>
                              </>
                            )}
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

                {/* SINGLE BARBER MODE TOGGLE */}
                <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-purple-950 text-xs block">Modo Barbeiro Único</span>
                      <span className="text-[11px] text-purple-700 leading-tight block">
                        Oculta o ícone/seleção de barbeiros (ideal para quem trabalha sozinho)
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDraftBarbeiroUnico(!draftBarbeiroUnico)}
                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
                      draftBarbeiroUnico ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        draftBarbeiroUnico ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* THEME PRESET, TEMPLATE & CUSTOM COLORS */}
                <div className="space-y-3 p-3 bg-gray-50 rounded-2xl border border-gray-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-gray-700 flex items-center gap-1">
                        <Palette className="w-3.5 h-3.5 text-brand-blue" />
                        <span>Tema de Cores</span>
                      </label>
                      <select
                        value={draftThemePreset}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDraftThemePreset(val);
                          const matched = THEME_PRESETS.find(p => p.id === val);
                          if (matched) {
                            setDraftPrimaryColor(matched.primary);
                            setDraftSecondaryColor(matched.secondary);
                            setDraftGradientEnabled(matched.gradient);
                          }
                        }}
                        className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:border-brand-blue outline-none"
                      >
                        {THEME_PRESETS.map(preset => (
                          <option key={preset.id} value={preset.id}>{preset.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-gray-700">Modelo da Vitrine</label>
                      <select
                        value={draftTemplate}
                        onChange={(e) => setDraftTemplate(e.target.value as 'modelo1' | 'modelo2')}
                        className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:border-brand-blue outline-none"
                      >
                        <option value="modelo1">Modelo 1 (Clássico Clean)</option>
                        <option value="modelo2">Modelo 2 (Moderno & Degradê)</option>
                      </select>
                    </div>
                  </div>

                  {/* Custom Colors & Degradê in Draft */}
                  <div className="pt-2 border-t border-gray-200 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <label className="font-bold text-gray-700 text-[11px]">Cor Principal:</label>
                      <input 
                        type="color" 
                        value={draftPrimaryColor}
                        onChange={e => setDraftPrimaryColor(e.target.value)}
                        className="w-7 h-7 rounded-lg border border-gray-300 p-0.5 cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <label className="font-bold text-gray-700 text-[11px]">Cor Secundária:</label>
                      <input 
                        type="color" 
                        value={draftSecondaryColor}
                        onChange={e => setDraftSecondaryColor(e.target.value)}
                        className="w-7 h-7 rounded-lg border border-gray-300 p-0.5 cursor-pointer"
                      />
                    </div>
                    <label className="flex items-center gap-1.5 cursor-pointer text-gray-700 font-bold text-[11px] ml-auto">
                      <input 
                        type="checkbox"
                        checked={draftGradientEnabled}
                        onChange={e => setDraftGradientEnabled(e.target.checked)}
                        className="rounded text-brand-blue focus:ring-brand-blue"
                      />
                      <span>Degradê</span>
                    </label>
                  </div>
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
                      <div key={`draft-svc-${svc.name}-${idx}`} className="flex justify-between items-center p-2 bg-gray-50 rounded-xl border border-gray-200 text-[11px]">
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const d = previewDraft;
                      setPreviewDraft(null);
                      handleOpenEditDraft(d);
                    }}
                    className="bg-brand-lime hover:bg-lime-400 text-brand-dark font-extrabold text-xs py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                    title="Editar informações, cores, barbeiro único e serviços deste rascunho"
                  >
                    <Edit3 className="w-4 h-4 text-brand-dark" />
                    <span>Editar Rascunho</span>
                  </button>
                  <button
                    onClick={() => setPreviewDraft(null)}
                    className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                    title="Fechar pré-visualização"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
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
                    vitrineThemePreset: previewDraft.themePreset || 'cortestime',
                    vitrinePrimaryColor: previewDraft.primaryColor || '#051b42',
                    vitrineSecondaryColor: previewDraft.secondaryColor || '#2563eb',
                    vitrineGradientEnabled: previewDraft.gradientEnabled ?? true,
                    vitrineTemplate: previewDraft.template || 'modelo1',
                    vitrineModoAcao: previewDraft.modoAcao || 'agendamento',
                    vitrineBarbeiroUnico: previewDraft.barbeiroUnico ?? false,
                    barbeiroUnico: previewDraft.barbeiroUnico ?? false,
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

        {/* MODAL TO EDIT DRAFT VITRINE */}
        {editingDraft && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 my-auto text-left border border-gray-100 max-h-[92vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-brand-lime/20 text-brand-dark rounded-xl">
                    <Edit3 className="w-5 h-5 text-brand-blue" />
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-lg text-brand-dark flex items-center gap-2">
                      <span>Personalizar Vitrine Rascunho</span>
                      <span className="text-xs font-mono font-bold bg-brand-blue/10 text-brand-blue px-2.5 py-0.5 rounded-lg">
                        {editingDraft.codigo}
                      </span>
                    </h3>
                    <p className="text-[11px] text-gray-500">Configure serviços, tema, cores e modo barbeiro único antes de enviar o código</p>
                  </div>
                </div>
                <button 
                  onClick={() => setEditingDraft(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 cursor-pointer"
                  title="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEditDraftSubmit} className="space-y-4 text-xs">
                {/* 1. DADOS DE IDENTIDADE */}
                <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Store className="w-4 h-4 text-brand-blue" />
                    <span>Dados Principais da Barbearia</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-gray-700">Nome da Barbearia *</label>
                      <input 
                        type="text" 
                        required
                        value={editNomeBarbearia}
                        onChange={e => setEditNomeBarbearia(e.target.value)}
                        placeholder="Ex: Barbearia Imperial"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl font-semibold text-xs focus:border-brand-blue outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-700">Nome do Proprietário</label>
                      <input 
                        type="text" 
                        value={editNomeProprietario}
                        onChange={e => setEditNomeProprietario(e.target.value)}
                        placeholder="Ex: Carlos Silva"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:border-brand-blue outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-700">WhatsApp</label>
                      <input 
                        type="tel" 
                        value={editWhatsapp}
                        onChange={e => setEditWhatsapp(e.target.value)}
                        placeholder="(11) 99999-8888"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:border-brand-blue outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-700">Instagram</label>
                      <input 
                        type="text" 
                        value={editInstagram}
                        onChange={e => setEditInstagram(e.target.value)}
                        placeholder="@barbeariaimperial"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:border-brand-blue outline-none"
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="font-bold text-gray-700">Endereço Completo</label>
                      <input 
                        type="text" 
                        value={editEndereco}
                        onChange={e => setEditEndereco(e.target.value)}
                        placeholder="Ex: Rua das Flores, 120 - Centro"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:border-brand-blue outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-700">Slogan / Frase de Impacto</label>
                      <input 
                        type="text" 
                        value={editSlogan}
                        onChange={e => setEditSlogan(e.target.value)}
                        placeholder="Ex: Corte, barba e estilo de alto padrão"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:border-brand-blue outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-gray-700">Horário Geral</label>
                      <input 
                        type="text" 
                        value={editHorarios}
                        onChange={e => setEditHorarios(e.target.value)}
                        placeholder="Ex: Seg - Sáb: 09:00 às 19:00"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:border-brand-blue outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. ATENDIMENTO INDIVIDUAL / MODO BARBEIRO ÚNICO */}
                <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-purple-950 text-sm block">Opção de Barbeiro Único</span>
                      <span className="text-xs text-purple-700 leading-tight block mt-0.5">
                        Oculta a seleção de barbeiros no agendamento e a lista de equipe na vitrine (ideal para profissionais individuais).
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditBarbeiroUnico(!editBarbeiroUnico)}
                    className={`w-14 h-7 flex items-center rounded-full p-1 cursor-pointer transition-colors shrink-0 ${
                      editBarbeiroUnico ? 'bg-purple-600' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                        editBarbeiroUnico ? 'translate-x-7' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 3. TEMA, CORES & MODELO */}
                <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-brand-blue" />
                    <span>Personalização Visual, Cores & Modelo</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {/* Theme Preset */}
                    <div className="space-y-1">
                      <label className="font-bold text-gray-700">Paleta de Cores</label>
                      <select
                        value={editThemePreset}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditThemePreset(val);
                          const matched = THEME_PRESETS.find(p => p.id === val);
                          if (matched) {
                            setEditPrimaryColor(matched.primary);
                            setEditSecondaryColor(matched.secondary);
                            setEditGradientEnabled(matched.gradient);
                          }
                        }}
                        className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:border-brand-blue outline-none"
                      >
                        {THEME_PRESETS.map(preset => (
                          <option key={preset.id} value={preset.id}>{preset.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Template */}
                    <div className="space-y-1">
                      <label className="font-bold text-gray-700">Modelo da Vitrine</label>
                      <select
                        value={editTemplate}
                        onChange={(e) => setEditTemplate(e.target.value as 'modelo1' | 'modelo2')}
                        className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:border-brand-blue outline-none"
                      >
                        <option value="modelo1">Modelo 1 (Clássico Clean)</option>
                        <option value="modelo2">Modelo 2 (Moderno & Degradê)</option>
                      </select>
                    </div>

                    {/* Modo de Ação */}
                    <div className="space-y-1">
                      <label className="font-bold text-gray-700">Ação do Botão Principal</label>
                      <select
                        value={editModoAcao}
                        onChange={(e) => setEditModoAcao(e.target.value as 'agendamento' | 'whatsapp')}
                        className="w-full px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:border-brand-blue outline-none"
                      >
                        <option value="agendamento">Agendamento Online no Site</option>
                        <option value="whatsapp">Botão Direto para WhatsApp</option>
                      </select>
                    </div>
                  </div>

                  {/* Colors Preview and Custom Pickers */}
                  <div className="pt-2 border-t border-gray-200 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <label className="font-bold text-gray-700 text-[11px]">Cor Primária:</label>
                      <input 
                        type="color" 
                        value={editPrimaryColor}
                        onChange={e => setEditPrimaryColor(e.target.value)}
                        className="w-8 h-8 rounded-lg border border-gray-300 p-0.5 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="font-bold text-gray-700 text-[11px]">Cor Secundária:</label>
                      <input 
                        type="color" 
                        value={editSecondaryColor}
                        onChange={e => setEditSecondaryColor(e.target.value)}
                        className="w-8 h-8 rounded-lg border border-gray-300 p-0.5 cursor-pointer"
                      />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer text-gray-700 font-bold text-[11px] ml-auto">
                      <input 
                        type="checkbox"
                        checked={editGradientEnabled}
                        onChange={e => setEditGradientEnabled(e.target.checked)}
                        className="rounded text-brand-blue focus:ring-brand-blue"
                      />
                      <span>Ativar Degradê</span>
                    </label>
                  </div>
                </div>

                {/* 4. TABELA COMPLETA DE SERVIÇOS */}
                <div className="space-y-3 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Scissors className="w-4 h-4 text-brand-blue" />
                      <span>Serviços da Barbearia ({editServicos.length})</span>
                    </h4>
                    <span className="text-[10px] text-gray-500 font-medium">Edite valores, duração e nomes diretamente</span>
                  </div>

                  {/* Services List Table */}
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {editServicos.length === 0 ? (
                      <p className="text-gray-400 text-center py-3 italic">Nenhum serviço adicionado. Adicione abaixo.</p>
                    ) : (
                      editServicos.map((svc, idx) => (
                        <div key={`edit-svc-${idx}`} className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-gray-200 shadow-2xs">
                          <input 
                            type="text" 
                            value={svc.name}
                            onChange={e => handleUpdateEditDraftService(idx, 'name', e.target.value)}
                            placeholder="Nome do serviço"
                            className="flex-1 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:bg-white focus:border-brand-blue outline-none"
                          />
                          <div className="flex items-center gap-1">
                            <span className="text-gray-400 font-bold text-[11px]">R$</span>
                            <input 
                              type="number" 
                              step="0.5"
                              value={svc.price}
                              onChange={e => handleUpdateEditDraftService(idx, 'price', e.target.value)}
                              placeholder="Preço"
                              className="w-20 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-emerald-700 text-right focus:bg-white focus:border-brand-blue outline-none"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <input 
                              type="number" 
                              step="5"
                              value={svc.durationMin}
                              onChange={e => handleUpdateEditDraftService(idx, 'durationMin', e.target.value)}
                              placeholder="Min"
                              className="w-16 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 text-right focus:bg-white focus:border-brand-blue outline-none"
                            />
                            <span className="text-gray-400 text-[10px]">min</span>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => handleRemoveEditDraftService(idx)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Remover serviço"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add New Service Inline */}
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                    <input 
                      type="text" 
                      placeholder="Novo serviço (Ex: Barboterapia)" 
                      value={editNewSvcName}
                      onChange={e => setEditNewSvcName(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:border-brand-blue outline-none"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400 font-bold text-xs">R$</span>
                      <input 
                        type="number" 
                        placeholder="0.00" 
                        value={editNewSvcPrice}
                        onChange={e => setEditNewSvcPrice(e.target.value)}
                        className="w-20 px-2.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-emerald-700 outline-none"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <input 
                        type="number" 
                        placeholder="30" 
                        value={editNewSvcDuration}
                        onChange={e => setEditNewSvcDuration(e.target.value)}
                        className="w-16 px-2 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none"
                      />
                      <span className="text-gray-400 text-[10px]">min</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddEditDraftService}
                      className="px-3.5 py-2 bg-brand-blue hover:bg-brand-blue-light text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar</span>
                    </button>
                  </div>
                </div>

                {/* Actions & Submit */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setEditingDraft(null)}
                    className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={isSavingEditDraft}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold py-3 px-6 rounded-xl shadow-md shadow-emerald-600/20 transition-all text-xs flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingEditDraft ? 'Salvando Alterações...' : 'Salvar Alterações da Vitrine'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
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
