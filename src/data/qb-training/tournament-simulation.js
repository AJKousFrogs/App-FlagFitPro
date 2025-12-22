export const TOURNAMENT_SIMULATION = {
  fullSimulation: {
    title: "8-Game Tournament Simulation",
    description: "Complete 320 throw simulation",
    schedule: [
      { game: 1, throws: 40, timeLimit: "15 minutes" },
      { rest: "10 minutes", protocol: "Between-game recovery" },
      { game: 2, throws: 40, timeLimit: "15 minutes" },
      { rest: "10 minutes", protocol: "Between-game recovery" },
      { game: 3, throws: 40, timeLimit: "15 minutes" },
      { rest: "10 minutes", protocol: "Between-game recovery" },
      { game: 4, throws: 40, timeLimit: "15 minutes" },
      { rest: "20 minutes", protocol: "End of Day 1" },
      { game: 5, throws: 40, timeLimit: "15 minutes" },
      { rest: "10 minutes", protocol: "Between-game recovery" },
      { game: 6, throws: 40, timeLimit: "15 minutes" },
      { rest: "10 minutes", protocol: "Between-game recovery" },
      { game: 7, throws: 40, timeLimit: "15 minutes" },
      { rest: "10 minutes", protocol: "Between-game recovery" },
      { game: 8, throws: 40, timeLimit: "15 minutes" },
    ],
    totalTime: "3.5-4 hours",
    trackingMetrics: [
      "Velocity every 10th throw",
      "Accuracy percentage each game",
      "Mechanics assessment (games 1, 4, 8)",
      "Mental fatigue rating after each game",
      "Recovery effectiveness between games",
    ],
  },

  betweenGameProtocol: {
    title: "Between-Game Recovery Protocol",
    duration: "8-12 minutes",
    sequence: [
      { activity: "Light arm stretching", duration: "2 minutes" },
      { activity: "Hydration + light snack", duration: "3 minutes" },
      { activity: "Mental reset/visualization", duration: "2 minutes" },
      { activity: "Light throwing preparation", duration: "3 minutes" },
    ],
  },
};

// Weekly Schedules - Foundation Phase (Weeks 1-4)