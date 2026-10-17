CREATE OR REPLACE FUNCTION public.review_hugo_source(p_source_id uuid, p_expected_updated_at timestamp with time zone, p_expected_hash text, p_decision text, p_excerpt text, p_jurisdiction text, p_topic text, p_effective_from timestamp with time zone, p_effective_until timestamp with time zone, p_review_due_at timestamp with time zone, p_checks jsonb, p_notes text)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE s public.hugo_knowledge_sources; review_id uuid; actor uuid := auth.uid();
BEGIN
 IF actor IS NULL OR NOT public.has_role(actor, 'admin') THEN RAISE EXCEPTION 'Administrator access required'; END IF;
 SELECT * INTO s FROM public.hugo_knowledge_sources WHERE id=p_source_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Source not found'; END IF;
 IF s.updated_at IS DISTINCT FROM p_expected_updated_at OR s.content_hash IS DISTINCT FROM p_expected_hash THEN RAISE EXCEPTION 'Source changed. Reload before reviewing.'; END IF;
 IF p_decision NOT IN ('approved','rejected') OR p_decision IS NULL THEN RAISE EXCEPTION 'Invalid review decision'; END IF;
 IF length(trim(coalesce(p_notes,'')))=0 THEN RAISE EXCEPTION 'Review rationale required'; END IF;
 IF p_decision='approved' THEN
  IF s.content_hash IS NULL OR length(trim(coalesce(s.monitored_text,'')))=0 OR s.check_status NOT IN ('baseline','current','changed_needs_review') THEN RAISE EXCEPTION 'Fetch the official text before approval'; END IF;
  IF NOT (coalesce(p_checks->>'provenance','false')='true' AND coalesce(p_checks->>'scope','false')='true' AND coalesce(p_checks->>'commencement','false')='true' AND coalesce(p_checks->>'amendments','false')='true' AND coalesce(p_checks->>'impact','false')='true') THEN RAISE EXCEPTION 'Complete every legal verification check'; END IF;
  IF length(trim(coalesce(p_excerpt,'')))=0 OR p_excerpt ILIKE 'Pending reviewer%' OR length(trim(coalesce(p_jurisdiction,'')))=0 OR length(trim(coalesce(p_topic,'')))=0 THEN RAISE EXCEPTION 'Reviewed excerpt and exact scope required'; END IF;
  IF strpos(regexp_replace(s.monitored_text, '\s+', ' ', 'g'), trim(regexp_replace(p_excerpt, '\s+', ' ', 'g'))) = 0 THEN RAISE EXCEPTION 'Excerpt must be copied exactly from the official text'; END IF;
  IF p_effective_from IS NULL OR p_effective_from > now() OR (p_effective_until IS NOT NULL AND p_effective_until <= now()) OR p_review_due_at IS NULL OR p_review_due_at <= now() THEN RAISE EXCEPTION 'Current effective interval and future review date required'; END IF;
  UPDATE public.hugo_knowledge_sources SET status='approved', excerpt=trim(p_excerpt), jurisdiction=trim(p_jurisdiction), topic=trim(p_topic), effective_from=p_effective_from,effective_until=p_effective_until,review_due_at=p_review_due_at,reviewed_by=actor,reviewed_at=now() WHERE id=s.id RETURNING * INTO s;
 ELSE
  UPDATE public.hugo_knowledge_sources SET status='rejected' WHERE id=s.id RETURNING * INTO s;
 END IF;
 INSERT INTO public.hugo_source_reviews(source_id,reviewer_id,decision,checks,notes,source_snapshot) VALUES(s.id,actor,p_decision,coalesce(p_checks,'{}'),trim(p_notes),to_jsonb(s)) RETURNING id INTO review_id;
 UPDATE public.hugo_source_changes SET reviewed_by=actor,reviewed_at=now(),analysis_status=CASE WHEN p_decision='approved' THEN 'reviewed' ELSE 'rejected' END WHERE source_id=s.id AND reviewed_at IS NULL AND new_hash=s.content_hash;
 RETURN review_id;
END;
$function$;