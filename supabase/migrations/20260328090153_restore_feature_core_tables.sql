CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.ff_is_active_team_member(
  p_team_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.team_id = p_team_id
      AND tm.user_id = p_user_id
      AND tm.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.ff_is_team_staff(
  p_team_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.team_id = p_team_id
      AND tm.user_id = p_user_id
      AND tm.status = 'active'
      AND tm.role IN ('owner', 'admin', 'head_coach', 'coach', 'assistant_coach', 'manager')
  );
$$;

CREATE OR REPLACE FUNCTION public.ff_share_active_team(
  p_actor_user_id uuid,
  p_subject_user_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members actor_tm
    JOIN public.team_members subject_tm
      ON actor_tm.team_id = subject_tm.team_id
    WHERE actor_tm.user_id = p_actor_user_id
      AND subject_tm.user_id = p_subject_user_id
      AND actor_tm.status = 'active'
      AND subject_tm.status = 'active'
  );
$$;

GRANT EXECUTE ON FUNCTION public.ff_is_active_team_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ff_is_team_staff(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ff_share_active_team(uuid, uuid) TO authenticated;

CREATE TABLE IF NOT EXISTS public.tournaments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  short_name text,
  location text,
  country text,
  flag text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  tournament_type text NOT NULL DEFAULT 'championship',
  competition_level text NOT NULL DEFAULT 'regional',
  is_home_tournament boolean NOT NULL DEFAULT false,
  registration_deadline date,
  max_roster_size integer,
  format varchar(50),
  notes text,
  website_url text,
  venue text,
  expected_teams integer,
  prize_pool text,
  bracket_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  visibility_scope text NOT NULL DEFAULT 'team',
  player_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tournaments_dates_check CHECK (end_date >= start_date),
  CONSTRAINT tournaments_registration_deadline_check CHECK (
    registration_deadline IS NULL OR registration_deadline <= start_date
  ),
  CONSTRAINT tournaments_visibility_scope_check CHECK (
    visibility_scope IN ('team', 'personal')
  ),
  CONSTRAINT tournaments_expected_teams_check CHECK (
    expected_teams IS NULL OR expected_teams > 0
  ),
  CONSTRAINT tournaments_max_roster_size_check CHECK (
    max_roster_size IS NULL OR max_roster_size > 0
  ),
  CONSTRAINT tournaments_personal_owner_check CHECK (
    (visibility_scope = 'team' AND player_id IS NULL)
    OR (visibility_scope = 'personal' AND player_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_tournaments_team_id ON public.tournaments (team_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_start_date ON public.tournaments (start_date);
CREATE INDEX IF NOT EXISTS idx_tournaments_team_start_date ON public.tournaments (team_id, start_date);
CREATE INDEX IF NOT EXISTS idx_tournaments_player_id ON public.tournaments (player_id);

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tournaments_select ON public.tournaments;
CREATE POLICY tournaments_select
  ON public.tournaments
  FOR SELECT
  TO authenticated
  USING (
    public.ff_is_active_team_member(team_id, (SELECT auth.uid()))
    AND (
      visibility_scope = 'team'
      OR player_id = (SELECT auth.uid())
      OR public.ff_is_team_staff(team_id, (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS tournaments_insert ON public.tournaments;
CREATE POLICY tournaments_insert
  ON public.tournaments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND public.ff_is_active_team_member(team_id, (SELECT auth.uid()))
    AND (
      (visibility_scope = 'team' AND player_id IS NULL AND public.ff_is_team_staff(team_id, (SELECT auth.uid())))
      OR (
        visibility_scope = 'personal'
        AND player_id IS NOT NULL
        AND (
          player_id = (SELECT auth.uid())
          OR public.ff_is_team_staff(team_id, (SELECT auth.uid()))
        )
      )
    )
  );

DROP POLICY IF EXISTS tournaments_update ON public.tournaments;
CREATE POLICY tournaments_update
  ON public.tournaments
  FOR UPDATE
  TO authenticated
  USING (
    public.ff_is_active_team_member(team_id, (SELECT auth.uid()))
    AND (
      public.ff_is_team_staff(team_id, (SELECT auth.uid()))
      OR player_id = (SELECT auth.uid())
      OR created_by = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    public.ff_is_active_team_member(team_id, (SELECT auth.uid()))
    AND (
      public.ff_is_team_staff(team_id, (SELECT auth.uid()))
      OR (
        visibility_scope = 'personal'
        AND player_id = (SELECT auth.uid())
        AND created_by = (SELECT auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS tournaments_delete ON public.tournaments;
CREATE POLICY tournaments_delete
  ON public.tournaments
  FOR DELETE
  TO authenticated
  USING (
    public.ff_is_active_team_member(team_id, (SELECT auth.uid()))
    AND (
      public.ff_is_team_staff(team_id, (SELECT auth.uid()))
      OR (
        visibility_scope = 'personal'
        AND player_id = (SELECT auth.uid())
        AND created_by = (SELECT auth.uid())
      )
    )
  );

DROP TRIGGER IF EXISTS tournaments_set_updated_at ON public.tournaments;
CREATE TRIGGER tournaments_set_updated_at
BEFORE UPDATE ON public.tournaments
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.performance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sprint_10m numeric,
  sprint_20m numeric,
  dash_40 numeric,
  pro_agility numeric,
  l_drill numeric,
  reactive_agility numeric,
  vertical_jump numeric,
  broad_jump numeric,
  rsi numeric,
  bench_press numeric,
  back_squat numeric,
  deadlift numeric,
  body_weight numeric,
  notes text,
  overall_score numeric,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_performance_records_user_recorded_at ON public.performance_records (user_id, recorded_at DESC);

ALTER TABLE public.performance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS performance_records_select ON public.performance_records;
CREATE POLICY performance_records_select
  ON public.performance_records
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR public.ff_share_active_team((SELECT auth.uid()), user_id)
  );

DROP POLICY IF EXISTS performance_records_manage_own ON public.performance_records;
CREATE POLICY performance_records_manage_own
  ON public.performance_records
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP TRIGGER IF EXISTS performance_records_set_updated_at ON public.performance_records;
CREATE TRIGGER performance_records_set_updated_at
BEFORE UPDATE ON public.performance_records
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.game_participations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id varchar NOT NULL REFERENCES public.games(game_id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status varchar NOT NULL DEFAULT 'scheduled',
  position varchar,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT game_participations_status_check CHECK (
    status IN ('scheduled', 'played', 'missed', 'injured', 'excused')
  ),
  CONSTRAINT game_participations_game_player_key UNIQUE (game_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_game_participations_player_id ON public.game_participations (player_id);
CREATE INDEX IF NOT EXISTS idx_game_participations_team_id ON public.game_participations (team_id);

ALTER TABLE public.game_participations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS game_participations_select ON public.game_participations;
CREATE POLICY game_participations_select
  ON public.game_participations
  FOR SELECT
  TO authenticated
  USING (
    player_id = (SELECT auth.uid())
    OR public.ff_is_team_staff(team_id, (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS game_participations_insert ON public.game_participations;
CREATE POLICY game_participations_insert
  ON public.game_participations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    player_id = (SELECT auth.uid())
    OR public.ff_is_team_staff(team_id, (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS game_participations_update ON public.game_participations;
CREATE POLICY game_participations_update
  ON public.game_participations
  FOR UPDATE
  TO authenticated
  USING (
    player_id = (SELECT auth.uid())
    OR public.ff_is_team_staff(team_id, (SELECT auth.uid()))
  )
  WITH CHECK (
    player_id = (SELECT auth.uid())
    OR public.ff_is_team_staff(team_id, (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS game_participations_delete ON public.game_participations;
CREATE POLICY game_participations_delete
  ON public.game_participations
  FOR DELETE
  TO authenticated
  USING (
    player_id = (SELECT auth.uid())
    OR public.ff_is_team_staff(team_id, (SELECT auth.uid()))
  );

DROP TRIGGER IF EXISTS game_participations_set_updated_at ON public.game_participations;
CREATE TRIGGER game_participations_set_updated_at
BEFORE UPDATE ON public.game_participations
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
