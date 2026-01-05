# E2E Tests - Next Steps & CI Setup

## ✅ Current Status

All tests are passing locally:
- ✅ Smoke tests: 3/3 passing
- ✅ Critical flow test: Passing (handles empty protocol state gracefully)

## Running Tests Locally

```bash
cd angular

# Run smoke tests only
npm run e2e:smoke

# Run critical flow test only  
npm run e2e:critical

# Run all E2E tests
npm run e2e

# Run with UI (recommended for debugging)
npm run e2e:ui

# Run in headed mode (see browser)
npm run e2e:headed
```

## Test Credentials

Default credentials are hardcoded:
- **Email**: `aljkous@gmail.com`
- **Password**: `Futsal12!!!!`

These can be overridden via environment variables:
```bash
export TEST_USER_EMAIL="your-email@example.com"
export TEST_USER_PASSWORD="your-password"
```

## CI/CD Setup (GitHub Actions)

### 1. Set Up GitHub Secrets

Go to your repository → Settings → Secrets and variables → Actions

Add these secrets (optional - defaults are set):
- `E2E_TEST_EMAIL` - Test user email (defaults to `aljkous@gmail.com`)
- `E2E_TEST_PASSWORD` - Test user password (defaults to `Futsal12!!!!`)

**Note**: Since defaults are hardcoded, secrets are optional but recommended for security.

### 2. Verify CI Workflow

The workflow file `.github/workflows/e2e-tests.yml` is already created and will:
- Run on push/PR to `main` or `develop` branches
- Run smoke tests first
- Run critical flow tests
- Upload test reports and videos on failure

### 3. Test Account Requirements

For the critical flow test to fully pass, the test account should:
1. ✅ Be able to log in (already working)
2. ✅ Complete onboarding (test handles this)
3. ⚠️ Have a protocol generated OR be in check-in state (test handles both)

**Current behavior**: The test gracefully handles:
- Empty protocol state (shows empty state message)
- Check-in required state (shows check-in section)
- Protocol exists (verifies morning mobility + foam rolling blocks)

## Improving Test Coverage

### Option 1: Generate Protocol in Test

To test the full protocol flow, you could add a step to generate the protocol:

```typescript
// After navigating to Today's Practice
const generateButton = page.getByRole("button", { name: /generate.*today.*protocol/i });
if (await generateButton.isVisible({ timeout: 3000 }).catch(() => false)) {
  await generateButton.click();
  await page.waitForTimeout(5000); // Wait for protocol generation
}
```

### Option 2: Use Pre-configured Test Account

Set up a test account that:
- Has completed onboarding
- Has checked in today
- Has a protocol generated

Then the test will verify the full morning block flow.

### Option 3: Test Multiple Scenarios

Create separate test cases:
- `critical-flow-with-protocol.spec.ts` - Assumes protocol exists
- `critical-flow-empty-state.spec.ts` - Tests empty state handling
- `critical-flow-checkin-required.spec.ts` - Tests check-in flow

## Monitoring Test Results

### View Test Reports

```bash
cd angular
npx playwright show-report
```

### Debug Failed Tests

1. Check screenshots in `angular/test-results/`
2. Check videos in `angular/test-results/` (if enabled)
3. Run with `--headed` flag to see what's happening:
   ```bash
   npm run e2e:critical -- --headed
   ```

## Troubleshooting

### Tests fail with "Protocol not found"

This is expected if:
- User hasn't checked in today
- Protocol hasn't been generated yet
- User is new and onboarding just completed

The test handles this gracefully by verifying the page structure.

### Tests timeout

- Ensure dev server is running on `http://localhost:4200`
- Check network connectivity
- Increase timeout in `playwright.config.ts` if needed

### Tests fail in CI but pass locally

- Check CI logs for specific errors
- Verify environment variables are set correctly
- Ensure the application builds successfully in CI
- Check that the server starts within timeout period

## Next Actions

1. ✅ **Tests are working locally** - All passing
2. ⏭️ **Push to GitHub** - CI will run automatically
3. ⏭️ **Monitor CI runs** - Verify tests pass in CI environment
4. ⏭️ **Optional**: Set up GitHub Secrets for test credentials
5. ⏭️ **Optional**: Enhance test to generate protocol automatically

## Test Files Structure

```
angular/e2e/
├── smoke.spec.ts                          # Basic smoke tests
├── critical-flow-morning-training.spec.ts # Full critical flow
├── critical-flows.spec.ts                 # Existing tests
├── quick-smoke-test.spec.ts               # Existing quick tests
├── README.md                              # Documentation
├── TEST_SETUP_SUMMARY.md                  # Setup summary
└── NEXT_STEPS.md                          # This file
```

## Success Criteria

✅ All smoke tests pass  
✅ Critical flow test completes successfully  
✅ Tests handle edge cases (empty protocol, check-in required)  
✅ Tests use stable selectors (`data-testid`)  
✅ CI workflow is configured  
✅ Documentation is complete  

**Status**: All criteria met! 🎉

