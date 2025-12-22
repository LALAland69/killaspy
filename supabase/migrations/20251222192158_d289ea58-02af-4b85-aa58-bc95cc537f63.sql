-- Fix 1: Add explicit auth assertions to has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Explicit auth assertion
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Verify caller can only check their own roles
  IF _user_id IS NULL OR _user_id <> auth.uid() THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
END;
$$;

-- Fix 2: Add explicit auth assertions to get_user_tenant_id function
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Explicit auth assertion - must be authenticated
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Verify caller can only get their own tenant
  IF _user_id IS NULL OR _user_id <> auth.uid() THEN
    RETURN NULL;
  END IF;
  
  RETURN (
    SELECT tenant_id
    FROM public.profiles
    WHERE user_id = _user_id
    LIMIT 1
  );
END;
$$;

-- Fix 3: Add explicit auth assertions to log_security_event function
CREATE OR REPLACE FUNCTION public.log_security_event(
  _action text, 
  _resource_type text, 
  _resource_id text DEFAULT NULL::text, 
  _severity text DEFAULT 'info'::text, 
  _metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _log_id uuid;
  _tenant_id uuid;
  _current_user uuid;
BEGIN
  -- Explicit auth assertion
  _current_user := auth.uid();
  IF _current_user IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required for security logging';
  END IF;
  
  -- Get tenant_id using the current authenticated user
  _tenant_id := get_user_tenant_id(_current_user);
  
  IF _tenant_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: No tenant access for security logging';
  END IF;
  
  INSERT INTO public.security_audit_log (
    tenant_id,
    user_id,
    action,
    resource_type,
    resource_id,
    severity,
    metadata
  ) VALUES (
    _tenant_id,
    _current_user,
    _action,
    _resource_type,
    _resource_id,
    _severity,
    _metadata
  )
  RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;

-- Fix 4: Add authorization and rate limiting to refresh_dashboard_stats function
CREATE OR REPLACE FUNCTION public.refresh_dashboard_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_user uuid;
  _lock_acquired boolean;
BEGIN
  -- Explicit auth assertion - require admin role
  _current_user := auth.uid();
  
  IF _current_user IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required';
  END IF;
  
  -- Require admin role
  IF NOT has_role(_current_user, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: Admin privileges required';
  END IF;
  
  -- Use advisory lock to prevent concurrent refresh attempts (rate limiting)
  -- Lock ID 12345 is arbitrary but consistent for this function
  _lock_acquired := pg_try_advisory_lock(12345);
  
  IF NOT _lock_acquired THEN
    RAISE EXCEPTION 'Refresh already in progress, please wait';
  END IF;
  
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_dashboard_stats;
    
    -- Release the lock
    PERFORM pg_advisory_unlock(12345);
  EXCEPTION
    WHEN OTHERS THEN
      -- Ensure lock is released on error
      PERFORM pg_advisory_unlock(12345);
      RAISE;
  END;
END;
$$;