-- Migration: Affordable Brand Integration
-- This migration correctly categorizes these brands as affordable options, not just premium alternatives

-- Update the premium brand analysis to reflect actual affordability
UPDATE premium_brand_analysis 
SET price_positioning = 'mid-range',
    amateur_accessibility = 7,
    notes = 'Actually affordable for serious amateur athletes, not just premium alternatives'
WHERE brand_name = 'Pulsio';

UPDATE premium_brand_analysis 
SET price_positioning = 'mid-range',
    amateur_accessibility = 6,
    notes = 'Smart training technology accessible to intermediate amateur athletes'
WHERE brand_name = 'Blazepod';

UPDATE premium_brand_analysis 
SET price_positioning = 'mixed',
    amateur_accessibility = 5,
    notes = 'Mix of affordable amateur equipment and expensive professional devices'
WHERE brand_name = 'Fizian';

UPDATE premium_brand_analysis 
SET price_positioning = 'mixed',
    amateur_accessibility = 4,
    notes = 'Range from affordable amateur equipment to expensive professional devices'
WHERE brand_name = 'Globus Corporation';

-- Create table for affordable brand products that amateur players can actually buy
CREATE TABLE IF NOT EXISTS affordable_brand_products (
    id SERIAL PRIMARY KEY,
    brand_name VARCHAR(100) NOT NULL,
    brand_website TEXT,
    product_name VARCHAR(200) NOT NULL,
    product_category VARCHAR(100) NOT NULL, -- 'recovery', 'training', 'performance', 'accessories'
    price_euros DECIMAL(6,2) NOT NULL,
    amateur_budget_tier VARCHAR(50) NOT NULL, -- 'minimal_500', 'moderate_1000', 'serious_2000'
    affordability_rating INTEGER CHECK (affordability_rating >= 1 AND affordability_rating <= 10),
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 10),
    value_for_money INTEGER CHECK (value_for_money >= 1 AND value_for_money <= 10),
    best_for VARCHAR(200),
    considerations TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert affordable products from these brands that amateur players can actually afford
INSERT INTO affordable_brand_products (
    brand_name, 
    brand_website, 
    product_name, 
    product_category, 
    price_euros, 
    amateur_budget_tier, 
    affordability_rating, 
    quality_rating, 
    value_for_money, 
    best_for, 
    considerations
) VALUES 
-- Pulsio Affordable Products
('Pulsio', 'https://pulsio.co.uk', 'Pulsio AIR Massage Gun', 'recovery', 80.00, 'moderate_1000', 8, 8, 9, 'Serious amateur athletes who want quality recovery tools', ARRAY['Excellent value for money', 'British quality', 'Good warranty', 'Portable design']),
('Pulsio', 'https://pulsio.co.uk', 'Pulsio ELITE', 'recovery', 115.00, 'serious_2000', 7, 9, 8, 'Advanced amateur athletes who need deep tissue work', ARRAY['High power output', 'Professional quality', 'Good for serious training', 'Worth the investment']),
('Pulsio', 'https://pulsio.co.uk', 'Compression Sleeve', 'recovery', 79.99, 'moderate_1000', 8, 8, 8, 'Amateur athletes who want compression therapy', ARRAY['Portable compression', 'Good for travel', 'Easy to use', 'Reasonable price']),

-- Blazepod Affordable Products
('Blazepod', 'https://blazepod.eu', 'Blazepod Training Set', 'performance', 300.00, 'serious_2000', 6, 9, 7, 'Performance-focused amateur athletes', ARRAY['Smart training technology', 'Great for skill development', 'Professional quality', 'Investment piece']),
('Blazepod', 'https://blazepod.eu', 'Blazepod Reaction Trainer', 'performance', 150.00, 'moderate_1000', 7, 8, 8, 'Intermediate athletes improving reaction time', ARRAY['Good for cognitive training', 'Portable', 'Reasonable price', 'Effective for skill development']),

-- Fizian Affordable Products (the ones amateurs can actually buy)
('Fizian', 'https://fizian.si', 'Basic EMS Device', 'recovery', 200.00, 'serious_2000', 7, 8, 7, 'Serious amateur athletes with specific needs', ARRAY['Professional quality', 'Specific use cases', 'Good for recovery', 'Investment for serious athletes']),
('Fizian', 'https://fizian.si', 'Portable Tecar Device', 'recovery', 500.00, 'serious_2000', 6, 9, 6, 'Very serious amateur athletes', ARRAY['Professional grade', 'Expensive but effective', 'Long-term investment', 'For committed athletes only']),

-- Globus Affordable Products (the ones amateurs can actually buy)
('Globus Corporation', 'https://www.globuscorporation.com/en/', 'Basic Rehabilitation Kit', 'recovery', 300.00, 'serious_2000', 7, 9, 7, 'Serious amateur athletes with injury history', ARRAY['Medical grade quality', 'Professional standard', 'Good for rehabilitation', 'Investment for serious needs']),
('Globus Corporation', 'https://www.globuscorporation.com/en/', 'Performance Monitoring Device', 'performance', 400.00, 'serious_2000', 6, 9, 7, 'Data-driven amateur athletes', ARRAY['Professional monitoring', 'Accurate data', 'Good for tracking progress', 'Investment for serious athletes']);

-- Create table for budget-friendly alternatives to these affordable brands
CREATE TABLE IF NOT EXISTS budget_friendly_alternatives (
    id SERIAL PRIMARY KEY,
    affordable_brand_product_id INTEGER REFERENCES affordable_brand_products(id),
    alternative_name VARCHAR(200) NOT NULL,
    alternative_cost_euros DECIMAL(6,2) NOT NULL,
    cost_savings_euros DECIMAL(6,2) NOT NULL,
    effectiveness_comparison DECIMAL(3,2) NOT NULL, -- 0.0 to 1.0 scale
    alternative_source VARCHAR(100),
    best_for_budget_tier VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert budget-friendly alternatives to these affordable brands
INSERT INTO budget_friendly_alternatives (
    affordable_brand_product_id,
    alternative_name,
    alternative_cost_euros,
    cost_savings_euros,
    effectiveness_comparison,
    alternative_source,
    best_for_budget_tier,
    notes
) VALUES 
-- Pulsio AIR alternatives
((SELECT id FROM affordable_brand_products WHERE product_name = 'Pulsio AIR Massage Gun'), 'Foam Roller + Tennis Ball', 30.00, 50.00, 0.80, 'DIY_Combination', 'minimal_500', '80% effectiveness for 38% of the cost - great for beginners'),
((SELECT id FROM affordable_brand_products WHERE product_name = 'Pulsio AIR Massage Gun'), 'Basic Massage Gun', 40.00, 40.00, 0.75, 'Generic_Brand', 'minimal_500', '75% effectiveness for 50% of the cost - good budget option'),

-- Pulsio ELITE alternatives
((SELECT id FROM affordable_brand_products WHERE product_name = 'Pulsio ELITE'), 'Resistance Bands + Manual Techniques', 40.00, 75.00, 0.70, 'DIY_Combination', 'minimal_500', '70% effectiveness for 35% of the cost - manual work but effective'),
((SELECT id FROM affordable_brand_products WHERE product_name = 'Pulsio ELITE'), 'Mid-Range Massage Gun', 60.00, 55.00, 0.80, 'Generic_Brand', 'moderate_1000', '80% effectiveness for 52% of the cost - good compromise'),

-- Blazepod alternatives
((SELECT id FROM affordable_brand_products WHERE product_name = 'Blazepod Training Set'), 'DIY Agility Course + Stopwatch', 25.00, 275.00, 0.75, 'DIY_Alternative', 'minimal_500', '75% effectiveness for 8% of the cost - massive savings'),
((SELECT id FROM affordable_brand_products WHERE product_name = 'Blazepod Training Set'), 'Basic Agility Equipment', 80.00, 220.00, 0.85, 'Generic_Brand', 'moderate_1000', '85% effectiveness for 27% of the cost - good value'),

-- Fizian alternatives
((SELECT id FROM affordable_brand_products WHERE product_name = 'Basic EMS Device'), 'Resistance Training + Bodyweight', 0.00, 200.00, 0.80, 'DIY_Alternative', 'minimal_500', '80% effectiveness for 0% of the cost - completely free'),
((SELECT id FROM affordable_brand_products WHERE product_name = 'Basic EMS Device'), 'Basic Recovery Tools', 100.00, 100.00, 0.70, 'DIY_Combination', 'moderate_1000', '70% effectiveness for 50% of the cost - good alternative');

-- Create function to find affordable brand products within budget
CREATE OR REPLACE FUNCTION find_affordable_brand_products(
    budget_tier_param VARCHAR DEFAULT NULL,
    max_price_euros DECIMAL DEFAULT NULL,
    category_param VARCHAR DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    products JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'brand_name', abp.brand_name,
            'brand_website', abp.brand_website,
            'product_name', abp.product_name,
            'product_category', abp.product_category,
            'price_euros', abp.price_euros,
            'budget_tier', abp.amateur_budget_tier,
            'affordability_rating', abp.affordability_rating,
            'quality_rating', abp.quality_rating,
            'value_for_money', abp.value_for_money,
            'best_for', abp.best_for,
            'considerations', abp.considerations,
            'budget_alternatives', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'alternative_name', bfa.alternative_name,
                        'alternative_cost', bfa.alternative_cost_euros,
                        'cost_savings', bfa.cost_savings_euros,
                        'effectiveness', bfa.effectiveness_comparison,
                        'best_for_budget', bfa.best_for_budget_tier,
                        'notes', bfa.notes
                    )
                )
                FROM budget_friendly_alternatives bfa
                WHERE bfa.affordable_brand_product_id = abp.id
            )
        )
    ) INTO products
    FROM affordable_brand_products abp
    WHERE (budget_tier_param IS NULL OR abp.amateur_budget_tier = budget_tier_param)
      AND (max_price_euros IS NULL OR abp.price_euros <= max_price_euros)
      AND (category_param IS NULL OR abp.product_category = category_param)
    ORDER BY abp.value_for_money DESC, abp.price_euros ASC;
    
    RETURN COALESCE(products, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql;

-- Create function to compare affordable brands vs DIY alternatives
CREATE OR REPLACE FUNCTION compare_affordable_vs_diy(
    product_id_param INTEGER
) RETURNS JSONB AS $$
DECLARE
    comparison JSONB;
    product_record RECORD;
    alternatives JSONB;
BEGIN
    -- Get product details
    SELECT * INTO product_record
    FROM affordable_brand_products
    WHERE id = product_id_param;
    
    -- Get alternatives
    SELECT jsonb_agg(
        jsonb_build_object(
            'alternative_name', bfa.alternative_name,
            'alternative_cost', bfa.alternative_cost_euros,
            'cost_savings', bfa.cost_savings_euros,
            'effectiveness', bfa.effectiveness_comparison,
            'effectiveness_percentage', (bfa.effectiveness_comparison * 100),
            'cost_percentage', ((bfa.alternative_cost_euros / product_record.price_euros) * 100),
            'value_ratio', (bfa.effectiveness_comparison / (bfa.alternative_cost_euros / product_record.price_euros)),
            'recommendation', CASE 
                WHEN (bfa.effectiveness_comparison / (bfa.alternative_cost_euros / product_record.price_euros)) > 1.5 THEN 'DIY alternative offers better value'
                WHEN (bfa.effectiveness_comparison / (bfa.alternative_cost_euros / product_record.price_euros)) > 1.0 THEN 'DIY alternative is good value'
                ELSE 'Brand product offers better value'
            END
        )
    ) INTO alternatives
    FROM budget_friendly_alternatives bfa
    WHERE bfa.affordable_brand_product_id = product_id_param;
    
    -- Build comparison
    comparison := jsonb_build_object(
        'product', jsonb_build_object(
            'name', product_record.product_name,
            'brand', product_record.brand_name,
            'price', product_record.price_euros,
            'quality', product_record.quality_rating,
            'value', product_record.value_for_money
        ),
        'alternatives', alternatives,
        'summary', jsonb_build_object(
            'total_alternatives', jsonb_array_length(alternatives),
            'best_value_alternative', (
                SELECT bfa.alternative_name
                FROM budget_friendly_alternatives bfa
                WHERE bfa.affordable_brand_product_id = product_id_param
                ORDER BY (bfa.effectiveness_comparison / (bfa.alternative_cost_euros / product_record.price_euros)) DESC
                LIMIT 1
            ),
            'overall_recommendation', CASE 
                WHEN product_record.value_for_money >= 8 THEN 'This product offers good value for money'
                WHEN product_record.value_for_money >= 6 THEN 'This product is worth considering if budget allows'
                ELSE 'Consider alternatives or DIY options'
            END
        )
    );
    
    RETURN comparison;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_affordable_brand_products_brand ON affordable_brand_products(brand_name);
CREATE INDEX IF NOT EXISTS idx_affordable_brand_products_budget ON affordable_brand_products(amateur_budget_tier);
CREATE INDEX IF NOT EXISTS idx_affordable_brand_products_price ON affordable_brand_products(price_euros);
CREATE INDEX IF NOT EXISTS idx_affordable_brand_products_category ON affordable_brand_products(product_category);
CREATE INDEX IF NOT EXISTS idx_budget_friendly_alternatives_product ON budget_friendly_alternatives(affordable_brand_product_id);
CREATE INDEX IF NOT EXISTS idx_budget_friendly_alternatives_cost ON budget_friendly_alternatives(alternative_cost_euros);

-- Add comments
COMMENT ON TABLE affordable_brand_products IS 'Affordable products from quality brands that amateur athletes can actually buy';
COMMENT ON TABLE budget_friendly_alternatives IS 'Budget-friendly alternatives to affordable brand products';
COMMENT ON FUNCTION find_affordable_brand_products IS 'Find affordable brand products within budget constraints';
COMMENT ON FUNCTION compare_affordable_vs_diy IS 'Compare affordable brand products vs DIY alternatives';
