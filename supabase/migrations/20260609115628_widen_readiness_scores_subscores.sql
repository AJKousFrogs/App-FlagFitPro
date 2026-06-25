-- Reconstructed from live schema (Supabase MCP) — original file was never committed.
-- sleep_score/wellness_score were numeric(4,2), overflowed at the 0-100 scale; widen to numeric(5,2).
alter table public.readiness_scores
  alter column sleep_score type numeric(5, 2),
  alter column wellness_score type numeric(5, 2);
