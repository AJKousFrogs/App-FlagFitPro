/**
 * Keyboard Shortcuts Service Tests
 *
 * Tests for the global keyboard shortcuts service.
 * Covers shortcut registration, execution, and cleanup.
 *
 * @author FlagFit Pro Team
 */

import { TestBed, fakeAsync, tick } from "@angular/core/testing";
import { Router } from "@angular/router";
import { provideRouter } from "@angular/router";

import {
  KeyboardShortcutsService,
  Shortcut,
} from "./keyboard-shortcuts.service";
import { LoggerService } from "./logger.service";

describe("KeyboardShortcutsService", () => {
  let service: KeyboardShortcutsService;
  let _router: Router;

  const mockLoggerService = {
    debug: jasmine.createSpy("debug"),
    info: jasmine.createSpy("info"),
    warn: jasmine.createSpy("warn"),
    error: jasmine.createSpy("error"),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        KeyboardShortcutsService,
        provideRouter([]),
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    });

    service = TestBed.inject(KeyboardShortcutsService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    service.ngOnDestroy();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("Shortcut Registration", () => {
    it("should register a shortcut", () => {
      const shortcut: Shortcut = {
        key: "k",
        ctrl: true,
        action: jasmine.createSpy("action"),
        description: "Test shortcut",
      };

      const unregister = service.registerShortcut(shortcut);

      expect(service.activeShortcuts().has("Ctrl+K")).toBe(true);
      expect(typeof unregister).toBe("function");
    });

    it("should register a global shortcut", () => {
      const shortcut: Shortcut = {
        key: "/",
        ctrl: true,
        action: jasmine.createSpy("action"),
        description: "Help",
        global: true,
      };

      service.registerShortcut(shortcut);

      expect(service.activeGlobalShortcuts().has("Ctrl+/")).toBe(true);
    });

    it("should unregister a shortcut when returned function is called", () => {
      const shortcut: Shortcut = {
        key: "k",
        ctrl: true,
        action: jasmine.createSpy("action"),
        description: "Test",
      };

      const unregister = service.registerShortcut(shortcut);
      expect(service.activeShortcuts().has("Ctrl+K")).toBe(true);

      unregister();
      expect(service.activeShortcuts().has("Ctrl+K")).toBe(false);
    });

    it("should clear all contextual shortcuts", () => {
      const shortcut1: Shortcut = {
        key: "a",
        ctrl: true,
        action: () => {},
        description: "Test 1",
      };

      const shortcut2: Shortcut = {
        key: "b",
        ctrl: true,
        action: () => {},
        description: "Test 2",
      };

      service.registerShortcut(shortcut1);
      service.registerShortcut(shortcut2);

      expect(service.activeShortcuts().size).toBe(2);

      service.clearContextualShortcuts();

      expect(service.activeShortcuts().size).toBe(0);
    });

    it("should not clear global shortcuts when clearing contextual", () => {
      const contextual: Shortcut = {
        key: "a",
        ctrl: true,
        action: () => {},
        description: "Contextual",
      };

      const global: Shortcut = {
        key: "b",
        ctrl: true,
        action: () => {},
        description: "Global",
        global: true,
      };

      service.registerShortcut(contextual);
      service.registerShortcut(global);

      service.clearContextualShortcuts();

      expect(service.activeShortcuts().size).toBe(0);
      expect(service.activeGlobalShortcuts().size).toBe(1);
    });
  });

  describe("Key Combination Parsing", () => {
    it("should generate correct key combo for Ctrl+K", () => {
      const shortcut: Shortcut = {
        key: "k",
        ctrl: true,
        action: () => {},
        description: "Test",
      };

      service.registerShortcut(shortcut);
      expect(service.activeShortcuts().has("Ctrl+K")).toBe(true);
    });

    it("should generate correct key combo for Ctrl+Shift+K", () => {
      const shortcut: Shortcut = {
        key: "k",
        ctrl: true,
        shift: true,
        action: () => {},
        description: "Test",
      };

      service.registerShortcut(shortcut);
      expect(service.activeShortcuts().has("Ctrl+Shift+K")).toBe(true);
    });

    it("should generate correct key combo for Alt+K", () => {
      const shortcut: Shortcut = {
        key: "k",
        alt: true,
        action: () => {},
        description: "Test",
      };

      service.registerShortcut(shortcut);
      expect(service.activeShortcuts().has("Alt+K")).toBe(true);
    });

    it("should generate correct key combo for Meta+K (Command)", () => {
      const shortcut: Shortcut = {
        key: "k",
        meta: true,
        action: () => {},
        description: "Test",
      };

      service.registerShortcut(shortcut);
      expect(service.activeShortcuts().has("Meta+K")).toBe(true);
    });

    it("should handle complex modifier combinations", () => {
      const shortcut: Shortcut = {
        key: "s",
        ctrl: true,
        alt: true,
        shift: true,
        action: () => {},
        description: "Complex",
      };

      service.registerShortcut(shortcut);
      expect(service.activeShortcuts().has("Ctrl+Alt+Shift+S")).toBe(true);
    });
  });

  describe("Shortcut Execution", () => {
    it("should execute shortcut action on keydown", fakeAsync(() => {
      const actionSpy = jasmine.createSpy("action");
      const shortcut: Shortcut = {
        key: "k",
        ctrl: true,
        action: actionSpy,
        description: "Test",
      };

      service.registerShortcut(shortcut);

      const event = new KeyboardEvent("keydown", {
        key: "k",
        ctrlKey: true,
        bubbles: true,
      });

      document.dispatchEvent(event);
      tick();

      expect(actionSpy).toHaveBeenCalled();
    }));

    it("should execute global shortcuts before contextual", fakeAsync(() => {
      const globalSpy = jasmine.createSpy("global");
      const contextualSpy = jasmine.createSpy("contextual");

      const globalShortcut: Shortcut = {
        key: "k",
        ctrl: true,
        action: globalSpy,
        description: "Global",
        global: true,
      };

      const contextualShortcut: Shortcut = {
        key: "k",
        ctrl: true,
        action: contextualSpy,
        description: "Contextual",
      };

      service.registerShortcut(globalShortcut);
      service.registerShortcut(contextualShortcut);

      const event = new KeyboardEvent("keydown", {
        key: "k",
        ctrlKey: true,
        bubbles: true,
      });

      document.dispatchEvent(event);
      tick();

      // Global should be called, contextual should not
      expect(globalSpy).toHaveBeenCalled();
      expect(contextualSpy).not.toHaveBeenCalled();
    }));

    it("should prevent default by default", fakeAsync(() => {
      const shortcut: Shortcut = {
        key: "k",
        ctrl: true,
        action: () => {},
        description: "Test",
      };

      service.registerShortcut(shortcut);

      const event = new KeyboardEvent("keydown", {
        key: "k",
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });

      const preventDefaultSpy = spyOn(event, "preventDefault");

      document.dispatchEvent(event);
      tick();

      expect(preventDefaultSpy).toHaveBeenCalled();
    }));

    it("should not prevent default when preventDefault is false", fakeAsync(() => {
      const shortcut: Shortcut = {
        key: "k",
        ctrl: true,
        action: () => {},
        description: "Test",
        preventDefault: false,
      };

      service.registerShortcut(shortcut);

      const event = new KeyboardEvent("keydown", {
        key: "k",
        ctrlKey: true,
        bubbles: true,
        cancelable: true,
      });

      const preventDefaultSpy = spyOn(event, "preventDefault");

      document.dispatchEvent(event);
      tick();

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    }));
  });

  describe("Input Field Handling", () => {
    it("should not trigger shortcuts when input is focused", fakeAsync(() => {
      const actionSpy = jasmine.createSpy("action");
      const shortcut: Shortcut = {
        key: "k",
        ctrl: true,
        action: actionSpy,
        description: "Test",
      };

      service.registerShortcut(shortcut);

      // Create an input element and focus it
      const input = document.createElement("input");
      document.body.appendChild(input);
      input.focus();

      const event = new KeyboardEvent("keydown", {
        key: "k",
        ctrlKey: true,
        bubbles: true,
      });

      // Dispatch from the input
      Object.defineProperty(event, "target", { value: input });
      document.dispatchEvent(event);
      tick();

      expect(actionSpy).not.toHaveBeenCalled();

      // Cleanup
      document.body.removeChild(input);
    }));

    it("should not trigger shortcuts when textarea is focused", fakeAsync(() => {
      const actionSpy = jasmine.createSpy("action");
      const shortcut: Shortcut = {
        key: "k",
        ctrl: true,
        action: actionSpy,
        description: "Test",
      };

      service.registerShortcut(shortcut);

      const textarea = document.createElement("textarea");
      document.body.appendChild(textarea);
      textarea.focus();

      const event = new KeyboardEvent("keydown", {
        key: "k",
        ctrlKey: true,
        bubbles: true,
      });

      Object.defineProperty(event, "target", { value: textarea });
      document.dispatchEvent(event);
      tick();

      expect(actionSpy).not.toHaveBeenCalled();

      document.body.removeChild(textarea);
    }));

    it("should not trigger shortcuts in contenteditable", fakeAsync(() => {
      const actionSpy = jasmine.createSpy("action");
      const shortcut: Shortcut = {
        key: "k",
        ctrl: true,
        action: actionSpy,
        description: "Test",
      };

      service.registerShortcut(shortcut);

      const div = document.createElement("div");
      div.contentEditable = "true";
      document.body.appendChild(div);
      div.focus();

      const event = new KeyboardEvent("keydown", {
        key: "k",
        ctrlKey: true,
        bubbles: true,
      });

      Object.defineProperty(event, "target", { value: div });
      document.dispatchEvent(event);
      tick();

      expect(actionSpy).not.toHaveBeenCalled();

      document.body.removeChild(div);
    }));
  });

  describe("Logging", () => {
    it("should log when shortcut is registered", () => {
      const shortcut: Shortcut = {
        key: "k",
        ctrl: true,
        action: () => {},
        description: "Test",
      };

      service.registerShortcut(shortcut);

      expect(mockLoggerService.debug).toHaveBeenCalledWith(
        jasmine.stringContaining("Registered shortcut"),
      );
    });

    it("should log when shortcut is unregistered", () => {
      const shortcut: Shortcut = {
        key: "k",
        ctrl: true,
        action: () => {},
        description: "Test",
      };

      const unregister = service.registerShortcut(shortcut);
      mockLoggerService.debug.calls.reset();

      unregister();

      expect(mockLoggerService.debug).toHaveBeenCalledWith(
        jasmine.stringContaining("Unregistered shortcut"),
      );
    });
  });

  describe("Service Cleanup", () => {
    it("should clean up on destroy", () => {
      const shortcut: Shortcut = {
        key: "k",
        ctrl: true,
        action: () => {},
        description: "Test",
      };

      service.registerShortcut(shortcut);
      service.ngOnDestroy();

      // After destroy, new events should not trigger actions
      // (The service should have unsubscribed from keydown events)
    });
  });
});
