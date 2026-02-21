-- Add missing FK covering index flagged by Supabase advisor.
-- Safe/idempotent: only creates index if the target table exists.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'knowledge_base_entries'
      AND c.relkind = 'r'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_knowledge_base_entries_kb_merlin_approved_by_fk_cov
      ON public.knowledge_base_entries (kb_merlin_approved_by);
  END IF;
END $$;
