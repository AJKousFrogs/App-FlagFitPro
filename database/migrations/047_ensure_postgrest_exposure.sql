-- Migration 047: Ensure PostgREST Exposure for 82 Core Tables
-- Based on analysis from 2025-01-21
-- Ensures all 82 tables identified are properly exposed via PostgREST API

-- This migration ensures tables are visible in PostgREST schema cache
-- Note: PostgREST automatically exposes tables in the 'public' schema
-- This migration verifies and documents the 82 core tables

-- Grant necessary permissions for PostgREST to access tables
-- PostgREST uses the 'anon' and 'authenticated' roles

DO $$
DECLARE
    table_record RECORD;
    tables_to_expose TEXT[] := ARRAY[
        'affordable_brand_products',
        'affordable_equipment',
        'agility_patterns',
        'altitude_environmental_factors',
        'amateur_training_programs',
        'analytics_events',
        'budget_categories',
        'budget_friendly_alternatives',
        'budget_nutrition_plans',
        'chatbot_user_context',
        'cognitive_recovery_protocols',
        'community_activation_events',
        'cost_effective_alternatives',
        'creatine_research',
        'daily_quotes',
        'defensive_schemes',
        'digital_wellness_protocols',
        'diy_protocols',
        'environmental_adjustments',
        'environmental_recovery_protocols',
        'equipment_alternatives_comparison',
        'equipment_price_tracking',
        'european_championship_protocols',
        'fixtures',
        'flag_football_performance_levels',
        'flag_football_positions',
        'game_day_workflows',
        'hydration_research_studies',
        'ifaf_elo_ratings',
        'ifaf_flag_rankings',
        'ifaf_hydration_protocols',
        'implementation_steps',
        'local_premium_alternatives',
        'national_team_profiles',
        'nfl_combine_benchmarks',
        'nfl_combine_performances',
        'notifications',
        'olympic_games_protocols',
        'olympic_qualification',
        'performance_benchmarks',
        'performance_competencies',
        'performance_metrics',
        'performance_plan_templates',
        'player_archetypes',
        'position_requirements',
        'positions',
        'premium_brand_analysis',
        'premium_product_alternatives',
        'readiness_scores',
        'realistic_budget_categories',
        'realistic_performance_plans',
        'sleep_guidelines',
        'sleep_optimization_protocols',
        'sponsor_products',
        'sponsor_rewards',
        'sports_crossover_analysis',
        'sprint_recovery_protocols',
        'sprint_training_categories',
        'sprint_training_phases',
        'sprint_workouts',
        'success_indicators',
        'supplement_evidence_grades',
        'supplement_interactions',
        'supplement_protocols',
        'supplement_research',
        'supplement_wada_compliance',
        'supplements',
        'team_chemistry',
        'team_resources',
        'teams',
        'training_analytics',
        'training_hydration_protocols',
        'training_sessions',
        'user_behavior',
        'user_notification_preferences',
        'user_teams',
        'users',
        'wada_prohibited_substances',
        'wearables_data',
        'wellness_logs',
        'world_championship_protocols'
    ];
BEGIN
    -- Grant usage on schema
    GRANT USAGE ON SCHEMA public TO anon, authenticated;
    
    -- Grant select on all existing tables
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = ANY(tables_to_expose)
    LOOP
        -- Grant select, insert, update, delete permissions
        EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.%I TO anon, authenticated', table_record.tablename);
        
        -- Grant usage on sequences (for auto-increment columns)
        BEGIN
            EXECUTE format('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated');
        EXCEPTION WHEN OTHERS THEN
            -- Sequences might not exist, continue
            NULL;
        END;
    END LOOP;
    
    RAISE NOTICE 'Granted PostgREST permissions on % tables', array_length(tables_to_expose, 1);
END $$;

-- Create a view to track PostgREST-exposed tables
-- SECURITY INVOKER ensures the view runs with the permissions of the querying user, not the creator
-- This respects RLS policies and is safer than SECURITY DEFINER
CREATE OR REPLACE VIEW postgrest_exposed_tables
WITH (security_invoker = true) AS
SELECT 
    t.table_name,
    CASE 
        WHEN t.table_name = ANY(ARRAY[
            'affordable_brand_products', 'affordable_equipment', 'agility_patterns',
            'altitude_environmental_factors', 'amateur_training_programs', 'analytics_events',
            'budget_categories', 'budget_friendly_alternatives', 'budget_nutrition_plans',
            'chatbot_user_context', 'cognitive_recovery_protocols', 'community_activation_events',
            'cost_effective_alternatives', 'creatine_research', 'daily_quotes',
            'defensive_schemes', 'digital_wellness_protocols', 'diy_protocols',
            'environmental_adjustments', 'environmental_recovery_protocols',
            'equipment_alternatives_comparison', 'equipment_price_tracking',
            'european_championship_protocols', 'fixtures',
            'flag_football_performance_levels', 'flag_football_positions',
            'game_day_workflows', 'hydration_research_studies',
            'ifaf_elo_ratings', 'ifaf_flag_rankings', 'ifaf_hydration_protocols',
            'implementation_steps', 'local_premium_alternatives',
            'national_team_profiles', 'nfl_combine_benchmarks', 'nfl_combine_performances',
            'notifications', 'olympic_games_protocols', 'olympic_qualification',
            'performance_benchmarks', 'performance_competencies', 'performance_metrics',
            'performance_plan_templates', 'player_archetypes', 'position_requirements',
            'positions', 'premium_brand_analysis', 'premium_product_alternatives',
            'readiness_scores', 'realistic_budget_categories', 'realistic_performance_plans',
            'sleep_guidelines', 'sleep_optimization_protocols',
            'sponsor_products', 'sponsor_rewards', 'sports_crossover_analysis',
            'sprint_recovery_protocols', 'sprint_training_categories',
            'sprint_training_phases', 'sprint_workouts', 'success_indicators',
            'supplement_evidence_grades', 'supplement_interactions', 'supplement_protocols',
            'supplement_research', 'supplement_wada_compliance', 'supplements',
            'team_chemistry', 'team_resources', 'teams',
            'training_analytics', 'training_hydration_protocols', 'training_sessions',
            'user_behavior', 'user_notification_preferences', 'user_teams',
            'users', 'wada_prohibited_substances', 'wearables_data',
            'wellness_logs', 'world_championship_protocols'
        ]) THEN true
        ELSE false
    END as is_core_table,
    (SELECT COUNT(*) 
     FROM information_schema.columns 
     WHERE table_schema = 'public' 
     AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
ORDER BY is_core_table DESC, t.table_name;

-- Grant select on the view
GRANT SELECT ON postgrest_exposed_tables TO anon, authenticated;

-- Comment on the migration
COMMENT ON VIEW postgrest_exposed_tables IS 
'View tracking the 82 core tables that should be exposed via PostgREST API. Created 2025-01-21.';

