-- Reconstructed from live schema (Supabase MCP) — original file was never committed.
-- Idempotent re-application of the recovery_blocks load-cap columns (already added by
-- 20260622143245_add_missing_feature_columns_schema_drift.sql); kept to preserve applied version history.
alter table public.recovery_blocks
  add column if not exists max_load_percent integer,
  add column if not exists focus text,
  add column if not exists restrictions jsonb;
