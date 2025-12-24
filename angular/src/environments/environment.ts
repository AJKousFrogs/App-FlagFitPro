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
    // Development credentials (safe to commit - public anon key)
    url: "https://pvziciccwxgftcielknm.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2emljaWNjd3hnZnRjaWVsa25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MzcwNTgsImV4cCI6MjA3NTExMzA1OH0.1nfJrtWPl6DrAwvjGvM1-CZBeyYgCaV9oDdaadpqhLU",
  },
  // Angular DevTools configuration
  devtools: {
    enabled: true, // Enable Angular DevTools features
    profiler: true, // Enable component-level profiling
    changeDetection: true, // Enable change detection tracing
    hydration: true, // Enable hydration debugging
  },
};
