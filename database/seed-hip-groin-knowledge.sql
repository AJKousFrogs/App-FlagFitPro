-- =============================================================================
-- SEED: Practitioner's Guide to Hip and Groin Knowledge Base
-- Source: Practitioner's Guide to Hip and Groin by Dr. Nicol van Dyk & Dr. Eamonn Delahunt (VALD Performance, 2024)
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
    'Practitioner''s Guide to Hip and Groin',
    ARRAY['Nicol van Dyk', 'Eamonn Delahunt'],
    2024,
    'VALD Performance',
    'injury',
    ARRAY['injury_prevention', 'training', 'recovery', 'assessment', 'biomechanics'],
    ARRAY['hip', 'groin', 'adductor', 'FAI', 'assessment', 'rehabilitation', 'isometric_testing', 'VALD', 'athletic_groin_pain'],
    'review',
    'B',
    'general',
    'Comprehensive guide covering hip and groin anatomy, biomechanics, common injuries (FAI, adductor strains, chronic groin pain), assessment methods using modern technology (VALD force plates and dynamometers), and evidence-based rehabilitation strategies. Emphasizes isometric adduction testing as gold standard for groin injury monitoring.',
    ARRAY[
        'Use long-lever hip adduction isometric testing for groin injury monitoring',
        'Monitor athletes regularly - strength deficits often precede symptoms',
        'Apply Copenhagen adductor exercises for prevention and rehabilitation',
        'Use force plates and dynamometers for objective hip assessment',
        'Address entire kinetic chain including core, back and lower leg',
        'Implement evidence-based return-to-sport criteria'
    ],
    ARRAY['adductor_strain', 'FAI', 'labral_tear', 'sports_hernia', 'hip_osteoarthritis'],
    ARRAY['strength', 'stability', 'prehab', 'ROM'],
    ARRAY['rehabilitation', 'return_to_sport_protocols', 'progressive_loading'],
    false,
    true,
    9,
    ARRAY['hip', 'groin', 'adductor', 'FAI', 'assessment', 'injury_prevention', 'rehabilitation', 'isometric', 'VALD']
) ON CONFLICT DO NOTHING;

-- Get the article ID for reference
DO $$
DECLARE
    article_uuid UUID;
BEGIN
    SELECT id INTO article_uuid FROM research_articles WHERE title = 'Practitioner''s Guide to Hip and Groin';

    -- Knowledge Base Entry 1: Hip & Groin Anatomy and Biomechanics
    INSERT INTO knowledge_base_entries (
        title,
        content,
        category,
        subcategory,
        source_type,
        source_title,
        publication_date,
        evidence_grade,
        source_quality_score,
        is_active
    ) VALUES (
        'Hip and Groin Anatomy for Athletes',
        'The hip is a ball-and-socket joint connecting the femoral head to the acetabulum, serving as a central hub and "transition zone" of forces in the body. Key anatomical structures include:

**Bony Landmarks:**
- Iliac crest, ASIS, AIIS
- Acetabulum and femoral head
- Greater trochanter
- Pubic symphysis and pubic tubercle
- Sacroiliac joint

**Five Key Muscle Groups:**
1. **Hip Flexors**: Iliopsoas, rectus femoris, sartorius, tensor fascia latae
2. **Abdominals**: Rectus abdominis, obliques, transversus abdominis
3. **Adductors**: Adductor longus, brevis, magnus, pectineus, gracilis
4. **Hip Extensors**: Gluteals, hamstrings, adductor magnus
5. **Hip Rotators**: Gluteus medius/minimus, piriformis, gemelli

**The Groin Triangle:**
The groin region between lower abdomen and thigh serves as a key connection point between pelvis and lower limb.

**Clinical Relevance:**
- Adductor longus is most commonly injured groin muscle
- Hip flexors critical for sprinting and kicking
- Core stability essential for force transfer
- Monitoring strength in all planes prevents injury',
        'injury_prevention',
        'hip_groin',
        'practitioner_guide',
        'Practitioner''s Guide to Hip and Groin - VALD Performance',
        '2024-01-01',
        'A',
        9.0,
        true
    );

    -- Knowledge Base Entry 2: Hip & Groin Assessment Protocols
    INSERT INTO knowledge_base_entries (
        title,
        content,
        category,
        subcategory,
        source_type,
        source_title,
        publication_date,
        evidence_grade,
        source_quality_score,
        is_active
    ) VALUES (
        'Hip and Groin Assessment Protocols',
        'Modern hip and groin assessment uses objective technology for reliable, repeatable measurements.

**Gold Standard: Long-Lever Hip Adduction Test**
- Most sensitive marker for groin injury risk
- Can detect deficits before symptoms appear
- Essential for prevention and rehabilitation monitoring

**Testing Positions:**
- **Adductors (0° hip flexion)**: Tests adductor magnus, longus, gracilis
- **Adductors (45° hip flexion)**: Alternative position
- **Adductors (90° hip flexion)**: Targets pectineus specifically
- **Hip Flexors**: Supine (long lever) or sitting (short lever)
- **Hip Extensors**: Prone position
- **Hip Rotators**: Supine with 90° hip/knee flexion

**Key Metrics to Monitor:**
1. Peak force (N or N/kg)
2. Rate of force development (RFD)
3. Side-to-side asymmetry (>15% = concern)
4. Squeeze test ratios
5. ROM in all planes

**Assessment Frequency:**
- Pre-season baseline
- Weekly during high-load periods
- Post-injury tracking
- Return-to-sport clearance

**Technology:**
- ForceFrame for isometric testing
- DynaMo handheld dynamometer
- ForceDecks for jump assessment',
        'injury_prevention',
        'hip_groin',
        'practitioner_guide',
        'Practitioner''s Guide to Hip and Groin - VALD Performance',
        '2024-01-01',
        'A',
        9.0,
        true
    );

    -- Knowledge Base Entry 3: Common Hip & Groin Injuries
    INSERT INTO knowledge_base_entries (
        title,
        content,
        category,
        subcategory,
        source_type,
        source_title,
        publication_date,
        evidence_grade,
        source_quality_score,
        is_active
    ) VALUES (
        'Common Hip and Groin Injuries in Athletes',
        'Hip and groin injuries are common in field-based sports, particularly those involving kicking, cutting, and rapid acceleration.

**Adductor-Related Groin Pain:**
- Most common groin injury in athletes
- Adductor longus most frequently affected
- Risk factors: Previous injury, reduced adductor strength, sport demands
- Key marker: Reduced long-lever adduction strength

**Femoroacetabular Impingement (FAI):**
- Cam type: Bony overgrowth on femoral head
- Pincer type: Acetabular over-coverage
- Mixed type: Combination
- Symptoms: Hip pain, reduced ROM, clicking

**Labral Tears:**
- Often associated with FAI
- Can be traumatic or degenerative
- Symptoms: Catching, clicking, deep hip pain

**Sports Hernia / Athletic Pubalgia:**
- Chronic groin pain without true hernia
- Involves pubic symphysis region
- Common in kicking sports

**Hip Pathology Across Lifespan:**
- Early life (<15): Perthes, dysplasia, SCFE
- Young adult (18-35): FAI, labral tears, groin strains
- Mid-life (40-65): Early OA, late FAI
- Older adult (65+): Osteoarthritis, fractures

**Prevention Strategies:**
- Regular adductor strength monitoring
- Copenhagen adductor exercises
- Adequate warm-up and load management
- Address kinetic chain deficits',
        'injury_prevention',
        'hip_groin',
        'practitioner_guide',
        'Practitioner''s Guide to Hip and Groin - VALD Performance',
        '2024-01-01',
        'A',
        9.0,
        true
    );

    -- Knowledge Base Entry 4: Hip & Groin Rehabilitation
    INSERT INTO knowledge_base_entries (
        title,
        content,
        category,
        subcategory,
        source_type,
        source_title,
        publication_date,
        evidence_grade,
        source_quality_score,
        is_active
    ) VALUES (
        'Hip and Groin Rehabilitation Protocols',
        'Evidence-based hip and groin rehabilitation follows a structured progression with objective monitoring.

**Rehabilitation Principles:**
1. Restore ROM to accepted values
2. Restore force production capacity
3. Integrate force and ROM in functional movements
4. Re-integrate to sport demands
5. Monitor KPIs during return to sport

**Phase 1: Pain Management & ROM**
- Pain-free ROM exercises
- Isometric holds at pain-free angles
- Soft tissue work
- Goal: Pain-free daily activities

**Phase 2: Strength Restoration**
- Progressive isometric loading
- Copenhagen adductor exercises (modified)
- Hip flexor and extensor strengthening
- Goal: >90% strength symmetry

**Phase 3: Functional Integration**
- Squat pattern restoration
- Lunge variations
- Single-leg exercises
- Goal: Pain-free compound movements

**Phase 4: Sport-Specific**
- Change of direction drills
- Acceleration/deceleration
- Kicking progressions (if applicable)
- Goal: Sport-specific movement competency

**Phase 5: Return to Performance**
- Full training participation
- Match/competition exposure
- Ongoing monitoring
- Goal: Pre-injury performance levels

**Key Exercises:**
- Copenhagen adductor (side plank with adduction)
- Isometric squeeze variations
- Hip flexor strengthening
- Glute activation work
- Core stability progressions',
        'recovery',
        'hip_groin',
        'practitioner_guide',
        'Practitioner''s Guide to Hip and Groin - VALD Performance',
        '2024-01-01',
        'A',
        9.0,
        true
    );

    -- Knowledge Base Entry 5: Hip & Groin Injury Prevention
    INSERT INTO knowledge_base_entries (
        title,
        content,
        category,
        subcategory,
        source_type,
        source_title,
        publication_date,
        evidence_grade,
        source_quality_score,
        is_active
    ) VALUES (
        'Hip and Groin Injury Prevention Strategies',
        'Groin injuries are preventable with evidence-based screening and training programs.

**Key Finding:**
Athletes often develop decreased adductor strength BEFORE reporting groin pain. Regular strength measurement identifies issues early, allowing intervention before pathology progresses.

**Copenhagen Adductor Exercise Program:**
The gold standard for groin injury prevention:
- Level 1: Knee support (beginner)
- Level 2: Ankle support (intermediate)
- Level 3: Dynamic with movement (advanced)
- Frequency: 2-3x per week
- Evidence: 41% reduction in groin injuries (Harøy et al.)

**Screening Protocol:**
1. Long-lever adduction strength test (baseline)
2. Hip ROM assessment
3. Squeeze test at 0°, 45°, 90°
4. Single-leg balance tests
5. Functional movement screening

**Risk Factors to Monitor:**
- Previous groin injury (strongest predictor)
- Adduction strength <4.0 N/kg
- Side-to-side asymmetry >15%
- Reduced hip ROM
- High training loads without adequate preparation

**Prevention Program Components:**
1. Regular strength monitoring (weekly during season)
2. Copenhagen adductor exercises
3. Hip flexor and extensor balance
4. Core stability work
5. Adequate warm-up before training/matches
6. Load management and periodization

**When to Intervene:**
- Any strength decline >10% from baseline
- New asymmetry developing
- Subjective reports of tightness/discomfort
- Before symptoms become limiting',
        'injury_prevention',
        'hip_groin',
        'practitioner_guide',
        'Practitioner''s Guide to Hip and Groin - VALD Performance',
        '2024-01-01',
        'A',
        9.0,
        true
    );

END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Successfully seeded Hip and Groin knowledge base';
    RAISE NOTICE '  - 1 research article';
    RAISE NOTICE '  - 5 knowledge base entries';
    RAISE NOTICE '    - Hip and Groin Anatomy';
    RAISE NOTICE '    - Assessment Protocols';
    RAISE NOTICE '    - Common Injuries';
    RAISE NOTICE '    - Rehabilitation';
    RAISE NOTICE '    - Injury Prevention';
END $$;

