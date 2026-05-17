/* ============================================================================
 * Theme toggle — persists across pages via localStorage.
 * Default is "dark" (matches the redesign direction).
 * Each mockup page should include this script in <head>.
 * ============================================================================ */
(function () {
  var STORAGE_KEY = "flagfit-mockup-theme";
  var DEFAULT_THEME = "dark";

  function getStoredTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME;
    } catch (_) {
      return DEFAULT_THEME;
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    var label = document.querySelector("[data-theme-label]");
    if (label) label.textContent = theme === "dark" ? "Light mode" : "Dark mode";
  }

  function setTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (_) { /* ignore */ }
    applyTheme(theme);
  }

  // Apply early to prevent FOUC
  applyTheme(getStoredTheme());

  // Wire toggle once DOM is ready
  document.addEventListener("DOMContentLoaded", function () {
    applyTheme(getStoredTheme());
    var btn = document.querySelector("[data-theme-toggle]");
    if (btn) {
      btn.addEventListener("click", function () {
        var current = document.documentElement.getAttribute("data-theme") || DEFAULT_THEME;
        setTheme(current === "dark" ? "light" : "dark");
      });
    }
  });
})();
