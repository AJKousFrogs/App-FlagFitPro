-- Clean up two live-runtime issues:
-- 1. Normalize legacy notification priorities to the current constraint set.
-- 2. Remove the recursive SELECT policy on team_members.

CREATE OR REPLACE FUNCTION public.normalize_notification_priority_value(
  p_priority text
)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE lower(coalesce(trim(p_priority), ''))
    WHEN 'low' THEN 'low'
    WHEN 'medium' THEN 'normal'
    WHEN 'normal' THEN 'normal'
    WHEN 'high' THEN 'high'
    WHEN 'critical' THEN 'urgent'
    WHEN 'urgent' THEN 'urgent'
    ELSE lower(nullif(trim(p_priority), ''))
  END
$$;

CREATE OR REPLACE FUNCTION public.normalize_notification_priority_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.priority IS NOT NULL THEN
    NEW.priority := public.normalize_notification_priority_value(NEW.priority);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notifications_normalize_priority
ON public.notifications;

CREATE TRIGGER notifications_normalize_priority
BEFORE INSERT OR UPDATE OF priority
ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.normalize_notification_priority_trigger();

UPDATE public.notifications
SET priority = public.normalize_notification_priority_value(priority)
WHERE priority IN ('medium', 'critical');

CREATE OR REPLACE FUNCTION public.auth_user_team_ids()
RETURNS uuid[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(array_agg(DISTINCT tm.team_id), '{}'::uuid[])
  FROM public.team_members tm
  WHERE tm.user_id = auth.uid()
$$;

REVOKE ALL ON FUNCTION public.auth_user_team_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auth_user_team_ids()
TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Users can view members of their own teams"
ON public.team_members;

CREATE POLICY "Users can view members of their own teams"
ON public.team_members
FOR SELECT
TO public
USING (team_id = ANY(public.auth_user_team_ids()));
