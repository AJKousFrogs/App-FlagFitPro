/**
 * Universal Focus Management Component
 * Standardizes focus management and keyboard navigation across all 26 pages
 * Implements skip links, focus trapping, and logical tab order
 */

class UniversalFocusManagement {
  constructor(options = {}) {
    this.options = {
      enableSkipLinks: true,
      enableFocusTrapping: true,
      enableFocusIndicators: true,
      enableKeyboardShortcuts: true,
      enableAriaLiveRegions: true,
      ...options,
    };

    this.focusableElements =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    this.focusTraps = new Map();
    this.currentFocusedElement = null;

    this.init();
  }

  init() {
    this.setupSkipLinks();
    this.enhanceFocusIndicators();
    this.setupKeyboardShortcuts();
    this.setupAriaLiveRegions();
    this.setupFocusTracking();
    this.setupModalFocusTrapping();
    this.fixTabOrder();
  }

  setupSkipLinks() {
    if (!this.options.enableSkipLinks) return;

    // Skip skip links on auth pages (login, register, reset-password)
    // These pages don't have navigation to skip, so skip links are unnecessary
    const currentPath = window.location.pathname.toLowerCase();
    const authPages = ["/login", "/register", "/reset-password"];
    const isAuthPage = authPages.some(
      (page) =>
        currentPath.includes(page) || currentPath.endsWith(page + ".html"),
    );

    if (isAuthPage) {
      // Remove any existing skip links that might have been created before
      document.querySelectorAll(".skip-link").forEach((link) => link.remove());
      return; // Don't create skip links on auth pages
    }

    // Create skip to main content link
    const skipLink = document.createElement("a");
    skipLink.href = "#main-content";
    skipLink.className = "skip-link";
    skipLink.textContent = "Skip to main content";
    skipLink.setAttribute("aria-label", "Skip to main content");

    // Insert at the very beginning of the body
    document.body.insertBefore(skipLink, document.body.firstChild);

    // Ensure main content has ID
    let mainContent =
      document.getElementById("main-content") ||
      document.querySelector("main") ||
      document.querySelector(".main-content") ||
      document.querySelector("#content");

    if (mainContent && !mainContent.id) {
      mainContent.id = "main-content";
    } else if (!mainContent) {
      // Find the main content area heuristically
      const contentSelectors = [
        ".container",
        ".content",
        ".page-content",
        ".dashboard",
        ".analytics-content",
        "section:first-of-type",
      ];

      for (const selector of contentSelectors) {
        mainContent = document.querySelector(selector);
        if (mainContent) {
          mainContent.id = "main-content";
          break;
        }
      }
    }

    // Add skip link to navigation
    const nav = document.querySelector("nav, .nav, .navigation, .sidebar");
    if (nav && mainContent) {
      const skipToNav = document.createElement("a");
      skipToNav.href = "#navigation";
      skipToNav.className = "skip-link";
      skipToNav.textContent = "Skip to navigation";
      skipToNav.setAttribute("aria-label", "Skip to navigation");

      if (!nav.id) nav.id = "navigation";
      document.body.insertBefore(skipToNav, skipLink.nextSibling);
    }

    // Handle skip link activation
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("skip-link")) {
        e.preventDefault();
        const targetId = e.target.getAttribute("href").slice(1);
        const target = document.getElementById(targetId);

        if (target) {
          target.setAttribute("tabindex", "-1");
          target.focus();
          target.scrollIntoView({ behavior: "smooth", block: "start" });

          // Remove tabindex after focus
          target.addEventListener(
            "blur",
            () => {
              target.removeAttribute("tabindex");
            },
            { once: true },
          );
        }
      }
    });
  }

  enhanceFocusIndicators() {
    if (!this.options.enableFocusIndicators) return;

    // Track if user is navigating with keyboard
    let isKeyboardNavigation = false;

    document.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        isKeyboardNavigation = true;
        document.body.classList.add("keyboard-navigation");
      }
    });

    document.addEventListener("mousedown", () => {
      isKeyboardNavigation = false;
      document.body.classList.remove("keyboard-navigation");
    });

    // Enhanced focus indicators for interactive elements
    document.addEventListener("focusin", (e) => {
      if (isKeyboardNavigation) {
        this.currentFocusedElement = e.target;
        this.announceElementInfo(e.target);
      }
    });

    document.addEventListener("focusout", () => {
      this.currentFocusedElement = null;
    });
  }

  setupKeyboardShortcuts() {
    if (!this.options.enableKeyboardShortcuts) return;

    document.addEventListener("keydown", (e) => {
      // Handle keyboard shortcuts
      if (e.altKey) {
        switch (e.key) {
          case "m":
            e.preventDefault();
            this.focusMainContent();
            break;
          case "n":
            e.preventDefault();
            this.focusNavigation();
            break;
          case "s":
            e.preventDefault();
            this.focusSearch();
            break;
          case "1":
            e.preventDefault();
            this.focusMainHeading();
            break;
        }
      }

      // Handle escape key for closing modals/dropdowns
      if (e.key === "Escape") {
        this.handleEscape();
      }

      // Handle arrow navigation for certain components
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        this.handleArrowNavigation(e);
      }
    });
  }

  setupAriaLiveRegions() {
    if (!this.options.enableAriaLiveRegions) return;

    // Create polite live region if it doesn't exist
    if (!document.getElementById("aria-live-polite")) {
      const politeRegion = document.createElement("div");
      politeRegion.id = "aria-live-polite";
      politeRegion.className = "sr-only";
      politeRegion.setAttribute("aria-live", "polite");
      politeRegion.setAttribute("aria-atomic", "true");
      document.body.appendChild(politeRegion);
    }

    // Create assertive live region if it doesn't exist
    if (!document.getElementById("aria-live-assertive")) {
      const assertiveRegion = document.createElement("div");
      assertiveRegion.id = "aria-live-assertive";
      assertiveRegion.className = "sr-only";
      assertiveRegion.setAttribute("aria-live", "assertive");
      assertiveRegion.setAttribute("aria-atomic", "true");
      document.body.appendChild(assertiveRegion);
    }
  }

  setupFocusTracking() {
    // Track focus changes for better accessibility
    document.addEventListener("focusin", (e) => {
      // Remove any existing focus indicators
      document.querySelectorAll(".has-focus").forEach((el) => {
        el.classList.remove("has-focus");
      });

      // Add focus indicator to current element's container
      const container = e.target.closest(
        ".form-group, .nav-item, .btn-group, .card",
      );
      if (container) {
        container.classList.add("has-focus");
      }
    });

    document.addEventListener("focusout", () => {
      // Remove focus indicators after a short delay
      setTimeout(() => {
        if (!this.currentFocusedElement) {
          document.querySelectorAll(".has-focus").forEach((el) => {
            el.classList.remove("has-focus");
          });
        }
      }, 100);
    });
  }

  setupModalFocusTrapping() {
    if (!this.options.enableFocusTrapping) return;

    // Watch for modals being opened
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if it's a modal
            if (
              node.matches &&
              (node.matches(
                '.modal, .dialog, .popup, [role="dialog"], [role="alertdialog"]',
              ) ||
                node.querySelector(
                  '.modal, .dialog, .popup, [role="dialog"], [role="alertdialog"]',
                ))
            ) {
              const modal = node.matches(
                '.modal, .dialog, .popup, [role="dialog"], [role="alertdialog"]',
              )
                ? node
                : node.querySelector(
                    '.modal, .dialog, .popup, [role="dialog"], [role="alertdialog"]',
                  );
              this.trapFocus(modal);
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Also check for existing modals that become visible
    document.addEventListener("click", (e) => {
      // Check if a modal trigger was clicked
      if (
        e.target.matches(
          '[data-toggle="modal"], [data-bs-toggle="modal"], .modal-trigger',
        )
      ) {
        setTimeout(() => {
          const visibleModal = document.querySelector(
            '.modal:not([style*="display: none"]), .dialog:not([style*="display: none"])',
          );
          if (visibleModal) {
            this.trapFocus(visibleModal);
          }
        }, 100);
      }
    });
  }

  fixTabOrder() {
    // Ensure logical tab order across the page
    const interactiveElements = document.querySelectorAll(
      this.focusableElements,
    );

    interactiveElements.forEach((element, _index) => {
      // Remove any existing tabindex that might interfere
      if (element.getAttribute("tabindex") === "0") {
        element.removeAttribute("tabindex");
      }

      // Ensure hidden elements are not focusable
      if (element.offsetParent === null && !element.matches(".sr-only")) {
        element.setAttribute("tabindex", "-1");
      }
    });

    // Fix tab order for specific components
    this.fixNavigationTabOrder();
    this.fixFormTabOrder();
    this.fixTableTabOrder();
  }

  fixNavigationTabOrder() {
    const navItems = document.querySelectorAll(
      ".nav-item, .navigation-link, nav a",
    );

    navItems.forEach((item, _index) => {
      // Ensure nav items are properly focusable
      if (!item.matches("a, button, [tabindex]")) {
        item.setAttribute("tabindex", "0");
        item.setAttribute("role", "button");
      }
    });
  }

  fixFormTabOrder() {
    const forms = document.querySelectorAll("form");

    forms.forEach((form) => {
      const formElements = form.querySelectorAll(this.focusableElements);

      // Ensure proper tab order within forms
      formElements.forEach((element, _index) => {
        if (element.type === "hidden") {
          element.setAttribute("tabindex", "-1");
        }
      });
    });
  }

  fixTableTabOrder() {
    const tables = document.querySelectorAll("table");

    tables.forEach((table) => {
      // Make tables navigable with arrow keys
      const cells = table.querySelectorAll("th, td");

      cells.forEach((cell) => {
        if (cell.querySelector(this.focusableElements)) {
          // Cell contains focusable content
          return;
        }

        // Make cell focusable if it's interactive
        if (
          cell.matches(".clickable, [onclick]") ||
          cell.closest("tr").matches(".clickable, [onclick]")
        ) {
          cell.setAttribute("tabindex", "0");
        }
      });
    });
  }

  trapFocus(element) {
    if (!element) return;

    const focusableElements = element.querySelectorAll(this.focusableElements);
    if (focusableElements.length === 0) return;

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    // Store previous focus
    const previousFocus = document.activeElement;

    // Focus the first element
    firstFocusable.focus();

    const trapFocusHandler = (e) => {
      if (e.key === "Tab") {
        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      } else if (e.key === "Escape") {
        this.releaseFocusTrap(element, trapFocusHandler, previousFocus);
      }
    };

    element.addEventListener("keydown", trapFocusHandler);
    this.focusTraps.set(element, { handler: trapFocusHandler, previousFocus });
  }

  releaseFocusTrap(element, handler, previousFocus) {
    element.removeEventListener("keydown", handler);
    this.focusTraps.delete(element);

    if (previousFocus && previousFocus.focus) {
      previousFocus.focus();
    }
  }

  focusMainContent() {
    const mainContent =
      document.getElementById("main-content") ||
      document.querySelector("main") ||
      document.querySelector(".main-content");

    if (mainContent) {
      mainContent.setAttribute("tabindex", "-1");
      mainContent.focus();
      this.announce("Main content focused");

      mainContent.addEventListener(
        "blur",
        () => {
          mainContent.removeAttribute("tabindex");
        },
        { once: true },
      );
    }
  }

  focusNavigation() {
    const navigation =
      document.getElementById("navigation") ||
      document.querySelector("nav") ||
      document.querySelector(".nav") ||
      document.querySelector(".sidebar");

    if (navigation) {
      const firstNavItem = navigation.querySelector(this.focusableElements);
      if (firstNavItem) {
        firstNavItem.focus();
        this.announce("Navigation focused");
      }
    }
  }

  focusSearch() {
    const searchInput = document.querySelector(
      'input[type="search"], input[name*="search"], #search, .search-input',
    );

    if (searchInput) {
      searchInput.focus();
      this.announce("Search field focused");
    }
  }

  focusMainHeading() {
    const mainHeading = document.querySelector("h1, .page-title, .main-title");

    if (mainHeading) {
      mainHeading.setAttribute("tabindex", "-1");
      mainHeading.focus();
      this.announce(`Main heading: ${mainHeading.textContent.trim()}`);

      mainHeading.addEventListener(
        "blur",
        () => {
          mainHeading.removeAttribute("tabindex");
        },
        { once: true },
      );
    }
  }

  handleEscape() {
    // Close any open modals, dropdowns, or menus
    const openModals = document.querySelectorAll(
      '.modal.show, .modal[style*="block"], .dialog:not([hidden])',
    );
    openModals.forEach((modal) => {
      const closeBtn = modal.querySelector(
        '.close, .modal-close, [data-dismiss="modal"]',
      );
      if (closeBtn) {
        closeBtn.click();
      } else if (this.focusTraps.has(modal)) {
        const trapInfo = this.focusTraps.get(modal);
        this.releaseFocusTrap(modal, trapInfo.handler, trapInfo.previousFocus);
      }
    });

    // Close dropdowns
    const openDropdowns = document.querySelectorAll(
      ".dropdown.show, .dropdown-menu.show",
    );
    openDropdowns.forEach((dropdown) => {
      dropdown.classList.remove("show");
    });

    // Close mobile menu
    const mobileMenu = document.querySelector(
      ".mobile-menu.show, .sidebar.show",
    );
    if (mobileMenu) {
      mobileMenu.classList.remove("show");
    }
  }

  handleArrowNavigation(e) {
    const currentElement = document.activeElement;

    // Check if we're in a specific navigable component
    if (this.handleTableNavigation(e, currentElement)) return;
    if (this.handleMenuNavigation(e, currentElement)) return;
    if (this.handleTabNavigation(e, currentElement)) return;
  }

  handleTableNavigation(e, currentElement) {
    const cell = currentElement.closest("td, th");
    if (!cell) return false;

    const table = cell.closest("table");
    const row = cell.closest("tr");
    const cellIndex = Array.from(row.children).indexOf(cell);
    const rowIndex = Array.from(table.querySelectorAll("tr")).indexOf(row);

    let targetCell;

    switch (e.key) {
      case "ArrowUp":
        const previousRow = table.querySelectorAll("tr")[rowIndex - 1];
        targetCell = previousRow?.children[cellIndex];
        break;
      case "ArrowDown":
        const nextRow = table.querySelectorAll("tr")[rowIndex + 1];
        targetCell = nextRow?.children[cellIndex];
        break;
      case "ArrowLeft":
        targetCell = cell.previousElementSibling;
        break;
      case "ArrowRight":
        targetCell = cell.nextElementSibling;
        break;
    }

    if (targetCell) {
      e.preventDefault();
      const focusable =
        targetCell.querySelector(this.focusableElements) || targetCell;
      focusable.focus();
      return true;
    }

    return false;
  }

  handleMenuNavigation(e, currentElement) {
    const menuItem = currentElement.closest(
      ".menu-item, .dropdown-item, .nav-item",
    );
    if (!menuItem) return false;

    const menu = menuItem.closest(".menu, .dropdown-menu, .nav");
    const items = Array.from(
      menu.querySelectorAll(".menu-item, .dropdown-item, .nav-item"),
    );
    const currentIndex = items.indexOf(menuItem);

    let targetIndex;

    switch (e.key) {
      case "ArrowUp":
        targetIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        break;
      case "ArrowDown":
        targetIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        break;
      default:
        return false;
    }

    if (targetIndex !== undefined && items[targetIndex]) {
      e.preventDefault();
      const focusable =
        items[targetIndex].querySelector(this.focusableElements) ||
        items[targetIndex];
      focusable.focus();
      return true;
    }

    return false;
  }

  handleTabNavigation(e, currentElement) {
    const tabButton = currentElement.closest(
      '.tab-button, .tab-nav-item, [role="tab"]',
    );
    if (!tabButton) return false;

    const tabList = tabButton.closest('.tab-list, .tab-nav, [role="tablist"]');
    const tabs = Array.from(
      tabList.querySelectorAll('.tab-button, .tab-nav-item, [role="tab"]'),
    );
    const currentIndex = tabs.indexOf(tabButton);

    let targetIndex;

    switch (e.key) {
      case "ArrowLeft":
        targetIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        break;
      case "ArrowRight":
        targetIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        break;
      case "Home":
        targetIndex = 0;
        break;
      case "End":
        targetIndex = tabs.length - 1;
        break;
      default:
        return false;
    }

    if (targetIndex !== undefined && tabs[targetIndex]) {
      e.preventDefault();
      tabs[targetIndex].focus();
      tabs[targetIndex].click(); // Activate the tab
      return true;
    }

    return false;
  }

  announceElementInfo(element) {
    let announcement = "";

    // Get element type and role
    const _role = element.getAttribute("role") || element.tagName.toLowerCase();
    const type = element.type || "";

    // Build announcement based on element type
    if (element.matches("button")) {
      announcement = `Button: ${element.textContent.trim() || element.getAttribute("aria-label") || "Unlabeled button"}`;
    } else if (element.matches("a")) {
      announcement = `Link: ${element.textContent.trim() || element.getAttribute("aria-label") || "Unlabeled link"}`;
    } else if (element.matches("input")) {
      const label = this.getElementLabel(element);
      announcement = `${type} input: ${label}`;
    } else if (element.matches("select")) {
      const label = this.getElementLabel(element);
      announcement = `Select: ${label}`;
    } else if (element.matches("textarea")) {
      const label = this.getElementLabel(element);
      announcement = `Text area: ${label}`;
    }

    // Add current value for form elements
    if (element.matches("input, select, textarea") && element.value) {
      announcement += `. Current value: ${element.value}`;
    }

    // Add state information
    if (element.getAttribute("aria-expanded")) {
      announcement +=
        element.getAttribute("aria-expanded") === "true"
          ? ". Expanded"
          : ". Collapsed";
    }

    if (element.hasAttribute("aria-pressed")) {
      announcement +=
        element.getAttribute("aria-pressed") === "true"
          ? ". Pressed"
          : ". Not pressed";
    }

    if (announcement) {
      this.announce(announcement, "polite");
    }
  }

  getElementLabel(element) {
    // Try multiple ways to get the element's label
    const labelId = element.getAttribute("aria-labelledby");
    if (labelId) {
      const labelElement = document.getElementById(labelId);
      if (labelElement) return labelElement.textContent.trim();
    }

    const ariaLabel = element.getAttribute("aria-label");
    if (ariaLabel) return ariaLabel;

    const placeholder = element.getAttribute("placeholder");
    if (placeholder) return placeholder;

    // Find associated label
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label) return label.textContent.trim();
    }

    const parentLabel = element.closest("label");
    if (parentLabel) return parentLabel.textContent.trim();

    return element.name || "Unlabeled";
  }

  announce(message, priority = "polite") {
    const liveRegionId =
      priority === "assertive" ? "aria-live-assertive" : "aria-live-polite";
    const liveRegion = document.getElementById(liveRegionId);

    if (liveRegion) {
      liveRegion.textContent = "";
      setTimeout(() => {
        liveRegion.textContent = message;
      }, 100);

      // Clear after announcement
      setTimeout(() => {
        liveRegion.textContent = "";
      }, 5000);
    }
  }

  // Public methods
  setFocusToElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
      element.focus();
      return true;
    }
    return false;
  }

  getCurrentFocus() {
    return this.currentFocusedElement;
  }

  addFocusTrap(element) {
    this.trapFocus(element);
  }

  removeFocusTrap(element) {
    if (this.focusTraps.has(element)) {
      const trapInfo = this.focusTraps.get(element);
      this.releaseFocusTrap(element, trapInfo.handler, trapInfo.previousFocus);
    }
  }

  destroy() {
    // Clean up all event listeners and focus traps
    this.focusTraps.forEach((trapInfo, element) => {
      element.removeEventListener("keydown", trapInfo.handler);
    });
    this.focusTraps.clear();

    // Remove skip links
    document.querySelectorAll(".skip-link").forEach((link) => link.remove());

    // Remove live regions
    document.getElementById("aria-live-polite")?.remove();
    document.getElementById("aria-live-assertive")?.remove();
  }
}

// Auto-initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  window.focusManagement = new UniversalFocusManagement();
});

// Export for module usage
export { UniversalFocusManagement };
