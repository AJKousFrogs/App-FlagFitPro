// Security Utilities - FlagFit Pro
// Shared functions for CSRF tokens, rate limiting, and security features

/**
 * Generate a CSRF token
 * @returns {string} Generated CSRF token
 */
export function generateCSRFToken() {
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  
  // Store in sessionStorage
  sessionStorage.setItem("csrfToken", token);
  
  return token;
}

/**
 * Get the current CSRF token from sessionStorage
 * @returns {string|null} CSRF token or null if not found
 */
export function getCSRFToken() {
  return sessionStorage.getItem("csrfToken");
}

/**
 * Validate a CSRF token
 * @param {string} token - Token to validate
 * @returns {boolean} True if token is valid
 */
export function validateCSRFToken(token) {
  const storedToken = getCSRFToken();
  return storedToken !== null && storedToken === token;
}

/**
 * Set CSRF token in a form field
 * @param {string} fieldId - ID of the CSRF token input field
 */
export function setCSRFTokenInForm(fieldId) {
  const field = document.getElementById(fieldId);
  if (field) {
    const token = generateCSRFToken();
    field.value = token;
  }
}

// ================================================================
// RATE LIMITING UTILITIES
// ================================================================

const RATE_LIMIT_KEY_PREFIX = "rateLimit_";
const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Initialize rate limiting for a specific action
 * @param {string} actionName - Name of the action (e.g., "login", "register")
 * @param {Object} options - Rate limiting options
 * @param {number} options.maxAttempts - Maximum attempts allowed (default: 3)
 * @param {number} options.windowMs - Time window in milliseconds (default: 15 minutes)
 * @returns {Object} Rate limit state and functions
 */
export function initializeRateLimiting(actionName, options = {}) {
  const {
    maxAttempts = DEFAULT_MAX_ATTEMPTS,
    windowMs = DEFAULT_WINDOW_MS
  } = options;

  const attemptsKey = `${RATE_LIMIT_KEY_PREFIX}${actionName}_attempts`;
  const lastAttemptKey = `${RATE_LIMIT_KEY_PREFIX}${actionName}_lastAttempt`;

  /**
   * Get current rate limit state
   */
  function getRateLimitState() {
    const attempts = parseInt(localStorage.getItem(attemptsKey) || "0", 10);
    const lastAttempt = parseInt(localStorage.getItem(lastAttemptKey) || "0", 10);
    const timeSinceLastAttempt = Date.now() - lastAttempt;
    
    // Reset if window has passed
    if (timeSinceLastAttempt > windowMs) {
      return {
        attempts: 0,
        lastAttempt: 0,
        isLimited: false,
        timeRemaining: 0
      };
    }

    return {
      attempts,
      lastAttempt,
      isLimited: attempts >= maxAttempts,
      timeRemaining: Math.max(0, windowMs - timeSinceLastAttempt)
    };
  }

  /**
   * Record an attempt
   * @param {boolean} success - Whether the attempt was successful
   */
  function recordAttempt(success = false) {
    if (success) {
      // Reset on successful attempt
      localStorage.removeItem(attemptsKey);
      localStorage.removeItem(lastAttemptKey);
    } else {
      // Increment failed attempts
      const state = getRateLimitState();
      const newAttempts = state.attempts + 1;
      localStorage.setItem(attemptsKey, newAttempts.toString());
      localStorage.setItem(lastAttemptKey, Date.now().toString());
    }
  }

  /**
   * Check if action is rate limited
   * @returns {boolean} True if rate limited
   */
  function isRateLimited() {
    return getRateLimitState().isLimited;
  }

  /**
   * Get time remaining until rate limit resets (in minutes)
   * @returns {number} Minutes remaining
   */
  function getTimeRemaining() {
    const state = getRateLimitState();
    return Math.ceil(state.timeRemaining / 1000 / 60);
  }

  /**
   * Reset rate limiting for this action
   */
  function reset() {
    localStorage.removeItem(attemptsKey);
    localStorage.removeItem(lastAttemptKey);
  }

  return {
    getState: getRateLimitState,
    recordAttempt,
    isRateLimited,
    getTimeRemaining,
    reset
  };
}

/**
 * Create a rate limiter for login attempts
 * @returns {Object} Login rate limiter
 */
export function createLoginRateLimiter() {
  return initializeRateLimiting("login", {
    maxAttempts: 3,
    windowMs: 15 * 60 * 1000 // 15 minutes
  });
}

// Make functions globally available for backward compatibility
if (typeof window !== 'undefined') {
  window.generateCSRFToken = generateCSRFToken;
  window.getCSRFToken = getCSRFToken;
  window.validateCSRFToken = validateCSRFToken;
  window.setCSRFTokenInForm = setCSRFTokenInForm;
  window.createLoginRateLimiter = createLoginRateLimiter;
}


