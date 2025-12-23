/**
 * Supabase Configuration
 * Centralized configuration for Supabase client initialization
 *
 * This file sets window._env which is used by:
 * - HTML files (via script tag)
 * - supabase-client.js (via window._env)
 *
 * For production, these values should come from environment variables.
 * For development, they can be set here or via localStorage.
 */

(function () {
  "use strict";

  // Get configuration from environment variables
  // In production, these should be set via build process or environment variables
  // In development, they should be set by dev servers (dev-server.cjs, etc.) via window._env
  // Note: This file is loaded as a regular script, not a module, so we can't use import.meta.env
  // SECURITY: Never hardcode credentials here - they should come from environment variables only

  // Check multiple sources in order of preference:
  // 1. window._env (set by build process, dev server, or inline script)
  // 2. localStorage (for local development/testing)
  const getConfigValue = (key) => {
    if (typeof window === "undefined") {
      return null;
    }

    // First check window._env (set by build process or inline script)
    if (window._env && window._env[key]) {
      return window._env[key];
    }

    // Fallback to localStorage for development
    const isDevelopment =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (isDevelopment) {
      const stored = localStorage.getItem(key);
      if (stored) {
        return stored;
      }
    }

    return null;
  };

  const SUPABASE_URL = getConfigValue("SUPABASE_URL");
  const SUPABASE_ANON_KEY = getConfigValue("SUPABASE_ANON_KEY");

  // Set window._env for compatibility with existing code
  if (typeof window !== "undefined") {
    window._env = window._env || {};
    window._env.SUPABASE_URL = SUPABASE_URL;
    window._env.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

    // Warn if credentials are missing
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      const isDevelopment =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

      if (isDevelopment) {
        // Note: This is a config file loaded as a script, not a module
        // Using console.warn here is acceptable as logger may not be available yet
        // eslint-disable-next-line no-console
        console.warn(
          "[Supabase Config] Missing credentials. Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.",
        );
        // eslint-disable-next-line no-console
        console.warn(
          "[Supabase Config] Or set them in localStorage for local development.",
        );
      } else {
        // Production: More detailed error message
        // Note: This is a config file loaded as a script, not a module
        // Using console.error here is acceptable as logger may not be available yet
        // eslint-disable-next-line no-console
        console.error(
          "[Supabase Config] CRITICAL: Missing Supabase configuration in production",
        );
        // eslint-disable-next-line no-console
        console.error(
          "[Supabase Config] Environment variables VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set during build.",
        );
        // eslint-disable-next-line no-console
        console.error(
          "[Supabase Config] Check Netlify build logs and ensure variables are set in Netlify UI.",
        );
        // eslint-disable-next-line no-console
        console.error("[Supabase Config] window._env:", window._env);
      }
    }
  }

  // Export for ES modules
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { SUPABASE_URL, SUPABASE_ANON_KEY };
  }
})();
