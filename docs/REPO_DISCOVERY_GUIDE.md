# Repo Discovery Guide

**Application release:** 4.0.0  
**Purpose:** Provide a fast starting point for navigating the FlagFit Pro repo without already knowing its layout.

## Start Here

If you are new to the repo:

1. Read `docs/DOCS_INDEX.md`
2. Read `docs/SINGLE_SOURCE_OF_TRUTH.md`
3. Read `docs/CODEBASE_MAP.md`
4. Then move into the specific feature or backend area you need

## Top-Level Layout

| Path | Purpose |
| --- | --- |
| `angular/` | main Angular app |
| `netlify/functions/` | serverless backend |
| `database/migrations/` | schema changes |
| `docs/` | current architecture, product, security, and release docs |
| `tests/` | backend and integration validation |

## Angular Discovery

### Core framework and app shell

- `angular/src/app/core/`
  - routing
  - auth
  - navigation
  - shared app-level services

### Shared UI and utility layer

- `angular/src/app/shared/`
  - reusable components
  - status tags, dialogs, loading states
  - shared utility functions

### Features

- `angular/src/app/features/`
  - player-facing modules
  - coach-facing modules
  - staff-facing modules
  - social/chat/community modules

Good rule:
- if it is user-facing and route-backed, it is probably under `features/`
- if it is cross-cutting, it is probably under `core/` or `shared/`

## Backend Discovery

### Main backend

- `netlify/functions/`
  - one file per backend surface or feature endpoint cluster

### Shared backend utilities

- `netlify/functions/utils/role-sets.js`
- `netlify/functions/utils/authorization-guard.js`
- other shared backend helpers under `netlify/functions/utils/`

Good rule:
- if a frontend feature persists or enforces access, trace its corresponding Netlify function next

## Database Discovery

### Schema and persistence

- `database/migrations/`
  - one SQL migration per schema change

### What to inspect first

- latest migration related to the table or feature
- docs describing the domain
- frontend service that reads/writes the domain

## Feature Discovery Workflow

When investigating a feature:

1. Find the route in `angular/src/app/core/routes`
2. Open the feature component in `angular/src/app/features`
3. Find the services it calls
4. Find the matching Netlify function or API endpoint
5. Check the corresponding domain doc in `docs/`

## Recommended Entry Docs By Task

| Task | Start With |
| --- | --- |
| Understand product behavior | `docs/FEATURE_DOCUMENTATION.md` |
| Understand architecture | `docs/ARCHITECTURE.md` |
| Understand canonical ownership | `docs/SINGLE_SOURCE_OF_TRUTH.md` |
| Understand role access | `docs/ROLE_AUTHORIZATION_MODEL.md` |
| Understand continuity | `docs/DATA_CONTINUITY_MODEL.md` |
| Understand routes | `docs/ROUTE_MAP.md` |
| Understand the repo shape | `docs/CODEBASE_MAP.md` |

## Known Discovery Pain Points

- Some domains span multiple features, services, and backend files.
- Roster-related work touches `users`, `team_members`, and `team_players`.
- Coach workflows often cross dashboard, inbox, calendar, tournaments, and player-development surfaces.
- Design rules live in docs plus style/token implementation, so UI work requires both code and design docs.

## Practical Navigation Shortcuts

- Search routes first: `angular/src/app/core/routes`
- Search feature entry files second: `angular/src/app/features/**/<feature>.component.ts`
- Search backend endpoint names third: `netlify/functions`
- Search docs index last if you need the policy or system contract

## Related Docs

- `docs/DOCS_INDEX.md`
- `docs/SINGLE_SOURCE_OF_TRUTH.md`
- `docs/CODEBASE_MAP.md`
- `docs/ARCHITECTURE.md`
- `docs/FEATURE_DOCUMENTATION.md`
