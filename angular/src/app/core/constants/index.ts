/**
 * Constants Barrel Export
 *
 * Centralizes all application constants for easy importing.
 * This is the single source of truth for all application constants.
 *
 * @example
 * //messages
 * import { TOAST } from '@core/constants';
 * this.toastService.success(TOAST.SUCCESS.SAVED);
 * this.toastService.error(TOAST.ERROR.NETWORK);
 *
 * @example
 * // UI Limits (preview counts)
 * import { UI_LIMITS } from '@core/constants';
 * const previewGoals = this.goals.slice(0, UI_LIMITS.GOALS_PREVIEW_COUNT);
 * const recentActivities = this.activities.slice(0, UI_LIMITS.RECENT_ACTIVITIES_COUNT);
 *
 * @example
 * // Timeouts and delays
 * import { TIMEOUTS } from '@core/constants';
 * setTimeout(() => this.loadData(), TIMEOUTS.DEBOUNCE_TIME);
 * timer(TIMEOUTS.POLLING_INTERVAL).subscribe(() => this.refresh());
 *
 * @example
 * // Wellness calculations
 * import { WELLNESS, getReadinessLevel } from '@core/constants';
 * const level = getReadinessLevel(score);
 * if (score >= WELLNESS.READINESS_EXCELLENT) {
 *   // Excellent readiness
 * }
 * const quickScore = computeQuickReadiness(feeling, energy, hasSoreness);
 *
 * @example
 * // Training thresholds
 * import { TRAINING } from '@core/constants';
 * if (acwr > TRAINING.ACWR_DANGER_THRESHOLD) {
 *   // Danger zone - reduce load
 * }
 * if (speed > TRAINING.SPRINT_M_S) {
 *   // Sprint detected
 * }
 *
 * @example
 * // Positions (dropdown options)
 * import { POSITION_SELECT_OPTIONS } from '@core/constants';
 * <p-select [options]="POSITION_SELECT_OPTIONS" />
 *
 * @example
 * // UI Options (dropdowns)
 * import { VISIBILITY_OPTIONS, THEME_OPTIONS } from '@core/constants';
 * <p-select [options]="VISIBILITY_OPTIONS" />
 * <p-selectbutton [options]="THEME_OPTIONS" />
 *
 * @example
 * // Validation patterns
 * import { VALIDATION } from '@core/constants';
 * if (email.match(VALIDATION.EMAIL_PATTERN)) {
 *   // Valid email
 * }
 *
 * @example
 * // Routes
 * import { ROUTES } from '@core/constants';
 * this.router.navigate([ROUTES.DASHBOARD]);
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
  BREAKPOINTS,
  ANIMATIONS,
  TIME,
  UI_LIMITS,
  COLORS,
  PERFORMANCE,
} from "./app.constants";

//messages
export {
  TOAST,
  TOAST_SUCCESS,
  TOAST_ERROR,
  TOAST_WARN,
  TOAST_INFO,
} from "./toast-messages.constants";

export type {
  ToastSuccessKey,
  ToastErrorKey,
  ToastWarnKey,
  ToastInfoKey,
} from "./toast-messages.constants";

// Position constants
export {
  FLAG_POSITIONS,
  TRADITIONAL_POSITIONS,
  FLAG_POSITION_ABBREVIATIONS,
  ALL_POSITIONS,
  POSITION_SELECT_OPTIONS,
  POSITION_SELECT_OPTIONS_GROUPED,
  POSITION_DISPLAY_NAMES,
  getPositionDisplayName,
  getPositionCategory,
} from "./positions.constants";

export type {
  FlagPosition,
  TraditionalPosition,
  PositionCategory,
} from "./positions.constants";

// UI options (visibility, theme, language, etc.)
export {
  VISIBILITY_OPTIONS,
  RESOURCE_VISIBILITY_OPTIONS,
  STAFF_VISIBILITY_OPTIONS,
  THEME_OPTIONS,
  LANGUAGE_OPTIONS,
  NOTIFICATION_FREQUENCY_OPTIONS,
  NOTIFICATION_TYPE_OPTIONS,
  WEIGHT_UNIT_OPTIONS,
  HEIGHT_UNIT_OPTIONS,
  DISTANCE_UNIT_OPTIONS,
  TIME_FORMAT_OPTIONS,
  DATE_FORMAT_OPTIONS,
  WEEK_START_OPTIONS,
  SKILL_LEVEL_OPTIONS,
  GENDER_OPTIONS,
  UI_OPTIONS,
} from "./ui-options.constants";

export type {
  VisibilityLevel,
  ThemeMode,
  LanguageCode,
  UnitSystem,
  SkillLevel,
} from "./ui-options.constants";

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

// Error constants
export {
  ERROR_MESSAGES,
  HTTP_ERROR_MESSAGES,
  ErrorType,
  ErrorSeverity,
} from "./error.constants";

// Import validation (runs in development mode only)
// This ensures constants are valid at module load time
import "./constants-validation";
