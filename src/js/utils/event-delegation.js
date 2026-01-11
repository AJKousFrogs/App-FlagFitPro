/**
 * Event Delegation Utilities
 * Helper functions for efficient event handling
 */

import { logger } from "../../logger.js";

// Re-export debounce and throttle from shared.js to avoid duplication
// These are the canonical implementations for the vanilla JS codebase
export { debounce, throttle } from "./shared.js";

/**
 * Set up event delegation on a container
 * @param {HTMLElement|string} container - Container element or selector
 * @param {string} selector - CSS selector for target elements
 * @param {string} event - Event type (e.g., 'click')
 * @param {Function} handler - Event handler function
 * @param {Object} options - Additional options
 */
export function delegate(container, selector, event, handler, options = {}) {
  const containerElement =
    typeof container === "string"
      ? document.querySelector(container)
      : container;

  if (!containerElement) {
    logger.warn(`Container not found: ${container}`);
    return () => {}; // Return no-op cleanup function
  }

  const eventHandler = (e) => {
    const target = e.target.closest(selector);
    if (target && containerElement.contains(target)) {
      handler(e, target);
    }
  };

  containerElement.addEventListener(event, eventHandler, options);

  // Return cleanup function
  return () => {
    containerElement.removeEventListener(event, eventHandler, options);
  };
}

/**
 * Set up click delegation
 */
export function delegateClick(container, selector, handler, options = {}) {
  return delegate(container, selector, "click", handler, options);
}

/**
 * Set up multiple delegations at once
 * @param {HTMLElement|string} container - Container element
 * @param {Array} delegations - Array of {selector, event, handler} objects
 */
export function delegateMultiple(container, delegations) {
  const cleanupFunctions = delegations.map(
    ({ selector, event, handler, options }) =>
      delegate(container, selector, event, handler, options),
  );

  // Return cleanup function for all delegations
  return () => {
    cleanupFunctions.forEach((cleanup) => cleanup());
  };
}
