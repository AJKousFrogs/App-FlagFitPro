-- Compliance: cycle_tracking_entries + cycle_tracking_symptoms hold menstrual-cycle
-- data (GDPR Art. 9 special-category) with no lawful basis for a male-only 16+ club.
-- Both empty (0 rows), no inbound FKs, and the entire cycle-tracking code path
-- (frontend guard/endpoints + backend handler/routes) was already removed. Dropped
-- to eliminate the liability.
-- Applied via Supabase MCP (schema_migrations version 20260603214700); mirrored here.
DROP TABLE IF EXISTS public.cycle_tracking_symptoms;
DROP TABLE IF EXISTS public.cycle_tracking_entries;
