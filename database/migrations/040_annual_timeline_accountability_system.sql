-- Migration: Annual Timeline & Accountability Framework System
-- This migration adds comprehensive annual planning, timeline management, and accountability tracking

-- 1. ANNUAL PERFORMANCE TIMELINES
CREATE TABLE IF NOT EXISTS annual_performance_timelines (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    timeline_year INTEGER NOT NULL,
    timeline_name VARCHAR(200) NOT NULL,
    timeline_description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    timeline_status VARCHAR(50) DEFAULT 'active', -- 'draft', 'active', 'completed', 'archived'
    total_phases INTEGER NOT NULL,
    current_phase INTEGER DEFAULT 1,
    overall_progress_percentage DECIMAL(5,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TIMELINE PHASES AND MILESTONES
CREATE TABLE IF NOT EXISTS timeline_phases (
    id SERIAL PRIMARY KEY,
    timeline_id INTEGER NOT NULL REFERENCES annual_performance_timelines(id) ON DELETE CASCADE,
    phase_number INTEGER NOT NULL,
    phase_name VARCHAR(200) NOT NULL,
    phase_description TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration_weeks INTEGER NOT NULL,
    key_focus_areas TEXT[] NOT NULL,
    primary_objectives TEXT[] NOT NULL,
    success_criteria TEXT[] NOT NULL,
    phase_status VARCHAR(50) DEFAULT 'upcoming', -- 'upcoming', 'active', 'completed', 'delayed'
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. MONTHLY FOCUS AREAS AND GOALS
CREATE TABLE IF NOT EXISTS monthly_focus_areas (
    id SERIAL PRIMARY KEY,
    timeline_id INTEGER NOT NULL REFERENCES annual_performance_timelines(id) ON DELETE CASCADE,
    month_number INTEGER NOT NULL CHECK (month_number >= 1 AND month_number <= 12),
    month_name VARCHAR(20) NOT NULL,
    focus_area VARCHAR(200) NOT NULL,
    primary_goals TEXT[] NOT NULL,
    key_activities TEXT[] NOT NULL,
    expected_outcomes TEXT[] NOT NULL,
    success_metrics TEXT[] NOT NULL,
    community_activation_events TEXT[],
    month_status VARCHAR(50) DEFAULT 'planned', -- 'planned', 'active', 'completed', 'reviewed'
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ACCOUNTABILITY GROUPS AND MENTORSHIP
CREATE TABLE IF NOT EXISTS accountability_groups (
    id SERIAL PRIMARY KEY,
    group_name VARCHAR(200) NOT NULL,
    group_description TEXT,
    mentor_coach_id UUID REFERENCES users(id),
    max_participants INTEGER DEFAULT 10,
    current_participants INTEGER DEFAULT 0,
    group_type VARCHAR(100) NOT NULL, -- 'performance', 'nutrition', 'recovery', 'mental', 'mixed'
    meeting_frequency VARCHAR(50) NOT NULL, -- 'weekly', 'biweekly', 'monthly'
    meeting_duration_minutes INTEGER DEFAULT 60,
    group_status VARCHAR(50) DEFAULT 'active', -- 'forming', 'active', 'paused', 'completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. GROUP MEMBERSHIPS AND PARTICIPATION
CREATE TABLE IF NOT EXISTS accountability_group_memberships (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES accountability_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    membership_start_date DATE NOT NULL,
    membership_end_date DATE,
    role VARCHAR(50) DEFAULT 'participant', -- 'participant', 'assistant_mentor', 'mentor'
    participation_level VARCHAR(50) DEFAULT 'active', -- 'active', 'passive', 'inactive', 'suspended'
    attendance_percentage DECIMAL(5,2) DEFAULT 0,
    contribution_score INTEGER CHECK (contribution_score >= 1 AND contribution_score <= 10),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. WEEKLY CHECK-INS AND PROGRESS TRACKING
CREATE TABLE IF NOT EXISTS weekly_check_ins (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES accountability_groups(id) ON DELETE CASCADE,
    check_in_date DATE NOT NULL,
    week_number INTEGER NOT NULL,
    goals_set TEXT[] NOT NULL,
    goals_achieved TEXT[] NOT NULL,
    challenges_faced TEXT[],
    support_needed TEXT[],
    next_week_priorities TEXT[] NOT NULL,
    mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 10),
    energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
    confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 10),
    check_in_status VARCHAR(50) DEFAULT 'completed', -- 'pending', 'completed', 'overdue', 'missed'
    mentor_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. COMMUNITY ACTIVATION EVENTS
CREATE TABLE IF NOT EXISTS community_activation_events (
    id SERIAL PRIMARY KEY,
    event_name VARCHAR(200) NOT NULL,
    event_description TEXT NOT NULL,
    event_type VARCHAR(100) NOT NULL, -- 'challenge', 'competition', 'workshop', 'celebration', 'award'
    event_category VARCHAR(100) NOT NULL, -- 'strength', 'speed', 'nutrition', 'recovery', 'teamwork'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    target_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    event_format VARCHAR(100), -- 'individual', 'team', 'group', 'virtual', 'hybrid'
    prizes_awards TEXT[],
    success_criteria TEXT[],
    event_status VARCHAR(50) DEFAULT 'planned', -- 'planned', 'active', 'completed', 'cancelled'
    participation_rate_percentage DECIMAL(5,2) DEFAULT 0,
    event_impact_score INTEGER CHECK (event_impact_score >= 1 AND event_impact_score <= 10),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. EVENT PARTICIPATION AND RESULTS
CREATE TABLE IF NOT EXISTS event_participations (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES community_activation_events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    participation_start_date DATE NOT NULL,
    participation_end_date DATE,
    participation_status VARCHAR(50) DEFAULT 'active', -- 'registered', 'active', 'completed', 'withdrawn'
    performance_score DECIMAL(5,2),
    ranking_position INTEGER,
    achievements_earned TEXT[],
    feedback_received TEXT,
    lessons_learned TEXT[],
    next_steps TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. ANNUAL GOAL SETTING AND REVIEW
CREATE TABLE IF NOT EXISTS annual_goal_setting (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_year INTEGER NOT NULL,
    goal_category VARCHAR(100) NOT NULL, -- 'performance', 'health', 'skill', 'team', 'personal'
    goal_name VARCHAR(200) NOT NULL,
    goal_description TEXT NOT NULL,
    goal_type VARCHAR(50) NOT NULL, -- 'outcome', 'process', 'performance'
    target_value DECIMAL(8,2),
    target_unit VARCHAR(50),
    baseline_value DECIMAL(8,2),
    current_value DECIMAL(8,2),
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    goal_status VARCHAR(50) DEFAULT 'active', -- 'draft', 'active', 'achieved', 'modified', 'abandoned'
    priority_level VARCHAR(20) CHECK (priority_level IN ('critical', 'high', 'medium', 'low')),
    review_frequency VARCHAR(50) DEFAULT 'monthly', -- 'weekly', 'monthly', 'quarterly'
    next_review_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. QUARTERLY REVIEWS AND ASSESSMENTS
CREATE TABLE IF NOT EXISTS quarterly_reviews (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    review_quarter INTEGER NOT NULL CHECK (review_quarter >= 1 AND review_quarter <= 4),
    review_year INTEGER NOT NULL,
    review_date DATE NOT NULL,
    goals_reviewed INTEGER NOT NULL,
    goals_achieved INTEGER NOT NULL,
    goals_in_progress INTEGER NOT NULL,
    goals_modified INTEGER NOT NULL,
    overall_progress_percentage DECIMAL(5,2) NOT NULL,
    key_achievements TEXT[],
    challenges_encountered TEXT[],
    lessons_learned TEXT[],
    adjustments_made TEXT[],
    next_quarter_priorities TEXT[],
    mentor_coach_feedback TEXT,
    review_status VARCHAR(50) DEFAULT 'completed', -- 'scheduled', 'in_progress', 'completed', 'overdue'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_annual_timelines_user_year ON annual_performance_timelines(user_id, timeline_year);
CREATE INDEX IF NOT EXISTS idx_timeline_phases_timeline ON timeline_phases(timeline_id);
CREATE INDEX IF NOT EXISTS idx_monthly_focus_timeline ON monthly_focus_areas(timeline_id);
CREATE INDEX IF NOT EXISTS idx_monthly_focus_month ON monthly_focus_areas(month_number);
CREATE INDEX IF NOT EXISTS idx_accountability_groups_type ON accountability_groups(group_type);
CREATE INDEX IF NOT EXISTS idx_accountability_groups_mentor ON accountability_groups(mentor_coach_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_user ON accountability_group_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_group_memberships_group ON accountability_group_memberships(group_id);
CREATE INDEX IF NOT EXISTS idx_weekly_checkins_user_date ON weekly_check_ins(user_id, check_in_date);
CREATE INDEX IF NOT EXISTS idx_community_events_type_category ON community_activation_events(event_type, event_category);
CREATE INDEX IF NOT EXISTS idx_event_participations_event ON event_participations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participations_user ON event_participations(user_id);
CREATE INDEX IF NOT EXISTS idx_annual_goals_user_year ON annual_goal_setting(user_id, goal_year);
CREATE INDEX IF NOT EXISTS idx_quarterly_reviews_user_quarter ON quarterly_reviews(user_id, review_quarter, review_year);

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_annual_timelines_unique ON annual_performance_timelines(user_id, timeline_year);
CREATE UNIQUE INDEX IF NOT EXISTS idx_timeline_phases_unique ON timeline_phases(timeline_id, phase_number);
CREATE UNIQUE INDEX IF NOT EXISTS idx_monthly_focus_unique ON monthly_focus_areas(timeline_id, month_number);
CREATE UNIQUE INDEX IF NOT EXISTS idx_accountability_memberships_unique ON accountability_group_memberships(group_id, user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_weekly_checkins_unique ON weekly_check_ins(user_id, check_in_date, week_number);
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_participations_unique ON event_participations(event_id, user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_annual_goals_unique ON annual_goal_setting(user_id, goal_year, goal_category, goal_name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_quarterly_reviews_unique ON quarterly_reviews(user_id, review_quarter, review_year);

-- Sample timeline phases and monthly focus areas will be inserted after timelines are created
-- INSERT INTO timeline_phases (timeline_id, phase_number, phase_name, phase_description, start_date, end_date, duration_weeks, key_focus_areas, primary_objectives, success_criteria) VALUES
-- (1, 1, 'Off-Season Strength & Foundation', 'Build strength, power, and foundational fitness', '2025-01-01', '2025-03-31', 12, ARRAY['strength_training', 'power_development', 'mobility_work'], ARRAY['increase_strength', 'improve_power', 'enhance_mobility'], ARRAY['5RM_deadlift_increase', 'power_metrics_improvement', 'mobility_assessment_pass']),
-- (1, 2, 'Pre-Season Speed & Skill', 'Develop speed mechanics and flag football skills', '2025-04-01', '2025-05-31', 8, ARRAY['speed_mechanics', 'skill_development', 'team_coordination'], ARRAY['improve_sprint_mechanics', 'enhance_flag_skills', 'build_team_chemistry'], ARRAY['flying_10m_time_improvement', 'skill_assessment_pass', 'team_coordination_score']),
-- (1, 3, 'In-Season Performance & Maintenance', 'Maintain performance and optimize game readiness', '2025-06-01', '2025-09-30', 14, ARRAY['performance_maintenance', 'recovery_optimization', 'game_preparation'], ARRAY['maintain_strength', 'optimize_recovery', 'peak_performance'], ARRAY['strength_maintenance', 'recovery_metrics', 'game_performance']),
-- (1, 4, 'Transition & Reflection', 'Active recovery and goal review', '2025-10-01', '2025-10-31', 2, ARRAY['active_recovery', 'goal_review', 'planning'], ARRAY['facilitate_recovery', 'assess_progress', 'plan_next_year'], ARRAY['recovery_completion', 'goal_assessment', 'next_year_planning']);

-- INSERT INTO monthly_focus_areas (timeline_id, month_number, month_name, focus_area, primary_goals, key_activities, expected_outcomes, success_metrics, community_activation_events) VALUES
-- (1, 1, 'January', 'Off-season strength and weight goals', ARRAY['increase_strength', 'improve_body_composition'], ARRAY['compound_lifts', 'posterior_chain_work', 'mobility_sessions'], ARRAY['strength_gains', 'body_composition_improvement'], ARRAY['5RM_deadlift', 'body_fat_percentage', 'HRV_improvement'], ARRAY['new_year_strength_challenge', 'strength_testing_day']),
-- (1, 2, 'February', 'Strength continuation and foundation building', ARRAY['maintain_strength_gains', 'build_endurance_base'], ARRAY['strength_maintenance', 'cardio_conditioning', 'recovery_optimization'], ARRAY['strength_consistency', 'endurance_improvement'], ARRAY['strength_consistency', 'cardio_metrics', 'recovery_scores'], ARRAY['strength_consistency_challenge', 'endurance_testing']),
-- (1, 3, 'March', 'Speed mechanics and route timing', ARRAY['develop_speed_mechanics', 'improve_route_timing'], ARRAY['sprint_drills', 'route_practice', 'agility_work'], ARRAY['speed_improvement', 'route_precision'], ARRAY['flying_10m_time', 'route_completion_rate', 'drop_count'], ARRAY['QB_WR_combine_day', 'speed_challenge']),
-- (1, 4, 'April', 'Pre-season conditioning and preparation', ARRAY['build_game_conditioning', 'enhance_team_coordination'], ARRAY['conditioning_drills', 'team_practices', 'small_sided_games'], ARRAY['game_fitness', 'team_coordination'], ARRAY['Yo_Yo_IR1_score', 'team_coordination_metrics'], ARRAY['heat_adaptation_leaderboard', 'team_coordination_day']);

-- Insert sample community activation events
INSERT INTO community_activation_events (event_name, event_description, event_type, event_category, start_date, end_date, target_participants, event_format, prizes_awards, success_criteria) VALUES
('New Year Strength Challenge', 'Annual strength challenge to kick off the off-season training', 'challenge', 'strength', '2025-01-01', '2025-01-31', 1000, 'individual', ARRAY['strength_champion_badge', 'performance_gear', 'coaching_session'], ARRAY['participation_rate_80_percent', 'strength_improvements', 'community_engagement']),
('QB-WR Combine Day', 'Specialized combine testing for quarterbacks and wide receivers', 'competition', 'skill', '2025-03-15', '2025-03-15', 200, 'individual', ARRAY['combine_champion_badge', 'skill_development_prize', 'recognition'], ARRAY['skill_improvement', 'team_chemistry', 'performance_metrics']),
('Heat Adaptation Leaderboard', 'Summer conditioning challenge with heat adaptation focus', 'challenge', 'conditioning', '2025-05-01', '2025-06-30', 1000, 'individual', ARRAY['heat_warrior_badge', 'recovery_gear', 'nutrition_consultation'], ARRAY['hydration_compliance', 'performance_maintenance', 'safety_metrics']),
('Weekly Player of the Week', 'Recognition program for outstanding weekly performance', 'award', 'performance', '2025-07-01', '2025-09-30', 1000, 'individual', ARRAY['player_of_week_badge', 'recognition', 'small_prize'], ARRAY['performance_improvement', 'team_contribution', 'sportsmanship']),
('Sleep Streak Badge Contest', 'Community challenge to improve sleep habits and recovery', 'challenge', 'recovery', '2025-09-01', '2025-10-31', 1000, 'individual', ARRAY['sleep_master_badge', 'recovery_gear', 'wellness_consultation'], ARRAY['sleep_consistency', 'recovery_improvement', 'community_engagement']),
('Best Progress Awards', 'Annual recognition for most improved athletes', 'award', 'performance', '2025-11-01', '2025-12-31', 100, 'individual', ARRAY['most_improved_badge', 'major_prize', 'recognition'], ARRAY['performance_improvement', 'goal_achievement', 'community_contribution']);

-- Create function to calculate timeline progress
CREATE OR REPLACE FUNCTION calculate_timeline_progress(
    timeline_id_param INTEGER
) RETURNS JSONB AS $$
DECLARE
    progress_data JSONB;
    timeline_record RECORD;
    phase_record RECORD;
    total_progress DECIMAL := 0;
    completed_phases INTEGER := 0;
    current_phase_info JSONB;
BEGIN
    -- Get timeline information
    SELECT 
        id,
        timeline_name,
        total_phases,
        current_phase,
        start_date,
        end_date
    INTO timeline_record
    FROM annual_performance_timelines
    WHERE id = timeline_id_param;
    
    -- Calculate overall progress
    SELECT 
        COUNT(*) as completed_count,
        AVG(completion_percentage) as avg_completion
    INTO phase_record
    FROM timeline_phases
    WHERE timeline_id = timeline_id_param
    AND phase_status = 'completed';
    
    completed_phases := phase_record.completed_count;
    total_progress := (completed_phases::DECIMAL / timeline_record.total_phases) * 100;
    
    -- Get current phase information
    SELECT jsonb_build_object(
        'phase_number', phase_number,
        'phase_name', phase_name,
        'completion_percentage', completion_percentage,
        'days_remaining', (end_date - CURRENT_DATE),
        'status', phase_status
    ) INTO current_phase_info
    FROM timeline_phases
    WHERE timeline_id = timeline_id_param
    AND phase_number = timeline_record.current_phase;
    
    -- Build progress data
    progress_data := jsonb_build_object(
        'timeline_id', timeline_id_param,
        'timeline_name', timeline_record.timeline_name,
        'overall_progress_percentage', total_progress,
        'completed_phases', completed_phases,
        'total_phases', timeline_record.total_phases,
        'current_phase', timeline_record.current_phase,
        'current_phase_info', current_phase_info,
        'timeline_duration_days', (timeline_record.end_date - timeline_record.start_date),
        'days_elapsed', (CURRENT_DATE - timeline_record.start_date),
        'estimated_completion_date', CASE 
            WHEN total_progress > 0 THEN CURRENT_DATE + ((100 - total_progress) / total_progress) * (CURRENT_DATE - timeline_record.start_date)
            ELSE timeline_record.end_date
        END,
        'recommendations', ARRAY[
            'Focus on current phase objectives',
            'Review completed phases for lessons learned',
            'Plan ahead for upcoming phases'
        ]
    );
    
    -- Update timeline progress
    UPDATE annual_performance_timelines
    SET 
        current_phase = timeline_record.current_phase,
        overall_progress_percentage = total_progress
    WHERE id = timeline_id_param;
    
    RETURN progress_data;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate accountability report
CREATE OR REPLACE FUNCTION generate_accountability_report(
    user_id_param UUID,
    report_period_start DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    report_period_end DATE DEFAULT CURRENT_DATE
) RETURNS JSONB AS $$
DECLARE
    report_data JSONB;
    check_ins_count INTEGER := 0;
    goals_achieved INTEGER := 0;
    participation_score DECIMAL;
    group_engagement JSONB;
BEGIN
    -- Get check-in statistics
    SELECT 
        COUNT(*) as total_checkins,
        COUNT(CASE WHEN check_in_status = 'completed' THEN 1 END) as completed_checkins,
        AVG(mood_rating) as avg_mood,
        AVG(energy_level) as avg_energy,
        AVG(confidence_level) as avg_confidence
    INTO check_ins_count, goals_achieved, participation_score
    FROM weekly_check_ins
    WHERE user_id = user_id_param
    AND check_in_date BETWEEN report_period_start AND report_period_end;
    
    -- Get group engagement data
    SELECT jsonb_build_object(
        'groups_joined', COUNT(DISTINCT agm.group_id),
        'active_groups', COUNT(DISTINCT CASE WHEN agm.participation_level = 'active' THEN agm.group_id END),
        'attendance_rate', AVG(agm.attendance_percentage),
        'contribution_score', AVG(agm.contribution_score)
    ) INTO group_engagement
    FROM accountability_group_memberships agm
    WHERE agm.user_id = user_id_param;
    
    -- Build report
    report_data := jsonb_build_object(
        'user_id', user_id_param,
        'report_period_start', report_period_start,
        'report_period_end', report_period_end,
        'check_ins_summary', jsonb_build_object(
            'total_checkins', check_ins_count,
            'completed_checkins', goals_achieved,
            'completion_rate', CASE WHEN check_ins_count > 0 THEN (goals_achieved::DECIMAL / check_ins_count) * 100 ELSE 0 END,
            'average_mood', participation_score,
            'average_energy', participation_score,
            'average_confidence', participation_score
        ),
        'group_engagement', group_engagement,
        'overall_participation_score', CASE 
            WHEN check_ins_count > 0 THEN (goals_achieved::DECIMAL / check_ins_count) * 100
            ELSE 0 
        END,
        'recommendations', ARRAY[
            'Maintain consistent check-in schedule',
            'Engage actively in accountability groups',
            'Set realistic weekly goals',
            'Seek support when facing challenges'
        ]
    );
    
    RETURN report_data;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_annual_performance_timelines_updated_at 
    BEFORE UPDATE ON annual_performance_timelines 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_timeline_phases_updated_at 
    BEFORE UPDATE ON timeline_phases 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_focus_areas_updated_at 
    BEFORE UPDATE ON monthly_focus_areas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accountability_groups_updated_at 
    BEFORE UPDATE ON accountability_groups 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accountability_group_memberships_updated_at 
    BEFORE UPDATE ON accountability_group_memberships 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_check_ins_updated_at 
    BEFORE UPDATE ON weekly_check_ins 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_community_activation_events_updated_at 
    BEFORE UPDATE ON community_activation_events 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_participations_updated_at 
    BEFORE UPDATE ON event_participations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_annual_goal_setting_updated_at 
    BEFORE UPDATE ON annual_goal_setting 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quarterly_reviews_updated_at 
    BEFORE UPDATE ON quarterly_reviews 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE annual_performance_timelines IS 'Annual performance planning and timeline management';
COMMENT ON TABLE timeline_phases IS 'Detailed phases within annual performance timelines';
COMMENT ON TABLE monthly_focus_areas IS 'Monthly focus areas and goals for performance optimization';
COMMENT ON TABLE accountability_groups IS 'Accountability groups and mentorship programs';
COMMENT ON TABLE accountability_group_memberships IS 'User memberships in accountability groups';
COMMENT ON TABLE weekly_check_ins IS 'Weekly progress check-ins and goal tracking';
COMMENT ON TABLE community_activation_events IS 'Community events and challenges for engagement';
COMMENT ON TABLE event_participations IS 'User participation in community events';
COMMENT ON TABLE annual_goal_setting IS 'Annual goal setting and progress tracking';
COMMENT ON TABLE quarterly_reviews IS 'Quarterly performance reviews and assessments';
COMMENT ON FUNCTION calculate_timeline_progress IS 'Calculate overall progress for performance timeline';
COMMENT ON FUNCTION generate_accountability_report IS 'Generate comprehensive accountability report for user';
