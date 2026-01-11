# Mobile Responsive Checklist

## Pre-Deployment Checklist

Use this checklist before deploying any responsive updates.

## ✅ Viewport & Meta Tags

- [ ] Viewport meta tag present in all HTML files
- [ ] `width=device-width` set
- [ ] `initial-scale=1` set
- [ ] `maximum-scale=5` set (allows user zoom)
- [ ] `viewport-fit=cover` for iOS safe areas
- [ ] Theme color meta tag present

## ✅ Layout & Structure

- [ ] No horizontal scrolling on any device
- [ ] All content fits within viewport
- [ ] Proper padding/margins on mobile
- [ ] Grid/flexbox responsive
- [ ] Safe area insets respected (iOS)
- [ ] Landscape orientation works
- [ ] Portrait orientation works

## ✅ Typography

- [ ] Base font size ≥ 16px
- [ ] Body text ≥ 14px
- [ ] Headings properly sized
- [ ] Line height comfortable (1.5+)
- [ ] Text doesn't overflow containers
- [ ] Text readable without zoom

## ✅ Touch Targets

- [ ] All buttons ≥ 44x44px (Apple HIG)
- [ ] All links ≥ 44x44px
- [ ] Form inputs ≥ 44px height
- [ ] Adequate spacing between targets (8px+)
- [ ] No overlapping touch areas
- [ ] Icons tappable, not just decorative

## ✅ Forms

- [ ] Inputs properly sized (44px height)
- [ ] Labels visible and associated
- [ ] Focus states visible
- [ ] Error messages visible
- [ ] Keyboard opens correctly
- [ ] Submit buttons easy to tap
- [ ] No zoom on focus (font-size ≥ 16px)
- [ ] Autocomplete attributes set

## ✅ Navigation

- [ ] Mobile menu accessible
- [ ] Hamburger menu works
- [ ] Menu items touch-friendly
- [ ] Back navigation works
- [ ] Breadcrumbs readable
- [ ] Sticky headers don't overlap
- [ ] Bottom nav (if any) doesn't block content

## ✅ Images & Media

- [ ] Images responsive (max-width: 100%)
- [ ] Images load on mobile networks
- [ ] Proper image formats (WebP, etc.)
- [ ] Alt text present
- [ ] Videos responsive
- [ ] Lazy loading implemented

## ✅ Cards & Panels

- [ ] Cards fit viewport
- [ ] Proper padding on mobile
- [ ] No horizontal scroll in cards
- [ ] Card actions accessible
- [ ] Modal/dialog fits screen
- [ ] Overlays don't overflow

## ✅ Tables

- [ ] Tables responsive (scroll or stack)
- [ ] Important columns visible
- [ ] Horizontal scroll if needed
- [ ] Cell content readable
- [ ] Actions accessible

## ✅ Performance

- [ ] FCP < 1.8s
- [ ] LCP < 2.5s
- [ ] TTI < 3.8s
- [ ] TBT < 200ms
- [ ] CLS < 0.1
- [ ] Page load < 5s on 3G

## ✅ iOS Specific

- [ ] Safe area insets working
- [ ] Notch doesn't hide content
- [ ] Home indicator spacing
- [ ] Safari rendering correct
- [ ] iOS fonts rendering
- [ ] Touch events working
- [ ] No -webkit issues

## ✅ Android Specific

- [ ] Material Design compliance
- [ ] Chrome rendering correct
- [ ] Samsung browser works
- [ ] Xiaomi MIUI compatible
- [ ] Android fonts rendering
- [ ] Back button works

## ✅ Interactions

- [ ] Tap delay removed (300ms)
- [ ] Touch feedback present
- [ ] Swipe gestures work
- [ ] Pull-to-refresh doesn't break
- [ ] Scrolling smooth
- [ ] No janky animations

## ✅ Accessibility

- [ ] WCAG AA compliant
- [ ] Screen reader accessible
- [ ] Keyboard navigation
- [ ] Focus indicators visible
- [ ] Color contrast ≥ 4.5:1
- [ ] Alt text on images
- [ ] ARIA labels present
- [ ] Semantic HTML used

## ✅ Dark Mode

- [ ] Dark mode works on mobile
- [ ] Transitions smooth
- [ ] All colors updated
- [ ] Media queries correct
- [ ] User preference respected

## ✅ Offline Support

- [ ] PWA manifest present
- [ ] Service worker registered
- [ ] Offline page works
- [ ] Cache strategy correct
- [ ] Network status shown

## ✅ Testing

- [ ] Tested on iPhone SE
- [ ] Tested on iPhone 14 Pro
- [ ] Tested on iPhone 15 Pro Max
- [ ] Tested on Samsung Galaxy S23
- [ ] Tested on Samsung Galaxy A52
- [ ] Tested on Xiaomi 13
- [ ] Tested on Xiaomi Redmi Note
- [ ] Tested portrait mode
- [ ] Tested landscape mode
- [ ] Playwright tests pass

## ✅ Browser Compatibility

- [ ] Safari iOS 15+
- [ ] Chrome Android 120+
- [ ] Samsung Internet
- [ ] Firefox Mobile
- [ ] Opera Mobile

## Device-Specific Checks

### iPhone

- [ ] Works on iPhone SE (375px)
- [ ] Works on iPhone 14 Pro (390px)
- [ ] Works on iPhone 15 Pro Max (430px)
- [ ] Notch handled correctly
- [ ] Dynamic Island doesn't overlap
- [ ] Safe areas respected

### Samsung

- [ ] Works on Galaxy S8 (360px)
- [ ] Works on Galaxy S23 (360px)
- [ ] Works on Galaxy A52 (360px)
- [ ] Works on Z Fold (375px folded)
- [ ] Samsung browser compatible
- [ ] Edge panels don't interfere

### Xiaomi

- [ ] Works on Mi 11 (360px)
- [ ] Works on Redmi Note 10 (360px)
- [ ] Works on Xiaomi 13 (360px)
- [ ] Works on Poco X3 (393px)
- [ ] MIUI compatible
- [ ] System gestures don't conflict

## Quick Test Commands

```bash
# Run all responsive tests
npm run test:responsive

# Quick check
node scripts/quick-responsive-check.js

# Specific device
npx playwright test --grep "iPhone SE"

# Visual regression
npm run test:responsive:visual

# Browser test
npx playwright test --headed --grep "Samsung"
```

## Fixing Common Issues

### Horizontal Scroll

```scss
html,
body {
  overflow-x: hidden;
  max-width: 100vw;
}
```

### Small Touch Targets

```scss
button,
a {
  min-height: 44px;
  min-width: 44px;
}
```

### Font Too Small

```scss
body {
  font-size: 16px;
}
```

### iOS Safe Areas

```scss
.header {
  padding-top: env(safe-area-inset-top);
}
```

## Sign-Off

- [ ] Developer tested locally
- [ ] QA tested on devices
- [ ] Playwright tests passing
- [ ] Visual regression approved
- [ ] Performance metrics acceptable
- [ ] Accessibility audit passed

**Developer:** ******\_\_\_\_****** **Date:** ****\_\_****

**QA:** ********\_\_\_\_******** **Date:** ****\_\_****

**Approved:** ******\_\_****** **Date:** ****\_\_****
