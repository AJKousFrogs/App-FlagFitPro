// Accessibility utilities for FlagFit Pro
// Provides comprehensive accessibility features and enhancements

import { logger } from "./logger.js";

export class AccessibilityUtils {
  static focusManagement = {
    focusStack: [],
    trapActive: false,
  };

  // Initialize accessibility features
  static init() {
    logger.debug("♿ Initializing accessibility features...");

    this.setupKeyboardNavigation();
    this.setupScreenReaderSupport();
    this.setupFocusManagement();
    this.setupColorContrastEnhancement();
    this.setupReducedMotion();
    this.addSkipLinks();

    logger.debug("✅ Accessibility features initialized");
  }

  // Enhanced keyboard navigation
  static setupKeyboardNavigation() {
    document.addEventListener("keydown", (e) => {
      // ESC key handling
      if (e.key === "Escape") {
        this.handleEscapeKey();
      }

      // Tab navigation enhancement
      if (e.key === "Tab") {
        this.enhanceTabNavigation(e);
      }

      // Arrow key navigation for custom components
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        this.handleArrowKeyNavigation(e);
      }

      // Enter/Space for custom interactive elements
      if (e.key === "Enter" || e.key === " ") {
        this.handleActivationKeys(e);
      }
    });
  }

  // Screen reader support enhancements
  static setupScreenReaderSupport() {
    // Add live regions for dynamic content
    this.createLiveRegions();

    // Enhance form labels and descriptions
    this.enhanceFormAccessibility();

    // Add ARIA landmarks
    this.addARIALandmarks();

    // Dynamic content announcements
    this.setupDynamicAnnouncements();
  }

  // Focus management for modals and dynamic content
  static setupFocusManagement() {
    // Track focus for better UX
    document.addEventListener("focusin", (e) => {
      if (e.target && !this.focusManagement.trapActive) {
        this.focusManagement.lastFocused = e.target;
      }
    });

    // Modal focus trapping
    this.setupModalFocusTrap();
  }

  // Color contrast and visual accessibility
  static setupColorContrastEnhancement() {
    // High contrast mode detection
    if (window.matchMedia("(prefers-contrast: high)").matches) {
      document.body.classList.add("high-contrast");
    }

    // Color blindness support
    this.addColorBlindnessSupport();
  }

  // Reduced motion support
  static setupReducedMotion() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.body.classList.add("reduced-motion");

      // Disable problematic animations
      const style = document.createElement("style");
      style.textContent = `
        .reduced-motion * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Add skip links for keyboard users
  static addSkipLinks() {
    const skipLinks = document.createElement("div");
    skipLinks.className = "skip-links";

    const mainLink = document.createElement("a");
    mainLink.href = "#main-content";
    mainLink.className = "skip-link";
    mainLink.textContent = "Skip to main content";

    const navLink = document.createElement("a");
    navLink.href = "#navigation";
    navLink.className = "skip-link";
    navLink.textContent = "Skip to navigation";

    skipLinks.appendChild(mainLink);
    skipLinks.appendChild(navLink);

    const style = document.createElement("style");
    style.textContent = `
      .skip-links {
        position: absolute;
        top: -40px;
        left: 6px;
        z-index: 999999;
      }
      
      .skip-link {
        display: inline-block;
        padding: 8px 16px;
        background: #000;
        color: #fff;
        text-decoration: none;
        border-radius: 4px;
        font-size: 14px;
        margin-right: 8px;
        transition: top 0.3s;
      }
      
      .skip-link:focus {
        top: 6px;
      }
    `;

    document.head.appendChild(style);
    document.body.insertBefore(skipLinks, document.body.firstChild);
  }

  // Create ARIA live regions
  static createLiveRegions() {
    // Polite announcements
    const politeRegion = document.createElement("div");
    politeRegion.id = "aria-live-polite";
    politeRegion.setAttribute("aria-live", "polite");
    politeRegion.setAttribute("aria-atomic", "true");
    politeRegion.style.cssText =
      "position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;";

    // Assertive announcements
    const assertiveRegion = document.createElement("div");
    assertiveRegion.id = "aria-live-assertive";
    assertiveRegion.setAttribute("aria-live", "assertive");
    assertiveRegion.setAttribute("aria-atomic", "true");
    assertiveRegion.style.cssText =
      "position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;";

    document.body.appendChild(politeRegion);
    document.body.appendChild(assertiveRegion);
  }

  // Announce content to screen readers
  static announce(message, priority = "polite") {
    const region = document.getElementById(`aria-live-${priority}`);
    if (region) {
      region.textContent = message;
      // Clear after announcement
      setTimeout(() => {
        region.textContent = "";
      }, 1000);
    }
  }

  // Enhanced form accessibility
  static enhanceFormAccessibility() {
    document.querySelectorAll("form").forEach((form) => {
      // Add form validation announcements
      form.addEventListener("submit", (_e) => {
        const errors = form.querySelectorAll('.error, [aria-invalid="true"]');
        if (errors.length > 0) {
          this.announce(
            `Form has ${errors.length} errors. Please review and correct.`,
            "assertive",
          );
        }
      });

      // Enhanced input descriptions
      form.querySelectorAll("input, textarea, select").forEach((input) => {
        this.enhanceInputAccessibility(input);
      });
    });
  }

  // Enhance individual input accessibility
  static enhanceInputAccessibility(input) {
    // Add describedby relationships
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label && !input.getAttribute("aria-labelledby")) {
      input.setAttribute(
        "aria-labelledby",
        label.id || this.generateId("label"),
      );
      if (!label.id) {
        label.id = input.getAttribute("aria-labelledby");
      }
    }

    // Add validation feedback
    input.addEventListener("invalid", () => {
      input.setAttribute("aria-invalid", "true");
      const errorId = `${input.id}-error`;
      let errorElement = document.getElementById(errorId);

      if (!errorElement) {
        errorElement = document.createElement("div");
        errorElement.id = errorId;
        errorElement.className = "error-message";
        errorElement.setAttribute("role", "alert");
        input.parentNode.insertBefore(errorElement, input.nextSibling);
      }

      errorElement.textContent = input.validationMessage;
      input.setAttribute("aria-describedby", errorId);
      this.announce(
        `${label?.textContent || "Field"}: ${input.validationMessage}`,
        "assertive",
      );
    });

    input.addEventListener("input", () => {
      if (
        input.getAttribute("aria-invalid") === "true" &&
        input.validity.valid
      ) {
        input.removeAttribute("aria-invalid");
        const errorElement = document.getElementById(`${input.id}-error`);
        if (errorElement) {
          errorElement.remove();
          input.removeAttribute("aria-describedby");
        }
      }
    });
  }

  // Add ARIA landmarks
  static addARIALandmarks() {
    // Add main landmark
    const main =
      document.querySelector("main") || document.querySelector(".main-content");
    if (main && !main.getAttribute("role")) {
      main.setAttribute("role", "main");
      main.id = main.id || "main-content";
    }

    // Add navigation landmark
    const nav =
      document.querySelector("nav") || document.querySelector(".sidebar");
    if (nav && !nav.getAttribute("role")) {
      nav.setAttribute("role", "navigation");
      nav.setAttribute("aria-label", "Main navigation");
      nav.id = nav.id || "navigation";
    }

    // Add banner landmark
    const header = document.querySelector("header");
    if (header && !header.getAttribute("role")) {
      header.setAttribute("role", "banner");
    }

    // Add complementary landmarks
    document.querySelectorAll(".sidebar-content, aside").forEach((aside) => {
      if (!aside.getAttribute("role")) {
        aside.setAttribute("role", "complementary");
      }
    });
  }

  // Setup dynamic content announcements
  static setupDynamicAnnouncements() {
    // Observe DOM changes for announcements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.handleNewContent(node);
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // Handle new content for screen readers
  static handleNewContent(element) {
    // Announce new posts, messages, etc.
    if (
      element.classList &&
      (element.classList.contains("post") ||
        element.classList.contains("message") ||
        element.classList.contains("notification"))
    ) {
      const content = element.textContent.substring(0, 100);
      this.announce(`New content added: ${content}`, "polite");
    }
  }

  // Modal focus trap
  static setupModalFocusTrap() {
    document.addEventListener(
      "focus",
      (e) => {
        if (this.focusManagement.trapActive) {
          const modal = document.querySelector(
            '.modal:not([style*="display: none"])',
          );
          if (modal && !modal.contains(e.target)) {
            e.preventDefault();
            const focusableElements = this.getFocusableElements(modal);
            if (focusableElements.length > 0) {
              focusableElements[0].focus();
            }
          }
        }
      },
      true,
    );
  }

  // Get all focusable elements
  static getFocusableElements(container) {
    const selector = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(", ");

    return Array.from(container.querySelectorAll(selector));
  }

  // Focus trap for modals
  static trapFocus(container) {
    this.focusManagement.trapActive = true;
    const focusableElements = this.getFocusableElements(container);

    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    container.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    });
  }

  // Release focus trap
  static releaseFocusTrap() {
    this.focusManagement.trapActive = false;
    if (this.focusManagement.lastFocused) {
      this.focusManagement.lastFocused.focus();
    }
  }

  // Handle escape key
  static handleEscapeKey() {
    // Close modals
    const openModal = document.querySelector(
      '.modal:not([style*="display: none"])',
    );
    if (openModal) {
      const closeBtn = openModal.querySelector(
        '.close, [data-dismiss="modal"]',
      );
      if (closeBtn) {
        closeBtn.click();
      }
      this.releaseFocusTrap();
    }

    // Close dropdowns
    document
      .querySelectorAll(".dropdown.open, .menu.open")
      .forEach((dropdown) => {
        dropdown.classList.remove("open");
      });
  }

  // Enhanced tab navigation
  static enhanceTabNavigation(e) {
    // Skip hidden elements
    const target = e.target;
    if (target && this.isHidden(target)) {
      e.preventDefault();
      const direction = e.shiftKey ? -1 : 1;
      this.focusNextVisible(target, direction);
    }
  }

  // Arrow key navigation for custom components
  static handleArrowKeyNavigation(e) {
    const target = e.target;

    // Tab navigation with arrows
    if (target.getAttribute("role") === "tab") {
      e.preventDefault();
      const tabs = Array.from(
        target.closest('[role="tablist"]').querySelectorAll('[role="tab"]'),
      );
      const currentIndex = tabs.indexOf(target);
      let nextIndex;

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        nextIndex = (currentIndex + 1) % tabs.length;
      } else {
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      }

      tabs[nextIndex].focus();
    }

    // Menu navigation with arrows
    if (target.closest('[role="menu"]')) {
      e.preventDefault();
      const menuItems = Array.from(
        target.closest('[role="menu"]').querySelectorAll('[role="menuitem"]'),
      );
      const currentIndex = menuItems.indexOf(target);
      let nextIndex;

      if (e.key === "ArrowDown") {
        nextIndex = (currentIndex + 1) % menuItems.length;
      } else if (e.key === "ArrowUp") {
        nextIndex = (currentIndex - 1 + menuItems.length) % menuItems.length;
      }

      if (nextIndex !== undefined) {
        menuItems[nextIndex].focus();
      }
    }
  }

  // Handle activation keys
  static handleActivationKeys(e) {
    const target = e.target;

    // Activate custom buttons
    if (
      target.getAttribute("role") === "button" &&
      target.tagName !== "BUTTON"
    ) {
      e.preventDefault();
      target.click();
    }

    // Toggle expanded state
    if (target.getAttribute("aria-expanded")) {
      e.preventDefault();
      const isExpanded = target.getAttribute("aria-expanded") === "true";
      target.setAttribute("aria-expanded", (!isExpanded).toString());
      target.click();
    }
  }

  // Color blindness support
  static addColorBlindnessSupport() {
    // Add patterns/icons for color-coded elements
    const style = document.createElement("style");
    style.textContent = `
      .accessibility-pattern::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: repeating-linear-gradient(
          45deg,
          transparent,
          transparent 2px,
          rgba(255,255,255,0.3) 2px,
          rgba(255,255,255,0.3) 4px
        );
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
  }

  // Utility functions
  static isHidden(element) {
    const style = window.getComputedStyle(element);
    return (
      style.display === "none" ||
      style.visibility === "hidden" ||
      element.hasAttribute("hidden") ||
      element.offsetParent === null
    );
  }

  static focusNextVisible(current, direction) {
    const focusableElements = this.getFocusableElements(document);
    const currentIndex = focusableElements.indexOf(current);

    for (
      let i = currentIndex + direction;
      i >= 0 && i < focusableElements.length;
      i += direction
    ) {
      if (!this.isHidden(focusableElements[i])) {
        focusableElements[i].focus();
        break;
      }
    }
  }

  static generateId(prefix = "a11y") {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup
  static cleanup() {
    // Remove event listeners and observers
    logger.debug("♿ Cleaning up accessibility features");
  }
}

// Auto-initialize when module is imported
if (typeof window !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    AccessibilityUtils.init();
  });
}

export default AccessibilityUtils;
