-- Phase 2a: ACWR Calculator Engine Schema
-- Implements the unified ACWR calculation engine with athlete-specific biomarker
-- and confound multipliers, injury RTP tracking, and recovery recommendation data.
--
-- Design: docs/phase_2_schema_and_acwr_calculator.md
-- Stores materialized daily ACWR snapshots, RTP progress tracking, psychological
-- readiness assessments, and recovery modality effectiveness logs.

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
CREATE TABLE IF NOT EXISTS public.psychological_assessments (
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

CREATE INDEX IF NOT EXISTS idx_psych_assessments_user
  ON public.psychological_assessments(user_id, assessment_date DESC);

-- ===== Athlete Recovery Logs =====
-- Records when an athlete uses a recovery modality and their perceived effectiveness.
-- Used to correlate recovery strategy effectiveness with objective markers (CMJ, HRV, etc.).
CREATE TABLE IF NOT EXISTS public.athlete_recovery_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date date NOT NULL,

  recovery_modality_id uuid NOT NULL REFERENCES public.recovery_modalities(id) ON DELETE RESTRICT,

  -- Session details
  duration_minutes integer,
  perceived_effectiveness_1_10 integer,
  notes text,

  created_at timestamp with time zone DEFAULT now(),

  UNIQUE(user_id, log_date, recovery_modality_id)
);

CREATE INDEX IF NOT EXISTS idx_recovery_logs_user_date
  ON public.athlete_recovery_logs(user_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_recovery_logs_modality
  ON public.athlete_recovery_logs(recovery_modality_id);

-- ===== ACWR Calculation Stored Procedure =====
-- Computes the daily ACWR ratio for an athlete, applying cumulative multipliers
-- from biomarkers, confounds, menstrual cycle, chronotype, position, and genetic factors.
--
-- Returns: acwr_ratio, personalized_lower, personalized_upper, status, alert
--
-- Calculation flow:
-- 1. Fetch 7-day acute load and 21-day chronic load from training_sessions
-- 2. Fetch athlete biomarkers (ferritin, vitamin D, etc.) and confounds (alcohol, caffeine)
-- 3. Compute multipliers: biomarker × confound × menstrual × chronotype × position × genetic
-- 4. Apply multiplier to safe-zone boundaries (0.8–1.3 × cumulative)
-- 5. Classify status (safe, yellow, red, underload, building_base)
CREATE OR REPLACE FUNCTION public.calculate_acwr_for_athlete(
  p_user_id uuid,
  p_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  acwr_ratio numeric,
  acwr_confidence varchar,  -- 'low', 'medium', 'high', 'building_base'
  personalized_lower numeric,
  personalized_upper numeric,
  acwr_status varchar,
  safety_alert boolean,
  acute_load numeric,
  chronic_load numeric,
  cumulative_multiplier numeric
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_acute_load numeric := 0;
  v_chronic_load numeric := 0;
  v_acwr_ratio numeric := NULL;
  v_acute_days integer := 0;
  v_confidence varchar := 'building_base';

  v_biomarker_mult numeric := 1.0;
  v_confound_mult numeric := 1.0;
  v_menstrual_mult numeric := 1.0;
  v_chronotype_mult numeric := 1.0;
  v_position_mult numeric := 1.0;
  v_genetic_mult numeric := 1.0;
  v_cumulative_mult numeric := 1.0;

  v_personalized_lower numeric;
  v_personalized_upper numeric;
  v_status varchar;
  v_alert boolean := false;

  v_ferritin numeric;
  v_vit_d numeric;
  v_alcohol_units numeric;
  v_caffeine_mg numeric;
  v_chronotype varchar;
  v_menstrual_phase varchar;
  v_position varchar;
BEGIN
  -- Step 1: Calculate acute (7d) and chronic (21d) load from training_sessions
  -- Acute window: p_date - 6 to p_date (7 days inclusive)
  SELECT
    COALESCE(SUM(COALESCE(workload, duration_minutes * rpe / 10.0)), 0)
  INTO v_acute_load
  FROM public.training_sessions
  WHERE user_id = p_user_id
    AND session_date >= (p_date - 6)
    AND session_date <= p_date;

  v_acute_days := (SELECT COUNT(DISTINCT session_date)
    FROM public.training_sessions
    WHERE user_id = p_user_id
      AND session_date >= (p_date - 6)
      AND session_date <= p_date);

  -- Chronic window: p_date - 20 to p_date (21 days inclusive)
  SELECT
    COALESCE(SUM(COALESCE(workload, duration_minutes * rpe / 10.0)), 0)
  INTO v_chronic_load
  FROM public.training_sessions
  WHERE user_id = p_user_id
    AND session_date >= (p_date - 20)
    AND session_date <= p_date;

  -- Step 2: Compute ACWR ratio (only if chronic load > 0)
  IF v_chronic_load > 0 THEN
    v_acwr_ratio := v_acute_load / v_chronic_load;

    -- Confidence grading: based on acute-window training days
    -- < 8 days of data in the 28-day span = low confidence
    IF v_acute_days >= 14 THEN
      v_confidence := 'high';
    ELSIF v_acute_days >= 10 THEN
      v_confidence := 'medium';
    ELSIF v_acute_days >= 8 THEN
      v_confidence := 'low';
    ELSE
      v_confidence := 'building_base';
      v_acwr_ratio := NULL;  -- Discard the ratio if insufficient data
    END IF;
  END IF;

  -- Step 3: Fetch biomarkers and compute multipliers
  -- Biomarker multiplier: iron status, vitamin D deficiency
  SELECT ferritin_ugL, vitamin_d_status
  INTO v_ferritin, v_vit_d
  FROM public.individual_profiles
  WHERE user_id = p_user_id;

  IF v_ferritin IS NOT NULL AND v_ferritin < 20 THEN
    v_biomarker_mult := 0.8;  -- Low iron reduces ACWR tolerance
  ELSIF v_vit_d IS NOT NULL AND v_vit_d < 20 THEN
    v_biomarker_mult := 0.9;  -- Vitamin D deficiency
  END IF;

  -- Confound multiplier: alcohol, caffeine
  SELECT alcohol_units_per_week, caffeine_mg_per_day
  INTO v_alcohol_units, v_caffeine_mg
  FROM public.individual_profiles
  WHERE user_id = p_user_id;

  IF v_alcohol_units IS NOT NULL AND v_alcohol_units > 14 THEN
    v_confound_mult := 0.75;  -- Heavy alcohol impairs recovery
  ELSIF v_caffeine_mg IS NOT NULL AND v_caffeine_mg > 6 * 80 THEN
    -- Assume avg body weight ~80kg; >6 mg/kg = > 480 mg
    v_confound_mult := 0.95;
  END IF;

  -- Menstrual cycle multiplier (if tracking enabled)
  SELECT menstrual_phase INTO v_menstrual_phase
  FROM public.individual_profiles
  WHERE user_id = p_user_id;

  IF v_menstrual_phase = 'menstrual' THEN
    v_menstrual_mult := 0.95;  -- Slight reduction during menstrual phase
  END IF;

  -- Chronotype multiplier (morning lark vs evening owl)
  SELECT chronotype INTO v_chronotype
  FROM public.athletes
  WHERE user_id = p_user_id;

  -- Placeholder: implement based on time-of-day logic
  -- For now, neutral multiplier
  v_chronotype_mult := 1.0;

  -- Position multiplier (midfield = higher load demand)
  SELECT position INTO v_position
  FROM public.athletes
  WHERE user_id = p_user_id;

  -- Placeholder: implement from position_demands_json
  -- For now, neutral multiplier
  v_position_mult := 1.0;

  -- Genetic multiplier (from genetic_profiles if available)
  -- Placeholder: implement from genotypes (ACE I/D, ACTN3, etc.)
  v_genetic_mult := 1.0;

  -- Step 4: Compute cumulative multiplier (product of all)
  v_cumulative_mult := v_biomarker_mult * v_confound_mult * v_menstrual_mult
                      * v_chronotype_mult * v_position_mult * v_genetic_mult;

  -- Step 5: Apply multiplier to safe-zone boundaries
  -- Base adult ACWR safe zone: 0.8–1.3
  v_personalized_lower := 0.8 * v_cumulative_mult;
  v_personalized_upper := 1.3 * v_cumulative_mult;

  -- Step 6: Classify ACWR status
  IF v_acwr_ratio IS NULL THEN
    v_status := 'building_base';
  ELSIF v_acwr_ratio > v_personalized_upper + 0.3 THEN
    v_status := 'red_flag';
    v_alert := true;
  ELSIF v_acwr_ratio > v_personalized_upper THEN
    v_status := 'yellow_flag';
  ELSIF v_acwr_ratio >= v_personalized_lower THEN
    v_status := 'safe';
  ELSIF v_acwr_ratio < v_personalized_lower THEN
    v_status := 'underload';
  END IF;

  RETURN QUERY
  SELECT
    v_acwr_ratio,
    v_confidence,
    v_personalized_lower,
    v_personalized_upper,
    v_status,
    v_alert,
    v_acute_load,
    v_chronic_load,
    v_cumulative_mult;
END;
$$;

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

-- ===== RLS Policy: psychological_assessments =====
ALTER TABLE public.psychological_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "psych_assessments_athlete_read" ON public.psychological_assessments
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "psych_assessments_staff_read" ON public.psychological_assessments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      INNER JOIN public.team_members athlete_tm
        ON tm.team_id = athlete_tm.team_id
      WHERE tm.user_id = auth.uid()
        AND athlete_tm.user_id = psychological_assessments.user_id
        AND tm.role IN ('owner', 'admin', 'head_coach', 'coach', 'assistant_coach', 'psychologist')
        AND tm.status = 'active'
        AND athlete_tm.status = 'active'
    )
  );

-- ===== RLS Policy: athlete_recovery_logs =====
ALTER TABLE public.athlete_recovery_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recovery_logs_athlete_read_write" ON public.athlete_recovery_logs
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "recovery_logs_staff_read" ON public.athlete_recovery_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      INNER JOIN public.team_members athlete_tm
        ON tm.team_id = athlete_tm.team_id
      WHERE tm.user_id = auth.uid()
        AND athlete_tm.user_id = athlete_recovery_logs.user_id
        AND tm.role IN ('owner', 'admin', 'head_coach', 'coach', 'assistant_coach', 'physiotherapist')
        AND tm.status = 'active'
        AND athlete_tm.status = 'active'
    )
  );
