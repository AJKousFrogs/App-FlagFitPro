# 🔧 Netlify Environment Variables Fix

## Problem
The application was showing errors about missing Supabase configuration in production:
```
❌ [ERROR] [Supabase] CRITICAL: Missing Supabase configuration in production
❌ [ERROR] [Supabase] Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables
```

## Solution Implemented

### 1. Build-Time Injection
The build process now automatically injects Supabase environment variables directly into HTML files as inline scripts. This ensures the variables are available at runtime.

**Files Modified:**
- `scripts/inject-env-into-html.js` - New script that injects env vars into HTML
- `scripts/build.js` - Updated to run the injection script during build
- `src/js/config/supabase-config.js` - Improved error messages

### 2. How It Works

1. **During Build:**
   - `generate-env.js` creates `env.js` file
   - `inject-env-into-html.js` injects inline script with env vars into all HTML files
   - HTML files are modified in-place (since Netlify publishes from root)

2. **At Runtime:**
   - Inline script sets `window._env.SUPABASE_URL` and `window._env.SUPABASE_ANON_KEY`
   - `supabase-config.js` reads from `window._env`
   - Supabase client initializes successfully

## Required Setup

### Option 1: Using netlify.toml (Current Setup)
The `netlify.toml` file already has the environment variables set in `[build.environment]`. This should work, but if you're still seeing errors:

### Option 2: Set in Netlify UI (Recommended for Redundancy)

1. Go to [Netlify Dashboard](https://app.netlify.com/)
2. Select your site (`webflagfootballfrogs`)
3. Go to **Site Settings** → **Environment Variables**
4. Add these variables:

```
VITE_SUPABASE_URL = https://pvziciccwxgftcielknm.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2emljaWNjd3hnZnRjaWVsa25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MzcwNTgsImV4cCI6MjA3NTExMzA1OH0.1nfJrtWPl6DrAwvjGvM1-CZBeyYgCaV9oDdaadpqhLU
```

5. Set scope to **"All scopes"** (or at least "Production")
6. Click **Save**
7. **Trigger a new deploy** (Deploys → Trigger deploy → Deploy site)

## Verification

After deploying, check:

1. **Build Logs:**
   - Should see: `✅ Environment variables injected into HTML files`
   - Should see: `Updated: X files`

2. **Browser Console:**
   - Open your site in browser
   - Open DevTools Console
   - Type: `window._env`
   - Should see: `{SUPABASE_URL: "...", SUPABASE_ANON_KEY: "..."}`

3. **No Errors:**
   - Should NOT see: `Missing Supabase configuration`
   - Login should work without errors

## Troubleshooting

### If you still see errors:

1. **Check Build Logs:**
   - Go to Netlify → Deploys → Latest deploy → Build log
   - Look for errors in the build process
   - Verify `inject-env-into-html.js` ran successfully

2. **Verify Variables Are Set:**
   - Check Netlify UI → Environment Variables
   - Ensure variable names match exactly (case-sensitive)
   - Ensure they're set for the correct scope

3. **Check HTML Source:**
   - View page source in browser
   - Look for inline script with `window._env.SUPABASE_URL`
   - Should appear before `supabase-config.js` script tag

4. **Clear Cache:**
   - Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
   - Or clear Netlify cache and redeploy

## Files Changed

- ✅ `scripts/inject-env-into-html.js` - New file
- ✅ `scripts/build.js` - Updated to run injection
- ✅ `src/js/config/supabase-config.js` - Improved error handling
- ✅ `netlify.toml` - Added comments

## Next Steps

1. **Set variables in Netlify UI** (if not already done)
2. **Trigger a new deploy**
3. **Test login functionality**
4. **Verify no errors in console**

---

**Note:** The build process now automatically handles environment variable injection, so you shouldn't need to manually edit HTML files anymore.

