-- =============================================
-- FASE 3: OTIMIZAÇÃO DE PERFORMANCE
-- =============================================

-- 1. ÍNDICES PARA QUERIES FREQUENTES NA TABELA ADS

-- Índice composto para filtros de dashboard (suspicion_score + status)
CREATE INDEX IF NOT EXISTS idx_ads_suspicion_status 
ON public.ads(suspicion_score DESC, status) 
WHERE status = 'active';

-- Índice para busca por longevidade (winning ads)
CREATE INDEX IF NOT EXISTS idx_ads_longevity_engagement 
ON public.ads(longevity_days DESC, engagement_score DESC);

-- Índice para filtro por tenant + created_at (muito usado)
CREATE INDEX IF NOT EXISTS idx_ads_tenant_created 
ON public.ads(tenant_id, created_at DESC);

-- Índice para filtro por categoria
CREATE INDEX IF NOT EXISTS idx_ads_category_tenant 
ON public.ads(category_id, tenant_id) 
WHERE category_id IS NOT NULL;

-- 2. ÍNDICES PARA TABELA ADVERTISERS

-- Índice para ordenação por suspicion score
CREATE INDEX IF NOT EXISTS idx_advertisers_suspicion 
ON public.advertisers(avg_suspicion_score DESC, tenant_id);

-- Índice para contagem de ads ativos
CREATE INDEX IF NOT EXISTS idx_advertisers_active_ads 
ON public.advertisers(active_ads DESC, tenant_id) 
WHERE active_ads > 0;

-- 3. ÍNDICES PARA TABELA DOMAINS

-- Índice para suspicion score de domínios
CREATE INDEX IF NOT EXISTS idx_domains_suspicion_tenant 
ON public.domains(suspicion_score DESC, tenant_id);

-- 4. ÍNDICES PARA TABELA ALERTS

-- Índice para alertas não lidos (muito consultado)
CREATE INDEX IF NOT EXISTS idx_alerts_unread 
ON public.alerts(tenant_id, created_at DESC) 
WHERE is_read = false;

-- 5. ÍNDICES PARA TABELA JOB_RUNS

-- Índice para jobs recentes por status
CREATE INDEX IF NOT EXISTS idx_job_runs_status_created 
ON public.job_runs(status, started_at DESC);

-- 6. ÍNDICES PARA LANDING PAGE SNAPSHOTS

-- Índice para snapshots por ad
CREATE INDEX IF NOT EXISTS idx_landing_snapshots_ad 
ON public.landing_page_snapshots(ad_id, captured_at DESC);

-- 7. MATERIALIZADA VIEW PARA DASHBOARD STATS
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_dashboard_stats AS
SELECT 
  tenant_id,
  COUNT(*) as total_ads,
  COUNT(*) FILTER (WHERE suspicion_score >= 61) as high_risk_ads,
  COUNT(*) FILTER (WHERE longevity_days >= 51) as champion_ads,
  COUNT(*) FILTER (WHERE longevity_days >= 42 AND longevity_days < 51) as strong_ads,
  COUNT(*) FILTER (WHERE longevity_days >= 30 AND longevity_days < 42) as promising_ads,
  COUNT(*) FILTER (WHERE longevity_days < 30 OR longevity_days IS NULL) as testing_ads,
  COALESCE(AVG(suspicion_score), 0)::integer as avg_suspicion_score,
  COALESCE(AVG(longevity_days), 0)::integer as avg_longevity_days,
  MAX(created_at) as last_ad_created
FROM public.ads
GROUP BY tenant_id;

-- Índice único para refresh concorrente
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_dashboard_stats_tenant 
ON public.mv_dashboard_stats(tenant_id);

-- 8. FUNÇÃO PARA REFRESH DA MATERIALIZED VIEW
CREATE OR REPLACE FUNCTION public.refresh_dashboard_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_dashboard_stats;
END;
$$;

-- 9. OTIMIZAÇÃO: Adicionar colunas computadas para evitar cálculos repetidos
ALTER TABLE public.ads 
ADD COLUMN IF NOT EXISTS winning_score integer 
GENERATED ALWAYS AS (
  COALESCE(longevity_days, 0) + COALESCE(engagement_score, 0)
) STORED;

-- Índice para winning score
CREATE INDEX IF NOT EXISTS idx_ads_winning_score 
ON public.ads(winning_score DESC);

-- 10. ESTATÍSTICAS ATUALIZADAS
ANALYZE public.ads;
ANALYZE public.advertisers;
ANALYZE public.domains;
ANALYZE public.alerts;
ANALYZE public.job_runs;