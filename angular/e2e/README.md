# Angular Playwright E2E Guide

This folder contains Angular workspace Playwright tests.

## Run The Core Suites

```bash
cd angular
npm run e2e:smoke
npm run e2e:critical
npm run e2e:navigation
```

## Visual And Design-System Suites

```bash
cd angular
npm run e2e:design-system
npm run e2e:visual
npm run e2e:visual:mobile
npm run e2e:visual:tablet
```

## Before Running

- install dependencies in the repo root and `angular/`
- install Playwright browsers with `npx playwright install`
- run the app locally if the chosen command does not start it for you

For broader testing context, see [../TESTING_CHECKLIST.md](../TESTING_CHECKLIST.md) and [../../tests/README.md](../../tests/README.md).
