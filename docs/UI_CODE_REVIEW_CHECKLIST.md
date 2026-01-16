# UI Code Review Checklist

> **Quick reference for PR reviews involving UI changes**  
> Full spec: [UI_CANONICAL_DEFAULTS.md](./UI_CANONICAL_DEFAULTS.md)

---

## 🎯 Quick Reject Criteria

**Reject PR immediately if any of these are present:**

- [ ] ❌ `border-radius: 9999px` or `50%` on buttons
- [ ] ❌ Raw pixel values for spacing (`padding: 12px`)
- [ ] ❌ Raw hex colors (`#089949` instead of `var(--ds-primary-green)`)
- [ ] ❌ `--border-radius` token (deprecated, use `--radius-lg`)
- [ ] ❌ Black/dark text on green backgrounds
- [ ] ❌ Raw z-index numbers (`z-index: 100`)

---

## ✅ Card Checklist

```
□ border-radius: var(--radius-lg)           ← 8px, NOT pill
□ box-shadow: var(--shadow-sm)              ← resting state
□ hover box-shadow: var(--shadow-md)        ← elevated
□ hover transform: translateY(-1px)         ← subtle lift only
□ .p-card-body padding: var(--space-4)      ← 16px
□ .p-card-content padding: 0                ← reset default
```

---

## ✅ Button Checklist

```
□ border-radius: var(--radius-button)       ← 8px rectangular
□ Primary CTA uses variant="primary"        ← solid green
□ Text on green = white                     ← var(--color-text-on-primary)
□ NO pill shapes (9999px, 50%, radius-full) ← FORBIDDEN
```

---

## ✅ Spacing Checklist

```
□ All padding/margin use var(--space-*)     ← 8-point grid
□ Section gaps: var(--space-6)              ← 24px between sections
□ Component gaps: var(--space-3/4)          ← 12-16px internal
□ Card internal: var(--space-4)             ← 16px
□ Stat cards: var(--space-3)                ← 12px (tighter)
```

---

## ✅ Typography Checklist

```
□ Uses --font-size-* or --font-body-* tokens
□ Stat values: --font-size-metric-md (24px bold)
□ Stat labels: --font-size-caption + uppercase + letter-spacing
□ Card titles: --font-size-h2 (18px semibold)
□ NO raw font-size pixel values
```

---

## ✅ Colors Checklist

```
□ Uses var(--color-*) or var(--ds-primary-green)
□ NO raw hex colors
□ Green backgrounds → white text only
□ White backgrounds → green or black text
```

---

## ✅ Shadows & Effects Checklist

```
□ Uses var(--shadow-sm/md/lg/xl) tokens
□ NO raw box-shadow values
□ Hover shadows use var(--shadow-md)
```

---

## ✅ z-index Checklist

```
□ Uses var(--z-index-*) tokens
□ NO raw numbers like z-index: 100
□ Follows z-index hierarchy:
  - base: 1
  - dropdown: 1000
  - modal: 1050
  - tooltip: 1070
```

---

## ✅ Transitions Checklist

```
□ Uses var(--transition-*) or var(--motion-*) tokens
□ Card hover: 0.15s ease (fast)
□ NO raw duration values
```

---

## ✅ Empty States Checklist

```
□ Uses <p-message severity="info"> for inline
□ Icon with opacity: 0.7
□ Text: var(--font-body-sm)
□ Full-width: width: 100%
```

---

## ✅ Accessibility Checklist

```
□ Focus states use var(--focus-ring-*) tokens
□ :focus-visible has visible outline
□ Touch targets ≥ 44px
□ Interactive elements are keyboard accessible
```

---

## ✅ PrimeNG Override Checklist

```
□ No ::ng-deep usage (fully removed from codebase)
□ Uses styleClass prop where possible
□ Uses CSS custom properties for theming
□ Does NOT override PrimeNG internals unnecessarily
□ Follows PrimeNG design token patterns
```

---

## 📋 Copy-Paste PR Comment

```markdown
## UI Review Checklist

### Cards

- [ ] Radius: `var(--radius-lg)`
- [ ] Shadow: `var(--shadow-sm)` / hover `var(--shadow-md)`
- [ ] Hover: `translateY(-1px)`

### Buttons

- [ ] Radius: `var(--radius-button)` (NOT pill)
- [ ] Primary CTA: `variant="primary"`

### Tokens

- [ ] Spacing: `var(--space-*)`
- [ ] Colors: `var(--color-*)` or `var(--ds-primary-green)`
- [ ] Typography: `var(--font-*)`
- [ ] Shadows: `var(--shadow-*)`
- [ ] z-index: `var(--z-index-*)`

### Accessibility

- [ ] Focus states visible
- [ ] Touch targets ≥ 44px
```

---

## 🔴 Common Violations to Watch For

| Violation        | Wrong                       | Correct                   |
| ---------------- | --------------------------- | ------------------------- |
| Pill buttons     | `border-radius: 9999px`     | `var(--radius-button)`    |
| Raw spacing      | `padding: 12px`             | `var(--space-3)`          |
| Deprecated token | `--border-radius`           | `var(--radius-lg)`        |
| Raw shadow       | `box-shadow: 0 4px 12px...` | `var(--shadow-md)`        |
| Raw color        | `#089949`                   | `var(--ds-primary-green)` |
| Big hover lift   | `translateY(-4px)`          | `translateY(-1px)`        |
| Raw z-index      | `z-index: 999`              | `var(--z-index-modal)`    |

---

## 📊 Token Quick Reference

| Category    | Token Pattern                                  | Example                             |
| ----------- | ---------------------------------------------- | ----------------------------------- |
| Spacing     | `--space-{1-24}`                               | `var(--space-4)` → 16px             |
| Radius      | `--radius-{sm,md,lg,xl}`                       | `var(--radius-lg)` → 8px            |
| Shadow      | `--shadow-{sm,md,lg,xl}`                       | `var(--shadow-sm)`                  |
| Font Size   | `--font-size-{h1-h4}`                          | `var(--font-size-h2)` → 18px        |
| Font Size   | `--font-body-{sm,md,lg}`                       | `var(--font-body-sm)` → 14px        |
| Font Weight | `--font-weight-{regular,medium,semibold,bold}` | `var(--font-weight-semibold)` → 600 |
| Color       | `--color-{brand,text,status}-*`                | `var(--color-brand-primary)`        |
| z-index     | `--z-index-{base,dropdown,modal,tooltip}`      | `var(--z-index-modal)` → 1050       |

---

_Last updated: January 4, 2026_
