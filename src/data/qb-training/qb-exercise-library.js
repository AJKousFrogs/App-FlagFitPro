/**
 * ⚠️ DEPRECATED: This static data file is deprecated.
 * 
 * QB exercises are now stored in the database exercises table.
 * 
 * See /src/data/qb-training/DEPRECATED.md for migration guide.
 * This file will be removed in Q2 2026.
 * 
 * @deprecated Use database via TrainingProgramService or API
 */
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
