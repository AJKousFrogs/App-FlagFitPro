-- =============================================================================
-- SEED EXPANSION: Soleus and Ankle/Tibialis entries for Calf & Achilles knowledge
-- Run AFTER seed-calf-achilles-knowledge.sql
-- =============================================================================

DO $$
DECLARE
    article_uuid UUID;
BEGIN
    SELECT id INTO article_uuid FROM research_articles WHERE title = 'Practitioner''s Guide to the Calf and Achilles Complex';

    -- Soleus vs Gastrocnemius differentiation
    INSERT INTO knowledge_base_entries (
        entry_type, topic, question, answer, summary, supporting_articles,
        evidence_strength, consensus_level, applicable_to, sport_specificity,
        protocols, best_practices
    ) VALUES (
        'training_method',
        'soleus_gastrocnemius_differentiation',
        'When should soleus vs gastrocnemius be emphasized in assessment and training?',
        'The gastrocnemius (knee-straight) and soleus (knee-bent) have different functions and injury profiles. Soleus strains have longer recurrence window (25.1 days vs gastrocnemius 7.7 days) and often present with subtler symptoms. Test both positions independently: knee-straight for gastrocnemius dominance, knee-bent 90° for soleus. Emphasize soleus for running endurance and Achilles loading—it has greater oxidative capacity and is primary plantar flexor in many activities. Gastrocnemius contributes more to explosive movements. Both are needed for sprinting and jumping; address imbalances. Soleus-specific strengthening (seated calf raises, knee-bent holds) important for tendinopathy and running athletes.',
        'Test and train gastrocnemius (knee-straight) and soleus (knee-bent) independently. Soleus has longer rehab; both critical for running and jumping.',
        ARRAY[article_uuid], 'strong', 'high',
        ARRAY['running_athletes', 'jumping_athletes', 'injured_athletes'],
        'general',
        '{"gastrocnemius_test": "knee_straight_plantar_flexion", "soleus_test": "knee_bent_90_plantar_flexion", "soleus_exercises": ["seated_calf_raise", "knee_bent_isometric_hold"]}'::jsonb,
        ARRAY['Test both positions in every calf assessment', 'Address soleus specifically in running athletes', 'Soleus strains require longer rehab timeline', 'Use objective metrics—symptoms unreliable for soleus']
    );

    -- Ankle dorsiflexion and Tibialis
    INSERT INTO knowledge_base_entries (
        entry_type, topic, question, answer, summary, supporting_articles,
        evidence_strength, consensus_level, applicable_to, sport_specificity,
        protocols, best_practices
    ) VALUES (
        'training_method',
        'ankle_dorsiflexion_tibialis_assessment',
        'What role do ankle dorsiflexion and tibialis anterior play in lower leg health?',
        'Tibialis anterior provides dorsiflexion and controls foot position during gait. Weakness or tightness contributes to shin splints (MTSS), ankle instability, and compensatory movement patterns. Ankle dorsiflexion mobility is critical for squat depth, sprint mechanics, and landing—limited dorsiflexion increases knee stress and injury risk. Assess: active/passive dorsiflexion ROM, tibialis anterior strength (dorsiflexion against resistance), toe raises. Strengthening tibialis (toe raises, resisted dorsiflexion) helps prevent shin splints. Ankle mobility drills (wall stretches, banded mobilizations) improve dorsiflexion. Balance tibialis with calf strength—antagonist balance matters for joint health.',
        'Tibialis anterior and ankle dorsiflexion critical for sprint mechanics and shin splint prevention. Assess and train alongside calf complex.',
        ARRAY[article_uuid], 'strong', 'high',
        ARRAY['running_athletes', 'jumping_athletes', 'field_sport_athletes'],
        'general',
        '{"assessment": ["dorsiflexion_ROM", "tibialis_strength", "toe_raises"], "exercises": ["toe_raises", "resisted_dorsiflexion", "ankle_mobility_drills"]}'::jsonb,
        ARRAY['Include tibialis strengthening in lower leg programs', 'Assess ankle dorsiflexion in movement screening', 'Address limited dorsiflexion before heavy squatting', 'Balance plantar flexor and dorsiflexor strength']
    );

    -- Update search index
    INSERT INTO knowledge_search_index (entry_id, searchable_text, search_vector)
    SELECT id, topic || ' ' || COALESCE(question, '') || ' ' || COALESCE(answer, '') || ' ' || COALESCE(summary, ''),
           to_tsvector('english', topic || ' ' || COALESCE(question, '') || ' ' || COALESCE(answer, '') || ' ' || COALESCE(summary, ''))
    FROM knowledge_base_entries
    WHERE topic IN ('soleus_gastrocnemius_differentiation', 'ankle_dorsiflexion_tibialis_assessment');

    RAISE NOTICE 'Calf & Achilles expansion: 2 new entries (soleus, ankle/tibialis)';
END $$;
