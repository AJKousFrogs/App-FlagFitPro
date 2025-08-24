-- =============================================================================
-- NFL PLAYER COMPARISON SYSTEM - Migration 026
-- Allows users to see exactly where they stand vs real NFL players
-- "Today you're as fast as [NFL Player] who ran [time] in [year]"
-- =============================================================================

-- =============================================================================
-- NFL HISTORICAL PERFORMANCE DATABASE
-- =============================================================================

-- NFL combine performances by real players
CREATE TABLE IF NOT EXISTS nfl_combine_performances (
    id SERIAL PRIMARY KEY,
    player_name VARCHAR(150) NOT NULL,
    position VARCHAR(50) NOT NULL, -- 'WR', 'CB', 'S', 'RB', etc.
    college VARCHAR(100),
    draft_year INTEGER,
    draft_round INTEGER,
    draft_pick INTEGER,
    
    -- Combine measurements
    height_inches INTEGER,
    weight_pounds INTEGER,
    forty_yard_dash DECIMAL(4,2),
    ten_yard_split DECIMAL(4,2),
    twenty_yard_split DECIMAL(4,2),
    three_cone_drill DECIMAL(4,2),
    twenty_yard_shuttle DECIMAL(4,2),
    vertical_jump DECIMAL(4,1),
    broad_jump INTEGER, -- in inches
    bench_press_reps INTEGER,
    
    -- Career success metrics
    nfl_seasons_played INTEGER,
    career_achievements TEXT[], -- 'Pro_Bowl', 'All_Pro', 'Super_Bowl', 'Hall_of_Fame'
    career_stats JSONB, -- Position-specific career statistics
    success_rating INTEGER CHECK (success_rating BETWEEN 1 AND 10), -- Overall NFL success
    
    -- Additional context
    combine_year INTEGER,
    notable_achievements TEXT[],
    current_status VARCHAR(50), -- 'Active', 'Retired', 'Hall_of_Fame'
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_nfl_performances_position_time ON nfl_combine_performances(position, forty_yard_dash);
CREATE INDEX IF NOT EXISTS idx_nfl_performances_year ON nfl_combine_performances(draft_year);
CREATE INDEX IF NOT EXISTS idx_nfl_performances_success ON nfl_combine_performances(success_rating);

-- =============================================================================
-- USER PERFORMANCE COMPARISONS
-- =============================================================================

-- Store user performance comparisons
CREATE TABLE IF NOT EXISTS user_nfl_comparisons (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    test_name VARCHAR(50) NOT NULL, -- '40_yard_dash', '10_yard_split', 'vertical_jump'
    user_performance DECIMAL(6,2),
    comparison_date DATE DEFAULT CURRENT_DATE,
    
    -- Matched NFL players (within tolerance range)
    matched_nfl_players JSONB, -- Array of matched player objects
    closest_nfl_player_id INTEGER REFERENCES nfl_combine_performances(id),
    performance_percentile DECIMAL(5,2), -- Where user ranks vs all NFL players
    
    -- Comparison insights
    better_than_count INTEGER, -- How many NFL players user is faster than
    total_nfl_players_count INTEGER, -- Total NFL players in comparison
    comparison_message TEXT, -- Generated message for UX
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- COMPARISON GENERATION FUNCTIONS
-- =============================================================================

-- Function to find NFL players with similar performance
CREATE OR REPLACE FUNCTION find_similar_nfl_players(
    p_test_name VARCHAR(50),
    p_user_performance DECIMAL(6,2),
    p_tolerance DECIMAL(4,2) DEFAULT 0.05
) 
RETURNS TABLE (
    player_name VARCHAR(150),
    position VARCHAR(50),
    draft_year INTEGER,
    performance DECIMAL(4,2),
    success_rating INTEGER,
    achievements TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ncp.player_name,
        ncp.position,
        ncp.draft_year,
        CASE 
            WHEN p_test_name = '40_yard_dash' THEN ncp.forty_yard_dash
            WHEN p_test_name = '10_yard_split' THEN ncp.ten_yard_split
            WHEN p_test_name = '3_cone_drill' THEN ncp.three_cone_drill
            WHEN p_test_name = 'vertical_jump' THEN ncp.vertical_jump
            WHEN p_test_name = '20_yard_shuttle' THEN ncp.twenty_yard_shuttle
            ELSE NULL
        END as performance,
        ncp.success_rating,
        ncp.career_achievements
    FROM nfl_combine_performances ncp
    WHERE 
        CASE 
            WHEN p_test_name = '40_yard_dash' THEN ABS(ncp.forty_yard_dash - p_user_performance) <= p_tolerance
            WHEN p_test_name = '10_yard_split' THEN ABS(ncp.ten_yard_split - p_user_performance) <= p_tolerance
            WHEN p_test_name = '3_cone_drill' THEN ABS(ncp.three_cone_drill - p_user_performance) <= p_tolerance
            WHEN p_test_name = 'vertical_jump' THEN ABS(ncp.vertical_jump - p_user_performance) <= p_tolerance
            WHEN p_test_name = '20_yard_shuttle' THEN ABS(ncp.twenty_yard_shuttle - p_user_performance) <= p_tolerance
            ELSE FALSE
        END
        AND 
        CASE 
            WHEN p_test_name = '40_yard_dash' THEN ncp.forty_yard_dash IS NOT NULL
            WHEN p_test_name = '10_yard_split' THEN ncp.ten_yard_split IS NOT NULL
            WHEN p_test_name = '3_cone_drill' THEN ncp.three_cone_drill IS NOT NULL
            WHEN p_test_name = 'vertical_jump' THEN ncp.vertical_jump IS NOT NULL
            WHEN p_test_name = '20_yard_shuttle' THEN ncp.twenty_yard_shuttle IS NOT NULL
            ELSE FALSE
        END
    ORDER BY 
        CASE 
            WHEN p_test_name = '40_yard_dash' THEN ABS(ncp.forty_yard_dash - p_user_performance)
            WHEN p_test_name = '10_yard_split' THEN ABS(ncp.ten_yard_split - p_user_performance)
            WHEN p_test_name = '3_cone_drill' THEN ABS(ncp.three_cone_drill - p_user_performance)
            WHEN p_test_name = 'vertical_jump' THEN ABS(ncp.vertical_jump - p_user_performance)
            WHEN p_test_name = '20_yard_shuttle' THEN ABS(ncp.twenty_yard_shuttle - p_user_performance)
            ELSE 999
        END,
        ncp.success_rating DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Function to generate comparison message
CREATE OR REPLACE FUNCTION generate_comparison_message(
    p_user_performance DECIMAL(6,2),
    p_test_name VARCHAR(50),
    p_player_name VARCHAR(150),
    p_player_performance DECIMAL(4,2),
    p_draft_year INTEGER,
    p_position VARCHAR(50),
    p_achievements TEXT[]
) 
RETURNS TEXT AS $$
DECLARE
    achievement_text TEXT := '';
    comparison_text TEXT;
    performance_descriptor TEXT;
BEGIN
    -- Build achievement text
    IF p_achievements IS NOT NULL AND array_length(p_achievements, 1) > 0 THEN
        IF 'Hall_of_Fame' = ANY(p_achievements) THEN
            achievement_text := ' (Hall of Fame)';
        ELSIF 'All_Pro' = ANY(p_achievements) THEN
            achievement_text := ' (All-Pro)';
        ELSIF 'Pro_Bowl' = ANY(p_achievements) THEN
            achievement_text := ' (Pro Bowl)';
        ELSIF 'Super_Bowl' = ANY(p_achievements) THEN
            achievement_text := ' (Super Bowl winner)';
        END IF;
    END IF;
    
    -- Determine performance descriptor
    CASE p_test_name
        WHEN '40_yard_dash' THEN performance_descriptor := 'as fast as';
        WHEN '10_yard_split' THEN performance_descriptor := 'accelerates like';
        WHEN 'vertical_jump' THEN performance_descriptor := 'jumps as high as';
        WHEN '3_cone_drill' THEN performance_descriptor := 'as agile as';
        WHEN '20_yard_shuttle' THEN performance_descriptor := 'as quick as';
        ELSE performance_descriptor := 'performs like';
    END CASE;
    
    -- Generate the message
    comparison_text := format(
        'Today you''re %s %s%s, who ran %s in %s (%s)',
        performance_descriptor,
        p_player_name,
        achievement_text,
        p_player_performance || CASE 
            WHEN p_test_name IN ('40_yard_dash', '10_yard_split', '3_cone_drill', '20_yard_shuttle') THEN 's'
            WHEN p_test_name = 'vertical_jump' THEN '"'
            ELSE ''
        END,
        p_draft_year,
        p_position
    );
    
    RETURN comparison_text;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate user percentile vs NFL players
CREATE OR REPLACE FUNCTION calculate_nfl_percentile(
    p_test_name VARCHAR(50),
    p_user_performance DECIMAL(6,2)
) 
RETURNS DECIMAL(5,2) AS $$
DECLARE
    total_count INTEGER;
    better_count INTEGER;
    percentile DECIMAL(5,2);
BEGIN
    -- Count total NFL players with this test data
    CASE p_test_name
        WHEN '40_yard_dash' THEN
            SELECT COUNT(*) INTO total_count FROM nfl_combine_performances WHERE forty_yard_dash IS NOT NULL;
            SELECT COUNT(*) INTO better_count FROM nfl_combine_performances WHERE forty_yard_dash > p_user_performance;
        WHEN '10_yard_split' THEN
            SELECT COUNT(*) INTO total_count FROM nfl_combine_performances WHERE ten_yard_split IS NOT NULL;
            SELECT COUNT(*) INTO better_count FROM nfl_combine_performances WHERE ten_yard_split > p_user_performance;
        WHEN 'vertical_jump' THEN
            SELECT COUNT(*) INTO total_count FROM nfl_combine_performances WHERE vertical_jump IS NOT NULL;
            SELECT COUNT(*) INTO better_count FROM nfl_combine_performances WHERE vertical_jump < p_user_performance;
        WHEN '3_cone_drill' THEN
            SELECT COUNT(*) INTO total_count FROM nfl_combine_performances WHERE three_cone_drill IS NOT NULL;
            SELECT COUNT(*) INTO better_count FROM nfl_combine_performances WHERE three_cone_drill > p_user_performance;
        WHEN '20_yard_shuttle' THEN
            SELECT COUNT(*) INTO total_count FROM nfl_combine_performances WHERE twenty_yard_shuttle IS NOT NULL;
            SELECT COUNT(*) INTO better_count FROM nfl_combine_performances WHERE twenty_yard_shuttle > p_user_performance;
        ELSE
            total_count := 0;
            better_count := 0;
    END CASE;
    
    IF total_count > 0 THEN
        percentile := (better_count::DECIMAL / total_count::DECIMAL) * 100;
    ELSE
        percentile := 0;
    END IF;
    
    RETURN percentile;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- MATERIALIZED VIEW FOR FAST COMPARISONS
-- =============================================================================

-- Pre-computed comparison data for common performance ranges
CREATE MATERIALIZED VIEW IF NOT EXISTS nfl_performance_ranges AS
SELECT 
    position,
    'forty_yard_dash' as test_name,
    ROUND(forty_yard_dash, 1) as performance_range,
    COUNT(*) as player_count,
    AVG(success_rating) as avg_success_rating,
    STRING_AGG(player_name || ' (' || draft_year || ')', ', ' ORDER BY success_rating DESC LIMIT 3) as top_players
FROM nfl_combine_performances 
WHERE forty_yard_dash IS NOT NULL
GROUP BY position, ROUND(forty_yard_dash, 1)

UNION ALL

SELECT 
    position,
    'vertical_jump' as test_name,
    ROUND(vertical_jump, 0) as performance_range,
    COUNT(*) as player_count,
    AVG(success_rating) as avg_success_rating,
    STRING_AGG(player_name || ' (' || draft_year || ')', ', ' ORDER BY success_rating DESC LIMIT 3) as top_players
FROM nfl_combine_performances 
WHERE vertical_jump IS NOT NULL
GROUP BY position, ROUND(vertical_jump, 0)

UNION ALL

SELECT 
    position,
    'three_cone_drill' as test_name,
    ROUND(three_cone_drill, 1) as performance_range,
    COUNT(*) as player_count,
    AVG(success_rating) as avg_success_rating,
    STRING_AGG(player_name || ' (' || draft_year || ')', ', ' ORDER BY success_rating DESC LIMIT 3) as top_players
FROM nfl_combine_performances 
WHERE three_cone_drill IS NOT NULL
GROUP BY position, ROUND(three_cone_drill, 1);

CREATE UNIQUE INDEX IF NOT EXISTS idx_performance_ranges_unique 
ON nfl_performance_ranges(position, test_name, performance_range);

-- =============================================================================
-- USER COMPARISON TRACKING
-- =============================================================================

-- Track comparison history for users
CREATE TABLE IF NOT EXISTS user_comparison_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    comparison_date DATE DEFAULT CURRENT_DATE,
    test_name VARCHAR(50),
    user_performance DECIMAL(6,2),
    matched_player_name VARCHAR(150),
    matched_player_year INTEGER,
    comparison_message TEXT,
    user_reaction VARCHAR(20), -- 'motivated', 'surprised', 'proud', 'disappointed'
    shared_on_social BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- FUNCTIONS FOR UX INTEGRATION
-- =============================================================================

-- Main function to generate user comparison
CREATE OR REPLACE FUNCTION generate_user_nfl_comparison(
    p_user_id INTEGER,
    p_test_name VARCHAR(50),
    p_user_performance DECIMAL(6,2)
) 
RETURNS TABLE (
    comparison_message TEXT,
    matched_player_name VARCHAR(150),
    matched_player_performance DECIMAL(4,2),
    matched_player_year INTEGER,
    matched_player_position VARCHAR(50),
    user_percentile DECIMAL(5,2),
    better_than_count INTEGER,
    total_players_count INTEGER,
    motivation_level VARCHAR(20)
) AS $$
DECLARE
    closest_player RECORD;
    percentile DECIMAL(5,2);
    better_count INTEGER;
    total_count INTEGER;
    message TEXT;
    motivation VARCHAR(20);
BEGIN
    -- Find the closest matching NFL player
    SELECT * INTO closest_player
    FROM find_similar_nfl_players(p_test_name, p_user_performance, 0.1)
    ORDER BY ABS(performance - p_user_performance), success_rating DESC
    LIMIT 1;
    
    -- Calculate percentile
    percentile := calculate_nfl_percentile(p_test_name, p_user_performance);
    
    -- Calculate counts for context
    CASE p_test_name
        WHEN '40_yard_dash' THEN
            SELECT COUNT(*) INTO total_count FROM nfl_combine_performances WHERE forty_yard_dash IS NOT NULL;
            SELECT COUNT(*) INTO better_count FROM nfl_combine_performances WHERE forty_yard_dash > p_user_performance;
        WHEN 'vertical_jump' THEN
            SELECT COUNT(*) INTO total_count FROM nfl_combine_performances WHERE vertical_jump IS NOT NULL;
            SELECT COUNT(*) INTO better_count FROM nfl_combine_performances WHERE vertical_jump < p_user_performance;
        ELSE
            total_count := 0;
            better_count := 0;
    END CASE;
    
    -- Determine motivation level
    IF percentile >= 80 THEN motivation := 'elite';
    ELSIF percentile >= 60 THEN motivation := 'very_good';
    ELSIF percentile >= 40 THEN motivation := 'good';
    ELSIF percentile >= 20 THEN motivation := 'developing';
    ELSE motivation := 'improving';
    END IF;
    
    -- Generate message
    IF closest_player.player_name IS NOT NULL THEN
        message := generate_comparison_message(
            p_user_performance,
            p_test_name,
            closest_player.player_name,
            closest_player.performance,
            closest_player.draft_year,
            closest_player.position,
            closest_player.achievements
        );
    ELSE
        message := format('Your %s time of %s is unique - keep training to reach NFL levels!', 
                         replace(p_test_name, '_', ' '), p_user_performance);
    END IF;
    
    -- Store the comparison
    INSERT INTO user_nfl_comparisons (
        user_id, test_name, user_performance, matched_nfl_players,
        performance_percentile, better_than_count, total_nfl_players_count, comparison_message
    ) VALUES (
        p_user_id, p_test_name, p_user_performance, 
        jsonb_build_object('closest_match', closest_player),
        percentile, better_count, total_count, message
    );
    
    -- Return the comparison data
    RETURN QUERY SELECT 
        message,
        closest_player.player_name,
        closest_player.performance,
        closest_player.draft_year,
        closest_player.position,
        percentile,
        better_count,
        total_count,
        motivation;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_nfl_comparison_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY nfl_performance_ranges;
END;
$$ LANGUAGE plpgsql;