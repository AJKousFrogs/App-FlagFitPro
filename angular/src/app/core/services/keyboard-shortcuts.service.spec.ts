/**
 * Keyboard Shortcuts Service Tests
 *
 * Tests for the global keyboard shortcuts service.
 * Covers shortcut registration, execution, and cleanup.
 *
 * @author FlagFit Pro Team
 */

import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import {
  KeyboardShortcutsService,
  KeyboardShortcut,
} from "./keyboard-shortcuts.service";
import { LoggerService } from "./logger.service";

describe("KeyboardShortcutsService", () => {
  let service: KeyboardShortcutsService;

  const mockLoggerService = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        KeyboardShortcutsService,
        provideRouter([]),
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    });

    service = TestBed.inject(KeyboardShortcutsService);
  });

  afterEach(() => {
    service.ngOnDestroy();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("Initialization", () => {
    it("should have default shortcuts registered", () => {
      const shortcuts = service.shortcuts();
      expect(shortcuts.length).toBeGreaterThan(0);
    });

    it("should have search shortcut registered", () => {
      const shortcuts = service.shortcuts();
      const searchShortcut = shortcuts.find((s) => s.id === "search");
      expect(searchShortcut).toBeDefined();
      expect(searchShortcut?.keys).toContain("ctrl+k");
    });

    it("should have help shortcut registered", () => {
      const shortcuts = service.shortcuts();
      const helpShortcut = shortcuts.find((s) => s.id === "help");
      expect(helpShortcut).toBeDefined();
    });
  });

  describe("Shortcut Registration", () => {
    it("should register a new shortcut", () => {
      const shortcut: KeyboardShortcut = {
        id: "test-shortcut",
        keys: ["ctrl+t"],
        description: "Test shortcut",
        category: "actions",
        action: vi.fn(),
      };

      service.register(shortcut);

      const shortcuts = service.shortcuts();
      const registered = shortcuts.find((s) => s.id === "test-shortcut");
      expect(registered).toBeDefined();
      expect(registered?.description).toBe("Test shortcut");
    });

    it("should unregister a shortcut", () => {
      const shortcut: KeyboardShortcut = {
        id: "temp-shortcut",
        keys: ["ctrl+x"],
        description: "Temporary",
        category: "actions",
        action: vi.fn(),
      };

      service.register(shortcut);
      expect(service.shortcuts().find((s) => s.id === "temp-shortcut")).toBeDefined();

      service.unregister("temp-shortcut");
      expect(service.shortcuts().find((s) => s.id === "temp-shortcut")).toBeUndefined();
    });
  });

  describe("Enable/Disable", () => {
    it("should enable/disable specific shortcut", () => {
      const shortcut: KeyboardShortcut = {
        id: "toggle-shortcut",
        keys: ["ctrl+y"],
        description: "Toggle test",
        category: "actions",
        action: vi.fn(),
        enabled: true,
      };

      service.register(shortcut);

      service.setEnabled("toggle-shortcut", false);
      const disabled = service.shortcuts().find((s) => s.id === "toggle-shortcut");
      expect(disabled?.enabled).toBe(false);

      service.setEnabled("toggle-shortcut", true);
      const enabled = service.shortcuts().find((s) => s.id === "toggle-shortcut");
      expect(enabled?.enabled).toBe(true);
    });

    it("should enable/disable all shortcuts globally", () => {
      expect(service.isEnabled()).toBe(true);

      service.setGlobalEnabled(false);
      expect(service.isEnabled()).toBe(false);

      service.setGlobalEnabled(true);
      expect(service.isEnabled()).toBe(true);
    });
  });

  describe("Shortcuts by Category", () => {
    it("should group shortcuts by category", () => {
      const byCategory = service.shortcutsByCategory();
      expect(byCategory.has("navigation")).toBe(true);
      expect(byCategory.has("help")).toBe(true);
    });

    it("should have navigation shortcuts", () => {
      const byCategory = service.shortcutsByCategory();
      const navigation = byCategory.get("navigation");
      expect(navigation).toBeDefined();
      expect(navigation!.length).toBeGreaterThan(0);
    });
  });

  describe("Help Modal", () => {
    it("should toggle help modal", () => {
      expect(service.isHelpModalOpen()).toBe(false);

      service.toggleHelpModal();
      expect(service.isHelpModalOpen()).toBe(true);

      service.toggleHelpModal();
      expect(service.isHelpModalOpen()).toBe(false);
    });

    it("should open help modal", () => {
      service.openHelpModal();
      expect(service.isHelpModalOpen()).toBe(true);
    });

    it("should close help modal", () => {
      service.openHelpModal();
      service.closeHelpModal();
      expect(service.isHelpModalOpen()).toBe(false);
    });
  });

  describe("Search", () => {
    it("should toggle search", () => {
      expect(service.isSearchOpen()).toBe(false);

      service.openSearch();
      expect(service.isSearchOpen()).toBe(true);

      service.closeSearch();
      expect(service.isSearchOpen()).toBe(false);
    });
  });

  describe("Platform Detection", () => {
    it("should detect platform", () => {
      // isMac is a computed signal based on navigator.platform
      expect(typeof service.isMac()).toBe("boolean");
    });

    it("should have correct modifier key", () => {
      const modifier = service.modifierKey();
      expect(["⌘", "Ctrl"]).toContain(modifier);
    });
  });

  describe("Logging", () => {
    it("should log debug messages", () => {
      const shortcut: KeyboardShortcut = {
        id: "log-test",
        keys: ["ctrl+l"],
        description: "Log test",
        category: "actions",
        action: vi.fn(),
      };

      service.register(shortcut);

      expect(mockLoggerService.debug).toHaveBeenCalled();
    });
  });
});
