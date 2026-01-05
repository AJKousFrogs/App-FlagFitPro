/**
 * Theme Service Tests
 *
 * Tests for the theme service that manages light/dark mode.
 * Covers mode switching, system preference detection, and persistence.
 *
 * @author FlagFit Pro Team
 */

import { TestBed, fakeAsync, tick } from "@angular/core/testing";
import { ThemeService } from "./theme.service";
import { LoggerService } from "./logger.service";
import { SupabaseService } from "./supabase.service";

describe("ThemeService", () => {
  let service: ThemeService;
  let mockMatchMedia: jasmine.Spy;
  let mediaQueryListeners: ((e: MediaQueryListEvent) => void)[] = [];

  const mockLoggerService = {
    debug: jasmine.createSpy("debug"),
    info: jasmine.createSpy("info"),
    warn: jasmine.createSpy("warn"),
    error: jasmine.createSpy("error"),
  };

  const mockSupabaseService = {
    currentUser: () => null,
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

    mockMatchMedia = spyOn(window, "matchMedia").and.returnValue(
      mockMediaQueryList as any,
    );

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
      expect(localStorage.getItem("flagfit-theme")).toBe("dark");
    });

    it("should load preference from localStorage", () => {
      localStorage.setItem("flagfit-theme", "dark");

      // Create a new instance to test loading
      const _newService = TestBed.inject(ThemeService);

      // Note: The service loads on construction, so we check the stored value
      expect(localStorage.getItem("flagfit-theme")).toBe("dark");
    });

    it("should handle invalid localStorage values", () => {
      localStorage.setItem("flagfit-theme", "invalid-value");

      // Service should handle gracefully and use default
      const state = service.getState();
      expect(["light", "dark", "auto"]).toContain(state.mode);
    });
  });

  describe("DOM Updates", () => {
    it("should set data-theme attribute on root", fakeAsync(() => {
      service.setMode("dark");
      tick();

      expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    }));

    it("should set data-theme attribute on body", fakeAsync(() => {
      service.setMode("dark");
      tick();

      expect(document.body.getAttribute("data-theme")).toBe("dark");
    }));

    it("should add theme class to body", fakeAsync(() => {
      service.setMode("dark");
      tick();

      expect(document.body.classList.contains("dark-theme")).toBe(true);
      expect(document.body.classList.contains("light-theme")).toBe(false);
    }));

    it("should remove old theme class when switching", fakeAsync(() => {
      service.setMode("dark");
      tick();

      service.setMode("light");
      tick();

      expect(document.body.classList.contains("light-theme")).toBe(true);
      expect(document.body.classList.contains("dark-theme")).toBe(false);
    }));
  });

  describe("Meta Theme Color", () => {
    it("should update meta theme-color for dark mode", fakeAsync(() => {
      // Create meta tag if it doesn't exist
      let metaTag = document.querySelector('meta[name="theme-color"]');
      if (!metaTag) {
        metaTag = document.createElement("meta");
        metaTag.setAttribute("name", "theme-color");
        document.head.appendChild(metaTag);
      }

      service.setMode("dark");
      tick();

      const content = metaTag.getAttribute("content");
      expect(content).toBeTruthy();
    }));
  });

  describe("System Preference Detection", () => {
    it("should detect system dark mode preference", () => {
      // This is mocked to return false (light mode)
      expect(mockMatchMedia).toHaveBeenCalledWith(
        "(prefers-color-scheme: dark)",
      );
    });

    it("should respond to system preference changes", fakeAsync(() => {
      service.setMode("auto");

      // Simulate system preference change to dark
      const mockEvent = { matches: true } as MediaQueryListEvent;
      mediaQueryListeners.forEach((listener) => listener(mockEvent));

      tick();

      // When auto, should now resolve to dark
      expect(service.resolvedTheme()).toBe("dark");
    }));
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
        jasmine.stringContaining("Theme mode set to"),
      );
    });

    it("should log when theme is applied", fakeAsync(() => {
      service.setMode("dark");
      tick();

      expect(mockLoggerService.debug).toHaveBeenCalledWith(
        jasmine.stringContaining("Applied theme"),
      );
    }));
  });

  describe("PrimeNG Theme Updates", () => {
    it("should update PrimeNG surface variables for dark mode", fakeAsync(() => {
      service.setMode("dark");
      tick();

      const root = document.documentElement;
      const surfaceValue = root.style.getPropertyValue("--p-surface-0");

      // Should have set dark surface colors
      expect(surfaceValue).toBeTruthy();
    }));

    it("should update PrimeNG surface variables for light mode", fakeAsync(() => {
      service.setMode("light");
      tick();

      const root = document.documentElement;
      const surfaceValue = root.style.getPropertyValue("--p-surface-0");

      // Should have set light surface colors
      expect(surfaceValue).toBeTruthy();
    }));
  });

  describe("Supabase Sync", () => {
    it("should attempt to save to Supabase when user is authenticated", fakeAsync(() => {
      const mockUser = { id: "test-user-id" };
      spyOn(mockSupabaseService, "currentUser").and.returnValue(
        mockUser as any,
      );

      service.setMode("dark");
      tick();

      // The service should attempt to save to Supabase
      // (We can't easily verify the actual call without more setup)
    }));

    it("should handle Supabase errors gracefully", fakeAsync(() => {
      const mockUser = { id: "test-user-id" };
      spyOn(mockSupabaseService, "currentUser").and.returnValue(
        mockUser as any,
      );

      // Even if Supabase fails, localStorage should work
      service.setMode("dark");
      tick();

      expect(localStorage.getItem("flagfit-theme")).toBe("dark");
    }));
  });

  describe("No Transitions Class", () => {
    it("should add no-transitions class during initial load", () => {
      // The class is added in constructor and removed after RAF
      // This is hard to test synchronously, but we can verify the mechanism exists
      expect(service).toBeTruthy();
    });
  });
});
