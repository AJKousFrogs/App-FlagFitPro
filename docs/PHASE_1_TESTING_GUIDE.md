# Phase 1 Testing Guide: Dialog Header Component

## Quick Start

**What to test:** Change Password and Delete Account dialogs in Settings  
**Expected result:** Dialogs look and function exactly as before  
**Time estimate:** 5-10 minutes

---

## Test Environment Setup

1. **Start the application:**
   ```bash
   cd angular
   npm start
   ```

2. **Navigate to Settings:**
   - Go to `/settings` route
   - Or click Settings icon in navigation

---

## Test Case 1: Change Password Dialog

### Steps

1. **Open dialog:**
   - Scroll to "Security" section
   - Click "Change Password" button

2. **Verify header structure:**
   - [ ] Lock icon displays on the left
   - [ ] Title "Change Password" is visible
   - [ ] Subtitle "Update your account password" is visible
   - [ ] Close button (X) displays on the right

3. **Verify styling:**
   - [ ] Icon has green background
   - [ ] Icon color is green
   - [ ] Header has proper spacing
   - [ ] Close button has hover effect

4. **Test interactions:**
   - [ ] Click close button → Dialog closes
   - [ ] Click outside dialog → Dialog closes
   - [ ] Press Escape key → Dialog closes

5. **Test responsive:**
   - [ ] Resize to mobile (< 768px) → Header still readable
   - [ ] Icon doesn't overlap text
   - [ ] Close button stays in top-right corner

### Expected Visual

```
┌─────────────────────────────────────────┐
│  [🔒]  Change Password              [✕] │
│        Update your account password     │
├─────────────────────────────────────────┤
│  Current Password                       │
│  [input field]                          │
│  ...                                    │
└─────────────────────────────────────────┘
```

---

## Test Case 2: Delete Account Dialog (Danger Mode)

### Steps

1. **Open dialog:**
   - Scroll to bottom of "Security" section
   - Click "Delete Account" button (red text)

2. **Verify header structure:**
   - [ ] Trash icon displays on the left
   - [ ] Title "Delete Account" is visible
   - [ ] Subtitle "This action is permanent and irreversible" is visible
   - [ ] Close button (X) displays on the right

3. **Verify danger styling:**
   - [ ] Header has red/pink background gradient
   - [ ] Icon has red background
   - [ ] Icon color is red
   - [ ] Overall "danger" feel maintained

4. **Test interactions:**
   - [ ] Click close button → Dialog closes
   - [ ] Click outside dialog → Dialog closes
   - [ ] Press Escape key → Dialog closes

5. **Test responsive:**
   - [ ] Resize to mobile (< 768px) → Header still readable
   - [ ] Icon doesn't overlap text
   - [ ] Close button stays in top-right corner

### Expected Visual

```
┌─────────────────────────────────────────┐
│  [🗑️]  Delete Account             [✕]  │ ← Red/pink background
│        This action is permanent...      │
├─────────────────────────────────────────┤
│  [Warning content]                      │
│  ...                                    │
└─────────────────────────────────────────┘
```

---

## Browser Testing Matrix

### Required Browsers

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | Latest | [ ] |
| Safari | Latest | [ ] |
| Firefox | Latest | [ ] |

### Mobile Testing

| Device | Browser | Status |
|--------|---------|--------|
| iPhone | Safari | [ ] |
| Android | Chrome | [ ] |

---

## Accessibility Testing

### Keyboard Navigation

1. **Tab through dialog:**
   - [ ] Tab key moves focus to close button
   - [ ] Tab key moves to first input field
   - [ ] Tab cycles through all interactive elements

2. **Escape key:**
   - [ ] Press Escape → Dialog closes

3. **Enter key:**
   - [ ] Focus close button, press Enter → Dialog closes

### Screen Reader Testing (Optional but Recommended)

**macOS VoiceOver:**
```bash
# Enable VoiceOver
Command + F5
```

- [ ] Dialog title announced when opened
- [ ] Close button announced as "Close dialog button"
- [ ] All fields properly labeled

**Windows Narrator:**
- [ ] Same as above

---

## Visual Regression Checklist

Compare screenshots before/after migration:

### Change Password Dialog

- [ ] Header height unchanged
- [ ] Icon size and color unchanged
- [ ] Text alignment unchanged
- [ ] Close button position unchanged
- [ ] Spacing between elements unchanged

### Delete Account Dialog

- [ ] Red background gradient unchanged
- [ ] Icon color (red) unchanged
- [ ] Warning feel maintained
- [ ] All other elements same as above

---

## Common Issues & Solutions

### Issue: Icon doesn't display

**Possible cause:** PrimeIcons not loaded  
**Solution:** Check console for CSS errors, verify PrimeIcons import in angular.json

### Issue: Close button doesn't work

**Possible cause:** Event binding issue  
**Solution:** Check browser console for errors, verify `(close)` event binding

### Issue: Styling looks wrong

**Possible cause:** CSS specificity issue  
**Solution:** Check if settings.component.scss styles are loading

### Issue: Dialog doesn't close on Escape

**Possible cause:** PrimeNG dialog configuration  
**Solution:** This is PrimeNG's default behavior, not related to header component

---

## Performance Testing

### Bundle Size Check

Before running this test, build the app:

```bash
cd angular
npm run build
```

**Expected impact:** < 5KB increase (new component is very small)

### Runtime Performance

- [ ] Dialog opens smoothly (< 100ms)
- [ ] No console errors
- [ ] No memory leaks (open/close dialog 50 times)

---

## Regression Testing

### Unchanged Dialogs (Should Still Work)

These dialogs still use old markup - verify they weren't affected:

- [ ] 2FA Setup dialog
- [ ] Disable 2FA dialog
- [ ] Active Sessions dialog
- [ ] Data Export dialog
- [ ] Request New Team dialog

**Test:** Open each dialog, verify header displays correctly

---

## Sign-Off Checklist

Before approving migration to remaining dialogs:

- [ ] All Test Case 1 steps passed
- [ ] All Test Case 2 steps passed
- [ ] Tested on Chrome, Safari, Firefox
- [ ] Tested on mobile (iOS or Android)
- [ ] Keyboard navigation works
- [ ] No visual regressions
- [ ] No console errors
- [ ] Unchanged dialogs still work

---

## Reporting Issues

If you find any issues, please document:

1. **What dialog:** Change Password or Delete Account
2. **What happened:** Describe the issue
3. **Expected behavior:** What should happen
4. **Browser/device:** Chrome 120 on macOS, etc.
5. **Screenshot:** If visual issue

---

## Success Criteria

✅ **Pass:** Dialogs look and function identically to before migration  
❌ **Fail:** Any visual or functional difference detected

---

## Next Steps After Testing

### If all tests pass:

1. ✅ Approve full migration
2. 📋 Migrate remaining 6 dialogs
3. 📝 Update component documentation

### If issues found:

1. 🐛 Fix issues in dialog-header component
2. 🔄 Re-test
3. ⏸️ Pause migration until resolved

---

## Quick Test Script

For rapid verification:

```markdown
## Quick Test (2 minutes)

1. Open Settings
2. Click "Change Password" → Verify header → Close
3. Click "Delete Account" → Verify red header → Close
4. Resize to mobile → Open both dialogs → Verify headers
5. ✅ Pass if everything looks identical to before
```

---

**Testing Status:** 🟡 Ready for manual testing  
**Tester:** [Your Name]  
**Date Tested:** [Date]  
**Result:** [ ] Pass / [ ] Fail
