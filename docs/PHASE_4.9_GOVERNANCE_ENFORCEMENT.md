# Phase 4.9 — Governance Enforcement (Blocking Mode)

**Status:** ✅ **ACTIVE**  
**Effective Date:** January 2026  
**Phase:** 4.9 — Blocking Enforcement

---

## 🎯 Goal

Move from "warn-only" to **blocking enforcement** for changed files in CI/CD. Legacy files remain buildable, but any file modified after Phase 4.9 must be fully compliant.

---

## ✅ Preconditions Verified

1. **Canonical Page Compliance**
   - ✅ `player-dashboard.component.scss` is fully compliant
   - ✅ No raw colors, no raw spacing, no PrimeNG overrides
   - ✅ No `[rounded]="true"` usage

2. **PrimeNG Boundary Rules**
   - ✅ No `.p-*` selectors in component SCSS
   - ✅ All PrimeNG styling in allowed locations only

3. **Exceptions File**
   - ✅ `angular/src/assets/styles/overrides/_exceptions.scss` exists
   - ✅ Proper ticket + expiry format enforced
   - ✅ All `!important` exceptions documented

---

## 🔒 Blocking Rules (Changed Files Only)

### 1. Raw Colors (Hex/RGB)
**Rule:** Hex colors ONLY in `design-system-tokens.scss`  
**Enforcement:** Stylelint `color-no-hex` rule (error severity)  
**Status:** ✅ Already configured

**Violation Example:**
```scss
// ❌ BLOCKED
color: #089949;
background: rgb(8, 153, 73);
```

**Fix:**
```scss
// ✅ ALLOWED
color: var(--ds-primary-green);
background: var(--ds-primary-green);
```

---

### 2. Raw Spacing (px/rem)
**Rule:** Must use spacing tokens (`var(--space-*)`)  
**Enforcement:** Script-based check (via `design-system-check.sh`)  
**Status:** ✅ Enforced via existing script

**Violation Example:**
```scss
// ❌ BLOCKED
padding: 16px;
margin: 0.5rem;
gap: 12px;
```

**Fix:**
```scss
// ✅ ALLOWED
padding: var(--space-4);  // 16px
margin: var(--space-2);   // 8px
gap: var(--space-3);      // 12px
```

---

### 3. PrimeNG Overrides (.p-*)
**Rule:** `.p-*` selectors ONLY in allowed files:
- `primeng/_brand-overrides.scss`
- `primeng/_token-mapping.scss`
- `overrides/_exceptions.scss` (with ticket)

**Enforcement:** `scripts/check-primeng-selectors.sh`  
**Status:** ✅ New script integrated

**Violation Example:**
```scss
// ❌ BLOCKED (in component.component.scss)
.p-button {
  background: red;
}
```

**Fix:**
```scss
// ✅ ALLOWED (move to primeng/_brand-overrides.scss)
.p-button {
  background: var(--ds-primary-green);
}
```

---

### 4. `!important` Outside Exceptions
**Rule:** `!important` ONLY in `overrides/_exceptions.scss` with ticket + expiry  
**Enforcement:** Stylelint `declaration-no-important` rule (error severity)  
**Status:** ✅ Already configured

**Violation Example:**
```scss
// ❌ BLOCKED
width: 100% !important;
```

**Fix:**
```scss
// ✅ ALLOWED (in overrides/_exceptions.scss)
/*
 * Ticket: DS-EXC-001
 * Remove by: 2026-03-31
 * Reason: PrimeNG DataTable requires !important for paginator spacing
 */
@layer overrides {
  .p-datatable-paginator {
    padding: var(--space-2) !important;
  }
}
```

---

### 5. `[rounded]="true"` Usage
**Rule:** No `[rounded]="true"` in HTML templates  
**Enforcement:** `scripts/check-rounded-attribute.sh`  
**Status:** ✅ New script integrated

**Violation Example:**
```html
<!-- ❌ BLOCKED -->
<p-button [rounded]="true">Click me</p-button>
```

**Fix:**
```html
<!-- ✅ ALLOWED -->
<p-button>Click me</p-button>
```

```scss
// Use design tokens in component SCSS instead
.button {
  border-radius: var(--radius-full);
}
```

---

## 🛠️ Implementation Details

### CI/CD Integration

**Workflow:** `.github/workflows/ci.yml`  
**Job:** `design-system-enforcement`  
**Command:** `npm run lint:css:changed`

**Execution Flow:**
1. Detect changed SCSS/CSS/HTML files
2. Run `check-rounded-attribute.sh` (HTML files)
3. Run `check-primeng-selectors.sh` (SCSS files)
4. Run `stylelint` (SCSS files)
5. Fail build if any violations found

### Scripts

1. **`scripts/lint-changed-files.sh`**
   - Main entry point for CI
   - Orchestrates all checks
   - Returns exit code 1 on violations

2. **`scripts/check-rounded-attribute.sh`**
   - Checks HTML templates for `[rounded]="true"`
   - Only checks changed files
   - Exits with error if violations found

3. **`scripts/check-primeng-selectors.sh`**
   - Checks SCSS files for `.p-*` selectors
   - Skips allowed locations (`primeng/`, `overrides/`)
   - Exits with error if violations found

4. **`scripts/get-changed-files.sh`**
   - Detects changed files via git diff
   - Supports PR and push contexts
   - Returns space-separated list

### Stylelint Configuration

**File:** `.stylelintrc.cjs`

**Active Rules:**
- `color-no-hex`: Blocks hex colors (error)
- `declaration-no-important`: Blocks `!important` (error)
- `declaration-property-value-disallowed-list`: Blocks `transition: all`

**Overrides:**
- Allow hex colors in `design-system-tokens.scss`
- Allow `!important` in `overrides/**/*.scss` (with warning)

---

## 📋 Developer Workflow

### Before Committing

```bash
# Check changed files locally
npm run lint:css:changed
```

### If Violations Found

1. **Raw Colors:**
   ```scss
   # Replace hex with tokens
   # Before: color: #089949;
   # After:  color: var(--ds-primary-green);
   ```

2. **Raw Spacing:**
   ```scss
   # Replace px/rem with tokens
   # Before: padding: 16px;
   # After:  padding: var(--space-4);
   ```

3. **PrimeNG Overrides:**
   ```scss
   # Move .p-* selectors to primeng/_brand-overrides.scss
   ```

4. **!important:**
   ```scss
   # Remove or move to overrides/_exceptions.scss with ticket
   ```

5. **[rounded]="true":**
   ```html
   # Remove attribute, use border-radius tokens in SCSS
   ```

### Verify Fixes

```bash
npm run lint:css:changed
```

---

## 🔍 Legacy Files

**Status:** ✅ **Tolerated** (warnings only)

Legacy files (unchanged) remain buildable. Only files modified after Phase 4.9 are subject to blocking enforcement.

**Legacy files may contain:**
- Raw spacing values (px/rem)
- Raw colors (hex/rgb)
- PrimeNG overrides in component SCSS
- `!important` without tickets
- `[rounded]="true"` usage

**Note:** Legacy files should be cleaned up incrementally, but violations don't block merges.

---

## ✅ Verification

### Test Locally

```bash
# Simulate changed file check
git checkout -b test-phase-4.9
# Make a change to a component SCSS file
# Add a violation (e.g., color: #089949;)
npm run lint:css:changed
# Should fail with error
```

### CI Status

- ✅ CI workflow configured
- ✅ Scripts executable
- ✅ Legacy files excluded
- ✅ Allowed locations excluded

---

## 📊 Enforcement Summary

| Rule | Enforcement Method | Status |
|------|-------------------|--------|
| Raw Colors | Stylelint `color-no-hex` | ✅ Blocking |
| Raw Spacing | Script check | ✅ Blocking |
| PrimeNG `.p-*` | `check-primeng-selectors.sh` | ✅ Blocking |
| `!important` | Stylelint `declaration-no-important` | ✅ Blocking |
| `[rounded]="true"` | `check-rounded-attribute.sh` | ✅ Blocking |

---

## 🎯 Success Criteria

- ✅ CI blocks new violations in changed files
- ✅ Legacy files remain buildable
- ✅ All violations have clear error messages
- ✅ Developer workflow documented
- ✅ Preconditions verified

---

**Next Steps:**
- Monitor CI for violations
- Update documentation as needed
- Incrementally remediate legacy files

