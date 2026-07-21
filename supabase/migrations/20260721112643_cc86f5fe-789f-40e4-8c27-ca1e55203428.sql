
-- Drop old storage policies
DROP POLICY IF EXISTS "Anyone can view generated documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;

-- Ownership-based storage policies (path prefix = user id)
CREATE POLICY "Users read own generated documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'generated-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users upload own generated documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'generated-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users update own generated documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'generated-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'generated-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users delete own generated documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'generated-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Revoke direct EXECUTE on SECURITY DEFINER helpers from client roles.
-- They still work inside RLS/triggers because they execute as the function owner.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_ticket_number() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_hugo_chat_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.assign_expert_proportional() FROM PUBLIC, anon, authenticated;
