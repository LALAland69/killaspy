-- Fix job_runs RLS policy to prevent public access
-- Remove the policy that allows access when tenant_id IS NULL

-- First, drop the existing permissive policies on job_runs
DROP POLICY IF EXISTS "Users can view job runs for their tenant" ON public.job_runs;
DROP POLICY IF EXISTS "Users can insert job runs for their tenant" ON public.job_runs;
DROP POLICY IF EXISTS "Users can update job runs for their tenant" ON public.job_runs;
DROP POLICY IF EXISTS "Users can delete job runs for their tenant" ON public.job_runs;

-- Create new secure policies that require authentication and tenant membership
CREATE POLICY "Authenticated users can view their tenant job runs" 
ON public.job_runs 
FOR SELECT 
TO authenticated
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Authenticated users can insert their tenant job runs" 
ON public.job_runs 
FOR INSERT 
TO authenticated
WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Authenticated users can update their tenant job runs" 
ON public.job_runs 
FOR UPDATE 
TO authenticated
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Authenticated users can delete their tenant job runs" 
ON public.job_runs 
FOR DELETE 
TO authenticated
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

-- Also create a service role policy for edge functions to manage system jobs
CREATE POLICY "Service role can manage all job runs" 
ON public.job_runs 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);