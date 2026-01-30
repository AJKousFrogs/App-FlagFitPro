-- =============================================================================
-- GAME EVENTS AND STATISTICS SYSTEM
-- Migration: 029_game_events_system.sql
-- Purpose: Track every game event, drop, missed flag, throw, and performance metric
-- Created: 2025-11-16
-- =============================================================================

-- =============================================================================
-- GAMES TABLE
-- Track individual games/matches
-- =============================================================================

CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(255) UNIQUE NOT NULL,
    team_id VARCHAR(255) NOT NULL,
    opponent_team_name VARCHAR(255) NOT NULL,

    -- Game details
    game_date DATE NOT NULL,
    game_time TIME,
    location VARCHAR(255),
    is_home_game BOOLEAN DEFAULT TRUE,

    -- Game result
    team_score INTEGER,
    opponent_score INTEGER,
    game_result VARCHAR(20), -- 'win', 'loss', 'tie'

    -- Environmental conditions
    weather_conditions VARCHAR(100),
    temperature INTEGER, -- Fahrenheit
    field_conditions VARCHAR(50), -- 'dry', 'wet', 'muddy', 'indoor'

    -- Metadata
    season VARCHAR(20),
    tournament_name VARCHAR(255),
    game_type VARCHAR(50), -- 'regular_season', 'playoff', 'championship', 'scrimmage'

    -- Video
    game_video_url TEXT,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- GAME EVENTS TABLE
-- Real-time tracking of every play in every game
-- =============================================================================

CREATE TABLE IF NOT EXISTS game_events (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(255) NOT NULL REFERENCES games(game_id) ON DELETE CASCADE,
    team_id VARCHAR(255) NOT NULL,
    play_number INTEGER NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW(),

    -- Play context
    quarter INTEGER CHECK (quarter BETWEEN 1 AND 4),
    down INTEGER CHECK (down BETWEEN 1 AND 4),
    distance INTEGER, -- Yards to first down/goal
    yard_line INTEGER CHECK (yard_line BETWEEN 1 AND 100),
    field_zone VARCHAR(20), -- 'red_zone', 'midfield', 'own_territory'
    time_remaining INTEGER, -- Seconds remaining in quarter
    score_differential INTEGER, -- Team score minus opponent score at time of play

    -- Play type
    play_type VARCHAR(50), -- 'pass', 'run', 'punt', 'field_goal', 'conversion'
    play_category VARCHAR(50), -- 'offensive', 'defensive', 'special_teams'

    -- Players involved
    primary_player_id VARCHAR(255), -- QB, RB, WR who touched ball
    secondary_player_ids TEXT[], -- Other players involved
    defender_ids TEXT[], -- Defenders on play

    -- Play outcome
    play_result VARCHAR(50), -- 'completion', 'incompletion', 'touchdown', 'flag_pull', 'out_of_bounds', 'turnover'
    yards_gained INTEGER,
    yards_after_catch INTEGER, -- YAC for passing plays

    -- Success/failure classification
    is_successful BOOLEAN,
    is_turnover BOOLEAN DEFAULT FALSE,
    is_penalty BOOLEAN DEFAULT FALSE,
    penalty_type VARCHAR(100),

    -- Environmental factors at time of play
    weather_conditions VARCHAR(100),
    field_conditions VARCHAR(50), -- 'dry', 'wet', 'muddy'

    -- Additional metadata
    play_notes TEXT,
    video_timestamp INTEGER, -- Timestamp in game video (seconds)
    video_clip_url TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- PASSING STATISTICS (Granular QB/WR tracking)
-- Track every pass attempt with detailed analytics
-- =============================================================================

CREATE TABLE IF NOT EXISTS passing_stats (
    id SERIAL PRIMARY KEY,
    game_event_id INTEGER REFERENCES game_events(id) ON DELETE CASCADE,
    game_id VARCHAR(255) NOT NULL,

    -- Players
    quarterback_id VARCHAR(255) NOT NULL,
    receiver_id VARCHAR(255), -- NULL if incompletion
    defender_id VARCHAR(255), -- Primary defender in coverage

    -- Throw details
    throw_type VARCHAR(50), -- 'quick_slant', 'deep_post', 'screen', 'out_route', 'comeback', 'fade', 'go'
    route_depth INTEGER, -- Yards downfield
    target_location VARCHAR(50), -- 'left_sideline', 'middle', 'right_sideline', 'deep_middle'

    -- Accuracy assessment
    throw_accuracy VARCHAR(50), -- 'perfect', 'good', 'catchable', 'bad', 'terrible'
    intended_spot_accuracy DECIMAL(4,2), -- Distance from intended spot (yards)

    -- Outcome classification
    outcome VARCHAR(50), -- 'completion', 'drop', 'incompletion_overthrow', 'incompletion_underthrow',
                         -- 'incompletion_wide_left', 'incompletion_wide_right', 'interception',
                         -- 'defended_pass', 'throwaway'

    -- Drop analysis (if applicable)
    is_drop BOOLEAN DEFAULT FALSE,
    drop_severity VARCHAR(20), -- 'unforgivable', 'should_catch', 'difficult', 'contested'
    drop_reason VARCHAR(100), -- 'hands', 'body_catch_attempt', 'distraction', 'defender_contact', 'sun', 'wind'

    -- Pressure and coverage
    qb_under_pressure BOOLEAN DEFAULT FALSE,
    time_to_throw DECIMAL(3,2), -- Seconds from snap to release
    coverage_type VARCHAR(50), -- 'man', 'zone', 'press', 'off'
    separation_at_catch DECIMAL(4,2), -- Yards between WR and nearest defender

    -- Physics and performance (if measured)
    throw_velocity INTEGER, -- MPH
    hang_time DECIMAL(3,2), -- Seconds ball in air

    -- Video evidence
    video_clip_url TEXT,
    video_start_time DECIMAL(6,2),
    video_end_time DECIMAL(6,2),

    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- FLAG PULL STATISTICS
-- Track every flag pull attempt and outcome
-- =============================================================================

CREATE TABLE IF NOT EXISTS flag_pull_stats (
    id SERIAL PRIMARY KEY,
    game_event_id INTEGER REFERENCES game_events(id) ON DELETE CASCADE,
    game_id VARCHAR(255) NOT NULL,

    -- Players
    ball_carrier_id VARCHAR(255) NOT NULL,
    defender_id VARCHAR(255) NOT NULL,

    -- Attempt details
    attempt_type VARCHAR(50), -- 'direct_pursuit', 'angle_pursuit', 'dive_attempt', 'reach_attempt', 'zone_coverage'
    attempt_location VARCHAR(50), -- 'sideline', 'middle_field', 'goal_line', 'open_field'

    -- Outcome
    is_successful BOOLEAN NOT NULL,
    yards_before_pull INTEGER,
    yards_after_miss INTEGER, -- If unsuccessful, how many yards did carrier gain after

    -- Failure analysis (if unsuccessful)
    miss_reason VARCHAR(100), -- 'missed_grab', 'faked_out', 'out_of_position', 'fell_down', 'too_slow', 'wrong_angle'
    evasion_technique VARCHAR(100), -- What ball carrier did if successful evasion: 'spin', 'juke', 'stiff_arm', 'speed'

    -- Performance metrics
    closing_speed DECIMAL(4,2), -- Yards per second (if measured)
    pursuit_angle_degrees INTEGER, -- Angle of pursuit (0-180)
    reaction_time DECIMAL(3,2), -- Seconds from carrier's move to defender's response

    -- Additional context
    num_broken_tackles INTEGER DEFAULT 0,
    yards_after_contact INTEGER,

    -- Video
    video_clip_url TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- RECEIVING STATISTICS (WR/TE/RB)
-- Track every target and catch opportunity
-- =============================================================================

CREATE TABLE IF NOT EXISTS receiving_stats (
    id SERIAL PRIMARY KEY,
    game_event_id INTEGER REFERENCES game_events(id) ON DELETE CASCADE,
    game_id VARCHAR(255) NOT NULL,

    -- Player
    receiver_id VARCHAR(255) NOT NULL,
    defender_id VARCHAR(255),

    -- Route details
    route_type VARCHAR(50), -- 'slant', 'post', 'corner', 'out', 'in', 'go', 'comeback', 'screen', 'flat'
    route_depth INTEGER, -- Yards downfield
    route_precision VARCHAR(20), -- 'perfect', 'good', 'sloppy', 'wrong'

    -- Catch opportunity
    is_target BOOLEAN DEFAULT TRUE,
    catch_difficulty VARCHAR(50), -- 'easy', 'routine', 'difficult', 'spectacular', 'impossible'

    -- Catch outcome
    is_catch BOOLEAN,
    is_drop BOOLEAN,

    -- Drop details (if applicable)
    ball_placement VARCHAR(50), -- 'perfect', 'high', 'low', 'behind', 'ahead', 'outside', 'inside'
    catch_type_attempted VARCHAR(50), -- 'hands_catch', 'body_catch', 'diving_catch', 'contested_catch', 'one_handed'

    -- Performance after catch
    yards_after_catch INTEGER,
    broken_tackles INTEGER DEFAULT 0,
    evasion_moves INTEGER DEFAULT 0,

    -- Separation metrics
    separation_at_break DECIMAL(4,2), -- Yards of separation when cutting
    separation_at_catch DECIMAL(4,2), -- Yards of separation when ball arrives

    -- Video
    video_clip_url TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- PLAYER GAME PERFORMANCE SUMMARY
-- Aggregated statistics for each player per game
-- =============================================================================

CREATE TABLE IF NOT EXISTS player_game_summary (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(255) NOT NULL REFERENCES games(game_id) ON DELETE CASCADE,
    player_id VARCHAR(255) NOT NULL,
    position VARCHAR(50) NOT NULL,

    -- QB stats
    pass_attempts INTEGER DEFAULT 0,
    completions INTEGER DEFAULT 0,
    completion_percentage DECIMAL(5,2),
    passing_yards INTEGER DEFAULT 0,
    touchdowns INTEGER DEFAULT 0,
    interceptions INTEGER DEFAULT 0,
    qb_rating DECIMAL(5,2),
    avg_yards_per_attempt DECIMAL(4,2),
    bad_throws INTEGER DEFAULT 0,
    throw_aways INTEGER DEFAULT 0,
    time_in_pocket_avg DECIMAL(3,2),
    sacks INTEGER DEFAULT 0,

    -- Receiving stats
    targets INTEGER DEFAULT 0,
    receptions INTEGER DEFAULT 0,
    receiving_yards INTEGER DEFAULT 0,
    receiving_touchdowns INTEGER DEFAULT 0,
    drops INTEGER DEFAULT 0,
    drop_rate DECIMAL(5,2),
    yards_after_catch INTEGER DEFAULT 0,
    avg_yards_per_reception DECIMAL(4,2),
    contested_catches INTEGER DEFAULT 0,
    longest_reception INTEGER DEFAULT 0,

    -- Rushing stats
    rushing_attempts INTEGER DEFAULT 0,
    rushing_yards INTEGER DEFAULT 0,
    rushing_touchdowns INTEGER DEFAULT 0,
    yards_per_carry DECIMAL(4,2),
    broken_tackles INTEGER DEFAULT 0,
    evasions_successful INTEGER DEFAULT 0,
    evasions_attempted INTEGER DEFAULT 0,
    longest_run INTEGER DEFAULT 0,

    -- Defensive stats
    flag_pulls INTEGER DEFAULT 0,
    flag_pull_attempts INTEGER DEFAULT 0,
    flag_pull_success_rate DECIMAL(5,2),
    missed_flag_pulls INTEGER DEFAULT 0,
    defended_passes INTEGER DEFAULT 0,
    interceptions_def INTEGER DEFAULT 0,
    tackles_for_loss INTEGER DEFAULT 0,

    -- Performance under pressure
    plays_in_clutch_situations INTEGER DEFAULT 0,
    clutch_success_rate DECIMAL(5,2),
    third_down_conversions INTEGER DEFAULT 0,
    third_down_attempts INTEGER DEFAULT 0,
    red_zone_scores INTEGER DEFAULT 0,
    red_zone_attempts INTEGER DEFAULT 0,

    -- Efficiency metrics
    offensive_epa DECIMAL(6,3), -- Expected Points Added
    defensive_epa DECIMAL(6,3),
    win_probability_added DECIMAL(6,3),

    -- Fatigue indicators
    performance_decline_2nd_half BOOLEAN DEFAULT FALSE,
    stamina_score DECIMAL(4,2), -- 1-10 scale
    plays_participated INTEGER DEFAULT 0,

    -- Notes
    performance_notes TEXT,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(game_id, player_id)
);

-- =============================================================================
-- SITUATIONAL STATISTICS
-- Track performance in specific game situations
-- =============================================================================

CREATE TABLE IF NOT EXISTS situational_stats (
    id SERIAL PRIMARY KEY,
    player_id VARCHAR(255) NOT NULL,

    -- Situational categories
    situation_type VARCHAR(50), -- 'third_down', 'red_zone', 'clutch', 'first_half', 'second_half'

    -- Performance metrics
    attempts INTEGER DEFAULT 0,
    successes INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2),

    -- Specific to situation
    avg_yards DECIMAL(4,2),
    touchdowns INTEGER DEFAULT 0,
    turnovers INTEGER DEFAULT 0,

    -- Time period
    season VARCHAR(20),
    date_start DATE,
    date_end DATE,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- OPPONENT ANALYSIS
-- Track opponent player/team tendencies
-- =============================================================================

CREATE TABLE IF NOT EXISTS opponent_analysis (
    id SERIAL PRIMARY KEY,
    opponent_team_name VARCHAR(255) NOT NULL,
    opponent_player_name VARCHAR(255),

    -- Tendencies
    formation_tendencies JSONB, -- {formation: frequency}
    play_tendencies JSONB, -- {play_type: frequency}
    situational_tendencies JSONB, -- {situation: preferred_play}

    -- Strengths/weaknesses
    strengths TEXT[],
    weaknesses TEXT[],
    exploitable_matchups TEXT[],

    -- Performance data
    avg_points_per_game DECIMAL(5,2),
    avg_yards_per_play DECIMAL(4,2),
    turnover_rate DECIMAL(5,2),

    -- Notes
    scouting_notes TEXT,
    game_plan_recommendations TEXT,

    -- Time period
    season VARCHAR(20),
    last_updated TIMESTAMP DEFAULT NOW(),

    created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =============================================================================

-- Games indexes
CREATE INDEX IF NOT EXISTS idx_games_game_id ON games(game_id);
CREATE INDEX IF NOT EXISTS idx_games_team_id ON games(team_id);
CREATE INDEX IF NOT EXISTS idx_games_date ON games(game_date);

-- Game Events Indexes
CREATE INDEX IF NOT EXISTS idx_game_events_game_id ON game_events(game_id);
CREATE INDEX IF NOT EXISTS idx_game_events_player ON game_events(primary_player_id);
CREATE INDEX IF NOT EXISTS idx_game_events_play_type ON game_events(play_type);
CREATE INDEX IF NOT EXISTS idx_game_events_timestamp ON game_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_game_events_quarter ON game_events(quarter);
CREATE INDEX IF NOT EXISTS idx_game_events_result ON game_events(play_result);

-- Passing Stats Indexes
CREATE INDEX IF NOT EXISTS idx_passing_stats_game ON passing_stats(game_id);
CREATE INDEX IF NOT EXISTS idx_passing_stats_qb ON passing_stats(quarterback_id);
CREATE INDEX IF NOT EXISTS idx_passing_stats_receiver ON passing_stats(receiver_id);
CREATE INDEX IF NOT EXISTS idx_passing_stats_outcome ON passing_stats(outcome);
CREATE INDEX IF NOT EXISTS idx_passing_stats_drops ON passing_stats(is_drop) WHERE is_drop = TRUE;
CREATE INDEX IF NOT EXISTS idx_passing_stats_throw_type ON passing_stats(throw_type);

-- Flag Pull Stats Indexes
CREATE INDEX IF NOT EXISTS idx_flag_pull_stats_game ON flag_pull_stats(game_id);
CREATE INDEX IF NOT EXISTS idx_flag_pull_stats_defender ON flag_pull_stats(defender_id);
CREATE INDEX IF NOT EXISTS idx_flag_pull_stats_carrier ON flag_pull_stats(ball_carrier_id);
CREATE INDEX IF NOT EXISTS idx_flag_pull_stats_success ON flag_pull_stats(is_successful);

-- Receiving Stats Indexes
CREATE INDEX IF NOT EXISTS idx_receiving_stats_game ON receiving_stats(game_id);
CREATE INDEX IF NOT EXISTS idx_receiving_stats_receiver ON receiving_stats(receiver_id);
CREATE INDEX IF NOT EXISTS idx_receiving_stats_drops ON receiving_stats(is_drop) WHERE is_drop = TRUE;
CREATE INDEX IF NOT EXISTS idx_receiving_stats_route_type ON receiving_stats(route_type);

-- Player Game Summary Indexes
CREATE INDEX IF NOT EXISTS idx_player_game_summary_player ON player_game_summary(player_id);
CREATE INDEX IF NOT EXISTS idx_player_game_summary_game ON player_game_summary(game_id);
CREATE INDEX IF NOT EXISTS idx_player_game_summary_position ON player_game_summary(position);

-- Situational Stats Indexes
CREATE INDEX IF NOT EXISTS idx_situational_stats_player ON situational_stats(player_id);
CREATE INDEX IF NOT EXISTS idx_situational_stats_type ON situational_stats(situation_type);

-- Opponent Analysis Indexes
CREATE INDEX IF NOT EXISTS idx_opponent_analysis_team ON opponent_analysis(opponent_team_name);
CREATE INDEX IF NOT EXISTS idx_opponent_analysis_player ON opponent_analysis(opponent_player_name);

-- =============================================================================
-- VIEWS FOR COMMON ANALYTICS QUERIES
-- =============================================================================

-- Player drop rate analysis
CREATE OR REPLACE VIEW player_drop_analysis AS
SELECT
    rs.receiver_id,
    COUNT(*) as targets,
    SUM(CASE WHEN rs.is_catch THEN 1 ELSE 0 END) as catches,
    SUM(CASE WHEN rs.is_drop THEN 1 ELSE 0 END) as drops,
    ROUND(
        (SUM(CASE WHEN rs.is_drop THEN 1 ELSE 0 END)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
        2
    ) as drop_rate,
    ROUND(AVG(rs.yards_after_catch), 2) as avg_yac
FROM receiving_stats rs
GROUP BY rs.receiver_id
ORDER BY drop_rate DESC;

-- Flag pull efficiency by defender
CREATE OR REPLACE VIEW defender_flag_pull_efficiency AS
SELECT
    fps.defender_id,
    COUNT(*) as attempts,
    SUM(CASE WHEN fps.is_successful THEN 1 ELSE 0 END) as successful_pulls,
    ROUND(
        (SUM(CASE WHEN fps.is_successful THEN 1 ELSE 0 END)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
        2
    ) as success_rate,
    ROUND(AVG(fps.yards_before_pull), 2) as avg_yards_before_pull
FROM flag_pull_stats fps
GROUP BY fps.defender_id
ORDER BY success_rate DESC;

-- QB accuracy by throw type
CREATE OR REPLACE VIEW qb_accuracy_by_route AS
SELECT
    ps.quarterback_id,
    ps.throw_type,
    COUNT(*) as attempts,
    SUM(CASE WHEN ps.outcome = 'completion' THEN 1 ELSE 0 END) as completions,
    ROUND(
        (SUM(CASE WHEN ps.outcome = 'completion' THEN 1 ELSE 0 END)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
        2
    ) as completion_percentage,
    SUM(CASE WHEN ps.is_drop THEN 1 ELSE 0 END) as drops,
    SUM(CASE WHEN ps.throw_accuracy IN ('bad', 'terrible') THEN 1 ELSE 0 END) as bad_throws
FROM passing_stats ps
GROUP BY ps.quarterback_id, ps.throw_type
ORDER BY ps.quarterback_id, completion_percentage DESC;

-- Game performance summary
CREATE OR REPLACE VIEW game_performance_overview AS
SELECT
    g.game_id,
    g.game_date,
    g.opponent_team_name,
    g.team_score,
    g.opponent_score,
    g.game_result,
    COUNT(DISTINCT ge.id) as total_plays,
    SUM(CASE WHEN ge.is_turnover THEN 1 ELSE 0 END) as turnovers,
    SUM(ge.yards_gained) as total_yards,
    ROUND(AVG(ge.yards_gained), 2) as avg_yards_per_play
FROM games g
LEFT JOIN game_events ge ON g.game_id = ge.game_id
GROUP BY g.game_id, g.game_date, g.opponent_team_name, g.team_score, g.opponent_score, g.game_result
ORDER BY g.game_date DESC;

-- Situational performance (3rd down, red zone, etc.)
CREATE OR REPLACE VIEW situational_performance AS
SELECT
    ge.primary_player_id as player_id,
    CASE
        WHEN ge.down = 3 THEN 'Third Down'
        WHEN ge.field_zone = 'red_zone' THEN 'Red Zone'
        WHEN ge.time_remaining < 120 THEN 'Clutch (Last 2 min)'
        ELSE 'Other'
    END as situation,
    COUNT(*) as attempts,
    SUM(CASE WHEN ge.is_successful THEN 1 ELSE 0 END) as successes,
    ROUND(
        (SUM(CASE WHEN ge.is_successful THEN 1 ELSE 0 END)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
        2
    ) as success_rate
FROM game_events ge
WHERE ge.primary_player_id IS NOT NULL
GROUP BY ge.primary_player_id, situation
ORDER BY player_id, success_rate DESC;

-- =============================================================================
-- SAMPLE DATA (FOR TESTING)
-- =============================================================================

-- Sample game
INSERT INTO games (game_id, team_id, opponent_team_name, game_date, is_home_game, team_score, opponent_score, game_result, weather_conditions, field_conditions)
VALUES
('GAME_2025_11_10_001', 'TEAM_001', 'Blue Devils', '2025-11-10', TRUE, 35, 28, 'win', 'Clear, 68F', 'dry');

-- Sample game event (pass play)
INSERT INTO game_events (game_id, team_id, play_number, quarter, down, distance, yard_line, field_zone, play_type, primary_player_id, play_result, yards_gained, is_successful)
VALUES
('GAME_2025_11_10_001', 'TEAM_001', 1, 1, 1, 10, 75, 'midfield', 'pass', 'QB_001', 'completion', 12, TRUE);

-- Sample passing stat
INSERT INTO passing_stats (game_id, quarterback_id, receiver_id, throw_type, route_depth, throw_accuracy, outcome)
VALUES
('GAME_2025_11_10_001', 'QB_001', 'WR_001', 'quick_slant', 8, 'perfect', 'completion');

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- Verify tables created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('games', 'game_events', 'passing_stats', 'flag_pull_stats', 'receiving_stats', 'player_game_summary', 'situational_stats', 'opponent_analysis')
ORDER BY table_name;
