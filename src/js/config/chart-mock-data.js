/**
 * Mock data for Chart.js visualizations
 * Used as fallback when API data is unavailable
 */

export const CHART_MOCK_DATA = {
  performanceTrends: {
    weeks: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7"],
    overallScores: [78, 82, 79, 85, 87, 89, 91],
    trainingScores: [75, 78, 80, 83, 86, 88, 90]
  },
  teamChemistry: {
    metrics: ["Communication", "Coordination", "Trust", "Cohesion", "Leadership", "Adaptability"],
    currentScores: [8.5, 7.8, 9.1, 8.2, 7.5, 8.8],
    targetScores: [9.0, 8.5, 9.5, 8.8, 8.0, 9.2]
  },
  trainingDistribution: {
    trainingTypes: ["Agility Training", "Speed Development", "Technical Skills", "Strength Training", "Recovery Sessions"],
    sessionCounts: [30, 25, 20, 15, 10]
  },
  positionPerformance: {
    positions: ["Quarterback", "Wide Receiver", "Running Back", "Defensive Back", "Rusher"],
    currentScores: [87, 92, 89, 85, 78],
    targetScores: [90, 95, 92, 88, 82]
  },
  olympicProgress: {
    qualified: 73,
    remaining: 27
  },
  injuryRisk: {
    riskLevels: ["Low Risk", "Medium Risk", "High Risk"],
    riskPercentages: [75, 20, 5]
  },
  speedDevelopment: {
    weeks: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Week 7"],
    fortyYardTimes: [4.65, 4.62, 4.58, 4.55, 4.52, 4.49, 4.46],
    tenYardTimes: [1.68, 1.65, 1.62, 1.6, 1.58, 1.56, 1.54]
  },
  engagementFunnel: {
    stages: ["App Opens", "Dashboard Views", "Training Started", "Session Complete", "Goal Set", "Goal Achieved"],
    userCounts: [1000, 850, 720, 680, 450, 320]
  }
};

