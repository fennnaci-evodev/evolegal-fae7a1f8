ALTER TABLE public.hugo_contract_audits ADD COLUMN IF NOT EXISTS essence jsonb;

CREATE TABLE public.hugo_audit_usage (
  audit_id uuid PRIMARY KEY REFERENCES public.hugo_contract_audits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX hugo_audit_usage_user_month ON public.hugo_audit_usage(user_id, created_at);
GRANT ALL ON public.hugo_audit_usage TO service_role;
ALTER TABLE public.hugo_audit_usage ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.consume_audit_credit(p_user uuid, p_audit uuid, p_limit integer DEFAULT 3)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE used integer;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('audit_quota:' || p_user::text));
  IF EXISTS (SELECT 1 FROM public.hugo_audit_usage WHERE audit_id = p_audit) THEN RETURN true; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_user AND role = 'admin') THEN
    INSERT INTO public.hugo_audit_usage(audit_id, user_id) VALUES (p_audit, p_user); RETURN true;
  END IF;
  SELECT count(*) INTO used FROM public.hugo_audit_usage
    WHERE user_id = p_user AND created_at >= date_trunc('month', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
  IF used >= p_limit THEN RETURN false; END IF;
  INSERT INTO public.hugo_audit_usage(audit_id, user_id) VALUES (p_audit, p_user);
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.consume_audit_credit(uuid, uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_audit_credit(uuid, uuid, integer) TO service_role;

CREATE OR REPLACE FUNCTION public.audit_quota_status()
RETURNS TABLE(used integer, monthly_limit integer, unlimited boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT (SELECT count(*)::int FROM public.hugo_audit_usage u WHERE u.user_id = auth.uid()
            AND u.created_at >= date_trunc('month', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'),
         3,
         EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.role = 'admin')
  WHERE auth.uid() IS NOT NULL
$$;
REVOKE ALL ON FUNCTION public.audit_quota_status() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.audit_quota_status() TO authenticated;