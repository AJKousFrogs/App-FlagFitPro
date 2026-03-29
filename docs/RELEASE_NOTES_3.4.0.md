# Release Notes: 3.4.0

## Summary

Version `3.4.0` is a frontend quality and deployment-alignment release.

The goal of this release is to make the shipped product feel cleaner, more consistent, and more reliable in production after the Netlify deployment:
- reduce SCSS drift and duplicated styling across Angular feature surfaces
- tighten design-system token usage instead of relying on raw spacing and color values
- improve dialog, loading, focus, and interaction behavior across shared UI
- align shipped frontend wellness fields with the production database schema

## What Changed

### Frontend Cleanup And SCSS Audit

- removed dead or redundant SCSS across feature and shared component styles
- simplified `dialog-overrides.scss` so modal rendering behavior is easier to reason about and maintain
- cleaned up PrimeNG integration styles and token mapping conflicts
- moved more styling toward shared utilities and design-system token usage

### Interaction And Accessibility Improvements

- improved focus-visible, hover, and active states across several shared UI surfaces
- added ARIA support to dialog and avatar-related components where interaction context needed to be clearer
- improved responsive behavior in header, search, FAB, onboarding, training, and dashboard-adjacent surfaces
- standardized more loading and empty-state behavior for a more consistent app experience

### Onboarding And Shared UI Refinement

- introduced a new `onboarding-modern-shell` component to give onboarding a more structured shell and stepper flow
- added a reusable `app-avatar` wrapper around PrimeNG avatar usage so variants can follow the design system consistently
- refined shared header and support components to improve layout stability and interaction polish

### Database Alignment For Shipped Frontend Fields

Two Supabase migrations shipped with this release:

- `20260329000000_allow_players_update_team_members.sql`
  - allows players to update their own `team_members` row for self-service profile fields like position and jersey number
  - keeps coach and head coach team membership update authority intact
- `20260330000000_add_wellness_checkin_columns.sql`
  - adds `motivation_level`, `mood`, and `hydration_level` to `daily_wellness_checkin` and `wellness_entries` when missing
  - fixes production schema drift that could cause wellness check-in API failures after frontend updates

## User-Facing Impact

Users should now see:
- cleaner spacing, styling, and visual consistency across more screens
- improved modal, dialog, and overlay behavior
- clearer focus and interaction states, especially on keyboard-accessible surfaces
- a more polished onboarding shell
- wellness check-ins that align better with the fields exposed in the current frontend

## Engineering Impact

- 72 files changed in the shipped `v3.4` commit
- frontend work was mostly consolidation and cleanup rather than large feature expansion
- design-system token usage is more consistent across SCSS layers
- production schema is better aligned with the active Angular UI

## Known Limitations

- this release improves styling consistency, but it does not complete a full visual system rewrite
- the app may still carry non-blocking third-party build warnings outside the scope of this release

## Verification Completed

- Netlify deployment completed for `v3.4`
- release scope verified against commit `731bdbaedc98762bca75eec629be99396bd20f5a`
- included Supabase schema migrations for shipped frontend wellness and membership behavior

## Scope Notes

`3.4.0` is not a backend-platform rewrite and it is not a major navigation re-architecture release.

It is a production polish release focused on frontend cleanup, interaction quality, design-system consistency, and schema alignment for already-shipped UI behavior.
