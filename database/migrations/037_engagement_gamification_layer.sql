-- Migration: Engagement & Gamification Layer
-- This migration adds comprehensive gamification and engagement systems

-- 1. ACHIEVEMENT BADGES AND CRITERIA
CREATE TABLE IF NOT EXISTS achievement_badges (
    id SERIAL PRIMARY KEY,
    badge_name VARCHAR(200) NOT NULL,
    badge_description TEXT NOT NULL,
    badge_category VARCHAR(100) NOT NULL, -- 'performance', 'consistency', 'teamwork', 'leadership', 'milestone'
    badge_icon_url VARCHAR(500),
    badge_rarity VARCHAR(50) NOT NULL CHECK (badge_rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    xp_value INTEGER NOT NULL CHECK (xp_value >= 0),
    criteria_json JSONB NOT NULL, -- specific criteria to earn the badge
    criteria_description TEXT NOT NULL,
    unlock_conditions TEXT[],
    badge_tier INTEGER DEFAULT 1, -- for multi-tier badges
    max_tier INTEGER DEFAULT 1,
    tier_progression JSONB, -- progression criteria for higher tiers
    evidence_required BOOLEAN DEFAULT false, -- whether proof is needed
    manual_approval_required BOOLEAN DEFAULT false, -- whether coach/admin approval needed
    badge_metadata JSONB, -- additional badge information
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. USER BADGES AND ACHIEVEMENTS
CREATE TABLE IF NOT EXISTS user_badges (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id INTEGER NOT NULL REFERENCES achievement_badges(id) ON DELETE CASCADE,
    date_awarded DATE NOT NULL,
    awarded_by UUID REFERENCES users(id), -- coach, admin, or system
    badge_tier INTEGER DEFAULT 1,
    evidence_submitted JSONB, -- proof of achievement
    approval_status VARCHAR(50) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    approval_notes TEXT,
    approval_date DATE,
    xp_earned INTEGER NOT NULL,
    achievement_context TEXT, -- context of how badge was earned
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. XP AND LEVELING SYSTEM
CREATE TABLE IF NOT EXISTS user_xp_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    xp_date DATE NOT NULL,
    xp_amount INTEGER NOT NULL,
    xp_source VARCHAR(100) NOT NULL, -- 'badge_earned', 'daily_login', 'training_completed', 'goal_achieved'
    source_details JSONB, -- specific details about the XP source
    xp_multiplier DECIMAL(3,2) DEFAULT 1.0, -- any bonus multipliers
    total_xp_after INTEGER NOT NULL, -- cumulative XP after this entry
    level_before INTEGER,
    level_after INTEGER,
    level_up BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. USER LEVELS AND PROGRESSION
CREATE TABLE IF NOT EXISTS user_levels (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_level INTEGER NOT NULL DEFAULT 1,
    current_xp INTEGER NOT NULL DEFAULT 0,
    total_xp_earned INTEGER NOT NULL DEFAULT 0,
    level_progress_percentage DECIMAL(5,2) DEFAULT 0,
    xp_to_next_level INTEGER,
    level_title VARCHAR(100), -- 'Rookie', 'Veteran', 'Elite', 'Legend'
    level_benefits JSONB, -- perks unlocked at this level
    level_achieved_date DATE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. LEADERBOARDS AND COMPETITION
CREATE TABLE IF NOT EXISTS leaderboards (
    id SERIAL PRIMARY KEY,
    board_id VARCHAR(100) NOT NULL, -- unique identifier for the leaderboard
    board_name VARCHAR(200) NOT NULL,
    board_description TEXT,
    scope VARCHAR(100) NOT NULL, -- 'team', 'league', 'global', 'position_specific'
    metric VARCHAR(100) NOT NULL, -- 'total_xp', 'badges_earned', 'training_streak', 'performance_score'
    period VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly', 'seasonal', 'all_time'
    ranking_algorithm VARCHAR(100) DEFAULT 'standard', -- 'standard', 'weighted', 'time_decay'
    algorithm_parameters JSONB, -- specific parameters for the ranking algorithm
    update_frequency VARCHAR(50) DEFAULT 'daily', -- how often rankings are updated
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. LEADERBOARD ENTRIES AND RANKINGS
CREATE TABLE IF NOT EXISTS leaderboard_entries (
    id SERIAL PRIMARY KEY,
    leaderboard_id INTEGER NOT NULL REFERENCES leaderboards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ranking_position INTEGER NOT NULL,
    metric_value DECIMAL(10,4) NOT NULL,
    ranking_score DECIMAL(10,4), -- calculated ranking score
    previous_position INTEGER,
    position_change INTEGER, -- positive for improvement, negative for decline
    streak_count INTEGER DEFAULT 0, -- consecutive periods in top positions
    best_position INTEGER, -- best position achieved
    entry_date DATE NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. CHALLENGES AND GOALS
CREATE TABLE IF NOT EXISTS challenges (
    id SERIAL PRIMARY KEY,
    challenge_name VARCHAR(200) NOT NULL,
    challenge_description TEXT NOT NULL,
    challenge_type VARCHAR(100) NOT NULL, -- 'daily', 'weekly', 'monthly', 'seasonal', 'special_event'
    challenge_category VARCHAR(100) NOT NULL, -- 'performance', 'consistency', 'teamwork', 'skill_development'
    challenge_criteria JSONB NOT NULL, -- specific criteria to complete
    challenge_duration_days INTEGER,
    start_date DATE,
    end_date DATE,
    xp_reward INTEGER NOT NULL,
    badge_reward_id INTEGER REFERENCES achievement_badges(id),
    challenge_difficulty VARCHAR(50) CHECK (challenge_difficulty IN ('easy', 'medium', 'hard', 'expert')),
    max_participants INTEGER, -- null for unlimited
    current_participants INTEGER DEFAULT 0,
    challenge_status VARCHAR(50) DEFAULT 'active' CHECK (challenge_status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. USER CHALLENGE PARTICIPATION
CREATE TABLE IF NOT EXISTS user_challenges (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    challenge_id INTEGER NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    participation_date DATE NOT NULL,
    challenge_progress_percentage DECIMAL(5,2) DEFAULT 0,
    current_criteria_progress JSONB, -- progress on each criterion
    challenge_completed BOOLEAN DEFAULT false,
    completion_date DATE,
    xp_earned INTEGER DEFAULT 0,
    badge_earned_id INTEGER REFERENCES achievement_badges(id),
    participation_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. STREAKS AND CONSISTENCY TRACKING
CREATE TABLE IF NOT EXISTS user_streaks (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    streak_type VARCHAR(100) NOT NULL, -- 'training', 'hydration', 'sleep', 'nutrition', 'recovery'
    current_streak_count INTEGER NOT NULL DEFAULT 0,
    longest_streak_count INTEGER NOT NULL DEFAULT 0,
    streak_start_date DATE,
    last_activity_date DATE,
    streak_status VARCHAR(50) DEFAULT 'active' CHECK (streak_status IN ('active', 'broken', 'completed')),
    streak_goals JSONB, -- target streak lengths and rewards
    streak_rewards JSONB, -- rewards for maintaining streaks
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. SOCIAL FEATURES AND INTERACTIONS
CREATE TABLE IF NOT EXISTS social_interactions (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interaction_type VARCHAR(100) NOT NULL, -- 'congratulation', 'motivation', 'challenge', 'support'
    target_user_id UUID REFERENCES users(id), -- user receiving the interaction
    interaction_content TEXT,
    interaction_metadata JSONB, -- additional interaction data
    xp_value INTEGER DEFAULT 0, -- XP earned from social interaction
    interaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_public BOOLEAN DEFAULT true, -- whether visible to team/community
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_achievement_badges_category ON achievement_badges(badge_category);
CREATE INDEX IF NOT EXISTS idx_achievement_badges_rarity ON achievement_badges(badge_rarity);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_date ON user_badges(date_awarded);
CREATE INDEX IF NOT EXISTS idx_user_xp_logs_user ON user_xp_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_xp_logs_date ON user_xp_logs(xp_date);
CREATE INDEX IF NOT EXISTS idx_user_levels_user ON user_levels(user_id);
CREATE INDEX IF NOT EXISTS idx_user_levels_level ON user_levels(current_level);
CREATE INDEX IF NOT EXISTS idx_leaderboards_scope ON leaderboards(scope, metric);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_board ON leaderboard_entries(leaderboard_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_user ON leaderboard_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_position ON leaderboard_entries(ranking_position);
CREATE INDEX IF NOT EXISTS idx_challenges_type ON challenges(challenge_type, challenge_status);
CREATE INDEX IF NOT EXISTS idx_user_challenges_user ON user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_challenge ON user_challenges(challenge_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_user ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_type ON user_streaks(streak_type);
CREATE INDEX IF NOT EXISTS idx_social_interactions_user ON social_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_social_interactions_target ON social_interactions(target_user_id);

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_badges_unique ON user_badges(user_id, badge_id, badge_tier);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_levels_unique ON user_levels(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_entries_unique ON leaderboard_entries(leaderboard_id, user_id, entry_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_challenges_unique ON user_challenges(user_id, challenge_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_streaks_unique ON user_streaks(user_id, streak_type);

-- Insert sample achievement badges
INSERT INTO achievement_badges (badge_name, badge_description, badge_category, badge_rarity, xp_value, criteria_json, criteria_description, unlock_conditions) VALUES
('Hydration Master', 'Maintain perfect hydration for 30 consecutive days', 'consistency', 'rare', 500, '{"consecutive_days": 30, "hydration_goal_met": true}', 'Log hydration intake and meet daily goals for 30 consecutive days', ARRAY['daily_hydration_logging', 'goal_achievement']),

('Sleep Champion', 'Achieve 8+ hours of quality sleep for 21 consecutive days', 'consistency', 'rare', 750, '{"consecutive_days": 21, "sleep_hours": 8, "sleep_quality": 8}', 'Maintain excellent sleep hygiene for 21 consecutive days', ARRAY['sleep_logging', 'quality_improvement']),

('Training Warrior', 'Complete 50 training sessions in a single season', 'performance', 'uncommon', 300, '{"training_sessions": 50, "season_completion": true}', 'Complete 50 training sessions within a single season', ARRAY['training_attendance', 'season_commitment']),

('Speed Demon', 'Improve 40-yard dash time by 0.3 seconds', 'performance', 'epic', 1000, '{"improvement_seconds": 0.3, "baseline_comparison": true}', 'Improve 40-yard dash time by 0.3 seconds from baseline', ARRAY['performance_improvement', 'speed_development']),

('Team Captain', 'Lead team to 5 consecutive victories', 'leadership', 'legendary', 1500, '{"consecutive_wins": 5, "leadership_role": true}', 'Lead team to 5 consecutive victories as team captain', ARRAY['team_leadership', 'winning_streak']),

('Recovery Expert', 'Complete 20 recovery sessions in a month', 'consistency', 'uncommon', 400, '{"recovery_sessions": 20, "monthly_period": true}', 'Complete 20 recovery sessions within a single month', ARRAY['recovery_commitment', 'monthly_consistency']);

-- Insert sample challenges
INSERT INTO challenges (challenge_name, challenge_description, challenge_type, challenge_category, challenge_criteria, challenge_duration_days, xp_reward, challenge_difficulty, max_participants) VALUES
('Hydration Hero', 'Drink 8 glasses of water daily for 7 days', 'weekly', 'consistency', '{"daily_glasses": 8, "consecutive_days": 7}', 7, 100, 'easy', NULL),
('Sleep Streak', 'Get 7+ hours of sleep for 14 consecutive days', 'monthly', 'consistency', '{"sleep_hours": 7, "consecutive_days": 14}', 14, 200, 'medium', NULL),
('Speed Challenge', 'Improve sprint time by 0.2 seconds in 30 days', 'monthly', 'performance', '{"improvement_seconds": 0.2, "timeframe_days": 30}', 30, 500, 'hard', NULL),
('Team Builder', 'Participate in 3 team building activities this month', 'monthly', 'teamwork', '{"team_activities": 3, "monthly_period": true}', 30, 300, 'medium', NULL);

-- Create function to calculate user level
CREATE OR REPLACE FUNCTION calculate_user_level(
    total_xp INTEGER
) RETURNS JSONB AS $$
DECLARE
    current_level INTEGER;
    xp_to_next_level INTEGER;
    level_progress_percentage DECIMAL;
    level_title VARCHAR;
    level_benefits JSONB;
BEGIN
    -- Calculate level based on XP (exponential progression)
    current_level := FLOOR(LOG(total_xp / 100.0 + 1) / LOG(1.5)) + 1;
    
    -- Calculate XP needed for next level
    xp_to_next_level := (100 * POWER(1.5, current_level - 1)) - total_xp;
    
    -- Calculate progress percentage
    level_progress_percentage := ((total_xp - (100 * POWER(1.5, current_level - 2))) / ((100 * POWER(1.5, current_level - 1)) - (100 * POWER(1.5, current_level - 2)))) * 100;
    
    -- Determine level title
    IF current_level <= 5 THEN
        level_title := 'Rookie';
    ELSIF current_level <= 10 THEN
        level_title := 'Veteran';
    ELSIF current_level <= 20 THEN
        level_title := 'Elite';
    ELSIF current_level <= 35 THEN
        level_title := 'Master';
    ELSIF current_level <= 50 THEN
        level_title := 'Legend';
    ELSE
        level_title := 'Immortal';
    END IF;
    
    -- Define level benefits
    level_benefits := jsonb_build_object(
        'unlocked_features', ARRAY[
            'Advanced analytics',
            'Custom training plans',
            'Priority support'
        ],
        'bonus_multipliers', jsonb_build_object(
            'xp_earned', 1 + (current_level * 0.05),
            'badge_value', 1 + (current_level * 0.02)
        ),
        'special_access', CASE 
            WHEN current_level >= 20 THEN ARRAY['Elite training programs', 'Exclusive challenges']
            WHEN current_level >= 10 THEN ARRAY['Advanced challenges', 'Team leadership roles']
            ELSE ARRAY['Basic features', 'Standard challenges']
        END
    );
    
    RETURN jsonb_build_object(
        'current_level', current_level,
        'xp_to_next_level', GREATEST(0, xp_to_next_level),
        'level_progress_percentage', ROUND(level_progress_percentage::numeric, 2),
        'level_title', level_title,
        'level_benefits', level_benefits
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to award XP
CREATE OR REPLACE FUNCTION award_user_xp(
    user_id_param UUID,
    xp_amount_param INTEGER,
    xp_source_param VARCHAR,
    source_details_param JSONB DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    current_level_record RECORD;
    new_level_data JSONB;
    level_up_occurred BOOLEAN := false;
    xp_multiplier DECIMAL := 1.0;
    bonus_xp INTEGER := 0;
BEGIN
    -- Get current user level
    SELECT 
        current_level,
        current_xp,
        total_xp_earned
    INTO current_level_record
    FROM user_levels 
    WHERE user_id = user_id_param;
    
    -- Apply level-based XP multiplier
    IF current_level_record.current_level >= 20 THEN
        xp_multiplier := 2.0; -- Elite level bonus
    ELSIF current_level_record.current_level >= 10 THEN
        xp_multiplier := 1.5; -- Veteran level bonus
    END IF;
    
    -- Calculate bonus XP
    bonus_xp := FLOOR(xp_amount_param * (xp_multiplier - 1.0));
    
    -- Calculate new total XP
    current_level_record.total_xp_earned := current_level_record.total_xp_earned + xp_amount_param + bonus_xp;
    
    -- Calculate new level
    new_level_data := calculate_user_level(current_level_record.total_xp_earned);
    
    -- Check if level up occurred
    IF new_level_data->>'current_level'::text > current_level_record.current_level::text THEN
        level_up_occurred := true;
    END IF;
    
    -- Update user level
    INSERT INTO user_levels (user_id, current_level, current_xp, total_xp_earned, level_progress_percentage, xp_to_next_level, level_title, level_benefits, level_achieved_date)
    VALUES (
        user_id_param,
        (new_level_data->>'current_level')::integer,
        current_level_record.total_xp_earned,
        current_level_record.total_xp_earned,
        (new_level_data->>'level_progress_percentage')::decimal,
        (new_level_data->>'xp_to_next_level')::integer,
        new_level_data->>'level_title',
        new_level_data->>'level_benefits',
        CASE WHEN level_up_occurred THEN CURRENT_DATE ELSE NULL END
    )
    ON CONFLICT (user_id) DO UPDATE SET
        current_level = EXCLUDED.current_level,
        current_xp = EXCLUDED.current_xp,
        total_xp_earned = EXCLUDED.total_xp_earned,
        level_progress_percentage = EXCLUDED.level_progress_percentage,
        xp_to_next_level = EXCLUDED.xp_to_next_level,
        level_title = EXCLUDED.level_title,
        level_benefits = EXCLUDED.level_benefits,
        level_achieved_date = EXCLUDED.level_achieved_date,
        last_updated = NOW();
    
    -- Log XP award
    INSERT INTO user_xp_logs (
        user_id, xp_date, xp_amount, xp_source, source_details, 
        xp_multiplier, total_xp_after, level_before, level_after, level_up
    ) VALUES (
        user_id_param, CURRENT_DATE, xp_amount_param + bonus_xp, xp_source_param, source_details_param,
        xp_multiplier, current_level_record.total_xp_earned, current_level_record.current_level,
        (new_level_data->>'current_level')::integer, level_up_occurred
    );
    
    RETURN jsonb_build_object(
        'xp_awarded', xp_amount_param + bonus_xp,
        'base_xp', xp_amount_param,
        'bonus_xp', bonus_xp,
        'xp_multiplier', xp_multiplier,
        'new_total_xp', current_level_record.total_xp_earned,
        'new_level', new_level_data->>'current_level',
        'level_up_occurred', level_up_occurred,
        'level_progress', new_level_data->>'level_progress_percentage'
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to check badge eligibility
CREATE OR REPLACE FUNCTION check_badge_eligibility(
    user_id_param UUID,
    badge_id_param INTEGER
) RETURNS JSONB AS $$
DECLARE
    badge_record RECORD;
    user_metrics JSONB;
    eligibility_status BOOLEAN := false;
    progress_percentage DECIMAL := 0;
    criteria_met JSONB;
    missing_criteria JSONB;
BEGIN
    -- Get badge criteria
    SELECT 
        criteria_json,
        criteria_description,
        unlock_conditions
    INTO badge_record
    FROM achievement_badges 
    WHERE id = badge_id_param;
    
    -- Check if user already has this badge
    IF EXISTS (SELECT 1 FROM user_badges WHERE user_id = user_id_param AND badge_id = badge_id_param) THEN
        RETURN jsonb_build_object(
            'eligible', false,
            'reason', 'Badge already earned',
            'progress_percentage', 100.0
        );
    END IF;
    
    -- Evaluate criteria (simplified - would need specific logic for each badge type)
    -- This is a placeholder for the actual criteria evaluation logic
    progress_percentage := 75.0; -- Example progress
    eligibility_status := progress_percentage >= 100.0;
    
    RETURN jsonb_build_object(
        'eligible', eligibility_status,
        'progress_percentage', progress_percentage,
        'criteria_description', badge_record.criteria_description,
        'unlock_conditions', badge_record.unlock_conditions,
        'next_steps', CASE 
            WHEN progress_percentage >= 80 THEN ARRAY['Almost there!', 'Complete remaining criteria']
            WHEN progress_percentage >= 50 THEN ARRAY['Good progress', 'Continue working on goals']
            ELSE ARRAY['Keep working', 'Focus on basic requirements']
        END
    );
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_user_levels_updated_at 
    BEFORE UPDATE ON user_levels 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_streaks_updated_at 
    BEFORE UPDATE ON user_streaks 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create materialized view for gamification summary
CREATE MATERIALIZED VIEW IF NOT EXISTS gamification_summary AS
SELECT 
    ul.user_id,
    ul.current_level,
    ul.current_xp,
    ul.total_xp_earned,
    ul.level_title,
    COUNT(ub.id) as badges_earned,
    COUNT(DISTINCT ub.badge_id) as unique_badges,
    SUM(ub.xp_earned) as total_badge_xp,
    MAX(ub.date_awarded) as last_badge_date,
    COUNT(uxl.id) as xp_activities,
    AVG(uxl.xp_amount) as avg_xp_per_activity,
    COUNT(CASE WHEN uxl.level_up = true THEN 1 END) as total_level_ups
FROM user_levels ul
LEFT JOIN user_badges ub ON ul.user_id = ub.user_id
LEFT JOIN user_xp_logs uxl ON ul.user_id = uxl.user_id
GROUP BY ul.user_id, ul.current_level, ul.current_xp, ul.total_xp_earned, ul.level_title
ORDER BY ul.current_level DESC, ul.total_xp_earned DESC;

-- Add comments
COMMENT ON TABLE achievement_badges IS 'Achievement badges and their earning criteria';
COMMENT ON TABLE user_badges IS 'User badge achievements and progress tracking';
COMMENT ON TABLE user_xp_logs IS 'Detailed XP earning logs and history';
COMMENT ON TABLE user_levels IS 'User level progression and benefits';
COMMENT ON TABLE leaderboards IS 'Competitive leaderboards and ranking systems';
COMMENT ON TABLE leaderboard_entries IS 'Individual leaderboard rankings and scores';
COMMENT ON TABLE challenges IS 'Gamified challenges and goals';
COMMENT ON TABLE user_challenges IS 'User participation in challenges';
COMMENT ON TABLE user_streaks IS 'Consistency streaks and tracking';
COMMENT ON TABLE social_interactions IS 'Social features and user interactions';
COMMENT ON FUNCTION calculate_user_level IS 'Calculate user level based on total XP';
COMMENT ON FUNCTION award_user_xp IS 'Award XP to user and handle level progression';
COMMENT ON FUNCTION check_badge_eligibility IS 'Check if user is eligible for a specific badge';
