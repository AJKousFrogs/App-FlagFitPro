# Supabase Backend Debugging Guide

## Overview

This guide provides step-by-step instructions for debugging Supabase backend issues, focusing on RLS policies, schema validation, and realtime conflict resolution.

## Quick Start

### 1. Enable Query Logging

In the Supabase Dashboard:

```sql
-- Go to SQL Editor and run:
ALTER DATABASE postgres SET log_statement = 'all';
ALTER DATABASE postgres SET log_duration = 'on';
```

Then check logs in Dashboard > Logs > Postgres Logs

### 2. Install Debug Helper Functions

```bash
# Run the migration script
cd scripts
psql $DATABASE_URL < supabase-debug-migration.sql
```

Or in Supabase Dashboard SQL Editor:
- Copy contents of `scripts/supabase-debug-migration.sql`
- Paste and execute

### 3. Use Debug Service in Angular

```typescript
import { SupabaseDebugService } from '@core/services/supabase-debug.service';

constructor(private debugService: SupabaseDebugService) {
  this.debugService.enableDebugMode();
}

// Test upsert with detailed logging
async testProfileUpdate() {
  const result = await this.debugService.testUpsert(
    this.supabase,
    'user_profiles',
    {
      id: this.userId,
      full_name: 'Test User',
      role: 'athlete'
    },
    { upsert: true, onConflict: 'id' }
  );
  
  if (!result.success) {
    console.error('Upsert failed:', result.error);
  }
}
```

## Common Issues & Solutions

### Issue 1: RLS Policy Violation

**Symptoms:**
```
Error: new row violates row-level security policy
Error code: 42501
```

**Debug Steps:**

1. **Check current user:**
```typescript
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user?.id);
```

2. **Verify RLS policies:**
```sql
SELECT * FROM pg_policies 
WHERE tablename IN ('user_profiles', 'injuries');
```

3. **Test with debug service:**
```typescript
await this.debugService.testRLSPolicies(
  this.supabase,
  'user_profiles',
  userId
);
```

**Common Causes:**
- `user_id` in data doesn't match `auth.uid()`
- Missing INSERT policy with WITH CHECK clause
- Policy uses wrong column name (e.g., `id` vs `user_id`)

**Fix for user_profiles:**
```sql
-- Ensure policy uses correct column
CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  WITH CHECK (id = auth.uid());
  
CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  USING (id = auth.uid());
```

**Fix for injuries:**
```sql
CREATE POLICY "Users can insert own injuries"
  ON injuries
  FOR INSERT
  WITH CHECK (user_id = auth.uid());
  
CREATE POLICY "Users can update own injuries"
  ON injuries
  FOR UPDATE
  USING (user_id = auth.uid());
```

### Issue 2: Column Does Not Exist

**Symptoms:**
```
Error: column "pain_level" does not exist
Error code: 42703
```

**Debug Steps:**

1. **Check actual schema:**
```typescript
const result = await this.debugService.validateSchema(
  this.supabase,
  'daily_wellness_checkin',
  ['pain_level', 'user_id', 'created_at']
);

console.log('Missing columns:', result.missing);
```

2. **Or use SQL:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'daily_wellness_checkin'
ORDER BY ordinal_position;
```

**Fix:**
```sql
-- Add missing column
ALTER TABLE daily_wellness_checkin 
ADD COLUMN pain_level integer;

-- Or run a migration
```

### Issue 3: Missing Indexes

**Symptoms:**
- Slow queries on `user_id` filters
- High RLS policy evaluation time
- Timeout errors

**Debug Steps:**

1. **Check indexes:**
```typescript
const indexes = await this.debugService.checkIndexes(
  this.supabase,
  ['user_profiles', 'injuries', 'daily_wellness_checkin']
);

console.table(indexes);
```

2. **Or use SQL:**
```sql
SELECT * FROM get_table_indexes('injuries');
```

**Fix:**
```sql
-- Add index on user_id for better RLS performance
CREATE INDEX IF NOT EXISTS idx_injuries_user_id 
ON injuries(user_id);

CREATE INDEX IF NOT EXISTS idx_wellness_user_id 
ON daily_wellness_checkin(user_id);
```

### Issue 4: Realtime Conflicts

**Symptoms:**
- Data gets overwritten by older versions
- Race conditions between local and remote updates
- Inconsistent state after network reconnection

**Debug Steps:**

1. **Set up conflict detection:**
```typescript
const subscription = this.debugService.subscribeWithConflictDetection(
  this.supabase,
  'injuries',
  userId,
  (data) => {
    // Handle update
    console.log('Update received:', data);
  },
  (local, remote) => {
    // Resolve conflict
    console.log('Conflict between:', local, remote);
    
    // Strategy 1: Last write wins
    return remote;
    
    // Strategy 2: Merge changes
    // return { ...local, ...remote };
    
    // Strategy 3: Keep local if newer
    // return new Date(local.updated_at) > new Date(remote.updated_at) 
    //   ? local 
    //   : remote;
  }
);

// Later...
subscription.unsubscribe();
```

2. **Add optimistic concurrency control:**
```sql
-- Already added by debug migration
-- Ensures updated_at is always set
CREATE TRIGGER update_injuries_updated_at
  BEFORE UPDATE ON injuries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

3. **Use version-based updates:**
```typescript
// Include updated_at in WHERE clause
const { error } = await supabase
  .from('injuries')
  .update({ status: 'recovered' })
  .eq('id', injuryId)
  .eq('updated_at', lastKnownUpdatedAt);

if (error) {
  // Conflict detected, refresh data
  console.warn('Conflict: data was updated by another client');
}
```

### Issue 5: Foreign Key Violations

**Symptoms:**
```
Error: insert or update on table "injuries" violates foreign key constraint
```

**Debug Steps:**

1. **Check foreign keys:**
```sql
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'injuries';
```

2. **Verify referenced data exists:**
```typescript
// Check if user exists
const { data: user } = await supabase
  .from('user_profiles')
  .select('id')
  .eq('id', userId)
  .single();

if (!user) {
  console.error('User does not exist:', userId);
}
```

## Testing

### Run Automated Tests

```bash
# Set environment variables
export SUPABASE_URL="your-project-url"
export SUPABASE_ANON_KEY="your-anon-key"

# Run tests
npm test tests/supabase-debug.test.ts
```

### Manual Testing Checklist

- [ ] Can SELECT own user_profile
- [ ] Can UPDATE own user_profile
- [ ] Can INSERT injuries with correct user_id
- [ ] Cannot UPDATE others' injuries
- [ ] Realtime subscription receives updates
- [ ] Conflict resolution works correctly
- [ ] Indexes exist on user_id columns
- [ ] Query performance is acceptable (<1s)

## Performance Monitoring

### Get Query Stats

```typescript
const stats = this.debugService.getQueryStats();
console.log('Query statistics:', stats);
/*
{
  total: 42,
  successful: 40,
  failed: 2,
  avgDuration: 156.3,
  byTable: {
    'user_profiles': 15,
    'injuries': 27
  }
}
*/
```

### Export Query Log

```typescript
const log = this.debugService.exportQueryLog();
// Save to file or send to analytics
console.log(log);
```

## Best Practices

### 1. Always Check Errors

```typescript
const { data, error } = await supabase
  .from('injuries')
  .insert(injuryData);

if (error) {
  console.error('Error details:', {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint
  });
  
  // Handle specific error codes
  if (error.code === '42501') {
    // RLS policy violation
  } else if (error.code === '23505') {
    // Unique constraint violation
  }
}
```

### 2. Use Proper Filtering

```typescript
// ✅ Good: Filter in query
const { data } = await supabase
  .from('injuries')
  .select('*')
  .eq('user_id', userId);

// ❌ Bad: Fetch all then filter
const { data } = await supabase
  .from('injuries')
  .select('*');
const filtered = data.filter(i => i.user_id === userId);
```

### 3. Handle Realtime Properly

```typescript
// ✅ Good: Clean up subscriptions
const subscription = supabase
  .channel('injuries')
  .on('postgres_changes', { ... }, handler)
  .subscribe();

// Later, in ngOnDestroy or cleanup:
await supabase.removeChannel(subscription);

// ❌ Bad: Memory leaks from unclosed subscriptions
```

### 4. Use Transactions for Related Updates

```typescript
// Multiple related updates
const { error } = await supabase.rpc('update_injury_with_log', {
  injury_id: id,
  new_status: 'recovered',
  log_entry: 'Fully recovered'
});
```

## Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Database Linter](https://supabase.com/docs/guides/database/database-linter)
- [Performance Tuning](https://supabase.com/docs/guides/database/performance)

## Support

If issues persist:

1. Check Supabase Dashboard > Logs
2. Run the debug test suite
3. Export query log for analysis
4. Review RLS policies with `get_table_policies()`
5. Check for missing indexes with `get_table_indexes()`
