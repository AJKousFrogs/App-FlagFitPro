-- Enable RLS on flagged public tables
ALTER TABLE public.parental_consent ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_sharing_settings ENABLE ROW LEVEL SECURITY;

-- parental_consent
DROP POLICY IF EXISTS parental_consent_select_scoped ON public.parental_consent;
DROP POLICY IF EXISTS parental_consent_insert_owner ON public.parental_consent;
DROP POLICY IF EXISTS parental_consent_update_owner ON public.parental_consent;
DROP POLICY IF EXISTS parental_consent_delete_owner ON public.parental_consent;

CREATE POLICY parental_consent_select_scoped
ON public.parental_consent
FOR SELECT
TO authenticated
USING (
  minor_user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.parent_guardian_links pgl
    WHERE pgl.athlete_id = parental_consent.minor_user_id
      AND pgl.parent_id = auth.uid()
  )
);

CREATE POLICY parental_consent_insert_owner
ON public.parental_consent
FOR INSERT
TO authenticated
WITH CHECK (minor_user_id = auth.uid());

CREATE POLICY parental_consent_update_owner
ON public.parental_consent
FOR UPDATE
TO authenticated
USING (minor_user_id = auth.uid())
WITH CHECK (minor_user_id = auth.uid());

CREATE POLICY parental_consent_delete_owner
ON public.parental_consent
FOR DELETE
TO authenticated
USING (minor_user_id = auth.uid());

-- account_deletion_requests
DROP POLICY IF EXISTS account_deletion_requests_owner_select ON public.account_deletion_requests;
DROP POLICY IF EXISTS account_deletion_requests_owner_insert ON public.account_deletion_requests;
DROP POLICY IF EXISTS account_deletion_requests_owner_update ON public.account_deletion_requests;
DROP POLICY IF EXISTS account_deletion_requests_owner_delete ON public.account_deletion_requests;

CREATE POLICY account_deletion_requests_owner_select
ON public.account_deletion_requests
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY account_deletion_requests_owner_insert
ON public.account_deletion_requests
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY account_deletion_requests_owner_update
ON public.account_deletion_requests
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY account_deletion_requests_owner_delete
ON public.account_deletion_requests
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- emergency_medical_records
DROP POLICY IF EXISTS emergency_medical_records_owner_select ON public.emergency_medical_records;
DROP POLICY IF EXISTS emergency_medical_records_owner_insert ON public.emergency_medical_records;
DROP POLICY IF EXISTS emergency_medical_records_owner_update ON public.emergency_medical_records;
DROP POLICY IF EXISTS emergency_medical_records_owner_delete ON public.emergency_medical_records;

CREATE POLICY emergency_medical_records_owner_select
ON public.emergency_medical_records
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY emergency_medical_records_owner_insert
ON public.emergency_medical_records
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY emergency_medical_records_owner_update
ON public.emergency_medical_records
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY emergency_medical_records_owner_delete
ON public.emergency_medical_records
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- privacy_audit_log
DROP POLICY IF EXISTS privacy_audit_log_scoped_select ON public.privacy_audit_log;
DROP POLICY IF EXISTS privacy_audit_log_scoped_insert ON public.privacy_audit_log;

CREATE POLICY privacy_audit_log_scoped_select
ON public.privacy_audit_log
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR actor_user_id = auth.uid());

CREATE POLICY privacy_audit_log_scoped_insert
ON public.privacy_audit_log
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR actor_user_id = auth.uid());

-- privacy_settings
DROP POLICY IF EXISTS privacy_settings_owner_select ON public.privacy_settings;
DROP POLICY IF EXISTS privacy_settings_owner_insert ON public.privacy_settings;
DROP POLICY IF EXISTS privacy_settings_owner_update ON public.privacy_settings;
DROP POLICY IF EXISTS privacy_settings_owner_delete ON public.privacy_settings;

CREATE POLICY privacy_settings_owner_select
ON public.privacy_settings
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY privacy_settings_owner_insert
ON public.privacy_settings
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY privacy_settings_owner_update
ON public.privacy_settings
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY privacy_settings_owner_delete
ON public.privacy_settings
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- team_sharing_settings
DROP POLICY IF EXISTS team_sharing_settings_scoped_select ON public.team_sharing_settings;
DROP POLICY IF EXISTS team_sharing_settings_owner_insert ON public.team_sharing_settings;
DROP POLICY IF EXISTS team_sharing_settings_owner_update ON public.team_sharing_settings;
DROP POLICY IF EXISTS team_sharing_settings_owner_delete ON public.team_sharing_settings;

CREATE POLICY team_sharing_settings_scoped_select
ON public.team_sharing_settings
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.team_id = team_sharing_settings.team_id
      AND tm.user_id = auth.uid()
      AND COALESCE(tm.status, 'active') = 'active'
  )
);

CREATE POLICY team_sharing_settings_owner_insert
ON public.team_sharing_settings
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY team_sharing_settings_owner_update
ON public.team_sharing_settings
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY team_sharing_settings_owner_delete
ON public.team_sharing_settings
FOR DELETE
TO authenticated
USING (user_id = auth.uid());
