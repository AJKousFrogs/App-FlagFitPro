-- Persisted nutrition reports. The nutritionist's "Generate report" computed a
-- report and discarded it; now it's stored so the athlete can read their own in
-- the Reports screen (closing the staff→athlete loop). Privacy-first: athlete
-- reads only their own; team staff (nutritionist/coach) read for their team.
-- Applied via Supabase MCP (schema_migrations version 20260603145622); mirrored here.
CREATE TABLE IF NOT EXISTS public.nutrition_reports (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  -- the athlete
  created_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,          -- the staff author
  team_id      uuid,
  report_type  varchar(20) NOT NULL DEFAULT 'weekly',
  report_data  jsonb NOT NULL DEFAULT '{}',
  period_start date,
  period_end   date,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nutrition_reports_user
  ON public.nutrition_reports (user_id, created_at DESC);

ALTER TABLE public.nutrition_reports ENABLE ROW LEVEL SECURITY;

-- Athlete reads their own reports.
CREATE POLICY nutrition_reports_own_read ON public.nutrition_reports
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

-- Team staff (nutritionist/coach) read reports for their team.
CREATE POLICY nutrition_reports_staff_read ON public.nutrition_reports
  FOR SELECT
  USING (public.ff_is_team_staff(team_id, (SELECT auth.uid())));

-- Team staff create reports for their team's athletes.
CREATE POLICY nutrition_reports_staff_write ON public.nutrition_reports
  FOR INSERT
  WITH CHECK (public.ff_is_team_staff(team_id, (SELECT auth.uid())));
