# Angular DevTools Architecture

## 🏗️ System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Angular Application                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Components Layer                        │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │  │
│  │  │ Dashboard    │  │ Settings     │  │ Other        │   │  │
│  │  │ Component    │  │ Component    │  │ Components   │   │  │
│  │  │              │  │              │  │              │   │  │
│  │  │ signals()    │  │ signals()    │  │ signals()    │   │  │
│  │  │ effects()    │  │ effects()    │  │ effects()    │   │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │  │
│  └─────────┼──────────────────┼──────────────────┼───────────┘  │
│            │                  │                  │              │
│            ▼                  ▼                  ▼              │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                    Debug Service                         │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │  │
│  │  │ Signal       │  │ Effect       │  │ Performance  │ │  │
│  │  │ Tracking     │  │ Monitoring   │  │ Measurement  │ │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘ │  │
│  │                                                          │  │
│  │  trackSignal()   logEffect()   measurePerformance()    │  │
│  │  logLifecycle()  logPerformance()                      │  │
│  └──────────────────────────┬───────────────────────────────┘  │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │               Browser Console Integration                │  │
│  │                  window.angularDebug                     │  │
│  │                                                          │  │
│  │  getSignalLogs() getEffectLogs() getApiLogs()          │  │
│  │  clearLogs() setConfig() getConfig()                   │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                 HTTP Interceptors                        │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │  │
│  │  │ Auth         │  │ Cache        │  │ Debug        │ │  │
│  │  │ Interceptor  │  │ Interceptor  │  │ Interceptor  │ │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │  │
│  └─────────┼──────────────────┼──────────────────┼───────────┘  │
│            │                  │                  │              │
│            └──────────────────┴──────────────────┘              │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                   HTTP Client                            │  │
│  │         (All API calls logged automatically)             │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Developer Tools                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────┐  ┌──────────────────────────────┐    │
│  │  Browser Console     │  │  Angular DevTools Extension  │    │
│  │                      │  │                              │    │
│  │  📊 Signal logs      │  │  Component Inspector        │    │
│  │  ⚡ Effect logs      │  │  Profiler                   │    │
│  │  🌐 API logs         │  │  Dependency Injection       │    │
│  │  ⏱️  Performance     │  │  Real-time Updates          │    │
│  │                      │  │                              │    │
│  └──────────────────────┘  └──────────────────────────────┘    │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Chrome Network Tab                           │  │
│  │                                                           │  │
│  │  HTTP Requests | Status | Timing | Payload | Headers    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow

### Signal Update Flow

```
1. Component updates signal
   ↓
2. Signal.set() / Signal.update() called
   ↓
3. DebugService.trackSignal() detects change
   ↓
4. Log entry created
   ↓
5. Console output: 📊 Signal Update [Component] signalName { value }
   ↓
6. Log stored in DebugService.signalLogs[]
   ↓
7. Available via window.angularDebug.getSignalLogs()
```

### API Call Flow

```
1. Component calls HTTP service
   ↓
2. HTTP request created
   ↓
3. Auth Interceptor (adds auth token)
   ↓
4. Cache Interceptor (checks cache)
   ↓
5. Debug Interceptor (logs request, starts timer)
   ↓
6. Request sent to server
   ↓
7. Response received
   ↓
8. Debug Interceptor (logs response, calculates duration)
   ↓
9. Console output: 🌐 HTTP GET [200] (123ms)
   ↓
10. Log stored in DebugService.apiLogs[]
    ↓
11. Available via window.angularDebug.getApiLogs()
```

### Effect Execution Flow

```
1. Signal value changes
   ↓
2. Effect triggered automatically
   ↓
3. DebugService.logEffect() called (if registered)
   ↓
4. Effect callback executed
   ↓
5. Duration measured
   ↓
6. Console output: ⚡ Effect Executed [Component] effectName (12ms)
   ↓
7. Log stored in DebugService.effectLogs[]
   ↓
8. Available via window.angularDebug.getEffectLogs()
```

## 📁 File Structure

```
angular/
├── src/app/
│   ├── core/
│   │   ├── services/
│   │   │   └── debug.service.ts              ⭐ Main debug service
│   │   └── interceptors/
│   │       └── debug.interceptor.ts          ⭐ HTTP debug interceptor
│   ├── examples/
│   │   └── debugging-signals-examples.ts     📚 Code examples
│   └── app.config.ts                         🔧 Debug interceptor registered
│
├── DEBUGGING_GUIDE.md                        📖 Comprehensive debugging guide
├── TESTING_CHECKLIST.md                      ✅ Testing checklist
├── IOS_DEBUGGING_GUIDE.md                    📱 iOS Safari debugging
└── setup-devtools.sh                         🚀 Setup script
```

## 🎯 Debug Service API

### Signal Tracking

```typescript
debugService.trackSignal(
  signal: Signal<T>,
  signalName: string,
  componentName?: string
): void
```

### Effect Logging

```typescript
debugService.logEffect(
  effectName: string,
  componentName?: string,
  callback?: () => void
): void
```

### API Call Logging

```typescript
debugService.logApiCall(
  url: string,
  method: string,
  status?: number,
  duration?: number,
  error?: any
): void
```

### Performance Measurement

```typescript
debugService.measurePerformance<T>(
  label: string,
  fn: () => T,
  threshold?: number
): T

debugService.measurePerformanceAsync<T>(
  label: string,
  fn: () => Promise<T>,
  threshold?: number
): Promise<T>
```

### Lifecycle Logging

```typescript
debugService.logLifecycle(
  componentName: string,
  event: string,
  data?: any
): void
```

## 🌐 Browser Console API

### View Logs

```javascript
window.angularDebug.getSignalLogs(); // All signal updates
window.angularDebug.getEffectLogs(); // All effect executions
window.angularDebug.getApiLogs(); // All API calls
```

### Filter Logs

```javascript
// Last 10 signal updates
window.angularDebug.getSignalLogs().slice(-10);

// Failed API calls
window.angularDebug.getApiLogs().filter((log) => log.status >= 400);

// Slow API calls (> 1 second)
window.angularDebug.getApiLogs().filter((log) => log.duration > 1000);
```

### Clear Logs

```javascript
window.angularDebug.clearLogs();
```

### Configuration

```javascript
// View config
window.angularDebug.getConfig();

// Update config
window.angularDebug.setConfig({
  enableSignalLogging: true,
  enableEffectLogging: true,
  enableApiLogging: true,
  enablePerformanceLogging: true,
  logStackTraces: false,
});
```

## 🔍 HTTP Interceptor Flow

```
HTTP Request
    ↓
┌───────────────────────────────────────┐
│   Auth Interceptor                    │
│   - Add authorization token           │
│   - Add headers                       │
└───────────────┬───────────────────────┘
                ↓
┌───────────────────────────────────────┐
│   Cache Interceptor                   │
│   - Check cache                       │
│   - Return cached response if exists  │
└───────────────┬───────────────────────┘
                ↓
┌───────────────────────────────────────┐
│   Debug Interceptor (Dev Mode Only)   │
│   - Log request details               │
│   - Start timer                       │
│   - Log response details              │
│   - Calculate duration                │
│   - Detect errors                     │
│   - Provide troubleshooting tips      │
└───────────────┬───────────────────────┘
                ↓
           HTTP Client
                ↓
           Network Request
                ↓
           Server Response
```

## 📊 Console Output Examples

### Signal Update

```
📊 Signal Update [PlayerDashboard] profileSig { name: 'John', age: 30 }
```

### Effect Execution

```
⚡ Effect Executed [PlayerDashboard] syncProfileSettings (12.34ms)
```

### API Call (Success)

```
🌐 API Call GET [200]
  { url: "https://api.example.com/profile", duration: "123.45ms" }
```

### API Call (Error)

```
❌ Network Error: Request failed to reach server
Possible causes:
  - CORS issue
  - Backend server not running
  - Network connectivity problem
```

### Performance Warning

```
⚠️ Slow API call detected: https://api.example.com/data (2345.67ms)
```

### Performance Measurement

```
⏱️ Performance: Load dashboard data (123.45ms)
```

## 🚀 Quick Start Workflow

```
1. Run setup script
   $ ./setup-devtools.sh

2. Install Angular DevTools extension
   (Chrome, Firefox, or Edge)

3. Start dev server
   $ npm start

4. Open browser
   → http://localhost:4200

5. Open DevTools
   Press F12 or Cmd+Option+I

6. Access debug utilities
   Type: window.angularDebug

7. Start debugging!
   - View signal logs
   - Monitor API calls
   - Track performance
```

## 🎓 Learning Path

```
Start Here:
    ↓
DEBUGGING_GUIDE.md
    ↓
debugging-signals-examples.ts
    ↓
TESTING_CHECKLIST.md
    ↓
You're now an expert! 🎉
```

## 🔗 Integration Points

### Component → Debug Service

```typescript
class MyComponent {
  private debugService = inject(DebugService);

  mySignal = signal(0);

  constructor() {
    this.debugService.trackSignal(this.mySignal, "mySignal", "MyComponent");
  }
}
```

### HTTP Service → Debug Interceptor

```typescript
// Automatic - no code changes needed
// All HTTP requests automatically logged
```

### Component → Console Utilities

```typescript
// In component or console
window.angularDebug.getSignalLogs();
window.angularDebug.getApiLogs();
```

---

**Architecture designed for:**

- ✅ Zero production impact (tree-shaken)
- ✅ Minimal development overhead
- ✅ Easy to use
- ✅ Comprehensive debugging
- ✅ Type-safe
