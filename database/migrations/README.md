# Legacy Migration Archive

This folder is a legacy archive and is not the canonical migration chain.

Canonical source of truth:
- `supabase/migrations`

Rules:
- Do not run `database/migrations` by default in new environments.
- Use `scripts/run-all-migrations-supabase.sh` without legacy flags for standard setup.
- Only use files here for targeted backfills or one-off historical recovery with explicit approval.
