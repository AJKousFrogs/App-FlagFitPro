# Phase 3 Cleanup - In Progress

## ✅ Completed Tasks

### 1. Created Additional Utility CSS Classes ✅
- **File:** `src/css/utilities/inline-styles-replacement.css`
- **Added:** Template literal utilities for common patterns:
  - Recovery activities list styles
  - Training blocks styles
  - Tournament card styles
  - Loading and empty state styles
  - Profile form container styles
  - Video container styles
  - Additional utility classes (u-margin-top-24, u-grid-2-col, bg-surface-secondary, jersey-size-56, etc.)

### 2. Extracted Inline Styles from Template Literals ✅
- ✅ `training.html` - Recovery activities, training blocks, protocol modal styles
- ✅ `tournaments.html` - Loading states, empty states, leaderboard styles, tournament info grid
- ✅ `onboarding.html` - Profile form container styles
- ✅ `roster.html` - Staff card styles, border-top utilities

### 3. Fixed External Links ✅
- ✅ `tests/html-tests/email-test.html` - Added `rel="noopener noreferrer"` to Google Account Settings link
- ✅ `training.html` - YouTube link already has `rel="noopener noreferrer"` ✅
- ✅ Footer social links already have `rel="noopener noreferrer"` ✅

### 4. Added Event Handler for Protocol Modal ✅
- ✅ Added `show-protocol-modal` action handler in `src/js/utils/event-handlers.js`
- ✅ Converted `onclick="showProtocolModal('recovery')"` to `data-action="show-protocol-modal"`

## ⚠️ Remaining Work

### 1. Images
- ⚠️ No `<img>` tags found in HTML files (using data URIs for favicons)
- ✅ `login.html` already has `loading="lazy"` on logo image

### 2. Additional Inline Styles in Template Literals
- ⚠️ `roster.html` - Still has some inline styles in form elements (lines 419-443)
- ⚠️ `roster.html` - "How It Works" section has inline styles (lines 384-406)
- ⚠️ `tournaments.html` - Tournament card header still has dynamic gradient styles (necessary for dynamic colors)
- ⚠️ `tournaments.html` - Tournament info items still have some inline styles for dynamic colors

### 3. ARIA Attributes
- ⚠️ Some form inputs could benefit from additional `aria-describedby` attributes
- ⚠️ Some dynamic content could use `aria-live` regions

## 📊 Impact Summary

### Before Phase 3:
- ❌ Many inline styles in JavaScript template literals
- ❌ Missing utility classes for common patterns
- ⚠️ Some external links missing `rel="noopener noreferrer"`

### After Phase 3 (Partial):
- ✅ **50+ utility classes** added for template literal patterns
- ✅ **4 files** updated with extracted styles
- ✅ **1 external link** fixed
- ✅ **1 event handler** added
- ⚠️ **~20-30 inline styles** remain in template literals (mostly dynamic colors/styles)

## 🎯 Next Steps

1. **Continue extracting inline styles** from remaining template literals
2. **Add more ARIA attributes** for enhanced accessibility
3. **Review dynamic styles** - Some inline styles may be necessary for dynamic content (tournament colors, etc.)

## 📝 Files Modified

### Created/Updated:
- `src/css/utilities/inline-styles-replacement.css` - Added 50+ utility classes
- `PHASE3_PROGRESS.md` - This progress document

### Modified:
- `training.html` - Extracted recovery activities, training blocks, protocol modal styles
- `tournaments.html` - Extracted loading/empty states, leaderboard styles
- `onboarding.html` - Extracted profile form container styles
- `roster.html` - Extracted staff card styles, border utilities
- `src/js/utils/event-handlers.js` - Added protocol modal handler
- `tests/html-tests/email-test.html` - Added rel="noopener noreferrer"

## 🔧 Technical Notes

### Dynamic Styles
Some inline styles are necessary for dynamic content:
- Tournament card headers use dynamic colors based on tournament type
- Some styles depend on runtime data (colors, gradients)
- These should remain inline or be handled via CSS custom properties

### Utility Class Pattern
All utility classes follow the pattern:
- `.u-*` for general utilities
- Component-specific classes for semantic patterns (`.recovery-activities-list`, `.tournament-info-grid`, etc.)

