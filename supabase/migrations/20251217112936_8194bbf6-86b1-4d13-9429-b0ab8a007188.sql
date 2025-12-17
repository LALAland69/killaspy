-- Add scheduling columns to security_audits table
ALTER TABLE public.security_audits
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recurrence_schedule TEXT, -- 'daily', 'weekly', 'monthly'
ADD COLUMN IF NOT EXISTS next_run_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_run_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cron_job_name TEXT;

-- Create index for scheduled audits
CREATE INDEX IF NOT EXISTS idx_security_audits_next_run 
ON public.security_audits(next_run_at) 
WHERE is_recurring = true AND next_run_at IS NOT NULL;