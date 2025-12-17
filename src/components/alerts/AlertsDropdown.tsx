import { Bell, Check, CheckCheck, Trash2, AlertTriangle, Info, AlertCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAlerts, useUnreadAlertsCount, useMarkAlertAsRead, useMarkAllAlertsAsRead, useDeleteAlert } from "@/hooks/useAlerts";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const severityIcons = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  success: TrendingUp,
};

const severityColors = {
  info: "text-blue-400",
  warning: "text-yellow-400",
  error: "text-red-400",
  success: "text-green-400",
};

export function AlertsDropdown() {
  const { data: alerts = [], isLoading } = useAlerts();
  const { data: unreadCount = 0 } = useUnreadAlertsCount();
  const markAsRead = useMarkAlertAsRead();
  const markAllAsRead = useMarkAllAlertsAsRead();
  const deleteAlert = useDeleteAlert();

  const recentAlerts = alerts.slice(0, 10);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Alertas</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-xs"
              onClick={() => markAllAsRead.mutate()}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Marcar todos
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            Carregando...
          </div>
        ) : recentAlerts.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            Nenhum alerta
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            {recentAlerts.map((alert) => {
              const Icon = severityIcons[alert.severity as keyof typeof severityIcons] || Info;
              const colorClass = severityColors[alert.severity as keyof typeof severityColors] || "text-muted-foreground";
              
              return (
                <DropdownMenuItem
                  key={alert.id}
                  className={cn(
                    "flex items-start gap-3 p-3 cursor-pointer",
                    !alert.is_read && "bg-muted/50"
                  )}
                  onSelect={(e) => {
                    e.preventDefault();
                    if (!alert.is_read) {
                      markAsRead.mutate(alert.id);
                    }
                  }}
                >
                  <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", colorClass)} />
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-medium truncate", !alert.is_read && "text-foreground")}>
                      {alert.title}
                    </p>
                    {alert.message && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {alert.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {!alert.is_read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead.mutate(alert.id);
                        }}
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAlert.mutate(alert.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </ScrollArea>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/alerts" className="w-full text-center text-sm text-primary">
            Ver todos os alertas
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
