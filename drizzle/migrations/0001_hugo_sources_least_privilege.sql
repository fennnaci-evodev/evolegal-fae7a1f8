-- Reviewed materials are administrator-only; remove inherited anonymous privileges.
REVOKE ALL ON TABLE public.hugo_knowledge_sources FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.hugo_knowledge_sources TO authenticated;
GRANT ALL ON TABLE public.hugo_knowledge_sources TO service_role;