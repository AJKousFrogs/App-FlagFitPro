-- Remaining backend hardening after the runtime compatibility pass.
-- 1. Fix mutable search_path on notification priority normalization.
-- 2. Enable RLS on exposed template tables without breaking authenticated flows.
-- 3. Rewrite auth.uid()-based policies to use initplans.
-- 4. Add missing FK indexes flagged by Supabase advisors.

CREATE OR REPLACE FUNCTION public.normalize_notification_priority_value(
  p_priority text
)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE lower(coalesce(trim(p_priority), ''))
    WHEN 'low' THEN 'low'
    WHEN 'medium' THEN 'normal'
    WHEN 'normal' THEN 'normal'
    WHEN 'high' THEN 'high'
    WHEN 'critical' THEN 'urgent'
    WHEN 'urgent' THEN 'urgent'
    ELSE lower(nullif(trim(p_priority), ''))
  END
$$;

ALTER TABLE public.training_session_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_progressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movement_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warmup_protocols ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.training_session_templates FROM anon;
REVOKE ALL ON TABLE public.exercise_progressions FROM anon;
REVOKE ALL ON TABLE public.movement_patterns FROM anon;
REVOKE ALL ON TABLE public.warmup_protocols FROM anon;

DROP POLICY IF EXISTS training_session_templates_read_authenticated
  ON public.training_session_templates;
CREATE POLICY training_session_templates_read_authenticated
  ON public.training_session_templates
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS training_session_templates_insert_authenticated
  ON public.training_session_templates;
CREATE POLICY training_session_templates_insert_authenticated
  ON public.training_session_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS exercise_progressions_read_authenticated
  ON public.exercise_progressions;
CREATE POLICY exercise_progressions_read_authenticated
  ON public.exercise_progressions
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS movement_patterns_read_authenticated
  ON public.movement_patterns;
CREATE POLICY movement_patterns_read_authenticated
  ON public.movement_patterns
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS warmup_protocols_read_authenticated
  ON public.warmup_protocols;
CREATE POLICY warmup_protocols_read_authenticated
  ON public.warmup_protocols
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS ai_training_suggestions_own
  ON public.ai_training_suggestions;
CREATE POLICY ai_training_suggestions_own
  ON public.ai_training_suggestions
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS athlete_travel_log_own
  ON public.athlete_travel_log;
CREATE POLICY athlete_travel_log_own
  ON public.athlete_travel_log
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS daily_protocols_own
  ON public.daily_protocols;
CREATE POLICY daily_protocols_own
  ON public.daily_protocols
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS performance_tests_own
  ON public.performance_tests;
CREATE POLICY performance_tests_own
  ON public.performance_tests
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS return_to_play_protocols_own
  ON public.return_to_play_protocols;
CREATE POLICY return_to_play_protocols_own
  ON public.return_to_play_protocols
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = athlete_id)
  WITH CHECK ((SELECT auth.uid()) = athlete_id);

DROP POLICY IF EXISTS supplement_logs_own
  ON public.supplement_logs;
CREATE POLICY supplement_logs_own
  ON public.supplement_logs
  FOR ALL
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS protocol_exercises_via_protocol
  ON public.protocol_exercises;
CREATE POLICY protocol_exercises_via_protocol
  ON public.protocol_exercises
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.daily_protocols dp
      WHERE dp.id = protocol_exercises.protocol_id
        AND dp.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.daily_protocols dp
      WHERE dp.id = protocol_exercises.protocol_id
        AND dp.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Authenticated users can read approved or own knowledge entries"
  ON public.knowledge_base_entries;
CREATE POLICY "Authenticated users can read approved or own knowledge entries"
  ON public.knowledge_base_entries
  FOR SELECT
  TO authenticated
  USING (
    is_merlin_approved = true
    OR merlin_submitted_by = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.team_members tm
      WHERE tm.user_id = (SELECT auth.uid())
        AND tm.status = 'active'
        AND tm.role = 'nutritionist'
    )
  );

DROP POLICY IF EXISTS "Authenticated users can submit pending knowledge entries"
  ON public.knowledge_base_entries;
CREATE POLICY "Authenticated users can submit pending knowledge entries"
  ON public.knowledge_base_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    merlin_submitted_by = (SELECT auth.uid())
    AND is_merlin_approved = false
    AND merlin_approval_status = 'pending'
  );

DROP POLICY IF EXISTS "Nutritionists can review knowledge entries"
  ON public.knowledge_base_entries;
CREATE POLICY "Nutritionists can review knowledge entries"
  ON public.knowledge_base_entries
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.team_members tm
      WHERE tm.user_id = (SELECT auth.uid())
        AND tm.status = 'active'
        AND tm.role = 'nutritionist'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.team_members tm
      WHERE tm.user_id = (SELECT auth.uid())
        AND tm.status = 'active'
        AND tm.role = 'nutritionist'
    )
  );

DROP POLICY IF EXISTS "Knowledge review audit visible to nutritionists and submitters"
  ON public.knowledge_review_audit;
CREATE POLICY "Knowledge review audit visible to nutritionists and submitters"
  ON public.knowledge_review_audit
  FOR SELECT
  TO authenticated
  USING (
    reviewed_by = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.team_members tm
      WHERE tm.user_id = (SELECT auth.uid())
        AND tm.status = 'active'
        AND tm.role::text = ANY (
          ARRAY['nutritionist', 'admin', 'owner', 'head_coach']::text[]
        )
    )
    OR EXISTS (
      SELECT 1
      FROM public.knowledge_base_entries kbe
      WHERE kbe.id = knowledge_review_audit.entry_id
        AND kbe.merlin_submitted_by = (SELECT auth.uid())
    )
  );

CREATE INDEX IF NOT EXISTS idx_ai_training_suggestions_affected_session_id
  ON public.ai_training_suggestions(affected_session_id);

CREATE INDEX IF NOT EXISTS idx_daily_protocols_modified_by_coach_id
  ON public.daily_protocols(modified_by_coach_id);

CREATE INDEX IF NOT EXISTS idx_player_programs_program_id
  ON public.player_programs(program_id);

CREATE INDEX IF NOT EXISTS idx_player_programs_assigned_position_id
  ON public.player_programs(assigned_position_id);

CREATE INDEX IF NOT EXISTS idx_player_programs_current_phase_id
  ON public.player_programs(current_phase_id);

CREATE INDEX IF NOT EXISTS idx_protocol_exercises_exercise_id
  ON public.protocol_exercises(exercise_id);
