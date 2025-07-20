/**
 * Security Middleware
 * Provides request/response security processing
 */

import securityService from '../services/security.service.js';
import logger from '../services/logger.service.js';
import sentryService from '../services/sentry.service.js';

class SecurityMiddleware {
  constructor() {
    this.config = {
      enableRateLimit: true,
      enableCSRFProtection: true,
      enableXSSProtection: true,
      enableInputValidation: true,
      trustedDomains: [
        window.location.origin,
        'http://localhost:3000',
        'http://localhost:8090',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:8090'
      ]
    };
  }

  /**
   * Process outgoing requests with security checks
   * @param {Object} config - Request configuration
   * @returns {Object} - Processed configuration
   */
  processRequest(config) {
    try {
      // Add CSRF token to requests
      if (this.config.enableCSRFProtection && this.isModifyingRequest(config.method)) {
        config.headers = {
          ...config.headers,
          'X-CSRF-Token': securityService.getCSRFToken()
        };
      }

      // Add security headers
      config.headers = {
        ...config.headers,
        'X-Requested-With': 'XMLHttpRequest',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
      };

      // Rate limiting check
      if (this.config.enableRateLimit) {
        const userId = this.getCurrentUserId();
        const identifier = userId || 'anonymous';
        
        if (!securityService.checkRateLimit(identifier)) {
          throw new SecurityError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED');
        }
      }

      // Validate request data
      if (this.config.enableInputValidation && config.data) {
        this.validateRequestData(config.data);
      }

      // Validate URL
      this.validateRequestURL(config.url);

      logger.debug('Request security check passed', {
        method: config.method,
        url: config.url,
        hasData: !!config.data
      });

      return config;

    } catch (error) {
      logger.error('Request security check failed', {
        error: error.message,
        method: config.method,
        url: config.url
      });

      sentryService.captureException(error, {
        security: {
          type: 'request_security_check',
          method: config.method,
          url: config.url
        }
      });

      throw error;
    }
  }

  /**
   * Process incoming responses with security checks
   * @param {Object} response - Response object
   * @returns {Object} - Processed response
   */
  processResponse(response) {
    try {
      // Check for security headers in response
      this.validateResponseHeaders(response.headers);

      // Validate response content
      if (response.data && typeof response.data === 'string') {
        this.validateResponseContent(response.data);
      }

      logger.debug('Response security check passed', {
        status: response.status,
        hasData: !!response.data
      });

      return response;

    } catch (error) {
      logger.error('Response security check failed', {
        error: error.message,
        status: response.status
      });

      sentryService.captureException(error, {
        security: {
          type: 'response_security_check',
          status: response.status
        }
      });

      // Don't throw on response validation to avoid breaking app
      return response;
    }
  }

  /**
   * Validate request data for security issues
   * @param {*} data - Data to validate
   */
  validateRequestData(data) {
    if (typeof data === 'string') {
      if (!securityService.validateInput(data)) {
        throw new SecurityError('Invalid input detected', 'INVALID_INPUT');
      }
    } else if (typeof data === 'object' && data !== null) {
      // Recursively validate object properties
      this.validateObjectData(data);
    }
  }

  /**
   * Recursively validate object data
   * @param {Object} obj - Object to validate
   * @param {number} depth - Current recursion depth
   */
  validateObjectData(obj, depth = 0) {
    // Prevent deep recursion attacks
    if (depth > 10) {
      throw new SecurityError('Object too deeply nested', 'DEEP_RECURSION');
    }

    for (const [key, value] of Object.entries(obj)) {
      // Validate key
      if (typeof key === 'string' && !securityService.validateInput(key)) {
        throw new SecurityError(`Invalid key detected: ${key}`, 'INVALID_KEY');
      }

      // Validate value
      if (typeof value === 'string') {
        if (!securityService.validateInput(value)) {
          throw new SecurityError(`Invalid value detected for key: ${key}`, 'INVALID_VALUE');
        }
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        this.validateObjectData(value, depth + 1);
      } else if (Array.isArray(value)) {
        this.validateArrayData(value, depth + 1);
      }
    }
  }

  /**
   * Validate array data
   * @param {Array} arr - Array to validate
   * @param {number} depth - Current recursion depth
   */
  validateArrayData(arr, depth = 0) {
    if (depth > 10) {
      throw new SecurityError('Array too deeply nested', 'DEEP_RECURSION');
    }

    // Limit array size to prevent DoS
    if (arr.length > 1000) {
      throw new SecurityError('Array too large', 'ARRAY_TOO_LARGE');
    }

    for (const item of arr) {
      if (typeof item === 'string') {
        if (!securityService.validateInput(item)) {
          throw new SecurityError('Invalid array item detected', 'INVALID_ARRAY_ITEM');
        }
      } else if (typeof item === 'object' && item !== null) {
        if (Array.isArray(item)) {
          this.validateArrayData(item, depth + 1);
        } else {
          this.validateObjectData(item, depth + 1);
        }
      }
    }
  }

  /**
   * Validate request URL
   * @param {string} url - URL to validate
   */
  validateRequestURL(url) {
    try {
      const urlObj = new URL(url, window.location.origin);
      
      // Check if domain is trusted
      const isTrusted = this.config.trustedDomains.some(domain => {
        try {
          const trustedUrl = new URL(domain);
          return trustedUrl.origin === urlObj.origin;
        } catch {
          return false;
        }
      });

      if (!isTrusted) {
        throw new SecurityError(`Untrusted domain: ${urlObj.origin}`, 'UNTRUSTED_DOMAIN');
      }

      // Check for suspicious paths
      const suspiciousPaths = [
        '../',
        '..\\',
        '/etc/',
        '/proc/',
        '/system/',
        'file://',
        'ftp://'
      ];

      const path = urlObj.pathname + urlObj.search;
      for (const suspicious of suspiciousPaths) {
        if (path.includes(suspicious)) {
          throw new SecurityError(`Suspicious path detected: ${path}`, 'SUSPICIOUS_PATH');
        }
      }

    } catch (error) {
      if (error instanceof SecurityError) {
        throw error;
      }
      throw new SecurityError(`Invalid URL: ${url}`, 'INVALID_URL');
    }
  }

  /**
   * Validate response headers
   * @param {Object} headers - Response headers
   */
  validateResponseHeaders(headers) {
    // Check for security headers
    const securityHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection'
    ];

    const missingHeaders = securityHeaders.filter(header => !headers[header]);
    
    if (missingHeaders.length > 0) {
      logger.warn('Missing security headers in response', { missingHeaders });
    }

    // Check Content-Type header to prevent MIME sniffing
    const contentType = headers['content-type'];
    if (contentType && !this.isValidContentType(contentType)) {
      logger.warn('Suspicious content type', { contentType });
    }
  }

  /**
   * Validate response content
   * @param {string} content - Response content
   */
  validateResponseContent(content) {
    // Check for potential XSS in response
    if (!securityService.checkCSP(content)) {
      logger.warn('Potential CSP violation in response content');
    }

    // Check for suspicious scripts
    const scriptPattern = /<script[\s\S]*?>([\s\S]*?)<\/script>/gi;
    const matches = content.match(scriptPattern);
    
    if (matches) {
      for (const script of matches) {
        if (!securityService.validateInput(script)) {
          logger.warn('Suspicious script in response', { 
            script: script.substring(0, 100) 
          });
        }
      }
    }
  }

  /**
   * Check if request method is modifying
   * @param {string} method - HTTP method
   * @returns {boolean} - Whether method modifies data
   */
  isModifyingRequest(method) {
    const modifyingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    return modifyingMethods.includes(method?.toUpperCase());
  }

  /**
   * Get current user ID for rate limiting
   * @returns {string|null} - User ID or null
   */
  getCurrentUserId() {
    try {
      const authData = JSON.parse(localStorage.getItem('pocketbase_auth') || '{}');
      return authData.model?.id || null;
    } catch {
      return null;
    }
  }

  /**
   * Check if content type is valid
   * @param {string} contentType - Content type to check
   * @returns {boolean} - Whether content type is valid
   */
  isValidContentType(contentType) {
    const validTypes = [
      'application/json',
      'text/html',
      'text/plain',
      'text/css',
      'text/javascript',
      'application/javascript',
      'image/',
      'video/',
      'audio/'
    ];

    return validTypes.some(type => contentType.toLowerCase().startsWith(type));
  }

  /**
   * Handle authentication failure
   * @param {string} identifier - User identifier
   */
  handleAuthenticationFailure(identifier) {
    const isLocked = securityService.trackFailedAttempt(identifier);
    
    if (isLocked) {
      sentryService.captureMessage('Account locked due to failed attempts', 'warning', {
        security: { identifier, type: 'account_lockout' }
      });
    }
  }

  /**
   * Handle successful authentication
   * @param {string} identifier - User identifier
   */
  handleAuthenticationSuccess(identifier) {
    securityService.clearFailedAttempts(identifier);
    securityService.refreshCSRFToken();
  }

  /**
   * Get security status
   * @returns {Object} - Security status
   */
  getSecurityStatus() {
    return {
      csrfToken: securityService.getCSRFToken(),
      metrics: securityService.getSecurityMetrics(),
      config: this.config
    };
  }
}

// Custom Security Error class
class SecurityError extends Error {
  constructor(message, code, statusCode = 403) {
    super(message);
    this.name = 'SecurityError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

// Export singleton instance and classes
export const securityMiddleware = new SecurityMiddleware();
export { SecurityError };
export default securityMiddleware;