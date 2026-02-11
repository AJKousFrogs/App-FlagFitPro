# Duplication Audit — Proposed Fixes

**Date:** February 11, 2026  
**Scope:** SCSS, TypeScript, JavaScript (scripts + Netlify functions)  
**Reference:** `npm run audit:scss-duplications`, `audit:ts-duplications`, `audit:js-duplications`

---

## Summary

| Audit | Files | Priority Fixes |
|-------|-------|----------------|
| SCSS | 275 | Stat-block mixin adoption, stats-grid consolidation |
| TS | 560 | Unused imports, shared evidence utility |
| JS | 219 | Shared directory utils, seed script base class |

---

## 1. SCSS Fixes

### 1.1 Adopt `@include stat-block` in Components (High Impact)

**Problem:** 29 uses of `.stat-block__label` / `.stat-block__value` across 26 files; many components define these locally instead of using the existing mixin.

**Existing:** `_mixins.scss` defines `@mixin stat-block` (lines 164–202); `_responsive-utilities.scss` defines `@mixin stats-grid` (lines 165–181).

**Fix:** Components using stat-block markup should `@include stat-block` and remove duplicate definitions. Keep only component-specific overrides (e.g. `.stat-card.highlight` color overrides).

**Target files:** acwr-dashboard, superadmin-dashboard, sleep-debt, nutritionist-dashboard, physiotherapist-dashboard, achievements (already includes stat-block but redefines values in `.stat-card`—narrow overrides), player-development, film-room-coach, injury-management, payment-management, playbook-manager, and others flagged by audit.

**Example (before):**
```scss
.stats-grid { display: grid; grid-template-columns: ...; }
.stat-block__label { font-size: ...; }
.stat-block__value { font-size: ...; }
```

**Example (after):**
```scss
@include stat-block;
@include stats-grid;

.stats-grid {
  // Only layout overrides if needed
}
.stat-card.highlight .stat-block__value { color: var(--color-text-on-primary); }
```

---

### 1.2 Replace Local `.stats-grid` with `@include stats-grid` (Medium Impact)

**Problem:** achievements, superadmin-dashboard, sleep-debt, nutritionist-dashboard, physiotherapist-dashboard define near-identical `.stats-grid` rules.

**Fix:** `@use "styles/utilities/responsive-utilities" as *` and `@include stats-grid` where applicable. Override only when the layout genuinely differs (e.g. 6-col vs 4-col).

**Files:** `achievements.component.scss`, `superadmin-dashboard.component.scss`, `sleep-debt.component.scss`, `nutritionist-dashboard.component.scss`, `physiotherapist-dashboard.component.scss`.

---

### 1.3 Shared `.data-source` / `.data-updated` Utility (Low Impact)

**Problem:** acwr-dashboard, analytics, performance-tracking define similar `.data-source, .data-updated` rules.

**Fix:** Add a small utility class or mixin in `_responsive-utilities.scss` or `standardized-components.scss`, e.g. `@mixin data-source-meta` or `.data-source-meta`. Components `@include` or apply the class.

---

### 1.4 Metric Value / Label Mixin (Low Impact)

**Problem:** `.metric-value` (24 uses) and `.metric-label` (20 uses) repeated across components.

**Fix:** If patterns align, add `@mixin metric-display` to `_mixins.scss` with value + label styles. Components that need variants can override.

---

## 2. TypeScript Fixes

### 2.1 Remove Verified Unused Imports (Low Effort)

**Problem:** Audit flags single-occurrence imports; many are `type` imports (false positives) but some may be unused.

**Action:** Manually verify and remove:
- `today.component.ts`: `type Observable` — if `Observable` is used only as a type, switch to `import type { Observable }`.
- `button.stories.ts`: `RouterModule` — confirm it’s needed for Storybook; remove if not.
- Other non-type imports with a single match.

**Note:** Leave `type X` imports used in annotations alone; they’re valid and not runtime imports.

---

### 2.2 Evidence Info — No Consolidation (Informational)

**Problem:** `getEvidenceInfo()` in `acwr.service.ts` and `readiness.service.ts` look similar.

**Finding:** Return shapes differ:
- ACWR: `scienceNotes: string`, `coachOverride: string`
- Readiness: `scienceNotes: { weightings, cutPoints, coachOverride }`

They read from different preset sections (`preset.acwr` vs `preset.readiness`). Extracting a shared helper would add indirection without clear benefit. **Recommendation:** Leave as-is.

---

### 2.3 Supabase Update Pattern in Services (Optional)

**Problem:** account-deletion.service, privacy-settings.service share similar Supabase `.update()` / error-handling patterns.

**Fix (optional):** Add a shared helper, e.g. `core/services/supabase-mutation-helper.ts`, with `updateWithErrorHandling<T>(table, id, data)` if the pattern repeats 5+ times. Low priority.

---

## 3. JavaScript Fixes (scripts + Netlify functions)

### 3.1 Extract Shared Directory Walker Utility (High Impact)

**Problem:** `cleanupDirectory` in cleanup-frontend.js and cleanup-scss-comments.js, and `processDirectory` in fix-trailing-newlines.js are nearly identical. Only the file filter (`.ts`, `.scss`, or `.ts/.scss/.html`) and per-file callback differ.

**Fix:** Add `scripts/lib/directory-walker.js`:

```js
/**
 * Recursively walk directory, call fileProcessor for each matching file.
 * @param {string} dir - Root directory
 * @param {(path: string) => void} fileProcessor - Called for each file
 * @param {object} opts - { extensions: string[], skipDirs: string[] }
 */
export function walkDirectory(dir, fileProcessor, opts = {}) {
  const { extensions = [".ts"], skipDirs = ["node_modules", "dist", ".git"] } = opts;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (skipDirs.includes(e.name)) continue;
      walkDirectory(full, fileProcessor, opts);
    } else if (e.isFile() && extensions.some(ext => e.name.endsWith(ext))) {
      fileProcessor(full);
    }
  }
}
```

**Update:** cleanup-frontend.js, cleanup-scss-comments.js, fix-trailing-newlines.js to import and use `walkDirectory`.

---

### 3.2 Extract `getDirectorySize` to Shared Util (Medium Impact)

**Problem:** `comprehensive-health-check.js` and `feature-validator.js` both define identical `async getDirectorySize(dirPath)`.

**Fix:** Add `scripts/lib/file-utils.js` (or extend `scripts/lib/common.sh`—but that’s shell; keep Node util separate):

```js
export async function getDirectorySize(dirPath) {
  let totalSize = 0;
  try {
    const files = await fs.readdir(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
        totalSize += await getDirectorySize(filePath);
      } else {
        totalSize += stats.size;
      }
    }
  } catch { /* ignore */ }
  return totalSize;
}
```

**Update:** Both scripts import from `./lib/file-utils.js`.

---

### 3.3 Seed Script Constructor Pattern (Optional)

**Problem:** 6 seed scripts (comprehensiveDatabaseAudit, seedHydrationResearchDatabase, seedNutritionSystem, seedRecoverySystem, seedSupplementResearchDatabaseCorrected, seedWADAProhibitedList) share similar constructor patterns.

**Fix (optional):** Extract a `BaseSeedScript` class in `scripts/lib/base-seed.js` with shared setup (Supabase client, logger, common opts). Adopt incrementally when touching these scripts. Low priority.

---

### 3.4 Netlify Functions — Handler Boilerplate (Informational)

**Finding:** 102 functions import `./utils/base-handler.js` and 102 import `./utils/error-handler.js`. This is intentional—handlers are already centralized. No change needed.

---

### 3.5 String Literals in Test Scripts (Low Priority)

**Problem:** `"); console.log("` appears 257x; `", expectedStatus: [200, 401], }, { name:"` appears 44x in test-all-api-endpoints.js.

**Fix:** Consider a small test harness or shared `expectJson` helper to reduce repetitive `console.log` and assertion boilerplate. Optional.

---

## 4. Implementation Order

| # | Fix | Effort | Impact | Depends On |
|---|-----|--------|--------|-------------|
| 1 | scripts/lib/directory-walker.js + adopt in 3 scripts | Medium | High | None |
| 2 | scripts/lib/file-utils.js getDirectorySize | Low | Medium | None |
| 3 | SCSS: Adopt @include stat-block in 5–10 components | Medium | High | None |
| 4 | SCSS: Adopt @include stats-grid in 5 components | Low | Medium | #3 |
| 5 | TS: Remove verified unused imports | Low | Low | None |
| 6 | SCSS: data-source-meta utility | Low | Low | None |
| 7 | SCSS: metric-display mixin (if patterns align) | Low | Low | None |
| 8 | BaseSeedScript (optional) | Medium | Low | None |

---

## 5. Files to Create/Modify

### New Files
- `scripts/lib/directory-walker.js`
- `scripts/lib/file-utils.js`

### Modify
- `scripts/cleanup-frontend.js`
- `scripts/cleanup-scss-comments.js`
- `scripts/fix-trailing-newlines.js`
- `scripts/comprehensive-health-check.js`
- `scripts/feature-validator.js`
- `angular/src/app/features/achievements/achievements.component.scss`
- `angular/src/app/features/sleep-debt/sleep-debt.component.scss`
- `angular/src/app/features/admin/superadmin-dashboard.component.scss`
- `angular/src/app/features/staff/nutritionist/nutritionist-dashboard.component.scss`
- `angular/src/app/features/staff/physiotherapist/physiotherapist-dashboard.component.scss`
- (Additional stat-block components as identified)

---

## 6. Validation

After fixes:
```bash
npm run audit:scss-duplications
npm run audit:ts-duplications
npm run audit:js-duplications
```

Expect reduced counts in “Duplicate selectors”, “Similar function blocks”, and “Potentially duplicate rule blocks”.

---

---

## 7. Fixes Applied (Feb 11)

| Fix | Status |
|-----|--------|
| scripts/lib/directory-walker.js | Done |
| scripts/lib/file-utils.js | Done |
| cleanup-frontend, cleanup-scss-comments, fix-trailing-newlines | Done — use walkDirectory |
| comprehensive-health-check, feature-validator | Done — use getDirectorySize from file-utils |
| SCSS: @include stats-grid in admin, nutritionist, physio | Done |
| SCSS: data-source-meta mixin in acwr, analytics, performance-tracking | Done |
| SCSS: metric-display mixin in acwr-dashboard | Done |
| TS: Remove unused RouterModule from button.stories | Done |

---

*Proposal generated from Duplication Audits — February 11, 2026*
