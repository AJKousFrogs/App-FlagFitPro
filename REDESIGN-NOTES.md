# REDESIGN-NOTES

Log of UI-polish observations that were deliberately **not** acted on because
they are (or might be) logic, or fall outside the current pass's scope.
Rule of thumb from the polish protocol: *if unsure whether something is UI or
logic → it's logic → don't touch → log it here.*

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
