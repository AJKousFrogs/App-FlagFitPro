# Quick Start: Design System Refactoring

## 🚀 Get Started in 5 Minutes

### 1. Find Legacy Issues

```bash
# Find all legacy --dark-* variables
npm run refactor:find-dark

# Auto-fix them
npm run refactor:find-dark:fix
```

### 2. Start Storybook

```bash
# View design system showcase
npm run storybook
```

Navigate to: **Design System → Showcase**

### 3. Refactor a Component

```bash
# Preview changes (dry run)
npm run refactor:component -- --component=today --dry-run

# Apply changes
npm run refactor:component -- --component=today
```

### 4. Verify in DevTools

1. Open Chrome DevTools (F12)
2. Inspect refactored component
3. Check Styles pane for design tokens
4. Verify no crossed-out rules

### 5. Test in Storybook

1. Create/update component story
2. View in Storybook
3. Compare with design system showcase
4. Screenshot for reference

---

## 📋 Complete Workflow

See `docs/SYSTEMATIC_REFACTORING_GUIDE.md` for:

- Detailed debugging steps
- Component-by-component approach
- Visual regression testing setup
- Common issues & solutions

---

## 🛠️ Available Commands

```bash
# Debug
npm run refactor:find-dark          # Find legacy variables
npm run refactor:find-dark:fix      # Auto-fix legacy variables

# Refactor
npm run refactor:component          # Refactor single component
npm run refactor:all                # Refactor all components

# Storybook
npm run storybook                   # Start Storybook
npm run storybook:build            # Build Storybook
```

---

## 📚 Documentation

- **CSS Override Debugging:** `docs/CSS_OVERRIDE_DEBUGGING_GUIDE.md`
- **Systematic Refactoring:** `docs/SYSTEMATIC_REFACTORING_GUIDE.md`
- **Design System Rules:** `docs/DESIGN_SYSTEM_RULES.md`
- **Design Tokens:** `design-system.json`

---

## ✅ Checklist

Before refactoring a component:

- [ ] Run `npm run refactor:find-dark` to check for legacy variables
- [ ] Create/update Storybook story
- [ ] Test component in Storybook
- [ ] Run refactor script (dry-run first)
- [ ] Verify in DevTools
- [ ] Test interactions (hover, focus, etc.)
- [ ] Screenshot for comparison
- [ ] Commit changes

---

_Ready to start? Run `npm run refactor:find-dark` to see what needs fixing!_
