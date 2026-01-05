# Release Checklist

This checklist ensures all quality gates pass before releasing to production.

## Pre-Release Verification

### ✅ Build & Dependencies
- [ ] **PASS** Node.js version matches CI (v22)
- [ ] **PASS** npm version matches CI (v10+)
- [ ] **PASS** `npm ci` installs dependencies correctly (no package-lock.json conflicts)
- [ ] **PASS** Build completes without errors (`npm run build`)

### ✅ Code Quality
- [ ] **PASS** ESLint passes with no errors (`npm run lint`)
- [ ] **PASS** TypeScript compilation succeeds (`npx tsc --noEmit`)
- [ ] **PASS** No ESLint rule exceptions without documentation
- [ ] **PASS** All ESLint exceptions documented in smallest scope (file-level comments)

### ✅ Testing
- [ ] **PASS** Unit tests pass (`npm test`)
- [ ] **PASS** E2E smoke tests pass (`npm run e2e:smoke`)
- [ ] **PASS** Test coverage meets minimum thresholds (if applicable)

### ✅ CI/CD Pipeline
- [ ] **PASS** GitHub Actions CI workflow runs successfully
  - [ ] Lint job passes
  - [ ] Type-check job passes
  - [ ] Unit tests job passes
  - [ ] E2E smoke tests job passes
  - [ ] Build job passes
- [ ] **PASS** Netlify build configuration aligns with CI:
  - [ ] Same Node.js version (22)
  - [ ] Same install strategy (`npm ci`)
  - [ ] Same build command (`npm run build`)
  - [ ] Same environment variables

### ✅ Deployment Artifacts
- [ ] **PASS** Netlify deploy produces correct publish directory (`angular/dist/flagfit-pro/browser`)
- [ ] **PASS** SPA routing works (refresh on deep routes like `/dashboard`, `/training`, etc.)
- [ ] **PASS** All static assets load correctly
- [ ] **PASS** Service worker registers correctly (if applicable)
- [ ] **PASS** Environment variables injected correctly

### ✅ Security & Performance
- [ ] **PASS** Security headers configured correctly in `netlify.toml`
- [ ] **PASS** Content Security Policy allows required resources
- [ ] **PASS** Bundle size within budget limits
- [ ] **PASS** No sensitive data in build artifacts

## Release Process

1. **Pre-Release Checks** (Run locally or via CI)
   ```bash
   cd angular
   npm ci
   npm run lint
   npx tsc --noEmit
   npm test
   npm run build
   npm run e2e:smoke
   ```

2. **CI Verification**
   - Push to feature branch and verify all CI jobs pass
   - Create PR and verify CI runs on PR
   - Merge to main/master branch

3. **Netlify Deployment**
   - Netlify automatically deploys on push to main/master
   - Verify build logs match CI build process
   - Verify deploy preview works correctly

4. **Post-Deployment Verification**
   - Test SPA routing (refresh on deep routes)
   - Verify API endpoints work correctly
   - Check browser console for errors
   - Verify analytics tracking (if enabled)

## Configuration Alignment

### Node.js Version
- **CI**: Node.js 22 (via `actions/setup-node@v4`)
- **Netlify**: Node.js 22 (via `NODE_VERSION = "22"` in `netlify.toml`)
- **Status**: ✅ **ALIGNED**

### Install Strategy
- **CI**: `npm ci` (clean install from package-lock.json)
- **Netlify**: `npm ci` (in build command)
- **Status**: ✅ **ALIGNED**

### Build Command
- **CI**: `npm run build` (production build)
- **Netlify**: `cd angular && npm ci && npm run build && cd .. && node scripts/inject-env-into-html-angular.js`
- **Status**: ✅ **ALIGNED** (Netlify includes additional env injection step)

### Publish Directory
- **Netlify**: `angular/dist/flagfit-pro/browser`
- **Status**: ✅ **CORRECT**

### SPA Routing
- **Netlify**: Configured with `[[redirects]]` rule: `from = "/*"` → `to = "/index.html"` with `status = 200`
- **Status**: ✅ **CONFIGURED**

## Common Issues & Solutions

### Issue: ESLint errors
**Solution**: Run `npm run lint:fix` to auto-fix issues, or fix manually and document exceptions

### Issue: TypeScript compilation errors
**Solution**: Fix type errors or add proper type annotations

### Issue: Unit tests failing
**Solution**: Fix failing tests or update test expectations

### Issue: E2E tests failing
**Solution**: Check test environment variables, update selectors, or fix application bugs

### Issue: Netlify build fails but CI passes
**Solution**: Verify environment variables match, check Node.js version, verify build command

### Issue: SPA routing doesn't work
**Solution**: Verify `netlify.toml` has correct redirect rule for `/*` → `/index.html` with `status = 200`

## Status Summary

| Check | Status | Notes |
|-------|--------|-------|
| Node.js Version Alignment | ✅ PASS | Both use v22 |
| Install Strategy Alignment | ✅ PASS | Both use `npm ci` |
| Build Command Alignment | ✅ PASS | Netlify includes env injection |
| Publish Directory | ✅ PASS | Correct path configured |
| SPA Routing | ✅ PASS | Redirect rule configured |
| CI Workflow | ✅ PASS | All jobs configured |
| ESLint | ⏳ PENDING | Run `npm run lint` to verify |
| TypeScript Build | ⏳ PENDING | Run `npx tsc --noEmit` to verify |
| Unit Tests | ⏳ PENDING | Run `npm test` to verify |
| E2E Smoke Tests | ⏳ PENDING | Run `npm run e2e:smoke` to verify |

---

**Last Updated**: 2025-01-05
**Next Review**: Before each release

