# Comprehensive Routing & API Analysis Report
**Generated:** 2025-01-22  
**Scope:** Complete application routing and API endpoint audit

---

## Executive Summary

This analysis identifies:
- **Missing Routes:** HTML pages without Angular routes or sidebar navigation
- **Broken API Links:** API endpoints without corresponding Netlify functions
- **Missing Button Routing:** Buttons/links without proper navigation handlers
- **Inconsistencies:** Between legacy HTML and Angular implementations

---

## 1. MISSING ROUTES ANALYSIS

### 1.1 HTML Pages Not in Angular Routes

The following HTML pages exist but are **NOT** defined in Angular routes (`angular/src/app/core/routes/feature-routes.ts`):

#### Critical Missing Routes:
1. **`workout.html`** ❌
   - Status: HTML exists, Angular route missing
   - Impact: High - Core training feature
   - Recommendation: Add route to `trainingRoutes`

2. **`exercise-library.html`** ❌
   - Status: HTML exists, Angular route missing
   - Impact: High - Core training feature
   - Recommendation: Add route to `trainingRoutes`

3. **`performance-tracking.html`** ✅
   - Status: HTML exists, Angular route exists
   - Route: `/performance-tracking` in `analyticsRoutes`

4. **`wellness.html`** ✅
   - Status: HTML exists, Angular route exists
   - Route: `/wellness` in `wellnessRoutes`

5. **`coach-dashboard.html`** ⚠️
   - Status: HTML exists, but Angular route is `/coach` (not `/coach-dashboard`)
   - Impact: Medium - Route mismatch
   - Recommendation: Add redirect or update HTML reference

6. **`coach.html`** ✅
   - Status: HTML exists, Angular route exists
   - Route: `/coach` in `teamRoutes`

7. **`game-tracker.html`** ✅
   - Status: HTML exists, Angular route exists
   - Route: `/game-tracker` in `gameRoutes`

8. **`onboarding.html`** ❌
   - Status: HTML exists, Angular route missing
   - Impact: Medium - User onboarding flow
   - Recommendation: Add route to `publicRoutes` or `profileRoutes`

9. **`accept-invitation.html`** ❌
   - Status: HTML exists, Angular route missing
   - Impact: Medium - Team invitation feature
   - Recommendation: Add route to `publicRoutes` or `teamRoutes`

10. **`verify-email.html`** ❌
    - Status: HTML exists, Angular route missing
    - Impact: Medium - Email verification flow
    - Recommendation: Add route to `publicRoutes`

11. **`reset-password.html`** ✅
    - Status: HTML exists, Angular route exists
    - Route: `/reset-password` in `publicRoutes`

12. **`team-create.html`** ❌
    - Status: HTML exists, Angular route missing
    - Impact: Medium - Team creation feature
    - Recommendation: Add route to `teamRoutes`

13. **`update-roster-data.html`** ❌
    - Status: HTML exists, Angular route missing
    - Impact: Low - Admin/utility page
    - Recommendation: Add route or remove if deprecated

14. **`qb-training-schedule.html`** ❌
    - Status: HTML exists, Angular route missing
    - Impact: Medium - QB-specific feature
    - Recommendation: Add route to `trainingRoutes` or create QB-specific routes

15. **`qb-throwing-tracker.html`** ❌
    - Status: HTML exists, Angular route missing
    - Impact: Medium - QB-specific feature
    - Recommendation: Add route to `trainingRoutes` or create QB-specific routes

16. **`qb-assessment-tools.html`** ❌
    - Status: HTML exists, Angular route missing
    - Impact: Medium - QB-specific feature
    - Recommendation: Add route to `trainingRoutes` or create QB-specific routes

17. **`ai-training-scheduler.html`** ❌
    - Status: HTML exists, Angular route missing
    - Impact: Medium - AI feature
    - Recommendation: Add route to `trainingRoutes`

18. **`analytics-dashboard.html`** ⚠️
    - Status: HTML exists, but Angular route is `/analytics` (not `/analytics-dashboard`)
    - Impact: Low - Route mismatch
    - Recommendation: Add redirect or consolidate

19. **`enhanced-analytics.html`** ❌
    - Status: HTML exists, Angular route missing
    - Impact: Medium - Enhanced analytics feature
    - Recommendation: Add route or merge with `/analytics`

20. **`training-schedule.html`** ❌
    - Status: HTML exists, Angular route missing
    - Impact: Medium - Training scheduling feature
    - Recommendation: Add route to `trainingRoutes`

21. **`clear-cache.html`** ❌
    - Status: HTML exists, Angular route missing
    - Impact: Low - Utility/debug page
    - Recommendation: Add route or remove if deprecated

22. **`test-icons.html`** ❌
    - Status: HTML exists, Angular route missing
    - Impact: Low - Test/development page
    - Recommendation: Remove or add to dev-only routes

23. **`component-library.html`** ❌
    - Status: HTML exists, Angular route missing
    - Impact: Low - Documentation/design system page
    - Recommendation: Add route or keep as static documentation

### 1.2 HTML Pages Not in Sidebar Navigation

The following pages exist but are **NOT** linked in the sidebar (`src/unified-sidebar.html`):

1. **`workout.html`** - Should be accessible from training page
2. **`exercise-library.html`** - Should be accessible from training page
3. **`performance-tracking.html`** - Should be accessible from analytics page
4. **`wellness.html`** - Should be accessible from dashboard or separate wellness section
5. **`coach-dashboard.html`** - Should be accessible for coaches
6. **`game-tracker.html`** - Should be accessible from tournaments or separate section
7. **`onboarding.html`** - First-time user flow (not in sidebar)
8. **`accept-invitation.html`** - Invitation flow (not in sidebar)
9. **`verify-email.html`** - Email verification (not in sidebar)
10. **`team-create.html`** - Team creation (not in sidebar)
11. **`qb-training-schedule.html`** - QB-specific (not in sidebar)
12. **`qb-throwing-tracker.html`** - QB-specific (not in sidebar)
13. **`qb-assessment-tools.html`** - QB-specific (not in sidebar)
14. **`ai-training-scheduler.html`** - AI feature (not in sidebar)
15. **`training-schedule.html`** - Training scheduling (not in sidebar)

---

## 2. BROKEN API LINKS ANALYSIS

### 2.1 API Endpoints Without Netlify Functions

The following API endpoints are referenced in `src/api-config.js` but **DO NOT** have corresponding Netlify functions:

#### Dashboard Endpoints:
1. **`/api/dashboard/training-calendar`** ❌
   - Referenced in: `API_ENDPOINTS.dashboard.trainingCalendar`
   - Netlify Function: Missing
   - Recommendation: Create `netlify/functions/dashboard-training-calendar.cjs` or handle in `dashboard.cjs`

2. **`/api/dashboard/olympic-qualification`** ❌
   - Referenced in: `API_ENDPOINTS.dashboard.olympicQualification`
   - Netlify Function: Missing
   - Recommendation: Create `netlify/functions/dashboard-olympic-qualification.cjs` or handle in `dashboard.cjs`

3. **`/api/dashboard/sponsor-rewards`** ❌
   - Referenced in: `API_ENDPOINTS.dashboard.sponsorRewards`
   - Netlify Function: Missing
   - Recommendation: Create `netlify/functions/dashboard-sponsor-rewards.cjs` or handle in `dashboard.cjs`

4. **`/api/dashboard/wearables`** ❌
   - Referenced in: `API_ENDPOINTS.dashboard.wearables`
   - Netlify Function: Missing
   - Recommendation: Create `netlify/functions/dashboard-wearables.cjs` or handle in `dashboard.cjs`

5. **`/api/dashboard/team-chemistry`** ❌
   - Referenced in: `API_ENDPOINTS.dashboard.teamChemistry`
   - Netlify Function: Missing
   - Recommendation: Create `netlify/functions/dashboard-team-chemistry.cjs` or handle in `dashboard.cjs`

6. **`/api/dashboard/daily-quote`** ❌
   - Referenced in: `API_ENDPOINTS.dashboard.dailyQuote`
   - Netlify Function: Missing
   - Recommendation: Create `netlify/functions/dashboard-daily-quote.cjs` or handle in `dashboard.cjs`

7. **`/api/dashboard/health`** ❌
   - Referenced in: `API_ENDPOINTS.dashboard.health`
   - Netlify Function: Missing
   - Recommendation: Create `netlify/functions/dashboard-health.cjs` or handle in `dashboard.cjs`

#### Training Endpoints:
8. **`/api/training/stats`** ⚠️
   - Referenced in: `API_ENDPOINTS.training.stats`
   - Netlify Function: `training-stats.cjs` exists
   - Status: Endpoint mismatch - config uses `/api/training/stats` but function is `/training-stats`
   - Recommendation: Update `netlify.toml` redirect or update config

9. **`/api/training/stats-enhanced`** ❌
   - Referenced in: `API_ENDPOINTS.training.statsEnhanced`
   - Netlify Function: `training-stats-enhanced.cjs` exists
   - Status: Endpoint mismatch - config uses `/api/training/stats-enhanced` but function is `/training-stats-enhanced`
   - Recommendation: Update `netlify.toml` redirect or update config

10. **`/api/training/complete`** ⚠️
    - Referenced in: `API_ENDPOINTS.training.complete`
    - Netlify Function: `training-complete.cjs` exists
    - Status: Endpoint mismatch - config uses `/api/training/complete` but function is `/api/training/complete` (redirect exists)
    - Recommendation: Verify redirect works correctly

11. **`/api/training/suggestions`** ⚠️
    - Referenced in: `API_ENDPOINTS.training.suggestions`
    - Netlify Function: `training-suggestions.cjs` exists
    - Status: Endpoint mismatch - config uses `/api/training/suggestions` but function is `/api/training/suggestions` (redirect exists)
    - Recommendation: Verify redirect works correctly

#### Analytics Endpoints:
12. **`/api/analytics/performance-trends`** ⚠️
    - Referenced in: `API_ENDPOINTS.analytics.performanceTrends`
    - Netlify Function: `analytics.cjs` exists (handles all analytics routes)
    - Status: Should work via redirect in `netlify.toml`
    - Recommendation: Verify redirect works correctly

13. **`/api/analytics/team-chemistry`** ⚠️
    - Referenced in: `API_ENDPOINTS.analytics.teamChemistry`
    - Netlify Function: `analytics.cjs` exists
    - Status: Should work via redirect
    - Recommendation: Verify redirect works correctly

14. **`/api/analytics/training-distribution`** ⚠️
    - Referenced in: `API_ENDPOINTS.analytics.trainingDistribution`
    - Netlify Function: `analytics.cjs` exists
    - Status: Should work via redirect
    - Recommendation: Verify redirect works correctly

15. **`/api/analytics/position-performance`** ⚠️
    - Referenced in: `API_ENDPOINTS.analytics.positionPerformance`
    - Netlify Function: `analytics.cjs` exists
    - Status: Should work via redirect
    - Recommendation: Verify redirect works correctly

16. **`/api/analytics/injury-risk`** ⚠️
    - Referenced in: `API_ENDPOINTS.analytics.injuryRisk`
    - Netlify Function: `analytics.cjs` exists
    - Status: Should work via redirect
    - Recommendation: Verify redirect works correctly

17. **`/api/analytics/speed-development`** ⚠️
    - Referenced in: `API_ENDPOINTS.analytics.speedDevelopment`
    - Netlify Function: `analytics.cjs` exists
    - Status: Should work via redirect
    - Recommendation: Verify redirect works correctly

18. **`/api/analytics/user-engagement`** ⚠️
    - Referenced in: `API_ENDPOINTS.analytics.userEngagement`
    - Netlify Function: `analytics.cjs` exists
    - Status: Should work via redirect
    - Recommendation: Verify redirect works correctly

19. **`/api/analytics/summary`** ⚠️
    - Referenced in: `API_ENDPOINTS.analytics.summary`
    - Netlify Function: `analytics.cjs` exists
    - Status: Should work via redirect
    - Recommendation: Verify redirect works correctly

20. **`/api/analytics/health`** ⚠️
    - Referenced in: `API_ENDPOINTS.analytics.health`
    - Netlify Function: `analytics.cjs` exists
    - Status: Should work via redirect
    - Recommendation: Verify redirect works correctly

#### Coach Endpoints:
21. **`/api/coach/dashboard`** ⚠️
    - Referenced in: `API_ENDPOINTS.coach.dashboard`
    - Netlify Function: `coach.cjs` exists
    - Status: Should work via redirect
    - Recommendation: Verify redirect works correctly

22. **`/api/coach/team`** ⚠️
    - Referenced in: `API_ENDPOINTS.coach.team`
    - Netlify Function: `coach.cjs` exists
    - Status: Should work via redirect
    - Recommendation: Verify redirect works correctly

23. **`/api/coach/training-analytics`** ⚠️
    - Referenced in: `API_ENDPOINTS.coach.trainingAnalytics`
    - Netlify Function: `coach.cjs` exists
    - Status: Should work via redirect
    - Recommendation: Verify redirect works correctly

24. **`/api/coach/training-session`** ⚠️
    - Referenced in: `API_ENDPOINTS.coach.createTrainingSession`
    - Netlify Function: `coach.cjs` exists
    - Status: Should work via redirect
    - Recommendation: Verify redirect works correctly

25. **`/api/coach/games`** ⚠️
    - Referenced in: `API_ENDPOINTS.coach.games`
    - Netlify Function: `coach.cjs` exists
    - Status: Should work via redirect
    - Recommendation: Verify redirect works correctly

26. **`/api/coach/health`** ⚠️
    - Referenced in: `API_ENDPOINTS.coach.health`
    - Netlify Function: `coach.cjs` exists
    - Status: Should work via redirect
    - Recommendation: Verify redirect works correctly

#### Community Endpoints:
27. **`/api/community/challenges`** ❌
    - Referenced in: `API_ENDPOINTS.community.challenges`
    - Netlify Function: Missing
    - Recommendation: Add to `community.cjs` or create separate function

28. **`/api/community/health`** ❌
    - Referenced in: `API_ENDPOINTS.community.health`
    - Netlify Function: Missing
    - Recommendation: Add to `community.cjs` or create separate function

#### Tournaments Endpoints:
29. **`/api/tournaments/health`** ❌
    - Referenced in: `API_ENDPOINTS.tournaments.health`
    - Netlify Function: Missing
    - Recommendation: Add to `tournaments.cjs` or create separate function

#### Algorithms Endpoints:
30. **`/api/algorithms/health`** ❌
    - Referenced in: `API_ENDPOINTS.algorithms.health`
    - Netlify Function: Missing
    - Recommendation: Create `netlify/functions/algorithms-health.cjs` or remove from config

#### Wellness Endpoints:
31. **`/api/wellness/checkin`** ❌
    - Referenced in: `API_ENDPOINTS.wellness.checkin`
    - Netlify Function: Missing
    - Recommendation: Create `netlify/functions/wellness-checkin.cjs` or handle in existing wellness function

#### Supplements Endpoints:
32. **`/api/supplements/log`** ❌
    - Referenced in: `API_ENDPOINTS.supplements.log`
    - Netlify Function: Missing
    - Recommendation: Create `netlify/functions/supplements-log.cjs` or handle in `performance-data.cjs`

#### Games Endpoints:
33. **`/games`** ⚠️
    - Referenced in: `API_ENDPOINTS.games.list`
    - Netlify Function: `games.cjs` exists
    - Status: Redirect exists in `netlify.toml`
    - Recommendation: Verify redirect works correctly

34. **`/games/:id`** ⚠️
    - Referenced in: `API_ENDPOINTS.games.get`
    - Netlify Function: `games.cjs` exists
    - Status: Redirect exists
    - Recommendation: Verify redirect works correctly

35. **`/games/:id/stats`** ⚠️
    - Referenced in: `API_ENDPOINTS.games.stats`
    - Netlify Function: `games.cjs` exists
    - Status: Redirect exists
    - Recommendation: Verify redirect works correctly

36. **`/games/:id/plays`** ⚠️
    - Referenced in: `API_ENDPOINTS.games.plays`
    - Netlify Function: `games.cjs` exists
    - Status: Redirect exists
    - Recommendation: Verify redirect works correctly

37. **`/games/:id/player-stats`** ⚠️
    - Referenced in: `API_ENDPOINTS.games.playerStats`
    - Netlify Function: `games.cjs` exists
    - Status: Redirect exists
    - Recommendation: Verify redirect works correctly

#### Player Stats Endpoints:
38. **`/player-stats/aggregated`** ⚠️
    - Referenced in: `API_ENDPOINTS.playerStats.aggregated`
    - Netlify Function: `player-stats.cjs` exists
    - Status: No redirect in `netlify.toml`
    - Recommendation: Add redirect or update config

39. **`/player-stats/date-range`** ⚠️
    - Referenced in: `API_ENDPOINTS.playerStats.dateRange`
    - Netlify Function: `player-stats.cjs` exists
    - Status: No redirect in `netlify.toml`
    - Recommendation: Add redirect or update config

#### Training Plan Endpoints:
40. **`/training-plan`** ⚠️
    - Referenced in: `API_ENDPOINTS.trainingPlan.today`
    - Netlify Function: `training-plan.cjs` exists
    - Status: No redirect in `netlify.toml`
    - Recommendation: Add redirect or update config

### 2.2 Netlify Functions Without API Config References

The following Netlify functions exist but are **NOT** referenced in `src/api-config.js`:

1. **`accept-invitation.cjs`** - Team invitation handling
2. **`admin.cjs`** - Admin endpoints
3. **`auth-reset-password.cjs`** - Password reset (may use Supabase directly)
4. **`cache.cjs`** - Cache management
5. **`fixtures.cjs`** - Fixtures management
6. **`fixtures-refactored.cjs`** - Refactored fixtures
7. **`import-open-data.cjs`** - Open data import
8. **`load-management.cjs`** - Load management
9. **`nutrition.cjs`** - Nutrition tracking
10. **`recovery.cjs`** - Recovery tracking
11. **`send-email.cjs`** - Email sending
12. **`sponsor-logo.cjs`** - Sponsor logo handling
13. **`sponsors.cjs`** - Sponsors management
14. **`team-invite.cjs`** - Team invitations
15. **`test-email.cjs`** - Email testing
16. **`training-metrics-refactored.cjs`** - Refactored training metrics
17. **`update-chatbot-stats.cjs`** - Chatbot stats
18. **`user-context.cjs`** - User context
19. **`user-profile.cjs`** - User profile
20. **`validate-invitation.cjs`** - Invitation validation
21. **`validation.cjs`** - Validation utilities

---

## 3. MISSING BUTTON ROUTING ANALYSIS

### 3.1 Buttons Without Proper Routing

Based on analysis of HTML files and JavaScript event handlers:

#### Dashboard Page (`dashboard.html`):
1. **Wellness Quick Check-in Submit Button** ⚠️
   - Status: Form submission handled, but no navigation after success
   - Recommendation: Add navigation to wellness page or show success message

2. **Quick Action Buttons** ✅
   - Status: Routes defined in `context.service.ts`
   - Routes: `/training`, `/analytics`, `/performance-tracking`, `/roster`
   - Recommendation: Verify all routes work correctly

#### Training Page (`training.html`):
1. **"Start Workout" Buttons** ⚠️
   - Status: Uses `data-action="start-workout"` handler
   - Handler: `window.startWorkout()` function
   - Issue: Need to verify navigation to workout page
   - Recommendation: Ensure `startWorkout()` navigates to `/workout.html` or `/workout`

2. **"View Recovery Protocol" Button** ⚠️
   - Status: Uses `data-action="show-protocol-modal"`
   - Handler: `window.showProtocolModal()` function
   - Issue: Modal may not have proper close/navigation
   - Recommendation: Verify modal navigation works

#### Index/Landing Page (`index.html`):
1. **"Learn more" Links in Features Section** ❌
   - Status: No `href` attribute, only visual
   - Impact: Low - Informational only
   - Recommendation: Add `href` to relevant pages or remove if decorative

#### Game Tracker Page (`game-tracker.html`):
1. **Navigation Buttons** ✅
   - Status: Handlers exist in `game-tracker-page.js`
   - Functions: `showGameSetup()`, `showGamesList()`, `handleEndGame()`
   - Recommendation: Verify all navigation works correctly

### 3.2 Missing Navigation Handlers

The following buttons/links may not have proper event handlers:

1. **Sidebar Navigation Links** ✅
   - Status: Uses standard `href` attributes
   - Recommendation: Consider using Angular Router for SPA navigation

2. **Action Buttons with `data-action`** ⚠️
   - Status: Handlers defined in `src/js/utils/event-handlers.js`
   - Recommendation: Verify all `data-action` handlers are registered

3. **Buttons with `data-navigate-to`** ✅
   - Status: Handlers exist in `event-handlers.js`
   - Function: `initNavigationHandlers()`
   - Recommendation: Ensure this function is called on page load

---

## 4. ROUTE INCONSISTENCIES

### 4.1 Legacy HTML vs Angular Routes

| HTML File | Legacy Route | Angular Route | Status |
|-----------|--------------|---------------|--------|
| `dashboard.html` | `/dashboard.html` | `/dashboard` | ⚠️ Mismatch |
| `analytics.html` | `/analytics.html` | `/analytics` | ⚠️ Mismatch |
| `training.html` | `/training.html` | `/training` | ⚠️ Mismatch |
| `roster.html` | `/roster.html` | `/roster` | ⚠️ Mismatch |
| `tournaments.html` | `/tournaments.html` | `/tournaments` | ⚠️ Mismatch |
| `community.html` | `/community.html` | `/community` | ⚠️ Mismatch |
| `chat.html` | `/chat.html` | `/chat` | ⚠️ Mismatch |
| `settings.html` | `/settings.html` | `/settings` | ⚠️ Mismatch |
| `profile.html` | `/profile.html` | `/profile` | ⚠️ Mismatch |
| `login.html` | `/login.html` | `/login` | ⚠️ Mismatch |
| `register.html` | `/register.html` | `/register` | ⚠️ Mismatch |
| `reset-password.html` | `/reset-password.html` | `/reset-password` | ⚠️ Mismatch |

**Recommendation:** Add redirects in `netlify.toml` for all routes (some already exist).

### 4.2 Sidebar Navigation vs Angular Routes

The sidebar uses `.html` extensions, but Angular routes don't. This is handled by:
- `netlify.toml` redirects (some routes)
- Server-side routing in `server.js`
- Client-side navigation handlers

**Recommendation:** Standardize on Angular routes and update sidebar to use route paths without `.html`.

---

## 5. PRIORITY RECOMMENDATIONS

### 🔴 Critical (Fix Immediately)

1. **Add Missing Angular Routes:**
   - `workout` → `/workout`
   - `exercise-library` → `/exercise-library`
   - `onboarding` → `/onboarding`
   - `verify-email` → `/verify-email`
   - `accept-invitation` → `/accept-invitation`

2. **Create Missing Netlify Functions:**
   - Dashboard sub-endpoints (training-calendar, olympic-qualification, etc.)
   - Community challenges endpoint
   - Wellness checkin endpoint
   - Supplements log endpoint

3. **Fix API Endpoint Mismatches:**
   - Update `netlify.toml` redirects for training stats endpoints
   - Add redirects for player-stats endpoints
   - Add redirects for training-plan endpoints

### 🟡 High Priority (Fix Soon)

1. **Add Missing Routes:**
   - `team-create` → `/team/create`
   - `qb-training-schedule` → `/training/qb/schedule`
   - `qb-throwing-tracker` → `/training/qb/throwing`
   - `qb-assessment-tools` → `/training/qb/assessment`
   - `ai-training-scheduler` → `/training/ai-scheduler`
   - `training-schedule` → `/training/schedule`

2. **Update Sidebar Navigation:**
   - Add links to workout, exercise-library, wellness
   - Add conditional links for coach features
   - Add conditional links for QB-specific features

3. **Verify Button Routing:**
   - Test all `data-action` handlers
   - Test all `data-navigate-to` handlers
   - Add missing navigation after form submissions

### 🟢 Medium Priority (Fix When Possible)

1. **Consolidate Duplicate Pages:**
   - Merge `analytics-dashboard.html` with `analytics.html`
   - Merge `enhanced-analytics.html` with `analytics.html`
   - Merge `coach-dashboard.html` with `coach.html`

2. **Remove Deprecated Pages:**
   - `clear-cache.html` (if not needed)
   - `test-icons.html` (development only)
   - `update-roster-data.html` (if deprecated)

3. **Add Missing API Endpoints:**
   - Health check endpoints for all services
   - Community challenges endpoint
   - Algorithms health endpoint

---

## 6. TESTING CHECKLIST

### Route Testing:
- [ ] Test all Angular routes load correctly
- [ ] Test all HTML page redirects work
- [ ] Test sidebar navigation links
- [ ] Test deep linking to all pages
- [ ] Test 404 handling for invalid routes

### API Testing:
- [ ] Test all API endpoints return correct responses
- [ ] Test Netlify function redirects work
- [ ] Test API error handling
- [ ] Test API authentication/authorization
- [ ] Test API rate limiting

### Button/Link Testing:
- [ ] Test all `data-action` buttons
- [ ] Test all `data-navigate-to` links
- [ ] Test form submission navigation
- [ ] Test modal close navigation
- [ ] Test back button functionality

---

## 7. IMPLEMENTATION GUIDE

### Adding a New Route (Angular):

1. Add route to `angular/src/app/core/routes/feature-routes.ts`:
```typescript
{
  path: "new-route",
  loadComponent: () =>
    import("../../features/new-feature/new-feature.component").then(
      (m) => m.NewFeatureComponent,
    ),
  canActivate: [authGuard],
}
```

2. Add redirect in `netlify.toml`:
```toml
[[redirects]]
  from = "/new-route"
  to = "/new-route.html"
  status = 301
```

3. Update sidebar navigation if needed

### Adding a New API Endpoint:

1. Create Netlify function: `netlify/functions/new-endpoint.cjs`
2. Add redirect in `netlify.toml`:
```toml
[[redirects]]
  from = "/api/new-endpoint"
  to = "/.netlify/functions/new-endpoint"
  status = 200
  force = true
```
3. Add endpoint to `src/api-config.js`:
```javascript
newFeature: {
  endpoint: API_BASE_URL.includes("netlify/functions")
    ? "/new-endpoint"
    : normalizeEndpoint("/api/new-endpoint"),
}
```

---

## 8. CONCLUSION

This analysis identified:
- **23 HTML pages** missing from Angular routes
- **15 HTML pages** missing from sidebar navigation
- **32 API endpoints** with missing or mismatched Netlify functions
- **Multiple button/link routing issues**

**Next Steps:**
1. Prioritize critical fixes (missing routes, broken APIs)
2. Test all routes and APIs systematically
3. Update documentation with route mappings
4. Create automated tests for route/API validation

---

**Report Generated:** 2025-01-22  
**Last Updated:** 2025-01-22

