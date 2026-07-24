-- Per-game actuals for event_participation (docs/SOURCE_OF_TRUTH.md §4a/§4b,
-- 2026-07-24/25 — "event_participation.game_id not yet wired"). `game_id` has
-- existed on this table since the event_games migration (20260702120000) but
-- nothing has ever set it: record_event_participation only ever recorded ONE
-- aggregate row per (user, competition_event) — total games played across the
-- whole event, not which specific game(s). This makes per-game logging a real,
-- ADDITIVE capability: every existing call (game_id omitted) behaves
-- byte-for-byte identically to before.
--
-- Known, accepted limitation (not fixed here — a product framing choice, not a
-- bug): mixing BOTH the event-level aggregate form and the new per-game form
-- for the SAME event can have one overwrite the other's training_sessions row
-- for a shared date, since both re-derive-and-overwrite by session_date on
-- every call (the RPC's existing idempotent design, unchanged). The UI
-- presents per-game logging as an alternative to the aggregate quick-log for
-- a given event, not a simultaneous supplement, to keep this narrow.

-- The old single UNIQUE(user_id, competition_event_id) constraint can't permit
-- multiple per-game rows for the same event. Replace it with two partial
-- unique indexes: one preserving the EXACT existing dedup behavior for
-- event-level rows (game_id IS NULL), one new one for per-game rows.
ALTER TABLE public.event_participation
  DROP CONSTRAINT IF EXISTS event_participation_user_event_key;

CREATE UNIQUE INDEX IF NOT EXISTS event_participation_user_event_no_game_key
  ON public.event_participation (user_id, competition_event_id)
  WHERE game_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS event_participation_user_event_game_key
  ON public.event_participation (user_id, competition_event_id, game_id)
  WHERE game_id IS NOT NULL;

-- Replaced wholesale (not CREATE OR REPLACE with a changed signature — adding
-- a trailing DEFAULT-valued param would create a second overloaded function
-- instead of replacing this one, and PostgREST's named-parameter dispatch
-- could then resolve ambiguously between the two). Drop first so there is
-- exactly one `record_event_participation` after this migration.
DROP FUNCTION IF EXISTS public.record_event_participation(uuid, uuid, boolean, integer, integer, numeric, text);

CREATE FUNCTION public.record_event_participation(
  p_user_id uuid, p_competition_event_id uuid, p_attended boolean,
  p_games_played integer DEFAULT 0, p_total_minutes integer DEFAULT NULL::integer,
  p_avg_rpe numeric DEFAULT NULL::numeric, p_notes text DEFAULT NULL::text,
  p_game_id uuid DEFAULT NULL::uuid
)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  v_event public.competition_events%ROWTYPE;
  v_game public.event_games%ROWTYPE;
  v_minutes_per_game constant integer := 40;
  v_default_game_rpe constant numeric := 7;
  v_caller uuid := auth.uid();
  v_minutes integer; v_rpe numeric; v_load numeric;
  v_old_session_id uuid; v_participation_id uuid;
BEGIN
  SELECT * INTO v_event FROM public.competition_events WHERE id = p_competition_event_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'competition_event % not found', p_competition_event_id; END IF;

  IF p_game_id IS NOT NULL THEN
    SELECT * INTO v_game FROM public.event_games
      WHERE id = p_game_id AND competition_event_id = p_competition_event_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'game % not found on competition_event %', p_game_id, p_competition_event_id;
    END IF;
  END IF;

  IF auth.role() <> 'service_role'
     AND v_caller IS DISTINCT FROM p_user_id
     AND NOT public.ff_is_team_staff(v_event.team_id, v_caller) THEN
    RAISE EXCEPTION 'Not authorized to record participation for this athlete';
  END IF;

  PERFORM public.ensure_public_user_profile(p_user_id);

  IF p_attended AND COALESCE(p_games_played, 0) > 0 THEN
    -- explicit total minutes ▷ this specific game's own duration (per-game
    -- path only) ▷ event's per-game format ▷ 40-min default
    v_minutes := COALESCE(
      p_total_minutes,
      CASE WHEN p_game_id IS NOT NULL THEN v_game.expected_duration_minutes END,
      p_games_played * COALESCE(v_event.minutes_per_game, v_minutes_per_game)
    );
    v_rpe := COALESCE(p_avg_rpe, v_default_game_rpe);
    v_load := round(v_rpe * v_minutes);
  ELSE
    v_minutes := COALESCE(p_total_minutes, 0); v_rpe := p_avg_rpe; v_load := 0;
  END IF;

  -- ── Per-game path: one row per (user, game); one known session_date. ──
  IF p_game_id IS NOT NULL THEN
    SELECT training_session_id INTO v_old_session_id FROM public.event_participation
      WHERE user_id = p_user_id AND competition_event_id = p_competition_event_id AND game_id = p_game_id;

    INSERT INTO public.event_participation (
      user_id, competition_event_id, game_id, team_id, attended, games_played, games_expected,
      total_minutes, avg_rpe, load_au, status, notes, recorded_by, recorded_at, updated_at
    ) VALUES (
      p_user_id, p_competition_event_id, p_game_id, v_event.team_id, p_attended, COALESCE(p_games_played, 0),
      v_event.expected_game_count, v_minutes, v_rpe, v_load, 'confirmed', p_notes, v_caller, now(), now()
    )
    ON CONFLICT (user_id, competition_event_id, game_id) WHERE game_id IS NOT NULL DO UPDATE SET
      team_id = EXCLUDED.team_id, attended = EXCLUDED.attended, games_played = EXCLUDED.games_played,
      games_expected = EXCLUDED.games_expected, total_minutes = EXCLUDED.total_minutes,
      avg_rpe = EXCLUDED.avg_rpe, load_au = EXCLUDED.load_au, status = 'confirmed',
      notes = EXCLUDED.notes, recorded_by = EXCLUDED.recorded_by, recorded_at = now(), updated_at = now()
    RETURNING id INTO v_participation_id;

    IF v_old_session_id IS NOT NULL THEN
      DELETE FROM public.training_sessions WHERE id = v_old_session_id;
    END IF;

    -- A single game happens on ONE known date — no multi-day distribution
    -- (that only applies to the whole-event aggregate below). Dedup any
    -- existing competition session on that date first, same rule as the
    -- aggregate path, so the two paths can never double-count.
    DELETE FROM public.training_sessions
      WHERE user_id = p_user_id AND session_type = 'competition' AND session_date = v_game.game_date;

    IF v_load > 0 THEN
      DECLARE v_new_id uuid;
      BEGIN
        INSERT INTO public.training_sessions (
          user_id, team_id, session_date, session_type, duration_minutes, rpe, workload,
          notes, status, session_state, completed_at, updated_at
        ) VALUES (
          p_user_id, v_event.team_id, v_game.game_date, 'competition', v_minutes, v_rpe, v_load,
          'Competition: ' || COALESCE(v_event.label, 'event') || ' — Game ' || v_game.game_number ||
            COALESCE(' vs ' || v_game.opponent, ''),
          'completed', 'COMPLETED', now(), now()
        ) RETURNING id INTO v_new_id;
        UPDATE public.event_participation SET training_session_id = v_new_id WHERE id = v_participation_id;
      END;
    ELSE
      UPDATE public.event_participation SET training_session_id = NULL WHERE id = v_participation_id;
    END IF;

    RETURN v_participation_id;
  END IF;

  -- ── Event-level aggregate path (game_id IS NULL) — UNCHANGED behavior from
  -- the 2026-06-23 multi-day-distribution fix. ──
  SELECT training_session_id INTO v_old_session_id FROM public.event_participation
    WHERE user_id = p_user_id AND competition_event_id = p_competition_event_id AND game_id IS NULL;

  INSERT INTO public.event_participation (
    user_id, competition_event_id, team_id, attended, games_played, games_expected,
    total_minutes, avg_rpe, load_au, status, notes, recorded_by, recorded_at, updated_at
  ) VALUES (
    p_user_id, p_competition_event_id, v_event.team_id, p_attended, COALESCE(p_games_played, 0),
    v_event.expected_game_count, v_minutes, v_rpe, v_load, 'confirmed', p_notes, v_caller, now(), now()
  )
  ON CONFLICT (user_id, competition_event_id) WHERE game_id IS NULL DO UPDATE SET
    team_id = EXCLUDED.team_id, attended = EXCLUDED.attended, games_played = EXCLUDED.games_played,
    games_expected = EXCLUDED.games_expected, total_minutes = EXCLUDED.total_minutes,
    avg_rpe = EXCLUDED.avg_rpe, load_au = EXCLUDED.load_au, status = 'confirmed',
    notes = EXCLUDED.notes, recorded_by = EXCLUDED.recorded_by, recorded_at = now(), updated_at = now()
  RETURNING id INTO v_participation_id;

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

REVOKE EXECUTE ON FUNCTION public.record_event_participation(uuid,uuid,boolean,integer,integer,numeric,text,uuid) FROM anon;
