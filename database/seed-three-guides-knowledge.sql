-- =============================================================================
-- SEED: Three VALD Performance Guides Knowledge Base
-- Sources: Speed Testing, Preseason 2025, Hamstrings
-- =============================================================================

-- ============================================================================
-- 1. SPEED TESTING GUIDE
-- ============================================================================

INSERT INTO research_articles (
    title, authors, publication_year, publisher, primary_category, categories, tags,
    study_type, evidence_level, sport_type, key_findings, practical_applications,
    training_types, is_open_access, verified, quality_score, keywords
) VALUES (
    'Practitioner''s Guide to Speed Testing',
    ARRAY['VALD Performance Contributors'],
    2024,
    'VALD Performance',
    'training',
    ARRAY['assessment', 'training', 'performance', 'monitoring'],
    ARRAY['speed', 'testing', 'sprinting', 'timing_gates', 'acceleration', 'max_velocity', 'force_plates', '40_yard_dash'],
    'review',
    'B',
    'field_sports',
    'Comprehensive guide on speed testing protocols using timing gates and force plates. Covers standardized testing distances (10m, 20m, 30m, 40-yard), split time analysis, acceleration profiling, and data interpretation for training program design.',
    ARRAY[
        'Implement standardized speed testing protocols',
        'Use timing gates for objective sprint measurement',
        'Analyze split times for acceleration profiling',
        'Compare results to sport-specific normative data',
        'Inform training programming from test results',
        'Monitor speed development longitudinally',
        'Assess both acceleration and max velocity capabilities'
    ],
    ARRAY['speed', 'acceleration', 'sprinting', 'assessment'],
    false, true, 9,
    ARRAY['speed_testing', 'sprinting', 'timing_gates', 'acceleration', 'assessment', '40yd_dash']
);

-- ============================================================================
-- 2. PRESEASON GUIDE
-- ============================================================================

INSERT INTO research_articles (
    title, authors, publication_year, publisher, primary_category, categories, tags,
    study_type, evidence_level, sport_type, key_findings, practical_applications,
    training_types, is_open_access, verified, quality_score, keywords
) VALUES (
    'Practitioner''s Guide to Preseason - 2025 Edition',
    ARRAY['VALD Performance Contributors'],
    2025,
    'VALD Performance',
    'training',
    ARRAY['training', 'periodization', 'load_management', 'assessment', 'team_sports'],
    ARRAY['preseason', 'periodization', 'training_planning', 'load_management', 'testing', 'team_sports', 'ACWR'],
    'review',
    'B',
    'team_sports',
    'Comprehensive preseason planning guide covering periodization principles, progressive loading strategies, baseline testing protocols, and athlete readiness monitoring. Emphasizes balancing fitness development with skill work while managing injury risk through appropriate load progression.',
    ARRAY[
        'Structure preseason using periodization principles',
        'Implement comprehensive baseline testing battery',
        'Manage training loads with ACWR monitoring',
        'Progress loads appropriately (10% rule)',
        'Monitor athlete readiness and wellness',
        'Balance physical and technical development',
        'Prepare athletes systematically for competition'
    ],
    ARRAY['periodization', 'strength', 'conditioning', 'load_management'],
    false, true, 9,
    ARRAY['preseason', 'periodization', 'training_planning', 'load_management', 'testing', 'ACWR']
);

-- ============================================================================
-- 3. HAMSTRINGS GUIDE
-- ============================================================================

INSERT INTO research_articles (
    title, authors, publication_year, publisher, primary_category, categories, tags,
    study_type, evidence_level, sport_type, key_findings, practical_applications,
    injury_types, training_types, recovery_methods,
    is_open_access, verified, quality_score, keywords
) VALUES (
    'Practitioner''s Guide to Hamstrings',
    ARRAY['VALD Performance Contributors'],
    2024,
    'VALD Performance',
    'injury',
    ARRAY['injury_prevention', 'rehabilitation', 'assessment', 'training', 'strength'],
    ARRAY['hamstring', 'injury_prevention', 'nordic_curl', 'eccentric_training', 'rehabilitation', 'strength_testing', 'biceps_femoris'],
    'review',
    'A',
    'running_sports',
    'Evidence-based hamstring injury prevention and rehabilitation guide. Nordic curl programs reduce injury risk by 50-70%. Emphasizes eccentric strength development, bilateral symmetry monitoring, and criteria-based return to sport. Previous injury is the strongest risk factor for reinjury.',
    ARRAY[
        'Implement Nordic curl programs (2-3x per week)',
        'Assess eccentric hamstring strength regularly',
        'Use criteria-based rehabilitation progression',
        'Monitor bilateral asymmetries (<10%)',
        'Implement progressive running programs post-injury',
        'Continue prevention programs long-term',
        'Address previous injury history proactively'
    ],
    ARRAY['hamstring_strain', 'biceps_femoris_strain', 'proximal_hamstring_injury'],
    ARRAY['eccentric', 'strength', 'prevention', 'nordic_curl'],
    ARRAY['nordic_curls', 'eccentric_training', 'progressive_loading', 'criteria_based_return'],
    false, true, 10,
    ARRAY['hamstring', 'nordic_curl', 'injury_prevention', 'eccentric_training', 'rehabilitation', 'biceps_femoris']
);

-- Get article IDs for reference
DO $$
DECLARE
    speed_uuid UUID;
    preseason_uuid UUID;
    hamstrings_uuid UUID;
BEGIN
    SELECT id INTO speed_uuid FROM research_articles WHERE title = 'Practitioner''s Guide to Speed Testing';
    SELECT id INTO preseason_uuid FROM research_articles WHERE title = 'Practitioner''s Guide to Preseason - 2025 Edition';
    SELECT id INTO hamstrings_uuid FROM research_articles WHERE title = 'Practitioner''s Guide to Hamstrings';

    -- =======================================================================
    -- SPEED TESTING KNOWLEDGE ENTRIES (3)
    -- =======================================================================

    INSERT INTO knowledge_base_entries (
        entry_type, topic, question, answer, summary, supporting_articles,
        evidence_strength, consensus_level, protocols, applicable_to, sport_specificity,
        best_practices
    ) VALUES (
        'training_method',
        'speed_testing_protocols',
        'What are the best practices for speed testing in athletes?',
        'Speed testing using timing gates provides objective measurement of acceleration and maximum velocity capabilities. Standard protocols include 10m, 20m, 30m splits and 40-yard dash for field sports. Testing requires environmental control, standardized warm-up, multiple trials for reliability, and consideration of starting technique. Force plates can add additional insights into force production during acceleration.',
        'Speed testing protocols use timing gates at standardized distances to objectively measure acceleration and max velocity in athletes.',
        ARRAY[speed_uuid],
        'strong', 'high',
        '{"standard_distances": ["10m", "20m", "30m", "40yd"], "equipment": ["timing_gates", "force_plates"], "trials": "minimum_2_maximum_3", "rest_between_trials": "3-5_minutes"}'::jsonb,
        ARRAY['elite_athletes', 'field_sport_athletes', 'running_athletes'],
        'field_sports',
        ARRAY[
            'Use timing gates for objective measurement',
            'Standardize warm-up protocols across testing sessions',
            'Test multiple distances (10m, 20m, 30m, 40yd)',
            'Control environmental conditions (wind, surface)',
            'Use multiple trials (2-3) for reliability',
            'Track split times for acceleration analysis',
            'Allow adequate rest between trials (3-5 min)'
        ]
    );

    INSERT INTO knowledge_base_entries (
        entry_type, topic, question, answer, summary, supporting_articles,
        evidence_strength, consensus_level, applicable_to, sport_specificity,
        best_practices
    ) VALUES (
        'training_method',
        'speed_development_training',
        'How should speed development be programmed for athletes?',
        'Speed development requires integration of technical sprint mechanics, power development, and specific sprint training. Programming should differentiate between acceleration work (0-20m) and max velocity training (30m+). Include mechanics coaching, resisted/assisted sprints, and plyometric work. Periodize based on season phase with higher volumes in off-season and maintenance during competition.',
        'Speed development combines technical mechanics, power training, and specific sprint work periodized throughout the training year.',
        ARRAY[speed_uuid],
        'strong', 'high',
        ARRAY['all_athletes', 'field_sport_athletes'],
        'general',
        ARRAY[
            'Include technical sprint mechanics coaching',
            'Develop both acceleration and max velocity separately',
            'Periodize training volume by season phase',
            'Monitor training load and ensure adequate recovery',
            'Individualize based on athlete testing results',
            'Progress from technical work to speed endurance'
        ]
    );

    INSERT INTO knowledge_base_entries (
        entry_type, topic, question, answer, summary, supporting_articles,
        evidence_strength, consensus_level, applicable_to, sport_specificity,
        best_practices
    ) VALUES (
        'training_method',
        'speed_data_interpretation',
        'How should speed test results be interpreted and applied?',
        'Speed test interpretation involves analyzing split times to create acceleration profiles, comparing to normative data, and identifying individual characteristics. Acceleration is assessed through 0-10m and 10-20m splits, while max velocity through later splits. Asymmetries or weaknesses guide training focus. Track longitudinal changes to assess program effectiveness.',
        'Speed data interpretation uses split time analysis, normative comparisons, and longitudinal tracking to inform individualized training.',
        ARRAY[speed_uuid],
        'strong', 'high',
        ARRAY['elite_athletes', 'amateur_athletes'],
        'field_sports',
        ARRAY[
            'Analyze split times for acceleration profile',
            'Compare to position and sport-specific norms',
            'Track longitudinal changes over time',
            'Identify individual acceleration vs max velocity strengths',
            'Use results to guide training emphasis',
            'Consider contextual factors (fatigue, conditions)'
        ]
    );

    -- =======================================================================
    -- PRESEASON KNOWLEDGE ENTRIES (3)
    -- =======================================================================

    INSERT INTO knowledge_base_entries (
        entry_type, topic, question, answer, summary, supporting_articles,
        evidence_strength, consensus_level, protocols, applicable_to, sport_specificity,
        best_practices
    ) VALUES (
        'training_method',
        'preseason_periodization',
        'How should preseason training be structured and periodized?',
        'Preseason training follows periodization principles with distinct phases: general preparation (building base fitness), specific preparation (sport-specific development), and competition preparation (tapering and sharpening). Volume starts high and decreases while intensity progressively increases. Include strength, power, speed, and conditioning work integrated with technical-tactical training.',
        'Preseason periodization progressively builds from general preparation through specific preparation to competition readiness.',
        ARRAY[preseason_uuid],
        'strong', 'high',
        '{"phases": ["general_preparation", "specific_preparation", "competition_preparation"], "duration": "6-12_weeks_typical", "volume_progression": "high_to_moderate", "intensity_progression": "moderate_to_high"}'::jsonb,
        ARRAY['team_sport_athletes', 'field_sport_athletes'],
        'team_sports',
        ARRAY[
            'Follow periodization principles (volume then intensity)',
            'Include distinct training phases',
            'Progressive load increases',
            'Balance physical and skill development',
            'Individualize based on athlete readiness',
            'Plan recovery and regeneration weeks'
        ]
    );

    INSERT INTO knowledge_base_entries (
        entry_type, topic, question, answer, summary, supporting_articles,
        evidence_strength, consensus_level, protocols, applicable_to, sport_specificity,
        best_practices
    ) VALUES (
        'training_method',
        'preseason_testing_assessment',
        'What testing should be conducted during preseason?',
        'Preseason testing establishes baselines for strength (force plates, isometric testing), power (jumps, throws), speed (sprint times), and aerobic capacity. Include injury risk screening (movement quality, asymmetries). Testing identifies individual strengths, weaknesses, and training priorities. Repeat key tests mid-season to track adaptation.',
        'Comprehensive preseason testing establishes baselines and identifies individual training needs across multiple physical qualities.',
        ARRAY[preseason_uuid],
        'strong', 'high',
        '{"test_battery": ["strength", "power", "speed", "aerobic_capacity", "movement_screening"], "timing": "early_preseason_for_baseline", "retest": "mid_season_and_postseason"}'::jsonb,
        ARRAY['team_sport_athletes', 'elite_athletes'],
        'team_sports',
        ARRAY[
            'Conduct comprehensive baseline testing early',
            'Use sport-specific assessments',
            'Test strength, power, speed, and endurance',
            'Include injury risk screening',
            'Establish individual training priorities from results',
            'Track longitudinal changes'
        ]
    );

    INSERT INTO knowledge_base_entries (
        entry_type, topic, question, answer, summary, supporting_articles,
        evidence_strength, consensus_level, protocols, applicable_to, sport_specificity,
        best_practices
    ) VALUES (
        'training_method',
        'preseason_load_management',
        'How should training load be managed during preseason?',
        'Preseason load management requires monitoring acute:chronic workload ratios (ACWR), staying in the 0.8-1.3 range. Progress loads by no more than 10% per week. Monitor session RPE, wellness markers, and readiness scores. Include planned deload weeks. Individualize based on training age and injury history. Avoid load spikes that increase injury risk.',
        'Preseason load management uses ACWR monitoring and progressive loading (10% rule) to build capacity while managing injury risk.',
        ARRAY[preseason_uuid],
        'strong', 'high',
        '{"acwr_target_range": "0.8-1.3", "weekly_load_increase": "max_10_percent", "monitoring_tools": ["session_RPE", "wellness", "readiness"]}'::jsonb,
        ARRAY['team_sport_athletes', 'elite_athletes'],
        'team_sports',
        ARRAY[
            'Monitor acute:chronic workload ratios (0.8-1.3)',
            'Progress loads by maximum 10% per week',
            'Track session RPE and wellness markers',
            'Include planned deload/recovery weeks',
            'Individualize based on athlete training history',
            'Avoid load spikes (ACWR >1.5)',
            'Balance team and individual training needs'
        ]
    );

    -- =======================================================================
    -- HAMSTRINGS KNOWLEDGE ENTRIES (5)
    -- =======================================================================

    INSERT INTO knowledge_base_entries (
        entry_type, topic, question, answer, summary, supporting_articles,
        evidence_strength, consensus_level, applicable_to, sport_specificity,
        contraindications, safety_warnings
    ) VALUES (
        'injury',
        'hamstring_injuries_pathologies',
        'What are common hamstring injuries in athletes and their risk factors?',
        'Hamstring strains are among the most common injuries in sprinting and field sports, with the biceps femoris long head most frequently affected. Injuries typically occur during high-speed running in the terminal swing phase. Risk factors include previous hamstring injury (strongest predictor), age, inadequate eccentric strength, bilateral asymmetries >15%, fatigue, and insufficient warm-up. Reinjury rates range from 12-30%.',
        'Hamstring strains commonly affect the biceps femoris during high-speed running. Previous injury is the strongest risk factor.',
        ARRAY[hamstrings_uuid],
        'strong', 'high',
        ARRAY['running_athletes', 'field_sport_athletes', 'sprinters'],
        'running_sports',
        ARRAY[
            'Avoid high-speed running during acute phase',
            'Do not stretch aggressively early in rehabilitation',
            'Avoid premature return to sport before criteria met',
            'Do not ignore persistent pain or tightness'
        ],
        ARRAY[
            'Hamstring reinjury rates are high (12-30%)',
            'Previous injury is the strongest risk factor',
            'Inadequate rehabilitation significantly increases recurrence',
            'Bilateral deficits >15% indicate elevated risk',
            'Premature return to sport leads to reinjury'
        ]
    );

    INSERT INTO knowledge_base_entries (
        entry_type, topic, question, answer, summary, supporting_articles,
        evidence_strength, consensus_level, protocols, applicable_to, sport_specificity,
        best_practices
    ) VALUES (
        'training_method',
        'hamstring_strength_assessment',
        'How should hamstring strength be assessed in athletes?',
        'Hamstring strength assessment prioritizes eccentric strength measurement using Nordic curl testing, isokinetic dynamometry at various speeds, and isometric testing. Key metrics include peak eccentric force, bilateral asymmetry (<10% ideal), and hamstring:quadriceps ratios (eccentric H:Q >0.8 ideal, conventional H:Q >0.6). Regular testing (preseason and monthly during season) identifies at-risk athletes before injury occurs.',
        'Hamstring assessment emphasizes eccentric strength via Nordic curls and isokinetics, monitoring asymmetries and H:Q ratios.',
        ARRAY[hamstrings_uuid],
        'strong', 'high',
        '{"primary_tests": ["nordic_curl", "isokinetic_eccentric", "isometric_hamstring"], "key_metrics": ["peak_eccentric_force", "bilateral_asymmetry", "hamstring_quadriceps_ratio"], "asymmetry_threshold": "<10%_ideal_<15%_acceptable", "hq_ratio_targets": "eccentric_>0.8_conventional_>0.6", "frequency": "preseason_baseline_monthly_monitoring"}'::jsonb,
        ARRAY['all_athletes', 'running_athletes', 'field_sport_athletes'],
        'running_sports',
        ARRAY[
            'Prioritize eccentric strength testing',
            'Monitor bilateral asymmetries (<10% ideal)',
            'Track hamstring:quadriceps ratios (eccentric H:Q >0.8)',
            'Use Nordic curl for field-based assessment',
            'Isokinetic testing for comprehensive profiling',
            'Regular monitoring throughout season',
            'Test previously injured athletes more frequently'
        ]
    );

    INSERT INTO knowledge_base_entries (
        entry_type, topic, question, answer, summary, supporting_articles,
        evidence_strength, consensus_level, protocols, applicable_to, sport_specificity,
        best_practices
    ) VALUES (
        'recovery_method',
        'hamstring_rehabilitation',
        'What are evidence-based hamstring rehabilitation strategies?',
        'Hamstring rehabilitation follows progressive phases: acute management (POLICE protocol), early mobility and isometric strength, progressive eccentric strengthening (Nordic curls central), running progression (jog to sprint), and return to sport testing. Duration ranges 3-12+ weeks depending on severity. Criteria-based progression (not time-based) prevents reinjury. Key criteria include >90% strength symmetry, pain-free high-speed running, and sport-specific testing.',
        'Hamstring rehab progresses through phases emphasizing eccentric strength (Nordic curls), with criteria-based return to sport.',
        ARRAY[hamstrings_uuid],
        'strong', 'high',
        '{"phases": ["acute_management_POLICE", "early_mobility_isometric_strength", "progressive_eccentric_strengthening", "running_progression_jog_to_sprint", "return_to_sport_testing"], "key_exercise": "nordic_curls_progressive_overload", "typical_duration": "3-12_weeks_severity_dependent", "return_criteria": [">90%_bilateral_strength_symmetry", "pain_free_high_speed_running", "sport_specific_testing_passed"]}'::jsonb,
        ARRAY['injured_athletes', 'running_athletes'],
        'running_sports',
        ARRAY[
            'Use POLICE protocol acutely (not RICE)',
            'Progress based on criteria, not time',
            'Emphasize eccentric strengthening (Nordic curls)',
            'Implement progressive running program (structured)',
            'Achieve >90% bilateral strength symmetry',
            'Ensure pain-free high-speed running before return',
            'Continue Nordic curls post-return (prevention)',
            'Address biomechanical factors and load management'
        ]
    );

    INSERT INTO knowledge_base_entries (
        entry_type, topic, question, answer, summary, supporting_articles,
        evidence_strength, consensus_level, protocols, applicable_to, sport_specificity,
        best_practices
    ) VALUES (
        'training_method',
        'hamstring_injury_prevention',
        'What are evidence-based hamstring injury prevention strategies?',
        'Nordic curl programs are the cornerstone of hamstring injury prevention, reducing injury risk by 50-70% when performed 2-3x weekly. Combine with proper warm-up protocols, sprint mechanics training, progressive load management, and regular strength monitoring. Address bilateral asymmetries >10% immediately. Previously injured athletes require ongoing prevention programs indefinitely. Prevention is more effective and cost-efficient than treating injuries.',
        'Nordic curl programs (2-3x/week) reduce hamstring injury risk by 50-70%. Combine with warm-up, mechanics, and load management.',
        ARRAY[hamstrings_uuid],
        'strong', 'high',
        '{"nordic_curl_frequency": "2-3_times_per_week", "sets_reps": "progress_from_1x5_to_3x12", "injury_risk_reduction": "50-70_percent", "key_components": ["nordic_curl_program", "proper_warm_up", "sprint_mechanics_training", "load_management"]}'::jsonb,
        ARRAY['all_athletes', 'running_athletes', 'field_sport_athletes'],
        'running_sports',
        ARRAY[
            'Implement Nordic curl programs year-round (2-3x/week)',
            'Proper progressive warm-up before high-speed running',
            'Sprint mechanics and running technique coaching',
            'Progressive load management (avoid spikes)',
            'Monitor and address bilateral asymmetries >10%',
            'Ongoing prevention for previously injured athletes',
            'Regular eccentric strength testing',
            'Combine multiple prevention strategies (not just one)'
        ]
    );

    INSERT INTO knowledge_base_entries (
        entry_type, topic, question, answer, summary, supporting_articles,
        evidence_strength, consensus_level, protocols, applicable_to, sport_specificity,
        best_practices
    ) VALUES (
        'training_method',
        'nordic_curl_programming',
        'How should Nordic curl programs be implemented and progressed?',
        'Nordic curls should be introduced gradually with eccentric-focused progressions. Start with assisted variations (band assistance, partner catch) and progress to bodyweight and then eccentric overload. Frequency of 2-3x per week is optimal. Progress from 1 set of 5 reps to 3 sets of 12 reps over 6-8 weeks. Can be performed as part of warm-up or in strength sessions. Maintain year-round for injury prevention.',
        'Nordic curls progress from assisted to bodyweight to overload variations, performed 2-3x weekly year-round for prevention.',
        ARRAY[hamstrings_uuid],
        'strong', 'high',
        '{"frequency": "2-3_times_per_week", "progression": ["assisted_band_or_partner", "bodyweight_full_range", "eccentric_overload_variations"], "sets_reps_progression": "1x5_to_3x12_over_6-8_weeks", "timing": "warm_up_or_strength_session", "duration": "year_round_ongoing"}'::jsonb,
        ARRAY['all_athletes', 'running_athletes'],
        'general',
        ARRAY[
            'Start with assisted variations for beginners',
            'Progress gradually over 6-8 weeks',
            'Maintain 2-3x per week frequency',
            'Focus on controlled eccentric lowering',
            'Use full range of motion',
            'Continue year-round (not just preseason)',
            'Can integrate into team warm-ups',
            'Monitor for excessive soreness (reduce if needed)'
        ]
    );

END $$;

-- Create search indexes
INSERT INTO knowledge_search_index (entry_id, searchable_text, search_vector)
SELECT
    id,
    topic || ' ' || COALESCE(question, '') || ' ' || COALESCE(answer, '') || ' ' || COALESCE(summary, ''),
    to_tsvector('english', topic || ' ' || COALESCE(question, '') || ' ' || COALESCE(answer, '') || ' ' || COALESCE(summary, ''))
FROM knowledge_base_entries
WHERE topic IN (
    'speed_testing_protocols', 'speed_development_training', 'speed_data_interpretation',
    'preseason_periodization', 'preseason_testing_assessment', 'preseason_load_management',
    'hamstring_injuries_pathologies', 'hamstring_strength_assessment', 'hamstring_rehabilitation',
    'hamstring_injury_prevention', 'nordic_curl_programming'
);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Successfully seeded three VALD Performance guides knowledge base';
    RAISE NOTICE '  - Speed Testing: 1 article, 3 knowledge entries';
    RAISE NOTICE '  - Preseason 2025: 1 article, 3 knowledge entries';
    RAISE NOTICE '  - Hamstrings: 1 article, 5 knowledge entries';
    RAISE NOTICE '  - Total: 3 articles, 11 knowledge entries';
    RAISE NOTICE '  - Search indexes created';
END $$;
