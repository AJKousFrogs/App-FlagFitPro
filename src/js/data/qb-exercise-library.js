/**
 * QB-Specific Exercise Library
 * Specialized exercises for quarterback development
 * Focuses on: Arm strength, shoulder health, hip flexibility, throwing mechanics
 */

/**
 * Exercise Categories:
 * - Rotator Cuff Strengthening
 * - Shoulder Mobility & Health
 * - Hip Flexor Flexibility
 * - Back Strength (Throwing Power)
 * - Throwing Mechanics Drills
 * - Arm Strengthening
 * - Forearm & Grip
 * - Core for Throwing
 */

export const QB_EXERCISE_LIBRARY = {
  // ==================== ROTATOR CUFF STRENGTHENING ====================

  "Band External Rotation": {
    category: "Rotator Cuff",
    primaryMuscles: ["Infraspinatus", "Teres minor"],
    difficulty: "Beginner-Intermediate",
    equipment: ["Resistance band"],
    importance:
      "CRITICAL - Rotator cuff strength correlates with velocity (r=0.72)",

    setup: [
      "Attach band at elbow height",
      "Stand sideways to anchor",
      "Elbow at 90° tucked to side",
      "Start with hand across body",
    ],

    execution: [
      "Keep elbow pinned to side",
      "Rotate forearm away from body",
      "Control both directions",
      "Maintain 90° elbow angle",
      "Full range of motion",
    ],

    coachingCues: [
      "Elbow STAYS at side",
      "Slow and controlled (2s out, 2s in)",
      "Feel it in back of shoulder",
      "This is 30% of throwing power",
      "Daily work ideal",
    ],

    protocol: {
      sets: "2-3",
      reps: "15 each arm",
      tempo: "2-0-2",
      frequency: "Daily or every throwing session",
      progression: "Increase band resistance, not speed",
    },

    benefits: [
      "Primary velocity generator",
      "Shoulder stability",
      "Injury prevention (50-60% risk reduction)",
      "Throwing power foundation",
    ],
  },

  "Band Internal Rotation": {
    category: "Rotator Cuff",
    primaryMuscles: ["Subscapularis"],
    difficulty: "Beginner-Intermediate",
    equipment: ["Resistance band"],

    setup: [
      "Attach band at elbow height",
      "Stand sideways to anchor",
      "Elbow at 90° tucked to side",
      "Start with hand out",
    ],

    execution: [
      "Keep elbow at side",
      "Rotate forearm across body",
      "Control the movement",
      "Full range",
      "Slow tempo",
    ],

    coachingCues: [
      "Balance with external rotation",
      "Elbow stays pinned",
      "Controlled movement",
      "Feel front of shoulder working",
    ],

    protocol: {
      sets: "2-3",
      reps: "12-15 each arm",
      tempo: "2-0-2",
      frequency: "Daily",
    },

    benefits: [
      "Shoulder balance",
      "Anterior shoulder strength",
      "Injury prevention",
      "Rotator cuff completeness",
    ],
  },

  "I-Y-T Raises": {
    category: "Rotator Cuff / Scapular",
    primaryMuscles: ["Rotator cuff complex", "Lower traps", "Rhomboids"],
    difficulty: "Beginner-Intermediate",
    equipment: ["Light dumbbells (2-5 lbs) or bodyweight"],

    variations: [
      {
        name: "I Raise",
        position: "Arms straight overhead (I shape)",
        execution: "Thumbs up, lift arms off ground",
        emphasis: "Upper back and shoulder stability",
      },
      {
        name: "Y Raise",
        position: "Arms at 45° angle (Y shape)",
        execution: "Thumbs up, lift arms off ground",
        emphasis: "Lower traps and scapular control",
      },
      {
        name: "T Raise",
        position: "Arms straight out to sides (T shape)",
        execution: "Thumbs up, lift arms off ground",
        emphasis: "Mid traps and posterior deltoid",
      },
    ],

    execution: [
      "Lie face down on bench or ground",
      "Thumbs pointing up (externally rotated)",
      "Lift arms off surface",
      "Hold 1-2 seconds at top",
      "Lower slowly",
    ],

    coachingCues: [
      "Light weight or bodyweight",
      "Thumbs UP (external rotation critical)",
      "Slow and controlled",
      "Feel shoulder blades working",
      "Quality over quantity",
    ],

    protocol: {
      sets: "2-3 sets of each variation",
      reps: "10-12 per variation",
      weight: "Very light (2-5 lbs max)",
      frequency: "3-4x per week",
    },

    benefits: [
      "Scapular stability and control",
      "Lower trap strength (prevents dyskinesis)",
      "Shoulder health",
      "Posture improvement",
      "Throwing mechanics foundation",
    ],
  },

  "Cuban Press": {
    category: "Rotator Cuff / Shoulder",
    primaryMuscles: ["Rotator cuff", "Deltoids"],
    difficulty: "Intermediate",
    equipment: ["Light dumbbells"],

    execution: [
      "Start with dumbbells at sides",
      "Upright row to chest height",
      "Rotate forearms up (external rotation)",
      "Press overhead",
      "Reverse the movement",
    ],

    coachingCues: [
      "LIGHT weight (5-10 lbs)",
      "Control each phase",
      "External rotation is key",
      "This is rehab/prehab, not strength",
      "Perfect form required",
    ],

    protocol: {
      sets: "2-3",
      reps: "8-10",
      weight: "5-10 lbs",
      frequency: "2-3x per week",
    },

    benefits: [
      "Complete rotator cuff activation",
      "Dynamic shoulder stability",
      "Overhead strength",
      "Injury prevention",
    ],
  },

  // ==================== SHOULDER MOBILITY & HEALTH ====================

  "Sleeper Stretch": {
    category: "Shoulder Mobility",
    primaryMuscles: ["Posterior capsule", "Infraspinatus"],
    difficulty: "Beginner",
    equipment: ["None"],
    importance:
      "MANDATORY post-throwing - prevents posterior shoulder tightness",

    execution: [
      "Lie on throwing shoulder side",
      "Shoulder at 90° in front",
      "Elbow at 90°",
      "Use other hand to push throwing hand toward ground",
      "Feel stretch in back of shoulder",
      "Hold 60-90 seconds",
    ],

    coachingCues: [
      "Do this AFTER EVERY throwing session",
      "60-90 second holds minimum",
      "Breathe into stretch",
      "Should feel deep in shoulder",
      "This prevents velocity loss",
    ],

    protocol: {
      sets: "3-4",
      duration: "60-90 seconds each",
      frequency: "After every throw session + daily",
    },

    benefits: [
      "Prevents posterior shoulder tightness",
      "Maintains internal rotation ROM",
      "Velocity maintenance",
      "Injury prevention (critical)",
      "Essential recovery tool",
    ],

    requirement: "110-130° external rotation needed for optimal release",
  },

  "Doorway Pec Stretch": {
    category: "Shoulder Mobility",
    primaryMuscles: ["Pectorals", "Anterior shoulder"],
    difficulty: "Beginner",
    equipment: ["Doorway"],

    execution: [
      "Forearm on doorframe",
      "Elbow at 90°",
      "Step through doorway",
      "Feel stretch in chest/front shoulder",
      "Hold 60-90 seconds each side",
    ],

    coachingCues: [
      "Don't force it",
      "Breathe deeply",
      "Both sides equal",
      "Daily practice",
    ],

    protocol: {
      duration: "60-90 seconds each side",
      frequency: "Daily, especially pre-throwing",
    },

    benefits: [
      "Opens up chest",
      "Improves horizontal abduction (45-55° needed)",
      "Better throwing mechanics",
      "Posture improvement",
    ],
  },

  "Wall Slides": {
    category: "Shoulder Mobility / Scapular",
    primaryMuscles: ["Scapular stabilizers", "Shoulders"],
    difficulty: "Beginner",
    equipment: ["Wall"],

    execution: [
      "Back against wall",
      "Arms in 'W' position",
      "Slide arms up wall",
      "Keep contact with wall",
      "Slide back down",
      "Maintain scapular position",
    ],

    coachingCues: [
      "Keep everything touching wall",
      "Slow and controlled",
      "Feel shoulder blades moving",
      "This teaches scapular control",
      "Daily practice",
    ],

    protocol: {
      sets: "2-3",
      reps: "10-15",
      frequency: "Daily or pre-throwing",
    },

    benefits: [
      "Scapular control and timing",
      "Shoulder mobility",
      "Posture awareness",
      "Throwing mechanics preparation",
      "Prevents scapular dyskinesis",
    ],

    requirement: "20-25° scapular tilt needed for healthy mechanics",
  },

  "Band Pull-Aparts": {
    category: "Shoulder Health / Scapular",
    primaryMuscles: ["Rear deltoids", "Rhomboids", "Lower traps"],
    difficulty: "Beginner",
    equipment: ["Resistance band"],

    execution: [
      "Hold band at chest height",
      "Arms straight",
      "Pull band apart to sides",
      "Squeeze shoulder blades together",
      "Control return",
    ],

    coachingCues: [
      "Squeeze shoulder blades",
      "Straight arms",
      "Feel rear shoulders and upper back",
      "This balances anterior work",
      "Daily practice ideal",
    ],

    protocol: {
      sets: "3-4",
      reps: "15-20",
      frequency: "Daily",
    },

    benefits: [
      "Rear deltoid strength (primary velocity generator)",
      "Scapular retraction",
      "Posture improvement",
      "Balances chest/pressing work",
      "Shoulder health maintenance",
    ],

    note: "Posterior deltoid = primary velocity generator",
  },

  // ==================== HIP FLEXOR FLEXIBILITY ====================

  "Kneeling Hip Flexor Stretch": {
    category: "Hip Flexor Flexibility",
    primaryMuscles: ["Psoas", "Iliacus", "Rectus femoris"],
    difficulty: "Beginner",
    equipment: ["Pad for knee"],
    importance: "CRITICAL for QB - tight hip flexors reduce velocity 15-20%",

    execution: [
      "Kneeling lunge position",
      "Back knee on ground",
      "Front foot flat",
      "Upright torso",
      "Push hips forward",
      "Hold 90-120 seconds each side",
    ],

    coachingCues: [
      "Don't arch lower back",
      "Push hips FORWARD",
      "Upright torso",
      "Feel deep in front of hip",
      "DAILY practice non-negotiable",
      "Hip flexibility = throwing velocity",
    ],

    protocol: {
      duration: "90-120 seconds each side",
      sets: "2-3 per side",
      frequency: "Daily (twice daily for QBs)",
    },

    benefits: [
      "Increases stride length 8-12%",
      "Prevents 15-20% velocity loss from tightness",
      "Improves trunk rotation efficiency",
      "Better throwing mechanics",
      "Essential QB mobility",
    ],

    evidence:
      "Hip flexor flexibility increases stride length 8-12% (AJSM, 2020)",
  },

  "Standing Quad/Hip Flexor Stretch": {
    category: "Hip Flexor Flexibility",
    primaryMuscles: ["Hip flexors", "Quads"],
    difficulty: "Beginner",
    equipment: ["None"],

    execution: [
      "Stand on one leg",
      "Pull other heel to glute",
      "Drive hips forward",
      "Upright posture",
      "Hold 60-90 seconds",
    ],

    coachingCues: [
      "Don't arch back",
      "Drive hips forward",
      "Stand tall",
      "Balance challenge",
      "Both sides equal",
    ],

    protocol: {
      duration: "60-90 seconds each",
      frequency: "Daily, multiple times",
    },
  },

  "90/90 Hip Flow": {
    category: "Hip Mobility / Dynamic",
    primaryMuscles: ["Hip complex - all ranges"],
    difficulty: "Intermediate",
    equipment: ["None"],

    execution: [
      "Sit in 90/90 position",
      "Rotate hips to switch legs",
      "Maintain upright torso",
      "Flow between positions",
      "10-15 transitions",
    ],

    coachingCues: [
      "Smooth transitions",
      "Upright torso",
      "Feel hips opening",
      "Great warm-up movement",
    ],

    protocol: {
      reps: "10-15 flows",
      frequency: "Daily or pre-throwing",
    },

    benefits: [
      "Hip mobility all planes",
      "Internal/external rotation",
      "Dynamic preparation",
      "Movement quality",
    ],
  },

  // ==================== BACK STRENGTH (THROWING POWER) ====================

  "Single-Arm DB Rows": {
    category: "Back Strength",
    primaryMuscles: ["Lats", "Rhomboids", "Rear deltoid"],
    difficulty: "Intermediate",
    equipment: ["Dumbbell", "Bench"],
    importance: "Latissimus dorsi provides 18% of throwing power",

    execution: [
      "One hand on bench",
      "Flat back",
      "Row dumbbell to hip",
      "Pull elbow back and up",
      "Squeeze at top",
      "Control down",
    ],

    coachingCues: [
      "Flat back throughout",
      "Pull to hip, not shoulder",
      "Drive elbow back",
      "Squeeze lat at top",
      "This IS throwing power",
      "Feel connection to throwing motion",
    ],

    protocol: {
      sets: "3-4 per side",
      reps: "8-12",
      frequency: "2-3x per week",
      progression: "Increase weight gradually",
    },

    benefits: [
      "Lat strength = 18% of throwing power",
      "Pulling strength",
      "Shoulder health",
      "Power generation",
      "Single-arm focuses on throwing side",
    ],

    evidence: "Lats provide 18% of throwing power (J Strength Cond, 2021)",
  },

  "Lat Pulldowns": {
    category: "Back Strength",
    primaryMuscles: ["Lats", "Upper back"],
    difficulty: "Beginner-Intermediate",
    equipment: ["Cable machine or band"],

    execution: [
      "Wide grip on bar",
      "Pull to upper chest",
      "Lean back slightly",
      "Squeeze lats",
      "Control the return",
    ],

    coachingCues: [
      "Pull to chest, not behind neck",
      "Squeeze shoulder blades",
      "Feel lats working",
      "Control the eccentric",
      "Build back strength",
    ],

    protocol: {
      sets: "3-4",
      reps: "10-12",
      frequency: "2x per week",
    },

    benefits: [
      "Lat development",
      "Vertical pulling strength",
      "Throwing power",
      "Shoulder health",
    ],
  },

  "Face Pulls": {
    category: "Back / Shoulder Health",
    primaryMuscles: ["Rear deltoids", "Rhomboids", "Rotator cuff"],
    difficulty: "Beginner-Intermediate",
    equipment: ["Cable or band"],

    execution: [
      "Rope attachment at face height",
      "Pull to face",
      "Elbows high",
      "Externally rotate at end",
      "Squeeze shoulder blades",
    ],

    coachingCues: [
      "Elbows HIGH",
      "Pull apart the rope",
      "External rotation at end",
      "Feel rear shoulders and upper back",
      "Daily work if possible",
    ],

    protocol: {
      sets: "3-4",
      reps: "15-20",
      frequency: "Daily or every upper body session",
    },

    benefits: [
      "Rear deltoid (velocity generator)",
      "Shoulder health",
      "Scapular retraction",
      "Posture",
      "Balances pressing work",
    ],
  },

  "Thoracic Extensions": {
    category: "Back Mobility / Strength",
    primaryMuscles: ["Thoracic spine extensors"],
    difficulty: "Beginner",
    equipment: ["Foam roller"],
    importance: "Thoracic extension adds 8-12 mph velocity",

    execution: [
      "Lie on foam roller (mid-back)",
      "Hands behind head",
      "Extend back over roller",
      "Hold 2-3 seconds",
      "Repeat along spine",
    ],

    coachingCues: [
      "Breathe deeply",
      "Extend through upper back",
      "Move roller to different spots",
      "Daily practice",
      "This adds velocity",
    ],

    protocol: {
      duration: "5-10 minutes",
      frequency: "Daily",
    },

    benefits: [
      "Adds 8-12 mph to velocity",
      "Improved trunk rotation",
      "Better throwing posture",
      "Counteracts sitting",
      "Essential for power generation",
    ],

    evidence:
      "Thoracic extension adds 8-12 mph velocity (J Strength Cond, 2021)",
  },

  // ==================== THROWING MECHANICS DRILLS ====================

  "Shadow Throwing": {
    category: "Throwing Mechanics",
    difficulty: "Beginner",
    equipment: ["None"],

    execution: [
      "Go through throwing motion without ball",
      "Focus on mechanics",
      "Slow and controlled",
      "Feel the positions",
      "Progressive speed",
    ],

    coachingCues: [
      "Perfect mechanics",
      "Slow to fast progression",
      "Feel each phase",
      "This is neural training",
      "Daily practice",
    ],

    protocol: {
      reps: "20-30 throws",
      frequency: "Daily",
    },

    benefits: [
      "Mechanics refinement",
      "Neural patterning",
      "No arm stress",
      "Movement quality",
      "Warm-up tool",
    ],
  },

  "Step-Through Drill": {
    category: "Throwing Mechanics",
    difficulty: "Beginner-Intermediate",
    equipment: ["Football"],

    execution: [
      "Start with weight on back foot",
      "Step toward target",
      "Rotate hips",
      "Follow with shoulders",
      "Release",
      "Follow through",
    ],

    coachingCues: [
      "Hips before shoulders",
      "Weight transfer critical",
      "Step in line with target",
      "Complete follow through",
      "This teaches sequencing",
    ],

    protocol: {
      throws: "15-20",
      frequency: "Every throwing session warm-up",
    },

    benefits: [
      "Hip-shoulder separation",
      "Weight transfer",
      "Sequencing",
      "Power generation",
      "Fundamental mechanics",
    ],
  },

  "Pivot Drill": {
    category: "Throwing Mechanics",
    difficulty: "Intermediate",
    equipment: ["Football"],

    execution: [
      "Start with feet perpendicular to target",
      "Pivot on back foot",
      "Open hips",
      "Throw to target",
      "Focus on hip rotation power",
    ],

    coachingCues: [
      "Explosive hip rotation",
      "Back foot pivot",
      "Generate power from lower body",
      "Quick release",
    ],

    protocol: {
      throws: "10-15 each side",
      frequency: "2-3x per week",
    },

    benefits: [
      "Hip rotation power",
      "Quick release practice",
      "Lower body engagement",
      "Game-specific movement",
    ],
  },

  "Long Toss": {
    category: "Throwing Mechanics / Arm Strength",
    difficulty: "Intermediate-Advanced",
    equipment: ["Football", "Partner", "Space"],

    protocol: {
      progression: [
        { distance: "15 yards", throws: 5, intensity: "60%" },
        { distance: "20 yards", throws: 5, intensity: "70%" },
        { distance: "25 yards", throws: 5, intensity: "75%" },
        { distance: "30 yards", throws: 5, intensity: "80%" },
        { distance: "35+ yards", throws: "5-10", intensity: "85-90%" },
        {
          distance: "Work back in",
          throws: "5-10",
          intensity: "Gradually decrease",
        },
      ],
      totalThrows: "30-50",
      frequency: "1-2x per week (not game week)",
    },

    coachingCues: [
      "Gradual distance increase",
      "Perfect mechanics at each distance",
      "Work back IN after max distance",
      "This builds arm strength",
      "Don't overdo - recovery important",
    ],

    benefits: [
      "Arm strength development",
      "Increases velocity",
      "Mechanics under load",
      "Confidence builder",
      "Max distance throwing",
    ],

    cautions: [
      "Not during game week",
      "Requires full warm-up",
      "Don't force distance",
      "Work back in after max",
      "Extra recovery needed",
    ],
  },

  // ==================== ARM STRENGTHENING ====================

  "Tricep Extensions": {
    category: "Arm Strengthening",
    primaryMuscles: ["Triceps"],
    difficulty: "Beginner-Intermediate",
    equipment: ["Dumbbell or cable"],
    importance: "Triceps contribute 23% of ball velocity",

    variations: [
      {
        name: "Overhead DB Extension",
        execution: "DB overhead, lower behind head, extend",
        emphasis: "Long head of tricep",
      },
      {
        name: "Cable Pushdowns",
        execution: "Cable at face height, push down",
        emphasis: "Overall tricep strength",
      },
    ],

    coachingCues: [
      "Full range of motion",
      "Control the eccentric",
      "Feel tricep working",
      "23% of velocity comes from here",
    ],

    protocol: {
      sets: "3-4",
      reps: "10-15",
      frequency: "2-3x per week",
    },

    benefits: [
      "Contributes 23% of ball velocity",
      "Arm extension power",
      "Elbow health",
      "Throwing strength",
    ],

    evidence: "Triceps contribute 23% of ball velocity (J Sports Sci, 2019)",
  },

  "Bicep Curls": {
    category: "Arm Strengthening",
    primaryMuscles: ["Biceps"],
    difficulty: "Beginner",
    equipment: ["Dumbbells"],
    importance: "Biceps provide deceleration control",

    execution: [
      "Arms at sides",
      "Curl weight up",
      "Control down (slow eccentric)",
      "Full range of motion",
    ],

    coachingCues: [
      "Slow eccentric (3-4 seconds down)",
      "Eccentric strength = deceleration",
      "Control is more important than weight",
      "Protects elbow",
    ],

    protocol: {
      sets: "3",
      reps: "10-12",
      eccentricTempo: "3-4 seconds",
      frequency: "2x per week",
    },

    benefits: [
      "Arm deceleration control",
      "Elbow protection",
      "Injury prevention",
      "Eccentric strength critical",
    ],

    note: "Deceleration phase protects arm - eccentric focus",
  },

  "Wrist Curls / Extensions": {
    category: "Forearm & Grip",
    primaryMuscles: ["Forearm flexors/extensors"],
    difficulty: "Beginner",
    equipment: ["Light dumbbell"],

    variations: [
      {
        name: "Wrist Curls (palm up)",
        execution: "Forearm on bench, curl wrist up",
        muscles: "Flexors",
      },
      {
        name: "Wrist Extensions (palm down)",
        execution: "Forearm on bench, extend wrist up",
        muscles: "Extensors",
      },
    ],

    protocol: {
      sets: "2-3 each",
      reps: "15-20",
      weight: "Light (5-10 lbs)",
      frequency: "2-3x per week",
    },

    benefits: [
      "Grip strength",
      "Wrist stability",
      "Ball control",
      "Injury prevention",
    ],
  },

  // ==================== THROWING ENDURANCE ====================

  "Ball Toss Endurance Drill": {
    category: "Throwing Endurance",
    difficulty: "Intermediate-Advanced",
    equipment: ["Football", "Partner or wall"],

    protocol: {
      distance: "10-15 yards",
      throws: "50-100 continuous",
      intensity: "60-70% effort",
      rest: "Minimal between throws",
      frequency: "1-2x per week (build up)",
    },

    execution: [
      "Start with proper warm-up",
      "Continuous throwing at moderate intensity",
      "Focus on maintaining mechanics",
      "Track total throws",
      "Progressive overload",
    ],

    coachingCues: [
      "This builds endurance, not power",
      "Maintain mechanics as fatigue sets in",
      "Progressive increase in volume",
      "Simulates game fatigue",
      "Mental toughness component",
    ],

    progression: {
      week1_4: "50-100 throws",
      week5_8: "100-150 throws",
      week9_12: "150-200 throws",
      week13_14: "Maintain, don't increase",
    },

    benefits: [
      "Throwing endurance",
      "Mechanics under fatigue",
      "Mental toughness",
      "Game preparation",
      "Volume capacity for 320-throw weekends",
    ],
  },

  // ==================== CORE FOR THROWING ====================

  "Medicine Ball Rotational Throws": {
    category: "Core / Power",
    primaryMuscles: ["Obliques", "Core", "Full body"],
    difficulty: "Intermediate",
    equipment: ["Medicine ball (6-10 lbs)", "Wall or partner"],

    execution: [
      "Stand sideways to target",
      "Hold med ball at hip",
      "Rotate and throw explosively",
      "Follow through completely",
      "Catch and repeat",
    ],

    coachingCues: [
      "Explosive rotation",
      "Use full body",
      "This mimics throwing power",
      "Both sides (throwing and non-throwing)",
      "Maximum effort",
    ],

    protocol: {
      sets: "3-4 per side",
      reps: "8-10",
      weight: "6-10 lbs",
      frequency: "2-3x per week",
    },

    benefits: [
      "Rotational power",
      "Core strength for throwing",
      "Explosive hip rotation",
      "Sport-specific power",
      "Velocity development",
    ],
  },

  "Anti-Rotation Press (Pallof Press)": {
    category: "Core Stability",
    primaryMuscles: ["Obliques", "Core stabilizers"],
    difficulty: "Intermediate",
    equipment: ["Cable or band"],

    execution: [
      "Stand sideways to anchor",
      "Hold handle at chest",
      "Press straight out",
      "Resist rotation",
      "Control back to chest",
    ],

    coachingCues: [
      "Resist the rotation",
      "Brace core hard",
      "This is stability work",
      "Both sides equal",
      "Control is key",
    ],

    protocol: {
      sets: "3 per side",
      reps: "10-12",
      frequency: "2-3x per week",
    },

    benefits: [
      "Core stability",
      "Anti-rotation strength",
      "Throwing mechanics support",
      "Injury prevention",
      "Power transfer",
    ],
  },
};

export default QB_EXERCISE_LIBRARY;
