-- Migration: IFAF & Global Rankings Engine
-- This migration adds comprehensive ranking systems for flag football

-- 1. IFAF FLAG RANKINGS SYSTEM
CREATE TABLE IF NOT EXISTS ifaf_flag_rankings (
    id SERIAL PRIMARY KEY,
    country VARCHAR(100) NOT NULL,
    gender VARCHAR(20) NOT NULL CHECK (gender IN ('male', 'female', 'mixed')),
    category VARCHAR(50) NOT NULL CHECK (category IN ('senior', 'u23', 'u19', 'u16')),
    rank INTEGER NOT NULL,
    points DECIMAL(8,2) NOT NULL,
    previous_rank INTEGER,
    points_change DECIMAL(8,2),
    matches_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    goals_for INTEGER DEFAULT 0,
    goals_against INTEGER DEFAULT 0,
    goal_difference INTEGER DEFAULT 0,
    last_match_date DATE,
    ranking_period VARCHAR(20) NOT NULL, -- 'monthly', 'quarterly', 'annual'
    ranking_date DATE NOT NULL,
    update_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_source VARCHAR(100) DEFAULT 'ifaf_official',
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. NATIONAL TEAM PROFILES
CREATE TABLE IF NOT EXISTS national_team_profiles (
    id SERIAL PRIMARY KEY,
    team_id UUID NOT NULL,
    federation VARCHAR(200) NOT NULL,
    country_code VARCHAR(3) NOT NULL,
    contact_info JSONB, -- email, phone, website, social_media
    coaching_staff JSONB, -- head_coach, assistants, medical_staff
    play_style TEXT[] NOT NULL, -- 'possession_based', 'counter_attack', 'high_press', etc.
    formation_preferences TEXT[], -- preferred formations
    key_players TEXT[], -- star player names
    home_venue VARCHAR(200),
    training_facility VARCHAR(200),
    federation_established_year INTEGER,
    ifaf_member_since DATE,
    world_ranking_history JSONB, -- historical ranking data
    major_tournament_results JSONB, -- world championships, continental championships
    development_programs TEXT[], -- youth development initiatives
    financial_resources VARCHAR(50), -- 'high', 'medium', 'low'
    player_pool_size INTEGER,
    professional_league BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. MATCH RESULTS AND RANKING CALCULATIONS
CREATE TABLE IF NOT EXISTS ifaf_match_results (
    id SERIAL PRIMARY KEY,
    match_date DATE NOT NULL,
    tournament_name VARCHAR(200),
    tournament_type VARCHAR(100), -- 'world_championship', 'continental', 'friendly'
    home_team VARCHAR(100) NOT NULL,
    away_team VARCHAR(100) NOT NULL,
    home_score INTEGER NOT NULL,
    away_score INTEGER NOT NULL,
    home_rank_before INTEGER,
    away_rank_before INTEGER,
    home_points_before DECIMAL(8,2),
    away_points_before DECIMAL(8,2),
    home_points_after DECIMAL(8,2),
    away_points_after DECIMAL(8,2),
    home_rank_after INTEGER,
    away_rank_after INTEGER,
    match_importance_factor DECIMAL(3,2) DEFAULT 1.0, -- tournament importance multiplier
    home_advantage_factor DECIMAL(3,2) DEFAULT 1.0,
    elo_rating_change_home DECIMAL(8,2),
    elo_rating_change_away DECIMAL(8,2),
    match_quality_score DECIMAL(3,2), -- based on ranking difference and score
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ELO RATING SYSTEM
CREATE TABLE IF NOT EXISTS ifaf_elo_ratings (
    id SERIAL PRIMARY KEY,
    country VARCHAR(100) NOT NULL,
    gender VARCHAR(20) NOT NULL,
    category VARCHAR(50) NOT NULL,
    elo_rating DECIMAL(8,2) NOT NULL,
    rating_date DATE NOT NULL,
    previous_rating DECIMAL(8,2),
    rating_change DECIMAL(8,2),
    k_factor DECIMAL(5,2) DEFAULT 32.0, -- rating change sensitivity
    matches_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    win_streak INTEGER DEFAULT 0,
    loss_streak INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. RANKING PROJECTIONS AND FORECASTS
CREATE TABLE IF NOT EXISTS ifaf_ranking_projections (
    id SERIAL PRIMARY KEY,
    country VARCHAR(100) NOT NULL,
    gender VARCHAR(20) NOT NULL,
    category VARCHAR(50) NOT NULL,
    current_rank INTEGER NOT NULL,
    projected_rank INTEGER,
    current_points DECIMAL(8,2) NOT NULL,
    projected_points DECIMAL(8,2),
    confidence_interval_lower DECIMAL(8,2),
    confidence_interval_upper DECIMAL(8,2),
    projection_date DATE NOT NULL,
    target_date DATE NOT NULL,
    projection_factors JSONB, -- factors considered in projection
    upcoming_matches JSONB, -- scheduled matches affecting projection
    risk_factors TEXT[], -- factors that could affect projection
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. STRENGTH OF OPPONENT CALCULATIONS
CREATE TABLE IF NOT EXISTS ifaf_strength_metrics (
    id SERIAL PRIMARY KEY,
    country VARCHAR(100) NOT NULL,
    gender VARCHAR(20) NOT NULL,
    category VARCHAR(50) NOT NULL,
    strength_score DECIMAL(8,2) NOT NULL,
    offensive_rating DECIMAL(8,2),
    defensive_rating DECIMAL(8,2),
    consistency_rating DECIMAL(8,2),
    home_advantage_rating DECIMAL(8,2),
    tournament_performance_rating DECIMAL(8,2),
    recent_form_rating DECIMAL(8,2),
    head_to_head_advantage JSONB, -- performance vs specific opponents
    calculation_date DATE NOT NULL,
    factors_considered JSONB, -- metrics used in calculation
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. RANKING UPDATE LOGS
CREATE TABLE IF NOT EXISTS ifaf_ranking_updates (
    id SERIAL PRIMARY KEY,
    update_date DATE NOT NULL,
    ranking_period VARCHAR(20) NOT NULL,
    countries_updated INTEGER,
    ranking_changes INTEGER,
    major_movements JSONB, -- significant ranking changes
    new_entries INTEGER,
    removed_entries INTEGER,
    data_sources_used TEXT[],
    update_method VARCHAR(100), -- 'automatic_scraping', 'manual_update', 'api_sync'
    processing_time_seconds INTEGER,
    errors_encountered TEXT[],
    success_rate DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_ifaf_flag_rankings_country_gender ON ifaf_flag_rankings(country, gender);
CREATE INDEX IF NOT EXISTS idx_ifaf_flag_rankings_rank_date ON ifaf_flag_rankings(rank, ranking_date);
CREATE INDEX IF NOT EXISTS idx_ifaf_flag_rankings_points ON ifaf_flag_rankings(points DESC);
CREATE INDEX IF NOT EXISTS idx_national_team_profiles_country ON national_team_profiles(country_code);
CREATE INDEX IF NOT EXISTS idx_ifaf_match_results_date ON ifaf_match_results(match_date);
CREATE INDEX IF NOT EXISTS idx_ifaf_match_results_teams ON ifaf_match_results(home_team, away_team);
CREATE INDEX IF NOT EXISTS idx_ifaf_elo_ratings_country ON ifaf_elo_ratings(country, gender, category);
CREATE INDEX IF NOT EXISTS idx_ifaf_elo_ratings_date ON ifaf_elo_ratings(rating_date);

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_ifaf_flag_rankings_unique ON ifaf_flag_rankings(country, gender, category, ranking_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ifaf_elo_ratings_unique ON ifaf_elo_ratings(country, gender, category, rating_date);

-- Insert sample IFAF rankings data
INSERT INTO ifaf_flag_rankings (country, gender, category, rank, points, ranking_period, ranking_date) VALUES
('United States', 'male', 'senior', 1, 1850.50, 'monthly', '2025-01-01'),
('Canada', 'male', 'senior', 2, 1780.25, 'monthly', '2025-01-01'),
('Mexico', 'male', 'senior', 3, 1720.75, 'monthly', '2025-01-01'),
('Austria', 'male', 'senior', 4, 1680.00, 'monthly', '2025-01-01'),
('Germany', 'male', 'senior', 5, 1650.50, 'monthly', '2025-01-01'),
('United States', 'female', 'senior', 1, 1820.75, 'monthly', '2025-01-01'),
('Canada', 'female', 'senior', 2, 1750.25, 'monthly', '2025-01-01'),
('Mexico', 'female', 'senior', 3, 1700.50, 'monthly', '2025-01-01'),
('Austria', 'female', 'senior', 4, 1660.00, 'monthly', '2025-01-01'),
('Germany', 'female', 'senior', 5, 1630.75, 'monthly', '2025-01-01');

-- Insert sample national team profiles
INSERT INTO national_team_profiles (team_id, federation, country_code, play_style, coaching_staff, contact_info) VALUES
(gen_random_uuid(), 'USA Flag Football Federation', 'USA', ARRAY['possession_based', 'high_press'], 
 '{"head_coach": "Mike Smith", "assistants": ["John Davis", "Sarah Wilson"]}', 
 '{"email": "info@usafff.org", "website": "www.usafff.org"}'),
(gen_random_uuid(), 'Flag Football Canada', 'CAN', ARRAY['counter_attack', 'technical'], 
 '{"head_coach": "David Johnson", "assistants": ["Maria Garcia", "Tom Brown"]}', 
 '{"email": "info@flagfootballcanada.ca", "website": "www.flagfootballcanada.ca"}'),
(gen_random_uuid(), 'Federación Mexicana de Flag Football', 'MEX', ARRAY['fast_paced', 'skill_based'], 
 '{"head_coach": "Carlos Rodriguez", "assistants": ["Ana Martinez", "Luis Hernandez"]}', 
 '{"email": "info@fmff.mx", "website": "www.fmff.mx"}');

-- Insert sample ELO ratings
INSERT INTO ifaf_elo_ratings (country, gender, category, elo_rating, rating_date) VALUES
('United States', 'male', 'senior', 1850.50, '2025-01-01'),
('Canada', 'male', 'senior', 1780.25, '2025-01-01'),
('Mexico', 'male', 'senior', 1720.75, '2025-01-01'),
('Austria', 'male', 'senior', 1680.00, '2025-01-01'),
('Germany', 'male', 'senior', 1650.50, '2025-01-01');

-- Create materialized view for current rankings
CREATE MATERIALIZED VIEW IF NOT EXISTS current_ifaf_rankings AS
SELECT 
    r.country,
    r.gender,
    r.category,
    r.rank,
    r.points,
    r.previous_rank,
    r.points_change,
    r.matches_played,
    r.wins,
    r.losses,
    r.draws,
    r.goal_difference,
    r.ranking_date,
    p.federation,
    p.play_style,
    e.elo_rating,
    e.win_streak,
    e.loss_streak
FROM ifaf_flag_rankings r
JOIN national_team_profiles p ON r.country = p.country_code
JOIN ifaf_elo_ratings e ON r.country = e.country AND r.gender = e.gender AND r.category = e.category
WHERE r.ranking_date = (SELECT MAX(ranking_date) FROM ifaf_flag_rankings)
ORDER BY r.gender, r.category, r.rank;

-- Create function to calculate ELO rating changes
CREATE OR REPLACE FUNCTION calculate_elo_change(
    player_rating DECIMAL,
    opponent_rating DECIMAL,
    player_score INTEGER,
    opponent_score INTEGER,
    k_factor DECIMAL DEFAULT 32.0
) RETURNS DECIMAL AS $$
DECLARE
    expected_score DECIMAL;
    actual_score DECIMAL;
    rating_change DECIMAL;
BEGIN
    -- Calculate expected score
    expected_score := 1.0 / (1.0 + POWER(10.0, (opponent_rating - player_rating) / 400.0));
    
    -- Determine actual score (1 for win, 0.5 for draw, 0 for loss)
    IF player_score > opponent_score THEN
        actual_score := 1.0;
    ELSIF player_score = opponent_score THEN
        actual_score := 0.5;
    ELSE
        actual_score := 0.0;
    END IF;
    
    -- Calculate rating change
    rating_change := k_factor * (actual_score - expected_score);
    
    RETURN rating_change;
END;
$$ LANGUAGE plpgsql;

-- Create function to update rankings after match
CREATE OR REPLACE FUNCTION update_rankings_after_match(
    home_team VARCHAR,
    away_team VARCHAR,
    home_score INTEGER,
    away_score INTEGER,
    match_date DATE,
    tournament_name VARCHAR DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
    home_rating DECIMAL;
    away_rating DECIMAL;
    home_change DECIMAL;
    away_change DECIMAL;
    match_importance DECIMAL := 1.0;
BEGIN
    -- Get current ELO ratings
    SELECT elo_rating INTO home_rating 
    FROM ifaf_elo_ratings 
    WHERE country = home_team AND rating_date = (SELECT MAX(rating_date) FROM ifaf_elo_ratings);
    
    SELECT elo_rating INTO away_rating 
    FROM ifaf_elo_ratings 
    WHERE country = away_team AND rating_date = (SELECT MAX(rating_date) FROM ifaf_elo_ratings);
    
    -- Adjust importance factor for tournaments
    IF tournament_name IS NOT NULL THEN
        match_importance := 1.5;
    END IF;
    
    -- Calculate rating changes
    home_change := calculate_elo_change(home_rating, away_rating, home_score, away_score) * match_importance;
    away_change := calculate_elo_change(away_rating, home_rating, away_score, home_score) * match_importance;
    
    -- Insert match result
    INSERT INTO ifaf_match_results (
        match_date, tournament_name, home_team, away_team, 
        home_score, away_score, elo_rating_change_home, elo_rating_change_away
    ) VALUES (
        match_date, tournament_name, home_team, away_team, 
        home_score, away_score, home_change, away_change
    );
    
    -- Update ELO ratings
    INSERT INTO ifaf_elo_ratings (country, gender, category, elo_rating, rating_date, previous_rating, rating_change)
    VALUES (home_team, 'male', 'senior', home_rating + home_change, match_date, home_rating, home_change);
    
    INSERT INTO ifaf_elo_ratings (country, gender, category, elo_rating, rating_date, previous_rating, rating_change)
    VALUES (away_team, 'male', 'senior', away_rating + away_change, match_date, away_rating, away_change);
    
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_national_team_profiles_updated_at 
    BEFORE UPDATE ON national_team_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE ifaf_flag_rankings IS 'IFAF official flag football rankings by country, gender, and category';
COMMENT ON TABLE national_team_profiles IS 'Comprehensive profiles of national flag football teams';
COMMENT ON TABLE ifaf_match_results IS 'Match results and their impact on rankings';
COMMENT ON TABLE ifaf_elo_ratings IS 'ELO rating system for flag football teams';
COMMENT ON TABLE ifaf_ranking_projections IS 'Future ranking projections and forecasts';
COMMENT ON TABLE ifaf_strength_metrics IS 'Strength of opponent calculations and metrics';
COMMENT ON TABLE ifaf_ranking_updates IS 'Log of ranking system updates and maintenance';
COMMENT ON FUNCTION calculate_elo_change IS 'Calculate ELO rating change based on match result';
COMMENT ON FUNCTION update_rankings_after_match IS 'Update rankings and ELO ratings after a match';
