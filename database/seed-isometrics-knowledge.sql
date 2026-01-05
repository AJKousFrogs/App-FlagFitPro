-- =============================================================================
-- SEED: VALD Practitioner's Guide to Isometrics Knowledge Base
-- Source: VALD Practitioner's Guide to Isometrics (71 pages, 2024)
-- =============================================================================

INSERT INTO research_articles (
    title, authors, publication_year, publisher, primary_category, categories, tags,
    study_type, evidence_level, sport_type, key_findings, practical_applications,
    training_types, recovery_methods,
    is_open_access, verified, quality_score, keywords
) VALUES (
    'VALD Practitioner''s Guide to Isometrics',
    ARRAY['VALD Performance Contributors'],
    2024,
    'VALD Performance',
    'training',
    ARRAY['training', 'assessment', 'strength', 'rehabilitation', 'monitoring'],
    ARRAY['isometric', 'strength_testing', 'force_testing', 'VALD', 'ForceFrame', 'rehabilitation', 'return_to_sport', 'monitoring'],
    'review',
    'B',
    'general',
    'Comprehensive guide on isometric strength testing and training using VALD ForceFrame and force plates. Covers testing protocols, normative data, rehabilitation applications, and monitoring strategies. Isometric testing is reliable, time-efficient, and safe for assessing strength across various muscle groups and injury states.',
    ARRAY[
        'Implement isometric strength testing protocols',
        'Use ForceFrame for objective strength assessment',
        'Monitor bilateral asymmetries and strength deficits',
        'Guide rehabilitation progression with objective criteria',
        'Screen athletes for injury risk',
        'Track strength development over time',
        'Safe testing method for injured athletes'
    ],
    ARRAY['isometric', 'strength', 'assessment', 'rehabilitation'],
    ARRAY['isometric_testing', 'criteria_based_progression', 'return_to_sport_monitoring'],
    false, true, 9,
    ARRAY['isometric', 'strength_testing', 'ForceFrame', 'force_plates', 'assessment', 'monitoring', 'rehabilitation']
);

DO $$
DECLARE
    article_uuid UUID;
BEGIN
    SELECT id INTO article_uuid FROM research_articles WHERE title = 'VALD Practitioner''s Guide to Isometrics';

    -- Knowledge Entry 1: Isometric Testing Protocols
    INSERT INTO knowledge_base_entries (
        entry_type, topic, question, answer, summary, supporting_articles,
        evidence_strength, consensus_level, protocols, applicable_to, sport_specificity,
        best_practices
    ) VALUES (
        'training_method',
        'isometric_testing_protocols',
        'What are the best practices for isometric strength testing?',
        'Isometric strength testing using force plates and ForceFrame provides objective, reliable measurement of maximal strength without joint movement. Testing should include standardized positioning, warm-up protocol, and multiple trials (typically 2-3). Key metrics include peak force, rate of force development (RFD), and bilateral asymmetries. Isometric testing is particularly valuable for injured athletes as it''s safe and doesn''t require movement through painful ranges. Test positions should match functional requirements of the sport.',
        'Isometric testing uses force plates to measure maximal strength objectively, safely, and reliably without joint movement.',
        ARRAY[article_uuid],
        'strong', 'high',
        '{"equipment": ["ForceFrame", "force_plates"], "trials": "2-3_maximal_efforts", "rest_between_trials": "30-60_seconds", "key_metrics": ["peak_force", "RFD", "bilateral_asymmetry"], "duration": "3-5_seconds_maximal_contraction"}'::jsonb,
        ARRAY['all_athletes', 'injured_athletes', 'elite_athletes'],
        'general',
        ARRAY[
            'Standardize test positions across sessions',
            'Include proper warm-up protocol',
            'Use 2-3 maximal trials',
            '30-60 seconds rest between trials',
            'Monitor bilateral asymmetries (<10% ideal)',
            'Track rate of force development (RFD)',
            'Safe for use with injured athletes',
            'Document test position and setup clearly'
        ]
    );

    -- Knowledge Entry 2: Isometric Strength Development
    INSERT INTO knowledge_base_entries (
        entry_type, topic, question, answer, summary, supporting_articles,
        evidence_strength, consensus_level, protocols, applicable_to, sport_specificity,
        best_practices
    ) VALUES (
        'training_method',
        'isometric_strength_development',
        'How should isometric training be programmed for strength development?',
        'Isometric training develops maximal strength, particularly at the trained joint angle. Programming should include position-specific training (angles relevant to sport), progressive overload (increasing duration or resistance), and integration with dynamic training. Isometric exercises are valuable for rehabilitation (pain management, early strength building), injury prevention (addressing weak points), and sport-specific strength development. Typical protocols use 3-5 sets of 3-6 second maximal contractions with 30-60 seconds rest.',
        'Isometric training develops maximal strength at specific joint angles, useful for rehab, injury prevention, and sport-specific development.',
        ARRAY[article_uuid],
        'strong', 'high',
        '{"sets_reps": "3-5_sets_x_3-6_seconds", "rest": "30-60_seconds", "frequency": "2-3_times_per_week", "progression": "increase_duration_or_resistance"}'::jsonb,
        ARRAY['all_athletes', 'injured_athletes'],
        'general',
        ARRAY[
            'Train at sport-specific joint angles',
            'Progressive overload (duration or resistance)',
            'Integrate with dynamic strength training',
            'Useful for pain management in rehab',
            'Address weak points in strength curve',
            'Monitor for excessive fatigue',
            'Maintain proper technique and positioning'
        ]
    );

    -- Knowledge Entry 3: Assessment Interpretation
    INSERT INTO knowledge_base_entries (
        entry_type, topic, question, answer, summary, supporting_articles,
        evidence_strength, consensus_level, protocols, applicable_to, sport_specificity,
        best_practices
    ) VALUES (
        'training_method',
        'isometric_assessment_interpretation',
        'How should isometric test results be interpreted and used?',
        'Isometric test interpretation focuses on peak force values, bilateral asymmetries, and rate of force development. Compare to normative data for sport and position, track longitudinal changes, and identify deficits. Asymmetries >10-15% warrant attention and corrective work. Low RFD may indicate neuromuscular deficits. Use results to guide training focus, monitor rehabilitation progress, and establish return-to-sport criteria. Peak force values should be normalized to body mass for comparison.',
        'Interpret isometric results through peak force, asymmetries, and RFD; use to guide training and monitor rehabilitation.',
        ARRAY[article_uuid],
        'strong', 'high',
        '{"asymmetry_thresholds": "<10%_ideal_<15%_acceptable", "normalization": "force_per_body_mass_kg", "comparison": "sport_position_specific_norms"}'::jsonb,
        ARRAY['all_athletes', 'coaches', 'therapists'],
        'general',
        ARRAY[
            'Monitor bilateral asymmetries (<10% ideal)',
            'Compare to sport/position-specific norms',
            'Track longitudinal changes over time',
            'Normalize force to body mass',
            'Assess rate of force development (RFD)',
            'Use results to guide training priorities',
            'Establish return-to-sport criteria',
            'Identify individual strengths and weaknesses'
        ]
    );

    -- Knowledge Entry 4: Rehabilitation Applications
    INSERT INTO knowledge_base_entries (
        entry_type, topic, question, answer, summary, supporting_articles,
        evidence_strength, consensus_level, protocols, applicable_to, sport_specificity,
        best_practices
    ) VALUES (
        'recovery_method',
        'isometric_testing_rehabilitation',
        'How should isometric testing be used in rehabilitation?',
        'Isometric testing is ideal for rehabilitation as it''s safe, doesn''t require movement through range, and provides objective progression criteria. Use early in rehab to establish baselines when dynamic testing isn''t appropriate. Monitor strength recovery throughout rehabilitation phases. Criteria for progression often include achieving specific force thresholds (e.g., >80% of uninjured side) and reducing asymmetries to <10%. Isometric testing helps determine readiness for more dynamic activities and eventual return to sport.',
        'Isometric testing in rehab is safe, objective, and guides progression through phases based on strength criteria.',
        ARRAY[article_uuid],
        'strong', 'high',
        '{"baseline_testing": "early_rehab_when_dynamic_testing_unsafe", "monitoring_frequency": "weekly_or_biweekly", "progression_criteria": ">80%_of_uninjured_side", "asymmetry_target": "<10%_before_return_to_sport"}'::jsonb,
        ARRAY['injured_athletes', 'post_surgery', 'rehabilitation'],
        'general',
        ARRAY[
            'Use isometric testing when dynamic testing not safe',
            'Establish baseline strength early in rehab',
            'Monitor strength recovery weekly/biweekly',
            'Progress based on objective criteria (not time)',
            'Target >80% strength of uninjured side',
            'Reduce asymmetries to <10% before return',
            'Track both peak force and RFD',
            'Use results to guide activity progression'
        ]
    );

    -- Knowledge Entry 5: Screening & Monitoring
    INSERT INTO knowledge_base_entries (
        entry_type, topic, question, answer, summary, supporting_articles,
        evidence_strength, consensus_level, protocols, applicable_to, sport_specificity,
        best_practices
    ) VALUES (
        'training_method',
        'isometric_screening_monitoring',
        'How can isometric testing be used for screening and ongoing monitoring?',
        'Isometric testing provides efficient, objective screening for injury risk and performance monitoring. Pre-season screening identifies bilateral asymmetries, strength deficits, and injury risk factors. In-season monitoring tracks fatigue, detects strength loss, and identifies early signs of overtraining or injury risk. Testing is quick (5-10 minutes per athlete) and doesn''t create significant fatigue, making it ideal for regular monitoring. Establish baseline values and track changes longitudinally.',
        'Isometric testing enables efficient pre-season screening and in-season monitoring without causing fatigue.',
        ARRAY[article_uuid],
        'strong', 'high',
        '{"preseason_screening": "comprehensive_baseline_all_athletes", "inseason_frequency": "monthly_or_after_high_load_periods", "time_per_athlete": "5-10_minutes", "monitoring_metrics": ["peak_force", "asymmetry", "RFD"]}'::jsonb,
        ARRAY['all_athletes', 'team_sports', 'elite_athletes'],
        'general',
        ARRAY[
            'Conduct comprehensive pre-season screening',
            'Establish individual baseline values',
            'Monitor monthly or after high-load periods',
            'Track bilateral asymmetries over time',
            'Identify athletes with >10% asymmetry',
            'Quick testing doesn''t create fatigue',
            'Use for return-to-play monitoring',
            'Combine with other monitoring tools (wellness, ACWR)'
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
    'isometric_testing_protocols',
    'isometric_strength_development',
    'isometric_assessment_interpretation',
    'isometric_testing_rehabilitation',
    'isometric_screening_monitoring'
);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Successfully seeded VALD Isometrics Guide knowledge base';
    RAISE NOTICE '  - 1 research article';
    RAISE NOTICE '  - 5 knowledge base entries';
    RAISE NOTICE '  - Search indexes created';
END $$;
