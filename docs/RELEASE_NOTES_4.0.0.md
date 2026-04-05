# Release Notes: 4.0.0

## Summary

Version `4.0.0` is a **major milestone** release focused on a coherent **UI redesign**, **Supabase client and data-layer polish**, and **TypeScript/JavaScript quality fixes** across the Angular application and shared platform code.

The goals of this release are:

- deliver a more consistent visual language using design tokens, PrimeNG theming, and feature-level SCSS alignment
- make Supabase usage more predictable: auth flows, interceptors, realtime, error handling, and alignment with RLS and schema expectations
- reduce technical debt in TS/JS: stricter patterns in core services, guards, interceptors, logging, and tests so behavior is easier to reason about and safer to change

## What Changed

### Redesign And Design System

- consolidated styling around shared design-system tokens and PrimeNG integration layers (`design-system-tokens`, theme overlays, brand overrides, token mapping)
- broad SCSS updates across coach, player, analytics, dashboard, onboarding, and shared surfaces for spacing, typography, and component consistency
- improved overlay, panel, and dialog behavior for a more cohesive “app shell” feel
- visual polish on high-traffic flows: dashboards, chat, community, game-day and tournament-related screens where layout and density were inconsistent

### Supabase Polish

- refined Supabase client usage: session handling, query patterns, and defensive handling of missing or partial data
- tighter alignment between frontend expectations and database contracts (fields, RLS behavior, and error surfaces)
- improvements to auth-related flows: guards, interceptors, and centralized error/logging paths so failures are visible without leaking sensitive detail
- realtime and notification-related code paths reviewed for consistency with the rest of the stack
- database repository hygiene (for example, clearer separation of legacy SQL archives vs active migrations) to reduce confusion for operators and contributors

### TypeScript And JavaScript Fixes

- core services and view-models: clearer typing, fewer implicit `any` edges, and more consistent async/error handling
- interceptors (auth, error) and global error handling aligned with logging and observability conventions
- test and E2E adjustments where types, mocks, or smoke coverage needed to match refactored behavior
- small but impactful fixes in utilities, constants validation, and shared helpers used across features

### Tooling And Quality

- continued alignment with Node 22+ and the project’s chosen package manager version for reproducible installs
- incremental hardening of build-time and test-time behavior where the redesign and Supabase changes touched shared code

## User-Facing Impact

Users should notice:

- a more unified look and feel: fewer one-off colors and spacing values, more predictable cards, panels, and dense dashboards
- smoother or clearer failure behavior when the backend rejects a request or data is temporarily unavailable (without exposing raw internals)
- fewer odd UI inconsistencies when switching between coach and player experiences

## Engineering Impact

- large touch surface across Angular `core` services, feature SCSS, and Supabase-related code; reviewers should treat this as a **design + platform** release, not a single-feature bump
- semantic version **major** (`4.0.0`) reflects breaking-risk for **operators and integrators** (theming paths, env expectations, or DB migration ordering) even when end-user workflows remain familiar

## Migration And Upgrade Notes

- **Frontend:** follow [LOCAL_DEVELOPMENT_SETUP.md](./LOCAL_DEVELOPMENT_SETUP.md) and [ANGULAR_PRIMENG_GUIDE.md](./ANGULAR_PRIMENG_GUIDE.md); clear `node_modules` and reinstall if local Sass or token resolution looks stale after pulling.
- **Database:** apply Supabase migrations in repo order; see [DATABASE_SETUP.md](./DATABASE_SETUP.md) and [RLS_POLICY_SPECIFICATION.md](./RLS_POLICY_SPECIFICATION.md). If you maintain a forked schema, diff against this release’s migrations before deploy.
- **Configuration:** confirm environment variables for Supabase URL/keys and any feature flags documented in [BACKEND_SETUP.md](./BACKEND_SETUP.md) / deployment runbooks.

## Known Limitations

- `4.0.0` improves consistency and reliability but does not imply every screen has been rebuilt from scratch; some legacy layout debt may remain in lower-traffic areas.
- Third-party or toolchain warnings unrelated to this release may still appear in local or CI logs until addressed separately.

## Verification Completed

Complete these items before tagging or publishing the release; update the commit line to the exact tag or merge commit.

- [ ] Production or staging deploy verified for critical paths (login, dashboard, coach tools, player flows)
- [ ] Unit tests (`angular`: `npm test`) and targeted E2E (e.g. `npm run e2e:smoke`) run clean on the release commit
- [ ] Root and `angular/` `package.json` versions are `4.0.0` and match the git tag

**Documentation baseline commit:** `426cf6c508df2fb60a297220e89d6e5c9267e332` (update when you cut the release tag)

**Release tag / merge commit:** _fill at release time_

## Scope Notes

`4.0.0` is intentionally framed as **redesign + Supabase polish + TS/JS fixes**. It is not a single new product feature release; it raises baseline quality for everything that follows.

For earlier release history, see [RELEASE_NOTES_3.4.0.md](./RELEASE_NOTES_3.4.0.md).
