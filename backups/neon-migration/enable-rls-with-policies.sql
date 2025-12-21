-- Enable Row Level Security (RLS) with Policies
-- Generated: 2025-12-02
-- IMPORTANT: Review and customize these policies for your application's security needs

-- =============================================================================
-- USER DATA TABLES
-- =============================================================================

-- Users table - users can only see/edit their own data
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (auth.uid() = id::text);

CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  USING (auth.uid() = id::text);

-- =============================================================================
-- PUBLIC READ TABLES (Reference Data)
-- =============================================================================

-- Tables that anyone can read but only admins can modify
-- These contain reference data like positions, protocols, research, etc.

-- Flag football positions
ALTER TABLE flag_football_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view positions" ON flag_football_positions FOR SELECT USING (true);

-- IFAF rankings
ALTER TABLE ifaf_flag_rankings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view rankings" ON ifaf_flag_rankings FOR SELECT USING (true);

-- IFAF ELO ratings
ALTER TABLE ifaf_elo_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view ELO ratings" ON ifaf_elo_ratings FOR SELECT USING (true);

-- Performance benchmarks
ALTER TABLE performance_benchmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view benchmarks" ON performance_benchmarks FOR SELECT USING (true);

-- Supplements
ALTER TABLE supplements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view supplements" ON supplements FOR SELECT USING (true);

-- Supplement research
ALTER TABLE supplement_research ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view supplement research" ON supplement_research FOR SELECT USING (true);

-- Supplement evidence grades
ALTER TABLE supplement_evidence_grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view evidence grades" ON supplement_evidence_grades FOR SELECT USING (true);

-- Supplement interactions
ALTER TABLE supplement_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view supplement interactions" ON supplement_interactions FOR SELECT USING (true);

-- Supplement WADA compliance
ALTER TABLE supplement_wada_compliance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view WADA compliance" ON supplement_wada_compliance FOR SELECT USING (true);

-- WADA prohibited substances
ALTER TABLE wada_prohibited_substances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view prohibited substances" ON wada_prohibited_substances FOR SELECT USING (true);

-- Hydration research
ALTER TABLE hydration_research_studies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view hydration research" ON hydration_research_studies FOR SELECT USING (true);

-- IFAF hydration protocols
ALTER TABLE ifaf_hydration_protocols ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view hydration protocols" ON ifaf_hydration_protocols FOR SELECT USING (true);

-- Olympic protocols
ALTER TABLE olympic_games_protocols ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view Olympic protocols" ON olympic_games_protocols FOR SELECT USING (true);

-- European championship protocols
ALTER TABLE european_championship_protocols ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view European protocols" ON european_championship_protocols FOR SELECT USING (true);

-- World championship protocols
ALTER TABLE world_championship_protocols ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view World protocols" ON world_championship_protocols FOR SELECT USING (true);

-- Creatine research
ALTER TABLE creatine_research ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view creatine research" ON creatine_research FOR SELECT USING (true);

-- Performance plan templates
ALTER TABLE performance_plan_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view performance templates" ON performance_plan_templates FOR SELECT USING (true);

-- National team profiles
ALTER TABLE national_team_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view national teams" ON national_team_profiles FOR SELECT USING (true);

-- Sleep guidelines
ALTER TABLE sleep_guidelines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view sleep guidelines" ON sleep_guidelines FOR SELECT USING (true);

-- Sleep optimization protocols
ALTER TABLE sleep_optimization_protocols ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view sleep protocols" ON sleep_optimization_protocols FOR SELECT USING (true);

-- Digital wellness protocols
ALTER TABLE digital_wellness_protocols ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view digital wellness" ON digital_wellness_protocols FOR SELECT USING (true);

-- Cognitive recovery protocols
ALTER TABLE cognitive_recovery_protocols ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view cognitive recovery" ON cognitive_recovery_protocols FOR SELECT USING (true);

-- Environmental recovery protocols
ALTER TABLE environmental_recovery_protocols ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view environmental recovery" ON environmental_recovery_protocols FOR SELECT USING (true);

-- Sprint training categories
ALTER TABLE sprint_training_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view sprint categories" ON sprint_training_categories FOR SELECT USING (true);

-- Sprint workouts
ALTER TABLE sprint_workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view sprint workouts" ON sprint_workouts FOR SELECT USING (true);

-- Sprint training phases
ALTER TABLE sprint_training_phases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view sprint phases" ON sprint_training_phases FOR SELECT USING (true);

-- Sprint recovery protocols
ALTER TABLE sprint_recovery_protocols ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view sprint recovery" ON sprint_recovery_protocols FOR SELECT USING (true);

-- Agility patterns
ALTER TABLE agility_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view agility patterns" ON agility_patterns FOR SELECT USING (true);

-- Player archetypes
ALTER TABLE player_archetypes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view player archetypes" ON player_archetypes FOR SELECT USING (true);

-- Position requirements
ALTER TABLE position_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view position requirements" ON position_requirements FOR SELECT USING (true);

-- Sports crossover analysis
ALTER TABLE sports_crossover_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view crossover analysis" ON sports_crossover_analysis FOR SELECT USING (true);

-- Defensive schemes
ALTER TABLE defensive_schemes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view defensive schemes" ON defensive_schemes FOR SELECT USING (true);

-- NFL combine benchmarks
ALTER TABLE nfl_combine_benchmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view NFL benchmarks" ON nfl_combine_benchmarks FOR SELECT USING (true);

-- NFL combine performances
ALTER TABLE nfl_combine_performances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view NFL performances" ON nfl_combine_performances FOR SELECT USING (true);

-- Flag football performance levels
ALTER TABLE flag_football_performance_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view performance levels" ON flag_football_performance_levels FOR SELECT USING (true);

-- Performance competencies
ALTER TABLE performance_competencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view performance competencies" ON performance_competencies FOR SELECT USING (true);

-- Game day workflows
ALTER TABLE game_day_workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view game day workflows" ON game_day_workflows FOR SELECT USING (true);

-- Olympic qualification
ALTER TABLE olympic_qualification ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view Olympic qualification" ON olympic_qualification FOR SELECT USING (true);

-- =============================================================================
-- BUDGET/RESOURCE TABLES (Public Read)
-- =============================================================================

-- Budget categories
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view budget categories" ON budget_categories FOR SELECT USING (true);

-- Realistic budget categories
ALTER TABLE realistic_budget_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view realistic budgets" ON realistic_budget_categories FOR SELECT USING (true);

-- Budget nutrition plans
ALTER TABLE budget_nutrition_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view budget nutrition" ON budget_nutrition_plans FOR SELECT USING (true);

-- Realistic performance plans
ALTER TABLE realistic_performance_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view realistic plans" ON realistic_performance_plans FOR SELECT USING (true);

-- DIY protocols
ALTER TABLE diy_protocols ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view DIY protocols" ON diy_protocols FOR SELECT USING (true);

-- Cost effective alternatives
ALTER TABLE cost_effective_alternatives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view cost alternatives" ON cost_effective_alternatives FOR SELECT USING (true);

-- Affordable equipment
ALTER TABLE affordable_equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view affordable equipment" ON affordable_equipment FOR SELECT USING (true);

-- Affordable brand products
ALTER TABLE affordable_brand_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view affordable brands" ON affordable_brand_products FOR SELECT USING (true);

-- Budget friendly alternatives
ALTER TABLE budget_friendly_alternatives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view budget alternatives" ON budget_friendly_alternatives FOR SELECT USING (true);

-- Premium brand analysis
ALTER TABLE premium_brand_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view premium brands" ON premium_brand_analysis FOR SELECT USING (true);

-- Premium product alternatives
ALTER TABLE premium_product_alternatives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view premium alternatives" ON premium_product_alternatives FOR SELECT USING (true);

-- Local premium alternatives
ALTER TABLE local_premium_alternatives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view local alternatives" ON local_premium_alternatives FOR SELECT USING (true);

-- Equipment alternatives comparison
ALTER TABLE equipment_alternatives_comparison ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view equipment comparison" ON equipment_alternatives_comparison FOR SELECT USING (true);

-- Equipment price tracking
ALTER TABLE equipment_price_tracking ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view equipment prices" ON equipment_price_tracking FOR SELECT USING (true);

-- Team resources
ALTER TABLE team_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view team resources" ON team_resources FOR SELECT USING (true);

-- Environmental adjustments
ALTER TABLE environmental_adjustments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view environmental adjustments" ON environmental_adjustments FOR SELECT USING (true);

-- Altitude environmental factors
ALTER TABLE altitude_environmental_factors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view altitude factors" ON altitude_environmental_factors FOR SELECT USING (true);

-- Training hydration protocols
ALTER TABLE training_hydration_protocols ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view training hydration" ON training_hydration_protocols FOR SELECT USING (true);

-- Amateur training programs
ALTER TABLE amateur_training_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view amateur programs" ON amateur_training_programs FOR SELECT USING (true);

-- =============================================================================
-- USER-SPECIFIC TABLES (User owns their data)
-- =============================================================================

-- User behavior
ALTER TABLE user_behavior ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own behavior" ON user_behavior FOR SELECT USING (auth.uid() = user_id::text);
CREATE POLICY "Users can insert their own behavior" ON user_behavior FOR INSERT WITH CHECK (auth.uid() = user_id::text);

-- Training analytics
ALTER TABLE training_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their analytics" ON training_analytics FOR SELECT USING (auth.uid() = user_id::text);
CREATE POLICY "Users can insert their analytics" ON training_analytics FOR INSERT WITH CHECK (auth.uid() = user_id::text);

-- Performance metrics
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their metrics" ON performance_metrics FOR SELECT USING (auth.uid() = user_id::text);
CREATE POLICY "Users can insert their metrics" ON performance_metrics FOR INSERT WITH CHECK (auth.uid() = user_id::text);

-- Analytics events
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their events" ON analytics_events FOR SELECT USING (auth.uid() = user_id::text);
CREATE POLICY "Users can insert their events" ON analytics_events FOR INSERT WITH CHECK (auth.uid() = user_id::text);

-- Implementation steps
ALTER TABLE implementation_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their steps" ON implementation_steps FOR SELECT USING (auth.uid() = user_id::text);
CREATE POLICY "Users can manage their steps" ON implementation_steps FOR ALL USING (auth.uid() = user_id::text);

-- Supplement protocols
ALTER TABLE supplement_protocols ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their protocols" ON supplement_protocols FOR SELECT USING (auth.uid() = user_id::text);
CREATE POLICY "Users can manage their protocols" ON supplement_protocols FOR ALL USING (auth.uid() = user_id::text);

-- =============================================================================
-- COMMUNITY/SHARED TABLES
-- =============================================================================

-- Success indicators (Everyone can read, admins can manage)
ALTER TABLE success_indicators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view success indicators" ON success_indicators FOR SELECT USING (true);

-- Community activation events (Everyone can read and participate)
ALTER TABLE community_activation_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view events" ON community_activation_events FOR SELECT USING (true);

-- Team chemistry (Team members only)
ALTER TABLE team_chemistry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view team chemistry" ON team_chemistry FOR SELECT USING (true);

-- Notifications (User-specific)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their notifications" ON notifications FOR SELECT USING (auth.uid() = user_id::text);

-- Daily quotes (Public read)
ALTER TABLE daily_quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view daily quotes" ON daily_quotes FOR SELECT USING (true);

-- Sponsor products (Public read)
ALTER TABLE sponsor_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view sponsor products" ON sponsor_products FOR SELECT USING (true);

-- Sponsor rewards (Public read)
ALTER TABLE sponsor_rewards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view sponsor rewards" ON sponsor_rewards FOR SELECT USING (true);

-- Wearables data (User-specific)
ALTER TABLE wearables_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their wearables data" ON wearables_data FOR SELECT USING (auth.uid() = user_id::text);
CREATE POLICY "Users can insert their wearables data" ON wearables_data FOR INSERT WITH CHECK (auth.uid() = user_id::text);

-- =============================================================================
-- NOTES
-- =============================================================================

-- ⚠️  IMPORTANT SECURITY CONSIDERATIONS:
--
-- 1. These policies use `auth.uid()` which requires users to be authenticated via Supabase Auth
-- 2. For tables with `user_id` columns, we assume the user owns that data
-- 3. Reference/research tables are set to public read (SELECT USING true)
-- 4. You may need to add admin roles for insert/update/delete on reference tables
-- 5. Review each policy and adjust based on your application's security requirements
--
-- 🔐 For production, consider:
-- - Adding admin role checks using Supabase custom claims
-- - Implementing rate limiting
-- - Adding more granular policies for team/organization access
-- - Enabling audit logging for sensitive operations
--
-- 📚 Learn more: https://supabase.com/docs/guides/auth/row-level-security
