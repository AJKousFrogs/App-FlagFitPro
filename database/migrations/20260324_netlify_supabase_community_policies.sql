-- Netlify / Supabase compatibility policy completion
-- Purpose: replace "RLS enabled, no policy" informational findings with
-- explicit policies that match the current application access model.

DROP POLICY IF EXISTS blocked_users_own_select ON public.blocked_users;
CREATE POLICY blocked_users_own_select
  ON public.blocked_users
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS blocked_users_own_insert ON public.blocked_users;
CREATE POLICY blocked_users_own_insert
  ON public.blocked_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND blocked_user_id <> (SELECT auth.uid())
  );

DROP POLICY IF EXISTS blocked_users_own_delete ON public.blocked_users;
CREATE POLICY blocked_users_own_delete
  ON public.blocked_users
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS posts_authenticated_select ON public.posts;
CREATE POLICY posts_authenticated_select
  ON public.posts
  FOR SELECT
  TO authenticated
  USING (is_published = true OR (SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS posts_own_insert ON public.posts;
CREATE POLICY posts_own_insert
  ON public.posts
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS posts_own_update ON public.posts;
CREATE POLICY posts_own_update
  ON public.posts
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS posts_own_delete ON public.posts;
CREATE POLICY posts_own_delete
  ON public.posts
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS post_likes_own_select ON public.post_likes;
CREATE POLICY post_likes_own_select
  ON public.post_likes
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS post_likes_own_insert ON public.post_likes;
CREATE POLICY post_likes_own_insert
  ON public.post_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1
      FROM public.posts p
      WHERE p.id = post_id
        AND (p.is_published = true OR p.user_id = (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS post_likes_own_delete ON public.post_likes;
CREATE POLICY post_likes_own_delete
  ON public.post_likes
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS post_bookmarks_own_select ON public.post_bookmarks;
CREATE POLICY post_bookmarks_own_select
  ON public.post_bookmarks
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS post_bookmarks_own_insert ON public.post_bookmarks;
CREATE POLICY post_bookmarks_own_insert
  ON public.post_bookmarks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1
      FROM public.posts p
      WHERE p.id = post_id
        AND (p.is_published = true OR p.user_id = (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS post_bookmarks_own_delete ON public.post_bookmarks;
CREATE POLICY post_bookmarks_own_delete
  ON public.post_bookmarks
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS post_comments_authenticated_select ON public.post_comments;
CREATE POLICY post_comments_authenticated_select
  ON public.post_comments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.posts p
      WHERE p.id = post_id
        AND (p.is_published = true OR p.user_id = (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS post_comments_own_insert ON public.post_comments;
CREATE POLICY post_comments_own_insert
  ON public.post_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1
      FROM public.posts p
      WHERE p.id = post_id
        AND (p.is_published = true OR p.user_id = (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS post_comments_own_update ON public.post_comments;
CREATE POLICY post_comments_own_update
  ON public.post_comments
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS post_comments_own_delete ON public.post_comments;
CREATE POLICY post_comments_own_delete
  ON public.post_comments
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS comment_likes_own_select ON public.comment_likes;
CREATE POLICY comment_likes_own_select
  ON public.comment_likes
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS comment_likes_own_insert ON public.comment_likes;
CREATE POLICY comment_likes_own_insert
  ON public.comment_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1
      FROM public.post_comments pc
      JOIN public.posts p ON p.id = pc.post_id
      WHERE pc.id = comment_id
        AND (p.is_published = true OR p.user_id = (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS comment_likes_own_delete ON public.comment_likes;
CREATE POLICY comment_likes_own_delete
  ON public.comment_likes
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS community_polls_authenticated_select ON public.community_polls;
CREATE POLICY community_polls_authenticated_select
  ON public.community_polls
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.posts p
      WHERE p.id = post_id
        AND (p.is_published = true OR p.user_id = (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS community_polls_owner_insert ON public.community_polls;
CREATE POLICY community_polls_owner_insert
  ON public.community_polls
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.posts p
      WHERE p.id = post_id
        AND p.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS community_polls_owner_update ON public.community_polls;
CREATE POLICY community_polls_owner_update
  ON public.community_polls
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.posts p
      WHERE p.id = post_id
        AND p.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.posts p
      WHERE p.id = post_id
        AND p.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS community_polls_owner_delete ON public.community_polls;
CREATE POLICY community_polls_owner_delete
  ON public.community_polls
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.posts p
      WHERE p.id = post_id
        AND p.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS community_poll_options_authenticated_select
  ON public.community_poll_options;
CREATE POLICY community_poll_options_authenticated_select
  ON public.community_poll_options
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.community_polls cp
      JOIN public.posts p ON p.id = cp.post_id
      WHERE cp.id = poll_id
        AND (p.is_published = true OR p.user_id = (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS community_poll_options_owner_insert
  ON public.community_poll_options;
CREATE POLICY community_poll_options_owner_insert
  ON public.community_poll_options
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.community_polls cp
      JOIN public.posts p ON p.id = cp.post_id
      WHERE cp.id = poll_id
        AND p.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS community_poll_options_owner_update
  ON public.community_poll_options;
CREATE POLICY community_poll_options_owner_update
  ON public.community_poll_options
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.community_polls cp
      JOIN public.posts p ON p.id = cp.post_id
      WHERE cp.id = poll_id
        AND p.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.community_polls cp
      JOIN public.posts p ON p.id = cp.post_id
      WHERE cp.id = poll_id
        AND p.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS community_poll_options_owner_delete
  ON public.community_poll_options;
CREATE POLICY community_poll_options_owner_delete
  ON public.community_poll_options
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.community_polls cp
      JOIN public.posts p ON p.id = cp.post_id
      WHERE cp.id = poll_id
        AND p.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS community_poll_votes_own_select
  ON public.community_poll_votes;
CREATE POLICY community_poll_votes_own_select
  ON public.community_poll_votes
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS community_poll_votes_own_insert
  ON public.community_poll_votes;
CREATE POLICY community_poll_votes_own_insert
  ON public.community_poll_votes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1
      FROM public.community_poll_options cpo
      JOIN public.community_polls cp ON cp.id = cpo.poll_id
      JOIN public.posts p ON p.id = cp.post_id
      WHERE cpo.id = option_id
        AND (p.is_published = true OR p.user_id = (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS community_poll_votes_own_delete
  ON public.community_poll_votes;
CREATE POLICY community_poll_votes_own_delete
  ON public.community_poll_votes
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS season_archives_no_direct_access
  ON public.season_archives;
CREATE POLICY season_archives_no_direct_access
  ON public.season_archives
  FOR SELECT
  TO authenticated
  USING (false);
