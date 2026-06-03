-- Make the daily supplement log idempotent: exactly one row per (user, supplement, day),
-- so the Wellness check-in toggles upsert instead of accumulating duplicate rows.
-- Applied via Supabase MCP (schema_migrations version 20260602111206); mirrored here.

-- 1) Collapse the existing duplicate group(s), keeping the most recent row.
DELETE FROM public.supplement_logs a
USING public.supplement_logs b
WHERE a.user_id = b.user_id
  AND a.supplement_name = b.supplement_name
  AND a.date = b.date
  AND (a.created_at < b.created_at
       OR (a.created_at = b.created_at AND a.id < b.id));

-- 2) Enforce one row per supplement per day → enables ON CONFLICT upsert.
ALTER TABLE public.supplement_logs
  ADD CONSTRAINT supplement_logs_user_name_date_uniq
  UNIQUE (user_id, supplement_name, date);
