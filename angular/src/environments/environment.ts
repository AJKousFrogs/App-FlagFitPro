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
  if (typeof window !== 'undefined' && window._env?.[key as keyof typeof window._env]) {
    return window._env[key as keyof typeof window._env] as string;
  }
  return fallback;
};

// Default development values (safe to commit - public anon key only)
const DEFAULTS = {
  SUPABASE_URL: 'https://pvziciccwxgftcielknm.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2emljaWNjd3hnZnRjaWVsa25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MzcwNTgsImV4cCI6MjA3NTExMzA1OH0.1nfJrtWPl6DrAwvjGvM1-CZBeyYgCaV9oDdaadpqhLU',
  API_URL: 'http://localhost:3001',
};

export const environment = {
  production: false,
  apiUrl: getEnvValue('API_URL', DEFAULTS.API_URL),
  supabase: {
    url: getEnvValue('SUPABASE_URL', DEFAULTS.SUPABASE_URL),
    anonKey: getEnvValue('SUPABASE_ANON_KEY', DEFAULTS.SUPABASE_ANON_KEY),
  },
  // Angular DevTools configuration
  devtools: {
    enabled: true,
    profiler: true,
    changeDetection: true,
    hydration: true,
  },
};
