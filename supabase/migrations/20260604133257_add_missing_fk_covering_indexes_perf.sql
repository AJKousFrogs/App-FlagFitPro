-- Performance advisor (unindexed_foreign_keys): these 2 FKs lacked covering indexes,
-- making joins/filters on them and ON DELETE checks do sequential scans.
-- Applied via Supabase MCP (schema_migrations version 20260604133257); mirrored here.
CREATE INDEX IF NOT EXISTS idx_meal_templates_created_by
  ON public.meal_templates (created_by);
CREATE INDEX IF NOT EXISTS idx_psychological_assessments_coach_id
  ON public.psychological_assessments (coach_id);
