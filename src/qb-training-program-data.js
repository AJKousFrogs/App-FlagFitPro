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

// Weekly Schedules - Foundation Phase (Weeks 1-4)
export const QB_WEEKLY_SCHEDULES = {
  foundation: {
    week1: {
      weekNumber: 1,
      dateRange: "December 1-7, 2025",
      phase: "Foundation",
      focus: "Build foundation: Lower body + QB arm care introduction",
      throwingVolume: "80-120 throws total for week",
      days: {
        monday: {
          title: "Lower Body Foundation + QB Arm Strength Introduction",
          type: "dual-track",
          duration: 95,
          warmup: "QB Enhanced Warm-Up (30 min) - Includes shoulder complex activation",

          blocks: [
            {
              title: "Block 1: Lower Body - Posterior Chain (Same as WR/DB)",
              duration: 20,
              exercises: [
                {
                  name: "RDLs (Romanian Deadlifts)",
                  sets: 4,
                  reps: 10,
                  rest: "90s",
                  load: "25-30% BW",
                  notes: "Feel hamstring stretch, maintain flat back",
                },
                {
                  name: "Nordic Curls (Assisted)",
                  sets: 3,
                  reps: "AMRAP",
                  rest: "2 min",
                  notes: "Use band assistance. Control descent 3-5s",
                },
                {
                  name: "Hip Thrusts",
                  sets: 3,
                  reps: 12,
                  rest: "90s",
                  load: "Bodyweight or light",
                },
              ],
            },
            {
              title: "Block 2: Lower Body - Quad/Ankle",
              duration: 15,
              exercises: [
                {
                  name: "Goblet Squats",
                  sets: 3,
                  reps: 10,
                  rest: "90s",
                },
                {
                  name: "Single-Leg Calf Raises",
                  sets: 3,
                  reps: "12 each",
                  rest: "60s",
                  tempo: "2s up, 2s down",
                },
              ],
            },
            {
              title: "Block 3: QB-Specific Arm Strength",
              duration: 20,
              qbSpecific: true,
              exercises: [
                {
                  name: "Band External Rotation",
                  sets: 3,
                  reps: "15 each arm",
                  rest: "45s",
                  notes: "CRITICAL - 30% of throwing power. Elbow stays at side",
                },
                {
                  name: "Band Internal Rotation",
                  sets: 3,
                  reps: "12 each arm",
                  rest: "45s",
                },
                {
                  name: "I-Y-T Raises",
                  sets: 2,
                  reps: "10 each position",
                  rest: "60s",
                  load: "Bodyweight or 2-5 lbs",
                  notes: "Light weight, thumbs up position",
                },
                {
                  name: "Face Pulls",
                  sets: 3,
                  reps: 15,
                  rest: "45s",
                  notes: "Rear deltoid = primary velocity generator",
                },
                {
                  name: "Single-Arm DB Rows",
                  sets: 3,
                  reps: "10 each arm",
                  rest: "75s",
                  load: "Light-moderate",
                  notes: "Lats = 18% of throwing power",
                },
              ],
            },
            {
              title: "Block 4: QB Core",
              duration: 10,
              qbSpecific: true,
              exercises: [
                {
                  name: "Plank Series",
                  sets: 3,
                  duration: "45s",
                  rest: "60s",
                },
                {
                  name: "Medicine Ball Rotational Throws (Light)",
                  sets: 2,
                  reps: "8 each side",
                  rest: "60s",
                  load: "6 lbs",
                  notes: "Introduction to rotational power",
                },
              ],
            },
          ],
          equipment: ["Barbell/DBs", "bands", "medicine ball", "elevated surface"],
        },

        tuesday: {
          title: "Sprint Mechanics + QB Shoulder Mobility",
          type: "dual-track",
          duration: 95,
          warmup: "QB Enhanced Warm-Up (30 min)",

          blocks: [
            {
              title: "Block 1: Sprint Drill Series (Same as WR/DB)",
              duration: 20,
              exercises: [
                { name: "A-March", sets: 3, distance: "20m", rest: "45s" },
                { name: "A-Skip", sets: 3, distance: "20m", rest: "45s" },
                { name: "High Knees", sets: 3, distance: "20m", rest: "45s" },
                { name: "Butt Kicks", sets: 3, distance: "20m", rest: "45s" },
                {
                  name: "Wall Drills",
                  sets: 3,
                  duration: "20s each leg",
                  rest: "60s",
                },
              ],
            },
            {
              title: "Block 2: Tempo Running",
              duration: 20,
              options: [
                {
                  condition: "Track available",
                  exercise: {
                    name: "Tempo Runs",
                    sets: 8,
                    distance: "100m",
                    intensity: "70%",
                    rest: "90s walk",
                  },
                },
                {
                  condition: "No track",
                  exercise: {
                    name: "Treadmill Tempo",
                    sets: 8,
                    duration: "2min",
                    rest: "1min walk",
                  },
                },
              ],
            },
            {
              title: "Block 3: QB Shoulder Mobility & Health",
              duration: 20,
              qbSpecific: true,
              exercises: [
                {
                  name: "Sleeper Stretch",
                  sets: 4,
                  duration: "60s each arm",
                  notes: "MANDATORY post-throwing. Prevents posterior shoulder tightness",
                },
                {
                  name: "Doorway Pec Stretch",
                  sets: 3,
                  duration: "60s each side",
                  notes: "Opens up chest for better throwing mechanics",
                },
                {
                  name: "Wall Slides",
                  sets: 3,
                  reps: 12,
                  rest: "45s",
                  notes: "Scapular control and timing",
                },
                {
                  name: "Band Pull-Aparts",
                  sets: 3,
                  reps: 20,
                  rest: "30s",
                  notes: "Daily practice ideal",
                },
                {
                  name: "Thoracic Extensions (Foam Roller)",
                  duration: "5 min",
                  notes: "Adds 8-12 mph to velocity. Daily practice",
                },
              ],
            },
            {
              title: "Block 4: Progressive Throwing Warm-Up",
              duration: 15,
              qbSpecific: true,
              throwingVolume: "15-20 throws",
              protocol: [
                { distance: "5 yards", throws: 3, intensity: "30%" },
                { distance: "10 yards", throws: 3, intensity: "40%" },
                { distance: "15 yards", throws: 3, intensity: "50%" },
                { distance: "20 yards", throws: 3, intensity: "60%" },
                { distance: "25 yards", throws: "3-5", intensity: "70%" },
              ],
              notes: "NEVER throw hard when cold. This is warm-up only",
            },
          ],
          equipment: ["Track or treadmill", "bands", "foam roller", "football"],
        },

        wednesday: {
          title: "Active Recovery + QB Hip Flexor & Back Work",
          type: "recovery/qb-specific",
          duration: 70,
          warmup: "Light movement (10 min)",

          blocks: [
            {
              title: "Block 1: General Mobility (Same as WR/DB)",
              duration: 15,
              exercises: [
                { name: "World's Greatest Stretch", sets: 2, reps: "5 each side" },
                { name: "90/90 Hip Stretches", sets: 2, duration: "60s each" },
                { name: "Foam Rolling", duration: "10 min" },
              ],
            },
            {
              title: "Block 2: QB Hip Flexor Work (CRITICAL)",
              duration: 20,
              qbSpecific: true,
              notes: "Tight hip flexors reduce velocity 15-20%",
              exercises: [
                {
                  name: "Couch Stretch",
                  sets: 3,
                  duration: "90s each leg",
                  notes: "NON-NEGOTIABLE for QB velocity",
                },
                {
                  name: "Kneeling Hip Flexor Stretch",
                  sets: 3,
                  duration: "90s each side",
                  notes: "Don't arch lower back. Push hips forward",
                },
                {
                  name: "Standing Quad/Hip Flexor Stretch",
                  sets: 2,
                  duration: "60s each",
                },
                {
                  name: "90/90 Hip Flow",
                  reps: "10 transitions",
                  notes: "Dynamic hip mobility all planes",
                },
              ],
            },
            {
              title: "Block 3: QB Back Strength (Throwing Power)",
              duration: 20,
              qbSpecific: true,
              exercises: [
                {
                  name: "Single-Arm DB Rows",
                  sets: 3,
                  reps: "12 each arm",
                  rest: "75s",
                  load: "Light-moderate",
                  notes: "Lats = 18% of throwing power",
                },
                {
                  name: "Lat Pulldowns or Pull-Up Negatives",
                  sets: 3,
                  reps: "10-12",
                  rest: "90s",
                },
                {
                  name: "Face Pulls",
                  sets: 3,
                  reps: 15,
                  rest: "45s",
                },
                {
                  name: "Thoracic Extension Work",
                  duration: "8 min",
                  protocol: "Foam roller + stretches",
                },
              ],
            },
            {
              title: "Block 4: Light Glute Activation",
              duration: 15,
              exercises: [
                { name: "Glute bridges", sets: 2, reps: 20 },
                { name: "Band walks", sets: 2, reps: "15 each direction" },
              ],
            },
          ],
          equipment: ["Yoga mat", "foam roller", "DBs", "bands", "couch/bench"],
        },

        thursday: {
          title: "Lower Body Power + QB Throwing Integration",
          type: "dual-track",
          duration: 110,
          warmup: "QB Enhanced Warm-Up (30 min)",

          blocks: [
            {
              title: "Block 1: Lower Body Strength (Same as WR/DB)",
              duration: 20,
              exercises: [
                {
                  name: "Back Squats or Goblet Squats",
                  sets: 4,
                  reps: 8,
                  rest: "2 min",
                  load: "30-40% BW for back squats",
                },
                {
                  name: "Bulgarian Split Squats",
                  sets: 3,
                  reps: "8 each",
                  rest: "90s",
                },
                {
                  name: "Single-Leg RDLs",
                  sets: 3,
                  reps: "8 each",
                  rest: "75s",
                },
              ],
            },
            {
              title: "Block 2: Plyometric Introduction",
              duration: 15,
              exercises: [
                {
                  name: "Box Step-Ups",
                  sets: 3,
                  reps: "10 each",
                  rest: "75s",
                  boxHeight: "6-12 inches",
                },
                {
                  name: "Broad Jumps",
                  sets: 3,
                  reps: 5,
                  rest: "90s",
                },
              ],
            },
            {
              title: "Block 3: QB Throwing Mechanics & Integration",
              duration: 25,
              qbSpecific: true,
              throwingVolume: "25-35 throws",
              exercises: [
                {
                  name: "Progressive Throwing Warm-Up",
                  throws: 15,
                  protocol: "5y→10y→15y→20y→25y (3 each)",
                },
                {
                  name: "Shadow Throwing (No Ball)",
                  reps: "20 throws",
                  notes: "Perfect mechanics, slow to fast progression",
                },
                {
                  name: "Step-Through Drill",
                  sets: 3,
                  reps: "8 throws",
                  rest: "90s",
                  notes: "Hips before shoulders sequencing",
                },
                {
                  name: "Throwing Session - Accuracy Focus",
                  throws: "15-20",
                  distance: "10-15 yards",
                  notes: "Focus on mechanics, not power. 60-70% effort",
                },
              ],
            },
            {
              title: "Block 4: QB Arm Care Protocol",
              duration: 15,
              qbSpecific: true,
              exercises: [
                {
                  name: "Light throwing cool-down",
                  throws: "5-8 easy tosses",
                },
                {
                  name: "Sleeper Stretch",
                  sets: 3,
                  duration: "60s each arm",
                  notes: "MANDATORY after throwing",
                },
                {
                  name: "Cross-body stretch",
                  sets: 2,
                  duration: "45s each",
                },
                {
                  name: "Band external rotation (light)",
                  sets: 2,
                  reps: 15,
                  notes: "Recovery work",
                },
              ],
            },
          ],
          equipment: ["Barbell/DBs", "box", "football", "bands"],
        },

        friday: {
          title: "Power Work + QB Endurance Training",
          type: "dual-track",
          duration: 100,
          warmup: "QB Enhanced Warm-Up (30 min)",

          blocks: [
            {
              title: "Block 1: Lower Body Power (Same as WR/DB)",
              duration: 20,
              exercises: [
                {
                  name: "Box Jumps",
                  sets: 4,
                  reps: 4,
                  rest: "2 min",
                  boxHeight: "12 inches",
                },
                {
                  name: "Medicine Ball Slams",
                  sets: 4,
                  reps: 6,
                  rest: "90s",
                },
                {
                  name: "Jump Squats",
                  sets: 4,
                  reps: 6,
                  rest: "2 min",
                  load: "bodyweight",
                },
              ],
            },
            {
              title: "Block 2: QB Upper Body Power",
              duration: 15,
              qbSpecific: true,
              exercises: [
                {
                  name: "Medicine Ball Rotational Throws",
                  sets: 3,
                  reps: "8 each side",
                  rest: "90s",
                  load: "6-8 lbs",
                  notes: "Explosive rotation mimics throwing",
                },
                {
                  name: "Push-Ups",
                  sets: 3,
                  reps: "12-15",
                  rest: "60s",
                },
                {
                  name: "Band Rows",
                  sets: 3,
                  reps: 12,
                  rest: "60s",
                },
              ],
            },
            {
              title: "Block 3: QB Throwing Endurance Introduction",
              duration: 25,
              qbSpecific: true,
              throwingVolume: "50-80 throws total",
              protocol: {
                warmUp: "Progressive warm-up (15 throws)",
                mainWork: {
                  name: "Continuous Throwing - Endurance Building",
                  throws: "40-60",
                  distance: "10-15 yards",
                  intensity: "60-70% effort",
                  rest: "Minimal between throws",
                  notes: "Building endurance, NOT power. Maintain mechanics under fatigue",
                },
                coolDown: "Light tosses (5 throws)",
              },
              notes: "Week 1 baseline: 50-80 total throws. Progressive overload in coming weeks",
            },
            {
              title: "Block 4: Arm Care",
              duration: 10,
              qbSpecific: true,
              exercises: [
                { name: "Sleeper stretch", sets: 3, duration: "60s each" },
                { name: "Shoulder mobility circuit", duration: "5 min" },
              ],
            },
          ],
          equipment: ["Box", "medicine ball", "football", "bands"],
        },

        saturday: {
          title: "Sprint Work + QB Throwing Session",
          type: "dual-track",
          duration: 90,
          warmup: "QB Enhanced Warm-Up (30 min)",

          blocks: [
            {
              title: "Block 1: Sprint Work",
              duration: 30,
              options: [
                {
                  condition: "Track available",
                  exercises: [
                    {
                      name: "Acceleration Mechanics",
                      sets: 6,
                      distance: "20m",
                      intensity: "75%",
                      rest: "2 min",
                    },
                    {
                      name: "Build-Up Runs",
                      sets: 4,
                      distance: "40m",
                      rest: "2 min",
                    },
                  ],
                },
                {
                  condition: "No track",
                  exercises: [
                    { name: "Wall Drills", sets: 4, duration: "30s each leg", rest: "90s" },
                    { name: "Resistance Band Sprint Simulation", sets: 6, duration: "10s", rest: "2 min" },
                  ],
                },
              ],
            },
            {
              title: "Block 2: QB Throwing Session - Technique Focus",
              duration: 30,
              qbSpecific: true,
              throwingVolume: "20-30 throws",
              protocol: [
                {
                  phase: "Warm-up",
                  throws: 10,
                  notes: "Progressive 5y→25y",
                },
                {
                  phase: "Main Work - Mechanics Practice",
                  drills: [
                    { name: "Footwork patterns", throws: "5-8", notes: "Various drops" },
                    { name: "Accuracy targets", throws: "5-8", notes: "Hit specific targets" },
                    { name: "Release variety", throws: "5-8", notes: "Different arm angles" },
                  ],
                },
                {
                  phase: "Cool-down",
                  throws: "3-5 easy",
                },
              ],
            },
          ],
          equipment: ["Track or wall space", "bands", "football", "targets/cones"],
        },

        sunday: {
          title: "Complete Recovery Day (Lower + Upper Body)",
          type: "recovery",
          duration: 70,
          protocol: "QB-Enhanced Recovery Protocol",

          blocks: [
            {
              title: "Lower Body Recovery (Standard)",
              duration: 25,
              exercises: [
                { name: "Lower body chain stretching", duration: "20 min" },
                { name: "Foam rolling - legs", duration: "10 min" },
              ],
            },
            {
              title: "Upper Body/QB Recovery",
              duration: 30,
              qbSpecific: true,
              exercises: [
                {
                  name: "Shoulder mobility complex",
                  duration: "12 min",
                  protocol: [
                    "Sleeper stretch 3×60s each",
                    "Doorway pec stretch 2×60s",
                    "Cross-body stretch 2×45s each",
                    "Wall slides 2×12",
                  ],
                },
                {
                  name: "Hip flexor flexibility",
                  duration: "10 min",
                  protocol: [
                    "Couch stretch 2×90s each",
                    "Kneeling hip flexor 2×60s each",
                  ],
                },
                {
                  name: "Thoracic mobility",
                  duration: "8 min",
                  protocol: "Foam roller extensions + rotations",
                },
              ],
            },
            {
              title: "General Recovery",
              duration: 15,
              activities: [
                { name: "Light walk", duration: "20 min" },
                { name: "Visualization/mental training", duration: "10 min" },
              ],
            },
          ],
        },
      },
      weekSummary: {
        totalThrows: "80-120",
        lowerBodySessions: 4,
        qbSpecificSessions: 6,
        focus: "Foundation building, movement quality, throwing mechanics introduction",
      },
    },
  },
};

export default QB_TRAINING_PROGRAM;
