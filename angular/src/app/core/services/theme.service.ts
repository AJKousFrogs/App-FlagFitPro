/**
 * Theme Service
 *
 * Centralized theme management for the application.
 * Handles light/dark mode toggle, system preference detection,
 * and persistence to localStorage and Supabase.
 */

import { computed, effect, inject, Injectable, signal } from "@angular/core";
import { CHART_PALETTE } from "../utils/design-tokens.util";
import { LoggerService } from "./logger.service";
import { SupabaseService } from "./supabase.service";

export type ThemeMode = "light" | "dark" | "auto";

interface ThemeState {
  mode: ThemeMode;
  resolvedTheme: "light" | "dark";
}

const THEME_STORAGE_KEY = "flagfit_theme";

/**
 * Theme-color meta tag values for mobile browser chrome
 * Maps to design system but hardcoded for SSR compatibility
 */
const THEME_META_COLOR_LIGHT = "#089949"; // --ds-primary-green
const THEME_META_COLOR_DARK = "#171717"; // --primitive-neutral-900

@Injectable({
  providedIn: "root",
})
export class ThemeService {
  private supabase = inject(SupabaseService);
  private logger = inject(LoggerService);

  // State signals
  private _mode = signal<ThemeMode>("auto");
  private _systemPreference = signal<"light" | "dark">("light");

  // Public computed signals
  mode = this._mode.asReadonly();

  resolvedTheme = computed<"light" | "dark">(() => {
    const mode = this._mode();
    if (mode === "auto") {
      return this._systemPreference();
    }
    return mode;
  });

  isDark = computed(() => this.resolvedTheme() === "dark");
  isLight = computed(() => this.resolvedTheme() === "light");

  // Media query for system preference
  private mediaQuery: MediaQueryList | null = null;

  constructor() {
    // Initialize on client side only
    if (typeof window !== "undefined") {
      // Disable transitions during initial load
      document.documentElement.classList.add("no-transitions");

      this.initializeSystemPreference();
      this.loadSavedPreference();

      // Apply theme on changes
      effect(() => {
        const theme = this.resolvedTheme();
        this.applyTheme(theme);
      });

      // Re-enable transitions after initial load
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.documentElement.classList.remove("no-transitions");
        });
      });
    }
  }

  /**
   * Set theme mode
   */
  setMode(mode: ThemeMode): void {
    this._mode.set(mode);
    this.savePreference(mode);
    this.logger.debug(`[ThemeService] Theme mode set to: ${mode}`);
  }

  /**
   * Toggle between light and dark (ignores auto)
   */
  toggle(): void {
    const current = this.resolvedTheme();
    const newMode = current === "dark" ? "light" : "dark";
    this.setMode(newMode);
  }

  /**
   * Cycle through modes: light -> dark -> auto -> light
   */
  cycleMode(): void {
    const current = this._mode();
    const modes: ThemeMode[] = ["light", "dark", "auto"];
    const currentIndex = modes.indexOf(current);
    const nextIndex = (currentIndex + 1) % modes.length;
    this.setMode(modes[nextIndex]);
  }

  /**
   * Get CSS variable value from design system
   * Useful for Chart.js and other canvas-based rendering that can't use CSS vars
   * @param variableName - CSS variable name (e.g., '--color-chart-1' or 'color-chart-1')
   * @returns The computed value of the CSS variable
   */
  getCssVariable(variableName: string): string {
    if (typeof window === "undefined") {
      return "";
    }
    const name = variableName.startsWith("--")
      ? variableName
      : `--${variableName}`;
    return getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
  }

  /**
   * Get chart color palette from design system
   * Returns array of hex colors for Chart.js
   *
   * Prefer using CHART_PALETTE from @core/utils/design-tokens.util directly
   * for better tree-shaking and type safety
   */
  getChartColors(): string[] {
    // Try to read from CSS variables first (respects theming)
    const cssColors = [
      this.getCssVariable("--color-chart-1"),
      this.getCssVariable("--color-chart-2"),
      this.getCssVariable("--color-chart-3"),
      this.getCssVariable("--color-chart-4"),
      this.getCssVariable("--color-chart-5"),
      this.getCssVariable("--color-chart-6"),
    ].filter((c) => c);

    // Return CSS values if available, otherwise fallback to design token constants
    return cssColors.length === 6 ? cssColors : [...CHART_PALETTE.slice(0, 6)];
  }

  /**
   * Get specific design system color by token name
   * @param tokenName - Token name without '--' prefix (e.g., 'ds-primary-green')
   */
  getColor(tokenName: string): string {
    return this.getCssVariable(tokenName);
  }

  /**
   * Initialize system preference detection
   */
  private initializeSystemPreference(): void {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }

    this.mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    this._systemPreference.set(this.mediaQuery.matches ? "dark" : "light");

    // Listen for system preference changes
    const handler = (e: MediaQueryListEvent) => {
      this._systemPreference.set(e.matches ? "dark" : "light");
      this.logger.debug(
        `[ThemeService] System preference changed to: ${e.matches ? "dark" : "light"}`,
      );
    };

    // Use addEventListener for modern browsers
    if (this.mediaQuery.addEventListener) {
      this.mediaQuery.addEventListener("change", handler);
    } else {
      // Fallback for older browsers
      this.mediaQuery.addListener(handler);
    }
  }

  /**
   * Load saved preference from localStorage
   */
  private loadSavedPreference(): void {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved && ["light", "dark", "auto"].includes(saved)) {
        this._mode.set(saved as ThemeMode);
        this.logger.debug(`[ThemeService] Loaded saved theme: ${saved}`);
      }
    } catch (error) {
      this.logger.warn("[ThemeService] Failed to load saved theme preference");
    }
  }

  /**
   * Save preference to localStorage and optionally to Supabase
   */
  private savePreference(mode: ThemeMode): void {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode);

      // Also save to Supabase if user is authenticated
      this.saveToSupabase(mode);
    } catch (error) {
      this.logger.warn("[ThemeService] Failed to save theme preference");
    }
  }

  /**
   * Save preference to Supabase user settings
   */
  private async saveToSupabase(mode: ThemeMode): Promise<void> {
    try {
      const user = this.supabase.currentUser();
      if (!user) return;

      const { error } = await this.supabase.client.from("user_settings").upsert(
        {
          user_id: user.id,
          theme: mode,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        },
      );

      if (error) {
        this.logger.debug(
          "[ThemeService] Could not save theme to Supabase:",
          error.message,
        );
      }
    } catch (error) {
      // Silently fail - localStorage is the primary storage
    }
  }

  /**
   * Load preference from Supabase (call after auth)
   */
  async loadFromSupabase(): Promise<void> {
    try {
      const user = this.supabase.currentUser();
      if (!user) return;

      const { data, error } = await this.supabase.client
        .from("user_settings")
        .select("theme")
        .eq("user_id", user.id)
        .single();

      if (data?.theme && ["light", "dark", "auto"].includes(data.theme)) {
        this._mode.set(data.theme as ThemeMode);
        localStorage.setItem(THEME_STORAGE_KEY, data.theme);
        this.logger.debug(
          `[ThemeService] Loaded theme from Supabase: ${data.theme}`,
        );
      }
    } catch (error) {
      // Silently fail - localStorage preference is used
    }
  }

  /**
   * Apply theme to DOM
   */
  private applyTheme(theme: "light" | "dark"): void {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    const body = document.body;

    // Set data-theme attribute (used by CSS)
    root.setAttribute("data-theme", theme);
    body.setAttribute("data-theme", theme);

    // Also set class for backwards compatibility
    body.classList.remove("light-theme", "dark-theme");
    body.classList.add(`${theme}-theme`);

    // Update meta theme-color for mobile browsers
    this.updateMetaThemeColor(theme);

    // Update PrimeNG theme
    this.updatePrimeNGTheme(theme);

    this.logger.debug(`[ThemeService] Applied theme: ${theme}`);
  }

  /**
   * Update meta theme-color for mobile browser chrome
   */
  private updateMetaThemeColor(theme: "light" | "dark"): void {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        "content",
        theme === "dark" ? THEME_META_COLOR_DARK : THEME_META_COLOR_LIGHT,
      );
    }
  }

  /**
   * Update PrimeNG theme dynamically
   *
   * These hex values mirror design-system-tokens.scss dark/light mode definitions.
   * They must be hardcoded here because we're programmatically setting CSS variables
   * for runtime theme switching (CSS can't reference variables to set other variables).
   *
   * Values map to:
   * - Dark: --primitive-neutral-* scale (reversed for dark mode)
   * - Light: Standard surface scale from design tokens
   */
  private updatePrimeNGTheme(theme: "light" | "dark"): void {
    // PrimeNG 21 uses CSS variables, so the data-theme attribute should handle it
    // But we can also update specific PrimeNG surface variables if needed
    const root = document.documentElement;

    if (theme === "dark") {
      // Dark mode: --primitive-neutral scale (inverted)
      root.style.setProperty("--p-surface-0", "#171717"); // --primitive-neutral-900
      root.style.setProperty("--p-surface-50", "#1f1f1f");
      root.style.setProperty("--p-surface-100", "#262626"); // --primitive-neutral-800
      root.style.setProperty("--p-surface-200", "#333333");
      root.style.setProperty("--p-surface-300", "#404040"); // --primitive-neutral-700
      root.style.setProperty("--p-surface-400", "#525252");
      root.style.setProperty("--p-surface-500", "#737373"); // --primitive-neutral-600
      root.style.setProperty("--p-surface-600", "#a3a3a3"); // --primitive-neutral-500
      root.style.setProperty("--p-surface-700", "#d4d4d4"); // --primitive-neutral-400
      root.style.setProperty("--p-surface-800", "#e5e5e5"); // --primitive-neutral-300
      root.style.setProperty("--p-surface-900", "#f5f5f5"); // --primitive-neutral-100
      root.style.setProperty("--p-text-color", "#ffffff");
      root.style.setProperty("--p-text-color-secondary", "#a3a3a3");
    } else {
      // Light mode: Standard surface scale from design tokens
      root.style.setProperty("--p-surface-0", "#ffffff"); // --surface-primary
      root.style.setProperty("--p-surface-50", "#f8faf9"); // --surface-secondary
      root.style.setProperty("--p-surface-100", "#f1f5f4");
      root.style.setProperty("--p-surface-200", "#e2e8f0");
      root.style.setProperty("--p-surface-300", "#cbd5e1");
      root.style.setProperty("--p-surface-400", "#94a3b8");
      root.style.setProperty("--p-surface-500", "#64748b");
      root.style.setProperty("--p-surface-600", "#475569");
      root.style.setProperty("--p-surface-700", "#334155");
      root.style.setProperty("--p-surface-800", "#1e293b");
      root.style.setProperty("--p-surface-900", "#0f172a");
      root.style.setProperty("--p-text-color", "#0f172a");
      root.style.setProperty("--p-text-color-secondary", "#64748b");
    }
  }

  /**
   * Get current theme state for debugging
   */
  getState(): ThemeState {
    return {
      mode: this._mode(),
      resolvedTheme: this.resolvedTheme(),
    };
  }
}
