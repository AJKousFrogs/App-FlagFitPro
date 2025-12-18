export const environment = {
  production: true,
  apiUrl: undefined, // Will auto-detect based on hostname
  supabase: {
    url: "https://pvziciccwxgftcielnm.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2emljaWN3eGdmdGNpZWxrbm0iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc1OTUzNzA1OCwiZXhwIjoyMDc1MTEzMDU4fQ.1nfJrtWPl6DrAwvjGvM1-CZBeyYgCaV9oDdaadpqhLU",
  },
  // Angular DevTools configuration (disabled in production)
  devtools: {
    enabled: false,
    profiler: false,
    changeDetection: false,
    hydration: false,
  },
};
