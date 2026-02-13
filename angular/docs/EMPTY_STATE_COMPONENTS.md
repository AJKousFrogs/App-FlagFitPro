# Empty State Components - Usage Guide

**When to use `app-empty-state` for empty/no-data scenarios**

---

## `app-empty-state` (Unified)

**Use when:** No data is available or the user hasn't logged data yet. Supports both generic empty states and context-aware "no data entered yet" scenarios.

**Features:**
- **Context presets:** `training` | `wellness` | `performance` | `nutrition` | `recovery` | `measurements` | `generic`
- Benefits list with optional "Why track this?" section
- Safety note ("We never show fake data")
- Custom overrides: `customTitle`, `customMessage`, `customActionLabel`, `customRoute`, `actionHandler`
- Compact, inline, and card-wrapped layouts
- Primary and secondary actions (routerLink or handler)
- Help link and tip

**Example (context with route):**
```html
<app-empty-state
  context="training"
  [useCard]="true"
/>
```

**Example (context with custom action):**
```html
<app-empty-state
  context="training"
  [useCard]="true"
  [customTitle]="'No Workouts Yet'"
  [customActionLabel]="'Log First Workout'"
  [actionHandler]="createNewWorkout"
/>
```

**Example (generic empty state):**
```html
<app-empty-state
  heading="No posts found"
  description="No posts match the topic #{{ selectedTopic() }}"
  icon="pi-search"
  actionLabel="Clear Filter"
  (onAction)="clearTopicFilter()"
/>
```

---

## Decision Matrix

| Scenario | Usage |
|----------|-------|
| No training/session data logged | `app-empty-state` context="training" |
| No wellness check-ins | `app-empty-state` context="wellness" |
| No sleep data (sleep-debt) | `app-empty-state` context="wellness" with customMessage |
| No cycles logged (cycle-tracking) | `app-empty-state` context="generic" with actionHandler |
| No active RTP protocol | `app-empty-state` context="recovery" with actionHandler |
| Filtered list returns no results | `app-empty-state` with custom message |
| No performance tests | `app-empty-state` context="performance" with actionHandler |
| Generic "nothing here" | `app-empty-state` context="generic" or explicit heading/description |
| Search/filter empty | `app-empty-state` (custom message + clear action) |

---

*See `shared/components/empty-state/` for implementation details.*
