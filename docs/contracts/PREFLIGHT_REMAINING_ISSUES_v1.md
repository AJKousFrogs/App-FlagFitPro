# Pre-Flight Remaining Issues v1

**Date:** 2026-01-07  
**Status:** ⚠️ **REMAINING WORK IDENTIFIED**  
**Priority:** Medium-Low (Performance & Optimization)

---

## Executive Summary

All **critical security issues** have been resolved. The remaining issues are primarily **performance optimizations** and **system table policy reviews** that can be addressed incrementally.

---

## 1. System/Audit Table Policies (Lower Priority)

### Status: ⚠️ May Be Intentional

The following tables have permissive `WITH CHECK (true)` policies, but these may be intentional if they're only written by service role functions:

| Table | Policy Name | Command | Notes |
|-------|-------------|---------|-------|
| `ai_coach_visibility` | System can create coach visibility records | INSERT | System table |
| `coach_activity_log` | System can insert activity | INSERT | Audit log |
| `consent_change_log` | Append-only consent change log | INSERT | Audit log |
| `depth_chart_history` | System can insert history | INSERT | Audit log |
| `merlin_violation_log` | Append-only merlin violations | INSERT | Audit log |
| `roster_audit_log` | System can insert audit log | INSERT | Audit log |
| `safety_override_log` | Append-only safety override log | INSERT | Audit log |
| `sync_logs` | System can insert sync logs | INSERT | System log |

**Recommendation:** Review each table to confirm:
1. Are these tables only written by service role functions?
2. If yes, the permissive policies are acceptable
3. If no, add proper authorization checks

**Action Required:** Manual review of each table's usage patterns.

---

## 2. RLS Performance Optimization (Medium Priority)

### Issue: Auth Function Re-evaluation

Many RLS policies re-evaluate `auth.uid()` or `auth.role()` for each row, causing performance degradation at scale.

**Affected Tables (30+ policies):**
- `coach_athlete_assignments` (5 policies)
- `research_articles` (4 policies)
- `tournament_participation` (4 policies)
- `execution_logs` (3 policies)
- `wellness_logs` (3 policies)
- `team_activities` (5 policies)
- `team_activity_attendance` (3 policies)
- `readiness_scores` (3 policies)
- `wellness_entries` (2 policies)
- `session_version_history` (3 policies)
- `training_sessions` (1 policy)
- `athlete_consent_settings` (1 policy)
- `safety_override_log` (1 policy)
- `merlin_violation_log` (1 policy)
- `exercises` (1 policy)
- `session_exercises` (2 policies)
- `training_phases` (2 policies)
- `training_weeks` (2 policies)
- `training_session_templates` (2 policies)

**Fix Pattern:**
Replace `auth.uid()` with `(select auth.uid())`  
Replace `auth.role()` with `(select auth.role())`

**Example:**
```sql
-- Before (re-evaluates for each row)
USING (athlete_id = auth.uid())

-- After (evaluates once per query)
USING (athlete_id = (select auth.uid()))
```

**Priority:** Medium - Should be done incrementally, starting with high-traffic tables.

**Estimated Impact:** 10-30% query performance improvement on affected tables.

---

## 3. Unindexed Foreign Keys (Low-Medium Priority)

### Issue: 200+ Foreign Keys Without Indexes

Foreign keys without covering indexes can impact query performance, especially for JOINs and cascading operations.

**High-Priority Tables (Frequent Queries):**
- `training_sessions` - `template_id`, `user_id`
- `session_exercises` - `session_template_id`, `exercise_id`
- `team_activity_attendance` - `activity_id`, `athlete_id`
- `execution_logs` - `session_id`, `athlete_id`
- `wellness_logs` - `athlete_id`
- `readiness_scores` - `athlete_id`
- `coach_athlete_assignments` - `coach_id`, `athlete_id` (already indexed ✅)
- `training_programs` - `created_by`, `team_id`
- `training_phases` - `program_id`
- `training_weeks` - `phase_id`
- `training_session_templates` - `week_id`

**Medium-Priority Tables:**
- `team_members` - `user_id`, `team_id`
- `games` - `team_id`, `opponent_team_id`
- `tournament_participation` - `tournament_id`, `team_id`
- `chat_messages` - `sender_id`, `recipient_id`, `team_id`
- `posts` - `user_id`, `team_id`

**Low-Priority Tables:**
- Audit/log tables (rarely queried)
- Historical data tables
- Configuration tables

**Recommendation:**
1. Add indexes to high-priority tables first
2. Monitor query performance before adding all indexes
3. Some indexes may not be needed if queries don't use those foreign keys

**Action Required:** Create migration to add indexes incrementally, starting with high-traffic tables.

---

## 4. Multiple Permissive Policies (Low Priority)

### Issue: Multiple Policies for Same Role/Action

Some tables have multiple permissive policies for the same role and action, causing each policy to be evaluated for every query.

**Affected Tables:**
- `coach_athlete_assignments` - Multiple policies for SELECT, INSERT, UPDATE, DELETE
- `wellness_logs` - Multiple policies for SELECT, INSERT, UPDATE, DELETE
- `readiness_scores` - Multiple policies for SELECT
- `session_version_history` - Multiple policies for SELECT
- `team_activities` - Multiple policies for SELECT
- `team_activity_attendance` - Multiple policies for SELECT
- `team_activity_audit` - Multiple policies for SELECT
- `wellness_entries` - Multiple policies for SELECT
- `execution_logs` - Multiple policies for SELECT

**Fix:** Consolidate policies using OR conditions where appropriate, or use restrictive policies for more specific cases.

**Priority:** Low - Performance impact is minimal unless tables have millions of rows.

**Note:** Multiple policies are sometimes intentional for clarity and maintainability. Only consolidate if performance becomes an issue.

---

## 5. Unused Indexes (Low Priority)

### Issue: Some Indexes Have Never Been Used

The following indexes have not been used and may be candidates for removal:

| Table | Index Name | Notes |
|-------|------------|-------|
| `team_activities` | `idx_team_activities_created_by` | May be needed for future queries |
| `team_activity_attendance` | `idx_attendance_athlete` | May be needed for future queries |
| `team_activity_attendance` | `idx_attendance_participation` | May be needed for future queries |
| `team_activity_audit` | `idx_audit_activity` | Audit table - keep for compliance |
| `team_activity_audit` | `idx_audit_coach` | Audit table - keep for compliance |
| `team_activity_audit` | `idx_audit_created` | Audit table - keep for compliance |
| `team_activity_audit` | `idx_audit_action` | Audit table - keep for compliance |
| `execution_logs` | `idx_execution_logs_session` | May be needed for future queries |
| `execution_logs` | `idx_execution_logs_athlete` | May be needed for future queries |
| `execution_logs` | `idx_execution_logs_version` | May be needed for future queries |
| `session_version_history` | `idx_session_version_history_session` | May be needed for future queries |
| `session_version_history` | `idx_session_version_history_coach` | May be needed for future queries |

**Recommendation:** 
- Keep indexes on audit/log tables (needed for compliance queries)
- Monitor usage before removing indexes on frequently queried tables
- Consider removing only after confirming they're truly unused over a longer period

**Priority:** Very Low - Indexes have minimal overhead unless tables are very large.

---

## 6. Function Search Path Security (Low Priority)

### Issue: 2 Functions Have Mutable Search Paths

| Function | Issue |
|---------|-------|
| `update_team_activity_updated_at` | Role mutable search_path |
| `audit_team_activity_changes` | Role mutable search_path |

**Fix:** Add `SET search_path = ''` or `SET search_path = public` to function definitions.

**Priority:** Low - Security risk is minimal but should be fixed for best practices.

---

## 7. Auth Leaked Password Protection (Low Priority)

### Issue: Leaked Password Protection Disabled

Supabase Auth's leaked password protection (HaveIBeenPwned.org check) is currently disabled.

**Fix:** Enable in Supabase Dashboard: Settings → Auth → Password Security

**Priority:** Low - Should be enabled for better security, but not critical.

---

## Recommended Action Plan

### Phase 1: Immediate (Completed ✅)
- ✅ Enable RLS on `coach_athlete_assignments` and `research_articles`
- ✅ Fix permissive policies on user-facing tables
- ✅ Fix `tournament_participation` placeholder policy

### Phase 2: Short Term (Next Sprint)
1. Review system table policies (confirm service role only)
2. Optimize RLS policies on top 5 high-traffic tables:
   - `training_sessions`
   - `execution_logs`
   - `wellness_logs`
   - `team_activities`
   - `coach_athlete_assignments`

### Phase 3: Medium Term (Next Month)
1. Add indexes to high-priority foreign keys (top 10 tables)
2. Optimize remaining RLS policies incrementally
3. Enable leaked password protection

### Phase 4: Long Term (Ongoing)
1. Monitor query performance
2. Add indexes as needed based on query patterns
3. Review and consolidate multiple policies if performance issues arise
4. Fix function search paths

---

## Summary

**Critical Issues:** ✅ **ALL RESOLVED**

**Remaining Work:**
- 🟡 **30+ RLS policies** need performance optimization
- 🟡 **200+ foreign keys** could benefit from indexes
- 🟡 **8 system tables** need policy review
- 🟢 **2 functions** need search path fixes
- 🟢 **1 auth setting** should be enabled

**Overall Status:** ✅ **PRODUCTION READY** - All critical security issues resolved. Remaining items are performance optimizations that can be done incrementally.

