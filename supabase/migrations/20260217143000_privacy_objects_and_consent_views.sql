-- Ensure privacy/consent core objects exist in canonical chain.
-- This migration is idempotent and safe to re-run.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.privacy_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  performance_sharing_default boolean NOT NULL DEFAULT false,
  health_sharing_default boolean NOT NULL DEFAULT false,
  ai_processing_enabled boolean NOT NULL DEFAULT false,
  ai_processing_consent_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.team_sharing_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  performance_sharing_enabled boolean NOT NULL DEFAULT false,
  health_sharing_enabled boolean NOT NULL DEFAULT false,
  allowed_metric_categories text[] NOT NULL DEFAULT ARRAY[]::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, team_id)
);

CREATE TABLE IF NOT EXISTS public.parental_consent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  minor_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  guardian_email text,
  guardian_name text,
  relationship text,
  status text NOT NULL DEFAULT 'pending',
  consent_scope jsonb NOT NULL DEFAULT '{}'::jsonb,
  verified_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text,
  status text NOT NULL DEFAULT 'pending',
  soft_deleted_at timestamptz,
  scheduled_hard_delete_at timestamptz,
  sessions_revoked_at timestamptz,
  hard_deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.emergency_medical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email_hash text,
  record_type text,
  record_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  retention_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.privacy_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  affected_table text,
  affected_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_privacy_settings_user_id
  ON public.privacy_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_team_sharing_settings_user_team
  ON public.team_sharing_settings(user_id, team_id);
CREATE INDEX IF NOT EXISTS idx_parental_consent_minor_user
  ON public.parental_consent(minor_user_id);
CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_user_status
  ON public.account_deletion_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_emergency_medical_records_user_id
  ON public.emergency_medical_records(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_audit_log_user_id_created
  ON public.privacy_audit_log(user_id, created_at DESC);

CREATE OR REPLACE VIEW public.v_load_monitoring_consent
WITH (security_invoker = true)
AS
SELECT
  lm.*,
  false AS consent_blocked
FROM public.load_monitoring lm;

CREATE OR REPLACE VIEW public.v_workout_logs_consent
WITH (security_invoker = true)
AS
SELECT
  wl.*,
  false AS consent_blocked
FROM public.workout_logs wl;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.privacy_settings TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_sharing_settings TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parental_consent TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.account_deletion_requests TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emergency_medical_records TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.privacy_audit_log TO authenticated, service_role;
GRANT SELECT ON public.v_load_monitoring_consent TO authenticated, service_role;
GRANT SELECT ON public.v_workout_logs_consent TO authenticated, service_role;

DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
