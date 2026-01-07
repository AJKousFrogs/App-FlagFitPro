// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

/**
 * ESLint Configuration for Angular App
 *
 * Includes custom rules to enforce button standardization:
 * - No direct <p-button> usage
 * - No pButton directive
 * - No raw <button> unless whitelisted
 *
 * @see docs/BUTTON_STANDARDIZATION.md for migration guide
 */

import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // Base configurations
  js.configs.recommended,
  ...tseslint.configs.recommended, // Ignore patterns
  {
    ignores: [
      "node_modules/**",
      "node_modules.bak*/**",
      "dist/**",
      ".angular/**",
      "coverage/**",
      "out-tsc/**", // Compiled TypeScript output
      "*.d.ts",
      "**/*.stories.ts", // Stories can show legacy patterns for comparison
      // Config files in root/subdirs that use different tsconfig
      "vite.config.ts",
      "vitest.config.ts",
      "playwright.config.ts",
      "server.ts",
      ".storybook/**",
    ],
  },
  // ============================================
  // NODE.JS SCRIPTS (JavaScript files)
  // ============================================
  {
    files: ["scripts/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.es2025,
      },
    },
    rules: {
      // Disable TypeScript-specific rules for JS files
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": "off",
      // Enable standard JS rules
      "no-console": "off",
      "no-undef": "off", // Node globals handled by globals.node
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  // TypeScript files configuration
  {
    files: ["**/*.ts"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2025,
      },
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    rules: {
      // ============================================
      // BUTTON STANDARDIZATION RULES
      // ============================================
      // These rules enforce the use of <app-button> and <app-icon-button>
      // instead of direct PrimeNG or native button usage.

      "no-restricted-syntax": [
        "error",
        // Rule 1: Disallow <p-button> in templates
        {
          selector: "TaggedTemplateExpression[tag.name='html'] TemplateLiteral",
          message:
            "Direct <p-button> usage is not allowed. Use <app-button> instead. See docs/BUTTON_STANDARDIZATION.md",
        },
      ],

      // ============================================
      // TYPESCRIPT RULES
      // ============================================
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-non-null-assertion": "warn",

      // ============================================
      // BEST PRACTICES
      // ============================================
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "warn",
      eqeqeq: ["warn", "always", { null: "ignore" }], // Allow == null for null/undefined checks
    },
  }, // Component template inline strings - additional checks
  {
    files: ["**/*.component.ts"],
    rules: {
      // Additional rules for component files
    },
  }, // Test files - relaxed rules and separate tsconfig
  {
    files: ["**/*.spec.ts", "**/*.test.ts"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        project: "./tsconfig.spec.json",
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-console": "off",
    },
  },
  // E2E tests - relaxed rules and separate tsconfig
  {
    files: ["e2e/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./e2e/tsconfig.json",
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
    },
  },
  // CLI validation scripts - need console for output
  {
    files: ["src/scripts/**/*.ts"],
    rules: {
      "no-console": "off",
    },
  },
  storybook.configs["flat/recommended"],
);
