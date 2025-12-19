-- Fix job_runs public exposure by removing the policy that allows NULL tenant_id access
-- Drop the problematic policy that exposes job runs publicly
DROP POLICY IF EXISTS "Users can view job runs" ON public.job_runs;

-- The existing policies already require authentication:
-- - "Authenticated users can view their tenant job runs" 
-- - "Service role can manage all job runs"
-- These are sufficient and secure

-- Fix profiles INSERT policy to include tenant validation
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can insert own profile with tenant check" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND (
    tenant_id IS NULL 
    OR tenant_id = public.get_user_tenant_id(auth.uid())
  )
);