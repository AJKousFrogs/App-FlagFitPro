-- TIER 1: private storage bucket for self-reported credential documents
-- (license/certification files uploaded during staff onboarding, reviewed
-- by an admin before credentials_verified flips to true).

BEGIN;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'credential-documents',
  'credential-documents',
  false,
  10485760, -- 10MB, matches the onboarding form's stated limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- Users may upload/manage files only under their own userId-prefixed folder
-- (same ownership convention as the existing community-media bucket).
CREATE POLICY "credential_docs_users_upload_own_folder"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'credential-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "credential_docs_users_manage_own_folder"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'credential-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- A user can read their own uploaded document; admins/owners can read any
-- document in this bucket (needed for credential review).
CREATE POLICY "credential_docs_read_own_or_admin"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'credential-documents'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM public.team_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
      )
    )
  );

COMMIT;
