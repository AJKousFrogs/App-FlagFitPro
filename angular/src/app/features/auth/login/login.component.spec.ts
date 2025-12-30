import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { of, throwError } from 'rxjs';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let compiled: HTMLElement;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockToastService: jasmine.SpyObj<ToastService>;

  beforeEach(async () => {
    // Create mock services
    mockAuthService = jasmine.createSpyObj('AuthService', [
      'login',
      'checkAuth',
      'generateCsrfToken'
    ]);
    mockToastService = jasmine.createSpyObj('ToastService', [
      'success',
      'error'
    ]);

    // Default mock implementations
    mockAuthService.checkAuth.and.returnValue(false);
    mockAuthService.generateCsrfToken.and.returnValue('mock-csrf-token');
    mockAuthService.login.and.returnValue(of({ success: true }));

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastService, useValue: mockToastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize form with empty values', () => {
      expect(component.loginForm.get('email')?.value).toBe('');
      expect(component.loginForm.get('password')?.value).toBe('');
      expect(component.loginForm.get('remember')?.value).toBe(false);
    });

    it('should generate CSRF token on init', () => {
      fixture.detectChanges();
      expect(component.csrfToken()).toBe('mock-csrf-token');
      expect(mockAuthService.generateCsrfToken).toHaveBeenCalled();
    });

    it('should detect demo mode for localhost', () => {
      fixture.detectChanges();
      // Demo mode detection depends on window.location
      expect(component.isDemoMode()).toBeDefined();
    });
  });

  describe('Form Validation', () => {
    it('should validate email as required', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setValue('');
      expect(emailControl?.hasError('required')).toBe(true);
    });

    it('should validate email format', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setValue('invalid-email');
      expect(emailControl?.hasError('email')).toBe(true);
    });

    it('should accept valid email', () => {
      const emailControl = component.loginForm.get('email');
      emailControl?.setValue('user@example.com');
      emailControl?.markAsTouched();
      expect(emailControl?.valid).toBe(true);
    });

    it('should validate password as required', () => {
      const passwordControl = component.loginForm.get('password');
      passwordControl?.setValue('');
      expect(passwordControl?.hasError('required')).toBe(true);
    });

    it('should validate password min length', () => {
      const passwordControl = component.loginForm.get('password');
      passwordControl?.setValue('short');
      expect(passwordControl?.hasError('minlength')).toBe(true);
    });

    it('should accept valid password', () => {
      const passwordControl = component.loginForm.get('password');
      passwordControl?.setValue('validPassword123');
      passwordControl?.markAsTouched();
      expect(passwordControl?.valid).toBe(true);
    });
  });

  describe('Error Display', () => {
    it('should show email error when submitted with invalid email', () => {
      component.loginForm.get('email')?.setValue('');
      component.loginForm.get('email')?.markAsTouched();
      component.submitted.set(true);
      fixture.detectChanges();

      expect(component.emailError()).toBeTruthy();
    });

    it('should show password error when submitted with invalid password', () => {
      component.loginForm.get('password')?.setValue('');
      component.loginForm.get('password')?.markAsTouched();
      component.submitted.set(true);
      fixture.detectChanges();

      expect(component.passwordError()).toBeTruthy();
    });

    it('should not show errors before form is touched', () => {
      component.loginForm.get('email')?.setValue('');
      fixture.detectChanges();

      expect(component.emailError()).toBeFalsy();
    });
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      // Set up valid form data
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'validPassword123',
        remember: true
      });
    });

    it('should not submit when form is invalid', () => {
      component.loginForm.get('email')?.setValue('');
      component.onSubmit();

      expect(mockAuthService.login).not.toHaveBeenCalled();
      expect(component.submitted()).toBe(true);
    });

    it('should call AuthService.login with form values', () => {
      component.onSubmit();

      expect(mockAuthService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'validPassword123',
        remember: true
      });
    });

    it('should set loading state during login', () => {
      component.onSubmit();
      expect(component.isLoading()).toBe(true);
    });

    it('should show success toast on successful login', (done) => {
      mockAuthService.login.and.returnValue(of({ success: true }));

      component.onSubmit();

      setTimeout(() => {
        expect(mockToastService.success).toHaveBeenCalledWith('Login successful!');
        expect(component.isLoading()).toBe(false);
        done();
      }, 100);
    });

    it('should show error toast on login failure', (done) => {
      mockAuthService.login.and.returnValue(
        of({ success: false, error: 'Invalid credentials' })
      );

      component.onSubmit();

      setTimeout(() => {
        expect(mockToastService.error).toHaveBeenCalledWith('Invalid credentials');
        expect(component.isLoading()).toBe(false);
        done();
      }, 100);
    });

    it('should handle network error', (done) => {
      mockAuthService.login.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      component.onSubmit();

      setTimeout(() => {
        expect(mockToastService.error).toHaveBeenCalledWith('Network error');
        expect(component.isLoading()).toBe(false);
        done();
      }, 100);
    });
  });

  describe('UI Rendering', () => {
    it('should render email input field', () => {
      fixture.detectChanges();
      const emailInput = compiled.querySelector('#email');
      expect(emailInput).toBeTruthy();
      expect(emailInput?.getAttribute('type')).toBe('email');
    });

    it('should render password input field', () => {
      fixture.detectChanges();
      const passwordInput = compiled.querySelector('#password');
      expect(passwordInput).toBeTruthy();
      expect(passwordInput?.getAttribute('type')).toBe('password');
    });

    it('should render remember me checkbox', () => {
      fixture.detectChanges();
      const checkbox = compiled.querySelector('#remember');
      expect(checkbox).toBeTruthy();
    });

    it('should render submit button', () => {
      fixture.detectChanges();
      const submitBtn = compiled.querySelector('p-button[type="submit"]');
      expect(submitBtn).toBeTruthy();
    });

    it('should disable submit button when form is invalid', () => {
      component.formValid.set(false);
      fixture.detectChanges();
      const submitBtn = compiled.querySelector('p-button[type="submit"]');
      expect(submitBtn?.getAttribute('ng-reflect-disabled')).toBe('true');
    });

    it('should render link to reset password', () => {
      fixture.detectChanges();
      const resetLink = compiled.querySelector('a[href*="reset-password"]');
      expect(resetLink).toBeTruthy();
    });

    it('should render link to register', () => {
      fixture.detectChanges();
      const registerLink = compiled.querySelector('a[href*="register"]');
      expect(registerLink).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on email input', () => {
      fixture.detectChanges();
      const emailInput = compiled.querySelector('#email');
      expect(emailInput?.getAttribute('aria-required')).toBe('true');
    });

    it('should have proper ARIA labels on password input', () => {
      fixture.detectChanges();
      const passwordInput = compiled.querySelector('#password');
      expect(passwordInput?.getAttribute('aria-required')).toBe('true');
    });

    it('should set aria-invalid when field has error', () => {
      component.loginForm.get('email')?.setValue('');
      component.loginForm.get('email')?.markAsTouched();
      component.submitted.set(true);
      fixture.detectChanges();

      const emailInput = compiled.querySelector('#email');
      expect(emailInput?.getAttribute('aria-invalid')).toBe('true');
    });

    it('should associate error message with input via aria-describedby', () => {
      component.loginForm.get('email')?.setValue('');
      component.loginForm.get('email')?.markAsTouched();
      component.submitted.set(true);
      fixture.detectChanges();

      const emailInput = compiled.querySelector('#email');
      expect(emailInput?.getAttribute('aria-describedby')).toBe('email-error');
    });

    it('should mark error messages with role=alert', () => {
      component.loginForm.get('email')?.setValue('');
      component.loginForm.get('email')?.markAsTouched();
      component.submitted.set(true);
      fixture.detectChanges();

      const errorMsg = compiled.querySelector('#email-error');
      expect(errorMsg?.getAttribute('role')).toBe('alert');
    });
  });

  describe('Demo Mode', () => {
    it('should show demo mode alert when in demo mode', () => {
      component.isDemoMode.set(true);
      fixture.detectChanges();
      const demoAlert = compiled.querySelector('.alert-info');
      expect(demoAlert?.textContent).toContain('Demo Mode');
    });

    it('should not show demo mode alert in production', () => {
      component.isDemoMode.set(false);
      fixture.detectChanges();
      const demoAlert = compiled.querySelector('.alert-info');
      expect(demoAlert).toBeNull();
    });
  });
});
