/**
 * Universal Mobile Navigation Component
 * Standardizes mobile navigation behavior across all 26 pages
 */

class UniversalMobileNav {
  constructor() {
    this.sidebar = null;
    this.toggle = null;
    this.overlay = null;
    this.isOpen = false;
    this.init();
  }

  init() {
    // Skip initialization on auth pages (login, register, reset-password)
    const currentPath = window.location.pathname.toLowerCase();
    const authPages = ["/login", "/register", "/reset-password"];
    const isAuthPage = authPages.some(
      (page) =>
        currentPath.includes(page) || currentPath.endsWith(page + ".html"),
    );

    if (isAuthPage) {
      // Auth pages don't have sidebars, so skip initialization silently
      return;
    }

    // Find elements (they might have different IDs across pages)
    this.sidebar =
      document.getElementById("sidebar") || document.querySelector(".sidebar");
    this.toggle =
      document.getElementById("mobile-menu-toggle") ||
      document.querySelector(".mobile-menu-toggle");
    this.overlay =
      document.getElementById("sidebar-overlay") ||
      document.querySelector(".sidebar-overlay, .menu-scrim");

    // Only warn and create fallback if we're on a page that should have navigation
    // Pages without sidebars (like some standalone pages) shouldn't trigger warnings
    const hasAnyNav = document.querySelector(
      'nav, .sidebar, .navigation, [role="navigation"]',
    );

    if (!this.sidebar || !this.toggle) {
      // Only warn if there's some navigation element present (meaning we should have mobile nav)
      if (hasAnyNav) {
        // Suppress warning in development to reduce console noise
        const isDevelopment =
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1";
        if (!isDevelopment) {
          console.warn("Mobile nav elements not found - creating fallback");
        }
      }
      this.createFallbackElements();
    }

    this.setupEventListeners();
    this.setupKeyboardNavigation();
    this.setupAccessibility();
  }

  createFallbackElements() {
    // Create mobile toggle if missing
    if (!this.toggle && this.sidebar) {
      const header = document.querySelector(".top-bar, .header-left");
      if (header) {
        this.toggle = document.createElement("button");
        this.toggle.id = "mobile-menu-toggle";
        this.toggle.className = "mobile-menu-toggle";
        this.toggle.setAttribute("type", "button");
        this.toggle.setAttribute("aria-label", "Toggle navigation menu");
        this.toggle.setAttribute("aria-expanded", "false");
        this.toggle.setAttribute("aria-controls", "sidebar");
        this.toggle.innerHTML = '<i data-lucide="menu" class="icon-20"></i>';
        header.insertBefore(this.toggle, header.firstChild);
      }
    }

    // Create overlay if missing
    if (!this.overlay) {
      this.overlay = document.createElement("div");
      this.overlay.className = "sidebar-overlay";
      this.overlay.setAttribute("aria-hidden", "true");
      document.body.appendChild(this.overlay);
    }
  }

  setupEventListeners() {
    if (this.toggle) {
      this.toggle.addEventListener("click", (e) => {
        e.preventDefault();
        this.toggleSidebar();
      });
    }

    if (this.overlay) {
      this.overlay.addEventListener("click", () => {
        this.closeSidebar();
      });
    }

    // Close on window resize to large screens
    window.addEventListener("resize", () => {
      if (window.innerWidth >= 1024 && this.isOpen) {
        this.closeSidebar();
      }
    });

    // Handle touch gestures for swipe to close
    this.setupSwipeGestures();
  }

  setupSwipeGestures() {
    if (!this.sidebar) return;

    let startX = null;
    let startY = null;

    this.sidebar.addEventListener(
      "touchstart",
      (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      },
      { passive: true },
    );

    this.sidebar.addEventListener(
      "touchend",
      (e) => {
        if (!startX || !startY) return;

        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const diffX = startX - endX;
        const diffY = startY - endY;

        // Check if it's a horizontal swipe (more horizontal than vertical)
        if (Math.abs(diffX) > Math.abs(diffY)) {
          // Swipe left to close (diffX > 0)
          if (diffX > 50 && this.isOpen) {
            this.closeSidebar();
          }
        }

        startX = null;
        startY = null;
      },
      { passive: true },
    );
  }

  setupKeyboardNavigation() {
    document.addEventListener("keydown", (e) => {
      // Close sidebar on Escape
      if (e.key === "Escape" && this.isOpen) {
        this.closeSidebar();
        this.toggle?.focus();
      }

      // Toggle on Ctrl+M
      if (e.ctrlKey && e.key === "m") {
        e.preventDefault();
        this.toggleSidebar();
      }
    });
  }

  setupAccessibility() {
    if (!this.sidebar) return;

    // Ensure sidebar has proper ARIA attributes
    this.sidebar.setAttribute("role", "navigation");
    this.sidebar.setAttribute("aria-label", "Main navigation");

    // Set up focus trapping when open
    this.setupFocusTrap();
  }

  setupFocusTrap() {
    if (!this.sidebar) return;

    const focusableElements = this.sidebar.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    if (focusableElements.length === 0) return;

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    this.sidebar.addEventListener("keydown", (e) => {
      if (!this.isOpen) return;

      if (e.key === "Tab") {
        if (e.shiftKey) {
          // Shift+Tab: going backwards
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          }
        } else {
          // Tab: going forwards
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      }
    });
  }

  toggleSidebar() {
    if (this.isOpen) {
      this.closeSidebar();
    } else {
      this.openSidebar();
    }
  }

  openSidebar() {
    if (!this.sidebar) return;

    this.isOpen = true;
    this.sidebar.classList.add("is-open");
    this.overlay?.classList.add("is-visible");

    // Update ARIA states
    this.toggle?.setAttribute("aria-expanded", "true");
    this.overlay?.setAttribute("aria-hidden", "false");

    // Prevent body scroll
    document.body.style.overflow = "hidden";

    // Focus first navigation item
    const firstNavItem = this.sidebar.querySelector(".nav-item, a");
    firstNavItem?.focus();

    // Announce to screen readers
    this.announceToScreenReader("Navigation menu opened");
  }

  closeSidebar() {
    if (!this.sidebar) return;

    this.isOpen = false;
    this.sidebar.classList.remove("is-open");
    this.overlay?.classList.remove("is-visible");

    // Update ARIA states
    this.toggle?.setAttribute("aria-expanded", "false");
    this.overlay?.setAttribute("aria-hidden", "true");

    // Restore body scroll
    document.body.style.overflow = "";

    // Announce to screen readers
    this.announceToScreenReader("Navigation menu closed");
  }

  announceToScreenReader(message) {
    const announcement = document.createElement("div");
    announcement.setAttribute("aria-live", "polite");
    announcement.setAttribute("aria-atomic", "true");
    announcement.className = "sr-only";
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  // Public method to update active navigation state
  updateActiveNavigation(currentPath) {
    if (!this.sidebar) return;

    const navItems = this.sidebar.querySelectorAll(".nav-item");
    navItems.forEach((item) => {
      const href = item.getAttribute("href");
      if (
        href &&
        (href === currentPath || window.location.pathname.endsWith(href))
      ) {
        item.classList.add("active");
        item.setAttribute("aria-current", "page");
      } else {
        item.classList.remove("active");
        item.removeAttribute("aria-current");
      }
    });
  }
}

// Auto-initialize on page load (skip auth pages)
document.addEventListener("DOMContentLoaded", () => {
  const currentPath = window.location.pathname.toLowerCase();
  const authPages = ["/login", "/register", "/reset-password"];
  const isAuthPage = authPages.some(
    (page) =>
      currentPath.includes(page) || currentPath.endsWith(page + ".html"),
  );

  if (!isAuthPage) {
    window.universalMobileNav = new UniversalMobileNav();

    // Set active navigation based on current page
    window.universalMobileNav.updateActiveNavigation(currentPath);
  }
});

// Export for module usage
export { UniversalMobileNav };
