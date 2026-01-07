/**
 * State Subscription System
 * Simple reactive state management for components
 */

import { logger } from "../../logger.js";

class StateSubscription {
  constructor() {
    this.subscribers = new Map();
    this.state = {};
  }

  /**
   * Subscribe to state changes
   * @param {string} key - State key to watch
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key).add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(key);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  /**
   * Update state and notify subscribers
   * @param {string} key - State key
   * @param {*} value - New value
   */
  setState(key, value) {
    const oldValue = this.state[key];
    this.state[key] = value;

    // Notify subscribers
    const callbacks = this.subscribers.get(key);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(value, oldValue, key);
        } catch (error) {
          logger.error(`Error in subscriber callback for ${key}:`, error);
        }
      });
    }
  }

  /**
   * Get current state value
   * @param {string} key - State key
   * @returns {*} Current value
   */
  getState(key) {
    return this.state[key];
  }

  /**
   * Get all state
   * @returns {Object} Current state object
   */
  getAllState() {
    return { ...this.state };
  }

  /**
   * Batch update multiple state keys
   * @param {Object} updates - Object with key-value pairs
   */
  batchUpdate(updates) {
    Object.keys(updates).forEach((key) => {
      this.setState(key, updates[key]);
    });
  }

  /**
   * Clear all subscriptions
   */
  clear() {
    this.subscribers.clear();
    this.state = {};
  }
}

// Export singleton instance
export const stateSubscription = new StateSubscription();
