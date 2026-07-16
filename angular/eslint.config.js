// @ts-check
import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import angular from "angular-eslint";

export default defineConfig([
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "app",
          style: "kebab-case",
        },
      ],

      // ── Defensive default assignments ─────────────────────────────────────
      // `no-useless-assignment` (new in ESLint 10's recommended set) flags the
      // `let x = fallback; if (…) x = …; else if (…) x = …` idiom where the
      // initializer is the value used when no branch matches. Removing those
      // initializers would change behaviour, so the rule is disabled.
      "no-useless-assignment": "off",

      // ── Unused variables ──────────────────────────────────────────────────
      // Allow _-prefixed names (intentional "unused" params in interfaces/CVA).
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // ── Output naming ─────────────────────────────────────────────────────
      // Wrapper components deliberately mirror DOM event names (change, select…)
      // to keep call-site ergonomics natural. Turning these off is intentional.
      "@angular-eslint/no-output-native": "off",
      "@angular-eslint/no-output-on-prefix": "off",

      // ── Input aliasing ────────────────────────────────────────────────────
      // Some inputs need aliases for backwards-compatibility or clarity.
      "@angular-eslint/no-input-rename": "off",

      // ── Explicit `any` ────────────────────────────────────────────────────
      // Downgraded to warn — many legitimate uses (AI responses, Supabase
      // generics, third-party SDK payloads). Fix incrementally.
      "@typescript-eslint/no-explicit-any": "warn",

      // ── Empty functions ───────────────────────────────────────────────────
      // Allow empty arrow functions: required by ControlValueAccessor (CVA)
      // for default onModelChange / onModelTouched implementations.
      "@typescript-eslint/no-empty-function": [
        "error",
        { allow: ["arrowFunctions", "overrideMethods"] },
      ],
    },
  },
  {
    // Cycle data is SPECIAL-CATEGORY and owner-only (V3-DESIGN §4.5). Nothing
    // outside the cycle module may import it — this keeps cycle fields out of
    // telemetry, logs, other screens, and any staff surface by construction.
    files: ["**/*.ts"],
    ignores: ["**/cycle/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "**/cycle/cycle.logic",
                "**/cycle/cycle.service",
                "**/cycle/cycle.component",
              ],
              message:
                "Cycle data is owner-only (special-category, V3-DESIGN §4.5). Do not import the cycle module outside cycle/.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["**/*.spec.ts"],
    rules: {
      // Spec files use mock harnesses and third-party test doubles where `any`
      // is often the least noisy boundary. Keep production code warnings on.
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      angular.configs.templateRecommended,
      angular.configs.templateAccessibility,
    ],
    rules: {
      // `elements-content` treats `aria-label` as an accessible name but omits
      // `aria-labelledby`, which is an equally valid WCAG technique used by the
      // toggle-switch buttons (role="switch" + aria-labelledby pointing at a
      // sibling label). Add it to the safelist so correctly-labelled controls
      // are not flagged. (Defaults per @angular-eslint, plus aria-labelledby.)
      "@angular-eslint/template/elements-content": [
        "error",
        {
          allowList: [
            "aria-label",
            "aria-labelledby",
            "innerHtml",
            "innerHTML",
            "innerText",
            "outerHTML",
            "textContent",
            "title",
          ],
        },
      ],
      // Permit the `value != null` / `value == null` idiom, which checks for
      // null and undefined together; strict equality is still required elsewhere.
      "@angular-eslint/template/eqeqeq": [
        "error",
        { allowNullOrUndefined: true },
      ],
      // ── Accessibility — warn, not error ───────────────────────────────────
      // These are real issues worth tracking but too numerous to block CI today.
      // Address in a dedicated a11y sprint.
      "@angular-eslint/template/label-has-associated-control": "warn",
      "@angular-eslint/template/click-events-have-key-events": "warn",
      "@angular-eslint/template/interactive-supports-focus": "warn",
      "@angular-eslint/template/mouse-events-have-key-events": "warn",
    },
  },
]);
