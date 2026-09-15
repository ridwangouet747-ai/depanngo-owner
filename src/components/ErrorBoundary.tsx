import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <ErrorFallback
          error={this.state.error}
          onReset={() => this.setState({ hasError: false, error: null })}
        />
      );
    }
    return this.props.children;
  }
}

function ErrorFallback({ error, onReset }: { error: Error | null; onReset: () => void }) {
  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
        <AlertTriangle size={36} className="text-red-500" />
      </div>
      <h1 className="text-2xl font-black text-gray-900 mb-2">Oups, une erreur !</h1>
      <p className="text-sm text-gray-500 max-w-xs mb-1">
        Quelque chose s'est mal passé. Pas de panique, vous pouvez réessayer.
      </p>
      {error && (
        <p className="text-[10px] text-gray-400 font-mono mb-6 max-w-xs truncate">
          {error.message}
        </p>
      )}
      <div className="flex gap-3">
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-bold rounded-2xl active:scale-95 transition-transform"
        >
          <RefreshCcw size={16} />
          Réessayer
        </button>
        <button
          onClick={() => (window.location.href = "/")}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-2xl active:scale-95 transition-transform"
        >
          <Home size={16} />
          Accueil
        </button>
      </div>
    </div>
  );
}

export default ErrorBoundary;
