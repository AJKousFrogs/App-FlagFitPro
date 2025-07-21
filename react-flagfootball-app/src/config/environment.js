/**
 * Environment Configuration
 * Validates and provides typed access to environment variables
 */

class EnvironmentConfig {
  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  loadConfig() {
    return {
      // App Configuration
      app: {
        name: import.meta.env.VITE_APP_NAME || 'FlagFit Pro',
        version: import.meta.env.VITE_APP_VERSION || '1.0.0',
        environment: import.meta.env.VITE_APP_ENVIRONMENT || 'development'
      },

      // API Configuration
      api: {
        pocketbaseUrl: import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090',
        timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000,
        cacheTTL: parseInt(import.meta.env.VITE_CACHE_TTL) || 300000,
        baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
        aiServiceUrl: import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8080'
      },

      // Feature Flags
      features: {
        analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
        pushNotifications: import.meta.env.VITE_ENABLE_PUSH_NOTIFICATIONS === 'true',
        wearableSync: import.meta.env.VITE_ENABLE_WEARABLE_SYNC === 'true'
      },

      // Development Configuration
      dev: {
        devMode: import.meta.env.VITE_DEV_MODE === 'true',
        debugLogging: import.meta.env.VITE_DEBUG_LOGGING === 'true'
      },

      // Error Tracking - only load if enabled
      sentry: {
        dsn: import.meta.env.VITE_ENABLE_SENTRY === 'true' ? import.meta.env.VITE_SENTRY_DSN : null,
        environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'development'
      }
    };
  }

  validateConfig() {
    const errors = [];

    // Validate required URLs
    if (!this.isValidUrl(this.config.api.pocketbaseUrl)) {
      errors.push('VITE_POCKETBASE_URL must be a valid URL');
    }

    // Validate numeric values
    if (this.config.api.timeout < 1000) {
      errors.push('VITE_API_TIMEOUT must be at least 1000ms');
    }

    if (this.config.api.cacheTTL < 60000) {
      errors.push('VITE_CACHE_TTL must be at least 60000ms (1 minute)');
    }

    // Validate environment
    const validEnvironments = ['development', 'staging', 'production', 'demo'];
    if (!validEnvironments.includes(this.config.app.environment)) {
      errors.push(`VITE_APP_ENVIRONMENT must be one of: ${validEnvironments.join(', ')}`);
    }

    // Skip Sentry DSN validation when Sentry is disabled
    if (import.meta.env.VITE_ENABLE_SENTRY === 'true' && this.config.sentry.dsn && !this.isValidSentryDsn(this.config.sentry.dsn)) {
      errors.push('VITE_SENTRY_DSN must be a valid Sentry DSN format');
    }

    if (errors.length > 0) {
      console.error('Environment configuration errors:', errors);
      if (this.config.app.environment === 'production') {
        throw new Error(`Invalid environment configuration: ${errors.join(', ')}`);
      }
    }
  }

  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  isValidSentryDsn(dsn) {
    // Basic Sentry DSN format validation
    const sentryDsnPattern = /^https:\/\/[a-f0-9]+@[a-z0-9.-]+\/\d+$/;
    return sentryDsnPattern.test(dsn);
  }

  // Getters for easy access
  get isProduction() {
    return this.config.app.environment === 'production';
  }

  get isDevelopment() {
    return this.config.app.environment === 'development';
  }

  get isStaging() {
    return this.config.app.environment === 'staging';
  }

  get debugMode() {
    return this.config.dev.devMode && this.config.dev.debugLogging;
  }

  // Method to get configuration
  getConfig() {
    return this.config;
  }

  // Method to get a specific configuration section
  getSection(section) {
    return this.config[section];
  }
}

// Export singleton instance
export const env = new EnvironmentConfig();
export default env;