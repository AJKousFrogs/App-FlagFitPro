-- Migration: Optimize RLS Policies with Auth Initialization Plan
-- Date: 2026-01-07
-- Purpose: Wrap auth.uid() and auth.role() calls with (select ...) to prevent
--          re-evaluation for each row, significantly improving query performance

-- ============================================================================
-- SAFETY OVERRIDE LOG
-- ============================================================================

-- Service role can read safety overrides
DROP POLICY IF EXISTS "Service role can read safety overrides" ON public.safety_override_log;
CREATE POLICY "Service role can read safety overrides"
ON public.safety_override_log
FOR SELECT
USING ((select auth.role()) = 'service_role');

-- Service role can log safety overrides
DROP POLICY IF EXISTS "Service role can log safety overrides" ON public.safety_override_log;
CREATE POLICY "Service role can log safety overrides"
ON public.safety_override_log
FOR INSERT
WITH CHECK (
    (select auth.role()) = 'service_role'
    OR (select auth.role()) = 'authenticated'
);

-- Athletes can view own safety overrides
DROP POLICY IF EXISTS "Athletes can view own safety overrides" ON public.safety_override_log;
CREATE POLICY "Athletes can view own safety overrides"
ON public.safety_override_log
FOR SELECT
USING (athlete_id = (select auth.uid()));

-- Coaches can view athlete safety overrides
DROP POLICY IF EXISTS "Coaches can view athlete safety overrides" ON public.safety_override_log;
CREATE POLICY "Coaches can view athlete safety overrides"
ON public.safety_override_log
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.coach_athlete_assignments
        WHERE coach_id = (select auth.uid())
        AND athlete_id = safety_override_log.athlete_id
    )
    OR EXISTS (
        SELECT 1 FROM public.team_members tm1
        JOIN public.team_members tm2 ON tm1.team_id = tm2.team_id
        WHERE tm1.user_id = (select auth.uid())
        AND tm1.role IN ('coach', 'head_coach', 'assistant_coach')
        AND tm2.user_id = safety_override_log.athlete_id
        AND tm1.status = 'active'
        AND tm2.status = 'active'
    )
);

-- ============================================================================
-- EXECUTION LOGS
-- ============================================================================

-- Athletes can log execution
DROP POLICY IF EXISTS "Athletes can log execution" ON public.execution_logs;
CREATE POLICY "Athletes can log execution"
ON public.execution_logs
FOR INSERT
WITH CHECK (athlete_id = (select auth.uid()));

-- Athletes can read own logs
DROP POLICY IF EXISTS "Athletes can read own logs" ON public.execution_logs;
CREATE POLICY "Athletes can read own logs"
ON public.execution_logs
FOR SELECT
USING (athlete_id = (select auth.uid()));

-- Coaches can read athlete logs
DROP POLICY IF EXISTS "Coaches can read athlete logs" ON public.execution_logs;
CREATE POLICY "Coaches can read athlete logs"
ON public.execution_logs
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.coach_athlete_assignments
        WHERE coach_id = (select auth.uid())
        AND athlete_id = execution_logs.athlete_id
    )
);

-- ============================================================================
-- WELLNESS LOGS
-- ============================================================================

-- Athletes full access wellness logs
DROP POLICY IF EXISTS "Athletes full access wellness logs" ON public.wellness_logs;
CREATE POLICY "Athletes full access wellness logs"
ON public.wellness_logs
FOR ALL
USING (athlete_id = (select auth.uid()))
WITH CHECK (athlete_id = (select auth.uid()));

-- Coaches compliance only wellness
DROP POLICY IF EXISTS "Coaches compliance only wellness" ON public.wellness_logs;
CREATE POLICY "Coaches compliance only wellness"
ON public.wellness_logs
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.coach_athlete_assignments
        WHERE coach_id = (select auth.uid())
        AND athlete_id = wellness_logs.athlete_id
    )
);

-- Medical full access wellness
DROP POLICY IF EXISTS "Medical full access wellness" ON public.wellness_logs;
CREATE POLICY "Medical full access wellness"
ON public.wellness_logs
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = ANY (ARRAY['physio', 'medical_staff', 'admin'])
    )
);

-- ============================================================================
-- COACH ATHLETE ASSIGNMENTS
-- ============================================================================

-- Coaches can view own assignments
DROP POLICY IF EXISTS "Coaches can view own assignments" ON public.coach_athlete_assignments;
CREATE POLICY "Coaches can view own assignments"
ON public.coach_athlete_assignments
FOR SELECT
USING (coach_id = (select auth.uid()));

-- Athletes can view own assignments
DROP POLICY IF EXISTS "Athletes can view own assignments" ON public.coach_athlete_assignments;
CREATE POLICY "Athletes can view own assignments"
ON public.coach_athlete_assignments
FOR SELECT
USING (athlete_id = (select auth.uid()));

-- Coaches can create assignments
DROP POLICY IF EXISTS "Coaches can create assignments" ON public.coach_athlete_assignments;
CREATE POLICY "Coaches can create assignments"
ON public.coach_athlete_assignments
FOR INSERT
WITH CHECK (
    coach_id = (select auth.uid())
    AND EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = ANY (ARRAY['coach', 'admin'])
    )
);

-- Coaches can update own assignments
DROP POLICY IF EXISTS "Coaches can update own assignments" ON public.coach_athlete_assignments;
CREATE POLICY "Coaches can update own assignments"
ON public.coach_athlete_assignments
FOR UPDATE
USING (coach_id = (select auth.uid()))
WITH CHECK (coach_id = (select auth.uid()));

-- Coaches can delete own assignments
DROP POLICY IF EXISTS "Coaches can delete own assignments" ON public.coach_athlete_assignments;
CREATE POLICY "Coaches can delete own assignments"
ON public.coach_athlete_assignments
FOR DELETE
USING (coach_id = (select auth.uid()));

-- Admins full access coach assignments
DROP POLICY IF EXISTS "Admins full access coach assignments" ON public.coach_athlete_assignments;
CREATE POLICY "Admins full access coach assignments"
ON public.coach_athlete_assignments
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- ============================================================================
-- TOURNAMENT PARTICIPATION
-- ============================================================================

-- Users can view tournament participation
DROP POLICY IF EXISTS "Users can view tournament participation" ON public.tournament_participation;
CREATE POLICY "Users can view tournament participation"
ON public.tournament_participation
FOR SELECT
USING (
    team_id IN (
        SELECT team_members.team_id
        FROM team_members
        WHERE team_members.user_id = (select auth.uid())
    )
    OR EXISTS (
        SELECT 1 FROM tournaments
        WHERE tournaments.id = tournament_participation.tournament_id
        AND (tournaments.created_by = (select auth.uid()) OR tournaments.created_by IS NULL)
    )
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- Team admins can create participation
DROP POLICY IF EXISTS "Team admins can create participation" ON public.tournament_participation;
CREATE POLICY "Team admins can create participation"
ON public.tournament_participation
FOR INSERT
WITH CHECK (
    team_id IN (
        SELECT team_members.team_id
        FROM team_members
        WHERE team_members.user_id = (select auth.uid())
        AND team_members.role = ANY (ARRAY['admin', 'coach'])
    )
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- Team admins can update participation
DROP POLICY IF EXISTS "Team admins can update participation" ON public.tournament_participation;
CREATE POLICY "Team admins can update participation"
ON public.tournament_participation
FOR UPDATE
USING (
    team_id IN (
        SELECT team_members.team_id
        FROM team_members
        WHERE team_members.user_id = (select auth.uid())
        AND team_members.role = ANY (ARRAY['admin', 'coach'])
    )
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
)
WITH CHECK (
    team_id IN (
        SELECT team_members.team_id
        FROM team_members
        WHERE team_members.user_id = (select auth.uid())
        AND team_members.role = ANY (ARRAY['admin', 'coach'])
    )
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- Admins can delete participation
DROP POLICY IF EXISTS "Admins can delete participation" ON public.tournament_participation;
CREATE POLICY "Admins can delete participation"
ON public.tournament_participation
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- ============================================================================
-- MOVEMENT PATTERNS
-- ============================================================================

-- Users can insert movement patterns
DROP POLICY IF EXISTS "Users can insert movement patterns" ON public.movement_patterns;
CREATE POLICY "Users can insert movement patterns"
ON public.movement_patterns
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM training_programs tp
        WHERE tp.id = movement_patterns.program_id
        AND (
            tp.created_by = (select auth.uid())
            OR tp.team_id IN (
                SELECT team_members.team_id
                FROM team_members
                WHERE team_members.user_id = (select auth.uid())
                AND team_members.role = ANY (ARRAY['admin', 'coach'])
            )
        )
    )
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- Users can update movement patterns
DROP POLICY IF EXISTS "Users can update movement patterns" ON public.movement_patterns;
CREATE POLICY "Users can update movement patterns"
ON public.movement_patterns
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM training_programs tp
        WHERE tp.id = movement_patterns.program_id
        AND (
            tp.created_by = (select auth.uid())
            OR tp.team_id IN (
                SELECT team_members.team_id
                FROM team_members
                WHERE team_members.user_id = (select auth.uid())
                AND team_members.role = ANY (ARRAY['admin', 'coach'])
            )
        )
    )
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM training_programs tp
        WHERE tp.id = movement_patterns.program_id
        AND (
            tp.created_by = (select auth.uid())
            OR tp.team_id IN (
                SELECT team_members.team_id
                FROM team_members
                WHERE team_members.user_id = (select auth.uid())
                AND team_members.role = ANY (ARRAY['admin', 'coach'])
            )
        )
    )
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- ============================================================================
-- WARMUP PROTOCOLS
-- ============================================================================

-- Users can insert warmup protocols
DROP POLICY IF EXISTS "Users can insert warmup protocols" ON public.warmup_protocols;
CREATE POLICY "Users can insert warmup protocols"
ON public.warmup_protocols
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM training_programs tp
        WHERE tp.id = warmup_protocols.program_id
        AND (
            tp.created_by = (select auth.uid())
            OR tp.team_id IN (
                SELECT team_members.team_id
                FROM team_members
                WHERE team_members.user_id = (select auth.uid())
                AND team_members.role = ANY (ARRAY['admin', 'coach'])
            )
        )
    )
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- Users can update warmup protocols
DROP POLICY IF EXISTS "Users can update warmup protocols" ON public.warmup_protocols;
CREATE POLICY "Users can update warmup protocols"
ON public.warmup_protocols
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM training_programs tp
        WHERE tp.id = warmup_protocols.program_id
        AND (
            tp.created_by = (select auth.uid())
            OR tp.team_id IN (
                SELECT team_members.team_id
                FROM team_members
                WHERE team_members.user_id = (select auth.uid())
                AND team_members.role = ANY (ARRAY['admin', 'coach'])
            )
        )
    )
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM training_programs tp
        WHERE tp.id = warmup_protocols.program_id
        AND (
            tp.created_by = (select auth.uid())
            OR tp.team_id IN (
                SELECT team_members.team_id
                FROM team_members
                WHERE team_members.user_id = (select auth.uid())
                AND team_members.role = ANY (ARRAY['admin', 'coach'])
            )
        )
    )
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- ============================================================================
-- AI COACH VISIBILITY
-- ============================================================================

-- Authenticated users can create coach visibility records
DROP POLICY IF EXISTS "Authenticated users can create coach visibility records" ON public.ai_coach_visibility;
CREATE POLICY "Authenticated users can create coach visibility records"
ON public.ai_coach_visibility
FOR INSERT
WITH CHECK ((select auth.role()) = 'authenticated');

-- Coaches can view coach visibility records
DROP POLICY IF EXISTS "Coaches can view coach visibility records" ON public.ai_coach_visibility;
CREATE POLICY "Coaches can view coach visibility records"
ON public.ai_coach_visibility
FOR SELECT
USING (coach_id = (select auth.uid()));

-- Athletes can view own visibility records
DROP POLICY IF EXISTS "Athletes can view own visibility records" ON public.ai_coach_visibility;
CREATE POLICY "Athletes can view own visibility records"
ON public.ai_coach_visibility
FOR SELECT
USING (player_id = (select auth.uid()));

-- ============================================================================
-- COACH ACTIVITY LOG
-- ============================================================================

-- Authenticated users can insert activity logs
DROP POLICY IF EXISTS "Authenticated users can insert activity logs" ON public.coach_activity_log;
CREATE POLICY "Authenticated users can insert activity logs"
ON public.coach_activity_log
FOR INSERT
WITH CHECK ((select auth.role()) = 'authenticated');

-- Coaches can view activity logs
DROP POLICY IF EXISTS "Coaches can view activity logs" ON public.coach_activity_log;
CREATE POLICY "Coaches can view activity logs"
ON public.coach_activity_log
FOR SELECT
USING (coach_id = (select auth.uid()));

-- ============================================================================
-- CONSENT CHANGE LOG
-- ============================================================================

-- Authenticated users can log consent changes
DROP POLICY IF EXISTS "Authenticated users can log consent changes" ON public.consent_change_log;
CREATE POLICY "Authenticated users can log consent changes"
ON public.consent_change_log
FOR INSERT
WITH CHECK ((select auth.role()) = 'authenticated');

-- Users can view own consent change logs
DROP POLICY IF EXISTS "Users can view own consent change logs" ON public.consent_change_log;
CREATE POLICY "Users can view own consent change logs"
ON public.consent_change_log
FOR SELECT
USING (athlete_id = (select auth.uid()) OR changed_by = (select auth.uid()));

-- ============================================================================
-- DEPTH CHART HISTORY
-- ============================================================================

-- Authenticated users can insert depth chart history
DROP POLICY IF EXISTS "Authenticated users can insert depth chart history" ON public.depth_chart_history;
CREATE POLICY "Authenticated users can insert depth chart history"
ON public.depth_chart_history
FOR INSERT
WITH CHECK ((select auth.role()) = 'authenticated');

-- Team members can view depth chart history
DROP POLICY IF EXISTS "Team members can view depth chart history" ON public.depth_chart_history;
CREATE POLICY "Team members can view depth chart history"
ON public.depth_chart_history
FOR SELECT
USING (
    player_id = (select auth.uid())
    OR changed_by = (select auth.uid())
);

-- ============================================================================
-- MERLIN VIOLATION LOG
-- ============================================================================

-- Service role can log merlin violations
DROP POLICY IF EXISTS "Service role can log merlin violations" ON public.merlin_violation_log;
CREATE POLICY "Service role can log merlin violations"
ON public.merlin_violation_log
FOR INSERT
WITH CHECK (
    (select auth.role()) = 'service_role'
    OR (select auth.role()) = 'authenticated'
);

-- Service role reads merlin violations
DROP POLICY IF EXISTS "Service role reads merlin violations" ON public.merlin_violation_log;
CREATE POLICY "Service role reads merlin violations"
ON public.merlin_violation_log
FOR SELECT
USING ((select auth.role()) = 'service_role');

-- ============================================================================
-- ROSTER AUDIT LOG
-- ============================================================================

-- Authenticated users can insert roster audit logs
DROP POLICY IF EXISTS "Authenticated users can insert roster audit logs" ON public.roster_audit_log;
CREATE POLICY "Authenticated users can insert roster audit logs"
ON public.roster_audit_log
FOR INSERT
WITH CHECK ((select auth.role()) = 'authenticated');

-- ============================================================================
-- RESEARCH ARTICLES
-- ============================================================================

-- Authenticated users can read research articles
DROP POLICY IF EXISTS "Authenticated users can read research articles" ON public.research_articles;
CREATE POLICY "Authenticated users can read research articles"
ON public.research_articles
FOR SELECT
USING ((select auth.role()) = 'authenticated');

-- Admins can create research articles
DROP POLICY IF EXISTS "Admins can create research articles" ON public.research_articles;
CREATE POLICY "Admins can create research articles"
ON public.research_articles
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND (
            raw_user_meta_data->>'role' = 'admin'
            OR raw_user_meta_data->>'verified' = 'true'
        )
    )
);

-- Admins can update research articles
DROP POLICY IF EXISTS "Admins can update research articles" ON public.research_articles;
CREATE POLICY "Admins can update research articles"
ON public.research_articles
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND (
            raw_user_meta_data->>'role' = 'admin'
            OR raw_user_meta_data->>'verified' = 'true'
        )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND (
            raw_user_meta_data->>'role' = 'admin'
            OR raw_user_meta_data->>'verified' = 'true'
        )
    )
);

-- Admins can delete research articles
DROP POLICY IF EXISTS "Admins can delete research articles" ON public.research_articles;
CREATE POLICY "Admins can delete research articles"
ON public.research_articles
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- ============================================================================
-- EXERCISES
-- ============================================================================

-- Authenticated users can insert exercises
DROP POLICY IF EXISTS "Authenticated users can insert exercises" ON public.exercises;
CREATE POLICY "Authenticated users can insert exercises"
ON public.exercises
FOR INSERT
WITH CHECK ((select auth.role()) = 'authenticated');

-- ============================================================================
-- SESSION EXERCISES
-- ============================================================================

-- Users can insert session exercises
DROP POLICY IF EXISTS "Users can insert session exercises" ON public.session_exercises;
CREATE POLICY "Users can insert session exercises"
ON public.session_exercises
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM training_session_templates tst
        JOIN training_weeks tw ON tst.week_id = tw.id
        JOIN training_phases tp ON tw.phase_id = tp.id
        JOIN training_programs tpr ON tp.program_id = tpr.id
        WHERE tst.id = session_exercises.session_template_id
        AND (
            tpr.created_by = (select auth.uid())
            OR tpr.team_id IN (
                SELECT team_members.team_id
                FROM team_members
                WHERE team_members.user_id = (select auth.uid())
                AND team_members.role = ANY (ARRAY['admin', 'coach'])
            )
        )
    )
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- Users can update session exercises
DROP POLICY IF EXISTS "Users can update session exercises" ON public.session_exercises;
CREATE POLICY "Users can update session exercises"
ON public.session_exercises
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM training_session_templates tst
        JOIN training_weeks tw ON tst.week_id = tw.id
        JOIN training_phases tp ON tw.phase_id = tp.id
        JOIN training_programs tpr ON tp.program_id = tpr.id
        WHERE tst.id = session_exercises.session_template_id
        AND (
            tpr.created_by = (select auth.uid())
            OR tpr.team_id IN (
                SELECT team_members.team_id
                FROM team_members
                WHERE team_members.user_id = (select auth.uid())
                AND team_members.role = ANY (ARRAY['admin', 'coach'])
            )
        )
    )
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM training_session_templates tst
        JOIN training_weeks tw ON tst.week_id = tw.id
        JOIN training_phases tp ON tw.phase_id = tp.id
        JOIN training_programs tpr ON tp.program_id = tpr.id
        WHERE tst.id = session_exercises.session_template_id
        AND (
            tpr.created_by = (select auth.uid())
            OR tpr.team_id IN (
                SELECT team_members.team_id
                FROM team_members
                WHERE team_members.user_id = (select auth.uid())
                AND team_members.role = ANY (ARRAY['admin', 'coach'])
            )
        )
    )
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- ============================================================================
-- TRAINING PHASES
-- ============================================================================

-- Users can insert training phases
DROP POLICY IF EXISTS "Users can insert training phases" ON public.training_phases;
CREATE POLICY "Users can insert training phases"
ON public.training_phases
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM training_programs tp
        WHERE tp.id = training_phases.program_id
        AND (
            tp.created_by = (select auth.uid())
            OR tp.team_id IN (
                SELECT team_members.team_id
                FROM team_members
                WHERE team_members.user_id = (select auth.uid())
                AND team_members.role = ANY (ARRAY['admin', 'coach'])
            )
        )
    )
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- Users can update training phases
DROP POLICY IF EXISTS "Users can update training phases" ON public.training_phases;
CREATE POLICY "Users can update training phases"
ON public.training_phases
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM training_programs tp
        WHERE tp.id = training_phases.program_id
        AND (
            tp.created_by = (select auth.uid())
            OR tp.team_id IN (
                SELECT team_members.team_id
                FROM team_members
                WHERE team_members.user_id = (select auth.uid())
                AND team_members.role = ANY (ARRAY['admin', 'coach'])
            )
        )
    )
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM training_programs tp
        WHERE tp.id = training_phases.program_id
        AND (
            tp.created_by = (select auth.uid())
            OR tp.team_id IN (
                SELECT team_members.team_id
                FROM team_members
                WHERE team_members.user_id = (select auth.uid())
                AND team_members.role = ANY (ARRAY['admin', 'coach'])
            )
        )
    )
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- ============================================================================
-- TRAINING WEEKS
-- ============================================================================

-- Users can insert training weeks
DROP POLICY IF EXISTS "Users can insert training weeks" ON public.training_weeks;
CREATE POLICY "Users can insert training weeks"
ON public.training_weeks
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM training_phases tp
        JOIN training_programs tpr ON tp.program_id = tpr.id
        WHERE tp.id = training_weeks.phase_id
        AND (
            tpr.created_by = (select auth.uid())
            OR tpr.team_id IN (
                SELECT team_members.team_id
                FROM team_members
                WHERE team_members.user_id = (select auth.uid())
                AND team_members.role = ANY (ARRAY['admin', 'coach'])
            )
        )
    )
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- Users can update training weeks
DROP POLICY IF EXISTS "Users can update training weeks" ON public.training_weeks;
CREATE POLICY "Users can update training weeks"
ON public.training_weeks
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM training_phases tp
        JOIN training_programs tpr ON tp.program_id = tpr.id
        WHERE tp.id = training_weeks.phase_id
        AND (
            tpr.created_by = (select auth.uid())
            OR tpr.team_id IN (
                SELECT team_members.team_id
                FROM team_members
                WHERE team_members.user_id = (select auth.uid())
                AND team_members.role = ANY (ARRAY['admin', 'coach'])
            )
        )
    )
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM training_phases tp
        JOIN training_programs tpr ON tp.program_id = tpr.id
        WHERE tp.id = training_weeks.phase_id
        AND (
            tpr.created_by = (select auth.uid())
            OR tpr.team_id IN (
                SELECT team_members.team_id
                FROM team_members
                WHERE team_members.user_id = (select auth.uid())
                AND team_members.role = ANY (ARRAY['admin', 'coach'])
            )
        )
    )
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- ============================================================================
-- TRAINING SESSION TEMPLATES
-- ============================================================================

-- Users can insert session templates
DROP POLICY IF EXISTS "Users can insert session templates" ON public.training_session_templates;
CREATE POLICY "Users can insert session templates"
ON public.training_session_templates
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM training_weeks tw
        JOIN training_phases tp ON tw.phase_id = tp.id
        JOIN training_programs tpr ON tp.program_id = tpr.id
        WHERE tw.id = training_session_templates.week_id
        AND (
            tpr.created_by = (select auth.uid())
            OR tpr.team_id IN (
                SELECT team_members.team_id
                FROM team_members
                WHERE team_members.user_id = (select auth.uid())
                AND team_members.role = ANY (ARRAY['admin', 'coach'])
            )
        )
    )
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- Users can update session templates
DROP POLICY IF EXISTS "Users can update session templates" ON public.training_session_templates;
CREATE POLICY "Users can update session templates"
ON public.training_session_templates
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM training_weeks tw
        JOIN training_phases tp ON tw.phase_id = tp.id
        JOIN training_programs tpr ON tp.program_id = tpr.id
        WHERE tw.id = training_session_templates.week_id
        AND (
            tpr.created_by = (select auth.uid())
            OR tpr.team_id IN (
                SELECT team_members.team_id
                FROM team_members
                WHERE team_members.user_id = (select auth.uid())
                AND team_members.role = ANY (ARRAY['admin', 'coach'])
            )
        )
    )
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM training_weeks tw
        JOIN training_phases tp ON tw.phase_id = tp.id
        JOIN training_programs tpr ON tp.program_id = tpr.id
        WHERE tw.id = training_session_templates.week_id
        AND (
            tpr.created_by = (select auth.uid())
            OR tpr.team_id IN (
                SELECT team_members.team_id
                FROM team_members
                WHERE team_members.user_id = (select auth.uid())
                AND team_members.role = ANY (ARRAY['admin', 'coach'])
            )
        )
    )
    OR EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = 'admin'
    )
);

-- ============================================================================
-- TEAM ACTIVITIES
-- ============================================================================

-- Coaches can view team activities
DROP POLICY IF EXISTS "Coaches can view team activities" ON public.team_activities;
CREATE POLICY "Coaches can view team activities"
ON public.team_activities
FOR SELECT
USING (
    team_id IN (
        SELECT tm.team_id
        FROM team_members tm
        WHERE tm.user_id = (select auth.uid())
        AND tm.role = 'coach'
    )
);

-- Athletes can view team activities
DROP POLICY IF EXISTS "Athletes can view team activities" ON public.team_activities;
CREATE POLICY "Athletes can view team activities"
ON public.team_activities
FOR SELECT
USING (
    team_id IN (
        SELECT team_members.team_id
        FROM team_members
        WHERE team_members.user_id = (select auth.uid())
        AND team_members.status = 'active'
    )
);

-- Coaches can create team activities
DROP POLICY IF EXISTS "Coaches can create team activities" ON public.team_activities;
CREATE POLICY "Coaches can create team activities"
ON public.team_activities
FOR INSERT
WITH CHECK (
    team_id IN (
        SELECT tm.team_id
        FROM team_members tm
        WHERE tm.user_id = (select auth.uid())
        AND tm.role = 'coach'
    )
    AND created_by_coach_id = (select auth.uid())
);

-- Coaches can update team activities
DROP POLICY IF EXISTS "Coaches can update team activities" ON public.team_activities;
CREATE POLICY "Coaches can update team activities"
ON public.team_activities
FOR UPDATE
USING (
    team_id IN (
        SELECT tm.team_id
        FROM team_members tm
        WHERE tm.user_id = (select auth.uid())
        AND tm.role = 'coach'
    )
);

-- Coaches can delete team activities
DROP POLICY IF EXISTS "Coaches can delete team activities" ON public.team_activities;
CREATE POLICY "Coaches can delete team activities"
ON public.team_activities
FOR DELETE
USING (
    team_id IN (
        SELECT tm.team_id
        FROM team_members tm
        WHERE tm.user_id = (select auth.uid())
        AND tm.role = 'coach'
    )
);

-- ============================================================================
-- TEAM ACTIVITY ATTENDANCE
-- ============================================================================

-- Coaches can view attendance
DROP POLICY IF EXISTS "Coaches can view attendance" ON public.team_activity_attendance;
CREATE POLICY "Coaches can view attendance"
ON public.team_activity_attendance
FOR SELECT
USING (
    activity_id IN (
        SELECT team_activities.id
        FROM team_activities
        WHERE team_activities.team_id IN (
            SELECT tm.team_id
            FROM team_members tm
            WHERE tm.user_id = (select auth.uid())
            AND tm.role = 'coach'
        )
    )
);

-- Athletes can view own attendance
DROP POLICY IF EXISTS "Athletes can view own attendance" ON public.team_activity_attendance;
CREATE POLICY "Athletes can view own attendance"
ON public.team_activity_attendance
FOR SELECT
USING (athlete_id = (select auth.uid()));

-- Coaches can manage attendance
DROP POLICY IF EXISTS "Coaches can manage attendance" ON public.team_activity_attendance;
CREATE POLICY "Coaches can manage attendance"
ON public.team_activity_attendance
FOR ALL
USING (
    activity_id IN (
        SELECT team_activities.id
        FROM team_activities
        WHERE team_activities.team_id IN (
            SELECT tm.team_id
            FROM team_members tm
            WHERE tm.user_id = (select auth.uid())
            AND tm.role = 'coach'
        )
    )
);

-- ============================================================================
-- TEAM ACTIVITY AUDIT
-- ============================================================================

-- Coaches can view audit logs
DROP POLICY IF EXISTS "Coaches can view audit logs" ON public.team_activity_audit;
CREATE POLICY "Coaches can view audit logs"
ON public.team_activity_audit
FOR SELECT
USING (
    activity_id IN (
        SELECT team_activities.id
        FROM team_activities
        WHERE team_activities.team_id IN (
            SELECT tm.team_id
            FROM team_members tm
            WHERE tm.user_id = (select auth.uid())
            AND tm.role = 'coach'
        )
    )
);

-- Athletes can view audit logs
DROP POLICY IF EXISTS "Athletes can view audit logs" ON public.team_activity_audit;
CREATE POLICY "Athletes can view audit logs"
ON public.team_activity_audit
FOR SELECT
USING (
    activity_id IN (
        SELECT team_activities.id
        FROM team_activities
        WHERE team_activities.team_id IN (
            SELECT team_members.team_id
            FROM team_members
            WHERE team_members.user_id = (select auth.uid())
            AND team_members.status = 'active'
        )
    )
);

-- ============================================================================
-- WELLNESS ENTRIES
-- ============================================================================

-- Coaches can view wellness with consent
DROP POLICY IF EXISTS "Coaches can view wellness with consent" ON public.wellness_entries;
CREATE POLICY "Coaches can view wellness with consent"
ON public.wellness_entries
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.coach_athlete_assignments
        WHERE coach_id = (select auth.uid())
        AND athlete_id = wellness_entries.athlete_id
    )
    AND (
        get_athlete_consent(athlete_id, 'wellness') = true
        OR has_active_safety_override(athlete_id, 'pain') = true
    )
);

-- Athletes can view own wellness entries
DROP POLICY IF EXISTS "Athletes can view own wellness entries" ON public.wellness_entries;
CREATE POLICY "Athletes can view own wellness entries"
ON public.wellness_entries
FOR SELECT
USING (athlete_id = (select auth.uid()));

-- ============================================================================
-- ATHLETE CONSENT SETTINGS
-- ============================================================================

-- Athletes can manage own consent
DROP POLICY IF EXISTS "Athletes can manage own consent" ON public.athlete_consent_settings;
CREATE POLICY "Athletes can manage own consent"
ON public.athlete_consent_settings
FOR ALL
USING (athlete_id = (select auth.uid()))
WITH CHECK (athlete_id = (select auth.uid()));

-- ============================================================================
-- READINESS SCORES
-- ============================================================================

-- Athletes can view own readiness scores
DROP POLICY IF EXISTS "Athletes can view own readiness scores" ON public.readiness_scores;
CREATE POLICY "Athletes can view own readiness scores"
ON public.readiness_scores
FOR SELECT
USING (athlete_id = (select auth.uid()));

-- Coaches can view readiness with consent
DROP POLICY IF EXISTS "Coaches can view readiness with consent" ON public.readiness_scores;
CREATE POLICY "Coaches can view readiness with consent"
ON public.readiness_scores
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.coach_athlete_assignments
        WHERE coach_id = (select auth.uid())
        AND athlete_id = readiness_scores.athlete_id
    )
    AND (
        get_athlete_consent(athlete_id, 'readiness') = true
        OR acwr > 1.5
        OR acwr < 0.8
    )
);

-- Medical staff can view readiness scores
DROP POLICY IF EXISTS "Medical staff can view readiness scores" ON public.readiness_scores;
CREATE POLICY "Medical staff can view readiness scores"
ON public.readiness_scores
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = ANY (ARRAY['physio', 'medical_staff', 'admin'])
    )
);

-- ============================================================================
-- TRAINING SESSIONS
-- ============================================================================

-- Coaches can view training notes with consent
DROP POLICY IF EXISTS "Coaches can view training notes with consent" ON public.training_sessions;
CREATE POLICY "Coaches can view training notes with consent"
ON public.training_sessions
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.coach_athlete_assignments
        WHERE coach_id = (select auth.uid())
        AND athlete_id = training_sessions.user_id
    )
);

-- ============================================================================
-- SESSION VERSION HISTORY
-- ============================================================================

-- Athletes can view own session versions
DROP POLICY IF EXISTS "Athletes can view own session versions" ON public.session_version_history;
CREATE POLICY "Athletes can view own session versions"
ON public.session_version_history
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM training_sessions
        WHERE training_sessions.id = session_version_history.session_id
        AND training_sessions.user_id = (select auth.uid())
    )
);

-- Coaches can view athlete session versions
DROP POLICY IF EXISTS "Coaches can view athlete session versions" ON public.session_version_history;
CREATE POLICY "Coaches can view athlete session versions"
ON public.session_version_history
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM training_sessions ts
        JOIN coach_athlete_assignments caa ON caa.athlete_id = ts.user_id
        WHERE ts.id = session_version_history.session_id
        AND caa.coach_id = (select auth.uid())
    )
);

-- Medical staff can view session versions
DROP POLICY IF EXISTS "Medical staff can view session versions" ON public.session_version_history;
CREATE POLICY "Medical staff can view session versions"
ON public.session_version_history
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE id = (select auth.uid())
        AND raw_user_meta_data->>'role' = ANY (ARRAY['physio', 'medical_staff', 'admin'])
    )
);

-- ============================================================================
-- SYNC LOGS
-- ============================================================================

-- Authenticated users can insert sync logs
DROP POLICY IF EXISTS "Authenticated users can insert sync logs" ON public.sync_logs;
CREATE POLICY "Authenticated users can insert sync logs"
ON public.sync_logs
FOR INSERT
WITH CHECK ((select auth.role()) = 'authenticated');

-- Admins can view all sync logs
DROP POLICY IF EXISTS "Admins can view all sync logs" ON public.sync_logs;
CREATE POLICY "Admins can view all sync logs"
ON public.sync_logs
FOR SELECT
USING (
    (
        SELECT raw_user_meta_data->>'role'
        FROM auth.users
        WHERE id = (select auth.uid())
    ) = 'admin'
    OR (select auth.role()) = 'service_role'
);

