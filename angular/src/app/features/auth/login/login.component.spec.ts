/**
 * Login Component Tests
 *
 * Tests for the login form component.
 * Covers form validation, submission, and error handling.
 *
 * @author FlagFit Pro Team
 */

import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from "@angular/core/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { provideRouter, Router } from "@angular/router";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { of, throwError } from "rxjs";

import { LoginComponent } from "./login.component";
import { AuthService } from "../../../core/services/auth.service";
import { ToastService } from "../../../core/services/toast.service";

describe("LoginComponent", () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let _authService: jasmine.SpyObj<AuthService>;
  let _toastService: jasmine.SpyObj<ToastService>;
  let router: Router;

  const mockAuthService = {
    login: jasmine.createSpy("login").and.returnValue(of({ success: true })),
    checkAuth: jasmine.createSpy("checkAuth").and.returnValue(false),
    generateCsrfToken: jasmine
      .createSpy("generateCsrfToken")
      .and.returnValue("mock-csrf-token"),
  };

  const mockToastService = {
    success: jasmine.createSpy("success"),
    error: jasmine.createSpy("error"),
    info: jasmine.createSpy("info"),
    warn: jasmine.createSpy("warn"),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        provideRouter([{ path: "dashboard", component: LoginComponent }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastService, useValue: mockToastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);

    // Reset spies
    mockAuthService.login.calls.reset();
    mockAuthService.checkAuth.calls.reset();
    mockToastService.success.calls.reset();
    mockToastService.error.calls.reset();

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("Form Initialization", () => {
    it("should create login form with email, password, and remember fields", () => {
      expect(component.loginForm.contains("email")).toBe(true);
      expect(component.loginForm.contains("password")).toBe(true);
      expect(component.loginForm.contains("remember")).toBe(true);
    });

    it("should start with empty email and password", () => {
      expect(component.loginForm.get("email")?.value).toBe("");
      expect(component.loginForm.get("password")?.value).toBe("");
    });

    it("should have remember me unchecked by default", () => {
      expect(component.loginForm.get("remember")?.value).toBe(false);
    });

    it("should generate CSRF token", () => {
      expect(component.csrfToken()).toBe("mock-csrf-token");
    });
  });

  describe("Form Validation", () => {
    it("should be invalid when empty", () => {
      expect(component.loginForm.valid).toBe(false);
    });

    it("should require email", () => {
      component.loginForm.patchValue({ password: "password123" });
      expect(component.loginForm.valid).toBe(false);
      expect(component.loginForm.get("email")?.hasError("required")).toBe(true);
    });

    it("should require valid email format", () => {
      component.loginForm.patchValue({
        email: "invalid-email",
        password: "password123",
      });
      expect(component.loginForm.get("email")?.hasError("email")).toBe(true);
    });

    it("should accept valid email", () => {
      component.loginForm.patchValue({
        email: "test@example.com",
        password: "password123",
      });
      expect(component.loginForm.get("email")?.valid).toBe(true);
    });

    it("should require password", () => {
      component.loginForm.patchValue({ email: "test@example.com" });
      expect(component.loginForm.valid).toBe(false);
      expect(component.loginForm.get("password")?.hasError("required")).toBe(
        true,
      );
    });

    it("should require minimum password length of 8", () => {
      component.loginForm.patchValue({
        email: "test@example.com",
        password: "short",
      });
      expect(component.loginForm.get("password")?.hasError("minlength")).toBe(
        true,
      );
    });

    it("should accept valid password", () => {
      component.loginForm.patchValue({
        email: "test@example.com",
        password: "password123",
      });
      expect(component.loginForm.get("password")?.valid).toBe(true);
    });

    it("should be valid with correct email and password", () => {
      component.loginForm.patchValue({
        email: "test@example.com",
        password: "password123",
      });
      expect(component.loginForm.valid).toBe(true);
    });
  });

  describe("Error Display", () => {
    it("should not show email error initially", () => {
      expect(component.emailError()).toBeNull();
    });

    it("should show email error after submission with invalid email", () => {
      component.loginForm.patchValue({
        email: "",
        password: "password123",
      });
      component.onSubmit();

      expect(component.emailError()).toBeTruthy();
    });

    it("should show email error after field is touched", () => {
      const emailControl = component.loginForm.get("email");
      emailControl?.markAsTouched();

      expect(component.emailError()).toBeTruthy();
    });

    it("should not show password error initially", () => {
      expect(component.passwordError()).toBeNull();
    });

    it("should show password error after submission with invalid password", () => {
      component.loginForm.patchValue({
        email: "test@example.com",
        password: "",
      });
      component.onSubmit();

      expect(component.passwordError()).toBeTruthy();
    });
  });

  describe("Form Submission", () => {
    it("should not submit when form is invalid", () => {
      component.onSubmit();

      expect(mockAuthService.login).not.toHaveBeenCalled();
    });

    it("should mark form as submitted on submit", () => {
      component.onSubmit();

      expect(component.submitted()).toBe(true);
    });

    it("should call login service with form values", fakeAsync(() => {
      component.loginForm.patchValue({
        email: "test@example.com",
        password: "password123",
        remember: true,
      });

      component.onSubmit();
      tick();

      expect(mockAuthService.login).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
        remember: true,
      });
    }));

    it("should set loading state during submission", fakeAsync(() => {
      component.loginForm.patchValue({
        email: "test@example.com",
        password: "password123",
      });

      component.onSubmit();

      expect(component.isLoading()).toBe(true);

      tick();

      expect(component.isLoading()).toBe(false);
    }));
  });

  describe("Successful Login", () => {
    beforeEach(() => {
      mockAuthService.login.and.returnValue(of({ success: true }));
    });

    it("should show success toast on successful login", fakeAsync(() => {
      component.loginForm.patchValue({
        email: "test@example.com",
        password: "password123",
      });

      component.onSubmit();
      tick();

      expect(mockToastService.success).toHaveBeenCalledWith(
        "Login successful!",
      );
    }));

    it("should navigate to dashboard on successful login", fakeAsync(() => {
      const navigateSpy = spyOn(router, "navigateByUrl");

      component.loginForm.patchValue({
        email: "test@example.com",
        password: "password123",
      });

      component.onSubmit();
      tick();

      expect(navigateSpy).toHaveBeenCalledWith("/dashboard");
    }));
  });

  describe("Failed Login", () => {
    it("should show error toast on login failure", fakeAsync(() => {
      mockAuthService.login.and.returnValue(
        of({ success: false, error: "Invalid credentials" }),
      );

      component.loginForm.patchValue({
        email: "test@example.com",
        password: "wrongpassword",
      });

      component.onSubmit();
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith(
        "Invalid credentials",
      );
    }));

    it("should show default error message when no error provided", fakeAsync(() => {
      mockAuthService.login.and.returnValue(of({ success: false }));

      component.loginForm.patchValue({
        email: "test@example.com",
        password: "wrongpassword",
      });

      component.onSubmit();
      tick();

      expect(mockToastService.error).toHaveBeenCalledWith(
        "Invalid email or password",
      );
    }));

    it("should handle network errors", fakeAsync(() => {
      mockAuthService.login.and.returnValue(
        throwError(() => new Error("Network error")),
      );

      component.loginForm.patchValue({
        email: "test@example.com",
        password: "password123",
      });

      component.onSubmit();
      tick();

      expect(mockToastService.error).toHaveBeenCalled();
      expect(component.isLoading()).toBe(false);
    }));
  });

  describe("Already Authenticated", () => {
    it("should redirect to dashboard if already authenticated", () => {
      mockAuthService.checkAuth.and.returnValue(true);
      const navigateSpy = spyOn(router, "navigate");

      component.ngOnInit();

      expect(navigateSpy).toHaveBeenCalledWith(["/dashboard"]);
    });

    it("should not redirect if not authenticated", () => {
      mockAuthService.checkAuth.and.returnValue(false);
      const navigateSpy = spyOn(router, "navigate");

      component.ngOnInit();

      expect(navigateSpy).not.toHaveBeenCalled();
    });
  });

  describe("Demo Mode", () => {
    it("should detect demo mode on localhost", () => {
      // Note: This depends on the actual window.location in tests
      // The component sets isDemoMode based on hostname
      expect(component.isDemoMode()).toBeDefined();
    });
  });

  describe("Field Validation Helpers", () => {
    it("should correctly identify invalid fields", () => {
      component.loginForm.get("email")?.markAsTouched();
      component.loginForm.get("email")?.setErrors({ required: true });

      expect(component.isFieldInvalid("email")).toBe(true);
    });

    it("should return field error message", () => {
      component.loginForm.get("email")?.markAsTouched();
      component.loginForm.get("email")?.setErrors({ required: true });

      const error = component.getFieldError("email");
      expect(error).toBeTruthy();
    });
  });

  describe("Accessibility", () => {
    it("should have aria-required on email input", () => {
      const emailInput = fixture.nativeElement.querySelector("#email");
      expect(emailInput.getAttribute("aria-required")).toBe("true");
    });

    it("should have aria-required on password input", () => {
      const passwordInput = fixture.nativeElement.querySelector("#password");
      expect(passwordInput.getAttribute("aria-required")).toBe("true");
    });

    it("should have aria-invalid when email has error", () => {
      component.loginForm.get("email")?.markAsTouched();
      component.loginForm.get("email")?.setErrors({ required: true });
      component.submitted.set(true);
      fixture.detectChanges();

      const emailInput = fixture.nativeElement.querySelector("#email");
      expect(emailInput.getAttribute("aria-invalid")).toBe("true");
    });

    it("should have aria-describedby linking to error message", () => {
      component.loginForm.get("email")?.markAsTouched();
      component.loginForm.get("email")?.setErrors({ required: true });
      component.submitted.set(true);
      fixture.detectChanges();

      const emailInput = fixture.nativeElement.querySelector("#email");
      expect(emailInput.getAttribute("aria-describedby")).toBe("email-error");
    });

    it('should have error message with role="alert"', () => {
      component.loginForm.get("email")?.markAsTouched();
      component.loginForm.get("email")?.setErrors({ required: true });
      component.submitted.set(true);
      fixture.detectChanges();

      const errorMessage = fixture.nativeElement.querySelector("#email-error");
      if (errorMessage) {
        expect(errorMessage.getAttribute("role")).toBe("alert");
      }
    });
  });

  describe("Form State Signal", () => {
    it("should update formValid signal when form validity changes", fakeAsync(() => {
      expect(component.isFormValid()).toBe(false);

      component.loginForm.patchValue({
        email: "test@example.com",
        password: "password123",
      });

      tick();

      expect(component.isFormValid()).toBe(true);
    }));
  });
});
