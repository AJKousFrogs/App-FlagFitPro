# Angular 21 Quick Reference Card

## 🚀 Modern Features at a Glance

### Signals

```typescript
// Create signal
count = signal(0);

// Read signal
const value = count();

// Update signal
count.set(10);
count.update((n) => n + 1);

// Computed signal
double = computed(() => count() * 2);

// Effect (side effects)
effect(() => console.log("Count:", count()));
```

### Zoneless Change Detection

- ✅ Enabled in `app.config.ts`
- No Zone.js needed
- Automatic change detection on signal updates
- Events trigger change detection automatically

### Standalone Components

```typescript
@Component({
  standalone: true,  // ✅ Always true
  imports: [CommonModule, ...],
  // ...
})
```

### SSR Commands

```bash
# Build SSR
npm run build:ssr

# Serve SSR
npm run start:ssr

# Prerender
npm run build:prerender
```

### ESBuild

- ✅ Enabled by default
- No configuration needed
- Faster builds automatically

## 📋 Migration Patterns

### RxJS → Signals

```typescript
// Before (RxJS)
private data$ = new BehaviorSubject<Data[]>([]);
data$ = this.data$.asObservable();

// After (Signals)
data = signal<Data[]>([]);
```

### Observable → Signal

```typescript
import { toSignal } from "@angular/core/rxjs-interop";

// Convert Observable to Signal
data = toSignal(this.apiService.getData(), { initialValue: [] });
```

### OnInit → Constructor/Effect

```typescript
// Before
ngOnInit() {
  this.loadData();
}

// After (Zoneless)
constructor() {
  effect(() => {
    this.loadData();
  });
}
```

## 🎯 Best Practices

1. **Use signals for component state**
2. **Use computed for derived state**
3. **Use effect for side effects**
4. **Avoid manual change detection** (`ChangeDetectorRef`)
5. **Use `OnPush` strategy** (optional but recommended)

## 📚 Full Documentation

See `ANGULAR_21_MODERN_FEATURES.md` for complete details.
