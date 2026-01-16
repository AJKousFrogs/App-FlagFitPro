# Systematic Design System Refactoring Guide

This guide provides a step-by-step approach to upgrading your Angular app's UI while dealing with legacy CSS overrides.

## Overview

The refactoring process follows this workflow:

1. **Debug Overrides** → Identify what's breaking
2. **Build Isolated Preview** → Test in Storybook first
3. **Systematic Refactor** → Component-by-component migration
4. **Verify & Iterate** → Visual regression testing

---

## Step 1: Debug Overrides First

### Use Chrome DevTools

1. **Inspect problematic elements:**

   ```bash
   # Open DevTools (F12)
   # Right-click element → Inspect
   # Check Styles pane for crossed-out rules
   ```

2. **Check specificity scores:**
   - Hover over selectors in Styles pane
   - Higher specificity wins (e.g., `0,1,1,0` beats `0,0,1,0`)

3. **Find override sources:**
   - Look for file names in gray text
   - Check for `!important` flags
   - Review Computed tab for final values

### Automated Detection

```bash
# Find legacy --dark-* variables
npm run refactor:find-dark

# Auto-fix legacy variables
npm run refactor:find-dark:fix
```

### Manual Inspection Script

See `docs/CSS_OVERRIDE_DEBUGGING_GUIDE.md` for DevTools console scripts to:

- Find all overridden CSS rules
- Calculate specificity scores
- Identify ViewEncapsulation issues

---

## Step 2: Build Isolated Preview (Storybook)

### Start Storybook

```bash
npm run storybook
```

### View Design System Showcase

Navigate to: **Design System → Showcase**

This shows:

- ✅ Colors (primary green #089949, text colors, status colors)
- ✅ Buttons (primary, outlined, text, icon-only)
- ✅ Cards (standard, with footer)
- ✅ Spacing (8px grid tokens)
- ✅ Typography (H1-H6, body text)

### Create Component Stories

Before refactoring a component, create a Storybook story:

```typescript
// angular/src/app/features/today/today.component.stories.ts
import type { Meta, StoryObj } from "@storybook/angular";
import { TodayComponent } from "./today.component";

const meta: Meta<TodayComponent> = {
  title: "Features/Today",
  component: TodayComponent,
};

export default meta;
type Story = StoryObj<TodayComponent>;

export const Default: Story = {};
```

### Test in Isolation

1. Run Storybook: `npm run storybook`
2. Navigate to your component story
3. Verify design system tokens are applied
4. Check for legacy CSS interference
5. Screenshot for comparison

---

## Step 3: Systematic Refactor

### Component-by-Component Approach

**Option 1: Single Component**

```bash
# Preview changes (dry run)
npm run refactor:component -- --component=today --dry-run

# Apply changes
npm run refactor:component -- --component=today
```

**Option 2: All Components**

```bash
# Preview all changes
npm run refactor:all -- --dry-run

# Apply all changes
npm run refactor:all
```

### Manual Refactoring Checklist

For each component:

- [ ] **Replace hardcoded spacing:**

  ```scss
  // ❌ Before
  padding: 16px;
  gap: 24px;

  // ✅ After
  padding: var(--space-4);
  gap: var(--space-6);
  ```

- [ ] **Replace hardcoded font sizes:**

  ```scss
  // ❌ Before
  font-size: 1.125rem;

  // ✅ After
  font-size: var(--font-heading-sm);
  ```

- [ ] **Replace hardcoded colors:**

  ```scss
  // ❌ Before
  background: #089949;
  color: #ffffff;

  // ✅ After
  background: var(--ds-primary-green);
  color: var(--color-text-on-primary);
  ```

- [ ] **Replace hardcoded border radius:**

  ```scss
  // ❌ Before
  border-radius: 12px;

  // ✅ After
  border-radius: var(--radius-lg);
  ```

- [ ] **Use PrimeNG tokens:**

  ```scss
  // ✅ Use PrimeNG design tokens via CSS custom properties
  :host {
    --p-card-body-padding: var(--space-4);
    --p-card-body-gap: var(--space-3);
  }
  ```

- [ ] **Wrap in cascade layers:**
  ```scss
  @layer design-system {
    // New design system styles
    .my-component {
      // Uses design tokens
    }
  }
  ```

### Screen-by-Screen Approach

For complex screens with multiple components:

1. **Identify all components in route:**

   ```bash
   # List components in a route
   ls angular/src/app/features/dashboard/
   ```

2. **Refactor in dependency order:**
   - Start with leaf components (no dependencies)
   - Work up to parent components
   - Finish with route component

3. **Test after each component:**
   - Run Storybook story
   - Check in DevTools
   - Verify no regressions

---

## Step 4: Verify and Iterate

### Visual Regression Testing

**Setup Cypress + Percy:**

```bash
# Install dependencies
npm install --save-dev @percy/cypress cypress

# Run visual tests
npx cypress run --spec "cypress/e2e/visual-regression.cy.ts"
```

**Example test:**

```typescript
// cypress/e2e/visual-regression.cy.ts
describe("Visual Regression", () => {
  it("Today component matches design system", () => {
    cy.visit("/today");
    cy.percySnapshot("Today Component");
  });
});
```

### Manual Verification

1. **Screenshot before/after:**

   ```bash
   # Before refactoring
   # Take screenshot of component

   # After refactoring
   # Take screenshot and compare
   ```

2. **Check DevTools:**
   - Verify design tokens are applied
   - Check for no legacy overrides
   - Confirm specificity is correct

3. **Test interactions:**
   - Hover states
   - Focus states
   - Active/pressed states
   - Disabled states

### Update Design System JSON

After successful refactoring:

```bash
# Update design-system.json with working values
# Use as reference for future AI prompts
```

---

## Common Issues & Solutions

### Issue 1: Legacy CSS Overriding New Styles

**Problem:** Higher specificity in legacy CSS

**Solution:** Use `@layer` or increase specificity

```scss
@layer design-system {
  .p-button {
    background: var(--ds-primary-green) !important;
  }
}
```

### Issue 2: ViewEncapsulation Blocking Styles

**Problem:** Angular Emulated encapsulation adds `_ngcontent-*` attributes

**Solution:** Use `ViewEncapsulation.None` for wrapper components or CSS custom properties

```typescript
// For wrapper components (e.g., modals)
@Component({
  encapsulation: ViewEncapsulation.None,
  styles: [`
    app-my-component .p-button {
      background: var(--ds-primary-green);
    }
  `]
})

// Or use CSS custom properties (preferred)
:host {
  --p-button-primary-background: var(--ds-primary-green);
}
```

### Issue 3: PrimeNG Component Overrides

**Problem:** PrimeNG styles overriding design system

**Solution:** Use PrimeNG CSS variables

```scss
:root {
  --p-button-primary-background: var(--ds-primary-green);
  --p-button-primary-color: var(--color-text-on-primary);
}
```

### Issue 4: Black Text on Green Buttons

**Problem:** Legacy CSS forcing black text

**Solution:** Use critical override layer

```scss
@layer overrides {
  .p-button-primary * {
    color: var(--color-text-on-primary) !important;
  }
}
```

---

## Best Practices

1. **Always test in Storybook first** - Isolated environment prevents interference
2. **Refactor one component at a time** - Easier to debug and verify
3. **Use cascade layers** - Prevents specificity wars
4. **Document changes** - Update component comments with "Design System Compliant"
5. **Commit per component** - Easier to rollback if needed
6. **Visual regression test** - Catch regressions early

---

## Quick Reference

### Design Tokens

```scss
// Colors
--ds-primary-green: #089949;
--color-text-on-primary: #ffffff;
--color-text-primary: #1a1a1a;

// Spacing (8px grid)
--space-1: 4px;
--space-2: 8px;
--space-4: 16px;
--space-6: 24px;

// Typography
--font-heading-sm: 1.125rem;
--font-body-md: 1rem;
--font-body-sm: 0.875rem;

// Border Radius
--radius-lg: 12px;
```

### PrimeNG Tokens

```scss
--p-card-body-padding: 16px;
--p-card-body-gap: 12px;
--p-button-border-radius: 12px;
--p-button-icon-only-width: 44px;
```

### Commands

```bash
# Debug
npm run refactor:find-dark

# Refactor
npm run refactor:component -- --component=<name>

# Storybook
npm run storybook

# Visual Tests
npx cypress run
```

---

## Next Steps

1. ✅ Run `npm run refactor:find-dark` to identify legacy variables
2. ✅ Start Storybook: `npm run storybook`
3. ✅ Create stories for components you're refactoring
4. ✅ Refactor one component: `npm run refactor:component -- --component=today`
5. ✅ Verify in Storybook and DevTools
6. ✅ Commit changes
7. ✅ Repeat for next component

---

_For detailed DevTools debugging, see `docs/CSS_OVERRIDE_DEBUGGING_GUIDE.md`_
