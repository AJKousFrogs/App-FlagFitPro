/**
 * Shared Training Protocols
 * Universal warm-ups, recovery routines, and daily protocols
 * Used by both WR/DB and QB programs
 */

/**
 * 15-Minute Daily Morning Mobility Routine
 * Different routine for each day of the week
 * All levels - critical for injury prevention
 */
export const MORNING_MOBILITY_ROUTINE = {
  title: "15 Minute Full Body DAILY Mobility Routine",
  description:
    "Complete this every morning to optimize movement quality and prevent injuries. Each day has a different routine to keep your body moving in all planes.",
  duration: 15,
  frequency: "Daily (7 days/week)",
  level: "All levels",

  // Day-specific routines with YouTube video links
  dailyRoutines: {
    monday: {
      dayName: "Monday",
      videoId: "IWNnTJFwi3s",
      videoUrl:
        "https://www.youtube.com/watch?v=IWNnTJFwi3s&list=PLIconE7hKrWGw8lprYWFeU5k2QbuKdSuf&index=1",
      focus: "Full body activation and hip mobility",
    },
    tuesday: {
      dayName: "Tuesday",
      videoId: "-RTXH86dKnM",
      videoUrl:
        "https://www.youtube.com/watch?v=-RTXH86dKnM&list=PLIconE7hKrWGw8lprYWFeU5k2QbuKdSuf&index=2",
      focus: "Lower body chain and ankle mobility",
    },
    wednesday: {
      dayName: "Wednesday",
      videoId: "WsOAJeifb_A",
      videoUrl:
        "https://www.youtube.com/watch?v=WsOAJeifb_A&list=PLIconE7hKrWGw8lprYWFeU5k2QbuKdSuf&index=3",
      focus: "Spinal mobility and core activation",
    },
    thursday: {
      dayName: "Thursday",
      videoId: "e9mJR6h3H4Y",
      videoUrl:
        "https://www.youtube.com/watch?v=e9mJR6h3H4Y&list=PLIconE7hKrWGw8lprYWFeU5k2QbuKdSuf&index=4",
      focus: "Hip flexor and quad mobility",
    },
    friday: {
      dayName: "Friday",
      videoId: "xGsbfQ6ZBH8",
      videoUrl:
        "https://www.youtube.com/watch?v=xGsbfQ6ZBH8&list=PLIconE7hKrWGw8lprYWFeU5k2QbuKdSuf&index=5",
      focus: "Shoulder and thoracic spine mobility",
    },
    saturday: {
      dayName: "Saturday",
      videoId: "EY8ks1HIdPM",
      videoUrl:
        "https://www.youtube.com/watch?v=EY8ks1HIdPM&list=PLIconE7hKrWGw8lprYWFeU5k2QbuKdSuf&index=6",
      focus: "Active recovery and movement flow",
    },
    sunday: {
      dayName: "Sunday",
      videoId: "1pnP0SyPPAw",
      videoUrl:
        "https://www.youtube.com/watch?v=1pnP0SyPPAw&list=PLIconE7hKrWGw8lprYWFeU5k2QbuKdSuf&index=7",
      focus: "Complete recovery and restoration",
    },
  },

  notes: [
    "This is NON-NEGOTIABLE for injury prevention",
    "Each day has a different routine - follow the video for your current day",
    "Do it even on rest days",
    "Takes only 15 minutes - no excuses",
    "Best done right after waking up",
  ],
};

/**
 * Universal Warm-Up Protocol
 * Used before EVERY training session
 * 20 minutes - comprehensive protocol to properly prepare the body
 */
export const UNIVERSAL_WARMUP = {
  title: "Universal Warm-Up (Every Session)",
  description:
    "Complete 20-minute warm-up protocol for all training sessions. This is NON-NEGOTIABLE for injury prevention and optimal performance.",
  duration: "20 minutes",
  phases: [
    {
      title: "Phase 1: General Activation & Cardiovascular Prep",
      duration: 8,
      purpose:
        "Increase heart rate, body temperature, and neural activation through sustained cardiovascular work",
      exercises: [
        {
          name: "Jump rope",
          duration: "5 minutes",
          intensity: "Moderate to moderate-high",
          variations: [
            "Basic bounce (2 min)",
            "Alternating feet (1 min)",
            "High knees (1 min)",
            "Double unders or fast singles (1 min)",
          ],
          cues: [
            "Light on feet",
            "Relaxed shoulders",
            "Rhythm focus",
            "Stay on balls of feet",
            "Breathe steadily",
          ],
          benefits: [
            "Full body warm-up",
            "Ankle stiffness development",
            "Coordination",
            "Cardiovascular activation",
          ],
        },
        {
          name: "Plank series",
          duration: "3 minutes total",
          breakdown: [
            { variation: "Standard plank", duration: "1.5 minutes" },
            { variation: "Right arm side plank", duration: "45s" },
            { variation: "Left arm side plank", duration: "45s" },
          ],
          cues: ["Straight body line", "Engaged core", "Control breathing"],
        },
      ],
    },
    {
      title: "Phase 2: Resistance Band Activation",
      duration: 5,
      purpose:
        "Activate key muscle groups and movement patterns with resistance bands",
      equipment: ["Light to medium resistance band (loop or long band)"],
      exercises: [
        {
          name: "Band pull-aparts",
          sets: 2,
          reps: 15,
          focus: "Upper back and posterior shoulder activation",
          cues: [
            "Arms straight",
            "Squeeze shoulder blades",
            "Control the return",
          ],
        },
        {
          name: "Band external rotations",
          sets: 2,
          reps: "12 each arm",
          focus: "Rotator cuff activation",
          cues: [
            "Elbow at 90°",
            "Elbow pinned to side",
            "Rotate outward against band",
          ],
        },
        {
          name: "Band monster walks",
          sets: 2,
          reps: "10 steps each direction",
          focus: "Glute medius and hip stability",
          cues: [
            "Band around ankles or above knees",
            "Athletic stance",
            "Constant tension",
            "Controlled steps",
          ],
        },
        {
          name: "Band squats",
          sets: 2,
          reps: 10,
          focus: "Glute activation with resistance",
          cues: [
            "Band above knees",
            "Push knees out against band",
            "Full depth",
            "Chest up",
          ],
        },
        {
          name: "Band hip flexor march",
          sets: 2,
          reps: "10 each leg",
          focus: "Hip flexor activation for sprint mechanics",
          cues: [
            "Band around feet",
            "Drive knee up against resistance",
            "Hold at top briefly",
            "Controlled descent",
          ],
        },
        {
          name: "Band glute bridges",
          sets: 2,
          reps: 10,
          focus: "Glute activation with hip abduction",
          cues: [
            "Band above knees",
            "Drive hips up",
            "Push knees out at top",
            "Squeeze glutes",
          ],
        },
      ],
    },
    {
      title: "Phase 3: Dynamic Stretching & Mobility",
      duration: 4,
      purpose: "Prepare joints and muscles through dynamic movement patterns",
      exercises: [
        {
          name: "Dynamic stretching sequence",
          duration: "2 minutes",
          exercises: [
            "Arm circles (forward and backward)",
            "Leg swings (sagittal and frontal)",
            "Torso rotations",
            "Hip circles",
          ],
          cues: ["Controlled movements", "Gradually increase range"],
        },
        {
          name: "Copenhagen Plank",
          duration: "45s each side",
          sets: 1,
          focus: "Adductor and core strength",
          cues: ["Top leg on bench", "Straight body", "Hold position"],
          notes: ["Advanced exercise", "Critical for groin injury prevention"],
        },
        {
          name: "World's greatest stretch",
          reps: "3 each side",
          focus: "Full body mobility",
          cues: [
            "Lunge position",
            "Elbow to instep",
            "Rotate and reach up",
            "Hold each position 3-5s",
          ],
        },
      ],
    },
    {
      title: "Phase 4: Final Movement Prep",
      duration: 3,
      purpose: "Final lower body activation and movement preparation",
      exercises: [
        {
          name: "Ankle circles + Calf raises",
          reps: "10 circles each direction, then 10 calf raises",
          cues: ["Full range", "Control descent", "Both ankles"],
        },
        {
          name: "Walking lunges",
          reps: "8 each leg",
          cues: ["Upright torso", "Back knee down", "Control"],
        },
        {
          name: "Bodyweight squats",
          reps: 10,
          cues: ["Full depth", "Chest up", "Knees out"],
        },
        {
          name: "Single-leg balance",
          duration: "15s each leg",
          cues: ["Stable ankle", "Slight knee bend", "Engage core"],
        },
      ],
    },
    {
      title: "Phase 3: Sprint Drill Series",
      duration: 5,
      purpose: "Activate sprint mechanics and neural patterns",
      applicability: "When sprint work is planned",
      exercises: [
        {
          name: "A-march",
          sets: 2,
          distance: "20m",
          focus: "Knee drive mechanics",
          cues: ["High knee", "Dorsiflexed ankle", "Tall posture", "Arm drive"],
        },
        {
          name: "A-skip",
          sets: 2,
          distance: "20m",
          focus: "Rhythm and coordination",
          cues: ["Skip pattern", "High knee", "Ankle dorsiflexion"],
        },
        {
          name: "B-skip",
          sets: 2,
          distance: "20m",
          focus: "Pawing action",
          cues: ["Extend leg", "Pull back to ground", "Aggressive contact"],
        },
        {
          name: "C-skip",
          sets: 2,
          distance: "20m",
          focus: "Circular motion",
          cues: ["Knee up", "Out", "Down", "Back"],
        },
        {
          name: "High knees",
          sets: 2,
          distance: "20m",
          focus: "Knee drive frequency",
          cues: ["Fast turnover", "Tall posture", "On toes"],
        },
        {
          name: "Butt kicks",
          sets: 2,
          distance: "20m",
          focus: "Hamstring recovery",
          cues: ["Heel to glute", "Fast turnover", "Stay tall"],
        },
        {
          name: "Scissors",
          sets: 2,
          distance: "20m",
          focus: "Leg cycling",
          cues: ["Alternate legs", "Quick transitions", "Arm coordination"],
        },
        {
          name: "Toy soldiers",
          sets: 2,
          distance: "20m",
          focus: "Hamstring flexibility dynamic",
          cues: ["Straight leg", "Touch toe", "Controlled"],
        },
        {
          name: "Hamstring stretch",
          duration: "30s each leg",
          cues: ["Gentle stretch", "Breathe", "No bouncing"],
        },
      ],
    },
  ],

  notes: [
    "NEVER skip the warm-up - this is injury prevention",
    "Takes 20 minutes but saves months of injury time",
    "The 5-minute jump rope is essential for cardiovascular prep and ankle stiffness",
    "Resistance band work activates key muscle groups before training",
    "Adjust intensity based on session to follow",
    "If short on time, minimum is Phase 1 + 2 (13 min) - but full protocol is strongly recommended",
  ],
};

/**
 * Sunday Recovery Protocol
 * Complete rest and recovery day
 * 45-60 minutes dedicated recovery
 */
export const SUNDAY_RECOVERY_PROTOCOL = {
  title: "Sunday Recovery Protocol",
  description: "Comprehensive weekly recovery routine - NON-NEGOTIABLE",
  duration: "45-60 minutes",
  frequency: "Every Sunday",
  importance: "Recovery IS training - this is where adaptation happens",

  sections: [
    {
      title: "Lower Body Chain Recovery",
      duration: "25-30 minutes",
      purpose: "Address accumulated fatigue from week of training",

      exercises: [
        {
          category: "Ankle Mobility",
          exercises: [
            {
              name: "Calf stretching",
              sets: 3,
              duration: "45s each",
              variations: [
                "Straight leg (gastrocnemius)",
                "Bent knee (soleus)",
              ],
              cues: ["Deep stretch", "Breathe into it", "Both legs"],
            },
            {
              name: "Tibialis stretching",
              sets: 2,
              duration: "30s each",
              cues: ["Point toes", "Gentle pressure", "Feel front of shin"],
            },
          ],
        },
        {
          category: "Knee Recovery",
          exercises: [
            {
              name: "Quad stretching",
              sets: 3,
              duration: "45s each",
              variations: ["Standing", "Lying", "Couch stretch"],
              cues: [
                "Pull heel to glute",
                "Keep knees together",
                "Tall posture",
              ],
            },
            {
              name: "Hamstring stretching",
              sets: 3,
              duration: "45s each",
              variations: ["Standing", "Seated", "Lying"],
              cues: ["Straight leg", "Hinge at hip", "Feel the stretch"],
            },
            {
              name: "Foam rolling",
              focus: "Quads, hamstrings, IT band",
              duration: "5 minutes",
              cues: [
                "Slow rolling",
                "Pause on tender spots",
                "Breathe through it",
              ],
            },
          ],
        },
        {
          category: "Hip Complex",
          exercises: [
            {
              name: "Hip flexor stretching",
              sets: 4,
              duration: "45s each",
              importance: "CRITICAL - tight hip flexors limit performance",
              cues: [
                "Lunge position",
                "Drive hips forward",
                "Tall torso",
                "Deep stretch",
              ],
            },
            {
              name: "Couch stretch",
              sets: 2,
              duration: "90s each leg",
              importance: "The king of hip flexor stretches",
              setup: "Rear foot elevated on couch/bench",
              cues: [
                "Front foot planted",
                "Rear knee on ground",
                "Drive hips forward",
                "Feel DEEP stretch in front of hip",
                "Can use hands for support initially",
              ],
              note: "This stretch is life-changing for athletes",
            },
            {
              name: "Pigeon pose",
              sets: 2,
              duration: "90s each side",
              focus: "Hip external rotation and glutes",
              cues: [
                "Front leg bent 90°",
                "Back leg straight",
                "Square hips",
                "Lean forward for deeper stretch",
              ],
            },
            {
              name: "90/90 hip stretches",
              sets: 2,
              duration: "60s each position",
              variations: ["Both positions"],
              focus: "Hip rotation mobility",
              cues: ["Both knees at 90°", "Upright torso", "Hold position"],
            },
            {
              name: "World's greatest stretch",
              sets: 2,
              reps: "5 each side",
              focus: "Dynamic full body mobility",
              cues: ["Lunge", "Elbow to instep", "Rotate up", "Hold each"],
            },
          ],
        },
      ],
    },
    {
      title: "Additional Recovery Modalities",
      duration: "20-30 minutes",
      purpose:
        "Daily recovery practices to enhance recovery and prevent injury",

      exercises: [
        {
          category: "Daily Recovery",
          exercises: [
            {
              name: "Foam rolling",
              frequency: "Daily",
              duration: "10-15 minutes",
              focus: "Full body recovery",
              areas: [
                "Calves",
                "Hamstrings",
                "Quads",
                "IT band",
                "Glutes",
                "Lower back",
                "Upper back",
              ],
              cues: [
                "Slow, controlled rolling",
                "Pause on tender spots for 30-60 seconds",
                "Breathe deeply through discomfort",
                "Work each area thoroughly",
              ],
              importance: "Critical for daily recovery - do not skip",
            },
            {
              name: "Massage gun",
              frequency: "When needed (before foam rolling)",
              duration: "5-10 minutes",
              timing: "Use before foam rolling session",
              focus: "Major muscle groups and tender areas",
              cues: [
                "Start with low intensity",
                "Move slowly over muscle belly",
                "Avoid bones and joints",
                "Use heated attachment if available",
              ],
              note: "Helps prepare tissues for deeper foam rolling work",
            },
          ],
        },
        {
          category: "Weekly Recovery",
          exercises: [
            {
              name: "Compression boots",
              frequency: "2x per week (or daily if available)",
              duration: "15-30 minutes",
              intensity: "Moderate pressure",
              benefits: [
                "Enhanced blood flow",
                "Reduced muscle soreness",
                "Faster recovery between sessions",
              ],
              cues: [
                "Start with lower pressure",
                "Gradually increase to comfortable level",
                "Use after training sessions or before bed",
              ],
              note: "Daily use is ideal if equipment is available",
            },
            {
              name: "Self massage",
              frequency: "2x per week",
              duration: "15-20 minutes",
              focus: "Targeted areas",
              techniques: [
                "Hands and thumbs for deep pressure",
                "Tennis ball for trigger points",
                "Lacrosse ball for feet and glutes",
              ],
              areas: [
                "Feet and calves",
                "Hip flexors",
                "Glutes",
                "Upper back and shoulders",
              ],
              cues: [
                "Work slowly and methodically",
                "Find and release trigger points",
                "Breathe through discomfort",
              ],
            },
            {
              name: "Fascia IASTM tools",
              frequency: "1x per week",
              duration: "10-15 minutes",
              purpose: "Fascial release and mobility",
              tools: ["Gua sha tool", "IASTM scraper", "Metal or plastic tool"],
              technique: [
                "Apply light pressure",
                "Move tool along muscle fibers",
                "Work in one direction",
                "Use lotion or oil for smooth gliding",
              ],
              areas: ["IT band", "Calves", "Shins", "Forearms", "Upper back"],
              cues: [
                "Light pressure - not painful",
                "Work slowly",
                "Redness is normal",
                "Avoid if skin is irritated",
              ],
              note: "Advanced technique - learn proper form before use",
            },
          ],
        },
      ],
    },
  ],

  nutrition: {
    title: "Sunday Nutrition Focus",
    emphasis: "Recovery and preparation",
    guidelines: [
      "Extra protein intake (muscle repair)",
      "Hydration emphasis (3-4L water minimum)",
      "Anti-inflammatory foods (berries, leafy greens, fatty fish)",
      "Recovery supplementation if using (protein, omega-3s)",
      "Prepare meals for upcoming week",
    ],
  },

  mentalRecovery: {
    title: "Mental Recovery Activities",
    importance: "Mental recovery is as important as physical",
    activities: [
      "Reflect on week's progress",
      "Celebrate wins (big and small)",
      "Identify lessons learned",
      "Set intentions for upcoming week",
      "Enjoy rest - guilt-free recovery day",
    ],
  },

  notes: [
    "This is your most important training session of the week",
    "Recovery IS training - this is where you get stronger",
    "Don't skip this - it prevents overtraining and injury",
    "Quality rest leads to quality performance",
    "Take the full 45-60 minutes - you earned it",
  ],
};

/**
 * Volume Guidelines
 * Progressive volume across training phases
 */
export const VOLUME_GUIDELINES = {
  sprint: {
    title: "Sprint Volume by Phase",
    description: "Ground contacts per week",
    phases: {
      weeks_1_4: {
        phase: "Foundation",
        volume: "40-60 ground contacts/week",
        condition: "If indoor space available",
        focus: "Mechanics and technique",
      },
      weeks_5_8: {
        phase: "Strength Development",
        volume: "80-120 ground contacts/week",
        focus: "Increased volume and intensity",
      },
      weeks_9_12: {
        phase: "Power Phase",
        volume: "120-180 ground contacts/week",
        focus: "Maximum volume and speed",
      },
      weeks_13_14: {
        phase: "Competition Prep",
        volume: "80-100 ground contacts/week",
        note: "Taper for competition",
        focus: "Maintain speed, reduce fatigue",
      },
    },
  },

  plyometric: {
    title: "Plyometric Volume by Phase",
    description: "Total contacts per session and frequency",
    phases: {
      weeks_1_4: {
        phase: "Foundation",
        contactsPerSession: "60-80",
        frequency: "2x/week",
        focus: "Learning landing mechanics",
      },
      weeks_5_8: {
        phase: "Strength Development",
        contactsPerSession: "80-120",
        frequency: "2-3x/week",
        focus: "Power development",
      },
      weeks_9_12: {
        phase: "Power Phase",
        contactsPerSession: "120-160",
        frequency: "3x/week",
        focus: "Maximum reactive power",
      },
      weeks_13_14: {
        phase: "Competition Prep",
        contactsPerSession: "60-80",
        frequency: "2x/week",
        note: "Taper volume",
        focus: "Maintain power, fresh legs",
      },
    },
  },

  strength: {
    title: "Strength Training Volume",
    description: "Sets × Reps by phase",
    phases: {
      weeks_1_4: {
        phase: "Foundation",
        volume: "3-4 sets × 8-12 reps",
        loadRange: "25-40% BW",
        focus: "Volume accumulation and technique",
      },
      weeks_5_8: {
        phase: "Strength Development",
        volume: "4-5 sets × 5-8 reps",
        loadRange: "30-40% BW",
        focus: "Strength building",
      },
      weeks_9_12: {
        phase: "Power Phase",
        volume: "3-5 sets × 3-6 reps",
        loadRange: "35-40% BW",
        focus: "Power expression",
      },
      weeks_13_14: {
        phase: "Competition Prep",
        volume: "2-3 sets × 3-5 reps",
        loadRange: "30-35% BW",
        note: "Maintenance only",
        focus: "Maintain strength, reduce fatigue",
      },
    },
    note: "Maximum 40% body weight external resistance across ALL phases",
  },
};

/**
 * Assessment Schedule
 * When and what to test
 */
export const ASSESSMENT_SCHEDULE = {
  week_1: {
    title: "Baseline Assessment",
    timing: "Before starting program",
    tests: [
      "40-yard sprint (3 trials)",
      "20-yard sprint (3 trials)",
      "10-yard sprint (3 trials)",
      "Vertical jump (3 trials)",
      "Broad jump (3 trials)",
      "Pro-Agility 5-10-5 (3 trials)",
      "L-drill (3 trials)",
      "Nordic curl max reps (1 set)",
      "Single-leg balance (30s eyes closed)",
    ],
    purpose: "Establish baseline for comparison",
  },

  week_4: {
    title: "End of Foundation Phase",
    timing: "End of week 4",
    tests: [
      "All sprint tests (40y, 20y, 10y)",
      "All power tests (vertical, broad)",
      "All agility tests (pro-agility, L-drill)",
      "Nordic curl max reps",
      "Movement quality assessment",
    ],
    purpose: "Evaluate foundation phase progress",
  },

  week_7: {
    title: "Mid-Strength Phase Check",
    timing: "Middle of week 7",
    tests: [
      "Repeat sprint testing",
      "Power assessments (vertical, broad)",
      "Agility testing",
    ],
    purpose: "Monitor strength development",
  },

  week_11: {
    title: "End of Power Phase",
    timing: "End of week 11",
    tests: [
      "Complete testing battery",
      "Film sprint mechanics",
      "Strength assessments",
      "Compare to Week 4 baseline",
    ],
    purpose: "Validate power development and progress",
  },

  week_14: {
    title: "Pre-Competition Final Check",
    timing: "Early in week 14",
    tests: [
      "Final sprint validation",
      "Position-specific assessments",
      "Movement quality check",
    ],
    purpose: "Confirm competition readiness",
  },
};

/**
 * Standard Session Structure
 * Template for organizing workout sessions
 */
export const SESSION_STRUCTURE = {
  title: "Standard Training Session Structure",
  description: "How every session should be organized",

  structure: [
    {
      phase: "Arrival",
      duration: "5-10 min",
      activities: ["Equipment setup", "Mental preparation", "Review workout"],
    },
    {
      phase: "Warm-Up",
      duration: "20 min",
      protocol: "Universal Warm-Up (all 4 phases: Jump rope, Resistance bands, Dynamic stretching, Movement prep)",
      importance: "NON-NEGOTIABLE",
    },
    {
      phase: "Skill/Technical Work",
      duration: "10-15 min",
      examples: ["Sprint mechanics", "Jump technique", "Movement patterns"],
      note: "When fresh, high neural demand",
    },
    {
      phase: "Main Training",
      duration: "30-45 min",
      structure: "Blocks as prescribed in program",
      note: "Focus and intensity",
    },
    {
      phase: "Cool-Down",
      duration: "10 min",
      activities: [
        "Light movement (walk/jog)",
        "Static stretching",
        "Breathing exercises",
      ],
    },
    {
      phase: "Recovery",
      duration: "5-10 min",
      activities: [
        "Foam rolling",
        "Hydration",
        "Nutrition",
        "Session notes/tracking",
      ],
    },
  ],

  totalTime: "75-110 minutes (depending on session type)",
};

export default {
  MORNING_MOBILITY_ROUTINE,
  UNIVERSAL_WARMUP,
  SUNDAY_RECOVERY_PROTOCOL,
  VOLUME_GUIDELINES,
  ASSESSMENT_SCHEDULE,
  SESSION_STRUCTURE,
};
