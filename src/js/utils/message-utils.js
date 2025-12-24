// Message Display Utilities - FlagFit Pro
// Shared functions for showing/hiding alert messages across pages

/**
 * Show a message in a specified element
 * @param {string} elementId - ID of the element to show message in
 * @param {string} message - Message text to display
 * @param {Object} options - Optional configuration
 * @param {number} options.autoHideDelay - Milliseconds before auto-hiding (default: 5000 for errors, null for success)
 * @param {boolean} options.isError - Whether this is an error message (affects auto-hide behavior)
 */
export function showMessage(elementId, message, options = {}) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`Message element with ID "${elementId}" not found`);
    return;
  }

  // Set message content
  element.textContent = message;
  element.style.display = "block";

  // Auto-hide logic
  const { autoHideDelay, isError } = options;
  const delay =
    autoHideDelay !== undefined ? autoHideDelay : isError ? 5000 : null;

  if (delay !== null && delay > 0) {
    setTimeout(() => {
      element.style.display = "none";
    }, delay);
  }
}

/**
 * Hide a message element
 * @param {string} elementId - ID of the element to hide
 */
export function hideMessage(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.style.display = "none";
  }
}

/**
 * Show an error message
 * @param {string} elementId - ID of the error message element
 * @param {string} message - Error message text
 * @param {number} autoHideDelay - Milliseconds before auto-hiding (default: 5000)
 */
export function showError(elementId, message, autoHideDelay = 5000) {
  showMessage(elementId, message, {
    autoHideDelay,
    isError: true,
  });
}

/**
 * Show a success message
 * @param {string} elementId - ID of the success message element
 * @param {string} message - Success message text
 * @param {number} autoHideDelay - Milliseconds before auto-hiding (default: null - stays visible)
 */
export function showSuccess(elementId, message, autoHideDelay = null) {
  showMessage(elementId, message, {
    autoHideDelay,
    isError: false,
  });
}

/**
 * Clear all messages (error and success)
 * @param {string} errorElementId - ID of error message element
 * @param {string} successElementId - ID of success message element
 */
export function clearMessages(errorElementId, successElementId) {
  hideMessage(errorElementId);
  hideMessage(successElementId);
}

// Make functions globally available for backward compatibility
if (typeof window !== "undefined") {
  window.showMessage = showMessage;
  window.hideMessage = hideMessage;
  window.showError = showError;
  window.showSuccess = showSuccess;
  window.clearMessages = clearMessages;
}
