import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CreditCard, 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  Copy, 
  Check, 
  Lock, 
  Sparkles, 
  QrCode,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { MerchantUser } from '../types';

interface MercadoPagoCheckoutProps {
  planName: string;
  price: number;
  merchant: MerchantUser;
  onPaymentSuccess: () => void;
  onClose: () => void;
}

export default function MercadoPagoCheckout({ 
  planName, 
  price, 
  merchant, 
  onPaymentSuccess, 
  onClose 
}: MercadoPagoCheckoutProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initPoint, setInitPoint] = useState<string | null>(null);
  const [isSandbox, setIsSandbox] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simulationSuccess, setSimulationSuccess] = useState(false);

  useEffect(() => {
    async function fetchPreference() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/payments/create-preference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planName,
            price,
            merchantUid: merchant.uid,
            email: merchant.email
          })
        });

        let data;
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch (e) {
          console.error("Non-JSON response received:", text);
          if (response.status === 403) {
            setError('MERCADO_PAGO_POLICY_BLOCKED');
            return;
          }
          throw new Error(`Erro no servidor (${response.status}). Não foi possível ler a resposta de pagamentos.`);
        }

        if (!response.ok) {
          if (data && data.policyBlocked) {
            setError('MERCADO_PAGO_POLICY_BLOCKED');
            return;
          }
          throw new Error(data?.error || 'Não foi possível gerar a preferência de pagamento.');
        }

        if (data.success) {
          if (data.sandbox && !data.init_point) {
            setError('MERCADO_PAGO_NOT_CONFIGURED');
          } else {
            setIsSandbox(false);
            setInitPoint(data.init_point);
          }
        } else {
          throw new Error(data.error || 'Erro desconhecido ao carregar.');
        }
      } catch (err: any) {
        console.error('Error fetching Mercado Pago preference:', err);
        setError(err.message || 'Erro ao gerar link de pagamento do Mercado Pago.');
      } finally {
        setLoading(false);
      }
    }

    fetchPreference();
  }, [planName, price, merchant.uid, merchant.email]);

  const handleCopyLink = () => {
    if (!initPoint) return;
    navigator.clipboard.writeText(initPoint);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSimulatePayment = () => {
    setSimulating(true);
    setTimeout(() => {
      setSimulating(false);
      setSimulationSuccess(true);
      setTimeout(() => {
        onPaymentSuccess();
      }, 1500);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#051b42]/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -15 }}
        className="bg-[#09224f] border border-white/15 rounded-[32px] max-w-lg w-full p-6 md:p-8 text-white shadow-2xl relative space-y-6 my-8"
      >
        {/* CLOSE BUTTON */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors cursor-pointer text-xl font-bold leading-none"
        >
          &times;
        </button>

        {/* HEADER */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-brand-blue/20 text-brand-lime px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest border border-brand-blue/30">
            <Lock className="w-3 h-3 text-brand-lime" />
            <span>Mercado Pago Checkout Oficial</span>
          </div>
          <h3 className="font-sans font-black text-2xl tracking-tight">Ativar Assinatura Pro</h3>
          <p className="text-xs text-gray-300">
            Você está assinando o <span className="font-bold text-brand-lime">Plano {planName}</span> por <span className="font-bold text-white font-mono">R$ {price.toFixed(2)}</span>
          </p>
        </div>

        {simulating || simulationSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center animate-fade-in">
            {simulating ? (
              <>
                <Loader2 className="w-12 h-12 animate-spin text-amber-400" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-amber-300">Processando Pagamento Simulado...</p>
                  <p className="text-xs text-gray-400">Homologando seu plano de testes Pro no banco de dados...</p>
                </div>
              </>
            ) : (
              <>
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl animate-pulse"></div>
                  <CheckCircle2 className="w-16 h-16 text-emerald-400 relative z-10" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-black text-emerald-400">Assinatura Ativada!</p>
                  <p className="text-xs text-gray-300">Seu plano Cortestime Pro está ativo. Redirecionando...</p>
                </div>
              </>
            )}
          </div>
        ) : loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-brand-lime" />
            <p className="text-xs text-gray-300 font-medium">Iniciando pagamento seguro com Mercado Pago...</p>
          </div>
        ) : error ? (
          /* DETAILED PRODUCTION ERRORS */
          <div className="space-y-4 py-2">
            {error === 'MERCADO_PAGO_POLICY_BLOCKED' ? (
              <div className="bg-red-500/15 border border-red-500/40 p-5 rounded-2xl text-left flex gap-3.5 items-start text-xs leading-relaxed">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-3">
                  <p className="font-bold text-red-300">Credencial recusada pelo Mercado Pago (PolicyAgent)</p>
                  <p className="text-gray-300 text-[11px]">
                    Sua chave do Mercado Pago está inserida, mas a transação foi recusada pela política de segurança da sua conta (<code className="bg-black/30 px-1 py-0.5 rounded text-red-300 font-mono">PA_UNAUTHORIZED_RESULT_FROM_POLICIES</code>).
                  </p>
                  <p className="text-gray-300 text-[11px] font-semibold">Causas comuns:</p>
                  <ul className="list-disc pl-4 space-y-1 text-gray-400 text-[11px]">
                    <li>Sua conta Mercado Pago <span className="text-white font-medium">ainda não está totalmente homologada</span> ou faltam dados cadastrais (CPF/CNPJ).</li>
                    <li>Tentativa de realizar um pagamento com a mesma conta vendedora do token.</li>
                  </ul>
                  <p className="text-gray-300 text-[11px]">
                    Por favor, revise o cadastro da sua conta de vendedor no site de desenvolvedores do Mercado Pago e tente novamente.
                  </p>
                </div>
              </div>
            ) : error === 'MERCADO_PAGO_NOT_CONFIGURED' ? (
              <div className="bg-amber-400/10 border border-amber-400/30 p-5 rounded-2xl text-left flex gap-3.5 items-start text-xs leading-relaxed">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="font-bold text-amber-200">Token de Produção não configurado</p>
                  <p className="text-gray-300 text-[11px]">
                    Para iniciar transações reais e gerar QR Codes de cobrança verdadeiros, configure o segredo <code className="bg-black/30 px-1 py-0.5 rounded text-white font-mono text-[9px]">MERCADO_PAGO_ACCESS_TOKEN</code> no painel de configurações do app.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-red-500/15 border border-red-500/40 p-5 rounded-2xl text-left flex gap-3.5 items-start text-xs leading-relaxed">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-red-300">Erro na Integração do Mercado Pago</p>
                  <p className="text-gray-300 text-[11px]">{error}</p>
                </div>
              </div>
            )}

            {/* INTERACTIVE DEMO / TEST MODE SIMULATOR */}
            <div className="p-4 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-center space-y-3">
              <div className="space-y-1 text-left">
                <p className="text-xs font-bold text-amber-300">💡 Ativar com Modo Simulado (Recomendado para Testes)</p>
                <p className="text-[10px] text-gray-300 leading-normal">
                  Como este é um ambiente de desenvolvimento ou sua credencial está com alguma pendência nas políticas do Mercado Pago, disponibilizamos este atalho de simulação para você homologar os recursos premium do plano Pro instantaneamente.
                </p>
              </div>
              <button
                onClick={handleSimulatePayment}
                className="w-full bg-amber-400 hover:bg-amber-500 text-[#051b42] font-black py-3 rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Simular Ativação do Plano Pro</span>
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-white/10 hover:bg-white/15 text-white font-bold py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Fechar Painel
            </button>
          </div>
        ) : initPoint ? (
          /* REAL PRODUCTION GATEWAY VIEW WITH REAL QR CODE */
          <div className="space-y-5 text-center py-2 animate-fade-in flex flex-col items-center">
            <div className="bg-white p-3 rounded-2xl shadow-inner inline-block">
              {/* Generate real QR Code pointing directly to the real Mercado Pago checkout */}
              <QRCodeSVG 
                value={initPoint} 
                size={180} 
                level="H" 
                includeMargin={true}
                className="w-40 h-40"
              />
            </div>

            <div className="space-y-1 text-center max-w-sm">
              <p className="text-xs font-bold text-brand-lime">PIX & Cartão • QR Code Real de Pagamento</p>
              <p className="text-[11px] text-gray-300 leading-relaxed">
                Escaneie o código acima com a câmera do seu celular para abrir o Mercado Pago ou clique nos botões abaixo para pagar diretamente:
              </p>
            </div>

            <div className="w-full space-y-3 pt-2">
              <a 
                href={initPoint} 
                target="_blank" 
                rel="noreferrer"
                className="w-full bg-[#bffd32] hover:bg-[#a6e025] text-[#051b42] font-black py-4 px-6 rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl shadow-brand-lime/10 cursor-pointer text-center font-sans border-none"
              >
                <span>Pagar via Mercado Pago</span>
                <ExternalLink className="w-4 h-4 stroke-[2.5]" />
              </a>

              <button
                onClick={handleCopyLink}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white py-3.5 rounded-2xl text-xs font-bold transition-all uppercase tracking-wide cursor-pointer flex items-center justify-center gap-1.5"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Link de Pagamento Copiado!' : 'Copiar Link de Pagamento'}</span>
              </button>
            </div>

            <div className="bg-white/5 border border-white/5 p-3.5 rounded-2xl flex gap-2.5 items-start text-left text-[10px] text-gray-400 leading-normal max-w-sm">
              <Sparkles className="w-4 h-4 text-brand-lime shrink-0 mt-0.5" />
              <span>
                Ao concluir o pagamento oficial na página do Mercado Pago, seu plano será migrado automaticamente sem precisar recarregar o app.
              </span>
            </div>
          </div>
        ) : null}

        {/* FOOTER */}
        <div className="text-center text-[10px] text-gray-500 font-medium pt-2 border-t border-white/5">
          Cortestime &copy; {new Date().getFullYear()} • Transações criptografadas e protegidas
        </div>
      </motion.div>
    </div>
  );
}
