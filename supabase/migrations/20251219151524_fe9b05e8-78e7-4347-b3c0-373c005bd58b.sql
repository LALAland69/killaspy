-- Create indexes for frequently queried columns to improve performance
-- INDEX: ads.suspicion_score - Used for filtering and sorting by risk level
CREATE INDEX IF NOT EXISTS idx_ads_suspicion_score ON public.ads (suspicion_score);

-- INDEX: ads.longevity_days - Used for sorting by longevity and winning score calculations
CREATE INDEX IF NOT EXISTS idx_ads_longevity_days ON public.ads (longevity_days);

-- INDEX: ads.created_at - Used for date range filtering and recent ads sorting
CREATE INDEX IF NOT EXISTS idx_ads_created_at ON public.ads (created_at DESC);

-- INDEX: ads.tenant_id + created_at - Composite index for tenant-specific queries with date filtering
CREATE INDEX IF NOT EXISTS idx_ads_tenant_created ON public.ads (tenant_id, created_at DESC);

-- INDEX: ads.tenant_id + suspicion_score - Composite index for tenant-specific risk analysis
CREATE INDEX IF NOT EXISTS idx_ads_tenant_suspicion ON public.ads (tenant_id, suspicion_score DESC);

-- INDEX: ads.status - Used for active/inactive filtering
CREATE INDEX IF NOT EXISTS idx_ads_status ON public.ads (status);

-- INDEX: advertisers.avg_suspicion_score - Used for advertiser risk sorting
CREATE INDEX IF NOT EXISTS idx_advertisers_suspicion ON public.advertisers (avg_suspicion_score DESC);

-- INDEX: job_runs.created_at - Used for job history queries
CREATE INDEX IF NOT EXISTS idx_job_runs_created_at ON public.job_runs (created_at DESC);