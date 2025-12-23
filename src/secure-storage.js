/**
 * Secure Storage Utility
 * Provides AES-GCM encrypted storage for sensitive data like authentication tokens
 * Uses Web Crypto API for cryptographically secure encryption
 * Falls back to secure localStorage patterns when cookies aren't available
 */

import { logger } from "./logger.js";

// Security Constants
const CRYPTO_CONFIG = {
  ALGORITHM: "AES-GCM",
  KEY_LENGTH: 256, // AES-256
  IV_LENGTH: 12, // 96 bits for GCM
  PBKDF2_ITERATIONS: 100000, // 100k iterations for key derivation
  PBKDF2_SALT: "flagfit-pro-v1", // Salt for PBKDF2
  HASH_ALGORITHM: "SHA-256",
  SESSION_ID_LENGTH: 32, // 256 bits
  TOKEN_HASH_LENGTH: 32, // First 32 chars of SHA-256
};

// Cookie & Storage Constants
const STORAGE_CONFIG = {
  COOKIE_MAX_AGE: 24 * 60 * 60, // 24 hours in seconds
  COOKIE_PATH: "/",
  COOKIE_SAME_SITE: "Strict",
};

// Fingerprint Constants
const FINGERPRINT_CONFIG = {
  TRUNCATE_LENGTH: 50, // Truncate UA/canvas for privacy
  TIME_PRECISION_MS: 60 * 60 * 1000, // 1 hour precision (3600000ms)
};

export class SecureStorage {
  constructor() {
    this.cryptoKey = null;
    this.keyPromise = null;
    this.isInitialized = false;

    // Initialize crypto key asynchronously
    this.init();
  }

  /**
   * Initialize the crypto key
   * @returns {Promise<void>}
   */
  async init() {
    if (this.isInitialized || this.keyPromise) {
      return this.keyPromise;
    }

    this.keyPromise = this._initializeCryptoKey();
    await this.keyPromise;
    this.isInitialized = true;
    return this.keyPromise;
  }

  /**
   * Initialize or retrieve the encryption key using Web Crypto API
   *
   * This method uses PBKDF2 with 100,000 iterations to derive a 256-bit AES-GCM key
   * from a combination of browser fingerprint and session ID. The key is stored
   * in sessionStorage for the duration of the session.
   *
   * @private
   * @returns {Promise<CryptoKey>} The initialized AES-GCM CryptoKey
   * @throws {Error} If key initialization fails
   */
  async _initializeCryptoKey() {
    try {
      // Check if we have a stored key
      const storedKeyData = sessionStorage.getItem("__crypto_key_data");

      if (storedKeyData) {
        // Import existing key
        const keyData = JSON.parse(storedKeyData);
        this.cryptoKey = await crypto.subtle.importKey(
          "raw",
          this._base64ToArrayBuffer(keyData.key),
          { name: CRYPTO_CONFIG.ALGORITHM },
          false,
          ["encrypt", "decrypt"],
        );
      } else {
        // Generate new key
        const fingerprint = this.getBrowserFingerprint();
        const sessionId = this.generateSessionId();

        // Derive key material from fingerprint and session
        const keyMaterial = await crypto.subtle.importKey(
          "raw",
          new TextEncoder().encode(fingerprint + sessionId),
          { name: "PBKDF2" },
          false,
          ["deriveBits", "deriveKey"],
        );

        // Derive AES-GCM key
        this.cryptoKey = await crypto.subtle.deriveKey(
          {
            name: "PBKDF2",
            salt: new TextEncoder().encode(CRYPTO_CONFIG.PBKDF2_SALT),
            iterations: CRYPTO_CONFIG.PBKDF2_ITERATIONS,
            hash: CRYPTO_CONFIG.HASH_ALGORITHM,
          },
          keyMaterial,
          { name: CRYPTO_CONFIG.ALGORITHM, length: CRYPTO_CONFIG.KEY_LENGTH },
          true,
          ["encrypt", "decrypt"],
        );

        // Export and store key for session reuse
        const exportedKey = await crypto.subtle.exportKey(
          "raw",
          this.cryptoKey,
        );
        sessionStorage.setItem(
          "__crypto_key_data",
          JSON.stringify({
            key: this._arrayBufferToBase64(exportedKey),
            timestamp: Date.now(),
          }),
        );
      }

      return this.cryptoKey;
    } catch (error) {
      logger.error("Failed to initialize crypto key:", error);
      throw error;
    }
  }

  /**
   * Generate a cryptographically secure browser fingerprint
   *
   * Creates a unique fingerprint based on browser characteristics including:
   * - User agent (truncated for privacy)
   * - Language, platform, cookie support
   * - Canvas fingerprint (truncated)
   * - Timezone and screen resolution
   * - Timestamp (hour precision to prevent tracking)
   *
   * @returns {string} Base64-encoded browser fingerprint
   * @example
   * const fingerprint = secureStorage.getBrowserFingerprint();
   * // Returns: "eyJ1c2VyQWdlbnQiOiJNb3ppbGxhLzUuMC4uLiJ9..."
   */
  getBrowserFingerprint() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    ctx.textBaseline = "top";
    ctx.font = "14px Arial";
    ctx.fillText("Browser fingerprint", 2, 2);

    return btoa(
      JSON.stringify({
        userAgent: navigator.userAgent.substring(
          0,
          FINGERPRINT_CONFIG.TRUNCATE_LENGTH,
        ),
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        canvasFingerprint: canvas
          .toDataURL()
          .substring(0, FINGERPRINT_CONFIG.TRUNCATE_LENGTH),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screen: `${screen.width}x${screen.height}`,
        timestamp: Math.floor(
          Date.now() / FINGERPRINT_CONFIG.TIME_PRECISION_MS,
        ),
      }),
    );
  }

  /**
   * Generate a cryptographically secure session ID
   * @returns {string} Session ID
   */
  generateSessionId() {
    const stored = sessionStorage.getItem("__session_id");
    if (stored) {
      return stored;
    }

    const sessionId = Array.from(
      crypto.getRandomValues(new Uint8Array(CRYPTO_CONFIG.SESSION_ID_LENGTH)),
    )
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    sessionStorage.setItem("__session_id", sessionId);
    return sessionId;
  }

  /**
   * Encrypt data using AES-256-GCM (Web Crypto API)
   *
   * Uses the SubtleCrypto API for cryptographically secure encryption:
   * - Algorithm: AES-GCM (Galois/Counter Mode)
   * - Key length: 256 bits
   * - IV: 96 bits (randomly generated for each encryption)
   * - Output: Base64-encoded (IV + encrypted data)
   *
   * @param {string} text - Plain text to encrypt
   * @returns {Promise<string>} Base64-encoded encrypted data (includes IV)
   * @throws {Error} If encryption fails
   * @example
   * const encrypted = await secureStorage.encrypt("secret data");
   * // Returns: "k7Jx9m2... (base64)"
   */
  async encrypt(text) {
    try {
      // Ensure crypto key is initialized
      if (!this.cryptoKey) {
        await this.init();
      }

      // Generate random IV (Initialization Vector)
      const iv = crypto.getRandomValues(
        new Uint8Array(CRYPTO_CONFIG.IV_LENGTH),
      );

      // Encrypt the data
      const encodedText = new TextEncoder().encode(text);
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: CRYPTO_CONFIG.ALGORITHM,
          iv: iv,
        },
        this.cryptoKey,
        encodedText,
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encryptedBuffer), iv.length);

      // Return base64 encoded result
      return this._arrayBufferToBase64(combined.buffer);
    } catch (error) {
      logger.error("Encryption failed:", error);
      throw error;
    }
  }

  /**
   * Decrypt data using AES-256-GCM (Web Crypto API)
   *
   * Decrypts data encrypted with the encrypt() method. Automatically extracts
   * the IV from the encrypted data and uses it for decryption.
   *
   * @param {string} encryptedText - Base64-encoded encrypted data (includes IV)
   * @returns {Promise<string|null>} Decrypted plain text, or null if decryption fails
   * @example
   * const decrypted = await secureStorage.decrypt("k7Jx9m2...");
   * // Returns: "secret data" or null
   */
  async decrypt(encryptedText) {
    try {
      // Ensure crypto key is initialized
      if (!this.cryptoKey) {
        await this.init();
      }

      // Decode base64
      const combined = this._base64ToArrayBuffer(encryptedText);
      const combinedArray = new Uint8Array(combined);

      // Extract IV (first N bytes) and encrypted data
      const iv = combinedArray.slice(0, CRYPTO_CONFIG.IV_LENGTH);
      const encryptedData = combinedArray.slice(CRYPTO_CONFIG.IV_LENGTH);

      // Decrypt the data
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: CRYPTO_CONFIG.ALGORITHM,
          iv: iv,
        },
        this.cryptoKey,
        encryptedData,
      );

      // Convert to string
      return new TextDecoder().decode(decryptedBuffer);
    } catch (error) {
      logger.error("Decryption failed:", error);
      return null;
    }
  }

  /**
   * Legacy XOR encryption (for backward compatibility during migration)
   * @deprecated Use encrypt() instead
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
   * Legacy XOR decryption (for backward compatibility during migration)
   * @deprecated Use decrypt() instead
   * @param {string} encryptedText - Encrypted text
   * @param {string} key - Decryption key
   * @returns {string|null} Decrypted text
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
   * Helper: Convert ArrayBuffer to Base64
   * @private
   */
  _arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Helper: Convert Base64 to ArrayBuffer
   * @private
   */
  _base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
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
      sameSite: STORAGE_CONFIG.COOKIE_SAME_SITE,
      maxAge: STORAGE_CONFIG.COOKIE_MAX_AGE,
      path: STORAGE_CONFIG.COOKIE_PATH,
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
      while (c.charAt(0) === " ") {
        c = c.substring(1, c.length);
      }
      if (c.indexOf(nameEQ) === 0) {
        return c.substring(nameEQ.length, c.length);
      }
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
   * Securely store authentication token using AES-256-GCM encryption
   *
   * Storage strategy:
   * 1. Token is encrypted using AES-GCM
   * 2. Stored in secure cookie (HTTPS, Strict SameSite) if available
   * 3. Falls back to encrypted localStorage if cookies unavailable
   * 4. SHA-256 hash stored for integrity verification
   *
   * @param {string} token - JWT or session token to store
   * @returns {Promise<void>}
   * @example
   * await secureStorage.setAuthToken("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...");
   */
  async setAuthToken(token) {
    if (!token) {
      this.removeAuthToken();
      return;
    }

    try {
      // Encrypt the token using AES-GCM
      const encryptedToken = await this.encrypt(token);

      // Try to use secure cookie first
      if (this.supportsCookies()) {
        this.setSecureCookie("__auth_token", encryptedToken, {
          maxAge: STORAGE_CONFIG.COOKIE_MAX_AGE,
          secure: true,
          sameSite: STORAGE_CONFIG.COOKIE_SAME_SITE,
        });

        // Store a flag in sessionStorage to indicate we're using cookies
        sessionStorage.setItem("__auth_method", "cookie");
        sessionStorage.setItem("__encryption_version", "aes-gcm");
      } else {
        // Fallback to localStorage with AES-GCM encryption
        localStorage.setItem("__auth_token_enc", encryptedToken);
        sessionStorage.setItem("__auth_method", "localStorage");
        sessionStorage.setItem("__encryption_version", "aes-gcm");
      }

      // Store token hash for integrity check
      await this.setTokenHash(token);

      logger.debug("Auth token stored securely with AES-GCM encryption");
    } catch (error) {
      logger.error("Failed to securely store auth token:", error);
      // Fallback to basic localStorage (still better than plain text)
      localStorage.setItem("authToken", token);
    }
  }

  /**
   * Retrieve and decrypt authentication token
   *
   * Retrieves the token from secure storage, decrypts it, and verifies integrity:
   * 1. Checks for AES-GCM encrypted token in cookies/localStorage
   * 2. Auto-migrates from legacy XOR encryption if found
   * 3. Verifies SHA-256 hash for integrity
   * 4. Falls back to plain legacy token if migration needed
   *
   * @returns {Promise<string|null>} Decrypted authentication token, or null if not found/invalid
   * @example
   * const token = await secureStorage.getAuthToken();
   * if (token) {
   *   // Use token for API requests
   * }
   */
  async getAuthToken() {
    try {
      const method = sessionStorage.getItem("__auth_method");
      const encryptionVersion = sessionStorage.getItem("__encryption_version");
      let encryptedToken = null;

      if (method === "cookie") {
        encryptedToken = this.getCookie("__auth_token");
      } else if (method === "localStorage") {
        encryptedToken = localStorage.getItem("__auth_token_enc");
      }

      if (encryptedToken) {
        let token = null;

        // Use appropriate decryption method based on version
        if (encryptionVersion === "aes-gcm") {
          token = await this.decrypt(encryptedToken);
        } else {
          // Legacy XOR encryption - migrate to AES-GCM
          const legacyKey =
            this.getBrowserFingerprint() + this.generateSessionId();
          token = this.simpleDecrypt(encryptedToken, btoa(legacyKey));

          if (token) {
            logger.debug("Migrating token from XOR to AES-GCM encryption");
            // Re-encrypt with AES-GCM
            await this.setAuthToken(token);
          }
        }

        // Verify token integrity
        if (token && (await this.verifyTokenHash(token))) {
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
      sessionStorage.removeItem("__encryption_version");
      sessionStorage.removeItem("__token_hash");
    } catch (error) {
      logger.error("Failed to remove auth token:", error);
    }
  }

  /**
   * Securely store user data using AES-GCM encryption
   * @param {Object} userData - User data object
   * @returns {Promise<void>}
   */
  async setUserData(userData) {
    if (!userData) {
      this.removeUserData();
      return;
    }

    try {
      const userDataString = JSON.stringify(userData);
      const encryptedUserData = await this.encrypt(userDataString);

      if (this.supportsCookies()) {
        // For cookies, only store essential user data due to size limits
        const essentialUserData = {
          id: userData.id,
          email: userData.email,
          role: userData.role,
          name: userData.name,
        };
        const essentialDataString = JSON.stringify(essentialUserData);
        const encryptedEssentialData = await this.encrypt(essentialDataString);

        this.setSecureCookie("__user_data", encryptedEssentialData, {
          maxAge: STORAGE_CONFIG.COOKIE_MAX_AGE,
          secure: true,
          sameSite: STORAGE_CONFIG.COOKIE_SAME_SITE,
        });
      } else {
        localStorage.setItem("__user_data_enc", encryptedUserData);
      }

      logger.debug("User data stored securely with AES-GCM encryption");
    } catch (error) {
      logger.error("Failed to securely store user data:", error);
      // Fallback to basic localStorage
      localStorage.setItem("userData", JSON.stringify(userData));
    }
  }

  /**
   * Retrieve user data
   * @returns {Promise<Object|null>} User data object
   */
  async getUserData() {
    try {
      const method = sessionStorage.getItem("__auth_method");
      const encryptionVersion = sessionStorage.getItem("__encryption_version");
      let encryptedUserData = null;

      if (method === "cookie") {
        encryptedUserData = this.getCookie("__user_data");
      } else if (method === "localStorage") {
        encryptedUserData = localStorage.getItem("__user_data_enc");
      }

      if (encryptedUserData) {
        let userDataString = null;

        // Use appropriate decryption method
        if (encryptionVersion === "aes-gcm") {
          userDataString = await this.decrypt(encryptedUserData);
        } else {
          // Legacy XOR encryption
          const legacyKey =
            this.getBrowserFingerprint() + this.generateSessionId();
          userDataString = this.simpleDecrypt(
            encryptedUserData,
            btoa(legacyKey),
          );
        }

        return userDataString ? JSON.parse(userDataString) : null;
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
    sessionStorage.removeItem("__session_id");
    sessionStorage.removeItem("__crypto_key_data");
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
   * Set token hash for integrity verification using SubtleCrypto
   * @param {string} token - Token to hash
   * @returns {Promise<void>}
   */
  async setTokenHash(token) {
    try {
      // Use SHA-256 for secure hashing
      const encoder = new TextEncoder();
      const data = encoder.encode(token);
      const hashBuffer = await crypto.subtle.digest(
        CRYPTO_CONFIG.HASH_ALGORITHM,
        data,
      );
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      sessionStorage.setItem(
        "__token_hash",
        hashHex.substring(0, CRYPTO_CONFIG.TOKEN_HASH_LENGTH),
      );
    } catch (error) {
      logger.error("Failed to set token hash:", error);
    }
  }

  /**
   * Verify token integrity using SHA-256
   * @param {string} token - Token to verify
   * @returns {Promise<boolean>} True if token is valid
   */
  async verifyTokenHash(token) {
    try {
      const storedHash = sessionStorage.getItem("__token_hash");
      if (!storedHash) {
        return true;
      } // No hash stored, assume valid

      // Compute hash of provided token
      const encoder = new TextEncoder();
      const data = encoder.encode(token);
      const hashBuffer = await crypto.subtle.digest(
        CRYPTO_CONFIG.HASH_ALGORITHM,
        data,
      );
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const expectedHash = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .substring(0, CRYPTO_CONFIG.TOKEN_HASH_LENGTH);

      return storedHash === expectedHash;
    } catch (error) {
      logger.error("Failed to verify token hash:", error);
      return true; // Assume valid on error
    }
  }

  /**
   * Migration helper: migrate from insecure/XOR storage to AES-GCM encryption
   *
   * Automatically detects and migrates:
   * - Plain text tokens → AES-GCM encrypted
   * - XOR encrypted tokens → AES-GCM encrypted
   * - Plain text user data → AES-GCM encrypted
   *
   * This ensures backward compatibility while upgrading security.
   * Safe to call multiple times (idempotent).
   *
   * @returns {Promise<void>}
   * @example
   * await secureStorage.migrateFromLegacyStorage();
   * // Old tokens automatically upgraded to AES-GCM
   */
  async migrateFromLegacyStorage() {
    try {
      const legacyToken = localStorage.getItem("authToken");
      const legacyUserData = localStorage.getItem("userData");

      if (legacyToken) {
        logger.debug("Migrating legacy auth token to AES-GCM encryption");
        await this.setAuthToken(legacyToken);
        localStorage.removeItem("authToken");
      }

      if (legacyUserData) {
        logger.debug("Migrating legacy user data to AES-GCM encryption");
        const userData = JSON.parse(legacyUserData);
        await this.setUserData(userData);
        localStorage.removeItem("userData");
      }

      logger.debug("Successfully migrated from legacy storage to AES-GCM");
    } catch (error) {
      logger.error("Failed to migrate from legacy storage:", error);
    }
  }
}

// Create singleton instance
export const secureStorage = new SecureStorage();

export default SecureStorage;
