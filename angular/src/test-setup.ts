import "@analogjs/vitest-angular/setup-zone";

import { getTestBed, TestBed } from "@angular/core/testing";
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from "@angular/platform-browser-dynamic/testing";
import { afterEach, beforeAll, vi } from "vitest";

// Jasmine compatibility shim for tests that use jasmine.createSpyObj
(globalThis as unknown as { jasmine: unknown }).jasmine = {
  createSpyObj: (name: string, methods: string[]) => {
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
    NG_APP_SUPABASE_URL: "https://test.supabase.co",
    NG_APP_SUPABASE_ANON_KEY: "test-anon-key",
  },
});

// Initialize Angular testing environment once
beforeAll(() => {
  const testBed = getTestBed();
  if (!testBed.platform) {
    TestBed.initTestEnvironment(
      BrowserDynamicTestingModule,
      platformBrowserDynamicTesting(),
    );
  }
});

// Reset TestBed after each test to prevent state leakage
afterEach(() => {
  TestBed.resetTestingModule();
});
