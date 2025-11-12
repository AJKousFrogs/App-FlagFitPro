/**
 * Top Bar Component - FlagFit Pro
 * Handles search combobox, notifications, and user menu interactions
 */

(function () {
  "use strict";

  // Global function stubs (can be overridden by other scripts)
  window.performGlobalSearch =
    window.performGlobalSearch ||
    async function (query) {
      // Fallback stub implementation
      return [
        { label: `${query} – Player`, value: query, type: "player" },
        { label: `${query} – Team`, value: query, type: "team" },
      ];
    };

  window.toggleNotifications =
    window.toggleNotifications ||
    function () {
      // Fallback stub - can be implemented elsewhere
      const panel = document.getElementById("notification-panel");
      if (panel) {
        panel.hidden = !panel.hidden;
      }
    };

  window.getNotificationCount =
    window.getNotificationCount ||
    async function () {
      // Fallback stub - returns 0 if not implemented
      return 0;
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
  }

  /**
   * Search Combobox Implementation
   */
  function initSearch() {
    const input = document.getElementById("global-search");
    const listbox = document.getElementById("search-results");
    const status = document.getElementById("search-status");

    if (!input || !listbox || !status) return;

    let idx = -1;
    let items = [];

    // Debounce function
    const debounce = (fn, delay = 250) => {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
      };
    };

    // Render search results
    const render = (results = []) => {
      listbox.innerHTML = results
        .map(
          (r, i) =>
            `<div id="sr-${i}" role="option" class="result-item" aria-selected="${i === idx}">${r.label}</div>`,
        )
        .join("");

      listbox.hidden = results.length === 0;
      input.setAttribute("aria-expanded", String(!listbox.hidden));

      // Announce results
      if (results.length > 0) {
        status.textContent = `${results.length} result${results.length !== 1 ? "s" : ""} found`;
      } else if (input.value.trim()) {
        status.textContent = "No matches found";
      } else {
        status.textContent = "";
      }
    };

    // Search function
    const search = debounce(async (query) => {
      if (!query.trim()) {
        render([]);
        idx = -1;
        input.setAttribute("aria-activedescendant", "");
        return;
      }

      try {
        // Call global search function
        const results = await window.performGlobalSearch(query);

        items = results;
        idx = results.length > 0 ? 0 : -1;
        input.setAttribute(
          "aria-activedescendant",
          idx >= 0 ? `sr-${idx}` : "",
        );
        render(results);
      } catch (error) {
        console.error("Search error:", error);
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
            // Handle selection
            const selected = items[idx];
            input.value = selected.label;
            listbox.hidden = true;
            input.setAttribute("aria-expanded", "false");
            input.setAttribute("aria-activedescendant", "");
            idx = -1;

            // Navigate or perform action
            if (selected.url) {
              window.location.href = selected.url;
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
          input.value = selected.label;
          listbox.hidden = true;
          input.setAttribute("aria-expanded", "false");
          input.setAttribute("aria-activedescendant", "");

          if (selected.url) {
            window.location.href = selected.url;
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

    if (!bell) return;

    // Initialize aria attributes
    bell.setAttribute("aria-expanded", "false");
    bell.setAttribute("aria-haspopup", "true");
    bell.setAttribute("aria-controls", "notification-panel");

    // Set badge count
    function setBadge(count) {
      if (!badge || !live) return;

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
        bell.setAttribute("aria-expanded", "false");
        bell.blur();
      }
    });

    // Initialize badge count
    window
      .getNotificationCount()
      .then(setBadge)
      .catch(() => setBadge(0));
  }

  /**
   * User Menu Implementation
   * Handles dropdown toggle, keyboard navigation, and click-outside behavior
   */
  function initUserMenu() {
    const button = document.getElementById("user-menu-button");
    const menu = document.getElementById("user-menu");

    if (!button || !menu) return;

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
})();
