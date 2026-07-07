-- Monitoring: per-athlete BLOODWORK BASELINE store (additive, one concern).
-- Enables T:C delta% and individualised CK/ferritin/vit-D. SEX is NOT duplicated
-- here — sex-specific evaluation reads users.gender (already stored).
--
-- Reversal: DROP TABLE IF EXISTS public.bloodwork_baselines;

CREATE TABLE IF NOT EXISTS public.bloodwork_baselines (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  marker_name    text NOT NULL,
  baseline_value numeric NOT NULL,
  unit           text,
  established_on  date NOT NULL DEFAULT current_date,
  source_panel_id uuid REFERENCES public.bloodwork_panels(id) ON DELETE SET NULL,
  notes          text,
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, marker_name)
);
ALTER TABLE public.bloodwork_baselines ENABLE ROW LEVEL SECURITY;

-- CLINICAL: athlete own + physio roster only.
CREATE POLICY bloodwork_baselines_own ON public.bloodwork_baselines
  FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY bloodwork_baselines_physio_read ON public.bloodwork_baselines
  FOR SELECT TO authenticated
  USING (public.can_role_read_athlete(user_id, ARRAY['physio']));
