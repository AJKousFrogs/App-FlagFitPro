# Architecture Pattern: Signals + RxJS State Management

## Overview

This document describes the architecture pattern for separating data services from view models, using Angular 21 signals for state management and RxJS for data fetching.

## Core Principles

1. **Separation of Concerns**
   - **Data Services**: Handle API/Netlify function calls, return Observables
   - **View Models**: Manage component state using Signals, subscribe to data services

2. **State Management**
   - Use **Signals** for reactive state (component state, UI state)
   - Use **RxJS Observables** for data fetching and streams
   - Use **Computed Signals** for derived state

3. **Performance**
   - Lazy loading for all routes
   - Route-level prefetching for heavy pages (analytics, film pages)
   - Keep core experience (dashboard, workout) fast

## Architecture Layers

### 1. Data Services (`core/services/data/`)

**Purpose**: Pure data fetching - no state management

```typescript
@Injectable({ providedIn: 'root' })
export class DashboardDataService {
  private apiService = inject(ApiService);

  // Returns Observable - no state
  getDashboard(): Observable<DashboardData> {
    return this.apiService.get<DashboardData>(API_ENDPOINTS.dashboard.overview);
  }
}
```

**Characteristics**:
- ✅ Return Observables
- ✅ No signals or state
- ✅ Pure functions
- ✅ Easy to test (mock Observables)
- ✅ Reusable across components

### 2. View Models (`core/view-models/`)

**Purpose**: Manage component state using Signals

```typescript
@Injectable()
export class DashboardViewModel extends BaseViewModel {
  private dashboardDataService = inject(DashboardDataService);

  // State (Signals)
  readonly stats = signal<DashboardStats | null>(null);
  readonly loading = signal(false);

  // Derived state (Computed)
  readonly totalSessions = computed(() => this.stats()?.totalSessions ?? 0);

  // Data fetching (RxJS)
  loadDashboard() {
    this.subscribe(
      this.dashboardDataService.getDashboard(),
      {
        next: (data) => this.stats.set(data.stats),
        error: (err) => this.handleError(err)
      }
    );
  }
}
```

**Characteristics**:
- ✅ Use Signals for state
- ✅ Subscribe to Data Services
- ✅ Handle loading/error states
- ✅ Provide computed/derived state
- ✅ Auto-cleanup on destroy

### 3. Components

**Purpose**: Use View Models, display state

```typescript
@Component({...})
export class DashboardComponent {
  private viewModel = inject(DashboardViewModel);

  // Expose view model signals to template
  stats = this.viewModel.stats;
  loading = this.viewModel.loading;
  totalSessions = this.viewModel.totalSessions;

  ngOnInit() {
    this.viewModel.initialize();
  }
}
```

**Template**:
```html
@if (loading()) {
  <p>Loading...</p>
} @else {
  <div>Total Sessions: {{ totalSessions() }}</div>
}
```

## Base Classes

### BaseViewModel

Base class for all view models with common functionality:

- `subscribe()` - Subscribe to Observables with auto-cleanup
- `loading` - Loading state signal
- `error` - Error state signal
- `handleError()` - Consistent error handling
- `reset()` - Reset all state

### ReactiveViewModel

Extends BaseViewModel for real-time data:

- `createStream()` - Create reactive data streams
- `createSubject()` - Create BehaviorSubjects
- Perfect for live analytics and real-time updates

## Usage Examples

### Simple View Model (Dashboard)

```typescript
@Injectable()
export class DashboardViewModel extends BaseViewModel {
  private dashboardDataService = inject(DashboardDataService);

  readonly stats = signal<DashboardStats | null>(null);
  readonly recentActivity = signal<any[]>([]);

  override initialize() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.subscribe(
      this.dashboardDataService.getDashboard(),
      {
        next: (data) => {
          this.stats.set(data.stats);
          this.recentActivity.set(data.recentActivity);
        }
      }
    );
  }
}
```

### Reactive View Model (Analytics)

```typescript
@Injectable()
export class AnalyticsViewModel extends ReactiveViewModel {
  private analyticsDataService = inject(AnalyticsDataService);

  readonly performanceTrends = signal<PerformanceTrendsData | null>(null);

  // Real-time stream
  readonly performanceTrends$ = this.createStream(
    interval(5000).pipe(
      switchMap(() => this.analyticsDataService.getPerformanceTrends())
    )
  );

  override initialize(enableRealTime: boolean = false) {
    this.loadAllAnalytics();
    
    if (enableRealTime) {
      this.startRealTimeUpdates();
    }
  }

  startRealTimeUpdates() {
    this.subscribe(this.performanceTrends$, {
      next: (data) => this.performanceTrends.set(data),
      showLoading: false
    });
  }
}
```

## Route Prefetching

### For Heavy Pages (Analytics, Film Pages)

```typescript
// Route configuration
{
  path: "analytics",
  loadComponent: () => import("./features/analytics/analytics.component"),
  resolve: { prefetch: analyticsPrefetchResolver },
  // Prefetches data before component loads
}
```

### Prefetch Resolver

```typescript
export const analyticsPrefetchResolver: ResolveFn<void> = () => {
  const analyticsDataService = inject(AnalyticsDataService);
  
  // Prefetch data
  analyticsDataService.getAllAnalytics().subscribe();
  
  return undefined;
};
```

## Benefits

### 1. Separation of Concerns
- Data fetching logic separate from state management
- Easy to test each layer independently
- Clear responsibilities

### 2. Performance
- Lazy loading keeps initial bundle small
- Route prefetching improves perceived performance
- Signals are more efficient than Observables for UI state

### 3. Maintainability
- Clear patterns to follow
- Easy to add new features
- Consistent error handling

### 4. Testing
- Mock data services easily
- Test view models in isolation
- Test components with view model mocks

## Migration Guide

### Step 1: Create Data Service

```typescript
// Before: Service mixes API calls and state
@Injectable()
export class DashboardService {
  stats = signal([]); // ❌ State in service
  
  loadDashboard() {
    this.apiService.get('/dashboard').subscribe(data => {
      this.stats.set(data); // ❌ State management in service
    });
  }
}

// After: Pure data service
@Injectable()
export class DashboardDataService {
  getDashboard(): Observable<DashboardData> {
    return this.apiService.get('/dashboard'); // ✅ Returns Observable
  }
}
```

### Step 2: Create View Model

```typescript
@Injectable()
export class DashboardViewModel extends BaseViewModel {
  private dashboardDataService = inject(DashboardDataService);
  
  readonly stats = signal<DashboardStats | null>(null); // ✅ State in view model
  
  loadDashboard() {
    this.subscribe(
      this.dashboardDataService.getDashboard(),
      {
        next: (data) => this.stats.set(data.stats) // ✅ State management in view model
      }
    );
  }
}
```

### Step 3: Update Component

```typescript
// Before: Component directly uses service
export class DashboardComponent {
  private dashboardService = inject(DashboardService);
  stats = this.dashboardService.stats; // ❌
}

// After: Component uses view model
export class DashboardComponent {
  private viewModel = inject(DashboardViewModel);
  stats = this.viewModel.stats; // ✅
  
  ngOnInit() {
    this.viewModel.initialize();
  }
}
```

## File Structure

```
angular/src/app/
├── core/
│   ├── services/
│   │   ├── data/              # Pure data services
│   │   │   ├── dashboard-data.service.ts
│   │   │   ├── analytics-data.service.ts
│   │   │   └── ...
│   │   └── api.service.ts     # Base API service
│   ├── view-models/           # State management
│   │   ├── base.view-model.ts
│   │   ├── reactive.view-model.ts
│   │   ├── dashboard.view-model.ts
│   │   ├── analytics.view-model.ts
│   │   └── ...
│   └── resolvers/             # Route prefetching
│       ├── analytics-prefetch.resolver.ts
│       └── ...
└── features/
    └── dashboard/
        └── dashboard.component.ts  # Uses DashboardViewModel
```

## Best Practices

1. **Data Services**
   - ✅ Return Observables
   - ✅ No state management
   - ✅ Pure functions
   - ✅ Handle API errors, return fallback data

2. **View Models**
   - ✅ Use Signals for state
   - ✅ Use Computed for derived state
   - ✅ Subscribe to Data Services
   - ✅ Handle loading/error states
   - ✅ Auto-cleanup subscriptions

3. **Components**
   - ✅ Inject View Models, not Data Services
   - ✅ Expose View Model signals to template
   - ✅ Call `initialize()` in `ngOnInit`
   - ✅ Use OnPush change detection

4. **Performance**
   - ✅ Lazy load all routes
   - ✅ Prefetch heavy pages (analytics, film)
   - ✅ Keep dashboard/workout fast
   - ✅ Use computed signals for expensive calculations

## Real-time Updates

For live analytics, use ReactiveViewModel:

```typescript
export class AnalyticsViewModel extends ReactiveViewModel {
  // Create reactive stream
  readonly performanceTrends$ = this.createStream(
    interval(5000).pipe(
      switchMap(() => this.analyticsDataService.getPerformanceTrends()),
      shareReplay(1)
    )
  );

  // Convert to signal for template
  readonly liveTrends = toSignal(
    this.performanceTrends$.pipe(map(data => data)),
    { initialValue: null }
  );
}
```

This keeps real-time updates reactive but simple - no complex realtime mechanisms needed.

