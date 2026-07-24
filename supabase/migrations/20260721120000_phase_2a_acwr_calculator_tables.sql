-- Phase 2a: ACWR Alerting Storage Schema
-- Stores materialized daily ACWR snapshots, RTP phase progress tracking, and
-- psychological readiness assessments that the Phase 3 Alert Engine fires on.
-- The ACWR ratio itself is computed by the single canonical engine
-- (netlify/functions/utils/acwr.js) and written here -- this migration does not
-- define its own ACWR calculation (see the note below the table definitions).
--
-- Design: docs/phase_2_schema_and_acwr_calculator.md (aspirational; some of that
-- doc's schema, e.g. a standalone calculate_acwr_for_athlete SQL function and
-- recovery-modality logging, was superseded before this migration was applied
-- -- see the note below).

-- ===== ACWR Snapshots (Daily Materialized View) =====
-- Stores the pre-computed daily ACWR ratio, personalized safe zones, and alert status
-- to avoid recalculating on every client/API request.
CREATE TABLE IF NOT EXISTS public.acwr_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL,

  -- Raw ACWR components (7d acute, 21d chronic, EWMA)
  acute_load_au numeric(8, 2) NOT NULL DEFAULT 0,
  chronic_load_au numeric(8, 2) NOT NULL DEFAULT 0,
  acwr_ratio numeric(4, 2),  -- NULL if insufficient data; 2-digit precision covers 0.00-99.99

  -- Personalized safe zones (adjustedfor cumulative multiplier)
  personalized_safe_zone_min numeric(4, 2),
  personalized_safe_zone_max numeric(4, 2),

  -- ACWR status classification
  acwr_status varchar(20),  -- 'safe', 'yellow_flag', 'red_flag', 'underload', 'building_base'
  safety_alert boolean DEFAULT false,  -- Triggers coach notification

  -- Multiplier audit trail (for debugging/tuning)
  biomarker_multiplier numeric(4, 2),
  confound_multiplier numeric(4, 2),
  menstrual_cycle_multiplier numeric(4, 2),
  chronotype_multiplier numeric(4, 2),
  position_multiplier numeric(4, 2),
  genetic_multiplier numeric(4, 2),
  cumulative_multiplier numeric(4, 2),  -- product of all multipliers

  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  UNIQUE(user_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_acwr_snapshots_user_date
  ON public.acwr_snapshots(user_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_acwr_snapshots_status
  ON public.acwr_snapshots(acwr_status) WHERE acwr_status IN ('red_flag', 'safety_alert');

-- ===== RTP Phase Progress Tracking =====
-- Weekly snapshot of an athlete's RTP progression (phase, criteria compliance, readiness).
-- Used to track recovery from injury and prevent premature advancement.
CREATE TABLE IF NOT EXISTS public.rtp_phase_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  injury_id uuid NOT NULL REFERENCES public.athlete_injuries(id) ON DELETE CASCADE,

  week_ending date NOT NULL,
  current_rtp_phase integer NOT NULL DEFAULT 0,  -- 0=protection, 1=early loading, ..., 5+=maintenance

  -- Functional criteria compliance (0-100%)
  strength_lsi_pct numeric(5, 1),  -- Limb symmetry index (% of uninjured side)
  hop_test_battery_pct numeric(5, 1),  -- Single/triple/crossover hop average
  acl_rsi_pct numeric(5, 1),  -- ACL Return to Sport Index (if applicable)
  tsk11_normalized boolean,  -- TSK-11 normalized (<37 = low fear-avoidance)
  biomechanics_symmetrical boolean,

  -- Readiness assessment
  athlete_confidence_1_10 integer,
  coach_confidence_1_10 integer,
  pain_level_0_10 integer,  -- 0=no pain, 10=severe

  -- ACWR target for this phase
  acwr_target_min numeric(4, 2),
  acwr_target_max numeric(4, 2),
  acwr_compliance_pct numeric(5, 1),  -- % days in target zone

  -- Decision gate (coach approves advancement)
  ready_for_next_phase boolean DEFAULT false,
  coach_notes text,

  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rtp_progress_user_injury
  ON public.rtp_phase_progress(user_id, injury_id);
CREATE INDEX IF NOT EXISTS idx_rtp_progress_week
  ON public.rtp_phase_progress(week_ending DESC);

-- ===== Psychological Readiness Assessments =====
-- Stores ACL-RSI, TSK-11, and other psychological readiness measures
-- that predict RTP success (ACL-RSI ≥56/100 correlates r=0.56 with successful RTS).
--
-- Named rtp_psychological_assessments (not psychological_assessments) because a
-- table of that name already exists live, used by staff-psychology.js for a
-- completely different, generic questionnaire concept (assessment_type/questions/
-- responses/score/interpretation) -- different intent, different columns. Colliding
-- names would have made this CREATE TABLE IF NOT EXISTS silently no-op against it.
CREATE TABLE IF NOT EXISTS public.rtp_psychological_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_date date NOT NULL,
  injury_id uuid REFERENCES public.athlete_injuries(id) ON DELETE CASCADE,  -- NULL = general wellness assessment

  -- ACL-RSI (ACL Return to Sport Index), 0-100
  acl_rsi_score integer,  -- ≥56 = ready for RTS (r=0.56 predictor of success)

  -- TSK-11 (Tampa Scale of Kinesiophobia), 11-55
  tsk11_score integer,  -- <37 = low fear-avoidance (ready), ≥37 = high fear

  -- General psychological readiness
  confidence_1_10 integer,
  coping_strategies text,  -- narrative of athlete's mental preparation

  created_at timestamp with time zone DEFAULT now(),

  UNIQUE(user_id, assessment_date, injury_id)
);

CREATE INDEX IF NOT EXISTS idx_rtp_psych_assessments_user
  ON public.rtp_psychological_assessments(user_id, assessment_date DESC);

-- Note: this migration originally also defined a `calculate_acwr_for_athlete`
-- stored procedure and an `athlete_recovery_logs` table. Both were removed
-- before this migration was ever applied live:
--  - calculate_acwr_for_athlete re-implemented ACWR entirely in SQL, a second,
--    independent calculation of a safety-critical metric that duplicates the
--    canonical utils/acwr.js engine (CLAUDE.md's single-source-of-truth rule).
--    It was also dead code (nothing ever called it) and referenced two tables
--    that don't exist live (public.athletes, public.individual_profiles), so it
--    would have errored on every call anyway.
--  - athlete_recovery_logs had a FK to public.recovery_modalities, a table that
--    was never created by any migration -- CREATE TABLE would have failed
--    outright. It was also dead code (nothing referenced it) and duplicated the
--    concept the already-live recovery_sessions/recovery_protocols tables cover.

-- ===== RLS Policy: acwr_snapshots =====
-- Athletes see their own ACWR; staff (coach/physio) see their team's athletes
ALTER TABLE public.acwr_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "acwr_snapshots_athlete_read" ON public.acwr_snapshots
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "acwr_snapshots_staff_read" ON public.acwr_snapshots
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      INNER JOIN public.team_members athlete_tm
        ON tm.team_id = athlete_tm.team_id
      WHERE tm.user_id = auth.uid()
        AND athlete_tm.user_id = acwr_snapshots.user_id
        AND tm.role IN ('owner', 'admin', 'head_coach', 'coach', 'assistant_coach', 'physiotherapist')
        AND tm.status = 'active'
        AND athlete_tm.status = 'active'
    )
  );

-- ===== RLS Policy: rtp_phase_progress =====
ALTER TABLE public.rtp_phase_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rtp_progress_athlete_read" ON public.rtp_phase_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "rtp_progress_staff_read" ON public.rtp_phase_progress
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      INNER JOIN public.team_members athlete_tm
        ON tm.team_id = athlete_tm.team_id
      WHERE tm.user_id = auth.uid()
        AND athlete_tm.user_id = rtp_phase_progress.user_id
        AND tm.role IN ('owner', 'admin', 'head_coach', 'coach', 'assistant_coach', 'physiotherapist')
        AND tm.status = 'active'
        AND athlete_tm.status = 'active'
    )
  );

-- ===== RLS Policy: rtp_psychological_assessments =====
ALTER TABLE public.rtp_psychological_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rtp_psych_assessments_athlete_read" ON public.rtp_psychological_assessments
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "rtp_psych_assessments_staff_read" ON public.rtp_psychological_assessments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      INNER JOIN public.team_members athlete_tm
        ON tm.team_id = athlete_tm.team_id
      WHERE tm.user_id = auth.uid()
        AND athlete_tm.user_id = rtp_psychological_assessments.user_id
        AND tm.role IN ('owner', 'admin', 'head_coach', 'coach', 'assistant_coach', 'psychologist')
        AND tm.status = 'active'
        AND athlete_tm.status = 'active'
    )
  );
