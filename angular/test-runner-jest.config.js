import { getJestConfig } from "@storybook/test-runner";

// The default Jest configuration comes from @storybook/test-runner
const testRunnerConfig = getJestConfig();

/**
 * @type {import('@jest/types').Config.InitialOptions}
 */
export default {
  ...testRunnerConfig,
  /** Add your own overrides below, and make sure
   *  to merge testRunnerConfig properties with your own
   * @see https://jestjs.io/docs/configuration
   */
  // Ignore backup node_modules folders that cause module naming collisions
  modulePathIgnorePatterns: [
    ...(testRunnerConfig.modulePathIgnorePatterns || []),
    "<rootDir>/node_modules.bak",
    "<rootDir>/../node_modules.bak",
    "node_modules.bak",
  ],
  testPathIgnorePatterns: [
    ...(testRunnerConfig.testPathIgnorePatterns || []),
    "/node_modules.bak/",
    ".bak.",
  ],
  // Reduce timeout for faster feedback
  testTimeout: 30000,
};
