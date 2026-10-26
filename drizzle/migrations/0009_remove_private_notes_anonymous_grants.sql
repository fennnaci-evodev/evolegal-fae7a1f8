REVOKE ALL ON public.legal_request_admin_notes FROM PUBLIC, anon;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.legal_request_admin_notes FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.legal_request_admin_notes TO authenticated;
GRANT ALL ON public.legal_request_admin_notes TO service_role;