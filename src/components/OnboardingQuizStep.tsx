import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Calendar, 
  Users, 
  Layers, 
  Scissors, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  ShieldCheck, 
  TrendingUp, 
  MessageSquare, 
  Clock, 
  Flame, 
  Zap, 
  Crown, 
  CreditCard, 
  QrCode, 
  Award, 
  Star,
  CheckCheck,
  ChevronRight,
  HelpCircle,
  Phone
} from 'lucide-react';
import LogoIcon from './LogoIcon';
import MercadoPagoCheckout from './MercadoPagoCheckout';
import { MerchantUser, ServiceMode } from '../types';
import { firebaseService } from '../services/firebaseService';

interface OnboardingQuizStepProps {
  merchant: MerchantUser;
  onComplete: (updatedMerchant: MerchantUser) => void;
  onBackToLanding?: () => void;
}

export default function OnboardingQuizStep({
  merchant,
  onComplete,
  onBackToLanding
}: OnboardingQuizStepProps) {
  // Quiz progress: 1: Nome da Barbearia, 2: Modo de Atendimento, 3: Tamanho da Equipe, 4: Objetivo, 5: Análise, 6: Assinatura/Planos
  const [quizStep, setQuizStep] = useState<number>(1);
  
  // Quiz form state
  const [nomeBarbearia, setNomeBarbearia] = useState<string>(merchant.nomeBarbearia !== 'Minha Barbearia' ? merchant.nomeBarbearia : '');
  const [serviceMode, setServiceMode] = useState<ServiceMode>('ambos');
  const [teamSize, setTeamSize] = useState<string>('solo'); // 'solo' | 'small' | 'large'
  const [mainObjective, setMainObjective] = useState<string>('organizar_agenda');
  
  // Analysis step animation
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [analysisText, setAnalysisText] = useState<string>('Criando o perfil da sua barbearia...');

  // Subscription / Checkout modal state
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; price: number; period: string } | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [billingCycle, setBillingCycle] = useState<'trimestral' | 'mensal' | 'anual'>('trimestral');

  // Trigger analysis progression when reaching step 5
  useEffect(() => {
    if (quizStep === 5) {
      setAnalysisProgress(15);
      setAnalysisText(`Personalizando módulo para ${nomeBarbearia || 'sua barbearia'}...`);

      const t1 = setTimeout(() => {
        setAnalysisProgress(50);
        const modeLabel = serviceMode === 'agendamento' 
          ? 'Agendamento com Hora Marcada' 
          : serviceMode === 'ordem_chegada' 
          ? 'Fila por Ordem de Chegada' 
          : 'Agendamento + Fila Digital';
        setAnalysisText(`Configurando ${modeLabel}...`);
      }, 900);

      const t2 = setTimeout(() => {
        setAnalysisProgress(85);
        setAnalysisText('Otimizando lembretes no WhatsApp e controle de caixa...');
      }, 1800);

      const t3 = setTimeout(() => {
        setAnalysisProgress(100);
        setAnalysisText('Tudo pronto! Selecione o seu plano Pro.');
      }, 2600);

      const t4 = setTimeout(() => {
        setQuizStep(6);
      }, 3100);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    }
  }, [quizStep, nomeBarbearia, serviceMode]);

  // Handle saving quiz data
  const handleSaveQuizAndProceed = async (planoToSet?: 'pro' | 'vitrine' | 'pro_trial') => {
    setIsUpdating(true);
    try {
      const finalShopName = nomeBarbearia.trim() || merchant.nomeBarbearia || 'Minha Barbearia';
      const updatedData: Partial<MerchantUser> = {
        nomeBarbearia: finalShopName,
        plano: planoToSet || merchant.plano || 'pro_trial',
        onboardingCompleted: true,
        vitrineModoAcao: serviceMode === 'ambos' ? 'ambos' : serviceMode === 'ordem_chegada' ? 'whatsapp' : 'agendamento',
        onboardingData: {
          fullName: merchant.nomeProprietario,
          cellphone: merchant.whatsapp,
          email: merchant.email,
          businessName: finalShopName,
          serviceMode: serviceMode,
          objectives: [mainObjective],
          cep: '',
          neighborhood: '',
          street: '',
          number: '',
          complement: ''
        }
      };

      await firebaseService.updateMerchantProfile(merchant.uid, updatedData);
      
      const updatedMerchant: MerchantUser = {
        ...merchant,
        ...updatedData
      };
      
      localStorage.setItem('cortestime_merchant_session', JSON.stringify(updatedMerchant));
      onComplete(updatedMerchant);
    } catch (err) {
      console.error("Error saving quiz profile:", err);
      // Fallback local completion
      const updatedMerchant: MerchantUser = {
        ...merchant,
        nomeBarbearia: nomeBarbearia.trim() || merchant.nomeBarbearia,
        onboardingCompleted: true
      };
      localStorage.setItem('cortestime_merchant_session', JSON.stringify(updatedMerchant));
      onComplete(updatedMerchant);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNextFromStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeBarbearia.trim()) {
      alert("Por favor, digite o nome da sua barbearia.");
      return;
    }
    setQuizStep(2);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-brand-dark flex flex-col justify-between py-6 px-4 relative overflow-x-hidden" id="onboarding-quiz-container">
      
      {/* Ambient background glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-blue/5 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-lime/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* HEADER */}
      <header className="max-w-2xl mx-auto w-full flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          {quizStep > 1 && quizStep < 5 && (
            <button 
              onClick={() => setQuizStep(prev => prev - 1)}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors cursor-pointer"
              title="Voltar pergunta anterior"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          
          <div className="flex items-center gap-1.5">
            <LogoIcon className="w-6 h-6" />
            <span className="font-sans font-extrabold text-lg text-[#051b42]">Cortestime</span>
          </div>
        </div>

        {quizStep < 5 ? (
          <div className="flex items-center gap-2">
            <div className="text-xs font-bold text-gray-500">
              Etapa <span className="text-brand-blue">{quizStep}</span> de 4
            </div>
            <div className="w-20 bg-gray-200 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-brand-blue h-full transition-all duration-300 rounded-full"
                style={{ width: `${(quizStep / 4) * 100}%` }}
              />
            </div>
          </div>
        ) : quizStep === 6 ? (
          <span className="bg-amber-100 text-amber-900 border border-amber-300/60 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
            <Crown className="w-3.5 h-3.5 text-amber-600" />
            Plano Pro
          </span>
        ) : null}
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex items-center justify-center py-6">
        <div className="w-full max-w-2xl">
          
          <AnimatePresence mode="wait">
            
            {/* ETAPA 1: NOME DA BARBEARIA */}
            {quizStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-3xl border border-gray-100 p-6 md:p-10 shadow-sm text-left space-y-6"
              >
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-blue/10 text-brand-blue rounded-full text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Passo 1 • Identidade</span>
                  </div>
                  <h2 className="font-display font-bold text-2xl md:text-3xl text-brand-dark">
                    Qual é o nome da sua barbearia?
                  </h2>
                  <p className="text-sm text-gray-500">
                    Esse é o nome que seus clientes verão na sua agenda online e nas mensagens de confirmação do WhatsApp.
                  </p>
                </div>

                <form onSubmit={handleNextFromStep1} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                      Nome da Barbearia ou Espaço
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-brand-blue">
                        <Building2 className="w-5 h-5" />
                      </span>
                      <input 
                        type="text" 
                        required
                        autoFocus
                        value={nomeBarbearia}
                        onChange={e => setNomeBarbearia(e.target.value)}
                        placeholder="Ex: Barbearia Imperial, Studio Barber..."
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-200 focus:border-brand-blue focus:outline-none transition-colors text-base font-semibold text-brand-dark bg-gray-50/50"
                        id="input-quiz-nome-barbearia"
                      />
                    </div>
                  </div>

                  {/* Sugestões rápidas de complemento se estiver vazio */}
                  {!nomeBarbearia && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="text-xs text-gray-400 self-center">Sugestões:</span>
                      {['Barbearia VIP', 'Studio Barber', 'Navalha de Ouro', 'Barbearia Prime'].map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setNomeBarbearia(sug)}
                          className="px-3 py-1 bg-gray-100 hover:bg-brand-blue/10 hover:text-brand-blue text-gray-600 rounded-full text-xs font-medium transition-colors cursor-pointer"
                        >
                          + {sug}
                        </button>
                      ))}
                    </div>
                  )}

                  <button 
                    type="submit"
                    className="w-full bg-brand-blue hover:bg-brand-blue-light text-white font-extrabold py-4 px-6 rounded-2xl shadow-lg shadow-brand-blue/20 transition-all uppercase text-xs tracking-wider flex items-center justify-center gap-2 cursor-pointer mt-4"
                    id="btn-quiz-next-1"
                  >
                    <span>Continuar</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </motion.div>
            )}

            {/* ETAPA 2: MODO DE ATENDIMENTO (AGENDAMENTO / ORDEM DE CHEGADA / AMBOS) */}
            {quizStep === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-3xl border border-gray-100 p-6 md:p-10 shadow-sm text-left space-y-6"
              >
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-blue/10 text-brand-blue rounded-full text-xs font-bold uppercase tracking-wider">
                    <Scissors className="w-3.5 h-3.5" />
                    <span>Passo 2 • Modelo de Atendimento</span>
                  </div>
                  <h2 className="font-display font-bold text-2xl md:text-3xl text-brand-dark">
                    Como sua barbearia costuma atender?
                  </h2>
                  <p className="text-sm text-gray-500">
                    Personalizaremos o fluxo de agendamento e a fila de clientes de acordo com sua preferência.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3.5">
                  
                  {/* Opção 1: Por Agendamento */}
                  <div 
                    onClick={() => setServiceMode('agendamento')}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                      serviceMode === 'agendamento'
                        ? 'bg-[#f0f7ff] border-brand-blue shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    id="opt-quiz-agendamento"
                  >
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                      serviceMode === 'agendamento'
                        ? 'bg-brand-blue text-white shadow-sm'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      <Calendar className="w-5 h-5" />
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-base text-brand-dark">Por Agendamento</h4>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          serviceMode === 'agendamento'
                            ? 'border-brand-blue bg-brand-blue text-white'
                            : 'border-gray-300 bg-white'
                        }`}>
                          {serviceMode === 'agendamento' && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Clientes escolhem o dia, horário e o barbeiro de preferência com hora marcada.
                      </p>
                    </div>
                  </div>

                  {/* Opção 2: Por Ordem de Chegada */}
                  <div 
                    onClick={() => setServiceMode('ordem_chegada')}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                      serviceMode === 'ordem_chegada'
                        ? 'bg-[#f0f7ff] border-brand-blue shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    id="opt-quiz-ordem-chegada"
                  >
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                      serviceMode === 'ordem_chegada'
                        ? 'bg-brand-blue text-white shadow-sm'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      <Users className="w-5 h-5" />
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-base text-brand-dark">Por Ordem de Chegada</h4>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          serviceMode === 'ordem_chegada'
                            ? 'border-brand-blue bg-brand-blue text-white'
                            : 'border-gray-300 bg-white'
                        }`}>
                          {serviceMode === 'ordem_chegada' && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Clientes entram em uma fila digital/presencial e são chamados na vez deles.
                      </p>
                    </div>
                  </div>

                  {/* Opção 3: Ambos / Os dois */}
                  <div 
                    onClick={() => setServiceMode('ambos')}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                      serviceMode === 'ambos'
                        ? 'bg-[#f0f7ff] border-brand-blue shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                    id="opt-quiz-ambos"
                  >
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                      serviceMode === 'ambos'
                        ? 'bg-brand-blue text-white shadow-sm'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      <Layers className="w-5 h-5" />
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-base text-brand-dark">Ambos (Os dois)</h4>
                          <span className="text-[10px] bg-brand-lime text-brand-dark font-extrabold px-2 py-0.5 rounded-md uppercase">
                            Recomendado
                          </span>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          serviceMode === 'ambos'
                            ? 'border-brand-blue bg-brand-blue text-white'
                            : 'border-gray-300 bg-white'
                        }`}>
                          {serviceMode === 'ambos' && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Permite que clientes façam agendamento antecipado e também gerencia clientes de encaixe/fila.
                      </p>
                    </div>
                  </div>

                </div>

                <button 
                  onClick={() => setQuizStep(3)}
                  className="w-full bg-brand-blue hover:bg-brand-blue-light text-white font-extrabold py-4 px-6 rounded-2xl shadow-lg shadow-brand-blue/20 transition-all uppercase text-xs tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                  id="btn-quiz-next-2"
                >
                  <span>Continuar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* ETAPA 3: TAMANHO DA EQUIPE */}
            {quizStep === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-3xl border border-gray-100 p-6 md:p-10 shadow-sm text-left space-y-6"
              >
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-blue/10 text-brand-blue rounded-full text-xs font-bold uppercase tracking-wider">
                    <Users className="w-3.5 h-3.5" />
                    <span>Passo 3 • Estrutura</span>
                  </div>
                  <h2 className="font-display font-bold text-2xl md:text-3xl text-brand-dark">
                    Quantos profissionais atendem no seu espaço?
                  </h2>
                  <p className="text-sm text-gray-500">
                    O Cortestime permite gerenciar múltiplos barbeiros e comissões automáticas.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  
                  {/* Solo */}
                  <div 
                    onClick={() => setTeamSize('solo')}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer text-center space-y-3 flex flex-col justify-between ${
                      teamSize === 'solo'
                        ? 'bg-[#f0f7ff] border-brand-blue shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="mx-auto w-12 h-12 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
                      <Scissors className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-brand-dark">Apenas Eu</h4>
                      <p className="text-xs text-gray-500 mt-1">Atendimento individual / Solo</p>
                    </div>
                    <div className={`w-5 h-5 mx-auto rounded-full border-2 flex items-center justify-center transition-all ${
                      teamSize === 'solo' ? 'border-brand-blue bg-brand-blue text-white' : 'border-gray-300'
                    }`}>
                      {teamSize === 'solo' && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>

                  {/* 2 a 4 Barbeiros */}
                  <div 
                    onClick={() => setTeamSize('small')}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer text-center space-y-3 flex flex-col justify-between ${
                      teamSize === 'small'
                        ? 'bg-[#f0f7ff] border-brand-blue shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="mx-auto w-12 h-12 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-brand-dark">2 a 4 Barbeiros</h4>
                      <p className="text-xs text-gray-500 mt-1">Equipe em crescimento</p>
                    </div>
                    <div className={`w-5 h-5 mx-auto rounded-full border-2 flex items-center justify-center transition-all ${
                      teamSize === 'small' ? 'border-brand-blue bg-brand-blue text-white' : 'border-gray-300'
                    }`}>
                      {teamSize === 'small' && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>

                  {/* 5 ou mais */}
                  <div 
                    onClick={() => setTeamSize('large')}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer text-center space-y-3 flex flex-col justify-between ${
                      teamSize === 'large'
                        ? 'bg-[#f0f7ff] border-brand-blue shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="mx-auto w-12 h-12 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-brand-dark">5 ou mais</h4>
                      <p className="text-xs text-gray-500 mt-1">Grande barbearia / Unidades</p>
                    </div>
                    <div className={`w-5 h-5 mx-auto rounded-full border-2 flex items-center justify-center transition-all ${
                      teamSize === 'large' ? 'border-brand-blue bg-brand-blue text-white' : 'border-gray-300'
                    }`}>
                      {teamSize === 'large' && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>

                </div>

                <button 
                  onClick={() => setQuizStep(4)}
                  className="w-full bg-brand-blue hover:bg-brand-blue-light text-white font-extrabold py-4 px-6 rounded-2xl shadow-lg shadow-brand-blue/20 transition-all uppercase text-xs tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                  id="btn-quiz-next-3"
                >
                  <span>Continuar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* ETAPA 4: PRINCIPAL OBJETIVO */}
            {quizStep === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-3xl border border-gray-100 p-6 md:p-10 shadow-sm text-left space-y-6"
              >
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-blue/10 text-brand-blue rounded-full text-xs font-bold uppercase tracking-wider">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Passo 4 • Prioridade</span>
                  </div>
                  <h2 className="font-display font-bold text-2xl md:text-3xl text-brand-dark">
                    Qual o seu maior foco no momento?
                  </h2>
                  <p className="text-sm text-gray-500">
                    Selecione o que você mais precisa melhorar para que possamos ativar os atalhos ideais.
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    { id: 'organizar_agenda', label: 'Eliminar furos e organizar horários', desc: 'Evite cancelamentos de última hora e tenha previsibilidade diária.', icon: Calendar },
                    { id: 'lembretes_whatsapp', label: 'Lembretes automáticos no WhatsApp', desc: 'Envio de confirmações automáticas para o cliente não esquecer o horário.', icon: MessageSquare },
                    { id: 'financeiro_comissoes', label: 'Controle de caixa e comissões da equipe', desc: 'Relatórios claros de faturamento diário, mensal e divisão justa.', icon: TrendingUp },
                    { id: 'vitrine_clientes', label: 'Divulgar serviços e atrair novos clientes', desc: 'Link personalizado no Instagram e Google para agendamento direto.', icon: Sparkles },
                  ].map(item => {
                    const IconComp = item.icon;
                    const isSelected = mainObjective === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setMainObjective(item.id)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3.5 ${
                          isSelected
                            ? 'bg-[#f0f7ff] border-brand-blue shadow-sm'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-brand-blue text-white' : 'bg-gray-100 text-gray-500'}`}>
                            <IconComp className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-brand-dark">{item.label}</h4>
                            <p className="text-xs text-gray-500 leading-snug">{item.desc}</p>
                          </div>
                        </div>

                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          isSelected ? 'border-brand-blue bg-brand-blue text-white' : 'border-gray-300'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button 
                  onClick={() => setQuizStep(5)}
                  className="w-full bg-brand-lime hover:bg-brand-lime-dark text-brand-dark font-extrabold py-4 px-6 rounded-2xl shadow-lg shadow-brand-lime/30 transition-all uppercase text-xs tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                  id="btn-quiz-finish-analysis"
                >
                  <Sparkles className="w-4 h-4 text-brand-dark" />
                  <span>Configurar Minha Barbearia</span>
                </button>
              </motion.div>
            )}

            {/* ETAPA 5: ANIMAÇÃO DE ANÁLISE E CONFIGURAÇÃO */}
            {quizStep === 5 && (
              <motion.div
                key="step-5"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="bg-white rounded-3xl border border-gray-100 p-8 md:p-12 shadow-md text-center space-y-6 max-w-lg mx-auto"
              >
                <div className="relative w-20 h-20 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-brand-blue/20 animate-ping" />
                  <div className="w-20 h-20 rounded-full bg-brand-blue text-white flex items-center justify-center shadow-lg shadow-brand-blue/30 relative">
                    <Sparkles className="w-9 h-9 animate-pulse" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-display font-extrabold text-2xl text-brand-dark">
                    Personalizando o Cortestime...
                  </h3>
                  <p className="text-xs text-gray-500 min-h-[36px] flex items-center justify-center font-medium">
                    {analysisText}
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden p-0.5 border border-gray-200">
                    <motion.div 
                      className="bg-gradient-to-r from-brand-blue to-brand-lime h-full rounded-full transition-all duration-500"
                      style={{ width: `${analysisProgress}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-bold text-gray-400">
                    {analysisProgress}% concluído
                  </span>
                </div>

                <div className="p-3.5 bg-blue-50/80 rounded-2xl text-left flex items-start gap-3 border border-blue-100 text-xs text-blue-900">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-blue-950">Módulos selecionados:</span>
                    <span>
                      {serviceMode === 'ambos' ? 'Agendamentos + Fila por ordem de chegada' : serviceMode === 'agendamento' ? 'Agendamentos online' : 'Fila digital por ordem de chegada'} para <strong className="text-blue-950">{nomeBarbearia || 'sua barbearia'}</strong>.
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ETAPA 6: SELEÇÃO DE PLANO & ASSINATURA */}
            {quizStep === 6 && (
              <motion.div
                key="step-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Header Promocional */}
                <div className="bg-[#051b42] text-white rounded-3xl p-6 md:p-8 text-center space-y-3 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl -z-0 pointer-events-none" />
                  
                  <div className="relative z-10 space-y-2">
                    <span className="bg-amber-400 text-[#051b42] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block shadow-sm">
                      Configuração Concluída para {nomeBarbearia || 'sua Barbearia'}
                    </span>
                    <h2 className="font-display font-extrabold text-2xl md:text-3xl text-white">
                      Escolha seu plano Cortestime Pro
                    </h2>
                    <p className="text-xs text-gray-300 max-w-lg mx-auto leading-relaxed">
                      Ative imediatamente a sua agenda digital, envie lembretes no WhatsApp para seus clientes e tenha controle total do faturamento.
                    </p>
                  </div>
                </div>

                {/* Planos Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                  
                  {/* PLANO MENSAL */}
                  <div className="bg-white border-2 border-gray-200 rounded-3xl p-6 flex flex-col justify-between space-y-4 hover:border-gray-300 transition-all shadow-sm">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
                          Mensal
                        </span>
                      </div>
                      
                      <div className="space-y-0.5">
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-bold text-gray-500">R$</span>
                          <span className="text-3xl font-black text-brand-dark">19,90</span>
                          <span className="text-xs text-gray-500">/mês</span>
                        </div>
                        <p className="text-[11px] text-gray-400">Cobrado mensalmente</p>
                      </div>

                      <div className="border-t border-gray-100 pt-3 space-y-2 text-xs text-gray-600">
                        <div className="flex gap-2 items-start">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>Agendamentos Ilimitados</span>
                        </div>
                        <div className="flex gap-2 items-start">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>Vitrine Virtual Completa</span>
                        </div>
                        <div className="flex gap-2 items-start">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>Gestão de Clientes</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedPlan({ name: 'Mensal', price: 19.90, period: 'mês' });
                      }}
                      className="w-full bg-gray-900 hover:bg-black text-white font-extrabold py-3.5 rounded-xl text-xs uppercase cursor-pointer transition-colors shadow-sm text-center"
                      id="btn-assinar-mensal"
                    >
                      Assinar Mensal
                    </button>
                  </div>

                  {/* PLANO TRIMESTRAL (DESTAQUE) */}
                  <div className="bg-[#051b42] text-white border-2 border-amber-400 rounded-3xl p-6 flex flex-col justify-between space-y-4 relative shadow-xl shadow-amber-500/10">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-[#051b42] text-[9px] font-black uppercase tracking-widest px-3.5 py-0.5 rounded-full shadow-md">
                      ⭐ Mais Escolhido
                    </div>

                    <div className="space-y-3 pt-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-extrabold text-amber-400 uppercase tracking-wider">
                          Trimestral (3 Meses)
                        </span>
                        <span className="text-[10px] bg-amber-400/20 text-amber-300 font-bold px-2 py-0.5 rounded-full">
                          16% OFF
                        </span>
                      </div>
                      
                      <div className="space-y-0.5">
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-bold text-amber-300">R$</span>
                          <span className="text-3xl font-black text-amber-400">49,90</span>
                          <span className="text-xs text-gray-300">/trimestre</span>
                        </div>
                        <p className="text-[11px] text-gray-300">Equivale a <strong>R$ 16,63/mês</strong></p>
                      </div>

                      <div className="border-t border-white/10 pt-3 space-y-2 text-xs text-gray-200">
                        <div className="flex gap-2 items-start">
                          <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <span>Agendamentos Ilimitados</span>
                        </div>
                        <div className="flex gap-2 items-start">
                          <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <span>Lembretes no WhatsApp</span>
                        </div>
                        <div className="flex gap-2 items-start">
                          <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <span>Controle de Caixa & Barbeiros</span>
                        </div>
                        <div className="flex gap-2 items-start">
                          <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <span>Fila por Ordem de Chegada</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedPlan({ name: 'Trimestral', price: 49.90, period: 'trimestre' });
                      }}
                      className="w-full bg-amber-400 hover:bg-amber-300 text-[#051b42] font-black py-3.5 rounded-xl text-xs uppercase cursor-pointer transition-colors shadow-lg shadow-amber-400/20 text-center"
                      id="btn-assinar-trimestral"
                    >
                      Contratar Trimestral
                    </button>
                  </div>

                  {/* PLANO ANUAL */}
                  <div className="bg-white border-2 border-emerald-400/60 rounded-3xl p-6 flex flex-col justify-between space-y-4 hover:border-emerald-500 transition-all shadow-sm">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wider">
                          Anual (12 Meses)
                        </span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          37% OFF
                        </span>
                      </div>
                      
                      <div className="space-y-0.5">
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-bold text-gray-500">R$</span>
                          <span className="text-3xl font-black text-brand-dark">149,90</span>
                          <span className="text-xs text-gray-500">/ano</span>
                        </div>
                        <p className="text-[11px] text-emerald-600 font-semibold">Equivale a <strong>R$ 12,49/mês</strong></p>
                      </div>

                      <div className="border-t border-gray-100 pt-3 space-y-2 text-xs text-gray-600">
                        <div className="flex gap-2 items-start">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>Tudo do Plano Pro Ilimitado</span>
                        </div>
                        <div className="flex gap-2 items-start">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>Suporte VIP Prioritário</span>
                        </div>
                        <div className="flex gap-2 items-start">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>Economia de 5 meses no ano</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedPlan({ name: 'Anual', price: 149.90, period: 'ano' });
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 rounded-xl text-xs uppercase cursor-pointer transition-colors shadow-sm text-center"
                      id="btn-assinar-anual"
                    >
                      Assinar Anual (Melhor Preço)
                    </button>
                  </div>

                </div>

                {/* Opção secundária / Transição direta */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 bg-white p-4 rounded-2xl border border-gray-200">
                  <div className="flex items-center gap-2 text-left">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Pagamento 100% seguro via <strong>Mercado Pago</strong> (Pix, Cartão de Crédito ou Boleto).</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSaveQuizAndProceed('pro_trial')}
                    disabled={isUpdating}
                    className="text-brand-blue hover:underline font-bold text-xs uppercase tracking-wide cursor-pointer shrink-0"
                    id="btn-entrar-direto-painel"
                  >
                    {isUpdating ? 'Salvando...' : 'Acessar Meu Painel Agora →'}
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

        </div>
      </main>

      {/* CHECKOUT MODAL VIA MERCADO PAGO */}
      {selectedPlan && (
        <MercadoPagoCheckout 
          planName={selectedPlan.name}
          price={selectedPlan.price}
          merchant={merchant}
          onPaymentSuccess={async () => {
            await handleSaveQuizAndProceed('pro');
          }}
          onClose={() => setSelectedPlan(null)}
        />
      )}

      {/* FOOTER */}
      <footer className="max-w-md mx-auto w-full text-center text-[11px] text-gray-400 pt-4">
        &copy; {new Date().getFullYear()} Cortestime Barber. Gestão completa para barbearias.
      </footer>
    </div>
  );
}
