-- Migration: Enhanced Body Composition Fields
-- Adds detailed body composition metrics from smart scales
-- Created: 2026-01-02

-- Add new columns to physical_measurements table for comprehensive body composition tracking
ALTER TABLE physical_measurements
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
  ADD COLUMN IF NOT EXISTS body_age INTEGER;

-- Add sleep_score to wellness_data/wellness_entries
ALTER TABLE wellness_data
  ADD COLUMN IF NOT EXISTS sleep_score INTEGER CHECK (sleep_score >= 0 AND sleep_score <= 100);

ALTER TABLE wellness_entries
  ADD COLUMN IF NOT EXISTS sleep_score INTEGER CHECK (sleep_score >= 0 AND sleep_score <= 100),
  ADD COLUMN IF NOT EXISTS sleep_hours DECIMAL(4,2);

-- Add comments for new columns
COMMENT ON COLUMN physical_measurements.body_water_mass IS 'Body water mass in kilograms';
COMMENT ON COLUMN physical_measurements.fat_mass IS 'Fat mass in kilograms';
COMMENT ON COLUMN physical_measurements.protein_mass IS 'Protein mass in kilograms';
COMMENT ON COLUMN physical_measurements.bone_mineral_content IS 'Bone mineral content in kilograms';
COMMENT ON COLUMN physical_measurements.skeletal_muscle_mass IS 'Skeletal muscle mass in kilograms';
COMMENT ON COLUMN physical_measurements.muscle_percentage IS 'Muscle percentage (0-100%)';
COMMENT ON COLUMN physical_measurements.body_water_percentage IS 'Body water percentage (0-100%)';
COMMENT ON COLUMN physical_measurements.protein_percentage IS 'Protein percentage (0-100%)';
COMMENT ON COLUMN physical_measurements.bone_mineral_percentage IS 'Bone mineral percentage (0-100%)';
COMMENT ON COLUMN physical_measurements.visceral_fat_rating IS 'Visceral fat rating (1-59, 1-12 = standard, 13-59 = high)';
COMMENT ON COLUMN physical_measurements.basal_metabolic_rate IS 'Basal metabolic rate in kcal/day';
COMMENT ON COLUMN physical_measurements.waist_to_hip_ratio IS 'Waist-to-hip ratio';
COMMENT ON COLUMN physical_measurements.body_age IS 'Metabolic body age in years';

COMMENT ON COLUMN wellness_data.sleep_score IS 'Sleep score percentage from wearable devices (0-100%)';
COMMENT ON COLUMN wellness_entries.sleep_score IS 'Sleep score percentage from wearable devices (0-100%)';
COMMENT ON COLUMN wellness_entries.sleep_hours IS 'Total hours slept';

-- Update physical_measurements_latest view to include new fields
CREATE OR REPLACE VIEW physical_measurements_latest AS
SELECT DISTINCT ON (user_id)
    user_id,
    weight,
    height,
    body_fat,
    muscle_mass,
    body_water_mass,
    fat_mass,
    protein_mass,
    bone_mineral_content,
    skeletal_muscle_mass,
    muscle_percentage,
    body_water_percentage,
    protein_percentage,
    bone_mineral_percentage,
    visceral_fat_rating,
    basal_metabolic_rate,
    waist_to_hip_ratio,
    body_age,
    created_at,
    LAG(weight) OVER (PARTITION BY user_id ORDER BY created_at) as previous_weight,
    LAG(body_fat) OVER (PARTITION BY user_id ORDER BY created_at) as previous_body_fat,
    LAG(muscle_mass) OVER (PARTITION BY user_id ORDER BY created_at) as previous_muscle_mass
FROM physical_measurements
ORDER BY user_id, created_at DESC;

COMMENT ON VIEW physical_measurements_latest IS 'Latest physical measurements for each user with enhanced body composition data';
