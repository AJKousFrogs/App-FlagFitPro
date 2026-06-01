-- Audit fix: repoint to event_availability (Phase 2a rename broke these). Param names kept
-- (the value passed is now a competition_event_id; the dormant Angular caller is reconciled
-- at the UI rebuild).
CREATE OR REPLACE FUNCTION public.calculate_player_tournament_cost(p_tournament_id uuid, p_team_id uuid)
 RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE total_cost numeric(10,2) := 0;
BEGIN
  SELECT COALESCE(SUM(amount_due), 0) INTO total_cost
  FROM public.event_availability
  WHERE competition_event_id = p_tournament_id AND team_id = p_team_id AND status = 'confirmed';
  RETURN total_cost;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_tournament_availability_summary(p_tournament_id uuid, p_team_id uuid)
 RETURNS TABLE(confirmed_count integer, declined_count integer, tentative_count integer, pending_count integer)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT COUNT(*) FILTER (WHERE status = 'confirmed')::integer,
         COUNT(*) FILTER (WHERE status = 'declined')::integer,
         COUNT(*) FILTER (WHERE status = 'tentative')::integer,
         COUNT(*) FILTER (WHERE status = 'pending')::integer
  FROM public.event_availability
  WHERE competition_event_id = p_tournament_id AND team_id = p_team_id;
END;
$function$;
