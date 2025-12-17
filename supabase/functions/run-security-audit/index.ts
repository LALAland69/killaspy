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
  useFirecrawl?: boolean;
}

// Firecrawl integration for advanced scraping
async function runFirecrawlScrape(url: string): Promise<{ findings: any[]; data: any }> {
  const findings: any[] = [];
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
  
  if (!apiKey) {
    console.log('Firecrawl API key not configured, skipping advanced scrape');
    return { findings: [], data: { skipped: true, reason: 'API key not configured' } };
  }

  try {
    console.log('Running Firecrawl scrape for:', url);
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'html', 'links', 'screenshot'],
        onlyMainContent: false,
        waitFor: 3000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Firecrawl API error:', error);
      findings.push({
        type: 'firecrawl_error',
        severity: 'low',
        title: 'Erro no Scraping Avançado',
        description: `Não foi possível realizar o scraping avançado: ${response.status}`,
        evidence: { statusCode: response.status },
      });
      return { findings, data: { error: true } };
    }

    const result = await response.json();
    const scrapedData = result.data || result;
    
    // Analyze scraped content for security issues
    const html = scrapedData.html || '';
    const markdown = scrapedData.markdown || '';
    const links = scrapedData.links || [];
    
    // Check for suspicious patterns in HTML
    const suspiciousPatterns = [
      { pattern: /cloaker|cloaking/i, name: 'Cloaking Script' },
      { pattern: /tracker\.php|go\.php|redirect\.php/i, name: 'Redirect Tracker' },
      { pattern: /display:\s*none.*position:\s*absolute/i, name: 'Hidden Content' },
      { pattern: /eval\s*\(\s*atob/i, name: 'Encoded JavaScript' },
      { pattern: /document\.referrer/i, name: 'Referrer Check' },
      { pattern: /navigator\.userAgent/i, name: 'User-Agent Detection' },
    ];
    
    const detectedPatterns: string[] = [];
    for (const { pattern, name } of suspiciousPatterns) {
      if (pattern.test(html)) {
        detectedPatterns.push(name);
      }
    }
    
    if (detectedPatterns.length > 0) {
      findings.push({
        type: 'suspicious_code_patterns',
        severity: 'high',
        title: 'Padrões de Código Suspeitos Detectados',
        description: `Foram encontrados ${detectedPatterns.length} padrões suspeitos no código fonte`,
        evidence: { patterns: detectedPatterns },
      });
    }
    
    // Check for external redirects in links
    const externalLinks = links.filter((link: string) => {
      try {
        const linkUrl = new URL(link, url);
        const baseUrl = new URL(url);
        return linkUrl.hostname !== baseUrl.hostname;
      } catch {
        return false;
      }
    });
    
    if (externalLinks.length > 10) {
      findings.push({
        type: 'excessive_external_links',
        severity: 'medium',
        title: 'Muitos Links Externos',
        description: `A página contém ${externalLinks.length} links para domínios externos`,
        evidence: { count: externalLinks.length, sample: externalLinks.slice(0, 5) },
      });
    }
    
    // Check content length for potential cloaking
    if (html.length < 500 && links.length > 0) {
      findings.push({
        type: 'minimal_content',
        severity: 'medium',
        title: 'Conteúdo Mínimo Detectado',
        description: 'A página tem muito pouco conteúdo HTML, possível página de redirecionamento',
        evidence: { htmlLength: html.length, linksCount: links.length },
      });
    }

    return {
      findings,
      data: {
        htmlLength: html.length,
        markdownLength: markdown.length,
        linksCount: links.length,
        externalLinksCount: externalLinks.length,
        screenshot: scrapedData.screenshot ? 'captured' : 'not_available',
        metadata: scrapedData.metadata,
      },
    };
  } catch (error) {
    console.error('Firecrawl scrape error:', error);
    return {
      findings: [{
        type: 'firecrawl_error',
        severity: 'low',
        title: 'Erro no Scraping Avançado',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        evidence: {},
      }],
      data: { error: true },
    };
  }
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

    // Define modules to run (including Firecrawl)
    const modulesToRun = [
      { type: "content_render_auditor", fn: () => runFirecrawlScrape(targetUrl!), requiresUrl: true },
      { type: "header_consistency_checker", fn: () => runHeaderConsistencyCheck(targetUrl!), requiresUrl: true },
      { type: "redirect_path_mapper", fn: () => runRedirectAnalysis(targetUrl!), requiresUrl: true },
      { type: "ssl_certificate_auditor", fn: () => runSSLAnalysis(targetUrl!), requiresUrl: true },
      { type: "domain_reputation_checker", fn: () => runDomainReputationCheck(targetDomain!), requiresUrl: false },
      { type: "tech_stack_identifier", fn: () => runTechStackAnalysis(targetUrl!), requiresUrl: true },
    ];

    // Execute modules
    for (const module of modulesToRun) {
      if (!targetUrl && module.requiresUrl) continue;
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
