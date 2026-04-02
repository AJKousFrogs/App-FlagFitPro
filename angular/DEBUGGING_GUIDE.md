# Angular Debugging Guide

This guide reflects the current Angular workspace. It does not assume any deleted custom debug service.

## Primary Workflow

1. Run the app through the repo root when backend parity matters:

```bash
npm run dev
```

2. Use Angular-only mode when isolating UI or template issues:

```bash
cd angular
npm start
```

3. Verify before and after changes:

```bash
npm run type-check
npm run lint
npm run build
```

## Browser Debugging

Use standard browser tools first:

- Angular DevTools for component tree, signals, and router state
- Network tab for failed API and asset requests
- Console for runtime errors and warnings
- Elements panel for PrimeNG markup and CSS token inspection

## Angular-Specific Debugging

Focus on these locations:

- routing and shell state: `src/app/core/routes/`, `src/app/core/services/route-shell.service.ts`
- auth/session: `src/app/core/services/supabase.service.ts`
- global error handling: `src/app/core/services/angular-global-error-handler.service.ts`
- logging adapter: `src/app/core/logging/console-logger.adapter.ts`

## Common Checks

### Route Problems

- inspect route metadata in `src/app/core/routes/groups/`
- confirm the active route matches shell expectations
- verify guards return `UrlTree`s and do not navigate imperatively where avoidable

### Template And UI Problems

- run `npm run lint`
- run `npm run type-check`
- inspect PrimeNG wrappers before editing `.p-*` selectors directly
- prefer shared primitives and wrappers over one-off overrides

### Styling Problems

```bash
npm run lint:css
npm run lint:tokens
npm run audit:scss-duplications
```

### Accessibility And Navigation

```bash
cd angular
npm run audit:a11y
npm run e2e:smoke
```

## Build-Time Diagnostics

```bash
npm run type-check
npm run build
cd angular && npm run bundle:check
```

## When A Doc Seems Wrong

If this guide conflicts with the code:

1. trust the code
2. update this guide
3. update [../docs/DOCS_INDEX.md](../docs/DOCS_INDEX.md) if doc ownership changed
