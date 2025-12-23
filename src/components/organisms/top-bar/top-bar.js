/**
 * Top Bar Component - FlagFit Pro
 * Handles search combobox, notifications, and user menu interactions
 */

(function () {
  "use strict";

  // Logger fallback - use window.logger if available, otherwise silent logger
  const logger = window.logger || {
    error: () => {},
    warn: () => {},
    info: () => {},
    debug: () => {},
  };

  // Global function stubs (can be overridden by other scripts)
  // main.js will override this with the real implementation
  if (!window.performGlobalSearch) {
    window.performGlobalSearch = async function (query) {
      // Fallback stub implementation - returns empty array if query is empty
      if (!query || !query.trim()) {
        return [];
      }
      // Simple fallback results
      return [
        { label: `${query} – Player`, value: query, type: "player" },
        { label: `${query} – Team`, value: query, type: "team" },
      ];
    };
  }

  window.toggleNotifications =
    window.toggleNotifications ||
    function () {
      // Fallback stub - can be implemented elsewhere
      const panel = document.getElementById("notification-panel");
      if (panel) {
        panel.hidden = !panel.hidden;
      }
    };

  // getNotificationCount will be set by dashboard-page.js if available
  // Otherwise use a fallback that calls the API directly
  window.getNotificationCount =
    window.getNotificationCount ||
    async function () {
      try {
        // Try to use the notification store if available
        if (window.notificationStore) {
          return await window.notificationStore.refreshBadge();
        }

        // Try to use authManager if available
        let authToken = null;
        if (
          window.authManager &&
          typeof window.authManager.getToken === "function"
        ) {
          try {
            await window.authManager.waitForInit();
            if (window.authManager.isAuthenticated()) {
              authToken = window.authManager.getToken();
            }
          } catch (e) {
            logger.debug(
              "AuthManager not ready, trying fallback token retrieval",
            );
          }
        }

        // Fallback: try to get token from localStorage or secure storage
        if (!authToken) {
          // Try secure storage if available
          if (
            window.secureStorage &&
            typeof window.secureStorage.getAuthToken === "function"
          ) {
            try {
              authToken = await window.secureStorage.getAuthToken();
            } catch (e) {
              logger.debug("Secure storage not available");
            }
          }

          // Final fallback: localStorage
          if (!authToken) {
            authToken = localStorage.getItem("authToken");
          }
        }

        // If no token, return 0 (user not authenticated)
        if (!authToken) {
          logger.debug("No auth token available, returning 0");
          return 0;
        }

        // Fallback: call API directly
        // Try Netlify Functions endpoint first, then fallback to REST API
        const baseUrl = window.location.origin;
        const isNetlify =
          baseUrl.includes("netlify.app") || baseUrl.includes("netlify.com");
        const endpoint = isNetlify
          ? `${baseUrl}/.netlify/functions/notifications-count`
          : "/api/dashboard/notifications/count";

        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          // Handle 401 gracefully (user not authenticated)
          if (response.status === 401) {
            logger.debug("Authentication required for notification count");
            return 0;
          }
          logger.warn("Failed to fetch notification count:", response.status);
          return 0;
        }

        const data = await response.json();
        // Handle different response formats
        if (data?.success !== false && data?.data) {
          return data.data.unreadCount || data.data.count || 0;
        } else if (data?.unreadCount !== undefined) {
          return data.unreadCount;
        } else if (typeof data === "number") {
          return data;
        }
        return 0;
      } catch (error) {
        logger.warn("Failed to get notification count:", error);
        return 0;
      }
    };

  // Wait for DOM to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  function init() {
    initSearch();
    initNotifications();
    initUserMenu();
    initScrollEffects();
    initScrollToTop();
    initThemeToggle();
  }

  /**
   * Search Combobox Implementation
   */
  function initSearch() {
    const input = document.getElementById("global-search");
    const listbox = document.getElementById("search-results");
    const status = document.getElementById("search-status");

    if (!input || !listbox || !status) {
      return;
    }

    let idx = -1;
    let items = [];
    let showingHistory = false;

    // Debounce function
    const debounce = (fn, delay = 250) => {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
      };
    };

    // Highlight matches in text
    const highlightText = (text, query, matchedTexts = []) => {
      if (!text || !query) {
        return text;
      }

      // Use matchedTexts if available, otherwise use query
      const termsToHighlight = matchedTexts.length > 0 ? matchedTexts : [query];
      let highlighted = text;

      for (const term of termsToHighlight) {
        if (!term || !term.trim()) {
          continue;
        }
        // Escape special regex characters
        const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`(${escapedTerm})`, "gi");
        highlighted = highlighted.replace(regex, (match) => {
          // Check if already inside a highlight tag
          if (highlighted.indexOf(`<mark>${match}</mark>`) !== -1) {
            return match;
          }
          return `<mark class="search-highlight">${match}</mark>`;
        });
      }

      return highlighted;
    };

    // Render search results or history
    const render = (results = [], isHistory = false) => {
      showingHistory = isHistory;

      if (isHistory && results.length === 0) {
        listbox.textContent = "";
        listbox.hidden = true;
        input.setAttribute("aria-expanded", "false");
        status.textContent = "";
        return;
      }

      // Clear listbox
      listbox.textContent = "";

      // Build results HTML string (highlightText returns HTML with highlighting)
      const resultsHTML = results
        .map((r, i) => {
          if (isHistory) {
            // Render history item
            return `<div id="sr-${i}" role="option" class="result-item result-item-history" aria-selected="${i === idx}">
                <div class="result-label">
                  <span class="history-icon">🕒</span>
                  ${r}
                </div>
              </div>`;
          }

          // Render search result with highlighting
          const matchedTexts = r.matchedTexts || [input.value.trim()];
          const highlightedLabel = highlightText(
            r.label,
            input.value.trim(),
            matchedTexts,
          );
          const highlightedDescription = r.description
            ? highlightText(r.description, input.value.trim(), matchedTexts)
            : "";
          const description = highlightedDescription
            ? `<div class="result-description">${highlightedDescription}</div>`
            : "";
          const category = r.category
            ? `<div class="result-category">${r.category}</div>`
            : "";

          return `<div id="sr-${i}" role="option" class="result-item" aria-selected="${i === idx}">
              <div class="result-label">${highlightedLabel}</div>
              ${description}
              ${category}
            </div>`;
        })
        .join("");

      // Use temp container pattern to safely insert HTML (highlightText returns HTML)

      const temp = document.createElement("div");
      // eslint-disable-next-line no-restricted-syntax
      temp.innerHTML = resultsHTML;
      while (temp.firstChild) {
        listbox.appendChild(temp.firstChild);
      }

      listbox.hidden = results.length === 0;
      input.setAttribute("aria-expanded", String(!listbox.hidden));

      // Announce results
      if (results.length > 0) {
        if (isHistory) {
          status.textContent = `${results.length} recent search${results.length !== 1 ? "es" : ""}`;
        } else {
          status.textContent = `${results.length} result${results.length !== 1 ? "s" : ""} found`;
        }
      } else if (input.value.trim() && !isHistory) {
        status.textContent = "No matches found";
      } else {
        status.textContent = "";
      }
    };

    // Show search history
    const showHistory = () => {
      try {
        const history = window.getRecentSearches
          ? window.getRecentSearches()
          : [];
        if (history.length > 0) {
          items = history;
          idx = -1;
          input.setAttribute("aria-activedescendant", "");
          render(history, true);
        } else {
          render([], true);
        }
      } catch (error) {
        logger.debug("Failed to load search history:", error);
        render([], true);
      }
    };

    // Search function
    const search = debounce(async (query) => {
      if (!query.trim()) {
        // Show history when input is empty
        showHistory();
        return;
      }

      try {
        // Call global search function (don't save to history yet - will save on selection)
        const results = await window.performGlobalSearch(query, {
          saveToHistory: false,
        });

        items = results;
        idx = results.length > 0 ? 0 : -1;
        input.setAttribute(
          "aria-activedescendant",
          idx >= 0 ? `sr-${idx}` : "",
        );
        render(results, false);
      } catch (error) {
        logger.error("Search error:", error);
        render([]);
        status.textContent = "Search error occurred";
      }
    });

    // Input handler
    input.addEventListener("input", (e) => {
      idx = -1;
      input.setAttribute("aria-activedescendant", "");
      search(e.target.value);
    });

    // Show history on focus if input is empty
    input.addEventListener("focus", () => {
      if (!input.value.trim()) {
        showHistory();
      }
    });

    // Keyboard navigation
    input.addEventListener("keydown", (e) => {
      if (listbox.hidden) {
        if (e.key === "ArrowDown") {
          listbox.hidden = false;
          input.setAttribute("aria-expanded", "true");
          if (items.length > 0) {
            idx = 0;
            input.setAttribute("aria-activedescendant", "sr-0");
            render(items);
          }
          e.preventDefault();
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          idx = Math.min(idx + 1, items.length - 1);
          input.setAttribute("aria-activedescendant", `sr-${idx}`);
          render(items);
          e.preventDefault();
          break;

        case "ArrowUp":
          idx = Math.max(idx - 1, 0);
          input.setAttribute("aria-activedescendant", `sr-${idx}`);
          render(items);
          e.preventDefault();
          break;

        case "Enter":
          if (idx >= 0 && items[idx]) {
            const selected = items[idx];

            if (showingHistory) {
              // History item selected - use it as search query
              input.value = selected;
              search(selected);
            } else {
              // Search result selected
              // Save to history
              if (window.saveToHistory) {
                window.saveToHistory(input.value.trim());
              } else if (window.performGlobalSearch) {
                // Trigger search again with history saving enabled
                window
                  .performGlobalSearch(input.value.trim(), {
                    saveToHistory: true,
                  })
                  .catch(() => {});
              }

              input.value = selected.label || selected.value || selected;
              listbox.hidden = true;
              input.setAttribute("aria-expanded", "false");
              input.setAttribute("aria-activedescendant", "");
              idx = -1;

              // Navigate or perform action
              if (selected.url) {
                window.location.href = selected.url;
              }
            }
          }
          e.preventDefault();
          break;

        case "Escape":
          listbox.hidden = true;
          input.setAttribute("aria-expanded", "false");
          input.setAttribute("aria-activedescendant", "");
          idx = -1;
          input.blur();
          break;
      }
    });

    // Click outside to close
    document.addEventListener("click", (e) => {
      if (!input.contains(e.target) && !listbox.contains(e.target)) {
        listbox.hidden = true;
        input.setAttribute("aria-expanded", "false");
      }
    });

    // Result item click handler
    listbox.addEventListener("click", (e) => {
      const item = e.target.closest('[role="option"]');
      if (item) {
        const itemIdx = parseInt(item.id.replace("sr-", ""), 10);
        if (items[itemIdx]) {
          const selected = items[itemIdx];

          if (showingHistory) {
            // History item clicked - use it as search query
            input.value = selected;
            search(selected);
          } else {
            // Search result clicked
            // Save to history
            if (window.saveToHistory) {
              window.saveToHistory(input.value.trim());
            } else if (window.performGlobalSearch) {
              // Trigger search again with history saving enabled
              window
                .performGlobalSearch(input.value.trim(), {
                  saveToHistory: true,
                })
                .catch(() => {});
            }

            input.value = selected.label || selected.value || selected;
            listbox.hidden = true;
            input.setAttribute("aria-expanded", "false");
            input.setAttribute("aria-activedescendant", "");

            if (selected.url) {
              window.location.href = selected.url;
            }
          }
        }
      }
    });
  }

  /**
   * Notifications Implementation
   */
  function initNotifications() {
    const bell = document.getElementById("notification-bell");
    const badge = document.getElementById("notification-badge");
    const live = document.getElementById("notification-live");

    if (!bell) {
      return;
    }

    // Initialize aria attributes
    bell.setAttribute("aria-expanded", "false");
    bell.setAttribute("aria-haspopup", "true");
    bell.setAttribute("aria-controls", "notification-panel");

    // Set badge count
    function setBadge(count) {
      if (!badge || !live) {
        return;
      }

      if (count > 0) {
        badge.textContent = String(count);
        badge.hidden = false;
        live.textContent = `${count} new notification${count !== 1 ? "s" : ""}`;
      } else {
        badge.hidden = true;
        live.textContent = "No new notifications";
      }
    }

    // Toggle notification panel
    bell.addEventListener("click", () => {
      const expanded = bell.getAttribute("aria-expanded") === "true";
      bell.setAttribute("aria-expanded", String(!expanded));

      // Toggle notification panel
      window.toggleNotifications();
    });

    // Close on Escape
    bell.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        const panel = document.getElementById("notification-panel");
        if (panel && panel.classList.contains("is-open")) {
          // Use dashboardPage method if available
          if (
            window.dashboardPage &&
            window.dashboardPage.closeNotificationPanel
          ) {
            window.dashboardPage.closeNotificationPanel();
          } else {
            // Fallback
            panel.classList.remove("is-open");
            bell.setAttribute("aria-expanded", "false");
          }
        }
        bell.blur();
      }
    });

    // Initialize badge count
    const initBadge = async () => {
      try {
        const count = await window.getNotificationCount();
        setBadge(count);
      } catch (error) {
        logger.warn("Failed to initialize badge:", error);
        setBadge(0);
      }
    };

    initBadge();

    // Refresh badge periodically (every 30 seconds)
    const badgeInterval = setInterval(() => {
      initBadge();
    }, 30000);

    // Clean up interval when page unloads
    window.addEventListener("beforeunload", () => {
      clearInterval(badgeInterval);
    });
  }

  /**
   * User Menu Implementation
   * Handles dropdown toggle, keyboard navigation, and click-outside behavior
   */
  function initUserMenu() {
    const button = document.getElementById("user-menu-button");
    const menu = document.getElementById("user-menu");

    if (!button || !menu) {
      return;
    }

    // Initialize aria attributes
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-haspopup", "true");
    button.setAttribute("aria-controls", "user-menu");

    // Toggle menu on button click
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      const expanded = button.getAttribute("aria-expanded") === "true";
      const newExpanded = !expanded;

      button.setAttribute("aria-expanded", String(newExpanded));
      menu.hidden = !newExpanded;
    });

    // Close on Escape key
    button.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        button.setAttribute("aria-expanded", "false");
        menu.hidden = true;
        button.blur();
      }
    });

    // Handle menu item keyboard navigation
    const menuItems = menu.querySelectorAll('[role="menuitem"] a');
    menuItems.forEach((item, index) => {
      item.addEventListener("keydown", (e) => {
        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            const next = menuItems[index + 1] || menuItems[0];
            next?.focus();
            break;
          case "ArrowUp":
            e.preventDefault();
            const prev =
              menuItems[index - 1] || menuItems[menuItems.length - 1];
            prev?.focus();
            break;
          case "Escape":
            e.preventDefault();
            button.setAttribute("aria-expanded", "false");
            menu.hidden = true;
            button.focus();
            break;
        }
      });
    });

    // Close on click outside
    document.addEventListener("click", (e) => {
      const wrapper = button.closest(".user-menu-wrapper");
      if (wrapper && !wrapper.contains(e.target)) {
        button.setAttribute("aria-expanded", "false");
        menu.hidden = true;
      }
    });

    // Close menu when clicking a menu item (optional - remove if you want menu to stay open)
    menuItems.forEach((item) => {
      item.addEventListener("click", () => {
        // Small delay to allow navigation before closing
        setTimeout(() => {
          button.setAttribute("aria-expanded", "false");
          menu.hidden = true;
        }, 100);
      });
    });
  }

  /**
   * Scroll Effects Implementation
   * Handles dynamic shadow based on scroll position
   */
  function initScrollEffects() {
    const topBar = document.querySelector(".top-bar");
    if (!topBar) {
      return;
    }

    let ticking = false;

    function updateScrollEffects() {
      const scrollY = window.scrollY;

      if (scrollY > 10) {
        topBar.classList.add("scrolled");
        if (scrollY > 100) {
          topBar.classList.add("scrolled-deep");
        } else {
          topBar.classList.remove("scrolled-deep");
        }
      } else {
        topBar.classList.remove("scrolled", "scrolled-deep");
      }

      ticking = false;
    }

    function requestTick() {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollEffects);
        ticking = true;
      }
    }

    window.addEventListener("scroll", requestTick, { passive: true });
    // Initial check
    updateScrollEffects();
  }

  /**
   * Scroll to Top Button Implementation
   * Shows button after 50px scroll, handles smooth scroll to top
   */
  function initScrollToTop() {
    const scrollButton = document.getElementById("scroll-to-top");
    if (!scrollButton) {
      return;
    }

    let ticking = false;

    function updateScrollButton() {
      const scrollY = window.scrollY;

      if (scrollY > 50) {
        scrollButton.hidden = false;
      } else {
        scrollButton.hidden = true;
      }

      ticking = false;
    }

    function requestTick() {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollButton);
        ticking = true;
      }
    }

    // Show/hide button based on scroll position
    window.addEventListener("scroll", requestTick, { passive: true });
    // Initial check
    updateScrollButton();

    // Smooth scroll to top on click
    scrollButton.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      // Announce to screen readers
      const announcement = document.createElement("div");
      announcement.className = "sr-only";
      announcement.setAttribute("aria-live", "polite");
      announcement.textContent = "Scrolled to top";
      document.body.appendChild(announcement);
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    });

    // Keyboard support
    scrollButton.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        scrollButton.click();
      }
    });
  }

  /**
   * Theme Toggle Implementation
   * Handles theme toggle interactions and syncs with theme-switcher.js
   */
  // Store observer outside function to prevent redeclaration
  if (typeof window.topBarThemeObserver === "undefined") {
    window.topBarThemeObserver = null;
  }

  function initThemeToggle() {
    const themeToggle = document.getElementById("header-theme-toggle");
    const themeToggleButton = document.getElementById(
      "header-theme-toggle-button",
    );

    // Handle button version
    if (themeToggleButton) {
      // theme-switcher.js handles the toggle logic and event listeners
      // This function just syncs the visual state when theme changes
      const getCurrentTheme = () => {
        return (
          document.documentElement.getAttribute("data-theme") ||
          localStorage.getItem("theme") ||
          "light"
        );
      };

      const currentTheme = getCurrentTheme();
      updateButtonVisualState(themeToggleButton, currentTheme);

      // Disconnect existing observer if it exists
      if (window.topBarThemeObserver) {
        window.topBarThemeObserver.disconnect();
      }

      // Listen for theme changes from theme-switcher.js or other sources
      window.topBarThemeObserver = new MutationObserver(() => {
        const newTheme = getCurrentTheme();
        updateButtonVisualState(themeToggleButton, newTheme);
      });

      window.topBarThemeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme"],
      });

      // Also listen for storage changes (in case theme changes in another tab)
      window.addEventListener("storage", (e) => {
        if (e.key === "theme") {
          const newTheme = e.newValue || "light";
          document.documentElement.setAttribute("data-theme", newTheme);
          document.body.setAttribute("data-theme", newTheme);
          updateButtonVisualState(themeToggleButton, newTheme);
        }
      });

      return;
    }

    // Handle checkbox version
    if (!themeToggle) {
      return;
    }

    // theme-switcher.js handles the toggle logic and event listeners
    // This function just syncs the visual state when theme changes

    // Initialize toggle state based on current theme
    const getCurrentTheme = () => {
      return (
        document.documentElement.getAttribute("data-theme") ||
        localStorage.getItem("theme") ||
        "light"
      );
    };

    const currentTheme = getCurrentTheme();
    themeToggle.checked = currentTheme === "dark";
    updateToggleVisualState(currentTheme);

    // Disconnect existing observer if it exists
    if (window.topBarThemeObserver) {
      window.topBarThemeObserver.disconnect();
    }

    // Listen for theme changes from theme-switcher.js or other sources
    window.topBarThemeObserver = new MutationObserver(() => {
      const newTheme = getCurrentTheme();
      if (themeToggle.checked !== (newTheme === "dark")) {
        themeToggle.checked = newTheme === "dark";
        updateToggleVisualState(newTheme);
      }
    });

    window.topBarThemeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    // Also listen for storage changes (in case theme changes in another tab)
    window.addEventListener("storage", (e) => {
      if (e.key === "theme") {
        const newTheme = e.newValue || "light";
        document.documentElement.setAttribute("data-theme", newTheme);
        document.body.setAttribute("data-theme", newTheme);
        themeToggle.checked = newTheme === "dark";
        updateToggleVisualState(newTheme);
      }
    });
  }

  /**
   * Update theme toggle visual state (for checkbox version)
   */
  function updateToggleVisualState(theme) {
    const toggleDot = document.getElementById("theme-toggle-dot");
    const toggleText = document.querySelector(".theme-toggle-text");
    const toggleSlider = document.querySelector(".theme-toggle-slider");

    if (toggleDot && toggleText && toggleSlider) {
      if (theme === "dark") {
        toggleDot.style.transform = "translateX(24px)";
        toggleSlider.style.background = "var(--color-brand-primary)";
        toggleText.textContent = "🌙 Dark";
      } else {
        toggleDot.style.transform = "translateX(0px)";
        toggleSlider.style.background = "var(--surface-tertiary)";
        toggleText.textContent = "☀️ Light";
      }
    }
  }

  /**
   * Update button visual state (for button version)
   */
  function updateButtonVisualState(button, theme) {
    if (!button) {
      return;
    }

    // Update aria-label and title for accessibility
    if (theme === "dark") {
      button.setAttribute("aria-label", "Switch to light theme");
      button.setAttribute("title", "Switch to light theme");
    } else {
      button.setAttribute("aria-label", "Switch to dark theme");
      button.setAttribute("title", "Switch to dark theme");
    }

    // CSS handles icon visibility via opacity transitions based on data-theme attribute
    // Just ensure the button is visible
    button.style.display = "";
    button.style.visibility = "visible";
  }
})();
