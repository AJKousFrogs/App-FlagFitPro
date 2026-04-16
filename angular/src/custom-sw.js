/**
 * Custom Service Worker — FlagFit Pro
 *
 * Wraps the Angular NGSW worker and adds Background Sync support for the
 * offline queue (tag: 'flagfit-offline-queue').
 *
 * When the device comes back online (even if the tab was closed), the browser
 * fires a 'sync' event here. We post a message to all open clients so that
 * OfflineQueueService can drain the queue through its normal sync path.
 *
 * Build note: angular.json deploys this file to /custom-sw.js; app.config.ts
 * registers it instead of the default ngsw-worker.js. The NGSW is imported
 * below so all standard PWA caching/push behaviour is preserved.
 */

// Pull in Angular's generated service worker (caching, push notifications, etc.)
importScripts('/ngsw-worker.js');

// ── Background Sync ──────────────────────────────────────────────────────────

self.addEventListener('sync', (event) => {
  if (event.tag !== 'flagfit-offline-queue') return;

  event.waitUntil(notifyClientsToSync());
});

/**
 * Post a message to every open window/tab so Angular's OfflineQueueService
 * can call syncQueue() from within the normal DI context.
 */
async function notifyClientsToSync() {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of clients) {
    client.postMessage({ type: 'OFFLINE_SYNC_TRIGGER' });
  }
}
