/**
 * Environment Configuration
 * Centralized configuration for different deployment environments
 */

// Detect current environment
const getEnvironment = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;

  // Production environments
  if (hostname.includes('.netlify.app') || hostname.includes('flagfit-pro.com')) {
    return 'production';
  }

  // Staging environments
  if (hostname.includes('staging') || hostname.includes('dev')) {
    return 'staging';
  }

  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('192.168')) {
    return 'development';
  }

  // Default to development for safety
  return 'development';
};

const ENV = getEnvironment();

// Helper to safely access process.env in browser
const getEnvVar = (key, defaultValue = '') => {
  // Check if process exists and has env property (Node.js environment)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  // For browser environment, check window._env or return default
  if (typeof window !== 'undefined' && window._env) {
    return window._env[key] || defaultValue;
  }
  return defaultValue;
};

// Environment-specific configurations
const configs = {
  development: {
    API_BASE_URL: 'mock://api', // Use mock API by default in development
    DATABASE_URL: 'http://localhost:5432',
    ENABLE_MOCK_AUTH: true,
    ENABLE_DEBUG_LOGS: true,
    ENABLE_ANALYTICS: false,
    YOUTUBE_API_KEY: getEnvVar('YOUTUBE_API_KEY', ''),
    POCKETBASE_URL: getEnvVar('POCKETBASE_URL', 'http://localhost:8090'),
    NEON_DATABASE_URL: getEnvVar('NEON_DATABASE_URL', ''),
    ENABLE_SECURE_STORAGE: false, // Disable for local dev
  },

  staging: {
    API_BASE_URL: getEnvVar('REACT_APP_API_URL', 'https://api-staging.flagfit-pro.com'),
    DATABASE_URL: getEnvVar('DATABASE_URL', ''),
    ENABLE_MOCK_AUTH: false,
    ENABLE_DEBUG_LOGS: true,
    ENABLE_ANALYTICS: true,
    YOUTUBE_API_KEY: getEnvVar('YOUTUBE_API_KEY', ''),
    POCKETBASE_URL: getEnvVar('POCKETBASE_URL', ''),
    NEON_DATABASE_URL: getEnvVar('NEON_DATABASE_URL', ''),
    ENABLE_SECURE_STORAGE: true,
  },

  production: {
    API_BASE_URL: getEnvVar('REACT_APP_API_URL', 'https://api.flagfit-pro.com'),
    DATABASE_URL: getEnvVar('DATABASE_URL', ''),
    ENABLE_MOCK_AUTH: false,
    ENABLE_DEBUG_LOGS: false,
    ENABLE_ANALYTICS: true,
    YOUTUBE_API_KEY: getEnvVar('YOUTUBE_API_KEY', ''),
    POCKETBASE_URL: getEnvVar('POCKETBASE_URL', ''),
    NEON_DATABASE_URL: getEnvVar('NEON_DATABASE_URL', ''),
    ENABLE_SECURE_STORAGE: true,
  }
};

// Get current configuration
const config = configs[ENV];

// Validation for required environment variables
const validateConfig = () => {
  const errors = [];

  if (ENV === 'production') {
    if (!config.API_BASE_URL) {
      errors.push('API_BASE_URL is required in production');
    }
    if (!config.DATABASE_URL && !config.NEON_DATABASE_URL) {
      errors.push('DATABASE_URL or NEON_DATABASE_URL is required in production');
    }
    if (!config.POCKETBASE_URL) {
      errors.push('POCKETBASE_URL is required in production');
    }
  }

  if (errors.length > 0) {
    console.error('Environment configuration errors:', errors);
    // Don't throw in production to avoid breaking the app
    if (ENV === 'development') {
      throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
    }
  }
};

// Feature flags based on environment
const features = {
  ENHANCED_ANALYTICS: true,
  AI_PREDICTIONS: true,
  TRAINING_MODULES: true,
  WELLNESS_TRACKING: ENV !== 'development', // Enable in staging/prod
  SOCIAL_FEATURES: ENV === 'production',
  BETA_FEATURES: ENV !== 'production',
  ERROR_REPORTING: ENV !== 'development',
  PERFORMANCE_MONITORING: ENV !== 'development',
};

// API endpoints configuration
const apiEndpoints = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
  },
  ANALYTICS: {
    EVENTS: '/analytics/events',
    PERFORMANCE: '/analytics/performance',
    USER_BEHAVIOR: '/analytics/behavior',
  },
  TRAINING: {
    SESSIONS: '/training/sessions',
    PROGRAMS: '/training/programs',
    EXERCISES: '/training/exercises',
  },
  WELLNESS: {
    METRICS: '/wellness/metrics',
    RECOMMENDATIONS: '/wellness/recommendations',
  },
};

// Security configuration
const security = {
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes before expiry
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  ENABLE_CSP: ENV !== 'development',
  ENABLE_HSTS: ENV === 'production',
};

// Perform validation
validateConfig();

// Export configuration
export {
  ENV,
  config,
  features,
  apiEndpoints,
  security,
  getEnvironment,
};

export default {
  ENV,
  ...config,
  features,
  apiEndpoints,
  security,
};

// Log current environment (only in development)
if (config.ENABLE_DEBUG_LOGS) {
  console.log(`🌍 Environment: ${ENV}`);
  console.log('📋 Configuration:', {
    API_BASE_URL: config.API_BASE_URL,
    ENABLE_MOCK_AUTH: config.ENABLE_MOCK_AUTH,
    ENABLE_ANALYTICS: config.ENABLE_ANALYTICS,
    features,
  });
}