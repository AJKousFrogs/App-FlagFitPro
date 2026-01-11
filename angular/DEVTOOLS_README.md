# Angular DevTools + PrimeNG Debugging Setup

## 📖 Overview

This setup provides comprehensive debugging tools for Angular 21 applications with PrimeNG components, including:

- ✅ **Angular DevTools** browser extension integration
- ✅ **Custom Debug Service** for signal and effect tracking
- ✅ **HTTP Debug Interceptor** for API call monitoring
- ✅ **Performance monitoring** utilities
- ✅ **PrimeNG component debugging** patterns

## 🚀 Quick Start

### 1. Run the Setup Script

```bash
cd angular
./setup-devtools.sh
```

### 2. Install Angular DevTools Extension

Choose your browser:
- **Chrome**: [Install from Chrome Web Store](https://chrome.google.com/webstore/detail/ienfalfjdbdpebioblfackkekamfmbnh)
- **Firefox**: [Install from Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/angular-devtools/)
- **Edge**: [Install from Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/ienfalfjdbdpebioblfackkekamfmbnh)

### 3. Start Development Server

```bash
npm start
```

### 4. Open Your Browser

Navigate to: http://localhost:4200

### 5. Open DevTools

Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows/Linux)

### 6. Access Debug Utilities

In the console, type:

```javascript
window.angularDebug
```

## 📚 Documentation

### Core Guides

1. **[DEBUGGING_GUIDE.md](./DEBUGGING_GUIDE.md)** - Comprehensive debugging guide
   - Signal tracking
   - Effect monitoring
   - API call debugging
   - Performance monitoring
   - Common issues and solutions

2. **[DEVTOOLS_QUICK_REFERENCE.md](./DEVTOOLS_QUICK_REFERENCE.md)** - Quick reference card
   - Console commands
   - Keyboard shortcuts
   - Troubleshooting tips

3. **[TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)** - Testing checklist
   - 15 comprehensive tests
   - Expected results
   - Pass/fail tracking

### Code Examples

- **[src/app/examples/debugging-signals-examples.ts](./src/app/examples/debugging-signals-examples.ts)**
  - 7 practical examples
  - Copy-paste ready code
  - Real-world patterns

## 🔧 Features

### Debug Service

Located at: `src/app/core/services/debug.service.ts`

**Key Features:**
- Track signal updates automatically
- Log effect executions with timing
- Monitor API calls
- Measure performance
- Component lifecycle logging

**Usage:**

```typescript
import { Component, signal, inject } from '@angular/core';
import { DebugService } from '../../core/services/debug.service';

export class MyComponent {
  private readonly debugService = inject(DebugService);

  profileSig = signal({ name: 'John' });

  constructor() {
    // Track signal automatically
    this.debugService.trackSignal(
      this.profileSig,
      'profileSig',
      'MyComponent'
    );
  }
}
```

### HTTP Debug Interceptor

Located at: `src/app/core/interceptors/debug.interceptor.ts`

**Features:**
- Automatically logs all HTTP requests/responses
- Color-coded console output
- Performance timing
- Error details and troubleshooting tips
- Only active in development mode

**Console Output:**

```
🌐 HTTP GET https://api.example.com/data
  Request: { url, method, headers, body }
  Response: { status: 200, body: {...}, duration: "123.45ms" }
```

### Console Debug Utilities

**Available Commands:**

```javascript
// View logs
window.angularDebug.getSignalLogs()  // All signal updates
window.angularDebug.getEffectLogs()  // All effect executions
window.angularDebug.getApiLogs()     // All API calls

// Filter logs
window.angularDebug.getApiLogs().filter(log => log.status >= 400)  // Failed requests
window.angularDebug.getApiLogs().filter(log => log.duration > 1000) // Slow requests

// Clear logs
window.angularDebug.clearLogs()

// Configure debug service
window.angularDebug.setConfig({
  enableSignalLogging: true,
  enableEffectLogging: true,
  enableApiLogging: true,
  enablePerformanceLogging: true,
  logStackTraces: false
})

// View configuration
window.angularDebug.getConfig()
```

## 📊 Debugging Signals

### Method 1: Using Debug Service

```typescript
import { inject } from '@angular/core';
import { DebugService } from '../../core/services/debug.service';

export class MyComponent {
  private readonly debugService = inject(DebugService);

  mySignal = signal({ value: 0 });

  constructor() {
    this.debugService.trackSignal(this.mySignal, 'mySignal', 'MyComponent');
  }
}
```

**Console Output:**
```
📊 Signal Update [MyComponent] mySignal { value: 0 }
```

### Method 2: Manual Effect Logging

```typescript
import { effect } from '@angular/core';

constructor() {
  effect(() => {
    console.log('📊 Signal updated:', this.mySignal());
  });
}
```

### Method 3: Using Angular DevTools

1. Open DevTools (F12)
2. Click **Angular** tab
3. Select component from tree
4. View signals in **Properties** panel

## ⚡ Debugging Effects

```typescript
import { effect } from '@angular/core';

constructor() {
  effect(() => {
    console.time('MyEffect');
    const value = this.mySignal();
    // Do work...
    console.timeEnd('MyEffect');
    console.log('⚡ Effect completed:', value);
  });
}
```

## 🌐 Debugging API Calls

### Check Chrome Network Tab

1. Open DevTools (F12)
2. Go to **Network** tab
3. Filter by **Fetch/XHR**
4. Look for:
   - Red entries = Failed requests
   - Status codes (200, 400, 500, etc.)
   - Request/response payloads

### Check Debug Interceptor Logs

Console automatically shows:

```
🌐 HTTP GET https://...
  Request: { ... }
  Response: { status: 200, duration: "123ms" }
```

Failed requests show detailed guidance:

```
❌ Network Error: Request failed to reach server
Possible causes:
  - CORS issue
  - Backend server not running
  - Network connectivity problem
```

## 🔘 Debugging Unresponsive Buttons

### Step 1: Add Click Logging

```typescript
onButtonClick() {
  console.log('=== Button Click Debug ===');
  console.log('1. Click registered');
  console.log('2. Current state:', {
    isLoading: this.isLoading(),
    isDisabled: this.isDisabled()
  });

  try {
    this.performAction();
    console.log('3. Action completed');
  } catch (error) {
    console.error('4. Action failed:', error);
  }
}
```

### Step 2: Check Disabled State

```typescript
isButtonDisabled = computed(() => {
  return this.isLoading() || this.hasError();
});

constructor() {
  effect(() => {
    console.log('🔘 Button disabled:', this.isButtonDisabled());
  });
}
```

### Step 3: Check Network Tab

Look for failed API calls that might prevent button from working.

## 🎨 Debugging PrimeNG Components

### Track Component State

```typescript
import { ViewChild } from '@angular/core';
import { Table } from 'primeng/table';

export class MyComponent {
  @ViewChild(Table) table?: Table;

  ngAfterViewInit() {
    console.log('PrimeNG Table:', this.table);
    console.log('Table value:', this.table?.value);
    console.log('Table selection:', this.table?.selection);
  }
}
```

### Log Component Events

```html
<p-table
  [value]="items"
  (onRowSelect)="onRowSelect($event)"
  (onFilter)="onFilter($event)"
>
</p-table>
```

```typescript
onRowSelect(event: any) {
  console.log('🎯 Row selected:', event);
  console.log('Data:', event.data);
}

onFilter(event: any) {
  console.log('🔍 Table filtered:', event);
  console.log('Filters:', event.filters);
}
```

## 📈 Performance Monitoring

### Measure Synchronous Operations

```typescript
const result = this.debugService.measurePerformance(
  'Process data',
  () => {
    // Your code here
    return this.processData();
  },
  1000 // Warn if > 1000ms
);
```

### Measure Asynchronous Operations

```typescript
await this.debugService.measurePerformanceAsync(
  'Fetch user data',
  async () => {
    return await this.apiService.getUser();
  },
  500 // Warn if > 500ms
);
```

### Check Component Render Time

```typescript
import { AfterViewInit } from '@angular/core';

export class MyComponent implements AfterViewInit {
  private renderStart = performance.now();

  ngAfterViewInit() {
    const renderTime = performance.now() - this.renderStart;
    console.log(`⏱️ Component render: ${renderTime.toFixed(2)}ms`);
  }
}
```

## 🚨 Common Issues

### Issue: Signals Not Updating

**Check:**
1. Using `.set()` or `.update()` to modify signals?
2. Signal being read inside effect or computed?
3. Check Angular DevTools for current value

**Solution:**
```typescript
// ❌ Wrong
this.mySig().value = 10;

// ✅ Correct
this.mySig.update(v => ({ ...v, value: 10 }));
```

### Issue: Effects Not Running

**Check:**
1. Is effect reading any signals?
2. Component destroyed before effect runs?

**Solution:**
```typescript
// ❌ Wrong - doesn't read signals
effect(() => {
  this.doSomething();
});

// ✅ Correct - reads signal
effect(() => {
  const value = this.mySignal();
  this.doSomething(value);
});
```

### Issue: Buttons Not Responding

**Check:**
1. Network tab for failed API calls
2. Console for errors
3. Button disabled state
4. Event handler binding

**Debug:**
```typescript
onButtonClick() {
  console.log('Button clicked');
  console.log('State:', {
    isLoading: this.isLoading(),
    isDisabled: this.isDisabled()
  });
}
```

## 🎓 Best Practices

1. **Use Debug Service in Development Only**
   - Automatically disabled in production
   - No performance impact on prod builds

2. **Log Strategically**
   - Focus on critical signals
   - Don't log everything

3. **Track Performance**
   - Measure slow operations
   - Set reasonable thresholds

4. **Use Angular DevTools**
   - Faster than console logging
   - Real-time updates
   - Component visualization

5. **Check Network Tab First**
   - Identify failed requests
   - Check request timing
   - Inspect payloads

## 📋 Testing

Run through the testing checklist:

```bash
open TESTING_CHECKLIST.md
```

This includes 15 comprehensive tests to verify the setup.

## 🔗 Resources

- [Angular DevTools Documentation](https://angular.dev/tools/devtools)
- [Angular Signals Guide](https://angular.dev/guide/signals)
- [Chrome DevTools Network Tab](https://developer.chrome.com/docs/devtools/network/)
- [PrimeNG Documentation](https://primeng.org/)

## 💡 Quick Commands Cheat Sheet

```javascript
// Enable all logging
window.angularDebug.setConfig({
  enableSignalLogging: true,
  enableEffectLogging: true,
  enableApiLogging: true,
  enablePerformanceLogging: true
})

// View recent changes
window.angularDebug.getSignalLogs().slice(-10)
window.angularDebug.getApiLogs().slice(-5)

// Find issues
window.angularDebug.getApiLogs().filter(log => log.status >= 400)  // Failed
window.angularDebug.getApiLogs().filter(log => log.duration > 1000) // Slow

// Clear everything
window.angularDebug.clearLogs()
```

## 🆘 Need Help?

1. Check the console for detailed logs
2. Review [DEBUGGING_GUIDE.md](./DEBUGGING_GUIDE.md)
3. Use [DEVTOOLS_QUICK_REFERENCE.md](./DEVTOOLS_QUICK_REFERENCE.md)
4. Check [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)

---

**Happy Debugging!** 🎉
