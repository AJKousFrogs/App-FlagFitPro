/**
 * ⚠️ DEPRECATED: Comprehensive Exercise Library (Legacy)
 * 
 * This static exercise library is deprecated.
 * Exercises are now stored in the database `exercises` table.
 * 
 * Use the API to fetch exercises:
 *   GET /api/training-programs/exercises?sessionId={sessionId}
 * 
 * Or query the database directly via Supabase client.
 * 
 * See /src/data/DEPRECATED.md for full migration guide.
 * This file will be removed in Q2 2026.
 * 
 * @deprecated Use database via API
 */

/**
 * Exercise Categories:
 * - Posterior Chain (hamstrings, glutes, lower back)
 * - Quadriceps & Knee
 * - Ankle & Calf
 * - Plyometrics & Power
 * - Sprint Mechanics & Drills
 * - Core & Stability
 * - Upper Body (general)
 * - Mobility & Flexibility
 * - Olympic/Power Movements
 * - Conditioning
 */

export const EXERCISE_LIBRARY = {
  // ==================== POSTERIOR CHAIN ====================

  "Nordic Curls": {
    category: "Posterior Chain",
    primaryMuscles: ["Hamstrings", "Glutes"],
    difficulty: "Advanced",
    equipment: ["Partner or Nordic bench"],

    setup: [
      "Kneel on pad",
      "Ankles secured by partner or bench",
      "Start upright with straight body line",
      "Hands ready to catch fall",
    ],

    execution: [
      "Keep hips extended (don't bend at waist)",
      "Lower body forward under control",
      "Use hamstrings to control descent",
      "Catch yourself with hands when needed",
      "Push back up (or use band assistance)",
    ],

    coachingCues: [
      "CRITICAL exercise for hamstring strength",
      "Even 1-2 reps is great progress",
      "Control the descent - that's the key",
      "Don't bend at hips",
      "Use assistance (band) if needed",
    ],

    progressions: [
      {
        level: "Beginner",
        modification: "Heavy band assistance",
        sets: "3×AMRAP",
        goal: "Control 3-5 second descent",
      },
      {
        level: "Intermediate",
        modification: "Light band assistance",
        sets: "4×6-8",
        goal: "6-8 reps with band",
      },
      {
        level: "Advanced",
        modification: "Bodyweight only",
        sets: "5×8-10",
        goal: "8-10 unassisted reps",
      },
      {
        level: "Elite",
        modification: "Weighted vest",
        sets: "5×10+",
        goal: "10+ reps with added weight",
      },
    ],

    safetyNotes: [
      "Use assistance if needed - no shame",
      "Control the descent - don't just drop",
      "Some soreness is normal after first sessions",
      "Stop if sharp pain in hamstring",
    ],

    commonMistakes: [
      "Bending at hips instead of keeping straight",
      "Dropping too fast without control",
      "Not using assistance when needed",
    ],

    benefits: [
      "Best hamstring injury prevention exercise",
      "Builds eccentric strength (critical for sprinting)",
      "Improves sprint speed and power",
      "Reduces hamstring injury risk by 50-70%",
    ],
  },

  "RDLs (Romanian Deadlifts)": {
    category: "Posterior Chain",
    primaryMuscles: ["Hamstrings", "Glutes", "Lower Back"],
    secondaryMuscles: ["Grip", "Upper Back"],
    difficulty: "Intermediate",
    equipment: ["Barbell or dumbbells"],

    setup: [
      "Stand with feet hip-width",
      "Hold barbell/DBs at thighs",
      "Slight knee bend",
      "Chest up, shoulders back",
    ],

    execution: [
      "Hinge at hips (push butt back)",
      "Keep back flat (not rounded)",
      "Lower bar down legs",
      "Feel hamstring stretch",
      "Stop when stretch is felt",
      "Drive hips forward to return",
    ],

    coachingCues: [
      "Feel the stretch in hamstrings",
      "Maintain flat back throughout",
      "This is NOT a squat - minimal knee bend",
      "Push ground away to return",
      "Bar stays close to legs",
    ],

    progressions: [
      { level: "Beginner", load: "25-30% BW", reps: "8-12" },
      { level: "Intermediate", load: "30-35% BW", reps: "6-10" },
      { level: "Advanced", load: "35-40% BW", reps: "5-8" },
    ],

    safetyNotes: [
      "Never round back",
      "Don't go past comfortable stretch",
      "Start light and build up",
      "Stop if lower back pain (not soreness)",
    ],

    benefits: [
      "Builds posterior chain strength",
      "Improves hip hinge pattern",
      "Develops hamstring flexibility",
      "Transfers directly to sprint power",
    ],
  },

  "Hip Thrusts": {
    category: "Posterior Chain",
    primaryMuscles: ["Glutes", "Hamstrings"],
    difficulty: "Beginner-Intermediate",
    equipment: ["Bench", "Barbell/dumbbells (optional)"],

    setup: [
      "Upper back on bench",
      "Feet flat on ground, hip-width",
      "Bar across hips (use pad)",
      "Start with hips lowered",
    ],

    execution: [
      "Drive through heels",
      "Thrust hips up to full extension",
      "Squeeze glutes hard at top",
      "Hold 1-2 seconds",
      "Lower under control",
    ],

    coachingCues: [
      "Full hip extension at top",
      "SQUEEZE glutes hard",
      "Don't hyperextend back",
      "Feel it in glutes, not back",
      "Control both up and down",
    ],

    progressions: [
      { level: "Beginner", load: "Bodyweight", reps: "12-15" },
      { level: "Intermediate", load: "Light weight", reps: "10-12" },
      { level: "Advanced", load: "Moderate weight", reps: "8-10" },
      { level: "Single-leg", load: "Bodyweight/light", reps: "8-10 each" },
    ],

    benefits: [
      "Best glute builder",
      "Improves hip extension power",
      "Helps sprint speed and acceleration",
      "Reduces injury risk",
    ],
  },

  "Glute-Ham Raises": {
    category: "Posterior Chain",
    primaryMuscles: ["Hamstrings", "Glutes", "Lower Back"],
    difficulty: "Advanced",
    equipment: ["GHR machine"],

    execution: [
      "Secure ankles in machine",
      "Start with torso upright",
      "Lower torso forward under control",
      "Use hamstrings and glutes to return",
      "Keep body straight throughout",
    ],

    coachingCues: [
      "Control the descent",
      "Don't break at hips",
      "Use full range of motion",
      "Squeeze glutes throughout",
    ],

    alternatives: [
      "Back extensions (if no GHR machine)",
      "Nordic curls (similar movement)",
      "Swiss ball hamstring curls",
    ],
  },

  // ==================== QUADRICEPS & KNEE ====================

  "Back Squats": {
    category: "Quadriceps & Knee",
    primaryMuscles: ["Quads", "Glutes", "Hamstrings"],
    secondaryMuscles: ["Core", "Back"],
    difficulty: "Intermediate-Advanced",
    equipment: ["Barbell", "Squat rack"],

    setup: [
      "Bar on upper back (not neck)",
      "Feet shoulder-width",
      "Toes slightly out",
      "Chest up, core braced",
    ],

    execution: [
      "Take deep breath, brace core",
      "Descend by pushing hips back and knees out",
      "Keep chest up",
      "Descend to depth (hip crease below knee)",
      "Drive through full foot to stand",
      "Breathe at top",
    ],

    coachingCues: [
      "Chest up throughout",
      "Knees track over toes (out, not in)",
      "Full depth if mobility allows",
      "Drive through whole foot",
      "Brace core hard",
    ],

    progressions: [
      { phase: "Foundation", load: "30-35% BW", sets: "3-4", reps: "8-12" },
      { phase: "Strength", load: "35-40% BW", sets: "4-5", reps: "5-8" },
      { phase: "Power", load: "35-40% BW", sets: "3-5", reps: "3-6" },
    ],

    loadLimit: "Maximum 40% body weight",

    safetyNotes: [
      "Always use squat rack with safeties",
      "Start light, build up slowly",
      "Never sacrifice form for weight",
      "Keep within 40% BW limit",
    ],

    alternatives: [
      "Goblet squats (if no rack)",
      "Safety bar squats",
      "Front squats",
    ],
  },

  "Goblet Squats": {
    category: "Quadriceps & Knee",
    primaryMuscles: ["Quads", "Glutes"],
    difficulty: "Beginner-Intermediate",
    equipment: ["Dumbbell or kettlebell"],

    setup: [
      "Hold weight at chest (goblet position)",
      "Feet shoulder-width",
      "Toes slightly out",
      "Elbows between knees",
    ],

    execution: [
      "Descend by pushing hips back",
      "Keep chest up and weight at chest",
      "Elbows track inside knees",
      "Full depth",
      "Drive up through heels",
    ],

    coachingCues: [
      "Elbows push knees out",
      "Chest stays up",
      "Weight stays at chest",
      "Great for learning squat pattern",
    ],

    benefits: [
      "Teaches proper squat mechanics",
      "Easier to learn than barbell",
      "Good for mobility work",
      "Safe progression",
    ],
  },

  "Bulgarian Split Squats": {
    category: "Quadriceps & Knee",
    primaryMuscles: ["Quads", "Glutes"],
    difficulty: "Intermediate",
    equipment: ["Bench", "Dumbbells (optional)"],

    setup: [
      "Rear foot elevated on bench",
      "Front foot 2-3 feet forward",
      "Upright torso",
      "Hold dumbbells at sides (optional)",
    ],

    execution: [
      "Lower straight down (not forward)",
      "Front leg does the work",
      "Back knee descends to ground",
      "Keep torso upright",
      "Drive through front heel to stand",
    ],

    coachingCues: [
      "Front leg is working leg",
      "Don't lean forward",
      "Straight up and down",
      "Balance challenge at first",
      "Both legs equally",
    ],

    benefits: [
      "Single-leg strength",
      "Addresses imbalances",
      "Great for knee stability",
      "Sport-specific strength",
    ],
  },

  "Walking Lunges": {
    category: "Quadriceps & Knee",
    primaryMuscles: ["Quads", "Glutes", "Hamstrings"],
    difficulty: "Beginner-Intermediate",
    equipment: ["Dumbbells (optional)", "Space to walk"],

    execution: [
      "Step forward into lunge",
      "Back knee nearly touches ground",
      "Front knee at 90°",
      "Upright torso",
      "Push through front heel to next step",
    ],

    coachingCues: [
      "Big steps",
      "Back knee down",
      "Chest up",
      "Continuous movement",
      "Control the descent",
    ],

    benefits: [
      "Dynamic lower body strength",
      "Balance and coordination",
      "Hip flexor mobility",
      "Functional movement",
    ],
  },

  "Single-Leg RDLs": {
    category: "Posterior Chain / Balance",
    primaryMuscles: ["Hamstrings", "Glutes"],
    secondaryMuscles: ["Core", "Balance"],
    difficulty: "Intermediate",
    equipment: ["Dumbbell or kettlebell (optional)"],

    execution: [
      "Stand on one leg",
      "Hinge at hip",
      "Free leg extends back",
      "Maintain straight line with body",
      "Feel hamstring stretch",
      "Return to standing",
    ],

    coachingCues: [
      "Balance challenge",
      "Keep hips square (don't rotate)",
      "Straight body line",
      "Feel hamstring stretch",
      "Control throughout",
    ],

    benefits: [
      "Single-leg strength",
      "Balance training",
      "Hamstring development",
      "Injury prevention",
    ],
  },

  // ==================== ANKLE & CALF ====================

  "Single-Leg Calf Raises": {
    category: "Ankle & Calf",
    primaryMuscles: ["Gastrocnemius", "Soleus"],
    difficulty: "Beginner-Intermediate",
    equipment: ["Step or elevated surface"],

    setup: [
      "Stand on one leg on step",
      "Forefoot on edge",
      "Heel below step level",
      "Hold wall for balance",
    ],

    execution: [
      "Rise up on toes (2s)",
      "Full range of motion",
      "Lower heel below step (2s)",
      "Control both directions",
      "Complete all reps one leg before switching",
    ],

    coachingCues: [
      "Slow tempo critical (2s up, 2s down)",
      "Full range both directions",
      "Balance with fingertips only",
      "Feel the calf working",
    ],

    progressions: [
      { level: "Beginner", reps: "10-12 each", tempo: "2-2" },
      { level: "Intermediate", reps: "12-15 each", tempo: "3-3" },
      { level: "Advanced", reps: "15-20 each", tempo: "3-3" },
      { level: "Weighted", load: "Dumbbell in hand", reps: "10-15" },
    ],

    benefits: [
      "Ankle strength and stability",
      "Sprint power development",
      "Injury prevention (Achilles)",
      "Plyometric preparation",
    ],
  },

  "Tibialis Raises": {
    category: "Ankle & Calf",
    primaryMuscles: ["Tibialis anterior"],
    difficulty: "Beginner",
    equipment: ["None or ankle weight"],

    setup: ["Stand with back against wall", "Heels on ground", "Toes in air"],

    execution: [
      "Lift toes toward shins",
      "Keep heels on ground",
      "Control up and down",
      "Feel front of shins working",
    ],

    coachingCues: [
      "Often overlooked but CRITICAL",
      "Prevents shin splints",
      "Toes to shins",
      "Control the movement",
    ],

    progressions: [
      { level: "Bodyweight", reps: "15-20" },
      { level: "Weighted", equipment: "Ankle weight", reps: "12-15" },
      { level: "Resistance band", reps: "15-20" },
    ],

    benefits: [
      "Shin splint prevention",
      "Ankle balance with calf work",
      "Dorsiflexion strength",
      "Sprint mechanics",
    ],
  },

  "Ankle Circles": {
    category: "Ankle & Calf / Mobility",
    primaryMuscles: ["Ankle complex"],
    difficulty: "Beginner",
    equipment: ["None"],

    execution: [
      "Lift foot off ground",
      "Point toes",
      "Make large circles",
      "Both directions",
      "Each ankle",
    ],

    coachingCues: [
      "Large circles",
      "Point toes fully",
      "Both directions equal",
      "Daily movement",
    ],

    benefits: ["Ankle mobility", "Warm-up essential", "Range of motion"],
  },

  // ==================== PLYOMETRICS & POWER ====================

  "Box Jumps": {
    category: "Plyometrics & Power",
    primaryMuscles: ["Full lower body"],
    difficulty: "Intermediate",
    equipment: ["Plyo box (12-30 inches)"],

    setup: [
      "Stand facing box",
      "Arms back",
      "Athletic stance",
      "Box height appropriate for level",
    ],

    execution: [
      "Swing arms and jump explosively",
      "Land softly on box",
      "Full hip extension at top",
      "Step down (don't jump down)",
      "Reset before next rep",
    ],

    coachingCues: [
      "EXPLOSIVE jump",
      "Soft landing",
      "Full hip extension at top",
      "STEP down (prevents injury)",
      "Quality over quantity",
    ],

    heightProgression: [
      { phase: "Foundation", height: "12-18 inches", sets: "3-4", reps: "3-5" },
      { phase: "Strength", height: "18-24 inches", sets: "4-5", reps: "3-4" },
      { phase: "Power", height: "24-30+ inches", sets: "5-6", reps: "2-3" },
    ],

    safetyNotes: [
      "ALWAYS step down, never jump down",
      "Start with low box",
      "Soft landings",
      "Stop if form breaks down",
    ],

    benefits: [
      "Explosive power development",
      "Vertical jump improvement",
      "Fast-twitch muscle activation",
      "Athletic power",
    ],
  },

  "Depth Jumps": {
    category: "Plyometrics & Power",
    primaryMuscles: ["Full lower body"],
    difficulty: "Advanced",
    equipment: ["Plyo boxes (6-18 inches)"],

    setup: ["Stand on box", "Arms ready", "Step off (don't jump off)"],

    execution: [
      "Step off box",
      "Land on both feet",
      "Immediately jump up explosively",
      "Minimal ground contact time",
      "Or stick landing for depth drops",
    ],

    coachingCues: [
      "Step off, don't jump off",
      "Absorb landing",
      "IMMEDIATE jump (for depth jump)",
      "Minimize ground time",
      "Maximum height on jump",
    ],

    variations: [
      {
        name: "Depth Drop",
        purpose: "Landing mechanics",
        execution: "Step off, stick landing, hold 3s",
      },
      {
        name: "Depth Jump",
        purpose: "Reactive power",
        execution: "Step off, immediate maximal jump",
      },
      {
        name: "Depth Drop to Sprint",
        purpose: "Sport-specific",
        execution: "Step off, land, sprint 10m",
      },
    ],

    progressions: [
      { level: "Beginner", height: "6 inches", focus: "Landing" },
      { level: "Intermediate", height: "12 inches", focus: "Reactive" },
      { level: "Advanced", height: "18 inches", focus: "Max power" },
    ],

    safetyNotes: [
      "Advanced exercise - need base strength first",
      "Start LOW (6 inches)",
      "Perfect landing mechanics required",
      "Stop if ground contact time increases",
    ],

    benefits: [
      "Maximum reactive power",
      "Elastic energy utilization",
      "Sprint speed transfer",
      "CNS activation",
    ],
  },

  "Broad Jumps": {
    category: "Plyometrics & Power",
    primaryMuscles: ["Full lower body"],
    difficulty: "Intermediate",
    equipment: ["Open space", "Measuring tape"],

    execution: [
      "Start in athletic stance",
      "Swing arms back",
      "Jump forward explosively",
      "Drive arms forward and up",
      "Land and stick",
    ],

    coachingCues: [
      "Jump for DISTANCE",
      "Use arms aggressively",
      "Triple extension (ankle, knee, hip)",
      "Stick the landing",
      "Measure and track distance",
    ],

    benefits: [
      "Horizontal power (sprint-specific)",
      "Assessable (measure progress)",
      "Full body coordination",
      "Athletic power indicator",
    ],
  },

  Bounds: {
    category: "Plyometrics & Power",
    primaryMuscles: ["Full lower body"],
    difficulty: "Intermediate-Advanced",
    equipment: ["Open space (30-40m)"],

    variations: [
      {
        name: "Single-Leg Bounds",
        execution: "Bound on same leg repeatedly",
        sets: "4-6",
        distance: "30m each leg",
        rest: "2-3 min",
        coaching: [
          "Max distance per bound",
          "Powerful push-off",
          "Stick landing",
        ],
        importance: "KEY exercise for sprint power",
      },
      {
        name: "Alternate Leg Bounds",
        execution: "Like exaggerated running",
        sets: "4-6",
        distance: "30-40m",
        rest: "2-3 min",
        coaching: ["Big strides", "Powerful each step", "Sprint mechanics"],
      },
      {
        name: "Double-Leg Bounds",
        execution: "Continuous jumping forward",
        sets: "3-5",
        distance: "20-30m",
        rest: "2 min",
        coaching: ["Max distance each jump", "Continuous"],
      },
      {
        name: "Box-to-Box Bounds",
        execution: "Bound between boxes",
        sets: "4-5",
        reps: "5-8 bounds",
        rest: "2-3 min",
        coaching: ["Stick each landing", "Immediate next bound"],
      },
    ],

    coachingCues: [
      "This IS sprint training",
      "Max distance per ground contact",
      "Powerful push-off each rep",
      "Quality over quantity",
      "Full recovery between sets",
    ],

    benefits: [
      "THE best horizontal power developer",
      "Direct sprint speed transfer",
      "Stride length improvement",
      "Elastic strength",
    ],
  },

  "Tuck Jumps": {
    category: "Plyometrics & Power",
    primaryMuscles: ["Full lower body"],
    difficulty: "Intermediate",
    equipment: ["None"],

    execution: [
      "Jump vertically",
      "Pull knees to chest",
      "Land softly",
      "Immediate next rep",
    ],

    coachingCues: [
      "Max height",
      "Knees to chest",
      "Fast ground contact",
      "Continuous reps",
    ],

    benefits: ["Reactive power", "Core strength", "Coordination"],
  },

  "Hurdle Hops": {
    category: "Plyometrics & Power",
    primaryMuscles: ["Full lower body"],
    difficulty: "Intermediate-Advanced",
    equipment: ["Mini hurdles (6-18 inches)"],

    variations: [
      {
        name: "Forward Hurdle Hops",
        execution: "Continuous forward hops over hurdles",
        sets: "4-6",
        reps: "6-10 hurdles",
        coaching: [
          "Continuous rhythm",
          "Minimize ground time",
          "Soft landings",
        ],
      },
      {
        name: "Lateral Hurdle Hops",
        execution: "Side-to-side over hurdles",
        sets: "4-5",
        reps: "6-8 hurdles",
        coaching: ["Push off laterally", "Control landing", "Both directions"],
      },
      {
        name: "Single-Leg Hurdle Hops",
        execution: "One leg over hurdles",
        sets: "3-4",
        reps: "4-6 hurdles each leg",
        coaching: ["Balance", "Power", "Control"],
      },
    ],

    coachingCues: [
      "Rhythm and flow",
      "Consistent height",
      "Fast ground contact",
      "Quality mechanics",
    ],

    benefits: [
      "Reactive power",
      "Coordination",
      "Rhythm development",
      "Multi-directional power",
    ],
  },

  // ==================== SPRINT MECHANICS & DRILLS ====================

  "A-March": {
    category: "Sprint Mechanics",
    difficulty: "Beginner",
    equipment: ["Space (20m)"],

    execution: [
      "March with exaggerated knee drive",
      "Drive knee to 90° (thigh parallel to ground)",
      "Ankle dorsiflexed (toes up)",
      "Opposite arm drives",
      "Land on forefoot",
      "Tall posture",
    ],

    coachingCues: [
      "High knees",
      "Toes up (dorsiflexion critical)",
      "Arm drive opposite leg",
      "Tall through core",
      "This teaches proper sprint mechanics",
    ],

    progression: "A-March → A-Skip → A-Run",

    benefits: [
      "Teaches knee drive",
      "Ankle positioning",
      "Arm coordination",
      "Foundation of sprint mechanics",
    ],
  },

  "A-Skip": {
    category: "Sprint Mechanics",
    difficulty: "Beginner-Intermediate",
    equipment: ["Space (20m)"],

    execution: [
      "Skipping motion with sprint mechanics",
      "High knee drive (90°)",
      "Dorsiflexed ankle",
      "Bounce and rhythm",
      "Arm drive coordination",
    ],

    coachingCues: [
      "Skip pattern with sprint mechanics",
      "High knees",
      "Toes up",
      "Rhythm and bounce",
      "Progress from A-March",
    ],

    benefits: [
      "Sprint mechanics with rhythm",
      "Elastic component",
      "Coordination",
      "Neural patterning",
    ],
  },

  "B-Skip": {
    category: "Sprint Mechanics",
    difficulty: "Intermediate",
    equipment: ["Space (20m)"],

    execution: [
      "A-Skip pattern",
      "Extend leg forward",
      "Pull back (paw) to ground",
      "Aggressive ground contact",
      "Skip rhythm",
    ],

    coachingCues: [
      "Knee up",
      "Extend forward",
      "PAW back to ground",
      "Aggressive contact",
      "This is KEY for top speed",
    ],

    benefits: [
      "Pawing action (max velocity)",
      "Hamstring activation",
      "Ground force production",
      "Advanced sprint mechanics",
    ],
  },

  // I'll continue with more exercises in the next section...

  "Wall Drills": {
    category: "Sprint Mechanics",
    difficulty: "Beginner-Intermediate",
    equipment: ["Wall"],

    variations: [
      {
        name: "Wall Drive (March)",
        execution: "Lean on wall, drive knee up repeatedly",
        sets: "3-4",
        duration: "20s each leg",
        coaching: ["Fast knee drive", "Ankle dorsiflexed", "Drive position"],
      },
      {
        name: "Wall Sprint",
        execution: "Sprint motion against wall",
        sets: "4-6",
        duration: "10-15s max effort",
        coaching: ["Maximum speed", "Perfect mechanics", "Full range"],
      },
    ],

    benefits: [
      "Sprint mechanics without space",
      "Maximum effort practice",
      "Neural activation",
      "Indoor alternative",
    ],
  },

  // ==================== CORE & STABILITY ====================

  Plank: {
    category: "Core & Stability",
    primaryMuscles: ["Core", "Shoulders"],
    difficulty: "Beginner-Intermediate",
    equipment: ["None"],

    setup: [
      "Forearms on ground",
      "Elbows under shoulders",
      "Straight body line",
      "Feet together or apart",
    ],

    execution: [
      "Hold position",
      "Straight line head to heels",
      "Don't sag hips",
      "Don't pike hips up",
      "Breathe normally",
      "Engage everything",
    ],

    coachingCues: [
      "Straight body line",
      "Squeeze glutes",
      "Brace core",
      "Don't hold breath",
      "Quality over time",
    ],

    progressions: [
      { level: "Beginner", duration: "30-45s" },
      { level: "Intermediate", duration: "60-90s" },
      { level: "Advanced", duration: "90s+" },
      { level: "Weighted", equipment: "Plate on back", duration: "45-60s" },
    ],

    variations: [
      "Side plank (30-60s each side)",
      "Plank with leg lift",
      "Plank to push-up",
      "Copenhagen plank (adductor emphasis)",
    ],
  },

  "Copenhagen Plank": {
    category: "Core & Stability",
    primaryMuscles: ["Adductors", "Core"],
    difficulty: "Advanced",
    equipment: ["Bench"],

    setup: [
      "Side plank position",
      "Top leg on bench",
      "Bottom leg in air",
      "Forearm on ground",
    ],

    execution: [
      "Hold position",
      "Straight body line",
      "Top leg presses on bench",
      "Bottom leg stays in air",
      "No sagging",
    ],

    coachingCues: [
      "CRITICAL for groin injury prevention",
      "Press top leg into bench",
      "Straight body",
      "Advanced exercise",
      "Both sides equal time",
    ],

    progressions: [
      { level: "Beginner", duration: "20-30s each" },
      { level: "Intermediate", duration: "45-60s each" },
      { level: "Advanced", duration: "60s+" },
    ],

    benefits: [
      "Adductor strength",
      "Groin injury prevention (critical for athletes)",
      "Core stability",
      "Lateral stability",
    ],
  },

  "Dead Bugs": {
    category: "Core & Stability",
    primaryMuscles: ["Core", "Hip Flexors"],
    difficulty: "Beginner-Intermediate",
    equipment: ["None"],

    execution: [
      "Lie on back",
      "Arms straight up",
      "Knees at 90°",
      "Lower opposite arm and leg",
      "Maintain lower back contact with ground",
      "Alternate sides",
    ],

    coachingCues: [
      "Keep back flat on ground",
      "Slow and controlled",
      "Breathe normally",
      "Opposite arm and leg",
      "Core stability focus",
    ],

    benefits: [
      "Core stability",
      "Anti-extension strength",
      "Coordination",
      "Lower back health",
    ],
  },

  "Bird Dogs": {
    category: "Core & Stability",
    primaryMuscles: ["Core", "Back", "Glutes"],
    difficulty: "Beginner-Intermediate",
    equipment: ["None"],

    execution: [
      "Hands and knees position",
      "Extend opposite arm and leg",
      "Hold straight line",
      "Don't rotate",
      "Return and alternate",
    ],

    coachingCues: [
      "Straight line",
      "No rotation",
      "Controlled movement",
      "Both sides equal",
    ],

    benefits: ["Core stability", "Balance", "Posterior chain", "Coordination"],
  },

  // ==================== UPPER BODY (General & QB) ====================

  "Push-Ups": {
    category: "Upper Body",
    primaryMuscles: ["Chest", "Shoulders", "Triceps"],
    secondaryMuscles: ["Core"],
    difficulty: "Beginner-Intermediate",
    equipment: ["None"],

    execution: [
      "Hands shoulder-width",
      "Straight body line",
      "Lower chest to ground",
      "Elbows 45° to body",
      "Push back up",
      "Full range of motion",
    ],

    coachingCues: [
      "Straight body line",
      "Don't sag hips",
      "Full range of motion",
      "Control both directions",
      "Breathe",
    ],

    progressions: [
      { level: "Beginner", modification: "Incline push-ups", reps: "10-15" },
      { level: "Intermediate", modification: "Standard", reps: "15-25" },
      { level: "Advanced", modification: "Decline or weighted", reps: "20-30" },
      { level: "Elite", modification: "Plyometric/clap", reps: "10-15" },
    ],

    benefits: [
      "Upper body pushing strength",
      "Core stability",
      "Functional strength",
      "No equipment needed",
    ],
  },

  "Pull-Ups / Chin-Ups": {
    category: "Upper Body",
    primaryMuscles: ["Lats", "Back", "Biceps"],
    secondaryMuscles: ["Core", "Grip"],
    difficulty: "Intermediate-Advanced",
    equipment: ["Pull-up bar"],

    variations: [
      {
        name: "Pull-Ups (overhand)",
        grip: "Palms away",
        emphasis: "Back and lats",
      },
      {
        name: "Chin-Ups (underhand)",
        grip: "Palms toward you",
        emphasis: "Biceps and lats",
      },
    ],

    execution: [
      "Hang from bar",
      "Pull chest to bar",
      "Control down",
      "Full range",
      "No kipping",
    ],

    coachingCues: [
      "Full range of motion",
      "Control the negative",
      "Chest to bar",
      "No swinging",
      "Use assistance if needed",
    ],

    progressions: [
      { level: "Beginner", modification: "Band-assisted", reps: "5-8" },
      { level: "Intermediate", modification: "Bodyweight", reps: "8-12" },
      { level: "Advanced", modification: "Weighted", reps: "10-15" },
    ],

    benefits: [
      "Back strength (critical for QB throwing)",
      "Grip strength",
      "Lat development",
      "Upper body pulling",
    ],
  },

  "Rows (Dumbbell/Barbell)": {
    category: "Upper Body",
    primaryMuscles: ["Back", "Lats", "Rhomboids"],
    secondaryMuscles: ["Biceps", "Core"],
    difficulty: "Beginner-Intermediate",
    equipment: ["Dumbbells or barbell"],

    variations: [
      {
        name: "Bent-Over Barbell Rows",
        execution: "Hinge at hips, pull bar to stomach",
        coaching: ["Flat back", "Pull to stomach", "Squeeze shoulder blades"],
      },
      {
        name: "Single-Arm Dumbbell Rows",
        execution: "One hand on bench, row DB up",
        coaching: ["Don't rotate", "Pull elbow back", "Squeeze at top"],
      },
      {
        name: "Inverted Rows",
        execution: "Under bar, pull chest to bar",
        equipment: "Bar or TRX",
        coaching: ["Straight body", "Chest to bar", "Bodyweight option"],
      },
    ],

    coachingCues: [
      "Keep back flat",
      "Pull elbows back",
      "Squeeze shoulder blades",
      "Control the weight",
      "Feel it in back, not arms",
    ],

    benefits: [
      "Back strength and thickness",
      "Shoulder health",
      "Posture improvement",
      "Balance push-ups/pressing",
    ],
  },

  "Overhead Press": {
    category: "Upper Body",
    primaryMuscles: ["Shoulders", "Triceps"],
    secondaryMuscles: ["Core", "Upper back"],
    difficulty: "Intermediate",
    equipment: ["Barbell or dumbbells"],

    execution: [
      "Start at shoulder height",
      "Press straight overhead",
      "Lock out arms",
      "Control down to shoulders",
      "Keep core braced",
    ],

    coachingCues: [
      "Straight bar path",
      "Full lockout",
      "Don't arch back excessively",
      "Brace core hard",
      "Control the descent",
    ],

    loadLimit: "Keep conservative for shoulder health",

    benefits: [
      "Shoulder strength (QB velocity)",
      "Overhead stability",
      "Core strength",
      "Athletic pressing power",
    ],
  },

  // ==================== CONDITIONING ====================

  "Tempo Runs": {
    category: "Conditioning",
    primaryMuscles: ["Aerobic system", "Full body"],
    difficulty: "Beginner-Intermediate",
    equipment: ["Track or measured course"],

    protocol: {
      distance: "100-200m repeats",
      pace: "70-75% max speed",
      rest: "60-90 seconds between reps",
      volume: "1000-2000m total",
      purpose: "Aerobic development + recovery",
    },

    execution: [
      "Controlled, smooth running",
      "Focus on mechanics",
      "Stay relaxed",
      "Consistent pace",
      "Active recovery between",
    ],

    coachingCues: [
      "NOT sprinting - 70-75% effort",
      "Perfect mechanics",
      "Stay relaxed",
      "This is recovery work",
      "Builds aerobic base",
    ],

    phaseProgression: [
      { phase: "Foundation", volume: "1000-1200m", reps: "8-10×100m" },
      { phase: "Strength", volume: "1200-1600m", reps: "8-10×150m" },
      { phase: "Power", volume: "800-1200m", reps: "Maintenance" },
    ],

    benefits: [
      "Aerobic base development",
      "Active recovery",
      "Sprint mechanics practice",
      "Injury prevention",
      "Work capacity",
    ],
  },

  "Interval Training": {
    category: "Conditioning",
    difficulty: "Intermediate-Advanced",
    equipment: ["Track or field"],

    variations: [
      {
        name: "Short Intervals (Speed Endurance)",
        protocol: "8-12×100m @ 85-90% with 2-3 min rest",
        purpose: "Speed maintenance under fatigue",
        phase: "Strength & Power",
      },
      {
        name: "Medium Intervals",
        protocol: "6-8×200m @ 80-85% with 3-4 min rest",
        purpose: "Lactate tolerance",
        phase: "Power",
      },
      {
        name: "Long Intervals (Aerobic Power)",
        protocol: "4-6×400m @ 75-80% with 4-5 min rest",
        purpose: "Aerobic capacity",
        phase: "Foundation",
      },
    ],

    coachingCues: [
      "Hit target pace",
      "Full recovery between reps",
      "Quality over quantity",
      "Stop if pace drops significantly",
    ],

    benefits: [
      "Lactate tolerance",
      "Speed endurance",
      "Mental toughness",
      "Game conditioning",
    ],
  },

  "Repeated Sprint Ability (RSA)": {
    category: "Conditioning",
    difficulty: "Advanced",
    equipment: ["Track or field"],

    protocol: {
      name: "Game Simulation",
      sprints: "10-15 sprints",
      distance: "20-40m each",
      rest: "20-30 seconds between",
      intensity: "Maximum effort each rep",
      purpose: "Simulate game demands (40+ sprints)",
    },

    execution: [
      "Maximum effort each sprint",
      "Short rest (20-30s)",
      "Maintain quality throughout",
      "Track times if possible",
    ],

    coachingCues: [
      "THIS IS THE GAME",
      "Max effort every sprint",
      "Short rest = game realistic",
      "Mental toughness builder",
      "Track performance drop-off",
    ],

    phaseProgression: [
      {
        phase: "Foundation",
        volume: "6-8 sprints",
        rest: "30s",
        note: "Build capacity",
      },
      {
        phase: "Strength",
        volume: "8-12 sprints",
        rest: "25s",
        note: "Increase volume",
      },
      {
        phase: "Power",
        volume: "12-15 sprints",
        rest: "20s",
        note: "Game simulation",
      },
    ],

    benefits: [
      "Game-specific conditioning",
      "Sprint repeatability",
      "Mental toughness",
      "Performance under fatigue",
      "40+ sprint capacity",
    ],
  },

  "Shuttle Runs": {
    category: "Conditioning / Agility",
    difficulty: "Intermediate",
    equipment: ["Cones", "Space"],

    variations: [
      {
        name: "Pro Agility (5-10-5)",
        setup: "3 cones 5 yards apart",
        execution: "Sprint 5y, touch, sprint 10y, touch, sprint 5y back",
        purpose: "Change of direction + conditioning",
      },
      {
        name: "300-Yard Shuttle",
        setup: "25-yard markers",
        execution: "6×25 yards (down and back 3 times)",
        purpose: "Conditioning + mental toughness",
      },
    ],

    coachingCues: [
      "Low on changes of direction",
      "Touch the line",
      "Sprint through finish",
      "This is HARD - embrace it",
    ],

    benefits: [
      "Change of direction",
      "Conditioning",
      "Mental toughness",
      "Sport-specific movement",
    ],
  },

  // ==================== ISOMETRIC EXERCISES ====================

  "Isometric Squat Holds": {
    category: "Isometric / Strength",
    primaryMuscles: ["Quads", "Glutes"],
    difficulty: "Intermediate-Advanced",
    equipment: ["Squat rack", "Barbell"],

    protocol: {
      positions: [
        {
          name: "Quarter squat",
          angle: "140-150°",
          purpose: "Max force production",
        },
        {
          name: "Parallel squat",
          angle: "90°",
          purpose: "Sport-specific strength",
        },
        {
          name: "Deep squat",
          angle: "60-70°",
          purpose: "Bottom position strength",
        },
      ],
      duration: "4-6 seconds max effort",
      sets: "3-5 sets per position",
      rest: "2-3 minutes",
      load: "Submaximal (focus on force production)",
    },

    execution: [
      "Set up in squat rack with safeties",
      "Get into target position",
      "Push UP into bar maximally for 4-6s",
      "Full effort against immovable resistance",
      "Rest and repeat",
    ],

    coachingCues: [
      "PUSH maximally into bar",
      "4-6 seconds max effort",
      "This builds neural drive",
      "Not about moving weight - about FORCE",
      "Full recovery between sets",
    ],

    phaseUsage: {
      foundation: "Introduce concept, 3-4s holds",
      strength: "Max effort 5-6s holds",
      power: "Paired with explosive movements",
    },

    benefits: [
      "Neural drive improvement",
      "Max strength development",
      "No eccentric fatigue",
      "Paired with plyos = explosive power",
      "Unique strength stimulus",
    ],
  },

  "Isometric Deadlift Pulls": {
    category: "Isometric / Strength",
    primaryMuscles: ["Full posterior chain"],
    difficulty: "Advanced",
    equipment: ["Barbell", "Rack or pins"],

    protocol: {
      positions: [
        { name: "Below knee", purpose: "Hamstring/glute max force" },
        { name: "Above knee", purpose: "Hip extension power" },
      ],
      duration: "5-6 seconds max effort",
      sets: "3-4 sets per position",
      rest: "2-3 minutes",
    },

    execution: [
      "Set bar at target height on pins",
      "Get into deadlift position",
      "Pull UP maximally for 5-6s",
      "Bar doesn't move - you create force",
      "Maintain position throughout",
    ],

    coachingCues: [
      "PULL maximally",
      "Maintain perfect position",
      "5-6 seconds max effort",
      "Feel entire posterior chain",
      "Neural drive focus",
    ],

    benefits: [
      "Posterior chain max force",
      "Sprint power transfer",
      "Neural adaptations",
      "No eccentric damage",
      "Paired with sprint work",
    ],
  },

  // ==================== MOBILITY & FLEXIBILITY ====================

  "Couch Stretch": {
    category: "Mobility & Flexibility",
    primaryMuscles: ["Hip flexors", "Quads"],
    difficulty: "Beginner-Intermediate",
    equipment: ["Couch or bench"],

    execution: [
      "Back knee on ground against couch",
      "Back foot on couch",
      "Front foot forward in lunge",
      "Upright torso",
      "Feel stretch in hip flexor",
      "Hold 90-120 seconds each side",
    ],

    coachingCues: [
      "CRITICAL for QB hip flexibility",
      "Don't arch lower back",
      "Upright torso",
      "Deep stretch - embrace it",
      "Both sides equal time",
      "Daily practice ideal",
    ],

    benefits: [
      "Hip flexor flexibility (critical for throwing)",
      "Improves stride length 8-12%",
      "Reduces tight hip flexor velocity loss",
      "Better sprint mechanics",
      "Injury prevention",
    ],

    qbImportance:
      "NON-NEGOTIABLE for QB velocity - tight hip flexors reduce velocity 15-20%",
  },

  "Pigeon Pose": {
    category: "Mobility & Flexibility",
    primaryMuscles: ["Hip external rotators", "Glutes"],
    difficulty: "Beginner-Intermediate",
    equipment: ["None"],

    execution: [
      "Front leg bent at 90°",
      "Back leg extended straight",
      "Square hips forward",
      "Lean forward for deeper stretch",
      "Hold 90-120 seconds each side",
    ],

    coachingCues: [
      "Square hips",
      "Keep chest up initially",
      "Lean forward to deepen",
      "Breathe into stretch",
      "Both sides",
    ],

    benefits: [
      "Hip mobility",
      "External rotation",
      "Injury prevention",
      "Recovery tool",
    ],
  },

  "90/90 Hip Stretch": {
    category: "Mobility & Flexibility",
    primaryMuscles: ["Hip complex"],
    difficulty: "Beginner",
    equipment: ["None"],

    execution: [
      "Sit with both legs at 90°",
      "One in front, one to side",
      "Upright torso",
      "Hold position",
      "Switch sides",
    ],

    coachingCues: [
      "Both legs 90°",
      "Upright posture",
      "Feel hip stretch",
      "Both sides equal time",
    ],

    benefits: [
      "Hip mobility all planes",
      "Internal/external rotation",
      "Joint health",
      "Movement quality",
    ],
  },

  "Foam Rolling": {
    category: "Mobility & Recovery",
    difficulty: "Beginner",
    equipment: ["Foam roller"],

    protocol: {
      areas: [
        {
          muscle: "Calves",
          duration: "60-90s each",
          technique: "Slow rolls + holds",
        },
        { muscle: "Hamstrings", duration: "90s each", technique: "Slow rolls" },
        {
          muscle: "Quads",
          duration: "90-120s each",
          technique: "Find trigger points",
        },
        {
          muscle: "Hip flexors",
          duration: "60s each",
          technique: "Gentle pressure",
        },
        {
          muscle: "Glutes",
          duration: "60-90s each",
          technique: "Cross leg for depth",
        },
        { muscle: "IT band", duration: "60s each", technique: "Side lying" },
        { muscle: "Upper back", duration: "60-90s", technique: "Support neck" },
        { muscle: "Lats", duration: "45-60s each", technique: "Arm overhead" },
      ],
      timing: "Daily (15 min) or post-workout",
      intensity: "Uncomfortable but tolerable",
    },

    execution: [
      "Slow, controlled movement",
      "Pause on trigger points",
      "Breathe through discomfort",
      "Spend time on tight areas",
    ],

    coachingCues: [
      "Daily practice ideal",
      "Slow is better than fast",
      "Find the tight spots",
      "Breathe",
      "Part of Sunday recovery protocol",
    ],

    benefits: [
      "Muscle recovery",
      "Trigger point release",
      "Blood flow improvement",
      "Movement quality",
      "Daily maintenance tool",
    ],
  },

  "Dynamic Stretching": {
    category: "Mobility & Warm-Up",
    difficulty: "Beginner",
    equipment: ["Space"],

    exercises: [
      {
        name: "Leg Swings (Front-Back)",
        reps: "10-15 each leg",
        coaching: ["Control the swing", "Full range", "Hold for balance"],
      },
      {
        name: "Leg Swings (Side-Side)",
        reps: "10-15 each leg",
        coaching: ["Across body and out", "Hip mobility", "Control"],
      },
      {
        name: "Walking Lunges with Twist",
        reps: "10 each leg",
        coaching: [
          "Lunge + rotate toward front leg",
          "Hip mobility + rotation",
        ],
      },
      {
        name: "Inchworms",
        reps: "8-10",
        coaching: [
          "Walk hands out to plank",
          "Walk feet to hands",
          "Full body",
        ],
      },
      {
        name: "World's Greatest Stretch",
        reps: "5 each side",
        coaching: [
          "Lunge + elbow to instep + rotate + reach",
          "Multiple planes",
        ],
      },
    ],

    timing: "Pre-workout warm-up",

    benefits: [
      "Movement preparation",
      "Range of motion",
      "Muscle activation",
      "Better than static stretching pre-workout",
    ],
  },

  // ==================== CHANGE OF DIRECTION ====================

  "Pro Agility Drill": {
    category: "Agility / Assessment",
    difficulty: "Intermediate",
    equipment: ["Cones", "Stopwatch"],

    protocol: {
      setup: "3 cones, 5 yards apart",
      execution:
        "Sprint 5y right, touch, sprint 10y left, touch, sprint 5y right through finish",
      assessment: "Timed test",
      scoring: {
        excellent: "< 4.0s",
        good: "4.0-4.3s",
        average: "4.3-4.6s",
        needsWork: "> 4.6s",
      },
    },

    coachingCues: [
      "Low on changes of direction",
      "Plant and drive",
      "Touch the line",
      "Sprint through finish",
      "Both directions (flip start)",
    ],

    benefits: [
      "Change of direction assessment",
      "Lateral agility",
      "Sport-specific",
      "Trackable progress",
    ],
  },

  "L-Drill (3-Cone)": {
    category: "Agility / Assessment",
    difficulty: "Intermediate-Advanced",
    equipment: ["3 cones", "Stopwatch"],

    protocol: {
      setup: "3 cones in L-shape (5 yards between)",
      execution:
        "Sprint to cone 1, back to start, to cone 1, around cone 2, around cone 3, finish",
      assessment: "Timed test",
    },

    coachingCues: [
      "Low around cones",
      "Fast footwork",
      "Sharp cuts",
      "Maximum effort",
    ],

    benefits: [
      "Multi-directional agility",
      "Assessment tool",
      "Sport-specific patterns",
      "Competitive element",
    ],
  },
};

export default EXERCISE_LIBRARY;
