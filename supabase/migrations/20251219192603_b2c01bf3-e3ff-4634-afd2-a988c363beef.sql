-- =============================================
-- FASE 2: CORREÇÕES DE SEGURANÇA
-- =============================================

-- 1. PROFILES: Garantir que apenas usuários autenticados possam acessar
-- A política atual já restringe a próprio perfil, mas vamos reforçar

-- Adicionar função de segurança para validar tenant
CREATE OR REPLACE FUNCTION public.validate_tenant_access(_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN FALSE
    WHEN _tenant_id IS NULL THEN FALSE
    ELSE _tenant_id = get_user_tenant_id(auth.uid())
  END
$$;

-- 2. LANDING_PAGE_SNAPSHOTS: Adicionar política INSERT faltante
CREATE POLICY "Users can insert tenant landing page snapshots"
ON public.landing_page_snapshots
FOR INSERT
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- 3. AUDIT_FINDINGS: Reforçar política SELECT com validação de tenant não nulo
DROP POLICY IF EXISTS "Users can view tenant findings" ON public.audit_findings;
CREATE POLICY "Users can view tenant findings with validation"
ON public.audit_findings
FOR SELECT
USING (
  tenant_id IS NOT NULL 
  AND tenant_id = get_user_tenant_id(auth.uid())
);

-- 4. CONTENT_SNAPSHOTS: Adicionar políticas UPDATE/DELETE faltantes
CREATE POLICY "Users can update tenant content snapshots"
ON public.content_snapshots
FOR UPDATE
USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can delete tenant content snapshots"
ON public.content_snapshots
FOR DELETE
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- 5. SAVED_ADS: Adicionar política UPDATE faltante
CREATE POLICY "Users can update saved ads"
ON public.saved_ads
FOR UPDATE
USING ((tenant_id = get_user_tenant_id(auth.uid())) AND (user_id = auth.uid()));

-- 6. AD_HISTORY: Adicionar políticas INSERT/UPDATE/DELETE para operações completas
CREATE POLICY "Users can insert tenant ad history"
ON public.ad_history
FOR INSERT
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can update tenant ad history"
ON public.ad_history
FOR UPDATE
USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can delete tenant ad history"
ON public.ad_history
FOR DELETE
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- 7. Criar tabela de audit log para operações sensíveis
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id),
  user_id uuid NOT NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  severity text DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS na tabela de audit
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver logs de segurança
CREATE POLICY "Admins can view all security logs"
ON public.security_audit_log
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Sistema pode inserir logs (via service role)
CREATE POLICY "System can insert security logs"
ON public.security_audit_log
FOR INSERT
WITH CHECK (true);

-- Índices para performance de queries de audit
CREATE INDEX IF NOT EXISTS idx_security_audit_log_tenant 
ON public.security_audit_log(tenant_id);

CREATE INDEX IF NOT EXISTS idx_security_audit_log_created 
ON public.security_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_audit_log_severity 
ON public.security_audit_log(severity) 
WHERE severity IN ('warning', 'critical');

-- 8. Função para logging de segurança
CREATE OR REPLACE FUNCTION public.log_security_event(
  _action text,
  _resource_type text,
  _resource_id text DEFAULT NULL,
  _severity text DEFAULT 'info',
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _log_id uuid;
  _tenant_id uuid;
BEGIN
  -- Obter tenant_id do usuário atual
  _tenant_id := get_user_tenant_id(auth.uid());
  
  INSERT INTO public.security_audit_log (
    tenant_id,
    user_id,
    action,
    resource_type,
    resource_id,
    severity,
    metadata
  ) VALUES (
    _tenant_id,
    auth.uid(),
    _action,
    _resource_type,
    _resource_id,
    _severity,
    _metadata
  )
  RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;