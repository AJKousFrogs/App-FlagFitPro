-- Count ACWR baseline days as calendar days since first load-monitoring date.
-- Rest days are zero-load days and must count in the acute/chronic windows.

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
  SELECT LEAST(
    28,
    GREATEST(
      0,
      COALESCE(
        (reference_date - MIN(COALESCE(lm.date, lm.monitoring_date)))::integer + 1,
        0
      )
    )
  )
  INTO days_of_data
  FROM public.load_monitoring lm
  WHERE lm.player_id = player_uuid
    AND COALESCE(lm.date, lm.monitoring_date) <= reference_date;

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

GRANT EXECUTE ON FUNCTION public.calculate_acwr_safe(uuid, date) TO authenticated;
