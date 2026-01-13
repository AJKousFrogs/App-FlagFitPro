# Next Steps: Design System Refactoring

## ✅ Completed Setup

1. ✅ CSS override debugging guide created
2. ✅ Storybook design system showcase created
3. ✅ CSS cascade layers system implemented
4. ✅ Legacy variable detection script working
5. ✅ Systematic refactoring script ready
6. ✅ Design system JSON extracted
7. ✅ Documentation complete

## 🎯 Immediate Next Steps

### Step 1: Review Legacy Variables (5 min)

```bash
# Run the detection script
npm run refactor:find-dark
```

**What to look for:**

- Actual CSS variables starting with `--dark-*` (not class names)
- Files that need manual review vs auto-fix
- False positives (class names like `.dark-theme` are OK)

**Action:** Review the output and identify which files need attention.

### Step 2: Start Storybook (2 min)

```bash
# Start Storybook
npm run storybook
```

**What to do:**

1. Navigate to **Design System → Showcase**
2. Review colors, buttons, cards, spacing, typography
3. Verify design tokens are working correctly
4. Use as reference when refactoring components

### Step 3: Refactor First Component (15-30 min)

**Recommended:** Start with `today` component (already has Storybook story)

```bash
# Preview changes (dry run)
npm run refactor:component -- --component=today --dry-run

# Review the output, then apply
npm run refactor:component -- --component=today
```

**Manual steps:**

1. Open `angular/src/app/features/today/today.component.ts`
2. Check inline styles for hardcoded values
3. Replace with design tokens:
   - `16px` → `var(--space-4)`
   - `24px` → `var(--space-6)`
   - `#089949` → `var(--ds-primary-green)`
   - `12px` → `var(--radius-lg)`

4. Verify in Storybook:

   ```bash
   npm run storybook
   # Navigate to Features → Today
   ```

5. Check in DevTools:
   - Open Chrome DevTools (F12)
   - Inspect component elements
   - Verify design tokens are applied
   - Check for no crossed-out rules

### Step 4: Verify & Commit

**Before committing:**

- [ ] Component works in Storybook
- [ ] Component works in app (`npm start`)
- [ ] No visual regressions
- [ ] DevTools shows design tokens
- [ ] No console errors

**Commit message:**

```
refactor(today): migrate to design system tokens

- Replace hardcoded spacing with --space-* tokens
- Replace hardcoded colors with --ds-primary-green
- Replace hardcoded font sizes with --font-* tokens
- Replace hardcoded border radius with --radius-* tokens
- Verify in Storybook and DevTools
```

## 📋 Component Refactoring Checklist

For each component:

### Pre-Refactor

- [ ] Run `npm run refactor:find-dark` to check for legacy variables
- [ ] Create/update Storybook story
- [ ] Test component in Storybook (baseline)

### During Refactor

- [ ] Replace hardcoded spacing values
- [ ] Replace hardcoded font sizes
- [ ] Replace hardcoded colors
- [ ] Replace hardcoded border radius
- [ ] Use PrimeNG design tokens where applicable
- [ ] Wrap new styles in `@layer design-system`

### Post-Refactor

- [ ] Test in Storybook
- [ ] Test in app (`npm start`)
- [ ] Verify in DevTools
- [ ] Check for no regressions
- [ ] Screenshot for comparison
- [ ] Update component comment: "Design System Compliant"

## 🔄 Systematic Approach

### Phase 1: High-Impact Components (Week 1)

1. `today` - Main dashboard
2. `player-dashboard` - Already compliant (benchmark)
3. `coach-dashboard` - Coach view
4. `training-schedule` - Schedule view

### Phase 2: Feature Components (Week 2)

1. `analytics` - Analytics pages
2. `wellness` - Wellness tracking
3. `community` - Community features
4. `chat` - Chat interface

### Phase 3: Shared Components (Week 3)

1. `button` - Button component
2. `card` - Card component
3. `input` - Form inputs
4. `dialog` - Dialogs/modals

### Phase 4: Polish & Documentation (Week 4)

1. Final visual regression testing
2. Update all component documentation
3. Create component library in Storybook
4. Document patterns and best practices

## 🛠️ Tools & Commands

### Debugging

```bash
npm run refactor:find-dark          # Find legacy variables
npm run refactor:find-dark:fix      # Auto-fix (use carefully)
```

### Refactoring

```bash
npm run refactor:component -- --component=<name> --dry-run
npm run refactor:component -- --component=<name>
npm run refactor:all                # All components
```

### Storybook

```bash
npm run storybook                   # Start Storybook
npm run storybook:build            # Build Storybook
```

### Development

```bash
npm start                           # Start Angular app
npm run lint:css                   # Lint CSS/SCSS
npm run lint:ds                    # Design system check
```

## 📚 Reference Documentation

- **Quick Start:** `docs/REFACTORING_QUICK_START.md`
- **Complete Guide:** `docs/SYSTEMATIC_REFACTORING_GUIDE.md`
- **Debugging:** `docs/CSS_OVERRIDE_DEBUGGING_GUIDE.md`
- **Design System Rules:** `docs/DESIGN_SYSTEM_RULES.md`
- **Design Tokens:** `design-system.json`

## 🎨 Design Token Quick Reference

### Colors

```scss
--ds-primary-green: #089949;
--color-text-on-primary: #ffffff;
--color-text-primary: #1a1a1a;
--color-text-secondary: #4a4a4a;
```

### Spacing (8px grid)

```scss
--space-1: 4px;
--space-2: 8px;
--space-4: 16px;
--space-6: 24px;
--space-8: 32px;
```

### Typography

```scss
--font-heading-lg: 1.5rem;
--font-heading-sm: 1.125rem;
--font-body-md: 1rem;
--font-body-sm: 0.875rem;
```

### Border Radius

```scss
--radius-lg: 12px;
--radius-md: 8px;
--radius-sm: 6px;
```

## ⚠️ Common Issues & Solutions

### Issue: Legacy CSS Overriding New Styles

**Solution:** Use `@layer design-system` or increase specificity

### Issue: ViewEncapsulation Blocking Styles

**Solution:** Use `:host ::ng-deep` for PrimeNG overrides

### Issue: Black Text on Green Buttons

**Solution:** Use `@layer overrides` with `!important`

### Issue: Storybook Not Starting

**Solution:** Check if Storybook dependencies are installed:

```bash
cd angular
npm install --save-dev @storybook/angular @storybook/addon-essentials
```

## 🎯 Success Metrics

After refactoring, you should see:

- ✅ No hardcoded pixel/rem values
- ✅ All colors use design tokens
- ✅ Consistent spacing (8px grid)
- ✅ Consistent typography
- ✅ No legacy `--dark-*` variables
- ✅ White text on green buttons
- ✅ Components work in Storybook
- ✅ No visual regressions

---

**Ready to start?** Run `npm run refactor:find-dark` to see what needs fixing!
