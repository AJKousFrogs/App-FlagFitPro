/**
 * Application-wide constants
 * Single source of truth for configuration values
 */

/**
 * Pagination configuration
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
  MAX_PAGE_SIZE: 100,
} as const;

/**
 * Timeouts and delays (milliseconds)
 */
export const TIMEOUTS = {
  // API & Network
  API_TIMEOUT: 30000, // 30 seconds
  RETRY_DELAY: 1000, // 1 second between retries

  // User Input
  DEBOUNCE_TIME: 300, // 300ms for search/input debouncing
  AUTO_SAVE_DELAY: 1000, // 1 second after last change
  AUTO_SAVE_DELAY_LONG: 2000, // 2 seconds for complex forms (onboarding)

  // UI Transitions
  UI_MICRO_DELAY: 100, // Quick DOM updates, focus management
  UI_TRANSITION_DELAY: 500, // Animation completion, loading states
  TOAST_DURATION: 3000, // 3 seconds for info toasts
  TOAST_DURATION_LONG: 5000, // 5 seconds for important messages

  // Polling & Intervals
  POLLING_INTERVAL: 5000, // 5 seconds
  TIME_UPDATE_INTERVAL: 60000, // 1 minute for clock updates
  PRESENCE_HEARTBEAT: 30000, // 30 seconds for presence updates

  // Session & Cache
  SESSION_WARNING: 300000, // 5 minutes before session expires
  CACHE_TTL_DEFAULT: 300000, // 5 minutes default TTL
  CACHE_TTL_STATIC: 3600000, // 1 hour for static resources
  IDLE_TIMEOUT: 300000, // 5 minutes before marking idle

  // UX Audit: Slow Operation Thresholds
  SLOW_OPERATION_THRESHOLD: 10000, // 10 seconds before showing "taking longer" message
} as const;

/**
 * Validation rules
 */
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 128,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 100,
  MAX_EMAIL_LENGTH: 255,
  MAX_DESCRIPTION_LENGTH: 1000,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_PATTERN: /^\+?[\d\s\-()]+$/,
  PHONE_E164_PATTERN: /^\+?[1-9]\d{1,14}$/, // E.164 format
  URL_PATTERN: /^https?:\/\/.+/,
  USERNAME_PATTERN: /^[a-zA-Z0-9_]+$/, // Letters, numbers, underscores only
  PASSWORD_UPPERCASE_PATTERN: /[A-Z]/, // At least one uppercase
  PASSWORD_LOWERCASE_PATTERN: /[a-z]/, // At least one lowercase
  PASSWORD_NUMBER_PATTERN: /\d/, // At least one number
  PASSWORD_SPECIAL_PATTERN: /[@$!%*?&]/, // At least one special character
} as const;

/**
 * Application routes
 * Single source of truth for all route paths
 * Use these constants instead of hardcoding paths in router.navigate() and routerLink
 */
export const ROUTES = {
  // Public routes
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  RESET_PASSWORD: "/reset-password",
  UPDATE_PASSWORD: "/update-password",
  VERIFY_EMAIL: "/verify-email",
  AUTH_CALLBACK: "/auth-callback",
  ACCEPT_INVITATION: "/accept-invitation",

  // Main navigation
  DASHBOARD: "/dashboard",
  PLAYER_DASHBOARD: "/player-dashboard",
  COACH_DASHBOARD: "/coach/dashboard",

  // Training
  TRAINING: "/training",
  TRAINING_SCHEDULE: "/training/schedule",
  TRAINING_LOG: "/training/log",
  TRAINING_PROTOCOL: "/training/protocol",
  TRAINING_SMART_FORM: "/training/smart-form",
  TODAY: "/todays-practice",

  // Analytics & Performance
  ANALYTICS: "/performance/insights",
  ACWR: "/performance/load",
  ACWR_DASHBOARD: "/performance/load",
  PERFORMANCE_TRACKING: "/performance/tests",
  GAME_TRACKER: "/tournaments",

  // Team Management
  ROSTER: "/roster",
  DEPTH_CHART: "/team/workspace",
  ATTENDANCE: "/attendance",
  TEAM_WORKSPACE: "/team/workspace",
  TEAM_CREATE: "/team/workspace",

  // User
  PROFILE: "/profile",
  SETTINGS: "/settings",
  ONBOARDING: "/onboarding",

  // Wellness
  WELLNESS: "/wellness",
  CYCLE_TRACKING: "/cycle-tracking",
  SLEEP_DEBT: "/sleep-debt",
  TRAVEL_RECOVERY: "/wellness",

  // Game
  PLAYBOOK: "/playbook",
  FILM_ROOM: "/film-room",
  TOURNAMENTS: "/tournaments",

  // Social
  COMMUNITY: "/team-chat",
  CHAT: "/chat",
  TEAM_CHAT: "/team-chat",

  // Coach Features
  COACH: "/coach",
  COACH_ANALYTICS: "/coach/analytics",
  COACH_PLANNING: "/coach/planning",
  COACH_TEAM_WORKSPACE: "/team/workspace",
  COACH_TEAM_MANAGEMENT: "/coach/team",
  COACH_PRACTICE_PLANNER: "/coach/planning",
  COACH_INJURY_MANAGEMENT: "/coach/analytics",
  COACH_KNOWLEDGE_BASE: "/knowledge",
  COACH_PROGRAM_BUILDER: "/coach/planning",
  COACH_PLAYER_DEVELOPMENT: "/coach/analytics",
  COACH_PAYMENT_MANAGEMENT: "/team/workspace",

  // Staff
  STAFF_NUTRITIONIST: "/staff/nutritionist",
  STAFF_PHYSIOTHERAPIST: "/staff/physiotherapist",
  STAFF_PSYCHOLOGY: "/staff/psychology",

  // Admin
  ADMIN: "/admin",
  SUPERADMIN: "/superadmin",
  SUPERADMIN_DASHBOARD: "/superadmin/dashboard",
  SUPERADMIN_USERS: "/superadmin/users",
  SUPERADMIN_TEAMS: "/superadmin/teams",
  SUPERADMIN_SETTINGS: "/superadmin/settings",

  // Other
  EQUIPMENT: "/team/workspace",
  ACHIEVEMENTS: "/achievements",
  EXERCISE_LIBRARY: "/exercise-library",
  DATA_IMPORT: "/data-import",
  RETURN_TO_PLAY: "/return-to-play",
  HELP: "/help",
  OFFICIALS: "/team/workspace",
  PAYMENTS: "/payments",
  NOT_FOUND: "/404",
} as const;

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: "auth_token",
  REFRESH_TOKEN: "refresh_token",
  USER_PREFERENCES: "user_preferences",
  THEME: "theme",
  LANGUAGE: "language",
  SIDEBAR_STATE: "sidebar_state",
  LAST_ROUTE: "last_route",
  CACHE_PREFIX: "cache_",
} as const;

/**
 * API configuration
 */
export const API = {
  BASE_URL: "/api",
  VERSION: "v1",
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

/**
 * File upload limits
 */
export const FILE_UPLOAD = {
  MAX_SIZE_MB: 10,
  MAX_SIZE_BYTES: 10 * 1024 * 1024,
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  ALLOWED_DOCUMENT_TYPES: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  ALLOWED_VIDEO_TYPES: ["video/mp4", "video/webm"],
} as const;

/**
 * Date and time formats
 */
export const DATE_FORMATS = {
  SHORT_DATE: "MM/dd/yyyy",
  LONG_DATE: "MMMM d, yyyy",
  SHORT_TIME: "h:mm a",
  LONG_TIME: "h:mm:ss a",
  FULL_DATETIME: "MMM d, yyyy h:mm a",
  ISO_DATE: "yyyy-MM-dd",
  ISO_DATETIME: "yyyy-MM-dd'T'HH:mm:ss",
} as const;

/**
 * Training thresholds and configuration
 *
 * Includes intensity scales, duration limits, ACWR thresholds, speed thresholds,
 * and training frequency limits for flag football.
 *
 * @example
 * import { TRAINING } from '@core/constants';
 * if (acwr > TRAINING.ACWR_DANGER_THRESHOLD) {
 *   // Danger zone - reduce load
 * }
 * if (speed > TRAINING.SPRINT_M_S) {
 *   // Sprint detected
 * }
 */
export const TRAINING = {
  // Intensity scale
  MIN_INTENSITY: 1,
  MAX_INTENSITY: 10,
  DEFAULT_INTENSITY: 5,

  // Duration limits
  MIN_DURATION_MINUTES: 5,
  MAX_DURATION_MINUTES: 240,

  // ACWR (Acute:Chronic Workload Ratio)
  ACWR_SAFE_RANGE_MIN: 0.8,
  ACWR_SAFE_RANGE_MAX: 1.3,
  ACWR_WARNING_THRESHOLD: 1.5,
  ACWR_DANGER_THRESHOLD: 2.0,
  ACUTE_LOAD_DAYS: 7,
  CHRONIC_LOAD_DAYS: 28,
  MIN_DAYS_FOR_CHRONIC: 21, // Minimum days needed for ACWR calculation

  // Flag football specifics
  TARGET_LOAD_AU: 2000, // Target arbitrary units for load
  WEEKLY_THROW_LIMIT: 300, // QB weekly throw limit
  SPRINT_CAPACITY_WARNING: 70, // Below this triggers warning

  // Training frequency
  MAX_SESSIONS_PER_WEEK: 5,
  MIN_REST_DAYS_PER_WEEK: 2,

  // Speed thresholds (m/s)
  HIGH_SPEED_M_S: 5.5, // High-speed running threshold
  SPRINT_M_S: 7.0, // Sprint threshold
} as const;

/**
 * UI breakpoints (pixels)
 */
export const BREAKPOINTS = {
  MOBILE: 576,
  TABLET: 768,
  DESKTOP: 992,
  WIDE: 1200,
  ULTRA_WIDE: 1600,
} as const;

/**
 * Animation durations (milliseconds)
 */
export const ANIMATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 1000,
} as const;

/**
 * Time conversion utilities (milliseconds)
 * Use these instead of hardcoded calculations like `7 * 24 * 60 * 60 * 1000`
 */
export const TIME = {
  MS_PER_SECOND: 1000,
  MS_PER_MINUTE: 60 * 1000,
  MS_PER_HOUR: 60 * 60 * 1000,
  MS_PER_DAY: 24 * 60 * 60 * 1000,
  MS_PER_WEEK: 7 * 24 * 60 * 60 * 1000,

  // Common durations
  INVITATION_EXPIRY_DAYS: 7,
  NOTIFICATION_EXPIRY_DAYS: 30,
  DEFAULT_REVIEW_PERIOD_DAYS: 7,
} as const;

/**
 * UI limits for lists, slices, and pagination
 * Prevents inconsistent truncation across components
 */
export const UI_LIMITS = {
  // Preview counts (dashboard cards, sidebars)
  GOALS_PREVIEW_COUNT: 3,
  SCHEDULE_PREVIEW_COUNT: 3,
  EVENTS_PREVIEW_COUNT: 4,
  RECENT_ACTIVITIES_COUNT: 5,
  TOP_PRIORITIES_COUNT: 3,
  MISSING_FIELDS_PREVIEW: 2,
  SIDEBAR_SHORTCUTS_COUNT: 2,
  WORKOUTS_PREVIEW_COUNT: 4,
  UPCOMING_GAMES_PREVIEW: 2,
  TRAINING_SESSIONS_PREVIEW: 2,
  RECOMMENDATIONS_PREVIEW: 3,
  RECOMMENDATIONS_EXPANDED: 4,
  ACTIVITIES_PREVIEW: 4,
  BENEFITS_PREVIEW: 4,
  EQUIPMENT_PREVIEW: 2,
  INJURIES_PREVIEW: 2,
  COMMUNITY_PREVIEW: 2,
  ONBOARDING_DAYS_PREVIEW: 4,
  DECISIONS_PREVIEW: 3,
  DECISIONS_LIST_COUNT: 6,

  // AI & Search
  AI_SUGGESTIONS_COUNT: 4,
  AI_CHIPS_COUNT: 3,
  SEARCH_RESULTS_MAX: 20,
  SEARCH_SUGGESTIONS_MAX: 6,
  SEARCH_HISTORY_MAX: 10,
  SUGGESTED_ACTIONS_COUNT: 3,

  // Training & Schedule
  UPCOMING_SESSIONS_COUNT: 5,
  TRAINING_FOCUS_PREVIEW: 3,
  POSITIONS_PREVIEW: 2,
  CHART_COLORS_COUNT: 5,

  // Data fetching limits
  NOTIFICATIONS_MAX_FETCH: 100,
  EXPORT_SESSIONS_MAX: 500,
  EXPORT_WELLNESS_MAX: 365,
  RECENT_SHORTCUTS_COUNT: 5,

  // Calendar
  CALENDAR_EVENTS_PER_DAY: 2,
  CALENDAR_WEEKS_DISPLAY: 6,
} as const;

/**
 * Design system colors (HEX values for Chart.js/Canvas rendering)
 *
 * ⚠️ IMPORTANT: For DOM elements (styles, classes), use CSS variable references from:
 * `@core/utils/design-tokens.util` - BRAND_COLORS, STATUS_COLORS
 *
 * This COLORS constant contains HEX VALUES for specific scenarios:
 * - Chart.js/Canvas rendering (cannot read CSS variables)
 * - Server-side rendering fallbacks
 * - External APIs that require hex values
 *
 * For DOM elements, use CSS variable references instead:
 * - Import { BRAND_COLORS, STATUS_COLORS } from '@core/utils/design-tokens.util'
 *
 * Maps to CSS custom properties in design-system-tokens.scss
 *
 * @example
 * // ✅ For Chart.js (hex values required)
 * import { COLORS } from '@core/constants';
 * backgroundColor: COLORS.SUCCESS
 *
 * @example
 * // ✅ For DOM elements (use CSS variables)
 * import { STATUS_COLORS } from '@core/utils/design-tokens.util';
 * style.color = STATUS_COLORS.success;
 */
export const COLORS = {
  // Brand colors (use BRAND_COLORS from design-tokens.util for DOM)
  PRIMARY: "var(--p-highlight-text-color)", // --ds-primary-green
  PRIMARY_LIGHT: "var(--p-highlight-text-color)", // --color-brand-primary-light
  PRIMARY_DARK: "var(--hover-text-primary)", // --ds-primary-green-hover

  // Semantic status colors (use STATUS_COLORS from design-tokens.util for DOM)
  SUCCESS: "var(--color-status-success)",
  SUCCESS_LIGHT: "var(--color-status-success-light)",
  WARNING: "var(--color-status-warning)",
  WARNING_LIGHT: "var(--color-status-warning-light)",
  ERROR: "var(--color-status-error)",
  ERROR_LIGHT: "var(--color-status-error-light)",
  INFO: "var(--color-status-info)",
  INFO_LIGHT: "var(--color-status-info-light)",

  // UI accent colors (map to design-system-tokens.scss)
  BLUE: "var(--color-chart-tertiary)",
  CYAN: "var(--primitive-info-500)",
  PURPLE: "var(--color-status-help)",
  PURPLE_LIGHT: "var(--color-status-help-light)",
  TEAL: "var(--color-phase-late-season)",
  GRAY: "var(--color-workout-rest)",
  SLATE: "var(--p-surface-400)",
  AMBER: "var(--primitive-warning-500)",
  ORANGE: "var(--ds-primary-orange)",
  LIME: "var(--primitive-primary-500)",
  GREEN: "var(--primitive-primary-600)",
  YELLOW: "var(--primitive-success-500)",

  // Chart-specific colors (for canvas rendering only)
  // Maps to: --color-chart-1 through --color-chart-6
  CHART: [
    "var(--p-highlight-text-color)", // --color-chart-1 (ds-primary-green)
    "var(--p-highlight-text-color)", // --color-chart-2 (brand secondary)
    "var(--color-chart-3)", // --color-chart-3 (gold)
    "var(--color-chart-4)", // --color-chart-4 (red)
    "var(--color-chart-5)", // --color-chart-5 (blue)
    "var(--color-chart-6)", // --color-chart-6 (purple)
  ],
} as const;

/**
 * Performance metrics
 */
export const PERFORMANCE = {
  LCP_THRESHOLD: 2500, // Largest Contentful Paint (ms)
  FID_THRESHOLD: 100, // First Input Delay (ms)
  CLS_THRESHOLD: 0.1, // Cumulative Layout Shift
  BUNDLE_SIZE_WARNING: 700000, // 700KB
  BUNDLE_SIZE_ERROR: 1000000, // 1MB
} as const;
