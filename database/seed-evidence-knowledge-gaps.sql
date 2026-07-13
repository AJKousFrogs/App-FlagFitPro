-- =============================================================================
-- Merlin knowledge base — evidence-review gap fill (2026-07-13)
-- =============================================================================
-- The knowledge_base_entries table already carried 112 approved entries covering
-- recovery modalities, sleep, dynamic-vs-static stretch, RAMP, 12 supplements, and
-- performance nutrition (protein/carbs/game-day/refuel/hydration). Three genuine
-- gaps remained after the 4-domain evidence review; this seeds them, grounded in the
-- SAME sources as netlify/functions/utils/{recovery-protocols,nutrition-protocols}.js
-- so Merlin and the engine speak with one evidence voice.
--
--   1. INJURY NUTRITION (whole sub-domain was missing): protein during
--      immobilisation, and connective-tissue support (collagen + vitamin C /
--      omega-3 / creatine).
--   2. SUPPLEMENT anti-doping / batch-testing (strict liability — safety gap).
--   3. CAFFEINE <-> SLEEP timing trade-off (supplement_caffeine existed but not the
--      evening-game guardrail that the /api/supplements/caffeine-timing engine uses).
--
-- Idempotent: each row inserts only when its topic is absent, so re-running (or a
-- fresh `db reset`) is safe. Auto-approved (same pattern as the existing seed set),
-- with an honest approval note naming the evidence. This file is the exact SQL
-- applied live via Supabase MCP on 2026-07-13.
-- =============================================================================

-- 1a. Injury nutrition — protein to counter injury-driven muscle loss ----------
INSERT INTO knowledge_base_entries
  (entry_type, topic, question, answer, summary, evidence_strength, consensus_level,
   applicable_to, best_practices, safety_warnings, contraindications,
   dosage_guidelines, sport_specificity, is_merlin_approved, merlin_approval_status,
   merlin_submitted_at, merlin_approved_at, merlin_submitted_by_role,
   merlin_approved_by_role, merlin_approval_notes, created_at, updated_at)
SELECT
  'nutrition', 'injury_nutrition_protein_anti_catabolic',
  'How should I eat protein while I am injured or in a cast so I lose less muscle?',
  'An injured or immobilised limb develops anabolic resistance: the muscle stops responding normally to protein and to loading, so muscle is lost fast in the first 1-2 weeks. Nutrition cannot stop this entirely, but it blunts it. Keep protein HIGH, not low: aim ~2.0-2.5 g/kg body mass per day (higher than the ~1.6-2.2 g/kg you would use in normal training), spread across ~4 evenly sized 0.3-0.4 g/kg doses through the day, each rich in leucine (whey, dairy, eggs, lean meat, fish). Do not crash calories to avoid getting fat while you cannot train - a large energy deficit accelerates muscle loss and slows healing. A mild deficit at most, and only once the acute healing phase has passed. Keep training the uninjured limbs and the rest of the body: loaded exercise plus protein is the strongest anti-catabolic signal available, and there is a cross-education effect to the injured side. Rebuild toward normal loading as clearance allows.',
  'While injured, keep protein high (~2.0-2.5 g/kg/day in ~4 leucine-rich doses) and do not crash calories - immobilised muscle is anabolically resistant and lost quickly.',
  'strong', 'high',
  ARRAY['all_athletes','adult_athletes','veteran_athletes'],
  ARRAY['Target ~2.0-2.5 g/kg/day protein while immobilised (above the normal training range)','Spread protein across ~4 doses of 0.3-0.4 g/kg, each leucine-rich','Avoid a large calorie deficit during the acute healing phase','Keep loading the uninjured body - loaded exercise + protein is the key anti-catabolic signal'],
  ARRAY['Athletes with kidney disease should individualise high protein intakes with a clinician','Do not use injury as a reason to under-eat - underfuelling slows tissue healing'],
  ARRAY['Chronic kidney disease (individualise protein with a clinician)'],
  '{"protein_g_per_kg_per_day":"2.0-2.5","dose":"~0.3-0.4 g/kg x4","energy":"avoid large deficit during healing"}'::jsonb,
  'flag_football', true, 'approved', now(), now(),
  'strength_conditioning_coach', 'strength_conditioning_coach',
  'Seeded from the FlagFit injury-nutrition evidence review (anabolic resistance of immobilisation; Wall 2013; Tipton 2015).',
  now(), now()
WHERE NOT EXISTS (SELECT 1 FROM knowledge_base_entries WHERE topic = 'injury_nutrition_protein_anti_catabolic');

-- 1b. Injury nutrition — connective-tissue support (collagen/vit C, omega-3) ----
INSERT INTO knowledge_base_entries
  (entry_type, topic, question, answer, summary, evidence_strength, consensus_level,
   applicable_to, best_practices, safety_warnings, contraindications,
   dosage_guidelines, sport_specificity, is_merlin_approved, merlin_approval_status,
   merlin_submitted_at, merlin_approved_at, merlin_submitted_by_role,
   merlin_approved_by_role, merlin_approval_notes, created_at, updated_at)
SELECT
  'nutrition', 'injury_nutrition_connective_tissue_collagen_vitc',
  'Is there anything I can eat to help a tendon or ligament heal faster?',
  'For tendon, ligament and other collagen tissue, the promising lever is collagen or gelatin taken WITH vitamin C shortly before loading the tissue. In a controlled study, ~15 g gelatin plus ~50 mg vitamin C taken ~30-60 minutes before a short rehab exercise bout roughly doubled collagen synthesis markers (Shaw 2017); the pre-loading timing matters because a brief blood-amino-acid spike is delivered to tissue that the rehab exercise has just stimulated. This supports, it does not replace, progressive loading - the exercise is the primary driver. Omega-3 fatty acids may modestly attenuate muscle loss and inflammation during immobilisation, and creatine (3-5 g/day) helps preserve muscle during disuse and may aid the return-to-training phase. Underneath all of it: enough total energy, ~2.0-2.5 g/kg protein, and adequate vitamin C, zinc and vitamin D for normal wound healing. Evidence for collagen is still emerging and effect sizes are modest - treat it as a low-risk adjunct to good loading and overall nutrition, not a shortcut.',
  'For tendon/ligament: ~15 g collagen/gelatin + ~50 mg vitamin C ~30-60 min BEFORE rehab loading may aid collagen synthesis (Shaw 2017); omega-3 and creatine help during disuse - all adjuncts to progressive loading, not replacements.',
  'moderate', 'emerging',
  ARRAY['all_athletes','adult_athletes'],
  ARRAY['Take ~15 g collagen/gelatin + ~50 mg vitamin C ~30-60 min before rehab loading','Keep loading progressively - the exercise stimulus is primary','Consider creatine 3-5 g/day to preserve muscle during immobilisation','Ensure adequate total energy, protein, vitamin C, zinc and vitamin D for healing'],
  ARRAY['Collagen evidence is emerging with modest effect sizes - do not expect a shortcut','Buy batch-tested (Informed Sport / NSF) products - see supplement_contamination_batch_testing_anti_doping'],
  ARRAY[]::text[],
  '{"collagen_g":"~15","vitamin_c_mg":"~50","timing":"30-60 min pre-loading","creatine_g_per_day":"3-5"}'::jsonb,
  'flag_football', true, 'approved', now(), now(),
  'strength_conditioning_coach', 'strength_conditioning_coach',
  'Seeded from the FlagFit injury-nutrition evidence review (Shaw 2017 gelatin + vitamin C; omega-3 / creatine during disuse).',
  now(), now()
WHERE NOT EXISTS (SELECT 1 FROM knowledge_base_entries WHERE topic = 'injury_nutrition_connective_tissue_collagen_vitc');

-- 2. Supplement anti-doping / batch-testing (strict liability) -----------------
INSERT INTO knowledge_base_entries
  (entry_type, topic, question, answer, summary, evidence_strength, consensus_level,
   applicable_to, best_practices, safety_warnings, contraindications,
   dosage_guidelines, sport_specificity, is_merlin_approved, merlin_approval_status,
   merlin_submitted_at, merlin_approved_at, merlin_submitted_by_role,
   merlin_approved_by_role, merlin_approval_notes, created_at, updated_at)
SELECT
  'supplement', 'supplement_contamination_batch_testing_anti_doping',
  'How do I know a supplement will not get me a positive doping test?',
  'You never know for certain from the label - so the rule is simple: only take supplements that are third-party BATCH-TESTED for sport, meaning Informed Sport or NSF Certified for Sport. Anti-doping runs on strict liability: you are responsible for every substance in your body, and it was in my supplement is not a defence. A meaningful share of ordinary supplements have been found contaminated with undeclared banned substances - across surveys roughly 10-25% depending on category and region (Geyer 2004; Outram and Stewart 2015). The risk is not evenly spread: it clusters in multi-ingredient proprietary blends, pre-workouts, fat burners / weight-loss products, and test boosters, which are exactly where hidden stimulants and steroids turn up. Single, reputable ingredients (creatine monohydrate, caffeine, whey, vitamin D, omega-3, electrolytes) are lower intrinsic risk - but manufacturing cross-contamination still happens, so buy the batch-tested version of even those. Practical rule: no third-party certification on the exact product and lot, do not take it. When in doubt, check the Informed Sport / NSF product databases, and prefer food first.',
  'Strict liability makes YOU responsible for everything you ingest; ~10-25% of supplements are contaminated, concentrated in blends/pre-workouts/boosters. Only use Informed Sport / NSF batch-tested products - no certification, no supplement.',
  'strong', 'high',
  ARRAY['all_athletes','adolescent_athletes','adult_athletes'],
  ARRAY['Use ONLY Informed Sport or NSF Certified for Sport batch-tested products','Treat proprietary blends, pre-workouts, fat burners and test boosters as high contamination risk','Even single reputable ingredients: buy the batch-tested version','Check the Informed Sport / NSF databases for the exact product and lot; food first'],
  ARRAY['Strict liability: it was in my supplement is not an anti-doping defence','High-risk categories (blends / pre-workouts / boosters) are where undeclared banned substances are most often found'],
  ARRAY['No third-party batch-testing certification on the exact product and lot'],
  '{"required":"Informed Sport or NSF Certified for Sport","high_risk":"proprietary blends, pre-workouts, fat burners, test boosters"}'::jsonb,
  'flag_football', true, 'approved', now(), now(),
  'strength_conditioning_coach', 'strength_conditioning_coach',
  'Seeded from the FlagFit supplement-safety evidence review (strict liability; Geyer 2004; Outram and Stewart 2015). Mirrors utils/nutrition-protocols.js supplementContaminationRisk.',
  now(), now()
WHERE NOT EXISTS (SELECT 1 FROM knowledge_base_entries WHERE topic = 'supplement_contamination_batch_testing_anti_doping');

-- 3. Caffeine <-> sleep timing trade-off ---------------------------------------
INSERT INTO knowledge_base_entries
  (entry_type, topic, question, answer, summary, evidence_strength, consensus_level,
   applicable_to, best_practices, safety_warnings, contraindications,
   dosage_guidelines, sport_specificity, is_merlin_approved, merlin_approval_status,
   merlin_submitted_at, merlin_approved_at, merlin_submitted_by_role,
   merlin_approved_by_role, merlin_approval_notes, created_at, updated_at)
SELECT
  'nutrition', 'caffeine_sleep_timing_tradeoff',
  'Should I take caffeine before an evening game if it might wreck my sleep?',
  'Caffeine is a genuine performance aid at ~3-6 mg/kg taken ~45-60 minutes pre-game, but it has a long tail: its half-life is roughly 5 hours, so a pre-game dose is still substantially in your system many hours later. Taking caffeine within about 6 hours of bedtime measurably shortens and worsens sleep - one controlled study found 400 mg taken 6 hours before bed cut total sleep by about an hour (Drake 2013), and the drinker often does not notice the damage. For an athlete this is usually a bad trade: one lost night of sleep hurts next-day sprint, skill accuracy and injury risk more than the caffeine helped a single game. Practical rule: for an afternoon game with a normal bedtime, caffeine is fine - there is enough of a gap. For a LATE evening game (a pre-game dose landing within ~6 hours of bed), skip it or cap it at a small, earlier dose, and lean on sleep, warm-up and fuelling instead. This is exactly what the app caffeine-timing tool does: it withholds the recommendation when the dose would fall inside the 6-hour pre-sleep window.',
  'Caffeine (~3-6 mg/kg pre-game) works, but its ~5 h half-life means a dose within ~6 h of bed cuts sleep ~1 h (Drake 2013). Use it for afternoon games; for late evening games skip it - the lost sleep costs more than the caffeine gains.',
  'moderate', 'high',
  ARRAY['all_athletes','adolescent_athletes','adult_athletes'],
  ARRAY['Afternoon game + normal bedtime: caffeine 3-6 mg/kg ~45-60 min pre-game is fine','Late evening game: skip caffeine or use a small earlier dose - protect sleep','Keep the last caffeine at least ~6 h before bed','Trial your caffeine plan in training, never introduce it new on game day'],
  ARRAY['Caffeine within ~6 h of bed measurably shortens sleep even if you do not feel it','For an athlete, one lost night of sleep usually outweighs a single game caffeine benefit'],
  ARRAY['Heart condition, hypertension, anxiety disorder or caffeine sensitivity - avoid or minimise'],
  '{"dose_mg_per_kg":"3-6","timing_pre_game":"45-60 min","sleep_protect_gap_h":"6","half_life_h":"~5"}'::jsonb,
  'flag_football', true, 'approved', now(), now(),
  'strength_conditioning_coach', 'strength_conditioning_coach',
  'Seeded from the FlagFit performance-nutrition evidence review (Guest/ISSN 2021; Drake 2013). Mirrors utils/nutrition-protocols.js caffeineSleepGuardrail.',
  now(), now()
WHERE NOT EXISTS (SELECT 1 FROM knowledge_base_entries WHERE topic = 'caffeine_sleep_timing_tradeoff');
