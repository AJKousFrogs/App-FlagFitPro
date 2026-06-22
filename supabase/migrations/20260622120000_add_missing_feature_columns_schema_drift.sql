-- Schema-drift remediation: add columns live code reads/writes but were never
-- migrated (verified via the schema-drift audit). Additive + nullable, no risk.
alter table public.games add column if not exists version integer not null default 1;
alter table public.ai_messages add column if not exists coach_reviewed_at timestamptz;
alter table public.ai_messages add column if not exists coach_reviewed_by uuid;
alter table public.ai_messages add column if not exists feedback_received boolean not null default false;
alter table public.ai_response_feedback add column if not exists feedback_source text;
alter table public.ai_response_feedback add column if not exists was_helpful boolean;
alter table public.ai_response_feedback add column if not exists knowledge_sources_used jsonb;
alter table public.decision_ledger add column if not exists review_date timestamptz;
alter table public.decision_ledger add column if not exists review_priority text;

-- Auto-recovery feature: recovery_blocks carries a load cap + focus + restrictions
-- (written by wellness-checkin/games-core, read by ai-chat).
alter table public.recovery_blocks add column if not exists max_load_percent integer;
alter table public.recovery_blocks add column if not exists focus text;
alter table public.recovery_blocks add column if not exists restrictions jsonb;
