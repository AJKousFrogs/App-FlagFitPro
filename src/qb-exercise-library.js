// Comprehensive QB-Specific Exercise Library
// Detailed exercise database with progressions, coaching cues, and throwing-specific applications

export const COMPREHENSIVE_QB_EXERCISE_LIBRARY = {
  
  // ROTATOR CUFF EXERCISES - Foundation of QB velocity
  rotatorCuff: {
    "Band External Rotation": {
      category: "Rotator Cuff",
      primaryMuscles: ["Posterior Deltoid", "Infraspinatus", "Teres Minor"],
      secondaryMuscles: ["Middle Traps", "Rhomboids"],
      equipment: ["Resistance Band"],
      difficulty: "Beginner",
      throwingRelevance: "PRIMARY velocity generator - 30% of throwing power",
      
      setup: {
        position: "Standing, elbow at side at 90° angle",
        bandPosition: "At elbow height, attached to stable object",
        distance: "Arm's length from anchor point"
      },
      
      execution: [
        "Grasp band with throwing hand",
        "Keep elbow tucked firmly at side",
        "Rotate forearm away from body slowly",
        "Squeeze shoulder blades together",
        "Control 3-second return to start"
      ],
      
      coachingCues: [
        "Feel it work in BACK of shoulder",
        "Elbow stays glued to side",
        "Quality over speed",
        "Most important QB exercise"
      ],
      
      commonMistakes: [
        "Elbow drifts away from body",
        "Using momentum instead of control",
        "Range too large (stop at neutral)",
        "Going too fast"
      ],
      
      progressions: {
        week1_2: { resistance: "Light band", sets: 2, reps: 15 },
        week3_4: { resistance: "Light band", sets: 3, reps: 15 },
        week5_8: { resistance: "Medium band", sets: 3, reps: 12 },
        week9_12: { resistance: "Heavy band", sets: 3, reps: 10 },
        advanced: { resistance: "Cable machine", sets: 3, reps: 8 }
      },
      
      variations: {
        "Standing External Rotation": "Basic version",
        "Side-lying External Rotation": "More isolated",
        "90/90 External Rotation": "Sport-specific position",
        "Prone External Rotation": "Gravity-assisted"
      },
      
      assessmentCriteria: {
        strength: "Should handle medium resistance for 15 reps",
        form: "No compensation patterns",
        endurance: "No fatigue-related form breakdown"
      }
    },

    "Prone Y-T-W": {
      category: "Rotator Cuff",
      primaryMuscles: ["Lower Traps", "Middle Traps", "Posterior Deltoid"],
      secondaryMuscles: ["Rhomboids", "Rotator Cuff"],
      equipment: ["Bench or Floor"],
      difficulty: "Intermediate",
      throwingRelevance: "Scapular stability for consistent release point",
      
      setup: {
        position: "Face down on bench, arms hanging over edge",
        headPosition: "Neutral, forehead supported",
        coreEngagement: "Tight to prevent arching"
      },
      
      execution: [
        "Y Position: Arms overhead in Y shape, thumbs up",
        "T Position: Arms straight out to sides",
        "W Position: Elbows bent, form W with arms",
        "Hold each position 2-3 seconds",
        "Focus on squeezing shoulder blades"
      ],
      
      coachingCues: [
        "Start thumbs up, progress to thumbs down",
        "Think about pulling shoulder blades down and back",
        "Don't lift too high - quality movement",
        "Feel work between shoulder blades"
      ],
      
      progressions: {
        beginner: { weight: "Bodyweight", hold: "2s", sets: 2, reps: 8 },
        intermediate: { weight: "1-2 lbs", hold: "3s", sets: 2, reps: 10 },
        advanced: { weight: "3-5 lbs", hold: "3s", sets: 3, reps: 12 }
      },
      
      throwingConnection: "Stabilizes scapula during cocking and acceleration phases"
    }
  },

  // SHOULDER MOBILITY - Critical for QB injury prevention and velocity
  shoulderMobility: {
    "Sleeper Stretch": {
      category: "Shoulder Mobility",
      primaryMuscles: ["Posterior Capsule", "External Rotators"],
      secondaryMuscles: ["Posterior Deltoid"],
      equipment: ["Floor/Mat"],
      difficulty: "Intermediate",
      throwingRelevance: "CRITICAL - prevents velocity-limiting shoulder tightness",
      
      setup: {
        position: "Lying on throwing shoulder side",
        armPosition: "Upper arm perpendicular to body, elbow at 90°",
        legPosition: "Knees bent for stability"
      },
      
      execution: [
        "Lie on throwing shoulder",
        "Upper arm perpendicular to body",
        "Use opposite hand to gently push forearm toward floor",
        "Feel stretch in back of shoulder",
        "Hold for 60-90 seconds"
      ],
      
      coachingCues: [
        "THE most important QB stretch",
        "Never force into pain",
        "Gradual pressure increase",
        "Breathe deeply and relax"
      ],
      
      evidenceBasis: "Increases internal rotation 15-20°, directly improves velocity",
      
      progressions: {
        week1_2: { pressure: "Light", duration: "30s", sets: 2 },
        week3_4: { pressure: "Moderate", duration: "45s", sets: 2 },
        week5_plus: { pressure: "Firm", duration: "60-90s", sets: 2 }
      },
      
      redFlags: [
        "Sharp pain instead of stretching sensation",
        "Numbness or tingling",
        "Pain persists after stretching"
      ],
      
      throwingConnection: "Allows full internal rotation for velocity generation"
    },

    "Couch Stretch": {
      category: "Hip Flexor Mobility",
      primaryMuscles: ["Hip Flexors", "Psoas", "Rectus Femoris"],
      secondaryMuscles: ["TFL", "IT Band"],
      equipment: ["Couch/Bench"],
      difficulty: "Intermediate",
      throwingRelevance: "Hip flexibility = stride length = velocity",
      
      setup: {
        position: "Rear foot elevated on couch, front foot forward",
        hipPosition: "Square to front leg",
        torsoPosition: "Upright"
      },
      
      execution: [
        "Place rear foot up on couch/bench",
        "Step front foot forward into lunge position",
        "Drive hips forward toward ground",
        "Keep torso upright",
        "Feel deep stretch in front of rear hip"
      ],
      
      coachingCues: [
        "Most important stretch for QB velocity",
        "Tight hip flexors = 15-20% velocity loss",
        "Drive hips forward, not down",
        "Keep front knee behind toes"
      ],
      
      evidenceBasis: "Hip flexor flexibility increases stride length 8-12%",
      
      progressions: {
        beginner: { support: "Hands on front leg", duration: "60s" },
        intermediate: { support: "Hands free", duration: "90s" },
        advanced: { reach: "Overhead reach", duration: "90s" },
        expert: { weight: "Light weight overhead", duration: "90s" }
      },
      
      throwingConnection: "Enables full stride length for maximum velocity transfer"
    }
  },

  // THROWING POWER EXERCISES
  throwingPower: {
    "Medicine Ball Rotational Throws": {
      category: "Throwing Power",
      primaryMuscles: ["Core", "Lats", "Obliques"],
      secondaryMuscles: ["Shoulders", "Hips", "Posterior Chain"],
      equipment: ["Medicine Ball (6-12 lbs)", "Wall or Partner"],
      difficulty: "Intermediate",
      throwingRelevance: "Develops rotational power for throwing motion",
      
      setup: {
        position: "Athletic stance, side to target",
        ballPosition: "Start at hip, opposite side",
        distance: "6 feet from wall/partner"
      },
      
      execution: [
        "Start in throwing position with ball",
        "Rotate trunk explosively toward target", 
        "Throw ball with full body rotation",
        "Follow through completely",
        "Reset and repeat"
      ],
      
      coachingCues: [
        "Explosive hip rotation first",
        "Full body integration",
        "Maximum velocity, not just distance",
        "Simulate throwing motion"
      ],
      
      progressions: {
        foundation: { weight: "6 lbs", sets: 3, reps: 8 },
        strength: { weight: "8 lbs", sets: 3, reps: 8 },
        power: { weight: "10 lbs", sets: 4, reps: 6 },
        competition: { weight: "6 lbs", sets: 2, reps: 5, focus: "maximum velocity" }
      },
      
      variations: {
        "Side Throw": "Basic rotation pattern",
        "Overhead Throw": "Emphasizes lat engagement",
        "Step Through Throw": "Adds lower body integration",
        "Single Arm Throw": "Unilateral power development"
      },
      
      throwingConnection: "Directly transfers to trunk rotation in throwing motion"
    },

    "Weighted Ball Throws": {
      category: "Throwing Velocity",
      primaryMuscles: ["Entire Throwing Chain"],
      secondaryMuscles: ["Full Body Integration"],
      equipment: ["Weighted Footballs (12-18 oz)", "Light Footballs (8-10 oz)"],
      difficulty: "Advanced",
      throwingRelevance: "Direct velocity development through overload/underload",
      
      setup: {
        position: "Normal throwing stance",
        target: "Partner or net 15-20 yards away",
        warmup: "Progressive throwing warmup completed"
      },
      
      execution: [
        "Complete normal throwing warmup",
        "Use proper throwing mechanics with weighted ball",
        "Throw weighted ball 5-8 times explosively",
        "Immediately switch to light ball for 3-5 throws",
        "Finish with regular ball throws"
      ],
      
      coachingCues: [
        "Maintain perfect mechanics",
        "Maximum velocity, not distance",
        "Quality over quantity",
        "Feel the velocity increase with regular ball"
      ],
      
      protocol: {
        warmup: "15 throws progressive with regular ball",
        overload: "5-8 throws with 14-16 oz ball",
        underload: "3-5 throws with 8-10 oz ball", 
        contrast: "5-10 throws with regular ball",
        cooldown: "5 easy throws"
      },
      
      progressions: {
        week1_4: { weight: "14 oz", volume: "20 total throws" },
        week5_8: { weight: "16 oz", volume: "25 total throws" },
        week9_12: { weight: "18 oz", volume: "30 total throws" },
        taper: { weight: "14 oz", volume: "15 total throws" }
      },
      
      safetyProtocol: [
        "Never use when arm is sore",
        "Progressive loading only",
        "Stop if mechanics break down",
        "Maximum 2x per week"
      ]
    }
  },

  // ARM CARE EXERCISES
  armCare: {
    "Band Pull-Aparts": {
      category: "Arm Care",
      primaryMuscles: ["Posterior Deltoid", "Middle Traps"],
      secondaryMuscles: ["Rhomboids", "Lower Traps"],
      equipment: ["Resistance Band"],
      difficulty: "Beginner",
      throwingRelevance: "Posterior chain activation and balance",
      
      execution: [
        "Hold band with arms straight out",
        "Pull band apart by squeezing shoulder blades",
        "Hold squeeze for 2 seconds",
        "Control return to start",
        "Feel work between shoulder blades"
      ],
      
      dailyProtocol: {
        morning: { sets: 2, reps: 15, resistance: "Light" },
        preThrowing: { sets: 2, reps: 20, resistance: "Light" },
        postThrowing: { sets: 1, reps: 15, resistance: "Light" }
      }
    },

    "Wall Slides": {
      category: "Arm Care", 
      primaryMuscles: ["Serratus Anterior", "Lower Traps"],
      secondaryMuscles: ["Upper Traps", "Levator Scapulae"],
      equipment: ["Wall"],
      difficulty: "Beginner",
      throwingRelevance: "Scapular control and upward rotation",
      
      execution: [
        "Stand with back against wall",
        "Arms in 'goal post' position against wall",
        "Slide arms up wall while maintaining contact",
        "Slide down slowly with control",
        "Keep lower back against wall"
      ],
      
      coachingCues: [
        "Maintain wall contact throughout",
        "Don't let lower back arch",
        "Smooth, controlled movement",
        "Feel work between shoulder blades"
      ]
    }
  },

  // HIP AND CORE INTEGRATION
  hipAndCore: {
    "World's Greatest Stretch": {
      category: "Hip Mobility",
      primaryMuscles: ["Hip Flexors", "Glutes", "Thoracic Spine"],
      secondaryMuscles: ["Hamstrings", "Calves"],
      equipment: ["Floor"],
      difficulty: "Intermediate",
      throwingRelevance: "Complete throwing chain mobility",
      
      execution: [
        "Start in low lunge position",
        "Place opposite hand on ground inside front foot",
        "Rotate reaching arm up toward ceiling",
        "Hold rotation 3-5 seconds",
        "Return and repeat"
      ],
      
      benefits: [
        "Hip flexor mobility",
        "Thoracic rotation",
        "Ankle mobility",
        "Full throwing chain integration"
      ]
    },

    "Pallof Press": {
      category: "Core Stability",
      primaryMuscles: ["Core", "Obliques"],
      secondaryMuscles: ["Shoulders", "Lats"],
      equipment: ["Cable Machine or Band"],
      difficulty: "Intermediate",
      throwingRelevance: "Anti-rotation strength for throwing stability",
      
      execution: [
        "Hold cable/band at chest level",
        "Step away to create tension",
        "Press straight out from chest",
        "Hold against rotational force",
        "Control return to chest"
      ],
      
      progressions: {
        static: "Hold press position 10-30 seconds",
        dynamic: "Press out and return for reps",
        singleArm: "Use throwing arm only"
      }
    }
  },

  // VELOCITY DEVELOPMENT EXERCISES
  velocityDevelopment: {
    "Lat Pulldowns (Single Arm)": {
      category: "Velocity Development",
      primaryMuscles: ["Latissimus Dorsi", "Posterior Deltoid"],
      secondaryMuscles: ["Rhomboids", "Middle Traps"],
      equipment: ["Cable Machine"],
      difficulty: "Intermediate",
      throwingRelevance: "Lats provide 18% of throwing power",
      
      execution: [
        "Sit with throwing arm on cable",
        "Pull down and back in throwing pattern",
        "Squeeze lat at bottom",
        "Control 3-second return",
        "Focus on posterior chain"
      ],
      
      evidenceBasis: "Latissimus dorsi contributes 18% of ball velocity",
      
      progressions: {
        foundation: { weight: "50% BW", sets: 3, reps: 12 },
        strength: { weight: "75% BW", sets: 3, reps: 10 },
        power: { weight: "85% BW", sets: 3, reps: 8 }
      }
    },

    "Tricep Strengthening": {
      category: "Velocity Development",
      primaryMuscles: ["Triceps"],
      secondaryMuscles: ["Posterior Deltoid"],
      equipment: ["Dumbbells or Cable"],
      difficulty: "Intermediate", 
      throwingRelevance: "Triceps contribute 23% of ball velocity",
      
      exercises: {
        "Overhead Tricep Extension": "Lengthened position strength",
        "Close-Grip Push-ups": "Functional tricep strength",
        "Cable Tricep Pushdowns": "Isolated tricep development"
      },
      
      evidenceBasis: "Research shows triceps contribute 23% of throwing velocity"
    }
  },

  // RECOVERY AND REGENERATION
  recovery: {
    "Gentle Arm Circles": {
      category: "Recovery",
      primaryMuscles: ["Full shoulder complex"],
      secondaryMuscles: ["Upper back"],
      equipment: ["None"],
      difficulty: "Beginner",
      throwingRelevance: "Circulation and gentle movement",
      
      protocol: {
        postThrowing: "2 minutes forward and backward circles",
        morningActivation: "1 minute progressive size circles",
        betweenSessions: "30 seconds gentle circles"
      }
    },

    "Breathing and Relaxation": {
      category: "Recovery",
      focus: "Nervous system recovery",
      throwingRelevance: "Mental and physical recovery",
      
      techniques: {
        "4-7-8 Breathing": "Stress reduction and recovery",
        "Progressive Muscle Relaxation": "Physical tension release",
        "Visualization": "Mental skill development"
      }
    }
  },

  // ASSESSMENT EXERCISES
  assessment: {
    "External Rotation Strength Test": {
      category: "Assessment",
      purpose: "Evaluate rotator cuff strength",
      protocol: [
        "Side-lying position with 3 lb weight",
        "Maximum reps with perfect form",
        "Note form breakdown point",
        "Compare bilateral"
      ],
      standards: {
        minimal: "15 reps with 2 lbs",
        functional: "20 reps with 3 lbs", 
        optimal: "25 reps with 5 lbs"
      }
    },

    "Overhead Reach Test": {
      category: "Assessment",
      purpose: "Evaluate shoulder mobility",
      protocol: [
        "Standing with back against wall",
        "Reach overhead while maintaining wall contact",
        "Measure distance from wall to wrist",
        "Note any compensation"
      ],
      standards: {
        limited: "> 4 inches from wall",
        functional: "2-4 inches from wall",
        optimal: "< 2 inches from wall"
      }
    }
  }
};

// Exercise programming templates by phase
export const QB_EXERCISE_PROGRAMMING = {
  foundation: {
    frequency: {
      armCare: "Daily",
      rotatorCuff: "Every other day", 
      mobility: "Daily",
      throwing: "3x per week"
    },
    volume: {
      armCare: "10-15 minutes",
      rotatorCuff: "15-20 minutes",
      mobility: "10-15 minutes",
      throwing: "20-30 minutes"
    },
    progression: "Weekly 10% volume increase"
  },
  
  strength: {
    frequency: {
      armCare: "Daily",
      rotatorCuff: "Daily",
      power: "3x per week",
      throwing: "4x per week"
    },
    volume: {
      armCare: "15-20 minutes",
      rotatorCuff: "20-25 minutes", 
      power: "20-30 minutes",
      throwing: "30-45 minutes"
    },
    progression: "Weekly 5% intensity increase"
  },
  
  power: {
    frequency: {
      armCare: "Daily",
      rotatorCuff: "Daily",
      power: "4x per week",
      throwing: "5x per week"
    },
    volume: {
      armCare: "15-20 minutes",
      rotatorCuff: "25-30 minutes",
      power: "30-45 minutes", 
      throwing: "45-75 minutes"
    },
    progression: "Peak volume and intensity"
  },
  
  competition: {
    frequency: {
      armCare: "Daily",
      rotatorCuff: "Daily",
      power: "2x per week",
      throwing: "3x per week"
    },
    volume: {
      armCare: "10-15 minutes",
      rotatorCuff: "15-20 minutes",
      power: "15-25 minutes",
      throwing: "20-45 minutes"
    },
    progression: "Maintain quality, reduce volume"
  }
};

export default COMPREHENSIVE_QB_EXERCISE_LIBRARY;