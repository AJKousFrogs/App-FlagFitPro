import { TestBed } from "@angular/core/testing";
import type { User } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlatformService } from "../../../core/services/platform.service";
import { SupabaseService } from "../../../core/services/supabase.service";
import { AuthFlowDataService } from "./auth-flow-data.service";

const sessionStorageState: Record<string, string> = {};

const mockPlatformService = {
  getSessionStorage: vi.fn((key: string) => sessionStorageState[key] ?? null),
  setSessionStorage: vi.fn((key: string, value: string) => {
    sessionStorageState[key] = value;
    return true;
  }),
  removeSessionStorage: vi.fn((key: string) => {
    delete sessionStorageState[key];
    return true;
  }),
  getWindow: vi.fn(() => ({
    location: {
      origin: "https://webflagfootballfrogs.netlify.app",
    },
  })),
} as unknown as PlatformService;

const mockSupabaseService = {
  getCurrentUser: vi.fn(() => null),
  getSession: vi.fn(() => null),
  updateUser: vi.fn(),
  signOut: vi.fn(),
  client: {
    auth: {
      setSession: vi.fn(),
      resend: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      getSession: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
} as unknown as SupabaseService;

describe("AuthFlowDataService", () => {
  let service: AuthFlowDataService;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(sessionStorageState).forEach((key) => {
      delete sessionStorageState[key];
    });

    TestBed.configureTestingModule({
      providers: [
        AuthFlowDataService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: PlatformService, useValue: mockPlatformService },
      ],
    });

    service = TestBed.inject(AuthFlowDataService);
  });

  it("stores only safe internal post-onboarding redirects", () => {
    expect(service.storePostOnboardingRedirect("/team/invitations")).toBe(true);
    expect(sessionStorageState["postOnboardingRedirect"]).toBe(
      "/team/invitations",
    );

    expect(service.storePostOnboardingRedirect("https://example.com")).toBe(
      false,
    );
    expect(service.storePostOnboardingRedirect("//example.com")).toBe(false);
    expect(sessionStorageState["postOnboardingRedirect"]).toBe(
      "/team/invitations",
    );
  });

  it("tracks a short-lived password recovery intent", () => {
    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(1_000_000);

    expect(service.markPasswordRecoveryIntent()).toBe(true);
    expect(service.hasActivePasswordRecoveryIntent()).toBe(true);

    nowSpy.mockReturnValue(1_000_000 + 11 * 60 * 1000);
    expect(service.hasActivePasswordRecoveryIntent()).toBe(false);
    expect(sessionStorageState["passwordRecoveryIntentAt"]).toBeUndefined();

    nowSpy.mockRestore();
  });

  it("consumes and clears a stored redirect", () => {
    sessionStorageState["postOnboardingRedirect"] = "/community";

    expect(service.consumePostOnboardingRedirect()).toBe("/community");
    expect(sessionStorageState["postOnboardingRedirect"]).toBeUndefined();
    expect(service.consumePostOnboardingRedirect()).toBeNull();
  });

  it("stores and clears the pending verification email", () => {
    expect(
      service.storePendingVerificationEmail(" PLAYER@EXAMPLE.COM "),
    ).toBe(true);
    expect(sessionStorageState["pendingVerificationEmail"]).toBe(
      "player@example.com",
    );
    expect(service.getPendingVerificationEmail()).toBe("player@example.com");
    expect(service.clearPendingVerificationEmail()).toBe(true);
    expect(service.getPendingVerificationEmail()).toBeNull();
  });

  it("builds the hosted auth callback URL from the current app origin", () => {
    expect(service.getEmailVerificationRedirectUrl()).toBe(
      "https://webflagfootballfrogs.netlify.app/auth/callback",
    );
  });

  it("routes incomplete users to onboarding by default", async () => {
    vi.spyOn(service, "getCurrentUser").mockReturnValue({
      id: "user-123",
    } as User);
    vi.spyOn(service, "getUserOnboardingStatus").mockResolvedValue({
      data: { onboarding_completed: false },
      error: null,
    });

    await expect(service.resolvePostAuthRedirect()).resolves.toBe("/onboarding");
  });

  it("allows a trusted returnUrl to bypass onboarding when requested", async () => {
    vi.spyOn(service, "getCurrentUser").mockReturnValue({
      id: "user-123",
    } as User);
    vi.spyOn(service, "getUserOnboardingStatus").mockResolvedValue({
      data: { onboarding_completed: false },
      error: null,
    });

    await expect(
      service.resolvePostAuthRedirect({
        returnUrl: "/team/accept-invitation/token-123",
        allowReturnUrlBypassOnboarding: true,
      }),
    ).resolves.toBe("/team/accept-invitation/token-123");
  });

  it("prefers a stored redirect for onboarded users", async () => {
    sessionStorageState["postOnboardingRedirect"] = "/team/accept-invitation";
    vi.spyOn(service, "getCurrentUser").mockReturnValue({
      id: "user-123",
    } as User);
    vi.spyOn(service, "getUserOnboardingStatus").mockResolvedValue({
      data: { onboarding_completed: true },
      error: null,
    });

    await expect(service.resolvePostAuthRedirect()).resolves.toBe(
      "/team/accept-invitation",
    );
    expect(sessionStorageState["postOnboardingRedirect"]).toBeUndefined();
  });
});
