# Angular DevTools Quick Reference

## 🚀 Quick Start

### 1. Install Angular DevTools Browser Extension
- Chrome: https://chrome.google.com/webstore/detail/ienfalfjdbdpebioblfackkekamfmbnh
- Firefox: https://addons.mozilla.org/en-US/firefox/addon/angular-devtools/
- Edge: https://microsoftedge.microsoft.com/addons/detail/ienfalfjdbdpebioblfackkekamfmbnh

### 2. Open DevTools
Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows/Linux)

### 3. Go to Angular Tab
Look for the **Angular** tab next to Console, Network, etc.

## 📊 Debug Utilities (Console)

### Access Debug Tools
```javascript
window.angularDebug
```

### View Logs
```javascript
// Get all signal updates
window.angularDebug.getSignalLogs()

// Get last 5 signal updates
window.angularDebug.getSignalLogs().slice(-5)

// Get all effect executions
window.angularDebug.getEffectLogs()

// Get all API calls
window.angularDebug.getApiLogs()

// Get failed API calls
window.angularDebug.getApiLogs().filter(log => log.status >= 400)

// Get slow API calls (> 1 second)
window.angularDebug.getApiLogs().filter(log => log.duration > 1000)
```

### Clear Logs
```javascript
window.angularDebug.clearLogs()
```

### Configure Debug Service
```javascript
// Enable all logging
window.angularDebug.setConfig({
  enableSignalLogging: true,
  enableEffectLogging: true,
  enableApiLogging: true,
  enablePerformanceLogging: true,
  logStackTraces: false
})

// Disable signal logging
window.angularDebug.setConfig({
  enableSignalLogging: false
})

// View current config
window.angularDebug.getConfig()
```

## 🔍 Chrome Network Tab

### Check API Calls
1. Open DevTools (F12)
2. Go to **Network** tab
3. Filter by `Fetch/XHR`
4. Click on a request to see:
   - Headers
   - Payload
   - Response
   - Timing

### Find Failed Requests
- Red entries = Failed requests
- Look for status codes: 400, 401, 403, 404, 500, etc.

### Check Request Timing
- Click on request → **Timing** tab
- Look for:
  - Waiting (TTFB) - time to first byte
  - Content Download - how long to download response
  - Total time

## 🎯 Angular DevTools Features

### Component Inspector
1. Open Angular DevTools
2. Click **Components** tab
3. Select component from tree
4. View in right panel:
   - **Properties** - All component signals, inputs, outputs
   - **Injector** - All injected services
   - **Source** - Link to component source code

### Profiler
1. Click **Profiler** tab
2. Click **Record** button (red circle)
3. Interact with your app
4. Click **Stop** button
5. View:
   - Change detection cycles
   - Component render times
   - Performance bottlenecks

## 💡 Common Debug Patterns

### Debug Signal Not Updating
```typescript
// Add effect to track signal changes
effect(() => {
  console.log('Signal value:', this.mySignal());
});
```

### Debug Button Not Working
```typescript
onButtonClick() {
  console.log('=== Button Debug ===');
  console.log('1. Click registered');
  console.log('2. Current state:', {
    isLoading: this.isLoading(),
    isDisabled: this.isDisabled()
  });
  
  // Your code...
}
```

### Debug API Call
```typescript
async loadData() {
  console.log('Starting API call...');
  const start = performance.now();
  
  try {
    const data = await this.apiService.getData();
    const duration = performance.now() - start;
    console.log('✅ Success:', { data, duration: `${duration}ms` });
  } catch (error) {
    const duration = performance.now() - start;
    console.error('❌ Failed:', { error, duration: `${duration}ms` });
  }
}
```

### Debug Effect Not Running
```typescript
constructor() {
  // Effect must read at least one signal
  effect(() => {
    // ❌ WRONG - doesn't read any signals
    this.doSomething();
    
    // ✅ CORRECT - reads signal
    const value = this.mySignal();
    this.doSomething(value);
  });
}
```

## 📱 Console Output Legend

| Icon | Meaning |
|------|---------|
| 📊 | Signal update |
| ⚡ | Effect execution |
| 🌐 | HTTP request/response |
| ⏱️ | Performance measurement |
| 🔄 | Component lifecycle |
| ✅ | Success |
| ❌ | Error |
| ⚠️ | Warning |
| 🔘 | Button state change |
| 🎯 | Event triggered |

## 🔧 Troubleshooting

### Issue: Angular DevTools not showing
**Solution:**
1. Refresh the page
2. Open DevTools **after** page loads
3. Make sure you're in development mode
4. Check that Angular is running: `ng.getComponent($0)` in console

### Issue: No debug logs in console
**Solution:**
```javascript
// Check if debug mode is enabled
window.angularDebug.getConfig()

// Enable debug logging
window.angularDebug.setConfig({
  enableSignalLogging: true,
  enableEffectLogging: true,
  enableApiLogging: true
})
```

### Issue: Too many logs
**Solution:**
```javascript
// Disable specific logging
window.angularDebug.setConfig({
  enableSignalLogging: false,  // Turn off signal logs
  enableEffectLogging: false   // Turn off effect logs
})

// Or clear logs
window.angularDebug.clearLogs()
```

### Issue: Can't find which signal changed
**Solution:**
```javascript
// View recent signal changes
window.angularDebug.getSignalLogs()
  .slice(-10)
  .forEach(log => {
    console.log(`${log.signalName} in ${log.componentName}:`, log.value);
  })
```

## 📚 Additional Resources

- [Angular DevTools Guide](https://angular.dev/tools/devtools)
- [Chrome DevTools Network Tab](https://developer.chrome.com/docs/devtools/network/)
- [Project Debugging Guide](./DEBUGGING_GUIDE.md)
- [Signal Debugging Examples](./src/app/examples/debugging-signals-examples.ts)

## ⌨️ Keyboard Shortcuts

| Action | Shortcut (Mac) | Shortcut (Win/Linux) |
|--------|---------------|---------------------|
| Open DevTools | `Cmd+Option+I` | `Ctrl+Shift+I` |
| Toggle Console | `Cmd+Option+J` | `Ctrl+Shift+J` |
| Clear Console | `Cmd+K` | `Ctrl+L` |
| Search in file | `Cmd+F` | `Ctrl+F` |
| Next search result | `Cmd+G` | `F3` |

## 🎨 Console Styling

### Custom Log Colors
```typescript
// Success (green)
console.log('%c✅ Success', 'color: #4caf50; font-weight: bold;');

// Error (red)
console.error('%c❌ Error', 'color: #f44336; font-weight: bold;');

// Warning (orange)
console.warn('%c⚠️ Warning', 'color: #ff9800; font-weight: bold;');

// Info (blue)
console.log('%c📊 Info', 'color: #2196f3; font-weight: bold;');
```

### Grouped Logs
```typescript
console.group('API Call Details');
console.log('URL:', url);
console.log('Method:', method);
console.log('Status:', status);
console.groupEnd();
```

---

**Pro Tip:** Keep this reference open in a browser tab while debugging!
