# DRY Principles & Code Reusability Guide
## Eliminating Duplication in Angular Applications

**Project**: FlagFit Pro  
**Focus**: Don't Repeat Yourself - Maximum Reusability  
**Created**: December 24, 2025

---

## 📋 Table of Contents

1. [Core DRY Principles](#1-core-dry-principles)
2. [Component Reusability](#2-component-reusability)
3. [Service Abstraction](#3-service-abstraction)
4. [Utility Functions](#4-utility-functions)
5. [Type Reusability](#5-type-reusability)
6. [Template Patterns](#6-template-patterns)
7. [Configuration Management](#7-configuration-management)
8. [Form Patterns](#8-form-patterns)
9. [Directive Reusability](#9-directive-reusability)
10. [Pipe Reusability](#10-pipe-reusability)

---

## 1. Core DRY Principles

### The Three Rules

1. **Extract Once, Use Everywhere**: If code appears 2+ times, extract it
2. **Single Source of Truth**: One place to define, many places to use
3. **Composition Over Duplication**: Build complex from simple reusable pieces

### Before DRY (❌ Bad)
```typescript
// ❌ Duplicated in 5 components
export class DashboardComponent {
  isLoading = signal(false);
  error = signal<string | null>(null);
  
  async loadData(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const data = await this.api.getData();
      this.data.set(data);
    } catch (err) {
      this.error.set(err.message);
    } finally {
      this.isLoading.set(false);
    }
  }
}

export class ProfileComponent {
  isLoading = signal(false);  // DUPLICATE!
  error = signal<string | null>(null);  // DUPLICATE!
  
  async loadData(): Promise<void> {  // DUPLICATE!
    // Same code repeated...
  }
}
```

### After DRY (✅ Good)
```typescript
// ✅ Extract to base class or composable
export abstract class LoadableComponent {
  isLoading = signal(false);
  error = signal<string | null>(null);
  
  protected async loadData<T>(
    apiCall: () => Promise<T>,
    onSuccess: (data: T) => void
  ): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const data = await apiCall();
      onSuccess(data);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Error');
    } finally {
      this.isLoading.set(false);
    }
  }
}

// Usage
export class DashboardComponent extends LoadableComponent {
  data = signal<Data[]>([]);
  
  ngOnInit(): void {
    this.loadData(
      () => this.api.getData(),
      (data) => this.data.set(data)
    );
  }
}
```

---

## 2. Component Reusability

### 2.1 Base Components

Create foundational components for common patterns:

```typescript
// shared/components/base-list/base-list.component.ts
@Component({
  selector: 'app-base-list',
  standalone: true,
  imports: [TableModule, ButtonModule],
  template: `
    <div class="list-header">
      <h2>{{ title() }}</h2>
      <div class="list-actions">
        <ng-content select="[header-actions]" />
      </div>
    </div>
    
    @if (loading()) {
      <div class="loading">Loading...</div>
    } @else if (error()) {
      <div class="error">{{ error() }}</div>
    } @else {
      <p-table
        [value]="items()"
        [paginator]="paginator()"
        [rows]="rows()"
      >
        <ng-content select="[table-content]" />
      </p-table>
    }
  `,
  styles: [`
    .list-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: var(--space-4);
    }
  `],
})
export class BaseListComponent<T> {
  title = input.required<string>();
  items = input.required<T[]>();
  loading = input<boolean>(false);
  error = input<string | null>(null);
  paginator = input<boolean>(true);
  rows = input<number>(10);
}

// Usage in multiple components
<app-base-list
  title="Training Sessions"
  [items]="sessions()"
  [loading]="loading()"
>
  <div header-actions>
    <p-button label="Add Session" />
  </div>
  <ng-template table-content pTemplate="body" let-session>
    <tr>
      <td>{{ session.name }}</td>
      <td>{{ session.date }}</td>
    </tr>
  </ng-template>
</app-base-list>
```

### 2.2 Composite Components

Build complex from simple:

```typescript
// Atomic components
@Component({
  selector: 'app-stat-card',
  template: `
    <p-card>
      <div class="stat-value">{{ value() }}</div>
      <div class="stat-label">{{ label() }}</div>
    </p-card>
  `,
})
export class StatCardComponent {
  value = input.required<string | number>();
  label = input.required<string>();
}

@Component({
  selector: 'app-trend-indicator',
  template: `
    <span [class]="trendClass()">
      <i [class]="trendIcon()"></i>
      {{ percentage() }}%
    </span>
  `,
})
export class TrendIndicatorComponent {
  percentage = input.required<number>();
  
  trendClass = computed(() =>
    this.percentage() > 0 ? 'trend-up' : 'trend-down'
  );
  
  trendIcon = computed(() =>
    this.percentage() > 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'
  );
}

// Composite component
@Component({
  selector: 'app-stat-card-with-trend',
  template: `
    <app-stat-card [value]="value()" [label]="label()">
      <app-trend-indicator [percentage]="trend()" />
    </app-stat-card>
  `,
})
export class StatCardWithTrendComponent {
  value = input.required<string | number>();
  label = input.required<string>();
  trend = input.required<number>();
}
```

### 2.3 Configuration-Driven Components

Single component, multiple configurations:

```typescript
// shared/components/data-display/data-display.component.ts
export interface DataDisplayConfig {
  title: string;
  dataType: 'table' | 'chart' | 'cards';
  columns?: TableColumn[];
  chartType?: 'line' | 'bar' | 'pie';
  actions?: Action[];
}

@Component({
  selector: 'app-data-display',
  template: `
    <h2>{{ config().title }}</h2>
    
    @switch (config().dataType) {
      @case ('table') {
        <app-data-table
          [data]="data()"
          [columns]="config().columns!"
        />
      }
      @case ('chart') {
        <app-chart
          [data]="data()"
          [type]="config().chartType!"
        />
      }
      @case ('cards') {
        <app-card-grid [items]="data()" />
      }
    }
  `,
})
export class DataDisplayComponent {
  config = input.required<DataDisplayConfig>();
  data = input.required<any[]>();
}

// Usage - Same component, different displays
const tableConfig: DataDisplayConfig = {
  title: 'Players',
  dataType: 'table',
  columns: [
    { field: 'name', header: 'Name' },
    { field: 'position', header: 'Position' },
  ],
};

const chartConfig: DataDisplayConfig = {
  title: 'Performance',
  dataType: 'chart',
  chartType: 'line',
};

<app-data-display [config]="tableConfig" [data]="players()" />
<app-data-display [config]="chartConfig" [data]="stats()" />
```

---

## 3. Service Abstraction

### 3.1 Generic CRUD Service

One service for all entities:

```typescript
// core/services/base-crud.service.ts
@Injectable()
export abstract class BaseCrudService<T extends { id: string }> {
  protected supabase = inject(SupabaseService);
  
  protected abstract tableName: string;
  
  async getAll(): Promise<T[]> {
    const { data, error } = await this.supabase
      .getClient()
      .from(this.tableName)
      .select('*');
    
    if (error) throw error;
    return data;
  }
  
  async getById(id: string): Promise<T> {
    const { data, error } = await this.supabase
      .getClient()
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  async create(item: Omit<T, 'id'>): Promise<T> {
    const { data, error } = await this.supabase
      .getClient()
      .from(this.tableName)
      .insert(item)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  async update(id: string, updates: Partial<T>): Promise<T> {
    const { data, error } = await this.supabase
      .getClient()
      .from(this.tableName)
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .getClient()
      .from(this.tableName)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
}

// Specific services extend base
@Injectable({ providedIn: 'root' })
export class PlayersService extends BaseCrudService<Player> {
  protected tableName = 'players';
  
  // Add player-specific methods if needed
  async getByTeam(teamId: string): Promise<Player[]> {
    const { data, error } = await this.supabase
      .getClient()
      .from(this.tableName)
      .select('*')
      .eq('team_id', teamId);
    
    if (error) throw error;
    return data;
  }
}

@Injectable({ providedIn: 'root' })
export class TeamsService extends BaseCrudService<Team> {
  protected tableName = 'teams';
}

@Injectable({ providedIn: 'root' })
export class SessionsService extends BaseCrudService<TrainingSession> {
  protected tableName = 'training_sessions';
}
```

### 3.2 Composable Service Mixins

Mix functionality into services:

```typescript
// core/mixins/cacheable.mixin.ts
export interface Cacheable<T> {
  cache: Map<string, { data: T; timestamp: number }>;
  getCached(key: string, maxAge: number): T | null;
  setCached(key: string, data: T): void;
}

export function CacheableMixin<T extends Constructor>(Base: T) {
  return class extends Base implements Cacheable<any> {
    cache = new Map<string, { data: any; timestamp: number }>();
    
    getCached(key: string, maxAge: number = 300000): any | null {
      const entry = this.cache.get(key);
      if (!entry) return null;
      
      const age = Date.now() - entry.timestamp;
      if (age > maxAge) {
        this.cache.delete(key);
        return null;
      }
      
      return entry.data;
    }
    
    setCached(key: string, data: any): void {
      this.cache.set(key, { data, timestamp: Date.now() });
    }
  };
}

// Usage
class BaseApiService {
  protected http = inject(HttpClient);
}

@Injectable({ providedIn: 'root' })
class ApiServiceWithCache extends CacheableMixin(BaseApiService) {
  async getData(): Promise<Data[]> {
    const cached = this.getCached('data');
    if (cached) return cached;
    
    const data = await firstValueFrom(this.http.get<Data[]>('/api/data'));
    this.setCached('data', data);
    return data;
  }
}
```

---

## 4. Utility Functions

### 4.1 Centralized Utilities

```typescript
// shared/utils/array.utils.ts
export const ArrayUtils = {
  groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((acc, item) => {
      const groupKey = String(item[key]);
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(item);
      return acc;
    }, {} as Record<string, T[]>);
  },
  
  unique<T>(array: T[], key?: keyof T): T[] {
    if (!key) return [...new Set(array)];
    const seen = new Set();
    return array.filter(item => {
      const k = item[key];
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  },
  
  sortBy<T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
    return [...array].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return order === 'asc' ? comparison : -comparison;
    });
  },
};

// shared/utils/date.utils.ts
export const DateUtils = {
  formatDate(date: Date | string, format: string = 'PPP'): string {
    return dateFnsFormat(new Date(date), format);
  },
  
  isToday(date: Date | string): boolean {
    return dateFnsIsToday(new Date(date));
  },
  
  daysAgo(days: number): Date {
    return subDays(new Date(), days);
  },
  
  dateRange(start: Date, end: Date): Date[] {
    return eachDayOfInterval({ start, end });
  },
};

// shared/utils/validation.utils.ts
export const ValidationUtils = {
  isEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },
  
  isPhone(phone: string): boolean {
    return /^\+?[\d\s\-()]+$/.test(phone);
  },
  
  isStrongPassword(password: string): boolean {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password)
    );
  },
};

// shared/utils/format.utils.ts
export const FormatUtils = {
  capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },
  
  truncate(str: string, length: number): string {
    return str.length > length ? str.slice(0, length) + '...' : str;
  },
  
  formatNumber(num: number, decimals: number = 2): string {
    return num.toFixed(decimals);
  },
  
  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  },
};
```

### 4.2 Form Utilities

```typescript
// shared/utils/form.utils.ts
export const FormUtils = {
  getFormControlError(control: AbstractControl): string | null {
    if (!control.errors) return null;
    
    const errorMap: Record<string, (error: any) => string> = {
      required: () => 'This field is required',
      email: () => 'Invalid email address',
      minlength: (err) => `Minimum length is ${err.requiredLength}`,
      maxlength: (err) => `Maximum length is ${err.maxLength}`,
      pattern: () => 'Invalid format',
      min: (err) => `Minimum value is ${err.min}`,
      max: (err) => `Maximum value is ${err.max}`,
    };
    
    const errorKey = Object.keys(control.errors)[0];
    const errorHandler = errorMap[errorKey];
    
    return errorHandler ? errorHandler(control.errors[errorKey]) : 'Invalid value';
  },
  
  markAllAsTouched(form: FormGroup): void {
    Object.values(form.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markAllAsTouched(control);
      }
    });
  },
  
  resetForm(form: FormGroup, initialValues?: any): void {
    form.reset(initialValues);
    this.clearValidationErrors(form);
  },
  
  clearValidationErrors(form: FormGroup): void {
    Object.values(form.controls).forEach(control => {
      control.setErrors(null);
      control.markAsUntouched();
    });
  },
};
```

---

## 5. Type Reusability

### 5.1 Generic Types

```typescript
// shared/types/common.types.ts
export type ApiResponse<T> = {
  data: T;
  error: Error | null;
  loading: boolean;
};

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type WithTimestamps<T> = T & {
  created_at: string;
  updated_at: string;
};

export type WithId<T> = T & {
  id: string;
};

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Usage
type Player = WithTimestamps<WithId<{
  name: string;
  position: string;
}>>;

type PlayerResponse = ApiResponse<Player[]>;

type UpdatePlayer = DeepPartial<Player>;
```

### 5.2 Shared Interfaces

```typescript
// shared/types/base.types.ts
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface Auditable extends BaseEntity {
  created_by: string;
  updated_by: string;
}

export interface SoftDeletable extends BaseEntity {
  deleted_at: string | null;
}

// Specific types extend base
export interface Player extends Auditable {
  name: string;
  position: string;
  team_id: string;
}

export interface Team extends SoftDeletable {
  name: string;
  coach_id: string;
}
```

---

## 6. Template Patterns

### 6.1 Reusable Template Fragments

```typescript
// shared/templates/loading-state.template.ts
export const LOADING_STATE_TEMPLATE = `
  @if (loading()) {
    <div class="loading-state">
      <i class="pi pi-spin pi-spinner"></i>
      <p>{{ loadingMessage() || 'Loading...' }}</p>
    </div>
  }
`;

export const ERROR_STATE_TEMPLATE = `
  @if (error()) {
    <div class="error-state">
      <i class="pi pi-exclamation-triangle"></i>
      <p>{{ error() }}</p>
      @if (retryEnabled()) {
        <p-button label="Retry" (click)="retry()" />
      }
    </div>
  }
`;

export const EMPTY_STATE_TEMPLATE = `
  @if (!loading() && !error() && items().length === 0) {
    <div class="empty-state">
      <i class="pi pi-inbox"></i>
      <p>{{ emptyMessage() || 'No items found' }}</p>
      @if (actionLabel()) {
        <p-button [label]="actionLabel()" (click)="action()" />
      }
    </div>
  }
`;

// Usage in component
@Component({
  template: `
    ${LOADING_STATE_TEMPLATE}
    ${ERROR_STATE_TEMPLATE}
    ${EMPTY_STATE_TEMPLATE}
    
    @if (!loading() && !error() && items().length > 0) {
      <!-- Your content -->
    }
  `,
})
export class ListComponent {
  loading = input<boolean>(false);
  error = input<string | null>(null);
  items = input<any[]>([]);
  loadingMessage = input<string>();
  emptyMessage = input<string>();
  actionLabel = input<string>();
  retryEnabled = input<boolean>(true);
  
  retry = output<void>();
  action = output<void>();
}
```

### 6.2 ng-template Reuse

```typescript
@Component({
  template: `
    <!-- Define reusable template -->
    <ng-template #statCard let-label="label" let-value="value" let-icon="icon">
      <p-card>
        <div class="stat-header">
          <i [class]="'pi pi-' + icon"></i>
          <span>{{ label }}</span>
        </div>
        <div class="stat-value">{{ value }}</div>
      </p-card>
    </ng-template>
    
    <!-- Reuse multiple times -->
    <ng-container 
      *ngTemplateOutlet="statCard; context: { 
        label: 'Total Sessions', 
        value: totalSessions(), 
        icon: 'calendar' 
      }"
    />
    
    <ng-container 
      *ngTemplateOutlet="statCard; context: { 
        label: 'Active Players', 
        value: activePlayers(), 
        icon: 'users' 
      }"
    />
  `,
})
```

---

## 7. Configuration Management

### 7.1 Centralized Constants

```typescript
// core/config/app.constants.ts
export const APP_CONSTANTS = {
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  },
  
  TIMEOUTS: {
    API_TIMEOUT: 30000,
    DEBOUNCE_TIME: 300,
    TOAST_DURATION: 3000,
  },
  
  VALIDATION: {
    MIN_PASSWORD_LENGTH: 8,
    MAX_NAME_LENGTH: 100,
    EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  
  ROUTES: {
    LOGIN: '/login',
    DASHBOARD: '/dashboard',
    PROFILE: '/profile',
  },
  
  STORAGE_KEYS: {
    AUTH_TOKEN: 'auth_token',
    USER_PREFERENCES: 'user_preferences',
    THEME: 'theme',
  },
} as const;

// Usage
@Component({
  template: `
    <p-table
      [rows]="APP_CONSTANTS.PAGINATION.DEFAULT_PAGE_SIZE"
      [rowsPerPageOptions]="APP_CONSTANTS.PAGINATION.PAGE_SIZE_OPTIONS"
    />
  `,
})
export class TableComponent {
  readonly APP_CONSTANTS = APP_CONSTANTS;
}
```

### 7.2 Configuration Service

```typescript
// core/services/config.service.ts
@Injectable({ providedIn: 'root' })
export class ConfigService {
  private config = signal({
    theme: 'light',
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/dd/yyyy',
    currency: 'USD',
  });
  
  readonly theme = computed(() => this.config().theme);
  readonly language = computed(() => this.config().language);
  readonly dateFormat = computed(() => this.config().dateFormat);
  
  updateConfig(updates: Partial<typeof this.config>): void {
    this.config.update(current => ({ ...current, ...updates }));
    this.saveToStorage();
  }
  
  private saveToStorage(): void {
    localStorage.setItem('app-config', JSON.stringify(this.config()));
  }
  
  loadFromStorage(): void {
    const stored = localStorage.getItem('app-config');
    if (stored) {
      this.config.set(JSON.parse(stored));
    }
  }
}
```

---

## 8. Form Patterns

### 8.1 Form Builder Factory

```typescript
// core/factories/form-builder.factory.ts
@Injectable({ providedIn: 'root' })
export class FormBuilderFactory {
  private fb = inject(FormBuilder);
  
  createForm<T extends Record<string, any>>(
    schema: FormSchema<T>
  ): FormGroup {
    const controls: Record<string, any> = {};
    
    for (const [key, config] of Object.entries(schema)) {
      controls[key] = [
        config.defaultValue ?? '',
        config.validators ?? [],
      ];
    }
    
    return this.fb.group(controls);
  }
}

interface FormSchema<T> {
  [K in keyof T]: {
    defaultValue?: T[K];
    validators?: ValidatorFn[];
  };
}

// Usage
const playerSchema: FormSchema<Player> = {
  name: {
    defaultValue: '',
    validators: [Validators.required, Validators.minLength(2)],
  },
  position: {
    defaultValue: '',
    validators: [Validators.required],
  },
  jersey_number: {
    defaultValue: 0,
    validators: [Validators.required, Validators.min(0)],
  },
};

const form = this.formFactory.createForm(playerSchema);
```

---

## 9. Directive Reusability

### 9.1 Behavior Directives

```typescript
// shared/directives/auto-focus.directive.ts
@Directive({
  selector: '[appAutoFocus]',
  standalone: true,
})
export class AutoFocusDirective implements AfterViewInit {
  private el = inject(ElementRef);
  delay = input<number>(0);
  
  ngAfterViewInit(): void {
    setTimeout(() => this.el.nativeElement.focus(), this.delay());
  }
}

// shared/directives/click-outside.directive.ts
@Directive({
  selector: '[appClickOutside]',
  standalone: true,
})
export class ClickOutsideDirective {
  private el = inject(ElementRef);
  clickOutside = output<void>();
  
  @HostListener('document:click', ['$event.target'])
  onClick(target: HTMLElement): void {
    if (!this.el.nativeElement.contains(target)) {
      this.clickOutside.emit();
    }
  }
}

// shared/directives/debounce-click.directive.ts
@Directive({
  selector: '[appDebounceClick]',
  standalone: true,
})
export class DebounceClickDirective {
  debounceTime = input<number>(300);
  debounceClick = output<Event>();
  
  private clicks = new Subject<Event>();
  
  constructor() {
    this.clicks
      .pipe(
        debounceTime(() => interval(this.debounceTime())),
        takeUntilDestroyed()
      )
      .subscribe((e) => this.debounceClick.emit(e));
  }
  
  @HostListener('click', ['$event'])
  onClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.clicks.next(event);
  }
}

// Usage - Reuse across app
<input appAutoFocus [delay]="100" />
<div appClickOutside (clickOutside)="close()" />
<button appDebounceClick (debounceClick)="save()">Save</button>
```

---

## 10. Pipe Reusability

### 10.1 Transformation Pipes

```typescript
// shared/pipes/truncate.pipe.ts
@Pipe({ name: 'truncate', standalone: true, pure: true })
export class TruncatePipe implements PipeTransform {
  transform(value: string, length: number = 50, suffix: string = '...'): string {
    return value.length > length ? value.slice(0, length) + suffix : value;
  }
}

// shared/pipes/time-ago.pipe.ts
@Pipe({ name: 'timeAgo', standalone: true, pure: true })
export class TimeAgoPipe implements PipeTransform {
  transform(value: Date | string): string {
    return formatDistanceToNow(new Date(value), { addSuffix: true });
  }
}

// shared/pipes/safe-html.pipe.ts
@Pipe({ name: 'safeHtml', standalone: true, pure: true })
export class SafeHtmlPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);
  
  transform(value: string): SafeHtml {
    return this.sanitizer.sanitize(SecurityContext.HTML, value) || '';
  }
}

// shared/pipes/highlight.pipe.ts
@Pipe({ name: 'highlight', standalone: true, pure: true })
export class HighlightPipe implements PipeTransform {
  transform(value: string, search: string): string {
    if (!search) return value;
    const re = new RegExp(search, 'gi');
    return value.replace(re, match => `<mark>${match}</mark>`);
  }
}

// Usage
{{ longText | truncate:100 }}
{{ createdAt | timeAgo }}
<div [innerHTML]="userContent | safeHtml"></div>
{{ name | highlight:searchTerm }}
```

---

## 📊 DRY Checklist

Before writing new code, ask:

- [ ] Does this code exist elsewhere?
- [ ] Can I extract this to a shared utility?
- [ ] Is this pattern repeating 2+ times?
- [ ] Can I create a reusable component?
- [ ] Should this be a directive?
- [ ] Is there a pipe for this transformation?
- [ ] Can I use a base class?
- [ ] Should this be configuration-driven?

---

## 🎯 Benefits of DRY

1. **Maintainability**: Fix bugs once, benefits everywhere
2. **Consistency**: Same behavior across application
3. **Productivity**: Write less code, deliver faster
4. **Testing**: Test once, confidence everywhere
5. **Scalability**: Easy to extend and modify

---

## ⚖️ When NOT to DRY

### Avoid Over-Abstraction

```typescript
// ❌ TOO DRY - Over-abstracted
function process(data: any, config: any, options: any): any {
  // Generic mess that does everything
}

// ✅ BALANCED - Specific and clear
function processPlayerStats(players: Player[]): PlayerStats {
  // Clear, focused function
}
```

### Rule of Three

- **1st occurrence**: Write it
- **2nd occurrence**: Note the duplication
- **3rd occurrence**: Extract to reusable

---

## 📚 Summary

**Key Takeaways:**

1. Extract components when UI patterns repeat
2. Use base classes for common component logic
3. Create utility functions for shared operations
4. Centralize configuration and constants
5. Build composable, reusable services
6. Share types and interfaces
7. Use directives for behavior reuse
8. Create pipes for transformations
9. Apply the Rule of Three
10. Balance DRY with clarity

**Remember**: Code should be DRY but also CLEAR. Don't sacrifice readability for the sake of avoiding duplication.

---

**Version**: 1.0  
**Last Updated**: December 24, 2025  
**Status**: Production Standards

