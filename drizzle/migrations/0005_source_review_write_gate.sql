REVOKE INSERT, UPDATE, DELETE ON public.hugo_knowledge_sources FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.hugo_source_changes FROM authenticated;
GRANT SELECT ON public.hugo_knowledge_sources, public.hugo_source_changes TO authenticated;
COMMENT ON FUNCTION public.review_hugo_source(uuid,timestamptz,text,text,text,text,text,timestamptz,timestamptz,timestamptz,jsonb,text) IS 'Only authenticated admin write path: verifies all legal checks, binds actor from auth.uid and persists immutable approval history.';