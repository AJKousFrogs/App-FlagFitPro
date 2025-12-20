# Phase 2 Cleanup Progress - HTML Codebase

## ✅ Completed Tasks

### 1. Created Centralized Event Handler System ✅
- **Created:** `src/js/utils/event-handlers.js` - Comprehensive event handler system
- **Features:**
  - Sidebar toggle handlers
  - Tab switching handlers
  - Navigation handlers
  - Modal handlers
  - Button action handlers
  - Form handlers (onchange, onsubmit)
  - Utility functions (copyToClipboard, etc.)

### 2. Converted Inline Event Handlers ✅
**Static HTML Handlers Converted:**
- ✅ `training.html` - Sidebar toggle (`onclick="toggleSidebar()"` → `data-sidebar-overlay`)
- ✅ `tournaments.html` - Tab switching (4 buttons: `onclick="switchTab()"` → `data-tab-switch`)
- ✅ `profile.html` - Navigation button (`onclick="window.location.href"` → `data-navigate-to`)
- ✅ `profile.html` - Profile modal handlers (`onclick` → `data-action`)
- ✅ `qb-throwing-tracker.html` - Session buttons (`onclick="logSession()"` → `data-action="log-session"`)
- ✅ `qb-throwing-tracker.html` - Load more button (`onclick="loadMoreSessions()"` → `data-action="load-more"`)
- ✅ `qb-throwing-tracker.html` - Chart update (`onchange="updateCharts()"` → `data-action="update-charts"`)
- ✅ `accept-invitation.html` - Decline button (`onclick="window.location.href"` → `data-action="decline"`)
- ✅ `update-roster-data.html` - Generate code (`onclick="generateCode()"` → `data-action="generate-code"`)
- ✅ `update-roster-data.html` - Copy clipboard (`onclick="copyToClipboard()"` → `data-action="copy-clipboard"`)
- ✅ `team-create.html` - Cancel button (`onclick="window.location.href"` → `data-action="decline"`)
- ✅ `verify-email.html` - Form submit (`onsubmit="handleResend(event)"` → `data-form-submit="handleResend"`)

**Added Event Handler Scripts:**
- ✅ `training.html`
- ✅ `tournaments.html`
- ✅ `profile.html`
- ✅ `qb-throwing-tracker.html`
- ✅ `accept-invitation.html`
- ✅ `update-roster-data.html`
- ✅ `team-create.html`

### 3. Added ARIA Labels ✅
- ✅ Sidebar overlay: `aria-label="Close sidebar"`
- ✅ Tab buttons: `aria-label="Switch to [tab name]"`
- ✅ Navigation buttons: `aria-label="Go to [page]"`
- ✅ Action buttons: `aria-label="[action description]"`
- ✅ Form elements: `aria-label="[purpose]"`

## ⚠️ Remaining Work

### 1. JavaScript-Generated HTML Handlers (Template Literals)
**Files with onclick in template literals:**
- ⚠️ `onboarding.html` - Multiple handlers in JavaScript-generated HTML (lines 646, 662, 667, 672, etc.)
- ⚠️ `roster.html` - Handlers in template literals (line 363, 405, etc.)
- ⚠️ `exercise-library.html` - Handler in error message template (line 222)
- ⚠️ `tournaments.html` - Handlers in tournament card templates (lines 711, 713)
- ⚠️ `qb-training-schedule.html` - Handler in template (line 383)
- ⚠️ `update-roster-data.html` - Handler in template (line 405)

**Recommendation:** These need to be converted in the JavaScript files that generate the HTML, not in the HTML files themselves.

### 2. Missing ARIA Labels
- ⚠️ Many buttons still need `aria-label` attributes
- ⚠️ Form inputs need better `aria-describedby` and `aria-invalid` attributes
- ⚠️ Modal close buttons need `aria-label`

### 3. Images
- ⚠️ No `<img>` tags found in initial search (may be using data URIs or background images)
- Need to check for `<img>` tags and add `loading="lazy"` where appropriate

### 4. External Links
- ⚠️ No external links found in initial search
- Need to verify and add `rel="noopener"` to any external links

## 📊 Impact Summary

### Before Phase 2:
- ❌ **37 files** with inline `onclick` handlers
- ❌ **1 file** with inline `onchange` handler
- ❌ **1 file** with inline `onsubmit` handler
- ❌ **No centralized event handler system**

### After Phase 2 (Partial):
- ✅ **12 static HTML handlers converted** to data attributes
- ✅ **1 onchange handler converted**
- ✅ **1 onsubmit handler converted**
- ✅ **Centralized event handler system created**
- ✅ **7 files** now use the new event handler system
- ⚠️ **~25 handlers** remain in JavaScript-generated HTML (template literals)

## 🎯 Next Steps

1. **Convert JavaScript-Generated Handlers**
   - Update JavaScript files that generate HTML with onclick handlers
   - Replace template literal onclick handlers with data attributes
   - Estimated effort: 10-15 hours

2. **Add Remaining ARIA Labels**
   - Add `aria-label` to all interactive elements
   - Improve form accessibility with `aria-describedby` and `aria-invalid`
   - Estimated effort: 5 hours

3. **Add Image Loading Attributes**
   - Find all `<img>` tags
   - Add `loading="lazy"` where appropriate
   - Estimated effort: 2 hours

4. **Add External Link Security**
   - Find all external links
   - Add `rel="noopener noreferrer"`
   - Estimated effort: 2 hours

## 📝 Files Created/Modified

### Created:
- `src/js/utils/event-handlers.js` - Centralized event handler system
- `PHASE2_CLEANUP_PROGRESS.md` - This progress document

### Modified:
- 8 HTML files (converted inline handlers, added event handler scripts)
- 1 JavaScript file (event-handlers.js - added form handlers)

## ✅ Phase 2 Status: IN PROGRESS

**Completed:** ~30% of Phase 2 tasks
**Remaining:** ~70% (mostly JavaScript-generated HTML handlers)

