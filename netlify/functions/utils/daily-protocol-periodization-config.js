// Evidence-based block + periodization configuration.
// Source: VALD Practitioner's Guides (Isometrics, Hamstrings, Preseason, etc.)
// + Gabbett 2016 for ACWR safe zones.

// Block type configuration for 1.5h structured training
const BLOCK_TYPES = {
  morning_mobility: { category: "mobility", estimatedMinutes: 10 },
  foam_roll: { category: "foam_roll", estimatedMinutes: 8 },
  warm_up: { category: "warm_up", estimatedMinutes: 25 },
  isometrics: { category: "isometric", estimatedMinutes: 15 },
  plyometrics: { category: "plyometric", estimatedMinutes: 15 },
  strength: { category: "strength", estimatedMinutes: 15 },
  conditioning: { category: "conditioning", estimatedMinutes: 15 },
  skill_drills: { category: "skill", estimatedMinutes: 15 },
  main_session: { category: "strength", estimatedMinutes: 45 }, // Legacy - kept for backwards compatibility
  cool_down: { category: "cool_down", estimatedMinutes: 15 },
  evening_recovery: { category: "recovery", estimatedMinutes: 10 },
  // Return-to-play blocks (daily-protocol-rtp.js). The DB CHECK constraint has
  // allowed these since 20260328, but the response transformer dropped their
  // rows — an injured athlete's rehab session rendered as an empty screen.
  rehab_progression: { category: "rehab", estimatedMinutes: 15 },
  evening_mobility: { category: "mobility", estimatedMinutes: 10 },
};

/**
 * Evidence-based training protocols from VALD research
 */
const EVIDENCE_BASED_PROTOCOLS = {
  // Isometric Training Protocol (Practitioner's Guide to Isometrics)
  // "3-5 sets of 3-6 second maximal contractions with 30-60 seconds rest"
  isometrics: {
    sets: { min: 3, max: 5 },
    holdSeconds: { min: 3, max: 6 },
    restSeconds: { min: 30, max: 60 },
    frequencyPerWeek: { min: 2, max: 3 },
    asymmetryWarning: 0.15, // >15% requires attention
  },

  // Nordic Curl Protocol (Practitioner's Guide to Hamstrings)
  // "2-3x weekly ~halves the hamstring-injury rate" (risk ratio 0.49, "up to
  //  51%") — van Dyk 2019 meta-analysis, 8459 athletes, BJSM,
  //  doi:10.1136/bjsports-2018-100045. (Was "50-70%" — overstated the pooled
  //  figure; corrected 2026-07-18.)
  // "Progress from 1x5 to 3x12 over 6-8 weeks"
  nordicCurls: {
    frequencyPerWeek: { min: 2, max: 3 },
    beginner: { sets: 1, reps: 5 },
    intermediate: { sets: 2, reps: 8 },
    advanced: { sets: 3, reps: 12 },
    injuryRiskReduction: 0.5, // ~51% (van Dyk 2019 meta-analysis; reference only, not consumed)
    eccentricHQRatioTarget: 0.8,
  },

  // Plyometric Contacts (Multiple guides)
  // Phase-appropriate weekly contacts
  plyometrics: {
    contactsPerWeek: {
      off_season_rest: { min: 0, max: 0 },
      foundation: { min: 40, max: 80 },
      strength_accumulation: { min: 60, max: 120 },
      power_development: { min: 80, max: 150 },
      speed_development: { min: 100, max: 180 },
      competition_prep: { min: 60, max: 100 },
      in_season_maintenance: { min: 40, max: 80 },
      mid_season_reload: { min: 60, max: 120 },
      peak: { min: 50, max: 100 },
      taper: { min: 20, max: 40 },
      active_recovery: { min: 0, max: 20 },
    },
    intensityLevels: {
      low: ["pogo_jumps", "ankle_hops", "box_step_ups", "low_hurdle_hops"],
      medium: [
        "box_jumps",
        "broad_jumps",
        "single_leg_bounds",
        "lateral_bounds",
      ],
      high: [
        "depth_jumps",
        "reactive_bounds",
        "hurdle_hops",
        "single_leg_depth_jumps",
      ],
      very_high: [
        "depth_jumps_to_sprint",
        "reactive_agility_bounds",
        "multi_directional_bounds",
      ],
    },
  },

  // ACWR advisory bands (Gabbett 2016 sweet-spot framing). NOTE: the specific
  // "injury risk 2-4x" multiplier was REMOVED from the app's canonical ACWR
  // module (utils/acwr.js ACWR_RISK_ZONES) as false precision — the only
  // cluster-RCT of ACWR-guided load management found no effect (Dalen-Lorentsen
  // 2021, BJSM, doi:10.1136/bjsports-2020-103003) and whether ACWR associates
  // with injury at all is method-dependent (Impellizzeri 2020). Treat these as
  // ADVISORY load-management bands, not risk facts. (These numbers are reference
  // only — not consumed; acwr.js owns the live zones. Comment corrected
  // 2026-07-18 to stop contradicting that walk-back.)
  acwr: {
    optimal: { min: 0.8, max: 1.3 },
    elevated: { min: 1.3, max: 1.5 },
    danger: { min: 1.5, max: 2.0 },
    weeklyLoadIncreaseMax: 0.1, // 10% max per week
  },

  // Hip/Groin Balance (Practitioner's Guide to Hip and Groin)
  hipGroin: {
    adductorAbductorRatioTarget: { min: 0.8, max: 1.2 },
  },

  // Calf/Achilles Return to Sport (Practitioner's Guide to Calf & Achilles)
  calfAchilles: {
    returnToSportStrengthThreshold: 0.9, // >90% bilateral symmetry
    progressionPhases: [
      "isometric",
      "heavy_slow_resistance",
      "eccentric",
      "plyometric",
      "return_to_sport",
    ],
  },
};

// Day names for schedule matching (index 0 = Sunday, matching Date.getDay()).
const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export { BLOCK_TYPES, EVIDENCE_BASED_PROTOCOLS, DAY_NAMES };
