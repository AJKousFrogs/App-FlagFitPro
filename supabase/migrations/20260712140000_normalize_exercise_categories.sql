-- Normalize exercises.category to a SINGLE lowercase value per section.
--
-- The library had accumulated two casings per section — legacy TitleCase rows
-- (Isometric/Strength/Speed/Power/Agility/Position-Specific) alongside the
-- tissue-load-engine lowercase families. The daily-protocol generator reached
-- both via a dual-casing alias map, but analytics saw split buckets and the
-- taxonomy was ambiguous. Collapse to one canonical lowercase value per section.
--
-- `category` is a free-text varchar (no enum/check), so these are plain UPDATEs.
-- Idempotent: re-running matches nothing once normalized.

UPDATE public.exercises SET category = 'isometrics',  updated_at = now() WHERE category = 'Isometric';
UPDATE public.exercises SET category = 'strength',     updated_at = now() WHERE category = 'Strength';
UPDATE public.exercises SET category = 'speed',        updated_at = now() WHERE category = 'Speed';
UPDATE public.exercises SET category = 'power',        updated_at = now() WHERE category = 'Power';
UPDATE public.exercises SET category = 'agility',      updated_at = now() WHERE category = 'Agility';
UPDATE public.exercises SET category = 'skill_drills', updated_at = now() WHERE category = 'Position-Specific';
