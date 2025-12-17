import { useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  Play, 
  ArrowLeft,
  AlertTriangle, 
  CheckCircle2,
  Clock,
  XCircle,
  Globe,
  FileText,
  Loader2,
  Activity,
  Database,
  Zap,
  Download
} from "lucide-react";
import { 
  useSecurityAudit, 
  useAuditModuleExecutions,
  useAuditFindings,
  useRunAudit,
  moduleTypeLabels,
  AuditStatus,
  AuditModuleExecution
} from "@/hooks/useSecurityAudits";
import { AuditFindingsList } from "@/components/audit/AuditFindingsList";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { generateAuditPDF } from "@/lib/generateAuditPDF";
import { useToast } from "@/hooks/use-toast";

const statusConfig: Record<AuditStatus, { label: string; icon: React.ElementType; className: string }> = {
  pending: { label: "Pendente", icon: Clock, className: "bg-muted text-muted-foreground" },
  running: { label: "Em Execução", icon: Loader2, className: "bg-blue-500/10 text-blue-500" },
  completed: { label: "Concluída", icon: CheckCircle2, className: "bg-green-500/10 text-green-500" },
  failed: { label: "Falhou", icon: XCircle, className: "bg-red-500/10 text-red-500" },
  cancelled: { label: "Cancelada", icon: XCircle, className: "bg-muted text-muted-foreground" },
};

export default function AuditDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: audit, isLoading: auditLoading } = useSecurityAudit(id!);
  const { data: executions = [] } = useAuditModuleExecutions(id!);
  const { data: findings = [] } = useAuditFindings(id!);
  const runAudit = useRunAudit();
  const { toast } = useToast();

  const handleExportPDF = () => {
    if (!audit) return;
    try {
      generateAuditPDF(audit, findings, executions);
      toast({
        title: "PDF gerado",
        description: "O relatório foi baixado com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF",
        variant: "destructive",
      });
    }
  };

  if (auditLoading || !audit) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  const status = statusConfig[audit.status];
  const StatusIcon = status.icon;
  
  const completedModules = executions.filter(e => e.status === "completed").length;
  const totalModules = executions.length;
  const progress = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/security-audits">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">{audit.name}</h1>
              <Badge className={status.className}>
                <StatusIcon className={`h-3 w-3 mr-1 ${audit.status === "running" ? "animate-spin" : ""}`} />
                {status.label}
              </Badge>
            </div>
            {audit.description && (
              <p className="text-muted-foreground mt-1">{audit.description}</p>
            )}
          </div>
          {audit.status === "pending" && (
            <Button onClick={() => runAudit.mutate(audit.id)} disabled={runAudit.isPending}>
              {runAudit.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Executar Auditoria
            </Button>
          )}
          {audit.status === "completed" && (
            <Button variant="outline" onClick={handleExportPDF}>
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">URL Alvo</p>
                  <p className="text-sm font-medium truncate">
                    {audit.target_url || audit.target_domain || "Não definido"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Activity className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Módulos</p>
                  <p className="text-sm font-medium">
                    {completedModules}/{totalModules} executados
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <FileText className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Findings</p>
                  <p className="text-sm font-medium">{audit.total_findings} total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Críticos</p>
                  <p className="text-sm font-medium">{audit.critical_findings}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar (if running) */}
        {audit.status === "running" && (
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progresso da Auditoria</span>
                  <span className="text-muted-foreground">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="findings">
          <TabsList>
            <TabsTrigger value="findings" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Findings ({audit.total_findings})
            </TabsTrigger>
            <TabsTrigger value="modules" className="gap-2">
              <Zap className="h-4 w-4" />
              Módulos ({executions.length})
            </TabsTrigger>
            <TabsTrigger value="details" className="gap-2">
              <Database className="h-4 w-4" />
              Detalhes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="findings" className="mt-4">
            <AuditFindingsList auditId={audit.id} />
          </TabsContent>

          <TabsContent value="modules" className="mt-4">
            <div className="space-y-3">
              {executions.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Zap className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      Nenhum módulo executado ainda. Execute a auditoria para ver os resultados.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                executions.map((execution) => (
                  <ModuleExecutionCard key={execution.id} execution={execution} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="details" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Auditoria</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">ID</p>
                    <p className="font-mono text-sm">{audit.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Resource Points</p>
                    <p className="text-sm">{audit.resource_points}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Criada em</p>
                    <p className="text-sm">
                      {format(new Date(audit.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  {audit.started_at && (
                    <div>
                      <p className="text-sm text-muted-foreground">Iniciada em</p>
                      <p className="text-sm">
                        {format(new Date(audit.started_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  )}
                  {audit.completed_at && (
                    <div>
                      <p className="text-sm text-muted-foreground">Concluída em</p>
                      <p className="text-sm">
                        {format(new Date(audit.completed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  )}
                </div>

                {audit.config && Object.keys(audit.config).length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Configuração</p>
                    <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto">
                      {JSON.stringify(audit.config, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function ModuleExecutionCard({ execution }: { execution: AuditModuleExecution }) {
  const status = statusConfig[execution.status];
  const StatusIcon = status.icon;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", status.className.split(" ")[0])}>
              <StatusIcon className={cn("h-4 w-4", status.className.split(" ")[1], execution.status === "running" && "animate-spin")} />
            </div>
            <div>
              <p className="font-medium">{moduleTypeLabels[execution.module_type]}</p>
              <p className="text-xs text-muted-foreground">{execution.module_type}</p>
            </div>
          </div>
          <div className="text-right">
            <Badge className={status.className}>{status.label}</Badge>
            {execution.duration_ms && (
              <p className="text-xs text-muted-foreground mt-1">
                {execution.duration_ms}ms
              </p>
            )}
          </div>
        </div>
        
        {execution.error_message && (
          <div className="mt-3 p-2 bg-red-500/10 rounded text-sm text-red-500">
            {execution.error_message}
          </div>
        )}

        {execution.output_data && Object.keys(execution.output_data).length > 0 && (
          <details className="mt-3">
            <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
              Ver Output
            </summary>
            <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-auto max-h-40">
              {JSON.stringify(execution.output_data, null, 2)}
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
