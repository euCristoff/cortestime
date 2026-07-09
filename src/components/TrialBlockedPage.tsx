import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import LogoIcon from './LogoIcon';
import { ShieldAlert, Check, Star, CreditCard, ArrowLeft, Loader2, LogOut, Sparkles, X } from 'lucide-react';
import { MerchantUser } from '../types';
import { notificationService } from '../services/notificationService';
import MercadoPagoCheckout from './MercadoPagoCheckout';

interface TrialBlockedPageProps {
  merchant: MerchantUser;
  onLogout: () => void;
  onUpdatePlan: (newPlan: 'vitrine' | 'pro') => void;
  onBypass?: () => void;
}

export default function TrialBlockedPage({ merchant, onLogout, onUpdatePlan, onBypass }: TrialBlockedPageProps) {
  const [step, setStep] = useState<'initial' | 'plans'>('initial');
  const [checkoutPlan, setCheckoutPlan] = useState<{ name: string; price: number } | null>(null);

  useEffect(() => {
    if (!merchant.trialFim) return;
    const parts = merchant.trialFim.split('/');
    if (parts.length !== 3) return;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    
    const expiryDate = new Date(year, month, day, 23, 59, 59, 999);
    const now = new Date();
    
    // Clean hours
    const d1 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const d2 = new Date(expiryDate.getFullYear(), expiryDate.getMonth(), expiryDate.getDate());
    
    const diffMs = d2.getTime() - d1.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays <= -2) {
      const todayStr = now.toISOString().split('T')[0];
      const keySentToday = `sent-expired-daily-${todayStr}`;
      
      if (!localStorage.getItem(keySentToday)) {
        if (notificationService.isSupported() && notificationService.getPermissionStatus() === 'granted') {
          notificationService.triggerNotification(
            '💈 Cortestime Alerta',
            'Seus clientes continuam aguardando você. Reative sua assinatura quando desejar.',
            `expired-daily-${todayStr}`
          );
          localStorage.setItem(keySentToday, 'true');
        }
      }
    }
  }, [merchant]);

  const handleSelectPlan = (planName: string, price: number) => {
    setCheckoutPlan({ name: planName, price });
  };

  return (
    <div className="min-h-screen bg-[#051b42] text-white flex flex-col justify-between py-8 px-4 relative overflow-x-hidden">
      
      {/* Background radial effects */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-lime/10 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-blue/20 rounded-full blur-3xl -z-10" />

      {/* HEADER */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-1.5">
          <LogoIcon className="w-6 h-6" />
          <span className="font-sans font-extrabold text-lg text-white">Cortestime</span>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
          
          {onBypass && (
            <button 
              onClick={onBypass}
              className="p-2 text-white hover:text-amber-400 bg-white/5 hover:bg-white/10 rounded-full transition-all duration-200 cursor-pointer border border-white/10 hover:border-amber-400/30 shadow-md flex items-center justify-center"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* MAIN BANNER */}
      <main className="flex-1 flex items-center justify-center py-8">
        <AnimatePresence mode="wait">
          {step === 'initial' ? (
            <motion.div 
              key="initial-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full max-w-xl bg-[#09224f]/90 border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl relative"
            >
              {/* Locked Badge Icon */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#bffd32] text-[#051b42] p-5 rounded-full shadow-xl">
                <ShieldAlert className="w-8 h-8 stroke-[2.5]" />
              </div>

              <div className="text-center mt-6 mb-8 space-y-3">
                <h2 className="font-sans font-extrabold text-2xl md:text-3xl tracking-tight text-white leading-tight">
                  Seu período de teste terminou.
                </h2>
                <p className="text-xs text-gray-300 max-w-sm mx-auto leading-relaxed">
                  (Não se preocupe: seus clientes, agendamentos e configurações estão salvos com total segurança).
                </p>
                <p className="text-sm font-semibold text-brand-lime">
                  Reative o acesso para continuar gerenciando sua barbearia.
                </p>
              </div>

              {/* Trial details box */}
              <div className="bg-[#051b42]/60 rounded-2xl p-4 border border-white/5 grid grid-cols-2 gap-4 text-center mb-8">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Início do Teste</p>
                  <p className="text-sm font-mono font-bold text-gray-200 mt-0.5">{merchant.trialInicio}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Término do Teste</p>
                  <p className="text-sm font-mono font-bold text-brand-lime mt-0.5">{merchant.trialFim}</p>
                </div>
              </div>

              {/* Pro Features Showcase */}
              <div className="space-y-4 mb-8 text-left">
                <h3 className="text-xs font-black text-brand-lime uppercase tracking-wider">
                  Benefícios que você continuará aproveitando no Premium:
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    "Agendamento online 24h para clientes",
                    "Agenda dinâmica de profissionais",
                    "Cálculo automático de comissões",
                    "Fluxo de caixa e faturamento",
                    "Controle completo de clientes",
                    "Notificações automáticas via WhatsApp"
                  ].map((feat, idx) => (
                    <div key={idx} className="flex gap-2.5 items-start text-xs text-gray-300">
                      <Check className="w-4 h-4 text-brand-lime shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Choices */}
              <div className="space-y-3">
                <button 
                  onClick={() => setStep('plans')}
                  className="w-full bg-[#bffd32] hover:bg-[#a6e025] text-[#051b42] font-extrabold py-4 px-6 rounded-2xl shadow-xl shadow-brand-lime/10 transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                  id="btn-choose-cortestime-plan"
                >
                  <Star className="w-4 h-4 fill-current" />
                  <span>Escolher um plano do Cortestime</span>
                </button>

                <button 
                  onClick={() => onUpdatePlan('vitrine')}
                  className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-extrabold py-4 px-6 rounded-2xl shadow-xl shadow-emerald-500/10 transition-all text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/20"
                  id="btn-continue-free-vitrine"
                >
                  <span>Continuar gratuitamente no Cortes Vitrine</span>
                </button>
                
                <p className="text-[10px] text-center text-gray-400 pt-2">
                  Escolha o plano ideal para a sua barbearia deslanchar ou mude para o plano gratuito sem taxas extras.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="plans-view"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-4xl space-y-6"
            >
              {/* Plans Header */}
              <div className="text-center space-y-2">
                <button
                  onClick={() => setStep('initial')}
                  className="inline-flex items-center gap-2 text-xs text-brand-lime font-bold hover:underline mb-4 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar para as opções</span>
                </button>
                <h2 className="font-sans font-extrabold text-3xl text-white tracking-tight">
                  Escolha o Plano Perfeito para Você
                </h2>
                <p className="text-sm text-gray-300 max-w-lg mx-auto">
                  Turbine os agendamentos da sua barbearia com faturamento automatizado, controle de funcionários e comissões integradas.
                </p>
              </div>

              {/* THREE CARDS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                
                {/* MENSAL */}
                <div className="bg-[#09224f]/80 border border-white/10 rounded-3xl p-6 text-center space-y-5 relative hover:border-white/20 transition-all flex flex-col justify-between">
                  <div className="space-y-3">
                    <h3 className="font-sans font-extrabold text-base text-gray-200">Mensal</h3>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-400">Pagamento recorrente</p>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-xl font-bold">R$</span>
                        <span className="text-3xl font-black text-white">19,90</span>
                        <span className="text-xs text-gray-400">/mês</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-4 space-y-3 text-left text-xs text-gray-300 flex-1">
                    <div className="flex gap-2 items-start">
                      <Check className="w-4 h-4 text-brand-lime shrink-0 mt-0.5" />
                      <span>Agendamentos Ilimitados</span>
                    </div>
                    <div className="flex gap-2 items-start">
                      <Check className="w-4 h-4 text-brand-lime shrink-0 mt-0.5" />
                      <span>Painel de Clientes</span>
                    </div>
                    <div className="flex gap-2 items-start">
                      <Check className="w-4 h-4 text-brand-lime shrink-0 mt-0.5" />
                      <span>Estatísticas financeiras</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectPlan('Mensal', 19.90)}
                    className="w-full bg-emerald-400 hover:bg-emerald-500 text-[#051b42] font-extrabold py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Assinar Mensal
                  </button>
                </div>

                {/* TRIMESTRAL */}
                <div className="bg-[#0b295c] border-2 border-amber-400 rounded-3xl p-6 text-center space-y-5 relative shadow-xl shadow-amber-500/5 flex flex-col justify-between">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-[#051b42] text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-amber-400">
                    Mais Popular ✨
                  </div>

                  <div className="space-y-3 pt-2">
                    <h3 className="font-sans font-extrabold text-base text-white">Trimestral</h3>
                    <div className="space-y-1">
                      <p className="text-xs text-amber-400 font-bold">Economize 16% de desconto</p>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-xl font-bold">R$</span>
                        <span className="text-3xl font-black text-amber-400">49,90</span>
                        <span className="text-xs text-gray-300">/trimestre</span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-medium">Equivale a R$ 16,63 por mês</p>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-4 space-y-3 text-left text-xs text-gray-200 flex-1">
                    <div className="flex gap-2 items-start">
                      <Check className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>Tudo do plano Mensal</span>
                    </div>
                    <div className="flex gap-2 items-start">
                      <Check className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Notificações Automáticas</span>
                    </div>
                    <div className="flex gap-2 items-start">
                      <Check className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Suporte Preferencial</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectPlan('Trimestral', 49.90)}
                    className="w-full bg-amber-400 hover:bg-amber-500 text-[#051b42] font-extrabold py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Assinar Trimestral
                  </button>
                </div>

                {/* ANUAL */}
                <div className="bg-[#09224f]/80 border border-white/10 rounded-3xl p-6 text-center space-y-5 relative hover:border-white/20 transition-all flex flex-col justify-between">
                  <div className="space-y-3">
                    <h3 className="font-sans font-extrabold text-base text-gray-200">Anual</h3>
                    <div className="space-y-1">
                      <p className="text-xs text-cyan-400 font-bold">Economize 37% (Melhor Valor)</p>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-xl font-bold">R$</span>
                        <span className="text-3xl font-black text-white">149,90</span>
                        <span className="text-xs text-gray-400">/ano</span>
                      </div>
                      <p className="text-[10px] text-gray-400 font-medium">Equivale a R$ 12,49 por mês</p>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-4 space-y-3 text-left text-xs text-gray-300 flex-1">
                    <div className="flex gap-2 items-start">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>Tudo do plano Trimestral</span>
                    </div>
                    <div className="flex gap-2 items-start">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>Sem reajustes anuais</span>
                    </div>
                    <div className="flex gap-2 items-start">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>Selo Premium no Perfil</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSelectPlan('Anual', 149.90)}
                    className="w-full bg-cyan-400 hover:bg-cyan-500 text-[#051b42] font-extrabold py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Assinar Anual
                  </button>
                </div>

              </div>

              {/* Back out options */}
              <div className="pt-4 text-center">
                <button
                  onClick={() => onUpdatePlan('vitrine')}
                  className="text-xs text-gray-400 hover:text-white underline cursor-pointer"
                >
                  Continuar com o plano gratuito Cortes Vitrine
                </button>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* MERCADO PAGO CHECKOUT MODAL OVERLAY */}
      <AnimatePresence>
        {checkoutPlan && (
          <MercadoPagoCheckout 
            planName={checkoutPlan.name}
            price={checkoutPlan.price}
            merchant={merchant}
            onPaymentSuccess={() => {
              onUpdatePlan('pro');
              setCheckoutPlan(null);
            }}
            onClose={() => setCheckoutPlan(null)}
          />
        )}
      </AnimatePresence>


      {/* FOOTER */}
      <footer className="max-w-md mx-auto w-full text-center text-[10px] text-gray-500 shrink-0 space-y-2">
        <div>
          &copy; {new Date().getFullYear()} Cortestime S.A. Simplificando a sua barbearia com inteligência.
        </div>
      </footer>
    </div>
  );
}
