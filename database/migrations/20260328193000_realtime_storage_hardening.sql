-- Complete the migration of remaining local-first app data into Supabase and
-- harden the affected realtime/RLS surfaces.

-- ============================================================================
-- HYDRATION LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.hydration_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  context text NOT NULL,
  fluid_ml integer NOT NULL CHECK (fluid_ml > 0 AND fluid_ml <= 5000),
  fluid_type text NOT NULL CHECK (
    fluid_type IN (
      'water',
      'electrolyte',
      'sports-drink',
      'smoothie',
      'protein-shake',
      'coconut'
    )
  ),
  log_date date NOT NULL,
  log_time time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hydration_logs_user_context_date_time
  ON public.hydration_logs(user_id, context, log_date DESC, log_time DESC);

CREATE INDEX IF NOT EXISTS idx_hydration_logs_team_context_date
  ON public.hydration_logs(team_id, context, log_date DESC)
  WHERE team_id IS NOT NULL;

ALTER TABLE public.hydration_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS hydration_logs_own_select ON public.hydration_logs;
CREATE POLICY hydration_logs_own_select
  ON public.hydration_logs
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS hydration_logs_own_insert ON public.hydration_logs;
CREATE POLICY hydration_logs_own_insert
  ON public.hydration_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS hydration_logs_own_update ON public.hydration_logs;
CREATE POLICY hydration_logs_own_update
  ON public.hydration_logs
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS hydration_logs_own_delete ON public.hydration_logs;
CREATE POLICY hydration_logs_own_delete
  ON public.hydration_logs
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP TRIGGER IF EXISTS trigger_hydration_logs_updated_at ON public.hydration_logs;
CREATE TRIGGER trigger_hydration_logs_updated_at
  BEFORE UPDATE ON public.hydration_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- RLS HARDENING
-- ============================================================================

DROP POLICY IF EXISTS tournament_day_plans_own_select ON public.tournament_day_plans;
CREATE POLICY tournament_day_plans_own_select
  ON public.tournament_day_plans
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS tournament_day_plans_own_insert ON public.tournament_day_plans;
CREATE POLICY tournament_day_plans_own_insert
  ON public.tournament_day_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS tournament_day_plans_own_update ON public.tournament_day_plans;
CREATE POLICY tournament_day_plans_own_update
  ON public.tournament_day_plans
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS tournament_day_plans_own_delete ON public.tournament_day_plans;
CREATE POLICY tournament_day_plans_own_delete
  ON public.tournament_day_plans
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Team members can view playlists" ON public.video_playlists;
CREATE POLICY "Team members can view playlists"
  ON public.video_playlists
  FOR SELECT
  TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    OR (
      team_id IS NOT NULL
      AND public.ff_is_active_team_member(team_id, (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Coaches can manage playlists" ON public.video_playlists;
DROP POLICY IF EXISTS "Coaches can insert playlists" ON public.video_playlists;
CREATE POLICY "Coaches can insert playlists"
  ON public.video_playlists
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND team_id IS NOT NULL
    AND public.ff_is_team_staff(team_id, (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Coaches can update playlists" ON public.video_playlists;
CREATE POLICY "Coaches can update playlists"
  ON public.video_playlists
  FOR UPDATE
  TO authenticated
  USING (
    team_id IS NOT NULL
    AND public.ff_is_team_staff(team_id, (SELECT auth.uid()))
  )
  WITH CHECK (
    team_id IS NOT NULL
    AND public.ff_is_team_staff(team_id, (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Coaches can delete playlists" ON public.video_playlists;
CREATE POLICY "Coaches can delete playlists"
  ON public.video_playlists
  FOR DELETE
  TO authenticated
  USING (
    team_id IS NOT NULL
    AND public.ff_is_team_staff(team_id, (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Team coaches can manage video curation" ON public.video_curation_status;
CREATE POLICY "Team coaches can manage video curation"
  ON public.video_curation_status
  FOR ALL
  TO authenticated
  USING (
    team_id IS NOT NULL
    AND public.ff_is_team_staff(team_id, (SELECT auth.uid()))
  )
  WITH CHECK (
    team_id IS NOT NULL
    AND public.ff_is_team_staff(team_id, (SELECT auth.uid()))
  );

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_video_playlists_team_created_at
  ON public.video_playlists(team_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_video_curation_status_team_updated_at
  ON public.video_curation_status(team_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_coach_film_sessions_created_by
  ON public.coach_film_sessions(created_by);

CREATE INDEX IF NOT EXISTS idx_coach_film_tags_coach_id
  ON public.coach_film_tags(coach_id);

CREATE INDEX IF NOT EXISTS idx_coach_film_tags_play_id
  ON public.coach_film_tags(play_id);

CREATE INDEX IF NOT EXISTS idx_coach_film_tags_team_id
  ON public.coach_film_tags(team_id);

CREATE INDEX IF NOT EXISTS idx_coach_playbook_plays_created_by
  ON public.coach_playbook_plays(created_by);

CREATE INDEX IF NOT EXISTS idx_player_development_goals_player_id
  ON public.player_development_goals(player_id);

CREATE INDEX IF NOT EXISTS idx_player_development_goals_coach_id
  ON public.player_development_goals(coach_id);

CREATE INDEX IF NOT EXISTS idx_player_development_notes_player_id
  ON public.player_development_notes(player_id);

CREATE INDEX IF NOT EXISTS idx_player_development_notes_coach_id
  ON public.player_development_notes(coach_id);

CREATE INDEX IF NOT EXISTS idx_player_skill_assessments_player_id
  ON public.player_skill_assessments(player_id);

CREATE INDEX IF NOT EXISTS idx_player_skill_assessments_coach_id
  ON public.player_skill_assessments(coach_id);

-- ============================================================================
-- REALTIME PUBLICATION
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_publication
    WHERE pubname = 'supabase_realtime'
  ) THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_day_plans;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.hydration_logs;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.video_playlists;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;

    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.video_curation_status;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END IF;
END
$$;
