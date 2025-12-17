-- Create ad_categories table for harvest configuration
CREATE TABLE public.ad_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  countries TEXT[] NOT NULL DEFAULT '{US,BR}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_harvest_at TIMESTAMP WITH TIME ZONE,
  ads_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, slug)
);

-- Enable RLS
ALTER TABLE public.ad_categories ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view tenant categories"
  ON public.ad_categories FOR SELECT
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can insert tenant categories"
  ON public.ad_categories FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can update tenant categories"
  ON public.ad_categories FOR UPDATE
  USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can delete tenant categories"
  ON public.ad_categories FOR DELETE
  USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Add category_id to ads table
ALTER TABLE public.ads ADD COLUMN category_id UUID REFERENCES public.ad_categories(id) ON DELETE SET NULL;

-- Create index for faster category lookups
CREATE INDEX idx_ads_category_id ON public.ads(category_id);
CREATE INDEX idx_ads_headline_text ON public.ads USING gin(to_tsvector('english', COALESCE(headline, '') || ' ' || COALESCE(primary_text, '')));

-- Update trigger
CREATE TRIGGER update_ad_categories_updated_at
  BEFORE UPDATE ON public.ad_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default categories (will be populated per tenant via edge function)
COMMENT ON TABLE public.ad_categories IS 'Ad categories for automated harvesting with configurable keywords';