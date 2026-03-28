-- Reconcile missing feature schema required by the deployed Angular app and
-- Netlify functions. This migration restores the missing tables/RPCs and
-- bridges the legacy and modern chat message shapes.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- SHARED HELPERS
-- ============================================================================

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

-- ============================================================================
-- TOURNAMENTS
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_tournaments_team_id
  ON public.tournaments (team_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_start_date
  ON public.tournaments (start_date);
CREATE INDEX IF NOT EXISTS idx_tournaments_team_start_date
  ON public.tournaments (team_id, start_date);
CREATE INDEX IF NOT EXISTS idx_tournaments_player_id
  ON public.tournaments (player_id);

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

-- ============================================================================
-- PERFORMANCE TRACKING
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_performance_records_user_recorded_at
  ON public.performance_records (user_id, recorded_at DESC);

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

-- ============================================================================
-- GAME PARTICIPATIONS
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_game_participations_player_id
  ON public.game_participations (player_id);
CREATE INDEX IF NOT EXISTS idx_game_participations_team_id
  ON public.game_participations (team_id);

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

-- ============================================================================
-- CHAT CHANNELS AND MEMBERSHIP
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  name varchar(100) NOT NULL,
  description text,
  channel_type text NOT NULL DEFAULT 'team_general',
  position_filter varchar(50),
  game_id varchar REFERENCES public.games(game_id) ON DELETE CASCADE,
  is_group_dm boolean NOT NULL DEFAULT false,
  is_archived boolean NOT NULL DEFAULT false,
  is_default boolean NOT NULL DEFAULT false,
  allow_threads boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT channels_type_check CHECK (
    channel_type IN (
      'announcements',
      'team_general',
      'coaches_only',
      'position_group',
      'game_day',
      'direct_message'
    )
  ),
  CONSTRAINT channels_team_name_key UNIQUE (team_id, name)
);

CREATE INDEX IF NOT EXISTS idx_channels_team_id
  ON public.channels (team_id);
CREATE INDEX IF NOT EXISTS idx_channels_type
  ON public.channels (channel_type);
CREATE INDEX IF NOT EXISTS idx_channels_game_id
  ON public.channels (game_id);

CREATE TABLE IF NOT EXISTS public.channel_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  can_post boolean NOT NULL DEFAULT true,
  is_admin boolean NOT NULL DEFAULT false,
  is_muted boolean NOT NULL DEFAULT false,
  last_read_at timestamptz,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (channel_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_channel_members_channel_id
  ON public.channel_members (channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_user_id
  ON public.channel_members (user_id);

INSERT INTO public.channels (team_id, name, description, channel_type, is_default, created_by)
SELECT
  t.id,
  'Announcements',
  'Team-wide announcements and updates.',
  'announcements',
  true,
  t.coach_id
FROM public.teams t
WHERE NOT EXISTS (
  SELECT 1
  FROM public.channels c
  WHERE c.team_id = t.id
    AND c.channel_type = 'announcements'
);

INSERT INTO public.channels (team_id, name, description, channel_type, is_default, created_by)
SELECT
  t.id,
  'Team Chat',
  'General team communication.',
  'team_general',
  true,
  t.coach_id
FROM public.teams t
WHERE NOT EXISTS (
  SELECT 1
  FROM public.channels c
  WHERE c.team_id = t.id
    AND c.channel_type = 'team_general'
);

INSERT INTO public.channels (team_id, name, description, channel_type, is_default, created_by)
SELECT
  t.id,
  'Coaches',
  'Private staff coordination channel.',
  'coaches_only',
  true,
  t.coach_id
FROM public.teams t
WHERE NOT EXISTS (
  SELECT 1
  FROM public.channels c
  WHERE c.team_id = t.id
    AND c.channel_type = 'coaches_only'
);

CREATE OR REPLACE FUNCTION public.ff_can_access_channel(
  p_channel_id uuid,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_channel public.channels%ROWTYPE;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT *
  INTO v_channel
  FROM public.channels
  WHERE id = p_channel_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_channel.channel_type = 'direct_message' THEN
    RETURN EXISTS (
      SELECT 1
      FROM public.channel_members cm
      WHERE cm.channel_id = p_channel_id
        AND cm.user_id = p_user_id
    );
  END IF;

  IF NOT public.ff_is_active_team_member(v_channel.team_id, p_user_id) THEN
    RETURN false;
  END IF;

  IF v_channel.channel_type = 'coaches_only' THEN
    RETURN public.ff_is_team_staff(v_channel.team_id, p_user_id);
  END IF;

  IF v_channel.channel_type = 'position_group' THEN
    RETURN public.ff_is_team_staff(v_channel.team_id, p_user_id)
      OR EXISTS (
        SELECT 1
        FROM public.team_members tm
        WHERE tm.team_id = v_channel.team_id
          AND tm.user_id = p_user_id
          AND tm.status = 'active'
          AND (
            tm.position = v_channel.position_filter
            OR v_channel.position_filter = ANY (coalesce(tm.positions, '{}'::text[]))
          )
      );
  END IF;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.ff_can_manage_channel(
  p_channel_id uuid,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_channel public.channels%ROWTYPE;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT *
  INTO v_channel
  FROM public.channels
  WHERE id = p_channel_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF v_channel.channel_type = 'direct_message' THEN
    RETURN v_channel.created_by = p_user_id;
  END IF;

  RETURN public.ff_is_team_staff(v_channel.team_id, p_user_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.ff_can_post_to_channel(
  p_channel_id uuid,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_channel public.channels%ROWTYPE;
  v_member public.channel_members%ROWTYPE;
BEGIN
  IF NOT public.ff_can_access_channel(p_channel_id, p_user_id) THEN
    RETURN false;
  END IF;

  SELECT *
  INTO v_channel
  FROM public.channels
  WHERE id = p_channel_id;

  IF v_channel.channel_type IN ('announcements', 'coaches_only') THEN
    RETURN public.ff_is_team_staff(v_channel.team_id, p_user_id);
  END IF;

  SELECT *
  INTO v_member
  FROM public.channel_members
  WHERE channel_id = p_channel_id
    AND user_id = p_user_id;

  IF FOUND AND (NOT coalesce(v_member.can_post, true) OR coalesce(v_member.is_muted, false)) THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ff_can_access_channel(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ff_can_manage_channel(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ff_can_post_to_channel(uuid, uuid) TO authenticated;

ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS channels_select ON public.channels;
CREATE POLICY channels_select
  ON public.channels
  FOR SELECT
  TO authenticated
  USING (public.ff_can_access_channel(id, (SELECT auth.uid())));

DROP POLICY IF EXISTS channels_insert ON public.channels;
CREATE POLICY channels_insert
  ON public.channels
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND (
      (channel_type = 'direct_message' AND public.ff_is_active_team_member(team_id, (SELECT auth.uid())))
      OR (
        channel_type <> 'direct_message'
        AND public.ff_is_team_staff(team_id, (SELECT auth.uid()))
      )
    )
  );

DROP POLICY IF EXISTS channels_update ON public.channels;
CREATE POLICY channels_update
  ON public.channels
  FOR UPDATE
  TO authenticated
  USING (public.ff_can_manage_channel(id, (SELECT auth.uid())))
  WITH CHECK (public.ff_can_manage_channel(id, (SELECT auth.uid())));

DROP POLICY IF EXISTS channels_delete ON public.channels;
CREATE POLICY channels_delete
  ON public.channels
  FOR DELETE
  TO authenticated
  USING (public.ff_can_manage_channel(id, (SELECT auth.uid())));

DROP POLICY IF EXISTS channel_members_select ON public.channel_members;
CREATE POLICY channel_members_select
  ON public.channel_members
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR public.ff_can_access_channel(channel_id, (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS channel_members_insert ON public.channel_members;
CREATE POLICY channel_members_insert
  ON public.channel_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (user_id = (SELECT auth.uid()) AND public.ff_can_access_channel(channel_id, (SELECT auth.uid())))
    OR public.ff_can_manage_channel(channel_id, (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS channel_members_update ON public.channel_members;
CREATE POLICY channel_members_update
  ON public.channel_members
  FOR UPDATE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR public.ff_can_manage_channel(channel_id, (SELECT auth.uid()))
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    OR public.ff_can_manage_channel(channel_id, (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS channel_members_delete ON public.channel_members;
CREATE POLICY channel_members_delete
  ON public.channel_members
  FOR DELETE
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR public.ff_can_manage_channel(channel_id, (SELECT auth.uid()))
  );

DROP TRIGGER IF EXISTS channels_set_updated_at ON public.channels;
CREATE TRIGGER channels_set_updated_at
BEFORE UPDATE ON public.channels
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- CHAT MESSAGES COMPATIBILITY
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  recipient_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  channel_id uuid REFERENCES public.channels(id) ON DELETE CASCADE,
  channel text,
  message text NOT NULL,
  message_type text NOT NULL DEFAULT 'text',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  mentions uuid[] NOT NULL DEFAULT '{}'::uuid[],
  reply_to uuid REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  thread_id uuid REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  reply_count integer NOT NULL DEFAULT 0,
  is_edited boolean NOT NULL DEFAULT false,
  is_pinned boolean NOT NULL DEFAULT false,
  pinned_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  pinned_at timestamptz,
  is_important boolean NOT NULL DEFAULT false,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS sender_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recipient_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS channel_id uuid REFERENCES public.channels(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS mentions uuid[] NOT NULL DEFAULT '{}'::uuid[],
  ADD COLUMN IF NOT EXISTS thread_id uuid REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reply_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pinned_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pinned_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_important boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_read boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS read_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_id
  ON public.chat_messages (channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel
  ON public.chat_messages (channel);
CREATE INDEX IF NOT EXISTS idx_chat_messages_team_id
  ON public.chat_messages (team_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at
  ON public.chat_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_id
  ON public.chat_messages (thread_id);

CREATE OR REPLACE FUNCTION public.sync_chat_message_compat_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team_id uuid;
  v_channel_id uuid;
BEGIN
  IF NEW.user_id IS NULL AND NEW.sender_id IS NOT NULL THEN
    NEW.user_id := NEW.sender_id;
  END IF;

  IF NEW.sender_id IS NULL AND NEW.user_id IS NOT NULL THEN
    NEW.sender_id := NEW.user_id;
  END IF;

  IF NEW.reply_to IS NULL AND NEW.thread_id IS NOT NULL THEN
    NEW.reply_to := NEW.thread_id;
  END IF;

  IF NEW.thread_id IS NULL AND NEW.reply_to IS NOT NULL THEN
    NEW.thread_id := NEW.reply_to;
  END IF;

  IF NEW.channel_id IS NULL
     AND NEW.channel IS NOT NULL
     AND NEW.channel ~ '^channel-[0-9a-fA-F-]{36}$' THEN
    NEW.channel_id := substring(NEW.channel FROM 9)::uuid;
  END IF;

  IF NEW.channel_id IS NULL
     AND NEW.channel IS NOT NULL
     AND NEW.channel ~ '^team_[0-9a-fA-F-]{36}$' THEN
    v_team_id := substring(NEW.channel FROM 6)::uuid;
    SELECT c.id
    INTO v_channel_id
    FROM public.channels c
    WHERE c.team_id = v_team_id
      AND c.channel_type = 'team_general'
    ORDER BY c.created_at ASC
    LIMIT 1;

    NEW.team_id := coalesce(NEW.team_id, v_team_id);
    NEW.channel_id := coalesce(NEW.channel_id, v_channel_id);
  END IF;

  IF NEW.channel_id IS NOT NULL AND NEW.team_id IS NULL THEN
    SELECT c.team_id
    INTO NEW.team_id
    FROM public.channels c
    WHERE c.id = NEW.channel_id;
  END IF;

  IF NEW.channel IS NULL AND NEW.channel_id IS NOT NULL THEN
    NEW.channel := concat('channel-', NEW.channel_id::text);
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

UPDATE public.chat_messages
SET
  sender_id = coalesce(sender_id, user_id),
  user_id = coalesce(user_id, sender_id),
  reply_to = coalesce(reply_to, thread_id),
  thread_id = coalesce(thread_id, reply_to),
  attachments = coalesce(attachments, '[]'::jsonb),
  metadata = coalesce(metadata, '{}'::jsonb),
  mentions = coalesce(mentions, '{}'::uuid[]);

DROP TRIGGER IF EXISTS sync_chat_message_compat_fields ON public.chat_messages;
CREATE TRIGGER sync_chat_message_compat_fields
BEFORE INSERT OR UPDATE ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.sync_chat_message_compat_fields();

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chat_messages_select ON public.chat_messages;
CREATE POLICY chat_messages_select
  ON public.chat_messages
  FOR SELECT
  TO authenticated
  USING (
    (channel_id IS NOT NULL AND public.ff_can_access_channel(channel_id, (SELECT auth.uid())))
    OR user_id = (SELECT auth.uid())
    OR sender_id = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS chat_messages_insert ON public.chat_messages;
CREATE POLICY chat_messages_insert
  ON public.chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    coalesce(sender_id, user_id) = (SELECT auth.uid())
    AND (
      (channel_id IS NOT NULL AND public.ff_can_post_to_channel(channel_id, (SELECT auth.uid())))
      OR (
        channel_id IS NULL
        AND team_id IS NOT NULL
        AND public.ff_is_active_team_member(team_id, (SELECT auth.uid()))
      )
    )
  );

DROP POLICY IF EXISTS chat_messages_update ON public.chat_messages;
CREATE POLICY chat_messages_update
  ON public.chat_messages
  FOR UPDATE
  TO authenticated
  USING (
    coalesce(sender_id, user_id) = (SELECT auth.uid())
    OR (channel_id IS NOT NULL AND public.ff_can_manage_channel(channel_id, (SELECT auth.uid())))
  )
  WITH CHECK (
    coalesce(sender_id, user_id) = (SELECT auth.uid())
    OR (channel_id IS NOT NULL AND public.ff_can_manage_channel(channel_id, (SELECT auth.uid())))
  );

DROP POLICY IF EXISTS chat_messages_delete ON public.chat_messages;
CREATE POLICY chat_messages_delete
  ON public.chat_messages
  FOR DELETE
  TO authenticated
  USING (
    coalesce(sender_id, user_id) = (SELECT auth.uid())
    OR (channel_id IS NOT NULL AND public.ff_can_manage_channel(channel_id, (SELECT auth.uid())))
  );

CREATE OR REPLACE FUNCTION public.increment_reply_count(message_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
  v_channel_id uuid;
BEGIN
  SELECT channel_id
  INTO v_channel_id
  FROM public.chat_messages
  WHERE id = message_id;

  IF v_channel_id IS NULL OR NOT public.ff_can_access_channel(v_channel_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized to update reply count';
  END IF;

  UPDATE public.chat_messages
  SET reply_count = coalesce(reply_count, 0) + 1
  WHERE id = message_id
  RETURNING reply_count INTO v_count;

  RETURN coalesce(v_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_reply_count(uuid) TO authenticated;

-- ============================================================================
-- READ RECEIPTS, ANNOUNCEMENTS, ACTIVITY
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.message_read_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.announcement_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  acknowledged boolean NOT NULL DEFAULT false,
  acknowledged_at timestamptz,
  UNIQUE (message_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.coach_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  activity_type varchar(50) NOT NULL,
  title varchar(255) NOT NULL,
  description text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coach_activity_log_team_id
  ON public.coach_activity_log (team_id, created_at DESC);

ALTER TABLE public.message_read_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS message_read_receipts_select ON public.message_read_receipts;
CREATE POLICY message_read_receipts_select
  ON public.message_read_receipts
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.chat_messages message
      WHERE message.id = message_id
        AND public.ff_can_access_channel(message.channel_id, (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS message_read_receipts_insert ON public.message_read_receipts;
CREATE POLICY message_read_receipts_insert
  ON public.message_read_receipts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.chat_messages message
      WHERE message.id = message_id
        AND public.ff_can_access_channel(message.channel_id, (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS message_read_receipts_update ON public.message_read_receipts;
CREATE POLICY message_read_receipts_update
  ON public.message_read_receipts
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS announcement_reads_select ON public.announcement_reads;
CREATE POLICY announcement_reads_select
  ON public.announcement_reads
  FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.chat_messages message
      WHERE message.id = message_id
        AND public.ff_can_access_channel(message.channel_id, (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS announcement_reads_insert ON public.announcement_reads;
CREATE POLICY announcement_reads_insert
  ON public.announcement_reads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.chat_messages message
      WHERE message.id = message_id
        AND public.ff_can_access_channel(message.channel_id, (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS announcement_reads_update ON public.announcement_reads;
CREATE POLICY announcement_reads_update
  ON public.announcement_reads
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS coach_activity_log_select ON public.coach_activity_log;
CREATE POLICY coach_activity_log_select
  ON public.coach_activity_log
  FOR SELECT
  TO authenticated
  USING (public.ff_is_team_staff(team_id, (SELECT auth.uid())));

DROP POLICY IF EXISTS coach_activity_log_update ON public.coach_activity_log;
CREATE POLICY coach_activity_log_update
  ON public.coach_activity_log
  FOR UPDATE
  TO authenticated
  USING (public.ff_is_team_staff(team_id, (SELECT auth.uid())))
  WITH CHECK (public.ff_is_team_staff(team_id, (SELECT auth.uid())));

DROP TRIGGER IF EXISTS coach_activity_log_set_updated_at ON public.coach_activity_log;
CREATE TRIGGER coach_activity_log_set_updated_at
BEFORE UPDATE ON public.coach_activity_log
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.get_channel_members(p_channel_id uuid)
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  avatar_url text,
  role text,
  "position" text,
  jersey_number integer,
  is_explicit_member boolean,
  can_post boolean,
  joined_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH channel_ctx AS (
    SELECT c.*
    FROM public.channels c
    WHERE c.id = p_channel_id
      AND public.ff_can_access_channel(c.id, auth.uid())
  ),
  explicit_members AS (
    SELECT
      cm.user_id,
      cm.can_post,
      cm.joined_at,
      true AS is_explicit_member
    FROM public.channel_members cm
    JOIN channel_ctx ctx ON ctx.id = cm.channel_id
  ),
  team_visible_members AS (
    SELECT
      tm.user_id,
      true AS can_post,
      tm.joined_at,
      false AS is_explicit_member
    FROM public.team_members tm
    JOIN channel_ctx ctx ON ctx.team_id = tm.team_id
    WHERE tm.status = 'active'
      AND ctx.channel_type <> 'direct_message'
      AND (
        ctx.channel_type NOT IN ('coaches_only', 'position_group')
        OR (
          ctx.channel_type = 'coaches_only'
          AND tm.role IN ('owner', 'admin', 'head_coach', 'coach', 'assistant_coach', 'manager')
        )
        OR (
          ctx.channel_type = 'position_group'
          AND (
            tm.role IN ('owner', 'admin', 'head_coach', 'coach', 'assistant_coach', 'manager')
            OR tm.position = ctx.position_filter
            OR ctx.position_filter = ANY (coalesce(tm.positions, '{}'::text[]))
          )
        )
      )
  ),
  visible_members AS (
    SELECT *
    FROM explicit_members
    UNION ALL
    SELECT team_member.*
    FROM team_visible_members team_member
    WHERE NOT EXISTS (
      SELECT 1
      FROM explicit_members explicit_member
      WHERE explicit_member.user_id = team_member.user_id
    )
  )
  SELECT
    member.user_id,
    user_record.email,
    coalesce(
      nullif(trim(user_record.full_name), ''),
      nullif(trim(user_record.name), ''),
      nullif(trim(concat_ws(' ', user_record.first_name, user_record.last_name)), ''),
      user_record.email
    ) AS full_name,
    coalesce(
      nullif(trim(user_record.profile_photo_url), ''),
      nullif(trim(user_record.avatar_url), '')
    ) AS avatar_url,
    coalesce(team_member.role, 'member') AS role,
    team_member.position AS "position",
    team_member.jersey_number,
    member.is_explicit_member,
    coalesce(channel_member.can_post, member.can_post, true) AS can_post,
    coalesce(channel_member.joined_at, member.joined_at, team_member.joined_at, now()) AS joined_at
  FROM visible_members member
  LEFT JOIN channel_ctx ctx ON true
  LEFT JOIN public.users user_record
    ON user_record.id = member.user_id
  LEFT JOIN public.team_members team_member
    ON team_member.user_id = member.user_id
   AND team_member.team_id = ctx.team_id
   AND team_member.status = 'active'
  LEFT JOIN public.channel_members channel_member
    ON channel_member.channel_id = p_channel_id
   AND channel_member.user_id = member.user_id
  ORDER BY
    CASE
      WHEN coalesce(team_member.role, '') IN ('owner', 'admin', 'head_coach', 'coach', 'assistant_coach', 'manager') THEN 0
      ELSE 1
    END,
    coalesce(
      nullif(trim(user_record.full_name), ''),
      nullif(trim(user_record.name), ''),
      user_record.email,
      member.user_id::text
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_channel_members(uuid) TO authenticated;

-- ============================================================================
-- DAILY PROTOCOL GENERATION STATE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.protocol_generation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  protocol_date date NOT NULL,
  idempotency_key text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  protocol_id uuid REFERENCES public.daily_protocols(id) ON DELETE SET NULL,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT protocol_generation_requests_status_check CHECK (
    status IN ('pending', 'completed', 'failed')
  ),
  CONSTRAINT protocol_generation_requests_unique_key UNIQUE (
    user_id,
    protocol_date,
    idempotency_key
  )
);

CREATE INDEX IF NOT EXISTS idx_protocol_generation_requests_status
  ON public.protocol_generation_requests (user_id, protocol_date, status);

ALTER TABLE public.protocol_generation_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS protocol_generation_requests_select ON public.protocol_generation_requests;
CREATE POLICY protocol_generation_requests_select
  ON public.protocol_generation_requests
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS protocol_generation_requests_insert ON public.protocol_generation_requests;
CREATE POLICY protocol_generation_requests_insert
  ON public.protocol_generation_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS protocol_generation_requests_update ON public.protocol_generation_requests;
CREATE POLICY protocol_generation_requests_update
  ON public.protocol_generation_requests
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP TRIGGER IF EXISTS protocol_generation_requests_set_updated_at ON public.protocol_generation_requests;
CREATE TRIGGER protocol_generation_requests_set_updated_at
BEFORE UPDATE ON public.protocol_generation_requests
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.generate_protocol_transactional(
  p_user_id uuid,
  p_protocol_date date,
  p_readiness_score integer,
  p_acwr_value numeric,
  p_training_focus text,
  p_ai_rationale text,
  p_total_load_target_au integer,
  p_confidence_metadata jsonb,
  p_exercises jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_protocol_id uuid;
  v_now timestamptz := now();
BEGIN
  IF coalesce(jsonb_array_length(p_exercises), 0) = 0 THEN
    RAISE EXCEPTION 'Cannot persist a protocol without exercises';
  END IF;

  INSERT INTO public.daily_protocols (
    user_id,
    protocol_date,
    readiness_score,
    acwr_value,
    training_focus,
    ai_rationale,
    total_load_target_au,
    confidence_metadata,
    total_exercises,
    completed_exercises,
    overall_progress,
    generated_at,
    updated_at
  )
  VALUES (
    p_user_id,
    p_protocol_date,
    p_readiness_score,
    p_acwr_value,
    p_training_focus,
    p_ai_rationale,
    p_total_load_target_au,
    coalesce(p_confidence_metadata, '{}'::jsonb),
    (
      SELECT count(*)
      FROM jsonb_to_recordset(p_exercises) AS exercise(exercise_id uuid)
      WHERE exercise.exercise_id IS NOT NULL
    ),
    0,
    0,
    v_now,
    v_now
  )
  ON CONFLICT (user_id, protocol_date)
  DO UPDATE SET
    readiness_score = EXCLUDED.readiness_score,
    acwr_value = EXCLUDED.acwr_value,
    training_focus = EXCLUDED.training_focus,
    ai_rationale = EXCLUDED.ai_rationale,
    total_load_target_au = EXCLUDED.total_load_target_au,
    confidence_metadata = EXCLUDED.confidence_metadata,
    total_exercises = EXCLUDED.total_exercises,
    completed_exercises = 0,
    overall_progress = 0,
    generated_at = v_now,
    updated_at = v_now
  RETURNING id INTO v_protocol_id;

  DELETE FROM public.protocol_exercises
  WHERE protocol_id = v_protocol_id;

  INSERT INTO public.protocol_exercises (
    protocol_id,
    exercise_id,
    block_type,
    sequence_order,
    prescribed_sets,
    prescribed_reps,
    prescribed_hold_seconds,
    prescribed_duration_seconds,
    load_contribution_au,
    ai_note,
    status,
    created_at,
    updated_at
  )
  SELECT
    v_protocol_id,
    exercise.exercise_id,
    exercise.block_type,
    exercise.sequence_order,
    exercise.prescribed_sets,
    exercise.prescribed_reps,
    exercise.prescribed_hold_seconds,
    exercise.prescribed_duration_seconds,
    coalesce(exercise.load_contribution_au, 0),
    exercise.ai_note,
    'pending',
    v_now,
    v_now
  FROM jsonb_to_recordset(p_exercises) AS exercise(
    exercise_id uuid,
    block_type text,
    sequence_order integer,
    prescribed_sets integer,
    prescribed_reps integer,
    prescribed_hold_seconds integer,
    prescribed_duration_seconds integer,
    load_contribution_au integer,
    ai_note text
  )
  WHERE exercise.exercise_id IS NOT NULL;

  IF NOT EXISTS (
    SELECT 1
    FROM public.protocol_exercises
    WHERE protocol_id = v_protocol_id
  ) THEN
    RAISE EXCEPTION 'Cannot persist a protocol without exercise IDs';
  END IF;

  RETURN v_protocol_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_protocol_transactional(
  uuid,
  date,
  integer,
  numeric,
  text,
  text,
  integer,
  jsonb,
  jsonb
) TO authenticated;
