-- User explicitly approved this drop (AskUserQuestion: "Yes, drop it").
-- The legacy `injuries` table is empty (0 rows), has no inbound foreign keys, and no DB
-- object reads it (verified pg_proc/pg_views/pg_trigger scan). All application readers
-- were repointed to athlete_injuries via v_injuries_unified, and the only writer
-- (performance-data handleInjuries CRUD) was removed as dead. v_injuries_unified is
-- defined on athlete_injuries, so it is unaffected by this drop.
-- Applied via Supabase MCP (schema_migrations version 20260604094612); mirrored here.
DROP TABLE IF EXISTS public.injuries;
