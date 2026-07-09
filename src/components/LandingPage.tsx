import React from 'react';
import { motion } from 'motion/react';
import LogoIcon from './LogoIcon';
import { 
  Calendar, 
  Users, 
  Sparkles, 
  TrendingUp, 
  CheckCircle2, 
  MessageSquare, 
  Phone, 
  Clock, 
  Calculator, 
  Menu,
  Shield,
  Smartphone,
  ChevronRight
} from 'lucide-react';

interface LandingPageProps {
  onStartTrial: () => void;
  onLogin: () => void;
  firebaseConnected?: boolean | null;
}

export default function LandingPage({ onStartTrial, onLogin, firebaseConnected }: LandingPageProps) {
  return (
    <div id="landing-page" className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#1E1E1E]">
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-[#FAF9F6]/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 md:px-8 flex justify-between items-center">
        <div className="flex items-center gap-2">
          {/* Custom Stylized Logo Icon (matching the uploaded image) */}
          <LogoIcon className="w-8 h-8" />
          <span className="font-sans font-extrabold text-2xl tracking-tight text-[#051b42]">
            Cortestime
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={onLogin}
            className="text-xs md:text-sm font-bold text-[#051b42] hover:text-brand-blue px-3.5 py-2 rounded-full hover:bg-gray-100 transition-all cursor-pointer"
          >
            Entrar
          </button>

          <button 
            onClick={onStartTrial}
            className="bg-brand-blue hover:bg-brand-blue-light text-white font-bold text-xs md:text-sm px-5 py-2.5 rounded-full transition-colors uppercase tracking-wider cursor-pointer shadow-sm"
          >
            Teste Grátis
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors md:hidden">
            <Menu className="w-6 h-6 text-brand-dark" />
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="px-4 py-12 md:py-20 md:px-8 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        <div className="md:col-span-7 flex flex-col gap-6 text-left">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl md:text-6xl text-brand-blue leading-tight tracking-tight">
              Escolha um sistema completo para gestão de barbearia
            </h1>
          </motion.div>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-base sm:text-lg text-gray-600 leading-relaxed max-w-xl"
          >
            Agilidade no fechamento de caixa e controle de barbearia para lucrar mais com gestão fácil de agendamentos, recursos para fidelização de clientes, barbearia por assinatura e muito mais!
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 mt-2"
          >
            <button 
              onClick={onStartTrial}
              className="bg-brand-lime hover:bg-brand-lime-dark text-brand-dark font-extrabold text-sm sm:text-base px-8 py-4 rounded-full shadow-lg shadow-brand-lime/20 hover:shadow-brand-lime/30 transition-all text-center uppercase tracking-wide"
            >
              Teste Grátis por 3 dias
            </button>
          </motion.div>

          {/* Real-time stats */}
          <div className="flex gap-6 items-center mt-6 pt-6 border-t border-gray-100">
            <div>
              <p className="font-display font-bold text-2xl text-brand-dark">5.000+</p>
              <p className="text-xs text-gray-500">Barbearias ativas</p>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div>
              <p className="font-display font-bold text-2xl text-brand-dark">1.2M+</p>
              <p className="text-xs text-gray-500">Cortes agendados/mês</p>
            </div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div>
              <p className="font-display font-bold text-2xl text-brand-dark">4.9★</p>
              <p className="text-xs text-gray-500">Avaliação do app</p>
            </div>
          </div>
        </div>

        <div className="md:col-span-5 relative flex justify-center items-center">
          {/* Abstract backgrounds inspired by graphics */}
          <div className="absolute top-10 left-10 w-44 h-44 rounded-full bg-brand-lime/40 blur-2xl"></div>
          <div className="absolute bottom-10 right-10 w-44 h-44 rounded-full bg-brand-blue/30 blur-2xl"></div>

          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 w-full max-w-[340px] aspect-[4/5] bg-gradient-to-b from-gray-900 to-gray-800 rounded-3xl overflow-hidden shadow-2xl p-6 border-4 border-gray-700"
          >
            {/* Mock Screen of the platform */}
            <div className="flex justify-between items-center border-b border-gray-800 pb-3 mb-4">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="text-[10px] text-gray-400 font-mono">dashboard.cortestime.com</div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center bg-gray-800/80 p-3 rounded-xl">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-brand-blue/20 rounded-lg">
                    <Calendar className="w-4 h-4 text-brand-blue" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Próximo Agendamento</p>
                    <p className="text-[10px] text-gray-400">14:30 - Lucas de Souza</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-lime/20 text-brand-lime">
                  Confirmado
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-800/80 p-3 rounded-xl text-center">
                  <p className="text-gray-400 text-[10px]">Agendados hoje</p>
                  <p className="text-lg font-bold text-white">18</p>
                </div>
                <div className="bg-gray-800/80 p-3 rounded-xl text-center">
                  <p className="text-gray-400 text-[10px]">Faturamento diário</p>
                  <p className="text-lg font-bold text-brand-lime">R$ 840</p>
                </div>
              </div>

              {/* Client list preview */}
              <div className="space-y-2 mt-2">
                <p className="text-white text-[10px] font-bold uppercase tracking-wider">Profissionais em serviço</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center bg-gray-800/40 p-2 rounded-lg text-xs">
                    <span className="text-gray-300">Henrique (Cabelo)</span>
                    <span className="text-brand-lime font-medium">Ocupado</span>
                  </div>
                  <div className="flex justify-between items-center bg-gray-800/40 p-2 rounded-lg text-xs">
                    <span className="text-gray-300">Gustavo (Barba)</span>
                    <span className="text-brand-lime font-medium">Ocupado</span>
                  </div>
                  <div className="flex justify-between items-center bg-gray-800/40 p-2 rounded-lg text-xs">
                    <span className="text-gray-300">Carlos (Livre)</span>
                    <span className="text-gray-400">14:00 Livre</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                {/* Styled Barber photo representation in the phone layout */}
                <div className="w-full h-16 rounded-xl bg-cover bg-center flex items-end p-2 relative overflow-hidden" 
                     style={{ backgroundImage: `url('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop&q=60')` }}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                  <p className="text-white text-[10px] font-bold relative z-10">Conectando barbeiros e clientes</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURE SECTION 1: SAY GOODBYE TO PAPER SLIPS */}
      <section className="bg-white py-16 px-4 md:px-8 border-y border-gray-100">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-5 order-last md:order-first relative flex justify-center">
            {/* Visual representation of cellphones/tablet scheduler */}
            <div className="relative">
              <div className="w-64 h-48 bg-[#bffd32] rounded-3xl absolute -rotate-6 top-4 left-4 z-0 flex items-center justify-center font-sans font-extrabold text-7xl text-brand-dark/10 select-none">
                Cortestime
              </div>
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="relative z-10 w-60 h-80 bg-[#1E1E1E] rounded-2xl shadow-xl p-4 border-4 border-gray-800 flex flex-col justify-between"
              >
                <div className="border-b border-gray-800 pb-2 flex justify-between items-center">
                  <span className="text-[10px] text-gray-400 font-mono">Sem Papel</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-blue"></div>
                </div>
                
                <div className="space-y-3 my-auto">
                  <div className="p-2.5 bg-gray-900 rounded-xl border border-gray-800">
                    <p className="text-[9px] text-gray-400">Comissão Automática</p>
                    <p className="text-xs font-bold text-white mt-1">Henrique: 50% (R$ 25,00)</p>
                  </div>
                  <div className="p-2.5 bg-gray-900 rounded-xl border border-gray-800">
                    <p className="text-[9px] text-gray-400">Fechamento de Caixa</p>
                    <p className="text-xs font-bold text-white mt-1">Total do Dia: R$ 1.250,00</p>
                  </div>
                  <div className="p-2.5 bg-brand-blue/10 rounded-xl border border-brand-blue/30">
                    <p className="text-[9px] text-brand-blue">Envio Automático</p>
                    <p className="text-xs font-bold text-white mt-1">Lembrete WhatsApp Ativo</p>
                  </div>
                </div>

                <div className="bg-brand-blue text-center py-2 rounded-xl text-white text-[10px] font-bold uppercase">
                  Agendamento Digital
                </div>
              </motion.div>
            </div>
          </div>

          <div className="md:col-span-7 space-y-6 text-left">
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-brand-blue leading-snug">
              Dê adeus à comanda de papel na sua barbearia
            </h2>
            <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
              Dividir o foco entre gerir uma agenda para barbearia, atender os clientes e controlar o negócio não é fácil. Com a Cortestime, você tem um programa para barbearia que otimiza os seus processos, desde o agendamento até o pagamento de comissão de barbeiros, deixando você livre para se concentrar no que faz de melhor: criar cortes incríveis e bombar nas redes sociais.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex gap-2 items-start">
                <CheckCircle2 className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase text-brand-dark">Comissão de barbeiros</h4>
                  <p className="text-[11px] text-gray-500">Cálculo automatizado por serviço</p>
                </div>
              </div>
              <div className="flex gap-2 items-start">
                <CheckCircle2 className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase text-brand-dark">Fidelidade integrada</h4>
                  <p className="text-[11px] text-gray-500">Acumule pontos e atraia retorno</p>
                </div>
              </div>
              <div className="flex gap-2 items-start">
                <CheckCircle2 className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase text-brand-dark">Fila de Espera</h4>
                  <p className="text-[11px] text-gray-500">Não perca clientes em dias cheios</p>
                </div>
              </div>
              <div className="flex gap-2 items-start">
                <CheckCircle2 className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold uppercase text-brand-dark">Controle Financeiro</h4>
                  <p className="text-[11px] text-gray-500">Fluxo de caixa rápido e sem erros</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE SECTION 2: BARBER CALENDAR */}
      <section className="py-16 px-4 md:px-8 bg-[#FAF9F6]">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 space-y-6 text-left">
            <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-brand-blue" />
            </div>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-brand-dark leading-snug">
              Agenda para barbearia
            </h2>
            <p className="font-display font-medium text-lg text-gray-700 italic">
              Atenda todos os clientes com fila de espera na sua barbearia.
            </p>
            <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
              Facilite o agendamento para barbearia com um sistema para agendar online de forma intuitiva. Você define os horários disponíveis, seus clientes fazem as reservas e você mantém o controle total da sua <span className="text-brand-blue underline font-semibold decoration-brand-blue/30">agenda online</span> de forma organizada e eficiente. Atenda seus clientes também com fila de espera, sem hora marcada. Com as <span className="text-brand-blue underline font-semibold decoration-brand-blue/30">rotinas de mensagem</span>, envie link para confirmar presença por WhatsApp.
            </p>
            <div className="pt-2">
              <button 
                onClick={onStartTrial}
                className="inline-flex items-center gap-2 text-brand-blue font-bold hover:gap-3 transition-all"
              >
                <span>Conhecer todos os recursos da Agenda</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="md:col-span-5 relative flex justify-center">
            {/* Visual calendar preview resembling the screenshot 3 */}
            <div className="w-full max-w-[360px] bg-white rounded-2xl border border-gray-100 shadow-xl p-4 space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <span className="font-bold text-sm text-brand-dark">Agenda de Hoje</span>
                <span className="text-xs text-brand-blue font-semibold">Henrique • Gustavo</span>
              </div>
              <div className="space-y-3">
                <div className="relative pl-3 border-l-4 border-brand-blue py-1 text-left">
                  <p className="text-[10px] text-gray-400">09:00 - 09:30</p>
                  <p className="text-xs font-bold text-brand-dark">Corte Social</p>
                  <p className="text-[10px] text-gray-500">Cliente: Roberto Silva</p>
                </div>
                <div className="relative pl-3 border-l-4 border-gray-200 py-1 text-left opacity-60">
                  <p className="text-[10px] text-gray-400">10:00 - 10:30</p>
                  <p className="text-xs font-bold text-brand-dark">Barba Terapia</p>
                  <p className="text-[10px] text-gray-500">Cliente: André Albuquerque</p>
                </div>
                <div className="relative pl-3 border-l-4 border-brand-lime-dark py-1 text-left bg-brand-lime/10 rounded-r-lg pr-2">
                  <p className="text-[10px] text-brand-blue font-semibold">Novo! (Reservado Online)</p>
                  <p className="text-[10px] text-gray-400">11:00 - 12:00</p>
                  <p className="text-xs font-bold text-brand-dark">Cabelo & Barba Completo</p>
                  <p className="text-[10px] text-gray-500">Cliente: Carlos Penna</p>
                </div>
              </div>
              <div className="bg-brand-blue/5 p-2.5 rounded-xl border border-brand-blue/10 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-brand-blue" />
                  <span className="text-[10px] text-gray-600 font-semibold">Alerta WhatsApp pronto</span>
                </div>
                <button className="text-[9px] bg-brand-blue text-white px-2 py-1 rounded-md font-bold uppercase hover:bg-brand-blue-light">
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE CORTESTIME GRID */}
      <section className="bg-white py-16 px-4 md:px-8 border-t border-gray-100">
        <div className="max-w-5xl mx-auto text-center space-y-12">
          <div className="space-y-4 max-w-2xl mx-auto">
            <h2 className="font-display font-extrabold text-3xl text-brand-dark">
              Tudo o que você precisa para decolar sua barbearia
            </h2>
            <p className="text-gray-500 text-sm">
              Desenvolvemos a ferramenta perfeita para barbearias tradicionais, barbearias premium, franquias e profissionais autônomos.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            <div className="p-6 bg-[#FAF9F6] rounded-2xl border border-gray-100 space-y-3 hover:border-brand-blue/20 transition-all">
              <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-brand-dark">Aplicativo Próprio</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Deixe que seus clientes agendem de forma direta pelo aplicativo ou site personalizado com a sua marca.
              </p>
            </div>

            <div className="p-6 bg-[#FAF9F6] rounded-2xl border border-gray-100 space-y-3 hover:border-brand-blue/20 transition-all">
              <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue">
                <Calculator className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-brand-dark">Controle de Caixa</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Abertura e fechamento de caixa, fluxo financeiro detalhado, relatórios de rentabilidade e comissão integrada.
              </p>
            </div>

            <div className="p-6 bg-[#FAF9F6] rounded-2xl border border-gray-100 space-y-3 hover:border-brand-blue/20 transition-all">
              <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-brand-dark">Clube de Assinatura</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Garanta faturamento recorrente permitindo que os clientes assinem planos mensais de corte ou barba ilimitados.
              </p>
            </div>

            <div className="p-6 bg-[#FAF9F6] rounded-2xl border border-gray-100 space-y-3 hover:border-brand-blue/20 transition-all">
              <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-brand-dark">Marketing & Fidelidade</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Envie cupons de desconto, configure programas de fidelidade com acúmulo de pontos e resgates de serviços.
              </p>
            </div>

            <div className="p-6 bg-[#FAF9F6] rounded-2xl border border-gray-100 space-y-3 hover:border-brand-blue/20 transition-all">
              <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue">
                <Phone className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-brand-dark">Lembretes WhatsApp</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Envio automático de confirmações de horários e lembretes para evitar faltas e esquecimentos dos clientes.
              </p>
            </div>

            <div className="p-6 bg-[#FAF9F6] rounded-2xl border border-gray-100 space-y-3 hover:border-brand-blue/20 transition-all">
              <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center text-brand-blue">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-brand-dark">Segurança Certificada</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Seus dados cadastrais e financeiros protegidos com criptografia de ponta a ponta e backups automatizados diários.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER CALL TO ACTION */}
      <footer className="bg-brand-dark text-white py-12 px-4 md:px-8 mt-auto border-t border-gray-800">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="flex justify-center items-center gap-2">
            <LogoIcon className="w-6 h-6" />
            <span className="font-sans font-extrabold text-xl tracking-tight text-white">Cortestime</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold font-display text-brand-lime">
            Pronto para transformar a gestão da sua barbearia?
          </h3>
          <p className="text-gray-400 text-xs sm:text-sm max-w-lg mx-auto">
            Cadastre sua barbearia hoje mesmo. Não precisa de cartão de crédito. Teste grátis com acesso a todos os recursos.
          </p>
          <div>
            <button 
              onClick={onStartTrial}
              className="bg-brand-blue hover:bg-brand-blue-light text-white font-bold text-sm px-8 py-3.5 rounded-full transition-colors uppercase tracking-wider"
            >
              Começar Teste de 5 Dias
            </button>
          </div>
          <div className="pt-6 border-t border-gray-800 text-[11px] text-gray-500">
            &copy; {new Date().getFullYear()} Cortestime Barber. Desenvolvido para agendamento rápido e gestão impecável.
          </div>
        </div>
      </footer>
    </div>
  );
}
