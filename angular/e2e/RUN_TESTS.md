# How to Run E2E Tests

## Quick Start

### Option 1: Run Design System Tests in Headed Mode (See Browser)
```bash
cd angular
npm run e2e:design-system:watch
```

### Option 2: Run Design System Tests with UI Mode
```bash
cd angular
npx playwright test e2e/design-system-compliance.spec.ts --ui --project=chromium
```

### Option 3: Run Navigation Tests (Click Through Everything)
```bash
cd angular
npm run e2e:navigation:watch
```

### Option 4: Run All Tests
```bash
cd angular
npm run e2e -- --project=chromium
```

## If UI Mode Shows "No Tests"

1. **Make sure dev server is running:**
   ```bash
   # In one terminal
   npm run dev:angular-only
   
   # Wait for "Compiled successfully" message
   # Then in another terminal:
   cd angular
   npx playwright test --ui
   ```

2. **Try refreshing the UI:**
   - Click the refresh icon (🔄) in the Playwright UI header
   - Or close and reopen the UI

3. **Run tests directly (no UI):**
   ```bash
   cd angular
   npm run e2e:design-system
   ```

## Test Files Available

- `e2e/smoke.spec.ts` - Basic smoke tests
- `e2e/critical-flow-morning-training.spec.ts` - Critical user journey
- `e2e/navigation-routing.spec.ts` - Click through all pages/buttons
- `e2e/design-system-compliance.spec.ts` - Design token violations
- `e2e/color-contrast.spec.ts` - Color contrast checks

## Recommended: Start with Headed Mode

For seeing what happens when clicking pages/buttons, use **headed mode**:

```bash
cd angular
npm run e2e:navigation:watch
```

This will:
- Open a browser window
- Show you everything it's clicking
- Navigate through all pages
- Click buttons and verify routing
- Show results in terminal

