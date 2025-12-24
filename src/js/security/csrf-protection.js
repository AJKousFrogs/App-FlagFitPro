/**
 * CSRF (Cross-Site Request Forgery) Protection Service
 * Generates and manages CSRF tokens for secure API requests
 */

import { logger } from "../../logger.js";

class CSRFProtection {
  constructor() {
    this.token = null;
    this.tokenKey = "__csrf_token";
    this.headerName = "X-CSRF-Token";

    // Generate token on initialization
    this.generateToken();

    logger.debug("[CSRF] Protection initialized");
  }

  /**
   * Generate a cryptographically secure CSRF token
   * @returns {string} CSRF token
   */
  generateToken() {
    // Use Web Crypto API for secure random token generation
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);

    // Convert to hex string
    this.token = Array.from(array)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Store in sessionStorage (not localStorage to limit scope to session)
    try {
      sessionStorage.setItem(this.tokenKey, this.token);
    } catch (error) {
      logger.warn("[CSRF] Could not store token in sessionStorage:", error);
    }

    logger.debug("[CSRF] Token generated");
    return this.token;
  }

  /**
   * Get the current CSRF token
   * @returns {string|null} Current CSRF token
   */
  getToken() {
    // Try to get from memory first
    if (this.token) {
      return this.token;
    }

    // Fall back to sessionStorage
    try {
      this.token = sessionStorage.getItem(this.tokenKey);
    } catch (error) {
      logger.warn(
        "[CSRF] Could not retrieve token from sessionStorage:",
        error,
      );
    }

    // Generate new token if none exists
    if (!this.token) {
      this.generateToken();
    }

    return this.token;
  }

  /**
   * Rotate the CSRF token (generate a new one)
   * Should be called periodically or after sensitive operations
   */
  rotateToken() {
    logger.debug("[CSRF] Rotating token");
    this.generateToken();
  }

  /**
   * Clear the CSRF token (on logout)
   */
  clearToken() {
    logger.debug("[CSRF] Clearing token");
    this.token = null;
    try {
      sessionStorage.removeItem(this.tokenKey);
    } catch (error) {
      logger.warn("[CSRF] Could not remove token from sessionStorage:", error);
    }
  }

  /**
   * Get headers object with CSRF token
   * @returns {object} Headers object with CSRF token
   */
  getHeaders() {
    const token = this.getToken();
    if (!token) {
      logger.warn("[CSRF] No token available for request");
      return {};
    }

    return {
      [this.headerName]: token,
    };
  }

  /**
   * Add CSRF token to fetch options
   * @param {object} options - Fetch options object
   * @returns {object} Modified options with CSRF token
   */
  addTokenToRequest(options = {}) {
    const token = this.getToken();

    if (!token) {
      logger.warn("[CSRF] No token available for request");
      return options;
    }

    // Ensure headers object exists
    if (!options.headers) {
      options.headers = {};
    }

    // Add CSRF token header
    options.headers[this.headerName] = token;

    return options;
  }

  /**
   * Check if request method requires CSRF protection
   * @param {string} method - HTTP method
   * @returns {boolean} True if method requires CSRF protection
   */
  requiresProtection(method) {
    const protectedMethods = ["POST", "PUT", "DELETE", "PATCH"];
    return protectedMethods.includes(method.toUpperCase());
  }

  /**
   * Validate that a token matches the current token
   * (Used for double-submit cookie pattern)
   * @param {string} token - Token to validate
   * @returns {boolean} True if token is valid
   */
  validateToken(token) {
    const currentToken = this.getToken();

    if (!currentToken || !token) {
      return false;
    }

    // Constant-time comparison to prevent timing attacks
    if (token.length !== currentToken.length) {
      return false;
    }

    let mismatch = 0;
    for (let i = 0; i < token.length; i++) {
      mismatch |= token.charCodeAt(i) ^ currentToken.charCodeAt(i);
    }

    return mismatch === 0;
  }

  /**
   * Add CSRF token to form data
   * @param {FormData} formData - Form data object
   * @returns {FormData} Modified form data with CSRF token
   */
  addTokenToFormData(formData) {
    const token = this.getToken();

    if (!token) {
      logger.warn("[CSRF] No token available for form data");
      return formData;
    }

    formData.append("csrf_token", token);
    return formData;
  }

  /**
   * Get CSRF meta tag for HTML forms
   * @returns {string} HTML meta tag with CSRF token
   */
  getMetaTag() {
    const token = this.getToken();
    return `<meta name="csrf-token" content="${token}">`;
  }
}

// Create singleton instance
const csrfProtection = new CSRFProtection();

// Export for ES6 modules
export { csrfProtection, CSRFProtection };

// Make available globally for non-module scripts
if (typeof window !== "undefined") {
  window.csrfProtection = csrfProtection;
}

// Export default
export default csrfProtection;

logger.debug("[CSRF] Protection service loaded");
