# Quick Fix: Login Redirect Issue

## 🚀 **Immediate Solution**

Your authentication token might be invalid or expired. Here's how to fix it:

### **Method 1: Clear Storage and Re-login**

**In Browser Console (F12):**
```javascript
// Clear all auth data
localStorage.clear();
sessionStorage.clear();

// Reload page
location.reload();
```

Then:
1. Login again with your credentials
2. Try accessing the performance page

---

### **Method 2: Check Your Authentication Status**

**In Browser Console:**
```javascript
// Check if you're authenticated
import { authManager } from './src/auth-manager.js';
await authManager.waitForInit();

console.log('Is Authenticated:', authManager.isAuthenticated());
console.log('Current User:', authManager.getCurrentUser());
console.log('Token exists:', !!localStorage.getItem('authToken'));
```

**Expected:**
- Is Authenticated: `true`
- Current User: `{ email: 'your@email.com', ... }`
- Token exists: `true`

**If any are `false`:**
- You need to re-login

---

### **Method 3: Check Browser Console Logs**

Look for these messages:
```
🔒 Checking authentication requirement...
❌ Authentication required but user not authenticated, redirecting to login
```

This confirms the authentication check is failing.

---

## 🔍 **Why This Is Happening**

The performance page has this code:
```javascript
async function initPage() {
  if (!authManager.requireAuth()) return;  // ← This line redirects to login
  // ... rest of page initialization
}
```

`requireAuth()` checks:
1. If you have a token
2. If the token is valid
3. If the user data is loaded

**If any fail → Redirect to login**

---

## 🎯 **Root Cause**

This is likely related to the authentication fixes we just made:

1. We fixed the backend functions to use Supabase authentication
2. Your browser still has an old/invalid token
3. The auth validation is now correctly failing
4. The page redirects as designed

**Solution:** Clear old tokens and re-login with fresh credentials.

---

## ✅ **After Re-login**

Once you login again:
1. ✅ New valid token will be stored
2. ✅ Performance page will load
3. ✅ No more redirects

---

## 📝 **Step-by-Step**

1. **Clear browser storage:**
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   ```

2. **Go to login page:**
   ```
   https://webflagfootballfrogs.netlify.app/login.html
   ```

3. **Login with your credentials**

4. **Try performance page again**

Should work now! 🎉
