import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.href = '/';
  };

  private handleClearStorageAndReload = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#051b42] text-white flex items-center justify-center p-4">
          <div className="bg-[#09224f] border border-white/15 rounded-3xl max-w-md w-full p-8 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">Oops! Algo deu errado</h2>
              <p className="text-xs text-gray-300">
                Ocorreu uma oscilação na renderização da página. Clique abaixo para recarregar ou limpar a sessão.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="bg-black/30 border border-white/10 p-3 rounded-xl text-left font-mono text-[11px] text-red-300 max-h-24 overflow-y-auto break-all">
                {this.state.error.message}
              </div>
            )}

            <div className="space-y-2.5 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full bg-[#bffd32] hover:bg-[#a6e025] text-[#051b42] font-black py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recarregar Página</span>
              </button>

              <button
                onClick={this.handleClearStorageAndReload}
                className="w-full bg-white/10 hover:bg-white/15 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all border border-white/10"
              >
                <Home className="w-4 h-4" />
                <span>Limpar Cache e Ir ao Início</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
