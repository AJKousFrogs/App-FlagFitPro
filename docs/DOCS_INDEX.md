# FlagFit Pro - Documentation Index

**Last Updated:** January 2026  
**Status:** ✅ Single Source of Truth - Ready for User Testing

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

## 📱 Product & Features

| Document | Description |
| -------- | ----------- |
| [FEATURE_DOCUMENTATION.md](./FEATURE_DOCUMENTATION.md) | **THE source of truth** - All features, business logic, calculations |
| [FLAG_FOOTBALL_TRAINING_SCIENCE.md](./FLAG_FOOTBALL_TRAINING_SCIENCE.md) | Sports science research behind the app |
| [AI_GOVERNANCE.md](./AI_GOVERNANCE.md) | AI Coach safety tiers and governance |
| [AI_TRAINING_SCHEDULER_GUIDE.md](./AI_TRAINING_SCHEDULER_GUIDE.md) | AI scheduler feature documentation |
| [PLAYER_DATA_SAFETY_GUIDE.md](./PLAYER_DATA_SAFETY_GUIDE.md) | Critical - mock vs real data safety |

---

## 🏗️ Technical - Development

| Document | Description |
| -------- | ----------- |
| [LOCAL_DEVELOPMENT_SETUP.md](./LOCAL_DEVELOPMENT_SETUP.md) | **Start here** - Local dev setup |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | Development workflow |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture overview |
| [ANGULAR_PRIMENG_GUIDE.md](./ANGULAR_PRIMENG_GUIDE.md) | Angular 21 + PrimeNG 21 patterns |
| [STYLE_GUIDE.md](./STYLE_GUIDE.md) | Code style and conventions |
| [ERROR_HANDLING_GUIDE.md](./ERROR_HANDLING_GUIDE.md) | Error handling patterns |
| [TESTING_GUIDE.md](./TESTING_GUIDE.md) | Testing setup and patterns |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Common issues and fixes |

---

## 🎨 UI & Design System

| Document | Description |
| -------- | ----------- |
| [DESIGN_SYSTEM_RULES.md](./DESIGN_SYSTEM_RULES.md) | **UI rules and design tokens** (binding) |
| [PRIMENG_DESIGN_SYSTEM_RULES.md](./PRIMENG_DESIGN_SYSTEM_RULES.md) | PrimeNG component token reference |

---

## 🔌 API & Backend

| Document | Description |
| -------- | ----------- |
| [API.md](./API.md) | API reference |
| [BACKEND_SETUP.md](./BACKEND_SETUP.md) | Backend/Netlify Functions setup |

---

## 🗄️ Database

| Document | Description |
| -------- | ----------- |
| [DATABASE_SETUP.md](./DATABASE_SETUP.md) | Database setup guide |
| [DATABASE_FLOW.md](./DATABASE_FLOW.md) | **Database flow & user action mapping** |
| [RLS_POLICY_SPECIFICATION.md](./RLS_POLICY_SPECIFICATION.md) | Row-Level Security policies |
| [AUDIT_GAPS.md](./AUDIT_GAPS.md) | 🔴 **Gaps & inconsistencies audit** |

---

## 🔐 Security & Privacy

| Document | Description |
| -------- | ----------- |
| [SECURITY.md](./SECURITY.md) | Security architecture (comprehensive) |
| [AUTHENTICATION_PATTERN.md](./AUTHENTICATION_PATTERN.md) | Auth implementation patterns |
| [THREAT_MODEL.md](./THREAT_MODEL.md) | Security threat model |
| [ADDING_NEW_FEATURES_SAFELY.md](./ADDING_NEW_FEATURES_SAFELY.md) | Safe extension playbook |

---

## 📋 Runbooks (Operations)

| Document | Description |
| -------- | ----------- |
| [RUNBOOKS/README.md](./RUNBOOKS/README.md) | Runbook index |
| [RUNBOOKS/INCIDENT_RESPONSE.md](./RUNBOOKS/INCIDENT_RESPONSE.md) | Incident response |
| [RUNBOOKS/DEPLOYMENT_ROLLBACK.md](./RUNBOOKS/DEPLOYMENT_ROLLBACK.md) | Deployment and rollback |
| [RUNBOOKS/BACKUP_RESTORE.md](./RUNBOOKS/BACKUP_RESTORE.md) | Database backup/restore |
| [RUNBOOKS/ACCOUNT_DELETION.md](./RUNBOOKS/ACCOUNT_DELETION.md) | User account deletion |
| [RUNBOOKS/PRIVACY_INCIDENT.md](./RUNBOOKS/PRIVACY_INCIDENT.md) | Privacy incident response |

---

## 📜 Legal

| Document | Description |
| -------- | ----------- |
| [PRIVACY_POLICY.md](./PRIVACY_POLICY.md) | Privacy policy |
| [TERMS_OF_USE.md](./TERMS_OF_USE.md) | Terms of use |
| [LICENSE.md](./LICENSE.md) | Software license |

---

## File Structure (29 files)

```
/docs/
├── DOCS_INDEX.md                      ← YOU ARE HERE
│
├── Product & Features
│   ├── FEATURE_DOCUMENTATION.md       ← All features (6500+ lines)
│   ├── FLAG_FOOTBALL_TRAINING_SCIENCE.md
│   ├── AI_GOVERNANCE.md
│   ├── AI_TRAINING_SCHEDULER_GUIDE.md
│   └── PLAYER_DATA_SAFETY_GUIDE.md
│
├── Development
│   ├── LOCAL_DEVELOPMENT_SETUP.md     ← Start here
│   ├── DEVELOPMENT.md
│   ├── ARCHITECTURE.md
│   ├── ANGULAR_PRIMENG_GUIDE.md
│   ├── STYLE_GUIDE.md
│   ├── ERROR_HANDLING_GUIDE.md
│   ├── TESTING_GUIDE.md
│   └── TROUBLESHOOTING.md
│
├── UI & Design System
│   ├── DESIGN_SYSTEM_RULES.md         ← Binding rules
│   └── PRIMENG_DESIGN_SYSTEM_RULES.md
│
├── API & Backend
│   ├── API.md
│   └── BACKEND_SETUP.md
│
├── Database
│   ├── DATABASE_SETUP.md
│   ├── DATABASE_FLOW.md              ← NEW: User action → DB mapping
│   └── RLS_POLICY_SPECIFICATION.md
│
├── Security
│   ├── SECURITY.md
│   ├── AUTHENTICATION_PATTERN.md
│   ├── THREAT_MODEL.md
│   └── ADDING_NEW_FEATURES_SAFELY.md
│
├── Legal
│   ├── PRIVACY_POLICY.md
│   ├── TERMS_OF_USE.md
│   └── LICENSE.md
│
├── RUNBOOKS/                          ← 8 operational docs
│   ├── README.md
│   ├── INCIDENT_RESPONSE.md
│   ├── DEPLOYMENT_ROLLBACK.md
│   ├── BACKUP_RESTORE.md
│   ├── ACCOUNT_DELETION.md
│   ├── PRIVACY_INCIDENT.md
│   └── RETENTION_CLEANUP.md
│
└── README.md                          ← Docs overview
```

---

**Target Audience:** Athletes 16+ (male and female competitive flag football players)
