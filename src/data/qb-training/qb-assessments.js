export const QB_ASSESSMENTS = {
  throwingVelocity: {
    title: "Throwing Velocity Assessment",
    equipment: ["Radar gun", "Footballs", "Measuring tape"],
    protocol: [
      "Complete 20-minute warm-up",
      "Progressive throwing to 40 yards",
      "Rest 5 minutes",
      "10 maximum effort throws",
      "Record best, average, worst",
      "Rest 3 minutes between throws",
    ],
    frequency: "Weeks 4, 8, 12, 14",
    expectedImprovements: {
      week4: "+3-5 mph from baseline",
      week8: "+5-8 mph total",
      week12: "+8-12 mph total",
      week14: "+8-15 mph total (peak maintenance)",
    },
  },

  throwingEndurance: {
    title: "Throwing Endurance Test",
    equipment: ["Footballs", "Targets", "Timer"],
    protocol: {
      week4: "100 throws, track accuracy decline",
      week8: "150 throws, track accuracy decline",
      week12: "200 throws, track accuracy decline",
      week14: "Tournament simulation (320 throws)",
    },
    metrics: [
      "Total throws completed",
      "Accuracy percentage by quarter",
      "Velocity maintenance",
      "Mechanics breakdown point",
      "Recovery time needed",
    ],
  },

  shoulderMobility: {
    title: "Shoulder Mobility Assessment",
    equipment: ["Goniometer (optional)", "Measuring tape"],
    measurements: [
      "External rotation (lying down)",
      "Horizontal abduction",
      "Scapular posterior tilt",
      "Overhead reach",
    ],
    targets: {
      externalRotation: "110-130°",
      horizontalAbduction: "45-55°",
      scapularTilt: "20-25°",
    },
    frequency: "Weeks 1, 4, 8, 12, 14",
  },

  hipFlexorFlexibility: {
    title: "Hip Flexor Flexibility Test",
    equipment: ["Couch/bench", "Timer"],
    protocol: [
      "Thomas test position",
      "Couch stretch hold time",
      "Compare left vs right",
      "Measure improvement",
    ],
    targets: {
      couchStretch: "90+ seconds comfortable hold",
      thomasTest: "Thigh below horizontal",
      symmetry: "Less than 10° difference",
    },
  },

  mentalPreparation: {
    title: "Mental Preparation Assessment",
    components: [
      "Pressure throwing accuracy",
      "Fatigue mental resilience",
      "Between-game reset ability",
      "Confidence under pressure",
    ],
    protocol: [
      "Accuracy under time pressure",
      "Throws after fatigue simulation",
      "Performance with distraction",
      "Mental reset timing",
    ],
  },
};

// Competition Simulation Protocols