-- Netlify / Supabase compatibility bridge
-- Purpose: restore the database objects and compatibility fields expected by
-- the current Netlify functions and direct Supabase client calls.

-- ============================================================================
-- USERS COMPATIBILITY FIELDS
-- ============================================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS avatar_url text;

CREATE OR REPLACE FUNCTION public.sync_user_compat_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(nullif(trim(NEW.full_name), ''), '') = ''
     AND coalesce(nullif(trim(NEW.name), ''), '') <> '' THEN
    NEW.full_name := NEW.name;
  END IF;

  IF coalesce(nullif(trim(NEW.name), ''), '') = '' THEN
    NEW.name := coalesce(
      nullif(trim(NEW.full_name), ''),
      nullif(trim(concat_ws(' ', NEW.first_name, NEW.last_name)), ''),
      NEW.name
    );
  END IF;

  IF coalesce(nullif(trim(NEW.profile_photo_url), ''), '') = ''
     AND coalesce(nullif(trim(NEW.avatar_url), ''), '') <> '' THEN
    NEW.profile_photo_url := NEW.avatar_url;
  END IF;

  IF coalesce(nullif(trim(NEW.avatar_url), ''), '') = '' THEN
    NEW.avatar_url := coalesce(
      nullif(trim(NEW.profile_photo_url), ''),
      nullif(trim(NEW.profile_picture), ''),
      NEW.avatar_url
    );
  END IF;

  RETURN NEW;
END;
$$;

UPDATE public.users
SET
  name = coalesce(
    name,
    nullif(trim(full_name), ''),
    nullif(trim(concat_ws(' ', first_name, last_name)), '')
  ),
  avatar_url = coalesce(
    avatar_url,
    nullif(trim(profile_photo_url), ''),
    nullif(trim(profile_picture), '')
  );

DROP TRIGGER IF EXISTS sync_user_compat_fields ON public.users;
CREATE TRIGGER sync_user_compat_fields
BEFORE INSERT OR UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_compat_fields();

-- ============================================================================
-- READINESS SCORE COMPATIBILITY FIELDS
-- ============================================================================

ALTER TABLE public.readiness_scores
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS day date,
  ADD COLUMN IF NOT EXISTS score numeric,
  ADD COLUMN IF NOT EXISTS level text,
  ADD COLUMN IF NOT EXISTS suggestion text,
  ADD COLUMN IF NOT EXISTS acute_load numeric,
  ADD COLUMN IF NOT EXISTS chronic_load numeric,
  ADD COLUMN IF NOT EXISTS workload_score numeric,
  ADD COLUMN IF NOT EXISTS proximity_score numeric;

UPDATE public.readiness_scores
SET
  user_id = coalesce(user_id, athlete_id),
  day = coalesce(day, date),
  score = coalesce(score, readiness_score);

CREATE OR REPLACE FUNCTION public.sync_readiness_scores_compat()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.athlete_id IS NULL AND NEW.user_id IS NOT NULL THEN
    NEW.athlete_id := NEW.user_id;
  END IF;

  IF NEW.user_id IS NULL AND NEW.athlete_id IS NOT NULL THEN
    NEW.user_id := NEW.athlete_id;
  END IF;

  IF NEW.date IS NULL AND NEW.day IS NOT NULL THEN
    NEW.date := NEW.day;
  END IF;

  IF NEW.day IS NULL AND NEW.date IS NOT NULL THEN
    NEW.day := NEW.date;
  END IF;

  IF NEW.readiness_score IS NULL AND NEW.score IS NOT NULL THEN
    NEW.readiness_score := NEW.score;
  END IF;

  IF NEW.score IS NULL AND NEW.readiness_score IS NOT NULL THEN
    NEW.score := NEW.readiness_score;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_readiness_scores_compat ON public.readiness_scores;
CREATE TRIGGER sync_readiness_scores_compat
BEFORE INSERT OR UPDATE ON public.readiness_scores
FOR EACH ROW
EXECUTE FUNCTION public.sync_readiness_scores_compat();

CREATE UNIQUE INDEX IF NOT EXISTS idx_readiness_scores_athlete_day
  ON public.readiness_scores (athlete_id, day)
  WHERE athlete_id IS NOT NULL AND day IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_readiness_scores_user_day
  ON public.readiness_scores (user_id, day)
  WHERE user_id IS NOT NULL AND day IS NOT NULL;

-- ============================================================================
-- EMERGENCY MEDICAL RECORD COMPATIBILITY FIELDS
-- ============================================================================

ALTER TABLE public.emergency_medical_records
  ADD COLUMN IF NOT EXISTS event_type text,
  ADD COLUMN IF NOT EXISTS event_date timestamptz,
  ADD COLUMN IF NOT EXISTS medical_data jsonb,
  ADD COLUMN IF NOT EXISTS location_data jsonb,
  ADD COLUMN IF NOT EXISTS retention_expires_at timestamptz;

UPDATE public.emergency_medical_records
SET
  event_type = coalesce(event_type, record_type),
  event_date = coalesce(event_date, created_at),
  medical_data = coalesce(medical_data, record_data),
  retention_expires_at = coalesce(retention_expires_at, retention_until);

CREATE OR REPLACE FUNCTION public.sync_emergency_medical_record_compat()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.record_type IS NULL AND NEW.event_type IS NOT NULL THEN
    NEW.record_type := NEW.event_type;
  END IF;

  IF NEW.event_type IS NULL AND NEW.record_type IS NOT NULL THEN
    NEW.event_type := NEW.record_type;
  END IF;

  IF NEW.record_data IS NULL AND NEW.medical_data IS NOT NULL THEN
    NEW.record_data := NEW.medical_data;
  END IF;

  IF NEW.medical_data IS NULL AND NEW.record_data IS NOT NULL THEN
    NEW.medical_data := NEW.record_data;
  END IF;

  IF NEW.retention_until IS NULL AND NEW.retention_expires_at IS NOT NULL THEN
    NEW.retention_until := NEW.retention_expires_at;
  END IF;

  IF NEW.retention_expires_at IS NULL AND NEW.retention_until IS NOT NULL THEN
    NEW.retention_expires_at := NEW.retention_until;
  END IF;

  IF NEW.event_date IS NULL THEN
    NEW.event_date := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_emergency_medical_record_compat ON public.emergency_medical_records;
CREATE TRIGGER sync_emergency_medical_record_compat
BEFORE INSERT OR UPDATE ON public.emergency_medical_records
FOR EACH ROW
EXECUTE FUNCTION public.sync_emergency_medical_record_compat();

-- ============================================================================
-- ACCOUNT DELETION COMPATIBILITY FIELDS
-- ============================================================================

ALTER TABLE public.account_deletion_requests
  ADD COLUMN IF NOT EXISTS requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS error_message text;

UPDATE public.account_deletion_requests
SET requested_at = coalesce(requested_at, created_at, soft_deleted_at, now());

CREATE INDEX IF NOT EXISTS idx_account_deletion_requests_pending_schedule
  ON public.account_deletion_requests (status, scheduled_hard_delete_at);

-- ============================================================================
-- COMMUNITY TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.blocked_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  blocked_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, blocked_user_id),
  CONSTRAINT blocked_users_no_self_block CHECK (user_id <> blocked_user_id)
);

CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  title text,
  content text NOT NULL,
  post_type text NOT NULL DEFAULT 'general',
  location text,
  media_url text,
  media_type text,
  likes_count integer NOT NULL DEFAULT 0,
  comments_count integer NOT NULL DEFAULT 0,
  shares_count integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.post_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  likes_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.comment_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES public.post_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comment_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.trending_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  question text NOT NULL,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.community_polls(id) ON DELETE CASCADE,
  option_text text NOT NULL,
  votes_count integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.community_poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id uuid NOT NULL REFERENCES public.community_poll_options(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (option_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_bookmarks_post_id ON public.post_bookmarks(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON public.community_poll_options(poll_id);

DROP TRIGGER IF EXISTS update_posts_updated_at ON public.posts;
CREATE TRIGGER update_posts_updated_at
BEFORE UPDATE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_post_comments_updated_at ON public.post_comments;
CREATE TRIGGER update_post_comments_updated_at
BEFORE UPDATE ON public.post_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_trending_topics_updated_at ON public.trending_topics;
CREATE TRIGGER update_trending_topics_updated_at
BEFORE UPDATE ON public.trending_topics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.increment_likes_count(post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.posts
  SET likes_count = coalesce(likes_count, 0) + 1
  WHERE id = post_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_likes_count(post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.posts
  SET likes_count = greatest(coalesce(likes_count, 0) - 1, 0)
  WHERE id = post_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_comments_count(post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.posts
  SET comments_count = coalesce(comments_count, 0) + 1
  WHERE id = post_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_comments_count(post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.posts
  SET comments_count = greatest(coalesce(comments_count, 0) - 1, 0)
  WHERE id = post_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_comment_likes_count(comment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.post_comments
  SET likes_count = coalesce(likes_count, 0) + 1
  WHERE id = comment_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_comment_likes_count(comment_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.post_comments
  SET likes_count = greatest(coalesce(likes_count, 0) - 1, 0)
  WHERE id = comment_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_poll_votes(option_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.community_poll_options
  SET votes_count = coalesce(votes_count, 0) + 1
  WHERE id = option_id;
END;
$$;

-- ============================================================================
-- ACHIEVEMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.achievement_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  icon text,
  category text NOT NULL,
  points integer NOT NULL DEFAULT 10,
  criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.player_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES public.achievement_definitions(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  context_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS public.player_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  streak_type text NOT NULL,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_activity_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, streak_type)
);

CREATE TABLE IF NOT EXISTS public.player_training_stats (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  total_sessions integer NOT NULL DEFAULT 0,
  total_exercises integer NOT NULL DEFAULT 0,
  total_training_minutes integer NOT NULL DEFAULT 0,
  total_load_au numeric NOT NULL DEFAULT 0,
  total_throws integer NOT NULL DEFAULT 0,
  tournaments_completed integer NOT NULL DEFAULT 0,
  total_achievements integer NOT NULL DEFAULT 0,
  total_points integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS update_player_streaks_updated_at ON public.player_streaks;
CREATE TRIGGER update_player_streaks_updated_at
BEFORE UPDATE ON public.player_streaks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_player_training_stats_updated_at ON public.player_training_stats;
CREATE TRIGGER update_player_training_stats_updated_at
BEFORE UPDATE ON public.player_training_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.achievement_definitions (
  slug,
  name,
  description,
  icon,
  category,
  points,
  criteria,
  display_order
)
VALUES
  (
    'first_protocol',
    'First Protocol',
    'Complete your first daily protocol.',
    'pi pi-play',
    'training',
    10,
    '{"type":"first_protocol"}'::jsonb,
    10
  ),
  (
    'protocol_streak_3',
    '3-Day Streak',
    'Complete three daily protocols in a row.',
    'pi pi-bolt',
    'training',
    20,
    '{"type":"streak","streak_type":"daily_protocol","days":3}'::jsonb,
    20
  ),
  (
    'protocol_streak_7',
    'Week Warrior',
    'Complete seven daily protocols in a row.',
    'pi pi-fire',
    'training',
    35,
    '{"type":"streak","streak_type":"daily_protocol","days":7}'::jsonb,
    30
  ),
  (
    'session_10',
    'Session Builder',
    'Log ten training sessions.',
    'pi pi-calendar',
    'training',
    25,
    '{"type":"total_sessions","count":10}'::jsonb,
    40
  ),
  (
    'qb_throws_500',
    'QB Volume 500',
    'Log 500 throws.',
    'pi pi-send',
    'performance',
    30,
    '{"type":"qb_throws","count":500}'::jsonb,
    50
  ),
  (
    'tournament_complete_1',
    'Tournament Ready',
    'Complete your first tournament.',
    'pi pi-trophy',
    'special',
    40,
    '{"type":"tournament_complete","count":1}'::jsonb,
    60
  )
ON CONFLICT (slug) DO UPDATE
SET
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon,
  category = excluded.category,
  points = excluded.points,
  criteria = excluded.criteria,
  display_order = excluded.display_order,
  is_active = true;

CREATE OR REPLACE FUNCTION public.award_achievement(
  p_user_id uuid,
  p_achievement_slug text,
  p_context jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_achievement_id uuid;
  v_points integer;
  v_award_id uuid;
  v_existing_award_id uuid;
  v_legacy_award_id uuid;
BEGIN
  SELECT id, points
  INTO v_achievement_id, v_points
  FROM public.achievement_definitions
  WHERE slug = p_achievement_slug
    AND is_active = true
  LIMIT 1;

  IF v_achievement_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT id
  INTO v_existing_award_id
  FROM public.player_achievements
  WHERE user_id = p_user_id
    AND achievement_id = v_achievement_id
  LIMIT 1;

  IF v_existing_award_id IS NOT NULL THEN
    RETURN v_existing_award_id;
  END IF;

  INSERT INTO public.player_achievements (
    user_id,
    achievement_id,
    context_data
  )
  VALUES (
    p_user_id,
    v_achievement_id,
    coalesce(p_context, '{}'::jsonb)
  )
  RETURNING id INTO v_award_id;

  INSERT INTO public.player_training_stats (
    user_id,
    total_achievements,
    total_points
  )
  VALUES (
    p_user_id,
    1,
    coalesce(v_points, 0)
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    total_achievements = public.player_training_stats.total_achievements + 1,
    total_points = public.player_training_stats.total_points + coalesce(v_points, 0),
    updated_at = now();

  IF to_regclass('public.athlete_achievements') IS NOT NULL THEN
    EXECUTE
      'SELECT id FROM public.athlete_achievements WHERE athlete_id = $1 AND achievement_type = $2 LIMIT 1'
      INTO v_legacy_award_id
      USING p_user_id, p_achievement_slug;

    IF v_legacy_award_id IS NULL THEN
      EXECUTE
        'INSERT INTO public.athlete_achievements (athlete_id, achievement_type, achievement_data, earned_at, created_at)
         VALUES ($1, $2, $3, now(), now())'
        USING p_user_id, p_achievement_slug, coalesce(p_context, '{}'::jsonb);
    END IF;
  END IF;

  RETURN v_award_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_player_streak(
  p_user_id uuid,
  p_streak_type text,
  p_activity_date date
)
RETURNS TABLE (
  streak_type text,
  new_streak integer,
  longest_streak integer,
  achievements_unlocked text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current public.player_streaks%ROWTYPE;
  v_new_streak integer := 1;
  v_longest_streak integer := 1;
  v_unlocked text[] := ARRAY[]::text[];
BEGIN
  SELECT *
  INTO v_current
  FROM public.player_streaks
  WHERE user_id = p_user_id
    AND streak_type = p_streak_type
  FOR UPDATE;

  IF FOUND THEN
    IF v_current.last_activity_date = p_activity_date THEN
      v_new_streak := v_current.current_streak;
      v_longest_streak := v_current.longest_streak;
    ELSIF v_current.last_activity_date = (p_activity_date - INTERVAL '1 day')::date THEN
      v_new_streak := v_current.current_streak + 1;
      v_longest_streak := greatest(v_current.longest_streak, v_new_streak);
    ELSE
      v_new_streak := 1;
      v_longest_streak := greatest(v_current.longest_streak, 1);
    END IF;

    UPDATE public.player_streaks
    SET
      current_streak = v_new_streak,
      longest_streak = v_longest_streak,
      last_activity_date = p_activity_date,
      updated_at = now()
    WHERE id = v_current.id;
  ELSE
    INSERT INTO public.player_streaks (
      user_id,
      streak_type,
      current_streak,
      longest_streak,
      last_activity_date
    )
    VALUES (
      p_user_id,
      p_streak_type,
      1,
      1,
      p_activity_date
    );
  END IF;

  SELECT coalesce(array_agg(slug ORDER BY display_order), ARRAY[]::text[])
  INTO v_unlocked
  FROM public.achievement_definitions
  WHERE is_active = true
    AND criteria ->> 'type' = 'streak'
    AND criteria ->> 'streak_type' = p_streak_type
    AND coalesce((criteria ->> 'days')::integer, 0) <= v_new_streak;

  RETURN QUERY
  SELECT
    p_streak_type,
    v_new_streak,
    v_longest_streak,
    v_unlocked;
END;
$$;

-- ============================================================================
-- PREFERENCE LEARNING
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.learned_user_preferences (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  helpful_responses integer NOT NULL DEFAULT 0,
  dismissed_responses integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS update_learned_user_preferences_updated_at ON public.learned_user_preferences;
CREATE TRIGGER update_learned_user_preferences_updated_at
BEFORE UPDATE ON public.learned_user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.increment_preference_counter(
  p_user_id uuid,
  p_field text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.learned_user_preferences (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  IF p_field = 'helpful_responses' THEN
    UPDATE public.learned_user_preferences
    SET
      helpful_responses = helpful_responses + 1,
      updated_at = now()
    WHERE user_id = p_user_id;
  ELSIF p_field = 'dismissed_responses' THEN
    UPDATE public.learned_user_preferences
    SET
      dismissed_responses = dismissed_responses + 1,
      updated_at = now()
    WHERE user_id = p_user_id;
  ELSE
    RAISE EXCEPTION 'Unsupported preference counter field: %', p_field;
  END IF;
END;
$$;

-- ============================================================================
-- READINESS / ACWR RPCS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_athlete_readiness(
  p_user_id uuid,
  p_date date
)
RETURNS TABLE (
  has_checkin boolean,
  readiness_score numeric,
  sleep_quality integer,
  energy_level integer,
  muscle_soreness integer,
  stress_level integer,
  soreness_areas text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_checkin public.daily_wellness_checkin%ROWTYPE;
  v_readiness public.readiness_scores%ROWTYPE;
BEGIN
  SELECT *
  INTO v_checkin
  FROM public.daily_wellness_checkin
  WHERE user_id = p_user_id
    AND checkin_date = p_date
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN QUERY
    SELECT
      true,
      coalesce(v_checkin.calculated_readiness, NULL),
      v_checkin.sleep_quality,
      v_checkin.energy_level,
      v_checkin.muscle_soreness,
      v_checkin.stress_level,
      coalesce(v_checkin.soreness_areas, ARRAY[]::text[]);
    RETURN;
  END IF;

  SELECT *
  INTO v_readiness
  FROM public.readiness_scores
  WHERE coalesce(user_id, athlete_id) = p_user_id
    AND coalesce(day, date) = p_date
  ORDER BY created_at DESC NULLS LAST
  LIMIT 1;

  IF FOUND THEN
    RETURN QUERY
    SELECT
      true,
      coalesce(v_readiness.readiness_score, v_readiness.score),
      NULL::integer,
      NULL::integer,
      NULL::integer,
      NULL::integer,
      ARRAY[]::text[];
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    false,
    NULL::numeric,
    NULL::integer,
    NULL::integer,
    NULL::integer,
    NULL::integer,
    ARRAY[]::text[];
END;
$$;

CREATE OR REPLACE FUNCTION public.compute_acwr(athlete uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result numeric;
BEGIN
  SELECT public.calculate_acwr_safe(athlete, current_date)
  INTO v_result;

  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- ============================================================================
-- QB THROWING
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.qb_throwing_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_date date NOT NULL,
  session_type text NOT NULL,
  total_throws integer NOT NULL DEFAULT 0,
  short_throws integer NOT NULL DEFAULT 0,
  medium_throws integer NOT NULL DEFAULT 0,
  long_throws integer NOT NULL DEFAULT 0,
  location text,
  arm_feeling_before integer,
  arm_feeling_after integer,
  pre_throwing_warmup_done boolean NOT NULL DEFAULT false,
  post_throwing_arm_care_done boolean NOT NULL DEFAULT false,
  ice_applied boolean NOT NULL DEFAULT false,
  warmup_duration_minutes integer,
  throwing_duration_minutes integer,
  arm_care_duration_minutes integer,
  notes text,
  mechanics_focus text,
  fatigue_level integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, session_date, session_type)
);

DROP TRIGGER IF EXISTS update_qb_throwing_sessions_updated_at ON public.qb_throwing_sessions;
CREATE TRIGGER update_qb_throwing_sessions_updated_at
BEFORE UPDATE ON public.qb_throwing_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.get_qb_throwing_progression(p_user_id uuid)
RETURNS TABLE (
  current_week_avg numeric,
  target_throws integer,
  progression_phase text,
  days_since_last_session integer,
  weekly_compliance_pct integer,
  recommendation text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_week_avg numeric;
  v_week_total integer;
  v_last_session date;
  v_target integer;
  v_phase text;
  v_days integer;
  v_compliance integer;
  v_recommendation text;
BEGIN
  SELECT
    avg(total_throws)::numeric,
    coalesce(sum(total_throws), 0)::integer,
    max(session_date)
  INTO
    v_week_avg,
    v_week_total,
    v_last_session
  FROM public.qb_throwing_sessions
  WHERE user_id = p_user_id
    AND session_date >= (current_date - INTERVAL '7 days')::date;

  IF v_last_session IS NULL THEN
    RETURN;
  END IF;

  IF coalesce(v_week_avg, 0) < 150 THEN
    v_target := 150;
    v_phase := 'Foundation';
  ELSIF coalesce(v_week_avg, 0) < 220 THEN
    v_target := 200;
    v_phase := 'Build';
  ELSE
    v_target := 250;
    v_phase := 'Competition';
  END IF;

  v_days := greatest((current_date - v_last_session), 0);
  v_compliance := least(
    100,
    round((coalesce(v_week_avg, 0) / greatest(v_target, 1)) * 100)::integer
  );

  IF v_days >= 5 THEN
    v_recommendation := 'Resume with a lighter throwing session before building volume again.';
  ELSIF v_compliance >= 100 THEN
    v_recommendation := 'Volume is on target. Maintain the current throwing rhythm.';
  ELSE
    v_recommendation := 'Add a moderate throwing day to close the gap to your target volume.';
  END IF;

  RETURN QUERY
  SELECT
    round(coalesce(v_week_avg, 0), 1),
    v_target,
    v_phase,
    v_days,
    v_compliance,
    v_recommendation;
END;
$$;

-- ============================================================================
-- ACCOUNT PAUSE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.account_pause_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  paused_at timestamptz NOT NULL DEFAULT now(),
  paused_until timestamptz,
  reason text,
  acwr_frozen boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  resumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_pause_dates CHECK (paused_until IS NULL OR paused_until > paused_at)
);

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS account_status text DEFAULT 'active';

DROP TRIGGER IF EXISTS update_account_pause_requests_updated_at ON public.account_pause_requests;
CREATE TRIGGER update_account_pause_requests_updated_at
BEFORE UPDATE ON public.account_pause_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.pause_account(
  p_user_id uuid,
  p_paused_until timestamptz DEFAULT NULL,
  p_reason text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pause_id uuid;
BEGIN
  UPDATE public.account_pause_requests
  SET
    is_active = false,
    resumed_at = now(),
    updated_at = now()
  WHERE user_id = p_user_id
    AND is_active = true;

  INSERT INTO public.account_pause_requests (
    user_id,
    paused_until,
    reason
  )
  VALUES (
    p_user_id,
    p_paused_until,
    p_reason
  )
  RETURNING id INTO v_pause_id;

  UPDATE public.users
  SET
    account_status = 'paused',
    updated_at = now()
  WHERE id = p_user_id;

  RETURN v_pause_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.resume_account(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated integer;
BEGIN
  UPDATE public.account_pause_requests
  SET
    is_active = false,
    resumed_at = now(),
    updated_at = now()
  WHERE user_id = p_user_id
    AND is_active = true;

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 0 THEN
    RETURN false;
  END IF;

  UPDATE public.users
  SET
    account_status = 'active',
    updated_at = now()
  WHERE id = p_user_id;

  RETURN true;
END;
$$;

-- ============================================================================
-- ACCOUNT DELETION WORKFLOW
-- ============================================================================

CREATE OR REPLACE FUNCTION public.initiate_account_deletion(
  p_user_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request_id uuid;
BEGIN
  IF auth.role() = 'authenticated' AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Not authorized to request deletion for this user';
  END IF;

  SELECT id
  INTO v_request_id
  FROM public.account_deletion_requests
  WHERE user_id = p_user_id
    AND status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_request_id IS NOT NULL THEN
    RETURN v_request_id;
  END IF;

  INSERT INTO public.account_deletion_requests (
    user_id,
    reason,
    status,
    requested_at,
    soft_deleted_at,
    scheduled_hard_delete_at,
    sessions_revoked_at
  )
  VALUES (
    p_user_id,
    p_reason,
    'pending',
    now(),
    now(),
    now() + INTERVAL '30 days',
    now()
  )
  RETURNING id INTO v_request_id;

  UPDATE public.users
  SET
    is_active = false,
    account_status = 'deleted',
    updated_at = now()
  WHERE id = p_user_id;

  INSERT INTO public.privacy_audit_log (
    user_id,
    action,
    affected_table,
    affected_data
  )
  VALUES (
    p_user_id,
    'deletion_requested',
    'users',
    jsonb_build_object(
      'request_id', v_request_id,
      'reason', p_reason,
      'scheduled_hard_delete_at', now() + INTERVAL '30 days'
    )
  );

  RETURN v_request_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_account_deletion(
  p_request_id uuid,
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_status text;
BEGIN
  IF auth.role() = 'authenticated' AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Not authorized to cancel deletion for this user';
  END IF;

  SELECT status
  INTO v_current_status
  FROM public.account_deletion_requests
  WHERE id = p_request_id
    AND user_id = p_user_id
  LIMIT 1;

  IF v_current_status NOT IN ('pending', 'processing') THEN
    RETURN false;
  END IF;

  UPDATE public.account_deletion_requests
  SET
    status = 'cancelled',
    updated_at = now()
  WHERE id = p_request_id;

  UPDATE public.users
  SET
    is_active = true,
    account_status = 'active',
    updated_at = now()
  WHERE id = p_user_id;

  INSERT INTO public.privacy_audit_log (
    user_id,
    action,
    affected_table,
    affected_data
  )
  VALUES (
    p_user_id,
    'deletion_cancelled',
    'account_deletion_requests',
    jsonb_build_object('request_id', p_request_id)
  );

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_deletion_status(p_user_id uuid)
RETURNS TABLE (
  request_id uuid,
  status text,
  requested_at timestamptz,
  scheduled_hard_delete_at timestamptz,
  days_until_deletion integer,
  can_cancel boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'authenticated' AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Not authorized to read deletion status for this user';
  END IF;

  RETURN QUERY
  SELECT
    adr.id,
    adr.status,
    coalesce(adr.requested_at, adr.created_at, adr.soft_deleted_at),
    adr.scheduled_hard_delete_at,
    greatest(
      ceil(
        extract(epoch FROM (adr.scheduled_hard_delete_at - now())) / 86400
      )::integer,
      0
    ),
    adr.status IN ('pending', 'processing')
  FROM public.account_deletion_requests adr
  WHERE adr.user_id = p_user_id
  ORDER BY coalesce(adr.requested_at, adr.created_at, adr.soft_deleted_at) DESC
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_deletions_ready_for_processing()
RETURNS TABLE (
  request_id uuid,
  user_id uuid,
  scheduled_at timestamptz,
  days_remaining integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    adr.id,
    adr.user_id,
    adr.scheduled_hard_delete_at,
    floor(extract(epoch FROM (adr.scheduled_hard_delete_at - now())) / 86400)::integer
  FROM public.account_deletion_requests adr
  WHERE adr.status = 'pending'
    AND adr.scheduled_hard_delete_at <= now()
  ORDER BY adr.scheduled_hard_delete_at ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.process_hard_deletion(p_request_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_email_hash text;
BEGIN
  SELECT user_id
  INTO v_user_id
  FROM public.account_deletion_requests
  WHERE id = p_request_id
    AND status = 'pending'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE public.account_deletion_requests
  SET
    status = 'processing',
    updated_at = now()
  WHERE id = p_request_id;

  SELECT md5(coalesce(email, v_user_id::text))
  INTO v_email_hash
  FROM public.users
  WHERE id = v_user_id;

  UPDATE public.emergency_medical_records
  SET
    user_email_hash = coalesce(user_email_hash, v_email_hash),
    user_id = NULL,
    updated_at = now()
  WHERE user_id = v_user_id;

  IF to_regclass('public.community_poll_votes') IS NOT NULL THEN
    DELETE FROM public.community_poll_votes WHERE user_id = v_user_id;
  END IF;

  IF to_regclass('public.comment_likes') IS NOT NULL THEN
    DELETE FROM public.comment_likes WHERE user_id = v_user_id;
  END IF;

  IF to_regclass('public.post_bookmarks') IS NOT NULL THEN
    DELETE FROM public.post_bookmarks WHERE user_id = v_user_id;
  END IF;

  IF to_regclass('public.post_likes') IS NOT NULL THEN
    DELETE FROM public.post_likes WHERE user_id = v_user_id;
  END IF;

  IF to_regclass('public.post_comments') IS NOT NULL THEN
    DELETE FROM public.post_comments WHERE user_id = v_user_id;
  END IF;

  IF to_regclass('public.posts') IS NOT NULL THEN
    DELETE FROM public.posts WHERE user_id = v_user_id;
  END IF;

  IF to_regclass('public.qb_throwing_sessions') IS NOT NULL THEN
    DELETE FROM public.qb_throwing_sessions WHERE user_id = v_user_id;
  END IF;

  IF to_regclass('public.player_achievements') IS NOT NULL THEN
    DELETE FROM public.player_achievements WHERE user_id = v_user_id;
  END IF;

  IF to_regclass('public.player_streaks') IS NOT NULL THEN
    DELETE FROM public.player_streaks WHERE user_id = v_user_id;
  END IF;

  IF to_regclass('public.player_training_stats') IS NOT NULL THEN
    DELETE FROM public.player_training_stats WHERE user_id = v_user_id;
  END IF;

  IF to_regclass('public.learned_user_preferences') IS NOT NULL THEN
    DELETE FROM public.learned_user_preferences WHERE user_id = v_user_id;
  END IF;

  IF to_regclass('public.account_pause_requests') IS NOT NULL THEN
    DELETE FROM public.account_pause_requests WHERE user_id = v_user_id;
  END IF;

  IF to_regclass('public.athlete_achievements') IS NOT NULL THEN
    DELETE FROM public.athlete_achievements WHERE athlete_id = v_user_id;
  END IF;

  IF to_regclass('public.ai_response_feedback') IS NOT NULL THEN
    DELETE FROM public.ai_response_feedback WHERE user_id = v_user_id;
  END IF;

  IF to_regclass('public.daily_wellness_checkin') IS NOT NULL THEN
    DELETE FROM public.daily_wellness_checkin WHERE user_id = v_user_id;
  END IF;

  IF to_regclass('public.readiness_scores') IS NOT NULL THEN
    DELETE FROM public.readiness_scores
    WHERE coalesce(user_id, athlete_id) = v_user_id;
  END IF;

  IF to_regclass('public.wellness_logs') IS NOT NULL THEN
    DELETE FROM public.wellness_logs WHERE user_id = v_user_id;
  END IF;

  IF to_regclass('public.training_sessions') IS NOT NULL THEN
    DELETE FROM public.training_sessions WHERE user_id = v_user_id;
  END IF;

  IF to_regclass('public.notifications') IS NOT NULL THEN
    DELETE FROM public.notifications WHERE user_id = v_user_id;
  END IF;

  IF to_regclass('public.team_members') IS NOT NULL THEN
    DELETE FROM public.team_members WHERE user_id = v_user_id;
  END IF;

  UPDATE public.users
  SET
    email = 'deleted+' || id::text || '@deleted.local',
    first_name = NULL,
    last_name = NULL,
    full_name = 'Deleted User',
    name = 'Deleted User',
    phone = NULL,
    bio = NULL,
    profile_picture = NULL,
    profile_photo_url = NULL,
    avatar_url = NULL,
    position = NULL,
    height_cm = NULL,
    weight_kg = NULL,
    birth_date = NULL,
    date_of_birth = NULL,
    jersey_number = NULL,
    gender = NULL,
    is_active = false,
    account_status = 'deleted',
    email_verified = false,
    onboarding_completed = false,
    updated_at = now()
  WHERE id = v_user_id;

  UPDATE public.account_deletion_requests
  SET
    status = 'completed',
    hard_deleted_at = now(),
    updated_at = now()
  WHERE id = p_request_id;

  INSERT INTO public.privacy_audit_log (
    user_id,
    action,
    affected_table,
    affected_data
  )
  VALUES (
    NULL,
    'deletion_completed',
    'users',
    jsonb_build_object(
      'request_id', p_request_id,
      'email_hash', v_email_hash,
      'completed_at', now()
    )
  );

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    UPDATE public.account_deletion_requests
    SET
      status = 'failed',
      error_message = SQLERRM,
      updated_at = now()
    WHERE id = p_request_id;

    INSERT INTO public.privacy_audit_log (
      user_id,
      action,
      affected_table,
      affected_data
    )
    VALUES (
      v_user_id,
      'deletion_failed',
      'account_deletion_requests',
      jsonb_build_object(
        'request_id', p_request_id,
        'error', SQLERRM
      )
    );

    RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_emergency_records()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count integer;
BEGIN
  DELETE FROM public.emergency_medical_records
  WHERE coalesce(retention_expires_at, retention_until) <= now();

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  IF v_deleted_count > 0 THEN
    INSERT INTO public.privacy_audit_log (
      user_id,
      action,
      affected_table,
      affected_data
    )
    VALUES (
      NULL,
      'retention_cleanup',
      'emergency_medical_records',
      jsonb_build_object(
        'records_deleted', v_deleted_count,
        'cleanup_date', now()
      )
    );
  END IF;

  RETURN v_deleted_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_emergency_medical_record(
  p_user_id uuid,
  p_event_type text,
  p_medical_data jsonb,
  p_location_data jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record_id uuid;
  v_retention timestamptz := now() + INTERVAL '7 years';
BEGIN
  IF auth.role() = 'authenticated' AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Not authorized to create emergency records for this user';
  END IF;

  INSERT INTO public.emergency_medical_records (
    user_id,
    record_type,
    record_data,
    retention_until,
    event_type,
    event_date,
    medical_data,
    location_data,
    retention_expires_at
  )
  VALUES (
    p_user_id,
    p_event_type,
    jsonb_strip_nulls(
      jsonb_build_object(
        'medical_data', coalesce(p_medical_data, '{}'::jsonb),
        'location_data', p_location_data
      )
    ),
    v_retention,
    p_event_type,
    now(),
    coalesce(p_medical_data, '{}'::jsonb),
    p_location_data,
    v_retention
  )
  RETURNING id INTO v_record_id;

  INSERT INTO public.privacy_audit_log (
    user_id,
    action,
    affected_table,
    affected_data
  )
  VALUES (
    p_user_id,
    'emergency_record_created',
    'emergency_medical_records',
    jsonb_build_object(
      'record_id', v_record_id,
      'event_type', p_event_type,
      'retention_expires_at', v_retention
    )
  );

  RETURN v_record_id;
END;
$$;

-- ============================================================================
-- SEASON ARCHIVE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.season_archives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id uuid NOT NULL UNIQUE,
  archived_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE OR REPLACE FUNCTION public.archive_season_data(p_season_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF to_regclass('public.seasons') IS NOT NULL THEN
    EXECUTE
      'UPDATE public.seasons
       SET is_archived = true,
           archived_at = now(),
           updated_at = now()
       WHERE id = $1'
      USING p_season_id;
  END IF;

  INSERT INTO public.season_archives (
    season_id,
    metadata
  )
  VALUES (
    p_season_id,
    jsonb_build_object('archived_by', auth.uid())
  )
  ON CONFLICT (season_id) DO UPDATE
  SET
    archived_at = now(),
    metadata = coalesce(public.season_archives.metadata, '{}'::jsonb)
      || excluded.metadata;

  RETURN true;
END;
$$;

-- ============================================================================
-- DIRECT CLIENT COMPATIBILITY VIEW
-- ============================================================================

CREATE OR REPLACE VIEW public.user_achievements AS
WITH viewer AS (
  SELECT auth.uid() AS uid
)
SELECT
  pa.id,
  pa.user_id,
  ad.slug AS achievement_slug,
  ad.name AS achievement_name,
  ad.category,
  pa.earned_at AS unlocked_at,
  pa.context_data AS metadata
FROM viewer cu
JOIN public.player_achievements pa
  ON pa.user_id = cu.uid
JOIN public.achievement_definitions ad
  ON ad.id = pa.achievement_id
UNION ALL
SELECT
  aa.id,
  aa.athlete_id AS user_id,
  aa.achievement_type AS achievement_slug,
  aa.achievement_type AS achievement_name,
  'legacy'::text AS category,
  aa.earned_at AS unlocked_at,
  coalesce(aa.achievement_data, '{}'::jsonb) AS metadata
FROM viewer cu
JOIN public.athlete_achievements aa
  ON aa.athlete_id = cu.uid
WHERE NOT EXISTS (
  SELECT 1
  FROM public.player_achievements pa
  JOIN public.achievement_definitions ad
    ON ad.id = pa.achievement_id
  WHERE pa.user_id = cu.uid
    AND ad.slug = aa.achievement_type
);

GRANT SELECT ON public.user_achievements TO authenticated;

GRANT EXECUTE ON FUNCTION public.initiate_account_deletion(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.cancel_account_deletion(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_deletion_status(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_deletions_ready_for_processing() TO service_role;
GRANT EXECUTE ON FUNCTION public.process_hard_deletion(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_emergency_records() TO service_role;
GRANT EXECUTE ON FUNCTION public.create_emergency_medical_record(uuid, text, jsonb, jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.pause_account(uuid, timestamptz, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.resume_account(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_preference_counter(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_athlete_readiness(uuid, date) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.compute_acwr(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.award_achievement(uuid, text, jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_player_streak(uuid, text, date) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_qb_throwing_progression(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.archive_season_data(uuid) TO authenticated, service_role;
