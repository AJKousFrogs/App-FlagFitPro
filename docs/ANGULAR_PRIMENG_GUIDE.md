# Angular 21 + PrimeNG 21 Best Practices Guide

**Version:** 2.0  
**Last Updated:** 29. December 2025  
**Status:** ✅ Production Implementation

This guide consolidates all Angular 21 and PrimeNG 21 best practices implemented in FlagFit Pro.

---

## 📋 Table of Contents

1. [Technology Stack](#technology-stack)
2. [Angular 21 Features](#angular-21-features)
3. [PrimeNG 21 Integration](#primeng-21-integration)
4. [Signal-Based State Management](#signal-based-state-management)
5. [Component Patterns](#component-patterns)
6. [Service Patterns](#service-patterns)
7. [Design System](#design-system)
8. [Performance Optimizations](#performance-optimizations)

---

## 🛠 Technology Stack

### Core Dependencies

```json
{
  "dependencies": {
    "@angular/core": "^21.0.6",
    "@angular/common": "^21.0.6",
    "@angular/router": "^21.0.6",
    "@angular/forms": "^21.0.6",
    "primeng": "^21.0.2",
    "primeicons": "^7.0.0",
    "@supabase/supabase-js": "^2.88.0",
    "rxjs": "~7.8.2",
    "chart.js": "^4.5.1"
  }
}
```

### Key Features Used

| Feature | Angular Version | Status |
|---------|-----------------|--------|
| Signals | 17+ | ✅ Throughout |
| Standalone Components | 14+ | ✅ All components |
| Zoneless Change Detection | 21 | ✅ Enabled |
| `inject()` function | 14+ | ✅ All services |
| Control Flow (`@if`, `@for`) | 17+ | ✅ All templates |
| Signal-based Forms | 21 | ✅ Available |

---

## 🅰️ Angular 21 Features

### 1. Zoneless Change Detection

**Configuration** (`app.config.ts`):

```typescript
import { provideZonelessChangeDetection } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(), // No Zone.js overhead
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
  ],
};
```

**Benefits:**
- Smaller bundle (no zone.js)
- Better performance
- Predictable change detection with signals

### 2. Signals Throughout

**Component Example:**

```typescript
@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private dashboardService = inject(DashboardDataService);
  
  // State signals
  stats = signal<Stat[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  
  // Computed signals (derived state)
  totalStats = computed(() => 
    this.stats().reduce((sum, s) => sum + s.value, 0)
  );
  
  // Effects (side effects)
  constructor() {
    effect(() => {
      if (this.error()) {
        console.error('Dashboard error:', this.error());
      }
    });
  }
}
```

### 3. Modern Control Flow

**Template Syntax:**

```html
<!-- @if instead of *ngIf -->
@if (loading()) {
  <p-progressSpinner />
} @else if (error()) {
  <p-message severity="error" [text]="error()" />
} @else {
  <div class="content">
    <!-- @for instead of *ngFor -->
    @for (stat of stats(); track stat.id) {
      <app-stat-card [stat]="stat" />
    } @empty {
      <p>No statistics available</p>
    }
  </div>
}

<!-- @switch instead of *ngSwitch -->
@switch (riskZone().level) {
  @case ('sweet-spot') {
    <span class="badge success">Optimal</span>
  }
  @case ('danger-zone') {
    <span class="badge danger">High Risk</span>
  }
  @default {
    <span class="badge">Unknown</span>
  }
}
```

### 4. Functional Dependency Injection

```typescript
// ✅ Modern: inject() function
export class MyComponent {
  private service = inject(MyService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
}

// ❌ Legacy: Constructor injection
export class MyComponent {
  constructor(
    private service: MyService,
    private router: Router
  ) {}
}
```

### 5. Route Input Binding

**Route Configuration:**

```typescript
export const routes: Routes = [
  {
    path: 'user/:id',
    component: UserComponent,
    // Enables route params as component inputs
  },
];

// app.config.ts
provideRouter(routes, withComponentInputBinding())
```

**Component:**

```typescript
@Component({...})
export class UserComponent {
  // Route param automatically bound
  id = input.required<string>();
  
  // Query params
  tab = input<string>('overview');
}
```

---

## 🎨 PrimeNG 21 Integration

### Key Changes in PrimeNG 21

1. **No `provideAnimations()`** - PrimeNG 21 uses native CSS animations
2. **80+ KB bundle savings** from removing @angular/animations
3. **Hardware-accelerated animations** via CSS

### Configuration

```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    // Note: NO provideAnimations() needed
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([...])),
    MessageService, // For p-toast
  ],
};
```

### Component Imports (Tree-Shakeable)

```typescript
// ✅ Correct: Individual imports
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';

@Component({
  imports: [ButtonModule, CardModule, TableModule],
})
export class MyComponent {}

// ❌ Wrong: Barrel imports (not tree-shakeable)
import { ButtonModule, CardModule } from 'primeng';
```

### Common PrimeNG Components Used

| Component | Import | Usage |
|-----------|--------|-------|
| Button | `ButtonModule` | Actions, navigation |
| Card | `CardModule` | Content containers |
| Table | `TableModule` | Data display |
| Chart | `ChartModule` | Visualizations |
| Toast | `ToastModule` | Notifications |
| Dialog | `DialogModule` | Modals |
| InputText | `InputTextModule` | Form inputs |
| Dropdown | `DropdownModule` | Select inputs |
| ProgressSpinner | `ProgressSpinnerModule` | Loading states |
| Message | `MessageModule` | Inline messages |
| Tag | `TagModule` | Status badges |

### Toast Service Pattern

```typescript
// Service
@Injectable({ providedIn: 'root' })
export class ToastService {
  private messageService = inject(MessageService);
  
  success(message: string, title = 'Success') {
    this.messageService.add({
      severity: 'success',
      summary: title,
      detail: message,
      life: 3000,
    });
  }
  
  error(message: string, title = 'Error') {
    this.messageService.add({
      severity: 'error',
      summary: title,
      detail: message,
      life: 5000,
    });
  }
}

// Component template (in app.component.ts)
<p-toast />
```

---

## 📊 Signal-Based State Management

### Why Signals (Not NgRx)

FlagFit Pro uses **Angular Signals** instead of NgRx because:

1. **Simpler**: No actions, reducers, effects boilerplate
2. **Built-in**: Native Angular feature, no extra dependencies
3. **Performance**: Fine-grained reactivity
4. **Sufficient**: App complexity doesn't require NgRx

### Service State Pattern

```typescript
@Injectable({ providedIn: 'root' })
export class NotificationStateService {
  private apiService = inject(ApiService);
  
  // Private writable signals
  private readonly _notifications = signal<Notification[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  
  // Public readonly signals
  readonly notifications = this._notifications.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  
  // Computed signals (derived state)
  readonly unreadCount = computed(() => 
    this._notifications().filter(n => !n.read).length
  );
  
  readonly unreadNotifications = computed(() =>
    this._notifications().filter(n => !n.read)
  );
  
  // Combined state for components
  readonly state = computed<NotificationState>(() => ({
    notifications: this._notifications(),
    unreadCount: this.unreadCount(),
    loading: this._loading(),
    error: this._error(),
  }));
  
  // Actions
  async loadNotifications() {
    this._loading.set(true);
    this._error.set(null);
    
    try {
      const response = await firstValueFrom(
        this.apiService.get<Notification[]>('/api/notifications')
      );
      this._notifications.set(response.data ?? []);
    } catch (error) {
      this._error.set('Failed to load notifications');
    } finally {
      this._loading.set(false);
    }
  }
  
  markAsRead(id: string) {
    this._notifications.update(notifications =>
      notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      )
    );
  }
}
```

### ViewModel Pattern

For complex components, use ViewModels:

```typescript
@Injectable()
export abstract class BaseViewModel {
  protected destroyRef = inject(DestroyRef);
  protected logger = inject(LoggerService);
  
  // Common state
  loading = signal(false);
  error = signal<string | null>(null);
  
  // RxJS → Signal bridge
  protected subscribe<T>(
    observable: Observable<T>,
    callbacks: {
      next?: (value: T) => void;
      error?: (error: unknown) => void;
      complete?: () => void;
    } = {}
  ): void {
    this.loading.set(true);
    
    observable.pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: callbacks.next,
      error: (err) => {
        this.handleError(err);
        callbacks.error?.(err);
      },
      complete: callbacks.complete,
    });
  }
  
  protected handleError(error: unknown): void {
    const message = error instanceof Error ? error.message : 'An error occurred';
    this.error.set(message);
    this.logger.error('[ViewModel Error]', error);
  }
}

// Usage
@Injectable()
export class DashboardViewModel extends BaseViewModel {
  private dashboardService = inject(DashboardDataService);
  
  stats = signal<Stat[]>([]);
  
  loadDashboard() {
    this.subscribe(
      this.dashboardService.getDashboard(),
      {
        next: (data) => this.stats.set(data.stats),
      }
    );
  }
}
```

---

## 🧩 Component Patterns

### Standard Component Structure

```typescript
import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

interface ComponentData {
  id: string;
  name: string;
}

@Component({
  selector: 'app-my-feature',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, CardModule, ButtonModule],
  template: `
    <p-card header="My Feature">
      @if (loading()) {
        <p-progressSpinner />
      } @else {
        @for (item of items(); track item.id) {
          <div class="item">{{ item.name }}</div>
        }
      }
      
      <ng-template pTemplate="footer">
        <p-button label="Action" (onClick)="handleAction()" />
      </ng-template>
    </p-card>
  `,
  styles: [`
    .item {
      padding: var(--spacing-8);
      border-bottom: 1px solid var(--border-color);
    }
  `]
})
export class MyFeatureComponent {
  private myService = inject(MyService);
  
  // State
  items = signal<ComponentData[]>([]);
  loading = signal(false);
  
  // Computed
  itemCount = computed(() => this.items().length);
  
  // Methods
  handleAction() {
    // Implementation
  }
}
```

### Form Component Pattern

```typescript
@Component({
  selector: 'app-my-form',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <div class="field">
        <label for="name">Name</label>
        <input pInputText id="name" formControlName="name" />
        @if (form.controls.name.errors?.['required'] && form.controls.name.touched) {
          <small class="p-error">Name is required</small>
        }
      </div>
      
      <p-button 
        type="submit" 
        label="Submit" 
        [loading]="submitting()"
        [disabled]="form.invalid" 
      />
    </form>
  `
})
export class MyFormComponent {
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);
  
  submitting = signal(false);
  
  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
  });
  
  async onSubmit() {
    if (this.form.invalid) return;
    
    this.submitting.set(true);
    try {
      await this.submitData(this.form.value);
      this.toastService.success('Saved successfully');
    } catch (error) {
      this.toastService.error('Failed to save');
    } finally {
      this.submitting.set(false);
    }
  }
}
```

---

## 🎨 Design System

### Design Tokens

Located in `angular/src/app/shared/models/design-tokens.ts`:

```typescript
export const DESIGN_TOKENS = {
  colors: {
    brand: {
      primary: '#089949',
      secondary: '#10c96b',
      accent: '#FFD700',
    },
    status: {
      success: '#22c55e',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#6b7280',
      muted: '#9ca3af',
    },
    surface: {
      background: '#ffffff',
      card: '#f9fafb',
      elevated: '#ffffff',
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  typography: {
    fontFamily: "'Poppins', sans-serif",
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
    },
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px',
  },
};
```

### CSS Custom Properties

```scss
// styles.scss
:root {
  // Colors
  --color-primary: #089949;
  --color-secondary: #10c96b;
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  
  // Text
  --text-primary: #1a1a1a;
  --text-secondary: #6b7280;
  
  // Spacing
  --spacing-4: 4px;
  --spacing-8: 8px;
  --spacing-16: 16px;
  --spacing-24: 24px;
  
  // Typography
  --font-family: 'Poppins', sans-serif;
  
  // Borders
  --border-color: #e5e7eb;
  --border-radius: 8px;
}
```

---

## ⚡ Performance Optimizations

### 1. Lazy Loading Routes

```typescript
export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component')
      .then(m => m.DashboardComponent),
    canActivate: [authGuard],
  },
  {
    path: 'training',
    loadChildren: () => import('./features/training/training.routes')
      .then(m => m.TRAINING_ROUTES),
  },
];
```

### 2. OnPush Change Detection

All components use `OnPush`:

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
})
```

### 3. Track Functions in @for

```html
@for (item of items(); track item.id) {
  <app-item [data]="item" />
}
```

### 4. Computed Signals for Derived State

```typescript
// ✅ Good: Computed signal (cached, only recalculates when dependencies change)
readonly filteredItems = computed(() =>
  this.items().filter(i => i.active)
);

// ❌ Bad: Method call in template (recalculates every change detection)
getFilteredItems() {
  return this.items().filter(i => i.active);
}
```

### 5. Bundle Size Targets

Configured in `angular.json`:

```json
{
  "budgets": [
    {
      "type": "initial",
      "maximumWarning": "500kb",
      "maximumError": "1mb"
    },
    {
      "type": "anyComponentStyle",
      "maximumWarning": "4kb",
      "maximumError": "8kb"
    }
  ]
}
```

---

## ✅ Implementation Checklist

### Angular 21 Features

- [x] Zoneless change detection enabled
- [x] Signals used throughout (`signal()`, `computed()`, `effect()`)
- [x] Modern control flow (`@if`, `@for`, `@switch`)
- [x] `inject()` function for DI
- [x] Standalone components (no NgModules)
- [x] OnPush change detection
- [x] Route input binding
- [x] Lazy loading routes

### PrimeNG 21

- [x] No `provideAnimations()` (uses CSS animations)
- [x] Individual component imports (tree-shakeable)
- [x] MessageService for toasts
- [x] Design tokens integrated

### State Management

- [x] Signal-based services
- [x] Computed signals for derived state
- [x] ViewModel pattern for complex components
- [x] RxJS for async operations only

### Performance

- [x] Lazy loading enabled
- [x] OnPush everywhere
- [x] Track functions in loops
- [x] Bundle budgets configured

---

## 📚 Related Documentation

- [angular/README.md](angular/README.md) - Angular app documentation
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - System architecture
- [docs/UTILITIES.md](docs/UTILITIES.md) - Services API reference

---

**Last Updated:** 29. December 2025

