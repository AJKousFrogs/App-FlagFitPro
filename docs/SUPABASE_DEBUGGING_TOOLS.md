# Supabase Backend Debugging Tools

## 📦 What's Included

This debugging toolkit provides comprehensive tools for troubleshooting Supabase backend issues:

1. **Angular Debug Service** - Client-side debugging with detailed logging
2. **SQL Helper Functions** - Database introspection utilities
3. **Test Suite** - Automated tests for RLS, schema, and realtime
4. **Debug Console UI** - Interactive debugging interface
5. **Health Check Script** - Quick backend health validation
6. **Documentation** - Complete debugging guide

## 🚀 Quick Start

### 1. Apply Database Migrations

The debug helper functions have already been deployed to your Supabase database via migrations:
- `add_debug_helper_functions`
- `fix_debug_functions_drop_and_recreate`

To verify:
```sql
-- In Supabase Dashboard SQL Editor
SELECT proname FROM pg_proc 
WHERE proname IN ('check_user_id_index', 'get_table_columns', 'get_table_indexes', 'get_table_policies');
```

### 2. Import Debug Service in Angular

```typescript
import { SupabaseDebugService } from '@core/services/supabase-debug.service';

constructor(private debugService: SupabaseDebugService) {
  // Enable debug mode for detailed logging
  this.debugService.enableDebugMode();
}
```

### 3. Run Health Check Script

```bash
cd scripts
export DATABASE_URL="postgresql://..."  # Your Supabase connection string
./check-backend-health.sh
```

### 4. Use Debug Console (Optional)

Add the debug console component to your app:

```typescript
// In your routing module
{
  path: 'debug',
  component: DebugConsoleComponent,
  canActivate: [AdminGuard] // Restrict to admins only
}
```

## 🔍 Common Debugging Scenarios

### Scenario 1: RLS Policy Violation Error

**Error:**
```
Error: new row violates row-level security policy
Code: 42501
```

**Debug Steps:**

1. **Check policies in Angular:**
```typescript
const result = await this.debugService.testRLSPolicies(
  this.supabase,
  'injuries',
  userId
);
console.log('RLS Test Results:', result);
```

2. **Check policies in SQL:**
```sql
SELECT * FROM get_table_policies('injuries');
```

3. **Verify user_id matches:**
```typescript
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user?.id);
console.log('Data user_id:', data.user_id);
// These MUST match for RLS to pass
```

**Fix:**
```typescript
// Ensure user_id is set correctly
const injuryData = {
  user_id: (await supabase.auth.getUser()).data.user?.id,
  injury_type: 'sprain',
  // ... other fields
};
```

### Scenario 2: Column Does Not Exist

**Error:**
```
Error: column "pain_level" does not exist
Code: 42703
```

**Debug Steps:**

1. **Validate schema:**
```typescript
const result = await this.debugService.validateSchema(
  this.supabase,
  'daily_wellness_checkin',
  ['pain_level', 'user_id', 'created_at']
);
console.log('Missing columns:', result.missing);
```

2. **Check in SQL:**
```sql
SELECT * FROM get_table_columns('daily_wellness_checkin');
```

**Fix:**
```sql
-- Add missing column via migration
ALTER TABLE daily_wellness_checkin 
ADD COLUMN pain_level integer CHECK (pain_level BETWEEN 0 AND 10);
```

### Scenario 3: Slow Queries / Missing Indexes

**Symptoms:**
- Queries taking > 1 second
- RLS policy evaluation is slow
- Timeout errors

**Debug Steps:**

1. **Check indexes in Angular:**
```typescript
const indexes = await this.debugService.checkIndexes(
  this.supabase,
  ['injuries', 'user_profiles', 'daily_wellness_checkin']
);
console.table(indexes);
```

2. **Check in SQL:**
```sql
SELECT * FROM check_user_id_index('injuries');
```

**Fix:**
```sql
-- Add index on user_id for RLS performance
CREATE INDEX IF NOT EXISTS idx_injuries_user_id ON injuries(user_id);
```

### Scenario 4: Realtime Conflicts

**Symptoms:**
- Data overwritten by older versions
- Race conditions
- Inconsistent state

**Debug Steps:**

1. **Set up conflict detection:**
```typescript
const subscription = this.debugService.subscribeWithConflictDetection(
  this.supabase,
  'injuries',
  userId,
  (data) => {
    // Handle update
    this.updateLocalState(data);
  },
  (local, remote) => {
    // Resolve conflict
    console.warn('Conflict detected:', { local, remote });
    
    // Strategy 1: Last write wins
    return remote;
    
    // Strategy 2: Keep newer version
    const localTime = new Date(local.updated_at).getTime();
    const remoteTime = new Date(remote.updated_at).getTime();
    return localTime > remoteTime ? local : remote;
    
    // Strategy 3: Merge changes
    return { ...local, ...remote };
  }
);
```

**Fix:**
```typescript
// Always include version check
const { error } = await supabase
  .from('injuries')
  .update({ status: 'recovered' })
  .eq('id', injuryId)
  .eq('updated_at', lastKnownVersion); // Prevent overwrites

if (error) {
  // Conflict! Refresh data
  await this.refreshData();
}
```

## 🛠️ API Reference

### SupabaseDebugService

#### `enableDebugMode()`
Enables detailed logging for all Supabase operations.

#### `disableDebugMode()`
Disables debug logging.

#### `testUpsert(supabase, table, data, options)`
Test insert/upsert with detailed error logging.

**Parameters:**
- `supabase`: SupabaseClient instance
- `table`: Table name
- `data`: Data to insert
- `options`: `{ upsert?: boolean, onConflict?: string }`

**Returns:**
```typescript
{
  success: boolean;
  error?: any;
  data?: any;
}
```

#### `testRLSPolicies(supabase, table, userId)`
Test all RLS policies (SELECT, INSERT, UPDATE, DELETE).

**Returns:**
```typescript
{
  passed: boolean;
  results: Array<{
    operation: string;
    success: boolean;
    error?: any;
  }>;
}
```

#### `checkIndexes(supabase, tables)`
Check for indexes on user_id columns.

**Returns:**
```typescript
Array<{
  table: string;
  hasIndex: boolean;
  indexName?: string;
}>
```

#### `validateSchema(supabase, table, expectedColumns)`
Validate table schema against expected columns.

**Returns:**
```typescript
{
  valid: boolean;
  missing: string[];
  extra: string[];
}
```

#### `subscribeWithConflictDetection(supabase, table, userId, onUpdate, onConflict)`
Subscribe to realtime with automatic conflict detection.

**Parameters:**
- `onUpdate`: Callback for updates
- `onConflict`: Callback for conflicts - returns resolved data

**Returns:**
```typescript
{
  channel: RealtimeChannel;
  updateLocal: (id, data) => void;
  unsubscribe: () => void;
}
```

#### `getQueryStats()`
Get performance statistics.

**Returns:**
```typescript
{
  total: number;
  successful: number;
  failed: number;
  avgDuration: number;
  byTable: { [table: string]: number };
}
```

### SQL Helper Functions

#### `check_user_id_index(table_name)`
Check if table has user_id index.

```sql
SELECT * FROM check_user_id_index('injuries');
```

#### `get_table_columns(table_name)`
Get all columns for a table.

```sql
SELECT * FROM get_table_columns('user_profiles');
```

#### `get_table_indexes(table_name)`
Get all indexes for a table.

```sql
SELECT * FROM get_table_indexes('injuries');
```

#### `get_table_policies(table_name)`
Get RLS policies for a table.

```sql
SELECT * FROM get_table_policies('injuries');
```

## 📊 Performance Monitoring

### View Query Statistics

```typescript
const stats = this.debugService.getQueryStats();
console.log('Performance Stats:', stats);
/*
{
  total: 156,
  successful: 152,
  failed: 4,
  avgDuration: 89.3,
  byTable: {
    'user_profiles': 42,
    'injuries': 67,
    'wellness_checkins': 47
  }
}
*/
```

### Export Query Log

```typescript
const log = this.debugService.exportQueryLog();
// Save to file or send to analytics
localStorage.setItem('supabase-debug-log', log);
```

### Monitor in Supabase Dashboard

1. Go to **Logs > Postgres Logs**
2. Filter by:
   - Error severity: ERROR, WARN
   - Search: "policy", "RLS", "user_id"
3. Check for patterns in failing queries

## 🧪 Running Tests

### Automated Test Suite

```bash
# Set environment variables
export SUPABASE_URL="your-project-url"
export SUPABASE_ANON_KEY="your-anon-key"

# Run tests
npm test tests/supabase-debug.test.ts
```

### Manual Testing

1. Open Debug Console at `/debug` (admin only)
2. Select table to test
3. Click "Test Policies" to verify RLS
4. Click "Validate Schema" to check columns
5. Click "Check Indexes" to verify performance
6. Click "Test Insert/Update" to test operations
7. Click "Start Realtime" to test subscriptions

## 🔐 Security Notes

1. **Never expose debug console in production**
   - Restrict to admin users only
   - Consider disabling in production builds

2. **Be careful with query logging**
   - May log sensitive data
   - Clear logs regularly
   - Don't commit logs to git

3. **Test data cleanup**
   - All test methods clean up after themselves
   - Verify no test data remains in production

## 📝 Best Practices

1. **Always check errors**
   ```typescript
   const { error } = await supabase.from('table').insert(data);
   if (error) {
     console.error('Error details:', {
       code: error.code,
       message: error.message,
       details: error.details
     });
   }
   ```

2. **Use proper filtering**
   ```typescript
   // ✅ Good: Filter in query
   .select('*').eq('user_id', userId)
   
   // ❌ Bad: Fetch all then filter in JS
   .select('*') // then filter in code
   ```

3. **Handle realtime properly**
   ```typescript
   ngOnDestroy() {
     if (this.subscription) {
       await supabase.removeChannel(this.subscription);
     }
   }
   ```

4. **Monitor performance**
   ```typescript
   const start = performance.now();
   await supabase.from('table').select('*');
   console.log('Duration:', performance.now() - start, 'ms');
   ```

## 🆘 Troubleshooting

### Debug service not working

1. Check Supabase client is initialized:
   ```typescript
   const client = getSupabase();
   if (!client) {
     console.error('Supabase not initialized');
   }
   ```

2. Check migrations applied:
   ```sql
   SELECT version FROM supabase_migrations.schema_migrations 
   WHERE version LIKE '%debug%';
   ```

### RLS tests failing

1. Ensure user is authenticated:
   ```typescript
   const { data: { user } } = await supabase.auth.getUser();
   console.log('User:', user);
   ```

2. Check policy allows operation:
   ```sql
   SELECT * FROM get_table_policies('table_name');
   ```

### Realtime not working

1. Check subscription status:
   ```typescript
   channel.subscribe((status) => {
     console.log('Status:', status);
   });
   ```

2. Check table has realtime enabled:
   ```sql
   -- In Supabase Dashboard
   ALTER TABLE table_name REPLICA IDENTITY FULL;
   ```

## 📚 Additional Resources

- [Full Debugging Guide](./SUPABASE_DEBUGGING_GUIDE.md)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Database Linter](https://supabase.com/docs/guides/database/database-linter)

## 🤝 Contributing

To add new debug utilities:

1. Add methods to `SupabaseDebugService`
2. Add SQL functions if needed
3. Add tests in `supabase-debug.test.ts`
4. Update this README

## 📄 License

Same as main project.
