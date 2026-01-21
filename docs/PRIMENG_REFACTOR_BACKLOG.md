# PrimeNG Frontend Refactor Backlog

**Version:** 1.0  
**Date:** 2025-01-XX  
**Status:** 🚧 In Progress

## Executive Summary

This document outlines a comprehensive refactoring plan to align the entire Angular 21 + PrimeNG 21 frontend with PrimeNG best practices and idioms. The refactor will standardize components, improve accessibility, optimize performance, and establish a maintainable design system.

**Tech Stack:**
- Angular 21.0.0 (Zoneless, Signals, Standalone Components)
- PrimeNG 21.0.2
- PrimeIcons 7.0.0
- SCSS with CSS Custom Properties (Design Tokens)
- Theme: Aura preset with custom tokens

---

## Step 1: Inventory & Diagnosis

### 1.1 PrimeNG Components Currently Used

**✅ Well-Used Components:**
- `Card` - Extensively used across features
- `Dialog` - Used via `app-modal` wrapper
- `Toast` - Used via `app-toast` wrapper
- `Table` / `TableModule` - Used in many data tables
- `Select` - Used for dropdowns
- `InputText` - Used via `app-search-input` wrapper
- `InputNumber` - Used directly
- `Textarea` - Used directly
- `DatePicker` - Used directly
- `Checkbox` - Used directly
- `RadioButton` - Used directly
- `ProgressBar` - Used directly
- `Tabs` / `TabList` / `Tab` / `TabPanels` / `TabPanel` - Used directly
- `Slider` - Used directly
- `Chip` - Used directly
- `Badge` - Used directly
- `Skeleton` - Used directly
- `Accordion` / `AccordionPanel` - Used directly
- `MultiSelect` - Used directly
- `Ripple` - Used via `app-button` wrapper
- `Tooltip` - Used via `app-button` wrapper

**⚠️ Underutilized Components:**
- `Button` - Not used directly (custom `app-button` wrapper exists)
- `InputText` - Often wrapped in custom components
- `Message` - Available but not consistently used
- `ConfirmDialog` - Available but custom confirmation patterns exist
- `OverlayPanel` - Available but custom popovers exist
- `FileUpload` - Available but custom `app-file-upload` exists
- `Calendar` - Available but custom date pickers exist
- `Dropdown` - Available but `Select` is preferred
- `DataView` - Available but custom grids exist
- `VirtualScroller` - Available but not used for large lists

### 1.2 Custom Components That Duplicate PrimeNG Functionality

**🔴 High Priority - Replace with PrimeNG:**

1. **`app-input`** (`shared/components/input/`)
   - **Issue:** Duplicates `InputText` functionality
   - **Files:** `input.component.ts`, `input.component.scss`
   - **Usage:** 1641 matches across 186 files
   - **Action:** Migrate to `InputText` with proper labels and validation
   - **Risk:** Medium (widespread usage)
   - **Effort:** High (requires form-by-form migration)

2. **`app-form-input`** (`shared/components/form-input/`)
   - **Issue:** Another custom input wrapper with validation
   - **Files:** `form-input.component.ts`, `form-input.component.scss`
   - **Usage:** Found in forms
   - **Action:** Replace with `InputText` + PrimeNG validation patterns
   - **Risk:** Medium
   - **Effort:** Medium

3. **`app-select`** (`shared/components/select/`)
   - **Issue:** Custom select wrapper
   - **Files:** `select.component.ts`
   - **Usage:** Limited
   - **Action:** Replace with PrimeNG `Select` directly
   - **Risk:** Low
   - **Effort:** Low

4. **`app-checkbox`** (`shared/components/checkbox/`)
   - **Issue:** Custom checkbox wrapper
   - **Files:** `checkbox.component.ts`, `checkbox.component.scss`
   - **Usage:** Found in forms
   - **Action:** Replace with PrimeNG `Checkbox` directly
   - **Risk:** Low
   - **Effort:** Low

5. **`app-radio`** (`shared/components/radio/`)
   - **Issue:** Custom radio wrapper
   - **Files:** `radio.component.ts`
   - **Usage:** Limited
   - **Action:** Replace with PrimeNG `RadioButton` directly
   - **Risk:** Low
   - **Effort:** Low

**🟡 Medium Priority - Evaluate Wrapper Value:**

6. **`app-button`** (`shared/components/button/`)
   - **Status:** Wrapper around PrimeNG `Ripple` and `Tooltip`
   - **Analysis:** Provides consistent API, loading states, router integration
   - **Decision:** **KEEP** - Adds value (consistent API, loading states, router support)
   - **Action:** Ensure it uses PrimeNG `Button` internally for consistency
   - **Note:** Currently uses native `<button>` with PrimeNG directives

7. **`app-modal`** (`shared/components/modal/`)
   - **Status:** Wrapper around PrimeNG `Dialog`
   - **Analysis:** Adds consistent styling, animations, footer patterns
   - **Decision:** **KEEP** - Adds value (consistent UX patterns)
   - **Action:** Ensure it properly exposes all PrimeNG Dialog features

8. **`app-toast`** (`shared/components/toast/`)
   - **Status:** Wrapper around PrimeNG `Toast`
   - **Analysis:** Adds custom animations and styling
   - **Decision:** **KEEP** - Adds value (consistent UX)
   - **Action:** Ensure it uses `MessageService` correctly

9. **`app-search-input`** (`shared/components/search-input/`)
   - **Status:** Wrapper around `InputText` with search icon
   - **Analysis:** Provides consistent search UX
   - **Decision:** **KEEP** - Adds value (consistent search pattern)
   - **Action:** Ensure it uses PrimeNG `InputText` correctly

**🟢 Low Priority - Keep (Domain-Specific):**

10. **`app-file-upload`** - Domain-specific file handling
11. **`app-date-picker`** - Domain-specific date logic
12. **`app-date-range`** - Domain-specific range logic
13. **`app-textarea`** - Domain-specific textarea logic
14. **`app-table`** - Domain-specific table logic (evaluate vs `DataTable`)

### 1.3 Global Styling Problems

**Issues Identified:**

1. **Inconsistent Spacing Scale**
   - **Problem:** Mix of arbitrary margins/paddings (4px, 8px, 12px, 16px, 20px, 24px, 32px)
   - **Solution:** Standardize on 4px base unit (4, 8, 12, 16, 24, 32, 48, 64)
   - **Files:** All SCSS files
   - **Effort:** High

2. **Inconsistent Form Field Sizing**
   - **Problem:** Different input heights across forms
   - **Solution:** Use PrimeNG size props (`size="small" | "large"`) consistently
   - **Files:** All form components
   - **Effort:** Medium

3. **Random CSS Overrides**
   - **Problem:** Deep selectors like `.p-dialog .p-dialog-content` scattered across files
   - **Solution:** Use Pass Through API or design tokens
   - **Files:** Multiple component SCSS files
   - **Effort:** Medium

4. **Inconsistent Alignment**
   - **Problem:** Mix of flexbox, grid, and float patterns
   - **Solution:** Standardize on flexbox utilities or PrimeNG layout components
   - **Files:** All layout components
   - **Effort:** Medium

5. **Color Token Inconsistency**
   - **Problem:** Mix of design tokens and hardcoded colors
   - **Solution:** Enforce design token usage via lint rules
   - **Files:** All SCSS files
   - **Effort:** Low (linting)

### 1.4 Accessibility Issues

**Critical Issues:**

1. **Missing Labels on Form Inputs**
   - **Problem:** Some inputs lack `<label>` or `aria-label`
   - **Files:** Forms across features
   - **Impact:** WCAG 2.1 AA violation
   - **Effort:** Medium

2. **Icon-Only Buttons Without aria-label**
   - **Problem:** Some icon buttons lack accessible names
   - **Files:** Various components
   - **Impact:** Screen reader users can't understand purpose
   - **Effort:** Low

3. **Missing Focus Management**
   - **Problem:** Dialogs don't trap focus, modals don't return focus
   - **Files:** `app-modal`, dialog usage
   - **Impact:** Keyboard navigation broken
   - **Effort:** Medium (PrimeNG handles this, but need to verify)

4. **Incorrect Heading Hierarchy**
   - **Problem:** Skipped heading levels (h1 → h3)
   - **Files:** Page components
   - **Impact:** Screen reader navigation confusion
   - **Effort:** Low

5. **Missing ARIA Live Regions**
   - **Problem:** Dynamic content updates not announced
   - **Files:** Data tables, dashboards
   - **Impact:** Screen reader users miss updates
   - **Effort:** Low

**Good Practices Found:**
- `app-button` has `ariaLabel` input and computed `computedAriaLabel`
- `app-input` has `aria-describedby` support
- Accessibility audit tests exist (`accessibility.spec.ts`)

### 1.5 Performance Hotspots

**Issues Identified:**

1. **Large Tables Without Virtual Scrolling**
   - **Problem:** Tables with 100+ rows render all DOM nodes
   - **Files:** `roster.component.ts`, `analytics.component.ts`, `equipment.component.ts`
   - **Solution:** Use PrimeNG `DataTable` with `virtualScrollerOptions`
   - **Effort:** Medium

2. **Repeated Change Detection Triggers**
   - **Problem:** Some components trigger change detection on every keystroke
   - **Files:** Forms with `(ngModelChange)` handlers
   - **Solution:** Use `OnPush` change detection + signals (already done in many places)
   - **Effort:** Low (mostly done)

3. **Over-Rendering in Lists**
   - **Problem:** `@for` loops without `trackBy` functions
   - **Files:** Various list components
   - **Solution:** Add `trackBy` functions
   - **Effort:** Low

4. **Heavy Dialogs**
   - **Problem:** Large dialogs with complex content render immediately
   - **Files:** `exercisedb-manager.component.ts`, `analytics.component.ts`
   - **Solution:** Lazy load dialog content
   - **Effort:** Medium

5. **Chart Rendering**
   - **Problem:** Charts render even when not visible
   - **Files:** Dashboard components
   - **Solution:** Use `LazyChartComponent` (already exists!)
   - **Effort:** Low (adopt existing pattern)

---

## Step 2: Refactor Backlog (Prioritized)

### 🔴 Priority 1: Critical - Replace Custom Input Components

#### Task 1.1: Migrate `app-input` to PrimeNG `InputText`
- **Files Affected:** 186 files (1641 matches)
- **Target Component:** `InputText` from `primeng/inputtext`
- **Risk Level:** High (widespread usage)
- **Estimated Effort:** 2-3 weeks
- **Approach:**
  1. Create migration guide document
  2. Update one feature module as proof of concept
  3. Create codemod script for automated migration
  4. Migrate module-by-module
  5. Remove `app-input` component

**Migration Pattern:**
```typescript
// BEFORE
<app-input
  [label]="'Email'"
  [(ngModel)]="email"
  [required]="true"
  [errorMessage]="emailError"
/>

// AFTER
<div class="field">
  <label for="email-input" class="block mb-2">Email <span class="text-red-500">*</span></label>
  <input
    pInputText
    id="email-input"
    [(ngModel)]="email"
    [class.ng-invalid]="emailError"
    [attr.aria-invalid]="!!emailError"
    [attr.aria-describedby]="emailError ? 'email-error' : null"
  />
  @if (emailError) {
    <small id="email-error" class="p-error" role="alert">{{ emailError }}</small>
  }
</div>
```

#### Task 1.2: Migrate `app-form-input` to PrimeNG `InputText`
- **Files Affected:** ~20 files
- **Target Component:** `InputText` + PrimeNG validation patterns
- **Risk Level:** Medium
- **Estimated Effort:** 1 week
- **Approach:** Similar to Task 1.1, but simpler (fewer usages)

#### Task 1.3: Migrate `app-select` to PrimeNG `Select`
- **Files Affected:** ~5 files
- **Target Component:** `Select` from `primeng/select`
- **Risk Level:** Low
- **Estimated Effort:** 2 days
- **Approach:** Direct replacement

#### Task 1.4: Migrate `app-checkbox` to PrimeNG `Checkbox`
- **Files Affected:** ~10 files
- **Target Component:** `Checkbox` from `primeng/checkbox`
- **Risk Level:** Low
- **Estimated Effort:** 2 days
- **Approach:** Direct replacement

#### Task 1.5: Migrate `app-radio` to PrimeNG `RadioButton`
- **Files Affected:** ~3 files
- **Target Component:** `RadioButton` from `primeng/radiobutton`
- **Risk Level:** Low
- **Estimated Effort:** 1 day
- **Approach:** Direct replacement

### 🟡 Priority 2: Standardize Forms & Accessibility

#### Task 2.1: Standardize Form Field Patterns
- **Files Affected:** All form components
- **Target Pattern:** PrimeNG form field structure
- **Risk Level:** Medium
- **Estimated Effort:** 1 week
- **Requirements:**
  - Every input has a `<label>` with `for` attribute
  - Validation messages use PrimeNG `Message` component or consistent pattern
  - Error states use `p-invalid` class
  - Help text uses `p-field-hint` pattern

**Standard Pattern:**
```html
<div class="field">
  <label for="field-id" class="block mb-2">
    Label Text
    @if (required) {
      <span class="text-red-500" aria-label="required">*</span>
    }
  </label>
  <input
    pInputText
    id="field-id"
    [(ngModel)]="value"
    [class.p-invalid]="hasError()"
    [attr.aria-invalid]="hasError()"
    [attr.aria-describedby]="getAriaDescribedBy()"
  />
  @if (hint && !hasError()) {
    <small [id]="fieldId + '-hint'" class="p-field-hint">{{ hint }}</small>
  }
  @if (hasError()) {
    <small [id]="fieldId + '-error'" class="p-error" role="alert">{{ errorMessage }}</small>
  }
</div>
```

#### Task 2.2: Fix Missing Labels
- **Files Affected:** All forms
- **Target:** WCAG 2.1 AA compliance
- **Risk Level:** Low
- **Estimated Effort:** 3 days
- **Approach:** Audit all forms, add missing labels

#### Task 2.3: Fix Icon-Only Buttons
- **Files Affected:** Various components
- **Target:** All icon buttons have `aria-label`
- **Risk Level:** Low
- **Estimated Effort:** 2 days
- **Approach:** Audit, add `ariaLabel` to `app-button` or use PrimeNG `Button` with `aria-label`

#### Task 2.4: Fix Heading Hierarchy
- **Files Affected:** Page components
- **Target:** Proper h1 → h2 → h3 hierarchy
- **Risk Level:** Low
- **Estimated Effort:** 1 day
- **Approach:** Audit, fix skipped levels

### 🟢 Priority 3: Performance Optimization

#### Task 3.1: Add Virtual Scrolling to Large Tables
- **Files Affected:** `roster.component.ts`, `analytics.component.ts`, `equipment.component.ts`
- **Target:** PrimeNG `DataTable` with `virtualScrollerOptions`
- **Risk Level:** Medium
- **Estimated Effort:** 1 week
- **Approach:**
  ```typescript
  <p-table
    [value]="data()"
    [virtualScrollerOptions]="{ itemSize: 50 }"
    [scrollable]="true"
    scrollHeight="400px"
  >
  ```

#### Task 3.2: Lazy Load Dialog Content
- **Files Affected:** Heavy dialogs
- **Target:** Load content only when dialog opens
- **Risk Level:** Low
- **Estimated Effort:** 3 days
- **Approach:** Use `@if (dialogVisible())` to conditionally render content

#### Task 3.3: Add `trackBy` to All Lists
- **Files Affected:** All `@for` loops
- **Target:** Track by unique ID
- **Risk Level:** Low
- **Estimated Effort:** 1 day
- **Approach:** Add `trackBy` functions

### 🔵 Priority 4: Styling Standardization

#### Task 4.1: Standardize Spacing Scale
- **Files Affected:** All SCSS files
- **Target:** 4px base unit (4, 8, 12, 16, 24, 32, 48, 64)
- **Risk Level:** Medium
- **Estimated Effort:** 1 week
- **Approach:** Use design tokens, create spacing utility classes

#### Task 4.2: Use Pass Through API for Component Styling
- **Files Affected:** Components with deep CSS overrides
- **Target:** Replace `::ng-deep` with Pass Through API
- **Risk Level:** Low
- **Estimated Effort:** 1 week
- **Approach:** Migrate overrides to `primeng.config.ts` or component-level PT

#### Task 4.3: Standardize Form Field Sizing
- **Files Affected:** All forms
- **Target:** Consistent input heights using PrimeNG size props
- **Risk Level:** Low
- **Estimated Effort:** 2 days
- **Approach:** Add `size` prop to all inputs

---

## Step 3: Design System Definition

### 3.1 Spacing Scale

**Standard:** 4px base unit
- `--space-1`: 4px
- `--space-2`: 8px
- `--space-3`: 12px
- `--space-4`: 16px
- `--space-5`: 20px (use sparingly)
- `--space-6`: 24px
- `--space-8`: 32px
- `--space-12`: 48px
- `--space-16`: 64px

**Usage Rules:**
- Use design tokens: `padding: var(--space-4)`
- Use PrimeNG component props when available (e.g., `[style]="{ padding: '1rem' }"`)
- Avoid arbitrary values

### 3.2 Form Field Sizing

**Standard Sizes:**
- `small`: Height 32px (mobile-friendly)
- `default`: Height 40px (desktop standard)
- `large`: Height 48px (prominent fields)

**Usage:**
```typescript
<input pInputText [size]="'small'" />
<p-select [size]="'small'" />
```

### 3.3 Button Variants

**Standard Variants (via `app-button`):**
- `primary`: Green background, white text
- `secondary`: Outlined, green border
- `outlined`: Transparent background, border
- `text`: Text-only, no border
- `danger`: Red background
- `success`: Green background (alias for primary)

**Sizes:**
- `sm`: 32px height
- `md`: 40px height (default)
- `lg`: 48px height

### 3.4 Overlay Behavior

**Dialog:**
- Modal: `[modal]="true"`
- Focus trap: Automatic (PrimeNG handles)
- Close on escape: `[closeOnEscape]="true"`
- Dismissable mask: `[dismissableMask]="false"` (prevent accidental closes)

**Toast:**
- Position: `top-right` (default)
- Duration: 3000ms (default)
- Stack: Multiple toasts stack vertically

**OverlayPanel:**
- Dismiss on outside click: `[dismissable]="true"`
- Show/hide transitions: Use PrimeNG defaults

### 3.5 Table Patterns

**Standard Pattern:**
```html
<p-table
  [value]="data()"
  [loading]="loading()"
  [paginator]="true"
  [rows]="10"
  [rowsPerPageOptions]="[10, 25, 50]"
  [showCurrentPageReport]="true"
  currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
  [emptyMessage]="'No data available'"
  styleClass="p-datatable-sm"
>
  <ng-template pTemplate="header">
    <tr>
      <th>Column 1</th>
      <th>Column 2</th>
    </tr>
  </ng-template>
  <ng-template pTemplate="body" let-item>
    <tr>
      <td>{{ item.field1 }}</td>
      <td>{{ item.field2 }}</td>
    </tr>
  </ng-template>
  <ng-template pTemplate="emptymessage">
    <tr>
      <td [attr.colspan]="2">No data available</td>
    </tr>
  </ng-template>
</p-table>
```

**For Large Tables:**
```html
<p-table
  [value]="data()"
  [virtualScrollerOptions]="{ itemSize: 50 }"
  [scrollable]="true"
  scrollHeight="400px"
>
```

---

## Step 4: Quality Gates

### 4.1 Lint Rules (Proposed)

**ESLint Rules:**
- Prevent `::ng-deep` usage
- Enforce design token usage (no hardcoded colors/spacing)
- Require `aria-label` on icon-only buttons
- Require `<label>` for form inputs

### 4.2 Component Usage Guidelines

**Create:** `CONTRIBUTING.md` section on PrimeNG usage

**Rules:**
1. Prefer PrimeNG components over custom components
2. Use `app-button` for buttons (consistent API)
3. Use `app-modal` for dialogs (consistent UX)
4. Use `app-toast` via `ToastService` (consistent notifications)
5. Use `InputText` directly for inputs (no `app-input`)
6. Always provide labels for form fields
7. Use design tokens for spacing/colors
8. Use Pass Through API for component customization

### 4.3 Checklist for New Screens

**Create:** `NEW_SCREEN_CHECKLIST.md`

**Checklist:**
- [ ] Layout uses consistent spacing (design tokens)
- [ ] Forms use PrimeNG components (`InputText`, `Select`, etc.)
- [ ] All inputs have `<label>` elements
- [ ] Icon-only buttons have `aria-label`
- [ ] Tables use `DataTable` with pagination/virtual scrolling
- [ ] Dialogs use `app-modal` or PrimeNG `Dialog`
- [ ] Toasts use `ToastService`
- [ ] Colors use design tokens (no hardcoded values)
- [ ] Spacing uses design tokens (no arbitrary values)
- [ ] Accessibility audit passes (run `npm run audit:a11y`)

---

## Execution Plan

### Phase 1: Foundation (Week 1-2)
1. ✅ Create refactor backlog (this document)
2. ⏳ Define design system (spacing, forms, buttons, tables)
3. ⏳ Create migration guides
4. ⏳ Set up lint rules

### Phase 2: Critical Replacements (Week 3-5)
1. ⏳ Migrate `app-input` → `InputText` (proof of concept)
2. ⏳ Migrate `app-form-input` → `InputText`
3. ⏳ Migrate `app-select` → `Select`
4. ⏳ Migrate `app-checkbox` → `Checkbox`
5. ⏳ Migrate `app-radio` → `RadioButton`

### Phase 3: Accessibility & Forms (Week 6-7)
1. ⏳ Standardize form field patterns
2. ⏳ Fix missing labels
3. ⏳ Fix icon-only buttons
4. ⏳ Fix heading hierarchy

### Phase 4: Performance (Week 8)
1. ⏳ Add virtual scrolling to large tables
2. ⏳ Lazy load dialog content
3. ⏳ Add `trackBy` to lists

### Phase 5: Styling (Week 9-10)
1. ⏳ Standardize spacing scale
2. ⏳ Migrate to Pass Through API
3. ⏳ Standardize form field sizing

### Phase 6: Documentation & Quality Gates (Week 11)
1. ⏳ Create `CONTRIBUTING.md` guidelines
2. ⏳ Create `NEW_SCREEN_CHECKLIST.md`
3. ⏳ Set up automated accessibility checks
4. ⏳ Final audit and cleanup

---

## Notes

- **Risk Mitigation:** Migrate one module at a time, test thoroughly before proceeding
- **Backward Compatibility:** Keep custom components during migration, mark as deprecated
- **Testing:** Run E2E tests after each migration phase
- **Documentation:** Update component docs as we migrate

---

## References

- [PrimeNG 21 Documentation](https://primeng.org/)
- [PrimeNG MCP Server](https://primeng.org/mcp)
- [Angular 21 Best Practices](./ANGULAR_PRIMENG_GUIDE.md)
- [Design System Tokens](../angular/src/assets/styles/design-system-tokens.scss)
