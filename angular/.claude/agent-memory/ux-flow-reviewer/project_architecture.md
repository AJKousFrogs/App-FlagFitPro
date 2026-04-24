---
name: FlagFit Pro Angular Architecture
description: Core conventions for the FlagFit Pro Angular app — auth, state, component patterns
type: project
---

Angular 17+ with signals throughout. `ChangeDetectionStrategy.OnPush` on every component.
State is managed via signals (`signal()`, `computed()`) with `NonNullableFormBuilder` for forms.
Auth is Supabase PKCE + hash-fragment fallback. Auth callback is `/auth/callback`.
Design system uses PrimeNG components overlaid with custom design tokens (`--ds-*`, `--space-*`).
Shared components live in `src/app/shared/components/`.
Feature services injected via `inject()` in constructors (no constructor DI).
`takeUntilDestroyed(this.destroyRef)` used on all subscriptions.
Router uses `navigateByUrl` for resolved destinations, `navigate` for fixed routes.
Toast notifications via `ToastService` (success/warn/error/info).
`AuthFlowDataService` is the single orchestrator for all post-auth redirects and onboarding checks.

**Why:** Understanding these patterns is essential for judging whether a mutation needs `markForCheck`, whether a boolean state will fail to trigger CD, and whether redirect logic will behave correctly.
**How to apply:** When reviewing components, check: are dialog/state booleans signals? Are async mutations awaited before `isLoading.set(false)`? Does `resolvePostAuthRedirect` handle null users?
