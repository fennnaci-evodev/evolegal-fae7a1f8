CREATE TABLE public.hugo_provider_state (provider text PRIMARY KEY, status integer NOT NULL, message text NOT NULL, blocked_at timestamptz NOT NULL DEFAULT now());
REVOKE ALL ON public.hugo_provider_state FROM anon, authenticated;
GRANT ALL ON public.hugo_provider_state TO service_role;
ALTER TABLE public.hugo_provider_state ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.hugo_request_windows (user_id uuid NOT NULL, bucket text NOT NULL, window_start timestamptz NOT NULL DEFAULT now(), attempts integer NOT NULL DEFAULT 0, PRIMARY KEY(user_id, bucket));
REVOKE ALL ON public.hugo_request_windows FROM anon, authenticated;
GRANT ALL ON public.hugo_request_windows TO service_role;
ALTER TABLE public.hugo_request_windows ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.consume_hugo_request(p_user uuid, p_bucket text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE used integer;
BEGIN
 INSERT INTO public.hugo_request_windows(user_id,bucket,attempts) VALUES(p_user,p_bucket,1)
 ON CONFLICT(user_id,bucket) DO UPDATE SET
 attempts = CASE WHEN hugo_request_windows.window_start < now() - interval '1 minute' THEN 1 ELSE hugo_request_windows.attempts + 1 END,
 window_start = CASE WHEN hugo_request_windows.window_start < now() - interval '1 minute' THEN now() ELSE hugo_request_windows.window_start END
 RETURNING attempts INTO used;
 RETURN used <= 15;
END; $$;
REVOKE ALL ON FUNCTION public.consume_hugo_request(uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_hugo_request(uuid,text) TO service_role;