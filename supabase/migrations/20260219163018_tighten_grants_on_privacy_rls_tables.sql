REVOKE ALL ON TABLE public.parental_consent FROM anon, authenticated;
REVOKE ALL ON TABLE public.account_deletion_requests FROM anon, authenticated;
REVOKE ALL ON TABLE public.emergency_medical_records FROM anon, authenticated;
REVOKE ALL ON TABLE public.privacy_audit_log FROM anon, authenticated;
REVOKE ALL ON TABLE public.privacy_settings FROM anon, authenticated;
REVOKE ALL ON TABLE public.team_sharing_settings FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.parental_consent TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.account_deletion_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.emergency_medical_records TO authenticated;
GRANT SELECT, INSERT ON TABLE public.privacy_audit_log TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.privacy_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.team_sharing_settings TO authenticated;

GRANT ALL ON TABLE public.parental_consent TO service_role;
GRANT ALL ON TABLE public.account_deletion_requests TO service_role;
GRANT ALL ON TABLE public.emergency_medical_records TO service_role;
GRANT ALL ON TABLE public.privacy_audit_log TO service_role;
GRANT ALL ON TABLE public.privacy_settings TO service_role;
GRANT ALL ON TABLE public.team_sharing_settings TO service_role;
