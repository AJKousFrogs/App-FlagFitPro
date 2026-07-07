-- Award variable training-completion points directly to player_training_stats.
-- training-complete.js previously inserted into user_achievements, a read-only
-- view (join of player_achievements x achievement_definitions) -- every insert
-- threw and was silently swallowed, so points never persisted.
CREATE OR REPLACE FUNCTION public.increment_training_points(p_user_id uuid, p_points integer)
 RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_total integer;
BEGIN
  IF p_points IS NULL OR p_points <= 0 THEN
    SELECT total_points INTO v_total FROM public.player_training_stats WHERE user_id = p_user_id;
    RETURN coalesce(v_total, 0);
  END IF;

  INSERT INTO public.player_training_stats (user_id, total_points)
  VALUES (p_user_id, p_points)
  ON CONFLICT (user_id) DO UPDATE
  SET total_points = public.player_training_stats.total_points + p_points,
      updated_at = now()
  RETURNING total_points INTO v_total;

  RETURN v_total;
END;
$function$;

REVOKE ALL ON FUNCTION public.increment_training_points(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_training_points(uuid, integer) TO service_role;
