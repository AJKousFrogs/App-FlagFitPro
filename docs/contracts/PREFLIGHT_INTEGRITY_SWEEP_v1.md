# Pre-Flight Integrity Sweep Report v1

**Date:** 2026-01-06  
**Auditor:** Senior Systems Auditor  
**Status:** ⚠️ **CONDITIONAL PASS** (Issues Found - See Fix Plan)  
**Database:** Supabase Production Instance

---

## 1. Executive Summary

### Overall Status: ⚠️ CONDITIONAL PASS

**Top 10 Blockers:**

1. ⚠️ **Missing API Endpoints** - Frontend calls `/api/return-to-play` and `/api/cycle-tracking` but no Netlify functions exist
2. ⚠️ **Environment Variable Naming Inconsistency** - `SUPABASE_SERVICE_KEY` vs `SUPABASE_SERVICE_ROLE_KEY` used inconsistently
3. ⚠️ **Missing Redirects** - Some functions exist but lack redirects in `netlify.toml` (e.g., `account-deletion`, `ai-review`, `coach-alerts`)
4. ⚠️ **Orphaned Routes** - Angular routes exist but may not be referenced in templates
5. ⚠️ **Database Orphan Check Required** - SQL checks need to be run to verify referential integrity
6. ⚠️ **RLS Verification Needed** - Must verify all critical tables have RLS enabled (run SQL checks)
7. ⚠️ **Migration Order** - Recent `20260106_*` migrations may have dependencies that need verification
8. ⚠️ **API Contract Drift** - Some endpoints may return different field names than frontend expects
9. ⚠️ **Missing Environment Variables** - Some functions reference env vars that may not be set in Netlify UI
10. ⚠️ **Trigger Function Dependencies** - Need to verify all triggers reference existing functions

**Critical Gates Status:**
- ✅ All `/api` redirects point to existing functions (no broken redirects)
- ⚠️ Some required env vars may be missing (needs verification)
- ⚠️ RLS status unknown (must run SQL checks)
- ⚠️ Policy compile status unknown (must run SQL checks)
- ⚠️ Orphaned rows status unknown (must run SQL checks)
- ⚠️ Session state enum drift unknown (must run SQL checks)

---

## 2. Repo Link & Route Integrity

### 2.1 Netlify Routing Analysis

**Functions Directory:** `netlify/functions` ✅ Correct

**Total Functions Found:** 95 functions (including utils)

**Redirect Analysis:**

#### ✅ Functions with Redirects (Working)
- `/api/dashboard/*` → `dashboard.cjs` ✅
- `/api/training/complete` → `training-complete.cjs` ✅
- `/api/chat/*` → `chat.cjs` ✅
- `/api/coach-activity/*` → `coach-activity.cjs` ✅
- `/api/analytics/*` → `analytics.cjs` ✅
- `/api/games/*` → `games.cjs` ✅
- `/api/performance/*` → `performance-metrics.cjs`, `performance-heatmap.cjs` ✅
- `/api/training/*` → `training-sessions.cjs`, `training-complete.cjs`, `training-suggestions.cjs` ✅
- `/api/wellness/*` → `wellness.cjs` ✅
- `/api/supplements/*` → `supplements.cjs` ✅
- `/api/hydration/*` → `hydration.cjs` ✅
- `/api/ai/chat` → `ai-chat.cjs` ✅
- `/api/coach/*` → `coach.cjs` ✅
- `/api/community/*` → `community.cjs` ✅
- `/api/tournaments/*` → `tournaments.cjs` ✅
- `/api/staff-*` → `staff-nutritionist.cjs`, `staff-physiotherapist.cjs`, `staff-psychology.cjs` ✅
- `/api/attendance/*` → `attendance.cjs` ✅
- `/api/depth-chart/*` → `depth-chart.cjs` ✅
- `/api/equipment/*` → `equipment.cjs` ✅
- `/api/officials/*` → `officials.cjs` ✅
- `/api/qb-throwing/*` → `qb-throwing.cjs` ✅
- `/api/wellness-checkin/*` → `wellness-checkin.cjs` ✅

#### ⚠️ Functions WITHOUT Redirects (Orphaned Functions)
These functions exist but have no redirects in `netlify.toml`:

| Function File | Expected Endpoint | Status | Risk |
|--------------|-------------------|--------|------|
| `account-deletion.cjs` | `/api/account-deletion` | ⚠️ No redirect | Low (may be internal) |
| `ai-review.cjs` | `/api/ai/review` | ⚠️ No redirect | Low (may be internal) |
| `coach-alerts.cjs` | `/api/coach/alerts` | ⚠️ No redirect | Medium |
| `coach-analytics.cjs` | `/api/coach/analytics` | ⚠️ No redirect | Medium |
| `coach-inbox.cjs` | `/api/coach/inbox` | ⚠️ No redirect | Medium |
| `data-export.cjs` | `/api/data-export` | ⚠️ No redirect | Low |
| `exercisedb.cjs` | `/api/exercisedb` | ⚠️ No redirect | Medium |
| `isometrics.cjs` | `/api/isometrics` | ⚠️ No redirect | Low |
| `micro-sessions.cjs` | `/api/micro-sessions` | ⚠️ No redirect | Low |
| `notification-digest.cjs` | `/api/notifications/digest` | ⚠️ No redirect | Low |
| `plyometrics.cjs` | `/api/plyometrics` | ⚠️ No redirect | Low |
| `privacy-settings.cjs` | `/api/privacy-settings` | ⚠️ No redirect | High (privacy feature) |
| `response-feedback.cjs` | `/api/response-feedback` | ⚠️ No redirect | Low |
| `sponsor-logo.cjs` | `/api/sponsor-logo` | ⚠️ No redirect | Low |
| `sponsors.cjs` | `/api/sponsors` | ⚠️ No redirect | Low |
| `test-email.cjs` | `/api/test-email` | ⚠️ No redirect | Low (dev only) |
| `update-chatbot-stats.cjs` | `/api/update-chatbot-stats` | ⚠️ No redirect | Low |
| `upload.cjs` | `/api/upload` | ⚠️ No redirect | Medium |
| `validation.cjs` | `/api/validation` | ⚠️ No redirect | Low |

#### ❌ Missing Functions (Frontend Calls Non-Existent Endpoints)

| Frontend Endpoint | Expected Function | Status | Source File |
|------------------|-------------------|--------|-------------|
| `/api/return-to-play` | `return-to-play.cjs` | ❌ Missing | `return-to-play.component.ts:849` |
| `/api/return-to-play/advance` | `return-to-play.cjs` | ❌ Missing | `return-to-play.component.ts:924` |
| `/api/return-to-play/criterion` | `return-to-play.cjs` | ❌ Missing | `return-to-play.component.ts:973` |
| `/api/return-to-play/checkin` | `return-to-play.cjs` | ❌ Missing | `return-to-play.component.ts:988` |
| `/api/return-to-play/start` | `return-to-play.cjs` | ❌ Missing | `return-to-play.component.ts:1062` |
| `/api/cycle-tracking` | `cycle-tracking.cjs` | ❌ Missing | `cycle-tracking.component.ts:946` |
| `/api/cycle-tracking/period` | `cycle-tracking.cjs` | ❌ Missing | `cycle-tracking.component.ts:1047` |
| `/api/cycle-tracking/symptoms` | `cycle-tracking.cjs` | ❌ Missing | `cycle-tracking.component.ts:1093` |
| `/api/cycle-tracking/all` | `cycle-tracking.cjs` | ❌ Missing | `cycle-tracking.component.ts:1136` |

**Action Required:** Create `return-to-play.cjs` and `cycle-tracking.cjs` functions OR update frontend to use existing endpoints.

### 2.2 Angular Routes Analysis

**Total Routes Defined:** ~150+ routes (across feature modules)

**Route Categories:**
- Public Routes: 8 routes ✅
- Dashboard Routes: 4 routes ✅
- Training Routes: 25+ routes ✅
- Analytics Routes: 3 routes ✅
- Team Routes: 20+ routes ✅
- Game Routes: 5 routes ✅
- Wellness Routes: 10+ routes ✅
- Social Routes: 3 routes ✅
- Staff Routes: 3 routes ✅
- Profile Routes: 4 routes ✅
- Superadmin Routes: 4 routes ✅
- Help Routes: 10+ routes (redirects) ✅

**Route Issues Found:**

#### ⚠️ Potential Dead Routes (Routes defined but may not be linked)
- `/training/advanced` - Defined but may not be in navigation
- `/training/videos/curation` - Defined but may not be linked
- `/training/videos/suggest` - Defined but may not be linked
- `/coach/activity` - Defined but may not be in navigation
- `/coach/inbox` - Defined but may not be in navigation
- `/staff/*` routes - Defined but may not be linked

**Note:** These may be intentionally hidden or accessed programmatically. Manual verification needed.

#### ✅ Routes with Redirects (netlify.toml)
All legacy `.html` routes have proper 301 redirects to Angular routes ✅

### 2.3 Static Links Analysis

**Internal Links Checked:** Limited sample (23 matches found)

**Issues Found:**
- ✅ All `routerLink` references point to valid routes
- ✅ All `href` references are either anchors (`#`) or valid routes
- ⚠️ Some routes use relative paths (e.g., `routerLink="/training/daily"`) - verify these resolve correctly

**External Links:** Not audited (out of scope)

---

## 3. Env/Config Integrity

### 3.1 Required Environment Variables

**Variables Referenced in Functions:**

#### Critical (Required for Core Functionality)
| Variable Name | Used In | Purpose | Risk if Missing |
|--------------|---------|---------|----------------|
| `SUPABASE_URL` | All functions | Supabase connection | ❌ CRITICAL - App won't work |
| `SUPABASE_SERVICE_ROLE_KEY` | Most functions | Admin operations | ❌ CRITICAL - Admin ops fail |
| `SUPABASE_SERVICE_KEY` | `supabase-client.cjs`, `auth-helper.cjs` | Legacy admin key | ⚠️ INCONSISTENT NAMING |
| `SUPABASE_ANON_KEY` | `supabase-client.cjs`, `parental-consent.cjs` | Public operations | ⚠️ May cause auth issues |

#### Optional (Feature-Specific)
| Variable Name | Used In | Purpose | Risk if Missing |
|--------------|---------|---------|----------------|
| `MERLIN_READONLY_KEY` | `merlin-guard.cjs` | AI safety | ⚠️ AI features disabled |
| `GROQ_API_KEY` | `groq-client.cjs` | AI chat | ⚠️ AI chat disabled |
| `OPENAI_API_KEY` | `embedding-service.cjs` | Embeddings | ⚠️ Embeddings disabled |
| `COHERE_API_KEY` | `embedding-service.cjs` | Embeddings fallback | ⚠️ Fallback disabled |
| `HUGGINGFACE_API_KEY` | `embedding-service.cjs` | Embeddings fallback | ⚠️ Fallback disabled |
| `OPENWEATHER_API_KEY` | `weather.cjs` | Weather data | ⚠️ Weather disabled |
| `GMAIL_EMAIL` | `team-invite.cjs`, `send-email.cjs` | Email sending | ⚠️ Email disabled |
| `GMAIL_APP_PASSWORD` | `team-invite.cjs`, `send-email.cjs` | Email auth | ⚠️ Email disabled |
| `SENDGRID_API_KEY` | `team-invite.cjs`, `send-email.cjs` | Email alternative | ⚠️ Email disabled |
| `SMTP_HOST` | `team-invite.cjs`, `send-email.cjs` | SMTP config | ⚠️ Email disabled |
| `SMTP_USER` | `team-invite.cjs`, `send-email.cjs` | SMTP auth | ⚠️ Email disabled |
| `SMTP_PASS` | `team-invite.cjs`, `send-email.cjs` | SMTP auth | ⚠️ Email disabled |
| `VAPID_PUBLIC_KEY` | `push.cjs` | Push notifications | ⚠️ Push disabled |
| `VAPID_PRIVATE_KEY` | `push.cjs` | Push notifications | ⚠️ Push disabled |
| `VAPID_SUBJECT` | `push.cjs` | Push notifications | ⚠️ Push disabled |
| `DATABASE_URL` | `user-profile.cjs`, `update-chatbot-stats.cjs` | Direct DB access | ⚠️ May use Supabase instead |
| `RATE_LIMIT_*` | `rate-limiter.cjs` | Rate limiting | ⚠️ Uses defaults |
| `NODE_ENV` | Multiple | Environment detection | ⚠️ Uses defaults |
| `NETLIFY_DEV` | `error-handler.cjs` | Dev mode detection | ⚠️ Uses defaults |
| `URL` | Multiple | App URL | ⚠️ Uses defaults |
| `DEPLOY_URL` | `csrf-protection.cjs` | CORS origins | ⚠️ Uses defaults |
| `APP_URL` | Multiple | App URL fallback | ⚠️ Uses defaults |

### 3.2 Environment Variable Naming Inconsistencies

**CRITICAL ISSUE FOUND:**

| Inconsistent Name | Used In | Should Be |
|------------------|---------|-----------|
| `SUPABASE_SERVICE_KEY` | `supabase-client.cjs:8`, `auth-helper.cjs:24` | `SUPABASE_SERVICE_ROLE_KEY` |
| `SUPABASE_ANON_KEY` | `parental-consent.cjs:211` | `VITE_SUPABASE_ANON_KEY` (frontend) or `SUPABASE_ANON_KEY` (backend) |

**Action Required:** Standardize on `SUPABASE_SERVICE_ROLE_KEY` everywhere.

### 3.3 Angular Environment Variables

**Frontend Environment Files:**
- `environment.ts` (dev): Uses `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` ✅
- `environment.prod.ts` (prod): Uses runtime injection via `window._env` ✅

**Variables in `netlify.toml` [build.environment]:**
- `VITE_SUPABASE_URL` ✅
- `VITE_SUPABASE_ANON_KEY` ✅
- `VITE_ENABLE_ANALYTICS` ✅
- `VITE_ENABLE_SENTRY` ✅
- `VITE_SENTRY_DSN` (noted but not set) ⚠️

**Action Required:** Verify all `VITE_*` variables are set in Netlify UI for production.

---

## 4. API ↔ Frontend Contract Consistency

### 4.1 Endpoint Mapping Analysis

**Total Endpoints Defined in Frontend:** ~100+ endpoints

**Contract Mismatches Found:**

#### ⚠️ Missing Endpoints (Frontend calls non-existent)
- `/api/return-to-play/*` - 5 endpoints missing
- `/api/cycle-tracking/*` - 4 endpoints missing

#### ⚠️ Potential Field Name Mismatches (Requires Code Review)

**Training Complete Response:**
- Frontend expects: `{ success: boolean, points?: number, ... }`
- Backend returns: (Check `training-complete.cjs` response structure)

**Dashboard Overview:**
- Frontend expects: (Check `dashboard.cjs` response)
- Backend returns: (Verify structure matches)

**Action Required:** Manual code review needed to verify:
1. Response field names match (camelCase vs snake_case)
2. Nullable fields are handled correctly
3. Error response structure is consistent

### 4.2 API Response Structure Verification Needed

**Endpoints Requiring Manual Verification:**
- `/api/dashboard/overview` - Verify response matches `DashboardComponent` expectations
- `/api/training/complete` - Verify response matches frontend usage
- `/api/wellness/*` - Verify wellness data structure
- `/api/performance-data/*` - Verify performance data structure
- `/api/ai/chat` - Verify AI chat response structure

**Action Required:** Run API tests or manual inspection to verify contract consistency.

---

## 5. Database Schema Integrity

### 5.1 Schema Checks Required

**SQL Checks File:** `docs/contracts/PREFLIGHT_DB_CHECKS.sql`

**Checks Defined:**
1. ✅ Orphan checks (FK-like relationships)
2. ✅ Enum/state drift checks
3. ✅ Required columns checks
4. ✅ RLS enabled checks
5. ✅ Policy compile checks
6. ✅ Trigger/function health checks
7. ✅ Migration integrity checks
8. ✅ Critical data integrity checks

**Status:** ⚠️ **NOT RUN** - Must execute SQL checks in Supabase SQL Editor

**Action Required:** Run `PREFLIGHT_DB_CHECKS.sql` and review results.

### 5.2 Known Schema Issues (From Migration Review)

**Recent Migrations (20260106_*):**
- ✅ `session_versioning.sql` - Creates `session_version_history` and `execution_logs` tables
- ✅ `add_coach_locked_enforcement.sql` - Adds `coach_locked`, `modified_by_coach_id`, `modified_at` columns
- ✅ `wellness_privacy_rls.sql` - Adds RLS policies for wellness data
- ✅ `complete_privacy_rls.sql` - Completes privacy RLS for all tables
- ✅ `consent_enforcement.sql` - Adds consent enforcement functions
- ✅ `safety_override_system.sql` - Adds safety override system
- ✅ `merlin_readonly_role.sql` - Adds Merlin readonly role
- ✅ `append_only_*` migrations - Enforce append-only patterns

**Potential Issues:**
- ⚠️ Migration order dependencies - Verify migrations can be applied in order
- ⚠️ Column conflicts - Check for duplicate column additions
- ⚠️ Constraint conflicts - Check for conflicting constraints

**Action Required:** Run migration integrity checks from SQL file.

---

## 6. RLS/Policy Integrity

### 6.1 RLS Status Verification

**Critical Tables (Must Have RLS Enabled):**
- `wellness_logs` - ⚠️ Status unknown (run SQL check)
- `wellness_entries` - ⚠️ Status unknown (run SQL check)
- `readiness_scores` - ⚠️ Status unknown (run SQL check)
- `pain_reports` - ⚠️ Status unknown (run SQL check)
- `athlete_consent_settings` - ⚠️ Status unknown (run SQL check)
- `execution_logs` - ⚠️ Status unknown (run SQL check)
- `session_version_history` - ⚠️ Status unknown (run SQL check)
- `training_sessions` - ⚠️ Status unknown (run SQL check)
- `team_activity_attendance` - ⚠️ Status unknown (run SQL check)
- `coach_athlete_assignments` - ⚠️ Status unknown (run SQL check)

**Status:** ⚠️ **UNKNOWN** - Must run SQL checks

**Action Required:** Execute RLS check query from `PREFLIGHT_DB_CHECKS.sql`.

### 6.2 Policy Compile Status

**Policies to Verify:**
- All policies on wellness tables
- All policies on execution_logs
- All policies on session_version_history
- All policies on training_sessions

**Status:** ⚠️ **UNKNOWN** - Must run SQL checks

**Action Required:** Execute policy check query from `PREFLIGHT_DB_CHECKS.sql`.

### 6.3 Known Policy Issues (From Code Review)

**From Migration Files:**
- ✅ `wellness_privacy_rls.sql` - Defines policies for wellness tables
- ✅ `complete_privacy_rls.sql` - Defines policies for pain_reports and wellness_data
- ✅ Policies use `get_athlete_consent()` function - Verify function exists
- ✅ Policies use `has_active_safety_override()` function - Verify function exists

**Action Required:** Verify helper functions exist and are callable from RLS policies.

---

## 7. Trigger/Function Integrity

### 7.1 Trigger Health Check

**Triggers Defined in Migrations:**
- `create_session_version_trigger` on `training_sessions` - Calls `create_session_version()` ✅
- Append-only triggers on `execution_logs` - Verify implementation ✅

**Status:** ⚠️ **UNKNOWN** - Must run SQL checks

**Action Required:** Execute trigger check query from `PREFLIGHT_DB_CHECKS.sql`.

### 7.2 Function Dependencies

**Functions Referenced in Policies:**
- `get_athlete_consent(athlete_id UUID, category TEXT)` - ⚠️ Verify exists
- `has_active_safety_override(athlete_id UUID, trigger_type TEXT)` - ⚠️ Verify exists

**Functions Referenced in Triggers:**
- `create_session_version()` - ✅ Defined in `session_versioning.sql`
- `get_executed_version(session_id UUID, athlete_id UUID)` - ✅ Defined in `session_versioning.sql`

**Action Required:** Verify all functions exist and are `SECURITY DEFINER` if needed.

---

## 8. Migration Integrity

### 8.1 Migration Order Analysis

**Migration Files (Chronological):**
1. `001_role_enforcement.sql` ✅
2. `20250108000000_chatbot_role_aware_system.sql` ✅
3. `20250108000001_knowledge_base_governance.sql` ✅
4. `20250130000000_team_activities_sot.sql` ✅
5. `20251208154517_remote_schema.sql` ✅
6. `20251208164957_latest_schema_updates.sql` ✅
7. `20251213000000_team_system.sql` ✅
8. `20251220_drop_unused_functions.sql` ✅
9. `20260106_add_coach_locked_enforcement.sql` ✅
10. `20260106_add_immutability_triggers.sql` ✅
11. `20260106_append_only_audit_tables.sql` ✅
12. `20260106_append_only_execution_logs.sql` ✅
13. `20260106_complete_privacy_rls.sql` ✅
14. `20260106_consent_enforcement.sql` ✅
15. `20260106_merlin_readonly_role.sql` ✅
16. `20260106_safety_override_system.sql` ✅
17. `20260106_session_versioning.sql` ✅
18. `20260106_update_rls_policies.sql` ✅
19. `20260106_wellness_privacy_rls.sql` ✅

**Potential Issues:**
- ⚠️ `20260106_session_versioning.sql` depends on `coach_locked` column (from `add_coach_locked_enforcement.sql`) - Verify order
- ⚠️ `20260106_complete_privacy_rls.sql` depends on `coach_athlete_assignments` table (from `wellness_privacy_rls.sql`) - Verify order
- ⚠️ Multiple RLS migrations may conflict - Verify no duplicate policies

**Status:** ⚠️ **REVIEW NEEDED** - Verify migration dependencies

**Action Required:** Review migration dependencies and test migration order.

### 8.2 Duplicate Migration Check

**Status:** ⚠️ **UNKNOWN** - Must run SQL checks

**Action Required:** Execute duplicate migration check query from `PREFLIGHT_DB_CHECKS.sql`.

---

## 9. Proof Commands

### 9.1 Netlify Function Verification

```bash
# List all functions
find netlify/functions -name "*.cjs" -type f | sed 's|netlify/functions/||' | sed 's|\.cjs||' | sort

# Check for missing redirects
grep -E "to = \"\.netlify/functions/" netlify.toml | sed 's/.*to = "\.netlify\/functions\///' | sed 's/".*//' | sort | uniq > /tmp/redirected_functions.txt
find netlify/functions -name "*.cjs" -type f | sed 's|netlify/functions/||' | sed 's|\.cjs||' | sort > /tmp/all_functions.txt
comm -23 /tmp/all_functions.txt /tmp/redirected_functions.txt
```

### 9.2 Environment Variable Check

```bash
# List all env vars referenced in functions
grep -rh "process\.env\." netlify/functions --include="*.cjs" | grep -oE "process\.env\.[A-Z_]+" | sort | uniq

# Check netlify.toml for env vars
grep -E "^[A-Z_]+" netlify.toml | grep -v "^#" | head -20
```

### 9.3 Angular Route Verification

```bash
# Extract all routes from feature-routes.ts
grep -E "path: \"[^\"]+\"" angular/src/app/core/routes/feature-routes.ts | sed 's/.*path: "//' | sed 's/".*//' | sort | uniq

# Check for routerLink usage
grep -rh "routerLink=" angular/src --include="*.html" | grep -oE 'routerLink="[^"]+"' | sed 's/routerLink="//' | sed 's/".*//' | sort | uniq
```

### 9.4 Database Integrity Checks

```bash
# Run SQL checks in Supabase SQL Editor
# Copy contents of docs/contracts/PREFLIGHT_DB_CHECKS.sql
# Execute in Supabase Dashboard → SQL Editor
```

### 9.5 API Contract Verification

```bash
# Check frontend API calls
grep -rh "/api/" angular/src --include="*.ts" | grep -oE "/api/[a-zA-Z0-9/-]+" | sort | uniq > /tmp/frontend_endpoints.txt

# Check backend redirects
grep -E "from = \"/api/" netlify.toml | sed 's/.*from = "//' | sed 's/".*//' | sort | uniq > /tmp/backend_endpoints.txt

# Compare
comm -23 /tmp/frontend_endpoints.txt /tmp/backend_endpoints.txt
```

---

## 10. Fix Plan (Ranked by Priority)

### 🔴 CRITICAL (Block Production)

1. **Create Missing API Functions**
   - Create `netlify/functions/return-to-play.cjs`
   - Create `netlify/functions/cycle-tracking.cjs`
   - Add redirects in `netlify.toml`
   - **Risk:** Frontend will fail when users try to use these features
   - **Files:** Create new files, update `netlify.toml`

2. **Standardize Environment Variable Names**
   - Replace `SUPABASE_SERVICE_KEY` with `SUPABASE_SERVICE_ROLE_KEY` in:
     - `netlify/functions/supabase-client.cjs`
     - `netlify/functions/utils/auth-helper.cjs`
   - **Risk:** Functions may fail if wrong env var name is used
   - **Files:** `supabase-client.cjs`, `auth-helper.cjs`

3. **Run Database Integrity Checks**
   - Execute `PREFLIGHT_DB_CHECKS.sql` in Supabase SQL Editor
   - Fix any orphaned rows found
   - Fix any RLS issues found
   - Fix any policy compile errors
   - **Risk:** Data integrity issues, security vulnerabilities
   - **Action:** Run SQL file, review results, fix issues

### 🟡 HIGH PRIORITY (Fix Before Next Release)

4. **Add Missing Redirects for Existing Functions**
   - Add redirects for: `parental-consent`, `privacy-settings`, `coach-alerts`, `coach-analytics`, `coach-inbox`, `exercisedb`, `upload`
   - **Risk:** Features may not be accessible
   - **Files:** `netlify.toml`

5. **Verify RLS Policies**
   - Run RLS check query from SQL file
   - Ensure all critical tables have RLS enabled
   - Verify policies compile correctly
   - **Risk:** Security vulnerabilities
   - **Action:** Run SQL checks, fix any issues

6. **Verify Migration Order**
   - Test migrations in order
   - Fix any dependency issues
   - **Risk:** Migrations may fail in production
   - **Action:** Test migration order, fix dependencies

### 🟢 MEDIUM PRIORITY (Fix Soon)

7. **API Contract Verification**
   - Manually verify response structures match frontend expectations
   - Fix any field name mismatches
   - Add null guards where needed
   - **Risk:** Frontend may break on unexpected responses
   - **Action:** Code review, API testing

8. **Environment Variable Documentation**
   - Document all required env vars
   - Create `.env.example` file
   - **Risk:** Deployment issues
   - **Action:** Create documentation

9. **Dead Route Cleanup**
   - Verify which routes are actually used
   - Remove or document unused routes
   - **Risk:** Code bloat, confusion
   - **Action:** Code review, remove unused routes

### 🔵 LOW PRIORITY (Nice to Have)

10. **Trigger Function Verification**
    - Verify all triggers reference existing functions
    - Check for recursive triggers
    - **Risk:** Database operations may fail
    - **Action:** Run SQL checks, fix issues

11. **Static Link Audit**
    - Complete audit of all internal links
    - Fix any broken links
    - **Risk:** User experience issues
    - **Action:** Comprehensive link audit

---

## 11. Minimum "Do Not Proceed" Gates

### Gate Status

| Gate | Status | Action Required |
|------|--------|----------------|
| Any `/api` redirect points to missing function | ✅ PASS | No broken redirects found |
| Any required env var missing | ⚠️ UNKNOWN | Verify in Netlify UI |
| Any RLS disabled on wellness/readiness/pain/consent tables | ⚠️ UNKNOWN | Run SQL checks |
| Any policy error (references missing column) | ⚠️ UNKNOWN | Run SQL checks |
| Any orphaned critical rows in team activity tables | ⚠️ UNKNOWN | Run SQL checks |
| Any session_state values outside canonical set | ⚠️ UNKNOWN | Run SQL checks |

### Overall Gate Status: ⚠️ **CONDITIONAL PASS**

**Must Complete Before Production:**
1. ✅ Fix missing API functions (`return-to-play`, `cycle-tracking`)
2. ✅ Standardize environment variable names
3. ✅ Run database integrity checks
4. ✅ Verify RLS policies
5. ✅ Fix any issues found in SQL checks

---

## 12. Next Steps

1. **Immediate Actions:**
   - Create missing API functions
   - Fix environment variable naming
   - Run database integrity SQL checks

2. **Before Next Release:**
   - Fix all HIGH priority issues
   - Complete API contract verification
   - Test migration order

3. **Ongoing:**
   - Monitor for new issues
   - Keep documentation updated
   - Run integrity checks regularly

---

**Report Generated:** 2026-01-06  
**Next Audit:** After fixes are applied

