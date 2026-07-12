-- Backfill tissue_targets on pre-existing exercises (heuristic on name/target_muscles).
-- Only touches still-untagged rows; over-tagging errs toward the SAFE direction
-- (more exclusions when a region is injured). Idempotent. Applied live 2026-07-12.

UPDATE public.exercises SET tissue_targets = ARRAY['achilles','soleus','gastrocnemius']
WHERE cardinality(tissue_targets)=0 AND (
  name ILIKE '%calf%' OR name ILIKE '%achilles%' OR name ILIKE '%soleus%'
  OR name ILIKE '%gastroc%' OR name ILIKE '%heel raise%' OR name ILIKE '%heel drop%'
  OR name ILIKE '%pogo%' OR name ILIKE '%ankle hop%' OR name ILIKE '%jump rope%'
  OR name ILIKE '%skip%' OR 'calves' = ANY(target_muscles));

UPDATE public.exercises SET tissue_targets = ARRAY['hamstring']
WHERE cardinality(tissue_targets)=0 AND (
  name ILIKE '%hamstring%' OR name ILIKE '%nordic%' OR name ILIKE '%rdl%'
  OR name ILIKE '%romanian%' OR name ILIKE '%good morning%' OR name ILIKE '%leg curl%'
  OR name ILIKE '%glute-ham%' OR name ILIKE '%razor curl%'
  OR 'hamstrings' = ANY(target_muscles) OR 'biceps femoris' = ANY(target_muscles));

UPDATE public.exercises SET tissue_targets = ARRAY['quadriceps','patellar_tendon']
WHERE cardinality(tissue_targets)=0 AND (
  name ILIKE '%squat%' OR name ILIKE '%leg press%' OR name ILIKE '%leg extension%'
  OR name ILIKE '%lunge%' OR name ILIKE '%step-up%' OR name ILIKE '%step up%'
  OR name ILIKE '%split squat%' OR name ILIKE '%box jump%' OR name ILIKE '%depth jump%'
  OR name ILIKE '%patell%' OR name ILIKE '%spanish squat%' OR name ILIKE '%wall sit%'
  OR 'quadriceps' = ANY(target_muscles) OR 'quads' = ANY(target_muscles));

UPDATE public.exercises SET tissue_targets = ARRAY['adductor']
WHERE cardinality(tissue_targets)=0 AND (
  name ILIKE '%adduct%' OR name ILIKE '%copenhagen%' OR name ILIKE '%groin%'
  OR name ILIKE '%lateral lunge%' OR name ILIKE '%cossack%'
  OR 'adductors' = ANY(target_muscles) OR 'adductor longus' = ANY(target_muscles));

UPDATE public.exercises SET tissue_targets = ARRAY['ankle']
WHERE cardinality(tissue_targets)=0 AND (
  name ILIKE '%ankle%' OR name ILIKE '%balance%' OR name ILIKE '%proprio%'
  OR name ILIKE '%wobble%' OR name ILIKE '%bosu%' OR name ILIKE '%single-leg balance%'
  OR name ILIKE '%star excursion%' OR name ILIKE '%peroneal%');

UPDATE public.exercises SET tissue_targets = ARRAY['tibia']
WHERE cardinality(tissue_targets)=0 AND (
  name ILIKE '%shin%' OR name ILIKE '%tibialis%' OR name ILIKE '%tib raise%'
  OR name ILIKE '%toe raise%');

UPDATE public.exercises SET tissue_targets = ARRAY['acl','patellar_tendon']
WHERE cardinality(tissue_targets)=0 AND (
  name ILIKE '%cut%' OR name ILIKE '%change of direction%' OR name ILIKE '%agility%'
  OR name ILIKE '%decel%' OR name ILIKE '%shuffle%' OR name ILIKE '%zigzag%'
  OR name ILIKE '%5-10-5%' OR name ILIKE '%pro agility%' OR name ILIKE '%t-drill%');

UPDATE public.exercises SET tissue_targets = ARRAY['lumbar']
WHERE cardinality(tissue_targets)=0 AND (
  name ILIKE '%deadlift%' OR name ILIKE '%hip hinge%' OR name ILIKE '%back extension%'
  OR name ILIKE '%good morning%' OR name ILIKE '%lower back%' OR name ILIKE '%lumbar%');

UPDATE public.exercises SET tissue_targets = ARRAY['rotator_cuff']
WHERE cardinality(tissue_targets)=0 AND (
  name ILIKE '%shoulder%' OR name ILIKE '%rotator%' OR name ILIKE '%cuff%'
  OR name ILIKE '%overhead press%' OR name ILIKE '%throw%' OR name ILIKE '%scapula%'
  OR name ILIKE '%band pull-apart%' OR name ILIKE '%face pull%'
  OR 'shoulders' = ANY(target_muscles));

UPDATE public.exercises SET tissue_targets = ARRAY['core']
WHERE cardinality(tissue_targets)=0 AND (
  name ILIKE '%plank%' OR name ILIKE '%core%' OR name ILIKE '%ab %' OR name ILIKE '%dead bug%'
  OR name ILIKE '%pallof%' OR name ILIKE '%rollout%' OR name ILIKE '%hollow%'
  OR 'core' = ANY(target_muscles) OR 'abs' = ANY(target_muscles));
