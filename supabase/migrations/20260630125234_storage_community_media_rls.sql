-- Allow authenticated users to upload to their own folder
CREATE POLICY "auth_users_upload_own_folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'community-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update/delete their own files
CREATE POLICY "auth_users_manage_own_files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'community-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access (bucket is public)
CREATE POLICY "public_read_community_media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'community-media');
