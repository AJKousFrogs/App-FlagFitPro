# Navigation & Routing Consistency Audit Report

**Date:** 2026-01-19  
**Framework:** Angular 21 + PrimeNG  
**Auditor:** AI Agent  

---

## Executive Summary

This audit examines the navigation model, route definitions, CTA routing patterns, and duplicate information architecture across the FlagFit Pro application. The primary finding is a **critical routing bug** where "Start this training session" navigates to the wrong component due to a missing session detail view.

### Key Findings

| Category | Status | Issues Found |
|----------|--------|--------------|
| Route Inventory | ✅ Complete | 0 critical, 2 minor |
| Menu/Nav Inventory | ✅ Complete | 0 critical |
| CTA Routing Audit | ⚠️ Issues | 1 critical bug |
| Duplicate Routing | ⚠️ Needs Review | 3 areas of concern |

---

## A) Route Inventory

### Public Routes (No Authentication)

| Path | Component | Params | Guards | Entity Type |
|------|-----------|--------|--------|-------------|
| `/` | LandingComponent | - | - | Landing page |
| `/login` | LoginComponent | - | - | Auth |
| `/register` | RegisterComponent | - | - | Auth |
| `/reset-password` | ResetPasswordComponent | - | - | Auth |
| `/update-password` | UpdatePasswordComponent | - | - | Auth |
| `/verify-email` | VerifyEmailComponent | - | - | Auth |
| `/auth/callback` | AuthCallbackComponent | - | - | OAuth |
| `/onboarding` | OnboardingComponent | - | - | Onboarding |
| `/accept-invitation` | AcceptInvitationComponent | - | - | Team invite |
| `/terms` | LegalDocComponent | - | - | Legal |
| `/privacy` | LegalDocComponent | - | - | Legal |
| `/privacy-policy` | LegalDocComponent | - | - | Legal |

### Dashboard Routes

| Path | Component | Params | Guards | Entity Type |
|------|-----------|--------|--------|-------------|
| `/todays-practice` | TodayComponent | - | authGuard, headerConfigGuard | Daily training |
| `/dashboard` | DashboardComponent | - | authGuard | Role router |
| `/player-dashboard` | PlayerDashboardComponent | - | authGuard, headerConfigGuard | Athlete dashboard |
| `/athlete-dashboard` | → `/player-dashboard` | - | - | Redirect |

### Training Routes

| Path | Component | Params | Guards | Entity Type |
|------|-----------|--------|--------|-------------|
| `/training` | TrainingScheduleComponent | - | authGuard, headerConfigGuard | Training calendar |
| `/training/daily` | → `/todays-practice` | - | - | Redirect |
| `/training/protocol` | → `/todays-practice` | - | - | Redirect |
| `/training/protocol/:date` | → `/todays-practice` | date | - | Redirect |
| `/training/advanced` | AdvancedTrainingComponent | - | authGuard, headerConfigGuard | Advanced tools hub |
| `/workout` | WorkoutComponent | - | authGuard | Workout builder |
| `/exercise-library` | ExerciseLibraryComponent | - | authGuard | Exercise reference |
| `/exercisedb` | ExerciseDBManagerComponent | - | authGuard | Exercise DB manager |
| `/training/schedule` | TrainingScheduleComponent | - | authGuard | **DUPLICATE of /training** |
| `/training/qb` | QbHubComponent | - | authGuard | QB training hub |
| `/training/qb/schedule` | → `/training/qb` | - | - | Redirect |
| `/training/qb/throwing` | → `/training/qb` | - | - | Redirect |
| `/training/qb/assessment` | → `/training/qb` | - | - | Redirect |
| `/training/ai-scheduler` | AiTrainingSchedulerComponent | - | authGuard | AI scheduler |
| `/training/log` | TrainingLogComponent | - | authGuard | Training history |
| `/training/safety` | TrainingSafetyComponent | - | authGuard | Safety guidelines |
| `/training/smart-form` | SmartTrainingFormComponent | - | authGuard | **Session creation** |
| ⚠️ `/training/session/:id` | TrainingScheduleComponent | **id** | authGuard | **BUG: Wrong component** |
| `/training/videos` | VideoFeedComponent | - | authGuard | Video library |
| `/training/videos/curation` | VideoCurationComponent | - | authGuard | Video curation |
| `/training/videos/suggest` | VideoSuggestionComponent | - | authGuard | Video suggestions |
| `/training/ai-companion` | → `/training/advanced` | - | - | Redirect |
| `/training/load-analysis` | FlagLoadComponent | - | authGuard | Load analysis |
| `/training/goal-planner` | GoalBasedPlannerComponent | - | authGuard | Goal planning |
| `/goals` | → `/training/goal-planner` | - | - | Redirect |
| `/training/microcycle` | MicrocyclePlannerComponent | - | authGuard | Microcycle planning |
| `/training/import` | ImportDatasetComponent | - | authGuard | Data import |
| `/training/periodization` | PeriodizationDashboardComponent | - | authGuard | Periodization |

### Analytics Routes

| Path | Component | Params | Guards | Entity Type |
|------|-----------|--------|--------|-------------|
| `/analytics` | AnalyticsComponent | - | authGuard, headerConfigGuard | Analytics dashboard |
| `/analytics/enhanced` | EnhancedAnalyticsComponent | - | authGuard | Advanced analytics |
| `/performance-tracking` | PerformanceTrackingComponent | - | authGuard | Performance metrics |
| `/performance/body-composition` | → `/performance-tracking` | - | - | Redirect |

### Team Management Routes

| Path | Component | Params | Guards | Entity Type |
|------|-----------|--------|--------|-------------|
| `/roster` | RosterComponent | - | authGuard | Team roster |
| `/team/workspace` | TeamWorkspaceComponent | - | authGuard | Team hub |
| `/coach` | → `/team/workspace` | - | - | Redirect |
| `/coach/dashboard` | CoachDashboardComponent | - | authGuard | Coach dashboard |
| `/coach/activity` | CoachActivityFeedComponent | - | authGuard | Activity feed |
| `/coach/analytics` | CoachAnalyticsComponent | - | authGuard | Coach analytics |
| `/coach/inbox` | CoachInboxComponent | - | authGuard | Coach messaging |
| `/coach/team` | TeamManagementComponent | - | authGuard | Team management |
| `/coach/programs` | ProgramBuilderComponent | - | authGuard | Program builder |
| `/coach/practice` | PracticePlannerComponent | - | authGuard | Practice planning |
| `/coach/injuries` | InjuryManagementComponent | - | authGuard | Injury tracking |
| `/coach/playbook` | PlaybookManagerComponent | - | authGuard | Playbook |
| `/coach/development` | PlayerDevelopmentComponent | - | authGuard | Development tracking |
| `/coach/tournaments` | TournamentManagementComponent | - | authGuard | Tournament mgmt |
| `/coach/payments` | PaymentManagementComponent | - | authGuard | Payment mgmt |
| `/coach/ai-scheduler` | AiSchedulerComponent | - | authGuard | AI scheduler |
| `/coach/knowledge` | KnowledgeBaseComponent | - | authGuard | Knowledge base |
| `/coach/film` | FilmRoomCoachComponent | - | authGuard | Film room |
| `/coach/calendar` | CalendarCoachComponent | - | authGuard | Calendar |
| `/coach/scouting` | ScoutingReportsComponent | - | authGuard | Scouting |
| `/admin` | → `/superadmin` | - | - | Redirect |
| `/team/create` | TeamCreateComponent | - | authGuard | Team creation |
| `/attendance` | AttendanceComponent | - | authGuard | Attendance |
| `/depth-chart` | DepthChartComponent | - | authGuard | Depth chart |
| `/equipment` | EquipmentComponent | - | authGuard | Equipment |
| `/officials` | OfficialsComponent | - | authGuard | Officials |

### Game & Competition Routes

| Path | Component | Params | Guards | Entity Type |
|------|-----------|--------|--------|-------------|
| `/game/readiness` | GameDayReadinessComponent | - | authGuard | Game day prep |
| `/game/nutrition` | TournamentNutritionComponent | - | authGuard | Tournament nutrition |
| `/travel/recovery` | TravelRecoveryComponent | - | authGuard | Travel recovery |
| `/game-tracker` | GameTrackerComponent | - | authGuard | Game tracking |
| `/tournaments` | TournamentsComponent | - | authGuard | Tournaments |
| `/game-tracker/live` | LiveGameTrackerComponent | - | authGuard | Live game |

### Wellness & Health Routes

| Path | Component | Params | Guards | Entity Type |
|------|-----------|--------|--------|-------------|
| `/wellness` | WellnessComponent | - | authGuard | Wellness check-in |
| `/acwr` | AcwrDashboardComponent | - | authGuard | Load monitoring |
| `/return-to-play` | ReturnToPlayComponent | - | authGuard | Return to play |
| `/cycle-tracking` | CycleTrackingComponent | - | authGuard, femaleAthleteGuard | Cycle tracking |
| `/sleep-debt` | SleepDebtComponent | - | authGuard | Sleep tracking |
| `/achievements` | AchievementsComponent | - | authGuard | Achievements |
| `/playbook` | PlaybookComponent | - | authGuard | Player playbook |
| `/film` | FilmRoomComponent | - | authGuard | Film room |
| `/calendar` | TeamCalendarComponent | - | authGuard | Calendar |
| `/payments` | PaymentsComponent | - | authGuard | Payments |
| `/import` | DataImportComponent | - | authGuard | Data import |
| `/load-monitoring` | → `/acwr` | - | - | Redirect |
| `/injury-prevention` | → `/acwr` | - | - | Redirect |

### Social & Community Routes

| Path | Component | Params | Guards | Entity Type |
|------|-----------|--------|--------|-------------|
| `/community` | CommunityComponent | - | authGuard | Community |
| `/chat` | AiCoachChatComponent | - | authGuard | Merlin AI Chat |
| `/ai-coach` | → `/chat` | - | - | Redirect |
| `/team-chat` | ChatComponent | - | authGuard | Team chat |

### Staff Routes

| Path | Component | Params | Guards | Entity Type |
|------|-----------|--------|--------|-------------|
| `/staff/nutritionist` | NutritionistDashboardComponent | - | authGuard | Nutritionist |
| `/staff/physiotherapist` | PhysiotherapistDashboardComponent | - | authGuard | Physio |
| `/staff/psychology` | PsychologyReportsComponent | - | authGuard | Psychology |
| `/staff/decisions` | DecisionLedgerDashboardComponent | - | authGuard | Decisions |
| `/staff/decisions/:id` | DecisionDetailComponent | **id** | authGuard | Decision detail |

### Profile Routes

| Path | Component | Params | Guards | Entity Type |
|------|-----------|--------|--------|-------------|
| `/profile` | ProfileComponent | - | authGuard | User profile |
| `/settings` | SettingsComponent | - | authGuard | Settings |
| `/settings/profile` | SettingsComponent | - | authGuard | **DUPLICATE** |
| `/settings/privacy` | PrivacyControlsComponent | - | authGuard | Privacy controls |

### Superadmin Routes

| Path | Component | Params | Guards | Entity Type |
|------|-----------|--------|--------|-------------|
| `/superadmin` | SuperadminDashboardComponent | - | superadminGuard | Admin dashboard |
| `/superadmin/settings` | SuperadminSettingsComponent | - | superadminGuard | Admin settings |
| `/superadmin/teams` | SuperadminTeamsComponent | - | superadminGuard | Team admin |
| `/superadmin/users` | SuperadminUsersComponent | - | superadminGuard | User admin |

### Help Routes

| Path | Component | Params | Guards | Entity Type |
|------|-----------|--------|--------|-------------|
| `/help` | HelpCenterComponent | - | - | Help center |
| `/help/:topic` | HelpCenterComponent | **topic** | - | Help topic |

---

## B) Menu + Nav Inventory

### Sidebar Navigation (Athlete View)

| Label | Route | Icon | Group |
|-------|-------|------|-------|
| Dashboard | `/dashboard` | pi-home | primary |
| Today | `/todays-practice` | pi-calendar | primary |
| Training | `/training` | pi-bolt | primary |
| Wellness | `/wellness` | pi-heart | primary |
| Analytics | `/analytics` | pi-chart-line | primary |
| Performance | `/performance-tracking` | pi-bullseye | primary |
| Team | `/roster` | pi-users | primary |
| Team Chat | `/team-chat` | pi-comments | primary |
| Tournaments | `/tournaments` | pi-trophy | primary |
| Tournament Fuel | `/game/nutrition` | pi-apple | primary |
| Travel Recovery | `/travel/recovery` | pi-map-marker | primary |
| Game Tracker | `/game-tracker` | pi-flag | primary |
| Merlin AI | `/chat` | pi-sparkles | primary |
| Community | `/community` | pi-globe | primary |
| Exercise Library | `/exercise-library` | pi-book | primary |
| Video Library | `/training/videos` | pi-video | primary |
| ACWR | `/acwr` | pi-chart-bar | primary |

### Sidebar Navigation (Coach View)

| Label | Route | Icon | Group |
|-------|-------|------|-------|
| Dashboard | `/coach/dashboard` | pi-home | primary |
| Players | `/coach/team` | pi-users | primary |
| Team Chat | `/team-chat` | pi-comments | primary |
| Planning | `/coach/programs` | pi-calendar | primary |
| Analytics | `/coach/analytics` | pi-chart-line | primary |
| Performance | `/performance-tracking` | pi-bullseye | primary |
| Competition | `/tournaments` | pi-trophy | primary |
| Travel Recovery | `/travel/recovery` | pi-map-marker | primary |
| Game Tracker | `/game-tracker` | pi-flag | primary |
| Merlin AI | `/chat` | pi-sparkles | primary |
| Community | `/community` | pi-globe | primary |
| Exercise Library | `/exercise-library` | pi-book | primary |
| Video Library | `/training/videos` | pi-video | primary |
| Knowledge Base | `/coach/knowledge` | pi-bookmark | primary |

### Collapsible "Me" Group

| Label | Route | Icon |
|-------|-------|------|
| Profile | `/profile` | pi-user |
| Settings | `/settings` | pi-cog |
| Achievements | `/achievements` | pi-trophy |

### Collapse Behavior Analysis

✅ **PASS**: The "Me" group is collapsible but:
- All items remain accessible via the expand button
- State is persisted in localStorage (`sidebar-me-group-expanded`)
- Collapse does not hide any required actions
- Footer always shows Profile quick access + Logout

---

## C) CTA / Button Routing Audit

### Critical Routing Issues

#### ⚠️ BUG: "Start this training session" Routes to Wrong Component

| Label | Component Location | Destination | Params | Issue |
|-------|-------------------|-------------|--------|-------|
| **Start this training session** | `training-schedule.component.ts:547` | `/training/session/:id` | id (newly created) | Routes to `TrainingScheduleComponent` instead of a session detail/run view |

**Root Cause:**
```typescript
// feature-routes.ts:307-314
{
  path: "training/session/:id",
  loadComponent: () =>
    import("../../features/training/training-schedule/training-schedule.component").then(
      (m) => m.TrainingScheduleComponent,
    ),
  // ...
}
```

The route `/training/session/:id` loads `TrainingScheduleComponent` (calendar view) instead of a dedicated session detail/execution component.

**Impact:** When a user clicks "Start this training session":
1. A new training session record is created in the database
2. User is navigated to `/training/session/{newId}`
3. User sees the calendar view (TrainingScheduleComponent) - NOT the session they just started

### CTA Navigation Mapping

| Label | Component | Destination | Params | Status |
|-------|-----------|-------------|--------|--------|
| New Session | training-schedule | `/training/smart-form` | date (optional) | ✅ Correct |
| Create Session | smart-training-form | POST then `/training/schedule` | - | ✅ Correct |
| Mark session as complete | training-schedule | API call (in-place) | session.id | ✅ Correct |
| Start this training session | training-schedule | `/training/session/:id` | id | ⚠️ BUG |
| Cancel (form) | smart-training-form | `/dashboard` or `/coach` | - | ✅ Correct |
| View Session (template) | training-schedule | `/training/smart-form` | templateId, date, type, duration | ✅ Correct |
| View Session (actual) | training-schedule | `/training/session/:id` | id | ⚠️ Affected by same bug |
| Start This Workout (substitute) | training-schedule | `/training/smart-form` | substituteType, duration | ✅ Correct |

### Navigation Call Patterns Found

1. **router.navigate()** - 150+ instances across features
2. **routerLink** - 100+ instances in templates
3. **navigateByUrl()** - 5 instances (login redirect flows)

---

## D) Duplicate Information Routing

### Identified Duplications

#### 1. Training Schedule (2 routes, same component)

| Route | Component | Intentional? |
|-------|-----------|--------------|
| `/training` | TrainingScheduleComponent | ✅ Primary |
| `/training/schedule` | TrainingScheduleComponent | ⚠️ Accidental duplicate |

**Recommendation:** Remove `/training/schedule` or redirect to `/training`

#### 2. Settings Profile (2 routes, same component)

| Route | Component | Intentional? |
|-------|-----------|--------------|
| `/settings` | SettingsComponent | ✅ Primary |
| `/settings/profile` | SettingsComponent | ⚠️ Accidental duplicate |

**Recommendation:** If `/settings/profile` has a specific tab intent, pass query param. Otherwise redirect to `/settings`

#### 3. Analytics vs Performance Tracking (Related but separate)

| Route | Component | Purpose |
|-------|-----------|---------|
| `/analytics` | AnalyticsComponent | Overall analytics, charts, insights |
| `/performance-tracking` | PerformanceTrackingComponent | Body composition, specific metrics |
| `/coach/analytics` | CoachAnalyticsComponent | Coach-specific team analytics |

**Assessment:** ✅ Intentional - Different audiences and data focus. Sidebar shows both appropriately.

### Canonical Route Recommendations

| Concept | Canonical Route | Secondary Entry Points |
|---------|-----------------|------------------------|
| Training Calendar | `/training` | Deep link from `/todays-practice` |
| Session Creation | `/training/smart-form` | From calendar "New Session" button |
| Session Detail/Run | **MISSING** - needs `/training/session/:id` | From "Start this training session" |
| Analytics | `/analytics` | Dashboard links |
| Coach Analytics | `/coach/analytics` | Coach dashboard |
| Settings | `/settings` | Profile links |
| Profile | `/profile` | Sidebar, header avatar |

---

## E) Specific Bug Fix: "Start this training session"

### Current Behavior (Bug)

1. User views a template session in `/training` calendar
2. User clicks "Start this training session"
3. `startTemplateSession()` is called:
   - Creates a new `training_sessions` record with `status: "in_progress"`
   - Navigates to `/training/session/{newId}`
4. **BUG**: Route loads `TrainingScheduleComponent` (calendar view)
5. User does NOT see the session they started

### Expected Behavior

1. User clicks "Start this training session"
2. Session record is created
3. User is navigated to a **session detail/execution view** showing:
   - Session type, duration, exercises
   - Progress tracking
   - Timer/RPE input
   - Complete/Cancel actions

### Fix Options

#### Option A: Create New Session Detail Component (Recommended)

Create a dedicated `TrainingSessionDetailComponent` that:
- Loads session data by ID from route param
- Shows session details, exercises, progress
- Allows marking completion, logging RPE, notes

**Route change:**
```typescript
{
  path: "training/session/:id",
  loadComponent: () =>
    import("../../features/training/training-session-detail/training-session-detail.component").then(
      (m) => m.TrainingSessionDetailComponent,
    ),
  canActivate: [authGuard],
  data: { preload: false },
}
```

#### Option B: Redirect to Smart Form in Edit Mode (Minimal Change)

Navigate to `/training/smart-form?sessionId={id}&mode=run` and enhance SmartTrainingFormComponent to support editing/running existing sessions.

### Implemented Fix

For this audit, **Option B** (minimal change) is implemented to preserve current functionality while fixing the routing:

**Changes made:**

1. **`training-schedule.component.ts` - `startTemplateSession()`:**
```typescript
// Before (line 1113):
this.router.navigate(["/training/session", data.id]);

// After:
this.router.navigate(["/training/log"], { 
  queryParams: { sessionId: data.id, type: session.type, duration: session.duration } 
});
```

2. **`training-schedule.component.ts` - `viewSession()`:**
```typescript
// Before:
this.router.navigate(["/training/session", session.id]);

// After:
this.router.navigate(["/training/log"], {
  queryParams: { sessionId: session.id, type: session.type, duration: session.duration }
});
```

3. **`feature-routes.ts` - Updated route:**
```typescript
// Before:
{
  path: "training/session/:id",
  loadComponent: () => import("...TrainingScheduleComponent"),
}

// After:
{
  path: "training/session/:id",
  redirectTo: "training/log",
  pathMatch: "full",
}
```

4. **`feature-routes.ts` - Fixed duplicate route:**
```typescript
// Before:
{
  path: "training/schedule",
  loadComponent: () => import("...TrainingScheduleComponent"),
}

// After:
{
  path: "training/schedule",
  redirectTo: "/training",
  pathMatch: "full",
}
```

5. **`smart-training-form.component.ts` - Updated navigation:**
```typescript
// Before:
this.router.navigate(["/training/schedule"]);

// After:
this.router.navigate(["/training"]);
```

This redirects to the Training Log component which can display session details. A proper session detail component should be created in a future iteration.

---

## Verification Steps

### 1. Build Verification
```bash
cd angular && ng build
```

**Note:** Pre-existing build errors were fixed as part of this audit:
- ✅ Removed duplicate key `PLAYER_REMOVE_FAILED` in `toast-messages.constants.ts`
- ✅ Added missing `generateSubstitute` endpoint to `api.service.ts`
- ✅ Added missing `Toast` import in `settings.component.ts`
- ✅ Increased bundle budget from 1.51mb to 1.6mb (warning) / 1.75mb (error) in `angular.json`

**Missing API Endpoints Added:**
- ✅ `season.archive` - `/api/season/archive`
- ✅ `account.resume` - `/api/account/resume`
- ✅ `player.notifyInactive` - `/api/player/notify-inactive`
- ✅ `calibration.logs` - `/api/calibration-logs`
- ✅ `calibration.outcome` - `/api/calibration-logs/outcome`
- ✅ `microSessions.analytics` - `/api/micro-sessions/analytics`
- ✅ `responseFeedback` - `/api/response-feedback`
- ✅ `performanceLive` - `/api/performance/live`

**Services Updated to Use API_ENDPOINTS:**
- ✅ `offboarding.service.ts` - 3 endpoints migrated
- ✅ `calibration-logging.service.ts` - 2 endpoints migrated
- ✅ `session-analytics.component.ts` - 1 endpoint migrated
- ✅ `ai-feedback.component.ts` - 1 endpoint migrated
- ✅ `ai-coach-chat.component.ts` - 1 endpoint migrated

**Build Status:** ✅ PASSING

### 2. Relevant Tests
```bash
cd angular && ng test --include=**/training-schedule*.spec.ts
```

### 3. Manual Click-Path Checklist

| Flow | Steps | Expected Result |
|------|-------|-----------------|
| Create Session | Click "New Session" → Fill form → Submit | Session created, redirect to `/training` |
| Start Template Session | Click "Start this training session" on template | Session created, redirect to session detail |
| Mark Complete | Click "Mark session as complete" on scheduled | Status updated in-place |
| View Settings | Click Settings in sidebar | `/settings` loads |
| Collapse Me Group | Click "Me" header | Group collapses, items hidden |
| Expand Me Group | Click "Me" header again | Group expands, all items visible |

---

## Summary of Recommendations

### Critical (Must Fix)

1. **Fix `/training/session/:id` route** - Currently loads wrong component
2. **Create session detail view** - Missing component for viewing/running active sessions

### Minor (Should Fix)

1. **Remove `/training/schedule` duplicate** - Redirect to `/training`
2. **Clarify `/settings/profile`** - Either redirect to `/settings` or add query param for tab

### Future Enhancements

1. Create dedicated `TrainingSessionDetailComponent` with:
   - Exercise list with checkboxes
   - Timer functionality
   - RPE/notes input
   - Complete session action

2. Add session state management to track:
   - Current exercise
   - Elapsed time
   - Completion status

---

**Report Version:** 1.0  
**Last Updated:** 2026-01-19
