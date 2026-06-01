# Legacy Migration Archive

This folder is a legacy archive and is not the canonical migration chain.

Authority model:
- The authoritative record of **applied** migrations is the live database table
  `supabase_migrations.schema_migrations` (every row retains its full SQL).
- `supabase/migrations` is the file archive / working mirror of that history.
  See `supabase/migrations/README.md` for its strata and known timestamp drift.
- This `database/migrations` folder is an older legacy archive — neither
  authoritative nor the file mirror.

Rules:
- Do not run `database/migrations` by default in new environments.
- Use `scripts/run-all-migrations-supabase.sh` without legacy flags for standard setup.
- Only use files here for targeted backfills or one-off historical recovery with explicit approval.
- New migrations go through Supabase MCP `apply_migration` (recorded in
  `schema_migrations`), then are mirrored into `supabase/migrations`.
