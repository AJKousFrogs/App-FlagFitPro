# Semantic Meaning System (SMS)

**Generated:** January 2026  
**Purpose:** Meaning-first architecture that prevents semantic fragmentation  
**Status:** ✅ Core System Created

---

## The Problem: Semantic Fragmentation

**You no longer have a UX problem. You have a meaning system problem.**

The same four meanings exist everywhere in the product, but they change shape, color, and location depending on context. That forces users to re-learn interpretation every time.

**In a performance + health system, that is dangerous.**

### Why This Is Critical (Not Cosmetic)

Humans do not parse dashboards analytically. They scan for recognizable signals.

**Right now:**
- Yellow sometimes means warning, sometimes attention, sometimes FYI
- Red sometimes means danger, sometimes just highlight
- A badge sometimes means status, sometimes problem, sometimes info
- Placement does not predict importance

**So users ask subconsciously:**
> "Is this the same thing as before, or something new?"

**That hesitation is the failure.**

### What Breaks

1. **Pattern Recognition** - Users can't recognize patterns across contexts
2. **Urgency Calibration** - Users can't calibrate urgency consistently
3. **Trust Transfer** - Users can't transfer trust from one context to another
4. **Muscle Memory** - Users can't develop muscle memory for actions

---

## The Solution: Semantic Meaning System (SMS)

### Rule Zero (Non-Negotiable)

**Meaning is defined once. Components are just renderers.**

### The Missing Layer

You need a **meaning-first abstraction** that sits above components.

**Features do not choose components.**
**Features choose meanings.**
**The UI layer decides visual representation.**

---

## The Four Canonical Meanings

These meanings are **immutable** and **globally defined**.

### 1. RISK

**System Definition:** Elevated injury / overload probability  
**User Interpretation:** "Something may harm me if ignored"

**Visual Grammar:**
- **Color:** Red ONLY (never yellow, never orange for risk)
- **Icon:** ⚠️ (warning triangle)
- **Primary Component:** RiskBanner
- **Placement:** Top of context container
- **Severity:** Handled by copy + intensity, NOT color swaps

**Never Again:**
- ❌ Yellow risk
- ❌ Risk buried in cards
- ❌ Risk expressed only as a tag

**Semantic Contract:**
```typescript
{
  type: "risk",
  severity: "critical", // low | moderate | high | critical
  source: "acwr",
  affectedEntity: "training-plan",
  message: "ACWR is 1.55 - danger zone threshold exceeded",
  recommendation: "Reduce load 20-30%"
}
```

### 2. INCOMPLETE DATA

**System Definition:** Reduced model confidence  
**User Interpretation:** "System is less reliable right now"

**Visual Grammar:**
- **Color:** Amber / Orange ONLY (never yellow)
- **Icon:** ⧗ (hourglass or data icon)
- **Primary Component:** DataConfidenceIndicator
- **Placement:** Attached to the metric it affects

**Never Again:**
- ❌ Multiple confidence bars
- ❌ Data warnings floating independently of data
- ❌ Yellow for incomplete data

**Semantic Contract:**
```typescript
{
  type: "incomplete-data",
  severity: "critical", // warning | critical
  dataType: "wellness",
  daysMissing: 3,
  affectedMetric: "acwr",
  confidenceImpact: 0.3, // 0.0 to 1.0
  message: "Missing wellness data reduces ACWR accuracy"
}
```

### 3. ACTION REQUIRED

**System Definition:** Progress blocked without input  
**User Interpretation:** "I must do something"

**Visual Grammar:**
- **Color:** White surface + strong border (not colored background)
- **Icon:** → (arrow) or ✔︎ (checkmark)
- **Primary Component:** ActionPanel
- **Placement:** Inline, blocking progression

**Rule:**
If action is required, it must:
- ✅ contain the action
- ✅ be dismissible only by action
- ✅ never be passive text

**Never Again:**
- ❌ Passive tags saying "action required"
- ❌ Yellow badges for actions
- ❌ Actions buried in text

**Semantic Contract:**
```typescript
{
  type: "action-required",
  urgency: "critical", // low | medium | high | critical
  actionType: "complete-wellness",
  actionRoute: ["/wellness"],
  actionLabel: "Complete Wellness Check-in",
  blocking: true, // Blocks progression
  message: "Wellness check-in required to continue"
}
```

### 4. COACH OVERRIDE

**System Definition:** Human decision replaced automation  
**User Interpretation:** "Coach intentionally intervened"

**Visual Grammar:**
- **Color:** Blue (informational, authoritative)
- **Icon:** 👤 (person/user icon)
- **Primary Component:** OverrideNotice
- **Placement:** Directly on modified entity

**Mandatory Content:**
- ✅ What AI suggested
- ✅ What coach changed
- ✅ (Optional) why

**Rule:**
**No silent overrides. Ever.**

**Semantic Contract:**
```typescript
{
  type: "coach-override",
  overrideType: "load-adjustment",
  affectedEntity: "training-plan",
  aiRecommendation: { load: 8, intensity: "high" },
  coachDecision: { load: 6, intensity: "medium" },
  coachId: "coach-123",
  coachName: "Coach Smith",
  reason: "Reducing load due to ACWR spike",
  timestamp: new Date()
}
```

---

## Implementation Model

### Before (Component-First - WRONG)

```typescript
// ❌ Feature chooses component directly
<app-risk-badge [level]="'high'" [placement]="'top-right'"></app-risk-badge>
```

### After (Meaning-First - CORRECT)

```typescript
// ✅ Feature chooses meaning
const riskMeaning: RiskMeaning = {
  type: "risk",
  severity: "high",
  source: "acwr",
  affectedEntity: "training-plan",
  message: "ACWR is elevated",
  recommendation: "Reduce load"
};

// ✅ Renderer decides component
<app-semantic-meaning-renderer 
  [meaning]="riskMeaning"
  [context]="{ container: 'dashboard', priority: 'high' }">
</app-semantic-meaning-renderer>
```

### Service API

```typescript
// Features call renderer service
const renderDecision = semanticRenderer.renderMeaning({
  meaning: riskMeaning,
  context: {
    container: "dashboard",
    priority: "high",
    dismissible: false
  }
});

// Renderer returns:
// {
//   component: "app-risk-badge",
//   props: { level: "high", placement: "top", ... },
//   placement: "top",
//   priority: 4
// }
```

---

## Development Rules

### Rule 1: Features Choose Meanings, Not Components

**❌ WRONG:**
```typescript
// Feature directly chooses component and props
<app-risk-badge [level]="'high'"></app-risk-badge>
```

**✅ CORRECT:**
```typescript
// Feature defines meaning
const meaning: RiskMeaning = {
  type: "risk",
  severity: "high",
  // ...
};

// Renderer chooses component
<app-semantic-meaning-renderer [meaning]="meaning"></app-semantic-meaning-renderer>
```

### Rule 2: No Color Choices in Features

**❌ WRONG:**
```typescript
// Feature chooses color
<div [style.color]="riskLevel === 'high' ? 'red' : 'yellow'"></div>
```

**✅ CORRECT:**
```typescript
// Meaning defines severity, renderer chooses color
const meaning: RiskMeaning = {
  type: "risk",
  severity: "high", // Renderer maps to red
  // ...
};
```

### Rule 3: No Placement Choices in Features

**❌ WRONG:**
```typescript
// Feature chooses placement
<app-risk-badge [placement]="'top-right'"></app-risk-badge>
```

**✅ CORRECT:**
```typescript
// Context defines container, renderer chooses placement
<app-semantic-meaning-renderer 
  [meaning]="meaning"
  [context]="{ container: 'card' }"> // Renderer maps to top-right
</app-semantic-meaning-renderer>
```

### Rule 4: Validation Enforces Semantic Rules

The system validates meanings to ensure they follow semantic rules:

```typescript
const validation = validateMeaning(meaning);
if (!validation.valid) {
  // Log warning, prevent rendering
  console.warn("Meaning validation failed:", validation.errors);
}
```

**Enforced Rules:**
- Risk MUST be red (never yellow)
- Incomplete data MUST be orange (never yellow)
- Action required MUST be blocking if critical/high
- Coach override MUST include AI recommendation and coach decision

---

## Migration Guide

### Step 1: Identify All Meaning Instances

Find all places where meanings are rendered:

```bash
# Find risk indicators
grep -r "risk-badge\|risk-high\|risk-critical" angular/src

# Find incomplete data indicators
grep -r "incomplete\|missing.*data\|confidence" angular/src

# Find action required indicators
grep -r "action.*required\|action.*needed" angular/src

# Find coach override indicators
grep -r "coach.*override\|override.*badge" angular/src
```

### Step 2: Convert to Semantic Meanings

For each instance:

1. **Extract meaning** from current component usage
2. **Create semantic meaning object** using canonical types
3. **Replace component** with `<app-semantic-meaning-renderer>`
4. **Remove direct component imports**

**Example Migration:**

**Before:**
```typescript
// roster-player-card.component.ts
<app-risk-badge 
  [level]="enrichedPlayer().riskLevel" 
  [placement]="'top-right'">
</app-risk-badge>
```

**After:**
```typescript
// roster-player-card.component.ts
riskMeaning = computed(() => ({
  type: "risk" as const,
  severity: enrichedPlayer().riskLevel,
  source: "player-metrics",
  affectedEntity: `player-${player().id}`,
  message: getRiskMessage(enrichedPlayer()),
  recommendation: getRiskRecommendation(enrichedPlayer())
}));

// Template
<app-semantic-meaning-renderer 
  [meaning]="riskMeaning()"
  [context]="{ container: 'card', priority: 'high' }">
</app-semantic-meaning-renderer>
```

### Step 3: Remove Direct Component Usage

After migration, remove:
- Direct imports of `RiskBadgeComponent`, etc.
- Direct usage of `<app-risk-badge>`, etc.
- Color/style choices in feature code
- Placement choices in feature code

### Step 4: Verify Semantic Rules

Run validation to ensure all meanings follow rules:

```typescript
// In component or service
const validation = validateMeaning(meaning);
if (!validation.valid) {
  this.logger.warn("Semantic rule violation:", validation.errors);
}
```

---

## How You Know This Worked

After refactor, users should be able to say:

- ✅ **"Red always means risk."**
- ✅ **"Orange always means the system is less sure."**
- ✅ **"Blue means my coach stepped in."**
- ✅ **"If I see a white panel, I must act."**

**If they can't say that instinctively, the system is still broken.**

---

## Priority Order for Migration

Based on safety and trust impact:

### Priority 1 — Risk (Safety)
- Remove all non-canonical risk expressions
- Replace with unified RiskBanner via semantic renderer
- Ensure identical meaning = identical signal everywhere

### Priority 2 — Coach Override (Trust)
- One override notice, everywhere
- Always visible to player
- Always attached to change

### Priority 3 — Incomplete Data (Accuracy)
- Single confidence model
- One indicator per affected metric
- No global warnings detached from numbers

### Priority 4 — Action Required (Flow)
- Replace passive tags and text
- Introduce blocking ActionPanel
- If action exists, it must be clickable

---

## Status

✅ **Core System Created**
- ✅ Semantic meaning types defined
- ✅ Semantic renderer service created
- ✅ Semantic meaning renderer component created
- ✅ Validation rules enforced

⏳ **Next Steps**
- Migrate all risk indicators to semantic meanings
- Migrate all incomplete data indicators to semantic meanings
- Migrate all action required indicators to semantic meanings
- Migrate all coach override indicators to semantic meanings
- Remove direct component usage
- Verify users can recognize meanings instinctively

---

**This system ensures meaning is stable, visual grammar is consistent, and users can develop pattern recognition and muscle memory.**

