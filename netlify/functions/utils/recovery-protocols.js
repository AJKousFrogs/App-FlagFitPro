// Recovery modalities — single source of truth, evidence-graded.
//
// Grounded in the FlagFit Pro evidence review (2026-07). This replaces the loose,
// pre-evidence catalogue that used to live privately in recovery-core.js. The
// daily-protocol recovery day AND the /api/recovery endpoint both resolve from
// here, so an athlete never sees two different recovery prescriptions.
//
// FIVE PRINCIPLES this file encodes (do not "improve" a modality out of line with
// these — they are the honest evidence):
//   1. Sleep + nutrition + load-management DWARF every passive modality (Tier 1).
//      Mah 2011 (sleep → +sprint/skill), Milewski 2014 (<8h → 1.7× injury),
//      Lauersen 2014 (only STRENGTH cuts injuries — no passive modality does).
//   2. Passive modalities help SORENESS / PERCEIVED recovery, NOT objective
//      performance restoration and NOT injury incidence (Dupuy 2018, 99 studies).
//   3. CWI and NSAIDs BLUNT training adaptation (Roberts 2015 J Physiol; Trappe
//      2002). Context-switch: deploy on tournament/congested days to restore
//      performance fast; AVOID within ~6 h of adaptation-focused strength/power.
//   4. Static stretching is NOT recovery (no DOMS/performance benefit — Afonso
//      2021) and NOT injury prevention (Lauersen 2014). Surgical use only, for a
//      genuine ROM restriction (see daily-protocol-warmup / tightness triage).
//   5. The "lactate flush" rationale is debunked — lactate clears in ~30–60 min
//      regardless, and massage actually IMPAIRS muscle blood flow (Wiltshire 2010).

/** Evidence tiers, most→least authoritative. Mirrors the exercise library tiers. */
export const RECOVERY_EVIDENCE_TIERS = Object.freeze([
  "META",
  "RCT",
  "COHORT",
  "CONSENSUS",
  "HEURISTIC",
]);

// What a modality is actually FOR — so the UI never conflates soreness relief with
// performance restoration or injury prevention (they are different outcomes).
//   foundation  = sleep / nutrition / load — the real levers (Tier 1)
//   soreness    = reduces DOMS / perceived fatigue (most passive modalities)
//   perception  = perceived-readiness / belief tool (honest label; still useful)
//   performance = restores objective performance fast (essentially only CWI, and
//                 only at the cost of adaptation)
//   tissue      = tendon/ROM/mobility quality
export const RECOVERY_PURPOSES = Object.freeze([
  "foundation",
  "soreness",
  "perception",
  "performance",
  "tissue",
]);

/**
 * The catalogue. `contexts` = day types where this is prescribed; `avoidWhen` =
 * contexts where it is actively counter-productive (the adaptation-blunting
 * switch). `frequencyPerWeek` is guidance, not a hard cap. `injuryPrevention` is
 * ALWAYS null/false unless a real RCT exists (only strength/proprioception qualify
 * — and those are not "recovery modalities").
 */
export const RECOVERY_PROTOCOLS = Object.freeze({
  // ── TIER 1 — the levers that actually move performance AND injury ──────────
  sleep: {
    key: "sleep",
    name: "Sleep",
    category: "foundation",
    purpose: "foundation",
    tier: "COHORT",
    priority: 1,
    effect:
      "The single highest-leverage recovery tool. Extension improved sprint + skill accuracy (Mah 2011); <8 h/night raised injury risk 1.7× in athletes (Milewski 2014).",
    dose: { durationText: "8–10 h in bed nightly", frequencyPerWeek: 7 },
    timing: "Nightly; consistent schedule; strategic 20–30 min naps between games.",
    contexts: ["rest", "recovery", "travel", "tournament", "in_season", "adaptation"],
    avoidWhen: [],
    cautions: [],
    debunked: null,
    injuryPrevention: false,
    citations: ["Mah 2011 (Sleep)", "Milewski 2014 (J Pediatr Orthop)"],
  },
  nutrition_refuel: {
    key: "nutrition_refuel",
    name: "Refuel & Rehydrate",
    category: "foundation",
    purpose: "foundation",
    tier: "META",
    priority: 1,
    effect:
      "Glycogen + protein + fluid restoration outweighs every passive modality, especially on congested tournament days.",
    dose: {
      durationText:
        "1.0–1.2 g/kg/h high-GI carbohydrate for the first 4 h; ~0.3 g/kg protein; rehydrate ~150% of fluid deficit with sodium",
      frequencyPerWeek: 7,
    },
    timing: "Start within 30–60 min post-session; front-load the first 4 h.",
    contexts: ["recovery", "travel", "tournament", "in_season", "adaptation"],
    avoidWhen: [],
    cautions: [],
    debunked: null,
    injuryPrevention: false,
    citations: ["Thomas/ACSM 2016", "Burke 2017"],
  },
  active_recovery: {
    key: "active_recovery",
    name: "Active Recovery (low-intensity aerobic)",
    category: "active",
    purpose: "soreness",
    tier: "META",
    priority: 2,
    effect:
      "Small real DOMS benefit; clears lactate fastest (~80% of threshold). No adaptation downside. Good between tournament games.",
    dose: {
      durationText: "10–20 min @ ~60–80% of lactate threshold (easy jog/bike/swim)",
      frequencyPerWeek: 4,
    },
    timing: "Post- or between-session.",
    contexts: ["recovery", "mobility", "travel", "tournament", "in_season", "adaptation"],
    avoidWhen: [],
    cautions: [],
    debunked: null,
    injuryPrevention: false,
    citations: ["Dupuy 2018 (Front Physiol, 99 studies)"],
  },

  // ── TIER 2 — no adaptation downside, cheap, self-administered ───────────────
  foam_rolling: {
    key: "foam_rolling",
    name: "Foam Rolling / Self-Myofascial Release",
    category: "manual",
    purpose: "soreness",
    tier: "META",
    priority: 3,
    effect:
      "Among the more robust modality effects: reduces DOMS + improves ROM, and — unlike static stretching — does NOT impair subsequent strength/power (Wiewelhove 2019). Effect is neural, not fascial remodeling.",
    dose: {
      durationText: "30–120 s per muscle group",
      frequencyPerWeek: 7,
    },
    timing: "Pre-session (warm-up, no force cost) AND/OR post-session (recovery).",
    contexts: ["rest", "recovery", "mobility", "travel", "tournament", "in_season", "adaptation"],
    avoidWhen: [],
    cautions: ["Avoid rolling directly over an acute injury or bony prominence."],
    debunked: "Does not 'break up fascia/adhesions' — the effect is neural.",
    injuryPrevention: false,
    citations: ["Wiewelhove 2019 (Front Physiol)", "Pearcey 2015"],
  },
  compression_garment: {
    key: "compression_garment",
    name: "Compression Garments",
    category: "compression",
    purpose: "soreness",
    tier: "META",
    priority: 3,
    effect:
      "Moderate reduction in DOMS, power loss, and CK; cheap and passive — wear overnight (Hill 2014 BJSM). Perceptual/soreness benefit, not performance restoration.",
    dose: { durationText: "worn 24 h or overnight, 15–30 mmHg", frequencyPerWeek: 7 },
    timing: "Post-session / overnight; between games.",
    contexts: ["recovery", "travel", "tournament", "in_season"],
    avoidWhen: [],
    cautions: [],
    debunked: null,
    injuryPrevention: false,
    citations: ["Hill 2014 (BJSM, meta-analysis)"],
  },

  // ── TIER 3 — perceived-readiness tools (honest label), soreness/ROM only ────
  massage: {
    key: "massage",
    name: "Massage",
    category: "manual",
    purpose: "soreness",
    tier: "META",
    priority: 4,
    effect:
      "Best modality for DOMS + perceived fatigue in the 99-study meta (Dupuy 2018, g≈−2.3 DOMS), and improves flexibility ~7% — but NO effect on strength/sprint/jump recovery (Poppendieck 2016).",
    dose: { durationText: "20–30 min", frequencyPerWeek: 1 },
    timing: "0–2 h post-exercise for DOMS.",
    contexts: ["recovery", "tournament", "in_season"],
    avoidWhen: [],
    cautions: ["Avoid vigorous work over an acute strain/hematoma (may worsen bleeding)."],
    debunked:
      "Does NOT 'flush' lactate or improve blood flow — massage impairs post-exercise muscle blood flow (Wiltshire 2010).",
    injuryPrevention: false,
    citations: ["Dupuy 2018", "Poppendieck 2016 (Sports Med)", "Wiltshire 2010 (MSSE)"],
  },
  percussion_gun: {
    key: "percussion_gun",
    name: "Percussion / Massage Gun",
    category: "manual",
    purpose: "tissue",
    tier: "RCT",
    priority: 4,
    effect:
      "Acute ROM gain (+~18% ankle DF) with NO force decrement (Konrad 2020) — a warm-up ROM tool. Recovery/performance benefit is unproven; one study found a small INCREASE in perceived soreness.",
    dose: {
      durationText: "1–5 min per muscle group (ROM benefit from ~30–60 s)",
      frequencyPerWeek: 7,
    },
    timing: "Pre-session for ROM, or ad-hoc post-session.",
    contexts: ["recovery", "mobility", "tournament", "in_season", "adaptation"],
    avoidWhen: [],
    cautions: [
      "Never over bone, joints, nerves, an acute injury, hematoma, or suspected DVT.",
      "Bruising is tissue damage, not efficacy.",
    ],
    debunked: null,
    injuryPrevention: false,
    citations: ["Konrad 2020 (J Sports Sci Med)"],
  },
  pneumatic_compression: {
    key: "pneumatic_compression",
    name: "Pneumatic Compression Boots (NormaTec/RecoveryAir)",
    category: "compression",
    purpose: "perception",
    tier: "META",
    priority: 5,
    effect:
      "Reduces PERCEIVED soreness/fatigue but has negligible effect on performance recovery and no change in neuromuscular function (Maia 2024; Gu 2025). Predominantly perceptual.",
    dose: { durationText: "20–30 min @ ~80 mmHg", frequencyPerWeek: 4 },
    timing: "Evening / between games. Do not let it displace sleep.",
    contexts: ["recovery", "tournament", "in_season"],
    avoidWhen: [],
    cautions: [
      "Contraindicated with DVT, acute fracture, compartment syndrome, severe neuropathy, active infection/skin breakdown.",
      "Opportunity cost is the real harm — 30 min in boots is 30 min not sleeping.",
    ],
    debunked: "The 'lactate flush' rationale is obsolete — lactate is not a driver of DOMS.",
    injuryPrevention: false,
    citations: ["Maia 2024 (Biol Sport)", "Gu 2025 (PM&R)"],
  },
  contrast_therapy: {
    key: "contrast_therapy",
    name: "Contrast Therapy (hot/cold)",
    category: "thermal",
    purpose: "soreness",
    tier: "META",
    priority: 6,
    effect:
      "Better than passive rest for soreness/strength-loss but no better than other modalities (Bieuzen 2013, all high bias). The cold component carries the same adaptation caveat as CWI if overused post-lifting.",
    dose: { durationText: "6–24 min alternating", frequencyPerWeek: 2 },
    timing: "Post-game.",
    contexts: ["tournament", "recovery"],
    avoidWhen: ["adaptation"],
    cautions: [],
    debunked: null,
    injuryPrevention: false,
    citations: ["Bieuzen 2013 (PLoS ONE)"],
  },

  // ── CONTEXT-SWITCHED — real performance restoration, real adaptation cost ───
  cold_water_immersion: {
    key: "cold_water_immersion",
    name: "Cold Water Immersion / Cryotherapy",
    category: "thermal",
    purpose: "performance",
    tier: "RCT",
    priority: 5,
    effect:
      "Restores acute perceived recovery + reduces DOMS/CK, BUT blunts strength/hypertrophy adaptation (Roberts 2015 J Physiol) and a sham was as effective for strength recovery (Broatch 2014). Deploy to restore performance FAST when adaptation is irrelevant that week; ban it when adaptation is the goal.",
    dose: {
      durationText: "10–15 min @ 11–15°C (5–10°C for CK/neuromuscular)",
      frequencyPerWeek: 3,
    },
    timing: "Within ~1 h post-game.",
    // Only competition-dense contexts — NOT adaptation blocks.
    contexts: ["tournament"],
    avoidWhen: ["adaptation", "off_season"],
    cautions: [
      "AVOID within ~6 h of any adaptation-focused strength/power session — it throws away the adaptation stimulus.",
    ],
    debunked:
      "Much of the acute benefit is placebo — a sham matched CWI for strength recovery (Broatch 2014).",
    injuryPrevention: false,
    citations: ["Roberts 2015 (J Physiol)", "Broatch 2014 (MSSE)", "Fyfe 2019"],
  },
  sauna_heat: {
    key: "sauna_heat",
    name: "Sauna / Heat",
    category: "thermal",
    purpose: "perception",
    tier: "RCT",
    priority: 7,
    effect:
      "No definitive acute-recovery benefit; repeated post-exercise heat aids heat-acclimation, but traditional sauna may IMPAIR next-day maximal performance. Low priority for a power/speed profile.",
    dose: { durationText: "10–20 min", frequencyPerWeek: 2 },
    timing: "Not before max efforts; heat-acclimation blocks only.",
    contexts: ["off_season"],
    avoidWhen: ["tournament"],
    cautions: ["Avoid before performance — can impair next-day max output."],
    debunked: null,
    injuryPrevention: false,
    citations: ["Sports Med Open 2025 (systematic review)"],
  },

  // ── NOT RECOVERY — kept so the app can explain WHY it isn't prescribed ──────
  static_stretching: {
    key: "static_stretching",
    name: "Static Stretching",
    category: "mobility",
    purpose: "tissue",
    tier: "META",
    priority: 9,
    effect:
      "NOT a recovery tool: no effect on 24/48/72 h DOMS or strength recovery vs passive rest (Afonso 2021), and does not prevent injury (Lauersen 2014). Long holds pre-activity also transiently reduce strength/power.",
    dose: { durationText: "if used for a genuine ROM restriction: <30 s/muscle, then re-potentiate", frequencyPerWeek: 0 },
    timing: "Not as recovery. Only for a documented ROM restriction, as a separate session on non-damaged tissue.",
    contexts: [],
    avoidWhen: ["recovery", "rest"],
    cautions: [
      "Aggressive stretch on an acute strain / freshly damaged tissue is contraindicated (McHugh & Tyler 2019).",
    ],
    debunked:
      "Increases stretch TOLERANCE, not muscle length (Weppler & Magnusson 2010); flexibility gains are neural, not structural.",
    injuryPrevention: false,
    citations: ["Afonso 2021 (Front Physiol)", "Lauersen 2014 (BJSM)", "Weppler 2010"],
  },
});

/** Adaptation-blunting modalities — surfaced with an explicit warning near lifts. */
export const ADAPTATION_BLUNTING = Object.freeze([
  "cold_water_immersion",
  "contrast_therapy",
]);

/**
 * Resolve the recovery modalities to prescribe for a given context. Filters the
 * catalogue by day type and drops anything whose `avoidWhen` matches the context
 * (the adaptation switch: CWI/contrast never surface on adaptation/off-season
 * days). Returns modalities ordered by priority (Tier 1 first).
 *
 * @param {object} ctx
 * @param {string} ctx.dayType   e.g. "recovery" | "rest" | "mobility" | "travel" | "tournament"
 * @param {string} [ctx.phase]   "in_season" | "off_season" | "adaptation" — extra context gate
 * @param {boolean} [ctx.hadAdaptationSessionToday] within ~6 h of a strength/power session
 * @returns {Array<object>} prescribed modalities (with a resolved `warning` when relevant)
 */
export function resolveRecoveryProtocols({
  dayType,
  phase = null,
  hadAdaptationSessionToday = false,
} = {}) {
  const activeContexts = new Set([dayType, phase].filter(Boolean));
  if (hadAdaptationSessionToday) {
    activeContexts.add("adaptation");
  }

  const out = [];
  for (const m of Object.values(RECOVERY_PROTOCOLS)) {
    const inContext = m.contexts.some((c) => activeContexts.has(c));
    if (!inContext) {
      continue;
    }
    const blocked = m.avoidWhen.some((c) => activeContexts.has(c));
    if (blocked) {
      continue;
    }
    out.push({
      ...m,
      warning:
        ADAPTATION_BLUNTING.includes(m.key) && !hadAdaptationSessionToday
          ? "Only when adaptation is not the goal this week — keep it away from strength/power sessions."
          : null,
    });
  }
  return out.sort((a, b) => a.priority - b.priority);
}

/** One-line honest headline for the recovery day (never over-promises). */
export const RECOVERY_HEADLINE =
  "Recovery is sleep + fuel + easy movement first. The hands-on tools below ease soreness and how you feel — they don't restore performance or prevent injury (only strength + load management do).";
