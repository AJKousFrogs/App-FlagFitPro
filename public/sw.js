// Service Worker for Flag Football App Push Notifications
// Handles push notifications, background sync, and caching

const CACHE_NAME = 'flag-football-v1';
const urlsToCache = [
  '/',
  '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Try to cache each resource individually to avoid failing all if one fails
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(error => {
              console.log('Failed to cache:', url, error);
              return null;
            })
          )
        );
      })
      .catch(error => {
        console.log('Cache setup failed:', error);
        return null;
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
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }
        
        // Otherwise fetch from network with error handling
        return fetch(event.request).catch((error) => {
          console.log('Fetch failed for:', event.request.url, error);
          
          // For navigation requests, return a basic offline page
          if (event.request.mode === 'navigate') {
            return new Response(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>Offline - FlagFit Pro</title>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                </head>
                <body>
                  <h1>You're offline</h1>
                  <p>Please check your internet connection and try again.</p>
                  <button onclick="window.location.reload()">Retry</button>
                </body>
              </html>
            `, {
              headers: { 'Content-Type': 'text/html' },
              status: 200
            });
          }
          
          // For other requests, return a basic error response
          return new Response('Resource not available offline', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

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
  
  let urlToOpen = '/';
  
  // Determine URL based on notification type and action
  if (action === 'emergency_response') {
    urlToOpen = '/emergency';
  } else if (action === 'view_details' || action === 'view') {
    switch (notificationData.type) {
      case 'EMERGENCY':
        urlToOpen = '/emergency';
        break;
      case 'TEAM_MESSAGE':
        urlToOpen = '/community/team';
        break;
      case 'TRAINING_REMINDER':
        urlToOpen = '/training';
        break;
      case 'GAME_UPDATE':
        urlToOpen = '/tournaments';
        break;
      case 'INJURY_REPORT':
        urlToOpen = '/safety';
        break;
      default:
        urlToOpen = '/dashboard';
    }
  } else if (action === 'dismiss') {
    // Just close the notification
    return;
  }
  
  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no matching client found, open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync for offline notifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync tasks
      syncNotifications()
    );
  }
});

// Sync notifications when back online
async function syncNotifications() {
  try {
    // Get any queued notifications from IndexedDB or localStorage
    const queuedNotifications = await getQueuedNotifications();
    
    for (const notification of queuedNotifications) {
      // Send queued notifications
      await sendNotification(notification);
    }
    
    // Clear the queue
    await clearNotificationQueue();
  } catch (error) {
    console.error('Error syncing notifications:', error);
  }
}

// Get queued notifications (mock implementation)
async function getQueuedNotifications() {
  // In a real implementation, this would read from IndexedDB
  return [];
}

// Send notification (mock implementation)
async function sendNotification(notification) {
  // In a real implementation, this would send to notification service
  console.log('Sending queued notification:', notification);
}

// Clear notification queue (mock implementation)
async function clearNotificationQueue() {
  // In a real implementation, this would clear IndexedDB
  console.log('Notification queue cleared');
}

// Handle message from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Periodic background sync for automatic backups (experimental)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'backup-sync') {
    event.waitUntil(
      performBackgroundBackup()
    );
  }
});

// Perform background backup (mock implementation)
async function performBackgroundBackup() {
  try {
    console.log('Performing background backup...');
    
    // In a real implementation, this would:
    // 1. Check if backup is needed
    // 2. Collect critical data
    // 3. Store backup locally or sync to server
    // 4. Send notification if backup fails
    
    const backupSuccess = true; // Mock result
    
    if (!backupSuccess) {
      // Show notification if backup failed
      self.registration.showNotification('Backup Failed', {
        body: 'Automatic backup could not be completed. Please check your data.',
        icon: '/icons/app-icon.png',
        badge: '/icons/badge.png',
        tag: 'backup-failed',
        actions: [
          {
            action: 'retry_backup',
            title: 'Retry'
          },
          {
            action: 'view_backup',
            title: 'View Details'
          }
        ]
      });
    }
  } catch (error) {
    console.error('Background backup failed:', error);
  }
}