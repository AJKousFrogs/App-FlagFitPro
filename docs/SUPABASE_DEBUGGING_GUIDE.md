# Supabase Debugging Guide

**Last Updated:** January 2026  
**Status:** ✅ Production Ready

---

## 📋 Quick Diagnostics

### Run Health Check

```bash
cd scripts && ./check-backend-health.sh
```

### Quick Commands

| Issue          | SQL Command                                                       | Expected               |
| -------------- | ----------------------------------------------------------------- | ---------------------- |
| Check RLS      | `SELECT * FROM get_table_policies('injuries');`                   | 4 policies             |
| Check Indexes  | `SELECT * FROM check_user_id_index('injuries');`                  | `idx_injuries_user_id` |
| Check Schema   | `SELECT * FROM get_table_columns('user_profiles');`               | All columns            |
| Check Triggers | `SELECT tgname FROM pg_trigger WHERE tgname LIKE '%updated_at%';` | 2+ triggers            |

---

## 🚀 Setup

### 1. Enable Query Logging

In Supabase Dashboard SQL Editor:

```sql
ALTER DATABASE postgres SET log_statement = 'all';
ALTER DATABASE postgres SET log_duration = 'on';
```

Check logs: Dashboard > Logs > Postgres Logs

### 2. Import Debug Service

```typescript
import { SupabaseDebugService } from '@core/services/supabase-debug.service';

constructor(private debugService: SupabaseDebugService) {
  this.debugService.enableDebugMode();
}
```

---

## 🔍 Common Errors & Fixes

### Error: RLS Policy Violation (42501)

**Error:**

```
Error: new row violates row-level security policy
Code: 42501
```

**Cause:** `user_id` doesn't match `auth.uid()`

**Debug:**

```typescript
// Check current user
const {
  data: { user },
} = await supabase.auth.getUser();
console.log("Current user:", user?.id);

// Test policies
await this.debugService.testRLSPolicies(this.supabase, "injuries", userId);
```

**Fix:**

```typescript
// ❌ Wrong
const data = { user_id: someUserId, ... };

// ✅ Correct
const { data: { user } } = await supabase.auth.getUser();
const data = { user_id: user.id, ... };
```

**SQL Fix:**

```sql
-- Ensure INSERT policy with WITH CHECK
CREATE POLICY "Users can insert own data" ON injuries
  FOR INSERT WITH CHECK (user_id = auth.uid());
```

---

### Error: Column Does Not Exist (42703)

**Error:**

```
Error: column "pain_level" does not exist
Code: 42703
```

**Debug:**

```typescript
const result = await this.debugService.validateSchema(
  this.supabase,
  "daily_wellness_checkin",
  ["pain_level", "user_id", "created_at"],
);
console.log("Missing columns:", result.missing);
```

**SQL Check:**

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'daily_wellness_checkin';
```

**Fix:**

```sql
ALTER TABLE table_name ADD COLUMN column_name type;
```

---

### Slow Queries (>1s)

**Symptoms:** High latency, timeouts, slow RLS evaluation

**Debug:**

```typescript
const indexes = await this.debugService.checkIndexes(this.supabase, [
  "injuries",
  "user_profiles",
  "daily_wellness_checkin",
]);
console.table(indexes);
```

**SQL Check:**

```sql
SELECT * FROM check_user_id_index('injuries');
```

**Fix:**

```sql
CREATE INDEX IF NOT EXISTS idx_injuries_user_id ON injuries(user_id);
```

---

### Realtime Conflicts

**Symptoms:** Data overwritten, race conditions, inconsistent state

**Debug & Fix:**

```typescript
const subscription = this.debugService.subscribeWithConflictDetection(
  this.supabase,
  "table",
  userId,
  (data) => this.updateUI(data),
  (local, remote) => {
    // Strategy: Keep newer version
    return new Date(local.updated_at) > new Date(remote.updated_at)
      ? local
      : remote;
  },
);
```

**Optimistic Concurrency:**

```typescript
// Include version check in WHERE
const { error } = await supabase
  .from("injuries")
  .update({ status: "recovered" })
  .eq("id", recordId)
  .eq("updated_at", lastKnownVersion);

if (error) {
  // Conflict! Refresh data
  await this.refreshData();
}
```

---

### Foreign Key Violations

**Error:**

```
Error: insert or update on table "injuries" violates foreign key constraint
```

**Debug:**

```sql
SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'injuries';
```

**Fix:** Verify referenced data exists before insert.

---

## 🛠️ Debug Service API

### Enable/Disable

```typescript
debugService.enableDebugMode(); // Turn on detailed logging
debugService.disableDebugMode(); // Turn off
```

### Test Operations

```typescript
// Test insert/upsert
await debugService.testUpsert(supabase, "injuries", data, { upsert: true });

// Test all RLS policies
await debugService.testRLSPolicies(supabase, "injuries", userId);

// Check indexes
await debugService.checkIndexes(supabase, ["injuries", "user_profiles"]);

// Validate schema
await debugService.validateSchema(supabase, "injuries", [
  "id",
  "user_id",
  "status",
]);
```

### Performance Stats

```typescript
const stats = debugService.getQueryStats();
console.log(
  `Total: ${stats.total}, Failed: ${stats.failed}, Avg: ${stats.avgDuration}ms`,
);

// Export for analysis
const log = debugService.exportQueryLog();
```

### Realtime with Conflict Detection

```typescript
const subscription = debugService.subscribeWithConflictDetection(
  supabase,
  "table",
  userId,
  (data) => handleUpdate(data), // onUpdate callback
  (local, remote) => remote, // onConflict resolver
);

// Returns: { channel, updateLocal, unsubscribe }
subscription.unsubscribe();
```

---

## 📊 SQL Helper Functions

```sql
-- Check for user_id index
SELECT * FROM check_user_id_index('table_name');

-- Get all columns
SELECT * FROM get_table_columns('table_name');

-- List all indexes
SELECT * FROM get_table_indexes('table_name');

-- View RLS policies
SELECT * FROM get_table_policies('table_name');
```

---

## 🔒 RLS Checklist

- [ ] Table has RLS enabled: `ALTER TABLE name ENABLE ROW LEVEL SECURITY;`
- [ ] SELECT policy: `USING (user_id = auth.uid())`
- [ ] INSERT policy: `WITH CHECK (user_id = auth.uid())`
- [ ] UPDATE policy: `USING (user_id = auth.uid())`
- [ ] DELETE policy: `USING (user_id = auth.uid())`

---

## ⚡ Performance Checklist

- [ ] Index on `user_id` for RLS performance
- [ ] Index on foreign keys
- [ ] Index on frequently filtered columns
- [ ] `updated_at` trigger for optimistic concurrency
- [ ] RLS policies don't use nested subqueries

---

## 📝 Best Practices

### Always Check Errors

```typescript
const { data, error } = await supabase.from("table").insert(data);
if (error) {
  console.error("Error:", {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  });
}
```

### Filter in Query, Not Code

```typescript
// ✅ Good
.select('*').eq('user_id', userId)

// ❌ Bad
.select('*').then(data => data.filter(row => row.user_id === userId))
```

### Clean Up Subscriptions

```typescript
ngOnDestroy() {
  if (this.subscription) {
    await supabase.removeChannel(this.subscription);
  }
}
```

---

## 🆘 Emergency Checklist

1. ✅ User authenticated? `await supabase.auth.getUser()`
2. ✅ RLS policies exist? `SELECT * FROM get_table_policies('table')`
3. ✅ Indexes present? `SELECT * FROM check_user_id_index('table')`
4. ✅ Schema correct? `SELECT * FROM get_table_columns('table')`
5. ✅ Triggers active? `SELECT tgname FROM pg_trigger WHERE tgname LIKE '%table%'`
6. ✅ Check logs: Supabase Dashboard > Logs > Postgres Logs
7. ✅ Run health check: `./scripts/check-backend-health.sh`

---

## 💡 Pro Tips

- **Development:** Always enable debug mode
- **Testing:** Run `testRLSPolicies()` on component init
- **Production:** Monitor with `getQueryStats()` - alert on high failure rates
- **Performance:** Warn if query > 500ms, optimize if > 1s

---

## 🔐 Security Notes

1. **Never expose debug console in production** - restrict to admin users
2. **Be careful with query logging** - may log sensitive data
3. **Clear logs regularly** - don't commit to git
4. **Test data cleanup** - verify no test data in production

---

## 📚 Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Database Performance](https://supabase.com/docs/guides/database/performance)
- `angular/src/app/examples/debugging-signals-examples.ts` - Code examples

---

**Most issues are RLS policy or schema mismatches. Check those first!**
