import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import LogoIcon from './LogoIcon';
import { Download, Smartphone, Share, MoreVertical, PlusSquare, CheckCircle2, X, Sparkles, BellRing, ShieldCheck } from 'lucide-react';
import { firebaseService } from '../services/firebaseService';

interface InstallCortestimeStepProps {
  merchantUid?: string;
  onComplete: (installed: boolean) => void;
  isDashboardModal?: boolean;
}

export default function InstallCortestimeStep({ merchantUid, onComplete, isDashboardModal = false }: InstallCortestimeStepProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'other'>('android');

  useEffect(() => {
    // Detect OS
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setDeviceType('ios');
    } else if (/android/.test(userAgent)) {
      setDeviceType('android');
    } else {
      setDeviceType('other');
    }

    // Capture PWA install event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    setIsInstalling(true);

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          if (merchantUid) {
            await firebaseService.updateMerchantProfile(merchantUid, { appInstalled: true });
          }
          setIsInstalling(false);
          onComplete(true);
          return;
        }
      } catch (err) {
        console.error("Install prompt error:", err);
      }
    }

    // Fallback: Show clean visual instructions modal for iOS or manual PWA addition
    setIsInstalling(false);
    setShowInstructions(true);
  };

  const handleConfirmManualInstall = async () => {
    if (merchantUid) {
      await firebaseService.updateMerchantProfile(merchantUid, { appInstalled: true });
    }
    setShowInstructions(false);
    onComplete(true);
  };

  const handleSkip = async () => {
    if (merchantUid) {
      await firebaseService.updateMerchantProfile(merchantUid, { appInstalled: false });
    }
    onComplete(false);
  };

  return (
    <div className={`w-full ${isDashboardModal ? 'p-0' : 'max-w-md mx-auto text-center space-y-6'}`}>
      
      {/* HEADER / TITLE SECTION */}
      <div className="space-y-2 text-center">
        <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-brand-dark tracking-tight">
          Instale o Cortestime
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 max-w-sm mx-auto leading-relaxed font-medium">
          Receba lembretes dos próximos clientes, notificações de pagamentos e tenha acesso mais rápido ao painel, diretamente da tela inicial do seu celular.
        </p>
      </div>

      {/* SMARTPHONE MOCKUP WITH CORTESTIME APP ICON */}
      <div className="py-2 flex justify-center items-center">
        <div className="relative w-52 sm:w-56 h-[290px] sm:h-[310px] bg-slate-900 rounded-[38px] p-2.5 border-[5px] border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden">
          
          {/* Top Speaker & Camera Pill */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-3.5 bg-slate-950 rounded-full z-20 flex items-center justify-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-slate-800" />
            <div className="w-1.5 h-1.5 rounded-full bg-blue-900/60" />
          </div>

          {/* Phone Screen Gradient Wallpaper */}
          <div className="w-full h-full bg-gradient-to-b from-[#081c3b] via-[#0c2854] to-[#041026] rounded-[28px] p-3 flex flex-col justify-between relative overflow-hidden text-white">
            
            {/* Status Bar */}
            <div className="flex justify-between items-center text-[10px] font-mono font-bold text-gray-300 pt-1.5 px-2 z-10">
              <span>09:41</span>
              <div className="flex items-center gap-1">
                <span className="text-[8px]">5G</span>
                <div className="w-3.5 h-2 border border-white/70 rounded-xs p-0.5 flex items-center">
                  <div className="w-full h-full bg-white rounded-xs" />
                </div>
              </div>
            </div>

            {/* Simulated Notification Toast (Focus on conversion benefits) */}
            <motion.div 
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-4 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-2.5 text-left text-[11px] shadow-lg flex items-center gap-2.5 z-10"
            >
              <div className="w-7 h-7 rounded-xl bg-[#d4ff5e] text-[#081c3b] flex items-center justify-center shrink-0 font-extrabold shadow-sm">
                <BellRing className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-extrabold text-[10px] text-[#d4ff5e] truncate">💬 Próximo Cliente</p>
                <p className="text-[10px] text-gray-200 truncate font-medium">João Silva em 15 min (Corte + Barba)</p>
              </div>
            </motion.div>

            {/* App Icon Centered on Home Screen */}
            <div className="flex-1 flex flex-col items-center justify-center my-auto z-10 space-y-2">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="relative group cursor-pointer"
              >
                {/* Glow ring */}
                <div className="absolute -inset-1.5 bg-gradient-to-r from-[#d4ff5e] to-emerald-400 rounded-3xl blur-md opacity-60 group-hover:opacity-100 transition duration-500" />
                
                {/* Icon Container */}
                <div className="relative w-16 h-16 sm:w-18 sm:h-18 bg-white rounded-2xl flex items-center justify-center shadow-xl border border-white/40">
                  <LogoIcon className="w-10 h-10 sm:w-11 sm:h-11" />
                  
                  {/* Badge */}
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-[#081c3b] shadow-sm">
                    1
                  </span>
                </div>
              </motion.div>

              <span className="text-xs font-bold tracking-tight text-white/90 drop-shadow-sm">
                Cortestime
              </span>
            </div>

            {/* Home Indicator Bar */}
            <div className="w-16 h-1 bg-white/40 rounded-full mx-auto mb-1 z-10" />

            {/* Decorative background blur shapes */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[#d4ff5e]/15 rounded-full blur-2xl pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="space-y-3 pt-2">
        <button
          type="button"
          onClick={handleInstallInstallClick ? handleInstallClick : handleInstallClick}
          disabled={isInstalling}
          className="w-full bg-[#d4ff5e] hover:bg-[#c3f542] active:scale-[0.99] text-[#051b42] font-black py-4 px-6 rounded-2xl shadow-lg shadow-[#d4ff5e]/25 transition-all text-sm tracking-wide uppercase flex items-center justify-center gap-2.5 cursor-pointer border border-[#c3f542]"
        >
          {isInstalling ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-[#051b42]/30 border-t-[#051b42] animate-spin" />
              <span>Instalando...</span>
            </>
          ) : (
            <>
              <Smartphone className="w-5 h-5 stroke-[2.5]" />
              <span>Instalar agora</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleSkip}
          className="w-full text-gray-500 hover:text-gray-800 text-xs font-bold py-2 px-4 transition-colors cursor-pointer"
        >
          Instalar depois
        </button>
      </div>

      {/* MANUAL INSTALL INSTRUCTION MODAL */}
      <AnimatePresence>
        {showInstructions && (
          <div className="fixed inset-0 z-50 bg-[#051b42]/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full shadow-2xl text-left border border-gray-100 space-y-5 relative"
            >
              <button
                type="button"
                onClick={() => setShowInstructions(false)}
                className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-brand-blue/10 text-brand-blue rounded-2xl">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-sans font-extrabold text-lg text-brand-dark">Adicionar à Tela Inicial</h3>
                  <p className="text-xs text-gray-500 font-medium">Siga estes 2 passos simples</p>
                </div>
              </div>

              {deviceType === 'ios' ? (
                <div className="space-y-3 text-xs text-gray-700 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-brand-blue text-white font-extrabold flex items-center justify-center shrink-0 text-xs">1</span>
                    <p className="pt-0.5">
                      Toque no botão <strong className="text-brand-dark">Compartilhar</strong> <Share className="w-4 h-4 inline text-brand-blue mx-0.5" /> no menu do seu navegador Safari.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-brand-blue text-white font-extrabold flex items-center justify-center shrink-0 text-xs">2</span>
                    <p className="pt-0.5">
                      Role para baixo e toque em <strong className="text-brand-dark">Adicionar à Tela Inicial</strong> <PlusSquare className="w-4 h-4 inline text-brand-blue mx-0.5" />.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs text-gray-700 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-brand-blue text-white font-extrabold flex items-center justify-center shrink-0 text-xs">1</span>
                    <p className="pt-0.5">
                      Toque no menu de <strong className="text-brand-dark">3 pontinhos</strong> <MoreVertical className="w-4 h-4 inline text-brand-blue mx-0.5" /> no canto superior do navegador Chrome.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-brand-blue text-white font-extrabold flex items-center justify-center shrink-0 text-xs">2</span>
                    <p className="pt-0.5">
                      Selecione <strong className="text-brand-dark">Instalar aplicativo</strong> ou <strong className="text-brand-dark">Adicionar à Tela Inicial</strong>.
                    </p>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleConfirmManualInstall}
                className="w-full bg-[#d4ff5e] hover:bg-[#c3f542] text-[#051b42] font-black py-3.5 px-4 rounded-xl shadow-md text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Pronto, já adicionei!</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
