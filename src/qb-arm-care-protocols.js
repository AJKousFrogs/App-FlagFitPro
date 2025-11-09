// QB Arm Care and Throwing Protocols
// Comprehensive injury prevention and performance optimization protocols

export const QB_ARM_CARE_PROTOCOLS = {
  
  // Daily arm care routine (15-20 minutes)
  dailyArmCare: {
    title: "Daily QB Arm Care Routine",
    duration: 15,
    frequency: "Every day",
    timing: "Morning preferred, evening acceptable",
    phases: [
      {
        title: "Activation Phase",
        duration: 5,
        exercises: [
          {
            name: "Arm Circles",
            sets: 1,
            reps: 10,
            direction: "Forward and backward",
            intensity: "Gentle, progressive size increase",
            focus: "Joint lubrication, blood flow"
          },
          {
            name: "Band Pull-Aparts", 
            sets: 2,
            reps: 15,
            resistance: "Light band",
            emphasis: "Squeeze shoulder blades",
            focus: "Posterior deltoid activation"
          },
          {
            name: "Wall Slides",
            sets: 2,
            reps: 12,
            technique: "Back against wall, arms slide up/down",
            focus: "Scapular mobility and control"
          }
        ]
      },
      {
        title: "Rotator Cuff Strengthening",
        duration: 8,
        exercises: [
          {
            name: "Band External Rotation",
            sets: 3,
            reps: 15,
            resistance: "Light-medium band",
            position: "Elbow at side, 90° angle",
            tempo: "2s out, 3s return",
            focus: "PRIMARY velocity muscle",
            coachingPoints: [
              "Feel it in back of shoulder",
              "Keep elbow tucked at side",
              "Control the return phase",
              "Most important exercise for QBs"
            ]
          },
          {
            name: "Band Internal Rotation",
            sets: 2,
            reps: 12,
            resistance: "Light band",
            ratio: "2:1 external:internal work",
            focus: "Shoulder balance",
            coachingPoints: [
              "Less volume than external",
              "Maintain shoulder balance",
              "Don't overpower external rotators"
            ]
          },
          {
            name: "Empty Can Raises",
            sets: 2,
            reps: 10,
            technique: "Thumbs down, 30° forward",
            range: "To shoulder height only",
            focus: "Supraspinatus strengthening"
          },
          {
            name: "Prone Y-T-W",
            sets: 2,
            reps: 8,
            position: "Face down on bench/floor",
            focus: "Scapular stabilizers",
            progression: ["Y position", "T position", "W position"]
          }
        ]
      },
      {
        title: "Mobility Phase",
        duration: 7,
        exercises: [
          {
            name: "Sleeper Stretch",
            sets: 2,
            duration: "60-90s each arm",
            position: "Side-lying on throwing shoulder",
            technique: "Gentle pressure on forearm",
            focus: "CRITICAL for QB velocity",
            coachingPoints: [
              "Most important QB stretch",
              "Increases internal rotation",
              "Prevents velocity-limiting tightness",
              "Never force into pain"
            ]
          },
          {
            name: "Cross-Body Stretch",
            sets: 2,
            duration: "45s each arm",
            technique: "Pull arm across body",
            target: "Posterior deltoid, capsule",
            focus: "Horizontal flexibility"
          },
          {
            name: "Doorway Chest Stretch",
            sets: 2,
            duration: "60s",
            position: "Arm against doorframe",
            angles: ["Low", "Mid", "High"],
            focus: "Anterior shoulder mobility"
          }
        ]
      }
    ],
    progressionSchedule: {
      week1_2: "Learn movements, light resistance",
      week3_4: "Increase hold times, medium resistance", 
      week5_8: "Full protocol, focus on quality",
      week9_plus: "Maintenance, injury prevention focus"
    }
  },

  // Pre-throwing warm-up protocol
  preThrowingWarmup: {
    title: "Complete Pre-Throwing Warm-Up",
    duration: 20,
    importance: "NEVER skip - injury prevention essential",
    phases: [
      {
        title: "General Warm-Up",
        duration: 5,
        activities: [
          {
            name: "Light Jogging",
            duration: "2 minutes",
            intensity: "Conversational pace",
            focus: "Core temperature increase"
          },
          {
            name: "Dynamic Arm Swings",
            duration: "2 minutes",
            movements: ["Forward/back", "Cross-body", "Overhead"],
            focus: "Joint preparation"
          },
          {
            name: "Torso Rotations",
            duration: "1 minute", 
            technique: "Progressive range increase",
            focus: "Trunk mobility for throwing"
          }
        ]
      },
      {
        title: "Throwing Chain Activation",
        duration: 10,
        exercises: [
          {
            name: "Hip Flexor Dynamic Stretch",
            sets: 2,
            reps: 10,
            leg: "Each leg",
            movement: "Leg swings, walking lunges",
            focus: "CRITICAL - hip flexibility = velocity"
          },
          {
            name: "Thoracic Spine Extension", 
            sets: 2,
            reps: 12,
            techniques: ["Cat-cow", "Thoracic extensions"],
            focus: "Throwing posture preparation"
          },
          {
            name: "Scapular Wall Slides",
            sets: 2,
            reps: 15,
            focus: "Scapular control for throwing"
          },
          {
            name: "Band External Rotation",
            sets: 2,
            reps: 12,
            resistance: "Light band",
            focus: "Rotator cuff activation"
          },
          {
            name: "Lat Stretch",
            sets: 2,
            duration: "30s each arm",
            position: "Overhead reach",
            focus: "Throwing power preparation"
          }
        ]
      },
      {
        title: "Progressive Throwing",
        duration: 5,
        protocol: [
          {
            distance: "5 yards",
            throws: 5,
            effort: "50%",
            focus: "Mechanics only"
          },
          {
            distance: "10 yards", 
            throws: 5,
            effort: "60%",
            focus: "Smooth rhythm"
          },
          {
            distance: "15 yards",
            throws: 5, 
            effort: "70%",
            focus: "Increased velocity"
          }
        ],
        notes: [
          "Never rush this progression",
          "Quality over speed",
          "Stop if any discomfort",
          "15 throws minimum before training"
        ]
      }
    ]
  },

  // Progressive throwing volume protocol
  throwingProgression: {
    title: "14-Week Throwing Volume Progression",
    description: "Scientific progression from 100 to 650 throws/week",
    
    phaseProgression: {
      foundation: {
        weeks: "1-4",
        weeklyVolume: "100-200 throws",
        sessionDistribution: {
          mechanics: "20-30 throws",
          progression: "30-50 throws", 
          endurance: "40-80 throws"
        },
        focus: ["Proper mechanics", "Pain-free movement", "Progressive volume"],
        keyNotes: [
          "Never throw through pain",
          "Mechanics over velocity",
          "Build throwing endurance base"
        ]
      },
      
      strength: {
        weeks: "5-8", 
        weeklyVolume: "300-450 throws",
        sessionDistribution: {
          mechanics: "40-60 throws",
          velocity: "60-100 throws",
          endurance: "100-150 throws"
        },
        focus: ["Velocity development", "Weighted ball training", "Increased volume"],
        keyNotes: [
          "Introduce velocity work",
          "Monitor arm health closely", 
          "Quality mechanics maintained"
        ]
      },
      
      power: {
        weeks: "9-12",
        weeklyVolume: "500-650 throws", 
        sessionDistribution: {
          velocity: "100-150 throws",
          endurance: "200-300 throws",
          simulation: "150-250 throws"
        },
        focus: ["Peak velocity", "Tournament simulation", "320-throw preparation"],
        keyNotes: [
          "Peak throwing volume",
          "Tournament simulation begins",
          "Maximum velocity development"
        ]
      },
      
      competition: {
        weeks: "13-14",
        weeklyVolume: "200-400 throws",
        sessionDistribution: {
          maintenance: "50-100 throws",
          simulation: "100-200 throws",
          preparation: "50-100 throws"
        },
        focus: ["Taper for competition", "Velocity maintenance", "Mental preparation"],
        keyNotes: [
          "Reduce volume, maintain quality",
          "Focus on competition readiness",
          "Peak without overuse"
        ]
      }
    },
    
    dailyThrowingProtocol: {
      mechanicsSession: {
        totalThrows: "20-40",
        warmup: "10 throws (5-15 yards)",
        drills: "15-25 throws",
        cooldown: "5 throws",
        focus: "Perfect mechanics, no velocity",
        duration: "15-20 minutes"
      },
      
      velocitySession: {
        totalThrows: "40-80",
        warmup: "15 throws progressive",
        velocityWork: "20-40 throws maximum effort",
        cooldown: "10 throws easy",
        focus: "Peak velocity development",
        duration: "25-35 minutes",
        notes: ["3-minute rest between max throws", "Stop if velocity drops"]
      },
      
      enduranceSession: {
        totalThrows: "80-200",
        warmup: "20 throws progressive",
        enduranceWork: "50-150 throws continuous",
        cooldown: "10 throws easy",
        focus: "Throwing stamina, accuracy maintenance",
        duration: "45-75 minutes",
        protocol: ["Consistent rhythm", "Track accuracy decline", "Note fatigue onset"]
      },
      
      tournamentSimulation: {
        totalThrows: "160-320",
        protocol: "8 games × 40 throws",
        gameStructure: {
          warmup: "10 throws",
          gameThrows: "40 throws in 15 minutes", 
          recovery: "10-minute break"
        },
        focus: "Competition preparation",
        duration: "3-4 hours",
        notes: ["Simulate tournament timing", "Practice between-game recovery"]
      }
    }
  },

  // Post-throwing cool-down protocol
  postThrowingCooldown: {
    title: "Post-Throwing Recovery Protocol",
    duration: 15,
    timing: "Immediately after throwing",
    phases: [
      {
        title: "Progressive Cool-Down Throws",
        duration: 5,
        protocol: [
          {
            distance: "15 yards",
            throws: 5,
            effort: "70%",
            focus: "Maintain mechanics"
          },
          {
            distance: "10 yards",
            throws: 5,
            effort: "50%", 
            focus: "Gentle deceleration"
          },
          {
            distance: "5 yards",
            throws: 5,
            effort: "30%",
            focus: "Easy finish"
          }
        ],
        importance: "Critical for arm health"
      },
      {
        title: "Immediate Stretching",
        duration: 8,
        exercises: [
          {
            name: "Sleeper Stretch",
            duration: "90s",
            timing: "Within 5 minutes",
            intensity: "Gentle, no forcing"
          },
          {
            name: "Cross-Body Stretch",
            duration: "60s each arm",
            focus: "Posterior shoulder"
          },
          {
            name: "Overhead Lat Stretch",
            duration: "45s each arm",
            focus: "Throwing power muscles"
          },
          {
            name: "Gentle Arm Circles",
            duration: "30s",
            direction: "Both directions",
            focus: "Circulation and relaxation"
          }
        ]
      },
      {
        title: "Recovery Assessment",
        duration: 2,
        checklist: [
          "Any pain or discomfort?",
          "Normal range of motion?",
          "Muscle tightness level (1-10)?",
          "Energy level for next session?"
        ],
        actions: {
          pain: "Ice 10-15 minutes, assess tomorrow",
          tightness: "Extended stretching, consider massage",
          fatigue: "Ensure adequate rest before next session"
        }
      }
    ]
  },

  // Weekly arm care schedule
  weeklyArmCareSchedule: {
    title: "7-Day Arm Care Programming",
    
    throwingDays: {
      monday: {
        session: "Mechanics + Light Volume",
        preWork: "Daily arm care + throwing warmup",
        postWork: "Cool-down protocol",
        evening: "Sleeper stretch, ice if needed"
      },
      tuesday: {
        session: "Velocity Development",
        preWork: "Extended warm-up + activation",
        postWork: "Full cool-down + extended stretching",
        evening: "Posterior capsule stretch, recovery"
      },
      thursday: {
        session: "Throwing Integration",
        preWork: "Movement prep + throwing warmup",
        postWork: "Cool-down + mobility work",
        evening: "Light arm care, assessment"
      },
      friday: {
        session: "Endurance/Competition",
        preWork: "Competition warmup protocol",
        postWork: "Extended recovery protocol",
        evening: "Full recovery routine"
      },
      saturday: {
        session: "Competition Prep/Simulation",
        preWork: "Game-day warmup routine",
        postWork: "Competition recovery",
        evening: "Recovery and preparation"
      }
    },
    
    recoveryDays: {
      wednesday: {
        focus: "Active recovery + mobility",
        protocol: [
          "Daily arm care (reduced intensity)",
          "Extended hip flexor work",
          "Thoracic spine mobility", 
          "Light soft tissue work"
        ]
      },
      sunday: {
        focus: "Complete recovery + preparation",
        protocol: [
          "Gentle arm care routine",
          "Full body mobility work",
          "Recovery assessment",
          "Week planning"
        ]
      }
    }
  },

  // Injury prevention protocols
  injuryPrevention: {
    title: "QB Injury Prevention System",
    
    dailyChecklist: [
      "Pain assessment (0-10 scale)",
      "Range of motion check",
      "Sleep quality rating",
      "Energy/fatigue level",
      "Previous day recovery"
    ],
    
    redFlags: [
      {
        symptom: "Sharp pain during throwing",
        action: "STOP immediately, seek medical attention"
      },
      {
        symptom: "Persistent aching after sessions",
        action: "Reduce volume, extend recovery protocols"
      },
      {
        symptom: "Loss of velocity without effort decrease",
        action: "Assess mechanics, consider rest day"
      },
      {
        symptom: "Numbness or tingling",
        action: "Medical evaluation required"
      },
      {
        symptom: "Unable to reach overhead without pain",
        action: "Focus on mobility, consider rest"
      }
    ],
    
    weeklyAssessment: {
      mobility: "Sleeper stretch position check",
      strength: "External rotation strength test",
      endurance: "Progressive throwing tolerance",
      recovery: "Between-session recovery speed"
    },
    
    loadManagement: {
      principle: "10% rule - never increase volume >10% per week",
      monitoring: [
        "Weekly throwing volume",
        "Session intensity",
        "Recovery time needed",
        "Performance consistency"
      ],
      adjustments: {
        fatigue: "Reduce volume 20-30%",
        minor_discomfort: "Focus on mechanics, reduce intensity",
        peak_performance: "Maintain current load",
        competition_prep: "Taper volume, maintain intensity"
      }
    }
  }
};

// Throwing session templates by type and phase
export const THROWING_SESSION_TEMPLATES = {
  mechanics: {
    foundation: {
      warmup: "Progressive 5-10-15 yards (5 throws each)",
      drills: [
        { name: "Step-through mechanics", throws: 10 },
        { name: "Balance drills", throws: 8 },
        { name: "Release point consistency", throws: 12 }
      ],
      cooldown: "Easy 5-yard throws (5 throws)",
      totalVolume: "30-35 throws",
      focus: "Perfect mechanics, no velocity pressure"
    },
    
    strength: {
      warmup: "Progressive 5-15-25 yards (5 throws each)",
      drills: [
        { name: "Mechanics reinforcement", throws: 15 },
        { name: "Accuracy at distance", throws: 20 },
        { name: "Consistency work", throws: 15 }
      ],
      cooldown: "Progressive down 15-10-5 yards",
      totalVolume: "50-60 throws",
      focus: "Mechanics under increased volume"
    }
  },
  
  velocity: {
    foundation: {
      warmup: "Extended progressive warmup",
      main: [
        { name: "Weighted ball work", throws: 8, weight: "14 oz" },
        { name: "Regular ball velocity", throws: 12 },
        { name: "Light ball work", throws: 8, weight: "10 oz" }
      ],
      cooldown: "Easy progressive cooldown",
      totalVolume: "40-50 throws",
      focus: "Introduce velocity concepts"
    },
    
    power: {
      warmup: "Competition-level progressive warmup", 
      main: [
        { name: "Maximum velocity throws", throws: 20, rest: "3 minutes between" },
        { name: "Velocity endurance", throws: 30, rest: "1 minute between sets of 5" }
      ],
      cooldown: "Extended progressive cooldown",
      totalVolume: "80-100 throws",
      focus: "Peak velocity development"
    }
  }
};

export default QB_ARM_CARE_PROTOCOLS;