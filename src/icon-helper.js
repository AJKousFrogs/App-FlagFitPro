/**
 * Icon Helper - FlagFit Pro
 * Initializes Lucide icons throughout the application
 * Note: This file intentionally intercepts console.error to suppress Lucide icon errors
 * This is acceptable as it's a special case for error suppression, not logging
 */
/* eslint-disable no-console -- Intentionally intercepts console.error to suppress Lucide icon errors */

(function () {
  "use strict";

  // Suppress Lucide icon not found errors to prevent console spam
  // These errors occur when invalid icon names are used
  const originalError = console.error;
  let isSuppressingIconErrors = false;

  const suppressIconErrors = function (...args) {
    // Only suppress if we're in an icon initialization context
    if (!isSuppressingIconErrors) {
      return originalError.apply(console, args);
    }

    // Check all arguments for the error message pattern
    const errorText = args
      .map((arg) => {
        if (typeof arg === "string") {
          return arg;
        }
        if (arg && arg.toString) {
          return arg.toString();
        }
        return "";
      })
      .join(" ");

    // Suppress Lucide icon not found errors
    if (
      errorText.includes("icon name was not found") ||
      errorText.includes("was not found in the provided icons object")
    ) {
      return; // Suppress this specific error
    }

    // Pass through all other errors normally
    originalError.apply(console, args);
  };

  /**
   * Initialize Lucide icons with error handling
   */
  function initializeIcons() {
    // Wait for Lucide to be available
    if (typeof lucide !== "undefined") {
      // Temporarily suppress icon errors during initialization
      isSuppressingIconErrors = true;
      console.error = suppressIconErrors;
      try {
        lucide.createIcons();
      } finally {
        // Restore original console.error immediately
        console.error = originalError;
        // Use a small delay to catch any async errors from Lucide
        setTimeout(function () {
          isSuppressingIconErrors = false;
        }, 50);
      }
    } else {
      // If Lucide isn't loaded yet, wait for it
      const checkLucide = setInterval(function () {
        if (typeof lucide !== "undefined") {
          // Temporarily suppress icon errors during initialization
          isSuppressingIconErrors = true;
          console.error = suppressIconErrors;
          try {
            lucide.createIcons();
          } finally {
            console.error = originalError;
            setTimeout(function () {
              isSuppressingIconErrors = false;
            }, 50);
          }
          clearInterval(checkLucide);
        }
      }, 100);

      // Clear interval after 5 seconds to prevent infinite checking
      setTimeout(function () {
        clearInterval(checkLucide);
      }, 5000);
    }
  }

  /**
   * Re-initialize icons for dynamically added content
   */
  function reinitializeIcons() {
    if (typeof lucide !== "undefined") {
      // Temporarily suppress icon errors during reinitialization
      isSuppressingIconErrors = true;
      console.error = suppressIconErrors;
      try {
        lucide.createIcons();
      } finally {
        console.error = originalError;
        setTimeout(function () {
          isSuppressingIconErrors = false;
        }, 50);
      }
    }
  }

  // Initialize on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeIcons);
  } else {
    // DOM is already ready
    initializeIcons();
  }

  // Re-initialize icons when new content is added (for SPAs or dynamic content)
  // Use MutationObserver to watch for new icon elements (throttled to prevent performance issues)
  if (typeof MutationObserver !== "undefined") {
    let reinitTimeout;
    let isReinitializing = false;

    const observer = new MutationObserver(function (mutations) {
      // Throttle reinitialization to prevent excessive calls
      if (isReinitializing) {
        return;
      }

      let shouldReinit = false;
      mutations.forEach(function (mutation) {
        if (mutation.addedNodes.length) {
          mutation.addedNodes.forEach(function (node) {
            if (node.nodeType === 1) {
              // Element node
              if (node.hasAttribute && node.hasAttribute("data-lucide")) {
                shouldReinit = true;
              } else if (
                node.querySelector &&
                node.querySelector("[data-lucide]")
              ) {
                shouldReinit = true;
              }
            }
          });
        }
      });

      if (shouldReinit) {
        // Clear existing timeout
        if (reinitTimeout) {
          clearTimeout(reinitTimeout);
        }

        // Debounce reinitialization
        reinitTimeout = setTimeout(function () {
          isReinitializing = true;
          reinitializeIcons();
          // Reset flag after a short delay
          setTimeout(function () {
            isReinitializing = false;
          }, 100);
        }, 150); // Wait 150ms before reinitializing
      }
    });

    // Start observing only after DOM is ready
    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    } else {
      // Wait for body to be available
      document.addEventListener("DOMContentLoaded", function () {
        if (document.body) {
          observer.observe(document.body, {
            childList: true,
            subtree: true,
          });
        }
      });
    }
  }

  // Export for manual re-initialization if needed
  window.reinitializeIcons = reinitializeIcons;
})();
