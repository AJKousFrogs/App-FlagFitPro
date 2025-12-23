# Implementation Plan: Routing & API Standardization

**Developer Handover Document**  
**Last Updated:** 2025-01-22

---

## Table of Contents

1. [Canonical Routing Rules](#1-canonical-routing-rules)
2. [Route Map](#2-route-map)
3. [Redirect Strategy](#3-redirect-strategy)
4. [API Standardization Rules](#4-api-standardization-rules)
5. [Missing Endpoints Decision List](#5-missing-endpoints-decision-list)
6. [Implementation Phases](#6-implementation-phases)

---

## 1. Canonical Routing Rules

### Rule 1: Canonical UI Routes Do Not Use `.html`

**All `.html` pages are legacy and must redirect to Angular routes.**

- ✅ Canonical: `/dashboard`, `/training`, `/analytics`
- ❌ Legacy: `/dashboard.html`, `/training.html`, `/analytics.html`
- **Action:** All `.html` routes redirect (301) to canonical routes

### Rule 2: Angular Handles Deep Links (SPA Fallback)

**All non-asset paths rewrite to `/index.html` for Angular router.**

- ✅ Assets: `/src/**`, `/dist/**`, `/*.css`, `/*.js`, `/*.png`, etc. → serve directly
- ✅ API: `/api/**` → Netlify functions
- ✅ SPA: `/*` → `/index.html` (200 rewrite, not redirect)

### Rule 3: Sidebar Uses Angular Router Links Only

**No direct `.html` references in navigation.**

- ✅ Use Angular `routerLink` directive
- ✅ Or use `[routerLink]="/route"` binding
- ❌ No `href="/page.html"` in sidebar

### Rule 4: Public Flows Have Angular Routes

**Even minimal UI flows must have Angular routes for consistency.**

- `/verify-email` → Angular component (even if just shows message)
- `/accept-invitation` → Angular component
- `/reset-password` → Angular component (already exists)
- `/onboarding` → Angular component

---

## 2. Route Map

### 2.1 Critical Routes (Must Exist - Build Breaking)

| Route                | Component                   | Guard       | Priority    | Status     |
| -------------------- | --------------------------- | ----------- | ----------- | ---------- |
| `/workout`           | `WorkoutComponent`          | `authGuard` | 🔴 Critical | ❌ Missing |
| `/exercise-library`  | `ExerciseLibraryComponent`  | `authGuard` | 🔴 Critical | ❌ Missing |
| `/onboarding`        | `OnboardingComponent`       | None        | 🔴 Critical | ❌ Missing |
| `/verify-email`      | `VerifyEmailComponent`      | None        | 🔴 Critical | ❌ Missing |
| `/accept-invitation` | `AcceptInvitationComponent` | None        | 🔴 Critical | ❌ Missing |

### 2.2 High Priority Routes (Structure, Not Pile of Pages)

| Route                     | Component                      | Guard                             | Priority | Status                        |
| ------------------------- | ------------------------------ | --------------------------------- | -------- | ----------------------------- |
| `/team/create`            | `TeamCreateComponent`          | `authGuard`                       | 🟡 High  | ❌ Missing                    |
| `/training/schedule`      | `TrainingScheduleComponent`    | `authGuard`                       | 🟡 High  | ❌ Missing                    |
| `/training/qb/schedule`   | `QbTrainingScheduleComponent`  | `authGuard`, `roleGuard('qb')`    | 🟡 High  | ❌ Missing                    |
| `/training/qb/throwing`   | `QbThrowingTrackerComponent`   | `authGuard`, `roleGuard('qb')`    | 🟡 High  | ❌ Missing                    |
| `/training/qb/assessment` | `QbAssessmentToolsComponent`   | `authGuard`, `roleGuard('qb')`    | 🟡 High  | ❌ Missing                    |
| `/training/ai-scheduler`  | `AiTrainingSchedulerComponent` | `authGuard`                       | 🟡 High  | ❌ Missing                    |
| `/coach/dashboard`        | `CoachDashboardComponent`      | `authGuard`, `roleGuard('coach')` | 🟡 High  | ⚠️ Route mismatch             |
| `/analytics/enhanced`     | `EnhancedAnalyticsComponent`   | `authGuard`                       | 🟡 High  | ⚠️ Or merge into `/analytics` |

### 2.3 Existing Routes (Verify Correctness)

| Route                   | Component                      | Guard                            | Status    |
| ----------------------- | ------------------------------ | -------------------------------- | --------- |
| `/`                     | `LandingComponent`             | None                             | ✅ Exists |
| `/login`                | `LoginComponent`               | None                             | ✅ Exists |
| `/register`             | `RegisterComponent`            | None                             | ✅ Exists |
| `/reset-password`       | `ResetPasswordComponent`       | None                             | ✅ Exists |
| `/dashboard`            | `DashboardComponent`           | `authGuard`, `headerConfigGuard` | ✅ Exists |
| `/training`             | `TrainingComponent`            | `authGuard`, `headerConfigGuard` | ✅ Exists |
| `/analytics`            | `AnalyticsComponent`           | `authGuard`, `headerConfigGuard` | ✅ Exists |
| `/performance-tracking` | `PerformanceTrackingComponent` | `authGuard`                      | ✅ Exists |
| `/roster`               | `RosterComponent`              | `authGuard`                      | ✅ Exists |
| `/coach`                | `CoachComponent`               | `authGuard`                      | ✅ Exists |
| `/game-tracker`         | `GameTrackerComponent`         | `authGuard`                      | ✅ Exists |
| `/tournaments`          | `TournamentsComponent`         | `authGuard`                      | ✅ Exists |
| `/wellness`             | `WellnessComponent`            | `authGuard`                      | ✅ Exists |
| `/acwr`                 | `AcwrDashboardComponent`       | `authGuard`                      | ✅ Exists |
| `/community`            | `CommunityComponent`           | `authGuard`                      | ✅ Exists |
| `/chat`                 | `ChatComponent`                | `authGuard`                      | ✅ Exists |
| `/profile`              | `ProfileComponent`             | `authGuard`                      | ✅ Exists |
| `/settings`             | `SettingsComponent`            | `authGuard`                      | ✅ Exists |

### 2.4 Guard Strategy

**Auth Guard** (`authGuard`):

- Blocks unauthenticated users
- Redirects to `/login` with return URL

**Role Guard** (`roleGuard(role)`):

- Checks user role (coach, player, admin)
- Returns 403 or redirects if unauthorized

**Feature Flag Guard** (`featureFlagGuard(flag)`):

- Enables/disables features based on flags
- Example: `featureFlagGuard('qbTools')` for QB-specific features

**Header Config Guard** (`headerConfigGuard`):

- Sets page-specific header configuration
- Used for dashboard/analytics pages

---

## 3. Redirect Strategy

### 3.1 Legacy HTML → Canonical Routes (301 Redirects)

**Direction:** `.html` → Angular route (NOT the other way around)

```toml
# Legacy HTML to Canonical Routes (301 Permanent Redirects)
[[redirects]]
  from = "/dashboard.html"
  to = "/dashboard"
  status = 301

[[redirects]]
  from = "/training.html"
  to = "/training"
  status = 301

[[redirects]]
  from = "/analytics.html"
  to = "/analytics"
  status = 301

[[redirects]]
  from = "/roster.html"
  to = "/roster"
  status = 301

[[redirects]]
  from = "/tournaments.html"
  to = "/tournaments"
  status = 301

[[redirects]]
  from = "/community.html"
  to = "/community"
  status = 301

[[redirects]]
  from = "/chat.html"
  to = "/chat"
  status = 301

[[redirects]]
  from = "/settings.html"
  to = "/settings"
  status = 301

[[redirects]]
  from = "/profile.html"
  to = "/profile"
  status = 301

[[redirects]]
  from = "/login.html"
  to = "/login"
  status = 301

[[redirects]]
  from = "/register.html"
  to = "/register"
  status = 301

[[redirects]]
  from = "/reset-password.html"
  to = "/reset-password"
  status = 301

[[redirects]]
  from = "/workout.html"
  to = "/workout"
  status = 301

[[redirects]]
  from = "/exercise-library.html"
  to = "/exercise-library"
  status = 301

[[redirects]]
  from = "/onboarding.html"
  to = "/onboarding"
  status = 301

[[redirects]]
  from = "/verify-email.html"
  to = "/verify-email"
  status = 301

[[redirects]]
  from = "/accept-invitation.html"
  to = "/accept-invitation"
  status = 301

[[redirects]]
  from = "/team-create.html"
  to = "/team/create"
  status = 301

[[redirects]]
  from = "/coach-dashboard.html"
  to = "/coach/dashboard"
  status = 301

[[redirects]]
  from = "/coach.html"
  to = "/coach"
  status = 301

[[redirects]]
  from = "/game-tracker.html"
  to = "/game-tracker"
  status = 301

[[redirects]]
  from = "/performance-tracking.html"
  to = "/performance-tracking"
  status = 301

[[redirects]]
  from = "/wellness.html"
  to = "/wellness"
  status = 301

[[redirects]]
  from = "/training-schedule.html"
  to = "/training/schedule"
  status = 301

[[redirects]]
  from = "/qb-training-schedule.html"
  to = "/training/qb/schedule"
  status = 301

[[redirects]]
  from = "/qb-throwing-tracker.html"
  to = "/training/qb/throwing"
  status = 301

[[redirects]]
  from = "/qb-assessment-tools.html"
  to = "/training/qb/assessment"
  status = 301

[[redirects]]
  from = "/ai-training-scheduler.html"
  to = "/training/ai-scheduler"
  status = 301

[[redirects]]
  from = "/analytics-dashboard.html"
  to = "/analytics"
  status = 301

[[redirects]]
  from = "/enhanced-analytics.html"
  to = "/analytics/enhanced"
  status = 301
```

### 3.2 SPA Fallback (200 Rewrite)

**Direction:** All non-asset, non-API paths → `/index.html`

```toml
# SPA Fallback - Angular Router handles all routes
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
  force = false
  conditions = {Role = ["admin"]}
  # Exclude API routes and static assets
  # Netlify automatically excludes /api/* and static files
```

**Note:** Netlify automatically excludes:

- `/api/*` (handled by function redirects)
- Static assets (`*.css`, `*.js`, `*.png`, etc.)
- Files in `dist/`, `src/` directories

---

## 4. API Standardization Rules

### Rule 1: Frontend Calls Only `/api/...`

**No direct `/.netlify/functions/...` references in browser code.**

- ✅ Frontend calls: `/api/dashboard/overview`
- ❌ Frontend calls: `/.netlify/functions/dashboard`
- **Action:** Remove all `includes("netlify/functions")` conditionals from `api-config.js`

### Rule 2: One Domain = One Function Router (Recommended Pattern)

**Pattern:** Single function handles all routes for a domain with internal routing.

**Current Examples:**

- `analytics.cjs` → handles `/api/analytics/*`
- `coach.cjs` → handles `/api/coach/*`
- `community.cjs` → handles `/api/community/*`

**Extend This Pattern To:**

- `dashboard.cjs` → handles `/api/dashboard/*`
- `training.cjs` → handles `/api/training/*`
- `tournaments.cjs` → handles `/api/tournaments/*`
- `player-stats.cjs` → handles `/api/player-stats/*`
- `algorithms.cjs` → handles `/api/algorithms/*`
- `wellness.cjs` → handles `/api/wellness/*`
- `supplements.cjs` → handles `/api/supplements/*`

### Rule 3: Netlify Redirects Map API to Functions

**Pattern:** `/api/<domain>/*` → `/.netlify/functions/<domain-function>`

```toml
# API Routes - Domain-based routing
[[redirects]]
  from = "/api/dashboard/*"
  to = "/.netlify/functions/dashboard"
  status = 200
  force = true

[[redirects]]
  from = "/api/training/*"
  to = "/.netlify/functions/training"
  status = 200
  force = true

[[redirects]]
  from = "/api/community/*"
  to = "/.netlify/functions/community"
  status = 200
  force = true

[[redirects]]
  from = "/api/tournaments/*"
  to = "/.netlify/functions/tournaments"
  status = 200
  force = true

[[redirects]]
  from = "/api/player-stats/*"
  to = "/.netlify/functions/player-stats"
  status = 200
  force = true

[[redirects]]
  from = "/api/algorithms/*"
  to = "/.netlify/functions/algorithms"
  status = 200
  force = true

[[redirects]]
  from = "/api/wellness/*"
  to = "/.netlify/functions/wellness"
  status = 200
  force = true

[[redirects]]
  from = "/api/supplements/*"
  to = "/.netlify/functions/supplements"
  status = 200
  force = true
```

### Rule 4: Function Internal Routing Pattern

**Use path-based routing within functions:**

```javascript
// Example: dashboard.cjs
exports.handler = async (event, context) => {
  // Extract sub-path
  const path = event.path.replace("/.netlify/functions/dashboard", "");

  // Route to handler
  if (path.includes("/overview") || path.endsWith("/overview")) {
    return await getDashboardOverview(userId);
  } else if (path.includes("/training-calendar")) {
    return await getTrainingCalendar(userId);
  } else if (path.includes("/olympic-qualification")) {
    return await getOlympicQualification(userId);
  } else {
    return createErrorResponse("Endpoint not found", 404);
  }
};
```

---

## 5. Missing Endpoints Decision List

### 5.1 Dashboard Endpoints

| Endpoint                               | Config Reference | Function           | Decision      | Priority    | Notes                            |
| -------------------------------------- | ---------------- | ------------------ | ------------- | ----------- | -------------------------------- |
| `/api/dashboard/overview`              | ✅ Exists        | ✅ `dashboard.cjs` | ✅ Keep       | 🔴 Critical | Main dashboard data              |
| `/api/dashboard/training-calendar`     | ✅ Exists        | ❌ Missing         | ⚠️ **DECIDE** | 🟡 High     | Add to `dashboard.cjs` or delete |
| `/api/dashboard/olympic-qualification` | ✅ Exists        | ❌ Missing         | ⚠️ **DECIDE** | 🟡 Medium   | Real feature or placeholder?     |
| `/api/dashboard/sponsor-rewards`       | ✅ Exists        | ❌ Missing         | ⚠️ **DECIDE** | 🟢 Low      | Real feature or placeholder?     |
| `/api/dashboard/wearables`             | ✅ Exists        | ❌ Missing         | ⚠️ **DECIDE** | 🟢 Low      | Real feature or placeholder?     |
| `/api/dashboard/team-chemistry`        | ✅ Exists        | ❌ Missing         | ⚠️ **DECIDE** | 🟡 Medium   | Real feature or placeholder?     |
| `/api/dashboard/daily-quote`           | ✅ Exists        | ❌ Missing         | ⚠️ **DECIDE** | 🟢 Low      | Real feature or placeholder?     |
| `/api/dashboard/health`                | ✅ Exists        | ❌ Missing         | ⚠️ **DECIDE** | 🟡 Medium   | Health check endpoint            |

**Decision Framework:**

- **If Real Feature:** Implement minimal response in `dashboard.cjs`, evolve later
- **If Placeholder:** Delete from `api-config.js` and remove references

**Recommended Actions:**

1. **Implement:** `training-calendar`, `team-chemistry`, `health`
2. **Delete:** `sponsor-rewards`, `wearables`, `daily-quote` (unless product confirms)
3. **Defer:** `olympic-qualification` (confirm with product)

### 5.2 Training Endpoints

| Endpoint                       | Config Reference | Function                         | Decision        | Priority    | Notes                                                                                           |
| ------------------------------ | ---------------- | -------------------------------- | --------------- | ----------- | ----------------------------------------------------------------------------------------------- |
| `/api/training/stats`          | ✅ Exists        | ✅ `training-stats.cjs`          | ⚠️ Fix redirect | 🔴 Critical | Mismatch: config expects `/api/training/stats`, function is `/training-stats`                   |
| `/api/training/stats-enhanced` | ✅ Exists        | ✅ `training-stats-enhanced.cjs` | ⚠️ Fix redirect | 🟡 High     | Mismatch: config expects `/api/training/stats-enhanced`, function is `/training-stats-enhanced` |
| `/api/training/sessions`       | ✅ Exists        | ✅ `training-sessions.cjs`       | ✅ Keep         | 🔴 Critical | Works correctly                                                                                 |
| `/api/training/complete`       | ✅ Exists        | ✅ `training-complete.cjs`       | ✅ Keep         | 🔴 Critical | Works correctly                                                                                 |
| `/api/training/suggestions`    | ✅ Exists        | ✅ `training-suggestions.cjs`    | ✅ Keep         | 🔴 Critical | Works correctly                                                                                 |

**Action Required:**

- Add redirects for `/api/training/stats` → `/.netlify/functions/training-stats`
- Add redirects for `/api/training/stats-enhanced` → `/.netlify/functions/training-stats-enhanced`
- OR: Consolidate into `training.cjs` router function

### 5.3 Community Endpoints

| Endpoint                     | Config Reference | Function           | Decision         | Priority    | Notes                   |
| ---------------------------- | ---------------- | ------------------ | ---------------- | ----------- | ----------------------- |
| `/api/community/feed`        | ✅ Exists        | ✅ `community.cjs` | ✅ Keep          | 🔴 Critical | Works correctly         |
| `/api/community/posts`       | ✅ Exists        | ✅ `community.cjs` | ✅ Keep          | 🔴 Critical | Works correctly         |
| `/api/community/challenges`  | ✅ Exists        | ❌ Missing         | ⚠️ **IMPLEMENT** | 🟡 High     | Core engagement feature |
| `/api/community/leaderboard` | ✅ Exists        | ✅ `community.cjs` | ✅ Keep          | 🟡 High     | Works correctly         |
| `/api/community/health`      | ✅ Exists        | ❌ Missing         | ⚠️ **IMPLEMENT** | 🟡 Medium   | Health check endpoint   |

**Action Required:**

- Add `challenges` handler to `community.cjs`
- Add `health` handler to `community.cjs`

### 5.4 Wellness & Supplements Endpoints

| Endpoint                            | Config Reference | Function                  | Decision         | Priority    | Notes                    |
| ----------------------------------- | ---------------- | ------------------------- | ---------------- | ----------- | ------------------------ |
| `/api/wellness/checkin`             | ✅ Exists        | ❌ Missing                | ⚠️ **IMPLEMENT** | 🔴 Critical | Required for AI coaching |
| `/api/supplements/log`              | ✅ Exists        | ❌ Missing                | ⚠️ **IMPLEMENT** | 🔴 Critical | Required for AI coaching |
| `/api/performance-data/wellness`    | ✅ Exists        | ✅ `performance-data.cjs` | ✅ Keep          | 🔴 Critical | Works correctly          |
| `/api/performance-data/supplements` | ✅ Exists        | ✅ `performance-data.cjs` | ✅ Keep          | 🔴 Critical | Works correctly          |

**Action Required:**

- Create `wellness.cjs` function with `checkin` handler
- Create `supplements.cjs` function with `log` handler
- OR: Add to `performance-data.cjs` (if keeping unified approach)

### 5.5 Player Stats & Training Plan Endpoints

| Endpoint                       | Config Reference | Function               | Decision        | Priority    | Notes            |
| ------------------------------ | ---------------- | ---------------------- | --------------- | ----------- | ---------------- |
| `/api/player-stats/aggregated` | ✅ Exists        | ✅ `player-stats.cjs`  | ⚠️ Fix redirect | 🔴 Critical | Missing redirect |
| `/api/player-stats/date-range` | ✅ Exists        | ✅ `player-stats.cjs`  | ⚠️ Fix redirect | 🔴 Critical | Missing redirect |
| `/api/training-plan`           | ✅ Exists        | ✅ `training-plan.cjs` | ⚠️ Fix redirect | 🔴 Critical | Missing redirect |

**Action Required:**

- Add redirects for `/api/player-stats/*` → `/.netlify/functions/player-stats`
- Add redirects for `/api/training-plan` → `/.netlify/functions/training-plan`

### 5.6 Algorithms Endpoints

| Endpoint                 | Config Reference | Function   | Decision      | Priority  | Notes               |
| ------------------------ | ---------------- | ---------- | ------------- | --------- | ------------------- |
| `/api/algorithms/health` | ✅ Exists        | ❌ Missing | ⚠️ **DECIDE** | 🟡 Medium | Delete or implement |

**Action Required:**

- Create `algorithms.cjs` with health endpoint
- OR: Delete from `api-config.js` if not needed

### 5.7 Tournaments Endpoints

| Endpoint                  | Config Reference | Function             | Decision         | Priority    | Notes                    |
| ------------------------- | ---------------- | -------------------- | ---------------- | ----------- | ------------------------ |
| `/api/tournaments`        | ✅ Exists        | ✅ `tournaments.cjs` | ✅ Keep          | 🔴 Critical | Works correctly          |
| `/api/tournaments/health` | ✅ Exists        | ❌ Missing           | ⚠️ **IMPLEMENT** | 🟡 Medium   | Add to `tournaments.cjs` |

**Action Required:**

- Add `health` handler to `tournaments.cjs`

---

## 6. Implementation Phases

### Phase 1: Stabilize Navigation + API Wiring (Week 1)

**Goals:**

- Add missing Angular routes (critical list)
- Redirect all `.html` → canonical routes
- Update sidebar to Angular routes only
- Standardize API config to `/api/...` (remove Netlify conditionals)

**Tasks:**

1. ✅ Add routes to `angular/src/app/core/routes/feature-routes.ts`:
   - `/workout`
   - `/exercise-library`
   - `/onboarding`
   - `/verify-email`
   - `/accept-invitation`

2. ✅ Add redirects to `netlify.toml` (see Section 3.1)

3. ✅ Update sidebar component to use Angular `routerLink`

4. ✅ Update `src/api-config.js`:
   - Remove all `API_BASE_URL.includes("netlify/functions")` conditionals
   - Standardize all endpoints to `/api/...` format

**Acceptance Criteria:**

- All legacy `.html` routes redirect correctly
- Sidebar navigation uses Angular router
- No direct Netlify function references in frontend code

### Phase 2: Finish Missing APIs + Remove Drift (Week 2)

**Goals:**

- Implement missing dashboard endpoints or delete them
- Implement wellness check-in + supplements log
- Add redirects for player-stats and training-plan
- Create router-style functions for missing domains

**Tasks:**

1. ✅ Create/update `dashboard.cjs`:
   - Add handlers for: `training-calendar`, `team-chemistry`, `health`
   - Delete or defer: `sponsor-rewards`, `wearables`, `daily-quote`, `olympic-qualification`

2. ✅ Create `wellness.cjs`:
   - Add `checkin` handler (POST)

3. ✅ Create `supplements.cjs`:
   - Add `log` handler (POST)

4. ✅ Update `community.cjs`:
   - Add `challenges` handler
   - Add `health` handler

5. ✅ Add redirects to `netlify.toml`:
   - `/api/player-stats/*` → `/.netlify/functions/player-stats`
   - `/api/training-plan` → `/.netlify/functions/training-plan`
   - `/api/wellness/*` → `/.netlify/functions/wellness`
   - `/api/supplements/*` → `/.netlify/functions/supplements`

**Acceptance Criteria:**

- All endpoints in `api-config.js` resolve correctly
- No "404" or "endpoint not found" errors
- Wellness and supplements data can be logged

### Phase 3: AI Coaching Revamp (Week 3-4)

**Goals:**

- Add risk-tiering + context-first pipeline
- Integrate wellness + load + injuries into AI responses
- Add feedback loop + coach visibility

**Tasks:**

1. ✅ Create `user-context.cjs` endpoint:
   - Returns: body metrics, injuries, role, last 7/28 day loads, active program, team role

2. ✅ Create `ai/chat.cjs` endpoint:
   - Reads user context
   - Applies risk-tiering rules
   - Generates contextualized responses

3. ✅ Create `ai/feedback.cjs` endpoint:
   - Stores thumbs up/down + reason
   - Tracks recommendation effectiveness

4. ✅ Update AI coaching system:
   - Integrate wellness check-ins
   - Integrate supplements logs (read-only, no dosing advice)
   - Add injury flags to context

**Acceptance Criteria:**

- AI responses are contextualized to user data
- Risk-tiering prevents unsafe medical advice
- Feedback loop tracks recommendation quality

---

## 7. Testing Checklist

### Route Testing:

- [ ] Test all Angular routes load correctly
- [ ] Test all `.html` redirects work (301)
- [ ] Test sidebar navigation links
- [ ] Test deep linking to all pages
- [ ] Test 404 handling for invalid routes
- [ ] Test SPA fallback works

### API Testing:

- [ ] Test all API endpoints return correct responses
- [ ] Test Netlify function redirects work
- [ ] Test API error handling (404, 401, 500)
- [ ] Test API authentication/authorization
- [ ] Test API rate limiting
- [ ] Test CORS headers

### Button/Link Testing:

- [ ] Test all `routerLink` navigation
- [ ] Test all `data-action` buttons (legacy pages)
- [ ] Test all `data-navigate-to` links
- [ ] Test form submission navigation
- [ ] Test modal close navigation
- [ ] Test back button functionality

---

## 8. Migration Notes

### Backend Style: Path-Based Router Functions

**Current Pattern:**

- Functions use `event.path.replace("/.netlify/functions/<name>", "")` to extract sub-paths
- Switch-case or if-else chains route to handlers
- `baseHandler` utility provides middleware (auth, rate limiting, CORS)

**Example Implementation:**

```javascript
// netlify/functions/dashboard.cjs
const { baseHandler } = require("./utils/base-handler.cjs");
const { createSuccessResponse } = require("./utils/error-handler.cjs");

async function getTrainingCalendar(userId) {
  // Implementation
}

async function getTeamChemistry(userId) {
  // Implementation
}

exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "dashboard",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    handler: async (event, context, { userId }) => {
      const path = event.path.replace("/.netlify/functions/dashboard", "");

      if (path.includes("/training-calendar")) {
        const data = await getTrainingCalendar(userId);
        return createSuccessResponse(data);
      } else if (path.includes("/team-chemistry")) {
        const data = await getTeamChemistry(userId);
        return createSuccessResponse(data);
      } else {
        return createErrorResponse("Endpoint not found", 404);
      }
    },
  });
};
```

---

## 9. Quick Reference: Route Table

### UI Routes (Angular)

```
/ → LandingComponent
/login → LoginComponent
/register → RegisterComponent
/reset-password → ResetPasswordComponent
/verify-email → VerifyEmailComponent
/accept-invitation → AcceptInvitationComponent
/onboarding → OnboardingComponent
/dashboard → DashboardComponent (authGuard)
/training → TrainingComponent (authGuard)
/workout → WorkoutComponent (authGuard)
/exercise-library → ExerciseLibraryComponent (authGuard)
/training/schedule → TrainingScheduleComponent (authGuard)
/training/qb/schedule → QbTrainingScheduleComponent (authGuard, roleGuard)
/training/qb/throwing → QbThrowingTrackerComponent (authGuard, roleGuard)
/training/qb/assessment → QbAssessmentToolsComponent (authGuard, roleGuard)
/training/ai-scheduler → AiTrainingSchedulerComponent (authGuard)
/analytics → AnalyticsComponent (authGuard)
/analytics/enhanced → EnhancedAnalyticsComponent (authGuard)
/performance-tracking → PerformanceTrackingComponent (authGuard)
/roster → RosterComponent (authGuard)
/team/create → TeamCreateComponent (authGuard)
/coach → CoachComponent (authGuard)
/coach/dashboard → CoachDashboardComponent (authGuard, roleGuard)
/game-tracker → GameTrackerComponent (authGuard)
/tournaments → TournamentsComponent (authGuard)
/wellness → WellnessComponent (authGuard)
/acwr → AcwrDashboardComponent (authGuard)
/community → CommunityComponent (authGuard)
/chat → ChatComponent (authGuard)
/profile → ProfileComponent (authGuard)
/settings → SettingsComponent (authGuard)
```

### API Routes (Netlify Functions)

```
/api/dashboard/* → dashboard.cjs
/api/training/* → training.cjs (or training-stats.cjs, etc.)
/api/analytics/* → analytics.cjs
/api/community/* → community.cjs
/api/tournaments/* → tournaments.cjs
/api/coach/* → coach.cjs
/api/player-stats/* → player-stats.cjs
/api/training-plan → training-plan.cjs
/api/wellness/* → wellness.cjs
/api/supplements/* → supplements.cjs
/api/algorithms/* → algorithms.cjs
/api/games/* → games.cjs
/api/performance-data/* → performance-data.cjs
```

---

**Document Status:** ✅ Ready for Developer Handover  
**Next Review:** After Phase 1 completion
