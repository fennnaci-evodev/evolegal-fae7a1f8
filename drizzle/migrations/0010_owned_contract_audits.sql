CREATE TABLE public.hugo_contract_audits (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 chat_id uuid NOT NULL REFERENCES public.hugo_chats(id) ON DELETE CASCADE,
 user_id uuid NOT NULL,
 message_id uuid REFERENCES public.hugo_messages(id) ON DELETE SET NULL,
 file_path text NOT NULL,
 file_name text NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','complete','error')),
 analysis jsonb,
 error_message text,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.hugo_contract_audits TO authenticated;
GRANT ALL ON public.hugo_contract_audits TO service_role;
ALTER TABLE public.hugo_contract_audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read audits" ON public.hugo_contract_audits FOR SELECT TO authenticated USING (user_id=auth.uid() AND EXISTS (SELECT 1 FROM public.hugo_chats c WHERE c.id=chat_id AND c.user_id=auth.uid()));
CREATE POLICY "Owners create pending audits" ON public.hugo_contract_audits FOR INSERT TO authenticated WITH CHECK (user_id=auth.uid() AND status='pending' AND analysis IS NULL AND error_message IS NULL AND file_path=auth.uid()::text||'/'||chat_id::text||'/'||id::text||'.txt' AND EXISTS (SELECT 1 FROM public.hugo_chats c WHERE c.id=chat_id AND c.user_id=auth.uid()) AND (message_id IS NULL OR EXISTS(SELECT 1 FROM public.hugo_messages m WHERE m.id=message_id AND m.chat_id=hugo_contract_audits.chat_id AND m.role='user')));
CREATE POLICY "Owners delete audits" ON public.hugo_contract_audits FOR DELETE TO authenticated USING (user_id=auth.uid() AND EXISTS (SELECT 1 FROM public.hugo_chats c WHERE c.id=chat_id AND c.user_id=auth.uid()));
CREATE POLICY "Owners upload contract text" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='contract-audits' AND (storage.foldername(name))[1]=auth.uid()::text AND EXISTS(SELECT 1 FROM public.hugo_chats c WHERE c.id::text=(storage.foldername(name))[2] AND c.user_id=auth.uid()));
CREATE POLICY "Owners read contract text" ON storage.objects FOR SELECT TO authenticated USING (bucket_id='contract-audits' AND (storage.foldername(name))[1]=auth.uid()::text AND EXISTS(SELECT 1 FROM public.hugo_chats c WHERE c.id::text=(storage.foldername(name))[2] AND c.user_id=auth.uid()));
CREATE POLICY "Owners remove contract text" ON storage.objects FOR DELETE TO authenticated USING (bucket_id='contract-audits' AND (storage.foldername(name))[1]=auth.uid()::text);