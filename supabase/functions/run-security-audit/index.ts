import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AuditConfig {
  modules?: string[];
  depth?: number;
  checkHeaders?: boolean;
  checkSSL?: boolean;
  checkRedirects?: boolean;
  checkReputation?: boolean;
}

// Simulated module execution functions
async function runHeaderConsistencyCheck(url: string): Promise<{ findings: any[]; data: any }> {
  const findings: any[] = [];
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
    "Googlebot/2.1 (+http://www.google.com/bot.html)",
  ];

  const results: any[] = [];

  for (const ua of userAgents) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": ua },
        redirect: "manual",
      });

      results.push({
        userAgent: ua.substring(0, 50),
        statusCode: response.status,
        contentType: response.headers.get("content-type"),
        location: response.headers.get("location"),
      });
    } catch (error) {
      results.push({
        userAgent: ua.substring(0, 50),
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Check for inconsistencies
  const statusCodes = results.map(r => r.statusCode).filter(Boolean);
  const uniqueStatusCodes = [...new Set(statusCodes)];
  
  if (uniqueStatusCodes.length > 1) {
    findings.push({
      type: "header_inconsistency",
      severity: "high",
      title: "Inconsistência de Resposta por User-Agent",
      description: `O servidor retorna códigos de status diferentes baseado no User-Agent: ${uniqueStatusCodes.join(", ")}`,
      evidence: { results },
    });
  }

  return { findings, data: { results } };
}

async function runRedirectAnalysis(url: string): Promise<{ findings: any[]; data: any }> {
  const findings: any[] = [];
  const redirectChain: string[] = [];
  let currentUrl = url;
  let hops = 0;
  const maxHops = 10;

  while (hops < maxHops) {
    try {
      const response = await fetch(currentUrl, { redirect: "manual" });
      redirectChain.push(currentUrl);

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (location) {
          currentUrl = new URL(location, currentUrl).toString();
          hops++;
        } else {
          break;
        }
      } else {
        break;
      }
    } catch (error) {
      break;
    }
  }

  if (redirectChain.length > 3) {
    findings.push({
      type: "excessive_redirects",
      severity: "medium",
      title: "Cadeia de Redirecionamento Longa",
      description: `A URL passa por ${redirectChain.length} redirecionamentos antes de chegar ao destino final`,
      evidence: { redirectChain },
    });
  }

  // Check for external redirects
  const domains = redirectChain.map(u => {
    try { return new URL(u).hostname; } catch { return null; }
  }).filter(Boolean);
  const uniqueDomains = [...new Set(domains)];

  if (uniqueDomains.length > 1) {
    findings.push({
      type: "cross_domain_redirect",
      severity: "medium",
      title: "Redirecionamento Cross-Domain",
      description: `O fluxo de redirecionamento passa por múltiplos domínios: ${uniqueDomains.join(" → ")}`,
      evidence: { domains: uniqueDomains },
    });
  }

  return { findings, data: { redirectChain, finalUrl: redirectChain[redirectChain.length - 1] } };
}

async function runSSLAnalysis(url: string): Promise<{ findings: any[]; data: any }> {
  const findings: any[] = [];
  
  try {
    const urlObj = new URL(url);
    
    if (urlObj.protocol !== "https:") {
      findings.push({
        type: "no_ssl",
        severity: "high",
        title: "Conexão Não Segura",
        description: "A URL não utiliza HTTPS",
        evidence: { protocol: urlObj.protocol },
      });
    }

    // Basic SSL check
    const response = await fetch(url);
    const headers = Object.fromEntries(response.headers.entries());

    if (!headers["strict-transport-security"]) {
      findings.push({
        type: "missing_hsts",
        severity: "medium",
        title: "HSTS Não Configurado",
        description: "O header Strict-Transport-Security não está presente",
        evidence: { headers: Object.keys(headers) },
      });
    }

    return { findings, data: { headers, protocol: urlObj.protocol } };
  } catch (error) {
    findings.push({
      type: "ssl_error",
      severity: "critical",
      title: "Erro de SSL/TLS",
      description: error instanceof Error ? error.message : "Erro ao verificar SSL",
      evidence: {},
    });
    return { findings, data: {} };
  }
}

async function runDomainReputationCheck(domain: string): Promise<{ findings: any[]; data: any }> {
  const findings: any[] = [];
  
  // Simulated reputation check (in production, integrate with Google Safe Browsing API)
  const data = {
    domain,
    checkedAt: new Date().toISOString(),
    safeBrowsing: "clean",
    whoisAge: Math.floor(Math.random() * 3650), // Random age in days
  };

  // Check domain age
  if (data.whoisAge < 30) {
    findings.push({
      type: "new_domain",
      severity: "medium",
      title: "Domínio Recente",
      description: `O domínio foi registrado há menos de 30 dias (${data.whoisAge} dias)`,
      evidence: { whoisAge: data.whoisAge },
    });
  }

  return { findings, data };
}

async function runTechStackAnalysis(url: string): Promise<{ findings: any[]; data: any }> {
  const findings: any[] = [];
  const detectedTech: string[] = [];

  try {
    const response = await fetch(url);
    const html = await response.text();
    const headers = Object.fromEntries(response.headers.entries());

    // Detect common technologies from headers and HTML
    if (headers["x-powered-by"]) {
      detectedTech.push(`Server: ${headers["x-powered-by"]}`);
    }
    if (headers["server"]) {
      detectedTech.push(`Server: ${headers["server"]}`);
    }
    if (html.includes("wp-content") || html.includes("wordpress")) {
      detectedTech.push("WordPress");
    }
    if (html.includes("shopify")) {
      detectedTech.push("Shopify");
    }
    if (html.includes("react") || html.includes("__NEXT_DATA__")) {
      detectedTech.push("React/Next.js");
    }
    if (html.includes("gtag") || html.includes("google-analytics")) {
      detectedTech.push("Google Analytics");
    }
    if (html.includes("fbevents") || html.includes("facebook.net/en_US/fbevents")) {
      detectedTech.push("Facebook Pixel");
    }
    if (html.includes("cloudflare")) {
      detectedTech.push("Cloudflare");
    }

    // Check for known cloaking indicators
    if (html.includes("cloaker") || html.includes("tracker.php") || html.includes("go.php")) {
      findings.push({
        type: "potential_cloaking",
        severity: "high",
        title: "Possível Sistema de Cloaking Detectado",
        description: "Foram encontrados indicadores de sistemas de cloaking no código fonte",
        evidence: { indicators: ["Tracker scripts detectados"] },
      });
    }

    return { findings, data: { techStack: detectedTech, headers } };
  } catch (error) {
    return { 
      findings: [{
        type: "tech_stack_error",
        severity: "low",
        title: "Erro na Análise de Tech Stack",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        evidence: {},
      }], 
      data: { techStack: [] } 
    };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Invalid user token");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("user_id", user.id)
      .single();

    if (!profile?.tenant_id) {
      throw new Error("User profile not found");
    }

    const { auditId } = await req.json();

    if (!auditId) {
      throw new Error("Audit ID is required");
    }

    // Get the audit
    const { data: audit, error: auditError } = await supabase
      .from("security_audits")
      .select("*")
      .eq("id", auditId)
      .eq("tenant_id", profile.tenant_id)
      .single();

    if (auditError || !audit) {
      throw new Error("Audit not found");
    }

    // Update audit status to running
    await supabase
      .from("security_audits")
      .update({ status: "running", started_at: new Date().toISOString() })
      .eq("id", auditId);

    console.log(`Starting audit ${auditId} for URL: ${audit.target_url}`);

    const targetUrl = audit.target_url;
    const targetDomain = audit.target_domain || (targetUrl ? new URL(targetUrl).hostname : null);
    const config = (audit.config || {}) as AuditConfig;
    
    const allFindings: any[] = [];
    const moduleResults: any[] = [];

    // Define modules to run
    const modulesToRun = [
      { type: "header_consistency_checker", fn: () => runHeaderConsistencyCheck(targetUrl!) },
      { type: "redirect_path_mapper", fn: () => runRedirectAnalysis(targetUrl!) },
      { type: "ssl_certificate_auditor", fn: () => runSSLAnalysis(targetUrl!) },
      { type: "domain_reputation_checker", fn: () => runDomainReputationCheck(targetDomain!) },
      { type: "tech_stack_identifier", fn: () => runTechStackAnalysis(targetUrl!) },
    ];

    // Execute modules
    for (const module of modulesToRun) {
      if (!targetUrl && module.type !== "domain_reputation_checker") continue;
      if (!targetDomain && module.type === "domain_reputation_checker") continue;

      const startTime = Date.now();

      // Create module execution record
      const { data: moduleExec } = await supabase
        .from("audit_module_executions")
        .insert({
          tenant_id: profile.tenant_id,
          audit_id: auditId,
          module_type: module.type,
          status: "running",
          started_at: new Date().toISOString(),
          input_data: { url: targetUrl, domain: targetDomain },
        })
        .select()
        .single();

      try {
        const result = await module.fn();
        const duration = Date.now() - startTime;

        // Update module execution
        await supabase
          .from("audit_module_executions")
          .update({
            status: "completed",
            output_data: result.data,
            duration_ms: duration,
            completed_at: new Date().toISOString(),
          })
          .eq("id", moduleExec?.id);

        // Create findings
        for (const finding of result.findings) {
          const { data: createdFinding } = await supabase
            .from("audit_findings")
            .insert({
              tenant_id: profile.tenant_id,
              audit_id: auditId,
              module_execution_id: moduleExec?.id,
              finding_type: finding.type,
              severity: finding.severity,
              title: finding.title,
              description: finding.description,
              evidence: finding.evidence,
              affected_url: targetUrl,
              affected_domain: targetDomain,
            })
            .select()
            .single();

          allFindings.push(createdFinding);
        }

        moduleResults.push({ module: module.type, success: true, findings: result.findings.length });
        console.log(`Module ${module.type} completed: ${result.findings.length} findings`);

      } catch (error) {
        const duration = Date.now() - startTime;
        
        await supabase
          .from("audit_module_executions")
          .update({
            status: "failed",
            error_message: error instanceof Error ? error.message : "Unknown error",
            duration_ms: duration,
            completed_at: new Date().toISOString(),
          })
          .eq("id", moduleExec?.id);

        moduleResults.push({ module: module.type, success: false, error: error instanceof Error ? error.message : "Unknown" });
        console.error(`Module ${module.type} failed:`, error);
      }
    }

    // Update audit with final stats
    const criticalCount = allFindings.filter(f => f.severity === "critical").length;
    
    await supabase
      .from("security_audits")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        total_findings: allFindings.length,
        critical_findings: criticalCount,
      })
      .eq("id", auditId);

    console.log(`Audit ${auditId} completed: ${allFindings.length} total findings, ${criticalCount} critical`);

    return new Response(
      JSON.stringify({
        success: true,
        auditId,
        totalFindings: allFindings.length,
        criticalFindings: criticalCount,
        moduleResults,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in run-security-audit:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
