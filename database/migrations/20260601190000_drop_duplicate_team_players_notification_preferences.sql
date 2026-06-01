-- Audit consolidation: drop two dead duplicate tables (0 rows, no FK deps, no live code refs).
-- Applied via Supabase MCP 2026-06-01.
-- - team_players: legacy denormalized roster; team_members is canonical. roster-core's fallback
--   to team_players was unreachable (only fired if team_members were missing) → removed.
-- - notification_preferences: superseded by user_notification_preferences (the db-helper table);
--   unused after the GDPR-export repoint.
-- (user_preferences vs user_settings were investigated and are NOT duplicates — structured
--  athlete profile vs generic key-value settings — left as-is.)
DROP TABLE public.team_players;
DROP TABLE public.notification_preferences;
