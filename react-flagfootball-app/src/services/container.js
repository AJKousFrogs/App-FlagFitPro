// Dependency Injection Container for React App
import pocketbaseService from './pocketbase-client.service';
import cacheService from './cache.service';

class Container {
  constructor() {
    this.services = new Map();
    this.singletons = new Map();
    this.initializeServices();
  }

  /**
   * Initialize core services
   */
  initializeServices() {
    // Register core services
    this.register('pocketbase', () => pocketbaseService);
    this.register('cache', () => cacheService);
    
    // Services are now self-contained and don't use container

    // Register configuration
    this.register('config', () => ({
      pocketbaseUrl: import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090',
      apiTimeout: 30000,
      cacheTTL: 5 * 60 * 1000, // 5 minutes
      maxRetries: 3
    }));
  }

  /**
   * Register a service with the container
   * @param {string} name - Service name
   * @param {Function} factory - Factory function to create service
   * @param {boolean} singleton - Whether to create singleton instance
   */
  register(name, factory, singleton = true) {
    this.services.set(name, { factory, singleton });
  }

  /**
   * Resolve a service from the container
   * @param {string} name - Service name
   * @returns {any} - Service instance
   */
  resolve(name) {
    const service = this.services.get(name);
    
    if (!service) {
      throw new Error(`Service '${name}' not found in container`);
    }

    if (service.singleton) {
      if (!this.singletons.has(name)) {
        this.singletons.set(name, service.factory());
      }
      return this.singletons.get(name);
    }

    return service.factory();
  }

  /**
   * Check if a service is registered
   * @param {string} name - Service name
   * @returns {boolean} - Whether service exists
   */
  has(name) {
    return this.services.has(name);
  }

  /**
   * Get all registered service names
   * @returns {Array<string>} - Service names
   */
  getServiceNames() {
    return Array.from(this.services.keys());
  }

  /**
   * Clear all singleton instances
   */
  clearSingletons() {
    this.singletons.clear();
  }

  /**
   * Reset the container (clear all services and singletons)
   */
  reset() {
    this.services.clear();
    this.singletons.clear();
    this.initializeServices();
  }
}

// Export singleton container instance
export const container = new Container();

// Export container class for testing
export { Container }; 