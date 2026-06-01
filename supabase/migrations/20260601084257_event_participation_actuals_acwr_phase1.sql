-- Consolidated participation model, Phase 1 (additive): the ACTUALS that feed ACWR.

CREATE TABLE public.event_participation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  competition_event_id uuid NOT NULL REFERENCES public.competition_events(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  attended boolean NOT NULL DEFAULT false,
  games_played integer NOT NULL DEFAULT 0 CHECK (games_played >= 0),
  games_expected integer,
  total_minutes integer CHECK (total_minutes IS NULL OR total_minutes >= 0),
  avg_rpe numeric CHECK (avg_rpe IS NULL OR (avg_rpe >= 0 AND avg_rpe <= 10)),
  load_au numeric,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending','confirmed')),
  notes text,
  training_session_id uuid REFERENCES public.training_sessions(id) ON DELETE SET NULL,
  recorded_by uuid,
  recorded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT event_participation_user_event_key UNIQUE (user_id, competition_event_id)
);
CREATE INDEX idx_event_participation_user ON public.event_participation(user_id);
CREATE INDEX idx_event_participation_event ON public.event_participation(competition_event_id);

ALTER TABLE public.event_participation ENABLE ROW LEVEL SECURITY;
CREATE POLICY event_participation_select ON public.event_participation FOR SELECT TO public
  USING (user_id = (SELECT auth.uid()) OR ff_is_team_staff(team_id, (SELECT auth.uid())));
CREATE POLICY event_participation_write ON public.event_participation FOR ALL TO public
  USING (user_id = (SELECT auth.uid()) OR ff_is_team_staff(team_id, (SELECT auth.uid())))
  WITH CHECK (user_id = (SELECT auth.uid()) OR ff_is_team_staff(team_id, (SELECT auth.uid())));

CREATE TRIGGER event_participation_updated_at BEFORE UPDATE ON public.event_participation
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.record_event_participation(
  p_user_id uuid, p_competition_event_id uuid, p_attended boolean,
  p_games_played integer DEFAULT 0, p_total_minutes integer DEFAULT NULL,
  p_avg_rpe numeric DEFAULT NULL, p_notes text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'auth'
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
    v_minutes := COALESCE(p_total_minutes, p_games_played * v_minutes_per_game);
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

REVOKE EXECUTE ON FUNCTION public.record_event_participation(uuid,uuid,boolean,integer,integer,numeric,text) FROM anon;

CREATE VIEW public.v_pending_event_participation
WITH (security_invoker = true) AS
SELECT ce.id AS competition_event_id, ce.team_id, t.name AS team_name,
       c.name AS competition_name, ce.label, ce.starts_at, ce.ends_at, ce.expected_game_count,
       tm.user_id
FROM public.competition_events ce
JOIN public.competitions c ON c.id = ce.competition_id
JOIN public.teams t ON t.id = ce.team_id
JOIN public.team_members tm ON tm.team_id = ce.team_id AND tm.status::text = 'active'
WHERE ce.ends_at < now()
  AND ce.ends_at > now() - interval '45 days'
  AND NOT EXISTS (
    SELECT 1 FROM public.event_participation ep
    WHERE ep.competition_event_id = ce.id AND ep.user_id = tm.user_id AND ep.status = 'confirmed'
  );

GRANT SELECT ON public.v_pending_event_participation TO anon, authenticated, service_role;
