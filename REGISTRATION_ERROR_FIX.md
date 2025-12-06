# Registration 500 Error - Root Cause and Fix

## Problem
The `/auth-register` endpoint is returning a 500 error when users try to register. The error occurs because Row Level Security (RLS) policies are blocking user creation during registration.

## Root Cause

The RLS policy on the `users` table requires:
1. `TO authenticated` - User must be authenticated
2. `WITH CHECK (id = auth.uid())` - User ID must match authenticated user ID

**During registration:**
- Users are NOT authenticated yet (they're creating an account)
- There's no `auth.uid()` because they don't have a token
- The Netlify function uses the service role (service key) which should bypass RLS, but the policy is still blocking it

## Solution

### Step 1: Apply the Database Migration

Run the migration file: `database/migrations/037_fix_users_insert_policy_registration.sql`

This migration:
1. Drops the restrictive INSERT policy
2. Creates a new policy allowing `service_role` to insert users (for registration)
3. Keeps the policy for authenticated users to insert their own profiles

**To apply:**
1. Go to your Neon DB / Supabase SQL Editor
2. Run the migration file contents
3. Verify the policies were created correctly

### Step 2: Verify Service Key Configuration

Ensure your Netlify environment variables are set:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Your Supabase service role key (NOT the anon key)
- `SUPABASE_ANON_KEY` - Your Supabase anon key
- `JWT_SECRET` - Your JWT secret for token signing

**Important:** The service key should have `service_role` permissions and bypass RLS.

### Step 3: Test Registration

After applying the migration:
1. Try registering a new user
2. Check Netlify function logs for any errors
3. Verify the user was created in the database

## Additional Debugging

If the error persists after applying the migration:

1. **Check Netlify Function Logs:**
   - Go to Netlify Dashboard → Functions → auth-register
   - Look for detailed error messages
   - The improved error handling will show RLS-specific errors

2. **Verify Database Schema:**
   - Ensure the `users` table has columns: `name`, `email`, `password`, `role`
   - If your schema uses `password_hash` instead of `password`, update the function
   - If your schema uses `first_name`/`last_name` instead of `name`, update the function

3. **Check RLS Status:**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' AND tablename = 'users';
   ```

4. **Check Policies:**
   ```sql
   SELECT policyname, cmd, roles 
   FROM pg_policies 
   WHERE schemaname = 'public' AND tablename = 'users' AND cmd = 'INSERT';
   ```

## Expected Behavior After Fix

- Registration should work without 500 errors
- Users can be created via the Netlify function using service role
- RLS still protects the table for regular queries
- Authenticated users can still insert their own profiles

## Files Modified

1. `database/migrations/037_fix_users_insert_policy_registration.sql` - New migration to fix RLS policy
2. `netlify/functions/auth-register.cjs` - Improved error handling for RLS errors

