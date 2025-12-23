# Deployment Checklist: Service Migration

Use this checklist to safely deploy the migrated services to production.

## Pre-Deployment (Development/Staging)

### ✅ Step 1: Database Migration

- [ ] Review `database/migrations/051_add_service_migration_tables.sql`
- [ ] Backup current database
- [ ] Run migration on staging environment
- [ ] Verify all 6 tables were created:
  - [ ] `wellness_entries`
  - [ ] `recovery_sessions`
  - [ ] `nutrition_logs`
  - [ ] `nutrition_goals`
  - [ ] `supplement_logs`
  - [ ] `performance_tests`

**Command:**

```bash
# Via Supabase CLI
supabase db push

# Or manually
psql -h [staging-host] -U postgres -f database/migrations/051_add_service_migration_tables.sql
```

### ✅ Step 2: Verify RLS Policies

- [ ] Check RLS is enabled on all 6 tables
- [ ] Test that users can only see their own data
- [ ] Test INSERT, UPDATE, DELETE permissions
- [ ] Verify policy performance (should use indexes)

**SQL Check:**

```sql
-- Verify RLS enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN (
  'wellness_entries', 'recovery_sessions',
  'nutrition_logs', 'nutrition_goals',
  'supplement_logs', 'performance_tests'
);

-- Should show TRUE for all tables
```

### ✅ Step 3: Verify Indexes

- [ ] Check all indexes were created
- [ ] Run EXPLAIN ANALYZE on common queries
- [ ] Verify query plans use indexes

**SQL Check:**

```sql
SELECT tablename, indexname
FROM pg_indexes
WHERE tablename IN (
  'wellness_entries', 'recovery_sessions',
  'nutrition_logs', 'nutrition_goals',
  'supplement_logs', 'performance_tests'
)
ORDER BY tablename, indexname;
```

### ✅ Step 4: Code Review

- [ ] Review all 7 migrated service files
- [ ] Verify no references to `ApiService` remain
- [ ] Check error handling is comprehensive
- [ ] Verify logging statements are appropriate
- [ ] Confirm all methods return correct types

**Files to Review:**

1. `angular/src/app/core/services/wellness.service.ts`
2. `angular/src/app/core/services/recovery.service.ts`
3. `angular/src/app/core/services/nutrition.service.ts`
4. `angular/src/app/core/services/performance-data.service.ts`
5. `angular/src/app/core/services/training-data.service.ts`
6. `angular/src/app/core/services/acwr.service.ts`
7. `angular/src/app/core/services/load-monitoring.service.ts`

### ✅ Step 5: Linting & Type Checking

- [ ] Run ESLint: `npm run lint`
- [ ] Fix any linting errors
- [ ] Run TypeScript check: `npm run build`
- [ ] Verify no type errors

**Commands:**

```bash
cd angular
npm run lint
npm run build
```

### ✅ Step 6: Local Testing

#### Wellness Service

- [ ] Log wellness entry
- [ ] Fetch wellness data (7d, 30d, 3m)
- [ ] Verify averages calculation
- [ ] Check wellness score calculation
- [ ] Test recommendations

#### Recovery Service

- [ ] Fetch recovery metrics
- [ ] Start recovery session
- [ ] Complete recovery session
- [ ] Stop recovery session
- [ ] Verify session persistence

#### Nutrition Service

- [ ] Log food entry
- [ ] Fetch today's meals
- [ ] Get nutrition goals
- [ ] Test meal grouping by type
- [ ] Verify performance insights

#### Performance Data Service

- [ ] Log physical measurement
- [ ] Fetch measurements with timeframe
- [ ] Log supplement
- [ ] Check compliance calculation
- [ ] Log performance test
- [ ] Fetch tests by type

#### ACWR Service (Critical!)

- [ ] Verify historical data loads
- [ ] Test real-time subscriptions
- [ ] Add new session
- [ ] Verify ACWR recalculation
- [ ] Check risk zone detection

#### Load Monitoring Service

- [ ] Create session with load data
- [ ] Verify session persists to DB
- [ ] Check load calculations
- [ ] Test wellness factor integration

#### Training Data Service

- [ ] Fetch training sessions
- [ ] Create training session
- [ ] Update training session
- [ ] Delete training session
- [ ] Get training stats

### ✅ Step 7: Integration Testing

- [ ] Test cross-service interactions (ACWR ↔ Load Monitoring)
- [ ] Verify real-time updates work
- [ ] Test with multiple user accounts
- [ ] Verify data isolation (User A can't see User B's data)
- [ ] Test error scenarios (network failures, invalid data)

### ✅ Step 8: Performance Testing

- [ ] Measure query response times
- [ ] Test with realistic data volumes (100+ records)
- [ ] Check memory usage in browser
- [ ] Verify no memory leaks in subscriptions
- [ ] Test concurrent user sessions

**Targets:**

- Simple queries: < 100ms
- Complex aggregations: < 300ms
- Real-time latency: < 500ms

### ✅ Step 9: Security Testing

- [ ] Test authentication edge cases (expired token, no token)
- [ ] Verify RLS prevents unauthorized access
- [ ] Test SQL injection protection (Supabase handles this)
- [ ] Check for sensitive data in logs
- [ ] Verify no API keys exposed in code

### ✅ Step 10: Documentation Review

- [ ] Read `MIGRATION_PROGRESS_REPORT.md`
- [ ] Review `MIGRATION_CONTINUATION_SUMMARY.md`
- [ ] Check `QUICK_REFERENCE_MIGRATION.md`
- [ ] Verify `angular/MIGRATION_GUIDE.md` is up-to-date

## Production Deployment

### ✅ Step 11: Production Database Migration

**⚠️ IMPORTANT: Backup first!**

- [ ] Create full database backup
- [ ] Document current table counts
- [ ] Schedule maintenance window (if needed)
- [ ] Run migration SQL on production
- [ ] Verify tables created
- [ ] Verify RLS policies active
- [ ] Verify indexes created

**Command:**

```bash
# Backup first!
pg_dump -h [prod-host] -U postgres -d postgres > backup_$(date +%Y%m%d).sql

# Apply migration
psql -h [prod-host] -U postgres -d postgres -f database/migrations/051_add_service_migration_tables.sql
```

### ✅ Step 12: Smoke Test Production

- [ ] Deploy Angular app to production
- [ ] Test login/logout
- [ ] Log one wellness entry
- [ ] Create one recovery session
- [ ] Log one food entry
- [ ] Log one supplement
- [ ] Record one performance test
- [ ] Verify data appears correctly

### ✅ Step 13: Monitor Production

- [ ] Check Supabase dashboard for errors
- [ ] Monitor query performance metrics
- [ ] Watch for RLS policy violations
- [ ] Check application logs for errors
- [ ] Monitor user reports/feedback

**Monitoring Checklist (First 24 hours):**

- [ ] Hour 1: Check every 15 minutes
- [ ] Hour 2-4: Check hourly
- [ ] Hour 5-24: Check every 4 hours
- [ ] Day 2-7: Daily monitoring

### ✅ Step 14: Rollback Plan (If Needed)

If critical issues occur:

1. **Quick Rollback:**

   ```bash
   # Revert to previous Angular deployment
   # Keep new tables but stop using them
   ```

2. **Database Rollback:**

   ```sql
   -- Only if absolutely necessary
   DROP TABLE IF EXISTS wellness_entries CASCADE;
   DROP TABLE IF EXISTS recovery_sessions CASCADE;
   DROP TABLE IF EXISTS nutrition_logs CASCADE;
   DROP TABLE IF EXISTS nutrition_goals CASCADE;
   DROP TABLE IF EXISTS supplement_logs CASCADE;
   DROP TABLE IF EXISTS performance_tests CASCADE;
   ```

3. **Restore Backup:**
   ```bash
   psql -h [prod-host] -U postgres -d postgres < backup_YYYYMMDD.sql
   ```

## Post-Deployment

### ✅ Step 15: Deprecate Old Endpoints (After 1 Week)

- [ ] Identify Netlify Functions no longer used
- [ ] Add deprecation warnings
- [ ] Monitor for any remaining calls
- [ ] Remove deprecated functions after 2 weeks

**Functions to Deprecate:**

- `/api/wellness` (GET, POST)
- `/api/recovery/metrics`
- `/api/recovery/sessions`
- `/api/nutrition/goals`
- `/api/nutrition/meals`
- `/api/performance/measurements`
- `/api/performance/supplements`
- `/api/performance/tests`

### ✅ Step 16: Optimization

- [ ] Review slow query logs
- [ ] Add indexes if needed
- [ ] Consider materialized views for complex aggregations
- [ ] Implement caching strategies
- [ ] Add database functions for complex calculations

### ✅ Step 17: Documentation Update

- [ ] Update API documentation
- [ ] Update team wiki/confluence
- [ ] Create runbook for common issues
- [ ] Document lessons learned
- [ ] Update onboarding materials for new developers

## Success Criteria

Migration is successful when:

- ✅ All 7 services work without API calls
- ✅ No RLS policy violations in logs
- ✅ Query performance meets targets (< 300ms avg)
- ✅ Zero data loss
- ✅ User experience unchanged or improved
- ✅ No critical bugs reported in first week
- ✅ Cost reduction from fewer Netlify Function calls

## Emergency Contacts

**Database Issues:**

- Supabase Support: [dashboard]
- Team DBA: [contact]

**Application Issues:**

- Lead Developer: [contact]
- DevOps: [contact]

**User Impact:**

- Product Manager: [contact]
- Customer Support: [contact]

## Metrics to Track

### Performance Metrics

- [ ] Average query response time
- [ ] 95th percentile response time
- [ ] Error rate
- [ ] Database connection pool usage

### Business Metrics

- [ ] User engagement (wellness logs per day)
- [ ] Feature adoption (recovery sessions started)
- [ ] Data completeness (% of users logging data)
- [ ] User satisfaction (support tickets, feedback)

### Cost Metrics

- [ ] Netlify Function invocations (should decrease)
- [ ] Supabase database size
- [ ] Supabase bandwidth usage
- [ ] Overall infrastructure cost

## Sign-Off

### Development Team

- [ ] Lead Developer: \_\_\_\_\_\_\_\_ Date: \_\_\_\_\_\_\_\_
- [ ] QA Engineer: \_\_\_\_\_\_\_\_ Date: \_\_\_\_\_\_\_\_
- [ ] DevOps: \_\_\_\_\_\_\_\_ Date: \_\_\_\_\_\_\_\_

### Product Team

- [ ] Product Manager: \_\_\_\_\_\_\_\_ Date: \_\_\_\_\_\_\_\_
- [ ] UX Designer: \_\_\_\_\_\_\_\_ Date: \_\_\_\_\_\_\_\_

### Stakeholders

- [ ] Tech Lead: \_\_\_\_\_\_\_\_ Date: \_\_\_\_\_\_\_\_
- [ ] CTO: \_\_\_\_\_\_\_\_ Date: \_\_\_\_\_\_\_\_

---

## Notes

Use this space to document any issues, workarounds, or learnings during deployment:

```
[Date] [Name] [Note]
_____________________________________________
_____________________________________________
_____________________________________________
_____________________________________________
```

---

**Status:** 📋 Ready for Deployment
**Version:** 1.0
**Last Updated:** December 23, 2024
