export const environment = {
  production: false,
  apiUrl: "http://localhost:3001", // Backend API server
  supabase: {
    url: "https://pvziciccwxgftcielnm.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2emljaWN3eGdmdGNpZWxrbm0iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc1OTUzNzA1OCwiZXhwIjoyMDc1MTEzMDU4fQ.1nfJrtWPl6DrAwvjGvM1-CZBeyYgCaV9oDdaadpqhLU",
  },
  // Angular DevTools configuration
  devtools: {
    enabled: true, // Enable Angular DevTools features
    profiler: true, // Enable component-level profiling
    changeDetection: true, // Enable change detection tracing
    hydration: true, // Enable hydration debugging
  },
};
