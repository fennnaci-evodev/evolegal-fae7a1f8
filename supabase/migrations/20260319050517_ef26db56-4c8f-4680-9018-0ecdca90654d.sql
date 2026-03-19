
-- Messages table for admin-user chat within requests
CREATE TABLE public.request_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.legal_requests(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_role text NOT NULL DEFAULT 'user',
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.request_messages ENABLE ROW LEVEL SECURITY;

-- Users can see messages on their own requests
CREATE POLICY "Users can view own request messages"
ON public.request_messages FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.legal_requests lr
    WHERE lr.id = request_messages.request_id AND lr.user_id = auth.uid()
  )
);

-- Admins can view all messages
CREATE POLICY "Admins can view all messages"
ON public.request_messages FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Users can insert messages on their own requests
CREATE POLICY "Users can insert own request messages"
ON public.request_messages FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.legal_requests lr
    WHERE lr.id = request_messages.request_id AND lr.user_id = auth.uid()
  )
);

-- Admins can insert messages on any request
CREATE POLICY "Admins can insert all messages"
ON public.request_messages FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin notes on requests
ALTER TABLE public.legal_requests ADD COLUMN IF NOT EXISTS admin_notes text DEFAULT '';
ALTER TABLE public.legal_requests ADD COLUMN IF NOT EXISTS assigned_to_name text DEFAULT '';

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.request_messages;
