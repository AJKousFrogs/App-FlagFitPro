-- Advisor follow-ups on public.nutrition_reports (created the prior migration):
-- 1) index the created_by FK (covers ON DELETE SET NULL + author lookups).
-- 2) merge the two permissive SELECT policies (athlete-own + team-staff) into one
--    OR'd policy — identical access, one policy evaluated per row instead of two.
-- Applied via Supabase MCP (schema_migrations version 20260603151914); mirrored here.
CREATE INDEX IF NOT EXISTS idx_nutrition_reports_created_by
  ON public.nutrition_reports (created_by);

DROP POLICY IF EXISTS nutrition_reports_own_read ON public.nutrition_reports;
DROP POLICY IF EXISTS nutrition_reports_staff_read ON public.nutrition_reports;

CREATE POLICY nutrition_reports_read ON public.nutrition_reports
  FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR public.ff_is_team_staff(team_id, (SELECT auth.uid()))
  );
