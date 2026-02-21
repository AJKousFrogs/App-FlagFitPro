-- Enforce explicit nutritionist approval before Merlin consumes KB entries.
-- Existing legacy entries are backfilled as approved for backward compatibility.

ALTER TABLE public.knowledge_base_entries
  ADD COLUMN IF NOT EXISTS is_merlin_approved boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS merlin_approval_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS merlin_submitted_by uuid NULL,
  ADD COLUMN IF NOT EXISTS merlin_submitted_by_role text NULL,
  ADD COLUMN IF NOT EXISTS merlin_submitted_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS merlin_approved_by uuid NULL,
  ADD COLUMN IF NOT EXISTS merlin_approved_by_role text NULL,
  ADD COLUMN IF NOT EXISTS merlin_approved_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS merlin_approval_notes text NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'kb_merlin_approval_status_check'
  ) THEN
    ALTER TABLE public.knowledge_base_entries
      ADD CONSTRAINT kb_merlin_approval_status_check
      CHECK (merlin_approval_status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'kb_merlin_approved_requires_timestamp_check'
  ) THEN
    ALTER TABLE public.knowledge_base_entries
      ADD CONSTRAINT kb_merlin_approved_requires_timestamp_check
      CHECK (
        (is_merlin_approved = false)
        OR (is_merlin_approved = true AND merlin_approved_at IS NOT NULL)
      );
  END IF;
END $$;

ALTER TABLE public.knowledge_base_entries
  DROP CONSTRAINT IF EXISTS kb_merlin_submitted_by_fkey,
  DROP CONSTRAINT IF EXISTS kb_merlin_approved_by_fkey;

ALTER TABLE public.knowledge_base_entries
  ADD CONSTRAINT kb_merlin_submitted_by_fkey
    FOREIGN KEY (merlin_submitted_by) REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD CONSTRAINT kb_merlin_approved_by_fkey
    FOREIGN KEY (merlin_approved_by) REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_kb_merlin_approved
  ON public.knowledge_base_entries(is_merlin_approved);

CREATE INDEX IF NOT EXISTS idx_kb_merlin_approval_status
  ON public.knowledge_base_entries(merlin_approval_status);

CREATE INDEX IF NOT EXISTS idx_kb_merlin_submitted_by
  ON public.knowledge_base_entries(merlin_submitted_by);

-- Backfill existing rows so current behavior is preserved.
UPDATE public.knowledge_base_entries
SET
  is_merlin_approved = true,
  merlin_approval_status = 'approved',
  merlin_submitted_at = COALESCE(merlin_submitted_at, created_at::timestamptz, now()),
  merlin_approved_at = COALESCE(merlin_approved_at, updated_at::timestamptz, now()),
  merlin_approved_by_role = COALESCE(merlin_approved_by_role, 'system_legacy'),
  merlin_approval_notes = COALESCE(merlin_approval_notes, 'Auto-approved during governance migration')
WHERE merlin_approval_status = 'pending'
  AND is_merlin_approved = false;
