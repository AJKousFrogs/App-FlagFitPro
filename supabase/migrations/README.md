# Supabase migrations — authority model

**The authoritative record of applied migrations is the live database table
`supabase_migrations.schema_migrations`** (122 migrations as of 2026-06-01, each
retaining its full SQL in `statements`). This directory is the **file mirror** of
that history.

As of the 2026-06-01 reconciliation, the **tracked era is a faithful 1:1 mirror**:
every applied migration has a file named `<version>_<name>.sql` whose contents are
the exact applied SQL, and the hand-picked-timestamp duplicate files that used to
drift from the applied versions were removed. To recover or diff any migration:

```sql
select array_to_string(statements, E'\n')
from supabase_migrations.schema_migrations
where version = '<version>';
```

## File strata

1. **Tracked era (`>= 20260130125835`) — 122 files, faithful mirror.**
   Generated from `schema_migrations`; file version == applied version.

2. **Genesis (`< 20260130125835`) — 40 files, disk-only.**
   The dashboard/SQL-editor-era baseline applied *before* migration tracking was
   adopted (`001_role_enforcement.sql`, `20250108…_chatbot…`,
   `20251208154517_remote_schema.sql` (a `db pull` snapshot), …). **Not** in
   `schema_migrations`. A from-scratch rebuild replays these first, then the
   tracked era in `version` order.

3. **Out-of-band (in the tracked date range but NOT in `schema_migrations`) — 8 files.**
   Applied via the dashboard/SQL editor (so their effects are in the DB but were
   never tracked), or superseded drafts. Kept as records:
   `20260217143000_privacy_objects_and_consent_views`,
   `20260217150000_consolidate_permissive_policies`,
   `20260221171000_add_kb_merlin_approved_by_fk_covering_index`,
   `20260329000000_allow_players_update_team_members`,
   `20260330000000_add_wellness_checkin_columns`,
   `20260401002000_broadcast_notifications`,
   `20260405170000_fix_upsert_wellness_checkin_ambiguous_checkin_date` (superseded
   by the tracked `…_v2`),
   `20260514120000_seed_evidence_based_knowledge_expansion`.

## Forward process

- Apply schema changes via **Supabase MCP `apply_migration`** (records them in
  `schema_migrations`, the authority), then **mirror the SQL into this dir** as
  `<version>_<name>.sql` using the same version. That keeps the tracked-era mirror
  faithful going forward.
- Don't `supabase db push` blind against the live project; the genesis +
  out-of-band strata are not represented in `schema_migrations`, so reconcile
  intentionally if you ever migrate environments.
