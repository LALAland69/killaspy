import { Link } from "react-router-dom";
import { AlertTriangle, Clock, ExternalLink, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFacebookApiStatus } from "@/hooks/useFacebookApiStatus";

export default function FacebookApiStatusBanner() {
  const { isWorking, isLoading, isChecking, checkStatus, statusInfo } = useFacebookApiStatus();

  // Don't show banner if API is working
  if (isWorking && !isLoading) return null;

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-foreground">
              Aguardando Propagação da API Facebook
            </h4>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          <p className="text-sm text-muted-foreground">
            O app Facebook foi publicado em modo LIVE. A propagação pode levar até 30 minutos. 
            {statusInfo?.error_code === 1 && " Erro temporário detectado (código 1)."}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button 
              variant="outline" 
              size="sm"
              onClick={checkStatus}
              disabled={isChecking}
              className="border-amber-500/30 hover:bg-amber-500/10"
            >
              {isChecking ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Verificar Status
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              asChild
            >
              <Link to="/facebook-setup">
                <ExternalLink className="h-4 w-4 mr-2" />
                Ver Troubleshooting
              </Link>
            </Button>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>~30 min</span>
        </div>
      </div>
    </div>
  );
}