# Responsive Design Testing Checklist

Quick reference for testing responsiveness across devices.

## Pre-Testing Setup

- [ ] Clear browser cache
- [ ] Test in incognito/private mode
- [ ] Use browser DevTools device emulation
- [ ] Test on real devices when possible

---

## Mobile Testing (320px - 768px)

### Viewport & Meta Tags
- [ ] Viewport meta tag present: `width=device-width, initial-scale=1.0`
- [ ] No horizontal scrolling on any page
- [ ] Content fits within viewport without zooming

### Navigation
- [ ] Mobile menu toggle visible and functional
- [ ] Sidebar hidden by default (slides in when opened)
- [ ] Sidebar overlay closes on outside click
- [ ] Navigation items have ≥44px touch targets
- [ ] All navigation links accessible

### Forms & Inputs
- [ ] Input fields have ≥16px font-size (prevents iOS zoom)
- [ ] Form fields don't overflow container
- [ ] Submit buttons have ≥44px touch targets
- [ ] Form validation messages visible
- [ ] Date/time pickers usable on mobile

### Content Layout
- [ ] Text readable without zooming (minimum 14px)
- [ ] Headings scale appropriately
- [ ] Images scale to fit container
- [ ] Cards stack vertically
- [ ] Grids collapse to single column
- [ ] Tables scroll horizontally (if needed)

### Components
- [ ] Modals full-screen on mobile
- [ ] Dropdowns don't overflow viewport
- [ ] Tooltips/tooltips positioned correctly
- [ ] Buttons have adequate spacing
- [ ] Icons properly sized
- [ ] Loading states visible

### Specific Pages
- [ ] Dashboard: Stats cards stack properly
- [ ] Dashboard: Chatbot doesn't overflow
- [ ] Chat: Channels sidebar hidden, messages full-width
- [ ] Tables: Horizontal scroll works smoothly
- [ ] Forms: All fields accessible
- [ ] Profile: Avatar and info stack vertically

---

## Tablet Testing (769px - 1024px)

### Layout
- [ ] Sidebar behavior appropriate (collapsed or visible)
- [ ] Content uses 2-column layouts where appropriate
- [ ] Cards display in 2-column grid
- [ ] No excessive white space
- [ ] Content doesn't stretch too wide

### Navigation
- [ ] Navigation accessible without hamburger menu
- [ ] Sidebar can be toggled if needed
- [ ] Search box usable width
- [ ] Header icons properly spaced

### Content
- [ ] Text readable and properly sized
- [ ] Images display at appropriate size
- [ ] Tables display without horizontal scroll (if possible)
- [ ] Forms use available space efficiently
- [ ] Modals centered and appropriately sized

### Specific Pages
- [ ] Dashboard: 2-column stats grid
- [ ] Chat: Sidebar visible, messages area adequate
- [ ] Tables: Display without scroll (or scrollable)
- [ ] Forms: Multi-column layouts where appropriate

---

## Desktop Testing (1025px+)

### Layout
- [ ] Content max-width respected (no excessive stretching)
- [ ] Sidebar always visible
- [ ] Multi-column grids display properly
- [ ] Cards in grid layouts (3-4 columns)
- [ ] Proper use of white space

### Navigation
- [ ] Full navigation visible
- [ ] Hover states work correctly
- [ ] Dropdowns positioned correctly
- [ ] Search box full-width available

### Content
- [ ] Text readable (not too small or too large)
- [ ] Images display at optimal size
- [ ] Tables display fully without scroll
- [ ] Forms use multi-column layouts
- [ ] Modals centered and appropriately sized

### Specific Pages
- [ ] Dashboard: Full grid layouts
- [ ] Chat: Sidebar + messages side-by-side
- [ ] Tables: Full width display
- [ ] Forms: Optimal multi-column layouts

---

## Cross-Device Issues to Check

### Common Problems
- [ ] **Horizontal Scroll:** No horizontal scrolling on any device
- [ ] **Content Overflow:** All content visible without scrolling
- [ ] **Touch Targets:** All interactive elements ≥44px on mobile
- [ ] **Font Sizes:** Text readable without zooming
- [ ] **Image Scaling:** Images scale properly, don't overflow
- [ ] **Form Usability:** Forms usable without zoom (16px+ font-size)
- [ ] **Modal Behavior:** Modals appropriate size for device
- [ ] **Navigation:** Navigation accessible on all devices
- [ ] **Loading States:** Loading indicators visible and properly sized
- [ ] **Error States:** Error messages visible and readable

### Breakpoint Transitions
- [ ] Smooth transitions between breakpoints
- [ ] No layout jumps or shifts
- [ ] Content reflows naturally
- [ ] No content hidden at breakpoints
- [ ] Consistent behavior at breakpoint edges

---

## Device-Specific Testing

### iOS (Safari)
- [ ] No zoom on input focus (16px+ font-size)
- [ ] Safe area respected (notch/status bar)
- [ ] Touch scrolling smooth
- [ ] Pull-to-refresh doesn't break layout

### Android (Chrome)
- [ ] Address bar doesn't cover content
- [ ] Touch scrolling smooth
- [ ] Keyboard doesn't cover inputs
- [ ] Back button works correctly

### Tablet-Specific
- [ ] Portrait orientation works
- [ ] Landscape orientation works
- [ ] Rotation doesn't break layout
- [ ] Keyboard doesn't cover content

---

## Performance Checks

- [ ] Page loads quickly on mobile networks
- [ ] Images lazy-load properly
- [ ] No layout shift (CLS) during load
- [ ] Smooth scrolling performance
- [ ] Animations perform well

---

## Accessibility Checks

- [ ] Focus indicators visible
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast sufficient
- [ ] Text scalable without breaking layout

---

## Quick Test URLs

Test these specific pages for common issues:

1. **Dashboard:** `/dashboard.html` - Check chatbot, stats grid, sidebar
2. **Chat:** `/chat.html` - Check sidebar, message input, channels
3. **Tables:** `/roster.html` - Check horizontal scroll, responsive table
4. **Forms:** `/register.html`, `/login.html` - Check input sizes, validation
5. **Profile:** `/profile.html` - Check avatar, stats, tabs
6. **Analytics:** `/analytics.html` - Check charts, data tables

---

## Browser DevTools Testing

### Chrome DevTools
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test these viewports:
   - iPhone SE (375px)
   - iPhone 12 Pro (390px)
   - iPad (768px)
   - iPad Pro (1024px)
   - Desktop (1280px+)

### Firefox DevTools
1. Open DevTools (F12)
2. Click responsive design mode icon
3. Test same viewports as Chrome

---

## Real Device Testing Priority

1. **Critical:** iPhone (Safari), Android Phone (Chrome)
2. **Important:** iPad (Safari), Android Tablet (Chrome)
3. **Nice to have:** Various screen sizes and orientations

---

## Notes

- Test in both portrait and landscape orientations
- Test with keyboard visible/hidden on mobile
- Test with different font size settings
- Test with reduced motion preferences
- Test with high contrast mode
- Test with screen readers

---

## Reporting Issues

When reporting responsive issues, include:
1. Device/browser/OS
2. Viewport dimensions
3. Screenshot or screen recording
4. Steps to reproduce
5. Expected vs actual behavior
6. Console errors (if any)

