import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Trash2, 
  AlertTriangle, 
  Info, 
  AlertCircle, 
  TrendingUp,
  RefreshCw,
  Settings,
  Filter
} from "lucide-react";
import { 
  useAlerts, 
  useUnreadAlertsCount, 
  useMarkAlertAsRead, 
  useMarkAllAlertsAsRead, 
  useDeleteAlert,
  useCheckNewAds
} from "@/hooks/useAlerts";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "react-router-dom";

const severityIcons = {
  info: Info,
  warning: AlertTriangle,
  error: AlertCircle,
  success: TrendingUp,
};

const severityColors = {
  info: "text-blue-400 bg-blue-400/10",
  warning: "text-yellow-400 bg-yellow-400/10",
  error: "text-red-400 bg-red-400/10",
  success: "text-green-400 bg-green-400/10",
};

const alertTypeLabels: Record<string, string> = {
  new_ad: "Novo Anúncio",
  competitor_activity: "Atividade de Concorrente",
  trend_alert: "Alerta de Tendência",
  cloaking_detected: "Cloaking Detectado",
  high_suspicion: "Alta Suspeita",
};

export default function AlertsPage() {
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  
  const { data: alerts = [], isLoading, refetch } = useAlerts();
  const { data: unreadCount = 0 } = useUnreadAlertsCount();
  const markAsRead = useMarkAlertAsRead();
  const markAllAsRead = useMarkAllAlertsAsRead();
  const deleteAlert = useDeleteAlert();
  const checkNewAds = useCheckNewAds();

  const filteredAlerts = alerts.filter((alert) => {
    if (severityFilter !== "all" && alert.severity !== severityFilter) return false;
    if (typeFilter !== "all" && alert.alert_type !== typeFilter) return false;
    return true;
  });

  const unreadAlerts = filteredAlerts.filter((a) => !a.is_read);
  const readAlerts = filteredAlerts.filter((a) => a.is_read);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Alertas</h1>
            <p className="text-muted-foreground">
              {unreadCount} alertas não lidos
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => checkNewAds.mutate()}
              disabled={checkNewAds.isPending}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", checkNewAds.isPending && "animate-spin")} />
              Verificar Novos
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAsRead.mutate()}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Marcar Todos
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-400/10">
                  <Bell className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{alerts.length}</p>
                  <p className="text-xs text-muted-foreground">Total de Alertas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-400/10">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{unreadCount}</p>
                  <p className="text-xs text-muted-foreground">Não Lidos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-400/10">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">
                    {alerts.filter((a) => a.severity === "error").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Críticos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-400/10">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">
                    {alerts.filter((a) => a.alert_type === "new_ad").length}
                  </p>
                  <p className="text-xs text-muted-foreground">Novos Anúncios</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filtros:</span>
          </div>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Severidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warning">Aviso</SelectItem>
              <SelectItem value="error">Crítico</SelectItem>
              <SelectItem value="success">Sucesso</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="new_ad">Novo Anúncio</SelectItem>
              <SelectItem value="competitor_activity">Concorrente</SelectItem>
              <SelectItem value="cloaking_detected">Cloaking</SelectItem>
              <SelectItem value="high_suspicion">Alta Suspeita</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Alerts List */}
        <Tabs defaultValue="unread">
          <TabsList>
            <TabsTrigger value="unread" className="gap-2">
              Não Lidos
              {unreadAlerts.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {unreadAlerts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">Todos</TabsTrigger>
          </TabsList>

          <TabsContent value="unread" className="space-y-4 mt-4">
            {unreadAlerts.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Nenhum alerta não lido</p>
                </CardContent>
              </Card>
            ) : (
              unreadAlerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onMarkAsRead={() => markAsRead.mutate(alert.id)}
                  onDelete={() => deleteAlert.mutate(alert.id)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4 mt-4">
            {filteredAlerts.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Nenhum alerta encontrado</p>
                </CardContent>
              </Card>
            ) : (
              filteredAlerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onMarkAsRead={() => markAsRead.mutate(alert.id)}
                  onDelete={() => deleteAlert.mutate(alert.id)}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

interface AlertCardProps {
  alert: {
    id: string;
    alert_type: string;
    title: string;
    message: string | null;
    severity: string;
    is_read: boolean;
    related_ad_id: string | null;
    related_advertiser_id: string | null;
    created_at: string;
  };
  onMarkAsRead: () => void;
  onDelete: () => void;
}

function AlertCard({ alert, onMarkAsRead, onDelete }: AlertCardProps) {
  const Icon = severityIcons[alert.severity as keyof typeof severityIcons] || Info;
  const colorClass = severityColors[alert.severity as keyof typeof severityColors] || "text-muted-foreground bg-muted";

  return (
    <Card className={cn(!alert.is_read && "border-l-4 border-l-primary")}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className={cn("p-2 rounded-lg", colorClass.split(" ")[1])}>
            <Icon className={cn("h-5 w-5", colorClass.split(" ")[0])} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium">{alert.title}</h3>
              <Badge variant="outline" className="text-xs">
                {alertTypeLabels[alert.alert_type] || alert.alert_type}
              </Badge>
              {!alert.is_read && (
                <Badge className="bg-primary text-xs">Novo</Badge>
              )}
            </div>
            {alert.message && (
              <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{format(new Date(alert.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
              <span>•</span>
              <span>{formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: ptBR })}</span>
              {alert.related_ad_id && (
                <>
                  <span>•</span>
                  <Link to={`/ads`} className="text-primary hover:underline">
                    Ver Anúncio
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {!alert.is_read && (
              <Button variant="ghost" size="icon" onClick={onMarkAsRead}>
                <Check className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="text-destructive" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
