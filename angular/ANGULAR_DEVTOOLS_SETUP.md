# Angular DevTools Setup Guide

## 🎯 Overview

Angular DevTools for Angular 21 provides powerful debugging capabilities that make development genuinely fun compared to older versions. This guide covers setup and usage of all the enhanced debugging features.

## ✨ Key Features Available

### 🔍 Visual Signal Graph Explorer

Navigate through your application's component tree to inspect and modify component states, providing a clear visualization of the application's structure and signal dependencies.

### ⚡ Real-Time Change Detection Tracing

Monitor change detection cycles as they occur in real-time, helping identify performance bottlenecks and understand the triggers behind each cycle.

### 🧠 Hydration Troubleshooting

Debug server-side rendering (SSR) and hydration issues with enhanced visibility into the hydration process.

### 🔄 Component-Level Load-Time Analysis

Utilize the Profiler tab to measure the time taken by each component during rendering, enabling targeted optimization of slow-loading components.

### 🧰 Router Event Inspector

Inspect router events and navigation flows with the Router Tree feature, providing insights into routing behavior.

### 🎯 Better Profiling for Slow Components

The Profiler provides detailed insights into component performance, highlighting areas that may require optimization to improve application responsiveness.

---

## 📦 Installation

### Step 1: Install Browser Extension

Angular DevTools is a browser extension. Install it from:

- **Chrome/Edge**: [Chrome Web Store - Angular DevTools](https://chromewebstore.google.com/detail/angular-devtools/ienfalfjdbdpebioblfackkekamfmbnh)
- **Firefox**: [Firefox Add-ons - Angular DevTools](https://addons.mozilla.org/en-US/firefox/addon/angular-devtools/)

### Step 2: Verify Installation

1. Open your Angular application in the browser
2. Open Developer Tools (F12 or Ctrl+Shift+I / Cmd+Option+I)
3. Look for the **"Angular"** tab in the DevTools panel
4. If you see the Angular tab, installation is successful!

---

## ⚙️ Configuration

### Application Configuration

The application is already configured for optimal DevTools integration:

```typescript
// src/app/app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    // Zoneless change detection enables better DevTools integration
    provideExperimentalZonelessChangeDetection(),

    // Router debug tracing (development only)
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions(),
      withPreloading(AuthAwarePreloadStrategy),
      ...(isDevMode() ? [withDebugTracing()] : []), // Router event inspector
    ),
    // ... other providers
  ],
};
```

### Environment Configuration

DevTools features are automatically enabled in development mode:

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  devtools: {
    enabled: true,
    profiler: true,
    changeDetection: true,
    hydration: true,
  },
};
```

### Build Configuration

Source maps are enabled in development mode for better debugging:

```json
// angular.json
"development": {
  "optimization": false,
  "extractLicenses": false,
  "sourceMap": true  // Required for DevTools
}
```

---

## 🚀 Usage Guide

### Accessing Angular DevTools

1. **Start the development server**:

   ```bash
   cd angular
   npm start
   ```

2. **Open your application** in the browser (typically `http://localhost:4200`)

3. **Open Developer Tools**:
   - Press `F12` or `Ctrl+Shift+I` (Windows/Linux)
   - Press `Cmd+Option+I` (Mac)

4. **Navigate to the Angular tab** in DevTools

### Using the Component Tree

1. **Select a component** in the component tree
2. **View component properties**:
   - Inputs and outputs
   - Dependencies
   - State (signals, observables)
3. **Modify component state** directly in DevTools
4. **Navigate the component hierarchy** to understand relationships

### Using the Profiler

1. **Open the Profiler tab** in Angular DevTools
2. **Click "Start Recording"** before interacting with your app
3. **Interact with your application** (click buttons, navigate, etc.)
4. **Click "Stop Recording"** to analyze
5. **Review the results**:
   - Component render times
   - Change detection cycles
   - Performance bottlenecks

**Tips for Profiling**:

- Focus on slow components (highlighted in red)
- Look for unnecessary re-renders
- Identify components that trigger excessive change detection

### Using Change Detection Tracing

1. **Enable change detection tracing** in DevTools settings
2. **Interact with your application**
3. **Watch the console** for change detection logs
4. **Analyze the trace** to understand:
   - What triggered change detection
   - Which components were checked
   - Performance impact

### Using Router Event Inspector

1. **Enable Router Tree** in DevTools settings (experimental feature)
2. **Navigate through your application**
3. **View router events** in real-time:
   - Navigation start
   - Route configuration
   - Guards execution
   - Resolvers
   - Navigation end

### Using Signal Graph Explorer

Angular 21 includes built-in DevTools formatters for signals:

1. **Open the browser console**
2. **Log a signal**:
   ```typescript
   console.log(mySignal);
   ```
3. **View the formatted signal** with:
   - Current value
   - Dependencies
   - Graph visualization

### Hydration Troubleshooting

For SSR applications:

1. **Enable hydration debugging** in DevTools
2. **Check the console** for hydration warnings
3. **Use the Component Tree** to identify mismatches
4. **Review hydration errors** in the DevTools panel

---

## 🎨 Best Practices

### 1. Profile Regularly

- Profile before and after optimizations
- Use profiling to identify performance regressions
- Focus on user-critical paths

### 2. Monitor Change Detection

- Keep change detection cycles minimal
- Use OnPush change detection strategy where possible
- Leverage signals for reactive updates

### 3. Component Analysis

- Regularly review component render times
- Identify components that render unnecessarily
- Optimize slow components first

### 4. Router Debugging

- Use router event inspector to debug navigation issues
- Monitor route guards and resolvers
- Check for unnecessary route reloads

### 5. Signal Debugging

- Use signal formatters in console
- Visualize signal dependencies
- Understand signal propagation

---

## 🔧 Troubleshooting

### DevTools Not Showing Angular Tab

**Possible causes**:

1. Extension not installed
2. Application not running in development mode
3. Angular version mismatch

**Solutions**:

- Verify extension is installed and enabled
- Ensure `ng serve` is running (not production build)
- Check Angular version: `ng version` (should be 21.x)

### Profiler Not Recording

**Possible causes**:

1. Application in production mode
2. Source maps disabled

**Solutions**:

- Use `ng serve` (development mode)
- Verify `sourceMap: true` in `angular.json`

### Change Detection Tracing Not Working

**Possible causes**:

1. Zoneless change detection not enabled
2. DevTools settings not configured

**Solutions**:

- Verify `provideExperimentalZonelessChangeDetection()` is in app config
- Enable change detection tracing in DevTools settings

### Router Events Not Showing

**Possible causes**:

1. Router debug tracing not enabled
2. Router Tree feature not enabled in DevTools

**Solutions**:

- Verify `withDebugTracing()` is added in development mode
- Enable Router Tree in DevTools settings (experimental features)

---

## 📚 Additional Resources

- [Angular DevTools Official Documentation](https://angular.dev/tools/devtools)
- [Angular 21 Release Notes](https://github.com/angular/angular/blob/main/CHANGELOG.md)
- [Signals Documentation](https://angular.dev/guide/signals)
- [Change Detection Guide](https://angular.dev/guide/change-detection)

---

## 🎯 Quick Reference

### Enable Router Debug Tracing

```typescript
provideRouter(routes, withDebugTracing());
```

### Enable Zoneless Change Detection

```typescript
provideExperimentalZonelessChangeDetection();
```

### Check Dev Mode

```typescript
import { isDevMode } from "@angular/core";
console.log(isDevMode()); // true in development
```

### Console Signal Formatting

```typescript
import { signal } from "@angular/core";
const mySignal = signal(42);
console.log(mySignal); // Formatted output in Angular 21
```

---

## ✅ Verification Checklist

- [ ] Angular DevTools extension installed
- [ ] Angular tab visible in browser DevTools
- [ ] Component tree displays correctly
- [ ] Profiler can record and analyze
- [ ] Change detection tracing works
- [ ] Router events visible (if Router Tree enabled)
- [ ] Signal formatters work in console
- [ ] Source maps enabled in development

---

**Happy Debugging! 🎉**

Debugging Angular 21 apps is genuinely fun compared to older versions. Enjoy the enhanced developer experience!
