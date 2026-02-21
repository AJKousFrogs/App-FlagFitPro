-- Fix Supabase linter 0001 (unindexed foreign key)
-- team_sharing_settings.team_id references teams(id) and needs a leading-column index.
CREATE INDEX IF NOT EXISTS idx_team_sharing_settings_team_id
ON public.team_sharing_settings(team_id);
