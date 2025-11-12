# Design System Consistency Audit Report

**Date:** Generated automatically  
**Scope:** Complete codebase audit for design system consistency

---

## Executive Summary

This audit identifies inconsistencies across colors, typography, spacing, components, borders, and shadows. Each inconsistency includes the component/element, location, standardization requirement, and the correct design token value to use.

---

## COLORS

### ❌ INCONSISTENCY 1: Hardcoded Brand Colors

**Component/Element:** Buttons, badges, loading states, help system, sidebar  
**Where it's inconsistent:**
- `src/css/components/sidebar.css:33` - `background: linear-gradient(135deg, #10c96b 0%, #0ab85a 50%, #089949 100%);`
- `src/css/components/sidebar.css:155` - `color: #10c96b;`
- `src/css/loading-states.css:23` - `border-top-color: #10c96b;`
- `src/css/loading-states.css:103` - `background: linear-gradient(90deg, #10c96b, #0ab85a);`
- `src/css/help-system.css:106` - `color: #10c96b;`
- `src/css/help-system.css:258` - `color: #10c96b;`
- `src/css/onboarding.css:67` - `background: linear-gradient(90deg, #10c96b, #0ab85a);`
- `src/css/onboarding.css:139` - `background: #10c96b;`
- `src/css/onboarding.css:183` - `color: #10c96b;`
- `src/css/components/badge.css:34` - `background: rgba(16, 201, 107, 0.15);`
- `src/css/components/badge.css:36` - `border-color: rgba(16, 201, 107, 0.3);`
- `src/css/components/card.css:269` - `border: 2px solid rgba(16, 201, 107, 0.2);`
- `src/css/components/card.css:348` - `background: rgba(16, 201, 107, 0.15);`
- `src/css/components/card.css:463` - `border-color: rgba(16, 201, 107, 0.3);`
- `src/css/components/card.css:478` - `border-color: rgba(16, 201, 107, 0.3);`

**What should be standardized:** All brand colors should use design tokens  
**Design token value to use:** 
- `var(--color-brand-primary)` for `#10c96b`
- `var(--color-brand-primary-hover)` for `#0ab85a`
- `var(--color-brand-primary-active)` for `#089949`
- `rgba(var(--primitive-primary-rgb), 0.15)` for rgba values

---

### ❌ INCONSISTENCY 2: Hardcoded Error Color

**Component/Element:** Form inputs, error messages, badges  
**Where it's inconsistent:**
- `src/css/components/form.css:86` - `border-color: var(--color-status-success, #10c96b);` (fallback should be error color)
- `src/css/field-error.css:10` - `border: 1px solid var(--color-status-error, #ef4444);` (has fallback but should use token directly)
- `src/css/components/badge.css:74` - Uses token correctly, but rgba hardcoded: `rgba(239, 68, 68, 0.15)`

**What should be standardized:** All error colors should use `var(--color-status-error)`  
**Design token value to use:** `var(--color-status-error)` (which equals `#ef4444`)

---

### ❌ INCONSISTENCY 3: Hardcoded Success Color

**Component/Element:** Form inputs, success messages  
**Where it's inconsistent:**
- `src/css/components/form.css:86` - `border-color: var(--color-status-success, #10c96b);`
- `src/css/components/form.css:91` - `border-color: var(--color-status-success, #10c96b);`
- `src/css/components/form.css:130` - `color: var(--color-status-success, #10c96b);`
- `src/css/components/form.css:138` - `color: var(--color-status-success, #10c96b);`

**What should be standardized:** All success colors should use `var(--color-status-success)`  
**Design token value to use:** `var(--color-status-success)` (which equals `var(--color-brand-primary)` = `#10c96b`)

---

### ❌ INCONSISTENCY 4: Random Colors Outside Palette

**Component/Element:** Tournament page icons  
**Where it's inconsistent:**
- `tournaments.html:1416` - `background: #f3e5f5; color: #7b1fa2;` (purple - not in palette)
- `tournaments.html:1423` - `background: #fff3e0; color: #f57c00;` (orange - not in palette)
- `src/css/components/header.css:178` - `border-color: #10b981;` (emerald - should use brand primary)
- `src/css/components/sidebar.css:115` - `color: #047857;` (emerald-700 - should use token)

**What should be standardized:** All colors must use design tokens from the palette  
**Design token value to use:**
- For purple: Use `var(--primitive-tertiary-500)` or create semantic token
- For orange: Use `var(--primitive-warning-500)` or `var(--color-status-warning)`
- For emerald: Use `var(--color-brand-primary)` or `var(--primitive-primary-600)`

---

### ❌ INCONSISTENCY 5: Hardcoded Warning/Info Colors

**Component/Element:** Badges  
**Where it's inconsistent:**
- `src/css/components/badge.css:63` - `color: #f59e0b;` (warning)
- `src/css/components/badge.css:69` - `color: #f59e0b;` (warning)
- `src/css/components/badge.css:85` - `color: #3b82f6;` (info - blue not in standard palette)
- `src/css/components/badge.css:91` - `color: #3b82f6;` (info)

**What should be standardized:** Use design tokens for status colors  
**Design token value to use:**
- `var(--color-status-warning)` for warning (equals `#fbbf24` or `#f59e0b`)
- `var(--color-status-info)` for info (equals `var(--primitive-info-500)` = `#0ea5e9`, not `#3b82f6`)

---

### ⚠️ INCONSISTENCY 6: Dark Mode Colors

**Component/Element:** Dark theme implementation  
**Where it's inconsistent:**
- `src/css/themes/dark.css:8-15` - Hardcoded dark colors instead of using primitive tokens
- `src/css/themes/dark.css:23-32` - Duplicate hardcoded values
- Dark mode should reference `--primitive-neutral-*` tokens more consistently

**What should be standardized:** Dark mode should use semantic tokens that reference primitives  
**Design token value to use:** Use `var(--primitive-neutral-900)`, `var(--primitive-neutral-800)`, etc. instead of hardcoded hex values

---

## TYPOGRAPHY

### ❌ INCONSISTENCY 7: H1 Size Standardization

**Component/Element:** H1 headings  
**Where it's inconsistent:**
- `src/css/base.css:70` - Uses `var(--typography-display-md-size)` which is `36px` ✅ CORRECT
- However, user requirement states H1 should be `36px` - this is already correct

**What should be standardized:** H1 should consistently use `var(--typography-display-md-size)`  
**Design token value to use:** `var(--typography-display-md-size)` (36px) ✅ Already correct

---

### ❌ INCONSISTENCY 8: H2 Size Standardization

**Component/Element:** H2 headings  
**Where it's inconsistent:**
- `src/css/base.css:81` - Uses `var(--typography-heading-xl-size)` which is `36px`
- User requirement states H2 should be `30px`
- **MISMATCH:** H2 is currently `36px` but should be `30px`

**What should be standardized:** H2 should be `30px` (not `36px`)  
**Design token value to use:** `var(--typography-heading-lg-size)` (which is `30px`) instead of `var(--typography-heading-xl-size)`

---

### ❌ INCONSISTENCY 9: Body Text Size

**Component/Element:** Body text, paragraphs  
**Where it's inconsistent:**
- `src/css/base.css:135` - Uses `var(--typography-body-md-size)` which is `16px` ✅ CORRECT
- However, many CSS files have hardcoded `16px` values:
  - `src/css/components/header.css:536` - `font-size: 16px;`
  - `src/css/components/header.css:594` - `font-size: 16px;`
  - `src/css/loading-states.css:31` - `font-size: 16px;`
  - `src/css/loading-states.css:411` - `font-size: 16px;`

**What should be standardized:** All body text should use `var(--typography-body-md-size)`  
**Design token value to use:** `var(--typography-body-md-size)` (16px)

---

### ❌ INCONSISTENCY 10: Label Style Standardization

**Component/Element:** Form labels  
**Where it's inconsistent:**
- `src/css/components/form.css:12` - Uses `var(--typography-label-md-size)` which is `14px`
- User requirement states labels should be `uppercase, 12px`
- **MISMATCH:** Labels are `14px` but should be `12px` and uppercase

**What should be standardized:** Labels should be `12px`, uppercase, with proper letter spacing  
**Design token value to use:** 
- `var(--typography-label-sm-size)` (12px)
- `text-transform: uppercase;`
- `letter-spacing: var(--typography-label-sm-letter-spacing);`

---

### ❌ INCONSISTENCY 11: Hardcoded Font Sizes

**Component/Element:** Various components  
**Where it's inconsistent:**
- `src/css/components/header.css:589` - `font-size: 14px;`
- `src/css/components/sidebar.css:172` - `font-size: 14px;`
- `src/css/loading-states.css:87` - `font-size: 14px;`
- `src/css/loading-states.css:109` - `font-size: 12px;`
- `src/css/loading-states.css:120` - `font-size: 14px;`
- `src/css/loading-states.css:277` - `font-size: 14px;`
- `src/css/loading-states.css:317` - `font-size: 14px;`
- `src/css/loading-states.css:451` - `font-size: 14px;`
- `src/css/loading-states.css:458` - `font-size: 12px;`
- `src/css/loading-states.css:472` - `font-size: 11px;`
- `src/css/field-error.css:13` - `font-size: 14px;`
- `src/css/field-error.css:28` - `font-size: 14px;`
- `src/css/recently-viewed.css:25` - `font-size: 18px;`
- `src/css/recently-viewed.css:35` - `font-size: 12px;`
- `src/css/recently-viewed.css:77` - `font-size: 20px;`
- `src/css/recently-viewed.css:94` - `font-size: 14px;`
- `src/css/recently-viewed.css:104` - `font-size: 12px;`
- `src/css/recently-viewed.css:117` - `font-size: 14px;`
- `src/css/help-system.css:56` - `font-size: 24px;`
- `src/css/help-system.css:94` - `font-size: 14px;`
- `src/css/help-system.css:124` - `font-size: 14px;`
- `src/css/help-system.css:145` - `font-size: 18px;`
- `src/css/help-system.css:167` - `font-size: 14px;`
- `src/css/help-system.css:179` - `font-size: 14px;`
- `src/css/help-system.css:195` - `font-size: 20px;`
- `src/css/help-system.css:229` - `font-size: 12px;`
- `src/css/help-system.css:238` - `font-size: 14px;`
- `src/css/help-system.css:265` - `font-size: 14px;`
- `src/css/help-system.css:270` - `font-size: 14px;`
- `src/css/help-system.css:283` - `font-size: 18px;`
- `src/css/help-system.css:292` - `font-size: 12px;`
- `src/css/onboarding.css:77` - `font-size: 14px;`
- `src/css/onboarding.css:94` - `font-size: 64px;`
- `src/css/onboarding.css:100` - `font-size: 24px;`
- `src/css/onboarding.css:107` - `font-size: 16px;`
- `src/css/onboarding.css:189` - `font-size: 14px;`
- `src/css/onboarding.css:198` - `font-size: 12px;`

**What should be standardized:** All font sizes should use typography tokens  
**Design token values to use:**
- `14px` → `var(--typography-body-sm-size)` or `var(--typography-label-md-size)`
- `12px` → `var(--typography-label-sm-size)` or `var(--typography-caption-size)`
- `18px` → `var(--typography-body-lg-size)`
- `20px` → `var(--typography-heading-sm-size)`
- `24px` → `var(--typography-heading-md-size)`
- `11px` → `var(--typography-overline-size)`

---

### ❌ INCONSISTENCY 12: Font Weight Consistency

**Component/Element:** Various components  
**Where it's inconsistent:**
- `src/css/components/button.css:139` - `font-weight: 600;` (hardcoded)
- `src/css/components/button.css:182` - `font-weight: 500;` (hardcoded)
- Many components use hardcoded weights instead of tokens

**What should be standardized:** All font weights should use design tokens  
**Design token values to use:**
- `400` → `var(--font-weight-regular)` or `var(--primitive-font-weight-400)`
- `500` → `var(--font-weight-medium)` or `var(--primitive-font-weight-500)`
- `600` → `var(--font-weight-semibold)` or `var(--primitive-font-weight-600)`
- `700` → `var(--font-weight-bold)` or `var(--primitive-font-weight-700)`

---

## SPACING

### ❌ INCONSISTENCY 13: Hardcoded Padding Values

**Component/Element:** Various components  
**Where it's inconsistent:**
- `src/css/layout.css:205` - `padding: 24px;` (should be `var(--spacing-component-lg)`)
- `src/css/components/header.css:170` - `padding: 8px 12px 8px 36px;` (mixed values)
- `src/css/components/sidebar.css:139` - `padding: 12px 16px;` (should use tokens)
- `src/css/loading-states.css:38` - `padding: 16px;`
- `src/css/loading-states.css:80` - `padding: 16px;`
- `src/css/loading-states.css:117` - `padding: 8px 12px;`
- `src/css/loading-states.css:261` - `padding: 24px 24px 0;`
- `src/css/loading-states.css:272` - `padding: 20px 24px;`
- `src/css/loading-states.css:285` - `padding: 20px 24px 24px;`
- `src/css/loading-states.css:302` - `padding: 12px 16px;`
- `src/css/loading-states.css:314` - `padding: 4px 12px;`
- `src/css/loading-states.css:338` - `padding: 12px 16px;`
- `src/css/loading-states.css:399` - `padding: 16px;`
- `src/css/loading-states.css:427` - `padding: 12px 16px;`
- `src/css/loading-states.css:471` - `padding: 2px 6px;`
- `src/css/loading-states.css:482` - `padding: 12px 16px;`
- `src/css/field-error.css:8` - `padding: 8px 12px;`
- `src/css/field-error.css:31` - `padding: 8px 12px;`
- `src/css/recently-viewed.css:6` - `padding: 20px;`
- `src/css/recently-viewed.css:36` - `padding: 4px 8px;`
- `src/css/recently-viewed.css:56` - `padding: 12px;`
- `src/css/recently-viewed.css:115` - `padding: 24px;`
- `src/css/recently-viewed.css:128` - `padding: 10px;` (not 8px multiple!)
- `src/css/help-system.css:50` - `padding: 24px;`
- `src/css/help-system.css:65` - `padding: 8px;`
- `src/css/help-system.css:79` - `padding: 24px;`
- `src/css/help-system.css:92` - `padding: 12px 20px;`
- `src/css/help-system.css:121` - `padding: 12px 40px 12px 16px;`
- `src/css/help-system.css:161` - `padding: 16px;`
- `src/css/help-system.css:178` - `padding: 16px;`
- `src/css/help-system.css:219` - `padding: 12px;`
- `src/css/help-system.css:228` - `padding: 4px 8px;`
- `src/css/help-system.css:252` - `padding: 16px;`
- `src/css/help-system.css:290` - `padding: 8px 12px;`
- `src/css/help-system.css:313` - `padding: 10px 12px;` (not 8px multiple!)
- `src/css/onboarding.css:48` - `padding: 20px 24px;`
- `src/css/onboarding.css:78` - `padding: 4px 8px;`
- `src/css/onboarding.css:89` - `padding: 40px 24px;`
- `src/css/onboarding.css:117` - `padding: 20px 24px;`
- `src/css/onboarding.css:169` - `padding: 16px 20px;`
- `src/css/onboarding.css:197` - `padding: 2px 6px;`
- `src/css/onboarding.css:256` - `padding: 32px 20px;`

**What should be standardized:** All padding should use spacing tokens (8px multiples)  
**Design token values to use:**
- `2px` → `var(--primitive-space-2)`
- `4px` → `var(--primitive-space-4)`
- `6px` → `var(--primitive-space-6)` (if needed, but prefer 8px multiples)
- `8px` → `var(--primitive-space-8)`
- `12px` → `var(--primitive-space-12)`
- `16px` → `var(--primitive-space-16)` or `var(--spacing-component-md)`
- `20px` → `var(--primitive-space-20)`
- `24px` → `var(--primitive-space-24)` or `var(--spacing-component-lg)`
- `32px` → `var(--primitive-space-32)` or `var(--spacing-component-xl)`
- `40px` → `var(--primitive-space-40)`
- **Note:** `10px` is NOT an 8px multiple - should be `8px` or `12px`

---

### ❌ INCONSISTENCY 14: Hardcoded Margin Values

**Component/Element:** Various components  
**Where it's inconsistent:** Similar to padding, many margins use hardcoded values instead of tokens

**What should be standardized:** All margins should use spacing tokens  
**Design token values to use:** Same as padding tokens above

---

### ❌ INCONSISTENCY 15: Grid Gaps Not Uniform

**Component/Element:** Grid layouts, flex gaps  
**Where it's inconsistent:** Many components use hardcoded gap values

**What should be standardized:** All grid gaps should use spacing tokens  
**Design token values to use:** Same spacing tokens as above

---

## COMPONENTS

### ❌ INCONSISTENCY 16: Button Border Radius Variations

**Component/Element:** Buttons  
**Where it's inconsistent:**
- `src/css/components/button.css:12` - Base: `var(--radius-component-xl)` (12px)
- `src/css/components/button.css:84` - `.btn-xs`: `var(--radius-component-sm)` (4px)
- `src/css/components/button.css:91` - `.btn-sm`: `var(--radius-component-md)` (6px)
- `src/css/components/button.css:107` - `.btn-md`: `var(--radius-component-md)` (6px)
- `src/css/components/button.css:114` - `.btn-lg`: `var(--radius-component-lg)` (8px)
- `src/css/components/button.css:121` - `.btn-xl`: `var(--radius-component-lg)` (8px)

**What should be standardized:** Buttons should have consistent border radius  
**Design token value to use:** Standardize to `var(--radius-component-xl)` (12px) for all button sizes, or create consistent size-based radius system

---

### ❌ INCONSISTENCY 17: Card Shadow Variations

**Component/Element:** Cards  
**Where it's inconsistent:**
- `src/css/components/card.css:10-13` - Base card: Custom multi-layer shadow
- `src/css/components/card.css:82` - `.card-elevated`: `var(--elevation-medium)`
- `src/css/components/card.css:87` - `.card-elevated:hover`: `var(--elevation-high)`
- `src/css/components/card.css:253` - `.card-session:hover`: Custom shadow `0 8px 24px rgba(16, 201, 107, 0.15)`

**What should be standardized:** All cards should use elevation tokens  
**Design token values to use:**
- Default: `var(--elevation-low)` or `var(--elevation-medium)`
- Hover: `var(--elevation-high)`
- Elevated variant: `var(--elevation-high)` or `var(--elevation-highest)`

---

### ❌ INCONSISTENCY 18: Card Corner Radius

**Component/Element:** Cards  
**Where it's inconsistent:**
- `src/css/components/card.css:9` - Base: `var(--radius-component-xl)` (12px) ✅ CORRECT
- All card variants use `var(--radius-component-xl)` ✅ CORRECT

**What should be standardized:** Already standardized ✅  
**Design token value to use:** `var(--radius-component-xl)` (12px) ✅

---

### ❌ INCONSISTENCY 19: Form Input Styling

**Component/Element:** Form inputs  
**Where it's inconsistent:**
- `src/css/components/form.css:28` - Uses `var(--radius-component-xl)` (12px) ✅ CORRECT
- `src/css/components/form.css:27` - Border: `1.5px solid` (should check if consistent)
- `src/css/components/form.css:39-42` - Custom multi-layer shadow (should use elevation token)

**What should be standardized:** Form inputs should use consistent styling tokens  
**Design token values to use:**
- Border radius: `var(--radius-component-xl)` ✅ Already correct
- Shadow: Use `var(--elevation-low)` or create form-specific elevation token
- Border width: Standardize to `1px` or `1.5px` consistently

---

### ❌ INCONSISTENCY 20: Icon Library Consistency

**Component/Element:** Icons throughout HTML files  
**Where it's inconsistent:**
- HTML files use `data-lucide` attributes (Lucide icons) ✅ CORRECT
- Some inline styles specify icon sizes: `style="width: 16px; height: 16px;"`
- Icon sizes should be standardized

**What should be standardized:** Icon sizes should use consistent values  
**Design token values to use:**
- Small icons: `16px` (or create `--icon-size-sm` token)
- Medium icons: `20px` (or create `--icon-size-md` token)
- Large icons: `24px` (or create `--icon-size-lg` token)

---

## BORDERS & SHADOWS

### ❌ INCONSISTENCY 21: Card Border Consistency

**Component/Element:** Cards  
**Where it's inconsistent:**
- `src/css/components/card.css:8` - Base: `1px solid var(--color-border-secondary)` ✅ CORRECT
- `src/css/components/card.css:148` - `.card-session`: `1px solid var(--color-border-secondary)` ✅ CORRECT
- `src/css/components/card.css:269` - `.hero-card`: `2px solid rgba(16, 201, 107, 0.2)` ❌ Hardcoded

**What should be standardized:** All card borders should use consistent width and color tokens  
**Design token values to use:**
- Border width: `1px` (standard) or `2px` (accent) - create semantic tokens
- Border color: `var(--color-border-secondary)` or `var(--color-border-primary)`

---

### ❌ INCONSISTENCY 22: Shadow Depth Levels

**Component/Element:** All components with shadows  
**Where it's inconsistent:**
- Many components use custom shadow values instead of elevation tokens
- `src/css/components/button.css:134-138` - Custom multi-layer shadow
- `src/css/components/form.css:39-42` - Custom multi-layer shadow
- `src/css/components/card.css:10-13` - Custom multi-layer shadow
- `src/css/loading-states.css:250` - `box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);`
- `src/css/help-system.css:34` - `box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);`

**What should be standardized:** All shadows should use elevation tokens  
**Design token values to use:**
- `var(--elevation-low)` - Subtle shadows
- `var(--elevation-medium)` - Standard depth
- `var(--elevation-high)` - Prominent depth
- `var(--elevation-highest)` - Maximum depth (modals, dropdowns)

---

### ❌ INCONSISTENCY 23: Border Color Consistency

**Component/Element:** All components with borders  
**Where it's inconsistent:**
- `src/css/components/header.css:178` - `border-color: #10b981;` (hardcoded)
- `src/css/components/sidebar.css:115` - `color: #047857;` (hardcoded)
- `src/css/components/badge.css:36` - `border-color: rgba(16, 201, 107, 0.3);` (hardcoded rgba)
- `src/css/components/card.css:269` - `border: 2px solid rgba(16, 201, 107, 0.2);` (hardcoded)

**What should be standardized:** All border colors should use design tokens  
**Design token values to use:**
- `var(--color-border-primary)` - Standard borders
- `var(--color-border-secondary)` - Subtle borders
- `var(--color-border-strong)` - Strong borders
- `var(--color-border-interactive)` - Interactive element borders
- For rgba values: `rgba(var(--primitive-primary-rgb), 0.3)`

---

## SUMMARY OF CRITICAL ISSUES

### High Priority (Breaking Consistency)
1. **H2 size mismatch** - Currently 36px, should be 30px
2. **Label size/style mismatch** - Currently 14px, should be 12px uppercase
3. **Hardcoded colors** - 50+ instances of hardcoded hex colors
4. **Non-8px spacing** - Values like `10px` break the spacing system
5. **Shadow inconsistency** - Custom shadows instead of elevation tokens

### Medium Priority (Visual Consistency)
6. **Button border radius** - Varies by size
7. **Font weight hardcoding** - Should use tokens
8. **Icon size standardization** - Needs token system

### Low Priority (Code Quality)
9. **Dark mode token usage** - Could use primitives more consistently
10. **Fallback values** - Some tokens have unnecessary fallbacks

---

## RECOMMENDATIONS

1. **Create a migration script** to replace all hardcoded values with tokens
2. **Update base.css** to fix H2 and label typography
3. **Standardize button border radius** to one value or create size-based system
4. **Create icon size tokens** (`--icon-size-sm`, `--icon-size-md`, `--icon-size-lg`)
5. **Audit all shadows** and replace with elevation tokens
6. **Remove all hardcoded colors** and replace with design tokens
7. **Fix spacing values** that aren't 8px multiples (especially `10px`)

---

## DESIGN TOKEN REFERENCE

### Standard Values (from tokens.css)

**Colors:**
- Error: `var(--color-status-error)` = `#ef4444`
- Success: `var(--color-status-success)` = `#10c96b`
- Warning: `var(--color-status-warning)` = `#fbbf24`
- Info: `var(--color-status-info)` = `#0ea5e9`

**Typography:**
- H1: `var(--typography-display-md-size)` = `36px`
- H2: `var(--typography-heading-lg-size)` = `30px` (should be used, currently using xl)
- Body: `var(--typography-body-md-size)` = `16px`
- Label: `var(--typography-label-sm-size)` = `12px` (should be used, currently using md)

**Spacing (8px multiples):**
- `var(--primitive-space-8)` = `8px`
- `var(--primitive-space-12)` = `12px`
- `var(--primitive-space-16)` = `16px`
- `var(--primitive-space-20)` = `20px`
- `var(--primitive-space-24)` = `24px`
- `var(--spacing-component-md)` = `16px`
- `var(--spacing-component-lg)` = `24px`

**Border Radius:**
- `var(--radius-component-sm)` = `4px`
- `var(--radius-component-md)` = `6px`
- `var(--radius-component-lg)` = `8px`
- `var(--radius-component-xl)` = `12px`

**Shadows:**
- `var(--elevation-low)` = Subtle shadow
- `var(--elevation-medium)` = Standard shadow
- `var(--elevation-high)` = Prominent shadow
- `var(--elevation-highest)` = Maximum shadow

