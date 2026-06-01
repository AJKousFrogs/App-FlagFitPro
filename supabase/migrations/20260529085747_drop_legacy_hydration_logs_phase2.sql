-- Backend de-drift Phase 2: hydration consolidated onto athlete_hydration_logs
-- (canonical: one row per drink, logged_at/amount_ml/beverage_type/metadata).
-- All code repointed (hydration.js, tournament-nutrition-state.service, staff-nutritionist).
-- hydration_logs had 0 rows and now 0 references; no FK dependents.
DROP TABLE IF EXISTS public.hydration_logs;
