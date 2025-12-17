-- Create table to store scheduled import configurations
CREATE TABLE public.import_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  search_terms TEXT,
  search_page_ids TEXT[] DEFAULT '{}',
  ad_reached_countries TEXT[] DEFAULT '{US}',
  ad_active_status TEXT DEFAULT 'ACTIVE',
  import_limit INTEGER DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.import_schedules ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view tenant import schedules" 
ON public.import_schedules 
FOR SELECT 
USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can insert tenant import schedules" 
ON public.import_schedules 
FOR INSERT 
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can update tenant import schedules" 
ON public.import_schedules 
FOR UPDATE 
USING (tenant_id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can delete tenant import schedules" 
ON public.import_schedules 
FOR DELETE 
USING (tenant_id = get_user_tenant_id(auth.uid()));

-- Update trigger
CREATE TRIGGER update_import_schedules_updated_at
BEFORE UPDATE ON public.import_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();