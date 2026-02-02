# ESLint Console/Alert Exceptions

The lint policy now treats `angular/src/app/**` as the single source of truth for runtime code, so `no-console`/`no-alert` are errors everywhere in the app. The handful of remaining console usages are explicitly exempted until the foundational logging improvements are in place:

| Path                                                      | Why it’s exempt                                                                                                                                                 | Next steps                                                                                                                                                      |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `angular/src/app/core/constants/constants-validation.ts`  | Runs during bootstrap before the dependency-injection graph and `LoggerService` are available, so it uses `console.error` to surface fatal validation failures. | 1) Introduce a bootstrap-safe logger or `APP_INITIALIZER` that can emit validation failures through the normal logging stack.                                   |
| `angular/src/app/core/services/supabase-debug.service.ts` | Intentionally dispatches Supabase diagnostics (e.g., `console.group*`) before lower-level services can be hydrated and while debugging deep stack traces.       | 2) Funnel diagnostics through a temporary `SupabaseDebugLogWriter` (or similar) that delegates to `LoggerService`/`DebugService` once initialization completes. |

### Plan to Remove the Exceptions

1. Provide a bootstrap-level logging helper (or `APP_INITIALIZER`) so `constants-validation.ts` can rely on the same logger as the rest of the app.
2. Update `SupabaseDebugService` to route all diagnostics through a `SupabaseDebugLogWriter` that can defer to `LoggerService`/`DebugService` once the Angular zone is ready.
3. Remove the file-specific ESLint overrides so `no-console`/`no-alert` are enforced everywhere in `src/app/**`.
