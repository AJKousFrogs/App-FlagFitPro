-- Workstream A (docs/ground-truth/backend-consolidation-plan.md): drop the empty
-- legacy exercise stores. The canonical library is public.exercises (840 rows).
-- These parallel tables held 0 rows and were reached only by the dead
-- exercises-core / isometrics / plyometrics / exercisedb endpoints (removed
-- 2026-07-12). Verified at drop time: 0 rows each, no inbound FKs, no dependent
-- views. Reversible from earlier CREATE-TABLE migrations if ever needed.

-- Order matters: ff_exercise_mappings has an FK to exercisedb_exercises.
DROP TABLE IF EXISTS public.ff_exercise_mappings;
DROP TABLE IF EXISTS public.exercisedb_exercises;
DROP TABLE IF EXISTS public.isometrics_exercises;
DROP TABLE IF EXISTS public.plyometrics_exercises;
DROP TABLE IF EXISTS public.exercise_registry;
