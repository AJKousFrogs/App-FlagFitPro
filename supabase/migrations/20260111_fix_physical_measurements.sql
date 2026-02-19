-- Migration: Fix Physical Measurements Table
-- Purpose: Create properly structured physical_measurements table with all required columns
-- Date: 2026-01-11
-- Issue: Users cannot log body composition measurements due to missing/incorrect table structure

-- Create table if missing. Keep existing data intact.
CREATE TABLE IF NOT EXISTS physical_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic measurements
    weight DECIMAL(5,2) CHECK (weight >= 30 AND weight <= 300),
    height DECIMAL(5,2) CHECK (height >= 140 AND height <= 250),
    body_fat DECIMAL(4,2) CHECK (body_fat >= 3 AND body_fat <= 50),
    muscle_mass DECIMAL(5,2),
    
    -- Enhanced body composition fields (from smart scales)
    body_water_mass DECIMAL(5,2),
    fat_mass DECIMAL(5,2),
    protein_mass DECIMAL(5,2),
    bone_mineral_content DECIMAL(5,2),
    skeletal_muscle_mass DECIMAL(5,2),
    muscle_percentage DECIMAL(4,2),
    body_water_percentage DECIMAL(4,2),
    protein_percentage DECIMAL(4,2),
    bone_mineral_percentage DECIMAL(4,2),
    visceral_fat_rating INTEGER CHECK (visceral_fat_rating >= 1 AND visceral_fat_rating <= 59),
    basal_metabolic_rate INTEGER CHECK (basal_metabolic_rate >= 800 AND basal_metabolic_rate <= 5000),
    waist_to_hip_ratio DECIMAL(4,2) CHECK (waist_to_hip_ratio >= 0.5 AND waist_to_hip_ratio <= 1.5),
    body_age INTEGER CHECK (body_age >= 10 AND body_age <= 120),
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for fast user lookups sorted by date
CREATE INDEX IF NOT EXISTS idx_physical_measurements_user_date
ON physical_measurements(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE physical_measurements ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can insert their own measurements
DROP POLICY IF EXISTS "Users can insert their own measurements" ON physical_measurements;
CREATE POLICY "Users can insert their own measurements"
ON physical_measurements
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can view their own measurements
DROP POLICY IF EXISTS "Users can view their own measurements" ON physical_measurements;
CREATE POLICY "Users can view their own measurements"
ON physical_measurements
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policy: Users can update their own measurements
DROP POLICY IF EXISTS "Users can update their own measurements" ON physical_measurements;
CREATE POLICY "Users can update their own measurements"
ON physical_measurements
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can delete their own measurements (for corrections)
DROP POLICY IF EXISTS "Users can delete their own measurements" ON physical_measurements;
CREATE POLICY "Users can delete their own measurements"
ON physical_measurements
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policy: Coaches can view measurements of players on their teams
DROP POLICY IF EXISTS "Coaches can view team measurements" ON physical_measurements;
CREATE POLICY "Coaches can view team measurements"
ON physical_measurements
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM team_members coach_tm
    JOIN team_members player_tm ON coach_tm.team_id = player_tm.team_id
    WHERE coach_tm.user_id = auth.uid()
      AND coach_tm.role IN ('coach', 'head_coach', 'admin')
      AND player_tm.user_id = physical_measurements.user_id
  )
);

-- Add table and column comments for documentation
COMMENT ON TABLE physical_measurements IS 'Stores athlete body composition and physical measurement data from smart scales and manual entry';
COMMENT ON COLUMN physical_measurements.user_id IS 'Reference to auth.users - the athlete who owns this measurement';
COMMENT ON COLUMN physical_measurements.weight IS 'Body weight in kilograms (30-300 kg)';
COMMENT ON COLUMN physical_measurements.height IS 'Height in centimeters (140-250 cm)';
COMMENT ON COLUMN physical_measurements.body_fat IS 'Body fat percentage (3-50%)';
COMMENT ON COLUMN physical_measurements.muscle_mass IS 'Total muscle mass in kilograms';
COMMENT ON COLUMN physical_measurements.visceral_fat_rating IS 'Visceral fat rating (1-59, lower is better)';
COMMENT ON COLUMN physical_measurements.basal_metabolic_rate IS 'BMR in kcal/day (800-5000)';
COMMENT ON COLUMN physical_measurements.waist_to_hip_ratio IS 'WHR ratio for health risk assessment (0.5-1.5)';
COMMENT ON COLUMN physical_measurements.body_age IS 'Metabolic age estimate in years';

-- Bring older deployments up to current column shape without destructive changes.
ALTER TABLE physical_measurements
    ADD COLUMN IF NOT EXISTS weight DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS height DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS body_fat DECIMAL(4,2),
    ADD COLUMN IF NOT EXISTS muscle_mass DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS body_water_mass DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS fat_mass DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS protein_mass DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS bone_mineral_content DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS skeletal_muscle_mass DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS muscle_percentage DECIMAL(4,2),
    ADD COLUMN IF NOT EXISTS body_water_percentage DECIMAL(4,2),
    ADD COLUMN IF NOT EXISTS protein_percentage DECIMAL(4,2),
    ADD COLUMN IF NOT EXISTS bone_mineral_percentage DECIMAL(4,2),
    ADD COLUMN IF NOT EXISTS visceral_fat_rating INTEGER,
    ADD COLUMN IF NOT EXISTS basal_metabolic_rate INTEGER,
    ADD COLUMN IF NOT EXISTS waist_to_hip_ratio DECIMAL(4,2),
    ADD COLUMN IF NOT EXISTS body_age INTEGER,
    ADD COLUMN IF NOT EXISTS notes TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create view for latest measurements per user
CREATE OR REPLACE VIEW physical_measurements_latest
WITH (security_invoker = true) AS
SELECT DISTINCT ON (user_id)
    id,
    user_id,
    weight,
    height,
    body_fat,
    muscle_mass,
    body_water_percentage,
    visceral_fat_rating,
    basal_metabolic_rate,
    body_age,
    created_at,
    -- Calculate trend indicators (compare to previous measurement)
    LAG(weight) OVER (PARTITION BY user_id ORDER BY created_at) as previous_weight,
    LAG(body_fat) OVER (PARTITION BY user_id ORDER BY created_at) as previous_body_fat
FROM physical_measurements
ORDER BY user_id, created_at DESC;

COMMENT ON VIEW physical_measurements_latest IS 'Latest physical measurement for each user with previous values for trend analysis';

-- Grant SELECT on view to authenticated users (respects RLS on base table)
GRANT SELECT ON physical_measurements_latest TO authenticated;
