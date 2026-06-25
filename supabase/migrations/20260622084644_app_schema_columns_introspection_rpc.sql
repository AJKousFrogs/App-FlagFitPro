-- Read-only introspection used by the CI schema-drift guard
-- (scripts/check-schema-drift.mjs). Returns {table_name: [column_name, ...]} for
-- the public schema. SECURITY DEFINER so it can read information_schema; exposes
-- only column NAMES (no data), restricted to the service role.
create or replace function public.app_schema_columns()
returns jsonb
language sql
security definer
set search_path = public, information_schema
as $$
  select coalesce(jsonb_object_agg(t, cols), '{}'::jsonb)
  from (
    select table_name as t, jsonb_agg(column_name order by ordinal_position) as cols
    from information_schema.columns
    where table_schema = 'public'
    group by table_name
  ) s;
$$;

revoke all on function public.app_schema_columns() from public, anon, authenticated;
grant execute on function public.app_schema_columns() to service_role;
