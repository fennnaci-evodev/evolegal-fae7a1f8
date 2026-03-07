
CREATE TYPE public.request_status AS ENUM ('pending', 'reviewing', 'completed', 'archived');

CREATE TABLE public.legal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  status request_status NOT NULL DEFAULT 'pending',
  topic text NOT NULL,
  title text DEFAULT '',
  description text NOT NULL,
  facts jsonb DEFAULT '{}',
  state text DEFAULT '',
  file_urls text[] DEFAULT '{}',
  audit_log jsonb DEFAULT '[]'
);

ALTER TABLE public.legal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own requests"
  ON public.legal_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own requests"
  ON public.legal_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own requests"
  ON public.legal_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
