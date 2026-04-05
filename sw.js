/* global clients */
/* eslint-disable no-console */
// FlagFit Pro - Service Worker
// Version 1.0.2
// Handles caching, offline support, and push notifications

const CACHE_NAME = 'flagfit-pro-v1.0.2';
const RUNTIME_CACHE = 'flagfit-runtime-v1.0.2';

// Assets to cache on install
// ⚠️ UPDATED: Removed legacy src/css references (January 2026)
// Angular app uses its own assets from angular/dist/
const STATIC_ASSETS = [
  '/manifest.webmanifest',
  // Angular assets are handled by Angular Service Worker (ngsw-worker.js)
];

function logServiceWorker(level, eventName, context = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event_name: eventName,
    context
  };
  const line = JSON.stringify(entry);

  if (level === 'error') {
    console.error(line);
    return;
  }

  if (level === 'warn') {
    console.warn(line);
  }
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((error) => {
        logServiceWorker('error', 'service_worker_install_failed', {
          error: error instanceof Error ? error.message : String(error)
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete old caches
              return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
            })
            .map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // API requests - Network first, cache fallback
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/.netlify/functions/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Static assets - Cache first, network fallback
  event.respondWith(cacheFirstStrategy(request));
});

// Cache-first strategy (for static assets)
async function cacheFirstStrategy(request) {
  try {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Not in cache, fetch from network
    const networkResponse = await fetch(request);

    // Cache the new resource
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    logServiceWorker('error', 'service_worker_fetch_failed', {
      url: request.url,
      error: error instanceof Error ? error.message : String(error)
    });

    // Return offline page if available (Angular route)
    const offlinePage = await caches.match('/offline');
    if (offlinePage) {
      return offlinePage;
    }

    // Return a basic offline response
    return new Response('Offline - Please check your connection', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    });
  }
}

// Network-first strategy (for API requests)
async function networkFirstStrategy(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);

    // Only cache GET requests (never cache POST, PUT, DELETE, PATCH)
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (_error) {
    // Only try cache for GET requests
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);

      if (cachedResponse) {
        return cachedResponse;
      }
    }

    // No cache available
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Offline - cached data not available',
        offline: true
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({
          'Content-Type': 'application/json'
        })
      }
    );
  }
}

// Push notification event
self.addEventListener('push', (event) => {
  let notificationData = {
    title: 'FlagFit Pro',
    body: 'You have a new notification',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: 'flagfit-notification',
    requireInteraction: false
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (_error) {
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data || {},
      actions: notificationData.actions || []
    })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if a window is already open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }

        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// ========================================
// BACKGROUND SYNC - DISABLED
// ========================================
// Background sync is disabled until IndexedDB persistence is implemented.
// When ready to enable:
// 1. Implement IndexedDB storage (migrated to Angular services)
// 2. Implement getPendingWellnessData() and getPendingTrainingData()
// 3. Uncomment the sync event listener below
// 4. Test thoroughly in offline scenarios
// ========================================

/*
// Background sync event (for offline data sync)
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);

  if (event.tag === 'sync-wellness-data') {
    event.waitUntil(syncWellnessData());
  }

  if (event.tag === 'sync-training-data') {
    event.waitUntil(syncTrainingData());
  }
});

// Sync wellness data when back online
async function syncWellnessData() {
  try {
    console.log('[Service Worker] Syncing wellness data...');

    // Get pending wellness data from IndexedDB
    const pendingData = await getPendingWellnessData();

    if (pendingData && pendingData.length > 0) {
      for (const item of pendingData) {
        await fetch('/.netlify/functions/wellness', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(item.data)
        });
      }

      console.log('[Service Worker] Wellness data synced successfully');
    }
  } catch (error) {
    console.error('[Service Worker] Wellness sync failed:', error);
    throw error; // Retry sync
  }
}

// Sync training data when back online
async function syncTrainingData() {
  try {
    console.log('[Service Worker] Syncing training data...');

    // Get pending training data from IndexedDB
    const pendingData = await getPendingTrainingData();

    if (pendingData && pendingData.length > 0) {
      for (const item of pendingData) {
        await fetch('/.netlify/functions/training', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(item.data)
        });
      }

      console.log('[Service Worker] Training data synced successfully');
    }
  } catch (error) {
    console.error('[Service Worker] Training sync failed:', error);
    throw error; // Retry sync
  }
}

// Placeholder functions for IndexedDB operations
async function getPendingWellnessData() {
  // TODO: Implement IndexedDB query for pending wellness data
  // Should return array of {id, data, timestamp} objects
  return [];
}

async function getPendingTrainingData() {
  // TODO: Implement IndexedDB query for pending training data
  // Should return array of {id, data, timestamp} objects
  return [];
}
*/

// Message event - for communication with main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(RUNTIME_CACHE)
        .then((cache) => cache.addAll(event.data.urls))
    );
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => caches.delete(cacheName))
          );
        })
    );
  }
});
