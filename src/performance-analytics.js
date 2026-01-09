// Performance Analytics System
// Comprehensive player statistics, tracking, and analytics for flag football training

import { logger } from "./logger.js";

export class PerformanceAnalytics {
  constructor() {
    this.storageKey = "flagfit_performance_data";
    this.performanceData = this.loadPerformanceData();
    this.chartInstances = {};
  }

  // Load performance data from localStorage
  loadPerformanceData() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : this.getDefaultPerformanceData();
    } catch (error) {
      logger.error("Error loading performance data:", error);
      return this.getDefaultPerformanceData();
    }
  }

  // Save performance data to localStorage
  savePerformanceData() {
    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify(this.performanceData),
      );
    } catch (error) {
      logger.error("Error saving performance data:", error);
    }
  }

  // Default performance data structure
  getDefaultPerformanceData() {
    const today = new Date();
    const data = {
      // Performance metrics over time
      performanceTrends: {
        dates: [],
        speed: [],
        agility: [],
        strength: [],
        endurance: [],
        overall: [],
      },

      // Wellness tracking
      wellness: {
        dates: [],
        sleep: [],
        energy: [],
        soreness: [],
        stress: [],
        nutrition: [],
        hydration: [],
      },

      // Body composition tracking
      bodyComposition: {
        dates: [],
        weight: [],
        bodyFat: [],
        muscle: [],
        measurements: {
          chest: [],
          waist: [],
          arms: [],
          thighs: [],
        },
      },

      // Performance tests results
      performanceTests: {
        dates: [],
        fortyYardDash: [],
        verticalJump: [],
        broadJump: [],
        proAgility: [],
        lDrill: [],
        benchPress: [],
        squat: [],
      },

      // Training metrics
      training: {
        dates: [],
        sessionsCompleted: [],
        totalVolume: [],
        intensityScore: [],
        recoveryScore: [],
      },

      // QB-specific metrics (if applicable)
      throwing: {
        dates: [],
        velocity: [],
        accuracy: [],
        volume: [],
        armHealth: [],
      },

      // Physical measurements
      physicalMeasurements: {
        height: null,
        weight: null,
        bodyFat: null,
        restingHR: null,
        bloodPressure: { systolic: null, diastolic: null },
        lastUpdated: null,
      },

      // Current performance scores
      currentScores: {
        speed: 75,
        agility: 82,
        strength: 68,
        endurance: 79,
        overall: 76,
        lastUpdated: today.toISOString(),
      },

      // Goals and targets
      goals: {
        fortyYardDash: { current: null, target: 4.5 },
        verticalJump: { current: null, target: 30 },
        broadJump: { current: null, target: 9.5 },
        weight: { current: null, target: null },
        bodyFat: { current: null, target: 12 },
      },
    };

    // Generate sample historical data for demonstration
    this.generateSampleData(data);
    return data;
  }

  // Generate sample historical data for charts
  generateSampleData(data) {
    const now = new Date();
    const daysBack = 90; // 3 months of data

    for (let i = daysBack; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      // Performance trends (weekly data points)
      if (i % 7 === 0) {
        data.performanceTrends.dates.push(dateStr);
        data.performanceTrends.speed.push(
          70 + Math.random() * 15 + (daysBack - i) / 10,
        );
        data.performanceTrends.agility.push(
          75 + Math.random() * 15 + (daysBack - i) / 12,
        );
        data.performanceTrends.strength.push(
          65 + Math.random() * 20 + (daysBack - i) / 8,
        );
        data.performanceTrends.endurance.push(
          72 + Math.random() * 18 + (daysBack - i) / 15,
        );

        const avg =
          (data.performanceTrends.speed[
            data.performanceTrends.speed.length - 1
          ] +
            data.performanceTrends.agility[
              data.performanceTrends.agility.length - 1
            ] +
            data.performanceTrends.strength[
              data.performanceTrends.strength.length - 1
            ] +
            data.performanceTrends.endurance[
              data.performanceTrends.endurance.length - 1
            ]) /
          4;
        data.performanceTrends.overall.push(avg);
      }

      // Daily wellness data
      data.wellness.dates.push(dateStr);
      data.wellness.sleep.push(6 + Math.random() * 3); // 6-9 hours
      data.wellness.energy.push(6 + Math.random() * 4); // 6-10 scale
      data.wellness.soreness.push(1 + Math.random() * 4); // 1-5 scale
      data.wellness.stress.push(2 + Math.random() * 6); // 2-8 scale
      data.wellness.nutrition.push(6 + Math.random() * 4); // 6-10 scale
      data.wellness.hydration.push(7 + Math.random() * 3); // 7-10 scale

      // Training data (training days only)
      if (Math.random() > 0.3) {
        // 70% chance of training day
        data.training.dates.push(dateStr);
        data.training.sessionsCompleted.push(1);
        data.training.totalVolume.push(60 + Math.random() * 60); // 60-120 minutes
        data.training.intensityScore.push(6 + Math.random() * 4); // 6-10
        data.training.recoveryScore.push(6 + Math.random() * 4); // 6-10
      }

      // Body composition (weekly)
      if (i % 7 === 0) {
        data.bodyComposition.dates.push(dateStr);
        data.bodyComposition.weight.push(175 + Math.random() * 10 - 5); // ±5 lbs variation
        data.bodyComposition.bodyFat.push(12 + Math.random() * 4 - 2); // ±2% variation
        data.bodyComposition.muscle.push(65 + Math.random() * 6 - 3); // ±3% variation
      }
    }

    // Performance tests (monthly)
    const testDates = [60, 30, 0].map((daysAgo) => {
      const date = new Date(now);
      date.setDate(date.getDate() - daysAgo);
      return date.toISOString().split("T")[0];
    });

    testDates.forEach((date, index) => {
      data.performanceTests.dates.push(date);
      data.performanceTests.fortyYardDash.push(
        4.8 - index * 0.05 + (Math.random() * 0.1 - 0.05),
      );
      data.performanceTests.verticalJump.push(
        28 + index * 0.5 + (Math.random() * 2 - 1),
      );
      data.performanceTests.broadJump.push(
        9.2 + index * 0.1 + (Math.random() * 0.2 - 0.1),
      );
      data.performanceTests.proAgility.push(
        4.5 - index * 0.03 + (Math.random() * 0.1 - 0.05),
      );
      data.performanceTests.lDrill.push(
        7.2 - index * 0.05 + (Math.random() * 0.1 - 0.05),
      );
      data.performanceTests.benchPress.push(
        185 + index * 5 + (Math.random() * 10 - 5),
      );
      data.performanceTests.squat.push(
        225 + index * 10 + (Math.random() * 15 - 7.5),
      );
    });
  }

  // Record new performance data
  recordPerformanceTest(testType, value, date = new Date()) {
    const dateStr = date.toISOString().split("T")[0];

    if (this.performanceData.performanceTests[testType]) {
      this.performanceData.performanceTests.dates.push(dateStr);
      this.performanceData.performanceTests[testType].push(value);

      // Update current scores based on performance
      this.updatePerformanceScores();
      this.savePerformanceData();
    }
  }

  // Record wellness data
  recordWellnessData(wellnessData, date = new Date()) {
    const dateStr = date.toISOString().split("T")[0];

    this.performanceData.wellness.dates.push(dateStr);
    Object.keys(wellnessData).forEach((key) => {
      if (this.performanceData.wellness[key]) {
        this.performanceData.wellness[key].push(wellnessData[key]);
      }
    });

    this.savePerformanceData();
  }

  // Update performance scores based on recent test results
  updatePerformanceScores() {
    const tests = this.performanceData.performanceTests;
    const scores = this.performanceData.currentScores;

    // Calculate speed score from 40-yard dash
    if (tests.fortyYardDash.length > 0) {
      const latest40 = tests.fortyYardDash[tests.fortyYardDash.length - 1];
      scores.speed = Math.max(0, Math.min(100, 100 - (latest40 - 4.0) * 25));
    }

    // Calculate agility score from pro-agility and L-drill
    if (tests.proAgility.length > 0) {
      const latestPA = tests.proAgility[tests.proAgility.length - 1];
      scores.agility = Math.max(0, Math.min(100, 100 - (latestPA - 4.0) * 30));
    }

    // Calculate strength score from squat and bench
    if (tests.squat.length > 0 && tests.benchPress.length > 0) {
      const latestSquat = tests.squat[tests.squat.length - 1];
      const latestBench = tests.benchPress[tests.benchPress.length - 1];
      scores.strength = Math.max(
        0,
        Math.min(100, (latestSquat / 3 + latestBench / 2.5) / 2),
      );
    }

    // Calculate overall score
    scores.overall = Math.round(
      (scores.speed + scores.agility + scores.strength + scores.endurance) / 4,
    );
    scores.lastUpdated = new Date().toISOString();
  }

  // Get performance statistics
  getPerformanceStats(timeframe = "30d") {
    const now = new Date();
    let daysBack;

    switch (timeframe) {
      case "7d":
        daysBack = 7;
        break;
      case "30d":
        daysBack = 30;
        break;
      case "90d":
        daysBack = 90;
        break;
      case "6m":
        daysBack = 180;
        break;
      case "12m":
        daysBack = 365;
        break;
      default:
        daysBack = 30;
    }

    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    return {
      performanceTrends: this.filterDataByDate(
        this.performanceData.performanceTrends,
        cutoffDate,
      ),
      wellness: this.filterDataByDate(
        this.performanceData.wellness,
        cutoffDate,
      ),
      training: this.filterDataByDate(
        this.performanceData.training,
        cutoffDate,
      ),
      currentScores: this.performanceData.currentScores,
      improvements: this.calculateImprovements(timeframe),
    };
  }

  // Filter data by date (with memoization)
  filterDataByDate(data, cutoffDate) {
    // Use memoization cache key based on data hash and cutoff date
    const cacheKey = `filter_${cutoffDate.getTime()}_${JSON.stringify(data.dates?.slice(0, 5))}`;

    // Check cache first (simple in-memory cache)
    if (!this._filterCache) {
      this._filterCache = new Map();
    }

    if (this._filterCache.has(cacheKey)) {
      return this._filterCache.get(cacheKey);
    }

    const filteredData = { ...data };
    const cutoffStr = cutoffDate.toISOString().split("T")[0];

    const validIndices = data.dates
      .map((date, index) => ({ date, index }))
      .filter((item) => item.date >= cutoffStr)
      .map((item) => item.index);

    Object.keys(filteredData).forEach((key) => {
      if (Array.isArray(filteredData[key])) {
        filteredData[key] = filteredData[key].filter((_, index) =>
          validIndices.includes(index),
        );
      }
    });

    // Cache result (limit cache size to prevent memory issues)
    if (this._filterCache.size > 50) {
      const firstKey = this._filterCache.keys().next().value;
      this._filterCache.delete(firstKey);
    }
    this._filterCache.set(cacheKey, filteredData);

    return filteredData;
  }

  // Calculate performance improvements
  calculateImprovements(_timeframe) {
    const improvements = {};
    const tests = this.performanceData.performanceTests;

    Object.keys(tests).forEach((testType) => {
      if (testType === "dates" || tests[testType].length < 2) {
        return;
      }

      const values = tests[testType];
      const recent = values[values.length - 1];
      const previous = values[values.length - 2];

      // For time-based tests (lower is better)
      if (["fortyYardDash", "proAgility", "lDrill"].includes(testType)) {
        improvements[testType] = {
          current: recent,
          previous,
          change: previous - recent,
          percentChange: ((previous - recent) / previous) * 100,
          improved: recent < previous,
        };
      } else {
        // For distance/weight tests (higher is better)
        improvements[testType] = {
          current: recent,
          previous,
          change: recent - previous,
          percentChange: ((recent - previous) / previous) * 100,
          improved: recent > previous,
        };
      }
    });

    return improvements;
  }

  // Get wellness summary
  getWellnessSummary(days = 7) {
    const { wellness } = this.performanceData;
    const summary = {};
    ["sleep", "energy", "soreness", "stress", "nutrition", "hydration"].forEach(
      (metric) => {
        const values = wellness[metric].slice(-days);
        summary[metric] = {
          average: values.reduce((a, b) => a + b, 0) / values.length,
          latest: values[values.length - 1],
          trend: this.calculateTrend(values),
        };
      },
    );

    return summary;
  }

  // Calculate trend direction
  calculateTrend(values) {
    if (values.length < 2) {
      return "stable";
    }

    const recent =
      values.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, values.length);
    const older =
      values.slice(0, 3).reduce((a, b) => a + b, 0) /
      Math.min(3, values.length);

    const change = recent - older;
    if (Math.abs(change) < 0.1) {
      return "stable";
    }
    return change > 0 ? "improving" : "declining";
  }

  // Get training load analysis
  getTrainingLoadAnalysis() {
    const { training } = this.performanceData;
    const last7Days = training.totalVolume.slice(-7);
    const last30Days = training.totalVolume.slice(-30);

    return {
      weeklyVolume: last7Days.reduce((a, b) => a + b, 0),
      monthlyVolume: last30Days.reduce((a, b) => a + b, 0),
      averageIntensity:
        training.intensityScore.slice(-7).reduce((a, b) => a + b, 0) /
        Math.min(7, training.intensityScore.length),
      recoveryScore:
        training.recoveryScore.slice(-7).reduce((a, b) => a + b, 0) /
        Math.min(7, training.recoveryScore.length),
      recommendation: this.getTrainingRecommendation(),
    };
  }

  // Get training recommendation based on current data
  getTrainingRecommendation() {
    const wellness = this.getWellnessSummary(3);
    const training = this.getTrainingLoadAnalysis();

    if (wellness.soreness.average > 3.5) {
      return {
        type: "recovery",
        message: "High soreness detected. Consider recovery day.",
      };
    } else if (wellness.energy.average < 6) {
      return {
        type: "light",
        message: "Low energy levels. Light training recommended.",
      };
    } else if (training.averageIntensity > 8.5) {
      return {
        type: "moderate",
        message: "High recent intensity. Moderate session today.",
      };
    } else {
      return {
        type: "normal",
        message: "All systems go! Normal training intensity.",
      };
    }
  }

  // Create performance trend chart with enhanced configuration
  createPerformanceTrendChart(canvasId, timeframe = "6m") {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === "undefined") {
      return;
    }

    // Import enhanced chart config dynamically
    import("./enhanced-chart-config.js")
      .then(({ enhancedChartConfig }) => {
        enhancedChartConfig.updateTheme();
        const stats = this.getPerformanceStats(timeframe);
        const data = stats.performanceTrends;

        if (this.chartInstances[canvasId]) {
          this.chartInstances[canvasId].destroy();
        }

        const config = enhancedChartConfig.getPerformanceTrendsConfig(
          data,
          timeframe,
        );
        this.chartInstances[canvasId] = new Chart(canvas, config);

        // Create custom interactive legend
        setTimeout(() => {
          enhancedChartConfig.createCustomLegend(
            this.chartInstances[canvasId],
            "performance-legend-container",
          );
        }, 100);
      })
      .catch(() => {
        // Fallback to basic chart if enhanced config fails to load
        this.createBasicPerformanceChart(canvasId, timeframe);
      });
  }

  // Fallback basic chart creation
  createBasicPerformanceChart(canvasId, timeframe = "6m") {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === "undefined") {
      return;
    }

    const stats = this.getPerformanceStats(timeframe);
    const data = stats.performanceTrends;

    if (this.chartInstances[canvasId]) {
      this.chartInstances[canvasId].destroy();
    }

    this.chartInstances[canvasId] = new Chart(canvas, {
      type: "line",
      data: {
        labels: data.dates.map((date) => new Date(date).toLocaleDateString()),
        datasets: [
          {
            label: "Overall",
            data: data.overall,
            borderColor: "rgb(99, 102, 241)",
            backgroundColor: "rgba(99, 102, 241, 0.1)",
            borderWidth: 3,
            fill: true,
            tension: 0.4,
          },
          {
            label: "Speed",
            data: data.speed,
            borderColor: "rgb(239, 68, 68)",
            backgroundColor: "transparent",
            borderWidth: 2,
            tension: 0.4,
          },
          {
            label: "Agility",
            data: data.agility,
            borderColor: "rgb(245, 158, 11)",
            backgroundColor: "transparent",
            borderWidth: 2,
            tension: 0.4,
          },
          {
            label: "Strength",
            data: data.strength,
            borderColor: "rgb(16, 185, 129)",
            backgroundColor: "transparent",
            borderWidth: 2,
            tension: 0.4,
          },
          {
            label: "Endurance",
            data: data.endurance,
            borderColor: "rgb(139, 92, 246)",
            backgroundColor: "transparent",
            borderWidth: 2,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              usePointStyle: true,
              padding: 20,
            },
          },
          tooltip: {
            mode: "index",
            intersect: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            grid: {
              color: "rgba(0,0,0,0.1)",
            },
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
        interaction: {
          intersect: false,
          mode: "index",
        },
      },
    });
  }

  // Create wellness chart with enhanced configuration
  createWellnessChart(canvasId, timeframe = "30d") {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === "undefined") {
      return;
    }

    // Import enhanced chart config dynamically
    import("./enhanced-chart-config.js")
      .then(({ enhancedChartConfig }) => {
        enhancedChartConfig.updateTheme();
        const stats = this.getPerformanceStats(timeframe);
        const data = stats.wellness;

        if (this.chartInstances[canvasId]) {
          this.chartInstances[canvasId].destroy();
        }

        const config = enhancedChartConfig.getWellnessChartConfig(
          data,
          timeframe,
        );
        this.chartInstances[canvasId] = new Chart(canvas, config);

        // Create custom interactive legend
        setTimeout(() => {
          enhancedChartConfig.createCustomLegend(
            this.chartInstances[canvasId],
            "wellness-legend-container",
          );
        }, 100);
      })
      .catch(() => {
        // Fallback to basic chart if enhanced config fails to load
        this.createBasicWellnessChart(canvasId, timeframe);
      });
  }

  // Fallback basic wellness chart
  createBasicWellnessChart(canvasId, timeframe = "30d") {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === "undefined") {
      return;
    }

    const stats = this.getPerformanceStats(timeframe);
    const data = stats.wellness;

    if (this.chartInstances[canvasId]) {
      this.chartInstances[canvasId].destroy();
    }

    this.chartInstances[canvasId] = new Chart(canvas, {
      type: "line",
      data: {
        labels: data.dates.map((date) => new Date(date).toLocaleDateString()),
        datasets: [
          {
            label: "Sleep (hrs)",
            data: data.sleep,
            borderColor: "rgb(99, 102, 241)",
            backgroundColor: "transparent",
            borderWidth: 2,
            yAxisID: "y",
            tension: 0.4,
          },
          {
            label: "Energy (1-10)",
            data: data.energy,
            borderColor: "rgb(245, 158, 11)",
            backgroundColor: "transparent",
            borderWidth: 2,
            yAxisID: "y1",
            tension: 0.4,
          },
          {
            label: "Soreness (1-5)",
            data: data.soreness,
            borderColor: "rgb(239, 68, 68)",
            backgroundColor: "transparent",
            borderWidth: 2,
            yAxisID: "y1",
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              usePointStyle: true,
              padding: 20,
            },
          },
          tooltip: {
            mode: "index",
            intersect: false,
          },
        },
        scales: {
          y: {
            type: "linear",
            display: true,
            position: "left",
            title: {
              display: true,
              text: "Hours",
            },
            min: 0,
            max: 12,
          },
          y1: {
            type: "linear",
            display: true,
            position: "right",
            title: {
              display: true,
              text: "Scale (1-10)",
            },
            min: 0,
            max: 10,
            grid: {
              drawOnChartArea: false,
            },
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
      },
    });
  }

  // Create body composition chart
  createBodyCompositionChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === "undefined") {
      return;
    }

    const data = this.performanceData.bodyComposition;

    if (this.chartInstances[canvasId]) {
      this.chartInstances[canvasId].destroy();
    }

    this.chartInstances[canvasId] = new Chart(canvas, {
      type: "line",
      data: {
        labels: data.dates.map((date) => new Date(date).toLocaleDateString()),
        datasets: [
          {
            label: "Weight (lbs)",
            data: data.weight,
            borderColor: "rgb(99, 102, 241)",
            backgroundColor: "rgba(99, 102, 241, 0.1)",
            borderWidth: 3,
            fill: true,
            yAxisID: "y",
          },
          {
            label: "Body Fat (%)",
            data: data.bodyFat,
            borderColor: "rgb(239, 68, 68)",
            backgroundColor: "transparent",
            borderWidth: 2,
            yAxisID: "y1",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              usePointStyle: true,
              padding: 20,
            },
          },
        },
        scales: {
          y: {
            type: "linear",
            display: true,
            position: "left",
            title: {
              display: true,
              text: "Weight (lbs)",
            },
          },
          y1: {
            type: "linear",
            display: true,
            position: "right",
            title: {
              display: true,
              text: "Body Fat (%)",
            },
            grid: {
              drawOnChartArea: false,
            },
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
      },
    });
  }

  // Create performance overview radar chart
  createPerformanceOverviewChart(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === "undefined") {
      return;
    }

    const scores = this.performanceData.currentScores;

    if (this.chartInstances[canvasId]) {
      this.chartInstances[canvasId].destroy();
    }

    this.chartInstances[canvasId] = new Chart(canvas, {
      type: "radar",
      data: {
        labels: ["Speed", "Agility", "Strength", "Endurance", "Power"],
        datasets: [
          {
            label: "Current Performance",
            data: [
              scores.speed,
              scores.agility,
              scores.strength,
              scores.endurance,
              scores.overall,
            ],
            backgroundColor: "rgba(99, 102, 241, 0.2)",
            borderColor: "rgb(99, 102, 241)",
            borderWidth: 2,
            pointBackgroundColor: "rgb(99, 102, 241)",
            pointBorderColor: "#fff",
            pointHoverBackgroundColor: "#fff",
            pointHoverBorderColor: "rgb(99, 102, 241)",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          r: {
            angleLines: {
              display: true,
              color: "rgba(0,0,0,0.1)",
            },
            grid: {
              color: "rgba(0,0,0,0.1)",
            },
            pointLabels: {
              font: {
                size: 12,
                weight: "bold",
              },
            },
            ticks: {
              display: false,
            },
            min: 0,
            max: 100,
          },
        },
      },
    });
  }

  // Destroy all charts (cleanup)
  destroyCharts() {
    Object.values(this.chartInstances).forEach((chart) => {
      if (chart) {
        chart.destroy();
      }
    });
    this.chartInstances = {};
  }
}

// Performance calculation utilities
export const PerformanceCalculations = {
  // Calculate BMI
  calculateBMI(weight, height) {
    const heightInches = parseFloat(height);
    const weightLbs = parseFloat(weight);
    if (!heightInches || !weightLbs) {
      return null;
    }

    const heightMeters = heightInches * 0.0254;
    const weightKg = weightLbs * 0.453592;
    return (weightKg / (heightMeters * heightMeters)).toFixed(1);
  },

  // Get BMI category
  getBMICategory(bmi) {
    if (!bmi) {
      return "Unknown";
    }
    const bmiNum = parseFloat(bmi);
    if (bmiNum < 18.5) {
      return "Underweight";
    }
    if (bmiNum < 25) {
      return "Normal";
    }
    if (bmiNum < 30) {
      return "Overweight";
    }
    return "Obese";
  },

  // Calculate body fat percentage using Navy method
  calculateBodyFat(gender, waist, neck, hip = null, height = null) {
    if (gender === "male") {
      return (
        86.01 * Math.log10(waist - neck) - 70.041 * Math.log10(height) + 36.76
      );
    } else {
      return (
        163.205 * Math.log10(waist + hip - neck) -
        97.684 * Math.log10(height) -
        78.387
      );
    }
  },

  // Performance grade based on percentiles
  getPerformanceGrade(testType, value, age = 20, gender = "male") {
    const standards = this.getPerformanceStandards(age, gender);
    const testStandards = standards[testType];

    if (!testStandards) {
      return { grade: "N/A", percentile: 0 };
    }

    let percentile = 0;
    if (["fortyYardDash", "proAgility", "lDrill"].includes(testType)) {
      // Lower is better for time-based tests
      if (value <= testStandards.excellent) {
        percentile = 95;
      } else if (value <= testStandards.good) {
        percentile = 80;
      } else if (value <= testStandards.average) {
        percentile = 60;
      } else if (value <= testStandards.belowAverage) {
        percentile = 40;
      } else {
        percentile = 20;
      }
    } else {
      // Higher is better for distance/weight tests
      if (value >= testStandards.excellent) {
        percentile = 95;
      } else if (value >= testStandards.good) {
        percentile = 80;
      } else if (value >= testStandards.average) {
        percentile = 60;
      } else if (value >= testStandards.belowAverage) {
        percentile = 40;
      } else {
        percentile = 20;
      }
    }

    const grade =
      percentile >= 90
        ? "A"
        : percentile >= 80
          ? "B"
          : percentile >= 70
            ? "C"
            : percentile >= 60
              ? "D"
              : "F";

    return { grade, percentile };
  },

  // Performance standards by age and gender
  getPerformanceStandards(_age = 20, gender = "male") {
    // These are example standards - would need sport-specific research data
    if (gender === "male") {
      return {
        fortyYardDash: {
          excellent: 4.3,
          good: 4.5,
          average: 4.7,
          belowAverage: 5.0,
        },
        verticalJump: {
          excellent: 32,
          good: 28,
          average: 24,
          belowAverage: 20,
        },
        broadJump: {
          excellent: 10.0,
          good: 9.5,
          average: 9.0,
          belowAverage: 8.5,
        },
        proAgility: {
          excellent: 4.0,
          good: 4.2,
          average: 4.4,
          belowAverage: 4.6,
        },
        lDrill: { excellent: 6.8, good: 7.0, average: 7.3, belowAverage: 7.6 },
        benchPress: {
          excellent: 225,
          good: 185,
          average: 155,
          belowAverage: 135,
        },
        squat: { excellent: 315, good: 275, average: 225, belowAverage: 185 },
      };
    } else {
      return {
        fortyYardDash: {
          excellent: 4.8,
          good: 5.0,
          average: 5.2,
          belowAverage: 5.5,
        },
        verticalJump: {
          excellent: 24,
          good: 20,
          average: 16,
          belowAverage: 12,
        },
        broadJump: {
          excellent: 8.5,
          good: 8.0,
          average: 7.5,
          belowAverage: 7.0,
        },
        proAgility: {
          excellent: 4.4,
          good: 4.6,
          average: 4.8,
          belowAverage: 5.0,
        },
        lDrill: { excellent: 7.2, good: 7.5, average: 7.8, belowAverage: 8.1 },
        benchPress: {
          excellent: 135,
          good: 115,
          average: 95,
          belowAverage: 75,
        },
        squat: { excellent: 185, good: 155, average: 125, belowAverage: 95 },
      };
    }
  },
};

// Create singleton instance
export const performanceAnalytics = new PerformanceAnalytics();

export default performanceAnalytics;
