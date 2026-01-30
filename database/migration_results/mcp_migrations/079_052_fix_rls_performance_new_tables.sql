-- Migration: Fix RLS Performance for New Tables
-- Optimizes RLS policies by using subqueries for auth.uid()
-- This prevents re-evaluation of auth.uid() for each row
-- Applied: 2024-12-23
-- See: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

-- ============================================================================
-- WELLNESS_ENTRIES - Fix RLS Policies (uses athlete_id)
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own wellness entries" ON wellness_entries;
DROP POLICY IF EXISTS "Users can insert their own wellness entries" ON wellness_entries;
DROP POLICY IF EXISTS "Users can update their own wellness entries" ON wellness_entries;
DROP POLICY IF EXISTS "Users can delete their own wellness entries" ON wellness_entries;

CREATE POLICY "Users can view their own wellness entries" 
ON wellness_entries FOR SELECT 
USING ((select auth.uid()) = athlete_id);

CREATE POLICY "Users can insert their own wellness entries" 
ON wellness_entries FOR INSERT 
WITH CHECK ((select auth.uid()) = athlete_id);

CREATE POLICY "Users can update their own wellness entries" 
ON wellness_entries FOR UPDATE 
USING ((select auth.uid()) = athlete_id);

CREATE POLICY "Users can delete their own wellness entries" 
ON wellness_entries FOR DELETE 
USING ((select auth.uid()) = athlete_id);

-- ============================================================================
-- RECOVERY_SESSIONS - Fix RLS Policies (uses athlete_id)
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own recovery sessions" ON recovery_sessions;
DROP POLICY IF EXISTS "Users can insert their own recovery sessions" ON recovery_sessions;
DROP POLICY IF EXISTS "Users can update their own recovery sessions" ON recovery_sessions;
DROP POLICY IF EXISTS "Users can delete their own recovery sessions" ON recovery_sessions;

CREATE POLICY "Users can view their own recovery sessions" 
ON recovery_sessions FOR SELECT 
USING ((select auth.uid()) = athlete_id);

CREATE POLICY "Users can insert their own recovery sessions" 
ON recovery_sessions FOR INSERT 
WITH CHECK ((select auth.uid()) = athlete_id);

CREATE POLICY "Users can update their own recovery sessions" 
ON recovery_sessions FOR UPDATE 
USING ((select auth.uid()) = athlete_id);

CREATE POLICY "Users can delete their own recovery sessions" 
ON recovery_sessions FOR DELETE 
USING ((select auth.uid()) = athlete_id);

-- ============================================================================
-- NUTRITION_LOGS - Fix RLS Policies (uses user_id)
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own nutrition logs" ON nutrition_logs;
DROP POLICY IF EXISTS "Users can insert their own nutrition logs" ON nutrition_logs;
DROP POLICY IF EXISTS "Users can update their own nutrition logs" ON nutrition_logs;
DROP POLICY IF EXISTS "Users can delete their own nutrition logs" ON nutrition_logs;

CREATE POLICY "Users can view their own nutrition logs" 
ON nutrition_logs FOR SELECT 
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own nutrition logs" 
ON nutrition_logs FOR INSERT 
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own nutrition logs" 
ON nutrition_logs FOR UPDATE 
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own nutrition logs" 
ON nutrition_logs FOR DELETE 
USING ((select auth.uid()) = user_id);

-- ============================================================================
-- NUTRITION_GOALS - Fix RLS Policies (uses user_id)
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own nutrition goals" ON nutrition_goals;
DROP POLICY IF EXISTS "Users can insert their own nutrition goals" ON nutrition_goals;
DROP POLICY IF EXISTS "Users can update their own nutrition goals" ON nutrition_goals;
DROP POLICY IF EXISTS "Users can delete their own nutrition goals" ON nutrition_goals;

CREATE POLICY "Users can view their own nutrition goals" 
ON nutrition_goals FOR SELECT 
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own nutrition goals" 
ON nutrition_goals FOR INSERT 
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own nutrition goals" 
ON nutrition_goals FOR UPDATE 
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own nutrition goals" 
ON nutrition_goals FOR DELETE 
USING ((select auth.uid()) = user_id);

-- ============================================================================
-- SUPPLEMENT_LOGS - Fix RLS Policies (uses user_id)
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own supplement logs" ON supplement_logs;
DROP POLICY IF EXISTS "Users can insert their own supplement logs" ON supplement_logs;
DROP POLICY IF EXISTS "Users can update their own supplement logs" ON supplement_logs;
DROP POLICY IF EXISTS "Users can delete their own supplement logs" ON supplement_logs;

CREATE POLICY "Users can view their own supplement logs" 
ON supplement_logs FOR SELECT 
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own supplement logs" 
ON supplement_logs FOR INSERT 
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own supplement logs" 
ON supplement_logs FOR UPDATE 
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own supplement logs" 
ON supplement_logs FOR DELETE 
USING ((select auth.uid()) = user_id);

-- ============================================================================
-- PERFORMANCE_TESTS - Fix RLS Policies (uses user_id)
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own performance tests" ON performance_tests;
DROP POLICY IF EXISTS "Users can insert their own performance tests" ON performance_tests;
DROP POLICY IF EXISTS "Users can update their own performance tests" ON performance_tests;
DROP POLICY IF EXISTS "Users can delete their own performance tests" ON performance_tests;

CREATE POLICY "Users can view their own performance tests" 
ON performance_tests FOR SELECT 
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own performance tests" 
ON performance_tests FOR INSERT 
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own performance tests" 
ON performance_tests FOR UPDATE 
USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own performance tests" 
ON performance_tests FOR DELETE 
USING ((select auth.uid()) = user_id);

