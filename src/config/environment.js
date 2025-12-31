import { logger } from '../logger.js';

/**
 * Environment Configuration
 * Centralized configuration for different deployment environments
 */

// Detect current environment
const getEnvironment = () => {
  const {hostname} = window.location;

  // Production environments
  if (
    hostname.includes(".netlify.app") ||
    hostname.includes("flagfit-pro.com")
  ) {
    return "production";
  }

  // Staging environments
  if (hostname.includes("staging") || hostname.includes("dev")) {
    return "staging";
  }

  // Local development
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.includes("192.168")
  ) {
    return "development";
  }

  // Default to development for safety
  return "development";
};

const ENV = getEnvironment();

// Helper to safely access process.env in browser
const getEnvVar = (key, defaultValue = "") => {
  // Check if process exists and has env property (Node.js environment)
  if (typeof process !== "undefined" && process.env) {
    return process.env[key] || defaultValue;
  }
  // For browser environment, check window._env or return default
  if (typeof window !== "undefined" && window._env) {
    return window._env[key] || defaultValue;
  }
  return defaultValue;
};

// Environment-specific configurations
// NOTE: This project uses SUPABASE as the ONLY database system.
// All database operations are handled through Supabase API.
const configs = {
  development: {
    API_BASE_URL: getEnvVar("API_BASE_URL", ""), // Use Netlify Functions or configured API
    ENABLE_MOCK_AUTH: false, // Use real authentication
    ENABLE_DEBUG_LOGS: true,
    ENABLE_ANALYTICS: false,
    YOUTUBE_API_KEY: getEnvVar("YOUTUBE_API_KEY", ""),
    ENABLE_SECURE_STORAGE: false, // Disable for local dev
  },

  staging: {
    API_BASE_URL: getEnvVar("REACT_APP_API_URL", ""), // Use Netlify Functions (relative URLs)
    ENABLE_MOCK_AUTH: false,
    ENABLE_DEBUG_LOGS: true,
    ENABLE_ANALYTICS: true,
    YOUTUBE_API_KEY: getEnvVar("YOUTUBE_API_KEY", ""),
    ENABLE_SECURE_STORAGE: true,
  },

  production: {
    API_BASE_URL: getEnvVar("REACT_APP_API_URL", ""), // Use Netlify Functions (relative URLs)
    ENABLE_MOCK_AUTH: false,
    ENABLE_DEBUG_LOGS: false,
    ENABLE_ANALYTICS: true,
    YOUTUBE_API_KEY: getEnvVar("YOUTUBE_API_KEY", ""),
    ENABLE_SECURE_STORAGE: true,
  },
};

// Get current configuration
const config = configs[ENV];

// Validation for required environment variables
const validateConfig = () => {
  const warnings = [];

  if (ENV === "production") {
    // Note: Supabase credentials are configured in Angular environment files
    // and Netlify Functions, not in this legacy frontend config
    if (!config.API_BASE_URL) {
      warnings.push("API_BASE_URL not configured, using default");
    }
  }

  // In development, validate more strictly
  if (ENV === "development" && warnings.length > 0) {
    logger.warn("⚠️ Environment configuration warnings:", warnings);
  }
};

// Feature flags based on environment
const features = {
  ENHANCED_ANALYTICS: true,
  AI_PREDICTIONS: true,
  TRAINING_MODULES: true,
  WELLNESS_TRACKING: ENV !== "development", // Enable in staging/prod
  SOCIAL_FEATURES: ENV === "production",
  BETA_FEATURES: ENV !== "production",
  ERROR_REPORTING: ENV !== "development",
  PERFORMANCE_MONITORING: ENV !== "development",
};

// API endpoints configuration
const apiEndpoints = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    REFRESH: "/auth/refresh",
    LOGOUT: "/auth/logout",
  },
  ANALYTICS: {
    EVENTS: "/analytics/events",
    PERFORMANCE: "/analytics/performance",
    USER_BEHAVIOR: "/analytics/behavior",
  },
  TRAINING: {
    SESSIONS: "/training/sessions",
    PROGRAMS: "/training/programs",
    EXERCISES: "/training/exercises",
  },
  WELLNESS: {
    METRICS: "/wellness/metrics",
    RECOMMENDATIONS: "/wellness/recommendations",
  },
};

// Security configuration
const security = {
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes before expiry
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  ENABLE_CSP: ENV !== "development",
  ENABLE_HSTS: ENV === "production",
};

// Perform validation
validateConfig();

// Export configuration
export { ENV, config, features, apiEndpoints, security, getEnvironment };

export default {
  ENV,
  ...config,
  features,
  apiEndpoints,
  security,
};

// Log current environment (only in development)
if (config.ENABLE_DEBUG_LOGS) {
  logger.info(`🌍 Environment: ${ENV}`);
  logger.info("📋 Configuration:", {
    API_BASE_URL: config.API_BASE_URL,
    ENABLE_MOCK_AUTH: config.ENABLE_MOCK_AUTH,
    ENABLE_ANALYTICS: config.ENABLE_ANALYTICS,
    features,
  });
}
