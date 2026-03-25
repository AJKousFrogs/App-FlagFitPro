import { HttpBackend } from "@angular/common/http";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute, Router } from "@angular/router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { of } from "rxjs";
import {
  AuthService,
  AuthSessionResult,
  User,
} from "../../../core/services/auth.service";
import { LoggerService } from "../../../core/services/logger.service";
import { ToastService } from "../../../core/services/toast.service";
import { AuthFlowDataService } from "../services/auth-flow-data.service";
import { RegisterComponent } from "./register.component";

describe("RegisterComponent", () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;

  const testUser: User = {
    id: "user-123",
    email: "player@example.com",
    name: "Player One",
    emailConfirmed: false,
  };

  const registerResult: AuthSessionResult = {
    user: testUser,
    session: null,
    message: "Please check your email to verify your account.",
  };

  const mockAuthService = {
    register: vi.fn().mockReturnValue(of(registerResult)),
  } as unknown as AuthService;

  const mockAuthFlowDataService = {
    getCurrentSession: vi.fn().mockReturnValue(null),
    getEmailVerificationRedirectUrl: vi
      .fn()
      .mockReturnValue("https://webflagfootballfrogs.netlify.app/auth/callback"),
    storePostOnboardingRedirect: vi.fn(),
    storePendingVerificationEmail: vi.fn(),
  } as unknown as AuthFlowDataService;

  const mockToastService = {
    success: vi.fn(),
    error: vi.fn(),
  } as unknown as ToastService;

  const mockLoggerService = {
    warn: vi.fn(),
  } as unknown as LoggerService;

  const mockRouter = {
    navigate: vi.fn(),
  } as unknown as Router;

  const mockActivatedRoute = {
    snapshot: {
      queryParams: {} as Record<string, string>,
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockActivatedRoute.snapshot.queryParams = {};

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: AuthFlowDataService, useValue: mockAuthFlowDataService },
        { provide: ToastService, useValue: mockToastService },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        {
          provide: HttpBackend,
          useValue: {
            handle: vi.fn(),
          },
        },
      ],
    })
      .overrideComponent(RegisterComponent, {
        set: { template: "" },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  async function flushComponentWork(): Promise<void> {
    await fixture.whenStable();
    await Promise.resolve();
  }

  it("sends signup confirmation through the hosted auth callback", async () => {
    component.registerForm.setValue({
      name: "Player One",
      email: "PLAYER@EXAMPLE.COM",
      password: "Password1!",
      confirmPassword: "Password1!",
      ageVerification: true,
      termsAccepted: true,
    });

    await component.onSubmit();
    await flushComponentWork();

    expect(mockAuthService.register).toHaveBeenCalledWith({
      name: "Player One",
      email: "player@example.com",
      password: "Password1!",
      redirectTo: "https://webflagfootballfrogs.netlify.app/auth/callback",
    });
    expect(mockAuthFlowDataService.storePendingVerificationEmail).toHaveBeenCalledWith(
      "player@example.com",
    );
    expect(mockRouter.navigate).toHaveBeenCalledWith(["/verify-email"]);
  });

  it("preserves a safe returnUrl until onboarding is finished", async () => {
    mockActivatedRoute.snapshot.queryParams = {
      returnUrl: "/accept-invitation?token=invite-123",
    };

    const redirectedFixture = TestBed.createComponent(RegisterComponent);
    redirectedFixture.detectChanges();
    const redirectedComponent = redirectedFixture.componentInstance;

    redirectedComponent.registerForm.setValue({
      name: "Player One",
      email: "player@example.com",
      password: "Password1!",
      confirmPassword: "Password1!",
      ageVerification: true,
      termsAccepted: true,
    });

    await redirectedComponent.onSubmit();
    await redirectedFixture.whenStable();

    expect(
      mockAuthFlowDataService.storePostOnboardingRedirect,
    ).toHaveBeenCalledWith("/accept-invitation?token=invite-123");
    expect(mockRouter.navigate).toHaveBeenCalledWith(["/verify-email"]);
  });
});
