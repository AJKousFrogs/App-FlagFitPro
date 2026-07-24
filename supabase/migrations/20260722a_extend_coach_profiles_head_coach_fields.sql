-- =====================================================
-- TIER 1 follow-up: Head Coach profile fields
-- Purpose: The head-coach onboarding form collects fields the original
-- TIER 1 migration (20260722_staff_profiles_and_credentials.sql) didn't
-- add to coach_profiles — discovered while wiring the backend endpoints.
-- =====================================================

BEGIN;

ALTER TABLE public.coach_profiles
  ADD COLUMN IF NOT EXISTS years_as_head_coach INTEGER,
  ADD COLUMN IF NOT EXISTS coaching_background TEXT,
  ADD COLUMN IF NOT EXISTS team_development_approach TEXT;

COMMIT;
