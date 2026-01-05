# Button Standardization Guide

## Overview

This document describes the unified button system for the FlagFit Pro Angular application. All buttons in the app should use `<app-button>` or `<app-icon-button>` components.

## Why Standardization?

Before standardization, the app had 4 parallel button systems:

- PrimeNG `<p-button>` (~1,500 occurrences)
- PrimeNG `pButton` directive (~29 occurrences)
- Native `<button>` (~256 occurrences)
- Custom `<app-button>` (~99 occurrences)

This fragmentation caused:

- Inconsistent styling across the app
- Duplicated CSS and styling logic
- Difficulty maintaining accessibility standards
- Confusion for developers about which button to use

## Standard Components

### `<app-button>` - Primary Button Component

The single standard button for all use cases with text labels.

#### Import

```typescript
import { ButtonComponent } from '@shared/components/button/button.component';

@Component({
  imports: [ButtonComponent],
  // ...
})
```

#### API

| Input         | Type                                                                        | Default     | Description                                   |
| ------------- | --------------------------------------------------------------------------- | ----------- | --------------------------------------------- |
| `variant`     | `'primary' \| 'secondary' \| 'outlined' \| 'text' \| 'danger' \| 'success'` | `'primary'` | Visual style variant                          |
| `size`        | `'sm' \| 'md' \| 'lg'`                                                      | `'md'`      | Button size                                   |
| `iconLeft`    | `string`                                                                    | `''`        | PrimeIcon on left (e.g., `'pi-check'`)        |
| `iconRight`   | `string`                                                                    | `''`        | PrimeIcon on right (e.g., `'pi-arrow-right'`) |
| `loading`     | `boolean`                                                                   | `false`     | Shows spinner, disables interaction           |
| `disabled`    | `boolean`                                                                   | `false`     | Disables the button                           |
| `fullWidth`   | `boolean`                                                                   | `false`     | Makes button full width                       |
| `type`        | `'button' \| 'submit' \| 'reset'`                                           | `'button'`  | HTML button type                              |
| `ariaLabel`   | `string`                                                                    | `''`        | Accessibility label (required for icon-only)  |
| `routerLink`  | `string \| string[]`                                                        | `null`      | Router navigation                             |
| `queryParams` | `object`                                                                    | `null`      | Query parameters for router link              |
| `tooltip`     | `string`                                                                    | `''`        | Tooltip text                                  |
| `testId`      | `string`                                                                    | `''`        | data-testid attribute                         |

| Output    | Type         | Description                                |
| --------- | ------------ | ------------------------------------------ |
| `clicked` | `MouseEvent` | Emits on click (NOT when disabled/loading) |

#### Examples

```html
<!-- Basic primary button -->
<app-button (clicked)="save()">Save</app-button>

<!-- Secondary with left icon -->
<app-button variant="secondary" iconLeft="pi-check">Confirm</app-button>

<!-- Danger button with loading state -->
<app-button variant="danger" [loading]="isDeleting" (clicked)="delete()">
  Delete
</app-button>

<!-- Full width submit button -->
<app-button type="submit" [fullWidth]="true" [loading]="isSubmitting">
  Submit Form
</app-button>

<!-- Text button with router link -->
<app-button variant="text" routerLink="/dashboard">
  Go to Dashboard
</app-button>

<!-- Outlined button with right icon -->
<app-button variant="outlined" iconRight="pi-arrow-right">
  Continue
</app-button>
```

### `<app-icon-button>` - Icon-Only Button Component

Specialized component for icon-only actions. Requires `ariaLabel` for accessibility.

#### Import

```typescript
import { IconButtonComponent } from '@shared/components/button/icon-button.component';

@Component({
  imports: [IconButtonComponent],
  // ...
})
```

#### API

| Input        | Type                                                                        | Default      | Description                         |
| ------------ | --------------------------------------------------------------------------- | ------------ | ----------------------------------- |
| `icon`       | `string`                                                                    | **required** | PrimeIcon class (e.g., `'pi-plus'`) |
| `ariaLabel`  | `string`                                                                    | **required** | Accessibility label                 |
| `variant`    | `'primary' \| 'secondary' \| 'outlined' \| 'text' \| 'danger' \| 'success'` | `'text'`     | Visual style                        |
| `size`       | `'sm' \| 'md' \| 'lg'`                                                      | `'md'`       | Button size                         |
| `loading`    | `boolean`                                                                   | `false`      | Shows spinner                       |
| `disabled`   | `boolean`                                                                   | `false`      | Disables button                     |
| `tooltip`    | `string`                                                                    | `''`         | Tooltip (defaults to ariaLabel)     |
| `routerLink` | `string \| string[]`                                                        | `null`       | Router navigation                   |

#### Examples

```html
<!-- Add button -->
<app-icon-button icon="pi-plus" ariaLabel="Add item" (clicked)="addItem()" />

<!-- Edit button in a table row -->
<app-icon-button
  icon="pi-pencil"
  ariaLabel="Edit"
  variant="secondary"
  size="sm"
  (clicked)="edit(item)"
/>

<!-- Delete button -->
<app-icon-button
  icon="pi-trash"
  ariaLabel="Delete"
  variant="danger"
  (clicked)="delete(item)"
/>

<!-- Settings with router link -->
<app-icon-button icon="pi-cog" ariaLabel="Settings" routerLink="/settings" />
```

## Migration Guide

### From PrimeNG `<p-button>`

| PrimeNG                   | App Button                      |
| ------------------------- | ------------------------------- |
| `<p-button label="Save">` | `<app-button>Save</app-button>` |
| `severity="secondary"`    | `variant="secondary"`           |
| `severity="danger"`       | `variant="danger"`              |
| `severity="success"`      | `variant="success"`             |
| `[outlined]="true"`       | `variant="outlined"`            |
| `[text]="true"`           | `variant="text"`                |
| `icon="pi pi-check"`      | `iconLeft="pi-check"`           |
| `iconPos="right"`         | `iconRight="pi-check"`          |
| `styleClass="w-full"`     | `[fullWidth]="true"`            |
| `(onClick)="fn()"`        | `(clicked)="fn()"`              |
| `size="small"`            | `size="sm"`                     |
| `size="large"`            | `size="lg"`                     |

### From `pButton` Directive

```html
<!-- Before -->
<button pButton label="Save" icon="pi pi-check" (click)="save()"></button>

<!-- After -->
<app-button iconLeft="pi-check" (clicked)="save()">Save</app-button>
```

### From Native `<button>`

```html
<!-- Before -->
<button class="btn btn-primary" (click)="save()">Save</button>

<!-- After -->
<app-button (clicked)="save()">Save</app-button>
```

### Icon-Only Buttons

```html
<!-- Before (PrimeNG) -->
<p-button icon="pi pi-plus" [rounded]="true" (onClick)="add()"></p-button>

<!-- After -->
<app-icon-button icon="pi-plus" ariaLabel="Add" (clicked)="add()" />
```

## Whitelisted Raw Buttons

In some cases, raw `<button>` elements are allowed:

1. **Rich text editor toolbars** - Custom formatting controls
2. **Third-party integrations** - When required by external libraries
3. **Button component itself** - The internal implementation

To whitelist a raw button, add the `data-raw-button="allowed"` attribute:

```html
<button data-raw-button="allowed" (click)="customAction()">Custom</button>
```

## Linting

Run the button linter to find violations:

```bash
# From angular directory
node scripts/lint-buttons.js

# With fix suggestions
node scripts/lint-buttons.js --fix

# Strict mode (fails on errors)
node scripts/lint-buttons.js --strict

# Scan specific directory
node scripts/lint-buttons.js src/app/features/auth
```

## Design Tokens

The button components use these design tokens:

| Token                      | Usage                       |
| -------------------------- | --------------------------- |
| `--ds-primary-green`       | Primary button background   |
| `--ds-primary-green-hover` | Primary button hover        |
| `--color-status-error`     | Danger button background    |
| `--color-status-success`   | Success button background   |
| `--surface-primary`        | Secondary button background |
| `--color-border-primary`   | Secondary button border     |
| `--radius-lg`              | Default border radius       |
| `--radius-md`              | Small button border radius  |
| `--radius-xl`              | Large button border radius  |

## Accessibility

All buttons include:

- Proper `type` attribute (defaults to `"button"`)
- Focus ring with `--ds-primary-green` outline
- `aria-busy` when loading
- `aria-disabled` when disabled
- Required `ariaLabel` for icon-only buttons
- Keyboard navigation support

## Touch Target Requirements

- Minimum touch target: 44x44px (md size)
- Small buttons: 36x36px (acceptable in dense layouts)
- Large buttons: 52x52px

## Migration Checklist

- [ ] Replace all `<p-button>` with `<app-button>`
- [ ] Replace all `pButton` directives with `<app-button>`
- [ ] Replace native `<button>` with `<app-button>` or whitelist
- [ ] Remove unused `ButtonModule` imports from feature modules
- [ ] Remove legacy button CSS classes (`.p-button-*`, etc.)
- [ ] Add `ariaLabel` to all icon-only buttons
- [ ] Run `node scripts/lint-buttons.js` to verify
- [ ] Update component tests if needed
