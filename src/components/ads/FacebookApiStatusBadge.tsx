import { useFacebookApiStatus } from "@/hooks/useFacebookApiStatus";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RefreshCw, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface FacebookApiStatusBadgeProps {
  showRefreshButton?: boolean;
  className?: string;
}

export function FacebookApiStatusBadge({
  showRefreshButton = true,
  className,
}: FacebookApiStatusBadgeProps) {
  const { isWorking, statusInfo, lastCheckedAt, isLoading, isChecking, checkStatus } =
    useFacebookApiStatus();

  const getStatusConfig = () => {
    if (isLoading) {
      return {
        icon: RefreshCw,
        label: "Verificando...",
        variant: "secondary" as const,
        iconClass: "animate-spin",
      };
    }

    if (!statusInfo) {
      return {
        icon: AlertTriangle,
        label: "Desconhecido",
        variant: "outline" as const,
        iconClass: "",
      };
    }

    if (isWorking) {
      return {
        icon: CheckCircle2,
        label: "Operacional",
        variant: "default" as const,
        iconClass: "text-green-500",
      };
    }

    if (statusInfo.error_type === "transient") {
      return {
        icon: AlertTriangle,
        label: "Temporário",
        variant: "secondary" as const,
        iconClass: "text-yellow-500",
      };
    }

    return {
      icon: XCircle,
      label: "Erro",
      variant: "destructive" as const,
      iconClass: "",
    };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-2", className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant={config.variant} className="gap-1.5 cursor-help">
              <Icon className={cn("h-3.5 w-3.5", config.iconClass)} />
              <span>Facebook API: {config.label}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-1 text-xs">
              <p className="font-medium">Status da API do Facebook</p>
              {statusInfo?.message && (
                <p className="text-muted-foreground">{statusInfo.message}</p>
              )}
              {lastCheckedAt && (
                <p className="text-muted-foreground">
                  Última verificação:{" "}
                  {formatDistanceToNow(new Date(lastCheckedAt), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </p>
              )}
              {statusInfo?.error_type === "transient" && (
                <p className="text-yellow-600 dark:text-yellow-400">
                  Erro temporário do Facebook. Aguarde e tente novamente.
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>

        {showRefreshButton && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={checkStatus}
                disabled={isChecking}
              >
                <RefreshCw
                  className={cn("h-4 w-4", isChecking && "animate-spin")}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Verificar status agora</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
