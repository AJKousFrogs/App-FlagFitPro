-- Injury data consolidation (audit option A): the real injuries live in
-- athlete_injuries (physio-written, clinical), but Merlin (ai-chat), the
-- recommendation engine, and user-context read the legacy `injuries` table (empty,
-- never written by the shipped app) -- so injury-aware AI/recommendations were blind
-- to clinical injuries. The two models differ semantically (injuries.severity is a
-- NUMBER 1-10 used in the recommender's math; athlete_injuries.injury_grade is TEXT
-- "Grade 1-3"), so a plain column alias would break the math. This view is the
-- single translation point: it exposes athlete_injuries through the legacy
-- `injuries`-style column names/types so the readers work unchanged (just .from()).
-- Applied via Supabase MCP (schema_migrations version 20260603220617); mirrored here.
CREATE OR REPLACE VIEW public.v_injuries_unified
WITH (security_invoker = true) AS
SELECT
  id,
  user_id,
  injury_type,
  injury_type AS type,
  -- clinical grade → the numeric 1-10 severity the recommender/Merlin expect
  CASE injury_grade
    WHEN 'Grade 3' THEN 9
    WHEN 'Grade 2' THEN 6
    WHEN 'Grade 1' THEN 3
    ELSE 5
  END AS severity,
  injury_location AS body_part,
  -- map the clinical 'rehab' status onto the legacy 'monitoring' the readers filter on
  CASE recovery_status WHEN 'rehab' THEN 'monitoring' ELSE recovery_status END AS status,
  injury_date,
  injury_date AS occurred_at,
  injury_date AS start_date,
  diagnosis AS description,
  activity_restrictions AS restrictions
FROM public.athlete_injuries;
