// QB Nutrition and Recovery Protocols
// Comprehensive nutrition and recovery strategies for quarterback performance optimization

export const QB_NUTRITION_RECOVERY_PROTOCOLS = {

  // Nutrition Overview
  nutritionPhilosophy: {
    title: "QB Performance Nutrition Philosophy",
    principles: [
      "Fuel for sustained throwing performance",
      "Support arm recovery and adaptation",
      "Optimize nervous system function",
      "Maintain consistent energy for 320-throw challenge",
      "Reduce inflammation for faster recovery"
    ],
    keyFacts: [
      "QBs burn 300-500 calories per throwing session",
      "Arm muscles need 18-24 hours for full glycogen replenishment",
      "Dehydration of 2% reduces throwing accuracy by 15%",
      "Protein within 30 minutes post-throwing optimizes recovery"
    ]
  },

  // Daily Nutrition Guidelines
  dailyNutrition: {
    title: "Daily QB Nutrition Guidelines",
    
    calorieTargets: {
      sedentaryDay: "2200-2500 calories",
      lightTrainingDay: "2500-2800 calories",
      intensiveTrainingDay: "2800-3200 calories",
      tournamentDay: "3000-3500 calories"
    },

    macronutrientRatios: {
      carbohydrates: {
        percentage: "45-55%",
        grams: "5-7g per kg bodyweight",
        focus: "Fuel for throwing sessions and recovery",
        bestSources: [
          "Oatmeal with berries",
          "Sweet potatoes",
          "Brown rice",
          "Quinoa",
          "Whole grain pasta",
          "Bananas"
        ]
      },
      
      protein: {
        percentage: "20-25%",
        grams: "1.6-2.2g per kg bodyweight",
        focus: "Arm muscle recovery and adaptation",
        bestSources: [
          "Lean chicken breast",
          "Fish (salmon, tuna)",
          "Eggs",
          "Greek yogurt",
          "Lean beef",
          "Plant proteins (quinoa, beans)"
        ],
        timing: [
          "25-30g within 30 minutes post-throwing",
          "20-25g every 3-4 hours throughout day",
          "40-50g at dinner for overnight recovery"
        ]
      },

      fats: {
        percentage: "25-30%",
        grams: "1.0-1.2g per kg bodyweight", 
        focus: "Hormone production and inflammation reduction",
        bestSources: [
          "Avocados",
          "Olive oil",
          "Nuts and seeds",
          "Fatty fish",
          "Coconut oil"
        ]
      }
    },

    micronutrients: {
      criticalForQBs: {
        magnesium: {
          importance: "Muscle contraction and relaxation",
          target: "400-420mg daily",
          sources: ["Dark leafy greens", "Nuts", "Seeds", "Dark chocolate"]
        },
        
        omega3: {
          importance: "Reduces inflammation, supports joint health",
          target: "2-3g daily",
          sources: ["Fatty fish", "Fish oil supplement", "Walnuts", "Chia seeds"]
        },
        
        vitaminD: {
          importance: "Bone health and immune function",
          target: "2000-4000 IU daily",
          sources: ["Sunlight", "Fatty fish", "Supplementation"]
        },
        
        antioxidants: {
          importance: "Combat exercise-induced oxidative stress",
          sources: ["Berries", "Dark leafy greens", "Cherries", "Green tea"]
        }
      }
    }
  },

  // Pre-Throwing Nutrition
  preThrowingNutrition: {
    title: "Pre-Throwing Session Nutrition",
    
    timing: {
      "3-4 hours before": {
        meal: "Complete balanced meal",
        composition: "50% carbs, 25% protein, 25% fat",
        examples: [
          "Chicken breast with sweet potato and vegetables",
          "Salmon with quinoa and avocado",
          "Oatmeal with Greek yogurt and berries"
        ],
        hydration: "16-20 oz water"
      },
      
      "1-2 hours before": {
        snack: "Easy-to-digest carbohydrate snack",
        composition: "70% carbs, 20% protein, 10% fat",
        examples: [
          "Banana with almond butter",
          "Greek yogurt with honey",
          "Oatmeal with berries",
          "Toast with jam"
        ],
        hydration: "8-12 oz water"
      },
      
      "30-60 minutes before": {
        snack: "Quick energy source",
        composition: "85% carbs, 15% protein",
        examples: [
          "Banana",
          "Sports drink (diluted)",
          "Energy bar (low fiber)",
          "Dates"
        ],
        hydration: "6-8 oz water or sports drink"
      }
    },

    avoidPreThrowing: [
      "High fiber foods (may cause GI distress)",
      "High fat foods (slow digestion)",
      "Excessive caffeine (may cause jitters)",
      "New or unfamiliar foods",
      "Large volumes of liquid (30 min before)"
    ]
  },

  // During Session Nutrition
  duringSessionNutrition: {
    title: "During Throwing Session Nutrition",
    
    shortSessions: {
      duration: "Less than 60 minutes",
      hydration: "Water sufficient",
      intake: "6-8 oz every 15-20 minutes",
      fuel: "Not typically needed"
    },
    
    longSessions: {
      duration: "60-90 minutes",
      hydration: "Sports drink beneficial",
      intake: "6-8 oz every 15-20 minutes",
      fuel: "Small amounts of quick carbs if needed"
    },
    
    tournamentSimulation: {
      duration: "3-4 hours (320 throws)",
      protocol: {
        betweenGames: "4-6 oz sports drink + small snack",
        snackOptions: [
          "Half banana",
          "2-3 dates",
          "Small granola bar",
          "Sports gels (diluted)"
        ],
        hydrationGoal: "Replace 150% of fluid losses",
        electrolytes: "Sodium 200-400mg per hour"
      }
    }
  },

  // Post-Throwing Recovery Nutrition
  postThrowingNutrition: {
    title: "Post-Throwing Recovery Nutrition",
    
    immediateRecovery: {
      timing: "Within 30 minutes",
      goals: [
        "Replenish glycogen stores",
        "Initiate muscle protein synthesis", 
        "Reduce inflammation",
        "Rehydrate"
      ],
      
      composition: "3:1 or 4:1 carb to protein ratio",
      
      quickOptions: [
        "Chocolate milk (16 oz)",
        "Greek yogurt with berries",
        "Protein smoothie with banana",
        "Recovery drink with whey protein"
      ],
      
      fullMealOptions: [
        "Chicken and rice with vegetables",
        "Salmon with sweet potato",
        "Turkey sandwich on whole grain bread",
        "Quinoa bowl with lean protein"
      ],

      hydration: "150% of fluid losses (weigh before/after session)"
    },

    extendedRecovery: {
      timing: "2-6 hours post-session",
      focus: "Complete nutritional recovery",
      
      meal: {
        carbohydrates: "1.5-2g per kg bodyweight",
        protein: "25-40g high-quality protein",
        fats: "Moderate amounts for hormone production",
        fluids: "Continue hydration"
      },
      
      antiInflammatory: [
        "Tart cherry juice (8 oz)",
        "Turmeric in cooking",
        "Omega-3 rich foods",
        "Dark leafy greens"
      ]
    }
  },

  // Hydration Strategies
  hydrationStrategies: {
    title: "QB Hydration Optimization",
    
    dailyHydration: {
      baseline: "Half bodyweight in ounces daily",
      additional: "16-24 oz per hour of training",
      morningCheck: "Urine should be pale yellow",
      preSession: "16-20 oz, 2-3 hours before",
      duringSession: "6-8 oz every 15-20 minutes"
    },

    tournamentHydration: {
      title: "320-Throw Tournament Strategy",
      
      dayBefore: [
        "Extra 16-24 oz water beyond normal",
        "Minimize alcohol and caffeine",
        "Include electrolyte-rich foods",
        "Monitor urine color"
      ],
      
      morningOf: [
        "20-24 oz water upon waking",
        "Sports drink with breakfast",
        "Sip water consistently pre-warmup"
      ],
      
      betweenGames: {
        protocol: "4-6 oz sports drink every game break",
        electrolytes: "200-300mg sodium per hour",
        monitoring: "Thirst, energy, mental clarity"
      },
      
      postTournament: [
        "Weigh immediately after",
        "Drink 150% of weight lost",
        "Continue hydration for 6+ hours",
        "Include electrolytes in recovery"
      ]
    },

    climateAdjustments: {
      hot: "Increase intake by 12-16 oz per hour",
      humid: "Extra focus on electrolyte replacement",
      cold: "Maintain regular intake (thirst diminished)",
      indoor: "Standard protocol sufficient"
    }
  },

  // Recovery Protocols
  recoveryProtocols: {
    title: "Comprehensive QB Recovery System",
    
    immediatePostSession: {
      duration: "0-30 minutes",
      priorities: [
        "Cool-down throws (gradual reduction)",
        "Hydration and nutrition",
        "Gentle arm stretching",
        "Assessment of arm health"
      ],
      
      armCareProtocol: [
        "Progressive cool-down throws (15-10-5 yards)",
        "Sleeper stretch (60-90 seconds)",
        "Cross-body stretch",
        "Ice if soreness (10-15 minutes max)"
      ]
    },

    activeRecovery: {
      duration: "30 minutes - 2 hours post",
      activities: [
        "Light walking (10-15 minutes)",
        "Full body stretching routine",
        "Foam rolling (avoid direct arm work)",
        "Breathing exercises"
      ],
      
      nutrition: "Recovery meal within 2 hours",
      hydration: "Continue replacement"
    },

    sleepOptimization: {
      title: "Sleep for QB Recovery",
      target: "8-9 hours nightly",
      
      preSleeproutine: [
        "No screens 1 hour before bed",
        "Room temperature 65-68°F",
        "Complete darkness",
        "Consistent bedtime"
      ],
      
      recoveryBenefits: [
        "Growth hormone release (muscle repair)",
        "Memory consolidation (motor skills)",
        "Glycogen replenishment",
        "Immune system restoration"
      ],
      
      travelAdjustments: [
        "Maintain routine as much as possible",
        "Consider melatonin for time zone changes",
        "Pack familiar sleep aids (pillow, etc.)"
      ]
    }
  },

  // Phase-Specific Nutrition
  phaseSpecificNutrition: {
    foundation: {
      weeks: "1-4",
      focus: "Build nutritional habits and support adaptation",
      calories: "Moderate increase (200-300 above baseline)",
      protein: "1.6g per kg bodyweight",
      carbs: "5-6g per kg bodyweight",
      emphasis: [
        "Establish meal timing",
        "Learn pre/post session nutrition",
        "Build healthy habits",
        "Support initial adaptations"
      ]
    },

    strength: {
      weeks: "5-8", 
      focus: "Support increased training demands",
      calories: "Moderate to high increase (300-500 above baseline)",
      protein: "1.8-2.0g per kg bodyweight",
      carbs: "6-7g per kg bodyweight",
      emphasis: [
        "Higher protein for muscle development",
        "Increased carbs for training fuel",
        "Anti-inflammatory foods",
        "Recovery optimization"
      ]
    },

    power: {
      weeks: "9-12",
      focus: "Peak performance nutrition",
      calories: "Highest intake (400-600 above baseline)",
      protein: "2.0-2.2g per kg bodyweight", 
      carbs: "7-8g per kg bodyweight",
      emphasis: [
        "Maximum fuel for peak training",
        "Optimal recovery nutrition",
        "Tournament simulation nutrition",
        "Performance supplements if needed"
      ]
    },

    competition: {
      weeks: "13-14",
      focus: "Maintain performance, taper nutrition",
      calories: "Slight reduction (200-300 above baseline)",
      protein: "1.8-2.0g per kg bodyweight",
      carbs: "6-7g per kg bodyweight", 
      emphasis: [
        "Maintain energy without excess",
        "Focus on familiar foods",
        "Perfect tournament day nutrition",
        "Mental preparation support"
      ]
    }
  },

  // Injury Prevention Nutrition
  injuryPreventionNutrition: {
    title: "Nutritional Injury Prevention for QBs",
    
    armHealthNutrients: {
      collagen: {
        importance: "Tendon and ligament health",
        sources: ["Bone broth", "Collagen powder", "Gelatin"],
        timing: "Post-workout with vitamin C"
      },
      
      vitaminC: {
        importance: "Collagen synthesis",
        target: "500-1000mg daily",
        sources: ["Citrus fruits", "Bell peppers", "Strawberries"]
      },
      
      glucosamine: {
        importance: "Joint health",
        dosage: "1500mg daily",
        note: "Consider supplementation"
      }
    },

    inflammationManagement: {
      antiInflammatoryFoods: [
        "Fatty fish (2-3x per week)",
        "Tart cherry juice (8 oz daily)",
        "Turmeric/curcumin",
        "Dark leafy greens",
        "Berries",
        "Green tea"
      ],
      
      proInflammatoryToAvoid: [
        "Excessive omega-6 oils",
        "Processed foods",
        "Added sugars",
        "Trans fats",
        "Excessive alcohol"
      ]
    }
  },

  // Supplementation Guidelines
  supplementation: {
    title: "Evidence-Based QB Supplementation",
    
    tier1Essential: {
      multivitamin: "Daily insurance policy",
      omega3: "2-3g daily for inflammation control",
      vitaminD: "2000-4000 IU daily (test levels)",
      magnesium: "400mg daily for muscle function"
    },
    
    tier2Beneficial: {
      creatine: "3-5g daily for power and recovery",
      wheyProtein: "Post-workout recovery",
      probiotics: "Immune system and gut health",
      caffeine: "Pre-training (100-200mg)"
    },
    
    tier3Situational: {
      collagen: "Joint health (10-20g daily)",
      tartCherry: "Recovery and inflammation",
      curcumin: "Natural anti-inflammatory",
      melatonin: "Sleep support (0.5-3mg)"
    },

    timingOptimization: {
      morning: ["Multivitamin", "Vitamin D", "Omega-3"],
      preworkout: ["Caffeine (if used)", "Creatine"],
      postWorkout: ["Whey protein", "Creatine"],
      evening: ["Magnesium", "Probiotics", "Melatonin (if needed)"]
    }
  },

  // Mental Recovery and Stress Management
  mentalRecovery: {
    title: "Mental Recovery for Peak QB Performance",
    
    stressManagement: {
      techniques: [
        "Deep breathing exercises (4-7-8 technique)",
        "Progressive muscle relaxation",
        "Mindfulness meditation (10-15 minutes daily)",
        "Visualization of successful performance"
      ],
      
      nutritionalSupport: [
        "Adequate B-vitamins (stress support)",
        "Magnesium (nervous system calm)",
        "Avoid excessive caffeine",
        "Consistent meal timing"
      ]
    },

    mentalFatigue: {
      signs: [
        "Decreased decision-making speed",
        "Reduced focus during throwing",
        "Increased irritability",
        "Poor sleep quality"
      ],
      
      nutritionalIntervention: [
        "Stable blood sugar (avoid skipping meals)",
        "Omega-3 fatty acids (brain health)",
        "Antioxidants (cognitive protection)",
        "Adequate hydration"
      ]
    }
  }
};

// Weekly nutrition and recovery planning templates
export const WEEKLY_NUTRITION_TEMPLATES = {
  foundation: {
    monday: {
      type: "Heavy training day",
      calories: "High",
      preWorkout: "Oatmeal with berries and Greek yogurt",
      postWorkout: "Chocolate milk + banana",
      emphasis: "Recovery and adaptation"
    },
    
    tuesday: {
      type: "Moderate training day", 
      calories: "Moderate",
      preWorkout: "Toast with almond butter",
      postWorkout: "Protein smoothie",
      emphasis: "Sustained energy"
    },
    
    wednesday: {
      type: "Recovery day",
      calories: "Lower",
      focus: "Anti-inflammatory foods",
      meals: "Salmon, leafy greens, berries",
      emphasis: "Recovery and repair"
    },
    
    // ... continues for all days
  }
};

export default QB_NUTRITION_RECOVERY_PROTOCOLS;