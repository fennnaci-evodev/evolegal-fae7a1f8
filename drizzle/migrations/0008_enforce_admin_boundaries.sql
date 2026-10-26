CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::public.app_role) $$;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

CREATE TABLE public.legal_request_admin_notes (
 request_id uuid PRIMARY KEY REFERENCES public.legal_requests(id) ON DELETE CASCADE,
 notes text NOT NULL DEFAULT '', updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.legal_request_admin_notes TO authenticated;
GRANT ALL ON public.legal_request_admin_notes TO service_role;
ALTER TABLE public.legal_request_admin_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Stored administrators manage private request notes" ON public.legal_request_admin_notes FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
INSERT INTO public.legal_request_admin_notes(request_id,notes) SELECT id,admin_notes FROM public.legal_requests WHERE coalesce(admin_notes,'') <> '';
UPDATE public.legal_requests SET admin_notes = '' WHERE coalesce(admin_notes,'') <> '';
COMMENT ON COLUMN public.legal_requests.admin_notes IS 'DEPRECATED: private notes moved to legal_request_admin_notes; must remain empty';

CREATE OR REPLACE FUNCTION public.guard_request_admin_fields()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
 IF coalesce(NEW.admin_notes,'') <> '' THEN RAISE EXCEPTION 'Private notes must use the administrator notes store' USING ERRCODE='42501'; END IF;
 IF current_user IN ('anon','authenticated') AND NOT public.is_admin() THEN
  IF TG_OP = 'INSERT' THEN
   IF NEW.user_id IS DISTINCT FROM auth.uid() OR NEW.status <> 'pending'::public.request_status OR coalesce(NEW.admin_response,'') <> '' OR NEW.responded_at IS NOT NULL OR NEW.assigned_to IS NOT NULL OR coalesce(NEW.assigned_to_name,'') <> '' OR NEW.assigned_at IS NOT NULL OR NEW.ticket_number IS NOT NULL OR NEW.audit_log IS DISTINCT FROM '[]'::jsonb THEN
    RAISE EXCEPTION 'Forbidden: administrative request fields' USING ERRCODE='42501';
   END IF;
   NEW.audit_log := jsonb_build_array(jsonb_build_object('timestamp',now(),'action','created','actor','user','note','Request submitted'));
  ELSE
   IF (NEW.user_id,NEW.status,NEW.admin_response,NEW.responded_at,NEW.assigned_to,NEW.assigned_to_name,NEW.assigned_at,NEW.ticket_number,NEW.audit_log,NEW.created_at) IS DISTINCT FROM (OLD.user_id,OLD.status,OLD.admin_response,OLD.responded_at,OLD.assigned_to,OLD.assigned_to_name,OLD.assigned_at,OLD.ticket_number,OLD.audit_log,OLD.created_at) THEN
    RAISE EXCEPTION 'Forbidden: administrative request fields' USING ERRCODE='42501';
   END IF;
  END IF;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.guard_request_admin_fields() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER guard_admin_request_fields BEFORE INSERT OR UPDATE ON public.legal_requests FOR EACH ROW EXECUTE FUNCTION public.guard_request_admin_fields();

ALTER POLICY "Users can insert own request messages" ON public.request_messages WITH CHECK (auth.uid() = sender_id AND sender_role = 'user' AND EXISTS (SELECT 1 FROM public.legal_requests lr WHERE lr.id = request_id AND lr.user_id = auth.uid()));
ALTER POLICY "Users can update own requests" ON public.legal_requests USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
ALTER POLICY "Users can update own chats" ON public.hugo_chats USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
ALTER POLICY "Users can update own profile" ON public.profiles USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
ALTER POLICY "Users can update own feedback" ON public.hugo_feedback USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.hugo_chats c WHERE c.id = chat_id AND c.user_id = auth.uid()));
ALTER POLICY "Administrators manage reviewed Hugo sources" ON public.hugo_knowledge_sources USING (public.is_admin()) WITH CHECK (public.is_admin());
ALTER POLICY "Administrators review source changes" ON public.hugo_source_changes USING (public.is_admin()) WITH CHECK (public.is_admin());
ALTER POLICY "Administrators read source review history" ON public.hugo_source_reviews USING (public.is_admin());
ALTER POLICY "Admins can view all metrics" ON public.hugo_metrics USING (public.is_admin());
DROP POLICY "Users can insert own metrics" ON public.hugo_metrics;

REVOKE ALL ON public.user_roles, public.hugo_source_reviews, public.hugo_metrics FROM authenticated;
GRANT SELECT ON public.user_roles, public.hugo_source_reviews, public.hugo_metrics TO authenticated;
REVOKE ALL ON public.hugo_provider_state, public.hugo_request_windows FROM anon, authenticated;
REVOKE ALL ON public.hugo_knowledge_sources, public.hugo_source_changes FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hugo_knowledge_sources, public.hugo_source_changes TO authenticated;
REVOKE ALL ON public.profiles,public.user_roles,public.legal_requests,public.request_messages,public.hugo_chats,public.hugo_messages,public.generated_documents,public.hugo_feedback,public.hugo_metrics,public.hugo_knowledge_sources,public.hugo_source_changes,public.hugo_source_reviews FROM anon;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.profiles,public.legal_requests,public.request_messages,public.hugo_chats,public.hugo_messages,public.generated_documents,public.hugo_feedback FROM authenticated;
ALTER TABLE public.hugo_knowledge_sources FORCE ROW LEVEL SECURITY;
ALTER TABLE public.hugo_source_changes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.hugo_source_reviews FORCE ROW LEVEL SECURITY;
ALTER TABLE public.hugo_metrics FORCE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles FORCE ROW LEVEL SECURITY;
ALTER TABLE public.hugo_provider_state FORCE ROW LEVEL SECURITY;
ALTER TABLE public.hugo_request_windows FORCE ROW LEVEL SECURITY;
ALTER TABLE public.legal_request_admin_notes FORCE ROW LEVEL SECURITY;