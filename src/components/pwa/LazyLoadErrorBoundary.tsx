import { Component, ReactNode } from "react";
import { AlertTriangle, RotateCcw, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearCacheAndReload } from "@/lib/pwaRecovery";
import { logger, getCurrentCorrelationId } from "@/lib/logger";

interface Props {
  children: ReactNode;
  fallbackTimeout?: number; // ms before showing recovery UI
}

interface State {
  hasError: boolean;
  timedOut: boolean;
  errorMessage: string | null;
}

export class LazyLoadErrorBoundary extends Component<Props, State> {
  private timeoutId: NodeJS.Timeout | null = null;

  state: State = {
    hasError: false,
    timedOut: false,
    errorMessage: null,
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      errorMessage: error.message,
    };
  }

  componentDidCatch(error: Error) {
    logger.error("LAZY_LOAD", "Chunk loading error", {
      message: error.message,
      stack: error.stack,
      correlationId: getCurrentCorrelationId(),
    });
  }

  componentDidMount() {
    this.startTimeout();
  }

  componentWillUnmount() {
    this.clearTimeout();
  }

  componentDidUpdate(prevProps: Props) {
    // Reset timeout if children change (navigation)
    if (prevProps.children !== this.props.children) {
      this.clearTimeout();
      if (!this.state.hasError && !this.state.timedOut) {
        this.startTimeout();
      }
    }
  }

  private startTimeout() {
    const timeout = this.props.fallbackTimeout ?? 15000; // 15s default
    this.timeoutId = setTimeout(() => {
      if (!this.state.hasError) {
        logger.warn("LAZY_LOAD", "Loading timeout exceeded", {
          timeout,
          correlationId: getCurrentCorrelationId(),
        });
        this.setState({ timedOut: true });
      }
    }, timeout);
  }

  private clearTimeout() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  private handleRetry = () => {
    this.clearTimeout();
    this.setState({ hasError: false, timedOut: false, errorMessage: null }, () => {
      this.startTimeout();
    });
    window.location.reload();
  };

  private handleClearCache = async () => {
    await clearCacheAndReload({ reason: "lazy_load_error_boundary" });
  };

  render() {
    const { hasError, timedOut, errorMessage } = this.state;

    if (hasError || timedOut) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-foreground">
                {hasError ? "Erro ao carregar página" : "Carregamento demorado"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {hasError
                  ? "Um arquivo da aplicação não pôde ser carregado. Isso pode acontecer após uma atualização."
                  : "A página está demorando mais que o esperado. Pode haver um problema de cache."}
              </p>
              {errorMessage && (
                <p className="text-xs font-mono text-destructive/80 bg-destructive/5 p-2 rounded mt-2 break-all">
                  {errorMessage}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <Button onClick={this.handleClearCache} className="w-full">
                <RotateCcw className="h-4 w-4 mr-2" />
                Limpar cache e recarregar
              </Button>
              <Button variant="outline" onClick={this.handleRetry} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar novamente
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              ID: {getCurrentCorrelationId().slice(0, 8)}
            </p>
          </div>
        </div>
      );
    }

    // Clear timeout when children render successfully
    this.clearTimeout();

    return this.props.children;
  }
}
