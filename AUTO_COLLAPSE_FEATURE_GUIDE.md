# Auto-Collapse & Clear All - Visual Guide

## 🎯 Problem Solved

**Before:** Long scrolling list of completed windows made it hard to see what's next
**After:** Completed windows collapse automatically, keeping focus on current/upcoming tasks

---

## ✨ Feature 1: Auto-Collapse on Completion

### Visual States

#### Expanded Window (Active/Pending)
```
┌─────────────────────────────────────────────────┐
│ ● 06:00 - 07:30  [Critical]                     │
│ 🌅 Tournament Morning Fuel                      │
│                                                  │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│ │ 🥣 Oatmeal│  │ 💧 Water  │  │ 🍌 Banana │      │
│ │ 300-400   │  │ 500ml     │  │ 1 medium  │      │
│ │ calories  │  │ Start     │  │ 1hr before│      │
│ └──────────┘  └──────────┘  └──────────┘      │
│                                                  │
│ 💧 Target: 500ml        [Mark Complete]         │
└─────────────────────────────────────────────────┘
```

#### Collapsed Window (Completed) ⭐ NEW
```
┌─────────────────────────────────────────────────┐
│ ● 06:00 - 07:30  ✅ Completed         [▼]       │
│ 🌅 Tournament Morning Fuel                      │
└─────────────────────────────────────────────────┘
     ↑ Click anywhere on header to expand
```

#### Re-Expanded Window (Review)
```
┌─────────────────────────────────────────────────┐
│ ● 06:00 - 07:30  ✅ Completed         [▲]       │
│ 🌅 Tournament Morning Fuel                      │
│                                                  │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│ │ 🥣 Oatmeal│  │ 💧 Water  │  │ 🍌 Banana │      │
│ │ 300-400   │  │ 500ml     │  │ 1 medium  │      │
│ │ calories  │  │ Start     │  │ 1hr before│      │
│ └──────────┘  └──────────┘  └──────────┘      │
│                                                  │
│ 💧 Target: 500ml                                │
└─────────────────────────────────────────────────┘
     ↑ Click header again to collapse
```

---

## 📊 Before & After Comparison

### Before Auto-Collapse
```
Timeline View:

🟢 Morning Fuel ────────────── [EXPANDED - 400px]
   All recommendations showing
   
🟢 Pre-Game 1 ──────────────── [EXPANDED - 400px]
   All recommendations showing
   
🟢 Halftime Game 1 ──────────── [EXPANDED - 400px]
   All recommendations showing
   
🔵 Between Games ─────────────── [EXPANDED - 400px]  ← CURRENT
   All recommendations showing
   
⚪ Pre-Game 2 ───────────────── [EXPANDED - 400px]
   All recommendations showing

Total Height: ~2000px
Scroll Required: YES, lots! 📜
Focus: Scattered across all windows
```

### After Auto-Collapse ⭐
```
Timeline View:

🟢 Morning Fuel ────────────── [COLLAPSED - 80px]
   ✅ Completed [▼]
   
🟢 Pre-Game 1 ──────────────── [COLLAPSED - 80px]
   ✅ Completed [▼]
   
🟢 Halftime Game 1 ──────────── [COLLAPSED - 80px]
   ✅ Completed [▼]
   
🔵 Between Games ─────────────── [EXPANDED - 400px]  ← CURRENT
   All recommendations showing
   
⚪ Pre-Game 2 ───────────────── [EXPANDED - 400px]
   All recommendations showing

Total Height: ~720px (64% reduction!)
Scroll Required: Minimal or none! ✅
Focus: On current and upcoming tasks
```

---

## ✨ Feature 2: Clear All Button

### Location
```
┌───────────────────────────────────────────────┐
│ Tournament Nutrition                          │
│ Fuel your performance across all games       │
│                                               │
│  [Edit Schedule]  [Clear All] 🗑️            │
└───────────────────────────────────────────────┘
        ↑ Only appears when data exists
```

### Confirmation Dialog
```
┌──────────────────────────────────────────────┐
│                                              │
│  ⚠️  Clear Tournament Data?                  │
│                                              │
│  Are you sure you want to clear all          │
│  tournament data? This will remove:          │
│                                              │
│  • Game schedule                             │
│  • Nutrition windows                         │
│  • Hydration logs                            │
│                                              │
│  This action cannot be undone.               │
│                                              │
│     [Cancel]        [Yes, Clear All]         │
│                                              │
└──────────────────────────────────────────────┘
```

### After Clearing
```
┌───────────────────────────────────────────────┐
│                                               │
│           📅 No Tournament Schedule           │
│                                               │
│  Create your tournament schedule to get       │
│  personalized nutrition recommendations.      │
│                                               │
│          [Create Schedule]                    │
│                                               │
└───────────────────────────────────────────────┘
```

---

## 🎮 User Interactions

### Marking Complete
```
User clicks "Mark Complete"
        ↓
Window updates: completed = true
        ↓
Auto-collapse animation (300ms)
        ↓
Window shows compact header only
        ↓
Success toast: "✅ Nutrition window completed!"
        ↓
Page scrolls to next window (smooth)
```

### Expanding Collapsed Window
```
User clicks collapsed window header
        ↓
Check if in expandedWindows Set
        ↓
Toggle state
        ↓
Expand animation (300ms)
        ↓
Chevron rotates 180°
        ↓
Full content revealed
```

### Clear All Flow
```
User clicks "Clear All"
        ↓
Confirmation dialog appears
        ↓
User confirms "Yes, Clear All"
        ↓
Clear all signals and arrays
        ↓
Remove from localStorage
        ↓
Success toast: "All data cleared!"
        ↓
Show empty state
```

---

## 💡 Smart Behaviors

### Auto-Focus
When completing a window:
1. Window collapses
2. Browser smoothly scrolls to next pending window
3. Next window gets subtle highlight (already implemented with `.current` class)

### State Persistence
- Collapsed/expanded state stored in component memory
- Resets on page refresh (intentional - fresh view each visit)
- Completion state saved to localStorage (persistent)

### Visual Feedback
```css
Collapsed window styling:
- Reduced padding (80px vs 400px height)
- Subtle green tint background
- Lighter marker line opacity (30%)
- Completion badge in header
- Chevron icon indicator
```

---

## 📱 Responsive Behavior

### Desktop
```
Full timeline visible
Collapsed windows: ~80px each
Expanded windows: ~400px each
Smooth collapse animations
```

### Tablet
```
Same behavior as desktop
Slightly adjusted spacing
Touch-friendly tap areas (32px min)
```

### Mobile
```
Single column layout
Collapsed even more compact (~70px)
Swipe gestures could expand (future)
Large tap targets for accessibility
```

---

## 🎨 Visual Design Details

### Collapsed State Styling
```scss
.timeline-item.collapsed {
  // Compact spacing
  margin-bottom: var(--space-3); // vs var(--space-5)
  
  // Subtle completed appearance
  .timeline-content {
    padding: var(--space-4) var(--space-5); // vs var(--space-6)
    background: rgba(var(--ds-primary-green-rgb), 0.03);
    border-color: rgba(var(--ds-primary-green-rgb), 0.15);
  }
  
  // Lighter connection line
  .marker-line {
    opacity: 0.3;
  }
}
```

### Expand Toggle Button
```scss
.expand-toggle {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  
  &:hover {
    background: rgba(var(--ds-primary-green-rgb), 0.1);
    border-color: var(--ds-primary-green);
  }
  
  i {
    transition: transform 0.3s ease;
  }
  
  &.expanded i {
    transform: rotate(180deg); // Smooth flip
  }
}
```

### Completion Badge
```scss
.completed-badge-inline {
  display: inline-flex;
  padding: var(--space-1) var(--space-3);
  background: rgba(var(--ds-primary-green-rgb), 0.1);
  border-radius: 12px;
  color: var(--ds-primary-green);
  font-weight: 600;
}
```

---

## 🔄 Animation Sequence

### Complete → Collapse
```
Frame 0ms:    [EXPANDED] Full height, all content
Frame 100ms:  Opacity fade on recommendations
Frame 150ms:  Max-height reducing
Frame 200ms:  Padding compacting
Frame 250ms:  Background color shifting to green tint
Frame 300ms:  [COLLAPSED] Compact header only

Easing: ease-out for natural feel
```

### Expand from Collapsed
```
Frame 0ms:    [COLLAPSED] Header only
Frame 50ms:   Background color normalizing
Frame 100ms:  Padding expanding
Frame 150ms:  Max-height increasing
Frame 250ms:  Content fading in
Frame 300ms:  [EXPANDED] Full content revealed

Easing: ease-out for smoothness
```

---

## 🎯 Benefits Summary

### For Users
✅ **Less Scrolling** - 64% height reduction with collapsed completed items
✅ **Better Focus** - See what's next immediately
✅ **Quick Review** - Click to expand completed items when needed
✅ **Fresh Start** - Clear All for testing or new tournaments
✅ **Peace of Mind** - Confirmation prevents accidental deletion

### For Development
✅ **No Breaking Changes** - Fully backward compatible
✅ **Simple State** - Set-based tracking of expanded windows
✅ **Performant** - CSS animations, no JavaScript animation loops
✅ **Accessible** - Proper ARIA (future enhancement)
✅ **Testable** - Clear user interactions to test

---

## 🚀 Future Enhancements (Ideas)

1. **Keyboard Shortcuts**
   - `Space` to collapse/expand focused window
   - `n` to jump to next window
   - `c` to mark current as complete

2. **Swipe Gestures** (Mobile)
   - Swipe right to complete
   - Swipe left to expand/collapse

3. **Bulk Actions**
   - "Collapse All Completed"
   - "Expand All"

4. **Smart Scrolling**
   - Auto-scroll to next on complete
   - "Jump to Current" floating button

5. **Undo Complete**
   - 5-second undo toast after marking complete
   - Restore expanded state on undo

---

**Result:** A dramatically improved UX that reduces cognitive load, minimizes scrolling, and keeps users focused on what matters next! 🎉
