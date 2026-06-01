# Component Inventory (the Phase C gallery contract)

Every athlete screen is assembled **only** from these. If a screen needs
something new, it goes here first, then into the Phase C gallery — that rule is
what stops the per-screen drift. Derived from the core-journey wireframes.

## Primitives
- **Button** — variants: primary, secondary, ghost, destructive; sizes: sm/md/lg;
  states: default/hover/active/focus/disabled/loading; icon-leading + icon-only.
- **Input** — text, number, textarea, select; with label, helper, error, unit
  suffix (kg, ml, hrs).
- **Slider / stepper** — the 1–10 RPE & wellness scales (sleep, soreness, energy,
  mood, stress); discrete ticks + current value.
- **Chip / tag** — phase ("Accumulation"), intent ("Sprint focus"), status.
- **Badge** — numeric (notification count), streak count.
- **Icon** — the nav + status icon set (calendar, bolt, heart, chart-line, …).
- **Avatar** — athlete photo + initials fallback.
- **Tabs** — section switcher (Training hub, Settings, Stats).
- **Progress** — linear (data sufficiency "12/21 days") + radial (readiness 0–100).
- **Skeleton / spinner** — loading states.

## Status & data-display
- **Metric card** — big number + label + delta + state. Used for ACWR, readiness,
  load. Must support: real value, low-confidence caveat, and the **empty/null
  state** (gray "Insufficient data" with progress).
- **Band indicator** — the ACWR/readiness band (under/sweet/elevated/danger ·
  low/moderate/high) as a colored gauge + label + one-line guidance.
- **Stat tile** — small KPI (games this week, sessions logged, streak).
- **Trend chart** — line/area for ACWR, readiness history, load (sparkline + full).
- **List row** — session, event, notification, exercise (with optional thumbnail).
- **Empty state** — icon + message + CTA (the data-state contract surfaces).

## Composite / domain
- **Prescription card (hero)** — the Today headline: intent label + reason
  sentence + targets (RPE/min/sprints/sets) + nutrition mini-summary. Variants per
  intent incl. **rest** and **safety-block** (leads with the block).
- **Game-proximity / phase banner** — countdown + event name + game count + phase.
- **Check-in form card** — the wellness sliders + submit; and its "logged ✓"
  collapsed state.
- **Post-event prompt** — "Were you at {event}? How many of {N} games?" inline form.
- **Hydration logger** — quick-add (e.g. +250/+500 ml) + daily total vs target.
- **Nutrition target card** — engine-derived carbs/protein/fluid (display-only).
- **Session row + detail** — with **exercise demo video** slot (loop) and
  log/complete action.
- **Achievement / streak card** — earned badges + current streak.
- **Safety / alert banner** — injury/RTP block, ACWR danger, pain trigger.

## Shell
- **Top bar** — contextual title/greeting + date + overflow.
- **Bottom nav** — 4 tabs (Today/Training/Wellness/Stats).
- **Side / "More" drawer** — grouped nav (Home/Athlete/Team/Tools/Me).
- **Section header** — title + optional action.
- **Modal / sheet** — bottom sheet for quick actions (log hydration, RSVP).
- **Toast** — save confirmation / error.

## Media
- **Video embed** — two presets: (a) **demo loop** (muted, inline, in exercise/
  session detail), (b) **feature player** (Film/VideoFeed + Landing hero).
- **Hero block** — Landing/onboarding only (headline + sub + primary CTA + media).
