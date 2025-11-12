# Mobile Timer Wireframes Documentation

## Page Overview
Comprehensive mobile timer interfaces for both game breaks and training sessions with fully editable durations, customizable activities, and intelligent presets for different scenarios.

## **Editable Break Timer System**

### **Timer Setup Interface**

```
┌─────────────────────────────────────┐ ← iPhone 14 Pro (393×852)
│ ← Back          Break Timer         │
├─────────────────────────────────────┤
│                                     │
│         🏆 Tournament Break         │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Duration                        │ │
│ │ ┌─────────┐ ┌─────────┐ ┌─────┐ │ │
│ │ │   30    │ │   00    │ │ MIN │ │ │
│ │ │   ↕️     │ │   ↕️     │ │     │ │ │
│ │ └─────────┘ └─────────┘ └─────┘ │ │
│ │                                 │ │
│ │ Quick Presets:                  │ │
│ │ [15m] [30m] [45m] [1h] [2h]     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Break Type                      │ │
│ │ ○ Game Break (structured)       │ │
│ │ ○ Training Rest (flexible)      │ │
│ │ ● Custom Break                  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Activities (optional)           │ │
│ │ ☑️ Hydration reminder           │ │
│ │ ☑️ Team meeting (5min)          │ │
│ │ ☑️ Equipment check              │ │
│ │ ☐ Nutrition intake             │ │
│ │ ☐ Warm-up protocol             │ │
│ │ [+ Add Custom Activity]         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │         🚀 Start Timer          │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### **Duration Picker (Detailed)**

```
┌─────────────────────────────────────┐
│ Set Timer Duration              ✕   │
├─────────────────────────────────────┤
│                                     │
│ ┌─ Hours ─┐ ┌─ Minutes ─┐ ┌─ Secs ─┐│
│ │    0    │ │    30     │ │   00   ││
│ │    ↑    │ │     ↑     │ │    ↑   ││
│ │ ┌─────┐ │ │ ┌───────┐ │ │ ┌────┐ ││
│ │ │  1  │ │ │ │  25   │ │ │ │ 55 │ ││
│ │ │  0  │ │ │ │ →30← │ │ │ │→00←│ ││ ← Scrollable
│ │ │  2  │ │ │ │  35   │ │ │ │ 05 │ ││   drums
│ │ └─────┘ │ │ └───────┘ │ │ └────┘ ││
│ │    ↓    │ │     ↓     │ │    ↓   ││
│ └─────────┘ └───────────┘ └────────┘│
│                                     │
│ Total: 0h 30m 00s                   │
│                                     │
│ Preset Durations:                   │
│ ┌───┐┌───┐┌───┐┌───┐┌───┐┌───┐     │
│ │15m││30m││45m││1h ││1.5││2h │     │
│ └───┘└───┘└───┘└───┘└───┘└───┘     │
│                                     │
│ Custom Quick Sets:                  │
│ • Game Break: 30m (structured)     │
│ • Half Time: 15m (team meeting)    │
│ • Training Rest: 5m (hydration)    │
│ • Equipment: 10m (gear check)      │
│ • Meal Break: 1h (nutrition)       │
│                                     │
│ [Cancel]              [Set Timer]   │
└─────────────────────────────────────┘
```

### **Timer Preset Templates**

```
┌─────────────────────────────────────┐
│ Timer Templates                     │
├─────────────────────────────────────┤
│                                     │
│ 🏆 Tournament Presets               │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🏈 Game Break (30min)           │ │
│ │ • 0-5min: Cool down             │ │
│ │ • 5-10min: Team meeting         │ │
│ │ • 10-15min: Equipment check     │ │
│ │ │ 15-25min: Nutrition & rest    │ │
│ │ • 25-30min: Warm-up             │ │
│ │              [Use Template] [⚙️] │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🥤 Half Time (15min)            │ │
│ │ • 0-5min: Hydration             │ │
│ │ • 5-12min: Coach talk           │ │
│ │ • 12-15min: Prepare for 2nd     │ │
│ │              [Use Template] [⚙️] │ │
│ └─────────────────────────────────┘ │
│                                     │
│ 🏃 Training Presets                 │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ⚡ Quick Rest (5min)             │ │
│ │ • Hydration & catch breath      │ │
│ │              [Use Template] [⚙️] │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 💪 Recovery Break (2h)          │ │
│ │ • 0-30min: Shower & change      │ │
│ │ • 30-90min: Meal & nutrition    │ │
│ │ • 90-120min: Rest & recovery    │ │
│ │              [Use Template] [⚙️] │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [+ Create Custom Template]          │
│                                     │
└─────────────────────────────────────┘
```

## **Full-Screen Timer Interface**

### **Active Timer - Game Break**

```
┌─────────────────────────────────────┐
│                                     │ ← Full screen
│              ✕ Exit                 │   immersive
│                                     │
│         🏈 Game Break Timer         │
│                                     │
│           ┌─────────┐               │
│           │   29    │               │ ← Large, 
│           │   :     │               │   readable
│           │   47    │               │   timer
│           └─────────┘               │
│                                     │
│         ⏸️ Pause  ⏹️ Stop            │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Current Activity (5/6)          │ │
│ │                                 │ │
│ │ 🥤 Hydration & Nutrition        │ │
│ │ (15min - 25min)                 │ │
│ │                                 │ │
│ │ ████████████░░░░ 80% complete   │ │
│ │                                 │ │
│ │ Next: 🔥 Warm-up (5min)         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Quick Actions                   │ │
│ │ [+ 5min] [-5min] [Skip Phase]   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📊 Team Status                  │ │
│ │ • 18/23 players ready           │ │
│ │ • Equipment check: ✅           │ │
│ │ • Hydration goal: 85% met       │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### **Timer with Activity Timeline**

```
┌─────────────────────────────────────┐
│ 🏈 30-Minute Break Timeline         │
├─────────────────────────────────────┤
│                                     │
│        ┌─ 29:47 remaining ─┐        │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 0min    5min   15min   25min    │ │
│ │  │      │      │      │         │ │
│ │  ●──────●──────●──────○──────○  │ │ ← Progress
│ │  ✅     ✅     🔄     ○      ○  │ │   timeline
│ │ Cool   Team   Nutr   Warm   End │ │
│ │ Down  Meeting ition   Up         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Currently: 🥤 Nutrition & Rest      │
│ ████████████████░░░░ 16/10 min      │
│                                     │
│ Activity Notes:                     │
│ • ✅ Hydration complete             │
│ • ⏰ Extra 6min for meal           │
│ • 🥗 Protein intake recommended    │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ [+5min] [Skip] [Alert Coach]    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │    🔄 Extend Break to 45min?    │ │
│ │      [No] [Yes, +15min]         │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

## **Training Session Timer**

### **Training Timer Setup**

```
┌─────────────────────────────────────┐
│ ← Back         Training Timer       │
├─────────────────────────────────────┤
│                                     │
│        🏃 Route Running Session     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Session Duration                │ │
│ │                                 │ │
│ │ ┌─────────┐ ┌─────────┐         │ │
│ │ │   45    │ │   00    │ MIN     │ │
│ │ │   ↕️     │ │   ↕️     │         │ │
│ │ └─────────┘ └─────────┘         │ │
│ │                                 │ │
│ │ Quick: [15m] [30m] [45m] [60m]  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Rest Between Drills             │ │
│ │                                 │ │
│ │ ○ 30 seconds (quick pace)       │ │
│ │ ● 1 minute (standard)           │ │
│ │ ○ 2 minutes (recovery pace)     │ │
│ │ ○ Custom: [___] seconds         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Training Intensity              │ │
│ │ ○ Light (50-60% effort)         │ │
│ │ ● Moderate (70-80% effort)      │ │
│ │ ○ High (85-95% effort)          │ │
│ │ ○ Game Simulation (100%)        │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Auto Features                   │ │
│ │ ☑️ Auto-start next drill        │ │
│ │ ☑️ Voice countdown              │ │
│ │ ☑️ Vibration alerts             │ │
│ │ ☐ Music integration             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │      🚀 Start Training          │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### **Training Timer - Active Session**

```
┌─────────────────────────────────────┐
│                                     │ ← Full screen
│              ⏸️ Pause   ✕ Exit      │   training mode
│                                     │
│        🏃 Route Running Session     │
│                                     │
│           ┌─────────┐               │
│           │   42    │               │ ← Session time
│           │   :     │               │   remaining
│           │   18    │               │
│           └─────────┘               │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Drill 3 of 8: Crossing Routes  │ │
│ │                                 │ │
│ │        ┌─ 0:58 ─┐                │ │ ← Drill timer
│ │        │ Ready? │                │ │
│ │        └───────┘                │ │
│ │                                 │ │
│ │ [Skip Drill] [Add Time] [Done]  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Performance Tracking            │ │
│ │ Completed: 2 drills ✅          │ │
│ │ Average time: 2:34              │ │
│ │ Effort level: 78% 💪            │ │
│ │ [Log Performance]               │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ AI Coach: "Great precision on   │ │
│ │ that route! Try 10% faster on   │ │
│ │ the next crossing pattern."     │ │
│ │                    [Got it! 👍] │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### **Rest Timer Between Drills**

```
┌─────────────────────────────────────┐
│                                     │
│        🛑 Rest Period               │
│                                     │
│           ┌─────────┐               │
│           │   0     │               │ ← Rest countdown
│           │   :     │               │
│           │   47    │               │
│           └─────────┘               │
│                                     │
│        💨 Catch your breath         │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Next Drill: Speed Ladder        │ │
│ │ Duration: 3 minutes             │ │
│ │ Focus: Quick feet & agility     │ │
│ │                                 │ │
│ │ ████████░░░░ Equipment ready    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Quick Actions                   │ │
│ │ [Skip Rest] [+30s] [Start Now]  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 💧 Hydration reminder           │ │
│ │ Last drink: 12 minutes ago      │ │
│ │ [Mark as hydrated] [Remind +5]  │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

## **Custom Timer Builder**

### **Create Custom Timer**

```
┌─────────────────────────────────────┐
│ ← Back      Custom Timer Builder    │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Timer Name                      │ │
│ │ [Recovery Session              ] │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Total Duration: 2h 30m          │ │
│ │                                 │ │
│ │ Activities Timeline:            │ │
│ │                                 │ │
│ │ 1. 🚿 Shower & Change           │ │
│ │    0:00 - 0:30 (30min) [Edit]   │ │
│ │                                 │ │
│ │ 2. 🍽️ Meal & Nutrition          │ │
│ │    0:30 - 1:30 (60min) [Edit]   │ │
│ │                                 │ │
│ │ 3. 💤 Rest & Recovery           │ │
│ │    1:30 - 2:30 (60min) [Edit]   │ │
│ │                                 │ │
│ │ [+ Add Activity]                │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Alerts & Notifications          │ │
│ │ ☑️ 5min warning before each     │ │
│ │ ☑️ Voice announcements          │ │
│ │ ☑️ Share with team              │ │
│ │ ☐ Background music              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Save Template] [Test Timer]        │
│                                     │
└─────────────────────────────────────┘
```

### **Activity Builder**

```
┌─────────────────────────────────────┐
│ Edit Activity                   ✕   │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Activity Name                   │ │
│ │ [Meal & Nutrition              ] │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Duration                        │ │
│ │ ┌─────────┐ ┌─────────┐         │ │
│ │ │   60    │ │   00    │ MIN     │ │
│ │ │   ↕️     │ │   ↕️     │         │ │
│ │ └─────────┘ └─────────┘         │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Icon & Color                    │ │
│ │ 🍽️ 🥗 🥤 💧 🏃 💤 📚 ⚽ 🎵      │ │
│ │                                 │ │
│ │ ┌─┐┌─┐┌─┐┌─┐┌─┐┌─┐              │ │
│ │ │🟢││🔵││🟡││🟠││🔴││⚫│           │ │
│ │ └─┘└─┘└─┘└─┘└─┘└─┘              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Instructions (optional)         │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ Focus on protein intake and │ │ │
│ │ │ hydration. Avoid heavy      │ │ │
│ │ │ meals before next session.  │ │ │
│ │ └─────────────────────────────┘ │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Alerts                          │ │
│ │ ☑️ Start notification           │ │
│ │ ☑️ 10min remaining warning      │ │
│ │ ☑️ 5min remaining warning       │ │
│ │ ☐ Custom reminder at: [__]min   │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [Cancel]                    [Save]  │
└─────────────────────────────────────┘
```

## **Timer Completion & Summary**

### **Timer Finished**

```
┌─────────────────────────────────────┐
│                                     │
│              🎉 Complete!           │
│                                     │
│        Break Timer Finished        │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Session Summary                 │ │
│ │                                 │ │
│ │ ⏱️ Total time: 30min 0sec       │ │
│ │ 📋 Activities completed: 5/6    │ │
│ │ 💧 Hydration: 85% team goal     │ │
│ │ 👥 Team readiness: Ready ✅     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Next Up                         │ │
│ │ 🏈 Game vs Eagles               │ │
│ │ Starting in: 5 minutes          │ │
│ │ [Set Game Timer] [Team Huddle]  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Quick Actions                   │ │
│ │ [Save Template] [Share Results] │ │
│ │ [Feedback] [New Timer]          │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │        Continue to Game         │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

## **Smart Timer Features**

### **Adaptive Timer Suggestions**

```
┌─────────────────────────────────────┐
│ 🤖 Smart Timer Suggestions         │
├─────────────────────────────────────┤
│                                     │
│ Based on your patterns:             │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📊 You typically take:          │ │
│ │ • Game breaks: 32min average    │ │
│ │ • Training rest: 1min 15sec     │ │
│ │ • Recovery: 1h 45min           │ │
│ │                                 │ │
│ │ Suggested for today:            │ │
│ │ 🏈 35min (hot weather +5min)    │ │ ← Weather-based
│ └─────────────────────────────────┘ │   adjustment
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ ⚠️ Team Alert                   │ │
│ │ 3 players need extra hydration │ │
│ │ Recommend: +10min break         │ │
│ │ [Accept] [Custom] [Ignore]      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🎯 Performance Optimization     │ │
│ │ Shorter breaks (15min) improve  │ │
│ │ your next-game performance by   │ │
│ │ 12% based on historical data    │ │
│ │ [Try Shorter] [Keep Standard]   │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### **Voice Control for Timers**

```
┌─────────────────────────────────────┐
│ 🎤 Voice Timer Control              │
├─────────────────────────────────────┤
│                                     │
│ Active Commands:                    │
│                                     │
│ "Set timer for 30 minutes"         │ │ ← Direct duration
│ "Start break timer"                 │   setting
│ "Pause timer"                       │
│ "Add 5 minutes"                     │
│ "Skip to next activity"             │
│ "How much time left?"               │
│ "Set training rest for 2 minutes"   │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 🎤 Say a command...             │ │
│ │ ┌─────────────────────────────┐ │ │
│ │ │ [Listening...]              │ │ │ ← Voice input
│ │ └─────────────────────────────┘ │ │   active
│ └─────────────────────────────────┘ │
│                                     │
│ Last command: "Add 5 minutes"       │
│ ✅ Added 5 minutes to timer         │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Voice Settings                  │ │
│ │ ☑️ Voice responses enabled      │ │
│ │ ☑️ Confirmation prompts         │ │
│ │ ☐ Hands-free mode               │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

This comprehensive mobile timer system provides complete flexibility for any break duration (15min to 2h+) with structured activities, intelligent suggestions, and seamless mobile optimization for both tournament and training scenarios.