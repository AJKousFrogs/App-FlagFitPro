// disable-sw.js - Service Worker Disabler for Development
// Prevents service worker cache conflicts in Claude Code/Cursor environment

console.log('🚫 Service Worker Disabler loaded');

if ('serviceWorker' in navigator) {
  console.log('🔍 Checking for existing service workers...');
  
  // Unregister all existing service workers
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    if (registrations.length === 0) {
      console.log('✅ No service workers found');
      return;
    }
    
    console.log(`🧹 Found ${registrations.length} service workers, unregistering...`);
    
    for(let registration of registrations) {
      registration.unregister().then(function(success) {
        if (success) {
          console.log('✅ Service worker unregistered:', registration.scope);
        } else {
          console.log('⚠️ Failed to unregister service worker:', registration.scope);
        }
      });
    }
  }).catch(function(error) {
    console.error('❌ Error checking service workers:', error);
  });
  
  // Prevent new service worker registrations
  const originalRegister = navigator.serviceWorker.register;
  navigator.serviceWorker.register = function() {
    console.log('🚫 Service worker registration blocked in development mode');
    return Promise.reject(new Error('Service worker registration disabled in development'));
  };
  
  // Clear any cached responses
  if ('caches' in window) {
    caches.keys().then(function(cacheNames) {
      if (cacheNames.length > 0) {
        console.log(`🧹 Found ${cacheNames.length} caches, clearing...`);
        cacheNames.forEach(function(cacheName) {
          caches.delete(cacheName).then(function(success) {
            if (success) {
              console.log('✅ Cache cleared:', cacheName);
            }
          });
        });
      } else {
        console.log('✅ No caches found');
      }
    });
  }
} else {
  console.log('ℹ️ Service workers not supported in this environment');
}