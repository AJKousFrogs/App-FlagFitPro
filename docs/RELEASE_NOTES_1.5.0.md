# Release Notes: 1.5.0

## Summary

Version `1.5.0` hardens role-based access, route protection, and cross-feature authorization consistency across the app.

The goal of this release is trust integrity:
- the frontend should not expose the wrong workflows to the wrong roles
- the backend should not reject valid coach/staff roles that the UI already allows
- coach, admin, staff, and player access should follow the same shared role model

## What Changed

### Angular Route And Navigation Authorization

- added shared Angular role guards for coach and staff routes
- applied role-aware guards to coach and staff route groups
- aligned coach navigation visibility with the real team role model
- expanded navigation handling for:
  - `owner`
  - `head_coach`
  - `offense_coordinator`
  - `defense_coordinator`
  - `assistant_coach`
  - `manager`

### Shared Backend Role Sets

- introduced centralized backend role-set constants
- reduced ad hoc per-function role arrays
- aligned backend authorization with the same capability groups used by the frontend authorization pass

### Team Operations Authorization

The following team-management functions now use shared role capability checks instead of narrower legacy `coach/admin` checks:
- attendance
- equipment
- payments
- training session creation for other users
- depth chart
- coach activity
- tournament calendar national-team actions

### Staff And Health Authorization

Aligned role handling for:
- nutritionist dashboards
- psychology dashboards
- load management
- wellness cross-athlete access
- ACWR cross-athlete access

This reduces mismatches where valid staff or coach roles could access a route but fail at the backend.

### Response And Review Workflows

Updated shared/team-scoped coach authorization on:
- AI response feedback
- coach review access patterns

### Shared Auth And Type Cleanup

- updated shared backend authorization helper behavior to prefer active team memberships
- replaced stale coarse Angular role typing in common/shared models
- aligned privacy UX role handling with the real team role model

## User-Facing Impact

Users should now see:
- fewer cases where a route loads but backend actions fail due to role mismatch
- fewer cases where valid coach or staff roles are treated like plain players
- more consistent access across coach dashboards, staff dashboards, wellness, roster operations, and team management

## Verification Completed

- Angular type-check
- Angular lint
- Angular production build
- targeted authorization/integration tests
- full backend integration suite

Backend verification result:
- `103` test files passed
- `381` tests passed

## Scope Notes

`1.5.0` is an authorization and role-integrity release.

It is not a visual redesign and it is not a broad feature release.
Its purpose is to make admin, coach, staff, and player behavior consistent before `2.0` UI polish work.

