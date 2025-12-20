-- Fix get_dashboard_stats() function with defensive assertions and audit logging
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS TABLE (
  total_ads bigint,
  high_risk_ads bigint,
  champion_ads bigint,
  strong_ads bigint,
  promising_ads bigint,
  testing_ads bigint,
  avg_suspicion_score integer,
  avg_longevity_days integer,
  last_ad_created timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tenant_id uuid;
  _user_id uuid;
BEGIN
  _user_id := auth.uid();
  
  -- Defensive assertion: Require authenticated user
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required';
  END IF;
  
  _tenant_id := get_user_tenant_id(_user_id);
  
  -- Defensive assertion: Require valid tenant access
  IF _tenant_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: No tenant access';
  END IF;
  
  -- Log access attempt for security auditing
  INSERT INTO public.security_audit_log (
    user_id,
    tenant_id,
    action,
    resource_type,
    severity
  ) VALUES (
    _user_id,
    _tenant_id,
    'dashboard_stats_access',
    'materialized_view',
    'info'
  );
  
  RETURN QUERY
  SELECT 
    mv.total_ads,
    mv.high_risk_ads,
    mv.champion_ads,
    mv.strong_ads,
    mv.promising_ads,
    mv.testing_ads,
    mv.avg_suspicion_score,
    mv.avg_longevity_days,
    mv.last_ad_created
  FROM public.mv_dashboard_stats mv
  WHERE mv.tenant_id = _tenant_id;
END;
$$;