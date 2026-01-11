# UI Consistency Fixes - January 11, 2026

## Summary
Systematic fixes applied to eliminate hover flashing, layout jitter, and baseline misalignment issues across the Settings screen and app-wide components.

## Issues Fixed

### 1. Settings Navigation Buttons - Hover Jitter ✅
**Problem**: Border width changed from `var(--border-1)` (1px) to 2px on hover, causing layout shift.

**Fix Applied** (`settings.component.scss`):
- Changed default border from `border: var(--border-1) solid transparent` to `border: 2px solid transparent`
- Hover state now only changes `border-color`, not `border-width`
- Added explicit transition properties (removed `opacity` which wasn't needed)

**Result**: No layout shift on hover, smooth color transition only.

---

### 2. Theme Selector Buttons - Redundant Border Radius ✅
**Problem**: Border radius was being re-specified in `:hover` and `.active` states unnecessarily.

**Fix Applied** (`settings.component.scss`):
- Removed redundant `border-radius` declarations from hover/active states
- Border inherits from base style (DRY principle)
- Ensured border-width stays constant (2px) across all states

**Result**: Cleaner code, no visual change, improved maintainability.

---

### 3. Notification Items - Incomplete Transitions ✅
**Problem**: Only `background-color` was transitioned, leading to jarring changes if border/shadow were added later.

**Fix Applied** (`settings.component.scss`):
- Added constant `border: 2px solid transparent` to prevent future layout shifts
- Added comprehensive transition list: `background-color`, `border-color`, `box-shadow`, `transform`
- Hover state now has explicit comment that border stays transparent (unless design changes)

**Result**: Future-proof against layout shifts, smooth transitions.

---

### 4. Security Items - Same as Notification Items ✅
**Problem**: Only transitioned `background-color`.

**Fix Applied** (`settings.component.scss`):
- Added constant `border: 2px solid transparent`
- Added full transition properties
- Documented with inline comments

**Result**: Consistent hover behavior across all interactive rows.

---

### 5. Button Height Alignment - Already Correct ✅
**Status**: No changes needed - already using locked geometry.

**Verification**:
- Button component uses fixed `height: var(--button-height-md)` (44px)
- Not using `min-height` which could cause expansion
- All size variants (sm/md/lg) have locked heights
- Padding is horizontal-only to prevent vertical shifts

**Result**: Buttons already meet design system standards.

---

### 6. Text Baseline Alignment ✅
**Problem**: Text could shift due to inconsistent line-height and missing explicit values.

**Fix Applied** (`settings.component.scss`):

#### Notification Text:
- Added explicit `line-height: 1` to icon elements
- Added `justify-content: center` to `.notification-text` for vertical centering
- Added explicit `margin: 0; padding: 0;` to labels and descriptions
- Locked line-height values: `1.3` for labels, `1.4` for descriptions

#### Security Info Text:
- Added explicit `padding: 0;` to h4 and p elements
- Ensured consistent line-height: `1.3` for headings, `1.4` for descriptions

**Result**: Text no longer "floats" or shifts between components.

---

### 7. Tooltip Consistency ✅
**Problem**: Missing explicit line-height and text wrapping rules.

**Fix Applied** (`primeng-theme.scss`):
- Added explicit `line-height: 1.5` for readability
- Added `word-wrap: break-word` for proper text wrapping
- Added `white-space: normal` to override any inherited nowrap
- Max-width already set to `280px` (verified)

**Result**: Tooltips are readable, don't overflow, and have consistent spacing.

---

### 8. Spacing Audit ✅
**Problem**: Non-standard spacing values (15px, 18px, 25px, 30px) broke the 8-point grid.

**Fix Applied** (`tailwind.config.js`):
- Documented standard 8-point grid values with comments
- Marked non-standard values as **LEGACY - AVOID IN NEW CODE**
- Added TODO to migrate existing usage to standard values
- Provided alternative standard values for each non-standard one

**Standard Values (Preferred)**:
- `--space-2` = 8px
- `--space-4` = 16px
- `--space-6` = 24px
- `--space-8` = 32px

**Legacy Values (To Be Removed)**:
- `15px` → Use `16px` instead
- `18px` → Use `16px` or `24px` instead
- `25px` → Use `24px` or `32px` instead
- `30px` → Use `32px` instead

**Result**: Spacing scale policy clearly documented, future code will use standard values.

---

## Testing Instructions

### Step 1: Enable Chrome DevTools Overlays

1. Open Chrome DevTools (F12)
2. Open Command Menu (Cmd+Shift+P / Ctrl+Shift+P)
3. Enable these overlays:
   - **Paint flashing**: Type "Show paint flashing rectangles" → Enable
   - **Layout Shift Regions**: Type "Show layout shift regions" → Enable
   - **FPS meter** (optional): Type "Show frames per second" → Enable

### Step 2: Navigate to Test Routes

Test the following screens and interactions:

#### Settings Screen (`/settings`)

1. **Settings Navigation Cards**:
   - Hover over "Account", "Notifications", "Privacy & Security", "Preferences" cards
   - ✅ **Expected**: Smooth color change, no green flash, no layout shift

2. **Notification Settings**:
   - Hover over each notification toggle row (Email, Push, Training Reminders, etc.)
   - ✅ **Expected**: Subtle background color change, no jitter

3. **Theme Selector**:
   - Hover over Light/Dark/Auto buttons
   - Click to select different themes
   - ✅ **Expected**: Border color changes smoothly, no size change

4. **Security Actions**:
   - Hover over "Change Password", "Enable 2FA", "View Sessions", "Delete Account" rows
   - ✅ **Expected**: Background changes smoothly, button sizes stay constant

5. **Tooltips** (if any exist on the page):
   - Hover over info icons or elements with tooltips
   - ✅ **Expected**: Tooltip appears with consistent padding, max-width 280px, text wraps properly

#### Player Dashboard (`/dashboard`)

1. Test any cards with hover states
2. Test button stacks (if showing Change/Enable/View/Delete like in screenshots)
3. Verify metric cards with "Sharing: 0/6 metrics" and time chips

### Step 3: Verify Paint Flashing

**What to Look For**:
- **Green flashes** on hover = Good! This means the element is being repainted.
- **Green flashes EVERYWHERE** = Bad! This means expensive properties are being animated (like shadows with blur, or filters).

**Fixed Elements Should Show**:
- Minimal green flash (only the hovered element and its direct children)
- No cascading flashes to parent containers or siblings
- No flashes when border color changes (we kept border-width constant)

### Step 4: Verify Layout Shift Regions

**What to Look For**:
- **Blue/purple overlay** = Layout shift detected!
- **No overlay** = Good! Element changed without shifting layout.

**Fixed Elements Should Show**:
- NO layout shift regions when hovering over buttons
- NO layout shift regions when hovering over navigation cards
- NO layout shift regions when hovering over notification/security rows

### Step 5: Manual Visual Check

Take "after" screenshots of:
1. Settings navigation cards (default and hover state)
2. Theme selector (all three buttons - default and hover)
3. Notification row (default and hover)
4. Security action row with button (default and hover)

**Compare with "before" screenshots**:
- Buttons should maintain same height/width on hover
- Text should not shift vertically
- Spacing between elements should remain constant

---

## Technical Details

### Hover State Rules Applied

1. **Border Width**: Always constant (2px solid)
   - Default: `border: 2px solid transparent`
   - Hover: `border-color: var(--ds-primary-green)` (width stays 2px)

2. **Transition Properties**: Only safe properties
   ```scss
   transition:
     background-color var(--transition-fast),
     border-color var(--transition-fast),
     box-shadow var(--transition-fast),
     transform var(--transition-fast);
   ```
   - ❌ **Never transition**: `width`, `height`, `padding`, `margin`, `font-size`, `font-weight`
   - ✅ **Safe to transition**: `background-color`, `border-color`, `color`, `opacity`, `transform`, `box-shadow`

3. **Shadow Transitions**: Keep shadows subtle
   - No `shadow-none` → `shadow-xl` jumps
   - Use minimal shadow differences for hover states

4. **Locked Geometry**:
   - All interactive elements have fixed height
   - Padding is consistent across states
   - Border-radius doesn't change
   - Font-size doesn't change

---

## Files Modified

1. `angular/src/app/features/settings/settings.component.scss`:
   - Settings navigation buttons
   - Theme selector buttons
   - Notification items
   - Security items
   - Notification/security text alignment

2. `angular/src/assets/styles/primeng-theme.scss`:
   - Tooltip padding, line-height, text wrapping

3. `tailwind.config.js`:
   - Documented spacing scale
   - Marked non-standard values as legacy

---

## Next Steps (Future Tasks)

### Immediate
- [ ] Test all changes on `/settings` route with Chrome DevTools overlays
- [ ] Capture "after" screenshots for comparison
- [ ] Verify on mobile devices (iPhone 11-17, Samsung S23-S25)

### Short-term
- [ ] Migrate existing usage of 15px/18px/25px/30px spacing to standard 8-point grid
- [ ] Create component showroom route (`/ui-kit`) for visual regression testing
- [ ] Set up Playwright visual snapshots for key components

### Long-term
- [ ] Implement visual regression testing in CI/CD pipeline
- [ ] Create spacing lint rule to prevent non-standard values
- [ ] Audit other pages for similar hover issues (Dashboard, Training, Analytics)

---

## Success Criteria

✅ **All criteria must pass**:

1. No green paint flashing when hovering over interactive elements (except the element itself)
2. No layout shift regions (blue/purple overlays) on hover
3. Buttons maintain consistent height/width across hover states
4. Text alignment stays consistent (no vertical shift)
5. Tooltips have proper padding, max-width, and text wrapping
6. Spacing values documented with clear guidance

---

## Contact

**Issue Tracker**: [Link to issue if applicable]  
**Design System Owner**: @design-system  
**Date Fixed**: January 11, 2026  
**Tested By**: [To be filled after verification]

---

## Appendix: Key Design System Rules

### Border Width Contract
- **Rule**: Border width must remain constant across all states
- **Implementation**: Use `border: 2px solid transparent` by default, change only `border-color` on hover
- **Rationale**: Changing border width causes layout reflow and jitter

### Transition Property Contract
- **Rule**: Only transition properties that don't affect layout
- **Safe List**: `background-color`, `border-color`, `color`, `opacity`, `transform`, `box-shadow`
- **Forbidden**: `width`, `height`, `padding`, `margin`, `font-size`, `font-weight`, `border-width`
- **Rationale**: Layout-affecting properties cause reflow/repaint on every frame

### Spacing Scale Contract
- **Rule**: Use 8-point grid for all spacing
- **Standard Values**: 8px, 16px, 24px, 32px, 48px, 64px, 96px, 128px
- **Enforcement**: Document alternatives for legacy values, lint for violations
- **Rationale**: Consistent spacing creates visual rhythm and reduces decision fatigue

### Text Alignment Contract
- **Rule**: All text elements must have explicit `line-height`, `margin`, and `padding`
- **Implementation**: Use design system tokens, add `margin: 0; padding: 0;` to reset
- **Rationale**: Browser defaults vary, explicit values ensure consistency

---

**Status**: ✅ All fixes applied. Ready for verification.
