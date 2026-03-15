/**
 * Keyboard Shortcuts Service
 *
 * Global keyboard shortcut management for the application.
 * Provides consistent shortcuts across all pages with visual hints.
 *
 * Default Shortcuts:
 * - Ctrl/Cmd + K: Open search
 * - Ctrl/Cmd + /: Show help/shortcuts modal
 * - Ctrl/Cmd + B: Toggle sidebar
 * - Ctrl/Cmd + H: Go to dashboard/home
 * - Ctrl/Cmd + N: New item (context-aware)
 * - Escape: Close modal/panel
 * - ?: Show shortcuts (when not in input)
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import {
  Injectable,
  signal,
  computed,
  inject,
  NgZone,
  OnDestroy,
} from "@angular/core";
import { Router } from "@angular/router";
import { LoggerService } from "./logger.service";

export interface KeyboardShortcut {
  id: string;
  keys: string[];
  description: string;
  category: ShortcutCategory;
  action: () => void;
  enabled?: boolean;
  global?: boolean; // Works even when in input fields
}

export type ShortcutCategory =
  | "navigation"
  | "actions"
  | "editing"
  | "view"
  | "help";

interface _ShortcutState {
  isHelpModalOpen: boolean;
  isSearchOpen: boolean;
  activeShortcuts: Map<string, KeyboardShortcut>;
  recentlyUsed: string[];
}

@Injectable({
  providedIn: "root",
})
export class KeyboardShortcutsService implements OnDestroy {
  private router = inject(Router);
  private logger = inject(LoggerService);
  private ngZone = inject(NgZone);

  // State signals
  private _isHelpModalOpen = signal(false);
  private _isSearchOpen = signal(false);
  private _shortcuts = signal<Map<string, KeyboardShortcut>>(new Map());
  private _recentlyUsed = signal<string[]>([]);
  private _isEnabled = signal(true);

  // Public computed signals
  isHelpModalOpen = this._isHelpModalOpen.asReadonly();
  isSearchOpen = this._isSearchOpen.asReadonly();
  isEnabled = this._isEnabled.asReadonly();

  shortcuts = computed(() => Array.from(this._shortcuts().values()));

  shortcutsByCategory = computed(() => {
    const grouped = new Map<ShortcutCategory, KeyboardShortcut[]>();
    const categories: ShortcutCategory[] = [
      "navigation",
      "actions",
      "editing",
      "view",
      "help",
    ];

    categories.forEach((cat) => grouped.set(cat, []));

    this.shortcuts().forEach((shortcut) => {
      const list = grouped.get(shortcut.category) || [];
      list.push(shortcut);
      grouped.set(shortcut.category, list);
    });

    return grouped;
  });

  recentlyUsed = computed(() => {
    const recent = this._recentlyUsed();
    return recent
      .map((id) => this._shortcuts().get(id))
      .filter((s): s is KeyboardShortcut => !!s)
      .slice(0, 5);
  });

  // Platform detection
  isMac = computed(
    () =>
      typeof navigator !== "undefined" &&
      navigator.platform.toUpperCase().indexOf("MAC") >= 0,
  );
  modifierKey = computed(() => (this.isMac() ? "⌘" : "Ctrl"));

  // Event listener reference for cleanup
  private keydownHandler: ((event: KeyboardEvent) => void) | null = null;

  constructor() {
    this.registerDefaultShortcuts();
    this.setupGlobalListener();
    this.logger.debug("[KeyboardShortcuts] Service initialized");
  }

  ngOnDestroy(): void {
    this.removeGlobalListener();
  }

  /**
   * Register default application shortcuts
   */
  private registerDefaultShortcuts(): void {
    // Navigation shortcuts
    this.register({
      id: "search",
      keys: ["ctrl+k", "cmd+k"],
      description: "Open search",
      category: "navigation",
      global: true,
      action: () => this.openSearch(),
    });

    this.register({
      id: "home",
      keys: ["ctrl+h", "cmd+h"],
      description: "Go to dashboard",
      category: "navigation",
      action: () => this.router.navigate(["/dashboard"]),
    });

    this.register({
      id: "training",
      keys: ["g t"],
      description: "Go to training",
      category: "navigation",
      action: () => this.router.navigate(["/training"]),
    });

    this.register({
      id: "analytics",
      keys: ["g a"],
      description: "Go to analytics",
      category: "navigation",
      action: () => this.router.navigate(["/performance/insights"]),
    });

    this.register({
      id: "wellness",
      keys: ["g w"],
      description: "Go to wellness",
      category: "navigation",
      action: () => this.router.navigate(["/wellness"]),
    });

    this.register({
      id: "profile",
      keys: ["g p"],
      description: "Go to profile",
      category: "navigation",
      action: () => this.router.navigate(["/profile"]),
    });

    this.register({
      id: "settings",
      keys: ["g s"],
      description: "Go to settings",
      category: "navigation",
      action: () => this.router.navigate(["/settings"]),
    });

    // Action shortcuts
    this.register({
      id: "new-workout",
      keys: ["ctrl+n", "cmd+n"],
      description: "New workout/entry",
      category: "actions",
      action: () => this.triggerNewAction(),
    });

    this.register({
      id: "save",
      keys: ["ctrl+s", "cmd+s"],
      description: "Save current form",
      category: "actions",
      global: true,
      action: () => this.triggerSave(),
    });

    this.register({
      id: "refresh",
      keys: ["ctrl+r", "cmd+r"],
      description: "Refresh data",
      category: "actions",
      action: () => this.triggerRefresh(),
    });

    // View shortcuts
    this.register({
      id: "toggle-sidebar",
      keys: ["ctrl+b", "cmd+b"],
      description: "Toggle sidebar",
      category: "view",
      action: () => this.toggleSidebar(),
    });

    this.register({
      id: "toggle-theme",
      keys: ["ctrl+shift+t", "cmd+shift+t"],
      description: "Toggle dark/light mode",
      category: "view",
      action: () => this.toggleTheme(),
    });

    this.register({
      id: "fullscreen",
      keys: ["f"],
      description: "Toggle fullscreen",
      category: "view",
      action: () => this.toggleFullscreen(),
    });

    // Help shortcuts
    this.register({
      id: "help",
      keys: ["ctrl+/", "cmd+/", "?"],
      description: "Show keyboard shortcuts",
      category: "help",
      global: true,
      action: () => this.toggleHelpModal(),
    });

    this.register({
      id: "escape",
      keys: ["escape"],
      description: "Close modal/panel",
      category: "help",
      global: true,
      action: () => this.handleEscape(),
    });
  }

  /**
   * Setup global keyboard listener
   */
  private setupGlobalListener(): void {
    if (typeof window === "undefined") return;

    this.keydownHandler = (event: KeyboardEvent) => {
      if (!this._isEnabled()) return;

      const keyCombo = this.getKeyCombo(event);
      const shortcut = this.findMatchingShortcut(keyCombo);

      if (shortcut) {
        // Check if we're in an input field
        const isInInput = this.isInputElement(event.target as Element);

        // Only execute if global or not in input
        if (shortcut.global || !isInInput) {
          event.preventDefault();
          event.stopPropagation();

          this.ngZone.run(() => {
            this.executeShortcut(shortcut);
          });
        }
      }
    };

    window.addEventListener("keydown", this.keydownHandler);
  }

  /**
   * Remove global keyboard listener
   */
  private removeGlobalListener(): void {
    if (this.keydownHandler && typeof window !== "undefined") {
      window.removeEventListener("keydown", this.keydownHandler);
    }
  }

  /**
   * Get key combination string from event
   */
  private getKeyCombo(event: KeyboardEvent): string {
    const parts: string[] = [];

    if (event.ctrlKey) parts.push("ctrl");
    if (event.metaKey) parts.push("cmd");
    if (event.altKey) parts.push("alt");
    if (event.shiftKey) parts.push("shift");

    const key = event.key.toLowerCase();

    // Handle special keys
    if (key === " ") {
      parts.push("space");
    } else if (
      key !== "control" &&
      key !== "meta" &&
      key !== "alt" &&
      key !== "shift"
    ) {
      parts.push(key);
    }

    return parts.join("+");
  }

  /**
   * Find matching shortcut for key combo
   */
  private findMatchingShortcut(keyCombo: string): KeyboardShortcut | null {
    for (const shortcut of this._shortcuts().values()) {
      if (shortcut.enabled === false) continue;

      for (const keys of shortcut.keys) {
        if (this.matchesKeyCombo(keyCombo, keys)) {
          return shortcut;
        }
      }
    }
    return null;
  }

  /**
   * Check if key combo matches shortcut definition
   */
  private matchesKeyCombo(pressed: string, defined: string): boolean {
    // Normalize both
    const normalizedPressed = pressed.toLowerCase();
    const normalizedDefined = defined.toLowerCase();

    // Direct match
    if (normalizedPressed === normalizedDefined) return true;

    // Handle cmd/ctrl equivalence
    const pressedWithCtrl = normalizedPressed.replace("cmd", "ctrl");
    const definedWithCtrl = normalizedDefined.replace("cmd", "ctrl");

    return pressedWithCtrl === definedWithCtrl;
  }

  /**
   * Check if element is an input field
   */
  private isInputElement(element: Element | null): boolean {
    if (!element) return false;

    const tagName = element.tagName.toLowerCase();
    const isInput = ["input", "textarea", "select"].includes(tagName);
    const isEditable = (element as HTMLElement).isContentEditable;

    return isInput || isEditable;
  }

  /**
   * Execute a shortcut
   */
  private executeShortcut(shortcut: KeyboardShortcut): void {
    this.logger.debug(`[KeyboardShortcuts] Executing: ${shortcut.id}`);

    // Track usage
    this._recentlyUsed.update((recent) => {
      const filtered = recent.filter((id) => id !== shortcut.id);
      return [shortcut.id, ...filtered].slice(0, 10);
    });

    // Execute action
    shortcut.action();
  }

  /**
   * Register a new shortcut
   */
  register(shortcut: KeyboardShortcut): void {
    this._shortcuts.update((shortcuts) => {
      const newMap = new Map(shortcuts);
      newMap.set(shortcut.id, {
        ...shortcut,
        enabled: shortcut.enabled ?? true,
      });
      return newMap;
    });

    this.logger.debug(
      `[KeyboardShortcuts] Registered: ${shortcut.id} (${shortcut.keys.join(", ")})`,
    );
  }

  /**
   * Unregister a shortcut
   */
  unregister(id: string): void {
    this._shortcuts.update((shortcuts) => {
      const newMap = new Map(shortcuts);
      newMap.delete(id);
      return newMap;
    });
  }

  /**
   * Enable/disable a specific shortcut
   */
  setEnabled(id: string, enabled: boolean): void {
    this._shortcuts.update((shortcuts) => {
      const shortcut = shortcuts.get(id);
      if (shortcut) {
        const newMap = new Map(shortcuts);
        newMap.set(id, { ...shortcut, enabled });
        return newMap;
      }
      return shortcuts;
    });
  }

  /**
   * Enable/disable all shortcuts
   */
  setGlobalEnabled(enabled: boolean): void {
    this._isEnabled.set(enabled);
  }

  /**
   * Format keys for display
   */
  formatKeys(keys: string[]): string {
    const key = keys[0]; // Use first key combination
    const parts = key.split("+");

    return parts
      .map((part) => {
        switch (part.toLowerCase()) {
          case "ctrl":
            return this.isMac() ? "⌃" : "Ctrl";
          case "cmd":
            return "⌘";
          case "alt":
            return this.isMac() ? "⌥" : "Alt";
          case "shift":
            return this.isMac() ? "⇧" : "Shift";
          case "enter":
            return "↵";
          case "escape":
            return "Esc";
          case "space":
            return "Space";
          case "arrowup":
            return "↑";
          case "arrowdown":
            return "↓";
          case "arrowleft":
            return "←";
          case "arrowright":
            return "→";
          default:
            return part.toUpperCase();
        }
      })
      .join(this.isMac() ? "" : " + ");
  }

  // ================================
  // ACTION IMPLEMENTATIONS
  // ================================

  openSearch(): void {
    this._isSearchOpen.set(true);
    // Dispatch custom event for search panel to listen
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-search-panel"));
    }
  }

  closeSearch(): void {
    this._isSearchOpen.set(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("close-search-panel"));
    }
  }

  toggleHelpModal(): void {
    this._isHelpModalOpen.update((open) => !open);
  }

  openHelpModal(): void {
    this._isHelpModalOpen.set(true);
  }

  closeHelpModal(): void {
    this._isHelpModalOpen.set(false);
  }

  private handleEscape(): void {
    if (this._isHelpModalOpen()) {
      this.closeHelpModal();
    } else if (this._isSearchOpen()) {
      this.closeSearch();
    } else {
      // Dispatch escape event for other modals
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("keyboard-escape"));
      }
    }
  }

  private triggerNewAction(): void {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("keyboard-new-action"));
    }
  }

  private triggerSave(): void {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("keyboard-save"));
    }
  }

  private triggerRefresh(): void {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("keyboard-refresh"));
    }
  }

  private toggleSidebar(): void {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("toggle-sidebar"));
    }
  }

  private toggleTheme(): void {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("toggle-theme"));
    }
  }

  private toggleFullscreen(): void {
    if (typeof document === "undefined") return;

    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }
}
