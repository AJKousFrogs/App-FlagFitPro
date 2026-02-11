# UI Polish Audit — PrimeNG Components (Part 2)

**Audit Date:** February 11, 2026  
**Scope:** PrimeNG components NOT covered in Part 1 (Table, ProgressBar, Tabs, ToggleSwitch, Select, Dialog, Tag, Skeleton, Accordion, Avatar, RadioButton, Chip, Divider, Password, MultiSelect, Tooltip)  
**Previous audit:** Part 1 covered Sliders, Checkboxes, Calendar, Toast

---

## Executive Summary

Part 2 audits the remaining high-usage PrimeNG components. Most are already token-driven and consistent. A few styling issues and deprecated token uses are documented below.

| Component | Status | Notes |
|-----------|--------|-------|
| Table (p-datatable) | Good | Token-based, responsive |
| ProgressBar | Good | Token-based, gradient |
| Tabs | Good | Profile tabs use custom overrides |
| ToggleSwitch | Good | Token-mapped |
| Select / MultiSelect | Good | Token-mapped |
| Dialog | Good | Token-based, many variants |
| Tag | Good | Token-mapped |
| Skeleton | Good | Minimal tokens |
| Accordion | Good | Token-mapped |
| Avatar | Good | Token-mapped |
| RadioButton | Good | Token-mapped |
| Chip | Good | Token-mapped |
| Divider | Partial | Limited token coverage |
| Password | Good | Inherits input tokens |
| Tooltip | Good | Token-mapped |

---

## 1. Table (p-datatable / p-table)

**Token mapping:**  
`_token-mapping.scss`, `primeng-integration.scss`, `primeng-theme.scss`, `ui-standardization.scss`

- **Header:** `--p-datatable-header-background`, `--p-datatable-header-font-size`, padding `var(--space-4)` / `var(--p-datatable-header-cell-padding)`
- **Body:** `--p-datatable-body-font-size`, `--font-body-size`, `var(--space-4)` padding
- **Row hover:** `--p-datatable-row-hover-background`, `--ds-primary-green-ultra-subtle`
- **Responsive:** `.p-datatable-responsive-stack` for card layout on mobile

**Findings:**
- ✅ Token-based spacing and typography
- ✅ Row hover uses design system colors
- ⚠️ `.enhanced-table-container` uses component overrides for scroll/touch; documented (DS-EXC-002)
- ⚠️ Some table cells use `--font-size-h4` (deprecated) in overrides — migrate to `--font-h4-size` or `--ds-font-size-md`

---

## 2. ProgressBar (p-progressBar)

**Token mapping:** `--p-progressbar-height`, `--p-progressbar-background`, `--p-progressbar-value-background`, `--p-progressbar-border-radius`

**Findings:**
- ✅ Global: `var(--space-2)` height, `var(--radius-full)`
- ✅ Value: green gradient, shine animation in `primeng-theme.scss`
- ⚠️ Multiple component overrides (ACWR, completion-bar, type-bar, session-analytics, supplement-tracker, training-schedule) use `height: calc(var(--space-1) + var(--space-0-5))` — consider `--progress-sm` or `--progress-xs` for consistency
- ⚠️ `.physio-dashboard .soreness-bar` uses `--p-progressbar-height, var(--space-2)` — OK

---

## 3. Tabs (p-tabs)

**Token mapping:**  
`--p-tabs-nav-padding`, `--p-tabs-nav-gap`, `--p-tabs-tab-padding`, `--p-tabs-tab-active-border-color`, `--p-tabs-content-padding`

**Findings:**
- ✅ Design system tab styling
- ✅ Profile tabs (`.profile-page .profile-tabs-container`): custom tablist with `--space-*` tokens
- ⚠️ Tab icon uses `line-height: 1` — acceptable for icon alignment
- ⚠️ Command palette tabs use `padding: 0 var(--space-5)` — documented
- No issues found

---

## 4. ToggleSwitch (p-toggleswitch)

**Token mapping:**  
`--p-toggleswitch-width`, `--p-toggleswitch-height`, `--p-toggleswitch-checked-background`, `--p-toggleswitch-handle-size`, etc.

**Findings:**
- ✅ Uses `--button-height-md`, `--space-6`, green checked state
- ✅ Focus ring: `var(--focus-ring-width)` with `var(--color-focus-ring)`
- ✅ `_exceptions.scss`: mobile min-height for touch
- No issues found

---

## 5. Select / MultiSelect (p-select, p-multiselect)

**Token mapping:**  
`--p-select-*`, `--p-multiselect-*` (background, border-color, focus-ring, etc.)

**Findings:**
- ✅ Form control tokens shared with inputs
- ✅ Dark mode overrides in `primeng-integration.scss`
- ✅ Overlay panel uses design tokens
- No issues found

---

## 6. Dialog (p-dialog)

**Token mapping:**  
`--p-dialog-*`, `--dialog-max-width-*`, `--dialog-width-*`

**Findings:**
- ✅ Header, content, footer padding use tokens
- ✅ Many dialogs use `max-width: 95vw` — consistent
- ⚠️ `.password-dialog`, `.delete-dialog`, `.twofa-dialog`, `.sessions-dialog` use `max-width: 95vw` — could use `var(--dialog-width-xl)` or similar
- ⚠️ `.body-comp-dialog`, `.quick-checkin-modal` use `max-height: var(--overlay-max-height-dialog)` (fixed in Part 1)
- No critical issues

---

## 7. Tag (p-tag)

**Token mapping:**  
`--p-tag-padding-x`, `--p-tag-padding-y`, `--p-tag-border-radius`, `--p-tag-font-size`, severity colors

**Findings:**
- ✅ Token-based padding, radius, typography
- ✅ Severity variants (success, info, warn, danger, secondary)
- ⚠️ `.olympics-badge.p-tag` has custom styling — documented exception
- No critical issues

---

## 8. Skeleton (p-skeleton)

**Token mapping:**  
`--p-skeleton-background`, `--p-skeleton-border-radius`

**Findings:**
- ✅ Minimal token set
- ⚠️ Supplement tracker uses `width="80%"` and `size="var(--space-6)"` in template — acceptable
- ⚠️ Today page uses `height="calc(var(--size-80) * 0.8)"` — ensure `--size-80` is defined or use `var(--space-*)`
- No critical issues

---

## 9. Accordion (p-accordion)

**Token mapping:**  
`--p-accordion-header-padding`, `--p-accordion-content-padding`, `--p-accordion-border-color`

**Findings:**
- ✅ Token-based
- ✅ `ui-standardization.scss`: accordion header/content styles
- No issues found

---

## 10. Avatar (p-avatar)

**Token mapping:**  
`--p-avatar-sm-width`, `--p-avatar-md-width`, `--p-avatar-lg-width`, `--p-avatar-border-radius`, `--p-avatar-background`

**Findings:**
- ✅ Sizes use `--avatar-size-*`
- ✅ Hover scale in `primeng-theme.scss`
- ✅ Avatar group border: `var(--border-2)`
- ⚠️ `.user-avatar.p-avatar` in component overrides — documented
- No critical issues

---

## 11. RadioButton (p-radioButton)

**Token mapping:**  
`--p-radio-width`, `--p-radio-height`, `--p-radio-checked-background`, `--p-radio-focus-ring`

**Findings:**
- ✅ Matches checkbox sizing (1.25rem)
- ✅ Green checked state
- ✅ `_exceptions.scss`: mobile touch target
- No issues found

---

## 12. Chip (p-chip)

**Token mapping:**  
`--p-chip-background`, `--p-chip-border-radius`, `--p-chip-padding-x`, `--p-chip-padding-y`, `--p-chip-primary-background`

**Findings:**
- ✅ Token-based
- ✅ Remove icon hover in `primeng-theme.scss`
- ⚠️ `.p-chip` in training-schedule export dialog — uses tokens
- No critical issues

---

## 13. Divider (p-divider)

**Token mapping:**  
Limited — no dedicated `--p-divider-*` in token-mapping. Styling via `::before` in component overrides.

**Findings:**
- ⚠️ `.security-actions .p-divider` uses `margin: var(--space-2) 0` and `border-color: var(--color-border-muted)` — OK
- Recommendation: Add `--p-divider-margin`, `--p-divider-border-color` to `_token-mapping.scss` for consistency
- Low priority

---

## 14. Password (p-password)

**Token mapping:**  
`--p-password-panel-*` (inherits from input)

**Findings:**
- ✅ Panel background, border-radius, shadow, padding use tokens
- ✅ Input inherits form control tokens
- No issues found

---

## 15. Tooltip (pTooltip)

**Token mapping:**  
`--p-tooltip-background`, `--p-tooltip-color`, `--p-tooltip-border-radius`, `--p-tooltip-padding`, `--p-tooltip-max-width`

**Findings:**
- ✅ Inverse surface for contrast
- ✅ Green border in screenshot — consistent with brand
- No issues found

---

## 16. Deprecated Font Token Audit

**Finding:** Multiple overrides use `--font-size-h4`:

| File | Line (approx) | Context |
|------|---------------|---------|
| `_component-overrides.scss` | 73, 240, 566, 1070 | Various headings |
| `_component-overrides.scss` | 1640, 1739, 1767 | Session/export dialogs |
| `_component-overrides.scss` | 2727, 2745, 2773, 2873 | Settings dialogs |

**Recommendation:**  
Design system deprecates `--font-size-h4` in favor of `--font-h4-size` or `--ds-font-size-md`. Migrate when touching these files. No functional impact.

---

## 17. ProgressBar Height Consistency

**Finding:** Several ProgressBars use `height: calc(var(--space-1) + var(--space-0-5))` (≈4.5px) instead of `var(--p-progressbar-height)` (8px) or `--progress-xs` (2px).

**Locations:**  
`.completion-bar`, `.type-bar`, session-analytics, supplement-tracker, training-schedule progress bars.

**Recommendation:**  
Introduce semantic tokens, e.g.:

- `--progress-bar-height-sm: calc(var(--space-1) + var(--space-0-5))` (compact)
- `--progress-bar-height-md: var(--space-2)` (default)
- Use these consistently for compact vs standard bars.

---

## 18. Summary

| Area | Action | Status |
|------|--------|--------|
| Deprecated font tokens | Migrate `--font-size-h4` → `--font-h4-size` | ✅ Done |
| ProgressBar heights | Add `--progress-bar-height-*` and standardize | ✅ Done |
| Divider | Add `--p-divider-*` tokens | ✅ Done |
| Dialog max-width | 95vw usage is OK; could centralize if desired | OK |

All Part 2 audit fixes have been applied.

---

*Generated by UI Polish Audit Part 2 — February 11, 2026*
