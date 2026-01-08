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
  CACHE_TTL_DEFAULT: 5 * 60 * 1000, // 5 minutes
  CACHE_TTL_STATIC: 60 * 60 * 1000, // 1 hour for static resources
  IDLE_TIMEOUT: 5 * 60 * 1000, // 5 minutes before marking idle
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
  URL_PATTERN: /^https?:\/\/.+/,
} as const;

/**
 * Application routes
 */
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  RESET_PASSWORD: "/reset-password",
  VERIFY_EMAIL: "/verify-email",
  DASHBOARD: "/dashboard",
  PROFILE: "/profile",
  SETTINGS: "/settings",
  TRAINING: "/training",
  ANALYTICS: "/analytics",
  ROSTER: "/roster",
  GAME_TRACKER: "/game-tracker",
  ADMIN: "/admin",
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
 * Training thresholds
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
} as const;

/**
 * Player positions
 */
export const POSITIONS = {
  OFFENSE: ["QB", "WR", "RB", "TE", "OL", "C", "G", "T"] as const,
  DEFENSE: ["DB", "CB", "S", "LB", "DL", "DE", "DT"] as const,
  SPECIAL_TEAMS: ["K", "P", "LS"] as const,
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
 * Design system colors
 *
 * ⚠️ IMPORTANT: For most use cases, prefer importing from:
 * `@core/utils/design-tokens.util` which provides CSS variable references
 *
 * This COLORS constant contains HEX VALUES for specific scenarios:
 * - Chart.js/Canvas rendering (cannot read CSS variables)
 * - Server-side rendering fallbacks
 * - External APIs that require hex values
 *
 * For DOM elements (styles, classes), use CSS variable references instead:
 * - Import { BRAND_COLORS, STATUS_COLORS } from '@core/utils/design-tokens.util'
 *
 * Maps to CSS custom properties in design-system-tokens.scss
 */
export const COLORS = {
  // Brand colors (use BRAND_COLORS from design-tokens.util for DOM)
  PRIMARY: "#089949", // --ds-primary-green
  PRIMARY_LIGHT: "#10c96b", // --color-brand-primary-light
  PRIMARY_DARK: "#036d35", // --ds-primary-green-hover

  // Semantic status colors (use STATUS_COLORS from design-tokens.util for DOM)
  SUCCESS: "#089949", // --color-status-success (brand green)
  SUCCESS_LIGHT: "#10c96b", // --color-brand-secondary
  WARNING: "#f59e0b", // --primitive-warning-500
  WARNING_LIGHT: "#fbbf24", // --primitive-warning-400
  ERROR: "#ef4444", // --primitive-error-500
  ERROR_LIGHT: "#f87171", // --primitive-error-400
  INFO: "#3b82f6", // --color-chart-tertiary
  INFO_LIGHT: "#38bdf8", // --primitive-info-400

  // UI accent colors (map to design-system-tokens.scss)
  BLUE: "#3b82f6", // --color-chart-tertiary
  CYAN: "#0284c7",
  PURPLE: "#8b5cf6", // --color-status-help
  PURPLE_LIGHT: "#a855f7",
  TEAL: "#14b8a6",
  GRAY: "#6b7280", // --color-workout-rest
  SLATE: "#94a3b8",
  AMBER: "#f59e0b", // --primitive-warning-500
  ORANGE: "#f97316",
  LIME: "#84cc16",
  GREEN: "#22c55e",
  YELLOW: "#eab308",

  // Chart-specific colors (for canvas rendering only)
  // Maps to: --color-chart-1 through --color-chart-6
  CHART: [
    "#089949", // --color-chart-1 (ds-primary-green)
    "#10c96b", // --color-chart-2 (brand secondary)
    "#f1c40f", // --color-chart-3 (gold)
    "#e74c3c", // --color-chart-4 (red)
    "#3498db", // --color-chart-5 (blue)
    "#9b59b6", // --color-chart-6 (purple)
  ],
} as const;

/**
 * Chart configuration
 *
 * ⚠️ For Chart.js colors, prefer importing from:
 * `@core/utils/design-tokens.util` - CHART_COLORS, CHART_PALETTE
 *
 * These provide the same hex values but with better organization
 * and helper functions like hexToRgba() and createChartGradientColors()
 */
export const CHART = {
  DEFAULT_COLORS: COLORS.CHART,
  ANIMATION_DURATION: 750,
  FONT_FAMILY: "'Poppins', sans-serif",
} as const;

/**
 * Status types
 */
export const STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  FAILED: "failed",
} as const;

/**
 * User roles
 */
export const USER_ROLES = {
  ADMIN: "admin",
  COACH: "coach",
  ATHLETE: "athlete",
  PARENT: "parent",
  GUEST: "guest",
} as const;

/**
 * Notification types
 */
export const NOTIFICATION_TYPES = {
  SUCCESS: "success",
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
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

/**
 * Regular expressions
 */
export const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_US: /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/,
  ZIP_CODE_US: /^\d{5}(-\d{4})?$/,
  ALPHA: /^[a-zA-Z]+$/,
  ALPHA_NUMERIC: /^[a-zA-Z0-9]+$/,
  NUMBER: /^-?\d+\.?\d*$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/,
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  REQUIRED: "This field is required",
  INVALID_EMAIL: "Please enter a valid email address",
  INVALID_PHONE: "Please enter a valid phone number",
  WEAK_PASSWORD:
    "Password must be at least 8 characters with uppercase, lowercase, and number",
  NETWORK_ERROR: "Network error. Please check your connection.",
  UNAUTHORIZED: "You are not authorized to perform this action",
  NOT_FOUND: "The requested resource was not found",
  SERVER_ERROR: "An unexpected error occurred. Please try again.",
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  SAVED: "Successfully saved",
  DELETED: "Successfully deleted",
  UPDATED: "Successfully updated",
  CREATED: "Successfully created",
  LOGIN: "Successfully logged in",
  LOGOUT: "Successfully logged out",
  EMAIL_SENT: "Email sent successfully",
  PASSWORD_CHANGED: "Password changed successfully",
} as const;
