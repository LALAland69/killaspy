-- Create alerts table for competitor notifications
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  alert_type TEXT NOT NULL DEFAULT 'new_ad',
  title TEXT NOT NULL,
  message TEXT,
  severity TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_ad_id UUID REFERENCES public.ads(id),
  related_advertiser_id UUID REFERENCES public.advertisers(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view tenant alerts"
ON public.alerts
FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can update tenant alerts"
ON public.alerts
FOR UPDATE
USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can delete tenant alerts"
ON public.alerts
FOR DELETE
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Create index for faster queries
CREATE INDEX idx_alerts_tenant_id ON public.alerts(tenant_id);
CREATE INDEX idx_alerts_created_at ON public.alerts(created_at DESC);
CREATE INDEX idx_alerts_is_read ON public.alerts(is_read);

-- Create trend_validations table for Google Trends data
CREATE TABLE public.trend_validations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  keyword TEXT NOT NULL,
  region TEXT DEFAULT 'BR',
  trend_score INTEGER,
  trend_direction TEXT,
  related_queries JSONB DEFAULT '[]',
  interest_over_time JSONB DEFAULT '[]',
  validated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trend_validations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view tenant trend validations"
ON public.trend_validations
FOR SELECT
USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can insert tenant trend validations"
ON public.trend_validations
FOR INSERT
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- Create index
CREATE INDEX idx_trend_validations_tenant_id ON public.trend_validations(tenant_id);
CREATE INDEX idx_trend_validations_keyword ON public.trend_validations(keyword);