# Phase 4.1 — Incremental Enforcement Setup

**Status:** ✅ **COMPLETE**  
**Date:** January 2026  
**Purpose:** Set up enforcement boundaries for incremental design system compliance

---

## 🎯 Objectives Achieved

✅ **Legacy violations don't break builds** — Global mode reports warnings only  
✅ **New changes cannot introduce violations** — Changed files mode enforces strict rules  
✅ **CI fails only on changed files** — PR enforcement targets modified files only

---

## 📦 Deliverables

### 1. Scripts Created

| Script | Purpose | Usage |
|--------|---------|-------|
| `scripts/get-changed-files.sh` | Detects changed SCSS/CSS files | Used by lint scripts |
| `scripts/lint-changed-files.sh` | Lints changed files (strict) | CI enforcement |
| `scripts/lint-all-files.sh` | Lints all files (report mode) | Global violation tracking |

### 2. NPM Scripts Added

```json
{
  "lint:css:changed": "bash scripts/lint-changed-files.sh",
  "lint:css:all": "bash scripts/lint-all-files.sh"
}
```

### 3. CI/CD Integration

**File:** `.github/workflows/ci.yml`

**New Job:** `design-system-enforcement`
- Runs on every PR
- Detects changed SCSS/CSS files
- Fails if violations found in changed files
- Skips if no SCSS/CSS files changed

### 4. Documentation Created

| Document | Purpose |
|----------|---------|
| `DESIGN_SYSTEM_ENFORCEMENT.md` | Full enforcement policy |
| `DESIGN_SYSTEM_ENFORCEMENT_QUICK_START.md` | Quick reference for developers |
| `DESIGN_SYSTEM_ENFORCEMENT_VERIFICATION.md` | Verification guide |

### 5. Design System Rules Updated

**File:** `DESIGN_SYSTEM_RULES.md`

Added enforcement policy note at the top explaining incremental enforcement.

---

## 🔧 How It Works

### Enforcement Modes

#### Global Mode (Report Only)
- **Command:** `npm run lint:css:all`
- **Severity:** Warnings
- **Purpose:** Track violations across codebase
- **Blocks Build:** ❌ No

#### Changed Files Mode (Strict)
- **Command:** `npm run lint:css:changed`
- **Severity:** Errors
- **Purpose:** Enforce compliance on modified files
- **Blocks Build:** ✅ Yes (in CI)

### CI/CD Flow

```
PR Created
    ↓
CI Detects Changed Files
    ↓
Run lint:css:changed
    ↓
┌─────────────────┐
│ Violations?     │
└─────────────────┘
    ↓           ↓
   Yes         No
    ↓           ↓
  FAIL      PASS
```

---

## 📋 Enforcement Rules

### Legacy Files (Tolerated)

**Definition:** Files existing before January 2026  
**Status:** ⚠️ Warnings only  
**Action:** No blocking enforcement

### Changed Files (Enforced)

**Definition:** Any file modified after January 2026  
**Status:** 🔴 Errors block merge  
**Action:** Must fix all violations before merge

---

## 🚀 Usage

### For Developers

```bash
# Before committing
npm run lint:css:changed

# Auto-fix violations
npm run lint:css:fix

# Verify fixes
npm run lint:css:changed
```

### For CI/CD

Automatically runs on every PR — no manual action needed.

---

## ✅ Verification

### Local Test

```bash
# Test changed files detection
bash scripts/get-changed-files.sh

# Test linting
npm run lint:css:changed

# Test global report
npm run lint:css:all
```

### CI Test

1. Create PR with SCSS file change
2. Add violation (e.g., `color: #089949;`)
3. Push to PR
4. Verify CI fails with violation message

---

## 📊 Impact

### Before Phase 4.1

- ❌ All violations block builds (5,233+ violations)
- ❌ Cannot merge any PRs
- ❌ Development blocked

### After Phase 4.1

- ✅ Legacy violations tolerated (warnings only)
- ✅ Only changed files enforced
- ✅ Development unblocked
- ✅ Incremental cleanup enabled

---

## 🔗 Related Documents

- [Design System Enforcement](./DESIGN_SYSTEM_ENFORCEMENT.md)
- [Quick Start Guide](./DESIGN_SYSTEM_ENFORCEMENT_QUICK_START.md)
- [Verification Guide](./DESIGN_SYSTEM_ENFORCEMENT_VERIFICATION.md)
- [Phase 4 Audit](./PHASE_4_UI_TO_DESIGN_SYSTEM_AUDIT.md)

---

## 📝 Next Steps

1. **Monitor CI** — Ensure enforcement job runs correctly
2. **Track Violations** — Use global mode to track cleanup progress
3. **Incremental Cleanup** — Fix violations as files are touched
4. **Review Quarterly** — Assess progress and adjust strategy

---

**Setup Complete:** ✅ All enforcement infrastructure in place  
**Status:** Ready for incremental enforcement  
**Maintained By:** Design System Governance Engineer

