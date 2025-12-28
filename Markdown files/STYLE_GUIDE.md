# Angular 21 Style Guide

**FlagFit Pro - Comprehensive Coding Standards and Best Practices**

_Updated: December 2025 - Angular 21 Edition_

---

## Table of Contents

1. [Overview](#overview)
2. [Code Formatting](#code-formatting)
3. [TypeScript Standards](#typescript-standards)
4. [Angular 21 Patterns](#angular-21-patterns)
5. [Component Guidelines](#component-guidelines)
6. [Service Guidelines](#service-guidelines)
7. [State Management](#state-management)
8. [File Organization](#file-organization)
9. [Naming Conventions](#naming-conventions)
10. [CSS/SCSS Guidelines](#scss-guidelines)
11. [Testing Standards](#testing-standards)
12. [Accessibility](#accessibility)
13. [Performance](#performance)
14. [Error Handling](#error-handling)
15. [Documentation](#documentation)

---

## Overview

This style guide establishes coding standards for the FlagFit Pro Angular 21 application. It ensures consistency, maintainability, and adherence to Angular 21 best practices.

### Key Principles

- **Angular 21 First**: Use modern Angular features (signals, standalone components, inject())
- **Type Safety**: Leverage TypeScript's strict mode
- **Consistency**: Follow established patterns across the codebase
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Optimize for runtime and bundle size
- **Maintainability**: Write code that's easy to understand and modify

---

## Code Formatting

### General Rules

- **Indentation**: 2 spaces (no tabs)
- **Line Length**: Maximum 120 characters
- **Quotes**: Use double quotes (`"`) for strings
- **Semicolons**: Always use semicolons
- **Trailing Commas**: Use in multi-line arrays, objects, and function parameters
- **Blank Lines**: Use to separate logical sections

### Example

```typescript
// ✅ CORRECT
import { Component, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-example",
  standalone: true,
  imports: [CommonModule],
})
export class ExampleComponent {
  count = signal(0);
  doubled = computed(() => this.count() * 2);
}

// ❌ INCORRECT
import { Component, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
@Component({
  selector: "app-example",
  standalone: true,
  imports: [CommonModule],
})
export class ExampleComponent {
  count = signal(0);
  doubled = computed(() => this.count() * 2);
}
```

---

## TypeScript Standards

### Type Safety

- **Strict Mode**: Always enabled (`strict: true` in tsconfig.json)
- **Explicit Types**: Use explicit types for function parameters and return values
- **Avoid `any`**: Use `unknown` or proper types instead
- **Type Guards**: Use type guards for runtime type checking

### Example

```typescript
// ✅ CORRECT
function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

interface CartItem {
  id: string;
  price: number;
  name: string;
}

// ❌ INCORRECT
function calculateTotal(items: any): any {
  return items.reduce((sum: any, item: any) => sum + item.price, 0);
}
```

### Type Definitions

- **Interfaces**: Use for object shapes and contracts
- **Types**: Use for unions, intersections, and aliases
- **Enums**: Use for fixed sets of constants

```typescript
// ✅ CORRECT
interface User {
  id: string;
  email: string;
  name: string;
}

type Status = "pending" | "active" | "inactive";

enum UserRole {
  ADMIN = "admin",
  USER = "user",
  COACH = "coach",
}

// ❌ INCORRECT
type User = {
  id: string;
  email: string;
};
```

---

## Angular 21 Patterns

### Standalone Components

**Always use standalone components** - No NgModules.

```typescript
// ✅ CORRECT
@Component({
  selector: "app-feature",
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `...`,
})
export class FeatureComponent {}

// ❌ INCORRECT
@NgModule({
  declarations: [FeatureComponent],
  imports: [CommonModule],
})
export class FeatureModule {}
```

### Dependency Injection

**Use `inject()` function** instead of constructor injection.

```typescript
// ✅ CORRECT
export class MyService {
  private apiService = inject(ApiService);
  private router = inject(Router);
  private http = inject(HttpClient);
}

// ❌ INCORRECT
export class MyService {
  constructor(
    private apiService: ApiService,
    private router: Router,
    private http: HttpClient,
  ) {}
}
```

### Signals

**Use signals for reactive state** - Prefer signals over RxJS for component state.

```typescript
// ✅ CORRECT
export class MyComponent {
  count = signal(0);
  doubled = computed(() => this.count() * 2);

  increment() {
    this.count.update((value) => value + 1);
  }
}

// ❌ INCORRECT
export class MyComponent {
  count$ = new BehaviorSubject(0);
  doubled$ = this.count$.pipe(map((count) => count * 2));
}
```

### Change Detection

**Use OnPush change detection** for better performance.

```typescript
// ✅ CORRECT
@Component({
  selector: "app-component",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyComponent {}

// ❌ INCORRECT
@Component({
  selector: "app-component",
  // Default change detection (less performant)
})
export class MyComponent {}
```

### Effects

**Use `effect()` for side effects** instead of subscriptions when possible.

```typescript
// ✅ CORRECT
export class MyComponent {
  count = signal(0);

  constructor() {
    effect(() => {
      console.log("Count changed:", this.count());
    });
  }
}

// ❌ INCORRECT
export class MyComponent {
  count = signal(0);

  ngOnInit() {
    // Manual subscription not needed with signals
  }
}
```

---

## Component Guidelines

### Component Structure

Components should follow this order:

1. Imports (Angular, then third-party, then local)
2. Component decorator
3. Class declaration
4. Properties (signals, inputs, outputs)
5. Constructor (if needed)
6. Lifecycle hooks
7. Public methods
8. Private methods

```typescript
// ✅ CORRECT
import { Component, Input, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CardModule } from "primeng/card";
import { MyService } from "../../services/my.service";

@Component({
  selector: "app-example",
  standalone: true,
  imports: [CommonModule, CardModule],
  template: `...`,
})
export class ExampleComponent {
  // Inputs
  @Input() title = "";

  // Signals
  count = signal(0);
  doubled = computed(() => this.count() * 2);

  // Services
  private myService = inject(MyService);

  // Methods
  increment() {
    this.count.update((v) => v + 1);
  }
}
```

### Component Templates

- **Use control flow syntax** (`@if`, `@for`, `@switch`) instead of structural directives
- **Use signals in templates** - Access signals with `()` syntax
- **Keep templates simple** - Move complex logic to component methods

```typescript
// ✅ CORRECT
template: `
  @if (isLoading()) {
    <div>Loading...</div>
  }
  
  @for (item of items(); track item.id) {
    <div>{{ item.name }}</div>
  }
  
  <button (click)="handleClick()">Click</button>
`;

// ❌ INCORRECT
template: `
  <div *ngIf="isLoading">Loading...</div>
  <div *ngFor="let item of items">{{ item.name }}</div>
  <button (click)="handleClick()">Click</button>
`;
```

### Input/Output Properties

- **Use `@Input()` and `@Output()`** decorators
- **Use signal inputs** when available (`input()`)
- **Provide default values** for optional inputs
- **Use EventEmitter** for outputs

```typescript
// ✅ CORRECT
export class MyComponent {
  @Input() title = "";
  @Input() count = 0;
  @Output() clicked = new EventEmitter<void>();

  // Angular 21 signal inputs (preferred)
  title = input<string>("");
  count = input<number>(0);
  clicked = output<void>();
}

// ❌ INCORRECT
export class MyComponent {
  title: string; // Missing @Input()
  count: number; // Missing @Input()
}
```

---

## Service Guidelines

### Service Structure

Services should follow this pattern:

```typescript
// ✅ CORRECT
@Injectable({
  providedIn: "root",
})
export class MyService {
  // Injected dependencies
  private http = inject(HttpClient);
  private router = inject(Router);

  // Signals for state
  private readonly _data = signal<Data | null>(null);
  readonly data = this._data.asReadonly();

  // Public methods
  loadData(): Observable<Data> {
    return this.http.get<Data>("/api/data").pipe(
      tap((data) => this._data.set(data)),
      catchError(this.handleError),
    );
  }

  // Private methods
  private handleError(error: any): Observable<never> {
    console.error("Error:", error);
    return throwError(() => error);
  }
}
```

### Service Best Practices

- **Use `providedIn: 'root'`** for singleton services
- **Use `inject()`** for dependencies
- **Expose readonly signals** for state
- **Return Observables** from data methods
- **Handle errors consistently**

---

## State Management

### Signals for Component State

**Use signals for component-local state:**

```typescript
// ✅ CORRECT
export class MyComponent {
  // State signals
  isLoading = signal(false);
  data = signal<Data[]>([]);
  error = signal<string | null>(null);

  // Computed signals
  hasData = computed(() => this.data().length > 0);
  isEmpty = computed(() => !this.hasData() && !this.isLoading());
}
```

### RxJS for Async Operations

**Use RxJS for async operations and data streams:**

```typescript
// ✅ CORRECT
export class MyComponent {
  private dataService = inject(DataService);

  loadData() {
    this.isLoading.set(true);
    this.dataService.getData().subscribe({
      next: (data) => {
        this.data.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        this.error.set(error.message);
        this.isLoading.set(false);
      },
    });
  }
}
```

### View Models Pattern

**Use ViewModels for complex component state:**

```typescript
// ✅ CORRECT
@Injectable()
export class DashboardViewModel extends BaseViewModel {
  private dataService = inject(DashboardDataService);

  // State signals
  readonly stats = signal<Stats[]>([]);
  readonly loading = signal(false);

  // Computed signals
  readonly totalStats = computed(() =>
    this.stats().reduce((sum, s) => sum + s.value, 0),
  );

  override initialize() {
    this.loadData();
  }

  private loadData() {
    this.loading.set(true);
    this.subscribe(this.dataService.getDashboard(), {
      next: (data) => {
        this.stats.set(data.stats);
        this.loading.set(false);
      },
      error: (err) => {
        this.handleError(err);
        this.loading.set(false);
      },
    });
  }
}
```

---

## File Organization

### Project Structure

```
angular/src/app/
├── core/                    # Core functionality
│   ├── services/            # Shared services
│   ├── guards/              # Route guards
│   ├── interceptors/         # HTTP interceptors
│   ├── models/               # Core models/interfaces
│   └── config/               # Configuration
├── shared/                   # Shared code
│   ├── components/           # Reusable components
│   ├── directives/           # Custom directives
│   ├── pipes/                # Custom pipes
│   ├── animations/           # Animation definitions
│   └── utils/                # Utility functions
├── features/                 # Feature modules
│   ├── dashboard/
│   ├── training/
│   └── analytics/
└── app.config.ts             # App configuration
```

### File Naming

- **Components**: `kebab-case.component.ts` (e.g., `user-profile.component.ts`)
- **Services**: `kebab-case.service.ts` (e.g., `user.service.ts`)
- **Guards**: `kebab-case.guard.ts` (e.g., `auth.guard.ts`)
- **Interfaces**: `kebab-case.interface.ts` (e.g., `user.interface.ts`)
- **Models**: `kebab-case.model.ts` (e.g., `user.model.ts`)
- **Utils**: `kebab-case.util.ts` (e.g., `date.util.ts`)

---

## Naming Conventions

### Classes

- **PascalCase** for class names
- **Suffix with type**: `Component`, `Service`, `Guard`, `Directive`, `Pipe`

```typescript
// ✅ CORRECT
export class UserProfileComponent {}
export class UserService {}
export class AuthGuard {}

// ❌ INCORRECT
export class userProfile {}
export class User {}
export class auth {}
```

### Variables and Properties

- **camelCase** for variables and properties
- **Descriptive names**: Avoid abbreviations

```typescript
// ✅ CORRECT
const userCount = 0;
const isLoading = false;
const userProfileData = {};

// ❌ INCORRECT
const uc = 0;
const ld = false;
const upd = {};
```

### Signals

- **camelCase** for signal names
- **No suffix needed** - signals are clear from context

```typescript
// ✅ CORRECT
count = signal(0);
isLoading = signal(false);
userData = signal<User | null>(null);

// ❌ INCORRECT
countSignal = signal(0);
isLoadingSignal = signal(false);
```

### Constants

- **UPPER_SNAKE_CASE** for constants

```typescript
// ✅ CORRECT
const MAX_RETRIES = 3;
const API_BASE_URL = "https://api.example.com";
const DEFAULT_TIMEOUT = 5000;

// ❌ INCORRECT
const maxRetries = 3;
const apiBaseUrl = "https://api.example.com";
```

### Private Members

- **Prefix with underscore** for private members (optional but recommended)

```typescript
// ✅ CORRECT
export class MyService {
  private _internalState = signal(0);
  private _privateMethod() {}
}

// Also acceptable (Angular style)
export class MyService {
  private internalState = signal(0);
  private privateMethod() {}
}
```

---

## SCSS Guidelines

### Design Tokens

**Always use design tokens** - Never hardcode values.

```scss
// ✅ CORRECT
.button {
  padding: var(--space-3) var(--space-6);
  color: var(--color-text-primary);
  background: var(--color-brand-primary);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
}

// ❌ INCORRECT
.button {
  padding: 12px 24px;
  color: #333333;
  background: #10c96b;
  border-radius: 4px;
  font-size: 16px;
}
```

### BEM Naming (Optional)

**Use BEM for component-specific styles:**

```scss
// ✅ CORRECT
.card {
  &__header {
    padding: var(--space-4);
  }

  &__body {
    padding: var(--space-6);
  }

  &__footer {
    padding: var(--space-4);
  }

  &--highlighted {
    border: 2px solid var(--color-brand-primary);
  }
}
```

### Component Styles

**Use component-scoped styles:**

```typescript
// ✅ CORRECT
@Component({
  selector: "app-example",
  styles: [`
    :host {
      display: block;
    }

    .container {
      padding: var(--space-4);
    }
  `],
})
```

### Responsive Design

**Use design system breakpoints:**

```scss
// ✅ CORRECT
.container {
  padding: var(--space-4);

  @media (min-width: 768px) {
    padding: var(--space-6);
  }

  @media (min-width: 1024px) {
    padding: var(--space-8);
  }
}
```

---

## Testing Standards

### Unit Tests

**Write unit tests for all services and utilities:**

```typescript
// ✅ CORRECT
describe("UserService", () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService],
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it("should load user data", () => {
    const mockUser = { id: "1", name: "Test" };

    service.loadUser("1").subscribe((user) => {
      expect(user).toEqual(mockUser);
    });

    const req = httpMock.expectOne("/api/users/1");
    expect(req.request.method).toBe("GET");
    req.flush(mockUser);
  });
});
```

### Component Tests

**Test component behavior, not implementation:**

```typescript
// ✅ CORRECT
describe("UserProfileComponent", () => {
  let component: UserProfileComponent;
  let fixture: ComponentFixture<UserProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserProfileComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UserProfileComponent);
    component = fixture.componentInstance;
  });

  it("should display user name", () => {
    component.user = { id: "1", name: "Test User" };
    fixture.detectChanges();

    const nameElement = fixture.nativeElement.querySelector(".user-name");
    expect(nameElement.textContent).toContain("Test User");
  });
});
```

---

## Accessibility

### ARIA Labels

**Always provide ARIA labels for interactive elements:**

```typescript
// ✅ CORRECT
<button
  (click)="handleClick()"
  [attr.aria-label]="'Close dialog'"
  aria-describedby="dialog-description"
>
  <i class="pi pi-times"></i>
</button>
```

### Keyboard Navigation

**Ensure all interactive elements are keyboard accessible:**

```typescript
// ✅ CORRECT
@HostListener("keydown.enter")
@HostListener("keydown.space")
handleKeydown(event: KeyboardEvent) {
  event.preventDefault();
  this.handleClick();
}
```

### Focus Management

**Manage focus appropriately:**

```typescript
// ✅ CORRECT
export class ModalComponent {
  private focusTrap = inject(FocusTrap);

  ngAfterViewInit() {
    this.focusTrap.focusInitialElement();
  }
}
```

---

## Performance

### OnPush Change Detection

**Always use OnPush for better performance:**

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
})
```

### Lazy Loading

**Lazy load feature modules:**

```typescript
// ✅ CORRECT
const routes: Routes = [
  {
    path: "dashboard",
    loadComponent: () => import("./features/dashboard/dashboard.component"),
  },
];
```

### TrackBy Functions

**Use trackBy for \*ngFor (if using legacy syntax):**

```typescript
// ✅ CORRECT
trackByUserId(index: number, user: User): string {
  return user.id;
}
```

---

## Error Handling

### Consistent Error Handling

**Handle errors consistently:**

```typescript
// ✅ CORRECT
export class MyService {
  loadData(): Observable<Data> {
    return this.http.get<Data>("/api/data").pipe(
      catchError((error) => {
        console.error("Failed to load data:", error);
        return throwError(() => new Error("Failed to load data"));
      }),
    );
  }
}
```

### User-Friendly Error Messages

**Provide user-friendly error messages:**

```typescript
// ✅ CORRECT
this.dataService.loadData().subscribe({
  next: (data) => this.data.set(data),
  error: (error) => {
    this.error.set("Unable to load data. Please try again later.");
    this.messageService.add({
      severity: "error",
      summary: "Error",
      detail: "Unable to load data.",
    });
  },
});
```

---

## Documentation

### JSDoc Comments

**Document public APIs:**

````typescript
// ✅ CORRECT
/**
 * User Service
 *
 * Provides user management functionality including
 * authentication, profile management, and user data retrieval.
 *
 * @example
 * ```typescript
 * const userService = inject(UserService);
 * const user = await userService.getCurrentUser();
 * ```
 */
@Injectable({
  providedIn: "root",
})
export class UserService {
  /**
   * Get the current authenticated user
   *
   * @returns Observable that emits the current user or null if not authenticated
   */
  getCurrentUser(): Observable<User | null> {
    // Implementation
  }
}
````

### Inline Comments

**Use comments to explain "why", not "what":**

```typescript
// ✅ CORRECT
// Use exponential backoff to prevent overwhelming the server
const delay = Math.pow(2, attempt) * 1000;

// ❌ INCORRECT
// Set delay to 2000
const delay = 2000;
```

---

## Quick Reference

### Checklist for New Components

- [ ] Standalone component
- [ ] Uses `inject()` for dependencies
- [ ] Uses signals for state
- [ ] OnPush change detection
- [ ] Proper file naming (`kebab-case.component.ts`)
- [ ] Uses design tokens in styles
- [ ] Includes ARIA labels
- [ ] Handles errors appropriately
- [ ] Includes JSDoc comments
- [ ] Unit tests written

### Checklist for New Services

- [ ] `providedIn: 'root'` (if singleton)
- [ ] Uses `inject()` for dependencies
- [ ] Exposes readonly signals for state
- [ ] Returns Observables from data methods
- [ ] Consistent error handling
- [ ] JSDoc comments
- [ ] Unit tests written

---

## Resources

- [Angular Style Guide](https://angular.io/guide/styleguide)
- [Angular 21 Documentation](https://angular.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Last Updated**: December 2025  
**Version**: 1.0.0  
**Angular Version**: 21.0+
