-- ============================================================================
-- ACWR server calculation (public.calculate_acwr)
-- Daily wellness uniqueness: idx_wellness_checkin_unique_user_date on
-- (user_id, checkin_date) WHERE deleted_at IS NULL — see 20260109 migration.
-- Wellness check-ins do not affect ACWR; workload comes from workout_logs.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_acwr(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_today date := (timezone('utc', now()))::date;
  v_cutoff date := v_today - 28;
  v_loads float8[];
  v_acute float8;
  v_chronic float8;
  v_ratio float8 := 0;
  v_days int := 0;
  v_sessions int := 0;
  v_sufficient boolean := false;
  i int;
  d date;
  day_load float8;
  ewma float8;
  lam_a constant float8 := 0.2;
  lam_c constant float8 := 0.05;
  min_chronic constant float8 := 50;
  min_days constant int := 21;
  min_sess constant int := 12;
BEGIN
  IF auth.role() NOT IN ('authenticated', 'service_role') THEN
    RAISE EXCEPTION 'Not authorized to calculate ACWR';
  END IF;

  IF auth.role() = 'authenticated' AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Authenticated users may only calculate ACWR for themselves';
  END IF;

  SELECT
    COUNT(*)::int,
    COUNT(DISTINCT (wl.completed_at AT TIME ZONE 'UTC')::date)::int
  INTO v_sessions, v_days
  FROM public.workout_logs wl
  WHERE wl.player_id = p_user_id
    AND wl.completed_at IS NOT NULL
    AND (wl.completed_at AT TIME ZONE 'UTC')::date >= v_cutoff;

  v_sufficient := (v_days >= min_days AND v_sessions >= min_sess);

  v_loads := ARRAY_FILL(0::float8, ARRAY[28]);

  FOR i IN 0..27 LOOP
    d := v_today - i;
    SELECT COALESCE(
      SUM(
        COALESCE(wl.rpe, 5)::float8 * COALESCE(wl.duration_minutes, 60)::float8
      ),
      0::float8
    )
    INTO day_load
    FROM public.workout_logs wl
    WHERE wl.player_id = p_user_id
      AND wl.completed_at IS NOT NULL
      AND (wl.completed_at AT TIME ZONE 'UTC')::date = d;

    v_loads[i + 1] := day_load;
  END LOOP;

  ewma := v_loads[1];
  FOR i IN 1..6 LOOP
    ewma := lam_a * v_loads[i + 1] + (1.0 - lam_a) * ewma;
  END LOOP;
  v_acute := round(ewma::numeric, 2)::float8;

  ewma := v_loads[1];
  FOR i IN 1..27 LOOP
    ewma := lam_c * v_loads[i + 1] + (1.0 - lam_c) * ewma;
  END LOOP;
  v_chronic := round(GREATEST(ewma, min_chronic)::numeric, 2)::float8;

  IF NOT v_sufficient THEN
    v_ratio := 0;
  ELSIF v_chronic = 0 THEN
    v_ratio := 0;
  ELSE
    v_ratio := round((v_acute / v_chronic)::numeric, 2)::float8;
  END IF;

  RETURN jsonb_build_object(
    'acute_load', v_acute,
    'chronic_load', v_chronic,
    'ratio', v_ratio,
    'sufficient', v_sufficient,
    'days_with_data', v_days,
    'sessions_in_window', v_sessions,
    'computed_at', to_char(timezone('utc', now()) AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  );
END;
$$;

COMMENT ON FUNCTION public.calculate_acwr(uuid) IS
  'EWMA-based ACWR (7d acute / 28d chronic) from workout_logs; matches adult_flag_competitive_v1 preset. Dates use UTC.';

GRANT EXECUTE ON FUNCTION public.calculate_acwr(uuid) TO authenticated, service_role;
