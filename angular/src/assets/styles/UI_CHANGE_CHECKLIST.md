# UI Change Checklist

> **Required for all UI pull requests.**  
> See `DESIGN_SYSTEM_RULES.md` for full documentation.

## Pre-Commit Checks

### Automated Linting

- [ ] Stylelint passes (`npm run lint:css`)
- [ ] Design system checks pass (`npm run lint:ds`)
- [ ] TypeScript/Angular lint passes (`npm run lint`)

### Token Compliance (Decision 1-4)

- [ ] No hex colors outside `design-system-tokens.scss`
- [ ] No raw spacing values (use `var(--space-*)`)
- [ ] No raw radius values (use `var(--radius-*)`)
- [ ] No raw font-size values (use `var(--font-*-*)`)
- [ ] No raw shadow values (use `var(--shadow-*)`)
- [ ] No raw z-index values (use `var(--z-*)`)

### CSS Rules (Decision 7, 19, 22)

- [ ] No `transition: all` (specify properties)
- [ ] No `::ng-deep` outside overrides layer (or documented exception)
- [ ] No `!important` outside overrides layer (or documented exception)
- [ ] No `.p-*` selectors in feature SCSS (only in primeng/ folder)

---

## Accessibility Checks

### Keyboard (Decision 36)

- [ ] All interactive elements have `:focus-visible` state
- [ ] Tab order is logical (no traps, skip disabled)
- [ ] Focus ring is visible (3px, not clipped)

### Dialogs/Modals (Decision 25)

- [ ] Focus moves to dialog on open
- [ ] Focus is trapped within dialog
- [ ] ESC key closes dialog (unless destructive confirm)
- [ ] Focus returns to trigger on close

### Forms (Decision 32, 54)

- [ ] Validation timing: blur + submit (not keystroke)
- [ ] One error message per field
- [ ] Error summary at top for long forms
- [ ] Scroll to first error on submit

### Color & Contrast (Decision 12)

- [ ] WCAG AA contrast ratios maintained
- [ ] Information not conveyed by color alone
- [ ] Status indicators have text/icon + color

---

## Responsive Checks (Decision 35)

### Breakpoints

- [ ] Mobile (≤480px): Layout works, touch targets ≥44px
- [ ] Tablet (≤768px): Grid collapses correctly
- [ ] Desktop (≤1024px): Full layout renders
- [ ] Wide (>1024px): Max-width constraints applied

### Touch Devices (Decision 52)

- [ ] Hover states only on `(hover: hover) and (pointer: fine)`
- [ ] No "stuck" hover states on touch
- [ ] Minimum touch target: 44×44px

---

## Internationalization (Decision 56-61)

### Text & Layout

- [ ] No fixed widths on labels, buttons, tabs
- [ ] Truncation tested with long text
- [ ] Tooltips work for truncated content

### Japanese (CJK) Ready

- [ ] Font fallback stack includes JP fonts
- [ ] Line-height appropriate for CJK text
- [ ] No negative letter-spacing on headings (JP-safe)

---

## Motion (Decision 19, 51)

- [ ] Transitions use `var(--motion-*)` tokens
- [ ] `prefers-reduced-motion: reduce` respected
- [ ] No layout shift on animations

---

## Component-Specific

### Cards (Decision 14, 45)

- [ ] Border-first styling (border + shadow-1)
- [ ] Hover: shadow-2 (Policy A)
- [ ] Interactive cards have focus-visible

### Buttons (Decision 9)

- [ ] Default radius: `var(--radius-lg)`
- [ ] Pill only when `[rounded]="true"` intentional
- [ ] Raised only for 1 primary CTA per view

### Tables (Decision 24)

- [ ] Using `.table-default` or `.table-compact`
- [ ] Empty state includes action or explanation
- [ ] Responsive: horizontal scroll or stack on mobile

### Toasts/Feedback (Decision 26)

- [ ] Success: auto-dismiss (3s)
- [ ] Errors/Warnings: sticky until dismissed
- [ ] Position: top-right

---

## Exception Process (Decision 10)

If you **must** break a design system rule:

1. [ ] Create a ticket (DS-XXX)
2. [ ] Add exception to `overrides/_exceptions.scss`
3. [ ] Include all required fields:
   - Ticket number
   - Owner (@username)
   - Scope (specific component)
   - Remove-by date
   - Reason

---

## Quick Commands

```bash
# Run all linting
npm run lint:all

# Run CSS linting only
npm run lint:css

# Run design system checks
npm run lint:ds

# Fix auto-fixable CSS issues
npm run lint:css:fix
```

---

## PR Template Snippet

```markdown
## UI Changes

### Checklist
- [ ] Stylelint passes
- [ ] Design system checks pass
- [ ] Keyboard accessible
- [ ] Mobile responsive
- [ ] No design system exceptions (or documented)

### Screenshots
| Before | After |
|--------|-------|
| | |
```
