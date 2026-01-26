# Testing Angular DevTools + Debug Setup

## ✅ Pre-Testing Checklist

- [ ] Angular DevTools browser extension installed
- [ ] Dev server running (`npm start`)
- [ ] Browser DevTools open (F12)
- [ ] Angular tab visible in DevTools
- [ ] Console tab open

## 🧪 Test 1: Debug Service Access

### Steps:

1. Open browser console
2. Type: `window.angularDebug`
3. Press Enter

### Expected Result:

```javascript
{
  getSignalLogs: ƒ,
  getEffectLogs: ƒ,
  getApiLogs: ƒ,
  clearLogs: ƒ,
  setConfig: ƒ,
  getConfig: ƒ
}
```

### ✅ Pass / ❌ Fail: **\_**

---

## 🧪 Test 2: View Initial Configuration

### Steps:

1. In console, type: `window.angularDebug.getConfig()`
2. Press Enter

### Expected Result:

```javascript
{
  enableSignalLogging: true,
  enableEffectLogging: true,
  enableApiLogging: true,
  enablePerformanceLogging: true,
  logStackTraces: false
}
```

### ✅ Pass / ❌ Fail: **\_**

---

## 🧪 Test 3: HTTP Interceptor Logging

### Steps:

1. Navigate to any page that makes API calls (e.g., Dashboard)
2. Check console for HTTP logs

### Expected Result:

Console shows grouped HTTP logs like:

```
🌐 HTTP GET https://...
  Request: { url, method, headers, body }
  Response: { status, statusText, body, duration }
```

### ✅ Pass / ❌ Fail: **\_**

---

## 🧪 Test 4: Signal Tracking (Manual Test)

### Steps:

1. Navigate to Player Dashboard
2. Open console
3. Type: `window.angularDebug.getSignalLogs()`
4. Press Enter

### Expected Result:

Array of signal log entries with structure:

```javascript
[
  {
    signalName: "...",
    value: ...,
    timestamp: 1234567890,
    componentName: "..."
  }
]
```

### ✅ Pass / ❌ Fail: **\_**

---

## 🧪 Test 5: API Call Logging

### Steps:

1. Navigate to a page that makes API calls
2. Wait for API calls to complete
3. In console, type: `window.angularDebug.getApiLogs()`
4. Press Enter

### Expected Result:

Array of API log entries:

```javascript
[
  {
    url: "https://...",
    method: "GET",
    status: 200,
    duration: 123.45,
    timestamp: 1234567890,
  },
];
```

### ✅ Pass / ❌ Fail: **\_**

---

## 🧪 Test 6: Failed API Call Detection

### Steps:

1. Temporarily break an API endpoint (or disconnect network)
2. Trigger an API call
3. Check console for error logs

### Expected Result:

Console shows detailed error information:

```
❌ Network Error: Request failed to reach server
Possible causes:
  - CORS issue
  - Backend server not running
  - Network connectivity problem
```

### ✅ Pass / ❌ Fail: **\_**

---

## 🧪 Test 7: Performance Monitoring

### Steps:

1. Navigate to Dashboard
2. Check console for performance logs

### Expected Result:

Console shows performance measurements:

```
⏱️ Performance: Load dashboard data (123.45ms)
```

### ✅ Pass / ❌ Fail: **\_**

---

## 🧪 Test 8: Slow API Warning

### Steps:

1. Navigate to a page with API calls
2. Look for warnings in console for slow requests

### Expected Result:

If any request takes > 2 seconds:

```
⚠️ Slow API call detected: https://... (2345.67ms)
```

### ✅ Pass / ❌ Fail: **\_**

---

## 🧪 Test 9: Clear Logs

### Steps:

1. Accumulate some logs by navigating pages
2. In console, type: `window.angularDebug.clearLogs()`
3. Type: `window.angularDebug.getSignalLogs()`
4. Type: `window.angularDebug.getApiLogs()`

### Expected Result:

Both return empty arrays: `[]`

### ✅ Pass / ❌ Fail: **\_**

---

## 🧪 Test 10: Configuration Update

### Steps:

1. In console, type:

```javascript
window.angularDebug.setConfig({
  enableSignalLogging: false,
  enableApiLogging: false,
});
```

2. Navigate to a new page
3. Type: `window.angularDebug.getSignalLogs()`

### Expected Result:

- Console message: "Debug config updated: ..."
- No new signal logs appear
- API logs still work (only signal/API logging disabled)

### ✅ Pass / ❌ Fail: **\_**

---

## 🧪 Test 11: Angular DevTools - Component Inspection

### Steps:

1. Open DevTools
2. Click "Angular" tab
3. Click "Components" in sidebar
4. Select "PlayerDashboardComponent" from tree
5. View properties in right panel

### Expected Result:

- Component hierarchy visible
- Properties panel shows component signals
- Can see signal values in real-time

### ✅ Pass / ❌ Fail: **\_**

---

## 🧪 Test 12: Angular DevTools - Profiler

### Steps:

1. In Angular DevTools, click "Profiler" tab
2. Click "Record" button (red circle)
3. Navigate to different pages
4. Click "Stop" button
5. View profiler results

### Expected Result:

- Profiler shows change detection cycles
- Component render times visible
- Can identify performance bottlenecks

### ✅ Pass / ❌ Fail: **\_**

---

## 🧪 Test 13: Button Click Debugging

### Steps:

1. Add this code to a component:

```typescript
onButtonClick() {
  console.log('=== Button Debug ===');
  console.log('Button clicked at:', new Date().toISOString());
}
```

2. Click the button
3. Check console

### Expected Result:

Console shows:

```
=== Button Debug ===
Button clicked at: 2026-01-11T...
```

### ✅ Pass / ❌ Fail: **\_**

---

## 🧪 Test 14: Signal Effect Tracking

### Steps:

1. Add this code to a component:

```typescript
constructor() {
  effect(() => {
    console.log('Profile signal updated:', this.profileSig());
  });
}
```

2. Update the signal
3. Check console

### Expected Result:

Console shows:

```
Profile signal updated: { ... }
```

### ✅ Pass / ❌ Fail: **\_**

---

## 🧪 Test 15: Chrome Network Tab

### Steps:

1. Open Chrome DevTools
2. Go to "Network" tab
3. Filter by "Fetch/XHR"
4. Navigate to Dashboard
5. Check for API requests

### Expected Result:

- All API requests visible
- Can click on request to see details
- Status codes visible
- Request/response payloads visible

### ✅ Pass / ❌ Fail: **\_**

---

## 📊 Test Summary

| Test                       | Status | Notes |
| -------------------------- | ------ | ----- |
| 1. Debug Service Access    | ⬜     |       |
| 2. View Configuration      | ⬜     |       |
| 3. HTTP Interceptor        | ⬜     |       |
| 4. Signal Tracking         | ⬜     |       |
| 5. API Call Logging        | ⬜     |       |
| 6. Failed API Detection    | ⬜     |       |
| 7. Performance Monitoring  | ⬜     |       |
| 8. Slow API Warning        | ⬜     |       |
| 9. Clear Logs              | ⬜     |       |
| 10. Configuration Update   | ⬜     |       |
| 11. Component Inspection   | ⬜     |       |
| 12. Profiler               | ⬜     |       |
| 13. Button Click Debug     | ⬜     |       |
| 14. Signal Effect Tracking | ⬜     |       |
| 15. Network Tab            | ⬜     |       |

**Total Passed:** **\_ / 15
**Total Failed:** \_** / 15

---

## 🐛 Troubleshooting Failed Tests

### Debug Service Not Available

**Solution:**

1. Check browser console for errors
2. Verify dev mode: `ng serve` (not `ng serve --prod`)
3. Refresh the page
4. Check `app.config.ts` has debug interceptor imported

### Angular DevTools Not Showing

**Solution:**

1. Verify extension is installed and enabled
2. Refresh the page
3. Open DevTools **after** page loads
4. Check for Angular detection: Type `ng` in console

### No HTTP Logs

**Solution:**

1. Check console filter (should show "All levels")
2. Verify debug interceptor is registered in `app.config.ts`
3. Check if API calls are actually being made (Network tab)

### Signal Logs Empty

**Solution:**

1. Verify components are using `trackSignal()` method
2. Check if signal logging is enabled:
   ```javascript
   window.angularDebug.getConfig();
   ```
3. Navigate to different pages to trigger signal updates

---

## 📝 Additional Notes

_Space for additional observations, issues, or notes during testing:_

---

**Tested By:** **\*\***\_**\*\***
**Date:** **\*\***\_**\*\***
**Environment:**

- Browser: **\*\***\_**\*\***
- Angular Version: 21.x
- Node Version: 22.x
