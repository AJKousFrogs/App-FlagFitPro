-- =====================================================
-- TIER 1 follow-up: Athlete onboarding profile fields
-- Purpose: The athlete onboarding form collects sport/experience/medical
-- history/emergency-contact fields not previously stored anywhere. `users`
-- is the existing canonical location for athlete bio-profile data
-- (already holds date_of_birth/position/height_cm/weight_kg) — reusing it
-- rather than creating a new table.
-- =====================================================

BEGIN;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS sport VARCHAR(100),
  ADD COLUMN IF NOT EXISTS years_experience INTEGER,
  ADD COLUMN IF NOT EXISTS medical_history TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(50);

COMMIT;
