# 🔧 Supabase Connection Error Fix

## Problem
The registration function is failing with `TypeError: fetch failed` when trying to connect to Supabase.

## Root Cause
The Netlify function cannot reach your Supabase instance. This is typically caused by:
1. **Missing or incorrect environment variables** in Netlify
2. **Invalid SUPABASE_URL** format
3. **Network connectivity issues** from Netlify to Supabase

## Solution Steps

### Step 1: Verify Environment Variables in Netlify

1. Go to your Netlify Dashboard
2. Navigate to: **Site settings** → **Environment variables**
3. Verify these 3 variables are set:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key-here
SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 2: Check SUPABASE_URL Format

Your `SUPABASE_URL` should:
- Start with `https://`
- End with `.supabase.co`
- Not have trailing slashes
- Example: `https://pvziciccwxgftcielknm.supabase.co`

### Step 3: Get Your Supabase Credentials

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → Use as `SUPABASE_URL`
   - **service_role key** → Use as `SUPABASE_SERVICE_KEY`
   - **anon public key** → Use as `SUPABASE_ANON_KEY`

### Step 4: Update Netlify Environment Variables

1. In Netlify Dashboard → **Site settings** → **Environment variables**
2. Update each variable:
   - Click **Edit** on each variable
   - Paste the correct value
   - Click **Save**
3. **Important**: After updating, trigger a new deploy:
   - Go to **Deploys** tab
   - Click **Trigger deploy** → **Deploy site**

### Step 5: Test the Connection

After redeploying, try registering again. The improved error handling will now show:
- More specific error messages
- Which environment variables are missing
- Connection status details

## Common Issues

### Issue: "SUPABASE_URL is MISSING"
**Fix**: Add the `SUPABASE_URL` environment variable in Netlify

### Issue: "Invalid SUPABASE_URL format"
**Fix**: Ensure the URL starts with `https://` and ends with `.supabase.co`

### Issue: "Failed to connect to Supabase"
**Possible causes**:
- Supabase project is paused (check Supabase dashboard)
- Network firewall blocking connections
- Incorrect URL or keys

### Issue: Environment variables not updating
**Fix**: 
- Make sure you clicked **Save** after editing
- Trigger a new deploy after updating variables
- Variables are scoped to the environment (production/branch/deploy preview)

## Verification

After fixing, check the Netlify function logs:
1. Go to **Functions** → **auth-register**
2. Try registering a user
3. Check logs - you should see successful database operations instead of `fetch failed`

## Still Having Issues?

If the problem persists:
1. Check Supabase project status (not paused)
2. Verify network connectivity from Netlify to Supabase
3. Check if Supabase project has IP restrictions enabled
4. Review Netlify function logs for more detailed error messages

