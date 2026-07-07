-- Monitoring: normalized SESSION LOAD (additive, one concern).
-- Idempotent on (user_id, session_id, provider) so re-import never double-counts.
--
-- Reversal: DROP TABLE IF EXISTS public.session_load;

CREATE TABLE IF NOT EXISTS public.session_load (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id     text NOT NULL,                 -- provider's session identifier
  provider       text NOT NULL DEFAULT 'manual',
  recorded_at    timestamptz NOT NULL,
  training_session_id uuid REFERENCES public.training_sessions(id) ON DELETE SET NULL,
  -- PlayerLoad
  player_load numeric, player_load_per_min numeric, high_ima integer,
  -- jumps / landings (split) + landing asymmetry
  jump_count integer, landing_count integer, landing_asymmetry_pct numeric,
  -- change of direction: banded + planned/reactive split
  cod_total integer, cod_planned integer, cod_reactive integer,
  cod_band1_count integer, cod_band2_count integer, cod_band3_count integer,
  -- accel / decel split, intensity-banded (2/3/4 m/s2), + ratio
  accel_total integer, accel_band1_count integer, accel_band2_count integer, accel_band3_count integer,
  decel_total integer, decel_band1_count integer, decel_band2_count integer, decel_band3_count integer,
  decel_accel_ratio numeric,
  -- GPS
  total_distance_m numeric, hsr_distance_m numeric, max_velocity_kmh numeric,
  sprint_count integer, sprint_distance_m numeric,
  -- HR-derived
  hr_max integer, hr_avg integer, resting_hr integer, hrv numeric, trimp numeric, hrr integer,
  hr_z1_seconds integer, hr_z2_seconds integer, hr_z3_seconds integer, hr_z4_seconds integer, hr_z5_seconds integer,
  -- context
  session_context text, notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, session_id, provider)
);
CREATE INDEX IF NOT EXISTS idx_session_load_user_time ON public.session_load (user_id, recorded_at DESC);
ALTER TABLE public.session_load ENABLE ROW LEVEL SECURITY;

-- LOAD layer: athlete own + sc_coach/physio roster read (NOT head_coach).
CREATE POLICY session_load_own ON public.session_load
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY session_load_staff_read ON public.session_load
  FOR SELECT TO authenticated
  USING (public.can_role_read_athlete(user_id, ARRAY['sc_coach','physio']));
