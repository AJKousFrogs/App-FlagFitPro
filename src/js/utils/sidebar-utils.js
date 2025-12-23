/**
 * Shared Sidebar Utilities
 * Provides toggleSidebar and closeMenu functions for pages without page-specific JS
 * This ensures consistent sidebar behavior across all pages
 */

(function () {
  "use strict";

  // Only define if not already defined (allow page-specific overrides)
  if (typeof window.toggleSidebar === "undefined") {
    window.toggleSidebar = function () {
      // Use the universal mobile nav instance if available
      if (window.universalMobileNav) {
        window.universalMobileNav.toggleSidebar();
      } else if (window.FlagFitApp?.components?.mobileNav) {
        window.FlagFitApp.components.mobileNav.toggleSidebar();
      } else {
        // Fallback implementation
        const sidebar = document.getElementById("sidebar");
        const overlay = document.querySelector(".menu-scrim");
        const toggle = document.getElementById("mobile-menu-toggle");
        
        if (sidebar) {
          const isOpen = sidebar.classList.contains("is-open");
          if (isOpen) {
            sidebar.classList.remove("is-open");
            overlay?.classList.remove("is-visible");
            toggle?.setAttribute("aria-expanded", "false");
            document.body.style.overflow = "";
          } else {
            sidebar.classList.add("is-open");
            overlay?.classList.add("is-visible");
            toggle?.setAttribute("aria-expanded", "true");
            document.body.style.overflow = "hidden";
          }
        }
      }
    };
  }

  if (typeof window.closeMenu === "undefined") {
    window.closeMenu = function () {
      // Use the universal mobile nav instance if available
      if (window.universalMobileNav) {
        window.universalMobileNav.closeSidebar();
      } else if (window.FlagFitApp?.components?.mobileNav) {
        window.FlagFitApp.components.mobileNav.closeSidebar();
      } else {
        // Fallback implementation
        const sidebar = document.getElementById("sidebar");
        const overlay = document.querySelector(".menu-scrim");
        const toggle = document.getElementById("mobile-menu-toggle");
        
        if (sidebar) {
          sidebar.classList.remove("is-open");
          overlay?.classList.remove("is-visible");
          toggle?.setAttribute("aria-expanded", "false");
          document.body.style.overflow = "";
        }
      }
    };
  }
})();

