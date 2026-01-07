# Design System Enforcement — Quick Start

**For developers:** Quick reference for working with design system enforcement.

---

## 🚀 Quick Commands

### Before Committing

```bash
# Check if your changes pass design system rules
npm run lint:css:changed

# Auto-fix what can be fixed automatically
npm run lint:css:fix

# Check again after auto-fix
npm run lint:css:changed
```

### If Lint Fails

**Common fixes:**

1. **Hex colors** → Replace with tokens:
   ```scss
   # Before: color: #089949;
   # After:  color: var(--ds-primary-green);
   ```

2. **Raw spacing** → Replace with tokens:
   ```scss
   # Before: padding: 16px;
   # After:  padding: var(--space-4);
   ```

3. **PrimeNG overrides** → Move to `primeng/_brand-overrides.scss`:
   ```scss
   # Before: .p-button { background: red; } (in component.scss)
   # After:  Move to angular/src/assets/styles/primeng/_brand-overrides.scss
   ```

4. **!important** → Remove or move to `@layer overrides` with ticket:
   ```scss
   # Before: width: 100% !important;
   # After:  width: 100%; (or move to overrides with exception ticket)
   ```

---

## 📋 Common Token Reference

### Spacing Tokens

```scss
var(--space-1)   /* 4px */
var(--space-2)   /* 8px */
var(--space-3)   /* 12px */
var(--space-4)   /* 16px */
var(--space-5)   /* 20px */
var(--space-6)   /* 24px */
var(--space-8)   /* 32px */
var(--space-10)  /* 40px */
var(--space-12)  /* 48px */
```

### Color Tokens

```scss
var(--ds-primary-green)        /* Brand green */
var(--color-text-primary)     /* Text color */
var(--color-text-secondary)   /* Secondary text */
var(--color-status-success)   /* Success green */
var(--color-status-warning)   /* Warning yellow */
var(--color-status-error)     /* Error red */
var(--color-status-info)      /* Info blue */
```

---

## 🔍 How It Works

1. **CI automatically checks** changed files in PRs
2. **Only changed files** are enforced (legacy files tolerated)
3. **Violations block merge** until fixed

---

## 📚 Full Documentation

- [Design System Enforcement Policy](./DESIGN_SYSTEM_ENFORCEMENT.md)
- [Design System Rules](./DESIGN_SYSTEM_RULES.md)

---

**Need help?** Check the full enforcement policy or ask the design system curator.

