export const QB_TRAINING_PROGRAM = {
  programInfo: {
    title: "COMPLETE QUARTERBACK FLAG FOOTBALL TRAINING PROGRAM",
    subtitle: "14-WEEK ELITE QB DEVELOPMENT",
    duration: "14 Weeks",
    startDate: "2025-11-17",
    endDate: "2026-02-28",
    approach: "Dual-Track Training",
    challengeTarget: "320 throws in weekend tournament",
    frequency: "5-6 days/week",
    sessionDuration: "90-150 minutes",
    weeklyTime: "7-9 hours",
  },

  performanceRequirements: {
    tournamentChallenge: {
      description: "320 Throws in a Weekend",
      breakdown: {
        games: 8,
        throwsPerGame: 40,
        totalThrows: 320,
        gameSpacing: "2 hours apart",
        days: 2,
        demands: [
          "Sustained accuracy under extreme fatigue",
          "Maximum velocity maintained throughout",
          "Mental resilience for 8 games",
          "Recovery between games",
        ],
      },
    },

    evidenceBasedRequirements: {
      armStrength: {
        source: "Journal of Sports Sciences, 2019",
        findings: [
          "Rotator cuff strength correlates with velocity (r=0.72)",
          "Posterior deltoid = primary velocity generator",
          "Triceps contribute 23% of ball velocity",
          "Biceps provide deceleration control",
        ],
        implication: "Must train both acceleration AND deceleration",
      },

      hipFlexorIntegration: {
        source: "American Journal of Sports Medicine, 2020",
        findings: [
          "Hip flexor flexibility increases stride length 8-12%",
          "Tight hip flexors reduce velocity 15-20%",
          "Hip mobility affects trunk rotation efficiency",
          "Lead leg hip flexor strength improves weight transfer",
        ],
        implication: "Hip flexibility is NON-NEGOTIABLE for QBs",
      },

      shoulderMobility: {
        source: "Sports Health, 2018",
        requirements: {
          externalRotation: "110-130° (optimal release)",
          horizontalAbduction: "45-55° (proper arm slot)",
          scapularTilt: "20-25° (healthy mechanics)",
        },
        riskFactor: "Limited mobility increases injury risk by 340%",
        implication: "Daily mobility work is mandatory",
      },

      backStrengthIntegration: {
        source: "Journal of Strength & Conditioning, 2021",
        findings: [
          "Latissimus dorsi provides 18% of throwing power",
          "Thoracic extension adds 8-12 mph velocity",
          "Lower trap strength prevents scapular dyskinesis",
          "Rhomboid strength maintains posture under fatigue",
        ],
        implication: "Back training = throwing power",
      },

      fatigueResistance: {
        source: "Sports Medicine, 2019",
        criticalData: [
          "Accuracy decreases 23% after 30 consecutive throws",
          "Velocity drops 8-12% in final quarter without conditioning",
          "Shoulder endurance training improves late-game performance 15%",
          "Recovery requires 18-24 hours for full restoration",
        ],
        implication: "Endurance training is THE difference-maker",
      },
    },
  },

  dualTrackApproach: {
    description:
      "Lower body foundation + QB-specific upper body specialization",
    track1: {
      name: "Lower Body (Same as WR/DB Program)",
      focus: [
        "Sprint speed and acceleration",
        "Explosive power development",
        "Posterior chain strength",
        "Injury prevention",
        "Game conditioning",
      ],
    },
    track2: {
      name: "Upper Body (QB-Specific)",
      focus: [
        "Arm strength and velocity",
        "Shoulder mobility and health",
        "Throwing endurance",
        "Hip flexor flexibility (critical for throwing)",
        "Back strength for power generation",
      ],
    },
    weeklySchedule: {
      monday: "Lower body strength + QB arm strength",
      tuesday: "Sprint/bounds + QB shoulder mobility",
      wednesday: "Recovery + QB hip flexor/back work",
      thursday: "Lower power + QB throwing integration",
      friday: "Speed/RSA + QB endurance training",
      saturday: "Sprint work + QB throwing session",
      sunday: "Complete recovery (lower + upper body)",
    },
  },

  qbSpecificWarmup: {
    title: "Enhanced 30-Minute QB Prep (Every Session)",
    totalDuration: 30,
    phases: [
      {
        title: "Phase 1: General Activation",
        duration: 8,
        exercises: [
          { name: "Light jog", duration: "2 minutes" },
          { name: "Jump rope", duration: "2 minutes" },
          { name: "Arm circles (progressive)", duration: "2 minutes" },
          { name: "Dynamic stretching", duration: "2 minutes" },
        ],
      },
      {
        title: "Phase 2: Shoulder Complex Activation",
        duration: 12,
        sections: [
          {
            title: "Rotator Cuff Activation",
            duration: 4,
            exercises: [
              { name: "Band external rotation", sets: "2×15 each arm" },
              { name: "Band internal rotation", sets: "2×15 each arm" },
              { name: "Empty can raises", sets: "2×10 each arm" },
              { name: "Full can raises", sets: "2×10 each arm" },
            ],
          },
          {
            title: "Scapular Stabilization",
            duration: 4,
            exercises: [
              { name: "Wall slides", sets: "2×12" },
              { name: "Band pull-aparts", sets: "2×20" },
              { name: "Scapular push-ups", sets: "2×10" },
              { name: "Lower trap raises", sets: "2×12" },
            ],
          },
          {
            title: "Shoulder Mobility",
            duration: 4,
            exercises: [
              { name: "Cross-body stretch", sets: "2×30s each" },
              { name: "Sleeper stretch", sets: "2×30s each" },
              { name: "Posterior capsule stretch", sets: "2×30s each" },
              { name: "Doorway chest stretch", sets: "2×45s" },
            ],
          },
        ],
      },
      {
        title: "Phase 3: Throwing Chain Integration",
        duration: 10,
        sections: [
          {
            title: "Hip & Back Activation",
            duration: 5,
            exercises: [
              { name: "Hip flexor dynamic stretch", sets: "2×30s each leg" },
              { name: "World's greatest stretch", sets: "2×3 each side" },
              { name: "Thoracic rotation", sets: "2×10 each direction" },
              { name: "Cat-cow", sets: "2×12" },
              { name: "Lat activation", sets: "2×10 each arm" },
            ],
          },
          {
            title: "Throwing Motion Prep",
            duration: 5,
            exercises: [
              { name: "Shadow throwing (no ball)", sets: "2×10" },
              { name: "Step-through mechanics", sets: "2×8 each direction" },
              { name: "Trunk rotation with resistance", sets: "2×10 each way" },
              {
                name: "Progressive throwing motion",
                sets: "3 sets (increasing ROM)",
              },
            ],
          },
        ],
      },
    ],
  },

  phases: {
    foundation: {
      title: "Foundation Phase",
      weeks: "1-4",
      dateRange: "December 1-28, 2025",
      goals: [
        "Build lower body strength foundation",
        "Establish arm care protocols",
        "Develop shoulder mobility baseline",
        "Learn throwing mechanics",
        "Build throwing endurance base",
        "Optimize hip flexor flexibility",
      ],
      lowerBodyFocus: [
        "Build posterior chain strength (Nordic curls, RDLs, hip thrusts)",
        "Establish sprint mechanics (drill work 3-4x/week)",
        "Develop aerobic base (tempo work)",
        "Lower body chain health (comprehensive activation)",
        "Learn isometric positions (80-85% effort)",
      ],
      qbSpecificFocus: [
        "Rotator cuff foundation",
        "Shoulder mobility establishment",
        "Hip flexor flexibility baseline",
        "Throwing mechanics learning",
        "Volume progression (100-200 throws/week)",
      ],
    },

    strength: {
      title: "Strength Development",
      weeks: "5-8",
      dateRange: "January 5 - February 1, 2026",
      goals: [
        "Maximum lower body strength",
        "Peak arm strength for velocity",
        "Advanced throwing endurance (150+ throws)",
        "Competition mobility maintenance",
        "Power development emphasis",
      ],
      lowerBodyFocus: [
        "Maximum strength (heavy squats, deadlifts, isometrics)",
        "Increase sprint volume (if indoor space available)",
        "Power development (bounds, jumps)",
        "Repeated sprint introduction",
        "Isometrics at max effort (95-100%)",
      ],
      qbSpecificFocus: [
        "Maximum arm strengthening",
        "Velocity development training",
        "Throwing endurance (150+ throws)",
        "Advanced shoulder mobility",
        "Power integration",
      ],
    },

    power: {
      title: "Power Phase",
      weeks: "9-12",
      dateRange: "February 2-28, 2026",
      goals: [
        "Convert strength to explosive power",
        "Peak throwing velocity",
        "Game-specific conditioning (200+ throws)",
        "Competition preparation",
        "Outdoor transition begins (late phase)",
      ],
      lowerBodyFocus: [
        "Convert strength to explosive power",
        "Game-specific conditioning (RSA training)",
        "Reactive abilities (change of direction)",
        "Resisted/assisted sprints",
        "Complex training methods",
      ],
      qbSpecificFocus: [
        "Peak velocity development",
        "Tournament simulation (320 throws)",
        "Maximum throwing endurance",
        "Mental preparation",
        "Competition throwing patterns",
      ],
    },

    competition: {
      title: "Competition Prep",
      weeks: "13-14",
      dateRange: "March 2-15, 2026",
      goals: [
        "Maintain peak velocity",
        "Taper volume for freshness",
        "Outdoor throwing adaptation",
        "Mental preparation peak",
        "Competition confidence",
      ],
      lowerBodyFocus: [
        "Outdoor sprint transition",
        "Peak power maintenance",
        "Volume reduction (taper)",
        "Competition simulation",
        "Final preparation",
      ],
      qbSpecificFocus: [
        "Velocity maintenance with reduced volume",
        "Outdoor throwing adaptation",
        "Mental peak preparation",
        "Competition routine refinement",
        "Confidence building",
      ],
    },
  },

  throwingVolumeProgression: {
    description: "Progressive throwing volume by phase",
    week1: "80-120 throws",
    week4: "120-180 throws",
    week8: "350-450 throws",
    week12: "500-650 throws",
    week14: "320 throws (taper)",

    byPhase: {
      foundation: "100-200 throws/week",
      strength: "300-450 throws/week",
      power: "500-650 throws/week",
      competition: "200-400 throws/week",
    },

    sessionDistribution: {
      lowVolume: "20-40 throws (mechanics/recovery)",
      moderate: "50-100 throws (training)",
      high: "150-250 throws (endurance)",
      tournamentSim: "320 throws (competition prep)",
    },
  },
};

// QB-Specific Exercise Library
export default QB_TRAINING_PROGRAM;