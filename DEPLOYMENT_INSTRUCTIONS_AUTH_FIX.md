# Deployment Instructions - Authentication Fix

## ✅ Code Changes Completed

I've fixed the two broken Netlify functions to use Supabase authentication:

### Files Modified:
1. ✅ `netlify/functions/auth-me.cjs` - Now uses Supabase token verification
2. ✅ `netlify/functions/notifications-count.cjs` - Now uses Supabase token verification

---

## 🔐 Required Environment Variable

Both functions now require the **SUPABASE_SERVICE_KEY** environment variable.

### How to Get Your Service Key:

1. Go to https://supabase.com/dashboard
2. Select your project: **pvziciccwxgftcielknm**
3. Navigate to **Settings** → **API**
4. Copy the **`service_role`** key (NOT the `anon` key)
   - ⚠️ **IMPORTANT:** The service_role key starts with `eyJ...` and is much longer than the anon key
   - ⚠️ **SECURITY:** Never expose this key in client-side code - it's for server use only

### Add to Netlify:

1. Go to your Netlify dashboard
2. Navigate to: **Site Settings** → **Environment Variables**
3. Click **Add a variable**
4. Key: `SUPABASE_SERVICE_KEY`
5. Value: Paste your service_role key
6. Click **Save**

---

## 📦 Deployment Steps

### Option 1: Deploy via Git (Recommended)

```bash
# Commit the changes
git add netlify/functions/auth-me.cjs netlify/functions/notifications-count.cjs
git commit -m "Fix authentication: Switch from JWT_SECRET to Supabase auth"

# Push to your repository
git push origin main
```

Netlify will automatically deploy the changes.

### Option 2: Manual Deploy

If you're not using Git deployment:

1. Run the build locally:
   ```bash
   npm run build
   ```

2. Deploy via Netlify CLI:
   ```bash
   netlify deploy --prod
   ```

---

## ✅ Verification Checklist

After deployment, verify the fixes:

### 1. Check Netlify Deploy Logs
- [ ] Deployment completed successfully
- [ ] No build errors
- [ ] Environment variable `SUPABASE_SERVICE_KEY` is set

### 2. Test Auth-Me Endpoint

Open your browser console and run:

```javascript
// Should return your user data
const response = await fetch('https://webflagfootballfrogs.netlify.app/.netlify/functions/auth-me', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
  }
});
const data = await response.json();
console.log('Auth-me response:', data);
```

**Expected:** `{ success: true, data: { user: {...} } }`

### 3. Test Notifications-Count Endpoint

```javascript
// Should return notification count
const response = await fetch('https://webflagfootballfrogs.netlify.app/.netlify/functions/notifications-count', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`
  }
});
const data = await response.json();
console.log('Notifications-count response:', data);
```

**Expected:** `{ success: true, data: { unreadCount: 0, lastOpenedAt: ... } }`

### 4. Check Browser Console
- [ ] No 401 errors for `/auth-me`
- [ ] No 401 errors for `/notifications-count`
- [ ] Notification badge updates correctly
- [ ] Dashboard loads without errors

---

## 🔍 Troubleshooting

### Issue: Still getting 401 errors

**Check:**
1. SUPABASE_SERVICE_KEY is set in Netlify environment variables
2. You're logged in with a valid Supabase session
3. The token in localStorage is not expired
4. Netlify deployment completed successfully

**Solution:**
```bash
# Check Netlify environment variables
netlify env:list

# Should show SUPABASE_SERVICE_KEY
```

### Issue: "Missing Supabase configuration" error

**Check:**
- SUPABASE_URL is set
- SUPABASE_SERVICE_KEY is set

**Solution:**
Add both environment variables to Netlify.

### Issue: Token verification fails

**Check:**
- You're using the `service_role` key, not the `anon` key
- The key is the full JWT string (starts with `eyJ...`)

**Solution:**
Re-copy the service_role key from Supabase dashboard.

---

## 🧪 Testing Locally

To test the changes locally before deploying:

### 1. Create `.env` file (if not exists):

```env
SUPABASE_URL=https://pvziciccwxgftcielknm.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2emljaWNjd3hnZnRjaWVsa25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MzcwNTgsImV4cCI6MjA3NTExMzA1OH0.1nfJrtWPl6DrAwvjGvM1-CZBeyYgCaV9oDdaadpqhLU
```

### 2. Start Netlify Dev:

```bash
netlify dev
```

### 3. Test endpoints locally:

```bash
# Test auth-me
curl http://localhost:8888/.netlify/functions/auth-me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Test notifications-count
curl http://localhost:8888/.netlify/functions/notifications-count \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📊 What Changed?

### Before (Broken):
```javascript
// Used custom JWT_SECRET
const decoded = jwt.verify(token, JWT_SECRET);  // ❌ Failed - token not signed with JWT_SECRET
```

### After (Fixed):
```javascript
// Uses Supabase authentication
const { data: { user }, error } = await supabase.auth.getUser(token);  // ✅ Works - validates Supabase token
```

---

## 🎯 Impact

Once deployed, this will fix:

✅ **Auth-me endpoint** - User authentication will work correctly
✅ **Notifications-count endpoint** - Notification badge will update
✅ **Dashboard loading** - No more 401 errors in console
✅ **Token validation** - All Supabase tokens will be accepted

---

## 📝 Next Steps (Optional)

Consider auditing other Netlify functions that may have the same issue:

```bash
# Search for JWT_SECRET usage
grep -r "JWT_SECRET" netlify/functions/

# Search for custom JWT verification
grep -r "jwt.verify" netlify/functions/
```

If any other functions use `JWT_SECRET`, they should be updated to use Supabase authentication using the same pattern.

---

## 🆘 Need Help?

If you encounter issues:

1. Check the detailed research report: `API_BROKEN_LINKS_RESEARCH.md`
2. Check Netlify function logs: Site → Functions → View logs
3. Check browser console for detailed error messages
4. Verify environment variables are set correctly

---

**Deployment Completed By:** Claude Code
**Date:** December 13, 2025
**Status:** Ready for Deployment ✅
