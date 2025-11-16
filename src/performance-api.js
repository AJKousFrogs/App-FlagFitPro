// Performance Data API Integration
// Handles backend connectivity for athlete performance tracking and trend analysis

export class PerformanceAPI {
  constructor() {
    this.baseUrl =
      window.location.hostname === "localhost"
        ? "http://localhost:3001/api"
        : "https://api.flagfitpro.com";
    this.endpoints = {
      measurements: "/athlete/measurements",
      performanceTests: "/athlete/performance-tests",
      wellness: "/athlete/wellness",
      supplements: "/athlete/supplements",
      injuries: "/athlete/injuries",
      trends: "/athlete/trends",
    };
  }

  // Authentication header
  getAuthHeaders() {
    const token = localStorage.getItem("authToken");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  // Physical Measurements API
  async savePhysicalMeasurements(data) {
    try {
      const response = await fetch(
        `${this.baseUrl}${this.endpoints.measurements}`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          body: JSON.stringify({
            height: data.height,
            weight: data.weight,
            bodyFat: data.bodyFat,
            muscleMass: data.muscleMass,
            timestamp: new Date().toISOString(),
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to save measurements");
      return await response.json();
    } catch (error) {
      logger.error("Error saving measurements:", error);
      // Fallback to localStorage for demo
      return this.saveToLocalStorage("measurements", data);
    }
  }

  async getPhysicalMeasurements(athleteId, timeframe = "6m") {
    try {
      const response = await fetch(
        `${this.baseUrl}${this.endpoints.measurements}?athlete=${athleteId}&timeframe=${timeframe}`,
        {
          headers: this.getAuthHeaders(),
        },
      );

      if (!response.ok) throw new Error("Failed to fetch measurements");
      return await response.json();
    } catch (error) {
      logger.error("Error fetching measurements:", error);
      return this.getFromLocalStorage("measurements");
    }
  }

  // Performance Tests API
  async savePerformanceTest(testType, data) {
    try {
      const response = await fetch(
        `${this.baseUrl}${this.endpoints.performanceTests}`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          body: JSON.stringify({
            testType: testType,
            result: data.result,
            target: data.target,
            conditions: data.conditions || {},
            timestamp: new Date().toISOString(),
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to save performance test");
      return await response.json();
    } catch (error) {
      logger.error("Error saving performance test:", error);
      return this.saveToLocalStorage(`performance_${testType}`, data);
    }
  }

  async getPerformanceHistory(testType, timeframe = "12m") {
    try {
      const response = await fetch(
        `${this.baseUrl}${this.endpoints.performanceTests}/${testType}?timeframe=${timeframe}`,
        {
          headers: this.getAuthHeaders(),
        },
      );

      if (!response.ok) throw new Error("Failed to fetch performance history");
      return await response.json();
    } catch (error) {
      logger.error("Error fetching performance history:", error);
      return this.getFromLocalStorage(`performance_${testType}`);
    }
  }

  // Wellness Tracking API
  async saveWellnessData(data) {
    try {
      const response = await fetch(
        `${this.baseUrl}${this.endpoints.wellness}`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          body: JSON.stringify({
            sleep: data.sleep,
            energy: data.energy,
            stress: data.stress,
            soreness: data.soreness,
            motivation: data.motivation,
            injuries: data.injuries || [],
            notes: data.notes || "",
            date: data.date || new Date().toISOString().split("T")[0],
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to save wellness data");
      return await response.json();
    } catch (error) {
      logger.error("Error saving wellness data:", error);
      return this.saveToLocalStorage("wellness", data);
    }
  }

  async getWellnessHistory(timeframe = "30d") {
    try {
      const response = await fetch(
        `${this.baseUrl}${this.endpoints.wellness}?timeframe=${timeframe}`,
        {
          headers: this.getAuthHeaders(),
        },
      );

      if (!response.ok) throw new Error("Failed to fetch wellness history");
      return await response.json();
    } catch (error) {
      logger.error("Error fetching wellness history:", error);
      return this.getFromLocalStorage("wellness");
    }
  }

  // Supplement Tracking API
  async logSupplementIntake(supplementName, time, notes = "") {
    try {
      const response = await fetch(
        `${this.baseUrl}${this.endpoints.supplements}`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          body: JSON.stringify({
            supplement: supplementName,
            takenAt: time,
            notes: notes,
            date: new Date().toISOString().split("T")[0],
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to log supplement");
      return await response.json();
    } catch (error) {
      logger.error("Error logging supplement:", error);
      return this.saveToLocalStorage("supplements", {
        supplement: supplementName,
        time,
        notes,
      });
    }
  }

  async getSupplementHistory(timeframe = "30d") {
    try {
      const response = await fetch(
        `${this.baseUrl}${this.endpoints.supplements}?timeframe=${timeframe}`,
        {
          headers: this.getAuthHeaders(),
        },
      );

      if (!response.ok) throw new Error("Failed to fetch supplement history");
      return await response.json();
    } catch (error) {
      logger.error("Error fetching supplement history:", error);
      return this.getFromLocalStorage("supplements");
    }
  }

  // Injury Tracking API
  async reportInjury(injuryData) {
    try {
      const response = await fetch(
        `${this.baseUrl}${this.endpoints.injuries}`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          body: JSON.stringify({
            bodyPart: injuryData.bodyPart,
            category: injuryData.category,
            severity: injuryData.severity,
            description: injuryData.description,
            treatmentPlan: injuryData.treatmentPlan || "",
            expectedRecovery: injuryData.expectedRecovery || null,
            reportedAt: new Date().toISOString(),
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to report injury");
      return await response.json();
    } catch (error) {
      logger.error("Error reporting injury:", error);
      return this.saveToLocalStorage("injuries", injuryData);
    }
  }

  async updateInjuryStatus(injuryId, status, notes = "") {
    try {
      const response = await fetch(
        `${this.baseUrl}${this.endpoints.injuries}/${injuryId}`,
        {
          method: "PATCH",
          headers: this.getAuthHeaders(),
          body: JSON.stringify({
            status: status,
            notes: notes,
            updatedAt: new Date().toISOString(),
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to update injury status");
      return await response.json();
    } catch (error) {
      logger.error("Error updating injury:", error);
      return { success: false, error: error.message };
    }
  }

  // Trend Analysis API
  async getPerformanceTrends(timeframe = "12m") {
    try {
      const response = await fetch(
        `${this.baseUrl}${this.endpoints.trends}?timeframe=${timeframe}`,
        {
          headers: this.getAuthHeaders(),
        },
      );

      if (!response.ok) throw new Error("Failed to fetch trends");
      return await response.json();
    } catch (error) {
      logger.error("Error fetching trends:", error);
      return this.generateMockTrends();
    }
  }

  async getComparativeAnalysis(athleteIds, metrics) {
    try {
      const response = await fetch(
        `${this.baseUrl}${this.endpoints.trends}/compare`,
        {
          method: "POST",
          headers: this.getAuthHeaders(),
          body: JSON.stringify({
            athletes: athleteIds,
            metrics: metrics,
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to fetch comparative analysis");
      return await response.json();
    } catch (error) {
      logger.error("Error fetching comparative analysis:", error);
      return { success: false, error: error.message };
    }
  }

  // Bulk Data Export
  async exportPerformanceData(format = "csv", timeframe = "12m") {
    try {
      const response = await fetch(
        `${this.baseUrl}/athlete/export?format=${format}&timeframe=${timeframe}`,
        {
          headers: this.getAuthHeaders(),
        },
      );

      if (!response.ok) throw new Error("Failed to export data");

      if (format === "csv") {
        return await response.text();
      }
      return await response.json();
    } catch (error) {
      logger.error("Error exporting data:", error);
      return this.exportLocalStorageData(format);
    }
  }

  // LocalStorage fallback methods for demo/offline mode
  saveToLocalStorage(key, data) {
    try {
      const existing = JSON.parse(localStorage.getItem(`perf_${key}`) || "[]");
      existing.push({
        ...data,
        id: Date.now(),
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem(`perf_${key}`, JSON.stringify(existing));
      return { success: true, id: existing[existing.length - 1].id };
    } catch (error) {
      logger.error("LocalStorage error:", error);
      return { success: false, error: error.message };
    }
  }

  getFromLocalStorage(key) {
    try {
      return JSON.parse(localStorage.getItem(`perf_${key}`) || "[]");
    } catch (error) {
      logger.error("LocalStorage error:", error);
      return [];
    }
  }

  generateMockTrends() {
    return {
      performanceMetrics: {
        "40YardDash": {
          trend: "improving",
          changePercent: -2.3,
          data: [
            { date: "2024-09-01", value: 4.65 },
            { date: "2024-10-01", value: 4.58 },
            { date: "2024-11-01", value: 4.52 },
          ],
        },
        BroadJump: {
          trend: "improving",
          changePercent: 3.1,
          data: [
            { date: "2024-09-01", value: 9.5 },
            { date: "2024-10-01", value: 9.6 },
            { date: "2024-11-01", value: 9.8 },
          ],
        },
      },
      wellness: {
        averageScore: 7.2,
        trends: {
          sleep: { average: 7.8, trend: "stable" },
          energy: { average: 7.5, trend: "improving" },
          stress: { average: 3.2, trend: "improving" },
        },
      },
      recommendations: [
        "Maintain current sprint training - 40-yard dash improving consistently",
        "Consider adding plyometric exercises - broad jump showing good progress",
        "Focus on stress management techniques to improve wellness scores",
      ],
    };
  }

  exportLocalStorageData(format) {
    const measurements = this.getFromLocalStorage("measurements");
    const wellness = this.getFromLocalStorage("wellness");

    if (format === "csv") {
      let csv = "Date,Height,Weight,Body Fat,Sleep,Energy,Stress\n";
      measurements.forEach((m) => {
        csv += `${m.timestamp},${m.height || ""},${m.weight || ""},${m.bodyFat || ""},,,\n`;
      });
      return csv;
    }

    return {
      measurements,
      wellness,
      exportDate: new Date().toISOString(),
    };
  }

  // Data validation helpers
  validateMeasurementData(data) {
    const errors = [];

    if (data.height && (data.height < 140 || data.height > 220)) {
      errors.push("Height must be between 140-220 cm");
    }

    if (data.weight && (data.weight < 40 || data.weight > 200)) {
      errors.push("Weight must be between 40-200 kg");
    }

    if (data.bodyFat && (data.bodyFat < 3 || data.bodyFat > 50)) {
      errors.push("Body fat must be between 3-50%");
    }

    return errors;
  }

  validateWellnessData(data) {
    const errors = [];
    const scales = ["sleep", "energy", "stress", "soreness", "motivation"];

    scales.forEach((scale) => {
      if (data[scale] && (data[scale] < 1 || data[scale] > 10)) {
        errors.push(`${scale} must be between 1-10`);
      }
    });

    return errors;
  }
}

// Export singleton instance
export const performanceAPI = new PerformanceAPI();

// Utility functions for trend analysis
export const TrendAnalyzer = {
  calculateTrend(data, field) {
    if (data.length < 2) return { trend: "insufficient_data", change: 0 };

    const sorted = data.sort((a, b) => new Date(a.date) - new Date(b.date));
    const latest = sorted[sorted.length - 1][field];
    const previous = sorted[sorted.length - 2][field];

    const change = ((latest - previous) / previous) * 100;

    return {
      trend: change > 2 ? "improving" : change < -2 ? "declining" : "stable",
      change: change.toFixed(1),
      latest,
      previous,
    };
  },

  detectPatterns(data) {
    if (data.length < 4) return [];

    const patterns = [];

    // Check for consistent improvement
    let consecutiveImprovements = 0;
    for (let i = 1; i < data.length; i++) {
      if (data[i].value > data[i - 1].value) {
        consecutiveImprovements++;
      } else {
        consecutiveImprovements = 0;
      }
    }

    if (consecutiveImprovements >= 3) {
      patterns.push("consistent_improvement");
    }

    // Check for plateau
    const recentValues = data.slice(-4).map((d) => d.value);
    const variance = this.calculateVariance(recentValues);
    if (variance < 0.01) {
      patterns.push("plateau");
    }

    return patterns;
  },

  calculateVariance(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  },

  generateInsights(performanceData, wellnessData) {
    const insights = [];

    // Correlate performance with wellness
    if (wellnessData.length > 5) {
      const avgSleep =
        wellnessData.reduce((sum, w) => sum + w.sleep, 0) / wellnessData.length;
      const avgStress =
        wellnessData.reduce((sum, w) => sum + w.stress, 0) /
        wellnessData.length;

      if (avgSleep < 6) {
        insights.push({
          type: "sleep_concern",
          message: "Low sleep quality may be impacting performance",
          recommendation:
            "Focus on sleep hygiene and consider magnesium supplementation",
        });
      }

      if (avgStress > 7) {
        insights.push({
          type: "stress_concern",
          message: "High stress levels detected",
          recommendation:
            "Consider stress management techniques and recovery protocols",
        });
      }
    }

    return insights;
  },
};
