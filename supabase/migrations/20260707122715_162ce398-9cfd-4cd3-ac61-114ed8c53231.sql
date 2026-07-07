
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

CREATE POLICY "Users upload own files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'investigation-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users read own files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'investigation-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
