# PrimeNG Component Consistency Audit

**Generated:** January 2, 2026  
**Updated:** January 2, 2026 (Cross-checked with DESIGN_SYSTEM_RULES.md)  
**Scope:** Page-by-page audit of buttons, toggles, progress bars, sliders, cards, fonts, and PrimeNG components  
**Status:** 🔄 In Progress

---

## Design System Rules Reference

The following rules from `DESIGN_SYSTEM_RULES.md` are being enforced:

| Rule | Description |
|------|-------------|
| **Decision 1** | Hex colors ONLY in `design-system-tokens.scss` |
| **Decision 2** | Single spacing scale (8-point grid: `--space-*`) |
| **Decision 3** | Single radius scale (no 10px/14px) |
| **Decision 4** | Strict typography scale |
| **Decision 5** | Border tokens only |
| **Decision 6** | Shadow tokens only (`--shadow-0/1/2/3`) |
| **Section 3.1** | `@layer` cascade required |
| **Section 6.1** | PrimeNG styles only in designated files |
| **Section 7.1** | `:focus-visible` only (no `:focus`) |
| **Section 7.2** | No `transition: all` |
| **Section 14** | No `::ng-deep` outside overrides layer |
| **Section 14** | No `!important` outside overrides layer |

---

## Audit Progress

| # | Page | Status | Issues | Priority |
|---|------|--------|--------|----------|
| 1 | Settings | ✅ Cross-checked | 18 issues | P1 |
| 2 | Profile | ✅ Cross-checked | 12 issues | P1 |
| 3 | Community | ✅ Fixed | 15 issues | P1 |
| 4 | Team Chat | ✅ Fixed | 14 issues | P1 |
| 5 | AI Coach | ✅ Fixed | 20+ issues | P1 |
| 6 | Exercise Library | ✅ Fixed | 15+ issues | P1 |
| 7 | Training Videos | ✅ Fixed | 25+ issues | P1 |
| 8 | Roster | ✅ Fixed | 30+ issues | P1 |
| 9 | Tournaments | ✅ Fixed | 100+ issues | P1 |
| 10 | Game Tracker | ✅ Fixed | 150+ issues | P1 |
| 11 | Tournament Fuel | ✅ Fixed | 120+ issues | P1 |
| 12 | Game Day | ✅ Fixed | 40+ issues | P2 |
| 13 | Travel Recovery | ✅ Fixed | 200+ issues | P1 |
| 14 | Wellness | ✅ Fixed | 15+ issues | P2 |
| 15 | Player Dashboard | ✅ Fixed | 10+ issues | P2 |
| 16 | Coach Dashboard | ✅ Fixed | 15+ issues | P2 |
| 17 | Onboarding | ✅ Fixed | 50+ issues | P2 |

---

## Page 1: Settings

**File:** `angular/src/app/features/settings/settings.component.ts`  
**Template:** `settings.component.html`  
**Styles:** `settings.component.scss`

### PrimeNG Components Used

| Component | Import | Count | Issues |
|-----------|--------|-------|--------|
| `p-button` | ButtonModule | 22 | ⚠️ 3 |
| `p-card` | CardModule | 5 | ⚠️ 2 |
| `p-toggleswitch` | ToggleSwitch | 4 | ⚠️ 2 |
| `p-select` | Select | 3 | ⚠️ 1 |
| `p-dialog` | DialogModule | 5 | ⚠️ 2 |
| `p-password` | PasswordModule | 3 | ⚠️ 1 |
| `p-inputtext` | InputTextModule | 7 | ⚠️ 1 |
| `p-divider` | DividerModule | 4 | ✅ OK |
| `p-toast` | ToastModule | 1 | ✅ OK |
| `p-tooltip` | TooltipModule | 0 | ✅ OK |

---

### Issue #1: Button Styling Inconsistencies

**Severity:** 🟡 Medium  
**Component:** `p-button`

#### Problem
Buttons have inconsistent `[rounded]` usage. Some buttons use `[rounded]="true"` while others don't.

```html
<!-- Line 9-14: Save Changes - HAS rounded -->
<p-button label="Save Changes" icon="pi pi-save" [rounded]="true"></p-button>

<!-- Line 618-619: Cancel - NO rounded (inconsistent) -->
<p-button label="Cancel" [text]="true"></p-button>

<!-- Line 620-626: Update Password - NO rounded (inconsistent) -->
<p-button label="Update Password" icon="pi pi-check"></p-button>
```

#### Recommendation
Standardize button rounding across all buttons. Suggested pattern:
- **Primary actions:** `[rounded]="true"` 
- **Secondary/text actions:** `[text]="true"` (no rounded needed)
- **Danger actions:** `[rounded]="true"` + `severity="danger"`

---

### Issue #2: Toggle Switch Custom Styling

**Severity:** 🟡 Medium  
**Component:** `p-toggleswitch`

#### Problem
Heavy `::ng-deep` overrides for toggle switch dimensions and colors (lines 233-258 in SCSS).

```scss
:host ::ng-deep .p-toggleswitch .p-toggleswitch-slider {
  background: var(--color-border-primary) !important;
  border-radius: 999px !important;
  width: 48px !important;
  height: 26px !important;
}
```

#### Recommendation
1. Create a shared mixin or CSS class for toggle styling
2. Use PrimeNG's theming tokens instead of `!important` overrides
3. Consider creating a wrapper component `<app-toggle>` that encapsulates styling

---

### Issue #3: Card Styling Overrides

**Severity:** 🟡 Medium  
**Component:** `p-card`

#### Problem
Extensive `::ng-deep` overrides for cards (lines 41-76 in SCSS):

```scss
:host ::ng-deep .settings-section.p-card {
  border: 1px solid var(--color-border-primary) !important;
  border-radius: 16px !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06) !important;
}
```

#### Recommendation
1. Use design system tokens: `var(--radius-2xl)` instead of `16px`
2. Use shadow token: `var(--shadow-sm)` instead of hardcoded shadow
3. Create a standardized card variant in the primitives layer

---

### Issue #4: Dialog Styling Inconsistency

**Severity:** 🟡 Medium  
**Component:** `p-dialog`

#### Problem
Dialogs have inconsistent header handling:
- Some use `[showHeader]="false"` with custom headers
- One dialog uses standard header (`header="Disable Two-Factor Authentication"`)

```html
<!-- Line 472-479: Custom header dialog -->
<p-dialog [showHeader]="false" styleClass="password-dialog">

<!-- Line 918-924: Standard header dialog (INCONSISTENT) -->
<p-dialog header="Disable Two-Factor Authentication">
```

#### Recommendation
Standardize all dialogs to use either:
- Custom headers with `[showHeader]="false"` (current preference)
- OR PrimeNG standard headers consistently

---

### Issue #5: Input Text Padding Hardcoded

**Severity:** 🟢 Low  
**Component:** `p-inputtext`

#### Problem
Input padding uses hardcoded values instead of spacing tokens:

```scss
:host ::ng-deep .p-inputtext {
  width: 100%;
  padding: 0.75rem 1rem;  /* Should use var(--space-3) var(--space-4) */
}
```

#### Recommendation
Replace with spacing tokens:
```scss
padding: var(--space-3) var(--space-4);
```

---

### Issue #6: Password Component Custom Styling

**Severity:** 🟢 Low  
**Component:** `p-password`

#### Problem
Password inputs use `styleClass="password-input"` but the styles are defined deep in the SCSS with multiple `!important` overrides.

#### Recommendation
Create a standardized password input style in the primitives layer to avoid per-component overrides.

---

### Issue #7: Select Dropdown Missing Consistent Styling

**Severity:** 🟡 Medium  
**Component:** `p-select`

#### Problem
The language selector has custom template styling but relies on global styles:

```scss
/* p-select uses global styles from styles.scss */
:host ::ng-deep .p-select {
  width: 100%;
}
```

Custom template items like `.lang-item`, `.lang-flag` are styled locally but could conflict with other selects.

#### Recommendation
Create a reusable dropdown item template or use consistent option formatting.

---

### Issue #8: Font Size Hardcoding

**Severity:** 🟢 Low  
**Component:** Various

#### Problem
Multiple font sizes are hardcoded instead of using typography tokens:

```scss
.security-info h4 {
  font-size: 1rem;  /* Should use var(--font-body-md) */
}

.security-info p {
  font-size: 0.875rem;  /* Should use var(--font-body-sm) */
}
```

#### Recommendation
Replace all hardcoded font sizes with typography tokens:
- `1rem` → `var(--font-body-md)`
- `0.875rem` → `var(--font-body-sm)`
- `0.75rem` → `var(--font-body-xs)`

---

### Issue #9: Border Radius Inconsistency

**Severity:** 🟢 Low  
**Component:** Various

#### Problem
Mixed use of hardcoded and token border-radius:

```scss
.notification-item {
  border-radius: 12px;  /* Hardcoded */
}

.notification-icon {
  border-radius: var(--radius-lg);  /* Token ✅ */
}
```

#### Recommendation
Use consistent radius tokens:
- `12px` → `var(--radius-xl)`
- `16px` → `var(--radius-2xl)`

---

### Issue #10: Security Button Width Override

**Severity:** 🟢 Low  
**Component:** `p-button`

#### Problem
Aggressive width forcing on security section buttons:

```scss
:host ::ng-deep .security-item .p-button {
  width: 140px !important;
  min-width: 140px !important;
  max-width: 140px !important;
}
```

#### Recommendation
Use a CSS class instead of `!important` overrides, or use PrimeNG's sizing props.

---

### Issue #11: Theme Selector Not Using p-selectbutton

**Severity:** 🟢 Low  
**Component:** Custom buttons (should use p-selectbutton)

#### Problem
Theme selection uses custom `<button>` elements instead of PrimeNG's `p-selectbutton`:

```html
<div class="theme-selector">
  @for (option of themeOptions; track option.value) {
    <button type="button" class="theme-option">
```

#### Recommendation
Consider using `<p-selectbutton>` for consistent styling with other PrimeNG components.

---

### Issue #12: Dialog Width Hardcoded

**Severity:** 🟢 Low  
**Component:** `p-dialog`

#### Problem
Dialog widths use hardcoded pixel values:

```html
<p-dialog [style]="{ width: '440px' }">
<p-dialog [style]="{ width: '480px' }">
<p-dialog [style]="{ width: '500px' }">
```

#### Recommendation
Create standardized dialog sizes:
- Small: `--dialog-width-sm: 400px`
- Medium: `--dialog-width-md: 500px`
- Large: `--dialog-width-lg: 640px`

---

---

### Issue #13 (NEW): Missing @layer Wrapper

**Severity:** 🔴 Critical  
**Rule Violated:** Section 3.1 - CSS Architecture

#### Problem
The entire `settings.component.scss` file has no `@layer` wrapper. Per design system rules, all feature styles must be in `@layer features`.

#### Fix Required
```scss
@layer features {
  // All existing styles go here
}
```

---

### Issue #14 (NEW): Non-Standard Radius Values

**Severity:** 🟡 Medium  
**Rule Violated:** Decision 3 - Radius Scale

#### Problem
Uses `12px`, `14px`, `16px`, `20px` radius values directly instead of tokens:

| Line | Current | Should Be |
|------|---------|-----------|
| 91 | `border-radius: 12px;` | `var(--radius-xl)` |
| 157 | `border-radius: 12px;` | `var(--radius-xl)` |
| 317 | `border-radius: 12px;` | `var(--radius-xl)` |
| 47 | `border-radius: 16px !important;` | `var(--radius-2xl)` |
| 613 | `border-radius: 20px !important;` | `var(--radius-3xl)` (or create) |
| 647 | `border-radius: 14px;` | `var(--radius-xl)` (14px → 12px) |
| 742 | `border-radius: 14px !important;` | `var(--radius-xl)` |

---

### Issue #15 (NEW): Hardcoded Shadows

**Severity:** 🟡 Medium  
**Rule Violated:** Decision 6 - Shadow Tokens

#### Problem
Multiple hardcoded box-shadow values instead of tokens:

| Line | Current | Should Be |
|------|---------|-----------|
| 48 | `box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06) !important;` | `var(--shadow-1)` |
| 249 | `box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15) !important;` | `var(--shadow-1)` |
| 615 | `box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;` | `var(--shadow-3)` |
| 653 | `box-shadow: 0 4px 12px rgba(8, 153, 73, 0.3);` | `var(--hover-shadow-md)` |

---

### Issue #16 (NEW): Hardcoded Font Sizes

**Severity:** 🟡 Medium  
**Rule Violated:** Decision 4 - Typography Scale

#### Problem
Multiple hardcoded font sizes instead of typography tokens:

| Line | Current | Should Be |
|------|---------|-----------|
| 270 | `font-size: 0.875rem;` | `var(--font-body-sm)` |
| 347 | `font-size: 1rem;` | `var(--font-body-md)` |
| 354 | `font-size: 0.875rem;` | `var(--font-body-sm)` |
| 383 | `font-size: 3rem;` | `var(--font-heading-2xl)` or create token |
| 476 | `font-size: 1rem;` | `var(--font-body-md)` |
| 489-491 | `font-size: 1.5rem;` | `var(--font-heading-lg)` |

---

### Issue #17 (NEW): Hardcoded Font Family

**Severity:** 🟢 Low  
**Rule Violated:** Decision 4 - Typography Scale

#### Problem
`font-family: "Poppins", sans-serif` hardcoded 15+ times. Should use `var(--font-family-sans)`.

Lines: 668, 709, 739, 913, 956, 969, 1019, 1087, 1241, 1274, 1374

---

### Issue #18 (NEW): transition: all Usage

**Severity:** 🟢 Low  
**Rule Violated:** Section 7.2 - Motion Tokens

#### Problem
Line 745 uses `transition: all 0.2s ease !important;` which is forbidden.

#### Fix Required
```scss
transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
```

---

### Settings Page Summary (Cross-Checked)

| Category | Violations | Status |
|----------|------------|--------|
| Missing @layer wrapper | 1 | 🔴 Critical |
| ::ng-deep outside overrides | 30+ | 🔴 Critical |
| !important outside overrides | 50+ | 🔴 Critical |
| Non-standard radius values | 7 | 🟡 Medium |
| Hardcoded shadows | 4 | 🟡 Medium |
| Hardcoded font sizes | 10+ | 🟡 Medium |
| Hardcoded font family | 15+ | 🟢 Low |
| transition: all | 1 | 🟢 Low |
| Button styling inconsistency | 3 | 🟡 Medium |
| Toggle/Card/Dialog overrides | 6 | 🟡 Medium |

**Total Issues:** 18 (grouped)  
**Priority:** P1 (High traffic page)

---

## Fix Plan for Settings Page

### Phase 1: Structural Fixes
1. Wrap entire SCSS in `@layer features { }`
2. Move all `::ng-deep` rules to `@layer overrides { }` with documentation

### Phase 2: Token Replacements
1. Replace all hardcoded `border-radius` with tokens
2. Replace all hardcoded `box-shadow` with tokens
3. Replace all hardcoded `font-size` with tokens
4. Replace all hardcoded `font-family` with `var(--font-family-sans)`

### Phase 3: Remove !important
1. Evaluate each `!important` - is it truly needed?
2. Move necessary ones to `@layer overrides` with ticket reference
3. Remove unnecessary ones

### Phase 4: Component Consistency
1. Standardize button `[rounded]` attribute usage
2. Standardize dialog header approach
3. Consider creating wrapper components for toggles/cards

---

---

## Page 2: Profile

**File:** `angular/src/app/features/profile/profile.component.ts`  
**Type:** Single-file component with inline template and styles  
**Legacy Code:** ❌ None detected

### PrimeNG Components Used

| Component | Import | Count | Issues |
|-----------|--------|-------|--------|
| `p-button` | ButtonModule | 7 | ⚠️ 2 |
| `p-card` | CardModule | 5 | ⚠️ 2 |
| `p-tabs` | Tabs | 1 | ⚠️ 3 (Heavy overrides) |
| `p-tag` | TagModule | 4 | ⚠️ 2 |
| `p-avatar` | AvatarModule | 0 (not used) | ⚠️ 1 (Custom impl) |
| `p-progressSpinner` | ProgressSpinnerModule | 2 | ✅ OK |
| `p-tooltip` | TooltipModule | 0 | ✅ OK |

---

### Issue #13: Custom Avatar Instead of p-avatar

**Severity:** 🟡 Medium  
**Component:** Custom avatar implementation

#### Problem
The profile uses a completely custom avatar implementation instead of PrimeNG's `p-avatar`:

```html
<div class="profile-avatar-fallback">
  <span>{{ userInitials() }}</span>
</div>
```

With extensive custom CSS (lines 587-617 in inline styles):

```css
.profile-avatar-img,
.profile-avatar-fallback {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  border: 5px solid var(--surface-primary, #ffffff);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}
```

#### Recommendation
Consider using PrimeNG's `<p-avatar>` for consistency:
```html
<p-avatar 
  [label]="userInitials()" 
  [image]="avatarUrl()" 
  size="xlarge"
  shape="circle">
</p-avatar>
```

---

### Issue #14: Custom Buttons Instead of p-button

**Severity:** 🟡 Medium  
**Component:** Custom button elements

#### Problem
Profile actions use custom `<button>` elements instead of `<p-button>`:

```html
<button class="edit-profile-btn" [routerLink]="['/settings']">
  <i class="pi pi-cog"></i>
  <span>Edit Profile</span>
</button>
<button class="share-profile-btn" (click)="shareProfile()">
  <i class="pi pi-share-alt"></i>
</button>
```

With extensive custom CSS (lines 747-800).

#### Recommendation
Use PrimeNG buttons for consistency:
```html
<p-button 
  label="Edit Profile" 
  icon="pi pi-cog" 
  [rounded]="true"
  [routerLink]="['/settings']">
</p-button>
```

---

### Issue #15: Extremely Heavy Tab Styling Overrides

**Severity:** 🔴 High  
**Component:** `p-tabs`

#### Problem
~500 lines of `::ng-deep` CSS overrides for tabs (lines 971-1175). This is excessive and indicates either:
1. The default PrimeNG theme doesn't match the design system
2. Custom tab styling should be extracted to a shared component

Key issues:
- Heavy use of `!important` (~80+ instances)
- Multiple complex selectors with `[data-p-active]`, `[aria-selected]`
- Hardcoded colors like `#374151`, `#ffffff`
- Hardcoded shadows instead of design tokens

```css
.profile-tabs-container ::ng-deep .p-tab {
  color: #374151 !important;  /* Should use token */
  background: #ffffff !important;  /* Should use token */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08) ... !important;  /* Should use token */
}
```

#### Recommendation
1. Create a shared `<app-tabs>` wrapper component
2. Extract tab styles to the primitives layer
3. Replace hardcoded values with design tokens

---

### Issue #16: p-tag Overrides

**Severity:** 🟢 Low  
**Component:** `p-tag`

#### Problem
Heavy overrides to make p-tag transparent (lines 939-969):

```css
.performance-stat ::ng-deep .p-tag {
  background: transparent !important;
  color: var(--color-text-primary, #1a1a1a) !important;
  border: none !important;
  padding: 0 !important;
}
```

#### Recommendation
If transparent tags are needed frequently, create a custom component or use a different element (plain text with styling).

---

### Issue #17: Hardcoded Font Family

**Severity:** 🟢 Low  
**Component:** Various

#### Problem
Multiple places hardcode `font-family: "Poppins"` instead of using typography tokens:

```css
.profile-avatar-fallback span {
  font-family: "Poppins", sans-serif;  /* Line 612 */
}
.jersey-badge span {
  font-family: "Poppins", sans-serif;  /* Line 664 */
}
.profile-display-name {
  font-family: "Poppins", sans-serif;  /* Line 677 */
}
```

#### Recommendation
Use `var(--font-family-sans)` token instead.

---

### Issue #18: Hardcoded Colors in Gradients

**Severity:** 🟡 Medium  
**Component:** Various CSS

#### Problem
Gradients use hardcoded hex colors instead of tokens:

```css
.profile-header-bg {
  background: linear-gradient(
    135deg,
    var(--ds-primary-green, #089949) 0%,
    #0ab85a 50%,  /* Hardcoded */
    #067a3b 100%  /* Hardcoded */
  );
}
```

Also found in:
- `.profile-avatar-fallback` (line 601-606)
- `.edit-profile-btn` (line 756-760)
- Tab active states

#### Recommendation
Use gradient tokens or create new ones for these use cases.

---

### Issue #19: Missing @layer Wrapper

**Severity:** 🟡 Medium  
**Component:** Inline styles

#### Problem
The inline styles block is not wrapped in `@layer features`. While inline styles have higher specificity, this is still inconsistent with the design system rules.

#### Recommendation
Component styles should follow the same layering pattern even when inline.

---

---

### Issue #20 (NEW - Cross-Check): Non-Standard Radius Values

**Severity:** 🟡 Medium  
**Rule Violated:** Decision 3 - Radius Scale

#### Problem
Profile uses `20px`, `14px`, `16px` radius instead of tokens:

| Line | Current | Should Be |
|------|---------|-----------|
| 544 | `border-radius: 20px;` | `var(--radius-3xl)` or `var(--radius-2xl)` |
| 590 | `border-radius: 50%;` | `var(--radius-full)` ✅ OK |
| 625 | `border-radius: 50%;` | `var(--radius-full)` ✅ OK |
| 659 | `border-radius: 20px;` | `var(--radius-3xl)` |
| 700 | `border-radius: 20px;` | `var(--radius-3xl)` |
| 762 | `border-radius: 9999px;` | `var(--radius-full)` ✅ OK |
| 1032 | `border-radius: 9999px !important;` | `var(--radius-full)` |
| 1284 | `border-radius: 16px;` | `var(--radius-2xl)` |

---

### Issue #21 (NEW - Cross-Check): Hardcoded Shadows

**Severity:** 🟡 Medium  
**Rule Violated:** Decision 6 - Shadow Tokens

#### Problem
Multiple hardcoded box-shadow values:

| Line | Current | Should Be |
|------|---------|-----------|
| 547 | `box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);` | `var(--shadow-2)` |
| 593 | `box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);` | `var(--shadow-3)` |
| 634 | `box-shadow: 0 4px 12px rgba(8, 153, 73, 0.3);` | `var(--hover-shadow-md)` |
| 660 | `box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);` | `var(--shadow-2)` |
| 765 | `box-shadow: 0 4px 12px rgba(8, 153, 73, 0.3);` | `var(--hover-shadow-md)` |
| 1035-1038 | Complex multi-shadow | Should use `var(--shadow-1)` + `var(--hover-shadow-sm)` |

---

### Issue #22 (NEW - Cross-Check): Hardcoded Colors in Inline Styles

**Severity:** 🔴 High  
**Rule Violated:** Decision 1 - Token Source of Truth

#### Problem
The inline styles contain 50+ hardcoded hex colors:

```css
/* Examples of violations */
color: #374151 !important;           /* Line 1030 - Should use var(--color-text-primary) */
background: #ffffff !important;      /* Line 1031 - Should use var(--surface-primary) */
color: var(--ds-primary-green, #089949) /* Fallback pattern - acceptable for inline but should be audited */
background: linear-gradient(135deg, #0ab85a 0%, ...) /* Lines 557-562 - Need gradient tokens */
color: #3b82f6;                      /* Line 714 - Need team color token */
```

---

### Issue #23 (NEW - Cross-Check): Raw Spacing Values

**Severity:** 🟡 Medium  
**Rule Violated:** Decision 2 - Spacing Scale

#### Problem
Multiple raw spacing values used:

| Line | Current | Should Be |
|------|---------|-----------|
| 577 | `padding-top: 60px;` | `var(--space-16)` (64px) |
| 656 | `margin-top: 0.75rem;` | `var(--space-3)` ✅ equivalent |
| 672 | `padding: 1.5rem 2rem 2rem;` | `var(--space-6) var(--space-8) var(--space-8)` |
| 681 | `margin: 0 0 0.75rem 0;` | `var(--space-3)` |
| 689 | `gap: 0.75rem;` | `var(--space-3)` |
| 744 | `padding: 0 2rem 2rem;` | `var(--space-8)` |

---

### Issue #24 (NEW - Cross-Check): Hardcoded Font Sizes

**Severity:** 🟡 Medium  
**Rule Violated:** Decision 4 - Typography Scale

#### Problem
Multiple raw font-size values:

| Line | Current | Should Be |
|------|---------|-----------|
| 614 | `font-size: 3rem;` | `var(--font-heading-2xl)` (2.5rem) or larger |
| 666 | `font-size: 1.125rem;` | `var(--font-body-lg)` |
| 679 | `font-size: 2rem;` | `var(--font-heading-xl)` (1.875rem) |
| 702 | `font-size: 0.875rem;` | `var(--font-body-sm)` |
| 723 | `font-size: 0.9375rem;` | `var(--font-body-md)` (not on scale) |
| 731 | `font-size: 0.8125rem;` | `var(--font-body-sm)` (not on scale) |

**Note:** `0.9375rem` (15px) and `0.8125rem` (13px) are NOT on the typography scale. They should be migrated to `--font-body-sm` (14px) or `--font-body-md` (16px).

---

### Profile Page Summary (Cross-Checked)

| Category | Violations | Status |
|----------|------------|--------|
| Missing @layer wrapper | 1 | 🔴 Critical |
| ::ng-deep outside overrides | 40+ | 🔴 Critical |
| !important outside overrides | 80+ | 🔴 Critical |
| Hardcoded hex colors | 50+ | 🔴 Critical |
| Non-standard radius values | 5 | 🟡 Medium |
| Hardcoded shadows | 8 | 🟡 Medium |
| Hardcoded font sizes | 10+ | 🟡 Medium |
| Hardcoded font family | 8 | 🟢 Low |
| Raw spacing values | 10+ | 🟡 Medium |
| Non-scale font sizes (13px, 15px) | 3 | 🟡 Medium |
| Custom components vs PrimeNG | 2 | 🟡 Medium |

**Total Issues:** 12 (grouped)  
**Priority:** P1 (High traffic page)

---

## Fix Plan for Profile Page

### Phase 1: Structural Fixes
1. This is an inline-style component - consider extracting to `.scss` file
2. If keeping inline, wrap in `@layer features`
3. Move all `::ng-deep` rules to `@layer overrides { }` with documentation

### Phase 2: Color Token Replacements
1. Replace all `#374151`, `#ffffff`, `#1a1a1a` with text/surface tokens
2. Create gradient tokens for profile header background
3. Use status tokens for colors like `#3b82f6` (info blue)

### Phase 3: Spacing/Radius/Shadow Token Replacements
1. Replace all raw `px` and `rem` spacing with `var(--space-*)` tokens
2. Replace all `border-radius` with radius tokens
3. Replace all `box-shadow` with shadow tokens

### Phase 4: Typography Token Replacements
1. Replace all `font-size` with typography tokens
2. Replace all `font-family: "Poppins"` with `var(--font-family-sans)`
3. Migrate non-scale sizes (13px, 15px) to nearest token value

### Phase 5: Component Consolidation
1. Evaluate using `<p-avatar>` instead of custom avatar
2. Evaluate using `<p-button>` instead of custom buttons
3. Extract tab styling to shared component or primitives layer

---

## Next Page: Community

Ready to audit Community page. Continue with audit or **fix Settings and Profile first?**
