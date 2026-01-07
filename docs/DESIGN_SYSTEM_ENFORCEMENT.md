# Design System Enforcement Policy

**Status:** ✅ **ACTIVE**  
**Effective Date:** January 2026  
**Phase:** 4.1 — Incremental Enforcement

---

## 🎯 Policy Overview

This document defines the **incremental enforcement** strategy for design system rules. Legacy violations are tolerated temporarily, but **any file changed after the effective date must be compliant**.

---

## 📋 Enforcement Modes

### Global Mode (Report Only)

**Purpose:** Report violations across entire codebase  
**Severity:** Warnings (non-blocking)  
**Use Case:** Understanding scope of violations

```bash
npm run lint:css:all
```

**Output:** Lists all violations but doesn't fail the build.

### Changed Files Mode (Strict Enforcement)

**Purpose:** Enforce rules on files changed in PRs  
**Severity:** Errors (blocking)  
**Use Case:** CI/CD enforcement

```bash
npm run lint:css:changed
```

**Output:** Fails if any changed file has violations.

---

## 🔒 Enforcement Rules

### Legacy Scope (Tolerated)

**Definition:** Files that existed before January 2026  
**Status:** ✅ **Tolerated** (warnings only)  
**Action:** No blocking enforcement

**Legacy files may contain:**
- Raw spacing values (px/rem)
- Raw colors (hex/rgb)
- PrimeNG overrides in component SCSS
- `!important` without tickets
- `[rounded]="true"` usage

**Note:** Legacy files should be cleaned up incrementally, but violations don't block merges.

### Enforced Scope (Strict)

**Definition:** Any file changed after January 2026  
**Status:** 🔴 **Enforced** (errors block merge)  
**Action:** Must be compliant before merge

**Changed files must:**
- ✅ Use spacing tokens (`var(--space-*)`)
- ✅ Use color tokens (`var(--ds-*)`, `var(--color-*)`)
- ✅ No PrimeNG overrides in component SCSS (use `primeng/brand-overrides.scss` or `@layer overrides`)
- ✅ No `!important` without documented exception ticket
- ✅ No `[rounded]="true"` usage
- ✅ No raw spacing values
- ✅ No raw colors

---

## 🛠️ Developer Workflow

### Before Making Changes

1. **Check what files you're changing:**
   ```bash
   git status
   ```

2. **Run lint on changed files locally:**
   ```bash
   npm run lint:css:changed
   ```

### When You Touch a File

**Rule:** If you modify a file, you must fix all violations in that file.

**Steps:**

1. **Make your changes** (feature work, bug fix, etc.)

2. **Run lint on changed files:**
   ```bash
   npm run lint:css:changed
   ```

3. **Fix violations:**
   ```bash
   # Auto-fix what can be fixed
   npm run lint:css:fix
   
   # Manually fix remaining violations:
   # - Replace hex colors: #089949 → var(--ds-primary-green)
   # - Replace raw spacing: 16px → var(--space-4)
   # - Remove PrimeNG overrides: Move .p-* styles to primeng/brand-overrides.scss
   # - Remove !important: Refactor or move to @layer overrides with ticket
   ```

4. **Verify fixes:**
   ```bash
   npm run lint:css:changed
   ```

### Common Violations & Fixes

#### 1. Raw Colors

**Violation:**
```scss
color: #089949;
background: rgb(8, 153, 73);
```

**Fix:**
```scss
color: var(--ds-primary-green);
background: var(--ds-primary-green);
```

#### 2. Raw Spacing

**Violation:**
```scss
padding: 16px;
margin: 0.5rem;
gap: 12px;
```

**Fix:**
```scss
padding: var(--space-4);  // 16px
margin: var(--space-2);   // 8px (0.5rem)
gap: var(--space-3);      // 12px
```

#### 3. PrimeNG Overrides

**Violation:**
```scss
// component.component.scss
.p-button {
  background: red;
}
```

**Fix:**
```scss
// Move to angular/src/assets/styles/primeng/_brand-overrides.scss
// OR use @layer overrides with exception ticket
```

#### 4. !important Without Ticket

**Violation:**
```scss
width: 100% !important;
```

**Fix:**
```scss
// Option 1: Remove !important and refactor
width: 100%;

// Option 2: Move to @layer overrides with ticket
@layer overrides {
  /*
   * EXCEPTION
   * Ticket: DS-123
   * Reason: PrimeNG limitation
   * Scope: component-name only
   * Owner: @dev-name
   * Remove by: 2026-02-15
   */
  .component-name {
    width: 100% !important;
  }
}
```

#### 5. [rounded]="true"

**Violation:**
```html
<p-button [rounded]="true">Click</p-button>
```

**Fix:**
```html
<p-button>Click</p-button>
<!-- Use default raised style (8px radius) -->
```

---

## 🔍 CI/CD Integration

### Pull Requests

**Automated Check:** `design-system-enforcement` job runs on every PR

**Behavior:**
- ✅ Scans only files changed in the PR
- ✅ Fails if any changed file has violations
- ✅ Passes if no SCSS/CSS files changed
- ✅ Passes if all changed files are compliant

**Example Output:**
```
🔍 Design System: Changed Files Enforcement
============================================

📋 Changed files to lint:
   - angular/src/app/features/dashboard/player-dashboard.component.scss

🔍 Running stylelint (strict mode)...
Checking: src/app/features/dashboard/player-dashboard.component.scss
❌ Violations found in: src/app/features/dashboard/player-dashboard.component.scss

❌ Design system checks FAILED
```

### Main Branch

**Automated Check:** Global scan runs (warnings only, non-blocking)

**Purpose:** Track overall violation count over time

---

## 📊 Violation Types

| Violation | Legacy Files | Changed Files |
|-----------|--------------|---------------|
| **Raw Colors** | ⚠️ Warning | 🔴 Error |
| **Raw Spacing** | ⚠️ Warning | 🔴 Error |
| **PrimeNG Overrides** | ⚠️ Warning | 🔴 Error |
| **!important (no ticket)** | ⚠️ Warning | 🔴 Error |
| **[rounded]="true"** | ⚠️ Warning | 🔴 Error |
| **transition: all** | ⚠️ Warning | 🔴 Error |

---

## 🚀 Quick Reference

### Local Development

```bash
# Check changed files only (strict)
npm run lint:css:changed

# Check all files (report mode)
npm run lint:css:all

# Auto-fix violations
npm run lint:css:fix
```

### CI/CD

- **PRs:** Automatically runs `lint:css:changed` (strict enforcement)
- **Main branch:** Runs `lint:css:all` (report mode)

---

## 📝 Exception Process

If you need to introduce a violation in a changed file:

1. **Document exception** in `angular/src/assets/styles/overrides/_exceptions.scss`
2. **Include ticket ID** and removal date
3. **Get approval** from design system curator
4. **Set expiry date** (max 3 months)

**Exception Template:**
```scss
@layer overrides {
  /*
   * EXCEPTION
   * Ticket: DS-123
   * Reason: PrimeNG limitation
   * Scope: component-name only
   * Owner: @dev-name
   * Remove by: 2026-02-15
   */
  .component-name {
    width: 100% !important;
  }
}
```

---

## 🔗 Related Documents

- [Design System Rules](./DESIGN_SYSTEM_RULES.md)
- [Phase 4 Audit](./PHASE_4_UI_TO_DESIGN_SYSTEM_AUDIT.md)
- [Canonical Pages](./CANONICAL_PAGES.md)

---

## ❓ FAQ

### Q: What if I only change one line in a file?

**A:** You must fix all violations in that file, not just the line you changed. This ensures incremental cleanup.

### Q: Can I skip fixing violations if it's a critical bug fix?

**A:** No. Fix violations as part of your change. If time is critical, create an exception ticket first.

### Q: What if the file is too large to fix in one PR?

**A:** Break it into smaller PRs, or create an exception ticket with a cleanup plan.

### Q: How do I know if a file is "legacy"?

**A:** If the file existed before January 2026, it's legacy. Any changes after that date make it "changed" and subject to enforcement.

### Q: Can I run lint on specific files?

**A:** Yes, use stylelint directly:
```bash
cd angular
npx stylelint "src/path/to/file.scss" --config ../.stylelintrc.cjs
```

---

**Last Updated:** January 2026  
**Next Review:** 2026-Q2  
**Maintained By:** Design System Governance Engineer

