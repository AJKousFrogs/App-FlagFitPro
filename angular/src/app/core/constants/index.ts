/**
 * Constants Barrel Export
 *
 * Centralizes all application constants for easy importing.
 *
 * @example
 * import { WELLNESS, TRAINING, TIMEOUTS, UI_LIMITS } from '@core/constants';
 */

// Application-wide constants
export {
  PAGINATION,
  TIMEOUTS,
  VALIDATION,
  ROUTES,
  STORAGE_KEYS,
  API,
  FILE_UPLOAD,
  DATE_FORMATS,
  TRAINING,
  POSITIONS,
  BREAKPOINTS,
  ANIMATIONS,
  TIME,
  UI_LIMITS,
  COLORS,
  CHART,
  STATUS,
  USER_ROLES,
  NOTIFICATION_TYPES,
  PERFORMANCE,
  REGEX,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from "./app.constants";

// Wellness & Readiness constants
export {
  WELLNESS,
  READINESS_LEVELS,
  getReadinessLevel,
  computeQuickReadiness,
  computeDailyReadiness,
  getRiskFlags,
  isHeatRisk,
  isElevatedHeartRate,
} from "./wellness.constants";

export type {
  ReadinessLevelKey,
  ReadinessLevelConfig,
} from "./wellness.constants";
