# Role Authorization Model

## Purpose

This document defines the current source of truth for user roles, team roles, and feature authorization in FlagFit Pro.

It exists to prevent role drift between:
- Angular route guards
- Angular navigation
- Netlify function authorization
- privacy and cross-athlete data access

## Canonical Role Source

The authoritative application role model is the `TeamRole` union in:
- `angular/src/app/core/services/team-membership.service.ts`

Canonical team roles:
- `owner`
- `admin`
- `head_coach`
- `coach`
- `offense_coordinator`
- `defense_coordinator`
- `assistant_coach`
- `physiotherapist`
- `nutritionist`
- `strength_conditioning_coach`
- `psychologist`
- `player`
- `manager`

Legacy roles may still appear in some backend compatibility paths:
- `guardian`
- `sports_psychologist`

Those legacy values should not be used as the primary source for new authorization work.

## Source Of Truth By Layer

### Angular

Primary membership/role authority:
- `angular/src/app/core/services/team-membership.service.ts`

Route guard authority:
- `angular/src/app/core/guards/team-role.guard.ts`

Navigation authority:
- `angular/src/app/core/navigation/app-navigation.config.ts`

### Backend

Primary shared role constants:
- `netlify/functions/utils/role-sets.js`

Shared role lookup and generic helper logic:
- `netlify/functions/utils/authorization-guard.js`

## Shared Backend Role Sets

Current shared backend capability groups:

### `COACH_ROUTE_ROLES`

Used for coach-facing route and workflow access.

Includes:
- `owner`
- `admin`
- `head_coach`
- `coach`
- `offense_coordinator`
- `defense_coordinator`
- `assistant_coach`
- `manager`

### `TEAM_OPERATIONS_ROLES`

Used for team-management operations such as:
- attendance
- equipment
- payments
- training session creation for other users

Current intent:
- same set as `COACH_ROUTE_ROLES`

### `ROSTER_MANAGEMENT_ROLES`

Used for roster/depth-chart operations.

Includes:
- `owner`
- `admin`
- `head_coach`
- `coach`
- `offense_coordinator`
- `defense_coordinator`
- `assistant_coach`

### `HEALTH_DATA_ACCESS_ROLES`

Used for wellness and other health-adjacent cross-athlete access.

Includes:
- `owner`
- `admin`
- `head_coach`
- `coach`
- `physiotherapist`
- `nutritionist`
- `psychologist`
- `strength_conditioning_coach`

### `NUTRITION_ACCESS_ROLES`

Used for nutrition dashboards and nutritionist workflows.

Includes:
- `owner`
- `admin`
- `head_coach`
- `coach`
- `nutritionist`

### `PSYCHOLOGY_ACCESS_ROLES`

Used for psychology dashboards and mental-performance workflows.

Includes:
- `owner`
- `admin`
- `head_coach`
- `coach`
- `psychologist`
- `sports_psychologist`

### `LOAD_MANAGEMENT_ACCESS_ROLES`

Used for cross-athlete training-load and ACWR access.

Includes:
- `owner`
- `admin`
- `head_coach`
- `coach`
- `offense_coordinator`
- `defense_coordinator`
- `assistant_coach`
- `physiotherapist`
- `nutritionist`
- `psychologist`
- `strength_conditioning_coach`

## Current Access Rules

### Player

Expected capabilities:
- access own profile, settings, training, wellness, and roster views allowed by feature design
- cannot access coach/staff routes
- cannot read another athlete's protected data
- cannot perform team-management mutations

### Coach / Head Coach / Coordinators / Assistant Coach / Manager

Expected capabilities:
- access coach routes guarded by Angular role guards
- access team-management workflows permitted by backend role sets
- access team-scoped cross-athlete data where consent and feature policy allow it

Notes:
- `manager` is intentionally included in route/team-operations access, but not in every health or roster-management path
- `offense_coordinator` and `defense_coordinator` are included in coach route access and roster/load workflows

### Medical / Performance Staff

Expected capabilities vary by domain:
- `physiotherapist`, `nutritionist`, `psychologist`, `strength_conditioning_coach`

These roles are allowed only where the relevant backend role set grants access.
They are not treated as generic coaches across all mutation paths.

### Admin / Owner

Expected capabilities:
- broad team and platform access
- included in all major coach/admin/staff authorization sets unless intentionally excluded

## Guardrails

When adding new authorization logic:
- do not hardcode new role arrays in feature files if an existing shared role set fits
- prefer `role-sets.js` for backend capability groups
- prefer `team-role.guard.ts` and `TeamMembershipService` for Angular checks
- prefer active `team_members` rows as the role source
- avoid falling back to JWT metadata unless no team membership exists and the path explicitly requires that compatibility behavior

## Known Remaining Cleanup

These areas still deserve future consolidation:
- local `getUserRole()` helpers outside shared auth utilities
- legacy coarse role naming in a few compatibility paths
- documenting exact admin vs owner distinctions for global vs team-scoped actions

## Verification Baseline

This model reflects the authorization cleanup verified during the `1.5.0` pass:
- Angular type-check passed
- Angular lint passed
- Angular build passed
- backend integration suite passed

