# REDESIGN-NOTES

Log of UI-polish observations that were deliberately **not** acted on because
they are (or might be) logic, or fall outside the current pass's scope.
Rule of thumb from the polish protocol: _if unsure whether something is UI or
logic → it's logic → don't touch → log it here._

## Pass B — data-viz modernization (2026-07-10)

- **No draw-in animation on chart lines.** The protocol allows one, but the
  standard technique (stroke-dashoffset) animates a paint property, not
  transform/opacity — so it's out by the motion rules. Charts inherit the
  Pass A screen-entrance instead; nothing chart-specific loops or pulses.
- **Load-calendar heatmap + coverage grid left alone.** They're categorical
  grids, not line charts — the gradient system doesn't apply, and their cell
  colors ENCODE data (restyling them would be a semantics change, i.e. logic).
- **Today micro-sparkline gets no glow endpoint** — 26px tall; a glow marker
  there is noise, not comprehension ("don't over-glow").
- **Endpoint dots keep ZONE colors** (danger/caution/good) with a same-hue
  glow; the signature gradient styles only the line/area and never encodes
  state. The numeric label remains the primary (colorblind-safe) encoder.
- **Local screenshots show empty chart states** (dev has no API data), so the
  visual treatment was verified via a token-exact static harness in Chromium +
  AA contrast math; live pages render the same components with real data.

## Pass A — interaction layer (2026-07-10)

- **Training (`.tr`) screen gets no entrance motion.** Its session-runner
  layout doesn't use the `.screen`/`.stack` scaffolds the shared entrance
  rules target, and hand-tuning per screen is against the pass rules. If the
  runner should have an entrance, add a scaffold class in its template (a
  1-line template change) rather than duplicating animation CSS.
- **Focus ring now fades in over `--t-fast` (120 ms)** because `box-shadow`
  joined the shared transition set. Standard behaviour, noted in case anyone
  expects an instant ring.
- **Skeleton loaders keep their own pulse** (`skeleton.component.ts` has a
  local reduced-motion fallback) — left untouched; loading indication is
  comprehension, not decoration.
- **Not animated on purpose:** static `.card`s (not interactive), data
  bars/progress fills (values must read instantly), anything that would loop.
