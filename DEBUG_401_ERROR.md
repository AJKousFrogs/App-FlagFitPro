# Debugging 401 Unauthorized Error

## 🔍 Understanding the Error

**Error Location:** `api-config.js:307`
**Endpoint:** `GET https://webflagfootballfrogs.netlify.app/.netlify/functions/notifications-count`
**Status:** `401 (Unauthorized)`

---

## 🤔 What This Means

A **401 Unauthorized** error means the server received your request but **rejected the authentication token**. This can happen for several reasons:

### Possible Causes:

1. ⏳ **Deployment hasn't completed yet**
   - Old code is still running
   - Netlify is still deploying

2. 🔑 **Environment variable not loaded**
   - `SUPABASE_SERVICE_KEY` not available to function
   - Function restarted but env vars not refreshed

3. 🎫 **Invalid or expired token**
   - User token is expired
   - User not logged in properly

4. 💾 **Browser cache**
   - Old JavaScript is cached
   - Service worker serving old code

5. 🔄 **Function not redeployed**
   - Netlify didn't detect the change
   - Function needs manual redeploy

---

## 🔧 Debugging Steps

### Step 1: Verify Deployment Status

**Check Netlify Dashboard:**
1. Go to https://app.netlify.com
2. Select your site
3. Click "Deploys"
4. Look for the latest deploy with commit `7ebc2d6`
5. Check status:
   - ✅ "Published" = Deployment complete
   - ⏳ "Building" = Still deploying
   - ❌ "Failed" = Deployment error

**Expected:** Should see "Published" status

---

### Step 2: Check Function Logs

**In Netlify Dashboard:**
1. Go to **Functions** tab
2. Click on `notifications-count`
3. Look at recent invocations
4. Check error messages

**What to look for:**
- "Missing Supabase configuration" → Environment variable not set
- "Invalid or expired token" → Token issue
- "Supabase auth error" → Token verification failed

---

### Step 3: Verify Environment Variables

**In Netlify Dashboard:**
1. Go to **Site Settings** → **Environment Variables**
2. Verify these exist:
   - ✅ `SUPABASE_URL`
   - ✅ `SUPABASE_SERVICE_KEY`

**Check:**
- [ ] Both variables are present
- [ ] Values are correct
- [ ] No typos in variable names
- [ ] Scope is "All scopes"

---

### Step 4: Test Your Token

**Open Browser Console and run:**

```javascript
// 1. Check if you have a token
const token = localStorage.getItem('authToken');
console.log('Token exists:', !!token);
console.log('Token length:', token?.length);

// 2. Check token format
if (token) {
  console.log('Token starts with:', token.substring(0, 20));
  console.log('Token is JWT:', token.startsWith('eyJ'));
}

// 3. Try to manually call the endpoint
const response = await fetch('https://webflagfootballfrogs.netlify.app/.netlify/functions/notifications-count', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

console.log('Status:', response.status);
const data = await response.json();
console.log('Response:', data);
```

**Expected Results:**
- Token exists: `true`
- Token is JWT: `true`
- Status: `200` (not 401)
- Response: `{ success: true, data: { unreadCount: 0, ... } }`

**If you get 401:**
- Copy the full error message
- Check what the response says

---

### Step 5: Clear Browser Cache

**Option A: Hard Refresh**
- Windows/Linux: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

**Option B: Clear Cache**
1. Open Developer Tools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

**Option C: Incognito/Private Window**
- Open site in incognito mode
- Login fresh
- Test if error persists

---

### Step 6: Check Function Code Deployed

**Verify the new code is live:**

1. Open Netlify Dashboard
2. Go to **Functions** → `notifications-count`
3. Click "View function logs"
4. Trigger the function (reload your site)
5. Check the logs for:
   ```
   Supabase auth error: ...
   ```

**If you see this log:**
- ✅ New code is deployed
- ⚠️ Token validation is failing

**If you don't see any logs:**
- ⚠️ Function might not be deployed
- ⚠️ Function might be cached

---

## 🚨 Common Issues & Solutions

### Issue 1: "Missing Supabase configuration"

**Cause:** Environment variables not set or not loaded

**Solution:**
```bash
# Verify environment variables in Netlify
netlify env:list

# Should show:
# SUPABASE_URL
# SUPABASE_SERVICE_KEY
```

**Fix:**
1. Check Netlify environment variables
2. Ensure both `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are set
3. Trigger a new deploy to reload env vars:
   ```bash
   git commit --allow-empty -m "Trigger redeploy for env vars"
   git push origin main
   ```

---

### Issue 2: "Invalid or expired token"

**Cause:** User token is expired or invalid

**Solution:**
1. Logout and login again
2. Clear localStorage:
   ```javascript
   localStorage.clear();
   location.reload();
   ```
3. Login with fresh credentials

---

### Issue 3: Token not being sent

**Cause:** `authToken` not in localStorage

**Check:**
```javascript
console.log('Auth token:', localStorage.getItem('authToken'));
```

**Fix:**
1. Login again
2. Check if token is saved after login
3. Verify auth-manager is working

---

### Issue 4: Deployment cache

**Cause:** Netlify is serving cached functions

**Solution:**
1. Go to Netlify Dashboard
2. **Site Settings** → **Build & Deploy** → **Clear cache and deploy site**
3. Wait for deployment to complete
4. Test again

---

### Issue 5: CORS or Header Issues

**Cause:** Authorization header not being sent

**Check Network Tab:**
1. Open DevTools (F12)
2. Go to "Network" tab
3. Filter for "notifications-count"
4. Click on the request
5. Check "Request Headers"
6. Look for: `Authorization: Bearer eyJ...`

**If missing:**
- Frontend is not sending the token
- Check `api-config.js` line 293-296

**If present:**
- Backend is rejecting it
- Check function logs

---

## 🔬 Advanced Debugging

### Test the Function Directly

**Use curl to test:**

```bash
# Replace YOUR_TOKEN with your actual token from localStorage
curl -X GET "https://webflagfootballfrogs.netlify.app/.netlify/functions/notifications-count" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -v
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "unreadCount": 0,
    "lastOpenedAt": null
  }
}
```

**If you get 401:**
Look at the response body for the error message.

---

### Check Supabase Token Validity

**In browser console:**

```javascript
// Test if Supabase can verify your token
const { createClient } = supabase;
const sb = createClient(
  'https://pvziciccwxgftcielknm.supabase.co',
  'YOUR_ANON_KEY'
);

const token = localStorage.getItem('authToken');
const { data, error } = await sb.auth.getUser(token);

console.log('User:', data);
console.log('Error:', error);
```

**Expected:**
- User: `{ user: { id: '...', email: '...' } }`
- Error: `null`

**If error:**
- Token is invalid or expired
- Need to re-login

---

## 📊 Decision Tree

```
401 Error on notifications-count
    │
    ├─ Is deployment "Published"?
    │   ├─ No → Wait for deployment
    │   └─ Yes → Continue
    │
    ├─ Are env vars set?
    │   ├─ No → Add SUPABASE_URL and SUPABASE_SERVICE_KEY
    │   └─ Yes → Continue
    │
    ├─ Is token in localStorage?
    │   ├─ No → Login again
    │   └─ Yes → Continue
    │
    ├─ Is token being sent in headers?
    │   ├─ No → Check api-config.js
    │   └─ Yes → Continue
    │
    ├─ What does function log say?
    │   ├─ "Missing config" → Check env vars
    │   ├─ "Invalid token" → Re-login
    │   └─ "Supabase auth error" → Check token validity
    │
    └─ Still failing?
        └─ Clear cache and hard reload
```

---

## 🎯 Quick Fix Checklist

Run through these in order:

- [ ] **Step 1:** Verify deployment is "Published" in Netlify
- [ ] **Step 2:** Check SUPABASE_URL and SUPABASE_SERVICE_KEY are set
- [ ] **Step 3:** Clear browser cache (Ctrl+Shift+R)
- [ ] **Step 4:** Logout and login again
- [ ] **Step 5:** Check function logs in Netlify
- [ ] **Step 6:** Test token with browser console script
- [ ] **Step 7:** Clear Netlify cache and redeploy

---

## 🔑 Most Likely Causes (In Order)

1. **Deployment hasn't completed** (70% chance)
   - Wait 2-3 minutes after push
   - Check Netlify dashboard

2. **Environment variables not loaded** (20% chance)
   - Trigger new deploy
   - Check env vars are saved

3. **Token expired or invalid** (8% chance)
   - Re-login
   - Clear localStorage

4. **Browser cache** (2% chance)
   - Hard refresh
   - Incognito mode

---

## 📞 What to Check Right Now

**Run these commands in browser console:**

```javascript
// 1. Check deployment timestamp
console.log('Script loaded at:', document.lastModified);

// 2. Check token
const token = localStorage.getItem('authToken');
console.log('Have token:', !!token);

// 3. Check if user is logged in
import { authManager } from './src/auth-manager.js';
await authManager.waitForInit();
console.log('Is authenticated:', authManager.isAuthenticated());
console.log('Current user:', authManager.getCurrentUser());

// 4. Manually test the endpoint
const response = await fetch('/.netlify/functions/notifications-count', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
console.log('Status:', response.status);
console.log('Response:', await response.json());
```

---

## ✅ Success Indicators

You'll know it's fixed when:
- ✅ Status code is `200` (not 401)
- ✅ Response has `{ success: true, data: { unreadCount: ... } }`
- ✅ No errors in browser console
- ✅ Notification badge updates

---

**Next Step:** Tell me the results of the debugging steps and I can help pinpoint the exact issue!
