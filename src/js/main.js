/**
 * Main JavaScript Entry Point
 * Initializes all universal components for the Flag Football application
 * This file should be included on all 26 pages for consistent functionality
 */

// Import all universal components
import { UniversalMobileNav } from "./components/universal-mobile-nav.js";
import { UniversalFormValidator } from "./components/universal-form-validator.js";
import { UniversalChartAccessibility } from "./components/universal-chart-accessibility.js";
import { UniversalFocusManagement } from "./components/universal-focus-management.js";

// Global application state
window.FlagFitApp = {
  components: {},
  utils: {},
  config: {
    debug: false,
    accessibility: {
      enabled: true,
      announcements: true,
      reducedMotion: false,
    },
    mobile: {
      breakpoint: 768,
      touchTargetSize: 44,
    },
  },
};

// Initialize application
class FlagFitApplication {
  constructor() {
    this.initialized = false;
    this.components = new Map();

    this.init();
  }

  init() {
    if (this.initialized) return;

    // Wait for DOM to be ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () =>
        this.initializeComponents(),
      );
    } else {
      this.initializeComponents();
    }
  }

  initializeComponents() {
    try {
      // Detect user preferences
      this.detectUserPreferences();

      // Initialize universal components
      this.initializeUniversalComponents();

      // Initialize page-specific functionality
      this.initializePageSpecific();

      // Setup global error handling
      this.setupErrorHandling();

      // Setup performance monitoring
      this.setupPerformanceMonitoring();

      this.initialized = true;
      this.log("FlagFit application initialized successfully");

      // Dispatch initialization event
      document.dispatchEvent(
        new CustomEvent("flagfit:initialized", {
          detail: { app: this },
        }),
      );
    } catch (error) {
      console.error("Failed to initialize FlagFit application:", error);
    }
  }

  detectUserPreferences() {
    // Detect reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    window.FlagFitApp.config.accessibility.reducedMotion = prefersReducedMotion;

    if (prefersReducedMotion) {
      document.documentElement.setAttribute("data-reduced-motion", "true");
    }

    // Detect high contrast preference
    const prefersHighContrast = window.matchMedia(
      "(prefers-contrast: high)",
    ).matches;
    if (prefersHighContrast) {
      document.documentElement.setAttribute("data-high-contrast", "true");
    }

    // Detect dark mode preference
    const prefersDarkMode = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    if (prefersDarkMode) {
      document.documentElement.setAttribute("data-theme", "dark");
    }

    // Detect touch capability
    const hasTouchCapability =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (hasTouchCapability) {
      document.documentElement.setAttribute("data-touch", "true");
    }
  }

  initializeUniversalComponents() {
    // Initialize mobile navigation
    if (document.querySelector(".sidebar, .mobile-menu-toggle, nav")) {
      this.components.set("mobileNav", new UniversalMobileNav());
      window.FlagFitApp.components.mobileNav = this.components.get("mobileNav");
    }

    // Initialize form validation for pages with forms
    const forms = document.querySelectorAll("form");
    if (forms.length > 0) {
      forms.forEach((form, index) => {
        const validator = new UniversalFormValidator(form);
        this.components.set(`formValidator${index}`, validator);
      });
      window.FlagFitApp.components.formValidators = Array.from(
        this.components.values(),
      ).filter((comp) => comp instanceof UniversalFormValidator);
    }

    // Initialize chart accessibility for pages with charts
    const charts = document.querySelectorAll(
      'canvas[id*="chart"], canvas[id*="Chart"], .chart-canvas canvas',
    );
    if (charts.length > 0) {
      this.components.set(
        "chartAccessibility",
        new UniversalChartAccessibility(),
      );
      window.FlagFitApp.components.chartAccessibility =
        this.components.get("chartAccessibility");
    }

    // Initialize focus management (always active)
    this.components.set("focusManagement", new UniversalFocusManagement());
    window.FlagFitApp.components.focusManagement =
      this.components.get("focusManagement");
  }

  initializePageSpecific() {
    // Get current page from URL or body class
    const currentPage = this.getCurrentPage();

    switch (currentPage) {
      case "dashboard":
        this.initializeDashboard();
        break;
      case "analytics":
      case "enhanced-analytics":
        this.initializeAnalytics();
        break;
      case "training":
        this.initializeTraining();
        break;
      case "community":
        this.initializeCommunity();
        break;
      case "settings":
        this.initializeSettings();
        break;
      default:
        this.initializeGeneric();
        break;
    }
  }

  getCurrentPage() {
    // Try to determine current page from various sources
    const pathname = window.location.pathname;
    const filename = pathname.split("/").pop().replace(".html", "");

    // Check body class
    const bodyClass = document.body.className;
    const pageClasses = [
      "dashboard",
      "analytics",
      "training",
      "community",
      "settings",
    ];

    for (const pageClass of pageClasses) {
      if (bodyClass.includes(pageClass)) {
        return pageClass;
      }
    }

    // Check filename
    if (filename && filename !== "index") {
      return filename;
    }

    // Default fallback
    return "generic";
  }

  initializeDashboard() {
    this.log("Initializing dashboard-specific functionality");

    // Initialize dashboard charts if not already done
    this.initializeChartsIfNeeded();

    // Setup real-time updates
    this.setupRealtimeUpdates();
  }

  initializeAnalytics() {
    this.log("Initializing analytics-specific functionality");

    // Enhanced chart interactions
    this.initializeChartsIfNeeded();

    // Setup analytics filters
    this.setupAnalyticsFilters();
  }

  initializeTraining() {
    this.log("Initializing training-specific functionality");

    // Setup training module interactions
    this.setupTrainingModules();
  }

  initializeCommunity() {
    this.log("Initializing community-specific functionality");

    // Setup community interactions
    this.setupCommunityFeatures();
  }

  initializeSettings() {
    this.log("Initializing settings-specific functionality");

    // Setup settings form handling
    this.setupSettingsHandling();
  }

  initializeGeneric() {
    this.log("Initializing generic page functionality");

    // Setup common interactions
    this.setupCommonInteractions();
  }

  initializeChartsIfNeeded() {
    // Additional chart setup beyond accessibility
    const charts = document.querySelectorAll(
      'canvas[id*="chart"], canvas[id*="Chart"]',
    );

    charts.forEach((chart) => {
      // Setup chart resize handling
      const resizeObserver = new ResizeObserver(() => {
        if (chart.chart && chart.chart.resize) {
          chart.chart.resize();
        }
      });
      resizeObserver.observe(chart.parentElement);
    });
  }

  setupRealtimeUpdates() {
    // Setup real-time data updates for dashboard
    // This would connect to WebSockets or polling mechanisms
    this.log("Real-time updates initialized");
  }

  setupAnalyticsFilters() {
    // Setup analytics filter interactions
    const filterButtons = document.querySelectorAll(
      ".filter-btn, .analytics-filter",
    );

    filterButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        // Handle filter logic
        this.handleAnalyticsFilter(btn);
      });
    });
  }

  setupTrainingModules() {
    // Setup training module interactions
    const trainingCards = document.querySelectorAll(
      ".training-card, .exercise-card",
    );

    trainingCards.forEach((card) => {
      card.addEventListener("click", (_e) => {
        // Handle training module selection
        this.handleTrainingModuleSelect(card);
      });
    });
  }

  setupCommunityFeatures() {
    // Setup community-specific features
    const postButtons = document.querySelectorAll(".post-btn, .comment-btn");

    postButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        // Handle community interactions
        this.handleCommunityInteraction(btn);
      });
    });
  }

  setupSettingsHandling() {
    // Setup settings form handling
    const settingsForm = document.querySelector(
      ".settings-form, #settings-form",
    );

    if (settingsForm) {
      settingsForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleSettingsSave(settingsForm);
      });
    }
  }

  setupCommonInteractions() {
    // Setup common page interactions
    this.setupTooltips();
    this.setupDropdowns();
    this.setupModals();
  }

  setupTooltips() {
    const tooltipElements = document.querySelectorAll(
      "[data-tooltip], [title]",
    );

    tooltipElements.forEach((element) => {
      // Basic tooltip functionality
      element.addEventListener("mouseenter", (e) => {
        this.showTooltip(e.target);
      });

      element.addEventListener("mouseleave", (_e) => {
        this.hideTooltip();
      });
    });
  }

  setupDropdowns() {
    const dropdownToggles = document.querySelectorAll(
      '.dropdown-toggle, [data-toggle="dropdown"]',
    );

    dropdownToggles.forEach((toggle) => {
      toggle.addEventListener("click", (e) => {
        e.preventDefault();
        this.toggleDropdown(toggle);
      });
    });
  }

  setupModals() {
    const modalTriggers = document.querySelectorAll(
      '[data-toggle="modal"], .modal-trigger',
    );

    modalTriggers.forEach((trigger) => {
      trigger.addEventListener("click", (e) => {
        e.preventDefault();
        const targetModal =
          trigger.getAttribute("data-target") || trigger.getAttribute("href");
        this.showModal(targetModal);
      });
    });
  }

  setupErrorHandling() {
    // Global error handling
    window.addEventListener("error", (e) => {
      this.handleError("JavaScript Error", e.error);
    });

    window.addEventListener("unhandledrejection", (e) => {
      this.handleError("Promise Rejection", e.reason);
    });
  }

  setupPerformanceMonitoring() {
    // Basic performance monitoring
    if ("performance" in window) {
      window.addEventListener("load", () => {
        const loadTime =
          performance.timing.loadEventEnd - performance.timing.navigationStart;
        this.log(`Page load time: ${loadTime}ms`);
      });
    }
  }

  // Event handlers
  handleAnalyticsFilter(button) {
    // Analytics filter logic
    this.log(`Analytics filter clicked: ${button.textContent}`);
  }

  handleTrainingModuleSelect(card) {
    // Training module selection logic
    this.log(`Training module selected: ${card.textContent}`);
  }

  handleCommunityInteraction(button) {
    // Community interaction logic
    this.log(`Community interaction: ${button.textContent}`);
  }

  handleSettingsSave(_form) {
    // Settings save logic
    this.log("Settings form submitted");
  }

  showTooltip(element) {
    // Tooltip display logic
    const content =
      element.getAttribute("data-tooltip") || element.getAttribute("title");
    if (content) {
      // Create and show tooltip
    }
  }

  hideTooltip() {
    // Hide tooltip logic
    const existingTooltip = document.querySelector(".tooltip");
    if (existingTooltip) {
      existingTooltip.remove();
    }
  }

  toggleDropdown(toggle) {
    // Dropdown toggle logic
    const dropdown =
      toggle.nextElementSibling ||
      document.querySelector(toggle.getAttribute("data-target"));

    if (dropdown) {
      dropdown.classList.toggle("show");
    }
  }

  showModal(target) {
    // Modal display logic
    const modal = document.querySelector(target);
    if (modal) {
      modal.classList.add("show");
      // Focus trap will be handled by focus management component
    }
  }

  handleError(type, error) {
    if (window.FlagFitApp.config.debug) {
      console.error(`${type}:`, error);
    }

    // Report error to analytics service if available
    if (window.analytics && window.analytics.track) {
      window.analytics.track("error", {
        type: type,
        message: error.message || error,
        page: this.getCurrentPage(),
      });
    }
  }

  log(message, ...args) {
    if (window.FlagFitApp.config.debug) {
      console.log(`[FlagFit] ${message}`, ...args);
    }
  }

  // Public API methods
  getComponent(name) {
    return this.components.get(name);
  }

  getAllComponents() {
    return Array.from(this.components.values());
  }

  enableDebugMode() {
    window.FlagFitApp.config.debug = true;
    this.log("Debug mode enabled");
  }

  disableDebugMode() {
    window.FlagFitApp.config.debug = false;
  }

  destroy() {
    // Cleanup all components
    this.components.forEach((component) => {
      if (component.destroy && typeof component.destroy === "function") {
        component.destroy();
      }
    });

    this.components.clear();
    this.initialized = false;

    this.log("FlagFit application destroyed");
  }
}

// Initialize the application
const app = new FlagFitApplication();

// Expose app instance globally
window.FlagFitApp.instance = app;

// Export for module usage
export { FlagFitApplication };
