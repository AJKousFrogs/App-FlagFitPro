# E2E Tests - Playwright

This directory contains end-to-end tests for the FlagFit Pro application using Playwright.

## Test Files

- **`smoke.spec.ts`** - Basic smoke tests that verify the app shell loads correctly
- **`critical-flow-morning-training.spec.ts`** - Complete user journey test (login → onboarding → today's practice → morning training block)

## Prerequisites

1. Node.js 22+ installed
2. Application dependencies installed (`npm ci` in root and `angular/`)
3. Playwright browsers installed (`npx playwright install`)

## Running Tests Locally

### Setup

1. Install dependencies:

```bash
npm ci
cd angular && npm ci
```

2. Install Playwright browsers:

```bash
cd angular
npx playwright install chromium
```

3. Test credentials (defaults are set, optional to override):

```bash
# Default: aljkous@gmail.com / Futsal12!!!!
# Optional: override credentials
export TEST_USER_EMAIL="your-test-email@example.com"
export TEST_USER_PASSWORD="your-test-password"
```

### Run All Tests

```bash
cd angular
npx playwright test
```

### Run Specific Test Suites

**Smoke tests only:**

```bash
cd angular
npx playwright test e2e/smoke.spec.ts
```

**Critical flow test:**

```bash
cd angular
npx playwright test e2e/critical-flow-morning-training.spec.ts
```

### Run with UI Mode (Recommended for Development)

```bash
cd angular
npx playwright test --ui
```

### Run in Headed Mode (See Browser)

```bash
cd angular
npx playwright test --headed
```

### Debug Tests

```bash
cd angular
npx playwright test --debug
```

## Using npm Scripts

From the root directory:

```bash
# Run smoke tests
npm run test:e2e:smoke

# Run critical flow test
npm run test:e2e:critical

# Run all E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run in headed mode
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug
```

## Environment Variables

The tests use the following environment variables:

- `BASE_URL` - Base URL for the application (default: `http://localhost:4200`)
- `TEST_USER_EMAIL` or `E2E_TEST_EMAIL` - Test user email for login
- `TEST_USER_PASSWORD` or `E2E_TEST_PASSWORD` - Test user password for login
- `CI` - Set to `true` in CI environments (affects retries and reporting)

## Test Structure

### Smoke Test (`smoke.spec.ts`)

Quick tests to verify:

- App shell loads correctly
- Login page renders
- Unauthenticated redirect works

### Critical Flow Test (`critical-flow-morning-training.spec.ts`)

Complete user journey:

1. Visit app URL
2. Login with test credentials
3. Complete onboarding (happy path through all 9 steps)
4. Navigate to Today's Practice / Daily Training
5. Verify morning training block exists (Mobility + Foam Rolling)
6. Expand block and verify UI responds (checklist, timer, mark started)

## Stable Selectors

Tests use `data-testid` attributes for stable selectors. Key test IDs:

- `protocol-blocks` - Protocol blocks container
- `protocol-block-morning-mobility` - Morning mobility block
- `protocol-block-foam-rolling` - Foam rolling block
- `protocol-block-header` - Block header (expandable)
- `protocol-block-exercise-list` - Exercise list within block
- `exercise-item-{id}` - Individual exercise item
- `exercise-checkbox-{id}` - Exercise completion checkbox
- `nav-todays-practice` - Navigation link to Today's Practice

## CI/CD

Tests run automatically in GitHub Actions on:

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Manual workflow dispatch

The CI workflow:

1. Installs dependencies
2. Builds the application
3. Starts the server
4. Runs smoke tests
5. Runs critical flow tests
6. Uploads test reports and videos on failure

## Troubleshooting

### Tests fail with "Test credentials not provided"

Set the environment variables:

```bash
export TEST_USER_EMAIL="your-email@example.com"
export TEST_USER_PASSWORD="your-password"
```

### Tests timeout

- Ensure the dev server is running on `http://localhost:4200`
- Check that the application builds successfully
- Increase timeout in `playwright.config.ts` if needed

### Tests fail in CI but pass locally

- Check CI logs for specific errors
- Verify environment variables are set in GitHub Secrets
- Ensure the application builds correctly in CI
- Check that the server starts within the timeout period

### Selector not found errors

- Verify `data-testid` attributes are present in the component templates
- Check that components are rendered (may need to wait for async data)
- Use Playwright's UI mode to inspect the page state

## Best Practices

1. **Use data-testid attributes** - Prefer `data-testid` over CSS selectors for stability
2. **Wait for elements** - Use `waitFor` and `expect().toBeVisible()` instead of fixed timeouts
3. **Handle async operations** - Wait for network idle or specific UI states
4. **Keep tests independent** - Each test should be able to run in isolation
5. **Use helper functions** - Extract common patterns (login, dismiss banner) into reusable functions

## Reporting

Test reports are generated in `angular/playwright-report/`. View them with:

```bash
cd angular
npx playwright show-report
```
