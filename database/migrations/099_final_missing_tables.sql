-- Final Missing Tables for FlagFit Pro
-- Creates weather_data and training_suggestions tables

-- Weather Data Table
CREATE TABLE IF NOT EXISTS weather_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location VARCHAR(255) NOT NULL,
    temperature DECIMAL(5,2),
    humidity INTEGER,
    conditions VARCHAR(100),
    wind_speed DECIMAL(5,2),
    uv_index INTEGER,
    precipitation DECIMAL(5,2),
    feels_like DECIMAL(5,2),
    icon VARCHAR(50),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    recommendations JSONB DEFAULT '{"hydration": "normal", "sunProtection": "standard", "warmUp": "standard"}'::jsonb
);

-- Training Suggestions Table
CREATE TABLE IF NOT EXISTS training_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    type VARCHAR(100),
    reason TEXT,
    priority INTEGER DEFAULT 1,
    duration_minutes INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE weather_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_suggestions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view weather data" ON weather_data FOR SELECT USING (true);
CREATE POLICY "Users can view own training suggestions" ON training_suggestions FOR SELECT USING (athlete_id = auth.uid());
