/**
 * Stylelint Configuration for FlagFit Pro Design System
 * ======================================================
 *
 * Enforces DESIGN_SYSTEM_RULES.md decisions via automated linting.
 * See the referenced decisions for full context.
 *
 * Updated: January 18, 2026
 * - Added deprecated token detection
 * - Enhanced design token enforcement
 * - Added spacing and color token rules
 * - Strengthened hardcoded px and hex color guardrails
 * - Added ::ng-deep warning (deprecated)
 *
 * Migrated to ESM: February 10, 2026
 */

// ===========================================
// DEPRECATED TOKENS (January 9, 2026)
// ===========================================
// These tokens are deprecated and should not be used.
// The regex patterns detect var(--token-name) usage.
const DEPRECATED_FONT_TOKENS = [
  // Display sizes (deprecated)
  "--font-display-2xl",
  "--font-display-xl",
  "--font-display-lg",
  "--font-display-md",
  "--font-display-sm",
  // Heading sizes (deprecated)
  "--font-heading-2xl",
  "--font-heading-xl",
  "--font-heading-lg",
  "--font-heading-md",
  "--font-heading-sm",
  "--font-heading-xs",
  // Body sizes (deprecated)
  "--font-body-lg",
  "--font-body-md",
  "--font-body-sm",
  "--font-body-xs",
  "--font-body-2xs",
  "--font-body-3xs",
  // Compact sizes (deprecated)
  "--font-compact-sm",
  "--font-compact-xs",
  // Text aliases (deprecated)
  "--text-xs",
  "--text-sm",
  "--text-base",
  "--text-md",
  "--text-lg",
  "--text-xl",
  "--text-2xl",
  "--text-3xl",
  "--text-4xl",
  "--text-5xl",
  // Font aliases (deprecated)
  "--font-xs",
  "--font-sm",
  "--font-base",
  "--font-lg",
  "--font-xl",
  "--font-2xl",
  "--font-3xl",
];

// Build regex pattern to match var(--deprecated-token)
// Used by custom lint script, kept here for reference
const _deprecatedTokenRegex = DEPRECATED_FONT_TOKENS.map(
  (token) => `var\\(${token.replace(/--/g, "--")}\\)`,
).join("|");

/** @type {import('stylelint').Config} */
const config = {
  extends: ["stylelint-config-standard-scss"],
  plugins: ["stylelint-scss", "stylelint-order"],
  rules: {
    // -----------------------------
    // Decision 7: !important allowed only in overrides
    // -----------------------------
    "declaration-no-important": [
      true,
      {
        severity: "error",
        message:
          "❌ Decision 7: !important is allowed only in @layer overrides (must include ticket + remove-by date).",
      },
    ],

    // -----------------------------
    // Decision 1: Hex colors only in design-system-tokens.scss
    // -----------------------------
    "color-no-hex": [
      true,
      {
        severity: "error",
        message:
          "❌ Decision 1: Hex colors only allowed in design-system-tokens.scss. Use var(--token) instead.",
      },
    ],

    // -----------------------------
    // Decision 19: No transition: all
    // Decision 20: No raw z-index
    // Design Token Enforcement
    // -----------------------------
    "declaration-property-value-disallowed-list": [
      {
        // Decision 23: Disallow hardcoded px values (except tokens)
        "/.*/": ["/\\d+px/"],

        // Decision 19: No transition: all
        // Decision 24: No hardcoded transition durations
        transition: [
          "all",
          "/^all\\s/",
          "/\\s+all\\s/",
          "/\\s+all$/",
          "/\\d+ms/",
          "/\\d+\\.\\d+s/",
          "/\\d+s/",
        ],

        // Decision 20: Disallow raw z-index values (except 0, 1, -1, auto)
        // NOTE: This catches numeric z-index; var() usage is allowed
        // Updated: Allow 0, 1, 2 for stacking contexts, but warn on higher values
        "z-index": ["/^[3-9]\\d*$/", "/^\\d{3,}$/"],

        // Design Token Audit (Jan 9, 2026): Enforce design token usage
        // Warn on hardcoded font-size px values (should use --font-* tokens)
        "font-size": ["/^\\d+px$/"],

        // Warn on hardcoded font-weight numeric values (should use --font-weight-* tokens)
        "font-weight": ["/^[0-9]{3}$/", "normal", "bold", "bolder", "lighter"],

        // Warn on hardcoded line-height decimal values (should use --line-height-* or --font-*-line-height tokens)
        "line-height": ["/^[0-9]\\.[0-9]+$/"],

        // Warn on hardcoded opacity values (should use --opacity-* or --state-*-opacity tokens)
        opacity: ["/^0\\.[0-9]+$/"],

        // Warn on hardcoded border-radius px values (should use --radius-* tokens)
        // Allows: var(), %, 0, inherit, initial, unset
        "border-radius": [
          "/^\\d+px$/",
          "/^\\d+\\.\\d+px$/",
          // Forbidden pill shapes on buttons (per DESIGN_SYSTEM_RULES.md 6.2)
          "9999px",
          "100px",
        ],

        // Warn on hardcoded spacing values (should use --space-* tokens)
        padding: ["/^\\d+px$/"],
        margin: ["/^\\d+px$/"],
        gap: ["/^\\d+px$/"],

        // Warn on hardcoded box-shadow (should use --shadow-* tokens)
        "box-shadow": ["/^0\\s+\\d+px/"],

        // Warn on hardcoded transition durations (should use --transition-* tokens)
        "transition-duration": ["/\\d+ms/", "/\\d+\\.\\d+s/", "/\\d+s/"],
      },
      {
        severity: "warning",
        message:
          "⚠️ Design Token Enforcement: Use CSS variable tokens instead of hardcoded values. See DESIGN_TOKENS_AUDIT.md",
      },
    ],

    // -----------------------------
    // Decision 22: ::ng-deep forbidden (warn to allow gradual cleanup)
    // NOTE: ::ng-deep is deprecated in Angular. New code should use
    // CSS custom properties or global styles in overrides/_exceptions.scss.
    // -----------------------------
    "selector-pseudo-element-no-unknown": [
      true,
      {
        ignorePseudoElements: ["ng-deep"],
      },
    ],

    // Custom warning for ::ng-deep usage via pattern matching
    // Developers should see this warning and migrate to alternatives
    "selector-disallowed-list": [
      ["::ng-deep", "/::ng-deep/"],
      {
        severity: "warning",
        message:
          "⚠️ ::ng-deep is deprecated. Use CSS custom properties or global overrides instead.",
      },
    ],

    // -----------------------------
    // Code quality rules (disabled for migration phase)
    // -----------------------------
    "rule-empty-line-before": null,
    "declaration-empty-line-before": null,

    // Property ordering (optional - helps consistency)
    "order/properties-alphabetical-order": null, // Set to true if you want alphabetical

    // Disable rules that conflict with Angular/SCSS patterns
    "no-empty-source": null,
    "no-descending-specificity": null,
    "selector-class-pattern": null,
    "custom-property-pattern": null,
    "keyframes-name-pattern": null,
    "scss/dollar-variable-pattern": null,
    "scss/percent-placeholder-pattern": null,
    "scss/at-import-partial-extension": null,
    "scss/comment-no-empty": null,
    "scss/no-global-function-names": null,
    "scss/at-extend-no-missing-placeholder": null,
    "property-no-vendor-prefix": null,
    "value-no-vendor-prefix": null,
    "selector-no-vendor-prefix": null,
    "at-rule-no-vendor-prefix": null,
    "media-feature-name-no-vendor-prefix": null,
    "alpha-value-notation": null,
    "color-function-notation": null,
    "hue-degree-notation": null,
    "import-notation": null,
    "selector-not-notation": null,
    "media-feature-range-notation": null,
    "declaration-block-no-redundant-longhand-properties": null,
    "no-duplicate-selectors": null,
    "value-keyword-case": null,
    "color-function-alias-notation": null,
    "comment-empty-line-before": null,

    // Allow SCSS at-rules
    "scss/at-rule-no-unknown": [
      true,
      {
        ignoreAtRules: [
          "tailwind",
          "apply",
          "variants",
          "responsive",
          "screen",
          "layer",
        ],
      },
    ],
    "at-rule-no-unknown": [
      true,
      {
        ignoreAtRules: [
          "tailwind",
          "apply",
          "variants",
          "responsive",
          "screen",
          "layer",
          "use",
          "forward",
          "mixin",
          "include",
          "function",
          "return",
          "if",
          "else",
          "each",
          "for",
          "while",
          "extend",
          "at-root",
          "debug",
          "warn",
          "error",
        ],
      },
    ],

    // Allow Angular-specific pseudo-classes
    "selector-pseudo-class-no-unknown": [
      true,
      {
        ignorePseudoClasses: [
          "global",
          "local",
          "host",
          "host-context",
          "ng-deep",
        ],
      },
    ],

    // Nesting depth limit
    "max-nesting-depth": [
      4,
      {
        ignore: ["pseudo-classes"],
        ignoreAtRules: [
          "media",
          "supports",
          "include",
          "if",
          "else",
          "each",
          "for",
        ],
      },
    ],

    // Selector complexity limits
    "selector-max-id": 0,
    "selector-max-compound-selectors": 4,
  },

  overrides: [
    // ====================================
    // Allow hex colors ONLY in tokens file
    // design-tokens.scss forwards to design-system-tokens (no definitions)
    // ====================================
    {
      files: [
        "**/design-system-tokens.scss",
        "**/design-tokens.scss",
        "**/assets/styles/tokens/**/*.scss",
      ],
      rules: {
        "color-no-hex": null,
        "declaration-property-value-disallowed-list": null,
      },
    },

    // ====================================
    // Allow !important only in overrides layer
    // Note: view-transitions.config.ts injects reduced-motion !important via JS (a11y) - not in SCSS
    // ====================================
    {
      files: ["**/overrides/**/*.scss", "**/overrides/*.scss"],
      rules: {
        "declaration-no-important": [
          true,
          {
            severity: "warning",
            message:
              "⚠️ !important allowed here, but MUST include exception ticket comment.",
          },
        ],
      },
    },

    // ====================================
    // PrimeNG files: warn instead of error for hex
    // ====================================
    {
      files: ["**/primeng/**/*.scss", "**/primeng-*.scss"],
      rules: {
        "color-no-hex": [
          true,
          {
            severity: "warning",
            message: "⚠️ Decision 1: Migrate to design token variables.",
          },
        ],
        // Relax rules for PrimeNG theme files (they contain many overrides)
        "declaration-property-value-disallowed-list": null,
      },
    },

    // ====================================
    // Component SCSS: full enforcement
    // ====================================
    {
      files: ["**/*.component.scss"],
      rules: {
        "selector-pseudo-element-no-unknown": [
          true,
          {
            ignorePseudoElements: ["ng-deep"],
          },
        ],
      },
    },
  ],

  ignoreFiles: [
    "node_modules/**",
    "dist/**",
    "coverage/**",
    ".angular/**",
    "**/*.min.css",
    "**/*.min.scss",
  ],
};

export default config;
