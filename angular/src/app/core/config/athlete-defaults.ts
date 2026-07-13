/**
 * Shared athlete defaults — the SINGLE source for constants that were previously
 * copy-pasted across the periodization engine, the supplements screen, and the
 * gameday tournament planner. Per SOURCE_OF_TRUTH §4, the same value in multiple
 * places is a drift bug even when the numbers currently agree.
 */

/**
 * Fallback bodyweight (kg) when an athlete has no weight on file. Used only to
 * keep per-kg nutrition/hydration math from collapsing to zero — it is a display
 * default, never a fabricated "real" measurement. 80 kg ≈ a typical adult male
 * flag-football player (this club is male-only 16+). Callers that HAVE a real
 * weight always prefer it (`weightKg ?? FALLBACK_BODYWEIGHT_KG`).
 */
export const FALLBACK_BODYWEIGHT_KG = 80;
