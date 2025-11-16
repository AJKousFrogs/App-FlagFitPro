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

    week2: {
      weekNumber: 2,
      dateRange: "December 8-14, 2025",
      phase: "Foundation",
      focus: "Volume progression + technique refinement",
      throwingVolume: "100-120 throws total for week",
      days: {
        monday: {
          title: "Lower Body Strength + QB Arm Strength Progression",
          type: "dual-track",
          duration: 100,
          warmup: "QB Enhanced Warm-Up (30 min)",

          blocks: [
            {
              title: "Block 1: Lower Body - Posterior Chain Volume",
              duration: 22,
              exercises: [
                {
                  name: "RDLs",
                  sets: 4,
                  reps: 10,
                  rest: "90s",
                  load: "28-32% BW",
                  notes: "Load increase from Week 1",
                },
                {
                  name: "Nordic Curls (Assisted)",
                  sets: 4,
                  reps: "AMRAP",
                  rest: "2 min",
                  notes: "Add 4th set. Less assistance than Week 1",
                },
                {
                  name: "Hip Thrusts",
                  sets: 4,
                  reps: 12,
                  rest: "90s",
                  load: "Light weight",
                },
              ],
            },
            {
              title: "Block 2: Lower Body - Quad/Ankle",
              duration: 18,
              exercises: [
                {
                  name: "Goblet or Back Squats",
                  sets: 4,
                  reps: 10,
                  rest: "90s",
                  load: "30-35% BW",
                },
                {
                  name: "Walking Lunges",
                  sets: 3,
                  reps: "12 each",
                  rest: "90s",
                },
                {
                  name: "Single-Leg Calf Raises",
                  sets: 3,
                  reps: "15 each",
                  rest: "60s",
                  tempo: "2s up, 2s down",
                },
              ],
            },
            {
              title: "Block 3: QB Arm Strength Progression",
              duration: 20,
              qbSpecific: true,
              exercises: [
                {
                  name: "Band External Rotation",
                  sets: 3,
                  reps: "15 each arm",
                  rest: "45s",
                  notes: "Increase resistance from Week 1",
                },
                {
                  name: "Band Internal Rotation",
                  sets: 3,
                  reps: "15 each arm",
                  rest: "45s",
                },
                {
                  name: "I-Y-T Raises",
                  sets: 3,
                  reps: "12 each position",
                  rest: "60s",
                  load: "2-5 lbs",
                  notes: "Volume increase",
                },
                {
                  name: "Face Pulls",
                  sets: 4,
                  reps: 15,
                  rest: "45s",
                },
                {
                  name: "Single-Arm DB Rows",
                  sets: 3,
                  reps: "12 each arm",
                  rest: "75s",
                  load: "Light-moderate",
                },
                {
                  name: "Tricep Extensions (Overhead DB)",
                  sets: 3,
                  reps: 12,
                  rest: "60s",
                  notes: "Triceps = 23% of ball velocity",
                },
              ],
            },
            {
              title: "Block 4: QB Core + Rotational Power",
              duration: 10,
              qbSpecific: true,
              exercises: [
                {
                  name: "Plank Series",
                  sets: 3,
                  duration: "50s",
                  rest: "60s",
                },
                {
                  name: "Medicine Ball Rotational Throws",
                  sets: 3,
                  reps: "10 each side",
                  rest: "60s",
                  load: "8 lbs",
                },
              ],
            },
          ],
          equipment: ["Barbell/DBs", "bands", "medicine ball"],
        },

        tuesday: {
          title: "Sprint Mechanics + QB Shoulder Health",
          type: "dual-track",
          duration: 100,
          warmup: "QB Enhanced Warm-Up (30 min)",

          blocks: [
            {
              title: "Block 1: Sprint Drill Progression",
              duration: 22,
              exercises: [
                { name: "A-March", sets: 3, distance: "25m", rest: "45s" },
                { name: "A-Skip", sets: 3, distance: "25m", rest: "45s" },
                { name: "B-Skip", sets: 3, distance: "20m", rest: "60s" },
                { name: "High Knees", sets: 3, distance: "25m", rest: "45s" },
                { name: "Wall Drills", sets: 4, duration: "25s each leg", rest: "60s" },
              ],
            },
            {
              title: "Block 2: Tempo Running Volume",
              duration: 22,
              options: [
                {
                  condition: "Track available",
                  exercise: {
                    name: "Tempo Runs",
                    sets: 10,
                    distance: "100m",
                    intensity: "70-75%",
                    rest: "75s walk",
                  },
                },
                {
                  condition: "No track",
                  exercise: {
                    name: "Treadmill Tempo",
                    sets: 10,
                    duration: "2min",
                    rest: "1min walk",
                  },
                },
              ],
            },
            {
              title: "Block 3: QB Shoulder Mobility & Strengthening",
              duration: 20,
              qbSpecific: true,
              exercises: [
                {
                  name: "Sleeper Stretch",
                  sets: 4,
                  duration: "75s each arm",
                  notes: "Increased duration from Week 1",
                },
                {
                  name: "Doorway Pec Stretch",
                  sets: 3,
                  duration: "75s each side",
                },
                {
                  name: "Wall Slides",
                  sets: 4,
                  reps: 15,
                  rest: "45s",
                },
                {
                  name: "Band Pull-Aparts",
                  sets: 4,
                  reps: 20,
                  rest: "30s",
                },
                {
                  name: "Cuban Press (Light)",
                  sets: 2,
                  reps: 10,
                  rest: "60s",
                  load: "5 lbs",
                  notes: "Complete rotator cuff activation",
                },
                {
                  name: "Thoracic Extensions",
                  duration: "8 min",
                },
              ],
            },
            {
              title: "Block 4: Light Throwing",
              duration: 16,
              qbSpecific: true,
              throwingVolume: "20-25 throws",
              protocol: [
                { distance: "5-10 yards", throws: "8-10", intensity: "40-50%" },
                { distance: "15-20 yards", throws: "8-10", intensity: "60%" },
                { distance: "25 yards", throws: "4-5", intensity: "70%" },
              ],
            },
          ],
          equipment: ["Track or treadmill", "bands", "foam roller", "football", "light DBs"],
        },

        wednesday: {
          title: "Active Recovery + QB Hip Flexor Emphasis",
          type: "recovery/qb-specific",
          duration: 75,
          warmup: "Light movement (10 min)",

          blocks: [
            {
              title: "Block 1: General Mobility",
              duration: 15,
              exercises: [
                { name: "World's Greatest Stretch", sets: 2, reps: "5 each side" },
                { name: "90/90 Hip Stretches", sets: 2, duration: "60s each" },
                { name: "Foam Rolling", duration: "10 min" },
              ],
            },
            {
              title: "Block 2: QB Hip Flexor Work (Extended)",
              duration: 25,
              qbSpecific: true,
              exercises: [
                {
                  name: "Couch Stretch",
                  sets: 3,
                  duration: "2 min each leg",
                  notes: "Duration increase. Deep work",
                },
                {
                  name: "Kneeling Hip Flexor Stretch",
                  sets: 3,
                  duration: "90s each side",
                },
                {
                  name: "Standing Quad/Hip Flexor Stretch",
                  sets: 3,
                  duration: "60s each",
                },
                {
                  name: "90/90 Hip Flow",
                  reps: "15 transitions",
                  notes: "Increased volume",
                },
                {
                  name: "Thomas Test Assessment",
                  notes: "Check hip flexor tightness. Thigh should be below horizontal",
                },
              ],
            },
            {
              title: "Block 3: QB Back Strength Development",
              duration: 20,
              qbSpecific: true,
              exercises: [
                {
                  name: "Single-Arm DB Rows",
                  sets: 4,
                  reps: "12 each arm",
                  rest: "75s",
                  load: "Moderate",
                },
                {
                  name: "Lat Pulldowns",
                  sets: 3,
                  reps: "12",
                  rest: "90s",
                },
                {
                  name: "Face Pulls",
                  sets: 3,
                  reps: 20,
                  rest: "45s",
                },
                {
                  name: "Bicep Curls (Eccentric Focus)",
                  sets: 3,
                  reps: 10,
                  rest: "60s",
                  tempo: "1-0-4",
                  notes: "Slow eccentric for deceleration strength",
                },
                {
                  name: "Thoracic Extension Work",
                  duration: "10 min",
                },
              ],
            },
            {
              title: "Block 4: Light Activation",
              duration: 15,
              exercises: [
                { name: "Copenhagen Plank", sets: 2, duration: "25-30s each" },
                { name: "Glute bridges", sets: 2, reps: 20 },
              ],
            },
          ],
          equipment: ["Yoga mat", "foam roller", "DBs", "bands", "cable machine", "couch/bench"],
        },

        thursday: {
          title: "Lower Body Power + QB Throwing Progression",
          type: "dual-track",
          duration: 115,
          warmup: "QB Enhanced Warm-Up (30 min)",

          blocks: [
            {
              title: "Block 1: Lower Body Strength",
              duration: 22,
              exercises: [
                {
                  name: "Back Squats",
                  sets: 4,
                  reps: 8,
                  rest: "2 min",
                  load: "32-38% BW",
                },
                {
                  name: "Bulgarian Split Squats",
                  sets: 3,
                  reps: "10 each",
                  rest: "90s",
                  load: "Light DBs",
                },
                {
                  name: "Single-Leg RDLs",
                  sets: 3,
                  reps: "10 each",
                  rest: "75s",
                },
              ],
            },
            {
              title: "Block 2: Plyometric Volume",
              duration: 20,
              exercises: [
                {
                  name: "Box Jumps",
                  sets: 4,
                  reps: 5,
                  rest: "2 min",
                  boxHeight: "12-18 inches",
                },
                {
                  name: "Broad Jumps",
                  sets: 4,
                  reps: 5,
                  rest: "90s",
                },
                {
                  name: "Lateral Bounds",
                  sets: 3,
                  reps: "10 each direction",
                  rest: "90s",
                },
              ],
            },
            {
              title: "Block 3: QB Throwing Session - Volume Progression",
              duration: 28,
              qbSpecific: true,
              throwingVolume: "35-45 throws",
              exercises: [
                {
                  name: "Progressive Throwing Warm-Up",
                  throws: 15,
                  protocol: "5y→10y→15y→20y→25y",
                },
                {
                  name: "Footwork + Throwing Integration",
                  sets: 4,
                  reps: "5 throws each",
                  rest: "90s",
                  drills: ["3-step drop", "5-step drop", "Rollout", "Sprint out"],
                  notes: "20 throws total",
                },
                {
                  name: "Accuracy Targets",
                  throws: "10-15",
                  distance: "15 yards",
                  notes: "Hit specific targets, 70% effort",
                },
              ],
            },
            {
              title: "Block 4: QB Arm Care",
              duration: 15,
              qbSpecific: true,
              exercises: [
                { name: "Light throwing cool-down", throws: "5-8" },
                { name: "Sleeper Stretch", sets: 3, duration: "60s each" },
                { name: "Cross-body stretch", sets: 2, duration: "45s each" },
                { name: "Band external rotation (light)", sets: 2, reps: 15 },
                { name: "Wrist curls/extensions", sets: 2, reps: "15 each" },
              ],
            },
          ],
          equipment: ["Barbell/DBs", "box", "football", "bands", "targets"],
        },

        friday: {
          title: "Power + QB Endurance Progression",
          type: "dual-track",
          duration: 105,
          warmup: "QB Enhanced Warm-Up (30 min)",

          blocks: [
            {
              title: "Block 1: Lower Body Power",
              duration: 20,
              exercises: [
                { name: "Box Jumps", sets: 4, reps: 4, rest: "2 min", boxHeight: "15 inches" },
                { name: "Medicine Ball Slams", sets: 4, reps: 8, rest: "90s" },
                { name: "Jump Squats", sets: 4, reps: 6, rest: "2 min" },
              ],
            },
            {
              title: "Block 2: QB Upper Body Power",
              duration: 15,
              qbSpecific: true,
              exercises: [
                {
                  name: "Medicine Ball Rotational Throws",
                  sets: 4,
                  reps: "10 each side",
                  rest: "90s",
                  load: "8 lbs",
                },
                {
                  name: "Push-Ups",
                  sets: 3,
                  reps: "15-18",
                  rest: "60s",
                },
                {
                  name: "Band Rows",
                  sets: 3,
                  reps: 15,
                  rest: "60s",
                },
              ],
            },
            {
              title: "Block 3: QB Throwing Endurance Building",
              duration: 30,
              qbSpecific: true,
              throwingVolume: "60-90 throws total",
              protocol: {
                warmUp: "Progressive warm-up (15 throws)",
                mainWork: {
                  name: "Continuous Throwing - Volume Increase",
                  throws: "50-70",
                  distance: "12-18 yards",
                  intensity: "65-70% effort",
                  rest: "Minimal between throws",
                  notes: "Focus on maintaining mechanics under increasing fatigue",
                },
                coolDown: "Light tosses (5 throws)",
              },
              notes: "Week 2: 60-90 total throws. Building endurance capacity",
            },
            {
              title: "Block 4: Arm Care",
              duration: 10,
              qbSpecific: true,
              exercises: [
                { name: "Sleeper stretch", sets: 3, duration: "60s each" },
                { name: "Shoulder mobility circuit", duration: "5 min" },
                { name: "Forearm stretching", duration: "3 min" },
              ],
            },
          ],
          equipment: ["Box", "medicine ball", "football", "bands"],
        },

        saturday: {
          title: "Sprint Work + QB Throwing Session",
          type: "dual-track",
          duration: 95,
          warmup: "QB Enhanced Warm-Up (30 min)",

          blocks: [
            {
              title: "Block 1: Sprint Acceleration",
              duration: 35,
              options: [
                {
                  condition: "Track available",
                  exercises: [
                    {
                      name: "Acceleration Mechanics",
                      sets: 8,
                      distance: "20m",
                      intensity: "80%",
                      rest: "2 min",
                    },
                    {
                      name: "Build-Up Runs",
                      sets: 5,
                      distance: "50m",
                      rest: "2.5 min",
                    },
                  ],
                },
                {
                  condition: "No track",
                  exercises: [
                    { name: "Wall Drills", sets: 5, duration: "30s each leg", rest: "90s" },
                    { name: "Resistance Band Sprints", sets: 8, duration: "15s", rest: "2 min" },
                  ],
                },
              ],
            },
            {
              title: "Block 2: QB Throwing Session - Technique & Accuracy",
              duration: 30,
              qbSpecific: true,
              throwingVolume: "25-35 throws",
              protocol: [
                {
                  phase: "Warm-up",
                  throws: 10,
                  notes: "Progressive 5y→25y",
                },
                {
                  phase: "Main Work",
                  drills: [
                    { name: "Footwork patterns", throws: "8-10", notes: "Various drops + throws" },
                    { name: "Moving pocket throws", throws: "5-8", notes: "Slide in pocket + throw" },
                    { name: "Accuracy challenge", throws: "8-10", notes: "Hit 8/10 targets" },
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
          title: "Complete Recovery (Lower + Upper)",
          type: "recovery",
          duration: 75,
          protocol: "QB-Enhanced Recovery Protocol",

          blocks: [
            {
              title: "Lower Body Recovery",
              duration: 25,
              exercises: [
                { name: "Lower body chain stretching", duration: "20 min" },
                { name: "Foam rolling - legs", duration: "10 min" },
              ],
            },
            {
              title: "Upper Body/QB Recovery Extended",
              duration: 35,
              qbSpecific: true,
              exercises: [
                {
                  name: "Shoulder mobility complex",
                  duration: "15 min",
                  protocol: [
                    "Sleeper stretch 4×75s each",
                    "Doorway pec stretch 3×75s",
                    "Cross-body stretch 3×60s each",
                    "Wall slides 3×15",
                    "Band pull-aparts 3×20",
                  ],
                },
                {
                  name: "Hip flexor flexibility",
                  duration: "12 min",
                  protocol: [
                    "Couch stretch 3×2min each",
                    "Kneeling hip flexor 2×90s each",
                  ],
                },
                {
                  name: "Thoracic mobility",
                  duration: "8 min",
                },
              ],
            },
            {
              title: "General Recovery",
              duration: 15,
              activities: [
                { name: "Light walk or easy bike", duration: "20 min" },
                { name: "Visualization", duration: "10 min" },
              ],
            },
          ],
        },
      },
      weekSummary: {
        totalThrows: "100-120",
        lowerBodySessions: 4,
        qbSpecificSessions: 6,
        focus: "Volume progression, throwing endurance building, arm care emphasis",
      },
    },

    week3: {
      weekNumber: 3,
      dateRange: "December 15-21, 2025",
      phase: "Foundation",
      focus: "Intensity increase + movement quality",
      throwingVolume: "120-150 throws total for week",
      days: {
        monday: {
          title: "Lower Body Strength Peak + QB Arm Strength",
          type: "dual-track",
          duration: 105,
          warmup: "QB Enhanced Warm-Up (30 min)",

          blocks: [
            {
              title: "Block 1: Lower Body - Posterior Chain Strength",
              duration: 25,
              exercises: [
                {
                  name: "RDLs",
                  sets: 5,
                  reps: 8,
                  rest: "2 min",
                  load: "32-35% BW",
                  notes: "Set increase, rep decrease for intensity",
                },
                {
                  name: "Nordic Curls (Reduced Assistance)",
                  sets: 4,
                  reps: "AMRAP",
                  rest: "2.5 min",
                  notes: "Aim for 4-6 reps with minimal assistance",
                },
                {
                  name: "Hip Thrusts",
                  sets: 4,
                  reps: 10,
                  rest: "90s",
                  load: "Moderate weight",
                },
              ],
            },
            {
              title: "Block 2: Lower Body - Quad Strength",
              duration: 20,
              exercises: [
                {
                  name: "Back Squats",
                  sets: 4,
                  reps: 8,
                  rest: "2 min",
                  load: "35-40% BW",
                },
                {
                  name: "Bulgarian Split Squats",
                  sets: 3,
                  reps: "8 each",
                  rest: "90s",
                  load: "Moderate DBs",
                },
                {
                  name: "Single-Leg Calf Raises",
                  sets: 4,
                  reps: "15 each",
                  rest: "60s",
                  tempo: "3s up, 3s down",
                },
              ],
            },
            {
              title: "Block 3: QB Arm Strength Peak",
              duration: 25,
              qbSpecific: true,
              exercises: [
                {
                  name: "Band External Rotation",
                  sets: 4,
                  reps: "15 each arm",
                  rest: "45s",
                  notes: "Heaviest band resistance of Foundation phase",
                },
                {
                  name: "Band Internal Rotation",
                  sets: 4,
                  reps: "15 each arm",
                  rest: "45s",
                },
                {
                  name: "I-Y-T Raises",
                  sets: 3,
                  reps: "12 each position",
                  rest: "60s",
                  load: "3-5 lbs",
                },
                {
                  name: "Face Pulls",
                  sets: 4,
                  reps: 20,
                  rest: "45s",
                },
                {
                  name: "Single-Arm DB Rows",
                  sets: 4,
                  reps: "10 each arm",
                  rest: "90s",
                  load: "Moderate-heavy",
                  notes: "Focus on explosive pull, controlled lower",
                },
                {
                  name: "Tricep Extensions",
                  sets: 3,
                  reps: 12,
                  rest: "60s",
                },
                {
                  name: "Wrist Curls + Extensions",
                  sets: 3,
                  reps: "15 each",
                  rest: "45s",
                },
              ],
            },
            {
              title: "Block 4: QB Core Strength",
              duration: 10,
              qbSpecific: true,
              exercises: [
                { name: "Plank Series", sets: 3, duration: "60s", rest: "60s" },
                { name: "Medicine Ball Rotational Throws", sets: 3, reps: "10 each side", rest: "60s", load: "10 lbs" },
                { name: "Anti-Rotation Press (Pallof Press)", sets: 3, reps: "10 each side", rest: "60s" },
              ],
            },
          ],
          equipment: ["Barbell/DBs", "bands", "medicine ball", "cable machine"],
        },

        tuesday: {
          title: "Sprint Mechanics Refinement + QB Mobility Peak",
          type: "dual-track",
          duration: 105,
          warmup: "QB Enhanced Warm-Up (30 min)",

          blocks: [
            {
              title: "Block 1: Advanced Sprint Drills",
              duration: 25,
              exercises: [
                { name: "A-Skip", sets: 4, distance: "30m", rest: "45s" },
                { name: "B-Skip", sets: 4, distance: "25m", rest: "60s" },
                { name: "C-Skip", sets: 3, distance: "20m", rest: "60s" },
                { name: "Ankling Drill", sets: 3, distance: "20m", rest: "45s" },
                { name: "Wall Sprint Drills", sets: 4, duration: "15s max effort", rest: "90s" },
              ],
            },
            {
              title: "Block 2: Extended Tempo Work",
              duration: 25,
              options: [
                {
                  condition: "Track available",
                  exercise: {
                    name: "Tempo Runs",
                    sets: 12,
                    distance: "100m",
                    intensity: "75%",
                    rest: "60s walk",
                  },
                },
                {
                  condition: "No track",
                  exercise: {
                    name: "Treadmill Tempo",
                    sets: 12,
                    duration: "2min",
                    rest: "1min walk",
                  },
                },
              ],
            },
            {
              title: "Block 3: QB Shoulder Mobility Peak",
              duration: 20,
              qbSpecific: true,
              exercises: [
                {
                  name: "Sleeper Stretch",
                  sets: 4,
                  duration: "90s each arm",
                  notes: "Peak duration for Foundation phase",
                },
                {
                  name: "Doorway Pec Stretch",
                  sets: 3,
                  duration: "90s each side",
                },
                {
                  name: "Wall Slides",
                  sets: 4,
                  reps: 15,
                  rest: "45s",
                },
                {
                  name: "Band Pull-Aparts",
                  sets: 4,
                  reps: 25,
                  rest: "30s",
                },
                {
                  name: "Cuban Press",
                  sets: 3,
                  reps: 10,
                  rest: "60s",
                  load: "5-8 lbs",
                },
                {
                  name: "Thoracic Extensions",
                  duration: "10 min",
                  notes: "Extended session for peak mobility",
                },
              ],
            },
            {
              title: "Block 4: Light Throwing",
              duration: 15,
              qbSpecific: true,
              throwingVolume: "20-25 throws",
              protocol: [
                { distance: "5-15 yards", throws: "10-12", intensity: "50-60%" },
                { distance: "20-30 yards", throws: "8-10", intensity: "70-75%" },
                { notes: "Increased distance from previous weeks" },
              ],
            },
          },
          equipment: ["Track or treadmill", "bands", "foam roller", "football", "light DBs"],
        },

        wednesday: {
          title: "Active Recovery + QB Flexibility Peak",
          type: "recovery/qb-specific",
          duration: 80,
          warmup: "Light movement (10 min)",

          blocks: [
            {
              title: "Block 1: Comprehensive Mobility",
              duration: 30,
              exercises: [
                {
                  name: "Hip Flexor Complex",
                  duration: "15 min",
                  exercises: [
                    { name: "Couch stretch", sets: 4, duration: "2 min each" },
                    { name: "Standing quad stretch", sets: 3, duration: "75s each" },
                  ],
                },
                {
                  name: "Hip Rotation Complex",
                  duration: "12 min",
                  exercises: [
                    { name: "Pigeon pose", sets: 3, duration: "2 min each" },
                    { name: "90/90 stretch", sets: 3, duration: "75s each" },
                    { name: "90/90 flow", reps: "20 transitions" },
                  ],
                },
              ],
            },
            {
              title: "Block 2: QB Back Strength Peak",
              duration: 25,
              qbSpecific: true,
              exercises: [
                {
                  name: "Single-Arm DB Rows",
                  sets: 4,
                  reps: "12 each arm",
                  rest: "75s",
                  load: "Moderate-heavy",
                },
                {
                  name: "Lat Pulldowns",
                  sets: 4,
                  reps: "10-12",
                  rest: "90s",
                },
                {
                  name: "Face Pulls",
                  sets: 4,
                  reps: 20,
                  rest: "45s",
                },
                {
                  name: "Bicep Curls (Eccentric)",
                  sets: 3,
                  reps: 10,
                  rest: "60s",
                  tempo: "1-0-4",
                },
                {
                  name: "Overhead Press (Light)",
                  sets: 3,
                  reps: 10,
                  rest: "75s",
                  load: "Conservative",
                  notes: "Shoulder strength for velocity",
                },
                {
                  name: "Thoracic Extension Work",
                  duration: "10 min",
                },
              ],
            },
            {
              title: "Block 3: Recovery Work",
              duration: 15,
              exercises: [
                { name: "Copenhagen Plank", sets: 3, duration: "30-40s each" },
                { name: "Foam Rolling Full Body", duration: "15 min" },
              ],
            },
          },
          equipment: ["Yoga mat", "foam roller", "DBs", "bands", "cable machine", "couch/bench"],
        },

        thursday: {
          title: "Lower Body Power + QB Throwing Peak Session",
          type: "dual-track",
          duration: 120,
          warmup: "QB Enhanced Warm-Up (30 min)",

          blocks: [
            {
              title: "Block 1: Heavy Lower Body Strength",
              duration: 25,
              exercises: [
                {
                  name: "Back Squats",
                  sets: 5,
                  reps: 6,
                  rest: "2.5 min",
                  load: "38-40% BW",
                  notes: "Peak load for Foundation phase",
                },
                {
                  name: "RDLs",
                  sets: 4,
                  reps: 8,
                  rest: "2 min",
                  load: "32-35% BW",
                },
                {
                  name: "Walking Lunges",
                  sets: 3,
                  reps: "12 each",
                  rest: "90s",
                  load: "Moderate DBs",
                },
              ],
            },
            {
              title: "Block 2: Advanced Plyometrics",
              duration: 25,
              exercises: [
                {
                  name: "Depth Drops (Introduction)",
                  sets: 4,
                  reps: 5,
                  rest: "2 min",
                  boxHeight: "6 inches",
                  notes: "Step off, stick landing",
                },
                {
                  name: "Box Jumps",
                  sets: 4,
                  reps: 4,
                  rest: "2 min",
                  boxHeight: "18 inches",
                },
                {
                  name: "Single-Leg Bounds",
                  sets: 4,
                  distance: "20m each",
                  rest: "2 min",
                },
              ],
            },
            {
              title: "Block 3: QB Peak Throwing Session",
              duration: 35,
              qbSpecific: true,
              throwingVolume: "50-65 throws",
              exercises: [
                {
                  name: "Progressive Throwing Warm-Up",
                  throws: 20,
                  protocol: "5y→10y→15y→20y→25y→30y",
                  notes: "Extended warm-up for peak session",
                },
                {
                  name: "Footwork + Throwing Mastery",
                  sets: 5,
                  reps: "5 throws each",
                  rest: "2 min",
                  drills: ["3-step", "5-step", "7-step", "Bootleg", "Sprint out"],
                  notes: "25 throws total. Full game simulation",
                },
                {
                  name: "Long Toss (Introduction)",
                  throws: "10-15",
                  protocol: "Progressive to 35+ yards",
                  notes: "Building arm strength",
                },
                {
                  name: "Accuracy Under Fatigue",
                  throws: "10-15",
                  notes: "Maintain mechanics while tired",
                },
              ],
            },
            {
              title: "Block 4: Comprehensive Arm Care",
              duration: 15,
              qbSpecific: true,
              exercises: [
                { name: "Light throwing cool-down", throws: "8-10 easy" },
                { name: "Sleeper Stretch", sets: 4, duration: "75s each" },
                { name: "Cross-body stretch", sets: 3, duration: "60s each" },
                { name: "Shoulder mobility circuit", duration: "5 min" },
                { name: "Forearm/wrist work", duration: "3 min" },
              ],
            },
          },
          equipment: ["Barbell/DBs", "boxes", "football", "bands", "targets"],
        },

        friday: {
          title: "Power Expression + QB Endurance Peak",
          type: "dual-track",
          duration: 110,
          warmup: "QB Enhanced Warm-Up (30 min)",

          blocks: [
            {
              title: "Block 1: Isometric Strength Introduction",
              duration: 15,
              exercises: [
                {
                  name: "Isometric Squat Holds (Quarter + Parallel)",
                  positions: [
                    { name: "Quarter squat", sets: 2, duration: "5s max" },
                    { name: "Parallel squat", sets: 2, duration: "5s max" },
                  ],
                  rest: "2.5 min",
                  notes: "85-90% effort",
                },
                {
                  name: "Isometric Deadlift Pulls",
                  sets: 3,
                  duration: "5s max",
                  rest: "2.5 min",
                },
              ],
            },
            {
              title: "Block 2: Explosive Power",
              duration: 20,
              exercises: [
                {
                  name: "Complex: Squat + Box Jump",
                  sets: 4,
                  protocol: "3 squats @ 35% → immediately 3 box jumps",
                  rest: "3 min",
                },
                {
                  name: "Medicine Ball Rotational Throws (QB)",
                  sets: 4,
                  reps: "10 each side",
                  rest: "90s",
                  load: "10 lbs",
                },
                {
                  name: "Broad Jumps",
                  sets: 4,
                  reps: 3,
                  rest: "2 min",
                  notes: "Max distance",
                },
              ],
            },
            {
              title: "Block 3: QB Throwing Endurance Peak",
              duration: 35,
              qbSpecific: true,
              throwingVolume: "80-100 throws total",
              protocol: {
                warmUp: "Progressive warm-up (20 throws)",
                mainWork: {
                  name: "Extended Endurance Session",
                  throws: "60-80",
                  distance: "15-20 yards",
                  intensity: "65-75% effort",
                  rest: "Minimal",
                  notes: "Peak volume for Foundation phase. Maintain mechanics under extended fatigue",
                },
                coolDown: "Light tosses (5-8 throws)",
              },
              notes: "Week 3 peak: 80-100 total throws. Preparing for tournament endurance",
            },
            {
              title: "Block 4: Extended Arm Care",
              duration: 10,
              qbSpecific: true,
              exercises: [
                { name: "Sleeper stretch", sets: 4, duration: "75s each" },
                { name: "Comprehensive shoulder mobility", duration: "8 min" },
              ],
            },
          },
          equipment: ["Squat rack", "box", "medicine ball", "football", "bands"],
        },

        saturday: {
          title: "Sprint Peak + QB Throwing Session",
          type: "dual-track",
          duration: 100,
          warmup: "QB Enhanced Warm-Up (30 min)",

          blocks: [
            {
              title: "Block 1: Sprint Acceleration Peak",
              duration: 40,
              options: [
                {
                  condition: "Track available",
                  exercises: [
                    {
                      name: "Acceleration Development",
                      sets: 10,
                      distance: "20m",
                      intensity: "85%",
                      rest: "2.5 min",
                    },
                    {
                      name: "Build-Up Runs",
                      sets: 5,
                      distance: "60m",
                      rest: "3 min",
                    },
                    {
                      name: "Flying 10s",
                      sets: 4,
                      protocol: "20m build + 10m sprint",
                      rest: "3 min",
                    },
                  ],
                },
                {
                  condition: "No track",
                  exercises: [
                    { name: "Wall Sprint Drills", sets: 5, duration: "20s max", rest: "2 min" },
                    { name: "Resistance Band Sprints", sets: 10, duration: "15s", rest: "2 min" },
                  ],
                },
              ],
            },
            {
              title: "Block 2: QB Throwing - Game Simulation",
              duration: 30,
              qbSpecific: true,
              throwingVolume: "30-40 throws",
              protocol: [
                {
                  phase: "Warm-up",
                  throws: 12,
                  notes: "Progressive to 30 yards",
                },
                {
                  phase: "Game Simulation",
                  drills: [
                    { name: "Quick game", throws: "8-10", notes: "3-step drops, quick release" },
                    { name: "Intermediate routes", throws: "8-10", notes: "5-step, 15-20 yards" },
                    { name: "Pressure situations", throws: "6-8", notes: "Throw under simulated pressure" },
                  ],
                },
                {
                  phase: "Cool-down",
                  throws: "4-6 easy",
                },
              ],
            },
          ],
          equipment: ["Track or wall space", "bands", "football", "targets"],
        },

        sunday: {
          title: "Recovery + Mental Prep for Assessment Week",
          type: "recovery",
          duration: 80,
          protocol: "QB-Enhanced Recovery + Assessment Preparation",

          blocks: [
            {
              title: "Lower Body Recovery",
              duration: 25,
              exercises: [
                { name: "Lower body chain stretching", duration: "25 min" },
                { name: "Foam rolling (comprehensive)", duration: "15 min" },
              ],
            },
            {
              title: "Upper Body/QB Recovery Extended",
              duration: 40,
              qbSpecific: true,
              exercises: [
                {
                  name: "Shoulder mobility comprehensive",
                  duration: "18 min",
                  protocol: [
                    "Sleeper stretch 4×90s each",
                    "Doorway pec 3×90s",
                    "Cross-body 3×60s each",
                    "Wall slides 3×15",
                    "Band pull-aparts 3×25",
                    "Cuban press light 2×10",
                  ],
                },
                {
                  name: "Hip flexor flexibility peak",
                  duration: "15 min",
                  protocol: [
                    "Couch stretch 4×2min each",
                    "Kneeling hip flexor 3×90s each",
                    "90/90 flow 20 transitions",
                  ],
                },
                {
                  name: "Thoracic mobility extended",
                  duration: "10 min",
                },
              ],
            },
            {
              title: "Mental Preparation",
              duration: 15,
              activities: [
                { name: "Light walk", duration: "20 min" },
                { name: "Visualization for Week 4 assessments", duration: "15 min" },
                { name: "Review Foundation phase progress", notes: "Reflect on improvements" },
              ],
            },
          },
        },
      },
      weekSummary: {
        totalThrows: "120-150",
        lowerBodySessions: 4,
        qbSpecificSessions: 6,
        focus: "Peak Foundation loads, throwing volume peak, comprehensive mobility work",
      },
    },

    week4: {
      weekNumber: 4,
      dateRange: "December 22-28, 2025",
      phase: "Foundation",
      focus: "Assessment week + deload for recovery",
      assessmentWeek: true,
      throwingVolume: "60-80 throws (assessment + deload)",
      days: {
        monday: {
          title: "QB Foundation Assessment - Strength & Power",
          type: "assessment",
          duration: 90,
          warmup: "Extended QB warm-up (35 min)",

          blocks: [
            {
              title: "Block 1: Lower Body Strength Assessment",
              duration: 30,
              exercises: [
                {
                  name: "Back Squat Assessment",
                  protocol: "Work up to 8RM at 40% BW",
                  rest: "3-4 min between sets",
                  notes: "Record weight and movement quality",
                },
                {
                  name: "RDL Assessment",
                  protocol: "Work up to 10RM within load limits",
                  rest: "3 min",
                },
                {
                  name: "Nordic Curl Test",
                  protocol: "Max reps unassisted (or minimum assistance)",
                  sets: 2,
                  rest: "3 min",
                  notes: "Record reps and assistance level",
                },
              ],
            },
            {
              title: "Block 2: Power Assessment",
              duration: 20,
              exercises: [
                {
                  name: "Vertical Jump Test",
                  sets: 3,
                  rest: "2 min",
                  notes: "Best of 3, record height",
                },
                {
                  name: "Broad Jump Test",
                  sets: 3,
                  rest: "2 min",
                  notes: "Best of 3, record distance",
                },
              ],
            },
            {
              title: "Block 3: QB Arm Strength Assessment",
              duration: 25,
              qbSpecific: true,
              exercises: [
                {
                  name: "Band External Rotation Max Resistance Test",
                  protocol: "Test max resistance for 12 reps each arm",
                  notes: "Record band resistance level",
                },
                {
                  name: "Single-Arm DB Row Assessment",
                  protocol: "Work up to 10RM each arm",
                  notes: "Record weight achieved",
                },
                {
                  name: "Tricep Extension Assessment",
                  protocol: "Work up to 12RM",
                  notes: "Record weight - triceps = 23% of velocity",
                },
                {
                  name: "Medicine Ball Rotational Throw Distance",
                  sets: 3,
                  notes: "Max distance each side, record best",
                },
              ],
            },
            {
              title: "Block 4: Core Endurance",
              duration: 15,
              qbSpecific: true,
              exercises: [
                {
                  name: "Plank Hold Test",
                  sets: 1,
                  notes: "Max hold, record time",
                },
                {
                  name: "Side Plank Test",
                  sets: 1,
                  notes: "Max hold each side",
                },
                {
                  name: "Anti-Rotation Press Endurance",
                  sets: 1,
                  notes: "Max reps each side with consistent form",
                },
              ],
            },
          ],
          equipment: ["Barbell", "DBs", "bands", "medicine ball", "measuring tape", "timer"],
          notes: "Record all results for comparison at Week 8 and Week 14",
        },

        tuesday: {
          title: "QB Foundation Assessment - Speed & Mobility",
          type: "assessment",
          duration: 85,
          warmup: "Extended QB warm-up (35 min)",

          blocks: [
            {
              title: "Block 1: Speed Testing (Same as WR/DB)",
              duration: 30,
              options: [
                {
                  condition: "Track/timing available",
                  exercises: [
                    {
                      name: "10-Yard Sprint",
                      attempts: 3,
                      rest: "3 min",
                      notes: "Best of 3, record time",
                    },
                    {
                      name: "20-Yard Sprint",
                      attempts: 3,
                      rest: "3 min",
                      notes: "Best of 3, record time",
                    },
                    {
                      name: "40-Yard Sprint",
                      attempts: 2,
                      rest: "4 min",
                      notes: "Best of 2, record time",
                    },
                  ],
                },
                {
                  condition: "No timing available",
                  exercises: [
                    {
                      name: "Sprint Mechanics Assessment",
                      notes: "Video analysis - dorsiflexion, knee drive, arm action",
                    },
                  ],
                },
              ],
            },
            {
              title: "Block 2: QB Mobility Assessment (CRITICAL)",
              duration: 25,
              qbSpecific: true,
              exercises: [
                {
                  name: "Shoulder External Rotation ROM Test",
                  protocol: "Measure external rotation degrees",
                  target: "110-130° (optimal for throwing)",
                  notes: "Record both arms, compare left/right",
                },
                {
                  name: "Horizontal Abduction Test",
                  protocol: "Measure horizontal abduction",
                  target: "45-55° (proper arm slot)",
                  notes: "Critical for throwing mechanics",
                },
                {
                  name: "Hip Flexor Flexibility Test (Thomas Test)",
                  protocol: "Lie supine, pull one knee to chest, assess other leg",
                  target: "Thigh below horizontal = good flexibility",
                  notes: "CRITICAL - tight hip flexors reduce velocity 15-20%",
                },
                {
                  name: "Couch Stretch Hold Time",
                  protocol: "Max comfortable hold each leg",
                  target: "90+ seconds",
                  notes: "Record time for each leg",
                },
                {
                  name: "Thoracic Extension Assessment",
                  protocol: "Measure thoracic extension ROM",
                  notes: "Thoracic extension adds 8-12 mph velocity",
                },
              ],
            },
            {
              title: "Block 3: Agility Testing",
              duration: 20,
              exercises: [
                {
                  name: "Pro Agility Test (5-10-5)",
                  attempts: 3,
                  rest: "3 min",
                  notes: "Best of 3, both starting directions",
                },
                {
                  name: "L-Drill Test",
                  attempts: 3,
                  rest: "3 min",
                  notes: "Best of 3, record time",
                },
              ],
            },
          ],
          equipment: ["Cones", "stopwatch/timing gates", "measuring tape", "goniometer"],
          notes: "QB mobility assessment is CRITICAL for velocity development",
        },

        wednesday: {
          title: "QB Throwing Assessment + Deload",
          type: "assessment/throwing",
          duration: 80,
          warmup: "QB Enhanced Warm-Up (30 min)",

          blocks: [
            {
              title: "Block 1: QB Throwing Velocity & Accuracy Assessment",
              duration: 35,
              qbSpecific: true,
              throwingVolume: "40-50 throws",
              assessments: [
                {
                  name: "Velocity Test",
                  throws: "10-12",
                  protocol: "Progressive warm-up, then max velocity throws from pocket",
                  distance: "15 yards",
                  notes: "Measure peak velocity with radar gun if available. Record best 3",
                },
                {
                  name: "Accuracy Under Fresh Conditions",
                  throws: "10-12",
                  protocol: "Hit targets at 10, 15, 20 yards",
                  notes: "Record accuracy percentage",
                },
                {
                  name: "Footwork Mechanics Assessment",
                  throws: "15-20",
                  drills: ["3-step drops", "5-step drops", "7-step drops", "Rollouts"],
                  notes: "Video analysis - assess mechanics quality",
                },
                {
                  name: "Light cool-down",
                  throws: "5-8 easy",
                },
              ],
              notes: "Baseline throwing assessment - compare to Week 8 and Week 14",
            },
            {
              title: "Block 2: Throwing Endurance Test",
              duration: 20,
              qbSpecific: true,
              throwingVolume: "20-30 throws",
              protocol: {
                name: "Sustained Throwing Test",
                throws: "20-30 continuous",
                distance: "15 yards",
                intensity: "70% effort",
                notes: "Assess mechanics breakdown under moderate fatigue. Track accuracy decline",
              },
              assessment: "Record when mechanics begin to break down, accuracy percentage",
            },
            {
              title: "Block 3: Comprehensive Arm Care",
              duration: 15,
              qbSpecific: true,
              exercises: [
                { name: "Light throwing cool-down", throws: "8-10 easy" },
                { name: "Sleeper Stretch", sets: 4, duration: "90s each" },
                { name: "Full shoulder mobility circuit", duration: "10 min" },
                { name: "Forearm/wrist recovery", duration: "5 min" },
              ],
            },
          },
          equipment: ["Football", "targets", "radar gun (optional)", "video camera"],
          notes: "Foundation throwing baseline - record all metrics for future comparison",
        },

        thursday: {
          title: "Active Recovery + QB Mobility Focus",
          type: "recovery/qb-specific",
          duration: 70,
          warmup: "Light movement (10 min)",

          blocks: [
            {
              title: "Block 1: Comprehensive Mobility",
              duration: 30,
              exercises: [
                { name: "Full hip mobility circuit", duration: "15 min" },
                { name: "Ankle and calf work", duration: "8 min" },
                { name: "Dynamic stretching", duration: "7 min" },
              ],
            },
            {
              title: "Block 2: QB-Specific Mobility Extended",
              duration: 25,
              qbSpecific: true,
              exercises: [
                {
                  name: "Shoulder mobility complex",
                  duration: "12 min",
                  protocol: [
                    "Sleeper stretch 4×90s each",
                    "Doorway pec 3×90s",
                    "Wall slides 3×15",
                  ],
                },
                {
                  name: "Hip flexor work",
                  duration: "13 min",
                  protocol: [
                    "Couch stretch 4×2min each",
                    "Kneeling hip flexor 3×90s each",
                  ],
                },
              ],
            },
            {
              title: "Block 3: Light Movement",
              duration: 15,
              activities: [
                { name: "Easy bike or walk", duration: "20 min", intensity: "Very light" },
                { name: "Foam rolling", duration: "15 min" },
              ],
            },
          },
          notes: "Reflect on Foundation phase progress. Review assessment results",
        },

        friday: {
          title: "Deload - Light Lower Body + QB Work",
          type: "deload",
          duration: 65,
          warmup: "Light QB warm-up (20 min)",

          blocks: [
            {
              title: "Block 1: Light Strength (50-60% of Week 3 loads)",
              duration: 20,
              exercises: [
                {
                  name: "Goblet Squats",
                  sets: 3,
                  reps: 8,
                  rest: "90s",
                  load: "Light",
                  notes: "Focus on quality",
                },
                {
                  name: "RDLs",
                  sets: 3,
                  reps: 8,
                  rest: "90s",
                  load: "Light (50-60% of Week 3)",
                },
                {
                  name: "Hip Thrusts",
                  sets: 3,
                  reps: 12,
                  rest: "75s",
                  load: "Bodyweight or very light",
                },
              ],
            },
            {
              title: "Block 2: QB Light Arm Work",
              duration: 15,
              qbSpecific: true,
              exercises: [
                {
                  name: "Band External Rotation (Light)",
                  sets: 2,
                  reps: "15 each",
                  rest: "45s",
                  notes: "Light resistance, focus on form",
                },
                {
                  name: "I-Y-T Raises (Light)",
                  sets: 2,
                  reps: "10 each position",
                  rest: "60s",
                  load: "Bodyweight or 2 lbs",
                },
                {
                  name: "Face Pulls",
                  sets: 2,
                  reps: 15,
                  rest: "45s",
                },
              ],
            },
            {
              title: "Block 3: Movement Quality",
              duration: 15,
              exercises: [
                {
                  name: "Nordic Curls (Assisted)",
                  sets: 2,
                  reps: "Easy reps",
                  rest: "2 min",
                },
                {
                  name: "Single-leg balance work",
                  sets: 2,
                  duration: "30s each",
                },
                {
                  name: "Ankle mobility circuit",
                  duration: "5 min",
                },
              ],
            },
            {
              title: "Block 4: Light Throwing (Optional)",
              duration: 15,
              qbSpecific: true,
              throwingVolume: "15-25 throws",
              protocol: [
                { distance: "5-15 yards", throws: "15-25", intensity: "40-50%" },
                { notes: "Very light, focus on mechanics only" },
              ],
            },
          },
          equipment: ["Light DBs", "bands", "football (optional)"],
          notes: "Recovery week - movement quality, not intensity",
        },

        saturday: {
          title: "Deload - Light Movement + Throwing",
          type: "deload",
          duration: 60,
          warmup: "Light QB warm-up (20 min)",

          blocks: [
            {
              title: "Block 1: Light Plyometrics",
              duration: 15,
              exercises: [
                {
                  name: "Box Step-Ups",
                  sets: 3,
                  reps: 8,
                  rest: "90s",
                  boxHeight: "Low",
                },
                {
                  name: "Broad Jumps",
                  sets: 3,
                  reps: 3,
                  rest: "90s",
                  notes: "Submaximal effort",
                },
              ],
            },
            {
              title: "Block 2: Sprint Drill Quality",
              duration: 15,
              exercises: [
                {
                  name: "A-march, A-skip only",
                  sets: 3,
                  distance: "20m",
                  notes: "Perfect mechanics",
                },
              ],
            },
            {
              title: "Block 3: Light QB Throwing (Optional)",
              duration: 20,
              qbSpecific: true,
              throwingVolume: "0-20 throws",
              protocol: [
                { distance: "5-15 yards", throws: "0-20", intensity: "40-50%" },
                { notes: "Optional. If arm feels good, light throwing. Otherwise rest" },
              ],
            },
            {
              title: "Block 4: Core Maintenance",
              duration: 10,
              exercises: [
                {
                  name: "Core stability circuit",
                  rounds: 2,
                  exercises: ["Plank 30s", "Side plank 20s each", "Dead bugs 10 each"],
                },
              ],
            },
          },
          equipment: ["Low box", "bands", "football (optional)"],
          notes: "Optional session. Complete rest if feeling fatigued",
        },

        sunday: {
          title: "Recovery + Preparation for Strength Phase",
          type: "recovery",
          duration: 75,
          protocol: "Complete QB Recovery + Mental Preparation",

          blocks: [
            {
              title: "Lower Body Recovery",
              duration: 25,
              exercises: [
                { name: "Lower body chain stretching", duration: "25 min" },
                { name: "Foam rolling (full body)", duration: "20 min" },
              ],
            },
            {
              title: "Upper Body/QB Recovery Comprehensive",
              duration: 35,
              qbSpecific: true,
              exercises: [
                {
                  name: "Shoulder mobility complete protocol",
                  duration: "18 min",
                  protocol: [
                    "Sleeper stretch 4×90s each",
                    "Doorway pec 3×90s",
                    "Cross-body 3×60s each",
                    "Wall slides 3×15",
                    "Band pull-aparts 3×20",
                    "Cuban press 2×10 (light)",
                  ],
                },
                {
                  name: "Hip flexor flexibility complete protocol",
                  duration: "17 min",
                  protocol: [
                    "Couch stretch 4×2min each",
                    "Kneeling hip flexor 3×90s each",
                    "Standing quad stretch 2×60s each",
                    "90/90 flow 20 transitions",
                  ],
                },
              ],
            },
            {
              title: "Mental Preparation for Strength Phase",
              duration: 15,
              activities: [
                { name: "Light walk", duration: "20 min" },
                { name: "Review Foundation phase achievements", duration: "10 min" },
                { name: "Set goals for Strength phase (Weeks 5-8)", duration: "10 min" },
                { name: "Visualization for increased throwing volume", duration: "10 min" },
              ],
            },
          },
          notes: "Prepare for Strength Development phase. Review all assessment results.",
        },
      },
      weekSummary: {
        totalThrows: "60-80 (assessment + deload)",
        assessments: [
          "Strength: Squats, RDLs, Nordic curls, power jumps",
          "QB arm strength: Band resistance, rows, triceps, rotational throws",
          "Speed: 10/20/40-yard sprints, Pro Agility, L-Drill",
          "QB mobility: Shoulder ROM, hip flexor flexibility (CRITICAL)",
          "Throwing: Velocity, accuracy, endurance, mechanics quality",
        ],
        lowerBodySessions: 3,
        qbSpecificSessions: 5,
        focus: "Baseline assessment, deload for recovery, Foundation phase completion",
      },
      phaseSummary: {
        title: "Foundation Phase Complete (Weeks 1-4)!",
        achievements: [
          "Established lower body foundation (posterior chain, quads, ankles)",
          "Developed QB arm strength and rotator cuff stability",
          "Built shoulder mobility and hip flexor flexibility foundation",
          "Introduction to throwing endurance (80-150 throws/week)",
          "Developed back strength for throwing power (lats = 18% of power)",
          "Baseline assessments completed for all major categories",
        ],
        keyMetrics: {
          totalThrows: "300-440 throws over 4 weeks",
          progressiveVolume: "Week 1: 80-120, Week 2: 100-120, Week 3: 120-150",
          armStrength: "Band resistance progressed, rotator cuff strengthened",
          mobility: "Shoulder ROM improved, hip flexors loosened (critical for velocity)",
        },
        nextPhase: {
          name: "Strength Development (Weeks 5-8)",
          focus: [
            "Maximum strength building (higher loads)",
            "Increased throwing volume (150-250 throws/week)",
            "Advanced arm strength work",
            "Long toss introduction for velocity",
            "Throwing endurance progression toward 320-throw goal",
            "Maximal isometric contractions",
            "Sprint intensity increase",
          ],
          throwingProgression: {
            week5: "150-180 throws",
            week6: "180-220 throws",
            week7: "220-250 throws",
            week8: "Assessment + partial deload",
          },
        },
      },
    },
  },
};

export default QB_TRAINING_PROGRAM;
