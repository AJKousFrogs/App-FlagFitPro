-- Migration: Ensure Nutrition Tables Exist
-- Purpose: Create nutrition_logs and nutrition_goals tables if they don't exist
-- Date: 2026-01-11
-- Issue: Tables may be missing from Supabase database

-- ============================================================================
-- NUTRITION LOGS TABLE
-- ============================================================================
-- Tracks individual food intake entries

CREATE TABLE IF NOT EXISTS nutrition_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Food identification
    food_name VARCHAR(255) NOT NULL,
    food_id INTEGER, -- USDA FoodData Central ID if from database search
    
    -- Macronutrients (grams unless otherwise specified)
    calories DECIMAL(8,2) DEFAULT 0 CHECK (calories >= 0 AND calories <= 10000),
    protein DECIMAL(6,2) DEFAULT 0 CHECK (protein >= 0 AND protein <= 1000),
    carbohydrates DECIMAL(6,2) DEFAULT 0 CHECK (carbohydrates >= 0 AND carbohydrates <= 1000),
    fat DECIMAL(6,2) DEFAULT 0 CHECK (fat >= 0 AND fat <= 1000),
    fiber DECIMAL(6,2) DEFAULT 0 CHECK (fiber >= 0 AND fiber <= 100),
    
    -- Meal context
    meal_type VARCHAR(50) CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'pre-workout', 'post-workout')),
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast user + date queries
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user_date 
ON nutrition_logs(user_id, logged_at DESC);

-- Create index for food database lookups
CREATE INDEX IF NOT EXISTS idx_nutrition_logs_food_id 
ON nutrition_logs(food_id) WHERE food_id IS NOT NULL;

-- Enable RLS (policies added in separate migration)
ALTER TABLE nutrition_logs ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE nutrition_logs IS 'Tracks individual food intake entries for nutrition monitoring and goal tracking';
COMMENT ON COLUMN nutrition_logs.user_id IS 'Reference to auth.users - the athlete logging food';
COMMENT ON COLUMN nutrition_logs.food_id IS 'USDA FoodData Central database ID (optional, for database-searched foods)';
COMMENT ON COLUMN nutrition_logs.calories IS 'Total calories (kcal) for this food entry';
COMMENT ON COLUMN nutrition_logs.meal_type IS 'Type of meal: breakfast, lunch, dinner, snack, pre-workout, post-workout';
COMMENT ON COLUMN nutrition_logs.logged_at IS 'When the food was consumed (can be backdated)';

-- ============================================================================
-- NUTRITION GOALS TABLE
-- ============================================================================
-- Stores personalized nutrition targets for each user

CREATE TABLE IF NOT EXISTS nutrition_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Daily targets (integers for simplicity in UI)
    calories_target INTEGER DEFAULT 2500 CHECK (calories_target >= 1000 AND calories_target <= 10000),
    protein_target INTEGER DEFAULT 150 CHECK (protein_target >= 30 AND protein_target <= 500),
    carbs_target INTEGER DEFAULT 300 CHECK (carbs_target >= 50 AND carbs_target <= 1000),
    fat_target INTEGER DEFAULT 80 CHECK (fat_target >= 20 AND fat_target <= 300),
    fiber_target INTEGER DEFAULT 30 CHECK (fiber_target >= 10 AND fiber_target <= 100),
    
    -- Goal context
    goal_type VARCHAR(50) DEFAULT 'maintenance' CHECK (goal_type IN ('weight_loss', 'weight_gain', 'maintenance', 'performance', 'recovery')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one goal per user
    UNIQUE(user_id)
);

-- Create index for user lookups
CREATE INDEX IF NOT EXISTS idx_nutrition_goals_user 
ON nutrition_goals(user_id);

-- Enable RLS (policies added in separate migration)
ALTER TABLE nutrition_goals ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE nutrition_goals IS 'Stores personalized daily nutrition targets for each athlete';
COMMENT ON COLUMN nutrition_goals.user_id IS 'Reference to auth.users - athlete these goals belong to';
COMMENT ON COLUMN nutrition_goals.calories_target IS 'Daily calorie target in kcal (1000-10000)';
COMMENT ON COLUMN nutrition_goals.protein_target IS 'Daily protein target in grams (30-500g)';
COMMENT ON COLUMN nutrition_goals.goal_type IS 'Goal context: weight_loss, weight_gain, maintenance, performance, recovery';

-- ============================================================================
-- NUTRITION SUMMARY VIEWS
-- ============================================================================

-- Daily nutrition totals view
CREATE OR REPLACE VIEW nutrition_daily_totals AS
SELECT 
    user_id,
    DATE(logged_at) as log_date,
    COUNT(*) as total_entries,
    SUM(calories) as total_calories,
    SUM(protein) as total_protein,
    SUM(carbohydrates) as total_carbs,
    SUM(fat) as total_fat,
    SUM(fiber) as total_fiber
FROM nutrition_logs
GROUP BY user_id, DATE(logged_at);

COMMENT ON VIEW nutrition_daily_totals IS 'Aggregates nutrition logs by user and date for daily tracking';

-- Nutrition progress view (compares actuals to goals)
CREATE OR REPLACE VIEW nutrition_progress_today AS
SELECT 
    ng.user_id,
    ng.calories_target,
    ng.protein_target,
    ng.carbs_target,
    ng.fat_target,
    COALESCE(SUM(nl.calories), 0) as calories_actual,
    COALESCE(SUM(nl.protein), 0) as protein_actual,
    COALESCE(SUM(nl.carbohydrates), 0) as carbs_actual,
    COALESCE(SUM(nl.fat), 0) as fat_actual,
    -- Calculate percentage of goal achieved
    ROUND((COALESCE(SUM(nl.calories), 0) / NULLIF(ng.calories_target, 0)) * 100, 1) as calories_percent,
    ROUND((COALESCE(SUM(nl.protein), 0) / NULLIF(ng.protein_target, 0)) * 100, 1) as protein_percent,
    ROUND((COALESCE(SUM(nl.carbohydrates), 0) / NULLIF(ng.carbs_target, 0)) * 100, 1) as carbs_percent,
    ROUND((COALESCE(SUM(nl.fat), 0) / NULLIF(ng.fat_target, 0)) * 100, 1) as fat_percent
FROM nutrition_goals ng
LEFT JOIN nutrition_logs nl ON ng.user_id = nl.user_id 
    AND DATE(nl.logged_at) = CURRENT_DATE
GROUP BY ng.user_id, ng.calories_target, ng.protein_target, ng.carbs_target, ng.fat_target;

COMMENT ON VIEW nutrition_progress_today IS 'Shows today''s nutrition progress vs goals for each user';

-- Grant SELECT on views to authenticated users (respects RLS on base tables)
GRANT SELECT ON nutrition_daily_totals TO authenticated;
GRANT SELECT ON nutrition_progress_today TO authenticated;

-- ============================================================================
-- TRIGGER: Update nutrition_goals.updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_nutrition_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_nutrition_goals_timestamp ON nutrition_goals;
CREATE TRIGGER trigger_update_nutrition_goals_timestamp
    BEFORE UPDATE ON nutrition_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_nutrition_goals_updated_at();

COMMENT ON FUNCTION update_nutrition_goals_updated_at() IS 'Auto-updates updated_at timestamp when nutrition goals are modified';
