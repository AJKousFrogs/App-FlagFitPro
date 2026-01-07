# Design System Enforcement — Verification Guide

**Quick guide to verify the enforcement setup is working correctly.**

---

## ✅ Local Verification

### Step 1: Test Changed Files Detection

```bash
# Make a test change to a SCSS file
echo "/* test */" >> angular/src/app/app.component.scss

# Check what files are detected as changed
bash scripts/get-changed-files.sh

# Expected output: angular/src/app/app.component.scss
```

### Step 2: Test Linting Changed Files

```bash
# Run lint on changed files
npm run lint:css:changed

# If you have violations, you'll see errors
# If clean, you'll see: ✅ All changed files pass design system checks
```

### Step 3: Test Global Report Mode

```bash
# Run lint on all files (warnings only)
npm run lint:css:all

# Expected: Shows warnings for legacy violations but doesn't fail
```

### Step 4: Clean Up Test Change

```bash
# Remove test change
git checkout angular/src/app/app.component.scss
```

---

## 🔍 CI/CD Verification

### Test in PR

1. **Create a test PR** with a SCSS file change
2. **Add a violation** (e.g., `color: #089949;`)
3. **Push to PR**
4. **Check CI logs** — should see:
   ```
   🔍 Design System: Changed Files Enforcement
   ❌ Violations found in: [file]
   ❌ Design system checks FAILED
   ```

### Test Clean PR

1. **Create a PR** with compliant SCSS changes
2. **Push to PR**
3. **Check CI logs** — should see:
   ```
   ✅ All changed files pass design system checks
   ```

---

## 🧪 Test Scenarios

### Scenario 1: New File (Must Be Compliant)

```bash
# Create new component
ng generate component test-component

# Add violation to test-component.component.scss
echo "color: #089949;" >> angular/src/app/test-component/test-component.component.scss

# Run lint
npm run lint:css:changed

# Expected: ❌ FAIL (new file must be compliant)
```

### Scenario 2: Modify Legacy File (Must Fix All Violations)

```bash
# Modify a legacy file with violations
echo "/* new comment */" >> angular/src/app/features/dashboard/coach-dashboard.component.scss

# Run lint
npm run lint:css:changed

# Expected: ❌ FAIL (must fix all violations in changed file)
```

### Scenario 3: Only TS File Changed (Skip)

```bash
# Only change TypeScript file
echo "// test" >> angular/src/app/app.component.ts

# Run lint
npm run lint:css:changed

# Expected: ✅ No SCSS/CSS files changed (skip)
```

---

## 📊 Expected Behavior

| Scenario | Changed Files | Legacy Files | Result |
|----------|---------------|--------------|--------|
| **New file with violation** | ❌ Error | N/A | **FAIL** |
| **Legacy file modified** | ❌ Error | ⚠️ Warning | **FAIL** (if violations in changed file) |
| **Only TS file changed** | N/A | N/A | **PASS** (skip) |
| **Compliant changes** | ✅ Pass | ⚠️ Warning | **PASS** |

---

## 🐛 Troubleshooting

### Issue: Script not found

```bash
# Make scripts executable
chmod +x scripts/get-changed-files.sh
chmod +x scripts/lint-changed-files.sh
chmod +x scripts/lint-all-files.sh
```

### Issue: Git not detecting changes

```bash
# Ensure you're in a git repository
git status

# Ensure files are staged or committed
git add .
```

### Issue: Stylelint not found

```bash
# Install dependencies
cd angular
npm ci
```

### Issue: Wrong base branch

```bash
# Specify base branch explicitly
bash scripts/lint-changed-files.sh develop
```

---

## ✅ Success Criteria

Enforcement is working correctly if:

1. ✅ `npm run lint:css:changed` detects changed files
2. ✅ Violations in changed files cause failure
3. ✅ No violations in changed files causes success
4. ✅ `npm run lint:css:all` shows warnings but doesn't fail
5. ✅ CI job runs on PRs and fails on violations

---

**Last Updated:** January 2026

