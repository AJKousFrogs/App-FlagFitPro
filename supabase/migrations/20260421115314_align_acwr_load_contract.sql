-- Align ACWR/load-monitoring database shape with frontend and contract tests.
-- Keeps existing compact columns (monitoring_date, risk_level, workout_type)
-- while restoring canonical columns used by app services and ACWR functions.

-- ---------------------------------------------------------------------------
-- workout_logs compatibility columns
-- ---------------------------------------------------------------------------
ALTER TABLE public.workout_logs
  ADD COLUMN IF NOT EXISTS session_id uuid,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS load_au integer,
  ADD COLUMN IF NOT EXISTS session_type varchar(50),
  ADD COLUMN IF NOT EXISTS external_load_data jsonb,
  ADD COLUMN IF NOT EXISTS wellness_snapshot jsonb,
  ADD COLUMN IF NOT EXISTS wellness_adjustment_factor numeric(3,2),
  ADD COLUMN IF NOT EXISTS avg_heart_rate integer,
  ADD COLUMN IF NOT EXISTS max_heart_rate integer;

UPDATE public.workout_logs
SET
  session_id = COALESCE(session_id, source_session_id),
  session_type = COALESCE(session_type, workout_type),
  load_au = COALESCE(load_au, ROUND(rpe * duration_minutes)::integer)
WHERE session_id IS DISTINCT FROM COALESCE(session_id, source_session_id)
  OR session_type IS DISTINCT FROM COALESCE(session_type, workout_type)
  OR load_au IS DISTINCT FROM COALESCE(load_au, ROUND(rpe * duration_minutes)::integer);

CREATE INDEX IF NOT EXISTS idx_workout_logs_player_completed_at
  ON public.workout_logs(player_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_workout_logs_player_date_load
  ON public.workout_logs(player_id, completed_at DESC, load_au)
  WHERE load_au IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_workout_logs_session_type
  ON public.workout_logs(player_id, session_type, completed_at DESC);

CREATE OR REPLACE FUNCTION public.calculate_workout_load_au()
RETURNS trigger AS $$
BEGIN
  IF NEW.session_id IS NULL AND NEW.source_session_id IS NOT NULL THEN
    NEW.session_id := NEW.source_session_id;
  END IF;

  IF NEW.source_session_id IS NULL AND NEW.session_id IS NOT NULL THEN
    NEW.source_session_id := NEW.session_id;
  END IF;

  IF NEW.session_type IS NULL AND NEW.workout_type IS NOT NULL THEN
    NEW.session_type := NEW.workout_type;
  END IF;

  IF NEW.workout_type IS NULL AND NEW.session_type IS NOT NULL THEN
    NEW.workout_type := NEW.session_type;
  END IF;

  IF NEW.load_au IS NULL AND NEW.rpe IS NOT NULL AND NEW.duration_minutes IS NOT NULL THEN
    NEW.load_au := ROUND(NEW.rpe * NEW.duration_minutes)::integer;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_workout_load_au ON public.workout_logs;
CREATE TRIGGER trigger_calculate_workout_load_au
  BEFORE INSERT OR UPDATE ON public.workout_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_workout_load_au();

-- ---------------------------------------------------------------------------
-- load_monitoring compatibility columns
-- ---------------------------------------------------------------------------
ALTER TABLE public.load_monitoring
  ADD COLUMN IF NOT EXISTS date date,
  ADD COLUMN IF NOT EXISTS daily_load integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS injury_risk_level varchar(20),
  ADD COLUMN IF NOT EXISTS baseline_days integer,
  ADD COLUMN IF NOT EXISTS calculated_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS workout_log_id uuid;

UPDATE public.load_monitoring
SET
  date = COALESCE(date, monitoring_date),
  monitoring_date = COALESCE(monitoring_date, date, CURRENT_DATE),
  daily_load = COALESCE(daily_load, 0),
  injury_risk_level = COALESCE(injury_risk_level, risk_level, 'Unknown'),
  risk_level = COALESCE(risk_level, injury_risk_level, 'Unknown'),
  calculated_at = COALESCE(calculated_at, updated_at, created_at, now())
WHERE date IS NULL
  OR monitoring_date IS NULL
  OR daily_load IS NULL
  OR injury_risk_level IS NULL
  OR risk_level IS NULL
  OR calculated_at IS NULL;

ALTER TABLE public.load_monitoring
  ALTER COLUMN date SET DEFAULT CURRENT_DATE,
  ALTER COLUMN date SET NOT NULL,
  ALTER COLUMN monitoring_date SET DEFAULT CURRENT_DATE,
  ALTER COLUMN daily_load SET DEFAULT 0,
  ALTER COLUMN calculated_at SET DEFAULT now(),
  ALTER COLUMN risk_level SET DEFAULT 'Unknown',
  ALTER COLUMN injury_risk_level SET DEFAULT 'Unknown';

CREATE UNIQUE INDEX IF NOT EXISTS idx_load_monitoring_player_date_unique
  ON public.load_monitoring(player_id, date);

CREATE UNIQUE INDEX IF NOT EXISTS idx_load_monitoring_player_monitoring_date_unique
  ON public.load_monitoring(player_id, monitoring_date);

CREATE INDEX IF NOT EXISTS idx_load_monitoring_player_calculated_at
  ON public.load_monitoring(player_id, calculated_at DESC);

-- ---------------------------------------------------------------------------
-- ACWR functions
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_daily_load(player_uuid uuid, log_date date)
RETURNS integer AS $$
DECLARE
  total_load integer;
BEGIN
  SELECT COALESCE(
    SUM(
      COALESCE(
        wl.load_au,
        CASE
          WHEN wl.rpe IS NOT NULL AND wl.duration_minutes IS NOT NULL
            THEN ROUND(wl.rpe * wl.duration_minutes)::integer
          ELSE 0
        END
      )
    ),
    0
  )::integer
  INTO total_load
  FROM public.workout_logs wl
  WHERE wl.player_id = player_uuid
    AND wl.completed_at::date = log_date;

  RETURN total_load;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.calculate_acute_load(player_uuid uuid, reference_date date)
RETURNS numeric AS $$
DECLARE
  total_load numeric(10,2);
BEGIN
  SELECT COALESCE(SUM(lm.daily_load), 0)
  INTO total_load
  FROM public.load_monitoring lm
  WHERE lm.player_id = player_uuid
    AND COALESCE(lm.date, lm.monitoring_date) >= reference_date - INTERVAL '6 days'
    AND COALESCE(lm.date, lm.monitoring_date) <= reference_date;

  RETURN ROUND(total_load / 7.0, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.calculate_chronic_load(player_uuid uuid, reference_date date)
RETURNS numeric AS $$
DECLARE
  total_load numeric(10,2);
  days_in_window integer;
  calculated_chronic numeric(10,2);
  min_chronic_load constant numeric := 50.0;
BEGIN
  SELECT COALESCE(SUM(lm.daily_load), 0)
  INTO total_load
  FROM public.load_monitoring lm
  WHERE lm.player_id = player_uuid
    AND COALESCE(lm.date, lm.monitoring_date) >= reference_date - INTERVAL '27 days'
    AND COALESCE(lm.date, lm.monitoring_date) <= reference_date;

  SELECT LEAST(
    28,
    GREATEST(
      1,
      EXTRACT(
        DAY FROM (
          reference_date - MIN(COALESCE(lm.date, lm.monitoring_date)) + INTERVAL '1 day'
        )
      )::integer
    )
  )
  INTO days_in_window
  FROM public.load_monitoring lm
  WHERE lm.player_id = player_uuid
    AND COALESCE(lm.date, lm.monitoring_date) <= reference_date;

  IF days_in_window IS NULL OR days_in_window = 0 THEN
    RETURN min_chronic_load;
  END IF;

  calculated_chronic := ROUND(total_load / days_in_window, 2);
  RETURN GREATEST(calculated_chronic, min_chronic_load);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_injury_risk_level(acwr_value numeric)
RETURNS varchar AS $$
BEGIN
  IF acwr_value IS NULL OR acwr_value = 0 THEN
    RETURN 'Unknown';
  ELSIF acwr_value < 0.8 THEN
    RETURN 'Low';
  ELSIF acwr_value >= 0.8 AND acwr_value <= 1.3 THEN
    RETURN 'Optimal';
  ELSIF acwr_value > 1.3 AND acwr_value <= 1.5 THEN
    RETURN 'Moderate';
  ELSE
    RETURN 'High';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.calculate_acwr_safe(player_uuid uuid, reference_date date)
RETURNS TABLE (
  acwr numeric(5,2),
  risk_level varchar(20),
  baseline_days integer
) AS $$
DECLARE
  days_of_data integer;
  acute_load_val numeric(10,2);
  chronic_load_val numeric(10,2);
  acwr_val numeric(5,2);
  risk varchar(20);
BEGIN
  SELECT COUNT(DISTINCT COALESCE(lm.date, lm.monitoring_date))
  INTO days_of_data
  FROM public.load_monitoring lm
  WHERE lm.player_id = player_uuid
    AND COALESCE(lm.date, lm.monitoring_date) <= reference_date
    AND COALESCE(lm.date, lm.monitoring_date) >= reference_date - INTERVAL '27 days';

  acute_load_val := public.calculate_acute_load(player_uuid, reference_date);
  chronic_load_val := public.calculate_chronic_load(player_uuid, reference_date);

  IF days_of_data < 7 THEN
    risk := 'baseline_building';
    acwr_val := NULL;
  ELSIF days_of_data < 21 THEN
    risk := 'baseline_building';
    acwr_val := ROUND(acute_load_val / NULLIF(chronic_load_val, 0), 2);
  ELSIF days_of_data < 28 THEN
    acwr_val := ROUND(acute_load_val / NULLIF(chronic_load_val, 0), 2);
    risk := CASE
      WHEN acwr_val > 1.5 THEN 'High'
      WHEN acwr_val > 1.3 THEN 'Moderate'
      ELSE 'baseline_low'
    END;
  ELSE
    acwr_val := ROUND(acute_load_val / NULLIF(chronic_load_val, 0), 2);
    risk := public.get_injury_risk_level(acwr_val);
  END IF;

  RETURN QUERY SELECT acwr_val, risk, COALESCE(days_of_data, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.update_load_monitoring()
RETURNS trigger AS $$
DECLARE
  log_date date;
  daily_load_value integer;
  acute_load_value numeric(10,2);
  chronic_load_value numeric(10,2);
  acwr_value numeric(5,2);
  risk_value varchar(20);
  baseline_days_value integer;
BEGIN
  log_date := NEW.completed_at::date;
  daily_load_value := public.calculate_daily_load(NEW.player_id, log_date);

  INSERT INTO public.load_monitoring (
    player_id,
    date,
    monitoring_date,
    daily_load,
    acute_load,
    chronic_load,
    acwr,
    risk_level,
    injury_risk_level,
    calculated_at,
    updated_at
  )
  VALUES (
    NEW.player_id,
    log_date,
    log_date,
    daily_load_value,
    0,
    0,
    NULL,
    'Unknown',
    'Unknown',
    now(),
    now()
  )
  ON CONFLICT (player_id, date)
  DO UPDATE SET
    monitoring_date = EXCLUDED.monitoring_date,
    daily_load = EXCLUDED.daily_load,
    calculated_at = now(),
    updated_at = now();

  acute_load_value := public.calculate_acute_load(NEW.player_id, log_date);
  chronic_load_value := public.calculate_chronic_load(NEW.player_id, log_date);

  SELECT cas.acwr, cas.risk_level, cas.baseline_days
  INTO acwr_value, risk_value, baseline_days_value
  FROM public.calculate_acwr_safe(NEW.player_id, log_date) cas;

  UPDATE public.load_monitoring lm
  SET
    acute_load = acute_load_value,
    chronic_load = chronic_load_value,
    acwr = acwr_value,
    risk_level = risk_value,
    injury_risk_level = risk_value,
    baseline_days = baseline_days_value,
    calculated_at = now(),
    updated_at = now()
  WHERE lm.player_id = NEW.player_id
    AND lm.date = log_date;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_load_monitoring ON public.workout_logs;
CREATE TRIGGER trigger_update_load_monitoring
  AFTER INSERT OR UPDATE ON public.workout_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_load_monitoring();

-- ---------------------------------------------------------------------------
-- Consent view with both canonical and legacy aliases.
-- ---------------------------------------------------------------------------
DROP VIEW IF EXISTS public.v_load_monitoring_consent;

CREATE OR REPLACE VIEW public.v_load_monitoring_consent
WITH (security_invoker = true)
AS
SELECT
  lm.id,
  lm.workout_log_id,
  lm.player_id,
  COALESCE(lm.date, lm.monitoring_date) AS date,
  COALESCE(lm.monitoring_date, lm.date) AS monitoring_date,
  lm.daily_load,
  lm.acute_load,
  lm.chronic_load,
  lm.acwr,
  COALESCE(lm.risk_level, lm.injury_risk_level) AS risk_level,
  COALESCE(lm.injury_risk_level, lm.risk_level) AS injury_risk_level,
  lm.baseline_days,
  lm.calculated_at,
  lm.created_at,
  lm.updated_at,
  false AS consent_blocked,
  'own_data'::text AS access_reason
FROM public.load_monitoring lm;

GRANT SELECT ON public.v_load_monitoring_consent TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_daily_load(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_acute_load(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_chronic_load(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_acwr_safe(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_injury_risk_level(numeric) TO authenticated;
