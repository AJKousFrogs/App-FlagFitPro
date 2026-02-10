#!/usr/bin/env node

/**
 * Clear Service Worker and Cache Script
 *
 * This script helps clear the service worker and cache for testing purposes.
 * Run this script to reset the service worker state.
 */

console.log("🧹 Clearing Service Worker and Cache...\n");

// Instructions for manual clearing
const instructions = `
To clear the service worker and cache manually:

1. Open Chrome DevTools (F12)
2. Go to Application tab
3. In the left sidebar, click on "Service Workers"
4. Click "Unregister" for any existing service workers
5. Click on "Storage" in the left sidebar
6. Click "Clear site data" button
7. Refresh the page

Alternative method:
1. Open Chrome DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

Or use the browser console:
`;

const consoleCommands = `
// Run these commands in the browser console:

// Unregister all service workers
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.unregister());
  console.log('Service workers unregistered');
});

// Clear all caches
caches.keys().then(cacheNames => {
  cacheNames.forEach(cacheName => {
    caches.delete(cacheName);
    console.log('Cache deleted:', cacheName);
  });
});

// Reload the page
window.location.reload();
`;

console.log(instructions);
console.log(consoleCommands);

// Check if running in browser environment
if (typeof window !== "undefined") {
  console.log("🌐 Running in browser environment...");

  // Auto-clear if in browser
  const autoClear = async () => {
    try {
      // Unregister service workers
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log("✅ Unregistered service worker:", registration.scope);
      }

      // Clear caches
      if ("caches" in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          await caches.delete(cacheName);
          console.log("✅ Deleted cache:", cacheName);
        }
      }

      console.log("✅ Service worker and cache cleared successfully!");
      console.log("🔄 Reloading page...");

      // Reload after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("❌ Error clearing service worker:", error);
    }
  };

  // Run auto-clear
  autoClear();
} else {
  console.log("📝 This script is meant to be run in a browser environment.");
  console.log(
    "💡 Copy the console commands above and run them in your browser console.",
  );
}

// Export for use in other scripts (ESM)
export const clearServiceWorker = async () => {
  if (typeof window !== "undefined") {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }

    if ("caches" in window) {
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
      }
    }
  }
};
