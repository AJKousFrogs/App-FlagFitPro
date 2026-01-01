# UX Workflow Map

> **Purpose:** Document all critical user flows, identify dead ends, and ensure consistent UI behavior for privacy/safety states.
>
> **Last Updated:** 2025-12-30  
> **Scope Freeze:** Friday Test

---

## Table of Contents

1. [Coach Flows](#1-coach-flows)
2. [Player Flows](#2-player-flows)
3. [Failure State UI Requirements](#3-failure-state-ui-requirements)
4. [Dead Ends & Missing Links](#4-dead-ends--missing-links)
5. [Friday UI Fixes (Ranked by Impact)](#5-friday-ui-fixes-ranked-by-impact)
6. [Post-Friday Improvements](#6-post-friday-improvements)

---

## 1. Coach Flows

### 1.1 Team Setup Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  /register      │────▶│  /onboarding    │────▶│  /team/create   │
│  (Coach signup) │     │  (Role select)  │     │  (Create team)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │  /coach/        │◀────│  Team created   │
                        │  dashboard      │     │  (Redirect)     │
                        └─────────────────┘     └─────────────────┘
```

**Failure Points:**
| State | Where | UI Behavior Required |
|-------|-------|---------------------|
| No team exists | `/coach/dashboard` | Show "Create Team" CTA → `/team/create` |
| Team creation fails | `/team/create` | Toast error + retain form data |

**Current Status:** ✅ Routes exist

---

### 1.2 Roster Management Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  /coach/        │────▶│  /roster        │────▶│  Invite Player  │
│  dashboard      │     │  (Team roster)  │     │  (Dialog/Email) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │                       ▼
        │               ┌─────────────────┐
        │               │  Player Detail  │
        │               │  (Click row)    │
        │               └─────────────────┘
        │                       │
        │                       ▼
        │               ┌─────────────────────────────────────┐
        │               │  CONSENT CHECK                      │
        │               │  ├─ Sharing enabled → Show metrics  │
        │               │  └─ Sharing disabled → Show blocked │
        │               └─────────────────────────────────────┘
        │
        └──────────────▶ Quick Action: "Manage Roster"
```

**Failure Points:**
| State | Where | UI Behavior Required |
|-------|-------|---------------------|
| Empty roster | `/roster` | Empty state + "Invite Players" button |
| Player consent blocked | Player row | Show lock icon + "Private" tag + "Request sharing" button |
| Invitation fails | Dialog | Toast error + retry option |

**Current Status:** ✅ Implemented in `coach-dashboard.component.ts`

---

### 1.3 Player View (Consent Blocked Resolution)

```
┌─────────────────┐     ┌─────────────────────────────────────────┐
│  /roster        │────▶│  Player Row (consent blocked)           │
│  or             │     │  ├─ Shows: 🔒 icon, "Data not shared"   │
│  /coach/        │     │  ├─ Metrics: "—" (dashes)               │
│  dashboard      │     │  └─ Action: "Request data sharing" btn  │
└─────────────────┘     └─────────────────────────────────────────┘
                                        │
                                        ▼
                        ┌─────────────────────────────────────────┐
                        │  Request Sharing Action                  │
                        │  ├─ Toast: "Sending data sharing        │
                        │  │   request to athlete..."              │
                        │  └─ Navigate: /settings/privacy          │
                        │      (with player context)               │
                        └─────────────────────────────────────────┘
```

**Required UI Elements (from `privacy-ux-copy.ts`):**

```typescript
CONSENT_BLOCKED_MESSAGES.coachViewingPlayer = {
  title: "Data Not Shared",
  reason:
    "This player has not enabled performance data sharing with your team.",
  action: "The player can enable sharing in their Privacy Settings.",
  actionLabel: "Learn More",
  helpLink: "/help/privacy-sharing",
  icon: "pi-lock",
  severity: "info",
};
```

**Current Status:** ✅ Implemented with `isPlayerBlocked()` check

---

### 1.4 Assigning Training Plans

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  /coach/        │────▶│  /training/     │────▶│  Select Player  │
│  dashboard      │     │  schedule       │     │  (Dropdown)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                                               │
        │                                               ▼
        │                                       ┌─────────────────┐
        │                                       │  Assign Plan    │
        │                                       │  (Save button)  │
        │                                       └─────────────────┘
        │
        └──────────────▶ Quick Action: "Create Practice"
                         (Opens dialog, not new page)
```

**Failure Points:**
| State | Where | UI Behavior Required |
|-------|-------|---------------------|
| No players on team | Plan assignment | "Add players first" message + link to roster |
| Player consent blocked | Player dropdown | Show player but mark as "limited data" |

**Current Status:** ⚠️ Dialog exists but no route to full schedule management from dashboard

---

### 1.5 Load Dashboard (ACWR Monitoring)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  /coach/        │────▶│  /acwr          │────▶│  Player Detail  │
│  dashboard      │     │  (Load monitor) │     │  (Click row)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │                       ▼
        │               ┌─────────────────────────────────────┐
        │               │  DATA STATE CHECK                   │
        │               │  ├─ REAL_DATA → Show metrics        │
        │               │  ├─ INSUFFICIENT_DATA → Show        │
        │               │  │   warning + days needed          │
        │               │  ├─ NO_DATA → Show empty state      │
        │               │  └─ CONSENT_BLOCKED → Show lock     │
        │               └─────────────────────────────────────┘
        │
        └──────────────▶ Risk Alerts section links to
                         viewPlayer() or adjustPlayerLoad()
```

**Failure Points:**
| State | Where | UI Behavior Required |
|-------|-------|---------------------|
| Insufficient data | ACWR display | Show "Building Your Profile" message + days needed |
| No data | ACWR display | Show "No Data Yet" + link to `/training/log` |
| Consent blocked | Player row | Show "—" for metrics + lock icon |

**Current Status:** ✅ Routes exist, data state handling needed verification

---

## 2. Player Flows

### 2.1 Signup (16+ Age Verification)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  /register      │────▶│  Age checkbox   │────▶│  Terms checkbox │
└─────────────────┘     │  "I am 16+"     │     │  (Required)     │
                        └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │  /onboarding    │◀────│  Account        │
                        │  (Profile setup)│     │  created        │
                        └─────────────────┘     └─────────────────┘
                                │
                                ▼
                        ┌─────────────────┐
                        │  /dashboard     │
                        └─────────────────┘
```

**Validation Rules:**

- `ageVerification: [false, [Validators.requiredTrue]]`
- Error message: "You must be 16 or older to use this app"

**Current Status:** ✅ Implemented in `register.component.ts`

---

### 2.2 Privacy Settings Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  /dashboard     │────▶│  /settings      │────▶│  /settings/     │
│  (Sidebar)      │     │  (General)      │     │  privacy        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                        ┌───────────────────────────────┴───────────────────────────────┐
                        │                               │                               │
                        ▼                               ▼                               ▼
                ┌───────────────┐            ┌───────────────┐            ┌───────────────┐
                │  AI Toggle    │            │  Team Sharing │            │  Data Rights  │
                │  ├─ On/Off    │            │  ├─ Per-team  │            │  ├─ Export    │
                │  └─ Status    │            │  └─ Metrics   │            │  ├─ Delete   │
                └───────────────┘            └───────────────┘            │  └─ Audit    │
                        │                                                 └───────────────┘
                        ▼
                ┌───────────────────────────────────────┐
                │  AI Disabled Warning Banner           │
                │  "With AI processing disabled..."     │
                └───────────────────────────────────────┘
```

**Failure Points:**
| State | Where | UI Behavior Required |
|-------|-------|---------------------|
| Settings load fail | `/settings/privacy` | Loading spinner → Error toast |
| No teams | Team sharing section | Empty state: "You're not on any teams" |
| Save fails | Any toggle | Toast error + revert toggle state |

**Current Status:** ✅ Comprehensive implementation exists

---

### 2.3 Logging Workouts

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  /dashboard     │────▶│  /training/log  │────▶│  Form Submit    │
│  or             │     │  (Log session)  │     │  (Validation)   │
│  /training      │     └─────────────────┘     └─────────────────┘
└─────────────────┘             │                       │
                                │                       ▼
                                │               ┌─────────────────┐
                                │               │  Success Toast  │
                                │               │  + Redirect to  │
                                │               │  /training      │
                                │               └─────────────────┘
                                │
                                └──────────────▶ Cancel button
                                                 → Back to previous
```

**Failure Points:**
| State | Where | UI Behavior Required |
|-------|-------|---------------------|
| Form validation | Submit | Highlight invalid fields + error messages |
| Save fails | Submit | Toast error + retain form data |
| Cancel | Header button | Navigate back (no data loss warning if pristine) |

**Current Status:** ✅ Route exists at `/training/log`

---

### 2.4 Viewing Metrics with Data State

```
┌─────────────────┐     ┌─────────────────┐
│  /dashboard     │────▶│  /acwr          │
│  or             │     │  (ACWR display) │
│  /analytics     │     └─────────────────┘
└─────────────────┘             │
                                ▼
                ┌───────────────────────────────────────┐
                │  DATA STATE DISPLAY                   │
                │                                       │
                │  NO_DATA:                             │
                │  ┌─────────────────────────────────┐  │
                │  │ 📊 No Data Yet                  │  │
                │  │ Start logging your training    │  │
                │  │ [Log Training] button          │  │
                │  └─────────────────────────────────┘  │
                │                                       │
                │  INSUFFICIENT_DATA:                   │
                │  ┌─────────────────────────────────┐  │
                │  │ 📈 Building Your Profile       │  │
                │  │ ACWR needs 28 days of data     │  │
                │  │ You have X days (Y more needed)│  │
                │  └─────────────────────────────────┘  │
                │                                       │
                │  REAL_DATA:                           │
                │  ┌─────────────────────────────────┐  │
                │  │ ✅ Your ACWR: 1.23              │  │
                │  │ Risk Level: Moderate           │  │
                │  └─────────────────────────────────┘  │
                └───────────────────────────────────────┘
```

**Required Messages (from `privacy-ux-copy.ts`):**

```typescript
DATA_STATE_MESSAGES.NO_DATA = {
  title: "No Data Yet",
  reason: "We don't have any training data for you yet.",
  action: "Start logging your training sessions to see metrics.",
  actionLabel: "Log Training",
  helpLink: "/training/new", // ⚠️ Should be /training/log
};

DATA_STATE_MESSAGES.INSUFFICIENT_DATA = {
  title: "Building Your Profile",
  reason: "We need more training data to provide reliable metrics.",
  action: "Continue logging sessions. Most metrics need 2-4 weeks of data.",
  helpLink: "/help/data-requirements",
};
```

**Current Status:** ⚠️ Link in NO_DATA points to `/training/new` but route is `/training/log`

---

### 2.5 AI Usage with Opt-Out

```
┌─────────────────┐     ┌─────────────────┐
│  /chat          │────▶│  AI Chat        │
│  (AI Coach)     │     │  Interface      │
└─────────────────┘     └─────────────────┘
        │                       │
        │                       ▼
        │               ┌───────────────────────────────────────┐
        │               │  AI CONSENT CHECK                     │
        │               │                                       │
        │               │  ENABLED:                             │
        │               │  → Normal chat functionality          │
        │               │                                       │
        │               │  DISABLED:                            │
        │               │  ┌─────────────────────────────────┐  │
        │               │  │ 🤖 AI Features Disabled         │  │
        │               │  │ You have opted out of AI        │  │
        │               │  │ [Enable AI Features] button     │  │
        │               │  │ → /settings/privacy#ai          │  │
        │               │  └─────────────────────────────────┘  │
        │               └───────────────────────────────────────┘
        │
        └──────────────▶ Also affects:
                         - /training/ai-scheduler
                         - /training/ai-companion
                         - Smart recommendations
```

**Component:** `<app-ai-consent-required>` in `ai-consent-required.component.ts`

**Current Status:** ✅ Component exists with proper routing to `/settings/privacy#ai`

---

### 2.6 Deletion Request/Cancel Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  /settings/     │────▶│  Delete Account │────▶│  Confirm Dialog │
│  privacy        │     │  Section        │     │  Type "DELETE"  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                        ┌─────────────────────────────────────────┐
                        │  DELETION STATES                        │
                        │                                         │
                        │  REQUESTED (just submitted):            │
                        │  ┌─────────────────────────────────┐    │
                        │  │ ⚠️ Deletion scheduled in 30 days│    │
                        │  │ [Cancel Deletion] button        │    │
                        │  └─────────────────────────────────┘    │
                        │                                         │
                        │  PENDING (within grace period):         │
                        │  ┌─────────────────────────────────┐    │
                        │  │ ⏳ Deletion Pending             │    │
                        │  │ X days remaining                │    │
                        │  │ [Cancel Deletion] button        │    │
                        │  └─────────────────────────────────┘    │
                        │                                         │
                        │  CANCELED:                              │
                        │  ┌─────────────────────────────────┐    │
                        │  │ ✅ Deletion Canceled            │    │
                        │  │ Your account is safe            │    │
                        │  └─────────────────────────────────┘    │
                        └─────────────────────────────────────────┘
```

**Failure Points:**
| State | Where | UI Behavior Required |
|-------|-------|---------------------|
| Deletion request fails | Dialog | Toast error + keep dialog open |
| Cancel fails | Cancel button | Toast error + show retry |
| User logs in during grace | Any page | Show banner with cancel option |

**Current Status:** ✅ Implemented in `privacy-controls.component.ts`

---

## 3. Failure State UI Requirements

### 3.1 Consent Blocked States

| Context                 | Component                 | Message Source                                   | Required Action                 |
| ----------------------- | ------------------------- | ------------------------------------------------ | ------------------------------- |
| Coach → Player (single) | `consent-blocked-message` | `CONSENT_BLOCKED_MESSAGES.coachViewingPlayer`    | Link to `/help/privacy-sharing` |
| Coach → Team (partial)  | Partial data notice       | `CONSENT_BLOCKED_MESSAGES.coachTeamPartialBlock` | Link to `/help/team-privacy`    |
| Player own data         | Privacy settings          | `CONSENT_BLOCKED_MESSAGES.playerDataNotShared`   | Link to `/settings/privacy`     |

### 3.2 AI Disabled States

| Context                  | Component             | Message Source                    | Required Action                 |
| ------------------------ | --------------------- | --------------------------------- | ------------------------------- |
| AI Chat                  | `ai-consent-required` | `AI_PROCESSING_MESSAGES.disabled` | Button → `/settings/privacy#ai` |
| AI Scheduler             | `ai-consent-required` | `AI_PROCESSING_MESSAGES.disabled` | Button → `/settings/privacy#ai` |
| Training recommendations | Inline message        | `AI_PROCESSING_MESSAGES.disabled` | Link → `/settings/privacy#ai`   |

### 3.3 Data State Messages

| State               | Icon              | Title                   | Action Link               |
| ------------------- | ----------------- | ----------------------- | ------------------------- |
| `NO_DATA`           | `pi-database`     | "No Data Yet"           | `/training/log`           |
| `INSUFFICIENT_DATA` | `pi-chart-line`   | "Building Your Profile" | `/help/data-requirements` |
| `DEMO_DATA`         | `pi-eye`          | "Demo Data"             | `/training/log`           |
| `REAL_DATA`         | `pi-check-circle` | "Your Data"             | `/training/history`       |

### 3.4 Deletion Pending States

| State       | Icon              | Severity | Action                         |
| ----------- | ----------------- | -------- | ------------------------------ |
| `requested` | `pi-clock`        | warning  | Cancel button                  |
| `pending`   | `pi-hourglass`    | warning  | Cancel button + days remaining |
| `canceled`  | `pi-check-circle` | success  | None                           |

---

## 4. Dead Ends & Missing Links

### 4.1 Identified Dead Ends

| Location                                    | Issue                                                                               | Severity  | Fix                                   |
| ------------------------------------------- | ----------------------------------------------------------------------------------- | --------- | ------------------------------------- |
| `DATA_STATE_MESSAGES.NO_DATA.helpLink`      | Points to `/training/new` but route is `/training/log`                              | 🔴 High   | Update to `/training/log`             |
| `privacy-controls.component.ts` → Audit Log | `showAuditLog()` shows toast "coming soon"                                          | 🟡 Medium | Disable button or implement           |
| Coach Dashboard → Analytics                 | `navigateToAnalytics()` goes to `/analytics` but no coach-specific view             | 🟡 Medium | Add coach analytics route             |
| Coach Dashboard → Training                  | `adjustPlayerLoad()` navigates with query params but no handler                     | 🟡 Medium | Implement query param handling        |
| `/help/*` routes                            | All help links (`/help/privacy-sharing`, `/help/team-privacy`, etc.) have no routes | 🔴 High   | Create help pages or redirect to docs |

### 4.2 Missing Navigation Links

| From               | To                   | Missing Element                       |
| ------------------ | -------------------- | ------------------------------------- |
| `/dashboard`       | `/settings/privacy`  | No direct link (only via Settings)    |
| `/acwr`            | `/training/log`      | No "Log Training" button when NO_DATA |
| `/training`        | `/acwr`              | No link to view load metrics          |
| `/coach/dashboard` | `/training/schedule` | Quick action exists but route unclear |

### 4.3 Orphaned Routes

| Route                     | Issue                          |
| ------------------------- | ------------------------------ |
| `/training/ai-companion`  | Exists but no navigation to it |
| `/training/load-analysis` | Exists but no navigation to it |
| `/training/goal-planner`  | Exists but no navigation to it |
| `/training/microcycle`    | Exists but no navigation to it |
| `/training/import`        | Exists but no navigation to it |

---

## 5. Friday UI Fixes (Ranked by Impact)

### 🔴 Critical (Must Fix Before Friday)

1. **Fix NO_DATA helpLink**
   - **File:** `angular/src/app/shared/utils/privacy-ux-copy.ts`
   - **Change:** `helpLink: '/training/new'` → `helpLink: '/training/log'`
   - **Impact:** Prevents dead end when user clicks "Log Training"
   - **Risk:** None (string change only)

2. **Add /help/\* redirect or placeholder**
   - **Files:** `angular/src/app/core/routes/feature-routes.ts`
   - **Change:** Add redirect routes for `/help/*` to `/docs/*` or landing page
   - **Impact:** Prevents 404 on all help links
   - **Risk:** Low

3. **Verify coach consent blocked UI shows correctly**
   - **Files:** `coach-dashboard.component.ts`
   - **Change:** Test `isPlayerBlocked()` with real blocked players
   - **Impact:** Ensures coaches see correct privacy state
   - **Risk:** None (verification only)

### 🟡 High (Should Fix If Time)

4. **Add "Log Training" button to ACWR NO_DATA state**
   - **File:** `angular/src/app/features/acwr-dashboard/acwr-dashboard.component.ts`
   - **Change:** Add CTA button when data state is NO_DATA
   - **Impact:** Guides users to log training
   - **Risk:** Low

5. **Disable Audit Log button until implemented**
   - **File:** `angular/src/app/features/settings/privacy-controls/privacy-controls.component.ts`
   - **Change:** Add `[disabled]="true"` or hide button
   - **Impact:** Prevents user confusion
   - **Risk:** None

6. **Add direct Privacy Settings link to dashboard**
   - **File:** `angular/src/app/features/dashboard/athlete-dashboard.component.ts`
   - **Change:** Add quick action or menu item
   - **Impact:** Easier access to privacy controls
   - **Risk:** Low

### 🟢 Medium (Nice to Have)

7. **Implement query param handling for `adjustPlayerLoad`**
   - **File:** `angular/src/app/features/training/training.component.ts`
   - **Change:** Read `player` and `action` query params
   - **Impact:** Coach workflow improvement
   - **Risk:** Medium

8. **Add navigation to orphaned training routes**
   - **Files:** Training component, sidebar
   - **Change:** Add menu items for AI companion, goal planner, etc.
   - **Impact:** Feature discoverability
   - **Risk:** Low

---

## 6. Post-Friday Improvements

> **Note:** These are NOT to be implemented before Friday testing.

### UI/UX Enhancements

1. **Coach Analytics Dashboard**
   - Create `/coach/analytics` with team-wide metrics
   - Aggregate ACWR, performance trends, injury risk

2. **Help Center**
   - Build `/help` section with articles
   - Topics: privacy, ACWR, data requirements, team sharing

3. **Onboarding Privacy Walkthrough**
   - Add privacy settings step to onboarding
   - Explain AI opt-in, team sharing defaults

4. **Data State Visualization**
   - Progress bar showing days until REAL_DATA
   - Visual indicator of data quality

5. **Audit Log Implementation**
   - Build `/settings/audit-log` page
   - Show data access history

### Technical Improvements

1. **Route Guards for Coach-Only Pages**
   - Add `coachGuard` to `/coach/*` routes
   - Redirect non-coaches to player dashboard

2. **Deep Linking for Privacy Settings**
   - Support `#ai`, `#team`, `#deletion` anchors
   - Scroll to section on load

3. **Offline Support for Training Log**
   - Queue submissions when offline
   - Sync when connection restored

4. **Real-time Consent Updates**
   - Supabase realtime subscription for consent changes
   - Update coach dashboard live when player changes sharing

---

## Appendix: Route Reference

### Public Routes

- `/` - Landing
- `/login` - Login
- `/register` - Registration (16+ verification)
- `/reset-password` - Password reset
- `/onboarding` - New user onboarding
- `/accept-invitation` - Team invitation acceptance

### Player Routes (Auth Required)

- `/dashboard` - Player dashboard
- `/training` - Training hub
- `/training/log` - Log workout
- `/training/schedule` - View schedule
- `/training/daily` - Daily training
- `/acwr` - ACWR dashboard
- `/wellness` - Wellness tracking
- `/analytics` - Performance analytics
- `/settings` - General settings
- `/settings/privacy` - Privacy controls
- `/profile` - User profile

### Coach Routes (Auth Required)

- `/coach/dashboard` - Coach dashboard
- `/roster` - Team roster
- `/team/create` - Create team
- `/attendance` - Attendance tracking
- `/depth-chart` - Depth chart
- `/game-tracker` - Game tracking

### AI Routes (Consent Required)

- `/chat` - AI chat
- `/training/ai-scheduler` - AI training scheduler
- `/training/ai-companion` - AI training companion

---

_Document generated for Friday Test Scope Freeze_
