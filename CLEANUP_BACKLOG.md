# Cleanup Backlog (FlagFit Pro)

Prioritized by impact vs effort. Verification: `npm test` unless noted.

## Active

1. **Align frontend HTTP** – Replace ad-hoc `fetch` with HttpClient/interceptors. Supabase client consolidation in progress.
2. **Move Supabase calls to services** – Components → feature services. Risk: High.
3. **Tighten `any` usage** – Replace with interfaces in today, wellness, ai-coach, playbook, data-import.
4. **Normalize error extraction** – Shared utility for error parsing in services/components.
5. **Reduce CSS overrides** – Migrate `angular/src/assets/styles/overrides/_exceptions.scss` to tokens/mixins. Risk: High.
6. **Retire deprecated design tokens** – Update consumers to current tokens.
7. **Unused exports** – Run madge/tsc on `angular/src/app/shared` to prune dead exports.

## Low-Priority

- ~~Confirm `angular/src/app/today/**` usage; remove if orphaned.~~ (folder removed)
