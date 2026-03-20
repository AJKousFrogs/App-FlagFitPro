# Release Notes: 2.1.0

## Summary

Version `2.1.0` is a consolidation release.

The goal of this release is to narrow the product into a clearer core before the planned v3 UI redesign:
- athlete flows should center on `Dashboard`, `Today`, `Training`, `Wellness`, and `Performance`
- coach flows should center on `Dashboard`, `Roster`, `Planning`, `Performance`, and `Team`
- legacy and specialist routes should stop behaving like separate products

## What Changed

### Product Surface Consolidation

- reduced top-level navigation for athlete and coach roles
- moved low-frequency destinations out of primary navigation
- narrowed quick actions to the main daily workflows
- removed or de-emphasized standalone product islands that were diluting the core story

### Canonical Workspace Routing

Introduced clearer route ownership for the main product areas:
- `/performance/insights`
- `/performance/tests`
- `/performance/load`
- `/coach/planning`
- `/team/workspace`

Legacy routes are still supported as compatibility redirects, but the app now teaches the consolidated workspaces first.

### Feature Simplification

- simplified `Analytics` by removing preview and export-heavy branches from the primary experience
- simplified `Roster` by removing invitation-management UI from the page-level workflow
- simplified `Settings` by removing experimental and team-request flows from the core settings surface
- simplified `Today` by routing users back into core training and wellness workflows
- shortened athlete onboarding so activation requires fewer non-core steps
- simplified the coach dashboard so it no longer embeds a duplicate analytics experience

### Non-Core Route Deprecation

The following surfaces were reduced to compatibility routes or folded into core workflows:
- `elite-command-center`
- `community`
- `game-tracker`
- `travel-recovery`
- `game nutrition`
- `video curation`
- `depth chart`
- `payments`
- `equipment`
- `officials`
- specialist coach planning, development, film, injury, and scouting routes

## User-Facing Impact

Users should now see:
- fewer overlapping entry points for the same workflow
- clearer separation between daily product use and secondary team operations
- less navigation noise for both athletes and coaches
- more consistent routing into `Performance`, `Planning`, and `Team Workspace`

## Engineering Impact

- restored a green production build after fixing active compile issues
- reduced route/preload sprawl so non-core pages are less likely to load eagerly
- reduced some large lazy chunks by trimming dead or duplicated page-level logic
- aligned package metadata with the actual release version

## Known Limitations

- the app still has non-blocking third-party build warnings from `primeng` and `html2canvas`
- the overall bundle remains larger than the desired v3 target
- several large core routes still need deeper architectural and UX refinement in later releases

## Verification Completed

- Angular production build

## Scope Notes

`2.1.0` is not a visual redesign release.

It is a cleanup and consolidation release intended to make the product easier to understand, easier to ship, and easier to redesign in v3.
