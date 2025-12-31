/**
 * Token Validation Module
 * Handles authentication token validation with timeout and error handling
 * Extracted from auth-manager.js for better separation of concerns
 */

import { logger } from "../logger.js";
import { AUTH } from "../js/config/app-constants.js";

export class TokenValidator {
  /**
   * Validate stored token with backend
   * @param {string} token - Authentication token to validate
   * @param {Function} getCurrentUser - Function to call backend validation
   * @param {number} timeoutMs - Validation timeout in milliseconds
   * @returns {Promise<Object>} Validation result with success flag and user data
   */
  static async validateToken(
    token,
    getCurrentUser,
    timeoutMs = AUTH.TOKEN_VALIDATION_TIMEOUT
  ) {
    if (!token) {
      return { success: false, reason: "no_token" };
    }

    try {
      // Add timeout to prevent hanging on slow/unresponsive API calls
      const validationPromise = getCurrentUser();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Token validation timeout")),
          timeoutMs
        );
      });

      const response = await Promise.race([validationPromise, timeoutPromise]);

      if (response.success) {
        logger.debug("[TokenValidator] Token validation successful");
        return {
          success: true,
          user: response.user,
        };
      } else {
        logger.warn("[TokenValidator] Token validation failed on server");
        return {
          success: false,
          reason: "server_rejected",
        };
      }
    } catch (error) {
      return this.handleValidationError(error);
    }
  }

  /**
   * Handle token validation errors with appropriate fallback behavior
   * @param {Error} error - Validation error
   * @returns {Object} Validation result
   */
  static handleValidationError(error) {
    // Handle timeout errors
    if (error.message === "Token validation timeout") {
      logger.warn(
        "[TokenValidator] Token validation timed out - endpoint may be slow or unavailable"
      );
      // Assume token is valid to prevent redirect loops
      logger.debug("[TokenValidator] Timeout during validation, assuming token valid");
      return {
        success: true,
        assumedValid: true,
        reason: "timeout",
      };
    }

    // Check if this is an HTML response (endpoint doesn't exist)
    if (error.isHTMLResponse) {
      logger.warn(
        "[TokenValidator] Token validation endpoint returned HTML - endpoint may not be configured:",
        error.message
      );
      // Assume token is valid to prevent redirect loops, but log the issue
      logger.debug(
        "[TokenValidator] HTML response during validation, assuming token valid (endpoint may be misconfigured)"
      );
      return {
        success: true,
        assumedValid: true,
        reason: "html_response",
      };
    }

    // Check if this is a 401 error (unauthorized)
    if (error.status === 401) {
      logger.warn("[TokenValidator] Token validation failed: Unauthorized");
      return {
        success: false,
        reason: "unauthorized",
      };
    }

    // For other errors (network errors, etc.), assume token is still valid to prevent redirect loops
    logger.error("[TokenValidator] Token validation network error:", error);
    logger.debug("[TokenValidator] Network error during validation, assuming token valid");
    return {
      success: true,
      assumedValid: true,
      reason: "network_error",
    };
  }

  /**
   * Check if token appears to be expired based on timestamp
   * @param {string} token - JWT token to check
   * @returns {boolean} True if token appears expired
   */
  static isTokenExpired(token) {
    if (!token) return true;

    try {
      // Simple JWT expiration check (without full validation)
      const parts = token.split(".");
      if (parts.length !== 3) return true;

      const payload = JSON.parse(atob(parts[1]));
      if (!payload.exp) return false; // No expiration claim

      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const bufferTime = 60000; // 1 minute buffer

      return currentTime >= expirationTime - bufferTime;
    } catch (error) {
      logger.warn("[TokenValidator] Error checking token expiration:", error);
      return true; // Assume expired on error
    }
  }

  /**
   * Extract user ID from JWT token (without validation)
   * @param {string} token - JWT token
   * @returns {string|null} User ID or null
   */
  static extractUserId(token) {
    if (!token) return null;

    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));
      return payload.sub || payload.userId || payload.user_id || null;
    } catch (error) {
      logger.warn("[TokenValidator] Error extracting user ID from token:", error);
      return null;
    }
  }

  /**
   * Extract token payload (without validation)
   * @param {string} token - JWT token
   * @returns {Object|null} Token payload or null
   */
  static extractPayload(token) {
    if (!token) return null;

    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;

      return JSON.parse(atob(parts[1]));
    } catch (error) {
      logger.warn("[TokenValidator] Error extracting token payload:", error);
      return null;
    }
  }
}
