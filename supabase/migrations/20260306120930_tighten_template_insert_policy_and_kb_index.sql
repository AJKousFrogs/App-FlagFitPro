-- Close the final advisor findings from the backend hardening pass.
-- 1. Replace the permissive training_session_templates INSERT policy with
--    lightweight row validation that preserves the existing client flow.
-- 2. Add the remaining missing FK index on knowledge_base_entries.

DROP POLICY IF EXISTS training_session_templates_insert_authenticated
  ON public.training_session_templates;
CREATE POLICY training_session_templates_insert_authenticated
  ON public.training_session_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    coalesce(nullif(trim(session_name), ''), '') <> ''
    AND day_of_week BETWEEN 0 AND 6
    AND session_order >= 1
    AND (duration_minutes IS NULL OR duration_minutes > 0)
  );

CREATE INDEX IF NOT EXISTS idx_knowledge_base_entries_merlin_approved_by
  ON public.knowledge_base_entries(merlin_approved_by);
