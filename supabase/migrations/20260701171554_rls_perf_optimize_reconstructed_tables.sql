-- prescription_audit_log, rtp_prescription_approvals, team_season_phases were
-- reconstructed from live schema (2026-06-25 doc clean-slate) after the original
-- files were never committed, so they missed the schema-wide RLS auth_rls_initplan
-- optimization pass (20260107/20260610073448) applied to every other table: bare
-- auth.uid() re-evaluates per row instead of once. Wrap as (select auth.uid()) and
-- scope from `public` to `authenticated` (anon has a null uid and never matched).
-- prescription_audit_log's two SELECT-only policies are merged (no write-permission
-- asymmetry, so merging is safe); rtp_prescription_approvals/team_season_phases keep
-- their separate athlete-read vs coach-ALL policies as-is (merging those would grant
-- the broader role's INSERT/UPDATE/DELETE rights to the narrower one -- out of scope
-- for a perf-only pass), leaving one still-flagged benign multiple_permissive_policies
-- warning on each.

DROP POLICY IF EXISTS pal_athlete_read ON public.prescription_audit_log;
DROP POLICY IF EXISTS pal_coach_read ON public.prescription_audit_log;
CREATE POLICY pal_read ON public.prescription_audit_log
  FOR SELECT TO authenticated
  USING (
    athlete_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.user_id = (SELECT auth.uid())
        AND tm.role::text = ANY (ARRAY['coach','head_coach','assistant_coach']::text[])
        AND EXISTS (
          SELECT 1 FROM public.team_members atm
          WHERE atm.team_id = tm.team_id
            AND atm.user_id = prescription_audit_log.athlete_id
        )
    )
  );

DROP POLICY IF EXISTS rpa_athlete_read ON public.rtp_prescription_approvals;
CREATE POLICY rpa_athlete_read ON public.rtp_prescription_approvals
  FOR SELECT TO authenticated
  USING (athlete_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS rpa_coach_read_update ON public.rtp_prescription_approvals;
CREATE POLICY rpa_coach_read_update ON public.rtp_prescription_approvals
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      JOIN public.team_members atm ON atm.team_id = tm.team_id
      WHERE tm.user_id = (SELECT auth.uid())
        AND tm.role::text = ANY (ARRAY['coach','head_coach','assistant_coach']::text[])
        AND atm.user_id = rtp_prescription_approvals.athlete_id
    )
  );

DROP POLICY IF EXISTS tsp_read ON public.team_season_phases;
CREATE POLICY tsp_read ON public.team_season_phases
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = team_season_phases.team_id
        AND team_members.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS tsp_coach_write ON public.team_season_phases;
CREATE POLICY tsp_coach_write ON public.team_season_phases
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = team_season_phases.team_id
        AND team_members.user_id = (SELECT auth.uid())
        AND team_members.role::text = ANY (ARRAY['coach','head_coach','assistant_coach']::text[])
    )
  );
