# Authentication & API Error Troubleshooting Guide

This guide helps you diagnose and fix 401 Unauthorized and 406 Not Acceptable errors in your Flag Football app.

## Quick Diagnosis

### Step 1: Add Debug Panel (Temporary)

Add the auth debug panel to your dashboard to see real-time auth status:

```typescript
// In player-dashboard.component.ts or athlete-dashboard.component.ts
import { AuthDebugPanelComponent } from '../../shared/components/auth-debug-panel/auth-debug-panel.component';

@Component({
  // ... existing config
  imports: [
    // ... existing imports
    AuthDebugPanelComponent, // Add this
  ],
})
```

Then add to your template:

```html
<!-- Add at the top of your dashboard for debugging -->
<app-auth-debug-panel></app-auth-debug-panel>
```

### Step 2: Check Browser Console

Open browser console (F12) and look for:

- Red errors with 401 or 406 status codes
- Authentication warnings
- Supabase session information

### Step 3: Run Auth Check

Use the debug panel buttons:

1. **Check Auth Status** - Logs detailed auth information to console
2. **Refresh Session** - Manually refreshes your auth token
3. **Force Re-authenticate** - Revalidates your session

## Common Issues & Fixes

### Issue 1: Session Expired

**Symptoms:**

- 401 Unauthorized errors
- "Your session has expired" messages
- Token expires_at shows past time

**Fix:**

```typescript
// The app should auto-refresh, but you can manually refresh:
await this.supabase.client.auth.refreshSession();
```

**Prevention:**

- Session auto-refresh is now enabled in auth.interceptor.ts
- Tokens refresh automatically 60 seconds before expiry

### Issue 2: Missing Authentication Headers

**Symptoms:**

- 401 errors on API requests
- Requests work in Postman but not in app
- Network tab shows no Authorization header

**Fix:**
The auth interceptor has been updated to:

1. Automatically add Authorization header to all API requests
2. Handle Supabase REST API requests specially
3. Skip auth for public endpoints

**Verify:**

```typescript
// Check if token is being sent (in browser Network tab)
// Look for: Authorization: Bearer eyJhbGc...
```

### Issue 3: RLS (Row Level Security) Policies

**Symptoms:**

- 403 Forbidden errors
- Can log in but can't access data
- Postgres error code PGRST116 or 42501

**Fix:**

```sql
-- Check RLS policies in Supabase dashboard
-- Ensure policies exist for your tables:

-- Example for training_sessions:
CREATE POLICY "Users can view own sessions"
ON training_sessions FOR SELECT
USING (auth.uid() = user_id);
```

### Issue 4: 406 Not Acceptable Errors

**Symptoms:**

- 406 status code
- "Not Acceptable" errors
- Supabase REST API calls failing

**Fix:**
The auth interceptor now automatically adds correct headers for Supabase:

- `Accept: application/json`
- `Content-Type: application/json`
- `Prefer: return=representation`

### Issue 5: CORS Errors

**Symptoms:**

- Network errors with status 0
- "CORS policy" error messages
- Requests blocked by browser

**Fix:**
Check your Supabase dashboard:

1. Go to Settings > API
2. Add your domain to "URL Configuration"
3. For local dev, add: `http://localhost:4200` and `http://localhost:8888`

## Manual Testing Commands

### Check Current Session

```typescript
// Open browser console and run:
const { data, error } = await supabase.auth.getSession();
console.log("Session:", data.session);
console.log("Expires at:", new Date(data.session?.expires_at * 1000));
```

### Test Authenticated Query

```typescript
// Test if RLS is working:
const { data, error } = await supabase
  .from("users")
  .select("id, email")
  .single();
console.log("User data:", data);
console.log("Error:", error);
```

### Manually Refresh Token

```typescript
const { data, error } = await supabase.auth.refreshSession();
console.log("New session:", data.session);
```

## Environment Configuration

Verify your environment variables are set correctly:

### Local Development (environment.ts)

```typescript
export const environment = {
  production: false,
  supabase: {
    url: "https://pvziciccwxgftcielknm.supabase.co",
    anonKey: "eyJhbGc...", // Your anon key
  },
};
```

### Production (environment.prod.ts)

```typescript
export const environment = {
  production: true,
  supabase: {
    url:
      process.env["SUPABASE_URL"] || "https://pvziciccwxgftcielknm.supabase.co",
    anonKey: process.env["SUPABASE_ANON_KEY"] || "",
  },
};
```

## Network Tab Analysis

### What to Look For:

1. **Request Headers** (should include):
   - `Authorization: Bearer eyJhbGc...`
   - `Content-Type: application/json`
   - `Accept: application/json`

2. **Response Status**:
   - ✅ 200 OK - Success
   - ✅ 201 Created - Resource created
   - ❌ 401 Unauthorized - Auth token missing/invalid
   - ❌ 403 Forbidden - RLS policy denied access
   - ❌ 406 Not Acceptable - Missing Accept header
   - ❌ 0 Network Error - CORS or connectivity issue

3. **Response Body** (for errors):
   ```json
   {
     "code": "PGRST301",
     "message": "JWT expired",
     "details": null,
     "hint": null
   }
   ```

## Files Modified to Fix Auth Issues

1. **auth.interceptor.ts**
   - Added automatic header injection
   - Added session refresh logic
   - Added Supabase-specific handling

2. **error.interceptor.ts**
   - Improved error logging
   - Better 401 handling
   - Added 406 detection

3. **auth.service.ts**
   - Added token expiry checking
   - Automatic token refresh
   - Better error handling

4. **supabase.service.ts**
   - Exposed supabaseKey for direct API calls
   - Better session management

## Still Having Issues?

### Enable Detailed Logging

Add to your component:

```typescript
import { inject } from '@angular/core';
import { LoggerService } from './core/services/logger.service';

logger = inject(LoggerService);

ngOnInit() {
  this.logger.setLogLevel('debug'); // Enable verbose logging
}
```

### Check Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Check **Authentication** > **Users** - Is your user listed?
4. Check **Database** > **Policies** - Are RLS policies enabled?
5. Check **API** > **Settings** - Is the anon key correct?

### Contact Support

If issues persist, provide:

1. Browser console logs (with sensitive data redacted)
2. Network tab screenshot showing failed request
3. Current auth status from debug panel
4. Supabase project ID (not the URL)

## Cleanup

Once auth is working, remove the debug panel:

1. Remove `<app-auth-debug-panel>` from templates
2. Remove import from components
3. Keep auth-debug.service.ts for future troubleshooting
