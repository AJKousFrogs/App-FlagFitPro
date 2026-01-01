import { logger } from "../../logger.js";

/**
 * FlagFit Pro - Application Constants
 * Centralized constants to avoid hardcoded values throughout the codebase
 */

/**
 * UI Constants
 */
export const UI = {
  // Breakpoints (in pixels)
  BREAKPOINT_MOBILE: 768,
  BREAKPOINT_TABLET: 1024,
  BREAKPOINT_DESKTOP: 1280,

  // Animation durations (in milliseconds)
  ANIMATION_FAST: 150,
  ANIMATION_NORMAL: 300,
  ANIMATION_SLOW: 500,

  // Notification durations (in milliseconds)
  NOTIFICATION_SHORT: 3000,
  NOTIFICATION_NORMAL: 5000,
  NOTIFICATION_LONG: 8000,
  NOTIFICATION_ERROR: 10000,

  // Z-index layers
  Z_INDEX_DROPDOWN: 1000,
  Z_INDEX_MODAL: 9999,
  Z_INDEX_NOTIFICATION: 10000,
  Z_INDEX_TOOLTIP: 10001,

  // Loading states
  LOADING_MIN_DISPLAY: 300, // Minimum time to show loading indicator
  LOADING_DEBOUNCE: 100, // Debounce before showing loading
};

/**
 * Data Limits
 */
export const DATA_LIMITS = {
  // Storage limits
  MAX_WORKOUTS_STORED: 50,
  MAX_WELLNESS_ENTRIES: 365, // One year
  MAX_NOTIFICATIONS: 100,

  // Input limits
  MAX_NAME_LENGTH: 100,
  MAX_EMAIL_LENGTH: 254,
  MAX_PASSWORD_LENGTH: 128,
  MIN_PASSWORD_LENGTH: 8,
  MAX_MESSAGE_LENGTH: 1000,
  MAX_NOTES_LENGTH: 500,

  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

/**
 * Session & Authentication
 */
export const AUTH = {
  // Session timeout (in milliseconds)
  SESSION_TIMEOUT: 2 * 60 * 60 * 1000, // 2 hours
  SESSION_WARNING_TIME: 5 * 60 * 1000, // 5 minutes before timeout

  // Token refresh
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes before expiry

  // Login attempts
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes

  // Password requirements
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REQUIRE_UPPERCASE: true,
  PASSWORD_REQUIRE_LOWERCASE: true,
  PASSWORD_REQUIRE_NUMBER: true,
  PASSWORD_REQUIRE_SPECIAL: false,
};

/**
 * API & Network
 */
export const NETWORK = {
  // Timeouts (in milliseconds)
  API_TIMEOUT: 30000, // 30 seconds
  API_TIMEOUT_SHORT: 10000, // 10 seconds
  API_TIMEOUT_LONG: 60000, // 1 minute

  // Retry settings
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
  RETRY_BACKOFF_MULTIPLIER: 2,

  // Cache settings
  CACHE_DURATION_SHORT: 5 * 60 * 1000, // 5 minutes
  CACHE_DURATION_MEDIUM: 15 * 60 * 1000, // 15 minutes
  CACHE_DURATION_LONG: 60 * 60 * 1000, // 1 hour

  // Debounce/throttle
  SEARCH_DEBOUNCE: 300, // 300ms
  SCROLL_THROTTLE: 100, // 100ms
};

/**
 * Wellness & Health Metrics
 */
export const WELLNESS = {
  // Scale ranges
  MIN_RATING: 1,
  MAX_RATING: 10,
  DEFAULT_RATING: 5,

  // Sleep ranges (hours)
  MIN_SLEEP: 0,
  MAX_SLEEP: 24,
  RECOMMENDED_SLEEP_MIN: 7,
  RECOMMENDED_SLEEP_MAX: 9,

  // Hydration (glasses/day)
  RECOMMENDED_HYDRATION: 8,

  // Warning thresholds
  LOW_ENERGY_THRESHOLD: 3,
  HIGH_STRESS_THRESHOLD: 7,
  LOW_SLEEP_HOURS: 6,
};

/**
 * Training & Performance
 */
export const TRAINING = {
  // Duration limits (minutes)
  MIN_WORKOUT_DURATION: 1,
  MAX_WORKOUT_DURATION: 300, // 5 hours
  DEFAULT_WORKOUT_DURATION: 60,

  // Rest periods (seconds)
  REST_SHORT: 30,
  REST_MEDIUM: 60,
  REST_LONG: 120,

  // Training load
  LIGHT_LOAD_MAX: 3,
  MODERATE_LOAD_MAX: 6,
  HEAVY_LOAD_MAX: 10,
};

/**
 * File Upload
 */
export const UPLOAD = {
  // Size limits (bytes)
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_VIDEO_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_DOCUMENT_SIZE: 10 * 1024 * 1024, // 10MB

  // Allowed types
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  ALLOWED_VIDEO_TYPES: ["video/mp4", "video/webm", "video/ogg"],
  ALLOWED_DOCUMENT_TYPES: ["application/pdf", "application/msword"],
};

/**
 * Date & Time
 */
export const DATETIME = {
  // Formats
  DATE_FORMAT: "YYYY-MM-DD",
  TIME_FORMAT: "HH:mm",
  DATETIME_FORMAT: "YYYY-MM-DD HH:mm:ss",
  DISPLAY_DATE_FORMAT: "MMM DD, YYYY",
  DISPLAY_TIME_FORMAT: "h:mm A",

  // Ranges
  SCHEDULE_LOOKAHEAD_DAYS: 30,
  HISTORY_LOOKBACK_DAYS: 90,
};

/**
 * Accessibility
 */
export const A11Y = {
  // Keyboard navigation
  KEY_CODES: {
    ENTER: 13,
    ESCAPE: 27,
    SPACE: 32,
    ARROW_UP: 38,
    ARROW_DOWN: 40,
    TAB: 9,
  },

  // Focus management
  FOCUS_TRAP_TIMEOUT: 100,
  ANNOUNCEMENT_DELAY: 100,
};

/**
 * Feature Flags
 * These can be used to toggle features on/off
 */
export const FEATURES = {
  ENABLE_DARK_MODE: true,
  ENABLE_OFFLINE_MODE: true,
  ENABLE_PUSH_NOTIFICATIONS: true,
  ENABLE_ACHIEVEMENTS: true,
  ENABLE_SOCIAL_FEATURES: true,
  ENABLE_VIDEO_ANALYSIS: false, // Coming soon
  ENABLE_AI_COACHING: false, // Coming soon
};

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
  AUTH_REQUIRED: "Please log in to continue.",
  SESSION_EXPIRED: "Your session has expired. Please log in again.",
  PERMISSION_DENIED: "You do not have permission to perform this action.",
  NOT_FOUND: "The requested resource was not found.",
  VALIDATION_ERROR: "Please check your input and try again.",
  SERVER_ERROR: "Server error. Please try again later.",
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again.",
};

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: "Welcome back!",
  LOGOUT_SUCCESS: "You have been logged out.",
  SAVE_SUCCESS: "Changes saved successfully.",
  DELETE_SUCCESS: "Deleted successfully.",
  UPLOAD_SUCCESS: "Upload completed successfully.",
};

/**
 * Validation Rules
 */
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^[\d\s\-+()]+$/,
  URL_REGEX: /^https?:\/\/.+/,

  // Password strength
  PASSWORD_REGEX: {
    HAS_UPPERCASE: /[A-Z]/,
    HAS_LOWERCASE: /[a-z]/,
    HAS_NUMBER: /\d/,
    HAS_SPECIAL: /[!@#$%^&*(),.?":{}|<>]/,
  },
};

/**
 * Local Storage Keys
 * Centralized to avoid typos and conflicts
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: "authToken",
  USER_DATA: "userData",
  WELLNESS_HISTORY: "wellnessHistory",
  WORKOUT_HISTORY: "workoutHistory",
  PREFERENCES: "userPreferences",
  THEME: "themePreference",
  LANGUAGE: "languagePreference",
  NOTIFICATIONS: "notificationHistory",
  CACHE_PREFIX: "cache_",
  CSRF_TOKEN: "__csrf_token",
};

/**
 * Helper function to check if running on mobile
 */
export function isMobile() {
  return window.innerWidth < UI.BREAKPOINT_MOBILE;
}

/**
 * Helper function to check if running on tablet
 */
export function isTablet() {
  return (
    window.innerWidth >= UI.BREAKPOINT_MOBILE &&
    window.innerWidth < UI.BREAKPOINT_DESKTOP
  );
}

/**
 * Helper function to check if running on desktop
 */
export function isDesktop() {
  return window.innerWidth >= UI.BREAKPOINT_DESKTOP;
}

// Export all constants as default
export default {
  UI,
  DATA_LIMITS,
  AUTH,
  NETWORK,
  WELLNESS,
  TRAINING,
  UPLOAD,
  DATETIME,
  A11Y,
  FEATURES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  VALIDATION,
  STORAGE_KEYS,
  isMobile,
  isTablet,
  isDesktop,
};

logger.info("[App Constants] Application constants loaded");
