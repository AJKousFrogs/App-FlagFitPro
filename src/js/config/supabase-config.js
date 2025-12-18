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

(function() {
  'use strict';

  // Get configuration from environment variables
  // In production, these should be set via build process or environment variables
  // In development, they should be set by dev servers (dev-server.cjs, etc.) via window._env
  // Note: This file is loaded as a regular script, not a module, so we can't use import.meta.env
  // SECURITY: Never hardcode credentials here - they should come from environment variables only
  const SUPABASE_URL = 
    (typeof window !== 'undefined' && window._env?.SUPABASE_URL) ||
    null;

  const SUPABASE_ANON_KEY = 
    (typeof window !== 'undefined' && window._env?.SUPABASE_ANON_KEY) ||
    null;

  // Set window._env for compatibility with existing code
  if (typeof window !== 'undefined') {
    window._env = window._env || {};
    window._env.SUPABASE_URL = SUPABASE_URL;
    window._env.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
    
    // Warn if credentials are missing (development only)
    if ((!SUPABASE_URL || !SUPABASE_ANON_KEY) && 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      console.warn('[Supabase Config] Missing credentials. Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
      console.warn('[Supabase Config] Or set them in localStorage for local development.');
    }
  }

  // Export for ES modules
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SUPABASE_URL, SUPABASE_ANON_KEY };
  }
})();

