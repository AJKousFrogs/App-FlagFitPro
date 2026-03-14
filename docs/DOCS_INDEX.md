# FlagFit Pro - Documentation Index

**Last Updated:** February 2026  
**Status:** ✅ Verified Clean Slate Documentation

---

## Documentation Rule

- **DOCS_INDEX.md is the single source of truth** — all docs are referenced here.  
- **Docs describe current behavior or enforced rules.**  
- One-time audits, trackers, and investigations are archived or deleted.  
- If a doc is not referenced by this index, it should not exist.  
- Max 1 doc per topic (security, auth, theming, PrimeNG, UX target).

---

## Quick Navigation

| I Need To...                             | Go To                                                      |
| ---------------------------------------- | ---------------------------------------------------------- |
| Understand all features & business logic | [FEATURE_DOCUMENTATION.md](./FEATURE_DOCUMENTATION.md)     |
| Set up my dev environment                | [LOCAL_DEVELOPMENT_SETUP.md](./LOCAL_DEVELOPMENT_SETUP.md) |
| Understand the architecture              | [ARCHITECTURE.md](./ARCHITECTURE.md)                       |
| Understand canonical ownership           | [SINGLE_SOURCE_OF_TRUTH.md](./SINGLE_SOURCE_OF_TRUTH.md)   |
| Map features to code and backend         | [CODEBASE_MAP.md](./CODEBASE_MAP.md)                       |
| Navigate the repo quickly                | [REPO_DISCOVERY_GUIDE.md](./REPO_DISCOVERY_GUIDE.md)       |
| Map routes to data sources               | [ROUTE_MAP.md](./ROUTE_MAP.md)                             |
| Work with the API                        | [API.md](./API.md)                                         |
| Set up the database                      | [DATABASE_SETUP.md](./DATABASE_SETUP.md)                   |
| Follow Angular/PrimeNG patterns          | [ANGULAR_PRIMENG_GUIDE.md](./ANGULAR_PRIMENG_GUIDE.md)     |
| Follow UI/design rules                   | [DESIGN_SYSTEM_RULES.md](./DESIGN_SYSTEM_RULES.md)         |
| Understand calculation formulas          | [CALCULATION_SPEC.md](./CALCULATION_SPEC.md)                |
| Understand security                      | [SECURITY.md](./SECURITY.md)                               |

---

## Core Documentation (Single Source of Truth)

### 📱 Product & Features

| Document                                                                 | Description                                                                                                      |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| [FEATURE_DOCUMENTATION.md](./FEATURE_DOCUMENTATION.md)                   | **THE source of truth** - All 49 features with business logic, calculations, female athlete support (Appendix E) |
| [FLAG_FOOTBALL_TRAINING_SCIENCE.md](./FLAG_FOOTBALL_TRAINING_SCIENCE.md) | Sports science research behind the app                                                                           |
| [UX_READY_CRITERIA.md](./UX_READY_CRITERIA.md)                           | UI polish gate — when screens are ready for visual refinement                                                    |

---

### 🏗️ Technical

| Document                                               | Description                              |
| ------------------------------------------------------ | ---------------------------------------- |
| [ARCHITECTURE.md](./ARCHITECTURE.md)                   | System architecture overview             |
| [SINGLE_SOURCE_OF_TRUTH.md](./SINGLE_SOURCE_OF_TRUTH.md) | Cross-domain canonical ownership rules |
| [CODEBASE_MAP.md](./CODEBASE_MAP.md)                   | Feature/domain → Angular/backend/data map |
| [REPO_DISCOVERY_GUIDE.md](./REPO_DISCOVERY_GUIDE.md)   | Fast repo navigation guide               |
| [DRIFT_REGISTER.md](./DRIFT_REGISTER.md)               | Active ambiguity and duplication hotspots |
| [DATA_CONTINUITY_MODEL.md](./DATA_CONTINUITY_MODEL.md) | Cross-surface source-of-truth rules      |
| [ROLE_AUTHORIZATION_MODEL.md](./ROLE_AUTHORIZATION_MODEL.md) | Admin/coach/staff/player role authority |
| [ROUTE_MAP.md](./ROUTE_MAP.md)                         | Routes → data sources & API endpoints     |
| [CALCULATION_SPEC.md](./CALCULATION_SPEC.md)           | Calculation formulas, windows, rounding  |
| [CALCULATION_MAP.md](./CALCULATION_MAP.md)             | Calculation hotspots (services → code)   |
| [ANGULAR_PRIMENG_GUIDE.md](./ANGULAR_PRIMENG_GUIDE.md) | Angular 21 + PrimeNG 21 patterns         |
| [DESIGN_SYSTEM_RULES.md](./DESIGN_SYSTEM_RULES.md)     | **UI rules and design tokens** (binding) |
| [CARD_COMPONENT_GUIDELINES.md](./CARD_COMPONENT_GUIDELINES.md) | app-card vs p-card usage          |
| [API.md](./API.md)                                     | API reference                            |
| [BACKEND_SETUP.md](./BACKEND_SETUP.md)                 | Backend/Netlify Functions setup          |
| [TECH_STACK.md](./TECH_STACK.md)                       | **Tech stack** — ESM, Angular 21, tokens |

---

### 🗄️ Database

| Document                                                     | Description                 |
| ------------------------------------------------------------ | --------------------------- |
| [DATABASE_SETUP.md](./DATABASE_SETUP.md)                     | Database setup guide        |
| [RLS_POLICY_SPECIFICATION.md](./RLS_POLICY_SPECIFICATION.md) | Row-Level Security policies |

---

### 🔐 Security & Privacy

| Document                                                                   | Description                    |
| -------------------------------------------------------------------------- | ------------------------------ |
| [SECURITY.md](./SECURITY.md)                                               | Security & privacy (consent, AI opt-out, deletion) |
| [AUTHENTICATION_LOGIN_ONBOARDING.md](./AUTHENTICATION_LOGIN_ONBOARDING.md) | Login, onboarding, and auth implementation         |
| [PRIVACY_CONTROLS_SPEC.md](./PRIVACY_CONTROLS_SPEC.md)                     | Privacy control specifications |
| [THREAT_MODEL.md](./THREAT_MODEL.md)                                       | Security threat model          |

---

### 🚀 Development

| Document                                                   | Description                                                          |
| ---------------------------------------------------------- | -------------------------------------------------------------------- |
| [LOCAL_DEVELOPMENT_SETUP.md](./LOCAL_DEVELOPMENT_SETUP.md) | **Start here** - Local dev setup for Angular 21 + Netlify + Supabase |
| [MCP_SUPABASE_SETUP.md](./MCP_SUPABASE_SETUP.md)           | MCP + Supabase integration for Cursor/AI                             |
| [QA_CONTINUITY_CHECKLIST.md](./QA_CONTINUITY_CHECKLIST.md) | End-to-end manual continuity verification                            |

### 📝 Release Notes

| Document                                         | Description                                           |
| ------------------------------------------------ | ----------------------------------------------------- |
| [RELEASE_NOTES_1.5.0.md](./RELEASE_NOTES_1.5.0.md) | Role integrity, route guards, and authorization alignment |
| [RELEASE_NOTES_1.2.0.md](./RELEASE_NOTES_1.2.0.md) | Route-state consistency and workflow completion update |
| [RELEASE_NOTES_1.1.0.md](./RELEASE_NOTES_1.1.0.md) | Stability, backend hardening, and dependency alignment |

### 🧩 Angular-Specific (angular/docs/)

| Document                                                                 | Description                                           |
| ------------------------------------------------------------------------ | ----------------------------------------------------- |
| [COMPONENT_OVERRIDES_TRACKING.md](../angular/docs/COMPONENT_OVERRIDES_TRACKING.md) | PrimeNG override migration (DS-EXC tickets, deadlines) |
| [EMPTY_STATE_COMPONENTS.md](../angular/docs/EMPTY_STATE_COMPONENTS.md)   | app-empty-state vs app-no-data-entry usage             |

---

### 📋 Runbooks (Operations)

| Document                                                             | Description               |
| -------------------------------------------------------------------- | ------------------------- |
| [RUNBOOKS/README.md](./RUNBOOKS/README.md)                           | Runbook index             |
| [RUNBOOKS/INCIDENT_RESPONSE.md](./RUNBOOKS/INCIDENT_RESPONSE.md)     | Incident response         |
| [RUNBOOKS/DEPLOYMENT_ROLLBACK.md](./RUNBOOKS/DEPLOYMENT_ROLLBACK.md) | Deployment and rollback   |
| [RUNBOOKS/BACKUP_RESTORE.md](./RUNBOOKS/BACKUP_RESTORE.md)           | Database backup/restore   |
| [RUNBOOKS/ACCOUNT_DELETION.md](./RUNBOOKS/ACCOUNT_DELETION.md)       | User account deletion     |
| [RUNBOOKS/PRIVACY_INCIDENT.md](./RUNBOOKS/PRIVACY_INCIDENT.md)       | Privacy incident response |

---

### 🐛 Debugging & Testing (angular/)

| Document                                                                 | Description                          |
| ------------------------------------------------------------------------ | ------------------------------------ |
| [ANGULAR_DEBUGGING_INDEX.md](../angular/ANGULAR_DEBUGGING_INDEX.md)       | Index for debugging & testing docs   |
| [DEBUGGING_GUIDE.md](../angular/DEBUGGING_GUIDE.md)                     | Angular DevTools, signals, API debug |
| [IOS_DEBUGGING_GUIDE.md](../angular/IOS_DEBUGGING_GUIDE.md)             | iOS Safari Web Inspector setup       |
| [TESTING_CHECKLIST.md](../angular/TESTING_CHECKLIST.md)                 | DevTools + debug service verification|

### 📜 Legal

| Document                                 | Description      |
| ---------------------------------------- | ---------------- |
| [Privacy Policy](../angular/src/assets/legal/privacy-policy.md) | Privacy policy   |
| [Terms of Use](../angular/src/assets/legal/terms-of-use.md)     | Terms of use     |
| [LICENSE.md](../LICENSE.md)              | Software license |

---

## File Structure

```
/docs/ (including RUNBOOKS)
├── DOCS_INDEX.md                 ← YOU ARE HERE (single source of truth)
├── FEATURE_DOCUMENTATION.md      ← 49 features + Appendix E (6500+ lines)
├── ARCHITECTURE.md
├── SINGLE_SOURCE_OF_TRUTH.md
├── CODEBASE_MAP.md
├── REPO_DISCOVERY_GUIDE.md
├── DRIFT_REGISTER.md
├── DATA_CONTINUITY_MODEL.md
├── ROLE_AUTHORIZATION_MODEL.md
├── ROUTE_MAP.md                  ← Routes → data sources
├── CALCULATION_SPEC.md           ← Calculation formulas
├── CALCULATION_MAP.md            ← Calculation code locations
├── API.md
├── CARD_COMPONENT_GUIDELINES.md
├── DATABASE_SETUP.md
├── SECURITY.md
├── ANGULAR_PRIMENG_GUIDE.md
├── DESIGN_SYSTEM_RULES.md
├── UX_READY_CRITERIA.md         ← UI polish gate
├── RELEASE_NOTES_1.5.0.md
├── RELEASE_NOTES_1.2.0.md
├── RELEASE_NOTES_1.1.0.md
├── FLAG_FOOTBALL_TRAINING_SCIENCE.md
├── MCP_SUPABASE_SETUP.md
├── QA_CONTINUITY_CHECKLIST.md
├── RUNBOOKS/                     ← 6 operational docs
├── angular/docs/                 ← COMPONENT_OVERRIDES_TRACKING, EMPTY_STATE_COMPONENTS
└── [Legal: ../LICENSE.md, angular/src/assets/legal/]
```

---

**Target Audience:** Athletes 16+ (male and female competitive flag football players)
