# Responsive Design Audit Report
Generated: 2025-11-09T22:03:34.414Z

## Summary
- **Total Files Audited**: 30
- **HTML Files**: 23
- **CSS Files**: 7
- **Files with Issues**: 5
- **Files with Warnings**: 8
- **Total Issues**: 20
- **Total Warnings**: 12

## Device Coverage

### Supported Breakpoints
- **Mobile Small**: max-width: 480px
- **Mobile Medium**: max-width: 768px
- **Tablet**: max-width: 1024px
- **Desktop**: min-width: 1025px

### Common Devices
- **iPhone SE**: 375×667px
- **iPhone 12/13/14**: 390×844px
- **iPhone 12/13/14 Pro Max**: 428×926px
- **Samsung Galaxy S21**: 360×800px
- **Samsung Galaxy S21 Ultra**: 412×915px
- **Google Pixel 5**: 393×851px
- **iPad Mini**: 768×1024px
- **iPad Air/Pro**: 820×1180px
- **iPad Pro 12.9"**: 1024×1366px
- **Samsung Galaxy Tab**: 800×1280px
- **iPhone 5/SE (old)**: 320×568px
- **Small Android**: 360×640px

## Detailed Results

### HTML Files
### ✅ analytics.html
- No issues found

### ✅ chat.html
- No issues found

### ✅ coach-dashboard.html
- No issues found

### ✅ coach.html
- No issues found

### ⚠️ community.html
- **Viewport**: ✅ Present
  - Content: `<meta name="viewport" content="width=device-width, initial-scale=1.0">`

**Warnings (1):**
- Images may not be responsive (missing srcset/sizes)


### ✅ dashboard-kraken-style.html
- No issues found

### ✅ dashboard.html
- No issues found

### ✅ exercise-library.html
- No issues found

### ✅ index.html
- No issues found

### ✅ login.html
- No issues found

### ✅ qb-assessment-tools.html
- No issues found

### ✅ qb-throwing-tracker.html
- No issues found

### ✅ qb-training-schedule.html
- No issues found

### ✅ register.html
- No issues found

### ✅ reset-password.html
- No issues found

### ⚠️ roster.html
- **Viewport**: ✅ Present
  - Content: `<meta name="viewport" content="width=device-width, initial-scale=1.0">`

**Warnings (1):**
- May contain fixed widths (check for responsive issues)


### ✅ settings.html
- No issues found

### ✅ test-dashboard.html
- No issues found

### ✅ tournaments.html
- No issues found

### ✅ training-schedule.html
- No issues found

### ✅ training.html
- No issues found

### ✅ update-roster-data.html
- No issues found

### ✅ workout.html
- No issues found


### CSS Files
### ❌ src/comprehensive-design-system.css
- **Media Queries**: 6 total
  - Mobile: 0
  - Tablet: 0
  - Desktop: 1

**Issues (4):**
- No mobile breakpoints (max-width: 768px)
- Button height 28px is below 44px minimum touch target
- Button height 36px is below 44px minimum touch target
- Inputs may not have 16px font-size (prevents zoom on iOS)

**Warnings (2):**
- No tablet breakpoints (max-width: 1024px)
- Sidebar may not be properly hidden/transformed on mobile


### ⚠️ src/dark-theme.css
- **Media Queries**: 5 total
  - Mobile: 1
  - Tablet: 0
  - Desktop: 0

**Warnings (1):**
- No tablet breakpoints (max-width: 1024px)


### ❌ src/hover-effects.css
- **Media Queries**: 2 total
  - Mobile: 0
  - Tablet: 0
  - Desktop: 0

**Issues (2):**
- No mobile breakpoints (max-width: 768px)
- Inputs may not have 16px font-size (prevents zoom on iOS)

**Warnings (2):**
- No tablet breakpoints (max-width: 1024px)
- Sidebar may not be properly hidden/transformed on mobile


### ❌ src/icon-system.css
- **Media Queries**: 2 total
  - Mobile: 0
  - Tablet: 0
  - Desktop: 1

**Issues (6):**
- No mobile breakpoints (max-width: 768px)
- Button height 24px is below 44px minimum touch target
- Button height 32px is below 44px minimum touch target
- Button height 40px is below 44px minimum touch target
- Button height 36px is below 44px minimum touch target
- Inputs may not have 16px font-size (prevents zoom on iOS)

**Warnings (2):**
- No tablet breakpoints (max-width: 1024px)
- Sidebar may not be properly hidden/transformed on mobile


### ⚠️ src/light-theme.css
- **Media Queries**: 2 total
  - Mobile: 1
  - Tablet: 0
  - Desktop: 0

**Warnings (1):**
- No tablet breakpoints (max-width: 1024px)


### ❌ src/modern-design-system.css
- **Media Queries**: 3 total
  - Mobile: 2
  - Tablet: 1
  - Desktop: 0

**Issues (2):**
- Button height 12px is below 44px minimum touch target
- Button height 40px is below 44px minimum touch target


### ❌ src/ui-design-system.css
- **Media Queries**: 9 total
  - Mobile: 5
  - Tablet: 3
  - Desktop: 0

**Issues (6):**
- Button height 24px is below 44px minimum touch target
- Button height 32px is below 44px minimum touch target
- Button height 40px is below 44px minimum touch target
- Button height 32px is below 44px minimum touch target
- Button height 16px is below 44px minimum touch target
- Inputs may not have 16px font-size (prevents zoom on iOS)

**Warnings (2):**
- Font size font-size: 10px is below 12px minimum
- Font size font-size: 11px is below 12px minimum


