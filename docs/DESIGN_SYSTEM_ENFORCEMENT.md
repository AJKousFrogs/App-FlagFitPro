# FlagFit Pro - Design System Enforcement Guide

This guide outlines the mandatory rules and best practices for maintaining UI consistency across the FlagFit Pro application.

## 1. Color System (STRICTLY ENFORCED)

### Primary Brand Color

- **Variable:** `--ds-primary-green` (#089949)
- **Rule:** ALWAYS use white (`#ffffff`) text on this background. NEVER use black or dark text.
- **Rule:** Use `--color-text-on-primary` for text on brand backgrounds.

### Typography

- **Primary Font:** Poppins
- **Rule:** Use semantic typography tokens instead of hardcoded `font-size` or `font-weight`.
  - `var(--font-heading-lg)`
  - `var(--font-body-md)`
  - `var(--font-weight-semibold)`

### Neutral Colors

- **Page Backgrounds:** `var(--surface-primary)`
- **Card Backgrounds:** `var(--surface-secondary)`
- **Primary Text:** `var(--color-text-primary)`
- **Muted Text:** `var(--color-text-muted)`

## 2. Component Usage

### Buttons

- **Mandatory:** Use PrimeNG `p-button` component or `pButton` directive.
- **Forbidden:** Vanilla `<button>` elements with ad-hoc styling, unless for highly specialized UI (e.g., mobile toggles).
- **Styles:** Use `[rounded]="true"` for all brand-aligned buttons.

### Cards

- **Mandatory:** Use PrimeNG `p-card` or the `.card` utility class from `standardized-components.scss`.
- **Hover:** Use `var(--hover-shadow-md)` for interactive cards.

### Forms

- **Mandatory:** Use `pInputText`, `p-select`, `p-toggleSwitch`.
- **Spacing:** Use standard spacing tokens: `var(--space-4)` (16px), `var(--space-6)` (24px).

## 3. Style Encapsulation & Specificity

- **Forbidden:** Overuse of `!important` to fix CSS specificity. If you need it, re-evaluate your selector strategy.
- **Avoid:** `:host ::ng-deep`. Instead, move global component overrides to `primeng-integration.scss` or use PrimeNG's Pass-Through (PT) properties.
- **Standard:** All component styles MUST be in a dedicated `.scss` file, NOT inline in the `.ts` file.

## 4. Remediation Checklist for Code Reviews

- [ ] Does this PR use any hardcoded hex codes (#fff, #000)?
- [ ] Are any "black on green" contrast violations present?
- [ ] Are PrimeNG components used instead of vanilla HTML for UI controls?
- [ ] Are spacing values matching the 8px grid (var(--space-X))?
- [ ] Is the code meeting WCAG AA contrast standards?

## 5. Automation & Tooling

- Run `npm run lint` before committing.
- Use the `Design System Audit` tool periodically to scan for violations.
