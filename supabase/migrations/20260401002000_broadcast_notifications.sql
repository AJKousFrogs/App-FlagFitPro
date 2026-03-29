-- Auto-broadcast notifications via Supabase Realtime so clients can subscribe to the private channel without Postgres Changes

create or replace function public.broadcast_notification_change() returns trigger language plpgsql security definer as $$
declare
  target_channel text;
  payload jsonb;
begin
  if (tg_op = 'INSERT') then
    target_channel := 'notifications:' || new.user_id::text;
    payload := json_build_object(
      'operation', 'INSERT',
      'record', to_jsonb(new)
    );
    perform realtime.send(target_channel, 'notification_change', payload, true);
    return new;
  elsif (tg_op = 'UPDATE') then
    target_channel := 'notifications:' || new.user_id::text;
    payload := json_build_object(
      'operation', 'UPDATE',
      'record', to_jsonb(new),
      'old_record', to_jsonb(old)
    );
    perform realtime.send(target_channel, 'notification_change', payload, true);
    return new;
  elsif (tg_op = 'DELETE') then
    target_channel := 'notifications:' || old.user_id::text;
    payload := json_build_object(
      'operation', 'DELETE',
      'record', to_jsonb(old)
    );
    perform realtime.send(target_channel, 'notification_change', payload, true);
    return old;
  end if;
  return null;
end;
$$;

-- Drop the trigger if it already exists to avoid duplicates
DROP TRIGGER IF EXISTS notifications_broadcast_changes ON public.notifications;
CREATE TRIGGER notifications_broadcast_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.broadcast_notification_change();
