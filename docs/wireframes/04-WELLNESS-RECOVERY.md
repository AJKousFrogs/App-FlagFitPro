# Wireframe: Wellness & Recovery

**Route:** `/wellness`  
**Users:** Players/Athletes  
**Status:** ✅ Implemented (Core) / ⚠️ Partial (Advanced features)  
**Source:** `angular/src/app/features/wellness/wellness.component.ts`

---

## Skeleton Wireframe - Full Page

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  [☰]  FlagFit Pro                                            🔍  🔔  [Avatar ▼]     │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │  💚 Wellness & Recovery                                   ┌──────────────────┐│  │
│  │  Track your health, recovery, and wellness metrics        │ + Log Check-in   ││  │
│  │                                                           └──────────────────┘│  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │                          WELLNESS STATS (4 CARDS)                               │ │
│  │                                                                                 │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │  │ 🌙 Sleep        │  │ 💚 Recovery     │  │ ⚡ Energy       │  │ 🛡️ Stress      ││
│  │  │    Quality      │  │    Score        │  │    Level        │  │    Level        ││
│  │  │                 │  │                 │  │                 │  │                ││
│  │  │    7.5h         │  │    82%          │  │    8/10         │  │    Low         ││
│  │  │    ─────────    │  │    ─────────    │  │    ─────────    │  │    ─────────   ││
│  │  │  +0.5h vs yday  │  │  Good           │  │  +1 vs yday     │  │  Excellent     ││
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘│
│  │                                                                                 │ │
│  └─────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                      │
│  ┌────────────────────────────────────┐  ┌────────────────────────────────────────┐  │
│  │ 🌙 Sleep Quality (7-day)           │  │ 💚 Recovery Score (7-day)              │  │
│  │ ──────────────────────────────────│  │ ──────────────────────────────────────│  │
│  │                                    │  │                                        │  │
│  │      ╱╲                            │  │   ████████                             │  │
│  │     ╱  ╲    ╱╲                     │  │   ██████                               │  │
│  │    ╱    ╲  ╱  ╲___                │  │   ████████                             │  │
│  │   ╱      ╲╱                        │  │   ██████████                           │  │
│  │  Mon Tue Wed Thu Fri Sat Sun       │  │   Mon Tue Wed Thu Fri Sat Sun          │  │
│  │                                    │  │                                        │  │
│  │  [LINE CHART - Sleep hours]        │  │  [BAR CHART - Recovery %]              │  │
│  └────────────────────────────────────┘  └────────────────────────────────────────┘  │
│                                                                                      │
│  ═══════════════════════════════════════════════════════════════════════════════════ │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ ⚖️ Body Composition                                    Last measured: Today    │  │
│  │ ────────────────────────────────────────────────────────────────────────────── │  │
│  │                                                                                │  │
│  │        ┌───────────────────────────────┐                                       │  │
│  │        │      82.5 kg        ↓         │  ← Primary metric with trend         │  │
│  │        │      Total Weight             │                                       │  │
│  │        └───────────────────────────────┘                                       │  │
│  │                                                                                │  │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐│
│  │  │ Body Fat        │  │ Muscle Mass     │  │ Body Water      │  │ BMR (kcal)     ││
│  │  │ ──────────────  │  │ ──────────────  │  │ ──────────────  │  │ ──────────────  ││
│  │  │  14.2%  ↓       │  │  38.5 kg        │  │  58.2%          │  │  1850          ││
│  │  │  ▓▓▓▓░░░░░░░░░░ │  │                 │  │                 │  │                ││
│  │  │  Athletic range │  │                 │  │                 │  │                ││
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘│
│  │                                                                                │  │
│  │                                                   View Full History →          │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 💊 Supplement Tracker                                   8/15 taken today       │  │
│  │ ────────────────────────────────────────────────────────────────────────────── │  │
│  │                                                                                │  │
│  │  Progress: ▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░ 53%                                │  │
│  │                                                                                │  │
│  │  ☀️ MORNING                                                                    │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │ ☑ Vitamin D (2000 IU)    ☑ Iron (18mg)    ☑ Omega-3 (1000mg)            │ │  │
│  │  │ ☑ Calcium (1000mg)       ☑ Multivitamin    ☐ Vitamin C (500mg)          │ │  │
│  │  └──────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  │  ⚡ PRE-WORKOUT                                                                │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │ ☐ Caffeine (200mg)       ☑ Beta Alanine (3.2g)    ☐ BCAAs (5g)          │ │  │
│  │  │ ☐ Electrolytes                                                          │ │  │
│  │  └──────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  │  💚 POST-WORKOUT                                                               │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │ ☐ Protein Powder (25g)   ☐ L-Glutamine (5g)                             │ │  │
│  │  └──────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  │  🌙 EVENING                                                                    │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │ ☐ Magnesium (400mg)      ☐ Zinc (15mg)                                  │ │  │
│  │  └──────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  │  ⏰ ANYTIME                                                                    │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │ ☑ Creatine (5g)                                                         │ │  │
│  │  └──────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  │                                                        [+ Add Supplement]     │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ ⚠️ WEIGHT & WELLNESS ALERTS (if triggered)                                     │  │
│  │ ────────────────────────────────────────────────────────────────────────────── │  │
│  │                                                                                │  │
│  │  ┌────────────────────────────────────────────────────────────────────────────┐│  │
│  │  │ 🔴 RAPID WEIGHT LOSS DETECTED                                              ││  │
│  │  │ ─────────────────────────────────────────────────────────────────────────  ││  │
│  │  │ You've lost 2.3kg in the past week. This exceeds safe limits.             ││  │
│  │  │                                                                            ││  │
│  │  │ Possible causes:                                                          ││  │
│  │  │ • Dehydration                                                             ││  │
│  │  │ • Undereating                                                             ││  │
│  │  │ • Illness                                                                 ││  │
│  │  │                                                                            ││  │
│  │  │ Recommendation: Increase hydration and calories. Consult medical if       ││  │
│  │  │ symptoms persist.                                                         ││  │
│  │  │                                                                            ││  │
│  │  │                                [Dismiss]  [Talk to AI Coach →]            ││  │
│  │  └────────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                │  │
│  │  ┌────────────────────────────────────────────────────────────────────────────┐│  │
│  │  │ 🟡 ELEVATED RESTING HEART RATE                                             ││  │
│  │  │ ─────────────────────────────────────────────────────────────────────────  ││  │
│  │  │ Your resting HR (72 BPM) is 12 BPM above your baseline (60 BPM).          ││  │
│  │  │                                                                            ││  │
│  │  │ This may indicate fatigue, stress, or illness.                            ││  │
│  │  │                                                                            ││  │
│  │  │ Recommendation: Consider a lighter training day.                          ││  │
│  │  │                                                                            ││  │
│  │  │                                                       [Dismiss]            ││  │
│  │  └────────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                │  │
│  │  ┌────────────────────────────────────────────────────────────────────────────┐│  │
│  │  │ 💡 SUPPLEMENT RECOMMENDATION                                               ││  │
│  │  │ ─────────────────────────────────────────────────────────────────────────  ││  │
│  │  │ Your muscle soreness has been elevated (7/10) for 3 days.                 ││  │
│  │  │                                                                            ││  │
│  │  │ Recommendation: Consider magnesium supplementation for muscle recovery.   ││  │
│  │  │ (You haven't logged Magnesium in 2 days)                                  ││  │
│  │  │                                                                            ││  │
│  │  │                        [Log Magnesium Now]  [Dismiss]                     ││  │
│  │  └────────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 💧 HYDRATION TRACKER                                    Target: 2,800ml today  │  │
│  │ ────────────────────────────────────────────────────────────────────────────── │  │
│  │                                                                                │  │
│  │  Progress: ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░ 1,750ml / 2,800ml (63%) │  │
│  │                                                                                │  │
│  │  ┌────────────────────────────────────────────────────────────────────────────┐│  │
│  │  │                                                                            ││  │
│  │  │      ┌───────────┐                                                         ││  │
│  │  │      │           │  ← 2800ml target                                        ││  │
│  │  │      │           │                                                         ││  │
│  │  │      │▓▓▓▓▓▓▓▓▓▓▓│  ← 1750ml current                                       ││  │
│  │  │      │▓▓▓▓▓▓▓▓▓▓▓│                                                         ││  │
│  │  │      │▓▓▓▓▓▓▓▓▓▓▓│  63%                                                    ││  │
│  │  │      │▓▓▓▓▓▓▓▓▓▓▓│                                                         ││  │
│  │  │      └───────────┘                                                         ││  │
│  │  │                                                                            ││  │
│  │  │  [ANIMATED WATER BOTTLE FILL VISUALIZATION]                                ││  │
│  │  │                                                                            ││  │
│  │  └────────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                │  │
│  │  Quick Log:                                                                   │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │  │
│  │  │ 💧 250ml    │  │ 💧 500ml    │  │ ⚡ Sports   │  │ 🧃 Custom   │           │  │
│  │  │   Water     │  │   Water     │  │   Drink     │  │   Amount    │           │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘           │  │
│  │                                                                                │  │
│  │  Today's Log:                                                                 │  │
│  │  ┌────────────────────────────────────────────────────────────────────────────┐│  │
│  │  │ 07:30  💧 Water         500ml                                             ││  │
│  │  │ 09:15  💧 Water         250ml                                             ││  │
│  │  │ 11:00  ⚡ Sports Drink  500ml                                             ││  │
│  │  │ 13:30  💧 Water         500ml                                             ││  │
│  │  └────────────────────────────────────────────────────────────────────────────┘│  │
│  │                                                                                │  │
│  │  🎯 Goal calculated from: 80kg body weight × 35ml/kg = 2,800ml               │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────────────┐  │
│  │ 📝 Daily Wellness Check-in                                                     │  │
│  │ ────────────────────────────────────────────────────────────────────────────── │  │
│  │                                                                                │  │
│  │  🌙 SLEEP & RECOVERY                                                          │  │
│  │  ┌────────────────────────────────┐  ┌────────────────────────────────┐       │  │
│  │  │ Sleep Hours                    │  │ Sleep Quality (1-10)           │       │  │
│  │  │ ┌──────────────────────────┐   │  │ ┌──────────────────────────┐   │       │  │
│  │  │ │  [−]    7.5    [+]       │   │  │ │  [−]     7     [+]       │   │       │  │
│  │  │ └──────────────────────────┘   │  │ └──────────────────────────┘   │       │  │
│  │  └────────────────────────────────┘  └────────────────────────────────┘       │  │
│  │                                                                                │  │
│  │  💚 PHYSICAL STATE                                                            │  │
│  │  ┌────────────────────────────────┐  ┌────────────────────────────────┐       │  │
│  │  │ Energy Level (1-10)            │  │ Muscle Soreness (1-10)         │       │  │
│  │  │ ┌──────────────────────────┐   │  │ ┌──────────────────────────┐   │       │  │
│  │  │ │  [−]     7     [+]       │   │  │ │  [−]     3     [+]       │   │       │  │
│  │  │ └──────────────────────────┘   │  │ └──────────────────────────┘   │       │  │
│  │  │                                │  │ 1 = No soreness, 10 = Very sore│       │  │
│  │  └────────────────────────────────┘  └────────────────────────────────┘       │  │
│  │  ┌────────────────────────────────┐  ┌────────────────────────────────┐       │  │
│  │  │ Hydration (glasses)            │  │ Resting Heart Rate (BPM)       │       │  │
│  │  │ ┌──────────────────────────┐   │  │ ┌──────────────────────────┐   │       │  │
│  │  │ │  [−]     8     [+]       │   │  │ │  [−]     62    [+]       │   │       │  │
│  │  │ └──────────────────────────┘   │  │ └──────────────────────────┘   │       │  │
│  │  │ Target: 8+ glasses daily       │  │ Elevated HR may indicate fatigue│      │  │
│  │  └────────────────────────────────┘  └────────────────────────────────┘       │  │
│  │                                                                                │  │
│  │  ✨ MENTAL STATE                                                              │  │
│  │  ┌────────────────────────────────┐  ┌────────────────────────────────┐       │  │
│  │  │ Mood (1-10)                    │  │ Stress Level (1-10)            │       │  │
│  │  │ ┌──────────────────────────┐   │  │ ┌──────────────────────────┐   │       │  │
│  │  │ │  [−]     7     [+]       │   │  │ │  [−]     3     [+]       │   │       │  │
│  │  │ └──────────────────────────┘   │  │ └──────────────────────────┘   │       │  │
│  │  │                                │  │ 1 = Very relaxed, 10 = Stressed│       │  │
│  │  └────────────────────────────────┘  └────────────────────────────────┘       │  │
│  │  ┌────────────────────────────────┐  ┌────────────────────────────────┐       │  │
│  │  │ Training Motivation (1-10)     │  │ Readiness to Train (1-10)      │       │  │
│  │  │ ┌──────────────────────────┐   │  │ ┌──────────────────────────┐   │       │  │
│  │  │ │  [−]     7     [+]       │   │  │ │  [−]     7     [+]       │   │       │  │
│  │  │ └──────────────────────────┘   │  │ └──────────────────────────┘   │       │  │
│  │  └────────────────────────────────┘  └────────────────────────────────┘       │  │
│  │                                                                                │  │
│  │                           ┌────────────────────────┐                          │  │
│  │                           │  ✓ Submit Check-in     │                          │  │
│  │                           └────────────────────────┘                          │  │
│  │               Daily check-ins help optimize your training load                │  │
│  │                                                                                │  │
│  └────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Page Header ✅

| Element                     | Status | Notes                                               |
| --------------------------- | ------ | --------------------------------------------------- |
| Title "Wellness & Recovery" | ✅     | With heart icon                                     |
| Subtitle                    | ✅     | "Track your health, recovery, and wellness metrics" |
| "Log Check-in" button       | ✅     | Scrolls to check-in form                            |

---

### 2. Wellness Stats Grid (4 Cards) ✅

| Stat           | Icon | Value Example             | Trend        | Status |
| -------------- | ---- | ------------------------- | ------------ | ------ |
| Sleep Quality  | 🌙   | Hours (e.g., "7.5h")      | vs yesterday | ✅     |
| Recovery Score | 💚   | Percentage (e.g., "82%")  | Status label | ✅     |
| Energy Level   | ⚡   | X/10                      | vs yesterday | ✅     |
| Stress Level   | 🛡️   | Label (Low/Moderate/High) | Status       | ✅     |

---

### 3. Wellness Charts (Lazy-loaded) ✅

| Chart          | Type | Data Period | Status |
| -------------- | ---- | ----------- | ------ |
| Sleep Quality  | Line | 7 days      | ✅     |
| Recovery Score | Bar  | 7 days      | ✅     |

---

### 4. Body Composition Card ✅

| Element                | Status | Notes                                |
| ---------------------- | ------ | ------------------------------------ |
| Last measured date     | ✅     | "Last measured Today/Yesterday/Date" |
| Primary weight display | ✅     | Large value with trend arrow         |
| Body Fat %             | ✅     | With progress bar and range label    |
| Muscle Mass            | ✅     | kg display                           |
| Body Water %           | ✅     | Percentage                           |
| BMR (kcal)             | ✅     | Daily calorie burn                   |
| View Full History link | ✅     | Links to detailed page               |
| Empty state            | ✅     | "No measurements yet" + CTA          |

**Body Fat Ranges:**

- < 10%: "Below essential fat range"
- 10-14%: "Athletic range"
- 15-20%: "Fitness range"
- 21-25%: "Average range"
- > 25%: "Above average"

**Source Component:** `shared/components/body-composition-card/body-composition-card.component.ts`

---

### 5. Supplement Tracker ✅

| Element               | Status | Notes                                                      |
| --------------------- | ------ | ---------------------------------------------------------- |
| Progress bar          | ✅     | X/Y taken with percentage                                  |
| Morning section       | ✅     | Vitamin D, Iron, Omega-3, Calcium, Multivitamin, Vitamin C |
| Pre-workout section   | ✅     | Caffeine, Beta Alanine, BCAAs, Electrolytes                |
| Post-workout section  | ✅     | Protein Powder, L-Glutamine                                |
| Evening section       | ✅     | Magnesium, Zinc                                            |
| Anytime section       | ✅     | Creatine                                                   |
| Checkbox toggle       | ✅     | Click to mark taken                                        |
| Add Supplement dialog | ✅     | Name, dosage, timing, category                             |
| Remove supplement     | ✅     | Per-item action                                            |

**Default Supplements (15):**

- Creatine (5g) - Anytime - Performance
- Vitamin D (2000 IU) - Morning - Vitamin
- Omega-3 Fish Oil (1000mg) - Morning - Recovery
- Magnesium (400mg) - Evening - Mineral
- Beta Alanine (3.2g) - Pre-workout - Performance
- Iron (18mg) - Morning - Mineral
- Calcium (1000mg) - Morning - Mineral
- Vitamin C (500mg) - Morning - Vitamin
- Zinc (15mg) - Evening - Mineral
- Protein Powder (25g) - Post-workout - Recovery
- BCAAs (5g) - Pre-workout - Amino
- L-Glutamine (5g) - Post-workout - Amino
- Caffeine (200mg) - Pre-workout - Performance
- Electrolytes (1 serving) - Pre-workout - Recovery
- Multivitamin (1 tablet) - Morning - Vitamin

**Source Component:** `shared/components/supplement-tracker/supplement-tracker.component.ts`

---

### 6. Daily Wellness Check-in Form ✅

#### Sleep & Recovery Section

| Field         | Type        | Range          | Status |
| ------------- | ----------- | -------------- | ------ |
| Sleep Hours   | InputNumber | 0-24, 0.5 step | ✅     |
| Sleep Quality | InputNumber | 1-10           | ✅     |

#### Physical State Section

| Field              | Type        | Range  | Notes                        | Status |
| ------------------ | ----------- | ------ | ---------------------------- | ------ |
| Energy Level       | InputNumber | 1-10   |                              | ✅     |
| Muscle Soreness    | InputNumber | 1-10   | Inverted (1=none, 10=severe) | ✅     |
| Hydration          | InputNumber | 0-20   | Glasses (8oz)                | ✅     |
| Resting Heart Rate | InputNumber | 40-120 | BPM, optional                | ✅     |

#### Mental State Section

| Field               | Type        | Range | Notes                             | Status |
| ------------------- | ----------- | ----- | --------------------------------- | ------ |
| Mood                | InputNumber | 1-10  |                                   | ✅     |
| Stress Level        | InputNumber | 1-10  | Inverted (1=relaxed, 10=stressed) | ✅     |
| Training Motivation | InputNumber | 1-10  |                                   | ✅     |
| Readiness to Train  | InputNumber | 1-10  |                                   | ✅     |

---

### 7. States ✅

| State               | Status | Notes                |
| ------------------- | ------ | -------------------- |
| Loading state       | ✅     | Skeleton loader      |
| Error state         | ✅     | With retry button    |
| Empty chart data    | ✅     | Graceful fallback    |
| Submitting check-in | ✅     | Button loading state |

---

## Business Logic

### Wellness Score Calculation (Documented)

```typescript
function calculateWellnessScore(data: WellnessCheckIn): number {
  const weights = {
    sleepHours: 0.2, // Target: 7-9 hours
    sleepQuality: 0.15,
    energy: 0.15,
    soreness: 0.15, // Inverted
    mood: 0.1,
    stress: 0.1, // Inverted
    motivation: 0.1,
    hydration: 0.05,
  };
  // ... normalization and inversion logic ...
  return (weightedAverage / 10) * 100;
}
```

### Body Composition Alerts (Documented)

```typescript
const WEIGHT_CHANGE_THRESHOLDS = {
  rapidLossWeekly: -2, // kg per week → DANGER
  rapidLossPercent: -3, // % per week → WARNING
  rapidGainWeekly: 2, // kg per week → WARNING
  dehydrationRisk: -1.5, // kg in 24 hours → WARNING
  competitionBuffer: 2, // kg above competition weight
};
```

### Supplement-Fatigue Correlation (Documented)

```typescript
// Low magnesium → muscle cramps, fatigue
// Low iron → reduced oxygen transport, fatigue

function assessSupplementImpact(wellness, supplements): string[] {
  if (wellness.soreness >= 7 && !supplements.magnesium.taken) {
    recommendations.push("Consider magnesium supplementation");
  }
  if (wellness.energy <= 4 && !supplements.iron.taken) {
    recommendations.push("Iron supplementation may help with low energy");
  }
}
```

---

## Data Sources

| Data                | Service                  | Method                      |
| ------------------- | ------------------------ | --------------------------- |
| Wellness history    | `WellnessService`        | `getWellnessData('7d')`     |
| Check-in submission | `UnifiedTrainingService` | `submitWellness()`          |
| Body composition    | `UnifiedTrainingService` | `latestMeasurement` signal  |
| Supplements         | `ApiService`             | `GET /api/supplements`      |
| Supplement logging  | `ApiService`             | `POST /api/supplements/log` |

---

## Navigation Paths

| From     | To          | Trigger                       |
| -------- | ----------- | ----------------------------- |
| Wellness | Performance | Body comp "View Full History" |
| Wellness | Dashboard   | After check-in submission     |

---

## Feature Comparison: Documented vs Implemented

| Documented Feature                  | Status           | Location                                      |
| ----------------------------------- | ---------------- | --------------------------------------------- |
| Sleep Hours input                   | ✅               | Check-in form                                 |
| Sleep Quality input                 | ✅               | Check-in form                                 |
| Energy Level input                  | ✅               | Check-in form                                 |
| Muscle Soreness input               | ✅               | Check-in form                                 |
| Hydration tracking                  | ✅               | Check-in form                                 |
| Resting Heart Rate                  | ✅               | Check-in form                                 |
| Mood tracking                       | ✅               | Check-in form                                 |
| Stress Level                        | ✅               | Check-in form                                 |
| Motivation tracking                 | ✅               | Check-in form                                 |
| Readiness to Train                  | ✅               | Check-in form                                 |
| Sleep chart                         | ✅               | Charts section                                |
| Recovery chart                      | ✅               | Charts section                                |
| Body Composition card               | ✅               | Shared component                              |
| Weight tracking                     | ✅               | Body comp card                                |
| Body Fat %                          | ✅               | Body comp card                                |
| Muscle Mass                         | ✅               | Body comp card                                |
| Body Water %                        | ✅               | Body comp card                                |
| BMR                                 | ✅               | Body comp card                                |
| Visceral Fat                        | ⚠️               | In component, may not display                 |
| Weight trend indicator              | ✅               | Body comp card                                |
| Weight change alerts                | ⚠️ **ADD TO UI** | Alerts section (wireframe updated)            |
| Supplement tracker                  | ✅               | Shared component                              |
| 15 default supplements              | ✅               | Pre-configured                                |
| Timing categories                   | ✅               | Morning/Pre/Post/Evening/Anytime              |
| Progress bar                        | ✅               | X/Y taken                                     |
| Add custom supplement               | ✅               | Dialog                                        |
| Remove supplement                   | ✅               | Per item                                      |
| Supplement logging                  | ✅               | API integration                               |
| Fatigue correlation recommendations | ⚠️ **ADD TO UI** | Alerts section (wireframe updated)            |
| **Hydration Quick Logger**          | ⚠️ **ADD TO UI** | Hydration Tracker section (wireframe updated) |
| **Animated water bottle**           | ⚠️ **ADD TO UI** | Hydration Tracker section (wireframe updated) |
| **Smart goal calculation**          | ⚠️ **ADD TO UI** | Based on body weight (wireframe updated)      |
| **Elevated HR alert**               | ⚠️ **ADD TO UI** | Alerts section (wireframe updated)            |
| Smart scale integration             | ❌               | Manual entry only (future feature)            |

---

## UX Notes

### ✅ What Works Well

- Comprehensive 10-field wellness check-in
- Body composition card with trend indicators
- Supplement tracker grouped by timing
- Progress bar for supplement compliance
- Lazy-loaded charts for performance
- Good empty states

### ⚠️ Friction Points

- Body composition requires separate logging (not in same form)
- Supplement-fatigue correlation not surfaced to user
- No weight change alerts shown in UI
- Smart scale integration not available

### 🔧 Suggested Improvements

1. Add quick weight log option in check-in form
2. Surface supplement recommendations based on wellness data
3. Show weight change alerts prominently
4. Add weekly compliance summary for supplements
5. Consider adding meal/food logging
6. Add menstrual cycle tracking for female athletes

---

## Related Pages

| Page                 | Route                   | Relationship               |
| -------------------- | ----------------------- | -------------------------- |
| Performance Tracking | `/performance-tracking` | Detailed body comp history |
| ACWR Dashboard       | `/acwr-dashboard`       | Load monitoring            |
| Today's Practice     | `/today`                | Morning check-in prompt    |

---

## Implementation Checklist

### Core Features (Implemented)

- [x] Page header with Log Check-in button
- [x] 4 wellness stat cards
- [x] Sleep Quality chart (lazy-loaded)
- [x] Recovery Score chart (lazy-loaded)
- [x] Body Composition card
- [x] Weight display with trend
- [x] Body Fat % with progress bar
- [x] Muscle Mass display
- [x] Body Water % display
- [x] BMR display
- [x] Body comp empty state
- [x] Body comp "View Full History" link
- [x] Supplement Tracker component
- [x] Progress bar (X/Y taken)
- [x] Morning supplements section
- [x] Pre-workout supplements section
- [x] Post-workout supplements section
- [x] Evening supplements section
- [x] Anytime supplements section
- [x] Supplement checkbox toggle
- [x] Add Supplement dialog
- [x] Remove supplement action
- [x] 15 default supplements
- [x] Daily Check-in form
- [x] Sleep Hours input
- [x] Sleep Quality input
- [x] Energy Level input
- [x] Muscle Soreness input
- [x] Hydration input
- [x] Resting HR input
- [x] Mood input
- [x] Stress Level input
- [x] Motivation input
- [x] Readiness input
- [x] Submit button with loading
- [x] Loading state
- [x] Error state with retry

### Missing Features (Add to UI - wireframe updated)

- [ ] **Hydration Quick Logger section**
  - [ ] Quick-log buttons (250ml, 500ml, Sports Drink, Custom)
  - [ ] Animated water bottle fill visualization
  - [ ] Progress bar to daily goal
  - [ ] Today's hydration log
  - [ ] Smart goal based on body weight (35ml/kg)
- [ ] **Weight & Wellness Alerts section**
  - [ ] Rapid weight loss alert (>2kg/week)
  - [ ] Dehydration risk alert (>1.5kg/24hr)
  - [ ] Rapid weight gain alert
  - [ ] Elevated resting HR alert (+10 BPM above baseline)
- [ ] **Supplement-Fatigue Recommendations**
  - [ ] Magnesium recommendation when soreness high
  - [ ] Iron recommendation when energy consistently low
  - [ ] Log supplement quick action

### Future Features

- [ ] Smart scale integration
- [ ] Food/meal logging
- [ ] Menstrual cycle tracking (female athletes)
