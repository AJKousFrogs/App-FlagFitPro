# 🚀 Supabase Debugging Quick Reference

## 📋 Quick Diagnostics

### Check Everything at Once
```bash
cd scripts && ./check-backend-health.sh
```

### Check Specific Issue

| Issue | Command | Expected Output |
|-------|---------|-----------------|
| RLS Policies | `SELECT * FROM get_table_policies('injuries');` | 4 policies (SELECT, INSERT, UPDATE, DELETE) |
| Indexes | `SELECT * FROM check_user_id_index('injuries');` | `idx_injuries_user_id` |
| Schema | `SELECT * FROM get_table_columns('user_profiles');` | All columns listed |
| Triggers | `SELECT tgname FROM pg_trigger WHERE tgname LIKE '%updated_at%';` | 2+ triggers |

## 🔍 Common Errors & Fixes

### Error: "new row violates row-level security policy" (42501)

**Cause:** `user_id` doesn't match `auth.uid()`

**Fix:**
```typescript
// ❌ Wrong
const data = { user_id: someUserId, ... };

// ✅ Correct
const { data: { user } } = await supabase.auth.getUser();
const data = { user_id: user.id, ... };
```

**Debug:**
```typescript
await debugService.testRLSPolicies(supabase, 'injuries', userId);
```

### Error: "column X does not exist" (42703)

**Cause:** Column missing from table

**Fix:**
```sql
ALTER TABLE table_name ADD COLUMN column_name type;
```

**Debug:**
```typescript
await debugService.validateSchema(supabase, 'table_name', ['expected', 'columns']);
```

### Slow Queries (>1s)

**Cause:** Missing index on filtered column

**Fix:**
```sql
CREATE INDEX idx_table_column ON table_name(column_name);
```

**Debug:**
```typescript
await debugService.checkIndexes(supabase, ['table_name']);
```

### Realtime Conflicts

**Cause:** Multiple clients updating same record

**Fix:**
```typescript
const sub = debugService.subscribeWithConflictDetection(
  supabase, 'table', userId,
  (data) => updateUI(data),
  (local, remote) => {
    // Keep newer version
    return new Date(local.updated_at) > new Date(remote.updated_at) 
      ? local : remote;
  }
);
```

## 🛠️ Debug Service API

### Enable Debug Mode
```typescript
debugService.enableDebugMode();  // Turn on detailed logging
debugService.disableDebugMode(); // Turn off
```

### Test Operations
```typescript
// Test insert/upsert
await debugService.testUpsert(supabase, 'injuries', data, { upsert: true });

// Test all RLS policies
await debugService.testRLSPolicies(supabase, 'injuries', userId);

// Check indexes
await debugService.checkIndexes(supabase, ['injuries', 'user_profiles']);

// Validate schema
await debugService.validateSchema(supabase, 'injuries', ['id', 'user_id', 'status']);
```

### Get Statistics
```typescript
const stats = debugService.getQueryStats();
console.log(`Total: ${stats.total}, Failed: ${stats.failed}, Avg: ${stats.avgDuration}ms`);
```

### Export Logs
```typescript
const log = debugService.exportQueryLog();
// Save or send to analytics
```

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

## 🔒 RLS Policy Checklist

- [ ] SELECT policy exists with `USING (user_id = auth.uid())`
- [ ] INSERT policy exists with `WITH CHECK (user_id = auth.uid())`
- [ ] UPDATE policy exists with `USING (user_id = auth.uid())`
- [ ] DELETE policy exists with `USING (user_id = auth.uid())`
- [ ] Table has RLS enabled: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`

## ⚡ Performance Checklist

- [ ] Index on `user_id` for RLS: `CREATE INDEX idx_table_user_id ON table(user_id);`
- [ ] Index on foreign keys
- [ ] Index on frequently filtered columns
- [ ] `updated_at` trigger for optimistic concurrency
- [ ] RLS policies don't use nested subqueries

## 📝 Best Practices

### Always Check Errors
```typescript
const { data, error } = await supabase.from('table').insert(data);
if (error) {
  console.error('Error:', {
    code: error.code,      // e.g., "42501"
    message: error.message, // Human-readable
    details: error.details, // Additional context
    hint: error.hint       // Suggested fix
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

### Use Optimistic Concurrency
```typescript
// Include version in WHERE clause
.update(data)
.eq('id', recordId)
.eq('updated_at', lastKnownVersion)
```

## 📚 Documentation

- **Full Guide:** `docs/SUPABASE_DEBUGGING_GUIDE.md`
- **API Reference:** `docs/SUPABASE_DEBUGGING_TOOLS.md`
- **Example Code:** `docs/EXAMPLE_DEBUG_USAGE.ts`
- **Summary:** `docs/BACKEND_DEBUGGING_SUMMARY.md`

## 🆘 Emergency Checklist

1. ✅ User authenticated? `await supabase.auth.getUser()`
2. ✅ RLS policies exist? `SELECT * FROM get_table_policies('table')`
3. ✅ Indexes present? `SELECT * FROM check_user_id_index('table')`
4. ✅ Schema correct? `SELECT * FROM get_table_columns('table')`
5. ✅ Triggers active? `SELECT tgname FROM pg_trigger WHERE tgname LIKE '%table%'`
6. ✅ Check logs: Supabase Dashboard > Logs > Postgres Logs
7. ✅ Run health check: `./scripts/check-backend-health.sh`

## 💡 Pro Tips

- **Development:** Always enable debug mode: `debugService.enableDebugMode()`
- **Testing:** Run `testRLSPolicies()` on component init
- **Production:** Monitor with `getQueryStats()` and set up alerts for high failure rates
- **Debugging:** Use Debug Console UI at `/debug` for visual debugging
- **Performance:** Check query duration, warn if >1s, optimize if >500ms

## 🎯 Common Patterns

### Save with Error Handling
```typescript
async save(data: any) {
  const dataToSave = {
    ...data,
    user_id: (await this.supabase.auth.getUser()).data.user?.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const result = await this.debugService.testUpsert(
    this.supabase, 'table', dataToSave
  );

  if (!result.success) {
    this.handleError(result.error);
    return null;
  }

  return result.data;
}
```

### Load with Performance Monitoring
```typescript
async load() {
  const start = performance.now();
  const { data, error } = await this.supabase
    .from('table')
    .select('*')
    .eq('user_id', this.userId);
  
  console.log(`Query: ${performance.now() - start}ms`);
  
  if (error) {
    console.error('Load failed:', error);
    return [];
  }
  
  return data;
}
```

### Realtime with Conflicts
```typescript
setupRealtime() {
  this.sub = this.debugService.subscribeWithConflictDetection(
    this.supabase, 'table', this.userId,
    (data) => this.handleUpdate(data),
    (local, remote) => {
      // Last write wins
      return new Date(local.updated_at) > new Date(remote.updated_at)
        ? local : remote;
    }
  );
}
```

---

**Need More Help?**
- 📖 Read full guide: `docs/SUPABASE_DEBUGGING_GUIDE.md`
- 🧪 Run tests: `npm test tests/supabase-debug.test.ts`
- 🔍 Use Debug Console: Navigate to `/debug`
- 💬 Check logs: Supabase Dashboard > Logs

**Remember:** Most issues are RLS policy or schema mismatches. Check those first!
