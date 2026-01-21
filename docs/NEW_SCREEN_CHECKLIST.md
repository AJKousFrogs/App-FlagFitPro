# New Screen Checklist

**Use this checklist when creating a new screen/feature**

---

## ✅ Layout & Structure

- [ ] Uses `app-main-layout` wrapper
- [ ] Uses `app-page-header` component
- [ ] Consistent spacing using design tokens (`--space-*`)
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Proper heading hierarchy (h1 → h2 → h3)

---

## ✅ Forms

- [ ] All inputs use PrimeNG components (`InputText`, `Select`, etc.)
- [ ] All inputs have `<label>` elements with `for` attribute
- [ ] PrimeNG Select/InputNumber use `inputId` (NOT `id`)
- [ ] All Select/InputNumber have `aria-label` attributes
- [ ] Error messages use `p-error` class with `role="alert"`
- [ ] Validation uses `p-invalid` class on inputs
- [ ] Help text uses `p-field-hint` class
- [ ] Form fields wrapped in `<div class="field">` for spacing

---

## ✅ Buttons

- [ ] Uses `app-button` component (not native `<button>`)
- [ ] Icon-only buttons have `ariaLabel` attribute
- [ ] Loading states use `[loading]` prop
- [ ] Button variants are consistent (`primary`, `secondary`, `text`, etc.)

---

## ✅ Accessibility

- [ ] All form inputs have labels
- [ ] Icon-only buttons have `aria-label`
- [ ] Images have `alt` text
- [ ] Error messages have `role="alert"`
- [ ] Interactive elements are keyboard accessible
- [ ] Focus indicators are visible
- [ ] ARIA attributes are correct (`aria-invalid`, `aria-describedby`, etc.)

---

## ✅ Styling

- [ ] Uses design tokens (no hardcoded colors/spacing)
- [ ] Follows spacing scale (4px base unit)
- [ ] Uses Pass Through API for component customization (not `::ng-deep`)
- [ ] Consistent form field sizing
- [ ] Mobile responsive

---

## ✅ Performance

- [ ] Uses `OnPush` change detection
- [ ] Uses signals for reactive state
- [ ] Large lists use virtual scrolling (if 100+ items)
- [ ] Heavy components are lazy loaded (`@defer`)
- [ ] Images use `appMobileOptimized` directive

---

## ✅ PrimeNG Patterns

- [ ] Dialogs use `app-modal` or PrimeNG `Dialog`
- [ ] Toasts use `ToastService` (not component directly)
- [ ] Tables use `DataTable` with pagination/virtual scrolling
- [ ] Cards use PrimeNG `Card` component
- [ ] Overlays use PrimeNG components (OverlayPanel, etc.)

---

## ✅ Testing

- [ ] Accessibility audit passes (`npm run audit:a11y`)
- [ ] E2E tests pass (`npm run e2e`)
- [ ] Keyboard navigation works
- [ ] Screen reader tested (optional but recommended)

---

## 📝 Example: Complete Form Field

```html
<div class="field">
  <label for="email-input" class="block mb-2">
    Email
    <span class="text-red-500" aria-label="required">*</span>
  </label>
  <input
    pInputText
    id="email-input"
    type="email"
    [(ngModel)]="email"
    [class.p-invalid]="!!emailError"
    [attr.aria-invalid]="!!emailError"
    [attr.aria-required]="true"
    [attr.aria-describedby]="emailError ? 'email-error' : null"
  />
  @if (emailError) {
    <small id="email-error" class="p-error" role="alert">
      <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
      {{ emailError }}
    </small>
  }
</div>
```

---

## 📚 References

- [Design System Guide](./PRIMENG_DESIGN_SYSTEM.md)
- [Contributing Guide](./CONTRIBUTING.md)
- [Migration Guide](./PRIMENG_MIGRATION_GUIDE.md)
