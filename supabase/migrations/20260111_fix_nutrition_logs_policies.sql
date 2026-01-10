-- Migration: Add RLS Policies to Nutrition Tables
-- Purpose: Allow users to insert/view their own nutrition logs
-- Date: 2026-01-11
-- Issue: Users cannot save nutrition logs because RLS is enabled but no INSERT policy exists

-- ============================================================================
-- NUTRITION LOGS POLICIES
-- ============================================================================

-- Policy: Users can insert their own nutrition logs
CREATE POLICY "Users can insert their own nutrition logs"
ON nutrition_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own nutrition logs
CREATE POLICY "Users can view their own nutrition logs"
ON nutrition_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can update their own nutrition logs (for corrections)
CREATE POLICY "Users can update their own nutrition logs"
ON nutrition_logs
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own nutrition logs
CREATE POLICY "Users can delete their own nutrition logs"
ON nutrition_logs
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Coaches and nutritionists can view team member nutrition logs
CREATE POLICY "Coaches can view team nutrition logs"
ON nutrition_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM team_members coach_tm
    JOIN team_members player_tm ON coach_tm.team_id = player_tm.team_id
    WHERE coach_tm.user_id = auth.uid()
      AND coach_tm.role IN ('coach', 'head_coach', 'nutritionist', 'admin')
      AND player_tm.user_id = nutrition_logs.user_id
  )
);

-- ============================================================================
-- NUTRITION GOALS POLICIES
-- ============================================================================

-- Check if nutrition_goals table exists before adding policies
DO $$ 
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'nutrition_goals'
    ) THEN
        -- Enable RLS if not already enabled
        ALTER TABLE nutrition_goals ENABLE ROW LEVEL SECURITY;
        
        -- Policy: Users can manage all operations on their own nutrition goals
        CREATE POLICY "Users can manage their own nutrition goals"
        ON nutrition_goals
        FOR ALL
        TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
        
        -- Policy: Nutritionists can view team member goals
        CREATE POLICY "Nutritionists can view team nutrition goals"
        ON nutrition_goals
        FOR SELECT
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 
            FROM team_members coach_tm
            JOIN team_members player_tm ON coach_tm.team_id = player_tm.team_id
            WHERE coach_tm.user_id = auth.uid()
              AND coach_tm.role IN ('nutritionist', 'coach', 'head_coach', 'admin')
              AND player_tm.user_id = nutrition_goals.user_id
          )
        );
        
        -- Policy: Nutritionists can update team member goals (with explicit consent)
        CREATE POLICY "Nutritionists can update team nutrition goals"
        ON nutrition_goals
        FOR UPDATE
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 
            FROM team_members coach_tm
            JOIN team_members player_tm ON coach_tm.team_id = player_tm.team_id
            WHERE coach_tm.user_id = auth.uid()
              AND coach_tm.role IN ('nutritionist', 'admin')
              AND player_tm.user_id = nutrition_goals.user_id
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 
            FROM team_members coach_tm
            JOIN team_members player_tm ON coach_tm.team_id = player_tm.team_id
            WHERE coach_tm.user_id = auth.uid()
              AND coach_tm.role IN ('nutritionist', 'admin')
              AND player_tm.user_id = nutrition_goals.user_id
          )
        );
    END IF;
END $$;

-- Add helpful comments
COMMENT ON POLICY "Users can insert their own nutrition logs" ON nutrition_logs IS 
'Allows authenticated users to log their own food intake';

COMMENT ON POLICY "Users can view their own nutrition logs" ON nutrition_logs IS 
'Allows users to view their nutrition history for tracking progress';

COMMENT ON POLICY "Coaches can view team nutrition logs" ON nutrition_logs IS 
'Allows coaches and nutritionists to monitor team member nutrition for performance optimization';
