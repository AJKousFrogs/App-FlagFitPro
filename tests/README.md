# FlagFit Pro Test Suite

This directory contains repo-level tests outside the Angular workspace.

## Main Test Areas

| Folder | Purpose |
| --- | --- |
| `tests/unit/` | isolated utility and handler tests |
| `tests/integration/` | backend, API, authorization, and data-flow validation |
| `tests/contracts/` | contract and invariance checks |
| `tests/e2e/` | repo-level Playwright scenarios |
| `tests/privacy-safety/` | privacy, consent, and deletion behavior |
| `tests/responsive/` | responsive and visual regression checks |
| `tests/security/` | auth and authorization checks |
| `tests/logic/` | pure logic regressions such as ACWR |

## Common Commands

From the repo root:

```bash
npm run test:unit
npm run test:backend
npm run test:e2e
npm run test:privacy
npm run test:acwr
npm run test:contracts
```

## Related Docs

- [../docs/DOCS_INDEX.md](../docs/DOCS_INDEX.md)
- [../angular/e2e/README.md](../angular/e2e/README.md)
- [privacy-safety/README.md](./privacy-safety/README.md)
