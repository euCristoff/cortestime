import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import LogoIcon from './LogoIcon';
import InstallCortestimeStep from './InstallCortestimeStep';
import { 
  ArrowLeft, 
  MapPin, 
  Sparkles, 
  CheckCircle2, 
  Megaphone, 
  Calendar, 
  Globe, 
  Users, 
  FileText, 
  Wallet, 
  TrendingUp, 
  Building2, 
  ShieldAlert,
  Smartphone,
  Eye,
  Check,
  MessageSquare,
  BadgeAlert,
  Clock,
  Layers,
  Scissors
} from 'lucide-react';
import { OnboardingData } from '../types';
import { notificationService } from '../services/notificationService';

interface OnboardingWizardProps {
  initialData?: Partial<OnboardingData>;
  onComplete: (data: OnboardingData) => void;
  onBackToLanding: () => void;
}

export default function OnboardingWizard({ initialData, onComplete, onBackToLanding }: OnboardingWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(() => {
    if (initialData?.fullName && initialData?.cellphone && initialData?.email && initialData?.businessName) {
      return 2;
    }
    return 1;
  });
  const [termsAccepted, setTermsAccepted] = useState(!!initialData);
  
  // Step data
  const [formData, setFormData] = useState<OnboardingData>({
    fullName: initialData?.fullName || '',
    cellphone: initialData?.cellphone || '',
    email: initialData?.email || '',
    businessName: initialData?.businessName || '',
    serviceMode: initialData?.serviceMode || 'agendamento',
    objectives: initialData?.objectives || ['Organizar agenda'], // Pre-selected in screenshot 5
    cep: initialData?.cep || '',
    neighborhood: initialData?.neighborhood || '',
    street: initialData?.street || '',
    number: initialData?.number || '',
    complement: initialData?.complement || '',
  });

  // SMS Verification
  const [smsDigits, setSmsDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [smsCode, setSmsCode] = useState<string>('');
  const [smsNotification, setSmsNotification] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(59);
  const [smsError, setSmsError] = useState<string | null>(null);

  const digitRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Auto-generate sms code on transition to step 5
  useEffect(() => {
    if (step === 5) {
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      setSmsCode(generatedCode);
      
      // Request notification permission automatically on step 5
      if (notificationService.isSupported() && notificationService.getPermissionStatus() === 'default') {
        notificationService.requestPermission();
      }
      
      // Delay simulated SMS notification for extreme delight
      const timer = setTimeout(() => {
        const textMsg = `Seu código de ativação é ${generatedCode}. Digite-o para ativar sua barbearia!`;
        setSmsNotification(`[SMS] Cortestime: ${textMsg}`);
        
        // Trigger a real system notification that will show in the mobile phone notifications!
        if (notificationService.isSupported() && notificationService.getPermissionStatus() === 'granted') {
          notificationService.triggerNotification('💬 SMS Recebido', `Cortestime: ${textMsg}`);
        }
      }, 1500);

      // Countdown timer
      const interval = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 59));
      }, 1000);

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [step]);

  // Handle Objective selection
  const toggleObjective = (obj: string) => {
    setFormData(prev => {
      const objectives = prev.objectives.includes(obj)
        ? prev.objectives.filter(o => o !== obj)
        : [...prev.objectives, obj];
      return { ...prev, objectives };
    });
  };

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.cellphone || !formData.email || !formData.businessName) {
      alert('Por favor, preencha todos os campos.');
      return;
    }
    if (!termsAccepted) {
      alert('Você precisa aceitar os termos de uso e política de privacidade.');
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = () => {
    setStep(3);
  };

  const handleNextStep3 = () => {
    setStep(4);
  };

  const handleNextStep4 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cep || !formData.neighborhood || !formData.street || !formData.number) {
      alert('Por favor, preencha os campos obrigatórios do endereço.');
      return;
    }
    setStep(5);
  };

  const handleSmsChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.charAt(value.length - 1);
    }
    
    const newDigits = [...smsDigits];
    newDigits[index] = value;
    setSmsDigits(newDigits);
    setSmsError(null);

    // Auto-focus next field
    if (value !== '' && index < 5) {
      digitRefs[index + 1].current?.focus();
    }
  };

  const handleSmsKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && smsDigits[index] === '' && index > 0) {
      digitRefs[index - 1].current?.focus();
    }
  };

  const handleConfirmVerification = () => {
    const enteredCode = smsDigits.join('');
    if (enteredCode === smsCode) {
      setStep(6);
    } else {
      setSmsError('Código inválido. Digite o código de 6 dígitos recebido por SMS.');
    }
  };

  // Helper to prefill CEP address
  const handleAutoFillCep = () => {
    setFormData(prev => ({
      ...prev,
      neighborhood: 'Antares',
      street: 'Avenida Menino Marcelo',
      number: '4200',
      complement: 'Salas 3 e 4',
    }));
  };

  const objectivesList = [
    { name: 'Divulgar serviços', icon: Megaphone },
    { name: 'Organizar agenda', icon: Calendar },
    { name: 'Implementar agendamento online', icon: Globe },
    { name: 'Dar autonomia aos profissionais', icon: Users },
    { name: 'Gerenciar a parte fiscal', icon: FileText },
    { name: 'Facilitar pagamentos da equipe', icon: Wallet },
    { name: 'Administrar financeiro', icon: TrendingUp },
    { name: 'Gerenciar agendas das unidades', icon: Building2 },
    { name: 'Fidelizar clientes', icon: Sparkles },
    { name: 'Acompanhar todas as unidades', icon: Eye },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-brand-dark flex flex-col justify-between py-6 px-4 relative overflow-hidden">
      
      {/* Real-time SMS Notification Overlay */}
      <AnimatePresence>
        {smsNotification && (
          <motion.div 
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm bg-gray-900 text-white rounded-2xl shadow-2xl border border-gray-800 p-4 flex gap-3 items-start cursor-pointer"
            onClick={() => {
              // Auto-fill code when notification clicked for supreme delight
              const codeArray = smsCode.split('');
              setSmsDigits(codeArray);
              setSmsNotification(null);
            }}
          >
            <div className="p-2 bg-brand-blue text-white rounded-lg">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-xs text-brand-blue uppercase">Mensagem SMS</span>
                <span className="text-[10px] text-gray-400">Agora mesmo</span>
              </div>
              <p className="text-xs text-gray-200 leading-snug">
                {smsNotification}
              </p>
              <p className="text-[10px] text-brand-lime font-bold mt-1">💡 Clique aqui para preencher automaticamente!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER WITH LOGO */}
      <header className="max-w-md mx-auto w-full flex items-center justify-between pb-4 border-b border-gray-100">
        <button 
          onClick={step === 1 ? onBackToLanding : () => setStep(prev => (prev - 1) as any)}
          className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-1.5">
          <LogoIcon className="w-6 h-6" />
          <span className="font-sans font-extrabold text-lg text-[#051b42]">Cortestime</span>
        </div>

        <div className="text-xs font-bold text-gray-400">
          Passo {step} de 6
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex items-center justify-center py-6">
        <div className="w-full max-w-md bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm">
          
          {/* STEP 1: CADASTRO INICIAL */}
          {step === 1 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6 text-left"
            >
              <div>
                <h2 className="font-display font-bold text-2xl text-brand-dark">Cadastre seu negócio</h2>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-1">Bora dar um up</p>
              </div>

              <form onSubmit={handleNextStep1} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600">Nome completo</label>
                  <input 
                    type="text" 
                    required
                    value={formData.fullName}
                    onChange={e => setFormData({...formData, fullName: e.target.value})}
                    placeholder="Ex: João da Silva"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-blue focus:outline-none transition-colors text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600">Celular</label>
                  <input 
                    type="tel" 
                    required
                    value={formData.cellphone}
                    onChange={e => setFormData({...formData, cellphone: e.target.value})}
                    placeholder="Ex: (82) 98724-3056"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-blue focus:outline-none transition-colors text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600">E-mail</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder="Ex: joao@gmail.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-blue focus:outline-none transition-colors text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600">Nome do negócio</label>
                  <input 
                    type="text" 
                    required
                    value={formData.businessName}
                    onChange={e => setFormData({...formData, businessName: e.target.value})}
                    placeholder="Ex: Barbearia Estilo"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-blue focus:outline-none transition-colors text-sm"
                  />
                </div>

                <div className="flex gap-2 items-start pt-2">
                  <input 
                    type="checkbox" 
                    id="terms"
                    checked={termsAccepted}
                    onChange={e => setTermsAccepted(e.target.checked)}
                    className="mt-1 h-4 w-4 text-brand-blue border-gray-300 rounded focus:ring-brand-blue accent-brand-blue"
                  />
                  <label htmlFor="terms" className="text-xs text-gray-500 leading-snug">
                    Li e aceito o <span className="text-brand-blue underline font-semibold cursor-pointer">termo de uso</span> e a <span className="text-brand-blue underline font-semibold cursor-pointer">política de privacidade</span>
                  </label>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-brand-blue hover:bg-brand-blue-light text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-brand-blue/10 transition-all uppercase text-xs tracking-wider mt-4"
                >
                  Cadastrar negócio
                </button>
              </form>
            </motion.div>
          )}

          {/* STEP 2: MODO DE ATENDIMENTO */}
          {step === 2 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6 text-left"
            >
              <div>
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Modo de Operação</p>
                <h2 className="font-display font-bold text-2xl text-brand-dark mt-1">Como sua barbearia atende?</h2>
                <p className="text-xs text-gray-500 mt-1">Escolha o modelo principal para personalizar sua agenda e vitrine virtual</p>
              </div>

              <div className="space-y-3">
                {/* Opção 1: Por agendamento */}
                <div 
                  onClick={() => setFormData({ ...formData, serviceMode: 'agendamento' })}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                    formData.serviceMode === 'agendamento'
                      ? 'bg-[#f0f7ff] border-brand-blue shadow-sm'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 transition-all ${
                    formData.serviceMode === 'agendamento'
                      ? 'border-brand-blue bg-brand-blue text-white'
                      : 'border-gray-300 bg-white'
                  }`}>
                    {formData.serviceMode === 'agendamento' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className={`w-4 h-4 ${formData.serviceMode === 'agendamento' ? 'text-brand-blue' : 'text-gray-500'}`} />
                      <h4 className="font-bold text-sm text-brand-dark">Por agendamento</h4>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Clientes escolhem um horário marcado para serem atendidos com hora certa.
                    </p>
                  </div>
                </div>

                {/* Opção 2: Por ordem de chegada */}
                <div 
                  onClick={() => setFormData({ ...formData, serviceMode: 'ordem_chegada' })}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                    formData.serviceMode === 'ordem_chegada'
                      ? 'bg-[#f0f7ff] border-brand-blue shadow-sm'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 transition-all ${
                    formData.serviceMode === 'ordem_chegada'
                      ? 'border-brand-blue bg-brand-blue text-white'
                      : 'border-gray-300 bg-white'
                  }`}>
                    {formData.serviceMode === 'ordem_chegada' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Users className={`w-4 h-4 ${formData.serviceMode === 'ordem_chegada' ? 'text-brand-blue' : 'text-gray-500'}`} />
                      <h4 className="font-bold text-sm text-brand-dark">Por ordem de chegada</h4>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Clientes entram em uma fila digital/presencial e são atendidos conforme chegam.
                    </p>
                  </div>
                </div>

                {/* Opção 3: Os dois */}
                <div 
                  onClick={() => setFormData({ ...formData, serviceMode: 'ambos' })}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                    formData.serviceMode === 'ambos'
                      ? 'bg-[#f0f7ff] border-brand-blue shadow-sm'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 transition-all ${
                    formData.serviceMode === 'ambos'
                      ? 'border-brand-blue bg-brand-blue text-white'
                      : 'border-gray-300 bg-white'
                  }`}>
                    {formData.serviceMode === 'ambos' && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Layers className={`w-4 h-4 ${formData.serviceMode === 'ambos' ? 'text-brand-blue' : 'text-gray-500'}`} />
                      <h4 className="font-bold text-sm text-brand-dark">Os dois</h4>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      A barbearia trabalha com agendamentos e também recebe clientes sem horário marcado.
                    </p>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleNextStep2}
                className="w-full bg-brand-blue hover:bg-brand-blue-light text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-brand-blue/10 transition-all uppercase text-xs tracking-wider"
              >
                Continuar
              </button>
            </motion.div>
          )}

          {/* STEP 3: SELECIONAR OBJETIVOS */}
          {step === 3 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6 text-left"
            >
              <div>
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Informações adicionais</p>
                <h2 className="font-display font-bold text-2xl text-brand-dark mt-1">Selecione seu principal objetivo para o sucesso</h2>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {objectivesList.map((obj, i) => {
                  const Icon = obj.icon;
                  const isSelected = formData.objectives.includes(obj.name);
                  return (
                    <div 
                      key={i}
                      onClick={() => toggleObjective(obj.name)}
                      className={`flex justify-between items-center p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-[#f0f7ff] border-brand-blue text-brand-blue' 
                          : 'border-gray-100 bg-white hover:border-gray-200 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${isSelected ? 'text-brand-blue' : 'text-gray-400'}`} />
                        <span className="text-xs sm:text-sm font-semibold">{obj.name}</span>
                      </div>
                      
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'bg-brand-blue border-brand-blue text-white' 
                          : 'border-gray-200 bg-white'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button 
                onClick={handleNextStep3}
                className="w-full bg-brand-blue hover:bg-brand-blue-light text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-brand-blue/10 transition-all uppercase text-xs tracking-wider"
              >
                Continuar
              </button>
            </motion.div>
          )}

          {/* STEP 4: ENDEREÇO DO NEGÓCIO */}
          {step === 4 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6 text-left"
            >
              <div>
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Informações adicionais</p>
                <h2 className="font-display font-bold text-2xl text-brand-dark mt-1">Endereço do seu negócio</h2>
                <p className="text-xs text-gray-500 mt-1">Informe seu endereço para ser encontrado facilmente pelos clientes</p>
              </div>

              <form onSubmit={handleNextStep4} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-600">CEP</label>
                    <button 
                      type="button"
                      onClick={handleAutoFillCep}
                      className="text-xs font-semibold text-brand-blue hover:underline"
                    >
                      Preencher endereço de teste
                    </button>
                  </div>
                  <input 
                    type="text" 
                    required
                    value={formData.cep}
                    onChange={e => setFormData({...formData, cep: e.target.value})}
                    placeholder="Ex: 57150-000"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-blue focus:outline-none transition-colors text-sm bg-gray-50 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600">Bairro</label>
                  <input 
                    type="text" 
                    required
                    value={formData.neighborhood}
                    onChange={e => setFormData({...formData, neighborhood: e.target.value})}
                    placeholder="Ex: Centro"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-blue focus:outline-none transition-colors text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600">Rua</label>
                  <input 
                    type="text" 
                    required
                    value={formData.street}
                    onChange={e => setFormData({...formData, street: e.target.value})}
                    placeholder="Ex: Rua das Flores"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-blue focus:outline-none transition-colors text-sm"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1 space-y-1.5">
                    <label className="text-xs font-bold text-gray-600">Número</label>
                    <input 
                      type="text" 
                      required
                      value={formData.number}
                      onChange={e => setFormData({...formData, number: e.target.value})}
                      placeholder="123"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-blue focus:outline-none transition-colors text-sm"
                    />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-gray-600">Complemento</label>
                    <input 
                      type="text" 
                      value={formData.complement}
                      onChange={e => setFormData({...formData, complement: e.target.value})}
                      placeholder="Ex: Sala 4"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-blue focus:outline-none transition-colors text-sm"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-brand-blue hover:bg-brand-blue-light text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-brand-blue/10 transition-all uppercase text-xs tracking-wider mt-4"
                >
                  Continuar
                </button>
              </form>
            </motion.div>
          )}

          {/* STEP 5: SMS CONFIRMATION CODE */}
          {step === 5 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6 text-center"
            >
              <div className="text-left space-y-3">
                <div>
                  <h2 className="font-display font-bold text-2xl text-brand-dark">Sua segurança é nossa prioridade</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Por isso, precisamos confirmar algumas informações sobre você para validarmos o cadastro. São apenas duas etapas.
                  </p>
                </div>

                <div className="p-3.5 bg-amber-50/80 text-amber-900 border border-amber-200/60 rounded-2xl text-[11px] leading-relaxed text-left space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800">
                    <span className="text-xs">💡</span>
                    <span>Aviso Importante (Simulação)</span>
                  </div>
                  <p className="text-gray-600 font-medium">
                    Como esta é uma <strong>versão de demonstração comercial</strong>, o envio de SMS real está desativado. 
                    O código foi gerado e enviado na forma de um <strong>balão de notificação preta no topo desta página</strong>.
                  </p>
                  <p className="text-brand-blue font-bold">
                    👉 Toque ou clique no balão preto do topo para preencher os 6 dígitos automaticamente!
                  </p>
                </div>

                <p className="text-xs text-gray-700 font-semibold pt-1">
                  Digite o código de 6 dígitos que enviamos para o número <span className="text-brand-blue font-bold font-mono">{formData.cellphone || '(82) 98724-3506'}</span>.
                </p>
              </div>

              {/* SMS Inputs */}
              <div className="flex justify-center gap-2 py-4">
                {smsDigits.map((digit, i) => (
                  <input 
                    key={i}
                    ref={digitRefs[i]}
                    type="text"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleSmsChange(i, e.target.value)}
                    onKeyDown={e => handleSmsKeyDown(i, e)}
                    className="w-12 h-12 text-center text-xl font-bold rounded-xl border-2 border-gray-200 focus:border-brand-blue focus:outline-none focus:ring-0 text-brand-dark transition-colors font-mono"
                  />
                ))}
              </div>

              {smsError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold text-left flex items-start gap-2">
                  <BadgeAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{smsError}</span>
                </div>
              )}

              <button 
                onClick={handleConfirmVerification}
                className="w-full bg-brand-blue hover:bg-brand-blue-light text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-brand-blue/10 transition-all uppercase text-xs tracking-wider"
              >
                Confirmar
              </button>

              <div className="text-xs text-gray-500 pt-2">
                Para reconfigurar o código ou retransmitir, espere <span className="font-bold text-brand-blue font-mono">00:{countdown < 10 ? `0${countdown}` : countdown}</span>
              </div>
            </motion.div>
          )}

          {/* STEP 6: INSTALL CORTESTIME */}
          {step === 6 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <InstallCortestimeStep 
                onComplete={() => onComplete(formData)} 
              />
            </motion.div>
          )}

        </div>
      </main>

      {/* FOOTER METADATA */}
      <footer className="max-w-md mx-auto w-full text-center text-[11px] text-gray-400">
        &copy; {new Date().getFullYear()} Cortestime Barber S.A. Conectando sua barbearia à nuvem.
      </footer>
    </div>
  );
}
