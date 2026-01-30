-- Migration: Player Statistics Aggregation View
-- Creates a centralized view and function for aggregating player statistics
-- Always filters data up to and including today's date

-- =============================================================================
-- VIEW: Player Statistics Aggregated (Up to Today)
-- Provides consistent, date-filtered player statistics across all games
-- =============================================================================

CREATE OR REPLACE VIEW player_stats_aggregated AS
WITH games_up_to_today AS (
    SELECT game_id, game_date, team_id, season
    FROM games
    WHERE game_date <= CURRENT_DATE + INTERVAL '1 day' - INTERVAL '1 second'
),
player_plays AS (
    -- Get all plays where player is primary
    SELECT 
        ge.id,
        ge.game_id,
        ge.primary_player_id as player_id,
        ge.play_type,
        ge.play_result,
        ge.yards_gained,
        ge.yards_after_catch,
        ge.is_successful,
        ge.is_turnover,
        g.game_date,
        g.season
    FROM game_events ge
    INNER JOIN games_up_to_today g ON ge.game_id = g.game_id
    WHERE ge.primary_player_id IS NOT NULL
    
    UNION
    
    -- Get all plays where player is in secondary players
    SELECT 
        ge.id,
        ge.game_id,
        unnest(ge.secondary_player_ids) as player_id,
        ge.play_type,
        ge.play_result,
        ge.yards_gained,
        ge.yards_after_catch,
        ge.is_successful,
        ge.is_turnover,
        g.game_date,
        g.season
    FROM game_events ge
    INNER JOIN games_up_to_today g ON ge.game_id = g.game_id
    WHERE ge.secondary_player_ids IS NOT NULL AND array_length(ge.secondary_player_ids, 1) > 0
)
SELECT 
    pp.player_id,
    COUNT(DISTINCT pp.game_id) as games_played,
    COUNT(DISTINCT g.game_id) FILTER (WHERE g.game_date <= CURRENT_DATE) as total_games_available,
    
    -- Passing stats
    COUNT(*) FILTER (WHERE pp.play_type IN ('pass', 'throw')) as pass_attempts,
    COUNT(*) FILTER (WHERE pp.play_type IN ('pass', 'throw') AND pp.play_result = 'completion') as completions,
    COALESCE(SUM(pp.yards_gained) FILTER (WHERE pp.play_type IN ('pass', 'throw')), 0) as passing_yards,
    COUNT(*) FILTER (WHERE pp.play_type IN ('pass', 'throw') AND pp.play_result = 'touchdown') as passing_touchdowns,
    COUNT(*) FILTER (WHERE pp.play_type IN ('pass', 'throw') AND pp.play_result = 'interception') as interceptions,
    
    -- Receiving stats
    COUNT(*) FILTER (WHERE pp.play_type IN ('reception', 'catch') OR pp.play_result = 'completion') as targets,
    COUNT(*) FILTER (WHERE pp.play_result = 'completion') as receptions,
    COALESCE(SUM(pp.yards_gained) FILTER (WHERE pp.play_type IN ('reception', 'catch')), 0) as receiving_yards,
    COUNT(*) FILTER (WHERE pp.play_result = 'drop') as drops,
    COALESCE(SUM(pp.yards_after_catch), 0) as yards_after_catch,
    COUNT(*) FILTER (WHERE pp.play_type IN ('reception', 'catch') AND pp.play_result = 'touchdown') as receiving_touchdowns,
    
    -- Rushing stats
    COUNT(*) FILTER (WHERE pp.play_type IN ('run', 'rush')) as rushing_attempts,
    COALESCE(SUM(pp.yards_gained) FILTER (WHERE pp.play_type IN ('run', 'rush')), 0) as rushing_yards,
    COUNT(*) FILTER (WHERE pp.play_type IN ('run', 'rush') AND pp.play_result = 'touchdown') as rushing_touchdowns,
    
    -- Defensive stats
    COUNT(*) FILTER (WHERE pp.play_type IN ('flag_pull', 'tackle')) as flag_pull_attempts,
    COUNT(*) FILTER (WHERE pp.play_type IN ('flag_pull', 'tackle') AND (pp.play_result = 'flag_pull' OR pp.is_successful = true)) as flag_pulls,
    COUNT(*) FILTER (WHERE pp.play_type IN ('flag_pull', 'tackle') AND pp.is_successful = false) as missed_flag_pulls,
    COUNT(*) FILTER (WHERE pp.play_result = 'defended_pass') as defended_passes,
    COUNT(*) FILTER (WHERE pp.play_type = 'defense' AND pp.play_result = 'interception') as interceptions_def,
    
    -- Totals
    COUNT(*) as total_plays,
    COALESCE(SUM(pp.yards_gained), 0) as total_yards
    
FROM player_plays pp
LEFT JOIN games_up_to_today g ON pp.game_id = g.game_id
GROUP BY pp.player_id;

-- =============================================================================
-- FUNCTION: Get Player Aggregated Stats
-- Returns aggregated statistics for a player up to and including today
-- =============================================================================

CREATE OR REPLACE FUNCTION get_player_aggregated_stats(
    p_player_id VARCHAR(255),
    p_season VARCHAR(20) DEFAULT NULL,
    p_team_id VARCHAR(255) DEFAULT NULL
)
RETURNS TABLE (
    player_id VARCHAR(255),
    games_played BIGINT,
    total_games_available BIGINT,
    pass_attempts BIGINT,
    completions BIGINT,
    passing_yards BIGINT,
    passing_touchdowns BIGINT,
    interceptions BIGINT,
    completion_percentage DECIMAL(5,2),
    avg_yards_per_attempt DECIMAL(4,2),
    targets BIGINT,
    receptions BIGINT,
    receiving_yards BIGINT,
    drops BIGINT,
    drop_rate DECIMAL(5,2),
    yards_after_catch BIGINT,
    receiving_touchdowns BIGINT,
    avg_yards_per_reception DECIMAL(4,2),
    rushing_attempts BIGINT,
    rushing_yards BIGINT,
    rushing_touchdowns BIGINT,
    yards_per_carry DECIMAL(4,2),
    flag_pull_attempts BIGINT,
    flag_pulls BIGINT,
    missed_flag_pulls BIGINT,
    flag_pull_success_rate DECIMAL(5,2),
    defended_passes BIGINT,
    interceptions_def BIGINT,
    total_plays BIGINT,
    total_yards BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        psa.player_id,
        psa.games_played,
        psa.total_games_available,
        psa.pass_attempts,
        psa.completions,
        psa.passing_yards,
        psa.passing_touchdowns,
        psa.interceptions,
        CASE 
            WHEN psa.pass_attempts > 0 
            THEN ROUND((psa.completions::DECIMAL / psa.pass_attempts::DECIMAL) * 100, 1)
            ELSE 0
        END as completion_percentage,
        CASE 
            WHEN psa.pass_attempts > 0 
            THEN ROUND(psa.passing_yards::DECIMAL / psa.pass_attempts::DECIMAL, 2)
            ELSE 0
        END as avg_yards_per_attempt,
        psa.targets,
        psa.receptions,
        psa.receiving_yards,
        psa.drops,
        CASE 
            WHEN psa.targets > 0 
            THEN ROUND((psa.drops::DECIMAL / psa.targets::DECIMAL) * 100, 1)
            ELSE 0
        END as drop_rate,
        psa.yards_after_catch,
        psa.receiving_touchdowns,
        CASE 
            WHEN psa.receptions > 0 
            THEN ROUND(psa.receiving_yards::DECIMAL / psa.receptions::DECIMAL, 2)
            ELSE 0
        END as avg_yards_per_reception,
        psa.rushing_attempts,
        psa.rushing_yards,
        psa.rushing_touchdowns,
        CASE 
            WHEN psa.rushing_attempts > 0 
            THEN ROUND(psa.rushing_yards::DECIMAL / psa.rushing_attempts::DECIMAL, 2)
            ELSE 0
        END as yards_per_carry,
        psa.flag_pull_attempts,
        psa.flag_pulls,
        psa.missed_flag_pulls,
        CASE 
            WHEN psa.flag_pull_attempts > 0 
            THEN ROUND((psa.flag_pulls::DECIMAL / psa.flag_pull_attempts::DECIMAL) * 100, 1)
            ELSE 0
        END as flag_pull_success_rate,
        psa.defended_passes,
        psa.interceptions_def,
        psa.total_plays,
        psa.total_yards
    FROM player_stats_aggregated psa
    WHERE psa.player_id = p_player_id
        AND (p_season IS NULL OR EXISTS (
            SELECT 1 FROM games g 
            WHERE g.game_id IN (
                SELECT DISTINCT game_id FROM game_events 
                WHERE primary_player_id = p_player_id 
                   OR p_player_id = ANY(secondary_player_ids)
            )
            AND g.season = p_season
            AND g.game_date <= CURRENT_DATE + INTERVAL '1 day' - INTERVAL '1 second'
        ))
        AND (p_team_id IS NULL OR EXISTS (
            SELECT 1 FROM games g 
            WHERE g.team_id = p_team_id
            AND g.game_id IN (
                SELECT DISTINCT game_id FROM game_events 
                WHERE primary_player_id = p_player_id 
                   OR p_player_id = ANY(secondary_player_ids)
            )
            AND g.game_date <= CURRENT_DATE + INTERVAL '1 day' - INTERVAL '1 second'
        ));
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- INDEXES for performance
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_game_events_primary_player_date 
ON game_events(primary_player_id, game_id) 
WHERE primary_player_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_games_date_team 
ON games(game_date, team_id);

CREATE INDEX IF NOT EXISTS idx_games_date_season 
ON games(game_date, season);

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

GRANT SELECT ON player_stats_aggregated TO authenticated;
GRANT EXECUTE ON FUNCTION get_player_aggregated_stats TO authenticated;
