/**
 * Sprint Training Knowledge Data
 *
 * Static data: interfaces, research references, protocols, technique
 * checkpoints, and phase guidelines. Extracted from SprintTrainingKnowledgeService
 * to keep the service file lean.
 *
 * EVIDENCE-BASED SPRINT TRAINING FOR FLAG FOOTBALL ATHLETES
 *
 * This service provides scientifically-backed sprint training protocols
 * specifically designed for the unique demands of flag football:
 * - Acceleration (0-10m) - Most critical for flag football
 * - Maximum velocity (20-40m) - Route running, breakaways
 * - Deceleration - Sudden stops, cutting preparation
 * - Repeated sprint ability - 60+ games per season
 *
 * Research Base:
 * - Haugen et al. (2019) - Sprint interval training for elite team-sport athletes
 * - Seitz et al. (2014) - Increases in lower-body strength transfer to sprint performance
 * - Morin & Samozino (2016) - Interpreting power-force-velocity profiles
 * - Ross et al. (2001) - Neural influences on sprint running
 * - Buchheit et al. (2010) - Repeated-sprint sequences
 * - Petrakos et al. (2016) - Resisted sprint training
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 */

// No Angular or service imports needed — pure data and interfaces

// ============================================================================
// INTERFACES
// ============================================================================

export interface SprintProtocolRequirements {
  minimumACWR: number;
  minimumTrainingAge: string;
  prerequisiteStrength: string[];
  prerequisiteConditioning: string[];
}

export interface SprintProtocol {
  name: string;
  description: string;
  targetQuality: SprintQuality;
  distances: number[]; // meters
  sets: number;
  repsPerSet: number;
  restBetweenReps: number; // seconds
  restBetweenSets: number; // seconds
  workToRestRatio: string;
  intensity: "submaximal" | "near_maximal" | "maximal";
  frequency: string; // e.g., "2-3x per week"
  progressionModel: string;
  contraindications: string[];
  evidenceBase: SprintResearchReference[];
  flagFootballApplication: string;
  requirements?: SprintProtocolRequirements;
  variations?: SprintVariation[];
  technique?: string[];
}

export interface SprintVariation {
  name: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  focus: string;
}

export type SprintQuality =
  | "acceleration"
  | "max_velocity"
  | "speed_endurance"
  | "repeated_sprint"
  | "deceleration"
  | "change_of_direction";

export interface SprintResearchReference {
  authors: string;
  year: number;
  title: string;
  journal: string;
  keyFinding: string;
  effectSize?: string;
  sampleSize?: string;
  sportContext?: string;
}

export interface SprintPhaseGuidelines {
  phase: string;
  weeklySprintVolume: [number, number]; // [min, max] total sprints
  accelerationWork: boolean;
  maxVelocityWork: boolean;
  speedEnduranceWork: boolean;
  resistedSprints: boolean;
  flyingSprints: boolean;
  hillSprints: boolean;
  stairSprints?: boolean; // Only when ACWR >= 0.8 and athlete is well-conditioned
  recommendedProtocols: string[];
  avoidProtocols: string[];
  recoveryConsiderations: string[];
}

export interface SprintProgressionModel {
  weekNumber: number;
  totalSprints: number;
  distances: number[];
  intensityLevel: number; // percentage
  notes: string;
}

export interface SprintTechniqueCheckpoint {
  phase:
    | "start"
    | "acceleration"
    | "transition"
    | "max_velocity"
    | "deceleration";
  keyPoints: string[];
  commonErrors: string[];
  drills: string[];
  flagFootballSpecific: string;
}

export interface SprintWorkout {
  name: string;
  warmup: WarmupProtocol;
  mainSet: SprintSet[];
  cooldown: string[];
  totalDuration: number; // minutes
  targetRPE: number;
  notes: string;
}

export interface WarmupProtocol {
  duration: number; // minutes
  components: string[];
  activationDrills: string[];
  sprintPrep: string[];
}

export interface SprintSet {
  exercise: string;
  distance: number | string;
  reps: number;
  rest: number; // seconds
  intensity: string;
  cues: string[];
}

// ============================================================================
// EVIDENCE-BASED RESEARCH REFERENCES
// ============================================================================

// ============================================================================
// SPRINT BIOMECHANICS - Key Muscle Groups for Sprinting
// ============================================================================

/**
 * Evidence-based sprint biomechanics requirements
 *
 * Key muscle groups for sprint performance:
 * 1. Hip Flexors - Drive knee lift (Morin & Samozino, 2016)
 * 2. Glutes - Hip extension power (Clark et al., 2019)
 * 3. Hamstrings - Hip extension + knee flexion (Schache et al., 2012)
 * 4. Soleus/Achilles - Ankle stiffness for ground contact (Kubo et al., 2000)
 * 5. Core - Transfer of force between upper/lower body
 */
export interface SprintBiomechanicsProfile {
  muscleGroup: string;
  function: string;
  exercises: string[];
  frequency: string;
  evidenceBase: string;
  injuryRisk: string;
}

export const SPRINT_BIOMECHANICS: SprintBiomechanicsProfile[] = [
  {
    muscleGroup: "Hip Flexors (Psoas, Iliacus, Rectus Femoris)",
    function:
      "Drive knee lift during swing phase - determines stride frequency",
    exercises: [
      "Hip flexor marches (2x15 each leg)",
      "Hanging knee raises (3x10)",
      "Psoas holds (3x20s each)",
      "Banded hip flexion (3x12)",
      "A-skips (hip flexor activation)",
      "High knees with resistance band",
      "Mountain climbers (controlled)",
    ],
    frequency: "2-3x per week, 10-15 min per session",
    evidenceBase:
      "Morin & Samozino (2016) - Hip flexor strength correlates with stride frequency and max velocity",
    injuryRisk:
      "Weak hip flexors = compensatory patterns = hamstring strain risk",
  },
  {
    muscleGroup: "Gluteus Maximus",
    function:
      "Primary hip extensor - generates horizontal force during acceleration",
    exercises: [
      "Hip thrust (3x8-10)",
      "Glute bridge variations",
      "Single-leg RDL (3x8 each)",
      "Step-ups (3x8 each)",
      "Banded clamshells",
      "Glute activation before sprints",
    ],
    frequency: "2-3x per week",
    evidenceBase:
      "Morin & Samozino (2016) - Horizontal force application is key determinant of acceleration",
    injuryRisk: "Weak glutes = overreliance on hamstrings = hamstring strain",
  },
  {
    muscleGroup: "Hamstrings (Biceps Femoris, Semimembranosus, Semitendinosus)",
    function:
      "Hip extension + knee flexion during late swing phase - highest injury risk muscle",
    exercises: [
      "Nordic curls (3x6-8) - CRITICAL",
      "Romanian deadlift (3x8)",
      "Single-leg RDL (3x8 each)",
      "Hamstring slides (3x10)",
      "Prone hamstring curls (eccentric focus)",
      "Good mornings (light weight)",
    ],
    frequency: "2x per week MINIMUM (year-round)",
    evidenceBase:
      "Al Attar et al. (2017) - Nordic curls reduce hamstring injuries by 51%",
    injuryRisk: "Most common sprint injury. Eccentric strength is protective.",
  },
  {
    muscleGroup: "Soleus & Achilles Tendon Complex",
    function:
      "Ankle stiffness for efficient ground contact - 'spring' mechanism",
    exercises: [
      "Soleus raises (bent knee calf raises) - 3x15",
      "Straight leg calf raises - 3x15",
      "Pogo jumps (ankle stiffness) - 3x20",
      "Single-leg hops - 3x10 each",
      "Isometric calf holds - 3x30s",
      "Achilles tendon loading (slow eccentrics)",
    ],
    frequency: "Daily - 5-10 min (can be part of warm-up)",
    evidenceBase:
      "Kubo et al. (2000) - Achilles tendon stiffness correlates with sprint performance",
    injuryRisk:
      "Achilles tendinopathy common in sprinters. Gradual loading is key.",
  },
  {
    muscleGroup: "Core (Transverse Abdominis, Obliques, Erector Spinae)",
    function:
      "Transfer force between upper and lower body - maintain sprint posture",
    exercises: [
      "Dead bug (3x10 each side)",
      "Pallof press (3x10 each side)",
      "Bird dog (3x10 each)",
      "Plank variations (30-60s)",
      "Medicine ball rotational throws",
      "Anti-rotation holds",
    ],
    frequency: "3-4x per week, integrated into training",
    evidenceBase:
      "Kibler et al. (2006) - Core stability essential for efficient force transfer",
    injuryRisk: "Weak core = energy leakage = compensatory patterns",
  },
];

// ============================================================================
// POSITION-SPECIFIC SPRINT PROTOCOLS
// ============================================================================

export interface PositionSprintProtocol {
  position: string;
  primaryMovementPatterns: string[];
  sprintDistances: SprintDistanceBreakdown;
  weeklyVolume: string;
  keyDrills: string[];
  rationale: string;
  uniqueConsiderations: string[];
}

export interface SprintDistanceBreakdown {
  short: string; // 0-10m
  medium: string; // 10-20m
  long: string; // 20-40m
  percentage: string;
}

export const POSITION_SPRINT_PROTOCOLS: PositionSprintProtocol[] = [
  {
    position: "WR (Wide Receiver)",
    primaryMovementPatterns: [
      "Straight-line sprints (go routes, posts)",
      "Acceleration with cuts (out routes, slants)",
      "Deceleration to cut (comeback, curl)",
      "Repeated sprints (8x 40 yards capacity)",
    ],
    sprintDistances: {
      short: "5-10m route starts - 30%",
      medium: "10-20m intermediate routes - 40%",
      long: "30-40m go routes - 30%",
      percentage: "Highest straight-line volume of all positions",
    },
    weeklyVolume: "40-50 sprints/week",
    keyDrills: [
      "40-yard repeats (8 reps, 30s rest) - CRITICAL",
      "Route-specific sprint patterns",
      "Acceleration to top speed",
      "Sprint with deceleration to cut",
      "Flying 30m sprints",
    ],
    rationale:
      "WRs run the most straight-line distance. Must be able to sprint 8x 40 yards in a row at near-max effort.",
    uniqueConsiderations: [
      "Highest hamstring injury risk due to max velocity work",
      "Need excellent repeated sprint ability",
      "Deceleration training critical for route breaks",
    ],
  },
  {
    position: "Center",
    primaryMovementPatterns: [
      "Snap to sprint (unique start position)",
      "Straight-line routes (like WR)",
      "Acceleration from bent-over position",
      "Repeated sprints (8x 40 yards capacity)",
    ],
    sprintDistances: {
      short: "5-10m immediate after snap - 35%",
      medium: "10-20m intermediate routes - 40%",
      long: "30-40m go routes - 25%",
      percentage: "Similar to WR, unique start position",
    },
    weeklyVolume: "35-45 sprints/week",
    keyDrills: [
      "Snap and sprint drill",
      "40-yard repeats (8 reps)",
      "Route running from snap position",
      "Acceleration from hip hinge",
      "Straight-line speed work",
    ],
    rationale:
      "Modern centers are essentially WRs who snap. Must match WR sprint capacity.",
    uniqueConsiderations: [
      "Unique start position (bent over for snap)",
      "Need to accelerate from disadvantaged position",
      "Core strength critical for snap-to-sprint transition",
    ],
  },
  {
    position: "DB - Zone Coverage",
    primaryMovementPatterns: [
      "Backpedal (primary movement - 60%)",
      "Lateral shuffle (25%)",
      "Forward closing sprint (15%)",
      "45-degree angle breaks",
    ],
    sprintDistances: {
      short: "Backpedal 5-10 yards - 60%",
      medium: "Lateral 5-8 yards - 25%",
      long: "Forward closing 5-15 yards - 15%",
      percentage: "Majority is backpedal and lateral",
    },
    weeklyVolume: "30-40 sprints (60% backpedal/lateral)",
    keyDrills: [
      "Backpedal weave drill",
      "W-drill (backpedal and break)",
      "Zone drop and break drill",
      "Ball reaction drill in backpedal",
      "Lateral shuffle with hip turn",
      "Backpedal to forward transition",
    ],
    rationale:
      "Zone DBs sprint MORE backpedaling and laterally than forward. Train the actual movement patterns.",
    uniqueConsiderations: [
      "Backpedal mechanics are different from forward sprinting",
      "Hip flexors work differently in backpedal",
      "Groin strain risk from lateral movement",
    ],
  },
  {
    position: "DB - Man Coverage",
    primaryMovementPatterns: [
      "Hip turn and run (primary)",
      "Mirror receiver cuts",
      "Speed turn (open hips)",
      "Closing sprint on ball",
    ],
    sprintDistances: {
      short: "5-10m mirroring - 40%",
      medium: "10-20m running with receiver - 35%",
      long: "20-40m deep coverage - 25%",
      percentage: "More forward running than zone",
    },
    weeklyVolume: "35-45 sprints (more forward than zone)",
    keyDrills: [
      "Hip turn drill (both directions)",
      "Mirror drill with partner",
      "Trail coverage drill",
      "Speed turn and run",
      "Reactive break on ball",
      "Recovery sprint drill",
    ],
    rationale:
      "Man DBs need excellent hip fluidity and the ability to run with receivers at max speed.",
    uniqueConsiderations: [
      "Hip turn speed is critical",
      "Must match WR speed in straight line",
      "Recovery ability when beaten",
    ],
  },
  {
    position: "Rusher",
    primaryMovementPatterns: [
      "First-step explosion (CRITICAL)",
      "Short burst sprints (5-10m)",
      "Change of direction pursuit",
      "Closing sprints on QB",
    ],
    sprintDistances: {
      short: "0-5m first step - 50%",
      medium: "5-10m closing - 40%",
      long: "10-15m pursuit - 10%",
      percentage: "Shortest sprint distances, highest intensity",
    },
    weeklyVolume: "30-40 sprints (short distance focus)",
    keyDrills: [
      "First-step explosion drills",
      "5m burst starts",
      "Reactive start drills",
      "Pursuit angle sprints",
      "Closing speed drills",
      "Hand-fighting to sprint",
    ],
    rationale:
      "Rushers need elite first-step quickness. Most sprints are <10m with direction changes.",
    uniqueConsiderations: [
      "First step is everything - train it daily",
      "Reactive ability to QB movement",
      "Short recovery between rush attempts",
    ],
  },
  {
    position: "QB - Dual Threat",
    primaryMovementPatterns: [
      "Scramble sprints (any direction)",
      "Bootleg runs (designed rollouts)",
      "Escape sprints (evading rush)",
      "Route running (double QB schemes)",
    ],
    sprintDistances: {
      short: "5-10m scrambles - 50%",
      medium: "10-20m bootlegs - 35%",
      long: "20-40m (if running routes) - 15%",
      percentage: "Variable based on play design",
    },
    weeklyVolume: "25-35 sprints/week",
    keyDrills: [
      "Scramble drill with throw",
      "Bootleg and throw on the run",
      "Reactive escape drills",
      "Route running (for double QB)",
      "Lateral movement in pocket",
      "Sprint to throw drill",
    ],
    rationale:
      "Modern flag QBs scramble on 40%+ of plays. Must be able to throw accurately while moving.",
    uniqueConsiderations: [
      "Sprint training must include throwing",
      "Core stability while sprinting is critical",
      "Ankle stability for scramble cuts",
      "Route running if in double QB scheme",
    ],
  },
];

// ============================================================================
// REACTIVE READINESS TRAINING
// ============================================================================

export interface ReactiveReadinessProtocol {
  name: string;
  description: string;
  exercises: ReactiveExercise[];
  frequency: string;
  duration: string;
  evidenceBase: string;
}

export interface ReactiveExercise {
  name: string;
  sets: number;
  reps: number | string;
  cues: string[];
}

export const REACTIVE_READINESS_PROTOCOL: ReactiveReadinessProtocol = {
  name: "On Toes, Locked and Ready",
  description:
    "All flag football players must be able to explode in any direction instantly. This is the foundation of reactive athleticism.",
  exercises: [
    {
      name: "Athletic Stance Holds",
      sets: 3,
      reps: "30 seconds",
      cues: [
        "Weight on balls of feet",
        "Knees slightly bent",
        "Hips loaded (athletic position)",
        "Arms ready to drive",
        "Eyes up, scanning",
      ],
    },
    {
      name: "Reactive Starts (Visual Cue)",
      sets: 4,
      reps: 6,
      cues: [
        "Partner points direction",
        "Explode in that direction",
        "First step is EVERYTHING",
        "Drive arms aggressively",
      ],
    },
    {
      name: "Reactive Starts (Audio Cue)",
      sets: 4,
      reps: 6,
      cues: [
        "Partner calls direction",
        "React and explode",
        "Don't anticipate - react",
        "Stay low on first step",
      ],
    },
    {
      name: "Mirror Drill",
      sets: 3,
      reps: "30 seconds",
      cues: [
        "Partner moves randomly",
        "Mirror their movement",
        "Stay on balls of feet",
        "Quick, reactive steps",
      ],
    },
    {
      name: "4-Cone Reactive Shuffle",
      sets: 3,
      reps: 4,
      cues: [
        "4 cones in square (5m apart)",
        "React to coach's call",
        "Shuffle to called cone",
        "Stay athletic throughout",
      ],
    },
    {
      name: "Ball Drop Reaction",
      sets: 3,
      reps: 6,
      cues: [
        "Partner holds ball at shoulder height",
        "Drops ball randomly",
        "Catch before second bounce",
        "Explode from athletic stance",
      ],
    },
    {
      name: "First-Step Explosion Drill",
      sets: 4,
      reps: 8,
      cues: [
        "Athletic stance",
        "On signal, explode forward",
        "First step determines everything",
        "Drive through the ground",
      ],
    },
  ],
  frequency: "Every training session - 5-10 min activation",
  duration: "5-10 minutes as part of warm-up",
  evidenceBase:
    "Reactive agility is trainable and transfers to sport performance (Sheppard & Young, 2006)",
};

// ============================================================================
// ANKLE STIFFNESS TRAINING
// ============================================================================

export interface AnkleStiffnessProtocol {
  name: string;
  description: string;
  exercises: string[];
  frequency: string;
  evidenceBase: string;
  progressionModel: string[];
}

export const ANKLE_STIFFNESS_PROTOCOL: AnkleStiffnessProtocol = {
  name: "Ankle Complex Development",
  description:
    "Ankle stiffness is critical for efficient ground contact during sprinting. The Achilles tendon acts as a spring.",
  exercises: [
    "Pogo jumps (3x20) - minimal knee bend, ankle-only",
    "Single-leg pogo jumps (3x10 each)",
    "Ankle bounces on step (3x15)",
    "Straight-leg calf raises (3x15)",
    "Bent-knee calf raises (soleus focus) (3x15)",
    "Isometric calf holds (3x30s)",
    "Eccentric calf lowers (slow 5-count) (3x10)",
    "Single-leg balance (30s each)",
  ],
  frequency: "Daily - 5-10 min (can be part of warm-up or cool-down)",
  evidenceBase:
    "Kubo et al. (2000) - Achilles tendon stiffness correlates with sprint performance",
  progressionModel: [
    "Week 1-2: Bilateral exercises only, low volume",
    "Week 3-4: Introduce single-leg work",
    "Week 5-6: Increase volume, add isometric holds",
    "Week 7+: Full protocol, maintain year-round",
  ],
};

// ============================================================================
// EVIDENCE-BASED RESEARCH REFERENCES
// ============================================================================

export const SPRINT_RESEARCH: Record<string, SprintResearchReference> = {
  haugen_2019: {
    authors: "Haugen, T., Seiler, S., Sandbakk, Ø., & Tønnessen, E.",
    year: 2019,
    title:
      "The Training and Development of Elite Sprint Performance: an Integration of Scientific and Best Practice Literature",
    journal: "Sports Medicine - Open",
    keyFinding:
      "Elite sprinters perform 300-600 maximal sprints annually. Quality over quantity is paramount.",
    effectSize: "Large improvements with structured periodization",
    sportContext: "Track & Field, Team Sports",
  },
  morin_samozino_2016: {
    authors: "Morin, J.B., & Samozino, P.",
    year: 2016,
    title:
      "Interpreting Power-Force-Velocity Profiles for Individualized Training",
    journal: "International Journal of Sports Physiology and Performance",
    keyFinding:
      "Hip flexor strength correlates with stride frequency. Horizontal force application is key for acceleration.",
    effectSize: "r = 0.93 (horizontal force-acceleration)",
    sportContext: "All sprint sports",
  },
  kubo_2000: {
    authors: "Kubo, K., Kanehisa, H., & Fukunaga, T.",
    year: 2000,
    title:
      "Effect of Stretching Training on the Viscoelastic Properties of Human Tendon Structures",
    journal: "Journal of Applied Physiology",
    keyFinding:
      "Achilles tendon stiffness correlates with sprint performance. Stiffer tendons = more efficient energy return.",
    sportContext: "Sprinting, jumping",
  },
  schache_2012: {
    authors: "Schache, A.G., et al.",
    year: 2012,
    title: "Mechanics of the Human Hamstring Muscles During Sprinting",
    journal: "Medicine & Science in Sports & Exercise",
    keyFinding:
      "Hamstrings work hardest during late swing phase. Eccentric strength is protective.",
    sportContext: "Sprinting",
  },
  al_attar_2017: {
    authors: "Al Attar, W.S., et al.",
    year: 2017,
    title:
      "How Effective are F-MARC Injury Prevention Programs for Soccer Players?",
    journal: "Sports Medicine",
    keyFinding: "Nordic curls reduce hamstring injuries by 51%",
    effectSize: "51% reduction in hamstring injuries",
    sportContext: "Soccer (applicable to all sprint sports)",
  },
  seitz_2014: {
    authors:
      "Seitz, L.B., Reyes, A., Tran, T.T., de Villarreal, E.S., & Haff, G.G.",
    year: 2014,
    title:
      "Increases in Lower-Body Strength Transfer Positively to Sprint Performance",
    journal: "Journal of Strength and Conditioning Research",
    keyFinding:
      "Every 1% increase in squat strength = 0.7% improvement in sprint times",
    effectSize: "r = 0.77 (strength-sprint correlation)",
    sampleSize: "510 participants across 15 studies",
  },
  morin_2016: {
    authors: "Morin, J.B., & Samozino, P.",
    year: 2016,
    title:
      "Interpreting Power-Force-Velocity Profiles for Individualized Training",
    journal: "International Journal of Sports Physiology and Performance",
    keyFinding:
      "Horizontal force application is the key determinant of acceleration performance",
    effectSize: "r = 0.93 (horizontal force-acceleration)",
    sportContext: "All sprint sports",
  },
  ross_2001: {
    authors: "Ross, A., Leveritt, M., & Riek, S.",
    year: 2001,
    title:
      "Neural Influences on Sprint Running: Training Adaptations and Acute Responses",
    journal: "Sports Medicine",
    keyFinding:
      "Sprint performance is primarily limited by neural factors, not muscular",
    sportContext: "Sprinting",
  },
  buchheit_2010: {
    authors:
      "Buchheit, M., Mendez-Villanueva, A., Simpson, B.M., & Bourdon, P.C.",
    year: 2010,
    title: "Repeated-Sprint Sequences During Youth Soccer Matches",
    journal: "International Journal of Sports Medicine",
    keyFinding:
      "Team sport athletes perform 20-40 sprints per game with incomplete recovery",
    sampleSize: "Youth soccer players",
    sportContext: "Soccer (similar demands to flag football)",
  },
  petrakos_2016: {
    authors: "Petrakos, G., Morin, J.B., & Egan, B.",
    year: 2016,
    title: "Resisted Sled Sprint Training to Improve Sprint Performance",
    journal: "Sports Medicine",
    keyFinding:
      "Light sled loads (10-20% BW) improve acceleration without altering mechanics",
    effectSize: "2-3% improvement in 10m sprint times",
    sportContext: "Team sports",
  },
  lockie_2012: {
    authors:
      "Lockie, R.G., Murphy, A.J., Schultz, A.B., Knight, T.J., & Janse de Jonge, X.A.",
    year: 2012,
    title:
      "The Effects of Different Speed Training Protocols on Sprint Acceleration Kinematics",
    journal: "Journal of Strength and Conditioning Research",
    keyFinding: "Resisted and assisted sprinting both improve acceleration",
    sportContext: "Field sport athletes",
  },
  rumpf_2016: {
    authors: "Rumpf, M.C., Lockie, R.G., Cronin, J.B., & Jalilvand, F.",
    year: 2016,
    title:
      "Effect of Different Sprint Training Methods on Sprint Performance Over Various Distances",
    journal: "Journal of Strength and Conditioning Research",
    keyFinding:
      "Training specificity matters - train the distances you compete at",
    sportContext: "Various sports",
  },
  clark_2019: {
    authors: "Clark, K.P., Rieger, R.H., Bruno, R.F., & Stearne, D.J.",
    year: 2019,
    title: "The NFL Combine 40-Yard Dash: How Important is Maximum Velocity?",
    journal: "Journal of Strength and Conditioning Research",
    keyFinding:
      "Acceleration (0-10 yards) accounts for 60% of 40-yard dash variance",
    sportContext: "American Football (directly applicable to flag football)",
  },
};

// ============================================================================
// SPRINT PROTOCOLS
// ============================================================================

export const SPRINT_PROTOCOLS: Record<string, SprintProtocol> = {
  // ========================================
  // ACCELERATION PROTOCOLS
  // ========================================
  short_acceleration: {
    name: "Short Acceleration Development",
    description:
      "Pure acceleration work focusing on the first 10 meters. Critical for flag football where most plays involve quick bursts.",
    targetQuality: "acceleration",
    distances: [5, 10],
    sets: 3,
    repsPerSet: 4,
    restBetweenReps: 90,
    restBetweenSets: 180,
    workToRestRatio: "1:20+",
    intensity: "maximal",
    frequency: "2-3x per week",
    progressionModel:
      "Increase reps before sets. Add resisted sprints after 4 weeks.",
    contraindications: [
      "Acute hamstring injury",
      "Excessive fatigue (RPE > 8 from previous session)",
      "Within 48 hours of competition",
    ],
    evidenceBase: [
      SPRINT_RESEARCH["clark_2019"],
      SPRINT_RESEARCH["morin_2016"],
      SPRINT_RESEARCH["haugen_2019"],
    ],
    flagFootballApplication:
      "The first 5-10m burst is used on every play - routes, rushes, scrambles. This is the most transferable sprint quality for flag football.",
  },

  resisted_acceleration: {
    name: "Resisted Acceleration (Sled/Band)",
    description:
      "Light resistance (10-20% BW) to overload horizontal force production during acceleration.",
    targetQuality: "acceleration",
    distances: [10, 15, 20],
    sets: 3,
    repsPerSet: 3,
    restBetweenReps: 120,
    restBetweenSets: 240,
    workToRestRatio: "1:15-20",
    intensity: "maximal",
    frequency: "1-2x per week",
    progressionModel:
      "Start at 10% BW, progress to 20% over 6 weeks. Never exceed 20% to maintain mechanics.",
    contraindications: [
      "Technical breakdown at any load",
      "In-season competition weeks",
      "Beginners (need 6+ months sprint training first)",
    ],
    evidenceBase: [
      SPRINT_RESEARCH["petrakos_2016"],
      SPRINT_RESEARCH["lockie_2012"],
    ],
    flagFootballApplication:
      "Develops the horizontal force needed to explode off the line. Especially valuable for WRs, rushers, and QBs escaping pressure.",
  },

  // ========================================
  // MAXIMUM VELOCITY PROTOCOLS
  // ========================================
  flying_sprints: {
    name: "Flying Sprints (Max Velocity)",
    description:
      "Build-up sprints where athletes reach maximum velocity before a timed zone. Develops top-end speed.",
    targetQuality: "max_velocity",
    distances: [20, 30], // Flying zone distance
    sets: 2,
    repsPerSet: 3,
    restBetweenReps: 180,
    restBetweenSets: 300,
    workToRestRatio: "1:25-30",
    intensity: "maximal",
    frequency: "1-2x per week",
    progressionModel:
      "Start with 20m flying zone, progress to 30m. Focus on relaxation at max velocity.",
    contraindications: [
      "Hamstring tightness",
      "Excessive CNS fatigue",
      "Poor sprint mechanics",
    ],
    evidenceBase: [
      SPRINT_RESEARCH["haugen_2019"],
      SPRINT_RESEARCH["ross_2001"],
    ],
    flagFootballApplication:
      "Used for long routes (go routes, posts) and breakaway plays. While less frequent than acceleration, max velocity separates elite players.",
  },

  in_and_out_sprints: {
    name: "In-and-Out Sprints",
    description:
      "Alternating between acceleration and max velocity zones. Teaches velocity maintenance and relaxation.",
    targetQuality: "max_velocity",
    distances: [60], // Total distance
    sets: 3,
    repsPerSet: 3,
    restBetweenReps: 180,
    restBetweenSets: 300,
    workToRestRatio: "1:20",
    intensity: "near_maximal",
    frequency: "1x per week",
    progressionModel:
      "Focus on smooth transitions. Increase intensity before volume.",
    contraindications: [
      "High accumulated fatigue",
      "Competition within 72 hours",
    ],
    evidenceBase: [SPRINT_RESEARCH["haugen_2019"]],
    flagFootballApplication:
      "Mimics route running where you accelerate, maintain, then accelerate again (e.g., double moves).",
  },

  // ========================================
  // REPEATED SPRINT PROTOCOLS
  // ========================================
  repeated_sprint_ability: {
    name: "Repeated Sprint Ability (RSA)",
    description:
      "Multiple sprints with incomplete recovery. Mimics game demands where you sprint, jog back, sprint again.",
    targetQuality: "repeated_sprint",
    distances: [20, 30],
    sets: 3,
    repsPerSet: 6,
    restBetweenReps: 20, // Incomplete recovery
    restBetweenSets: 240,
    workToRestRatio: "1:4-6",
    intensity: "near_maximal",
    frequency: "1-2x per week",
    progressionModel:
      "Maintain quality across all reps. If times drop >10%, reduce reps.",
    contraindications: [
      "Pre-competition (too fatiguing)",
      "Recovery-focused phases",
    ],
    evidenceBase: [SPRINT_RESEARCH["buchheit_2010"]],
    flagFootballApplication:
      "Flag football involves 20-40 sprints per game with incomplete recovery. RSA training builds the capacity to maintain speed across an entire game and tournament.",
  },

  // ========================================
  // DECELERATION PROTOCOLS
  // ========================================
  deceleration_training: {
    name: "Deceleration & Braking",
    description:
      "Controlled deceleration from sprint to stop. Critical for injury prevention and cutting preparation.",
    targetQuality: "deceleration",
    distances: [20, 30],
    sets: 3,
    repsPerSet: 4,
    restBetweenReps: 60,
    restBetweenSets: 180,
    workToRestRatio: "1:10",
    intensity: "near_maximal",
    frequency: "2-3x per week",
    progressionModel:
      "Focus on technique first. Progress from planned to reactive stops.",
    contraindications: ["Knee pain or instability", "Acute quadriceps strain"],
    evidenceBase: [SPRINT_RESEARCH["rumpf_2016"]],
    flagFootballApplication:
      "Every cut, route break, and defensive reaction requires rapid deceleration. Poor deceleration = ACL risk. This is non-negotiable training.",
  },

  // ========================================
  // SPEED ENDURANCE
  // ========================================
  speed_endurance: {
    name: "Speed Endurance",
    description:
      "Longer sprints (60-100m) at 90-95% intensity. Builds lactate tolerance and maintains speed under fatigue.",
    targetQuality: "speed_endurance",
    distances: [60, 80, 100],
    sets: 2,
    repsPerSet: 3,
    restBetweenReps: 300,
    restBetweenSets: 480,
    workToRestRatio: "1:10-12",
    intensity: "near_maximal",
    frequency: "1x per week (off-season only)",
    progressionModel:
      "Use sparingly. Quality is paramount - if form breaks down, stop.",
    contraindications: [
      "In-season (too fatiguing)",
      "Within 7 days of competition",
      "Accumulated fatigue",
    ],
    evidenceBase: [SPRINT_RESEARCH["haugen_2019"]],
    flagFootballApplication:
      "Builds the 'reserve tank' for late-game situations. Use in off-season and July reload phase only.",
  },

  // ========================================
  // STAIR SPRINTS (ADVANCED)
  // ========================================
  stair_sprints: {
    name: "Stair Sprints",
    description:
      "High-intensity stair running that develops explosive power, hip flexor strength, and cardiovascular conditioning. ADVANCED protocol requiring proper training base.",
    targetQuality: "acceleration",
    distances: [20, 30, 40], // Approximate stair count or meters
    sets: 3,
    repsPerSet: 4,
    restBetweenReps: 90,
    restBetweenSets: 180,
    workToRestRatio: "1:15-20",
    intensity: "maximal",
    frequency: "1x per week maximum",
    progressionModel:
      "Start with 2 sets of 3 reps. Progress to 3x4 over 4-6 weeks. Focus on single-step sprints before double-step.",
    contraindications: [
      "ACWR below 0.8 - athlete not conditioned enough",
      "Knee pain or instability",
      "Ankle issues or recent sprains",
      "Hip flexor strain or tightness",
      "Beginners (need 12+ months training base)",
      "Within 72 hours of competition",
      "Excessive fatigue (RPE > 7 from previous session)",
    ],
    requirements: {
      minimumACWR: 0.8,
      minimumTrainingAge: "12 months",
      prerequisiteStrength: [
        "Single-leg squat with control",
        "30+ consecutive bodyweight squats",
        "Nordic curl competency",
      ],
      prerequisiteConditioning: [
        "Consistent sprint training for 8+ weeks",
        "No lower body injuries in past 6 weeks",
        "Demonstrated recovery capacity",
      ],
    },
    variations: [
      {
        name: "Single-step stair sprints",
        description: "Every step, maximum speed",
        difficulty: "intermediate",
        focus: "Turnover speed and ankle stiffness",
      },
      {
        name: "Double-step stair sprints",
        description: "Skip every other step",
        difficulty: "advanced",
        focus: "Hip flexor power and stride length",
      },
      {
        name: "Lateral stair bounds",
        description: "Side-to-side up stairs",
        difficulty: "advanced",
        focus: "Lateral power and hip abductors",
      },
    ],
    technique: [
      "Drive knees high with each step",
      "Stay on balls of feet - no heel contact",
      "Pump arms aggressively",
      "Lean slightly forward into the stairs",
      "Maintain rhythm and control",
      "Walk down for recovery (never run down)",
    ],
    evidenceBase: [
      SPRINT_RESEARCH["morin_2016"],
      SPRINT_RESEARCH["clark_2019"],
    ],
    flagFootballApplication:
      "Develops explosive hip flexor power critical for acceleration. The incline forces greater knee drive and horizontal force production. Reserve for well-conditioned athletes only.",
  },
};

// ============================================================================
// TECHNIQUE CHECKPOINTS
// ============================================================================

export const TECHNIQUE_CHECKPOINTS: SprintTechniqueCheckpoint[] = [
  {
    phase: "start",
    keyPoints: [
      "Powerful push from both legs",
      "Forward lean (45-degree angle)",
      "Aggressive arm drive",
      "Eyes focused 10m ahead",
    ],
    commonErrors: [
      "Standing up too quickly",
      "Passive arm action",
      "Looking down at feet",
      "Narrow base of support",
    ],
    drills: [
      "Wall drives",
      "Falling starts",
      "Push-up starts",
      "Block starts (if available)",
    ],
    flagFootballSpecific:
      "The start position varies by position - WRs may use a 3-point stance, QBs start from under center. Train sport-specific starts.",
  },
  {
    phase: "acceleration",
    keyPoints: [
      "Gradual rise over 10-15m",
      "Positive shin angles",
      "Ground contact under/behind center of mass",
      "Powerful hip extension",
    ],
    commonErrors: [
      "Overstriding (reaching with front leg)",
      "Vertical torso too early",
      "Insufficient hip extension",
      "Arms crossing midline",
    ],
    drills: [
      "Sled pushes",
      "Resisted sprints (10-20% BW)",
      "Hill sprints (slight incline)",
      "A-skips progressing to sprints",
    ],
    flagFootballSpecific:
      "Acceleration is king in flag football. Most plays are won or lost in the first 10 meters. Prioritize this phase.",
  },
  {
    phase: "transition",
    keyPoints: [
      "Smooth transition from acceleration to upright",
      "Maintain ground contact efficiency",
      "Increase stride length naturally",
      "Relaxed upper body",
    ],
    commonErrors: [
      "Abrupt posture change",
      "Loss of ground contact force",
      "Tension in shoulders/neck",
      "Inconsistent stride pattern",
    ],
    drills: ["Wicket runs", "Gradual build-up sprints", "Tempo runs at 85%"],
    flagFootballSpecific:
      "The transition zone (10-20m) is where many athletes lose speed. Smooth transitions are key for route running.",
  },
  {
    phase: "max_velocity",
    keyPoints: [
      "Upright posture",
      "High knee lift (thigh parallel to ground)",
      "Active foot strike (dorsiflexed ankle)",
      "Relaxed face and shoulders",
    ],
    commonErrors: [
      "Overstriding",
      "Heel striking",
      "Excessive upper body rotation",
      "Tense facial muscles",
    ],
    drills: ["Flying sprints", "Wicket runs at speed", "In-and-out sprints"],
    flagFootballSpecific:
      "Max velocity is reached on long routes and breakaway plays. While less common, it's the difference between a catch and a touchdown.",
  },
  {
    phase: "deceleration",
    keyPoints: [
      "Lower center of mass",
      "Shorter, quicker steps",
      "Active braking with quads",
      "Maintain balance and control",
    ],
    commonErrors: [
      "Staying too upright",
      "Long braking steps",
      "Passive deceleration",
      "Loss of balance",
    ],
    drills: [
      "Sprint-stop drills",
      "Eccentric squats",
      "Drop landings",
      "Reactive deceleration drills",
    ],
    flagFootballSpecific:
      "CRITICAL for flag football. Every cut, route break, and defensive reaction requires controlled deceleration. Poor deceleration = injury risk.",
  },
];

// ============================================================================
// PHASE-SPECIFIC GUIDELINES
// ============================================================================

export const PHASE_GUIDELINES: Record<string, SprintPhaseGuidelines> = {
  foundation: {
    phase: "Foundation (December)",
    weeklySprintVolume: [15, 25],
    accelerationWork: true,
    maxVelocityWork: false,
    speedEnduranceWork: false,
    resistedSprints: false,
    flyingSprints: false,
    hillSprints: true,
    recommendedProtocols: ["short_acceleration", "deceleration_training"],
    avoidProtocols: [
      "flying_sprints",
      "speed_endurance",
      "repeated_sprint_ability",
    ],
    recoveryConsiderations: [
      "Focus on movement quality over intensity",
      "48-72 hours between sprint sessions",
      "Prioritize technique development",
    ],
  },
  strength_accumulation: {
    phase: "Strength Accumulation (January)",
    weeklySprintVolume: [20, 30],
    accelerationWork: true,
    maxVelocityWork: false,
    speedEnduranceWork: false,
    resistedSprints: true,
    flyingSprints: false,
    hillSprints: true,
    recommendedProtocols: [
      "short_acceleration",
      "resisted_acceleration",
      "deceleration_training",
    ],
    avoidProtocols: ["flying_sprints", "speed_endurance"],
    recoveryConsiderations: [
      "Heavy strength work may impact sprint quality",
      "Schedule sprints before strength sessions",
      "72 hours between high-intensity sprint sessions",
    ],
  },
  power_development: {
    phase: "Power Development (February)",
    weeklySprintVolume: [25, 35],
    accelerationWork: true,
    maxVelocityWork: true,
    speedEnduranceWork: false,
    resistedSprints: true,
    flyingSprints: true,
    hillSprints: false,
    recommendedProtocols: [
      "short_acceleration",
      "resisted_acceleration",
      "flying_sprints",
    ],
    avoidProtocols: ["speed_endurance"],
    recoveryConsiderations: [
      "CNS demands are high - monitor fatigue",
      "Quality over quantity",
      "48-72 hours between max effort sessions",
    ],
  },
  speed_development: {
    phase: "Speed Development (March)",
    weeklySprintVolume: [30, 45],
    accelerationWork: true,
    maxVelocityWork: true,
    speedEnduranceWork: true,
    resistedSprints: false,
    flyingSprints: true,
    hillSprints: false,
    recommendedProtocols: [
      "short_acceleration",
      "flying_sprints",
      "in_and_out_sprints",
      "repeated_sprint_ability",
    ],
    avoidProtocols: ["resisted_acceleration"],
    recoveryConsiderations: [
      "Peak sprint volume - monitor closely",
      "Prioritize sleep (8+ hours)",
      "Nutrition optimization critical",
    ],
  },
  competition: {
    phase: "Competition Season (April-June)",
    weeklySprintVolume: [15, 25],
    accelerationWork: true,
    maxVelocityWork: false,
    speedEnduranceWork: false,
    resistedSprints: false,
    flyingSprints: false,
    hillSprints: false,
    recommendedProtocols: ["short_acceleration", "deceleration_training"],
    avoidProtocols: ["speed_endurance", "repeated_sprint_ability"],
    recoveryConsiderations: [
      "Games provide sprint stimulus",
      "Focus on maintenance, not development",
      "48-72 hours between games and sprint training",
    ],
  },
  mid_season_reload: {
    phase: "Mid-Season Reload (July)",
    weeklySprintVolume: [30, 45],
    accelerationWork: true,
    maxVelocityWork: true,
    speedEnduranceWork: true,
    resistedSprints: true,
    flyingSprints: true,
    hillSprints: true,
    stairSprints: true, // ACWR >= 0.8 required - athletes should be well-conditioned by this phase
    recommendedProtocols: [
      "short_acceleration",
      "resisted_acceleration",
      "flying_sprints",
      "speed_endurance",
      "stair_sprints",
    ],
    avoidProtocols: [],
    recoveryConsiderations: [
      "This is your 'extra layer' building phase",
      "Higher volume to build reserve for second half of season",
      "Address any speed deficits from competition phase",
      "Monitor fatigue closely - don't overtrain",
      "Stair sprints only if ACWR >= 0.8 and athlete is well-conditioned",
    ],
  },
  peak: {
    phase: "Peak Phase (August)",
    weeklySprintVolume: [20, 30],
    accelerationWork: true,
    maxVelocityWork: true,
    speedEnduranceWork: false,
    resistedSprints: false,
    flyingSprints: true,
    hillSprints: false,
    recommendedProtocols: ["short_acceleration", "flying_sprints"],
    avoidProtocols: [
      "speed_endurance",
      "repeated_sprint_ability",
      "resisted_acceleration",
    ],
    recoveryConsiderations: [
      "Reduce volume 40-60%, maintain intensity",
      "Sharpness and explosiveness focus",
      "Taper 2 weeks before major competition",
    ],
  },
};

// ============================================================================
// SERVICE
// ============================================================================

