# Angular + PrimeNG Best Practices - Quick Reference
## Essential Patterns & Anti-Patterns

**Quick Reference Guide for FlagFit Pro Development**  
**Last Updated**: December 24, 2025

---

## 🚀 Component Checklist

### Every Component Must Have:

```typescript
@Component({
  selector: 'app-feature',
  standalone: true,                              // ✅ REQUIRED
  changeDetection: ChangeDetectionStrategy.OnPush, // ✅ REQUIRED
  imports: [/* only what you need */],
  template: `...` or templateUrl: '...',
})
export class FeatureComponent {
  // Use inject() for dependencies
  private service = inject(SomeService);
  
  // Use signals for state
  data = signal<Data[]>([]);
  loading = signal(false);
  
  // Use computed for derived state
  total = computed(() => this.data().length);
}
```

---

## ✅ DO's

### State Management
```typescript
// ✅ Use signals
count = signal(0);
count.update(v => v + 1);

// ✅ Computed for derived values
double = computed(() => this.count() * 2);

// ✅ Immutable updates
players.update(p => [...p, newPlayer]);
```

### Templates
```typescript
// ✅ Modern control flow
@if (loading()) { <p>Loading...</p> }
@for (item of items(); track item.id) { }
@switch (status()) { @case ('active') { } }

// ✅ Track functions always
@for (item of items(); track item.id) { }
```

### Performance
```typescript
// ✅ OnPush change detection
changeDetection: ChangeDetectionStrategy.OnPush

// ✅ Lazy loading
loadComponent: () => import('./feature.component')

// ✅ Direct imports (tree-shakeable)
import { ButtonModule } from 'primeng/button';
```

### TypeScript
```typescript
// ✅ Strict types
interface User { id: string; name: string; }
function process(user: User): User { }

// ✅ Readonly for immutability
readonly users = this._users.asReadonly();
```

### Memory Management
```typescript
// ✅ Auto-cleanup with DestroyRef
private destroyRef = inject(DestroyRef);
observable$.pipe(takeUntilDestroyed(this.destroyRef))

// ✅ Signals auto-cleanup
effect(() => console.log(this.data()));
```

---

## ❌ DON'Ts

### Anti-Patterns
```typescript
// ❌ No 'any' types
function process(data: any): any { }  // WRONG

// ❌ No deprecated syntax
<div *ngIf="show">  // WRONG - use @if

// ❌ No mutations
this.array().push(item);  // WRONG
// Use: this.array.update(a => [...a, item])

// ❌ No barrel imports
import { Button } from 'primeng';  // WRONG
// Use: import { ButtonModule } from 'primeng/button';

// ❌ No missing track functions
@for (item of items(); track ???)  // WRONG

// ❌ No unmanaged subscriptions
this.service.get().subscribe();  // Memory leak!
```

---

## 🎨 Component Patterns

### Smart Component (Container)
```typescript
@Component({
  selector: 'app-dashboard',
  template: `
    <app-stats-grid [stats]="stats()" />
    <app-chart [data]="chartData()" />
  `,
})
export class DashboardComponent {
  private viewModel = inject(DashboardViewModel);
  
  stats = this.viewModel.stats;
  chartData = this.viewModel.chartData;
  
  ngOnInit(): void {
    this.viewModel.initialize();
  }
}
```

### Presentational Component (Dumb)
```typescript
@Component({
  selector: 'app-stats-grid',
  template: `
    @for (stat of stats(); track stat.id) {
      <p-card>{{ stat.label }}: {{ stat.value }}</p-card>
    }
  `,
})
export class StatsGridComponent {
  stats = input.required<Stat[]>();
}
```

---

## 🔧 Common Utilities

### Form Validation
```typescript
emailError = computed(() => {
  const control = this.form.get('email');
  if (!control?.touched) return null;
  if (control.errors?.['required']) return 'Required';
  if (control.errors?.['email']) return 'Invalid email';
  return null;
});
```

### Loading States
```typescript
loading = signal(false);
error = signal<string | null>(null);

async loadData(): Promise<void> {
  this.loading.set(true);
  this.error.set(null);
  try {
    const data = await this.api.getData();
    this.data.set(data);
  } catch (err) {
    this.error.set(err.message);
  } finally {
    this.loading.set(false);
  }
}
```

### Track Functions
```typescript
// With unique ID
@for (item of items(); track item.id) { }

// With index fallback
@for (item of items(); track $index) { }

// In component
trackById = (index: number, item: { id: string }) => item.id;
```

---

## 📦 PrimeNG Optimization

### Import Pattern
```typescript
// ✅ CORRECT - Direct imports
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';

@Component({
  imports: [ButtonModule, CardModule, TableModule],
})
```

### No Animation Module
```typescript
// ✅ CORRECT - PrimeNG v21 uses CSS animations
export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    // ❌ REMOVED: provideAnimations()
  ],
};
```

---

## 🚦 Route Configuration

### Lazy Loading
```typescript
export const routes: Routes = [
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./dashboard/dashboard.component')
        .then(m => m.DashboardComponent),
  },
];
```

### With Resolver
```typescript
{
  path: 'analytics',
  resolve: { data: analyticsPrefetchResolver },
  loadComponent: () => import('./analytics.component'),
}
```

---

## 🔒 Security Essentials

### Auth Guard
```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  
  return auth.isAuthenticated() 
    ? true 
    : router.createUrlTree(['/login']);
};
```

### Auth Interceptor
```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();
  
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }
  
  return next(req);
};
```

---

## 📊 Performance Tips

### 1. Virtual Scrolling (1000+ items)
```typescript
<cdk-virtual-scroll-viewport itemSize="50">
  @for (item of items(); track item.id) {
    <div>{{ item.name }}</div>
  }
</cdk-virtual-scroll-viewport>
```

### 2. Debounce Search
```typescript
searchTerm = signal('');
debouncedSearch = computed(() => {
  const term = this.searchTerm();
  // Debounce with rxjs in effect
  return term;
});
```

### 3. Defer Loading
```typescript
@defer (on viewport) {
  <app-heavy-component />
} @placeholder {
  <div>Loading...</div>
}
```

### 4. Memoization
```typescript
// ✅ Computed automatically memoizes
expensive = computed(() => {
  return heavyCalculation(this.data());
});
```

---

## 🧪 Testing Pattern

```typescript
describe('FeatureComponent', () => {
  let component: FeatureComponent;
  let fixture: ComponentFixture<FeatureComponent>;
  
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatureComponent],
    }).compileComponents();
    
    fixture = TestBed.createComponent(FeatureComponent);
    component = fixture.componentInstance;
  });
  
  it('should update signal', () => {
    component.count.set(5);
    expect(component.count()).toBe(5);
  });
});
```

---

## 🎯 Accessibility Quick Checks

```typescript
template: `
  <!-- ✅ Semantic HTML -->
  <button type="button" aria-label="Close">
    <i class="pi pi-times" aria-hidden="true"></i>
  </button>
  
  <!-- ✅ Form labels -->
  <label for="email">Email</label>
  <input id="email" type="email" />
  
  <!-- ✅ Keyboard support -->
  <div role="button" tabindex="0" (keydown.enter)="action()">
    Click me
  </div>
`
```

---

## 📏 Bundle Size Targets

| Type | Warning | Error |
|------|---------|-------|
| Initial Bundle | 700KB | 1MB |
| Component Style | 5KB | 8KB |
| Lazy Chunk | - | 200KB |

### Check Bundle Size
```bash
ng build --stats-json
npx webpack-bundle-analyzer dist/stats.json
```

---

## 🔍 Code Review Checklist

Before submitting PR, verify:

- [ ] `standalone: true` on all components
- [ ] `changeDetection: ChangeDetectionStrategy.OnPush`
- [ ] Modern control flow (`@if`, `@for`, `@switch`)
- [ ] Track functions in all `@for` loops
- [ ] Signals for reactive state
- [ ] No `any` types (strict TypeScript)
- [ ] No memory leaks (proper cleanup)
- [ ] Accessibility attributes
- [ ] Error handling implemented
- [ ] Loading states shown
- [ ] Tests written
- [ ] No console.log in production code
- [ ] Direct PrimeNG imports (no barrels)

---

## 🆘 Common Issues & Solutions

### Issue: Change detection not working
**Solution**: Ensure OnPush + update references, not mutate

### Issue: Memory leak
**Solution**: Use `takeUntilDestroyed(this.destroyRef)`

### Issue: Slow list rendering
**Solution**: Add track function, consider virtual scrolling

### Issue: Large bundle size
**Solution**: Lazy load routes, use direct imports, dynamic imports

### Issue: Component not updating
**Solution**: Use signals, ensure OnPush + immutable updates

---

## 📚 Full Documentation

For comprehensive guides, see:
- **[ANGULAR_PRIMENG_BEST_PRACTICES_GUIDE.md](./ANGULAR_PRIMENG_BEST_PRACTICES_GUIDE.md)** - Complete architecture guide
- **[FRONTEND_PERFORMANCE_MAINTAINABILITY_GUIDE.md](./FRONTEND_PERFORMANCE_MAINTAINABILITY_GUIDE.md)** - Advanced patterns

---

## 🎓 Learning Resources

- [Angular Official Docs](https://angular.dev)
- [PrimeNG Documentation](https://primeng.org)
- [Angular Signals Guide](https://angular.dev/guide/signals)
- [Performance Best Practices](https://web.dev/angular/)

---

**Print this and keep it next to your monitor! 🖨️**

---

**Version**: 1.0  
**Last Updated**: December 24, 2025

