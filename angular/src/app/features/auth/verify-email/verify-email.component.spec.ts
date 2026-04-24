import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HomeRouteService } from "../../../core/services/home-route.service";
import { ToastService } from "../../../core/services/toast.service";
import { AuthFlowDataService } from "../services/auth-flow-data.service";
import { VerifyEmailComponent } from "./verify-email.component";

describe("VerifyEmailComponent", () => {
  let fixture: ComponentFixture<VerifyEmailComponent>;
  let component: VerifyEmailComponent;

  const mockAuthFlowDataService = {
    getCurrentSession: vi.fn(),
    setSession: vi.fn(),
    getCurrentUser: vi.fn(),
    getPendingVerificationEmail: vi.fn(),
    clearPendingVerificationEmail: vi.fn(),
    getEmailVerificationRedirectUrl: vi.fn(),
    resendVerificationEmail: vi.fn(),
    resolvePostAuthRedirect: vi.fn(),
  } as unknown as AuthFlowDataService;

  const mockToastService = {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  } as unknown as ToastService;

  const mockRouter = {
    navigate: vi.fn(),
    navigateByUrl: vi.fn(),
  } as unknown as Router;

  const mockHomeRouteService = {
    getHomeRoute: vi.fn(() => "/todays-practice"),
  } as unknown as HomeRouteService;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/verify-email");

    mockAuthFlowDataService.getCurrentSession = vi.fn().mockReturnValue(null);
    mockAuthFlowDataService.setSession = vi.fn();
    mockAuthFlowDataService.getCurrentUser = vi.fn().mockReturnValue(null);
    mockAuthFlowDataService.getPendingVerificationEmail = vi.fn().mockReturnValue(
      null,
    );
    mockAuthFlowDataService.clearPendingVerificationEmail = vi.fn();
    mockAuthFlowDataService.getEmailVerificationRedirectUrl = vi
      .fn()
      .mockReturnValue(
        "https://webflagfootballfrogs.netlify.app/auth/callback",
      );
    mockAuthFlowDataService.resendVerificationEmail = vi.fn().mockResolvedValue({
      error: null,
    });
    mockAuthFlowDataService.resolvePostAuthRedirect = vi
      .fn()
      .mockResolvedValue("/todays-practice");
    mockRouter.navigate = vi.fn();
    mockRouter.navigateByUrl = vi.fn();

    await TestBed.configureTestingModule({
      imports: [VerifyEmailComponent],
      providers: [
        { provide: AuthFlowDataService, useValue: mockAuthFlowDataService },
        { provide: HomeRouteService, useValue: mockHomeRouteService },
        { provide: ToastService, useValue: mockToastService },
        { provide: Router, useValue: mockRouter },
      ],
    })
      .overrideComponent(VerifyEmailComponent, {
        set: { template: "" },
      })
      .compileComponents();

    fixture = TestBed.createComponent(VerifyEmailComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.useRealTimers();
    window.history.replaceState({}, "", "/verify-email");
  });

  async function initializeComponent(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it("redirects a directly opened verified session through the shared resolver", async () => {
    mockAuthFlowDataService.getCurrentSession = vi.fn().mockReturnValue({
      user: {
        email_confirmed_at: "2026-03-25T12:00:00Z",
      },
    });
    mockAuthFlowDataService.resolvePostAuthRedirect = vi
      .fn()
      .mockResolvedValue("/onboarding");

    await initializeComponent();
    await vi.advanceTimersByTimeAsync(2000);

    expect(component.isVerified()).toBe(true);
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith("/onboarding");
  });

  it("verifies signup tokens and redirects after success", async () => {
    window.history.replaceState(
      {},
      "",
      "/verify-email#access_token=abc&refresh_token=def&type=signup",
    );
    mockAuthFlowDataService.setSession = vi.fn().mockResolvedValue({
      data: {
        session: {
          user: {
            email: "player@example.com",
            email_confirmed_at: "2026-03-25T12:00:00Z",
          },
        },
      },
      error: null,
    });

    await initializeComponent();
    await vi.advanceTimersByTimeAsync(2000);

    expect(component.isVerified()).toBe(true);
    expect(mockToastService.success).toHaveBeenCalled();
    expect(mockAuthFlowDataService.clearPendingVerificationEmail).toHaveBeenCalled();
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith("/todays-practice");
  });

  it("shows a verification error from the callback hash", async () => {
    window.history.replaceState(
      {},
      "",
      "/verify-email#error_description=Link%20expired",
    );

    await initializeComponent();

    expect(component.verificationError()).toBe("Link expired");
    expect(component.isVerifying()).toBe(false);
  });

  it("resends verification email using the current authenticated user", async () => {
    mockAuthFlowDataService.getCurrentUser = vi.fn().mockReturnValue({
      email: "player@example.com",
    });

    await initializeComponent();
    await component.resendVerification();

    expect(mockAuthFlowDataService.resendVerificationEmail).toHaveBeenCalledWith({
      email: "player@example.com",
      redirectTo: "https://webflagfootballfrogs.netlify.app/auth/callback",
    });
    expect(mockToastService.success).toHaveBeenCalled();
  });

  it("uses a stored pending verification email when no session exists", async () => {
    mockAuthFlowDataService.getPendingVerificationEmail = vi
      .fn()
      .mockReturnValue("pending@example.com");

    await initializeComponent();
    await component.resendVerification();

    expect(mockAuthFlowDataService.resendVerificationEmail).toHaveBeenCalledWith({
      email: "pending@example.com",
      redirectTo: "https://webflagfootballfrogs.netlify.app/auth/callback",
    });
  });

  it("redirects to login when no email is available for resend", async () => {
    await initializeComponent();
    await component.resendVerification();

    expect(mockToastService.error).toHaveBeenCalledWith(
      "No email address found. Please try logging in again.",
    );
    expect(mockRouter.navigate).toHaveBeenCalledWith(["/login"]);
  });
});
