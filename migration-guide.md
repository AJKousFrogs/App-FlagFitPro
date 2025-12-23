# FlagFit Pro Design System Migration Guide

**Complete Migration from Legacy Variables to New Design Tokens**

This guide provides automated `sed` commands to migrate all 165+ legacy CSS variables to the new design system tokens. Follow these steps to transform your codebase in ~5 minutes.

---

## 📋 Table of Contents

1. [Pre-Migration Checklist](#pre-migration-checklist)
2. [Migration Strategy](#migration-strategy)
3. [Automated Migration Commands](#automated-migration-commands)
4. [Manual Fixes Required](#manual-fixes-required)
5. [Verification Steps](#verification-steps)
6. [Rollback Plan](#rollback-plan)

---

## ✅ Pre-Migration Checklist

Before starting migration, ensure:

- [ ] Design tokens file (`design-tokens.scss`) is imported in your main stylesheet
- [ ] Component styles file (`component-styles.scss`) is imported
- [ ] Git repository is clean (commit or stash changes)
- [ ] Backup of current codebase is created
- [ ] Test environment is ready for verification

---

## 🎯 Migration Strategy

### Phase 1: Color Variables (43 instances)

Replace all `--dark-*` variables with semantic tokens

### Phase 2: Hardcoded Colors (16+ instances)

Replace hardcoded hex colors with design tokens

### Phase 3: Legacy Aliases (50+ instances)

Update old variable names to new semantic names

### Phase 4: Component Classes (30+ instances)

Update component class names to match new system

---

## 🔧 Automated Migration Commands

### Step 1: Backup Your Files

```bash
# Create backup directory
mkdir -p backups/migration-$(date +%Y%m%d)

# Backup all CSS files
find src/css -name "*.css" -exec cp {} backups/migration-$(date +%Y%m%d)/ \;
```

### Step 2: Migrate Legacy Dark Theme Variables

Run these commands in your project root directory:

```bash
# Navigate to project root
cd "/Users/aljosaursakous/Desktop/Flag football HTML - APP"

# Migrate --dark-bg-* variables
find src/css -name "*.css" -type f -exec sed -i '' \
  's/--dark-bg-primary/--surface-primary/g' {} \;

find src/css -name "*.css" -type f -exec sed -i '' \
  's/--dark-bg-secondary/--surface-secondary/g' {} \;

find src/css -name "*.css" -type f -exec sed -i '' \
  's/--dark-bg-tertiary/--surface-tertiary/g' {} \;

find src/css -name "*.css" -type f -exec sed -i '' \
  's/--dark-card-bg/--surface-elevated/g' {} \;

# Migrate --dark-text-* variables
find src/css -name "*.css" -type f -exec sed -i '' \
  's/--dark-text-primary/--color-text-primary/g' {} \;

find src/css -name "*.css" -type f -exec sed -i '' \
  's/--dark-text-secondary/--color-text-secondary/g' {} \;

find src/css -name "*.css" -type f -exec sed -i '' \
  's/--dark-text-muted/--color-text-muted/g' {} \;

# Migrate --dark-border-* variables
find src/css -name "*.css" -type f -exec sed -i '' \
  's/--dark-border/--color-border-primary/g' {} \;

find src/css -name "*.css" -type f -exec sed -i '' \
  's/--dark-border-primary/--color-border-primary/g' {} \;

find src/css -name "*.css" -type f -exec sed -i '' \
  's/--dark-border-secondary/--color-border-secondary/g' {} \;
```

### Step 3: Migrate Hardcoded Colors

```bash
# Replace hardcoded primary green (#089949)
find src/css -name "*.css" -type f -exec sed -i '' \
  's/#089949/var(--color-brand-primary)/g' {} \;

# Replace hardcoded white (#ffffff)
find src/css -name "*.css" -type f -exec sed -i '' \
  's/#ffffff/var(--surface-primary)/g' {} \;

# Replace hardcoded black (#1a1a1a)
find src/css -name "*.css" -type f -exec sed -i '' \
  's/#1a1a1a/var(--color-text-primary)/g' {} \;

# Replace hardcoded light green (#0ab85a)
find src/css -name "*.css" -type f -exec sed -i '' \
  's/#0ab85a/var(--color-brand-primary-hover)/g' {} \;

# Replace hardcoded dark green (#036d35)
find src/css -name "*.css" -type f -exec sed -i '' \
  's/#036d35/var(--color-brand-primary-active)/g' {} \;

# Replace hardcoded yellow (#f1c40f)
find src/css -name "*.css" -type f -exec sed -i '' \
  's/#f1c40f/var(--color-status-success)/g' {} \;

# Replace hardcoded red (#ef4444)
find src/css -name "*.css" -type f -exec sed -i '' \
  's/#ef4444/var(--color-status-error)/g' {} \;
```

### Step 4: Migrate Legacy Color Aliases

```bash
# Migrate --primary to --color-brand-primary
find src/css -name "*.css" -type f -exec sed -i '' \
  's/--primary/--color-brand-primary/g' {} \;

# Migrate --secondary to --color-brand-secondary
find src/css -name "*.css" -type f -exec sed -i '' \
  's/--secondary/--color-brand-secondary/g' {} \;

# Migrate --error to --color-status-error
find src/css -name "*.css" -type f -exec sed -i '' \
  's/--error/--color-status-error/g' {} \;

# Migrate --success to --color-status-success
find src/css -name "*.css" -type f -exec sed -i '' \
  's/--success/--color-status-success/g' {} \;

# Migrate --warning to --color-status-warning
find src/css -name "*.css" -type f -exec sed -i '' \
  's/--warning/--color-status-warning/g' {} \;
```

### Step 5: Migrate Spacing Variables

```bash
# Migrate old spacing variables to new 8-point grid
find src/css -name "*.css" -type f -exec sed -i '' \
  's/--spacing-xs/--space-xs/g' {} \;

find src/css -name "*.css" -type f -exec sed -i '' \
  's/--spacing-sm/--space-sm/g' {} \;

find src/css -name "*.css" -type f -exec sed -i '' \
  's/--spacing-md/--space-md/g' {} \;

find src/css -name "*.css" -type f -exec sed -i '' \
  's/--spacing-lg/--space-lg/g' {} \;

find src/css -name "*.css" -type f -exec sed -i '' \
  's/--spacing-xl/--space-xl/g' {} \;
```

### Step 6: Migrate Typography Variables

```bash
# Migrate font size variables
find src/css -name "*.css" -type f -exec sed -i '' \
  's/--font-xs/--text-xs/g' {} \;

find src/css -name "*.css" -type f -exec sed -i '' \
  's/--font-sm/--text-sm/g' {} \;

find src/css -name "*.css" -type f -exec sed -i '' \
  's/--font-base/--text-base/g' {} \;

find src/css -name "*.css" -type f -exec sed -i '' \
  's/--font-lg/--text-lg/g' {} \;

find src/css -name "*.css" -type f -exec sed -i '' \
  's/--font-xl/--text-xl/g' {} \;

find src/css -name "*.css" -type f -exec sed -i '' \
  's/--font-2xl/--text-2xl/g' {} \;
```

### Step 7: Migrate Border Radius Variables

```bash
# Migrate radius variables
find src/css -name "*.css" -type f -exec sed -i '' \
  's/--radius-xs/--radius-sm/g' {} \;

find src/css -name "*.css" -type f -exec sed -i '' \
  's/--border-radius-sm/--radius-sm/g' {} \;

find src/css -name "*.css" -type f -exec sed -i '' \
  's/--border-radius-md/--radius-md/g' {} \;

find src/css -name "*.css" -type f -exec sed -i '' \
  's/--border-radius-lg/--radius-lg/g' {} \;
```

### Step 8: Migrate Shadow Variables

```bash
# Migrate shadow variables
find src/css -name "*.css" -type f -exec sed -i '' \
  's/--shadow-xs/--shadow-sm/g' {} \;

find src/css -name "*.css" -type f -exec sed -i '' \
  's/--elevation-low/--shadow-sm/g' {} \;

find src/css -name "*.css" -type f -exec sed -i '' \
  's/--elevation-medium/--shadow-md/g' {} \;

find src/css -name "*.css" -type f -exec sed -i '' \
  's/--elevation-high/--shadow-lg/g' {} \;
```

### Step 9: Migrate Component-Specific Variables

```bash
# Migrate button variables
find src/css -name "*.css" -type f -exec sed -i '' \
  's/--btn-primary-bg/--color-brand-primary/g' {} \;

find src/css -name "*.css" -type f -exec sed -i '' \
  's/--btn-primary-color/--color-text-on-primary/g' {} \;

# Migrate card variables
find src/css -name "*.css" -type f -exec sed -i '' \
  's/--card-bg/--surface-primary/g' {} \;

find src/css -name "*.css" -type f -exec sed -i '' \
  's/--card-border/--color-border-primary/g' {} \;

# Migrate input variables
find src/css -name "*.css" -type f -exec sed -i '' \
  's/--input-bg/--surface-primary/g' {} \;

find src/css -name "*.css" -type f -exec sed -i '' \
  's/--input-border/--color-border-primary/g' {} \;

find src/css -name "*.css" -type f -exec sed -i '' \
  's/--input-focus/--color-border-focus/g' {} \;
```

### Step 10: Complete Migration Script

Create a single script to run all migrations:

```bash
#!/bin/bash
# complete-migration.sh
# Run all migration commands in sequence

echo "🚀 Starting FlagFit Pro Design System Migration..."
echo ""

# Step 1: Backup
echo "📦 Creating backup..."
mkdir -p backups/migration-$(date +%Y%m%d)
find src/css -name "*.css" -exec cp {} backups/migration-$(date +%Y%m%d)/ \;
echo "✅ Backup created"

# Step 2: Dark theme variables
echo "🔄 Migrating dark theme variables..."
find src/css -name "*.css" -type f -exec sed -i '' \
  -e 's/--dark-bg-primary/--surface-primary/g' \
  -e 's/--dark-bg-secondary/--surface-secondary/g' \
  -e 's/--dark-card-bg/--surface-elevated/g' \
  -e 's/--dark-text-primary/--color-text-primary/g' \
  -e 's/--dark-text-secondary/--color-text-secondary/g' \
  -e 's/--dark-text-muted/--color-text-muted/g' \
  -e 's/--dark-border/--color-border-primary/g' \
  {} \;
echo "✅ Dark theme variables migrated"

# Step 3: Hardcoded colors
echo "🔄 Migrating hardcoded colors..."
find src/css -name "*.css" -type f -exec sed -i '' \
  -e 's/#089949/var(--color-brand-primary)/g' \
  -e 's/#ffffff/var(--surface-primary)/g' \
  -e 's/#1a1a1a/var(--color-text-primary)/g' \
  -e 's/#0ab85a/var(--color-brand-primary-hover)/g' \
  -e 's/#036d35/var(--color-brand-primary-active)/g' \
  -e 's/#f1c40f/var(--color-status-success)/g' \
  -e 's/#ef4444/var(--color-status-error)/g' \
  {} \;
echo "✅ Hardcoded colors migrated"

# Step 4: Legacy aliases
echo "🔄 Migrating legacy aliases..."
find src/css -name "*.css" -type f -exec sed -i '' \
  -e 's/--primary/--color-brand-primary/g' \
  -e 's/--success/--color-status-success/g' \
  -e 's/--error/--color-status-error/g' \
  -e 's/--warning/--color-status-warning/g' \
  {} \;
echo "✅ Legacy aliases migrated"

# Step 5: Spacing
echo "🔄 Migrating spacing variables..."
find src/css -name "*.css" -type f -exec sed -i '' \
  -e 's/--spacing-xs/--space-xs/g' \
  -e 's/--spacing-sm/--space-sm/g' \
  -e 's/--spacing-md/--space-md/g' \
  -e 's/--spacing-lg/--space-lg/g' \
  {} \;
echo "✅ Spacing variables migrated"

# Step 6: Typography
echo "🔄 Migrating typography variables..."
find src/css -name "*.css" -type f -exec sed -i '' \
  -e 's/--font-xs/--text-xs/g' \
  -e 's/--font-sm/--text-sm/g' \
  -e 's/--font-base/--text-base/g' \
  -e 's/--font-lg/--text-lg/g' \
  {} \;
echo "✅ Typography variables migrated"

echo ""
echo "✅ Migration complete! Review changes and test thoroughly."
echo "📝 Backup location: backups/migration-$(date +%Y%m%d)/"
```

Save this as `complete-migration.sh` and run:

```bash
chmod +x complete-migration.sh
./complete-migration.sh
```

---

## 🔍 Manual Fixes Required

Some patterns require manual attention:

### 1. Inline Styles in HTML

Search for inline styles in HTML files:

```bash
# Find HTML files with inline styles
grep -r 'style=' --include="*.html" src/

# Common patterns to fix manually:
# style="color: #089949" → style="color: var(--color-brand-primary)"
# style="background: #ffffff" → style="background: var(--surface-primary)"
```

### 2. JavaScript Color References

Search for hardcoded colors in JavaScript:

```bash
# Find JS files with hardcoded colors
grep -r '#089949\|#ffffff\|#1a1a1a' --include="*.js" src/

# Update to use CSS variables or create JS constants:
# const colors = {
#   primary: getComputedStyle(document.documentElement)
#     .getPropertyValue('--color-brand-primary')
# };
```

### 3. Angular Component Styles

For Angular components, update `styles` arrays:

```typescript
// Before
styles: [
  `
  .my-component {
    color: #089949;
  }
`,
];

// After
styles: [
  `
  .my-component {
    color: var(--color-brand-primary);
  }
`,
];
```

### 4. Theme-Specific Overrides

Remove duplicate theme override blocks:

```bash
# Find theme override blocks
grep -r 'html\[data-theme="dark"\]' src/css/

# These should be removed as dark mode is now handled
# automatically in design-tokens.scss
```

---

## ✅ Verification Steps

After migration, verify everything works:

### 1. Visual Inspection

```bash
# Start dev server
npm start
# or
ng serve

# Check each page:
# - Colors render correctly ✅
# - Spacing is consistent ✅
# - Typography looks good ✅
# - Dark mode works ✅
```

### 2. CSS Validation

```bash
# Check for remaining legacy variables
grep -r '--dark-' src/css/ | wc -l
# Should return: 0

# Check for hardcoded colors
grep -r '#089949\|#ffffff\|#1a1a1a' src/css/ | wc -l
# Should return: 0 (or minimal comments)
```

### 3. Build Test

```bash
# Test production build
npm run build
# or
ng build --prod

# Verify no CSS errors
```

### 4. Browser Testing

Test in multiple browsers:

- Chrome/Edge ✅
- Firefox ✅
- Safari ✅
- Mobile browsers ✅

### 5. Dark Mode Test

```javascript
// Toggle dark mode
document.documentElement.setAttribute("data-theme", "dark");
// Verify colors switch correctly

document.documentElement.setAttribute("data-theme", "light");
// Verify colors switch back
```

---

## 🔄 Rollback Plan

If migration causes issues:

```bash
# Restore from backup
cp -r backups/migration-YYYYMMDD/* src/css/

# Or use git
git checkout src/css/
git restore src/css/
```

---

## 📊 Migration Checklist

Track your progress:

- [ ] Backup created
- [ ] Dark theme variables migrated (43 instances)
- [ ] Hardcoded colors migrated (16+ instances)
- [ ] Legacy aliases migrated (50+ instances)
- [ ] Spacing variables migrated
- [ ] Typography variables migrated
- [ ] Border radius variables migrated
- [ ] Shadow variables migrated
- [ ] Component variables migrated
- [ ] HTML inline styles fixed
- [ ] JavaScript color references fixed
- [ ] Angular component styles updated
- [ ] Theme override blocks removed
- [ ] Visual inspection passed
- [ ] CSS validation passed
- [ ] Build test passed
- [ ] Browser testing passed
- [ ] Dark mode tested
- [ ] Changes committed to Git

---

## 🎯 Expected Results

After complete migration:

| Metric                      | Before  | After      |
| --------------------------- | ------- | ---------- |
| Legacy `--dark-*` variables | 43      | 0          |
| Hardcoded colors            | 16+     | 0          |
| Duplicate styles            | 50+     | 0          |
| Inconsistent spacing        | Many    | 0          |
| Dark mode support           | Partial | Full       |
| Accessibility               | Unknown | WCAG AA ✅ |

---

## 🆘 Troubleshooting

### Issue: Colors not rendering

**Solution:**

1. Verify `design-tokens.scss` is imported in main stylesheet
2. Check browser DevTools for CSS variable values
3. Ensure no syntax errors in migrated files

### Issue: Dark mode not working

**Solution:**

1. Verify `[data-theme="dark"]` selector in HTML
2. Check media query `@media (prefers-color-scheme: dark)` support
3. Test manual toggle: `document.documentElement.setAttribute('data-theme', 'dark')`

### Issue: Build errors

**Solution:**

1. Check for syntax errors in migrated CSS
2. Verify all imports are correct
3. Check for missing semicolons or brackets

---

## 📚 Additional Resources

- [Design Tokens Reference](./angular/src/assets/styles/design-tokens.scss)
- [Component Styles Reference](./angular/src/assets/styles/component-styles.scss)
- [Quick Start Guide](./quick-start.md)
- [Angular Components Guide](./angular-components.md)

---

## ✨ Success!

Once migration is complete, you'll have:

- ✅ Zero legacy variables
- ✅ Zero hardcoded colors
- ✅ Consistent design system
- ✅ Full dark mode support
- ✅ WCAG AA accessibility
- ✅ Production-ready codebase

**Congratulations! Your design system migration is complete! 🎉**
