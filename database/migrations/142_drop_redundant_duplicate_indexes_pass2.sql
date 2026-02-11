-- 142_drop_redundant_duplicate_indexes_pass2.sql
-- Purpose: remove redundant non-constraint indexes that duplicate PK/UNIQUE indexes.
-- Source: duplicate-index audit (2026-02-11 pass 2).

BEGIN;

DROP INDEX IF EXISTS public.idx_athlete_consent_settings_athlete;
DROP INDEX IF EXISTS public.idx_chatbot_context_user;
DROP INDEX IF EXISTS public.idx_games_game_id;
DROP INDEX IF EXISTS public.idx_team_invitations_token;
DROP INDEX IF EXISTS public.idx_user_ai_preferences_user;
DROP INDEX IF EXISTS public.idx_user_security_user;
DROP INDEX IF EXISTS public.idx_users_email;

COMMIT;
