# Frontend Performance & Maintainability Guide
## Advanced Patterns for Angular 21 + PrimeNG Applications

**Project**: FlagFit Pro  
**Focus**: Performance Optimization, Maintainability, Scalability  
**Created**: December 24, 2025

---

## 📋 Table of Contents

1. [Performance Optimization Strategies](#1-performance-optimization-strategies)
2. [Code Reusability Patterns](#2-code-reusability-patterns)
3. [State Management Best Practices](#3-state-management-best-practices)
4. [Memory Management](#4-memory-management)
5. [Bundle Optimization](#5-bundle-optimization)
6. [Rendering Performance](#6-rendering-performance)
7. [Network Optimization](#7-network-optimization)
8. [Caching Strategies](#8-caching-strategies)
9. [Code Splitting & Lazy Loading](#9-code-splitting--lazy-loading)
10. [Maintainability Patterns](#10-maintainability-patterns)

---

## 1. Performance Optimization Strategies

### 1.1 Component Performance Budget

Set performance targets for each component:

```typescript
// ✅ Performance Budget Example
@Component({
  selector: 'app-dashboard',
  // Target: < 100ms initial render
  // Target: < 16ms per frame (60 FPS)
  // Target: < 2KB component bundle
})
export class DashboardComponent {
  // Keep component logic minimal
  // Delegate heavy operations to services
  // Use computed signals for derived state
}
```

### 1.2 Memoization with Computed Signals

Use `computed()` to avoid recalculations:

```typescript
export class AnalyticsComponent {
  // Raw data signal
  private sessions = signal<TrainingSession[]>([]);
  
  // ✅ Memoized computed values - only recalculate when sessions change
  readonly totalDuration = computed(() => 
    this.sessions().reduce((sum, s) => sum + s.duration, 0)
  );
  
  readonly averageIntensity = computed(() => {
    const sessions = this.sessions();
    if (sessions.length === 0) return 0;
    return sessions.reduce((sum, s) => sum + s.intensity, 0) / sessions.length;
  });
  
  readonly sessionsThisWeek = computed(() => {
    const weekAgo = subDays(new Date(), 7);
    return this.sessions().filter(s => new Date(s.date) > weekAgo);
  });
  
  // ❌ BAD - Recalculates on every template check
  getTotalDuration(): number {
    return this.sessions().reduce((sum, s) => sum + s.duration, 0);
  }
}
```

### 1.3 Avoid Unnecessary DOM Updates

```typescript
// ✅ GOOD - Track by unique ID
template: `
  @for (session of sessions(); track session.id) {
    <div class="session">{{ session.name }}</div>
  }
`

// ❌ BAD - Recreates DOM on every change
template: `
  @for (session of sessions(); track $index) {
    <div class="session">{{ session.name }}</div>
  }
`
```

### 1.4 Debounce User Input

Reduce unnecessary operations:

```typescript
export class SearchComponent {
  private searchTermSubject = new Subject<string>();
  
  searchResults = signal<Result[]>([]);
  
  constructor() {
    const apiService = inject(ApiService);
    
    // ✅ Debounce search to avoid excessive API calls
    this.searchTermSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(term => apiService.search(term)),
        takeUntilDestroyed()
      )
      .subscribe(results => this.searchResults.set(results));
  }
  
  onSearchInput(term: string): void {
    this.searchTermSubject.next(term);
  }
}
```

### 1.5 Optimize Heavy Computations

Move intensive operations off the main thread:

```typescript
// ✅ Use Web Workers for heavy computation
// statistics.worker.ts
addEventListener('message', ({ data }) => {
  const result = calculateComplexStatistics(data);
  postMessage(result);
});

// component.ts
export class StatsComponent {
  private worker?: Worker;
  
  constructor() {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker(new URL('./statistics.worker', import.meta.url));
      this.worker.onmessage = ({ data }) => {
        this.statistics.set(data);
      };
    }
  }
  
  calculateStats(data: TrainingData[]): void {
    if (this.worker) {
      this.worker.postMessage(data);
    } else {
      // Fallback for environments without workers
      const result = calculateComplexStatistics(data);
      this.statistics.set(result);
    }
  }
  
  ngOnDestroy(): void {
    this.worker?.terminate();
  }
}
```

---

## 2. Code Reusability Patterns

### 2.1 Composition over Inheritance

Use composition for flexible, reusable functionality:

```typescript
// ✅ GOOD - Composable services
@Injectable({ providedIn: 'root' })
export class DataSyncService {
  private supabase = inject(SupabaseService);
  private logger = inject(LoggerService);
  
  startSync(table: string, callback: (data: any) => void): RealtimeChannel {
    this.logger.info(`Starting sync for ${table}`);
    return this.supabase.subscribe(table, callback);
  }
}

@Injectable({ providedIn: 'root' })
export class CacheService {
  private cache = new Map<string, { data: any; timestamp: number }>();
  
  get<T>(key: string, maxAge: number = 60000): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    return age < maxAge ? cached.data : null;
  }
  
  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}

// Component uses composition
export class DashboardComponent {
  private dataSync = inject(DataSyncService);
  private cache = inject(CacheService);
  
  ngOnInit(): void {
    // Compose functionality
    const cached = this.cache.get('dashboard');
    if (cached) {
      this.data.set(cached);
    }
    
    this.dataSync.startSync('sessions', (data) => {
      this.data.set(data);
      this.cache.set('dashboard', data);
    });
  }
}
```

### 2.2 Higher-Order Components Pattern

Create reusable component enhancers:

```typescript
// with-loading.component.ts
@Component({
  selector: 'app-with-loading',
  standalone: true,
  template: `
    @if (loading()) {
      <div class="loading-overlay">
        <i class="pi pi-spin pi-spinner"></i>
        <p>{{ loadingMessage() }}</p>
      </div>
    }
    <ng-content />
  `,
})
export class WithLoadingComponent {
  loading = input<boolean>(false);
  loadingMessage = input<string>('Loading...');
}

// Usage
<app-with-loading [loading]="isLoading()">
  <app-data-table [data]="data()" />
</app-with-loading>
```

### 2.3 Custom Directives for Reusable Behavior

```typescript
// directives/auto-focus.directive.ts
@Directive({
  selector: '[appAutoFocus]',
  standalone: true,
})
export class AutoFocusDirective implements AfterViewInit {
  private element = inject(ElementRef);
  delay = input<number>(0);
  
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.element.nativeElement.focus();
    }, this.delay());
  }
}

// directives/click-outside.directive.ts
@Directive({
  selector: '[appClickOutside]',
  standalone: true,
})
export class ClickOutsideDirective {
  private element = inject(ElementRef);
  clickOutside = output<void>();
  
  @HostListener('document:click', ['$event.target'])
  onClick(target: HTMLElement): void {
    const clickedInside = this.element.nativeElement.contains(target);
    if (!clickedInside) {
      this.clickOutside.emit();
    }
  }
}

// Usage
<div appClickOutside (clickOutside)="closeDropdown()">
  <button appAutoFocus [delay]="100">Click me</button>
</div>
```

### 2.4 Generic Table Component

Build once, use everywhere:

```typescript
// shared/components/data-table/data-table.component.ts
@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [TableModule, ButtonModule],
  template: `
    <p-table
      [value]="data()"
      [paginator]="paginator()"
      [rows]="rows()"
      [loading]="loading()"
      [globalFilterFields]="filterFields()"
    >
      <ng-template pTemplate="header">
        <tr>
          @for (col of columns(); track col.field) {
            <th [pSortableColumn]="col.field">
              {{ col.header }}
              <p-sortIcon [field]="col.field" />
            </th>
          }
          @if (actions()) {
            <th>Actions</th>
          }
        </tr>
      </ng-template>
      
      <ng-template pTemplate="body" let-row>
        <tr>
          @for (col of columns(); track col.field) {
            <td>{{ row[col.field] }}</td>
          }
          @if (actions()) {
            <td>
              <ng-container 
                *ngTemplateOutlet="actions(); context: { $implicit: row }"
              />
            </td>
          }
        </tr>
      </ng-template>
    </p-table>
  `,
})
export class DataTableComponent<T> {
  data = input.required<T[]>();
  columns = input.required<TableColumn[]>();
  actions = input<TemplateRef<any>>();
  loading = input<boolean>(false);
  paginator = input<boolean>(true);
  rows = input<number>(10);
  filterFields = input<string[]>([]);
}

// Usage
<app-data-table
  [data]="sessions()"
  [columns]="sessionColumns"
  [loading]="loading()"
  [actions]="actionsTpl"
/>

<ng-template #actionsTpl let-session>
  <p-button icon="pi pi-pencil" (click)="edit(session)" />
  <p-button icon="pi pi-trash" (click)="delete(session)" />
</ng-template>
```

### 2.5 Form Builder Service

Centralize form creation logic:

```typescript
// core/services/form-builder.service.ts
@Injectable({ providedIn: 'root' })
export class FormBuilderService {
  private fb = inject(FormBuilder);
  
  createLoginForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      remember: [false],
    });
  }
  
  createTrainingSessionForm(): FormGroup {
    return this.fb.group({
      session_type: ['', Validators.required],
      duration: [0, [Validators.required, Validators.min(1)]],
      intensity: [5, [Validators.required, Validators.min(1), Validators.max(10)]],
      notes: [''],
    });
  }
  
  createPlayerProfileForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      position: ['', Validators.required],
      jersey_number: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      height: ['', Validators.required],
      weight: ['', Validators.required],
    });
  }
}
```

---

## 3. State Management Best Practices

### 3.1 Immutable State Updates

Always create new references:

```typescript
// ✅ GOOD - Immutable updates
export class PlayersService {
  private _players = signal<Player[]>([]);
  readonly players = this._players.asReadonly();
  
  addPlayer(player: Player): void {
    this._players.update(current => [...current, player]);
  }
  
  updatePlayer(id: string, updates: Partial<Player>): void {
    this._players.update(current =>
      current.map(p => p.id === id ? { ...p, ...updates } : p)
    );
  }
  
  removePlayer(id: string): void {
    this._players.update(current => current.filter(p => p.id !== id));
  }
}

// ❌ BAD - Mutating state directly
addPlayer(player: Player): void {
  this._players().push(player);  // Mutation!
}
```

### 3.2 Normalized State Structure

Avoid nested data structures:

```typescript
// ❌ BAD - Nested structure
interface AppState {
  teams: {
    id: string;
    name: string;
    players: Player[];  // Nested!
  }[];
}

// ✅ GOOD - Normalized structure
interface AppState {
  teams: Record<string, Team>;
  players: Record<string, Player>;
  teamPlayers: Record<string, string[]>;  // team_id -> player_ids
}

@Injectable({ providedIn: 'root' })
export class StateService {
  private _teams = signal<Record<string, Team>>({});
  private _players = signal<Record<string, Player>>({});
  private _teamPlayers = signal<Record<string, string[]>>({});
  
  // Computed: Get players for a team
  getTeamPlayers = (teamId: string) => computed(() => {
    const playerIds = this._teamPlayers()[teamId] || [];
    return playerIds.map(id => this._players()[id]).filter(Boolean);
  });
  
  addPlayerToTeam(teamId: string, player: Player): void {
    // Update players
    this._players.update(players => ({
      ...players,
      [player.id]: player,
    }));
    
    // Update team-player relationship
    this._teamPlayers.update(tp => ({
      ...tp,
      [teamId]: [...(tp[teamId] || []), player.id],
    }));
  }
}
```

### 3.3 Facade Pattern for Complex State

Simplify component access to state:

```typescript
// core/facades/training.facade.ts
@Injectable({ providedIn: 'root' })
export class TrainingFacade {
  private trainingService = inject(TrainingService);
  private playerService = inject(PlayerService);
  private analyticsService = inject(AnalyticsService);
  
  // Aggregate data from multiple services
  readonly dashboardData = computed(() => ({
    sessions: this.trainingService.sessions(),
    players: this.playerService.players(),
    stats: this.analyticsService.stats(),
  }));
  
  readonly isLoading = computed(() =>
    this.trainingService.loading() ||
    this.playerService.loading() ||
    this.analyticsService.loading()
  );
  
  // Single method for complex operations
  async initializeDashboard(): Promise<void> {
    await Promise.all([
      this.trainingService.loadSessions(),
      this.playerService.loadPlayers(),
      this.analyticsService.loadStats(),
    ]);
  }
  
  async createSessionWithTracking(
    session: CreateSessionDto
  ): Promise<void> {
    const created = await this.trainingService.createSession(session);
    await this.analyticsService.trackSessionCreated(created.id);
  }
}

// Component uses facade
export class DashboardComponent {
  protected facade = inject(TrainingFacade);
  
  // Simple access to complex state
  readonly data = this.facade.dashboardData;
  readonly loading = this.facade.isLoading;
  
  ngOnInit(): void {
    this.facade.initializeDashboard();
  }
}
```

---

## 4. Memory Management

### 4.1 Automatic Cleanup with DestroyRef

```typescript
export class FeatureComponent {
  private destroyRef = inject(DestroyRef);
  private apiService = inject(ApiService);
  
  ngOnInit(): void {
    // ✅ GOOD - Automatically unsubscribes
    this.apiService.getData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => {
        this.data.set(data);
      });
    
    // ✅ GOOD - Custom cleanup
    this.destroyRef.onDestroy(() => {
      console.log('Component destroyed');
      // Cleanup logic here
    });
  }
}
```

### 4.2 Prevent Memory Leaks with Signals

Signals automatically handle cleanup:

```typescript
// ✅ GOOD - Signals handle subscriptions internally
export class DashboardComponent {
  private apiService = inject(ApiService);
  
  data = signal<Data[]>([]);
  
  // Computed signals auto-unsubscribe
  total = computed(() => this.data().length);
  
  // Effects auto-cleanup
  constructor() {
    effect(() => {
      console.log('Data changed:', this.data().length);
      // This automatically cleans up when component destroys
    });
  }
  
  async loadData(): Promise<void> {
    const result = await this.apiService.getData();
    this.data.set(result);  // No subscription to manage!
  }
}
```

### 4.3 Detach Event Listeners

```typescript
export class CustomComponent implements OnDestroy {
  private resizeListener?: () => void;
  
  ngOnInit(): void {
    this.resizeListener = () => this.onResize();
    window.addEventListener('resize', this.resizeListener);
  }
  
  ngOnDestroy(): void {
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
  }
  
  // ✅ BETTER - Use HostListener (auto-cleanup)
  @HostListener('window:resize')
  onResize(): void {
    // Handle resize
  }
}
```

### 4.4 WeakMap for Caching

Use WeakMap for object-keyed caches:

```typescript
@Injectable({ providedIn: 'root' })
export class CacheService {
  // ✅ WeakMap allows garbage collection
  private cache = new WeakMap<object, any>();
  
  get(key: object): any {
    return this.cache.get(key);
  }
  
  set(key: object, value: any): void {
    this.cache.set(key, value);
  }
}
```

---

## 5. Bundle Optimization

### 5.1 Analyze Bundle Size

```bash
# Generate stats file
ng build --stats-json

# Analyze with webpack-bundle-analyzer
npx webpack-bundle-analyzer dist/flagfit-pro/stats.json

# Source map explorer
npm install -g source-map-explorer
source-map-explorer dist/**/*.js
```

### 5.2 Dynamic Imports for Large Dependencies

```typescript
// ✅ GOOD - Load Chart.js only when needed
async loadChart(): Promise<void> {
  const { Chart } = await import('chart.js/auto');
  this.chartInstance = new Chart(/* ... */);
}

// ✅ GOOD - Lazy load heavy utilities
async exportToExcel(data: any[]): Promise<void> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.utils.book_new();
  // ... export logic
}
```

### 5.3 Tree-Shaking Optimization

```typescript
// ✅ GOOD - Direct imports (tree-shakeable)
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

// ✅ GOOD - Named imports from libraries
import { format, parseISO } from 'date-fns';

// ❌ BAD - Barrel imports (hurts tree-shaking)
import * as PrimeNG from 'primeng';
import * as dateFns from 'date-fns';
```

### 5.4 Remove Unused Code

```typescript
// Use ESLint to find unused exports
// .eslintrc.json
{
  "rules": {
    "@typescript-eslint/no-unused-vars": "error"
  }
}

// Run analysis
npm run lint -- --fix
```

### 5.5 Optimize Third-Party Libraries

```typescript
// ✅ Use smaller alternatives
// Instead of moment.js (500KB), use date-fns (13KB)
import { format } from 'date-fns';

// Instead of lodash (70KB), use native methods or lodash-es
import debounce from 'lodash-es/debounce';

// Instead of rxjs operators all at once, import individually
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
```

---

## 6. Rendering Performance

### 6.1 Virtual Scrolling

For lists with 100+ items:

```typescript
@Component({
  selector: 'app-player-list',
  standalone: true,
  imports: [ScrollingModule, CdkVirtualScrollViewport],
  template: `
    <cdk-virtual-scroll-viewport itemSize="50" class="viewport">
      @for (player of players(); track player.id) {
        <div class="player-item">
          {{ player.name }} - {{ player.position }}
        </div>
      }
    </cdk-virtual-scroll-viewport>
  `,
  styles: [`
    .viewport {
      height: 600px;
      width: 100%;
    }
    .player-item {
      height: 50px;
      padding: 10px;
      border-bottom: 1px solid #ddd;
    }
  `],
})
export class PlayerListComponent {
  players = input.required<Player[]>();
}
```

### 6.2 OnPush with Immutability

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerCardComponent {
  player = input.required<Player>();
  
  // ✅ Component only checks when player reference changes
  // Parent must pass new object reference:
  // this.players.update(current => 
  //   current.map(p => p.id === id ? { ...p, ...updates } : p)
  // );
}
```

### 6.3 Pure Pipes

Create stateless transformations:

```typescript
@Pipe({ 
  name: 'playerPosition',
  standalone: true,
  pure: true  // ✅ Default - only re-run when input changes
})
export class PlayerPositionPipe implements PipeTransform {
  transform(position: string): string {
    const positions: Record<string, string> = {
      'QB': 'Quarterback',
      'WR': 'Wide Receiver',
      'RB': 'Running Back',
      // ...
    };
    return positions[position] || position;
  }
}
```

### 6.4 Defer Loading Non-Critical Content

```typescript
template: `
  <!-- Critical content renders immediately -->
  <app-hero-section />
  
  <!-- Defer non-critical content -->
  @defer (on viewport) {
    <app-analytics-dashboard />
  } @placeholder {
    <div class="skeleton">Loading analytics...</div>
  }
  
  <!-- Load on interaction -->
  @defer (on interaction) {
    <app-comments-section />
  } @placeholder {
    <button>Load Comments</button>
  }
`
```

### 6.5 Optimize ngFor with trackBy

```typescript
// ✅ Modern Angular 21 - always use track
@for (player of players(); track player.id) {
  <app-player-card [player]="player" />
}

// Equivalent in older Angular
<div *ngFor="let player of players(); trackBy: trackById">
```

---

## 7. Network Optimization

### 7.1 Request Batching

Combine multiple requests:

```typescript
@Injectable({ providedIn: 'root' })
export class BatchApiService {
  private http = inject(HttpClient);
  private pendingRequests = new Map<string, Subject<any>>();
  
  batchGet<T>(endpoint: string): Observable<T> {
    // Check if request already pending
    if (this.pendingRequests.has(endpoint)) {
      return this.pendingRequests.get(endpoint)!.asObservable();
    }
    
    // Create new request subject
    const subject = new Subject<T>();
    this.pendingRequests.set(endpoint, subject);
    
    // Delay to batch requests
    setTimeout(() => {
      this.http.get<T>(endpoint).subscribe({
        next: (data) => {
          subject.next(data);
          subject.complete();
          this.pendingRequests.delete(endpoint);
        },
        error: (err) => {
          subject.error(err);
          this.pendingRequests.delete(endpoint);
        },
      });
    }, 10);
    
    return subject.asObservable();
  }
}
```

### 7.2 Request Cancellation

Cancel obsolete requests:

```typescript
export class SearchComponent {
  private searchController?: AbortController;
  
  async search(term: string): Promise<void> {
    // Cancel previous request
    this.searchController?.abort();
    
    // Create new controller
    this.searchController = new AbortController();
    
    try {
      const results = await fetch(`/api/search?q=${term}`, {
        signal: this.searchController.signal,
      });
      this.results.set(await results.json());
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Request cancelled');
      }
    }
  }
}
```

### 7.3 Prefetching Data

Load data before navigation:

```typescript
// analytics-prefetch.resolver.ts
export const analyticsPrefetchResolver: ResolveFn<Analytics> = (route) => {
  const apiService = inject(ApiService);
  return apiService.getAnalytics();
};

// Route configuration
{
  path: 'analytics',
  loadComponent: () => import('./analytics.component'),
  resolve: { data: analyticsPrefetchResolver },
}

// Component receives prefetched data
export class AnalyticsComponent {
  private route = inject(ActivatedRoute);
  
  data = signal<Analytics>(this.route.snapshot.data['data']);
}
```

### 7.4 Optimistic Updates

Update UI before server confirms:

```typescript
export class PlayerService {
  private _players = signal<Player[]>([]);
  
  async updatePlayer(id: string, updates: Partial<Player>): Promise<void> {
    // 1. Optimistic update
    const previousState = this._players();
    this._players.update(current =>
      current.map(p => p.id === id ? { ...p, ...updates } : p)
    );
    
    try {
      // 2. Server update
      await this.apiService.updatePlayer(id, updates);
    } catch (err) {
      // 3. Rollback on error
      this._players.set(previousState);
      throw err;
    }
  }
}
```

---

## 8. Caching Strategies

### 8.1 In-Memory Cache with Expiration

```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  
  get<T>(key: string, maxAge: number = 300000): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const age = Date.now() - entry.timestamp;
    if (age > maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }
  
  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}
```

### 8.2 HTTP Cache Interceptor

```typescript
export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  const cache = inject(CacheService);
  
  // Only cache GET requests
  if (req.method !== 'GET') {
    return next(req);
  }
  
  // Check cache
  const cached = cache.get(req.url);
  if (cached) {
    return of(new HttpResponse({ body: cached }));
  }
  
  // Fetch and cache
  return next(req).pipe(
    tap(event => {
      if (event instanceof HttpResponse) {
        cache.set(req.url, event.body);
      }
    })
  );
};
```

### 8.3 LocalStorage Persistence

```typescript
@Injectable({ providedIn: 'root' })
export class StorageService {
  set<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (err) {
      console.error('Storage error:', err);
    }
  }
  
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (err) {
      console.error('Storage error:', err);
      return null;
    }
  }
  
  remove(key: string): void {
    localStorage.removeItem(key);
  }
  
  clear(): void {
    localStorage.clear();
  }
}
```

### 8.4 Service Worker Caching

```typescript
// sw.js (Service Worker)
const CACHE_NAME = 'flagfit-v1';
const urlsToCache = [
  '/',
  '/styles.css',
  '/main.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

---

## 9. Code Splitting & Lazy Loading

### 9.1 Route-Based Code Splitting ✅

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => 
      import('./features/landing/landing.component')
        .then(m => m.LandingComponent),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component')
        .then(m => m.DashboardComponent),
  },
  {
    path: 'training',
    loadChildren: () =>
      import('./features/training/training.routes')
        .then(m => m.trainingRoutes),
  },
];
```

### 9.2 Component-Level Lazy Loading

```typescript
@Component({
  template: `
    @if (showChart()) {
      <ng-container *ngComponentOutlet="chartComponent()" />
    }
  `,
})
export class DashboardComponent {
  showChart = signal(false);
  chartComponent = signal<Type<any> | null>(null);
  
  async loadChart(): Promise<void> {
    const { ChartComponent } = await import('./chart/chart.component');
    this.chartComponent.set(ChartComponent);
    this.showChart.set(true);
  }
}
```

### 9.3 Preloading Strategy

```typescript
// Custom preload strategy
@Injectable({ providedIn: 'root' })
export class SelectivePreloadStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    // Preload routes marked with data.preload
    return route.data?.['preload'] ? load() : of(null);
  }
}

// Route configuration
{
  path: 'analytics',
  data: { preload: true },  // This route will be preloaded
  loadComponent: () => import('./analytics.component'),
}

// app.config.ts
provideRouter(
  routes,
  withPreloading(SelectivePreloadStrategy)
);
```

---

## 10. Maintainability Patterns

### 10.1 Consistent Naming Conventions

```typescript
// ✅ GOOD - Consistent naming
export class PlayerService { }
export class PlayerCardComponent { }
export interface Player { }
export type PlayerStatus = 'active' | 'injured';
export const PLAYER_POSITIONS = ['QB', 'WR', 'RB'];

// Files
player.service.ts
player-card.component.ts
player.models.ts
player.constants.ts
```

### 10.2 Self-Documenting Code

```typescript
// ✅ GOOD - Clear, self-explanatory
export class TrainingAnalytics {
  calculateAcuteChronicWorkloadRatio(
    acuteLoad: number,
    chronicLoad: number
  ): number {
    if (chronicLoad === 0) {
      throw new Error('Chronic load cannot be zero');
    }
    return acuteLoad / chronicLoad;
  }
  
  isAthleteAtRisk(acwr: number): boolean {
    const SAFE_LOWER_BOUND = 0.8;
    const SAFE_UPPER_BOUND = 1.3;
    return acwr < SAFE_LOWER_BOUND || acwr > SAFE_UPPER_BOUND;
  }
}

// ❌ BAD - Unclear abbreviations
export class Analytics {
  calc(a: number, b: number): number {
    return a / b;  // What does this calculate?
  }
}
```

### 10.3 Feature Flags

```typescript
@Injectable({ providedIn: 'root' })
export class FeatureFlagService {
  private flags = signal<Record<string, boolean>>({
    'new-dashboard': false,
    'ai-recommendations': true,
    'social-features': false,
  });
  
  isEnabled(flag: string): boolean {
    return this.flags()[flag] ?? false;
  }
  
  enable(flag: string): void {
    this.flags.update(current => ({ ...current, [flag]: true }));
  }
}

// Usage in component
@Component({
  template: `
    @if (features.isEnabled('new-dashboard')) {
      <app-new-dashboard />
    } @else {
      <app-legacy-dashboard />
    }
  `,
})
export class DashboardComponent {
  protected features = inject(FeatureFlagService);
}
```

### 10.4 Error Boundaries

```typescript
@Component({
  selector: 'app-error-boundary',
  standalone: true,
  template: `
    @if (hasError()) {
      <div class="error-boundary">
        <h2>Something went wrong</h2>
        <p>{{ errorMessage() }}</p>
        <p-button label="Retry" (click)="retry()" />
      </div>
    } @else {
      <ng-content />
    }
  `,
})
export class ErrorBoundaryComponent implements OnInit {
  private errorHandler = inject(ErrorHandler);
  
  hasError = signal(false);
  errorMessage = signal('');
  
  ngOnInit(): void {
    // Listen for errors
    this.errorHandler.handleError = (error: any) => {
      this.hasError.set(true);
      this.errorMessage.set(error.message);
      console.error('Error caught by boundary:', error);
    };
  }
  
  retry(): void {
    this.hasError.set(false);
    window.location.reload();
  }
}
```

### 10.5 Logging Service

```typescript
@Injectable({ providedIn: 'root' })
export class LoggerService {
  private isDev = !environment.production;
  
  info(message: string, ...args: any[]): void {
    if (this.isDev) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }
  
  warn(message: string, ...args: any[]): void {
    console.warn(`[WARN] ${message}`, ...args);
  }
  
  error(message: string, error?: any): void {
    console.error(`[ERROR] ${message}`, error);
    // Send to error tracking service
    this.sendToErrorTracking(message, error);
  }
  
  private sendToErrorTracking(message: string, error: any): void {
    // Integration with Sentry, LogRocket, etc.
  }
}
```

---

## 📊 Performance Metrics

### Core Web Vitals Targets

- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **TTFB (Time to First Byte)**: < 600ms
- **FCP (First Contentful Paint)**: < 1.8s

### Bundle Size Targets

- **Initial Bundle**: < 700KB (warning), < 1MB (error)
- **Lazy Chunks**: < 200KB each
- **Component Styles**: < 5KB (warning), < 8KB (error)

### Runtime Performance

- **Component Render**: < 16ms (60 FPS)
- **API Response**: < 200ms (fast), < 1s (acceptable)
- **User Interaction**: < 100ms response

---

## 🎯 Quick Checklist

### Performance ✅
- [ ] OnPush change detection everywhere
- [ ] Lazy loading configured
- [ ] Track functions in @for loops
- [ ] Signals for state management
- [ ] Virtual scrolling for large lists
- [ ] Debounced search/input
- [ ] Optimized images
- [ ] Bundle size monitoring

### Maintainability ✅
- [ ] Consistent naming conventions
- [ ] Feature-based folder structure
- [ ] Shared components extracted
- [ ] Utility functions centralized
- [ ] TypeScript strict mode
- [ ] Error boundaries implemented
- [ ] Logging service used
- [ ] Documentation updated

### Code Quality ✅
- [ ] No 'any' types
- [ ] Immutable state updates
- [ ] Memory leaks prevented
- [ ] Tests written
- [ ] Accessibility implemented
- [ ] Security best practices followed

---

## 📚 Resources

- [Angular Performance Guide](https://angular.dev/best-practices/runtime-performance)
- [Web.dev Performance](https://web.dev/performance/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Bundle Phobia](https://bundlephobia.com/) - Check package sizes

---

**Document Version**: 1.0  
**Last Updated**: December 24, 2025  
**Status**: Production Guidelines

