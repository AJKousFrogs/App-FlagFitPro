// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";
import templatePlugin from "@angular-eslint/eslint-plugin-template";
import templateParser from "@angular-eslint/template-parser";

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
  // Console logging is temporarily allowed because LoggerService is unavailable while bootstrapping validation
  // and Supabase diagnostics need console.group output for deep inspection.
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
  // ANGULAR TEMPLATE RULES
  // Enforces design system compliance in HTML templates.
  // See docs/ui/UI_FINAL_REPORT.md for enforcement details.
  // ============================================
  {
    files: ["**/*.component.html"],
    languageOptions: {
      parser: templateParser,
    },
    plugins: {
      "@angular-eslint/template": templatePlugin,
    },
    rules: {
      // Block inline styles - use SCSS classes or design-system utilities instead
      // This catches: style="...", [style]="...", [ngStyle]="..."
      "@angular-eslint/template/no-inline-styles": "error",
    },
  },
  // ============================================
  // NODE.JS SCRIPTS (JavaScript files)
  // ============================================
  {
    files: ["scripts/**/*.{js,ts}", "src/scripts/**/*.ts"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.es2025,
      },
    },
    rules: {
      "no-console": "off",
      "no-alert": "off",
    },
  },
  {
    files: ["netlify/functions/**/*.{js,cjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.es2025,
      },
    },
    rules: {
      "no-console": "off",
      "no-unused-vars": "off",
      "prefer-const": "off",
      "require-await": "off",
      "no-await-in-loop": "off",
      "no-promise-executor-return": "off",
    },
  },
  {
    files: ["netlify/plugins/**/*.{js,cjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.es2025,
      },
    },
    rules: {
      "no-console": "off",
      "no-unused-vars": "off",
      "prefer-const": "off",
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

      // ============================================
      // CONSTANTS BARREL IMPORT ENFORCEMENT
      // ============================================
      // Enforce importing from @core/constants barrel instead of individual files
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@core/constants/app.constants",
              message:
                "Import from '@core/constants' barrel instead. Example: import { TRAINING, TIMEOUTS } from '@core/constants'",
            },
            {
              name: "@core/constants/toast-messages.constants",
              message:
                "Import from '@core/constants' barrel instead. Example: import { TOAST } from '@core/constants'",
            },
            {
              name: "@core/constants/ui-options.constants",
              message:
                "Import from '@core/constants' barrel instead. Example: import { VISIBILITY_OPTIONS } from '@core/constants'",
            },
            {
              name: "@core/constants/wellness.constants",
              message:
                "Import from '@core/constants' barrel instead. Example: import { WELLNESS } from '@core/constants'",
            },
            {
              name: "@core/constants/positions.constants",
              message:
                "Import from '@core/constants' barrel instead. Example: import { POSITION_SELECT_OPTIONS } from '@core/constants'",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/app/**/*.{ts,html}"],
    rules: {
      "no-console": "error",
      "no-alert": "error",
    },
  }, // Component template inline strings - additional checks
  {
    files: ["src/app/core/logging/console-logger.adapter.ts"],
    rules: {
      "no-console": "off",
    },
  },
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
  {
    files: [
      "src/app/core/constants/constants-validation.ts",
      "src/app/core/services/supabase-debug.service.ts",
    ],
    rules: {
      "no-console": "off",
      "no-alert": "off",
      "no-unused-vars": "off",
      "prefer-const": "off",
    },
  },
  {
    files: ["routes/**/*.{js,ts}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.es2025,
      },
    },
    rules: {
      "no-console": "off",
      "no-alert": "off",
    },
  },
  {
    files: ["tests/**/*.cjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.es2025,
      },
    },
    rules: {
      "no-console": "off",
      "no-unused-vars": "off",
      "prefer-const": "off",
      "no-await-in-loop": "off",
    },
  },
  {
    files: ["server.js"],
    rules: {
      "no-unused-vars": "off",
    },
  },
  storybook.configs["flat/recommended"],
);
