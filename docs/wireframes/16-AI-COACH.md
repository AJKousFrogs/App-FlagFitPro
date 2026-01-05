# Wireframe: AI Coach (Merlin)

**Route:** `/ai-coach`  
**Users:** All Users  
**Status:** ✅ Fully Implemented  
**Source:** `angular/src/app/features/ai-coach/ai-coach-chat.component.ts`

---

## Skeleton Wireframe

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [☰]  FlagFit Pro                                            🔍  🔔  [Avatar ▼]     │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🤖 MERLIN AI COACH                                         [New Chat] [Clear]  │  │
│  │    Your personal flag football training assistant                              │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 💡 QUICK SUGGESTIONS                                                           │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │  ┌────────────────────────┐  ┌────────────────────────┐  ┌───────────────────┐│  │
│  │  │ "What should I eat    │  │ "How do I improve my   │  │ "My hamstring is  ││  │
│  │  │  before a tournament?" │  │  40-yard dash time?"   │  │  tight, what do   ││  │
│  │  │                       │  │                        │  │  I do?"           ││  │
│  │  └────────────────────────┘  └────────────────────────┘  └───────────────────┘│  │
│  │                                                                                │  │
│  │  ┌────────────────────────┐  ┌────────────────────────┐                       │  │
│  │  │ "Create a weekly      │  │ "Explain ACWR and why  │                       │  │
│  │  │  training plan for me" │  │  it matters"           │                       │  │
│  │  └────────────────────────┘  └────────────────────────┘                       │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                  CHAT MESSAGES                                       │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 👤 USER                                                           10:30 AM    │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │ How should I warm up before a flag football game?                             │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🤖 MERLIN                                                         10:30 AM    │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │ Great question! Here's an evidence-based warm-up protocol for flag football:  │  │
│  │                                                                                │  │
│  │ **Phase 1: General Warm-up (5 min)**                                          │  │
│  │ - Light jogging (2 laps around field)                                         │  │
│  │ - High knees, butt kicks, side shuffles                                       │  │
│  │                                                                                │  │
│  │ **Phase 2: Dynamic Stretching (5-7 min)**                                     │  │
│  │ - Leg swings (front/back, side to side)                                       │  │
│  │ - Hip circles                                                                 │  │
│  │ - Walking lunges with twist                                                   │  │
│  │ - Inchworms                                                                   │  │
│  │                                                                                │  │
│  │ **Phase 3: Sport-Specific (5 min)**                                           │  │
│  │ - Progressive sprints (50%, 75%, 90%)                                         │  │
│  │ - Cutting drills at increasing intensity                                      │  │
│  │ - Position-specific movements                                                 │  │
│  │                                                                                │  │
│  │ ┌──────────────────────────────────────────────────────────────────────────┐  │  │
│  │ │ 📚 CITATIONS                                                             │  │  │
│  │ │ ────────────────────────────────────────────────────────────────────────│  │  │
│  │ │ • [A] ACSM Guidelines for Exercise Testing - Evidence Grade: A          │  │  │
│  │ │ • [B] Dynamic Warm-up Effects Meta-Analysis - Evidence Grade: A         │  │  │
│  │ │ • [C] Flag Football Injury Prevention Study - Evidence Grade: B         │  │  │
│  │ └──────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                │  │
│  │ ┌──────────────────────────────────────────────────────────────────────────┐  │  │
│  │ │ 🎯 SUGGESTED ACTIONS                                                     │  │  │
│  │ │ ────────────────────────────────────────────────────────────────────────│  │  │
│  │ │ • [Start Micro-Session: 15-min Pre-Game Warmup]                         │  │  │
│  │ │ • [Add to Training Schedule]                                             │  │  │
│  │ │ • [View Exercise Library: Dynamic Stretches]                            │  │  │
│  │ └──────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                │  │
│  │ ⚠️ DISCLAIMER: This is general guidance. Consult a professional for          │  │
│  │    personalized medical or training advice.                                   │  │
│  │                                                                                │  │
│  │ ┌────────────┐  ┌────────────┐  ┌────────┐  ┌─────────┐  ┌────────────────┐  │  │
│  │ │ 👍 Helpful │  │ 👎 Not    │  │ 📋Copy │  │ 🔖 Save │  │ ✅Coach Review │  │  │
│  │ └────────────┘  └────────────┘  └────────┘  └─────────┘  └────────────────┘  │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 🤖 MERLIN (Loading...)                                                        │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │ ⏳ Thinking...                                                                │  │
│  │    ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                       │  │
│  │    Searching knowledge base...                                                │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ ⚠️ ACWR SAFETY BLOCK (when applicable)                                        │  │
│  │ ──────────────────────────────────────────────────────────────────────────────│  │
│  │                                                                                │  │
│  │ 🛑 High-intensity training is not recommended right now.                      │  │
│  │                                                                                │  │
│  │ Your current ACWR is 1.52 (Danger Zone)                                       │  │
│  │ Reason: Training load has spiked significantly in the past week               │  │
│  │                                                                                │  │
│  │ Recommended: Light recovery activities only                                   │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                   CHAT INPUT                                         │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────────┐  ┌────────┐│  │
│  │  │ Ask Merlin anything about training, nutrition, recovery...   │  │ 🎤 📤 ││  │
│  │  └──────────────────────────────────────────────────────────────┘  └────────┘│  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Message Features

| Feature           | Description                                          |
| ----------------- | ---------------------------------------------------- |
| Citations         | Evidence sources with grade (A/B/C)                  |
| Suggested Actions | Clickable actions (micro-session, schedule, library) |
| Disclaimer        | General guidance warning                             |
| Feedback          | Thumbs up/down                                       |
| Copy              | Copy message content                                 |
| Bookmark          | Save message                                         |
| Coach Review      | Mark as coach-reviewed                               |
| ACWR Safety       | Block high-intensity suggestions when ACWR is high   |

---

## Loading States

| Stage      | Description                    |
| ---------- | ------------------------------ |
| Thinking   | Initial processing             |
| Searching  | Looking through knowledge base |
| Generating | Creating response              |

---

## Features Implemented

| Feature                       | Status |
| ----------------------------- | ------ |
| Chat interface                | ✅     |
| Quick suggestions             | ✅     |
| Message history               | ✅     |
| Citations with evidence grade | ✅     |
| Suggested actions             | ✅     |
| Micro-session integration     | ✅     |
| ACWR safety blocks            | ✅     |
| Feedback (thumbs up/down)     | ✅     |
| Copy message                  | ✅     |
| Bookmark message              | ✅     |
| Voice input                   | ✅     |
| Disclaimer                    | ✅     |
| Loading stages                | ✅     |
| Coach review marking          | ✅     |
| New chat / Clear chat         | ✅     |

---

## Data Sources

| Data           | Service                  | Endpoint               |
| -------------- | ------------------------ | ---------------------- |
| Chat messages  | `ApiService`             | `/api/ai/chat`         |
| User context   | `UnifiedTrainingService` | Current ACWR, wellness |
| Knowledge base | Backend                  | RAG system             |
