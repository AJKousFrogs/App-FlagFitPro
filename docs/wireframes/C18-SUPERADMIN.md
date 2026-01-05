# Wireframe: Superadmin Dashboard

**Route:** `/admin`  
**Users:** System Administrators  
**Status:** ⚠️ Needs Implementation  
**Source:** `FEATURE_DOCUMENTATION.md` §41

---

## Purpose

System-wide administration dashboard for managing all teams, users, monitoring platform health, and handling support escalations.

---

## Skeleton Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [☰]  FlagFit Pro Admin                                      🔍  🔔  [Admin ▼]      │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  🔧 Superadmin Dashboard                                                       │  │
│  │     System administration and monitoring                                      │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                               PLATFORM OVERVIEW                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ 👥 Total Users  │  │ 🏈 Active Teams │  │ 📊 Daily Active │  │ ⚠️ Open Issues  │  │
│  │                 │  │                 │  │                 │  │                 │  │
│  │    1,245        │  │      42         │  │     328         │  │      3          │  │
│  │    ─────────    │  │    ─────────    │  │    ─────────    │  │    ─────────    │  │
│  │  ▲ +45 this mo  │  │  ▲ +5 this mo   │  │  26% of users   │  │  Support tix    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ 💾 DB Size      │  │ 🔄 API Requests │  │ ⚡ Avg Response │  │ 🔴 Errors (24h) │  │
│  │                 │  │    (24h)        │  │                 │  │                 │  │
│  │   2.4 GB        │  │   45,230        │  │    142ms        │  │      12         │  │
│  │    ─────────    │  │    ─────────    │  │    ─────────    │  │    ─────────    │  │
│  │  78% of limit   │  │  ▲ +12% vs avg  │  │  🟢 Healthy     │  │  0.03% rate     │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                               QUICK ACTIONS                                          │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐│  │
│  │  │ 👥 Manage Users │ │ 🏈 Manage Teams │ │ 📊 Analytics    │ │ 🔧 Settings   ││  │
│  │  └─────────────────┘ └─────────────────┘ └─────────────────┘ └───────────────┘│  │
│  │                                                                                │  │
│  │  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌───────────────┐│  │
│  │  │ 📋 Audit Logs   │ │ 🎫 Support Tix  │ │ 📧 Broadcasts   │ │ 💾 Backups    ││  │
│  │  └─────────────────┘ └─────────────────┘ └─────────────────┘ └───────────────┘│  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                              RECENT ACTIVITY                                         │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │ 🆕 New team registered: Thunder Bolts                   10 minutes ago  │  │  │
│  │  │ Created by: john.coach@email.com                                        │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │ 🔴 Error spike detected: Auth service                   45 minutes ago  │  │  │
│  │  │ 8 failed login attempts from IP 192.168.1.x                            │  │  │
│  │  │                                                    [View Details]       │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │ 👤 User account deleted: former.player@email.com        2 hours ago     │  │  │
│  │  │ Requested by user via Settings > Delete Account                        │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │ 🎫 Support ticket opened: "Can't login" - Priority High  3 hours ago    │  │  │
│  │  │ User: confused.user@email.com                                           │  │  │
│  │  │                                                    [Open Ticket]        │  │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                │  │
│  │                                                         [View All Activity →] │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                              SYSTEM HEALTH                                           │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  Service Status                                                               │  │
│  │                                                                                │  │
│  │  ┌────────────────────────────────┬────────────────────────────────────────┐ │  │
│  │  │ 🟢 API Server                  │ Healthy • 142ms avg response          │ │  │
│  │  │ 🟢 Database (Supabase)         │ Healthy • 2.4GB / 8GB                 │ │  │
│  │  │ 🟢 Authentication              │ Healthy • 0 failed auth (last hour)   │ │  │
│  │  │ 🟢 Edge Functions              │ Healthy • 23 active functions         │ │  │
│  │  │ 🟡 Storage                     │ Warning • 78% capacity                │ │  │
│  │  │ 🟢 Real-time                   │ Healthy • 156 active connections      │ │  │
│  │  └────────────────────────────────┴────────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  │  [View Detailed Metrics]  [View Logs]  [Run Health Check]                    │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## User Management View

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [← Admin]  User Management                                                         │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  🔍 Search users...           Role: [All ▼]   Status: [All ▼]                 │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  ┌───────────────────────────────────────────────────────────────────────────┐│  │
│  │  │ User               │ Email                │ Role     │ Team    │ Actions  ││  │
│  │  ├───────────────────────────────────────────────────────────────────────────┤│  │
│  │  │ Mike Johnson       │ mike@team.com        │ Coach    │ Panthers│ [⋮]      ││  │
│  │  │ Sarah Chen         │ sarah@email.com      │ Player   │ Panthers│ [⋮]      ││  │
│  │  │ John Smith         │ john@newteam.com     │ Coach    │ Thunder │ [⋮]      ││  │
│  │  │ Emily Brown        │ emily@email.com      │ Player   │ Eagles  │ [⋮]      ││  │
│  │  │ Admin User         │ admin@flagfit.com    │ Admin    │ --      │ [⋮]      ││  │
│  │  │ ...                                                                       ││  │
│  │  └───────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                │  │
│  │  Showing 1-25 of 1,245 users                          [◀ Prev] [Next ▶]       │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## User Actions Menu ([⋮])

| Action          | Description                  |
| --------------- | ---------------------------- |
| View Profile    | See user details             |
| Edit Role       | Change user role             |
| Impersonate     | Login as user (audit logged) |
| Reset Password  | Send password reset          |
| Disable Account | Temporarily disable          |
| Delete Account  | Permanent deletion           |
| View Activity   | User's audit log             |
| Message User    | Send system message          |

---

## Team Management View

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [← Admin]  Team Management                                                         │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  ┌───────────────────────────────────────────────────────────────────────────┐│  │
│  │  │ Team             │ Coach          │ Players │ Created    │ Status │ Actions││ │
│  │  ├───────────────────────────────────────────────────────────────────────────┤│  │
│  │  │ Panthers         │ Mike Johnson   │ 15      │ Sep 2025   │ 🟢     │ [⋮]    ││  │
│  │  │ Eagles           │ Sarah Williams │ 12      │ Oct 2025   │ 🟢     │ [⋮]    ││  │
│  │  │ Thunder Bolts    │ John Smith     │ 3       │ Today      │ 🟡 New │ [⋮]    ││  │
│  │  │ Hawks            │ Lisa Davis     │ 18      │ Aug 2025   │ 🟢     │ [⋮]    ││  │
│  │  │ ...                                                                       ││  │
│  │  └───────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                │  │
│  │  Showing 1-25 of 42 teams                             [◀ Prev] [Next ▶]       │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Features

| Feature         | Description                |
| --------------- | -------------------------- |
| Platform Stats  | Users, teams, activity     |
| System Health   | Service status monitoring  |
| User Management | CRUD, role changes         |
| Team Management | View/edit all teams        |
| Audit Logs      | All system actions         |
| Support Tickets | Handle user issues         |
| Broadcasts      | System-wide messages       |
| Backups         | Database backup management |
| Impersonation   | Debug as user (logged)     |

---

## Admin Roles

| Role       | Permissions            |
| ---------- | ---------------------- |
| Superadmin | Full system access     |
| Support    | User/team support only |
| Analytics  | Read-only metrics      |
| Billing    | Payment management     |

---

## Audit Log Events

| Event           | Logged Data             |
| --------------- | ----------------------- |
| User Login      | IP, time, success/fail  |
| Role Change     | Who, what, when         |
| Account Delete  | Full record             |
| Impersonation   | Admin, target, duration |
| Data Export     | What, by whom           |
| Settings Change | Before/after            |

---

## Data Sources

| Data    | Service          | Table              |
| ------- | ---------------- | ------------------ |
| Users   | `AdminService`   | `users`            |
| Teams   | `AdminService`   | `teams`            |
| Audit   | `AuditService`   | `audit_logs`       |
| Support | `SupportService` | `support_tickets`  |
| Metrics | `MetricsService` | `platform_metrics` |
