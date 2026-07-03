-- Adds 8 knowledge_base_entries covering technical/coaching content from the
-- physio-approved Ljubljana Frogs 2026 Summer Pre-Season reference program:
-- RSA methodology, referee-load simulation, drill-ladder progression,
-- bodyweight/band strength retention, flag-pull/legal-evasion technique,
-- route-running fundamentals, 9-week block periodization, and the
-- 3-step acceleration/deceleration teaching progression the user named
-- explicitly. Approved directly as system-seeded reference content,
-- matching the existing seed convention (merlin_submitted_by/approved_by
-- NULL, role-based attribution, is_merlin_approved=true).
-- Idempotent on topic via WHERE NOT EXISTS.

INSERT INTO public.knowledge_base_entries (
  entry_type, topic, question, answer, summary, evidence_strength, consensus_level,
  contraindications, safety_warnings, best_practices, applicable_to, sport_specificity,
  is_merlin_approved, merlin_approval_status, merlin_submitted_by_role, merlin_approved_by_role, merlin_approved_at
)
SELECT v.* FROM (VALUES
  ('training_method', 'rsa_repeated_sprint_ability_work_rest_periodization',
   'What work:rest ratio should repeated-sprint sets use, and why does it change between sessions?',
   'Repeated Sprint Ability (RSA) training in flag football should use two distinct work:rest ratios depending on what quality is being targeted, not one generic "sprint and rest" template.

Game-replica sets (~1:8 work:rest, e.g. ~5 seconds maximal sprint followed by ~40 seconds rest) mirror the real play-clock rhythm of a flag-football game -- roughly 40 seconds between snaps. Because rest is close to full phosphagen recovery, each sprint can be run at genuinely maximal effort, so this ratio trains top speed and acceleration quality under the game''s actual pacing, and it is the ratio to prioritise in the weeks closest to competition.

Tank-builder sets (~1:4-5 work:rest, e.g. ~20m sprint with only ~20-25 seconds rest) deliberately compress recovery below what the phosphagen system needs to fully reload. The resulting incomplete recovery forces greater reliance on the aerobic system to help clear the accumulating fatigue, which is what builds the athlete''s repeated-sprint "tank" (the ability to hold sprint quality across many reps) without resorting to long, slow distance running that has poor transfer to a stop-start field sport.

Do not use the compressed tank-builder ratio on days meant to develop raw top-end speed -- the accumulating fatigue degrades sprint mechanics and defeats the purpose of a max-velocity session. Reserve it for a distinct, clearly-labelled conditioning block.',
   'Use ~1:8 rest (game-replica) to train maximal sprint quality on the real play-clock rhythm; use ~1:4-5 rest (tank-builder) with deliberately incomplete recovery to build repeated-sprint capacity through the aerobic system, never mixing the two purposes in one session.',
   'moderate', 'moderate',
   '{"Athletes returning from a lower-limb soft-tissue injury should reintroduce maximal sprinting gradually before starting tank-builder RSA sets"}'::text[],
   '{"Do not run compressed-rest RSA sets on primary top-speed development days","Watch for a sprint-time decrement beyond roughly 5-10% across a tank-builder set as a sign the session should be stopped"}'::text[],
   '{"Prioritise game-replica (1:8) ratio in-season and in the weeks closest to competition","Use tank-builder (1:4-5) ratio in dedicated conditioning phases only","Track rep-to-rep sprint time decrement to gauge whether the set is still training the intended quality","Keep true maximal effort on every rep of a game-replica set -- the long rest exists specifically to allow that"}'::text[],
   '{"all_athletes","sprint_athletes","wr_db","qb"}'::text[], 'flag_football',
   true, 'approved', 'strength_conditioning_coach', 'strength_conditioning_coach', now()),

  ('training_method', 'referee_load_simulation_play_then_ref_conditioning',
   'Why does flag-football conditioning need a specific drill for playing a game and then refereeing one, and how is it structured?',
   'Many flag-football leagues run on small rosters (commonly around 7 players per team), which means the same players who just competed at full intensity are often required to referee the following game before playing again. This produces a specific and demanding conditioning profile: a maximal sprint effort, followed by 8-12 minutes of continuous sub-maximal movement (jogging/shuffling at refereeing pace) with essentially no true rest, followed by a return to maximal sprinting for the next game. Standard "sprint then fully rest" conditioning does not replicate this, so it needs its own drill.

The Referee-Load Simulation (Play-Then-Ref) drill trains exactly this sequence: complete a full sprint block (the "game"), immediately transition into a continuous, non-stop jog at roughly 50% of max pace for 8-12 minutes (the "ref" block, deliberately never allowed to become a walk or full stop), then complete a second sprint block matched in structure to the first. The key outcome measure is the drop-off between the first and second sprint block -- some decrement is expected and normal, but a large drop signals the athlete needs more of this specific conditioning quality, not more generic aerobic base work.

This is a load-management as much as a conditioning consideration: coaches scheduling tournament days or back-to-back fixtures should treat "played, then reffed, then played again" as a distinct load pattern in ACWR/session-load tracking, not as two separate lower-intensity sessions.',
   'A sprint block, then a continuous 8-12 minute sub-maximal jog, then a second sprint block rehearses the specific play-then-referee demand of small flag-football rosters; track the sprint-time drop-off between block one and two as the key readiness signal.',
   'moderate', 'moderate',
   '{"Athletes with unresolved lower-limb injury should not perform the full sequence until cleared for repeated maximal sprinting"}'::text[],
   '{"The middle jog block must stay continuous and sub-maximal -- stopping or sprinting during it defeats the purpose and can mask true fatigue","A second-block sprint-time drop-off beyond what is typical for the athlete should be treated as a fatigue/load flag, not ignored"}'::text[],
   '{"Schedule this specific drill pattern in the weeks before tournaments where athletes are likely to referee between games","Log session load for played-then-reffed days as its own distinct load pattern rather than folding it into a normal game-day estimate","Use the block-to-block sprint decrement as an individualised readiness marker over time"}'::text[],
   '{"all_athletes","sprint_athletes","wr_db","center_rusher"}'::text[], 'flag_football',
   true, 'approved', 'strength_conditioning_coach', 'strength_conditioning_coach', now()),

  ('training_method', 'drill_ladder_progression_a_b_c_skip_series',
   'What is the A/B/C skip drill-ladder progression, and in what order should it be taught?',
   'The A/B/C skip series is a standard sprint-mechanics drill-ladder that isolates and rehearses the individual components of an efficient sprint stride, progressing from simple to complex. It should be taught in order, since each drill builds on the position or timing established by the one before it.

A-series (A-March -> A-Run): isolates knee drive and strike position. The knee drives to hip height and the foot strikes the ground directly underneath the hips, never reaching out in front. The march is the slow, deliberate teaching version; the run-out accelerates the same pattern into a real jog without letting the mechanics collapse.

B-series (B-March -> B-Run): adds the hamstring "pawing" action on top of the A-position -- the lower leg extends and actively pulls down and back underneath the hip just before ground contact. This is the mechanic that applies backward force into the ground, which is what actually propels a sprinter forward, so the B-series is where knee drive becomes real forward propulsion.

C-Skip: the most advanced drill in the series, extending the leg at peak knee drive and actively pulling the foot down and under the body to land on the ball of the foot. It opens the full hip range used at true top-end speed and should only be introduced once A- and B-series mechanics are solid.

Supporting drills (Ankling, Fast-Leg, Scissor/1-2 Switch, Straight-Leg Run) reinforce reactive ground contact and turnover speed and can be layered in alongside or after the core A/B/C progression rather than strictly before it.

Coaching priority: correct position beats speed early on. An athlete rushing through sloppy A-skips gains little; slow, correct positions transfer to sprint mechanics far better than fast, incorrect ones.',
   'Teach the A-series (knee drive, strike position) first, then the B-series (adds the hamstring paw-down that creates propulsion), then the C-skip (full hip range at speed) last; prioritise correct position over speed at every stage.',
   'moderate', 'high',
   NULL,
   '{"Do not progress an athlete to the B- or C-series until the preceding drill''s position is consistently correct at slow speed"}'::text[],
   '{"Sequence strictly A-series, then B-series, then C-skip -- do not skip ahead for the sake of variety","Use the March version to teach position before the Run-Out version adds speed","Layer supporting drills (ankling, fast-leg, scissor switch) in around the core progression rather than as a substitute for it","Regress back to the March tempo any time mechanics break down at speed"}'::text[],
   '{"all_athletes","sprint_athletes","wr_db","center_rusher"}'::text[], 'general',
   true, 'approved', 'strength_conditioning_coach', 'strength_conditioning_coach', now()),

  ('training_method', 'bodyweight_band_strength_mass_retention_principles',
   'How can strength and muscle mass be maintained or built without regular access to a full gym?',
   'Bodyweight and resistance-band training can maintain -- and with the right manipulation, still build -- meaningful strength and muscle mass, but only if progressive overload is deliberately engineered rather than assumed to happen automatically. Four levers do this without external load:

Tempo manipulation: slowing the eccentric (lowering) phase of a bodyweight movement, such as a 3-second controlled lowering on a push-up, dramatically increases time under tension and the resulting strength/hypertrophy stimulus compared to the same rep performed quickly.

Leverage and unilateral progressions: moving from a bilateral to a single-leg or single-arm version of a movement (e.g. push-up to feet-elevated push-up to explosive push-up; bodyweight squat to single-leg progressions) increases relative load on the working limb even though total bodyweight has not changed.

Band tension: resistance bands provide accommodating resistance that increases through the range of motion, which is a genuinely different (and useful) stimulus than free weight, and scales easily by changing band thickness or anchor distance.

Plyometric/explosive-intent contrast: adding an explosive-intent version of a movement (e.g. explosive push-up, jump squat) trains rate of force development, a quality that plain slow-tempo bodyweight work does not address on its own.

The honest limit: for athletes who already have a meaningful strength base, external load (barbells, dumbbells, kettlebells) will eventually out-perform bodyweight/band methods for continued maximal-strength gain, because the four levers above have a ceiling. Bodyweight/band training is best understood as a genuinely effective maintenance and entry-level strength-building tool, and as the correct default when gym access is limited (e.g. off-season, travel, outdoor training blocks), not as a permanent replacement once heavier external load becomes available and appropriate.',
   'Tempo, unilateral progressions, band tension, and explosive-intent contrast let bodyweight/band training maintain and build real strength without a gym, but the approach has a ceiling and should transition to external load once available for continued maximal-strength gains.',
   'moderate', 'moderate',
   NULL,
   '{"Athletes chasing continued maximal-strength gains long-term should not rely on bodyweight/band training indefinitely once external load access is available"}'::text[],
   '{"Manipulate tempo (slow eccentrics) before assuming more reps alone is progressive overload","Progress bilateral movements toward unilateral versions as strength allows","Use bands for their accommodating-resistance profile, not just as a load substitute","Include an explosive-intent variation of key patterns to keep rate-of-force-development in the program","Transition to external load once available if continued maximal-strength gain is the goal"}'::text[],
   '{"all_athletes","veteran_athletes"}'::text[], 'general',
   true, 'approved', 'strength_conditioning_coach', 'strength_conditioning_coach', now()),

  ('training_method', 'flag_pull_technique_and_legal_evasion_footwork',
   'What is correct flag-pull technique for defenders, and what evasion technique is legal for ball carriers?',
   'Flag football''s core defensive skill (pulling the flag) and its core evasive skill (avoiding the pull) are governed by a rule that shapes how both should be coached: "flag guarding" -- using the hands or arms to shield, block, or cover the flag belt from a defender -- is illegal in standard flag-football rulesets. This means evasion technique must be built entirely on footwork, and defensive technique must be built on a clean, targeted hand action rather than a tackle-like pursuit.

Defensive flag-pull technique has three components, trained in sequence: (1) angle of pursuit -- taking the shortest angle to intercept the ball carrier''s projected path rather than chasing their current position, which is the single biggest factor in successful flag pulls; (2) break-down position -- deliberately shortening and lowering the stride a few steps before the pull attempt so speed is under control and the defender does not overrun a last-second cut; (3) reach-and-rip -- extending one hand to the near-side flag, gripping it, and ripping it downward and away in one clean motion, never lunging with both hands at the runner''s body or grabbing clothing.

Legal evasive footwork for the ball carrier centers on committed, believable direction changes rather than any hand-based shielding: the juke step (a real weight shift selling one direction before cutting the other), the hesitation move (a visible change of rhythm that disrupts the defender''s timing), and the stutter-step (rapid short steps that delay commitment to the final cut). All three rely on genuine weight transfer and footwork, and none involve the hands leaving their normal running position to guard the flag.

Coaching note: because flag guarding is illegal, any drill or cue that teaches an athlete to "protect the flags with your hands" is teaching a penalty, not a skill, and should be corrected immediately.',
   'Flag guarding (hands/arms shielding the flag belt) is illegal, so defensive technique should be built on pursuit angle, break-down position, and a clean reach-and-rip pull, while ball-carrier evasion must rely entirely on footwork (juke, hesitation, stutter-step) rather than any hand-based shielding.',
   'strong', 'high',
   NULL,
   '{"Do not coach any technique that uses the hands or arms to shield, cover, or push away a defender from the flag belt -- this is a penalty (flag guarding) in standard rulesets"}'::text[],
   '{"Teach pursuit angle before pull technique -- most missed pulls are an angle problem, not a hands problem","Use break-down position to convert speed into control just before the pull attempt","Reach and rip the flag cleanly downward-and-away rather than lunging or grabbing at the body","Build evasion drills entirely around footwork and weight transfer, never around hand-based flag protection"}'::text[],
   '{"all_athletes","wr_db"}'::text[], 'flag_football',
   true, 'approved', 'strength_conditioning_coach', 'strength_conditioning_coach', now()),

  ('training_method', 'route_running_release_and_separation_fundamentals',
   'What are the core technical principles behind route running and creating separation in flag football?',
   'Route running quality is driven less by straight-line speed and more by the sharpness of the release, the discipline of running the route stem straight until the true break point, and matching braking mechanics to the specific route being run.

Release: the first two to three steps off the line set up the entire route. A sharp, low first-step burst at a slight angle (to simulate beating press coverage) followed by smooth acceleration is more valuable than simply being fast in a straight line, because most separation is won or lost in this initial phase before the defender has fully reacted.

Route-stem discipline: routes that break sharply (slant, out, curl) depend on running the stem completely straight up to the break point and then executing a single decisive cut -- drifting toward the eventual break direction early telegraphs the route and gives the defender time to react. Routes that break at speed (post, corner, fade) instead rely on preserving top-end speed through the angle change rather than decelerating into it.

Deceleration matching the route: a comeback route requires a hard, controlled deceleration and plant that must look identical to a deep route until the very last moment, so the defender''s momentum carries them past the break; a curl requires a controlled deceleration into a stable, balanced turn with the eyes coming back to the quarterback as early as possible.

Double moves (selling one break before continuing into a second, deeper break) only work if the first break is a real, full-commitment plant with genuine deceleration -- a rushed or half-hearted fake break does not move a defender and gives away the double move immediately.

Option/choice routes add a decision-making layer on top of the physical break: the receiver reads the defender''s leverage at the break point and selects the open space, but the physical break itself should look identical regardless of which way is chosen, so the defender cannot key off hesitation.',
   'Separation comes primarily from a sharp release and disciplined route-stem running rather than raw speed; match deceleration technique to the specific route (hard brake and disguise for comebacks, speed-preserving angle changes for posts/corners/fades), and only use double moves once the first fake break is a genuine, full-commitment plant.',
   'moderate', 'moderate',
   NULL,
   NULL::text[],
   '{"Run the route stem straight and full-speed until the true break point rather than drifting toward the break early","Match braking technique to the route: hard disguised deceleration for comebacks/curls, speed-preserved angle changes for posts/corners/fades","Commit fully to the first break of any double move -- a half-hearted fake does not draw a real defensive reaction","On option/choice routes, make the physical break look identical regardless of the read to avoid tipping the decision"}'::text[],
   '{"wr_db","qb"}'::text[], 'flag_football',
   true, 'approved', 'strength_conditioning_coach', 'strength_conditioning_coach', now()),

  ('training_method', 'nine_week_preseason_periodization_block_structure',
   'How should a 9-week flag-football pre-season block be structured across phases?',
   'A 9-week pre-season block (the structure underpinning the physio-approved Ljubljana Frogs Summer Pre-Season Program) is best organised as a sequence of phases that each build the foundation for the next, rather than trying to develop every quality at once from week one.

General preparation (roughly weeks 1-2): establishes movement quality, tissue tolerance, and work capacity -- higher volume, lower intensity, emphasis on technique in fundamental patterns (squat/hinge/push/pull), tendon-preparation isometrics, and aerobic base. This phase deliberately avoids high-intensity plyometrics or maximal sprinting before tissues are prepared for it.

Strength accumulation (roughly weeks 3-5): volume stays moderate-to-high while intensity rises, with an increasing proportion of unilateral work, and posterior-chain/tendon-resilience work (Nordic curls, Copenhagen planks, calf/Achilles isometrics) is layered in consistently since this is the highest-value window to build the injury-resilience base before speed work intensifies.

Power and speed development (roughly weeks 6-7): volume drops as intensity rises further; this is where true maximal sprinting, reactive plyometrics (depth jumps, bounding), and RSA/repeated-sprint conditioning are introduced or intensified, building on the strength and tissue-resilience base from the prior phase.

Peak and taper (roughly weeks 8-9): volume drops sharply while intensity/quality is preserved or slightly increased in short, sharp exposures, allowing full recovery and supercompensation ahead of the competitive season. Skill/technical work (route running, flag-pull technique, position-specific drills) stays high-quality throughout this phase even as general physical volume falls.

The through-line across all phases: each phase''s work is not abandoned once the next phase begins -- strength work continues (at lower volume) through the power/speed phase, and tendon-resilience isometrics continue in some form even into the taper, because these qualities decay if training stops entirely rather than just tapering.',
   'Sequence a 9-week pre-season block as general preparation, then strength accumulation, then power/speed development, then a peak/taper, with each phase''s key work continuing at reduced volume rather than stopping outright once the next phase begins.',
   'moderate', 'moderate',
   NULL,
   '{"Do not introduce maximal sprinting or high-intensity reactive plyometrics before a general preparation phase has established basic tissue tolerance"}'::text[],
   '{"Sequence phases general prep -> strength accumulation -> power/speed -> peak/taper rather than developing everything simultaneously from week one","Layer tendon-resilience work (Nordic curls, Copenhagen planks, isometrics) in during the strength phase and maintain it in reduced form through later phases","Keep skill/technical work quality-focused throughout the taper even as general physical volume drops","Continue a reduced dose of each prior phase''s key work rather than stopping it outright when the next phase begins"}'::text[],
   '{"all_athletes","sprint_athletes","qb","wr_db","center_rusher"}'::text[], 'flag_football',
   true, 'approved', 'strength_conditioning_coach', 'strength_conditioning_coach', now()),

  ('training_method', 'three_step_acceleration_deceleration_teaching_progression',
   'How should the 3-step acceleration and 3-step deceleration drills be taught, and why are exactly three steps used?',
   'The 3-Step Acceleration and 3-Step Deceleration drills isolate the two ends of the same skill -- controlled speed change over a very short number of steps -- because most flag-football speed changes (route breaks, closing on a ball carrier, reacting to a cut) happen within roughly this many steps, not over a long runway.

3-Step Acceleration teaches an explosive, low first step immediately followed by two more steps that progressively raise the athlete out of the initial low drive angle into upright sprinting posture. The coaching emphasis is on force application into the ground on step one (not on trying to be tall and fast immediately), since a weak or upright first step under-loads the whole acceleration and is the most common technical fault.

3-Step Deceleration teaches the mirror skill: three steps that progressively increase braking force, dropping the hips and widening the base specifically on the final step to arrive fully balanced rather than stumbling to a stop. The most common fault is decelerating too gradually across more than three steps, which in a game either overruns the target or telegraphs the stop to an opponent.

Teaching order: introduce acceleration first in isolation, then deceleration in isolation, then combine them (as in the Wave Sprint drill: accelerate, decelerate to a jog, re-accelerate) once each half is technically sound on its own. Both drills should be coached from multiple starting stances (2-point, 3-point, lateral, backpedal) once the basic pattern is established, since flag-football plays begin from varied stances, not just a standing start.

These two drills are the technical foundation underneath nearly every position-specific movement pattern in the program -- route breaks, pursuit angles, and coverage transitions are all, mechanically, a 3-step acceleration or a 3-step deceleration applied to a specific context.',
   'Teach 3-step acceleration (explosive low first step, force into the ground) and 3-step deceleration (progressively increasing braking force, wide stable base on the final step) separately before combining them, since together they are the technical foundation underneath route breaks, pursuit angles, and coverage transitions.',
   'moderate', 'moderate',
   NULL,
   '{"A weak or upright first step is the most common acceleration fault and should be corrected before adding speed or distance","Decelerating gradually over more than three steps either overruns the target or telegraphs the stop -- correct toward a genuine three-step braking pattern"}'::text[],
   '{"Teach acceleration and deceleration in isolation before combining them into a single rep","Emphasise ground force on the first acceleration step over early upright posture","Widen the base and drop the hips specifically on the final deceleration step to finish balanced","Once the basic pattern is solid, vary the starting stance (2-point, 3-point, lateral, backpedal) to match game-realistic starts"}'::text[],
   '{"all_athletes","sprint_athletes","wr_db","qb"}'::text[], 'flag_football',
   true, 'approved', 'strength_conditioning_coach', 'strength_conditioning_coach', now())
) AS v (
  entry_type, topic, question, answer, summary, evidence_strength, consensus_level,
  contraindications, safety_warnings, best_practices, applicable_to, sport_specificity,
  is_merlin_approved, merlin_approval_status, merlin_submitted_by_role, merlin_approved_by_role, merlin_approved_at
)
WHERE NOT EXISTS (
  SELECT 1 FROM public.knowledge_base_entries e WHERE e.topic = v.topic
);
