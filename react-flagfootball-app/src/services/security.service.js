/**
 * Security Service
 * Provides client-side security utilities and rate limiting
 */

import logger from './logger.service';
import env from '../config/environment';

class SecurityService {
  constructor() {
    this.rateLimiter = new Map();
    this.blockedIPs = new Set();
    this.failedAttempts = new Map();
    this.config = {
      maxRequestsPerMinute: 60,
      maxFailedAttempts: 5,
      lockoutDuration: 15 * 60 * 1000, // 15 minutes
      cleanupInterval: 5 * 60 * 1000,   // 5 minutes
      csrfTokenLength: 32,
      sessionTimeout: 30 * 60 * 1000    // 30 minutes
    };

    this.setupCleanupInterval();
    this.setupCSRFProtection();
  }

  setupCleanupInterval() {
    setInterval(() => {
      this.cleanupRateLimiter();
      this.cleanupFailedAttempts();
    }, this.config.cleanupInterval);
  }

  setupCSRFProtection() {
    // Generate CSRF token on initialization
    if (!sessionStorage.getItem('csrf_token')) {
      sessionStorage.setItem('csrf_token', this.generateCSRFToken());
    }
  }

  /**
   * Rate limiting for API requests
   * @param {string} identifier - User ID, IP, or other identifier
   * @param {number} maxRequests - Maximum requests per minute
   * @returns {boolean} - Whether request is allowed
   */
  checkRateLimit(identifier, maxRequests = this.config.maxRequestsPerMinute) {
    const now = Date.now();
    const minute = Math.floor(now / 60000);
    const key = `${identifier}_${minute}`;

    if (!this.rateLimiter.has(key)) {
      this.rateLimiter.set(key, { count: 0, timestamp: now });
    }

    const entry = this.rateLimiter.get(key);
    entry.count++;

    if (entry.count > maxRequests) {
      logger.warn('Rate limit exceeded', {
        identifier,
        count: entry.count,
        limit: maxRequests,
        minute
      });
      return false;
    }

    return true;
  }

  /**
   * Track failed authentication attempts
   * @param {string} identifier - User identifier
   * @returns {boolean} - Whether account should be locked
   */
  trackFailedAttempt(identifier) {
    const now = Date.now();
    
    if (!this.failedAttempts.has(identifier)) {
      this.failedAttempts.set(identifier, { count: 0, firstAttempt: now, lastAttempt: now });
    }

    const attempts = this.failedAttempts.get(identifier);
    attempts.count++;
    attempts.lastAttempt = now;

    logger.warn('Failed authentication attempt', {
      identifier,
      count: attempts.count,
      maxAttempts: this.config.maxFailedAttempts
    });

    if (attempts.count >= this.config.maxFailedAttempts) {
      this.lockAccount(identifier);
      return true;
    }

    return false;
  }

  /**
   * Lock account due to excessive failed attempts
   * @param {string} identifier - User identifier
   */
  lockAccount(identifier) {
    const lockUntil = Date.now() + this.config.lockoutDuration;
    
    this.failedAttempts.set(identifier, {
      ...this.failedAttempts.get(identifier),
      lockedUntil: lockUntil
    });

    logger.error('Account locked due to failed attempts', {
      identifier,
      lockUntil: new Date(lockUntil).toISOString(),
      duration: this.config.lockoutDuration
    });
  }

  /**
   * Check if account is currently locked
   * @param {string} identifier - User identifier
   * @returns {boolean} - Whether account is locked
   */
  isAccountLocked(identifier) {
    const attempts = this.failedAttempts.get(identifier);
    if (!attempts || !attempts.lockedUntil) return false;

    if (Date.now() > attempts.lockedUntil) {
      // Lock expired, clear failed attempts
      this.failedAttempts.delete(identifier);
      return false;
    }

    return true;
  }

  /**
   * Clear failed attempts for successful login
   * @param {string} identifier - User identifier
   */
  clearFailedAttempts(identifier) {
    this.failedAttempts.delete(identifier);
    logger.info('Failed attempts cleared for successful login', { identifier });
  }

  /**
   * Validate input against XSS attacks
   * @param {string} input - User input to validate
   * @returns {boolean} - Whether input is safe
   */
  validateInput(input) {
    if (typeof input !== 'string') return false;

    // Check for common XSS patterns
    const xssPatterns = [
      /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      /<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<object[\s\S]*?>[\s\S]*?<\/object>/gi,
      /<embed[\s\S]*?>/gi,
      /<link[\s\S]*?>/gi,
      /<meta[\s\S]*?>/gi
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(input)) {
        logger.warn('XSS attempt detected', { input: input.substring(0, 100) });
        return false;
      }
    }

    return true;
  }

  /**
   * Sanitize user input
   * @param {string} input - Input to sanitize
   * @returns {string} - Sanitized input
   */
  sanitizeInput(input) {
    if (typeof input !== 'string') return '';

    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Generate CSRF token
   * @returns {string} - CSRF token
   */
  generateCSRFToken() {
    const array = new Uint8Array(this.config.csrfTokenLength);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get current CSRF token
   * @returns {string} - CSRF token
   */
  getCSRFToken() {
    return sessionStorage.getItem('csrf_token') || this.generateCSRFToken();
  }

  /**
   * Validate CSRF token
   * @param {string} token - Token to validate
   * @returns {boolean} - Whether token is valid
   */
  validateCSRFToken(token) {
    const storedToken = sessionStorage.getItem('csrf_token');
    return storedToken === token;
  }

  /**
   * Refresh CSRF token
   * @returns {string} - New CSRF token
   */
  refreshCSRFToken() {
    const newToken = this.generateCSRFToken();
    sessionStorage.setItem('csrf_token', newToken);
    return newToken;
  }

  /**
   * Check if content security policy is violated
   * @param {string} content - Content to check
   * @returns {boolean} - Whether CSP is violated
   */
  checkCSP(content) {
    // Basic CSP validation
    const violations = [
      /eval\s*\(/g,
      /Function\s*\(/g,
      /setTimeout\s*\(\s*['"`][^'"`]*['"`]/g,
      /setInterval\s*\(\s*['"`][^'"`]*['"`]/g
    ];

    for (const violation of violations) {
      if (violation.test(content)) {
        logger.warn('CSP violation detected', { content: content.substring(0, 100) });
        return false;
      }
    }

    return true;
  }

  /**
   * Validate URL to prevent open redirects
   * @param {string} url - URL to validate
   * @returns {boolean} - Whether URL is safe
   */
  validateRedirectURL(url) {
    try {
      const urlObj = new URL(url, window.location.origin);
      
      // Only allow same-origin redirects
      if (urlObj.origin !== window.location.origin) {
        logger.warn('Cross-origin redirect attempt', { url });
        return false;
      }

      // Block dangerous protocols
      const allowedProtocols = ['http:', 'https:'];
      if (!allowedProtocols.includes(urlObj.protocol)) {
        logger.warn('Dangerous protocol in redirect', { url, protocol: urlObj.protocol });
        return false;
      }

      return true;
    } catch (error) {
      logger.warn('Invalid redirect URL', { url, error: error.message });
      return false;
    }
  }

  /**
   * Generate secure random string
   * @param {number} length - Length of string
   * @returns {string} - Random string
   */
  generateSecureRandomString(length = 32) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Hash sensitive data
   * @param {string} data - Data to hash
   * @returns {Promise<string>} - Hashed data
   */
  async hashData(data) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Clean up old rate limit entries
   */
  cleanupRateLimiter() {
    const now = Date.now();
    const currentMinute = Math.floor(now / 60000);

    for (const [key, entry] of this.rateLimiter.entries()) {
      const entryMinute = Math.floor(entry.timestamp / 60000);
      
      // Remove entries older than 2 minutes
      if (currentMinute - entryMinute > 2) {
        this.rateLimiter.delete(key);
      }
    }
  }

  /**
   * Clean up old failed attempt entries
   */
  cleanupFailedAttempts() {
    const now = Date.now();

    for (const [identifier, attempts] of this.failedAttempts.entries()) {
      // Remove entries older than lockout duration if not locked
      if (!attempts.lockedUntil && now - attempts.lastAttempt > this.config.lockoutDuration) {
        this.failedAttempts.delete(identifier);
      }
      // Remove expired locks
      else if (attempts.lockedUntil && now > attempts.lockedUntil) {
        this.failedAttempts.delete(identifier);
      }
    }
  }

  /**
   * Get security metrics
   * @returns {Object} - Security metrics
   */
  getSecurityMetrics() {
    return {
      rateLimitEntries: this.rateLimiter.size,
      failedAttempts: this.failedAttempts.size,
      blockedIPs: this.blockedIPs.size,
      lockedAccounts: Array.from(this.failedAttempts.values()).filter(a => a.lockedUntil && Date.now() < a.lockedUntil).length
    };
  }
}

// Export singleton instance
export const securityService = new SecurityService();
export default securityService;