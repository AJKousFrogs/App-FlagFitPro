-- S1 + D1: record_event_participation now distributes a multi-day tournament's
-- load across its actual days (was lumped on starts_at::date, misreading the
-- daily-EWMA ACWR for the highest-load events), and dedups any existing
-- competition session on each covered date so the weekend self-report path
-- (weekend-games.js) and the competition_events path can never double-count
-- acute load. Applied to the live DB via Supabase MCP; committed for repo parity.
CREATE OR REPLACE FUNCTION public.record_event_participation(p_user_id uuid, p_competition_event_id uuid, p_attended boolean, p_games_played integer DEFAULT 0, p_total_minutes integer DEFAULT NULL::integer, p_avg_rpe numeric DEFAULT NULL::numeric, p_notes text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_event public.competition_events%ROWTYPE;
  v_minutes_per_game constant integer := 40;
  v_default_game_rpe constant numeric := 7;
  v_caller uuid := auth.uid();
  v_minutes integer; v_rpe numeric; v_load numeric;
  v_old_session_id uuid; v_participation_id uuid;
BEGIN
  SELECT * INTO v_event FROM public.competition_events WHERE id = p_competition_event_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'competition_event % not found', p_competition_event_id; END IF;

  IF auth.role() <> 'service_role'
     AND v_caller IS DISTINCT FROM p_user_id
     AND NOT public.ff_is_team_staff(v_event.team_id, v_caller) THEN
    RAISE EXCEPTION 'Not authorized to record participation for this athlete';
  END IF;

  PERFORM public.ensure_public_user_profile(p_user_id);

  IF p_attended AND COALESCE(p_games_played, 0) > 0 THEN
    -- explicit total minutes ▷ event's per-game format ▷ 40-min default
    v_minutes := COALESCE(p_total_minutes, p_games_played * COALESCE(v_event.minutes_per_game, v_minutes_per_game));
    v_rpe := COALESCE(p_avg_rpe, v_default_game_rpe);
    v_load := round(v_rpe * v_minutes);
  ELSE
    v_minutes := COALESCE(p_total_minutes, 0); v_rpe := p_avg_rpe; v_load := 0;
  END IF;

  SELECT training_session_id INTO v_old_session_id FROM public.event_participation
    WHERE user_id = p_user_id AND competition_event_id = p_competition_event_id;

  INSERT INTO public.event_participation (
    user_id, competition_event_id, team_id, attended, games_played, games_expected,
    total_minutes, avg_rpe, load_au, status, notes, recorded_by, recorded_at, updated_at
  ) VALUES (
    p_user_id, p_competition_event_id, v_event.team_id, p_attended, COALESCE(p_games_played, 0),
    v_event.expected_game_count, v_minutes, v_rpe, v_load, 'confirmed', p_notes, v_caller, now(), now()
  )
  ON CONFLICT (user_id, competition_event_id) DO UPDATE SET
    team_id = EXCLUDED.team_id, attended = EXCLUDED.attended, games_played = EXCLUDED.games_played,
    games_expected = EXCLUDED.games_expected, total_minutes = EXCLUDED.total_minutes,
    avg_rpe = EXCLUDED.avg_rpe, load_au = EXCLUDED.load_au, status = 'confirmed',
    notes = EXCLUDED.notes, recorded_by = EXCLUDED.recorded_by, recorded_at = now(), updated_at = now()
  RETURNING id INTO v_participation_id;

  -- Clear the prior session pointer (re-record / date change).
  IF v_old_session_id IS NOT NULL THEN
    DELETE FROM public.training_sessions WHERE id = v_old_session_id;
  END IF;

  IF v_load > 0 THEN
    DECLARE
      v_start date := v_event.starts_at::date;
      v_end date := COALESCE(v_event.ends_at::date, v_event.starts_at::date);
      v_days int := GREATEST(1, (v_end - v_start) + 1);
      v_day_load numeric := round(v_load / v_days);
      v_day_minutes int := GREATEST(1, round(v_minutes::numeric / v_days)::int);
      d date := v_start;
      v_first_id uuid := NULL;
      v_new_id uuid;
    BEGIN
      -- Distribute a multi-day tournament's load across its actual days so the
      -- daily-EWMA ACWR is correct (lumping the total on day 1 misreads the
      -- highest-load block). For each day, collapse any existing competition
      -- session for this athlete on that date first — that dedups the weekend
      -- self-report path (weekend-games) and any stale event session, so the two
      -- gameday paths can never double-count acute load.
      WHILE d <= v_end LOOP
        DELETE FROM public.training_sessions
          WHERE user_id = p_user_id AND session_type = 'competition' AND session_date = d;
        INSERT INTO public.training_sessions (
          user_id, team_id, session_date, session_type, duration_minutes, rpe, workload,
          notes, status, session_state, completed_at, updated_at
        ) VALUES (
          p_user_id, v_event.team_id, d, 'competition', v_day_minutes, v_rpe, v_day_load,
          'Competition: ' || COALESCE(v_event.label, 'event') ||
            CASE WHEN v_days > 1 THEN ' (day ' || ((d - v_start) + 1) || '/' || v_days || ')'
                 ELSE ' — ' || COALESCE(p_games_played, 0) || ' game(s)' END,
          'completed', 'COMPLETED', now(), now()
        ) RETURNING id INTO v_new_id;
        IF v_first_id IS NULL THEN v_first_id := v_new_id; END IF;
        d := d + 1;
      END LOOP;
      UPDATE public.event_participation SET training_session_id = v_first_id WHERE id = v_participation_id;
    END;
  ELSE
    UPDATE public.event_participation SET training_session_id = NULL WHERE id = v_participation_id;
  END IF;

  RETURN v_participation_id;
END;
$function$;
