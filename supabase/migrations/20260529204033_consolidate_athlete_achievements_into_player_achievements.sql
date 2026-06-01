-- Consolidate the legacy athlete_achievements (empty, write-only) into the canonical
-- player_achievements. The user_achievements view UNION'd both; athlete_achievements has
-- 0 rows so the legacy half contributes nothing. Simplify the view to canonical-only,
-- strip the dual-write/delete from the functions, then drop the dead table.

-- 1) view → canonical-only (CREATE OR REPLACE keeps grants + security_invoker)
CREATE OR REPLACE VIEW public.user_achievements WITH (security_invoker = true) AS
 SELECT pa.id,
    pa.user_id,
    ad.slug AS achievement_slug,
    ad.name AS achievement_name,
    ad.category,
    pa.earned_at AS unlocked_at,
    pa.context_data AS metadata
   FROM (SELECT auth.uid() AS uid) cu
     JOIN public.player_achievements pa ON pa.user_id = cu.uid
     JOIN public.achievement_definitions ad ON ad.id = pa.achievement_id;

-- 2) award_achievement → drop the legacy athlete_achievements dual-write
CREATE OR REPLACE FUNCTION public.award_achievement(p_user_id uuid, p_achievement_slug text, p_context jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_achievement_id uuid; v_points integer; v_award_id uuid; v_existing_award_id uuid;
BEGIN
  SELECT id, points INTO v_achievement_id, v_points
  FROM public.achievement_definitions WHERE slug = p_achievement_slug AND is_active = true LIMIT 1;
  IF v_achievement_id IS NULL THEN RETURN NULL; END IF;

  SELECT id INTO v_existing_award_id FROM public.player_achievements
  WHERE user_id = p_user_id AND achievement_id = v_achievement_id LIMIT 1;
  IF v_existing_award_id IS NOT NULL THEN RETURN v_existing_award_id; END IF;

  INSERT INTO public.player_achievements (user_id, achievement_id, context_data)
  VALUES (p_user_id, v_achievement_id, coalesce(p_context, '{}'::jsonb))
  RETURNING id INTO v_award_id;

  INSERT INTO public.player_training_stats (user_id, total_achievements, total_points)
  VALUES (p_user_id, 1, coalesce(v_points, 0))
  ON CONFLICT (user_id) DO UPDATE
  SET total_achievements = public.player_training_stats.total_achievements + 1,
      total_points = public.player_training_stats.total_points + coalesce(v_points, 0),
      updated_at = now();

  RETURN v_award_id;
END;
$function$;

-- 3) process_hard_deletion → drop the athlete_achievements delete (player_achievements already covered)
CREATE OR REPLACE FUNCTION public.process_hard_deletion(p_request_id uuid)
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_user_id uuid; v_email_hash text;
BEGIN
  SELECT user_id INTO v_user_id FROM public.account_deletion_requests WHERE id = p_request_id AND status = 'pending' LIMIT 1;
  IF v_user_id IS NULL THEN RETURN false; END IF;
  UPDATE public.account_deletion_requests SET status = 'processing', updated_at = now() WHERE id = p_request_id;
  SELECT md5(coalesce(email, v_user_id::text)) INTO v_email_hash FROM public.users WHERE id = v_user_id;
  UPDATE public.emergency_medical_records SET user_email_hash = coalesce(user_email_hash, v_email_hash), user_id = NULL, updated_at = now() WHERE user_id = v_user_id;
  IF to_regclass('public.community_poll_votes') IS NOT NULL THEN DELETE FROM public.community_poll_votes WHERE user_id = v_user_id; END IF;
  IF to_regclass('public.comment_likes') IS NOT NULL THEN DELETE FROM public.comment_likes WHERE user_id = v_user_id; END IF;
  IF to_regclass('public.post_bookmarks') IS NOT NULL THEN DELETE FROM public.post_bookmarks WHERE user_id = v_user_id; END IF;
  IF to_regclass('public.post_likes') IS NOT NULL THEN DELETE FROM public.post_likes WHERE user_id = v_user_id; END IF;
  IF to_regclass('public.post_comments') IS NOT NULL THEN DELETE FROM public.post_comments WHERE user_id = v_user_id; END IF;
  IF to_regclass('public.posts') IS NOT NULL THEN DELETE FROM public.posts WHERE user_id = v_user_id; END IF;
  IF to_regclass('public.qb_throwing_sessions') IS NOT NULL THEN DELETE FROM public.qb_throwing_sessions WHERE user_id = v_user_id; END IF;
  IF to_regclass('public.player_achievements') IS NOT NULL THEN DELETE FROM public.player_achievements WHERE user_id = v_user_id; END IF;
  IF to_regclass('public.player_streaks') IS NOT NULL THEN DELETE FROM public.player_streaks WHERE user_id = v_user_id; END IF;
  IF to_regclass('public.player_training_stats') IS NOT NULL THEN DELETE FROM public.player_training_stats WHERE user_id = v_user_id; END IF;
  IF to_regclass('public.learned_user_preferences') IS NOT NULL THEN DELETE FROM public.learned_user_preferences WHERE user_id = v_user_id; END IF;
  IF to_regclass('public.account_pause_requests') IS NOT NULL THEN DELETE FROM public.account_pause_requests WHERE user_id = v_user_id; END IF;
  IF to_regclass('public.ai_response_feedback') IS NOT NULL THEN DELETE FROM public.ai_response_feedback WHERE user_id = v_user_id; END IF;
  IF to_regclass('public.daily_wellness_checkin') IS NOT NULL THEN DELETE FROM public.daily_wellness_checkin WHERE user_id = v_user_id; END IF;
  IF to_regclass('public.readiness_scores') IS NOT NULL THEN DELETE FROM public.readiness_scores WHERE user_id = v_user_id; END IF;
  IF to_regclass('public.wellness_logs') IS NOT NULL THEN DELETE FROM public.wellness_logs WHERE user_id = v_user_id; END IF;
  IF to_regclass('public.training_sessions') IS NOT NULL THEN DELETE FROM public.training_sessions WHERE user_id = v_user_id; END IF;
  IF to_regclass('public.notifications') IS NOT NULL THEN DELETE FROM public.notifications WHERE user_id = v_user_id; END IF;
  IF to_regclass('public.team_members') IS NOT NULL THEN DELETE FROM public.team_members WHERE user_id = v_user_id; END IF;
  UPDATE public.users SET email = 'deleted+' || id::text || '@deleted.local', first_name = NULL, last_name = NULL,
    full_name = 'Deleted User', name = 'Deleted User', phone = NULL, bio = NULL, profile_picture = NULL,
    profile_photo_url = NULL, avatar_url = NULL, position = NULL, height_cm = NULL, weight_kg = NULL,
    birth_date = NULL, date_of_birth = NULL, jersey_number = NULL, gender = NULL, is_active = false,
    account_status = 'deleted', email_verified = false, onboarding_completed = false, updated_at = now()
  WHERE id = v_user_id;
  UPDATE public.account_deletion_requests SET status = 'completed', hard_deleted_at = now(), updated_at = now() WHERE id = p_request_id;
  INSERT INTO public.privacy_audit_log (user_id, action, affected_table, affected_data)
  VALUES (NULL, 'deletion_completed', 'users', jsonb_build_object('request_id', p_request_id, 'email_hash', v_email_hash, 'completed_at', now()));
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  UPDATE public.account_deletion_requests SET status = 'failed', error_message = SQLERRM, updated_at = now() WHERE id = p_request_id;
  INSERT INTO public.privacy_audit_log (user_id, action, affected_table, affected_data)
  VALUES (v_user_id, 'deletion_failed', 'account_deletion_requests', jsonb_build_object('request_id', p_request_id, 'error', SQLERRM));
  RETURN false;
END;
$function$;

-- 4) drop the dead legacy table (0 rows; no remaining refs)
DROP TABLE public.athlete_achievements;
