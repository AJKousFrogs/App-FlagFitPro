# FlagFit Pro Documentation Index

This file is the canonical entry point for durable documentation in the repo.

## Rules

- Keep one durable doc per topic.
- Delete one-off audits, migration trackers, and status reports after their outcome is merged into code or a durable doc.
- Local README files are allowed only when they explain a specific folder, workflow, or operational area.
- If a document is not linked here or from a local folder README, it should probably not exist.

## Start Here

| Need | Document |
| --- | --- |
| **Engine contract** (pipeline + roles + authority + consent) | [ENGINE_CONTRACT.md](./ENGINE_CONTRACT.md) |
| **Current version baseline (v11)** | [RELEASE_NOTES_11.0.0.md](./RELEASE_NOTES_11.0.0.md) |
| **v11 architecture** (schedule spine + engine) | [ARCHITECTURE_v11.md](./ARCHITECTURE_v11.md) |
| **Daily prescription contract** | [PRESCRIPTION_SPEC.md](./PRESCRIPTION_SPEC.md) |
| Overall architecture (legacy v4 baseline doc) | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| Canonical ownership rules | [SINGLE_SOURCE_OF_TRUTH.md](./SINGLE_SOURCE_OF_TRUTH.md) |
| Repo navigation | [REPO_DISCOVERY_GUIDE.md](./REPO_DISCOVERY_GUIDE.md) |
| Local setup | [LOCAL_DEVELOPMENT_SETUP.md](./LOCAL_DEVELOPMENT_SETUP.md) |

## Product And Domain Docs

- [FLAG_FOOTBALL_TRAINING_SCIENCE.md](./FLAG_FOOTBALL_TRAINING_SCIENCE.md)
- [CALCULATION_SPEC.md](./CALCULATION_SPEC.md)
- [CALCULATION_MAP.md](./CALCULATION_MAP.md)
- [DATA_CONTINUITY_MODEL.md](./DATA_CONTINUITY_MODEL.md)
- [ROLE_AUTHORIZATION_MODEL.md](./ROLE_AUTHORIZATION_MODEL.md)
- [AUTHENTICATION_LOGIN_ONBOARDING.md](./AUTHENTICATION_LOGIN_ONBOARDING.md)
- [PRIVACY_CONTROLS_SPEC.md](./PRIVACY_CONTROLS_SPEC.md)

## Engineering And Architecture Docs

- [ARCHITECTURE_v11.md](./ARCHITECTURE_v11.md) — schedule spine + prescription engine (current direction)
- [PRESCRIPTION_SPEC.md](./PRESCRIPTION_SPEC.md) — `prescribeFor` algorithm contract
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [SINGLE_SOURCE_OF_TRUTH.md](./SINGLE_SOURCE_OF_TRUTH.md)
- [DATA_MODEL.md](./DATA_MODEL.md) — **canonical table dictionary** (domain → input/derived → canonical) + consolidation plan
- [ATHLETE_ID_CONVENTION.md](./ATHLETE_ID_CONVENTION.md) — `user_id` standard + per-table migration recipe
- [REPO_DISCOVERY_GUIDE.md](./REPO_DISCOVERY_GUIDE.md)
- [TECH_STACK.md](./TECH_STACK.md)
- [API.md](./API.md)
- [BACKEND_SETUP.md](./BACKEND_SETUP.md)
- [BACKEND_FUNCTION_CONTRACT.md](./BACKEND_FUNCTION_CONTRACT.md)
- [DATABASE_SETUP.md](./DATABASE_SETUP.md)
- [RLS_POLICY_SPECIFICATION.md](./RLS_POLICY_SPECIFICATION.md)

## Design System And UI Docs

> **Removed during the static-first front-end rebuild.** The old design-system /
> UI docs (design-system rules, PrimeNG guide, card guidelines, UI-state
> contract, UX-ready criteria, SCSS primitives, component-override trackers)
> described the demolished UI layer and conflicted with the new single source of
> truth. The new design system is being authored statically in
> `redesign/ground-zero/` and will be documented here once locked (Phase C/E).

## Debugging And Testing Docs

- [../angular/ANGULAR_DEBUGGING_INDEX.md](../angular/ANGULAR_DEBUGGING_INDEX.md)
- [../angular/DEBUGGING_GUIDE.md](../angular/DEBUGGING_GUIDE.md)
- [../angular/IOS_DEBUGGING_GUIDE.md](../angular/IOS_DEBUGGING_GUIDE.md)
- [../angular/TESTING_CHECKLIST.md](../angular/TESTING_CHECKLIST.md)
- [../angular/e2e/README.md](../angular/e2e/README.md)
- [../tests/README.md](../tests/README.md)
- [../tests/privacy-safety/README.md](../tests/privacy-safety/README.md)

## Security, Privacy, And Operations

- [SECURITY.md](./SECURITY.md)
- [THREAT_MODEL.md](./THREAT_MODEL.md)
- [RUNBOOKS/README.md](./RUNBOOKS/README.md)
- [RUNBOOKS/INCIDENT_RESPONSE.md](./RUNBOOKS/INCIDENT_RESPONSE.md)
- [RUNBOOKS/DEPLOYMENT_ROLLBACK.md](./RUNBOOKS/DEPLOYMENT_ROLLBACK.md)
- [RUNBOOKS/BACKUP_RESTORE.md](./RUNBOOKS/BACKUP_RESTORE.md)
- [RUNBOOKS/ACCOUNT_DELETION.md](./RUNBOOKS/ACCOUNT_DELETION.md)
- [RUNBOOKS/PRIVACY_INCIDENT.md](./RUNBOOKS/PRIVACY_INCIDENT.md)

## Release And Change History

- [RELEASE_NOTES_11.0.0.md](./RELEASE_NOTES_11.0.0.md) — **current baseline** (unifies v4 release + v10 architecture)
- [RELEASE_NOTES_4.0.0.md](./RELEASE_NOTES_4.0.0.md)
- [RELEASE_NOTES_3.4.0.md](./RELEASE_NOTES_3.4.0.md)
- [RELEASE_NOTES_2.1.0.md](./RELEASE_NOTES_2.1.0.md)
- [RELEASE_NOTES_1.5.0.md](./RELEASE_NOTES_1.5.0.md)
- [RELEASE_NOTES_1.2.0.md](./RELEASE_NOTES_1.2.0.md)
- [RELEASE_NOTES_1.1.0.md](./RELEASE_NOTES_1.1.0.md)

## Legal

- [../angular/src/assets/legal/privacy-policy.md](../angular/src/assets/legal/privacy-policy.md)
- [../angular/src/assets/legal/terms-of-use.md](../angular/src/assets/legal/terms-of-use.md)
- [../LICENSE.md](../LICENSE.md)

## Local Folder Readmes

These are kept because they explain local workflows rather than global architecture:

- [../scripts/README.md](../scripts/README.md)
- [../database/migrations/README.md](../database/migrations/README.md)

## Deleted As Obsolete

These report-style docs were intentionally removed because they were temporary status artifacts, not durable documentation:

- old infra audit reports
- responsive audit/fixes summaries
- upgrade plans and changeset trackers
- dated UI audit markdown snapshots under `angular/docs/`

**Static-first rebuild purge (Phase A.2):** removed docs describing the demolished
UI layer / old design system that conflicted with the new single source of truth —
`AUDIT.md`, `DISCOVERY.md`, `REVAMP.md`; `DESIGN_SYSTEM_RULES.md`,
`ANGULAR_PRIMENG_GUIDE.md`, `CARD_COMPONENT_GUIDELINES.md`, `UI_STATE_CONTRACT.md`,
`UX_READY_CRITERIA.md`, `DRIFT_REGISTER.md`, `QA_CONTINUITY_CHECKLIST.md`,
`CODEBASE_MAP.md`, `ROUTE_MAP.md`, `FEATURE_DOCUMENTATION.md`; and the
`angular/docs/` UI guides. CODEBASE_MAP / ROUTE_MAP / FEATURE_DOCUMENTATION are
regenerated after the rebuild. All recoverable from tag `pre-rebuild-main`.
