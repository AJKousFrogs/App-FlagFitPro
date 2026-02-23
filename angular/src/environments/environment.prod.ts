// Production environment configuration
// Values are injected at runtime via window._env (set by index.html inline script)
// This allows deployment-time configuration without rebuilding

// Note: Window._env type is declared in environment.ts
// Canonical runtime keys are SUPABASE_URL and SUPABASE_ANON_KEY.
// VITE_* keys are supported as legacy fallback only.

// Helper to safely get environment value from window._env
// Supports canonical SUPABASE_* keys with VITE_* fallback
const getEnvValue = (keys: string[], fallback: string = ""): string => {
  if (typeof window === "undefined") return fallback;
  const env = (window as { _env?: Record<string, string | undefined> })._env;
  if (!env) return fallback;

  for (const key of keys) {
    const value = env[key];
    if (value) return value;
  }
  return fallback;
};

export const environment = {
  production: true,
  apiUrl: undefined as string | undefined, // Will auto-detect based on hostname
  supabase: {
    // Runtime injection with canonical keys + legacy fallback
    url: getEnvValue(["SUPABASE_URL", "VITE_SUPABASE_URL"]),
    anonKey: getEnvValue(["SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY"]),
  },
  // Angular DevTools configuration (disabled in production for security)
  devtools: {
    enabled: false,
    profiler: false,
    changeDetection: false,
    hydration: false,
  },
};
