-- Create saved_ads (favorites) table
CREATE TABLE public.saved_ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, ad_id, user_id)
);

-- Enable RLS
ALTER TABLE public.saved_ads ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own saved ads"
  ON public.saved_ads FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND user_id = auth.uid());

CREATE POLICY "Users can save ads"
  ON public.saved_ads FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND user_id = auth.uid());

CREATE POLICY "Users can delete saved ads"
  ON public.saved_ads FOR DELETE
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND user_id = auth.uid());

-- Index for faster lookups
CREATE INDEX idx_saved_ads_user_ad ON public.saved_ads(user_id, ad_id);
CREATE INDEX idx_saved_ads_tenant ON public.saved_ads(tenant_id);