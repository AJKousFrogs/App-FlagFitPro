-- Cluster 3 recreated merged_select_readiness_scores_public with bare auth.uid()
-- (the original used (SELECT auth.uid()), the initplan-optimized form that evaluates the
-- function once per query instead of once per row). Restore the optimization.
DROP POLICY IF EXISTS merged_select_readiness_scores_public ON public.readiness_scores;
CREATE POLICY merged_select_readiness_scores_public ON public.readiness_scores
  FOR SELECT TO public
  USING (
    (user_id = (SELECT auth.uid()))
    OR (EXISTS (SELECT 1 FROM public.coach_athlete_assignments caa
                WHERE caa.coach_id = (SELECT auth.uid()) AND caa.user_id = readiness_scores.user_id))
    OR (EXISTS (SELECT 1 FROM public.team_members tm
                WHERE tm.user_id = (SELECT auth.uid()) AND (tm.status)::text = 'active'
                  AND (tm.role)::text = ANY (ARRAY['physiotherapist','medical_staff','admin','owner']::text[])))
  );
