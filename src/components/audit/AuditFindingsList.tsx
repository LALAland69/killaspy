import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  Info, 
  AlertCircle, 
  CheckCircle2,
  Shield,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Loader2
} from "lucide-react";
import { useAuditFindings, useUpdateFinding, AuditFinding, FindingSeverity } from "@/hooks/useSecurityAudits";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const severityConfig: Record<FindingSeverity, { label: string; icon: React.ElementType; className: string; bgClass: string }> = {
  critical: { label: "Crítico", icon: AlertCircle, className: "text-red-500", bgClass: "bg-red-500/10" },
  high: { label: "Alto", icon: AlertTriangle, className: "text-orange-500", bgClass: "bg-orange-500/10" },
  medium: { label: "Médio", icon: AlertTriangle, className: "text-yellow-500", bgClass: "bg-yellow-500/10" },
  low: { label: "Baixo", icon: Info, className: "text-blue-500", bgClass: "bg-blue-500/10" },
  info: { label: "Info", icon: Info, className: "text-muted-foreground", bgClass: "bg-muted" },
};

interface AuditFindingsListProps {
  auditId?: string;
}

export function AuditFindingsList({ auditId }: AuditFindingsListProps) {
  const { data: findings = [], isLoading } = useAuditFindings(auditId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (findings.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">Nenhum finding encontrado</p>
        </CardContent>
      </Card>
    );
  }

  // Group by severity
  const groupedFindings = findings.reduce((acc, finding) => {
    if (!acc[finding.severity]) {
      acc[finding.severity] = [];
    }
    acc[finding.severity].push(finding);
    return acc;
  }, {} as Record<FindingSeverity, AuditFinding[]>);

  const severityOrder: FindingSeverity[] = ["critical", "high", "medium", "low", "info"];

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-4 flex-wrap">
        {severityOrder.map((severity) => {
          const count = groupedFindings[severity]?.length || 0;
          if (count === 0) return null;
          const config = severityConfig[severity];
          return (
            <Badge key={severity} variant="outline" className={cn("gap-1", config.className)}>
              <config.icon className="h-3 w-3" />
              {count} {config.label}
            </Badge>
          );
        })}
      </div>

      {/* Findings by severity */}
      {severityOrder.map((severity) => {
        const severityFindings = groupedFindings[severity];
        if (!severityFindings || severityFindings.length === 0) return null;
        const config = severityConfig[severity];

        return (
          <div key={severity} className="space-y-2">
            <h3 className={cn("text-sm font-medium flex items-center gap-2", config.className)}>
              <config.icon className="h-4 w-4" />
              {config.label} ({severityFindings.length})
            </h3>
            <div className="space-y-2">
              {severityFindings.map((finding) => (
                <FindingCard key={finding.id} finding={finding} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface FindingCardProps {
  finding: AuditFinding;
}

function FindingCard({ finding }: FindingCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const updateFinding = useUpdateFinding();
  const config = severityConfig[finding.severity];
  const Icon = config.icon;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={cn(
        "border-l-4",
        finding.severity === "critical" && "border-l-red-500",
        finding.severity === "high" && "border-l-orange-500",
        finding.severity === "medium" && "border-l-yellow-500",
        finding.severity === "low" && "border-l-blue-500",
        finding.severity === "info" && "border-l-muted-foreground",
        finding.is_resolved && "opacity-60"
      )}>
        <CollapsibleTrigger asChild>
          <CardContent className="p-4 cursor-pointer hover:bg-muted/50">
            <div className="flex items-start gap-3">
              <div className={cn("p-2 rounded-lg", config.bgClass)}>
                <Icon className={cn("h-4 w-4", config.className)} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{finding.title}</h4>
                  {finding.is_resolved && (
                    <Badge variant="outline" className="text-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Resolvido
                    </Badge>
                  )}
                  {finding.is_false_positive && (
                    <Badge variant="outline" className="text-muted-foreground">
                      Falso Positivo
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {finding.description}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span>{finding.finding_type}</span>
                  {finding.affected_url && (
                    <span className="flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                      {finding.affected_domain}
                    </span>
                  )}
                  <span>
                    {formatDistanceToNow(new Date(finding.created_at), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
              </div>
              {isOpen ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CardContent>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4 border-t pt-4">
            {finding.description && (
              <div>
                <h5 className="text-sm font-medium mb-1">Descrição</h5>
                <p className="text-sm text-muted-foreground">{finding.description}</p>
              </div>
            )}

            {finding.evidence && Object.keys(finding.evidence).length > 0 && (
              <div>
                <h5 className="text-sm font-medium mb-1">Evidências</h5>
                <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-40">
                  {JSON.stringify(finding.evidence, null, 2)}
                </pre>
              </div>
            )}

            {finding.remediation && (
              <div>
                <h5 className="text-sm font-medium mb-1">Remediação</h5>
                <p className="text-sm text-muted-foreground">{finding.remediation}</p>
              </div>
            )}

            {finding.affected_url && (
              <div>
                <h5 className="text-sm font-medium mb-1">URL Afetada</h5>
                <a 
                  href={finding.affected_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  {finding.affected_url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateFinding.mutate({ 
                  findingId: finding.id, 
                  updates: { is_resolved: !finding.is_resolved } 
                })}
                disabled={updateFinding.isPending}
              >
                {finding.is_resolved ? (
                  <>
                    <X className="h-4 w-4 mr-1" />
                    Reabrir
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Marcar Resolvido
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateFinding.mutate({ 
                  findingId: finding.id, 
                  updates: { is_false_positive: !finding.is_false_positive } 
                })}
                disabled={updateFinding.isPending}
              >
                {finding.is_false_positive ? "Desfazer Falso Positivo" : "Marcar Falso Positivo"}
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
