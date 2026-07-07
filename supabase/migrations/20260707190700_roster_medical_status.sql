-- Monitoring: DERIVED medical-clearance signal for head_coach (additive, one concern).
-- Head coach sees a derived cleared/flagged signal ONLY — never raw bloodwork,
-- physio, or wearable rows (those tables grant head_coach no read policy).
-- SECURITY DEFINER computes status from the clinical tables (bypassing their RLS)
-- but returns ONLY {user_id, status, flag_categories[]} — coarse categories, no
-- values/markers/notes. The caller is gated in-function to head_coach/physio.
--
-- Reversal: DROP FUNCTION IF EXISTS public.roster_medical_status(uuid);

CREATE OR REPLACE FUNCTION public.roster_medical_status(p_team uuid)
RETURNS TABLE (user_id uuid, status text, flag_categories text[])
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- (table aliases avoid ambiguity with the RETURNS TABLE out-params.)
  IF NOT EXISTS (
    SELECT 1 FROM team_member_roles tmr
    WHERE tmr.team_id = p_team AND tmr.user_id = (SELECT auth.uid())
      AND tmr.role IN ('head_coach','physio')
  ) THEN
    RETURN;  -- empty for anyone else
  END IF;

  RETURN QUERY
  SELECT a.uid,
         CASE WHEN array_length(f.cats,1) IS NULL THEN 'cleared' ELSE 'flagged' END,
         COALESCE(f.cats, ARRAY[]::text[])
  FROM (SELECT DISTINCT tmr2.user_id AS uid FROM team_member_roles tmr2
        WHERE tmr2.team_id = p_team AND tmr2.role = 'athlete') a
  CROSS JOIN LATERAL (
    SELECT array_remove(ARRAY[
      CASE WHEN EXISTS (SELECT 1 FROM physio_blocks pb
                        WHERE pb.user_id = a.uid AND pb.is_active
                          AND (pb.end_date IS NULL OR pb.end_date >= current_date))
           THEN 'physio_block' END,
      CASE WHEN EXISTS (SELECT 1 FROM athlete_injuries ai
                        WHERE ai.user_id = a.uid
                          AND ai.recovery_status IN ('active','recovering','rehab'))
           THEN 'injury' END,
      CASE WHEN EXISTS (SELECT 1 FROM bloodwork_markers bm
                        JOIN bloodwork_panels bp ON bp.id = bm.panel_id
                        WHERE bp.user_id = a.uid AND bm.flag = 'critical')
           THEN 'bloodwork' END
    ], NULL) AS cats
  ) f;
END;
$$;
REVOKE ALL ON FUNCTION public.roster_medical_status(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.roster_medical_status(uuid) TO authenticated;
