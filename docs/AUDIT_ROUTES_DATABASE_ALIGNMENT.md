# Routes, Functions, and Database Alignment Audit

**Date**: January 2026  
**Version**: 2.3.0  
**Status**: ✅ Audit Complete - Fixes Applied

---

## Executive Summary

This audit examines the alignment between:
1. **Backend Routes** (`/routes/*.routes.js`)
2. **Database Schema** (`/database/schema.sql` + migrations)
3. **Frontend API Clients** (`/src/api-config.js`, `/angular/src/app/core/services/api.service.ts`)
4. **Netlify Functions** (`/netlify/functions/*.cjs`)

### Key Findings

✅ **Well-Aligned Areas:**
- Core training routes ↔ `training_sessions`, `workout_logs` tables
- Wellness routes ↔ `daily_wellness_checkin`, `supplement_logs`, `hydration_logs`
- Analytics routes ↔ `performance_metrics`, `training_analytics`, `analytics_events`

⚠️ **Issues Found:**
- **Duplicate notification endpoints** (dashboard + dedicated route)
- **Missing route handlers** for tables referenced in frontend
- **Inconsistent route patterns** (RESTful vs query-parameter based)
- **Tables referenced but not in main schema** (in migrations only)

---

## 1. Route Structure Mapping

### 1.1 Training Routes (`/api/training`)

**File**: `routes/training.routes.js`

| Endpoint | Method | Database Tables Used | Status |
|----------|--------|---------------------|--------|
| `/health` | GET | None | ✅ |
| `/stats` | GET | `training_sessions` | ✅ |
| `/stats-enhanced` | GET | `training_sessions` | ✅ |
| `/sessions` | GET | `training_sessions` | ✅ |
| `/session` | POST | `training_sessions` | ✅ |
| `/complete` | POST | `training_sessions`, `workout_logs` | ✅ |
| `/workouts/:id` | GET | `training_sessions`, `session_exercises` | ✅ |
| `/workouts/:id` | PUT | `training_sessions` | ✅ |
| `/session/:id` | DELETE | `training_sessions` | ✅ |
| `/suggestions` | GET | None (hardcoded) | ⚠️ Should use DB |
| `/suggestions` | POST | None (logs only) | ⚠️ Should use DB |

**Issues:**
- `/suggestions` endpoints return hardcoded data instead of querying database
- Missing endpoints referenced in frontend:
  - `/api/training-programs` (referenced in `api.service.ts` line 214)
  - `/api/training-programs/phases` (line 215)
  - `/api/training-programs/weeks` (line 216)
  - `/api/training-programs/sessions` (line 217)
  - `/api/training-programs/exercises` (line 218)
  - `/api/training-programs/current-week` (line 219)

---

### 1.2 Wellness Routes (`/api/wellness`)

**File**: `routes/wellness.routes.js`

| Endpoint | Method | Database Tables Used | Status |
|----------|--------|---------------------|--------|
| `/health` | GET | None | ✅ |
| `/checkin` | GET | `daily_wellness_checkin` | ✅ |
| `/checkin` | POST | `daily_wellness_checkin` | ✅ |
| `/checkins` | GET | `daily_wellness_checkin` | ✅ |
| `/latest` | GET | `daily_wellness_checkin` | ✅ |
| `/supplements` | GET | `supplement_regimens` | ✅ |
| `/supplements/log` | POST | `supplement_logs` | ✅ |
| `/supplements/logs` | GET | `supplement_logs` | ✅ |
| `/hydration` | GET | `hydration_logs` | ✅ |
| `/hydration/log` | POST | `hydration_logs` | ✅ |

**Issues:**
- All endpoints properly aligned with database schema
- No missing endpoints detected

---

### 1.3 Analytics Routes (`/api/analytics`)

**File**: `routes/analytics.routes.js`

| Endpoint | Method | Database Tables Used | Status |
|----------|--------|---------------------|--------|
| `/health` | GET | None | ✅ |
| `/performance-trends` | GET | `performance_metrics` | ✅ |
| `/team-chemistry` | GET | `team_chemistry_metrics` | ⚠️ Table may not exist |
| `/training-distribution` | GET | `training_analytics` | ✅ |
| `/summary` | GET | `training_analytics`, `analytics_events`, `performance_metrics` | ✅ |

**Issues:**
- `/team-chemistry` references `team_chemistry_metrics` table
  - Table exists in `create-missing-tables.sql` but not in main `schema.sql`
  - Should verify table exists in production

---

### 1.4 Notifications Routes (`/api/notifications`)

**File**: `routes/notifications.routes.js`

| Endpoint | Method | Database Tables Used | Status |
|----------|--------|---------------------|--------|
| `/health` | GET | None | ✅ |
| `/` | GET | `notifications` | ✅ |
| `/count` | GET | `notifications` | ✅ |
| `/mark-read` | POST | `notifications` | ✅ |
| `/:id` | DELETE | `notifications` | ✅ |
| `/preferences` | GET | `notification_preferences` | ✅ |
| `/preferences` | PUT | `notification_preferences` | ✅ |

**Issues:**
- ⚠️ **DUPLICATE**: Dashboard routes also have `/notifications` and `/notifications/count` endpoints
  - `dashboard.routes.js` lines 364-433
  - Should consolidate to use notifications routes only

---

### 1.5 Dashboard Routes (`/api/dashboard`)

**File**: `routes/dashboard.routes.js`

| Endpoint | Method | Database Tables Used | Status |
|----------|--------|---------------------|--------|
| `/health` | GET | None | ✅ |
| `/overview` | GET | `training_sessions` | ✅ |
| `/training-calendar` | GET | `training_sessions` | ✅ |
| `/olympic-qualification` | GET | `olympic_qualification`, `performance_benchmarks` | ⚠️ Tables may not exist |
| `/sponsor-rewards` | GET | `sponsor_rewards`, `sponsor_products` | ⚠️ Tables may not exist |
| `/team-chemistry` | GET | `team_chemistry` | ⚠️ Table may not exist |
| `/daily-quote` | GET | `daily_quotes` | ⚠️ Table may not exist |
| `/notifications` | GET | `notifications` | ⚠️ **DUPLICATE** |
| `/notifications/count` | GET | `notifications` | ⚠️ **DUPLICATE** |
| `/analytics/health` | GET | None | ✅ |
| `/coach/health` | GET | None | ✅ |
| `/community/health` | GET | None | ✅ |

**Issues:**
- ⚠️ **DUPLICATE**: Notification endpoints duplicate `notifications.routes.js`
- ⚠️ **MISSING TABLES**: Several tables referenced but not in main schema:
  - `olympic_qualification` (exists in `create-missing-tables.sql`)
  - `performance_benchmarks` (exists in `create-missing-tables.sql`)
  - `sponsor_rewards` (exists in `create-missing-tables.sql`)
  - `sponsor_products` (exists in `create-missing-tables.sql`)
  - `team_chemistry` (exists in `create-missing-tables.sql`)
  - `daily_quotes` (exists in `create-missing-tables.sql`)

---

### 1.6 Community Routes (`/api/community`)

**File**: `routes/community.routes.js`

| Endpoint | Method | Database Tables Used | Status |
|----------|--------|---------------------|--------|
| `/health` | GET | None | ✅ |
| `/` (feed=true) | GET | `community_posts`, `post_likes`, `post_bookmarks`, `post_comments`, `team_members` | ✅ |
| `/` | POST | `community_posts` | ✅ |
| `/` (like=true) | POST | `post_likes` | ✅ |
| `/` (bookmark=true) | POST | `post_bookmarks` | ✅ |
| `/` (comment=true) | GET/POST | `post_comments` | ✅ |
| `/` (commentLike=true) | POST | `comment_likes` | ✅ |
| `/` (leaderboard=true) | GET | `training_sessions` | ✅ |
| `/` (trending=true) | GET | `trending_topics` | ✅ |
| `/` (pollVote=true) | POST | `community_poll_votes`, `community_poll_options` | ✅ |
| `/feed` | GET | Same as feed=true | ⚠️ **LEGACY** |
| `/leaderboard` | GET | Same as leaderboard=true | ⚠️ **LEGACY** |
| `/posts` | POST | Same as POST / | ⚠️ **LEGACY** |

**Issues:**
- ⚠️ **INCONSISTENT PATTERN**: Uses query parameters instead of RESTful paths
  - Should be `/posts/:id/like` instead of `/?postId=xxx&like=true`
  - Legacy routes exist but should be deprecated
- ✅ All tables exist in migrations (`100_community_system.sql`)

---

## 2. Database Schema Analysis

### 2.1 Core Tables (in `schema.sql`)

**Analytics Tables:**
- ✅ `analytics_events`
- ✅ `performance_metrics`
- ✅ `user_behavior`
- ✅ `training_analytics`

**Training Tables:**
- ✅ `positions`
- ✅ `training_programs`
- ✅ `training_phases`
- ✅ `training_weeks`
- ✅ `exercises`
- ✅ `training_sessions`
- ✅ `session_exercises`
- ✅ `workout_logs`
- ✅ `exercise_logs`
- ✅ `load_monitoring`
- ✅ `position_specific_metrics`
- ✅ `player_programs`
- ✅ `training_videos`

### 2.2 Tables in Migrations (not in main schema)

**Wellness Tables:**
- `daily_wellness_checkin` (migration `031_wellness_and_measurements_tables.sql`)
- `supplement_regimens` (migration `051_add_service_migration_tables.sql`)
- `supplement_logs` (migration `051_add_service_migration_tables.sql`)
- `hydration_logs` (migration `051_add_service_migration_tables.sql`)

**Community Tables:**
- `community_posts` (migration `100_community_system.sql`)
- `post_likes` (migration `101_community_enhancements.sql`)
- `post_bookmarks` (migration `101_community_enhancements.sql`)
- `post_comments` (migration `100_community_system.sql`)
- `comment_likes` (migration `101_community_enhancements.sql`)
- `trending_topics` (migration `100_community_system.sql`)
- `community_polls` (migration `100_community_system.sql`)
- `community_poll_options` (migration `100_community_system.sql`)
- `community_poll_votes` (migration `100_community_system.sql`)

**Other Tables:**
- `notifications` (migration `037a_notifications_unification.sql`)
- `notification_preferences` (migration `080_ai_coach_phase4.sql`)
- `team_members` (migration `001_base_tables.sql`)
- `olympic_qualification` (`create-missing-tables.sql`)
- `performance_benchmarks` (`create-missing-tables.sql`)
- `sponsor_rewards` (`create-missing-tables.sql`)
- `sponsor_products` (`create-missing-tables.sql`)
- `team_chemistry` (`create-missing-tables.sql`)
- `team_chemistry_metrics` (`create-missing-tables.sql`)
- `daily_quotes` (`create-missing-tables.sql`)

**Issue:** Main `schema.sql` is incomplete - many tables exist only in migrations.

---

## 3. Frontend API Client Alignment

### 3.1 Angular API Service (`api.service.ts`)

**Referenced Endpoints Not Found in Routes:**

| Endpoint | Expected Location | Status |
|----------|------------------|--------|
| `/api/training-programs` | `training.routes.js` | ❌ Missing |
| `/api/training-programs/phases` | `training.routes.js` | ❌ Missing |
| `/api/training-programs/weeks` | `training.routes.js` | ❌ Missing |
| `/api/training-programs/sessions` | `training.routes.js` | ❌ Missing |
| `/api/training-programs/exercises` | `training.routes.js` | ❌ Missing |
| `/api/training-programs/current-week` | `training.routes.js` | ❌ Missing |
| `/api/dashboard/wearables` | `dashboard.routes.js` | ❌ Missing |
| `/api/performance/metrics` | None | ❌ Missing route file |
| `/api/performance/trends` | None | ❌ Missing route file |
| `/api/performance/heatmap` | None | ❌ Missing route file |
| `/api/weather/current` | None | ❌ Missing route file |
| `/api/load-management/*` | None | ❌ Missing route file |
| `/api/calc-readiness` | None | ❌ Missing route file |
| `/api/readiness-history` | None | ❌ Missing route file |
| `/api/games/*` | None | ❌ Missing route file |
| `/api/player-stats/*` | None | ❌ Missing route file |
| `/api/fixtures` | None | ❌ Missing route file |
| `/api/ai/chat` | None | ❌ Missing route file (may be Netlify function) |
| `/api/attendance/*` | None | ❌ Missing route file |
| `/api/depth-chart/*` | None | ❌ Missing route file |

**Note:** Many endpoints may be handled by Netlify Functions instead of Express routes.

---

## 4. Consolidation Opportunities

### 4.1 Duplicate Notification Endpoints

**Current State:**
- `dashboard.routes.js` has `/notifications` and `/notifications/count`
- `notifications.routes.js` has `/` and `/count`

**Recommendation:**
- Remove notification endpoints from `dashboard.routes.js`
- Update frontend to use `/api/notifications` instead of `/api/dashboard/notifications`

### 4.2 Community Route Pattern

**Current State:**
- Uses query parameters: `/?feed=true`, `/?postId=xxx&like=true`
- Has legacy RESTful routes: `/feed`, `/posts`

**Recommendation:**
- Migrate to RESTful pattern:
  - `GET /posts` → feed
  - `POST /posts` → create post
  - `POST /posts/:id/like` → toggle like
  - `POST /posts/:id/bookmark` → toggle bookmark
  - `GET /posts/:id/comments` → get comments
  - `POST /posts/:id/comments` → add comment
- Deprecate query-parameter routes
- Update frontend to use new paths

### 4.3 Missing Training Program Routes

**Current State:**
- Frontend expects `/api/training-programs/*` endpoints
- No routes exist in `training.routes.js`

**Recommendation:**
- Add routes to `training.routes.js`:
  ```javascript
  router.get("/programs", ...) // List programs
  router.get("/programs/:id/phases", ...) // Get phases
  router.get("/programs/:id/weeks", ...) // Get weeks
  router.get("/programs/:id/sessions", ...) // Get sessions
  router.get("/programs/:id/exercises", ...) // Get exercises
  router.get("/programs/current-week", ...) // Get current week
  ```

### 4.4 Schema Consolidation

**Current State:**
- Main `schema.sql` only has ~17 tables
- 200+ tables exist in migrations
- Tables referenced in routes may not be in main schema

**Recommendation:**
- Create consolidated schema documentation
- Verify all tables exist in production
- Consider generating schema from migrations

---

## 5. Recommendations

### Priority 1: Critical Issues

1. **Remove duplicate notification endpoints** from `dashboard.routes.js`
2. **Add missing training program routes** to `training.routes.js`
3. **Verify table existence** for tables referenced in routes but not in main schema

### Priority 2: Important Improvements

4. **Migrate community routes** to RESTful pattern
5. **Consolidate schema documentation** (list all tables from migrations)
6. **Add missing route handlers** for endpoints referenced in frontend

### Priority 3: Nice to Have

7. **Standardize route patterns** across all route files
8. **Add OpenAPI/Swagger documentation** for all routes
9. **Create route-to-table mapping** documentation

---

## 6. Action Items

- [x] Remove `/notifications` endpoints from `dashboard.routes.js` ✅ DONE
- [x] Add training program routes to `training.routes.js` ✅ DONE
- [ ] Verify existence of tables: `olympic_qualification`, `performance_benchmarks`, `sponsor_rewards`, `sponsor_products`, `team_chemistry`, `daily_quotes`, `team_chemistry_metrics`
- [x] Migrate community routes to RESTful pattern ✅ DONE
- [ ] Create consolidated database schema documentation
- [x] Update frontend API clients to use consolidated routes ✅ DONE
- [ ] Add health checks for all route modules

### Fixes Applied (January 2026)

1. **Removed duplicate notification endpoints** from `dashboard.routes.js`
   - Added deprecation notice pointing to `/api/notifications`
   
2. **Added training program routes** to `training.routes.js`:
   - `GET /programs` - List all programs
   - `GET /programs/:id` - Get program details
   - `GET /programs/:id/phases` - Get phases for program
   - `GET /programs/:id/weeks` - Get weeks for program
   - `GET /programs/:id/sessions` - Get sessions for program
   - `GET /programs/:id/exercises` - Get exercises for program
   - `GET /programs/current-week` - Get current week's plan
   
3. **Made `/suggestions` endpoint data-driven** instead of hardcoded
   - Now queries `training_sessions` to generate smart suggestions
   
4. **Migrated community routes to RESTful pattern**:
   - `GET /posts` - Get feed (replaces `/?feed=true`)
   - `POST /posts` - Create post
   - `POST /posts/:id/like` - Like post (replaces `/?postId=x&like=true`)
   - `POST /posts/:id/bookmark` - Bookmark post
   - `GET /posts/:id/comments` - Get comments
   - `POST /posts/:id/comments` - Add comment
   - `POST /comments/:id/like` - Like comment
   - `POST /polls/:id/vote` - Vote on poll
   - Legacy query-parameter routes deprecated with warning logs
   
5. **Updated frontend API clients**:
   - `angular/src/app/core/services/api.service.ts` - Added notifications section, updated community and training endpoints
   - `src/api-config.js` - Same updates for legacy frontend

---

## 7. Testing Checklist

- [ ] Test all routes return expected data
- [ ] Verify database tables exist for all route queries
- [ ] Test frontend API calls match backend routes
- [ ] Test duplicate endpoints return consistent data
- [ ] Verify error handling for missing tables
- [ ] Test authentication/authorization on all routes

---

**End of Audit Report**
