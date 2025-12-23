import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, AlertTriangle, RotateCcw, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearCacheAndReload } from "@/lib/pwaRecovery";
import { logger, getCurrentCorrelationId } from "@/lib/logger";

interface ProtectedRouteProps {
  children: ReactNode;
  authTimeout?: number; // ms before showing recovery UI (default 8s)
}

export function ProtectedRoute({ children, authTimeout = 8000 }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!loading) {
      setTimedOut(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      if (loading) {
        logger.warn("AUTH", "Auth loading timeout exceeded", {
          timeout: authTimeout,
          correlationId: getCurrentCorrelationId(),
        });
        setTimedOut(true);
      }
    }, authTimeout);

    return () => clearTimeout(timeoutId);
  }, [loading, authTimeout]);

  const handleClearCache = async () => {
    await clearCacheAndReload({ reason: "auth_timeout_protected_route" });
  };

  const handleRetry = () => {
    window.location.reload();
  };

  // Show recovery UI if loading takes too long
  if (loading && timedOut) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-6 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              Verificação de sessão demorada
            </h2>
            <p className="text-sm text-muted-foreground">
              A autenticação está demorando mais que o esperado. Isso pode ser causado por cache desatualizado ou problemas de conexão.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button onClick={handleClearCache} className="w-full">
              <RotateCcw className="h-4 w-4 mr-2" />
              Limpar cache e recarregar
            </Button>
            <Button variant="outline" onClick={handleRetry} className="w-full">
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
