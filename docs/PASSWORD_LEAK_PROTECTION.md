# Password Leak Protection Integration

## Overview

The application now includes leaked password protection that checks passwords against the Have I Been Pwned database before allowing users to:
- Register new accounts
- Reset passwords
- Change passwords

## Implementation

### Supabase Edge Function

**Location**: `supabase/functions/enable-leaked-password-protection/`

**Endpoint**: `https://pvziciccwxgftcielknm.supabase.co/functions/v1/enable-leaked-password-protection`

**Features**:
- Uses k-anonymity model (only sends first 5 chars of SHA-1 hash)
- Never sends full password to external API
- Fail-open design (allows password if API is unavailable)
- Requires authentication for security

### Utility Function

**Location**: `src/js/utils/password-leak-check.js`

Provides two functions:
- `checkPasswordLeaked(password, supabaseUrl, supabaseToken)` - Manual check with explicit parameters
- `checkPasswordLeakedAuto(password)` - Automatic check using environment configuration

## Integration Points

### 1. Registration Flow

**Files Modified**:
- `register.html` - Checks password before calling `authManager.register()`
- `src/auth-manager.js` - Checks password in `register()` method before Supabase signup
- `angular/src/app/features/auth/register/register.component.ts` - Checks password before Angular registration

**Flow**:
1. User enters password
2. Password validated for complexity (existing validation)
3. Password checked against leaked password database
4. If leaked, show error message and prevent registration
5. If safe, proceed with registration

### 2. Password Reset Flow

**Files Modified**:
- `reset-password.html` - Checks new password before resetting

**Flow**:
1. User enters new password
2. Password validated for complexity
3. Password checked against leaked password database
4. If leaked, show error message and prevent reset
5. If safe, proceed with password reset

### 3. Password Change Flow

**Files Modified**:
- `src/auth-manager.js` - Checks new password in `changePassword()` method

**Flow**:
1. User enters new password
2. Password validated for complexity
3. Password checked against leaked password database
4. If leaked, show error message and prevent change
5. If safe, proceed with password change

## Error Messages

When a leaked password is detected, users see:
> "This password has been found in data breaches. Please choose a different password."

## Security Features

1. **K-Anonymity**: Only first 5 characters of SHA-1 hash are sent to Have I Been Pwned API
2. **No Full Password Transmission**: Full password never leaves the application
3. **Fail-Open**: If the leak check service is unavailable, registration/password change continues (but logs warning)
4. **Authentication Required**: Edge function requires valid Supabase token for security

## Testing

To test the integration:

1. **Test with leaked password**:
   - Try registering with a common leaked password (e.g., "password123")
   - Should show error message

2. **Test with safe password**:
   - Try registering with a unique, strong password
   - Should proceed normally

3. **Test with unavailable service**:
   - If Edge Function is down, registration should still work (fail-open)

## Configuration

The function automatically detects Supabase configuration from:
- `window._env.SUPABASE_URL` (set by `supabase-config.js`)
- `window._env.VITE_SUPABASE_URL` (alternative)
- Environment variables

## Deployment

The Edge Function is deployed and available at:
```
https://pvziciccwxgftcielknm.supabase.co/functions/v1/enable-leaked-password-protection
```

To redeploy:
```bash
supabase functions deploy enable-leaked-password-protection --project-ref pvziciccwxgftcielknm
```

## Future Enhancements

Potential improvements:
- Add password strength indicator that includes leak status
- Cache leak check results to reduce API calls
- Add admin dashboard to view leak check statistics
- Integrate with Supabase Auth hooks for automatic checking

