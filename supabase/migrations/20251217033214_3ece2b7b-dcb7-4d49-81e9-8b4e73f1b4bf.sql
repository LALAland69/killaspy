-- Add ranking and cloaker analysis fields to ads table
ALTER TABLE public.ads 
ADD COLUMN IF NOT EXISTS engagement_score integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS longevity_days integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS region text,
ADD COLUMN IF NOT EXISTS detected_black_url text,
ADD COLUMN IF NOT EXISTS white_url text,
ADD COLUMN IF NOT EXISTS cloaker_token text,
ADD COLUMN IF NOT EXISTS last_snapshot_at timestamp with time zone;

-- Add fields to landing_page_snapshots for cloaker analysis
ALTER TABLE public.landing_page_snapshots
ADD COLUMN IF NOT EXISTS is_black_page boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS detected_token text,
ADD COLUMN IF NOT EXISTS final_redirect_url text;

-- Create ad_history table for historical tracking
CREATE TABLE IF NOT EXISTS public.ad_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  ad_id uuid NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
  status text,
  suspicion_score integer,
  engagement_score integer,
  creative_hash text,
  landing_page_hash text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(ad_id, snapshot_date)
);

-- Enable RLS on ad_history
ALTER TABLE public.ad_history ENABLE ROW LEVEL SECURITY;

-- RLS policy for ad_history
CREATE POLICY "Users can view tenant ad history"
ON public.ad_history
FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Create daily_reports table for automated reports
CREATE TABLE IF NOT EXISTS public.daily_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  report_date date NOT NULL DEFAULT CURRENT_DATE,
  top_aggressive_ads jsonb,
  top_longevity_ads jsonb,
  new_cloakers_detected integer DEFAULT 0,
  total_ads_analyzed integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, report_date)
);

-- Enable RLS on daily_reports
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;

-- RLS policy for daily_reports
CREATE POLICY "Users can view tenant reports"
ON public.daily_reports
FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Add index for ranking queries
CREATE INDEX IF NOT EXISTS idx_ads_suspicion_score ON public.ads(suspicion_score DESC);
CREATE INDEX IF NOT EXISTS idx_ads_engagement_score ON public.ads(engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_ads_longevity ON public.ads(longevity_days DESC);
CREATE INDEX IF NOT EXISTS idx_ads_region ON public.ads(region);