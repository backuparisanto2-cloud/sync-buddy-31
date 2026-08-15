CREATE POLICY "authenticated read attachments bucket" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'attachments');
CREATE POLICY "authenticated upload attachments bucket" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'attachments');
CREATE POLICY "authenticated update attachments bucket" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'attachments') WITH CHECK (bucket_id = 'attachments');
CREATE POLICY "authenticated delete attachments bucket" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'attachments');