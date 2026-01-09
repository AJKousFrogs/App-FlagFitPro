# Settings Save Issue - Fix Summary

## Problem
Account settings were not saving changes properly. Users reported that when they updated their profile information, the changes were not persisting.

## Root Causes Identified

1. **Missing Loading State**: No visual feedback during save operation
2. **Silent Failures**: Database errors were being caught but not logged properly
3. **User Record Not Existing**: Using UPDATE instead of UPSERT meant records weren't created if they didn't exist
4. **Auth State Not Refreshing**: After updating user metadata, the AuthService wasn't refreshing its cached user data

## Changes Made

### 1. Added Loading State (`settings.component.ts`)
- Added `isSavingSettings` signal to track save operation state
- Updated save button in template to show loading indicator

### 2. Enhanced Logging (`settings.component.ts`)
- Added comprehensive logging throughout the `saveSettings()` method
- Log levels:
  - `info`: Successful operations
  - `warn`: Non-critical failures (e.g., optional table not found)
  - `error`: Critical failures that should be investigated

### 3. Changed UPDATE to UPSERT (`settings.component.ts`)
- Modified database operation from `.update()` to `.upsert()`
- This ensures user records are created if they don't exist
- Uses `onConflict: 'id'` to update existing records

### 4. Added Auth Refresh (`auth.service.ts` + `settings.component.ts`)
- Created new `refreshUser()` method in AuthService
- Calls `auth.getUser()` to fetch fresh user data from Supabase
- Updates the `currentUser` signal with latest metadata
- Called after successful save to ensure UI reflects changes

### 5. Better Error Handling
- All database operations now have proper try-catch blocks
- Errors are logged with context but don't stop the entire save process
- User still gets success message if at least localStorage save succeeds

## Files Modified

1. `angular/src/app/features/settings/settings.component.ts`
   - Added `isSavingSettings` signal
   - Enhanced `saveSettings()` with logging and upsert
   - Added auth refresh call

2. `angular/src/app/features/settings/settings.component.html`
   - Added `[loading]="isSavingSettings()"` to save button

3. `angular/src/app/core/services/auth.service.ts`
   - Added `refreshUser()` method to force reload user from Supabase

## How to Test

### Manual Testing Steps

1. **Test Profile Update**:
   - Navigate to Settings page
   - Update display name
   - Click "Save Changes"
   - Verify loading indicator appears
   - Verify success toast shows
   - Refresh page and confirm name persists

2. **Test Date of Birth**:
   - Add or update date of birth
   - Save settings
   - Check profile page shows updated age

3. **Test Position & Jersey Number**:
   - Update position and jersey number
   - Save settings
   - Navigate to profile page
   - Verify changes appear in profile header

4. **Test Team Selection**:
   - Select a team from dropdown
   - Save settings
   - Verify team name appears in profile

5. **Test Notification Settings**:
   - Toggle various notification switches
   - Save settings
   - Refresh page
   - Verify toggles maintain their state

6. **Test Theme Changes**:
   - Select different theme (Light/Dark/Auto)
   - Verify theme applies immediately (before save)
   - Save settings
   - Refresh page
   - Verify theme persists

### Check Browser Console

Open Developer Tools → Console and look for log messages:

**Expected logs on successful save**:
```
Saving settings for user: <user-id>
Settings saved to localStorage
Theme applied: <theme>
Upserting users table with: <data>
User profile upserted successfully: <data>
Updating team membership: <team-id>
Auth metadata updated successfully
User settings upserted successfully
Refreshing centralized services...
Services refreshed successfully
```

**If you see warnings**, they are expected for tables that don't exist yet:
```
Settings table not available: <message>
```

**If you see errors**, these indicate actual problems that need fixing:
```
User profile upsert failed: <message>
Save settings error: <message>
```

### Verify Data Persistence

1. **Check localStorage**:
   - Open Developer Tools → Application → Local Storage
   - Find key `user_settings`
   - Verify it contains your latest changes

2. **Check Supabase Database** (if you have access):
   - Open Supabase Dashboard
   - Navigate to Table Editor
   - Check `users` table for your user record
   - Check `user_settings` table for settings record
   - Verify `updated_at` timestamps are recent

3. **Check Auth Metadata**:
   - In browser console, run: `localStorage.getItem('sb-<project-ref>-auth-token')`
   - Decode the JWT token to verify user_metadata was updated

## Troubleshooting

### Changes Still Not Saving

1. **Check RLS Policies**:
   - User might not have permission to update `users` table
   - Check Supabase logs for permission denied errors

2. **Check User ID Match**:
   - Verify auth user ID matches the user record ID in database
   - Check console logs for the user ID being used

3. **Check Required Columns**:
   - Verify all columns being updated exist in the `users` table
   - Missing columns will cause upsert to fail

### Visual Changes Not Appearing

1. **Hard Refresh**: Press Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. **Clear Cache**: Clear browser cache and reload
3. **Check Signal Updates**: Verify services are calling `.set()` on signals after refresh

## Next Steps

If issues persist after these fixes:

1. **Add Database Trigger**: Create a trigger on `auth.users` to automatically create `users` table records
2. **Add Migration**: Create migration to backfill existing auth users into `users` table
3. **Add Validation**: Add schema validation to catch data issues before save
4. **Add Rollback**: Implement transaction rollback if any critical update fails

## Related Issues

- Profile completion percentage not updating → Fixed by adding refresh calls
- Team name not showing in profile → Fixed by refreshing TeamMembershipService
- Avatar not updating → Separate issue (needs storage bucket setup)
