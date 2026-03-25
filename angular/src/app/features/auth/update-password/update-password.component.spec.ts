import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { LoggerService } from "../../../core/services/logger.service";
import { ToastService } from "../../../core/services/toast.service";
import { AuthFlowDataService } from "../services/auth-flow-data.service";
import { UpdatePasswordComponent } from "./update-password.component";

describe("UpdatePasswordComponent", () => {
  let fixture: ComponentFixture<UpdatePasswordComponent>;
  let component: UpdatePasswordComponent;

  const mockAuthFlowDataService = {
    getSession: vi.fn(),
    markPasswordRecoveryIntent: vi.fn(),
    hasActivePasswordRecoveryIntent: vi.fn(),
    clearPasswordRecoveryIntent: vi.fn(),
    updateAuthUser: vi.fn(),
    signOut: vi.fn(),
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
  } as unknown as Router;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/update-password");

    mockAuthFlowDataService.getSession = vi.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mockAuthFlowDataService.markPasswordRecoveryIntent = vi.fn();
    mockAuthFlowDataService.hasActivePasswordRecoveryIntent = vi
      .fn()
      .mockReturnValue(false);
    mockAuthFlowDataService.clearPasswordRecoveryIntent = vi.fn();
    mockAuthFlowDataService.updateAuthUser = vi.fn().mockResolvedValue({
      error: null,
    });
    mockAuthFlowDataService.signOut = vi.fn().mockResolvedValue(undefined);
    mockRouter.navigate = vi.fn();

    await TestBed.configureTestingModule({
      imports: [UpdatePasswordComponent],
      providers: [
        { provide: AuthFlowDataService, useValue: mockAuthFlowDataService },
        { provide: ToastService, useValue: mockToastService },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: Router, useValue: mockRouter },
      ],
    })
      .overrideComponent(UpdatePasswordComponent, {
        set: { template: "" },
      })
      .compileComponents();

    fixture = TestBed.createComponent(UpdatePasswordComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    vi.useRealTimers();
    window.history.replaceState({}, "", "/update-password");
  });

  async function initializeComponent(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it("marks direct visits without recovery context as invalid", async () => {
    await initializeComponent();

    expect(component.isCheckingSession()).toBe(false);
    expect(component.isValidRecoverySession()).toBe(false);
    expect(mockAuthFlowDataService.clearPasswordRecoveryIntent).toHaveBeenCalled();
  });

  it("accepts a recovery session when recovery tokens are present", async () => {
    window.history.replaceState(
      {},
      "",
      "/update-password#access_token=test-token&type=recovery",
    );
    mockAuthFlowDataService.getSession = vi.fn().mockResolvedValue({
      data: {
        session: {
          user: { id: "user-123" },
        },
      },
      error: null,
    });
    mockAuthFlowDataService.hasActivePasswordRecoveryIntent = vi
      .fn()
      .mockReturnValue(true);

    await initializeComponent();

    expect(mockAuthFlowDataService.markPasswordRecoveryIntent).toHaveBeenCalled();
    expect(component.isValidRecoverySession()).toBe(true);
    expect(mockToastService.info).toHaveBeenCalled();
  });

  it("updates the password, clears recovery intent, and returns to login", async () => {
    await initializeComponent();
    component.isValidRecoverySession.set(true);
    component.passwordForm.setValue({
      password: "Password123",
      confirmPassword: "Password123",
    });

    const submitPromise = component.onSubmit();
    await submitPromise;
    await vi.runAllTimersAsync();

    expect(mockAuthFlowDataService.updateAuthUser).toHaveBeenCalledWith({
      password: "Password123",
    });
    expect(mockAuthFlowDataService.clearPasswordRecoveryIntent).toHaveBeenCalled();
    expect(mockAuthFlowDataService.signOut).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(["/login"]);
    expect(mockToastService.success).toHaveBeenCalled();
  });
});
