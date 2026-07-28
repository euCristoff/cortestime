import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { firebaseService } from '../services/firebaseService';
import LogoIcon from './LogoIcon';
import { Mail, Lock, Building2, User, Phone, Eye, EyeOff, Sparkles, ArrowLeft, BadgeAlert } from 'lucide-react';
import { MerchantUser } from '../types';

interface AuthPageProps {
  onAuthSuccess: (merchant: MerchantUser) => void;
  onBackToLanding: () => void;
  initialMode?: 'login' | 'signup';
}

export default function AuthPage({ onAuthSuccess, onBackToLanding, initialMode = 'login' }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState<boolean>(initialMode === 'login');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Google Auth specific state
  const [isCompletingGoogleSignUp, setIsCompletingGoogleSignUp] = useState<boolean>(false);
  const [googleUser, setGoogleUser] = useState<any>(null);

  // Sign up fields
  const [nomeBarbearia, setNomeBarbearia] = useState('');
  const [nomeProprietario, setNomeProprietario] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  // Renderiza erros de forma amigável, especialmente o erro de domínio não autorizado do Firebase
  const renderError = (errStr: string | null) => {
    if (!errStr) return null;

    if (errStr.startsWith("unauthorized-domain:")) {
      const currentHost = window.location.hostname;
      const domains = [currentHost];
      if (currentHost.includes("-dev-")) {
        domains.push(currentHost.replace("-dev-", "-pre-"));
      } else if (currentHost.includes("-pre-")) {
        domains.push(currentHost.replace("-pre-", "-dev-"));
      }
      if (!domains.includes("localhost")) {
        domains.push("localhost");
      }
      const uniqueDomains = Array.from(new Set(domains));

      return (
        <div className="p-4 bg-amber-50 text-amber-900 rounded-2xl text-xs space-y-3 border border-amber-200">
          <div className="flex items-center gap-2 font-bold text-amber-800">
            <BadgeAlert className="w-4.5 h-4.5 shrink-0" />
            <span>Domínios não Autorizados no Firebase</span>
          </div>
          <p className="text-gray-700 leading-relaxed text-left">
            Para permitir o login do Google neste preview, você precisa adicionar estes domínios como autorizados no seu painel do Firebase:
          </p>
          
          <div className="space-y-2">
            {uniqueDomains.map((dom) => (
              <div key={dom} className="bg-white p-2.5 rounded-xl border border-amber-200 font-mono text-[11px] flex justify-between items-center gap-2">
                <span className="truncate text-gray-700">{dom}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(dom);
                    alert(`Domínio "${dom}" copiado!`);
                  }}
                  className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg font-sans font-bold text-[10px] transition-colors shrink-0 cursor-pointer"
                >
                  Copiar
                </button>
              </div>
            ))}
          </div>

          <ol className="list-decimal list-inside space-y-1 text-[11px] text-gray-600 pl-1 leading-relaxed text-left">
            <li>Acesse o <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="underline font-bold text-amber-800 hover:text-amber-900">Console do Firebase</a></li>
            <li>Selecione o seu projeto <strong>cortestimey</strong></li>
            <li>No menu lateral esquerdo, vá em <strong>Build</strong> &gt; <strong>Authentication</strong></li>
            <li>Clique na aba <strong>Settings (Configurações)</strong> na parte superior</li>
            <li>Clique em <strong>Authorized Domains (Domínios Autorizados)</strong></li>
            <li>Adicione os domínios copiados acima na lista</li>
          </ol>
        </div>
      );
    }

    if (errStr === "auth/operation-not-allowed") {
      return (
        <div className="p-4 bg-amber-50 text-amber-900 rounded-2xl text-xs space-y-3 border border-amber-200">
          <div className="flex items-center gap-2 font-bold text-amber-800">
            <BadgeAlert className="w-4.5 h-4.5 shrink-0" />
            <span>Ative o Login com E-mail e Senha no Firebase</span>
          </div>
          <p className="text-gray-700 leading-relaxed text-left">
            O provedor de login por <strong>E-mail/Senha</strong> precisa ser ativado no console do Firebase para que você possa se cadastrar ou fazer login:
          </p>
          
          <ol className="list-decimal list-inside space-y-2 text-[11px] text-gray-600 pl-1 leading-relaxed text-left">
            <li>Acesse o <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="underline font-bold text-amber-800 hover:text-amber-900">Console do Firebase</a></li>
            <li>Selecione o seu projeto <strong>cortestimey</strong></li>
            <li>No menu lateral esquerdo, clique em <strong>Build</strong> &gt; <strong>Authentication</strong></li>
            <li>Clique no botão <strong>Começar (Get Started)</strong> se for o primeiro acesso, ou vá na aba <strong>Sign-in method</strong></li>
            <li>Em <strong>Provedores nativos (Native providers)</strong>, clique em <strong>E-mail/Senha (Email/Password)</strong></li>
            <li>Ative a primeira opção <strong>E-mail/senha (Ativar)</strong> e clique em <strong>Salvar (Save)</strong></li>
          </ol>

          <p className="text-[10px] text-gray-500 italic mt-2">
            Após salvar no console do Firebase, você poderá cadastrar e logar na sua barbearia normalmente aqui!
          </p>
        </div>
      );
    }

    if (
      errStr.toLowerCase().includes("offline") || 
      errStr.toLowerCase().includes("could not reach") || 
      errStr.toLowerCase().includes("unavailable") ||
      errStr.toLowerCase().includes("network-request-failed")
    ) {
      return (
        <div className="p-3.5 bg-amber-50 text-amber-900 rounded-2xl text-xs space-y-1 border border-amber-200">
          <div className="flex items-center gap-2 font-bold text-amber-800">
            <BadgeAlert className="w-4.5 h-4.5 shrink-0" />
            <span>Sem Conexão ou Instabilidade no Servidor</span>
          </div>
          <p className="text-gray-700 leading-relaxed text-left font-normal">
            Não foi possível estabelecer conexão com o banco de dados. Por favor, verifique sua conexão de internet e tente novamente em instantes.
          </p>
        </div>
      );
    }

    return (
      <div className="p-3.5 bg-red-50 text-red-600 rounded-xl text-xs font-semibold flex items-start gap-2 border border-red-100">
        <BadgeAlert className="w-4 h-4 shrink-0 mt-0.5" />
        <span className="text-left">{errStr}</span>
      </div>
    );
  };

  // Listen to redirect results when the component mounts
  useEffect(() => {
    let isMounted = true;
    const checkRedirect = async () => {
      try {
        const result = await firebaseService.handleRedirectResult();
        if (!result || !isMounted) return;
        
        if (result.isNew) {
          // New user! Transition to complete profile state
          setGoogleUser(result.user);
          setNomeProprietario(result.user.displayName || "");
          setIsCompletingGoogleSignUp(true);
        } else if (result.merchant) {
          // Existing user, sign in successfully
          onAuthSuccess(result.merchant);
        }
      } catch (err: any) {
        console.error("Redirect Auth error:", err);
        if (err.code === "auth/unauthorized-domain" || (err.message && err.message.includes("unauthorized-domain"))) {
          setError(`unauthorized-domain:${window.location.hostname}`);
        } else {
          setError(err.message || "Erro ao processar login com o Google.");
        }
      }
    };
    checkRedirect();
    return () => {
      isMounted = false;
    };
  }, [onAuthSuccess]);

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const isIframe = window.self !== window.top;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

      // Se for dispositivo móvel e NÃO estiver em um iframe (como no site em produção),
      // o signInWithRedirect é recomendado e não sofre bloqueio de popups.
      if (isMobile && !isIframe) {
        await firebaseService.signInWithGoogle();
        return; // getRedirectResult no useEffect cuidará do restante ao retornar
      }

      // Caso contrário (Desktop ou dentro do preview/iframe do AI Studio), usa popup
      const result = await firebaseService.signInWithGooglePopup();
      if (result.isNew) {
        // Novo usuário! Transiciona para completar o perfil
        setGoogleUser(result.user);
        setNomeProprietario(result.user.displayName || "");
        setIsCompletingGoogleSignUp(true);
      } else if (result.merchant) {
        // Usuário existente, entra com sucesso
        onAuthSuccess(result.merchant);
      }
    } catch (err: any) {
      console.error("Google Auth error:", err);
      let friendlyMessage = err.message || "Erro ao iniciar o login com o Google.";
      if (
        err.code === "auth/popup-blocked" || 
        err.code === "auth/popup-closed-by-user" || 
        (err.message && err.message.includes("popup-closed-by-user"))
      ) {
        const isIframe = window.self !== window.top;
        // Se falhou no popup e não está no iframe, tenta redirecionar como plano de fundo (fallback)
        if (!isIframe) {
          try {
            await firebaseService.signInWithGoogle();
            return;
          } catch (redirectErr) {
            console.error("Redirect fallback error:", redirectErr);
          }
        }
        friendlyMessage = "O popup de login do Google foi bloqueado ou fechado pelo navegador. Por favor, tente novamente ou use o login por E-mail e Senha.";
      } else if (err.code === "auth/unauthorized-domain" || (err.message && err.message.includes("unauthorized-domain"))) {
        friendlyMessage = `unauthorized-domain:${window.location.hostname}`;
      }
      setError(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleUser) return;
    
    setError(null);
    setIsLoading(true);
    
    try {
      if (!nomeBarbearia || !nomeProprietario || !whatsapp) {
        throw new Error("Por favor, preencha todos os campos.");
      }
      const merchant = await firebaseService.saveGoogleMerchantProfile(
        googleUser,
        nomeBarbearia,
        nomeProprietario,
        whatsapp
      );
      onAuthSuccess(merchant);
    } catch (err: any) {
      console.error("Google save profile error:", err);
      setError(err.message || "Ocorreu um erro ao salvar seu perfil.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        if (!email || !senha) {
          throw new Error("Por favor, preencha todos os campos.");
        }
        const merchant = await firebaseService.signIn(email, senha);
        onAuthSuccess(merchant);
      } else {
        if (!email || !senha || !nomeBarbearia || !nomeProprietario || !whatsapp) {
          throw new Error("Por favor, preencha todos os campos.");
        }
        if (senha.length < 6) {
          throw new Error("A senha deve conter no mínimo 6 caracteres.");
        }
        const merchant = await firebaseService.signUp(email, senha, nomeBarbearia, nomeProprietario, whatsapp);
        onAuthSuccess(merchant);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      let friendlyMessage = err.message || "Ocorreu um erro inesperado.";
      
      // Customize Firebase specific auth error messages
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        friendlyMessage = "E-mail ou senha incorretos. Verifique suas credenciais.";
      } else if (err.code === "auth/email-already-in-use") {
        friendlyMessage = "Este e-mail já possui uma conta cadastrada. Direcionamos você para a tela de login para que possa entrar.";
        setIsLogin(true);
      } else if (err.code === "auth/invalid-email") {
        friendlyMessage = "Formato de e-mail inválido.";
      } else if (err.code === "auth/weak-password") {
        friendlyMessage = "A senha é muito fraca. Escolha uma senha mais forte.";
      } else if (err.code === "auth/operation-not-allowed") {
        friendlyMessage = "auth/operation-not-allowed";
      }
      
      setError(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-brand-dark flex flex-col justify-between py-6 px-4 relative overflow-hidden">
      
      {/* Background soft elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-blue/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-lime/10 rounded-full blur-3xl -z-10" />

      {/* HEADER WITH LOGO */}
      <header className="max-w-md mx-auto w-full flex items-center justify-between pb-4 border-b border-gray-100">
        <button 
          onClick={onBackToLanding}
          className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-1.5">
          <LogoIcon className="w-6 h-6" />
          <span className="font-sans font-extrabold text-lg text-[#051b42]">Cortestime</span>
        </div>

        <div className="w-9" /> {/* Spacer */}
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex items-center justify-center py-8">
        <div className="w-full max-w-md bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm">
          
          {isCompletingGoogleSignUp ? (
            <>
              <div className="text-center mb-6">
                <h2 className="font-display font-bold text-2xl text-brand-dark">
                  Conclua seu cadastro
                </h2>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-1.5 text-brand-blue">
                  Só mais alguns detalhes para ativar sua barbearia
                </p>
              </div>

              <form onSubmit={handleGoogleProfileSubmit} className="space-y-4 text-left">
                {/* Nome da barbearia */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600">Nome da barbearia</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                      <Building2 className="w-4 h-4" />
                    </span>
                    <input 
                      type="text" 
                      required
                      value={nomeBarbearia}
                      onChange={e => setNomeBarbearia(e.target.value)}
                      placeholder="Ex: Barbearia do Bosque"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-brand-blue focus:outline-none transition-colors text-sm bg-gray-50"
                    />
                  </div>
                </div>

                {/* Nome do proprietário */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600">Nome do proprietário</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input 
                      type="text" 
                      required
                      value={nomeProprietario}
                      onChange={e => setNomeProprietario(e.target.value)}
                      placeholder="Ex: Carlos de Souza"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-brand-blue focus:outline-none transition-colors text-sm bg-gray-50"
                    />
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600">WhatsApp</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input 
                      type="tel" 
                      required
                      value={whatsapp}
                      onChange={e => setWhatsapp(e.target.value)}
                      placeholder="Ex: (11) 99999-9999"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-brand-blue focus:outline-none transition-colors text-sm bg-gray-50"
                    />
                  </div>
                </div>

                {/* ERROR DISPLAY */}
                {renderError(error)}

                {/* SUBMIT BUTTON */}
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-brand-blue hover:bg-brand-blue-light disabled:bg-gray-400 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-brand-blue/10 transition-all uppercase text-xs tracking-wider mt-2 flex justify-center items-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-brand-lime" />
                      <span>Concluir Cadastro</span>
                    </>
                  )}
                </button>

                <button 
                  type="button"
                  onClick={() => {
                    setIsCompletingGoogleSignUp(false);
                    setGoogleUser(null);
                    setError(null);
                  }}
                  className="w-full border border-gray-200 hover:bg-gray-50 text-gray-600 font-bold py-3 px-4 rounded-xl transition-all text-xs tracking-wider uppercase mt-1 flex justify-center items-center cursor-pointer"
                >
                  Cancelar
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <h2 className="font-display font-bold text-2xl text-brand-dark">
                  {isLogin ? 'Acesse sua barbearia' : 'Cadastre sua barbearia'}
                </h2>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-1.5">
                  {isLogin ? 'Pronto para começar?' : 'Teste grátis por 7 dias'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                
                {/* SIGNUP SPECIFIC FIELDS */}
                {!isLogin && (
                  <>
                    {/* Nome da barbearia */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600">Nome da barbearia</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                          <Building2 className="w-4 h-4" />
                        </span>
                        <input 
                          type="text" 
                          required
                          value={nomeBarbearia}
                          onChange={e => setNomeBarbearia(e.target.value)}
                          placeholder="Ex: Barbearia do Bosque"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-brand-blue focus:outline-none transition-colors text-sm bg-gray-50"
                        />
                      </div>
                    </div>

                    {/* Nome do proprietário */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600">Nome do proprietário</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                          <User className="w-4 h-4" />
                        </span>
                        <input 
                          type="text" 
                          required
                          value={nomeProprietario}
                          onChange={e => setNomeProprietario(e.target.value)}
                          placeholder="Ex: Carlos de Souza"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-brand-blue focus:outline-none transition-colors text-sm bg-gray-50"
                        />
                      </div>
                    </div>

                    {/* WhatsApp */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-600">WhatsApp</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                          <Phone className="w-4 h-4" />
                        </span>
                        <input 
                          type="tel" 
                          required
                          value={whatsapp}
                          onChange={e => setWhatsapp(e.target.value)}
                          placeholder="Ex: (11) 99999-9999"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-brand-blue focus:outline-none transition-colors text-sm bg-gray-50"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Email (Common) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600">E-mail</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="Ex: proprietario@gmail.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-brand-blue focus:outline-none transition-colors text-sm bg-gray-50"
                    />
                  </div>
                </div>

                {/* Senha (Common) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600">Senha</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      required
                      value={senha}
                      onChange={e => setSenha(e.target.value)}
                      placeholder="No mínimo 6 dígitos"
                      className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 focus:border-brand-blue focus:outline-none transition-colors text-sm bg-gray-50 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* ERROR DISPLAY */}
                {renderError(error)}

                {/* SUBMIT BUTTON */}
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-brand-blue hover:bg-brand-blue-light disabled:bg-gray-400 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-brand-blue/10 transition-all uppercase text-xs tracking-wider mt-2 flex justify-center items-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      <span>Processando...</span>
                    </>
                  ) : (
                    <>
                      {!isLogin && <Sparkles className="w-4 h-4 text-brand-lime" />}
                      <span>{isLogin ? 'Entrar no Sistema' : 'Criar minha conta'}</span>
                    </>
                  )}
                </button>
              </form>

              {/* DIVIDER */}
              <div className="relative my-4 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100"></div>
                </div>
                <span className="relative bg-white px-3 text-[10px] uppercase font-bold text-gray-400 tracking-wider">ou</span>
              </div>

              {/* GOOGLE SIGN IN BUTTON */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 text-gray-700 font-bold py-3.5 px-4 rounded-xl transition-all text-xs tracking-wider uppercase flex justify-center items-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61c-.29 1.5-.1.14-.14 3.01l3.13 2.43c1.83-1.69 2.89-4.17 2.89-7.29z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.13-2.43c-.87.58-1.98.93-3.17.93-2.44 0-4.5-1.65-5.24-3.87H5.15v2.51C7.13 21.82 12 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M6.76 15.72c-.19-.58-.3-1.2-.3-1.85s.11-1.27.3-1.85V9.51H5.15C4.51 10.79 4.15 12.24 4.15 13.75s.36 2.96 1 4.24l1.61-2.27z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.93 1.19 15.24 0 12 0 7.13 0 2.22 4.18.24 7.51l1.61 2.21c1.51-2.22 3.57-3.87 6.15-3.87z"
                  />
                </svg>
                <span>Entrar com o Google</span>
              </button>

              {/* TOGGLE LINK */}
              <div className="text-center mt-6 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 font-medium">
                  {isLogin ? 'Novo por aqui?' : 'Já possui uma conta?'}
                  <button 
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError(null);
                    }}
                    className="text-brand-blue hover:underline font-bold ml-1"
                  >
                    {isLogin ? 'Cadastre sua barbearia' : 'Fazer login'}
                  </button>
                </p>
              </div>
            </>
          )}

        </div>
      </main>

      {/* FOOTER */}
      <footer className="max-w-md mx-auto w-full text-center text-[11px] text-gray-400">
        &copy; {new Date().getFullYear()} Cortestime S.A. Todos os direitos reservados.
      </footer>
    </div>
  );
}
