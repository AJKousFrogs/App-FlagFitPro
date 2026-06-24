# Angular Testing Checklist

Use this after meaningful Angular changes. Commands marked **(root)** run from the repo root; the rest run from `angular/`.

## Minimum Verification

- [ ] `npm run type-check` — TypeScript (no emit)
- [ ] `npm run lint` — ESLint
- [ ] `npm run build` — production build

## UI And Styling Changes

Run from repo root:

- [ ] `npm run lint:css` — Stylelint (errors block CI)
- [ ] `npm run lint:tokens` — token usage audit
- [ ] `npm run audit:scss-duplications` — SCSS duplication check
- [ ] Validate affected screens in the browser

## Routing Or Navigation Changes

- [ ] Smoke-test the changed routes end-to-end
- [ ] Verify route metadata still drives shell/header correctly
- [ ] Confirm no full page reloads for internal navigation

## Design System Changes

- [ ] Verify `_tokens.scss` custom properties still resolve (no undefined `var(--…)`)
- [ ] Check responsive behavior on mobile and desktop
- [ ] Run `npm run lint:css` (root) to catch new token drift

## Test Commands

```bash
# From angular/
npm run type-check
npm run lint
npm run build
npm run test
npm run e2e:smoke

# From repo root
npm run lint:css
npm run lint:tokens
npm run audit:scss-duplications
npm run test:unit:backend   # backend Vitest suite
```

Use the stricter E2E suites (`e2e:critical`, `e2e:navigation`, `e2e:visual`) only when the change needs them — see [`e2e/README.md`](./e2e/README.md).
