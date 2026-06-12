import "@analogjs/vitest-angular/setup-snapshots";
import { setupTestBed } from "@analogjs/vitest-angular/setup-testbed";
import { vi } from "vitest";

// Jasmine compatibility shim for tests that use jasmine.createSpyObj
(globalThis as unknown as { jasmine: unknown }).jasmine = {
  createSpyObj: (_name: string, methods: string[]) => {
    const obj: Record<string, ReturnType<typeof vi.fn>> = {};
    methods.forEach((method) => {
      obj[method] = vi.fn();
    });
    return obj;
  },
  createSpy: (_name?: string) => vi.fn(),
  stringContaining: (expected: string) => ({
    asymmetricMatch: (actual: string) => actual.includes(expected),
    jasmineToString: () => `<jasmine.stringContaining("${expected}")>`,
  }),
};

// Mock environment variables for Supabase
vi.stubGlobal("import.meta", {
  env: {
    NG_APP_SUPABASE_URL: "https://grfjmnjpzvknmsxrwesx.supabase.co",
    NG_APP_SUPABASE_ANON_KEY:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyZmptbmpwenZrbm1zeHJ3ZXN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MDI4OTksImV4cCI6MjA4NTA3ODg5OX0.63Do5rUEHBT7-pZEXzFFHB5LqFRaXWAt-YrH2v45vo0",
  },
});

// Initialize the Angular zoneless testing environment. The app uses
// provideZonelessChangeDetection(), so the test harness must match it instead of
// importing the zone.js-based setup. setupTestBed() registers TestBed cleanup
// hooks and initializes the environment once with zoneless change detection.
setupTestBed();
