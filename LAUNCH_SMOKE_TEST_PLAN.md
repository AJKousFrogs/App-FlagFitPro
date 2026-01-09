# Launch Smoke Test Plan

**Date:** January 9, 2026  
**Build Version:** 1.1.0  
**Build Status:** ✅ Completed Successfully  
**Build Time:** 17.765 seconds

## Production Build Summary

### Build Results
- **Exit Code:** 0 (Success)
- **Total Bundle Size:** 1.20 MB (Initial)
- **Estimated Transfer Size:** 262.92 kB
- **Service Worker:** Enabled (ngsw-config.json)
- **Output Path:** `angular/dist/flagfit-pro`

### Build Warnings (Non-Critical)
1. **Initial Bundle:** Exceeded budget by 398.67 kB (1.20 MB vs 800 kB target)
   - Note: Lazy loading is implemented for most components
   - Large chunks are lazy-loaded (jspdf, html2canvas, etc.)
   
2. **Component Styles:**
   - `settings.component.scss`: 35.13 kB (5.13 kB over 30 kB limit)
   - `onboarding.component.scss`: 41.19 kB (11.19 kB over 30 kB limit)

3. **Third-Party Dependencies:**
   - jsPDF: 410.19 kB (lazy-loaded)
   - html2canvas: 203.21 kB (lazy-loaded)
   - CommonJS modules from canvg (optimization warnings)

**Assessment:** Build warnings are acceptable for MVP launch. All large dependencies are lazy-loaded.

---

## Smoke Test Protocol

### Test Objective
Execute 100 manual trials of the critical user flow to ensure 100% success rate before production deployment.

### Critical Flow
**Login → Log 5 Entries → View Dashboard → Logout**

### Test Sequence (Per Trial)

#### 1. Login (Step 1)
- Navigate to `/login`
- Enter valid credentials
- Click "Sign In"
- Verify redirect to dashboard
- **Success Criteria:** User authenticated and redirected within 3 seconds

#### 2. Log 5 Training Entries (Step 2)
For each of 5 entries:
- Navigate to `/training` or "Log Training"
- Fill training form:
  - Date: Current date
  - Duration: 30 minutes
  - Intensity: 7/10
  - Type: Mixed Training
  - Notes: "Smoke test entry [N]"
- Submit form
- **Success Criteria:** Entry saved and visible in training list

#### 3. View Dashboard (Step 3)
- Navigate to `/dashboard`
- Verify dashboard loads
- Check for:
  - Training statistics updated
  - Recent activity shows logged entries
  - No console errors
  - All widgets render
- **Success Criteria:** Dashboard displays all data correctly

#### 4. Logout (Step 4)
- Click user menu
- Click "Logout"
- Verify redirect to `/login`
- Verify session cleared
- **Success Criteria:** User logged out and cannot access protected routes

---

## Multi-Browser Testing Matrix

### Desktop Browsers
- [ ] Chrome (latest) - macOS
- [ ] Firefox (latest) - macOS
- [ ] Safari (latest) - macOS
- [ ] Edge (latest) - macOS

### Mobile Devices
- [ ] Safari - iOS 17+ (iPhone 14+)
- [ ] Chrome - Android 13+ (Pixel 6+)
- [ ] Safari - iPad Pro

### Testing Per Browser/Device
- Execute 10 complete smoke test cycles
- Record any device-specific issues
- Test responsive layouts
- Verify touch interactions (mobile)

---

## Trial Tracking Template

### Trial Results Log

| Trial # | Browser | Login | Log 5 | Dashboard | Logout | Duration | Notes | Status |
|---------|---------|-------|-------|-----------|--------|----------|-------|--------|
| 1       | Chrome  | ✅    | ✅    | ✅        | ✅     | 2m 15s   | -     | PASS   |
| 2       | Chrome  | ✅    | ✅    | ✅        | ✅     | 2m 10s   | -     | PASS   |
| ...     | ...     | ...   | ...   | ...       | ...    | ...      | ...   | ...    |

---

## Automated Testing Scripts

### Playwright E2E Test
Location: `angular/e2e/smoke-100-trials.spec.ts`

```typescript
// Test will run 100 iterations automatically
test.describe('Launch Smoke Test - 100 Trials', () => {
  for (let trial = 1; trial <= 100; trial++) {
    test(`Trial ${trial}/100: Login → 5 Entries → Dashboard → Logout`, async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.fill('[name="email"]', process.env.TEST_USER_EMAIL);
      await page.fill('[name="password"]', process.env.TEST_USER_PASSWORD);
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*dashboard/);
      
      // Log 5 entries
      for (let i = 1; i <= 5; i++) {
        await page.goto('/training');
        await page.click('[data-testid="log-training-button"]');
        await page.fill('[name="duration"]', '30');
        await page.fill('[name="intensity"]', '7');
        await page.fill('[name="notes"]', `Trial ${trial} Entry ${i}`);
        await page.click('button[type="submit"]');
        await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      }
      
      // View Dashboard
      await page.goto('/dashboard');
      await expect(page.locator('[data-testid="training-stats"]')).toBeVisible();
      
      // Logout
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="logout-button"]');
      await expect(page).toHaveURL(/.*login/);
    });
  }
});
```

---

## Lighthouse Audit Requirements

### Performance Targets
- **Performance:** ≥90
- **Accessibility:** ≥90
- **Best Practices:** ≥90
- **SEO:** ≥90
- **PWA:** All checks passed

### Audit Pages
1. `/` (Landing/Login)
2. `/dashboard` (Authenticated)
3. `/training` (Main feature)
4. `/analytics` (Data-heavy page)

### Audit Command
```bash
lighthouse https://[staging-url] \
  --output=json \
  --output=html \
  --output-path=./lighthouse-reports/launch-audit \
  --chrome-flags="--headless" \
  --preset=desktop
```

---

## Deployment Checklist

### Pre-Deployment
- [x] Production build successful
- [ ] 100/100 smoke test trials passed
- [ ] Lighthouse score ≥90 on all pages
- [ ] Cross-browser testing complete
- [ ] Mobile device testing complete
- [ ] No critical console errors
- [ ] API endpoints responding
- [ ] Database migrations applied
- [ ] Environment variables configured

### Netlify Staging Deployment
- [ ] Deploy to staging environment
- [ ] Verify build on Netlify
- [ ] Test staging URL
- [ ] Verify API routes
- [ ] Test authentication flow
- [ ] Verify Supabase connection

### Production Promotion
- [ ] Staging tests passed
- [ ] Backup current production
- [ ] Deploy to production
- [ ] Verify production deployment
- [ ] Monitor error logs (first 15 minutes)
- [ ] Run quick smoke test on production

---

## Issue Tracking Template

### GitHub Issue Template for Post-Launch Monitoring

```markdown
## Issue Title
[Category] Brief description

## Severity
- [ ] Critical (blocks core functionality)
- [ ] High (impacts user experience)
- [ ] Medium (minor inconvenience)
- [ ] Low (cosmetic/nice-to-have)

## Browser/Device
- Browser: [Chrome/Firefox/Safari/Edge]
- Version: [version]
- OS: [macOS/iOS/Android/Windows]
- Device: [Desktop/Mobile model]

## Steps to Reproduce
1. 
2. 
3. 

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Screenshots/Logs
[Attach screenshots or console logs]

## Impact
- Users affected: [estimate %]
- Workaround available: [Yes/No]

## Priority for Fix
- [ ] Hotfix (deploy immediately)
- [ ] Next patch (within 24h)
- [ ] Next sprint (within 1 week)
- [ ] Backlog (track for later)

## Related Issues
[Link any related issues]
```

---

## Success Criteria

### Launch Greenlight Requirements
✅ All criteria must be met:

1. **Build Quality**
   - [x] Production build completes without errors
   - [x] Bundle size optimized (lazy loading implemented)
   - [x] Service Worker enabled

2. **Smoke Tests**
   - [ ] 100/100 trials successful (100% pass rate)
   - [ ] No critical errors in console
   - [ ] All 4 steps complete in <3 minutes per trial

3. **Performance**
   - [ ] Lighthouse Performance ≥90
   - [ ] First Contentful Paint <2s
   - [ ] Time to Interactive <3s

4. **Cross-Platform**
   - [ ] Chrome: 10/10 tests passed
   - [ ] Firefox: 10/10 tests passed
   - [ ] Safari: 10/10 tests passed
   - [ ] Mobile iOS: 5/5 tests passed
   - [ ] Mobile Android: 5/5 tests passed

5. **Deployment**
   - [ ] Staging deployment successful
   - [ ] API connectivity verified
   - [ ] Authentication working
   - [ ] No 404/500 errors

---

## Risk Assessment

### Known Issues (Acceptable for MVP)
1. **Bundle Size Warnings:** Non-blocking, lazy loading implemented
2. **CommonJS Modules:** canvg dependencies, no runtime impact
3. **Style Bundle Size:** Settings/Onboarding slightly over budget

### Monitoring Plan (Post-Launch)
- Real User Monitoring (RUM) via Sentry
- Error tracking for first 48 hours
- Performance metrics monitoring
- User feedback collection

---

## Contact & Escalation

### Issue Reporting
- Create GitHub issue: [Repository URL]/issues
- Tag: `launch-monitoring`
- Priority: Use severity labels

### Emergency Rollback
If critical issues arise:
1. Revert to previous Netlify deployment
2. Document issue in GitHub
3. Apply fix in development
4. Re-run smoke tests
5. Redeploy when fixed

---

## Test Execution Log

**Test Lead:** [Name]  
**Start Date:** January 9, 2026  
**Target Completion:** [Date]

### Progress Tracker
- **Smoke Tests:** 0/100 complete
- **Browser Tests:** 0/40 complete (4 browsers × 10 trials)
- **Mobile Tests:** 0/10 complete (2 devices × 5 trials)
- **Lighthouse Audits:** 0/4 complete

**Status:** 🟡 In Progress

---

## Next Steps

1. **Execute Automated Smoke Tests**
   ```bash
   cd angular
   npx playwright test e2e/smoke-100-trials.spec.ts --workers=1
   ```

2. **Run Lighthouse Audits**
   ```bash
   npm install -g lighthouse
   lighthouse https://staging-url --view
   ```

3. **Deploy to Netlify Staging**
   ```bash
   npm run deploy
   ```

4. **Manual Browser Testing**
   - Use checklist above
   - Document all findings

5. **Create Launch Readiness Report**
   - Compile all results
   - Document any issues
   - Get final approval

---

**Document Version:** 1.0  
**Last Updated:** January 9, 2026
