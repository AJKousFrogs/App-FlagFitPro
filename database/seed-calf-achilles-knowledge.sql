-- =============================================================================
-- SEED: Practitioners Guide to the Calf and Achilles Complex Knowledge Base
-- Source: Practitioners Guide to the Calf and Achilles Complex (VALD Performance, 2024)
-- =============================================================================

-- Insert Research Article
INSERT INTO research_articles (
    title,
    authors,
    publication_year,
    publisher,
    primary_category,
    categories,
    tags,
    study_type,
    evidence_level,
    sport_type,
    key_findings,
    practical_applications,
    injury_types,
    training_types,
    recovery_methods,
    is_open_access,
    verified,
    quality_score,
    keywords
) VALUES (
    'Practitioner''s Guide to the Calf and Achilles Complex',
    ARRAY['Sue Mayes', 'VALD Performance Contributors'],
    2024,
    'VALD Performance',
    'injury',
    ARRAY['injury_prevention', 'training', 'recovery', 'assessment', 'biomechanics'],
    ARRAY['calf', 'achilles', 'assessment', 'rehabilitation', 'strength_testing', 'isometric_testing', 'tendinopathy', 'injury_prevention', 'VALD', 'force_testing', 'plantar_flexion', 'gastrocnemius', 'soleus'],
    'review',
    'B',
    'general',
    'Comprehensive guide covering calf and Achilles anatomy, common injuries (tendinopathy, strains), assessment methods using isometric testing and force plates, and evidence-based rehabilitation strategies. Emphasizes objective measurement, load management, and progressive return to sport protocols.',
    ARRAY[
        'Use isometric testing (ForceFrame) for objective calf assessment',
        'Implement standardized plantar flexion testing protocols',
        'Monitor force production and asymmetries',
        'Apply evidence-based tendinopathy rehabilitation',
        'Use progressive loading for Achilles recovery',
        'Track muscle strength through rehabilitation phases',
        'Identify risk factors for calf and Achilles injuries'
    ],
    ARRAY['achilles_tendinopathy', 'calf_strain', 'achilles_rupture', 'plantaris_injury'],
    ARRAY['strength', 'isometric', 'eccentric', 'plyometric'],
    ARRAY['rehabilitation', 'load_management', 'progressive_loading', 'return_to_sport_protocols'],
    false,
    true,
    9,
    ARRAY['calf', 'achilles', 'tendinopathy', 'assessment', 'injury_prevention', 'rehabilitation', 'isometric_testing', 'force_testing', 'VALD', 'plantar_flexion', 'eccentric_training']
);

-- Get the article ID for reference
DO $$
DECLARE
    article_uuid UUID;
BEGIN
    SELECT id INTO article_uuid FROM research_articles WHERE title = 'Practitioner''s Guide to the Calf and Achilles Complex';

    -- Knowledge Base Entry 1: Calf & Achilles Anatomy
    INSERT INTO knowledge_base_entries (
        entry_type,
        topic,
        question,
        answer,
        summary,
        supporting_articles,
        evidence_strength,
        consensus_level,
        applicable_to,
        sport_specificity,
        best_practices
    ) VALUES (
        'training_method',
        'calf_achilles_anatomy_biomechanics',
        'What is the anatomy and biomechanics of the calf and Achilles complex?',
        'The calf complex consists of the gastrocnemius (two heads) and soleus muscles, which combine to form the Achilles tendon. This is the strongest tendon in the body, transmitting forces during running, jumping, and change of direction. The gastrocnemius crosses both the knee and ankle joints, while the soleus only crosses the ankle. Understanding this anatomy is crucial for assessment and rehabilitation, as each muscle can be tested independently by varying knee position.',
        'The calf complex includes gastrocnemius and soleus muscles forming the Achilles tendon - the body''s strongest tendon. Critical for running, jumping, and explosive movements in athletes.',
        ARRAY[article_uuid],
        'strong',
        'high',
        ARRAY['elite_athletes', 'amateur_athletes', 'general_population', 'running_athletes', 'jumping_athletes'],
        'general',
        ARRAY[
            'Understand gastrocnemius and soleus function differences',
            'Recognize Achilles as primary force transmitter',
            'Assess both muscles independently for imbalances'
        ]
    );

    -- Knowledge Base Entry 2: Assessment Protocols
    INSERT INTO knowledge_base_entries (
        entry_type,
        topic,
        question,
        answer,
        summary,
        supporting_articles,
        evidence_strength,
        consensus_level,
        protocols,
        applicable_to,
        sport_specificity,
        best_practices
    ) VALUES (
        'training_method',
        'calf_achilles_assessment_protocols',
        'What are the best practices for calf and Achilles assessment?',
        'Modern calf and Achilles assessment utilizes isometric testing using force plates and specialized equipment like VALD ForceFrame. Testing includes knee-straight (gastrocnemius dominant) and knee-bent (soleus dominant) positions to assess each muscle group independently. Objective metrics include peak force, rate of force development, and bilateral asymmetries. Regular monitoring helps identify deficits before injury occurs and tracks rehabilitation progress. Asymmetries greater than 10-15% indicate increased injury risk.',
        'Isometric testing using force plates (ForceFrame) in knee-straight and knee-bent positions objectively measures calf strength, asymmetries, and tracks rehabilitation progress.',
        ARRAY[article_uuid],
        'strong',
        'high',
        '{"equipment": ["ForceFrame", "ForceDecks"], "test_positions": ["knee_straight_gastrocnemius", "knee_bent_soleus"], "metrics": ["peak_force", "rate_of_force_development", "bilateral_asymmetry"], "frequency": "weekly_during_rehab_monthly_for_monitoring"}'::jsonb,
        ARRAY['elite_athletes', 'running_athletes', 'jumping_athletes', 'injured_athletes'],
        'general',
        ARRAY[
            'Test both knee-straight and knee-bent positions',
            'Use objective force measurement technology',
            'Monitor bilateral asymmetries (<10% ideal)',
            'Track rate of force development',
            'Regular monitoring for injury prevention',
            'Compare to normative data for sport'
        ]
    );

    -- Knowledge Base Entry 3: Common Injuries
    INSERT INTO knowledge_base_entries (
        entry_type,
        topic,
        question,
        answer,
        summary,
        supporting_articles,
        evidence_strength,
        consensus_level,
        applicable_to,
        sport_specificity,
        contraindications,
        safety_warnings
    ) VALUES (
        'injury',
        'calf_achilles_injuries_pathologies',
        'What are common calf and Achilles injuries in athletes?',
        'Common injuries include Achilles tendinopathy (overuse and tendon degeneration), calf strains (acute muscle tears, often in the medial gastrocnemius), Achilles ruptures (complete tendon failure), and plantaris injuries. Achilles tendinopathy is highly prevalent in running and jumping athletes due to repetitive loading. Calf strains typically occur during acceleration, sprinting, or push-off movements. Risk factors include rapid training load increases, previous injury history, reduced calf strength and endurance, biomechanical issues, and inadequate recovery.',
        'Common injuries: Achilles tendinopathy (overuse), calf strains (acute tears), Achilles ruptures, and plantaris injuries. Prevalent in running and jumping sports.',
        ARRAY[article_uuid],
        'strong',
        'high',
        ARRAY['running_athletes', 'jumping_athletes', 'court_sport_athletes', 'field_sport_athletes'],
        'running_jumping_sports',
        ARRAY[
            'Avoid high-impact activities during acute tendinopathy',
            'Do not ignore persistent Achilles pain',
            'Avoid rapid increases in training load'
        ],
        ARRAY[
            'Achilles rupture risk increases with tendinopathy history',
            'Calf strains often recur without proper rehabilitation',
            'Bilateral deficits indicate systemic risk',
            'Sudden increase in load is primary risk factor'
        ]
    );

    -- Knowledge Base Entry 4: Rehabilitation
    INSERT INTO knowledge_base_entries (
        entry_type,
        topic,
        question,
        answer,
        summary,
        supporting_articles,
        evidence_strength,
        consensus_level,
        protocols,
        applicable_to,
        sport_specificity,
        best_practices
    ) VALUES (
        'recovery_method',
        'calf_achilles_rehabilitation',
        'What are evidence-based rehabilitation strategies for calf and Achilles injuries?',
        'Effective rehabilitation follows progressive loading principles: isometric exercises initially for pain management, then heavy slow resistance training (HSR) to build tendon capacity, followed by eccentric exercises (especially critical for Achilles tendinopathy), and finally plyometric and explosive work for return to sport. Load management is critical - tendinopathy responds to progressive loading, not rest. Objective strength testing guides progression through phases. Return to sport requires achieving >90% strength restoration compared to uninjured side and passing sport-specific testing.',
        'Progressive loading from isometric → heavy slow resistance → eccentric → plyometric. Load management critical for tendinopathy. Requires >90% strength restoration for return to sport.',
        ARRAY[article_uuid],
        'strong',
        'high',
        '{"phases": ["pain_management_isometric", "heavy_slow_resistance_training", "eccentric_loading", "plyometric_training", "return_to_sport"], "key_metrics": ["strength", "pain_levels", "function", "RFD", "sport_specific_tasks"], "progression_criteria": "objective_strength_measures_guide_advancement", "return_to_sport_criteria": ">90%_strength_bilateral_symmetry"}'::jsonb,
        ARRAY['injured_athletes', 'tendinopathy_patients', 'post_surgery', 'running_athletes'],
        'general',
        ARRAY[
            'Progressive loading is key for tendinopathy',
            'Isometric exercises for pain management',
            'Heavy slow resistance builds tendon capacity',
            'Eccentric training essential for Achilles tendinopathy',
            'Use objective testing to guide progression',
            'Achieve >90% strength before return to sport',
            'Address biomechanical and load factors'
        ]
    );

    -- Knowledge Base Entry 5: Injury Prevention
    INSERT INTO knowledge_base_entries (
        entry_type,
        topic,
        question,
        answer,
        summary,
        supporting_articles,
        evidence_strength,
        consensus_level,
        applicable_to,
        sport_specificity,
        best_practices
    ) VALUES (
        'training_method',
        'calf_achilles_injury_prevention',
        'What are effective strategies for preventing calf and Achilles injuries?',
        'Prevention focuses on building adequate calf strength (especially soleus), implementing proper load management, including eccentric training programs, addressing biomechanical issues, and monitoring training loads. Regular strength testing identifies deficits before injury occurs. Eccentric calf exercises have been shown to reduce Achilles tendinopathy risk. Avoiding rapid training load increases is critical - the 10% rule for weekly load increases is a good guideline. Bilateral asymmetries greater than 10-15% indicate increased injury risk and should be addressed.',
        'Prevention through adequate calf strength, load management, eccentric training, biomechanical correction, and monitoring. Regular testing identifies deficits early.',
        ARRAY[article_uuid],
        'strong',
        'high',
        ARRAY['all_athletes', 'running_athletes', 'jumping_athletes', 'court_sport_athletes'],
        'running_jumping_sports',
        ARRAY[
            'Include regular calf strengthening (gastrocnemius and soleus)',
            'Implement eccentric training programs',
            'Monitor training loads and avoid spikes',
            'Regular strength testing to identify deficits',
            'Address bilateral asymmetries >10%',
            'Proper warm-up and cool-down protocols',
            'Progressive return from time off',
            'Monitor fatigue and recovery'
        ]
    );

END $$;

-- Create search index entries
INSERT INTO knowledge_search_index (entry_id, searchable_text, search_vector)
SELECT
    id,
    topic || ' ' || COALESCE(question, '') || ' ' || COALESCE(answer, '') || ' ' || COALESCE(summary, ''),
    to_tsvector('english', topic || ' ' || COALESCE(question, '') || ' ' || COALESCE(answer, '') || ' ' || COALESCE(summary, ''))
FROM knowledge_base_entries
WHERE topic IN (
    'calf_achilles_anatomy_biomechanics',
    'calf_achilles_assessment_protocols',
    'calf_achilles_injuries_pathologies',
    'calf_achilles_rehabilitation',
    'calf_achilles_injury_prevention'
);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Successfully seeded Calf and Achilles Complex knowledge base';
    RAISE NOTICE '  - 1 research article';
    RAISE NOTICE '  - 5 knowledge base entries';
    RAISE NOTICE '  - Search indexes created';
END $$;
