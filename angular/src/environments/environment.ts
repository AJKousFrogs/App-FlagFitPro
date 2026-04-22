// Environment configuration for development
// For production, use environment.prod.ts with Angular's file replacement
//
// Values can be injected at runtime via window._env (set by the dev server or runtime-env.js)
// This allows changing configuration without rebuilding

import {
  DEFAULT_SUPABASE_ANON_KEY,
  DEFAULT_SUPABASE_URL,
} from "./supabase.defaults";

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
// Prefer Netlify Dev (port 8888) to ensure parity with production functions
const getDefaultApiUrl = (): string => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    const currentPort = window.location.port;
    // Check for API_PORT in URL query params (e.g., ?API_PORT=3000)
    const urlParams = new URLSearchParams(window.location.search);
    const apiPort = urlParams.get("API_PORT") || "8888";

    // For localhost or 127.0.0.1
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      // If running via Netlify Dev proxy, use same-origin
      if (currentPort === "8888") {
        return window.location.origin;
      }
      return `http://${hostname}:${apiPort}`;
    }

    // For local network IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    // Connect to the API on the same host but Netlify Dev port (8888)
    const localNetworkPattern =
      /^(192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})$/;
    if (localNetworkPattern.test(hostname)) {
      // Respect API_PORT override; otherwise prefer Netlify Dev port
      return `http://${hostname}:${apiPort}`;
    }
  }
  // Default for SSR or unknown environments
  return "http://localhost:8888";
};

// Default development values (safe to commit - public anon key only)
const DEFAULTS = {
  SUPABASE_URL: DEFAULT_SUPABASE_URL,
  SUPABASE_ANON_KEY: DEFAULT_SUPABASE_ANON_KEY,
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
};
