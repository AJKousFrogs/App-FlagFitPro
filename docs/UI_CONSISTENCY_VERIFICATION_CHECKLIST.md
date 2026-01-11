# UI Consistency Verification Checklist

## Quick Setup (1 minute)

### Enable Chrome DevTools Overlays
1. Open Chrome DevTools (`F12` or `Cmd+Option+I`)
2. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
3. Type and enable:
   - `Show paint flashing rectangles` → Press Enter
   - `Show layout shift regions` → Press Enter
   - `Show frames per second` → Press Enter (optional)

---

## Test Routes

### 1. Settings Page (`/settings`)

#### Settings Navigation Cards
- [ ] Hover over "Account" card → **Should**: Smooth color change, no green flash cascade, no layout shift
- [ ] Hover over "Notifications" card → **Should**: Same as above
- [ ] Hover over "Privacy & Security" card → **Should**: Same as above
- [ ] Hover over "Preferences" card → **Should**: Same as above

**Pass Criteria**: Only the hovered card shows green flash, no blue/purple layout shift overlay.

---

#### Theme Selector (Preferences Section)
- [ ] Hover over "Light" button → **Should**: Border color changes smoothly, no size change
- [ ] Hover over "Dark" button → **Should**: Same as above
- [ ] Hover over "Auto (System)" button → **Should**: Same as above
- [ ] Click each button to select → **Should**: Active state shows no size/position change

**Pass Criteria**: Buttons stay same size, only colors change, no layout shift.

---

#### Notification Settings
- [ ] Hover over "Email Notifications" row → **Should**: Background lightens smoothly
- [ ] Hover over "Push Notifications" row → **Should**: Same as above
- [ ] Hover over "Training Reminders" row → **Should**: Same as above
- [ ] Hover over any other notification row → **Should**: Same as above

**Pass Criteria**: Smooth background color transition, no jitter, no layout shift.

---

#### Security Section
- [ ] Hover over "Change Password" row → **Should**: Background changes, button stays same size
- [ ] Hover over "Enable/Disable 2FA" row → **Should**: Same as above
- [ ] Hover over "View Sessions" row → **Should**: Same as above
- [ ] Hover over "Delete Account" row (danger variant) → **Should**: Same as above

**Pass Criteria**: Buttons maintain consistent width (120px), no size change on hover.

---

### 2. Player Dashboard (`/dashboard`)

#### Metric Cards
- [ ] Hover over any metric card → **Should**: Subtle lift, no excessive paint flashing
- [ ] Check "Sharing: 0/6 metrics" card → **Should**: Badge stays aligned, no shift

**Pass Criteria**: Cards lift smoothly, badges don't shift position.

---

### 3. Tooltips (App-wide)

#### Settings Tooltips
- [ ] Hover over any info icon with tooltip → **Should**: Max-width 280px, text wraps properly
- [ ] Check tooltip padding → **Should**: Consistent padding (8px vertical, 12px horizontal)
- [ ] Check tooltip readability → **Should**: Line-height 1.5, clear text

**Pass Criteria**: Tooltips don't overflow, text is readable, padding is consistent.

---

## Visual Inspection

### What to Look For

#### Paint Flashing (Green Overlay)
✅ **Good**: Only the hovered element flashes green  
❌ **Bad**: Multiple elements flash, cascading to parent/siblings  
❌ **Bad**: Entire screen flashes on small interactions

#### Layout Shift Regions (Blue/Purple Overlay)
✅ **Good**: No overlay appears on hover  
❌ **Bad**: Blue/purple regions appear when hovering  
❌ **Bad**: Text or buttons shift position

#### Button Consistency
✅ **Good**: All buttons same height in a row  
✅ **Good**: Buttons don't grow/shrink on hover  
✅ **Good**: Text stays vertically centered  
❌ **Bad**: Buttons different heights  
❌ **Bad**: Buttons expand on hover  
❌ **Bad**: Text shifts up/down

#### Text Alignment
✅ **Good**: Labels and descriptions align consistently  
✅ **Good**: Icons align with first line of text  
✅ **Good**: Text doesn't shift when hovering nearby elements  
❌ **Bad**: Text "floats" between components  
❌ **Bad**: Misaligned baselines

---

## Issues Fixed (Verify These)

| Issue | Location | Verification |
|-------|----------|-------------|
| Settings nav hover jitter | Settings page → Navigation cards | No layout shift, only color change |
| Theme selector border jump | Settings → Preferences → Theme buttons | Border stays 2px, only color changes |
| Notification row transitions | Settings → Notifications → Any row | Smooth background transition |
| Security row transitions | Settings → Security → Any action row | Smooth background transition |
| Button baseline alignment | All buttons across app | Same height, vertically centered text |
| Text baseline misalignment | Notification/security rows | Text doesn't shift between rows |
| Tooltip inconsistency | Hover any info icon | Max-width 280px, proper padding, text wraps |
| Non-standard spacing | Check for 15px/18px/25px/30px values | Should use 8-point grid (8/16/24/32px) |

---

## Screenshot Comparison

### Before vs After

Take screenshots of these states:

1. **Settings Navigation**:
   - Default state
   - Hover state

2. **Theme Selector**:
   - All three buttons default
   - Each button hovered

3. **Notification Row**:
   - Default state
   - Hover state

4. **Security Row with Button**:
   - Default state
   - Button hovered

**Compare**: Check that hover state doesn't cause any size/position changes.

---

## Mobile Testing (Optional)

Test on actual devices or Chrome DevTools device emulation:

- iPhone 11 (414x896)
- iPhone 15 Pro Max (430x932)
- Samsung S23 (412x915)
- Samsung S25 Ultra (430x934)

**Check**:
- [ ] Buttons maintain consistent height on mobile
- [ ] Touch feedback works (active state on tap)
- [ ] No layout shifts on touch interactions
- [ ] Text alignment stays consistent

---

## Pass/Fail Criteria

### Overall Pass ✅

All of the following must be true:

1. ✅ No layout shift overlays appear on hover
2. ✅ Paint flashing is minimal (only hovered element)
3. ✅ All buttons maintain consistent height/width
4. ✅ Text alignment is consistent across components
5. ✅ Tooltips have proper max-width and padding
6. ✅ No visual "jitter" or "jumping" on hover

### Overall Fail ❌

If any of the following occur:

1. ❌ Blue/purple layout shift regions appear on hover
2. ❌ Excessive green flashing (cascading to multiple elements)
3. ❌ Buttons change size on hover
4. ❌ Text shifts vertically when hovering nearby elements
5. ❌ Tooltips overflow or have inconsistent padding
6. ❌ Visible jitter or position changes

---

## Report Template

```
## Verification Results - [Date]

**Tester**: [Your Name]
**Browser**: Chrome [Version]
**OS**: [macOS/Windows/Linux]

### Settings Navigation Cards
- Status: [ ] Pass / [ ] Fail
- Notes: 

### Theme Selector
- Status: [ ] Pass / [ ] Fail
- Notes: 

### Notification Rows
- Status: [ ] Pass / [ ] Fail
- Notes: 

### Security Rows
- Status: [ ] Pass / [ ] Fail
- Notes: 

### Tooltips
- Status: [ ] Pass / [ ] Fail
- Notes: 

### Overall Result
- Status: [ ] PASS / [ ] FAIL
- Screenshots attached: [ ] Yes / [ ] No
```

---

## Next Actions

### If Tests Pass ✅
1. Commit changes with message: `fix(ui): eliminate hover jitter and layout shifts`
2. Create PR with link to `docs/UI_CONSISTENCY_FIXES.md`
3. Deploy to staging for QA review
4. Monitor for any regressions

### If Tests Fail ❌
1. Document which specific test failed
2. Capture screenshot/video showing the issue
3. Check browser console for errors
4. Review the specific component's styles
5. Report findings for additional fixes

---

**Document**: `docs/UI_CONSISTENCY_VERIFICATION_CHECKLIST.md`  
**Related**: `docs/UI_CONSISTENCY_FIXES.md`  
**Date**: January 11, 2026
