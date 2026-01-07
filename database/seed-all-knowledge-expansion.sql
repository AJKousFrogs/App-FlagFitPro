-- =============================================================================
-- MASTER KNOWLEDGE BASE EXPANSION SCRIPT
-- Run this file to apply ALL knowledge base expansions
-- =============================================================================
-- 
-- This script imports the following seed files in order:
-- 1. Hip & Groin Knowledge (from VALD Guide)
-- 2. Comprehensive Knowledge Expansion (Lumbar, Knee, Sprint, Agility, etc.)
-- 3. Nutrition & Supplements Expansion
-- 4. Training Load, Isometrics & Periodization
-- 5. Research Topics Expansion (AIS, Position Training, etc.)
--
-- TOTAL NEW ENTRIES: ~84 evidence-based articles
--
-- =============================================================================

-- Note: Run each file individually or use this as a reference
-- To run all at once, execute each file in sequence:
--
-- psql $DATABASE_URL -f database/seed-hip-groin-knowledge.sql
-- psql $DATABASE_URL -f database/seed-comprehensive-knowledge-expansion.sql
-- psql $DATABASE_URL -f database/seed-nutrition-supplements-expansion.sql
-- psql $DATABASE_URL -f database/seed-training-load-isometrics-expansion.sql
-- psql $DATABASE_URL -f database/seed-research-topics-expansion.sql

-- =============================================================================
-- SUMMARY OF NEW KNOWLEDGE BASE ENTRIES
-- =============================================================================
--
-- CATEGORY: INJURY PREVENTION
-- ├── Hip & Groin: 5 entries
-- │   ├── Hip and Groin Anatomy for Athletes
-- │   ├── Hip and Groin Assessment Protocols
-- │   ├── Common Hip and Groin Injuries in Athletes
-- │   ├── Hip and Groin Rehabilitation Protocols
-- │   └── Hip and Groin Injury Prevention Strategies
-- │
-- ├── Lumbar Spine: 5 entries
-- │   ├── Lumbar Spine Anatomy for Athletes
-- │   ├── Low Back Pain Assessment in Athletes
-- │   ├── Common Lumbar Spine Injuries in Athletes
-- │   ├── Core Stability Training for Spine Health
-- │   └── Return to Sport After Lumbar Spine Injury
-- │
-- └── Knee Complex: 5 entries
--     ├── Knee Anatomy and Biomechanics for Athletes
--     ├── Patellofemoral Pain Syndrome in Athletes
--     ├── Meniscus Injuries: Assessment and Management
--     ├── Patellar and Quadriceps Tendinopathy
--     └── Knee Injury Prevention Programs
--
-- CATEGORY: TRAINING - SPEED & AGILITY
-- ├── Sprint Performance: 7 entries
-- │   ├── Sprint Mechanics: Acceleration Phase
-- │   ├── Maximum Velocity Sprint Mechanics
-- │   ├── Resisted Sprint Training Methods
-- │   ├── Force-Velocity Profiling for Sprinters
-- │   ├── Sprint Training Periodization
-- │   ├── Plyometric Training for Sprint Performance
-- │   └── Hamstring Training for Sprinters
-- │
-- └── Agility & COD: 5 entries
--     ├── Change of Direction vs Agility: Key Differences
--     ├── Deceleration Training for Athletes
--     ├── Cutting Mechanics and Technique
--     ├── Reactive Agility Training Methods
--     └── Strength Training for Change of Direction
--
-- CATEGORY: RECOVERY
-- └── Recovery & Sleep: 6 entries
--     ├── Sleep Architecture and Athletic Performance
--     ├── Sleep Extension for Athletes
--     ├── Napping Strategies for Athletes
--     ├── Cold Water Immersion for Recovery
--     ├── Active Recovery Methods
--     └── Compression Garments for Recovery
--
-- CATEGORY: PSYCHOLOGY
-- └── Sports Psychology: 6 entries
--     ├── Goal Setting for Athletic Performance
--     ├── Visualization and Mental Imagery
--     ├── Pre-Competition Routines
--     ├── Managing Performance Anxiety
--     ├── Self-Talk for Athletic Performance
--     └── Building and Maintaining Confidence
--
-- CATEGORY: SPECIAL POPULATIONS
-- ├── Female Athletes: 3 entries
-- │   ├── Menstrual Cycle and Athletic Performance
-- │   ├── RED-S: Relative Energy Deficiency in Sport
-- │   └── ACL Injury Prevention in Female Athletes
-- │
-- └── Youth Athletes: 2 entries
--     ├── Long-Term Athletic Development Model
--     └── Strength Training for Youth Athletes
--
-- CATEGORY: FLAG FOOTBALL SPECIFIC
-- └── Flag Football: 3 entries
--     ├── Flag Football Position-Specific Conditioning
--     ├── Tournament Preparation for Flag Football
--     └── Heat Acclimatization for Outdoor Flag Football
--
-- CATEGORY: VELOCITY-BASED TRAINING
-- └── VBT: 2 entries
--     ├── Velocity-Based Training Fundamentals
--     └── Velocity Loss and Fatigue Management
--
-- CATEGORY: NUTRITION
-- ├── Macronutrients: 3 entries
-- │   ├── Carbohydrate Periodization for Athletes
-- │   ├── Protein Distribution and Timing
-- │   └── Fat Intake for Athletic Performance
-- │
-- ├── Hydration: 2 entries
-- │   ├── Sweat Rate Testing and Individualized Hydration
-- │   └── Electrolyte Replacement Strategies
-- │
-- ├── Supplements: 3 entries
-- │   ├── AIS Supplement Framework: Category A Supplements
-- │   ├── AIS Supplement Framework: Category B Supplements
-- │   └── Supplement Safety and Anti-Doping Considerations
-- │
-- ├── Meal Planning: 3 entries
-- │   ├── Athlete Plate Model: Practical Meal Planning
-- │   ├── Game Day Nutrition Protocol
-- │   └── Recovery Nutrition: The 3 Rs
-- │
-- └── Micronutrients: 2 entries
--     ├── Iron Status in Athletes
--     └── Vitamin D for Athletic Performance
--
-- CATEGORY: TRAINING LOAD
-- └── Training Load: 4 entries
--     ├── ACWR: Acute to Chronic Workload Ratio Deep Dive
--     ├── Session RPE Method for Load Monitoring
--     ├── Monitoring Athlete Wellness and Readiness
--     └── Recognizing and Preventing Overtraining Syndrome
--
-- CATEGORY: ISOMETRICS & STRENGTH
-- └── Isometrics: 3 entries
--     ├── Isometric Training: Types and Applications
--     ├── Isometric Training for Tendinopathy
--     └── Rate of Force Development Training
--
-- CATEGORY: PERIODIZATION
-- └── Periodization: 3 entries
--     ├── Periodization Models for Team Sport Athletes
--     ├── Tapering and Peaking for Competition
--     └── Deload Weeks: When and How
--
-- CATEGORY: MUSCLE FIBER
-- └── Muscle Fiber: 1 entry
--     └── Muscle Fiber Types and Athletic Performance
--
-- CATEGORY: HIGH PERFORMANCE
-- └── AIS High Performance: 3 entries
--     ├── AIS Framework for Athlete Development
--     ├── Evidence-Based Strength and Conditioning Principles
--     └── Performance Testing Battery for Field Sport Athletes
--
-- CATEGORY: POSITION TRAINING
-- └── Position Training: 4 entries
--     ├── Quarterback Arm Care: Comprehensive Program
--     ├── Wide Receiver Training: Speed and Route Running
--     ├── Defensive Back Training: Coverage Skills
--     └── Rusher/Blitzer Training: Pass Rush Techniques
--
-- CATEGORY: ADDITIONAL RESEARCH
-- └── Research Topics: 4 entries
--     ├── Repeated Sprint Ability for Team Sports
--     ├── Concurrent Training: Balancing Strength and Endurance
--     ├── Blood Flow Restriction Training
--     └── Warm-Up Science: Evidence-Based Protocols
--
-- =============================================================================
-- GRAND TOTAL: ~84 NEW EVIDENCE-BASED KNOWLEDGE ENTRIES
-- =============================================================================
-- 
-- Combined with existing 87 entries = 171+ total knowledge base entries
--
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'KNOWLEDGE BASE EXPANSION SUMMARY';
    RAISE NOTICE '===========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'To apply all expansions, run these commands:';
    RAISE NOTICE '';
    RAISE NOTICE '  supabase db execute -f database/seed-hip-groin-knowledge.sql';
    RAISE NOTICE '  supabase db execute -f database/seed-comprehensive-knowledge-expansion.sql';
    RAISE NOTICE '  supabase db execute -f database/seed-nutrition-supplements-expansion.sql';
    RAISE NOTICE '  supabase db execute -f database/seed-training-load-isometrics-expansion.sql';
    RAISE NOTICE '  supabase db execute -f database/seed-research-topics-expansion.sql';
    RAISE NOTICE '';
    RAISE NOTICE '===========================================';
END $$;

