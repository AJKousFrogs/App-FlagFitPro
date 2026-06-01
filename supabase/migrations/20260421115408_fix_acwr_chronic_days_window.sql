-- Fix date arithmetic in calculate_chronic_load.
-- In PostgreSQL, date - date returns an integer day count, not an interval.

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
      (reference_date - MIN(COALESCE(lm.date, lm.monitoring_date)))::integer + 1
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

GRANT EXECUTE ON FUNCTION public.calculate_chronic_load(uuid, date) TO authenticated;
