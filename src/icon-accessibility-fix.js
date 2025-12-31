/**
 * Icon Accessibility Fix - FlagFit Pro
 * Applies accessibility fixes to Lucide icons
 * Run this after DOM and Lucide icons are loaded
 */

(function () {
  "use strict";

  /**
   * Fix decorative icons by adding aria-hidden
   */
  function fixDecorativeIcons() {
    // Find all Lucide icons
    const icons = document.querySelectorAll("[data-lucide]");

    icons.forEach((icon) => {
      // Skip if already has aria-label or aria-labelledby (meaningful icon)
      if (
        icon.hasAttribute("aria-label") ||
        icon.hasAttribute("aria-labelledby")
      ) {
        return;
      }

      const parent = icon.parentElement;
      const hasVisibleText =
        parent &&
        parent.textContent.trim().length > 0 &&
        parent.textContent.trim() !== icon.textContent.trim();

      // If icon is decorative (has visible text nearby), add aria-hidden
      if (
        hasVisibleText ||
        isDecorativeIconName(icon.getAttribute("data-lucide"))
      ) {
        icon.setAttribute("aria-hidden", "true");
      }
    });
  }

  /**
   * Check if icon name is typically decorative
   */
  function isDecorativeIconName(iconName) {
    if (!iconName) {
      return false;
    }

    const decorativeIcons = [
      "chevron-right",
      "chevron-left",
      "chevron-down",
      "chevron-up",
      "arrow-right",
      "arrow-left",
      "arrow-up",
      "arrow-down",
      "check",
      "x",
      "circle",
    ];
    return decorativeIcons.includes(iconName);
  }

  /**
   * Fix icon-only buttons by adding aria-labels
   */
  function fixIconOnlyButtons() {
    // Find buttons with only icons
    const buttons = document.querySelectorAll('button, a[role="button"]');

    buttons.forEach((button) => {
      const textContent = button.textContent.trim();
      const hasIcon = button.querySelector("[data-lucide]");

      // If button only has icon and no aria-label
      if (hasIcon && !textContent && !button.hasAttribute("aria-label")) {
        const icon = button.querySelector("[data-lucide]");
        const iconName = icon.getAttribute("data-lucide");
        const label = getIconLabel(iconName);

        if (label) {
          button.setAttribute("aria-label", label);
          icon.setAttribute("aria-hidden", "true");
        }
      }
    });
  }

  /**
   * Get accessible label for icon name
   */
  function getIconLabel(iconName) {
    if (!iconName) {
      return null;
    }

    const iconLabels = {
      settings: "Settings",
      user: "User menu",
      bell: "Notifications",
      search: "Search",
      menu: "Toggle navigation",
      x: "Close",
      "trash-2": "Delete",
      edit: "Edit",
      plus: "Add",
      home: "Go to dashboard",
      "log-out": "Logout",
      "log-in": "Login",
      lock: "Sign in",
      activity: "Activity",
      "layout-dashboard": "Dashboard",
      "bar-chart-3": "Analytics",
      target: "Performance",
      users: "Users",
      zap: "Training",
      trophy: "Tournaments",
      "message-circle": "Community",
      "message-square": "Chat",
    };

    return iconLabels[iconName] || null;
  }

  /**
   * Apply all icon accessibility fixes
   */
  function applyIconAccessibilityFixes() {
    fixDecorativeIcons();
    fixIconOnlyButtons();
  }

  /**
   * Initialize when DOM is ready
   */
  function initialize() {
    // Wait for DOM to be ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        // Wait a bit for Lucide icons to be initialized
        setTimeout(applyIconAccessibilityFixes, 200);
      });
    } else {
      // DOM is already ready
      setTimeout(applyIconAccessibilityFixes, 200);
    }

    // Re-run after Lucide icons are created (for dynamically added icons)
    if (typeof lucide !== "undefined") {
      const originalCreateIcons = lucide.createIcons;
      lucide.createIcons = function (...args) {
        const result = originalCreateIcons.apply(this, args);
        setTimeout(applyIconAccessibilityFixes, 100);
        return result;
      };
    } else {
      // Wait for Lucide to be available
      const checkLucide = setInterval(() => {
        if (typeof lucide !== "undefined") {
          const originalCreateIcons = lucide.createIcons;
          lucide.createIcons = function (...args) {
            const result = originalCreateIcons.apply(this, args);
            setTimeout(applyIconAccessibilityFixes, 100);
            return result;
          };
          clearInterval(checkLucide);
        }
      }, 100);

      // Clear interval after 5 seconds to prevent infinite checking
      setTimeout(() => {
        clearInterval(checkLucide);
      }, 5000);
    }
  }

  // Start initialization
  initialize();

  // Export for manual re-initialization if needed
  window.applyIconAccessibilityFixes = applyIconAccessibilityFixes;
})();
