# SCSS Sources of Truth

- Tokens: `angular/src/scss/tokens/design-system-tokens.scss` is the single source of truth for CSS custom properties.
- Global entrypoint: `angular/src/styles.scss` is the only stylesheet wired in `angular.json`.
- PrimeNG theming hook: `angular/src/scss/components/index.scss` (imports `primeng-integration.scss` and `primeng-theme.scss`) is pulled in by `styles.scss`.
- Generated CSS: `src/css/**` is build output from `npm run sass:compile` / `npm run build:css` and must not be edited or imported by source files.
