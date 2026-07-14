-- =============================================================================
-- Merlin knowledge base — FLAG-SPECIFIC evidence tier (2026-07-14, audit §1.2)
-- =============================================================================
-- Until now every load/injury constant in the app was borrowed from soccer /
-- generic team-sport literature. A real flag football literature now exists;
-- these six entries seed it as a "flag-direct" tier ABOVE the borrowed evidence.
-- Every citation below was verified against PubMed on 2026-07-14 (PMIDs noted)
-- before seeding — no entry cites a paper we could not retrieve.
--
--   1. Girls'/female flag ACL surge + the NMT prevention case (Grewal 2025)
--   2. Flag injury epidemiology: collisions #1, fingers the top adult site
--      (Locke 2025; Balachandran 2025 — female-specific)
--   3. Elite flag injury prevalence + anthropometric risk (Vázquez-Villarreal)
--   4. HS female flag: injury rate + mental-health benefit (Brna 2025)
--   5. ACWR honesty: the only cluster-RCT found no effect (Dalen-Lorentsen)
--   6. NMT / ACL-prevention warm-up block — what the app now prescribes
--
-- Idempotent (topic-guarded). Applied live via Supabase MCP on 2026-07-14;
-- this file is the exact SQL applied.
-- =============================================================================

-- 1. Female/youth flag ACL risk + prevention ---------------------------------
INSERT INTO knowledge_base_entries
  (entry_type, topic, question, answer, summary, evidence_strength, consensus_level,
   applicable_to, best_practices, safety_warnings, contraindications,
   dosage_guidelines, sport_specificity, is_merlin_approved, merlin_approval_status,
   merlin_submitted_at, merlin_approved_at, merlin_submitted_by_role,
   merlin_approved_by_role, merlin_approval_notes, created_at, updated_at)
SELECT
  'injury', 'flag_specific_acl_risk_female_youth',
  'Is ACL injury actually a problem in flag football, and can training prevent it?',
  'Yes — and it is the best-documented injury problem specific to flag football. In the first two sanctioned California high-school girls'' flag seasons, 21 of 24 knee surgeries were ACL tears, 87% were NON-CONTACT (pivoting, cutting, sudden stops — 18/24), and game injury risk nearly quadrupled in one season (0.17 to 0.64 per 1000 athlete exposures) as participation grew. Critically, only 2 of the 24 injured athletes had ever done an ACL-prevention program (Grewal 2025, J Pediatr Orthop, PMID 41208758). This is exactly the injury pattern neuromuscular training (NMT — FIFA 11+-class warm-ups: landing mechanics, hop-and-stick, deceleration, Nordic and Copenhagen work) is proven to target: the meta-analytic literature shows roughly a halving of ACL injury in female athletes with consistent NMT. Flag football deletes tackling but keeps every cut, pivot and hard stop — the non-contact ACL mechanism is fully alive. The 10-minute NMT block in your warm-up on quality days IS this program; treat it as protective training, not filler.',
  'Flag-specific data (Grewal 2025): 87% of girls'' flag knee surgeries were non-contact ACL tears from cutting/pivoting, and only 2/24 injured athletes had done any prevention program. NMT warm-ups roughly halve ACL risk in female athletes — do the NMT block.',
  'strong', 'high',
  ARRAY['all_athletes','female_athletes','youth_athletes'],
  ARRAY['Do the NMT warm-up block on every quality day — consistency drives the protective effect','Land soft, knee over toes, no inward collapse — the landing pattern is the target skill','Deceleration strength (stopping in fewer steps, under control) is cut protection','Female and youth athletes: treat NMT as non-negotiable, not optional'],
  ARRAY['A prior ACL injury greatly raises re-injury risk — return-to-play clearance is a clinician call','Knee pain or instability after a cut/landing: stop and get assessed, do not play through'],
  ARRAY[]::text[],
  '{"nmt_block":"~10 min within the warm-up, 3-4x/week on quality days","evidence_tier":"flag-direct"}'::jsonb,
  'flag_football', true, 'approved', now(), now(),
  'strength_conditioning_coach', 'strength_conditioning_coach',
  'Flag-direct tier. Grewal 2025 (PMID 41208758, doi:10.1097/BPO.0000000000003154), verified on PubMed 2026-07-14; NMT effect from the established meta-analytic NMT/ACL literature.',
  now(), now()
WHERE NOT EXISTS (SELECT 1 FROM knowledge_base_entries WHERE topic = 'flag_specific_acl_risk_female_youth');

-- 2. Flag injury epidemiology: collisions #1, fingers the top adult site ------
INSERT INTO knowledge_base_entries
  (entry_type, topic, question, answer, summary, evidence_strength, consensus_level,
   applicable_to, best_practices, safety_warnings, contraindications,
   dosage_guidelines, sport_specificity, is_merlin_approved, merlin_approval_status,
   merlin_submitted_at, merlin_approved_at, merlin_submitted_by_role,
   merlin_approved_by_role, merlin_approval_notes, created_at, updated_at)
SELECT
  'injury', 'flag_specific_injury_epidemiology_fingers_collisions',
  'What actually gets injured in flag football — is it really a low-injury sport?',
  'Lower-injury than tackle, not injury-free. Ten years of US emergency-department data (NEISS) show player-player COLLISION is the single most common mechanism (35.7%) even without tackling — flag removes the tackle, not the traffic. Adults most often injure their FINGERS (flag pulls, ball contact, falls on an outstretched hand), and sprains/strains dominate; youth players present most often with head injuries and fractures (Locke 2025, Sports Health, PMID 40145666). The female-specific 10-year analysis confirms the same pattern for women: fingers are the #1 injured body part (22.6%), strains/sprains the top diagnosis, with adolescents carrying the largest share (Balachandran 2025, Orthop J Sports Med, PMID 40810127). Practical reading: hand/finger care belongs in the injury model of a flag app (taping, early reporting of jammed fingers), collision awareness belongs in practice design, and "it''s just flag" is not a reason to skip reporting an injury.',
  'NEISS 10-year data: collisions are the #1 mechanism (35.7%) even without tackling; fingers are the most-injured adult body part — in men and women alike. Flag deletes the tackle, not the traffic or the flag-pull hand.',
  'strong', 'high',
  ARRAY['all_athletes','adult_athletes','female_athletes','youth_athletes'],
  ARRAY['Report jammed/sprained fingers — early buddy-taping beats playing through a worsening one','Design practice traffic patterns to reduce blind-side collision exposure','Youth: head-impact awareness even in flag — collisions still happen'],
  ARRAY['A finger that is deformed, dislocated, or cannot straighten needs a clinician, not tape','Head impact with any symptoms: stop play, concussion protocol — flag is not immune'],
  ARRAY[]::text[],
  '{"evidence_tier":"flag-direct","top_adult_site":"fingers","top_mechanism":"player-player collision (35.7%)"}'::jsonb,
  'flag_football', true, 'approved', now(), now(),
  'strength_conditioning_coach', 'strength_conditioning_coach',
  'Flag-direct tier. Locke 2025 (PMID 40145666, doi:10.1177/19417381251326575) + Balachandran 2025 (PMID 40810127, doi:10.1177/23259671251360345), verified on PubMed 2026-07-14.',
  now(), now()
WHERE NOT EXISTS (SELECT 1 FROM knowledge_base_entries WHERE topic = 'flag_specific_injury_epidemiology_fingers_collisions');

-- 3. Elite flag: injury prevalence + anthropometric risk ----------------------
INSERT INTO knowledge_base_entries
  (entry_type, topic, question, answer, summary, evidence_strength, consensus_level,
   applicable_to, best_practices, safety_warnings, contraindications,
   dosage_guidelines, sport_specificity, is_merlin_approved, merlin_approval_status,
   merlin_submitted_at, merlin_approved_at, merlin_submitted_by_role,
   merlin_approved_by_role, merlin_approval_notes, created_at, updated_at)
SELECT
  'injury', 'flag_specific_elite_injury_prevalence_anthropometrics',
  'How common are injuries at the elite/national-team level of flag football?',
  'Very common: in 108 national-team flag players (34 women, 74 men), 62% reported injuries (Vázquez-Villarreal, Sports, PMID 42043072). The same study links anthropometric characteristics (arm girths, tibia length, muscle mass, hip circumference) to injury odds with SEX-SPECIFIC cut-offs — evidence that flag injury risk profiles differ between male and female athletes and that one-size risk models are wrong. For the app this supports two things: (1) elite/national-team commitment is a genuinely high-exposure context — the engine''s taper and congestion guards matter most exactly there; (2) monitoring should be cohort-aware (sex, age, level) rather than scored against a single adult-male baseline.',
  'Elite flag (108 national-team players): 62% injury prevalence, with SEX-SPECIFIC anthropometric risk cut-offs — flag risk models must be cohort-aware, not one-size.',
  'moderate', 'emerging',
  ARRAY['all_athletes','adult_athletes','female_athletes'],
  ARRAY['National-team weeks are the highest-exposure context — respect the taper and congestion guards','Expect and monitor for soft-tissue injury clusters around tournaments','Cohort-aware baselines (sex, age, level) over one-size thresholds'],
  ARRAY['Anthropometric associations are risk MARKERS, not verdicts — never body-shame an athlete over a measurement'],
  ARRAY[]::text[],
  '{"evidence_tier":"flag-direct","prevalence":"62% of 108 national-team players"}'::jsonb,
  'flag_football', true, 'approved', now(), now(),
  'strength_conditioning_coach', 'strength_conditioning_coach',
  'Flag-direct tier. Vázquez-Villarreal (PMID 42043072, doi:10.3390/sports14040140), verified on PubMed 2026-07-14.',
  now(), now()
WHERE NOT EXISTS (SELECT 1 FROM knowledge_base_entries WHERE topic = 'flag_specific_elite_injury_prevalence_anthropometrics');

-- 4. HS female flag: injury rate + the mental-health upside -------------------
INSERT INTO knowledge_base_entries
  (entry_type, topic, question, answer, summary, evidence_strength, consensus_level,
   applicable_to, best_practices, safety_warnings, contraindications,
   dosage_guidelines, sport_specificity, is_merlin_approved, merlin_approval_status,
   merlin_submitted_at, merlin_approved_at, merlin_submitted_by_role,
   merlin_approved_by_role, merlin_approval_notes, created_at, updated_at)
SELECT
  'injury', 'flag_specific_hs_female_injury_rate_wellbeing',
  'How risky is a season of high-school flag football for female athletes — and is it worth it?',
  'A prospective season of high-school girls'' flag football recorded 7.25 injuries per 1000 exposure-hours — real but moderate, and notably NO single variable predicted who got injured (Brna 2025, Clin J Sport Med, PMID 40214269). That prediction failure is itself informative: it supports multi-signal monitoring (wellness + load + readiness together) over any single-number risk score — which is exactly how this app is built. The same study found the upside: flag participation was associated with significantly HIGHER in-season energy levels versus non-athletes, independent of physical-activity volume — evidence that the sport itself carries a mental-health benefit. Play, monitor broadly, and do the prevention work; don''t chase a single magic risk number.',
  'HS female flag: 7.25 injuries/1000 exposure-hours; no single variable predicted injury (supports multi-signal monitoring over single scores); participation was associated with higher in-season energy levels.',
  'moderate', 'emerging',
  ARRAY['female_athletes','youth_athletes','all_athletes'],
  ARRAY['Monitor multiple signals (wellness + load + readiness) — single-variable prediction failed in the data','Keep the NMT prevention block — moderate rates still include ACL-pattern injuries','Value the well-being upside: consistent participation is itself protective of energy/mood'],
  ARRAY[]::text[],
  ARRAY[]::text[],
  '{"evidence_tier":"flag-direct","rate":"7.25 injuries/1000 exposure-hours"}'::jsonb,
  'flag_football', true, 'approved', now(), now(),
  'strength_conditioning_coach', 'strength_conditioning_coach',
  'Flag-direct tier. Brna 2025 (PMID 40214269, doi:10.1097/JSM.0000000000001362), verified on PubMed 2026-07-14.',
  now(), now()
WHERE NOT EXISTS (SELECT 1 FROM knowledge_base_entries WHERE topic = 'flag_specific_hs_female_injury_rate_wellbeing');

-- 5. ACWR honesty: what the only RCT actually found ---------------------------
INSERT INTO knowledge_base_entries
  (entry_type, topic, question, answer, summary, evidence_strength, consensus_level,
   applicable_to, best_practices, safety_warnings, contraindications,
   dosage_guidelines, sport_specificity, is_merlin_approved, merlin_approval_status,
   merlin_submitted_at, merlin_approved_at, merlin_submitted_by_role,
   merlin_approved_by_role, merlin_approval_notes, created_at, updated_at)
SELECT
  'training_method', 'acwr_evidence_honest_status',
  'Does managing my training by the ACWR (acute:chronic workload ratio) actually prevent injuries?',
  'Honestly: the ratio is a useful DESCRIPTION of how your recent load compares to your base, but the strong causal claims made for it have not survived testing. The only cluster-randomised trial of ACWR-guided load management (482 elite youth footballers over a full season) found NO reduction in health problems versus normal coaching (Dalen-Lorentsen 2021, BJSM, PMID 33036995), and methodological work shows whether ACWR even associates with injury depends heavily on the analysis choices. That is why this app treats ACWR zones as ADVISORY bands, weights subjective wellness and sleep more heavily than the ratio in your readiness score, and never shows you an "injury risk multiplier" as if it were a fact. The genuinely load-bearing principles remain: do not spike your load after time off (ramp ~10-15%/week), keep training consistently (chronic base is protective), and respect how you actually feel — the wellness check-in carries the stronger evidence.',
  'The only RCT of ACWR-guided load management found no injury-prevention effect (Dalen-Lorentsen 2021). ACWR stays as an advisory descriptor here; wellness + sleep carry more readiness weight, and no fabricated risk multipliers are shown.',
  'strong', 'high',
  ARRAY['all_athletes'],
  ARRAY['Treat ACWR zones as advisory context, not verdicts','Never spike load after a layoff — ramp ~10-15%/week (this survives the ACWR critique)','Trust the multi-signal readiness score over any single ratio','Log honestly — subjective wellness is the stronger-evidenced monitoring signal (Saw 2016)'],
  ARRAY[]::text[],
  ARRAY[]::text[],
  '{"evidence_tier":"flag-direct-adjacent","rct":"Dalen-Lorentsen 2021, 482 athletes, null result"}'::jsonb,
  'flag_football', true, 'approved', now(), now(),
  'strength_conditioning_coach', 'strength_conditioning_coach',
  'Dalen-Lorentsen 2021 (PMID 33036995, doi:10.1136/bjsports-2020-103003), verified on PubMed 2026-07-14. Anchors the 2026-07-14 readiness re-weighting + risk-multiplier retirement.',
  now(), now()
WHERE NOT EXISTS (SELECT 1 FROM knowledge_base_entries WHERE topic = 'acwr_evidence_honest_status');

-- 6. The NMT block itself — what it is and why it is in the warm-up -----------
INSERT INTO knowledge_base_entries
  (entry_type, topic, question, answer, summary, evidence_strength, consensus_level,
   applicable_to, best_practices, safety_warnings, contraindications,
   dosage_guidelines, sport_specificity, is_merlin_approved, merlin_approval_status,
   merlin_submitted_at, merlin_approved_at, merlin_submitted_by_role,
   merlin_approved_by_role, merlin_approval_notes, created_at, updated_at)
SELECT
  'training_method', 'nmt_acl_prevention_block',
  'What is the NMT block in my warm-up and can I skip it?',
  'The NMT (neuromuscular training) block is the ~10-minute injury-prevention segment on your quality training days: lateral hop-and-stick landings, single-leg balance, drop-land mechanics, deceleration-to-stop runs, Copenhagen adductor work — plus the Nordic curls already in your warm-up. It is the flag-football equivalent of FIFA 11+, the warm-up class of program that roughly HALVES ACL injury in female athletes across the meta-analytic literature, with meaningful reductions in males too. Flag''s own injury data shows why it earns its minutes: the sport''s signature serious injury is the non-contact ACL tear from a cut or sudden stop (87% non-contact in the girls'' HS surge data), and almost none of the injured athletes had done any prevention program. Skipping it saves 10 minutes and spends them on ACL odds. The consistency matters more than intensity: crisp, controlled reps, 3-4 days a week, year-round.',
  'The ~10-min NMT segment on quality days is FIFA-11+-class ACL prevention — the single best-evidenced injury-risk reduction available to a flag athlete. Do it consistently; control beats intensity.',
  'strong', 'high',
  ARRAY['all_athletes','female_athletes','youth_athletes'],
  ARRAY['Quality over speed: stick every landing 2s, silent feet, knee over toes','3-4x/week on training days, year-round — consistency drives the effect','Deceleration reps ARE the cut-protection: stop tall and controlled in 3 steps','Copenhagen + Nordic stay in even when short on time'],
  ARRAY['Sharp knee pain on landing or cutting is a stop-and-assess, not a push-through'],
  ARRAY[]::text[],
  '{"duration":"~10 min","frequency":"3-4x/week (quality days)","components":"hop-and-stick, single-leg balance, drop-land, decel runs, Copenhagen, Nordic"}'::jsonb,
  'flag_football', true, 'approved', now(), now(),
  'strength_conditioning_coach', 'strength_conditioning_coach',
  'NMT/ACL meta-analytic literature + flag-direct anchor Grewal 2025 (PMID 41208758). Matches the NMT_PREVENTION_SEGMENT shipped in daily-protocol 2026-07-14.',
  now(), now()
WHERE NOT EXISTS (SELECT 1 FROM knowledge_base_entries WHERE topic = 'nmt_acl_prevention_block');
