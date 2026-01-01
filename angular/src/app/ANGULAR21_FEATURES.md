# Angular 21 Features Implementation

This document tracks the Angular 21 features implemented in FlagFit Pro.

## ✅ Implemented Features

### 1. Routes for Previously Orphaned Components

Added routes for 8 components that were implemented but not accessible:

| Route                     | Component                         | Purpose                        |
| ------------------------- | --------------------------------- | ------------------------------ |
| `/training/ai-companion`  | `AITrainingCompanionComponent`    | AI-powered training assistance |
| `/training/load-analysis` | `FlagLoadComponent`               | ACWR load analysis display     |
| `/training/goal-planner`  | `GoalBasedPlannerComponent`       | Goal-based training planning   |
| `/training/microcycle`    | `MicrocyclePlannerComponent`      | Weekly microcycle planning     |
| `/training/import`        | `ImportDatasetComponent`          | Training data import           |
| `/training/periodization` | `PeriodizationDashboardComponent` | Periodization management       |
| `/game-tracker/live`      | `LiveGameTrackerComponent`        | Real-time game tracking        |
| `/coach/activity`         | `CoachActivityFeedComponent`      | Coach activity feed            |

### 2. Angular Resource API (`ResourceService`)

**Location:** `core/services/resource.service.ts`

Declarative data fetching using Angular's new `resource()` API:

```typescript
// Create a resource
const userResource = resourceService.createResource<User>(
  () => `/api/users/${userId()}`,
  { cacheKey: 'user' }
);

// Use in template
@if (userResource.isLoading()) {
  <app-skeleton />
} @else {
  <div>{{ userResource.value()?.name }}</div>
}
```

Features:

- Automatic loading/error states
- Signal-based reactivity
- Built-in caching
- Paginated resources
- Mutation resources for POST/PUT/DELETE

### 3. Angular Aria Components

**Location:** `shared/components/aria/`

Accessibility-first headless UI components:

| Component             | Description                                      |
| --------------------- | ------------------------------------------------ |
| `AriaButtonComponent` | ARIA-compliant button with loading states        |
| `AriaDialogComponent` | Modal dialog with focus trap and escape handling |
| `AriaTabsComponent`   | Tab interface with keyboard navigation           |

Usage:

```html
<aria-button
  variant="primary"
  [loading]="isSubmitting()"
  (clicked)="onSubmit()"
>
  Submit
</aria-button>

<aria-dialog [open]="showDialog()" (closed)="closeDialog()">
  <span slot="title">Confirm Action</span>
  <p>Are you sure?</p>
  <div slot="footer">
    <aria-button variant="secondary" (clicked)="cancel()">Cancel</aria-button>
    <aria-button variant="primary" (clicked)="confirm()">Confirm</aria-button>
  </div>
</aria-dialog>
```

### 4. DOM Migration to `afterNextRender`

Migrated DOM-dependent `ngOnInit` code to `afterNextRender` for zoneless compatibility:

**Updated Components:**

- `YoutubePlayerComponent` - YouTube API script loading
- `PullToRefreshComponent` - Document style modifications

**Pattern:**

```typescript
// Before (ngOnInit)
ngOnInit(): void {
  document.body.style.overflow = 'hidden';
}

// After (afterNextRender)
constructor() {
  afterNextRender(() => {
    this.document.body.style.overflow = 'hidden';
  }, { injector: this.injector });
}
```

### 5. Signal Forms Configuration

**Location:** `core/config/signal-forms.config.ts`

Comprehensive Signal Forms utilities:

```typescript
// Create a form
const form = createSignalFormGroup({
  name: createSignalField("", [SignalValidators.required()]),
  email: createSignalField("", [
    SignalValidators.required(),
    SignalValidators.email(),
  ]),
});

// Check validity
if (form.valid()) {
  const data = form.value();
}

// Submit with loading state
const { submit, isSubmitting, canSubmit } = createFormSubmitHandler({
  form,
  onSubmit: async (data) => await api.save(data),
  onSuccess: () => toast.success("Saved!"),
  onError: (err) => toast.error(err.message),
});
```

## Configuration Updates

### `app.config.ts` Changes

1. Added `withFetch()` for HTTP client (better streaming support)
2. Registered `ResourceService` as provider
3. Maintained zoneless change detection

## Migration Guide

### From Reactive Forms to Signal Forms

| Reactive Forms           | Signal Forms                        |
| ------------------------ | ----------------------------------- |
| `FormControl`            | `createSignalField()`               |
| `FormGroup`              | `createSignalFormGroup()`           |
| `Validators.required`    | `SignalValidators.required()`       |
| `formControlName="x"`    | `[(ngModel)]="form.fields.x.value"` |
| `form.get('x')?.invalid` | `!form.fields.x.valid()`            |

### From ngOnInit DOM to afterNextRender

```typescript
// Inject dependencies
private document = inject(DOCUMENT);
private injector = inject(Injector);

constructor() {
  afterNextRender(() => {
    // DOM operations here
  }, { injector: this.injector });
}
```

## Status

| Feature                   | Status               | Notes                         |
| ------------------------- | -------------------- | ----------------------------- |
| Zoneless Change Detection | ✅ Stable            | Default in Angular 21         |
| Signal Forms              | ⚠️ Experimental      | Use for new features          |
| Resource API              | ✅ Stable            | Recommended for data fetching |
| Angular Aria              | ⚠️ Developer Preview | Monitor for updates           |
| afterNextRender           | ✅ Stable            | Required for zoneless         |

## Next Steps

1. Gradually migrate existing Reactive Forms to Signal Forms
2. Adopt Angular Aria components for new UI elements
3. Use Resource API for new data fetching needs
4. Continue monitoring Angular 21.x releases for API stability
