import { Injectable, signal } from "@angular/core";

export type HeaderPreset = "default" | "dashboard" | "training" | "analytics";

export interface HeaderConfig {
  showLogo?: boolean;
  searchPlaceholder?: string;
  searchPosition?: "left" | "center" | "right";
  showBreadcrumbs?: boolean;
  variant?: "default" | "compact" | "minimal";
  title?: string;
  showBackButton?: boolean;
  backRoute?: string;
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

  applyPreset(preset: HeaderPreset | null | undefined) {
    switch (preset) {
      case "dashboard":
        this.setDashboardHeader();
        break;
      case "training":
        this.setTrainingHeader();
        break;
      case "analytics":
        this.setAnalyticsHeader();
        break;
      default:
        this.resetToDefault();
        break;
    }
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
