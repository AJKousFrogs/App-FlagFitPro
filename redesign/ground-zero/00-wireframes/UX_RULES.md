# UX rules (apply to every screen — locked from Today review)

Design laws, not suggestions. They carry into Phase C and the Angular port.

## 1. Answer first, context second, history third
Every screen leads with the one thing the user opened it for. Today = the plan (or
the check-in that unlocks it). Context (game proximity, weather) collapses into a
**single thin strip** above the answer. Diagnostics (readiness breakdown, ACWR
trend, last weekend) live **below the fold**. A player should read one card and
start training without scrolling.

## 2. One winning card, never stacked variants
When several states can occupy the same slot (the plan card: physio ▷ coach ▷
weather ▷ engine), **render only the winning one**. Don't show the original *and*
the override. If weather changes the plan, the hero **becomes** the adjusted plan
(title + targets), not a footnote nested inside it. Document the other states as
states (a reference block), not as live cards.

## 3. Ordering must match the data dependency
If A is computed from B, don't present A as authoritative above B when B is
missing. Not-logged → the check-in leads; the plan shows as **provisional/muted**
("based on recent data — check in to confirm"), never as a confident number on
null/stale input.

## 4. Personalize the reasoning — it's the trust anchor
The engine's one-sentence "why" must reference *this* athlete's numbers, not a
generic phase label. ❌ "Build phase. Today is a sprint day." ✅ "Your load's in
the sweet spot (1.18) and you're recovered (68/100), so we're pushing sprint
volume." Always rendered, given room.

## 5. Metric literacy — every number gets a plain-language verb
The athlete is a flag-football player, not a strength coach. Bands that already
read in English are fine ("ACWR 1.18 · Sweet spot"). Bare numbers are not:
- "RPE 8" → **"RPE 8 · hard, not maximal"** (teach the scale the first few times).
- Never surface jargon as UI copy: "EWMA uncoupled", "session-RPE", "g/kg" stay in
  the engine/docs, not on the athlete's screen.

## 6. Nutrition as food, not a spec sheet
Never show raw `g/kg` — the app knows bodyweight, so do the math and translate to
food. ❌ "6 g/kg carbs · 1.8 g/kg protein" ✅ "490g carbs ≈ big pasta bowl + oats +
2 fruit · 148g protein ≈ chicken + shake + eggs · 2.8 L". Targets are guidance, not
arithmetic homework.

## 7. Always offer back / undo
Multi-step flows (onboarding) need consistent **Back** on every step + a close/exit
— people mistap. No forward-only wizards.

## 8. Honest empty/edge states, and guard prompts
Missing data → explicit empty state, never a fake value. null ≠ low (insufficient
ACWR data shows a progress card, not "under-training"). Guard contextual prompts:
the post-event "Were you at X?" only shows if the event ended recently, started
**after** the athlete's signup, and isn't already logged.

## Open: navigation IA (confirm before locking)
4 bottom tabs (Today/Training/Wellness/Stats) can't hold ~14 screens. Proposed:
top bar carries **🔔 Notifications** + **avatar → Profile/Settings** (off the
overflow); Competition/Game-day surface contextually on Today when an event is
near; Merlin = a persistent action; the rest live in a **"More" hub screen**
(grouped Compete / Recovery / Tools / Me), not a tiny "⋯" menu. **Needs your call**
— see the question in chat.
