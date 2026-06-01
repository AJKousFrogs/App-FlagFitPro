# Supabase migrations — authority model

**The authoritative record of applied migrations is the live database table
`supabase_migrations.schema_migrations`**, not this directory. As of
2026-06-01 it holds **119 migrations, every one retaining its full SQL**
(`statements`), so the applied history is completely recoverable from the DB.

This directory is the **file archive / working mirror** of that history. It is
useful for review, diffing, and from-scratch rebuilds, but it is **not a 1:1
mirror** of `schema_migrations` — read the drift notes below before running any
`supabase db push` against the live project.

## Two strata of history

1. **Genesis / baseline (pre-`20260130125835`) — disk-only.**
   The earliest files (`001_role_enforcement.sql`,
   `20250108000000_chatbot_role_aware_system.sql`,
   `20250108000001_knowledge_base_governance.sql`,
   `20251208154517_remote_schema.sql` (a `db pull` baseline snapshot), …) were
   applied in the dashboard/SQL-editor era **before** migration tracking was
   adopted. They are **not** present in `schema_migrations`. A from-scratch
   rebuild must replay these first — the first tracked migration
   (`apply_rls_policies_all_missing_tables`) assumes these tables already exist.

2. **Tracked era (`20260130125835` onward) — recorded in `schema_migrations`.**
   Everything applied via the Supabase CLI / MCP `apply_migration`. The DB is
   the source of truth for this stratum.

## Known drift (do not `db push` blindly)

- For the older tracked migrations the **file timestamps were hand-picked and do
  not equal the applied `schema_migrations` version**. Same migration, different
  stamp — e.g. file `20260405120000_calculate_acwr_rpc.sql` vs applied version
  `20260405092343`. Names mostly correspond; only ~20 of 79 pre-2026-05-14
  applied migrations matched a file by name before the backfill below.
- Because the version stamps diverge, `supabase db push` from this dir against
  the live project would treat the mismatched files as **new** and try to
  re-apply them. Don't. Use MCP `apply_migration` for changes (below).

## 2026-06-01 backfill

The 40 migrations applied via MCP between 2026-05-27 and 2026-06-01 — the dead-
table/ghost-cache cleanup, the `user_id` standardization clusters, the schedule-
spine + `event_participation` consolidation, and the backend-audit fixes
(`audit_fixC/E/E2/E3`) — were written to this dir from `schema_migrations` using
their **apply-time version stamps**, so for that window the filenames match the
authoritative versions exactly.

## Forward process

- Apply schema changes via **Supabase MCP `apply_migration`** (records them in
  `schema_migrations`, the authority). Then mirror the SQL into this dir as
  `<version>_<name>.sql` using the same version, to keep the archive current.
- To recover the exact applied SQL of any migration:
  ```sql
  select array_to_string(statements, E'\n')
  from supabase_migrations.schema_migrations
  where version = '<version>';
  ```
- From-scratch rebuild order: genesis files (stratum 1) first, then replay the
  `schema_migrations` history in `version` order.

> A future cleanup could collapse both strata into a single linear, faithfully-
> stamped chain, but that requires de-duping the ~20 name-overlaps and ordering
> genesis against the tracked era — deferred; not worth the archaeology pre-launch
> on a single live project.
