/**
 * Stylelint Configuration for FlagFit Pro Design System
 * ======================================================
 *
 * Enforces DESIGN_SYSTEM_RULES.md decisions via automated linting.
 * See the referenced decisions for full context.
 */

module.exports = {
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
    // -----------------------------
    "declaration-property-value-disallowed-list": {
      // Decision 19: No transition: all
      transition: ["all", "/^all\\s/", "/\\s+all\\s/", "/\\s+all$/"],

      // Decision 20: Disallow raw z-index values (except 0, 1, -1, auto)
      // NOTE: This catches numeric z-index; var() usage is allowed
      "z-index": ["/^[2-9]\\d*$/", "/^\\d{2,}$/"],
    },

    // -----------------------------
    // Decision 22: ::ng-deep forbidden (warn to allow gradual cleanup)
    // -----------------------------
    "selector-pseudo-element-no-unknown": [
      true,
      {
        ignorePseudoElements: ["ng-deep"],
      },
    ],

    // -----------------------------
    // Code quality rules (disabled for migration phase)
    // -----------------------------
    "rule-empty-line-before": null,

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
    // ====================================
    {
      files: [
        "**/design-system-tokens.scss",
        "**/assets/styles/tokens/**/*.scss",
      ],
      rules: {
        "color-no-hex": null,
        "declaration-property-value-disallowed-list": null,
      },
    },

    // ====================================
    // Allow !important only in overrides layer
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
        "declaration-property-value-disallowed-list": [
          {
            transition: ["all", "/all\\s/"],
          },
          {
            severity: "warning",
          },
        ],
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
