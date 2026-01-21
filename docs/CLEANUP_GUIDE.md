# PrimeNG Refactor - Cleanup Guide

**Date:** 2025-01-XX  
**Purpose:** Guide for removing unused custom components

---

## 🗑️ Components to Remove

The following custom components have been verified as **unused** and can be safely removed:

1. **`app-select`** (`shared/components/select/`)
2. **`app-checkbox`** (`shared/components/checkbox/`)
3. **`app-radio`** (`shared/components/radio/`)

**Verification:** These components are only found in their own definition files and are not imported or used anywhere in the codebase.

---

## 📋 Cleanup Steps

### Step 1: Verify No Usage

Before removing, verify components are truly unused:

```bash
# Search for imports
grep -r "from.*select/select" angular/src/app
grep -r "from.*checkbox/checkbox" angular/src/app
grep -r "from.*radio/radio" angular/src/app

# Search for component usage
grep -r "<app-select" angular/src/app
grep -r "<app-checkbox" angular/src/app
grep -r "<app-radio" angular/src/app

# Search for component selectors
grep -r "SelectComponent" angular/src/app
grep -r "CheckboxComponent" angular/src/app
grep -r "RadioComponent" angular/src/app
```

**Expected Result:** Only found in component definition files and `ui-components.ts` export file.

### Step 2: Remove Component Files

Delete the following files:

```bash
# Remove Select component
rm -rf angular/src/app/shared/components/select/

# Remove Checkbox component
rm -rf angular/src/app/shared/components/checkbox/

# Remove Radio component
rm -rf angular/src/app/shared/components/radio/
```

**Files to Delete:**
- `angular/src/app/shared/components/select/select.component.ts`
- `angular/src/app/shared/components/checkbox/checkbox.component.ts`
- `angular/src/app/shared/components/checkbox/checkbox.component.scss`
- `angular/src/app/shared/components/radio/radio.component.ts`
- `angular/src/app/shared/components/radio/radio.component.scss`

### Step 3: Update Exports

Remove exports from `ui-components.ts`:

**File:** `angular/src/app/shared/components/ui-components.ts`

**Remove:**
```typescript
export { CheckboxComponent } from "./checkbox/checkbox.component";
export { RadioComponent } from "./radio/radio.component";
```

**Note:** `SelectComponent` export has already been removed (comment indicates it was removed previously).

### Step 4: Verify Build

After removal, verify the build still works:

```bash
npm run build
```

**Expected Result:** Build succeeds without errors.

### Step 5: Run Tests

Run test suite to ensure nothing broke:

```bash
npm test
```

**Expected Result:** All tests pass.

---

## ⚠️ Important Notes

### Why These Components Can Be Removed

1. **Not Used:** Comprehensive search confirmed these components are not used anywhere
2. **Replaced:** All forms now use PrimeNG components directly:
   - `app-select` → `p-select` (PrimeNG Select)
   - `app-checkbox` → `p-checkbox` (PrimeNG Checkbox)
   - `app-radio` → `p-radioButton` (PrimeNG RadioButton)
3. **Better Practice:** Using PrimeNG components directly provides:
   - Better accessibility (built-in ARIA support)
   - Better performance (optimized by PrimeNG)
   - Better maintenance (one less abstraction layer)
   - Better consistency (standard PrimeNG patterns)

### Components to Keep

These custom components **add value** and should be kept:

- ✅ `app-button` - Adds consistent API, loading states, router support
- ✅ `app-modal` - Adds consistent UX patterns, animations
- ✅ `app-toast` - Adds consistent notifications
- ✅ `app-search-input` - Adds consistent search pattern

---

## 🔄 Migration Reference

If you find any usage of these components after cleanup, refer to migration patterns:

### app-select → PrimeNG Select

**Before:**
```typescript
<app-select
  [label]="'Position'"
  [options]="positionOptions"
  [(ngModel)]="selectedPosition"
/>
```

**After:**
```typescript
<label for="position-select">Position</label>
<p-select
  inputId="position-select"
  [options]="positionOptions"
  [(ngModel)]="selectedPosition"
  [attr.aria-label]="'Select position'"
></p-select>
```

### app-checkbox → PrimeNG Checkbox

**Before:**
```typescript
<app-checkbox
  [label]="'I agree'"
  [(ngModel)]="agreed"
/>
```

**After:**
```typescript
<div class="field-checkbox">
  <p-checkbox
    inputId="agreement-checkbox"
    [(ngModel)]="agreed"
    [binary]="true"
  ></p-checkbox>
  <label for="agreement-checkbox">I agree</label>
</div>
```

### app-radio → PrimeNG RadioButton

**Before:**
```typescript
<app-radio
  [label]="'Option 1'"
  [value]="'opt1'"
  [name]="'choice'"
  [(ngModel)]="selectedOption"
/>
```

**After:**
```typescript
<div class="field-radiobutton">
  <p-radioButton
    inputId="option1"
    name="choice"
    value="opt1"
    [(ngModel)]="selectedOption"
  ></p-radioButton>
  <label for="option1">Option 1</label>
</div>
```

---

## ✅ Cleanup Checklist

- [ ] Verified components are unused
- [ ] Removed component files
- [ ] Updated exports in `ui-components.ts`
- [ ] Verified build succeeds
- [ ] Ran tests (all pass)
- [ ] Updated documentation
- [ ] Committed changes

---

## 📝 Post-Cleanup Verification

After cleanup, verify:

1. **Build:** `npm run build` succeeds
2. **Tests:** `npm test` passes
3. **Linting:** `npm run lint` passes
4. **No Broken Imports:** Search for any remaining imports
5. **Documentation:** Update any references to removed components

---

## 🎯 Benefits of Cleanup

1. **Reduced Codebase Size:** Fewer files to maintain
2. **Reduced Complexity:** One less abstraction layer
3. **Better Performance:** Direct PrimeNG usage is more efficient
4. **Better Accessibility:** PrimeNG components have built-in accessibility
5. **Easier Maintenance:** Standard PrimeNG patterns

---

**Cleanup Status:** ⏳ **PENDING** (Ready to execute)  
**Risk Level:** 🟢 **LOW** (Components verified as unused)
