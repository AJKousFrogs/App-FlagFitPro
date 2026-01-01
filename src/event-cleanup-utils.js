/**
 * Event Cleanup Utilities
 * Provides helpers for managing event listeners and preventing memory leaks
 */

import { logger } from "./logger.js";

export class EventCleanupManager {
  constructor() {
    this.registeredListeners = new Map();
    this.timers = new Set();
    this.observers = new Set();
    this.intervals = new Set();
    this.abortControllers = new Set();
  }

  /**
   * Add event listener with automatic cleanup tracking
   * @param {EventTarget} target - Event target
   * @param {string} event - Event type
   * @param {Function} handler - Event handler
   * @param {Object|Boolean} options - Event listener options
   * @returns {Function} Cleanup function
   */
  addEventListener(target, event, handler, options = false) {
    const listenerId = this.generateId();

    // Add listener
    target.addEventListener(event, handler, options);

    // Store for cleanup
    this.registeredListeners.set(listenerId, {
      target,
      event,
      handler,
      options,
      timestamp: Date.now(),
    });

    logger.debug(`Event listener registered: ${event} (ID: ${listenerId})`);

    // Return cleanup function
    return () => this.removeEventListener(listenerId);
  }

  /**
   * Remove specific event listener
   * @param {string} listenerId - Listener ID
   */
  removeEventListener(listenerId) {
    const listener = this.registeredListeners.get(listenerId);
    if (listener) {
      listener.target.removeEventListener(
        listener.event,
        listener.handler,
        listener.options,
      );
      this.registeredListeners.delete(listenerId);
      logger.debug(
        `Event listener removed: ${listener.event} (ID: ${listenerId})`,
      );
    }
  }

  /**
   * Set timeout with automatic cleanup tracking
   * @param {Function} callback - Callback function
   * @param {number} delay - Delay in milliseconds
   * @returns {number} Timer ID
   */
  setTimeout(callback, delay) {
    const timerId = window.setTimeout(() => {
      this.timers.delete(timerId);
      callback();
    }, delay);

    this.timers.add(timerId);
    logger.debug(`Timer created: ${timerId} (${delay}ms)`);
    return timerId;
  }

  /**
   * Clear specific timeout
   * @param {number} timerId - Timer ID
   */
  clearTimeout(timerId) {
    if (this.timers.has(timerId)) {
      window.clearTimeout(timerId);
      this.timers.delete(timerId);
      logger.debug(`Timer cleared: ${timerId}`);
    }
  }

  /**
   * Set interval with automatic cleanup tracking
   * @param {Function} callback - Callback function
   * @param {number} delay - Interval delay in milliseconds
   * @returns {number} Interval ID
   */
  setInterval(callback, delay) {
    const intervalId = window.setInterval(callback, delay);
    this.intervals.add(intervalId);
    logger.debug(`Interval created: ${intervalId} (${delay}ms)`);
    return intervalId;
  }

  /**
   * Clear specific interval
   * @param {number} intervalId - Interval ID
   */
  clearInterval(intervalId) {
    if (this.intervals.has(intervalId)) {
      window.clearInterval(intervalId);
      this.intervals.delete(intervalId);
      logger.debug(`Interval cleared: ${intervalId}`);
    }
  }

  /**
   * Create observer with automatic cleanup tracking
   * @param {Function} ObserverClass - Observer constructor (MutationObserver, IntersectionObserver, etc.)
   * @param {Function} callback - Observer callback
   * @returns {Object} Observer instance with cleanup function
   */
  createObserver(ObserverClass, callback) {
    const observer = new ObserverClass(callback);
    const observerId = this.generateId();

    this.observers.add({ id: observerId, observer });
    logger.debug(`Observer created: ${ObserverClass.name} (ID: ${observerId})`);

    return {
      observer,
      disconnect: () => {
        observer.disconnect();
        this.observers.delete(this.observers.find((o) => o.id === observerId));
        logger.debug(
          `Observer disconnected: ${ObserverClass.name} (ID: ${observerId})`,
        );
      },
    };
  }

  /**
   * Create AbortController with automatic cleanup tracking
   * @returns {AbortController} AbortController instance
   */
  createAbortController() {
    const controller = new AbortController();
    this.abortControllers.add(controller);
    logger.debug("AbortController created");

    // Remove from tracking when aborted
    controller.signal.addEventListener("abort", () => {
      this.abortControllers.delete(controller);
      logger.debug("AbortController aborted and cleaned up");
    });

    return controller;
  }

  /**
   * Clean up all registered resources
   */
  cleanup() {
    logger.debug(
      `Starting cleanup: ${this.registeredListeners.size} listeners, ${this.timers.size} timers, ${this.intervals.size} intervals, ${this.observers.size} observers`,
    );

    // Remove all event listeners
    this.registeredListeners.forEach((listener, id) => {
      this.removeEventListener(id);
    });

    // Clear all timers
    this.timers.forEach((timerId) => {
      this.clearTimeout(timerId);
    });

    // Clear all intervals
    this.intervals.forEach((intervalId) => {
      this.clearInterval(intervalId);
    });

    // Disconnect all observers
    this.observers.forEach(({ observer, id }) => {
      observer.disconnect();
      logger.debug(`Observer disconnected during cleanup: ${id}`);
    });
    this.observers.clear();

    // Abort all controllers
    this.abortControllers.forEach((controller) => {
      if (!controller.signal.aborted) {
        controller.abort();
      }
    });
    this.abortControllers.clear();

    logger.info("Event cleanup completed");
  }

  /**
   * Get cleanup statistics
   * @returns {Object} Cleanup statistics
   */
  getStats() {
    return {
      listeners: this.registeredListeners.size,
      timers: this.timers.size,
      intervals: this.intervals.size,
      observers: this.observers.size,
      abortControllers: this.abortControllers.size,
      totalResources:
        this.registeredListeners.size +
        this.timers.size +
        this.intervals.size +
        this.observers.size +
        this.abortControllers.size,
    };
  }

  /**
   * Generate unique ID
   * @returns {string} Unique ID
   */
  generateId() {
    return `cleanup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log memory usage information
   */
  logMemoryUsage() {
    if (performance.memory) {
      const { memory } = performance;
      logger.debug("Memory usage:", {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`,
      });
    }
  }
}

/**
 * Enhanced component class with automatic cleanup
 */
export class ComponentWithCleanup {
  constructor() {
    this.cleanupManager = new EventCleanupManager();

    // Auto-cleanup on page unload
    this.cleanupManager.addEventListener(window, "beforeunload", () => {
      this.cleanup();
    });
  }

  /**
   * Add event listener with automatic cleanup
   */
  addEventListener(target, event, handler, options) {
    return this.cleanupManager.addEventListener(
      target,
      event,
      handler,
      options,
    );
  }

  /**
   * Set timeout with automatic cleanup
   */
  setTimeout(callback, delay) {
    return this.cleanupManager.setTimeout(callback, delay);
  }

  /**
   * Set interval with automatic cleanup
   */
  setInterval(callback, delay) {
    return this.cleanupManager.setInterval(callback, delay);
  }

  /**
   * Create observer with automatic cleanup
   */
  createObserver(ObserverClass, callback) {
    return this.cleanupManager.createObserver(ObserverClass, callback);
  }

  /**
   * Create AbortController with automatic cleanup
   */
  createAbortController() {
    return this.cleanupManager.createAbortController();
  }

  /**
   * Cleanup all resources
   */
  cleanup() {
    this.cleanupManager.cleanup();
  }

  /**
   * Called when component is destroyed (override in subclasses)
   */
  onDestroy() {
    this.cleanup();
  }
}

// Global cleanup manager for app-wide use
export const globalCleanupManager = new EventCleanupManager();

// Auto-cleanup on page unload
globalCleanupManager.addEventListener(window, "beforeunload", () => {
  globalCleanupManager.cleanup();
  globalCleanupManager.logMemoryUsage();
});

// Cleanup on navigation (for SPA behavior)
globalCleanupManager.addEventListener(window, "pagehide", () => {
  globalCleanupManager.cleanup();
});

export default EventCleanupManager;
