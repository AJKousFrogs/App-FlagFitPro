import { Injectable } from "@angular/core";

export type HapticFeedbackType =
  | "light"
  | "medium"
  | "heavy"
  | "success"
  | "warning"
  | "error";

@Injectable({
  providedIn: "root",
})
export class HapticFeedbackService {
  /**
   * Trigger haptic feedback if supported
   */
  trigger(type: HapticFeedbackType = "medium"): void {
    if (!("vibrate" in navigator)) {
      return; // Not supported
    }

    const patterns: Record<HapticFeedbackType, number | number[]> = {
      light: 50,
      medium: [100, 50, 100],
      heavy: [200, 50, 200, 50, 200],
      success: [100, 30, 100, 30, 200],
      warning: [150, 50, 150],
      error: [200, 100, 200, 100, 200],
    };

    const pattern = patterns[type];
    navigator.vibrate(pattern);
  }

  /**
   * Trigger a custom vibration pattern
   */
  custom(pattern: number | number[]): void {
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  }

  /**
   * Light haptic feedback - for subtle interactions
   */
  light(): void {
    this.trigger("light");
  }

  /**
   * Medium haptic feedback - for standard interactions
   */
  medium(): void {
    this.trigger("medium");
  }

  /**
   * Heavy haptic feedback - for important actions
   */
  heavy(): void {
    this.trigger("heavy");
  }

  /**
   * Success haptic feedback - for successful operations
   */
  success(): void {
    this.trigger("success");
  }

  /**
   * Warning haptic feedback - for warnings
   */
  warning(): void {
    this.trigger("warning");
  }

  /**
   * Error haptic feedback - for errors
   */
  error(): void {
    this.trigger("error");
  }
}
