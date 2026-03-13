# Release Notes: 1.2.0

## Summary

Version `1.2.0` is a frontend workflow-completion update focused on consistent loading, error, empty, and retry behavior across the app's primary player and coach routes.

## User-Facing Changes

- Improved the Today and daily protocol experience so failed initial loads no longer appear as valid empty states.
- Standardized route-level loading and retry behavior across training, team invitation, and coach workflow screens.
- Improved clarity for coaches by separating real empty states from load failures in planning, roster-adjacent, film, scouting, and knowledge surfaces.

## Frontend Hardening

- Added explicit loading, error, and retry handling to:
  - daily protocol tournament calendar
  - achievements panel
  - LA28 roadmap
  - Today
  - training schedule
  - training session detail
  - invitation acceptance
  - coach calendar
  - team settings
  - practice planner
  - program builder
  - player development
  - tournament management
  - film room
  - knowledge base
  - scouting reports
  - payment management
- Corrected shared loading-component usage across coach routes so production builds stay aligned with the supported loading variants.

## Verification Completed

- Angular type-check
- Angular lint
- Angular production build
- Angular Vitest suite

## Test Results

- `npm run type-check`: passed
- `npm run lint`: passed
- `npm run build`: passed
- `npm test`: passed (`39` files, `748` tests)

## Scope Notes

- `1.2.0` does not introduce a broad database upgrade.
- Backend and database changes remain scoped behind existing release behavior from earlier hardening work.
- The primary objective of `1.2.0` is user-facing route consistency and safer failure handling.
