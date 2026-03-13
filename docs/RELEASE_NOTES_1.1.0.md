# Release Notes: 1.1.0

## Summary

Version `1.1.0` is a stability and release-hardening update focused on frontend resilience, backend contract consistency, and dependency alignment.

## User-Facing Changes

- Improved the Settings experience with explicit page-level loading, error, and retry states.
- Fixed a training daily protocol roadmap compile issue caused by a missing PrimeNG card import.
- Updated local setup documentation to reflect the current Angular and npm workflow.

## Backend Hardening

- Standardized Netlify function exports so integration tests and runtime wrappers use the same named handler contract.
- Added a shared `netlify/functions/supabase-client.js` compatibility entry point for function-level imports.
- Fixed validation and authorization regressions in:
  - daily protocol mutations
  - training program reads
  - notification creation
- Cleaned root tooling lint issues in function utilities and audit scripts.

## Dependency Updates

- Root `netlify-cli` updated to `24.2.0`.
- Angular workspace aligned to `21.2.2` across framework and build packages.
- Angular workspace now uses `npm` with a lockfile-backed install flow.

## Verification Completed

- Angular production build
- Angular lint
- Angular type-check
- Angular unit tests
- Playwright smoke tests
- Backend audit gates
- Root tooling lint
- Full backend integration suite

## Known Remaining Risk

- Root-level audit advisories still remain under `netlify-cli` transitive dependencies.
- Angular workspace audit is clean.
- No broad database upgrade was included in `1.1.0`; database work remains scoped to existing release behavior.
