# 🔧 Angular Development - Documentation Index

## 🎯 Quick Navigation

### For Developers

1. Read **[DEBUGGING_GUIDE.md](./DEBUGGING_GUIDE.md)** - Comprehensive Angular debugging guide
2. Check **[debugging-signals-examples.ts](./src/app/examples/debugging-signals-examples.ts)** - Code examples

### For Testing

1. Complete **[TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)** - Verification tests

### For Architecture Review

1. Review **[ARCHITECTURE.md](./ARCHITECTURE.md)** - DevTools system architecture

### For iOS Debugging

1. Read **[IOS_DEBUGGING_GUIDE.md](./IOS_DEBUGGING_GUIDE.md)** - Safari Web Inspector setup

---

## 📚 Documentation Files

### 1. DEBUGGING_GUIDE.md

**Purpose:** Comprehensive Angular + PrimeNG debugging guide  
**What's Inside:**

- 📦 What's installed
- 🔧 Using the debug service
- 📊 Debugging signals (3 methods)
- ⚡ Debugging effects
- 🌐 Debugging API calls and unresponsive buttons
- 🔍 Debugging PrimeNG components
- 📈 Performance debugging
- 🚨 Common issues and solutions
- 📝 Complete example: Player Dashboard

---

### 2. TESTING_CHECKLIST.md

**Purpose:** Verification testing checklist  
**What's Inside:**

- ✅ 15 comprehensive tests
- 📊 Expected results for each test
- 🐛 Troubleshooting failed tests
- 📝 Test summary table

---

### 3. ARCHITECTURE.md

**Purpose:** DevTools system architecture and design  
**What's Inside:**

- 🏗️ System overview diagram
- 🔄 Data flow diagrams
- 📁 File structure
- 🎯 Debug service API
- 🌐 Browser console API

---

### 4. IOS_DEBUGGING_GUIDE.md

**Purpose:** iOS Safari debugging guide  
**What's Inside:**

- 🔧 Safari Web Inspector setup
- 📱 iOS Simulator usage
- 🎨 Platform detection service
- 🐛 Common iOS issues and fixes
- 📊 Console commands

---

### 5. debugging-signals-examples.ts

**Purpose:** Practical code examples  
**Location:** `src/app/examples/debugging-signals-examples.ts`  
**What's Inside:**

- Example 1: Track single signal
- Example 2: Track multiple signals
- Example 3: Debug effects
- Example 4: Debug buttons and API calls
- Example 5: Performance monitoring
- Example 6: Debug PrimeNG components
- Example 7: Complete dashboard example

---

## 🔧 Implementation Files

### Core Services

#### debug.service.ts

**Location:** `src/app/core/services/debug.service.ts`  
**Purpose:** Main debug service with signal tracking, effect monitoring, API logging

**Key Features:**

- `trackSignal()` - Track signal updates
- `logEffect()` - Log effect executions
- `logApiCall()` - Log API calls
- `measurePerformance()` - Measure sync operations
- `measurePerformanceAsync()` - Measure async operations
- `window.angularDebug` - Browser console integration

---

#### debug.interceptor.ts

**Location:** `src/app/core/interceptors/debug.interceptor.ts`  
**Purpose:** HTTP interceptor for automatic API logging

**Key Features:**

- Automatic request/response logging
- Performance timing
- Error detection with troubleshooting tips
- Development-only (tree-shaken in production)

---

## 📝 Quick Commands Summary

```javascript
// View logs
window.angularDebug.getSignalLogs();
window.angularDebug.getEffectLogs();
window.angularDebug.getApiLogs();

// Filter logs
window.angularDebug.getSignalLogs().slice(-10);
window.angularDebug.getApiLogs().filter((log) => log.status >= 400);
window.angularDebug.getApiLogs().filter((log) => log.duration > 1000);

// Clear logs
window.angularDebug.clearLogs();

// Configure
window.angularDebug.setConfig({ enableSignalLogging: true });
window.angularDebug.getConfig();
```

---

## 🔗 External Resources

### Angular Documentation

- [Angular Signals Guide](https://angular.dev/guide/signals)
- [Angular DevTools](https://angular.dev/tools/devtools)
- [Angular HTTP Client](https://angular.dev/guide/http)

### PrimeNG

- [PrimeNG Documentation](https://primeng.org/)

---

**Documentation last updated:** January 2026  
**Angular version:** 21  
**PrimeNG version:** 21
