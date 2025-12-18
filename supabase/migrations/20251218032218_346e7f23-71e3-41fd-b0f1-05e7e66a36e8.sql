-- Create storage bucket for logs
INSERT INTO storage.buckets (id, name, public)
VALUES ('logs', 'logs', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policy for logs bucket - users can only access their tenant's logs
CREATE POLICY "Users can upload logs for their tenant"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logs' AND
  (storage.foldername(name))[1] = (SELECT tenant_id::text FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can read their tenant's logs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'logs' AND
  (storage.foldername(name))[1] = (SELECT tenant_id::text FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can delete their tenant's logs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'logs' AND
  (storage.foldername(name))[1] = (SELECT tenant_id::text FROM public.profiles WHERE user_id = auth.uid())
);

-- Create table for tracking log exports
CREATE TABLE IF NOT EXISTS public.log_exports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  user_id UUID NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  log_count INTEGER,
  date_range_start TIMESTAMP WITH TIME ZONE,
  date_range_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.log_exports ENABLE ROW LEVEL SECURITY;

-- RLS policies for log_exports
CREATE POLICY "Users can view their tenant's log exports"
ON public.log_exports FOR SELECT
TO authenticated
USING (tenant_id = (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create log exports for their tenant"
ON public.log_exports FOR INSERT
TO authenticated
WITH CHECK (tenant_id = (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()));