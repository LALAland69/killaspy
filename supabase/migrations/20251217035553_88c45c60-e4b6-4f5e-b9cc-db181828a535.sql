-- Create job_runs table to track scheduled worker executions
CREATE TABLE public.job_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id),
  job_name TEXT NOT NULL,
  task_type TEXT NOT NULL,
  schedule_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  ads_processed INTEGER DEFAULT 0,
  divergences_found INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_runs ENABLE ROW LEVEL SECURITY;

-- Policy for viewing job runs (admins and users can see their tenant's runs)
CREATE POLICY "Users can view job runs"
  ON public.job_runs
  FOR SELECT
  USING (tenant_id IS NULL OR tenant_id = get_user_tenant_id(auth.uid()));

-- Index for faster queries
CREATE INDEX idx_job_runs_started_at ON public.job_runs(started_at DESC);
CREATE INDEX idx_job_runs_job_name ON public.job_runs(job_name);
CREATE INDEX idx_job_runs_status ON public.job_runs(status);