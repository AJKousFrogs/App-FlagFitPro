/**
 * Flag Football Athlete Profile - Data
 *
 * All type definitions and static reference data for the flag football
 * athlete profile system. Separated from service logic to keep service
 * files focused on behavior.
 *
 * Consumers should import types and service from flag-football-athlete-profile.service.ts
 * (which re-exports everything here for backward compatibility).
 */

export type FlagFootballPosition =
  | "QB"
  | "WR"
  | "Center"
  | "Rusher"
  | "DB"
  | "LB"
  | "Hybrid";

/**
 * QB Subtypes - Modern flag football QBs have different roles
 */
export type QBSubtype =
  | "pocket_passer" // Traditional QB, minimal running
  | "dual_threat" // Runs and throws equally
  | "double_qb_primary" // Primary QB in double-QB scheme
  | "double_qb_secondary"; // Secondary QB who also runs routes

/**
 * DB Coverage Type - Different movement patterns
 */
export type DBCoverageType = "zone" | "man";

/**
 * Universal requirements all positions need
 */
export interface UniversalRequirements {
  reactiveReadiness: ReactiveReadinessProfile;
  coreStability: CoreStabilityProfile;
  hipFlexorStrength: MuscleGroupProfile;
  ankleComplex: AnkleComplexProfile;
}

export interface ReactiveReadinessProfile {
  description: string;
  exercises: string[];
  frequency: string;
  keyMetrics: string[];
}

export interface CoreStabilityProfile {
  description: string;
  exercises: string[];
  frequency: string;
}

export interface MuscleGroupProfile {
  description: string;
  exercises: string[];
  frequency: string;
  evidenceBase: string;
}

export interface AnkleComplexProfile {
  description: string;
  exercises: string[];
  frequency: string;
  components: string[];
}

export interface AthletePhysicalProfile {
  height: number; // cm
  weight: number; // kg
  bodyFatPercentage?: number;
  leanMass?: number; // kg
  bmi?: number;
  relativeStrength?: number; // squat 1RM / bodyweight
}

export interface AthletePerformanceBenchmarks {
  // Speed (Haugen et al. 2019)
  sprint10m?: number; // seconds
  sprint20m?: number;
  sprint40m?: number;
  flyingSprintSpeed?: number; // m/s

  // Agility (Brughelli et al. 2008)
  proAgility505?: number; // seconds
  lDrill?: number;
  reactiveAgility?: number;

  // Power (Ziv & Lidor 2009, Sheppard et al. 2008)
  verticalJump?: number; // cm
  broadJump?: number; // cm
  reactiveStrengthIndex?: number;

  // Strength (Suchomel et al. 2016)
  backSquat1RM?: number; // kg
  trapBarDeadlift1RM?: number;
  benchPress1RM?: number;
  relativeSquat?: number; // 1RM / bodyweight

  // Endurance (Faude et al. 2012)
  yoyoIR1?: number; // level
  repeatedSprintDecrement?: number; // percentage
  maxHeartRate?: number;
  restingHeartRate?: number;
}

export interface PositionRequirements {
  position: FlagFootballPosition;
  primaryAttributes: string[];
  secondaryAttributes: string[];
  benchmarks: PositionBenchmarks;
  trainingPriorities: string[];
  commonInjuries: string[];
  preventionFocus: string[];
  universalRequirements?: UniversalRequirements;
  // Position-specific extensions
  qbProfile?: QBExtendedProfile;
  dbProfile?: DBExtendedProfile;
  sprintProfile?: PositionSprintProfile;
}

/**
 * Extended QB Profile for Flag Football
 * Flag Football QBs throw 8x more than NFL QBs in tournament play
 */
export interface QBExtendedProfile {
  subtypes: QBSubtypeProfile[];
  throwingOnTheRun: ThrowingOnTheRunProfile;
  fatigueManagement: QBFatigueProfile;
  armCareProtocol: ArmCareProtocol;
}

export interface QBSubtypeProfile {
  type: QBSubtype;
  description: string;
  primarySkills: string[];
  sprintRequirements: string;
  trainingEmphasis: string[];
}

export interface ThrowingOnTheRunProfile {
  rolloutRight: ThrowingDrillSet;
  rolloutLeft: ThrowingDrillSet;
  scrambleThrows: ThrowingDrillSet;
  bootlegThrows: ThrowingDrillSet;
  volumeByPhase: Record<string, ThrowingVolume>;
  coreExercises: string[];
}

export interface ThrowingDrillSet {
  name: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  drills: string[];
  commonErrors: string[];
  coachingCues: string[];
  progressionWeeks: number;
}

export interface ThrowingVolume {
  rolloutRight: string;
  rolloutLeft: string;
  scramble: string;
  totalOnTheRun: string;
  percentageOfTotal: string;
}

export interface QBFatigueProfile {
  nflComparison: string;
  flagFootballDemand: string;
  tournamentThrowVolume: number;
  recoveryProtocol: string[];
  armCareFrequency: string;
}

export interface ArmCareProtocol {
  preThrow: string[];
  postThrow: string[];
  dailyMaintenance: string[];
  weeklyStrengthening: string[];
}

/**
 * Extended DB Profile for different coverage types
 */
export interface DBExtendedProfile {
  zoneCoverage: DBCoverageProfile;
  manCoverage: DBCoverageProfile;
}

export interface DBCoverageProfile {
  primaryMovements: string[];
  sprintPatterns: string[];
  trainingEmphasis: string[];
  drills: string[];
}

/**
 * Position-specific sprint profile
 */
export interface PositionSprintProfile {
  primaryMovementPatterns: string[];
  sprintDistances: string[];
  weeklyVolume: string;
  keyDrills: string[];
  rationale: string;
}

export interface PositionBenchmarks {
  sprint10m: BenchmarkRange;
  sprint20m: BenchmarkRange;
  verticalJump: BenchmarkRange;
  proAgility505: BenchmarkRange;
  relativeSquat: BenchmarkRange;
  bodyFatPercentage: BenchmarkRange;
}

export interface BenchmarkRange {
  elite: number;
  good: number;
  average: number;
  needsWork: number;
  unit: string;
  higherIsBetter: boolean;
}

export interface AthleteAssessment {
  overallScore: number;
  strengthScore: number;
  speedScore: number;
  agilityScore: number;
  powerScore: number;
  enduranceScore: number;
  bodyCompositionScore: number;
  strengths: string[];
  weaknesses: string[];
  priorityTrainingAreas: string[];
  injuryRiskFactors: string[];
  recommendations: string[];
}

export interface TrainingRecommendation {
  area: string;
  priority: "critical" | "high" | "medium" | "low";
  currentLevel: string;
  targetLevel: string;
  exercises: string[];
  frequency: string;
  evidenceBase: string;
}

export interface SeasonalReadiness {
  overallReadiness: number; // 0-100
  speedReadiness: number;
  strengthReadiness: number;
  durabilityReadiness: number;
  injuryRisk: "low" | "moderate" | "high";
  recommendations: string[];
  gamesPerWeekCapacity: number;
}

// ============================================================================
// POSITION-SPECIFIC REQUIREMENTS
// ============================================================================

// ============================================================================
// UNIVERSAL REQUIREMENTS (All Positions)
// ============================================================================

export const UNIVERSAL_REQUIREMENTS: UniversalRequirements = {
  reactiveReadiness: {
    description:
      "All flag football players must be 'on toes, locked and ready' - able to explode in any direction instantly",
    exercises: [
      "Athletic stance holds (30s)",
      "Reactive starts (visual/audio cue)",
      "Mirror drills (partner reaction)",
      "4-cone reactive shuffle",
      "Ball drop reaction drills",
      "First-step explosion drills",
    ],
    frequency: "Every training session - 5-10 min activation",
    keyMetrics: [
      "Reaction time (<0.3s)",
      "First-step quickness",
      "Multi-directional explosion",
    ],
  },
  coreStability: {
    description:
      "Core stability is the foundation for all movement - throwing, cutting, sprinting",
    exercises: [
      "Dead bug variations",
      "Pallof press (anti-rotation)",
      "Bird dog",
      "Plank variations",
      "Medicine ball rotational throws",
      "Single-leg core work",
    ],
    frequency: "3-4x per week, 10-15 min per session",
  },
  hipFlexorStrength: {
    description:
      "Hip flexors drive knee lift in sprinting - weak hip flexors = slow sprints",
    exercises: [
      "Hip flexor marches",
      "Hanging knee raises",
      "Psoas holds",
      "Banded hip flexion",
      "A-skips (hip flexor activation)",
      "High knees with resistance",
    ],
    frequency: "2-3x per week",
    evidenceBase:
      "Morin & Samozino (2016) - Hip flexor strength correlates with sprint velocity",
  },
  ankleComplex: {
    description:
      "Ankle stiffness and strength critical for ground contact efficiency and injury prevention",
    exercises: [
      "Calf raises (straight and bent knee)",
      "Ankle hops (pogo jumps)",
      "Single-leg balance work",
      "Achilles isometric holds",
      "Soleus raises",
      "Ankle mobility drills",
    ],
    frequency: "Daily - 5-10 min",
    components: [
      "Achilles tendon stiffness",
      "Soleus strength",
      "Gastrocnemius power",
      "Ankle stability",
    ],
  },
};

// ============================================================================
// POSITION-SPECIFIC REQUIREMENTS
// ============================================================================

export const POSITION_REQUIREMENTS: Record<
  FlagFootballPosition,
  PositionRequirements
> = {
  QB: {
    position: "QB",
    primaryAttributes: [
      "Arm strength and accuracy",
      "THROWING ON THE RUN (left and right)", // CRITICAL - NEW
      "Scrambling ability",
      "Decision-making speed",
      "Reactive readiness (on toes, locked)",
      "Route running (modern QBs)", // NEW - double QB schemes
    ],
    secondaryAttributes: [
      "Core stability for moving platform",
      "Hip mobility",
      "Rotational power",
      "Vision and awareness",
      "Catching ability (double QB schemes)", // NEW
    ],
    benchmarks: {
      // Updated for dual-threat QB demands
      sprint10m: {
        elite: 1.6,
        good: 1.7,
        average: 1.8,
        needsWork: 1.9,
        unit: "s",
        higherIsBetter: false,
      },
      sprint20m: {
        elite: 2.9,
        good: 3.05,
        average: 3.2,
        needsWork: 3.35,
        unit: "s",
        higherIsBetter: false,
      },
      verticalJump: {
        elite: 70,
        good: 60,
        average: 50,
        needsWork: 40,
        unit: "cm",
        higherIsBetter: true,
      },
      proAgility505: {
        elite: 4.15,
        good: 4.3,
        average: 4.5,
        needsWork: 4.7,
        unit: "s",
        higherIsBetter: false,
      },
      relativeSquat: {
        elite: 2.0,
        good: 1.7,
        average: 1.5,
        needsWork: 1.2,
        unit: "x BW",
        higherIsBetter: true,
      },
      bodyFatPercentage: {
        elite: 10,
        good: 12,
        average: 15,
        needsWork: 18,
        unit: "%",
        higherIsBetter: false,
      },
    },
    trainingPriorities: [
      "ARM CARE (NON-NEGOTIABLE) - 320 throws/tournament capacity",
      "THROWING ON THE RUN - left and right directions",
      "Scramble throwing mechanics",
      "Core stability for moving platform",
      "Hip flexor flexibility (stride length)",
      "Rotational power for throwing",
      "Reactive readiness (on toes, locked)",
      "Route running (for double QB schemes)",
      "Catching ability",
    ],
    commonInjuries: [
      "Shoulder (throwing)",
      "Elbow (UCL)",
      "Hip flexor",
      "Lower back",
      "Ankle (scrambling)",
    ],
    preventionFocus: [
      "Shoulder external rotation strength",
      "Thoracic spine mobility",
      "Hip internal rotation",
      "Core anti-rotation",
      "Ankle stability (scrambling)",
    ],
    universalRequirements: UNIVERSAL_REQUIREMENTS,
    qbProfile: {
      subtypes: [
        {
          type: "pocket_passer",
          description: "Traditional QB who primarily throws from the pocket",
          primarySkills: [
            "Accuracy",
            "Arm strength",
            "Pocket movement",
            "Quick release",
          ],
          sprintRequirements:
            "Moderate - 15-20 sprints/week, focus on short bursts",
          trainingEmphasis: [
            "Arm care",
            "Footwork in pocket",
            "Throwing mechanics",
          ],
        },
        {
          type: "dual_threat",
          description:
            "Modern QB who runs and throws equally. MOST COMMON in flag football.",
          primarySkills: [
            "Throwing on the run",
            "Scrambling",
            "Speed",
            "Decision-making",
          ],
          sprintRequirements: "High - 25-35 sprints/week, acceleration focus",
          trainingEmphasis: [
            "Throwing while running LEFT and RIGHT",
            "Scramble mechanics",
            "Acceleration",
            "Change of direction",
          ],
        },
        {
          type: "double_qb_primary",
          description:
            "Primary QB in double-QB scheme. Throws more, but must also run routes.",
          primarySkills: [
            "Throwing",
            "Route running",
            "Catching",
            "Reactive readiness",
          ],
          sprintRequirements:
            "High - 25-30 sprints/week, route-specific patterns",
          trainingEmphasis: [
            "Throwing on the run",
            "Route running",
            "Catching mechanics",
            "Reactive starts",
          ],
        },
        {
          type: "double_qb_secondary",
          description:
            "Secondary QB who primarily runs routes and catches. Throws occasionally.",
          primarySkills: [
            "Route running",
            "Catching",
            "Speed",
            "Throwing (backup)",
          ],
          sprintRequirements:
            "Very high - 30-40 sprints/week, WR-like training",
          trainingEmphasis: [
            "Route running",
            "Catching",
            "Acceleration",
            "Maintain throwing mechanics",
          ],
        },
      ],
      throwingOnTheRun: {
        rolloutRight: {
          name: "Rollout Right (Natural Side for Right-Handed QB)",
          difficulty: "intermediate",
          drills: [
            "Walking rollout right - 10-15 yards",
            "Jogging rollout right - 15-20 yards",
            "Sprint rollout right - 20-25 yards",
            "Rollout right, throw back across field",
          ],
          commonErrors: [
            "Throwing off back foot (loss of power)",
            "Not squaring shoulders to target",
            "Rushing the throw",
            "Looking at feet instead of target",
          ],
          coachingCues: [
            "Eyes up, find your target FIRST",
            "Quick feet, quiet upper body",
            "Plant and throw OR throw in stride",
            "Follow through to target",
          ],
          progressionWeeks: 4,
        },
        rolloutLeft: {
          name: "Rollout Left (Across Body - HARDER)",
          difficulty: "advanced",
          drills: [
            "Walking rollout left - 10-15 yards",
            "Jogging rollout left - 15-20 yards",
            "Sprint rollout left - 15-20 yards",
            "Rollout left, throw back to middle",
          ],
          commonErrors: [
            "Throwing across closed body (MOST COMMON)",
            "Not opening hips to target",
            "Short-arming the throw",
            "Falling away from throw",
          ],
          coachingCues: [
            "OPEN YOUR HIPS - this is the key",
            "Plant foot, rotate hips, THEN throw",
            "Don't fight your body - work with it",
            "Core rotation generates power",
          ],
          progressionWeeks: 6,
        },
        scrambleThrows: {
          name: "Scramble Throwing (Unplanned/Reactive)",
          difficulty: "advanced",
          drills: [
            "Escape and throw",
            "Scramble drill - random direction",
            "Throw on the run - no set feet",
            "Sideline scramble throw",
          ],
          commonErrors: [
            "Panicking under pressure",
            "Forcing throws into coverage",
            "Not looking downfield while scrambling",
            "Holding ball too long",
          ],
          coachingCues: [
            "Eyes downfield ALWAYS",
            "Know when to throw it away",
            "Trust your arm",
            "Make a decision - don't hesitate",
          ],
          progressionWeeks: 6,
        },
        bootlegThrows: {
          name: "Bootleg/Play-Action Throws",
          difficulty: "intermediate",
          drills: [
            "Naked bootleg right",
            "Naked bootleg left",
            "Bootleg with run/pass option",
          ],
          commonErrors: [
            "Poor play-action fake",
            "Telegraphing the bootleg",
            "Not reading the defender",
          ],
          coachingCues: [
            "Sell the fake - it sets up everything",
            "Be a runner who can throw",
            "Take what the defense gives you",
          ],
          progressionWeeks: 4,
        },
        volumeByPhase: {
          foundation: {
            rolloutRight: "15-20 throws/session, 2x/week",
            rolloutLeft: "10-15 throws/session, 2x/week",
            scramble: "0 (not yet)",
            totalOnTheRun: "25-35 throws/week",
            percentageOfTotal: "15-20%",
          },
          strength: {
            rolloutRight: "20-25 throws/session, 3x/week",
            rolloutLeft: "15-20 throws/session, 2x/week",
            scramble: "10 throws/session, 1x/week",
            totalOnTheRun: "50-75 throws/week",
            percentageOfTotal: "20-25%",
          },
          power: {
            rolloutRight: "25-30 throws/session, 3x/week",
            rolloutLeft: "20-25 throws/session, 3x/week",
            scramble: "15-20 throws/session, 2x/week",
            totalOnTheRun: "80-120 throws/week",
            percentageOfTotal: "25-30%",
          },
          competition: {
            rolloutRight: "15-20 throws/session, 2x/week",
            rolloutLeft: "15-20 throws/session, 2x/week",
            scramble: "10-15 throws/session, 2x/week",
            totalOnTheRun: "50-70 throws/week",
            percentageOfTotal: "25-30%",
          },
        },
        coreExercises: [
          "Rotational med ball throws while walking",
          "Single-leg anti-rotation hold",
          "Pallof press with lateral walk",
          "Medicine ball scoop toss",
          "Core rotation with resistance band",
        ],
      },
      fatigueManagement: {
        nflComparison: "NFL QB throws 30-40 balls per game, 1 game/week",
        flagFootballDemand:
          "Flag QB throws 40+ balls per game, 8 games in 2-3 days",
        tournamentThrowVolume: 320,
        recoveryProtocol: [
          "Ice shoulder between games (10-15 min)",
          "Active recovery throws (20-30 at 50% effort)",
          "Thoracic spine mobility between games",
          "Hydration and nutrition timing",
          "Sleep 8+ hours night before tournament",
        ],
        armCareFrequency: "Daily during tournament weekends, 4x/week otherwise",
      },
      armCareProtocol: {
        preThrow: [
          "Band external rotation (2x15)",
          "Band internal rotation (2x15)",
          "Shoulder circles",
          "Thoracic rotation",
          "Arm circles progressively faster",
        ],
        postThrow: [
          "Ice if any discomfort (15 min)",
          "Light band work (1x15 each direction)",
          "Thoracic foam rolling",
          "Lat stretch",
          "Pec stretch",
        ],
        dailyMaintenance: [
          "Sleeper stretch (2x30s)",
          "Cross-body stretch (2x30s)",
          "Thoracic rotation (2x10 each)",
          "Scapular wall slides (2x10)",
        ],
        weeklyStrengthening: [
          "External rotation with dumbbell (3x12)",
          "Prone Y-T-W raises (2x10 each)",
          "Face pulls (3x15)",
          "Single-arm lat pulldown (3x10)",
          "Tricep work (throwing deceleration)",
        ],
      },
    },
    sprintProfile: {
      primaryMovementPatterns: [
        "Scramble sprints (any direction)",
        "Bootleg runs (designed rollouts)",
        "Escape sprints (evading rush)",
        "Route running (double QB schemes)",
      ],
      sprintDistances: [
        "5-15m scrambles",
        "10-20m bootlegs",
        "Full routes if secondary QB",
      ],
      weeklyVolume:
        "Dual-threat: 25-35 sprints/week | Pocket: 15-20 sprints/week",
      keyDrills: [
        "Scramble drill with throw",
        "Bootleg and throw on the run",
        "Reactive escape drills",
        "Route running (for double QB)",
      ],
      rationale:
        "Modern flag QBs scramble on 40%+ of plays. Must be able to throw accurately while moving.",
    },
  },

  WR: {
    position: "WR",
    primaryAttributes: [
      "Acceleration (0-10m) - CRITICAL",
      "Straight-line speed (40-yard capacity)",
      "Route running precision",
      "Change of direction",
      "Vertical leap",
      "Reactive readiness (on toes, locked)",
    ],
    secondaryAttributes: [
      "Top-end speed maintenance",
      "Hand-eye coordination",
      "Body control",
      "Deceleration ability",
    ],
    benchmarks: {
      sprint10m: {
        elite: 1.55,
        good: 1.65,
        average: 1.75,
        needsWork: 1.85,
        unit: "s",
        higherIsBetter: false,
      },
      sprint20m: {
        elite: 2.8,
        good: 2.95,
        average: 3.1,
        needsWork: 3.25,
        unit: "s",
        higherIsBetter: false,
      },
      verticalJump: {
        elite: 80,
        good: 70,
        average: 60,
        needsWork: 50,
        unit: "cm",
        higherIsBetter: true,
      },
      proAgility505: {
        elite: 4.1,
        good: 4.25,
        average: 4.4,
        needsWork: 4.55,
        unit: "s",
        higherIsBetter: false,
      },
      relativeSquat: {
        elite: 2.2,
        good: 1.9,
        average: 1.6,
        needsWork: 1.3,
        unit: "x BW",
        higherIsBetter: true,
      },
      bodyFatPercentage: {
        elite: 8,
        good: 10,
        average: 13,
        needsWork: 16,
        unit: "%",
        higherIsBetter: false,
      },
    },
    trainingPriorities: [
      "Explosive acceleration (first 10m)",
      "Repeated sprint ability (8x 40 yards)",
      "Deceleration and cutting",
      "Vertical power",
      "Reactive agility",
      "Reactive readiness (on toes, locked)",
    ],
    commonInjuries: [
      "Hamstring strain",
      "Ankle sprain",
      "ACL/MCL",
      "Hip flexor",
    ],
    preventionFocus: [
      "Nordic curls (hamstring)",
      "Ankle stability",
      "Single-leg strength",
      "Deceleration training",
      "Hip flexor flexibility",
    ],
    universalRequirements: UNIVERSAL_REQUIREMENTS,
    sprintProfile: {
      primaryMovementPatterns: [
        "Straight-line sprints (go routes)",
        "Acceleration with cuts (out routes, slants)",
        "Deceleration to cut (comeback, curl)",
        "Repeated sprints (8x 40 yards capacity)",
      ],
      sprintDistances: [
        "5-10m (route start)",
        "10-20m (intermediate routes)",
        "30-40m (go routes, posts)",
        "MUST be able to sprint 8x 40 yards in a row",
      ],
      weeklyVolume: "40-50 sprints/week (highest of all positions)",
      keyDrills: [
        "40-yard repeats (8 reps, 30s rest)",
        "Route-specific sprint patterns",
        "Acceleration to top speed",
        "Sprint with deceleration to cut",
        "Flying 30m sprints",
      ],
      rationale:
        "WRs run the most straight-line distance. Must be able to sprint 8x 40 yards in a row at near-max effort.",
    },
  },

  Center: {
    position: "Center",
    primaryAttributes: [
      "Snap accuracy",
      "Straight-line speed (like WR)",
      "Route running after snap",
      "Receiving ability",
      "Reactive readiness (on toes after snap)",
    ],
    secondaryAttributes: [
      "Core stability",
      "Hip mobility",
      "Acceleration",
      "Hand strength",
    ],
    benchmarks: {
      // Updated - Centers need to be faster (like WRs)
      sprint10m: {
        elite: 1.6,
        good: 1.7,
        average: 1.8,
        needsWork: 1.9,
        unit: "s",
        higherIsBetter: false,
      },
      sprint20m: {
        elite: 2.9,
        good: 3.05,
        average: 3.2,
        needsWork: 3.35,
        unit: "s",
        higherIsBetter: false,
      },
      verticalJump: {
        elite: 65,
        good: 55,
        average: 45,
        needsWork: 35,
        unit: "cm",
        higherIsBetter: true,
      },
      proAgility505: {
        elite: 4.2,
        good: 4.4,
        average: 4.6,
        needsWork: 4.8,
        unit: "s",
        higherIsBetter: false,
      },
      relativeSquat: {
        elite: 1.8,
        good: 1.5,
        average: 1.3,
        needsWork: 1.0,
        unit: "x BW",
        higherIsBetter: true,
      },
      bodyFatPercentage: {
        elite: 12,
        good: 14,
        average: 17,
        needsWork: 20,
        unit: "%",
        higherIsBetter: false,
      },
    },
    trainingPriorities: [
      "Core stability for snapping",
      "Straight-line sprint speed (like WR)",
      "Route running after snap",
      "Receiving skills",
      "Hip hinge mobility",
      "Reactive readiness (snap to sprint)",
    ],
    commonInjuries: [
      "Lower back",
      "Hip flexor",
      "Shoulder",
      "Wrist",
      "Hamstring",
    ],
    preventionFocus: [
      "Core anti-extension",
      "Hip mobility",
      "Shoulder stability",
      "Hamstring strength (sprint demands)",
      "Grip strength",
    ],
    universalRequirements: UNIVERSAL_REQUIREMENTS,
    sprintProfile: {
      primaryMovementPatterns: [
        "Snap to sprint (unique start position)",
        "Straight-line routes (like WR)",
        "Acceleration from bent-over position",
        "Repeated sprints (8x 40 yards capacity)",
      ],
      sprintDistances: [
        "5-10m (immediate after snap)",
        "10-20m (intermediate routes)",
        "30-40m (go routes)",
        "MUST match WR sprint capacity",
      ],
      weeklyVolume: "35-45 sprints/week (similar to WR)",
      keyDrills: [
        "Snap and sprint drill",
        "40-yard repeats (8 reps)",
        "Route running from snap position",
        "Acceleration from hip hinge",
        "Straight-line speed work",
      ],
      rationale:
        "Modern centers are essentially WRs who snap. Must be able to sprint 8x 40 yards in a row.",
    },
  },

  Rusher: {
    position: "Rusher",
    primaryAttributes: [
      "Explosive first step (CRITICAL)",
      "Change of direction",
      "Closing speed",
      "Reactive readiness (on toes, locked)",
      "Hand fighting",
    ],
    secondaryAttributes: [
      "Reactive agility",
      "Core stability",
      "Hip mobility",
      "Anticipation",
    ],
    benchmarks: {
      sprint10m: {
        elite: 1.55,
        good: 1.65,
        average: 1.75,
        needsWork: 1.85,
        unit: "s",
        higherIsBetter: false,
      },
      sprint20m: {
        elite: 2.85,
        good: 3.0,
        average: 3.15,
        needsWork: 3.3,
        unit: "s",
        higherIsBetter: false,
      },
      verticalJump: {
        elite: 75,
        good: 65,
        average: 55,
        needsWork: 45,
        unit: "cm",
        higherIsBetter: true,
      },
      proAgility505: {
        elite: 4.15,
        good: 4.3,
        average: 4.45,
        needsWork: 4.6,
        unit: "s",
        higherIsBetter: false,
      },
      relativeSquat: {
        elite: 2.1,
        good: 1.8,
        average: 1.5,
        needsWork: 1.2,
        unit: "x BW",
        higherIsBetter: true,
      },
      bodyFatPercentage: {
        elite: 9,
        good: 11,
        average: 14,
        needsWork: 17,
        unit: "%",
        higherIsBetter: false,
      },
    },
    trainingPriorities: [
      "First-step explosion",
      "Lateral quickness",
      "Reactive agility",
      "Closing speed",
      "Reactive readiness (on toes, locked)",
    ],
    commonInjuries: ["Hamstring", "Groin", "Ankle", "Knee (ACL)"],
    preventionFocus: [
      "Nordic curls",
      "Copenhagen adductors",
      "Ankle stability",
      "Deceleration training",
    ],
    universalRequirements: UNIVERSAL_REQUIREMENTS,
    sprintProfile: {
      primaryMovementPatterns: [
        "First-step explosion (most critical)",
        "Short burst sprints (5-10m)",
        "Change of direction pursuit",
        "Closing sprints on QB",
      ],
      sprintDistances: [
        "0-5m (first step - CRITICAL)",
        "5-10m (closing on QB)",
        "10-15m (pursuit angles)",
        "Rarely >15m straight line",
      ],
      weeklyVolume: "30-40 sprints/week (short distance focus)",
      keyDrills: [
        "First-step explosion drills",
        "5m burst starts",
        "Reactive start drills",
        "Pursuit angle sprints",
        "Closing speed drills",
      ],
      rationale:
        "Rushers need elite first-step quickness. Most sprints are <10m with direction changes.",
    },
  },

  DB: {
    position: "DB",
    primaryAttributes: [
      "Backpedal speed (ZONE COVERAGE)",
      "Lateral shuffle speed (ZONE COVERAGE)",
      "Hip fluidity (MAN COVERAGE)",
      "Change of direction",
      "Ball tracking",
      "Reactive readiness (on toes, locked)",
    ],
    secondaryAttributes: [
      "Acceleration (closing speed)",
      "Vertical leap",
      "Reactive agility",
      "Anticipation",
    ],
    benchmarks: {
      sprint10m: {
        elite: 1.55,
        good: 1.65,
        average: 1.75,
        needsWork: 1.85,
        unit: "s",
        higherIsBetter: false,
      },
      sprint20m: {
        elite: 2.85,
        good: 3.0,
        average: 3.15,
        needsWork: 3.3,
        unit: "s",
        higherIsBetter: false,
      },
      verticalJump: {
        elite: 78,
        good: 68,
        average: 58,
        needsWork: 48,
        unit: "cm",
        higherIsBetter: true,
      },
      proAgility505: {
        elite: 4.1,
        good: 4.25,
        average: 4.4,
        needsWork: 4.55,
        unit: "s",
        higherIsBetter: false,
      },
      relativeSquat: {
        elite: 2.0,
        good: 1.7,
        average: 1.4,
        needsWork: 1.1,
        unit: "x BW",
        higherIsBetter: true,
      },
      bodyFatPercentage: {
        elite: 8,
        good: 10,
        average: 13,
        needsWork: 16,
        unit: "%",
        higherIsBetter: false,
      },
    },
    trainingPriorities: [
      "Backpedal mechanics and speed",
      "Lateral shuffle mechanics",
      "Hip mobility for turns (man coverage)",
      "Reactive change of direction",
      "Vertical power for contested catches",
      "Reactive readiness (on toes, locked)",
    ],
    commonInjuries: ["Hamstring", "Hip flexor", "Groin", "Ankle"],
    preventionFocus: [
      "Hip internal/external rotation",
      "Hamstring eccentric strength",
      "Groin strengthening (Copenhagen)",
      "Ankle mobility and stability",
    ],
    universalRequirements: UNIVERSAL_REQUIREMENTS,
    dbProfile: {
      zoneCoverage: {
        primaryMovements: [
          "Backpedal (primary movement)",
          "Lateral shuffle",
          "45-degree breaks",
          "Read and react",
        ],
        sprintPatterns: [
          "Backpedal 5-10 yards",
          "Lateral shuffle 5-8 yards",
          "Break on ball (45-degree angle)",
          "Close on receiver (burst)",
        ],
        trainingEmphasis: [
          "Backpedal speed and mechanics",
          "Lateral movement efficiency",
          "Read progression recognition",
          "Zone drop depth and width",
        ],
        drills: [
          "Backpedal weave drill",
          "W-drill (backpedal and break)",
          "Zone drop and break drill",
          "Ball reaction drill in backpedal",
          "Lateral shuffle with hip turn",
        ],
      },
      manCoverage: {
        primaryMovements: [
          "Hip turn and run",
          "Mirror receiver cuts",
          "Speed turn (open hips)",
          "Trail technique",
        ],
        sprintPatterns: [
          "Turn and run with receiver",
          "Mirror cuts (reactive)",
          "Closing sprint on ball",
          "Recovery sprints",
        ],
        trainingEmphasis: [
          "Hip fluidity and turn speed",
          "Reactive mirroring",
          "Speed matching",
          "Recovery technique",
        ],
        drills: [
          "Hip turn drill (both directions)",
          "Mirror drill with partner",
          "Trail coverage drill",
          "Speed turn and run",
          "Reactive break on ball",
        ],
      },
    },
    sprintProfile: {
      primaryMovementPatterns: [
        "Backpedal (zone - 60% of movement)",
        "Lateral shuffle (zone - 25% of movement)",
        "Forward sprint (closing - 15%)",
        "Hip turn and run (man coverage)",
      ],
      sprintDistances: [
        "Backpedal: 5-10 yards",
        "Lateral: 5-8 yards",
        "Forward closing: 5-15 yards",
        "Man coverage runs: 10-40 yards",
      ],
      weeklyVolume:
        "Zone DB: 30-40 sprints (60% backpedal/lateral) | Man DB: 35-45 sprints (more forward)",
      keyDrills: [
        "Backpedal to forward transition",
        "Lateral to backpedal transition",
        "Hip turn and run",
        "Reactive break drills",
        "45-degree angle breaks",
      ],
      rationale:
        "Zone DBs sprint MORE backpedaling and laterally. Man DBs need more forward running and hip turns.",
    },
  },

  LB: {
    position: "LB",
    primaryAttributes: [
      "Read and react",
      "Lateral movement",
      "Closing speed",
      "Zone coverage",
      "Reactive readiness (on toes, locked)",
    ],
    secondaryAttributes: [
      "Acceleration",
      "Change of direction",
      "Ball tracking",
      "Communication",
    ],
    benchmarks: {
      sprint10m: {
        elite: 1.6,
        good: 1.7,
        average: 1.8,
        needsWork: 1.9,
        unit: "s",
        higherIsBetter: false,
      },
      sprint20m: {
        elite: 2.9,
        good: 3.05,
        average: 3.2,
        needsWork: 3.35,
        unit: "s",
        higherIsBetter: false,
      },
      verticalJump: {
        elite: 72,
        good: 62,
        average: 52,
        needsWork: 42,
        unit: "cm",
        higherIsBetter: true,
      },
      proAgility505: {
        elite: 4.2,
        good: 4.35,
        average: 4.5,
        needsWork: 4.65,
        unit: "s",
        higherIsBetter: false,
      },
      relativeSquat: {
        elite: 1.9,
        good: 1.6,
        average: 1.3,
        needsWork: 1.0,
        unit: "x BW",
        higherIsBetter: true,
      },
      bodyFatPercentage: {
        elite: 10,
        good: 12,
        average: 15,
        needsWork: 18,
        unit: "%",
        higherIsBetter: false,
      },
    },
    trainingPriorities: [
      "Lateral shuffle speed",
      "Reactive agility",
      "Acceleration to ball",
      "Zone coverage movement",
      "Reactive readiness (on toes, locked)",
    ],
    commonInjuries: ["Hamstring", "Knee", "Ankle", "Hip"],
    preventionFocus: [
      "Lateral stability",
      "Hamstring strength",
      "Knee stability",
      "Hip mobility",
    ],
    universalRequirements: UNIVERSAL_REQUIREMENTS,
  },

  Hybrid: {
    position: "Hybrid",
    primaryAttributes: [
      "Versatility",
      "All-around athleticism",
      "Quick learning",
      "Adaptability",
      "Reactive readiness (on toes, locked)",
    ],
    secondaryAttributes: ["Speed", "Agility", "Power", "Endurance"],
    benchmarks: {
      sprint10m: {
        elite: 1.6,
        good: 1.7,
        average: 1.8,
        needsWork: 1.9,
        unit: "s",
        higherIsBetter: false,
      },
      sprint20m: {
        elite: 2.9,
        good: 3.05,
        average: 3.2,
        needsWork: 3.35,
        unit: "s",
        higherIsBetter: false,
      },
      verticalJump: {
        elite: 73,
        good: 63,
        average: 53,
        needsWork: 43,
        unit: "cm",
        higherIsBetter: true,
      },
      proAgility505: {
        elite: 4.18,
        good: 4.33,
        average: 4.48,
        needsWork: 4.63,
        unit: "s",
        higherIsBetter: false,
      },
      relativeSquat: {
        elite: 2.0,
        good: 1.7,
        average: 1.4,
        needsWork: 1.1,
        unit: "x BW",
        higherIsBetter: true,
      },
      bodyFatPercentage: {
        elite: 9,
        good: 11,
        average: 14,
        needsWork: 17,
        unit: "%",
        higherIsBetter: false,
      },
    },
    trainingPriorities: [
      "Well-rounded development",
      "Position-specific skills as needed",
      "Maintain all athletic qualities",
      "Injury prevention across all movements",
      "Reactive readiness (on toes, locked)",
    ],
    commonInjuries: ["Varies by role", "Hamstring", "Ankle", "Knee"],
    preventionFocus: [
      "Comprehensive injury prevention",
      "All movement patterns",
      "Recovery optimization",
      "Load management",
    ],
    universalRequirements: UNIVERSAL_REQUIREMENTS,
  },
};

// ============================================================================
// ELITE ATHLETE COMPARISONS (Evidence-Based)
// ============================================================================

export const ELITE_COMPARISONS = {
  // Soccer durability reference (Faude et al. 2012)
  soccerDurability: {
    gamesPerYear: 50,
    sprintsPerGame: 30,
    totalDistancePerGame: 10000, // meters
    highIntensityRuns: 200, // per game
    injuryIncidence: 8.1, // per 1000 hours
  },

  // Basketball power reference (Ziv & Lidor 2009)
  basketballPower: {
    verticalJump: 76, // cm average for elite
    maxVertical: 95, // cm elite
    powerOutput: 4000, // watts peak
    relativeStrength: 1.8, // squat/BW
  },

  // Volleyball jumping reference (Sheppard et al. 2008)
  volleyballJumping: {
    verticalJump: 80, // cm elite
    reactiveStrengthIndex: 2.5,
    jumpFrequency: 100, // per match
    landingForces: 4, // x bodyweight
  },

  // Sprint reference (Haugen et al. 2019)
  sprinterSpeed: {
    usainBolt100m: 9.58,
    usainBoltTopSpeed: 12.27, // m/s (44.72 km/h)
    eliteTeamSport10m: 1.55, // seconds
    eliteTeamSport40m: 4.5, // seconds
    accelerationPhase: 30, // meters to reach max velocity
  },

  // Flag football specific
  flagFootballDemands: {
    gamesPerYear: 60,
    sprintsPerGame: 35,
    cutsPerGame: 50,
    averagePlayDuration: 5, // seconds
    restBetweenPlays: 25, // seconds
    totalPlaysPerGame: 60,
  },
};
