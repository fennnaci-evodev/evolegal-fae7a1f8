-- PREPARED ONLY: apply via Lovable Cloud migration tool after Cloud is resumed.
-- No materials are seeded or approved; reviewers must verify provenance and scope.
CREATE TABLE public.hugo_knowledge_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  source_url text NOT NULL CHECK (source_url LIKE 'https://%'),
  jurisdiction text NOT NULL,
  topic text NOT NULL,
  excerpt text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'rejected', 'retired')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_due_at timestamptz,
  effective_from timestamptz NOT NULL,
  effective_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hugo_knowledge_sources TO authenticated;
GRANT ALL ON public.hugo_knowledge_sources TO service_role;
ALTER TABLE public.hugo_knowledge_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Administrators manage reviewed Hugo sources"
  ON public.hugo_knowledge_sources FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX hugo_knowledge_scope ON public.hugo_knowledge_sources (jurisdiction, topic, status);

CREATE FUNCTION public.validate_hugo_source_review() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status = 'approved' THEN
    IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.reviewed_by AND role = 'admin') THEN
      RAISE EXCEPTION 'An approved source requires an authorized reviewer';
    END IF;
    IF auth.uid() IS NOT NULL AND NEW.reviewed_by <> auth.uid() THEN
      RAISE EXCEPTION 'The reviewer must be the authenticated administrator';
    END IF;
    IF NEW.reviewed_at IS NULL OR NEW.reviewed_at > now()
       OR NEW.review_due_at IS NULL OR NEW.review_due_at <= now()
       OR NEW.review_due_at <= NEW.reviewed_at THEN
      RAISE EXCEPTION 'An approved source requires a current review and future review due date';
    END IF;
    IF TG_OP = 'UPDATE' THEN
      IF (NEW.title, NEW.source_url, NEW.jurisdiction, NEW.topic, NEW.excerpt, NEW.effective_from, NEW.effective_until)
         IS DISTINCT FROM (OLD.title, OLD.source_url, OLD.jurisdiction, OLD.topic, OLD.excerpt, OLD.effective_from, OLD.effective_until)
         AND NEW.reviewed_at IS NOT DISTINCT FROM OLD.reviewed_at THEN
        RAISE EXCEPTION 'Changed legal content requires a new review';
      END IF;
    END IF;
  END IF;
  IF length(trim(NEW.excerpt)) = 0 THEN RAISE EXCEPTION 'A legal excerpt is required'; END IF;
  IF NEW.effective_until IS NOT NULL AND NEW.effective_until <= NEW.effective_from THEN
    RAISE EXCEPTION 'Invalid legal source effective interval';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.validate_hugo_source_review() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER validate_hugo_source_review
BEFORE INSERT OR UPDATE ON public.hugo_knowledge_sources
FOR EACH ROW EXECUTE FUNCTION public.validate_hugo_source_review();