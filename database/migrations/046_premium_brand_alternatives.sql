-- Migration: Premium Brand Alternatives Integration
-- This migration integrates premium recovery equipment brands into our cost-effective alternatives system

-- Create table for premium brand analysis
CREATE TABLE IF NOT EXISTS premium_brand_analysis (
    id SERIAL PRIMARY KEY,
    brand_name VARCHAR(100) NOT NULL,
    brand_website TEXT,
    brand_category VARCHAR(100) NOT NULL, -- 'recovery', 'training', 'physiotherapy', 'performance'
    target_market VARCHAR(100) NOT NULL,
    price_positioning VARCHAR(50) NOT NULL, -- 'premium', 'mid-range', 'budget'
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 10),
    amateur_accessibility INTEGER CHECK (amateur_accessibility >= 1 AND amateur_accessibility <= 10),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for premium product alternatives
CREATE TABLE IF NOT EXISTS premium_product_alternatives (
    id SERIAL PRIMARY KEY,
    premium_brand_id INTEGER REFERENCES premium_brand_analysis(id),
    premium_product_name VARCHAR(200) NOT NULL,
    premium_product_price_euros DECIMAL(8,2) NOT NULL,
    premium_product_features TEXT[],
    affordable_alternative_name VARCHAR(200) NOT NULL,
    affordable_alternative_price_euros DECIMAL(6,2) NOT NULL,
    cost_savings_euros DECIMAL(8,2) NOT NULL,
    effectiveness_comparison DECIMAL(3,2) NOT NULL, -- 0.0 to 1.0 scale
    alternative_source VARCHAR(100),
    alternative_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert premium brand analysis
INSERT INTO premium_brand_analysis (
    brand_name, 
    brand_website, 
    brand_category, 
    target_market, 
    price_positioning, 
    quality_rating, 
    amateur_accessibility, 
    notes
) VALUES 
('Hyperice', 'https://hyperice.com', 'recovery', 'professional_athletes', 'premium', 9, 3, 'Industry leader in recovery technology, excellent quality but very expensive'),
('Pulsio', 'https://pulsio.co.uk', 'recovery', 'serious_athletes', 'mid-range', 8, 5, 'British brand with good quality at moderate prices, more accessible than Hyperice'),
('Fizian', 'https://fizian.si', 'physiotherapy', 'clinics_professionals', 'premium', 9, 2, 'Slovenian professional physiotherapy equipment, clinical grade but very expensive'),
('Blazepod', 'https://blazepod.eu', 'performance', 'performance_coaches', 'mid-range', 8, 4, 'Smart training technology, good for skill development but pricey for amateurs'),
('Globus Corporation', 'https://www.globuscorporation.com/en/', 'medical_sports', 'medical_facilities', 'premium', 10, 1, 'Professional medical and sports equipment, highest quality but extremely expensive');

-- Insert premium product alternatives with realistic affordable options
INSERT INTO premium_product_alternatives (
    premium_brand_id,
    premium_product_name,
    premium_product_price_euros,
    premium_product_features,
    affordable_alternative_name,
    affordable_alternative_price_euros,
    cost_savings_euros,
    effectiveness_comparison,
    alternative_source,
    alternative_notes
) VALUES 
-- Hyperice alternatives
((SELECT id FROM premium_brand_analysis WHERE brand_name = 'Hyperice'), 'Hypervolt 2.0 Pro', 350.00, ARRAY['percussion_therapy', 'quiet_operation', 'professional_grade'], 'Pulsio AIR Massage Gun', 80.00, 270.00, 0.85, 'Pulsio', 'Similar percussion therapy, 85% effectiveness, much more affordable'),
((SELECT id FROM premium_brand_analysis WHERE brand_name = 'Hyperice'), 'Normatec 3 Legs', 800.00, ARRAY['compression_therapy', 'sequential_compression', 'medical_grade'], 'Portable Ice Bath + Compression Sleeves', 120.00, 680.00, 0.70, 'DIY_Combination', 'Combined approach: cold therapy + compression, 70% effectiveness'),
((SELECT id FROM premium_brand_analysis WHERE brand_name = 'Hyperice'), 'Venom 2 Back', 400.00, ARRAY['heat_therapy', 'targeted_relief', 'professional_quality'], 'Heating Pad + Tennis Ball', 25.00, 375.00, 0.65, 'DIY_Combination', 'Basic heat + targeted pressure, 65% effectiveness'),

-- Pulsio alternatives
((SELECT id FROM premium_brand_analysis WHERE brand_name = 'Pulsio'), 'Pulsio Compression Boots', 370.00, ARRAY['compression_therapy', 'adjustable_pressure', 'professional_quality'], 'Compression Sleeves + Manual Massage', 50.00, 320.00, 0.75, 'DIY_Combination', 'Compression + manual techniques, 75% effectiveness'),
((SELECT id FROM premium_brand_analysis WHERE brand_name = 'Pulsio'), 'Pulsio AIR Massage Gun', 80.00, ARRAY['percussion_therapy', 'portable', 'good_quality'], 'Foam Roller + Tennis Ball', 30.00, 50.00, 0.80, 'DIY_Combination', 'Manual techniques, 80% effectiveness, great value'),
((SELECT id FROM premium_brand_analysis WHERE brand_name = 'Pulsio'), 'Pulsio ELITE', 115.00, ARRAY['high_power', 'deep_tissue', 'professional_grade'], 'Resistance Bands + Manual Techniques', 40.00, 75.00, 0.70, 'DIY_Combination', 'Resistance training + manual work, 70% effectiveness'),

-- Fizian alternatives
((SELECT id FROM premium_brand_analysis WHERE brand_name = 'Fizian'), 'Tecar Therapy Device', 3000.00, ARRAY['radio_frequency', 'deep_heating', 'clinical_grade'], 'Hot Water Bottle + Manual Techniques', 15.00, 2985.00, 0.50, 'DIY_Combination', 'Basic heat + manual work, 50% effectiveness but massive savings'),
((SELECT id FROM premium_brand_analysis WHERE brand_name = 'Fizian'), 'EMS Device', 800.00, ARRAY['electrical_stimulation', 'muscle_activation', 'professional_grade'], 'Resistance Training + Bodyweight', 0.00, 800.00, 0.80, 'DIY_Alternative', 'Active training alternatives, 80% effectiveness, completely free'),
((SELECT id FROM premium_brand_analysis WHERE brand_name = 'Fizian'), 'Shockwave Device', 5000.00, ARRAY['acoustic_waves', 'tissue_regeneration', 'clinical_grade'], 'Foam Rolling + Stretching', 30.00, 4970.00, 0.60, 'DIY_Alternative', 'Manual tissue work, 60% effectiveness, massive cost savings'),

-- Blazepod alternatives
((SELECT id FROM premium_brand_analysis WHERE brand_name = 'Blazepod'), 'Blazepod Training Set', 300.00, ARRAY['smart_training', 'reaction_time', 'performance_tracking'], 'DIY Agility Course + Stopwatch', 25.00, 275.00, 0.75, 'DIY_Alternative', 'Homemade agility course, 75% effectiveness, great for skill development'),
((SELECT id FROM premium_brand_analysis WHERE brand_name = 'Blazepod'), 'Blazepod Reaction Trainer', 150.00, ARRAY['reaction_training', 'cognitive_development', 'portable'], 'Tennis Ball + Partner', 5.00, 145.00, 0.80, 'DIY_Alternative', 'Partner-based reaction training, 80% effectiveness'),

-- Globus alternatives
((SELECT id FROM premium_brand_analysis WHERE brand_name = 'Globus Corporation'), 'Professional Treadmill', 8000.00, ARRAY['cardio_training', 'performance_tracking', 'medical_grade'], 'Local Park + Heart Rate Monitor', 80.00, 7920.00, 0.85, 'Local_Resources', 'Outdoor training + basic monitoring, 85% effectiveness'),
((SELECT id FROM premium_brand_analysis WHERE brand_name = 'Globus Corporation'), 'Rehabilitation Equipment', 15000.00, ARRAY['clinical_rehabilitation', 'professional_grade', 'comprehensive'], 'Local Physio + Home Exercises', 500.00, 14500.00, 0.90, 'Local_Resources', 'Professional guidance + home work, 90% effectiveness');

-- Create table for local resource alternatives to premium brands
CREATE TABLE IF NOT EXISTS local_premium_alternatives (
    id SERIAL PRIMARY KEY,
    premium_brand_id INTEGER REFERENCES premium_brand_analysis(id),
    local_alternative_type VARCHAR(100) NOT NULL, -- 'physio', 'gym', 'community_center', 'sports_club'
    local_alternative_name VARCHAR(200) NOT NULL,
    local_alternative_cost_euros DECIMAL(6,2) NOT NULL,
    accessibility_rating INTEGER CHECK (accessibility_rating >= 1 AND accessibility_rating <= 10),
    effectiveness_comparison DECIMAL(3,2) NOT NULL,
    location_requirements VARCHAR(100),
    availability_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert local alternatives to premium brands
INSERT INTO local_premium_alternatives (
    premium_brand_id,
    local_alternative_type,
    local_alternative_name,
    local_alternative_cost_euros,
    accessibility_rating,
    effectiveness_comparison,
    location_requirements,
    availability_notes
) VALUES 
-- Hyperice local alternatives
((SELECT id FROM premium_brand_analysis WHERE brand_name = 'Hyperice'), 'physio', 'Local Physiotherapist', 60.00, 7, 0.90, 'local_clinic', 'Professional treatment, much cheaper than buying equipment'),
((SELECT id FROM premium_brand_analysis WHERE brand_name = 'Hyperice'), 'gym', 'Gym Recovery Room', 30.00, 6, 0.75, 'local_gym', 'Access to professional equipment, monthly membership cost'),
((SELECT id FROM premium_brand_analysis WHERE brand_name = 'Hyperice'), 'community_center', 'Community Recovery Classes', 15.00, 8, 0.70, 'community_center', 'Group sessions, very affordable, good for beginners'),

-- Pulsio local alternatives
((SELECT id FROM premium_brand_analysis WHERE brand_name = 'Pulsio'), 'sports_club', 'Team Recovery Sessions', 20.00, 9, 0.80, 'local_sports_club', 'Team-based recovery, very affordable, good for motivation'),
((SELECT id FROM premium_brand_analysis WHERE brand_name = 'Pulsio'), 'gym', 'Gym Recovery Equipment', 40.00, 7, 0.85, 'local_gym', 'Access to quality equipment, monthly cost spread out'),

-- Fizian local alternatives
((SELECT id FROM premium_brand_analysis WHERE brand_name = 'Fizian'), 'physio', 'Professional Physiotherapy', 80.00, 6, 0.95, 'local_clinic', 'Professional treatment, highest effectiveness, reasonable cost'),
((SELECT id FROM premium_brand_analysis WHERE brand_name = 'Fizian'), 'community_center', 'Community Health Programs', 25.00, 8, 0.60, 'community_center', 'Basic health services, very affordable, good for prevention'),

-- Blazepod local alternatives
((SELECT id FROM premium_brand_analysis WHERE brand_name = 'Blazepod'), 'sports_club', 'Performance Training Classes', 35.00, 7, 0.85, 'local_sports_club', 'Professional coaching, good for skill development'),
((SELECT id FROM premium_brand_analysis WHERE brand_name = 'Blazepod'), 'community_center', 'Community Sports Programs', 20.00, 9, 0.70, 'community_center', 'Group training, very affordable, good for beginners'),

-- Globus local alternatives
((SELECT id FROM premium_brand_analysis WHERE brand_name = 'Globus Corporation'), 'medical_center', 'Medical Rehabilitation Center', 100.00, 5, 0.95, 'medical_facility', 'Professional medical treatment, highest quality, expensive but covered by insurance'),
((SELECT id FROM premium_brand_analysis WHERE brand_name = 'Globus Corporation'), 'community_center', 'Community Health Center', 30.00, 8, 0.70, 'community_center', 'Basic health services, very affordable, good for maintenance');

-- Create function to find affordable alternatives to premium brands
CREATE OR REPLACE FUNCTION find_premium_alternatives(
    brand_name_param VARCHAR DEFAULT NULL,
    max_budget_euros DECIMAL DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    alternatives JSONB;
    brand_filter TEXT;
    budget_filter TEXT;
BEGIN
    -- Build filters
    brand_filter := CASE 
        WHEN brand_name_param IS NOT NULL THEN 'AND pba.brand_name = ' || quote_literal(brand_name_param)
        ELSE ''
    END;
    
    budget_filter := CASE 
        WHEN max_budget_euros IS NOT NULL THEN 'AND ppa.affordable_alternative_price_euros <= ' || max_budget_euros
        ELSE ''
    END;
    
    -- Execute query to find alternatives
    SELECT jsonb_agg(
        jsonb_build_object(
            'premium_brand', pba.brand_name,
            'premium_product', ppa.premium_product_name,
            'premium_price', ppa.premium_product_price_euros,
            'affordable_alternative', ppa.affordable_alternative_name,
            'alternative_price', ppa.affordable_alternative_price_euros,
            'cost_savings', ppa.cost_savings_euros,
            'effectiveness', ppa.effectiveness_comparison,
            'alternative_source', ppa.alternative_source,
            'notes', ppa.alternative_notes
        )
    ) INTO alternatives
    FROM premium_product_alternatives ppa
    JOIN premium_brand_analysis pba ON ppa.premium_brand_id = pba.id
    WHERE 1=1 
      AND (brand_name_param IS NULL OR pba.brand_name = brand_name_param)
      AND (max_budget_euros IS NULL OR ppa.affordable_alternative_price_euros <= max_budget_euros);
    
    RETURN COALESCE(alternatives, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Create function to find local alternatives to premium brands
CREATE OR REPLACE FUNCTION find_local_premium_alternatives(
    brand_name_param VARCHAR DEFAULT NULL,
    max_cost_euros DECIMAL DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    alternatives JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'premium_brand', pba.brand_name,
            'local_alternative_type', lpa.local_alternative_type,
            'local_alternative_name', lpa.local_alternative_name,
            'local_cost', lpa.local_alternative_cost_euros,
            'accessibility', lpa.accessibility_rating,
            'effectiveness', lpa.effectiveness_comparison,
            'location_requirements', lpa.location_requirements,
            'availability_notes', lpa.availability_notes
        )
    ) INTO alternatives
    FROM local_premium_alternatives lpa
    JOIN premium_brand_analysis pba ON lpa.premium_brand_id = pba.id
    WHERE (brand_name_param IS NULL OR pba.brand_name = brand_name_param)
      AND (max_cost_euros IS NULL OR lpa.local_alternative_cost_euros <= max_cost_euros);
    
    RETURN COALESCE(alternatives, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_premium_brand_analysis_brand ON premium_brand_analysis(brand_name);
CREATE INDEX IF NOT EXISTS idx_premium_brand_analysis_category ON premium_brand_analysis(brand_category);
CREATE INDEX IF NOT EXISTS idx_premium_product_alternatives_brand ON premium_product_alternatives(premium_brand_id);
CREATE INDEX IF NOT EXISTS idx_premium_product_alternatives_price ON premium_product_alternatives(affordable_alternative_price_euros);
CREATE INDEX IF NOT EXISTS idx_local_premium_alternatives_brand ON local_premium_alternatives(premium_brand_id);
CREATE INDEX IF NOT EXISTS idx_local_premium_alternatives_cost ON local_premium_alternatives(local_alternative_cost_euros);

-- Add comments
COMMENT ON TABLE premium_brand_analysis IS 'Analysis of premium recovery equipment brands and their accessibility to amateur athletes';
COMMENT ON TABLE premium_product_alternatives IS 'Affordable alternatives to premium brand products';
COMMENT ON TABLE local_premium_alternatives IS 'Local resource alternatives to premium brand equipment';
COMMENT ON FUNCTION find_premium_alternatives IS 'Find affordable alternatives to premium brand products within budget';
COMMENT ON FUNCTION find_local_premium_alternatives IS 'Find local resource alternatives to premium brand equipment';
