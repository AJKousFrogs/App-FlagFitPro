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

  // Get configuration from environment or use defaults
  // In production, these should be set via build process or environment variables
  const SUPABASE_URL = 
    typeof window !== 'undefined' && window._env?.SUPABASE_URL ||
    import.meta.env?.VITE_SUPABASE_URL ||
    'https://pvziciccwxgftcielknm.supabase.co';

  const SUPABASE_ANON_KEY = 
    typeof window !== 'undefined' && window._env?.SUPABASE_ANON_KEY ||
    import.meta.env?.VITE_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2emljaWNjd3hnZnRjaWVsa25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MzcwNTgsImV4cCI6MjA3NTExMzA1OH0.1nfJrtWPl6DrAwvjGvM1-CZBeyYgCaV9oDdaadpqhLU';

  // Set window._env for compatibility with existing code
  if (typeof window !== 'undefined') {
    window._env = window._env || {};
    window._env.SUPABASE_URL = SUPABASE_URL;
    window._env.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
  }

  // Export for ES modules
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SUPABASE_URL, SUPABASE_ANON_KEY };
  }
})();

