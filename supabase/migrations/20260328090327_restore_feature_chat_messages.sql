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

CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_id ON public.chat_messages (channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel ON public.chat_messages (channel);
CREATE INDEX IF NOT EXISTS idx_chat_messages_team_id ON public.chat_messages (team_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_thread_id ON public.chat_messages (thread_id);

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
    SELECT c.id INTO v_channel_id
    FROM public.channels c
    WHERE c.team_id = v_team_id
      AND c.channel_type = 'team_general'
    ORDER BY c.created_at ASC
    LIMIT 1;

    NEW.team_id := coalesce(NEW.team_id, v_team_id);
    NEW.channel_id := coalesce(NEW.channel_id, v_channel_id);
  END IF;

  IF NEW.channel_id IS NOT NULL AND NEW.team_id IS NULL THEN
    SELECT c.team_id INTO NEW.team_id
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
  SELECT channel_id INTO v_channel_id
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

CREATE INDEX IF NOT EXISTS idx_coach_activity_log_team_id ON public.coach_activity_log (team_id, created_at DESC);

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
    SELECT cm.user_id, cm.can_post, cm.joined_at, true AS is_explicit_member
    FROM public.channel_members cm
    JOIN channel_ctx ctx ON ctx.id = cm.channel_id
  ),
  team_visible_members AS (
    SELECT tm.user_id, true AS can_post, tm.joined_at, false AS is_explicit_member
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
    SELECT * FROM explicit_members
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
  LEFT JOIN public.users user_record ON user_record.id = member.user_id
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
