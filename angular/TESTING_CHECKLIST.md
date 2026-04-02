# Angular Testing Checklist

Use this checklist for workspace-level verification after meaningful Angular changes.

## Minimum Verification

- [ ] `npm run type-check`
- [ ] `npm run lint`
- [ ] `npm run build`

## UI And Styling Changes

- [ ] `npm run lint:css`
- [ ] `npm run lint:tokens`
- [ ] `npm run audit:scss-duplications`
- [ ] validate affected screens in the browser

## Routing Or Navigation Changes

- [ ] smoke test the changed routes
- [ ] verify route metadata still drives shell/header behavior correctly
- [ ] confirm there are no full page reloads for internal navigation

## PrimeNG Or Design System Changes

- [ ] verify shared wrappers still render correctly
- [ ] check responsive behavior on mobile and desktop
- [ ] confirm no new raw token drift or `.p-*` leakage was introduced

## Test Commands

```bash
npm run type-check
npm run lint
npm run build
cd angular && npm run test
cd angular && npm run e2e:smoke
```

Use the stricter E2E or visual commands only when the change needs them.
