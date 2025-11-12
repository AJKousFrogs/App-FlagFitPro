# Mobile Navigation Wireframes Documentation

## Page Overview

Comprehensive mobile navigation patterns for the FlagFit Pro Training App, including hamburger menus, drawer navigation, bottom tabs, and swipe gestures optimized for one-handed operation.

## Mobile Navigation System

### **Hamburger Menu & Navigation Drawer**

```
┌─────────────────────────────────────┐ ← iPhone 14 Pro (393×852)
│ ☰ MERLINS PLAYBOOK    🔍 👤        │
├─────────────────────────────────────┤
│                                     │
│ 🏈 Hawks • 7.8 Chemistry           │
│ vs Eagles Tomorrow • 🌤️ 75°F        │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │          Main Content           │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘

```

### **Navigation Drawer (Open State)**

```
┌─────────────────────────────────────┐
│ ┌─────────────────────┐ │           │
│ │ 👤 Alex Rivera      │ │           │
│ │ QB/WR • Level 8     │ │           │
│ │ 🔥 7 day streak     │ │           │
│ ├─────────────────────┤ │           │
│ │                     │ │           │
│ │ 🏠 Dashboard        │ │           │
│ │ 📊 Performance      │ │           │
│ │ 🏃 Training         │ │           │
│ │   ├ Route Running   │ │           │
│ │   ├ Plyometrics    │ │           │
│ │   ├ Speed Training  │ │           │
│ │   └ Strength        │ │           │
│ │ 👥 Community (3)    │ │           │
│ │   ├ Team Chat       │ │           │
│ │   ├ QB/WR Squad     │ │           │
│ │   └ Coach Corner    │ │           │
│ │ 🏆 Tournaments      │ │           │
│ │ 👤 Profile          │ │           │
│ │                     │ │           │
│ │ ⚙️ Settings         │ │           │
│ │ 🚪 Sign Out         │ │           │
│ └─────────────────────┘ │           │
│        ← Swipe to close │           │
└─────────────────────────────────────┘
```

### **Bottom Tab Navigation (Alternative)**

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│          Main Content Area          │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ 🏠     📊     🏃     👥     👤    │
│Home  Stats  Train  Team  Profile   │
└─────────────────────────────────────┘
```

### **Mobile Search Interface**

```
┌─────────────────────────────────────┐
│ ← Search                         ✕  │
├─────────────────────────────────────┤
│ 🔍 [Search drills, stats, players] │ ← Auto-focus input
├─────────────────────────────────────┤
│                                     │
│ 🔥 Recent Searches                  │
│ • Route running drills              │
│ • Mike Johnson stats               │
│ • QB pocket presence               │
│                                     │
│ ⚡ Quick Links                      │
│ 🏃 Start Training                   │
│ 💬 Team Chat                        │
│ 📊 My Performance                   │
│ 🏆 Next Tournament                  │
│                                     │
│ 📱 Voice Search                     │
│ [Hold to speak]                     │
│                                     │
└─────────────────────────────────────┘
```

## **Touch Interaction Patterns**

### **Swipe Gestures**

```
┌─────────────────────────────────────┐
│ ← Swipe Left: Previous Page         │
│                                     │
│         Current Page Content        │
│                                     │
│ Swipe Right: Next Page →           │
└─────────────────────────────────────┘

Gesture Actions:
• Swipe left on nav items: Quick actions
• Swipe right: Open navigation drawer
• Swipe up: Refresh content
• Swipe down: Close modal/sheet
• Long press: Context menu
```

### **Pull-to-Refresh**

```
┌─────────────────────────────────────┐
│          ↓ Pull to refresh          │
├─────────────────────────────────────┤
│ 🔄 Loading...                       │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Updated Content                 │ │
│ │ Last updated: Just now          │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

## **Mobile Form Optimization**

### **Login Form Mobile**

```
┌─────────────────────────────────────┐
│ ← Back                              │
├─────────────────────────────────────┤
│                                     │
│          Welcome Back! 🏈           │
│     Ready to dominate today?        │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📧 Email                        │ │
│ │ [alex.rivera@email.com        ] │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🔒 Password                     │ │
│ │ [••••••••••••••••••••••••••••] 👁│ │
│ └─────────────────────────────────┘ │
│                                     │
│ ☑️ Remember me                      │
│ Forgot Password?                    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │         🔐 Login                │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ──────────── or ────────────        │
│                                     │
│ [Google] [Apple] [👆 Touch ID]      │
│                                     │
│ New here? Create Account            │
│                                     │
└─────────────────────────────────────┘
```

### **Mobile Keyboard Considerations**

```
┌─────────────────────────────────────┐
│ Form Content (compressed)           │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Active Input Field              │ │
│ │ [typing here...               ] │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Q W E R T Y U I O P                 │ ← iOS/Android Keyboard
│  A S D F G H J K L                  │
│   Z X C V B N M                     │
│        [space]                      │
└─────────────────────────────────────┘

Auto-scroll behavior:
• Scroll form above keyboard
• Keep submit button visible
• Auto-focus next field
• Remember scroll position
```

## **Mobile Onboarding Flow**

### **Step Progress Indicator**

```
┌─────────────────────────────────────┐
│ ✕ Skip                    Step 2/5  │
├─────────────────────────────────────┤
│ ●●○○○                               │ ← Progress dots
│                                     │
│       🎯 Position Setup             │
│                                     │
│ What's your main position?          │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │         🏈 Quarterback          │ │
│ │           (QB)                  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │       🎯 Wide Receiver          │ │
│ │           (WR)                  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │         🛡️ Defense              │ │
│ │          (DB/S)                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [← Back]              [Continue →] │
└─────────────────────────────────────┘
```

### **Mobile Onboarding Cards**

```
┌─────────────────────────────────────┐
│          Team Chemistry             │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 👥 Mike Johnson (WR)            │ │
│ │ Chemistry: ⭐⭐⭐⭐○              │ │
│ │ [Rate Teamwork] [Skip]          │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ← Swipe for next teammate           │
│                                     │
│ ●○○○ 1 of 4 teammates              │
│                                     │
│ [Complete Later] [Continue]         │
└─────────────────────────────────────┘
```

## **Responsive Breakpoints**

### **Mobile Breakpoints**

- **Small (320px-375px)**: iPhone SE, older Android
- **Medium (375px-414px)**: iPhone 12/13/14, standard Android
- **Large (414px-480px)**: iPhone Plus/Max, large Android
- **Tablet (768px+)**: iPad mini, Android tablets

### **Navigation Adaptations**

```css
/* Small Mobile (320px-375px) */
.nav-mobile-sm {
  font-size: 14px;
  padding: 8px;
  min-touch-target: 44px;
}

/* Medium Mobile (375px-414px) */
.nav-mobile-md {
  font-size: 16px;
  padding: 12px;
  min-touch-target: 48px;
}

/* Large Mobile (414px+) */
.nav-mobile-lg {
  font-size: 18px;
  padding: 16px;
  min-touch-target: 52px;
}
```

## **Accessibility for Mobile**

### **Touch Targets**

- Minimum 44px × 44px touch targets
- 8px spacing between interactive elements
- Visual feedback on touch (ripple effect)
- Haptic feedback for important actions

### **Voice Control Integration**

```
┌─────────────────────────────────────┐
│ 🎤 Voice Commands Active            │
├─────────────────────────────────────┤
│                                     │
│ Say a command:                      │
│ • "Start training"                  │
│ • "Open team chat"                  │
│ • "Show my stats"                   │
│ • "Set timer for 30 minutes"       │
│                                     │
│ [🎤 Listening...]                   │
│                                     │
│ Last command: "Start route running" │
│ ✅ Opening training session...      │
│                                     │
└─────────────────────────────────────┘
```

### **Offline Mode**

```
┌─────────────────────────────────────┐
│ ⚠️ No Internet Connection           │
├─────────────────────────────────────┤
│                                     │
│ 📱 Offline Mode Active              │
│                                     │
│ Available features:                 │
│ • ✅ Training sessions              │
│ • ✅ Timer functions               │
│ • ✅ Progress tracking             │
│ • ❌ Team chat                     │
│ • ❌ Live stats sync              │
│                                     │
│ Data will sync when reconnected     │
│                                     │
│ [Retry Connection]                  │
└─────────────────────────────────────┘
```

## **Mobile Animation Patterns**

### **Page Transitions**

```javascript
// Slide transitions for mobile navigation
const pageTransitions = {
  slideLeft: "transform: translateX(-100%)",
  slideRight: "transform: translateX(100%)",
  slideUp: "transform: translateY(-100%)",
  slideDown: "transform: translateY(100%)",
  fade: "opacity: 0",
};
```

### **Loading States**

```
┌─────────────────────────────────────┐
│ Loading Training Session...         │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │ │ ← Skeleton loading
│ │ ░░░░░░░░░░░░░░                  │ │
│ │                                 │ │
│ │ ░░░░░░░░░░░░░░░░░░░░░░░░        │ │
│ │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 🔄 Preparing your workout...        │
│                                     │
└─────────────────────────────────────┘
```

This mobile navigation system provides comprehensive patterns for one-handed operation, touch-friendly interactions, and seamless user flows across all mobile devices.
