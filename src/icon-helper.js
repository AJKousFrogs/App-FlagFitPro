/**
 * Icon Helper - FlagFit Pro
 * Initializes Lucide icons throughout the application
 */

(function() {
  'use strict';

  /**
   * Initialize Lucide icons
   */
  function initializeIcons() {
    // Wait for Lucide to be available
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    } else {
      // If Lucide isn't loaded yet, wait for it
      const checkLucide = setInterval(function() {
        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
          clearInterval(checkLucide);
        }
      }, 100);

      // Clear interval after 5 seconds to prevent infinite checking
      setTimeout(function() {
        clearInterval(checkLucide);
      }, 5000);
    }
  }

  /**
   * Re-initialize icons for dynamically added content
   */
  function reinitializeIcons() {
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeIcons);
  } else {
    // DOM is already ready
    initializeIcons();
  }

  // Re-initialize icons when new content is added (for SPAs or dynamic content)
  // Use MutationObserver to watch for new icon elements
  if (typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(function(mutations) {
      let shouldReinit = false;
      mutations.forEach(function(mutation) {
        if (mutation.addedNodes.length) {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeType === 1) { // Element node
              if (node.hasAttribute && node.hasAttribute('data-lucide')) {
                shouldReinit = true;
              } else if (node.querySelector && node.querySelector('[data-lucide]')) {
                shouldReinit = true;
              }
            }
          });
        }
      });
      if (shouldReinit) {
        reinitializeIcons();
      }
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Export for manual re-initialization if needed
  window.reinitializeIcons = reinitializeIcons;
})();

