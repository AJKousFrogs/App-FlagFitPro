-- Monitoring: clinician-authored PHYSIO BLOCK (additive, one concern).
-- Distinct from recovery_blocks (the training engine's deload/recovery store);
-- this is the medical restriction, queryable for precedence via the active window.
--
-- Reversal: DROP TABLE IF EXISTS public.physio_blocks;

CREATE TABLE IF NOT EXISTS public.physio_blocks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body_region   text,
  block_type    text,
  restrictions  text[] NOT NULL DEFAULT '{}',
  max_load_percent integer,
  injury_id     uuid REFERENCES public.athlete_injuries(id) ON DELETE SET NULL,
  start_date    date NOT NULL DEFAULT current_date,
  end_date      date,
  is_active     boolean NOT NULL DEFAULT true,
  authored_by   uuid,
  clinical_note text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_physio_blocks_active
  ON public.physio_blocks (user_id, is_active, end_date);
ALTER TABLE public.physio_blocks ENABLE ROW LEVEL SECURITY;

-- CLINICAL: athlete own-read + physio roster (physio also writes).
-- head_coach gets the DERIVED signal only (see roster_medical_status migration).
CREATE POLICY physio_blocks_own_read ON public.physio_blocks
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY physio_blocks_physio_all ON public.physio_blocks
  FOR ALL TO authenticated
  USING (public.can_role_read_athlete(user_id, ARRAY['physio']))
  WITH CHECK (public.can_role_read_athlete(user_id, ARRAY['physio']));
