// SECURITY WARNING: These values should be replaced during build with environment variables
// For local development, set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
// For production builds, use Angular's environment file replacement mechanism
//
// NOTE: process.env doesn't work in browser - use build-time replacement or inject via script tag
// For development, these can be injected via window._env by dev server
export const environment = {
  production: false,
  apiUrl: "http://localhost:3001", // Backend API server
  supabase: {
    // These will be replaced during build via Angular's file replacement
    // For local dev, check window._env (set by dev server) or use build script
    // Fallback to empty string - SupabaseService should handle missing config gracefully
    url:
      (typeof window !== "undefined" && (window as any)._env?.SUPABASE_URL) ||
      (typeof window !== "undefined" &&
        (window as any)._env?.VITE_SUPABASE_URL) ||
      "",
    anonKey:
      (typeof window !== "undefined" &&
        (window as any)._env?.SUPABASE_ANON_KEY) ||
      (typeof window !== "undefined" &&
        (window as any)._env?.VITE_SUPABASE_ANON_KEY) ||
      "",
  },
  // Angular DevTools configuration
  devtools: {
    enabled: true, // Enable Angular DevTools features
    profiler: true, // Enable component-level profiling
    changeDetection: true, // Enable change detection tracing
    hydration: true, // Enable hydration debugging
  },
};
