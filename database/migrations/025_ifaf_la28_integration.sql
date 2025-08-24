-- IFAF & LA28 Olympics Integration Migration
-- Creates tables for official tournament tracking, world rankings, and qualification pathways
-- Based on official IFAF and LA28 Olympic structure

-- World Rankings Table (Official IFAF Rankings)
CREATE TABLE IF NOT EXISTS ifaf_world_rankings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('men', 'women')),
    rank INTEGER NOT NULL CHECK (rank > 0),
    country VARCHAR(100) NOT NULL,
    region VARCHAR(50) NOT NULL CHECK (region IN ('Americas', 'Europe', 'Asia-Oceania', 'Africa')),
    country_code VARCHAR(3), -- ISO country code
    flag_emoji VARCHAR(10),
    points INTEGER DEFAULT 0,
    last_tournament VARCHAR(200),
    ranking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_current BOOLEAN DEFAULT true,
    previous_rank INTEGER,
    rank_change INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(gender, rank, is_current) -- Ensure unique rankings per gender for current rankings
);

-- Official Tournaments Table (IFAF Sanctioned Events)
CREATE TABLE IF NOT EXISTS official_tournaments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_name VARCHAR(200) NOT NULL,
    tournament_type VARCHAR(50) NOT NULL CHECK (tournament_type IN ('continental', 'world', 'olympic', 'regional')),
    tournament_code VARCHAR(20) UNIQUE, -- Official IFAF tournament code
    host_country VARCHAR(100),
    host_city VARCHAR(100),
    start_date DATE,
    end_date DATE,
    registration_deadline DATE,
    registration_fee DECIMAL(10,2),
    max_teams_per_gender INTEGER DEFAULT 16,
    qualification_spots INTEGER DEFAULT 0, -- How many spots this tournament provides for next level
    tournament_status VARCHAR(50) DEFAULT 'announced' CHECK (tournament_status IN ('announced', 'open_registration', 'registration_closed', 'in_progress', 'completed', 'cancelled')),
    official_website VARCHAR(500),
    ifaf_sanctioned BOOLEAN DEFAULT true,
    olympic_qualifying BOOLEAN DEFAULT false, -- Does this tournament contribute to Olympic qualification?
    world_championship_qualifying BOOLEAN DEFAULT false,
    tournament_format JSONB DEFAULT '{}', -- Tournament bracket structure, rules, etc.
    prize_pool DECIMAL(15,2),
    broadcast_details JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team Qualification Status Table
CREATE TABLE IF NOT EXISTS team_qualification_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    team_name VARCHAR(200),
    team_id UUID, -- Reference to teams table if exists
    country VARCHAR(100) NOT NULL,
    country_code VARCHAR(3),
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('men', 'women')),
    current_ranking INTEGER,
    qualification_status VARCHAR(50) DEFAULT 'not_qualified' CHECK (qualification_status IN ('qualified', 'in_progress', 'not_qualified', 'eliminated')),
    qualification_pathway VARCHAR(100) CHECK (qualification_pathway IN ('continental', 'world_championship', 'host_nation', 'wildcard', 'direct_qualification')),
    target_tournament VARCHAR(50) CHECK (target_tournament IN ('world_2026', 'la28_olympics', 'continental_2025')),
    qualifying_tournaments JSONB DEFAULT '[]', -- Array of tournament IDs user has participated in
    performance_benchmarks JSONB DEFAULT '{}', -- Current performance vs Olympic standards
    qualification_probability DECIMAL(3,2) DEFAULT 0.00 CHECK (qualification_probability >= 0 AND qualification_probability <= 1),
    next_qualifying_event VARCHAR(200),
    next_event_date DATE,
    points_for_qualification INTEGER DEFAULT 0,
    points_needed INTEGER DEFAULT 0,
    olympic_qualification_points INTEGER DEFAULT 0, -- Points toward Olympic qualification
    world_championship_qualification_points INTEGER DEFAULT 0,
    regional_ranking INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, target_tournament) -- One qualification status per user per target tournament
);

-- LA28 Performance Benchmarks Table (Official Olympic Standards)
CREATE TABLE IF NOT EXISTS la28_performance_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    benchmark_category VARCHAR(100) NOT NULL, -- 'Speed', 'Agility', 'Offensive', 'Defensive'
    metric_name VARCHAR(100) NOT NULL, -- '40-Yard Dash', 'Passing Accuracy', etc.
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('men', 'women')),
    position VARCHAR(50), -- Position-specific benchmarks (QB, WR, DB, etc.)
    elite_threshold DECIMAL(10,2), -- Elite/professional level
    olympic_threshold DECIMAL(10,2), -- Minimum Olympic qualification level
    world_record DECIMAL(10,2), -- Current world record
    national_average DECIMAL(10,2), -- National average for comparison
    unit VARCHAR(20) NOT NULL, -- 'seconds', 'percentage', 'score', 'yards'
    measurement_type VARCHAR(20) DEFAULT 'lower_better' CHECK (measurement_type IN ('lower_better', 'higher_better')), -- Whether lower or higher values are better
    description TEXT,
    source VARCHAR(200), -- Official source of benchmark (IFAF, LA28, etc.)
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    
    UNIQUE(benchmark_category, metric_name, gender, position)
);

-- Official IFAF News and Updates Table
CREATE TABLE IF NOT EXISTS ifaf_official_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    update_type VARCHAR(50) NOT NULL CHECK (update_type IN ('qualification', 'tournament', 'ranking', 'rule_change', 'announcement', 'deadline')),
    title VARCHAR(300) NOT NULL,
    content TEXT,
    content_html TEXT, -- Rich HTML content
    summary TEXT, -- Brief summary for notifications
    official_url VARCHAR(500),
    source VARCHAR(100) DEFAULT 'IFAF', -- 'IFAF', 'LA28', 'IOC', etc.
    publish_date TIMESTAMP,
    publish_date_local TIMESTAMP, -- Local timezone version
    importance_level VARCHAR(20) DEFAULT 'medium' CHECK (importance_level IN ('critical', 'high', 'medium', 'low')),
    affected_regions JSONB DEFAULT '[]', -- Which regions this affects
    affected_countries JSONB DEFAULT '[]', -- Which countries this affects
    target_audience VARCHAR(100) DEFAULT 'all' CHECK (target_audience IN ('athletes', 'coaches', 'officials', 'media', 'all')),
    notification_sent BOOLEAN DEFAULT false,
    read_count INTEGER DEFAULT 0,
    language VARCHAR(10) DEFAULT 'en',
    translation_available JSONB DEFAULT '{}', -- Available translations
    attachments JSONB DEFAULT '[]', -- Documents, images, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tournament Participation History
CREATE TABLE IF NOT EXISTS tournament_participation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tournament_id UUID REFERENCES official_tournaments(id) ON DELETE CASCADE,
    team_name VARCHAR(200),
    participation_status VARCHAR(50) DEFAULT 'registered' CHECK (participation_status IN ('registered', 'confirmed', 'competing', 'completed', 'withdrew', 'disqualified')),
    final_ranking INTEGER,
    total_participants INTEGER,
    points_earned INTEGER DEFAULT 0,
    qualification_points_earned INTEGER DEFAULT 0, -- Points toward next level of qualification
    performance_stats JSONB DEFAULT '{}', -- Game statistics, performance metrics
    awards JSONB DEFAULT '[]', -- Awards, recognitions received
    notes TEXT,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completion_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, tournament_id) -- One participation record per user per tournament
);

-- Continental Championship Details (Specific IFAF Structure)
CREATE TABLE IF NOT EXISTS continental_championships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID REFERENCES official_tournaments(id) ON DELETE CASCADE,
    continent VARCHAR(50) NOT NULL CHECK (continent IN ('Europe', 'Americas', 'Asia-Oceania', 'Africa')),
    championship_year INTEGER NOT NULL,
    host_country VARCHAR(100),
    auto_qualification_spots INTEGER DEFAULT 1, -- How many teams automatically qualify to World Championship
    wildcard_spots INTEGER DEFAULT 0,
    total_teams INTEGER,
    qualification_criteria TEXT, -- How teams qualify for this continental championship
    prize_details JSONB DEFAULT '{}',
    broadcast_schedule JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(continent, championship_year)
);

-- Olympic Qualification Timeline (Official LA28 Timeline)
CREATE TABLE IF NOT EXISTS olympic_qualification_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phase_name VARCHAR(100) NOT NULL, -- 'Continental Championships', 'World Championship', 'Final Qualification'
    phase_type VARCHAR(50) NOT NULL CHECK (phase_type IN ('continental', 'world', 'final', 'wild_card')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    registration_deadline DATE,
    phase_description TEXT,
    qualification_spots INTEGER, -- How many Olympic spots this phase provides
    participating_regions JSONB DEFAULT '[]',
    phase_status VARCHAR(50) DEFAULT 'upcoming' CHECK (phase_status IN ('upcoming', 'active', 'completed', 'cancelled')),
    official_announcement_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(phase_name, phase_type)
);

-- User Olympic Progress Tracking
CREATE TABLE IF NOT EXISTS user_olympic_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    current_phase VARCHAR(100), -- Which qualification phase they're in
    phase_status VARCHAR(50) DEFAULT 'not_started' CHECK (phase_status IN ('not_started', 'in_progress', 'qualified', 'eliminated')),
    total_qualification_points INTEGER DEFAULT 0,
    continental_ranking INTEGER,
    world_ranking INTEGER,
    olympic_probability DECIMAL(3,2) DEFAULT 0.00,
    next_milestone VARCHAR(200),
    next_milestone_date DATE,
    training_recommendations JSONB DEFAULT '[]',
    performance_gaps JSONB DEFAULT '{}', -- Areas needing improvement for Olympic qualification
    coach_recommendations JSONB DEFAULT '[]',
    last_assessment_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id) -- One Olympic progress record per user
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ifaf_world_rankings_current ON ifaf_world_rankings(is_current, gender, rank) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_ifaf_world_rankings_country ON ifaf_world_rankings(country, gender);
CREATE INDEX IF NOT EXISTS idx_official_tournaments_dates ON official_tournaments(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_official_tournaments_status ON official_tournaments(tournament_status, tournament_type);
CREATE INDEX IF NOT EXISTS idx_qualification_status_user ON team_qualification_status(user_id, target_tournament);
CREATE INDEX IF NOT EXISTS idx_qualification_status_country ON team_qualification_status(country, gender, qualification_status);
CREATE INDEX IF NOT EXISTS idx_benchmarks_lookup ON la28_performance_benchmarks(benchmark_category, gender, position) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ifaf_updates_importance ON ifaf_official_updates(importance_level, publish_date DESC);
CREATE INDEX IF NOT EXISTS idx_ifaf_updates_audience ON ifaf_official_updates(target_audience, notification_sent);
CREATE INDEX IF NOT EXISTS idx_tournament_participation_user ON tournament_participation_history(user_id, participation_status);
CREATE INDEX IF NOT EXISTS idx_olympic_progress_user ON user_olympic_progress(user_id, phase_status);

-- Insert initial LA28 Olympic benchmarks (Based on current world-class standards)
INSERT INTO la28_performance_benchmarks (benchmark_category, metric_name, gender, elite_threshold, olympic_threshold, unit, measurement_type, description, source) VALUES

-- Speed Benchmarks
('Speed', '40-Yard Dash', 'men', 4.40, 4.50, 'seconds', 'lower_better', 'Straight-line speed measurement', 'IFAF'),
('Speed', '40-Yard Dash', 'women', 5.00, 5.20, 'seconds', 'lower_better', 'Straight-line speed measurement', 'IFAF'),
('Speed', '20-Yard Split', 'men', 2.50, 2.60, 'seconds', 'lower_better', 'Acceleration measurement', 'IFAF'),
('Speed', '20-Yard Split', 'women', 2.80, 2.90, 'seconds', 'lower_better', 'Acceleration measurement', 'IFAF'),

-- Agility Benchmarks  
('Agility', '20-Yard Shuttle', 'men', 4.00, 4.20, 'seconds', 'lower_better', 'Change of direction speed', 'IFAF'),
('Agility', '20-Yard Shuttle', 'women', 4.50, 4.70, 'seconds', 'lower_better', 'Change of direction speed', 'IFAF'),
('Agility', '3-Cone Drill', 'men', 6.80, 7.00, 'seconds', 'lower_better', 'Multi-directional agility', 'IFAF'),
('Agility', '3-Cone Drill', 'women', 7.50, 7.80, 'seconds', 'lower_better', 'Multi-directional agility', 'IFAF'),

-- Position-Specific Offensive Benchmarks
('Offensive', 'Passing Accuracy', 'men', 85.0, 80.0, 'percentage', 'higher_better', 'Completion percentage in structured drills', 'IFAF'),
('Offensive', 'Passing Accuracy', 'women', 85.0, 80.0, 'percentage', 'higher_better', 'Completion percentage in structured drills', 'IFAF'),
('Offensive', 'Route Running Precision', 'men', 90.0, 85.0, 'percentage', 'higher_better', 'Accuracy in route execution', 'IFAF'),
('Offensive', 'Route Running Precision', 'women', 90.0, 85.0, 'percentage', 'higher_better', 'Accuracy in route execution', 'IFAF'),

-- Defensive Benchmarks
('Defensive', 'Coverage Success Rate', 'men', 75.0, 70.0, 'percentage', 'higher_better', 'Successful coverage plays', 'IFAF'),
('Defensive', 'Coverage Success Rate', 'women', 75.0, 70.0, 'percentage', 'higher_better', 'Successful coverage plays', 'IFAF'),
('Defensive', 'Interception Rate', 'men', 15.0, 12.0, 'percentage', 'higher_better', 'Interceptions per opportunity', 'IFAF'),
('Defensive', 'Interception Rate', 'women', 15.0, 12.0, 'percentage', 'higher_better', 'Interceptions per opportunity', 'IFAF'),

-- Mental/Tactical Benchmarks
('Tactical', 'Game IQ Score', 'men', 90.0, 85.0, 'score', 'higher_better', 'Tactical understanding assessment', 'IFAF'),
('Tactical', 'Game IQ Score', 'women', 90.0, 85.0, 'score', 'higher_better', 'Tactical understanding assessment', 'IFAF'),
('Tactical', 'Decision Making Speed', 'men', 2.5, 3.0, 'seconds', 'lower_better', 'Average time to make tactical decisions', 'IFAF'),
('Tactical', 'Decision Making Speed', 'women', 2.5, 3.0, 'seconds', 'lower_better', 'Average time to make tactical decisions', 'IFAF')

ON CONFLICT (benchmark_category, metric_name, gender, position) DO NOTHING;

-- Insert official Olympic qualification timeline
INSERT INTO olympic_qualification_timeline (phase_name, phase_type, start_date, end_date, registration_deadline, phase_description, qualification_spots, participating_regions) VALUES

('2025 Continental Championships', 'continental', '2025-06-01', '2025-09-30', '2025-04-01', 'Regional championships across all continents providing automatic qualification spots', 4, '["Americas", "Europe", "Asia-Oceania", "Africa"]'),

('2026 IFAF World Championship', 'world', '2026-07-15', '2026-07-21', '2026-04-01', 'Top 16 teams compete for 6 Olympic qualification spots', 6, '["Global"]'),

('2027 Final Qualification Tournament', 'final', '2027-03-01', '2027-03-15', '2027-01-15', 'Last chance qualification tournament for remaining Olympic spots', 2, '["Global"]')

ON CONFLICT (phase_name, phase_type) DO NOTHING;

-- Insert official tournaments
INSERT INTO official_tournaments (tournament_name, tournament_type, tournament_code, host_country, host_city, start_date, end_date, registration_deadline, max_teams_per_gender, qualification_spots, tournament_status, official_website, olympic_qualifying, world_championship_qualifying) VALUES

('IFAF European Flag Football Championships 2025', 'continental', 'EURO2025', 'France', 'TBD', '2025-09-24', '2025-09-27', '2025-07-01', 12, 1, 'announced', 'https://americanfootball.sport', true, true),

('IFAF Flag Football World Championship 2026', 'world', 'WC2026', 'Germany', 'Dusseldorf', '2026-07-15', '2026-07-21', '2026-04-01', 16, 6, 'announced', 'https://americanfootball.sport', true, false),

('LA28 Olympic Flag Football Tournament', 'olympic', 'LA28', 'United States', 'Los Angeles', '2028-07-14', '2028-07-30', '2028-01-01', 6, 6, 'confirmed', 'https://la28.org/en/games-plan/olympics/flag-football.html', false, false)

ON CONFLICT (tournament_code) DO NOTHING;

-- Insert current world rankings (based on 2024 IFAF World Championships results)
INSERT INTO ifaf_world_rankings (gender, rank, country, country_code, flag_emoji, region, points, last_tournament, is_current) VALUES

-- Men's Rankings
('men', 1, 'United States', 'USA', '🇺🇸', 'Americas', 2150, '2024 IFAF World Championship', true),
('men', 2, 'Austria', 'AUT', '🇦🇹', 'Europe', 1980, '2024 IFAF World Championship', true),
('men', 3, 'Switzerland', 'CHE', '🇨🇭', 'Europe', 1920, '2024 IFAF World Championship', true),
('men', 4, 'Mexico', 'MEX', '🇲🇽', 'Americas', 1885, '2024 IFAF World Championship', true),
('men', 5, 'France', 'FRA', '🇫🇷', 'Europe', 1840, '2024 IFAF World Championship', true),
('men', 6, 'Italy', 'ITA', '🇮🇹', 'Europe', 1815, '2024 IFAF World Championship', true),
('men', 7, 'Germany', 'DEU', '🇩🇪', 'Europe', 1780, '2024 IFAF World Championship', true),
('men', 8, 'Great Britain', 'GBR', '🇬🇧', 'Europe', 1750, '2024 IFAF World Championship', true),

-- Women's Rankings  
('women', 1, 'United States', 'USA', '🇺🇸', 'Americas', 2200, '2024 IFAF World Championship', true),
('women', 2, 'Mexico', 'MEX', '🇲🇽', 'Americas', 2050, '2024 IFAF World Championship', true),
('women', 3, 'Austria', 'AUT', '🇦🇹', 'Europe', 1950, '2024 IFAF World Championship', true),
('women', 4, 'Switzerland', 'CHE', '🇨🇭', 'Europe', 1890, '2024 IFAF World Championship', true),
('women', 5, 'France', 'FRA', '🇫🇷', 'Europe', 1820, '2024 IFAF World Championship', true),
('women', 6, 'Italy', 'ITA', '🇮🇹', 'Europe', 1780, '2024 IFAF World Championship', true),
('women', 7, 'Germany', 'DEU', '🇩🇪', 'Europe', 1740, '2024 IFAF World Championship', true),
('women', 8, 'Great Britain', 'GBR', '🇬🇧', 'Europe', 1700, '2024 IFAF World Championship', true)

ON CONFLICT (gender, rank, is_current) DO NOTHING;