import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.js"],
    globals: true,
    include: ["tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: [
      "node_modules",
      "dist",
      ".idea",
      ".git",
      ".cache",
      "angular",
      "coverage",
      "**/*.config.js",
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov", "json-summary"],
      reportsDirectory: "./coverage",
      exclude: [
        "node_modules/",
        "tests/",
        "netlify/",
        "docs/",
        "database/",
        "*.config.js",
        "scripts/",
        "dist/",
        "angular/",
        "**/*.test.{js,ts}",
        "**/*.spec.{js,ts}",
        "**/setup.js",
        "**/test-helpers.js",
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 65,
        statements: 70,
      },
      all: true,
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: false,
        minThreads: 1,
        maxThreads: 4,
      },
    },
    retry: process.env.CI ? 2 : 0,
    reporters: process.env.CI
      ? ["default", "json", "junit"]
      : ["default", "verbose"],
    outputFile: {
      json: "./coverage/test-results.json",
      junit: "./coverage/junit.xml",
    },
    logHeapUsage: true,
    isolate: true,
    sequence: {
      shuffle: false,
      concurrent: true,
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@components": resolve(__dirname, "./src/components"),
      "@services": resolve(__dirname, "./src/services"),
      "@utils": resolve(__dirname, "./src/utils"),
    },
  },
});
