-- Migration: Realistic Amateur Budget System
-- This migration redesigns the system for real amateur players with realistic budgets and constraints

-- 1. REALISTIC BUDGET CATEGORIES FOR AMATEUR PLAYERS
CREATE TABLE IF NOT EXISTS realistic_budget_categories (
    id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    category_description TEXT NOT NULL,
    why_it_matters TEXT NOT NULL,
    min_spend_euros DECIMAL(6,2) NOT NULL,
    max_spend_euros DECIMAL(6,2) NOT NULL,
    priority_level VARCHAR(20) CHECK (priority_level IN ('critical', 'high', 'medium', 'low')),
    expected_roi_percentage DECIMAL(5,2),
    diy_alternatives TEXT[],
    local_resource_options TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. AFFORDABLE EQUIPMENT AND TOOLS
CREATE TABLE IF NOT EXISTS affordable_equipment (
    id SERIAL PRIMARY KEY,
    equipment_name VARCHAR(200) NOT NULL,
    equipment_category VARCHAR(100) NOT NULL, -- 'recovery', 'training', 'nutrition', 'measurement', 'safety'
    description TEXT NOT NULL,
    price_range_min DECIMAL(6,2) NOT NULL,
    price_range_max DECIMAL(6,2) NOT NULL,
    where_to_buy TEXT[],
    diy_alternatives TEXT[],
    expected_lifespan_months INTEGER,
    maintenance_requirements TEXT[],
    performance_benefit TEXT,
    priority_for_amateur VARCHAR(20) CHECK (priority_for_amateur IN ('essential', 'recommended', 'nice_to_have')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. LOCAL RESOURCE MAPPING
CREATE TABLE IF NOT EXISTS local_resources (
    id SERIAL PRIMARY KEY,
    resource_name VARCHAR(200) NOT NULL,
    resource_type VARCHAR(100) NOT NULL, -- 'gym', 'coach', 'physio', 'nutritionist', 'facility'
    location_city VARCHAR(100),
    location_address TEXT,
    contact_info JSONB,
    services_offered TEXT[],
    pricing_info TEXT,
    amateur_friendly BOOLEAN DEFAULT true,
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    affordability_rating INTEGER CHECK (affordability_rating >= 1 AND affordability_rating <= 5),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. DIY RECOVERY AND TRAINING PROTOCOLS
CREATE TABLE IF NOT EXISTS diy_protocols (
    id SERIAL PRIMARY KEY,
    protocol_name VARCHAR(200) NOT NULL,
    protocol_type VARCHAR(100) NOT NULL, -- 'recovery', 'training', 'nutrition', 'mobility', 'mental'
    target_outcome VARCHAR(200) NOT NULL,
    equipment_needed TEXT[],
    time_required_minutes INTEGER NOT NULL,
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    step_by_step_instructions TEXT[],
    video_tutorial_url TEXT,
    safety_considerations TEXT[],
    effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 10),
    cost_savings_euros DECIMAL(6,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. REALISTIC PERFORMANCE PLANS
CREATE TABLE IF NOT EXISTS realistic_performance_plans (
    id SERIAL PRIMARY KEY,
    plan_name VARCHAR(200) NOT NULL,
    budget_tier VARCHAR(50) NOT NULL, -- 'minimal_500', 'moderate_1000', 'serious_2000'
    total_budget_euros DECIMAL(6,2) NOT NULL,
    target_athlete_profile TEXT NOT NULL,
    plan_description TEXT NOT NULL,
    core_components TEXT[] NOT NULL,
    expected_outcomes TEXT[] NOT NULL,
    timeline_weeks INTEGER NOT NULL,
    equipment_requirements TEXT[],
    local_resource_needs TEXT[],
    diy_protocols_included TEXT[],
    cost_breakdown JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. COST-EFFECTIVE ALTERNATIVES
CREATE TABLE IF NOT EXISTS cost_effective_alternatives (
    id SERIAL PRIMARY KEY,
    premium_solution VARCHAR(200) NOT NULL,
    premium_cost_euros DECIMAL(8,2) NOT NULL,
    affordable_alternative VARCHAR(200) NOT NULL,
    alternative_cost_euros DECIMAL(6,2) NOT NULL,
    cost_savings_euros DECIMAL(8,2) NOT NULL,
    effectiveness_comparison TEXT NOT NULL,
    trade_offs TEXT[],
    when_to_consider_premium TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. AMATEUR-FRIENDLY TRAINING PROGRAMS
CREATE TABLE IF NOT EXISTS amateur_training_programs (
    id SERIAL PRIMARY KEY,
    program_name VARCHAR(200) NOT NULL,
    program_type VARCHAR(100) NOT NULL, -- 'strength', 'cardio', 'skill', 'mobility', 'recovery'
    skill_level VARCHAR(20) CHECK (skill_level IN ('beginner', 'intermediate', 'advanced')),
    equipment_required TEXT[],
    space_requirements VARCHAR(100),
    time_per_session_minutes INTEGER NOT NULL,
    sessions_per_week INTEGER NOT NULL,
    program_duration_weeks INTEGER NOT NULL,
    exercises TEXT[] NOT NULL,
    progression_plan TEXT[],
    safety_guidelines TEXT[],
    expected_results TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. BUDGET-FRIENDLY NUTRITION PLANS
CREATE TABLE IF NOT EXISTS budget_nutrition_plans (
    id SERIAL PRIMARY KEY,
    plan_name VARCHAR(200) NOT NULL,
    budget_per_month_euros DECIMAL(6,2) NOT NULL,
    target_calories INTEGER,
    target_protein_g INTEGER,
    meal_plan_structure TEXT[],
    shopping_list TEXT[],
    cost_breakdown JSONB,
    time_saving_tips TEXT[],
    batch_cooking_instructions TEXT[],
    supplement_recommendations TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_realistic_budget_categories_priority ON realistic_budget_categories(priority_level);
CREATE INDEX IF NOT EXISTS idx_affordable_equipment_category ON affordable_equipment(equipment_category);
CREATE INDEX IF NOT EXISTS idx_affordable_equipment_priority ON affordable_equipment(priority_for_amateur);
CREATE INDEX IF NOT EXISTS idx_local_resources_type_city ON local_resources(resource_type, location_city);
CREATE INDEX IF NOT EXISTS idx_local_resources_affordability ON local_resources(affordability_rating);
CREATE INDEX IF NOT EXISTS idx_diy_protocols_type ON diy_protocols(protocol_type);
CREATE INDEX IF NOT EXISTS idx_realistic_performance_plans_budget ON realistic_performance_plans(budget_tier);
CREATE INDEX IF NOT EXISTS idx_cost_effective_alternatives_savings ON cost_effective_alternatives(cost_savings_euros DESC);
CREATE INDEX IF NOT EXISTS idx_amateur_training_programs_type_level ON amateur_training_programs(program_type, skill_level);
CREATE INDEX IF NOT EXISTS idx_budget_nutrition_plans_budget ON budget_nutrition_plans(budget_per_month_euros);

-- Insert realistic budget categories for amateur players
INSERT INTO realistic_budget_categories (category_name, category_description, why_it_matters, min_spend_euros, max_spend_euros, priority_level, expected_roi_percentage, diy_alternatives, local_resource_options) VALUES
('Basic Recovery Tools', 'Essential recovery equipment for home use', 'Prevents injuries, improves recovery, affordable investment', 50.00, 200.00, 'critical', 80.0, ARRAY['foam_rolling', 'stretching', 'ice_baths'], ARRAY['sports_stores', 'online_retailers', 'second_hand']),
('Nutrition Basics', 'Protein powder, basic supplements, meal planning', 'Fuels training, supports recovery, cost-effective nutrition', 100.00, 300.00, 'critical', 85.0, ARRAY['home_cooking', 'meal_prep', 'local_produce'], ARRAY['supermarkets', 'health_stores', 'bulk_stores']),
('Personal Training', '1-2 sessions per month with qualified coach', 'Improves technique, prevents injuries, personalized guidance', 80.00, 200.00, 'high', 75.0, ARRAY['online_coaching', 'team_practices', 'self_study'], ARRAY['local_coaches', 'team_coaches', 'online_platforms']),
('Basic Equipment', 'Personal gear, training tools, measurement devices', 'Enables training, tracks progress, long-term investment', 100.00, 300.00, 'high', 70.0, ARRAY['bodyweight_exercises', 'household_items', 'public_parks'], ARRAY['sports_stores', 'online_retailers', 'community_centers']),
('Health Screenings', 'Annual basic health check, injury assessment', 'Prevents serious issues, early intervention', 50.00, 150.00, 'medium', 90.0, ARRAY['self_assessment', 'team_screening', 'free_clinics'], ARRAY['local_clinics', 'sports_medicine', 'community_health']),
('Performance Apps', 'Training apps, nutrition tracking, recovery monitoring', 'Affordable technology, data-driven decisions', 20.00, 100.00, 'medium', 60.0, ARRAY['free_apps', 'manual_tracking', 'spreadsheets'], ARRAY['app_stores', 'online_platforms', 'free_alternatives']),
('Tournament Fees', 'Local and regional competition entry fees', 'Game experience, skill development, motivation', 50.00, 200.00, 'low', 50.0, ARRAY['friendly_games', 'practice_matches', 'local_leagues'], ARRAY['local_clubs', 'regional_federations', 'community_events']);

-- Insert affordable equipment options
INSERT INTO affordable_equipment (equipment_name, equipment_category, description, price_range_min, price_range_max, where_to_buy, diy_alternatives, expected_lifespan_months, maintenance_requirements, performance_benefit, priority_for_amateur) VALUES
('Foam Roller', 'recovery', 'Basic foam roller for muscle recovery and mobility', 15.00, 40.00, ARRAY['sports_stores', 'online_retailers', 'supermarkets'], ARRAY['tennis_ball', 'water_bottle', 'rolled_towel'], 24, ARRAY['clean_regularly', 'replace_when_worn'], 'Improves muscle recovery and mobility', 'essential'),
('Resistance Bands', 'training', 'Versatile resistance bands for strength training', 20.00, 60.00, ARRAY['sports_stores', 'online_retailers', 'fitness_stores'], ARRAY['bodyweight_exercises', 'household_items', 'water_jugs'], 18, ARRAY['check_for_tears', 'store_properly'], 'Enables strength training at home', 'essential'),
('Protein Powder', 'nutrition', 'Basic whey protein for muscle recovery', 25.00, 80.00, ARRAY['supermarkets', 'health_stores', 'online_retailers'], ARRAY['eggs', 'greek_yogurt', 'lean_meat'], 12, ARRAY['store_cool_dry_place', 'use_by_date'], 'Supports muscle recovery and growth', 'essential'),
('Heart Rate Monitor', 'measurement', 'Basic heart rate monitoring for training intensity', 30.00, 100.00, ARRAY['sports_stores', 'online_retailers', 'electronics_stores'], ARRAY['perceived_exertion', 'talk_test', 'manual_pulse'], 36, ARRAY['clean_sensors', 'replace_battery'], 'Tracks training intensity and recovery', 'recommended'),
('Creatine Monohydrate', 'nutrition', 'Evidence-based supplement for strength and power', 15.00, 40.00, ARRAY['health_stores', 'online_retailers', 'pharmacies'], ARRAY['natural_foods', 'other_supplements'], 24, ARRAY['store_dry_place', 'use_consistently'], 'Improves strength and power output', 'recommended'),
('Mobility Tools', 'recovery', 'Lacrosse ball, massage stick for mobility work', 10.00, 30.00, ARRAY['sports_stores', 'online_retailers'], ARRAY['tennis_ball', 'water_bottle', 'rolling_pin'], 24, ARRAY['clean_regularly', 'replace_when_worn'], 'Improves joint mobility and flexibility', 'recommended');

-- Insert DIY protocols for cost-effective solutions
INSERT INTO diy_protocols (protocol_name, protocol_type, target_outcome, equipment_needed, time_required_minutes, difficulty_level, step_by_step_instructions, effectiveness_rating, cost_savings_euros, safety_considerations) VALUES
('Home Ice Bath Protocol', 'recovery', 'Reduce muscle soreness and inflammation', ARRAY['bathtub', 'ice_cubes', 'thermometer'], 20, 'beginner', ARRAY['Fill bathtub with cold water', 'Add ice to reach 10-15°C', 'Immerse legs/body for 10-15 minutes', 'Gradually warm up after'], 7, 50.00, ARRAY['Start with shorter duration', 'Avoid if you have heart conditions', 'Listen to your body']),
('Bodyweight Strength Circuit', 'training', 'Build strength without expensive equipment', ARRAY['none'], 45, 'beginner', ARRAY['Push-ups: 3 sets of 10-20', 'Squats: 3 sets of 15-25', 'Planks: 3 sets of 30-60 seconds', 'Lunges: 3 sets of 10 each leg'], 8, 200.00, ARRAY['Maintain proper form', 'Progress gradually', 'Rest between sets']),
('Kitchen Nutrition Prep', 'nutrition', 'Affordable meal preparation for performance', ARRAY['basic_cookware', 'storage_containers'], 60, 'beginner', ARRAY['Plan meals for the week', 'Buy ingredients in bulk', 'Cook large batches', 'Store in portioned containers'], 9, 300.00, ARRAY['Follow food safety guidelines', 'Store properly', 'Use within safe timeframes']),
('Park Mobility Routine', 'mobility', 'Improve flexibility using public facilities', ARRAY['none'], 30, 'beginner', ARRAY['Dynamic stretching', 'Hip mobility work', 'Shoulder mobility exercises', 'Ankle and wrist mobility'], 7, 100.00, ARRAY['Warm up properly', 'Move within comfortable range', 'Avoid overstretching']);

-- Insert realistic performance plans for different budget tiers
INSERT INTO realistic_performance_plans (plan_name, budget_tier, total_budget_euros, target_athlete_profile, plan_description, core_components, expected_outcomes, timeline_weeks, equipment_requirements, local_resource_needs, diy_protocols_included, cost_breakdown) VALUES
('Minimal Investment Plan', 'minimal_500', 500.00, 'Beginner player with limited budget, wants basic improvement', 'Affordable performance optimization for players starting their journey', ARRAY['basic_recovery', 'nutrition_basics', 'home_training', 'health_monitoring'], ARRAY['reduced_injury_risk', 'improved_recovery', 'basic_strength_gains', 'better_nutrition_habits'], 12, ARRAY['foam_roller', 'resistance_bands', 'protein_powder'], ARRAY['local_gym_access', 'basic_coaching'], ARRAY['home_ice_baths', 'bodyweight_circuits', 'kitchen_nutrition'], '{"recovery_tools": 100, "nutrition": 150, "equipment": 100, "health": 50, "training": 100}'),
('Moderate Investment Plan', 'moderate_1000', 1000.00, 'Intermediate player serious about improvement, can invest more', 'Balanced approach with quality equipment and professional guidance', ARRAY['quality_recovery', 'comprehensive_nutrition', 'personal_training', 'performance_tracking'], ARRAY['significant_strength_gains', 'improved_technique', 'better_recovery', 'injury_prevention'], 16, ARRAY['foam_roller', 'resistance_bands', 'heart_rate_monitor', 'mobility_tools'], ARRAY['personal_coach', 'local_physio'], ARRAY['advanced_home_protocols', 'structured_training'], '{"recovery_tools": 200, "nutrition": 250, "equipment": 200, "health": 100, "training": 250}'),
('Serious Investment Plan', 'serious_2000', 2000.00, 'Advanced player committed to elite performance, has budget', 'Comprehensive performance optimization with professional support', ARRAY['premium_recovery', 'elite_nutrition', 'extensive_coaching', 'advanced_tracking'], ARRAY['elite_performance', 'professional_technique', 'optimal_recovery', 'injury_prevention'], 20, ARRAY['premium_equipment', 'advanced_tools', 'measurement_devices'], ARRAY['elite_coach', 'sports_physio', 'nutritionist'], ARRAY['custom_protocols', 'advanced_training'], '{"recovery_tools": 400, "nutrition": 500, "equipment": 400, "health": 200, "training": 500}');

-- Insert cost-effective alternatives to premium solutions
INSERT INTO cost_effective_alternatives (premium_solution, premium_cost_euros, affordable_alternative, alternative_cost_euros, cost_savings_euros, effectiveness_comparison, trade_offs, when_to_consider_premium) VALUES
('Professional Cryotherapy Session', 50.00, 'Home Ice Bath Protocol', 5.00, 45.00, '80% as effective for basic recovery needs', ARRAY['Less precise temperature control', 'Shorter duration', 'Limited body coverage'], 'When you need whole-body treatment or precise temperature control'),
('Personal Training Session', 80.00, 'Online Coaching Program', 20.00, 60.00, '70% as effective for technique improvement', ARRAY['Less personalized feedback', 'No hands-on correction', 'Limited real-time interaction'], 'When you need hands-on technique correction or have complex movement issues'),
('Premium Protein Powder', 80.00, 'Basic Whey Protein', 30.00, 50.00, '90% as effective for muscle recovery', ARRAY['Less flavor variety', 'Basic processing', 'Fewer added nutrients'], 'When you need specific protein types or have dietary restrictions'),
('GPS Performance Tracker', 300.00, 'Heart Rate Monitor + App', 80.00, 220.00, '75% as effective for training monitoring', ARRAY['Less detailed movement data', 'Limited GPS tracking', 'Basic performance metrics'], 'When you need detailed movement analysis or team performance tracking'),
('Professional Massage', 80.00, 'Self-Massage with Tools', 30.00, 50.00, '60% as effective for muscle recovery', ARRAY['Less deep tissue work', 'Limited professional expertise', 'Self-treatment limitations'], 'When you have specific injuries or need deep tissue work');

-- Insert amateur-friendly training programs
INSERT INTO amateur_training_programs (program_name, program_type, skill_level, equipment_required, space_requirements, time_per_session_minutes, sessions_per_week, program_duration_weeks, exercises, progression_plan, safety_guidelines, expected_results) VALUES
('Home Strength Foundation', 'strength', 'beginner', ARRAY['resistance_bands', 'bodyweight'], 'small_room', 45, 3, 8, ARRAY['push_ups', 'squats', 'planks', 'lunges', 'glute_bridges'], ARRAY['Week 1-2: Learn proper form', 'Week 3-4: Increase repetitions', 'Week 5-6: Add resistance bands', 'Week 7-8: Progress to advanced variations'], ARRAY['Maintain proper form', 'Progress gradually', 'Rest between sets', 'Listen to your body'], ARRAY['Basic strength foundation', 'Improved body awareness', 'Better movement patterns']),
('Park Cardio Circuit', 'cardio', 'intermediate', ARRAY['none'], 'public_park', 60, 2, 6, ARRAY['jogging', 'sprint_intervals', 'burpees', 'mountain_climbers', 'jumping_jacks'], ARRAY['Week 1-2: Build endurance', 'Week 3-4: Increase intensity', 'Week 5-6: Add complexity'], ARRAY['Warm up properly', 'Stay hydrated', 'Modify for fitness level'], ARRAY['Improved cardiovascular fitness', 'Better endurance', 'Enhanced recovery']),
('Flag Football Skills', 'skill', 'beginner', ARRAY['football', 'cones'], 'backyard_park', 90, 2, 10, ARRAY['route_running', 'catching_drills', 'throwing_practice', 'agility_work'], ARRAY['Week 1-3: Basic skills', 'Week 4-6: Intermediate techniques', 'Week 7-10: Advanced combinations'], ARRAY['Focus on technique', 'Practice consistently', 'Record and review'], ARRAY['Improved throwing accuracy', 'Better route running', 'Enhanced catching ability']);

-- Insert budget-friendly nutrition plans
INSERT INTO budget_nutrition_plans (plan_name, budget_per_month_euros, target_calories, target_protein_g, meal_plan_structure, shopping_list, cost_breakdown, time_saving_tips, batch_cooking_instructions, supplement_recommendations) VALUES
('Budget Performance Nutrition', 150.00, 2500, 150, ARRAY['Breakfast: Oatmeal with protein', 'Lunch: Rice and beans with vegetables', 'Dinner: Chicken with potatoes', 'Snacks: Greek yogurt, nuts, fruit'], ARRAY['Oats, rice, beans, chicken, eggs', 'Vegetables, fruits, nuts', 'Greek yogurt, milk', 'Basic supplements'], '{"proteins": 60, "carbohydrates": 40, "fats": 30, "supplements": 20}', ARRAY['Cook in batches', 'Use frozen vegetables', 'Buy in bulk', 'Plan meals ahead'], ARRAY['Cook chicken in large batches', 'Prepare rice and beans weekly', 'Make overnight oats', 'Freeze portions'], ARRAY['Whey protein powder', 'Creatine monohydrate', 'Multivitamin', 'Omega-3']),
('Moderate Performance Nutrition', 250.00, 2800, 180, ARRAY['Breakfast: Protein smoothie with oats', 'Lunch: Turkey wrap with vegetables', 'Dinner: Salmon with quinoa', 'Snacks: Protein bars, nuts, fruit'], ARRAY['Lean meats, fish, eggs', 'Quinoa, sweet potatoes, vegetables', 'Protein powder, protein bars', 'Quality supplements'], '{"proteins": 80, "carbohydrates": 50, "fats": 40, "supplements": 40, "convenience": 40}', ARRAY['Meal prep on weekends', 'Use quality convenience foods', 'Invest in good supplements'], ARRAY['Prepare protein sources weekly', 'Cook grains in batches', 'Make protein bars', 'Portion and freeze'], ARRAY['Whey protein isolate', 'Creatine monohydrate', 'BCAAs', 'Multivitamin', 'Omega-3', 'Vitamin D']);

-- Create function to generate realistic budget recommendations
CREATE OR REPLACE FUNCTION generate_realistic_budget_recommendations(
    user_budget_euros DECIMAL,
    user_priority VARCHAR DEFAULT 'balanced'
) RETURNS JSONB AS $$
DECLARE
    recommendations JSONB;
    budget_tier VARCHAR;
    plan_record RECORD;
    equipment_recommendations JSONB;
    diy_recommendations JSONB;
BEGIN
    -- Determine budget tier
    IF user_budget_euros <= 500 THEN
        budget_tier := 'minimal_500';
    ELSIF user_budget_euros <= 1000 THEN
        budget_tier := 'moderate_1000';
    ELSE
        budget_tier := 'serious_2000';
    END IF;
    
    -- Get performance plan
    SELECT * INTO plan_record
    FROM realistic_performance_plans
    WHERE budget_tier = budget_tier
    LIMIT 1;
    
    -- Get equipment recommendations
    SELECT jsonb_agg(
        jsonb_build_object(
            'equipment_name', equipment_name,
            'category', equipment_category,
            'price_range', jsonb_build_object('min', price_range_min, 'max', price_range_max),
            'priority', priority_for_amateur,
            'benefit', performance_benefit
        )
    ) INTO equipment_recommendations
    FROM affordable_equipment
    WHERE priority_for_amateur IN ('essential', 'recommended')
    ORDER BY priority_for_amateur DESC, price_range_min ASC;
    
    -- Get DIY protocol recommendations
    SELECT jsonb_agg(
        jsonb_build_object(
            'protocol_name', protocol_name,
            'type', protocol_type,
            'time_required', time_required_minutes,
            'cost_savings', cost_savings_euros,
            'effectiveness', effectiveness_rating
        )
    ) INTO diy_recommendations
    FROM diy_protocols
    ORDER BY effectiveness_rating DESC, cost_savings_euros DESC
    LIMIT 5;
    
    -- Build recommendations
    recommendations := jsonb_build_object(
        'user_budget', user_budget_euros,
        'recommended_budget_tier', budget_tier,
        'performance_plan', jsonb_build_object(
            'name', plan_record.plan_name,
            'description', plan_record.plan_description,
            'core_components', plan_record.core_components,
            'expected_outcomes', plan_record.expected_outcomes,
            'timeline_weeks', plan_record.timeline_weeks,
            'cost_breakdown', plan_record.cost_breakdown
        ),
        'equipment_recommendations', equipment_recommendations,
        'diy_protocols', diy_recommendations,
        'budget_optimization_tips', ARRAY[
            'Start with essential equipment only',
            'Use DIY protocols for expensive services',
            'Buy equipment in off-season sales',
            'Share costs with teammates when possible',
            'Focus on consistency over expensive solutions'
        ],
        'local_resource_suggestions', ARRAY[
            'Check local sports stores for deals',
            'Look for community center programs',
            'Find affordable local coaches',
            'Use public facilities and parks',
            'Join community sports groups'
        ]
    );
    
    RETURN recommendations;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate cost-effectiveness score
CREATE OR REPLACE FUNCTION calculate_cost_effectiveness_score(
    user_id_param UUID,
    assessment_period_days INTEGER DEFAULT 30
) RETURNS JSONB AS $$
DECLARE
    effectiveness_data JSONB;
    total_spent DECIMAL := 0;
    total_benefits INTEGER := 0;
    cost_per_benefit DECIMAL;
    roi_score DECIMAL;
BEGIN
    -- Calculate total spending (this would come from actual spending data)
    -- For now, using a placeholder calculation
    total_spent := 500; -- Example: €500 spent
    
    -- Calculate total benefits (this would come from performance improvements)
    -- For now, using a placeholder calculation
    total_benefits := 7; -- Example: 7 areas of improvement
    
    -- Calculate cost-effectiveness metrics
    cost_per_benefit := CASE 
        WHEN total_benefits > 0 THEN total_spent / total_benefits
        ELSE 0 
    END;
    
    roi_score := CASE 
        WHEN total_spent > 0 THEN (total_benefits * 10) / total_spent
        ELSE 0 
    END;
    
    -- Build effectiveness data
    effectiveness_data := jsonb_build_object(
        'user_id', user_id_param,
        'assessment_period_days', assessment_period_days,
        'total_spent_euros', total_spent,
        'total_benefits_achieved', total_benefits,
        'cost_per_benefit_euros', cost_per_benefit,
        'roi_score', roi_score,
        'cost_effectiveness_rating', CASE 
            WHEN roi_score >= 0.15 THEN 'excellent'
            WHEN roi_score >= 0.10 THEN 'good'
            WHEN roi_score >= 0.05 THEN 'fair'
            ELSE 'needs_improvement'
        END,
        'recommendations', ARRAY[
            'Focus on high-ROI investments first',
            'Use DIY protocols to reduce costs',
            'Prioritize essential equipment over nice-to-have items',
            'Track spending vs. performance improvements',
            'Consider sharing costs with teammates'
        ]
    );
    
    RETURN effectiveness_data;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON TABLE realistic_budget_categories IS 'Realistic budget categories for amateur flag football players';
COMMENT ON TABLE affordable_equipment IS 'Affordable equipment options for amateur players';
COMMENT ON TABLE local_resources IS 'Local resource mapping for affordable options';
COMMENT ON TABLE diy_protocols IS 'Do-it-yourself protocols for cost-effective solutions';
COMMENT ON TABLE realistic_performance_plans IS 'Realistic performance plans for different budget tiers';
COMMENT ON TABLE cost_effective_alternatives IS 'Cost-effective alternatives to premium solutions';
COMMENT ON TABLE amateur_training_programs IS 'Amateur-friendly training programs';
COMMENT ON TABLE budget_nutrition_plans IS 'Budget-friendly nutrition plans';
COMMENT ON FUNCTION generate_realistic_budget_recommendations IS 'Generate realistic budget recommendations for amateur players';
COMMENT ON FUNCTION calculate_cost_effectiveness_score IS 'Calculate cost-effectiveness score for performance investments';
