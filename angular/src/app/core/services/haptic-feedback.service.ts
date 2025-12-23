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
}
