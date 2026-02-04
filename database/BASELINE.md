## Schema Baseline Strategy

This repository maintains a schema baseline snapshot at `database/schema.baseline.sql`.
It is used as the canonical reference for forward-only patch migrations.

### Why a baseline?
- The legacy migration chain includes duplicate numbering and historical fixes.
- Re-running all migrations from zero is not deterministic across environments.
- A baseline snapshot provides a stable starting point.

### Regenerating the baseline
Preferred: dump from a live, up-to-date database.

Example (Postgres):
```bash
pg_dump --schema-only --no-owner --no-acl "$DATABASE_URL" > database/schema.baseline.sql
```

Example (Supabase):
```bash
supabase db dump --schema --db-url "$DATABASE_URL" > database/schema.baseline.sql
```

### Migration policy going forward
- Do **not** renumber historical migrations.
- Add new migrations as forward-only patch files.
- Document any data backfills or RLS changes in the migration file header.

