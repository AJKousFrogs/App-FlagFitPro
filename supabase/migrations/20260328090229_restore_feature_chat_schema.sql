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

CREATE INDEX IF NOT EXISTS idx_channels_team_id ON public.channels (team_id);
CREATE INDEX IF NOT EXISTS idx_channels_type ON public.channels (channel_type);
CREATE INDEX IF NOT EXISTS idx_channels_game_id ON public.channels (game_id);

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

CREATE INDEX IF NOT EXISTS idx_channel_members_channel_id ON public.channel_members (channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_user_id ON public.channel_members (user_id);

INSERT INTO public.channels (team_id, name, description, channel_type, is_default, created_by)
SELECT t.id, 'Announcements', 'Team-wide announcements and updates.', 'announcements', true, t.coach_id
FROM public.teams t
WHERE NOT EXISTS (
  SELECT 1 FROM public.channels c WHERE c.team_id = t.id AND c.channel_type = 'announcements'
);

INSERT INTO public.channels (team_id, name, description, channel_type, is_default, created_by)
SELECT t.id, 'Team Chat', 'General team communication.', 'team_general', true, t.coach_id
FROM public.teams t
WHERE NOT EXISTS (
  SELECT 1 FROM public.channels c WHERE c.team_id = t.id AND c.channel_type = 'team_general'
);

INSERT INTO public.channels (team_id, name, description, channel_type, is_default, created_by)
SELECT t.id, 'Coaches', 'Private staff coordination channel.', 'coaches_only', true, t.coach_id
FROM public.teams t
WHERE NOT EXISTS (
  SELECT 1 FROM public.channels c WHERE c.team_id = t.id AND c.channel_type = 'coaches_only'
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

  SELECT * INTO v_channel FROM public.channels WHERE id = p_channel_id;
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

  SELECT * INTO v_channel FROM public.channels WHERE id = p_channel_id;
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

  SELECT * INTO v_channel FROM public.channels WHERE id = p_channel_id;

  IF v_channel.channel_type IN ('announcements', 'coaches_only') THEN
    RETURN public.ff_is_team_staff(v_channel.team_id, p_user_id);
  END IF;

  SELECT * INTO v_member
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
