# CHANGES — Phase D hi-fi fix pass (8-item brief)

Correctness, consistency, a11y, and spec-compliance fixes. No new features, no
restyle. Where a screen conflicted with `FLAGFIT_SPEC.md`, the spec won.

## 1 · Tokens foundation
- **`_shared/tokens.css`** already existed (created in Phase C). **Verified zero
  undefined `var(--…)`** across `system.css`, all 15 hi-fi screens, and
  `gallery.html` (grepped used-vs-defined; the only inline-only vars are the
  component-local `--p`/`--col` on `.gauge`, which is intended). No missing tokens.
- Bumped **`--text-faint`** → new primitive `--c-ink-250` `#868D98` (~5.9:1 on
  `--bg`); old `#565C68` failed WCAG AA (~2.6:1). (item 2 contrast)

## 2 · Accessibility — `01-system/system.css` (fixes every screen)
- **Sliders are now real `<input type="range">`** (`.rng`) — natively keyboard /
  arrow-key operable, focus-ring on thumb. Replaced the display-only `.slider
  .track` div + `--v` fill. Markup converted in wellness (6), training (2),
  competition (2), gallery (3) with `min/max/value/step` + `aria-label`, and the
  numeric `.val` set `aria-hidden`.
- **`.band` per-state SHAPE glyph** (`✓ ▲ ■ ● –`) replacing the color-matched dot
  → meaning survives colorblindness (non-color encoding).
- **Touch targets ≥44px:** `.btn` (incl. `.sm`) `min-height:44px`; `.icon-btn`
  38→44; tab items `min-height:44px`; switches given a 52×44 tap area.
- **Focus-visible** rings added: buttons (existing), links, tab items, icon-btn,
  avatar, range thumb, `role="switch"`.
- `settings.html` **`.sw` toggles → `<button role="switch" aria-checked
  aria-labelledby>`** with the visual track via pseudo-elements + focus ring.

## 3 · Tab-bar consistency
- Rule applied uniformly: **non-primary screens (More-children) highlight `More`.**
  Fixed **`acwr.html`** (was highlighting Wellness) → now `More`, matching
  competition/gameday/achievements/chat/notifications/profile/settings.
- Added **`aria-current="page"`** to every active tab across all 15 screens +
  gallery.

## 4 · Spec-law compliance
- **`gameday.html`** nutrition → grams + food (UX rule #6): "1.2g/kg carbs +
  protein" → "~98g carbs + 25g protein ≈ chicken rice bowl + shake"; "30–60g…" →
  "~35g ≈ banana + sports drink"; etc.
- **Engine precedence (physio block is absolute, spec §4).** The showcase had an
  active grade-1 right-hamstring block (`profile.html`) while Today/Training
  prescribed sprints — a contradiction. **Resolved by making the block WIN**, so
  the demo *demonstrates* precedence:
  - `today.html` hero → "Mobility + upper body · physio block", sprints = 0, RPE 5,
    with the mandatory personalized reason naming the injury ("right hamstring
    (grade 1) … the leg comes first").
  - `training.html` session → mobility+upper substitute; week Mon → "no sprints";
    note explains suppression.
  - `notifications.html` → replaced a stray "ACWR 1.62 danger" (which also
    contradicted the 1.18 sweet-spot shown everywhere) with the physio note.
  - `profile.html` (recovering band) + `chat.html` (Merlin already said "skip
    sprints, block active") now consistent with Today/Training/Notifications.

## 5 · Honest empty/guarded states (UX rule #8 · null ≠ low)
- Added an **insufficient-data progress variant** (using `.empty` + a progress bar,
  "12/21 days") as a labeled reference to **`today.html`, `stats.html`,
  `acwr.html`** — shows progress, never a fake "under-training".

## 6 · Chart normalization
- **`stats.html`** and **`acwr.html`** ACWR charts now share one y-scale
  (`y = 110 − (acwr/2)·100`): danger-1.5 line `y=35`, sweet band `y=45..70`,
  identical polyline. The two are now visually comparable (commented in both).

## 7 · Prototype honesty
- **`chat.html`**: the fake "Ask Merlin…" span → a **disabled `<input>` + disabled
  Send**, placeholder "(non-functional in prototype)", with a note pointing to
  `POST /api/ai/process-command`.
- **`landing.html`**: added a visible "Prototype: auth is stubbed — these links
  skip sign-in" annotation under the CTAs.

## 8 · Don't-regress (server canonical, UI never re-derives)
- Added a header comment to each data screen (today, wellness, stats, acwr,
  gameday, competition): "all metrics/bands/verdicts are STATIC stand-ins; wire to
  server at port; UI never re-derives (spec §4)". Today's hero also flagged inline.

## Spec conflicts resolved
- **Physio block vs sprint plan** → block wins (spec §4 precedence). Chosen over
  "resolve the injury" so the prototype actively demonstrates precedence.
- **ACWR 1.62 (notifications) vs 1.18 (everywhere)** → standardized to 1.18 sweet
  spot; the danger notification was replaced (no ACWR-danger when ACWR is healthy).
- **Tab highlight for ACWR** (Wellness vs More) → More (it's reached via the More
  hub; one uniform rule).

## Files touched
`_shared/tokens.css`, `01-system/system.css`, `01-system/gallery.html`, and
`02-hifi/`: today, wellness, training, stats, more, acwr, competition, gameday,
achievements, chat, notifications, profile, settings, landing, onboarding.
(`02-hifi/index.html` unchanged.) Not modified: lo-fi `00-wireframes/` set
(separate earlier artifact, intentionally un-tokenized).
