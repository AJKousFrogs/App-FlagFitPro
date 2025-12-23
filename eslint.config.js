export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      "angular/**",
      "*.min.js",
      "coverage/**",
      ".netlify/**",
      "**/*.ts",
      "**/*.tsx",
      "supabase-types.ts",
      "Wireframes clean/**",
    ],
  },
  {
    files: ["**/*.js", "**/*.cjs"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        // Node.js globals
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",
        global: "readonly",
        // Node.js built-in modules (for scripts)
        path: "readonly",
        fs: "readonly",
        url: "readonly",
        // Browser globals
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        fetch: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        // Browser APIs
        URL: "readonly",
        URLSearchParams: "readonly",
        FormData: "readonly",
        File: "readonly",
        Blob: "readonly",
        atob: "readonly",
        btoa: "readonly",
        MutationObserver: "readonly",
        IntersectionObserver: "readonly",
        ResizeObserver: "readonly",
        PerformanceObserver: "readonly",
        AbortController: "readonly",
        AbortSignal: "readonly",
        CustomEvent: "readonly",
        StorageEvent: "readonly",
        Event: "readonly",
        requestAnimationFrame: "readonly",
        cancelAnimationFrame: "readonly",
        performance: "readonly",
        Node: "readonly",
        HTMLElement: "readonly",
        NodeFilter: "readonly",
        // Text encoding APIs
        TextEncoder: "readonly",
        TextDecoder: "readonly",
        // Audio API
        Audio: "readonly",
        // Service Worker APIs
        self: "readonly",
        caches: "readonly",
        clients: "readonly",
        Response: "readonly",
        Headers: "readonly",
        // Notification API
        Notification: "readonly",
        // Browser dialogs
        alert: "readonly",
        confirm: "readonly",
        prompt: "readonly",
        // Browser objects
        screen: "readonly",
        location: "readonly",
        // Web Crypto API
        crypto: "readonly",
        SubtleCrypto: "readonly",
        // Third-party libraries (loaded via script tags)
        Chart: "readonly",
        lucide: "readonly",
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

      // Prevent code injection
      "no-eval": "error", // No eval() - code injection risk
      "no-implied-eval": "error", // No setTimeout/setInterval with strings
      "no-new-func": "error", // No new Function() - code injection risk
      "no-script-url": "error", // No javascript: URLs

      // Prevent prototype pollution
      "no-proto": "error", // No __proto__ usage
      "no-extend-native": "error", // Don't extend native prototypes

      // Prevent dangerous patterns
      "no-with": "error", // No with statements (deprecated & dangerous)
      "no-caller": "error", // No arguments.caller/callee
      "no-new-wrappers": "error", // No new String/Number/Boolean

      // Regular expressions security
      "no-invalid-regexp": "error", // Prevent invalid regex
      "no-regex-spaces": "warn", // Multiple spaces in regex (typo?)

      // ============================================
      // CONSOLE & DEBUGGING
      // ============================================

      // Warn about console usage (prefer logger service)
      "no-console": "warn", // No console methods allowed - use logger instead
      "no-alert": "warn", // Avoid alert/confirm/prompt
      "no-debugger": "error", // No debugger statements in production

      // ============================================
      // XSS PREVENTION
      // ============================================

      // These require manual review but we'll warn
      "no-unsanitized/method": "off", // Would need eslint-plugin-no-unsanitized
      "no-unsanitized/property": "off", // Would need eslint-plugin-no-unsanitized

      // ERROR on innerHTML usage (XSS risk) - Use setSafeContent() or DOM methods instead
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[property.name='innerHTML']",
          message:
            "innerHTML is forbidden - use setSafeContent(element, content, isHTML, allowRichText) from utils/shared.js or DOM methods (textContent, createElement, appendChild) to prevent XSS attacks. Only exception: safe helper functions using temp container pattern.",
        },
      ],

      // ============================================
      // BEST PRACTICES
      // ============================================

      // Variable declarations
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-undef": "error", // No undefined variables
      "prefer-const": "warn", // Use const when possible
      "no-var": "warn", // Use let/const instead of var

      // Error handling
      "no-ex-assign": "error", // Don't reassign exception in catch
      "no-throw-literal": "error", // Throw Error objects, not literals

      // Equality checks
      eqeqeq: ["warn", "always"], // Use === and !==
      "no-eq-null": "warn", // No == null (use === null)

      // Control flow
      "no-fallthrough": "error", // No switch fallthrough without comment
      "no-unreachable": "error", // No unreachable code
      "no-constant-condition": "warn", // No if(true) or while(true)

      // Functions
      "no-func-assign": "error", // Don't reassign function declarations
      "no-inner-declarations": "error", // No function declarations in blocks

      // Objects & Arrays
      "no-dupe-keys": "error", // No duplicate object keys
      "no-dupe-args": "error", // No duplicate function arguments
      "no-sparse-arrays": "warn", // No sparse arrays [1,,3]

      // Async/Promises
      "require-await": "warn", // async functions should await something
      "no-async-promise-executor": "error", // No async in Promise executor
      "no-promise-executor-return": "error", // Don't return from Promise executor

      // ============================================
      // CODE QUALITY
      // ============================================

      "no-empty": [
        "warn",
        {
          // No empty blocks
          allowEmptyCatch: true,
        },
      ],
      "no-extra-semi": "warn", // No extra semicolons
      "no-duplicate-imports": "warn", // No duplicate imports
      "no-self-compare": "error", // No x === x
      "no-useless-concat": "warn", // No "a" + "b" (use "ab")
      "no-useless-return": "warn", // No unnecessary return

      // Styling (helps prevent bugs)
      curly: ["warn", "all"], // Always use braces for if/while/for
      "brace-style": [
        "warn",
        "1tbs",
        {
          // One true brace style
          allowSingleLine: true,
        },
      ],

      // ============================================
      // PERFORMANCE
      // ============================================

      "no-loop-func": "warn", // Don't create functions in loops
      "no-await-in-loop": "warn", // Avoid await in loops (use Promise.all)
    },
  },

  // ============================================
  // STRICTER RULES FOR SOURCE FILES
  // ============================================
  {
    files: ["src/**/*.js"],
    rules: {
      // Even stricter for main source code
      "no-console": "error", // No console in src - use logger
      "prefer-const": "error", // Must use const when possible
      "no-var": "error", // Must use let/const
    },
  },

  // ============================================
  // RELAXED RULES FOR SCRIPTS (BUILD/UTILITY)
  // ============================================
  {
    files: ["scripts/**/*.js", "scripts/**/*.cjs"],
    rules: {
      "no-console": "off", // Allow console in scripts (build/utility scripts)
      "no-unused-vars": "warn", // Warn but don't error for unused vars in scripts
      "require-await": "off", // Allow async without await in scripts
      "no-await-in-loop": "warn", // Warn but don't error for await in loops (common in scripts)
      "no-promise-executor-return": "warn", // Warn but don't error for promise executor returns (common in scripts)
      "no-restricted-syntax": "off", // Allow innerHTML in scripts (utility scripts)
      "no-undef": "warn", // Warn but don't error for undefined vars in scripts (may use globals)
    },
  },

  // ============================================
  // RELAXED RULES FOR TEST FILES
  // ============================================
  {
    files: ["**/*.test.js", "**/*.spec.js", "tests/**/*.js"],
    rules: {
      "no-console": "off", // Allow console in tests
      "no-unused-vars": "off", // Allow unused vars in tests
      "no-restricted-syntax": "off", // Allow innerHTML in test assertions (needed to verify setSafeContent behavior)
      "require-await": "off", // Allow async functions without await in test mocks
      "no-script-url": "off", // Allow javascript: URLs in test assertions (testing XSS prevention)
    },
  },

  // ============================================
  // RELAXED RULES FOR PERFORMANCE CHARTS
  // ============================================
  {
    files: ["src/performance-charts.js"],
    rules: {
      "no-promise-executor-return": "off", // False positives - not Promise executors
    },
  },
];
