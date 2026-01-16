/**
 * State Subscription System
 * Simple reactive state management for components
 * 
 * Features:
 * - Automatic cleanup tracking via subscription IDs
 * - Component-scoped subscription management
 * - Async callback support to prevent blocking
 * - Debug logging for leak detection
 */

import { logger } from "../../logger.js";

class StateSubscription {
  constructor() {
    this.subscribers = new Map();
    this.state = {};
    // Track subscriptions by ID for cleanup
    this._subscriptionId = 0;
    this._subscriptionRegistry = new Map(); // id -> { key, callback, createdAt, componentId }
    this._componentSubscriptions = new Map(); // componentId -> Set<subscriptionId>
  }

  /**
   * Subscribe to state changes
   * @param {string} key - State key to watch
   * @param {Function} callback - Callback function
   * @param {string} [componentId] - Optional component ID for grouped cleanup
   * @returns {Function} Unsubscribe function
   */
  subscribe(key, callback, componentId = null) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key).add(callback);

    // Track subscription for cleanup
    const subscriptionId = ++this._subscriptionId;
    this._subscriptionRegistry.set(subscriptionId, {
      key,
      callback,
      createdAt: Date.now(),
      componentId,
    });

    // Track by component if componentId provided
    if (componentId) {
      if (!this._componentSubscriptions.has(componentId)) {
        this._componentSubscriptions.set(componentId, new Set());
      }
      this._componentSubscriptions.get(componentId).add(subscriptionId);
    }

    // Return unsubscribe function
    const unsubscribe = () => {
      const callbacks = this.subscribers.get(key);
      if (callbacks) {
        callbacks.delete(callback);
      }
      // Clean up tracking
      this._subscriptionRegistry.delete(subscriptionId);
      if (componentId && this._componentSubscriptions.has(componentId)) {
        this._componentSubscriptions.get(componentId).delete(subscriptionId);
      }
    };

    // Attach subscriptionId to unsubscribe function for debugging
    unsubscribe.subscriptionId = subscriptionId;
    return unsubscribe;
  }

  /**
   * Unsubscribe all subscriptions for a specific component
   * Call this in component cleanup/destroy lifecycle
   * @param {string} componentId - Component identifier
   */
  unsubscribeComponent(componentId) {
    const subscriptionIds = this._componentSubscriptions.get(componentId);
    if (!subscriptionIds) {
      return;
    }

    let unsubscribedCount = 0;
    subscriptionIds.forEach((subscriptionId) => {
      const subscription = this._subscriptionRegistry.get(subscriptionId);
      if (subscription) {
        const callbacks = this.subscribers.get(subscription.key);
        if (callbacks) {
          callbacks.delete(subscription.callback);
        }
        this._subscriptionRegistry.delete(subscriptionId);
        unsubscribedCount++;
      }
    });

    this._componentSubscriptions.delete(componentId);
    
    if (unsubscribedCount > 0) {
      logger.debug(
        `[StateSubscription] Cleaned up ${unsubscribedCount} subscription(s) for component: ${componentId}`
      );
    }
  }

  /**
   * Update state and notify subscribers
   * Uses queueMicrotask for async callback execution to prevent blocking
   * @param {string} key - State key
   * @param {*} value - New value
   */
  setState(key, value) {
    const oldValue = this.state[key];
    this.state[key] = value;

    // Notify subscribers asynchronously to prevent blocking
    const callbacks = this.subscribers.get(key);
    if (callbacks) {
      callbacks.forEach((callback) => {
        queueMicrotask(() => {
          try {
            callback(value, oldValue, key);
          } catch (error) {
            logger.error(`Error in subscriber callback for ${key}:`, error);
          }
        });
      });
    }
  }

  /**
   * Update state synchronously (for cases where immediate update is needed)
   * @param {string} key - State key
   * @param {*} value - New value
   */
  setStateSync(key, value) {
    const oldValue = this.state[key];
    this.state[key] = value;

    // Notify subscribers synchronously
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
   * Notifies subscribers once per key
   * @param {Object} updates - Object with key-value pairs
   */
  batchUpdate(updates) {
    Object.keys(updates).forEach((key) => {
      this.setState(key, updates[key]);
    });
  }

  /**
   * Batch update multiple state keys synchronously
   * @param {Object} updates - Object with key-value pairs
   */
  batchUpdateSync(updates) {
    Object.keys(updates).forEach((key) => {
      this.setStateSync(key, updates[key]);
    });
  }

  /**
   * Clear all subscriptions and state
   */
  clear() {
    this.subscribers.clear();
    this.state = {};
    this._subscriptionRegistry.clear();
    this._componentSubscriptions.clear();
    logger.debug("[StateSubscription] All subscriptions and state cleared");
  }

  /**
   * Get subscription statistics for debugging/leak detection
   * @returns {Object} Statistics about current subscriptions
   */
  getStats() {
    const stats = {
      totalSubscriptions: this._subscriptionRegistry.size,
      subscribersByKey: {},
      subscriptionsByComponent: {},
      oldestSubscription: null,
    };

    // Count subscribers by key
    this.subscribers.forEach((callbacks, key) => {
      stats.subscribersByKey[key] = callbacks.size;
    });

    // Count subscriptions by component
    this._componentSubscriptions.forEach((subscriptionIds, componentId) => {
      stats.subscriptionsByComponent[componentId] = subscriptionIds.size;
    });

    // Find oldest subscription (potential leak indicator)
    let oldestTime = Infinity;
    this._subscriptionRegistry.forEach((subscription, id) => {
      if (subscription.createdAt < oldestTime) {
        oldestTime = subscription.createdAt;
        stats.oldestSubscription = {
          id,
          key: subscription.key,
          componentId: subscription.componentId,
          age: Date.now() - subscription.createdAt,
        };
      }
    });

    return stats;
  }

  /**
   * Log subscription statistics (useful for debugging memory leaks)
   */
  logStats() {
    const stats = this.getStats();
    logger.info("[StateSubscription] Current stats:", stats);
    
    // Warn if there are potentially leaked subscriptions (older than 30 minutes)
    if (stats.oldestSubscription && stats.oldestSubscription.age > 30 * 60 * 1000) {
      logger.warn(
        `[StateSubscription] Potential memory leak: subscription ${stats.oldestSubscription.id} ` +
        `for key "${stats.oldestSubscription.key}" is ${Math.round(stats.oldestSubscription.age / 60000)} minutes old`
      );
    }
  }
}

// Export singleton instance
export const stateSubscription = new StateSubscription();
