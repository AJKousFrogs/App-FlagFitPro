# Legacy Server Files

This folder contains legacy development server entrypoints that were
previously located at the repo root. They are preserved here for
reference and rollback safety but are not part of the supported
development workflow.

## Files
- `server-supabase.js`
- `simple-server.js`

## Rationale
FlagFit Pro uses `server.js` as the primary backend entrypoint.
Keeping legacy alternatives in the repo root caused confusion and
increased the risk of drift. These files are archived instead of deleted
to preserve historical context and simplify recovery if needed.
