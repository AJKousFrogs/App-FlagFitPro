# ✅ Design System Refactoring Setup - Complete

## What's Been Set Up

### 1. ✅ CSS Override Debugging Guide

**Location:** `docs/CSS_OVERRIDE_DEBUGGING_GUIDE.md`

- DevTools inspection workflow
- Automated override detection scripts
- Specificity calculator
- Common override patterns & solutions

### 2. ✅ Storybook Design System Showcase

**Location:** `angular/src/stories/DesignSystem.stories.ts`

- Colors showcase (primary green #089949, text, status)
- Buttons showcase (primary, outlined, text, icon-only)
- Cards showcase
- Spacing showcase (8px grid)
- Typography showcase

**To view:** Run `npm run storybook` (add script if needed)

### 3. ✅ CSS Cascade Layers System

**Location:** `angular/src/assets/styles/cascade-layers.scss`

- `@layer base` - Legacy CSS (lowest priority)
- `@layer design-system` - New system (higher priority)
- `@layer overrides` - Critical fixes (highest priority)

**Usage:** Import in `styles.scss` before other stylesheets

### 4. ✅ Legacy Variable Detection Script

**Location:** `scripts/find-legacy-dark-variables.js`

**Commands:**

```bash
npm run refactor:find-dark          # Find legacy --dark-* variables
npm run refactor:find-dark:fix      # Auto-fix them
```

### 5. ✅ Systematic Refactoring Script

**Location:** `scripts/systematic-refactor.js`

**Commands:**

```bash
npm run refactor:component -- --component=<name> --dry-run
npm run refactor:component -- --component=<name>
npm run refactor:all
```

Automatically replaces:

- Hardcoded spacing → `var(--space-*)`
- Hardcoded font sizes → `var(--font-*)`
- Hardcoded colors → `var(--ds-primary-green)`, etc.
- Hardcoded border radius → `var(--radius-*)`

### 6. ✅ Design System JSON

**Location:** `design-system.json`

Complete design system specification extracted from reference screenshot:

- Colors (#089949 primary green)
- Spacing (8px grid)
- Typography (H1-H6, body text)
- Border radius (12px standard)
- Component specs (buttons, cards, dialogs)

### 7. ✅ Documentation

- **Quick Start:** `docs/REFACTORING_QUICK_START.md`
- **Complete Guide:** `docs/SYSTEMATIC_REFACTORING_GUIDE.md`
- **Debugging Guide:** `docs/CSS_OVERRIDE_DEBUGGING_GUIDE.md`

---

## Next Steps

### Immediate Actions

1. **Find legacy variables:**

   ```bash
   npm run refactor:find-dark
   ```

2. **Start Storybook** (if script exists):

   ```bash
   cd angular
   npm run storybook
   # Or: npx storybook@latest dev
   ```

3. **Refactor first component:**
   ```bash
   npm run refactor:component -- --component=today --dry-run
   ```

### Workflow

1. **Debug** → Use DevTools to identify overrides
2. **Preview** → Test in Storybook first
3. **Refactor** → Use automated script or manual
4. **Verify** → Check DevTools, test interactions
5. **Commit** → One component at a time

---

## File Structure

```
.
├── docs/
│   ├── CSS_OVERRIDE_DEBUGGING_GUIDE.md
│   ├── SYSTEMATIC_REFACTORING_GUIDE.md
│   └── REFACTORING_QUICK_START.md
├── scripts/
│   ├── find-legacy-dark-variables.js
│   └── systematic-refactor.js
├── angular/
│   ├── src/
│   │   ├── assets/styles/
│   │   │   └── cascade-layers.scss
│   │   └── stories/
│   │       └── DesignSystem.stories.ts
│   └── .storybook/
│       ├── main.ts
│       └── preview.ts
└── design-system.json
```

---

## Key Design System Rules

### Colors

- **Primary Green:** `#089949` → `var(--ds-primary-green)`
- **Text on Green:** `#ffffff` → `var(--color-text-on-primary)`
- **Text on White:** `#1a1a1a` → `var(--color-text-primary)`
- **❌ NEVER:** Black text on green backgrounds

### Spacing (8px Grid)

- `4px` → `var(--space-1)`
- `8px` → `var(--space-2)`
- `16px` → `var(--space-4)`
- `24px` → `var(--space-6)`

### Typography

- `1.5rem` → `var(--font-heading-lg)`
- `1.125rem` → `var(--font-heading-sm)`
- `1rem` → `var(--font-body-md)`
- `0.875rem` → `var(--font-body-sm)`

### Border Radius

- `12px` → `var(--radius-lg)` (standard)
- `8px` → `var(--radius-md)`
- `6px` → `var(--radius-sm)`

---

## Troubleshooting

### Storybook Not Starting

If Storybook scripts are missing, add to `angular/package.json`:

```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

### Cascade Layers Not Working

Ensure `cascade-layers.scss` is imported **first** in `angular/src/styles.scss`:

```scss
@use "./assets/styles/cascade-layers.scss" as *;
@use "./assets/styles/design-system-tokens.scss" as *;
// ... other imports
```

### Legacy Variables Not Found

The script searches for `--dark-*` patterns. If you have different legacy patterns, update `scripts/find-legacy-dark-variables.js`:

```javascript
const LEGACY_PATTERNS = [
  /--dark-[a-z-]+/gi,
  /--old-[a-z-]+/gi, // Add your patterns
];
```

---

## Success Criteria

After refactoring a component, verify:

- ✅ No hardcoded pixel/rem values
- ✅ All colors use design tokens
- ✅ Spacing uses `--space-*` tokens
- ✅ Typography uses `--font-*` tokens
- ✅ No legacy `--dark-*` variables
- ✅ PrimeNG components use design tokens
- ✅ White text on green buttons
- ✅ No black text on green backgrounds
- ✅ Works in Storybook (isolated)
- ✅ Works in app (with other components)

---

## Resources

- **Design System Audit:** `DESIGN_SYSTEM_AUDIT_REPORT.md`
- **PrimeNG Integration:** `docs/PRIMENG_DESIGN_SYSTEM_RULES.md`
- **UI Standardization:** `docs/UI_STANDARDIZATION_SUMMARY.md`

---

_Setup complete! Start refactoring with `npm run refactor:find-dark`_
