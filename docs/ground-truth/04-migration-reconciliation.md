# Migration Reconciliation

Verified against live (Supabase migration history): 2026-06-09

Reconciles the live applied migration history (Supabase `supabase_migrations.schema_migrations`)
against the two on-disk migration directories. Versions are leading numeric/timestamp tokens
parsed from filenames.

## Counts

| Set | Count |
| --- | ----- |
| Applied (live, Supabase history) | 146 |
| `database/migrations/` .sql files | 171 (133 unique version prefixes) |
| `supabase/migrations/` .sql files | 194 (171 unique version prefixes) |
| Applied with NO matching file (either dir) | 4 |
| `database/migrations/` files NOT applied | 133 (all of them) |
| `supabase/migrations/` files NOT applied | 29 |
| Versions present in BOTH dirs | 1 (`001`) |
| Only in `database/` | 132 |
| Only in `supabase/` | 170 |

Note: the task brief estimated ~144 applied; the live history returns 146.

## Applied with no file

These 4 applied versions have no file whose name starts with the version in either directory.
All are recent (2026-06) and correspond to files whose filename timestamp was hand-coined to a
different value than the version Supabase recorded (see "Version/naming drift" below) — so they
exist on disk under a different version token, not as truly missing migrations.

- `20260603091339` — applied name `training_videos_team_scope_rls` (file is `20260603091500_...`)
- `20260609100045` — applied name `athlete_personal_events` (file is `20260609120000_...`)
- `20260609115541` — applied name `team_training_days_and_training_event_kind` (file is `20260609150000_team_training_days.sql`)
- `20260609115628` — applied name `widen_readiness_scores_subscores` (no distinct file; bundled near the above)

## Files not applied (by dir)

### `database/migrations/` — 133 version prefixes, ZERO applied

The entire `database/migrations/` directory is legacy/pre-baseline. None of its version
prefixes appear in the live Supabase history.

- 95 files use old numeric naming `001_*`, `025_*` … `142_*` (e.g. `001_base_tables.sql`,
  `142_*.sql`). Numeric prefixes present: 001, 025-056, 060-081, 097, 099-105, 110-121, 140-142.
- 63 files use 14-digit timestamp naming (`20260305213000_*` … `20260601201000_*`). These
  timestamps were hand-coined and **none** match an applied version (0 of 63 overlap with applied).
- 2 files have no numeric prefix at all: `create-injuries-table.sql`, `fix_wellness_sync_trigger.sql`.

Treat `database/migrations/` as squashed/legacy history — not the source of truth for what is live.

### `supabase/migrations/` — 29 version prefixes not applied

These are pre-baseline / squashed / superseded files. Full list:

```
001 20250108000000 20250108000001 20250130000000 20251208154517 20251208164957
20251213000000 20251220 20260106 20260107 20260109 20260110 20260111 20260112
20260113 20260117 20260130 20260217143000 20260217150000 20260221171000
20260329000000 20260330000000 20260401002000 20260405170000 20260514120000
20260601173200 20260603091500 20260609120000 20260609150000
```

The early-2025 and short-token entries (`001`, `20251220`, `20260106`…) predate the
`20260130125835` baseline (`apply_rls_policies_all_missing_tables`, the earliest applied
version). The trailing few (`20260601173200`, `20260603091500`, `20260609120000`,
`20260609150000`) are the file-side of the timestamp-drift cases below.

## Two-dir split

**CONFIRMED as drift.** The two migration directories are effectively disjoint histories:

- Only **1** version (`001`) appears in both dirs, and `001` is not applied.
- `database/migrations/` is old numeric + hand-coined-timestamp legacy with **0** applied overlap.
- `supabase/migrations/` is the dir that tracks (most of) the live history; 165 of its 171
  unique versions are applied.

The live Supabase history aligns almost entirely with `supabase/migrations/`.
`database/migrations/` should be considered legacy/archived and not reconciled file-by-file
against live.

## Version/naming drift (samples)

**CONFIRMED.** Several applied migrations were recorded under a version that does NOT match the
timestamp prefix of the corresponding file in `supabase/migrations/`. The Supabase CLI records
the version it assigns at apply time, which diverged from the hand-edited filename timestamp.

| Applied name | Applied version | File on disk | File timestamp |
| --- | --- | --- | --- |
| `team_training_days_and_training_event_kind` | `20260609115541` | `20260609150000_team_training_days.sql` | 20260609150000 |
| `athlete_personal_events` | `20260609100045` | `20260609120000_athlete_personal_events.sql` | 20260609120000 |
| `training_videos_team_scope_rls` | `20260603091339` | `20260603091500_training_videos_team_scope_rls.sql` | 20260603091500 |
| `create_safety_trigger_functions` | `20260601101233` | `20260601180000_create_safety_trigger_functions.sql` (database/) | 20260601180000 |
| `widen_readiness_scores_subscores` | `20260609115628` | (no distinct timestamped file located) | — |

In every divergent case the applied version is EARLIER than the filename timestamp, i.e. filenames
were bumped after the fact and never reconciled back to the recorded version.

## How to refresh

Re-run the live history and re-diff:

1. Fetch applied list via Supabase MCP: `list_migrations` with
   `project_id = grfjmnjpzvknmsxrwesx` → returns `{version, name}` per applied migration.
2. Extract on-disk version prefixes:
   - `ls database/migrations/*.sql | sed 's#.*/##' | grep -oE '^[0-9]+' | sort -u`
   - `ls supabase/migrations/*.sql | sed 's#.*/##' | grep -oE '^[0-9]+' | sort -u`
3. `comm` the applied set against each dir's version set to regenerate the tables above.
4. Spot-check applied `name` vs the matching `supabase/migrations/<timestamp>_<name>.sql`
   filename to catch new version/timestamp divergences.
