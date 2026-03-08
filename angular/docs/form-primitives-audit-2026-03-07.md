# Shared Form Primitives Audit

Date: 2026-03-07

Action taken after audit:
- removed `app-date-range`
- removed `app-form-field`
- removed `app-rich-text`
- removed `app-toggle-switch`
- removed `app-signal-form`
- removed `app-time-picker`
- retained `app-date-picker`
- retained `app-form-input`

Scope:
- `app-date-picker`
- `app-date-range`
- `app-form-field`
- `app-form-input`
- `app-rich-text`
- `app-toggle-switch`
- `app-signal-form`

## Baseline

- Angular workspace version: `21.1.4`
- PrimeNG version: `21.1.1`
- Global form primitive source of truth: `src/scss/components/primitives/_forms.scss`

## Summary

These seven components are not currently mounted anywhere in `angular/src/app` outside their own declarations.

That means:
- they are not part of the active product surface
- they are not exercised by route smoke tests
- they currently behave like dormant design-system artifacts, not live primitives

None of the seven folders contain a local spec or story file either, so there is no direct component-level regression coverage.

## Repo usage result

Direct selector/class scan result:
- `app-date-picker`: no usages
- `app-date-range`: no usages
- `app-form-field`: no usages
- `app-form-input`: no usages
- `app-rich-text`: no usages
- `app-toggle-switch`: no usages
- `app-signal-form`: no usages

Evidence:
- the only matches for these selectors and component class names are their own component files
- there are no consumer imports under `src/app`

## Findings

### P0

1. `app-toggle-switch` does not honor reactive-form disabled state correctly.
- File: `src/app/shared/components/toggle-switch/toggle-switch.component.ts`
- Lines: `121-123`
- `setDisabledState()` is a no-op.
- The template only respects the `disabled()` input, not the forms API callback.
- If this component is used with `formControlName` or a CVA binding, Angular can disable the control without the UI actually disabling.
- Status: not production-safe as a ControlValueAccessor.

2. `app-rich-text` uses deprecated browser editing commands and ignores its own disabled input.
- File: `src/app/shared/components/rich-text/rich-text.component.ts`
- Lines:
  - disabled input declared: `155`
  - contenteditable hardcoded true: `118`
  - toolbar buttons always interactive: `50-112`
  - deprecated editing API: `233-239`
- `document.execCommand()` / `document.queryCommandState()` are legacy browser APIs and a poor base for a future-proof editor.
- The component declares `disabled = input<boolean>(false)` but never applies it to the editor surface or toolbar.
- Status: outdated implementation, not production-ready.

3. `app-form-input` has a keyboard accessibility bug on the password toggle.
- File: `src/app/shared/components/form-input/form-input.component.ts`
- Lines: `95-103`
- The password toggle button uses `tabindex="-1"`.
- That removes the toggle from keyboard navigation even though it is interactive.
- Status: accessibility regression if mounted.

### P1

4. `app-date-range` is not a real form control and cannot be externally controlled cleanly.
- File: `src/app/shared/components/date-range/date-range.component.ts`
- Lines:
  - template-driven binding: `57`, `84`
  - no CVA implementation anywhere in the file
  - internal-only state: `129-131`
  - output-only API: `143-145`
- The component uses internal signals and emits `rangeChange`, but it has no `writeValue()`, `registerOnChange()`, or external value inputs.
- That makes it inconsistent with the other reusable form controls and difficult to use in typed reactive forms.
- Status: conceptually incomplete for a reusable design-system field.

5. `app-form-field` and `app-form-input` duplicate the same responsibility.
- Files:
  - `src/app/shared/components/form-field/form-field.component.ts`
  - `src/app/shared/components/form-input/form-input.component.ts`
- `app-form-field` renders a generic `<input>`/`<textarea>` shell from a `config()` object.
- `app-form-input` renders a richer text/password input with labels, feedback, and validation states.
- Both overlap with the global form primitive system in `src/scss/components/primitives/_forms.scss`.
- Status: duplicated abstraction, unclear canonical primitive.

6. `app-signal-form` is a demo component, not an app primitive.
- File: `src/app/shared/components/signal-form/signal-form.component.ts`
- Lines: `40-175`
- It hardcodes a sample registration form inside a `p-card`.
- It uses legacy PrimeNG utility classes like `p-field`, `mb-3`, `p-error`, and `p-text-secondary` instead of the app’s current form primitives.
- It duplicates validation concerns already covered by the actual shared field layer.
- Status: dead demo code, not a reusable component.

7. `app-form-field` and `app-form-input` generate invalid/weak id behavior by default.
- Files:
  - `src/app/shared/components/form-field/form-field.component.ts`
  - `src/app/shared/components/form-input/form-input.component.ts`
- Lines:
  - `fieldId = input<string>("")`: `form-field.component.ts:119`
  - `inputId = input<string>("")`: `form-input.component.ts` top input section
- If mounted without an explicit id, labels and `aria-describedby` relationships can degrade or collide.
- Status: weak default contract.

### P2

8. `app-date-picker`, `app-date-range`, `app-rich-text`, and `app-toggle-switch` use `Math.random().toString(36).substr(...)` for ids.
- Files:
  - `date-picker.component.ts:79`
  - `date-range.component.ts:116`
  - `rich-text.component.ts:151`
  - `toggle-switch.component.ts:80`
- `substr()` is legacy JS.
- This is not a production break by itself, but it is stale implementation detail.

9. `app-date-picker` is the only component in this set that is reasonably close to keepable.
- File: `src/app/shared/components/date-picker/date-picker.component.ts`
- It is a thin PrimeNG wrapper with CVA support and correct disabled-state propagation.
- Its main issues are:
  - unused in the app
  - no tests
  - stale random id generation
- Status: keepable if the product needs it; otherwise still dead code.

10. None of these components have direct tests or stories.
- Files present in each folder: only `.ts` and `.scss`
- No `*.spec.ts`
- No `*.stories.ts`
- Status: unverified dormant code.

## Component-by-component verdict

| Component | Mounted | Latest Angular style | Production-safe today | Dead code | Recommendation |
| --- | --- | --- | --- | --- | --- |
| `app-date-picker` | No | Mostly yes | Mostly yes | Yes | Keep only if you plan to mount it soon; otherwise remove |
| `app-date-range` | No | Partial | No | Yes | Rewrite as CVA or remove |
| `app-form-field` | No | Partial | Technically usable, but redundant | Yes | Remove and keep `app-form-input` or the global field primitives |
| `app-form-input` | No | Mostly yes | Not quite, due to a11y/id issues | Yes | Keep only if you formalize it as the canonical input wrapper |
| `app-rich-text` | No | Partial | No | Yes | Replace or remove |
| `app-toggle-switch` | No | Partial | No, CVA disabled bug | Yes | Fix or remove |
| `app-signal-form` | No | Syntax yes, design-system no | No | Yes | Remove |

## Recommended action

### Best lean-path

Remove these as dormant code unless there is a near-term plan to mount them:
- `app-date-range`
- `app-form-field`
- `app-rich-text`
- `app-toggle-switch`
- `app-signal-form`

Then decide whether to keep:
- `app-date-picker`
- `app-form-input`

Those are the only two with a plausible case to become canonical primitives later.

### If you want to keep them

1. `app-date-picker`
- replace legacy id generation
- add a focused spec

2. `app-date-range`
- convert to a real ControlValueAccessor
- add external value support
- remove template-driven `ngModel`

3. `app-form-field`
- either delete it or reduce it to a pure layout shell
- do not keep both `app-form-field` and `app-form-input` as competing field primitives

4. `app-form-input`
- generate a safe default id
- make password toggle keyboard reachable
- add a spec

5. `app-rich-text`
- replace the editing implementation entirely
- do not build future editor work on `execCommand`

6. `app-toggle-switch`
- implement `setDisabledState()` properly
- add a focused CVA spec

7. `app-signal-form`
- delete it unless you explicitly want a docs/demo surface

## Bottom line

These components are not active product code.

They are a dormant form-primitive layer with:
- zero live usages
- zero local tests
- duplicated responsibilities
- several concrete implementation bugs

The correct decision is not “leave them because they compile.”

The correct decision is:
- either delete them to lean the repo
- or formally adopt and fix the two worth keeping
