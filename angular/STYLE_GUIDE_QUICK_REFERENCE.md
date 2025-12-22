# Style Guide Quick Reference

**FlagFit Pro - Angular 21 Coding Standards Quick Reference**

---

## Code Formatting

```typescript
// ✅ CORRECT
import { Component, signal } from "@angular/core";
const name = "FlagFit Pro";
const items = [1, 2, 3];

// ❌ INCORRECT
import {Component,signal} from '@angular/core'
const name='FlagFit Pro'
const items=[1,2,3]
```

---

## Dependency Injection

```typescript
// ✅ CORRECT - Use inject()
export class MyService {
  private apiService = inject(ApiService);
  private router = inject(Router);
}

// ❌ INCORRECT - Constructor injection
export class MyService {
  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}
}
```

---

## Signals

```typescript
// ✅ CORRECT
export class MyComponent {
  count = signal(0);
  doubled = computed(() => this.count() * 2);
  
  increment() {
    this.count.update(v => v + 1);
  }
}

// ❌ INCORRECT - RxJS for simple state
export class MyComponent {
  count$ = new BehaviorSubject(0);
}
```

---

## Component Structure

```typescript
// ✅ CORRECT
@Component({
  selector: "app-example",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `...`,
})
export class ExampleComponent {
  // 1. Inputs
  @Input() title = "";
  
  // 2. Signals
  count = signal(0);
  
  // 3. Services
  private service = inject(MyService);
  
  // 4. Methods
  handleClick() {}
}
```

---

## Template Syntax

```typescript
// ✅ CORRECT - Control flow
@if (isLoading()) {
  <div>Loading...</div>
}

@for (item of items(); track item.id) {
  <div>{{ item.name }}</div>
}

// ❌ INCORRECT - Structural directives
<div *ngIf="isLoading">Loading...</div>
<div *ngFor="let item of items">{{ item.name }}</div>
```

---

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Classes | PascalCase | `UserProfileComponent` |
| Variables | camelCase | `userCount`, `isLoading` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES`, `API_URL` |
| Files | kebab-case | `user-profile.component.ts` |
| Services | camelCase + Service | `UserService` |

---

## File Organization

```
angular/src/app/
├── core/              # Core services, guards, interceptors
├── shared/            # Shared components, directives, pipes
├── features/          # Feature modules
└── app.config.ts      # App configuration
```

---

## SCSS Guidelines

```scss
// ✅ CORRECT - Use design tokens
.button {
  padding: var(--space-3) var(--space-6);
  color: var(--color-text-primary);
  background: var(--color-brand-primary);
}

// ❌ INCORRECT - Hardcoded values
.button {
  padding: 12px 24px;
  color: #333;
  background: #10c96b;
}
```

---

## Error Handling

```typescript
// ✅ CORRECT
this.dataService.loadData().subscribe({
  next: (data) => this.data.set(data),
  error: (error) => {
    this.error.set("Unable to load data.");
    return throwError(() => error);
  },
});
```

---

## Testing

```typescript
// ✅ CORRECT
describe("MyService", () => {
  let service: MyService;
  
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MyService],
    });
    service = TestBed.inject(MyService);
  });
  
  it("should work", () => {
    expect(service).toBeTruthy();
  });
});
```

---

## Accessibility

```typescript
// ✅ CORRECT
<button 
  (click)="handleClick()"
  [attr.aria-label]="'Close dialog'"
>
  <i class="pi pi-times"></i>
</button>
```

---

## Performance

```typescript
// ✅ CORRECT
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
})
```

---

## Quick Checklist

### New Component
- [ ] Standalone component
- [ ] Uses `inject()` for dependencies
- [ ] Uses signals for state
- [ ] OnPush change detection
- [ ] Proper file naming
- [ ] Uses design tokens
- [ ] ARIA labels included
- [ ] Error handling
- [ ] Unit tests

### New Service
- [ ] `providedIn: 'root'` (if singleton)
- [ ] Uses `inject()` for dependencies
- [ ] Exposes readonly signals
- [ ] Returns Observables
- [ ] Error handling
- [ ] Unit tests

---

**See [STYLE_GUIDE.md](./STYLE_GUIDE.md) for complete documentation.**

