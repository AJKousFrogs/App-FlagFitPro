// Complete Flag Football Offseason Training Program Data
// 14-Week WR/DB Performance Optimization Program
// November 17, 2025 - February 28, 2026

export const TRAINING_PROGRAM = {
  programInfo: {
    title: "COMPLETE FLAG FOOTBALL OFFSEASON TRAINING PROGRAM",
    subtitle: "WR/DB PERFORMANCE OPTIMIZATION",
    duration: "14 Weeks",
    startDate: "2025-11-17",
    endDate: "2026-02-28",
    frequency: "5-6 days/week",
    sessionDuration: "60-90 minutes",
    loadLimit: "Maximum 40% body weight external resistance",
  },

  phases: {
    foundation: {
      title: "Foundation Phase",
      weeks: "1-4",
      dateRange: "December 1-28, 2025",
      goals: [
        "Build structural strength and movement quality",
        "Establish posterior chain foundation (Nordic curls, RDLs)",
        "Develop aerobic base (tempo running)",
        "Learn sprint mechanics (drill work)",
        "Optimize lower body chain health",
        "Introduction to isometric training",
      ],
      priorities: [
        "Build posterior chain strength (Nordic curls, RDLs, hip thrusts)",
        "Establish sprint mechanics (drill work 3-4x/week)",
        "Develop aerobic base (tempo work)",
        "Lower body chain health (comprehensive activation)",
        "Learn isometric positions (80-85% effort)",
      ],
    },
    strength: {
      title: "Strength Development",
      weeks: "5-8",
      dateRange: "January 5 - February 1, 2026",
      goals: [
        "Build maximum strength (heavy loads)",
        "Increase sprint volume and intensity",
        "Advanced plyometric work (depth jumps, reactive bounds)",
        "Repeated sprint ability development",
        "Maximal isometric contractions",
        "Enhanced change of direction",
      ],
      priorities: [
        "Maximum strength (heavy squats, deadlifts, isometrics)",
        "Increase sprint volume (if indoor space available)",
        "Power development (bounds, jumps)",
        "Repeated sprint introduction",
        "Isometrics at max effort (95-100%)",
      ],
    },
    power: {
      title: "Power Phase",
      weeks: "9-12",
      dateRange: "February 2-28, 2026",
      goals: [
        "Convert strength to explosive power",
        "Reactive abilities at maximum",
        "Game-specific conditioning peak",
        "Multi-directional power",
        "Competition preparation",
        "Outdoor transition begins (late phase)",
      ],
      priorities: [
        "Convert strength to explosive power",
        "Game-specific conditioning (RSA training)",
        "Reactive abilities (change of direction)",
        "Resisted/assisted sprints",
        "Complex training methods",
      ],
    },
    competition: {
      title: "Competition Prep",
      weeks: "13-14",
      dateRange: "March 2-15, 2026",
      goals: [
        "Outdoor transition complete",
        "Peak power maintenance",
        "Volume reduction (taper)",
        "Competition simulation",
        "Mental preparation",
        "Physical freshness for competition",
      ],
      priorities: [
        "Outdoor sprint transition",
        "Peak power maintenance",
        "Volume reduction (taper)",
        "Competition simulation",
        "Final preparation",
      ],
    },
  },

  dailyProtocols: {
    morningMobility: {
      title: "15 Minute Full Body DAILY Mobility Routine",
      duration: 15,
      exercises: [
        { name: "Hip Circles", duration: "10 each direction" },
        { name: "Leg Swings (all directions)", duration: "10 each" },
        { name: "Ankle Circles", duration: "10 each direction" },
        { name: "Dynamic Quad Stretches", duration: "30s each" },
        { name: "Walking Lunges", duration: "10 each leg" },
        { name: "World's Greatest Stretch", duration: "5 each side" },
        { name: "Glute Bridges", duration: "2x10" },
        { name: "Bodyweight Squats", duration: "10 reps" },
      ],
    },
    universalWarmup: {
      title: "Universal Warm-Up (Every Session)",
      duration: "15-20 minutes",
      phases: [
        {
          title: "Phase 1: General Activation",
          duration: 5,
          exercises: [
            { name: "Light jog", duration: "2 minutes" },
            { name: "Jump rope", duration: "2 minutes" },
            { name: "Dynamic stretching", duration: "1 minute" },
          ],
        },
        {
          title: "Phase 2: Lower Body Chain Activation",
          duration: 10,
          sections: [
            {
              title: "Ankle Complex",
              duration: 2,
              exercises: [
                { name: "Ankle circles", reps: "10 each direction" },
                { name: "Calf raises", sets: "2x10" },
                { name: "Tibialis raises", sets: "2x10" },
                { name: "Single-leg balance", duration: "20s each" },
              ],
            },
            {
              title: "Knee Stability",
              duration: 2,
              exercises: [
                { name: "Mini-band walks", sets: "2x10" },
                { name: "Single-leg mini squats", sets: "2x6 each" },
              ],
            },
            {
              title: "Hip Complex",
              duration: 3,
              exercises: [
                { name: "Hip circles", reps: "10 each direction" },
                { name: "Leg swings (all directions)", reps: "10 each" },
                { name: "Glute bridges", sets: "2x10" },
              ],
            },
            {
              title: "Quadriceps Prep",
              duration: 3,
              exercises: [
                { name: "Walking lunges", reps: "10 each leg" },
                { name: "Dynamic quad stretches", duration: "30s each" },
                { name: "Bodyweight squats", reps: "10 reps" },
              ],
            },
          ],
        },
        {
          title: "Phase 3: Sprint Drill Series",
          duration: 5,
          exercises: [
            { name: "A-march", sets: "2x20m" },
            { name: "A-skip", sets: "2x20m" },
            { name: "B-skip", sets: "2x20m" },
            { name: "C-skip", sets: "2x20m" },
            { name: "High knees", sets: "2x20m" },
            { name: "Butt kicks", sets: "2x20m" },
            { name: "Scissors", sets: "2x20m" },
            { name: "Toy soldiers", sets: "2x20m" },
            { name: "Hamstring stretch", duration: "30s each" },
          ],
        },
      ],
    },
    sundayRecovery: {
      title: "Sunday Recovery Protocol",
      duration: "45-60 minutes",
      sections: [
        {
          title: "Lower Body Chain Recovery",
          exercises: [
            { name: "Calf stretching", sets: "3x45s" },
            { name: "Tibialis stretching", sets: "2x30s" },
            { name: "Quad stretching", sets: "3x45s" },
            { name: "Hamstring stretching", sets: "3x45s" },
            { name: "Hip flexor stretching", sets: "4x45s" },
            { name: "Couch stretch", sets: "2x90s each" },
            { name: "Pigeon pose", sets: "2x90s each" },
            { name: "90/90 hip stretches", sets: "2x60s each position" },
            { name: "World's greatest stretch", sets: "2x5 each side" },
          ],
        },
        {
          title: "Additional Recovery",
          activities: [
            { name: "Foam rolling", duration: "15 minutes" },
            { name: "Light walk", duration: "20 minutes" },
            { name: "Visualization/mental training", duration: "10 minutes" },
            { name: "Compression therapy", optional: true },
            { name: "Massage gun", optional: true },
            { name: "TENS/EMS", optional: true },
          ],
        },
      ],
    },
  },

  volumeGuidelines: {
    sprint: {
      "weeks1-4": "40-60 ground contacts/week (if indoor available)",
      "weeks5-8": "80-120 ground contacts/week",
      "weeks9-12": "120-180 ground contacts/week",
      "weeks13-14": "80-100 ground contacts/week (taper)",
    },
    plyometric: {
      "weeks1-4": "60-80 contacts/session, 2x/week",
      "weeks5-8": "80-120 contacts/session, 2-3x/week",
      "weeks9-12": "120-160 contacts/session, 3x/week",
      "weeks13-14": "60-80 contacts/session, 2x/week (taper)",
    },
    strength: {
      "weeks1-4": "3-4 sets × 8-12 reps (volume accumulation)",
      "weeks5-8": "4-5 sets × 5-8 reps (strength building)",
      "weeks9-12": "3-5 sets × 3-6 reps (power expression)",
      "weeks13-14": "2-3 sets × 3-5 reps (maintenance)",
    },
  },
};

// Weekly Schedule Templates for each phase
export const WEEKLY_SCHEDULES = {
  foundation: {
    week1: {
      weekNumber: 1,
      dateRange: "December 1-7, 2025",
      phase: "Foundation",
      days: {
        monday: {
          title: "Lower Body Foundation + Posterior Chain Introduction",
          type: "strength",
          duration: 65,
          warmup: "Standard Protocol (15 min) + Lower Body Chain (10 min)",
          blocks: [
            {
              title: "Block 1: Posterior Chain Introduction",
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
                  notes:
                    "Use resistance band for assistance. Control descent for 3-5 seconds. Even 1-2 reps is progress",
                },
                {
                  name: "Hip Thrusts",
                  sets: 3,
                  reps: 12,
                  rest: "90s",
                  load: "Bodyweight or light",
                  notes: "Full hip extension, squeeze glutes at top",
                },
              ],
            },
            {
              title: "Block 2: Quad/Ankle Foundation",
              duration: 15,
              exercises: [
                {
                  name: "Goblet Squats",
                  sets: 3,
                  reps: 10,
                  rest: "90s",
                  notes: "Focus on depth and control",
                },
                {
                  name: "Single-Leg Calf Raises",
                  sets: 3,
                  reps: "12 each",
                  rest: "60s",
                  tempo: "2s up, 2s down",
                },
                {
                  name: "Tibialis Raises",
                  sets: 3,
                  reps: 15,
                  rest: "45s",
                },
              ],
            },
            {
              title: "Block 3: Core",
              duration: 15,
              exercises: [
                {
                  name: "Plank Series",
                  sets: 3,
                  duration: "45s",
                  rest: "60s",
                },
                {
                  name: "Side Planks",
                  sets: 2,
                  duration: "30s each",
                  rest: "45s",
                },
              ],
            },
          ],
          equipment: [
            "Barbell/dumbbells (15-25 lbs)",
            "resistance bands",
            "elevated surface",
          ],
        },
        tuesday: {
          title: "Sprint Mechanics + Conditioning Introduction",
          type: "sprint",
          duration: 65,
          warmup: "Standard Protocol (15 min)",
          blocks: [
            {
              title: "Block 1: Sprint Drill Series",
              duration: 20,
              exercises: [
                {
                  name: "A-March",
                  sets: 3,
                  distance: "20m",
                  rest: "45s",
                  notes: "Proper knee drive, dorsiflexed ankle",
                },
                {
                  name: "A-Skip",
                  sets: 3,
                  distance: "20m",
                  rest: "45s",
                  notes: "Progress from march to skip",
                },
                {
                  name: "High Knees",
                  sets: 3,
                  distance: "20m",
                  rest: "45s",
                },
                {
                  name: "Butt Kicks",
                  sets: 3,
                  distance: "20m",
                  rest: "45s",
                },
                {
                  name: "Fast Leg Drill",
                  sets: 3,
                  duration: "15s",
                  rest: "60s",
                },
                {
                  name: "Wall Drills",
                  sets: 3,
                  duration: "20s each leg",
                  rest: "60s",
                  notes: "Drive position against wall",
                },
              ],
            },
            {
              title: "Block 2: Tempo Running",
              duration: 20,
              options: [
                {
                  condition: "Indoor/outdoor track available",
                  exercise: {
                    name: "Tempo Runs",
                    sets: 8,
                    distance: "100m",
                    intensity: "70% effort",
                    rest: "90s walk",
                  },
                },
                {
                  condition: "No track",
                  exercise: {
                    name: "Treadmill Tempo",
                    sets: 8,
                    duration: "2min",
                    intensity: "comfortable pace",
                    rest: "1min walk",
                  },
                },
              ],
            },
            {
              title: "Block 3: Ankle Work",
              duration: 10,
              exercises: [
                {
                  name: "Bilateral Pogos",
                  sets: 3,
                  duration: "20s",
                  rest: "60s",
                },
                {
                  name: "Jump Rope Singles",
                  sets: 3,
                  duration: "1min",
                  rest: "45s",
                },
              ],
            },
          ],
          equipment: ["Indoor track or treadmill", "jump rope", "wall space"],
        },
        wednesday: {
          title: "Active Recovery + Mobility",
          type: "recovery",
          duration: 50,
          warmup: "Light movement (10 min)",
          blocks: [
            {
              title: "Block 1: Movement Quality",
              duration: 20,
              exercises: [
                {
                  name: "World's Greatest Stretch",
                  sets: 2,
                  reps: "5 each side",
                },
                {
                  name: "90/90 Hip Stretches",
                  sets: 2,
                  duration: "60s each position",
                },
                {
                  name: "Couch Stretch",
                  sets: 2,
                  duration: "90s each leg",
                },
                {
                  name: "Pigeon Pose",
                  sets: 2,
                  duration: "90s each side",
                },
              ],
            },
            {
              title: "Block 2: Lower Body Chain Maintenance",
              duration: 20,
              exercises: [
                {
                  name: "Light Hip Thrusts",
                  sets: 2,
                  reps: 15,
                  load: "bodyweight",
                },
                {
                  name: "Glute Bridges",
                  sets: 2,
                  reps: 20,
                },
                {
                  name: "Band Walks",
                  sets: 2,
                  reps: "15 each direction",
                },
                {
                  name: "Ankle Mobility Circuit",
                  duration: "5 minutes",
                },
                {
                  name: "Foam Rolling",
                  duration: "10 minutes",
                  focus: "Full body",
                },
              ],
            },
          ],
          equipment: ["Yoga mat", "foam roller", "resistance bands"],
        },
        thursday: {
          title: "Lower Body Strength + Plyometric Introduction",
          type: "strength",
          duration: 65,
          warmup: "Standard Protocol (15 min) + Lower Body Chain (10 min)",
          blocks: [
            {
              title: "Block 1: Strength Foundation",
              duration: 20,
              exercises: [
                {
                  name: "Back Squats or Goblet Squats",
                  sets: 4,
                  reps: 8,
                  rest: "2 min",
                  load: "30-40% BW for back squats",
                  notes: "Focus on depth and control",
                },
                {
                  name: "Bulgarian Split Squats",
                  sets: 3,
                  reps: "8 each",
                  rest: "90s",
                  notes: "Front leg does the work",
                },
                {
                  name: "Single-Leg RDLs",
                  sets: 3,
                  reps: "8 each",
                  rest: "75s",
                  notes: "Balance and hamstring stretch",
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
                  notes: "Focus on sticking the landing",
                },
                {
                  name: "Lateral Bounds (small)",
                  sets: 3,
                  reps: "8 each direction",
                  rest: "75s",
                },
              ],
            },
            {
              title: "Block 3: Posterior Chain",
              duration: 15,
              exercises: [
                {
                  name: "Nordic Curls (Assisted)",
                  sets: 3,
                  reps: "AMRAP",
                  rest: "2 min",
                },
                {
                  name: "Glute-Ham Raises or Back Extensions",
                  sets: 3,
                  reps: 10,
                  rest: "90s",
                },
              ],
            },
          ],
          equipment: ["Barbell/dumbbells", "low box", "space for jumps"],
        },
        friday: {
          title: "Power Introduction + Quick Feet",
          type: "power",
          duration: 65,
          warmup: "Standard Protocol (15 min) + Sprint Drills (5 min)",
          blocks: [
            {
              title: "Block 1: Power Development",
              duration: 20,
              exercises: [
                {
                  name: "Box Jumps",
                  sets: 4,
                  reps: 4,
                  rest: "2 min",
                  boxHeight: "12 inches",
                  notes: "Focus on height and landing control",
                },
                {
                  name: "Medicine Ball Slams",
                  sets: 4,
                  reps: 6,
                  rest: "90s",
                  notes: "Explosive hip extension",
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
              title: "Block 2: Quick Feet & Agility",
              duration: 20,
              exercises: [
                {
                  name: "Ladder Drills",
                  variations: [
                    { name: "2-foot run", sets: 3, duration: "20s" },
                    {
                      name: "Lateral shuffle",
                      sets: 3,
                      duration: "20s each direction",
                    },
                    { name: "Icky shuffle", sets: 3, duration: "20s" },
                  ],
                  rest: "60s between",
                },
                {
                  name: "Cone Weave",
                  sets: 4,
                  duration: "30s",
                  rest: "75s",
                },
                {
                  name: "First Step Drills",
                  sets: 8,
                  distance: "5 yards",
                  rest: "45s",
                  variations: "various starts",
                },
              ],
            },
            {
              title: "Block 3: Upper Body Push/Pull",
              duration: 10,
              exercises: [
                {
                  name: "Push-Ups",
                  sets: 3,
                  reps: "10-15",
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
          ],
          equipment: [
            "Box",
            "medicine ball (8-12 lbs)",
            "agility ladder",
            "cones",
            "bands",
          ],
        },
        saturday: {
          title: "Sprint Work",
          type: "sprint",
          duration: 45,
          options: [
            {
              title: "Option A: Indoor Track/Turf Available",
              warmup: "15 min + Full Sprint Drill Series (10 min)",
              mainTraining: {
                duration: 30,
                exercises: [
                  {
                    name: "Acceleration Mechanics",
                    sets: 6,
                    distance: "20m",
                    intensity: "75%",
                    rest: "2 min",
                    notes:
                      "Focus on first 10 yards (drive phase). Cue: Push the ground away",
                  },
                  {
                    name: "Build-Up Runs",
                    sets: 4,
                    distance: "40m",
                    rest: "2 min",
                    notes: "Progressive acceleration",
                  },
                ],
              },
              cooldown: "10 min walk + light stretching",
            },
            {
              title: "Option B: No Indoor Space",
              duration: 45,
              exercises: [
                {
                  name: "Wall Drills",
                  sets: 4,
                  duration: "30s each leg",
                  rest: "90s",
                },
                {
                  name: "A-March to A-Run Progression",
                  sets: 4,
                  distance: "30m",
                  rest: "90s",
                },
                {
                  name: "B-Skip",
                  sets: 4,
                  distance: "20m",
                  rest: "90s",
                },
                {
                  name: "Wicket Walk-Throughs",
                  sets: 3,
                  reps: "10 hurdles",
                  optional: true,
                },
                {
                  name: "Resistance Band Sprint Simulation",
                  sets: 6,
                  duration: "10s",
                  rest: "2 min",
                },
                {
                  name: "First Step Explosions",
                  sets: 10,
                  reps: "3 steps",
                  rest: "60s",
                  notes: "3-step acceleration",
                },
              ],
            },
          ],
          equipment: [
            "Wall space",
            "resistance bands",
            "mini hurdles (optional)",
          ],
        },
        sunday: {
          title: "Recovery Day",
          type: "recovery",
          duration: 45,
          protocol: "Complete Recovery Protocol",
          activities: [
            { name: "Lower body chain stretching", duration: "20 min" },
            { name: "Foam rolling", duration: "15 min" },
            { name: "Light walk", duration: "20 min" },
            { name: "Visualization", duration: "10 min" },
          ],
        },
      },
    },
  },
};

// Exercise Library with detailed instructions
export const EXERCISE_LIBRARY = {
  "Nordic Curls": {
    category: "Posterior Chain",
    primaryMuscles: ["Hamstrings"],
    secondaryMuscles: ["Glutes", "Core"],
    equipment: ["Resistance band (for assistance)", "Partner or anchor"],
    setup: "Kneel on a soft surface with ankles secured or held by partner",
    execution: [
      "Start in tall kneeling position",
      "Slowly lower body forward while keeping hips extended",
      "Control the descent for 3-5 seconds",
      "Use hands to push back to starting position",
      "Use band assistance as needed",
    ],
    coaching: [
      "Keep hips extended throughout movement",
      "Control the negative (eccentric) portion",
      "Even 1-2 reps is excellent progress",
      "This is THE exercise for hamstring strength and injury prevention",
    ],
    progressions: [
      "Band-assisted full range",
      "Band-assisted partial range",
      "Unassisted partial range",
      "Unassisted full range",
      "Weighted full range",
    ],
    safetyNotes: [
      "Start with band assistance",
      "Never force the range of motion",
      "Stop if you feel any strain in lower back",
    ],
  },

  "RDLs (Romanian Deadlifts)": {
    category: "Posterior Chain",
    primaryMuscles: ["Hamstrings", "Glutes"],
    secondaryMuscles: ["Lower back", "Core"],
    equipment: ["Barbell", "Dumbbells", "or Kettlebell"],
    setup: "Stand with feet hip-width apart, holding weight",
    execution: [
      "Start standing tall with slight knee bend",
      "Hinge at hips, pushing hips back",
      "Lower weight while maintaining flat back",
      "Feel stretch in hamstrings",
      "Drive hips forward to return to start",
    ],
    coaching: [
      "Hip hinge movement, not squat",
      "Keep weight close to legs",
      "Maintain neutral spine",
      "Feel the stretch in hamstrings",
    ],
    progressions: [
      "Bodyweight hip hinge",
      "Light dumbbell RDL",
      "Barbell RDL",
      "Single-leg RDL",
    ],
    safetyNotes: [
      "Never round the back",
      "Start light and focus on form",
      "Stop at comfortable hamstring stretch",
    ],
  },

  "Hip Thrusts": {
    category: "Posterior Chain",
    primaryMuscles: ["Glutes"],
    secondaryMuscles: ["Hamstrings", "Core"],
    equipment: ["Bench", "Barbell/Dumbbells (optional)"],
    setup: "Upper back against bench, feet flat on floor",
    execution: [
      "Sit with upper back against bench",
      "Place feet flat, knees bent 90 degrees",
      "Drive through heels to lift hips",
      "Squeeze glutes at top",
      "Lower with control",
    ],
    coaching: [
      "Full hip extension at top",
      "Squeeze glutes hard",
      "Don't hyperextend back",
      "Drive through heels",
    ],
    progressions: [
      "Bodyweight hip thrust",
      "Single-leg hip thrust",
      "Loaded hip thrust",
      "Banded hip thrust",
    ],
  },
};

// Performance Testing Protocols
export const PERFORMANCE_TESTS = {
  "40-Yard Sprint": {
    category: "Speed",
    equipment: ["Stopwatch", "Measuring tape", "Cones"],
    setup: [
      "Mark 40-yard distance",
      "Use electronic timing if available",
      "Ensure proper surface (track or turf preferred)",
    ],
    protocol: [
      "Complete thorough warm-up (20+ minutes)",
      "3 practice runs at 75-80%",
      "Rest 5 minutes",
      "3 maximum effort trials",
      "4-5 minutes rest between trials",
      "Record best time",
    ],
    norms: {
      elite: "< 4.40",
      excellent: "4.40-4.50",
      good: "4.50-4.65",
      average: "4.65-4.80",
      "needs work": "> 4.80",
    },
  },

  "Vertical Jump": {
    category: "Power",
    equipment: ["Vertec or wall", "Measuring tape"],
    setup: [
      "Stand against wall or Vertec",
      "Record standing reach height",
      "Clear area for jumping",
    ],
    protocol: [
      "Warm-up with light jumping",
      "Record standing reach",
      "3 practice jumps",
      "3 maximum effort jumps",
      "2-3 minutes rest between max efforts",
      "Record best jump height",
    ],
    norms: {
      elite: "> 35 inches",
      excellent: "30-35 inches",
      good: "25-30 inches",
      average: "20-25 inches",
      "needs work": "< 20 inches",
    },
  },

  "Broad Jump": {
    category: "Power",
    equipment: ["Measuring tape", "Non-slip surface"],
    setup: [
      "Clear landing area",
      "Mark starting line",
      "Ensure safe landing surface",
    ],
    protocol: [
      "Warm-up with light jumping",
      "3 practice jumps at 80%",
      "3 maximum effort jumps",
      "2-3 minutes rest between max efforts",
      "Measure from take-off to heel of closest landing point",
      "Record best distance",
    ],
    norms: {
      elite: "> 10 feet",
      excellent: "9.5-10 feet",
      good: "9-9.5 feet",
      average: "8.5-9 feet",
      "needs work": "< 8.5 feet",
    },
  },
};

// Nutrition Guidelines
export const NUTRITION_GUIDELINES = {
  dailyFramework: {
    trainingDays: {
      breakfast: {
        timing: "2 hours pre-training",
        components: [
          "Complex carbs: Oatmeal, rice, sweet potato",
          "Protein: Eggs, Greek yogurt",
          "Fats: Nuts, avocado",
        ],
        example: "3 eggs + oatmeal with berries + almond butter",
      },
      preTraining: {
        timing: "30-60 min before",
        components: [
          "Simple carbs: Banana, rice cakes",
          "Light protein: Protein shake",
        ],
        example: "Banana + small protein shake",
      },
      duringTraining: {
        components: ["Water with electrolytes", "BCAAs (optional)"],
      },
      postTraining: {
        timing: "within 30 min",
        components: [
          "Fast-acting protein: Whey shake",
          "Simple carbs: Fruit, honey",
        ],
        example: "Protein shake + banana",
      },
      lunch: {
        timing: "2-3 hours post-training",
        components: [
          "Lean protein: Chicken, fish, lean beef",
          "Complex carbs: Rice, quinoa, pasta",
          "Vegetables: Variety of colors",
        ],
        example: "Grilled chicken + brown rice + broccoli",
      },
      dinner: {
        components: [
          "Lean protein",
          "Complex carbs (adjust based on next day)",
          "Vegetables",
          "Healthy fats",
        ],
      },
      beforeBed: {
        components: ["Slow-digesting protein: Casein, cottage cheese"],
        example: "Greek yogurt or cottage cheese",
      },
    },
    restDays: {
      adjustments: [
        "Slightly reduce carbs",
        "Maintain protein intake",
        "Increase healthy fats",
        "Focus on recovery foods",
      ],
    },
  },

  hydration: {
    dailyMinimum: "3-4 liters water",
    training: {
      pre: "16-20 oz (1-2 hours before)",
      during: "8 oz every 15-20 min",
      post: "24 oz per pound lost",
    },
    monitoring: "Monitor urine color (pale yellow)",
  },
};

export default TRAINING_PROGRAM;
