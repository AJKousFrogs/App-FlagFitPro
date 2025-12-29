# Performance Validation Guide

This document covers performance validation for consent-aware views, dashboard endpoints, and deletion processing.

---

## Table of Contents

1. [Performance Targets](#performance-targets)
2. [Running Validation](#running-validation)
3. [EXPLAIN ANALYZE Guide](#explain-analyze-guide)
4. [Index Strategy](#index-strategy)
5. [Load Testing](#load-testing)
6. [What to Check When Slow](#what-to-check-when-slow)
7. [Monitoring](#monitoring)

---

## Performance Targets

| Operation | Target | Notes |
|-----------|--------|-------|
| Consent view read (single) | < 100ms | Single player lookup |
| Dashboard load | < 500ms | Full coach dashboard |
| Batch player read (20) | < 200ms | Team overview |
| Batch player read (50) | < 500ms | Large team |
| Batch player read (100) | < 1000ms | Very large team |
| Deletion queue processing | < 1000ms | Batch of 100 |
| Player own data read | < 50ms | No consent checks needed |

### Why These Targets?

- **100ms consent view**: Users perceive < 100ms as instant
- **500ms dashboard**: Acceptable for complex aggregations
- **1000ms deletion**: Background job, not user-facing

---

## Running Validation

### Full Validation

```bash
npm run perf:validate
# or
node scripts/performance-validation.cjs
```

### EXPLAIN ANALYZE Only

```bash
node scripts/performance-validation.cjs --explain-only
```

### Load Tests Only

```bash
node scripts/performance-validation.cjs --load-test
```

### CI Mode (JSON Output)

```bash
node scripts/performance-validation.cjs --ci
```

### Sample Output

```
🚀 Performance Validation

======================================================================

📊 Running EXPLAIN ANALYZE on Consent Views

   Analyzing v_load_monitoring_consent...
   ✅ v_load_monitoring_consent: 45.23ms (target: 100ms)
   
   Analyzing v_workout_logs_consent...
   ✅ v_workout_logs_consent: 38.15ms (target: 100ms)

🔍 Reviewing Indexes for Consent Join Patterns

   ✅ team_sharing_settings: Index exists for [user_id, team_id]
   ⚠️  team_members: Missing index for [team_id, user_id, role, status]

⚡ Running Load Tests

   ✅ 20 players: 156ms (target: 200ms)
   ✅ 50 players: 389ms (target: 500ms)
   ❌ 100 players: 1234ms EXCEEDS target 1000ms

======================================================================

📊 SUMMARY

   ✅ Passed:   6
   ❌ Failed:   1
   ⚠️  Warnings: 1

📋 RECOMMENDATIONS

   🔴 [HIGH] Add 1 missing indexes for consent join patterns
   
   CREATE INDEX idx_team_members_team_user_role_status 
   ON team_members (team_id, user_id, role, status);
```

---

## EXPLAIN ANALYZE Guide

### Running EXPLAIN ANALYZE Manually

```sql
-- Basic EXPLAIN ANALYZE
EXPLAIN ANALYZE
SELECT * FROM v_load_monitoring_consent
WHERE player_id = 'uuid-here'
LIMIT 100;

-- With buffer information
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM v_load_monitoring_consent
WHERE player_id = 'uuid-here'
LIMIT 100;

-- JSON format for parsing
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT * FROM v_load_monitoring_consent
WHERE player_id = 'uuid-here'
LIMIT 100;
```

### What to Look For

#### Good Signs ✅

```
Index Scan using idx_load_monitoring_player_date on load_monitoring
  Index Cond: (player_id = 'uuid'::uuid)
  Rows Removed by Filter: 0
  Actual time: 0.015..0.023
```

- **Index Scan**: Using an index
- **Low actual time**: Fast execution
- **Few rows removed**: Efficient filtering

#### Bad Signs ❌

```
Seq Scan on load_monitoring
  Filter: (player_id = 'uuid'::uuid)
  Rows Removed by Filter: 50000
  Actual time: 125.456..234.567
```

- **Seq Scan**: Full table scan
- **High rows removed**: Inefficient filtering
- **High actual time**: Slow execution

### Common Issues

| Issue | Symptom | Fix |
|-------|---------|-----|
| Missing index | Seq Scan on large table | Add index on filter columns |
| Wrong index | Index Scan but slow | Check index column order |
| Nested loops | Nested Loop with high rows | Add composite index |
| Sort operation | Sort with high cost | Add index with ORDER BY columns |

---

## Index Strategy

### Consent View Indexes

The consent views perform these join patterns:

```sql
-- Coach checking consent
SELECT ... FROM team_members coach_tm
JOIN team_members player_tm ON coach_tm.team_id = player_tm.team_id
WHERE coach_tm.user_id = auth.uid()
AND coach_tm.role IN ('coach', 'assistant_coach', 'head_coach', 'admin')
AND coach_tm.status = 'active'
AND player_tm.user_id = target_player_id
AND player_tm.status = 'active'
AND check_performance_sharing(target_player_id, coach_tm.team_id)
```

### Required Indexes

```sql
-- Fast consent lookup
CREATE INDEX idx_team_sharing_settings_consent_lookup
ON team_sharing_settings (user_id, team_id)
WHERE performance_sharing_enabled = true;

-- Fast coach membership
CREATE INDEX idx_team_members_active_coaches
ON team_members (team_id, user_id)
WHERE role IN ('coach', 'assistant_coach', 'head_coach', 'admin') 
AND status = 'active';

-- Fast player data queries
CREATE INDEX idx_load_monitoring_player_date
ON load_monitoring (player_id, calculated_at DESC);
```

### Applying Index Migration

```bash
# Apply the index migration
npm run migrate -- 074_consent_performance_indexes.sql

# Or manually in Supabase SQL editor
-- Copy contents of database/migrations/074_consent_performance_indexes.sql
```

### Verifying Indexes

```sql
-- Check if indexes exist
SELECT * FROM verify_consent_indexes();

-- Check index usage
SELECT 
  schemaname,
  relname as table,
  indexrelname as index,
  idx_scan as scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

---

## Load Testing

### Test Scenarios

#### 1. Coach Dashboard Load

Simulates a coach loading their team dashboard:

```javascript
// Query pattern
const { data } = await supabase
  .from('v_load_monitoring_consent')
  .select('*')
  .in('player_id', teamMemberIds)
  .order('calculated_at', { ascending: false })
  .limit(playerCount);
```

| Players | Target | Typical |
|---------|--------|---------|
| 20 | 200ms | 100-150ms |
| 50 | 500ms | 250-400ms |
| 100 | 1000ms | 500-800ms |

#### 2. Player Dashboard Load

Simulates a player viewing their own data:

```javascript
// Query pattern (no consent checks needed)
const { data } = await supabase
  .from('load_monitoring')
  .select('*')
  .eq('player_id', userId)
  .order('calculated_at', { ascending: false })
  .limit(30);
```

| Target | Typical |
|--------|---------|
| 100ms | 20-50ms |

#### 3. Deletion Queue Processing

Simulates batch deletion processing:

```javascript
// Query pattern
const { data } = await supabase
  .from('account_deletion_requests')
  .select('*')
  .eq('status', 'pending')
  .lt('grace_period_ends_at', new Date().toISOString())
  .limit(100);
```

| Target | Typical |
|--------|---------|
| 1000ms | 50-200ms |

### Running Custom Load Tests

```javascript
// Example: Test specific query
const iterations = 100;
const times = [];

for (let i = 0; i < iterations; i++) {
  const start = Date.now();
  await supabase.from('v_load_monitoring_consent').select('*').limit(50);
  times.push(Date.now() - start);
}

const avg = times.reduce((a, b) => a + b, 0) / times.length;
const p95 = times.sort((a, b) => a - b)[Math.floor(iterations * 0.95)];

console.log(`Average: ${avg}ms, P95: ${p95}ms`);
```

---

## What to Check When Slow

### Step 1: Identify the Slow Query

```sql
-- Check slow queries in Supabase
SELECT 
  query,
  calls,
  mean_time,
  max_time,
  stddev_time
FROM pg_stat_statements
WHERE query LIKE '%v_load_monitoring_consent%'
ORDER BY mean_time DESC
LIMIT 10;
```

### Step 2: Run EXPLAIN ANALYZE

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
-- paste the slow query here
```

### Step 3: Check for Missing Indexes

Look for:
- `Seq Scan` on large tables
- `Nested Loop` with high row counts
- `Sort` operations without index

### Step 4: Check Table Statistics

```sql
-- Check if statistics are up to date
SELECT 
  relname,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE relname IN ('load_monitoring', 'team_members', 'team_sharing_settings');

-- Update statistics if needed
ANALYZE load_monitoring;
ANALYZE team_members;
ANALYZE team_sharing_settings;
```

### Step 5: Check Connection Pool

```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Check for blocking queries
SELECT 
  blocked_locks.pid AS blocked_pid,
  blocking_locks.pid AS blocking_pid,
  blocked_activity.query AS blocked_query
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_locks blocking_locks 
  ON blocking_locks.locktype = blocked_locks.locktype
WHERE NOT blocked_locks.granted;
```

### Common Fixes

| Problem | Solution |
|---------|----------|
| Missing index | Add index on filter/join columns |
| Outdated stats | Run ANALYZE on affected tables |
| Too many connections | Check connection pooling |
| Lock contention | Review transaction isolation |
| Large result sets | Add pagination/limits |

---

## Monitoring

### Supabase Dashboard

1. Go to **Database** → **Query Performance**
2. Look for queries with:
   - High mean execution time
   - High call count
   - No index usage

### Setting Up Alerts

```sql
-- Create alert for slow consent view queries
CREATE OR REPLACE FUNCTION alert_slow_consent_queries()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.mean_time > 100 AND NEW.query LIKE '%consent%' THEN
    -- Log or alert
    RAISE WARNING 'Slow consent query detected: % (mean: %ms)', 
      NEW.query, NEW.mean_time;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Key Metrics to Monitor

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Consent view P95 | < 100ms | > 200ms |
| Dashboard P95 | < 500ms | > 1000ms |
| Index hit ratio | > 99% | < 95% |
| Cache hit ratio | > 95% | < 90% |

### Grafana Dashboard (if available)

Key panels:
1. Query latency histogram
2. Index scan vs seq scan ratio
3. Active connections
4. Cache hit ratio

---

## Related Documentation

- [Safety Access Layer](./SAFETY_ACCESS_LAYER.md) - Consent view usage
- [Database Migrations](../database/migrations/) - Index definitions
- [Supabase Docs](https://supabase.com/docs/guides/database/query-optimization) - Query optimization

---

*Last updated: 29. December 2025*
*Športno društvo Žabe - Athletes helping athletes since 2020*

