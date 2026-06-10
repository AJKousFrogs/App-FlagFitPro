/**
 * Training-modality model — resolves a training INTENT (sprint, plyometric,
 * strength…) into the right MODALITY, DOSE and PROGRESSION RUNG for the athlete
 * and day, and defines how each modality's load is represented so ACWR is honest.
 *
 * TUNABLE REFERENCE DATA, never magic numbers in the prescription logic. Defaults
 * are an S&C design-panel synthesis, then hardened by an adversarial physio pass
 * (every high-impact / max-CNS rung defers on amber readiness; weekly contact
 * caps are authoritative; rungs must be EARNED). Conservative by default: round
 * load weights UP, round volumes DOWN, 72h spacing for high-impact/max-CNS,
 * criteria-based (not time-based) progression.
 *
 * THE ONE RULE: an athlete must earn every rung. Never prescribe high-impact plyo
 * (single-leg pogo/hops, reactive/depth) or flat max-velocity / hill sprinting
 * cold or skipped-to. When readiness, soreness, asymmetry, ACWR>1.3 or a tissue
 * channel says no → REGRESS one rung, never skip the session.
 */

export type LoadClass =
  | "tendon_iso"
  | "low_impact"
  | "moderate_impact"
  | "high_impact"
  | "max_cns";

export interface RangeDemand {
  min: number;
  max: number;
}

export interface TrainingModality {
  key: string;
  label: string;
  loadClass: LoadClass;
  typicalRpe: RangeDemand;
  /** Concrete dose (sets×reps / foot-contacts / distance + rest + frequency). */
  dosing: string;
  tissuesLoaded: string[];
  /** Min spacing (h) before another high-load session of this class. */
  recoveryHours: number;
  /** What must be earned/true before this rung (progression gate). */
  prerequisite: string;
  /**
   * ACWR LOAD WEIGHTING. rpe×min structurally under-counts short, intense,
   * high-tissue/CNS work; this factor scales the session's internal load so a
   * 12-min RPE9 max-V (108 raw) reads ~216 AU — comparable to a 60-min field
   * session — and correctly inflates acute load. Conservative (rounded up).
   */
  loadFactor: number;
  /** Per-foot-contact weight for the (future) contact-load channel. */
  contactWeight?: number;
}

/**
 * Whether a modality must DEFER on amber/red readiness or recent same-class load.
 * Physio P0 fix: keyed off loadClass so EVERY high-impact and max-CNS rung (incl.
 * hill sprints) defers identically — not an enumerated list that can miss one.
 */
export function defersOnReadiness(loadClass: LoadClass): boolean {
  return loadClass === "high_impact" || loadClass === "max_cns";
}

export const TRAINING_MODALITIES: Record<string, TrainingModality> = {
  tendon_isometric: {
    key: "tendon_isometric",
    label: "Isometric tendon / early loading",
    loadClass: "tendon_iso",
    typicalRpe: { min: 4, max: 7 },
    dosing:
      "Capacity/analgesic: 5×30–45s holds ~60–70% MVC, rest 60–120s (Spanish squat, wall-sit ~60°, seated soleus + standing gastroc iso, hamstring-bridge iso, Copenhagen squeeze). Or neural: 3–5×3–6s near-max, rest 30–60s. 3–5×/week (daily ok at low intensity for analgesia); ≥48h between heavy holds, same tendon.",
    tissuesLoaded: ["patellar_tendon", "achilles_tendon", "soleus", "gastrocnemius", "quadriceps", "hamstring", "adductor"],
    recoveryHours: 24,
    prerequisite: "None — entry rung, always available. Usable through stable non-reactive tendon pain ≤3/10 that isn't worse next morning.",
    loadFactor: 0.8,
  },
  eccentric_tempo: {
    key: "eccentric_tempo",
    label: "Eccentric / tempo & heavy-slow strength",
    loadClass: "moderate_impact",
    typicalRpe: { min: 5, max: 8 },
    dosing:
      "Tempo/HSR 3–4×6–8, 3–4s eccentric (tempo squat, RDL, heel-drop calf 3×12–15). Nordic hamstring 1×5→2×8→3×12 over 6–8wk, 2–3×/week. Copenhagen 1×3→3×10. Rest 90–180s; ≥48h same tissue; never the day before high plyo or max-V.",
    tissuesLoaded: ["hamstring", "quadriceps", "patellar_tendon", "achilles_tendon", "soleus", "gastrocnemius", "adductor"],
    recoveryHours: 48,
    prerequisite: "Pain-free isometric loading at target intensity/ROM ≥1 week; no acute strain in target tissue within 14 days.",
    loadFactor: 1.1,
  },
  bodyweight_circuit: {
    key: "bodyweight_circuit",
    label: "Bodyweight-only progressive session",
    loadClass: "low_impact",
    typicalRpe: { min: 4, max: 7 },
    dosing:
      "Intent selects the variant, never a downgrade. Strength: 3–4 rounds RIR 1–2 via tempo+unilateral+leverage (split squat→RFE→single-leg sit-to-stand, single-leg RDL, banded/assisted Nordic, Copenhagen). Conditioning: EMOM/AMRAP 1:1–1:2, 15–25 min. Plyo/iso intents run the EARNED rung with bodyweight. 2–4×/week.",
    tissuesLoaded: ["quadriceps", "hamstring", "adductor", "soleus", "gastrocnemius"],
    recoveryHours: 24,
    prerequisite: "None — universal fallback when no equipment/facility. Tissue gating + contact cap apply identically; the ladder never stalls for lack of a gym.",
    loadFactor: 1.0,
  },
  plyo_bilateral_low: {
    key: "plyo_bilateral_low",
    label: "Bilateral low-intensity plyo (extensive)",
    loadClass: "moderate_impact",
    typicalRpe: { min: 5, max: 7 },
    dosing:
      "Sub-maximal, on grass/turf. Line hops, low hurdle hops ≤15–20cm, submax CMJ to soft landing, snap-downs. NOVICE start 40–50 contacts at 1×/week (stay under the foundation phase cap), build to ~80–100 over weeks; sets of 8–12, rest 60–90s; 2×/week max, ≥48h, ≥48h from lower-body max strength.",
    tissuesLoaded: ["achilles_tendon", "soleus", "gastrocnemius", "patellar_tendon", "quadriceps"],
    recoveryHours: 48,
    prerequisite: "4+ weeks eccentric/tempo with no morning tendon stiffness; quiet stick-2s bilateral landing (knee-over-toe, no valgus); pain-free isometrics. Floor of the plyo ladder — earn before ANY pogo.",
    loadFactor: 1.3,
    contactWeight: 1.0,
  },
  pogo_bilateral: {
    key: "pogo_bilateral",
    label: "Bilateral pogo (ankle stiffness / reactive base)",
    loadClass: "moderate_impact",
    typicalRpe: { min: 5, max: 7 },
    dosing:
      "Stiff-ankle rebound hops, minimal knee bend, short ground contact ('short and stiff'). 4–6×10–15 = 40–90 contacts, rest 60–90s; STOP the set the moment ground-contact lengthens. 2×/week, ≥48h.",
    tissuesLoaded: ["achilles_tendon", "soleus", "gastrocnemius", "patellar_tendon"],
    recoveryHours: 48,
    prerequisite: "~80 low-plyo contacts pain-free, no next-morning Achilles/soleus stiffness; stiff quiet landings; bilateral calf-raise ≥20 reps.",
    loadFactor: 1.3,
    contactWeight: 1.0,
  },
  pogo_single_leg: {
    key: "pogo_single_leg",
    label: "Single-leg pogo (unilateral reactive)",
    loadClass: "high_impact",
    typicalRpe: { min: 6, max: 8 },
    dosing:
      "Single-leg stiff rebound hops, stable knee. 3–4×6–8 PER LEG, full rest ~2min; track L/R symmetry. 1×/week, ≥72h. Counts 2× per limb toward the weekly single-leg contact cap (≤400 weighted/wk authoritative — regress when reached).",
    tissuesLoaded: ["achilles_tendon", "soleus", "gastrocnemius", "patellar_tendon", "adductor"],
    recoveryHours: 72,
    prerequisite: "Bilateral pogo clean at full dose ≥2 weeks, pain-free morning; single-leg calf-raise ≥15–20 each side; single-leg landing held 3s; <10% L/R asymmetry.",
    loadFactor: 1.6,
    contactWeight: 2.0,
  },
  plyo_single_leg: {
    key: "plyo_single_leg",
    label: "Single-leg hops / skater bounds",
    loadClass: "high_impact",
    typicalRpe: { min: 6, max: 8 },
    dosing:
      "Forward hops, lateral bounds, skaters. 3–4×4–6 PER LEG, controlled landing each rep early; rest 90–120s. 2×/week max, ≥72h. Counts 2× per limb toward the single-leg cap (≤400 weighted/wk).",
    tissuesLoaded: ["achilles_tendon", "soleus", "gastrocnemius", "patellar_tendon", "quadriceps", "hamstring", "adductor"],
    recoveryHours: 72,
    prerequisite: "Single-leg pogo competency pain-free; bilateral plyo mastery; multidirectional single-leg landing control; no ankle instability; <10% asymmetry; ACLR ≥12 months if applicable.",
    loadFactor: 1.7,
    contactWeight: 2.0,
  },
  plyo_reactive_depth: {
    key: "plyo_reactive_depth",
    label: "Reactive / depth jumps (max SSC)",
    loadClass: "high_impact",
    typicalRpe: { min: 7, max: 9 },
    dosing:
      "True high-intensity, capped LOW: ≤40 contacts/session TOTAL, 3–6×4–6, drop 20–40cm (start 20–30), progress by ground-contact/RSI not height. Full rest 2–3min, quality-gated. 1×/week in-season (2× peak only), never consecutive days, never <72h from prior high-impact/max-CNS.",
    tissuesLoaded: ["achilles_tendon", "soleus", "gastrocnemius", "patellar_tendon", "quadriceps"],
    recoveryHours: 72,
    prerequisite: "All prior plyo rungs incl. single-leg mastered; ≥12 weeks plyo history; short ground-contact/adequate RSI; ~1.5×BW squat or robust BW equivalent; ACLR ≥12 months; readiness green. Never entered cold — top rung.",
    loadFactor: 2.0,
    contactWeight: 3.0,
  },
  sprint_flat_submax: {
    key: "sprint_flat_submax",
    label: "Flat build-ups / extensive tempo (on-ramp)",
    loadClass: "moderate_impact",
    typicalRpe: { min: 5, max: 7 },
    dosing:
      "Build-ups/strides 6–10×30–60m at 70–90% rising effort, full walk-back rest (~1min/10m). 1–2×/week. The on-ramp that builds high-speed tolerance before any hill or max-V.",
    tissuesLoaded: ["hamstring", "soleus", "gastrocnemius", "achilles_tendon", "quadriceps"],
    recoveryHours: 48,
    prerequisite: "General running capacity; pain-free jogging/tempo; hamstring/calf symptom-free; completed dynamic sprint warm-up incl. progressive accelerations.",
    loadFactor: 1.2,
  },
  hill_sprint: {
    key: "hill_sprint",
    label: "Hill sprints (accel emphasis, lower hamstring strain)",
    loadClass: "high_impact",
    typicalRpe: { min: 7, max: 9 },
    dosing:
      "Gradient 5–12% (default 6–10%). 4–8×20–40m, full recovery (2–3min). 1×/week. Mandatory bridge AFTER flat build-ups, BEFORE flat max-V — incline caps top speed → lower peak hamstring eccentric strain than flat max-V, while overloading accel mechanics.",
    tissuesLoaded: ["hamstring", "soleus", "gastrocnemius", "achilles_tendon", "glute"],
    recoveryHours: 72,
    prerequisite: "2–4 weeks flat build-ups pain-free; eccentric-hamstring base (Nordic progressed); no hamstring strain within 21 days; full sprint-specific warm-up; <10% asymmetry.",
    loadFactor: 1.7,
  },
  sprint_flat_maxv: {
    key: "sprint_flat_maxv",
    label: "Flat max-velocity sprinting",
    loadClass: "max_cns",
    typicalRpe: { min: 8, max: 10 },
    dosing:
      "Short max-V: 4–6×20–40m fly/build-to-max, FULL recovery (~1min per 10m, ≥3–4min at true max-V). 1×/week (2× peak). Weekly max-V distance cap ≤600m, +≤10%/wk. Never cold, never <72h from prior high-impact/max-CNS.",
    tissuesLoaded: ["hamstring", "soleus", "gastrocnemius", "achilles_tendon", "glute"],
    recoveryHours: 72,
    prerequisite: "Earned via flat build-ups AND hill sprints pain-free ≥3–4 weeks; ≥90% running exposure with no hamstring symptoms; eccentric-hamstring base; <10% asymmetry; readiness green; full warm-up.",
    loadFactor: 2.0,
  },
};

/**
 * Progression ladders — advance ONE rung only when the current rung's full dose
 * is completed pain-free (load pain ≤3/10, not worse next morning), ~2–4 weeks
 * per rung. Rehab re-entry is criteria-based, not time-based; high-impact rungs
 * (incl. hill_sprint) require restored <10% L/R symmetry.
 */
export const PROGRESSIONS = {
  lowerLimbPlyo: [
    "tendon_isometric",
    "eccentric_tempo",
    "plyo_bilateral_low",
    "pogo_bilateral",
    "pogo_single_leg",
    "plyo_single_leg",
    "plyo_reactive_depth",
  ],
  sprintSpeed: ["sprint_flat_submax", "hill_sprint", "sprint_flat_maxv"],
  returnToSport: [
    "tendon_isometric",
    "eccentric_tempo",
    "bodyweight_circuit",
    "plyo_bilateral_low",
    "sprint_flat_submax",
    "pogo_bilateral",
    "hill_sprint",
    "pogo_single_leg",
    "plyo_single_leg",
    "sprint_flat_maxv",
  ],
} as const;

/** Conservative DEFAULT rung when an athlete's earned stage isn't tracked yet —
 * always the entry/floor of the relevant ladder (earn upward from here). */
export const DEFAULT_RUNG = {
  plyometric: "plyo_bilateral_low",
  sprint: "sprint_flat_submax",
} as const;

/**
 * ACWR treatment. The canonical EWMA (acute N7 λ0.25 / chronic N21 λ0.0909,
 * uncoupled) is UNCHANGED — modality weighting flows through the stored
 * `workload` field (computeSessionLoad prefers it over rpe×min). A high-impact /
 * max-CNS day also floors at a minimum AU so a tiny-but-brutal session is never
 * trivial. Contact + high-speed-distance channels (separate same-math ACWRs) and
 * their caps are reference data here, applied once contact/distance logging is
 * wired. The day is gated by the MOST RESTRICTIVE of every channel + cap.
 */
export const MODALITY_ACWR = {
  highImpactDayFloorAu: 150,
  weeklyContactCapBuild: 1200, // weighted contacts, build phase
  weeklySingleLegContactCap: 400, // weighted, authoritative — regress when reached
  highIntensityContactPerSessionCap: 40, // reactive/depth
  weeklyContactGrowthMax: 0.15, // ≤15% week-on-week
  weeklyMaxVDistanceCapM: 600,
  weeklyMaxVDistanceGrowthMax: 0.1,
  hillMaxVImpactWeight: 0.7, // hill metres vs flat for impact
  hillHamstringWeight: 1.3, // hill metres vs flat for hamstring exposure (gate on the higher)
} as const;

/**
 * Soft-tissue gating. Warm-up is MANDATORY before any moderate+ impact and gates
 * every high-impact/max-CNS session — never high-impact plyo or max-V from cold.
 * Readiness/soreness/spacing DEFER the high rung DOWN the ladder (training still
 * happens); on deferral, substitute the rung directly below at matched RPE.
 */
export const SOFT_TISSUE_GATING = {
  warmupMandatoryForImpact: true,
  spacingHoursHighImpact: 72, // never two high-impact/max-CNS lower-limb within 72h
  sameTissueEccentricPlyoSpacingH: 48,
  asymmetryDeferThreshold: 0.1, // >10% L/R defers high-impact (incl. hill_sprint)
  acwrBlockNewHighImpact: 1.3,
  acwrForceRegression: 1.5,
  /** On deferral, drop to this rung (matched RPE) rather than skipping. */
  deferralSubstitution: {
    pogo_single_leg: "pogo_bilateral",
    plyo_single_leg: "plyo_bilateral_low",
    plyo_reactive_depth: "plyo_bilateral_low",
    sprint_flat_maxv: "hill_sprint",
    hill_sprint: "sprint_flat_submax",
  } as Record<string, string>,
  deferTriggers: [
    "target-tissue soreness/DOMS >3/10, present >48h, or worse next morning",
    "tendon pain >3/10 during/after the prior session, or not back to baseline next morning",
    "a high-CNS or high-impact lower-limb session within the last 72h",
    "cold / no warm-up, or cold/wet/slick conditions (Achilles/hamstring risk)",
    "readiness amber/red (sleep, wellness)",
    "lost movement quality (long/loud ground-contact, asymmetry >10%)",
    "session-RPE / contact / sprint ACWR >1.3, or any absolute weekly cap reached",
  ],
} as const;
