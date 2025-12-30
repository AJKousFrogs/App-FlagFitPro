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
  API_TIMEOUT: 30000,           // 30 seconds
  DEBOUNCE_TIME: 300,           // 300ms for search/input
  TOAST_DURATION: 3000,         // 3 seconds
  AUTO_SAVE_DELAY: 1000,        // 1 second
  POLLING_INTERVAL: 5000,       // 5 seconds
  SESSION_WARNING: 300000,      // 5 minutes before session expires
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
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  TRAINING: '/training',
  ANALYTICS: '/analytics',
  ROSTER: '/roster',
  GAME_TRACKER: '/game-tracker',
  ADMIN: '/admin',
} as const;

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
  LANGUAGE: 'language',
  SIDEBAR_STATE: 'sidebar_state',
  LAST_ROUTE: 'last_route',
  CACHE_PREFIX: 'cache_',
} as const;

/**
 * API configuration
 */
export const API = {
  BASE_URL: '/api',
  VERSION: 'v1',
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

/**
 * File upload limits
 */
export const FILE_UPLOAD = {
  MAX_SIZE_MB: 10,
  MAX_SIZE_BYTES: 10 * 1024 * 1024,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm'],
} as const;

/**
 * Date and time formats
 */
export const DATE_FORMATS = {
  SHORT_DATE: 'MM/dd/yyyy',
  LONG_DATE: 'MMMM d, yyyy',
  SHORT_TIME: 'h:mm a',
  LONG_TIME: 'h:mm:ss a',
  FULL_DATETIME: 'MMM d, yyyy h:mm a',
  ISO_DATE: 'yyyy-MM-dd',
  ISO_DATETIME: "yyyy-MM-dd'T'HH:mm:ss",
} as const;

/**
 * Training thresholds
 */
export const TRAINING = {
  MIN_INTENSITY: 1,
  MAX_INTENSITY: 10,
  DEFAULT_INTENSITY: 5,
  MIN_DURATION_MINUTES: 5,
  MAX_DURATION_MINUTES: 240,
  ACWR_SAFE_RANGE_MIN: 0.8,
  ACWR_SAFE_RANGE_MAX: 1.3,
  ACUTE_LOAD_DAYS: 7,
  CHRONIC_LOAD_DAYS: 28,
} as const;

/**
 * Player positions
 */
export const POSITIONS = {
  OFFENSE: ['QB', 'WR', 'RB', 'TE', 'OL', 'C', 'G', 'T'] as const,
  DEFENSE: ['DB', 'CB', 'S', 'LB', 'DL', 'DE', 'DT'] as const,
  SPECIAL_TEAMS: ['K', 'P', 'LS'] as const,
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
 * Chart configuration
 * Colors map to design system tokens:
 * - --color-chart-1 through --color-chart-6
 * - See design-system-tokens.scss for single source of truth
 * Note: Chart.js requires hex values (can't use CSS vars in canvas)
 */
export const CHART = {
  DEFAULT_COLORS: [
    '#089949', // --color-chart-1 (ds-primary-green)
    '#10c96b', // --color-chart-2 (brand secondary)
    '#f1c40f', // --color-chart-3 (success/gold)
    '#e74c3c', // --color-chart-4 (error)
    '#3498db', // --color-chart-5 (info)
    '#9b59b6', // --color-chart-6 (purple)
  ],
  ANIMATION_DURATION: 750,
  FONT_FAMILY: "'Poppins', sans-serif",
} as const;

/**
 * Status types
 */
export const STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
} as const;

/**
 * User roles
 */
export const USER_ROLES = {
  ADMIN: 'admin',
  COACH: 'coach',
  ATHLETE: 'athlete',
  PARENT: 'parent',
  GUEST: 'guest',
} as const;

/**
 * Notification types
 */
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
} as const;

/**
 * Performance metrics
 */
export const PERFORMANCE = {
  LCP_THRESHOLD: 2500,          // Largest Contentful Paint (ms)
  FID_THRESHOLD: 100,           // First Input Delay (ms)
  CLS_THRESHOLD: 0.1,           // Cumulative Layout Shift
  BUNDLE_SIZE_WARNING: 700000,  // 700KB
  BUNDLE_SIZE_ERROR: 1000000,   // 1MB
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
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_PHONE: 'Please enter a valid phone number',
  WEAK_PASSWORD: 'Password must be at least 8 characters with uppercase, lowercase, and number',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  NOT_FOUND: 'The requested resource was not found',
  SERVER_ERROR: 'An unexpected error occurred. Please try again.',
} as const;

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  SAVED: 'Successfully saved',
  DELETED: 'Successfully deleted',
  UPDATED: 'Successfully updated',
  CREATED: 'Successfully created',
  LOGIN: 'Successfully logged in',
  LOGOUT: 'Successfully logged out',
  EMAIL_SENT: 'Email sent successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
} as const;

