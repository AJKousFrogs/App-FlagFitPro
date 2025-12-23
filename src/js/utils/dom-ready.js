/**
 * DOM Ready Utility - FlagFit Pro
 * Provides a consistent way to wait for DOM to be ready across all modules
 */

/**
 * Execute callback when DOM is ready
 * Works whether DOM is already loaded or still loading
 * @param {Function} callback - Function to execute when DOM is ready
 * @returns {void}
 */
export function onDOMReady(callback) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback);
  } else {
    // DOM already loaded, execute immediately
    callback();
  }
}

/**
 * Execute callback when DOM is ready (async version)
 * Returns a Promise that resolves when DOM is ready
 * @param {Function} callback - Optional function to execute when DOM is ready
 * @returns {Promise<void>}
 */
export function whenDOMReady(callback) {
  return new Promise((resolve) => {
    onDOMReady(() => {
      if (callback) {
        callback();
      }
      resolve();
    });
  });
}

/**
 * Check if DOM is already ready
 * @returns {boolean}
 */
export function isDOMReady() {
  return document.readyState !== "loading";
}

// Make onDOMReady globally available for backward compatibility
if (typeof window !== "undefined") {
  window.onDOMReady = onDOMReady;
}
