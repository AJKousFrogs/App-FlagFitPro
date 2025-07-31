// dev-error-handler.js - Development Error Suppression
// Reduces noise from expected development errors

console.log('🔧 Development error handler loaded');

// Override console.error to filter out expected development errors
const originalConsoleError = console.error;
console.error = function(...args) {
  const message = args.join(' ').toLowerCase();
  
  // List of expected development errors to suppress
  const suppressedErrors = [
    'failed to fetch',
    'net::err_failed',
    'uncaught (in promise) typeerror: failed to fetch',
    'the fetched response did not pass the cors check',
    '@vite/client',
    'vite client',
    'hmr connection',
    'websocket connection'
  ];
  
  // Check if this error should be suppressed
  const shouldSuppress = suppressedErrors.some(pattern => 
    message.includes(pattern)
  );
  
  if (!shouldSuppress) {
    // Only show important errors
    originalConsoleError.apply(console, args);
  } else {
    // Log suppressed errors with debug level (if needed for debugging)
    // console.debug('Suppressed dev error:', ...args);
  }
};

// Handle unhandled promise rejections more gracefully in development
const originalUnhandledRejection = window.onunhandledrejection;
window.addEventListener('unhandledrejection', function(event) {
  const message = event.reason?.message?.toLowerCase() || '';
  
  // Suppress common development fetch failures
  if (message.includes('failed to fetch') || 
      message.includes('net::err_failed') ||
      message.includes('vite') ||
      message.includes('@vite')) {
    event.preventDefault(); // Prevent the error from showing in console
    return;
  }
  
  // Let other errors through
  if (originalUnhandledRejection) {
    originalUnhandledRejection.call(window, event);
  }
});

// Suppress network errors for missing resources in development
if ('fetch' in window) {
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    return originalFetch.apply(this, args).catch(error => {
      // Still throw the error, but don't let it bubble to console in some cases
      if (args[0] && typeof args[0] === 'string') {
        const url = args[0];
        if (url.includes('@vite') || url.includes('__vite') || url.includes('.vite')) {
          // Silently fail for Vite-specific resources
          return Promise.reject(error);
        }
      }
      throw error;
    });
  };
}

console.log('✅ Development error filtering active');