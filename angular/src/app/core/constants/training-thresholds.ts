/**
 * Training Thresholds Constants
 * Centralized thresholds for flag-football training metrics
 */

export const TRAINING_THRESHOLDS = {
  HIGH_SPEED_M_S: 5.5, // High-speed running threshold (m/s)
  SPRINT_M_S: 7.0, // Sprint threshold (m/s)
  ACWR_UNDER_TRAINING: 0.8,
  ACWR_SWEET_SPOT_MAX: 1.3,
  ACWR_ELEVATED_RISK: 1.5,
} as const;
