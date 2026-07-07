import { TestBed } from "@angular/core/testing";
import { PLATFORM_ID } from "@angular/core";
import { describe, it, expect, beforeEach } from "vitest";
import { PlatformService } from "./platform.service";
import { LoggerService } from "./logger.service";

const mockLoggerService = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
  success: () => {},
};

/**
 * Regression: the storage helpers were pure in-memory (a per-instance Map) and
 * never touched real localStorage/sessionStorage (SOURCE_OF_TRUTH §6). That
 * silently broke anything that must survive a page load — notably the password-
 * recovery intent, which the reset link opens in a fresh tab. These tests assert
 * the value actually lands in the real browser storage.
 */
describe("PlatformService — real browser storage", () => {
  let service: PlatformService;

  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        PlatformService,
        { provide: PLATFORM_ID, useValue: "browser" },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    });
    service = TestBed.inject(PlatformService);
  });

  it("setLocalStorage writes through to real window.localStorage", () => {
    service.setLocalStorage("k", "v");
    expect(window.localStorage.getItem("k")).toBe("v");
    expect(service.getLocalStorage("k")).toBe("v");
  });

  it("removeLocalStorage clears the real key", () => {
    window.localStorage.setItem("k", "v");
    service.removeLocalStorage("k");
    expect(window.localStorage.getItem("k")).toBeNull();
  });

  it("setSessionStorage writes through to real window.sessionStorage", () => {
    service.setSessionStorage("s", "1");
    // The in-memory bug would leave real sessionStorage empty here.
    expect(window.sessionStorage.getItem("s")).toBe("1");
    expect(service.getSessionStorage("s")).toBe("1");
  });

  it("a session value persists in real storage across a fresh service instance (mimics a new tab)", () => {
    service.setSessionStorage("recovery-intent", "1");
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        PlatformService,
        { provide: PLATFORM_ID, useValue: "browser" },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    });
    const fresh = TestBed.inject(PlatformService);
    expect(fresh.getSessionStorage("recovery-intent")).toBe("1");
  });
});
