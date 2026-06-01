-- Cluster 3 dropped readiness_scores.athlete_id, but process_hard_deletion still deleted
-- via coalesce(user_id, athlete_id) → broken (caught by EXCEPTION, silently failing GDPR
-- hard-deletes). Repoint to user_id. (athlete_achievements.athlete_id left as-is — that
-- table is migrated in a later cluster, where this fn will be repointed again.)
CREATE OR REPLACE FUNCTION public.process_hard_deletion(p_request_id uuid)
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_email_hash text;
BEGIN
  SELECT user_id INTO v_user_id FROM public.account_deletion_requests
  WHERE id = p_request_id AND status = 'pending' LIMIT 1;

  IF v_user_id IS NULL THEN RETURN false; END IF;

  UPDATE public.account_deletion_requests SET status = 'processing', updated_at = now() WHERE id = p_request_id;

  SELECT md5(coalesce(email, v_user_id::text)) INTO v_email_hash FROM public.users WHERE id = v_user_id;

  UPDATE public.emergency_medical_records
  SET user_email_hash = coalesce(user_email_hash, v_email_hash), user_id = NULL, updated_at = now()
  WHERE user_id = v_user_id;

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
  IF to_regclass('public.athlete_achievements') IS NOT NULL THEN DELETE FROM public.athlete_achievements WHERE athlete_id = v_user_id; END IF;
  IF to_regclass('public.ai_response_feedback') IS NOT NULL THEN DELETE FROM public.ai_response_feedback WHERE user_id = v_user_id; END IF;
  IF to_regclass('public.daily_wellness_checkin') IS NOT NULL THEN DELETE FROM public.daily_wellness_checkin WHERE user_id = v_user_id; END IF;
  IF to_regclass('public.readiness_scores') IS NOT NULL THEN DELETE FROM public.readiness_scores WHERE user_id = v_user_id; END IF;
  IF to_regclass('public.wellness_logs') IS NOT NULL THEN DELETE FROM public.wellness_logs WHERE user_id = v_user_id; END IF;
  IF to_regclass('public.training_sessions') IS NOT NULL THEN DELETE FROM public.training_sessions WHERE user_id = v_user_id; END IF;
  IF to_regclass('public.notifications') IS NOT NULL THEN DELETE FROM public.notifications WHERE user_id = v_user_id; END IF;
  IF to_regclass('public.team_members') IS NOT NULL THEN DELETE FROM public.team_members WHERE user_id = v_user_id; END IF;

  UPDATE public.users
  SET email = 'deleted+' || id::text || '@deleted.local', first_name = NULL, last_name = NULL,
    full_name = 'Deleted User', name = 'Deleted User', phone = NULL, bio = NULL,
    profile_picture = NULL, profile_photo_url = NULL, avatar_url = NULL, position = NULL,
    height_cm = NULL, weight_kg = NULL, birth_date = NULL, date_of_birth = NULL,
    jersey_number = NULL, gender = NULL, is_active = false, account_status = 'deleted',
    email_verified = false, onboarding_completed = false, updated_at = now()
  WHERE id = v_user_id;

  UPDATE public.account_deletion_requests SET status = 'completed', hard_deleted_at = now(), updated_at = now() WHERE id = p_request_id;

  INSERT INTO public.privacy_audit_log (user_id, action, affected_table, affected_data)
  VALUES (NULL, 'deletion_completed', 'users',
    jsonb_build_object('request_id', p_request_id, 'email_hash', v_email_hash, 'completed_at', now()));

  RETURN true;
EXCEPTION WHEN OTHERS THEN
  UPDATE public.account_deletion_requests SET status = 'failed', error_message = SQLERRM, updated_at = now() WHERE id = p_request_id;
  INSERT INTO public.privacy_audit_log (user_id, action, affected_table, affected_data)
  VALUES (v_user_id, 'deletion_failed', 'account_deletion_requests',
    jsonb_build_object('request_id', p_request_id, 'error', SQLERRM));
  RETURN false;
END;
$function$;
