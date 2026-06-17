import { defineConfig } from "vitest/config";

/**
 * Root vitest config — covers Netlify functions and integration tests only.
 *
 * Angular component specs (angular/src/**) are run separately via
 * `cd angular && npm test` which uses angular/vitest.config.ts with
 * the @analogjs/vitest-angular setup that Angular's TestBed requires.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: [
      "netlify/**/*.{spec,test}.{js,ts}",
      "tests/unit/**/*.{spec,test}.{js,ts}",
      "tests/integration/**/*.{spec,test}.{js,ts}",
      // Privacy/RLS/consent suite — run via `npm run test:privacy` (filters to
      // this dir). Without it in include, that filter matched nothing and vitest
      // exited 1 ("No test files found"). The suites self-skip without DB creds.
      "tests/privacy-safety/**/*.{spec,test}.{js,ts}",
    ],
    exclude: [
      // Legacy custom runner — defines its own test() and process.exit()
      "netlify/functions/utils/compute-override.spec.js",
      // Playwright tests (wrong framework for vitest)
      "tests/e2e/**",
      "tests/responsive/**",
      // Node integration scripts that call process.exit()
      "tests/contracts/**",
      "tests/logic/**",
      // Flaky timing-based load tests (run separately)
      "tests/performance/**",
      "**/.claude/**",
      "angular/**",
      "node_modules/**",
    ],
  },
});
