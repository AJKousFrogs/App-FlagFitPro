/**
 * Enhanced Top Bar Component
 * Handles keyboard shortcuts, enhanced search, notifications, and user menu
 */

import { logger } from "../../logger.js";

class EnhancedTopBar {
  constructor() {
    this.searchInput = null;
    this.searchResults = null;
    this.searchClear = null;
    this.notificationButton = null;
    this.userMenuButton = null;
    this.userMenu = null;
    this.themeToggle = null;
    this.scrollToTop = null;
    this.init();
  }

  init() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    this.findElements();
    this.setupSearch();
    this.setupNotifications();
    this.setupUserMenu();
    this.setupThemeToggle();
    this.setupKeyboardShortcuts();
    this.setupScrollToTop();
    this.setupScrollEffects();
    this.loadUserInfo();
  }

  findElements() {
    this.searchInput = document.getElementById("global-search");
    this.searchResults = document.getElementById("search-results");
    this.searchClear = document.getElementById("search-clear");
    this.notificationButton = document.getElementById("notification-bell");
    this.userMenuButton = document.getElementById("user-menu-button");
    this.userMenu = document.getElementById("user-menu");
    this.themeToggle = document.getElementById("header-theme-toggle-button");
    this.scrollToTop = document.getElementById("scroll-to-top");
  }

  setupSearch() {
    if (!this.searchInput) {
      return;
    }

    // Clear button functionality
    if (this.searchClear) {
      this.searchClear.addEventListener("click", () => {
        this.searchInput.value = "";
        this.searchInput.focus();
        this.hideSearchResults();
        this.updateSearchClearVisibility();
      });
    }

    // Show/hide clear button based on input
    this.searchInput.addEventListener("input", () => {
      this.updateSearchClearVisibility();
    });

    // Keyboard navigation in search results
    this.searchInput.addEventListener("keydown", (e) => {
      this.handleSearchKeyboard(e);
    });

    // Close search results when clicking outside
    document.addEventListener("click", (e) => {
      if (
        !this.searchInput?.contains(e.target) &&
        !this.searchResults?.contains(e.target)
      ) {
        this.hideSearchResults();
      }
    });

    // Close button in search results
    const closeButton = this.searchResults?.querySelector(
      ".search-results-close",
    );
    if (closeButton) {
      closeButton.addEventListener("click", () => {
        this.hideSearchResults();
        this.searchInput?.focus();
      });
    }
  }

  updateSearchClearVisibility() {
    if (this.searchClear && this.searchInput) {
      if (this.searchInput.value.trim()) {
        this.searchClear.removeAttribute("hidden");
      } else {
        this.searchClear.setAttribute("hidden", "");
      }
    }
  }

  hideSearchResults() {
    if (this.searchResults) {
      this.searchResults.setAttribute("hidden", "");
      this.searchInput?.setAttribute("aria-expanded", "false");
    }
  }

  showSearchResults() {
    if (this.searchResults) {
      this.searchResults.removeAttribute("hidden");
      this.searchInput?.setAttribute("aria-expanded", "true");
    }
  }

  handleSearchKeyboard(e) {
    if (!this.searchResults || this.searchResults.hasAttribute("hidden")) {
      return;
    }

    const results = Array.from(
      this.searchResults.querySelectorAll('.result-item, [role="option"]'),
    );
    const currentIndex = results.indexOf(document.activeElement);

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        const nextIndex =
          currentIndex < results.length - 1 ? currentIndex + 1 : 0;
        results[nextIndex]?.focus();
        break;
      case "ArrowUp":
        e.preventDefault();
        const prevIndex =
          currentIndex > 0 ? currentIndex - 1 : results.length - 1;
        results[prevIndex]?.focus();
        break;
      case "Escape":
        e.preventDefault();
        this.hideSearchResults();
        this.searchInput?.focus();
        break;
      case "Enter":
        if (document.activeElement.classList.contains("result-item")) {
          e.preventDefault();
          document.activeElement.click();
        }
        break;
    }
  }

  setupNotifications() {
    if (!this.notificationButton) {
      return;
    }

    this.notificationButton.addEventListener("click", () => {
      const isExpanded =
        this.notificationButton.getAttribute("aria-expanded") === "true";
      this.notificationButton.setAttribute(
        "aria-expanded",
        (!isExpanded).toString(),
      );

      // Toggle notification panel if it exists
      const panel = document.getElementById("notification-panel");
      if (panel) {
        panel.hidden = isExpanded;
      }
    });
  }

  setupUserMenu() {
    if (!this.userMenuButton || !this.userMenu) {
      return;
    }

    this.userMenuButton.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleUserMenu();
    });

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      if (
        !this.userMenuButton?.contains(e.target) &&
        !this.userMenu?.contains(e.target)
      ) {
        this.closeUserMenu();
      }
    });

    // Keyboard navigation in user menu
    const menuItems = Array.from(
      this.userMenu.querySelectorAll(".user-menu-item"),
    );

    this.userMenu.addEventListener("keydown", (e) => {
      if (this.userMenu.hasAttribute("hidden")) {
        return;
      }

      const currentIndex = menuItems.indexOf(document.activeElement);

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          const nextIndex =
            currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0;
          menuItems[nextIndex]?.focus();
          break;
        case "ArrowUp":
          e.preventDefault();
          const prevIndex =
            currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1;
          menuItems[prevIndex]?.focus();
          break;
        case "Escape":
          e.preventDefault();
          this.closeUserMenu();
          this.userMenuButton?.focus();
          break;
        case "Home":
          e.preventDefault();
          menuItems[0]?.focus();
          break;
        case "End":
          e.preventDefault();
          menuItems[menuItems.length - 1]?.focus();
          break;
      }
    });
  }

  toggleUserMenu() {
    const isOpen = this.userMenu.getAttribute("hidden") !== "true";
    this.userMenu.hidden = !isOpen;
    this.userMenuButton.setAttribute("aria-expanded", (!isOpen).toString());

    if (!isOpen) {
      // Focus first menu item
      const firstItem = this.userMenu.querySelector(".user-menu-item");
      firstItem?.focus();
    }
  }

  closeUserMenu() {
    if (this.userMenu) {
      this.userMenu.hidden = true;
      this.userMenuButton?.setAttribute("aria-expanded", "false");
    }
  }

  setupThemeToggle() {
    if (!this.themeToggle) {
      return;
    }

    this.themeToggle.addEventListener("click", () => {
      const currentTheme =
        document.documentElement.getAttribute("data-theme") || "light";
      const newTheme = currentTheme === "dark" ? "light" : "dark";

      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);

      // Dispatch theme change event
      document.dispatchEvent(
        new CustomEvent("themechange", {
          detail: { theme: newTheme },
        }),
      );
    });

    // Load saved theme
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      document.documentElement.setAttribute("data-theme", savedTheme);
    }
  }

  setupKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      // Ctrl+K or Cmd+K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        this.searchInput?.focus();
        this.searchInput?.select();
      }

      // Escape to close menus
      if (e.key === "Escape") {
        if (!this.userMenu?.hasAttribute("hidden")) {
          this.closeUserMenu();
        }
        if (!this.searchResults?.hasAttribute("hidden")) {
          this.hideSearchResults();
        }
      }
    });
  }

  setupScrollToTop() {
    if (!this.scrollToTop) {
      return;
    }

    // Show/hide scroll to top button
    window.addEventListener("scroll", () => {
      if (window.scrollY > 300) {
        this.scrollToTop.removeAttribute("hidden");
      } else {
        this.scrollToTop.setAttribute("hidden", "");
      }
    });

    // Scroll to top functionality
    this.scrollToTop.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  }

  setupScrollEffects() {
    const topBar = document.querySelector(".top-bar");
    if (!topBar) {
      return;
    }

    let lastScrollY = window.scrollY;

    window.addEventListener(
      "scroll",
      () => {
        const currentScrollY = window.scrollY;

        if (currentScrollY > 100) {
          topBar.classList.add("scrolled");
        } else {
          topBar.classList.remove("scrolled");
        }

        if (currentScrollY > 300) {
          topBar.classList.add("scrolled-deep");
        } else {
          topBar.classList.remove("scrolled-deep");
        }

        lastScrollY = currentScrollY;
      },
      { passive: true },
    );
  }

  loadUserInfo() {
    try {
      // Try to load from authManager
      if (window.authManager?.user) {
        const user = window.authManager.user;
        this.updateUserInfo(
          user.name || user.email?.split("@")[0] || "User",
          user.role || "Player",
          user.email || "",
        );
        return;
      }

      // Try to load from localStorage
      const userData = localStorage.getItem("userData");
      if (userData) {
        const user = JSON.parse(userData);
        this.updateUserInfo(
          user.name || "User",
          user.role || "Player",
          user.email || "",
        );
      }
    } catch (e) {
      logger.warn("Could not load user info:", e);
    }
  }

  updateUserInfo(name, role, email = "") {
    // Update user menu button
    const userNameEl = document.getElementById("user-menu-name");
    const userRoleEl = document.getElementById("user-menu-role");

    if (userNameEl) {
      userNameEl.textContent = name;
    }
    if (userRoleEl) {
      userRoleEl.textContent = role;
    }

    // Update user menu header
    const headerNameEl = document.getElementById("user-menu-header-name");
    const headerEmailEl = document.getElementById("user-menu-header-email");
    const headerInitialsEl = document.getElementById(
      "user-menu-header-initials",
    );

    if (headerNameEl) {
      headerNameEl.textContent = name;
    }
    if (headerEmailEl) {
      headerEmailEl.textContent = email;
    }
    if (headerInitialsEl) {
      headerInitialsEl.textContent = this.getInitials(name);
    }

    // Update avatar initials
    const avatarEl = document.getElementById("user-avatar");
    if (avatarEl) {
      const initialsEl = avatarEl.querySelector(".user-avatar-initials");
      if (initialsEl) {
        initialsEl.textContent = this.getInitials(name);
      } else {
        avatarEl.textContent = this.getInitials(name);
      }
    }
  }

  getInitials(name) {
    if (!name) {
      return "U";
    }
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  // Public method to update notification count
  updateNotificationCount(count) {
    const badge = document.getElementById("notification-badge");
    if (badge) {
      if (count > 0) {
        badge.textContent = count > 99 ? "99+" : count.toString();
        badge.removeAttribute("hidden");
      } else {
        badge.setAttribute("hidden", "");
      }
    }
  }
}

// Initialize enhanced top bar
let enhancedTopBar;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    enhancedTopBar = new EnhancedTopBar();
    window.enhancedTopBar = enhancedTopBar;
  });
} else {
  enhancedTopBar = new EnhancedTopBar();
  window.enhancedTopBar = enhancedTopBar;
}

// Export for module usage
export { EnhancedTopBar };
