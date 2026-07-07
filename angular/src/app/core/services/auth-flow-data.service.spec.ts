import { TestBed } from "@angular/core/testing";
import { PLATFORM_ID } from "@angular/core";
import { describe, it, expect, beforeEach } from "vitest";
import { AuthFlowDataService } from "./auth-flow-data.service";
import { SupabaseService } from "./supabase.service";
import { HomeRouteService } from "./home-route.service";
import { PlatformService } from "./platform.service";
import { LoggerService } from "./logger.service";

const noopLogger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
  success: () => {},
};

/**
 * Regression: the PASSWORD_RECOVERY auth event never called
 * markPasswordRecoveryIntent(), so UpdatePasswordComponent (which gates the
 * "set new password" form on hasActivePasswordRecoveryIntent()) always reported
 * the reset link as invalid — password reset was permanently broken
 * (SOURCE_OF_TRUTH §6). These tests lock the intent set → detect → expire cycle,
 * using the REAL PlatformService so they also prove it round-trips through real
 * sessionStorage (the other half of the same bug).
 */
describe("AuthFlowDataService — password-recovery intent", () => {
  let service: AuthFlowDataService;

  beforeEach(() => {
    window.sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        AuthFlowDataService,
        PlatformService,
        { provide: PLATFORM_ID, useValue: "browser" },
        { provide: LoggerService, useValue: noopLogger },
        { provide: SupabaseService, useValue: {} },
        { provide: HomeRouteService, useValue: {} },
      ],
    });
    service = TestBed.inject(AuthFlowDataService);
  });

  it("marks the intent and detects it as active", () => {
    expect(service.hasActivePasswordRecoveryIntent()).toBe(false);
    service.markPasswordRecoveryIntent();
    expect(service.hasActivePasswordRecoveryIntent()).toBe(true);
    // Persisted in real sessionStorage (survives the fresh-tab reset link).
    expect(
      window.sessionStorage.getItem("passwordRecoveryIntentAt"),
    ).toBeTruthy();
  });

  it("treats a >10-minute-old intent as expired and clears it", () => {
    const elevenMinutesAgo = Date.now() - 11 * 60 * 1000;
    window.sessionStorage.setItem(
      "passwordRecoveryIntentAt",
      String(elevenMinutesAgo),
    );
    expect(service.hasActivePasswordRecoveryIntent()).toBe(false);
    expect(
      window.sessionStorage.getItem("passwordRecoveryIntentAt"),
    ).toBeNull();
  });

  it("clearPasswordRecoveryIntent removes an active intent", () => {
    service.markPasswordRecoveryIntent();
    service.clearPasswordRecoveryIntent();
    expect(service.hasActivePasswordRecoveryIntent()).toBe(false);
  });
});
