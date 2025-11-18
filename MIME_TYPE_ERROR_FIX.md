# MIME Type Error Fix

## Understanding and Resolving "Expected a JavaScript module script" Error

**Error Message:**

```
Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "text/html". Strict MIME type checking is enforced for module scripts per HTML spec.
```

---

## What This Error Means

This error occurs when:

1. **The browser requests a `.js` file** (like `real-team-data.js`)
2. **The server returns HTML instead** (usually a 404 error page)
3. **The browser expects JavaScript** but gets HTML
4. **MIME type mismatch** causes the error

---

## Root Causes

### 1. **Incorrect Import Path** ✅ FIXED

**Problem:** Import path doesn't resolve to the actual file location

**Example:**

```javascript
// WRONG - File doesn't exist at this path
import { REAL_TEAM_DATA } from "../real-team-data.js";
// Looking for: src/js/real-team-data.js (doesn't exist)

// CORRECT - File exists at this path
import { REAL_TEAM_DATA } from "../../real-team-data.js";
// Looking for: src/real-team-data.js (exists!)
```

**Fix Applied:**

- ✅ Fixed `src/js/pages/settings-page.js` import path
- ✅ Verified `src/js/pages/training-page.js` import path (already correct)

---

### 2. **Server Configuration Issues**

If the path is correct but you still get the error, check:

#### Server MIME Type Configuration

Your server needs to serve `.js` files with `application/javascript` MIME type.

**Check `simple-server.js`:**

```javascript
const mimeTypes = {
  ".js": "application/javascript", // ✅ Correct
  // ...
};
```

**Check `server.js`:**

```javascript
if (path.endsWith(".js")) {
  res.setHeader("Content-Type", "application/javascript"); // ✅ Correct
}
```

---

### 3. **404 Error Page Being Served**

When a file doesn't exist, some servers return an HTML 404 page. The browser sees HTML instead of JavaScript and throws this error.

**Solution:** Ensure the file path is correct (see #1 above)

---

## How to Debug

### Step 1: Verify File Exists

```bash
# Check if file exists
ls -la src/real-team-data.js

# Find all instances
find . -name "real-team-data.js" -type f
```

### Step 2: Check Import Paths

```bash
# Find all imports
grep -r "real-team-data.js" src/
```

### Step 3: Test in Browser DevTools

1. Open DevTools (F12)
2. Go to Network tab
3. Reload page
4. Look for `real-team-data.js` request
5. Check:
   - **Status:** Should be 200 (not 404)
   - **Type:** Should be "script" (not "document")
   - **Response:** Should be JavaScript code (not HTML)

### Step 4: Check Server Logs

Look for 404 errors in server console when loading the page.

---

## Fixes Applied

### ✅ Fixed Import Path in `settings-page.js`

**Before:**

```javascript
import { REAL_TEAM_DATA, getAllPlayers } from "../real-team-data.js";
// ❌ Looking for: src/js/real-team-data.js (doesn't exist)
```

**After:**

```javascript
import { REAL_TEAM_DATA, getAllPlayers } from "../../real-team-data.js";
// ✅ Looking for: src/real-team-data.js (exists!)
```

### ✅ Verified Other Import Paths

- `src/js/pages/training-page.js`: ✅ Already correct (`../../real-team-data.js`)
- `roster.html`: ✅ Already correct (`./src/real-team-data.js`)

---

## Prevention Tips

### 1. Use Absolute Paths (Recommended)

Consider using import maps or absolute paths from project root:

```html
<script type="importmap">
  {
    "imports": {
      "@/": "/src/",
      "@/data/": "/src/real-team-data.js"
    }
  }
</script>
```

### 2. Verify Paths Relative to File Location

- `src/js/pages/file.js` → `../../real-team-data.js` = `src/real-team-data.js` ✅
- `src/js/pages/file.js` → `../real-team-data.js` = `src/js/real-team-data.js` ❌

### 3. Use Path Aliases

Configure path aliases in your build tool or use import maps.

---

## Testing the Fix

1. **Clear browser cache**
2. **Restart dev server**
3. **Reload page**
4. **Check browser console** - error should be gone
5. **Check Network tab** - `real-team-data.js` should load with status 200

---

## Related Files

- `src/real-team-data.js` - The actual file
- `src/js/pages/settings-page.js` - Fixed import path
- `src/js/pages/training-page.js` - Verified import path
- `roster.html` - Verified import path
- `simple-server.js` - Server MIME type configuration
- `server.js` - Express server MIME type configuration

---

## Summary

**Root Cause:** Incorrect relative import path in `settings-page.js`  
**Fix:** Changed `'../real-team-data.js'` to `'../../real-team-data.js'`  
**Status:** ✅ Fixed

The error should now be resolved. If you still see it:

1. Clear browser cache
2. Restart dev server
3. Verify file exists at `src/real-team-data.js`
4. Check Network tab in DevTools for actual request/response
