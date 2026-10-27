ALTER TABLE public.hugo_feedback ADD COLUMN IF NOT EXISTS reasons text[] NOT NULL DEFAULT '{}';

CREATE TABLE public.hugo_audit_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id uuid NOT NULL REFERENCES public.hugo_contract_audits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating text NOT NULL CHECK (rating IN ('positive','negative')),
  reasons text[] NOT NULL DEFAULT '{}',
  comment text CHECK (comment IS NULL OR length(comment) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (audit_id, user_id)
);
GRANT SELECT, INSERT, UPDATE ON public.hugo_audit_feedback TO authenticated;
GRANT ALL ON public.hugo_audit_feedback TO service_role;
ALTER TABLE public.hugo_audit_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read audit feedback" ON public.hugo_audit_feedback FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Owners add audit feedback" ON public.hugo_audit_feedback FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.hugo_contract_audits a WHERE a.id = audit_id AND a.user_id = auth.uid()));
CREATE POLICY "Owners update audit feedback" ON public.hugo_audit_feedback FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.hugo_training_consent (
  user_id uuid PRIMARY KEY,
  allow_training_curation boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.hugo_training_consent TO authenticated;
GRANT ALL ON public.hugo_training_consent TO service_role;
ALTER TABLE public.hugo_training_consent ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own consent read" ON public.hugo_training_consent FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Own consent insert" ON public.hugo_training_consent FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own consent update" ON public.hugo_training_consent FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.hugo_curation_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_user_id uuid NOT NULL,
  source_kind text NOT NULL CHECK (source_kind IN ('message','audit')),
  source_id uuid NOT NULL,
  track text NOT NULL CHECK (track IN ('sft','dpo')),
  status text NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review','approved','rejected')),
  prompt text NOT NULL,
  chosen text,
  rejected text,
  reasons text[] NOT NULL DEFAULT '{}',
  redactions integer NOT NULL DEFAULT 0,
  reviewer_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_kind, source_id)
);
GRANT SELECT, UPDATE ON public.hugo_curation_staging TO authenticated;
GRANT ALL ON public.hugo_curation_staging TO service_role;
ALTER TABLE public.hugo_curation_staging ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read staging" ON public.hugo_curation_staging FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins review staging" ON public.hugo_curation_staging FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.validate_curation_review()
RETURNS trigger LANGUAGE plpgsql SET search_path TO '' AS $$
BEGIN
  IF (NEW.source_user_id, NEW.source_kind, NEW.source_id, NEW.track, NEW.prompt, NEW.created_at) IS DISTINCT FROM (OLD.source_user_id, OLD.source_kind, OLD.source_id, OLD.track, OLD.prompt, OLD.created_at) THEN
    RAISE EXCEPTION 'Source fields are immutable';
  END IF;
  IF NEW.status = 'approved' THEN
    IF length(trim(coalesce(NEW.chosen,''))) = 0 THEN RAISE EXCEPTION 'An approved pair requires a chosen response'; END IF;
    IF NEW.track = 'dpo' AND length(trim(coalesce(NEW.rejected,''))) = 0 THEN RAISE EXCEPTION 'A DPO pair requires a rejected response'; END IF;
  END IF;
  IF NEW.status <> OLD.status THEN NEW.reviewed_by := auth.uid(); NEW.reviewed_at := now(); END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER validate_curation_review BEFORE UPDATE ON public.hugo_curation_staging FOR EACH ROW EXECUTE FUNCTION public.validate_curation_review();

CREATE OR REPLACE FUNCTION public.withdraw_training_consent()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
BEGIN
  IF NOT NEW.allow_training_curation THEN
    DELETE FROM public.hugo_curation_staging WHERE source_user_id = NEW.user_id;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.withdraw_training_consent() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER withdraw_training_consent BEFORE UPDATE ON public.hugo_training_consent FOR EACH ROW EXECUTE FUNCTION public.withdraw_training_consent();