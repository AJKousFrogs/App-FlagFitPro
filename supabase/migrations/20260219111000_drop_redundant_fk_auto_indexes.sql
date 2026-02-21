-- Drop low-risk redundant FK auto indexes where an existing non-auto btree index
-- on the same table already starts with the same leading column.
-- This targets only confirmed left-prefix-covered duplicates.

DROP INDEX IF EXISTS public.idx_consent_change_log_consent_change_log_athlete_id_fk_auto;
DROP INDEX IF EXISTS public.idx_decision_ledger_decision_ledger_decision_maker_fk_auto;
DROP INDEX IF EXISTS public.idx_decision_ledger_decision_ledger_team_id_fk_auto;
DROP INDEX IF EXISTS public.idx_execution_logs_execution_logs_athlete_id_fk_auto;
DROP INDEX IF EXISTS public.idx_execution_logs_execution_logs_session_id_fk_auto;
DROP INDEX IF EXISTS public.idx_physical_measurements_physical_measurements_user_id_fk_auto;
DROP INDEX IF EXISTS public.idx_safety_override_log_safety_override_log_athlete_id_fk_auto;
DROP INDEX IF EXISTS public.idx_training_sessions_training_sessions_user_id_fk_auto;
