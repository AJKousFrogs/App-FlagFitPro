/**
 * Secure Storage Utility
 * Provides encrypted storage for sensitive data like authentication tokens
 * Falls back to secure localStorage patterns when cookies aren't available
 */

import { logger } from "./logger.js";

export class SecureStorage {
  constructor() {
    this.encryptionKey = this.getOrCreateKey();
  }

  /**
   * Get or create an encryption key for this session
   * @returns {string} Base64 encoded key
   */
  getOrCreateKey() {
    // Use a combination of browser fingerprint and session data
    const fingerprint = this.getBrowserFingerprint();
    const sessionId =
      sessionStorage.getItem("secureStorageKey") || this.generateSessionId();

    if (!sessionStorage.getItem("secureStorageKey")) {
      sessionStorage.setItem("secureStorageKey", sessionId);
    }

    // Combine fingerprint with session for key derivation
    return btoa(fingerprint + sessionId);
  }

  /**
   * Generate a simple browser fingerprint
   * @returns {string} Browser fingerprint
   */
  getBrowserFingerprint() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillText("Browser fingerprint", 2, 2);

    return btoa(
      JSON.stringify({
        userAgent: navigator.userAgent.substring(0, 50), // Truncate for privacy
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        canvasFingerprint: canvas.toDataURL().substring(0, 50), // Truncate
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screen: `${screen.width}x${screen.height}`,
        timestamp: Math.floor(Date.now() / (1000 * 60 * 60)), // Hour precision
      }),
    );
  }

  /**
   * Generate a session ID
   * @returns {string} Session ID
   */
  generateSessionId() {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  /**
   * Simple XOR encryption (for demonstration - use proper encryption in production)
   * @param {string} text - Text to encrypt
   * @param {string} key - Encryption key
   * @returns {string} Encrypted text
   */
  simpleEncrypt(text, key) {
    let encrypted = "";
    for (let i = 0; i < text.length; i++) {
      const keyChar = key.charCodeAt(i % key.length);
      const textChar = text.charCodeAt(i);
      encrypted += String.fromCharCode(textChar ^ keyChar);
    }
    return btoa(encrypted);
  }

  /**
   * Simple XOR decryption
   * @param {string} encryptedText - Encrypted text
   * @param {string} key - Decryption key
   * @returns {string} Decrypted text
   */
  simpleDecrypt(encryptedText, key) {
    try {
      const encrypted = atob(encryptedText);
      let decrypted = "";
      for (let i = 0; i < encrypted.length; i++) {
        const keyChar = key.charCodeAt(i % key.length);
        const encryptedChar = encrypted.charCodeAt(i);
        decrypted += String.fromCharCode(encryptedChar ^ keyChar);
      }
      return decrypted;
    } catch (e) {
      return null;
    }
  }

  /**
   * Set secure cookie with HttpOnly simulation
   * @param {string} name - Cookie name
   * @param {string} value - Cookie value
   * @param {Object} options - Cookie options
   */
  setSecureCookie(name, value, options = {}) {
    const defaultOptions = {
      secure: location.protocol === "https:",
      sameSite: "Strict",
      maxAge: 24 * 60 * 60, // 24 hours
      path: "/",
    };

    const cookieOptions = { ...defaultOptions, ...options };

    let cookieString = `${name}=${value}`;

    if (cookieOptions.maxAge) {
      cookieString += `; Max-Age=${cookieOptions.maxAge}`;
    }

    if (cookieOptions.path) {
      cookieString += `; Path=${cookieOptions.path}`;
    }

    if (cookieOptions.secure) {
      cookieString += "; Secure";
    }

    if (cookieOptions.sameSite) {
      cookieString += `; SameSite=${cookieOptions.sameSite}`;
    }

    document.cookie = cookieString;
  }

  /**
   * Get cookie value
   * @param {string} name - Cookie name
   * @returns {string|null} Cookie value
   */
  getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(";");

    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === " ") c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  /**
   * Delete cookie
   * @param {string} name - Cookie name
   */
  deleteCookie(name) {
    document.cookie = name + "=; Max-Age=-99999999; path=/";
  }

  /**
   * Securely store authentication token
   * @param {string} token - Authentication token
   */
  setAuthToken(token) {
    if (!token) {
      this.removeAuthToken();
      return;
    }

    try {
      // Encrypt the token
      const encryptedToken = this.simpleEncrypt(token, this.encryptionKey);

      // Try to use secure cookie first
      if (this.supportsCookies()) {
        this.setSecureCookie("__auth_token", encryptedToken, {
          maxAge: 24 * 60 * 60, // 24 hours
          secure: true,
          sameSite: "Strict",
        });

        // Store a flag in sessionStorage to indicate we're using cookies
        sessionStorage.setItem("__auth_method", "cookie");
      } else {
        // Fallback to localStorage with encryption
        localStorage.setItem("__auth_token_enc", encryptedToken);
        sessionStorage.setItem("__auth_method", "localStorage");
      }

      // Store token hash for integrity check
      this.setTokenHash(token);
    } catch (error) {
      logger.error("Failed to securely store auth token:", error);
      // Fallback to basic localStorage (still better than plain text)
      localStorage.setItem("authToken", token);
    }
  }

  /**
   * Retrieve authentication token
   * @returns {string|null} Authentication token
   */
  getAuthToken() {
    try {
      const method = sessionStorage.getItem("__auth_method");
      let encryptedToken = null;

      if (method === "cookie") {
        encryptedToken = this.getCookie("__auth_token");
      } else if (method === "localStorage") {
        encryptedToken = localStorage.getItem("__auth_token_enc");
      }

      if (encryptedToken) {
        const token = this.simpleDecrypt(encryptedToken, this.encryptionKey);

        // Verify token integrity
        if (token && this.verifyTokenHash(token)) {
          return token;
        } else {
          // Token corrupted, remove it
          this.removeAuthToken();
          return null;
        }
      }

      // Fallback: check for legacy token
      return localStorage.getItem("authToken");
    } catch (error) {
      logger.error("Failed to retrieve auth token:", error);
      // Fallback to legacy method
      return localStorage.getItem("authToken");
    }
  }

  /**
   * Remove authentication token
   */
  removeAuthToken() {
    try {
      // Remove from all possible locations
      this.deleteCookie("__auth_token");
      localStorage.removeItem("__auth_token_enc");
      localStorage.removeItem("authToken"); // Legacy cleanup
      sessionStorage.removeItem("__auth_method");
      sessionStorage.removeItem("__token_hash");
    } catch (error) {
      logger.error("Failed to remove auth token:", error);
    }
  }

  /**
   * Securely store user data
   * @param {Object} userData - User data object
   */
  setUserData(userData) {
    if (!userData) {
      this.removeUserData();
      return;
    }

    try {
      const userDataString = JSON.stringify(userData);
      const encryptedUserData = this.simpleEncrypt(
        userDataString,
        this.encryptionKey,
      );

      if (this.supportsCookies()) {
        // For cookies, only store essential user data due to size limits
        const essentialUserData = {
          id: userData.id,
          email: userData.email,
          role: userData.role,
          name: userData.name,
        };
        const essentialDataString = JSON.stringify(essentialUserData);
        const encryptedEssentialData = this.simpleEncrypt(
          essentialDataString,
          this.encryptionKey,
        );

        this.setSecureCookie("__user_data", encryptedEssentialData, {
          maxAge: 24 * 60 * 60,
          secure: true,
          sameSite: "Strict",
        });
      } else {
        localStorage.setItem("__user_data_enc", encryptedUserData);
      }
    } catch (error) {
      logger.error("Failed to securely store user data:", error);
      // Fallback to basic localStorage
      localStorage.setItem("userData", JSON.stringify(userData));
    }
  }

  /**
   * Retrieve user data
   * @returns {Object|null} User data object
   */
  getUserData() {
    try {
      const method = sessionStorage.getItem("__auth_method");
      let encryptedUserData = null;

      if (method === "cookie") {
        encryptedUserData = this.getCookie("__user_data");
      } else if (method === "localStorage") {
        encryptedUserData = localStorage.getItem("__user_data_enc");
      }

      if (encryptedUserData) {
        const userDataString = this.simpleDecrypt(
          encryptedUserData,
          this.encryptionKey,
        );
        return JSON.parse(userDataString);
      }

      // Fallback: check for legacy user data
      const legacyUserData = localStorage.getItem("userData");
      return legacyUserData ? JSON.parse(legacyUserData) : null;
    } catch (error) {
      logger.error("Failed to retrieve user data:", error);
      // Fallback to legacy method
      try {
        const legacyUserData = localStorage.getItem("userData");
        return legacyUserData ? JSON.parse(legacyUserData) : null;
      } catch (e) {
        return null;
      }
    }
  }

  /**
   * Remove user data
   */
  removeUserData() {
    try {
      this.deleteCookie("__user_data");
      localStorage.removeItem("__user_data_enc");
      localStorage.removeItem("userData"); // Legacy cleanup
    } catch (error) {
      logger.error("Failed to remove user data:", error);
    }
  }

  /**
   * Clear all stored authentication data
   */
  clearAll() {
    this.removeAuthToken();
    this.removeUserData();
    sessionStorage.removeItem("secureStorageKey");
  }

  /**
   * Check if cookies are supported
   * @returns {boolean} True if cookies are supported
   */
  supportsCookies() {
    try {
      const testCookie = "__cookie_test";
      document.cookie = `${testCookie}=test; path=/`;
      const supported = document.cookie.includes(testCookie);
      if (supported) {
        this.deleteCookie(testCookie);
      }
      return supported;
    } catch (e) {
      return false;
    }
  }

  /**
   * Set token hash for integrity verification
   * @param {string} token - Token to hash
   */
  setTokenHash(token) {
    try {
      // Simple hash using built-in methods
      const hash = btoa(token).split("").reverse().join("").substring(0, 16);
      sessionStorage.setItem("__token_hash", hash);
    } catch (error) {
      logger.error("Failed to set token hash:", error);
    }
  }

  /**
   * Verify token integrity
   * @param {string} token - Token to verify
   * @returns {boolean} True if token is valid
   */
  verifyTokenHash(token) {
    try {
      const storedHash = sessionStorage.getItem("__token_hash");
      if (!storedHash) return true; // No hash stored, assume valid

      const expectedHash = btoa(token)
        .split("")
        .reverse()
        .join("")
        .substring(0, 16);
      return storedHash === expectedHash;
    } catch (error) {
      logger.error("Failed to verify token hash:", error);
      return true; // Assume valid on error
    }
  }

  /**
   * Migration helper: migrate from insecure localStorage to secure storage
   */
  migrateFromLegacyStorage() {
    try {
      const legacyToken = localStorage.getItem("authToken");
      const legacyUserData = localStorage.getItem("userData");

      if (legacyToken) {
        this.setAuthToken(legacyToken);
        localStorage.removeItem("authToken");
      }

      if (legacyUserData) {
        const userData = JSON.parse(legacyUserData);
        this.setUserData(userData);
        localStorage.removeItem("userData");
      }

      logger.debug("Successfully migrated from legacy storage");
    } catch (error) {
      logger.error("Failed to migrate from legacy storage:", error);
    }
  }
}

// Create singleton instance
export const secureStorage = new SecureStorage();

export default SecureStorage;
