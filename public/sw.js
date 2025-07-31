// Service Worker for Flag Football App Push Notifications
// Handles push notifications, background sync, and caching

const CACHE_NAME = 'flag-football-v5-dev';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html'
];

// Install event - cache resources with better error handling
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Only cache resources that exist, handle failures gracefully
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(error => {
              console.warn(`Failed to cache ${url}:`, error);
              return null; // Continue with other resources
            })
          )
        );
      })
      .catch(error => {
        console.error('Service Worker install failed:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - simplified cache-first with network fallback for better Vite compatibility
self.addEventListener('fetch', (event) => {
  // Bypass requests for Vite client and other development-specific resources
  if (event.request.url.includes('@vite/') || 
      event.request.url.includes('/__') ||
      event.request.url.includes('?import') ||
      event.request.url.includes('&import') ||
      event.request.url.includes('.vite/')) {
    return; // Allow the browser to handle these requests normally
  }

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // Skip authentication requests to ensure fresh data
  const url = new URL(event.request.url);
  const sensitiveEndpoints = ['/api/auth/', '/api/login', '/api/register', '/api/logout'];
  if (sensitiveEndpoints.some(endpoint => url.pathname.includes(endpoint))) {
    return; // Let these go directly to network
  }

  // Handle SPA routes - for HTML document requests, serve index.html
  if (event.request.destination === 'document') {
    // Check if this is a SPA route (not a static file)
    if (isSPARoute(url.pathname)) {
      event.respondWith(
        fetch('/index.html')
          .then((response) => {
            // Cache the index.html response if successful
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put('/index.html', responseClone);
              }).catch(() => {/* Ignore cache errors */});
            }
            return response;
          })
          .catch(() => {
            // Fallback to cached index.html for SPA routes
            return caches.match('/index.html')
              .then((cachedResponse) => {
                if (cachedResponse) {
                  return cachedResponse;
                }
                // Final fallback to offline page
                return caches.match('/offline.html');
              });
          })
      );
      return;
    }
  }

  // For all other requests, use simple cache-first with network fallback
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          // For static assets, also update cache in background
          if (isCacheable(event.request)) {
            fetch(event.request).then((networkResponse) => {
              if (networkResponse && networkResponse.ok) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, networkResponse.clone());
                }).catch(() => {/* Ignore cache errors */});
              }
            }).catch(() => {/* Ignore network errors for background updates */});
          }
          return response;
        }
        
        // Not in cache, fetch from network
        return fetch(event.request)
          .then((networkResponse) => {
            // Cache successful responses if they're cacheable
            if (networkResponse && networkResponse.ok && isCacheable(event.request)) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              }).catch(() => {/* Ignore cache errors */});
            }
            return networkResponse;
          });
      })
      .catch((error) => {
        // Log errors for debugging
        console.error('Fetch failed:', event.request.url, error);
        
        // Return offline page for document requests
        if (event.request.destination === 'document') {
          return caches.match('/offline.html')
            .then((offlineResponse) => {
              if (offlineResponse) {
                return offlineResponse;
              }
              // Final fallback
              return new Response('Application is offline', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'text/plain' }
              });
            });
        }
        
        // For other resources, return a generic error
        return new Response('Resource unavailable offline', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'text/plain' }
        });
      })
  );
});

// Helper function to determine if a path is a SPA route
function isSPARoute(pathname) {
  // Static file extensions that should not be treated as SPA routes
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.html', '.json', '.xml', '.txt'];
  const hasStaticExtension = staticExtensions.some(ext => pathname.endsWith(ext));
  
  // API routes should not be treated as SPA routes
  const isApiRoute = pathname.startsWith('/api/');
  
  // If it has a static extension or is an API route, it's not a SPA route
  if (hasStaticExtension || isApiRoute) {
    return false;
  }
  
  // Everything else is likely a SPA route (React Router handles these)
  return true;
}

// Helper function to determine if a request should be cached
function isCacheable(request) {
  const url = new URL(request.url);
  
  // Only cache GET requests
  if (request.method !== 'GET') {
    return false;
  }
  
  // Don't cache Vite development resources
  if (url.pathname.includes('@vite/') || 
      url.pathname.includes('/__') ||
      url.searchParams.has('import')) {
    return false;
  }
  
  // Cache static assets
  const cacheableExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.json'];
  const isStaticAsset = cacheableExtensions.some(ext => url.pathname.endsWith(ext));
  
  // Cache certain API responses (but not auth endpoints)
  const isApiRequest = url.pathname.startsWith('/api/') && 
                       !url.pathname.includes('auth') && 
                       !url.pathname.includes('login') && 
                       !url.pathname.includes('register');
  
  return isStaticAsset || isApiRequest;
}

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push received:', event);
  
  let notificationData = {};
  
  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (error) {
      notificationData = {
        title: 'Flag Football App',
        body: event.data.text() || 'New notification',
        icon: '/icons/app-icon.png',
        badge: '/icons/badge.png'
      };
    }
  } else {
    notificationData = {
      title: 'Flag Football App',
      body: 'New notification',
      icon: '/icons/app-icon.png',
      badge: '/icons/badge.png'
    };
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon || '/icons/app-icon.png',
    badge: notificationData.badge || '/icons/badge.png',
    data: notificationData.data || {},
    actions: notificationData.actions || [
      {
        action: 'view',
        title: 'View'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    tag: notificationData.tag || 'default',
    requireInteraction: notificationData.requireInteraction || false,
    vibrate: notificationData.vibrate || [200, 100, 200],
    timestamp: Date.now()
  };

  // Show notification for emergency alerts even if app is focused
  if (notificationData.priority === 'critical') {
    options.requireInteraction = true;
    options.vibrate = [1000, 500, 1000, 500, 1000];
    options.actions = [
      {
        action: 'emergency_response',
        title: 'Respond'
      },
      {
        action: 'view_details',
        title: 'View Details'
      }
    ];
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  const notificationData = event.notification.data;
  const action = event.action;

  // Handle different notification actions
  switch (action) {
    case 'emergency_response':
      // Open emergency response page
      event.waitUntil(
        clients.openWindow('/emergency-response')
      );
      break;
      
    case 'view_details':
      // Open notification details
      event.waitUntil(
        clients.openWindow('/notifications')
      );
      break;
      
    case 'dismiss':
      // Just close the notification
      break;
      
    default:
      // Default action - open the app
      event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
          // Check if app is already open
          for (const client of clientList) {
            if (client.url.includes('/') && 'focus' in client) {
              return client.focus();
            }
          }
          // Open new window if app is not open
          if (clients.openWindow) {
            return clients.openWindow('/');
          }
        })
      );
  }
});

// Background sync for offline functionality
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  switch (event.tag) {
    case 'sync-notifications':
      event.waitUntil(syncNotifications());
      break;
      
    case 'background-backup':
      event.waitUntil(performBackgroundBackup());
      break;
      
    default:
      console.log('Unknown sync tag:', event.tag);
  }
});

// Sync notifications when back online
async function syncNotifications() {
  try {
    const notifications = await getQueuedNotifications();
    
    for (const notification of notifications) {
      await sendNotification(notification);
    }
    
    await clearNotificationQueue();
    console.log('Notifications synced successfully');
  } catch (error) {
    console.error('Failed to sync notifications:', error);
  }
}

// Get queued notifications from IndexedDB
async function getQueuedNotifications() {
  // This would typically use IndexedDB to get queued notifications
  // For now, return empty array
  return [];
}

// Send notification to server
async function sendNotification(notification) {
  // This would typically send the notification to your backend
  console.log('Sending notification:', notification);
}

// Clear notification queue
async function clearNotificationQueue() {
  // This would typically clear the notification queue from IndexedDB
  console.log('Clearing notification queue');
}

// Perform background backup
async function performBackgroundBackup() {
  try {
    console.log('Performing background backup...');
    // This would typically backup user data to the server
    // For now, just log the action
  } catch (error) {
    console.error('Background backup failed:', error);
  }
}