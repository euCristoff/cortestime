import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  BarChart3, 
  Users, 
  Calendar, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShieldCheck, 
  Lock, 
  Eye, 
  RefreshCw, 
  Search, 
  Filter, 
  Clock, 
  Activity, 
  Zap, 
  Globe, 
  Smartphone, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  ChevronRight, 
  ExternalLink, 
  Layers, 
  HelpCircle, 
  Download, 
  X, 
  Sparkles,
  ArrowRight,
  MessageCircle,
  Tag,
  Share2,
  Compass,
  Trash2
} from 'lucide-react';
import { 
  MerchantUser, 
  AnalyticsVisit, 
  AnalyticsEvent, 
  Appointment, 
  Service, 
  Barber, 
  Client, 
  MerchantAnalyticsSummary, 
  MerchantActivityStatus,
  SourceMetric,
  CampaignMetric,
  FunnelStage
} from '../types';
import { analyticsTracker } from '../services/analyticsTracker';
import { firebaseService } from '../services/firebaseService';

interface AdminAnalyticsDashboardProps {
  currentMerchant?: MerchantUser | null;
  onClose?: () => void;
}

type PeriodFilter = 'today' | '7days' | '30days' | '90days' | 'custom';

export default function AdminAnalyticsDashboard({ currentMerchant, onClose }: AdminAnalyticsDashboardProps) {
  // Authorization State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminAuthChecking, setAdminAuthChecking] = useState<boolean>(true);
  const [accessPassword, setAccessPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Data State
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [merchants, setMerchants] = useState<MerchantUser[]>([]);
  const [visits, setVisits] = useState<AnalyticsVisit[]>([]);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  // Filter & Search State
  const [period, setPeriod] = useState<PeriodFilter>('7days');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | MerchantActivityStatus>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  // Individual Merchant View Modal
  const [selectedMerchantSummary, setSelectedMerchantSummary] = useState<MerchantAnalyticsSummary | null>(null);

  // Delete Merchant Account Modal State
  const [merchantToDelete, setMerchantToDelete] = useState<MerchantUser | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState<string>('');
  const [isDeletingMerchant, setIsDeletingMerchant] = useState<boolean>(false);

  // Super Admin Email Check
  const isSuperAdminEmail = (email?: string): boolean => {
    if (!email) return false;
    const clean = email.toLowerCase().trim();
    return (
      clean === 'cristoffcauaff9@gmail.com' ||
      clean === 'cristoffcaua123456@gmail.com' ||
      clean === 'cristoffcauaff123456@gmail.com' ||
      clean === 'suportecortestime@gmail.com' ||
      currentMerchant?.isAdmin === true
    );
  };

  // Initial Auth Verification
  useEffect(() => {
    const verifyAuth = async () => {
      setAdminAuthChecking(true);
      if (currentMerchant && isSuperAdminEmail(currentMerchant.email)) {
        setIsAdminAuthenticated(true);
        setAdminAuthChecking(false);
        return;
      }

      // Check session storage admin grant
      const sessionAdmin = sessionStorage.getItem('cortestime_admin_verified');
      if (sessionAdmin === 'true') {
        setIsAdminAuthenticated(true);
        setAdminAuthChecking(false);
        return;
      }

      // Verify with backend
      if (currentMerchant?.email) {
        try {
          const res = await fetch('/api/admin/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentMerchant.email })
          });
          const data = await res.json();
          if (data.authorized) {
            setIsAdminAuthenticated(true);
            sessionStorage.setItem('cortestime_admin_verified', 'true');
          }
        } catch (e) {
          console.warn('Backend admin verify notice:', e);
        }
      }

      setAdminAuthChecking(false);
    };

    verifyAuth();
  }, [currentMerchant]);

  // Load All Telemetry Data
  const loadData = async () => {
    setIsLoadingData(true);
    try {
      // 1. Fetch Merchants
      const merchantsList = await firebaseService.getAllMerchants();
      setMerchants(merchantsList);

      // 2. Fetch Visits
      const visitsList = await analyticsTracker.getAllVisits();
      setVisits(visitsList);

      // 3. Fetch Events
      const eventsList = await analyticsTracker.getAllEvents();
      setEvents(eventsList);

      // 4. Fetch Appointments, Services, Barbers, Clients
      const [appsList, srvList, brbList, cliList] = await Promise.all([
        firebaseService.getAllAppointmentsAdmin(),
        firebaseService.getAllServicesAdmin(),
        firebaseService.getAllBarbersAdmin(),
        firebaseService.getAllClientsAdmin()
      ]);

      setAppointments(appsList);
      setServices(srvList);
      setBarbers(brbList);
      setClients(cliList);

      setLastRefreshedAt(new Date());
    } catch (err) {
      console.error('Error loading analytics telemetry:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAdminAuthenticated) {
      loadData();
    }
  }, [isAdminAuthenticated]);

  // Handle Manual Password Login for Direct `/admin/analytics` Access
  const handlePasswordLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const cleanPass = accessPassword.trim();
    // Allow authorized admin passcodes or admin email match
    if (
      cleanPass === 'cortestime2025' || 
      cleanPass === 'admin123456' || 
      cleanPass === 'admin@cortestime' ||
      cleanPass === 'cristoff2025'
    ) {
      setIsAdminAuthenticated(true);
      sessionStorage.setItem('cortestime_admin_verified', 'true');
    } else {
      setAuthError('Senha de administrador incorreta. Acesso não autorizado.');
    }
  };

  const handleConfirmDeleteMerchant = async () => {
    if (!merchantToDelete) return;
    if (deleteConfirmInput.trim().toUpperCase() !== 'EXCLUIR') {
      alert('Por favor, digite EXCLUIR para confirmar a exclusão permanente.');
      return;
    }

    setIsDeletingMerchant(true);
    try {
      const targetName = merchantToDelete.nomeBarbearia || 'Barbearia';
      const targetUid = merchantToDelete.uid;

      await firebaseService.deleteMerchantAccount(targetUid);

      setMerchants(prev => prev.filter(m => m.uid !== targetUid));
      if (selectedMerchantSummary?.merchant.uid === targetUid) {
        setSelectedMerchantSummary(null);
      }

      alert(`Conta de "${targetName}" e todos os seus dados foram permanentemente apagados do Firebase!`);

      // If the admin deleted their own account for testing
      if (currentMerchant?.uid === targetUid) {
        alert(`Sua conta de teste foi apagada com sucesso. A página será reiniciada.`);
        localStorage.clear();
        window.location.href = window.location.origin;
        return;
      }

      setMerchantToDelete(null);
      setDeleteConfirmInput('');
      loadData();
    } catch (e: any) {
      console.error("Error deleting merchant in analytics dashboard:", e);
      alert(`Erro ao excluir conta: ${e?.message || 'Tente novamente'}`);
    } finally {
      setIsDeletingMerchant(false);
    }
  };

  // Date Range Calculation
  const dateRange = useMemo(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();

    if (period === 'today') {
      start.setHours(0, 0, 0, 0);
    } else if (period === '7days') {
      start.setDate(end.getDate() - 7);
      start.setHours(0, 0, 0, 0);
    } else if (period === '30days') {
      start.setDate(end.getDate() - 30);
      start.setHours(0, 0, 0, 0);
    } else if (period === '90days') {
      start.setDate(end.getDate() - 90);
      start.setHours(0, 0, 0, 0);
    } else if (period === 'custom') {
      const customS = new Date(customStartDate + 'T00:00:00');
      const customE = new Date(customEndDate + 'T23:59:59');
      return {
        start: isNaN(customS.getTime()) ? new Date(Date.now() - 7 * 86400000) : customS,
        end: isNaN(customE.getTime()) ? new Date() : customE
      };
    }

    return { start, end };
  }, [period, customStartDate, customEndDate]);

  // Filtered Visits within Selected Period
  const filteredVisits = useMemo(() => {
    return visits.filter(v => {
      const vDate = new Date(v.timestamp);
      return vDate >= dateRange.start && vDate <= dateRange.end;
    });
  }, [visits, dateRange]);

  // Filtered Events within Selected Period
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const eDate = new Date(e.timestamp);
      return eDate >= dateRange.start && eDate <= dateRange.end;
    });
  }, [events, dateRange]);

  // Filtered New Registered Merchants in Period
  const newMerchantsInPeriod = useMemo(() => {
    return merchants.filter(m => {
      const cDate = new Date(m.criadoEm);
      return cDate >= dateRange.start && cDate <= dateRange.end;
    });
  }, [merchants, dateRange]);

  // Merchant Summaries with Dynamic Activity Status
  const merchantSummaries: MerchantAnalyticsSummary[] = useMemo(() => {
    return merchants.map(merchant => {
      const summary = analyticsTracker.calculateMerchantSummary(merchant, events, appointments);
      
      // Attach counts
      summary.totalAppointments = appointments.filter(a => a.ownerId === merchant.uid).length;
      summary.totalClients = clients.filter(c => c.ownerId === merchant.uid).length;
      summary.totalBarbers = barbers.filter(b => b.ownerId === merchant.uid).length;
      summary.totalServices = services.filter(s => s.ownerId === merchant.uid).length;

      return summary;
    });
  }, [merchants, events, appointments, clients, barbers, services]);

  // Activity Status Counts
  const activityCounts = useMemo(() => {
    let active = 0;
    let lowActivity = 0;
    let inactive = 0;

    merchantSummaries.forEach(s => {
      if (s.status === 'active') active++;
      else if (s.status === 'low_activity') lowActivity++;
      else if (s.status === 'inactive') inactive++;
    });

    return { active, lowActivity, inactive, total: merchantSummaries.length };
  }, [merchantSummaries]);

  // Aggregate Key Metrics
  const totalVisitsCount = filteredVisits.length;
  const uniqueVisitorsCount = useMemo(() => {
    const set = new Set(filteredVisits.map(v => v.visitorId));
    return set.size;
  }, [filteredVisits]);

  const totalRegisteredUsers = merchants.length;
  const newRegistrationsCount = newMerchantsInPeriod.length;

  const conversionRate = useMemo(() => {
    if (totalVisitsCount === 0) return 0;
    const rate = (newRegistrationsCount / Math.max(totalVisitsCount, 1)) * 100;
    return Math.min(Math.round(rate * 10) / 10, 100);
  }, [newRegistrationsCount, totalVisitsCount]);

  const activeRetentionRate = useMemo(() => {
    if (merchants.length === 0) return 0;
    return Math.round((activityCounts.active / merchants.length) * 100);
  }, [activityCounts.active, merchants.length]);

  // Traffic / Source Metrics Breakdown
  const sourceMetrics: SourceMetric[] = useMemo(() => {
    const map = new Map<string, { visits: number; signups: number }>();

    // 1. Count visits by source
    filteredVisits.forEach(v => {
      const src = (v.utmSource || 'direto').toLowerCase();
      const current = map.get(src) || { visits: 0, signups: 0 };
      current.visits++;
      map.set(src, current);
    });

    // 2. Count signups by source
    newMerchantsInPeriod.forEach(m => {
      const src = (m.utmSource || 'direto').toLowerCase();
      const current = map.get(src) || { visits: 0, signups: 0 };
      current.signups++;
      map.set(src, current);
    });

    const result: SourceMetric[] = [];
    map.forEach((data, source) => {
      const rate = data.visits > 0 ? (data.signups / data.visits) * 100 : 0;
      result.push({
        source,
        visits: data.visits,
        signups: data.signups,
        conversionRate: Math.round(rate * 10) / 10
      });
    });

    result.sort((a, b) => b.visits - a.visits);
    return result;
  }, [filteredVisits, newMerchantsInPeriod]);

  // Campaign Metrics Breakdown
  const campaignMetrics: CampaignMetric[] = useMemo(() => {
    const map = new Map<string, { source: string; visits: number; signups: number }>();

    filteredVisits.forEach(v => {
      if (v.utmCampaign) {
        const key = `${v.utmCampaign}___${v.utmSource || 'direto'}`;
        const current = map.get(key) || { source: v.utmSource || 'direto', visits: 0, signups: 0 };
        current.visits++;
        map.set(key, current);
      }
    });

    newMerchantsInPeriod.forEach(m => {
      if (m.utmCampaign) {
        const key = `${m.utmCampaign}___${m.utmSource || 'direto'}`;
        const current = map.get(key) || { source: m.utmSource || 'direto', visits: 0, signups: 0 };
        current.signups++;
        map.set(key, current);
      }
    });

    const result: CampaignMetric[] = [];
    map.forEach((data, key) => {
      const [campaign] = key.split('___');
      const rate = data.visits > 0 ? (data.signups / data.visits) * 100 : 0;
      result.push({
        campaign,
        source: data.source,
        visits: data.visits,
        signups: data.signups,
        conversionRate: Math.round(rate * 10) / 10
      });
    });

    result.sort((a, b) => b.visits - a.visits);
    return result;
  }, [filteredVisits, newMerchantsInPeriod]);

  // Conversion Funnel Stages Computation
  const conversionFunnel: FunnelStage[] = useMemo(() => {
    // Stage 1: Visitou o site (Total Visits)
    const stage1Count = Math.max(totalVisitsCount, merchants.length);

    // Stage 2: Criou conta (Registered Merchants)
    const stage2Count = merchants.length;

    // Stage 3: Configurou a Barbearia (Onboarding Completed or customized details)
    const stage3Count = merchants.filter(m => 
      m.onboardingCompleted || 
      m.vitrineHorarios || 
      m.vitrineLocalizacao || 
      m.vitrineSlogan ||
      m.whatsapp
    ).length;

    // Stage 4: Cadastrou Serviço (Has >= 1 service)
    const merchantsWithServices = new Set(services.map(s => s.ownerId).filter(Boolean));
    const stage4Count = merchants.filter(m => merchantsWithServices.has(m.uid)).length;

    // Stage 5: Teve 1º Agendamento (Has >= 1 appointment)
    const merchantsWithAppointments = new Set(appointments.map(a => a.ownerId).filter(Boolean));
    const stage5Count = merchants.filter(m => merchantsWithAppointments.has(m.uid)).length;

    // Stage 6: Continua Usando (Active in last 7-14 days)
    const stage6Count = activityCounts.active;

    const stagesRaw = [
      { id: '1', title: '1. Visitou o Site', description: 'Acessaram a plataforma via links ou busca', count: stage1Count },
      { id: '2', title: '2. Criou Conta', description: 'Completaram o cadastro inicial', count: stage2Count },
      { id: '3', title: '3. Configurou Barbearia', description: 'Definiram horários, endereço ou perfil', count: stage3Count },
      { id: '4', title: '4. Cadastrou Serviço', description: 'Adicionaram serviços e valores', count: stage4Count },
      { id: '5', title: '5. 1º Agendamento', description: 'Criaram ou receberam o primeiro cliente', count: stage5Count },
      { id: '6', title: '6. Continua Usando', description: 'Ativos e operando nos últimos 7 dias', count: stage6Count }
    ];

    const baseCount = Math.max(stage1Count, 1);

    return stagesRaw.map((stage, idx) => {
      const percentage = Math.round((stage.count / baseCount) * 100);
      let dropoffPercentage = 0;
      if (idx > 0) {
        const prevCount = stagesRaw[idx - 1].count;
        if (prevCount > 0) {
          dropoffPercentage = Math.round(((prevCount - stage.count) / prevCount) * 100);
        }
      }
      return {
        ...stage,
        percentage: Math.min(percentage, 100),
        dropoffPercentage: Math.max(dropoffPercentage, 0)
      };
    });
  }, [totalVisitsCount, merchants, services, appointments, activityCounts.active]);

  // Chart Data: Visits & Registrations over Time
  const timeSeriesChartData = useMemo(() => {
    const daysMap = new Map<string, { date: string; displayDate: string; visitas: number; cadastros: number; eventos: number }>();

    // Generate consecutive dates array based on selected period
    const cur = new Date(dateRange.start);
    const end = new Date(dateRange.end);

    while (cur <= end) {
      const dateStr = cur.toISOString().split('T')[0];
      const day = String(cur.getDate()).padStart(2, '0');
      const month = String(cur.getMonth() + 1).padStart(2, '0');
      const displayDate = `${day}/${month}`;

      daysMap.set(dateStr, {
        date: dateStr,
        displayDate,
        visitas: 0,
        cadastros: 0,
        eventos: 0
      });

      cur.setDate(cur.getDate() + 1);
    }

    // Populate visits
    filteredVisits.forEach(v => {
      const dateKey = v.dateStr || (v.timestamp ? v.timestamp.split('T')[0] : '');
      const existing = daysMap.get(dateKey);
      if (existing) {
        existing.visitas++;
      }
    });

    // Populate signups
    merchants.forEach(m => {
      const dateKey = m.criadoEm ? m.criadoEm.split('T')[0] : '';
      const existing = daysMap.get(dateKey);
      if (existing) {
        existing.cadastros++;
      }
    });

    // Populate events
    filteredEvents.forEach(ev => {
      const dateKey = ev.dateStr || (ev.timestamp ? ev.timestamp.split('T')[0] : '');
      const existing = daysMap.get(dateKey);
      if (existing) {
        existing.eventos++;
      }
    });

    return Array.from(daysMap.values());
  }, [dateRange, filteredVisits, merchants, filteredEvents]);

  // Chart Data: Activity Status Pie Chart
  const statusPieData = useMemo(() => {
    return [
      { name: 'Ativas (≤ 7 dias)', value: activityCounts.active, color: '#10B981' },
      { name: 'Pouco ativas (8-30 dias)', value: activityCounts.lowActivity, color: '#F59E0B' },
      { name: 'Inativas (> 30 dias)', value: activityCounts.inactive, color: '#EF4444' }
    ].filter(item => item.value > 0);
  }, [activityCounts]);

  // Filtered Table Merchants
  const filteredTableMerchants = useMemo(() => {
    return merchantSummaries.filter(summary => {
      const m = summary.merchant;
      const term = searchTerm.toLowerCase().trim();

      // Search match
      const nameMatch = 
        (m.nomeBarbearia || '').toLowerCase().includes(term) ||
        (m.nomeProprietario || '').toLowerCase().includes(term) ||
        (m.email || '').toLowerCase().includes(term) ||
        (m.whatsapp || '').toLowerCase().includes(term) ||
        (m.utmSource || '').toLowerCase().includes(term) ||
        (m.utmCampaign || '').toLowerCase().includes(term);

      if (!nameMatch) return false;

      // Status match
      if (statusFilter !== 'all' && summary.status !== statusFilter) {
        return false;
      }

      // Source match
      if (sourceFilter !== 'all') {
        const src = (m.utmSource || 'direto').toLowerCase();
        if (src !== sourceFilter.toLowerCase()) return false;
      }

      return true;
    });
  }, [merchantSummaries, searchTerm, statusFilter, sourceFilter]);

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = ['Barbearia', 'Proprietário', 'Email', 'WhatsApp', 'Status', 'Origem (UTM Source)', 'Campanha (UTM Campaign)', 'Criado Em', 'Último Acesso', 'Última Atividade', 'Agendamentos', 'Clientes'];
    const rows = filteredTableMerchants.map(s => [
      `"${s.merchant.nomeBarbearia || ''}"`,
      `"${s.merchant.nomeProprietario || ''}"`,
      `"${s.merchant.email || ''}"`,
      `"${s.merchant.whatsapp || ''}"`,
      `"${s.status === 'active' ? 'Ativa' : s.status === 'low_activity' ? 'Pouco ativa' : 'Inativa'}"`,
      `"${s.merchant.utmSource || 'direto'}"`,
      `"${s.merchant.utmCampaign || '-'}"`,
      `"${analyticsTracker.formatExactDate(s.merchant.criadoEm)}"`,
      `"${s.lastAccessFormatted}"`,
      `"${s.lastActivityFormatted}"`,
      s.totalAppointments,
      s.totalClients
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cortestime_analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for source badge styling
  const getSourceBadge = (source?: string) => {
    const s = (source || 'direto').toLowerCase();
    if (s.includes('face')) return { label: 'Facebook', bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: 'f' };
    if (s.includes('insta')) return { label: 'Instagram', bg: 'bg-pink-50 text-pink-700 border-pink-200', icon: '📸' };
    if (s.includes('whats') || s.includes('zap')) return { label: 'WhatsApp', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: '💬' };
    if (s.includes('goog')) return { label: 'Google', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: '🔍' };
    if (s.includes('tik')) return { label: 'TikTok', bg: 'bg-neutral-100 text-neutral-800 border-neutral-300', icon: '🎵' };
    if (s.includes('you') || s.includes('yt')) return { label: 'YouTube', bg: 'bg-red-50 text-red-700 border-red-200', icon: '▶' };
    return { label: 'Direto / Orgânico', bg: 'bg-slate-100 text-slate-700 border-slate-200', icon: '🌐' };
  };

  // Helper for status badge styling
  const getStatusBadge = (status: MerchantActivityStatus) => {
    switch (status) {
      case 'active':
        return {
          label: 'Ativa (≤ 7 dias)',
          dot: 'bg-emerald-500',
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: CheckCircle2
        };
      case 'low_activity':
        return {
          label: 'Pouco ativa (8-30 dias)',
          dot: 'bg-amber-500',
          badge: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: AlertCircle
        };
      case 'inactive':
        return {
          label: 'Inativa (> 30 dias)',
          dot: 'bg-rose-500',
          badge: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: XCircle
        };
    }
  };

  // RENDER: Loading Auth Screen
  if (adminAuthChecking) {
    return (
      <div id="analytics-auth-loading" className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-300 font-medium text-sm">Verificando credenciais de administrador...</p>
        </div>
      </div>
    );
  }

  // RENDER: Unauthorized / Password Gate Screen
  if (!isAdminAuthenticated) {
    return (
      <div id="analytics-unauthorized-gate" className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">Painel de Analytics Privado</h2>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Este módulo é estritamente confidencial e de acesso exclusivo ao administrador da plataforma CortesTime.
          </p>

          <form onSubmit={handlePasswordLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Senha de Acesso do Administrador
              </label>
              <input
                type="password"
                value={accessPassword}
                onChange={(e) => setAccessPassword(e.target.value)}
                placeholder="Digite a chave mestre do painel"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-white rounded-xl px-4 py-3 text-sm placeholder-slate-500 outline-none transition-all"
                autoFocus
              />
            </div>

            {authError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98]"
            >
              Autenticar e Acessar
            </button>
          </form>

          {onClose && (
            <button
              onClick={onClose}
              className="mt-6 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Voltar ao início
            </button>
          )}
        </div>
      </div>
    );
  }

  // RENDER: Main Admin Analytics Dashboard
  return (
    <div id="cortestime-admin-analytics-dashboard" className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      
      {/* Top Admin Header Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center text-amber-400 shrink-0">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Analytics</h1>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Admin Privado
                </span>
              </div>
              <p className="text-xs text-slate-400">Visão geral e inteligência de uso da plataforma CortesTime</p>
            </div>
          </div>

          {/* Period Filter Buttons & Refresh */}
          <div className="flex items-center flex-wrap gap-2">
            <div className="bg-slate-950 border border-slate-800 p-1 rounded-xl flex items-center text-xs">
              <button
                onClick={() => setPeriod('today')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${period === 'today' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                Hoje
              </button>
              <button
                onClick={() => setPeriod('7days')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${period === '7days' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                7 dias
              </button>
              <button
                onClick={() => setPeriod('30days')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${period === '30days' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                30 dias
              </button>
              <button
                onClick={() => setPeriod('90days')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${period === '90days' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                90 dias
              </button>
              <button
                onClick={() => setPeriod('custom')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${period === 'custom' ? 'bg-amber-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'}`}
              >
                Personalizado
              </button>
            </div>

            <button
              onClick={loadData}
              disabled={isLoadingData}
              title="Atualizar dados agora"
              className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl transition-all flex items-center justify-center"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingData ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar CSV
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-2.5 bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 rounded-xl transition-all ml-1"
                title="Fechar painel de analytics"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Custom Date Selector Dropdown if period === 'custom' */}
        {period === 'custom' && (
          <div className="bg-slate-950/80 border-t border-slate-800 px-4 sm:px-8 py-3 flex items-center gap-4 flex-wrap text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Data Inicial:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-xs outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Data Final:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-xs outline-none"
              />
            </div>
            <span className="text-slate-500 text-[11px]">
              Exibindo registros de {customStartDate} até {customEndDate}
            </span>
          </div>
        )}
      </header>

      {/* Main Container Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* 1. TOP STATS CARDS */}
        <section id="analytics-metric-cards" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Usuários Cadastrados */}
          <div className="bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 shadow-lg transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Usuários Cadastrados</span>
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-black text-white">{totalRegisteredUsers}</span>
              <span className="text-xs text-emerald-400 font-semibold flex items-center">
                +{newRegistrationsCount} no período
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Total de barbearias e profissionais criados na plataforma</p>
          </div>

          {/* Card 2: Usuários Ativos (≤ 7 dias) */}
          <div className="bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 shadow-lg transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Usuários Ativos</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-black text-emerald-400">{activityCounts.active}</span>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded-md">
                {activeRetentionRate}% do total
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span> {activityCounts.lowActivity} pouco ativas</span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span> {activityCounts.inactive} inativas</span>
            </div>
          </div>

          {/* Card 3: Visitas & Visitantes Únicos */}
          <div className="bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 shadow-lg transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Visitas no Site</span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Globe className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-black text-white">{totalVisitsCount}</span>
              <span className="text-xs text-slate-400 font-medium">
                ({uniqueVisitorsCount} visitantes únicos)
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Cliques e sessões registradas nos links de divulgação</p>
          </div>

          {/* Card 4: Taxa de Conversão */}
          <div className="bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 shadow-lg transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Taxa de Conversão</span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-black text-purple-400">{conversionRate}%</span>
              <span className="text-xs text-slate-400">
                visitas ➔ cadastros
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Porcentagem de visitantes que concluíram o cadastro</p>
          </div>

        </section>

        {/* 2. CHARTS SECTION: Time Series & Activity Breakdown */}
        <section id="analytics-charts" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Chart: Acessos & Cadastros ao Longo do Tempo (2 cols) */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400" />
                  Evolução de Acessos e Novos Cadastros
                </h3>
                <p className="text-xs text-slate-400">Linha temporal com volume de visitas, eventos de uso e registros</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-500 inline-block"></span>
                  <span className="text-slate-300">Visitas</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span>
                  <span className="text-slate-300">Cadastros</span>
                </div>
              </div>
            </div>

            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0}/>
                    </linearGradient>
                    <linearGradient id="colorCadastros" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="displayDate" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="visitas" name="Visitas" stroke="#F59E0B" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVisits)" />
                  <Area type="monotone" dataKey="cadastros" name="Cadastros" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCadastros)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Secondary Chart: Status de Atividade dos Barbeiros (1 col) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-emerald-400" />
                Status de Atividade
              </h3>
              <p className="text-xs text-slate-400 mb-4">Engajamento real das barbearias cadastradas</p>

              <div className="h-44 w-full flex items-center justify-center">
                {statusPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {statusPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '10px', fontSize: '11px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-slate-500">Sem dados de status no momento</p>
                )}
              </div>
            </div>

            {/* Status Legend & Summary */}
            <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  Ativas (≤ 7 dias)
                </span>
                <span className="font-bold text-white">{activityCounts.active}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  Pouco ativas (8-30 dias)
                </span>
                <span className="font-bold text-white">{activityCounts.lowActivity}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  Inativas (&gt; 30 dias)
                </span>
                <span className="font-bold text-white">{activityCounts.inactive}</span>
              </div>
            </div>
          </div>

        </section>

        {/* 3. FUNIL DE CONVERSÃO INTERATIVO */}
        <section id="analytics-conversion-funnel" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Funil de Conversão & Retenção</h3>
                <span className="text-[11px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-md font-semibold">
                  Jornada Completa do Usuário
                </span>
              </div>
              <p className="text-xs text-slate-400">Progresso dos visitantes desde o 1º clique até a utilização contínua da ferramenta</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
            {conversionFunnel.map((stage, idx) => (
              <div 
                key={stage.id} 
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between relative group hover:border-amber-500/50 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-300">{stage.title}</span>
                    <span className="text-xs font-black text-amber-400">{stage.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 mb-3 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(stage.percentage, 4)}%` }}
                    ></div>
                  </div>
                  <div className="text-2xl font-black text-white mb-1">{stage.count}</div>
                  <p className="text-[10px] text-slate-500 leading-tight">{stage.description}</p>
                </div>

                {idx > 0 && stage.dropoffPercentage !== undefined && stage.dropoffPercentage > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-rose-400">
                    <span>Perda na etapa:</span>
                    <span className="font-semibold">-{stage.dropoffPercentage}%</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 4. ORIGEM DOS ACESSOS & CAMPANHAS UTM */}
        <section id="analytics-traffic-sources" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Table: Origem dos Acessos (utm_source) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-amber-400" />
                  Origem dos Acessos (UTM Source)
                </h3>
                <p className="text-xs text-slate-400">Canais que mais geram visitas e cadastros para o CortesTime</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="pb-3">Canal / Origem</th>
                    <th className="pb-3 text-center">Visitas</th>
                    <th className="pb-3 text-center">Cadastros</th>
                    <th className="pb-3 text-right">Taxa de Conversão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {sourceMetrics.length > 0 ? (
                    sourceMetrics.map((src, i) => {
                      const badge = getSourceBadge(src.source);
                      return (
                        <tr key={`src-metric-${src.source}-${i}`} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 font-medium text-slate-200 flex items-center gap-2">
                            <span className="text-sm">{badge.icon}</span>
                            <span className="capitalize">{badge.label}</span>
                            <span className="text-[10px] text-slate-500 font-mono">({src.source})</span>
                          </td>
                          <td className="py-3 text-center font-bold text-white">{src.visits}</td>
                          <td className="py-3 text-center font-bold text-emerald-400">{src.signups}</td>
                          <td className="py-3 text-right font-bold text-amber-400">{src.conversionRate}%</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-500">
                        Nenhuma visita com parâmetro UTM registrada ainda no período.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table: Campanhas de Divulgação (utm_campaign) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Tag className="w-4 h-4 text-purple-400" />
                  Campanhas de Divulgação (UTM Campaign)
                </h3>
                <p className="text-xs text-slate-400">Desempenho de cada campanha ou grupo específico</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="pb-3">Campanha</th>
                    <th className="pb-3">Origem</th>
                    <th className="pb-3 text-center">Cliques</th>
                    <th className="pb-3 text-right">Cadastros</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {campaignMetrics.length > 0 ? (
                    campaignMetrics.map((camp, i) => (
                      <tr key={`camp-metric-${camp.campaign}-${camp.source}-${i}`} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 font-semibold text-purple-300 flex items-center gap-1.5">
                          <Tag className="w-3 h-3 text-purple-400" />
                          <span>{camp.campaign}</span>
                        </td>
                        <td className="py-3 text-slate-300 capitalize">{camp.source}</td>
                        <td className="py-3 text-center font-bold text-white">{camp.visits}</td>
                        <td className="py-3 text-right font-bold text-emerald-400">{camp.signups}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-500">
                        Nenhuma campanha com <code className="text-purple-400 font-mono text-[10px]">utm_campaign</code> registrada ainda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </section>

        {/* 5. TABELA COMPLETA DE BARBEARIAS: STATUS DE ATIVIDADE & RAIO-X */}
        <section id="analytics-merchants-table" className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                Status e Engajamento das Barbearias
              </h3>
              <p className="text-xs text-slate-400">
                Acompanhe o status de atividade (🟢 Ativa, 🟡 Pouco ativa, 🔴 Inativa), frequência e histórico de cada usuário
              </p>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar barbearia, email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-950 border border-slate-800 focus:border-amber-500 text-white text-xs rounded-xl pl-9 pr-3 py-2 outline-none w-56 transition-all"
                />
              </div>

              {/* Status Filter Dropdown */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 outline-none"
              >
                <option value="all">Todos os Status</option>
                <option value="active">🟢 Ativas (≤ 7 dias)</option>
                <option value="low_activity">🟡 Pouco ativas (8-30 dias)</option>
                <option value="inactive">🔴 Inativas (&gt; 30 dias)</option>
              </select>

              {/* Source Filter Dropdown */}
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 outline-none capitalize"
              >
                <option value="all">Todas as Origens</option>
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="google">Google</option>
                <option value="direto">Direto</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px] bg-slate-950/40">
                  <th className="py-3 px-4">Barbearia & Proprietário</th>
                  <th className="py-3 px-4">Status de Atividade</th>
                  <th className="py-3 px-4">Origem do Cadastro</th>
                  <th className="py-3 px-4">Último Acesso</th>
                  <th className="py-3 px-4">Última Atividade</th>
                  <th className="py-3 px-4">Frequência (30d)</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTableMerchants.length > 0 ? (
                  filteredTableMerchants.map((summary, summaryIdx) => {
                    const m = summary.merchant;
                    const statusBadge = getStatusBadge(summary.status);
                    const sourceBadge = getSourceBadge(m.utmSource);
                    const StatusIcon = statusBadge.icon;

                    return (
                      <tr key={m.uid || m.email || `merchant-summary-${summaryIdx}`} className="hover:bg-slate-800/40 transition-colors">
                        
                        {/* Barbearia & Contato */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white text-sm">{m.nomeBarbearia || 'Sem nome'}</div>
                          <div className="text-slate-400 text-[11px]">{m.nomeProprietario || 'Proprietário'}</div>
                          <div className="text-slate-500 text-[10px] font-mono">{m.email}</div>
                        </td>

                        {/* Status de Atividade Badge */}
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusBadge.badge}`}>
                            <span className={`w-2 h-2 rounded-full ${statusBadge.dot}`}></span>
                            {statusBadge.label}
                          </span>
                        </td>

                        {/* Origem / UTM */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${sourceBadge.bg}`}>
                              {sourceBadge.label}
                            </span>
                          </div>
                          {m.utmCampaign && (
                            <div className="text-[10px] text-purple-400 font-mono mt-0.5 flex items-center gap-1">
                              <Tag className="w-2.5 h-2.5" /> {m.utmCampaign}
                            </div>
                          )}
                        </td>

                        {/* Último Acesso */}
                        <td className="py-3.5 px-4 text-slate-300">
                          {summary.lastAccessFormatted}
                        </td>

                        {/* Última Atividade */}
                        <td className="py-3.5 px-4">
                          <span className="text-slate-200 font-medium">{summary.lastActivityFormatted}</span>
                        </td>

                        {/* Frequência (dias ativos nos últimos 30 dias) */}
                        <td className="py-3.5 px-4">
                          <span className="bg-slate-800 text-slate-200 font-semibold px-2 py-1 rounded-lg text-xs">
                            {summary.activeDays30d} {summary.activeDays30d === 1 ? 'dia' : 'dias'}
                          </span>
                        </td>

                        {/* Ações: Ver Raio-X & Apagar */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedMerchantSummary(summary)}
                              className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                              title="Ver Raio-X de Atividade"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Raio-X</span>
                            </button>
                            <button
                              onClick={() => {
                                setMerchantToDelete(m);
                                setDeleteConfirmInput('');
                              }}
                              className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/25 text-red-400 hover:text-red-300 border border-red-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1 active:scale-95 cursor-pointer"
                              title="Apagar permanentemente a conta e dados desta barbearia"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Apagar</span>
                            </button>
                          </div>
                        </td>

                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      Nenhuma barbearia encontrada com os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </main>

      {/* 6. MODAL INDIVIDUAL / RAIO-X DA BARBEARIA */}
      <AnimatePresence>
        {selectedMerchantSummary && (
          <div id="merchant-raio-x-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-slate-100"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-800 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl font-black text-white">{selectedMerchantSummary.merchant.nomeBarbearia}</h2>
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${getStatusBadge(selectedMerchantSummary.status).badge}`}>
                      {getStatusBadge(selectedMerchantSummary.status).label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Proprietário: <strong className="text-slate-200">{selectedMerchantSummary.merchant.nomeProprietario}</strong> • {selectedMerchantSummary.merchant.email}
                  </p>
                  {selectedMerchantSummary.merchant.whatsapp && (
                    <a
                      href={`https://wa.me/55${selectedMerchantSummary.merchant.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline mt-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp: {selectedMerchantSummary.merchant.whatsapp}
                    </a>
                  )}
                </div>

                <button
                  onClick={() => setSelectedMerchantSummary(null)}
                  className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Attribution / Origin Details Card */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
                  <Compass className="w-4 h-4" /> Origem do Cadastro & Parâmetros UTM
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Origem (utm_source):</span>
                    <span className="font-bold text-white capitalize">{selectedMerchantSummary.merchant.utmSource || 'Direto / Orgânico'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Meio (utm_medium):</span>
                    <span className="font-bold text-white">{selectedMerchantSummary.merchant.utmMedium || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Campanha (utm_campaign):</span>
                    <span className="font-bold text-purple-300">{selectedMerchantSummary.merchant.utmCampaign || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Primeira Visita:</span>
                    <span className="text-slate-300">{analyticsTracker.formatExactDate(selectedMerchantSummary.merchant.firstVisitAt || selectedMerchantSummary.merchant.criadoEm)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Data do Cadastro:</span>
                    <span className="text-slate-300">{analyticsTracker.formatExactDate(selectedMerchantSummary.merchant.criadoEm)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Último Acesso:</span>
                    <span className="text-slate-300">{selectedMerchantSummary.lastAccessFormatted}</span>
                  </div>
                </div>
              </div>

              {/* Operational Metrics Numbers */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Agendamentos</span>
                  <span className="text-xl font-black text-amber-400">{selectedMerchantSummary.totalAppointments}</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Clientes</span>
                  <span className="text-xl font-black text-blue-400">{selectedMerchantSummary.totalClients}</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Profissionais</span>
                  <span className="text-xl font-black text-purple-400">{selectedMerchantSummary.totalBarbers}</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Serviços</span>
                  <span className="text-xl font-black text-emerald-400">{selectedMerchantSummary.totalServices}</span>
                </div>
              </div>

              {/* Usage Frequency Breakdown */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-400" /> Frequência de Utilização
                </h4>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-3">
                    <span className="text-[10px] text-slate-500 block">Últimos 7 dias</span>
                    <span className="text-lg font-black text-emerald-400">{selectedMerchantSummary.activeDays7d} dias ativos</span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-3">
                    <span className="text-[10px] text-slate-500 block">Últimos 30 dias</span>
                    <span className="text-lg font-black text-amber-400">{selectedMerchantSummary.activeDays30d} dias ativos</span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-3">
                    <span className="text-[10px] text-slate-500 block">Últimos 90 dias</span>
                    <span className="text-lg font-black text-blue-400">{selectedMerchantSummary.activeDays90d} dias ativos</span>
                  </div>
                </div>
              </div>

              {/* Event Timeline */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-400" /> Linha do Tempo de Atividades Recentes
                </h4>
                
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {selectedMerchantSummary.recentEvents && selectedMerchantSummary.recentEvents.length > 0 ? (
                    selectedMerchantSummary.recentEvents.map((ev, evIdx) => (
                      <div key={ev.id || `recent-ev-${ev.eventType}-${evIdx}`} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                          <span className="font-semibold text-slate-200">{ev.eventLabel}</span>
                          <span className="text-[10px] text-slate-500 font-mono">({ev.eventType})</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {analyticsTracker.formatTimeAgo(ev.timestamp)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-center text-xs text-slate-500">
                      Nenhum evento registrado ainda além do cadastro inicial.
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => {
                    if (selectedMerchantSummary) {
                      setMerchantToDelete(selectedMerchantSummary.merchant);
                      setDeleteConfirmInput('');
                    }
                  }}
                  className="px-4 py-2 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Apagar Barbearia</span>
                </button>

                <button
                  onClick={() => setSelectedMerchantSummary(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Fechar Raio-X
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. MODAL DE CONFIRMAÇÃO DE EXCLUSÃO DE CONTA */}
      <AnimatePresence>
        {merchantToDelete && (
          <div id="analytics-delete-merchant-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-red-500/40 rounded-2xl w-full max-w-md shadow-2xl p-6 text-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-base font-extrabold text-red-400 flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-500" />
                  <span>Apagar Barbearia do Firebase</span>
                </h3>
                <button
                  onClick={() => {
                    setMerchantToDelete(null);
                    setDeleteConfirmInput('');
                  }}
                  className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="bg-red-950/40 border border-red-800/60 rounded-xl p-3 space-y-1">
                  <p className="font-bold text-white text-sm">
                    {merchantToDelete.nomeBarbearia || 'Sem Nome'}
                  </p>
                  <p className="text-[11px] text-red-300">
                    Proprietário: {merchantToDelete.nomeProprietario || 'N/I'} • {merchantToDelete.email}
                  </p>
                </div>

                <p className="leading-relaxed">
                  Esta ação excluirá <strong>permanentemente todos os registros</strong> associados (serviços, agendamentos, clientes, fila e vitrine) do banco de dados.
                </p>
                <p className="text-slate-400 italic">
                  💡 Liberará o e-mail e dados para você poder refazer o cadastro do zero e testar o sistema.
                </p>

                <div className="pt-2">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Para confirmar, digite <span className="text-red-400 font-black underline">EXCLUIR</span> abaixo:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmInput}
                    onChange={e => setDeleteConfirmInput(e.target.value)}
                    placeholder="EXCLUIR"
                    className="w-full p-3 bg-slate-950 border border-red-500/50 rounded-xl font-mono text-center text-sm font-bold text-red-400 focus:outline-none focus:border-red-400"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMerchantToDelete(null);
                    setDeleteConfirmInput('');
                  }}
                  className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-3 rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteMerchant}
                  disabled={isDeletingMerchant || deleteConfirmInput.trim().toUpperCase() !== 'EXCLUIR'}
                  className="w-1/2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-3 rounded-xl transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-1.5 shadow-lg shadow-red-900/30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeletingMerchant ? 'Apagando...' : 'Apagar Tudo'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
