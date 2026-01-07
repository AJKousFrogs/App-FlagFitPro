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
          warmup:
            "QB Enhanced Warm-Up (30 min) - Includes shoulder complex activation",

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
                  notes:
                    "CRITICAL - 30% of throwing power. Elbow stays at side",
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
          equipment: [
            "Barbell/DBs",
            "bands",
            "medicine ball",
            "elevated surface",
          ],
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
                  notes:
                    "MANDATORY post-throwing. Prevents posterior shoulder tightness",
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
                {
                  name: "World's Greatest Stretch",
                  sets: 2,
                  reps: "5 each side",
                },
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
                  notes:
                    "Building endurance, NOT power. Maintain mechanics under fatigue",
                },
                coolDown: "Light tosses (5 throws)",
              },
              notes:
                "Week 1 baseline: 50-80 total throws. Progressive overload in coming weeks",
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
                    {
                      name: "Wall Drills",
                      sets: 4,
                      duration: "30s each leg",
                      rest: "90s",
                    },
                    {
                      name: "Resistance Band Sprint Simulation",
                      sets: 6,
                      duration: "10s",
                      rest: "2 min",
                    },
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
                    {
                      name: "Footwork patterns",
                      throws: "5-8",
                      notes: "Various drops",
                    },
                    {
                      name: "Accuracy targets",
                      throws: "5-8",
                      notes: "Hit specific targets",
                    },
                    {
                      name: "Release variety",
                      throws: "5-8",
                      notes: "Different arm angles",
                    },
                  ],
                },
                {
                  phase: "Cool-down",
                  throws: "3-5 easy",
                },
              ],
            },
          ],
          equipment: [
            "Track or wall space",
            "bands",
            "football",
            "targets/cones",
          ],
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
        focus:
          "Foundation building, movement quality, throwing mechanics introduction",
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
                {
                  name: "Wall Drills",
                  sets: 4,
                  duration: "25s each leg",
                  rest: "60s",
                },
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
          equipment: [
            "Track or treadmill",
            "bands",
            "foam roller",
            "football",
            "light DBs",
          ],
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
                {
                  name: "World's Greatest Stretch",
                  sets: 2,
                  reps: "5 each side",
                },
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
                  notes:
                    "Check hip flexor tightness. Thigh should be below horizontal",
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
          equipment: [
            "Yoga mat",
            "foam roller",
            "DBs",
            "bands",
            "cable machine",
            "couch/bench",
          ],
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
                  drills: [
                    "3-step drop",
                    "5-step drop",
                    "Rollout",
                    "Sprint out",
                  ],
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
                {
                  name: "Box Jumps",
                  sets: 4,
                  reps: 4,
                  rest: "2 min",
                  boxHeight: "15 inches",
                },
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
                  notes:
                    "Focus on maintaining mechanics under increasing fatigue",
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
                    {
                      name: "Wall Drills",
                      sets: 5,
                      duration: "30s each leg",
                      rest: "90s",
                    },
                    {
                      name: "Resistance Band Sprints",
                      sets: 8,
                      duration: "15s",
                      rest: "2 min",
                    },
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
                    {
                      name: "Footwork patterns",
                      throws: "8-10",
                      notes: "Various drops + throws",
                    },
                    {
                      name: "Moving pocket throws",
                      throws: "5-8",
                      notes: "Slide in pocket + throw",
                    },
                    {
                      name: "Accuracy challenge",
                      throws: "8-10",
                      notes: "Hit 8/10 targets",
                    },
                  ],
                },
                {
                  phase: "Cool-down",
                  throws: "3-5 easy",
                },
              ],
            },
          ],
          equipment: [
            "Track or wall space",
            "bands",
            "football",
            "targets/cones",
          ],
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
        focus:
          "Volume progression, throwing endurance building, arm care emphasis",
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
                {
                  name: "Medicine Ball Rotational Throws",
                  sets: 3,
                  reps: "10 each side",
                  rest: "60s",
                  load: "10 lbs",
                },
                {
                  name: "Anti-Rotation Press (Pallof Press)",
                  sets: 3,
                  reps: "10 each side",
                  rest: "60s",
                },
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
                {
                  distance: "5-15 yards",
                  throws: "10-12",
                  intensity: "50-60%",
                },
                {
                  distance: "20-30 yards",
                  throws: "8-10",
                  intensity: "70-75%",
                },
                { notes: "Increased distance from previous weeks" },
              ],
            },
          ],
          equipment: [
            "Track or treadmill",
            "bands",
            "foam roller",
            "football",
            "light DBs",
          ],
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
                  name: "Couch stretch",
                  sets: 4,
                  duration: "2 min each",
                },
                {
                  name: "Standing quad stretch",
                  sets: 3,
                  duration: "75s each",
                },
                {
                  name: "Hip Flexor Complex",
                  duration: "15 min",
                },
                {
                  name: "Pigeon pose",
                  sets: 3,
                  duration: "2 min each",
                },
                {
                  name: "90/90 stretch",
                  sets: 3,
                  duration: "75s each",
                },
                {
                  name: "90/90 flow",
                  reps: "20 transitions",
                },
                {
                  name: "Hip Rotation Complex",
                  duration: "12 min",
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
          ],
          equipment: [
            "Yoga mat",
            "foam roller",
            "DBs",
            "bands",
            "cable machine",
            "couch/bench",
          ],
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
                  drills: [
                    "3-step",
                    "5-step",
                    "7-step",
                    "Bootleg",
                    "Sprint out",
                  ],
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
          ],
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
                  notes:
                    "Peak volume for Foundation phase. Maintain mechanics under extended fatigue",
                },
                coolDown: "Light tosses (5-8 throws)",
              },
              notes:
                "Week 3 peak: 80-100 total throws. Preparing for tournament endurance",
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
          ],
          equipment: [
            "Squat rack",
            "box",
            "medicine ball",
            "football",
            "bands",
          ],
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
                    {
                      name: "Wall Sprint Drills",
                      sets: 5,
                      duration: "20s max",
                      rest: "2 min",
                    },
                    {
                      name: "Resistance Band Sprints",
                      sets: 10,
                      duration: "15s",
                      rest: "2 min",
                    },
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
                    {
                      name: "Quick game",
                      throws: "8-10",
                      notes: "3-step drops, quick release",
                    },
                    {
                      name: "Intermediate routes",
                      throws: "8-10",
                      notes: "5-step, 15-20 yards",
                    },
                    {
                      name: "Pressure situations",
                      throws: "6-8",
                      notes: "Throw under simulated pressure",
                    },
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
                {
                  name: "Visualization for Week 4 assessments",
                  duration: "15 min",
                },
                {
                  name: "Review Foundation phase progress",
                  notes: "Reflect on improvements",
                },
              ],
            },
          ],
        },
      },
      weekSummary: {
        totalThrows: "120-150",
        lowerBodySessions: 4,
        qbSpecificSessions: 6,
        focus:
          "Peak Foundation loads, throwing volume peak, comprehensive mobility work",
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
          equipment: [
            "Barbell",
            "DBs",
            "bands",
            "medicine ball",
            "measuring tape",
            "timer",
          ],
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
                      notes:
                        "Video analysis - dorsiflexion, knee drive, arm action",
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
                  protocol:
                    "Lie supine, pull one knee to chest, assess other leg",
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
          equipment: [
            "Cones",
            "stopwatch/timing gates",
            "measuring tape",
            "goniometer",
          ],
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
                  protocol:
                    "Progressive warm-up, then max velocity throws from pocket",
                  distance: "15 yards",
                  notes:
                    "Measure peak velocity with radar gun if available. Record best 3",
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
                  drills: [
                    "3-step drops",
                    "5-step drops",
                    "7-step drops",
                    "Rollouts",
                  ],
                  notes: "Video analysis - assess mechanics quality",
                },
                {
                  name: "Light cool-down",
                  throws: "5-8 easy",
                },
              ],
              notes:
                "Baseline throwing assessment - compare to Week 8 and Week 14",
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
                notes:
                  "Assess mechanics breakdown under moderate fatigue. Track accuracy decline",
              },
              assessment:
                "Record when mechanics begin to break down, accuracy percentage",
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
          ],
          equipment: [
            "Football",
            "targets",
            "radar gun (optional)",
            "video camera",
          ],
          notes:
            "Foundation throwing baseline - record all metrics for future comparison",
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
                {
                  name: "Easy bike or walk",
                  duration: "20 min",
                  intensity: "Very light",
                },
                { name: "Foam rolling", duration: "15 min" },
              ],
            },
          ],
          notes:
            "Reflect on Foundation phase progress. Review assessment results",
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
                {
                  distance: "5-15 yards",
                  throws: "15-25",
                  intensity: "40-50%",
                },
                { notes: "Very light, focus on mechanics only" },
              ],
            },
          ],
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
                {
                  notes:
                    "Optional. If arm feels good, light throwing. Otherwise rest",
                },
              ],
            },
            {
              title: "Block 4: Core Maintenance",
              duration: 10,
              exercises: [
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
                {
                  name: "Review Foundation phase achievements",
                  duration: "10 min",
                },
                {
                  name: "Set goals for Strength phase (Weeks 5-8)",
                  duration: "10 min",
                },
                {
                  name: "Visualization for increased throwing volume",
                  duration: "10 min",
                },
              ],
            },
          ],
          notes:
            "Prepare for Strength Development phase. Review all assessment results.",
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
        focus:
          "Baseline assessment, deload for recovery, Foundation phase completion",
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
          mobility:
            "Shoulder ROM improved, hip flexors loosened (critical for velocity)",
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

    week5: {
      weekNumber: 5,
      dateRange: "December 29, 2025 - January 4, 2026",
      phase: "Strength Development",
      focus:
        "Maximum strength building + throwing volume increase + long toss introduction",
      throwingVolume: "150-180 throws",
      days: {
        monday: {
          title: "QB Strength Day 1 - Maximum Strength + Arm Strength",
          type: "strength",
          duration: 105,
          warmup: "QB Enhanced 30-min warm-up",
          dualTrack: true,

          blocks: [
            {
              title: "Block 1: Lower Body - Maximal Isometric Strength",
              track: "Lower Body (Same as WR/DB)",
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
              title: "Block 2: Lower Body - Heavy Posterior Chain",
              track: "Lower Body (Same as WR/DB)",
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
              title: "Block 3: QB-Specific - Advanced Arm Strength",
              track: "QB-Specific Upper Body",
              duration: 25,
              qbSpecific: true,
              exercises: [
                {
                  name: "Single-Arm DB Rows (Lats)",
                  sets: 4,
                  reps: "8-10 each",
                  rest: "2 min",
                  load: "Heavy DBs",
                  notes: "Lats = 18% of throwing power. Explosive concentric",
                },
                {
                  name: "Band External Rotation (Rotator Cuff)",
                  sets: 4,
                  reps: "12-15 each",
                  rest: "90s",
                  resistance: "Medium-heavy band",
                  notes:
                    "Rotator cuff strength correlates with velocity (r=0.72)",
                },
                {
                  name: "Tricep Extensions (Overhead)",
                  sets: 4,
                  reps: "10-12",
                  rest: "90s",
                  load: "Moderate DB/cable",
                  notes: "Triceps = 23% of ball velocity",
                },
                {
                  name: "Bicep Curls (Deceleration)",
                  sets: 3,
                  reps: "10-12",
                  rest: "90s",
                  notes: "Eccentric arm deceleration after release",
                },
              ],
            },
            {
              title:
                "Block 4: QB-Specific - Shoulder Mobility + Hip Flexor Work",
              track: "QB-Specific Mobility",
              duration: 20,
              qbSpecific: true,
              exercises: [
                {
                  name: "Sleeper Stretch (Shoulder Internal Rotation)",
                  sets: 3,
                  duration: "60s each",
                  rest: "30s",
                  notes: "Critical for shoulder health and ROM",
                },
                {
                  name: "Couch Stretch (Hip Flexor Flexibility)",
                  sets: 3,
                  duration: "90s each",
                  rest: "45s",
                  notes: "Tight hip flexors reduce velocity 15-20%",
                },
                {
                  name: "Thoracic Extension (Foam Roller)",
                  sets: 2,
                  duration: "3 min",
                  notes: "Thoracic extension adds 8-12 mph velocity",
                },
              ],
            },
          ],
          postSessionProtocol: "QB Daily Arm Care (15-20 min)",
          equipment: ["Barbell/DBs", "squat rack", "bands", "foam roller"],
        },

        tuesday: {
          title: "QB Throwing Day 1 - Long Toss Introduction + Velocity Work",
          type: "throwing",
          duration: 90,
          warmup:
            "QB Enhanced warm-up (30 min) + Progressive throwing warm-up (35+ throws)",
          throwingVolume: "70-90 throws",

          blocks: [
            {
              title: "Block 1: Progressive Throwing Warm-Up",
              track: "QB-Specific Throwing",
              duration: 20,
              qbSpecific: true,
              exercises: [
                {
                  name: "Progressive Throwing Warm-Up",
                  protocol:
                    "5y → 10y → 15y → 20y → 30y → 40y (35-40 throws total)",
                  notes: "Standard QB throwing warm-up protocol",
                  throws: "35-40",
                },
              ],
            },
            {
              title: "Block 2: Long Toss Introduction (Velocity Development)",
              track: "QB-Specific Throwing",
              duration: 30,
              qbSpecific: true,
              exercises: [
                {
                  name: "Long Toss Progression",
                  protocol: [
                    "40y: 5 throws (crow hop, full mechanics)",
                    "45y: 5 throws (increase arc slightly)",
                    "50y: 5 throws (max intent, on a line)",
                    "45y: 3 throws (compress back down)",
                    "40y: 3 throws (clean mechanics)",
                  ],
                  throws: "21 throws",
                  rest: "45-60s between throws at 50y",
                  notes:
                    "INTRODUCTION to long toss. Builds arm strength + velocity. Keep mechanics clean",
                },
              ],
            },
            {
              title: "Block 3: Throwing Mechanics Work",
              track: "QB-Specific Throwing",
              duration: 20,
              qbSpecific: true,
              exercises: [
                {
                  name: "Shadow Throwing + Step-Through Drill",
                  sets: 3,
                  reps: "10 each",
                  notes: "Perfect mechanics, no ball",
                },
                {
                  name: "Throwing Mechanics at 20y",
                  throws: "15-20",
                  focus:
                    "Hip rotation, shoulder external rotation, follow-through",
                  rest: "30s between throws",
                },
              ],
            },
          ],
          totalThrows: "70-90 throws",
          postSessionProtocol: "QB Daily Arm Care (15-20 min)",
          equipment: ["Footballs", "partner or net", "measuring tape"],
        },

        wednesday: {
          title: "QB Active Recovery + Enhanced Mobility",
          type: "recovery",
          duration: 75,
          warmup: "Light movement (10 min)",
          dualTrack: true,

          blocks: [
            {
              title: "Block 1: Lower Body Mobility",
              track: "Universal Recovery",
              duration: 25,
              exercises: [
                { name: "Hip mobility circuit", duration: "15 min" },
                { name: "Ankle/calf mobility", duration: "10 min" },
              ],
            },
            {
              title: "Block 2: QB-Specific Shoulder + Hip Work",
              track: "QB-Specific Mobility",
              duration: 30,
              qbSpecific: true,
              exercises: [
                {
                  name: "Comprehensive Shoulder Mobility Circuit",
                  duration: "15 min",
                  focus:
                    "Sleeper stretch, doorway pec stretch, wall slides, band pull-aparts",
                  notes: "Critical for throwing shoulder health",
                },
                {
                  name: "Hip Flexor Flexibility Work",
                  duration: "10 min",
                  exercises: [
                    "Couch stretch 2×90s each",
                    "Kneeling hip flexor stretch 2×60s each",
                  ],
                  notes: "Prevents velocity loss",
                },
                {
                  name: "Thoracic Mobility + Extension",
                  duration: "5 min",
                  notes: "Foam roller thoracic extensions",
                },
              ],
            },
            {
              title: "Block 3: Light Activation + Recovery",
              track: "Universal Recovery",
              duration: 15,
              exercises: [
                { name: "Glute activation circuit", rounds: 2 },
                { name: "Copenhagen Plank", sets: 2, duration: "30s each" },
                { name: "Foam rolling (full body)", duration: "15 min" },
              ],
            },
          ],
          equipment: ["Yoga mat", "foam roller", "bands"],
        },

        thursday: {
          title: "QB Strength Day 2 - Explosive Power + Arm Endurance",
          type: "strength + throwing",
          duration: 110,
          warmup: "QB Enhanced warm-up (30 min) + Plyometric prep (10 min)",
          dualTrack: true,
          throwingVolume: "40-50 throws",

          blocks: [
            {
              title: "Block 1: Lower Body - Complex Training",
              track: "Lower Body (Same as WR/DB)",
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
              title: "Block 2: Lower Body - Advanced Plyometrics",
              track: "Lower Body (Same as WR/DB)",
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
                },
              ],
            },
            {
              title: "Block 3: QB-Specific - Throwing Arm Endurance",
              track: "QB-Specific Throwing",
              duration: 25,
              qbSpecific: true,
              exercises: [
                {
                  name: "Progressive Throwing Warm-Up",
                  throws: "20-25",
                  protocol: "5y → 40y progression",
                },
                {
                  name: "Ball Toss Endurance Drill (Lightweight)",
                  throws: "20-25",
                  protocol:
                    "Continuous throwing at 15-20y, focus on mechanics maintenance",
                  rest: "Minimal rest between throws",
                  notes: "Building throwing endurance toward 320-throw goal",
                },
              ],
            },
          ],
          totalThrows: "40-50 throws",
          postSessionProtocol: "QB Daily Arm Care (15-20 min)",
          equipment: ["Barbell/DBs", "plyo boxes", "footballs"],
        },

        friday: {
          title: "QB Throwing Day 2 - Volume Work + Accuracy",
          type: "throwing",
          duration: 85,
          warmup: "QB Enhanced warm-up (30 min) + Progressive throwing warm-up",
          throwingVolume: "40-50 throws",

          blocks: [
            {
              title: "Block 1: Progressive Throwing Warm-Up",
              track: "QB-Specific Throwing",
              duration: 20,
              qbSpecific: true,
              exercises: [
                {
                  name: "Progressive Throwing Warm-Up",
                  protocol: "Standard 5y → 40y progression",
                  throws: "35-40",
                },
              ],
            },
            {
              title: "Block 2: Accuracy + Route Work",
              track: "QB-Specific Throwing",
              duration: 30,
              qbSpecific: true,
              exercises: [
                {
                  name: "Stationary Accuracy Work",
                  throws: "15-20",
                  distances: [
                    "15y: 10 throws to targets",
                    "25y: 5-10 throws to targets",
                  ],
                  notes: "Track accuracy percentage. Goal: 85%+",
                },
                {
                  name: "Movement-Based Throws",
                  throws: "15-20",
                  protocol: "Bootleg, rollout, sprint-out throws",
                  notes: "Game-specific mechanics",
                },
              ],
            },
            {
              title: "Block 3: Light Speed/Agility Work",
              track: "Lower Body Light Work",
              duration: 20,
              exercises: [
                { name: "Light sprint drills", duration: "10 min" },
                { name: "Agility ladder work", duration: "10 min" },
              ],
            },
          ],
          totalThrows: "65-80 throws",
          postSessionProtocol: "QB Daily Arm Care (15-20 min)",
          equipment: ["Footballs", "targets", "agility ladder"],
        },

        saturday: {
          title: "QB Off Day - Shoulder/Hip Maintenance",
          type: "recovery",
          duration: 45,
          warmup: "Light movement (5-10 min)",

          blocks: [
            {
              title: "Block 1: QB-Specific Mobility + Arm Care",
              track: "QB-Specific Mobility",
              duration: 35,
              qbSpecific: true,
              exercises: [
                {
                  name: "Comprehensive Shoulder Mobility",
                  duration: "15 min",
                  exercises: [
                    "Sleeper stretch",
                    "Doorway pec stretch",
                    "Wall slides",
                    "Band pull-aparts",
                  ],
                },
                {
                  name: "Rotator Cuff Maintenance",
                  duration: "10 min",
                  exercises: [
                    "Band external rotation 2×15 each",
                    "I-Y-T raises 2×10 each",
                  ],
                },
                {
                  name: "Hip Flexor Work",
                  duration: "10 min",
                  exercises: [
                    "Couch stretch 2×90s each",
                    "Thoracic extension work",
                  ],
                },
              ],
            },
          ],
          equipment: ["Bands", "foam roller", "yoga mat"],
        },

        sunday: {
          title: "QB Complete Recovery",
          type: "recovery",
          duration: 75,
          protocol:
            "QB Sunday Recovery Protocol (45 min universal + 30 min QB-specific)",
          activities: [
            { name: "Lower body chain stretching", duration: "25 min" },
            { name: "Foam rolling (full body)", duration: "20 min" },
            { name: "Light walk or bike", duration: "20 min" },
            {
              name: "QB shoulder + hip mobility work",
              duration: "20 min",
              qbSpecific: true,
            },
            { name: "Visualization", duration: "10 min" },
          ],
        },
      },
      weekSummary: {
        lowerBodySessions: 2,
        throwingSessions: 2,
        totalThrows: "150-180 throws",
        focus:
          "Maximum strength (40% BW squats), long toss introduction, throwing volume increase, arm strength progression",
        qbSpecificNotes:
          "Long toss introduced at 40-50y. Arm endurance work begins. Shoulder/hip mobility emphasized daily.",
      },
    },

    week6: {
      weekNumber: 6,
      dateRange: "January 5-11, 2026",
      phase: "Strength Development",
      focus:
        "Maximum strength maintenance + throwing volume progression + long toss expansion",
      throwingVolume: "180-220 throws",
      days: {
        monday: {
          title: "QB Strength Day 1 - Maximum Quad Strength + Arm Strength",
          type: "strength",
          duration: 105,
          warmup: "QB Enhanced 30-min warm-up",
          dualTrack: true,

          blocks: [
            {
              title: "Block 1: Lower Body - Maximal Isometric Strength",
              track: "Lower Body (Same as WR/DB)",
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
                },
                {
                  name: "Isometric Split Squat Holds",
                  sets: 3,
                  duration: "6s each leg",
                  rest: "2.5 min",
                },
              ],
            },
            {
              title: "Block 2: Lower Body - Maximum Quad Strength",
              track: "Lower Body (Same as WR/DB)",
              duration: 25,
              exercises: [
                {
                  name: "Back Squats",
                  sets: 5,
                  reps: 5,
                  rest: "3 min",
                  load: "40% BW (max safe load)",
                },
                {
                  name: "Bulgarian Split Squats",
                  sets: 5,
                  reps: "5-6 each",
                  rest: "2.5 min",
                  load: "Heavy DBs",
                },
                {
                  name: "Walking Lunges (Loaded)",
                  sets: 4,
                  reps: "8 each",
                  rest: "2 min",
                },
              ],
            },
            {
              title: "Block 3: QB-Specific - Enhanced Arm Strength",
              track: "QB-Specific Upper Body",
              duration: 28,
              qbSpecific: true,
              exercises: [
                {
                  name: "Single-Arm DB Rows",
                  sets: 4,
                  reps: "8-10 each",
                  rest: "2 min",
                  load: "Heavy DBs (progressive from Week 5)",
                  notes: "Lats = 18% of throwing power",
                },
                {
                  name: "Band External Rotation (Heavier Resistance)",
                  sets: 4,
                  reps: "15 each",
                  rest: "90s",
                  resistance: "Heavy band (progression)",
                  notes: "Primary velocity generator",
                },
                {
                  name: "Tricep Extensions",
                  sets: 4,
                  reps: "12 each",
                  rest: "90s",
                  load: "Moderate-heavy",
                },
                {
                  name: "Bicep Curls + Hammer Curls",
                  sets: 3,
                  reps: "10 each variation",
                  rest: "90s",
                  notes: "Arm deceleration strength",
                },
                {
                  name: "Medicine Ball Rotational Throws",
                  sets: 3,
                  reps: "8 each side",
                  rest: "2 min",
                  notes: "Core rotational power for throwing",
                },
              ],
            },
            {
              title: "Block 4: QB-Specific - Shoulder/Hip Mobility",
              track: "QB-Specific Mobility",
              duration: 18,
              qbSpecific: true,
              exercises: [
                { name: "Sleeper Stretch", sets: 3, duration: "60s each" },
                { name: "Couch Stretch", sets: 3, duration: "90s each" },
                { name: "Thoracic Extension Work", duration: "5 min" },
              ],
            },
          ],
          postSessionProtocol: "QB Daily Arm Care (15-20 min)",
          equipment: [
            "Barbell/DBs",
            "squat rack",
            "bands",
            "medicine ball",
            "foam roller",
          ],
        },

        tuesday: {
          title: "QB Throwing Day 1 - Long Toss Progression + Velocity",
          type: "throwing",
          duration: 95,
          warmup: "QB Enhanced warm-up (30 min) + Progressive throwing warm-up",
          throwingVolume: "90-110 throws",

          blocks: [
            {
              title: "Block 1: Progressive Throwing Warm-Up",
              track: "QB-Specific Throwing",
              duration: 20,
              qbSpecific: true,
              exercises: [
                {
                  name: "Progressive Throwing Warm-Up",
                  protocol: "5y → 40y progression",
                  throws: "35-40",
                },
              ],
            },
            {
              title: "Block 2: Long Toss - Volume Increase",
              track: "QB-Specific Throwing",
              duration: 35,
              qbSpecific: true,
              exercises: [
                {
                  name: "Long Toss Progression (Extended)",
                  protocol: [
                    "40y: 5 throws",
                    "45y: 5 throws",
                    "50y: 6 throws (increase from Week 5)",
                    "55y: 4 throws (new distance - max intent)",
                    "50y: 4 throws (compress back)",
                    "45y: 3 throws",
                    "40y: 3 throws",
                  ],
                  throws: "30 throws",
                  rest: "60s between throws at 55y",
                  notes:
                    "Distance + volume increase. Building arm strength + velocity",
                },
              ],
            },
            {
              title: "Block 3: Throwing Mechanics + Accuracy",
              track: "QB-Specific Throwing",
              duration: 25,
              qbSpecific: true,
              exercises: [
                {
                  name: "Mechanics Work at 20-25y",
                  throws: "20-25",
                  focus: "Post-long toss mechanics cleanup. Perfect form",
                  rest: "30s between throws",
                },
              ],
            },
          ],
          totalThrows: "90-110 throws",
          postSessionProtocol: "QB Daily Arm Care (15-20 min)",
          equipment: ["Footballs", "partner", "measuring tape"],
        },

        wednesday: {
          title: "QB Active Recovery + Enhanced Mobility",
          type: "recovery",
          duration: 75,
          warmup: "Light movement (10 min)",
          dualTrack: true,

          blocks: [
            {
              title: "Block 1: Lower Body Mobility",
              track: "Universal Recovery",
              duration: 25,
              exercises: [
                { name: "Hip mobility circuit", duration: "15 min" },
                { name: "Ankle/calf mobility", duration: "10 min" },
              ],
            },
            {
              title: "Block 2: QB-Specific Shoulder + Hip Work",
              track: "QB-Specific Mobility",
              duration: 30,
              qbSpecific: true,
              exercises: [
                {
                  name: "Comprehensive Shoulder Mobility",
                  duration: "15 min",
                  notes: "Full shoulder complex work",
                },
                {
                  name: "Hip Flexor Flexibility",
                  duration: "10 min",
                  notes: "Extended couch stretch work",
                },
                {
                  name: "Thoracic Mobility",
                  duration: "5 min",
                },
              ],
            },
            {
              title: "Block 3: Light Activation + Recovery",
              track: "Universal Recovery",
              duration: 15,
              exercises: [
                { name: "Glute activation", rounds: 2 },
                { name: "Copenhagen Plank", sets: 2, duration: "35s each" },
                { name: "Foam rolling", duration: "15 min" },
              ],
            },
          ],
          equipment: ["Yoga mat", "foam roller", "bands"],
        },

        thursday: {
          title: "QB Strength Day 2 - Complex Training + Throwing Endurance",
          type: "strength + throwing",
          duration: 115,
          warmup: "QB Enhanced warm-up (30 min) + Plyometric prep",
          dualTrack: true,
          throwingVolume: "50-60 throws",

          blocks: [
            {
              title: "Block 1: Lower Body - Complex Training Variations",
              track: "Lower Body (Same as WR/DB)",
              duration: 30,
              exercises: [
                {
                  name: "Complex: Squat + Depth Jump",
                  sets: 5,
                  protocol: '3 squats @ 40% BW → 3 depth jumps (10" box)',
                  rest: "4 min",
                },
                {
                  name: "Complex: Bulgarian Split Squat + Single-Leg Bound",
                  sets: 4,
                  protocol: "5 reps each → 3 bounds each",
                  rest: "3 min",
                },
                {
                  name: "Complex: RDL + Broad Jump",
                  sets: 4,
                  protocol: "4 RDLs @ 35% BW → 4 broad jumps",
                  rest: "3 min",
                },
              ],
            },
            {
              title: "Block 2: Lower Body - Plyometric Volume",
              track: "Lower Body (Same as WR/DB)",
              duration: 30,
              exercises: [
                {
                  name: "Depth Jumps",
                  sets: 6,
                  reps: 5,
                  rest: "2.5 min",
                  boxHeight: "10 inches",
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
                },
              ],
            },
            {
              title: "Block 3: QB-Specific - Throwing Endurance Progression",
              track: "QB-Specific Throwing",
              duration: 30,
              qbSpecific: true,
              exercises: [
                {
                  name: "Progressive Throwing Warm-Up",
                  throws: "25",
                },
                {
                  name: "Ball Toss Endurance Drill",
                  throws: "25-35",
                  protocol: "Continuous throwing at 15-20y, mechanics focus",
                  notes:
                    "Volume increase from Week 5. Building toward 320-throw capacity",
                },
              ],
            },
          ],
          totalThrows: "50-60 throws",
          postSessionProtocol: "QB Daily Arm Care (15-20 min)",
          equipment: ["Barbell/DBs", "plyo boxes", "footballs"],
        },

        friday: {
          title: "QB Throwing Day 2 - Volume Work + Game Simulation",
          type: "throwing",
          duration: 90,
          warmup: "QB Enhanced warm-up (30 min) + Progressive throwing warm-up",
          throwingVolume: "40-60 throws",

          blocks: [
            {
              title: "Block 1: Progressive Throwing Warm-Up",
              track: "QB-Specific Throwing",
              duration: 20,
              qbSpecific: true,
              exercises: [
                {
                  name: "Progressive Throwing Warm-Up",
                  throws: "35-40",
                },
              ],
            },
            {
              title: "Block 2: Route Work + Accuracy",
              track: "QB-Specific Throwing",
              duration: 35,
              qbSpecific: true,
              exercises: [
                {
                  name: "Stationary Route Work",
                  throws: "20-25",
                  routes: ["Slants", "Outs", "Comebacks", "Fades"],
                  notes: "Track accuracy. Goal: 85%+",
                },
                {
                  name: "Movement-Based Game Simulation",
                  throws: "15-20",
                  protocol: "Bootlegs, rollouts, sprint-outs, pocket movement",
                },
              ],
            },
            {
              title: "Block 3: Light Conditioning",
              track: "Lower Body Light Work",
              duration: 20,
              exercises: [
                { name: "Agility ladder work", duration: "10 min" },
                { name: "Light sprint mechanics", duration: "10 min" },
              ],
            },
          ],
          totalThrows: "70-85 throws",
          postSessionProtocol: "QB Daily Arm Care (15-20 min)",
          equipment: ["Footballs", "targets", "agility ladder"],
        },

        saturday: {
          title: "QB Off Day - Shoulder/Hip Maintenance",
          type: "recovery",
          duration: 45,

          blocks: [
            {
              title: "Block 1: QB-Specific Mobility + Arm Care",
              track: "QB-Specific Mobility",
              duration: 35,
              qbSpecific: true,
              exercises: [
                { name: "Shoulder mobility circuit", duration: "15 min" },
                { name: "Rotator cuff maintenance", duration: "10 min" },
                { name: "Hip flexor work", duration: "10 min" },
              ],
            },
          ],
          equipment: ["Bands", "foam roller", "yoga mat"],
        },

        sunday: {
          title: "QB Complete Recovery",
          type: "recovery",
          duration: 75,
          protocol: "QB Sunday Recovery Protocol",
          activities: [
            { name: "Lower body stretching", duration: "25 min" },
            { name: "Foam rolling", duration: "20 min" },
            { name: "Light walk/bike", duration: "20 min" },
            {
              name: "QB shoulder + hip work",
              duration: "20 min",
              qbSpecific: true,
            },
            { name: "Visualization", duration: "10 min" },
          ],
        },
      },
      weekSummary: {
        lowerBodySessions: 2,
        throwingSessions: 2,
        totalThrows: "180-220 throws",
        focus:
          "Maintain maximum loads, long toss to 55y, throwing volume progression, complex training variations",
        qbSpecificNotes:
          "Long toss expanded to 55y. Throwing endurance building. Arm strength work intensified.",
      },
    },

    week7: {
      weekNumber: 7,
      dateRange: "January 12-18, 2026",
      phase: "Strength Development",
      focus:
        "Peak strength + throwing volume peak + long toss maximum distance",
      throwingVolume: "220-250 throws",
      days: {
        monday: {
          title: "QB Strength Day 1 - Peak Posterior Chain + Arm Strength",
          type: "strength",
          duration: 110,
          warmup: "QB Enhanced 30-min warm-up",
          dualTrack: true,

          blocks: [
            {
              title: "Block 1: Lower Body - Maximal Isometric (Peak Effort)",
              track: "Lower Body (Same as WR/DB)",
              duration: 20,
              exercises: [
                {
                  name: "Isometric Deadlift Pulls (Multiple Positions)",
                  positions: [
                    { name: "Below knee", sets: 4, duration: "6s max effort" },
                    { name: "Mid-thigh", sets: 3, duration: "6s max effort" },
                  ],
                  rest: "3 min",
                  notes: "Peak neural drive - 95% max effort",
                },
                {
                  name: "Isometric Squat Holds",
                  sets: 3,
                  duration: "6s max effort",
                  rest: "3 min",
                },
              ],
            },
            {
              title: "Block 2: Lower Body - Peak Posterior Chain Strength",
              track: "Lower Body (Same as WR/DB)",
              duration: 30,
              exercises: [
                {
                  name: "RDLs",
                  sets: 6,
                  reps: 5,
                  rest: "3 min",
                  load: "40% BW (peak load)",
                  notes: "Peak strength week",
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
                },
              ],
            },
            {
              title: "Block 3: QB-Specific - Peak Arm Strength",
              track: "QB-Specific Upper Body",
              duration: 30,
              qbSpecific: true,
              exercises: [
                {
                  name: "Single-Arm DB Rows (Peak Load)",
                  sets: 5,
                  reps: "6-8 each",
                  rest: "2.5 min",
                  load: "Heavy DBs (peak load for phase)",
                  notes: "Peak back strength for throwing power",
                },
                {
                  name: "Band External Rotation (Peak Resistance)",
                  sets: 5,
                  reps: "15 each",
                  rest: "2 min",
                  resistance: "Heavy band (peak for phase)",
                  notes: "Primary velocity generator - peak strength",
                },
                {
                  name: "Tricep Extensions (Peak Load)",
                  sets: 4,
                  reps: "10-12",
                  rest: "2 min",
                  load: "Heavy",
                },
                {
                  name: "Bicep Curls (Heavy)",
                  sets: 4,
                  reps: "8-10",
                  rest: "90s",
                },
                {
                  name: "Medicine Ball Rotational Throws (Max Distance)",
                  sets: 4,
                  reps: "6 each side",
                  rest: "2 min",
                  notes: "Maximum rotational power",
                },
              ],
            },
            {
              title: "Block 4: QB-Specific - Mobility Maintenance",
              track: "QB-Specific Mobility",
              duration: 15,
              qbSpecific: true,
              exercises: [
                { name: "Sleeper Stretch", sets: 3, duration: "60s each" },
                { name: "Couch Stretch", sets: 3, duration: "90s each" },
              ],
            },
          ],
          postSessionProtocol: "QB Daily Arm Care (15-20 min)",
          equipment: ["Barbell/DBs", "squat rack", "bands", "medicine ball"],
        },

        tuesday: {
          title: "QB Throwing Day 1 - Long Toss Peak + Velocity Work",
          type: "throwing",
          duration: 100,
          warmup: "QB Enhanced warm-up (30 min) + Progressive throwing warm-up",
          throwingVolume: "100-120 throws",

          blocks: [
            {
              title: "Block 1: Progressive Throwing Warm-Up",
              track: "QB-Specific Throwing",
              duration: 20,
              qbSpecific: true,
              exercises: [
                {
                  name: "Progressive Throwing Warm-Up",
                  throws: "35-40",
                },
              ],
            },
            {
              title: "Block 2: Long Toss - Peak Distance",
              track: "QB-Specific Throwing",
              duration: 40,
              qbSpecific: true,
              exercises: [
                {
                  name: "Long Toss Progression (Peak Distance)",
                  protocol: [
                    "40y: 5 throws",
                    "45y: 5 throws",
                    "50y: 6 throws",
                    "55y: 5 throws",
                    "60y: 5 throws (PEAK - max intent, on a line)",
                    "55y: 4 throws (compress back)",
                    "50y: 4 throws",
                    "45y: 3 throws",
                    "40y: 3 throws",
                  ],
                  throws: "40 throws",
                  rest: "60-90s between throws at 60y",
                  notes:
                    "PEAK long toss week. 60y is maximum for phase. Builds max arm strength + velocity",
                },
              ],
            },
            {
              title: "Block 3: Throwing Mechanics Cleanup",
              track: "QB-Specific Throwing",
              duration: 25,
              qbSpecific: true,
              exercises: [
                {
                  name: "Mechanics Work at 20-25y",
                  throws: "25-30",
                  focus: "Post-long toss mechanics refinement",
                },
              ],
            },
          ],
          totalThrows: "100-120 throws",
          postSessionProtocol: "QB Daily Arm Care (15-20 min)",
          equipment: ["Footballs", "partner", "measuring tape"],
        },

        wednesday: {
          title: "QB Active Recovery + Enhanced Mobility",
          type: "recovery",
          duration: 75,
          warmup: "Light movement (10 min)",
          dualTrack: true,

          blocks: [
            {
              title: "Block 1: Lower Body Mobility (Extended)",
              track: "Universal Recovery",
              duration: 30,
              exercises: [
                { name: "Hip mobility circuit", duration: "18 min" },
                { name: "Ankle/calf mobility", duration: "12 min" },
              ],
            },
            {
              title: "Block 2: QB-Specific Shoulder + Hip Work (Extended)",
              track: "QB-Specific Mobility",
              duration: 30,
              qbSpecific: true,
              exercises: [
                { name: "Comprehensive shoulder mobility", duration: "18 min" },
                { name: "Hip flexor flexibility", duration: "12 min" },
              ],
            },
            {
              title: "Block 3: Recovery",
              track: "Universal Recovery",
              duration: 10,
              exercises: [{ name: "Foam rolling", duration: "15 min" }],
            },
          ],
          equipment: ["Yoga mat", "foam roller", "bands"],
        },

        thursday: {
          title: "QB Strength Day 2 - Peak Power + Throwing Endurance Peak",
          type: "strength + throwing",
          duration: 120,
          warmup: "QB Enhanced warm-up (30 min) + Plyometric prep",
          dualTrack: true,
          throwingVolume: "60-70 throws",

          blocks: [
            {
              title: "Block 1: Lower Body - Advanced Complex Training",
              track: "Lower Body (Same as WR/DB)",
              duration: 35,
              exercises: [
                {
                  name: "Complex: Squat + Reactive Depth Jump",
                  sets: 6,
                  protocol:
                    '3 squats @ 40% BW → 3 depth jumps (10" box) → stick + react up',
                  rest: "4-5 min",
                  notes: "Peak PAP work",
                },
                {
                  name: "Complex: RDL + Hurdle Hop Series",
                  sets: 5,
                  protocol: "4 RDLs @ 40% BW → 8 hurdle hops",
                  rest: "3.5 min",
                },
                {
                  name: "Complex: Bulgarian Split Squat + Lateral Bound",
                  sets: 4,
                  protocol: "5 reps each → 4 lateral bounds each",
                  rest: "3 min",
                },
              ],
            },
            {
              title: "Block 2: Lower Body - Peak Plyometric Work",
              track: "Lower Body (Same as WR/DB)",
              duration: 30,
              exercises: [
                {
                  name: "Depth Jumps (Peak Height)",
                  sets: 6,
                  reps: 5,
                  rest: "3 min",
                  boxHeight: "12 inches",
                },
                {
                  name: "Reactive Box Jumps",
                  sets: 5,
                  reps: 6,
                  rest: "2.5 min",
                  boxHeight: "24-28 inches",
                },
              ],
            },
            {
              title: "Block 3: QB-Specific - Throwing Endurance Peak",
              track: "QB-Specific Throwing",
              duration: 35,
              qbSpecific: true,
              exercises: [
                {
                  name: "Progressive Throwing Warm-Up",
                  throws: "25-30",
                },
                {
                  name: "Ball Toss Endurance Drill (Peak Volume)",
                  throws: "35-40",
                  protocol: "Continuous throwing at 15-20y with minimal rest",
                  notes:
                    "PEAK throwing endurance for Strength phase. Building toward 320-throw goal",
                },
              ],
            },
          ],
          totalThrows: "60-70 throws",
          postSessionProtocol: "QB Daily Arm Care (15-20 min)",
          equipment: ["Barbell/DBs", "plyo boxes", "footballs", "hurdles"],
        },

        friday: {
          title: "QB Throwing Day 2 - Volume Peak + Game Simulation",
          type: "throwing",
          duration: 95,
          warmup: "QB Enhanced warm-up (30 min) + Progressive throwing warm-up",
          throwingVolume: "60-80 throws",

          blocks: [
            {
              title: "Block 1: Progressive Throwing Warm-Up",
              track: "QB-Specific Throwing",
              duration: 20,
              qbSpecific: true,
              exercises: [
                {
                  name: "Progressive Throwing Warm-Up",
                  throws: "35-40",
                },
              ],
            },
            {
              title: "Block 2: Route Work + Accuracy (High Volume)",
              track: "QB-Specific Throwing",
              duration: 40,
              qbSpecific: true,
              exercises: [
                {
                  name: "Comprehensive Route Work",
                  throws: "30-35",
                  routes: ["Full route tree - all distances"],
                  notes: "Track accuracy. Goal: 85-90%",
                },
                {
                  name: "Movement-Based Game Simulation",
                  throws: "20-25",
                  protocol: "Full game scenario work",
                },
              ],
            },
            {
              title: "Block 3: Light Conditioning",
              track: "Lower Body Light Work",
              duration: 20,
              exercises: [
                { name: "Agility work", duration: "10 min" },
                { name: "Sprint mechanics", duration: "10 min" },
              ],
            },
          ],
          totalThrows: "85-100 throws",
          postSessionProtocol: "QB Daily Arm Care (15-20 min)",
          equipment: ["Footballs", "targets", "cones"],
        },

        saturday: {
          title: "QB Off Day - Shoulder/Hip Maintenance",
          type: "recovery",
          duration: 50,

          blocks: [
            {
              title: "Block 1: QB-Specific Mobility + Arm Care (Extended)",
              track: "QB-Specific Mobility",
              duration: 40,
              qbSpecific: true,
              exercises: [
                { name: "Shoulder mobility circuit", duration: "18 min" },
                { name: "Rotator cuff maintenance", duration: "12 min" },
                { name: "Hip flexor work", duration: "10 min" },
              ],
            },
          ],
          equipment: ["Bands", "foam roller", "yoga mat"],
        },

        sunday: {
          title: "QB Complete Recovery",
          type: "recovery",
          duration: 75,
          protocol: "QB Sunday Recovery Protocol",
          activities: [
            { name: "Lower body stretching", duration: "25 min" },
            { name: "Foam rolling", duration: "20 min" },
            { name: "Light walk/bike", duration: "20 min" },
            {
              name: "QB shoulder + hip work",
              duration: "20 min",
              qbSpecific: true,
            },
            { name: "Visualization", duration: "10 min" },
          ],
        },
      },
      weekSummary: {
        lowerBodySessions: 2,
        throwingSessions: 2,
        totalThrows: "220-250 throws",
        focus:
          "Peak strength (40% BW RDLs 6×5), long toss to 60y (peak), throwing volume peak, arm strength peak",
        qbSpecificNotes:
          "PEAK WEEK. Long toss to 60y. Throwing endurance 35-40 throws continuous. Arm strength at maximum for phase.",
      },
    },

    week8: {
      weekNumber: 8,
      dateRange: "January 19-25, 2026",
      phase: "Strength Development",
      focus: "Mid-program QB assessment + partial deload",
      throwingVolume: "60-80 throws (assessment + deload)",
      assessmentWeek: true,
      days: {
        monday: {
          title: "QB Assessment Day 1 - Strength & Power + Arm Strength",
          type: "assessment",
          duration: 105,
          warmup: "Extended QB warm-up (35 min)",
          dualTrack: true,

          blocks: [
            {
              title: "Block 1: Lower Body Strength Assessment",
              track: "Lower Body Assessment",
              duration: 30,
              exercises: [
                {
                  name: "Back Squat - Test Set",
                  sets: "1-2",
                  reps: "Max reps @ 40% BW",
                  rest: "5 min",
                  record: "Total reps achieved",
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
                  record: "Best set total reps. Compare to Week 1",
                },
              ],
            },
            {
              title: "Block 2: Power Assessment",
              track: "Lower Body Assessment",
              duration: 20,
              exercises: [
                {
                  name: "Vertical Jump Test",
                  sets: 3,
                  rest: "2 min",
                  record: "Best jump height",
                },
                {
                  name: "Broad Jump Test",
                  sets: 3,
                  rest: "2 min",
                  record: "Best distance",
                },
              ],
            },
            {
              title: "Block 3: QB Arm Strength Assessment",
              track: "QB-Specific Assessment",
              duration: 30,
              qbSpecific: true,
              exercises: [
                {
                  name: "Band External Rotation - Max Resistance Test",
                  protocol: "Test max band resistance for 15 reps each arm",
                  record: "Band resistance level. Compare to Week 1",
                },
                {
                  name: "Single-Arm DB Row - Max Weight Test",
                  protocol: "Work up to 8RM each arm",
                  record: "Weight achieved. Compare to Week 1",
                },
                {
                  name: "Tricep Extension - Max Weight Test",
                  protocol: "Work up to 12RM",
                  record: "Weight achieved",
                },
                {
                  name: "Medicine Ball Rotational Throw - Max Distance",
                  sets: 3,
                  record: "Best distance each side. Compare to Week 1",
                },
              ],
            },
          ],
          postSessionProtocol: "QB Daily Arm Care (15-20 min)",
          equipment: [
            "Barbell/DBs",
            "bands",
            "medicine ball",
            "measuring tape",
          ],
        },

        tuesday: {
          title: "QB Assessment Day 2 - Speed, Mobility + Throwing Assessment",
          type: "assessment",
          duration: 110,
          warmup: "Extended QB warm-up (35 min) + Progressive throwing warm-up",
          throwingVolume: "60-80 throws",
          dualTrack: true,

          blocks: [
            {
              title: "Block 1: Speed Assessment (Brief)",
              track: "Lower Body Assessment",
              duration: 20,
              exercises: [
                {
                  name: "10-Yard Sprint Test",
                  sets: 3,
                  rest: "4 min",
                  record: "Best time",
                },
                {
                  name: "40-Yard Sprint Test",
                  sets: 2,
                  rest: "5 min",
                  record: "Best time",
                },
              ],
            },
            {
              title: "Block 2: QB Mobility Assessment",
              track: "QB-Specific Assessment",
              duration: 25,
              qbSpecific: true,
              exercises: [
                {
                  name: "Shoulder ROM Assessment",
                  assessment: "Internal rotation (sleeper stretch position)",
                  record: "Degrees each shoulder. CRITICAL for throwing",
                },
                {
                  name: "Hip Flexor Flexibility Test",
                  assessment: "Modified Thomas test",
                  record: "Degrees each side. Compare to Week 1",
                  notes: "Tight hip flexors reduce velocity 15-20%",
                },
                {
                  name: "Thoracic Extension Assessment",
                  assessment: "Seated rotation test",
                  record: "Degrees each direction",
                },
              ],
            },
            {
              title: "Block 3: QB Throwing Assessment",
              track: "QB-Specific Assessment",
              duration: 45,
              qbSpecific: true,
              exercises: [
                {
                  name: "Progressive Throwing Warm-Up",
                  throws: "35-40",
                },
                {
                  name: "Throwing Velocity Test (Radar Gun)",
                  throws: "15-20",
                  protocol: "Max effort throws at 20-25y",
                  record: "Peak velocity + average of top 5 throws",
                  notes: "Compare to Week 1 baseline. Goal: +3-5 mph",
                },
                {
                  name: "Accuracy Assessment",
                  throws: "20",
                  protocol: "20 throws to targets at various distances",
                  record: "Accuracy percentage",
                  notes: "Goal: 85%+",
                },
                {
                  name: "Throwing Endurance Test",
                  throws: "50-60",
                  protocol: "Continuous throwing until mechanics breakdown",
                  record: "Total throws before mechanics fail",
                  notes: "Compare to Week 1. Goal: 100+ throws capacity",
                },
              ],
            },
          ],
          totalThrows: "120-140 throws (assessment)",
          postSessionProtocol: "QB Daily Arm Care (20 min - extended)",
          equipment: [
            "Footballs",
            "radar gun",
            "targets",
            "stopwatch",
            "measuring tools",
          ],
        },

        wednesday: {
          title: "Movement Quality + Recovery",
          type: "recovery",
          duration: 70,
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
              duration: 35,
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
                  boxHeight: "12-16 inches (reduced)",
                  notes: "50-60% effort - movement quality",
                },
                {
                  name: "Pogo Jumps",
                  sets: 3,
                  duration: "15s",
                  rest: "90s",
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
          equipment: ["Low plyo box"],
        },

        friday: {
          title: "Deload - Light Throwing",
          type: "throwing",
          duration: 60,
          warmup: "QB Enhanced warm-up (30 min)",
          throwingVolume: "40-50 throws",

          blocks: [
            {
              title: "Block 1: Light Throwing (Deload)",
              track: "QB-Specific Throwing",
              duration: 25,
              qbSpecific: true,
              exercises: [
                {
                  name: "Progressive Throwing Warm-Up (Light)",
                  throws: "30-35",
                  intensity: "70-80% effort",
                  notes: "Mechanics focus, not max effort",
                },
                {
                  name: "Light Accuracy Work",
                  throws: "15-20",
                  protocol: "Stationary throws at 15-20y",
                  intensity: "Light effort",
                },
              ],
            },
          ],
          totalThrows: "45-55 throws",
          postSessionProtocol: "QB Daily Arm Care (15 min)",
          equipment: ["Footballs"],
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
              ],
            },
          ],
          equipment: ["Dumbbells"],
        },

        sunday: {
          title: "QB Complete Recovery + Assessment Review",
          type: "recovery",
          duration: 75,
          protocol: "QB Sunday Recovery Protocol",
          activities: [
            { name: "Lower body stretching", duration: "25 min" },
            { name: "Foam rolling", duration: "20 min" },
            { name: "Light walk/bike", duration: "20 min" },
            {
              name: "QB shoulder + hip work",
              duration: "20 min",
              qbSpecific: true,
            },
            {
              name: "Review assessment results + set Power phase goals",
              duration: "15 min",
            },
          ],
        },
      },
      weekSummary: {
        lowerBodySessions: 1,
        throwingSessions: 2,
        totalThrows: "165-195 throws (includes assessment)",
        assessmentFocus:
          "Strength, power, arm strength, throwing velocity, accuracy, endurance, mobility",
        deloadVolume: "50-60% of training loads",
        notes:
          "Compare all results to Week 1. Prepare for Power phase (Weeks 9-12)",
      },
      phaseSummary: {
        title: "QB Strength Development Phase Complete (Weeks 5-8)!",
        achievements: [
          "Maximum lower body strength developed (40% BW squats/RDLs)",
          "QB arm strength peak (heavy band external rotation, heavy DB rows)",
          "Throwing volume progressed (150-250 throws/week)",
          "Long toss introduced and peaked (40y → 60y progression)",
          "Throwing endurance built (continuous 35-40 throw capacity)",
          "Maximal isometric strength (6s holds @ 90-95% effort)",
          "Complex training introduced (PAP for explosive power)",
          "Shoulder mobility + hip flexor flexibility maintained/improved",
        ],
        keyMetrics: {
          totalThrows: "610-850 throws over 4 weeks",
          throwingProgression:
            "Week 5: 150-180, Week 6: 180-220, Week 7: 220-250",
          longTossProgression: "40y → 50y → 55y → 60y (peak)",
          strengthGains:
            "Compare Week 8 to Week 1: squats, RDLs, Nordic curls, arm strength",
          throwingGains:
            "Velocity (+3-5 mph goal), accuracy (85%+ goal), endurance (100+ throw capacity)",
          mobilityGains:
            "Shoulder ROM, hip flexor flexibility (critical for velocity)",
        },
        nextPhase: {
          name: "Power Phase (Weeks 9-12)",
          focus: [
            "Convert strength to explosive throwing power",
            "Throwing volume PEAK (250-320 throws/week)",
            "Long toss maintenance (60y) + velocity emphasis",
            "Game simulation + tournament prep",
            "Throwing endurance to 320-throw goal",
            "Reactive lower body power (plyometrics)",
            "Maximum velocity sprinting",
          ],
          throwingProgression: {
            week9: "250-280 throws",
            week10: "280-300 throws",
            week11: "300-320 throws (PEAK - tournament simulation)",
            week12: "Assessment + deload",
          },
          trainingShifts: {
            strength: "Maintenance volume (2 sessions, lighter loads)",
            power: "Primary focus (explosive + reactive work)",
            throwing: "PRIMARY FOCUS (250-320 throws/week, tournament prep)",
            speed: "Maximum velocity emphasis",
          },
        },
      },
    },

    week9: {
      weekNumber: 9,
      dateRange: "January 26 - February 1, 2026",
      phase: "Power",
      focus: "Convert strength to explosive throwing power + volume increase",
      throwingVolume: "250-280 throws",
      days: {
        monday: {
          title: "QB Power Day 1 - Explosive Power + Arm Strength Maintenance",
          type: "power",
          duration: 95,
          warmup: "QB Enhanced 30-min warm-up",
          dualTrack: true,

          blocks: [
            {
              title: "Block 1: Lower Body - Reactive Plyometric Work",
              track: "Lower Body (Same as WR/DB)",
              duration: 35,
              exercises: [
                {
                  name: "Depth Jumps (Reactive Emphasis)",
                  sets: 6,
                  reps: 6,
                  rest: "3 min",
                  boxHeight: "12 inches",
                  notes: "Minimal ground contact, max reactive jump",
                },
                {
                  name: "Reactive Box Jumps",
                  sets: 6,
                  reps: 5,
                  rest: "2.5 min",
                  boxHeight: "28-30 inches",
                },
                {
                  name: "Pogo Jumps (Maximum Height)",
                  sets: 4,
                  duration: "25s",
                  rest: "2 min",
                },
              ],
            },
            {
              title: "Block 2: Lower Body - Multi-Directional Power",
              track: "Lower Body (Same as WR/DB)",
              duration: 25,
              exercises: [
                {
                  name: "Lateral Bounds (Maximum Distance)",
                  sets: 5,
                  reps: "8 each direction",
                  rest: "2 min",
                },
                {
                  name: "Single-Leg Bounds",
                  sets: 5,
                  distance: "30m each",
                  rest: "2.5 min",
                },
              ],
            },
            {
              title: "Block 3: QB-Specific - Arm Strength Maintenance",
              track: "QB-Specific Upper Body",
              duration: 20,
              qbSpecific: true,
              exercises: [
                {
                  name: "Single-Arm DB Rows (Maintenance)",
                  sets: 3,
                  reps: "8-10 each",
                  rest: "2 min",
                  load: "Moderate-heavy DBs",
                  notes: "Maintain back strength for throwing",
                },
                {
                  name: "Band External Rotation",
                  sets: 3,
                  reps: "15 each",
                  rest: "90s",
                  resistance: "Heavy band",
                  notes: "Maintenance volume",
                },
                {
                  name: "Medicine Ball Rotational Throws",
                  sets: 3,
                  reps: "8 each side",
                  rest: "2 min",
                },
              ],
            },
          ],
          postSessionProtocol: "QB Daily Arm Care (15-20 min)",
          equipment: ["Plyo boxes", "DBs", "bands", "medicine ball"],
        },

        tuesday: {
          title: "QB Throwing Day 1 - Volume Increase + Long Toss Maintenance",
          type: "throwing",
          duration: 105,
          warmup: "QB Enhanced warm-up (30 min) + Progressive throwing warm-up",
          throwingVolume: "120-140 throws",

          blocks: [
            {
              title: "Block 1: Progressive Throwing Warm-Up",
              track: "QB-Specific Throwing",
              duration: 20,
              qbSpecific: true,
              exercises: [
                {
                  name: "Progressive Throwing Warm-Up",
                  throws: "35-40",
                },
              ],
            },
            {
              title: "Block 2: Long Toss Maintenance + Velocity",
              track: "QB-Specific Throwing",
              duration: 40,
              qbSpecific: true,
              exercises: [
                {
                  name: "Long Toss Maintenance (60y Peak)",
                  protocol: [
                    "40y: 5 throws",
                    "45y: 5 throws",
                    "50y: 5 throws",
                    "55y: 5 throws",
                    "60y: 6 throws (maintain peak distance)",
                    "55y: 4 throws",
                    "50y: 3 throws",
                    "45y: 3 throws",
                  ],
                  throws: "36 throws",
                  rest: "60-90s between throws at 60y",
                  notes:
                    "Maintain peak distance from Strength phase. Focus on velocity",
                },
              ],
            },
            {
              title: "Block 3: Route Work + Game Simulation",
              track: "QB-Specific Throwing",
              duration: 35,
              qbSpecific: true,
              exercises: [
                {
                  name: "Full Route Tree Work",
                  throws: "40-50",
                  routes: ["All distances, all route types"],
                  notes: "Volume increase. Track accuracy 85-90%",
                },
              ],
            },
          ],
          totalThrows: "111-126 throws",
          postSessionProtocol: "QB Daily Arm Care (15-20 min)",
          equipment: ["Footballs", "targets", "measuring tape"],
        },

        wednesday: {
          title: "QB Active Recovery + Enhanced Mobility",
          type: "recovery",
          duration: 75,
          warmup: "Light movement (10 min)",
          dualTrack: true,

          blocks: [
            {
              title: "Block 1: Lower Body Mobility",
              track: "Universal Recovery",
              duration: 25,
              exercises: [
                { name: "Hip mobility circuit", duration: "15 min" },
                { name: "Ankle/calf mobility", duration: "10 min" },
              ],
            },
            {
              title: "Block 2: QB-Specific Shoulder + Hip Work",
              track: "QB-Specific Mobility",
              duration: 30,
              qbSpecific: true,
              exercises: [
                { name: "Comprehensive shoulder mobility", duration: "15 min" },
                { name: "Hip flexor flexibility", duration: "10 min" },
                { name: "Thoracic mobility", duration: "5 min" },
              ],
            },
            {
              title: "Block 3: Recovery",
              track: "Universal Recovery",
              duration: 15,
              exercises: [{ name: "Foam rolling", duration: "15 min" }],
            },
          ],
          equipment: ["Yoga mat", "foam roller", "bands"],
        },

        thursday: {
          title: "QB Power Day 2 - Power Peak + High Volume Throwing",
          type: "power + throwing",
          duration: 115,
          warmup: "QB Enhanced warm-up (30 min) + Plyometric prep",
          dualTrack: true,
          throwingVolume: "130-140 throws",

          blocks: [
            {
              title: "Block 1: Lower Body - Complex Training (Power Emphasis)",
              track: "Lower Body (Same as WR/DB)",
              duration: 30,
              exercises: [
                {
                  name: "Complex: Squat + Reactive Depth Jump + Vertical Jump",
                  sets: 5,
                  protocol:
                    "3 squats @ 35% BW → 3 depth jumps → 2 max vertical jumps",
                  rest: "4 min",
                  notes: "Triple complex for maximum power",
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
              title: "Block 2: Lower Body - Peak Plyometric Volume",
              track: "Lower Body (Same as WR/DB)",
              duration: 25,
              exercises: [
                {
                  name: "Box Jumps (Maximum Height)",
                  sets: 6,
                  reps: 6,
                  rest: "2.5 min",
                  boxHeight: "30-36 inches",
                },
                {
                  name: "Broad Jumps",
                  sets: 6,
                  reps: 4,
                  rest: "2 min",
                },
              ],
            },
            {
              title: "Block 3: QB-Specific - High Volume Game Simulation",
              track: "QB-Specific Throwing",
              duration: 40,
              qbSpecific: true,
              exercises: [
                {
                  name: "Progressive Throwing Warm-Up",
                  throws: "30-35",
                },
                {
                  name: "Game Simulation Throwing (High Volume)",
                  throws: "100-105",
                  protocol:
                    "Full game scenario work, all routes, all distances",
                  notes:
                    "Building toward 320-throw tournament capacity. Track accuracy + mechanics",
                },
              ],
            },
          ],
          totalThrows: "130-140 throws",
          postSessionProtocol: "QB Daily Arm Care (20 min - extended)",
          equipment: ["Barbell/DBs", "plyo boxes", "footballs", "targets"],
        },

        friday: {
          title: "QB Speed + Light Throwing",
          type: "sprint + throwing",
          duration: 90,
          warmup: "QB Enhanced warm-up (30 min)",
          throwingVolume: "40-50 throws",

          blocks: [
            {
              title: "Block 1: Maximum Velocity Work (Brief)",
              track: "Lower Body Speed",
              duration: 25,
              exercises: [
                {
                  name: "40-Yard Sprints",
                  sets: 4,
                  distance: "40 yards",
                  intensity: "Max effort",
                  rest: "4 min",
                  notes: "Maintain speed capacity",
                },
                {
                  name: "Flying 10s",
                  sets: 4,
                  protocol: "20m build-up + 10m max sprint",
                  rest: "3 min",
                },
              ],
            },
            {
              title: "Block 2: Light Throwing + Accuracy",
              track: "QB-Specific Throwing",
              duration: 35,
              qbSpecific: true,
              exercises: [
                {
                  name: "Progressive Throwing Warm-Up",
                  throws: "30-35",
                },
                {
                  name: "Accuracy Work (Light Volume)",
                  throws: "15-20",
                  protocol: "Precision throwing at various distances",
                  notes: "Recovery day throwing - technique focus",
                },
              ],
            },
          ],
          totalThrows: "45-55 throws",
          postSessionProtocol: "QB Daily Arm Care (15 min)",
          equipment: ["Footballs", "targets", "cones"],
        },

        saturday: {
          title: "QB Off Day - Comprehensive Arm Care",
          type: "recovery",
          duration: 50,

          blocks: [
            {
              title: "Block 1: QB-Specific Mobility + Arm Care (Extended)",
              track: "QB-Specific Mobility",
              duration: 40,
              qbSpecific: true,
              exercises: [
                { name: "Shoulder mobility circuit", duration: "18 min" },
                { name: "Rotator cuff maintenance", duration: "12 min" },
                { name: "Hip flexor work", duration: "10 min" },
              ],
            },
          ],
          equipment: ["Bands", "foam roller", "yoga mat"],
        },

        sunday: {
          title: "QB Complete Recovery",
          type: "recovery",
          duration: 75,
          protocol: "QB Sunday Recovery Protocol",
          activities: [
            { name: "Lower body stretching", duration: "25 min" },
            { name: "Foam rolling", duration: "20 min" },
            { name: "Light walk/bike", duration: "20 min" },
            {
              name: "QB shoulder + hip work",
              duration: "20 min",
              qbSpecific: true,
            },
            { name: "Visualization", duration: "10 min" },
          ],
        },
      },
      weekSummary: {
        lowerBodySessions: 2,
        throwingSessions: 3,
        totalThrows: "250-280 throws",
        focus:
          "Power development, throwing volume increase, long toss maintenance at 60y, game simulation",
        qbSpecificNotes:
          "Volume increase to 250-280 throws. High-volume game simulation introduced.",
      },
    },

    week10: {
      weekNumber: 10,
      dateRange: "February 2-8, 2026",
      phase: "Power",
      focus: "Peak power + throwing volume approaching tournament levels",
      throwingVolume: "280-300 throws",
      days: {
        monday: {
          title: "QB Power Day 1 - Peak Reactive Power + Arm Maintenance",
          type: "power",
          duration: 95,
          warmup: "QB Enhanced 30-min warm-up",
          dualTrack: true,

          blocks: [
            {
              title: "Block 1: Lower Body - Maximum Reactive Ability",
              track: "Lower Body (Same as WR/DB)",
              duration: 35,
              exercises: [
                {
                  name: "Depth Jumps (Maximum Reactive Height)",
                  sets: 6,
                  reps: 6,
                  rest: "3 min",
                  boxHeight: "12-15 inches",
                  notes: "Minimal ground contact time, max reactive jump",
                },
                {
                  name: "Hurdle Hops (Speed Emphasis)",
                  sets: 6,
                  reps: "12-15 hurdles",
                  rest: "2.5 min",
                  hurdleHeight: "15 inches",
                },
                {
                  name: "Double-Leg Bounds (Maximum Distance)",
                  sets: 5,
                  reps: "8 bounds",
                  rest: "2.5 min",
                },
              ],
            },
            {
              title: "Block 2: Lower Body - Explosive Strength",
              track: "Lower Body (Same as WR/DB)",
              duration: 25,
              exercises: [
                {
                  name: "Jump Squats (Bodyweight)",
                  sets: 5,
                  reps: 6,
                  rest: "2 min",
                  notes: "Maximum height each rep",
                },
                {
                  name: "Broad Jumps",
                  sets: 5,
                  reps: 5,
                  rest: "2 min",
                },
              ],
            },
            {
              title: "Block 3: QB-Specific - Arm Strength Maintenance",
              track: "QB-Specific Upper Body",
              duration: 20,
              qbSpecific: true,
              exercises: [
                {
                  name: "Single-Arm DB Rows",
                  sets: 3,
                  reps: "8-10 each",
                  rest: "2 min",
                  load: "Moderate-heavy DBs",
                },
                {
                  name: "Band External Rotation",
                  sets: 3,
                  reps: "15 each",
                  rest: "90s",
                  resistance: "Heavy band",
                },
                {
                  name: "Tricep Extensions",
                  sets: 3,
                  reps: "12",
                  rest: "90s",
                },
              ],
            },
          ],
          postSessionProtocol: "QB Daily Arm Care (15-20 min)",
          equipment: ["Plyo boxes", "hurdles", "DBs", "bands"],
        },

        tuesday: {
          title: "QB Throwing Day 1 - Peak Volume Session + Velocity",
          type: "throwing",
          duration: 110,
          warmup: "QB Enhanced warm-up (30 min) + Progressive throwing warm-up",
          throwingVolume: "140-160 throws",

          blocks: [
            {
              title: "Block 1: Progressive Throwing Warm-Up",
              track: "QB-Specific Throwing",
              duration: 20,
              qbSpecific: true,
              exercises: [
                {
                  name: "Progressive Throwing Warm-Up",
                  throws: "35-40",
                },
              ],
            },
            {
              title: "Block 2: Long Toss + Velocity Emphasis",
              track: "QB-Specific Throwing",
              duration: 40,
              qbSpecific: true,
              exercises: [
                {
                  name: "Long Toss Maintenance (Velocity Emphasis)",
                  protocol: [
                    "40y: 5 throws",
                    "45y: 5 throws",
                    "50y: 6 throws",
                    "55y: 6 throws",
                    "60y: 8 throws (peak distance, max velocity)",
                    "55y: 4 throws",
                    "50y: 4 throws",
                  ],
                  throws: "38 throws",
                  rest: "60-90s between throws at 60y",
                  notes: "Emphasize velocity development",
                },
              ],
            },
            {
              title: "Block 3: High-Volume Route Work",
              track: "QB-Specific Throwing",
              duration: 40,
              qbSpecific: true,
              exercises: [
                {
                  name: "Comprehensive Route Tree (High Volume)",
                  throws: "60-75",
                  routes: ["Full route tree, all distances, all variations"],
                  notes: "Building tournament capacity. Track accuracy 85-90%",
                },
              ],
            },
          ],
          totalThrows: "133-153 throws",
          postSessionProtocol: "QB Daily Arm Care (20 min - extended)",
          equipment: ["Footballs", "targets", "measuring tape"],
        },

        wednesday: {
          title: "QB Active Recovery + Enhanced Mobility",
          type: "recovery",
          duration: 75,
          warmup: "Light movement (10 min)",
          dualTrack: true,

          blocks: [
            {
              title: "Block 1: Lower Body Mobility",
              track: "Universal Recovery",
              duration: 25,
              exercises: [
                { name: "Hip mobility circuit", duration: "15 min" },
                { name: "Ankle/calf mobility", duration: "10 min" },
              ],
            },
            {
              title: "Block 2: QB-Specific Shoulder + Hip Work",
              track: "QB-Specific Mobility",
              duration: 30,
              qbSpecific: true,
              exercises: [
                { name: "Comprehensive shoulder mobility", duration: "15 min" },
                { name: "Hip flexor flexibility", duration: "10 min" },
                { name: "Thoracic mobility", duration: "5 min" },
              ],
            },
            {
              title: "Block 3: Recovery",
              track: "Universal Recovery",
              duration: 15,
              exercises: [{ name: "Foam rolling", duration: "15 min" }],
            },
          ],
          equipment: ["Yoga mat", "foam roller", "bands"],
        },

        thursday: {
          title: "QB Power Day 2 - Multi-Directional Power + Tournament Sim",
          type: "power + throwing",
          duration: 120,
          warmup: "QB Enhanced warm-up (30 min) + Plyometric prep",
          dualTrack: true,
          throwingVolume: "140-150 throws",

          blocks: [
            {
              title: "Block 1: Lower Body - Multi-Directional Power",
              track: "Lower Body (Same as WR/DB)",
              duration: 35,
              exercises: [
                {
                  name: "Lateral Box Jumps",
                  sets: 5,
                  reps: "6 each direction",
                  rest: "2.5 min",
                  boxHeight: "20-24 inches",
                },
                {
                  name: "Rotational Broad Jumps",
                  sets: 5,
                  reps: "4 each direction",
                  rest: "2 min",
                  notes: "180-degree rotation in air",
                },
                {
                  name: "Single-Leg Lateral Bounds",
                  sets: 5,
                  reps: "6 each leg",
                  rest: "2 min",
                },
              ],
            },
            {
              title: "Block 2: Lower Body - Reactive Agility Power",
              track: "Lower Body (Same as WR/DB)",
              duration: 25,
              exercises: [
                {
                  name: "Reactive Box Jumps (Multi-Height)",
                  sets: 6,
                  reps: "5",
                  rest: "2.5 min",
                  protocol: 'Step down from 12", immediate jump to 30"',
                },
                {
                  name: "Pogo Jumps + Sprint",
                  sets: 5,
                  protocol: "20s pogo jumps → immediately 20m sprint",
                  rest: "3 min",
                },
              ],
            },
            {
              title: "Block 3: QB-Specific - Tournament Simulation Throwing",
              track: "QB-Specific Throwing",
              duration: 45,
              qbSpecific: true,
              exercises: [
                {
                  name: "Progressive Throwing Warm-Up",
                  throws: "30-35",
                },
                {
                  name: "Tournament Simulation (Game 1)",
                  throws: "110-115",
                  protocol: "Full game simulation: 4 quarters worth of throws",
                  notes:
                    "Simulating tournament game. Track mechanics breakdown point. Goal: maintain accuracy through full volume",
                },
              ],
            },
          ],
          totalThrows: "140-150 throws",
          postSessionProtocol:
            "QB Daily Arm Care (20 min - extended) + Ice if needed",
          equipment: ["Plyo boxes", "footballs", "targets"],
        },

        friday: {
          title: "QB Light Speed + Accuracy Work",
          type: "sprint + throwing",
          duration: 85,
          warmup: "QB Enhanced warm-up (30 min)",
          throwingVolume: "40-50 throws",

          blocks: [
            {
              title: "Block 1: Speed Maintenance",
              track: "Lower Body Speed",
              duration: 25,
              exercises: [
                {
                  name: "40-Yard Sprints",
                  sets: 4,
                  distance: "40 yards",
                  intensity: "Max effort",
                  rest: "4 min",
                },
                {
                  name: "Flying 10s",
                  sets: 4,
                  protocol: "20m build-up + 10m max sprint",
                  rest: "3 min",
                },
              ],
            },
            {
              title: "Block 2: Light Throwing + Precision",
              track: "QB-Specific Throwing",
              duration: 30,
              qbSpecific: true,
              exercises: [
                {
                  name: "Progressive Throwing Warm-Up",
                  throws: "30-35",
                },
                {
                  name: "Precision Accuracy Work",
                  throws: "15-20",
                  protocol: "High-precision targets, various distances",
                  notes: "Recovery volume - technique emphasis",
                },
              ],
            },
          ],
          totalThrows: "45-55 throws",
          postSessionProtocol: "QB Daily Arm Care (15 min)",
          equipment: ["Footballs", "targets"],
        },

        saturday: {
          title: "QB Off Day - Comprehensive Recovery",
          type: "recovery",
          duration: 50,

          blocks: [
            {
              title: "Block 1: QB-Specific Mobility + Arm Care",
              track: "QB-Specific Mobility",
              duration: 40,
              qbSpecific: true,
              exercises: [
                { name: "Shoulder mobility circuit", duration: "18 min" },
                { name: "Rotator cuff maintenance", duration: "12 min" },
                { name: "Hip flexor work", duration: "10 min" },
              ],
            },
          ],
          equipment: ["Bands", "foam roller", "yoga mat"],
        },

        sunday: {
          title: "QB Complete Recovery",
          type: "recovery",
          duration: 75,
          protocol: "QB Sunday Recovery Protocol",
          activities: [
            { name: "Lower body stretching", duration: "25 min" },
            { name: "Foam rolling", duration: "20 min" },
            { name: "Light walk/bike", duration: "20 min" },
            {
              name: "QB shoulder + hip work",
              duration: "20 min",
              qbSpecific: true,
            },
            { name: "Mental preparation", duration: "10 min" },
          ],
        },
      },
      weekSummary: {
        lowerBodySessions: 2,
        throwingSessions: 3,
        totalThrows: "280-300 throws",
        focus:
          "Peak power output, throwing volume 280-300 throws, tournament simulation (110+ throw sessions)",
        qbSpecificNotes:
          "APPROACHING tournament volume. Tournament simulation introduced. Monitor arm health closely.",
      },
    },

    week11: {
      weekNumber: 11,
      dateRange: "February 9-15, 2026",
      phase: "Power",
      focus: "PEAK throwing volume + tournament preparation",
      throwingVolume: "300-320 throws",
      days: {
        monday: {
          title: "QB Power Day 1 - Power Maintenance + Arm Care",
          type: "power",
          duration: 85,
          warmup: "QB Enhanced 30-min warm-up",
          dualTrack: true,

          blocks: [
            {
              title: "Block 1: Lower Body - Reactive Power Maintenance",
              track: "Lower Body (Same as WR/DB)",
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
              title: "Block 2: Lower Body - Multi-Directional Power",
              track: "Lower Body (Same as WR/DB)",
              duration: 20,
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
              title: "Block 3: QB-Specific - Arm Maintenance (Light)",
              track: "QB-Specific Upper Body",
              duration: 20,
              qbSpecific: true,
              exercises: [
                {
                  name: "Single-Arm DB Rows (Light)",
                  sets: 3,
                  reps: "10 each",
                  rest: "2 min",
                  load: "Moderate DBs (lighter than previous weeks)",
                  notes: "Maintenance only - peak throwing week",
                },
                {
                  name: "Band External Rotation",
                  sets: 3,
                  reps: "15 each",
                  rest: "90s",
                },
                {
                  name: "I-Y-T Raises",
                  sets: 2,
                  reps: "10 each",
                  rest: "90s",
                  notes: "Shoulder health emphasis",
                },
              ],
            },
          ],
          postSessionProtocol: "QB Daily Arm Care (20 min - extended)",
          equipment: ["Plyo boxes", "DBs", "bands"],
        },

        tuesday: {
          title: "QB Throwing Day 1 - PEAK VOLUME + Long Toss",
          type: "throwing",
          duration: 115,
          warmup: "QB Enhanced warm-up (30 min) + Progressive throwing warm-up",
          throwingVolume: "160-180 throws",

          blocks: [
            {
              title: "Block 1: Progressive Throwing Warm-Up",
              track: "QB-Specific Throwing",
              duration: 20,
              qbSpecific: true,
              exercises: [
                {
                  name: "Progressive Throwing Warm-Up",
                  throws: "35-40",
                },
              ],
            },
            {
              title: "Block 2: Long Toss Maintenance",
              track: "QB-Specific Throwing",
              duration: 35,
              qbSpecific: true,
              exercises: [
                {
                  name: "Long Toss Maintenance",
                  protocol: [
                    "40y: 5 throws",
                    "45y: 5 throws",
                    "50y: 5 throws",
                    "55y: 5 throws",
                    "60y: 6 throws",
                    "55y: 3 throws",
                    "50y: 3 throws",
                  ],
                  throws: "32 throws",
                  rest: "60s between throws at 60y",
                  notes: "Maintain velocity, don't push beyond 60y this week",
                },
              ],
            },
            {
              title: "Block 3: PEAK Volume Route Work",
              track: "QB-Specific Throwing",
              duration: 50,
              qbSpecific: true,
              exercises: [
                {
                  name: "Comprehensive Route Work (PEAK VOLUME)",
                  throws: "90-105",
                  routes: [
                    "Full route tree, all distances, all game scenarios",
                  ],
                  notes:
                    "PEAK VOLUME SESSION. Track accuracy through fatigue. Goal: 85%+ accuracy throughout",
                },
              ],
            },
          ],
          totalThrows: "157-177 throws",
          postSessionProtocol:
            "QB Daily Arm Care (25 min - EXTENDED) + Ice if needed",
          equipment: ["Footballs", "targets", "measuring tape"],
          notes: "CRITICAL: Monitor arm closely. This is peak volume session.",
        },

        wednesday: {
          title: "QB Recovery Day - CRITICAL Arm Care",
          type: "recovery",
          duration: 80,
          warmup: "Light movement (10 min)",
          dualTrack: true,

          blocks: [
            {
              title: "Block 1: Lower Body Mobility (Extended)",
              track: "Universal Recovery",
              duration: 25,
              exercises: [
                { name: "Hip mobility circuit", duration: "15 min" },
                { name: "Ankle/calf mobility", duration: "10 min" },
              ],
            },
            {
              title: "Block 2: QB-Specific Shoulder + Hip Work (EXTENDED)",
              track: "QB-Specific Mobility",
              duration: 35,
              qbSpecific: true,
              exercises: [
                {
                  name: "Comprehensive shoulder mobility",
                  duration: "20 min",
                  notes: "Extended duration - peak week",
                },
                { name: "Hip flexor flexibility", duration: "12 min" },
                { name: "Thoracic mobility", duration: "8 min" },
              ],
            },
            {
              title: "Block 3: Recovery",
              track: "Universal Recovery",
              duration: 15,
              exercises: [
                { name: "Foam rolling (comprehensive)", duration: "20 min" },
              ],
            },
          ],
          equipment: ["Yoga mat", "foam roller", "bands"],
          notes: "CRITICAL recovery day. Peak throwing week.",
        },

        thursday: {
          title: "QB Power Day 2 - Integrated Power + TOURNAMENT SIMULATION",
          type: "power + throwing",
          duration: 125,
          warmup: "QB Enhanced warm-up (30 min) + Plyometric prep",
          dualTrack: true,
          throwingVolume: "140-160 throws",

          blocks: [
            {
              title: "Block 1: Lower Body - Integrated Power + Agility",
              track: "Lower Body (Same as WR/DB)",
              duration: 30,
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
                },
              ],
            },
            {
              title: "Block 2: Lower Body - Plyometric Maintenance",
              track: "Lower Body (Same as WR/DB)",
              duration: 20,
              exercises: [
                { name: "Pogo Jumps", sets: 4, duration: "20s", rest: "2 min" },
                {
                  name: "Hurdle Hops",
                  sets: 4,
                  reps: "10 hurdles",
                  rest: "2 min",
                },
              ],
            },
            {
              title: "Block 3: QB-Specific - FULL TOURNAMENT SIMULATION",
              track: "QB-Specific Throwing",
              duration: 55,
              qbSpecific: true,
              exercises: [
                {
                  name: "Progressive Throwing Warm-Up",
                  throws: "30-35",
                },
                {
                  name: "FULL TOURNAMENT SIMULATION (Game 1 + Game 2)",
                  throws: "110-125",
                  protocol: "Simulate 2 games back-to-back with 15-min break",
                  structure: [
                    "Game 1: 55-60 throws (4 quarters)",
                    "15-min break: QB arm care protocol",
                    "Game 2: 55-65 throws (4 quarters)",
                  ],
                  notes:
                    "PEAK SIMULATION. Simulates tournament weekend. Track mechanics + accuracy through both games. Goal: maintain 85%+ accuracy",
                },
              ],
            },
          ],
          totalThrows: "140-160 throws",
          postSessionProtocol:
            "QB Daily Arm Care (25 min - EXTENDED) + Ice + Comprehensive shoulder work",
          equipment: ["Plyo boxes", "footballs", "targets", "cones"],
          notes:
            "PEAK VOLUME WEEK. This is tournament simulation. Monitor arm health very closely.",
        },

        friday: {
          title: "QB Active Recovery + Light Throwing",
          type: "recovery + throwing",
          duration: 75,
          warmup: "QB Enhanced warm-up (25 min)",
          throwingVolume: "30-40 throws (LIGHT)",

          blocks: [
            {
              title: "Block 1: Light Movement + Agility",
              track: "Lower Body Light Work",
              duration: 20,
              exercises: [
                { name: "Light agility ladder work", duration: "10 min" },
                { name: "Light sprint mechanics", duration: "10 min" },
              ],
            },
            {
              title: "Block 2: Light Throwing (Recovery)",
              track: "QB-Specific Throwing",
              duration: 30,
              qbSpecific: true,
              exercises: [
                {
                  name: "Progressive Throwing Warm-Up (Light)",
                  throws: "25-30",
                  intensity: "70-80% effort",
                  notes: "Recovery throwing only",
                },
                {
                  name: "Light Accuracy Work",
                  throws: "10-15",
                  protocol: "Easy tosses at 10-15y",
                  notes: "Mechanics focus, no max effort",
                },
              ],
            },
          ],
          totalThrows: "35-45 throws",
          postSessionProtocol: "QB Daily Arm Care (20 min)",
          equipment: ["Footballs", "agility ladder"],
        },

        saturday: {
          title: "QB Off Day - COMPREHENSIVE Recovery",
          type: "recovery",
          duration: 60,

          blocks: [
            {
              title: "Block 1: QB-Specific Mobility + Arm Care (Comprehensive)",
              track: "QB-Specific Mobility",
              duration: 50,
              qbSpecific: true,
              exercises: [
                {
                  name: "Shoulder mobility circuit",
                  duration: "20 min",
                  notes: "Extended - peak week recovery",
                },
                { name: "Rotator cuff maintenance", duration: "15 min" },
                { name: "Hip flexor work", duration: "10 min" },
                { name: "Light stretching", duration: "10 min" },
              ],
            },
          ],
          equipment: ["Bands", "foam roller", "yoga mat"],
          notes: "CRITICAL recovery day after peak volume week",
        },

        sunday: {
          title: "QB Complete Recovery + Mental Prep",
          type: "recovery",
          duration: 75,
          protocol: "QB Sunday Recovery Protocol",
          activities: [
            { name: "Lower body stretching", duration: "25 min" },
            { name: "Foam rolling", duration: "20 min" },
            { name: "Light walk/bike", duration: "20 min" },
            {
              name: "QB shoulder + hip work",
              duration: "20 min",
              qbSpecific: true,
            },
            {
              name: "Visualization + tournament mental prep",
              duration: "15 min",
            },
          ],
        },
      },
      weekSummary: {
        lowerBodySessions: 2,
        throwingSessions: 3,
        totalThrows: "300-320 throws (PEAK)",
        focus:
          "PEAK throwing volume (300-320 throws), full tournament simulation (2-game back-to-back), power maintenance",
        qbSpecificNotes:
          "PEAK WEEK. 300-320 total throws. Full tournament simulation achieved. Ready for competition. CRITICAL arm care this week.",
      },
    },

    week12: {
      weekNumber: 12,
      dateRange: "February 16-22, 2026",
      phase: "Power",
      focus: "Final QB assessment + deload before Competition phase",
      throwingVolume: "100-120 throws (assessment + deload)",
      assessmentWeek: true,
      days: {
        monday: {
          title: "QB Assessment Day 1 - Power, Strength + Arm Strength",
          type: "assessment",
          duration: 105,
          warmup: "Extended QB warm-up (35 min)",
          dualTrack: true,

          blocks: [
            {
              title: "Block 1: Lower Body Power Assessment",
              track: "Lower Body Assessment",
              duration: 30,
              exercises: [
                {
                  name: "Vertical Jump Test",
                  sets: 3,
                  rest: "3 min",
                  record: "Best jump height. Compare to Weeks 1 & 8",
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
              title: "Block 2: Lower Body Strength Assessment",
              track: "Lower Body Assessment",
              duration: 25,
              exercises: [
                {
                  name: "Back Squat - Test Set",
                  sets: "1-2",
                  reps: "Max reps @ 40% BW",
                  rest: "5 min",
                  record: "Total reps. Compare to Weeks 1 & 8",
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
              title: "Block 3: QB Arm Strength Assessment",
              track: "QB-Specific Assessment",
              duration: 25,
              qbSpecific: true,
              exercises: [
                {
                  name: "Band External Rotation - Max Resistance Test",
                  protocol: "Test max band resistance for 15 reps each arm",
                  record: "Band resistance level. Compare to Weeks 1 & 8",
                },
                {
                  name: "Single-Arm DB Row - Max Weight Test",
                  protocol: "Work up to 8RM each arm",
                  record: "Weight achieved. Compare to Weeks 1 & 8",
                },
                {
                  name: "Medicine Ball Rotational Throw - Max Distance",
                  sets: 3,
                  record: "Best distance each side. Compare to Weeks 1 & 8",
                },
              ],
            },
          ],
          postSessionProtocol: "QB Daily Arm Care (15 min)",
          equipment: [
            "Barbell/DBs",
            "bands",
            "medicine ball",
            "measuring tape",
          ],
        },

        tuesday: {
          title: "QB Assessment Day 2 - Speed + THROWING ASSESSMENT",
          type: "assessment",
          duration: 120,
          warmup: "Extended QB warm-up (35 min) + Progressive throwing warm-up",
          throwingVolume: "100-120 throws (assessment)",
          dualTrack: true,

          blocks: [
            {
              title: "Block 1: Speed Assessment (Brief)",
              track: "Lower Body Assessment",
              duration: 20,
              exercises: [
                {
                  name: "10-Yard Sprint Test",
                  sets: 3,
                  rest: "4 min",
                  record: "Best time",
                },
                {
                  name: "40-Yard Sprint Test",
                  sets: 2,
                  rest: "5 min",
                  record: "Best time",
                },
              ],
            },
            {
              title: "Block 2: QB Mobility Assessment",
              track: "QB-Specific Assessment",
              duration: 25,
              qbSpecific: true,
              exercises: [
                {
                  name: "Shoulder ROM Assessment",
                  assessment: "Internal rotation (sleeper stretch position)",
                  record: "Degrees each shoulder. Compare to Weeks 1 & 8",
                },
                {
                  name: "Hip Flexor Flexibility Test",
                  assessment: "Modified Thomas test",
                  record: "Degrees each side. Compare to Weeks 1 & 8",
                },
                {
                  name: "Thoracic Extension Assessment",
                  assessment: "Seated rotation test",
                  record: "Degrees each direction",
                },
              ],
            },
            {
              title: "Block 3: QB COMPREHENSIVE THROWING ASSESSMENT",
              track: "QB-Specific Assessment",
              duration: 55,
              qbSpecific: true,
              exercises: [
                {
                  name: "Progressive Throwing Warm-Up",
                  throws: "35-40",
                },
                {
                  name: "Throwing Velocity Test (Radar Gun)",
                  throws: "20-25",
                  protocol: "Max effort throws at 20-25y",
                  record: "Peak velocity + average of top 5 throws",
                  notes: "Compare to Weeks 1 & 8. Goal: +5-8 mph from baseline",
                },
                {
                  name: "Accuracy Assessment (Game Distances)",
                  throws: "30",
                  protocol:
                    "30 throws to targets at game distances (10y, 15y, 20y, 30y)",
                  record: "Accuracy percentage by distance",
                  notes: "Goal: 90%+ at short/medium, 85%+ at deep",
                },
                {
                  name: "Throwing Endurance Test (Tournament Capacity)",
                  throws: "50-60",
                  protocol: "Continuous throwing until mechanics breakdown",
                  record: "Total throws maintaining quality mechanics",
                  notes:
                    "Compare to Week 1. Goal: 150+ throws capacity before breakdown",
                },
              ],
            },
          ],
          totalThrows: "135-155 throws (assessment)",
          postSessionProtocol: "QB Daily Arm Care (25 min - extended)",
          equipment: [
            "Footballs",
            "radar gun",
            "targets",
            "stopwatch",
            "measuring tools",
          ],
          notes:
            "COMPREHENSIVE throwing assessment. Compare all metrics to Weeks 1 & 8",
        },

        wednesday: {
          title: "Movement Quality + Recovery",
          type: "recovery",
          duration: 70,
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
              duration: 35,
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
          title: "Deload - Light Throwing",
          type: "throwing",
          duration: 60,
          warmup: "QB Enhanced warm-up (30 min)",
          throwingVolume: "40-50 throws",

          blocks: [
            {
              title: "Block 1: Light Throwing (Deload)",
              track: "QB-Specific Throwing",
              duration: 25,
              qbSpecific: true,
              exercises: [
                {
                  name: "Progressive Throwing Warm-Up (Light)",
                  throws: "30-35",
                  intensity: "70-80% effort",
                  notes: "Mechanics focus, not max effort",
                },
                {
                  name: "Light Accuracy Work",
                  throws: "15-20",
                  protocol: "Easy throws at 15-20y",
                  intensity: "Light effort",
                },
              ],
            },
          ],
          totalThrows: "45-55 throws",
          postSessionProtocol: "QB Daily Arm Care (15 min)",
          equipment: ["Footballs"],
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
              ],
            },
          ],
          equipment: ["Dumbbells"],
        },

        sunday: {
          title: "QB Complete Recovery + Phase Review",
          type: "recovery",
          duration: 75,
          protocol: "QB Sunday Recovery Protocol",
          activities: [
            { name: "Lower body stretching", duration: "25 min" },
            { name: "Foam rolling", duration: "20 min" },
            { name: "Light walk/bike", duration: "20 min" },
            {
              name: "QB shoulder + hip work",
              duration: "20 min",
              qbSpecific: true,
            },
            {
              name: "Review assessment results + set Competition phase goals",
              duration: "15 min",
            },
          ],
        },
      },
      weekSummary: {
        lowerBodySessions: 1,
        throwingSessions: 2,
        totalThrows: "180-210 throws (includes assessment)",
        assessmentFocus:
          "Power, strength, arm strength, throwing velocity, accuracy, endurance, mobility",
        deloadVolume: "50-60% of training loads",
        notes:
          "Compare all results to Weeks 1 & 8. Prepare for Competition phase (Weeks 13-14)",
      },
      phaseSummary: {
        title: "QB Power Phase Complete (Weeks 9-12)!",
        achievements: [
          "Converted strength to explosive throwing power",
          "PEAK throwing volume achieved (300-320 throws in Week 11)",
          "Tournament capacity developed (2-game back-to-back simulation)",
          "Long toss maintained at 60y throughout phase",
          "Peak lower body power (depth jumps, reactive work)",
          "Throwing endurance to 320-throw goal ACHIEVED",
          "Game simulation at tournament volumes",
          "Shoulder/hip mobility maintained throughout high-volume phase",
        ],
        keyMetrics: {
          totalThrows: "930-1000 throws over 4 weeks (PEAK PHASE)",
          throwingProgression:
            "Week 9: 250-280, Week 10: 280-300, Week 11: 300-320 (PEAK)",
          longTossMaintenance: "60y maintained throughout (velocity emphasis)",
          powerGains:
            "Compare Week 12 to Week 8 to Week 1: vertical jump, broad jump, depth jump",
          throwingGains:
            "Velocity (+5-8 mph goal), accuracy (90%+ goal), endurance (150+ throw capacity goal)",
          tournamentReadiness: "Full 2-game simulation achieved in Week 11",
        },
        nextPhase: {
          name: "Competition Prep (Weeks 13-14)",
          focus: [
            "Volume reduction (taper)",
            "Maintain peak power + velocity",
            "Competition simulation",
            "Mental preparation",
            "Physical freshness for competition",
            "Tournament strategy refinement",
          ],
          throwingProgression: {
            week13: "100-120 throws (taper)",
            week14: "60-80 throws (final prep)",
          },
          trainingShifts: {
            volume: "Reduce 60-70% for taper",
            intensity: "Maintain at 90-100% for velocity",
            throwing: "Quality over quantity, precision focus",
            focus: "Freshness + mental prep",
          },
        },
      },
    },

    week13: {
      weekNumber: 13,
      dateRange: "February 23 - March 1, 2026",
      phase: "Competition Prep",
      focus: "Taper + throwing volume reduction",
      throwingVolume: "100-120 throws",
      days: {
        monday: {
          title: "QB Power Maintenance - Quality Over Quantity",
          type: "power",
          duration: 70,
          warmup: "QB Enhanced warm-up (25 min)",
          dualTrack: true,

          blocks: [
            {
              title: "Block 1: Lower Body - Explosive Power Maintenance",
              track: "Lower Body",
              duration: 25,
              exercises: [
                {
                  name: "Depth Jumps",
                  sets: 4,
                  reps: 4,
                  rest: "3 min",
                  boxHeight: "12 inches",
                  notes: "50-60% volume, 100% intensity",
                },
                {
                  name: "Box Jumps",
                  sets: 4,
                  reps: 4,
                  rest: "2.5 min",
                  boxHeight: "30 inches",
                },
                {
                  name: "Broad Jumps",
                  sets: 3,
                  reps: 3,
                  rest: "2 min",
                },
              ],
            },
            {
              title: "Block 2: QB-Specific - Arm Care Maintenance",
              track: "QB-Specific Upper Body",
              duration: 15,
              qbSpecific: true,
              exercises: [
                {
                  name: "Band External Rotation (Light)",
                  sets: 3,
                  reps: "15 each",
                  rest: "90s",
                  resistance: "Medium band (lighter than training)",
                  notes: "Maintenance only - taper week",
                },
                {
                  name: "I-Y-T Raises",
                  sets: 2,
                  reps: "10 each",
                  rest: "90s",
                  notes: "Shoulder health",
                },
              ],
            },
          ],
          postSessionProtocol: "QB Daily Arm Care (15 min)",
          equipment: ["Plyo boxes", "bands"],
          notes: "TAPER WEEK - Quality over quantity",
        },

        tuesday: {
          title: "QB Throwing Day 1 - Volume Taper + Velocity Maintenance",
          type: "throwing",
          duration: 75,
          warmup: "QB Enhanced warm-up (30 min) + Progressive throwing warm-up",
          throwingVolume: "60-70 throws",

          blocks: [
            {
              title: "Block 1: Progressive Throwing Warm-Up",
              track: "QB-Specific Throwing",
              duration: 20,
              qbSpecific: true,
              exercises: [
                {
                  name: "Progressive Throwing Warm-Up",
                  throws: "30-35",
                },
              ],
            },
            {
              title: "Block 2: Long Toss (Light Maintenance)",
              track: "QB-Specific Throwing",
              duration: 25,
              qbSpecific: true,
              exercises: [
                {
                  name: "Long Toss Maintenance (Reduced Volume)",
                  protocol: [
                    "40y: 3 throws",
                    "45y: 3 throws",
                    "50y: 3 throws",
                    "55y: 3 throws",
                    "60y: 4 throws (maintain peak distance)",
                    "50y: 2 throws",
                  ],
                  throws: "18 throws",
                  rest: "60s between throws at 60y",
                  notes: "Maintain velocity, reduce volume - taper",
                },
              ],
            },
            {
              title: "Block 3: Route Work (Light Volume)",
              track: "QB-Specific Throwing",
              duration: 20,
              qbSpecific: true,
              exercises: [
                {
                  name: "Accuracy-Focused Route Work",
                  throws: "15-20",
                  routes: ["Focus on precision, all distances"],
                  notes: "Quality over quantity. Track accuracy 90%+",
                },
              ],
            },
          ],
          totalThrows: "63-73 throws",
          postSessionProtocol: "QB Daily Arm Care (20 min)",
          equipment: ["Footballs", "targets"],
        },

        wednesday: {
          title: "QB Recovery + Mental Preparation",
          type: "recovery",
          duration: 65,
          warmup: "Light movement (10 min)",

          blocks: [
            {
              title: "Block 1: Light Mobility + Arm Care",
              duration: 30,
              exercises: [
                {
                  name: "Shoulder mobility circuit (light)",
                  duration: "15 min",
                },
                { name: "Hip flexor flexibility", duration: "10 min" },
                { name: "Light stretching", duration: "10 min" },
              ],
            },
            {
              title: "Block 2: Mental Preparation",
              duration: 25,
              exercises: [
                { name: "Foam rolling (light)", duration: "12 min" },
                {
                  name: "Tournament visualization + strategy",
                  duration: "20 min",
                },
              ],
            },
          ],
          equipment: ["Yoga mat", "foam roller", "bands"],
          notes: "Mental preparation becomes priority",
        },

        thursday: {
          title: "QB Light Power + Game Simulation Throwing",
          type: "power + throwing",
          duration: 85,
          warmup: "QB Enhanced warm-up (30 min) + Light plyometric prep",
          dualTrack: true,
          throwingVolume: "40-50 throws",

          blocks: [
            {
              title: "Block 1: Lower Body - Light Plyometric Reactivity",
              track: "Lower Body",
              duration: 20,
              exercises: [
                { name: "Pogo Jumps", sets: 3, duration: "15s", rest: "2 min" },
                {
                  name: "Lateral Bounds",
                  sets: 3,
                  reps: "4 each",
                  rest: "2 min",
                },
                {
                  name: "Single-Leg Bounds (Light)",
                  sets: 3,
                  distance: "20m each",
                  rest: "2 min",
                },
              ],
            },
            {
              title: "Block 2: QB-Specific - Game Simulation (Light)",
              track: "QB-Specific Throwing",
              duration: 35,
              qbSpecific: true,
              exercises: [
                {
                  name: "Progressive Throwing Warm-Up",
                  throws: "25-30",
                },
                {
                  name: "Game Scenario Throwing (Light Volume)",
                  throws: "20-25",
                  protocol: "Game-specific routes and scenarios",
                  notes: "Feel game speed, maintain sharpness",
                },
              ],
            },
          ],
          totalThrows: "45-55 throws",
          postSessionProtocol: "QB Daily Arm Care (15 min)",
          equipment: ["Plyo boxes", "footballs", "targets"],
        },

        friday: {
          title: "QB Light Speed + Accuracy",
          type: "sprint + throwing",
          duration: 65,
          warmup: "QB Enhanced warm-up (25 min)",
          throwingVolume: "20-30 throws",

          blocks: [
            {
              title: "Block 1: Speed Activation (Brief)",
              track: "Lower Body Speed",
              duration: 20,
              exercises: [
                {
                  name: "Build-Up Runs",
                  sets: 3,
                  distance: "40m",
                  intensity: "70-80-90%",
                  rest: "3 min",
                },
                {
                  name: "First Step Explosions",
                  sets: 4,
                  distance: "10m",
                  rest: "2 min",
                },
              ],
            },
            {
              title: "Block 2: Light Throwing + Precision",
              track: "QB-Specific Throwing",
              duration: 25,
              qbSpecific: true,
              exercises: [
                {
                  name: "Progressive Throwing Warm-Up (Light)",
                  throws: "20-25",
                },
                {
                  name: "Precision Accuracy Work",
                  throws: "10-15",
                  protocol: "High-precision targets",
                  notes: "Quality reps only",
                },
              ],
            },
          ],
          totalThrows: "30-40 throws",
          postSessionProtocol: "QB Daily Arm Care (15 min)",
          equipment: ["Footballs", "targets"],
        },

        saturday: {
          title: "QB Off Day - Comprehensive Arm Care",
          type: "recovery",
          duration: 55,

          blocks: [
            {
              title: "Block 1: QB-Specific Mobility + Arm Care",
              track: "QB-Specific Mobility",
              duration: 45,
              qbSpecific: true,
              exercises: [
                { name: "Shoulder mobility circuit", duration: "20 min" },
                { name: "Rotator cuff maintenance", duration: "12 min" },
                { name: "Hip flexor work", duration: "10 min" },
              ],
            },
          ],
          equipment: ["Bands", "foam roller", "yoga mat"],
        },

        sunday: {
          title: "QB Complete Recovery + Mental Prep",
          type: "recovery",
          duration: 70,
          protocol: "QB Sunday Recovery Protocol",
          activities: [
            { name: "Lower body stretching", duration: "20 min" },
            { name: "Foam rolling", duration: "15 min" },
            { name: "Light walk", duration: "20 min" },
            {
              name: "QB shoulder + hip work",
              duration: "15 min",
              qbSpecific: true,
            },
            { name: "Tournament visualization + strategy", duration: "20 min" },
          ],
        },
      },
      weekSummary: {
        lowerBodySessions: 2,
        throwingSessions: 3,
        totalThrows: "138-168 throws (40-50% reduction from peak)",
        focus:
          "Taper (40-50% volume), maintain intensity, mental preparation priority",
        qbSpecificNotes:
          "Significant throwing volume reduction. Quality over quantity. Stay fresh for competition.",
      },
    },

    week14: {
      weekNumber: 14,
      dateRange: "March 2-8, 2026",
      phase: "Competition Prep",
      focus: "Final preparation + peak freshness for tournament",
      throwingVolume: "60-80 throws (minimal)",
      days: {
        monday: {
          title: "QB Light Power Activation",
          type: "power",
          duration: 50,
          warmup:
            "QB Enhanced warm-up (20 min) + Light plyometric prep (5 min)",
          dualTrack: true,

          blocks: [
            {
              title: "Block 1: Lower Body - Explosive Activation",
              track: "Lower Body",
              duration: 20,
              exercises: [
                {
                  name: "Box Jumps",
                  sets: 3,
                  reps: 3,
                  rest: "2.5 min",
                  boxHeight: "24-28 inches",
                  notes: "Neuromuscular activation only",
                },
                {
                  name: "Broad Jumps",
                  sets: 3,
                  reps: 3,
                  rest: "2 min",
                },
                {
                  name: "Pogo Jumps",
                  sets: 2,
                  duration: "12s",
                  rest: "2 min",
                },
              ],
            },
          ],
          postSessionProtocol: "QB Daily Arm Care (15 min)",
          equipment: ["Plyo boxes", "bands"],
          notes: "MINIMAL VOLUME - Just activation",
        },

        tuesday: {
          title: "QB Throwing Day - Light Volume + Precision",
          type: "throwing",
          duration: 65,
          warmup: "QB Enhanced warm-up (30 min)",
          throwingVolume: "40-50 throws",

          blocks: [
            {
              title: "Block 1: Progressive Throwing Warm-Up (Light)",
              track: "QB-Specific Throwing",
              duration: 20,
              qbSpecific: true,
              exercises: [
                {
                  name: "Progressive Throwing Warm-Up",
                  throws: "25-30",
                  intensity: "80-90% effort",
                  notes: "Feel speed, don't push",
                },
              ],
            },
            {
              title: "Block 2: Precision Accuracy Work",
              track: "QB-Specific Throwing",
              duration: 20,
              qbSpecific: true,
              exercises: [
                {
                  name: "Game-Distance Accuracy",
                  throws: "20-25",
                  distances: ["10y, 15y, 20y, 30y"],
                  notes: "Precision focus. Goal: 95%+ accuracy",
                },
              ],
            },
          ],
          totalThrows: "45-55 throws",
          postSessionProtocol: "QB Daily Arm Care (20 min)",
          equipment: ["Footballs", "targets"],
          notes: "LIGHT VOLUME - Feel sharpness, maintain touch",
        },

        wednesday: {
          title: "QB Recovery + Visualization",
          type: "recovery",
          duration: 50,
          warmup: "Light movement (8 min)",

          blocks: [
            {
              title: "Block 1: Light Mobility + Mental Work",
              duration: 40,
              exercises: [
                { name: "Shoulder mobility (light)", duration: "12 min" },
                { name: "Hip flexor flexibility", duration: "8 min" },
                {
                  name: "Tournament visualization",
                  duration: "25 min",
                  notes: "PRIMARY FOCUS",
                },
              ],
            },
          ],
          equipment: ["Yoga mat", "bands"],
          notes: "Mental preparation is primary focus",
        },

        thursday: {
          title: "QB Light Game Simulation",
          type: "throwing",
          duration: 55,
          warmup: "QB Enhanced warm-up (25 min)",
          throwingVolume: "20-30 throws",

          blocks: [
            {
              title: "Block 1: Game Scenario Activation",
              track: "QB-Specific Throwing",
              duration: 25,
              qbSpecific: true,
              exercises: [
                {
                  name: "Progressive Throwing Warm-Up (Light)",
                  throws: "15-20",
                },
                {
                  name: "Game Scenario Throws (Very Light)",
                  throws: "10-15",
                  protocol: "Feel game scenarios, stay fresh",
                  intensity: "85% effort",
                  notes: "Sharpness, not volume",
                },
              ],
            },
          ],
          totalThrows: "25-35 throws",
          postSessionProtocol: "QB Daily Arm Care (15 min)",
          equipment: ["Footballs", "targets"],
        },

        friday: {
          title: "QB Final Activation - VERY Light",
          type: "activation",
          duration: 45,
          warmup: "QB Enhanced warm-up (20 min)",
          throwingVolume: "15-20 throws",

          blocks: [
            {
              title: "Block 1: Neuromuscular Activation (Minimal)",
              track: "QB-Specific Throwing",
              duration: 20,
              qbSpecific: true,
              exercises: [
                {
                  name: "Light Throwing Activation",
                  throws: "15-20",
                  protocol: "Progressive warm-up only, 5y → 20y",
                  intensity: "70-80% effort",
                  notes: "MINIMAL VOLUME - Just feel the ball",
                },
              ],
            },
          ],
          totalThrows: "15-20 throws",
          postSessionProtocol: "QB Daily Arm Care (15 min)",
          equipment: ["Footballs"],
          notes: "Last throwing session before tournament - VERY light",
        },

        saturday: {
          title: "QB Complete Rest + Final Mental Prep",
          type: "rest",
          duration: 40,
          activities: [
            { name: "Light shoulder mobility (optional)", duration: "10 min" },
            { name: "Tournament strategy review", duration: "20 min" },
            { name: "Visualization - Game 1 & 2", duration: "20 min" },
          ],
          notes: "Complete physical rest. Mental preparation only.",
        },

        sunday: {
          title: "TOURNAMENT DAY or Final Preparation",
          type: "competition",
          preGameWarmup: "Extended QB warm-up protocol (30-35 min)",
          betweenGames: "QB Between-Game Protocol (8-12 min)",
          notes:
            "Ready for 320-throw tournament weekend. Trust your preparation. Execute the game plan.",
        },
      },
      weekSummary: {
        lowerBodySessions: 1,
        throwingSessions: 3,
        totalThrows: "85-110 throws (70% reduction from peak)",
        focus:
          "Minimal volume (20-30% of peak), activation only, peak freshness, mental preparation",
        qbSpecificNotes:
          "Physical work is minimal. Mental preparation is priority. Arm is fresh and ready for 320-throw tournament.",
      },
      programSummary: {
        title: "14-WEEK QB ELITE TRAINING PROGRAM COMPLETE!",
        overallAchievements: [
          "Complete periodized dual-track program: Foundation → Strength → Power → Competition",
          "Tournament capacity developed (320-throw weekend simulation achieved)",
          "Maximum lower body strength developed (40% BW squats/RDLs)",
          "QB arm strength peaked (heavy band external rotation, heavy DB rows)",
          "Throwing velocity developed (long toss progression 40y → 60y)",
          "Throwing endurance to 320-throw goal ACHIEVED (Week 11 simulation)",
          "Shoulder mobility + hip flexor flexibility optimized (critical for velocity)",
          "Explosive power peak (depth jumps, reactive work)",
          "Taper for peak freshness",
        ],
        keyProgression: {
          foundation:
            "Weeks 1-4: 80-150 throws/week, foundation building, long toss introduction",
          strength:
            "Weeks 5-8: 150-250 throws/week, long toss to 60y, arm strength peak",
          power:
            "Weeks 9-12: 250-320 throws/week (PEAK), tournament simulation, throwing endurance peaked",
          taper:
            "Weeks 13-14: 100-120 → 60-80 throws, volume reduction, intensity maintenance",
        },
        tournamentReadiness: {
          throwingCapacity: "320-throw weekend capacity ACHIEVED",
          simulation: "Full 2-game back-to-back simulation completed (Week 11)",
          armStrength:
            "Rotator cuff, lats, triceps strength peaked (evidence-based)",
          velocity:
            "Long toss 60y maintained, velocity development optimized (Goal: +5-8 mph)",
          accuracy:
            "Precision throwing maintained through high volume (Goal: 90%+)",
          mobility:
            "Shoulder ROM optimal, hip flexors loosened (prevents 15-20% velocity loss)",
          freshness: "Proper taper executed, arm is fresh and ready",
        },
        evidenceBasedResults: {
          rotatorCuff:
            "External rotation strength correlates with velocity (r=0.72)",
          backStrength: "Lats provide 18% of throwing power - developed",
          hipFlexors:
            "Flexibility optimized (tight hip flexors reduce velocity 15-20%)",
          thoracicMobility: "Extension adds 8-12 mph velocity - maintained",
          armStrength:
            "Triceps (23% of velocity) + biceps (deceleration) developed",
        },
        nextSteps: [
          "COMPETE with confidence in your 320-throw capacity",
          "Execute tournament game plan",
          "Use between-game protocol (8-12 min arm care)",
          "Trust your preparation - you've simulated this",
          "Post-tournament: Light throwing maintenance",
          "In-season: 2-3x/week maintenance (50-60% volumes)",
          "Next offseason: Return to this program for continued development",
        ],
      },
    },
  },
};
