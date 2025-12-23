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
