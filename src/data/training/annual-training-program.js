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
export default TRAINING_PROGRAM;