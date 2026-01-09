# Full Smoke Test & Launch Preparation - Execution Guide

**Created:** January 9, 2026  
**Status:** Ready for Execution  
**Estimated Time:** 6-8 hours

---

## Quick Start

This is your complete guide to execute the full smoke test and launch preparation for FlagFit Pro v1.1.0.

### Prerequisites Completed ✅
- [x] Production build successful (`ng build`)
- [x] Test scripts created
- [x] Documentation prepared
- [x] Deployment guide ready

### What You Need
1. **Test User Account** in Supabase
2. **Netlify Access** for deployment
3. **Test Browsers** installed (Chrome, Firefox, Safari, Edge)
4. **Mobile Devices** for testing (iOS + Android)
5. **~6-8 hours** for full testing cycle

---

## Step-by-Step Execution

### Phase 1: Local Smoke Tests (3-4 hours)

#### 1.1 Start Development Server
```bash
cd /Users/aljosakous/Documents/GitHub/app-new-flag
npm run dev:angular-only
```

Wait for server to start on `http://localhost:4200`

#### 1.2 Set Test Credentials
```bash
# Create .env.test file with your test credentials
export TEST_USER_EMAIL="your-test-user@example.com"
export TEST_USER_PASSWORD="YourTestPassword123!"
export BASE_URL="http://localhost:4200"
```

#### 1.3 Run Quick Smoke Test (10 trials)
```bash
cd angular
npx playwright test e2e/quick-smoke-test.spec.ts --workers=1
```

**Expected:** ~5-10 minutes, 10/10 should pass

#### 1.4 Run Full Smoke Test (100 trials)
```bash
cd angular
npx playwright test e2e/launch-smoke-100-trials.spec.ts --workers=1
```

**Expected:** ~2-3 hours, 100/100 must pass for launch greenlight

**Monitor:**
- Watch console output for trial progress
- Check for any failures
- Review `test-results/launch-smoke-test-results.json` when complete

**Success Criteria:** 100% pass rate (100/100 trials)

---

### Phase 2: Lighthouse Audits (30 minutes)

#### 2.1 Install Lighthouse (if not installed)
```bash
npm install -g lighthouse
```

#### 2.2 Run Lighthouse Audits
```bash
export STAGING_URL="http://localhost:4200"
bash scripts/run-lighthouse-audit.sh
```

**Expected:** ~20-30 minutes for all pages

**Success Criteria:** All scores ≥90 for:
- Performance
- Accessibility
- Best Practices
- SEO

**Review Reports:**
```bash
open lighthouse-reports/launch-[timestamp]/*.report.html
```

---

### Phase 3: Cross-Browser Testing (2 hours)

Test the critical flow manually in each browser (10 trials per browser):

#### 3.1 Chrome Testing
1. Open `http://localhost:4200` in Chrome
2. Execute: Login → Log 5 Entries → Dashboard → Logout
3. Repeat 10 times
4. Document any issues

#### 3.2 Firefox Testing
1. Open `http://localhost:4200` in Firefox
2. Execute: Login → Log 5 Entries → Dashboard → Logout
3. Repeat 10 times
4. Document any issues

#### 3.3 Safari Testing
1. Open `http://localhost:4200` in Safari
2. Execute: Login → Log 5 Entries → Dashboard → Logout
3. Repeat 10 times
4. Document any issues

#### 3.4 Edge Testing
1. Open `http://localhost:4200` in Edge
2. Execute: Login → Log 5 Entries → Dashboard → Logout
3. Repeat 10 times
4. Document any issues

**Success Criteria:** 40/40 trials pass (100% success rate across all browsers)

**Use This Tracking Template:**
```
Browser: [Name]
Trial: [N]/10
✅ Login
✅ Log Entry 1
✅ Log Entry 2
✅ Log Entry 3
✅ Log Entry 4
✅ Log Entry 5
✅ View Dashboard
✅ Logout
Duration: [time]
Issues: [none/list]
```

---

### Phase 4: Mobile Device Testing (1 hour)

#### 4.1 iOS Testing (iPhone)
1. Connect iPhone to same network as dev server
2. Open Safari, navigate to `http://[your-ip]:4200`
3. Execute critical flow 5 times
4. Test touch interactions
5. Test PWA installation
6. Document any issues

#### 4.2 Android Testing
1. Connect Android device to same network
2. Open Chrome, navigate to `http://[your-ip]:4200`
3. Execute critical flow 5 times
4. Test touch interactions
5. Test PWA installation
6. Document any issues

**Success Criteria:** 10/10 trials pass (5 iOS + 5 Android)

---

### Phase 5: Netlify Staging Deployment (30 minutes)

#### 5.1 Verify Environment Variables
In Netlify Dashboard → Site Settings → Environment Variables:
- [ ] `VITE_SUPABASE_URL` set
- [ ] `VITE_SUPABASE_ANON_KEY` set
- [ ] `SUPABASE_SERVICE_KEY` set (for functions)
- [ ] `JWT_SECRET` set
- [ ] `NODE_ENV=production`

#### 5.2 Deploy to Staging
```bash
# Option 1: Manual deploy
netlify deploy --build --context=deploy-preview

# Option 2: Git push (if configured)
git add .
git commit -m "chore: prepare for launch"
git push origin main
```

#### 5.3 Verify Deployment
1. Wait for build to complete (~5 minutes)
2. Get staging URL from Netlify
3. Test staging URL:
   ```bash
   curl -I https://[staging-url]
   # Should return 200 OK
   ```

#### 5.4 Test on Staging
Run quick smoke test on staging:
```bash
export BASE_URL="https://[staging-url]"
cd angular
npx playwright test e2e/quick-smoke-test.spec.ts --workers=1
```

**Success Criteria:** Staging deploys successfully, quick test passes

---

### Phase 6: Final Validation (30 minutes)

#### 6.1 Review All Results
- [ ] Smoke test: 100/100 passed
- [ ] Lighthouse: All pages ≥90
- [ ] Chrome: 10/10 passed
- [ ] Firefox: 10/10 passed
- [ ] Safari: 10/10 passed
- [ ] Edge: 10/10 passed
- [ ] iOS: 5/5 passed
- [ ] Android: 5/5 passed
- [ ] Staging: Deployed and tested

#### 6.2 Document Issues
For any issues found, create GitHub issues using templates in:
`docs/LAUNCH_ISSUE_TEMPLATES.md`

Categories:
- P0: Critical (blocks launch)
- P1: High (should fix)
- P2: Medium (can defer)
- P3: Low (future enhancement)

#### 6.3 Update Launch Readiness Report
Update `LAUNCH_READINESS_REPORT.md` with:
- All test results
- Success rates
- Issues found
- Launch decision

---

## Decision Matrix

### GREENLIGHT ✅ (Ready for Production)
All must be true:
- [x] Production build successful
- [ ] Smoke tests: 100/100 passed (100%)
- [ ] Lighthouse: All pages ≥90
- [ ] Cross-browser: 40/40 passed (100%)
- [ ] Mobile: 10/10 passed (100%)
- [ ] Staging: Deployed successfully
- [ ] Issues: Zero P0 (critical)
- [ ] Team: Approval received

### HOLD 🔴 (Not Ready)
Any of these:
- Smoke test pass rate <100%
- Lighthouse score <90 on any page
- Critical (P0) issue exists
- Major browser completely broken
- Authentication not working
- Data loss risk identified

---

## Timeline Estimate

| Phase | Task | Duration | Critical |
|-------|------|----------|----------|
| 1 | Quick smoke test (10 trials) | 10 min | No |
| 1 | Full smoke test (100 trials) | 2-3 hours | **YES** |
| 2 | Lighthouse audits (5 pages) | 30 min | **YES** |
| 3 | Chrome testing (10 trials) | 30 min | **YES** |
| 3 | Firefox testing (10 trials) | 30 min | **YES** |
| 3 | Safari testing (10 trials) | 30 min | **YES** |
| 3 | Edge testing (10 trials) | 30 min | **YES** |
| 4 | iOS testing (5 trials) | 30 min | **YES** |
| 4 | Android testing (5 trials) | 30 min | **YES** |
| 5 | Staging deployment | 10 min | **YES** |
| 5 | Staging verification | 20 min | **YES** |
| 6 | Results review & report | 30 min | **YES** |
| **TOTAL** | | **6-8 hours** | |

---

## Parallel Execution (Faster)

You can speed up testing by running some phases in parallel:

### Team Approach (4 people)
- **Person 1:** Automated smoke tests (100 trials)
- **Person 2:** Chrome + Firefox testing (20 trials)
- **Person 3:** Safari + Edge testing (20 trials)
- **Person 4:** Mobile testing + Lighthouse audits

**Time Saved:** 3-4 hours (complete in ~3 hours)

### Solo Approach (Optimized)
1. **Start automated smoke test** (runs unattended)
2. **While running:** Do manual browser testing
3. **While running:** Do Lighthouse audits
4. **While running:** Deploy to staging
5. **After smoke test:** Do mobile testing
6. **Finally:** Review and report

**Time Saved:** 1-2 hours (complete in ~5 hours)

---

## Troubleshooting

### Smoke Test Failures

**Problem:** Test times out or hangs  
**Solution:**
```bash
# Increase timeout
export PLAYWRIGHT_TIMEOUT=300000
# Run with headed mode to see what's happening
npx playwright test e2e/quick-smoke-test.spec.ts --headed
```

**Problem:** Can't find elements  
**Solution:** Check if selectors in test match your app. Update selectors in test file if needed.

**Problem:** Authentication fails  
**Solution:** Verify test user exists in Supabase and credentials are correct.

### Lighthouse Issues

**Problem:** Lighthouse not installed  
**Solution:**
```bash
npm install -g lighthouse
```

**Problem:** Scores too low  
**Solution:** Review HTML reports, fix issues, re-test. Some acceptable for MVP.

**Problem:** Can't audit localhost  
**Solution:** Lighthouse requires HTTP/HTTPS. Make sure dev server is running.

### Browser Testing Issues

**Problem:** Feature works in Chrome but not Safari  
**Solution:** Document as compatibility issue. Check console for errors. May need polyfill.

**Problem:** Mobile touch not working  
**Solution:** Check viewport meta tags. Test touch events. May need touch-specific handlers.

### Deployment Issues

**Problem:** Build fails on Netlify  
**Solution:** Check build logs. Verify Node version. Check environment variables.

**Problem:** API routes return 404  
**Solution:** Verify `netlify.toml` redirects. Check function deployment.

**Problem:** Supabase connection fails  
**Solution:** Check CORS settings. Verify environment variables. Check anon key.

---

## Success Checklist

Print this and check off as you complete:

### Phase 1: Local Testing
- [ ] Dev server started
- [ ] Test credentials configured
- [ ] Quick smoke test passed (10/10)
- [ ] Full smoke test passed (100/100)
- [ ] Results saved to JSON

### Phase 2: Lighthouse
- [ ] Lighthouse installed
- [ ] Landing page audited (≥90)
- [ ] Dashboard audited (≥90)
- [ ] Training page audited (≥90)
- [ ] Analytics page audited (≥90)
- [ ] HTML reports saved

### Phase 3: Browsers
- [ ] Chrome tested (10/10)
- [ ] Firefox tested (10/10)
- [ ] Safari tested (10/10)
- [ ] Edge tested (10/10)
- [ ] All issues documented

### Phase 4: Mobile
- [ ] iOS tested (5/5)
- [ ] Android tested (5/5)
- [ ] PWA installation verified
- [ ] Touch interactions work
- [ ] All issues documented

### Phase 5: Staging
- [ ] Environment variables set
- [ ] Deployed to Netlify
- [ ] Staging URL accessible
- [ ] Quick test on staging passed
- [ ] API endpoints verified

### Phase 6: Final
- [ ] All results compiled
- [ ] Issues documented in GitHub
- [ ] Launch report updated
- [ ] Team notified
- [ ] Launch decision made

---

## Next Steps After Testing

### If GREENLIGHT ✅
1. **Update Launch Report** with final results
2. **Get Approvals** from stakeholders
3. **Schedule Production Deploy** 
4. **Deploy to Production**
   ```bash
   netlify deploy --prod
   ```
5. **Monitor First 24 Hours**
   - Watch error logs
   - Track user signups
   - Quick smoke test on prod
   - Address any hotfixes

### If HOLD 🔴
1. **Document Issues** in GitHub
2. **Prioritize Fixes** (P0 first)
3. **Apply Fixes** in development
4. **Re-test** after fixes
5. **Re-run Full Testing** when ready
6. **Make New Launch Decision**

---

## Support & Resources

### Documentation
- **Launch Plan:** `LAUNCH_SMOKE_TEST_PLAN.md`
- **Deployment Guide:** `docs/NETLIFY_DEPLOYMENT_GUIDE.md`
- **Issue Templates:** `docs/LAUNCH_ISSUE_TEMPLATES.md`
- **Readiness Report:** `LAUNCH_READINESS_REPORT.md`

### Test Scripts
- **100 Trials:** `angular/e2e/launch-smoke-100-trials.spec.ts`
- **Quick Test:** `angular/e2e/quick-smoke-test.spec.ts`
- **Lighthouse:** `scripts/run-lighthouse-audit.sh`

### Commands
```bash
# Start dev server
npm run dev:angular-only

# Quick smoke test
bash scripts/quick-smoke-test.sh

# Full smoke test (100 trials)
cd angular && npx playwright test e2e/launch-smoke-100-trials.spec.ts --workers=1

# Lighthouse audit
bash scripts/run-lighthouse-audit.sh

# Deploy to staging
netlify deploy --build --context=deploy-preview

# Deploy to production
netlify deploy --prod
```

---

## Contact

**For Questions:**
- Check documentation first
- Review test output and logs
- Create GitHub issue if needed

**Emergency:**
- If critical issue found in production
- Follow rollback procedure in deployment guide
- Notify team immediately

---

**Good luck with testing! 🚀**

Remember: **100% pass rate required** for launch greenlight. Take your time, be thorough, and document everything.

---

**Last Updated:** January 9, 2026  
**Document Version:** 1.0
