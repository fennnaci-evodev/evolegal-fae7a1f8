-- RLS predicates need execution by signed-in users; has_role is read-only
-- and returns only a stored-role membership boolean, not privileged data.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;