# Design Token Changelog

All notable changes to the design token system will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added
- Initial token structure created (Decision 64)
- PrimeNG token mapping (`primeng/_token-mapping.scss`)
- PrimeNG brand overrides (`primeng/_brand-overrides.scss`)
- Component primitives: cards, forms, tables, dialogs, feedback

### Changed
- Layer name in `primeng-theme.scss`: `@layer primeng-theme` → `@layer primeng-brand`
- Removed hex fallbacks from all component files

### Deprecated
- `_theme.scss` - Removed (was just a redirect to design-system-tokens.scss)

### Removed
- `_theme.scss` - Deleted as part of Phase E cleanup
- 397 hex color violations fixed (from 456 to 59 documented exceptions)

---

## [1.0.0] - 2026-01-02

### Added
- Initial design system tokens from `design-system-tokens.scss`
- Spacing scale: `--space-1` through `--space-12`
- Radius scale: `--radius-sm` through `--radius-full`
- Typography scale: `--font-body-*` and `--font-heading-*`
- Color tokens: `--ds-primary-green`, semantic colors
- Border tokens: `--border-1`, `--border-2`, semantic border colors
- Shadow tokens: `--shadow-0` through `--shadow-3`
- Motion tokens: `--motion-fast`, `--motion-base`, `--motion-slow`
- Z-index tokens: `--z-dropdown`, `--z-modal`, `--z-toast`, `--z-tooltip`
- Control sizing tokens: `--control-height-sm/md/lg`

### Migration Notes
- All new code must use tokens from this file
- Hex colors only allowed in `design-system-tokens.scss`
- See `DESIGN_SYSTEM_RULES.md` for full governance

---

## Token Deprecation Process

When deprecating a token:
1. Add `@deprecated` comment with:
   - Replacement token
   - Owner
   - Removal quarter
   - Ticket number
2. Update this changelog
3. Ensure zero usages before removal

Example:
```scss
/* @deprecated Q2 2026 - Use --color-surface-primary instead
 * Owner: @design-system-team
 * Ticket: DS-1234
 */
--old-background-color: var(--color-surface-primary);
```
