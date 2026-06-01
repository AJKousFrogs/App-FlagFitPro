-- Restore player-facing save flows that depend on missing schema or restrictive
-- RLS in production. This covers player settings, profile/settings saves,
-- wellness reads, and roster-linked self-service updates.

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

-- ============================================================================
-- ATHLETE TRAINING CONFIG
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.athlete_training_config (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  primary_position text NOT NULL DEFAULT 'wr_db',
  secondary_position text,
  birth_date date,
  flag_practice_schedule jsonb NOT NULL DEFAULT '[]'::jsonb,
  preferred_training_days integer[] NOT NULL DEFAULT ARRAY[1, 2, 4, 5, 6],
  daily_routine jsonb NOT NULL DEFAULT '[]'::jsonb,
  max_sessions_per_week integer NOT NULL DEFAULT 5,
  has_gym_access boolean NOT NULL DEFAULT true,
  has_field_access boolean NOT NULL DEFAULT true,
  warmup_focus text,
  available_equipment jsonb NOT NULL DEFAULT '[]'::jsonb,
  current_limitations jsonb,
  age_recovery_modifier numeric NOT NULL DEFAULT 1.0,
  acwr_target_min numeric NOT NULL DEFAULT 0.8,
  acwr_target_max numeric NOT NULL DEFAULT 1.3,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT athlete_training_config_max_sessions_check
    CHECK (max_sessions_per_week BETWEEN 1 AND 14)
);

ALTER TABLE IF EXISTS public.athlete_training_config
  ADD COLUMN IF NOT EXISTS primary_position text NOT NULL DEFAULT 'wr_db',
  ADD COLUMN IF NOT EXISTS secondary_position text,
  ADD COLUMN IF NOT EXISTS birth_date date,
  ADD COLUMN IF NOT EXISTS flag_practice_schedule jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS preferred_training_days integer[] NOT NULL DEFAULT ARRAY[1, 2, 4, 5, 6],
  ADD COLUMN IF NOT EXISTS daily_routine jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS max_sessions_per_week integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS has_gym_access boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS has_field_access boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS warmup_focus text,
  ADD COLUMN IF NOT EXISTS available_equipment jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS current_limitations jsonb,
  ADD COLUMN IF NOT EXISTS age_recovery_modifier numeric NOT NULL DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS acwr_target_min numeric NOT NULL DEFAULT 0.8,
  ADD COLUMN IF NOT EXISTS acwr_target_max numeric NOT NULL DEFAULT 1.3,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_athlete_training_config_primary_position
  ON public.athlete_training_config (primary_position);

ALTER TABLE public.athlete_training_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own athlete training config" ON public.athlete_training_config;
CREATE POLICY "Users can view own athlete training config"
  ON public.athlete_training_config
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own athlete training config" ON public.athlete_training_config;
CREATE POLICY "Users can insert own athlete training config"
  ON public.athlete_training_config
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own athlete training config" ON public.athlete_training_config;
CREATE POLICY "Users can update own athlete training config"
  ON public.athlete_training_config
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP TRIGGER IF EXISTS athlete_training_config_set_updated_at ON public.athlete_training_config;
CREATE TRIGGER athlete_training_config_set_updated_at
BEFORE UPDATE ON public.athlete_training_config
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- TEAM PLAYERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.team_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  position text NOT NULL,
  jersey_number varchar(10),
  country text,
  age integer CHECK (age IS NULL OR age BETWEEN 0 AND 100),
  height text,
  weight text,
  email text,
  phone text,
  status text NOT NULL DEFAULT 'active',
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  stats jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT team_players_status_check
    CHECK (status IN ('active', 'injured', 'inactive', 'limited', 'returning', 'suspended'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_team_players_team_user_unique
  ON public.team_players (team_id, user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_team_players_team_id
  ON public.team_players (team_id);

CREATE INDEX IF NOT EXISTS idx_team_players_user_id
  ON public.team_players (user_id)
  WHERE user_id IS NOT NULL;

ALTER TABLE public.team_players ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Players can view own team player profile" ON public.team_players;
CREATE POLICY "Players can view own team player profile"
  ON public.team_players
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Players can insert own team player profile" ON public.team_players;
CREATE POLICY "Players can insert own team player profile"
  ON public.team_players
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.team_members tm
      WHERE tm.team_id = team_players.team_id
        AND tm.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Players can update own team player profile" ON public.team_players;
CREATE POLICY "Players can update own team player profile"
  ON public.team_players
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP TRIGGER IF EXISTS team_players_set_updated_at ON public.team_players;
CREATE TRIGGER team_players_set_updated_at
BEFORE UPDATE ON public.team_players
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- PLAYER SELF-SERVICE TEAM MEMBER UPDATES
-- ============================================================================

CREATE OR REPLACE FUNCTION public.ff_guard_self_team_member_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'authenticated'
     AND OLD.user_id = auth.uid()
     AND NOT EXISTS (
       SELECT 1
       FROM public.teams t
       WHERE t.id = OLD.team_id
         AND t.coach_id = auth.uid()
     ) THEN
    IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
      RAISE EXCEPTION 'Users cannot change team member ownership';
    END IF;

    IF NEW.team_id IS DISTINCT FROM OLD.team_id THEN
      RAISE EXCEPTION 'Users cannot change teams through direct membership updates';
    END IF;

    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Users cannot change their team role';
    END IF;

    IF NEW.status IS DISTINCT FROM OLD.status THEN
      RAISE EXCEPTION 'Users cannot change their team membership status';
    END IF;

    IF NEW.role_approval_status IS DISTINCT FROM OLD.role_approval_status
       OR NEW.role_approved_by IS DISTINCT FROM OLD.role_approved_by
       OR NEW.role_approved_at IS DISTINCT FROM OLD.role_approved_at
       OR COALESCE(NEW.role_rejection_reason, '') IS DISTINCT FROM COALESCE(OLD.role_rejection_reason, '') THEN
      RAISE EXCEPTION 'Users cannot change team approval fields';
    END IF;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "Players can update own membership profile fields" ON public.team_members;
CREATE POLICY "Players can update own membership profile fields"
  ON public.team_members
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Players can join approved teams" ON public.team_members;
CREATE POLICY "Players can join approved teams"
  ON public.team_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND role = 'player'
    AND status = 'active'
    AND COALESCE(role_approval_status, 'approved') IN ('pending_approval', 'approved')
    AND EXISTS (
      SELECT 1
      FROM public.teams t
      WHERE t.id = team_members.team_id
        AND COALESCE(t.approval_status, 'approved') = 'approved'
    )
  );

DROP POLICY IF EXISTS "Players can leave their own team" ON public.team_members;
CREATE POLICY "Players can leave their own team"
  ON public.team_members
  FOR DELETE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND role = 'player'
  );

DROP TRIGGER IF EXISTS team_members_guard_self_update ON public.team_members;
CREATE TRIGGER team_members_guard_self_update
BEFORE UPDATE ON public.team_members
FOR EACH ROW
EXECUTE FUNCTION public.ff_guard_self_team_member_update();

-- ============================================================================
-- USER SETTINGS + WELLNESS READ ACCESS
-- ============================================================================

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own user settings" ON public.user_settings;
CREATE POLICY "Users can view own user settings"
  ON public.user_settings
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own user settings" ON public.user_settings;
CREATE POLICY "Users can insert own user settings"
  ON public.user_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own user settings" ON public.user_settings;
CREATE POLICY "Users can update own user settings"
  ON public.user_settings
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

ALTER TABLE public.daily_wellness_checkin ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own wellness checkins" ON public.daily_wellness_checkin;
CREATE POLICY "Users can view own wellness checkins"
  ON public.daily_wellness_checkin
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- USERS POSITION CONSTRAINT
-- ============================================================================

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_position_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_position_check
  CHECK (
    position IS NULL
    OR char_length(btrim(position)) BETWEEN 1 AND 100
  );
