// SECURITY WARNING: These values MUST be replaced during production build with environment variables
// Never commit production credentials to version control
// Use Angular's file replacement mechanism or build-time environment variable injection
//
// NOTE: process.env doesn't work in browser - MUST use Angular's file replacement
// During build, replace this file with actual values from environment variables
export const environment = {
  production: true,
  apiUrl: undefined, // Will auto-detect based on hostname
  supabase: {
    // CRITICAL: These MUST be replaced during build via Angular's file replacement
    // Example build command: ng build --configuration=production --env=prod
    // Then use file replacement in angular.json to inject actual values
    // Fallback to empty string - will fail gracefully if not replaced
    url: (typeof window !== 'undefined' && (window as any)._env?.SUPABASE_URL) || 
         (typeof window !== 'undefined' && (window as any)._env?.VITE_SUPABASE_URL) || 
         '',
    anonKey: (typeof window !== 'undefined' && (window as any)._env?.SUPABASE_ANON_KEY) || 
             (typeof window !== 'undefined' && (window as any)._env?.VITE_SUPABASE_ANON_KEY) || 
             '',
  },
  // Angular DevTools configuration (disabled in production)
  devtools: {
    enabled: false,
    profiler: false,
    changeDetection: false,
    hydration: false,
  },
};
