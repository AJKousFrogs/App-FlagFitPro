-- RLS audit 2026-07-09 (Finding A): the coach branch of the training_sessions
-- SELECT policy let any active team coach read ALL columns (rpe, workload,
-- performance_score, notes…) of team players with NO performance-sharing consent
-- check — bypassing v_training_sessions_consent, which exists precisely to gate
-- those columns behind can_view_player_performance (= coach on team AND
-- check_performance_sharing). Add the same check_performance_sharing gate to the
-- base-table coach SELECT branch so a coach cannot read a non-consenting player's
-- sessions via direct REST. Own-data branch (user_id = auth.uid()) is unchanged;
-- the UPDATE policy (coaching/assign, not viewing) is intentionally left as-is.
-- Verified live in rolled-back transactions: consenting player still visible (14
-- rows), non-consenting player -> 0 rows; athlete own-data intact.
DROP POLICY "merged_select_training_sessions_public" ON public.training_sessions;
CREATE POLICY "merged_select_training_sessions_public" ON public.training_sessions
  FOR SELECT TO authenticated
  USING (
    (user_id = (SELECT auth.uid()))
    OR (
      team_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.user_id = (SELECT auth.uid())
          AND tm.team_id = training_sessions.team_id
          AND tm.status = 'active'
          AND (tm.role)::text = ANY (ARRAY['coach','head_coach','admin','owner','offense_coordinator','defense_coordinator','assistant_coach'])
      )
      AND check_performance_sharing(training_sessions.user_id, training_sessions.team_id)
    )
  );
