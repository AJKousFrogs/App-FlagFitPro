-- Align player_programs.user_id with the authenticated Supabase user model.
-- The runtime writes auth user ids into both player_id and user_id, so this
-- foreign key must target auth.users rather than public.users.

ALTER TABLE public.player_programs
  DROP CONSTRAINT IF EXISTS player_programs_user_id_fkey;

ALTER TABLE public.player_programs
  ADD CONSTRAINT player_programs_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;
