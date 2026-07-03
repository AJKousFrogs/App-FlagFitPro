-- Reconciliation: a V2.4 live-schema refresh (Supabase MCP introspection)
-- found competition_events.hotel_name/hotel_address already live with no
-- migration file and no code reference (column-level drift the
-- table-level DRIFT flag in docs/generated/DATA_MODEL.md can't catch).
-- IF NOT EXISTS so this is a no-op against the live project (columns exist)
-- and a correct forward migration for any fresh environment.
ALTER TABLE public.competition_events
  ADD COLUMN IF NOT EXISTS hotel_name text,
  ADD COLUMN IF NOT EXISTS hotel_address text;

COMMENT ON COLUMN public.competition_events.hotel_name IS
  'Team accommodation for a multi-day / international event. Unused by any code path today — reconciled for migration-history parity; a future travel/logistics screen is the natural consumer.';
