-- Reconcile frontend-required schema objects that are currently missing in production.
-- This migration is intentionally idempotent and safe to re-run.

BEGIN;

-- ============================================================================
-- 1) USERS: Add columns expected by Angular services
-- ============================================================================
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS jersey_number INTEGER CHECK (jersey_number BETWEEN 0 AND 99),
  ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other', 'undisclosed'));

-- Backfill from legacy columns when available
UPDATE public.users
SET
  full_name = COALESCE(full_name, NULLIF(TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')), '')),
  date_of_birth = COALESCE(date_of_birth, birth_date),
  profile_photo_url = COALESCE(profile_photo_url, profile_picture)
WHERE
  full_name IS NULL
  OR date_of_birth IS NULL
  OR profile_photo_url IS NULL;

-- ============================================================================
-- 2) TEAM_MEMBERS: Expand role constraint to match app-supported roles
-- ============================================================================
ALTER TABLE public.team_members DROP CONSTRAINT IF EXISTS team_members_role_check;
ALTER TABLE public.team_members
  ADD CONSTRAINT team_members_role_check
  CHECK (
    role IN (
      'owner',
      'admin',
      'head_coach',
      'coach',
      'offense_coordinator',
      'defense_coordinator',
      'assistant_coach',
      'physiotherapist',
      'nutritionist',
      'strength_conditioning_coach',
      'psychologist',
      'player',
      'manager'
    )
  );

-- ============================================================================
-- 3) Missing core tables queried directly by frontend
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.supplement_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplement_name VARCHAR(200) NOT NULL,
  dosage VARCHAR(100),
  taken BOOLEAN NOT NULL DEFAULT false,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time_of_day VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.performance_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_type VARCHAR(100) NOT NULL,
  result_value NUMERIC(8, 2) NOT NULL,
  target_value NUMERIC(8, 2),
  test_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  conditions JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.daily_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  protocol_date DATE NOT NULL,
  readiness_score INTEGER,
  acwr_value NUMERIC(4, 2),
  total_load_target_au INTEGER,
  ai_rationale TEXT,
  training_focus TEXT,
  morning_status TEXT DEFAULT 'pending' CHECK (morning_status IN ('pending', 'in_progress', 'complete', 'skipped')),
  foam_roll_status TEXT DEFAULT 'pending' CHECK (foam_roll_status IN ('pending', 'in_progress', 'complete', 'skipped')),
  main_session_status TEXT DEFAULT 'pending' CHECK (main_session_status IN ('pending', 'in_progress', 'complete', 'skipped')),
  evening_status TEXT DEFAULT 'pending' CHECK (evening_status IN ('pending', 'in_progress', 'complete', 'skipped')),
  overall_progress INTEGER DEFAULT 0,
  completed_exercises INTEGER DEFAULT 0,
  total_exercises INTEGER DEFAULT 0,
  morning_completed_at TIMESTAMPTZ,
  foam_roll_completed_at TIMESTAMPTZ,
  main_session_completed_at TIMESTAMPTZ,
  evening_completed_at TIMESTAMPTZ,
  actual_duration_minutes INTEGER,
  actual_rpe INTEGER CHECK (actual_rpe BETWEEN 1 AND 10),
  actual_load_au INTEGER,
  session_notes TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  coach_alert_active BOOLEAN DEFAULT false,
  coach_alert_message TEXT,
  coach_alert_requires_acknowledgment BOOLEAN DEFAULT false,
  coach_acknowledged BOOLEAN DEFAULT false,
  coach_acknowledged_at TIMESTAMPTZ,
  modified_by_coach_id UUID REFERENCES auth.users(id),
  modified_by_coach_name TEXT,
  modified_at TIMESTAMPTZ,
  coach_note TEXT,
  coach_note_priority TEXT DEFAULT 'info',
  confidence_metadata JSONB,
  UNIQUE (user_id, protocol_date)
);

CREATE TABLE IF NOT EXISTS public.protocol_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID NOT NULL REFERENCES public.daily_protocols(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  block_type TEXT NOT NULL CHECK (block_type IN ('morning_mobility', 'foam_roll', 'warm_up', 'main_session', 'cool_down', 'evening_recovery')),
  sequence_order INTEGER NOT NULL,
  prescribed_sets INTEGER,
  prescribed_reps INTEGER,
  prescribed_hold_seconds INTEGER,
  prescribed_duration_seconds INTEGER,
  prescribed_weight_kg NUMERIC(5, 2),
  yesterday_sets INTEGER,
  yesterday_reps INTEGER,
  yesterday_hold_seconds INTEGER,
  progression_note TEXT,
  ai_note TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'complete', 'skipped')),
  completed_at TIMESTAMPTZ,
  actual_sets INTEGER,
  actual_reps INTEGER,
  actual_hold_seconds INTEGER,
  actual_duration_seconds INTEGER,
  actual_weight_kg NUMERIC(5, 2),
  load_contribution_au INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (protocol_id, exercise_id, block_type)
);

CREATE TABLE IF NOT EXISTS public.ai_training_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suggestion_type TEXT NOT NULL,
  priority TEXT,
  title TEXT,
  description TEXT,
  message TEXT,
  reason TEXT,
  confidence_score NUMERIC(5, 4),
  data_sources JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active',
  accepted BOOLEAN NOT NULL DEFAULT false,
  dismissed BOOLEAN NOT NULL DEFAULT false,
  affected_session_id UUID REFERENCES public.training_sessions(id) ON DELETE SET NULL,
  suggested_changes JSONB DEFAULT '{}'::jsonb,
  applied_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.return_to_play_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_id UUID GENERATED ALWAYS AS (athlete_id) STORED,
  status TEXT NOT NULL DEFAULT 'active',
  current_phase INTEGER NOT NULL DEFAULT 1,
  phase_description TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  estimated_completion_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.athlete_travel_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  arrival_date DATE NOT NULL,
  adaptation_day INTEGER,
  timezone_difference INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4) Indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_supplement_logs_user_date ON public.supplement_logs(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_performance_tests_user_type_date ON public.performance_tests(user_id, test_type, test_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_protocols_user_date ON public.daily_protocols(user_id, protocol_date DESC);
CREATE INDEX IF NOT EXISTS idx_protocol_exercises_protocol ON public.protocol_exercises(protocol_id, block_type, sequence_order);
CREATE INDEX IF NOT EXISTS idx_ai_training_suggestions_user_created ON public.ai_training_suggestions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_training_suggestions_user_dismissed ON public.ai_training_suggestions(user_id, dismissed);
CREATE INDEX IF NOT EXISTS idx_rtp_athlete_status_created ON public.return_to_play_protocols(athlete_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rtp_player_status_start ON public.return_to_play_protocols(player_id, status, start_date DESC);
CREATE INDEX IF NOT EXISTS idx_athlete_travel_log_user_arrival ON public.athlete_travel_log(user_id, arrival_date DESC);

-- ============================================================================
-- 5) RLS + policies
-- ============================================================================
ALTER TABLE public.supplement_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protocol_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_training_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_to_play_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_travel_log ENABLE ROW LEVEL SECURITY;

-- Supplement logs
DROP POLICY IF EXISTS "supplement_logs_own" ON public.supplement_logs;
CREATE POLICY "supplement_logs_own"
ON public.supplement_logs FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Performance tests
DROP POLICY IF EXISTS "performance_tests_own" ON public.performance_tests;
CREATE POLICY "performance_tests_own"
ON public.performance_tests FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Daily protocols
DROP POLICY IF EXISTS "daily_protocols_own" ON public.daily_protocols;
CREATE POLICY "daily_protocols_own"
ON public.daily_protocols FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Protocol exercises (access through parent protocol ownership)
DROP POLICY IF EXISTS "protocol_exercises_via_protocol" ON public.protocol_exercises;
CREATE POLICY "protocol_exercises_via_protocol"
ON public.protocol_exercises FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.daily_protocols dp
    WHERE dp.id = protocol_exercises.protocol_id
      AND dp.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.daily_protocols dp
    WHERE dp.id = protocol_exercises.protocol_id
      AND dp.user_id = auth.uid()
  )
);

-- AI suggestions
DROP POLICY IF EXISTS "ai_training_suggestions_own" ON public.ai_training_suggestions;
CREATE POLICY "ai_training_suggestions_own"
ON public.ai_training_suggestions FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Return to play
DROP POLICY IF EXISTS "return_to_play_protocols_own" ON public.return_to_play_protocols;
CREATE POLICY "return_to_play_protocols_own"
ON public.return_to_play_protocols FOR ALL
TO authenticated
USING (auth.uid() = athlete_id)
WITH CHECK (auth.uid() = athlete_id);

-- Travel log
DROP POLICY IF EXISTS "athlete_travel_log_own" ON public.athlete_travel_log;
CREATE POLICY "athlete_travel_log_own"
ON public.athlete_travel_log FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

COMMIT;
