# Data Continuity Model

**Last Updated:** March 2026  
**Status:** Active

---

## Purpose

This document defines the authoritative data sources for player identity, team membership, training preferences, continuity events, tournament-day state, and travel recovery.

Use this when adding or modifying features that touch onboarding, settings, Today, dashboard, roster, tournaments, recovery, or coach workflows.

---

## Source Of Truth

### Identity

- `users` is the source of truth for player identity and profile fields.
- Canonical fields include:
  - `id`
  - `email`
  - `full_name`
  - `first_name`
  - `last_name`
  - `date_of_birth`
  - `height_cm`
  - `weight_kg`
  - `phone`
  - `country`

### Team Membership

- `team_members` is the source of truth for active team membership and role.
- Canonical team-specific fields include:
  - `team_id`
  - `user_id`
  - `role`
  - `status`
  - `position`
  - `jersey_number`
- Angular should prefer `TeamMembershipService` for current team resolution.

### Roster Projection

- `team_players` is a roster-facing projection layer, not the primary identity source.
- It may mirror display fields for roster UX, but it must stay linked by `user_id`.
- Any flow that creates or updates player-team relationships must keep `team_players` in sync with `users` and `team_members`.

### Training Preferences

- `/api/player-settings` backed by `athlete_training_config` is the canonical player training-settings contract.
- Onboarding may collect preference inputs, but it must seed the canonical player-settings API after successful account setup.
- `user_preferences` may store broader preference history, but it must not become a parallel authority for daily training logic.

### Travel Recovery

- `athlete_travel_log` is the canonical persistence source for active travel recovery continuity.
- Travel planning UI may keep local signal state for interaction, but persisted continuity must come from `athlete_travel_log`.

### Continuity Events

- `ContinuityIndicatorsService` is the shared continuity read model for:
  - game day recovery
  - ACWR load caps
  - travel recovery
  - return-to-play protocols
- Dashboard, Today, and coach continuity surfaces should read from this shared model instead of recomputing independently.

### Tournament Day State

- `tournament_day_plans` is the canonical source for tournament-day schedule and nutrition-window progress.
- `hydration_logs` is the canonical source for tournament-day hydration entries.
- `localStorage` may be used as a temporary compatibility/offline cache only.

---

## Write Path Rules

### Onboarding

- Must create/update `users`
- Must create/update `team_members` when team is selected
- Must create/update `team_players` for player roster visibility
- Must seed `/api/player-settings`
- May upsert `user_preferences`, but only keyed by `user_id`

### Settings

- Must update `users`
- Must update active `team_members` membership details
- Must update or move the matching `team_players` record

### Invitation Acceptance

- Must create/update `team_members`
- Must create/update the player-facing `team_players` projection

### Travel Recovery

- Must persist travel plans into `athlete_travel_log`
- Must restore current travel plan from persisted data on reload

### Tournament Nutrition

- Must persist schedule and nutrition-window state to `tournament_day_plans`
- Must persist hydration entries to `hydration_logs`
- If only legacy local state exists, it should be migrated into persisted state on load

---

## Read Path Rules

- Current team resolution should prefer `TeamMembershipService`
- Roster should merge `team_players` with fresher `users` and `team_members` fields when records refer to the same `user_id`
- Today and dashboard should both surface active continuity events from `ContinuityIndicatorsService`
- Coach team continuity should use canonical player names from `users.full_name` with first/last fallbacks

---

## Anti-Patterns

- Do not key continuity-critical records only by `email`
- Do not infer the current team with arbitrary `.limit(1).single()` queries when `TeamMembershipService` is available
- Do not treat `localStorage` as the only persistence layer for player or tournament workflow state
- Do not add a second training-settings contract when `/api/player-settings` already exists
- Do not read raw `team_players` profile values without merging linked `users` data when `user_id` is present

---

## Required Verification For Continuity Changes

When changing any of the flows above, manually verify:

1. Onboarding -> dashboard -> Today
2. Settings update -> roster
3. Invitation acceptance -> roster
4. Team switch -> roster and tournaments
5. Travel recovery create -> reload -> Today/dashboard continuity
6. Tournament nutrition create/log -> reload -> persisted state restored

