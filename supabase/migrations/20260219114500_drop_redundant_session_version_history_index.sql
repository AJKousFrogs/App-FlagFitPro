-- Redundant with unique index session_version_history_session_id_version_number_key
-- on (session_id, version_number).
DROP INDEX IF EXISTS public.idx_session_version_history_session;
