-- Migration: Wellness and Physical Measurements Tables
-- Creates missing tables for wellness tracking, physical measurements, and supplements
-- Created: 2024-11-22

-- Physical Measurements Table
-- Stores athlete body composition and physical measurement data
CREATE TABLE IF NOT EXISTS physical_measurements (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    weight DECIMAL(5,2) CHECK (weight >= 40 AND weight <= 200),
    height DECIMAL(5,2) CHECK (height >= 140 AND height <= 220),
    body_fat DECIMAL(4,2) CHECK (body_fat >= 3 AND body_fat <= 50),
    muscle_mass DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wellness Data Table
-- Tracks daily wellness metrics for athlete monitoring
CREATE TABLE IF NOT EXISTS wellness_data (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    sleep INTEGER CHECK (sleep >= 0 AND sleep <= 10),
    energy INTEGER CHECK (energy >= 0 AND energy <= 10),
    stress INTEGER CHECK (stress >= 0 AND stress <= 10),
    soreness INTEGER CHECK (soreness >= 0 AND soreness <= 10),
    motivation INTEGER CHECK (motivation >= 0 AND motivation <= 10),
    mood INTEGER CHECK (mood >= 0 AND mood <= 10),
    hydration INTEGER CHECK (hydration >= 0 AND hydration <= 10),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Supplements Data Table
-- Tracks supplement intake and compliance
CREATE TABLE IF NOT EXISTS supplements_data (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    name VARCHAR(200) NOT NULL,
    dosage VARCHAR(100),
    taken BOOLEAN DEFAULT false,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time_of_day VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_physical_measurements_user_date
ON physical_measurements(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wellness_data_user_date
ON wellness_data(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_supplements_data_user_date
ON supplements_data(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_supplements_data_name
ON supplements_data(name)
WHERE taken = true;

-- Add comments for documentation
COMMENT ON TABLE physical_measurements IS 'Stores athlete body composition and physical measurement data';
COMMENT ON TABLE wellness_data IS 'Tracks daily wellness metrics for athlete monitoring and recovery assessment';
COMMENT ON TABLE supplements_data IS 'Tracks supplement intake and compliance for nutrition monitoring';

COMMENT ON COLUMN physical_measurements.weight IS 'Weight in kilograms (40-200 kg)';
COMMENT ON COLUMN physical_measurements.height IS 'Height in centimeters (140-220 cm)';
COMMENT ON COLUMN physical_measurements.body_fat IS 'Body fat percentage (3-50%)';
COMMENT ON COLUMN physical_measurements.muscle_mass IS 'Muscle mass in kilograms';

COMMENT ON COLUMN wellness_data.sleep IS 'Sleep quality rating (0-10 scale)';
COMMENT ON COLUMN wellness_data.energy IS 'Energy level rating (0-10 scale)';
COMMENT ON COLUMN wellness_data.stress IS 'Stress level rating (0-10 scale, higher = more stressed)';
COMMENT ON COLUMN wellness_data.soreness IS 'Muscle soreness rating (0-10 scale)';
COMMENT ON COLUMN wellness_data.motivation IS 'Motivation level rating (0-10 scale)';
COMMENT ON COLUMN wellness_data.mood IS 'Overall mood rating (0-10 scale)';
COMMENT ON COLUMN wellness_data.hydration IS 'Hydration level rating (0-10 scale)';

COMMENT ON COLUMN supplements_data.taken IS 'Whether the supplement was taken on this date';
COMMENT ON COLUMN supplements_data.time_of_day IS 'When supplement was taken (morning, afternoon, evening, pre-workout, post-workout)';

-- Create views for easier data access

-- Physical measurements summary view
CREATE OR REPLACE VIEW physical_measurements_latest AS
SELECT DISTINCT ON (user_id)
    user_id,
    weight,
    height,
    body_fat,
    muscle_mass,
    created_at,
    LAG(weight) OVER (PARTITION BY user_id ORDER BY created_at) as previous_weight,
    LAG(body_fat) OVER (PARTITION BY user_id ORDER BY created_at) as previous_body_fat
FROM physical_measurements
ORDER BY user_id, created_at DESC;

-- Wellness summary view (last 30 days)
CREATE OR REPLACE VIEW wellness_summary_30d AS
SELECT
    user_id,
    COUNT(*) as total_entries,
    AVG(sleep)::DECIMAL(3,1) as avg_sleep,
    AVG(energy)::DECIMAL(3,1) as avg_energy,
    AVG(stress)::DECIMAL(3,1) as avg_stress,
    AVG(soreness)::DECIMAL(3,1) as avg_soreness,
    AVG(motivation)::DECIMAL(3,1) as avg_motivation,
    MAX(date) as last_entry_date
FROM wellness_data
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY user_id;

-- Supplement compliance view
CREATE OR REPLACE VIEW supplement_compliance AS
SELECT
    user_id,
    name,
    COUNT(*) as total_scheduled,
    SUM(CASE WHEN taken THEN 1 ELSE 0 END) as times_taken,
    ROUND((SUM(CASE WHEN taken THEN 1 ELSE 0 END)::DECIMAL / COUNT(*)) * 100, 1) as compliance_percentage,
    MAX(date) FILTER (WHERE taken) as last_taken_date
FROM supplements_data
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY user_id, name;

COMMENT ON VIEW physical_measurements_latest IS 'Latest physical measurements for each user with previous values for trend analysis';
COMMENT ON VIEW wellness_summary_30d IS 'Wellness averages for the last 30 days by user';
COMMENT ON VIEW supplement_compliance IS 'Supplement compliance statistics for the last 30 days';

-- Insert sample data for testing (optional)
-- Uncomment to add sample data

-- INSERT INTO physical_measurements (user_id, weight, height, body_fat, muscle_mass) VALUES
-- ('1', 75.5, 178.0, 12.5, 62.0),
-- ('1', 76.0, 178.0, 12.3, 62.5);

-- INSERT INTO wellness_data (user_id, date, sleep, energy, stress, soreness, motivation, mood, hydration) VALUES
-- ('1', CURRENT_DATE, 8, 7, 3, 4, 8, 7, 8),
-- ('1', CURRENT_DATE - INTERVAL '1 day', 7, 6, 4, 5, 7, 6, 7);

-- INSERT INTO supplements_data (user_id, name, dosage, taken, date, time_of_day) VALUES
-- ('1', 'Protein Powder', '30g', true, CURRENT_DATE, 'post-workout'),
-- ('1', 'Creatine', '5g', true, CURRENT_DATE, 'morning'),
-- ('1', 'Vitamin D', '2000 IU', true, CURRENT_DATE, 'morning');
