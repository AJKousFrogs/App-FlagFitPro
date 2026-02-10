# ESLint Console/Alert Exceptions

The lint policy now treats `angular/src/app/**` as the single source of truth for runtime code, so `no-console`/`no-alert` are errors everywhere in the app. The handful of remaining console usages are explicitly exempted until the foundational logging improvements are in place:

| Path                                                      | Why it’s exempt                                                                                                                                                 | Next steps                                                                                                                                                      |
| --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `angular/src/app/core/constants/constants-validation.ts`  | Runs during bootstrap before the dependency-injection graph and `LoggerService` are available, so it uses `console.error` to surface fatal validation failures. | 1) Introduce a bootstrap-safe logger or `APP_INITIALIZER` that can emit validation failures through the normal logging stack.                                   |

### Plan to Remove the Exceptions

1. Provide a bootstrap-level logging helper (or `APP_INITIALIZER`) so `constants-validation.ts` can rely on the same logger as the rest of the app.
2. Remove the file-specific ESLint overrides so `no-console`/`no-alert` are enforced everywhere in `src/app/**`.
