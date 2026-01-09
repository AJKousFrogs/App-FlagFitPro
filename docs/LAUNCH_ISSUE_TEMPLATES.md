# Launch Monitoring - GitHub Issue Templates

This document provides standardized templates for tracking issues discovered during launch testing and post-launch monitoring.

## Issue Categories

### Critical (P0)
- Blocks core user flows
- Data loss or corruption
- Security vulnerabilities
- Complete feature failure

### High (P1)
- Significant UX degradation
- Intermittent failures
- Performance issues affecting >50% users
- Workarounds available but difficult

### Medium (P2)
- Minor UX issues
- Affects <50% users
- Easy workarounds available
- Visual inconsistencies

### Low (P3)
- Cosmetic issues
- Nice-to-have improvements
- Documentation gaps
- Edge case bugs

---

## Template 1: Functional Bug

```markdown
---
name: Launch Bug Report
about: Report a bug discovered during launch testing
title: '[LAUNCH] Brief description'
labels: bug, launch-monitoring
assignees: ''
---

## Bug Description
<!-- Clear, concise description of what's broken -->

## Severity
- [ ] **P0 - Critical** (Blocks core functionality)
- [ ] **P1 - High** (Significant UX impact)
- [ ] **P2 - Medium** (Minor inconvenience)
- [ ] **P3 - Low** (Cosmetic/nice-to-have)

## Environment
- **Browser:** Chrome/Firefox/Safari/Edge
- **Version:** [browser version]
- **OS:** macOS/iOS/Android/Windows
- **Device:** Desktop / iPhone 14 / Pixel 6 / etc.
- **Testing Phase:** Smoke Test / Lighthouse / Browser Testing

## Steps to Reproduce
1. Navigate to [page]
2. Click [button]
3. Fill [form field] with [value]
4. Click [submit]
5. Observe [issue]

## Expected Behavior
<!-- What should happen -->

## Actual Behavior
<!-- What actually happens -->

## Screenshots/Videos
<!-- Attach screenshots or screen recordings -->

## Console Errors
```
[Paste console errors here]
```

## Network Errors
```
[Paste network errors from browser DevTools]
```

## Impact Assessment
- **Users Affected:** [estimate %]
- **Frequency:** Always / Intermittent / Rare
- **Workaround Available:** Yes / No
- **Workaround Description:** [if applicable]

## Proposed Fix
<!-- If you have suggestions for fixing -->

## Related Issues
<!-- Link to related issues -->

## Testing Notes
- **Trial Number:** [if from smoke test]
- **Test Case:** Login / Log Entries / Dashboard / Logout / Other
```

---

## Template 2: Performance Issue

```markdown
---
name: Performance Issue
about: Report performance degradation
title: '[PERF] Brief description'
labels: performance, launch-monitoring
assignees: ''
---

## Performance Issue
<!-- Description of the performance problem -->

## Metrics
- **Lighthouse Performance Score:** [score]
- **First Contentful Paint:** [ms]
- **Largest Contentful Paint:** [ms]
- **Time to Interactive:** [ms]
- **Total Blocking Time:** [ms]
- **Cumulative Layout Shift:** [score]

## Environment
- **Browser:** [browser + version]
- **Device:** Desktop / Mobile
- **Network:** Fast 3G / Slow 4G / Cable / Fiber
- **Page:** [URL path]

## Current Performance
<!-- Describe current slow behavior -->

## Expected Performance
<!-- What performance is acceptable -->

## Impact
- [ ] Affects all users
- [ ] Affects mobile users only
- [ ] Affects specific pages only
- [ ] Affects under slow network conditions

## Proposed Solutions
<!-- Suggestions for optimization -->

## Priority
- [ ] P0 - Blocks launch (score <90)
- [ ] P1 - Should fix before launch
- [ ] P2 - Fix in first patch
- [ ] P3 - Optimize later
```

---

## Template 3: Browser Compatibility Issue

```markdown
---
name: Browser Compatibility
about: Report cross-browser compatibility issue
title: '[COMPAT] Brief description'
labels: compatibility, launch-monitoring
assignees: ''
---

## Compatibility Issue
<!-- Description of what works in some browsers but not others -->

## Affected Browsers
- [ ] Chrome (version: ___)
- [ ] Firefox (version: ___)
- [ ] Safari (version: ___)
- [ ] Edge (version: ___)
- [ ] Mobile Safari (iOS version: ___)
- [ ] Chrome Mobile (Android version: ___)

## Working Browsers
- [ ] Chrome (version: ___)
- [ ] Firefox (version: ___)
- [ ] Safari (version: ___)
- [ ] Edge (version: ___)

## Steps to Reproduce
1. Open [browser]
2. Navigate to [page]
3. Perform [action]
4. Observe [issue]

## Expected Behavior
<!-- What works in other browsers -->

## Actual Behavior (Affected Browsers)
<!-- What fails in affected browsers -->

## Screenshots
<!-- Side-by-side screenshots from working vs broken browsers -->

## Console Errors (Affected Browser)
```
[Paste console errors]
```

## Root Cause (if known)
<!-- CSS feature, JS API, etc. that's not supported -->

## Priority
- [ ] P0 - Major browser completely broken
- [ ] P1 - Core feature broken in major browser
- [ ] P2 - Minor feature broken
- [ ] P3 - Edge case or minor browser
```

---

## Template 4: Accessibility Issue

```markdown
---
name: Accessibility Issue
about: Report accessibility barrier
title: '[A11Y] Brief description'
labels: accessibility, launch-monitoring
assignees: ''
---

## Accessibility Issue
<!-- Description of accessibility barrier -->

## WCAG Violation
- [ ] Level A
- [ ] Level AA
- [ ] Level AAA

## WCAG Criterion
<!-- e.g., 1.1.1 Non-text Content, 2.1.1 Keyboard, etc. -->

## User Impact
- [ ] Screen reader users
- [ ] Keyboard-only users
- [ ] Low vision users
- [ ] Color blind users
- [ ] Motor impairment users

## Location
- **Page:** [URL]
- **Component:** [component name]
- **Element:** [specific element]

## Issue Description
<!-- What accessibility barrier exists -->

## Steps to Reproduce
1. Use [assistive technology]
2. Navigate to [page]
3. Try to [action]
4. Observe [issue]

## Expected Behavior
<!-- What should be accessible -->

## Lighthouse Accessibility Score
- **Score:** [score]
- **Affected Audits:** [list failed audits]

## Proposed Fix
<!-- How to make it accessible -->

## Priority
- [ ] P0 - Blocks core functionality
- [ ] P1 - Significant barrier
- [ ] P2 - Minor barrier
- [ ] P3 - Enhancement
```

---

## Template 5: Mobile/Responsive Issue

```markdown
---
name: Mobile/Responsive Issue
about: Report issue on mobile devices or small screens
title: '[MOBILE] Brief description'
labels: mobile, responsive, launch-monitoring
assignees: ''
---

## Mobile Issue
<!-- Description of mobile-specific problem -->

## Device Information
- **Device:** iPhone 14 / Pixel 6 / iPad Pro / etc.
- **OS:** iOS 17.2 / Android 13 / etc.
- **Browser:** Safari / Chrome / etc.
- **Screen Size:** [width x height]
- **Orientation:** Portrait / Landscape

## Viewport
- [ ] Mobile (< 768px)
- [ ] Tablet (768px - 1024px)
- [ ] Desktop (> 1024px)

## Issue Type
- [ ] Layout broken
- [ ] Text not readable
- [ ] Touch targets too small
- [ ] Elements overlapping
- [ ] Content cut off
- [ ] Horizontal scrolling
- [ ] Other: ___

## Steps to Reproduce
1. Open on [device]
2. Navigate to [page]
3. Observe [issue]

## Screenshots
<!-- Mobile screenshots showing the issue -->

## Expected Behavior
<!-- How it should look/work on mobile -->

## Actual Behavior
<!-- How it actually looks/works -->

## Impact
- **Users Affected:** Mobile users only / All users
- **Workaround:** [if any]

## Priority
- [ ] P0 - Makes mobile unusable
- [ ] P1 - Significant UX issue
- [ ] P2 - Minor inconvenience
- [ ] P3 - Polish/enhancement
```

---

## Template 6: Smoke Test Failure

```markdown
---
name: Smoke Test Failure
about: Report failure in 100-trial smoke test
title: '[SMOKE] Trial [N] Failed - [Step]'
labels: smoke-test, launch-blocker
assignees: ''
---

## Smoke Test Failure

**Trial Number:** [N]/100  
**Failed Step:** Login / Log 5 Entries / View Dashboard / Logout  
**Timestamp:** [ISO timestamp]  
**Duration Before Failure:** [seconds]

## Steps Completed
- [x] Login (if completed)
- [x] Log Entry 1 (if completed)
- [x] Log Entry 2 (if completed)
- [x] Log Entry 3 (if completed)
- [ ] Log Entry 4 (failed here)
- [ ] Log Entry 5
- [ ] View Dashboard
- [ ] Logout

## Error Message
```
[Paste error from test output]
```

## Screenshot
<!-- Attach screenshot from test-results/trial-N-failure.png -->

## Console Errors
```
[Paste console errors if available]
```

## Network Errors
```
[Paste network errors if available]
```

## Reproducibility
- [ ] Happens every time
- [ ] Happens intermittently (occurred in [N] out of 100 trials)
- [ ] First occurrence

## Impact on Launch
- [ ] **LAUNCH BLOCKER** - Must fix before launch
- [ ] Can proceed with monitoring

## Root Cause (if known)
<!-- What caused the failure -->

## Proposed Fix
<!-- How to fix -->

## Retest Plan
- [ ] Run another 100 trials after fix
- [ ] Rerun failed trial manually
```

---

## Issue Workflow

### 1. Discovery
- Issue found during smoke test, Lighthouse audit, or browser testing
- Create GitHub issue using appropriate template
- Assign severity and priority labels

### 2. Triage
- Team reviews within 1 hour for P0, 4 hours for P1
- Determine if issue blocks launch
- Assign to developer

### 3. Fix
- Developer implements fix
- Developer adds tests to prevent regression
- Code review and merge

### 4. Verification
- QA verifies fix in staging
- Re-run relevant tests
- Update issue with verification results

### 5. Closure
- Close issue when verified
- Document in launch report
- Add to known issues if deferring

---

## Launch Criteria

### Must Fix Before Launch (P0)
- [ ] Any smoke test failure >1% (must achieve 100% success rate)
- [ ] Lighthouse score <90 on any page
- [ ] Complete feature failure
- [ ] Data loss or corruption
- [ ] Security vulnerability
- [ ] Authentication/authorization broken

### Should Fix Before Launch (P1)
- [ ] Major browser completely broken
- [ ] Significant UX degradation
- [ ] Mobile experience severely impacted
- [ ] Performance >5s load time

### Can Defer (P2/P3)
- [ ] Minor visual issues
- [ ] Edge case bugs
- [ ] Non-critical browser compatibility
- [ ] Cosmetic improvements

---

## Monitoring Post-Launch

### First 24 Hours
- Monitor all issues actively
- Quick response to any P0/P1 issues
- Daily standup to review new issues

### First Week
- Aggregate user feedback
- Track issue frequency
- Identify trends
- Plan hotfixes if needed

### First Month
- Review all deferred issues
- Prioritize for next sprint
- Update documentation
- Plan improvements

---

## Contact & Escalation

### Issue Reporting
- **GitHub Issues:** [Repository URL]/issues
- **Tag:** `launch-monitoring`
- **Slack Channel:** #launch-monitoring (if applicable)

### Escalation Path
1. **P0 Critical:** Immediate notification to tech lead
2. **P1 High:** Report in daily standup
3. **P2 Medium:** Add to sprint backlog
4. **P3 Low:** Document for future consideration

### Emergency Rollback
If critical issues require rollback:
1. Notify team immediately
2. Revert to last stable deployment
3. Create post-mortem issue
4. Document lessons learned
5. Plan fix and retest before redeployment

---

**Last Updated:** January 9, 2026  
**Document Version:** 1.0
