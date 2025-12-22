# ✅ Environment Variables Verification Checklist

## Current Status
All 3 required Supabase variables are present in Netlify. Now we need to verify their values are correct.

## Step-by-Step Verification

### 1. Verify SUPABASE_URL
- [ ] Click dropdown arrow next to `SUPABASE_URL`
- [ ] Value should be: `https://pvziciccwxgftcielknm.supabase.co`
- [ ] ✅ No trailing slash (`/`)
- [ ] ✅ Starts with `https://`
- [ ] ✅ Ends with `.supabase.co`

**If incorrect:** Click "Edit" and update to the correct value.

### 2. Verify SUPABASE_SERVICE_KEY
- [ ] Click dropdown arrow next to `SUPABASE_SERVICE_KEY`
- [ ] Value should start with `eyJ...` (JWT token format)
- [ ] Should be the **service_role** key (not anon key)

**To get correct value:**
1. Go to https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. Find **service_role** key (secret) - this is the one you need
5. Copy the entire key

**If incorrect:** Click "Edit" and paste the service_role key.

### 3. Verify SUPABASE_ANON_KEY
- [ ] Click dropdown arrow next to `SUPABASE_ANON_KEY`
- [ ] Value should start with `eyJ...` (JWT token format)
- [ ] Should be the **anon public** key

**To get correct value:**
1. Go to https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. Find **anon public** key - this is the one you need
5. Copy the entire key

**If incorrect:** Click "Edit" and paste the anon key.

## After Verifying/Updating Values

### 4. Trigger New Deploy
**CRITICAL:** Environment variable changes require a new deployment!

1. Go to **Deploys** tab in Netlify
2. Click **"Trigger deploy"** → **"Deploy site"**
3. Wait for deployment to complete (usually 1-2 minutes)
4. Try registration again

## Debugging: Check Function Logs

If still getting 503 error after redeploy:

1. Go to **Functions** tab
2. Click on **`auth-register`**
3. Click **"Logs"** tab
4. Look for errors like:
   - "Missing environment variables"
   - "Failed to connect to Supabase"
   - "SUPABASE_URL is MISSING"
   - Connection timeout errors

## Expected Values Reference

Based on your Supabase project (`pvziciccwxgftcielknm`):

```
SUPABASE_URL=https://pvziciccwxgftcielknm.supabase.co
```

**Note:** The keys (`SUPABASE_SERVICE_KEY` and `SUPABASE_ANON_KEY`) are unique to your project. You need to get them from your Supabase Dashboard.

## Common Issues

### Issue: "Values look correct but still getting 503"
**Solution:** 
- Make sure you **redeployed** after setting variables
- Check function logs for specific error messages
- Verify Supabase project is active (not paused)

### Issue: "Can't see the values (they're hidden)"
**Solution:**
- Click the dropdown arrow on each variable
- Or click "Edit" to see/edit the value
- Values are hidden by default for security

### Issue: "Don't know which key is which"
**Solution:**
- **service_role key**: Usually longer, marked as "secret" in Supabase
- **anon key**: Usually shorter, marked as "public" in Supabase
- The service_role key has admin privileges
- The anon key is for regular operations

## Next Steps After Fix

1. ✅ Verify all 3 variables have correct values
2. ✅ Trigger new deploy
3. ✅ Test registration again
4. ✅ Check function logs if still failing
5. ✅ Report back with any error messages from logs

