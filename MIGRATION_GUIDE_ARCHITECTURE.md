# Architecture Migration Guide

## Quick Start: Migrating to ViewModel Pattern

### Step 1: Create Data Service

Move API calls to a pure data service:

```typescript
// core/services/data/your-feature-data.service.ts
@Injectable({ providedIn: "root" })
export class YourFeatureDataService {
  private apiService = inject(ApiService);

  getData(): Observable<YourData> {
    return this.apiService.get<YourData>("/api/your-endpoint");
  }
}
```

### Step 2: Create View Model

Create a view model that manages state:

```typescript
// core/view-models/your-feature.view-model.ts
@Injectable()
export class YourFeatureViewModel extends BaseViewModel {
  private dataService = inject(YourFeatureDataService);

  readonly data = signal<YourData | null>(null);
  readonly derivedValue = computed(() => this.data()?.value ?? 0);

  override initialize() {
    this.loadData();
  }

  loadData() {
    this.subscribe(this.dataService.getData(), {
      next: (data) => this.data.set(data),
      error: (err) => this.handleError(err),
    });
  }
}
```

### Step 3: Update Component

Use the view model in your component:

```typescript
@Component({...})
export class YourFeatureComponent {
  protected viewModel = inject(YourFeatureViewModel);

  // Expose signals to template
  data = this.viewModel.data;
  loading = this.viewModel.loading;
  derivedValue = this.viewModel.derivedValue;

  ngOnInit() {
    this.viewModel.initialize();
  }
}
```

## Before/After Comparison

### Before (Mixed Concerns)

```typescript
// ❌ Service mixes API calls and state
@Injectable()
export class DashboardService {
  stats = signal([]); // State in service

  loadDashboard() {
    this.apiService.get('/dashboard').subscribe(data => {
      this.stats.set(data); // State management in service
    });
  }
}

// ❌ Component directly uses service
@Component({...})
export class DashboardComponent {
  private service = inject(DashboardService);
  stats = this.service.stats; // Direct service usage
}
```

### After (Separated Concerns)

```typescript
// ✅ Pure data service
@Injectable()
export class DashboardDataService {
  getDashboard(): Observable<DashboardData> {
    return this.apiService.get('/dashboard'); // Returns Observable
  }
}

// ✅ View model manages state
@Injectable()
export class DashboardViewModel extends BaseViewModel {
  private dataService = inject(DashboardDataService);

  readonly stats = signal<DashboardStats | null>(null);

  loadDashboard() {
    this.subscribe(
      this.dataService.getDashboard(),
      { next: (data) => this.stats.set(data.stats) }
    );
  }
}

// ✅ Component uses view model
@Component({...})
export class DashboardComponent {
  protected viewModel = inject(DashboardViewModel);
  stats = this.viewModel.stats; // Uses view model
}
```

## Checklist for Migration

- [ ] Create data service in `core/services/data/`
- [ ] Create view model in `core/view-models/`
- [ ] Update component to use view model
- [ ] Remove state management from old service
- [ ] Update tests to mock data service
- [ ] Test component with view model

## Performance Optimizations

### Route Prefetching

For heavy pages, add prefetch resolver:

```typescript
// app.routes.ts
{
  path: "analytics",
  loadComponent: () => import("./features/analytics/analytics.component"),
  resolve: { prefetch: analyticsPrefetchResolver },
}
```

### Lazy Loading

All routes should use lazy loading:

```typescript
{
  path: "dashboard",
  loadComponent: () => import("./features/dashboard/dashboard.component"),
}
```

## Real-time Updates

For live analytics, use ReactiveViewModel:

```typescript
export class AnalyticsViewModel extends ReactiveViewModel {
  readonly data$ = this.createStream(
    interval(5000).pipe(switchMap(() => this.dataService.getData())),
  );
}
```

This keeps real-time updates reactive but simple - no complex realtime mechanisms needed.
