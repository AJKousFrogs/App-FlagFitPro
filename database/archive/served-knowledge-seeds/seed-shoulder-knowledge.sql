-- =============================================================================
-- SEED: Practitioners Guide to Shoulders Knowledge Base
-- Source: Practitioners Guide to Shoulders by Jo Clubb & Ben Ashworth (VALD Performance, 2024)
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
    'Practitioner''s Guide to Shoulders',
    ARRAY['Jo Clubb', 'Ben Ashworth'],
    2024,
    'VALD Performance',
    'injury',
    ARRAY['injury_prevention', 'training', 'recovery', 'assessment', 'biomechanics'],
    ARRAY['shoulder', 'assessment', 'rehabilitation', 'strength_testing', 'ROM', 'overhead_athletes', 'force_testing', 'rotator_cuff', 'VALD', 'RFD'],
    'review',
    'B',
    'general',
    'Comprehensive guide covering shoulder anatomy, biomechanics, common injuries, assessment methods using modern technology (VALD force plates and dynamometers), and evidence-based rehabilitation strategies. Emphasizes objective measurement, monitoring rate of force development (RFD), and the importance of lower body in shoulder function.',
    ARRAY[
        'Use force plates (ForceDecks) and dynamometers (DynaMo, ForceFrame) for objective shoulder assessment',
        'Implement standardized ROM testing protocols',
        'Monitor rate of force development (RFD) not just peak strength',
        'Apply evidence-based rehabilitation progressions',
        'Monitor shoulder health in overhead and throwing athletes',
        'Integrate lower body assessment for complete shoulder evaluation',
        'Use case-specific protocols for different sports and injuries'
    ],
    ARRAY['shoulder_impingement', 'rotator_cuff_tear', 'shoulder_instability', 'labral_injury'],
    ARRAY['strength', 'stability', 'prehab', 'ROM'],
    ARRAY['rehabilitation', 'return_to_sport_protocols', 'progressive_loading'],
    false,
    true,
    9,
    ARRAY['shoulder', 'assessment', 'injury_prevention', 'rehabilitation', 'overhead_athletes', 'force_testing', 'ROM', 'RFD', 'VALD', 'rotator_cuff']
);

-- Get the article ID for reference
DO $$
DECLARE
    article_uuid UUID;
BEGIN
    SELECT id INTO article_uuid FROM research_articles WHERE title = 'Practitioner''s Guide to Shoulders';

    -- Knowledge Base Entry 1: Shoulder Anatomy & Biomechanics
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
        'shoulder_anatomy_biomechanics',
        'What is the anatomy and biomechanics of the shoulder complex?',
        'The shoulder is a complex structure involving multiple joints: glenohumeral (ball-and-socket), acromioclavicular, sternoclavicular, and scapulothoracic. The rotator cuff muscles (supraspinatus, infraspinatus, teres minor, subscapularis) provide dynamic stability while allowing the extensive range of motion required for overhead activities. The complex interplay between these joints and surrounding muscles enables the shoulder''s remarkable mobility while maintaining functional stability. Understanding this anatomy is crucial for assessment, injury prevention, and rehabilitation.',
        'The shoulder is a complex structure involving multiple joints (glenohumeral, acromioclavicular, sternoclavicular, scapulothoracic) and the rotator cuff muscles that provide stability and mobility.',
        ARRAY[article_uuid],
        'strong',
        'high',
        ARRAY['elite_athletes', 'amateur_athletes', 'general_population', 'overhead_athletes'],
        'general',
        ARRAY[
            'Understand the kinetic chain relationship between lower body and shoulder',
            'Assess all components of shoulder complex',
            'Monitor both ROM and strength metrics'
        ]
    );

    -- Knowledge Base Entry 2: Shoulder Assessment Protocols
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
        'shoulder_assessment_protocols',
        'What are the best practices for shoulder assessment?',
        'Modern shoulder assessment has been revolutionized by technology, particularly force plates and dynamometers. VALD equipment (DynaMo, ForceFrame, ForceDecks) enables objective measurement of shoulder function including peak force, rate of force development (RFD), and range of motion (ROM). Assessment should capture not just peak strength but also RFD, which is critical for sport performance and injury prevention. The lower body''s influence on upper body performance must also be considered in comprehensive shoulder evaluation.',
        'Modern shoulder assessment uses force plates, dynamometers, and ROM testing to objectively measure shoulder function, strength, and rate of force development.',
        ARRAY[article_uuid],
        'strong',
        'high',
        '{"equipment": ["DynaMo", "ForceFrame", "ForceDecks"], "metrics": ["peak_force", "rate_of_force_development", "ROM", "asymmetry"], "frequency": "regular monitoring throughout season"}'::jsonb,
        ARRAY['elite_athletes', 'overhead_athletes', 'throwing_athletes'],
        'general',
        ARRAY[
            'Use objective technology-based assessments',
            'Monitor both strength and ROM',
            'Track rate of force development (RFD)',
            'Assess lower body influence on shoulder function',
            'Regular monitoring for injury prevention'
        ]
    );

    -- Knowledge Base Entry 3: Common Shoulder Injuries
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
        'shoulder_injuries_pathologies',
        'What are common shoulder injuries in athletes and how are they identified?',
        'Common shoulder injuries in athletes include impingement syndrome, rotator cuff tears, shoulder instability, and labral injuries. These pathologies are particularly prevalent in overhead and throwing athletes due to repetitive stress and high forces. Impingement occurs when structures are compressed in the subacromial space. Rotator cuff injuries range from tendinopathy to full tears. Instability can be traumatic or develop from repetitive microtrauma. Labral injuries often accompany instability or result from acute trauma. Early identification through proper assessment and monitoring is crucial for preventing progression.',
        'Common shoulder injuries include impingement, rotator cuff tears, instability, and labral injuries. These are prevalent in overhead and throwing athletes.',
        ARRAY[article_uuid],
        'strong',
        'high',
        ARRAY['overhead_athletes', 'throwing_athletes', 'contact_sport_athletes'],
        'overhead_sports',
        ARRAY[
            'Avoid overhead activities during acute pain',
            'Do not ignore compensatory movement patterns'
        ],
        ARRAY[
            'Repetitive overhead activities increase injury risk',
            'Muscular imbalances can lead to injury',
            'Improper technique significantly increases risk'
        ]
    );

    -- Knowledge Base Entry 4: Shoulder Rehabilitation
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
        'shoulder_rehabilitation',
        'What are evidence-based shoulder rehabilitation strategies?',
        'Effective shoulder rehabilitation follows a structured progression: pain management, ROM restoration, strength building, RFD training, and return to sport. The focus should be on restoring full ROM before heavy strength work, then building strength while monitoring RFD development. Objective measures should guide progression through phases. The kinetic chain must be addressed - lower body deficits can impair shoulder function. Return to sport should be gradual and criteria-based, not time-based. Technology-based monitoring helps ensure safe progression and identifies readiness for advancement.',
        'Effective shoulder rehabilitation focuses on restoring ROM, building strength, improving RFD, and ensuring safe return to sport through progressive loading.',
        ARRAY[article_uuid],
        'strong',
        'high',
        '{"phases": ["pain_management", "ROM_restoration", "strength_building", "RFD_training", "return_to_sport"], "key_metrics": ["ROM", "strength", "RFD", "pain_levels", "function"], "progression_criteria": "objective_measures_guide_advancement"}'::jsonb,
        ARRAY['injured_athletes', 'post_surgery', 'overhead_athletes'],
        'general',
        ARRAY[
            'Restore full ROM before heavy strength work',
            'Focus on RFD not just peak strength',
            'Use objective measures to guide progression',
            'Address kinetic chain deficits',
            'Gradual return to sport activities'
        ]
    );

    -- Knowledge Base Entry 5: Shoulder Prehab & Training
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
        'shoulder_prehab_training',
        'What are effective shoulder prehabilitation and training strategies?',
        'Shoulder prehabilitation is essential for overhead and throwing athletes. Key components include rotator cuff strengthening with attention to external/internal rotation balance, scapular stability exercises, and maintaining ROM. Programs should include both concentric and eccentric exercises, address the entire kinetic chain including lower body, and follow progressive loading principles. Regular monitoring helps identify developing imbalances or deficits before they become problematic. Prehab should be integrated into training year-round, not just during rehabilitation.',
        'Shoulder prehab focuses on strengthening rotator cuff, improving scapular stability, maintaining ROM, and preventing muscular imbalances in overhead athletes.',
        ARRAY[article_uuid],
        'strong',
        'high',
        ARRAY['overhead_athletes', 'throwing_athletes', 'all_athletes'],
        'overhead_sports',
        ARRAY[
            'Include rotator cuff strengthening in all programs',
            'Maintain external/internal rotation balance',
            'Regular scapular stability work',
            'Monitor and maintain ROM',
            'Progressive loading principles'
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
    'shoulder_anatomy_biomechanics',
    'shoulder_assessment_protocols',
    'shoulder_injuries_pathologies',
    'shoulder_rehabilitation',
    'shoulder_prehab_training'
);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Successfully seeded Practitioners Guide to Shoulders knowledge base';
    RAISE NOTICE '  - 1 research article';
    RAISE NOTICE '  - 5 knowledge base entries';
    RAISE NOTICE '  - Search indexes created';
END $$;
