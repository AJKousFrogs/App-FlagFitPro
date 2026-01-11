# Angular DevTools & PrimeNG Debugging Guide

## 🎯 Overview

This guide shows you how to debug Angular 21 signals, effects, and unresponsive buttons using the built-in debugging tools.

## 📦 What's Installed

### 1. Angular DevTools (Browser Extension)
You need to install the **Angular DevTools** browser extension:

- **Chrome**: [Angular DevTools - Chrome Web Store](https://chrome.google.com/webstore/detail/angular-devtools/ienfalfjdbdpebioblfackkekamfmbnh)
- **Firefox**: [Angular DevTools - Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/angular-devtools/)
- **Edge**: [Angular DevTools - Microsoft Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/angular-devtools/ienfalfjdbdpebioblfackkekamfmbnh)

After installation, open DevTools (F12) and look for the **Angular** tab.

### 2. Custom Debug Service

We've created a custom `DebugService` with these features:
- ✅ Signal tracking and logging
- ✅ Effect monitoring
- ✅ API call tracing
- ✅ Performance measurements
- ✅ Component lifecycle debugging

### 3. HTTP Debug Interceptor

Automatically logs all HTTP requests/responses in development mode.

## 🔧 Using the Debug Service

### Access Debug Utilities

In development mode, open the browser console and type:

```javascript
window.angularDebug
```

Available commands:
```javascript
// Get all signal updates
window.angularDebug.getSignalLogs()

// Get all effect executions
window.angularDebug.getEffectLogs()

// Get all API calls
window.angularDebug.getApiLogs()

// Clear all logs
window.angularDebug.clearLogs()

// Update debug configuration
window.angularDebug.setConfig({
  enableSignalLogging: true,
  enableEffectLogging: true,
  enableApiLogging: true,
  enablePerformanceLogging: true,
  logStackTraces: false
})

// Get current configuration
window.angularDebug.getConfig()
```

## 📊 Debugging Signals

### Method 1: Using DebugService in Your Component

```typescript
import { Component, signal, effect, inject } from '@angular/core';
import { DebugService } from '../../core/services/debug.service';

@Component({
  selector: 'app-my-component',
  template: `...`
})
export class MyComponent {
  private readonly debugService = inject(DebugService);

  // Create a signal
  profileSig = signal({ name: 'John', age: 30 });

  constructor() {
    // Track this signal automatically
    this.debugService.trackSignal(
      this.profileSig,
      'profileSig',
      'MyComponent'
    );

    // Manual effect with logging
    effect(() => {
      const profile = this.profileSig();
      console.log('Profile updated:', profile);
    });
  }

  updateProfile() {
    this.profileSig.update(p => ({ ...p, age: p.age + 1 }));
    // Console will show: 📊 Signal Update [MyComponent] profileSig { name: 'John', age: 31 }
  }
}
```

### Method 2: Manual Effect Logging

```typescript
import { effect } from '@angular/core';

constructor() {
  // Simple effect with console logging
  effect(() => {
    const profile = this.profileSig();
    console.log('📊 Profile Signal Updated:', profile);
  });

  // Track multiple signals
  effect(() => {
    const profile = this.profileSig();
    const settings = this.settingsSig();
    console.log('📊 Multiple Signals Updated:', { profile, settings });
  });
}
```

### Method 3: Using Angular DevTools Extension

1. Open DevTools (F12)
2. Click the **Angular** tab
3. Click **Components** in the sidebar
4. Select your component in the tree
5. View all signals in the **Properties** panel
6. Watch signal values update in real-time

## ⚡ Debugging Effects

### Track Effect Execution

```typescript
import { effect, inject } from '@angular/core';
import { DebugService } from '../../core/services/debug.service';

export class MyComponent {
  private readonly debugService = inject(DebugService);

  constructor() {
    // Log effect execution with timing
    this.debugService.logEffect('profileUpdate', 'MyComponent', () => {
      const profile = this.profileSig();
      console.log('Effect triggered by profile change:', profile);
    });
  }
}
```

### Manual Effect Logging

```typescript
constructor() {
  effect(() => {
    console.time('ProfileEffect');
    const profile = this.profileSig();
    // Do work...
    console.timeEnd('ProfileEffect');
    console.log('⚡ Effect completed:', profile);
  });
}
```

## 🌐 Debugging Unresponsive Buttons & Failed API Calls

### Step 1: Check Chrome Network Tab

1. Open DevTools (F12)
2. Go to **Network** tab
3. Click the button that's unresponsive
4. Look for failed API calls (red entries)

### Step 2: Use Debug Interceptor

Our debug interceptor automatically logs all HTTP requests. Check console for:

```
🌐 HTTP GET https://api.example.com/data
Request: { url, method, headers, body, params }
Response: { status, statusText, body, duration }
```

Failed requests show detailed error information:

```
❌ Network Error: Request failed to reach server
Possible causes:
  - CORS issue
  - Backend server not running
  - Network connectivity problem
  - Request cancelled/aborted
```

### Step 3: Debug Button Click Events

Add logging to your button click handlers:

```typescript
onButtonClick() {
  console.log('🖱️ Button clicked');

  // Measure performance
  const start = performance.now();

  this.apiService.getData().subscribe({
    next: (data) => {
      const duration = performance.now() - start;
      console.log('✅ API call succeeded:', { data, duration: `${duration}ms` });
    },
    error: (error) => {
      const duration = performance.now() - start;
      console.error('❌ API call failed:', { error, duration: `${duration}ms` });
    }
  });
}
```

### Step 4: Check for Disabled State

```typescript
// Add signal for button state
isButtonDisabled = computed(() => {
  const isLoading = this.isLoading();
  const hasError = this.hasError();
  return isLoading || hasError;
});

// Log when button state changes
constructor() {
  effect(() => {
    console.log('🔘 Button disabled state:', this.isButtonDisabled());
  });
}
```

## 🔍 Debugging PrimeNG Components

### Enable PrimeNG Debug Mode

In `app.config.ts`:

```typescript
providePrimeNG({
  ripple: false,
  // Add debug mode (not official, but helps)
  theme: {
    preset: Aura,
    options: {
      prefix: 'p',
      darkModeSelector: '.dark-theme'
    }
  }
})
```

### Check PrimeNG Component Props

```typescript
// In your component
import { ViewChild } from '@angular/core';
import { Table } from 'primeng/table';

export class MyComponent {
  @ViewChild(Table) table?: Table;

  ngAfterViewInit() {
    // Log PrimeNG component instance
    console.log('PrimeNG Table instance:', this.table);
    console.log('Table value:', this.table?.value);
    console.log('Table selection:', this.table?.selection);
  }
}
```

### Debug PrimeNG Events

```html
<p-table
  [value]="items"
  (onRowSelect)="onRowSelect($event)"
  (onFilter)="onFilter($event)"
>
  <!-- columns -->
</p-table>
```

```typescript
onRowSelect(event: any) {
  console.log('🎯 Row selected:', event);
  console.log('Selected data:', event.data);
  console.log('Type:', event.type);
}

onFilter(event: any) {
  console.log('🔍 Table filtered:', event);
  console.log('Filtered value:', event.filteredValue);
  console.log('Filters:', event.filters);
}
```

## 📈 Performance Debugging

### Measure Performance

```typescript
import { inject } from '@angular/core';
import { DebugService } from '../../core/services/debug.service';

export class MyComponent {
  private readonly debugService = inject(DebugService);

  loadData() {
    // Synchronous measurement
    const result = this.debugService.measurePerformance(
      'Load dashboard data',
      () => {
        // Your code here
        return this.processData();
      },
      1000 // Warn if > 1000ms
    );

    // Async measurement
    await this.debugService.measurePerformanceAsync(
      'Fetch user data',
      async () => {
        return await this.apiService.getUser();
      },
      500 // Warn if > 500ms
    );
  }
}
```

### Check Component Rendering Performance

```typescript
import { AfterViewInit, OnDestroy } from '@angular/core';

export class MyComponent implements AfterViewInit, OnDestroy {
  private renderStart = performance.now();

  ngAfterViewInit() {
    const renderTime = performance.now() - this.renderStart;
    console.log(`⏱️ Component render time: ${renderTime.toFixed(2)}ms`);

    if (renderTime > 100) {
      console.warn('⚠️ Slow component render detected');
    }
  }

  ngOnDestroy() {
    console.log('🗑️ Component destroyed');
  }
}
```

## 🚨 Common Issues & Solutions

### Issue 1: Signals Not Updating

**Check:**
1. Are you using `.set()` or `.update()` to modify signals?
2. Is the signal being read inside an effect or computed?
3. Check Angular DevTools to see current signal value

**Solution:**
```typescript
// ❌ Wrong - direct mutation doesn't trigger updates
this.profileSig().age = 31;

// ✅ Correct - use .update() or .set()
this.profileSig.update(p => ({ ...p, age: 31 }));
```

### Issue 2: Effects Not Running

**Check:**
1. Is the effect reading any signals?
2. Is the component destroyed before effect runs?
3. Check console for effect execution logs

**Solution:**
```typescript
// ❌ Wrong - effect doesn't read any signals
effect(() => {
  this.doSomething();
});

// ✅ Correct - effect reads signals
effect(() => {
  const profile = this.profileSig(); // Reading signal triggers effect
  this.doSomething(profile);
});
```

### Issue 3: Buttons Not Responding

**Check:**
1. Network tab for failed API calls
2. Console for JavaScript errors
3. Button disabled state
4. Event handler binding

**Debug:**
```typescript
// Add comprehensive logging
onButtonClick() {
  console.log('=== Button Click Debug ===');
  console.log('1. Click event triggered');
  console.log('2. Current state:', {
    isLoading: this.isLoading(),
    hasError: this.hasError(),
    isDisabled: this.isButtonDisabled()
  });

  try {
    this.performAction();
    console.log('3. Action completed successfully');
  } catch (error) {
    console.error('4. Action failed:', error);
  }
}
```

### Issue 4: API Calls Failing Silently

**Solution:**
Check the debug interceptor logs or add explicit error handling:

```typescript
this.apiService.getData().subscribe({
  next: (data) => console.log('✅ Success:', data),
  error: (error) => {
    console.error('❌ Error:', error);
    console.log('Error details:', {
      status: error.status,
      message: error.message,
      url: error.url
    });
  }
});
```

## 📝 Example: Debugging Player Dashboard

```typescript
import { Component, signal, effect, computed, inject } from '@angular/core';
import { DebugService } from '../../core/services/debug.service';

export class PlayerDashboardComponent {
  private readonly debugService = inject(DebugService);

  // Signals
  profileSig = signal<any>(null);
  wellnessSig = signal<any>(null);
  isLoadingSig = signal(false);

  // Computed
  isReadySig = computed(() => {
    const profile = this.profileSig();
    const wellness = this.wellnessSig();
    return profile !== null && wellness !== null;
  });

  constructor() {
    // Track all signals
    this.debugService.trackSignal(this.profileSig, 'profileSig', 'PlayerDashboard');
    this.debugService.trackSignal(this.wellnessSig, 'wellnessSig', 'PlayerDashboard');
    this.debugService.trackSignal(this.isReadySig, 'isReadySig', 'PlayerDashboard');

    // Log when dashboard is ready
    effect(() => {
      if (this.isReadySig()) {
        console.log('✅ Dashboard ready to display');
      }
    });

    // Log profile changes
    effect(() => {
      const profile = this.profileSig();
      console.log('📊 Profile updated:', profile);
    });
  }

  loadData() {
    this.debugService.logLifecycle('PlayerDashboard', 'loadData started');

    this.isLoadingSig.set(true);

    // Measure API call performance
    this.debugService.measurePerformanceAsync(
      'Load dashboard data',
      async () => {
        const profile = await this.loadProfile();
        const wellness = await this.loadWellness();
        return { profile, wellness };
      }
    ).then(({ profile, wellness }) => {
      this.profileSig.set(profile);
      this.wellnessSig.set(wellness);
      this.isLoadingSig.set(false);

      this.debugService.logLifecycle('PlayerDashboard', 'loadData completed');
    }).catch(error => {
      console.error('❌ Failed to load dashboard:', error);
      this.isLoadingSig.set(false);
    });
  }
}
```

## 🎓 Best Practices

1. **Use Debug Service in Development Only**
   - The debug service automatically disables in production
   - Configure via `window.angularDebug.setConfig()`

2. **Log Signal Changes Strategically**
   - Don't log every signal change
   - Focus on signals that affect critical UI state

3. **Track Performance for Slow Operations**
   - API calls
   - Data transformations
   - Complex computed signals

4. **Use Angular DevTools for Component Inspection**
   - Faster than console logging
   - Real-time signal updates
   - Component hierarchy visualization

5. **Check Network Tab for API Issues**
   - Failed requests (red)
   - Slow requests (timing)
   - Request/response payloads

## 🔗 Additional Resources

- [Angular DevTools Documentation](https://angular.dev/tools/devtools)
- [Angular Signals Guide](https://angular.dev/guide/signals)
- [Chrome DevTools Network Tab](https://developer.chrome.com/docs/devtools/network/)
- [PrimeNG Documentation](https://primeng.org/)

## 💡 Quick Commands

```javascript
// Enable all debug logging
window.angularDebug.setConfig({
  enableSignalLogging: true,
  enableEffectLogging: true,
  enableApiLogging: true,
  enablePerformanceLogging: true,
  logStackTraces: true
})

// View recent signal changes
window.angularDebug.getSignalLogs().slice(-10)

// View recent API calls
window.angularDebug.getApiLogs().slice(-5)

// Find slow API calls
window.angularDebug.getApiLogs().filter(log => log.duration > 1000)

// Find failed API calls
window.angularDebug.getApiLogs().filter(log => log.status >= 400)

// Clear everything
window.angularDebug.clearLogs()
```

---

**Need Help?** Check the console for detailed logs and error messages. The debug interceptor will show you exactly what's happening with your API calls and signal updates.
