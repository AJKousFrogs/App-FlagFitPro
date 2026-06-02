-- Game FORMAT drives competition load. The flat 40-min/game assumption mis-scores
-- 2x12 (24 min) and 2x40 World-champs (80 min) formats. Capture per-game minutes on
-- the event and use it: load = avg_rpe × (games × minutes_per_game).
-- Applied via Supabase MCP (schema_migrations version 20260602231535); mirrored here.
ALTER TABLE public.competition_events
  ADD COLUMN IF NOT EXISTS minutes_per_game integer,
  ADD COLUMN IF NOT EXISTS game_format varchar(20);

COMMENT ON COLUMN public.competition_events.minutes_per_game IS
  'Per-game playing minutes for this event (24 = 2x12, 40 = 2x20, 80 = 2x40). NULL → engine falls back to 40. Drives competition load = avg_rpe × games × minutes_per_game.';
COMMENT ON COLUMN public.competition_events.game_format IS
  'Human-readable format label, e.g. "2x12", "2x20", "2x40".';

-- Recreate the load RPC: prefer an explicit total, else the event's per-game minutes,
-- else the 40-min default. Only the v_minutes math line changes.
CREATE OR REPLACE FUNCTION public.record_event_participation(
  p_user_id uuid, p_competition_event_id uuid, p_attended boolean,
  p_games_played integer DEFAULT 0, p_total_minutes integer DEFAULT NULL::integer,
  p_avg_rpe numeric DEFAULT NULL::numeric, p_notes text DEFAULT NULL::text)
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
  v_old_session_id uuid; v_session_id uuid; v_participation_id uuid;
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

  IF v_old_session_id IS NOT NULL THEN
    DELETE FROM public.training_sessions WHERE id = v_old_session_id;
  END IF;

  IF v_load > 0 THEN
    INSERT INTO public.training_sessions (
      user_id, team_id, session_date, session_type, duration_minutes, rpe, workload,
      notes, status, session_state, completed_at, updated_at
    ) VALUES (
      p_user_id, v_event.team_id, v_event.starts_at::date, 'competition', v_minutes, v_rpe, v_load,
      'Competition: ' || COALESCE(v_event.label, 'event') || ' — ' || p_games_played || ' game(s)',
      'completed', 'COMPLETED', now(), now()
    ) RETURNING id INTO v_session_id;
    UPDATE public.event_participation SET training_session_id = v_session_id WHERE id = v_participation_id;
  ELSE
    UPDATE public.event_participation SET training_session_id = NULL WHERE id = v_participation_id;
  END IF;

  RETURN v_participation_id;
END;
$function$;
