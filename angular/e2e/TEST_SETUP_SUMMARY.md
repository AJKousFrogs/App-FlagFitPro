# E2E Test Setup Summary

## ✅ Completed Tasks

### 1. Test Files Created

- ✅ `smoke.spec.ts` - Basic smoke test that verifies app shell renders
- ✅ `critical-flow-morning-training.spec.ts` - Complete critical flow test

### 2. Data-TestID Attributes Added

- ✅ `protocol-blocks` - Protocol blocks container
- ✅ `protocol-block-morning-mobility` - Morning mobility block
- ✅ `protocol-block-foam-rolling` - Foam rolling block
- ✅ `protocol-block-header` - Block header (expandable)
- ✅ `protocol-block-exercise-list` - Exercise list
- ✅ `exercise-item-{id}` - Individual exercise items
- ✅ `exercise-checkbox-{id}` - Exercise checkboxes
- ✅ `nav-todays-practice` - Navigation link (via sidebar)

### 3. Playwright Configuration

- ✅ Updated `angular/playwright.config.ts` with:
  - CI/local compatibility
  - Proper timeouts and retries
  - Reporter configuration for CI
  - Single browser (chromium) in CI, multiple locally

### 4. CI/CD Integration

- ✅ Created `.github/workflows/e2e-tests.yml`:
  - Runs on push/PR to main/develop
  - Runs smoke tests first
  - Runs critical flow tests
  - Uploads reports and videos on failure
  - Uses GitHub Secrets for test credentials

### 5. npm Scripts

- ✅ Added to root `package.json`:
  - `test:e2e:smoke` - Run smoke tests
  - `test:e2e:critical` - Run critical flow test
  - Updated existing `test:e2e` commands

### 6. Documentation

- ✅ Created `angular/e2e/README.md` with:
  - Setup instructions
  - Running tests locally
  - Environment variables
  - Troubleshooting guide

## Test Coverage

### Smoke Test (`smoke.spec.ts`)

- ✅ App shell loads
- ✅ Login page renders
- ✅ Unauthenticated redirect works

### Critical Flow Test (`critical-flow-morning-training.spec.ts`)

- ✅ Visit app URL
- ✅ Login with test credentials
- ✅ Complete onboarding (all 9 steps)
- ✅ Navigate to Today's Practice
- ✅ Verify morning mobility block exists
- ✅ Verify foam rolling block exists
- ✅ Expand block and verify UI responds
- ✅ Verify checklist/checkboxes present
- ✅ Mark exercise as started/complete

## Files Modified

1. `angular/e2e/smoke.spec.ts` - Created
2. `angular/e2e/critical-flow-morning-training.spec.ts` - Created
3. `angular/playwright.config.ts` - Updated
4. `angular/src/app/features/today/today.component.html` - Added data-testid
5. `angular/src/app/features/training/daily-protocol/components/protocol-block.component.ts` - Added data-testid
6. `angular/src/app/shared/components/sidebar/sidebar.component.ts` - Added data-testid
7. `package.json` - Added npm scripts
8. `.github/workflows/e2e-tests.yml` - Created
9. `angular/e2e/README.md` - Created

## Running Tests

### Locally

```bash
# Setup
cd angular
npm ci
npx playwright install chromium

# Default credentials: aljkous@gmail.com / Futsal12!!!!
# Optional: override credentials
export TEST_USER_EMAIL="your-email@example.com"
export TEST_USER_PASSWORD="your-password"

# Run tests
npm run test:e2e:smoke          # Smoke tests only
npm run test:e2e:critical       # Critical flow only
npm run test:e2e                # All tests
```

### In CI

Tests run automatically on push/PR. Ensure GitHub Secrets are set:

- `E2E_TEST_EMAIL` - Test user email
- `E2E_TEST_PASSWORD` - Test user password

## Next Steps

1. **Set up GitHub Secrets** for CI:
   - Go to repository Settings → Secrets and variables → Actions
   - Add `E2E_TEST_EMAIL` and `E2E_TEST_PASSWORD`

2. **Create test account** in your database:
   - Use the credentials from `database/seed-test-account.sql` or create a dedicated test account
   - Ensure the account can complete onboarding

3. **Run tests locally** to verify everything works:

   ```bash
   npm run test:e2e:smoke
   npm run test:e2e:critical
   ```

4. **Monitor CI runs** after pushing to verify tests pass

## Notes

- Tests use stable selectors (`data-testid`) to avoid brittle CSS selectors
- Onboarding flow assumes happy path - all required fields are filled
- Tests wait for network idle and specific UI states to avoid flakiness
- Cookie banner is automatically dismissed in tests
- Tests are designed to work both locally and in CI
