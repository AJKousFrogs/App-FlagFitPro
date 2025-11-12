/**
 * Navigation Highlight Script
 * Auto-highlights the active navigation item based on current page
 * Include this script in all HTML pages with navigation
 */

(function () {
  // Wait for DOM to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNavHighlight);
  } else {
    initNavHighlight();
  }

  function initNavHighlight() {
    const currentPage =
      window.location.pathname.split("/").pop() || "dashboard.html";
    const navMap = {
      "dashboard.html": "nav-dashboard",
      "analytics.html": "nav-analytics",
      "roster.html": "nav-roster",
      "training.html": "nav-training",
      "tournaments.html": "nav-tournaments",
      "community.html": "nav-community",
      "chat.html": "nav-chat",
      "settings.html": "nav-settings",
      "profile.html": "nav-profile",
      "training-schedule.html": "nav-training",
      "qb-training-schedule.html": "nav-training",
      "exercise-library.html": "nav-training",
    };

    const activeNavId = navMap[currentPage];
    if (activeNavId) {
      // Remove active from all nav items
      document.querySelectorAll(".nav-item").forEach((item) => {
        item.classList.remove("active");
      });

      // Add active to current page
      const activeNav = document.getElementById(activeNavId);
      if (activeNav) {
        activeNav.classList.add("active");
      }
    }
  }
})();
