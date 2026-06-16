/**
 * Recovery equipment catalogue + modality rules — DATA, not business logic.
 *
 * The equipment gate is a spec LAW: a modality is only ever recommended when its
 * trigger fires AND the athlete owns the required equipment (or it needs none).
 * Owned equipment is stored on athlete_training_config.available_equipment
 * (reused; see README "Recovery Modalities & Adaptive Load").
 *
 * Add a new modality/equipment by editing these arrays — never by branching in
 * the engine.
 */

export interface EquipmentItem {
  id: string;
  label: string;
}

/** Known recovery equipment the athlete can own. Extensible. */
export const RECOVERY_EQUIPMENT: EquipmentItem[] = [
  { id: "compression_boots", label: "Compression boots" },
  { id: "massage_gun", label: "Massage gun" },
  { id: "massage_knife", label: "Massage knife (IASTM)" },
  { id: "foam_roller", label: "Foam roller" },
  { id: "bands", label: "Resistance bands" },
  { id: "ice_bath", label: "Ice bath / cold" },
  { id: "sauna", label: "Sauna / heat" },
  { id: "physio_access", label: "Physio access" },
];

export interface RecoveryContext {
  /** Today was/will be a hard session (sprint/strength or RPE ≥ 6). */
  highLoad: boolean;
  /** ACWR above the sweet spot (> 1.3). */
  acwrSpike: boolean;
  /** Congested fixture run (heavy 14-day density). */
  congestedFixtures: boolean;
  /** Self-reported tight regions today. */
  tightnessRegions: string[];
  /** Worst active tightness severity. */
  severity: "minor" | "moderate" | "severe" | null;
  /** Readiness is low (< 55). */
  lowReadiness: boolean;
}

export interface ModalityRule {
  id: string;
  label: string;
  /** Equipment id required to recommend this; null = bodyweight, always allowed. */
  equipment: string | null;
  /** Trigger condition (product rule). */
  when: (c: RecoveryContext) => boolean;
  /** Short why, shown to the athlete. */
  reason: (c: RecoveryContext) => string;
}

const MODALITIES: ModalityRule[] = [
  {
    id: "compression_boots",
    label: "Compression boots",
    equipment: "compression_boots",
    when: (c) => c.highLoad || c.acwrSpike || c.congestedFixtures,
    reason: (c) =>
      c.acwrSpike ? "ACWR spike — flush the legs" : c.congestedFixtures ? "congested fixtures" : "high-load day",
  },
  {
    id: "massage_gun",
    label: "Massage gun",
    equipment: "massage_gun",
    when: (c) => c.tightnessRegions.length > 0 || c.highLoad || c.congestedFixtures,
    reason: (c) =>
      c.tightnessRegions.length
        ? `localized: ${c.tightnessRegions.join(", ")}`
        : c.congestedFixtures
          ? "after a congested run of games — work out the accumulated soreness"
          : "post-session release",
  },
  {
    id: "massage_knife",
    label: "Massage knife (IASTM)",
    equipment: "massage_knife",
    when: (c) => c.tightnessRegions.length > 0 && (c.severity === "moderate" || c.severity === "severe"),
    reason: () => "persistent soft-tissue tightness",
  },
  {
    id: "foam_roller",
    label: "Foam roll",
    equipment: "foam_roller",
    when: (c) => c.highLoad || c.tightnessRegions.length > 0,
    reason: () => "post-session / general soreness",
  },
  {
    id: "ice_bath",
    label: "Ice bath / cold",
    equipment: "ice_bath",
    when: (c) => c.congestedFixtures || c.acwrSpike,
    reason: () => "between congested sessions",
  },
  {
    id: "mobility",
    label: "Stretching & mobility",
    equipment: null, // always available — bodyweight
    when: (c) => c.tightnessRegions.length > 0 || c.lowReadiness,
    reason: (c) => (c.lowReadiness ? "low readiness — keep it easy" : "maintenance / tightness"),
  },
  {
    id: "physio",
    label: "See a physio",
    equipment: "physio_access",
    when: (c) => c.severity === "severe",
    reason: () => "issue crossed the threshold — get it looked at",
  },
];

export interface ModalityRecommendation {
  id: string;
  label: string;
  reason: string;
}

/**
 * Recommend recovery modalities for today's context, gated by owned equipment.
 * Pure + deterministic. `owned` is the athlete's available_equipment array.
 */
export function recommendModalities(
  ctx: RecoveryContext,
  owned: string[],
): ModalityRecommendation[] {
  const ownedSet = new Set((owned ?? []).map((e) => String(e)));
  return MODALITIES.filter(
    (m) => m.when(ctx) && (m.equipment === null || ownedSet.has(m.equipment)),
  ).map((m) => ({ id: m.id, label: m.label, reason: m.reason(ctx) }));
}
