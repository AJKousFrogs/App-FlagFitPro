-- Add diagram column to coach_playbook_plays for persisting play canvas state
-- (player positions, drawn routes) as JSONB.
alter table public.coach_playbook_plays
  add column if not exists diagram jsonb;
