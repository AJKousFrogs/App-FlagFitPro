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
| Current release (v4.0) | [RELEASE_NOTES_4.0.0.md](./RELEASE_NOTES_4.0.0.md) |
| Overall architecture | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| Canonical ownership rules | [SINGLE_SOURCE_OF_TRUTH.md](./SINGLE_SOURCE_OF_TRUTH.md) |
| Repo navigation | [REPO_DISCOVERY_GUIDE.md](./REPO_DISCOVERY_GUIDE.md) |
| Feature and product behavior | [FEATURE_DOCUMENTATION.md](./FEATURE_DOCUMENTATION.md) |
| Local setup | [LOCAL_DEVELOPMENT_SETUP.md](./LOCAL_DEVELOPMENT_SETUP.md) |
| Angular and PrimeNG implementation | [ANGULAR_PRIMENG_GUIDE.md](./ANGULAR_PRIMENG_GUIDE.md) |
| Design system rules | [DESIGN_SYSTEM_RULES.md](./DESIGN_SYSTEM_RULES.md) |

## Product And Domain Docs

- [FEATURE_DOCUMENTATION.md](./FEATURE_DOCUMENTATION.md)
- [FLAG_FOOTBALL_TRAINING_SCIENCE.md](./FLAG_FOOTBALL_TRAINING_SCIENCE.md)
- [CALCULATION_SPEC.md](./CALCULATION_SPEC.md)
- [CALCULATION_MAP.md](./CALCULATION_MAP.md)
- [DATA_CONTINUITY_MODEL.md](./DATA_CONTINUITY_MODEL.md)
- [ROLE_AUTHORIZATION_MODEL.md](./ROLE_AUTHORIZATION_MODEL.md)
- [AUTHENTICATION_LOGIN_ONBOARDING.md](./AUTHENTICATION_LOGIN_ONBOARDING.md)
- [PRIVACY_CONTROLS_SPEC.md](./PRIVACY_CONTROLS_SPEC.md)

## Engineering And Architecture Docs

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [SINGLE_SOURCE_OF_TRUTH.md](./SINGLE_SOURCE_OF_TRUTH.md)
- [CODEBASE_MAP.md](./CODEBASE_MAP.md)
- [REPO_DISCOVERY_GUIDE.md](./REPO_DISCOVERY_GUIDE.md)
- [ROUTE_MAP.md](./ROUTE_MAP.md)
- [TECH_STACK.md](./TECH_STACK.md)
- [API.md](./API.md)
- [BACKEND_SETUP.md](./BACKEND_SETUP.md)
- [BACKEND_FUNCTION_CONTRACT.md](./BACKEND_FUNCTION_CONTRACT.md)
- [DATABASE_SETUP.md](./DATABASE_SETUP.md)
- [RLS_POLICY_SPECIFICATION.md](./RLS_POLICY_SPECIFICATION.md)

## Design System And UI Docs

- [DESIGN_SYSTEM_RULES.md](./DESIGN_SYSTEM_RULES.md)
- [ANGULAR_PRIMENG_GUIDE.md](./ANGULAR_PRIMENG_GUIDE.md)
- [CARD_COMPONENT_GUIDELINES.md](./CARD_COMPONENT_GUIDELINES.md)
- [UI_STATE_CONTRACT.md](./UI_STATE_CONTRACT.md)
- [UX_READY_CRITERIA.md](./UX_READY_CRITERIA.md)
- [../angular/src/scss/README.design-system.md](../angular/src/scss/README.design-system.md)
- [../angular/src/scss/SCSS_PRIMITIVES.md](../angular/src/scss/SCSS_PRIMITIVES.md)
- [../angular/docs/COMPONENT_OVERRIDES_TRACKING.md](../angular/docs/COMPONENT_OVERRIDES_TRACKING.md)
- [../angular/docs/EMPTY_STATE_COMPONENTS.md](../angular/docs/EMPTY_STATE_COMPONENTS.md)
- [../angular/docs/NUMBER_COUNTER_GUIDE.md](../angular/docs/NUMBER_COUNTER_GUIDE.md)
- [../angular/docs/ROUTE_ANIMATIONS_GUIDE.md](../angular/docs/ROUTE_ANIMATIONS_GUIDE.md)

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
- [QA_CONTINUITY_CHECKLIST.md](./QA_CONTINUITY_CHECKLIST.md)
- [RUNBOOKS/README.md](./RUNBOOKS/README.md)
- [RUNBOOKS/INCIDENT_RESPONSE.md](./RUNBOOKS/INCIDENT_RESPONSE.md)
- [RUNBOOKS/DEPLOYMENT_ROLLBACK.md](./RUNBOOKS/DEPLOYMENT_ROLLBACK.md)
- [RUNBOOKS/BACKUP_RESTORE.md](./RUNBOOKS/BACKUP_RESTORE.md)
- [RUNBOOKS/ACCOUNT_DELETION.md](./RUNBOOKS/ACCOUNT_DELETION.md)
- [RUNBOOKS/PRIVACY_INCIDENT.md](./RUNBOOKS/PRIVACY_INCIDENT.md)

## Release And Change History

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
