# API Routing Audit Report

**Date:** January 11, 2026  
**Auditor:** AI Assistant  
**Status:** Completed with fixes applied

---

## Executive Summary

A comprehensive audit was performed on the Angular application's routing configuration and API connections. Several missing Netlify function redirects were identified and fixed.

---

## 1. Angular Routing Tree

### Public Routes (No Auth Required)
| Path | Component | Status |
|------|-----------|--------|
| `/` | LandingComponent | ✅ OK |
| `/login` | LoginComponent | ✅ OK |
| `/register` | RegisterComponent | ✅ OK |
| `/reset-password` | ResetPasswordComponent | ✅ OK |
| `/update-password` | UpdatePasswordComponent | ✅ OK |
| `/verify-email` | VerifyEmailComponent | ✅ OK |
| `/auth/callback` | AuthCallbackComponent | ✅ OK |
| `/onboarding` | OnboardingComponent | ✅ OK |
| `/accept-invitation` | AcceptInvitationComponent | ✅ OK |
| `/help` | HelpCenterComponent | ✅ OK |
| `/help/:topic` | HelpCenterComponent | ✅ OK |

### Dashboard Routes (Auth Required)
| Path | Component | Guard | Status |
|------|-----------|-------|--------|
| `/todays-practice` | TodayComponent | authGuard, headerConfigGuard | ✅ OK |
| `/dashboard` | DashboardComponent | authGuard | ✅ OK |
| `/player-dashboard` | PlayerDashboardComponent | authGuard, headerConfigGuard | ✅ OK |
| `/athlete-dashboard` | → redirects to `/player-dashboard` | - | ✅ OK |

### Training Routes (Auth Required)
| Path | Component | Status |
|------|-----------|--------|
| `/training` | TrainingScheduleComponent | ✅ OK |
| `/training/daily` | → redirects to `/todays-practice` | ✅ OK |
| `/training/protocol` | → redirects to `/todays-practice` | ✅ OK |
| `/training/protocol/:date` | → redirects to `/todays-practice` | ✅ OK |
| `/training/advanced` | AdvancedTrainingComponent | ✅ OK |
| `/workout` | WorkoutComponent | ✅ OK |
| `/exercise-library` | ExerciseLibraryComponent | ✅ OK |
| `/exercisedb` | ExerciseDBManagerComponent | ✅ OK |
| `/training/schedule` | TrainingScheduleComponent | ✅ OK |
| `/training/qb` | QbHubComponent | ✅ OK |
| `/training/ai-scheduler` | AiTrainingSchedulerComponent | ✅ OK |
| `/training/log` | TrainingLogComponent | ✅ OK |
| `/training/safety` | TrainingSafetyComponent | ✅ OK |
| `/training/smart-form` | SmartTrainingFormComponent | ✅ OK |
| `/training/session/:id` | TrainingScheduleComponent | ✅ OK |
| `/training/videos` | VideoFeedComponent | ✅ OK |
| `/training/videos/curation` | VideoCurationComponent | ✅ OK |
| `/training/videos/suggest` | VideoSuggestionComponent | ✅ OK |
| `/training/ai-companion` | → redirects to `/training/advanced` | ✅ OK |
| `/training/load-analysis` | FlagLoadComponent | ✅ OK |
| `/training/goal-planner` | GoalBasedPlannerComponent | ✅ OK |
| `/training/microcycle` | MicrocyclePlannerComponent | ✅ OK |
| `/training/import` | ImportDatasetComponent | ✅ OK |
| `/training/periodization` | PeriodizationDashboardComponent | ✅ OK |

### Other Protected Routes
- Analytics: `/analytics`, `/analytics/enhanced`, `/performance-tracking`
- Team: `/roster`, `/team/workspace`, `/coach/*`, `/admin`, `/attendance`, `/depth-chart`, `/equipment`, `/officials`
- Game: `/game/readiness`, `/game/nutrition`, `/travel/recovery`, `/game-tracker`, `/game-tracker/live`, `/tournaments`
- Wellness: `/wellness`, `/acwr`, `/return-to-play`, `/cycle-tracking`, `/sleep-debt`, `/achievements`
- Social: `/community`, `/chat`, `/ai-coach`, `/team-chat`
- Staff: `/staff/nutritionist`, `/staff/physiotherapist`, `/staff/psychology`, `/staff/decisions`
- Profile: `/profile`, `/settings`, `/settings/profile`, `/settings/privacy`
- Superadmin: `/superadmin`, `/superadmin/settings`, `/superadmin/teams`, `/superadmin/users`

---

## 2. Issues Found and Fixed

### 2.1 Missing Netlify Function Redirects (FIXED)

The following API endpoints were used in the Angular code but had no corresponding redirect rules in `netlify.toml`:

| API Endpoint | Netlify Function | Status |
|-------------|------------------|--------|
| `/api/coach-alerts/*` | `coach-alerts.cjs` | ✅ Added |
| `/api/coach-inbox/*` | `coach-inbox.cjs` | ✅ Added |
| `/api/coach-analytics/*` | `coach-analytics.cjs` | ✅ Added |
| `/api/coach/calendar/*` | `coach.cjs` | ✅ Added |
| `/api/exercisedb/*` | `exercisedb.cjs` | ✅ Added |
| `/api/micro-sessions/*` | `micro-sessions.cjs` | ✅ Added |
| `/api/season/*` | `season-archive.cjs` | ✅ Added |
| `/api/season-reports/*` | `season-reports.cjs` | ✅ Added |
| `/api/account/pause` | `account-pause.cjs` | ✅ Added |
| `/api/account/resume` | `account-pause.cjs` | ✅ Added |
| `/api/account/delete` | `account-deletion.cjs` | ✅ Added |
| `/api/player/notify-inactive` | `inactive-player-notify.cjs` | ✅ Added |
| `/api/film-room/*` | `coach.cjs` | ✅ Added |
| `/api/playbook/*` | `coach.cjs` | ✅ Added |
| `/api/isometrics/*` | `isometrics.cjs` | ✅ Added |
| `/api/plyometrics/*` | `plyometrics.cjs` | ✅ Added |
| `/api/privacy-settings/*` | `privacy-settings.cjs` | ✅ Added |
| `/api/data-export/*` | `data-export.cjs` | ✅ Added |
| `/api/send-email` | `send-email.cjs` | ✅ Added |
| `/api/payments/*` | `payments.cjs` | ✅ Added |
| `/api/sponsors/*` | `sponsors.cjs` | ✅ Added |
| `/api/sponsor-logo/*` | `sponsor-logo.cjs` | ✅ Added |
| `/api/team-templates/*` | `team-templates.cjs` | ✅ Added |
| `/api/response-feedback/*` | `response-feedback.cjs` | ✅ Added |
| `/api/ai-review/*` | `ai-review.cjs` | ✅ Added |

### 2.2 /todays-practice Route

**Status:** ✅ Correctly configured

The `/todays-practice` route is properly configured:
- Defined in `feature-routes.ts` with `authGuard` and `headerConfigGuard`
- Redirects from `/training/daily`, `/training/protocol`, and `/training/protocol/:date` are in place
- SPA fallback (`/* → /index.html`) handles client-side routing

The route should work correctly on Netlify because:
1. No HTML file exists at `/todays-practice`
2. The SPA fallback (`force = false`) allows Angular Router to handle it
3. Auth guard properly waits for Supabase initialization before redirecting

---

## 3. Auth Flow Analysis

### Authentication Guard (`auth.guard.ts`)

The guard correctly:
1. Waits for Supabase initialization via `waitForInit()`
2. Checks both the auth service signal AND Supabase session directly
3. Falls back to a direct Supabase check if no immediate session found
4. Redirects to `/login` with `returnUrl` query parameter if not authenticated

```typescript
// Critical: Wait for Supabase auth to initialize
await supabaseService.waitForInit();

// Check both sources to handle race conditions
let hasSession = !!supabaseService.session();
const isAuthenticated = authService.isAuthenticated();
```

### Potential Race Condition (RESOLVED)

The auth guard has proper handling for the race condition where:
- User refreshes a protected page
- Supabase session exists but hasn't been loaded yet
- Guard would incorrectly redirect to login

**Solution in place:** The guard now:
1. Waits up to 5 seconds for Supabase initialization
2. Falls back to a direct `getSession()` call if signals haven't updated

---

## 4. API Service Configuration

### Base URL Detection (`api.service.ts`)

The API service automatically detects the correct base URL:
- **Netlify (Production):** Uses `window.location.origin`
- **Local Development:** Uses `http://localhost:4000`
- **LAN Development:** Supports local network IPs

### Endpoint Normalization

Endpoints starting with `/api/` are kept as-is for Netlify (redirects handle routing to functions).

---

## 5. Netlify Configuration Summary

### Redirect Order (Critical)
Netlify processes redirects in order. Our configuration:
1. API routes (`/api/*`) → Netlify Functions (status 200, force=true)
2. Legacy HTML redirects (`*.html`) → Angular routes (status 301)
3. SPA fallback (`/*`) → `/index.html` (status 200, force=false)

### Key Points
- `force = true` on API routes ensures they're always routed to functions
- `force = false` on SPA fallback allows static files to be served directly
- Legacy HTML redirects preserve SEO and bookmarks

---

## 6. Recommendations

### Immediate Actions
1. ✅ Deploy the updated `netlify.toml` with missing API routes
2. Test the `/todays-practice` route after deployment
3. Verify coach alerts acknowledgment works (`/api/coach-alerts`)

### Future Improvements
1. **Consolidate API endpoints**: Some endpoints could be consolidated into fewer functions
2. **Add health checks**: Consider adding `/api/health` endpoint checks in monitoring
3. **Rate limiting**: Ensure all public endpoints have rate limiting enabled
4. **Error logging**: Add structured logging for API failures on Netlify

---

## 7. Files Modified

| File | Changes |
|------|---------|
| `netlify.toml` | Added 26 missing API redirect rules |

---

## 8. Testing Checklist

After deployment, verify these routes work:
- [ ] `/todays-practice` loads without redirect to login (when authenticated)
- [ ] `/api/coach-alerts` endpoint responds
- [ ] `/api/coach-inbox` endpoint responds
- [ ] `/api/exercisedb` endpoint responds
- [ ] `/api/micro-sessions` endpoint responds
- [ ] SPA routing works for all Angular routes
- [ ] API calls from TodayComponent work correctly

---

**End of Audit Report**
