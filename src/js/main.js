/**
 * Main JavaScript Entry Point
 * Initializes all universal components for the Flag Football application
 * This file should be included on all 26 pages for consistent functionality
 * 
 * Version: 2.0
 * Features:
 * - Enhanced error handling and recovery
 * - Performance monitoring and optimization
 * - Achievements system integration
 * - Service worker support
 * - Offline capabilities
 * - Advanced state management
 * - Analytics integration
 */

// Import all universal components
import { logger } from "../logger.js";
import { UniversalMobileNav } from "./components/universal-mobile-nav.js";
import { UniversalFormValidator } from "./components/universal-form-validator.js";
import { UniversalChartAccessibility } from "./components/universal-chart-accessibility.js";
import { UniversalFocusManagement } from "./components/universal-focus-management.js";
import { 
  performGlobalSearch, 
  getRecentSearches, 
  clearSearchHistory,
  highlightMatches 
} from "./services/global-search-service.js";

// Global application state
window.FlagFitApp = {
  components: {},
  utils: {},
  state: {
    initialized: false,
    online: navigator.onLine,
    performance: {
      loadTime: null,
      renderTime: null,
      metrics: {},
    },
    achievements: {
      enabled: true,
      lastChecked: null,
    },
  },
  config: {
    debug: false,
    version: "2.0.0",
    accessibility: {
      enabled: true,
      announcements: true,
      reducedMotion: false,
      highContrast: false,
    },
    mobile: {
      breakpoint: 768,
      touchTargetSize: 44,
    },
    performance: {
      monitoring: true,
      lazyLoad: true,
      prefetch: false,
    },
    offline: {
      enabled: true,
      cacheStrategy: "network-first",
    },
  },
};

// Initialize application
class FlagFitApplication {
  constructor() {
    this.initialized = false;
    this.components = new Map();
    this.eventListeners = new Map();
    this.performanceMetrics = {
      startTime: performance.now(),
      marks: new Map(),
      measures: new Map(),
    };
    this.errorCount = 0;
    this.maxErrors = 10;
    this.retryAttempts = new Map();

    this.init();
  }

  init() {
    if (this.initialized) {return;}

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
      this.performanceMark("init-start");

      // Detect user preferences
      this.detectUserPreferences();

      // Setup network status monitoring
      this.setupNetworkMonitoring();

      // Initialize service worker if available
      this.initializeServiceWorker();

      // Initialize universal components
      this.initializeUniversalComponents();

      // Initialize achievements system
      this.initializeAchievementsSystem();

      // Initialize page-specific functionality
      this.initializePageSpecific();

      // Setup global error handling
      this.setupErrorHandling();

      // Setup performance monitoring
      this.setupPerformanceMonitoring();

      // Setup analytics
      this.setupAnalytics();

      // Setup keyboard shortcuts
      this.setupKeyboardShortcuts();

      // Setup visibility change handling
      this.setupVisibilityHandling();

      this.initialized = true;
      window.FlagFitApp.state.initialized = true;

      this.performanceMark("init-end");
      this.performanceMeasure("init-duration", "init-start", "init-end");

      const initTime = this.performanceMetrics.measures.get("init-duration");
      this.log(`FlagFit application initialized successfully in ${initTime?.duration.toFixed(2)}ms`);

      // Dispatch initialization event
      document.dispatchEvent(
        new CustomEvent("flagfit:initialized", {
          detail: { 
            app: this,
            initTime: initTime?.duration,
            timestamp: Date.now(),
          },
        }),
      );
    } catch (error) {
      logger.error("Failed to initialize FlagFit application:", error);
      this.handleError("Initialization Error", error);
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

    // Listen for changes
    window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener(
      "change",
      (e) => {
        window.FlagFitApp.config.accessibility.reducedMotion = e.matches;
        document.documentElement.setAttribute(
          "data-reduced-motion",
          e.matches.toString(),
        );
      },
    );

    // Detect high contrast preference
    const prefersHighContrast = window.matchMedia(
      "(prefers-contrast: high)",
    ).matches;
    window.FlagFitApp.config.accessibility.highContrast = prefersHighContrast;
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

    // Listen for theme changes
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener(
      "change",
      (e) => {
        document.documentElement.setAttribute(
          "data-theme",
          e.matches ? "dark" : "light",
        );
      },
    );

    // Detect touch capability
    const hasTouchCapability =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (hasTouchCapability) {
      document.documentElement.setAttribute("data-touch", "true");
    }

    // Detect connection type
    if (navigator.connection) {
      const connection = navigator.connection;
      document.documentElement.setAttribute(
        "data-connection",
        connection.effectiveType || "unknown",
      );
      this.log(`Connection type: ${connection.effectiveType}`);
    }
  }

  setupNetworkMonitoring() {
    // Monitor online/offline status
    const updateOnlineStatus = () => {
      const isOnline = navigator.onLine;
      window.FlagFitApp.state.online = isOnline;
      document.documentElement.setAttribute("data-online", isOnline.toString());

      document.dispatchEvent(
        new CustomEvent("flagfit:network-status", {
          detail: { online: isOnline },
        }),
      );

      if (!isOnline && window.FlagFitApp.config.offline.enabled) {
        this.showOfflineNotification();
      } else if (isOnline) {
        this.hideOfflineNotification();
      }
    };

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    updateOnlineStatus();

    this.eventListeners.set("network-monitoring", {
      online: () => window.removeEventListener("online", updateOnlineStatus),
      offline: () => window.removeEventListener("offline", updateOnlineStatus),
    });
  }

  initializeServiceWorker() {
    if ("serviceWorker" in navigator && window.FlagFitApp.config.offline.enabled) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            this.log("Service Worker registered:", registration.scope);

            // Check for updates
            registration.addEventListener("updatefound", () => {
              const newWorker = registration.installing;
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  this.showUpdateNotification();
                }
              });
            });
          })
          .catch((error) => {
            this.log("Service Worker registration failed:", error);
          });
      });
    }
  }

  initializeAchievementsSystem() {
    if (window.achievementsService && window.FlagFitApp.state.achievements.enabled) {
      try {
        // Check achievements on initialization
        const userData = this.calculateUserDataForAchievements();
        const newAchievements = window.achievementsService.checkAchievements(userData);

        if (newAchievements.length > 0) {
          this.log(`Unlocked ${newAchievements.length} achievement(s) on initialization`);
        }

        // Schedule periodic achievement checks
        setInterval(() => {
          const data = this.calculateUserDataForAchievements();
          window.achievementsService.checkAchievements(data);
        }, 60000); // Check every minute

        window.FlagFitApp.state.achievements.lastChecked = Date.now();
        this.log("Achievements system initialized");
      } catch (error) {
        this.log("Failed to initialize achievements:", error);
      }
    }
  }

  calculateUserDataForAchievements() {
    // This will be enhanced by achievements-integration.js
    // Basic fallback data structure
    try {
      const wellnessHistory = JSON.parse(localStorage.getItem("wellnessHistory") || "[]");
      const trainingHistory = JSON.parse(localStorage.getItem("trainingHistory") || "[]");

      return {
        wellnessCount: wellnessHistory.length,
        wellnessStreak: 0,
        totalTrainingSessions: trainingHistory.length,
        hasJoinedTeam: localStorage.getItem("hasJoinedTeam") === "true",
      };
    } catch (error) {
      this.log("Error calculating achievement data:", error);
      return {};
    }
  }

  initializeUniversalComponents() {
    // Initialize global search service
    // Override the stub in top-bar.js with the actual implementation
    // Ensure it's always available globally
    window.performGlobalSearch = performGlobalSearch;
    window.getRecentSearches = getRecentSearches;
    window.clearSearchHistory = clearSearchHistory;
    window.highlightMatches = highlightMatches;
    
    // Initialize mobile navigation
    if (document.querySelector(".sidebar, .mobile-menu-toggle, nav")) {
      this.components.set("mobileNav", new UniversalMobileNav());
      window.FlagFitApp.components.mobileNav = this.components.get("mobileNav");
    }

    // Initialize enhanced sidebar navigation if sidebar exists
    // This will be auto-initialized by sidebar-loader, but we ensure it's available
    if (document.getElementById('sidebar') && window.enhancedSidebarNav) {
      this.components.set("enhancedSidebarNav", window.enhancedSidebarNav);
      window.FlagFitApp.components.enhancedSidebarNav = window.enhancedSidebarNav;
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
    const errorHandler = (e) => {
      this.errorCount++;
      this.handleError("JavaScript Error", e.error || e.message);
      
      // Prevent error loops
      if (this.errorCount > this.maxErrors) {
        this.log("Too many errors detected. Disabling error reporting.");
        window.removeEventListener("error", errorHandler);
      }
    };

    const rejectionHandler = (e) => {
      this.errorCount++;
      this.handleError("Promise Rejection", e.reason);
    };

    window.addEventListener("error", errorHandler);
    window.addEventListener("unhandledrejection", rejectionHandler);

    this.eventListeners.set("error-handling", {
      error: () => window.removeEventListener("error", errorHandler),
      rejection: () => window.removeEventListener("unhandledrejection", rejectionHandler),
    });
  }

  setupPerformanceMonitoring() {
    if (!window.FlagFitApp.config.performance.monitoring) {
      return;
    }

    // Performance marks
    this.performanceMark("performance-monitoring-start");

    // Monitor page load
    if ("performance" in window) {
      window.addEventListener("load", () => {
        const perfData = performance.timing;
        const loadTime = perfData.loadEventEnd - perfData.navigationStart;
        const domContentLoaded = perfData.domContentLoadedEventEnd - perfData.navigationStart;
        const firstPaint = performance.getEntriesByType("paint")[0]?.startTime || 0;

        window.FlagFitApp.state.performance.loadTime = loadTime;
        window.FlagFitApp.state.performance.renderTime = firstPaint;
        window.FlagFitApp.state.performance.metrics = {
          loadTime,
          domContentLoaded,
          firstPaint,
          navigationStart: perfData.navigationStart,
        };

        this.log(`Performance metrics - Load: ${loadTime}ms, DOMContentLoaded: ${domContentLoaded}ms, First Paint: ${firstPaint.toFixed(2)}ms`);

        // Report to analytics if available
        if (window.analytics && window.analytics.track) {
          window.analytics.track("performance", {
            loadTime,
            domContentLoaded,
            firstPaint,
            page: this.getCurrentPage(),
          });
        }
      });

      // Monitor long tasks
      if ("PerformanceObserver" in window) {
        try {
          const longTaskObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.duration > 50) {
                this.log(`Long task detected: ${entry.duration.toFixed(2)}ms`);
              }
            }
          });
          longTaskObserver.observe({ entryTypes: ["longtask"] });
        } catch (e) {
          // Long task observer not supported
        }

        // Monitor layout shifts
        try {
          const clsObserver = new PerformanceObserver((list) => {
            let clsValue = 0;
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            }
            if (clsValue > 0.1) {
              this.log(`Cumulative Layout Shift: ${clsValue.toFixed(4)}`);
            }
          });
          clsObserver.observe({ entryTypes: ["layout-shift"] });
        } catch (e) {
          // Layout shift observer not supported
        }
      }
    }

    this.performanceMark("performance-monitoring-end");
  }

  performanceMark(name) {
    if ("performance" in window && "mark" in performance) {
      performance.mark(name);
      this.performanceMetrics.marks.set(name, performance.now());
    }
  }

  performanceMeasure(name, startMark, endMark) {
    if ("performance" in window && "measure" in performance) {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name)[0];
        if (measure) {
          this.performanceMetrics.measures.set(name, measure);
        }
      } catch (e) {
        this.log(`Performance measure failed: ${e.message}`);
      }
    }
  }

  setupAnalytics() {
    // Initialize analytics if available
    if (window.analytics && typeof window.analytics.init === "function") {
      try {
        window.analytics.init();
        this.log("Analytics initialized");
      } catch (error) {
        this.log("Analytics initialization failed:", error);
      }
    }

    // Track page views
    const currentPage = this.getCurrentPage();
    if (window.analytics && window.analytics.track) {
      window.analytics.track("page_view", {
        page: currentPage,
        url: window.location.href,
        timestamp: Date.now(),
      });
    }
  }

  setupKeyboardShortcuts() {
    // Global keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      // Ctrl/Cmd + K for search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="search"], .search-input');
        if (searchInput) {
          searchInput.focus();
        }
      }

      // Escape to close modals
      if (e.key === "Escape") {
        const openModal = document.querySelector(".modal.show, [role='dialog'][aria-hidden='false']");
        if (openModal) {
          const closeButton = openModal.querySelector('[data-dismiss="modal"], .modal-close');
          if (closeButton) {
            closeButton.click();
          }
        }
      }
    });
  }

  setupVisibilityHandling() {
    // Handle page visibility changes
    document.addEventListener("visibilitychange", () => {
      const isVisible = !document.hidden;
      document.dispatchEvent(
        new CustomEvent("flagfit:visibility-change", {
          detail: { visible: isVisible },
        }),
      );

      if (isVisible) {
        // Page became visible - refresh data if needed
        this.handlePageVisible();
      } else {
        // Page hidden - pause updates
        this.handlePageHidden();
      }
    });
  }

  handlePageVisible() {
    // Refresh achievements when page becomes visible
    if (window.achievementsService && window.FlagFitApp.state.achievements.enabled) {
      const userData = this.calculateUserDataForAchievements();
      window.achievementsService.checkAchievements(userData);
    }
  }

  handlePageHidden() {
    // Pause any active timers or animations
    this.log("Page hidden - pausing updates");
  }

  showOfflineNotification() {
    // Show offline notification
    const existing = document.getElementById("offline-notification");
    if (existing) {
      return;
    }

    const notification = document.createElement("div");
    notification.id = "offline-notification";
    notification.className = "offline-notification";
    notification.setAttribute("role", "alert");
    notification.innerHTML = `
      <div class="offline-notification-content">
        <span class="offline-icon">📡</span>
        <span class="offline-message">You're currently offline. Some features may be limited.</span>
      </div>
    `;

    // Add styles if not already present
    if (!document.getElementById("offline-notification-styles")) {
      const style = document.createElement("style");
      style.id = "offline-notification-styles";
      style.textContent = `
        .offline-notification {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: #f59e0b;
          color: white;
          padding: 12px 16px;
          text-align: center;
          z-index: 10000;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .offline-notification-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .offline-icon {
          font-size: 1.2rem;
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);
  }

  hideOfflineNotification() {
    const notification = document.getElementById("offline-notification");
    if (notification) {
      notification.remove();
    }
  }

  showUpdateNotification() {
    // Show service worker update notification
    const notification = document.createElement("div");
    notification.className = "update-notification";
    notification.innerHTML = `
      <div class="update-notification-content">
        <span>New version available!</span>
        <button onclick="window.location.reload()" class="update-button">Update Now</button>
      </div>
    `;

    // Add styles
    if (!document.getElementById("update-notification-styles")) {
      const style = document.createElement("style");
      style.id = "update-notification-styles";
      style.textContent = `
        .update-notification {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: var(--brand-primary-700, #089949);
          color: white;
          padding: 16px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          z-index: 10000;
          max-width: 300px;
        }
        .update-notification-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .update-button {
          background: white;
          color: var(--brand-primary-700, #089949);
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Auto-dismiss after 10 seconds
    setTimeout(() => {
      notification.remove();
    }, 10000);
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

  handleError(type, error, retryable = false) {
    const errorInfo = {
      type,
      message: error?.message || error?.toString() || String(error),
      stack: error?.stack,
      page: this.getCurrentPage(),
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    if (window.FlagFitApp.config.debug) {
      logger.error(`${type}:`, errorInfo);
    }

    // Report error to analytics service if available
    if (window.analytics && window.analytics.track) {
      window.analytics.track("error", errorInfo);
    }

    // Retry logic for retryable errors
    if (retryable && error?.retry) {
      const retryKey = `${type}-${errorInfo.message}`;
      const attempts = this.retryAttempts.get(retryKey) || 0;
      
      if (attempts < 3) {
        this.retryAttempts.set(retryKey, attempts + 1);
        setTimeout(() => {
          try {
            error.retry();
          } catch (retryError) {
            this.handleError(`${type} (Retry ${attempts + 1})`, retryError);
          }
        }, 1000 * (attempts + 1)); // Exponential backoff
      }
    }

    // Show user-friendly error message for critical errors
    if (type.includes("Critical") || type.includes("Fatal")) {
      this.showErrorNotification(errorInfo.message);
    }
  }

  showErrorNotification(message) {
    const notification = document.createElement("div");
    notification.className = "error-notification";
    notification.setAttribute("role", "alert");
    notification.innerHTML = `
      <div class="error-notification-content">
        <span class="error-icon">⚠️</span>
        <span class="error-message">${message}</span>
        <button class="error-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    // Add styles if not already present
    if (!document.getElementById("error-notification-styles")) {
      const style = document.createElement("style");
      style.id = "error-notification-styles";
      style.textContent = `
        .error-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #ef4444;
          color: white;
          padding: 16px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          z-index: 10001;
          max-width: 400px;
          animation: slideInRight 0.3s ease-out;
        }
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .error-notification-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .error-close {
          background: transparent;
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
          margin-left: auto;
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  log(message, ...args) {
    if (window.FlagFitApp.config.debug) {
      logger.debug(`[FlagFit] ${message}`, ...args);
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
        try {
          component.destroy();
        } catch (error) {
          this.log("Error destroying component:", error);
        }
      }
    });

    // Remove event listeners
    this.eventListeners.forEach((listeners) => {
      Object.values(listeners).forEach((cleanup) => {
        if (typeof cleanup === "function") {
          cleanup();
        }
      });
    });

    this.components.clear();
    this.eventListeners.clear();
    this.retryAttempts.clear();
    this.initialized = false;
    window.FlagFitApp.state.initialized = false;

    this.log("FlagFit application destroyed");
  }

  // Public API methods
  getPerformanceMetrics() {
    return {
      ...window.FlagFitApp.state.performance,
      marks: Array.from(this.performanceMetrics.marks.entries()),
      measures: Array.from(this.performanceMetrics.measures.entries()),
    };
  }

  getState() {
    return { ...window.FlagFitApp.state };
  }

  isOnline() {
    return window.FlagFitApp.state.online;
  }
}

// Initialize the application
const app = new FlagFitApplication();

// Expose app instance globally
window.FlagFitApp.instance = app;

// Export for module usage
export { FlagFitApplication };
