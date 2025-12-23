/* Interactive Filters JavaScript for FlagFit Pro Wireframes */

// ========================================
// GLOBAL FILTER MANAGEMENT
// ========================================

class FilterManager {
  constructor() {
    this.activeFilters = new Map();
    this.init();
  }

  init() {
    this.setupFilterButtons();
    this.setupOverlayTriggers();
    this.setupKeyboardNavigation();
    this.setupAccessibility();
  }

  // ========================================
  // FILTER BUTTON SETUP
  // ========================================

  setupFilterButtons() {
    // Get all filter button types
    const filterSelectors = [
      ".filter-btn",
      ".film-filter-btn",
      ".channel-tab-btn",
      ".tab-btn",
      ".bracket-tab-btn",
      ".schedule-filter-btn",
      ".search-filter",
      ".notification-tab",
    ];

    filterSelectors.forEach((selector) => {
      const buttons = document.querySelectorAll(selector);
      buttons.forEach((button) => {
        this.setupFilterButton(button);
      });
    });
  }

  setupFilterButton(button) {
    // Add click handler
    button.addEventListener("click", (e) => {
      e.preventDefault();
      this.handleFilterClick(button);
    });

    // Add keyboard support
    button.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.handleFilterClick(button);
      }
    });

    // Add ARIA attributes
    this.setupAccessibilityAttributes(button);
  }

  handleFilterClick(button) {
    const container = this.findFilterContainer(button);
    if (!container) return;

    // Remove active class from all buttons in the same container
    const allButtons = container.querySelectorAll(
      button.className
        .split(" ")
        .map((c) => "." + c)
        .join(","),
    );
    allButtons.forEach((btn) => {
      btn.classList.remove("active");
      btn.setAttribute("aria-pressed", "false");
    });

    // Add active class to clicked button
    button.classList.add("active");
    button.setAttribute("aria-pressed", "true");

    // Store active filter
    const filterGroup = this.getFilterGroup(container);
    this.activeFilters.set(filterGroup, button.textContent.trim());

    // Handle specific filter logic
    this.handleFilterLogic(button, container);

    // Announce to screen readers
    this.announceFilterChange(button);

    // Trigger content update
    this.updateContent(button, container);
  }

  findFilterContainer(button) {
    // Look for common container patterns
    const containers = [
      button.closest(".feed-filters"),
      button.closest(".film-filters"),
      button.closest(".channels-tabs"),
      button.closest(".leaderboard-tabs"),
      button.closest(".search-filters"),
      button.closest(".notification-tabs"),
      button.closest(".bracket-tabs"),
      button.closest(".schedule-filters"),
    ];

    return containers.find((container) => container !== null);
  }

  getFilterGroup(container) {
    // Generate a unique identifier for the filter group
    if (container.classList.contains("feed-filters")) return "feed";
    if (container.classList.contains("film-filters")) return "film";
    if (container.classList.contains("channels-tabs")) return "channels";
    if (container.classList.contains("leaderboard-tabs")) return "leaderboard";
    if (container.classList.contains("search-filters")) return "search";
    if (container.classList.contains("notification-tabs"))
      return "notifications";
    if (container.classList.contains("bracket-tabs")) return "bracket";
    if (container.classList.contains("schedule-filters")) return "schedule";

    return container.className || "unknown";
  }

  // ========================================
  // FILTER LOGIC HANDLERS
  // ========================================

  handleFilterLogic(button, container) {
    const filterType = this.getFilterGroup(container);
    const filterValue = button.textContent.trim();

    switch (filterType) {
      case "film":
        this.handleFilmFilter(filterValue);
        break;
      case "channels":
        this.handleChannelFilter(filterValue);
        break;
      case "feed":
        this.handleFeedFilter(filterValue);
        break;
      case "leaderboard":
        this.handleLeaderboardFilter(filterValue);
        break;
      case "search":
        this.handleSearchFilter(filterValue);
        break;
      case "notifications":
        this.handleNotificationFilter(filterValue);
        break;
      case "bracket":
        this.handleBracketFilter(filterValue);
        break;
      case "schedule":
        this.handleScheduleFilter(filterValue);
        break;
    }
  }

  handleFilmFilter(filterValue) {
    const filmGrid = document.querySelector(".film-grid");
    if (!filmGrid) return;

    // Simulate loading state
    this.showLoadingState(filmGrid);

    // Simulate content filtering
    setTimeout(() => {
      this.updateFilmContent(filterValue, filmGrid);
      this.hideLoadingState(filmGrid);
    }, 500);
  }

  handleChannelFilter(filterValue) {
    const messageList = document.querySelector(".message-list");
    if (!messageList) return;

    // Update channel messages based on filter
    this.updateChannelMessages(filterValue, messageList);
  }

  handleFeedFilter(filterValue) {
    const feedPosts = document.querySelector(".feed-posts");
    if (!feedPosts) return;

    // Update feed content based on filter
    this.updateFeedContent(filterValue, feedPosts);
  }

  handleLeaderboardFilter(filterValue) {
    const leaderboardList = document.querySelector(".leaderboard-list");
    if (!leaderboardList) return;

    // Update leaderboard based on filter
    this.updateLeaderboard(filterValue, leaderboardList);
  }

  handleSearchFilter(filterValue) {
    const searchResults = document.querySelector(".search-results");
    if (!searchResults) return;

    // Update search results based on filter
    this.updateSearchResults(filterValue, searchResults);
  }

  handleNotificationFilter(filterValue) {
    const notificationList = document.querySelector(".notification-list");
    if (!notificationList) return;

    // Update notifications based on filter
    this.updateNotifications(filterValue, notificationList);
  }

  handleBracketFilter(filterValue) {
    const bracketContainer = document.querySelector(".bracket-container");
    if (!bracketContainer) return;

    // Update bracket view based on filter
    this.updateBracketView(filterValue, bracketContainer);
  }

  handleScheduleFilter(filterValue) {
    const scheduleContainer = document.querySelector(".schedule-container");
    if (!scheduleContainer) return;

    // Update schedule based on filter
    this.updateSchedule(filterValue, scheduleContainer);
  }

  // ========================================
  // CONTENT UPDATE METHODS
  // ========================================

  updateContent(button, container) {
    // Generic content update method
    const contentArea = this.findContentArea(container);
    if (!contentArea) return;

    // Add loading state
    this.showLoadingState(contentArea);

    // Simulate content update
    setTimeout(() => {
      this.hideLoadingState(contentArea);
      this.announceContentUpdate(button);
    }, 300);
  }

  findContentArea(container) {
    // Look for content areas near the filter container
    const contentSelectors = [
      ".film-grid",
      ".message-list",
      ".feed-posts",
      ".leaderboard-list",
      ".search-results",
      ".notification-list",
      ".bracket-container",
      ".schedule-container",
    ];

    for (let selector of contentSelectors) {
      const content = container.closest(".container")?.querySelector(selector);
      if (content) return content;
    }

    return null;
  }

  showLoadingState(element) {
    element.classList.add("loading");
    element.setAttribute("aria-busy", "true");
  }

  hideLoadingState(element) {
    element.classList.remove("loading");
    element.setAttribute("aria-busy", "false");
  }

  // ========================================
  // OVERLAY MANAGEMENT
  // ========================================

  setupOverlayTriggers() {
    // Search overlay
    const searchTrigger = document.querySelector(".nav-search");
    if (searchTrigger) {
      searchTrigger.addEventListener("click", () => this.openSearchOverlay());
    }

    // Notification overlay
    const notificationTrigger = document.querySelector(".nav-notifications");
    if (notificationTrigger) {
      notificationTrigger.addEventListener("click", () =>
        this.openNotificationOverlay(),
      );
    }

    // Close buttons
    document.querySelectorAll(".action-btn").forEach((btn) => {
      if (btn.textContent.toLowerCase().includes("close")) {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          this.closeOverlay(
            btn.closest(".search-overlay, .notification-overlay"),
          );
        });
      }
    });

    // Close on overlay background click
    document
      .querySelectorAll(".search-overlay, .notification-overlay")
      .forEach((overlay) => {
        overlay.addEventListener("click", (e) => {
          if (e.target === overlay) {
            this.closeOverlay(overlay);
          }
        });
      });
  }

  openSearchOverlay() {
    const overlay = document.querySelector(".search-overlay");
    if (overlay) {
      overlay.classList.add("active");
      overlay.setAttribute("aria-hidden", "false");

      // Focus search input
      const searchInput = overlay.querySelector(".search-input");
      if (searchInput) {
        setTimeout(() => searchInput.focus(), 100);
      }
    }
  }

  openNotificationOverlay() {
    const overlay = document.querySelector(".notification-overlay");
    if (overlay) {
      overlay.classList.add("active");
      overlay.setAttribute("aria-hidden", "false");
    }
  }

  closeOverlay(overlay) {
    if (overlay) {
      overlay.classList.remove("active");
      overlay.setAttribute("aria-hidden", "true");
    }
  }

  // ========================================
  // KEYBOARD NAVIGATION
  // ========================================

  setupKeyboardNavigation() {
    document.addEventListener("keydown", (e) => {
      // Escape key closes overlays
      if (e.key === "Escape") {
        const activeOverlay = document.querySelector(
          ".search-overlay.active, .notification-overlay.active",
        );
        if (activeOverlay) {
          this.closeOverlay(activeOverlay);
        }
      }

      // Ctrl/Cmd + K opens search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        this.openSearchOverlay();
      }
    });
  }

  // ========================================
  // ACCESSIBILITY
  // ========================================

  setupAccessibility() {
    // Add ARIA live regions for announcements
    this.createAriaLiveRegion();

    // Add skip links
    this.createSkipLinks();
  }

  setupAccessibilityAttributes(button) {
    // Add ARIA attributes
    button.setAttribute("role", "button");
    button.setAttribute("tabindex", "0");
    button.setAttribute(
      "aria-pressed",
      button.classList.contains("active") ? "true" : "false",
    );

    // Add descriptive labels
    const container = this.findFilterContainer(button);
    const filterGroup = this.getFilterGroup(container);
    button.setAttribute(
      "aria-label",
      `Filter by ${button.textContent.trim()} in ${filterGroup}`,
    );
  }

  createAriaLiveRegion() {
    let liveRegion = document.getElementById("aria-live-region");
    if (!liveRegion) {
      liveRegion = document.createElement("div");
      liveRegion.id = "aria-live-region";
      liveRegion.setAttribute("aria-live", "polite");
      liveRegion.setAttribute("aria-atomic", "true");
      liveRegion.style.position = "absolute";
      liveRegion.style.left = "-10000px";
      liveRegion.style.width = "1px";
      liveRegion.style.height = "1px";
      liveRegion.style.overflow = "hidden";
      document.body.appendChild(liveRegion);
    }
  }

  createSkipLinks() {
    let skipLinks = document.querySelector(".skip-links");
    if (!skipLinks) {
      skipLinks = document.createElement("div");
      skipLinks.className = "skip-links";
      skipLinks.innerHTML = `
                <a href="#main-content" class="skip-link">Skip to main content</a>
                <a href="#navigation" class="skip-link">Skip to navigation</a>
            `;
      document.body.insertBefore(skipLinks, document.body.firstChild);
    }
  }

  announceFilterChange(button) {
    const liveRegion = document.getElementById("aria-live-region");
    if (liveRegion) {
      liveRegion.textContent = `Filter changed to ${button.textContent.trim()}`;
    }
  }

  announceContentUpdate(button) {
    const liveRegion = document.getElementById("aria-live-region");
    if (liveRegion) {
      liveRegion.textContent = `Content updated for ${button.textContent.trim()} filter`;
    }
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // ========================================
  // CONTENT UPDATE SIMULATIONS
  // ========================================

  updateFilmContent(filterValue, container) {
    // Simulate different content for different filters
    const placeholder =
      container.querySelector(".film-placeholder") ||
      container.querySelector(".film-card");
    if (placeholder) {
      placeholder.style.opacity = "0.8";
      setTimeout(() => {
        placeholder.style.opacity = "1";
      }, 200);
    }
  }

  updateChannelMessages(filterValue, container) {
    // Simulate channel message filtering
    const messages = container.querySelectorAll(".message-item");
    messages.forEach((msg, index) => {
      msg.style.opacity = "0.6";
      setTimeout(() => {
        msg.style.opacity = "1";
      }, index * 100);
    });
  }

  updateFeedContent(filterValue, container) {
    // Simulate feed content filtering
    const posts = container.querySelectorAll(".post-card");
    posts.forEach((post, index) => {
      post.style.transform = "translateX(-10px)";
      post.style.opacity = "0.8";
      setTimeout(() => {
        post.style.transform = "translateX(0)";
        post.style.opacity = "1";
      }, index * 150);
    });
  }

  updateLeaderboard(filterValue, container) {
    // Simulate leaderboard updates
    const items = container.querySelectorAll(".leaderboard-item");
    items.forEach((item, index) => {
      item.style.transform = "scale(0.95)";
      setTimeout(() => {
        item.style.transform = "scale(1)";
      }, index * 100);
    });
  }

  updateSearchResults(filterValue, container) {
    // Simulate search result filtering
    const results = container.querySelectorAll(".search-result-item");
    results.forEach((result, index) => {
      result.style.opacity = "0.7";
      setTimeout(() => {
        result.style.opacity = "1";
      }, index * 100);
    });
  }

  updateNotifications(filterValue, container) {
    // Simulate notification filtering
    const notifications = container.querySelectorAll(".notification-item");
    notifications.forEach((notification, index) => {
      notification.style.transform = "translateY(-5px)";
      notification.style.opacity = "0.8";
      setTimeout(() => {
        notification.style.transform = "translateY(0)";
        notification.style.opacity = "1";
      }, index * 100);
    });
  }

  updateBracketView(filterValue, container) {
    // Simulate bracket view updates
    container.style.opacity = "0.8";
    setTimeout(() => {
      container.style.opacity = "1";
    }, 300);
  }

  updateSchedule(filterValue, container) {
    // Simulate schedule updates
    const scheduleItems = container.querySelectorAll(
      ".schedule-item, .game-card",
    );
    scheduleItems.forEach((item, index) => {
      item.style.opacity = "0.7";
      setTimeout(() => {
        item.style.opacity = "1";
      }, index * 100);
    });
  }
}

// ========================================
// INITIALIZATION
// ========================================

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new FilterManager();
  });
} else {
  new FilterManager();
}

// Export for use in other scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = FilterManager;
}
