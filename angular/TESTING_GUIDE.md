# FlagFit Pro - Testing Guide

## Overview

This guide provides standards and patterns for testing Angular components, services, and features in FlagFit Pro.

## Testing Stack

- **Test Runner:** Vitest (fast, modern alternative to Jest/Karma)
- **Testing Library:** Angular Testing Library + @angular/core/testing
- **E2E Testing:** Playwright
- **Coverage Tool:** Vitest Coverage (V8 provider)

## Running Tests

```bash
# Run all tests
npm test

# Watch mode (re-run on file changes)
npm run test:watch

# UI mode (interactive test runner)
npm run test:ui

# Coverage report
npm run test:coverage

# E2E tests
npm run e2e
```

## Test File Structure

```
src/
├── app/
│   ├── features/
│   │   └── dashboard/
│   │       ├── athlete-dashboard.component.ts
│   │       └── athlete-dashboard.component.spec.ts
│   ├── shared/
│   │   └── components/
│   │       └── empty-state/
│   │           ├── empty-state.component.ts
│   │           └── empty-state.component.spec.ts
│   └── core/
│       └── services/
│           ├── auth.service.ts
│           └── auth.service.spec.ts
```

**Convention:** Test files (`.spec.ts`) are co-located with the file they test.

---

## Component Testing Patterns

### Basic Component Test Template

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { YourComponent } from './your.component';

describe('YourComponent', () => {
  let component: YourComponent;
  let fixture: ComponentFixture<YourComponent>;
  let compiled: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [YourComponent], // Standalone components
      providers: [
        provideRouter([]),
        // Add mock services here
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(YourComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('Input Properties', () => {
    it('should accept input values', () => {
      fixture.componentRef.setInput('title', 'Test Title');
      fixture.detectChanges();
      expect(component.title()).toBe('Test Title');
    });
  });

  describe('Output Events', () => {
    it('should emit events', () => {
      let emittedValue: any;
      component.onAction.subscribe((value: any) => {
        emittedValue = value;
      });

      component.handleAction();
      expect(emittedValue).toBeDefined();
    });
  });

  describe('DOM Rendering', () => {
    it('should render title', () => {
      fixture.componentRef.setInput('title', 'Test Title');
      fixture.detectChanges();
      const titleEl = compiled.querySelector('h1');
      expect(titleEl?.textContent).toBe('Test Title');
    });
  });
});
```

### Testing Angular 21 Signals

```typescript
describe('Signal Inputs', () => {
  it('should update computed signal when input changes', () => {
    fixture.componentRef.setInput('count', 5);
    fixture.detectChanges();

    expect(component.count()).toBe(5);
    expect(component.doubleCount()).toBe(10);
  });

  it('should trigger effects when signal changes', () => {
    let effectRan = false;

    // Setup effect tracking
    component.trackEffect(() => {
      effectRan = true;
    });

    fixture.componentRef.setInput('value', 'new value');
    fixture.detectChanges();

    expect(effectRan).toBe(true);
  });
});
```

### Testing PrimeNG Components

```typescript
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

describe('Component with PrimeNG', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        YourComponent,
        ButtonModule,
        DialogModule,
      ],
    }).compileComponents();
  });

  it('should render PrimeNG button', () => {
    fixture.detectChanges();
    const button = compiled.querySelector('p-button');
    expect(button).toBeTruthy();
  });

  it('should trigger button click', () => {
    spyOn(component, 'handleClick');
    fixture.detectChanges();

    const button = compiled.querySelector('button');
    button?.click();

    expect(component.handleClick).toHaveBeenCalled();
  });
});
```

### Mocking Services

```typescript
describe('Component with Service Dependencies', () => {
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockToastService: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', [
      'login',
      'logout',
      'getUser'
    ]);
    mockToastService = jasmine.createSpyObj('ToastService', [
      'success',
      'error'
    ]);

    // Default return values
    mockAuthService.getUser.and.returnValue({ id: '1', email: 'test@example.com' });
    mockToastService.success.and.returnValue(undefined);

    await TestBed.configureTestingModule({
      imports: [YourComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastService, useValue: mockToastService },
      ],
    }).compileComponents();
  });

  it('should call service method', () => {
    component.doSomething();
    expect(mockAuthService.login).toHaveBeenCalled();
  });

  it('should handle service response', (done) => {
    mockAuthService.login.and.returnValue(of({ success: true }));

    component.login();

    setTimeout(() => {
      expect(mockToastService.success).toHaveBeenCalledWith('Login successful');
      done();
    }, 100);
  });
});
```

### Testing Async Operations

```typescript
describe('Async Operations', () => {
  it('should handle observable data', (done) => {
    const mockData = [{ id: 1, name: 'Test' }];
    mockService.getData.and.returnValue(of(mockData));

    component.loadData();

    setTimeout(() => {
      expect(component.data()).toEqual(mockData);
      expect(component.isLoading()).toBe(false);
      done();
    }, 100);
  });

  it('should handle errors', (done) => {
    mockService.getData.and.returnValue(
      throwError(() => new Error('Network error'))
    );

    component.loadData();

    setTimeout(() => {
      expect(component.hasError()).toBe(true);
      expect(component.errorMessage()).toBe('Network error');
      done();
    }, 100);
  });
});
```

---

## Testing Best Practices

### 1. Test Organization

Use `describe` blocks to group related tests:

```typescript
describe('ComponentName', () => {
  describe('Component Initialization', () => {
    // Tests for component creation
  });

  describe('Input Properties', () => {
    // Tests for @Input properties
  });

  describe('Output Events', () => {
    // Tests for @Output events
  });

  describe('User Interactions', () => {
    // Tests for click, input, etc.
  });

  describe('Accessibility', () => {
    // Tests for ARIA, keyboard nav, etc.
  });
});
```

### 2. Test Naming Convention

Use clear, descriptive test names:

```typescript
// ✅ GOOD
it('should display error message when email is invalid', () => {});
it('should emit onSubmit event when form is valid', () => {});
it('should disable submit button when loading', () => {});

// ❌ BAD
it('should work', () => {});
it('test email', () => {});
it('check button', () => {});
```

### 3. Test Independence

Each test should be independent:

```typescript
// ✅ GOOD
it('should show error', () => {
  component.error.set('Test error');
  fixture.detectChanges();
  expect(compiled.querySelector('.error')).toBeTruthy();
});

// ❌ BAD - depends on previous test state
it('should show error', () => {
  // Assumes error was set in previous test
  expect(compiled.querySelector('.error')).toBeTruthy();
});
```

### 4. Accessibility Testing

Always include accessibility tests:

```typescript
describe('Accessibility', () => {
  it('should have proper ARIA labels', () => {
    fixture.detectChanges();
    const button = compiled.querySelector('button');
    expect(button?.getAttribute('aria-label')).toBeTruthy();
  });

  it('should be keyboard navigable', () => {
    fixture.detectChanges();
    const inputs = compiled.querySelectorAll('input, button, a');
    inputs.forEach(el => {
      expect(el.getAttribute('tabindex')).not.toBe('-1');
    });
  });

  it('should announce errors to screen readers', () => {
    component.error.set('Error message');
    fixture.detectChanges();
    const errorEl = compiled.querySelector('[role="alert"]');
    expect(errorEl).toBeTruthy();
  });
});
```

### 5. Testing Loading States

```typescript
describe('Loading States', () => {
  it('should show loading indicator', () => {
    component.isLoading.set(true);
    fixture.detectChanges();
    const loader = compiled.querySelector('app-skeleton-loader');
    expect(loader).toBeTruthy();
  });

  it('should hide content while loading', () => {
    component.isLoading.set(true);
    fixture.detectChanges();
    const content = compiled.querySelector('.content');
    expect(content).toBeNull();
  });

  it('should show content after loading', (done) => {
    mockService.getData.and.returnValue(of({ data: 'test' }));

    component.loadData();

    setTimeout(() => {
      fixture.detectChanges();
      expect(component.isLoading()).toBe(false);
      const content = compiled.querySelector('.content');
      expect(content).toBeTruthy();
      done();
    }, 100);
  });
});
```

### 6. Testing Empty States

```typescript
describe('Empty States', () => {
  it('should show empty state when no data', () => {
    component.data.set([]);
    fixture.detectChanges();
    const emptyState = compiled.querySelector('app-empty-state');
    expect(emptyState).toBeTruthy();
  });

  it('should not show empty state when data exists', () => {
    component.data.set([{ id: 1 }]);
    fixture.detectChanges();
    const emptyState = compiled.querySelector('app-empty-state');
    expect(emptyState).toBeNull();
  });
});
```

### 7. Testing Error States

```typescript
describe('Error States', () => {
  it('should display error message', () => {
    component.hasError.set(true);
    component.errorMessage.set('Something went wrong');
    fixture.detectChanges();

    const errorEl = compiled.querySelector('.error-message');
    expect(errorEl?.textContent).toContain('Something went wrong');
  });

  it('should provide retry action', () => {
    spyOn(component, 'retry');
    component.hasError.set(true);
    fixture.detectChanges();

    const retryBtn = compiled.querySelector('.retry-button') as HTMLElement;
    retryBtn?.click();

    expect(component.retry).toHaveBeenCalled();
  });
});
```

---

## Coverage Goals

### Minimum Coverage Targets

- **Statements:** 70%
- **Branches:** 65%
- **Functions:** 70%
- **Lines:** 70%

### Critical Components (90%+ coverage required)

- Authentication flows
- Payment processing
- Data submission forms
- Security-sensitive features

### Run Coverage Report

```bash
npm run test:coverage
```

View report: `coverage/index.html`

---

## Common Testing Patterns

### Pattern 1: Form Testing

```typescript
describe('Form Validation', () => {
  it('should validate required fields', () => {
    const emailControl = component.form.get('email');
    emailControl?.setValue('');
    expect(emailControl?.hasError('required')).toBe(true);
  });

  it('should accept valid input', () => {
    const emailControl = component.form.get('email');
    emailControl?.setValue('test@example.com');
    expect(emailControl?.valid).toBe(true);
  });

  it('should disable submit when invalid', () => {
    component.form.patchValue({ email: '' });
    fixture.detectChanges();
    const submitBtn = compiled.querySelector('[type="submit"]');
    expect(submitBtn?.hasAttribute('disabled')).toBe(true);
  });
});
```

### Pattern 2: Modal Testing

```typescript
describe('Modal Component', () => {
  it('should open modal', () => {
    component.visible.set(true);
    fixture.detectChanges();
    const modal = compiled.querySelector('.p-dialog');
    expect(modal).toBeTruthy();
  });

  it('should close on backdrop click', () => {
    component.visible.set(true);
    component.dismissableMask.set(true);
    fixture.detectChanges();

    const backdrop = compiled.querySelector('.p-dialog-mask') as HTMLElement;
    backdrop?.click();

    expect(component.visible()).toBe(false);
  });

  it('should trap focus', () => {
    component.visible.set(true);
    fixture.detectChanges();
    // Test focus trap implementation
  });
});
```

### Pattern 3: Router Testing

```typescript
import { Router } from '@angular/router';

describe('Navigation', () => {
  let router: Router;

  beforeEach(() => {
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
  });

  it('should navigate to dashboard', () => {
    component.goToDashboard();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
```

---

## Debugging Tests

### Enable Debug Mode

```typescript
it('should do something', () => {
  console.log('Component state:', component.data());
  console.log('DOM:', compiled.innerHTML);

  fixture.detectChanges();

  console.log('After change detection:', compiled.innerHTML);
});
```

### Inspect Failed Tests

```bash
# Run single test file
npm test -- src/app/features/dashboard/athlete-dashboard.component.spec.ts

# Run tests matching pattern
npm test -- --grep="should display metrics"

# Run with UI for debugging
npm run test:ui
```

---

## Next Steps

1. **Write tests for existing components** (start with critical paths)
2. **Run coverage report** to identify untested code
3. **Add E2E tests** for complete user flows
4. **Set up CI/CD** to run tests automatically
5. **Enforce coverage thresholds** in build pipeline

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Angular Testing Guide](https://angular.dev/guide/testing)
- [Playwright E2E Testing](https://playwright.dev/)
- [Testing Best Practices](https://testingjavascript.com/)

---

**Last Updated:** December 30, 2024
**Maintainer:** Development Team
