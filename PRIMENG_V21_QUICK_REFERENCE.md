# PrimeNG v21 Event Syntax Quick Reference

## Quick Summary
In PrimeNG v21, the `onChange` event has been deprecated in favor of `onValueChange` for consistency across all form components.

---

## Event Syntax Changes

### ❌ OLD (Deprecated)
```html
<!-- Dropdowns -->
<p-select (onChange)="handleChange($event)"></p-select>
<p-dropdown (onChange)="handleChange($event)"></p-dropdown>

<!-- Checkboxes -->
<p-checkbox (onChange)="handleToggle($event)"></p-checkbox>

<!-- Sliders -->
<p-slider (onChange)="handleSlide($event)"></p-slider>

<!-- Multi-select -->
<p-multiSelect (onChange)="handleSelection($event)"></p-multiSelect>

<!-- Toggle Button -->
<p-toggleButton (onChange)="handleToggle($event)"></p-toggleButton>

<!-- Select Button -->
<p-selectButton (onChange)="handleSelection($event)"></p-selectButton>
```

### ✅ NEW (Correct)
```html
<!-- Dropdowns -->
<p-select (onValueChange)="handleChange($event)"></p-select>
<p-dropdown (onValueChange)="handleChange($event)"></p-dropdown>

<!-- Checkboxes -->
<p-checkbox (onValueChange)="handleToggle($event)"></p-checkbox>

<!-- Sliders -->
<p-slider (onValueChange)="handleSlide($event)"></p-slider>

<!-- Multi-select -->
<p-multiSelect (onValueChange)="handleSelection($event)"></p-multiSelect>

<!-- Toggle Button -->
<p-toggleButton (onValueChange)="handleToggle($event)"></p-toggleButton>

<!-- Select Button -->
<p-selectButton (onValueChange)="handleSelection($event)"></p-selectButton>
```

---

## Special Cases

### ✅ Date Pickers - NO CHANGE NEEDED
```html
<!-- These are CORRECT - onSelect is still valid for date pickers -->
<p-datepicker (onSelect)="handleDateChange($event)"></p-datepicker>
<p-calendar (onSelect)="handleDateChange($event)"></p-calendar>
```

### ⚠️ AutoComplete
```html
<!-- OLD -->
<p-autoComplete (onSelect)="handleSelection($event)"></p-autoComplete>

<!-- NEW -->
<p-autoComplete (onValueChange)="handleSelection($event)"></p-autoComplete>
```

---

## Component Methods - NO CHANGES NEEDED

Your TypeScript methods remain unchanged:

```typescript
// This works exactly the same
handleChange(event: any): void {
  console.log(event.value); // Still works
  // Your logic here
}

// Event structure is the same
handleSelection(event: any): void {
  const selectedValue = event.value;
  // Process value
}
```

---

## Two-Way Binding - NO CHANGES NEEDED

```html
<!-- Two-way binding still works the same -->
<p-select 
  [(ngModel)]="selectedValue"
  (onValueChange)="handleChange($event)"
></p-select>
```

---

## Common Patterns

### Filter Dropdowns
```html
<!-- Before -->
<p-select
  [options]="filterOptions"
  [(ngModel)]="selectedFilter"
  (onChange)="applyFilters()"
></p-select>

<!-- After -->
<p-select
  [options]="filterOptions"
  [(ngModel)]="selectedFilter"
  (onValueChange)="applyFilters()"
></p-select>
```

### Checkbox Toggles
```html
<!-- Before -->
<p-checkbox
  [(ngModel)]="isChecked"
  [binary]="true"
  (onChange)="handleToggle($event)"
></p-checkbox>

<!-- After -->
<p-checkbox
  [(ngModel)]="isChecked"
  [binary]="true"
  (onValueChange)="handleToggle($event)"
></p-checkbox>
```

### Slider Controls
```html
<!-- Before -->
<p-slider
  [(ngModel)]="value"
  [min]="0"
  [max]="10"
  (onChange)="handleChange()"
></p-slider>

<!-- After -->
<p-slider
  [(ngModel)]="value"
  [min]="0"
  [max]="10"
  (onValueChange)="handleChange()"
></p-slider>
```

---

## Search & Replace Pattern

When adding new components, use this regex to check:

```regex
\(onChange\)=
```

Replace with:
```
(onValueChange)=
```

**EXCEPT** when the component is `p-datepicker` or `p-calendar` (keep `onSelect`)

---

## Component Checklist

When using these PrimeNG components, use `(onValueChange)`:
- ✅ p-select
- ✅ p-dropdown
- ✅ p-checkbox
- ✅ p-slider
- ✅ p-multiSelect
- ✅ p-toggleButton
- ✅ p-selectButton
- ✅ p-autoComplete
- ✅ p-inputSwitch
- ✅ p-radioButton
- ✅ p-rating
- ✅ p-knob

Use `(onSelect)` for:
- ✅ p-datepicker
- ✅ p-calendar

---

## Quick Verification

Run this command to check for any remaining issues:

```bash
# Search for old syntax
grep -r "(onChange)=" angular/src/app --include="*.ts" --include="*.html"

# Should return no results

# Verify new syntax exists
grep -r "(onValueChange)=" angular/src/app --include="*.ts" --include="*.html"

# Should show many results
```

---

## Resources

- [PrimeNG v21 Official Migration Guide](https://primeng.org/migration/v21)
- [PrimeNG API Documentation](https://primeng.org/)
- Project Audit Report: `PRIMENG_V21_EVENT_SYNTAX_AUDIT.md`
- Project Fix Summary: `PRIMENG_V21_FIXES_COMPLETE.md`

---

**Last Updated:** January 9, 2026  
**PrimeNG Version:** v21+  
**Status:** All project components updated ✅
