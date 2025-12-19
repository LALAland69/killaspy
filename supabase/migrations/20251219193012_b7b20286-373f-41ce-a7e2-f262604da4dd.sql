-- Remover materialized view da API pública (mover para schema interno)
-- A view será acessada apenas via função RPC

-- Revogar acesso anon e authenticated à materialized view
REVOKE ALL ON public.mv_dashboard_stats FROM anon, authenticated;

-- Criar função RPC segura para acessar os stats
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
  last_ad_created timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tenant_id uuid;
BEGIN
  _tenant_id := get_user_tenant_id(auth.uid());
  
  IF _tenant_id IS NULL THEN
    RETURN;
  END IF;
  
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