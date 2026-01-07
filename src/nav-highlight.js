/**
 * Navigation Highlight - FlagFit Pro
 * Automatically highlights the active navigation item based on current page
 */

(function () {
  "use strict";

  /**
   * Get the current page filename
   */
  function getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split("/").pop() || "index.html";
    return filename.toLowerCase();
  }

  /**
   * Map page filenames to navigation item IDs
   */
  const navMap = {
    "index.html": "nav-dashboard",
    "dashboard.html": "nav-dashboard",
    "analytics.html": "nav-analytics",
    "roster.html": "nav-roster",
    "training.html": "nav-training",
    "training-schedule.html": "nav-training",
    "tournaments.html": "nav-tournaments",
    "community.html": "nav-community",
    "chat.html": "nav-chat",
    "settings.html": "nav-settings",
    "profile.html": "nav-profile",
    "coach.html": "nav-coach",
    "coach-dashboard.html": "nav-coach",
    "exercise-library.html": "nav-training",
    "qb-training-schedule.html": "nav-training",
    "qb-throwing-tracker.html": "nav-training",
    "qb-assessment-tools.html": "nav-training",
    "workout.html": "nav-training",
  };

  /**
   * Highlight active navigation item
   */
  function highlightActiveNav() {
    const currentPage = getCurrentPage();
    const activeNavId = navMap[currentPage];

    if (!activeNavId) {
      return;
    }

    // Remove active class from all nav items
    const allNavItems = document.querySelectorAll(
      '.nav-item, .sidebar-link, [class*="nav-"]',
    );
    allNavItems.forEach(function (item) {
      item.classList.remove("active");
    });

    // Add active class to current nav item
    const activeNav = document.getElementById(activeNavId);
    if (activeNav) {
      activeNav.classList.add("active");

      // Also check parent elements (for nested navigation structures)
      let parent = activeNav.parentElement;
      while (parent && parent !== document.body) {
        if (
          parent.classList.contains("nav-item") ||
          parent.classList.contains("sidebar-link")
        ) {
          parent.classList.add("active");
        }
        parent = parent.parentElement;
      }
    }

    // Also check by href attribute as fallback
    if (!activeNav) {
      const navLinks = document.querySelectorAll(
        'a.nav-item, a.sidebar-link, a[href*="' + currentPage + '"]',
      );
      navLinks.forEach(function (link) {
        const href = link.getAttribute("href") || "";
        if (href.includes(currentPage) || href === "/" + currentPage) {
          link.classList.add("active");
        }
      });
    }
  }

  /**
   * Initialize navigation highlighting
   */
  function init() {
    // Wait for DOM to be ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", highlightActiveNav);
    } else {
      // DOM is already ready
      highlightActiveNav();
    }

    // Re-highlight on navigation (for SPAs)
    window.addEventListener("popstate", highlightActiveNav);
  }

  // Initialize
  init();

  // Export for manual re-highlighting if needed
  window.highlightActiveNav = highlightActiveNav;
})();
