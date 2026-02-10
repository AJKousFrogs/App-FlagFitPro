# Codebase Audit Summary

Generated from one-shot inventory commands. Use this with the lean codebase rules in section 4 of the audit instructions.

---

## 1) File Inventories

| Type | Count | File |
|------|-------|------|
| SCSS | 286 | `audit/files_scss.txt` |
| TS   | 588 | `audit/files_ts.txt` |
| JS   | 278 | `audit/files_js.txt` |
| MD   | 62 (git) / 69 (rglob) | `audit/files_md.txt` / `audit/md_by_size.txt` |

---

## 2) Entrypoints

- **Angular styles:** Single source → `angular.json` line 38: `"styles": ["src/styles.scss"]`
- **SCSS import tree:** `audit/scss_imports_raw.txt`, `audit/scss_references.txt`

`styles.scss` loads (in order):
- `styles/design-system/index`
- `scss/utilities`
- `assets/fonts/poppins`
- `scss/components/index`
- `scss/pages/index`
- `assets/styles/overrides` (TIER 4)

---

## 3) Duplicates / Legacy Patterns

| Pattern | Count | File | Notes |
|---------|-------|------|-------|
| Spacing utilities (.p-\*, .m-\*, .gap-\*) | 26 | `dupe_spacing_utils.txt` | Mostly in `design-system-tokens.scss` (canonical); some comments in layout/spacing systems |
| Layout utilities (.flex, .flex-row, etc.) | 54 | `dupe_layout_utils.txt` | **Duplicates:** `primitives/_layout.scss`, `layout-system.scss`, `_utilities.scss`, `standardized-components.scss` — consider merge |
| PrimeNG selectors | 10,572 | `primeng_selectors.txt` | Many are token mappings (expected); review ad-hoc overrides |
| `!important` | 14 | `important.txt` | Mostly comments; 2 actual in `view-transitions.config.ts`; others moved to _exceptions |
| `::ng-deep` | 1 | `ng_deep.txt` | Only in README.design-system.md (rule doc) — none in code ✓ |
| Hex colors | 325 | `hex_colors.txt` | SVGs, color-guards, design-system-tokens (source-of-truth vars acceptable); audit component SCSS |
| Hardcoded `px` | 542 | `hardcoded_px.txt` | Animations, tokens (rem comments), some component styles — tokenize where possible |
| Hardcoded props (transition/shadow/radius/z-index) | 3,263 | `hardcoded_props.txt` | Many use `var(--*)` already; flag non-token usages |

---

## 4) Dead / Unused Candidates

### SCSS (`audit/scss_unused_candidates.txt`)

- **Heuristic:** 7 "used", 279 "unused" by @use/@forward/@import
- **Caveat:** Component `.scss` files are referenced via Angular `styleUrls`, not SCSS imports. The script only checks SCSS import graph, so most component styles appear "unused." **Only trust this for standalone SCSS** (e.g., partials that should be `@forward`ed but aren’t).

### TS (`audit/ts_unused_candidates.txt`)

- **Heuristic:** 370 "unused" — never appear in relative `from "..."` imports
- **Caveat:** Routes, providers, guards, templates, dynamic imports, and spec targets are not detected. **Treat as a candidate list only.** Confirm before deleting.

---

## 5) Markdown Audit

### By size (`audit/md_by_size.txt`)

- Largest: `docs/FEATURE_DOCUMENTATION.md` (210 KB), `docs/DESIGN_SYSTEM_RULES.md` (150 KB)
- 69 MD files total; duplicates: `privacy-policy.md`, `terms-of-use.md` in `src/assets/legal` and `dist/`

### Missing path references (`audit/md_missing_paths.txt`)

35 references to paths that don’t exist, e.g.:

- `angular/src/app/` (generic)
- `angular/src/app/today/` (deleted)
- `angular/core` (Angular package, not repo path)
- `angular/cli`, `angular/common`, etc. (Angular packages)
- `angular/.env` (gitignored)
- `angular/dist/...` (build output)

**Action:** Update docs to use correct paths or remove obsolete references.

### Source-of-truth claims (`audit/md_source_of_truth_claims.txt`)

- `docs/TECH_STACK.md`: "Single Source of Truth" for tech stack
- `angular/src/scss/README.md`: Tokens `design-system-tokens.scss` = single source
- `AUDIT_FE.md`: Canonical utilities in `design-system-tokens.scss`, layout in `layout-system.scss`
- Align docs so one canonical file per concern.

---

## 6) Lean Codebase Rules — Quick Reference

| Action | When |
|--------|------|
| **Delete** | Not referenced by any entrypoint/import; not route/template/provider; not asset |
| **Delete** | Duplicates canonical utilities (spacing, layout) when canonical file exists |
| **Delete** | Old docs that contradict canonical contract |
| **Merge** | Two SCSS files with overlapping utilities/variables, both referenced |
| **Merge** | Multiple docs on same topic → keep one canonical, link to it |
| **Rewrite** | Component SCSS with PrimeNG internals (.p-\*, !important) → move to overrides or token mapping |
| **Rewrite** | Widespread hardcoded colors/radius/shadows → replace with tokens |

---

## 7) Recommended Next Steps

1. ~~**Layout utilities:** Consolidate `.flex`, `.flex-row`, `.items-*`, `.justify-*`~~ ✓ Done — duplicates removed from `primitives/_layout.scss`; `_utilities.scss` has deprecation note.
2. **Docs:** Fix `md_missing_paths.txt` entries; standardize "single source of truth" in `TECH_STACK.md` and `README.design-system.md`.
3. **PrimeNG:** Review `primeng_selectors.txt` for ad-hoc overrides; move to `_token-mapping.scss` or `_exceptions.scss`.
4. **Hex colors:** Replace hex in component SCSS with design tokens; keep hex only in `design-system-tokens.scss` and color-guards.
5. **TS candidates:** Manually verify any deletions against routes, providers, and lazy-loaded modules.
