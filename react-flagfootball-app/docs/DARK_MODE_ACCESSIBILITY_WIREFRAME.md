# Dark Mode & Accessibility Enhancement Wireframe

## Page Overview
Comprehensive dark mode implementation with advanced accessibility features, high contrast modes, and assistive technology support. This enhancement works across all existing wireframes with adaptive theming and universal design principles.

## **Dark Mode System**

### **Dark Mode Toggle Interface - Desktop**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Logo] MERLINS PLAYBOOK        [🌙 Dark] [🔍] [🔔] [Avatar Menu]         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      🌙 Dark Mode Settings                          │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                                                             │   │   │
│  │  │  🎨 Theme Selection:                                        │   │   │
│  │  │                                                             │   │   │
│  │  │  ┌─────────────────────────────────────────────────────┐   │   │   │
│  │  │  │ ☀️ Light Mode                          [●○○○○○○○]    │   │   │   │ ← Selected state
│  │  │  │ Clean, bright interface for daytime use            │   │   │   │
│  │  │  └─────────────────────────────────────────────────────┘   │   │   │
│  │  │                                                             │   │   │
│  │  │  ┌─────────────────────────────────────────────────────┐   │   │   │
│  │  │  │ 🌙 Dark Mode                           [○○○●○○○○]    │   │   │   │ ← Currently active
│  │  │  │ Easy on eyes, reduced strain for evening training  │   │   │   │
│  │  │  └─────────────────────────────────────────────────────┘   │   │   │
│  │  │                                                             │   │   │
│  │  │  ┌─────────────────────────────────────────────────────┐   │   │   │
│  │  │  │ 🕶️ High Contrast Dark                  [○○○○○●○○]    │   │   │   │
│  │  │  │ Maximum contrast for accessibility compliance      │   │   │   │
│  │  │  └─────────────────────────────────────────────────────┘   │   │   │
│  │  │                                                             │   │   │
│  │  │  ┌─────────────────────────────────────────────────────┐   │   │   │
│  │  │  │ 🌅 Auto Mode                           [○○○○○○●○]    │   │   │   │
│  │  │  │ Switches based on time: Light 6AM-8PM, Dark 8PM-6AM│   │   │   │
│  │  │  └─────────────────────────────────────────────────────┘   │   │   │
│  │  │                                                             │   │   │
│  │  │  Advanced Settings:                                         │   │   │
│  │  │  ┌─────────────────────────────────────────────────────┐   │   │   │
│  │  │  │ 📍 Location-based auto switching: ☑️ Enabled       │   │   │   │ ← Uses sunrise/sunset
│  │  │  │ ⚡ System theme sync: ☑️ Follow OS settings         │   │   │   │
│  │  │  │ 💻 Remember per device: ☑️ Device-specific         │   │   │   │
│  │  │  │ 🔄 Smooth transitions: ☑️ Animated switching       │   │   │   │
│  │  │  └─────────────────────────────────────────────────────┘   │   │   │
│  │  │                                                             │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                                                             │   │   │
│  │  │  🎨 Color Customization:                                    │   │   │
│  │  │                                                             │   │   │
│  │  │  ┌─────────────────────────────────────────────────────┐   │   │   │
│  │  │  │ Primary Accent Color:                               │   │   │   │
│  │  │  │ 🟢 Green (Default)  🔵 Blue  🟣 Purple  🟠 Orange  │   │   │   │ ← Color picker
│  │  │  │ 🔴 Red  🟡 Yellow  ⚫ Custom...                     │   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  │ Background Intensity:                               │   │   │   │
│  │  │  │ Dark ████████████████░░░░ Light (Currently: 85%)   │   │   │   │ ← Slider control
│  │  │  │                                                     │   │   │   │
│  │  │  │ Text Contrast Level:                                │   │   │   │
│  │  │  │ Low ████████████████████ High (Currently: 100%)    │   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  │ Interface Saturation:                               │   │   │   │
│  │  │  │ Muted ████████████░░░░░░ Vibrant (Currently: 65%)  │   │   │   │
│  │  │  └─────────────────────────────────────────────────────┘   │   │   │
│  │  │                                                             │   │   │
│  │  │  Preview:                                                   │   │   │
│  │  │  ┌─────────────────────────────────────────────────────┐   │   │   │
│  │  │  │ 🏈 Your Dashboard Preview                           │   │   │   │ ← Live preview
│  │  │  │ ┌─────────────────────────────────────────────────┐ │   │   │   │
│  │  │  │ │ Performance Stats: 85% completion rate 📊      │ │   │   │   │
│  │  │  │ │ Next Training: Route Running in 2 hours ⏰     │ │   │   │   │
│  │  │  │ │ Team Chemistry: Mike Johnson (8.3/10) 🟢       │ │   │   │   │
│  │  │  │ └─────────────────────────────────────────────────┘ │   │   │   │
│  │  │  └─────────────────────────────────────────────────────┘   │   │   │
│  │  │                                                             │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  [Apply Settings] [Reset to Default] [Export Theme] [Import Theme]  │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### **Mobile Dark Mode Interface**

```
┌─────────────────────────────────────┐
│ ← Back      🌙 Dark Mode Settings   │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🎨 Theme Selection              │ │
│ │                                 │ │
│ │ ☀️ Light Mode         [○]       │ │
│ │ 🌙 Dark Mode          [●]       │ │ ← Active
│ │ 🕶️ High Contrast      [○]       │ │
│ │ 🌅 Auto Mode          [○]       │ │
│ │                                 │ │
│ │ ⚙️ Advanced Options:            │ │
│ │ ☑️ Follow system theme          │ │
│ │ ☑️ Location-based switching     │ │
│ │ ☑️ Smooth transitions           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🎨 Color Customization          │ │
│ │                                 │ │
│ │ Accent Color:                   │ │
│ │ 🟢🔵🟣🟠🔴🟡⚫              │ │ ← Color swatches
│ │                                 │ │
│ │ Background: ████████░░ 80%      │ │ ← Sliders
│ │ Contrast:   ████████████ 100%   │ │
│ │ Saturation: ██████░░░░ 60%      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📱 Preview                      │ │ ← Live preview
│ │ ┌─────────────────────────────┐ │ │
│ │ │ 🏈 Training Dashboard       │ │ │
│ │ │ Stats: 85% completion 📊    │ │ │
│ │ │ Next: Route Running ⏰      │ │ │
│ │ │ Chemistry: High 🟢          │ │ │
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Apply] [Reset] [Share Theme]       │
│                                     │
└─────────────────────────────────────┘
```

## **Advanced Accessibility Features**

### **Accessibility Control Panel**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ♿ Accessibility Control Center                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  🔍 Visual Accessibility                                            │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                                                             │   │   │
│  │  │  📏 Text & Font Controls:                                   │   │   │
│  │  │                                                             │   │   │
│  │  │  Text Size: ████████████░░░░ Large (Currently: 18px)        │   │   │ ← Size slider
│  │  │  Base size: 16px → Adjusted: 18px → Preview: Sample Text    │   │   │
│  │  │                                                             │   │   │
│  │  │  Font Weight: [Regular ▼]                                   │   │   │
│  │  │  Options: Light, Regular, Medium, Semibold, Bold           │   │   │
│  │  │                                                             │   │   │
│  │  │  Line Spacing: ██████████░░░░░░ Comfortable (1.6x)         │   │   │ ← Line height
│  │  │  Standard: 1.4x → Current: 1.6x → Relaxed: 2.0x           │   │   │
│  │  │                                                             │   │   │
│  │  │  Letter Spacing: ████░░░░░░░░░░ Normal (0.02em)            │   │   │ ← Character spacing
│  │  │  Tight: -0.02em → Normal: 0em → Loose: 0.1em              │   │   │
│  │  │                                                             │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                                                             │   │   │
│  │  │  🎨 Color & Contrast:                                       │   │   │
│  │  │                                                             │   │   │
│  │  │  Contrast Mode: [Enhanced ▼]                                │   │   │
│  │  │  • Standard (WCAG AA): 4.5:1 ratio                         │   │   │
│  │  │  • Enhanced (WCAG AAA): 7:1 ratio                          │   │   │ ← Current
│  │  │  • Maximum: 21:1 ratio                                     │   │   │
│  │  │                                                             │   │   │
│  │  │  Color Blind Support:                                       │   │   │
│  │  │  ☑️ Deuteranopia (Green-blind) adjustments                 │   │   │
│  │  │  ☑️ Protanopia (Red-blind) adjustments                     │   │   │
│  │  │  ☑️ Tritanopia (Blue-blind) adjustments                    │   │   │
│  │  │  ☑️ Use patterns instead of color alone                    │   │   │
│  │  │                                                             │   │   │
│  │  │  Visual Indicators:                                         │   │   │
│  │  │  ☑️ Focus outlines: Thick, high contrast                   │   │   │
│  │  │  ☑️ Hover effects: Clear state changes                     │   │   │
│  │  │  ☑️ Selection highlighting: Enhanced visibility            │   │   │
│  │  │  ☑️ Error indicators: Icons + color + text                 │   │   │
│  │  │                                                             │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                                                             │   │   │
│  │  │  🎯 Motion & Animation:                                     │   │   │
│  │  │                                                             │   │   │
│  │  │  Animation Level: [Reduced ▼]                               │   │   │
│  │  │  • Full: All transitions and effects                       │   │   │
│  │  │  • Reduced: Essential animations only                      │   │   │ ← Current
│  │  │  • Minimal: Static interface                               │   │   │
│  │  │  • None: No animations at all                              │   │   │
│  │  │                                                             │   │   │
│  │  │  Specific Controls:                                         │   │   │
│  │  │  ☑️ Disable auto-playing videos                            │   │   │
│  │  │  ☑️ Reduce parallax effects                                │   │   │
│  │  │  ☑️ Simplify transitions                                   │   │   │
│  │  │  ☑️ Pause GIF animations                                   │   │   │
│  │  │                                                             │   │   │
│  │  │  Timing Adjustments:                                        │   │   │
│  │  │  Tooltip delay: ████████░░░░ 800ms (slower)                │   │   │
│  │  │  Menu timeout: ██████████░░ 5sec (extended)               │   │   │
│  │  │  Auto-logout: ████░░░░░░░░ 30min (longer)                 │   │   │
│  │  │                                                             │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### **Screen Reader & Assistive Technology**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     🔊 Screen Reader & Assistive Technology                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  🔊 Screen Reader Optimization                                      │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                                                             │   │   │
│  │  │  Audio Description Settings:                                │   │   │
│  │  │                                                             │   │   │
│  │  │  Verbosity Level: [Detailed ▼]                              │   │   │
│  │  │  • Brief: Essential information only                       │   │   │
│  │  │  • Standard: Standard screen reader output                 │   │   │
│  │  │  • Detailed: Rich context and descriptions                 │   │   │ ← Current
│  │  │  • Training: Extra guidance for learning                   │   │   │
│  │  │                                                             │   │   │
│  │  │  Reading Speed: ██████████░░░░░░ 250 WPM                   │   │   │ ← Speed control
│  │  │  Slow: 150 WPM → Current: 250 WPM → Fast: 400 WPM         │   │   │
│  │  │                                                             │   │   │
│  │  │  Content Priorities:                                        │   │   │
│  │  │  ☑️ Performance data (high priority)                       │   │   │
│  │  │  ☑️ Training instructions (high priority)                  │   │   │
│  │  │  ☑️ Navigation landmarks (medium priority)                 │   │   │
│  │  │  ☐ Decorative elements (skip)                              │   │   │
│  │  │                                                             │   │   │
│  │  │  Sports-Specific Descriptions:                              │   │   │
│  │  │  ☑️ Detailed play descriptions                             │   │   │
│  │  │  ☑️ Position-specific terminology                          │   │   │
│  │  │  ☑️ Performance metric explanations                        │   │   │
│  │  │  ☑️ Field diagram descriptions                             │   │   │
│  │  │                                                             │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                                                             │   │   │
│  │  │  🎮 Alternative Input Methods                               │   │   │
│  │  │                                                             │   │   │
│  │  │  Switch Control Setup:                                      │   │   │
│  │  │  🔘 External Switch 1: [Next Item] [Configure]             │   │   │ ← Hardware switches
│  │  │  🔘 External Switch 2: [Select Item] [Configure]           │   │   │
│  │  │  🔘 External Switch 3: [Go Back] [Configure]               │   │   │
│  │  │                                                             │   │   │
│  │  │  Scan Settings:                                             │   │   │
│  │  │  Scan Speed: ████████░░░░░░ 1.5sec per item               │   │   │ ← Timing control
│  │  │  Loops: ████░░░░░░░░░░ 3 times before timeout             │   │   │
│  │  │  Auto-scan: ☑️ Enabled (starts automatically)             │   │   │
│  │  │                                                             │   │   │
│  │  │  Voice Control:                                             │   │   │
│  │  │  ☑️ Voice navigation enabled                               │   │   │
│  │  │  ☑️ Custom voice commands                                  │   │   │
│  │  │  ☑️ Training session voice control                        │   │   │
│  │  │  ☑️ Performance queries                                    │   │   │
│  │  │                                                             │   │   │
│  │  │  Eye Tracking (Future):                                     │   │   │
│  │  │  ☐ Gaze-based navigation (requires eye tracker)           │   │   │
│  │  │  ☐ Dwell clicking (look to select)                        │   │   │
│  │  │  ☐ Smooth pursuit calibration                             │   │   │
│  │  │                                                             │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## **Cognitive Accessibility Support**

### **Simplified Interface Mode**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          🧠 Cognitive Support Mode                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                     │   │
│  │  🎯 Interface Simplification                                        │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                                                             │   │   │
│  │  │  Complexity Level: [Simplified ▼]                           │   │   │
│  │  │  • Full: All features and options available                │   │   │
│  │  │  • Simplified: Core features only, reduced options         │   │   │ ← Current
│  │  │  • Essential: Basic functionality, minimal choices         │   │   │
│  │  │  • Guided: Step-by-step with help at each stage           │   │   │
│  │  │                                                             │   │   │
│  │  │  Progressive Disclosure:                                    │   │   │
│  │  │  ☑️ Show features gradually                                │   │   │
│  │  │  ☑️ Hide advanced options initially                        │   │   │
│  │  │  ☑️ "Show more" expandable sections                        │   │   │
│  │  │  ☑️ Context-sensitive help                                 │   │   │
│  │  │                                                             │   │   │
│  │  │  Visual Simplification:                                     │   │   │
│  │  │  ☑️ Large, clear buttons (minimum 48px)                   │   │   │
│  │  │  ☑️ High contrast borders                                  │   │   │
│  │  │  ☑️ Consistent color coding                                │   │   │
│  │  │  ☑️ Minimal decorative elements                            │   │   │
│  │  │                                                             │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                                                             │   │   │
│  │  │  📝 Reading & Comprehension Support                        │   │   │
│  │  │                                                             │   │   │
│  │  │  Language Level: [Simple ▼]                                │   │   │
│  │  │  • Technical: Standard sports terminology                  │   │   │
│  │  │  • Simple: Plain language explanations                    │   │   │ ← Current
│  │  │  • Basic: Elementary reading level                        │   │   │
│  │  │  • Picture: Visual symbols with minimal text              │   │   │
│  │  │                                                             │   │   │
│  │  │  Text Enhancements:                                         │   │   │
│  │  │  ☑️ Syllable highlighting                                  │   │   │
│  │  │  ☑️ Reading ruler (focus line)                             │   │   │
│  │  │  ☑️ Word definitions on hover                              │   │   │
│  │  │  ☑️ Audio pronunciation guide                              │   │   │
│  │  │                                                             │   │   │
│  │  │  Content Structure:                                         │   │   │
│  │  │  ☑️ Short paragraphs (max 3 sentences)                    │   │   │
│  │  │  ☑️ Bullet points instead of long text                    │   │   │
│  │  │  ☑️ Visual breaks between sections                        │   │   │
│  │  │  ☑️ Summary boxes for key information                     │   │   │
│  │  │                                                             │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                                                             │   │   │
│  │  │  🧭 Navigation & Memory Support                            │   │   │
│  │  │                                                             │   │   │
│  │  │  Breadcrumb Style: [Visual Trail ▼]                        │   │   │
│  │  │  • Text only: Home > Training > Route Running             │   │   │
│  │  │  • Visual trail: 🏠 → 🏃 → 🎯 (with labels)               │   │   │ ← Current
│  │  │  • Progress bar: ●●●○○ Step 3 of 5                        │   │   │
│  │  │                                                             │   │   │
│  │  │  Memory Aids:                                               │   │   │
│  │  │  ☑️ Recent actions history                                 │   │   │
│  │  │  ☑️ "Where you left off" reminders                        │   │   │
│  │  │  ☑️ Visual landmarks on each page                         │   │   │
│  │  │  ☑️ Consistent layout patterns                             │   │   │
│  │  │                                                             │   │   │
│  │  │  Error Prevention:                                          │   │   │
│  │  │  ☑️ Confirm destructive actions                            │   │   │
│  │  │  ☑️ Auto-save progress frequently                          │   │   │
│  │  │  ☑️ Clear error messages with solutions                   │   │   │
│  │  │  ☑️ Undo actions available                                 │   │   │
│  │  │                                                             │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## **Mobile Accessibility Interface**

### **Mobile Accessibility Quick Settings**

```
┌─────────────────────────────────────┐
│ ← Back      ♿ Accessibility        │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🔍 Vision Support               │ │
│ │                                 │ │
│ │ Text Size:    ████████░░ Large  │ │ ← Quick sliders
│ │ Contrast:     ██████████ High   │ │
│ │ ☑️ High contrast mode           │ │
│ │ ☑️ Color blind adjustments      │ │
│ │ ☐ Magnifier tool                │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🔊 Audio Support                │ │
│ │                                 │ │
│ │ ☑️ Voice over enabled            │ │
│ │ ☑️ Audio descriptions           │ │
│ │ ☑️ Sound effects                │ │
│ │ ☑️ Vibration feedback           │ │
│ │ Reading Speed: ████████░░ Fast  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🎯 Motor Support                │ │
│ │                                 │ │
│ │ ☑️ Large touch targets          │ │
│ │ ☑️ Gesture alternatives         │ │
│ │ ☑️ Voice control                │ │
│ │ ☑️ Switch control               │ │
│ │ Touch Hold: ████████░░ 1.5sec   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🧠 Cognitive Support            │ │
│ │                                 │ │
│ │ ☑️ Simplified interface         │ │
│ │ ☑️ Reading assistance           │ │
│ │ ☑️ Memory aids                  │ │
│ │ ☑️ Error prevention             │ │
│ │ Complexity: [Simple ▼]          │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Save Settings] [Test Interface]    │
│                                     │
└─────────────────────────────────────┘
```

## **Dark Mode Training Interface Example**

### **Training Session in Dark Mode**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Logo] MERLINS PLAYBOOK         🌙     [🔍] [🔔] [Avatar Menu]           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    🏃 Route Running Training                        │   │ ← Dark header
│  ├─────────────────────────────────────────────────────────────────────┤   │   with light text
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                                                             │   │   │
│  │  │  ⏱️ Timer: 15:23                                  [⏸️ Pause] │   │   │ ← High contrast
│  │  │  Current Drill: Slant Route (3 of 8 completed)             │   │   │   timer display
│  │  │                                                             │   │   │
│  │  │  ┌─────────────────────────────────────────────────────┐   │   │   │
│  │  │  │ 🏈 Drill Instructions:                              │   │   │   │ ← Darker card
│  │  │  │                                                     │   │   │   │   background
│  │  │  │ 1. Start at the line of scrimmage                  │   │   │   │
│  │  │  │ 2. Run forward 5 yards at 75% speed                │   │   │   │
│  │  │  │ 3. Sharp cut to the right (45° angle)              │   │   │   │
│  │  │  │ 4. Accelerate to full speed for 8 yards            │   │   │   │
│  │  │  │ 5. Look back for the ball                          │   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  │ 🎯 Focus: Sharp cuts, consistent timing            │   │   │   │
│  │  │  │ 📊 Target: Complete in under 3.2 seconds           │   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  └─────────────────────────────────────────────────────┘   │   │   │
│  │  │                                                             │   │   │
│  │  │  ┌─────────────────────────────────────────────────────┐   │   │   │
│  │  │  │ 📊 Performance This Session:                        │   │   │   │ ← Dark chart
│  │  │  │                                                     │   │   │   │   background
│  │  │  │ ┌─────────────────────────────────────────────────┐ │   │   │   │
│  │  │  │ │ Completion Time ┤                               │ │   │   │   │
│  │  │  │ │ 4.0s ┤         ╭─╮                             │ │   │   │   │ ← Light chart
│  │  │  │ │ 3.5s ┤     ╭─╮─╯   ╰─╮                         │ │   │   │   │   lines
│  │  │  │ │ 3.0s ┤ ╭─╮─╯           ╰─╮ ← Target             │ │   │   │   │
│  │  │  │ │ 2.5s ┤─╯                 ╰─                    │ │   │   │   │
│  │  │  │ │      └┬───┬───┬───┬───┬───┬─                   │ │   │   │   │
│  │  │  │ │      R1  R2  R3  R4  R5  R6                   │ │   │   │   │
│  │  │  │ └─────────────────────────────────────────────────┘ │   │   │   │
│  │  │  │                                                     │   │   │   │
│  │  │  │ ✅ Completed: 3/8  🎯 On Target: 2/3  ⚡ Best: 2.8s │   │   │   │ ← Green accents
│  │  │  └─────────────────────────────────────────────────────┘   │   │   │   maintained
│  │  │                                                             │   │   │
│  │  │  [▶️ Start Next Drill] [⏯️ Take Break] [📊 View Details]    │   │   │ ← High contrast
│  │  │                                                             │   │   │   buttons
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                                                             │   │   │
│  │  │  🤖 AI Coach: \"Excellent improvement! Your cutting          │   │   │ ← AI coach with
│  │  │     precision is getting sharper. Try to maintain that     │   │   │   dark background
│  │  │     same energy through the acceleration phase.\"          │   │   │
│  │  │                                                             │   │   │
│  │  │  [💬 Ask Question] [📝 Log Note] [🎯 Request Tip]          │   │   │
│  │  │                                                             │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│ Color Scheme:                                                               │ ← Color legend
│ • Background: #1a1a1a (dark gray)                                          │   for reference
│ • Cards: #2d2d2d (lighter gray)                                            │
│ • Text: #f0f0f0 (light gray)                                               │
│ • Accents: #10b981 (green), #3b82f6 (blue)                                 │
│ • High Contrast: #ffffff on #000000 for critical elements                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## **Technical Implementation Notes**

### **CSS Custom Properties System**
```css
/* Dark mode color variables */
:root[data-theme="dark"] {
  --bg-primary: #1a1a1a;
  --bg-secondary: #2d2d2d;
  --bg-tertiary: #3d3d3d;
  --text-primary: #f0f0f0;
  --text-secondary: #c0c0c0;
  --text-muted: #999999;
  --accent-primary: #10b981;
  --accent-secondary: #3b82f6;
  --border-color: #404040;
  --shadow: rgba(0, 0, 0, 0.5);
}

:root[data-theme="high-contrast-dark"] {
  --bg-primary: #000000;
  --bg-secondary: #1a1a1a;
  --text-primary: #ffffff;
  --accent-primary: #00ff00;
  --border-color: #ffffff;
}
```

### **Accessibility Features Integration**
- Screen reader optimization with semantic HTML
- Keyboard navigation support
- Focus management and trap handling
- ARIA labels and descriptions
- Color blind friendly palettes
- Cognitive load reduction patterns

### **Responsive Dark Mode**
- System preference detection
- Manual toggle with persistence
- Location-based auto-switching
- Per-device preference storage
- Smooth theme transitions

### **Performance Considerations**
- CSS-only theme switching (no JavaScript flicker)
- Optimized re-renders for theme changes
- Efficient color variable management
- Minimal accessibility overhead

This comprehensive dark mode and accessibility system ensures the flag football training app is usable by everyone, regardless of visual abilities, motor skills, or cognitive differences, while providing a comfortable viewing experience in all lighting conditions.