// ⚠️ DEPRECATED: This file has been split into separate modules
// Use: import { TRAINING_PROGRAM, WEEKLY_SCHEDULES, etc. } from './data/training/index.js'
// This file is kept for backward compatibility only

// Re-export from split modules
export {
  TRAINING_PROGRAM,
  WEEKLY_SCHEDULES,
  ANNUAL_TRAINING_PROGRAM,
  EXERCISE_LIBRARY,
  PERFORMANCE_TESTS,
  // NUTRITION_GUIDELINES removed - unused export
  default
} from './data/training/index.js';

// Original code below (kept for reference, will be removed in future version)
/*
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

    week2: {
      weekNumber: 2,
      dateRange: "December 8-14, 2025",
      phase: "Foundation",
      focus: "Volume progression and technique refinement",
      days: {
        monday: {
          title: "Lower Body Strength + Posterior Chain Volume",
          type: "strength",
          duration: 70,
          warmup: "Standard Protocol (15 min) + Lower Body Chain (10 min)",
          blocks: [
            {
              title: "Block 1: Posterior Chain Development",
              duration: 22,
              exercises: [
                {
                  name: "RDLs (Romanian Deadlifts)",
                  sets: 4,
                  reps: 10,
                  rest: "90s",
                  load: "28-32% BW",
                  notes:
                    "Slight load increase from Week 1. Focus on hamstring stretch",
                },
                {
                  name: "Nordic Curls (Assisted)",
                  sets: 4,
                  reps: "AMRAP",
                  rest: "2 min",
                  notes:
                    "Add 4th set. Aim for more reps or less assistance than Week 1",
                },
                {
                  name: "Hip Thrusts",
                  sets: 4,
                  reps: 12,
                  rest: "90s",
                  load: "Light weight or weighted",
                  notes: "Can add light weight if bodyweight is easy",
                },
              ],
            },
            {
              title: "Block 2: Quad/Ankle Strength",
              duration: 18,
              exercises: [
                {
                  name: "Goblet Squats or Back Squats",
                  sets: 4,
                  reps: 10,
                  rest: "90s",
                  load: "30-35% BW if using barbell",
                  notes: "Can transition to barbell if comfortable",
                },
                {
                  name: "Walking Lunges",
                  sets: 3,
                  reps: "12 each leg",
                  rest: "90s",
                  notes: "Focus on depth and control",
                },
                {
                  name: "Single-Leg Calf Raises",
                  sets: 3,
                  reps: "15 each",
                  rest: "60s",
                  tempo: "2s up, 2s down",
                },
                {
                  name: "Tibialis Raises",
                  sets: 3,
                  reps: 20,
                  rest: "45s",
                  notes: "Volume increase",
                },
              ],
            },
            {
              title: "Block 3: Core Stability",
              duration: 15,
              exercises: [
                {
                  name: "Plank Series",
                  sets: 3,
                  duration: "50s",
                  rest: "60s",
                },
                {
                  name: "Side Planks",
                  sets: 3,
                  duration: "35s each",
                  rest: "45s",
                },
                {
                  name: "Dead Bugs",
                  sets: 2,
                  reps: "10 each side",
                  rest: "45s",
                },
              ],
            },
          ],
          equipment: [
            "Barbell/dumbbells",
            "resistance bands",
            "elevated surface",
          ],
        },
        tuesday: {
          title: "Sprint Mechanics + Tempo Conditioning",
          type: "sprint",
          duration: 70,
          warmup: "Standard Protocol (15 min) + Sprint Drills (5 min)",
          blocks: [
            {
              title: "Block 1: Sprint Drill Progression",
              duration: 22,
              exercises: [
                {
                  name: "A-March",
                  sets: 3,
                  distance: "25m",
                  rest: "45s",
                  notes: "Increased distance from Week 1",
                },
                {
                  name: "A-Skip",
                  sets: 3,
                  distance: "25m",
                  rest: "45s",
                },
                {
                  name: "B-Skip",
                  sets: 3,
                  distance: "20m",
                  rest: "60s",
                  notes: "Focus on pawing action",
                },
                {
                  name: "High Knees",
                  sets: 3,
                  distance: "25m",
                  rest: "45s",
                },
                {
                  name: "Butt Kicks",
                  sets: 3,
                  distance: "25m",
                  rest: "45s",
                },
                {
                  name: "Wall Drills",
                  sets: 4,
                  duration: "25s each leg",
                  rest: "60s",
                  notes: "Volume and duration increase",
                },
              ],
            },
            {
              title: "Block 2: Tempo Running",
              duration: 22,
              options: [
                {
                  condition: "Indoor/outdoor track available",
                  exercise: {
                    name: "Tempo Runs",
                    sets: 10,
                    distance: "100m",
                    intensity: "70-75% effort",
                    rest: "75s walk",
                    notes: "2 more sets than Week 1",
                  },
                },
                {
                  condition: "No track",
                  exercise: {
                    name: "Treadmill Tempo",
                    sets: 10,
                    duration: "2min",
                    intensity: "comfortable pace",
                    rest: "1min walk",
                  },
                },
              ],
            },
            {
              title: "Block 3: Reactive Ankle Work",
              duration: 12,
              exercises: [
                {
                  name: "Bilateral Pogos",
                  sets: 4,
                  duration: "25s",
                  rest: "60s",
                },
                {
                  name: "Jump Rope Singles",
                  sets: 4,
                  duration: "1min",
                  rest: "45s",
                },
              ],
            },
          ],
          equipment: ["Indoor track or treadmill", "jump rope", "wall space"],
        },
        wednesday: {
          title: "Active Recovery + Lower Body Chain Focus",
          type: "recovery",
          duration: 55,
          warmup: "Light movement (10 min)",
          blocks: [
            {
              title: "Block 1: Hip Mobility Emphasis",
              duration: 25,
              exercises: [
                {
                  name: "Hip Flexor Stretching",
                  sets: 3,
                  duration: "60s each side",
                  notes: "Critical for sprint mechanics",
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
                {
                  name: "90/90 Hip Stretches",
                  sets: 2,
                  duration: "60s each position",
                },
                {
                  name: "World's Greatest Stretch",
                  sets: 2,
                  reps: "5 each side",
                },
              ],
            },
            {
              title: "Block 2: Activation + Recovery",
              duration: 20,
              exercises: [
                {
                  name: "Light Hip Thrusts",
                  sets: 2,
                  reps: 20,
                  load: "bodyweight",
                },
                {
                  name: "Glute Bridges",
                  sets: 2,
                  reps: 25,
                },
                {
                  name: "Band Walks",
                  sets: 2,
                  reps: "20 each direction",
                },
                {
                  name: "Copenhagen Plank",
                  sets: 2,
                  duration: "20-30s each side",
                  notes: "Groin injury prevention",
                },
                {
                  name: "Foam Rolling",
                  duration: "10 minutes",
                  focus: "Hamstrings, quads, calves, hips",
                },
              ],
            },
          ],
          equipment: ["Yoga mat", "foam roller", "resistance bands", "bench"],
        },
        thursday: {
          title: "Lower Body Power + Plyometric Progression",
          type: "strength",
          duration: 70,
          warmup: "Standard Protocol (15 min) + Lower Body Chain (10 min)",
          blocks: [
            {
              title: "Block 1: Strength Building",
              duration: 22,
              exercises: [
                {
                  name: "Back Squats",
                  sets: 4,
                  reps: 8,
                  rest: "2 min",
                  load: "32-38% BW",
                  notes: "Slight load increase, focus on speed",
                },
                {
                  name: "Bulgarian Split Squats",
                  sets: 3,
                  reps: "10 each",
                  rest: "90s",
                  load: "Light DBs in hands",
                  notes: "Can add light weight",
                },
                {
                  name: "Single-Leg RDLs",
                  sets: 3,
                  reps: "10 each",
                  rest: "75s",
                  load: "Light DB optional",
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
                  notes: "Height increase if ready. STEP DOWN",
                },
                {
                  name: "Broad Jumps",
                  sets: 4,
                  reps: 5,
                  rest: "90s",
                  notes: "Focus on distance, measure progress",
                },
                {
                  name: "Lateral Bounds",
                  sets: 3,
                  reps: "10 each direction",
                  rest: "90s",
                },
                {
                  name: "Tuck Jumps",
                  sets: 3,
                  reps: 6,
                  rest: "90s",
                  notes: "Pull knees to chest",
                },
              ],
            },
            {
              title: "Block 3: Posterior Chain Finisher",
              duration: 13,
              exercises: [
                {
                  name: "Nordic Curls",
                  sets: 3,
                  reps: "AMRAP",
                  rest: "2 min",
                },
                {
                  name: "Glute-Ham Raises",
                  sets: 3,
                  reps: 12,
                  rest: "90s",
                },
              ],
            },
          ],
          equipment: ["Barbell/dumbbells", "plyo box", "space for jumps"],
        },
        friday: {
          title: "Explosive Power + Agility Progression",
          type: "power",
          duration: 70,
          warmup: "Standard Protocol (15 min) + Sprint Drills (5 min)",
          blocks: [
            {
              title: "Block 1: Isometric Introduction",
              duration: 15,
              exercises: [
                {
                  name: "Isometric Squat Holds (Quarter Squat)",
                  sets: 3,
                  duration: "4s max effort",
                  rest: "2 min",
                  load: "Submaximal",
                  notes:
                    "Push UP into bar with 80-85% effort. Introduction to isometrics",
                },
                {
                  name: "Isometric Deadlift Pull (Below Knee)",
                  sets: 3,
                  duration: "4s max effort",
                  rest: "2 min",
                  notes: "Pull UP maximally into pins",
                },
              ],
            },
            {
              title: "Block 2: Power Development",
              duration: 20,
              exercises: [
                {
                  name: "Box Jumps",
                  sets: 4,
                  reps: 4,
                  rest: "2 min",
                  boxHeight: "15 inches",
                  notes: "Explosive intent",
                },
                {
                  name: "Medicine Ball Slams",
                  sets: 4,
                  reps: 8,
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
              title: "Block 3: Agility Work",
              duration: 20,
              exercises: [
                {
                  name: "Pro Agility Drill (5-10-5)",
                  sets: 4,
                  rest: "2 min",
                  notes: "Low on changes of direction",
                },
                {
                  name: "Ladder Drills",
                  variations: [
                    { name: "2-foot run", sets: 3 },
                    { name: "Lateral shuffle", sets: 3 },
                    { name: "Icky shuffle", sets: 3 },
                    { name: "In-in-out-out", sets: 3 },
                  ],
                  rest: "60s between",
                },
                {
                  name: "First Step Drills",
                  sets: 10,
                  distance: "5 yards",
                  rest: "45s",
                },
              ],
            },
          ],
          equipment: [
            "Squat rack",
            "box",
            "medicine ball",
            "agility ladder",
            "cones",
          ],
        },
        saturday: {
          title: "Sprint Work + Acceleration",
          type: "sprint",
          duration: 50,
          options: [
            {
              title: "Option A: Indoor Track/Turf Available",
              warmup: "15 min + Full Sprint Drill Series (10 min)",
              mainTraining: {
                duration: 35,
                exercises: [
                  {
                    name: "Acceleration Mechanics",
                    sets: 8,
                    distance: "20m",
                    intensity: "80%",
                    rest: "2 min",
                    notes:
                      "Intensity increase from Week 1. Volume increase to 8 sets",
                  },
                  {
                    name: "Build-Up Runs",
                    sets: 5,
                    distance: "50m",
                    rest: "2.5 min",
                    notes: "Progressive acceleration, increased distance",
                  },
                  {
                    name: "First-Step Explosions",
                    sets: 6,
                    distance: "10m",
                    rest: "90s",
                    notes: "Maximum effort first 3 steps",
                  },
                ],
              },
              cooldown: "10 min walk + stretching",
            },
            {
              title: "Option B: No Indoor Space",
              warmup: "15 min + Sprint Drills (10 min)",
              duration: 50,
              exercises: [
                {
                  name: "Wall Drills",
                  sets: 5,
                  duration: "30s each leg",
                  rest: "90s",
                },
                {
                  name: "A-March to A-Run Progression",
                  sets: 5,
                  distance: "30m",
                  rest: "90s",
                },
                {
                  name: "B-Skip",
                  sets: 5,
                  distance: "25m",
                  rest: "90s",
                },
                {
                  name: "Resistance Band Sprint Simulation",
                  sets: 8,
                  duration: "15s",
                  rest: "2 min",
                  notes: "Increased duration",
                },
                {
                  name: "First Step Explosions",
                  sets: 12,
                  reps: "3 steps",
                  rest: "60s",
                },
              ],
            },
          ],
          equipment: ["Wall space", "resistance bands", "cones"],
        },
        sunday: {
          title: "Recovery Day",
          type: "recovery",
          duration: 50,
          protocol: "Complete Recovery Protocol",
          activities: [
            { name: "Lower body chain stretching", duration: "25 min" },
            { name: "Foam rolling (full body)", duration: "15 min" },
            { name: "Light walk or bike", duration: "20 min" },
            { name: "Visualization", duration: "10 min" },
          ],
        },
      },
    },

    week3: {
      weekNumber: 3,
      dateRange: "December 15-21, 2025",
      phase: "Foundation",
      focus: "Intensity increase and movement quality",
      days: {
        monday: {
          title: "Lower Body Strength + Posterior Chain Emphasis",
          type: "strength",
          duration: 72,
          warmup: "Standard Protocol (15 min) + Lower Body Chain (10 min)",
          blocks: [
            {
              title: "Block 1: Posterior Chain Strength",
              duration: 25,
              exercises: [
                {
                  name: "RDLs (Romanian Deadlifts)",
                  sets: 5,
                  reps: 8,
                  rest: "2 min",
                  load: "32-35% BW",
                  notes: "Set increase, rep decrease for intensity",
                },
                {
                  name: "Nordic Curls (Less Assistance)",
                  sets: 4,
                  reps: "AMRAP",
                  rest: "2.5 min",
                  notes: "Reduce band assistance. Aim for 4-6 reps minimum",
                },
                {
                  name: "Hip Thrusts",
                  sets: 4,
                  reps: 10,
                  rest: "90s",
                  load: "Moderate weight",
                  notes: "Heavier than Week 2",
                },
              ],
            },
            {
              title: "Block 2: Quad Strength",
              duration: 20,
              exercises: [
                {
                  name: "Back Squats",
                  sets: 4,
                  reps: 8,
                  rest: "2 min",
                  load: "35-40% BW",
                  notes: "Approaching max load limit",
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
                  notes: "Slower tempo for strength",
                },
                {
                  name: "Tibialis Raises",
                  sets: 4,
                  reps: 20,
                  rest: "45s",
                },
              ],
            },
            {
              title: "Block 3: Core Strength",
              duration: 12,
              exercises: [
                {
                  name: "Plank Series",
                  sets: 3,
                  duration: "60s",
                  rest: "60s",
                },
                {
                  name: "Side Planks",
                  sets: 3,
                  duration: "40s each",
                  rest: "45s",
                },
                {
                  name: "Dead Bugs",
                  sets: 3,
                  reps: "12 each side",
                  rest: "45s",
                },
              ],
            },
          ],
          equipment: [
            "Barbell/dumbbells",
            "resistance bands",
            "elevated surface",
          ],
        },
        tuesday: {
          title: "Sprint Mechanics Refinement + Conditioning",
          type: "sprint",
          duration: 72,
          warmup: "Standard Protocol (15 min) + Extended Sprint Drills (7 min)",
          blocks: [
            {
              title: "Block 1: Advanced Sprint Drills",
              duration: 25,
              exercises: [
                {
                  name: "A-Skip",
                  sets: 4,
                  distance: "30m",
                  rest: "45s",
                  notes: "Distance increase, focus on dorsiflexion",
                },
                {
                  name: "B-Skip",
                  sets: 4,
                  distance: "25m",
                  rest: "60s",
                  notes: "Pawing emphasis",
                },
                {
                  name: "C-Skip",
                  sets: 3,
                  distance: "20m",
                  rest: "60s",
                  notes: "Cycling action",
                },
                {
                  name: "Ankling Drill",
                  sets: 3,
                  distance: "20m",
                  rest: "45s",
                },
                {
                  name: "Wall Sprint Drills",
                  sets: 4,
                  duration: "15s max effort",
                  rest: "90s",
                  notes: "Maximum frequency",
                },
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
                    intensity: "75% effort",
                    rest: "60s walk",
                    notes: "Volume peak for Foundation phase",
                  },
                },
                {
                  condition: "No track",
                  exercise: {
                    name: "Treadmill Tempo",
                    sets: 12,
                    duration: "2min",
                    intensity: "steady pace",
                    rest: "1min walk",
                  },
                },
              ],
            },
            {
              title: "Block 3: Reactive Drills",
              duration: 12,
              exercises: [
                {
                  name: "Pogos (Bilateral → Single-Leg)",
                  variations: [
                    { name: "Bilateral pogos", sets: 3, duration: "30s" },
                    {
                      name: "Single-leg pogos",
                      sets: 2,
                      duration: "15s each",
                      notes: "Introduction",
                    },
                  ],
                  rest: "60s between",
                },
                {
                  name: "Jump Rope Double-Unders",
                  sets: 3,
                  reps: "10-20",
                  rest: "60s",
                  notes: "Advanced option if capable",
                },
              ],
            },
          ],
          equipment: ["Track or treadmill", "jump rope", "wall space"],
        },
        wednesday: {
          title: "Active Recovery + Mobility Emphasis",
          type: "recovery",
          duration: 60,
          warmup: "Light movement (10 min)",
          blocks: [
            {
              title: "Block 1: Comprehensive Mobility",
              duration: 30,
              exercises: [
                {
                  name: "Hip Flexor Complex",
                  duration: "10 min",
                  exercises: [
                    { name: "Couch stretch", sets: 3, duration: "90s each" },
                    {
                      name: "Standing quad stretch",
                      sets: 2,
                      duration: "60s each",
                    },
                  ],
                },
                {
                  name: "Hip Rotation Complex",
                  duration: "10 min",
                  exercises: [
                    { name: "Pigeon pose", sets: 2, duration: "90s each" },
                    { name: "90/90 stretch", sets: 2, duration: "60s each" },
                    { name: "90/90 flow", reps: "10 transitions" },
                  ],
                },
                {
                  name: "Ankle/Calf Mobility",
                  duration: "8 min",
                  exercises: [
                    { name: "Calf stretching", sets: 3, duration: "60s each" },
                    { name: "Ankle circles", reps: "20 each direction" },
                    {
                      name: "Dorsiflexion stretches",
                      sets: 2,
                      duration: "45s each",
                    },
                  ],
                },
              ],
            },
            {
              title: "Block 2: Light Activation + Recovery",
              duration: 20,
              exercises: [
                {
                  name: "Glute Activation Circuit",
                  rounds: 2,
                  exercises: [
                    { name: "Glute bridges", reps: 20 },
                    { name: "Band walks", reps: "20 each direction" },
                    { name: "Single-leg glute bridges", reps: "10 each" },
                  ],
                },
                {
                  name: "Copenhagen Plank",
                  sets: 3,
                  duration: "25-35s each side",
                },
                {
                  name: "Foam Rolling Full Body",
                  duration: "15 min",
                },
              ],
            },
          ],
          equipment: ["Yoga mat", "foam roller", "bands", "bench"],
        },
        thursday: {
          title: "Lower Body Power + Advanced Plyometrics",
          type: "strength",
          duration: 75,
          warmup: "Standard Protocol (15 min) + Plyometric Prep (10 min)",
          blocks: [
            {
              title: "Block 1: Heavy Strength",
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
                  notes:
                    "Step off, stick landing, hold 3s. Focus on absorption",
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
                  distance: "20m each leg",
                  rest: "2 min",
                  notes: "Max distance per bound",
                },
                {
                  name: "Hurdle Hops",
                  sets: 3,
                  reps: "6 hurdles",
                  rest: "90s",
                  hurdleHeight: "6-12 inches",
                },
              ],
            },
            {
              title: "Block 3: Posterior Chain",
              duration: 15,
              exercises: [
                {
                  name: "Nordic Curls",
                  sets: 4,
                  reps: "AMRAP",
                  rest: "2 min",
                },
                {
                  name: "Hip Thrusts",
                  sets: 3,
                  reps: 12,
                  rest: "90s",
                  load: "Moderate-Heavy",
                },
              ],
            },
          ],
          equipment: [
            "Barbell/dumbbells",
            "plyo boxes",
            "mini hurdles",
            "space",
          ],
        },
        friday: {
          title: "Power Expression + Change of Direction",
          type: "power",
          duration: 75,
          warmup: "Standard Protocol (15 min) + Sprint Drills (7 min)",
          blocks: [
            {
              title: "Block 1: Isometric Strength",
              duration: 15,
              exercises: [
                {
                  name: "Isometric Squat Holds (Quarter + Parallel)",
                  positions: [
                    {
                      name: "Quarter squat",
                      sets: 2,
                      duration: "5s max effort",
                    },
                    {
                      name: "Parallel squat",
                      sets: 2,
                      duration: "5s max effort",
                    },
                  ],
                  rest: "2.5 min between sets",
                  notes: "85-90% effort. Progressing intensity",
                },
                {
                  name: "Isometric Deadlift Pulls",
                  sets: 3,
                  duration: "5s max effort",
                  rest: "2.5 min",
                },
              ],
            },
            {
              title: "Block 2: Explosive Power",
              duration: 25,
              exercises: [
                {
                  name: "Complex: Squat + Box Jump",
                  sets: 4,
                  protocol: "3 squats @ 35% BW → immediately 3 box jumps",
                  rest: "3 min",
                  notes: "Introduction to complex training",
                },
                {
                  name: "Medicine Ball Rotational Throws",
                  sets: 4,
                  reps: "8 each side",
                  rest: "90s",
                  notes: "Maximum explosiveness",
                },
                {
                  name: "Broad Jumps",
                  sets: 4,
                  reps: 3,
                  rest: "2 min",
                  notes: "Max distance, measure and record",
                },
              ],
            },
            {
              title: "Block 3: Advanced Agility",
              duration: 20,
              exercises: [
                {
                  name: "Pro Agility (Timed)",
                  sets: 5,
                  rest: "2.5 min",
                  notes: "Record best time",
                },
                {
                  name: "L-Drill (3-Cone)",
                  sets: 4,
                  rest: "2 min",
                  notes: "Focus on sharp cuts",
                },
                {
                  name: "Reactive Cone Drills",
                  sets: 6,
                  duration: "20s",
                  rest: "90s",
                  notes: "Partner calls directions",
                },
              ],
            },
          ],
          equipment: [
            "Squat rack",
            "box",
            "medicine ball",
            "cones",
            "stopwatch",
          ],
        },
        saturday: {
          title: "Sprint Acceleration Work",
          type: "sprint",
          duration: 55,
          options: [
            {
              title: "Option A: Track Available",
              warmup: "15 min + Full Sprint Drill Series (12 min)",
              mainTraining: {
                duration: 40,
                exercises: [
                  {
                    name: "Acceleration Development",
                    sets: 10,
                    distance: "20m",
                    intensity: "85%",
                    rest: "2.5 min",
                    notes: "Volume peak for Foundation. Focus on drive phase",
                  },
                  {
                    name: "Build-Up Runs",
                    sets: 5,
                    distance: "60m",
                    rest: "3 min",
                    notes: "Progressive acceleration to 90%",
                  },
                  {
                    name: "Flying 10s",
                    sets: 4,
                    protocol: "20m build-up + 10m sprint",
                    rest: "3 min",
                    notes: "Introduction to max velocity work",
                  },
                ],
              },
              cooldown: "10 min",
            },
            {
              title: "Option B: No Track",
              warmup: "15 min + Sprint Drills (12 min)",
              exercises: [
                {
                  name: "Wall Sprint Drills",
                  sets: 5,
                  duration: "20s max effort",
                  rest: "2 min",
                },
                {
                  name: "Resistance Band Sprints",
                  sets: 10,
                  duration: "15s",
                  rest: "2 min",
                  notes: "Maximum effort against resistance",
                },
                {
                  name: "First Step + Acceleration",
                  sets: 8,
                  distance: "10m",
                  rest: "2 min",
                  notes: "Maximum effort 0-10m",
                },
              ],
            },
          ],
          equipment: ["Track or wall space", "resistance bands", "cones"],
        },
        sunday: {
          title: "Recovery Day",
          type: "recovery",
          duration: 55,
          protocol: "Complete Recovery Protocol",
          activities: [
            { name: "Lower body chain stretching", duration: "25 min" },
            { name: "Foam rolling (comprehensive)", duration: "20 min" },
            { name: "Light walk or easy bike", duration: "20 min" },
            {
              name: "Visualization/mental prep for Week 4 testing",
              duration: "10 min",
            },
          ],
        },
      },
    },

    week4: {
      weekNumber: 4,
      dateRange: "December 22-28, 2025",
      phase: "Foundation",
      focus: "Assessment week + deload for recovery",
      assessmentWeek: true,
      days: {
        monday: {
          title: "Foundation Phase Assessment - Strength Testing",
          type: "assessment",
          duration: 75,
          warmup: "Extended warm-up (20 min) + Lower Body Chain (12 min)",
          blocks: [
            {
              title: "Block 1: Strength Assessments",
              duration: 30,
              exercises: [
                {
                  name: "Back Squat Assessment",
                  protocol:
                    "Work up to 8RM at 40% BW (or max within load limit)",
                  rest: "3-4 min between sets",
                  notes: "Record weight and quality of movement",
                },
                {
                  name: "RDL Assessment",
                  protocol: "Work up to 10RM within load limits",
                  rest: "3 min between sets",
                },
                {
                  name: "Nordic Curl Test",
                  protocol: "Max reps unassisted (or minimum band assistance)",
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
                {
                  name: "Box Jump Assessment",
                  protocol: "Max comfortable height with control",
                  attempts: 3,
                  notes: "Must stick landing",
                },
              ],
            },
            {
              title: "Block 3: Core Endurance",
              duration: 15,
              exercises: [
                {
                  name: "Plank Hold Test",
                  sets: 1,
                  notes: "Max hold with perfect form. Record time",
                },
                {
                  name: "Side Plank Test",
                  sets: 1,
                  notes: "Max hold each side. Record time",
                },
                {
                  name: "Copenhagen Plank Test",
                  sets: 1,
                  notes: "Max hold each side",
                },
              ],
            },
          ],
          equipment: [
            "Barbell",
            "measuring tape",
            "jump mat or chalk",
            "timer",
          ],
          notes: "Record all results for comparison at future assessments",
        },
        tuesday: {
          title: "Foundation Phase Assessment - Speed & Agility",
          type: "assessment",
          duration: 70,
          warmup: "Extended warm-up (20 min) + Sprint Drill Series (15 min)",
          blocks: [
            {
              title: "Block 1: Speed Testing",
              duration: 30,
              options: [
                {
                  condition: "Track/timing available",
                  exercises: [
                    {
                      name: "10-Yard Sprint",
                      attempts: 3,
                      rest: "3 min",
                      notes: "Best of 3. Record time",
                    },
                    {
                      name: "20-Yard Sprint",
                      attempts: 3,
                      rest: "3 min",
                      notes: "Best of 3. Record time",
                    },
                    {
                      name: "40-Yard Sprint",
                      attempts: 2,
                      rest: "4 min",
                      notes: "Best of 2. Record time",
                    },
                  ],
                },
                {
                  condition: "No timing available",
                  exercises: [
                    {
                      name: "Sprint Mechanics Assessment",
                      notes:
                        "Video analysis of mechanics. Check for dorsiflexion, knee drive, arm action",
                    },
                    {
                      name: "Acceleration Drill Quality",
                      sets: 4,
                      distance: "20m",
                      notes: "Assess improvement in mechanics from Week 1",
                    },
                  ],
                },
              ],
            },
            {
              title: "Block 2: Agility Testing",
              duration: 25,
              exercises: [
                {
                  name: "Pro Agility Test (5-10-5)",
                  attempts: 3,
                  rest: "3 min",
                  notes:
                    "Best of 3. Record time. Test both starting directions",
                },
                {
                  name: "L-Drill Test",
                  attempts: 3,
                  rest: "3 min",
                  notes: "Best of 3. Record time",
                },
                {
                  name: "Reactive Agility Test",
                  protocol: "Partner-called directional changes",
                  attempts: 3,
                  rest: "2 min",
                },
              ],
            },
          ],
          equipment: ["Cones", "stopwatch/timing gates", "measuring tape"],
          notes: "Baseline testing to track improvements in Strength phase",
        },
        wednesday: {
          title: "Active Recovery + Reflection",
          type: "recovery",
          duration: 60,
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
              title: "Block 2: Light Movement",
              duration: 20,
              exercises: [
                {
                  name: "Easy bike or walk",
                  duration: "20 min",
                  intensity: "Very light",
                },
                {
                  name: "Foam rolling",
                  duration: "15 min",
                },
              ],
            },
          ],
          notes:
            "Reflect on Foundation phase progress. Review assessment results",
        },
        thursday: {
          title: "Deload - Light Lower Body",
          type: "deload",
          duration: 50,
          warmup: "Standard Protocol (15 min)",
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
              title: "Block 2: Movement Quality",
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
          ],
          equipment: ["Light dumbbells", "resistance bands"],
          notes: "Recovery week - focus on movement quality, not intensity",
        },
        friday: {
          title: "Deload - Light Power Work",
          type: "deload",
          duration: 50,
          warmup: "Standard Protocol (15 min)",
          blocks: [
            {
              title: "Block 1: Light Plyometrics",
              duration: 20,
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
                {
                  name: "Jump Rope",
                  sets: 3,
                  duration: "1min",
                  rest: "60s",
                },
              ],
            },
            {
              title: "Block 2: Movement Quality",
              duration: 15,
              exercises: [
                {
                  name: "Sprint drill series",
                  protocol: "A-march, A-skip only",
                  sets: 3,
                  distance: "20m",
                  notes: "Perfect mechanics",
                },
                {
                  name: "Core stability circuit",
                  rounds: 2,
                  exercises: [
                    "Plank 30s",
                    "Side plank 20s each",
                    "Dead bugs 10 each",
                  ],
                },
              ],
            },
          ],
          equipment: ["Low box", "jump rope"],
        },
        saturday: {
          title: "Optional Light Movement",
          type: "optional",
          duration: 30,
          activities: [
            {
              name: "Light jog or walk",
              duration: "15-20 min",
              intensity: "Very easy",
            },
            {
              name: "Sprint drills (technique only)",
              sets: "2-3",
              distance: "20m",
              intensity: "Submaximal",
            },
            { name: "Stretching", duration: "10 min" },
          ],
          notes: "Optional session. Rest completely if feeling fatigued",
        },
        sunday: {
          title: "Recovery + Week 5 Preparation",
          type: "recovery",
          duration: 60,
          protocol: "Complete Recovery Protocol",
          activities: [
            { name: "Lower body chain stretching", duration: "25 min" },
            { name: "Foam rolling (full body)", duration: "20 min" },
            { name: "Light walk", duration: "20 min" },
            {
              name: "Mental preparation for Strength phase",
              duration: "15 min",
            },
          ],
          notes:
            "Prepare for Strength Development phase starting next week. Review Foundation phase results and set goals for Weeks 5-8",
        },
      },
      weekSummary: {
        title: "Foundation Phase Complete!",
        achievements: [
          "Established posterior chain foundation (Nordic curls, RDLs)",
          "Developed aerobic base through tempo work",
          "Learned proper sprint mechanics",
          "Built lower body chain health (ankle, knee, hip, quad)",
          "Introduction to isometric training",
          "Baseline assessments completed",
        ],
        nextPhase: {
          name: "Strength Development (Weeks 5-8)",
          focus: [
            "Maximum strength building",
            "Increased sprint volume and intensity",
            "Advanced plyometric work",
            "Repeated sprint ability",
            "Maximal isometric contractions",
          ],
        },
      },
    },

    // ==================== STRENGTH DEVELOPMENT PHASE (WEEKS 5-8) ====================

    week5: {
      weekNumber: 5,
      dateRange: "December 29, 2025 - January 4, 2026",
      phase: "Strength Development",
      focus: "Maximum strength building + sprint intensity increase",
      days: {
        monday: {
          title: "Maximum Strength Development - Posterior Chain",
          type: "strength",
          duration: 75,
          warmup: "Standard Protocol (15 min) + Lower Body Chain (10 min)",
          blocks: [
            {
              title: "Block 1: Maximal Isometric Strength",
              duration: 18,
              exercises: [
                {
                  name: "Isometric Squat Holds (Multiple Positions)",
                  positions: [
                    {
                      name: "Quarter squat",
                      sets: 3,
                      duration: "6s max effort",
                    },
                    {
                      name: "Parallel squat",
                      sets: 2,
                      duration: "6s max effort",
                    },
                  ],
                  rest: "3 min between sets",
                  notes: "Maximum effort 90-95%. Builds neural drive",
                },
                {
                  name: "Isometric Deadlift Pulls",
                  sets: 4,
                  duration: "6s max effort",
                  rest: "3 min",
                  position: "Below knee",
                },
              ],
            },
            {
              title: "Block 2: Heavy Posterior Chain",
              duration: 25,
              exercises: [
                {
                  name: "RDLs",
                  sets: 5,
                  reps: 6,
                  rest: "2.5 min",
                  load: "35-40% BW",
                  notes: "Rep decrease, load at max safe limit",
                },
                {
                  name: "Nordic Curls (Minimal Assistance)",
                  sets: 5,
                  reps: "AMRAP",
                  rest: "2.5 min",
                  notes: "Aim for 6-8 reps with minimal band",
                },
                {
                  name: "Hip Thrusts",
                  sets: 4,
                  reps: 8,
                  rest: "2 min",
                  load: "Moderate-heavy",
                },
              ],
            },
            {
              title: "Block 3: Quad Strength",
              duration: 20,
              exercises: [
                {
                  name: "Back Squats",
                  sets: 5,
                  reps: 5,
                  rest: "3 min",
                  load: "40% BW (max safe load)",
                  notes: "Low reps, max load, explosive intent",
                },
                {
                  name: "Bulgarian Split Squats",
                  sets: 4,
                  reps: "6 each",
                  rest: "2 min",
                  load: "Heavy DBs",
                },
              ],
            },
            {
              title: "Block 4: Core Strength",
              duration: 12,
              exercises: [
                {
                  name: "Weighted Plank",
                  sets: 3,
                  duration: "45s",
                  rest: "75s",
                  load: "Plate on back",
                },
                {
                  name: "Copenhagen Plank",
                  sets: 3,
                  duration: "40-50s each",
                  rest: "60s",
                },
              ],
            },
          ],
          equipment: [
            "Barbell/DBs",
            "squat rack with pins",
            "bands",
            "weight plates",
          ],
        },

        tuesday: {
          title: "Sprint Intensity + Interval Introduction",
          type: "sprint",
          duration: 75,
          warmup:
            "Standard Protocol (15 min) + Extended Sprint Drills (10 min)",
          blocks: [
            {
              title: "Block 1: High-Intensity Sprint Work",
              duration: 35,
              options: [
                {
                  condition: "Track available",
                  exercises: [
                    {
                      name: "Acceleration Sprints",
                      sets: 6,
                      distance: "30m",
                      intensity: "90-95%",
                      rest: "3 min",
                      notes: "Distance and intensity increase from Foundation",
                    },
                    {
                      name: "Flying 10s",
                      sets: 6,
                      protocol: "20m build-up + 10m max sprint",
                      rest: "3 min",
                      notes: "Max velocity work",
                    },
                    {
                      name: "Build-Up Runs",
                      sets: 4,
                      distance: "60m",
                      rest: "3 min",
                      notes: "Progressive to 95%",
                    },
                  ],
                },
                {
                  condition: "No track",
                  exercises: [
                    {
                      name: "Wall Sprint Drills",
                      sets: 6,
                      duration: "20s max",
                      rest: "2 min",
                    },
                    {
                      name: "Resistance Band Sprints",
                      sets: 10,
                      duration: "12s",
                      rest: "2.5 min",
                      notes: "Maximum effort",
                    },
                    {
                      name: "First Step Explosions",
                      sets: 12,
                      distance: "10m",
                      rest: "2 min",
                    },
                  ],
                },
              ],
            },
            {
              title: "Block 2: Short Intervals (Speed Endurance)",
              duration: 25,
              options: [
                {
                  condition: "Track available",
                  exercise: {
                    name: "100m Intervals",
                    sets: "8-10",
                    distance: "100m",
                    intensity: "85-90%",
                    rest: "2.5-3 min walk",
                    notes: "Introduction to high-intensity intervals",
                  },
                },
                {
                  condition: "No track",
                  exercise: {
                    name: "Treadmill Intervals",
                    sets: "8-10",
                    duration: "90s",
                    intensity: "Hard effort",
                    rest: "2 min walk",
                  },
                },
              ],
            },
            {
              title: "Block 3: Reactive Work",
              duration: 10,
              exercises: [
                {
                  name: "Single-leg pogos",
                  sets: 3,
                  duration: "20s each",
                  rest: "60s",
                },
                {
                  name: "Jump rope double-unders",
                  sets: 3,
                  reps: "15-20",
                  rest: "60s",
                },
              ],
            },
          ],
          equipment: [
            "Track or treadmill",
            "resistance bands",
            "jump rope",
            "cones",
          ],
        },

        wednesday: {
          title: "Active Recovery + Mobility",
          type: "recovery",
          duration: 60,
          warmup: "Light movement (10 min)",
          blocks: [
            {
              title: "Block 1: Comprehensive Mobility",
              duration: 30,
              exercises: [
                { name: "Hip mobility circuit", duration: "15 min" },
                { name: "Ankle/calf mobility", duration: "10 min" },
                { name: "Thoracic mobility", duration: "5 min" },
              ],
            },
            {
              title: "Block 2: Light Activation + Recovery",
              duration: 20,
              exercises: [
                { name: "Glute activation circuit", rounds: 2 },
                { name: "Copenhagen Plank", sets: 2, duration: "30s each" },
                { name: "Foam rolling (comprehensive)", duration: "20 min" },
              ],
            },
          ],
          equipment: ["Yoga mat", "foam roller", "bands"],
        },

        thursday: {
          title: "Explosive Power + Advanced Plyometrics",
          type: "power",
          duration: 75,
          warmup: "Standard Protocol (15 min) + Plyometric Prep (10 min)",
          blocks: [
            {
              title: "Block 1: Complex Training",
              duration: 28,
              exercises: [
                {
                  name: "Complex: Squat + Depth Jump",
                  sets: 5,
                  protocol:
                    '3 squats @ 40% BW → immediately 3 depth jumps (8" box)',
                  rest: "4 min",
                  notes: "Post-activation potentiation for explosive power",
                },
                {
                  name: "Complex: RDL + Broad Jump",
                  sets: 4,
                  protocol: "3 RDLs @ 35% BW → immediately 3 broad jumps",
                  rest: "3 min",
                },
              ],
            },
            {
              title: "Block 2: Advanced Plyometrics",
              duration: 25,
              exercises: [
                {
                  name: "Depth Jumps",
                  sets: 5,
                  reps: 5,
                  rest: "2.5 min",
                  boxHeight: "8-10 inches",
                  notes: "Step off, stick landing briefly, explode up",
                },
                {
                  name: "Box Jumps (High)",
                  sets: 4,
                  reps: 4,
                  rest: "2 min",
                  boxHeight: "20-24 inches",
                },
                {
                  name: "Single-Leg Bounds",
                  sets: 4,
                  distance: "25m each",
                  rest: "2 min",
                  notes: "Max distance per bound",
                },
                {
                  name: "Hurdle Hops",
                  sets: 4,
                  reps: "8 hurdles",
                  rest: "2 min",
                  hurdleHeight: "12 inches",
                },
              ],
            },
            {
              title: "Block 3: Posterior Chain Finisher",
              duration: 12,
              exercises: [
                { name: "Nordic Curls", sets: 3, reps: "AMRAP", rest: "2 min" },
                { name: "Glute-Ham Raises", sets: 3, reps: 10, rest: "90s" },
              ],
            },
          ],
          equipment: [
            "Barbell/DBs",
            "plyo boxes (various heights)",
            "mini hurdles",
          ],
        },

        friday: {
          title: "Maximum Speed + Agility",
          type: "sprint",
          duration: 70,
          warmup: "Standard Protocol (15 min) + Sprint Drills (10 min)",
          blocks: [
            {
              title: "Block 1: Maximum Velocity Work",
              duration: 35,
              options: [
                {
                  condition: "Track available",
                  exercises: [
                    {
                      name: "Flying 20s",
                      sets: 6,
                      protocol: "30m build-up + 20m max sprint",
                      rest: "4 min",
                      notes: "Peak velocity development",
                    },
                    {
                      name: "40-Yard Sprints",
                      sets: 5,
                      distance: "40 yards",
                      intensity: "Max effort",
                      rest: "4 min",
                    },
                  ],
                },
                {
                  condition: "No track",
                  exercises: [
                    {
                      name: "Wall Sprint Drills",
                      sets: 6,
                      duration: "15s max",
                      rest: "2.5 min",
                    },
                    {
                      name: "Resistance Band Sprints (Heavy)",
                      sets: 8,
                      duration: "10s",
                      rest: "3 min",
                    },
                  ],
                },
              ],
            },
            {
              title: "Block 2: Advanced Agility",
              duration: 25,
              exercises: [
                {
                  name: "Pro Agility (Timed)",
                  sets: 6,
                  rest: "3 min",
                  notes: "Max effort, record times",
                },
                { name: "L-Drill", sets: 5, rest: "2.5 min" },
                {
                  name: "Reactive cone drills",
                  sets: 8,
                  duration: "15s",
                  rest: "90s",
                  notes: "Partner calls directions",
                },
              ],
            },
          ],
          equipment: ["Track or wall space", "bands", "cones", "stopwatch"],
        },

        saturday: {
          title: "Repeated Sprint Ability (RSA)",
          type: "conditioning",
          duration: 55,
          warmup: "Standard Protocol (15 min) + Sprint Drills (10 min)",
          blocks: [
            {
              title: "Block 1: RSA Training",
              duration: 30,
              options: [
                {
                  condition: "Track available",
                  exercise: {
                    name: "Repeated Sprint Ability Work",
                    sets: "8-10 sprints",
                    distance: "30m",
                    intensity: "Maximum effort each rep",
                    rest: "25s between sprints",
                    notes: "Game simulation. Track time drop-off",
                  },
                },
                {
                  condition: "No track",
                  exercise: {
                    name: "RSA Simulation",
                    sets: "8-10 sprints",
                    duration: "8-10s max effort",
                    rest: "25s",
                    notes: "Maximum effort, short rest",
                  },
                },
              ],
            },
          ],
          equipment: ["Track or space", "stopwatch"],
          notes: "Building capacity for 40+ sprints per game",
        },

        sunday: {
          title: "Complete Recovery",
          type: "recovery",
          duration: 60,
          protocol: "Complete Recovery Protocol",
          activities: [
            { name: "Lower body chain stretching", duration: "25 min" },
            { name: "Foam rolling (full body)", duration: "20 min" },
            { name: "Light walk or easy bike", duration: "25 min" },
            { name: "Visualization", duration: "10 min" },
          ],
        },
      },
      weekSummary: {
        lowerBodySessions: 4,
        sprintSessions: 3,
        focus:
          "Maximum strength (40% BW squats), sprint intensity increase (90-95%), complex training introduction",
      },
    },

    week6: {
      weekNumber: 6,
      dateRange: "January 5-11, 2026",
      phase: "Strength Development",
      focus: "Maximum strength maintenance + interval volume increase",
      days: {
        monday: {
          title: "Maximum Strength - Quad Emphasis",
          type: "strength",
          duration: 75,
          warmup: "Standard Protocol (15 min) + Lower Body Chain (10 min)",
          blocks: [
            {
              title: "Block 1: Maximal Isometric Strength",
              duration: 18,
              exercises: [
                {
                  name: "Isometric Squat Holds (Multiple Angles)",
                  positions: [
                    {
                      name: "Quarter squat",
                      sets: 3,
                      duration: "6s max effort",
                    },
                    {
                      name: "Parallel squat",
                      sets: 3,
                      duration: "6s max effort",
                    },
                  ],
                  rest: "3 min between sets",
                  notes: "Consistency at 90-95% max effort",
                },
                {
                  name: "Isometric Split Squat Holds",
                  sets: 3,
                  duration: "6s each leg",
                  rest: "2.5 min",
                  notes: "Unilateral isometric work for stability",
                },
              ],
            },
            {
              title: "Block 2: Maximum Quad Strength",
              duration: 25,
              exercises: [
                {
                  name: "Back Squats",
                  sets: 5,
                  reps: 5,
                  rest: "3 min",
                  load: "40% BW (max safe load)",
                  notes: "Maintain loads from Week 5",
                },
                {
                  name: "Bulgarian Split Squats",
                  sets: 5,
                  reps: "5-6 each",
                  rest: "2.5 min",
                  load: "Heavy DBs",
                  notes: "Rep decrease from Foundation phase",
                },
                {
                  name: "Walking Lunges (Loaded)",
                  sets: 4,
                  reps: "8 each",
                  rest: "2 min",
                  load: "Moderate DBs",
                },
              ],
            },
            {
              title: "Block 3: Posterior Chain",
              duration: 20,
              exercises: [
                {
                  name: "RDLs",
                  sets: 4,
                  reps: 6,
                  rest: "2.5 min",
                  load: "35-40% BW",
                },
                {
                  name: "Nordic Curls",
                  sets: 5,
                  reps: "AMRAP",
                  rest: "2.5 min",
                  notes: "Minimal assistance, aim for 6-8 reps",
                },
              ],
            },
            {
              title: "Block 4: Core Strength",
              duration: 12,
              exercises: [
                {
                  name: "Weighted Plank",
                  sets: 3,
                  duration: "50s",
                  rest: "75s",
                  load: "Plate on back",
                },
                {
                  name: "Copenhagen Plank",
                  sets: 3,
                  duration: "45-55s each",
                  rest: "60s",
                },
              ],
            },
          ],
          equipment: ["Barbell/DBs", "squat rack with pins", "weight plates"],
        },

        tuesday: {
          title: "Maximum Speed + Interval Progression",
          type: "sprint",
          duration: 80,
          warmup:
            "Standard Protocol (15 min) + Extended Sprint Drills (10 min)",
          blocks: [
            {
              title: "Block 1: Maximum Velocity Sprints",
              duration: 35,
              options: [
                {
                  condition: "Track available",
                  exercises: [
                    {
                      name: "Flying 20s",
                      sets: 6,
                      protocol: "30m build-up + 20m max sprint",
                      rest: "4 min",
                      notes: "Peak velocity development",
                    },
                    {
                      name: "40-Yard Sprints",
                      sets: 5,
                      distance: "40 yards",
                      intensity: "Max effort",
                      rest: "4 min",
                    },
                  ],
                },
                {
                  condition: "No track",
                  exercises: [
                    {
                      name: "Wall Sprint Drills",
                      sets: 6,
                      duration: "15s max",
                      rest: "2.5 min",
                    },
                    {
                      name: "Resistance Band Sprints (Heavy)",
                      sets: 8,
                      duration: "10s",
                      rest: "3 min",
                    },
                  ],
                },
              ],
            },
            {
              title: "Block 2: Extended Intervals",
              duration: 30,
              options: [
                {
                  condition: "Track available",
                  exercise: {
                    name: "150m Intervals",
                    sets: "8-10",
                    distance: "150m",
                    intensity: "85-90%",
                    rest: "3-3.5 min walk",
                    notes: "Volume and distance increase from Week 5",
                  },
                },
                {
                  condition: "No track",
                  exercise: {
                    name: "Treadmill Intervals",
                    sets: "10-12",
                    duration: "90s",
                    intensity: "Hard effort",
                    rest: "2 min walk",
                  },
                },
              ],
            },
            {
              title: "Block 3: Reactive Power",
              duration: 10,
              exercises: [
                { name: "Pogo jumps", sets: 4, duration: "20s", rest: "60s" },
                {
                  name: "Jump rope double-unders",
                  sets: 3,
                  reps: "20-25",
                  rest: "60s",
                },
              ],
            },
          ],
          equipment: ["Track or treadmill", "resistance bands", "jump rope"],
        },

        wednesday: {
          title: "Active Recovery + Mobility",
          type: "recovery",
          duration: 60,
          warmup: "Light movement (10 min)",
          blocks: [
            {
              title: "Block 1: Comprehensive Mobility",
              duration: 30,
              exercises: [
                { name: "Hip mobility circuit", duration: "15 min" },
                { name: "Ankle/calf mobility", duration: "10 min" },
                { name: "Thoracic mobility", duration: "5 min" },
              ],
            },
            {
              title: "Block 2: Light Activation + Recovery",
              duration: 20,
              exercises: [
                { name: "Glute activation circuit", rounds: 2 },
                { name: "Copenhagen Plank", sets: 2, duration: "35s each" },
                { name: "Foam rolling (comprehensive)", duration: "20 min" },
              ],
            },
          ],
          equipment: ["Yoga mat", "foam roller", "bands"],
        },

        thursday: {
          title: "Complex Training + Plyometric Volume",
          type: "power",
          duration: 80,
          warmup: "Standard Protocol (15 min) + Plyometric Prep (10 min)",
          blocks: [
            {
              title: "Block 1: Complex Training Variations",
              duration: 30,
              exercises: [
                {
                  name: "Complex: Squat + Depth Jump",
                  sets: 5,
                  protocol:
                    '3 squats @ 40% BW → immediately 3 depth jumps (10" box)',
                  rest: "4 min",
                  notes: "Box height increase from Week 5",
                },
                {
                  name: "Complex: Bulgarian Split Squat + Single-Leg Bound",
                  sets: 4,
                  protocol: "5 reps each leg → immediately 3 bounds each",
                  rest: "3 min",
                  notes: "Unilateral PAP work",
                },
                {
                  name: "Complex: RDL + Broad Jump",
                  sets: 4,
                  protocol: "4 RDLs @ 35% BW → immediately 4 broad jumps",
                  rest: "3 min",
                },
              ],
            },
            {
              title: "Block 2: Plyometric Volume Work",
              duration: 30,
              exercises: [
                {
                  name: "Depth Jumps",
                  sets: 6,
                  reps: 5,
                  rest: "2.5 min",
                  boxHeight: "10 inches",
                  notes: "Volume increase from Week 5",
                },
                {
                  name: "Box Jumps",
                  sets: 5,
                  reps: 5,
                  rest: "2 min",
                  boxHeight: "24 inches",
                },
                {
                  name: "Alternating Bounds",
                  sets: 5,
                  distance: "30m",
                  rest: "2 min",
                  notes: "Max distance per bound",
                },
                {
                  name: "Hurdle Hops (Consecutive)",
                  sets: 5,
                  reps: "10 hurdles",
                  rest: "2 min",
                  hurdleHeight: "12 inches",
                },
              ],
            },
          ],
          equipment: ["Barbell/DBs", 'plyo boxes (10", 24")', "mini hurdles"],
        },

        friday: {
          title: "Sprint Mechanics + Change of Direction",
          type: "sprint",
          duration: 70,
          warmup: "Standard Protocol (15 min) + Sprint Drills (10 min)",
          blocks: [
            {
              title: "Block 1: Acceleration Emphasis",
              duration: 30,
              options: [
                {
                  condition: "Track available",
                  exercises: [
                    {
                      name: "3-Point Start Sprints",
                      sets: 8,
                      distance: "20m",
                      intensity: "Max effort",
                      rest: "3 min",
                      notes: "Game-specific acceleration",
                    },
                    {
                      name: "Flying 10s",
                      sets: 6,
                      protocol: "20m build-up + 10m max sprint",
                      rest: "3 min",
                    },
                  ],
                },
                {
                  condition: "No track",
                  exercises: [
                    {
                      name: "Wall Sprint Drills",
                      sets: 8,
                      duration: "15s max",
                      rest: "2.5 min",
                    },
                    {
                      name: "First Step Explosions",
                      sets: 12,
                      distance: "10m",
                      rest: "2 min",
                    },
                  ],
                },
              ],
            },
            {
              title: "Block 2: Multi-Directional Speed",
              duration: 30,
              exercises: [
                {
                  name: "Pro Agility (5-10-5)",
                  sets: 8,
                  rest: "2.5-3 min",
                  notes: "Timed - track progress",
                },
                {
                  name: "L-Drill",
                  sets: 6,
                  rest: "2.5 min",
                  notes: "Both directions",
                },
                {
                  name: "W-Drill (Cone Weave)",
                  sets: 5,
                  distance: "20 yards",
                  rest: "2 min",
                  notes: "Sharp cuts, max speed",
                },
              ],
            },
          ],
          equipment: ["Track or space", "cones", "stopwatch"],
        },

        saturday: {
          title: "RSA Volume Increase",
          type: "conditioning",
          duration: 60,
          warmup: "Standard Protocol (15 min) + Sprint Drills (10 min)",
          blocks: [
            {
              title: "Block 1: Extended RSA Work",
              duration: 35,
              options: [
                {
                  condition: "Track available",
                  exercise: {
                    name: "Repeated Sprint Ability",
                    sets: "10-12 sprints",
                    distance: "30m",
                    intensity: "Maximum effort each rep",
                    rest: "25s between sprints",
                    notes: "Volume increase from Week 5. Track fatigue index",
                  },
                },
                {
                  condition: "No track",
                  exercise: {
                    name: "RSA Simulation",
                    sets: "10-12 sprints",
                    duration: "8-10s max effort",
                    rest: "25s",
                    notes: "Building 40+ sprint capacity",
                  },
                },
              ],
            },
          ],
          equipment: ["Track or space", "stopwatch"],
          notes: "Progressing toward game capacity (40+ sprints)",
        },

        sunday: {
          title: "Complete Recovery",
          type: "recovery",
          duration: 60,
          protocol: "Complete Recovery Protocol",
          activities: [
            { name: "Lower body chain stretching", duration: "25 min" },
            { name: "Foam rolling (full body)", duration: "20 min" },
            { name: "Light walk or easy bike", duration: "25 min" },
            { name: "Visualization + mental preparation", duration: "10 min" },
          ],
        },
      },
      weekSummary: {
        lowerBodySessions: 4,
        sprintSessions: 3,
        focus:
          "Maintain maximum loads, interval distance increase (150m), complex training variations, RSA volume to 10-12 sprints",
      },
    },

    week7: {
      weekNumber: 7,
      dateRange: "January 12-18, 2026",
      phase: "Strength Development",
      focus: "Peak strength + maximum velocity emphasis",
      days: {
        monday: {
          title: "Peak Strength - Posterior Chain",
          type: "strength",
          duration: 80,
          warmup: "Standard Protocol (15 min) + Lower Body Chain (10 min)",
          blocks: [
            {
              title: "Block 1: Maximal Isometric - Peak Effort",
              duration: 20,
              exercises: [
                {
                  name: "Isometric Deadlift Pulls (Multiple Positions)",
                  positions: [
                    { name: "Below knee", sets: 4, duration: "6s max effort" },
                    { name: "Mid-thigh", sets: 3, duration: "6s max effort" },
                  ],
                  rest: "3 min between sets",
                  notes: "Peak neural drive - 95% max effort",
                },
                {
                  name: "Isometric Squat Holds",
                  sets: 3,
                  duration: "6s max effort",
                  rest: "3 min",
                  position: "Parallel",
                },
              ],
            },
            {
              title: "Block 2: Peak Posterior Chain Strength",
              duration: 30,
              exercises: [
                {
                  name: "RDLs",
                  sets: 6,
                  reps: 5,
                  rest: "3 min",
                  load: "40% BW (peak load)",
                  notes: "Peak strength week - reduced reps, max load",
                },
                {
                  name: "Nordic Curls (Minimal to Zero Assistance)",
                  sets: 6,
                  reps: "AMRAP",
                  rest: "2.5 min",
                  notes: "Target: 8-10 reps minimal assistance",
                },
                {
                  name: "Hip Thrusts",
                  sets: 5,
                  reps: 6,
                  rest: "2 min",
                  load: "Heavy",
                  notes: "Low reps, heavy load",
                },
                {
                  name: "Glute-Ham Raises",
                  sets: 4,
                  reps: 8,
                  rest: "2 min",
                },
              ],
            },
            {
              title: "Block 3: Quad Strength",
              duration: 20,
              exercises: [
                {
                  name: "Back Squats",
                  sets: 5,
                  reps: 5,
                  rest: "3 min",
                  load: "40% BW",
                  notes: "Maintain peak loads",
                },
                {
                  name: "Bulgarian Split Squats",
                  sets: 4,
                  reps: "5 each",
                  rest: "2.5 min",
                  load: "Heavy DBs",
                },
              ],
            },
          ],
          equipment: ["Barbell/DBs", "squat rack with pins", "bands"],
        },

        tuesday: {
          title: "Maximum Velocity + Long Intervals",
          type: "sprint",
          duration: 85,
          warmup:
            "Standard Protocol (15 min) + Extended Sprint Drills (10 min)",
          blocks: [
            {
              title: "Block 1: Peak Velocity Work",
              duration: 40,
              options: [
                {
                  condition: "Track available",
                  exercises: [
                    {
                      name: "Flying 30s",
                      sets: 6,
                      protocol: "40m build-up + 30m max sprint",
                      rest: "5 min",
                      notes: "Peak velocity - extended flying sprints",
                    },
                    {
                      name: "60m Sprints",
                      sets: 5,
                      distance: "60m",
                      intensity: "Max effort",
                      rest: "4-5 min",
                    },
                    {
                      name: "10-Yard Acceleration Sprints",
                      sets: 6,
                      distance: "10 yards",
                      intensity: "Max effort",
                      rest: "2.5 min",
                      notes: "First step power",
                    },
                  ],
                },
                {
                  condition: "No track",
                  exercises: [
                    {
                      name: "Wall Sprint Drills",
                      sets: 8,
                      duration: "15s max",
                      rest: "2.5 min",
                    },
                    {
                      name: "Resistance Band Sprints",
                      sets: 10,
                      duration: "12s",
                      rest: "3 min",
                      notes: "Peak power",
                    },
                  ],
                },
              ],
            },
            {
              title: "Block 2: Long Intervals (Lactate Tolerance)",
              duration: 30,
              options: [
                {
                  condition: "Track available",
                  exercise: {
                    name: "200m Intervals",
                    sets: "6-8",
                    distance: "200m",
                    intensity: "85%",
                    rest: "4-5 min walk/jog",
                    notes: "Distance increase - lactate tolerance work",
                  },
                },
                {
                  condition: "No track",
                  exercise: {
                    name: "Treadmill Long Intervals",
                    sets: "8-10",
                    duration: "2 min",
                    intensity: "Hard effort",
                    rest: "2.5 min walk",
                  },
                },
              ],
            },
          ],
          equipment: ["Track or treadmill", "resistance bands"],
        },

        wednesday: {
          title: "Active Recovery + Mobility",
          type: "recovery",
          duration: 60,
          warmup: "Light movement (10 min)",
          blocks: [
            {
              title: "Block 1: Enhanced Mobility",
              duration: 35,
              exercises: [
                {
                  name: "Hip mobility circuit",
                  duration: "15 min",
                  notes: "Extended duration",
                },
                { name: "Ankle/calf mobility", duration: "12 min" },
                { name: "Thoracic mobility", duration: "8 min" },
              ],
            },
            {
              title: "Block 2: Light Activation",
              duration: 15,
              exercises: [
                { name: "Glute activation circuit", rounds: 2 },
                { name: "Copenhagen Plank", sets: 2, duration: "40s each" },
                { name: "Foam rolling (comprehensive)", duration: "20 min" },
              ],
            },
          ],
          equipment: ["Yoga mat", "foam roller", "bands"],
        },

        thursday: {
          title: "Peak Power + Advanced Complex Training",
          type: "power",
          duration: 85,
          warmup: "Standard Protocol (15 min) + Plyometric Prep (10 min)",
          blocks: [
            {
              title: "Block 1: Advanced Complex Training",
              duration: 35,
              exercises: [
                {
                  name: "Complex: Squat + Reactive Depth Jump",
                  sets: 6,
                  protocol:
                    '3 squats @ 40% BW → immediately 3 depth jumps (10" box) → stick + react up',
                  rest: "4-5 min",
                  notes: "Reactive component added - peak PAP",
                },
                {
                  name: "Complex: RDL + Hurdle Hop Series",
                  sets: 5,
                  protocol: "4 RDLs @ 40% BW → immediately 8 hurdle hops",
                  rest: "3.5 min",
                  notes: "RDL load increase to 40%",
                },
                {
                  name: "Complex: Bulgarian Split Squat + Lateral Bound",
                  sets: 4,
                  protocol:
                    "5 reps each leg → immediately 4 lateral bounds each",
                  rest: "3 min",
                  notes: "Multi-directional power",
                },
              ],
            },
            {
              title: "Block 2: Peak Plyometric Work",
              duration: 30,
              exercises: [
                {
                  name: "Depth Jumps (Peak Height)",
                  sets: 6,
                  reps: 5,
                  rest: "3 min",
                  boxHeight: "12 inches",
                  notes: "Peak box height for phase",
                },
                {
                  name: "Reactive Box Jumps",
                  sets: 5,
                  reps: 6,
                  rest: "2.5 min",
                  boxHeight: "24-28 inches",
                  notes: "Step down, stick, immediate re-jump",
                },
                {
                  name: "Single-Leg Bounds (Max Distance)",
                  sets: 5,
                  distance: "30m each",
                  rest: "2.5 min",
                  notes: "Maximum horizontal force production",
                },
              ],
            },
          ],
          equipment: ["Barbell/DBs", 'plyo boxes (12", 24-28")', "hurdles"],
        },

        friday: {
          title: "Agility + Reactive Speed",
          type: "sprint",
          duration: 75,
          warmup: "Standard Protocol (15 min) + Sprint Drills (10 min)",
          blocks: [
            {
              title: "Block 1: Acceleration + Max Velocity",
              duration: 35,
              options: [
                {
                  condition: "Track available",
                  exercises: [
                    {
                      name: "40-Yard Sprints (Timed)",
                      sets: 6,
                      distance: "40 yards",
                      intensity: "Max effort",
                      rest: "4 min",
                      notes: "Record times - track progress",
                    },
                    {
                      name: "Flying 20s",
                      sets: 6,
                      protocol: "30m build-up + 20m max sprint",
                      rest: "4 min",
                    },
                  ],
                },
                {
                  condition: "No track",
                  exercises: [
                    {
                      name: "Wall Sprint Drills",
                      sets: 8,
                      duration: "15s max",
                      rest: "2.5 min",
                    },
                    {
                      name: "Resistance Band Sprints",
                      sets: 10,
                      duration: "10s",
                      rest: "3 min",
                    },
                  ],
                },
              ],
            },
            {
              title: "Block 2: Peak Agility Work",
              duration: 30,
              exercises: [
                {
                  name: "Pro Agility (Timed - PR Attempt)",
                  sets: 8,
                  rest: "3-4 min",
                  notes: "Maximum effort - record best time",
                },
                {
                  name: "L-Drill (Timed)",
                  sets: 6,
                  rest: "3 min",
                  notes: "Both directions, record times",
                },
                {
                  name: "Reactive Cone Series",
                  sets: 8,
                  duration: "20s",
                  rest: "2 min",
                  notes: "Partner calls directions - game simulation",
                },
              ],
            },
          ],
          equipment: ["Track or space", "cones", "stopwatch"],
        },

        saturday: {
          title: "RSA Peak Volume",
          type: "conditioning",
          duration: 65,
          warmup: "Standard Protocol (15 min) + Sprint Drills (10 min)",
          blocks: [
            {
              title: "Block 1: Peak RSA Work",
              duration: 40,
              options: [
                {
                  condition: "Track available",
                  exercise: {
                    name: "Repeated Sprint Ability - Peak Volume",
                    sets: "12-15 sprints",
                    distance: "30m",
                    intensity: "Maximum effort each rep",
                    rest: "25s between sprints",
                    notes:
                      "Peak RSA volume. Track performance drop-off: (best time - worst time) / best time × 100%",
                  },
                },
                {
                  condition: "No track",
                  exercise: {
                    name: "RSA Simulation - Peak Volume",
                    sets: "12-15 sprints",
                    duration: "8-10s max effort",
                    rest: "25s",
                    notes: "Approaching game capacity (40+ sprints)",
                  },
                },
              ],
            },
          ],
          equipment: ["Track or space", "stopwatch"],
          notes: "Peak RSA week - this simulates late-game fatigue",
        },

        sunday: {
          title: "Complete Recovery",
          type: "recovery",
          duration: 60,
          protocol: "Complete Recovery Protocol",
          activities: [
            { name: "Lower body chain stretching", duration: "25 min" },
            { name: "Foam rolling (full body)", duration: "20 min" },
            { name: "Light walk or easy bike", duration: "25 min" },
            { name: "Mental preparation + visualization", duration: "10 min" },
          ],
        },
      },
      weekSummary: {
        lowerBodySessions: 4,
        sprintSessions: 3,
        focus:
          "Peak strength (40% BW RDLs, 6 sets), maximum velocity emphasis (flying 30s), long intervals (200m), RSA peak (12-15 sprints)",
      },
    },

    week8: {
      weekNumber: 8,
      dateRange: "January 19-25, 2026",
      phase: "Strength Development",
      focus: "Mid-program assessment + partial deload",
      days: {
        monday: {
          title: "Strength & Power Assessment",
          type: "assessment",
          duration: 90,
          warmup:
            "Extended Protocol (20 min) - thorough preparation for testing",
          blocks: [
            {
              title: "Block 1: Isometric Strength Assessment",
              duration: 25,
              exercises: [
                {
                  name: "Isometric Squat Hold (Parallel) - Maximum Duration",
                  sets: 1,
                  notes: "Max effort 6s hold - measure force if available",
                  record: "Duration and perceived effort",
                },
                {
                  name: "Isometric Deadlift Pull - Maximum Duration",
                  sets: 1,
                  position: "Below knee",
                  notes: "Max effort 6s hold",
                  record: "Duration and perceived effort",
                },
              ],
            },
            {
              title: "Block 2: Strength Assessment",
              duration: 30,
              exercises: [
                {
                  name: "Back Squat - Test Set",
                  sets: "1-2",
                  reps: "Max reps @ 40% BW",
                  rest: "5 min between attempts",
                  record: "Total reps achieved",
                },
                {
                  name: "RDL - Test Set",
                  sets: "1-2",
                  reps: "Max reps @ 35% BW",
                  rest: "5 min",
                  record: "Total reps achieved",
                },
                {
                  name: "Nordic Curls - Unassisted Test",
                  sets: 2,
                  reps: "AMRAP (no assistance)",
                  rest: "4 min",
                  record: "Best set total reps",
                  notes: "Compare to Week 1 baseline",
                },
              ],
            },
            {
              title: "Block 3: Power Assessment",
              duration: 25,
              exercises: [
                {
                  name: "Vertical Jump Test",
                  sets: 3,
                  rest: "2 min",
                  record: "Best jump height",
                  notes: "Use jump mat or wall mark",
                },
                {
                  name: "Broad Jump Test",
                  sets: 3,
                  rest: "2 min",
                  record: "Best distance",
                },
                {
                  name: 'Depth Jump Test (10" Box)',
                  sets: 3,
                  rest: "2.5 min",
                  record: "Best reactive jump height",
                  notes: "Step off, stick briefly, explode up",
                },
              ],
            },
          ],
          equipment: [
            "Barbell/DBs",
            "measuring tape",
            "jump mat or wall marks",
          ],
          notes:
            "Record all results for comparison to Week 1 and future testing",
        },

        tuesday: {
          title: "Speed & Agility Assessment",
          type: "assessment",
          duration: 90,
          warmup: "Extended Protocol (20 min) + thorough sprint drills",
          blocks: [
            {
              title: "Block 1: Linear Speed Assessment",
              duration: 35,
              exercises: [
                {
                  name: "10-Yard Sprint Test",
                  sets: 3,
                  rest: "4 min",
                  record: "Best time",
                  notes: "Electronic timing if available, otherwise stopwatch",
                },
                {
                  name: "20-Yard Sprint Test",
                  sets: 3,
                  rest: "4 min",
                  record: "Best time",
                },
                {
                  name: "40-Yard Sprint Test",
                  sets: 3,
                  rest: "5 min",
                  record: "Best time",
                  notes: "Primary speed assessment - compare to Week 1",
                },
                {
                  name: "Flying 20m Test",
                  sets: 3,
                  protocol: "30m build-up + 20m timed",
                  rest: "5 min",
                  record: "Best time (max velocity)",
                },
              ],
            },
            {
              title: "Block 2: Change of Direction Assessment",
              duration: 30,
              exercises: [
                {
                  name: "Pro Agility Test (5-10-5)",
                  sets: 3,
                  rest: "4 min",
                  record: "Best time",
                  notes: "Both directions - record best",
                },
                {
                  name: "L-Drill Test",
                  sets: 3,
                  rest: "3.5 min",
                  record: "Best time each direction",
                },
                {
                  name: "T-Test",
                  sets: 2,
                  rest: "4 min",
                  record: "Best time",
                  notes: "Multi-directional agility assessment",
                },
              ],
            },
            {
              title: "Block 3: Mobility Assessment",
              duration: 20,
              exercises: [
                {
                  name: "Hip Flexor Flexibility Test",
                  assessment: "Modified Thomas test",
                  record: "Left/right flexibility (degrees or descriptive)",
                },
                {
                  name: "Ankle Dorsiflexion Test",
                  assessment: "Wall test",
                  record: "Distance from wall (cm) each ankle",
                },
                {
                  name: "Hamstring Flexibility",
                  assessment: "Straight leg raise",
                  record: "Degrees achieved each leg",
                },
              ],
            },
          ],
          equipment: [
            "Cones",
            "stopwatch or electronic timing",
            "measuring tape",
          ],
          notes: "Compare all results to Week 1 baseline - track improvements",
        },

        wednesday: {
          title: "Movement Quality + Recovery",
          type: "recovery",
          duration: 60,
          warmup: "Light movement (10 min)",
          blocks: [
            {
              title: "Block 1: Movement Quality Assessment",
              duration: 25,
              exercises: [
                {
                  name: "Single-Leg Balance Test",
                  sets: 2,
                  duration: "Max time (up to 60s)",
                  record: "Best time each leg",
                },
                {
                  name: "Overhead Squat Assessment",
                  sets: 3,
                  reps: 5,
                  load: "Bodyweight or PVC",
                  notes: "Assess movement quality, depth, balance",
                },
                {
                  name: "Single-Leg RDL (Unloaded)",
                  sets: 2,
                  reps: "5 each",
                  notes: "Assess balance and posterior chain control",
                },
              ],
            },
            {
              title: "Block 2: Comprehensive Recovery",
              duration: 30,
              exercises: [
                { name: "Full body stretching routine", duration: "20 min" },
                { name: "Foam rolling (comprehensive)", duration: "15 min" },
              ],
            },
          ],
          equipment: ["Yoga mat", "foam roller", "PVC pipe"],
        },

        thursday: {
          title: "Deload - Light Power Work",
          type: "power",
          duration: 50,
          warmup: "Standard Protocol (15 min)",
          blocks: [
            {
              title: "Block 1: Light Plyometrics",
              duration: 25,
              exercises: [
                {
                  name: "Box Jumps",
                  sets: 3,
                  reps: 5,
                  rest: "2 min",
                  boxHeight: "12-16 inches (reduced)",
                  notes: "50-60% effort - movement quality focus",
                },
                {
                  name: "Pogo Jumps",
                  sets: 3,
                  duration: "15s",
                  rest: "90s",
                  notes: "Light, springy",
                },
                {
                  name: "Lateral Bounds",
                  sets: 3,
                  reps: "6 each",
                  rest: "90s",
                  notes: "Focus on landing mechanics",
                },
              ],
            },
          ],
          equipment: ["Low plyo box"],
        },

        friday: {
          title: "Deload - Speed Mechanics",
          type: "sprint",
          duration: 45,
          warmup: "Standard Protocol (15 min)",
          blocks: [
            {
              title: "Block 1: Sprint Drills + Light Speed Work",
              duration: 25,
              exercises: [
                {
                  name: "A-march/A-skip",
                  sets: 3,
                  distance: "20m each",
                  rest: "60s",
                  notes: "Perfect mechanics",
                },
                {
                  name: "Build-Up Runs",
                  sets: 4,
                  distance: "50m",
                  intensity: "70-80%",
                  rest: "3 min",
                  notes: "Smooth acceleration, no max effort",
                },
                {
                  name: "Flying 10s (Light)",
                  sets: 4,
                  protocol: "20m build-up + 10m @ 80%",
                  rest: "3 min",
                  notes: "Mechanics focus, not max effort",
                },
              ],
            },
          ],
          equipment: ["Track or space"],
        },

        saturday: {
          title: "Deload - Light Strength",
          type: "strength",
          duration: 50,
          warmup: "Standard Protocol (15 min)",
          blocks: [
            {
              title: "Block 1: Light Lower Body",
              duration: 30,
              exercises: [
                {
                  name: "Goblet Squats",
                  sets: 3,
                  reps: 8,
                  rest: "2 min",
                  load: "Light-moderate DB (50-60% of training load)",
                  notes: "Movement quality focus",
                },
                {
                  name: "RDLs",
                  sets: 3,
                  reps: 8,
                  rest: "2 min",
                  load: "20-25% BW (light)",
                },
                {
                  name: "Single-Leg RDL",
                  sets: 3,
                  reps: "6 each",
                  rest: "90s",
                  load: "Light DB or bodyweight",
                },
                {
                  name: "Copenhagen Plank",
                  sets: 2,
                  duration: "30s each",
                  rest: "60s",
                },
              ],
            },
          ],
          equipment: ["Dumbbells", "mat"],
        },

        sunday: {
          title: "Complete Recovery",
          type: "recovery",
          duration: 60,
          protocol: "Complete Recovery Protocol",
          activities: [
            { name: "Lower body chain stretching", duration: "25 min" },
            { name: "Foam rolling (full body)", duration: "20 min" },
            { name: "Light walk or easy bike", duration: "25 min" },
            {
              name: "Review assessment results + set Power phase goals",
              duration: "15 min",
            },
          ],
        },
      },
      weekSummary: {
        assessmentFocus:
          "Mid-program testing (strength, power, speed, agility, mobility)",
        deloadVolume: "50-60% of training loads",
        notes:
          "Compare all results to Week 1. Prepare for Power phase transition (Weeks 9-12)",
      },
      phaseSummary: {
        title: "Strength Development Phase Complete (Weeks 5-8)!",
        achievements: [
          "Maximum strength developed (40% BW squats/RDLs, 5-6 rep range)",
          "Maximal isometric strength built (6s holds @ 90-95% effort)",
          "Sprint intensity increased to 90-95% max effort",
          "Complex training introduced (post-activation potentiation)",
          "Interval work progressed (100m → 150m → 200m @ 85-90%)",
          "RSA capacity built (8-10 → 12-15 sprints)",
          'Advanced plyometrics introduced (depth jumps from 8-12" boxes)',
          "Maximum velocity work emphasized (flying 20s, flying 30s)",
        ],
        keyMetrics: {
          strengthGains: "Compare Week 8 to Week 1: squats, RDLs, Nordic curls",
          powerGains: "Vertical jump, broad jump, depth jump improvements",
          speedGains: "10/20/40-yard sprint times, flying 20m max velocity",
          agilityGains: "Pro Agility, L-drill times",
          conditioningGains: "RSA volume capacity (15 sprints), fatigue index",
        },
        nextPhase: {
          name: "Power Phase (Weeks 9-12)",
          focus: [
            "Convert strength to explosive power",
            "Peak plyometric work (reactive abilities)",
            "Maximum velocity sprinting",
            "Game-specific conditioning (RSA at game pace)",
            "Multi-directional power development",
            "Outdoor transition preparation (late phase)",
          ],
          trainingShifts: {
            strength: "Maintenance volume (2-3 sessions, lighter loads)",
            power: "Primary focus (explosive work 3-4x/week)",
            speed: "Maximum velocity emphasis",
            conditioning: "RSA at game intensity",
          },
        },
      },
    },

    week9: {
      weekNumber: 9,
      dateRange: "January 26 - February 1, 2026",
      phase: "Power",
      focus: "Convert strength to explosive power + max velocity emphasis",
      days: {
        monday: {
          title: "Explosive Power Development - Plyometric Focus",
          type: "power",
          duration: 85,
          warmup:
            "Standard Protocol (15 min) + Extended Plyometric Prep (12 min)",
          blocks: [
            {
              title: "Block 1: Reactive Plyometric Work",
              duration: 35,
              exercises: [
                {
                  name: "Depth Jumps (Reactive Emphasis)",
                  sets: 6,
                  reps: 6,
                  rest: "3 min",
                  boxHeight: "12 inches",
                  notes:
                    "Step off, minimal ground contact, maximum reactive jump",
                },
                {
                  name: "Reactive Box Jumps (Step Down + Immediate Jump)",
                  sets: 6,
                  reps: 5,
                  rest: "2.5 min",
                  boxHeight: "28-30 inches",
                  notes: "Step down, stick briefly, explosive re-jump",
                },
                {
                  name: "Pogo Jumps (Maximum Height)",
                  sets: 4,
                  duration: "25s",
                  rest: "2 min",
                  notes: "Minimal ground contact time, max height each rep",
                },
              ],
            },
            {
              title: "Block 2: Multi-Directional Power",
              duration: 30,
              exercises: [
                {
                  name: "Lateral Bounds (Maximum Distance)",
                  sets: 5,
                  reps: "8 each direction",
                  rest: "2 min",
                  notes: "Max horizontal displacement, stick landing",
                },
                {
                  name: "Single-Leg Bounds",
                  sets: 5,
                  distance: "30m each",
                  rest: "2.5 min",
                  notes: "Maximum distance per bound",
                },
                {
                  name: "Hurdle Hops (Reactive Series)",
                  sets: 5,
                  reps: "12 hurdles",
                  rest: "2 min",
                  hurdleHeight: "12-15 inches",
                  notes: "Minimal ground contact between hurdles",
                },
              ],
            },
            {
              title: "Block 3: Strength Maintenance",
              duration: 15,
              exercises: [
                {
                  name: "RDLs",
                  sets: 3,
                  reps: 8,
                  rest: "2 min",
                  load: "30% BW (maintenance)",
                  notes: "Reduced volume for maintenance",
                },
                {
                  name: "Nordic Curls",
                  sets: 3,
                  reps: "AMRAP",
                  rest: "2 min",
                },
              ],
            },
          ],
          equipment: ['Plyo boxes (12", 28-30")', "hurdles", "barbell/DBs"],
        },

        tuesday: {
          title: "Maximum Velocity + Speed Endurance",
          type: "sprint",
          duration: 85,
          warmup:
            "Standard Protocol (15 min) + Extended Sprint Drills (12 min)",
          blocks: [
            {
              title: "Block 1: Maximum Velocity Development",
              duration: 40,
              options: [
                {
                  condition: "Track available",
                  exercises: [
                    {
                      name: "Flying 30s (Max Velocity)",
                      sets: 6,
                      protocol: "40m build-up + 30m timed max sprint",
                      rest: "5 min",
                      notes:
                        "Peak velocity work - focus on mechanics at max speed",
                    },
                    {
                      name: "60m Sprints",
                      sets: 5,
                      distance: "60m",
                      intensity: "Max effort",
                      rest: "5 min",
                      notes: "Extended sprint distance",
                    },
                    {
                      name: "10-Yard Acceleration Sprints",
                      sets: 6,
                      distance: "10 yards",
                      intensity: "Max effort",
                      rest: "3 min",
                      notes: "First step explosiveness",
                    },
                  ],
                },
                {
                  condition: "No track",
                  exercises: [
                    {
                      name: "Wall Sprint Drills",
                      sets: 8,
                      duration: "15s max",
                      rest: "2.5 min",
                    },
                    {
                      name: "Resistance Band Sprints (Heavy)",
                      sets: 12,
                      duration: "10s",
                      rest: "3 min",
                    },
                  ],
                },
              ],
            },
            {
              title: "Block 2: Speed Endurance",
              duration: 30,
              options: [
                {
                  condition: "Track available",
                  exercise: {
                    name: "150m Intervals",
                    sets: "8-10",
                    distance: "150m",
                    intensity: "90-95%",
                    rest: "3.5-4 min",
                    notes: "High-intensity speed endurance",
                  },
                },
                {
                  condition: "No track",
                  exercise: {
                    name: "Treadmill High-Intensity Intervals",
                    sets: "10",
                    duration: "90s",
                    intensity: "Very hard effort",
                    rest: "2.5 min",
                  },
                },
              ],
            },
          ],
          equipment: ["Track or treadmill", "resistance bands", "stopwatch"],
        },

        wednesday: {
          title: "Active Recovery + Mobility",
          type: "recovery",
          duration: 60,
          warmup: "Light movement (10 min)",
          blocks: [
            {
              title: "Block 1: Comprehensive Mobility",
              duration: 30,
              exercises: [
                { name: "Hip mobility circuit", duration: "15 min" },
                { name: "Ankle/calf mobility", duration: "10 min" },
                { name: "Thoracic mobility", duration: "5 min" },
              ],
            },
            {
              title: "Block 2: Light Activation + Recovery",
              duration: 20,
              exercises: [
                { name: "Glute activation circuit", rounds: 2 },
                { name: "Copenhagen Plank", sets: 2, duration: "40s each" },
                { name: "Foam rolling (comprehensive)", duration: "20 min" },
              ],
            },
          ],
          equipment: ["Yoga mat", "foam roller", "bands"],
        },

        thursday: {
          title: "Power + Agility Peak",
          type: "power",
          duration: 85,
          warmup: "Standard Protocol (15 min) + Plyometric Prep (10 min)",
          blocks: [
            {
              title: "Block 1: Complex Training (Power Emphasis)",
              duration: 30,
              exercises: [
                {
                  name: "Complex: Squat + Reactive Depth Jump + Vertical Jump",
                  sets: 5,
                  protocol:
                    "3 squats @ 35% BW → 3 depth jumps → 2 max vertical jumps",
                  rest: "4 min",
                  notes: "Triple complex for maximum power expression",
                },
                {
                  name: "Complex: Split Squat + Lateral Bound Series",
                  sets: 4,
                  protocol: "5 reps each leg → 6 lateral bounds each direction",
                  rest: "3 min",
                },
              ],
            },
            {
              title: "Block 2: Peak Plyometric Volume",
              duration: 35,
              exercises: [
                {
                  name: "Box Jumps (Maximum Height)",
                  sets: 6,
                  reps: 6,
                  rest: "2.5 min",
                  boxHeight: "30-36 inches",
                  notes: "Peak height for program",
                },
                {
                  name: "Broad Jumps (Maximum Distance)",
                  sets: 6,
                  reps: 4,
                  rest: "2 min",
                  notes: "Max horizontal power, measure distance",
                },
                {
                  name: "Tuck Jumps",
                  sets: 5,
                  reps: 6,
                  rest: "2 min",
                  notes: "Pull knees to chest, max height",
                },
              ],
            },
          ],
          equipment: [
            "Barbell/DBs",
            "plyo boxes (various heights)",
            "measuring tape",
          ],
        },

        friday: {
          title: "Maximum Speed + Advanced Agility",
          type: "sprint",
          duration: 80,
          warmup: "Standard Protocol (15 min) + Sprint Drills (12 min)",
          blocks: [
            {
              title: "Block 1: Peak Velocity Work",
              duration: 40,
              options: [
                {
                  condition: "Track available",
                  exercises: [
                    {
                      name: "40-Yard Sprints (Timed)",
                      sets: 6,
                      distance: "40 yards",
                      intensity: "Max effort",
                      rest: "5 min",
                      notes: "Track times - attempt PRs",
                    },
                    {
                      name: "Flying 20s",
                      sets: 6,
                      protocol: "30m build-up + 20m max sprint",
                      rest: "4 min",
                    },
                  ],
                },
                {
                  condition: "No track",
                  exercises: [
                    {
                      name: "Wall Sprint Drills",
                      sets: 8,
                      duration: "15s max",
                      rest: "2.5 min",
                    },
                    {
                      name: "First Step Explosions",
                      sets: 12,
                      distance: "10m",
                      rest: "2 min",
                    },
                  ],
                },
              ],
            },
            {
              title: "Block 2: Game-Specific Agility",
              duration: 30,
              exercises: [
                {
                  name: "Pro Agility (5-10-5) - Timed",
                  sets: 8,
                  rest: "3 min",
                  notes: "Maximum effort, track times",
                },
                {
                  name: "L-Drill - Timed",
                  sets: 6,
                  rest: "3 min",
                  notes: "Both directions",
                },
                {
                  name: "Reactive Agility Drills",
                  sets: 8,
                  duration: "20s",
                  rest: "2 min",
                  notes: "Partner calls directions - game simulation",
                },
              ],
            },
          ],
          equipment: ["Track or space", "cones", "stopwatch"],
        },

        saturday: {
          title: "RSA + Game Conditioning",
          type: "conditioning",
          duration: 70,
          warmup: "Standard Protocol (15 min) + Sprint Drills (10 min)",
          blocks: [
            {
              title: "Block 1: RSA at Game Intensity",
              duration: 45,
              options: [
                {
                  condition: "Track available",
                  exercise: {
                    name: "Game Simulation RSA",
                    sets: "15-18 sprints",
                    distance: "30m",
                    intensity: "Maximum effort each rep",
                    rest: "25s between sprints",
                    notes:
                      "Approaching game capacity (40+ sprints). Track fatigue index",
                  },
                },
                {
                  condition: "No track",
                  exercise: {
                    name: "RSA Simulation - Game Volume",
                    sets: "15-18 sprints",
                    duration: "8-10s max effort",
                    rest: "25s",
                    notes: "Building game conditioning",
                  },
                },
              ],
            },
          ],
          equipment: ["Track or space", "stopwatch"],
          notes: "Peak RSA volume approaching game demands",
        },

        sunday: {
          title: "Complete Recovery",
          type: "recovery",
          duration: 60,
          protocol: "Complete Recovery Protocol",
          activities: [
            { name: "Lower body chain stretching", duration: "25 min" },
            { name: "Foam rolling (full body)", duration: "20 min" },
            { name: "Light walk or easy bike", duration: "25 min" },
            { name: "Visualization + mental preparation", duration: "10 min" },
          ],
        },
      },
      weekSummary: {
        lowerBodySessions: 2,
        sprintSessions: 3,
        focus:
          "Explosive power development, maximum velocity emphasis, reactive plyometrics, RSA volume 15-18 sprints",
      },
    },

    week10: {
      weekNumber: 10,
      dateRange: "February 2-8, 2026",
      phase: "Power",
      focus: "Peak power output + game-specific conditioning",
      days: {
        monday: {
          title: "Peak Reactive Power",
          type: "power",
          duration: 85,
          warmup:
            "Standard Protocol (15 min) + Extended Plyometric Prep (12 min)",
          blocks: [
            {
              title: "Block 1: Maximum Reactive Ability",
              duration: 35,
              exercises: [
                {
                  name: "Depth Jumps (Maximum Reactive Height)",
                  sets: 6,
                  reps: 6,
                  rest: "3 min",
                  boxHeight: "12-15 inches",
                  notes:
                    "Absolute minimal ground contact time, max reactive jump",
                },
                {
                  name: "Hurdle Hops (Speed Emphasis)",
                  sets: 6,
                  reps: "12-15 hurdles",
                  rest: "2.5 min",
                  hurdleHeight: "15 inches",
                  notes: "Speed through the series, minimal contact",
                },
                {
                  name: "Double-Leg Bounds (Maximum Distance)",
                  sets: 5,
                  reps: "8 bounds",
                  rest: "2.5 min",
                  notes: "Max horizontal distance, explosive each rep",
                },
              ],
            },
            {
              title: "Block 2: Explosive Strength",
              duration: 30,
              exercises: [
                {
                  name: "Jump Squats (Bodyweight)",
                  sets: 5,
                  reps: 6,
                  rest: "2 min",
                  notes: "Maximum height each rep, explosive concentric",
                },
                {
                  name: "Broad Jumps",
                  sets: 5,
                  reps: 5,
                  rest: "2 min",
                  notes: "Measure distance - track progress",
                },
                {
                  name: "Lateral Bounds",
                  sets: 4,
                  reps: "8 each",
                  rest: "2 min",
                },
              ],
            },
            {
              title: "Block 3: Strength Maintenance",
              duration: 15,
              exercises: [
                {
                  name: "Back Squats",
                  sets: 3,
                  reps: 6,
                  rest: "2 min",
                  load: "30-35% BW (maintenance)",
                },
                {
                  name: "Nordic Curls",
                  sets: 3,
                  reps: "AMRAP",
                  rest: "2 min",
                },
              ],
            },
          ],
          equipment: ["Plyo boxes", "hurdles", "barbell/DBs"],
        },

        tuesday: {
          title: "Maximum Velocity + Lactate Tolerance",
          type: "sprint",
          duration: 90,
          warmup:
            "Standard Protocol (15 min) + Extended Sprint Drills (12 min)",
          blocks: [
            {
              title: "Block 1: Peak Velocity Development",
              duration: 45,
              options: [
                {
                  condition: "Track available",
                  exercises: [
                    {
                      name: "Flying 30s (Peak Velocity)",
                      sets: 6,
                      protocol: "40m build-up + 30m timed max sprint",
                      rest: "5-6 min",
                      notes: "Absolute maximum velocity - perfect mechanics",
                    },
                    {
                      name: "80m Sprints",
                      sets: 4,
                      distance: "80m",
                      intensity: "Max effort",
                      rest: "6 min",
                      notes: "Extended distance for velocity maintenance",
                    },
                    {
                      name: "20-Yard Sprints",
                      sets: 6,
                      distance: "20 yards",
                      intensity: "Max effort",
                      rest: "3 min",
                    },
                  ],
                },
                {
                  condition: "No track",
                  exercises: [
                    {
                      name: "Wall Sprint Drills",
                      sets: 8,
                      duration: "15s max",
                      rest: "3 min",
                    },
                    {
                      name: "Resistance Band Sprints",
                      sets: 12,
                      duration: "12s",
                      rest: "3 min",
                    },
                  ],
                },
              ],
            },
            {
              title: "Block 2: Lactate Tolerance Work",
              duration: 30,
              options: [
                {
                  condition: "Track available",
                  exercise: {
                    name: "200m Intervals",
                    sets: "6-8",
                    distance: "200m",
                    intensity: "90%",
                    rest: "5 min walk/jog",
                    notes: "High-intensity lactate tolerance",
                  },
                },
                {
                  condition: "No track",
                  exercise: {
                    name: "Treadmill Long Intervals",
                    sets: "8",
                    duration: "2 min",
                    intensity: "Very hard effort",
                    rest: "3 min walk",
                  },
                },
              ],
            },
          ],
          equipment: ["Track or treadmill", "resistance bands"],
        },

        wednesday: {
          title: "Active Recovery + Mobility",
          type: "recovery",
          duration: 60,
          warmup: "Light movement (10 min)",
          blocks: [
            {
              title: "Block 1: Comprehensive Mobility",
              duration: 30,
              exercises: [
                { name: "Hip mobility circuit", duration: "15 min" },
                { name: "Ankle/calf mobility", duration: "10 min" },
                { name: "Thoracic mobility", duration: "5 min" },
              ],
            },
            {
              title: "Block 2: Light Activation + Recovery",
              duration: 20,
              exercises: [
                { name: "Glute activation circuit", rounds: 2 },
                { name: "Copenhagen Plank", sets: 2, duration: "40s each" },
                { name: "Foam rolling (comprehensive)", duration: "20 min" },
              ],
            },
          ],
          equipment: ["Yoga mat", "foam roller", "bands"],
        },

        thursday: {
          title: "Power + Multi-Directional Explosiveness",
          type: "power",
          duration: 85,
          warmup: "Standard Protocol (15 min) + Plyometric Prep (10 min)",
          blocks: [
            {
              title: "Block 1: Multi-Directional Power",
              duration: 35,
              exercises: [
                {
                  name: "Lateral Box Jumps",
                  sets: 5,
                  reps: "6 each direction",
                  rest: "2.5 min",
                  boxHeight: "20-24 inches",
                  notes: "Lateral power development",
                },
                {
                  name: "Rotational Broad Jumps",
                  sets: 5,
                  reps: "4 each direction",
                  rest: "2 min",
                  notes: "180-degree rotation in air, land in broad jump",
                },
                {
                  name: "Single-Leg Lateral Bounds",
                  sets: 5,
                  reps: "6 each leg",
                  rest: "2 min",
                  notes: "Unilateral lateral power",
                },
              ],
            },
            {
              title: "Block 2: Reactive Agility Power",
              duration: 30,
              exercises: [
                {
                  name: "Reactive Box Jumps (Multi-Height)",
                  sets: 6,
                  reps: "5",
                  rest: "2.5 min",
                  protocol: 'Step down from 12", immediate jump to 30"',
                  notes: "Maximum reactive power",
                },
                {
                  name: "Pogo Jumps + Sprint",
                  sets: 5,
                  protocol: "20s pogo jumps → immediately 20m sprint",
                  rest: "3 min",
                  notes: "Reactive to linear speed transition",
                },
              ],
            },
            {
              title: "Block 3: Posterior Chain Maintenance",
              duration: 15,
              exercises: [
                {
                  name: "RDLs",
                  sets: 3,
                  reps: 8,
                  rest: "2 min",
                  load: "30% BW",
                },
                { name: "Glute-Ham Raises", sets: 3, reps: 10, rest: "90s" },
              ],
            },
          ],
          equipment: ["Plyo boxes (various heights)", "measuring tape"],
        },

        friday: {
          title: "Speed + Advanced Change of Direction",
          type: "sprint",
          duration: 80,
          warmup: "Standard Protocol (15 min) + Sprint Drills (12 min)",
          blocks: [
            {
              title: "Block 1: Maximum Speed Work",
              duration: 40,
              options: [
                {
                  condition: "Track available",
                  exercises: [
                    {
                      name: "40-Yard Sprints (PR Attempts)",
                      sets: 6,
                      distance: "40 yards",
                      intensity: "Max effort",
                      rest: "5 min",
                      notes: "Attempt personal records",
                    },
                    {
                      name: "Flying 20s",
                      sets: 6,
                      protocol: "30m build-up + 20m max sprint",
                      rest: "4 min",
                    },
                  ],
                },
                {
                  condition: "No track",
                  exercises: [
                    {
                      name: "Wall Sprint Drills",
                      sets: 8,
                      duration: "15s max",
                      rest: "2.5 min",
                    },
                    {
                      name: "Resistance Band Sprints",
                      sets: 10,
                      duration: "10s",
                      rest: "3 min",
                    },
                  ],
                },
              ],
            },
            {
              title: "Block 2: Peak Agility Work",
              duration: 30,
              exercises: [
                {
                  name: "Pro Agility (PR Attempts)",
                  sets: 6,
                  rest: "4 min",
                  notes: "Maximum effort - attempt PRs",
                },
                {
                  name: "L-Drill (Both Directions)",
                  sets: 6,
                  rest: "3 min",
                  notes: "Timed - track both directions",
                },
                {
                  name: "Reactive Cone Drills (Game Speed)",
                  sets: 8,
                  duration: "25s",
                  rest: "2 min",
                  notes: "Partner calls - game simulation",
                },
              ],
            },
          ],
          equipment: ["Track or space", "cones", "stopwatch"],
        },

        saturday: {
          title: "Peak RSA + Game Conditioning",
          type: "conditioning",
          duration: 75,
          warmup: "Standard Protocol (15 min) + Sprint Drills (10 min)",
          blocks: [
            {
              title: "Block 1: Peak RSA Volume",
              duration: 50,
              options: [
                {
                  condition: "Track available",
                  exercise: {
                    name: "Game Simulation RSA (Peak Volume)",
                    sets: "18-20 sprints",
                    distance: "30m",
                    intensity: "Maximum effort each rep",
                    rest: "25s between sprints",
                    notes:
                      "PEAK RSA volume. Simulates late-game fatigue. Track performance drop-off",
                  },
                },
                {
                  condition: "No track",
                  exercise: {
                    name: "RSA Simulation - Peak Volume",
                    sets: "18-20 sprints",
                    duration: "8-10s max effort",
                    rest: "25s",
                    notes: "Peak game conditioning volume",
                  },
                },
              ],
            },
          ],
          equipment: ["Track or space", "stopwatch"],
          notes: "Peak RSA week - capacity for 40+ sprint games",
        },

        sunday: {
          title: "Complete Recovery",
          type: "recovery",
          duration: 60,
          protocol: "Complete Recovery Protocol",
          activities: [
            { name: "Lower body chain stretching", duration: "25 min" },
            { name: "Foam rolling (full body)", duration: "20 min" },
            { name: "Light walk or easy bike", duration: "25 min" },
            { name: "Visualization + game preparation", duration: "10 min" },
          ],
        },
      },
      weekSummary: {
        lowerBodySessions: 2,
        sprintSessions: 3,
        focus:
          "Peak power output, maximum velocity development, multi-directional explosiveness, RSA peak 18-20 sprints",
      },
    },

    week11: {
      weekNumber: 11,
      dateRange: "February 9-15, 2026",
      phase: "Power",
      focus: "Power maintenance + game-specific conditioning peak",
      days: {
        monday: {
          title: "Power Maintenance + Game Preparation",
          type: "power",
          duration: 75,
          warmup: "Standard Protocol (15 min) + Plyometric Prep (10 min)",
          blocks: [
            {
              title: "Block 1: Reactive Power Maintenance",
              duration: 30,
              exercises: [
                {
                  name: "Depth Jumps",
                  sets: 5,
                  reps: 5,
                  rest: "2.5 min",
                  boxHeight: "12 inches",
                  notes: "Maintain reactive ability",
                },
                {
                  name: "Box Jumps",
                  sets: 5,
                  reps: 5,
                  rest: "2 min",
                  boxHeight: "30 inches",
                },
                {
                  name: "Broad Jumps",
                  sets: 4,
                  reps: 4,
                  rest: "2 min",
                },
              ],
            },
            {
              title: "Block 2: Multi-Directional Power",
              duration: 25,
              exercises: [
                {
                  name: "Lateral Bounds",
                  sets: 4,
                  reps: "6 each",
                  rest: "2 min",
                },
                {
                  name: "Single-Leg Bounds",
                  sets: 4,
                  distance: "25m each",
                  rest: "2 min",
                },
              ],
            },
            {
              title: "Block 3: Strength Maintenance",
              duration: 15,
              exercises: [
                {
                  name: "Goblet Squats",
                  sets: 3,
                  reps: 8,
                  rest: "2 min",
                  load: "Moderate DB",
                },
                {
                  name: "Nordic Curls",
                  sets: 3,
                  reps: "AMRAP",
                  rest: "2 min",
                },
              ],
            },
          ],
          equipment: ["Plyo boxes", "dumbbells"],
        },

        tuesday: {
          title: "Game Speed + Conditioning",
          type: "sprint",
          duration: 85,
          warmup: "Standard Protocol (15 min) + Sprint Drills (12 min)",
          blocks: [
            {
              title: "Block 1: Game-Specific Speed Work",
              duration: 40,
              options: [
                {
                  condition: "Track available",
                  exercises: [
                    {
                      name: "40-Yard Sprints (Game Simulation)",
                      sets: 6,
                      distance: "40 yards",
                      intensity: "Max effort",
                      rest: "4 min",
                      notes: "Game-specific distance",
                    },
                    {
                      name: "Flying 20s",
                      sets: 6,
                      protocol: "30m build-up + 20m max sprint",
                      rest: "4 min",
                    },
                    {
                      name: "10-Yard Sprints (Game Starts)",
                      sets: 8,
                      distance: "10 yards",
                      intensity: "Max effort",
                      rest: "2 min",
                    },
                  ],
                },
                {
                  condition: "No track",
                  exercises: [
                    {
                      name: "Wall Sprint Drills",
                      sets: 8,
                      duration: "15s max",
                      rest: "2.5 min",
                    },
                    {
                      name: "First Step Explosions",
                      sets: 12,
                      distance: "10m",
                      rest: "2 min",
                    },
                  ],
                },
              ],
            },
            {
              title: "Block 2: Speed Endurance",
              duration: 30,
              options: [
                {
                  condition: "Track available",
                  exercise: {
                    name: "150m Intervals (Game Pace)",
                    sets: "8",
                    distance: "150m",
                    intensity: "90%",
                    rest: "3.5 min",
                    notes: "Game-specific speed endurance",
                  },
                },
                {
                  condition: "No track",
                  exercise: {
                    name: "Treadmill Intervals",
                    sets: "10",
                    duration: "90s",
                    intensity: "Hard effort",
                    rest: "2 min",
                  },
                },
              ],
            },
          ],
          equipment: ["Track or treadmill", "cones"],
        },

        wednesday: {
          title: "Active Recovery + Mobility",
          type: "recovery",
          duration: 60,
          warmup: "Light movement (10 min)",
          blocks: [
            {
              title: "Block 1: Comprehensive Mobility",
              duration: 30,
              exercises: [
                { name: "Hip mobility circuit", duration: "15 min" },
                { name: "Ankle/calf mobility", duration: "10 min" },
                { name: "Thoracic mobility", duration: "5 min" },
              ],
            },
            {
              title: "Block 2: Light Activation + Recovery",
              duration: 20,
              exercises: [
                { name: "Glute activation circuit", rounds: 2 },
                { name: "Copenhagen Plank", sets: 2, duration: "40s each" },
                { name: "Foam rolling (comprehensive)", duration: "20 min" },
              ],
            },
          ],
          equipment: ["Yoga mat", "foam roller", "bands"],
        },

        thursday: {
          title: "Power + Agility Integration",
          type: "power",
          duration: 75,
          warmup: "Standard Protocol (15 min) + Plyometric Prep (10 min)",
          blocks: [
            {
              title: "Block 1: Integrated Power + Agility",
              duration: 35,
              exercises: [
                {
                  name: "Box Jump + Pro Agility",
                  sets: 5,
                  protocol: '3 box jumps (24") → immediately Pro Agility drill',
                  rest: "3 min",
                  notes: "Power to agility transition",
                },
                {
                  name: "Depth Jump + Sprint",
                  sets: 5,
                  protocol: "3 depth jumps → immediately 20m sprint",
                  rest: "3 min",
                  notes: "Reactive to linear speed",
                },
                {
                  name: "Lateral Bounds + L-Drill",
                  sets: 4,
                  protocol: "6 lateral bounds each → immediately L-drill",
                  rest: "3 min",
                },
              ],
            },
            {
              title: "Block 2: Plyometric Maintenance",
              duration: 25,
              exercises: [
                { name: "Pogo Jumps", sets: 4, duration: "20s", rest: "2 min" },
                {
                  name: "Hurdle Hops",
                  sets: 4,
                  reps: "10 hurdles",
                  rest: "2 min",
                },
                { name: "Broad Jumps", sets: 4, reps: 4, rest: "2 min" },
              ],
            },
          ],
          equipment: ["Plyo boxes", "cones", "hurdles"],
        },

        friday: {
          title: "Maximum Speed + Game Agility",
          type: "sprint",
          duration: 75,
          warmup: "Standard Protocol (15 min) + Sprint Drills (12 min)",
          blocks: [
            {
              title: "Block 1: Speed Work",
              duration: 35,
              options: [
                {
                  condition: "Track available",
                  exercises: [
                    {
                      name: "40-Yard Sprints",
                      sets: 6,
                      distance: "40 yards",
                      intensity: "Max effort",
                      rest: "4 min",
                    },
                    {
                      name: "Flying 10s",
                      sets: 6,
                      protocol: "20m build-up + 10m max sprint",
                      rest: "3 min",
                    },
                  ],
                },
                {
                  condition: "No track",
                  exercises: [
                    {
                      name: "Wall Sprint Drills",
                      sets: 8,
                      duration: "15s max",
                      rest: "2.5 min",
                    },
                    {
                      name: "Resistance Band Sprints",
                      sets: 10,
                      duration: "10s",
                      rest: "3 min",
                    },
                  ],
                },
              ],
            },
            {
              title: "Block 2: Game Agility",
              duration: 30,
              exercises: [
                { name: "Pro Agility", sets: 6, rest: "3 min" },
                { name: "L-Drill", sets: 5, rest: "2.5 min" },
                {
                  name: "Reactive Cone Drills",
                  sets: 8,
                  duration: "20s",
                  rest: "2 min",
                },
              ],
            },
          ],
          equipment: ["Track or space", "cones"],
        },

        saturday: {
          title: "Game Simulation RSA",
          type: "conditioning",
          duration: 75,
          warmup: "Standard Protocol (15 min) + Sprint Drills (10 min)",
          blocks: [
            {
              title: "Block 1: Full Game RSA Simulation",
              duration: 50,
              options: [
                {
                  condition: "Track available",
                  exercise: {
                    name: "Full Game RSA Simulation",
                    sets: "20-22 sprints",
                    distance: "30m",
                    intensity: "Maximum effort each rep",
                    rest: "25s between sprints",
                    notes:
                      "Full game simulation. Capacity for 40+ sprint games. Track fatigue index",
                  },
                },
                {
                  condition: "No track",
                  exercise: {
                    name: "RSA Game Simulation",
                    sets: "20-22 sprints",
                    duration: "8-10s max effort",
                    rest: "25s",
                    notes: "Game conditioning capacity",
                  },
                },
              ],
            },
          ],
          equipment: ["Track or space", "stopwatch"],
          notes: "Full game capacity - ready for competition",
        },

        sunday: {
          title: "Complete Recovery",
          type: "recovery",
          duration: 60,
          protocol: "Complete Recovery Protocol",
          activities: [
            { name: "Lower body chain stretching", duration: "25 min" },
            { name: "Foam rolling (full body)", duration: "20 min" },
            { name: "Light walk or easy bike", duration: "25 min" },
            { name: "Mental preparation + visualization", duration: "10 min" },
          ],
        },
      },
      weekSummary: {
        lowerBodySessions: 2,
        sprintSessions: 3,
        focus:
          "Power maintenance, game-specific conditioning, integrated power + agility work, RSA game simulation 20-22 sprints",
      },
    },

    week12: {
      weekNumber: 12,
      dateRange: "February 16-22, 2026",
      phase: "Power",
      focus: "Final assessment + transition to Competition phase",
      assessmentWeek: true,
      days: {
        monday: {
          title: "Power & Strength Assessment",
          type: "assessment",
          duration: 90,
          warmup: "Extended Protocol (20 min)",
          blocks: [
            {
              title: "Block 1: Power Assessment",
              duration: 30,
              exercises: [
                {
                  name: "Vertical Jump Test",
                  sets: 3,
                  rest: "3 min",
                  record: "Best jump height. Compare to Weeks 1 & 8",
                  notes: "Jump mat or wall mark",
                },
                {
                  name: "Broad Jump Test",
                  sets: 3,
                  rest: "3 min",
                  record: "Best distance. Compare to Weeks 1 & 8",
                },
                {
                  name: 'Depth Jump Test (12" Box)',
                  sets: 3,
                  rest: "3 min",
                  record: "Best reactive jump height",
                },
              ],
            },
            {
              title: "Block 2: Strength Assessment",
              duration: 30,
              exercises: [
                {
                  name: "Back Squat - Test Set",
                  sets: "1-2",
                  reps: "Max reps @ 40% BW",
                  rest: "5 min",
                  record: "Total reps. Compare to Weeks 1 & 8",
                },
                {
                  name: "RDL - Test Set",
                  sets: "1-2",
                  reps: "Max reps @ 35% BW",
                  rest: "5 min",
                  record: "Total reps",
                },
                {
                  name: "Nordic Curls - Unassisted Test",
                  sets: 2,
                  reps: "AMRAP (no assistance)",
                  rest: "4 min",
                  record: "Best set total reps",
                },
              ],
            },
            {
              title: "Block 3: Reactive Ability Assessment",
              duration: 20,
              exercises: [
                {
                  name: "Repeated Pogo Jump Test",
                  sets: 2,
                  duration: "30s max height",
                  rest: "3 min",
                  record: "Total jumps + avg height if available",
                },
                {
                  name: "10-Jump Test",
                  sets: 2,
                  protocol: "10 consecutive max broad jumps",
                  rest: "4 min",
                  record: "Total distance",
                },
              ],
            },
          ],
          equipment: ["Barbell/DBs", "measuring tape", "jump mat"],
          notes: "Record all results for comparison to Weeks 1 & 8",
        },

        tuesday: {
          title: "Speed & Agility Assessment",
          type: "assessment",
          duration: 90,
          warmup: "Extended Protocol (20 min) + thorough sprint drills",
          blocks: [
            {
              title: "Block 1: Linear Speed Assessment",
              duration: 35,
              exercises: [
                {
                  name: "10-Yard Sprint Test",
                  sets: 3,
                  rest: "4 min",
                  record: "Best time. Compare to Weeks 1 & 8",
                },
                {
                  name: "20-Yard Sprint Test",
                  sets: 3,
                  rest: "4 min",
                  record: "Best time",
                },
                {
                  name: "40-Yard Sprint Test",
                  sets: 3,
                  rest: "5 min",
                  record: "Best time. PRIMARY speed metric",
                },
                {
                  name: "Flying 20m Test",
                  sets: 3,
                  protocol: "30m build-up + 20m timed",
                  rest: "5 min",
                  record: "Best time (max velocity)",
                },
              ],
            },
            {
              title: "Block 2: Change of Direction Assessment",
              duration: 30,
              exercises: [
                {
                  name: "Pro Agility Test (5-10-5)",
                  sets: 3,
                  rest: "4 min",
                  record: "Best time. Compare to Weeks 1 & 8",
                },
                {
                  name: "L-Drill Test",
                  sets: 3,
                  rest: "3.5 min",
                  record: "Best time each direction",
                },
                {
                  name: "T-Test",
                  sets: 2,
                  rest: "4 min",
                  record: "Best time",
                },
              ],
            },
            {
              title: "Block 3: RSA Assessment",
              duration: 20,
              exercise: {
                name: "RSA Test (10 Sprints)",
                sets: "10 sprints",
                distance: "30m",
                intensity: "Max effort each",
                rest: "25s",
                record:
                  "All 10 times. Calculate fatigue index: (worst - best) / best × 100%",
                notes: "Compare to Week 8",
              },
            },
          ],
          equipment: ["Cones", "stopwatch or electronic timing"],
          notes: "Compare all results to Weeks 1 & 8 - track improvements",
        },

        wednesday: {
          title: "Movement Quality + Recovery",
          type: "recovery",
          duration: 60,
          warmup: "Light movement (10 min)",
          blocks: [
            {
              title: "Block 1: Movement Quality Assessment",
              duration: 25,
              exercises: [
                {
                  name: "Single-Leg Balance Test",
                  sets: 2,
                  duration: "Max time (up to 60s)",
                  record: "Best time each leg",
                },
                {
                  name: "Overhead Squat Assessment",
                  sets: 3,
                  reps: 5,
                  notes: "Movement quality, depth, balance",
                },
              ],
            },
            {
              title: "Block 2: Comprehensive Recovery",
              duration: 30,
              exercises: [
                { name: "Full body stretching", duration: "20 min" },
                { name: "Foam rolling", duration: "15 min" },
              ],
            },
          ],
          equipment: ["Yoga mat", "foam roller"],
        },

        thursday: {
          title: "Deload - Light Power Work",
          type: "power",
          duration: 50,
          warmup: "Standard Protocol (15 min)",
          blocks: [
            {
              title: "Block 1: Light Plyometrics",
              duration: 25,
              exercises: [
                {
                  name: "Box Jumps",
                  sets: 3,
                  reps: 5,
                  rest: "2 min",
                  boxHeight: "16-20 inches (reduced)",
                  notes: "50-60% effort - movement quality",
                },
                {
                  name: "Pogo Jumps",
                  sets: 3,
                  duration: "15s",
                  rest: "90s",
                  notes: "Light, springy",
                },
                {
                  name: "Lateral Bounds",
                  sets: 3,
                  reps: "6 each",
                  rest: "90s",
                },
              ],
            },
          ],
          equipment: ["Plyo boxes"],
        },

        friday: {
          title: "Deload - Speed Mechanics",
          type: "sprint",
          duration: 45,
          warmup: "Standard Protocol (15 min)",
          blocks: [
            {
              title: "Block 1: Sprint Drills + Light Speed Work",
              duration: 25,
              exercises: [
                {
                  name: "A-march/A-skip",
                  sets: 3,
                  distance: "20m each",
                  rest: "60s",
                  notes: "Perfect mechanics",
                },
                {
                  name: "Build-Up Runs",
                  sets: 4,
                  distance: "50m",
                  intensity: "70-80%",
                  rest: "3 min",
                },
                {
                  name: "Flying 10s (Light)",
                  sets: 4,
                  protocol: "20m build-up + 10m @ 80%",
                  rest: "3 min",
                },
              ],
            },
          ],
          equipment: ["Track or space"],
        },

        saturday: {
          title: "Deload - Light Strength",
          type: "strength",
          duration: 50,
          warmup: "Standard Protocol (15 min)",
          blocks: [
            {
              title: "Block 1: Light Lower Body",
              duration: 30,
              exercises: [
                {
                  name: "Goblet Squats",
                  sets: 3,
                  reps: 8,
                  rest: "2 min",
                  load: "Light-moderate DB (50-60% of training load)",
                },
                {
                  name: "RDLs",
                  sets: 3,
                  reps: 8,
                  rest: "2 min",
                  load: "20-25% BW (light)",
                },
                {
                  name: "Single-Leg RDL",
                  sets: 3,
                  reps: "6 each",
                  rest: "90s",
                  load: "Light DB or bodyweight",
                },
                {
                  name: "Copenhagen Plank",
                  sets: 2,
                  duration: "30s each",
                  rest: "60s",
                },
              ],
            },
          ],
          equipment: ["Dumbbells", "mat"],
        },

        sunday: {
          title: "Complete Recovery + Phase Review",
          type: "recovery",
          duration: 60,
          protocol: "Complete Recovery Protocol",
          activities: [
            { name: "Lower body stretching", duration: "25 min" },
            { name: "Foam rolling", duration: "20 min" },
            { name: "Light walk/bike", duration: "25 min" },
            {
              name: "Review assessment results + set Competition phase goals",
              duration: "15 min",
            },
          ],
        },
      },
      weekSummary: {
        lowerBodySessions: 1,
        sprintSessions: 2,
        assessmentFocus:
          "Power (jumps, reactive ability), strength, speed, agility, RSA",
        deloadVolume: "50-60% of training loads",
        notes:
          "Compare all results to Weeks 1 & 8. Prepare for Competition phase (Weeks 13-14)",
      },
      phaseSummary: {
        title: "Power Phase Complete (Weeks 9-12)!",
        achievements: [
          "Converted strength to explosive power",
          "Peak plyometric abilities (depth jumps, reactive work)",
          "Maximum velocity development (flying 30s, 40-yard sprints)",
          "Multi-directional power (lateral bounds, rotational jumps)",
          "Game-specific conditioning (RSA 15-22 sprints)",
          "Integrated power + agility work (game-specific transitions)",
          "Peak reactive ability (minimal ground contact times)",
        ],
        keyMetrics: {
          powerGains:
            "Compare Week 12 to Week 8 to Week 1: vertical jump, broad jump, depth jump",
          speedGains: "10/20/40-yard sprints, flying 20m max velocity",
          agilityGains: "Pro Agility, L-drill, T-test times",
          conditioningGains:
            "RSA capacity (20-22 sprints), fatigue index improvement",
          reactiveGains: "Pogo jump test, 10-jump test",
        },
        nextPhase: {
          name: "Competition Prep (Weeks 13-14)",
          focus: [
            "Outdoor transition complete",
            "Peak power maintenance",
            "Volume reduction (taper)",
            "Competition simulation",
            "Mental preparation",
            "Physical freshness for competition",
          ],
          trainingShifts: {
            volume: "Reduce 40-50% for taper",
            intensity: "Maintain at 90-100% for speed/power",
            focus: "Quality over quantity",
            outdoor: "Full outdoor transition (weather permitting)",
          },
        },
      },
    },

    week13: {
      weekNumber: 13,
      dateRange: "February 23 - March 1, 2026",
      phase: "Competition Prep",
      focus: "Taper + competition simulation",
      days: {
        monday: {
          title: "Power Maintenance - Quality Over Quantity",
          type: "power",
          duration: 60,
          warmup: "Standard Protocol (15 min) + Plyometric Prep (8 min)",
          blocks: [
            {
              title: "Block 1: Explosive Power Maintenance",
              duration: 25,
              exercises: [
                {
                  name: "Depth Jumps",
                  sets: 4,
                  reps: 4,
                  rest: "3 min",
                  boxHeight: "12 inches",
                  notes:
                    "50-60% volume, 100% intensity - maintain explosive ability",
                },
                {
                  name: "Box Jumps",
                  sets: 4,
                  reps: 4,
                  rest: "2.5 min",
                  boxHeight: "30 inches",
                  notes: "Quality reps only",
                },
                {
                  name: "Broad Jumps",
                  sets: 3,
                  reps: 3,
                  rest: "2 min",
                  notes: "Maximum effort each rep",
                },
              ],
            },
            {
              title: "Block 2: Light Strength Maintenance",
              duration: 15,
              exercises: [
                {
                  name: "Goblet Squats",
                  sets: 3,
                  reps: 6,
                  rest: "2 min",
                  load: "Moderate DB (30-35% of max)",
                  notes: "Light maintenance volume",
                },
                {
                  name: "Nordic Curls",
                  sets: 2,
                  reps: "AMRAP",
                  rest: "2 min",
                  notes: "Maintain hamstring readiness",
                },
              ],
            },
          ],
          equipment: ["Plyo boxes", "dumbbells"],
          notes: "TAPER WEEK - Quality over quantity. Stay fresh.",
        },

        tuesday: {
          title: "Speed Sharpening + Competition Simulation",
          type: "sprint",
          duration: 70,
          warmup: "Standard Protocol (15 min) + Sprint Drills (10 min)",
          blocks: [
            {
              title: "Block 1: Speed Sharpening",
              duration: 30,
              options: [
                {
                  condition: "Track available",
                  exercises: [
                    {
                      name: "40-Yard Sprints",
                      sets: 5,
                      distance: "40 yards",
                      intensity: "95-100%",
                      rest: "5 min",
                      notes: "Sharpen speed, not build fitness",
                    },
                    {
                      name: "Flying 10s",
                      sets: 5,
                      protocol: "20m build-up + 10m max sprint",
                      rest: "4 min",
                      notes: "Perfect mechanics at max velocity",
                    },
                  ],
                },
                {
                  condition: "No track",
                  exercises: [
                    {
                      name: "Wall Sprint Drills",
                      sets: 6,
                      duration: "12s max",
                      rest: "3 min",
                    },
                    {
                      name: "First Step Explosions",
                      sets: 8,
                      distance: "10m",
                      rest: "2 min",
                    },
                  ],
                },
              ],
            },
            {
              title: "Block 2: Agility Sharpening",
              duration: 20,
              exercises: [
                {
                  name: "Pro Agility",
                  sets: 4,
                  rest: "3 min",
                  notes: "Maximum effort, perfect technique",
                },
                {
                  name: "L-Drill",
                  sets: 4,
                  rest: "3 min",
                  notes: "Sharp cuts, game speed",
                },
              ],
            },
          ],
          equipment: ["Track or space", "cones"],
        },

        wednesday: {
          title: "Active Recovery + Mental Preparation",
          type: "recovery",
          duration: 50,
          warmup: "Light movement (10 min)",
          blocks: [
            {
              title: "Block 1: Light Mobility",
              duration: 20,
              exercises: [
                { name: "Hip mobility circuit", duration: "10 min" },
                { name: "Ankle/calf mobility", duration: "8 min" },
              ],
            },
            {
              title: "Block 2: Recovery + Mental Work",
              duration: 20,
              exercises: [
                { name: "Foam rolling (light)", duration: "12 min" },
                {
                  name: "Visualization + competition mental prep",
                  duration: "15 min",
                },
              ],
            },
          ],
          equipment: ["Yoga mat", "foam roller"],
          notes: "Mental preparation becomes priority",
        },

        thursday: {
          title: "Competition Simulation - Game Speed",
          type: "sprint + power",
          duration: 65,
          warmup: "Standard Protocol (15 min) + Dynamic Warm-up (10 min)",
          blocks: [
            {
              title: "Block 1: Game Scenario Drills",
              duration: 30,
              exercises: [
                {
                  name: "Game Situation Sprints",
                  sets: 8,
                  distance: "20-40 yards",
                  intensity: "Game speed (90-95%)",
                  rest: "3 min",
                  notes:
                    "Simulate game scenarios - routes, breakaways, pursuit angles",
                },
                {
                  name: "Reactive Agility (Partner Calls)",
                  sets: 6,
                  duration: "15s",
                  rest: "2.5 min",
                  notes: "Game-specific reactive work",
                },
              ],
            },
            {
              title: "Block 2: Light Plyometric Reactivity",
              duration: 15,
              exercises: [
                { name: "Pogo Jumps", sets: 3, duration: "15s", rest: "2 min" },
                {
                  name: "Lateral Bounds",
                  sets: 3,
                  reps: "4 each",
                  rest: "2 min",
                },
              ],
            },
          ],
          equipment: ["Cones", "plyo boxes"],
          notes: "Game simulation - stay sharp, stay fresh",
        },

        friday: {
          title: "Speed Maintenance + Technique",
          type: "sprint",
          duration: 45,
          warmup: "Standard Protocol (15 min)",
          blocks: [
            {
              title: "Block 1: Speed Drills + Light Sprints",
              duration: 25,
              exercises: [
                {
                  name: "A-skip/B-skip",
                  sets: 3,
                  distance: "20m each",
                  rest: "90s",
                  notes: "Perfect mechanics",
                },
                {
                  name: "Build-Up Runs",
                  sets: 4,
                  distance: "40m",
                  intensity: "70-80-90%",
                  rest: "3 min",
                  notes: "Smooth acceleration, maintain speed",
                },
              ],
            },
          ],
          equipment: ["Track or space"],
        },

        saturday: {
          title: "Competition RSA - Short Volume",
          type: "conditioning",
          duration: 50,
          warmup: "Standard Protocol (15 min) + Sprint Drills (8 min)",
          blocks: [
            {
              title: "Block 1: Light RSA Work",
              duration: 25,
              options: [
                {
                  condition: "Track available",
                  exercise: {
                    name: "Repeated Sprint Ability (Competition Prep)",
                    sets: "8-10 sprints",
                    distance: "30m",
                    intensity: "90-95%",
                    rest: "30s",
                    notes: "Maintain capacity, don't build it - taper volume",
                  },
                },
                {
                  condition: "No track",
                  exercise: {
                    name: "RSA Simulation - Light",
                    sets: "8-10 sprints",
                    duration: "8s",
                    intensity: "90-95%",
                    rest: "30s",
                  },
                },
              ],
            },
          ],
          equipment: ["Track or space"],
          notes: "Light RSA to maintain game conditioning",
        },

        sunday: {
          title: "Complete Recovery + Final Mental Prep",
          type: "recovery",
          duration: 60,
          protocol: "Complete Recovery Protocol",
          activities: [
            { name: "Lower body stretching", duration: "20 min" },
            { name: "Foam rolling", duration: "15 min" },
            { name: "Light walk", duration: "20 min" },
            {
              name: "Competition visualization + strategy",
              duration: "20 min",
            },
          ],
        },
      },
      weekSummary: {
        lowerBodySessions: 1,
        sprintSessions: 4,
        focus:
          "Taper (40-50% volume), maintain intensity (90-100%), competition simulation, mental preparation",
        notes:
          "Quality over quantity. Stay sharp, stay fresh. Mental prep becomes priority.",
      },
    },

    week14: {
      weekNumber: 14,
      dateRange: "March 2-8, 2026",
      phase: "Competition Prep",
      focus: "Final preparation + peak freshness",
      days: {
        monday: {
          title: "Light Power Activation",
          type: "power",
          duration: 40,
          warmup: "Standard Protocol (12 min) + Light Plyometric Prep (5 min)",
          blocks: [
            {
              title: "Block 1: Explosive Activation",
              duration: 20,
              exercises: [
                {
                  name: "Box Jumps",
                  sets: 3,
                  reps: 3,
                  rest: "2.5 min",
                  boxHeight: "24-28 inches",
                  notes: "Neuromuscular activation - quality only",
                },
                {
                  name: "Broad Jumps",
                  sets: 3,
                  reps: 3,
                  rest: "2 min",
                  notes: "Max effort, full recovery",
                },
                {
                  name: "Pogo Jumps",
                  sets: 2,
                  duration: "12s",
                  rest: "2 min",
                  notes: "Reactive activation",
                },
              ],
            },
          ],
          equipment: ["Plyo boxes"],
          notes: "MINIMAL VOLUME - Just activation. Stay fresh.",
        },

        tuesday: {
          title: "Speed Activation + Game Prep",
          type: "sprint",
          duration: 50,
          warmup: "Standard Protocol (15 min) + Sprint Drills (8 min)",
          blocks: [
            {
              title: "Block 1: Speed Activation",
              duration: 25,
              options: [
                {
                  condition: "Track available",
                  exercises: [
                    {
                      name: "40-Yard Sprints",
                      sets: 4,
                      distance: "40 yards",
                      intensity: "95%",
                      rest: "5 min",
                      notes: "Activation only - not max effort",
                    },
                    {
                      name: "Flying 10s",
                      sets: 4,
                      protocol: "20m build-up + 10m @ 95%",
                      rest: "4 min",
                    },
                  ],
                },
                {
                  condition: "No track",
                  exercises: [
                    {
                      name: "Wall Sprint Drills",
                      sets: 5,
                      duration: "10s",
                      rest: "3 min",
                    },
                    {
                      name: "First Step Explosions",
                      sets: 6,
                      distance: "10m",
                      rest: "2 min",
                    },
                  ],
                },
              ],
            },
          ],
          equipment: ["Track or space"],
        },

        wednesday: {
          title: "Recovery + Visualization",
          type: "recovery",
          duration: 45,
          warmup: "Light movement (8 min)",
          blocks: [
            {
              title: "Block 1: Light Mobility + Mental Work",
              duration: 35,
              exercises: [
                { name: "Hip mobility circuit (light)", duration: "10 min" },
                { name: "Light stretching", duration: "10 min" },
                {
                  name: "Competition visualization",
                  duration: "20 min",
                  notes: "Primary focus",
                },
              ],
            },
          ],
          equipment: ["Yoga mat"],
          notes: "Mental preparation is primary focus",
        },

        thursday: {
          title: "Light Game Simulation",
          type: "activation",
          duration: 45,
          warmup: "Standard Protocol (12 min)",
          blocks: [
            {
              title: "Block 1: Game Scenario Activation",
              duration: 25,
              exercises: [
                {
                  name: "Game Situation Sprints (Light)",
                  sets: 5,
                  distance: "20-30 yards",
                  intensity: "85-90%",
                  rest: "3 min",
                  notes: "Feel game speed, stay fresh",
                },
                {
                  name: "Pro Agility (Light)",
                  sets: 3,
                  intensity: "85-90%",
                  rest: "3 min",
                  notes: "Agility activation",
                },
              ],
            },
          ],
          equipment: ["Cones"],
        },

        friday: {
          title: "Final Speed Activation",
          type: "activation",
          duration: 35,
          warmup: "Standard Protocol (12 min)",
          blocks: [
            {
              title: "Block 1: Neuromuscular Activation",
              duration: 20,
              exercises: [
                {
                  name: "Build-Up Runs",
                  sets: 3,
                  distance: "40m",
                  intensity: "60-70-80%",
                  rest: "3 min",
                  notes: "Feel speed, perfect mechanics",
                },
                {
                  name: "Starts (From Stance)",
                  sets: 4,
                  distance: "10m",
                  intensity: "90%",
                  rest: "2 min",
                  notes: "First step sharpness",
                },
              ],
            },
          ],
          equipment: ["Track or space"],
          notes: "Last session before competition - VERY light",
        },

        saturday: {
          title: "Complete Rest + Final Mental Prep",
          type: "rest",
          duration: 30,
          activities: [
            { name: "Light stretching (optional)", duration: "10 min" },
            { name: "Competition strategy review", duration: "15 min" },
            { name: "Visualization", duration: "15 min" },
          ],
          notes: "Complete physical rest. Mental preparation only.",
        },

        sunday: {
          title: "COMPETITION DAY or Final Preparation",
          type: "competition",
          preGameWarmup: "Extended warm-up protocol (20-25 min)",
          notes:
            "Ready to compete. Trust your preparation. Execute the game plan.",
        },
      },
      weekSummary: {
        lowerBodySessions: 1,
        sprintSessions: 3,
        focus:
          "Minimal volume (20-30% of peak), activation only, peak freshness, mental preparation",
        notes:
          "Physical work is minimal. Mental preparation is priority. Ready to compete.",
      },
      programSummary: {
        title: "14-WEEK WR/DB OFFSEASON PROGRAM COMPLETE!",
        overallAchievements: [
          "Complete periodized program: Foundation → Strength → Power → Competition",
          "Maximum strength developed (40% BW squats/RDLs)",
          "Explosive power peak (depth jumps, reactive work, max velocity sprints)",
          "Game-specific conditioning (RSA 20-22 sprint capacity)",
          "Multi-directional speed + agility development",
          "Injury prevention focus (Nordic curls, Copenhagen planks, comprehensive mobility)",
          "Taper for peak performance",
        ],
        keyProgression: {
          strength:
            "Weeks 1-8: Foundation + Strength Development (25-40% BW loads)",
          power:
            "Weeks 9-12: Power Phase (peak plyometrics, max velocity, RSA 20-22 sprints)",
          taper:
            "Weeks 13-14: Competition Prep (volume reduction, intensity maintenance)",
        },
        physicalReadiness: {
          strength:
            "Maximum safe loads achieved, hamstring injury prevention optimized",
          power: "Vertical jump, broad jump, reactive ability peaked",
          speed: "10/20/40-yard sprint times optimized, max velocity developed",
          agility: "Pro Agility, L-drill times improved",
          conditioning: "RSA capacity for 40+ sprint games",
        },
        nextSteps: [
          "COMPETE with confidence",
          "Execute game plan",
          "Trust your preparation",
          "Maintain training during season (2-3x/week maintenance)",
          "Return to this program next offseason for continued development",
        ],
      },
    },
  },
};

// ============================================================================
// COMPLETE ANNUAL TRAINING PROGRAM
// Ljubljana Frogs - November 2025 - October 2026
// Built for European & World Championship Domination
// ============================================================================

export const ANNUAL_TRAINING_PROGRAM = {
  programInfo: {
    title: "LJUBLJANA FROGS - COMPLETE ANNUAL TRAINING PROGRAM",
    subtitle: "European & World Championship Domination",
    duration: "Full Year",
    startDate: "2025-11-17",
    endDate: "2026-10-31",
    frequency: "5-6 days/week (varies by phase)",
    sessionDuration: "60-90 minutes",
    loadLimit: "Maximum 40% body weight external resistance",
    team: "Ljubljana Frogs",
    season: "2025-2026",
  },

  tournamentSchedule: {
    "2026-04-11": {
      name: "Adria Bowl",
      location: "Croatia",
      dates: "April 11-12, 2026",
      priority: "high",
    },
    "2026-05-23": {
      name: "Copenhagen Bowl",
      location: "Denmark",
      dates: "May 23-24, 2026",
      priority: "high",
    },
    "2026-06-06": {
      name: "Big Bowl",
      location: "Germany",
      dates: "June 6-7, 2026",
      priority: "high",
    },
    "2026-07-04": {
      name: "Capital Bowl",
      location: "France",
      dates: "July 4-5, 2026",
      priority: "high",
    },
    "2026-09-18": {
      name: "Elite 8",
      location: "Domestic",
      dates: "September 18-20, 2026",
      priority: "peak",
      notes: "THE most important tournament of the year",
    },
  },

  loadProgression: {
    "december-week1": "20% BW",
    "december-week2": "20% BW",
    "december-week3": "30% BW",
    "december-week4": "40% BW",
    "january": "40% BW (maintained)",
    "february": "40% BW (maintained)",
    "march": "40% BW (maintained)",
    "april-june": "40% BW (maintained during training)",
    "july": "No heavy lifting",
    "august": "35-40% BW",
    "september": "40% BW (peak)",
    "october": "Gradual reduction",
  },

  months: {
    december: {
      title: "DECEMBER: FOUNDATION BUILDING",
      weekCount: 4,
      dateRange: "December 1-31, 2025",
      goals: [
        "Build structural strength foundation",
        "Establish movement quality",
        "Progressive load increase: 20% → 30% → 40% BW",
        "Develop critical movement patterns",
        "Establish training consistency",
      ],
      criticalMovementDrills: {
        frequency: "3x per week minimum",
        exercises: [
          "3-Step Acceleration: 12-15 reps",
          "Deceleration @ BW%: 10-12 reps",
          "Unilateral: Single-leg bounds 4-5×8 each",
          "Lateral: Lateral shuffles + Carioca 4-5×20m each",
        ],
      },
      weeks: {
        week1: {
          weekNumber: 1,
          dateRange: "December 1-7, 2025",
          load: "20% BW",
          notes: "Foundation week - establish all patterns",
        },
        week2: {
          weekNumber: 2,
          dateRange: "December 8-14, 2025",
          load: "20% BW",
          changes: [
            "Continue 20% BW (Week 2 of foundation)",
            "Increase reps by 2 where possible",
            "Slightly faster tempo on sprints (80% vs 75%)",
            "Add 1-2 reps to critical movement drills",
          ],
          notes: "Same structure as Week 1 with progressions",
        },
        week3: {
          weekNumber: 3,
          dateRange: "December 15-21, 2025",
          load: "30% BW",
          changes: [
            "LOAD INCREASE: 30% BW on all loaded exercises",
            "Increased intensity on all movements",
            "Progressive overload continues",
          ],
          monday: {
            warmup: "Standard (15 min)",
            lowerBodyStrength: {
              duration: 30,
              exercises: [
                "Goblet Squats: 4×6 @ 30% BW, Rest: 2 min",
                "RDLs: 4×6 @ 30% BW, Rest: 2 min",
                "Bulgarian Split Squats: 4×8 each @ 30% BW, Rest: 2 min",
                "Hip Thrusts: 4×8 @ 30% BW, Rest: 90s",
                "Nordic Curls: 4×5-6, Rest: 2 min",
              ],
            },
            plyometrics: {
              duration: 20,
              exercises: [
                "Box Jumps (18\"): 4×5, Rest: 2 min",
                "Broad Jumps: 4×5, Rest: 2 min",
                "Lateral Bounds: 4×8 each, Rest: 90s",
              ],
            },
          },
          tuesday: {
            warmup: "WITH treadmill (25 min)",
            criticalMovementDrills: {
              duration: 30,
              exercises: [
                "3-Step Acceleration: 15 reps",
                "Deceleration: 12 reps @ 30% BW (weighted vest)",
                "Unilateral: Single-leg bounds 5×8 each",
                "Lateral: Lateral shuffles + Carioca 5×20m each",
              ],
            },
          },
        },
        week4: {
          weekNumber: 4,
          dateRange: "December 22-31, 2025",
          load: "40% BW",
          notes: "PEAK LOAD: 40% BW on all loaded exercises",
          monday: {
            warmup: "Standard (15 min)",
            lowerBodyStrength: {
              duration: 30,
              exercises: [
                "Deadlifts: 4×5 @ 40% BW, Rest: 3 min",
                "RDLs: 4×5 @ 40% BW, Rest: 2.5 min",
                "Bulgarian Split Squats: 4×6 each @ 40% BW, Rest: 2 min",
                "Hip Thrusts: 4×6 @ 40% BW, Rest: 2 min",
                "Nordic Curls: 5×6-8, Rest: 2.5 min",
              ],
            },
            plyometrics: {
              duration: 20,
              exercises: [
                "Box Jumps (24\"): 5×4, Rest: 2.5 min",
                "Depth Jumps (12\"): 4×5, Rest: 2.5 min",
                "Broad Jumps: 5×3, Rest: 2 min",
              ],
            },
          },
          tuesday: {
            criticalMovementDrills: {
              duration: 30,
              exercises: [
                "3-Step Acceleration: 15 reps (max effort)",
                "Deceleration: 12 reps @ 40% BW (peak load)",
                "Unilateral: Single-leg bounds 6×8 each",
                "Lateral: Pro-Agility + L-Drill 6 reps each",
              ],
            },
          },
          saturday: {
            criticalMovementDrills: "@ 40% BW",
            sprintWork: "@ 90% intensity",
            exercises: [
              "Acceleration: 10×20m @ 90%",
              "Flying sprints: 6×30m @ 90%",
            ],
          },
          assessment: {
            endOfDecember: [
              "Test 40m sprint time (best of 3)",
              "Test vertical jump",
              "Test broad jump",
              "Document for comparison",
            ],
          },
        },
      },
    },

    january: {
      title: "JANUARY: POWER DEVELOPMENT PHASE",
      weeks: 4,
      dateRange: "January 5 - February 1, 2026",
      goals: [
        "Maximum strength (40% BW maintained)",
        "Explosive power development",
        "Advanced movement patterns",
        "Flag practice 1-3x per week (adjust accordingly)",
      ],
      load: "Maintain 40% BW for loaded exercises",
      loadSchedule: {
        "week1-2": "40% BW",
        "week3": "40% BW (peak efforts)",
        "week4": "35% BW (slight deload before February)",
      },
      week1: {
        weekNumber: 1,
        dateRange: "January 5-11, 2026",
        monday: {
          warmup: "Standard (15 min)",
          lowerBodyStrength: {
            duration: 35,
            exercises: [
              "Back Squats: 5×5 @ 40% BW, Rest: 3 min",
              "RDLs: 4×5 @ 40% BW, Rest: 2.5 min",
              "Barbell Knee Ups: 4×6 @ 30% BW, Rest: 2 min",
              "Nordic Curls: 5×8, Rest: 2.5 min",
              "Hip Thrusts: 4×6 @ 40% BW, Rest: 2 min",
            ],
            notes: "Barbell Knee Ups: Barbell on shoulders, explosive knee drive",
          },
          explosiveWork: {
            duration: 25,
            exercises: [
              "Box Jumps (24\"): 6×3, Rest: 3 min",
              "Depth Jumps (18\"): 5×4, Rest: 3 min",
              "Broad Jump → Pogo Hop: 5 sets, Rest: 2.5 min",
            ],
            notes: "Broad jump then immediately 3 pogo hops",
          },
        },
        tuesday: {
          warmup: "WITH treadmill (25 min)",
          criticalMovementDrills: {
            duration: 30,
            exercises: [
              "3-Step Acceleration: 15 reps",
              "Deceleration: 12 reps @ 40% BW",
              "Unilateral: Single-leg box jumps 5×5 each",
              "Lateral: Advanced COD (L-drill, W-drill, cone weaves)",
            ],
          },
          plyometricCircuit: {
            duration: 25,
            exercises: [
              "Single-leg bounds: 5×30m each",
              "Lateral hurdle hops: 4×6 hurdles",
              "Altitude landings: 5×5 @ 40% BW",
            ],
          },
          sprintWork: {
            duration: 20,
            exercises: [
              "Acceleration: 8×20m @ 95%",
              "First step max: 12×5 yards",
            ],
          },
        },
        thursday: {
          warmup: "WITH treadmill (25 min)",
          criticalMovementDrills: {
            duration: 30,
            exercises: [
              "3-Step Acceleration: 15 reps",
              "Deceleration: 12 reps @ 40% BW",
              "Unilateral: Single-leg RDLs 4×8 each @ 40% BW",
              "Lateral: Reactive COD drills",
            ],
          },
          powerComplex: {
            duration: 30,
            exercises: [
              "Jump Squats: 5×5 @ 30% BW, Rest: 2.5 min",
              "Single-leg hip thrusts: 4×6 each @ 35% BW",
              "Explosive step-ups: 4×6 each @ 30% BW",
            ],
          },
        },
        saturday: {
          title: "SPRINT DAY",
          warmup: "Standard (20 min)",
          criticalMovementDrills: {
            duration: 25,
            exercises: [
              "3-Step Acceleration: 18 reps",
              "Deceleration: 15 reps @ 40% BW",
              "Unilateral: Single-leg bounds 6×20m each",
              "Lateral: Full COD circuit",
            ],
          },
          sprintWork: {
            duration: 35,
            exercises: [
              "Resisted sprints: 8×20m (sled or band)",
              "Free sprints: 8×40m @ 95%, Rest: 2.5 min",
              "Flying sprints: 6×30m, Rest: 3 min",
            ],
          },
        },
      },
      weeks2to4: {
        week2: "Continue same structure, maintain 40% BW loads",
        week3: "Continue same structure, maintain 40% BW loads",
        week4: "Slight deload to 35% BW, prepare for February intensity",
        notes: "All maintain same exercise selection and structure",
      },
    },

    february: {
      title: "FEBRUARY: COMPETITION PREPARATION",
      weeks: 4,
      dateRange: "February 2-28, 2026",
      goals: [
        "Peak power output",
        "Tournament simulation work",
        "High-volume sprint capacity",
        "Maintain 40% BW loads",
      ],
      load: "40% BW maintained throughout",
      week1: {
        notes: "Same structure as January but with:",
        changes: [
          "Increased sprint volume",
          "More explosive emphasis",
          "Tournament preparation starting",
        ],
        maintain: [
          "Continue all critical movement drills 3x per week",
          "Maintain 40% BW loads",
          "Add explosive elements to all sessions",
        ],
      },
    },

    march: {
      title: "MARCH: EXPLOSIVE PHASE & TOURNAMENT PREP",
      weeks: 4,
      dateRange: "March 2-31, 2026",
      criticalMonth: true,
      focus: "EXPLOSIVE HAMSTRINGS + TOURNAMENT CAPACITY",
      goals: [
        "Explosive hamstring development (2x per week minimum)",
        "Build to 4 sets × 8×40m capacity (tournament simulation)",
        "Explosive ladder work with bands",
        "Advanced plyometric circuits",
        "Peak for Adria Bowl (April 11-12)",
      ],
      load: "40% BW maintained",
      newExercises: {
        explosivePlyometrics: {
          reference: "https://www.youtube.com/watch?v=4DB6910HGr4",
          exercises: [
            "RFE Cycle Jumps (Rear Foot Elevated position, cycle legs explosively)",
            "Broad Jump + Pogo Hop (broad jump → 3 pogo hops immediately)",
            "MB Seated Hurdle Jump (seated with medicine ball, jump over hurdle)",
            "Split Squat Rack Iso Pulls + Drop Catch (isometric hold → drop → catch landing)",
            "Broad Jumps Consecutive (6 in a row, continuous)",
            "Lower Leg Yielding ISOs (calf/ankle isometric holds)",
            "Band Pin Squats (bands on pins, squat against resistance)",
            "Slam Ball Depth Granny Throw + Jump (underhand throw → immediate jump)",
          ],
        },
        explosiveHamstringDrills: {
          reference: "https://www.youtube.com/shorts/BYS_Rbk3bMU",
          frequency: "Tuesday + Thursday mandatory",
          exercises: [
            "SL Bridge Hip Switch (single-leg bridge, rapid hip switching)",
            "Hamstring Tantrums (on back, ball under feet, elastic band, rapid cycling)",
            "SL DB Swings (single-leg kettlebell/dumbbell swings)",
            "Sprinting with Resistance (band or sled sprints focusing on hamstring drive)",
            "Nordic Curl Variations (explosive concentric, slow eccentric)",
          ],
        },
      },
      week1: {
        weekNumber: 1,
        dateRange: "March 2-8, 2026",
        monday: {
          warmup: "Standard (15 min)",
          lowerBodyStrength: {
            duration: 30,
            exercises: [
              "Deadlifts: 4×5 @ 40% BW, Rest: 3 min",
              "RDLs: 4×5 @ 40% BW, Rest: 2.5 min",
              "Bulgarian Split Squats: 4×6 each @ 40% BW, Rest: 2 min",
              "Band Pin Squats: 4×8 @ 40% BW, Rest: 2 min",
              "Nordic Curls: 5×8, Rest: 2.5 min",
            ],
            notes: "Band Pin Squats: Bands attached to pins, squat against resistance",
          },
          explosivePlyometricCircuit: {
            duration: 30,
            exercises: [
              "RFE Cycle Jumps: 4×6 each leg, Rest: 2 min",
              "Broad Jump + Pogo Hop: 6 sets, Rest: 2.5 min",
              "MB Seated Hurdle Jump: 5×5, Rest: 2 min",
              "Broad Jumps Consecutive: 4 sets (6 jumps each), Rest: 3 min",
            ],
          },
        },
        tuesday: {
          title: "EXPLOSIVE HAMSTRING DAY",
          warmup: "WITH treadmill (25 min)",
          criticalMovementDrills: {
            duration: 30,
            exercises: [
              "3-Step Acceleration: 18 reps",
              "Deceleration: 15 reps @ 40% BW",
              "Unilateral: Single-leg bounds 6×30m each",
              "Lateral: Full COD circuit with bands",
            ],
          },
          explosiveHamstringCircuit: {
            duration: 30,
            mandatory: true,
            exercises: [
              {
                name: "SL Bridge Hip Switch",
                sets: "4×30s each leg",
                rest: "90s",
                notes: "Single-leg bridge, rapid hip switching motion",
              },
              {
                name: "Hamstring Tantrums",
                sets: "4×45s",
                rest: "90s",
                notes: "On back, ball under feet, elastic band, rapid leg cycling",
              },
              {
                name: "SL DB Swings",
                sets: "4×10 each leg",
                rest: "2 min",
                notes: "Single-leg kettlebell/DB swings, explosive",
              },
              {
                name: "Sprinting with Resistance",
                sets: "8×30m",
                rest: "2.5 min",
                notes: "Band or sled sprints, hamstring drive focus",
              },
              {
                name: "Nordic Curl Explosive",
                sets: "4×6",
                rest: "2 min",
                notes: "Explosive up, 5s down",
              },
            ],
          },
          conditioning: {
            duration: 15,
            focus: "HIIT circuit focusing on posterior chain",
          },
        },
        wednesday: {
          options: {
            optionA: {
              condition: "No Flag Practice",
              activity: "Active Recovery",
            },
            optionB: {
              condition: "Flag Practice Evening",
              morning: {
                duration: 40,
                warmup: "10 min",
                explosiveLadderDrills: {
                  duration: 10,
                  notes: "Ladder work with resistance band around waist",
                  exercises: [
                    "High knees through ladder",
                    "Lateral shuffles through ladder",
                    "Icky shuffle with resistance",
                    "In-out patterns",
                  ],
                  setup: "Partner holds band or attach to fixed point",
                },
                lightActivation: "10 min",
                mobility: "10 min",
              },
              evening: "Flag practice",
            },
          },
        },
        thursday: {
          title: "EXPLOSIVE HAMSTRING DAY",
          warmup: "WITH treadmill (25 min)",
          criticalMovementDrills: {
            duration: 30,
            exercises: [
              "3-Step Acceleration: 18 reps",
              "Deceleration: 15 reps @ 40% BW",
              "Unilateral: Single-leg box jumps 6×5 each",
              "Lateral: Reactive lateral drills",
            ],
          },
          explosiveHamstringCircuit: {
            duration: 30,
            mandatory: true,
            notes: "Same as Tuesday - repeat full circuit. This is the 2nd mandatory hamstring day",
          },
          powerWork: {
            duration: 25,
            exercises: [
              {
                name: "Split Squat Rack Iso Pulls + Drop Catch",
                sets: "5×4 each",
                rest: "2.5 min",
                notes: "Isometric hold in split squat → drop → catch landing",
              },
              {
                name: "Slam Ball Depth Granny Throw + Jump",
                sets: "5×6",
                rest: "2 min",
                notes: "Underhand throw → immediate jump",
              },
              {
                name: "Lower Leg Yielding ISOs",
                sets: "4×30s each",
                rest: "90s",
                notes: "Calf/ankle isometric holds at various angles",
              },
            ],
          },
        },
        saturday: {
          title: "SPRINT CAPACITY BUILD",
          warmup: "Standard (20 min)",
          criticalMovementDrills: {
            duration: 25,
          },
          sprintCapacityWork: {
            duration: 50,
            title: "BUILDING TO TOURNAMENT CAPACITY",
            week1Target: "2 sets × 8×40m",
            schedule: {
              "9am": {
                set: 1,
                exercise: "8×40m @ 90%",
                rest: "2 min between sprints",
              },
              "11am": {
                set: 2,
                exercise: "8×40m @ 90%",
                rest: "2 min between sprints",
                notes: "2 hours later",
              },
            },
            total: "16×40m with 2-hour break",
            simulation: "This simulates tournament day (2 games)",
          },
          cooldown: "10 min",
        },
        sunday: {
          title: "RECOVERY",
          activities: [
            "Extended recovery",
            "Ice bath recommended",
            "Preparation for Week 2",
          ],
        },
      },
      week2: {
        weekNumber: 2,
        dateRange: "March 9-15, 2026",
        notes: "Same structure as Week 1, with sprint capacity increase",
        saturday: {
          sprintCapacity: {
            week2Target: "3 sets × 8×40m",
            schedule: {
              "9am": "Set 1 (8×40m)",
              "11am": "Set 2 (8×40m)",
              "1pm": "Set 3 (8×40m)",
            },
            total: "24×40m with 2-hour breaks between sets",
            simulation: "Simulates 3 games",
          },
        },
        maintain: [
          "All other days: Same as Week 1",
          "Maintain explosive hamstring work Tue + Thu",
          "Explosive ladder drills on flag practice days",
        ],
      },
      week3: {
        weekNumber: 3,
        dateRange: "March 16-22, 2026",
        notes: "Same structure, sprint capacity continues to build. This is the PEAK capacity week",
        saturday: {
          sprintCapacity: {
            week3Target: "4 sets × 8×40m",
            schedule: {
              "9am": "Set 1 (8×40m @ 90%)",
              "11am": "Set 2 (8×40m @ 90%)",
              "1pm": "Set 3 (8×40m @ 90%)",
              "3pm": "Set 4 (8×40m @ 90%)",
            },
            total: "32×40m with 2-hour breaks",
            simulation: "Simulates 4 games = half tournament day",
          },
        },
      },
      week4: {
        weekNumber: 4,
        dateRange: "March 23-31, 2026",
        title: "TAPER FOR ADRIA BOWL",
        taper: "Reduce volume 40%, maintain intensity",
        monday: {
          title: "Light strength (40 min)",
          exercises: [
            "Main lifts @ 40% BW but only 2-3 sets",
            "Light plyometrics",
          ],
        },
        tuesday: {
          title: "Explosive hamstrings + drills (60 min)",
          exercises: [
            "Full hamstring circuit (last time before competition)",
            "Critical movement drills",
            "Reduced volume",
          ],
        },
        wednesday: {
          title: "Light activation only",
          notes: "If flag practice: Light ladder drills",
        },
        thursday: {
          title: "Light power (50 min)",
          exercises: [
            "Light explosive work",
            "Critical movement drills (reduced volume)",
          ],
        },
        friday: {
          title: "Light activation",
          notes: "If flag practice: Very light",
        },
        saturday: {
          title: "FINAL CAPACITY TEST",
          exercise: "4 sets × 8×40m (SAME AS WEEK 3)",
          schedule: {
            "9am": "Set 1",
            "11am": "Set 2",
            "1pm": "Set 3",
            "3pm": "Set 4",
          },
          intensity: "90% effort (not 100% - saving energy)",
          notes: "This confirms you're ready",
        },
        sunday: {
          title: "Complete recovery",
          activities: [
            "Rest for Adria Bowl",
            "Mental preparation",
            "Pack for Croatia",
          ],
        },
      },
    },

    "april-june": {
      title: "APRIL - JUNE: TOURNAMENT MAINTENANCE",
      months: ["April", "May", "June"],
      dateRange: "April 1 - June 30, 2026",
      structure: "Training between tournaments",
      weekAfterTournament: {
        monday: "Complete recovery (mobility only)",
        tuesday: "Complete recovery (mobility only)",
        wednesday: "Light activation",
        thursday: "Return to light training",
        "friday-sunday": "Build back to normal",
      },
      weeks2to3BetweenTournaments: {
        monday: "Strength maintenance @ 40% BW (60 min)",
        tuesday: "Explosive hamstrings + drills (75 min)",
        wednesday: "Light/Flag practice",
        thursday: "Power work + drills (75 min)",
        friday: "Light/Flag practice",
        saturday: "Sprint capacity maintenance (2-3 sets × 8×40m)",
        sunday: "Recovery",
      },
      weekBeforeTournament: {
        notes: "Reduce volume 40%",
        maintain: [
          "Maintain intensity",
          "Light explosive work",
          "Saturday: Light sprint work only",
        ],
      },
      maintain: [
        "Critical movement drills 3x per week",
        "Explosive hamstring work 2x per week",
        "40% BW loads when training",
        "Sprint capacity (don't let it drop)",
      ],
    },

    july: {
      title: "JULY: OFF-SEASON CONDITIONING MONTH",
      dateRange: "July 1-31, 2026",
      flagPractice: "NO FLAG FOOTBALL PRACTICE IN JULY",
      week1: {
        title: "COMPLETE REST (Mandatory)",
        activities: [
          "No training at all",
          "Light activity only (walking, stretching)",
          "Mental break",
          "Physical recovery",
        ],
      },
      weeks2to4: {
        title: "PURE CONDITIONING FOCUS",
        goal: "Build aerobic base and conditioning for August/September peak",
        frequency: "6 days per week",
        mondayThursday: {
          title: "Long conditioning (60-75 min)",
          exercises: [
            "Tempo runs: 12-15×100m @ 70%",
            "Or bike/swim for 45 min moderate",
          ],
          coreCircuit: "20 min",
          mobility: "15 min",
        },
        tuesdayFriday: {
          title: "HIIT Conditioning (45-60 min)",
          exercises: [
            "High-intensity intervals",
            "Sprint intervals",
            "Circuit training",
          ],
          bodyweightStrength: "No heavy loads",
          plyometricMaintenance: true,
        },
        wednesdaySaturday: {
          title: "Active recovery or light conditioning",
          options: [
            "Swimming (if available)",
            "Long walk/hike",
            "Sport activities (basketball, football, etc.)",
          ],
        },
        sunday: "Complete rest",
      },
      restrictions: [
        "NO HEAVY LIFTING in July",
        "NO flag-specific drills",
        "FOCUS: General fitness and conditioning",
        "BUILD: Aerobic base for championship push",
      ],
    },

    august: {
      title: "AUGUST: WORLD CHAMPIONSHIP PREPARATION",
      dateRange: "August 1-31, 2026",
      goal: "Peak for World Championship",
      structure: "Return to full training structure",
      schedule: {
        "week1-2": "Build back strength (35-40% BW)",
        "week3": "Peak week",
        "week4": "Taper for Worlds",
      },
      maintain: [
        "Critical movement drills 3x per week",
        "Explosive hamstrings 2x per week",
        "Sprint capacity maintenance",
        "Flag practice 1-3x per week",
      ],
      notes: "Structure similar to March but focus on peak performance",
    },

    september: {
      title: "SEPTEMBER: DOMESTIC PEAK - ELITE 8",
      dateRange: "September 1-30, 2026",
      goal: "ABSOLUTE PEAK for Elite 8 (Sep 18-20)",
      importance: "THE most important tournament of the year",
      weeks1to2: {
        focus: "Maximum training intensity",
        loads: "Peak loads (40% BW)",
        sprintCapacity: "Full sprint capacity",
        explosiveWork: "All explosive work",
      },
      week3: {
        title: "Tournament Week",
        monday: "Taper begins",
        tuesday: "Light training",
        wednesday: "Light training",
        thursday: "Light activation only",
        friday: "Rest",
        "saturday-sunday": "ELITE 8 COMPETITION",
      },
      week4: {
        title: "After Elite 8",
        focus: "Recovery week",
        activity: "Light training only",
      },
    },

    october: {
      title: "OCTOBER: TRANSITION TO OFF-SEASON",
      dateRange: "October 1-31, 2026",
      goal: "Gradual reduction, prepare for November rest",
      weeks1to2: {
        volume: "75% normal training volume",
        focus: [
          "Maintain movement quality",
          "Reduce intensity gradually",
        ],
      },
      weeks3to4: {
        volume: "50% normal training volume",
        focus: [
          "Light training only",
          "Prepare mentally and physically for rest",
        ],
      },
      endOfOctober: "Training ends",
      midNovember: "14-day complete rest begins",
      cycleRepeat: "THEN: CYCLE REPEATS for 2026-2027 season",
    },
  },

  keyTrainingPrinciples: {
    loadProgression: {
      "week1-2": "20% BW",
      "week3": "30% BW",
      "week4": "40% BW",
      maximum: "NEVER exceed 40% BW",
    },
    criticalMovementDrills: {
      frequency: "Minimum 3x per week (Tue/Thu/Sat)",
      exercises: [
        "3-step acceleration: 12-18 reps",
        "Deceleration @ BW%: 10-15 reps",
        "Unilateral: 12-20 reps per leg",
        "Lateral: 15-25 reps per direction",
      ],
    },
    explosiveHamstrings: {
      startMonth: "March onwards",
      frequency: "Mandatory 2x per week (Tuesday + Thursday)",
      requirement: "Full circuit each session",
      importance: "Critical for sprint speed and injury prevention",
    },
    sprintCapacity: {
      month: "March",
      buildProgressively: {
        "week1": "2 sets × 8×40m",
        "week2": "3 sets × 8×40m",
        "week3-4": "4 sets × 8×40m",
      },
      simulation: "This simulates tournament demands",
    },
    flagPracticeIntegration: {
      "1x/week": "Full program",
      "2x/week": "80% volume",
      "3x/week": "60% volume, focus on quality",
      note: "Adjust training based on YOUR practice schedule",
    },
    treadmillSledWork: {
      when: "Use when available on fitness days",
      addition: "Adds to warm-up: 1km push + 700m backpedal",
    },
    recovery: {
      sunday: "Always full recovery",
      sleep: "8+ hours",
      nutrition: "High quality",
      betweenTournaments: "Adjust accordingly",
    },
    annualStructure: {
      "dec-mar": "Build phase (detailed above)",
      "apr-jun": "Tournament maintenance",
      july: "Off-season conditioning (1 week complete rest)",
      august: "World Championship prep",
      september: "Peak for Elite 8",
      october: "Transition",
      november: "14-day complete rest",
    },
  },

  tournamentDemands: {
    description: "What you're preparing for:",
    gamesPerTournament: "8 games over 2 days",
    gameTime: "2×20 minutes per game (40 min game time)",
    totalGameTime: "320 minutes total game time per tournament",
    sprintsPerGame: "~2.5km sprints per game (5-40 yards)",
    totalSprinting: "~20km total sprinting per tournament weekend",
    programBenefits: [
      "Sprint explosively in Game 8",
      "Recover between games (2-hour breaks)",
      "Maintain speed throughout weekend",
      "Prevent injuries under fatigue",
      "Compete at highest level",
    ],
    message: "YOU WILL BE READY.",
  },
};

// Exercise Library with detailed instructions
export const EXERCISE_LIBRARY = {
  // Posterior Chain Exercises
  "Nordic Curls": {
    category: "Posterior Chain",
    primaryMuscles: ["Hamstrings"],
    secondaryMuscles: ["Glutes", "Core"],
    equipment: ["Resistance band (for assistance)", "Partner or anchor"],
    difficulty: "intermediate",
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
    difficulty: "intermediate",
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
    difficulty: "intermediate",
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
    safetyNotes: [
      "Keep core engaged",
      "Don't arch back excessively",
      "Control the movement",
    ],
  },

  "Single-Leg RDLs": {
    category: "Posterior Chain",
    primaryMuscles: ["Hamstrings", "Glutes"],
    secondaryMuscles: ["Core", "Stabilizers"],
    equipment: ["Dumbbell", "Kettlebell", "or Bodyweight"],
    difficulty: "intermediate",
    setup: "Stand on one leg, holding weight in opposite hand",
    execution: [
      "Stand tall on one leg",
      "Hinge at hip, extending free leg back",
      "Lower weight while maintaining balance",
      "Keep back flat and core engaged",
      "Return to standing position",
    ],
    coaching: [
      "Focus on balance and control",
      "Feel hamstring stretch",
      "Keep hips level",
      "Don't let knee cave inward",
    ],
    progressions: [
      "Bodyweight single-leg RDL",
      "Light weight single-leg RDL",
      "Heavy single-leg RDL",
      "Single-leg RDL with band resistance",
    ],
    safetyNotes: [
      "Start with bodyweight",
      "Use support if needed",
      "Focus on form over weight",
    ],
  },

  "Glute-Ham Raises": {
    category: "Posterior Chain",
    primaryMuscles: ["Hamstrings", "Glutes"],
    secondaryMuscles: ["Core", "Lower back"],
    equipment: ["GHR machine", "Partner assistance", "or Resistance band"],
    difficulty: "advanced",
    setup: "Kneel on GHR machine or have partner hold ankles",
    execution: [
      "Start in kneeling position",
      "Lower body forward with control",
      "Keep hips extended",
      "Use hamstrings to pull back up",
      "Return to starting position",
    ],
    coaching: [
      "Control the descent",
      "Feel hamstring engagement",
      "Keep core tight",
      "Full range of motion if possible",
    ],
    progressions: [
      "Band-assisted GHR",
      "Partial range GHR",
      "Full range GHR",
      "Weighted GHR",
    ],
    safetyNotes: [
      "Start with assistance",
      "Don't force range of motion",
      "Stop if lower back feels strained",
    ],
  },

  "Back Extensions": {
    category: "Posterior Chain",
    primaryMuscles: ["Lower back", "Glutes", "Hamstrings"],
    secondaryMuscles: ["Core"],
    equipment: ["Hyperextension bench", "or Stability ball"],
    difficulty: "beginner",
    setup: "Position hips on pad, feet secured",
    execution: [
      "Start with body hanging down",
      "Engage glutes and lower back",
      "Lift torso until body is straight",
      "Squeeze glutes at top",
      "Lower with control",
    ],
    coaching: [
      "Focus on glute engagement",
      "Don't hyperextend",
      "Control the movement",
      "Feel posterior chain activation",
    ],
    progressions: [
      "Bodyweight back extension",
      "Weighted back extension",
      "Single-leg back extension",
      "Reverse hyperextension",
    ],
    safetyNotes: [
      "Don't overextend",
      "Keep core engaged",
      "Control the movement",
    ],
  },

  "Glute Bridges": {
    category: "Posterior Chain",
    primaryMuscles: ["Glutes"],
    secondaryMuscles: ["Hamstrings", "Core"],
    equipment: ["Yoga mat", "Optional: Resistance band"],
    difficulty: "beginner",
    setup: "Lie on back, knees bent, feet flat",
    execution: [
      "Lie on back with knees bent",
      "Drive through heels to lift hips",
      "Squeeze glutes at top",
      "Hold for 1-2 seconds",
      "Lower with control",
    ],
    coaching: [
      "Squeeze glutes hard",
      "Don't arch back excessively",
      "Drive through heels",
      "Keep core engaged",
    ],
    progressions: [
      "Bodyweight glute bridge",
      "Single-leg glute bridge",
      "Banded glute bridge",
      "Weighted glute bridge",
    ],
    safetyNotes: [
      "Keep core engaged",
      "Don't hyperextend back",
      "Control the movement",
    ],
  },

  // Strength Exercises
  "Goblet Squats": {
    category: "Strength",
    primaryMuscles: ["Quadriceps", "Glutes"],
    secondaryMuscles: ["Core", "Calves"],
    equipment: ["Dumbbell", "Kettlebell"],
    difficulty: "beginner",
    setup: "Hold weight at chest level",
    execution: [
      "Hold weight against chest",
      "Feet shoulder-width apart",
      "Squat down keeping chest up",
      "Go below parallel if able",
      "Drive through heels to stand",
    ],
    coaching: [
      "Chest up throughout",
      "Knees track over toes",
      "Full depth if mobile",
      "Control the descent",
    ],
    progressions: [
      "Bodyweight squat",
      "Light goblet squat",
      "Heavy goblet squat",
      "Pause goblet squat",
    ],
    safetyNotes: [
      "Don't let knees cave",
      "Keep weight secure",
      "Stop if lower back rounds",
    ],
  },

  "Back Squats": {
    category: "Strength",
    primaryMuscles: ["Quadriceps", "Glutes"],
    secondaryMuscles: ["Core", "Calves", "Lower back"],
    equipment: ["Barbell", "Squat rack"],
    difficulty: "intermediate",
    setup: "Bar on upper back, feet shoulder-width apart",
    execution: [
      "Unrack bar and step back",
      "Feet shoulder-width apart",
      "Squat down keeping chest up",
      "Go to parallel or below",
      "Drive through heels to stand",
    ],
    coaching: [
      "Keep chest up",
      "Knees track over toes",
      "Full depth",
      "Drive through heels",
    ],
    progressions: [
      "Bodyweight squat",
      "Goblet squat",
      "Light back squat",
      "Heavy back squat",
    ],
    safetyNotes: [
      "Use proper form",
      "Start light",
      "Use safety bars",
      "Don't let knees cave",
    ],
  },

  "Bulgarian Split Squats": {
    category: "Strength",
    primaryMuscles: ["Quadriceps", "Glutes"],
    secondaryMuscles: ["Core", "Stabilizers"],
    equipment: ["Bench", "Dumbbells (optional)"],
    difficulty: "intermediate",
    setup: "Rear foot elevated on bench, front leg forward",
    execution: [
      "Place rear foot on bench",
      "Front leg forward, knee over ankle",
      "Squat down on front leg",
      "Go to parallel or below",
      "Drive through front heel to stand",
    ],
    coaching: [
      "Front leg does the work",
      "Keep torso upright",
      "Full range of motion",
      "Control the movement",
    ],
    progressions: [
      "Bodyweight Bulgarian split squat",
      "Light weight Bulgarian split squat",
      "Heavy Bulgarian split squat",
      "Pause Bulgarian split squat",
    ],
    safetyNotes: [
      "Keep front knee tracking properly",
      "Don't let knee cave inward",
      "Start with bodyweight",
    ],
  },

  "Single-Leg Calf Raises": {
    category: "Strength",
    primaryMuscles: ["Calves"],
    secondaryMuscles: ["Ankle stabilizers"],
    equipment: ["Step or platform", "Optional: Dumbbell"],
    difficulty: "beginner",
    setup: "Stand on one leg, heel hanging off step",
    execution: [
      "Stand on one leg",
      "Lower heel below step level",
      "Rise up onto toes",
      "Squeeze calf at top",
      "Lower with control",
    ],
    coaching: [
      "Full range of motion",
      "Control the movement",
      "Feel calf stretch at bottom",
      "Squeeze at top",
    ],
    progressions: [
      "Bodyweight single-leg calf raise",
      "Weighted single-leg calf raise",
      "Pause single-leg calf raise",
      "Single-leg calf raise with band",
    ],
    safetyNotes: [
      "Use support if needed",
      "Control the movement",
      "Don't bounce",
    ],
  },

  "Tibialis Raises": {
    category: "Strength",
    primaryMuscles: ["Tibialis anterior"],
    secondaryMuscles: ["Ankle stabilizers"],
    equipment: ["Resistance band", "or Wall"],
    difficulty: "beginner",
    setup: "Sit with leg extended, band around foot",
    execution: [
      "Sit with leg extended",
      "Point toes up toward shin",
      "Resist band pulling toes down",
      "Hold contraction",
      "Return with control",
    ],
    coaching: [
      "Feel shin muscle working",
      "Full range of motion",
      "Control the movement",
      "Don't rush",
    ],
    progressions: [
      "Bodyweight tibialis raise",
      "Light band tibialis raise",
      "Heavy band tibialis raise",
      "Weighted tibialis raise",
    ],
    safetyNotes: ["Start light", "Control the movement", "Don't overdo it"],
  },

  "Push-Ups": {
    category: "Strength",
    primaryMuscles: ["Chest", "Triceps", "Shoulders"],
    secondaryMuscles: ["Core"],
    equipment: ["None"],
    difficulty: "beginner",
    setup: "Plank position, hands shoulder-width apart",
    execution: [
      "Start in plank position",
      "Lower body until chest nearly touches ground",
      "Keep body straight",
      "Push back up to start",
      "Keep core engaged throughout",
    ],
    coaching: [
      "Keep body straight",
      "Full range of motion",
      "Control the movement",
      "Engage core",
    ],
    progressions: [
      "Incline push-ups",
      "Knee push-ups",
      "Standard push-ups",
      "Decline push-ups",
    ],
    safetyNotes: [
      "Keep core engaged",
      "Don't sag hips",
      "Control the movement",
    ],
  },

  "Band Rows": {
    category: "Strength",
    primaryMuscles: ["Back", "Rhomboids", "Rear delts"],
    secondaryMuscles: ["Biceps", "Core"],
    equipment: ["Resistance band", "Anchor point"],
    difficulty: "beginner",
    setup: "Anchor band, hold handles at chest level",
    execution: [
      "Stand with band anchored",
      "Pull handles to chest",
      "Squeeze shoulder blades together",
      "Hold for 1 second",
      "Return with control",
    ],
    coaching: [
      "Squeeze shoulder blades",
      "Keep core engaged",
      "Full range of motion",
      "Control the movement",
    ],
    progressions: [
      "Light band rows",
      "Medium band rows",
      "Heavy band rows",
      "Single-arm band rows",
    ],
    safetyNotes: [
      "Keep core engaged",
      "Don't arch back excessively",
      "Control the movement",
    ],
  },

  // Core Exercises
  "Plank Series": {
    category: "Core",
    primaryMuscles: ["Core", "Shoulders"],
    secondaryMuscles: ["Glutes", "Legs"],
    equipment: ["Yoga mat"],
    difficulty: "beginner",
    setup: "Forearm plank position",
    execution: [
      "Start in forearm plank",
      "Hold for specified duration",
      "Keep body straight",
      "Engage core throughout",
      "Breathe normally",
    ],
    coaching: [
      "Keep body straight",
      "Don't sag hips",
      "Engage core",
      "Breathe normally",
    ],
    progressions: [
      "Knee plank",
      "Standard plank",
      "Plank with leg lift",
      "Plank with arm lift",
    ],
    safetyNotes: [
      "Stop if lower back hurts",
      "Keep core engaged",
      "Don't hold breath",
    ],
  },

  "Side Planks": {
    category: "Core",
    primaryMuscles: ["Obliques", "Core"],
    secondaryMuscles: ["Shoulders", "Hip stabilizers"],
    equipment: ["Yoga mat"],
    difficulty: "beginner",
    setup: "Side-lying, propped on forearm",
    execution: [
      "Lie on side, propped on forearm",
      "Lift hips off ground",
      "Keep body straight",
      "Hold for specified duration",
      "Lower with control",
    ],
    coaching: [
      "Keep body straight",
      "Don't sag hips",
      "Engage core",
      "Breathe normally",
    ],
    progressions: [
      "Knee side plank",
      "Standard side plank",
      "Side plank with leg lift",
      "Side plank with rotation",
    ],
    safetyNotes: [
      "Stop if shoulder hurts",
      "Keep core engaged",
      "Don't hold breath",
    ],
  },

  // Sprint Drills
  "A-March": {
    category: "Sprint",
    primaryMuscles: ["Hip Flexors", "Calves"],
    secondaryMuscles: ["Core", "Glutes"],
    equipment: ["Open space"],
    difficulty: "beginner",
    setup: "Standing tall in athletic position",
    execution: [
      "March in place with high knees",
      "Drive knee up to waist height",
      "Toe up (dorsiflexed ankle)",
      "Maintain tall posture",
      "Use opposite arm action",
    ],
    coaching: [
      "Knee drive to waist height",
      "Dorsiflexed ankle",
      "Tall posture throughout",
      "Quick ground contact",
    ],
    progressions: [
      "A-March in place",
      "A-March moving",
      "A-Skip stationary",
      "A-Skip moving",
    ],
    safetyNotes: [
      "Start slowly",
      "Focus on form over speed",
      "Stop if you feel tight",
    ],
  },

  "A-Skip": {
    category: "Sprint",
    primaryMuscles: ["Hip Flexors", "Calves"],
    secondaryMuscles: ["Core", "Glutes"],
    equipment: ["Open space"],
    difficulty: "beginner",
    setup: "Standing tall in athletic position",
    execution: [
      "March in place with high knees",
      "Progress to skipping motion",
      "Drive knee up, toe up (dorsiflexed)",
      "Maintain tall posture",
      "Use opposite arm action",
    ],
    coaching: [
      "Knee drive to waist height",
      "Dorsiflexed ankle",
      "Tall posture throughout",
      "Quick ground contact",
    ],
    progressions: [
      "A-March in place",
      "A-March moving",
      "A-Skip stationary",
      "A-Skip moving",
    ],
    safetyNotes: [
      "Start slowly",
      "Focus on form over speed",
      "Stop if you feel tight",
    ],
  },

  "B-Skip": {
    category: "Sprint",
    primaryMuscles: ["Hamstrings", "Hip Flexors"],
    secondaryMuscles: ["Core", "Calves"],
    equipment: ["Open space"],
    difficulty: "intermediate",
    setup: "Standing tall in athletic position",
    execution: [
      "Drive knee up first",
      "Extend leg forward",
      "Pull leg back down and under",
      "Cycle to next leg",
      "Maintain rhythm",
    ],
    coaching: [
      "Knee drive first",
      "Extend leg forward",
      "Pull leg back under",
      "Maintain rhythm",
    ],
    progressions: ["B-March", "B-Skip slow", "B-Skip moderate", "B-Skip fast"],
    safetyNotes: ["Master A-skip first", "Start slowly", "Focus on form"],
  },

  "C-Skip": {
    category: "Sprint",
    primaryMuscles: ["Hip Flexors", "Calves"],
    secondaryMuscles: ["Core", "Glutes"],
    equipment: ["Open space"],
    difficulty: "intermediate",
    setup: "Standing tall in athletic position",
    execution: [
      "Drive knee up",
      "Extend leg forward",
      "Pull leg back quickly",
      "Cycle to next leg",
      "Maintain rhythm",
    ],
    coaching: [
      "Quick leg cycle",
      "Maintain rhythm",
      "Tall posture",
      "Arm action",
    ],
    progressions: ["C-March", "C-Skip slow", "C-Skip moderate", "C-Skip fast"],
    safetyNotes: ["Master A and B skip first", "Start slowly", "Focus on form"],
  },

  "High Knees": {
    category: "Sprint",
    primaryMuscles: ["Hip Flexors", "Calves"],
    secondaryMuscles: ["Core", "Glutes"],
    equipment: ["Open space"],
    difficulty: "beginner",
    setup: "Standing tall in athletic position",
    execution: [
      "Run in place",
      "Drive knees up high",
      "Quick ground contact",
      "Use arm action",
      "Maintain rhythm",
    ],
    coaching: [
      "Knees to waist height",
      "Quick ground contact",
      "Tall posture",
      "Arm action",
    ],
    progressions: [
      "Slow high knees",
      "Moderate high knees",
      "Fast high knees",
      "High knees moving forward",
    ],
    safetyNotes: ["Start slowly", "Focus on form", "Stop if you feel tight"],
  },

  "Butt Kicks": {
    category: "Sprint",
    primaryMuscles: ["Hamstrings"],
    secondaryMuscles: ["Calves", "Core"],
    equipment: ["Open space"],
    difficulty: "beginner",
    setup: "Standing tall in athletic position",
    execution: [
      "Run in place",
      "Kick heels to glutes",
      "Quick ground contact",
      "Use arm action",
      "Maintain rhythm",
    ],
    coaching: [
      "Heels to glutes",
      "Quick ground contact",
      "Tall posture",
      "Arm action",
    ],
    progressions: [
      "Slow butt kicks",
      "Moderate butt kicks",
      "Fast butt kicks",
      "Butt kicks moving forward",
    ],
    safetyNotes: [
      "Start slowly",
      "Focus on form",
      "Stop if hamstring feels tight",
    ],
  },

  Scissors: {
    category: "Sprint",
    primaryMuscles: ["Hip Flexors", "Hamstrings"],
    secondaryMuscles: ["Core", "Calves"],
    equipment: ["Open space"],
    difficulty: "intermediate",
    setup: "Standing tall in athletic position",
    execution: [
      "Alternate leg swings",
      "Forward leg swing",
      "Backward leg swing",
      "Maintain rhythm",
      "Use arm action",
    ],
    coaching: [
      "Full leg swing",
      "Maintain rhythm",
      "Tall posture",
      "Arm action",
    ],
    progressions: [
      "Slow scissors",
      "Moderate scissors",
      "Fast scissors",
      "Scissors moving forward",
    ],
    safetyNotes: ["Start slowly", "Focus on form", "Stop if you feel tight"],
  },

  "Toy Soldiers": {
    category: "Sprint",
    primaryMuscles: ["Hamstrings", "Hip Flexors"],
    secondaryMuscles: ["Core", "Glutes"],
    equipment: ["Open space"],
    difficulty: "beginner",
    setup: "Standing tall in athletic position",
    execution: [
      "Walk forward",
      "Kick leg straight up",
      "Touch toe with opposite hand",
      "Alternate legs",
      "Maintain rhythm",
    ],
    coaching: [
      "Leg straight",
      "Touch toe",
      "Tall posture",
      "Control the movement",
    ],
    progressions: [
      "Slow toy soldiers",
      "Moderate toy soldiers",
      "Fast toy soldiers",
      "Toy soldiers with skip",
    ],
    safetyNotes: [
      "Start slowly",
      "Focus on form",
      "Stop if hamstring feels tight",
    ],
  },

  "Wall Drills": {
    category: "Sprint",
    primaryMuscles: ["Hip Flexors", "Calves"],
    secondaryMuscles: ["Core", "Glutes"],
    equipment: ["Wall"],
    difficulty: "beginner",
    setup: "Lean against wall at 45-degree angle",
    execution: [
      "Lean against wall",
      "Drive one knee up",
      "Cycle leg down and back",
      "Alternate legs",
      "Maintain drive position",
    ],
    coaching: [
      "Maintain drive position",
      "Knee drive to waist",
      "Quick leg cycle",
      "Tall posture",
    ],
    progressions: [
      "Wall drill slow",
      "Wall drill moderate",
      "Wall drill fast",
      "Wall drill with resistance",
    ],
    safetyNotes: ["Start slowly", "Focus on form", "Stop if you feel tight"],
  },

  "Fast Leg Drill": {
    category: "Sprint",
    primaryMuscles: ["Hip Flexors", "Calves"],
    secondaryMuscles: ["Core", "Glutes"],
    equipment: ["Open space"],
    difficulty: "intermediate",
    setup: "Standing tall in athletic position",
    execution: [
      "Run in place",
      "Very quick leg turnover",
      "Short ground contact",
      "Maintain rhythm",
      "Use arm action",
    ],
    coaching: [
      "Very quick turnover",
      "Short ground contact",
      "Tall posture",
      "Arm action",
    ],
    progressions: [
      "Slow fast leg",
      "Moderate fast leg",
      "Fast fast leg",
      "Fast leg moving forward",
    ],
    safetyNotes: ["Start slowly", "Focus on form", "Stop if you feel tight"],
  },

  "Tempo Runs": {
    category: "Sprint",
    primaryMuscles: ["Full body"],
    secondaryMuscles: ["Cardiovascular"],
    equipment: ["Track", "Open space"],
    difficulty: "intermediate",
    setup: "Mark distance, prepare timing",
    execution: [
      "Run at 70-75% effort",
      "Focus on relaxed mechanics",
      "Consistent pace",
      "Controlled breathing",
    ],
    coaching: [
      "Relaxed but controlled",
      "Build aerobic base",
      "Consistent effort",
      "Focus on form",
    ],
    progressions: [
      "Short tempo (100m)",
      "Medium tempo (200m)",
      "Long tempo (400m)",
      "Extensive tempo",
    ],
    safetyNotes: ["Not maximum effort", "Monitor fatigue", "Proper recovery"],
  },

  "Acceleration Mechanics": {
    category: "Sprint",
    primaryMuscles: ["Full body"],
    secondaryMuscles: ["Core", "Stabilizers"],
    equipment: ["Track", "Open space"],
    difficulty: "intermediate",
    setup: "Mark 20m distance",
    execution: [
      "Start in athletic position",
      "Drive phase first 10 yards",
      "Push ground away",
      "Gradual acceleration",
      "Maintain form",
    ],
    coaching: [
      "Push ground away",
      "Drive phase focus",
      "Gradual acceleration",
      "Maintain form",
    ],
    progressions: [
      "Walking starts",
      "Jogging starts",
      "75% acceleration",
      "Full acceleration",
    ],
    safetyNotes: ["Proper warm-up", "Focus on form", "Don't rush progression"],
  },

  "Build-Up Runs": {
    category: "Sprint",
    primaryMuscles: ["Full body"],
    secondaryMuscles: ["Cardiovascular"],
    equipment: ["Track", "Open space"],
    difficulty: "intermediate",
    setup: "Mark 40m distance",
    execution: [
      "Start slow",
      "Gradually increase speed",
      "Reach top speed by end",
      "Maintain form",
      "Controlled deceleration",
    ],
    coaching: [
      "Progressive acceleration",
      "Maintain form",
      "Reach top speed",
      "Control throughout",
    ],
    progressions: [
      "Short build-up (20m)",
      "Medium build-up (40m)",
      "Long build-up (60m)",
      "Extended build-up",
    ],
    safetyNotes: ["Proper warm-up", "Focus on form", "Don't rush"],
  },

  "First Step Drills": {
    category: "Agility",
    primaryMuscles: ["Full body"],
    secondaryMuscles: ["Core", "Stabilizers"],
    equipment: ["Cones", "Open space"],
    difficulty: "intermediate",
    setup: "Set up cones at 5-yard intervals",
    execution: [
      "Start in athletic position",
      "Explosive first step",
      "3-step acceleration",
      "Maintain form",
      "Various start positions",
    ],
    coaching: [
      "Explosive first step",
      "Quick acceleration",
      "Maintain form",
      "Various starts",
    ],
    progressions: [
      "Standing starts",
      "3-point starts",
      "4-point starts",
      "Moving starts",
    ],
    safetyNotes: ["Proper warm-up", "Focus on form", "Don't rush"],
  },

  // Plyometric Exercises
  "Box Jumps": {
    category: "Plyometric",
    primaryMuscles: ["Quadriceps", "Glutes"],
    secondaryMuscles: ["Calves", "Core"],
    equipment: ["Plyo box", "Stable platform"],
    difficulty: "intermediate",
    setup: "Stand 2-3 feet from box, arms at sides",
    execution: [
      "Start in athletic position",
      "Swing arms back while squatting slightly",
      "Explosively jump onto box",
      "Land softly with both feet",
      "Step down, don't jump down",
    ],
    coaching: [
      "Focus on landing mechanics",
      "Use arms for momentum",
      "Land quietly",
      "Full hip extension at takeoff",
    ],
    progressions: [
      "Step-ups (6 inch box)",
      "Box jumps (12 inch)",
      "Box jumps (18 inch)",
      "Box jumps (24+ inch)",
    ],
    safetyNotes: [
      "Always step down, never jump down",
      "Ensure box is stable",
      "Start with lower heights",
    ],
  },

  "Box Step-Ups": {
    category: "Plyometric",
    primaryMuscles: ["Quadriceps", "Glutes"],
    secondaryMuscles: ["Calves", "Core"],
    equipment: ["Box", "Platform"],
    difficulty: "beginner",
    setup: "Stand facing box, one foot on box",
    execution: [
      "Place one foot on box",
      "Drive through heel to step up",
      "Bring other leg up",
      "Step down with control",
      "Alternate legs",
    ],
    coaching: [
      "Drive through heel",
      "Full hip extension",
      "Control the movement",
      "Alternate legs",
    ],
    progressions: [
      "Low box step-ups",
      "Medium box step-ups",
      "High box step-ups",
      "Weighted box step-ups",
    ],
    safetyNotes: ["Ensure box is stable", "Control the movement", "Don't rush"],
  },

  "Broad Jumps": {
    category: "Plyometric",
    primaryMuscles: ["Quadriceps", "Glutes"],
    secondaryMuscles: ["Hamstrings", "Calves"],
    equipment: ["Open space", "Measuring tape"],
    difficulty: "intermediate",
    setup: "Feet shoulder-width apart, arms back",
    execution: [
      "Start in semi-squat position",
      "Swing arms forward explosively",
      "Jump as far forward as possible",
      "Land on both feet simultaneously",
      "Stick the landing",
    ],
    coaching: [
      "Use arms for momentum",
      "Drive through ground",
      "Land balanced",
      "Focus on distance, not height",
    ],
    progressions: [
      "Standing long jump (focus on form)",
      "Broad jump for distance",
      "Multiple broad jumps",
      "Weighted broad jumps",
    ],
    safetyNotes: [
      "Clear landing area",
      "Land with knees bent",
      "Don't fall backward",
    ],
  },

  "Lateral Bounds": {
    category: "Plyometric",
    primaryMuscles: ["Glutes", "Hip abductors"],
    secondaryMuscles: ["Core", "Stabilizers"],
    equipment: ["Open space"],
    difficulty: "intermediate",
    setup: "Stand on one leg, ready to jump sideways",
    execution: [
      "Start on one leg",
      "Jump laterally to other leg",
      "Land softly",
      "Immediately jump back",
      "Maintain rhythm",
    ],
    coaching: [
      "Land softly",
      "Maintain rhythm",
      "Full hip extension",
      "Control the movement",
    ],
    progressions: [
      "Small lateral bounds",
      "Medium lateral bounds",
      "Large lateral bounds",
      "Weighted lateral bounds",
    ],
    safetyNotes: ["Start small", "Focus on landing", "Don't rush"],
  },

  "Jump Squats": {
    category: "Plyometric",
    primaryMuscles: ["Quadriceps", "Glutes"],
    secondaryMuscles: ["Calves", "Core"],
    equipment: ["None", "Optional: Weight"],
    difficulty: "intermediate",
    setup: "Feet shoulder-width apart",
    execution: [
      "Start in squat position",
      "Explosively jump up",
      "Land softly",
      "Immediately go into next squat",
      "Maintain rhythm",
    ],
    coaching: [
      "Explosive jump",
      "Land softly",
      "Full hip extension",
      "Maintain rhythm",
    ],
    progressions: [
      "Bodyweight jump squats",
      "Pause jump squats",
      "Weighted jump squats",
      "Depth jump squats",
    ],
    safetyNotes: ["Land softly", "Don't rush", "Focus on form"],
  },

  "Medicine Ball Slams": {
    category: "Plyometric",
    primaryMuscles: ["Core", "Shoulders"],
    secondaryMuscles: ["Full body"],
    equipment: ["Medicine ball"],
    difficulty: "intermediate",
    setup: "Stand holding medicine ball overhead",
    execution: [
      "Hold ball overhead",
      "Explosively slam ball down",
      "Catch ball on bounce",
      "Immediately lift overhead",
      "Repeat",
    ],
    coaching: [
      "Explosive movement",
      "Full extension",
      "Use whole body",
      "Maintain rhythm",
    ],
    progressions: [
      "Light medicine ball slams",
      "Medium medicine ball slams",
      "Heavy medicine ball slams",
      "Rotational medicine ball slams",
    ],
    safetyNotes: ["Clear area", "Control the ball", "Don't rush"],
  },

  "Bilateral Pogos": {
    category: "Plyometric",
    primaryMuscles: ["Calves"],
    secondaryMuscles: ["Core", "Ankle stabilizers"],
    equipment: ["Open space"],
    difficulty: "beginner",
    setup: "Stand on both feet, ready to jump",
    execution: [
      "Start in athletic position",
      "Jump up quickly",
      "Land and immediately jump again",
      "Minimal ground contact",
      "Maintain rhythm",
    ],
    coaching: [
      "Minimal ground contact",
      "Quick jumps",
      "Maintain rhythm",
      "Use arms",
    ],
    progressions: [
      "Slow pogos",
      "Moderate pogos",
      "Fast pogos",
      "Single-leg pogos",
    ],
    safetyNotes: ["Start slowly", "Focus on form", "Stop if ankles feel tight"],
  },

  // Agility Exercises
  "Ladder Drills": {
    category: "Agility",
    primaryMuscles: ["Full body"],
    secondaryMuscles: ["Core", "Stabilizers"],
    equipment: ["Agility ladder"],
    difficulty: "beginner",
    setup: "Set up agility ladder on ground",
    execution: [
      "Various foot patterns",
      "Quick feet",
      "Maintain rhythm",
      "Stay on balls of feet",
      "Use arms",
    ],
    coaching: [
      "Quick feet",
      "Maintain rhythm",
      "Stay light on feet",
      "Use arms",
    ],
    progressions: [
      "2-foot run",
      "Lateral shuffle",
      "Icky shuffle",
      "Advanced patterns",
    ],
    safetyNotes: ["Start slowly", "Focus on form", "Don't rush"],
  },

  "Cone Weave": {
    category: "Agility",
    primaryMuscles: ["Full body"],
    secondaryMuscles: ["Core", "Stabilizers"],
    equipment: ["Cones"],
    difficulty: "intermediate",
    setup: "Set up cones in zigzag pattern",
    execution: [
      "Weave through cones",
      "Quick changes of direction",
      "Maintain speed",
      "Stay low",
      "Use arms",
    ],
    coaching: [
      "Quick changes of direction",
      "Stay low",
      "Maintain speed",
      "Use arms",
    ],
    progressions: [
      "Slow cone weave",
      "Moderate cone weave",
      "Fast cone weave",
      "Competition cone weave",
    ],
    safetyNotes: ["Proper warm-up", "Focus on form", "Don't rush"],
  },

  // Recovery Exercises
  "World's Greatest Stretch": {
    category: "Recovery",
    primaryMuscles: ["Hip Flexors", "Hamstrings", "Glutes"],
    secondaryMuscles: ["Core"],
    equipment: ["Yoga mat"],
    difficulty: "beginner",
    setup: "Lunge position with back leg extended",
    execution: [
      "Start in lunge position",
      "Place opposite hand on ground",
      "Rotate torso toward front leg",
      "Hold stretch",
      "Return and switch sides",
    ],
    coaching: [
      "Feel stretch in hip flexor",
      "Rotate torso",
      "Hold stretch",
      "Breathe deeply",
    ],
    progressions: [
      "Shallow world's greatest stretch",
      "Standard world's greatest stretch",
      "Deep world's greatest stretch",
      "Dynamic world's greatest stretch",
    ],
    safetyNotes: [
      "Don't force the stretch",
      "Breathe deeply",
      "Stop if you feel pain",
    ],
  },

  "90/90 Hip Stretches": {
    category: "Recovery",
    primaryMuscles: ["Hip Flexors", "Glutes", "Rotators"],
    secondaryMuscles: ["Core"],
    equipment: ["Yoga mat"],
    difficulty: "beginner",
    setup: "Sit with legs in 90/90 position",
    execution: [
      "Sit with front leg at 90 degrees",
      "Back leg at 90 degrees",
      "Lean forward over front leg",
      "Hold stretch",
      "Switch positions",
    ],
    coaching: [
      "Feel stretch in hip",
      "Hold stretch",
      "Breathe deeply",
      "Don't force",
    ],
    progressions: [
      "Shallow 90/90",
      "Standard 90/90",
      "Deep 90/90",
      "Dynamic 90/90",
    ],
    safetyNotes: [
      "Don't force the stretch",
      "Breathe deeply",
      "Stop if you feel pain",
    ],
  },

  "Couch Stretch": {
    category: "Recovery",
    primaryMuscles: ["Hip Flexors"],
    secondaryMuscles: ["Quadriceps"],
    equipment: ["Couch", "or Bench"],
    difficulty: "beginner",
    setup: "Kneel with back leg on couch",
    execution: [
      "Kneel with back leg on couch",
      "Front leg forward",
      "Lean into stretch",
      "Hold stretch",
      "Switch legs",
    ],
    coaching: [
      "Feel stretch in hip flexor",
      "Hold stretch",
      "Breathe deeply",
      "Don't force",
    ],
    progressions: [
      "Shallow couch stretch",
      "Standard couch stretch",
      "Deep couch stretch",
      "Dynamic couch stretch",
    ],
    safetyNotes: [
      "Don't force the stretch",
      "Breathe deeply",
      "Stop if you feel pain",
    ],
  },

  "Pigeon Pose": {
    category: "Recovery",
    primaryMuscles: ["Hip Flexors", "Glutes"],
    secondaryMuscles: ["Core"],
    equipment: ["Yoga mat"],
    difficulty: "beginner",
    setup: "Start in tabletop position",
    execution: [
      "Bring one leg forward",
      "Extend back leg",
      "Square hips",
      "Hold stretch",
      "Switch sides",
    ],
    coaching: [
      "Feel stretch in hip",
      "Square hips",
      "Hold stretch",
      "Breathe deeply",
    ],
    progressions: [
      "Shallow pigeon pose",
      "Standard pigeon pose",
      "Deep pigeon pose",
      "Dynamic pigeon pose",
    ],
    safetyNotes: [
      "Don't force the stretch",
      "Breathe deeply",
      "Stop if you feel pain",
    ],
  },

  "Band Walks": {
    category: "Recovery",
    primaryMuscles: ["Hip Abductors", "Glutes"],
    secondaryMuscles: ["Core", "Stabilizers"],
    equipment: ["Resistance band"],
    difficulty: "beginner",
    setup: "Place band around legs, stand in athletic position",
    execution: [
      "Place band around legs",
      "Step sideways",
      "Maintain tension",
      "Alternate directions",
      "Control the movement",
    ],
    coaching: [
      "Maintain tension",
      "Control the movement",
      "Feel glute activation",
      "Don't rush",
    ],
    progressions: [
      "Light band walks",
      "Medium band walks",
      "Heavy band walks",
      "Single-leg band walks",
    ],
    safetyNotes: ["Control the movement", "Don't rush", "Focus on form"],
  },

  "Jump Rope Singles": {
    category: "Recovery",
    primaryMuscles: ["Calves", "Cardiovascular"],
    secondaryMuscles: ["Core", "Full body"],
    equipment: ["Jump rope"],
    difficulty: "beginner",
    setup: "Hold jump rope, stand ready",
    execution: [
      "Hold rope handles",
      "Jump over rope",
      "Land on balls of feet",
      "Maintain rhythm",
      "Continue for duration",
    ],
    coaching: [
      "Land on balls of feet",
      "Maintain rhythm",
      "Stay light on feet",
      "Use arms",
    ],
    progressions: [
      "Slow jump rope",
      "Moderate jump rope",
      "Fast jump rope",
      "Double unders",
    ],
    safetyNotes: ["Start slowly", "Focus on form", "Stop if ankles feel tight"],
  },

  // Change of Direction & Deceleration Exercises
  "Three-Step Acceleration-Deceleration Drops": {
    category: "Agility",
    primaryMuscles: ["Quadriceps", "Hamstrings", "Glutes"],
    secondaryMuscles: ["Core", "Calves", "Stabilizers"],
    equipment: ["Open space", "Cones"],
    difficulty: "intermediate",
    setup: "Set up cones at 5-yard intervals, start in athletic position",
    execution: [
      "Accelerate for 3 steps forward",
      "Decelerate rapidly on 4th step",
      "Absorb force through hips and knees",
      "Maintain balance in split-leg stance",
      "Immediately redirect force in new direction",
    ],
    coaching: [
      "Absorb force through hips, not just knees",
      "Keep center of mass low during deceleration",
      "Maintain split-leg stance for stability",
      "Redirect force explosively",
      "Control the landing",
    ],
    progressions: [
      "Walking 3-step drops",
      "Jogging 3-step drops",
      "Sprinting 3-step drops",
      "3-step drops with 90-degree cut",
      "3-step drops with 180-degree cut",
    ],
    safetyNotes: [
      "Proper warm-up essential",
      "Focus on force absorption",
      "Start with slower speeds",
      "Ensure adequate recovery between reps",
    ],
  },

  "Split-Leg Stance Deceleration": {
    category: "Agility",
    primaryMuscles: ["Quadriceps", "Hamstrings", "Glutes"],
    secondaryMuscles: ["Core", "Hip stabilizers"],
    equipment: ["Open space"],
    difficulty: "intermediate",
    setup: "Start in athletic position, prepare for deceleration",
    execution: [
      "Accelerate forward",
      "Decelerate into split-leg stance",
      "Front leg absorbs majority of force",
      "Back leg provides stability",
      "Hold position for 2-3 seconds",
      "Maintain balance",
    ],
    coaching: [
      "Front leg knee over ankle",
      "Hip flexed, knee flexed",
      "Back leg extended for support",
      "Core engaged throughout",
      "Maintain upright torso",
    ],
    progressions: [
      "Static split-leg stance hold",
      "Walking into split-leg stance",
      "Jogging into split-leg stance",
      "Sprinting into split-leg stance",
      "Split-leg stance with direction change",
    ],
    safetyNotes: [
      "Focus on proper landing mechanics",
      "Don't let knee cave inward",
      "Control the deceleration",
      "Start with lower speeds",
    ],
  },

  "Unilateral Deceleration Drops": {
    category: "Agility",
    primaryMuscles: ["Quadriceps", "Hamstrings", "Glutes"],
    secondaryMuscles: ["Core", "Hip stabilizers", "Ankle stabilizers"],
    equipment: ["Open space", "Box or platform"],
    difficulty: "advanced",
    setup: "Stand on box/platform, one leg hanging off",
    execution: [
      "Step off box with one leg",
      "Land on single leg",
      "Absorb force through landing leg",
      "Decelerate to complete stop",
      "Maintain balance",
      "Hold for 2 seconds",
    ],
    coaching: [
      "Soft landing on ball of foot",
      "Absorb force through hip and knee",
      "Keep knee tracking over toe",
      "Maintain upright posture",
      "Engage core throughout",
    ],
    progressions: [
      "Low box (6 inches)",
      "Medium box (12 inches)",
      "High box (18 inches)",
      "Unilateral drop with immediate cut",
      "Unilateral drop with jump",
    ],
    safetyNotes: [
      "Start with low heights",
      "Focus on landing mechanics",
      "Don't let knee cave inward",
      "Ensure adequate recovery",
    ],
  },

  "Lateral Deceleration Cuts": {
    category: "Agility",
    primaryMuscles: ["Glutes", "Hip abductors", "Quadriceps"],
    secondaryMuscles: ["Core", "Hamstrings", "Stabilizers"],
    equipment: ["Cones", "Open space"],
    difficulty: "intermediate",
    setup: "Set up cones in L-pattern, start at first cone",
    execution: [
      "Sprint forward to second cone",
      "Decelerate rapidly",
      "Cut laterally at 90 degrees",
      "Absorb force through outside leg",
      "Accelerate in new direction",
    ],
    coaching: [
      "Lower center of mass before cut",
      "Outside leg absorbs force",
      "Push off explosively",
      "Maintain balance throughout",
      "Keep head up",
    ],
    progressions: [
      "Walking lateral cuts",
      "Jogging lateral cuts",
      "Sprinting lateral cuts",
      "Lateral cuts with multiple directions",
      "Reactive lateral cuts",
    ],
    safetyNotes: [
      "Proper warm-up essential",
      "Focus on deceleration mechanics",
      "Don't let knee cave inward",
      "Start with slower speeds",
    ],
  },

  "45-Degree Cutting Drills": {
    category: "Agility",
    primaryMuscles: ["Quadriceps", "Glutes", "Hip abductors"],
    secondaryMuscles: ["Core", "Hamstrings", "Stabilizers"],
    equipment: ["Cones", "Open space"],
    difficulty: "intermediate",
    setup: "Set up cones in zigzag pattern at 45-degree angles",
    execution: [
      "Sprint to first cone",
      "Decelerate and cut at 45 degrees",
      "Absorb force through outside leg",
      "Accelerate to next cone",
      "Repeat pattern",
    ],
    coaching: [
      "Plant foot outside cone",
      "Lower center of mass",
      "Push off explosively",
      "Maintain speed through cuts",
      "Keep head up",
    ],
    progressions: [
      "Walking 45-degree cuts",
      "Jogging 45-degree cuts",
      "Sprinting 45-degree cuts",
      "45-degree cuts with direction changes",
      "Reactive 45-degree cuts",
    ],
    safetyNotes: [
      "Focus on proper cutting mechanics",
      "Don't let knee cave inward",
      "Control deceleration",
      "Start with slower speeds",
    ],
  },

  "Reactive Cutting Drills": {
    category: "Agility",
    primaryMuscles: ["Full body"],
    secondaryMuscles: ["Core", "Stabilizers"],
    equipment: ["Cones", "Partner or coach"],
    difficulty: "advanced",
    setup: "Set up multiple cones, partner/coach signals direction",
    execution: [
      "Start in athletic position",
      "React to visual or auditory cue",
      "Decelerate and cut in signaled direction",
      "Absorb force through outside leg",
      "Accelerate in new direction",
    ],
    coaching: [
      "Quick reaction to stimulus",
      "Proper deceleration mechanics",
      "Explosive acceleration",
      "Maintain balance",
      "Stay low during cuts",
    ],
    progressions: [
      "Pre-planned cuts",
      "Delayed reaction cuts",
      "Multiple direction changes",
      "Game-speed reactive cuts",
      "Reactive cuts with ball",
    ],
    safetyNotes: [
      "Proper warm-up essential",
      "Start with simple cues",
      "Focus on form over speed",
      "Ensure adequate recovery",
    ],
  },

  // Unilateral Plyometric Exercises
  "Single-Leg Hops": {
    category: "Plyometric",
    primaryMuscles: ["Quadriceps", "Calves", "Glutes"],
    secondaryMuscles: ["Core", "Hip stabilizers", "Ankle stabilizers"],
    equipment: ["Open space"],
    difficulty: "intermediate",
    setup: "Stand on one leg, ready to hop",
    execution: [
      "Stand on one leg",
      "Hop forward",
      "Land on same leg",
      "Absorb force through hip and knee",
      "Immediately hop again",
      "Maintain rhythm",
    ],
    coaching: [
      "Soft landing",
      "Absorb force through hip and knee",
      "Maintain balance",
      "Quick ground contact",
      "Use arms for balance",
    ],
    progressions: [
      "Single-leg hops in place",
      "Single-leg forward hops",
      "Single-leg lateral hops",
      "Single-leg hops for distance",
      "Single-leg hops with direction changes",
    ],
    safetyNotes: [
      "Start with low intensity",
      "Focus on landing mechanics",
      "Don't let knee cave inward",
      "Stop if balance is lost",
    ],
  },

  "Single-Leg Bounds": {
    category: "Plyometric",
    primaryMuscles: ["Quadriceps", "Glutes", "Hip flexors"],
    secondaryMuscles: ["Core", "Calves", "Stabilizers"],
    equipment: ["Open space"],
    difficulty: "intermediate",
    setup: "Stand on one leg, ready to bound",
    execution: [
      "Stand on one leg",
      "Explosively bound forward",
      "Land on same leg",
      "Absorb force and immediately bound again",
      "Maintain rhythm",
      "Cover maximum distance",
    ],
    coaching: [
      "Explosive takeoff",
      "Full hip extension",
      "Soft landing",
      "Quick ground contact",
      "Use arms for momentum",
    ],
    progressions: [
      "Single-leg bounds (short distance)",
      "Single-leg bounds (medium distance)",
      "Single-leg bounds (long distance)",
      "Alternating single-leg bounds",
      "Single-leg bounds with height",
    ],
    safetyNotes: [
      "Start with shorter distances",
      "Focus on landing mechanics",
      "Don't let knee cave inward",
      "Ensure adequate recovery",
    ],
  },

  "Single-Leg Lateral Bounds": {
    category: "Plyometric",
    primaryMuscles: ["Glutes", "Hip abductors", "Quadriceps"],
    secondaryMuscles: ["Core", "Stabilizers"],
    equipment: ["Open space"],
    difficulty: "intermediate",
    setup: "Stand on one leg, ready to bound laterally",
    execution: [
      "Stand on one leg",
      "Explosively bound laterally",
      "Land on same leg",
      "Absorb force through hip and knee",
      "Immediately bound back",
      "Maintain rhythm",
    ],
    coaching: [
      "Explosive lateral movement",
      "Absorb force on landing",
      "Maintain balance",
      "Quick ground contact",
      "Use arms for balance",
    ],
    progressions: [
      "Small lateral bounds",
      "Medium lateral bounds",
      "Large lateral bounds",
      "Lateral bounds with height",
      "Lateral bounds with direction changes",
    ],
    safetyNotes: [
      "Start with small movements",
      "Focus on landing mechanics",
      "Don't let knee cave inward",
      "Control the movement",
    ],
  },

  "Single-Leg Drop Jumps": {
    category: "Plyometric",
    primaryMuscles: ["Quadriceps", "Glutes", "Calves"],
    secondaryMuscles: ["Core", "Hip stabilizers"],
    equipment: ["Box or platform"],
    difficulty: "advanced",
    setup: "Stand on box, one leg hanging off",
    execution: [
      "Step off box with one leg",
      "Land on single leg",
      "Absorb force immediately",
      "Explosively jump up",
      "Land softly",
      "Maintain balance",
    ],
    coaching: [
      "Soft landing",
      "Absorb force quickly",
      "Explosive jump",
      "Maintain balance",
      "Minimal ground contact",
    ],
    progressions: [
      "Low box (6 inches)",
      "Medium box (12 inches)",
      "High box (18 inches)",
      "Drop jump with direction change",
      "Drop jump with maximum height",
    ],
    safetyNotes: [
      "Start with low heights",
      "Focus on landing mechanics",
      "Don't let knee cave inward",
      "Ensure adequate recovery",
    ],
  },

  // Balance & Body Awareness Exercises
  "Single-Leg Balance Holds": {
    category: "Recovery",
    primaryMuscles: ["Core", "Hip stabilizers", "Ankle stabilizers"],
    secondaryMuscles: ["Glutes", "Calves"],
    equipment: ["None", "Optional: Balance pad"],
    difficulty: "beginner",
    setup: "Stand on one leg, other leg lifted",
    execution: [
      "Lift one leg off ground",
      "Maintain balance on standing leg",
      "Keep core engaged",
      "Hold position",
      "Focus on stability",
      "Breathe normally",
    ],
    coaching: [
      "Keep standing leg slightly bent",
      "Engage core",
      "Keep hips level",
      "Focus on a fixed point",
      "Maintain balance",
    ],
    progressions: [
      "Single-leg hold (30 seconds)",
      "Single-leg hold (60 seconds)",
      "Single-leg hold with eyes closed",
      "Single-leg hold on unstable surface",
      "Single-leg hold with arm movements",
    ],
    safetyNotes: [
      "Use support if needed",
      "Stop if balance is lost",
      "Don't hold breath",
      "Focus on form",
    ],
  },

  "Single-Leg Balance with Perturbations": {
    category: "Recovery",
    primaryMuscles: ["Core", "Hip stabilizers", "Ankle stabilizers"],
    secondaryMuscles: ["Full body stabilizers"],
    equipment: ["Partner", "Optional: Resistance band"],
    difficulty: "intermediate",
    setup: "Stand on one leg, partner ready to provide perturbations",
    execution: [
      "Stand on one leg",
      "Partner applies gentle pushes",
      "React and maintain balance",
      "Return to center",
      "Repeat with various directions",
    ],
    coaching: [
      "React quickly to perturbations",
      "Maintain balance",
      "Engage core",
      "Use arms for balance",
      "Stay relaxed",
    ],
    progressions: [
      "Light perturbations",
      "Moderate perturbations",
      "Heavy perturbations",
      "Unexpected perturbations",
      "Perturbations with eyes closed",
    ],
    safetyNotes: [
      "Start with light perturbations",
      "Have support nearby",
      "Stop if balance is lost",
      "Focus on control",
    ],
  },

  "Y-Balance Test": {
    category: "Recovery",
    primaryMuscles: ["Core", "Hip stabilizers", "Hamstrings"],
    secondaryMuscles: ["Glutes", "Ankle stabilizers"],
    equipment: ["Tape or markers"],
    difficulty: "beginner",
    setup: "Stand on one leg, reach in Y-pattern",
    execution: [
      "Stand on one leg",
      "Reach forward with opposite leg",
      "Return to center",
      "Reach diagonally",
      "Return to center",
      "Reach laterally",
      "Return to center",
    ],
    coaching: [
      "Maintain balance throughout",
      "Reach as far as possible",
      "Keep core engaged",
      "Don't touch down",
      "Control the movement",
    ],
    progressions: [
      "Y-balance with support",
      "Y-balance without support",
      "Y-balance with eyes closed",
      "Y-balance on unstable surface",
      "Y-balance with added weight",
    ],
    safetyNotes: [
      "Use support if needed",
      "Stop if balance is lost",
      "Focus on form",
      "Don't rush",
    ],
  },

  "Star Excursion Balance Test": {
    category: "Recovery",
    primaryMuscles: ["Core", "Hip stabilizers", "Hamstrings"],
    secondaryMuscles: ["Glutes", "Ankle stabilizers"],
    equipment: ["Tape or markers"],
    difficulty: "intermediate",
    setup: "Stand on one leg, reach in 8 directions",
    execution: [
      "Stand on one leg",
      "Reach in 8 directions",
      "Return to center each time",
      "Maintain balance",
      "Measure reach distance",
    ],
    coaching: [
      "Maintain balance",
      "Reach as far as possible",
      "Keep core engaged",
      "Don't touch down",
      "Control the movement",
    ],
    progressions: [
      "Star excursion with support",
      "Star excursion without support",
      "Star excursion with eyes closed",
      "Star excursion on unstable surface",
      "Star excursion with added weight",
    ],
    safetyNotes: [
      "Use support if needed",
      "Stop if balance is lost",
      "Focus on form",
      "Don't rush",
    ],
  },

  "Single-Leg RDL Hold": {
    category: "Recovery",
    primaryMuscles: ["Hamstrings", "Glutes", "Core"],
    secondaryMuscles: ["Hip stabilizers", "Ankle stabilizers"],
    equipment: ["None", "Optional: Weight"],
    difficulty: "intermediate",
    setup: "Stand on one leg, hinge at hip",
    execution: [
      "Stand on one leg",
      "Hinge at hip",
      "Extend opposite leg back",
      "Hold position",
      "Maintain balance",
      "Return to start",
    ],
    coaching: [
      "Keep standing leg slightly bent",
      "Maintain neutral spine",
      "Engage core",
      "Keep hips level",
      "Hold for duration",
    ],
    progressions: [
      "Single-leg RDL hold (10 seconds)",
      "Single-leg RDL hold (30 seconds)",
      "Single-leg RDL hold with weight",
      "Single-leg RDL hold with eyes closed",
      "Single-leg RDL hold on unstable surface",
    ],
    safetyNotes: [
      "Use support if needed",
      "Stop if balance is lost",
      "Don't round back",
      "Focus on form",
    ],
  },

  // Reactive Power Exercises
  "Reactive Hops": {
    category: "Plyometric",
    primaryMuscles: ["Quadriceps", "Calves", "Glutes"],
    secondaryMuscles: ["Core", "Ankle stabilizers"],
    equipment: ["Open space"],
    difficulty: "intermediate",
    setup: "Stand ready to hop",
    execution: [
      "Hop up and forward",
      "Land and immediately hop again",
      "Minimal ground contact",
      "Maintain rhythm",
      "React to ground contact",
    ],
    coaching: [
      "Minimal ground contact",
      "Quick reaction",
      "Maintain rhythm",
      "Use arms",
      "Stay light on feet",
    ],
    progressions: [
      "Slow reactive hops",
      "Moderate reactive hops",
      "Fast reactive hops",
      "Reactive hops with direction changes",
      "Single-leg reactive hops",
    ],
    safetyNotes: [
      "Start slowly",
      "Focus on form",
      "Stop if ankles feel tight",
      "Ensure adequate recovery",
    ],
  },

  "Depth Jumps": {
    category: "Plyometric",
    primaryMuscles: ["Quadriceps", "Glutes", "Calves"],
    secondaryMuscles: ["Core", "Hamstrings"],
    equipment: ["Box or platform"],
    difficulty: "advanced",
    setup: "Stand on box, ready to jump down",
    execution: [
      "Step off box",
      "Land on both feet",
      "Absorb force immediately",
      "Explosively jump up",
      "Land softly",
      "Minimal ground contact",
    ],
    coaching: [
      "Soft landing",
      "Absorb force quickly",
      "Explosive jump",
      "Minimal ground contact",
      "Use arms",
    ],
    progressions: [
      "Low box (12 inches)",
      "Medium box (18 inches)",
      "High box (24 inches)",
      "Depth jump with maximum height",
      "Depth jump with direction change",
    ],
    safetyNotes: [
      "Start with low heights",
      "Focus on landing mechanics",
      "Don't rush",
      "Ensure adequate recovery",
    ],
  },

  "Reactive Bounds": {
    category: "Plyometric",
    primaryMuscles: ["Quadriceps", "Glutes", "Hip flexors"],
    secondaryMuscles: ["Core", "Calves"],
    equipment: ["Open space"],
    difficulty: "intermediate",
    setup: "Stand ready to bound",
    execution: [
      "Bound forward",
      "Land and immediately bound again",
      "React to ground contact",
      "Maintain rhythm",
      "Cover maximum distance",
    ],
    coaching: [
      "Quick ground contact",
      "Explosive takeoff",
      "Maintain rhythm",
      "Use arms",
      "Stay light on feet",
    ],
    progressions: [
      "Slow reactive bounds",
      "Moderate reactive bounds",
      "Fast reactive bounds",
      "Reactive bounds with direction changes",
      "Single-leg reactive bounds",
    ],
    safetyNotes: [
      "Start slowly",
      "Focus on form",
      "Ensure adequate recovery",
      "Don't rush",
    ],
  },

  "Lateral Reactive Bounds": {
    category: "Plyometric",
    primaryMuscles: ["Glutes", "Hip abductors", "Quadriceps"],
    secondaryMuscles: ["Core", "Stabilizers"],
    equipment: ["Open space"],
    difficulty: "intermediate",
    setup: "Stand ready to bound laterally",
    execution: [
      "Bound laterally",
      "Land and immediately bound back",
      "React to ground contact",
      "Maintain rhythm",
      "Cover maximum distance",
    ],
    coaching: [
      "Quick ground contact",
      "Explosive lateral movement",
      "Maintain rhythm",
      "Use arms",
      "Stay balanced",
    ],
    progressions: [
      "Slow lateral reactive bounds",
      "Moderate lateral reactive bounds",
      "Fast lateral reactive bounds",
      "Lateral reactive bounds with height",
      "Lateral reactive bounds with direction changes",
    ],
    safetyNotes: [
      "Start slowly",
      "Focus on form",
      "Don't let knee cave inward",
      "Ensure adequate recovery",
    ],
  },

  // Eccentric Strength for Deceleration
  "Eccentric Squats": {
    category: "Strength",
    primaryMuscles: ["Quadriceps", "Glutes"],
    secondaryMuscles: ["Core", "Hamstrings"],
    equipment: ["Barbell", "Dumbbells", "or Bodyweight"],
    difficulty: "intermediate",
    setup: "Stand with weight on shoulders or bodyweight",
    execution: [
      "Start standing",
      "Lower slowly (4-6 seconds)",
      "Control the descent",
      "Feel quadriceps working",
      "Reach bottom position",
      "Return to start",
    ],
    coaching: [
      "Slow, controlled descent",
      "Feel quadriceps working",
      "Keep core engaged",
      "Control the movement",
      "Full range of motion",
    ],
    progressions: [
      "Bodyweight eccentric squats",
      "Light weight eccentric squats",
      "Heavy weight eccentric squats",
      "Eccentric pause squats",
      "Single-leg eccentric squats",
    ],
    safetyNotes: [
      "Start light",
      "Focus on control",
      "Don't rush",
      "Stop if form breaks",
    ],
  },

  "Eccentric Single-Leg Squats": {
    category: "Strength",
    primaryMuscles: ["Quadriceps", "Glutes"],
    secondaryMuscles: ["Core", "Hip stabilizers"],
    equipment: ["None", "Optional: Weight"],
    difficulty: "advanced",
    setup: "Stand on one leg, other leg extended",
    execution: [
      "Stand on one leg",
      "Lower slowly (4-6 seconds)",
      "Control the descent",
      "Feel quadriceps working",
      "Reach bottom position",
      "Return to start",
    ],
    coaching: [
      "Slow, controlled descent",
      "Feel quadriceps working",
      "Keep core engaged",
      "Maintain balance",
      "Control the movement",
    ],
    progressions: [
      "Assisted eccentric single-leg squat",
      "Bodyweight eccentric single-leg squat",
      "Weighted eccentric single-leg squat",
      "Eccentric pause single-leg squat",
      "Eccentric single-leg squat with reach",
    ],
    safetyNotes: [
      "Start with assistance",
      "Focus on control",
      "Don't let knee cave inward",
      "Stop if balance is lost",
    ],
  },

  "Eccentric Lunges": {
    category: "Strength",
    primaryMuscles: ["Quadriceps", "Glutes"],
    secondaryMuscles: ["Core", "Hamstrings"],
    equipment: ["None", "Optional: Weight"],
    difficulty: "intermediate",
    setup: "Stand in lunge position",
    execution: [
      "Start in lunge position",
      "Lower slowly (4-6 seconds)",
      "Control the descent",
      "Feel front leg working",
      "Reach bottom position",
      "Return to start",
    ],
    coaching: [
      "Slow, controlled descent",
      "Feel front leg working",
      "Keep core engaged",
      "Control the movement",
      "Full range of motion",
    ],
    progressions: [
      "Bodyweight eccentric lunges",
      "Weighted eccentric lunges",
      "Walking eccentric lunges",
      "Eccentric pause lunges",
      "Eccentric reverse lunges",
    ],
    safetyNotes: [
      "Start light",
      "Focus on control",
      "Don't rush",
      "Stop if form breaks",
    ],
  },

  "Eccentric Step-Downs": {
    category: "Strength",
    primaryMuscles: ["Quadriceps", "Glutes"],
    secondaryMuscles: ["Core", "Hip stabilizers"],
    equipment: ["Box or platform"],
    difficulty: "intermediate",
    setup: "Stand on box, one leg hanging off",
    execution: [
      "Stand on box",
      "Lower slowly (4-6 seconds)",
      "Control the descent",
      "Feel quadriceps working",
      "Touch ground with heel",
      "Return to start",
    ],
    coaching: [
      "Slow, controlled descent",
      "Feel quadriceps working",
      "Keep core engaged",
      "Control the movement",
      "Don't let knee cave inward",
    ],
    progressions: [
      "Low box (6 inches)",
      "Medium box (12 inches)",
      "High box (18 inches)",
      "Weighted eccentric step-downs",
      "Eccentric step-downs with pause",
    ],
    safetyNotes: [
      "Start with low heights",
      "Focus on control",
      "Don't let knee cave inward",
      "Stop if form breaks",
    ],
  },

  // Deadlift Variations - Fundamental Strength Exercises
  "Conventional Deadlifts": {
    category: "Strength",
    primaryMuscles: ["Hamstrings", "Glutes", "Lower back"],
    secondaryMuscles: ["Core", "Lats", "Traps", "Quadriceps"],
    equipment: ["Barbell", "Plates", "Lifting platform"],
    difficulty: "intermediate",
    setup: "Stand with feet hip-width apart, bar over mid-foot",
    execution: [
      "Hinge at hips and bend knees",
      "Grip bar just outside legs",
      "Keep back flat, chest up",
      "Drive through heels and extend hips",
      "Stand tall at top",
      "Lower bar with control",
    ],
    coaching: [
      "Keep bar close to body",
      "Maintain neutral spine",
      "Drive hips forward at top",
      "Full hip extension",
      "Control the descent",
    ],
    progressions: [
      "Romanian deadlifts (RDLs)",
      "Light conventional deadlifts",
      "Moderate conventional deadlifts",
      "Heavy conventional deadlifts",
      "Conventional deadlifts with pause",
    ],
    safetyNotes: [
      "Start light, focus on form",
      "Never round the back",
      "Use proper lifting belt if needed",
      "Have spotter or safety bars",
      "Warm up thoroughly",
    ],
  },

  "Trap Bar Deadlifts (Hex Bar Deadlifts)": {
    category: "Strength",
    primaryMuscles: ["Quadriceps", "Glutes", "Hamstrings"],
    secondaryMuscles: ["Core", "Lower back", "Traps"],
    equipment: ["Trap bar (hex bar)", "Plates"],
    difficulty: "beginner",
    setup: "Stand inside trap bar, feet shoulder-width apart",
    execution: [
      "Hinge at hips and bend knees",
      "Grip handles on sides",
      "Keep back flat, chest up",
      "Drive through heels and extend hips",
      "Stand tall at top",
      "Lower bar with control",
    ],
    coaching: [
      "More upright torso than conventional",
      "Quadriceps work more than conventional",
      "Safer for beginners",
      "Drive through heels",
      "Full hip extension",
    ],
    progressions: [
      "Light trap bar deadlifts",
      "Moderate trap bar deadlifts",
      "Heavy trap bar deadlifts",
      "Trap bar deadlifts with pause",
      "Trap bar deadlifts with bands",
    ],
    safetyNotes: [
      "Start light, focus on form",
      "Keep back flat",
      "Control the movement",
      "Use proper lifting belt if needed",
      "Warm up thoroughly",
    ],
  },

  "Sumo Deadlifts": {
    category: "Strength",
    primaryMuscles: ["Glutes", "Hamstrings", "Quadriceps"],
    secondaryMuscles: ["Core", "Lower back", "Adductors"],
    equipment: ["Barbell", "Plates", "Lifting platform"],
    difficulty: "intermediate",
    setup: "Wide stance, feet angled out, bar close to shins",
    execution: [
      "Wide stance with toes pointed out",
      "Grip bar inside legs",
      "Keep back flat, chest up",
      "Drive through heels and extend hips",
      "Stand tall at top",
      "Lower bar with control",
    ],
    coaching: [
      "Wider stance than conventional",
      "More quadriceps involvement",
      "Keep knees tracking over toes",
      "Drive through heels",
      "Full hip extension",
    ],
    progressions: [
      "Light sumo deadlifts",
      "Moderate sumo deadlifts",
      "Heavy sumo deadlifts",
      "Sumo deadlifts with pause",
      "Sumo deadlifts with bands",
    ],
    safetyNotes: [
      "Start light, focus on form",
      "Keep back flat",
      "Don't let knees cave inward",
      "Use proper lifting belt if needed",
      "Warm up thoroughly",
    ],
  },

  // Weighted Plyometric Exercises
  "Weighted Box Jumps": {
    category: "Plyometric",
    primaryMuscles: ["Quadriceps", "Glutes"],
    secondaryMuscles: ["Calves", "Core"],
    equipment: ["Plyo box", "Weighted vest", "or Dumbbells"],
    difficulty: "advanced",
    setup: "Stand 2-3 feet from box, wearing weighted vest or holding weights",
    execution: [
      "Start in athletic position",
      "Swing arms back while squatting slightly",
      "Explosively jump onto box",
      "Land softly with both feet",
      "Step down, don't jump down",
      "Maintain form with added load",
    ],
    coaching: [
      "Focus on landing mechanics",
      "Use arms for momentum",
      "Land quietly",
      "Full hip extension at takeoff",
      "Control the added weight",
    ],
    progressions: [
      "Bodyweight box jumps",
      "Light weight (5-10 lbs)",
      "Moderate weight (10-20 lbs)",
      "Heavy weight (20-30 lbs)",
      "Weighted box jumps with height focus",
    ],
    safetyNotes: [
      "Master bodyweight box jumps first",
      "Start with light weights",
      "Always step down, never jump down",
      "Ensure box is stable",
      "Focus on form over weight",
    ],
  },

  "Weighted Broad Jumps": {
    category: "Plyometric",
    primaryMuscles: ["Quadriceps", "Glutes"],
    secondaryMuscles: ["Hamstrings", "Calves", "Core"],
    equipment: ["Open space", "Weighted vest", "or Dumbbells"],
    difficulty: "advanced",
    setup:
      "Feet shoulder-width apart, wearing weighted vest or holding weights",
    execution: [
      "Start in semi-squat position",
      "Swing arms forward explosively",
      "Jump as far forward as possible",
      "Land on both feet simultaneously",
      "Stick the landing",
      "Maintain form with added load",
    ],
    coaching: [
      "Use arms for momentum",
      "Drive through ground",
      "Land balanced",
      "Focus on distance, not height",
      "Control the added weight",
    ],
    progressions: [
      "Bodyweight broad jumps",
      "Light weight (5-10 lbs)",
      "Moderate weight (10-20 lbs)",
      "Heavy weight (20-30 lbs)",
      "Weighted broad jumps for maximum distance",
    ],
    safetyNotes: [
      "Master bodyweight broad jumps first",
      "Start with light weights",
      "Clear landing area",
      "Land with knees bent",
      "Focus on form over weight",
    ],
  },

  "Weighted Jump Squats": {
    category: "Plyometric",
    primaryMuscles: ["Quadriceps", "Glutes"],
    secondaryMuscles: ["Calves", "Core"],
    equipment: ["Dumbbells", "Kettlebells", "or Weighted vest"],
    difficulty: "advanced",
    setup: "Feet shoulder-width apart, holding weights or wearing vest",
    execution: [
      "Start in squat position with weight",
      "Explosively jump up",
      "Land softly",
      "Immediately go into next squat",
      "Maintain rhythm",
      "Control the added load",
    ],
    coaching: [
      "Explosive jump",
      "Land softly",
      "Full hip extension",
      "Maintain rhythm",
      "Control the weight throughout",
    ],
    progressions: [
      "Bodyweight jump squats",
      "Light weight (5-10 lbs)",
      "Moderate weight (10-20 lbs)",
      "Heavy weight (20-30 lbs)",
      "Weighted jump squats with pause",
    ],
    safetyNotes: [
      "Master bodyweight jump squats first",
      "Start with light weights",
      "Land softly",
      "Don't rush",
      "Focus on form over weight",
    ],
  },

  // Additional Fundamental Exercises
  "Kettlebell Swings": {
    category: "Plyometric",
    primaryMuscles: ["Glutes", "Hamstrings"],
    secondaryMuscles: ["Core", "Shoulders", "Lats"],
    equipment: ["Kettlebell"],
    difficulty: "intermediate",
    setup: "Stand with feet shoulder-width apart, kettlebell between legs",
    execution: [
      "Hinge at hips, grab kettlebell",
      "Drive hips forward explosively",
      "Swing kettlebell to chest height",
      "Let momentum bring it back down",
      "Repeat with rhythm",
      "Use hips, not arms",
    ],
    coaching: [
      "Hip hinge movement",
      "Explosive hip drive",
      "Arms are just along for the ride",
      "Full hip extension",
      "Maintain rhythm",
    ],
    progressions: [
      "Light kettlebell (16-20 lbs)",
      "Moderate kettlebell (24-32 lbs)",
      "Heavy kettlebell (40-53 lbs)",
      "Two-handed swings",
      "Single-arm swings",
    ],
    safetyNotes: [
      "Start light",
      "Focus on hip drive",
      "Keep core engaged",
      "Don't round back",
      "Control the movement",
    ],
  },

  "Sled Pushes": {
    category: "Strength",
    primaryMuscles: ["Quadriceps", "Glutes", "Calves"],
    secondaryMuscles: ["Core", "Shoulders", "Triceps"],
    equipment: ["Sled", "Weight plates"],
    difficulty: "intermediate",
    setup: "Load sled, stand behind it, hands on handles",
    execution: [
      "Lean into sled at 45-degree angle",
      "Drive through legs",
      "Push sled forward",
      "Maintain forward lean",
      "Keep core engaged",
      "Complete distance",
    ],
    coaching: [
      "Drive through legs",
      "Maintain forward lean",
      "Keep core engaged",
      "Full leg extension",
      "Consistent pace",
    ],
    progressions: [
      "Light load (25-50% bodyweight)",
      "Moderate load (50-75% bodyweight)",
      "Heavy load (75-100% bodyweight)",
      "Sled pushes for distance",
      "Sled pushes for speed",
    ],
    safetyNotes: [
      "Start with light loads",
      "Proper warm-up essential",
      "Maintain form",
      "Don't round back",
      "Ensure adequate recovery",
    ],
  },

  "Sled Pulls": {
    category: "Strength",
    primaryMuscles: ["Hamstrings", "Glutes", "Core"],
    secondaryMuscles: ["Lats", "Biceps", "Calves"],
    equipment: ["Sled", "Weight plates", "Rope or harness"],
    difficulty: "intermediate",
    setup: "Load sled, attach rope/harness, walk forward",
    execution: [
      "Walk forward with rope/harness",
      "Drive through legs",
      "Pull sled behind",
      "Maintain upright posture",
      "Keep core engaged",
      "Complete distance",
    ],
    coaching: [
      "Drive through legs",
      "Maintain upright posture",
      "Keep core engaged",
      "Full leg extension",
      "Consistent pace",
    ],
    progressions: [
      "Light load (25-50% bodyweight)",
      "Moderate load (50-75% bodyweight)",
      "Heavy load (75-100% bodyweight)",
      "Sled pulls for distance",
      "Sled pulls for speed",
    ],
    safetyNotes: [
      "Start with light loads",
      "Proper warm-up essential",
      "Maintain form",
      "Don't lean back excessively",
      "Ensure adequate recovery",
    ],
  },

  "Backpedal Drills": {
    category: "Sprint",
    primaryMuscles: ["Hamstrings", "Glutes", "Calves"],
    secondaryMuscles: ["Core", "Hip flexors"],
    equipment: ["Open space", "Cones"],
    difficulty: "beginner",
    setup: "Stand ready, mark distance",
    execution: [
      "Start in athletic position",
      "Push off back leg",
      "Move backward quickly",
      "Stay on balls of feet",
      "Maintain balance",
      "Keep head up",
    ],
    coaching: [
      "Stay on balls of feet",
      "Quick steps",
      "Maintain balance",
      "Keep head up",
      "Full leg extension",
    ],
    progressions: [
      "Slow backpedal",
      "Moderate backpedal",
      "Fast backpedal",
      "Backpedal with direction changes",
      "Backpedal to sprint transition",
    ],
    safetyNotes: [
      "Start slowly",
      "Focus on form",
      "Clear area behind",
      "Stop if balance is lost",
      "Proper warm-up essential",
    ],
  },

  "Lateral Shuffle": {
    category: "Agility",
    primaryMuscles: ["Hip abductors", "Glutes", "Quadriceps"],
    secondaryMuscles: ["Core", "Calves", "Stabilizers"],
    equipment: ["Open space", "Cones"],
    difficulty: "beginner",
    setup: "Stand in athletic position, ready to move laterally",
    execution: [
      "Start in athletic position",
      "Step laterally with lead leg",
      "Follow with trail leg",
      "Stay low",
      "Maintain balance",
      "Keep head up",
    ],
    coaching: [
      "Stay low",
      "Quick steps",
      "Maintain balance",
      "Keep head up",
      "Don't cross feet",
    ],
    progressions: [
      "Slow lateral shuffle",
      "Moderate lateral shuffle",
      "Fast lateral shuffle",
      "Lateral shuffle with direction changes",
      "Lateral shuffle with reactive cues",
    ],
    safetyNotes: [
      "Start slowly",
      "Focus on form",
      "Don't cross feet",
      "Stop if balance is lost",
      "Proper warm-up essential",
    ],
  },

  // ============================================================================
  // EXPLOSIVE PLYOMETRIC EXERCISES (March Phase)
  // Reference: https://www.youtube.com/watch?v=4DB6910HGr4
  // ============================================================================

  "RFE Cycle Jumps": {
    category: "Explosive Plyometric",
    primaryMuscles: ["Quadriceps", "Glutes"],
    secondaryMuscles: ["Calves", "Core"],
    equipment: ["Plyo box or elevated surface"],
    difficulty: "advanced",
    reference: "https://www.youtube.com/watch?v=4DB6910HGr4",
    setup: "Rear Foot Elevated position on box, front foot on ground",
    execution: [
      "Place rear foot on elevated surface (box)",
      "Front foot on ground in lunge position",
      "Explosively cycle legs - jump and switch",
      "Land with opposite foot elevated",
      "Immediately repeat cycling motion",
      "Maintain explosive tempo",
    ],
    coaching: [
      "Explosive leg cycling motion",
      "Minimal ground contact time",
      "Full hip extension",
      "Maintain balance throughout",
      "Focus on speed and power",
    ],
    progressions: [
      "Slow RFE cycle jumps",
      "Moderate tempo RFE cycle jumps",
      "Fast RFE cycle jumps",
      "RFE cycle jumps with added load",
    ],
    safetyNotes: [
      "Start with low box height",
      "Master single-leg stability first",
      "Focus on landing mechanics",
      "Ensure adequate recovery between sets",
    ],
  },

  "Broad Jump + Pogo Hop": {
    category: "Explosive Plyometric",
    primaryMuscles: ["Quadriceps", "Glutes", "Calves"],
    secondaryMuscles: ["Core", "Hamstrings"],
    equipment: ["Open space"],
    difficulty: "advanced",
    reference: "https://www.youtube.com/watch?v=4DB6910HGr4",
    setup: "Feet shoulder-width apart, ready to jump",
    execution: [
      "Perform maximum broad jump forward",
      "Land on both feet simultaneously",
      "Immediately upon landing, perform 3 pogo hops",
      "Pogo hops: quick, explosive vertical jumps",
      "Minimal ground contact on pogo hops",
      "Maintain forward momentum",
    ],
    coaching: [
      "Maximum effort on broad jump",
      "Smooth transition to pogo hops",
      "Explosive pogo hop action",
      "Minimal ground contact time",
      "Maintain rhythm and power",
    ],
    progressions: [
      "Broad jump only",
      "Broad jump + 1 pogo hop",
      "Broad jump + 2 pogo hops",
      "Broad jump + 3 pogo hops",
      "Broad jump + 5 pogo hops",
    ],
    safetyNotes: [
      "Ensure adequate landing space",
      "Focus on landing mechanics",
      "Start with fewer pogo hops",
      "Maintain control throughout",
    ],
  },

  "MB Seated Hurdle Jump": {
    category: "Explosive Plyometric",
    primaryMuscles: ["Quadriceps", "Glutes", "Core"],
    secondaryMuscles: ["Calves", "Hip flexors"],
    equipment: ["Medicine ball", "Hurdle or box"],
    difficulty: "advanced",
    reference: "https://www.youtube.com/watch?v=4DB6910HGr4",
    setup: "Seated position with medicine ball, hurdle in front",
    execution: [
      "Sit on ground with medicine ball",
      "Hurdle positioned in front of you",
      "Explosively jump over hurdle from seated position",
      "Land on both feet on other side",
      "Return to seated position",
      "Repeat explosively",
    ],
    coaching: [
      "Explosive jump from seated position",
      "Use arms and medicine ball for momentum",
      "Clear hurdle completely",
      "Land softly",
      "Maintain control",
    ],
    progressions: [
      "Seated jump without hurdle",
      "Seated jump over low hurdle",
      "Seated jump over medium hurdle",
      "Seated jump over high hurdle",
      "Seated jump with heavier medicine ball",
    ],
    safetyNotes: [
      "Start with low hurdle",
      "Ensure safe landing area",
      "Focus on form over height",
      "Use appropriate medicine ball weight",
    ],
  },

  "Split Squat Rack Iso Pulls + Drop Catch": {
    category: "Explosive Plyometric",
    primaryMuscles: ["Quadriceps", "Glutes", "Hamstrings"],
    secondaryMuscles: ["Core", "Calves"],
    equipment: ["Rack or support", "Optional: weights"],
    difficulty: "advanced",
    reference: "https://www.youtube.com/watch?v=4DB6910HGr4",
    setup: "Split squat position in rack, isometric hold",
    execution: [
      "Assume split squat position",
      "Hold isometric position (3-5 seconds)",
      "Partner or mechanism 'pulls' you out of position",
      "Drop from position",
      "Catch landing explosively",
      "Absorb force and stabilize",
      "Return to starting position",
    ],
    coaching: [
      "Strong isometric hold",
      "React quickly to pull",
      "Absorb landing force",
      "Explosive catch and stabilization",
      "Maintain proper split squat form",
    ],
    progressions: [
      "Split squat iso holds only",
      "Light pull from iso",
      "Moderate pull from iso",
      "Strong pull from iso",
      "Pull with added load",
    ],
    safetyNotes: [
      "Ensure safe landing surface",
      "Start with light pulls",
      "Focus on landing mechanics",
      "Have spotter or safe mechanism",
      "Master isometric hold first",
    ],
  },

  "Broad Jumps Consecutive": {
    category: "Explosive Plyometric",
    primaryMuscles: ["Quadriceps", "Glutes", "Calves"],
    secondaryMuscles: ["Core", "Hamstrings"],
    equipment: ["Open space"],
    difficulty: "advanced",
    reference: "https://www.youtube.com/watch?v=4DB6910HGr4",
    setup: "Feet shoulder-width apart, ready for continuous jumps",
    execution: [
      "Perform broad jump forward",
      "Land and immediately jump again",
      "Continue for 6 consecutive jumps",
      "Minimal ground contact between jumps",
      "Maintain forward momentum",
      "Each jump should be explosive",
    ],
    coaching: [
      "Continuous explosive action",
      "Minimal ground contact",
      "Maintain rhythm",
      "Each jump maximum effort",
      "Land and immediately rebound",
    ],
    progressions: [
      "3 consecutive broad jumps",
      "4 consecutive broad jumps",
      "5 consecutive broad jumps",
      "6 consecutive broad jumps",
      "8-10 consecutive broad jumps",
    ],
    safetyNotes: [
      "Ensure adequate space",
      "Focus on landing mechanics",
      "Start with fewer jumps",
      "Maintain control throughout",
      "Stop if form breaks down",
    ],
  },

  "Lower Leg Yielding ISOs": {
    category: "Isometric",
    primaryMuscles: ["Calves", "Tibialis anterior", "Ankle stabilizers"],
    secondaryMuscles: ["Core"],
    equipment: ["None", "Optional: wall or support"],
    difficulty: "intermediate",
    reference: "https://www.youtube.com/watch?v=4DB6910HGr4",
    setup: "Various positions targeting calf and ankle",
    execution: [
      "Calf/ankle isometric holds at various angles",
      "Hold position for 30-45 seconds",
      "Multiple angles: dorsiflexed, neutral, plantarflexed",
      "Single-leg and bilateral options",
      "Maintain tension throughout hold",
    ],
    coaching: [
      "Hold various ankle positions",
      "Maintain constant tension",
      "Focus on calf and tibialis",
      "Breathe normally",
      "Feel the burn",
    ],
    progressions: [
      "30 second holds",
      "45 second holds",
      "60 second holds",
      "Single-leg holds",
      "Holds with added resistance",
    ],
    safetyNotes: [
      "Don't hold breath",
      "Stop if cramping occurs",
      "Focus on proper positioning",
      "Gradually increase hold time",
    ],
  },

  "Band Pin Squats": {
    category: "Strength",
    primaryMuscles: ["Quadriceps", "Glutes"],
    secondaryMuscles: ["Core", "Calves"],
    equipment: ["Squat rack", "Resistance bands", "Pins"],
    difficulty: "advanced",
    reference: "https://www.youtube.com/watch?v=4DB6910HGr4",
    setup: "Bands attached to pins in rack, squat against resistance",
    execution: [
      "Attach resistance bands to pins in squat rack",
      "Position bands at appropriate height",
      "Stand in squat position with bands providing resistance",
      "Perform squat against band resistance",
      "Bands add variable resistance throughout movement",
      "Focus on explosive concentric phase",
    ],
    coaching: [
      "Set bands at proper height",
      "Feel resistance throughout movement",
      "Explosive upward drive",
      "Control descent",
      "Full range of motion",
    ],
    progressions: [
      "Light band resistance",
      "Moderate band resistance",
      "Heavy band resistance",
      "Band resistance + added weight",
      "Multiple bands for increased resistance",
    ],
    safetyNotes: [
      "Ensure bands are securely attached",
      "Check band integrity before use",
      "Start with light resistance",
      "Maintain proper squat form",
      "Have spotter if using heavy resistance",
    ],
  },

  "Slam Ball Depth Granny Throw + Jump": {
    category: "Explosive Plyometric",
    primaryMuscles: ["Full body", "Core", "Quadriceps", "Glutes"],
    secondaryMuscles: ["Shoulders", "Calves"],
    equipment: ["Slam ball", "Elevated platform"],
    difficulty: "advanced",
    reference: "https://www.youtube.com/watch?v=4DB6910HGr4",
    setup: "Stand on elevated platform with slam ball",
    execution: [
      "Stand on elevated platform (12-18 inches)",
      "Hold slam ball in front of you",
      "Step off platform (depth drop)",
      "Upon landing, immediately perform underhand granny throw",
      "Throw ball forward/upward explosively",
      "Immediately after throw, perform explosive jump",
      "Land and stabilize",
    ],
    coaching: [
      "Smooth depth drop",
      "Explosive underhand throw",
      "Immediate jump after throw",
      "Maintain rhythm and power",
      "Full body coordination",
    ],
    progressions: [
      "Depth drop only",
      "Depth drop + throw",
      "Depth drop + throw + jump",
      "Increased platform height",
      "Heavier slam ball",
    ],
    safetyNotes: [
      "Start with low platform",
      "Ensure safe landing area",
      "Use appropriate ball weight",
      "Focus on landing mechanics",
      "Have clear throwing area",
    ],
  },

  // ============================================================================
  // EXPLOSIVE HAMSTRING DRILLS (March Phase - Mandatory Tue/Thu)
  // Reference: https://www.youtube.com/shorts/BYS_Rbk3bMU
  // ============================================================================

  "SL Bridge Hip Switch": {
    category: "Explosive Hamstring",
    primaryMuscles: ["Hamstrings", "Glutes"],
    secondaryMuscles: ["Core", "Hip stabilizers"],
    equipment: ["Mat or surface"],
    difficulty: "advanced",
    reference: "https://www.youtube.com/shorts/BYS_Rbk3bMU",
    setup: "Single-leg bridge position",
    execution: [
      "Lie on back, one leg extended",
      "Raise hips into single-leg bridge",
      "Rapidly switch legs while maintaining bridge",
      "Alternate legs explosively",
      "Maintain hip height throughout",
      "Rapid cycling motion",
    ],
    coaching: [
      "Rapid hip switching motion",
      "Maintain bridge height",
      "Explosive leg cycling",
      "Keep core engaged",
      "Smooth transitions",
    ],
    progressions: [
      "Slow single-leg bridge",
      "Moderate tempo hip switch",
      "Fast hip switch",
      "Extended duration hip switch",
      "Hip switch with added resistance",
    ],
    safetyNotes: [
      "Start with slow tempo",
      "Focus on form over speed",
      "Don't let hips drop",
      "Stop if hamstring cramps",
      "Maintain proper alignment",
    ],
  },

  "Hamstring Tantrums": {
    category: "Explosive Hamstring",
    primaryMuscles: ["Hamstrings", "Glutes"],
    secondaryMuscles: ["Core"],
    equipment: ["Exercise ball", "Elastic band", "Mat"],
    difficulty: "advanced",
    reference: "https://www.youtube.com/shorts/BYS_Rbk3bMU",
    setup: "On back, ball under feet, elastic band providing resistance",
    execution: [
      "Lie on back with exercise ball under feet",
      "Elastic band attached to feet or ball",
      "Rapidly cycle legs (like tantrum motion)",
      "Pull feet toward glutes explosively",
      "Extend legs against band resistance",
      "Maintain rapid cycling tempo",
      "Feel hamstring burn",
    ],
    coaching: [
      "Rapid leg cycling",
      "Explosive hamstring contraction",
      "Feel the burn",
      "Maintain tempo",
      "Full range of motion",
    ],
    progressions: [
      "Slow leg cycling",
      "Moderate tempo",
      "Fast tempo",
      "Extended duration",
      "Increased band resistance",
    ],
    safetyNotes: [
      "Start with light band resistance",
      "Focus on form",
      "Stop if hamstring cramps",
      "Ensure ball is secure",
      "Gradually increase tempo",
    ],
  },

  "SL DB Swings": {
    category: "Explosive Hamstring",
    primaryMuscles: ["Hamstrings", "Glutes"],
    secondaryMuscles: ["Core", "Shoulders"],
    equipment: ["Dumbbell or Kettlebell"],
    difficulty: "advanced",
    reference: "https://www.youtube.com/shorts/BYS_Rbk3bMU",
    setup: "Single-leg stance, holding dumbbell/kettlebell",
    execution: [
      "Stand on one leg",
      "Hold dumbbell/kettlebell with both hands",
      "Hinge at hips (RDL position)",
      "Explosively swing weight forward and up",
      "Drive through hamstring and glute",
      "Return to starting position",
      "Maintain single-leg balance",
      "Repeat on same leg, then switch",
    ],
    coaching: [
      "Single-leg stability",
      "Explosive hip drive",
      "Hamstring and glute focus",
      "Maintain balance",
      "Full hip extension",
    ],
    progressions: [
      "Light weight single-leg swings",
      "Moderate weight",
      "Heavy weight",
      "Increased reps",
      "Single-leg swings with tempo",
    ],
    safetyNotes: [
      "Start with light weight",
      "Master single-leg balance first",
      "Focus on form",
      "Don't let knee cave inward",
      "Maintain proper hinge pattern",
    ],
  },

  "Sprinting with Resistance (Hamstring Focus)": {
    category: "Explosive Hamstring",
    primaryMuscles: ["Hamstrings", "Glutes"],
    secondaryMuscles: ["Quadriceps", "Calves", "Core"],
    equipment: ["Resistance band", "Sled", "Harness"],
    difficulty: "advanced",
    reference: "https://www.youtube.com/shorts/BYS_Rbk3bMU",
    setup: "Band around waist or sled harness",
    execution: [
      "Attach resistance band to fixed point or use sled",
      "Band around waist or sled harness",
      "Sprint forward against resistance",
      "Focus on hamstring drive",
      "Feel posterior chain engagement",
      "Maintain sprint form",
      "Explosive leg cycling",
    ],
    coaching: [
      "Hamstring drive focus",
      "Posterior chain engagement",
      "Maintain sprint mechanics",
      "Explosive leg action",
      "Full hip extension",
    ],
    progressions: [
      "Light resistance",
      "Moderate resistance",
      "Heavy resistance",
      "Increased distance",
      "Resistance + speed focus",
    ],
    safetyNotes: [
      "Start with light resistance",
      "Ensure secure attachment",
      "Focus on form over speed",
      "Adequate warm-up essential",
      "Check equipment integrity",
    ],
  },

  "Nordic Curl Explosive": {
    category: "Explosive Hamstring",
    primaryMuscles: ["Hamstrings"],
    secondaryMuscles: ["Glutes", "Core"],
    equipment: ["Partner", "Kneeling pad", "Optional: resistance band"],
    difficulty: "advanced",
    reference: "https://www.youtube.com/shorts/BYS_Rbk3bMU",
    setup: "Kneeling position, partner holding ankles",
    execution: [
      "Kneel on pad, partner holding ankles",
      "Start in upright position",
      "Lower body slowly (5 seconds eccentric)",
      "At bottom, explosively pull body back up",
      "Return to starting position",
      "Focus on explosive concentric phase",
      "Slow controlled eccentric",
    ],
    coaching: [
      "Explosive up phase",
      "Slow 5-second down phase",
      "Hamstring focus",
      "Full range of motion",
      "Control throughout",
    ],
    progressions: [
      "Assisted Nordic curls",
      "Light band assistance",
      "Bodyweight explosive",
      "Increased reps",
      "Added load (weighted vest)",
    ],
    safetyNotes: [
      "Start with assistance",
      "Master slow eccentric first",
      "Focus on hamstring strength",
      "Have spotter",
      "Use proper padding",
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
*/
