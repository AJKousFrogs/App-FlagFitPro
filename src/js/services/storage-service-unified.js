import { logger } from "../../logger.js";

/**
 * Unified Storage Service
 * Centralized localStorage access with error handling, encryption support, and fallbacks
 *
 * This service consolidates:
 * - src/js/services/storageService.js (domain-specific methods)
 * - src/js/utils/shared.js (generic save/get/remove)
 * - Works alongside src/secure-storage.js (for auth tokens)
 *
 * @example
 * import { storageService } from './services/storage-service-unified.js';
 *
 * // Generic usage
 * storageService.set('myKey', { data: 'value' });
 * const data = storageService.get('myKey', defaultValue);
 * storageService.remove('myKey');
 *
 * // Domain-specific usage
 * storageService.saveWorkoutSession(session);
 * const workouts = storageService.getRecentWorkouts();
 */

class UnifiedStorageService {
  constructor() {
    this.isAvailable = this.checkAvailability();
    this.prefix = "flagfit_"; // Namespace all keys
  }

  /**
   * Check if localStorage is available
   * @returns {boolean}
   */
  checkAvailability() {
    try {
      const test = "__storage_test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      logger.warn("localStorage not available:", e);
      return false;
    }
  }

  /**
   * Prefix a key with namespace
   * @param {string} key
   * @returns {string}
   */
  getPrefixedKey(key) {
    return key.startsWith(this.prefix) ? key : this.prefix + key;
  }

  // ================================================================
  // GENERIC METHODS (Replaces shared.js utilities)
  // ================================================================

  /**
   * Save data to localStorage
   * @param {string} key - Storage key
   * @param {*} data - Data to save (will be JSON stringified)
   * @param {Object} options - Optional settings
   * @param {boolean} options.usePrefix - Whether to add namespace prefix (default: true)
   * @returns {boolean} Success status
   */
  set(key, data, options = {}) {
    const { usePrefix = true } = options;

    if (!this.isAvailable) {
      logger.warn("Cannot save to storage: localStorage unavailable");
      return false;
    }

    try {
      const storageKey = usePrefix ? this.getPrefixedKey(key) : key;
      localStorage.setItem(storageKey, JSON.stringify(data));
      return true;
    } catch (error) {
      logger.error(`Error saving to localStorage [${key}]:`, error);
      return false;
    }
  }

  /**
   * Get data from localStorage
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if key doesn't exist
   * @param {Object} options - Optional settings
   * @param {boolean} options.usePrefix - Whether to add namespace prefix (default: true)
   * @returns {*} Retrieved data or default value
   */
  get(key, defaultValue = null, options = {}) {
    const { usePrefix = true } = options;

    if (!this.isAvailable) {
      return defaultValue;
    }

    try {
      const storageKey = usePrefix ? this.getPrefixedKey(key) : key;
      const data = localStorage.getItem(storageKey);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      logger.error(`Error reading from localStorage [${key}]:`, error);
      return defaultValue;
    }
  }

  /**
   * Remove data from localStorage
   * @param {string} key - Storage key
   * @param {Object} options - Optional settings
   * @param {boolean} options.usePrefix - Whether to add namespace prefix (default: true)
   * @returns {boolean} Success status
   */
  remove(key, options = {}) {
    const { usePrefix = true } = options;

    if (!this.isAvailable) {
      return false;
    }

    try {
      const storageKey = usePrefix ? this.getPrefixedKey(key) : key;
      localStorage.removeItem(storageKey);
      return true;
    } catch (error) {
      logger.error(`Error removing from localStorage [${key}]:`, error);
      return false;
    }
  }

  /**
   * Check if a key exists
   * @param {string} key - Storage key
   * @param {Object} options - Optional settings
   * @returns {boolean}
   */
  has(key, options = {}) {
    const { usePrefix = true } = options;

    if (!this.isAvailable) {
      return false;
    }

    const storageKey = usePrefix ? this.getPrefixedKey(key) : key;
    return localStorage.getItem(storageKey) !== null;
  }

  /**
   * Clear all prefixed keys (or all if specified)
   * @param {boolean} clearAll - If true, clears ALL localStorage (use with caution)
   */
  clear(clearAll = false) {
    if (!this.isAvailable) {
      return;
    }

    try {
      if (clearAll) {
        localStorage.clear();
      } else {
        // Only clear prefixed keys
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith(this.prefix)) {
            localStorage.removeItem(key);
          }
        });
      }
    } catch (error) {
      logger.error("Error clearing localStorage:", error);
    }
  }

  /**
   * Get all keys (optionally filtered by prefix)
   * @param {boolean} onlyPrefixed - If true, only returns prefixed keys
   * @returns {string[]}
   */
  keys(onlyPrefixed = true) {
    if (!this.isAvailable) {
      return [];
    }

    try {
      const allKeys = Object.keys(localStorage);
      if (onlyPrefixed) {
        return allKeys
          .filter((key) => key.startsWith(this.prefix))
          .map((key) => key.replace(this.prefix, ""));
      }
      return allKeys;
    } catch (error) {
      logger.error("Error getting keys:", error);
      return [];
    }
  }

  // ================================================================
  // DOMAIN-SPECIFIC METHODS (From original storageService.js)
  // ================================================================

  /**
   * Get recent workout sessions
   * @returns {Array} Array of workout sessions
   */
  getRecentWorkouts() {
    return this.get("recentWorkouts", [], { usePrefix: false });
  }

  /**
   * Save a workout session
   * @param {Object} session - Workout session data
   * @returns {boolean} Success status
   */
  saveWorkoutSession(session) {
    try {
      const workouts = this.getRecentWorkouts();
      workouts.push({
        ...session,
        id: session.id || Date.now(),
        timestamp: session.timestamp || new Date().toISOString(),
      });

      // Keep only last 50 workouts
      if (workouts.length > 50) {
        workouts.splice(0, workouts.length - 50);
      }

      return this.set("recentWorkouts", workouts, { usePrefix: false });
    } catch (error) {
      logger.error("Error saving workout session:", error);
      return false;
    }
  }

  /**
   * Get current workout session
   * @returns {Object|null}
   */
  getCurrentWorkout() {
    return this.get("currentWorkout", null, { usePrefix: false });
  }

  /**
   * Set current workout session
   * @param {Object} session - Workout session data
   * @returns {boolean}
   */
  setCurrentWorkout(session) {
    return this.set("currentWorkout", session, { usePrefix: false });
  }

  /**
   * Clear current workout session
   */
  clearCurrentWorkout() {
    this.remove("currentWorkout", { usePrefix: false });
  }

  /**
   * Get schedule settings
   * @returns {Object}
   */
  getScheduleSettings() {
    const defaultSettings = this.getDefaultScheduleSettings();
    return this.get("custom_schedule", defaultSettings, { usePrefix: true });
  }

  /**
   * Save schedule settings
   * @param {Object} settings - Schedule settings
   * @returns {boolean}
   */
  saveScheduleSettings(settings) {
    return this.set("custom_schedule", settings, { usePrefix: true });
  }

  /**
   * Get default schedule settings
   * @returns {Object}
   */
  getDefaultScheduleSettings() {
    return {
      weekStartsOn: 1, // Monday
      defaultDuration: 60, // minutes
      workoutTypes: ["strength", "conditioning", "skills", "recovery"],
      timeSlots: ["morning", "afternoon", "evening"],
    };
  }

  /**
   * Get offseason program data
   * @returns {Object|null}
   */
  getOffseasonProgram() {
    return this.get("offseasonProgram", null, { usePrefix: true });
  }

  /**
   * Save offseason program data
   * @param {Object} programData - Offseason program data
   * @returns {boolean}
   */
  saveOffseasonProgram(programData) {
    return this.set("offseasonProgram", programData, { usePrefix: true });
  }

  /**
   * Get QB program data
   * @returns {Object|null}
   */
  getQBProgram() {
    return this.get("qbProgram", null, { usePrefix: true });
  }

  /**
   * Save QB program data
   * @param {Object} programData - QB program data
   * @returns {boolean}
   */
  saveQBProgram(programData) {
    return this.set("qbProgram", programData, { usePrefix: true });
  }

  // ================================================================
  // UTILITY METHODS
  // ================================================================

  /**
   * Get storage size in bytes (approximate)
   * @returns {number}
   */
  getSize() {
    if (!this.isAvailable) {
      return 0;
    }

    let size = 0;
    try {
      for (const key in localStorage) {
        if (Object.hasOwn(localStorage, key)) {
          size += localStorage[key].length + key.length;
        }
      }
    } catch (e) {
      logger.error("Error calculating storage size:", e);
    }
    return size;
  }

  /**
   * Get storage size in human-readable format
   * @returns {string}
   */
  getSizeFormatted() {
    const bytes = this.getSize();
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}

// Create singleton instance
export const storageService = new UnifiedStorageService();
// Export class for testing
export { UnifiedStorageService };
