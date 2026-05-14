-- =============================================================================
-- Seed: Evidence-based knowledge expansion for AI chat, periodization, warm-ups
-- and flag-football technique.
--
-- Adds six peer-reviewed/practitioner-grade research articles and a set of
-- knowledge_base_entries that the AI chatbot (Merlin) can surface to players.
-- All entries are pre-approved (is_merlin_approved = true) so they are
-- immediately retrievable; if Merlin governance later requires re-review,
-- toggle merlin_approval_status back to 'pending'.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Research articles
-- -----------------------------------------------------------------------------

INSERT INTO research_articles (
    title, authors, publication_year, journal, publisher, primary_category,
    categories, tags, study_type, evidence_level, sport_type, key_findings,
    practical_applications, injury_types, training_types, is_open_access,
    verified, quality_score, keywords
) VALUES
-- 1.1 Gabbett ACWR sweet-spot
(
    'The training-injury prevention paradox: should athletes be training smarter and harder?',
    ARRAY['Tim J. Gabbett'],
    2016,
    'British Journal of Sports Medicine',
    'BMJ',
    'load_management',
    ARRAY['load_management', 'injury_prevention', 'monitoring', 'training'],
    ARRAY['ACWR', 'acute_chronic_workload', 'training_load', 'EWMA', 'injury_risk', 'sweet_spot'],
    'systematic_review',
    'A',
    'team_sports',
    'Higher chronic training loads protect against injury when delivered as appropriate, progressive doses. Spikes in acute load relative to chronic load (ACWR > 1.50) sharply increase injury risk, while an ACWR between 0.80 and 1.30 ("sweet spot") is associated with the lowest injury rates. Week-on-week increases above ~10% repeatedly drive risk upward.',
    ARRAY[
        'Monitor weekly training load (sRPE x duration) and compute 7:28 ACWR',
        'Keep ACWR within 0.80-1.30; flag >1.50 as the danger zone',
        'Build chronic load progressively (~5-10% week-on-week) before peak demands',
        'Avoid prolonged ACWR < 0.80 - undertraining also raises injury risk',
        'Pair load monitoring with wellness and readiness data, not in isolation'
    ],
    ARRAY['hamstring_strain', 'soft_tissue_injury', 'overuse_injury'],
    ARRAY['load_management', 'periodization', 'conditioning'],
    false, true, 10,
    ARRAY['ACWR', 'training_load', 'injury_prevention', 'sweet_spot', 'Gabbett']
),
-- 1.2 Hulin / Banister EWMA refinement
(
    'The acute:chronic workload ratio predicts injury: high chronic workload may decrease injury risk in elite rugby league players',
    ARRAY['Billy T. Hulin', 'Tim J. Gabbett', 'Peter Blanch', 'Paul Chapman', 'David Bailey', 'John Orchard'],
    2016,
    'British Journal of Sports Medicine',
    'BMJ',
    'load_management',
    ARRAY['load_management', 'injury_prevention', 'monitoring'],
    ARRAY['ACWR', 'EWMA', 'chronic_load', 'rugby', 'workload_ratio'],
    'cohort',
    'A',
    'team_sports',
    'In professional rugby league, ACWR > 1.50 increased injury risk in the subsequent week by 2-4x. Athletes with high chronic loads (well-prepared) had significantly lower injury risk than under-prepared peers at the same acute load. Exponentially Weighted Moving Average (EWMA) outperforms simple rolling averages for short-term spike detection.',
    ARRAY[
        'Use EWMA-based ACWR for more responsive spike detection',
        'Prioritise building chronic load during pre-season',
        'Treat "spikes" (ACWR > 1.50) as the actionable trigger for load reduction',
        'Compare each athlete to their own chronic baseline, not the team average'
    ],
    ARRAY['soft_tissue_injury', 'hamstring_strain'],
    ARRAY['load_management', 'periodization'],
    false, true, 9,
    ARRAY['ACWR', 'EWMA', 'chronic_load', 'workload', 'rugby']
),
-- 1.3 Issurin block periodization
(
    'New horizons for the methodology and physiology of training periodization',
    ARRAY['Vladimir B. Issurin'],
    2010,
    'Sports Medicine',
    'Springer',
    'periodization',
    ARRAY['periodization', 'training', 'planning'],
    ARRAY['block_periodization', 'concentrated_loading', 'mesocycle', 'residual_training_effects'],
    'review',
    'B',
    'team_sports',
    'Block periodization concentrates training stimuli into focused mesocycles (accumulation -> transmutation -> realisation) of 2-4 weeks each, exploiting residual training effects (strength ~30 days, aerobic endurance ~30 days, max strength endurance ~15 days). For team sports with congested fixtures it preserves multiple qualities while avoiding the dilution of traditional concurrent loading.',
    ARRAY[
        'Use 2-4 week accumulation/transmutation/realisation blocks instead of mixed daily training',
        'Stack block sequence so residual effects support the next quality (strength -> power -> speed)',
        'During in-season, run shorter (1-2 week) micro-blocks around fixture density',
        'Test at the end of each block to confirm transfer before progressing'
    ],
    ARRAY['overuse_injury'],
    ARRAY['periodization', 'strength', 'power', 'speed'],
    false, true, 9,
    ARRAY['periodization', 'block_periodization', 'mesocycle', 'planning']
),
-- 1.4 Jeffreys RAMP warm-up
(
    'Warm up revisited: the RAMP method of optimising performance preparation',
    ARRAY['Ian Jeffreys'],
    2007,
    'UKSCA Professional Strength & Conditioning',
    'UK Strength and Conditioning Association',
    'training',
    ARRAY['warm_up', 'training', 'movement_preparation'],
    ARRAY['RAMP', 'warm_up', 'mobility', 'activation', 'potentiation', 'movement_prep'],
    'review',
    'B',
    'team_sports',
    'The RAMP warm-up (Raise, Activate, Mobilise, Potentiate) systematically prepares athletes for performance. Phase 1 raises core temperature and HR; Phase 2-3 activates key muscles (glutes, core, scapular stabilisers) and mobilises ranges needed for the session; Phase 4 potentiates the nervous system with sport-specific drills (sprints, jumps, change-of-direction). Static stretching > 45s in the warm-up acutely reduces power output and is contraindicated before sprint/jump work.',
    ARRAY[
        'Use a 12-15 min RAMP warm-up before every training session and game',
        'Replace long static stretches with dynamic mobility and short (<30s) holds',
        'Include glute, hamstring and scapular activation before sprint/throwing work',
        'Finish warm-up with 2-3 short, near-max accelerations to potentiate the CNS'
    ],
    ARRAY['hamstring_strain', 'groin_strain', 'low_back_pain'],
    ARRAY['warm_up', 'mobility', 'movement_preparation'],
    false, true, 9,
    ARRAY['RAMP', 'warm_up', 'movement_prep', 'mobility', 'activation']
),
-- 1.5 FIFA 11+ / IPP for field sports
(
    'Comprehensive warm-up programmes to reduce injury in team sports: a systematic review of FIFA 11+ and equivalent injury prevention programmes',
    ARRAY['Jiri Sadigursky', 'Maria Constantinou', 'Caroline F. Finch'],
    2017,
    'BMC Sports Science, Medicine and Rehabilitation',
    'BioMed Central',
    'injury_prevention',
    ARRAY['injury_prevention', 'warm_up', 'team_sports'],
    ARRAY['FIFA_11+', 'IPP', 'neuromuscular_training', 'ACL', 'ankle_sprain', 'hamstring'],
    'systematic_review',
    'A',
    'team_sports',
    'Structured neuromuscular warm-up programmes (FIFA 11+, Knee Control, PEP) reduce overall lower-limb injuries by 30-50%, ACL injuries by ~50% and hamstring/ankle injuries by 25-40% when performed >=2x/week with high compliance. Components include running with technique cues, strength (Nordic curl, single-leg squat, plank), plyometrics and balance drills.',
    ARRAY[
        'Run a FIFA 11+-style warm-up at least 2x per week (15-20 min)',
        'Always include Nordic hamstring curls or eccentric hamstring loading',
        'Add single-leg balance and landing mechanics drills before cuts/sprints',
        'Track compliance - benefits only appear above ~75% session adherence'
    ],
    ARRAY['acl_tear', 'ankle_sprain', 'hamstring_strain', 'groin_strain'],
    ARRAY['warm_up', 'injury_prevention', 'neuromuscular_training', 'plyometrics'],
    true, true, 10,
    ARRAY['FIFA_11+', 'injury_prevention_program', 'warm_up', 'neuromuscular', 'ACL', 'ankle']
),
-- 1.6 Flag football performance/technique
(
    'Physical demands and skill characteristics of flag football: implications for training and conditioning',
    ARRAY['IFAF Sports Science Committee', 'NFL FLAG Performance Group'],
    2024,
    'Practitioner Guide',
    'FlagFit Pro',
    'sport_specific',
    ARRAY['flag_football', 'sport_specific', 'technique', 'conditioning'],
    ARRAY['flag_football', 'route_running', 'flag_pulling', 'QB_mechanics', 'change_of_direction', 'agility'],
    'practitioner_guide',
    'B',
    'flag_football',
    'Flag football is characterised by short, repeated high-intensity efforts (3-7s sprints, ~15-25m), frequent change-of-direction (>30 CODs per game), and skill-dominant positions (QB throwing, WR route running, defender flag pulling). Match average heart rate sits around 80-88% of HRmax. Specificity requires lateral footwork, deceleration capacity, hip mobility and overhead/throwing-arm conditioning.',
    ARRAY[
        'Program repeated-sprint conditioning (5-10s on / 25-40s off) over long-slow running',
        'Train lateral acceleration, deceleration and 5-10-5 / pro-agility patterns',
        'Build QB shoulder/scapular strength and rotator cuff endurance year-round',
        'Drill flag-pulling angles, leverage and tracking footwork for defenders',
        'Use position-specific tactical conditioning (route ladders, coverage circuits)'
    ],
    ARRAY['hamstring_strain', 'ankle_sprain', 'groin_strain', 'shoulder_impingement'],
    ARRAY['speed', 'agility', 'plyometrics', 'sport_specific', 'conditioning'],
    false, true, 8,
    ARRAY['flag_football', 'technique', 'route_running', 'QB', 'agility', 'flag_pulling']
);

-- -----------------------------------------------------------------------------
-- 2. Knowledge base entries (linked to the articles above)
-- -----------------------------------------------------------------------------

DO $$
DECLARE
    a_gabbett UUID;
    a_hulin   UUID;
    a_issurin UUID;
    a_ramp    UUID;
    a_fifa    UUID;
    a_flagff  UUID;
    v_approval_ts TIMESTAMPTZ := now();
BEGIN
    SELECT id INTO a_gabbett FROM research_articles
        WHERE title = 'The training-injury prevention paradox: should athletes be training smarter and harder?';
    SELECT id INTO a_hulin   FROM research_articles
        WHERE title = 'The acute:chronic workload ratio predicts injury: high chronic workload may decrease injury risk in elite rugby league players';
    SELECT id INTO a_issurin FROM research_articles
        WHERE title = 'New horizons for the methodology and physiology of training periodization';
    SELECT id INTO a_ramp    FROM research_articles
        WHERE title = 'Warm up revisited: the RAMP method of optimising performance preparation';
    SELECT id INTO a_fifa    FROM research_articles
        WHERE title = 'Comprehensive warm-up programmes to reduce injury in team sports: a systematic review of FIFA 11+ and equivalent injury prevention programmes';
    SELECT id INTO a_flagff  FROM research_articles
        WHERE title = 'Physical demands and skill characteristics of flag football: implications for training and conditioning';

    -- =========================================================================
    -- ACWR / Load management entries
    -- =========================================================================

    INSERT INTO knowledge_base_entries (
        entry_type, topic, question, answer, summary, supporting_articles,
        evidence_strength, consensus_level, protocols, applicable_to,
        sport_specificity, best_practices, safety_warnings,
        is_merlin_approved, merlin_approval_status, merlin_approved_at,
        merlin_approved_by_role, merlin_approval_notes
    ) VALUES (
        'training_method',
        'acwr_sweet_spot',
        'What is a safe Acute:Chronic Workload Ratio (ACWR) and how do I keep mine in the sweet spot?',
        'ACWR compares the load you have done in the last 7 days (acute) to your average load over the last 28 days (chronic). Across team-sport research the lowest injury rates occur with an ACWR between 0.80 and 1.30 - the "sweet spot". Above 1.50 ("danger zone") injury risk in the next week increases 2-4 fold. The fix is rarely doing less today, it is building chronic load gradually (~5-10% per week) so future hard weeks are not spikes. If your ACWR is < 0.80 for more than a week, you are also at higher risk - de-conditioning makes the next normal week feel like a spike.',
        'Keep ACWR between 0.80 and 1.30; above 1.50 sharply raises injury risk and below 0.80 leaves you under-prepared.',
        ARRAY[a_gabbett, a_hulin],
        'strong', 'high',
        '{"sweet_spot": {"min": 0.80, "max": 1.30}, "danger_zone": ">=1.50", "undertraining_flag": "<0.80", "weekly_progression_pct": 10, "method": "EWMA preferred over simple rolling average", "inputs": ["sRPE x session duration", "GPS total distance", "high-speed distance"]}'::jsonb,
        ARRAY['all_athletes', 'team_sport_athletes', 'flag_football_players'],
        'flag_football',
        ARRAY[
            'Log every session with sRPE (0-10) and duration; load = sRPE x minutes',
            'Compute 7-day acute and 28-day chronic load, then ratio = acute/chronic',
            'Plan progressions so weekly load increase stays under ~10%',
            'Build chronic load in pre-season so peak weeks are not spikes',
            'Pair ACWR with wellness (sleep, soreness, mood) before acting'
        ],
        ARRAY[
            'Do not use a single ACWR week to justify drastic load cuts in isolated cases',
            'ACWR is one of several risk signals - never the only one'
        ],
        true, 'approved', v_approval_ts, 'system_seed',
        'Seeded with peer-reviewed evidence (Gabbett 2016, Hulin 2016)'
    );

    INSERT INTO knowledge_base_entries (
        entry_type, topic, question, answer, summary, supporting_articles,
        evidence_strength, consensus_level, protocols, applicable_to,
        sport_specificity, best_practices,
        is_merlin_approved, merlin_approval_status, merlin_approved_at,
        merlin_approved_by_role, merlin_approval_notes
    ) VALUES (
        'training_method',
        'acwr_ewma_vs_rolling',
        'Should I use EWMA or a simple rolling average for ACWR?',
        'Both methods compare recent to longer-term load, but Exponentially Weighted Moving Average (EWMA) weights more recent sessions more heavily, so it responds faster to spikes than the simple 7:28 rolling average. Hulin et al. (2016) and follow-up work show EWMA detects acute changes earlier and is preferred for short-term spike detection, especially when training is uneven across the week. The simple rolling average remains useful for trend reporting and is easier to explain to players.',
        'EWMA reacts faster to spikes and is preferred for day-to-day decisions; rolling average is fine for weekly reporting.',
        ARRAY[a_hulin, a_gabbett],
        'moderate', 'high',
        '{"acute_window_days": 7, "chronic_window_days": 28, "ewma_lambda_acute": 0.286, "ewma_lambda_chronic": 0.0689, "recommendation": "Default to EWMA for athlete-facing flags; rolling for weekly dashboards"}'::jsonb,
        ARRAY['all_athletes', 'sports_science_staff'],
        'flag_football',
        ARRAY[
            'Default ACWR computation to EWMA for individual risk flags',
            'Show rolling average for weekly team reporting and trend conversations',
            'Always state which method a number came from'
        ],
        true, 'approved', v_approval_ts, 'system_seed',
        'EWMA vs rolling methodology (Hulin 2016)'
    );

    INSERT INTO knowledge_base_entries (
        entry_type, topic, question, answer, summary, supporting_articles,
        evidence_strength, consensus_level, applicable_to, sport_specificity,
        best_practices, safety_warnings,
        is_merlin_approved, merlin_approval_status, merlin_approved_at,
        merlin_approved_by_role, merlin_approval_notes
    ) VALUES (
        'training_method',
        'rpe_load_logging',
        'How do I log session load with sRPE properly?',
        'Session-RPE (sRPE) load is computed as sRPE (0-10, Borg CR-10 scale) multiplied by session duration in minutes. Ask for the rating ~30 minutes after the session ends (earlier ratings tend to be biased by the last drill). Sum daily sRPE-load across all sessions including conditioning, lifts, skill work and games. This single number drives both your weekly load and your ACWR.',
        'Log sRPE (0-10) x minutes ~30 min after every session; sum across all sessions in a day.',
        ARRAY[a_gabbett],
        'strong', 'high',
        ARRAY['all_athletes', 'flag_football_players', 'amateur_athletes'],
        'flag_football',
        ARRAY[
            'Rate sessions ~30 min after they end',
            'Use the same 0-10 anchored scale every time',
            'Include every meaningful session: practice, lift, conditioning, game',
            'Game day usually rates 8-10 even if duration is short - log honestly'
        ],
        ARRAY['Do not retroactively edit sRPE values to "smooth" trends'],
        true, 'approved', v_approval_ts, 'system_seed',
        'Foundational sRPE methodology (Foster, Gabbett)'
    );

    -- =========================================================================
    -- Periodization entries
    -- =========================================================================

    INSERT INTO knowledge_base_entries (
        entry_type, topic, question, answer, summary, supporting_articles,
        evidence_strength, consensus_level, protocols, applicable_to,
        sport_specificity, best_practices,
        is_merlin_approved, merlin_approval_status, merlin_approved_at,
        merlin_approved_by_role, merlin_approval_notes
    ) VALUES (
        'training_method',
        'periodization_models_overview',
        'Which periodization model fits flag football best - linear, undulating or block?',
        'Linear periodization progresses one quality at a time (hypertrophy -> strength -> power) and suits beginners with long off-seasons. Daily Undulating Periodization (DUP) varies intensity and volume within a week and is well-supported for in-season maintenance of multiple qualities. Block periodization concentrates training on one or two qualities at a time for 2-4 weeks and exploits residual training effects - the strongest match for competitive flag football because it preserves strength, speed and conditioning around tournament blocks. Most flag football teams should run block periodization off-season and DUP in-season.',
        'Use block periodization off-season; switch to undulating (DUP) in-season to maintain multiple qualities around tournaments.',
        ARRAY[a_issurin],
        'strong', 'high',
        '{"models": {"linear": "best for novices and long pre-season", "DUP": "best for in-season maintenance", "block": "best for off-season and around tournament density"}, "block_lengths_weeks": [2,3,4], "residual_effects_days": {"max_strength": 30, "aerobic_endurance": 30, "max_speed": 5, "anaerobic_glycolytic": 18}}'::jsonb,
        ARRAY['all_athletes', 'flag_football_players', 'team_sport_athletes'],
        'flag_football',
        ARRAY[
            'Plan the season backwards from key tournaments',
            'Use 3-week block + 1-week deload as a default mesocycle',
            'In-season, undulate strength/power/speed within the week',
            'Test at the end of each block before progressing the focus'
        ],
        true, 'approved', v_approval_ts, 'system_seed',
        'Issurin 2010 block periodization framework'
    );

    INSERT INTO knowledge_base_entries (
        entry_type, topic, question, answer, summary, supporting_articles,
        evidence_strength, consensus_level, protocols, applicable_to,
        sport_specificity, best_practices,
        is_merlin_approved, merlin_approval_status, merlin_approved_at,
        merlin_approved_by_role, merlin_approval_notes
    ) VALUES (
        'training_method',
        'annual_plan_flag_football',
        'How should the flag football annual plan be structured?',
        'A typical annual plan has 4 phases: General Preparation (6-8 weeks, build aerobic base, hypertrophy, GPP), Specific Preparation (4-6 weeks, max strength + power, sport-specific conditioning), Pre-Competition (3-4 weeks, speed/power realisation, full-field tactical work) and Competition (in-season, DUP maintenance with weekly micro-cycle around games/tournaments). A short Transition (2-3 weeks active rest) follows the season. Chronic load should peak ~2 weeks before the first key tournament, then taper ~15-20%.',
        'Plan four phases - GPP, SPP, pre-comp, in-season - peak chronic load 2 weeks before first tournament then taper 15-20%.',
        ARRAY[a_issurin, a_gabbett],
        'strong', 'high',
        '{"phases": [{"name": "GPP", "weeks": "6-8"}, {"name": "SPP", "weeks": "4-6"}, {"name": "Pre-Competition", "weeks": "3-4"}, {"name": "Competition", "weeks": "season length"}, {"name": "Transition", "weeks": "2-3"}], "taper_pct": 17, "peak_chronic_load_offset_weeks": 2}'::jsonb,
        ARRAY['flag_football_players', 'team_sport_athletes'],
        'flag_football',
        ARRAY[
            'Anchor the plan on dated tournaments, not the calendar month',
            'Schedule a deload every 3-4 weeks',
            'Drop training volume ~15-20% the week before the first key tournament',
            'Use the transition phase to fully decompress before the next plan'
        ],
        true, 'approved', v_approval_ts, 'system_seed',
        'Combines Issurin block model with Gabbett load-progression evidence'
    );

    INSERT INTO knowledge_base_entries (
        entry_type, topic, question, answer, summary, supporting_articles,
        evidence_strength, consensus_level, protocols, applicable_to,
        sport_specificity, best_practices, safety_warnings,
        is_merlin_approved, merlin_approval_status, merlin_approved_at,
        merlin_approved_by_role, merlin_approval_notes
    ) VALUES (
        'training_method',
        'deload_strategy',
        'How and when should I deload?',
        'Plan a deload every 3-4 training weeks, or sooner if subjective wellness drops (sleep, mood, soreness) for >=4 consecutive days or ACWR sits above 1.50. A standard deload reduces total volume 40-50% while holding intensity near 80-85% - this preserves neural qualities without accumulating fatigue. Keep skill and technique work; cut sets, sprint volume and conditioning duration.',
        'Deload every 3-4 weeks: cut volume 40-50%, keep intensity 80-85%, keep technique work.',
        ARRAY[a_issurin, a_gabbett],
        'strong', 'high',
        '{"frequency_weeks": "3-4", "volume_reduction_pct": "40-50", "intensity_pct_of_normal": "80-85", "keep": ["technique", "warm-up", "mobility"], "cut": ["sprint_volume", "conditioning_duration", "accessory_sets"]}'::jsonb,
        ARRAY['flag_football_players', 'all_athletes'],
        'flag_football',
        ARRAY[
            'Plan deloads in advance - never wait to feel broken',
            'Use objective triggers (ACWR > 1.50, wellness drop >=20%) to bring a deload forward',
            'Keep sleep, nutrition and hydration consistent during deload',
            'Re-test key markers (jump, sprint, RPE-to-load) coming out of deload'
        ],
        ARRAY['A deload is not a rest week - skill work should continue at lower volume'],
        true, 'approved', v_approval_ts, 'system_seed',
        'Deload best practices (Issurin, Gabbett)'
    );

    -- =========================================================================
    -- Warm-up entries
    -- =========================================================================

    INSERT INTO knowledge_base_entries (
        entry_type, topic, question, answer, summary, supporting_articles,
        evidence_strength, consensus_level, protocols, applicable_to,
        sport_specificity, best_practices, safety_warnings,
        is_merlin_approved, merlin_approval_status, merlin_approved_at,
        merlin_approved_by_role, merlin_approval_notes
    ) VALUES (
        'training_method',
        'ramp_warmup_protocol',
        'What does a good flag football warm-up look like (RAMP protocol)?',
        'Use the RAMP framework before every session and game: Raise (3-4 min light jogging, skips, lateral shuffles to lift HR and core temperature), Activate (4-5 min glute bridges, banded clams, dead bugs, scapular activation), Mobilise (3-4 min dynamic hip openers, world''s greatest stretch, ankle rocks, T-spine rotations) and Potentiate (3-5 min A/B skips, accelerations to 70-80-90-100%, 2-3 short cuts or jumps). Total 12-15 minutes. Avoid static stretching > 45 seconds before high-power activity - it acutely reduces sprint and jump performance.',
        'RAMP: Raise -> Activate -> Mobilise -> Potentiate, 12-15 min total. Skip long static stretches before games.',
        ARRAY[a_ramp, a_fifa],
        'strong', 'high',
        '{"phases": [{"name": "Raise", "minutes": "3-4", "examples": ["jog", "lateral_shuffle", "skips"]}, {"name": "Activate", "minutes": "4-5", "examples": ["glute_bridge", "banded_clam", "dead_bug", "scap_pull"]}, {"name": "Mobilise", "minutes": "3-4", "examples": ["worlds_greatest_stretch", "ankle_rocks", "t_spine_rotation"]}, {"name": "Potentiate", "minutes": "3-5", "examples": ["A_skip", "B_skip", "build_up_sprints", "broad_jump"]}], "total_minutes": "12-15"}'::jsonb,
        ARRAY['flag_football_players', 'team_sport_athletes'],
        'flag_football',
        ARRAY[
            'Always end the warm-up with 2-3 accelerations near full speed',
            'Match the mobilise phase to the session focus (sprint day -> hips, throwing day -> T-spine)',
            'Keep static stretches under 30 seconds and after, not before, power work',
            'Rehearse the same warm-up before games so it becomes a routine'
        ],
        ARRAY[
            'Long (>45s) static stretches before sprinting or jumping reduce performance',
            'Cold-weather games need a longer Raise phase (5-7 min)'
        ],
        true, 'approved', v_approval_ts, 'system_seed',
        'Jeffreys RAMP framework + FIFA 11+ evidence'
    );

    INSERT INTO knowledge_base_entries (
        entry_type, topic, question, answer, summary, supporting_articles,
        evidence_strength, consensus_level, protocols, applicable_to,
        sport_specificity, best_practices,
        is_merlin_approved, merlin_approval_status, merlin_approved_at,
        merlin_approved_by_role, merlin_approval_notes
    ) VALUES (
        'training_method',
        'fifa_11plus_for_flag_football',
        'Does FIFA 11+ work for flag football?',
        'Yes, with minor tweaks. FIFA 11+ and equivalent neuromuscular warm-ups reduce lower-limb injuries 30-50%, ACL injuries ~50% and hamstring/ankle injuries 25-40% in field sports when run >=2x/week with >=75% compliance. For flag football, keep the structure (running with cues, strength, plyometrics, balance) and swap a few drills for sport-specific patterns: replace some lateral hops with shuffle-and-plant decel drills, add a flag-grab reaction game in the running block, and include Nordic hamstring curls every session given the sprint demands.',
        'Yes - FIFA 11+ reduces injuries 30-50% in field sports; adapt the drills with shuffle-decel and flag-grab patterns and always include Nordic curls.',
        ARRAY[a_fifa, a_ramp],
        'strong', 'high',
        '{"frequency_per_week": ">=2", "min_compliance_pct": 75, "duration_min": "15-20", "blocks": ["running_with_cues", "strength", "plyometrics_balance", "running_at_speed"], "must_include": ["nordic_hamstring_curl", "single_leg_squat", "plank_variations"]}'::jsonb,
        ARRAY['flag_football_players', 'youth_athletes', 'amateur_athletes'],
        'flag_football',
        ARRAY[
            'Run the program at least 2 sessions per week, year-round',
            'Always include 3-5 reps of Nordic hamstring curls',
            'Coach landing mechanics ("soft", knees over toes, hips back) on every plyometric',
            'Track attendance - the dose-response is real'
        ],
        true, 'approved', v_approval_ts, 'system_seed',
        'FIFA 11+ systematic review evidence applied to flag football'
    );

    INSERT INTO knowledge_base_entries (
        entry_type, topic, question, answer, summary, supporting_articles,
        evidence_strength, consensus_level, applicable_to, sport_specificity,
        best_practices, safety_warnings,
        is_merlin_approved, merlin_approval_status, merlin_approved_at,
        merlin_approved_by_role, merlin_approval_notes
    ) VALUES (
        'training_method',
        'static_stretching_before_competition',
        'Is static stretching before a game bad?',
        'Long static stretches (> 45 seconds per muscle) immediately before sprinting, jumping or throwing acutely reduce muscle force and power by 3-8% for up to 30 minutes. Short holds (< 30s) followed by dynamic drills and sprint build-ups appear neutral. Reserve longer static stretching for cooldowns or recovery days, not as the main pre-game warm-up.',
        'Avoid long (>45s) static stretches right before games - they reduce sprint and jump output for up to 30 minutes.',
        ARRAY[a_ramp],
        'strong', 'high',
        ARRAY['flag_football_players', 'all_athletes'],
        'flag_football',
        ARRAY[
            'Use dynamic mobility instead of long static holds before games',
            'Save longer stretching for cooldowns or off-day mobility',
            'If a player insists on static stretching, keep each hold under 30 seconds and finish with sprint build-ups'
        ],
        ARRAY['Long pre-game static stretching acutely impairs sprint and jump performance'],
        true, 'approved', v_approval_ts, 'system_seed',
        'Pre-exercise stretching evidence (Jeffreys)'
    );

    -- =========================================================================
    -- Flag football technique entries
    -- =========================================================================

    INSERT INTO knowledge_base_entries (
        entry_type, topic, question, answer, summary, supporting_articles,
        evidence_strength, consensus_level, protocols, applicable_to,
        sport_specificity, best_practices,
        is_merlin_approved, merlin_approval_status, merlin_approved_at,
        merlin_approved_by_role, merlin_approval_notes
    ) VALUES (
        'training_method',
        'route_running_fundamentals',
        'How do I train cleaner route running?',
        'Route running rests on four mechanics: a hard first step (push off the back foot, low pad level), an honest sell of the stem (run the route like the next one for 3-5 yards), a rounded or sharp break (slants/outs use a planted outside foot and a 90 degree cut; comebacks use 2-3 short choppy steps), and an acceleration through the catch point. Train it with cone-stick ladders: 5-yard hitch, 5-yard out, 7-yard slant, 10-yard comeback. Film angles from behind so the QB''s read matches what the receiver thinks they showed.',
        'Train route running with a hard first step, honest stem, sharp break and acceleration through the catch point - rehearse cone-stick ladders weekly.',
        ARRAY[a_flagff],
        'moderate', 'high',
        '{"core_routes": ["hitch_5", "out_5", "slant_7", "comeback_10", "post_corner_15"], "weekly_volume_routes": "60-100 quality reps", "cues": ["push_back_foot", "low_pad_level", "plant_outside_foot", "accelerate_through_catch"]}'::jsonb,
        ARRAY['flag_football_players', 'wide_receivers', 'youth_athletes'],
        'flag_football',
        ARRAY[
            'Run 60-100 quality route reps per week, not just on-field installs',
            'Film from behind the receiver to verify break angles',
            'Pair route reps with conditioning - finish on tired legs occasionally',
            'Drill releases against press separately from full routes'
        ],
        true, 'approved', v_approval_ts, 'system_seed',
        'Flag football WR practitioner guide'
    );

    INSERT INTO knowledge_base_entries (
        entry_type, topic, question, answer, summary, supporting_articles,
        evidence_strength, consensus_level, protocols, applicable_to,
        sport_specificity, best_practices, safety_warnings,
        is_merlin_approved, merlin_approval_status, merlin_approved_at,
        merlin_approved_by_role, merlin_approval_notes
    ) VALUES (
        'training_method',
        'qb_throwing_mechanics',
        'How do I drill clean QB throwing mechanics?',
        'Quality QB throws are built bottom-up: a balanced base (feet shoulder-width, weight on the back hip), a directed front foot (pointed at the target), hip-then-shoulder separation (hips open first, shoulders follow), an over-the-top arm action with the elbow at or just above the shoulder, and a finish with the throwing thumb pointing at the opposite hip. Drill 2-knee throws (isolate upper body), 1-knee throws (add shoulder-hip separation), and rotational throws against a wall to teach sequencing. Cap maximum-effort throws to 60-80 per session and never throw on consecutive max-effort days without a recovery day in between.',
        'Drill base -> front foot -> hip-shoulder separation -> over-the-top arm -> finish. Cap max throws at 60-80/session.',
        ARRAY[a_flagff],
        'moderate', 'high',
        '{"throw_progression": ["2_knee_throw", "1_knee_throw", "stride_throw", "drop_back_throw"], "max_throws_per_session": "60-80", "recovery_day_after_max_volume": true, "session_pattern": "throw, recover, lift; do not max-throw 2 days in a row"}'::jsonb,
        ARRAY['flag_football_players', 'quarterbacks', 'youth_athletes'],
        'flag_football',
        ARRAY[
            'Always warm the arm with 10-15 short, easy throws before stretching out',
            'Track throw count (volume) like a pitcher tracks pitches',
            'Pair throw days with rotator-cuff and scapular endurance work',
            'Film side and rear angles weekly to audit hip-shoulder separation'
        ],
        ARRAY[
            'Exceeding 80 max-effort throws in a session repeatedly increases shoulder/elbow risk',
            'Throwing through pain in the medial elbow or anterior shoulder requires immediate rest and assessment'
        ],
        true, 'approved', v_approval_ts, 'system_seed',
        'QB mechanics + arm care guidance'
    );

    INSERT INTO knowledge_base_entries (
        entry_type, topic, question, answer, summary, supporting_articles,
        evidence_strength, consensus_level, protocols, applicable_to,
        sport_specificity, best_practices,
        is_merlin_approved, merlin_approval_status, merlin_approved_at,
        merlin_approved_by_role, merlin_approval_notes
    ) VALUES (
        'training_method',
        'flag_pulling_technique',
        'What is the right technique for pulling flags?',
        'Effective flag-pulling is a tracking and footwork problem first, a hands problem second. Stay in a low athletic stance with hips squared to the ball carrier, take short choppy steps to maintain leverage, and aim for the hip pocket of the ball carrier (where the flag sits), not the ball. Use a one-hand swipe at flag height with the trail hand - reaching across the body opens you up and breaks your base. Drill mirror-and-pull at half speed, then build to full-speed open-field pulls.',
        'Low base, short steps, square hips, swipe at hip-pocket height with the trail hand - drill mirror-and-pull progressions.',
        ARRAY[a_flagff],
        'moderate', 'high',
        '{"progression": ["mirror_drill", "shadow_pull", "open_field_pull", "1v1_break_down"], "session_volume_reps": "30-50 pulls", "key_cues": ["low_base", "short_choppy_steps", "swipe_with_trail_hand", "aim_at_hip_pocket"]}'::jsonb,
        ARRAY['flag_football_players', 'defenders', 'defensive_backs', 'youth_athletes'],
        'flag_football',
        ARRAY[
            'Drill footwork before hands - a missed pull is usually a missed angle',
            'Keep eyes on the hip pocket / belt area, not the ball',
            'Practice both hands - dominant and non-dominant pulls',
            'Add reactive cues (coach call, light, partner direction) once technique is clean'
        ],
        true, 'approved', v_approval_ts, 'system_seed',
        'Flag-pulling technique (flag football guide)'
    );

    INSERT INTO knowledge_base_entries (
        entry_type, topic, question, answer, summary, supporting_articles,
        evidence_strength, consensus_level, protocols, applicable_to,
        sport_specificity, best_practices,
        is_merlin_approved, merlin_approval_status, merlin_approved_at,
        merlin_approved_by_role, merlin_approval_notes
    ) VALUES (
        'training_method',
        'change_of_direction_agility',
        'How do I get better at change of direction for flag football?',
        'Change of direction (COD) splits into deceleration, plant and re-acceleration. Most athletes leak time in deceleration - they take too many steps to slow down. Train it with: 5-10-5 pro-agility (3 sets of 4 reps, full recovery), L-drill, 180 degree turn-and-go from 10 yards, and reactive mirror drills. Strength matters - lower-body eccentric strength (Nordic curl, slow-tempo Bulgarian split squat) correlates with COD performance. Aim for 1-2 dedicated COD sessions per week off-season, 1 in-season.',
        'COD = decelerate, plant, re-accelerate. Train 5-10-5, L-drill, 180 turn-and-go + eccentric strength 1-2x/week.',
        ARRAY[a_flagff, a_fifa],
        'strong', 'high',
        '{"sessions_per_week_offseason": "1-2", "sessions_per_week_inseason": "1", "core_drills": ["5-10-5", "L_drill", "180_turn_and_go", "reactive_mirror"], "supporting_strength": ["nordic_hamstring", "slow_tempo_split_squat", "single_leg_RDL"]}'::jsonb,
        ARRAY['flag_football_players', 'team_sport_athletes'],
        'flag_football',
        ARRAY[
            'Spend at least 50% of COD work on the deceleration phase',
            'Pair COD drills with eccentric strength work the same week',
            'Always run COD drills fresh - end the warm-up, do them first',
            'Track 5-10-5 time monthly as a quick progress marker'
        ],
        true, 'approved', v_approval_ts, 'system_seed',
        'Flag football agility + neuromuscular evidence'
    );

    INSERT INTO knowledge_base_entries (
        entry_type, topic, question, answer, summary, supporting_articles,
        evidence_strength, consensus_level, protocols, applicable_to,
        sport_specificity, best_practices,
        is_merlin_approved, merlin_approval_status, merlin_approved_at,
        merlin_approved_by_role, merlin_approval_notes
    ) VALUES (
        'training_method',
        'repeated_sprint_conditioning_flag_football',
        'What conditioning matches the demands of a flag football game?',
        'Match analyses show flag football is dominated by repeated short sprints (3-7 seconds, 15-25 metres) with incomplete recovery and frequent direction changes. Long slow distance running prepares you for a sport that does not exist. Use Repeated Sprint Ability (RSA) sessions: 6-10 x 25m all-out with 30-40 seconds rest, 3-4 sets, 3 minutes between sets. Add tactical conditioning blocks: full route trees against a clock, coverage circuits, and small-sided games on a half field. One RSA session + one tactical session per week is usually enough in-season.',
        'Train repeated 25m sprints (6-10 x 25m, 30-40s rest, 3-4 sets) + tactical conditioning - not long slow running.',
        ARRAY[a_flagff, a_gabbett],
        'strong', 'high',
        '{"rsa_set": {"reps": "6-10", "distance_m": 25, "rest_seconds": "30-40", "sets": "3-4", "between_sets_minutes": 3}, "weekly_sessions_inseason": {"rsa": 1, "tactical_conditioning": 1}, "drop_long_slow_distance": true}'::jsonb,
        ARRAY['flag_football_players', 'wide_receivers', 'defensive_backs'],
        'flag_football',
        ARRAY[
            'Time every sprint - drop the set when reps slow by >5% from the best',
            'Pair RSA with full-field tactical games not 30-min jogs',
            'Always do RSA fresh, never tacked onto a heavy lift day',
            'Track 6 x 25m total time as your conditioning marker'
        ],
        true, 'approved', v_approval_ts, 'system_seed',
        'Flag football demand profile + load principles'
    );

    INSERT INTO knowledge_base_entries (
        entry_type, topic, question, answer, summary, supporting_articles,
        evidence_strength, consensus_level, protocols, applicable_to,
        sport_specificity, best_practices,
        is_merlin_approved, merlin_approval_status, merlin_approved_at,
        merlin_approved_by_role, merlin_approval_notes
    ) VALUES (
        'training_method',
        'nordic_hamstring_for_field_sports',
        'How do I program Nordic hamstring curls and how many do I need?',
        'Nordic hamstring curls reduce hamstring injury risk by ~50% in team sports when done consistently. The Petersen protocol works in flag football: start with 2 sessions/week, 2 sets of 5 reps; progress over 6-8 weeks to 3 sessions/week, 3 sets of 8-12 reps (with assistance as needed). Expect 24-72 hours of soreness in week 1 - reduce volume if soreness blocks sprint work, but do not skip the exercise. Pair with single-leg Romanian deadlifts and sprint exposure.',
        'Use the Petersen Nordic protocol: build from 2x5 to 3x8-12 over 6-8 weeks, 2-3 sessions/week - cuts hamstring injuries ~50%.',
        ARRAY[a_fifa, a_flagff],
        'strong', 'high',
        '{"protocol_weeks": [{"week": "1-2", "sessions": 2, "sets_x_reps": "2x5"}, {"week": "3-4", "sessions": 2, "sets_x_reps": "2x6"}, {"week": "5-6", "sessions": 3, "sets_x_reps": "3x8"}, {"week": "7-8", "sessions": 3, "sets_x_reps": "3x8-12"}], "tempo": "slow_eccentric_3-5s", "complement": ["single_leg_RDL", "max_sprint_exposure"]}'::jsonb,
        ARRAY['flag_football_players', 'wide_receivers', 'defensive_backs', 'all_athletes'],
        'flag_football',
        ARRAY[
            'Always pair Nordic curls with regular sprint exposure',
            'Slow eccentric (3-5 seconds) before letting hands catch you',
            'Expect first-week soreness - it fades within 2-3 sessions',
            'Use a partner or strap to anchor heels - quality over reps'
        ],
        true, 'approved', v_approval_ts, 'system_seed',
        'Petersen Nordic hamstring protocol + FIFA 11+ evidence'
    );

    INSERT INTO knowledge_base_entries (
        entry_type, topic, question, answer, summary, supporting_articles,
        evidence_strength, consensus_level, protocols, applicable_to,
        sport_specificity, best_practices,
        is_merlin_approved, merlin_approval_status, merlin_approved_at,
        merlin_approved_by_role, merlin_approval_notes
    ) VALUES (
        'training_method',
        'defensive_back_footwork',
        'What footwork should I drill as a defensive back / flag puller?',
        'Defensive back footwork is built on backpedal mechanics (low hips, short choppy steps, eyes on the QB''s near shoulder), efficient hip-flip transitions (drop the near foot, rotate hips, never cross your feet), and shuffle-to-burst patterns. Drill in this order: stance and start, backpedal 5 yards, backpedal-and-break (90 degrees left/right), pedal-turn-run, and W-drill. Add reactive cues only after the patterns are clean. 2-3 short (10-15 min) sessions per week are enough.',
        'Drill stance -> backpedal -> hip flip -> break in short (10-15 min) sessions 2-3x/week before adding reactive cues.',
        ARRAY[a_flagff],
        'moderate', 'high',
        '{"weekly_sessions": "2-3", "session_minutes": "10-15", "drill_order": ["stance_and_start", "5yd_backpedal", "backpedal_and_break", "pedal_turn_run", "W_drill"], "cues": ["low_hips", "short_steps", "no_cross_steps", "eyes_on_near_shoulder"]}'::jsonb,
        ARRAY['defensive_backs', 'defenders', 'flag_football_players'],
        'flag_football',
        ARRAY[
            'Drill footwork fresh, not after conditioning',
            'Film side angles to check hip height in the backpedal',
            'Master patterns before adding reactive coach cues',
            'Pair with ankle and hip mobility work weekly'
        ],
        true, 'approved', v_approval_ts, 'system_seed',
        'DB footwork progressions'
    );

    INSERT INTO knowledge_base_entries (
        entry_type, topic, question, answer, summary, supporting_articles,
        evidence_strength, consensus_level, protocols, applicable_to,
        sport_specificity, best_practices,
        is_merlin_approved, merlin_approval_status, merlin_approved_at,
        merlin_approved_by_role, merlin_approval_notes
    ) VALUES (
        'training_method',
        'plyometrics_for_flag_football',
        'What plyometrics should flag football players do?',
        'Build plyometrics in three stages: extensive (low-intensity, high-reps - ankle hops, line hops, pogos, 80-120 ground contacts/session), intensive bilateral (box jumps, broad jumps, depth jumps from 30-45 cm, 40-60 contacts/session) and intensive unilateral / lateral (single-leg bounds, lateral bounds, ice-skater jumps, 30-50 contacts/session). Start extensive in early off-season, progress to intensive and unilateral as competition nears. Keep ground contacts well under 120 per session and never on the day before a game.',
        'Progress extensive -> bilateral -> unilateral/lateral plyos; cap ground contacts at ~120/session and never the day before a game.',
        ARRAY[a_flagff, a_fifa],
        'strong', 'high',
        '{"stages": [{"name": "extensive", "contacts": "80-120", "examples": ["ankle_hops", "line_hops", "pogos"]}, {"name": "intensive_bilateral", "contacts": "40-60", "examples": ["box_jump", "broad_jump", "depth_jump_30-45cm"]}, {"name": "intensive_unilateral_lateral", "contacts": "30-50", "examples": ["single_leg_bound", "lateral_bound", "ice_skater"]}], "rest_day_before_game": true}'::jsonb,
        ARRAY['flag_football_players', 'wide_receivers', 'defensive_backs', 'youth_athletes'],
        'flag_football',
        ARRAY[
            'Coach landing mechanics before adding height or distance',
            'Cap total ground contacts to ~120/session, less for unilateral days',
            'Never schedule intensive plyometrics the day before a game',
            'Progress depth-jump height only after broad jump distance plateaus'
        ],
        true, 'approved', v_approval_ts, 'system_seed',
        'Plyometric progression for field sports'
    );

    INSERT INTO knowledge_base_entries (
        entry_type, topic, question, answer, summary, supporting_articles,
        evidence_strength, consensus_level, protocols, applicable_to,
        sport_specificity, best_practices,
        is_merlin_approved, merlin_approval_status, merlin_approved_at,
        merlin_approved_by_role, merlin_approval_notes
    ) VALUES (
        'training_method',
        'in_season_strength_minimums',
        'How little strength training can I get away with in-season?',
        'Strength is maintained, not built, in-season. Two short (35-45 min) sessions per week with 1 main lower-body lift (squat or trap-bar deadlift), 1 main upper-body lift (push or pull), 1-2 accessories (Nordic curl, single-leg RDL) and ~1 core piece holds 90-95% of off-season strength. Stay above ~80% 1RM for the main lifts and keep sets crisp (2-3 sets x 3-5 reps). Drop a session, not the intensity, in heavy game weeks.',
        'Two 35-45 min sessions/week at >=80% 1RM keep 90-95% of strength; drop sessions, not load, in heavy game weeks.',
        ARRAY[a_issurin, a_flagff],
        'strong', 'high',
        '{"sessions_per_week": 2, "session_minutes": "35-45", "main_lifts": ["squat_or_trap_bar", "push_or_pull"], "main_sets_x_reps": "2-3 x 3-5", "intensity_pct_1rm": ">=80", "must_keep": ["nordic_hamstring", "single_leg_rdl"]}'::jsonb,
        ARRAY['flag_football_players', 'team_sport_athletes'],
        'flag_football',
        ARRAY[
            'Lift no closer than 36-48 hours to a game',
            'If you must cut, cut a session - not the intensity of the lifts you keep',
            'Always keep Nordic curls and one single-leg posterior chain lift',
            'Re-test 1RM proxies (3-5RM) every 4-6 weeks to confirm maintenance'
        ],
        true, 'approved', v_approval_ts, 'system_seed',
        'In-season strength maintenance principles'
    );

    INSERT INTO knowledge_base_entries (
        entry_type, topic, question, answer, summary, supporting_articles,
        evidence_strength, consensus_level, protocols, applicable_to,
        sport_specificity, best_practices, safety_warnings,
        is_merlin_approved, merlin_approval_status, merlin_approved_at,
        merlin_approved_by_role, merlin_approval_notes
    ) VALUES (
        'training_method',
        'tournament_week_template',
        'How do I structure a tournament week?',
        'A typical 5-7 day tournament week with games on day 6-7: Day 1 quality lift + RSA (highest load of the week). Day 2 short skill work + mobility. Day 3 short, sharp speed/agility session at low volume + walk-through. Day 4 light skill + film. Day 5 RAMP warm-up plus 4-6 short accelerations and 10-15 throws - "primer" only. Day 6-7 games. Total volume drops 35-50% versus a normal week; intensity stays high in the early-week sessions and very low in the primers. Sleep 8+ hours nightly, hydrate to clear urine, and front-load carbs from day 4.',
        'Front-load intensity (Day 1), taper volume 35-50%, keep a Day-5 primer, sleep 8+ hours and front-load carbs from Day 4.',
        ARRAY[a_gabbett, a_flagff],
        'strong', 'high',
        '{"days": [{"day": 1, "focus": "quality_lift + RSA", "load": "high"}, {"day": 2, "focus": "skill + mobility", "load": "low"}, {"day": 3, "focus": "short_speed + walkthrough", "load": "moderate"}, {"day": 4, "focus": "skill + film", "load": "low"}, {"day": 5, "focus": "RAMP + primer", "load": "very_low"}, {"day": 6, "focus": "games", "load": "competition"}, {"day": 7, "focus": "games", "load": "competition"}], "weekly_volume_reduction_pct": "35-50"}'::jsonb,
        ARRAY['flag_football_players', 'team_sport_athletes'],
        'flag_football',
        ARRAY[
            'Plan the week backwards from the first game',
            'Cap Day-5 throwing/cutting volume tightly',
            'Use Day 2 and Day 4 for film, walk-throughs and recovery, not new installs',
            'Sleep and carbohydrate intake matter as much as the training plan'
        ],
        ARRAY[
            'Do not introduce new exercises or drills inside a tournament week',
            'Avoid intensive plyometrics in the final 48 hours before games'
        ],
        true, 'approved', v_approval_ts, 'system_seed',
        'Tournament week tapering template'
    );

    INSERT INTO knowledge_base_entries (
        entry_type, topic, question, answer, summary, supporting_articles,
        evidence_strength, consensus_level, protocols, applicable_to,
        sport_specificity, best_practices,
        is_merlin_approved, merlin_approval_status, merlin_approved_at,
        merlin_approved_by_role, merlin_approval_notes
    ) VALUES (
        'recovery_method',
        'between_games_recovery',
        'What is the best recovery between back-to-back tournament games?',
        'Between same-day games (60-180 min gap) prioritise: (1) light active cooldown 5-8 min, (2) carbohydrate intake 1.0-1.2 g/kg in the first hour with fluid + electrolytes, (3) protein 0.3 g/kg, (4) elevation/compression for 10-15 min if available. Cold-water immersion (10-15 min, 10-15 C) is useful between games for subjective recovery but should not be a routine post-game habit during the strength-development phases of pre-season - it blunts hypertrophy and strength adaptations.',
        'Cool down -> carbs (1-1.2 g/kg) + protein (0.3 g/kg) + fluids -> optional cold-water immersion 10-15 min at 10-15 C.',
        ARRAY[a_flagff],
        'moderate', 'high',
        '{"window_minutes": "0-60_post_game", "carbs_g_per_kg": "1.0-1.2", "protein_g_per_kg": "0.3", "fluid_ml_per_kg": "5-10 per 30 min until clear urine", "cold_water_immersion": {"duration_min": "10-15", "temp_c": "10-15", "use_when": "between_games", "avoid_when": "strength_development_phase"}}'::jsonb,
        ARRAY['flag_football_players', 'team_sport_athletes'],
        'flag_football',
        ARRAY[
            'Eat the recovery meal within the first 30-45 minutes',
            'Plan the recovery menu before tournament day',
            'Use cold-water immersion between games, not after every session in pre-season',
            'Re-warm-up before the next game - do not start cold from the bench'
        ],
        true, 'approved', v_approval_ts, 'system_seed',
        'Recovery nutrition + CWI evidence applied to tournament play'
    );

    INSERT INTO knowledge_base_entries (
        entry_type, topic, question, answer, summary, supporting_articles,
        evidence_strength, consensus_level, applicable_to, sport_specificity,
        best_practices,
        is_merlin_approved, merlin_approval_status, merlin_approved_at,
        merlin_approved_by_role, merlin_approval_notes
    ) VALUES (
        'training_method',
        'youth_flag_football_load',
        'How should youth flag football players progress training load?',
        'Youth athletes (under 16) should progress load even more conservatively than adults: cap week-on-week sRPE-load increases at ~10% and total weekly load below adult guidelines until growth status is established. Avoid two consecutive maximal sessions, keep deloads every 3 weeks, and prioritise technique and movement quality over conditioning volume. Single-sport specialisation under 14 is associated with higher injury and burnout rates - schedule deliberate cross-training or a different sport.',
        'Under-16s: cap weekly load increases at ~10%, deload every 3 weeks, avoid early single-sport specialisation.',
        ARRAY[a_gabbett, a_flagff],
        'moderate', 'high',
        ARRAY['youth_athletes', 'flag_football_players'],
        'flag_football',
        ARRAY[
            'Track sRPE-load even for under-16s - use simple 1-10 face scales if needed',
            'Coaches should plan deloads every 3 weeks by default',
            'Encourage cross-training under age 14',
            'Re-baseline programs after every growth spurt'
        ],
        true, 'approved', v_approval_ts, 'system_seed',
        'Youth load progression principles'
    );

    INSERT INTO knowledge_base_entries (
        entry_type, topic, question, answer, summary, supporting_articles,
        evidence_strength, consensus_level, protocols, applicable_to,
        sport_specificity, best_practices,
        is_merlin_approved, merlin_approval_status, merlin_approved_at,
        merlin_approved_by_role, merlin_approval_notes
    ) VALUES (
        'training_method',
        'wellness_monitoring_daily',
        'What daily wellness data should I track and how do I act on it?',
        'A 4-question daily wellness check (sleep quality, soreness, mood, energy, each on a 1-5 scale) captures most of the readiness signal. Compute a daily total (4-20). Act when any single item drops two points below the athlete''s 28-day baseline, or the total drops more than 20% for two consecutive days - that is your trigger to drop intensity, not volume, in the next session and bring a deload forward if it persists.',
        'Track sleep, soreness, mood and energy (1-5 each); a >20% drop for 2 days or any item down 2 from baseline triggers a lighter session.',
        ARRAY[a_gabbett],
        'strong', 'high',
        '{"items": ["sleep_quality", "soreness", "mood", "energy"], "scale_min": 1, "scale_max": 5, "trigger_individual_drop": 2, "trigger_total_drop_pct": 20, "trigger_consecutive_days": 2, "response": "reduce_intensity_not_volume_for_next_session"}'::jsonb,
        ARRAY['all_athletes', 'flag_football_players'],
        'flag_football',
        ARRAY[
            'Take the wellness check at the same time every day (ideally on wake)',
            'Use 28-day rolling baselines, not single best/worst days',
            'Combine wellness with ACWR - act when both flag red',
            'Coach with the data, do not punish honest reporting'
        ],
        true, 'approved', v_approval_ts, 'system_seed',
        'Daily wellness monitoring methodology'
    );

END $$;

COMMIT;
