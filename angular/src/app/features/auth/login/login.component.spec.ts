import { ComponentFixture, TestBed } from "@angular/core/testing";
import { signal } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { of, throwError } from "rxjs";
import {
  AuthService,
  AuthSessionResult,
  User,
} from "../../../core/services/auth.service";
import { HomeRouteService } from "../../../core/services/home-route.service";
import { ToastService } from "../../../core/services/toast.service";
import { AuthFlowDataService } from "../services/auth-flow-data.service";
import { LoginComponent } from "./login.component";

describe("LoginComponent", () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;

  const currentUser = signal<User | null>(null);
  const mockAuthService = {
    currentUser,
    checkAuth: vi.fn(() => false),
    generateCsrfToken: vi.fn(() => "csrf-token"),
    login: vi.fn(),
    getUser: vi.fn(() => currentUser()),
  } as unknown as AuthService;

  const mockAuthFlowDataService = {
    resolvePostAuthRedirect: vi.fn(),
    signOut: vi.fn().mockResolvedValue(undefined),
    storePendingVerificationEmail: vi.fn(),
  } as unknown as AuthFlowDataService;

  const mockToastService = {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  } as unknown as ToastService;

  const mockHomeRouteService = {
    getHomeRoute: vi.fn(() => "/todays-practice"),
  } as unknown as HomeRouteService;

  const mockRouter = {
    navigate: vi.fn(),
    navigateByUrl: vi.fn(),
  } as unknown as Router;

  const mockActivatedRoute = {
    snapshot: {
      queryParams: {} as Record<string, string>,
    },
  };

  const testUser: User = {
    id: "user-123",
    email: "player@example.com",
    name: "Player One",
    role: "athlete",
    emailConfirmed: true,
  };

  const loginResult: AuthSessionResult = {
    user: testUser,
    session: null,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    currentUser.set(null);
    mockActivatedRoute.snapshot.queryParams = {};
    mockAuthService.checkAuth = vi.fn(() => false);
    mockAuthService.generateCsrfToken = vi.fn(() => "csrf-token");
    mockAuthService.login = vi.fn().mockReturnValue(of(loginResult));
    mockAuthService.getUser = vi.fn(() => currentUser());
    mockAuthFlowDataService.resolvePostAuthRedirect = vi
      .fn()
      .mockResolvedValue("/todays-practice");
    mockAuthFlowDataService.signOut = vi.fn().mockResolvedValue(undefined);
    mockAuthFlowDataService.storePendingVerificationEmail = vi.fn();
    mockRouter.navigate = vi.fn();
    mockRouter.navigateByUrl = vi.fn();

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: AuthFlowDataService, useValue: mockAuthFlowDataService },
        { provide: HomeRouteService, useValue: mockHomeRouteService },
        { provide: ToastService, useValue: mockToastService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    })
      .overrideComponent(LoginComponent, {
        set: { template: "" },
      })
      .compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  async function flushComponentWork(): Promise<void> {
    await fixture.whenStable();
    await Promise.resolve();
  }

  it("creates the component and generates a CSRF token", () => {
    expect(component).toBeTruthy();
    expect(mockAuthService.generateCsrfToken).toHaveBeenCalledTimes(1);
    expect(component.csrfToken()).toBe("csrf-token");
  });

  it("redirects authenticated users away from login on init", async () => {
    mockAuthService.checkAuth = vi.fn(() => true);
    currentUser.set(testUser);

    const redirectedFixture = TestBed.createComponent(LoginComponent);
    redirectedFixture.detectChanges();
    await redirectedFixture.whenStable();

    expect(mockAuthFlowDataService.resolvePostAuthRedirect).toHaveBeenCalledWith(
      {
        returnUrl: null,
        allowReturnUrlBypassOnboarding: true,
      },
    );
  });

  it("shows a validation summary when submitted with invalid fields", () => {
    component.onSubmit();

    expect(component.submitError()).toBe(
      "Check the highlighted fields and try again.",
    );
    expect(component.submitted()).toBe(true);
    expect(mockAuthService.login).not.toHaveBeenCalled();
  });

  it("logs in and resolves the post-auth redirect", async () => {
    currentUser.set(testUser);
    component.loginForm.setValue({
      email: "PLAYER@EXAMPLE.COM",
      password: "Password123!",
      remember: false,
    });

    component.onSubmit();
    await flushComponentWork();

    expect(mockAuthService.login).toHaveBeenCalledWith({
      email: "player@example.com",
      password: "Password123!",
      remember: false,
    });
    expect(mockAuthFlowDataService.resolvePostAuthRedirect).toHaveBeenCalledWith(
      {
        returnUrl: null,
        allowReturnUrlBypassOnboarding: true,
      },
    );
    expect(mockToastService.success).toHaveBeenCalled();
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith("/todays-practice");
    expect(component.submitError()).toBeNull();
  });

  it("passes a trusted returnUrl through the shared redirect resolver", async () => {
    currentUser.set(testUser);
    mockActivatedRoute.snapshot.queryParams = {
      returnUrl: "/team/accept-invitation/token-123",
    };
    mockAuthFlowDataService.resolvePostAuthRedirect = vi
      .fn()
      .mockResolvedValue("/team/accept-invitation/token-123");

    component.loginForm.setValue({
      email: "player@example.com",
      password: "Password123!",
      remember: true,
    });

    component.onSubmit();
    await flushComponentWork();

    expect(mockAuthFlowDataService.resolvePostAuthRedirect).toHaveBeenCalledWith(
      {
        returnUrl: "/team/accept-invitation/token-123",
        allowReturnUrlBypassOnboarding: true,
      },
    );
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith(
      "/team/accept-invitation/token-123",
    );
  });

  it("surfaces login failures in the submit error state", async () => {
    mockAuthService.login = vi.fn().mockReturnValue(
      throwError(() => new Error("Invalid email or password.")),
    );
    component.loginForm.setValue({
      email: "player@example.com",
      password: "Password123!",
      remember: false,
    });

    component.onSubmit();
    await flushComponentWork();

    expect(component.submitError()).toBe("Invalid email or password.");
    expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
  });

  it("routes unverified users to the verification screen after login", async () => {
    mockAuthService.login = vi.fn().mockReturnValue(
      of({
        user: {
          ...testUser,
          emailConfirmed: false,
        },
        session: null,
      } satisfies AuthSessionResult),
    );
    component.loginForm.setValue({
      email: "player@example.com",
      password: "Password123!",
      remember: false,
    });

    component.onSubmit();
    await flushComponentWork();

    expect(mockAuthFlowDataService.storePendingVerificationEmail).toHaveBeenCalledWith(
      "player@example.com",
    );
    expect(mockAuthFlowDataService.signOut).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(["/verify-email"]);
    expect(mockToastService.info).toHaveBeenCalledWith(
      "Please verify your email before signing in.",
      "Verify Your Email",
    );
  });

  it("routes Supabase email-confirmation errors to the verification screen", async () => {
    mockAuthService.login = vi.fn().mockReturnValue(
      throwError(() => new Error("Please verify your email before signing in.")),
    );
    component.loginForm.setValue({
      email: "player@example.com",
      password: "Password123!",
      remember: false,
    });

    component.onSubmit();
    await flushComponentWork();

    expect(mockAuthFlowDataService.storePendingVerificationEmail).toHaveBeenCalledWith(
      "player@example.com",
    );
    expect(mockRouter.navigate).toHaveBeenCalledWith(["/verify-email"]);
    expect(component.submitError()).toBeNull();
  });
});
