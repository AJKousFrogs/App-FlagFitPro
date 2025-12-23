import { Injectable, signal, computed } from "@angular/core";

export interface HeaderConfig {
  showLogo?: boolean;
  searchPlaceholder?: string;
  searchPosition?: "left" | "center" | "right";
  showBreadcrumbs?: boolean;
  variant?: "default" | "compact" | "minimal";
}

@Injectable({
  providedIn: "root",
})
export class HeaderService {
  // Private writable signal - use readonly keyword for Angular 21 best practices
  private readonly headerConfig = signal<HeaderConfig>({
    showLogo: true,
    searchPosition: "center",
    searchPlaceholder: "Search...",
    showBreadcrumbs: false,
    variant: "default",
  });

  /**
   * Get readonly signal for config - Angular 21 best practice
   * Returns a readonly signal that cannot be mutated externally
   */
  getConfig() {
    return this.headerConfig.asReadonly();
  }

  updateConfig(newConfig: Partial<HeaderConfig>) {
    this.headerConfig.update((current) => ({
      ...current,
      ...newConfig,
    }));
  }

  // Preset configurations
  setDashboardHeader() {
    this.updateConfig({
      showLogo: true,
      searchPosition: "center",
      searchPlaceholder: "Search for players, teams & more",
      showBreadcrumbs: false,
      variant: "default",
    });
  }

  setTrainingHeader() {
    this.updateConfig({
      showLogo: false,
      searchPosition: "left",
      searchPlaceholder: "Search workouts, exercises, videos...",
      showBreadcrumbs: true,
      variant: "default",
    });
  }

  setAnalyticsHeader() {
    this.updateConfig({
      showLogo: false,
      searchPosition: "right",
      searchPlaceholder: "Search analytics...",
      showBreadcrumbs: true,
      variant: "compact",
    });
  }

  resetToDefault() {
    this.headerConfig.set({
      showLogo: true,
      searchPosition: "center",
      searchPlaceholder: "Search...",
      showBreadcrumbs: false,
      variant: "default",
    });
  }
}
