// Complete Quarterback Flag Football Training Program Data
// 14-Week Elite QB Development - Dual Track Approach
// November 17, 2025 - February 28, 2026

export const QB_TRAINING_PROGRAM = {
  programInfo: {
    title: "COMPLETE QUARTERBACK FLAG FOOTBALL TRAINING PROGRAM",
    subtitle: "14-WEEK ELITE QB DEVELOPMENT",
    duration: "14 Weeks",
    startDate: "2025-11-17",
    endDate: "2026-02-28",
    approach: "Dual-Track Training",
    challengeTarget: "320 throws in weekend tournament",
    frequency: "5-6 days/week",
    sessionDuration: "90-150 minutes",
    weeklyTime: "7-9 hours",
  },

  performanceRequirements: {
    tournamentChallenge: {
      description: "320 Throws in a Weekend",
      breakdown: {
        games: 8,
        throwsPerGame: 40,
        totalThrows: 320,
        gameSpacing: "2 hours apart",
        days: 2,
        demands: [
          "Sustained accuracy under extreme fatigue",
          "Maximum velocity maintained throughout",
          "Mental resilience for 8 games",
          "Recovery between games",
        ],
      },
    },

    evidenceBasedRequirements: {
      armStrength: {
        source: "Journal of Sports Sciences, 2019",
        findings: [
          "Rotator cuff strength correlates with velocity (r=0.72)",
          "Posterior deltoid = primary velocity generator",
          "Triceps contribute 23% of ball velocity",
          "Biceps provide deceleration control",
        ],
        implication: "Must train both acceleration AND deceleration",
      },

      hipFlexorIntegration: {
        source: "American Journal of Sports Medicine, 2020",
        findings: [
          "Hip flexor flexibility increases stride length 8-12%",
          "Tight hip flexors reduce velocity 15-20%",
          "Hip mobility affects trunk rotation efficiency",
          "Lead leg hip flexor strength improves weight transfer",
        ],
        implication: "Hip flexibility is NON-NEGOTIABLE for QBs",
      },

      shoulderMobility: {
        source: "Sports Health, 2018",
        requirements: {
          externalRotation: "110-130° (optimal release)",
          horizontalAbduction: "45-55° (proper arm slot)",
          scapularTilt: "20-25° (healthy mechanics)",
        },
        riskFactor: "Limited mobility increases injury risk by 340%",
        implication: "Daily mobility work is mandatory",
      },

      backStrengthIntegration: {
        source: "Journal of Strength & Conditioning, 2021",
        findings: [
          "Latissimus dorsi provides 18% of throwing power",
          "Thoracic extension adds 8-12 mph velocity",
          "Lower trap strength prevents scapular dyskinesis",
          "Rhomboid strength maintains posture under fatigue",
        ],
        implication: "Back training = throwing power",
      },

      fatigueResistance: {
        source: "Sports Medicine, 2019",
        criticalData: [
          "Accuracy decreases 23% after 30 consecutive throws",
          "Velocity drops 8-12% in final quarter without conditioning",
          "Shoulder endurance training improves late-game performance 15%",
          "Recovery requires 18-24 hours for full restoration",
        ],
        implication: "Endurance training is THE difference-maker",
      },
    },
  },

  dualTrackApproach: {
    description:
      "Lower body foundation + QB-specific upper body specialization",
    track1: {
      name: "Lower Body (Same as WR/DB Program)",
      focus: [
        "Sprint speed and acceleration",
        "Explosive power development",
        "Posterior chain strength",
        "Injury prevention",
        "Game conditioning",
      ],
    },
    track2: {
      name: "Upper Body (QB-Specific)",
      focus: [
        "Arm strength and velocity",
        "Shoulder mobility and health",
        "Throwing endurance",
        "Hip flexor flexibility (critical for throwing)",
        "Back strength for power generation",
      ],
    },
    weeklySchedule: {
      monday: "Lower body strength + QB arm strength",
      tuesday: "Sprint/bounds + QB shoulder mobility",
      wednesday: "Recovery + QB hip flexor/back work",
      thursday: "Lower power + QB throwing integration",
      friday: "Speed/RSA + QB endurance training",
      saturday: "Sprint work + QB throwing session",
      sunday: "Complete recovery (lower + upper body)",
    },
  },

  qbSpecificWarmup: {
    title: "Enhanced 30-Minute QB Prep (Every Session)",
    totalDuration: 30,
    phases: [
      {
        title: "Phase 1: General Activation",
        duration: 8,
        exercises: [
          { name: "Light jog", duration: "2 minutes" },
          { name: "Jump rope", duration: "2 minutes" },
          { name: "Arm circles (progressive)", duration: "2 minutes" },
          { name: "Dynamic stretching", duration: "2 minutes" },
        ],
      },
      {
        title: "Phase 2: Shoulder Complex Activation",
        duration: 12,
        sections: [
          {
            title: "Rotator Cuff Activation",
            duration: 4,
            exercises: [
              { name: "Band external rotation", sets: "2×15 each arm" },
              { name: "Band internal rotation", sets: "2×15 each arm" },
              { name: "Empty can raises", sets: "2×10 each arm" },
              { name: "Full can raises", sets: "2×10 each arm" },
            ],
          },
          {
            title: "Scapular Stabilization",
            duration: 4,
            exercises: [
              { name: "Wall slides", sets: "2×12" },
              { name: "Band pull-aparts", sets: "2×20" },
              { name: "Scapular push-ups", sets: "2×10" },
              { name: "Lower trap raises", sets: "2×12" },
            ],
          },
          {
            title: "Shoulder Mobility",
            duration: 4,
            exercises: [
              { name: "Cross-body stretch", sets: "2×30s each" },
              { name: "Sleeper stretch", sets: "2×30s each" },
              { name: "Posterior capsule stretch", sets: "2×30s each" },
              { name: "Doorway chest stretch", sets: "2×45s" },
            ],
          },
        ],
      },
      {
        title: "Phase 3: Throwing Chain Integration",
        duration: 10,
        sections: [
          {
            title: "Hip & Back Activation",
            duration: 5,
            exercises: [
              { name: "Hip flexor dynamic stretch", sets: "2×30s each leg" },
              { name: "World's greatest stretch", sets: "2×3 each side" },
              { name: "Thoracic rotation", sets: "2×10 each direction" },
              { name: "Cat-cow", sets: "2×12" },
              { name: "Lat activation", sets: "2×10 each arm" },
            ],
          },
          {
            title: "Throwing Motion Prep",
            duration: 5,
            exercises: [
              { name: "Shadow throwing (no ball)", sets: "2×10" },
              { name: "Step-through mechanics", sets: "2×8 each direction" },
              { name: "Trunk rotation with resistance", sets: "2×10 each way" },
              {
                name: "Progressive throwing motion",
                sets: "3 sets (increasing ROM)",
              },
            ],
          },
        ],
      },
    ],
  },

  phases: {
    foundation: {
      title: "Foundation Phase",
      weeks: "1-4",
      dateRange: "December 1-28, 2025",
      goals: [
        "Build lower body strength foundation",
        "Establish arm care protocols",
        "Develop shoulder mobility baseline",
        "Learn throwing mechanics",
        "Build throwing endurance base",
        "Optimize hip flexor flexibility",
      ],
      lowerBodyFocus: [
        "Build posterior chain strength (Nordic curls, RDLs, hip thrusts)",
        "Establish sprint mechanics (drill work 3-4x/week)",
        "Develop aerobic base (tempo work)",
        "Lower body chain health (comprehensive activation)",
        "Learn isometric positions (80-85% effort)",
      ],
      qbSpecificFocus: [
        "Rotator cuff foundation",
        "Shoulder mobility establishment",
        "Hip flexor flexibility baseline",
        "Throwing mechanics learning",
        "Volume progression (100-200 throws/week)",
      ],
    },

    strength: {
      title: "Strength Development",
      weeks: "5-8",
      dateRange: "January 5 - February 1, 2026",
      goals: [
        "Maximum lower body strength",
        "Peak arm strength for velocity",
        "Advanced throwing endurance (150+ throws)",
        "Competition mobility maintenance",
        "Power development emphasis",
      ],
      lowerBodyFocus: [
        "Maximum strength (heavy squats, deadlifts, isometrics)",
        "Increase sprint volume (if indoor space available)",
        "Power development (bounds, jumps)",
        "Repeated sprint introduction",
        "Isometrics at max effort (95-100%)",
      ],
      qbSpecificFocus: [
        "Maximum arm strengthening",
        "Velocity development training",
        "Throwing endurance (150+ throws)",
        "Advanced shoulder mobility",
        "Power integration",
      ],
    },

    power: {
      title: "Power Phase",
      weeks: "9-12",
      dateRange: "February 2-28, 2026",
      goals: [
        "Convert strength to explosive power",
        "Peak throwing velocity",
        "Game-specific conditioning (200+ throws)",
        "Competition preparation",
        "Outdoor transition begins (late phase)",
      ],
      lowerBodyFocus: [
        "Convert strength to explosive power",
        "Game-specific conditioning (RSA training)",
        "Reactive abilities (change of direction)",
        "Resisted/assisted sprints",
        "Complex training methods",
      ],
      qbSpecificFocus: [
        "Peak velocity development",
        "Tournament simulation (320 throws)",
        "Maximum throwing endurance",
        "Mental preparation",
        "Competition throwing patterns",
      ],
    },

    competition: {
      title: "Competition Prep",
      weeks: "13-14",
      dateRange: "March 2-15, 2026",
      goals: [
        "Maintain peak velocity",
        "Taper volume for freshness",
        "Outdoor throwing adaptation",
        "Mental preparation peak",
        "Competition confidence",
      ],
      lowerBodyFocus: [
        "Outdoor sprint transition",
        "Peak power maintenance",
        "Volume reduction (taper)",
        "Competition simulation",
        "Final preparation",
      ],
      qbSpecificFocus: [
        "Velocity maintenance with reduced volume",
        "Outdoor throwing adaptation",
        "Mental peak preparation",
        "Competition routine refinement",
        "Confidence building",
      ],
    },
  },

  throwingVolumeProgression: {
    description: "Progressive throwing volume by phase",
    week1: "80-120 throws",
    week4: "120-180 throws",
    week8: "350-450 throws",
    week12: "500-650 throws",
    week14: "320 throws (taper)",

    byPhase: {
      foundation: "100-200 throws/week",
      strength: "300-450 throws/week",
      power: "500-650 throws/week",
      competition: "200-400 throws/week",
    },

    sessionDistribution: {
      lowVolume: "20-40 throws (mechanics/recovery)",
      moderate: "50-100 throws (training)",
      high: "150-250 throws (endurance)",
      tournamentSim: "320 throws (competition prep)",
    },
  },
};

// QB-Specific Exercise Library
export const QB_EXERCISE_LIBRARY = {
  // Rotator Cuff Exercises
  "Band External Rotation": {
    category: "Rotator Cuff",
    primaryMuscles: ["External Rotators", "Posterior Deltoid"],
    secondaryMuscles: ["Rhomboids", "Middle Traps"],
    equipment: ["Resistance band"],
    difficulty: "beginner",
    setup: "Standing with band at elbow height, elbow at 90°",
    execution: [
      "Hold band with throwing arm",
      "Keep elbow at side, bent 90°",
      "Rotate forearm away from body",
      "Control return to starting position",
      "Feel work in back of shoulder",
    ],
    coaching: [
      "Critical for velocity generation",
      "Control both directions",
      "Feel it in posterior shoulder",
      "Never rush the movement",
    ],
    progressions: [
      "Light band, high reps",
      "Medium band, moderate reps",
      "Heavy band, lower reps",
      "Weighted external rotation",
    ],
    safetyNotes: [
      "Never force range of motion",
      "Stop if any sharp pain",
      "This muscle fatigues quickly",
    ],
    throwingRelevance: "Primary velocity generator - 30% of throwing power",
  },

  "Band Internal Rotation": {
    category: "Rotator Cuff",
    primaryMuscles: ["Internal Rotators", "Subscapularis"],
    secondaryMuscles: ["Anterior Deltoid", "Pectorals"],
    equipment: ["Resistance band"],
    difficulty: "beginner",
    setup: "Standing with band at elbow height, elbow at 90°",
    execution: [
      "Hold band with throwing arm",
      "Keep elbow at side, bent 90°",
      "Rotate forearm toward body",
      "Control return to starting position",
      "Feel work in front of shoulder",
    ],
    coaching: [
      "Balance external rotation work",
      "Control the movement",
      "Equal work both directions",
      "Maintains shoulder balance",
    ],
    progressions: [
      "Light band, high reps",
      "Medium band, moderate reps",
      "Heavy band, lower reps",
      "Weighted internal rotation",
    ],
    safetyNotes: [
      "Don't overpower external rotators",
      "Maintain 2:1 external:internal ratio",
      "Stop if shoulder discomfort",
    ],
    throwingRelevance: "Shoulder balance and injury prevention",
  },

  "Sleeper Stretch": {
    category: "Shoulder Mobility",
    primaryMuscles: ["Posterior Capsule", "External Rotators"],
    secondaryMuscles: ["Posterior Deltoid"],
    equipment: ["Floor/mat"],
    difficulty: "intermediate",
    setup: "Lying on throwing side, arm at 90°",
    execution: [
      "Lie on throwing shoulder",
      "Upper arm perpendicular to body",
      "Use other hand to push forearm down",
      "Hold stretch at end range",
      "Should feel stretch in back of shoulder",
    ],
    coaching: [
      "CRITICAL for QBs - do daily",
      "Increases internal rotation",
      "Prevents posterior tightness",
      "Hold for full 60 seconds",
    ],
    progressions: [
      "Light pressure, 30s hold",
      "Moderate pressure, 45s hold",
      "Firm pressure, 60s hold",
      "PNF contract-relax technique",
    ],
    safetyNotes: [
      "Never force into pain",
      "Gradual pressure increase",
      "Essential for throwing health",
    ],
    throwingRelevance: "Prevents velocity-limiting shoulder tightness",
  },

  "Couch Stretch": {
    category: "Hip Flexor Flexibility",
    primaryMuscles: ["Hip Flexors", "Psoas"],
    secondaryMuscles: ["Quadriceps", "TFL"],
    equipment: ["Couch/elevated surface"],
    difficulty: "intermediate",
    setup: "Rear foot elevated, front foot forward",
    execution: [
      "Rear foot on couch/bench",
      "Front foot planted forward",
      "Drive hips forward",
      "Feel deep stretch in hip flexor",
      "Hold position for full duration",
    ],
    coaching: [
      "THE most important QB stretch",
      "Tight hip flexors = 15-20% velocity loss",
      "Must be done daily",
      "Should feel deep stretch in front of hip",
    ],
    progressions: [
      "Hands supported, 60s hold",
      "Hands free, 90s hold",
      "Rear foot higher, 90s hold",
      "Add reach overhead",
    ],
    safetyNotes: [
      "Don't arch back excessively",
      "Gradual progression",
      "Essential for QB velocity",
    ],
    throwingRelevance: "Hip flexor flexibility = stride length = velocity",
  },

  "Medicine Ball Rotational Throws": {
    category: "Throwing Power",
    primaryMuscles: ["Core", "Lats", "Obliques"],
    secondaryMuscles: ["Shoulders", "Hips"],
    equipment: ["Medicine ball (6-10 lbs)"],
    difficulty: "intermediate",
    setup: "Athletic stance with medicine ball",
    execution: [
      "Start in throwing position",
      "Rotate trunk explosively",
      "Throw ball with full body",
      "Follow through completely",
      "Simulate throwing motion",
    ],
    coaching: [
      "Explosive trunk rotation",
      "Full body integration",
      "Simulates throwing pattern",
      "Maximum velocity development",
    ],
    progressions: [
      "6 lb ball, moderate speed",
      "8 lb ball, good speed",
      "10 lb ball, explosive",
      "12 lb ball, maximum power",
    ],
    safetyNotes: [
      "Start with lighter weight",
      "Progressive loading",
      "Focus on form first",
    ],
    throwingRelevance: "Develops rotational power for throwing",
  },

  "Weighted Ball Throws": {
    category: "Throwing Velocity",
    primaryMuscles: ["Entire throwing chain"],
    secondaryMuscles: ["Full body"],
    equipment: ["Weighted footballs (12-18 oz)"],
    difficulty: "advanced",
    setup: "Normal throwing stance",
    execution: [
      "Use proper throwing mechanics",
      "Throw weighted ball explosively",
      "Follow with regular ball throws",
      "Feel velocity increase",
      "Focus on speed, not distance",
    ],
    coaching: [
      "Overload/underload principle",
      "Develops velocity",
      "Must maintain mechanics",
      "Quality over quantity",
    ],
    progressions: [
      "14 oz ball, 10 throws",
      "16 oz ball, 8 throws",
      "18 oz ball, 5 throws",
      "Contrast with regular ball",
    ],
    safetyNotes: [
      "Proper warm-up essential",
      "Don't overdo volume",
      "Stop if mechanics break down",
    ],
    throwingRelevance: "Direct velocity development",
  },

  "Progressive Throwing Warm-Up": {
    category: "Throwing Preparation",
    primaryMuscles: ["Entire throwing chain"],
    secondaryMuscles: ["Full body"],
    equipment: ["Footballs"],
    difficulty: "beginner",
    setup: "Progressive distances from 5 to 40 yards",
    execution: [
      "Start at 5 yards, 5 throws",
      "Move to 10 yards, 5 throws",
      "Progress to 15, 20, 25, 30, 40 yards",
      "5 throws at each distance",
      "Focus on mechanics, not power",
    ],
    coaching: [
      "Never skip this progression",
      "Minimum 35 throws to warm up",
      "Mechanics over velocity",
      "Prepares arm for training",
    ],
    progressions: [
      "Basic progression, 5 each",
      "Extended progression, 8 each",
      "Competition progression",
      "Game-day progression",
    ],
    safetyNotes: [
      "Never throw hard when cold",
      "Most important injury prevention",
      "Take time needed",
    ],
    throwingRelevance: "Essential preparation for all throwing",
  },
};

// QB Assessment Protocols
export const QB_ASSESSMENTS = {
  throwingVelocity: {
    title: "Throwing Velocity Assessment",
    equipment: ["Radar gun", "Footballs", "Measuring tape"],
    protocol: [
      "Complete 20-minute warm-up",
      "Progressive throwing to 40 yards",
      "Rest 5 minutes",
      "10 maximum effort throws",
      "Record best, average, worst",
      "Rest 3 minutes between throws",
    ],
    frequency: "Weeks 4, 8, 12, 14",
    expectedImprovements: {
      week4: "+3-5 mph from baseline",
      week8: "+5-8 mph total",
      week12: "+8-12 mph total",
      week14: "+8-15 mph total (peak maintenance)",
    },
  },

  throwingEndurance: {
    title: "Throwing Endurance Test",
    equipment: ["Footballs", "Targets", "Timer"],
    protocol: {
      week4: "100 throws, track accuracy decline",
      week8: "150 throws, track accuracy decline",
      week12: "200 throws, track accuracy decline",
      week14: "Tournament simulation (320 throws)",
    },
    metrics: [
      "Total throws completed",
      "Accuracy percentage by quarter",
      "Velocity maintenance",
      "Mechanics breakdown point",
      "Recovery time needed",
    ],
  },

  shoulderMobility: {
    title: "Shoulder Mobility Assessment",
    equipment: ["Goniometer (optional)", "Measuring tape"],
    measurements: [
      "External rotation (lying down)",
      "Horizontal abduction",
      "Scapular posterior tilt",
      "Overhead reach",
    ],
    targets: {
      externalRotation: "110-130°",
      horizontalAbduction: "45-55°",
      scapularTilt: "20-25°",
    },
    frequency: "Weeks 1, 4, 8, 12, 14",
  },

  hipFlexorFlexibility: {
    title: "Hip Flexor Flexibility Test",
    equipment: ["Couch/bench", "Timer"],
    protocol: [
      "Thomas test position",
      "Couch stretch hold time",
      "Compare left vs right",
      "Measure improvement",
    ],
    targets: {
      couchStretch: "90+ seconds comfortable hold",
      thomasTest: "Thigh below horizontal",
      symmetry: "Less than 10° difference",
    },
  },

  mentalPreparation: {
    title: "Mental Preparation Assessment",
    components: [
      "Pressure throwing accuracy",
      "Fatigue mental resilience",
      "Between-game reset ability",
      "Confidence under pressure",
    ],
    protocol: [
      "Accuracy under time pressure",
      "Throws after fatigue simulation",
      "Performance with distraction",
      "Mental reset timing",
    ],
  },
};

// Competition Simulation Protocols
export const TOURNAMENT_SIMULATION = {
  fullSimulation: {
    title: "8-Game Tournament Simulation",
    description: "Complete 320 throw simulation",
    schedule: [
      { game: 1, throws: 40, timeLimit: "15 minutes" },
      { rest: "10 minutes", protocol: "Between-game recovery" },
      { game: 2, throws: 40, timeLimit: "15 minutes" },
      { rest: "10 minutes", protocol: "Between-game recovery" },
      { game: 3, throws: 40, timeLimit: "15 minutes" },
      { rest: "10 minutes", protocol: "Between-game recovery" },
      { game: 4, throws: 40, timeLimit: "15 minutes" },
      { rest: "20 minutes", protocol: "End of Day 1" },
      { game: 5, throws: 40, timeLimit: "15 minutes" },
      { rest: "10 minutes", protocol: "Between-game recovery" },
      { game: 6, throws: 40, timeLimit: "15 minutes" },
      { rest: "10 minutes", protocol: "Between-game recovery" },
      { game: 7, throws: 40, timeLimit: "15 minutes" },
      { rest: "10 minutes", protocol: "Between-game recovery" },
      { game: 8, throws: 40, timeLimit: "15 minutes" },
    ],
    totalTime: "3.5-4 hours",
    trackingMetrics: [
      "Velocity every 10th throw",
      "Accuracy percentage each game",
      "Mechanics assessment (games 1, 4, 8)",
      "Mental fatigue rating after each game",
      "Recovery effectiveness between games",
    ],
  },

  betweenGameProtocol: {
    title: "Between-Game Recovery Protocol",
    duration: "8-12 minutes",
    sequence: [
      { activity: "Light arm stretching", duration: "2 minutes" },
      { activity: "Hydration + light snack", duration: "3 minutes" },
      { activity: "Mental reset/visualization", duration: "2 minutes" },
      { activity: "Light throwing preparation", duration: "3 minutes" },
    ],
  },
};

export default QB_TRAINING_PROGRAM;
