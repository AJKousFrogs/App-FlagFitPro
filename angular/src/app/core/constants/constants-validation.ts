/**
 * Constants Validation Utility
 *
 * Provides runtime validation for constants to ensure correctness.
 * Only runs in development mode to catch errors early without production overhead.
 *
 * Validates:
 * - Wellness weights sum to 1.0
 * - Training threshold ranges are logical
 * - Other critical constant relationships
 */

import { isDevMode, inject } from "@angular/core";
import { WELLNESS } from "./wellness.constants";
import { TRAINING } from "./app.constants";
import { LoggerService } from "../services/logger.service";

/**
 * Validates that weights sum to expected value (default 1.0)
 * @param weights - Object with numeric weight values
 * @param expectedSum - Expected sum (default 1.0)
 * @param tolerance - Allowed tolerance for floating point precision (default 0.001)
 * @throws Error if weights don't sum correctly
 */
export function validateWeightsSum(
  weights: Record<string, number>,
  expectedSum: number = 1.0,
  tolerance: number = 0.001,
): void {
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  if (Math.abs(sum - expectedSum) > tolerance) {
    throw new Error(
      `Weights sum to ${sum}, expected ${expectedSum}. ` +
        `Weights: ${JSON.stringify(weights)}`,
    );
  }
}

/**
 * Validates threshold ranges are logical (min < max < warning < danger)
 * @param min - Minimum threshold
 * @param max - Maximum threshold
 * @param warning - Warning threshold
 * @param danger - Danger threshold
 * @throws Error if thresholds are not logically ordered
 */
export function validateThresholds(
  min: number,
  max: number,
  warning: number,
  danger: number,
): void {
  if (min >= max) {
    throw new Error(`Min threshold (${min}) must be less than max (${max})`);
  }
  if (warning <= max) {
    throw new Error(
      `Warning threshold (${warning}) must be greater than max (${max})`,
    );
  }
  if (danger <= warning) {
    throw new Error(
      `Danger threshold (${danger}) must be greater than warning (${warning})`,
    );
  }
}

/**
 * Validates all constants (development only)
 * This function is called at module load time in development mode
 */
export function validateAllConstants(): void {
  // Validate wellness weights sum to 1.0
  validateWeightsSum(WELLNESS.QUICK_READINESS_WEIGHTS);
  validateWeightsSum(WELLNESS.DAILY_READINESS_WEIGHTS);

  // Validate training ACWR thresholds are logical
  validateThresholds(
    TRAINING.ACWR_SAFE_RANGE_MIN,
    TRAINING.ACWR_SAFE_RANGE_MAX,
    TRAINING.ACWR_WARNING_THRESHOLD,
    TRAINING.ACWR_DANGER_THRESHOLD,
  );

  // Validate intensity range
  if (TRAINING.MIN_INTENSITY >= TRAINING.MAX_INTENSITY) {
    throw new Error(
      `MIN_INTENSITY (${TRAINING.MIN_INTENSITY}) must be less than MAX_INTENSITY (${TRAINING.MAX_INTENSITY})`,
    );
  }

  // Validate duration range
  if (TRAINING.MIN_DURATION_MINUTES >= TRAINING.MAX_DURATION_MINUTES) {
    throw new Error(
      `MIN_DURATION_MINUTES (${TRAINING.MIN_DURATION_MINUTES}) must be less than MAX_DURATION_MINUTES (${TRAINING.MAX_DURATION_MINUTES})`,
    );
  }

  // Validate speed thresholds
  if (TRAINING.HIGH_SPEED_M_S >= TRAINING.SPRINT_M_S) {
    throw new Error(
      `HIGH_SPEED_M_S (${TRAINING.HIGH_SPEED_M_S}) must be less than SPRINT_M_S (${TRAINING.SPRINT_M_S})`,
    );
  }
}

/**
 * Check if running in development environment
 * @returns true if running on localhost
 */
function isDevelopment(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const hostname = window.location?.hostname;
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname?.includes("localhost")
  );
}

// Run validation in development mode only
// This code will be tree-shaken in production builds
if (isDevMode()) {
  try {
    validateAllConstants();
  } catch (error) {
    // LoggerService is not ready during this bootstrap validation phase, so
    // console.error is temporarily allowed while we validate constants.
    console.error("❌ Constants validation failed:", error);
    throw error;
  }
}
