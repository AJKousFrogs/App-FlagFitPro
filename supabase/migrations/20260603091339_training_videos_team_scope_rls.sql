-- A global training_videos library already exists (service-role-only). Make it a
-- usable library: add team scoping (NULL = global) and open read to athletes +
-- write to team staff. Applied via Supabase MCP; mirrored here.
ALTER TABLE public.training_videos
  ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_training_videos_team_cat ON public.training_videos (team_id, category);
CREATE POLICY training_videos_read ON public.training_videos
  FOR SELECT USING (is_active AND (team_id IS NULL OR public.ff_is_active_team_member(team_id, (SELECT auth.uid()))));
CREATE POLICY training_videos_staff_write ON public.training_videos
  FOR ALL
  USING (team_id IS NOT NULL AND public.ff_is_team_staff(team_id, (SELECT auth.uid())))
  WITH CHECK (team_id IS NOT NULL AND public.ff_is_team_staff(team_id, (SELECT auth.uid())));
