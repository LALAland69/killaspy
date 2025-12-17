-- Fix migration quoting issue and apply hardened SECURITY DEFINER helper functions

CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN NULL
    WHEN _user_id IS NULL THEN NULL
    WHEN _user_id <> auth.uid() THEN NULL
    ELSE (
      SELECT tenant_id
      FROM public.profiles
      WHERE user_id = _user_id
      LIMIT 1
    )
  END
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT CASE
    WHEN auth.uid() IS NULL THEN FALSE
    WHEN _user_id IS NULL THEN FALSE
    WHEN _user_id <> auth.uid() THEN FALSE
    ELSE EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = _user_id
        AND role = _role
    )
  END
$function$;

COMMENT ON FUNCTION public.get_user_tenant_id(uuid) IS
  'SECURITY DEFINER. Used by RLS to resolve the current user''s tenant. Guarded to only return a value when _user_id = auth.uid(). Do not modify without security review.';

COMMENT ON FUNCTION public.has_role(uuid, app_role) IS
  'SECURITY DEFINER. Used by RLS/policies to check the current user''s roles. Guarded to only evaluate when _user_id = auth.uid(). Do not modify without security review.';

COMMENT ON FUNCTION public.handle_new_user() IS
  'SECURITY DEFINER trigger helper. Creates tenant/profile/role rows on signup. Do not add dynamic SQL or broaden writes without security review.';
