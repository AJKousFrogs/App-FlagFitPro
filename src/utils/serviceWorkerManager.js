// Service Worker Manager
// Handles service worker registration, updates, and cleanup

const SW_VERSION = 'v2';
const SW_CACHE_NAME = 'flag-football-v2';

class ServiceWorkerManager {
  constructor() {
    this.isSupported = 'serviceWorker' in navigator;
    this.registration = null;
    this.updateFound = false;
  }

  // Register service worker
  async register() {
    if (!this.isSupported) {
      return false;
    }

    try {
      // Unregister any existing service workers first
      await this.unregisterAll();
      
      // Clear old caches
      await this.clearOldCaches();
      
      // Register new service worker
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });


      // Listen for updates
      this.setupUpdateListener();
      
      // Listen for controller changes
      this.setupControllerListener();

      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  // Unregister all service workers
  async unregisterAll() {
    if (!this.isSupported) return;

    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      for (const registration of registrations) {
        await registration.unregister();
      }
    } catch (error) {
      console.error('Failed to unregister service workers:', error);
    }
  }

  // Clear old caches
  async clearOldCaches() {
    if (!('caches' in window)) return;

    try {
      const cacheNames = await caches.keys();
      
      for (const cacheName of cacheNames) {
        if (cacheName !== SW_CACHE_NAME) {
          await caches.delete(cacheName);
        }
      }
    } catch (error) {
      console.error('Failed to clear old caches:', error);
    }
  }

  // Setup update listener
  setupUpdateListener() {
    if (!this.registration) return;

    this.registration.addEventListener('updatefound', () => {
      this.updateFound = true;
      
      const newWorker = this.registration.installing;
      
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          this.showUpdateNotification();
        }
      });
    });
  }

  // Setup controller listener
  setupControllerListener() {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      
      if (this.updateFound) {
        // Reload the page to use the new service worker
        window.location.reload();
      }
    });
  }

  // Show update notification
  showUpdateNotification() {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('App Update Available', {
        body: 'A new version is available. Click to update.',
        icon: '/icons/app-icon.png',
        badge: '/icons/badge.png',
        tag: 'app-update',
        requireInteraction: true,
        actions: [
          {
            action: 'update',
            title: 'Update Now'
          },
          {
            action: 'dismiss',
            title: 'Later'
          }
        ]
      });

      notification.addEventListener('click', () => {
        window.location.reload();
      });

      notification.addEventListener('actionclick', (event) => {
        if (event.action === 'update') {
          window.location.reload();
        }
        notification.close();
      });
    }
  }

  // Check if service worker is active
  isActive() {
    return this.registration && this.registration.active;
  }

  // Get service worker state
  getState() {
    if (!this.registration) return 'not-registered';
    
    if (this.registration.installing) return 'installing';
    if (this.registration.waiting) return 'waiting';
    if (this.registration.active) return 'active';
    
    return 'unknown';
  }

  // Request notification permission
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  // Send message to service worker
  async sendMessage(message) {
    if (!this.isActive()) {
      console.warn('Service Worker not active, cannot send message');
      return false;
    }

    try {
      await navigator.serviceWorker.controller.postMessage(message);
      return true;
    } catch (error) {
      console.error('Failed to send message to Service Worker:', error);
      return false;
    }
  }

  // Register background sync
  async registerBackgroundSync(tag) {
    if (!('serviceWorker' in navigator) || !('sync' in window.ServiceWorkerRegistration.prototype)) {
      return false;
    }

    if (!this.isActive()) {
      console.warn('Service Worker not active, cannot register background sync');
      return false;
    }

    try {
      await this.registration.sync.register(tag);
      return true;
    } catch (error) {
      console.error('Failed to register background sync:', error);
      return false;
    }
  }

  // Get service worker info for debugging
  getInfo() {
    return {
      supported: this.isSupported,
      registered: !!this.registration,
      state: this.getState(),
      updateFound: this.updateFound,
      controller: !!navigator.serviceWorker.controller,
      scope: this.registration?.scope || null
    };
  }
}

// Create singleton instance
const serviceWorkerManager = new ServiceWorkerManager();

// Auto-register on page load (disabled in development)
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // Check if we're in development mode
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.port === '4000' ||
                         process.env.NODE_ENV === 'development';
    
    if (isDevelopment) {
      // Unregister any existing service workers in development
      serviceWorkerManager.unregisterAll();
    } else {
      // Only register in production
      serviceWorkerManager.register();
    }
  });
}

export default serviceWorkerManager; 