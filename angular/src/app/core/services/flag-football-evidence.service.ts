/**
 * Flag Football Specific Evidence Base Service
 *
 * SPECIALIZED RESEARCH DATABASE FOR FLAG FOOTBALL ATHLETES
 *
 * This service contains evidence specifically relevant to flag football,
 * including position-specific research, tournament fatigue management,
 * and unique demands of the sport.
 *
 * @author FlagFit Pro Team
 * @version 1.0.0
 * @lastUpdated December 2024
 */

import { Injectable } from "@angular/core";

// ============================================================================
// INTERFACES
// ============================================================================

export interface PositionDemandProfile {
  position: FlagFootballPosition;
  primaryPhysicalDemands: string[];
  sprintCharacteristics: SprintCharacteristics;
  injuryRiskFactors: string[];
  keyBenchmarks: PositionBenchmark[];
  trainingPriorities: TrainingPriority[];
  evidenceReferences: string[];
}

export type FlagFootballPosition =
  | "QB"
  | "WR"
  | "Center"
  | "DB"
  | "Rusher"
  | "LB"
  | "Hybrid";

export interface SprintCharacteristics {
  dominantPattern: "linear" | "lateral" | "backpedal" | "multi_directional";
  typicalDistance: string;
  repetitionsPerGame: number;
  recoveryBetweenSprints: string;
  keyMovements: string[];
}

export interface PositionBenchmark {
  metric: string;
  elite: string;
  good: string;
  average: string;
  unit: string;
}

export interface TrainingPriority {
  priority: number;
  focus: string;
  weeklyVolume: string;
  keyExercises: string[];
  evidenceBasis: string;
}

export interface TournamentFatigueProtocol {
  scenario: string;
  gamesPerDay: number;
  totalGames: number;
  durationDays: number;
  fatigueManagement: FatigueStrategy[];
  recoveryProtocol: RecoveryProtocol;
  nutritionGuidelines: NutritionGuideline[];
  sleepRecommendations: SleepRecommendation[];
}

export interface FatigueStrategy {
  timing: string;
  strategy: string;
  rationale: string;
}

export interface RecoveryProtocol {
  betweenGames: string[];
  endOfDay: string[];
  postTournament: string[];
}

export interface NutritionGuideline {
  timing: string;
  recommendation: string;
  rationale: string;
}

export interface SleepRecommendation {
  phase: string;
  target: string;
  strategies: string[];
}

export interface ThrowingLoadResearch {
  study: string;
  population: string;
  keyFindings: string[];
  applicationToFlagFootball: string[];
}

export interface MovementPatternEvidence {
  pattern: string;
  muscleGroups: MuscleGroupRequirement[];
  injuryRiskAreas: string[];
  preventionProtocol: string[];
  references: string[];
}

export interface MuscleGroupRequirement {
  muscle: string;
  function: string;
  trainingRecommendation: string;
  benchmarkTest: string;
}

// ============================================================================
// FLAG FOOTBALL POSITION PROFILES
// ============================================================================

const POSITION_DEMAND_PROFILES: PositionDemandProfile[] = [
  {
    position: "QB",
    primaryPhysicalDemands: [
      "Throwing endurance (200-400 throws per tournament)",
      "Scrambling ability (reactive, multi-directional)",
      "Route running (in double-QB schemes)",
      "Catching ability (increasingly required)",
      "Reactive readiness (constant threat of rush)",
      "Core stability for throwing accuracy",
      "Hip mobility for throwing mechanics",
      "Shoulder durability for high volume",
    ],
    sprintCharacteristics: {
      dominantPattern: "multi_directional",
      typicalDistance: "5-15 yards",
      repetitionsPerGame: 15 - 25,
      recoveryBetweenSprints: "Variable (play-dependent)",
      keyMovements: [
        "Scramble (reactive escape)",
        "Rollout (planned movement)",
        "Bootleg (misdirection)",
        "Route running (double-QB)",
        "Backpedal (reading defense)",
      ],
    },
    injuryRiskFactors: [
      "Shoulder overuse (rotator cuff, labrum)",
      "Elbow UCL strain (throwing volume)",
      "Hip flexor strain (scrambling)",
      "Ankle sprains (reactive cuts)",
      "Lower back (rotational stress)",
    ],
    keyBenchmarks: [
      { metric: "Pro Agility", elite: "<4.0s", good: "4.0-4.2s", average: "4.2-4.5s", unit: "seconds" },
      { metric: "5-10-5 Shuttle", elite: "<4.3s", good: "4.3-4.5s", average: "4.5-4.8s", unit: "seconds" },
      { metric: "Throwing Accuracy", elite: ">75%", good: "65-75%", average: "55-65%", unit: "completion %" },
      { metric: "Scramble Speed", elite: ">15 mph", good: "13-15 mph", average: "11-13 mph", unit: "mph" },
    ],
    trainingPriorities: [
      {
        priority: 1,
        focus: "Shoulder durability & arm care",
        weeklyVolume: "Daily prehab + 2x strength",
        keyExercises: ["Band pull-aparts", "External rotation", "Prone Y-T-W", "Sleeper stretch"],
        evidenceBasis: "MLB pitcher arm care research (Reinold et al., 2018)",
      },
      {
        priority: 2,
        focus: "Core & hip stability",
        weeklyVolume: "3-4x per week",
        keyExercises: ["Pallof press", "Anti-rotation holds", "Hip 90/90", "Dead bugs"],
        evidenceBasis: "Core stability for throwing (Kibler et al., 2006)",
      },
      {
        priority: 3,
        focus: "Reactive agility",
        weeklyVolume: "2x per week",
        keyExercises: ["Mirror drills", "Scramble reactions", "Cone escapes", "Random direction sprints"],
        evidenceBasis: "Reactive agility research (Sheppard & Young, 2006)",
      },
      {
        priority: 4,
        focus: "Throwing on the run",
        weeklyVolume: "2-3x per week",
        keyExercises: ["Rollout throws", "Bootleg throws", "Moving target practice", "Scramble + throw"],
        evidenceBasis: "QB-specific movement patterns",
      },
    ],
    evidenceReferences: [
      "Reinold et al. (2018) - Shoulder injury prevention in throwers",
      "Kibler et al. (2006) - Core stability in throwing athletes",
      "Fleisig et al. (2011) - Biomechanics of throwing",
    ],
  },
  {
    position: "WR",
    primaryPhysicalDemands: [
      "Explosive acceleration (0-10 yards)",
      "Top-end speed (40-yard capability)",
      "Route running precision",
      "Deceleration & cutting",
      "Vertical jump (contested catches)",
      "Hand-eye coordination",
      "Repeated sprint ability (8+ sprints per game)",
    ],
    sprintCharacteristics: {
      dominantPattern: "linear",
      typicalDistance: "10-40 yards",
      repetitionsPerGame: 25 - 40,
      recoveryBetweenSprints: "20-45 seconds (huddle time)",
      keyMovements: [
        "Straight-line sprints",
        "Sharp cuts (in/out routes)",
        "Speed cuts (post/corner)",
        "Deceleration (comeback routes)",
        "Acceleration from stance",
      ],
    },
    injuryRiskFactors: [
      "Hamstring strain (high-speed running)",
      "Ankle sprains (cutting)",
      "Hip flexor strain (acceleration)",
      "Groin strain (lateral cuts)",
      "Knee injuries (deceleration)",
    ],
    keyBenchmarks: [
      { metric: "40-yard dash", elite: "<4.5s", good: "4.5-4.7s", average: "4.7-5.0s", unit: "seconds" },
      { metric: "10-yard split", elite: "<1.5s", good: "1.5-1.6s", average: "1.6-1.8s", unit: "seconds" },
      { metric: "Vertical Jump", elite: ">36\"", good: "32-36\"", average: "28-32\"", unit: "inches" },
      { metric: "Pro Agility", elite: "<4.1s", good: "4.1-4.3s", average: "4.3-4.6s", unit: "seconds" },
    ],
    trainingPriorities: [
      {
        priority: 1,
        focus: "Acceleration & first step",
        weeklyVolume: "2-3x per week, 15-25 sprints total",
        keyExercises: ["10-yard sprints", "Sled sprints (10-15% BW)", "Falling starts", "Block starts"],
        evidenceBasis: "Clark et al. (2019) - Acceleration in football",
      },
      {
        priority: 2,
        focus: "Hamstring injury prevention",
        weeklyVolume: "3x per week",
        keyExercises: ["Nordic curls", "Romanian deadlifts", "Hip thrusts", "Single-leg deadlifts"],
        evidenceBasis: "Al Attar et al. (2017) - 51% injury reduction",
      },
      {
        priority: 3,
        focus: "Repeated sprint ability",
        weeklyVolume: "1-2x per week",
        keyExercises: ["8x40 yard sprints (30s rest)", "Shuttle repeats", "Game-simulation sprints"],
        evidenceBasis: "Buchheit et al. (2010) - RSA in team sports",
      },
      {
        priority: 4,
        focus: "Route running technique",
        weeklyVolume: "3-4x per week",
        keyExercises: ["Cone drills", "Route trees", "Release drills", "Deceleration practice"],
        evidenceBasis: "Sport-specific skill development",
      },
    ],
    evidenceReferences: [
      "Clark et al. (2019) - NFL 40-yard dash analysis",
      "Al Attar et al. (2017) - Hamstring injury prevention",
      "Buchheit et al. (2010) - Repeated sprint ability",
    ],
  },
  {
    position: "Center",
    primaryPhysicalDemands: [
      "Explosive acceleration (same as WR)",
      "Top-end speed (40-yard capability)",
      "Route running from center position",
      "Quick snap + release",
      "Repeated sprint ability",
      "Hand-eye coordination",
    ],
    sprintCharacteristics: {
      dominantPattern: "linear",
      typicalDistance: "10-40 yards",
      repetitionsPerGame: 25 - 40,
      recoveryBetweenSprints: "20-45 seconds",
      keyMovements: [
        "Snap + sprint release",
        "Straight-line routes",
        "Short-area quickness",
        "Deceleration for catches",
      ],
    },
    injuryRiskFactors: [
      "Hamstring strain (same as WR)",
      "Lower back (snapping motion)",
      "Hip flexor strain",
      "Ankle sprains",
    ],
    keyBenchmarks: [
      { metric: "40-yard dash", elite: "<4.6s", good: "4.6-4.8s", average: "4.8-5.1s", unit: "seconds" },
      { metric: "10-yard split", elite: "<1.55s", good: "1.55-1.7s", average: "1.7-1.85s", unit: "seconds" },
      { metric: "Snap accuracy", elite: ">98%", good: "95-98%", average: "90-95%", unit: "percentage" },
    ],
    trainingPriorities: [
      {
        priority: 1,
        focus: "Acceleration from snap",
        weeklyVolume: "2-3x per week",
        keyExercises: ["Snap + sprint drills", "Stance starts", "First-step explosiveness"],
        evidenceBasis: "Position-specific acceleration demands",
      },
      {
        priority: 2,
        focus: "Hamstring & hip flexor strength",
        weeklyVolume: "3x per week",
        keyExercises: ["Nordic curls", "Hip flexor strengthening", "Single-leg work"],
        evidenceBasis: "Al Attar et al. (2017) - Hamstring prevention",
      },
      {
        priority: 3,
        focus: "Lower back stability",
        weeklyVolume: "Daily",
        keyExercises: ["McGill Big 3", "Bird dogs", "Dead bugs", "Pallof press"],
        evidenceBasis: "McGill (2015) - Spine stability",
      },
    ],
    evidenceReferences: [
      "Al Attar et al. (2017) - Hamstring injury prevention",
      "McGill (2015) - Low back disorders",
    ],
  },
  {
    position: "DB",
    primaryPhysicalDemands: [
      "Backpedal speed & technique",
      "Hip turn & transition",
      "Lateral movement (zone coverage)",
      "Reactive agility (man coverage)",
      "Ball tracking & awareness",
      "Closing speed",
      "Repeated sprint ability",
    ],
    sprintCharacteristics: {
      dominantPattern: "backpedal",
      typicalDistance: "5-20 yards (varied directions)",
      repetitionsPerGame: 30 - 50,
      recoveryBetweenSprints: "15-30 seconds",
      keyMovements: [
        "Backpedal (zone read)",
        "Hip turn (man coverage)",
        "Lateral shuffle (zone)",
        "Break on ball (reactive)",
        "Closing sprint (tackle)",
      ],
    },
    injuryRiskFactors: [
      "Groin strain (lateral movement)",
      "Hip flexor strain (backpedal)",
      "Hamstring strain (hip turn + sprint)",
      "Ankle sprains (reactive cuts)",
      "Knee injuries (lateral stress)",
    ],
    keyBenchmarks: [
      { metric: "Pro Agility", elite: "<4.0s", good: "4.0-4.2s", average: "4.2-4.5s", unit: "seconds" },
      { metric: "3-Cone Drill", elite: "<6.8s", good: "6.8-7.2s", average: "7.2-7.6s", unit: "seconds" },
      { metric: "Backpedal 10yd", elite: "<2.0s", good: "2.0-2.2s", average: "2.2-2.5s", unit: "seconds" },
      { metric: "40-yard dash", elite: "<4.5s", good: "4.5-4.7s", average: "4.7-5.0s", unit: "seconds" },
    ],
    trainingPriorities: [
      {
        priority: 1,
        focus: "Backpedal mechanics & speed",
        weeklyVolume: "3-4x per week",
        keyExercises: ["Backpedal drills", "Hip turn transitions", "Pedal + break", "Mirror drills"],
        evidenceBasis: "Position-specific movement patterns",
      },
      {
        priority: 2,
        focus: "Groin & hip strength",
        weeklyVolume: "3x per week",
        keyExercises: ["Copenhagen adductors", "Lateral lunges", "Hip 90/90", "Side planks"],
        evidenceBasis: "Harøy et al. (2019) - 41% groin injury reduction",
      },
      {
        priority: 3,
        focus: "Reactive agility",
        weeklyVolume: "2-3x per week",
        keyExercises: ["Ball tracking drills", "WR vs DB drills", "Random direction sprints"],
        evidenceBasis: "Sheppard & Young (2006) - Reactive agility",
      },
      {
        priority: 4,
        focus: "Lateral movement capacity",
        weeklyVolume: "2x per week",
        keyExercises: ["Lateral shuffles", "Carioca", "Crossover runs", "Zone drops"],
        evidenceBasis: "Brughelli et al. (2008) - COD ability",
      },
    ],
    evidenceReferences: [
      "Harøy et al. (2019) - Groin injury prevention",
      "Sheppard & Young (2006) - Agility in sport",
      "Brughelli et al. (2008) - Change of direction",
    ],
  },
  {
    position: "Rusher",
    primaryPhysicalDemands: [
      "Explosive first step",
      "Short-area quickness",
      "Change of direction (rush moves)",
      "Closing speed on QB",
      "Repeated sprint ability",
      "Reactive readiness (QB scramble)",
    ],
    sprintCharacteristics: {
      dominantPattern: "multi_directional",
      typicalDistance: "5-15 yards",
      repetitionsPerGame: 20 - 35,
      recoveryBetweenSprints: "20-40 seconds",
      keyMovements: [
        "Explosive start (rush)",
        "Speed-to-power (closing)",
        "Lateral cuts (rush moves)",
        "Pursuit angles",
        "Reactive direction change",
      ],
    },
    injuryRiskFactors: [
      "Ankle sprains (quick cuts)",
      "Hip flexor strain (explosive starts)",
      "Groin strain (lateral movement)",
      "Hamstring strain (acceleration)",
    ],
    keyBenchmarks: [
      { metric: "5-yard split", elite: "<1.0s", good: "1.0-1.1s", average: "1.1-1.2s", unit: "seconds" },
      { metric: "Pro Agility", elite: "<4.1s", good: "4.1-4.3s", average: "4.3-4.6s", unit: "seconds" },
      { metric: "10-yard dash", elite: "<1.55s", good: "1.55-1.65s", average: "1.65-1.8s", unit: "seconds" },
    ],
    trainingPriorities: [
      {
        priority: 1,
        focus: "First-step explosiveness",
        weeklyVolume: "2-3x per week",
        keyExercises: ["Stance starts", "5-yard bursts", "Reactive starts", "Power position holds"],
        evidenceBasis: "Clark et al. (2019) - Acceleration importance",
      },
      {
        priority: 2,
        focus: "Short-area quickness",
        weeklyVolume: "2-3x per week",
        keyExercises: ["5-10-5 shuttle", "Rush move drills", "Cone weaves", "Mirror drills"],
        evidenceBasis: "Sheppard & Young (2006) - Agility training",
      },
      {
        priority: 3,
        focus: "Ankle & hip stability",
        weeklyVolume: "3x per week",
        keyExercises: ["Single-leg balance", "Copenhagen adductors", "Ankle strengthening"],
        evidenceBasis: "Lauersen et al. (2014) - Injury prevention",
      },
    ],
    evidenceReferences: [
      "Clark et al. (2019) - Acceleration in football",
      "Sheppard & Young (2006) - Agility",
      "Lauersen et al. (2014) - Exercise injury prevention",
    ],
  },
  {
    position: "Hybrid",
    primaryPhysicalDemands: [
      "Versatility (all movement patterns)",
      "Endurance (plays both ways)",
      "Reactive readiness",
      "Quick position transitions",
      "Mental processing speed",
    ],
    sprintCharacteristics: {
      dominantPattern: "multi_directional",
      typicalDistance: "5-40 yards (all distances)",
      repetitionsPerGame: 40 - 60,
      recoveryBetweenSprints: "Variable",
      keyMovements: [
        "All patterns from other positions",
        "Quick transitions offense-defense",
        "Sustained effort across games",
      ],
    },
    injuryRiskFactors: [
      "Overuse (high volume)",
      "All injury risks from multiple positions",
      "Fatigue-related injuries",
    ],
    keyBenchmarks: [
      { metric: "40-yard dash", elite: "<4.6s", good: "4.6-4.8s", average: "4.8-5.1s", unit: "seconds" },
      { metric: "Pro Agility", elite: "<4.1s", good: "4.1-4.3s", average: "4.3-4.6s", unit: "seconds" },
      { metric: "Repeated Sprint Test", elite: ">95% maintenance", good: "90-95%", average: "85-90%", unit: "% of best" },
    ],
    trainingPriorities: [
      {
        priority: 1,
        focus: "Work capacity & endurance",
        weeklyVolume: "3-4x per week",
        keyExercises: ["Repeated sprint training", "Tempo runs", "Circuit training", "Game simulation"],
        evidenceBasis: "Buchheit et al. (2010) - RSA in team sports",
      },
      {
        priority: 2,
        focus: "Comprehensive injury prevention",
        weeklyVolume: "Daily prehab",
        keyExercises: ["Nordic curls", "Copenhagen", "Ankle work", "Hip mobility"],
        evidenceBasis: "Lauersen et al. (2014) - Comprehensive prevention",
      },
      {
        priority: 3,
        focus: "Recovery optimization",
        weeklyVolume: "Daily focus",
        keyExercises: ["Sleep optimization", "Nutrition timing", "Active recovery", "Mobility work"],
        evidenceBasis: "Kellmann et al. (2018) - Recovery consensus",
      },
    ],
    evidenceReferences: [
      "Buchheit et al. (2010) - Repeated sprint ability",
      "Lauersen et al. (2014) - Exercise injury prevention",
      "Kellmann et al. (2018) - Recovery consensus",
    ],
  },
];

// ============================================================================
// TOURNAMENT FATIGUE PROTOCOLS
// ============================================================================

const TOURNAMENT_FATIGUE_PROTOCOLS: TournamentFatigueProtocol[] = [
  {
    scenario: "Weekend Tournament (Standard)",
    gamesPerDay: 3 - 4,
    totalGames: 6 - 8,
    durationDays: 2,
    fatigueManagement: [
      {
        timing: "Pre-tournament (1 week)",
        strategy: "Taper volume 40-50%, maintain intensity",
        rationale: "Mujika & Padilla (2003) - Optimal tapering",
      },
      {
        timing: "Between games (30-60 min)",
        strategy: "Light movement, hydration, carbs, shade/cooling",
        rationale: "Prevent stiffness, maintain glycogen, manage heat",
      },
      {
        timing: "Evening Day 1",
        strategy: "Light meal, hydration, early sleep (9+ hours)",
        rationale: "Mah et al. (2011) - Sleep extension benefits",
      },
      {
        timing: "Day 2 morning",
        strategy: "Extended warm-up, activation drills, mental prep",
        rationale: "Compensate for accumulated fatigue",
      },
    ],
    recoveryProtocol: {
      betweenGames: [
        "Walk 5-10 min to prevent stiffness",
        "Hydrate with electrolytes",
        "Consume 30-60g carbs",
        "Stay in shade/cool area",
        "Light dynamic stretching",
      ],
      endOfDay: [
        "Cool down walk 10-15 min",
        "Static stretching (major muscle groups)",
        "Foam rolling if available",
        "Large meal with protein + carbs",
        "Sleep 9+ hours",
      ],
      postTournament: [
        "Day 1: Complete rest or light walk only",
        "Day 2: Light movement, swimming, cycling",
        "Day 3: Low-intensity training (50% normal)",
        "Day 4: Moderate training (70% normal)",
        "Day 5+: Return to normal training",
      ],
    },
    nutritionGuidelines: [
      {
        timing: "Pre-tournament dinner",
        recommendation: "High-carb meal (3-4g/kg carbs)",
        rationale: "Maximize glycogen stores",
      },
      {
        timing: "Tournament morning",
        recommendation: "Familiar breakfast 2-3 hours before first game",
        rationale: "Avoid GI distress, adequate digestion time",
      },
      {
        timing: "Between games",
        recommendation: "30-60g carbs + electrolytes per hour",
        rationale: "Maintain blood glucose, replace sweat losses",
      },
      {
        timing: "Post-tournament",
        recommendation: "High protein (1.6-2.0g/kg/day) for 2-3 days",
        rationale: "Support muscle repair",
      },
    ],
    sleepRecommendations: [
      {
        phase: "Week before",
        target: "8-9 hours nightly",
        strategies: ["Consistent bed time", "Sleep banking", "No alcohol"],
      },
      {
        phase: "Tournament nights",
        target: "9+ hours",
        strategies: ["Early to bed", "Dark room", "No screens", "Relaxation routine"],
      },
      {
        phase: "Post-tournament",
        target: "9-10 hours for 2-3 nights",
        strategies: ["Sleep extension", "Naps if needed", "Recover sleep debt"],
      },
    ],
  },
  {
    scenario: "Major Tournament (3-day)",
    gamesPerDay: 2 - 3,
    totalGames: 8 - 10,
    durationDays: 3,
    fatigueManagement: [
      {
        timing: "Pre-tournament (2 weeks)",
        strategy: "Week 1: Normal training, Week 2: Taper 50%",
        rationale: "Extended taper for major event",
      },
      {
        timing: "Day 2 adjustment",
        strategy: "Extended warm-up (25-30 min), activation focus",
        rationale: "Combat cumulative fatigue",
      },
      {
        timing: "Day 3 (finals)",
        strategy: "Minimal warm-up volume, maximum activation, mental focus",
        rationale: "Preserve energy for peak performance",
      },
    ],
    recoveryProtocol: {
      betweenGames: [
        "Active recovery walk",
        "Compression if available",
        "Frequent small nutrition doses",
        "Mental recovery (quiet time)",
      ],
      endOfDay: [
        "Comprehensive cool-down",
        "Protein + carb meal within 30 min",
        "Ice bath or cold shower if available",
        "Mobility work",
        "Early sleep",
      ],
      postTournament: [
        "Days 1-2: Complete rest",
        "Days 3-4: Light activity only",
        "Days 5-6: Low intensity (50%)",
        "Day 7+: Gradual return to normal",
      ],
    },
    nutritionGuidelines: [
      {
        timing: "Throughout tournament",
        recommendation: "8-12g/kg/day carbohydrates",
        rationale: "High carb needs for repeated high-intensity",
      },
      {
        timing: "Between games",
        recommendation: "Liquid carbs preferred (sports drinks, gels)",
        rationale: "Faster absorption, easier digestion",
      },
      {
        timing: "Evening meals",
        recommendation: "Mixed meals with protein, carbs, vegetables",
        rationale: "Complete recovery nutrition",
      },
    ],
    sleepRecommendations: [
      {
        phase: "All tournament nights",
        target: "9+ hours minimum",
        strategies: [
          "Prioritize sleep over social activities",
          "Create optimal sleep environment",
          "Consistent routine each night",
        ],
      },
    ],
  },
];

// ============================================================================
// QB THROWING LOAD RESEARCH
// ============================================================================

const THROWING_LOAD_RESEARCH: ThrowingLoadResearch[] = [
  {
    study: "Fleisig et al. (2011) - Risk of serious injury for young baseball pitchers",
    population: "Young baseball pitchers",
    keyFindings: [
      "Pitchers throwing >100 innings/year have 3.5x injury risk",
      "Pitch counts should be monitored",
      "Rest days between high-volume days are critical",
      "Year-round throwing increases injury risk",
    ],
    applicationToFlagFootball: [
      "Monitor total throws per tournament",
      "Flag QBs throw 200-400 balls in 2-3 days (extreme volume)",
      "Rest days between tournaments are essential",
      "Off-season arm rest is critical",
    ],
  },
  {
    study: "Lyman et al. (2002) - Pitch type and risk of elbow/shoulder pain",
    population: "Youth baseball pitchers",
    keyFindings: [
      "Curveballs increase elbow pain risk",
      "Pitch count is the strongest predictor of arm pain",
      "Fatigue increases injury risk significantly",
      "Rest between appearances is protective",
    ],
    applicationToFlagFootball: [
      "Spiral throws are generally safer than baseball pitches",
      "Total throw count still matters",
      "QB fatigue in late games increases risk",
      "Rotate QBs if possible in tournaments",
    ],
  },
  {
    study: "Reinold et al. (2018) - Shoulder injury prevention in throwers",
    population: "Overhead athletes (baseball, volleyball)",
    keyFindings: [
      "Posterior shoulder tightness increases injury risk",
      "Sleeper stretch reduces posterior tightness",
      "External rotation strength is protective",
      "Scapular stability is essential",
    ],
    applicationToFlagFootball: [
      "Daily shoulder mobility work for QBs",
      "Sleeper stretch after every throwing session",
      "External rotation strengthening 3x/week",
      "Scapular exercises in warm-up",
    ],
  },
  {
    study: "Wilk et al. (2011) - Shoulder and elbow injuries in professional baseball pitchers",
    population: "Professional baseball pitchers",
    keyFindings: [
      "Decreased total rotation ROM increases injury risk",
      "Glenohumeral internal rotation deficit (GIRD) is a risk factor",
      "Strength ratios (ER/IR) should be maintained",
      "Workload management is the most important factor",
    ],
    applicationToFlagFootball: [
      "Screen QBs for GIRD regularly",
      "Maintain shoulder rotation balance",
      "Monitor throwing volume across season",
      "Reduce volume if pain develops",
    ],
  },
];

// ============================================================================
// MOVEMENT PATTERN EVIDENCE
// ============================================================================

const MOVEMENT_PATTERN_EVIDENCE: MovementPatternEvidence[] = [
  {
    pattern: "Acceleration (0-10 yards)",
    muscleGroups: [
      {
        muscle: "Gluteus Maximus",
        function: "Hip extension for forward propulsion",
        trainingRecommendation: "Hip thrusts, step-ups, sled pushes",
        benchmarkTest: "Hip thrust 1.5x bodyweight",
      },
      {
        muscle: "Quadriceps",
        function: "Knee extension during push-off",
        trainingRecommendation: "Squats, split squats, leg press",
        benchmarkTest: "Back squat 1.5-2.0x bodyweight",
      },
      {
        muscle: "Hip Flexors (Iliopsoas)",
        function: "Rapid leg recovery, stride frequency",
        trainingRecommendation: "Hip flexor marches, hanging knee raises, resisted hip flexion",
        benchmarkTest: "Hip flexor strength test (manual)",
      },
      {
        muscle: "Gastrocnemius/Soleus",
        function: "Ankle plantarflexion, ground contact",
        trainingRecommendation: "Calf raises, pogo jumps, ankle hops",
        benchmarkTest: "Single-leg calf raise 25+ reps",
      },
    ],
    injuryRiskAreas: ["Hamstring (late swing phase)", "Hip flexor (acceleration)", "Calf/Achilles"],
    preventionProtocol: [
      "Nordic curls 2-3x/week",
      "Hip flexor strengthening",
      "Calf/Achilles progressive loading",
      "Gradual sprint volume progression",
    ],
    references: [
      "Morin & Samozino (2016) - Force-velocity profiles",
      "Clark et al. (2019) - Acceleration importance",
    ],
  },
  {
    pattern: "Maximum Velocity Sprinting",
    muscleGroups: [
      {
        muscle: "Hamstrings",
        function: "Hip extension, knee flexion, deceleration of leg",
        trainingRecommendation: "Nordic curls, RDLs, hip thrusts",
        benchmarkTest: "Nordic curl full ROM",
      },
      {
        muscle: "Hip Flexors",
        function: "Rapid leg recovery (critical for stride frequency)",
        trainingRecommendation: "Resisted hip flexion, A-skips, high knees",
        benchmarkTest: "Hip flexor strength test",
      },
      {
        muscle: "Core (Anterior)",
        function: "Pelvic stability, force transfer",
        trainingRecommendation: "Dead bugs, ab wheel, hollow holds",
        benchmarkTest: "Hollow hold 60+ seconds",
      },
      {
        muscle: "Achilles/Soleus Complex",
        function: "Elastic energy storage and return",
        trainingRecommendation: "Pogo jumps, depth jumps, calf raises",
        benchmarkTest: "Reactive strength index >2.5",
      },
    ],
    injuryRiskAreas: ["Hamstring (most common)", "Hip flexor", "Achilles tendon"],
    preventionProtocol: [
      "Nordic curls (51% hamstring injury reduction)",
      "Progressive sprint exposure",
      "Adequate warm-up before max velocity",
      "Fatigue monitoring",
    ],
    references: [
      "Schache et al. (2012) - Hamstring mechanics",
      "Al Attar et al. (2017) - Nordic curl effectiveness",
    ],
  },
  {
    pattern: "Change of Direction / Cutting",
    muscleGroups: [
      {
        muscle: "Adductors",
        function: "Lateral stability, push-off in cuts",
        trainingRecommendation: "Copenhagen adductors, lateral lunges, side planks",
        benchmarkTest: "Copenhagen hold 30+ seconds",
      },
      {
        muscle: "Gluteus Medius",
        function: "Hip stability during single-leg stance",
        trainingRecommendation: "Side-lying hip abduction, monster walks, single-leg squats",
        benchmarkTest: "Single-leg squat with good form",
      },
      {
        muscle: "Quadriceps (Eccentric)",
        function: "Deceleration before cut",
        trainingRecommendation: "Eccentric squats, drop landings, deceleration drills",
        benchmarkTest: "Eccentric squat control",
      },
      {
        muscle: "Ankle Stabilizers",
        function: "Stability during rapid direction change",
        trainingRecommendation: "Single-leg balance, wobble board, ankle strengthening",
        benchmarkTest: "Single-leg balance 30+ seconds",
      },
    ],
    injuryRiskAreas: ["Groin/adductors", "ACL/knee", "Ankle sprains"],
    preventionProtocol: [
      "Copenhagen adductors (41% groin injury reduction)",
      "Single-leg strength training",
      "Deceleration technique training",
      "Ankle strengthening program",
    ],
    references: [
      "Harøy et al. (2019) - Copenhagen adductor effectiveness",
      "Brughelli et al. (2008) - COD ability",
    ],
  },
  {
    pattern: "Backpedal (DB-specific)",
    muscleGroups: [
      {
        muscle: "Hip Flexors",
        function: "Rapid backward leg movement",
        trainingRecommendation: "Resisted backpedals, hip flexor strengthening",
        benchmarkTest: "Backpedal speed test",
      },
      {
        muscle: "Gluteus Maximus",
        function: "Hip extension during push-back",
        trainingRecommendation: "Reverse lunges, hip thrusts",
        benchmarkTest: "Reverse lunge strength",
      },
      {
        muscle: "Core (Anti-rotation)",
        function: "Trunk stability during backward movement",
        trainingRecommendation: "Pallof press, anti-rotation holds",
        benchmarkTest: "Pallof press hold",
      },
      {
        muscle: "Hamstrings",
        function: "Hip turn transition",
        trainingRecommendation: "Nordic curls, RDLs",
        benchmarkTest: "Nordic curl competency",
      },
    ],
    injuryRiskAreas: ["Hip flexor strain", "Hamstring (during hip turn)", "Groin"],
    preventionProtocol: [
      "Hip flexor strengthening and mobility",
      "Gradual backpedal volume progression",
      "Hip turn technique training",
      "Groin strengthening (Copenhagen)",
    ],
    references: [
      "Position-specific research",
      "Harøy et al. (2019) - Groin prevention",
    ],
  },
  {
    pattern: "Throwing (QB-specific)",
    muscleGroups: [
      {
        muscle: "Rotator Cuff (External Rotators)",
        function: "Shoulder stability, deceleration of arm",
        trainingRecommendation: "External rotation exercises, band work",
        benchmarkTest: "ER/IR strength ratio 0.66-0.75",
      },
      {
        muscle: "Scapular Stabilizers",
        function: "Scapular control during throwing motion",
        trainingRecommendation: "Y-T-W, prone rows, wall slides",
        benchmarkTest: "Scapular dyskinesis screen",
      },
      {
        muscle: "Core (Rotational)",
        function: "Force transfer from lower to upper body",
        trainingRecommendation: "Med ball rotational throws, cable rotations",
        benchmarkTest: "Seated med ball throw distance",
      },
      {
        muscle: "Hip Internal Rotators",
        function: "Lead leg rotation during throw",
        trainingRecommendation: "Hip 90/90, internal rotation stretches",
        benchmarkTest: "Hip IR ROM 40+ degrees",
      },
    ],
    injuryRiskAreas: ["Shoulder (rotator cuff, labrum)", "Elbow (UCL)", "Lower back"],
    preventionProtocol: [
      "Daily arm care routine",
      "Throw count monitoring",
      "Posterior shoulder stretching",
      "Core and hip stability work",
    ],
    references: [
      "Reinold et al. (2018) - Arm care",
      "Wilk et al. (2011) - Shoulder injuries",
      "Fleisig et al. (2011) - Throwing load",
    ],
  },
];

// ============================================================================
// SERVICE
// ============================================================================

@Injectable({
  providedIn: "root",
})
export class FlagFootballEvidenceService {
  /**
   * Get all position demand profiles
   */
  getAllPositionProfiles(): PositionDemandProfile[] {
    return POSITION_DEMAND_PROFILES;
  }

  /**
   * Get position profile by position
   */
  getPositionProfile(position: FlagFootballPosition): PositionDemandProfile | undefined {
    return POSITION_DEMAND_PROFILES.find((p) => p.position === position);
  }

  /**
   * Get sprint characteristics for a position
   */
  getSprintCharacteristics(position: FlagFootballPosition): SprintCharacteristics | undefined {
    const profile = this.getPositionProfile(position);
    return profile?.sprintCharacteristics;
  }

  /**
   * Get training priorities for a position
   */
  getTrainingPriorities(position: FlagFootballPosition): TrainingPriority[] {
    const profile = this.getPositionProfile(position);
    return profile?.trainingPriorities || [];
  }

  /**
   * Get injury risk factors for a position
   */
  getInjuryRiskFactors(position: FlagFootballPosition): string[] {
    const profile = this.getPositionProfile(position);
    return profile?.injuryRiskFactors || [];
  }

  /**
   * Get benchmarks for a position
   */
  getPositionBenchmarks(position: FlagFootballPosition): PositionBenchmark[] {
    const profile = this.getPositionProfile(position);
    return profile?.keyBenchmarks || [];
  }

  /**
   * Get all tournament fatigue protocols
   */
  getTournamentProtocols(): TournamentFatigueProtocol[] {
    return TOURNAMENT_FATIGUE_PROTOCOLS;
  }

  /**
   * Get tournament protocol by scenario
   */
  getTournamentProtocol(scenario: string): TournamentFatigueProtocol | undefined {
    return TOURNAMENT_FATIGUE_PROTOCOLS.find((p) =>
      p.scenario.toLowerCase().includes(scenario.toLowerCase())
    );
  }

  /**
   * Get QB throwing load research
   */
  getThrowingLoadResearch(): ThrowingLoadResearch[] {
    return THROWING_LOAD_RESEARCH;
  }

  /**
   * Get all movement pattern evidence
   */
  getMovementPatternEvidence(): MovementPatternEvidence[] {
    return MOVEMENT_PATTERN_EVIDENCE;
  }

  /**
   * Get evidence for a specific movement pattern
   */
  getMovementEvidence(pattern: string): MovementPatternEvidence | undefined {
    return MOVEMENT_PATTERN_EVIDENCE.find((m) =>
      m.pattern.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * Get muscle requirements for a movement
   */
  getMuscleRequirements(pattern: string): MuscleGroupRequirement[] {
    const evidence = this.getMovementEvidence(pattern);
    return evidence?.muscleGroups || [];
  }

  /**
   * Get prevention protocol for a movement pattern
   */
  getPreventionProtocol(pattern: string): string[] {
    const evidence = this.getMovementEvidence(pattern);
    return evidence?.preventionProtocol || [];
  }

  /**
   * Compare two positions
   */
  comparePositions(
    position1: FlagFootballPosition,
    position2: FlagFootballPosition
  ): {
    similarities: string[];
    differences: string[];
  } {
    const profile1 = this.getPositionProfile(position1);
    const profile2 = this.getPositionProfile(position2);

    if (!profile1 || !profile2) {
      return { similarities: [], differences: [] };
    }

    const similarities: string[] = [];
    const differences: string[] = [];

    // Compare sprint patterns
    if (profile1.sprintCharacteristics.dominantPattern === profile2.sprintCharacteristics.dominantPattern) {
      similarities.push(`Both positions primarily use ${profile1.sprintCharacteristics.dominantPattern} movement`);
    } else {
      differences.push(
        `${position1} uses ${profile1.sprintCharacteristics.dominantPattern}, ${position2} uses ${profile2.sprintCharacteristics.dominantPattern}`
      );
    }

    // Compare sprint volume
    const vol1 = profile1.sprintCharacteristics.repetitionsPerGame;
    const vol2 = profile2.sprintCharacteristics.repetitionsPerGame;
    if (Math.abs(vol1 - vol2) < 10) {
      similarities.push(`Similar sprint volume per game (~${Math.round((vol1 + vol2) / 2)} reps)`);
    } else {
      differences.push(`${position1}: ${vol1} sprints/game vs ${position2}: ${vol2} sprints/game`);
    }

    // Compare injury risks
    const commonRisks = profile1.injuryRiskFactors.filter((r) =>
      profile2.injuryRiskFactors.some((r2) => r2.toLowerCase().includes(r.split(" ")[0].toLowerCase()))
    );
    if (commonRisks.length > 0) {
      similarities.push(`Shared injury risks: ${commonRisks.slice(0, 2).join(", ")}`);
    }

    return { similarities, differences };
  }

  /**
   * Get recommended weekly training split for a position
   */
  getWeeklyTrainingSplit(position: FlagFootballPosition): {
    day: string;
    focus: string;
    volume: string;
  }[] {
    const profile = this.getPositionProfile(position);
    if (!profile) return [];

    // Generate position-specific weekly split
    const baseSplit = [
      { day: "Monday", focus: "Speed/Power", volume: "High" },
      { day: "Tuesday", focus: "Strength", volume: "Moderate-High" },
      { day: "Wednesday", focus: "Recovery/Skills", volume: "Low" },
      { day: "Thursday", focus: "Agility/Position-Specific", volume: "Moderate" },
      { day: "Friday", focus: "Strength", volume: "Moderate" },
      { day: "Saturday", focus: "Game/Scrimmage", volume: "High" },
      { day: "Sunday", focus: "Rest/Active Recovery", volume: "Very Low" },
    ];

    // Adjust based on position
    if (position === "QB") {
      baseSplit[0].focus = "Arm Care + Speed";
      baseSplit[3].focus = "Throwing + Agility";
    } else if (position === "DB") {
      baseSplit[0].focus = "Backpedal + Speed";
      baseSplit[3].focus = "Coverage Drills + Agility";
    }

    return baseSplit;
  }

  /**
   * Get evidence-based recommendations for tournament preparation
   */
  getTournamentPrepRecommendations(daysUntilTournament: number): string[] {
    const recommendations: string[] = [];

    if (daysUntilTournament >= 14) {
      recommendations.push("Maintain normal training intensity and volume");
      recommendations.push("Focus on building fitness base");
      recommendations.push("Address any minor injuries or weaknesses");
    } else if (daysUntilTournament >= 7) {
      recommendations.push("Begin taper: reduce volume by 20-30%");
      recommendations.push("Maintain high intensity in shorter sessions");
      recommendations.push("Prioritize sleep (8-9 hours nightly)");
      recommendations.push("Increase carbohydrate intake slightly");
    } else if (daysUntilTournament >= 3) {
      recommendations.push("Full taper: reduce volume by 40-50%");
      recommendations.push("Short, sharp sessions only");
      recommendations.push("Focus on mental preparation");
      recommendations.push("Hydration focus - monitor urine color");
    } else {
      recommendations.push("Minimal training - activation only");
      recommendations.push("Prioritize rest and recovery");
      recommendations.push("Carb-load for glycogen stores");
      recommendations.push("Early to bed, maximize sleep");
      recommendations.push("Pack nutrition and hydration supplies");
    }

    return recommendations;
  }

  /**
   * Calculate estimated sprint volume for a position in a tournament
   */
  estimateTournamentSprintVolume(
    position: FlagFootballPosition,
    gamesExpected: number
  ): {
    totalSprints: number;
    linearSprints: number;
    lateralMovements: number;
    backpedals: number;
    recommendation: string;
  } {
    const profile = this.getPositionProfile(position);
    if (!profile) {
      return {
        totalSprints: 0,
        linearSprints: 0,
        lateralMovements: 0,
        backpedals: 0,
        recommendation: "Position not found",
      };
    }

    const sprintsPerGame = profile.sprintCharacteristics.repetitionsPerGame;
    const totalSprints = sprintsPerGame * gamesExpected;

    let linearSprints = 0;
    let lateralMovements = 0;
    let backpedals = 0;

    switch (profile.sprintCharacteristics.dominantPattern) {
      case "linear":
        linearSprints = Math.round(totalSprints * 0.7);
        lateralMovements = Math.round(totalSprints * 0.2);
        backpedals = Math.round(totalSprints * 0.1);
        break;
      case "backpedal":
        linearSprints = Math.round(totalSprints * 0.3);
        lateralMovements = Math.round(totalSprints * 0.3);
        backpedals = Math.round(totalSprints * 0.4);
        break;
      case "lateral":
        linearSprints = Math.round(totalSprints * 0.3);
        lateralMovements = Math.round(totalSprints * 0.5);
        backpedals = Math.round(totalSprints * 0.2);
        break;
      case "multi_directional":
        linearSprints = Math.round(totalSprints * 0.4);
        lateralMovements = Math.round(totalSprints * 0.35);
        backpedals = Math.round(totalSprints * 0.25);
        break;
    }

    let recommendation = "";
    if (totalSprints > 200) {
      recommendation = "High volume expected - ensure adequate pre-tournament taper and recovery between games";
    } else if (totalSprints > 100) {
      recommendation = "Moderate volume - standard tournament preparation should be sufficient";
    } else {
      recommendation = "Lower volume position - focus on position-specific skills and mental preparation";
    }

    return {
      totalSprints,
      linearSprints,
      lateralMovements,
      backpedals,
      recommendation,
    };
  }
}
