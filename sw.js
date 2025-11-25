// FlagFit Pro - Service Worker
// Version 1.0.0
// Handles caching, offline support, and push notifications

const CACHE_NAME = 'flagfit-pro-v1.0.0';
const RUNTIME_CACHE = 'flagfit-runtime-v1.0.0';

// Assets to cache on install
const STATIC_ASSETS = [
  '/dashboard.html',
  '/training.html',
  '/wellness.html',
  '/analytics.html',
  '/src/css/main.css',
  '/src/css/components/sidebar.css',
  '/src/css/components/header.css',
  '/src/css/utilities.css',
  '/src/css/pages/dashboard.css',
  '/src/css/pages/training.css',
  '/src/css/pages/wellness.css',
  '/manifest.json',
  // Add other critical assets
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Skip waiting');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete old caches
              return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
            })
            .map((cacheName) => {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[Service Worker] Claiming clients');
        return self.clients.claim();
      })
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
      console.log('[Service Worker] Serving from cache:', request.url);
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
    console.error('[Service Worker] Fetch failed:', error);

    // Return offline page if available
    const offlinePage = await caches.match('/offline.html');
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

    // Cache successful API responses
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network failed, trying cache:', request.url);

    // Fallback to cache
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      console.log('[Service Worker] Serving API response from cache');
      return cachedResponse;
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
  console.log('[Service Worker] Push notification received');

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
    } catch (error) {
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
  console.log('[Service Worker] Notification clicked');

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/dashboard.html';

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
// 1. Implement IndexedDB storage in src/js/services/offline-storage.js
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
  console.log('[Service Worker] Message received:', event.data);

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

console.log('[Service Worker] Loaded and ready');
