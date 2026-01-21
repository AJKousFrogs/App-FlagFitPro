# PrimeNG Refactor - Testing Checklist

**Date:** 2025-01-XX  
**Purpose:** Comprehensive testing checklist for PrimeNG refactor changes

---

## 🧪 Pre-Testing Setup

- [ ] Ensure all dependencies are installed (`npm install`)
- [ ] Run build to verify no compilation errors (`npm run build`)
- [ ] Clear browser cache and test in fresh browser session
- [ ] Test in multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test with screen reader enabled (NVDA, JAWS, or VoiceOver)

---

## ✅ Accessibility Testing

### Form Components

#### Select Components (70 components)
- [ ] All Select components have visible labels
- [ ] All Select components are keyboard navigable (Tab, Arrow keys, Enter)
- [ ] Screen reader announces Select labels correctly
- [ ] Screen reader announces selected value
- [ ] Screen reader announces placeholder text when empty
- [ ] Error messages are announced when validation fails
- [ ] Focus is visible on Select components
- [ ] Select dropdown opens with keyboard (Space/Enter)

**Test Files:**
- `game-tracker.component.html` - 13 Select components
- `onboarding.component.ts` - 10 Select components
- `coach/ai-scheduler/ai-scheduler.component.ts` - 3 Select components
- `coach/player-development/player-development.component.ts` - 6 Select components
- `coach/injury-management/injury-management.component.ts` - 6 Select components
- `staff/physiotherapist/physiotherapist-dashboard.component.ts` - 3 Select components
- `coach/team-management/team-management.component.ts` - 2 Select components
- `exercisedb/exercisedb-manager.component.ts` - 6 Select components
- `admin/superadmin-dashboard.component.ts` - 2 Select components
- `staff/decisions/review-decision-dialog.component.ts` - 1 Select component
- `settings/settings.component.html` - 1 Select component
- `staff/decisions/create-decision-dialog.component.ts` - 3 Select components
- `roster/components/roster-player-form-dialog.component.ts` - 2 Select components
- `travel/travel-recovery/travel-recovery.component.ts` - 2 Select components
- `training/video-curation/components/video-curation-playlist-dialog.component.ts` - 1 Select component

#### InputNumber Components (20 components)
- [ ] All InputNumber components have visible labels
- [ ] All InputNumber components are keyboard navigable
- [ ] Screen reader announces InputNumber labels correctly
- [ ] Screen reader announces current value
- [ ] Increment/decrement buttons are keyboard accessible
- [ ] Min/max validation works correctly
- [ ] Error messages are announced when validation fails

**Test Files:**
- `game-tracker.component.html` - 6 InputNumber components
- `wellness/wellness.component.ts` - 10 InputNumber components
- `roster/components/roster-player-form-dialog.component.ts` - 1 InputNumber component
- `travel/travel-recovery/travel-recovery.component.ts` - 3 InputNumber components

#### DatePicker Components (10 components)
- [ ] All DatePicker components have visible labels
- [ ] All DatePicker components are keyboard navigable
- [ ] Screen reader announces DatePicker labels correctly
- [ ] Calendar popup is keyboard navigable
- [ ] Date selection works with keyboard
- [ ] Error messages are announced when validation fails

**Test Files:**
- `coach/player-development/player-development.component.ts` - 1 DatePicker
- `coach/injury-management/injury-management.component.ts` - 1 DatePicker
- `staff/decisions/review-decision-dialog.component.ts` - 1 DatePicker
- `onboarding/onboarding.component.ts` - 3 DatePicker components
- `travel/travel-recovery/travel-recovery.component.ts` - 4 DatePicker components

#### MultiSelect Components (6 components)
- [ ] All MultiSelect components have visible labels
- [ ] All MultiSelect components are keyboard navigable
- [ ] Screen reader announces MultiSelect labels correctly
- [ ] Selected items are announced
- [ ] Chip removal is keyboard accessible
- [ ] Error messages are announced when validation fails

**Test Files:**
- `training/video-suggestion/video-suggestion.component.ts` - 2 MultiSelect components
- `exercisedb/exercisedb-manager.component.ts` - 2 MultiSelect components
- `training/video-curation/components/video-curation-playlist-dialog.component.ts` - 2 MultiSelect components

### Buttons (9 components)
- [ ] All icon-only buttons have `aria-label` or `ariaLabel`
- [ ] Screen reader announces button purpose
- [ ] Buttons are keyboard accessible (Tab, Enter, Space)
- [ ] Focus is visible on buttons
- [ ] Loading states are announced

**Test Files:**
- `training/ai-training-companion.component.ts`
- `training/daily-protocol/components/protocol-block.component.ts`
- `staff/decisions/create-decision-dialog.component.ts`
- `roster/components/roster-player-form-dialog.component.ts`
- `coach/coach.component.ts`

### Checkboxes (4 components)
- [ ] All checkboxes have proper label associations
- [ ] Screen reader announces checkbox labels
- [ ] Checkbox state (checked/unchecked) is announced
- [ ] Keyboard navigation works (Tab, Space)

**Test Files:**
- `auth/login/login.component.ts`
- `training/daily-protocol/components/protocol-block.component.ts`
- `workout/workout.component.ts`
- `training/training-schedule/training-schedule.component.ts`

---

## 🎨 Visual & Functional Testing

### Form Functionality
- [ ] All forms submit correctly
- [ ] Form validation works as expected
- [ ] Error messages display correctly
- [ ] Form error summary component works (where implemented)
- [ ] Required field indicators (*) are visible
- [ ] Placeholder text displays correctly
- [ ] Help text/hints display correctly

### Component Behavior
- [ ] Select dropdowns open and close correctly
- [ ] Select filtering works (where implemented)
- [ ] MultiSelect chip display works correctly
- [ ] DatePicker calendar opens and closes correctly
- [ ] InputNumber increment/decrement works
- [ ] All form values persist correctly
- [ ] Form reset works correctly

### Visual Consistency
- [ ] All form fields have consistent spacing
- [ ] All form fields have consistent sizing
- [ ] Error states are visually consistent
- [ ] Focus states are visually consistent
- [ ] Disabled states are visually consistent

---

## ⚡ Performance Testing

### Virtual Scrolling (5 tables)
- [ ] Tables with >50 rows use virtual scrolling
- [ ] Virtual scrolling performs smoothly
- [ ] Pagination works correctly with virtual scrolling
- [ ] Sorting works correctly with virtual scrolling
- [ ] Filtering works correctly with virtual scrolling
- [ ] No performance degradation with large datasets

**Test Files:**
- `coach/coach.component.ts` - Team members table
- `staff/physiotherapist/physiotherapist-dashboard.component.ts` - Athletes table
- `coach/injury-management/injury-management.component.ts` - History table
- `admin/superadmin-dashboard.component.ts` - Users table
- `admin/superadmin-dashboard.component.ts` - Teams table

### Load Testing
- [ ] Forms load quickly (< 1 second)
- [ ] Large tables render smoothly
- [ ] No memory leaks during extended use
- [ ] Change detection is optimized (OnPush where applicable)

---

## 🔍 Browser Compatibility

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Browsers
- [ ] iOS Safari
- [ ] Chrome Mobile
- [ ] Samsung Internet

### Screen Readers
- [ ] NVDA (Windows)
- [ ] JAWS (Windows)
- [ ] VoiceOver (macOS/iOS)
- [ ] TalkBack (Android)

---

## 📱 Responsive Testing

- [ ] Forms work correctly on mobile devices
- [ ] Select dropdowns are usable on touch devices
- [ ] DatePicker calendar is usable on mobile
- [ ] Tables are scrollable on mobile
- [ ] Form fields are appropriately sized for mobile
- [ ] Error messages are readable on mobile

---

## 🐛 Regression Testing

### Critical User Flows
- [ ] User registration flow
- [ ] User login flow
- [ ] Player roster management
- [ ] Training session creation
- [ ] Game tracking
- [ ] Wellness check-in
- [ ] Injury reporting
- [ ] Settings updates

### Form-Specific Flows
- [ ] Create new player form
- [ ] Edit player form
- [ ] Create training session form
- [ ] Create decision form
- [ ] Review decision form
- [ ] Travel recovery planning form
- [ ] Video playlist creation form

---

## 🔧 Automated Testing

### Unit Tests
- [ ] Run existing unit tests (`npm test`)
- [ ] All tests pass
- [ ] No new test failures introduced

### E2E Tests
- [ ] Run E2E tests (if available)
- [ ] Critical user flows pass
- [ ] Form submissions work correctly

### Linting
- [ ] Run linter (`npm run lint`)
- [ ] No new linting errors
- [ ] Code follows project standards

---

## 📋 Manual Test Scenarios

### Scenario 1: Create New Player
1. Navigate to Roster page
2. Click "Add Player" button
3. Fill out form fields:
   - Name (required)
   - Position (Select - required)
   - Jersey Number (required)
   - Age (InputNumber - optional)
   - Status (Select - optional)
4. Verify all fields are accessible via keyboard
5. Verify screen reader announces labels
6. Submit form
7. Verify success message
8. Verify player appears in roster

### Scenario 2: Filter Videos
1. Navigate to Video Curation page
2. Use position filter (Select)
3. Use status filter (Select)
4. Verify filters work correctly
5. Verify filters are keyboard accessible
6. Verify screen reader announces filter changes

### Scenario 3: Create Training Session
1. Navigate to Coach Dashboard
2. Click "Create Session"
3. Fill out form:
   - Title (InputText)
   - Type (Select)
   - Date & Time (DatePicker)
   - Duration (InputNumber)
   - Location (InputText)
4. Verify all fields accessible
5. Submit form
6. Verify session created

### Scenario 4: Large Table Performance
1. Navigate to Coach Dashboard
2. Verify team members table loads
3. If >50 members, verify virtual scrolling active
4. Test pagination
5. Test sorting
6. Verify smooth scrolling performance

---

## ✅ Sign-Off Checklist

- [ ] All accessibility tests passed
- [ ] All functional tests passed
- [ ] All performance tests passed
- [ ] All browser compatibility tests passed
- [ ] All responsive tests passed
- [ ] All regression tests passed
- [ ] Code review completed
- [ ] Documentation reviewed
- [ ] Ready for production deployment

---

## 📝 Test Results Template

```
Test Date: ___________
Tester: ___________
Browser: ___________
Screen Reader: ___________

Component: ___________
Status: [ ] Pass [ ] Fail [ ] N/A
Notes: ___________

[Repeat for each component]
```

---

## 🚨 Known Issues

_List any known issues found during testing here_

---

## 📚 References

- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/?currentsidebar=%23col_customize&levels=aaa)
- [PrimeNG Accessibility Guide](https://primeng.org/accessibility)
- [Angular Accessibility Guide](https://angular.io/guide/accessibility)
