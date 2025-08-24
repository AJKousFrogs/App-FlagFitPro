-- Migration: Affordable Ice Bath Integration
-- This migration adds the affordable portable ice bath option to our realistic budget system

-- Update the DIY protocols table with the portable ice bath option
UPDATE diy_protocols 
SET equipment_needed = ARRAY['portable_ice_bath_tub', 'ice_cubes', 'thermometer'],
    step_by_step_instructions = ARRAY[
        'Set up portable ice bath tub in convenient location',
        'Fill with cold water to desired level',
        'Add ice to reach 10-15°C temperature',
        'Immerse legs/body for 10-15 minutes',
        'Gradually warm up after session',
        'Drain and clean tub for next use'
    ],
    cost_savings_euros = 47.00,
    effectiveness_rating = 8
WHERE protocol_name = 'Home Ice Bath Protocol';

-- Add the portable ice bath to affordable equipment
INSERT INTO affordable_equipment (
    equipment_name, 
    equipment_category, 
    description, 
    price_range_min, 
    price_range_max, 
    where_to_buy, 
    diy_alternatives, 
    expected_lifespan_months, 
    maintenance_requirements, 
    performance_benefit, 
    priority_for_amateur
) VALUES (
    'Portable Ice Bath Tub', 
    'recovery', 
    'XL portable foldable ice bath tub with cover for cold therapy recovery', 
    80.00, 
    150.00, 
    ARRAY['online_retailers', 'temu', 'amazon', 'fitness_stores'], 
    ARRAY['bathtub', 'large_bucket', 'storage_bin'], 
    60, 
    ARRAY['clean_after_each_use', 'store_dry_location', 'check_for_damage'], 
    'Professional-grade cold therapy recovery at home', 
    'recommended'
);

-- Create a new table for equipment price tracking
CREATE TABLE IF NOT EXISTS equipment_price_tracking (
    id SERIAL PRIMARY KEY,
    equipment_name VARCHAR(200) NOT NULL,
    source_url TEXT,
    source_name VARCHAR(100),
    price_euros DECIMAL(6,2) NOT NULL,
    date_found DATE NOT NULL,
    availability_status VARCHAR(50) DEFAULT 'available',
    shipping_cost_euros DECIMAL(6,2),
    total_cost_euros DECIMAL(6,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the Temu ice bath option
INSERT INTO equipment_price_tracking (
    equipment_name,
    source_url,
    source_name,
    price_euros,
    date_found,
    availability_status,
    shipping_cost_euros,
    total_cost_euros,
    notes
) VALUES (
    'Portable Ice Bath Tub XL',
    'https://www.temu.com/si-en/xl-portable-ice-bath-tub-with-cover-extra-large-soaking-bathtub-for-cold--athletes-fitness-recovery--durable-round-shape-with-corner-drain-foldable-bathtubs-for-adults-g-601099604697911.html',
    'Temu',
    80.00,
    CURRENT_DATE,
    'available',
    0.00,
    80.00,
    'XL portable ice bath tub with cover, foldable, corner drain, perfect for amateur athletes'
);

-- Create a table for equipment alternatives comparison
CREATE TABLE IF NOT EXISTS equipment_alternatives_comparison (
    id SERIAL PRIMARY KEY,
    primary_equipment_id INTEGER REFERENCES affordable_equipment(id),
    alternative_name VARCHAR(200) NOT NULL,
    alternative_cost_euros DECIMAL(6,2) NOT NULL,
    effectiveness_comparison DECIMAL(3,2) NOT NULL, -- 0.0 to 1.0 scale
    convenience_rating INTEGER CHECK (convenience_rating >= 1 AND convenience_rating <= 10),
    space_requirements VARCHAR(100),
    setup_time_minutes INTEGER,
    maintenance_effort VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert comparison data for ice bath alternatives
INSERT INTO equipment_alternatives_comparison (
    primary_equipment_id,
    alternative_name,
    alternative_cost_euros,
    effectiveness_comparison,
    convenience_rating,
    space_requirements,
    setup_time_minutes,
    maintenance_effort,
    notes
) VALUES 
-- Portable Ice Bath Tub alternatives
((SELECT id FROM affordable_equipment WHERE equipment_name = 'Portable Ice Bath Tub'), 'Bathtub with Ice', 5.00, 0.7, 3, 'bathroom', 15, 'low', 'Uses existing bathtub, requires ice purchase each time'),
((SELECT id FROM affordable_equipment WHERE equipment_name = 'Portable Ice Bath Tub'), 'Large Storage Bin', 20.00, 0.6, 4, 'garage_backyard', 10, 'low', 'Cheap alternative but less comfortable and portable'),
((SELECT id FROM affordable_equipment WHERE equipment_name = 'Portable Ice Bath Tub'), 'Professional Cryotherapy', 50.00, 1.0, 9, 'clinic', 5, 'none', 'Most effective but expensive and requires travel'),

-- Foam Roller alternatives
((SELECT id FROM affordable_equipment WHERE equipment_name = 'Foam Roller'), 'Tennis Ball', 2.00, 0.5, 6, 'anywhere', 2, 'low', 'Good for targeted areas but limited coverage'),
((SELECT id FROM affordable_equipment WHERE equipment_name = 'Foam Roller'), 'Water Bottle', 1.00, 0.4, 5, 'anywhere', 2, 'low', 'Basic alternative but not ideal for rolling'),
((SELECT id FROM affordable_equipment WHERE equipment_name = 'Foam Roller'), 'Rolled Towel', 0.00, 0.3, 4, 'anywhere', 3, 'low', 'Free but very limited effectiveness'),

-- Resistance Bands alternatives
((SELECT id FROM affordable_equipment WHERE equipment_name = 'Resistance Bands'), 'Bodyweight Exercises', 0.00, 0.8, 7, 'anywhere', 1, 'none', 'Free and effective but limited resistance progression'),
((SELECT id FROM affordable_equipment WHERE equipment_name = 'Resistance Bands'), 'Water Jugs', 5.00, 0.6, 4, 'home', 5, 'low', 'Cheap alternative but awkward to use'),
((SELECT id FROM affordable_equipment WHERE equipment_name = 'Resistance Bands'), 'Household Items', 0.00, 0.4, 3, 'home', 10, 'low', 'Free but limited and potentially unsafe');

-- Create a function to calculate equipment ROI over time
CREATE OR REPLACE FUNCTION calculate_equipment_roi(
    equipment_cost_euros DECIMAL,
    alternative_cost_per_use DECIMAL,
    uses_per_month INTEGER,
    equipment_lifespan_months INTEGER
) RETURNS JSONB AS $$
DECLARE
    total_alternative_cost DECIMAL;
    total_savings DECIMAL;
    roi_percentage DECIMAL;
    break_even_months DECIMAL;
    monthly_savings DECIMAL;
    result JSONB;
BEGIN
    -- Calculate total cost of alternatives over equipment lifespan
    total_alternative_cost := alternative_cost_per_use * uses_per_month * equipment_lifespan_months;
    
    -- Calculate total savings
    total_savings := total_alternative_cost - equipment_cost_euros;
    
    -- Calculate ROI percentage
    roi_percentage := CASE 
        WHEN equipment_cost_euros > 0 THEN (total_savings / equipment_cost_euros) * 100
        ELSE 0 
    END;
    
    -- Calculate break-even point
    break_even_months := CASE 
        WHEN (alternative_cost_per_use * uses_per_month) > 0 THEN equipment_cost_euros / (alternative_cost_per_use * uses_per_month)
        ELSE 0 
    END;
    
    -- Calculate monthly savings after break-even
    monthly_savings := alternative_cost_per_use * uses_per_month;
    
    -- Build result
    result := jsonb_build_object(
        'equipment_cost', equipment_cost_euros,
        'alternative_cost_per_use', alternative_cost_per_use,
        'uses_per_month', uses_per_month,
        'equipment_lifespan_months', equipment_lifespan_months,
        'total_alternative_cost', total_alternative_cost,
        'total_savings', total_savings,
        'roi_percentage', roi_percentage,
        'break_even_months', break_even_months,
        'monthly_savings_after_break_even', monthly_savings,
        'recommendation', CASE 
            WHEN roi_percentage > 100 THEN 'Highly recommended - excellent ROI'
            WHEN roi_percentage > 50 THEN 'Recommended - good ROI'
            WHEN roi_percentage > 0 THEN 'Consider if budget allows'
            ELSE 'Not cost-effective vs alternatives'
        END
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create a function to find best equipment deals
CREATE OR REPLACE FUNCTION find_best_equipment_deals(
    equipment_category_param VARCHAR DEFAULT NULL,
    max_price_euros DECIMAL DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    deals JSONB;
    category_filter TEXT;
    price_filter TEXT;
BEGIN
    -- Build filters
    category_filter := CASE 
        WHEN equipment_category_param IS NOT NULL THEN 'AND ae.equipment_category = ' || quote_literal(equipment_category_param)
        ELSE ''
    END;
    
    price_filter := CASE 
        WHEN max_price_euros IS NOT NULL THEN 'AND ae.price_range_max <= ' || max_price_euros
        ELSE ''
    END;
    
    -- Execute dynamic query to find best deals
    EXECUTE format('
        SELECT jsonb_agg(
            jsonb_build_object(
                ''equipment_name'', ae.equipment_name,
                ''category'', ae.equipment_category,
                ''price_range'', jsonb_build_object(''min'', ae.price_range_min, ''max'', ae.price_range_max),
                ''priority'', ae.priority_for_amateur,
                ''benefit'', ae.performance_benefit,
                ''diy_alternatives'', ae.diy_alternatives,
                ''best_price_found'', (
                    SELECT MIN(ept.price_euros) 
                    FROM equipment_price_tracking ept 
                    WHERE ept.equipment_name = ae.equipment_name
                )
            )
        ) INTO deals
        FROM affordable_equipment ae
        WHERE 1=1 %s %s
        ORDER BY ae.priority_for_amateur DESC, ae.price_range_min ASC
    ', category_filter, price_filter);
    
    RETURN COALESCE(deals, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON TABLE equipment_price_tracking IS 'Track equipment prices from different sources for comparison shopping';
COMMENT ON TABLE equipment_alternatives_comparison IS 'Compare equipment effectiveness and cost with alternatives';
COMMENT ON FUNCTION calculate_equipment_roi IS 'Calculate return on investment for equipment purchases vs alternatives';
COMMENT ON FUNCTION find_best_equipment_deals IS 'Find best equipment deals within budget and category constraints';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_equipment_price_tracking_equipment ON equipment_price_tracking(equipment_name);
CREATE INDEX IF NOT EXISTS idx_equipment_price_tracking_price ON equipment_price_tracking(price_euros);
CREATE INDEX IF NOT EXISTS idx_equipment_alternatives_primary ON equipment_alternatives_comparison(primary_equipment_id);
CREATE INDEX IF NOT EXISTS idx_equipment_alternatives_cost ON equipment_alternatives_comparison(alternative_cost_euros);
