# Angular 21 + PrimeNG 21 Best Practices Guide
## Enterprise-Grade Architecture, Performance, Security & Maintainability

**Project**: FlagFit Pro  
**Framework**: Angular 21.0.3 + PrimeNG 21.0.2  
**Created**: December 24, 2025  
**Status**: Production-Ready Standards

---

## 📋 Table of Contents

1. [Architecture Principles](#1-architecture-principles)
2. [Component Design Patterns](#2-component-design-patterns)
3. [State Management](#3-state-management)
4. [Performance Optimization](#4-performance-optimization)
5. [Security Best Practices](#5-security-best-practices)
6. [Code Organization](#6-code-organization)
7. [TypeScript Standards](#7-typescript-standards)
8. [Testing Strategy](#8-testing-strategy)
9. [Accessibility (A11y)](#9-accessibility-a11y)
10. [PrimeNG Optimization](#10-primeng-optimization)
11. [DRY Principles & Reusability](#11-dry-principles--reusability)
12. [Error Handling](#12-error-handling)
13. [API Integration](#13-api-integration)
14. [Build & Deployment](#14-build--deployment)

---

## 1. Architecture Principles

### 1.1 Feature-Based Structure ✅

```
angular/src/app/
├── core/                    # Singleton services, guards, interceptors
│   ├── guards/              # Route guards
│   ├── interceptors/        # HTTP interceptors
│   ├── services/            # App-wide services
│   ├── models/              # Core data models
│   ├── utils/               # Utility functions
│   └── strategies/          # Custom strategies
├── features/                # Feature modules (lazy-loaded)
│   ├── auth/
│   ├── dashboard/
│   ├── training/
│   └── [feature]/
│       ├── [feature].component.ts
│       ├── [feature].service.ts
│       └── [feature].models.ts
├── shared/                  # Shared components, directives, pipes
│   ├── components/
│   ├── directives/
│   ├── pipes/
│   └── utils/
└── environments/            # Environment configurations
```

**Rationale**: 
- Clear separation of concerns
- Easy to locate and maintain code
- Supports lazy loading for performance
- Scalable for large teams

### 1.2 Standalone Components (Angular 21) ✅

**Always use standalone components** - no NgModules:

```typescript
@Component({
  selector: 'app-feature',
  standalone: true,  // ✅ REQUIRED
  changeDetection: ChangeDetectionStrategy.OnPush,  // ✅ REQUIRED
  imports: [
    // Only import what you need - tree-shakeable
    CardModule,
    ButtonModule,
    ReactiveFormsModule,
  ],
  template: `...`,
})
export class FeatureComponent {}
```

**Benefits**:
- Better tree-shaking (smaller bundles)
- Explicit dependencies (easier to understand)
- Faster compilation
- No circular dependency issues

### 1.3 Zoneless Architecture ✅

Angular 21 default - no zone.js overhead:

```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(), // ✅ Angular 21 default
    // ... other providers
  ],
};
```

**Benefits**:
- 40-80KB smaller bundle size
- Faster change detection
- Better DevTools integration
- Predictable reactivity with signals

---

## 2. Component Design Patterns

### 2.1 Smart vs Presentational Components

#### Smart (Container) Components

Handle logic, API calls, and state management:

```typescript
@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatsGridComponent, ChartComponent],
  template: `
    <app-stats-grid [stats]="stats()" />
    <app-chart [data]="chartData()" />
  `,
})
export class DashboardComponent implements OnInit {
  private apiService = inject(ApiService);
  private viewModel = inject(DashboardViewModel);
  
  // Expose signals from view model
  readonly stats = this.viewModel.stats;
  readonly chartData = this.viewModel.chartData;
  
  ngOnInit(): void {
    this.viewModel.initialize();
  }
}
```

#### Presentational (Dumb) Components

Only display data, emit events:

```typescript
@Component({
  selector: 'app-stats-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardModule],
  template: `
    @for (stat of stats(); track stat.id) {
      <p-card>
        <h3>{{ stat.label }}</h3>
        <p>{{ stat.value }}</p>
      </p-card>
    }
  `,
})
export class StatsGridComponent {
  stats = input.required<Stat[]>();  // ✅ Modern signal-based input
}
```

### 2.2 Component Template Structure

**Use inline templates for small components** (<30 lines):

```typescript
@Component({
  // ...
  template: `
    <div class="component-wrapper">
      <!-- Template here -->
    </div>
  `,
})
```

**Use external templates for complex components**:

```typescript
@Component({
  // ...
  templateUrl: './feature.component.html',
  styleUrls: ['./feature.component.scss'],
})
```

### 2.3 Modern Control Flow Syntax ✅

**Always use Angular 21's modern control flow**:

```typescript
// ✅ CORRECT - Modern Angular 21 syntax
@if (loading()) {
  <p>Loading...</p>
} @else if (error()) {
  <p>Error: {{ error() }}</p>
} @else {
  <div>{{ data() }}</div>
}

// ✅ CORRECT - With track function
@for (item of items(); track item.id) {
  <div>{{ item.name }}</div>
}

// ✅ CORRECT - Switch statement
@switch (status()) {
  @case ('pending') { <span>Pending</span> }
  @case ('approved') { <span>Approved</span> }
  @default { <span>Unknown</span> }
}

// ❌ WRONG - Deprecated syntax
<div *ngIf="loading()">Loading...</div>
<div *ngFor="let item of items()">{{ item.name }}</div>
```

**Why**: 
- Better type checking
- Better performance
- Cleaner syntax
- Required track functions prevent bugs

---

## 3. State Management

### 3.1 Signal-Based State (Angular 21) ✅

Use signals for all reactive state:

```typescript
export class FeatureComponent {
  // Simple signal
  count = signal(0);
  
  // Computed signal (derived state)
  doubleCount = computed(() => this.count() * 2);
  
  // Effect (side effects)
  constructor() {
    effect(() => {
      console.log('Count changed:', this.count());
    });
  }
  
  increment(): void {
    this.count.update(v => v + 1);
  }
}
```

### 3.2 View Models Pattern ✅

Encapsulate component logic in view models:

```typescript
// dashboard.view-model.ts
@Injectable()
export class DashboardViewModel {
  private apiService = inject(ApiService);
  
  // State signals
  private _stats = signal<Stat[]>([]);
  private _loading = signal(false);
  private _error = signal<string | null>(null);
  
  // Public readonly signals
  readonly stats = this._stats.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  
  // Computed values
  readonly totalStats = computed(() => 
    this._stats().reduce((sum, stat) => sum + stat.value, 0)
  );
  
  async initialize(): Promise<void> {
    this._loading.set(true);
    try {
      const data = await this.apiService.getStats();
      this._stats.set(data);
    } catch (err) {
      this._error.set(err.message);
    } finally {
      this._loading.set(false);
    }
  }
  
  refresh(): void {
    this.initialize();
  }
}
```

**Benefits**:
- Separation of concerns
- Testable logic
- Reusable across components
- Clean component code

### 3.3 Service Layer State

For app-wide state, use services with signals:

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<User | null>(null);
  private _isAuthenticated = signal(false);
  
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = this._isAuthenticated.asReadonly();
  
  // Computed permissions
  readonly userRole = computed(() => this.user()?.role ?? 'guest');
  readonly isAdmin = computed(() => this.userRole() === 'admin');
  
  async login(credentials: Credentials): Promise<void> {
    const user = await this.apiService.login(credentials);
    this._user.set(user);
    this._isAuthenticated.set(true);
  }
  
  logout(): void {
    this._user.set(null);
    this._isAuthenticated.set(false);
  }
}
```

---

## 4. Performance Optimization

### 4.1 OnPush Change Detection ✅

**ALWAYS use OnPush strategy**:

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush, // ✅ REQUIRED
})
export class FeatureComponent {}
```

**Benefits**:
- Components only check when inputs change
- Reduces unnecessary re-renders
- 70-90% performance improvement
- Works perfectly with signals

### 4.2 Lazy Loading ✅

Configure route-based code splitting:

```typescript
// app.routes.ts
export const routes: Routes = [
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

### 4.3 Smart Preloading Strategy ✅

Preload authenticated routes:

```typescript
// auth-aware-preload.strategy.ts
@Injectable({ providedIn: 'root' })
export class AuthAwarePreloadStrategy implements PreloadingStrategy {
  private authService = inject(AuthService);
  
  preload(route: Route, load: () => Observable<any>): Observable<any> {
    // Only preload if user is authenticated
    return this.authService.isAuthenticated()
      ? load()
      : of(null);
  }
}

// app.config.ts
provideRouter(
  routes,
  withPreloading(AuthAwarePreloadStrategy)
);
```

### 4.4 Track Functions (Required) ✅

**Always provide track functions for @for loops**:

```typescript
@for (item of items(); track item.id) {
  <div>{{ item.name }}</div>
}

// For arrays without unique IDs:
@for (item of items(); track $index) {
  <div>{{ item }}</div>
}
```

**Why**: 
- Angular can efficiently update DOM
- Prevents unnecessary re-renders
- Required in Angular 21+

### 4.5 Virtual Scrolling for Large Lists

Use CDK Virtual Scroll for 1000+ items:

```typescript
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';

@Component({
  imports: [ScrollingModule],
  template: `
    <cdk-virtual-scroll-viewport itemSize="50" class="viewport">
      @for (item of items(); track item.id) {
        <div class="item">{{ item.name }}</div>
      }
    </cdk-virtual-scroll-viewport>
  `,
  styles: [`
    .viewport { height: 400px; }
    .item { height: 50px; }
  `],
})
```

### 4.6 Image Optimization

Use NgOptimizedImage directive:

```typescript
import { NgOptimizedImage } from '@angular/common';

@Component({
  imports: [NgOptimizedImage],
  template: `
    <img 
      ngSrc="/assets/hero.jpg" 
      width="1200" 
      height="600"
      priority  
      alt="Hero image"
    />
  `,
})
```

**Benefits**:
- Automatic lazy loading
- Responsive images
- LCP optimization
- Preconnect hints

### 4.7 Bundle Size Budgets ✅

Configure in `angular.json`:

```json
{
  "budgets": [
    {
      "type": "initial",
      "maximumWarning": "700kb",
      "maximumError": "1mb"
    },
    {
      "type": "anyComponentStyle",
      "maximumWarning": "5kb",
      "maximumError": "8kb"
    }
  ]
}
```

---

## 5. Security Best Practices

### 5.1 XSS Prevention ✅

Angular sanitizes by default, but be careful:

```typescript
// ✅ SAFE - Angular sanitizes automatically
template: `<div>{{ userInput() }}</div>`

// ⚠️ DANGEROUS - Bypasses sanitization
template: `<div [innerHTML]="userInput()"></div>`

// ✅ SAFE - Explicit sanitization
import { DomSanitizer } from '@angular/platform-browser';

constructor() {
  const sanitizer = inject(DomSanitizer);
  const safe = sanitizer.sanitize(SecurityContext.HTML, userInput);
}
```

### 5.2 CSRF Protection ✅

Implement CSRF tokens:

```typescript
// auth.service.ts
generateCsrfToken(): string {
  return crypto.randomUUID();
}

// login.component.ts
csrfToken = signal(this.authService.generateCsrfToken());

template: `
  <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
    <input type="hidden" [value]="csrfToken()" />
    <!-- form fields -->
  </form>
`
```

### 5.3 Authentication Interceptor ✅

```typescript
// auth.interceptor.ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const user = authService.getUser();
  
  if (user?.accessToken) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${user.accessToken}`,
      },
    });
  }
  
  return next(req);
};
```

### 5.4 Route Guards ✅

```typescript
// auth.guard.ts
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (authService.isAuthenticated()) {
    return true;
  }
  
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};

// Usage in routes
{
  path: 'dashboard',
  canActivate: [authGuard],
  loadComponent: () => import('./dashboard.component'),
}
```

### 5.5 Environment Variables

**NEVER commit secrets**:

```typescript
// environment.ts (gitignored)
export const environment = {
  production: false,
  supabaseUrl: import.meta.env['VITE_SUPABASE_URL'],
  supabaseKey: import.meta.env['VITE_SUPABASE_ANON_KEY'],
};

// ✅ Use environment variables
// ❌ NEVER hardcode API keys
```

---

## 6. Code Organization

### 6.1 File Naming Conventions ✅

```
feature.component.ts       # Component class
feature.component.html     # Template (if external)
feature.component.scss     # Styles (component-scoped)
feature.service.ts         # Service
feature.models.ts          # TypeScript interfaces
feature.view-model.ts      # View model
feature.guard.ts           # Guard
feature.interceptor.ts     # Interceptor
feature.pipe.ts            # Pipe
feature.directive.ts       # Directive
```

### 6.2 Path Aliases ✅

Configure in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@core/*": ["app/core/*"],
      "@shared/*": ["app/shared/*"],
      "@features/*": ["app/features/*"],
      "@environments/*": ["environments/*"],
      "@assets/*": ["assets/*"]
    }
  }
}
```

**Usage**:

```typescript
// ✅ GOOD - Clean imports with aliases
import { AuthService } from '@core/services/auth.service';
import { Button } from '@shared/components/button';

// ❌ BAD - Relative path hell
import { AuthService } from '../../../core/services/auth.service';
```

### 6.3 Index Barrel Files

**Use sparingly** - avoid for performance:

```typescript
// ✅ GOOD - Direct imports (better tree-shaking)
import { AuthService } from '@core/services/auth.service';
import { ApiService } from '@core/services/api.service';

// ⚠️ ACCEPTABLE - Barrel for shared components
// shared/components/index.ts
export * from './button/button.component';
export * from './card/card.component';

// ❌ BAD - Barrel files hurt tree-shaking
// core/services/index.ts - avoid this
```

---

## 7. TypeScript Standards

### 7.1 Strict Mode ✅

**REQUIRED in tsconfig.json**:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noPropertyAccessFromIndexSignature": true,
    "strictTemplates": true
  }
}
```

### 7.2 Type Everything

**NEVER use `any`** - use proper types:

```typescript
// ❌ BAD
function processData(data: any): any { }

// ✅ GOOD
interface User {
  id: string;
  name: string;
  email: string;
}

function processData(data: User): User { }

// ✅ GOOD - Generic types
function processData<T extends BaseEntity>(data: T): T { }

// ✅ GOOD - Unknown for truly unknown types
function processData(data: unknown): void {
  if (isUser(data)) {
    // Type narrowing
    console.log(data.name);
  }
}
```

### 7.3 Interface Naming

```typescript
// ✅ GOOD - No 'I' prefix
interface User { }
interface ApiResponse<T> { }
type Status = 'pending' | 'approved' | 'rejected';

// ❌ BAD - Hungarian notation
interface IUser { }
```

### 7.4 Readonly Properties

Use readonly for immutability:

```typescript
interface User {
  readonly id: string;
  readonly createdAt: Date;
  name: string;  // mutable
}

class UserService {
  private readonly apiUrl = 'https://api.example.com';
  
  // Readonly signal exposure
  readonly users = this._users.asReadonly();
}
```

---

## 8. Testing Strategy

### 8.1 Test Structure

```typescript
// feature.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeatureComponent } from './feature.component';

describe('FeatureComponent', () => {
  let component: FeatureComponent;
  let fixture: ComponentFixture<FeatureComponent>;
  
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatureComponent],  // Standalone
    }).compileComponents();
    
    fixture = TestBed.createComponent(FeatureComponent);
    component = fixture.componentInstance;
  });
  
  it('should create', () => {
    expect(component).toBeTruthy();
  });
  
  it('should update count when increment is called', () => {
    component.increment();
    expect(component.count()).toBe(1);
  });
});
```

### 8.2 Service Testing

```typescript
// feature.service.spec.ts
describe('FeatureService', () => {
  let service: FeatureService;
  let httpMock: HttpTestingController;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FeatureService],
    });
    
    service = TestBed.inject(FeatureService);
    httpMock = TestBed.inject(HttpTestingController);
  });
  
  it('should fetch data', () => {
    const mockData = { id: '1', name: 'Test' };
    
    service.getData().subscribe(data => {
      expect(data).toEqual(mockData);
    });
    
    const req = httpMock.expectOne('/api/data');
    expect(req.request.method).toBe('GET');
    req.flush(mockData);
  });
  
  afterEach(() => {
    httpMock.verify();
  });
});
```

### 8.3 Test Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Critical user flows
- **E2E Tests**: Happy path + error scenarios

---

## 9. Accessibility (A11y)

### 9.1 Semantic HTML ✅

```typescript
template: `
  <header>
    <nav aria-label="Main navigation">
      <ul>
        <li><a href="/dashboard">Dashboard</a></li>
      </ul>
    </nav>
  </header>
  
  <main>
    <article>
      <h1>Page Title</h1>
      <section>Content</section>
    </article>
  </main>
  
  <footer>
    <p>&copy; 2025 FlagFit Pro</p>
  </footer>
`
```

### 9.2 ARIA Labels

```typescript
template: `
  <button 
    type="button"
    aria-label="Close dialog"
    (click)="close()"
  >
    <i class="pi pi-times" aria-hidden="true"></i>
  </button>
  
  <input 
    type="text"
    id="search"
    aria-describedby="search-help"
    aria-required="true"
  />
  <small id="search-help">Enter search term</small>
`
```

### 9.3 Keyboard Navigation

```typescript
@HostListener('keydown', ['$event'])
handleKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    this.close();
  }
  if (event.key === 'Enter') {
    this.submit();
  }
}
```

### 9.4 Focus Management

```typescript
export class DialogComponent implements AfterViewInit {
  @ViewChild('dialogContent') dialogContent!: ElementRef;
  
  ngAfterViewInit(): void {
    // Focus first element when dialog opens
    this.dialogContent.nativeElement.focus();
  }
}
```

### 9.5 Color Contrast

Ensure WCAG 2.1 AA compliance:

```scss
// ✅ GOOD - 4.5:1 contrast ratio
.text-primary {
  color: #1a1a1a;  // Dark text
  background: #ffffff;  // White background
}

// ❌ BAD - Insufficient contrast
.text-light {
  color: #cccccc;  // Light gray
  background: #ffffff;  // White background
}
```

---

## 10. PrimeNG Optimization

### 10.1 No Animation Module ✅

**PrimeNG v21 uses CSS animations** - don't import BrowserAnimationsModule:

```typescript
// ✅ CORRECT - No animation provider
export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    // ❌ REMOVED: provideAnimations()
  ],
};
```

**Benefits**:
- 80+ KB bundle savings
- Hardware-accelerated animations
- 60 FPS performance
- No JavaScript animation overhead

### 10.2 Tree-Shakeable Imports ✅

```typescript
// ✅ CORRECT - Direct imports
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';

@Component({
  imports: [ButtonModule, CardModule, TableModule],
})

// ❌ WRONG - Barrel imports (prevents tree-shaking)
import { Button, Card, Table } from 'primeng';
```

### 10.3 PrimeNG Theming

Use CSS custom properties:

```scss
// styles.scss
:root {
  // Brand colors
  --primary-color: #10b981;
  --primary-color-text: #ffffff;
  
  // Surface colors
  --surface-ground: #ffffff;
  --surface-section: #f8f9fa;
  
  // Text colors
  --text-color: #1a1a1a;
  --text-color-secondary: #6c757d;
  
  // Border
  --surface-border: #dee2e6;
}
```

### 10.4 Component-Specific Styling

```typescript
@Component({
  styles: [`
    :host ::ng-deep {
      .p-button {
        border-radius: 8px;
      }
      
      .p-card {
        box-shadow: var(--shadow-lg);
      }
    }
  `],
})
```

---

## 11. DRY Principles & Reusability

### 11.1 Shared Components ✅

Extract reusable UI patterns:

```typescript
// shared/components/page-header/page-header.component.ts
@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <div class="page-header">
      <div class="page-header-content">
        @if (icon()) {
          <i [class]="'pi pi-' + icon()"></i>
        }
        <div>
          <h1>{{ title() }}</h1>
          @if (subtitle()) {
            <p>{{ subtitle() }}</p>
          }
        </div>
      </div>
      <div class="page-header-actions">
        <ng-content />
      </div>
    </div>
  `,
})
export class PageHeaderComponent {
  title = input.required<string>();
  subtitle = input<string>();
  icon = input<string>();
}

// Usage
<app-page-header 
  title="Dashboard" 
  subtitle="Welcome back!"
  icon="home"
>
  <p-button label="Action" />
</app-page-header>
```

### 11.2 Utility Functions

Extract common logic:

```typescript
// shared/utils/form.utils.ts
export function getFormControlError(control: AbstractControl): string | null {
  if (!control.errors) return null;
  
  if (control.errors['required']) return 'This field is required';
  if (control.errors['email']) return 'Invalid email address';
  if (control.errors['minlength']) {
    return `Minimum length is ${control.errors['minlength'].requiredLength}`;
  }
  
  return 'Invalid value';
}

// Usage in component
emailError = computed(() => {
  const control = this.loginForm.get('email');
  return control?.touched ? getFormControlError(control) : null;
});
```

### 11.3 Base Classes for Common Patterns

```typescript
// core/components/realtime-base.component.ts
export abstract class RealtimeBaseComponent implements OnDestroy {
  protected supabaseService = inject(SupabaseService);
  protected destroyRef = inject(DestroyRef);
  protected subscription?: RealtimeChannel;
  
  protected subscribeToChanges(table: string, callback: (payload: any) => void): void {
    this.subscription = this.supabaseService
      .getClient()
      .channel(`${table}-changes`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
      .subscribe();
  }
  
  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}

// Usage
export class DashboardComponent extends RealtimeBaseComponent {
  ngOnInit(): void {
    this.subscribeToChanges('training_sessions', (payload) => {
      this.refresh();
    });
  }
}
```

### 11.4 Custom Pipes

Extract formatting logic:

```typescript
// shared/pipes/relative-time.pipe.ts
@Pipe({ name: 'relativeTime', standalone: true })
export class RelativeTimePipe implements PipeTransform {
  transform(value: Date): string {
    return formatDistanceToNow(value, { addSuffix: true });
  }
}

// Usage
<p>{{ session.createdAt | relativeTime }}</p>
// Output: "2 hours ago"
```

### 11.5 Configuration Constants

Centralize configuration:

```typescript
// core/config/chart-config.ts
export const DEFAULT_CHART_OPTIONS: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true, position: 'bottom' },
  },
};

// core/config/table-config.ts
export const DEFAULT_TABLE_CONFIG = {
  paginator: true,
  rows: 10,
  rowsPerPageOptions: [10, 25, 50],
  showCurrentPageReport: true,
};
```

---

## 12. Error Handling

### 12.1 Global Error Interceptor ✅

```typescript
// core/interceptors/error.interceptor.ts
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const messageService = inject(MessageService);
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An error occurred';
      
      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = error.error.message;
      } else {
        // Server-side error
        errorMessage = `Error ${error.status}: ${error.message}`;
      }
      
      messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: errorMessage,
      });
      
      return throwError(() => error);
    })
  );
};
```

### 12.2 Component-Level Error Handling

```typescript
export class FeatureComponent {
  loading = signal(false);
  error = signal<string | null>(null);
  
  async loadData(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    
    try {
      const data = await this.apiService.getData();
      this.data.set(data);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Unknown error');
      console.error('Failed to load data:', err);
    } finally {
      this.loading.set(false);
    }
  }
}

// Template
@if (error()) {
  <div class="error-message">
    <p>{{ error() }}</p>
    <p-button label="Retry" (click)="loadData()" />
  </div>
}
```

### 12.3 Form Validation Errors

```typescript
// Computed error signals
emailError = computed(() => {
  const control = this.form.get('email');
  if (!control || !control.touched) return null;
  return getFormControlError(control);
});

// Template
<input 
  pInputText 
  formControlName="email"
  [class.ng-invalid]="emailError()"
/>
@if (emailError()) {
  <small class="p-error">{{ emailError() }}</small>
}
```

---

## 13. API Integration

### 13.1 Service Pattern ✅

```typescript
// core/services/api.service.ts
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private supabase = inject(SupabaseService);
  
  async getTrainingSessions(): Promise<TrainingSession[]> {
    const { data, error } = await this.supabase
      .getClient()
      .from('training_sessions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
  
  async createTrainingSession(session: CreateTrainingSession): Promise<TrainingSession> {
    const { data, error } = await this.supabase
      .getClient()
      .from('training_sessions')
      .insert(session)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}
```

### 13.2 Request/Response Types

```typescript
// models/training.models.ts
export interface TrainingSession {
  id: string;
  athlete_id: string;
  session_type: string;
  duration_minutes: number;
  intensity: number;
  created_at: string;
}

export interface CreateTrainingSession {
  athlete_id: string;
  session_type: string;
  duration_minutes: number;
  intensity: number;
}

export interface UpdateTrainingSession {
  session_type?: string;
  duration_minutes?: number;
  intensity?: number;
}
```

### 13.3 Loading States

```typescript
export class FeatureComponent {
  // Separate loading states for different operations
  loadingData = signal(false);
  saving = signal(false);
  deleting = signal(false);
  
  // Overall loading computed signal
  isLoading = computed(() => 
    this.loadingData() || this.saving() || this.deleting()
  );
  
  async saveData(): Promise<void> {
    this.saving.set(true);
    try {
      await this.apiService.save(this.data());
    } finally {
      this.saving.set(false);
    }
  }
}
```

---

## 14. Build & Deployment

### 14.1 Production Build

```bash
# Build with production configuration
ng build --configuration production

# Analyze bundle size
ng build --configuration production --stats-json
npx webpack-bundle-analyzer dist/stats.json
```

### 14.2 Environment Configuration

```typescript
// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: import.meta.env['VITE_API_URL'],
  supabaseUrl: import.meta.env['VITE_SUPABASE_URL'],
  supabaseKey: import.meta.env['VITE_SUPABASE_ANON_KEY'],
};
```

### 14.3 SSR (Server-Side Rendering)

```typescript
// app.config.server.ts
export const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    // Add server-specific providers
  ],
};

// Build for SSR
ng build:ssr
```

### 14.4 Prerendering Static Routes

```json
// angular.json
{
  "prerender": {
    "options": {
      "routes": ["/", "/login", "/register"]
    }
  }
}
```

---

## 15. Quick Reference Checklist

### Component Checklist ✅

- [ ] `standalone: true`
- [ ] `changeDetection: ChangeDetectionStrategy.OnPush`
- [ ] Modern control flow (`@if`, `@for`, `@switch`)
- [ ] Signal-based state
- [ ] Track functions in `@for` loops
- [ ] Proper TypeScript types
- [ ] Accessibility attributes
- [ ] Error handling
- [ ] Loading states

### Service Checklist ✅

- [ ] `@Injectable({ providedIn: 'root' })`
- [ ] Signal-based state
- [ ] Readonly signal exposure
- [ ] Proper error handling
- [ ] TypeScript interfaces for all data

### Performance Checklist ✅

- [ ] OnPush change detection
- [ ] Lazy loading routes
- [ ] Track functions
- [ ] No unnecessary subscriptions
- [ ] Virtual scrolling for large lists
- [ ] Optimized images

### Security Checklist ✅

- [ ] CSRF tokens
- [ ] Authentication guards
- [ ] HTTP interceptors
- [ ] Input sanitization
- [ ] No secrets in code

---

## 16. Anti-Patterns to Avoid

### ❌ DON'T

```typescript
// ❌ Don't use 'any'
function process(data: any): any { }

// ❌ Don't use deprecated control flow
<div *ngIf="condition">

// ❌ Don't forget OnPush
@Component({
  // Missing: changeDetection: ChangeDetectionStrategy.OnPush
})

// ❌ Don't forget track functions
@for (item of items(); track ???) { }  // WRONG

// ❌ Don't use barrel imports for performance
import { ButtonModule } from 'primeng';  // WRONG

// ❌ Don't manually subscribe without cleanup
this.apiService.getData().subscribe();  // Memory leak

// ❌ Don't mutate signals
const count = signal(0);
count() = 5;  // WRONG - use count.set(5)
```

### ✅ DO

```typescript
// ✅ Use proper types
function process(data: User): User { }

// ✅ Use modern control flow
@if (condition) { }

// ✅ Always use OnPush
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
})

// ✅ Always provide track function
@for (item of items(); track item.id) { }

// ✅ Use direct imports
import { ButtonModule } from 'primeng/button';

// ✅ Use signals or takeUntilDestroyed
this.apiService.getData()
  .pipe(takeUntilDestroyed(this.destroyRef))
  .subscribe();

// ✅ Update signals properly
count.set(5);
count.update(v => v + 1);
```

---

## 17. Resources

### Official Documentation
- [Angular 21 Docs](https://angular.dev)
- [PrimeNG v21](https://primeng.org)
- [Angular Signals Guide](https://angular.dev/guide/signals)
- [Angular Performance](https://angular.dev/best-practices/runtime-performance)

### Tools
- [Angular DevTools](https://angular.dev/tools/devtools)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [axe DevTools](https://www.deque.com/axe/devtools/) (Accessibility)

### Community
- [Angular Blog](https://blog.angular.dev)
- [PrimeNG Community](https://github.com/primefaces/primeng)

---

## 📝 Summary

This guide establishes production-ready standards for Angular 21 + PrimeNG 21 development, emphasizing:

1. **Modern Angular 21 features**: Signals, zoneless, standalone components
2. **Performance**: OnPush, lazy loading, tree-shaking, bundle optimization
3. **Security**: Guards, interceptors, CSRF, XSS prevention
4. **Maintainability**: DRY principles, clear architecture, TypeScript strict mode
5. **Accessibility**: WCAG 2.1 compliance, semantic HTML, ARIA
6. **Code Quality**: Testing, linting, consistent patterns

**Follow these practices** to build scalable, performant, secure, and maintainable enterprise Angular applications.

---

**Document Version**: 1.0  
**Last Updated**: December 24, 2025  
**Maintained By**: FlagFit Pro Development Team

