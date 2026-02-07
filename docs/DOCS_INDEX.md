# FlagFit Pro - Documentation Index

**Last Updated:** January 2026  
**Status:** ✅ Verified Clean Slate Documentation

---

## Quick Navigation

| I Need To...                             | Go To                                                      |
| ---------------------------------------- | ---------------------------------------------------------- |
| Understand all features & business logic | [FEATURE_DOCUMENTATION.md](./FEATURE_DOCUMENTATION.md)     |
| Set up my dev environment                | [LOCAL_DEVELOPMENT_SETUP.md](./LOCAL_DEVELOPMENT_SETUP.md) |
| Understand the architecture              | [ARCHITECTURE.md](./ARCHITECTURE.md)                       |
| Work with the API                        | [API.md](./API.md)                                         |
| Set up the database                      | [DATABASE_SETUP.md](./DATABASE_SETUP.md)                   |
| Follow Angular/PrimeNG patterns          | [ANGULAR_PRIMENG_GUIDE.md](./ANGULAR_PRIMENG_GUIDE.md)     |
| Follow UI/design rules                   | [DESIGN_SYSTEM_RULES.md](./DESIGN_SYSTEM_RULES.md)         |
| Understand security                      | [SECURITY.md](./SECURITY.md)                               |

---

## Core Documentation (Single Source of Truth)

### 📱 Product & Features

| Document                                                                 | Description                                                                                                      |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| [FEATURE_DOCUMENTATION.md](./FEATURE_DOCUMENTATION.md)                   | **THE source of truth** - All 49 features with business logic, calculations, female athlete support (Appendix E) |
| [FLAG_FOOTBALL_TRAINING_SCIENCE.md](./FLAG_FOOTBALL_TRAINING_SCIENCE.md) | Sports science research behind the app                                                                           |
| [AI_GOVERNANCE.md](./AI_GOVERNANCE.md)                                   | AI Coach safety tiers and governance                                                                             |

---

### 🏗️ Technical

| Document                                               | Description                              |
| ------------------------------------------------------ | ---------------------------------------- |
| [ARCHITECTURE.md](./ARCHITECTURE.md)                   | System architecture overview             |
| [ANGULAR_PRIMENG_GUIDE.md](./ANGULAR_PRIMENG_GUIDE.md) | Angular 21 + PrimeNG 21 patterns         |
| [DESIGN_SYSTEM_RULES.md](./DESIGN_SYSTEM_RULES.md)     | **UI rules and design tokens** (binding) |
| [API.md](./API.md)                                     | API reference                            |
| [BACKEND_SETUP.md](./BACKEND_SETUP.md)                 | Backend/Netlify Functions setup          |

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
| [SECURITY.md](./SECURITY.md)                                               | Security architecture          |
| [SECURITY_PRIVACY_OVERVIEW.md](./SECURITY_PRIVACY_OVERVIEW.md)             | Privacy and security overview  |
| [AUTHENTICATION_PATTERN.md](./AUTHENTICATION_PATTERN.md)                   | Auth implementation patterns   |
| [AUTHENTICATION_LOGIN_ONBOARDING.md](./AUTHENTICATION_LOGIN_ONBOARDING.md) | Login and onboarding flow      |
| [PRIVACY_CONTROLS_SPEC.md](./PRIVACY_CONTROLS_SPEC.md)                     | Privacy control specifications |
| [THREAT_MODEL.md](./THREAT_MODEL.md)                                       | Security threat model          |

---

### 🚀 Development

| Document                                                   | Description                                                          |
| ---------------------------------------------------------- | -------------------------------------------------------------------- |
| [LOCAL_DEVELOPMENT_SETUP.md](./LOCAL_DEVELOPMENT_SETUP.md) | **Start here** - Local dev setup for Angular 21 + Netlify + Supabase |

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

### 📜 Legal

| Document                                 | Description      |
| ---------------------------------------- | ---------------- |
| [Privacy Policy](../angular/src/assets/legal/privacy-policy.md) | Privacy policy   |
| [Terms of Use](../angular/src/assets/legal/terms-of-use.md)     | Terms of use     |
| [LICENSE.md](./LICENSE.md)               | Software license |

---

## File Structure

```
/docs/ (27 files)
├── DOCS_INDEX.md                 ← YOU ARE HERE
├── FEATURE_DOCUMENTATION.md      ← 49 features + Appendix E (6500+ lines)
├── ARCHITECTURE.md
├── API.md
├── DATABASE_SETUP.md
├── SECURITY.md
├── ANGULAR_PRIMENG_GUIDE.md
├── DESIGN_SYSTEM_RULES.md
├── FLAG_FOOTBALL_TRAINING_SCIENCE.md
├── AI_GOVERNANCE.md
├── RUNBOOKS/                     ← 8 operational docs
└── [Legal docs]
```

---

**Target Audience:** Athletes 16+ (male and female competitive flag football players)
