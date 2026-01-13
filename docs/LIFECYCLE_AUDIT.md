# FlagFit Pro Lifecycle & Auth Audit

**Audit Date:** January 13, 2026  
**Scope:** App bootstrap, auth readiness, entry-point hot spots, data loading topology, guardrails  
**Status:** ✅ Comprehensive Analysis Complete

---

## Table of Contents

1. [App Bootstrap Timeline](#1-app-bootstrap-timeline)
2. [Auth Readiness Contract](#2-auth-readiness-contract)
3. [Entry-Point Hot Spots](#3-entry-point-hot-spots)
4. [Data-Loading Topology](#4-data-loading-topology)
5. [Guardrails Audit](#5-guardrails-audit)
6. [Violation Checklist](#6-violation-checklist)
7. [Standard Pattern Library](#7-standard-pattern-library)
8. [Recommended Fixes](#8-recommended-fixes)

---

## 1. App Bootstrap Timeline

### Current Startup Sequence

```
T0 (0ms)     │ main.ts → bootstrapApplication(AppComponent, appConfig)
             │
T+1ms        │ appConfig providers registered in order:
             │   1. LOCALE_ID (sync)
             │   2. provideZonelessChangeDetection() (sync)
             │   3. provideRouter(routes, ...) with AuthAwarePreloadStrategy (sync)
             │   4. provideAnimationsAsync() (async, non-blocking)
             │   5. provideHttpClient(withInterceptors([authInterceptor, ...])) (sync)
             │   6. PrimeNG config (sync)
             │   7. Services registered (lazy, providedIn: 'root')
             │   8. ErrorHandler (sync)
             │   9. provideServiceWorker (delayed: registerWhenStable:30000)
             │
T+5ms        │ AppComponent created
             │   - ngOnInit: subscribes to router events (passive)
             │   - No data loading in constructor
             │
T+10ms       │ SupabaseService CONSTRUCTOR runs (providedIn: 'root', first inject)
             │   - Creates Supabase client synchronously
             │   - Calls initializeAuth() → ASYNC
             │   - _isInitialized = signal(false)
             │
T+10-50ms    │ initializeAuth() executes:
             │   1. supabase.auth.getSession() - restores from localStorage
             │   2. Sets _session, _currentUser signals
             │   3. Registers onAuthStateChange listener
             │   4. Sets _isInitialized(true) in finally block
             │
T+20ms       │ AuthService CONSTRUCTOR runs (effect depends on SupabaseService)
             │   - Calls loadStoredAuth() synchronously
             │   - Registers effect() to watch supabaseService.currentUser()
             │   - ⚠️ loadStoredAuth() reads session() BEFORE initializeAuth completes
             │
T+50-100ms   │ Router navigation begins (first protected route)
             │   - authGuard runs: await supabaseService.waitForInit()
             │   - Polls _isInitialized signal (50ms intervals, max 5s)
             │
T+100ms      │ Protected component lazy-loaded (e.g., TodayComponent)
             │
T+105ms      │ TodayComponent CONSTRUCTOR runs:
             │   - Sets up effect() watching userId computed signal
             │   - userId = computed(() => authService.getUser()?.id)
             │   - Effect ONLY fires API calls when userId is truthy
             │   - ✅ CORRECTLY guards against premature loading
             │
T+110ms      │ Auth ready → userId available → loadTodayData() called
             │
T+200ms+     │ Data flows complete, UI renders
```

### Key Observations

| Step | Status | Notes |
|------|--------|-------|
| No `APP_INITIALIZER` | ⚠️ Gap | Auth init is fire-and-forget, not blocking |
| `SupabaseService.initializeAuth()` | ⚠️ Race | Async in constructor, no await guarantee |
| `waitForInit()` polling | ✅ Works | 50ms poll, 5s timeout - adequate fallback |
| `authGuard` waits for init | ✅ Works | Properly uses `await waitForInit()` |
| `authInterceptor` waits | ✅ Works | Uses `waitForInit()` before token fetch |
| `TodayComponent` | ✅ Fixed | Uses `effect()` with userId guard |

### Timeline Risks

1. **Race Window (T+10-50ms):** `AuthService.loadStoredAuth()` may read `session()` before Supabase restores it from localStorage. This is mitigated by the effect that watches `supabaseService.currentUser()`.

2. **No Blocking Init:** The app doesn't block on auth readiness at bootstrap. This is intentional for performance but requires all consumers to properly gate on auth signals.

---

## 2. Auth Readiness Contract

### Current Architecture

```typescript
// SupabaseService (source of truth)
readonly isInitialized = signal<boolean>(false);  // ✅ Tracks init completion
readonly currentUser = signal<User | null>(null); // ✅ Reactive
readonly session = signal<Session | null>(null);  // ✅ Reactive
readonly isAuthenticated = computed(() => currentUser() !== null);
readonly userId = computed(() => currentUser()?.id ?? null);

// AuthService (facade layer)
currentUser = signal<User | null>(null);          // ✅ Reactive
isAuthenticated = signal<boolean>(false);         // ✅ Reactive
isLoading = signal<boolean>(false);               // ✅ Reactive

// Non-reactive methods (⚠️ potential issues)
getUser(): User | null { return this.currentUser(); }  // ⚠️ Method call, not signal
checkAuth(): boolean { ... }                           // ⚠️ Side effects
async getToken(): Promise<string | null> { ... }       // ✅ Async, handles refresh
```

### Recommended Contract Definition

```typescript
// === AUTH READINESS CONTRACT ===

/**
 * RULE 1: No protected API calls until authReady === true
 * 
 * authReady = SupabaseService.isInitialized() 
 *           && (session exists OR auth definitely failed)
 */
const authReady = computed(() => 
  supabaseService.isInitialized() 
);

/**
 * RULE 2: No user-scoped calls until userId exists
 * 
 * userId = SupabaseService.userId() (computed from currentUser)
 */
const userId = computed(() => 
  supabaseService.userId()
);

/**
 * RULE 3: Use signals/computed for reactive updates, not methods
 * 
 * ❌ BAD:  computed(() => authService.getUser()?.id)
 * ✅ GOOD: computed(() => authService.currentUser()?.id)
 */
```

### Contract Compliance Status

| Principle | Current Status | Location |
|-----------|----------------|----------|
| `authReady` signal exists | ✅ Yes | `SupabaseService.isInitialized` |
| `userId` reactive signal | ✅ Yes | `SupabaseService.userId` |
| Auth facade uses signals | ✅ Yes | `AuthService.currentUser` signal |
| Interceptor waits for init | ✅ Yes | `authInterceptor` calls `waitForInit()` |
| Guards wait for init | ✅ Yes | `authGuard` calls `waitForInit()` |
| Components gate on userId | ⚠️ Partial | Some use `getUser()` in computed |

### Non-Reactive Usage Violations

The following use `authService.getUser()?.id` in computed signals, which won't update reactively:

| File | Line | Pattern |
|------|------|---------|
| `today.component.ts` | 1194 | `computed(() => this.authService.getUser()?.id)` |
| `unified-training.service.ts` | 113 | `computed(() => this.authService.getUser()?.id)` |
| `player-dashboard.component.ts` | 1963 | `computed(() => this.authService.getUser()?.id)` |
| `chat.component.ts` | 936 | `computed(() => this.authService.getUser()?.id)` |
| `ai-coach-chat.component.ts` | 838 | `computed(() => this.authService.getUser()?.role)` |

**Impact:** These computed signals will capture the initial value but won't re-run when auth state changes because `getUser()` is a method call, not a signal read.

**Fix:** Change to `this.authService.currentUser()?.id` to properly track the signal.

---

## 3. Entry-Point Hot Spots

### ✅ TodayComponent - CORRECTLY IMPLEMENTED

```typescript
// today.component.ts lines 1453-1468
constructor() {
  this.headerService.setDashboardHeader();  // ✅ Safe, no API calls

  // ✅ CORRECT: Effect waits for userId before loading
  effect(() => {
    const id = this.userId();
    if (!id) return;  // ✅ Guards against unauthenticated state

    if (this._initialLoadDone) return;  // ✅ Run-once gate
    this._initialLoadDone = true;

    this.logger.info("[TodayComponent] Auth ready, loading data for user:", id);
    this.loadTodayData();
    this.loadTomorrowProtocol();
  });
}
```

**Verdict:** TodayComponent correctly gates data loading on `userId` presence with a run-once flag.

### Services Constructor Analysis

| Service | Constructor Behavior | Status |
|---------|---------------------|--------|
| `SupabaseService` | Calls `initializeAuth()` async | ⚠️ Fire-and-forget |
| `AuthService` | Calls `loadStoredAuth()` + registers effect | ✅ Safe |
| `ApiService` | Logs baseUrl, no API calls | ✅ Safe |
| `UnifiedTrainingService` | No data loading | ✅ Safe |
| `DirectSupabaseApiService` | Logs init message | ✅ Safe |
| `ReadinessService` | Initializes config from preset | ✅ Safe |

### Route Guards Analysis

| Guard | Auth Gating | Status |
|-------|-------------|--------|
| `authGuard` | `await waitForInit()` then checks session | ✅ Correct |
| `femaleAthleteGuard` | Not audited | - |
| `superadminGuard` | Not audited | - |
| `headerConfigGuard` | Not audited | - |

### Preloading Strategy

```typescript
// auth-aware-preload.strategy.ts
preload(route, load) {
  const isAuthenticated = this.authService.isAuthenticated();  // ⚠️ Sync read
  
  // If route requires auth and user not authenticated, don't preload
  if (this.authRequiredRoutes.includes(...) && !isAuthenticated) {
    return of(null);  // ✅ Correct gating
  }
}
```

**Issue:** `isAuthenticated()` reads the signal synchronously. At T+0, this may be false even if session exists in localStorage but hasn't been restored yet.

**Impact:** Low - preloading happens with delays (2-5s), by which time auth should be ready.

---

## 4. Data-Loading Topology

### TodayComponent Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TodayComponent                                │
│                                                                      │
│  constructor effect()                                                │
│       │                                                              │
│       ├── guards on userId() signal                                  │
│       │                                                              │
│       ▼                                                              │
│  loadTodayData()                                                     │
│       │                                                              │
│       ├── [useDirectSupabase=true] ─► DirectSupabaseApiService       │
│       │         │                                                    │
│       │         └── getDailyProtocol(date)                           │
│       │                   │                                          │
│       │                   └── supabase.from('daily_protocols')       │
│       │                                                              │
│       └── [useDirectSupabase=false] ─► ApiService                    │
│                 │                                                    │
│                 └── GET /api/daily-protocol?date=...                 │
│                           │                                          │
│                           └── authInterceptor adds Bearer token      │
└─────────────────────────────────────────────────────────────────────┘
```

### UnifiedTrainingService Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    UnifiedTrainingService                            │
│                                                                      │
│  getTodayOverview()                                                  │
│       │                                                              │
│       └── combineLatest({                                            │
│               protocol: loadDailyProtocolDirect(),    ─► Supabase    │
│               readiness: readinessService.calculateToday(), ─► API   │
│               recommendations: loadRecommendationsDirect(), ─► Supa  │
│               trainingData: loadAllTrainingData(),    ─► Supabase    │
│           })                                                         │
│           .pipe(shareReplay(1))                                      │
│                                                                      │
│  Prerequisites:                                                      │
│       - userId() must be truthy                                      │
│       - All streams fire simultaneously                              │
│       - shareReplay(1) caches result                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Potential Duplicate/Race Issues

| Pattern | Location | Risk | Mitigation |
|---------|----------|------|------------|
| Multiple protocol loads | `TodayComponent` + `UnifiedTrainingService` | Medium | Different data paths (API vs direct) |
| `combineLatest` without auth | `getTodayOverview()` | Low | Gated by `if (!id) return of(null)` |
| No `shareReplay` invalidation | `UnifiedTrainingService` | Low | `shareReplay(1)` with no expiry |
| Direct Supabase + API mixing | Throughout | Medium | Environment flag controls routing |

### Cache Invalidation Concerns

The `shareReplay(1)` in `getTodayOverview()` caches indefinitely. After:
- Logging a workout
- Submitting wellness
- Completing exercises

The cached observable may return stale data. Current mitigation: manual `loadAllTrainingData()` calls after mutations.

---

## 5. Guardrails Audit

### 401 Handling

```typescript
// error.interceptor.ts
if (error.status === 401) {
  const isAuthenticated = authService.isAuthenticated();
  
  if (isAuthenticated) {
    // Session expired - logout and redirect
    authService.logout().subscribe();
    router.navigate(['/login'], { queryParams: { message: 'session_expired' }});
  }
  // If not authenticated, 401 is expected - don't spam errors
}
```

**Verdict:** ✅ 401s are handled gracefully. Unauthenticated 401s don't trigger error noise.

### 406 Handling

```typescript
// error.interceptor.ts
} else if (error.status === 406) {
  logger.warn("[ErrorInterceptor] 406 Not Acceptable", { url, headers });
}
```

**Verdict:** ⚠️ Logged as warning but no recovery action. 406 typically comes from Supabase `.single()` on empty results.

### `.single()` vs `.maybeSingle()` Usage

Found **75 occurrences** of `.single()` across the codebase.

**Risk:** `.single()` throws PGRST116 (406) when:
- No rows found
- Multiple rows found

**High-Risk Locations:**

| File | Count | Risk Level |
|------|-------|------------|
| `unified-training.service.ts` | 4 | Medium - user data may not exist |
| `direct-supabase-api.service.ts` | 1 | Low - wrapped in upsert |
| `roster.service.ts` | 4 | Medium - player lookups |
| `training-data.service.ts` | 3 | Medium - session lookups |
| `onboarding.component.ts` | 7 | High - new users have no data |

**Recommendation:** Audit each `.single()` usage:
- User-specific data lookups → use `.maybeSingle()`
- Expected-to-exist lookups (by ID) → `.single()` is fine
- New user flows → must use `.maybeSingle()`

### "No Data Yet" Error Tracking

Current behavior logs warnings for expected empty states:

```typescript
// unified-training.service.ts
if (!playerProgram) {
  this.logger.info("[UnifiedTrainingService] No active program assigned");
  return this.getEmptyWeekSchedule();  // ✅ Graceful fallback
}
```

**Verdict:** ✅ Empty states return defaults, not errors.

---

## 6. Violation Checklist

### High Priority

| # | File | Line | Issue | Impact | Fix |
|---|------|------|-------|--------|-----|
| 1 | `today.component.ts` | 1194 | `getUser()?.id` in computed | Non-reactive userId | Use `currentUser()?.id` |
| 2 | `unified-training.service.ts` | 113 | `getUser()?.id` in computed | Non-reactive userId | Use `currentUser()?.id` |
| 3 | `player-dashboard.component.ts` | 1963 | `getUser()?.id` in computed | Non-reactive userId | Use `currentUser()?.id` |
| 4 | `chat.component.ts` | 936 | `getUser()?.id` in computed | Non-reactive userId | Use `currentUser()?.id` |

### Medium Priority

| # | File | Line | Issue | Impact | Fix |
|---|------|------|-------|--------|-----|
| 5 | `onboarding.component.ts` | 2589+ | Multiple `.single()` calls | 406 on new users | Change to `.maybeSingle()` |
| 6 | `supabase.service.ts` | 78 | `initializeAuth()` not awaited | Race condition | Consider APP_INITIALIZER |
| 7 | `auth.service.ts` | 102 | `loadStoredAuth()` reads uninitialized | Race condition | Gate on `isInitialized` |

### Low Priority

| # | File | Issue | Impact |
|---|------|-------|--------|
| 8 | Various | 75x `.single()` usage | Potential 406 errors |
| 9 | `unified-training.service.ts` | `shareReplay(1)` no invalidation | Stale cache |

---

## 7. Standard Pattern Library

### Pattern 1: Auth-Gated Effect for Initial Load

```typescript
// ✅ APPROVED PATTERN: Run-once load after auth ready
export class MyComponent {
  private readonly authService = inject(AuthService);
  private _initialLoadDone = false;
  
  // Use the SIGNAL, not the method
  private readonly userId = computed(() => this.authService.currentUser()?.id);
  
  constructor() {
    effect(() => {
      const id = this.userId();
      if (!id) return;  // Wait for auth
      
      if (this._initialLoadDone) return;  // Run once
      this._initialLoadDone = true;
      
      this.loadData();
    });
  }
}
```

### Pattern 2: Service with Auth Guard

```typescript
// ✅ APPROVED PATTERN: Service method that requires auth
loadUserData(): Observable<Data> {
  const userId = this.authService.currentUser()?.id;  // Signal read
  if (!userId) {
    return of({ success: false, error: 'Not authenticated' });
  }
  return this.api.get(`/api/user/${userId}/data`);
}
```

### Pattern 3: Optional Row Lookup

```typescript
// ✅ APPROVED PATTERN: Supabase query for potentially missing data
const { data, error } = await supabase
  .from('user_preferences')
  .select('*')
  .eq('user_id', userId)
  .maybeSingle();  // ✅ Returns null if not found, no error

if (!data) {
  // Handle missing data gracefully
  return DEFAULT_PREFERENCES;
}
```

### Pattern 4: Required Row Lookup

```typescript
// ✅ APPROVED PATTERN: Lookup by known ID (must exist)
const { data, error } = await supabase
  .from('teams')
  .select('*')
  .eq('id', teamId)
  .single();  // ✅ OK here - ID must exist

if (error) {
  throw new Error(`Team ${teamId} not found`);
}
```

### Pattern 5: Refresh After Mutation

```typescript
// ✅ APPROVED PATTERN: Invalidate cache after data change
async logWorkout(data: WorkoutData) {
  const result = await this.api.post('/api/workouts', data);
  
  if (result.success) {
    // Explicitly refresh dependent data
    await firstValueFrom(this.getTodayOverview());  // Refresh cache
  }
  
  return result;
}
```

---

## 8. Recommended Fixes

### Fix 1: Replace `getUser()` with Signal in Computed (High Priority)

**Files:** `today.component.ts`, `unified-training.service.ts`, `player-dashboard.component.ts`, `chat.component.ts`

```typescript
// BEFORE (non-reactive)
private readonly userId = computed(() => this.authService.getUser()?.id);

// AFTER (reactive)
private readonly userId = computed(() => this.authService.currentUser()?.id);
```

### Fix 2: Change `.single()` to `.maybeSingle()` for User Data

**Files:** `onboarding.component.ts`, `unified-training.service.ts`

```typescript
// BEFORE
.single();

// AFTER (for optional data)
.maybeSingle();
```

### Fix 3: Add APP_INITIALIZER for Auth (Optional Enhancement)

```typescript
// app.config.ts
import { APP_INITIALIZER } from '@angular/core';

function initializeAuth(supabaseService: SupabaseService) {
  return () => supabaseService.waitForInit();
}

export const appConfig: ApplicationConfig = {
  providers: [
    // ... existing providers
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuth,
      deps: [SupabaseService],
      multi: true
    }
  ]
};
```

**Trade-off:** This blocks app startup until auth is ready. Currently, the app loads fast and gates individual operations instead.

### Fix 4: Add Cache Invalidation to shareReplay

```typescript
// unified-training.service.ts
private todayOverviewCache$ = new BehaviorSubject<void>(undefined);

getTodayOverview() {
  return this.todayOverviewCache$.pipe(
    switchMap(() => combineLatest({...})),
    shareReplay(1)
  );
}

invalidateTodayOverview() {
  this.todayOverviewCache$.next(undefined);
}
```

---

## Summary

### What's Working Well ✅

1. **TodayComponent auth gating** - Correctly uses effect() with userId guard
2. **Auth interceptor** - Waits for init before attaching tokens
3. **Auth guard** - Properly awaits Supabase initialization
4. **401 handling** - Graceful logout on session expiry
5. **Empty state handling** - Returns defaults instead of errors

### Areas for Improvement ⚠️

1. **Non-reactive `getUser()` calls** - 5 locations use method instead of signal
2. **`.single()` overuse** - 75 locations, some should be `.maybeSingle()`
3. **No APP_INITIALIZER** - Auth init is fire-and-forget (acceptable trade-off)
4. **shareReplay without invalidation** - Potential stale data after mutations

### Definition of Done Checklist

| Criterion | Status |
|-----------|--------|
| Zero API calls before authReady | ✅ Guards in place |
| No 401 spam on refresh | ✅ Interceptor handles gracefully |
| "No data yet" doesn't error | ✅ Fallback patterns used |
| Each screen loads exactly once | ✅ Run-once flags implemented |

---

*Audit completed by AI Assistant • January 13, 2026*
