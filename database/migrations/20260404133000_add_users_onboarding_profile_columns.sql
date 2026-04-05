-- Align public.users with Angular onboarding / settings payloads.
-- Missing columns caused PostgREST 400 (unknown field) on PATCH/INSERT.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS team text,
  ADD COLUMN IF NOT EXISTS secondary_position text,
  ADD COLUMN IF NOT EXISTS throwing_arm text,
  ADD COLUMN IF NOT EXISTS preferred_units text,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

COMMENT ON COLUMN public.users.country IS 'Country / region (onboarding & profile)';
COMMENT ON COLUMN public.users.team IS 'Primary team name or label (onboarding)';
COMMENT ON COLUMN public.users.secondary_position IS 'Secondary playing position';
COMMENT ON COLUMN public.users.throwing_arm IS 'QB throwing arm preference';
COMMENT ON COLUMN public.users.preferred_units IS 'metric or imperial for display';
COMMENT ON COLUMN public.users.onboarding_completed_at IS 'When the user finished the onboarding flow';
