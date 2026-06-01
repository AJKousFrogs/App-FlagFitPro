
-- ============================================================================
-- RLS-2: Fix 9 ALL policies with NULL with_check
-- ============================================================================

DROP POLICY IF EXISTS "Users can manage own AI chat sessions" ON public.ai_chat_sessions;
CREATE POLICY "Users can manage own AI chat sessions" ON public.ai_chat_sessions
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own AI feedback" ON public.ai_feedback;
CREATE POLICY "Users can manage own AI feedback" ON public.ai_feedback
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own AI messages" ON public.ai_messages;
CREATE POLICY "Users can manage own AI messages" ON public.ai_messages
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own AI recommendations" ON public.ai_recommendations;
CREATE POLICY "Users can manage own AI recommendations" ON public.ai_recommendations
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Athletes can manage own sessions" ON public.sessions;
CREATE POLICY "Athletes can manage own sessions" ON public.sessions
  FOR ALL TO authenticated
  USING (athlete_id = auth.uid())
  WITH CHECK (athlete_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own supplements data" ON public.supplements_data;
CREATE POLICY "Users can manage own supplements data" ON public.supplements_data
  FOR ALL TO authenticated
  USING (user_id::text = auth.uid()::text)
  WITH CHECK (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Users can manage own notification preferences" ON public.user_notification_preferences;
CREATE POLICY "Users can manage own notification preferences" ON public.user_notification_preferences
  FOR ALL TO authenticated
  USING (user_id::text = auth.uid()::text)
  WITH CHECK (user_id::text = auth.uid()::text);

DROP POLICY IF EXISTS "Users can manage own watch history" ON public.video_watch_history;
CREATE POLICY "Users can manage own watch history" ON public.video_watch_history
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own wellness data" ON public.wellness_data;
CREATE POLICY "Users can manage own wellness data" ON public.wellness_data
  FOR ALL TO authenticated
  USING (user_id::text = auth.uid()::text)
  WITH CHECK (user_id::text = auth.uid()::text);

-- ============================================================================
-- RLS-1: Replace raw_user_meta_data role checks with team_members lookups
-- ============================================================================

DROP POLICY IF EXISTS "Coaches can create assignments" ON public.coach_athlete_assignments;
CREATE POLICY "Coaches can create assignments" ON public.coach_athlete_assignments
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.status = 'active'
        AND tm.role IN ('coach','head_coach','admin','owner','offense_coordinator','defense_coordinator','assistant_coach')
    )
  );

DROP POLICY IF EXISTS "merged_select_readiness_scores_public" ON public.readiness_scores;
CREATE POLICY "merged_select_readiness_scores_public" ON public.readiness_scores
  FOR SELECT TO public
  USING (
    athlete_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.coach_athlete_assignments
      WHERE coach_athlete_assignments.coach_id = auth.uid()
        AND coach_athlete_assignments.athlete_id = readiness_scores.athlete_id
    )
    OR EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.status = 'active'
        AND tm.role IN ('physiotherapist','medical_staff','admin','owner')
    )
  );

DROP POLICY IF EXISTS "merged_select_session_version_history_public" ON public.session_version_history;
CREATE POLICY "merged_select_session_version_history_public" ON public.session_version_history
  FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.training_sessions
      WHERE training_sessions.id = session_version_history.session_id
        AND training_sessions.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.training_sessions ts
      JOIN public.coach_athlete_assignments caa ON caa.athlete_id = ts.user_id
      WHERE ts.id = session_version_history.session_id
        AND caa.coach_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.status = 'active'
        AND tm.role IN ('physiotherapist','medical_staff','admin','owner')
    )
  );

DROP POLICY IF EXISTS "merged_update_training_sessions_public" ON public.training_sessions;
CREATE POLICY "merged_update_training_sessions_public" ON public.training_sessions
  FOR UPDATE TO public
  USING (
    (
      EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.user_id = auth.uid()
          AND tm.status = 'active'
          AND tm.role IN ('coach','head_coach','admin','owner','offense_coordinator','defense_coordinator','assistant_coach')
      )
      AND (
        (coach_locked = true AND modified_by_coach_id = auth.uid())
        OR (coach_locked = false AND session_state = ANY(ARRAY['PLANNED','GENERATED','VISIBLE','ACKNOWLEDGED']))
      )
    )
    OR (
      user_id = auth.uid()
      AND coach_locked = false
      AND session_state = ANY(ARRAY['PLANNED','GENERATED','VISIBLE','ACKNOWLEDGED'])
    )
  )
  WITH CHECK (
    (
      EXISTS (
        SELECT 1 FROM public.team_members tm
        WHERE tm.user_id = auth.uid()
          AND tm.status = 'active'
          AND tm.role IN ('coach','head_coach','admin','owner','offense_coordinator','defense_coordinator','assistant_coach')
      )
      AND (
        (coach_locked = true AND modified_by_coach_id = auth.uid())
        OR (coach_locked = false AND session_state = ANY(ARRAY['PLANNED','GENERATED','VISIBLE','ACKNOWLEDGED']))
      )
    )
    OR (
      user_id = auth.uid()
      AND coach_locked = false
      AND session_state = ANY(ARRAY['PLANNED','GENERATED','VISIBLE','ACKNOWLEDGED'])
    )
  );

-- ============================================================================
-- RLS-3: Tighten safety_override_log INSERT
-- ============================================================================
DROP POLICY IF EXISTS "Service role can log safety overrides" ON public.safety_override_log;
CREATE POLICY "Service role or relevant staff can log safety overrides" ON public.safety_override_log
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.role() = 'service_role'
    OR athlete_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.status = 'active'
        AND tm.role IN ('coach','head_coach','admin','owner','physiotherapist','medical_staff')
    )
  );

-- ============================================================================
-- RLS-4: Tighten consent_change_log INSERT (uses changed_by, not user_id)
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can log consent changes" ON public.consent_change_log;
CREATE POLICY "Users can log own consent changes" ON public.consent_change_log
  FOR INSERT TO authenticated
  WITH CHECK (changed_by = auth.uid());
