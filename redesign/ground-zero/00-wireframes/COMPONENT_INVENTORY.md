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
- **Season / macro-phase banner** — off-season / pre-season / in-season / transition
  + week-in-block; links to the season-calendar editor. See SEASON_LOGIC.md.
- **Season-calendar editor** — pick off-season months / windows (non-contiguous);
  used in onboarding + Settings.
- **Check-in form card** — the wellness sliders + submit; and its "logged ✓"
  collapsed state.
- **Post-event prompt** — "Were you at {event}? How many of {N} games?" inline form.
- **Hydration logger** — quick-add (e.g. +250/+500 ml) + daily total vs target.
- **Nutrition target card** — engine-derived carbs/protein/fluid (display-only).
- **Session row + detail** — with **exercise demo video** slot (loop) and
  log/complete action.
- **Achievement / streak card** — earned badges + current streak.
- **Safety / alert banner** — injury/RTP block, ACWR danger, pain trigger.
- **Weather card** — current temp/feels-like/condition/wind + outdoor-suitability
  band (good/moderate/poor); drives the weather-adjusted prescription variant.
- **Weather-adjusted prescription** — variant of the prescription card showing the
  original→adjusted intent + reason ("rain → moved indoors"). See WEATHER_LOGIC.md.

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

## Imagery & motion layer (added 2026-06-02 — makes it feel like an app)
- **Photo hero** (`.hero-photo`) — full-bleed athlete photo + bottom scrim +
  overlaid display type/CTA. Sizes: full (landing) + `.sm` (featured/"For you").
- **Photo slot** (`.photo`) — generic image area; real `<img>` covers it, gradient
  placeholder otherwise.
- **Photo thumb card** (`.thumb-card` + `.thumb`) — list/progress row with a photo
  thumbnail (drills, programs, featured).
- **Gradient gauge** (`.gauge.grad`) — readiness ring in the brand gradient.
- **FAB** (`.fab`) — floating quick-action (log check-in / hydration / session),
  brand-gradient, above the tab bar on the 5 spine screens.
- **Brand gradient** — `--grad-brand` (mint `--accent` → lavender `--accent-2`):
  rings, FAB, featured cards, value-prop thumbs. The dark base stays; the gradient
  is an accent, not a wash.

> **Club imagery rule:** all photography is **male flag-football athletes** (this is
> a male 16+ club). No stock fitness models / women / youth. Prototype uses labeled
> placeholders; licensed shots go in at port.
