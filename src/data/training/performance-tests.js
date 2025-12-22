export const PERFORMANCE_TESTS = {
  "40-Yard Sprint": {
    category: "Speed",
    equipment: ["Stopwatch", "Measuring tape", "Cones"],
    setup: [
      "Mark 40-yard distance",
      "Use electronic timing if available",
      "Ensure proper surface (track or turf preferred)",
    ],
    protocol: [
      "Complete thorough warm-up (20+ minutes)",
      "3 practice runs at 75-80%",
      "Rest 5 minutes",
      "3 maximum effort trials",
      "4-5 minutes rest between trials",
      "Record best time",
    ],
    norms: {
      elite: "< 4.40",
      excellent: "4.40-4.50",
      good: "4.50-4.65",
      average: "4.65-4.80",
      "needs work": "> 4.80",
    },
  },

  "Vertical Jump": {
    category: "Power",
    equipment: ["Vertec or wall", "Measuring tape"],
    setup: [
      "Stand against wall or Vertec",
      "Record standing reach height",
      "Clear area for jumping",
    ],
    protocol: [
      "Warm-up with light jumping",
      "Record standing reach",
      "3 practice jumps",
      "3 maximum effort jumps",
      "2-3 minutes rest between max efforts",
      "Record best jump height",
    ],
    norms: {
      elite: "> 35 inches",
      excellent: "30-35 inches",
      good: "25-30 inches",
      average: "20-25 inches",
      "needs work": "< 20 inches",
    },
  },

  "Broad Jump": {
    category: "Power",
    equipment: ["Measuring tape", "Non-slip surface"],
    setup: [
      "Clear landing area",
      "Mark starting line",
      "Ensure safe landing surface",
    ],
    protocol: [
      "Warm-up with light jumping",
      "3 practice jumps at 80%",
      "3 maximum effort jumps",
      "2-3 minutes rest between max efforts",
      "Measure from take-off to heel of closest landing point",
      "Record best distance",
    ],
    norms: {
      elite: "> 10 feet",
      excellent: "9.5-10 feet",
      good: "9-9.5 feet",
      average: "8.5-9 feet",
      "needs work": "< 8.5 feet",
    },
  },
};

// Nutrition Guidelines