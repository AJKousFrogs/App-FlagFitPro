/**
 * Flag Football Periodization Service
 *
 * EVIDENCE-BASED ANNUAL PERIODIZATION FOR FLAG FOOTBALL ATHLETES
 *
 * Flag Football Athletic Profile (The Hybrid Athlete):
 * - Durability like soccer players (60+ games/year)
 * - Strength like basketball players (explosive power)
 * - Lean and jumpy like volleyball players (vertical leap)
 * - Fast like sprinters (acceleration & top speed)
 * - Elite change of direction (agility & deceleration)
 * - Sudden stops (eccentric strength & injury prevention)
 *
 * NOT: Bulky muscle mass - we need lean, functional, explosive athletes
 *
 * Research Base:
 * - Bompa & Haff (2009) - Periodization: Theory and Methodology of Training
 * - Issurin (2010) - Block Periodization
 * - Gabbett (2016) - Training-Injury Prevention Paradox
 * - Haugen et al. (2019) - Sprint Training for Team Sport Athletes
 * - Asadi et al. (2017) - Plyometric Training for Change of Direction
 * - Suchomel et al. (2016) - Importance of Muscular Strength
 * - Mujika & Padilla (2003) - Scientific Bases for Precompetition Tapering
 * - Turner & Stewart (2014) - Strength and Conditioning for Soccer
 * - Comfort et al. (2014) - Change of Direction Speed
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

import { Injectable, inject, signal, computed } from "@angular/core";
import { SupabaseService } from "./supabase.service";
import { LoggerService } from "./logger.service";

// ============================================================================
// INTERFACES
// ============================================================================

export type TrainingPhaseType =
  | "off_season_rest"
  | "foundation"
  | "strength_accumulation"
  | "power_development"
  | "speed_development"
  | "competition_prep"
  | "in_season_maintenance"
  | "mid_season_reload"
  | "peak"
  | "taper"
  | "active_recovery";

export type TrainingFocus =
  | "aerobic_base"
  | "strength_endurance"
  | "maximal_strength"
  | "power"
  | "speed"
  | "agility"
  | "plyometrics"
  | "deceleration"
  | "injury_prevention"
  | "mobility"
  | "recovery"
  | "core";

export type ExerciseCategory =
  | "sprint"
  | "acceleration"
  | "change_of_direction"
  | "plyometric"
  | "strength"
  | "power"
  | "core"
  | "mobility"
  | "conditioning"
  | "sport_specific";

export interface PhaseConfig {
  name: string;
  type: TrainingPhaseType;
  durationWeeks: number;
  description: string;
  primaryFocus: TrainingFocus[];
  secondaryFocus: TrainingFocus[];
  volumeMultiplier: number; // 0.5-1.2
  intensityMultiplier: number; // 0.6-1.0
  sprintVolume: SprintVolumeConfig;
  strengthConfig: StrengthConfig;
  plyometricConfig: PlyometricConfig;
  agilityConfig: AgilityConfig;
  recoveryPriority: "low" | "medium" | "high";
  injuryPreventionFocus: string[];
  evidenceBase: EvidenceReference[];
}

export interface SprintVolumeConfig {
  maxSprintsPerSession: number;
  maxSprintsPerWeek: number;
  sprintDistances: number[]; // meters
  restRatios: string; // e.g., "1:12-20" (work:rest)
  accelerationWork: boolean;
  maxVelocityWork: boolean;
  flyingSprintsAllowed: boolean;
}

export interface StrengthConfig {
  setsPerExercise: [number, number]; // [min, max]
  repsPerSet: [number, number];
  intensityRange: [number, number]; // % of 1RM
  restPeriodSeconds: [number, number];
  exerciseTypes: string[];
  avoidBulking: boolean; // Flag football specific
  focusOnPower: boolean;
}

export interface PlyometricConfig {
  maxContactsPerSession: number;
  maxContactsPerWeek: number;
  intensityLevel: "low" | "medium" | "high" | "very_high";
  allowedExercises: string[];
  landingEmphasis: boolean; // Critical for flag football
  decelerationWork: boolean;
}

export interface AgilityConfig {
  maxCutsPerSession: number;
  maxCutsPerWeek: number;
  coneDistance: number; // meters
  restBetweenReps: number; // seconds
  reactiveDrills: boolean;
  plannedVsUnplanned: "planned" | "unplanned" | "mixed";
}

export interface EvidenceReference {
  authors: string;
  year: number;
  title: string;
  journal?: string;
  keyFinding: string;
  applicationToFlagFootball: string;
}

export interface WeeklyTrainingTemplate {
  weekNumber: number;
  phase: TrainingPhaseType;
  days: DailyTrainingTemplate[];
  weeklyTotals: WeeklyTotals;
  recommendations: string[];
  warnings: string[];
}

export interface DailyTrainingTemplate {
  dayOfWeek: number; // 0=Sunday, 1=Monday, etc.
  dayName: string;
  sessionType: "training" | "game" | "recovery" | "rest";
  primaryFocus: TrainingFocus;
  secondaryFocus?: TrainingFocus;
  exercises: ExerciseTemplate[];
  estimatedDuration: number; // minutes
  targetRPE: number;
  notes: string;
}

export interface ExerciseTemplate {
  name: string;
  category: ExerciseCategory;
  sets: number;
  reps: number | string; // number or "30s" for timed
  intensity?: number; // % of max or RPE
  rest: number; // seconds
  notes?: string;
  videoUrl?: string;
  evidenceBase?: string;
}

export interface WeeklyTotals {
  totalSprints: number;
  totalCuts: number;
  totalPlyoContacts: number;
  totalStrengthSets: number;
  estimatedLoad: number; // AU
  trainingDays: number;
  restDays: number;
}

export interface SeasonalRecommendation {
  currentPhase: PhaseConfig;
  currentWeek: number;
  weeklyTemplate: WeeklyTrainingTemplate;
  nextPhasePreview: PhaseConfig | null;
  personalizedAdjustments: string[];
  injuryPreventionProtocol: string[];
  nutritionGuidelines: string[];
}

// ============================================================================
// EVIDENCE-BASED RESEARCH REFERENCES
// ============================================================================

const EVIDENCE_BASE: Record<string, EvidenceReference> = {
  gabbett_2016: {
    authors: "Gabbett, T.J.",
    year: 2016,
    title:
      "The training—injury prevention paradox: should athletes be training smarter and harder?",
    journal: "British Journal of Sports Medicine",
    keyFinding: "ACWR 0.8-1.3 is optimal; >1.5 increases injury risk 2-4x",
    applicationToFlagFootball:
      "Monitor weekly load changes, never increase >10% per week",
  },
  haugen_2019: {
    authors: "Haugen, T., et al.",
    year: 2019,
    title: "Sprint interval training for elite team-sport athletes",
    journal: "International Journal of Sports Physiology and Performance",
    keyFinding:
      "Short sprints (10-30m) with full recovery optimize acceleration",
    applicationToFlagFootball:
      "Focus on 10-20m sprints with 1:12-20 work:rest ratio",
  },
  asadi_2017: {
    authors: "Asadi, A., et al.",
    year: 2017,
    title: "Effects of plyometric training on change-of-direction ability",
    journal: "Sports Medicine",
    keyFinding: "8-12 weeks of plyometrics improve COD by 4-8%",
    applicationToFlagFootball:
      "Include lateral bounds, single-leg hops, depth jumps",
  },
  suchomel_2016: {
    authors: "Suchomel, T.J., et al.",
    year: 2016,
    title: "The importance of muscular strength in athletic performance",
    journal: "Sports Medicine",
    keyFinding:
      "Relative strength (strength/bodyweight) correlates with sprint and COD",
    applicationToFlagFootball:
      "Prioritize relative strength over absolute mass",
  },
  comfort_2014: {
    authors: "Comfort, P., et al.",
    year: 2014,
    title: "Relationships between strength, sprint, and jump performance",
    journal: "Journal of Strength and Conditioning Research",
    keyFinding:
      "Eccentric strength critical for deceleration and injury prevention",
    applicationToFlagFootball:
      "Include Nordic curls, eccentric squats, landing drills",
  },
  mujika_2003: {
    authors: "Mujika, I., Padilla, S.",
    year: 2003,
    title: "Scientific bases for precompetition tapering strategies",
    journal: "Medicine & Science in Sports & Exercise",
    keyFinding: "Reduce volume 40-60%, maintain intensity during taper",
    applicationToFlagFootball: "2-week taper before major tournaments",
  },
  turner_2014: {
    authors: "Turner, A., Stewart, P.",
    year: 2014,
    title: "Strength and conditioning for soccer players",
    journal: "Strength & Conditioning Journal",
    keyFinding: "In-season maintenance: 2x/week strength preserves adaptations",
    applicationToFlagFootball: "Minimum 2x/week strength during 60-game season",
  },
  bompa_2009: {
    authors: "Bompa, T., Haff, G.",
    year: 2009,
    title: "Periodization: Theory and Methodology of Training",
    journal: "Human Kinetics (Book)",
    keyFinding:
      "Block periodization allows concentrated loading of specific qualities",
    applicationToFlagFootball:
      "Use accumulation-transmutation-realization blocks",
  },
  issurin_2010: {
    authors: "Issurin, V.B.",
    year: 2010,
    title:
      "New horizons for the methodology and physiology of training periodization",
    journal: "Sports Medicine",
    keyFinding: "Residual training effects: strength 30±5 days, speed 5±3 days",
    applicationToFlagFootball:
      "Build strength base first, speed work closer to competition",
  },
  brughelli_2008: {
    authors: "Brughelli, M., et al.",
    year: 2008,
    title: "Understanding change of direction ability in sport",
    journal: "Sports Medicine",
    keyFinding:
      "COD requires eccentric strength, reactive strength, and technique",
    applicationToFlagFootball: "Train all three components for elite agility",
  },
};

// ============================================================================
// ANNUAL PERIODIZATION PHASES FOR FLAG FOOTBALL
// ============================================================================

/**
 * Evidence-based annual periodization for flag football
 * Designed for 60+ games per year at elite level
 *
 * Key Principles:
 * 1. Build durability base in off-season
 * 2. Develop power without bulk
 * 3. Maintain strength during competition
 * 4. Strategic mid-season reload (July)
 * 5. Peak for major tournaments
 */
const ANNUAL_PHASES: Record<string, PhaseConfig> = {
  // NOVEMBER: Active Recovery / Off-Season Rest
  // ========================================
  november_recovery: {
    name: "Active Recovery",
    type: "off_season_rest",
    durationWeeks: 4,
    description:
      "Mental and physical recovery after season. Address minor injuries. Maintain movement quality without structured training.",
    primaryFocus: ["recovery", "mobility", "injury_prevention"],
    secondaryFocus: ["aerobic_base"],
    volumeMultiplier: 0.3,
    intensityMultiplier: 0.4,
    sprintVolume: {
      maxSprintsPerSession: 0,
      maxSprintsPerWeek: 0,
      sprintDistances: [],
      restRatios: "N/A",
      accelerationWork: false,
      maxVelocityWork: false,
      flyingSprintsAllowed: false,
    },
    strengthConfig: {
      setsPerExercise: [2, 3],
      repsPerSet: [10, 15],
      intensityRange: [40, 60],
      restPeriodSeconds: [60, 90],
      exerciseTypes: ["bodyweight", "mobility", "corrective"],
      avoidBulking: true,
      focusOnPower: false,
    },
    plyometricConfig: {
      maxContactsPerSession: 0,
      maxContactsPerWeek: 0,
      intensityLevel: "low",
      allowedExercises: [],
      landingEmphasis: false,
      decelerationWork: false,
    },
    agilityConfig: {
      maxCutsPerSession: 0,
      maxCutsPerWeek: 0,
      coneDistance: 0,
      restBetweenReps: 0,
      reactiveDrills: false,
      plannedVsUnplanned: "planned",
    },
    recoveryPriority: "high",
    injuryPreventionFocus: [
      "Address any lingering injuries from season",
      "Soft tissue work and massage",
      "Sleep optimization (8-9 hours)",
      "Stress reduction",
    ],
    evidenceBase: [EVIDENCE_BASE["bompa_2009"]],
  },

  // DECEMBER: Foundation / General Preparation
  // ========================================
  december_foundation: {
    name: "Foundation Building",
    type: "foundation",
    durationWeeks: 4,
    description:
      "Build aerobic base and movement quality. Establish strength foundation without adding bulk. Focus on eccentric strength for injury prevention.",
    primaryFocus: ["aerobic_base", "strength_endurance", "mobility"],
    secondaryFocus: ["injury_prevention", "core"],
    volumeMultiplier: 0.6,
    intensityMultiplier: 0.6,
    sprintVolume: {
      maxSprintsPerSession: 6,
      maxSprintsPerWeek: 15,
      sprintDistances: [10, 20],
      restRatios: "1:20",
      accelerationWork: true,
      maxVelocityWork: false,
      flyingSprintsAllowed: false,
    },
    strengthConfig: {
      setsPerExercise: [3, 4],
      repsPerSet: [8, 12],
      intensityRange: [60, 75],
      restPeriodSeconds: [90, 120],
      exerciseTypes: [
        "squat variations",
        "hip hinge",
        "single-leg work",
        "push/pull",
        "core anti-rotation",
        "nordic curls", // Eccentric hamstring - Comfort 2014
      ],
      avoidBulking: true,
      focusOnPower: false,
    },
    plyometricConfig: {
      maxContactsPerSession: 40,
      maxContactsPerWeek: 80,
      intensityLevel: "low",
      allowedExercises: [
        "pogo jumps",
        "ankle hops",
        "box step-ups",
        "low hurdle hops",
      ],
      landingEmphasis: true,
      decelerationWork: true,
    },
    agilityConfig: {
      maxCutsPerSession: 20,
      maxCutsPerWeek: 50,
      coneDistance: 5,
      restBetweenReps: 60,
      reactiveDrills: false,
      plannedVsUnplanned: "planned",
    },
    recoveryPriority: "medium",
    injuryPreventionFocus: [
      "Eccentric hamstring work (Nordic curls) - 2x/week",
      "Landing mechanics drills",
      "Hip mobility and stability",
      "Ankle mobility work",
    ],
    evidenceBase: [
      EVIDENCE_BASE["bompa_2009"],
      EVIDENCE_BASE["comfort_2014"],
      EVIDENCE_BASE["suchomel_2016"],
    ],
  },

  // JANUARY: Strength Accumulation
  // ========================================
  january_strength: {
    name: "Strength Accumulation",
    type: "strength_accumulation",
    durationWeeks: 4,
    description:
      "Build relative strength (strength/bodyweight ratio). Critical for sprint and COD performance. Avoid hypertrophy-focused training.",
    primaryFocus: ["maximal_strength", "strength_endurance"],
    secondaryFocus: ["power", "core"],
    volumeMultiplier: 0.8,
    intensityMultiplier: 0.8,
    sprintVolume: {
      maxSprintsPerSession: 8,
      maxSprintsPerWeek: 20,
      sprintDistances: [10, 20, 30],
      restRatios: "1:15",
      accelerationWork: true,
      maxVelocityWork: false,
      flyingSprintsAllowed: false,
    },
    strengthConfig: {
      setsPerExercise: [4, 5],
      repsPerSet: [3, 6], // Lower reps = strength without bulk
      intensityRange: [80, 90],
      restPeriodSeconds: [180, 300], // Full recovery for quality
      exerciseTypes: [
        "back squat",
        "trap bar deadlift",
        "Romanian deadlift",
        "split squat",
        "bench press",
        "weighted pull-ups",
        "hip thrust",
      ],
      avoidBulking: true,
      focusOnPower: false,
    },
    plyometricConfig: {
      maxContactsPerSession: 60,
      maxContactsPerWeek: 120,
      intensityLevel: "medium",
      allowedExercises: [
        "box jumps",
        "broad jumps",
        "single-leg bounds",
        "lateral bounds",
        "depth drops (low height)",
      ],
      landingEmphasis: true,
      decelerationWork: true,
    },
    agilityConfig: {
      maxCutsPerSession: 30,
      maxCutsPerWeek: 80,
      coneDistance: 5,
      restBetweenReps: 45,
      reactiveDrills: false,
      plannedVsUnplanned: "planned",
    },
    recoveryPriority: "medium",
    injuryPreventionFocus: [
      "Continue Nordic curls 2x/week",
      "Groin strengthening (Copenhagen adductors)",
      "Single-leg stability work",
      "Thoracic spine mobility",
    ],
    evidenceBase: [
      EVIDENCE_BASE["suchomel_2016"],
      EVIDENCE_BASE["comfort_2014"],
      EVIDENCE_BASE["issurin_2010"],
    ],
  },

  // FEBRUARY: Power Development
  // ========================================
  february_power: {
    name: "Power Development",
    type: "power_development",
    durationWeeks: 4,
    description:
      "Convert strength to power. Olympic lift variations, explosive movements. Introduce reactive agility. Build rate of force development.",
    primaryFocus: ["power", "speed"],
    secondaryFocus: ["agility", "plyometrics"],
    volumeMultiplier: 0.9,
    intensityMultiplier: 0.85,
    sprintVolume: {
      maxSprintsPerSession: 12,
      maxSprintsPerWeek: 30,
      sprintDistances: [10, 20, 30, 40],
      restRatios: "1:12",
      accelerationWork: true,
      maxVelocityWork: true,
      flyingSprintsAllowed: true,
    },
    strengthConfig: {
      setsPerExercise: [3, 5],
      repsPerSet: [2, 5],
      intensityRange: [70, 85], // Lighter for speed of movement
      restPeriodSeconds: [180, 300],
      exerciseTypes: [
        "power clean",
        "hang snatch",
        "jump squat",
        "trap bar jump",
        "medicine ball throws",
        "explosive push-ups",
      ],
      avoidBulking: true,
      focusOnPower: true,
    },
    plyometricConfig: {
      maxContactsPerSession: 80,
      maxContactsPerWeek: 150,
      intensityLevel: "high",
      allowedExercises: [
        "depth jumps",
        "reactive bounds",
        "hurdle hops",
        "single-leg depth jumps",
        "lateral reactive bounds",
      ],
      landingEmphasis: true,
      decelerationWork: true,
    },
    agilityConfig: {
      maxCutsPerSession: 40,
      maxCutsPerWeek: 100,
      coneDistance: 5,
      restBetweenReps: 30,
      reactiveDrills: true, // Introduce reactive
      plannedVsUnplanned: "mixed",
    },
    recoveryPriority: "medium",
    injuryPreventionFocus: [
      "Deceleration drills - critical for flag football",
      "Eccentric loading for hamstrings and quads",
      "Ankle stability progressions",
      "Hip flexor mobility (for sprint mechanics)",
    ],
    evidenceBase: [
      EVIDENCE_BASE["asadi_2017"],
      EVIDENCE_BASE["haugen_2019"],
      EVIDENCE_BASE["brughelli_2008"],
    ],
  },

  // MARCH: Speed & Explosive Phase
  // ========================================
  march_explosive: {
    name: "Speed & Explosive",
    type: "speed_development",
    durationWeeks: 4,
    description:
      "Peak speed development. Maximum velocity work. Sport-specific agility. Final preparation before competition season.",
    primaryFocus: ["speed", "agility"],
    secondaryFocus: ["power", "plyometrics"],
    volumeMultiplier: 1.0,
    intensityMultiplier: 0.95,
    sprintVolume: {
      maxSprintsPerSession: 15,
      maxSprintsPerWeek: 40,
      sprintDistances: [10, 20, 30, 40, 50],
      restRatios: "1:15",
      accelerationWork: true,
      maxVelocityWork: true,
      flyingSprintsAllowed: true,
    },
    strengthConfig: {
      setsPerExercise: [3, 4],
      repsPerSet: [2, 4],
      intensityRange: [75, 90],
      restPeriodSeconds: [180, 300],
      exerciseTypes: [
        "speed squats",
        "power cleans",
        "reactive strength work",
        "contrast training",
      ],
      avoidBulking: true,
      focusOnPower: true,
    },
    plyometricConfig: {
      maxContactsPerSession: 100,
      maxContactsPerWeek: 180,
      intensityLevel: "very_high",
      allowedExercises: [
        "depth jumps to sprint",
        "reactive agility bounds",
        "single-leg reactive hops",
        "multi-directional bounds",
      ],
      landingEmphasis: true,
      decelerationWork: true,
    },
    agilityConfig: {
      maxCutsPerSession: 50,
      maxCutsPerWeek: 120,
      coneDistance: 5,
      restBetweenReps: 30,
      reactiveDrills: true,
      plannedVsUnplanned: "unplanned", // Game-like
    },
    recoveryPriority: "high",
    injuryPreventionFocus: [
      "Maintain eccentric hamstring work",
      "Monitor for signs of overreaching",
      "Sleep 8+ hours",
      "Hydration and nutrition optimization",
    ],
    evidenceBase: [
      EVIDENCE_BASE["haugen_2019"],
      EVIDENCE_BASE["asadi_2017"],
      EVIDENCE_BASE["gabbett_2016"],
    ],
  },

  // ========================================
  // APRIL-JUNE: Competition Season / In-Season Maintenance
  // ========================================
  competition_maintenance: {
    name: "In-Season Maintenance",
    type: "in_season_maintenance",
    durationWeeks: 12,
    description:
      "Maintain fitness during competition. 2x/week strength minimum. Manage fatigue. Focus on recovery between games.",
    primaryFocus: ["injury_prevention", "recovery"],
    secondaryFocus: ["power", "speed"],
    volumeMultiplier: 0.6,
    intensityMultiplier: 0.85,
    sprintVolume: {
      maxSprintsPerSession: 8,
      maxSprintsPerWeek: 20,
      sprintDistances: [10, 20],
      restRatios: "1:20",
      accelerationWork: true,
      maxVelocityWork: false,
      flyingSprintsAllowed: false,
    },
    strengthConfig: {
      setsPerExercise: [2, 3],
      repsPerSet: [3, 5],
      intensityRange: [75, 85],
      restPeriodSeconds: [180, 240],
      exerciseTypes: [
        "trap bar deadlift",
        "split squat",
        "hip thrust",
        "pull-ups",
        "core work",
      ],
      avoidBulking: true,
      focusOnPower: true,
    },
    plyometricConfig: {
      maxContactsPerSession: 40,
      maxContactsPerWeek: 80,
      intensityLevel: "medium",
      allowedExercises: ["box jumps", "bounds", "reactive hops"],
      landingEmphasis: true,
      decelerationWork: false, // Games provide this
    },
    agilityConfig: {
      maxCutsPerSession: 20,
      maxCutsPerWeek: 50,
      coneDistance: 5,
      restBetweenReps: 45,
      reactiveDrills: true,
      plannedVsUnplanned: "mixed",
    },
    recoveryPriority: "high",
    injuryPreventionFocus: [
      "Maintain Nordic curls 1-2x/week",
      "Active recovery protocols",
      "Sleep and nutrition priority",
      "Monitor ACWR weekly",
    ],
    evidenceBase: [
      EVIDENCE_BASE["turner_2014"],
      EVIDENCE_BASE["gabbett_2016"],
      EVIDENCE_BASE["mujika_2003"],
    ],
  },

  // JULY: Mid-Season Reload / Extra Base Building
  // ========================================
  july_reload: {
    name: "Mid-Season Reload",
    type: "mid_season_reload",
    durationWeeks: 4,
    description:
      "Strategic mid-season base building. Extra sprint work to build 'reserve'. Address minor injuries. Rebuild durability for second half of season.",
    primaryFocus: ["speed", "strength_endurance", "injury_prevention"],
    secondaryFocus: ["power", "aerobic_base"],
    volumeMultiplier: 0.8,
    intensityMultiplier: 0.75,
    sprintVolume: {
      maxSprintsPerSession: 15, // INCREASED for base building
      maxSprintsPerWeek: 40,
      sprintDistances: [10, 20, 30, 40],
      restRatios: "1:15",
      accelerationWork: true,
      maxVelocityWork: true,
      flyingSprintsAllowed: true,
    },
    strengthConfig: {
      setsPerExercise: [3, 4],
      repsPerSet: [6, 10], // Higher reps for endurance
      intensityRange: [65, 80],
      restPeriodSeconds: [90, 150],
      exerciseTypes: [
        "squat variations",
        "single-leg work",
        "hip hinge",
        "upper body maintenance",
        "core endurance",
      ],
      avoidBulking: true,
      focusOnPower: false, // Endurance focus
    },
    plyometricConfig: {
      maxContactsPerSession: 60,
      maxContactsPerWeek: 120,
      intensityLevel: "medium",
      allowedExercises: [
        "box jumps",
        "bounds",
        "lateral hops",
        "single-leg work",
      ],
      landingEmphasis: true,
      decelerationWork: true,
    },
    agilityConfig: {
      maxCutsPerSession: 40,
      maxCutsPerWeek: 100,
      coneDistance: 5,
      restBetweenReps: 30,
      reactiveDrills: true,
      plannedVsUnplanned: "mixed",
    },
    recoveryPriority: "high",
    injuryPreventionFocus: [
      "Address any accumulated minor injuries",
      "Soft tissue work focus",
      "Rebuild eccentric strength",
      "Mental recovery and reset",
      "This is your 'extra layer' of durability",
    ],
    evidenceBase: [
      EVIDENCE_BASE["issurin_2010"],
      EVIDENCE_BASE["gabbett_2016"],
      EVIDENCE_BASE["haugen_2019"],
    ],
  },

  // AUGUST: World Championship Prep / Peak Phase
  // ========================================
  august_peak: {
    name: "Championship Peak",
    type: "peak",
    durationWeeks: 4,
    description:
      "Peak for major tournaments. Reduce volume, maintain intensity. Sharpen speed and agility. Taper final 2 weeks.",
    primaryFocus: ["speed", "power"],
    secondaryFocus: ["agility", "recovery"],
    volumeMultiplier: 0.7,
    intensityMultiplier: 0.95,
    sprintVolume: {
      maxSprintsPerSession: 10,
      maxSprintsPerWeek: 25,
      sprintDistances: [10, 20, 30],
      restRatios: "1:20",
      accelerationWork: true,
      maxVelocityWork: true,
      flyingSprintsAllowed: true,
    },
    strengthConfig: {
      setsPerExercise: [2, 3],
      repsPerSet: [2, 4],
      intensityRange: [80, 90],
      restPeriodSeconds: [240, 360],
      exerciseTypes: [
        "power cleans",
        "jump squats",
        "explosive movements only",
      ],
      avoidBulking: true,
      focusOnPower: true,
    },
    plyometricConfig: {
      maxContactsPerSession: 50,
      maxContactsPerWeek: 100,
      intensityLevel: "high",
      allowedExercises: [
        "depth jumps",
        "reactive bounds",
        "sport-specific jumps",
      ],
      landingEmphasis: false,
      decelerationWork: false,
    },
    agilityConfig: {
      maxCutsPerSession: 30,
      maxCutsPerWeek: 70,
      coneDistance: 5,
      restBetweenReps: 45,
      reactiveDrills: true,
      plannedVsUnplanned: "unplanned",
    },
    recoveryPriority: "high",
    injuryPreventionFocus: [
      "Taper volume 40-60% in final 2 weeks",
      "Maintain intensity",
      "Sleep 9+ hours",
      "Nutrition optimization",
      "Mental preparation",
    ],
    evidenceBase: [
      EVIDENCE_BASE["mujika_2003"],
      EVIDENCE_BASE["issurin_2010"],
      EVIDENCE_BASE["haugen_2019"],
    ],
  },

  // ========================================
  // SEPTEMBER-OCTOBER: Late Season Competition
  // ========================================
  late_season: {
    name: "Late Season Competition",
    type: "in_season_maintenance",
    durationWeeks: 8,
    description:
      "Final competition phase. Maintain fitness. Manage accumulated fatigue. Prepare for off-season.",
    primaryFocus: ["injury_prevention", "recovery"],
    secondaryFocus: ["power", "speed"],
    volumeMultiplier: 0.5,
    intensityMultiplier: 0.8,
    sprintVolume: {
      maxSprintsPerSession: 6,
      maxSprintsPerWeek: 15,
      sprintDistances: [10, 20],
      restRatios: "1:20",
      accelerationWork: true,
      maxVelocityWork: false,
      flyingSprintsAllowed: false,
    },
    strengthConfig: {
      setsPerExercise: [2, 3],
      repsPerSet: [4, 6],
      intensityRange: [70, 80],
      restPeriodSeconds: [180, 240],
      exerciseTypes: ["maintenance lifts", "injury prevention", "core work"],
      avoidBulking: true,
      focusOnPower: true,
    },
    plyometricConfig: {
      maxContactsPerSession: 30,
      maxContactsPerWeek: 60,
      intensityLevel: "low",
      allowedExercises: ["box jumps", "basic bounds"],
      landingEmphasis: true,
      decelerationWork: false,
    },
    agilityConfig: {
      maxCutsPerSession: 15,
      maxCutsPerWeek: 40,
      coneDistance: 5,
      restBetweenReps: 60,
      reactiveDrills: false,
      plannedVsUnplanned: "planned",
    },
    recoveryPriority: "high",
    injuryPreventionFocus: [
      "Minimize injury risk",
      "Recovery priority",
      "Prepare body for off-season rest",
      "Address any issues before they worsen",
    ],
    evidenceBase: [EVIDENCE_BASE["turner_2014"], EVIDENCE_BASE["gabbett_2016"]],
  },
};

// ============================================================================
// SERVICE
// ============================================================================

@Injectable({
  providedIn: "root",
})
export class FlagFootballPeriodizationService {
  private supabaseService = inject(SupabaseService);
  private logger = inject(LoggerService);

  // Current phase
  private readonly _currentPhase = signal<PhaseConfig | null>(null);
  private readonly _currentWeek = signal<number>(1);
  private readonly _weeklyTemplate = signal<WeeklyTrainingTemplate | null>(
    null,
  );

  // Public signals
  readonly currentPhase = this._currentPhase.asReadonly();
  readonly currentWeek = this._currentWeek.asReadonly();
  readonly weeklyTemplate = this._weeklyTemplate.asReadonly();

  // Computed
  readonly phaseName = computed(() => this._currentPhase()?.name || "Unknown");
  readonly phaseType = computed(
    () => this._currentPhase()?.type || "foundation",
  );

  /**
   * Get phase configuration for a given date
   */
  getPhaseForDate(date: Date = new Date()): PhaseConfig {
    const month = date.getMonth() + 1; // 1-12

    switch (month) {
      case 11: // November
        return ANNUAL_PHASES["november_recovery"];
      case 12: // December
        return ANNUAL_PHASES["december_foundation"];
      case 1: // January
        return ANNUAL_PHASES["january_strength"];
      case 2: // February
        return ANNUAL_PHASES["february_power"];
      case 3: // March
        return ANNUAL_PHASES["march_explosive"];
      case 4: // April
      case 5: // May
      case 6: // June
        return ANNUAL_PHASES["competition_maintenance"];
      case 7: // July - MID-SEASON RELOAD
        return ANNUAL_PHASES["july_reload"];
      case 8: // August
        return ANNUAL_PHASES["august_peak"];
      case 9: // September
      case 10: // October
        return ANNUAL_PHASES["late_season"];
      default:
        return ANNUAL_PHASES["december_foundation"];
    }
  }

  /**
   * Get current week number within the phase
   */
  getWeekInPhase(date: Date = new Date()): number {
    const dayOfMonth = date.getDate();
    return Math.ceil(dayOfMonth / 7);
  }

  /**
   * Get seasonal recommendation for an athlete
   */
  getSeasonalRecommendation(date: Date = new Date()): SeasonalRecommendation {
    const phase = this.getPhaseForDate(date);
    const weekNum = this.getWeekInPhase(date);

    this._currentPhase.set(phase);
    this._currentWeek.set(weekNum);

    // Get next phase preview
    const nextMonth = new Date(date);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextPhase = this.getPhaseForDate(nextMonth);

    // Generate weekly template
    const weeklyTemplate = this.generateWeeklyTemplate(phase, weekNum);
    this._weeklyTemplate.set(weeklyTemplate);

    return {
      currentPhase: phase,
      currentWeek: weekNum,
      weeklyTemplate,
      nextPhasePreview: nextPhase.type !== phase.type ? nextPhase : null,
      personalizedAdjustments: this.getPersonalizedAdjustments(phase),
      injuryPreventionProtocol: phase.injuryPreventionFocus,
      nutritionGuidelines: this.getNutritionGuidelines(phase),
    };
  }

  /**
   * Generate weekly training template
   */
  private generateWeeklyTemplate(
    phase: PhaseConfig,
    weekNum: number,
  ): WeeklyTrainingTemplate {
    const days: DailyTrainingTemplate[] = [];

    // Monday - Primary Training Day
    days.push({
      dayOfWeek: 1,
      dayName: "Monday",
      sessionType: "training",
      primaryFocus: phase.primaryFocus[0],
      secondaryFocus: phase.secondaryFocus[0],
      exercises: this.generateExercisesForFocus(phase, phase.primaryFocus[0]),
      estimatedDuration: 75,
      targetRPE: 7,
      notes: `Week ${weekNum} - ${phase.name}`,
    });

    // Tuesday - Speed/Agility
    days.push({
      dayOfWeek: 2,
      dayName: "Tuesday",
      sessionType: "training",
      primaryFocus: "speed",
      secondaryFocus: "agility",
      exercises: this.generateSpeedSession(phase),
      estimatedDuration: 60,
      targetRPE: 8,
      notes: "Speed and agility focus",
    });

    // Wednesday - Recovery or Light
    days.push({
      dayOfWeek: 3,
      dayName: "Wednesday",
      sessionType: phase.recoveryPriority === "high" ? "recovery" : "training",
      primaryFocus: "recovery",
      secondaryFocus: "mobility",
      exercises: this.generateRecoverySession(),
      estimatedDuration: 30,
      targetRPE: 4,
      notes: "Active recovery and mobility",
    });

    // Thursday - Strength/Power
    days.push({
      dayOfWeek: 4,
      dayName: "Thursday",
      sessionType: "training",
      primaryFocus: phase.primaryFocus.includes("power")
        ? "power"
        : "maximal_strength",
      exercises: this.generateStrengthSession(phase),
      estimatedDuration: 60,
      targetRPE: 7,
      notes: "Strength/power maintenance",
    });

    // Friday - Sport Specific
    days.push({
      dayOfWeek: 5,
      dayName: "Friday",
      sessionType: "training",
      primaryFocus: "agility",
      secondaryFocus: "plyometrics",
      exercises: this.generateSportSpecificSession(phase),
      estimatedDuration: 45,
      targetRPE: 6,
      notes: "Sport-specific preparation",
    });

    // Saturday - Game Day or Training
    days.push({
      dayOfWeek: 6,
      dayName: "Saturday",
      sessionType: phase.type === "in_season_maintenance" ? "game" : "training",
      primaryFocus: "speed",
      exercises: [],
      estimatedDuration: phase.type === "in_season_maintenance" ? 90 : 45,
      targetRPE: phase.type === "in_season_maintenance" ? 9 : 6,
      notes:
        phase.type === "in_season_maintenance"
          ? "Game Day"
          : "Optional session",
    });

    // Sunday - Rest
    days.push({
      dayOfWeek: 0,
      dayName: "Sunday",
      sessionType: "rest",
      primaryFocus: "recovery",
      exercises: [],
      estimatedDuration: 0,
      targetRPE: 1,
      notes: "Complete rest",
    });

    // Calculate weekly totals
    const weeklyTotals: WeeklyTotals = {
      totalSprints: phase.sprintVolume.maxSprintsPerWeek,
      totalCuts: phase.agilityConfig.maxCutsPerWeek,
      totalPlyoContacts: phase.plyometricConfig.maxContactsPerWeek,
      totalStrengthSets: phase.strengthConfig.setsPerExercise[1] * 6, // Approximate
      estimatedLoad: Math.round(
        phase.volumeMultiplier * phase.intensityMultiplier * 1000,
      ),
      trainingDays: days.filter((d) => d.sessionType === "training").length,
      restDays: days.filter(
        (d) => d.sessionType === "rest" || d.sessionType === "recovery",
      ).length,
    };

    return {
      weekNumber: weekNum,
      phase: phase.type,
      days,
      weeklyTotals,
      recommendations: this.getWeeklyRecommendations(phase, weekNum),
      warnings: this.getWeeklyWarnings(phase),
    };
  }

  /**
   * Generate exercises for a specific focus
   */
  private generateExercisesForFocus(
    phase: PhaseConfig,
    focus: TrainingFocus,
  ): ExerciseTemplate[] {
    const exercises: ExerciseTemplate[] = [];

    switch (focus) {
      case "maximal_strength":
        exercises.push(
          {
            name: "Trap Bar Deadlift",
            category: "strength",
            sets: phase.strengthConfig.setsPerExercise[1],
            reps: phase.strengthConfig.repsPerSet[0],
            intensity: phase.strengthConfig.intensityRange[1],
            rest: phase.strengthConfig.restPeriodSeconds[1],
            notes: "Focus on explosive concentric",
            evidenceBase: "Suchomel et al. 2016",
          },
          {
            name: "Back Squat",
            category: "strength",
            sets: phase.strengthConfig.setsPerExercise[0],
            reps: phase.strengthConfig.repsPerSet[0],
            intensity: phase.strengthConfig.intensityRange[0],
            rest: phase.strengthConfig.restPeriodSeconds[0],
            notes: "Full depth, controlled descent",
          },
          {
            name: "Nordic Hamstring Curl",
            category: "strength",
            sets: 3,
            reps: 6,
            rest: 90,
            notes: "Eccentric focus - injury prevention",
            evidenceBase: "Comfort et al. 2014",
          },
        );
        break;

      case "power":
        exercises.push(
          {
            name: "Hang Power Clean",
            category: "power",
            sets: 4,
            reps: 3,
            intensity: 75,
            rest: 180,
            notes: "Explosive triple extension",
            evidenceBase: "Suchomel et al. 2016",
          },
          {
            name: "Jump Squat",
            category: "power",
            sets: 3,
            reps: 5,
            intensity: 30,
            rest: 120,
            notes: "Maximum height, soft landing",
          },
          {
            name: "Medicine Ball Rotational Throw",
            category: "power",
            sets: 3,
            reps: 8,
            rest: 60,
            notes: "Sport-specific power transfer",
          },
        );
        break;

      case "speed":
        exercises.push(
          {
            name: "10m Acceleration Sprint",
            category: "sprint",
            sets: 4,
            reps: 3,
            rest: 90,
            notes: "Full recovery between reps",
            evidenceBase: "Haugen et al. 2019",
          },
          {
            name: "20m Sprint",
            category: "sprint",
            sets: 3,
            reps: 3,
            rest: 120,
            notes: "Focus on acceleration mechanics",
          },
          {
            name: "Flying 20m Sprint",
            category: "sprint",
            sets: 2,
            reps: 3,
            rest: 180,
            notes: "Maximum velocity work",
            evidenceBase: "Haugen et al. 2019",
          },
        );
        break;

      case "agility":
        exercises.push(
          {
            name: "Pro Agility (5-10-5)",
            category: "change_of_direction",
            sets: 4,
            reps: 3,
            rest: 60,
            notes: "Sharp cuts, low center of gravity",
            evidenceBase: "Brughelli et al. 2008",
          },
          {
            name: "L-Drill",
            category: "change_of_direction",
            sets: 3,
            reps: 4,
            rest: 45,
            notes: "Focus on deceleration before cuts",
          },
          {
            name: "Reactive Cone Drill",
            category: "change_of_direction",
            sets: 3,
            reps: 4,
            rest: 45,
            notes: "Coach calls direction",
            evidenceBase: "Asadi et al. 2017",
          },
        );
        break;

      default:
        // Generic exercises
        exercises.push({
          name: "Dynamic Warmup",
          category: "mobility",
          sets: 1,
          reps: "10 min",
          rest: 0,
          notes: "Full body activation",
        });
    }

    return exercises;
  }

  /**
   * Generate speed session
   */
  private generateSpeedSession(phase: PhaseConfig): ExerciseTemplate[] {
    return [
      {
        name: "Dynamic Warmup",
        category: "mobility",
        sets: 1,
        reps: "10 min",
        rest: 0,
      },
      {
        name: "A-Skips",
        category: "sprint",
        sets: 3,
        reps: "20m",
        rest: 30,
      },
      {
        name: "10m Acceleration",
        category: "sprint",
        sets: 4,
        reps: 3,
        rest: 90,
        evidenceBase: "Haugen et al. 2019",
      },
      {
        name: "20m Sprint",
        category: "sprint",
        sets: 3,
        reps: 3,
        rest: 120,
      },
      ...(phase.sprintVolume.maxVelocityWork
        ? [
            {
              name: "Flying 30m",
              category: "sprint" as ExerciseCategory,
              sets: 2,
              reps: 2,
              rest: 180,
              notes: "Maximum velocity",
            },
          ]
        : []),
    ];
  }

  /**
   * Generate strength session
   */
  private generateStrengthSession(phase: PhaseConfig): ExerciseTemplate[] {
    return [
      {
        name: "Trap Bar Deadlift",
        category: "strength",
        sets: phase.strengthConfig.setsPerExercise[0],
        reps: phase.strengthConfig.repsPerSet[0],
        intensity: phase.strengthConfig.intensityRange[0],
        rest: phase.strengthConfig.restPeriodSeconds[0],
      },
      {
        name: "Bulgarian Split Squat",
        category: "strength",
        sets: 3,
        reps: 6,
        rest: 90,
        notes: "Each leg",
      },
      {
        name: "Hip Thrust",
        category: "strength",
        sets: 3,
        reps: 8,
        rest: 90,
      },
      {
        name: "Nordic Curl",
        category: "strength",
        sets: 3,
        reps: 6,
        rest: 90,
        notes: "Eccentric focus",
        evidenceBase: "Comfort et al. 2014",
      },
      {
        name: "Pallof Press",
        category: "core",
        sets: 3,
        reps: 10,
        rest: 60,
        notes: "Anti-rotation",
      },
    ];
  }

  /**
   * Generate sport-specific session
   */
  private generateSportSpecificSession(
    _phase: PhaseConfig,
  ): ExerciseTemplate[] {
    return [
      {
        name: "Reactive Agility Drill",
        category: "change_of_direction",
        sets: 4,
        reps: 4,
        rest: 45,
        notes: "React to visual cue",
        evidenceBase: "Asadi et al. 2017",
      },
      {
        name: "Lateral Bounds",
        category: "plyometric",
        sets: 3,
        reps: 6,
        rest: 60,
        notes: "Stick landing",
      },
      {
        name: "Deceleration Drill",
        category: "change_of_direction",
        sets: 3,
        reps: 5,
        rest: 45,
        notes: "Sprint to stop",
        evidenceBase: "Brughelli et al. 2008",
      },
      {
        name: "Route Running Simulation",
        category: "sport_specific",
        sets: 4,
        reps: 4,
        rest: 30,
        notes: "Position-specific",
      },
    ];
  }

  /**
   * Generate recovery session
   */
  private generateRecoverySession(): ExerciseTemplate[] {
    return [
      {
        name: "Foam Rolling",
        category: "mobility",
        sets: 1,
        reps: "10 min",
        rest: 0,
        notes: "Full body",
      },
      {
        name: "Hip Mobility Circuit",
        category: "mobility",
        sets: 2,
        reps: "5 min",
        rest: 0,
      },
      {
        name: "Light Cycling or Walking",
        category: "conditioning",
        sets: 1,
        reps: "15 min",
        rest: 0,
        notes: "Zone 1 heart rate",
      },
    ];
  }

  /**
   * Get personalized adjustments
   */
  private getPersonalizedAdjustments(phase: PhaseConfig): string[] {
    const adjustments: string[] = [];

    if (phase.type === "mid_season_reload") {
      adjustments.push(
        "🔄 July is your 'reload' month - build extra sprint base for second half of season",
        "💪 Address any minor injuries accumulated during competition",
        "🏃 Increase sprint volume to build durability reserve",
        "😴 Prioritize sleep and recovery while training volume is higher",
      );
    }

    if (phase.type === "peak") {
      adjustments.push(
        "🎯 Reduce volume 40-60% but maintain intensity",
        "⚡ Focus on sharpness and explosiveness",
        "🧠 Mental preparation is key",
        "💤 Sleep 9+ hours per night",
      );
    }

    if (phase.type === "in_season_maintenance") {
      adjustments.push(
        "⚖️ Balance training load with game demands",
        "🔧 Minimum 2x/week strength to maintain adaptations",
        "📊 Monitor ACWR weekly - stay in 0.8-1.3 range",
        "🏥 Address injuries immediately",
      );
    }

    return adjustments;
  }

  /**
   * Get nutrition guidelines for phase
   */
  private getNutritionGuidelines(phase: PhaseConfig): string[] {
    const guidelines: string[] = [];

    if (phase.volumeMultiplier > 0.8) {
      guidelines.push(
        "🍚 Higher carbohydrate intake to fuel training volume",
        "🥩 Protein: 1.6-2.2g/kg body weight for recovery",
        "💧 Hydration: 3-4L water daily minimum",
      );
    } else {
      guidelines.push(
        "🥗 Moderate carbohydrate - match to training demands",
        "🥩 Protein: 1.4-1.8g/kg body weight",
        "💧 Hydration: 2.5-3L water daily",
      );
    }

    if (phase.type === "peak" || phase.type === "taper") {
      guidelines.push(
        "🍝 Carb loading 2-3 days before competition",
        "🚫 Avoid new foods before competition",
        "☕ Caffeine strategy for game day",
      );
    }

    return guidelines;
  }

  /**
   * Get weekly recommendations
   */
  private getWeeklyRecommendations(
    phase: PhaseConfig,
    weekNum: number,
  ): string[] {
    const recs: string[] = [];

    if (weekNum === 4) {
      recs.push("📉 Consider a deload week if fatigue is accumulating");
    }

    if (phase.recoveryPriority === "high") {
      recs.push("😴 Prioritize 8+ hours of sleep this phase");
    }

    phase.evidenceBase.forEach((ref) => {
      recs.push(`📚 ${ref.applicationToFlagFootball}`);
    });

    return recs;
  }

  /**
   * Get weekly warnings
   */
  private getWeeklyWarnings(phase: PhaseConfig): string[] {
    const warnings: string[] = [];

    if (phase.plyometricConfig.intensityLevel === "very_high") {
      warnings.push("⚠️ High plyometric intensity - ensure adequate recovery");
    }

    if (phase.sprintVolume.maxSprintsPerWeek > 30) {
      warnings.push("⚠️ High sprint volume - monitor hamstring fatigue");
    }

    return warnings;
  }

  /**
   * Get all evidence references
   */
  getAllEvidenceReferences(): EvidenceReference[] {
    return Object.values(EVIDENCE_BASE);
  }

  /**
   * Get phase by type
   */
  getPhaseByType(type: TrainingPhaseType): PhaseConfig | undefined {
    return Object.values(ANNUAL_PHASES).find((p) => p.type === type);
  }

  /**
   * Get all phases
   */
  getAllPhases(): PhaseConfig[] {
    return Object.values(ANNUAL_PHASES);
  }
}
