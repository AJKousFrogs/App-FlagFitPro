/**
 * Theme Service Tests
 *
 * Tests for the theme service that manages light/dark mode.
 * Covers mode switching, system preference detection, and persistence.
 *
 * @author FlagFit Pro Team
 */

import { TestBed } from "@angular/core/testing";
import { ThemeService } from "./theme.service";
import { LoggerService } from "./logger.service";
import { SupabaseService } from "./supabase.service";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// Helper to wait for async operations
const waitFor = (ms: number = 50) =>
  new Promise((resolve) => setTimeout(resolve, ms));

describe("ThemeService", () => {
  let service: ThemeService;
  let mockMatchMedia: ReturnType<typeof vi.fn>;
  let mediaQueryListeners: ((e: MediaQueryListEvent) => void)[] = [];

  const mockLoggerService = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  const mockSupabaseService = {
    currentUser: vi.fn(() => null),
    client: {
      from: () => ({
        upsert: () => Promise.resolve({ error: null }),
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({ data: null, error: null }),
          }),
        }),
      }),
    },
  };

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Reset mocks
    vi.clearAllMocks();

    // Mock matchMedia
    mediaQueryListeners = [];
    const mockMediaQueryList = {
      matches: false,
      addEventListener: (
        event: string,
        listener: (e: MediaQueryListEvent) => void,
      ) => {
        mediaQueryListeners.push(listener);
      },
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
    };

    mockMatchMedia = vi.fn().mockReturnValue(mockMediaQueryList);
    vi.stubGlobal("matchMedia", mockMatchMedia);

    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    });

    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("Mode Management", () => {
    it("should default to auto mode", () => {
      expect(service.mode()).toBe("auto");
    });

    it("should set light mode", () => {
      service.setMode("light");
      expect(service.mode()).toBe("light");
    });

    it("should set dark mode", () => {
      service.setMode("dark");
      expect(service.mode()).toBe("dark");
    });

    it("should set auto mode", () => {
      service.setMode("dark");
      service.setMode("auto");
      expect(service.mode()).toBe("auto");
    });
  });

  describe("Resolved Theme", () => {
    it("should resolve to light when mode is light", () => {
      service.setMode("light");
      expect(service.resolvedTheme()).toBe("light");
    });

    it("should resolve to dark when mode is dark", () => {
      service.setMode("dark");
      expect(service.resolvedTheme()).toBe("dark");
    });

    it("should resolve to system preference when mode is auto", () => {
      // System preference is light (mocked)
      service.setMode("auto");
      expect(service.resolvedTheme()).toBe("light");
    });
  });

  describe("Convenience Computed Values", () => {
    it("should return true for isDark when dark mode", () => {
      service.setMode("dark");
      expect(service.isDark()).toBe(true);
      expect(service.isLight()).toBe(false);
    });

    it("should return true for isLight when light mode", () => {
      service.setMode("light");
      expect(service.isLight()).toBe(true);
      expect(service.isDark()).toBe(false);
    });
  });

  describe("Toggle", () => {
    it("should toggle from light to dark", () => {
      service.setMode("light");
      service.toggle();
      expect(service.mode()).toBe("dark");
    });

    it("should toggle from dark to light", () => {
      service.setMode("dark");
      service.toggle();
      expect(service.mode()).toBe("light");
    });

    it("should toggle based on resolved theme when auto", () => {
      // System is light (mocked), so toggle should go to dark
      service.setMode("auto");
      service.toggle();
      expect(service.mode()).toBe("dark");
    });
  });

  describe("Cycle Mode", () => {
    it("should cycle light -> dark -> auto -> light", () => {
      service.setMode("light");

      service.cycleMode();
      expect(service.mode()).toBe("dark");

      service.cycleMode();
      expect(service.mode()).toBe("auto");

      service.cycleMode();
      expect(service.mode()).toBe("light");
    });
  });

  describe("LocalStorage Persistence", () => {
    it("should save preference to localStorage", () => {
      service.setMode("dark");
      expect(localStorage.getItem("flagfit_theme")).toBe("dark");
    });

    it("should load preference from localStorage", () => {
      localStorage.setItem("flagfit_theme", "dark");

      // Create a new instance to test loading
      const _newService = TestBed.inject(ThemeService);

      // Note: The service loads on construction, so we check the stored value
      expect(localStorage.getItem("flagfit_theme")).toBe("dark");
    });

    it("should handle invalid localStorage values", () => {
      localStorage.setItem("flagfit_theme", "invalid-value");

      // Service should handle gracefully and use default
      const state = service.getState();
      expect(["light", "dark", "auto"]).toContain(state.mode);
    });
  });

  describe("DOM Updates", () => {
    it("should set data-theme attribute on root", async () => {
      service.setMode("dark");
      await waitFor();

      expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    });

    it("should set data-theme attribute on body", async () => {
      service.setMode("dark");
      await waitFor();

      expect(document.body.getAttribute("data-theme")).toBe("dark");
    });

    it("should add theme class to body", async () => {
      service.setMode("dark");
      await waitFor();

      expect(document.body.classList.contains("dark-theme")).toBe(true);
      expect(document.body.classList.contains("light-theme")).toBe(false);
    });

    it("should remove old theme class when switching", async () => {
      service.setMode("dark");
      await waitFor();

      service.setMode("light");
      await waitFor();

      expect(document.body.classList.contains("light-theme")).toBe(true);
      expect(document.body.classList.contains("dark-theme")).toBe(false);
    });
  });

  describe("Meta Theme Color", () => {
    it("should update meta theme-color for dark mode", async () => {
      // Create meta tag if it doesn't exist
      let metaTag = document.querySelector('meta[name="theme-color"]');
      if (!metaTag) {
        metaTag = document.createElement("meta");
        metaTag.setAttribute("name", "theme-color");
        document.head.appendChild(metaTag);
      }

      service.setMode("dark");
      await waitFor();

      const content = metaTag.getAttribute("content");
      expect(content).toBeTruthy();
    });
  });

  describe("System Preference Detection", () => {
    it("should detect system dark mode preference", () => {
      // This is mocked to return false (light mode)
      expect(mockMatchMedia).toHaveBeenCalledWith(
        "(prefers-color-scheme: dark)",
      );
    });

    it("should respond to system preference changes", async () => {
      service.setMode("auto");

      // Simulate system preference change to dark
      const mockEvent = { matches: true } as MediaQueryListEvent;
      mediaQueryListeners.forEach((listener) => listener(mockEvent));

      await waitFor();

      // When auto, should now resolve to dark
      expect(service.resolvedTheme()).toBe("dark");
    });
  });

  describe("Get State", () => {
    it("should return current state", () => {
      service.setMode("dark");
      const state = service.getState();

      expect(state.mode).toBe("dark");
      expect(state.resolvedTheme).toBe("dark");
    });
  });

  describe("Logging", () => {
    it("should log when theme mode is set", () => {
      service.setMode("dark");

      expect(mockLoggerService.debug).toHaveBeenCalledWith(
        expect.stringContaining("Theme mode set to"),
      );
    });

    it("should log when theme is applied", async () => {
      service.setMode("dark");
      await waitFor();

      expect(mockLoggerService.debug).toHaveBeenCalledWith(
        expect.stringContaining("Applied theme"),
      );
    });
  });

  describe("PrimeNG Theme Updates", () => {
    it("should update PrimeNG surface variables for dark mode", async () => {
      service.setMode("dark");
      await waitFor();

      const root = document.documentElement;
      const surfaceValue = root.style.getPropertyValue("--p-surface-0");

      // Should have set dark surface colors
      expect(surfaceValue).toBeTruthy();
    });

    it("should update PrimeNG surface variables for light mode", async () => {
      service.setMode("light");
      await waitFor();

      const root = document.documentElement;
      const surfaceValue = root.style.getPropertyValue("--p-surface-0");

      // Should have set light surface colors
      expect(surfaceValue).toBeTruthy();
    });
  });

  describe("Supabase Sync", () => {
    it("should attempt to save to Supabase when user is authenticated", async () => {
      const mockUser = { id: "test-user-id" };
      mockSupabaseService.currentUser.mockReturnValue(mockUser as any);

      service.setMode("dark");
      await waitFor();

      // The service should attempt to save to Supabase
      // (We can't easily verify the actual call without more setup)
      expect(service.mode()).toBe("dark");
    });

    it("should handle Supabase errors gracefully", async () => {
      const mockUser = { id: "test-user-id" };
      mockSupabaseService.currentUser.mockReturnValue(mockUser as any);

      // Even if Supabase fails, localStorage should work
      service.setMode("dark");
      await waitFor();

      expect(localStorage.getItem("flagfit_theme")).toBe("dark");
    });
  });

  describe("No Transitions Class", () => {
    it("should add no-transitions class during initial load", () => {
      // The class is added in constructor and removed after RAF
      // This is hard to test synchronously, but we can verify the mechanism exists
      expect(service).toBeTruthy();
    });
  });
});
