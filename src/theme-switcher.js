// Theme Switcher - Toggle between light and dark mode
// Handles theme switching and persistence

// Optional logger - use if available, otherwise fallback to console
let logger;
try {
  // Try to import logger if available
  if (typeof window !== 'undefined' && window.logger) {
    logger = window.logger;
  } else {
    // Create a simple logger fallback
    logger = {
      debug: (...args) => {
        if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
          console.log(...args);
        }
      },
      info: (...args) => console.log(...args),
      warn: (...args) => console.warn(...args),
      error: (...args) => console.error(...args)
    };
  }
} catch (e) {
  // Fallback logger if import fails
  logger = {
    debug: (...args) => {
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.log(...args);
      }
    },
    info: (...args) => console.log(...args),
    warn: (...args) => console.warn(...args),
    error: (...args) => console.error(...args)
  };
}

class ThemeSwitcher {
  constructor() {
    this.currentTheme = localStorage.getItem("theme") || "light";
    this.init();
  }

  init() {
    // Wait for DOM to be ready if needed
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initializeTheme());
    } else {
      this.initializeTheme();
    }
  }

  initializeTheme() {
    // Apply saved theme on load
    this.applyTheme(this.currentTheme);

    // Create toggle switch or attach listeners to existing one
    this.createToggleSwitch();

    // Listen for system preference changes
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      mediaQuery.addEventListener("change", (e) => {
        if (!localStorage.getItem("theme")) {
          this.applyTheme(e.matches ? "dark" : "light");
        }
      });
    }
  }

  createToggleSwitch() {
    // Check if toggle already exists in HTML - attach listeners instead of creating
    const existingToggle = document.getElementById("theme-toggle");
    const headerToggle = document.getElementById("header-theme-toggle");

    if (existingToggle || headerToggle) {
      // Toggle already exists in HTML - attach event listeners and initialize state
      const toggle = existingToggle || headerToggle;

      // Initialize toggle state based on saved theme
      toggle.checked = this.currentTheme === "dark";

      // Update toggle text and visual state
      this.updateToggleText(this.currentTheme);

      // Remove any existing listeners to avoid duplicates
      const newToggle = toggle.cloneNode(true);
      toggle.parentNode.replaceChild(newToggle, toggle);

      // Add event listener to the new toggle
      newToggle.addEventListener("change", (e) => {
        const newTheme = e.target.checked ? "dark" : "light";
        this.switchTheme(newTheme);
      });

      return;
    }

    // Find header-right or create container
    // Don't create toggle on landing page (index.html) - it doesn't have header-right
    const headerRight = document.querySelector(".header-right");
    if (!headerRight) {
      // Silently fail - landing page doesn't need theme toggle in header
      return;
    }

    // Create toggle container
    const toggleContainer = document.createElement("div");
    toggleContainer.className = "theme-toggle-container";
    const isDark = this.currentTheme === "dark";
    toggleContainer.innerHTML = `
            <label class="theme-toggle-label" title="Toggle ${isDark ? "Light" : "Dark"} Mode">
                <input type="checkbox" id="theme-toggle" class="theme-toggle-input" ${isDark ? "checked" : ""}>
                <span class="theme-toggle-slider"></span>
                <span class="theme-toggle-text">${isDark ? "Dark" : "Light"}</span>
            </label>
        `;

    // Insert before user menu
    const userMenu = headerRight.querySelector(".user-menu");
    if (userMenu) {
      headerRight.insertBefore(toggleContainer, userMenu);
    } else {
      headerRight.appendChild(toggleContainer);
    }

    // Add event listener
    const toggle = document.getElementById("theme-toggle");
    if (toggle) {
      toggle.addEventListener("change", (e) => {
        const newTheme = e.target.checked ? "dark" : "light";
        this.switchTheme(newTheme);
      });
    }
  }

  switchTheme(theme) {
    this.currentTheme = theme;
    localStorage.setItem("theme", theme);
    this.applyTheme(theme);
    this.updateToggleText(theme);
  }

  applyTheme(theme) {
    logger.debug("🎨 Applying theme:", theme);

    // Set data-theme attribute on html FIRST - this updates CSS variables
    document.documentElement.setAttribute("data-theme", theme);

    // Then set on body - this applies element-specific styles
    document.body.setAttribute("data-theme", theme);

    // Verify it was set
    logger.debug(
      "✅ data-theme set on html:",
      document.documentElement.getAttribute("data-theme"),
    );
    logger.debug(
      "✅ data-theme set on body:",
      document.body.getAttribute("data-theme"),
    );

    // Force CSS variable recalculation by accessing computed styles
    const htmlStyles = window.getComputedStyle(document.documentElement);
    const bodyStyles = window.getComputedStyle(document.body);
    void htmlStyles.getPropertyValue("--surface-primary");
    void bodyStyles.backgroundColor;

    // Note: Theme styles are applied via CSS selectors [data-theme="dark"] and [data-theme="light"]
    // in dashboard.html and comprehensive-design-system.css. CSS variables are overridden in
    // html[data-theme] selectors to ensure they update when theme changes.

    // Update toggle state - check both possible toggle IDs
    const toggle = document.getElementById("theme-toggle");
    if (toggle) {
      // Toggle checked = dark theme, unchecked = light theme
      toggle.checked = theme === "dark";
      logger.debug(
        "✅ Toggle state updated:",
        toggle.checked,
        "for theme:",
        theme,
      );
    }

    // Also update header-theme-toggle if it exists (for dashboard.html)
    const headerToggle = document.getElementById("header-theme-toggle");
    if (headerToggle) {
      headerToggle.checked = theme === "dark";
      // Update the visual toggle dot and text within the header toggle container
      const toggleContainer = headerToggle.closest(".theme-toggle-container");
      if (toggleContainer) {
        const toggleDot = toggleContainer.querySelector("#theme-toggle-dot");
        const toggleText = toggleContainer.querySelector(".theme-toggle-text");
        const toggleSlider = toggleContainer.querySelector(
          ".theme-toggle-slider",
        );
        if (toggleDot && toggleText && toggleSlider) {
          if (theme === "dark") {
            toggleDot.style.transform = "translateX(26px)";
            toggleSlider.style.background = "#10c96b";
            toggleText.textContent = "🌙 Dark";
          } else {
            toggleDot.style.transform = "translateX(0px)";
            toggleSlider.style.background = "#e2e8f0";
            toggleText.textContent = "☀️ Light";
          }
        }
      }
    }

    // Update text to match toggle state
    this.updateToggleText(theme);

    // Force a style recalculation to ensure CSS updates
    void document.body.offsetHeight;

    // Force re-render of icons if Lucide is loaded
    if (typeof lucide !== "undefined") {
      setTimeout(() => {
        lucide.createIcons();
      }, 100);
    }

    // Log computed styles for debugging
    setTimeout(() => {
      const computedBg = window.getComputedStyle(document.body).backgroundColor;
      const computedColor = window.getComputedStyle(document.body).color;
      logger.debug("✅ Computed body background:", computedBg);
      logger.debug("✅ Computed body color:", computedColor);
    }, 10);
  }

  updateToggleText(theme) {
    // Update all theme toggle text elements
    const textElements = document.querySelectorAll(".theme-toggle-text");
    textElements.forEach((textElement) => {
      // Check if it's the header toggle (has emoji)
      const container = textElement.closest(".theme-toggle-container");
      if (container && container.querySelector("#header-theme-toggle")) {
        textElement.textContent = theme === "dark" ? "🌙 Dark" : "☀️ Light";
      } else {
        textElement.textContent = theme === "dark" ? "Dark" : "Light";
      }
    });
  }
}

// Initialize theme switcher
let themeSwitcher;
if (typeof window !== "undefined") {
  // Since script is loaded with defer, DOM is already ready
  // But check just in case it's not
  if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", () => {
      if (!themeSwitcher) {
        themeSwitcher = new ThemeSwitcher();
        window.themeSwitcher = themeSwitcher;
      }
    });
  } else {
    // DOM is already ready
    if (!themeSwitcher) {
      themeSwitcher = new ThemeSwitcher();
      window.themeSwitcher = themeSwitcher;
    }
  }
}

// Export for module use
if (typeof module !== "undefined" && module.exports) {
  module.exports = ThemeSwitcher;
}

// Make class available globally
window.ThemeSwitcher = ThemeSwitcher;
