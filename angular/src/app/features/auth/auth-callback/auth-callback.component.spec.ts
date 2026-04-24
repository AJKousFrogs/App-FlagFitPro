import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LoggerService } from "../../../core/services/logger.service";
import { HomeRouteService } from "../../../core/services/home-route.service";
import { ToastService } from "../../../core/services/toast.service";
import { AuthFlowDataService } from "../services/auth-flow-data.service";
import { AuthCallbackComponent } from "./auth-callback.component";

describe("AuthCallbackComponent", () => {
  let fixture: ComponentFixture<AuthCallbackComponent>;
  let component: AuthCallbackComponent;

  const mockAuthFlowDataService = {
    getCurrentSession: vi.fn(),
    setSession: vi.fn(),
    resolvePostAuthRedirect: vi.fn(),
    markPasswordRecoveryIntent: vi.fn(),
    clearPendingVerificationEmail: vi.fn(),
  } as unknown as AuthFlowDataService;

  const mockToastService = {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  } as unknown as ToastService;

  const mockLoggerService = {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  } as unknown as LoggerService;

  const mockRouter = {
    navigate: vi.fn(),
    navigateByUrl: vi.fn(),
  } as unknown as Router;

  const mockHomeRouteService = {
    getHomeRoute: vi.fn(() => "/todays-practice"),
  } as unknown as HomeRouteService;

  const mockBroadcastChannel = {
    postMessage: vi.fn(),
    close: vi.fn(),
  };

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/auth/callback");
    localStorage.removeItem("flagfit_email_verified");

    mockAuthFlowDataService.getCurrentSession = vi.fn().mockReturnValue(null);
    mockAuthFlowDataService.setSession = vi.fn();
    mockAuthFlowDataService.resolvePostAuthRedirect = vi
      .fn()
      .mockResolvedValue("/todays-practice");
    mockAuthFlowDataService.markPasswordRecoveryIntent = vi.fn();
    mockAuthFlowDataService.clearPendingVerificationEmail = vi.fn();
    mockRouter.navigate = vi.fn();
    mockRouter.navigateByUrl = vi.fn();

    vi.stubGlobal(
      "BroadcastChannel",
      vi.fn(() => mockBroadcastChannel) as unknown as typeof BroadcastChannel,
    );

    await TestBed.configureTestingModule({
      imports: [AuthCallbackComponent],
      providers: [
        { provide: AuthFlowDataService, useValue: mockAuthFlowDataService },
        { provide: HomeRouteService, useValue: mockHomeRouteService },
        { provide: ToastService, useValue: mockToastService },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: Router, useValue: mockRouter },
      ],
    })
      .overrideComponent(AuthCallbackComponent, {
        set: { template: "" },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AuthCallbackComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    window.history.replaceState({}, "", "/auth/callback");
    localStorage.removeItem("flagfit_email_verified");
  });

  async function initializeComponent(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it("shows an error when opened without auth data or session", async () => {
    await initializeComponent();

    expect(component.error()).toContain("No authentication data found");
    expect(component.isProcessing()).toBe(false);
  });

  it("redirects an already authenticated user through the shared resolver", async () => {
    mockAuthFlowDataService.getCurrentSession = vi.fn().mockReturnValue({
      user: { id: "user-123" },
    });

    await initializeComponent();
    await vi.advanceTimersByTimeAsync(1500);

    expect(component.success()).toBe(true);
    expect(component.successMessage()).toBe("You are already signed in!");
    expect(mockAuthFlowDataService.resolvePostAuthRedirect).toHaveBeenCalled();
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith("/todays-practice");
  });

  it("handles signup callback and redirects after verification", async () => {
    window.history.replaceState(
      {},
      "",
      "/auth/callback#access_token=abc&refresh_token=def&type=signup",
    );
    mockAuthFlowDataService.setSession = vi.fn().mockResolvedValue({
      data: {
        session: {
          user: {
            id: "user-123",
            email: "player@example.com",
            email_confirmed_at: "2026-03-25T12:00:00Z",
          },
        },
      },
      error: null,
    });
    mockAuthFlowDataService.resolvePostAuthRedirect = vi
      .fn()
      .mockResolvedValue("/onboarding");

    await initializeComponent();
    await vi.advanceTimersByTimeAsync(1500);

    expect(component.success()).toBe(true);
    expect(component.successMessage()).toBe("Email verified successfully!");
    expect(mockToastService.success).toHaveBeenCalled();
    expect(mockAuthFlowDataService.clearPendingVerificationEmail).toHaveBeenCalled();
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith("/onboarding");
  });

  it("handles recovery callback and routes to update-password", async () => {
    window.history.replaceState(
      {},
      "",
      "/auth/callback#access_token=abc&refresh_token=def&type=recovery",
    );
    mockAuthFlowDataService.setSession = vi.fn().mockResolvedValue({
      data: {
        session: {
          user: {
            id: "user-123",
            email: "player@example.com",
          },
        },
      },
      error: null,
    });

    await initializeComponent();
    await vi.advanceTimersByTimeAsync(1500);

    expect(mockAuthFlowDataService.markPasswordRecoveryIntent).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(["/update-password"]);
  });

  it("shows an auth error when session establishment fails", async () => {
    window.history.replaceState(
      {},
      "",
      "/auth/callback#access_token=abc&refresh_token=def&type=magiclink",
    );
    mockAuthFlowDataService.setSession = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "Session failed" },
    });

    await initializeComponent();

    expect(component.error()).toBe("Session failed");
    expect(component.isProcessing()).toBe(false);
    expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
  });
});
