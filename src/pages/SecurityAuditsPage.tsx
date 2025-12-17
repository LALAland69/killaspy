import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  Plus, 
  Play, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2,
  Clock,
  XCircle,
  BarChart3,
  Search,
  Globe,
  FileText,
  Loader2,
  Eye
} from "lucide-react";
import { 
  useSecurityAudits, 
  useAuditStats, 
  useRunAudit, 
  useDeleteAudit,
  SecurityAudit,
  AuditStatus
} from "@/hooks/useSecurityAudits";
import { CreateAuditDialog } from "@/components/audit/CreateAuditDialog";
import { AuditFindingsList } from "@/components/audit/AuditFindingsList";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

const statusConfig: Record<AuditStatus, { label: string; icon: React.ElementType; className: string }> = {
  pending: { label: "Pendente", icon: Clock, className: "bg-muted text-muted-foreground" },
  running: { label: "Em Execução", icon: Loader2, className: "bg-blue-500/10 text-blue-500" },
  completed: { label: "Concluída", icon: CheckCircle2, className: "bg-green-500/10 text-green-500" },
  failed: { label: "Falhou", icon: XCircle, className: "bg-red-500/10 text-red-500" },
  cancelled: { label: "Cancelada", icon: XCircle, className: "bg-muted text-muted-foreground" },
};

export default function SecurityAuditsPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { data: audits = [], isLoading } = useSecurityAudits();
  const { data: stats } = useAuditStats();
  const runAudit = useRunAudit();
  const deleteAudit = useDeleteAudit();

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              Auditoria de Segurança
            </h1>
            <p className="text-muted-foreground">
              Suíte de verificação de consistência e conformidade
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Auditoria
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{stats?.totalAudits || 0}</p>
                  <p className="text-xs text-muted-foreground">Total de Auditorias</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Loader2 className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{stats?.runningAudits || 0}</p>
                  <p className="text-xs text-muted-foreground">Em Execução</p>
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
                  <p className="text-2xl font-semibold">{stats?.criticalFindings || 0}</p>
                  <p className="text-xs text-muted-foreground">Findings Críticos</p>
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
                  <p className="text-2xl font-semibold">{stats?.unresolvedFindings || 0}</p>
                  <p className="text-xs text-muted-foreground">Não Resolvidos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="audits">
          <TabsList>
            <TabsTrigger value="audits" className="gap-2">
              <Shield className="h-4 w-4" />
              Auditorias
            </TabsTrigger>
            <TabsTrigger value="findings" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Todos os Findings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="audits" className="space-y-4 mt-4">
            {isLoading ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </CardContent>
              </Card>
            ) : audits.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Shield className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">Nenhuma auditoria criada ainda</p>
                  <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Auditoria
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {audits.map((audit) => (
                  <AuditCard 
                    key={audit.id} 
                    audit={audit} 
                    onRun={() => runAudit.mutate(audit.id)}
                    onDelete={() => deleteAudit.mutate(audit.id)}
                    isRunning={runAudit.isPending}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="findings" className="mt-4">
            <AuditFindingsList />
          </TabsContent>
        </Tabs>

        <CreateAuditDialog 
          open={createDialogOpen} 
          onOpenChange={setCreateDialogOpen} 
        />
      </div>
    </AppLayout>
  );
}

interface AuditCardProps {
  audit: SecurityAudit;
  onRun: () => void;
  onDelete: () => void;
  isRunning: boolean;
}

function AuditCard({ audit, onRun, onDelete, isRunning }: AuditCardProps) {
  const status = statusConfig[audit.status];
  const StatusIcon = status.icon;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-lg">{audit.name}</h3>
              <Badge className={status.className}>
                <StatusIcon className={`h-3 w-3 mr-1 ${audit.status === "running" ? "animate-spin" : ""}`} />
                {status.label}
              </Badge>
            </div>
            
            {audit.description && (
              <p className="text-sm text-muted-foreground mb-3">{audit.description}</p>
            )}

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {audit.target_url && (
                <span className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  {audit.target_url.substring(0, 50)}...
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatDistanceToNow(new Date(audit.created_at), { addSuffix: true, locale: ptBR })}
              </span>
            </div>

            {audit.status === "completed" && (
              <div className="flex items-center gap-4 mt-3">
                <Badge variant="outline" className="gap-1">
                  <FileText className="h-3 w-3" />
                  {audit.total_findings} findings
                </Badge>
                {audit.critical_findings > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {audit.critical_findings} críticos
                  </Badge>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link to={`/security-audits/${audit.id}`}>
                <Eye className="h-4 w-4 mr-1" />
                Detalhes
              </Link>
            </Button>
            {audit.status === "pending" && (
              <Button
                size="sm"
                onClick={onRun}
                disabled={isRunning}
              >
                {isRunning ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-1" />
                )}
                Executar
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
