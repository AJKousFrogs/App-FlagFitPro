# Drift Register

**Application release:** 4.0.0  
**Purpose:** Track the highest-value codebase drift points that still matter after the v4.0 consolidation pass.

## How To Use This File

- Use this as the follow-up list after `SINGLE_SOURCE_OF_TRUTH.md`.
- Each item here represents an active ambiguity or duplication risk.
- Only keep live issues here. Resolved drift should move into release notes or be removed.

## Priority 1: Player Identity And Roster Projection

### Problem

Player-related reads still cross:
- `users`
- `team_members`
- `team_players`

This is the largest ongoing source of ambiguity around roster accuracy, onboarding continuity, and team switching.

### Current Risk

- stale roster display fields
- duplicate player-team records
- inconsistent player identity across roster and coach tools

### Current Rule

- `users` owns profile identity
- `team_members` owns active membership and team role
- `team_players` is a roster-facing projection only

### Recommended Next Step

- keep `user_id` as the required join key everywhere
- continue reducing direct raw reads from `team_players` where merged data is available

## Priority 2: Team-Scoped Role Enforcement

### Problem

Authorization is much more aligned now, but role and team context still span:
- Angular guards
- Angular navigation
- backend shared role sets
- endpoint-level active membership checks

### Current Risk

- frontend/backend mismatch on edge routes
- incorrect access when a user has multiple memberships or history
- accidental reintroduction of local role arrays

### Current Rule

- frontend uses `TeamMembershipService` and route guards
- backend uses shared role sets and active membership-sensitive checks

### Recommended Next Step

- keep eliminating local role helper duplication
- document edge cases for admin vs owner vs manager where behavior differs

## Priority 3: Workflow Handoff Context

### Problem

The current cleanup pass removed many dead-end actions, but workflow handoff still depends on conventions:
- route params
- query params
- selected-item state in dialogs
- cross-feature navigation assumptions

### Current Risk

- feature handoffs may break silently during future UI work
- routes can accept context that destination screens ignore
- deep links remain inconsistently documented

### Current Rule

- if one screen owns the workflow, hand off there instead of faking completion
- avoid unused query params

### Recommended Next Step

- document accepted query-param contracts for major cross-feature handoffs
- centralize common coach workflow navigation patterns if they keep growing

## Priority 4: Export / Share Completion Signals

### Problem

Some features still show export/share success toasts before the workflow is meaningfully complete.

### Current Risk

- misleading success feedback
- uneven expectations across features

### Recommended Next Step

- standardize which actions are:
  - real persisted writes
  - real file/export starts
  - UI-only preparation

## Priority 5: Repo Discovery Drift

### Problem

The repo is now documented better, but discovery still depends on a human already knowing:
- where feature routes live
- which backend file corresponds to which feature
- which docs are policy vs implementation

### Recommended Next Step

- keep `CODEBASE_MAP.md`, `REPO_DISCOVERY_GUIDE.md`, and `DOCS_INDEX.md` in sync
- update them whenever a major feature area or architecture boundary changes

## Related Docs

- `docs/SINGLE_SOURCE_OF_TRUTH.md`
- `docs/CODEBASE_MAP.md`
- `docs/REPO_DISCOVERY_GUIDE.md`
- `docs/DATA_CONTINUITY_MODEL.md`
- `docs/ROLE_AUTHORIZATION_MODEL.md`
