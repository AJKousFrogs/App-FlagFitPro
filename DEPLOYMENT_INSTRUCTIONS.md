# Deployment Instructions - FlagFit Pro Security Updates

## Overview

This document provides step-by-step instructions for deploying the critical security updates implemented in this session.

## What Was Implemented

### 1. Code Fixes (Already Deployed to Repository)

- ✅ Fixed onboarding state management dual source of truth issue (auth-manager.js:1110-1120)
- ✅ Added email normalization to registration and login (auth-manager.js:423, 343)
- ✅ Updated Supabase config to support CLI version 2.30.4

### 2. Database Migration (Requires Manual Deployment)

- ⚠️ Role enforcement trigger and RLS policies (supabase/migrations/001_role_enforcement.sql)

## Deployment Steps

### Step 1: Deploy Database Migration via Supabase Dashboard

Since CLI authentication is encountering issues, deploy the migration manually:

1. **Navigate to Supabase SQL Editor**:
   - Go to https://supabase.com/dashboard/project/pvziciccwxgftcielknm/sql/new
   - Log in with your Supabase credentials

2. **Execute the Migration**:
   - Open the file: `supabase/migrations/001_role_enforcement.sql`
   - Copy the entire contents (470 lines)
   - Paste into the SQL Editor
   - Click "Run" to execute

3. **Verify the Deployment**:

   ```sql
   -- Check if the trigger was created
   SELECT tgname, tgenabled
   FROM pg_trigger
   WHERE tgname = 'enforce_role_on_user_change';

   -- Check if the audit table exists
   SELECT table_name
   FROM information_schema.tables
   WHERE table_name = 'role_change_audit';

   -- Check if helper functions exist
   SELECT routine_name
   FROM information_schema.routines
   WHERE routine_name IN ('has_role', 'get_current_role', 'enforce_user_role');
   ```

4. **Expected Results**:
   - Trigger: `enforce_role_on_user_change` should show as enabled
   - Table: `role_change_audit` should exist
   - Functions: All three helper functions should be listed

### Step 2: Test the Role Enforcement

After deploying the migration, test the role enforcement:

#### Test 1: Invalid Role Defaults to Player

```javascript
// In browser console on your app
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const { data, error } = await supabaseClient.auth.signUp({
  email: "test-invalid-role@example.com",
  password: "SecurePass123!",
  options: {
    data: { role: "superadmin" }, // Invalid role
  },
});

// Expected: user.user_metadata.role should be 'player'
console.assert(
  data.user.user_metadata.role === "player",
  "Role enforcement failed!",
);
```

#### Test 2: Self-Admin Assignment is Blocked

```javascript
// Attempt to upgrade existing user to admin
const { data, error } = await supabaseClient.auth.updateUser({
  data: { role: "admin" },
});

// Expected: role should remain unchanged (not admin)
console.assert(
  data.user.user_metadata.role !== "admin",
  "Admin self-assignment was not blocked!",
);
```

### Step 3: Verify RLS Policies

Check that Row Level Security is active:

```sql
-- Check RLS is enabled on critical tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'user_profiles',
  'player_profiles',
  'coach_profiles',
  'training_sessions',
  'performance_metrics'
);

-- Check policies exist
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Expected Results**:

- All tables should have `rowsecurity = true`
- Multiple policies should exist for each table

### Step 4: Deploy Code Changes

The code changes have already been implemented. To deploy:

```bash
# Commit the changes
git add src/auth-manager.js supabase/config.toml
git commit -m "fix: implement onboarding state single source of truth and email normalization

- Fix dual source of truth for onboarding completion status
- user_metadata is now the authoritative source
- localStorage used only as performance cache
- Add email normalization (trim + lowercase) to login and registration
- Update Supabase config to support CLI v2.30.4

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to remote
git push origin main
```

### Step 5: Monitor for Issues

After deployment, monitor the following:

1. **Role Change Audit Log**:

   ```sql
   SELECT user_id, old_role, new_role, changed_at, change_reason
   FROM public.role_change_audit
   ORDER BY changed_at DESC
   LIMIT 10;
   ```

2. **Application Logs**:
   - Check browser console for any authentication errors
   - Verify onboarding flow works correctly
   - Confirm login with various email formats (with spaces, mixed case)

3. **Error Tracking**:
   - Watch for increased authentication failures
   - Monitor for users reporting onboarding issues

## Rollback Procedures

If issues are encountered:

### Rollback Database Migration

```sql
-- Disable the trigger
DROP TRIGGER IF EXISTS enforce_role_on_user_change ON auth.users;
DROP TRIGGER IF EXISTS log_role_change_trigger ON auth.users;

-- Drop the functions
DROP FUNCTION IF EXISTS public.enforce_user_role();
DROP FUNCTION IF EXISTS public.log_role_change();
DROP FUNCTION IF EXISTS public.has_role(TEXT);
DROP FUNCTION IF EXISTS public.get_current_role();

-- Disable RLS (if causing issues)
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_profiles DISABLE ROW LEVEL SECURITY;
-- Add other tables as needed

-- Keep audit table for forensics
-- DROP TABLE IF EXISTS public.role_change_audit;
```

### Rollback Code Changes

```bash
# Revert to previous commit
git revert HEAD
git push origin main
```

## Configuration Updates

### Supabase Config Changes

The following config sections were commented out to support CLI v2.30.4:

- `[db.network_restrictions]` - Not supported in older CLI
- `[storage.analytics]` - Hosted platform only
- `[storage.vector]` - Hosted platform only
- `[auth.external[apple].email_optional]` - Not in v2.30.4
- `[auth.oauth_server]` - Not in v2.30.4

**Note**: These features remain available in the hosted Supabase platform; they're only commented out for local CLI compatibility.

## Success Criteria

Deployment is successful when:

- ✅ Trigger `enforce_role_on_user_change` is active
- ✅ Invalid roles default to 'player'
- ✅ Self-admin assignment is blocked
- ✅ RLS policies are enabled on all tables
- ✅ Onboarding flow works correctly
- ✅ Email login is case-insensitive
- ✅ No increase in authentication errors

## Support and Troubleshooting

### Common Issues

**Issue**: Migration fails with permission error

- **Solution**: Ensure you're using a database user with sufficient privileges (postgres role)

**Issue**: Trigger doesn't fire

- **Solution**: Check that the trigger is enabled:
  ```sql
  ALTER TABLE auth.users ENABLE TRIGGER enforce_role_on_user_change;
  ```

**Issue**: RLS blocks legitimate access

- **Solution**: Review policy conditions and ensure auth.uid() returns expected user ID

**Issue**: Onboarding loop after deployment

- **Solution**: Clear localStorage and verify user_metadata contains onboarding_completed field

### Getting Help

If you encounter issues:

1. Check the audit log for role enforcement activity
2. Review application logs in browser console
3. Verify database connection and permissions
4. Consult the documentation:
   - AUTHENTICATION.md - Authentication flows
   - SESSION_AND_SECURITY.md - Security implementation
   - ONBOARDING.md - Onboarding state management
   - IMPLEMENTATION_ROADMAP.md - Full implementation plan

## Next Steps

After successful deployment:

1. **Week 2 Priorities** (from IMPLEMENTATION_ROADMAP.md):
   - Implement multi-session logout functionality
   - Add "Remember Me" semantics to UI
   - Implement role change detection and handling

2. **Week 3 Priorities**:
   - Update Privacy Policy
   - Conduct security training
   - Perform penetration testing

## Deployment Checklist

Use this checklist to track deployment progress:

- [ ] Database migration executed in SQL Editor
- [ ] Trigger verification query passed
- [ ] Audit table exists
- [ ] Helper functions created
- [ ] Test 1: Invalid role defaults to player
- [ ] Test 2: Self-admin assignment blocked
- [ ] RLS policies verified active
- [ ] Code changes committed
- [ ] Code changes pushed to remote
- [ ] Application tested in staging/production
- [ ] Monitoring configured
- [ ] Team notified of deployment
- [ ] Documentation updated

---

**Deployment Date**: 2025-12-21
**Deployed By**: [Your Name]
**Version**: 1.0.0
**Related Documents**:

- AUTHENTICATION.md
- SESSION_AND_SECURITY.md
- ONBOARDING.md
- IMPLEMENTATION_ROADMAP.md
- COMPLIANCE_AND_AUDIT.md
