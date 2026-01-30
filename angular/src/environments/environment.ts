// Environment configuration for development
// For production, use environment.prod.ts with Angular's file replacement
//
// Values can be injected at runtime via window._env (set by dev server or index.html script)
// This allows changing configuration without rebuilding

// Type declaration for runtime environment injection
declare global {
  interface Window {
    _env?: {
      SUPABASE_URL?: string;
      SUPABASE_ANON_KEY?: string;
      API_URL?: string;
    };
  }
}

// Helper to get environment value with fallback
const getEnvValue = (key: string, fallback: string): string => {
  // Check runtime injection first (for flexibility)
  if (
    typeof window !== "undefined" &&
    window._env?.[key as keyof typeof window._env]
  ) {
    return window._env[key as keyof typeof window._env] as string;
  }
  return fallback;
};

// Auto-detect API URL for local development
// This allows the Angular app to connect to the API server regardless of which port it's running on
const getDefaultApiUrl = (): string => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    // Check for API_PORT in URL query params (e.g., ?API_PORT=3000)
    const urlParams = new URLSearchParams(window.location.search);
    const apiPort = urlParams.get("API_PORT") || "4000";

    // For localhost or 127.0.0.1
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return `http://${hostname}:${apiPort}`;
    }

    // For local network IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    // Connect to the API on the same host but port 4000
    const localNetworkPattern =
      /^(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})$/;
    if (localNetworkPattern.test(hostname)) {
      return `http://${hostname}:${apiPort}`;
    }
  }
  // Default for SSR or unknown environments
  return "http://localhost:4000";
};

// Default development values (safe to commit - public anon key only)
const DEFAULTS = {
  SUPABASE_URL: "https://grfjmnjpzvknmsxrwesx.supabase.co",
  SUPABASE_ANON_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZmptbmpwenZrbm1zeHJ3ZXN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MDI4OTksImV4cCI6MjA4NTA3ODg5OX0.63Do5rUEHBT7-pZEXzFFHB5LqFRaXWAt-YrH2v45vo0",
  API_URL: "", // Will be auto-detected
};

export const environment = {
  production: false,
  // API URL: Check window._env first, then auto-detect for local dev
  apiUrl: getEnvValue("API_URL", DEFAULTS.API_URL) || getDefaultApiUrl(),
  supabase: {
    url: getEnvValue("SUPABASE_URL", DEFAULTS.SUPABASE_URL),
    anonKey: getEnvValue("SUPABASE_ANON_KEY", DEFAULTS.SUPABASE_ANON_KEY),
  },
  // VAPID public key for push notifications (generate your own for production)
  // To generate: npx web-push generate-vapid-keys
  vapidPublicKey: "",
  // Angular DevTools configuration
  devtools: {
    enabled: true,
    profiler: true,
    changeDetection: true,
    hydration: true,
  },
  /**
   * Use direct Supabase calls instead of Netlify Functions API
   *
   * When TRUE (default for ng serve on port 4200):
   *   - API calls go directly to Supabase
   *   - No need for Netlify Dev server
   *   - Faster local development
   *
   * When FALSE (Netlify Dev on port 8888 or production):
   *   - API calls go through /api/* endpoints
   *   - Tests full production flow with Netlify Functions
   *
   * Auto-detects based on port: 4200 = direct, 8888 = via API
   */
  // Enforce backend API usage even in development for consistent auth behavior
  useDirectSupabase: false,
};
