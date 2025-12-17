import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type AuditStatus = "pending" | "running" | "completed" | "failed" | "cancelled";
export type FindingSeverity = "info" | "low" | "medium" | "high" | "critical";
export type AuditModuleType = 
  | "social_media_ad_monitor"
  | "search_ad_monitor"
  | "tech_stack_identifier"
  | "public_record_correlator"
  | "content_render_auditor"
  | "ssl_certificate_auditor"
  | "header_consistency_checker"
  | "geolocation_load_tester"
  | "javascript_execution_auditor"
  | "redirect_path_mapper"
  | "parameter_analysis_tool"
  | "visual_diff_engine"
  | "textual_content_fingerprinter"
  | "domain_reputation_checker"
  | "campaign_pattern_mapper"
  | "entity_relationship_graph";

export interface SecurityAudit {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  target_url: string | null;
  target_domain: string | null;
  target_advertiser_id: string | null;
  status: AuditStatus;
  config: Record<string, unknown>;
  resource_points: number;
  total_findings: number;
  critical_findings: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditModuleExecution {
  id: string;
  tenant_id: string;
  audit_id: string;
  module_type: AuditModuleType;
  status: AuditStatus;
  input_data: Record<string, unknown>;
  output_data: Record<string, unknown>;
  error_message: string | null;
  resource_cost: number;
  duration_ms: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface AuditFinding {
  id: string;
  tenant_id: string;
  audit_id: string;
  module_execution_id: string | null;
  finding_type: string;
  severity: FindingSeverity;
  title: string;
  description: string | null;
  evidence: Record<string, unknown>;
  affected_url: string | null;
  affected_domain: string | null;
  remediation: string | null;
  is_false_positive: boolean;
  is_resolved: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContentSnapshot {
  id: string;
  tenant_id: string;
  audit_id: string | null;
  url: string;
  content_hash: string | null;
  html_content: string | null;
  text_content: string | null;
  headers_sent: Record<string, unknown>;
  response_headers: Record<string, unknown>;
  response_code: number | null;
  redirect_chain: string[];
  screenshot_url: string | null;
  user_agent: string | null;
  geo_location: string | null;
  captured_at: string;
  created_at: string;
}

// Fetch all audits
export function useSecurityAudits() {
  return useQuery({
    queryKey: ["security_audits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("security_audits")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SecurityAudit[];
    },
  });
}

// Fetch single audit with details
export function useSecurityAudit(auditId: string) {
  return useQuery({
    queryKey: ["security_audits", auditId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("security_audits")
        .select("*")
        .eq("id", auditId)
        .single();

      if (error) throw error;
      return data as SecurityAudit;
    },
    enabled: !!auditId,
  });
}

// Fetch audit module executions
export function useAuditModuleExecutions(auditId: string) {
  return useQuery({
    queryKey: ["audit_module_executions", auditId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_module_executions")
        .select("*")
        .eq("audit_id", auditId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as AuditModuleExecution[];
    },
    enabled: !!auditId,
  });
}

// Fetch audit findings
export function useAuditFindings(auditId?: string) {
  return useQuery({
    queryKey: ["audit_findings", auditId],
    queryFn: async () => {
      let query = supabase
        .from("audit_findings")
        .select("*")
        .order("severity", { ascending: false })
        .order("created_at", { ascending: false });

      if (auditId) {
        query = query.eq("audit_id", auditId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AuditFinding[];
    },
  });
}

// Fetch content snapshots
export function useContentSnapshots(auditId: string) {
  return useQuery({
    queryKey: ["content_snapshots", auditId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_snapshots")
        .select("*")
        .eq("audit_id", auditId)
        .order("captured_at", { ascending: false });

      if (error) throw error;
      return data as ContentSnapshot[];
    },
    enabled: !!auditId,
  });
}

// Audit statistics
export function useAuditStats() {
  return useQuery({
    queryKey: ["audit_stats"],
    queryFn: async () => {
      const { data: audits, error: auditsError } = await supabase
        .from("security_audits")
        .select("status, total_findings, critical_findings");

      if (auditsError) throw auditsError;

      const { data: findings, error: findingsError } = await supabase
        .from("audit_findings")
        .select("severity, is_resolved");

      if (findingsError) throw findingsError;

      const stats = {
        totalAudits: audits?.length || 0,
        runningAudits: audits?.filter(a => a.status === "running").length || 0,
        completedAudits: audits?.filter(a => a.status === "completed").length || 0,
        totalFindings: findings?.length || 0,
        criticalFindings: findings?.filter(f => f.severity === "critical").length || 0,
        highFindings: findings?.filter(f => f.severity === "high").length || 0,
        unresolvedFindings: findings?.filter(f => !f.is_resolved).length || 0,
      };

      return stats;
    },
  });
}

// Create new audit
export function useCreateAudit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (audit: {
      name: string;
      description?: string;
      target_url?: string;
      target_domain?: string;
      config?: Record<string, unknown>;
    }) => {
      // Get user's tenant_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("user_id", user.id)
        .single();

      if (!profile?.tenant_id) throw new Error("No tenant found");

      const { data, error } = await supabase
        .from("security_audits")
        .insert({
          name: audit.name,
          description: audit.description,
          target_url: audit.target_url,
          target_domain: audit.target_domain,
          config: audit.config || {},
          tenant_id: profile.tenant_id,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data as SecurityAudit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["security_audits"] });
      toast({
        title: "Auditoria criada",
        description: "A auditoria foi criada com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar auditoria",
        variant: "destructive",
      });
    },
  });
}

// Run audit
export function useRunAudit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (auditId: string) => {
      const { data, error } = await supabase.functions.invoke("run-security-audit", {
        body: { auditId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["security_audits"] });
      queryClient.invalidateQueries({ queryKey: ["audit_module_executions"] });
      queryClient.invalidateQueries({ queryKey: ["audit_findings"] });
      toast({
        title: "Auditoria iniciada",
        description: "A auditoria está sendo executada",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao iniciar auditoria",
        variant: "destructive",
      });
    },
  });
}

// Update finding status
export function useUpdateFinding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      findingId, 
      updates 
    }: { 
      findingId: string; 
      updates: Partial<Pick<AuditFinding, "is_false_positive" | "is_resolved">> 
    }) => {
      const { data, error } = await supabase
        .from("audit_findings")
        .update(updates)
        .eq("id", findingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audit_findings"] });
      queryClient.invalidateQueries({ queryKey: ["security_audits"] });
    },
  });
}

// Delete audit
export function useDeleteAudit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (auditId: string) => {
      const { error } = await supabase
        .from("security_audits")
        .delete()
        .eq("id", auditId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["security_audits"] });
      toast({
        title: "Auditoria excluída",
        description: "A auditoria foi excluída com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao excluir auditoria",
        variant: "destructive",
      });
    },
  });
}

// Module type labels
export const moduleTypeLabels: Record<AuditModuleType, string> = {
  social_media_ad_monitor: "Monitor de Anúncios Sociais",
  search_ad_monitor: "Monitor de Anúncios de Busca",
  tech_stack_identifier: "Identificador de Tech Stack",
  public_record_correlator: "Correlacionador de Registros Públicos",
  content_render_auditor: "Auditor de Renderização",
  ssl_certificate_auditor: "Auditor de Certificados SSL",
  header_consistency_checker: "Verificador de Consistência de Headers",
  geolocation_load_tester: "Testador de Carga Geográfica",
  javascript_execution_auditor: "Auditor de Execução JavaScript",
  redirect_path_mapper: "Mapeador de Redirecionamentos",
  parameter_analysis_tool: "Análise de Parâmetros",
  visual_diff_engine: "Engine de Diff Visual",
  textual_content_fingerprinter: "Fingerprint de Conteúdo",
  domain_reputation_checker: "Verificador de Reputação",
  campaign_pattern_mapper: "Mapeador de Padrões",
  entity_relationship_graph: "Grafo de Relacionamentos",
};

// Module categories
export const moduleCategories = {
  collection: ["social_media_ad_monitor", "search_ad_monitor", "tech_stack_identifier", "public_record_correlator", "content_render_auditor", "ssl_certificate_auditor"],
  verification: ["header_consistency_checker", "geolocation_load_tester", "javascript_execution_auditor", "redirect_path_mapper", "parameter_analysis_tool"],
  analysis: ["visual_diff_engine", "textual_content_fingerprinter", "domain_reputation_checker", "campaign_pattern_mapper", "entity_relationship_graph"],
};
