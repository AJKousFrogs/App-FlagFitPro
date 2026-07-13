-- =============================================================================
-- tissue_targets backfill — load-bearing + injury-screened categories (2026-07-13)
-- =============================================================================
-- The injury safety filter (isExerciseSafeForInjuries) takes the UNION of a
-- structured tissue_targets match and a name-keyword fail-safe. The keyword path
-- already protects name-revealing loaders (Calf Raise, Squat, Nordic), but it
-- CANNOT see a name-hiding loader (e.g. "Decline Squat", "Bulgarian Split Squat")
-- — that gap is exactly what tissue_targets closes (locked by
-- tests/unit/injury-safety-filter.test.js).
--
-- This backfills the categories the filter screens on a training day (strength +
-- power) and the injury-screened lower-limb mobility/cool-down/foam-roll rows,
-- matching the EXISTING conservative convention (primary loaded tissues only:
-- squats -> quadriceps/patellar_tendon; hinges -> hamstring/glute/lumbar; upper
-- body -> rotator_cuff). Canonical tissue ids only (see the live vocabulary).
--
-- Deliberately NOT backfilled here: speed / skill_drills / agility DRILLS (a
-- sprint or route drill does not isolate-load one tissue, and an injured athlete
-- is gated out of that work at a higher level), and breathing / cervical / thoracic
-- rows (no lower-limb tissue node). Those remain on the keyword fail-safe.
--
-- Idempotent: only fills rows whose tissue_targets is still empty. This file is the
-- exact SQL applied live via Supabase MCP on 2026-07-13.
-- =============================================================================

UPDATE exercises AS e
SET tissue_targets = v.tt, updated_at = now()
FROM (
  VALUES
    -- POWER (jumps/bounds land on the knee extensor chain; add achilles for the
    -- depth/continuous/single-leg variants where calf load is dominant)
    ('broad-jump-to-vertical-combo',      ARRAY['quadriceps','patellar_tendon']),
    ('countermovement-jump',              ARRAY['quadriceps','patellar_tendon']),
    ('curb-step-jump',                    ARRAY['quadriceps','patellar_tendon']),
    ('depth-drop-to-stick-landing',       ARRAY['quadriceps','patellar_tendon','achilles']),
    ('fast-hands-wall-drill-arm-velocity',ARRAY['rotator_cuff']),
    ('kettlebell-snatch',                 ARRAY['glute','hamstring','lumbar']),
    ('lateral-bound',                     ARRAY['adductor','glute','quadriceps']),
    ('lateral-hop-over-line',             ARRAY['quadriceps','patellar_tendon','achilles']),
    ('medicine-ball-slam',                ARRAY['core','lumbar']),
    ('multi-hop-continuous-bounding',     ARRAY['quadriceps','patellar_tendon','achilles']),
    ('rotational-med-ball-scoop-toss',    ARRAY['core','lumbar']),
    ('single-leg-bound-distance',         ARRAY['quadriceps','patellar_tendon','achilles','hamstring']),
    ('single-leg-hop-forward',            ARRAY['quadriceps','patellar_tendon','achilles']),
    ('skater-jumps',                      ARRAY['adductor','glute','quadriceps']),
    ('standing-broad-jump',               ARRAY['quadriceps','patellar_tendon','hamstring']),
    ('trap-bar-jump-shrug',               ARRAY['quadriceps','glute','hamstring']),
    ('tuck-jump',                         ARRAY['quadriceps','patellar_tendon','hip_flexor']),
    ('unilateral-jump-series',            ARRAY['quadriceps','patellar_tendon','achilles']),
    -- STRENGTH (upper-body push/pull -> rotator_cuff; hinge -> glute/hamstring/lumbar;
    -- carries/anti-rotation -> core/lumbar)
    ('band-chest-press',                  ARRAY['rotator_cuff']),
    ('band-row-bent-over',                ARRAY['rotator_cuff']),
    ('barbell-bench-press',               ARRAY['rotator_cuff']),
    ('barbell-hip-thrust',                ARRAY['glute','hamstring']),
    ('chin-up',                           ARRAY['rotator_cuff']),
    ('dumbbell-bench-press',              ARRAY['rotator_cuff']),
    ('dumbbell-bent-over-row',            ARRAY['rotator_cuff','lumbar']),
    ('farmers-carry',                     ARRAY['core','lumbar']),
    ('floor-leg-raise',                   ARRAY['hip_flexor','core']),
    ('glute-activation-circuit',          ARRAY['glute']),
    ('glute-bridge-single-leg',           ARRAY['glute','hamstring']),
    ('hanging-leg-raise',                 ARRAY['core','hip_flexor']),
    ('inverted-row',                      ARRAY['rotator_cuff']),
    ('kettlebell-swing',                  ARRAY['glute','hamstring','lumbar']),
    ('landmine-press',                    ARRAY['rotator_cuff']),
    ('landmine-rotation',                 ARRAY['core','lumbar']),
    ('lat-pulldown',                      ARRAY['rotator_cuff']),
    ('pike-pushup',                       ARRAY['rotator_cuff']),
    ('pull-up',                           ARRAY['rotator_cuff']),
    ('pushup-explosive-clap',             ARRAY['rotator_cuff']),
    ('pushup-feet-elevated',              ARRAY['rotator_cuff']),
    ('pushup-tempo-eccentric',            ARRAY['rotator_cuff']),
    ('renegade-row',                      ARRAY['rotator_cuff','core']),
    ('reverse-hyperextension',            ARRAY['glute','hamstring','lumbar']),
    ('seated-cable-row',                  ARRAY['rotator_cuff','lumbar']),
    ('single-arm-band-anti-rotation-press',ARRAY['core','rotator_cuff']),
    ('sled-pull-reverse-drag',            ARRAY['quadriceps','glute','hamstring']),
    ('sled-push',                         ARRAY['quadriceps','glute','achilles']),
    ('suitcase-carry-single-arm',         ARRAY['core','lumbar']),
    -- INJURY-SCREENED mobility / cool-down / foam-roll (a stretch or roll stresses
    -- the target tissue -> do not prescribe it on that injured tissue)
    ('calf-achilles-cool-down-mobility',  ARRAY['achilles','soleus','gastrocnemius','plantaris']),
    ('adductor-groin-cool-down-flow',     ARRAY['adductor']),
    ('hip-90-90-stretch-sequence',        ARRAY['hip_flexor','glute']),
    ('hip-90-90-stretch',                 ARRAY['hip_flexor','glute']),
    ('hip-mobility-sequence',             ARRAY['hip_flexor','glute']),
    ('couch-stretch-hip-flexor',          ARRAY['hip_flexor','quadriceps']),
    ('walking-hip-flexor-hamstring-flow', ARRAY['hip_flexor','hamstring']),
    ('leg-swings-front-to-back',          ARRAY['hamstring','hip_flexor']),
    ('standing-quad-stretch',             ARRAY['quadriceps','hip_flexor']),
    ('seated-figure-4-stretch',           ARRAY['glute']),
    ('foam-roll-glutes',                  ARRAY['glute']),
    ('foam-roll-it-band',                 ARRAY['it_band']),
    ('foam-roll-full-lower-body-flow',    ARRAY['quadriceps','hamstring','glute','gastrocnemius']),
    ('pigeon-pose',                       ARRAY['glute','hip_flexor']),
    ('spiderman-with-rotation',           ARRAY['hip_flexor','adductor']),
    ('cat-cow',                           ARRAY['lumbar']),
    ('childs-pose',                       ARRAY['lumbar']),
    ('supine-spinal-twist',               ARRAY['lumbar'])
) AS v(slug, tt)
WHERE e.slug = v.slug
  AND (e.tissue_targets IS NULL OR array_length(e.tissue_targets, 1) IS NULL);
