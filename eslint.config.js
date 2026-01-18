import js from "@eslint/js";
import globals from "globals";

export default [
  // Use recommended rules as base
  js.configs.recommended,

  {
    ignores: [
      "node_modules/**",
      "node_modules.bak*/**",
      "dist/**",
      "build/**",
      "angular/**",
      "*.min.js",
      "coverage/**",
      ".netlify/**",
      "**/*.ts",
      "**/*.tsx",
      "**/*.jsx",
      "supabase-types.ts",
      "Wireframes clean/**",
      "consent-violations.json",
      "scripts/archive/**",
    ],
  },
  {
    files: ["**/*.js", "**/*.cjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.es2025,
        // Third-party libraries (loaded via script tags)
        Chart: "readonly",
        lucide: "readonly",
        XLSX: "readonly",
        // Test globals
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        vi: "readonly",
      },
    },
    rules: {
      // ============================================
      // SECURITY RULES - Prevent vulnerabilities
      // ============================================
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-script-url": "error",
      "no-proto": "error",
      "no-extend-native": "error",
      "no-with": "error",
      "no-caller": "error",
      "no-new-wrappers": "error",
      "no-invalid-regexp": "error",
      "no-regex-spaces": "warn",

      // ============================================
      // CONSOLE & DEBUGGING
      // ============================================
      "no-console": [
        "warn",
        {
          allow: ["warn", "error"], // Allow console.warn/error for critical issues, but prefer logger
        },
      ],
      "no-alert": "warn",
      "no-debugger": "error",

      // ============================================
      // XSS PREVENTION
      // ============================================
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[property.name='innerHTML']",
          message:
            "innerHTML is forbidden - use setSafeContent() from utils/shared.js or DOM methods to prevent XSS attacks.",
        },
      ],

      // ============================================
      // BEST PRACTICES
      // ============================================
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "no-undef": "error",
      "prefer-const": "warn",
      "no-var": "warn",
      "no-ex-assign": "error",
      "no-throw-literal": "error",
      eqeqeq: ["warn", "always"],
      "no-eq-null": "warn",
      "no-fallthrough": "error",
      "no-unreachable": "error",
      "no-constant-condition": "warn",
      "no-func-assign": "error",
      "no-inner-declarations": "error",
      "no-dupe-keys": "error",
      "no-dupe-args": "error",
      "no-sparse-arrays": "warn",
      "require-await": "warn",
      "no-async-promise-executor": "error",
      "no-promise-executor-return": "error",

      // ============================================
      // MODERN ES2024+ FEATURES
      // ============================================
      "prefer-arrow-callback": "warn",
      "prefer-template": "warn",
      "prefer-spread": "warn",
      "prefer-rest-params": "warn",
      "prefer-destructuring": ["warn", { array: false, object: true }],
      "object-shorthand": ["warn", "always"],
      "no-useless-computed-key": "warn",
      "prefer-object-spread": "warn",
      "prefer-exponentiation-operator": "warn",
      "prefer-numeric-literals": "warn",
      "prefer-object-has-own": "warn",
      "logical-assignment-operators": ["warn", "always"],
      "no-object-constructor": "warn",
      "no-array-constructor": "warn",

      // ============================================
      // CODE QUALITY
      // ============================================
      "no-empty": ["warn", { allowEmptyCatch: true }],
      "no-duplicate-imports": "warn",
      "no-self-compare": "error",
      "no-useless-concat": "warn",
      "no-useless-return": "warn",
      curly: ["warn", "all"],

      // ============================================
      // PERFORMANCE
      // ============================================
      "no-loop-func": "warn",
      "no-await-in-loop": "warn",
    },
  },

  // ============================================
  // STRICTER RULES FOR SOURCE FILES
  // ============================================
  {
    files: ["src/**/*.js"],
    ignores: ["src/logger.js"], // Logger is allowed to use console
    rules: {
      "no-console": "error", // No console methods allowed - use logger instead
      "prefer-const": "error",
      "no-var": "error",
      // Prevent empty catch blocks that swallow errors
      "no-empty": ["error", { allowEmptyCatch: false }],
    },
  },

  // ============================================
  // RELAXED RULES FOR SCRIPTS (BUILD/UTILITY)
  // ============================================
  {
    files: ["scripts/**/*.js", "scripts/**/*.cjs"],
    rules: {
      "no-console": "off",
      "no-unused-vars": "warn",
      "require-await": "off",
      "no-await-in-loop": "off",
      "no-promise-executor-return": "warn",
      "no-restricted-syntax": "off",
      "no-undef": "warn",
    },
  },

  // ============================================
  // RELAXED RULES FOR NETLIFY FUNCTIONS
  // ============================================
  {
    files: ["netlify/functions/**/*.js", "netlify/functions/**/*.cjs"],
    rules: {
      "no-console": "off",
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "require-await": "off",
      "no-await-in-loop": "off",
      "no-promise-executor-return": "warn",
      "no-undef": "warn",
    },
  },

  // ============================================
  // RELAXED RULES FOR SERVER/ROUTES
  // ============================================
  {
    files: [
      "server.js",
      "server-supabase.js",
      "simple-server.js",
      "routes/**/*.js",
      "src/analytics-data-service.js",
      "src/api-config.js",
    ],
    rules: {
      "no-console": "off",
      "no-unused-vars": "warn",
      "require-await": "off",
      "no-await-in-loop": "off",
    },
  },

  // ============================================
  // RELAXED RULES FOR TEST FILES
  // ============================================
  {
    files: ["**/*.test.js", "**/*.spec.js", "tests/**/*.js"],
    rules: {
      "no-console": "off",
      "no-unused-vars": "off",
      "no-restricted-syntax": "off",
      "require-await": "off",
      "no-script-url": "off",
      "no-await-in-loop": "off",
    },
  },

  // ============================================
  // RELAXED RULES FOR PERFORMANCE CHARTS
  // ============================================
  {
    files: ["src/performance-charts.js"],
    rules: {
      "no-promise-executor-return": "off",
    },
  },
];
