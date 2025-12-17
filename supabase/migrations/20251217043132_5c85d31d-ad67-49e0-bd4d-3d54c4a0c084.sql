-- Create enum for audit status
CREATE TYPE audit_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');

-- Create enum for audit module types
CREATE TYPE audit_module_type AS ENUM (
  'social_media_ad_monitor',
  'search_ad_monitor',
  'tech_stack_identifier',
  'public_record_correlator',
  'content_render_auditor',
  'ssl_certificate_auditor',
  'header_consistency_checker',
  'geolocation_load_tester',
  'javascript_execution_auditor',
  'redirect_path_mapper',
  'parameter_analysis_tool',
  'visual_diff_engine',
  'textual_content_fingerprinter',
  'domain_reputation_checker',
  'campaign_pattern_mapper',
  'entity_relationship_graph'
);

-- Create enum for finding severity
CREATE TYPE finding_severity AS ENUM ('info', 'low', 'medium', 'high', 'critical');

-- Create security_audits table for audit campaigns
CREATE TABLE public.security_audits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  name TEXT NOT NULL,
  description TEXT,
  target_url TEXT,
  target_domain TEXT,
  target_advertiser_id UUID REFERENCES public.advertisers(id),
  status audit_status NOT NULL DEFAULT 'pending',
  config JSONB DEFAULT '{}',
  resource_points INTEGER DEFAULT 100,
  total_findings INTEGER DEFAULT 0,
  critical_findings INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_audits ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view tenant audits"
ON public.security_audits FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can insert tenant audits"
ON public.security_audits FOR INSERT
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can update tenant audits"
ON public.security_audits FOR UPDATE
USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can delete tenant audits"
ON public.security_audits FOR DELETE
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Create audit_module_executions table
CREATE TABLE public.audit_module_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  audit_id UUID NOT NULL REFERENCES public.security_audits(id) ON DELETE CASCADE,
  module_type audit_module_type NOT NULL,
  status audit_status NOT NULL DEFAULT 'pending',
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  error_message TEXT,
  resource_cost INTEGER DEFAULT 0,
  duration_ms INTEGER,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_module_executions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view tenant module executions"
ON public.audit_module_executions FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can insert tenant module executions"
ON public.audit_module_executions FOR INSERT
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can update tenant module executions"
ON public.audit_module_executions FOR UPDATE
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Create audit_findings table
CREATE TABLE public.audit_findings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  audit_id UUID NOT NULL REFERENCES public.security_audits(id) ON DELETE CASCADE,
  module_execution_id UUID REFERENCES public.audit_module_executions(id) ON DELETE SET NULL,
  finding_type TEXT NOT NULL,
  severity finding_severity NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  description TEXT,
  evidence JSONB DEFAULT '{}',
  affected_url TEXT,
  affected_domain TEXT,
  remediation TEXT,
  is_false_positive BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_findings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view tenant findings"
ON public.audit_findings FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can insert tenant findings"
ON public.audit_findings FOR INSERT
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can update tenant findings"
ON public.audit_findings FOR UPDATE
USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can delete tenant findings"
ON public.audit_findings FOR DELETE
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Create content_snapshots table for storing page snapshots during audits
CREATE TABLE public.content_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  audit_id UUID REFERENCES public.security_audits(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  content_hash TEXT,
  html_content TEXT,
  text_content TEXT,
  headers_sent JSONB DEFAULT '{}',
  response_headers JSONB DEFAULT '{}',
  response_code INTEGER,
  redirect_chain JSONB DEFAULT '[]',
  screenshot_url TEXT,
  user_agent TEXT,
  geo_location TEXT,
  captured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.content_snapshots ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view tenant snapshots"
ON public.content_snapshots FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can insert tenant snapshots"
ON public.content_snapshots FOR INSERT
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- Create indexes
CREATE INDEX idx_security_audits_tenant_id ON public.security_audits(tenant_id);
CREATE INDEX idx_security_audits_status ON public.security_audits(status);
CREATE INDEX idx_audit_findings_audit_id ON public.audit_findings(audit_id);
CREATE INDEX idx_audit_findings_severity ON public.audit_findings(severity);
CREATE INDEX idx_audit_module_executions_audit_id ON public.audit_module_executions(audit_id);
CREATE INDEX idx_content_snapshots_audit_id ON public.content_snapshots(audit_id);

-- Create trigger for updating updated_at
CREATE TRIGGER update_security_audits_updated_at
BEFORE UPDATE ON public.security_audits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_audit_findings_updated_at
BEFORE UPDATE ON public.audit_findings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();