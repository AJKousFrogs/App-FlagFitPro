// Netlify Functions - Performance Data API
// Handles athlete performance data storage and retrieval

// const { MongoClient } = require("mongodb"); // Reserved for future MongoDB integration

// Mock database for demo (replace with actual MongoDB connection)
const mockDB = {
  measurements: [],
  performanceTests: [],
  wellness: [],
  supplements: [],
  injuries: [],
};

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

exports.handler = async (event, _context) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: "",
    };
  }

  try {
    const { httpMethod, path, body, queryStringParameters } = event;
    const pathSegments = path.split("/").filter(Boolean);
    const endpoint = pathSegments[pathSegments.length - 1];

    // Parse authorization header
    const authHeader = event.headers.authorization;
    const userId = parseAuthToken(authHeader); // Mock auth for demo

    if (!userId) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: "Unauthorized" }),
      };
    }

    let response;

    switch (endpoint) {
      case "measurements":
        response = await handleMeasurements(
          httpMethod,
          userId,
          body,
          queryStringParameters,
        );
        break;
      case "performance-tests":
        response = await handlePerformanceTests(
          httpMethod,
          userId,
          body,
          queryStringParameters,
        );
        break;
      case "wellness":
        response = await handleWellness(
          httpMethod,
          userId,
          body,
          queryStringParameters,
        );
        break;
      case "supplements":
        response = await handleSupplements(
          httpMethod,
          userId,
          body,
          queryStringParameters,
        );
        break;
      case "injuries":
        response = await handleInjuries(
          httpMethod,
          userId,
          body,
          queryStringParameters,
        );
        break;
      case "trends":
        response = await handleTrends(
          httpMethod,
          userId,
          queryStringParameters,
        );
        break;
      case "export":
        response = await handleExport(userId, queryStringParameters);
        break;
      default:
        response = {
          statusCode: 404,
          body: JSON.stringify({ error: "Endpoint not found" }),
        };
    }

    return {
      ...response,
      headers: { ...corsHeaders, ...response.headers },
    };
  } catch (error) {
    console.error("API Error:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};

// Physical Measurements Handler
async function handleMeasurements(method, userId, body, query) {
  switch (method) {
    case "GET":
      const timeframe = query?.timeframe || "6m";
      const page = parseInt(query?.page || "1", 10);
      const limit = Math.min(parseInt(query?.limit || "50", 10), 100); // Max 100 per page
      const offset = (page - 1) * limit;

      const measurements = mockDB.measurements.filter(
        (m) => m.userId === userId && isWithinTimeframe(m.timestamp, timeframe),
      );

      // Sort by timestamp descending (newest first)
      measurements.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
      );

      const total = measurements.length;
      const paginatedMeasurements = measurements.slice(offset, offset + limit);

      return {
        statusCode: 200,
        body: JSON.stringify({
          data: paginatedMeasurements,
          summary: calculateMeasurementsSummary(paginatedMeasurements),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasMore: offset + limit < total,
          },
        }),
      };

    case "POST":
      const measurementData = JSON.parse(body);
      const newMeasurement = {
        id: generateId(),
        userId,
        ...measurementData,
        timestamp: new Date().toISOString(),
      };

      // Validate data
      const errors = validateMeasurementData(measurementData);
      if (errors.length > 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({ errors }),
        };
      }

      mockDB.measurements.push(newMeasurement);
      return {
        statusCode: 201,
        body: JSON.stringify({
          success: true,
          id: newMeasurement.id,
          data: newMeasurement,
        }),
      };

    default:
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" }),
      };
  }
}

// Performance Tests Handler
async function handlePerformanceTests(method, userId, body, query) {
  switch (method) {
    case "GET":
      const testType = query?.testType;
      const timeframe = query?.timeframe || "12m";
      const page = parseInt(query?.page || "1", 10);
      const limit = Math.min(parseInt(query?.limit || "50", 10), 100); // Max 100 per page
      const offset = (page - 1) * limit;

      let tests = mockDB.performanceTests.filter(
        (t) => t.userId === userId && isWithinTimeframe(t.timestamp, timeframe),
      );

      if (testType) {
        tests = tests.filter((t) => t.testType === testType);
      }

      // Sort by timestamp descending (newest first)
      tests.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      const total = tests.length;
      const paginatedTests = tests.slice(offset, offset + limit);

      return {
        statusCode: 200,
        body: JSON.stringify({
          data: paginatedTests,
          trends: calculatePerformanceTrends(paginatedTests),
          summary: calculateTestsSummary(paginatedTests),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasMore: offset + limit < total,
          },
        }),
      };

    case "POST":
      const testData = JSON.parse(body);
      const newTest = {
        id: generateId(),
        userId,
        ...testData,
        timestamp: new Date().toISOString(),
      };

      mockDB.performanceTests.push(newTest);
      return {
        statusCode: 201,
        body: JSON.stringify({
          success: true,
          id: newTest.id,
          improvement: calculateImprovement(
            testData.testType,
            testData.result,
            userId,
          ),
        }),
      };

    default:
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" }),
      };
  }
}

// Wellness Data Handler
async function handleWellness(method, userId, body, query) {
  switch (method) {
    case "GET":
      const timeframe = query?.timeframe || "30d";
      const wellness = mockDB.wellness.filter(
        (w) => w.userId === userId && isWithinTimeframe(w.date, timeframe),
      );

      return {
        statusCode: 200,
        body: JSON.stringify({
          data: wellness,
          averages: calculateWellnessAverages(wellness),
          patterns: detectWellnessPatterns(wellness),
        }),
      };

    case "POST":
      const wellnessData = JSON.parse(body);
      const newWellness = {
        id: generateId(),
        userId,
        ...wellnessData,
        timestamp: new Date().toISOString(),
      };

      mockDB.wellness.push(newWellness);
      return {
        statusCode: 201,
        body: JSON.stringify({
          success: true,
          id: newWellness.id,
        }),
      };

    default:
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" }),
      };
  }
}

// Supplements Handler
async function handleSupplements(method, userId, body, query) {
  switch (method) {
    case "GET":
      const timeframe = query?.timeframe || "30d";
      const supplements = mockDB.supplements.filter(
        (s) => s.userId === userId && isWithinTimeframe(s.date, timeframe),
      );

      return {
        statusCode: 200,
        body: JSON.stringify({
          data: supplements,
          compliance: calculateSupplementCompliance(supplements),
        }),
      };

    case "POST":
      const supplementData = JSON.parse(body);
      const newSupplement = {
        id: generateId(),
        userId,
        ...supplementData,
        timestamp: new Date().toISOString(),
      };

      mockDB.supplements.push(newSupplement);
      return {
        statusCode: 201,
        body: JSON.stringify({
          success: true,
          id: newSupplement.id,
        }),
      };

    default:
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" }),
      };
  }
}

// Injuries Handler
async function handleInjuries(method, userId, body, query) {
  switch (method) {
    case "GET":
      const status = query?.status; // active, recovered, all
      let injuries = mockDB.injuries.filter((i) => i.userId === userId);

      if (status && status !== "all") {
        injuries = injuries.filter((i) => i.status === status);
      }

      return {
        statusCode: 200,
        body: JSON.stringify({
          data: injuries,
          statistics: calculateInjuryStatistics(injuries),
        }),
      };

    case "POST":
      const injuryData = JSON.parse(body);
      const newInjury = {
        id: generateId(),
        userId,
        status: "active",
        ...injuryData,
        reportedAt: new Date().toISOString(),
      };

      mockDB.injuries.push(newInjury);
      return {
        statusCode: 201,
        body: JSON.stringify({
          success: true,
          id: newInjury.id,
        }),
      };

    case "PATCH":
      const updateData = JSON.parse(body);
      const pathSegments = query.path.split("/");
      const injuryId = pathSegments[pathSegments.length - 1];

      const injuryIndex = mockDB.injuries.findIndex(
        (i) => i.id === injuryId && i.userId === userId,
      );

      if (injuryIndex === -1) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: "Injury not found" }),
        };
      }

      mockDB.injuries[injuryIndex] = {
        ...mockDB.injuries[injuryIndex],
        ...updateData,
        updatedAt: new Date().toISOString(),
      };

      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          data: mockDB.injuries[injuryIndex],
        }),
      };

    default:
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" }),
      };
  }
}

// Trends Analysis Handler
async function handleTrends(method, userId, query) {
  if (method !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const timeframe = query?.timeframe || "12m";

  // Gather all data for trend analysis
  const measurements = mockDB.measurements.filter(
    (m) => m.userId === userId && isWithinTimeframe(m.timestamp, timeframe),
  );

  const performanceTests = mockDB.performanceTests.filter(
    (t) => t.userId === userId && isWithinTimeframe(t.timestamp, timeframe),
  );

  const wellness = mockDB.wellness.filter(
    (w) => w.userId === userId && isWithinTimeframe(w.date, timeframe),
  );

  const trends = {
    performance: calculatePerformanceTrends(performanceTests),
    body_composition: calculateBodyCompositionTrends(measurements),
    wellness: calculateWellnessTrends(wellness),
    correlations: calculateCorrelations(performanceTests, wellness),
    insights: generateInsights(performanceTests, wellness, measurements),
    recommendations: generateRecommendations(
      performanceTests,
      wellness,
      measurements,
    ),
  };

  return {
    statusCode: 200,
    body: JSON.stringify(trends),
  };
}

// Data Export Handler
async function handleExport(userId, query) {
  const format = query?.format || "json";
  const timeframe = query?.timeframe || "12m";

  // Gather all user data
  const allData = {
    measurements: mockDB.measurements.filter(
      (m) => m.userId === userId && isWithinTimeframe(m.timestamp, timeframe),
    ),
    performanceTests: mockDB.performanceTests.filter(
      (t) => t.userId === userId && isWithinTimeframe(t.timestamp, timeframe),
    ),
    wellness: mockDB.wellness.filter(
      (w) => w.userId === userId && isWithinTimeframe(w.date, timeframe),
    ),
    supplements: mockDB.supplements.filter(
      (s) => s.userId === userId && isWithinTimeframe(s.date, timeframe),
    ),
    injuries: mockDB.injuries.filter((i) => i.userId === userId),
    exportedAt: new Date().toISOString(),
  };

  if (format === "csv") {
    const csv = convertToCSV(allData);
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="performance-data.csv"',
      },
      body: csv,
    };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(allData),
  };
}

// Utility Functions
function parseAuthToken(authHeader) {
  // Mock authentication - return demo user ID
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return "demo-user-123";
  }
  return null;
}

function generateId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function isWithinTimeframe(date, timeframe) {
  const now = new Date();
  const targetDate = new Date(date);

  const timeframeMap = {
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
    "3m": 3 * 30 * 24 * 60 * 60 * 1000,
    "6m": 6 * 30 * 24 * 60 * 60 * 1000,
    "12m": 12 * 30 * 24 * 60 * 60 * 1000,
  };

  const timeframeMs = timeframeMap[timeframe] || timeframeMap["12m"];
  return now - targetDate <= timeframeMs;
}

function validateMeasurementData(data) {
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

function calculateMeasurementsSummary(measurements) {
  if (measurements.length === 0) return null;

  const latest = measurements[measurements.length - 1];
  const previous = measurements[measurements.length - 2];

  const changes = previous
    ? {
        weight: (
          ((latest.weight - previous.weight) / previous.weight) *
          100
        ).toFixed(1),
        bodyFat: (
          ((latest.bodyFat - previous.bodyFat) / previous.bodyFat) *
          100
        ).toFixed(1),
      }
    : null;

  return { latest, changes };
}

function calculatePerformanceTrends(tests) {
  const trends = {};
  const testTypes = [...new Set(tests.map((t) => t.testType))];

  testTypes.forEach((type) => {
    const typeTests = tests
      .filter((t) => t.testType === type)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    if (typeTests.length >= 2) {
      const latest = typeTests[typeTests.length - 1].result;
      const previous = typeTests[typeTests.length - 2].result;
      const change = (((latest - previous) / previous) * 100).toFixed(1);

      trends[type] = {
        trend: change > 0 ? "improving" : change < 0 ? "declining" : "stable",
        changePercent: change,
        data: typeTests.map((t) => ({ date: t.timestamp, value: t.result })),
      };
    }
  });

  return trends;
}

function calculateWellnessAverages(wellness) {
  if (wellness.length === 0) return null;

  const metrics = ["sleep", "energy", "stress", "soreness", "motivation"];
  const averages = {};

  metrics.forEach((metric) => {
    const values = wellness.map((w) => w[metric]).filter((v) => v != null);
    averages[metric] =
      values.length > 0
        ? (values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(1)
        : null;
  });

  return averages;
}

function convertToCSV(data) {
  let csv = "Date,Type,Metric,Value,Notes\n";

  // Add measurements
  data.measurements.forEach((m) => {
    csv += `${m.timestamp},Measurement,Height,${m.height},""\n`;
    csv += `${m.timestamp},Measurement,Weight,${m.weight},""\n`;
    csv += `${m.timestamp},Measurement,BodyFat,${m.bodyFat},""\n`;
  });

  // Add performance tests
  data.performanceTests.forEach((t) => {
    csv += `${t.timestamp},Performance,${t.testType},${t.result},""\n`;
  });

  // Add wellness data
  data.wellness.forEach((w) => {
    csv += `${w.date},Wellness,Sleep,${w.sleep},""\n`;
    csv += `${w.date},Wellness,Energy,${w.energy},""\n`;
    csv += `${w.date},Wellness,Stress,${w.stress},""\n`;
  });

  return csv;
}

// Additional analytics functions
function calculateCorrelations(_performanceTests, _wellness) {
  // Simplified correlation analysis
  return {
    sleep_performance: 0.65,
    stress_performance: -0.43,
    energy_performance: 0.72,
  };
}

function generateInsights(performanceTests, wellness, _measurements) {
  const insights = [];

  if (wellness.length > 5) {
    const avgSleep =
      wellness.reduce((sum, w) => sum + w.sleep, 0) / wellness.length;
    if (avgSleep < 6) {
      insights.push(
        "Sleep quality below optimal range - may impact performance",
      );
    }
  }

  if (performanceTests.length > 3) {
    const recent40Yard = performanceTests
      .filter((t) => t.testType === "40YardDash")
      .slice(-3);

    if (recent40Yard.length >= 3) {
      const isImproving = recent40Yard.every(
        (test, i) => i === 0 || test.result < recent40Yard[i - 1].result,
      );

      if (isImproving) {
        insights.push("Consistent improvement in sprint speed detected");
      }
    }
  }

  return insights;
}

function generateRecommendations(_performanceTests, _wellness, _measurements) {
  return [
    "Maintain current training intensity based on performance improvements",
    "Consider sleep optimization strategies for enhanced recovery",
    "Monitor stress levels and implement recovery protocols as needed",
  ];
}

function calculateTestsSummary(tests) {
  const byType = {};
  tests.forEach((test) => {
    if (!byType[test.testType]) byType[test.testType] = [];
    byType[test.testType].push(test.result);
  });

  const summary = {};
  Object.keys(byType).forEach((type) => {
    const results = byType[type];
    summary[type] = {
      count: results.length,
      best: Math.min(...results), // Assuming lower is better for most tests
      average: (
        results.reduce((sum, r) => sum + r, 0) / results.length
      ).toFixed(2),
      latest: results[results.length - 1],
    };
  });

  return summary;
}

function calculateImprovement(testType, currentResult, userId) {
  // Find previous test results for this user and test type
  const previousTests = mockDB.performanceTests
    .filter((t) => t.userId === userId && t.testType === testType)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(1); // Skip the most recent (current) one

  if (previousTests.length === 0) {
    return { percent: 0, trend: "no_data" };
  }

  const previousResult = previousTests[0].result;
  const percentChange = (
    ((currentResult - previousResult) / previousResult) *
    100
  ).toFixed(1);

  return {
    percent: parseFloat(percentChange),
    trend:
      percentChange > 0
        ? "improving"
        : percentChange < 0
          ? "declining"
          : "stable",
    previous: previousResult,
  };
}

function detectWellnessPatterns(wellness) {
  if (wellness.length < 3) {
    return { patterns: [], insights: [] };
  }

  const patterns = [];
  const insights = [];

  // Check for sleep patterns
  const avgSleep =
    wellness.reduce((sum, w) => sum + (w.sleep || 0), 0) / wellness.length;
  if (avgSleep < 6) {
    patterns.push("low_sleep");
    insights.push("Consistently low sleep quality detected");
  }

  // Check for stress patterns
  const avgStress =
    wellness.reduce((sum, w) => sum + (w.stress || 0), 0) / wellness.length;
  if (avgStress > 7) {
    patterns.push("high_stress");
    insights.push("Elevated stress levels detected");
  }

  // Check for energy patterns
  const avgEnergy =
    wellness.reduce((sum, w) => sum + (w.energy || 0), 0) / wellness.length;
  if (avgEnergy < 5) {
    patterns.push("low_energy");
    insights.push("Consistently low energy levels");
  }

  return {
    patterns,
    insights,
    averages: { sleep: avgSleep, stress: avgStress, energy: avgEnergy },
  };
}

function calculateSupplementCompliance(supplements) {
  if (supplements.length === 0) {
    return { complianceRate: 0, totalDays: 0, missedDays: 0 };
  }

  // Group by supplement name
  const bySupplement = {};
  supplements.forEach((s) => {
    if (!bySupplement[s.name]) {
      bySupplement[s.name] = { taken: 0, missed: 0 };
    }
    if (s.taken) {
      bySupplement[s.name].taken++;
    } else {
      bySupplement[s.name].missed++;
    }
  });

  // Calculate overall compliance
  let totalTaken = 0;
  let totalMissed = 0;

  Object.values(bySupplement).forEach((stats) => {
    totalTaken += stats.taken;
    totalMissed += stats.missed;
  });

  const total = totalTaken + totalMissed;
  const complianceRate =
    total > 0 ? ((totalTaken / total) * 100).toFixed(1) : 0;

  return {
    complianceRate: parseFloat(complianceRate),
    totalDays: total,
    missedDays: totalMissed,
    bySupplement,
  };
}

function calculateInjuryStatistics(injuries) {
  if (injuries.length === 0) {
    return {
      total: 0,
      active: 0,
      recovered: 0,
      byType: {},
      avgRecoveryTime: null,
    };
  }

  const stats = {
    total: injuries.length,
    active: injuries.filter((i) => i.status === "active").length,
    recovered: injuries.filter((i) => i.status === "recovered").length,
    byType: {},
    avgRecoveryTime: null,
  };

  // Group by injury type
  injuries.forEach((injury) => {
    const type = injury.type || "unknown";
    if (!stats.byType[type]) {
      stats.byType[type] = 0;
    }
    stats.byType[type]++;
  });

  // Calculate average recovery time for recovered injuries
  const recoveredInjuries = injuries.filter(
    (i) => i.status === "recovered" && i.reportedAt && i.recoveredAt,
  );

  if (recoveredInjuries.length > 0) {
    const recoveryTimes = recoveredInjuries.map((i) => {
      const reported = new Date(i.reportedAt);
      const recovered = new Date(i.recoveredAt);
      return (recovered - reported) / (1000 * 60 * 60 * 24); // days
    });

    const avgDays =
      recoveryTimes.reduce((sum, days) => sum + days, 0) / recoveryTimes.length;
    stats.avgRecoveryTime = Math.round(avgDays);
  }

  return stats;
}

function calculateBodyCompositionTrends(measurements) {
  if (measurements.length < 2) {
    return { trend: "insufficient_data", changes: null };
  }

  const sorted = measurements.sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
  );

  const latest = sorted[sorted.length - 1];
  const previous = sorted[sorted.length - 2];

  const changes = {
    weight:
      latest.weight && previous.weight
        ? (((latest.weight - previous.weight) / previous.weight) * 100).toFixed(
            1,
          )
        : null,
    bodyFat:
      latest.bodyFat && previous.bodyFat
        ? (
            ((latest.bodyFat - previous.bodyFat) / previous.bodyFat) *
            100
          ).toFixed(1)
        : null,
    muscleMass:
      latest.muscleMass && previous.muscleMass
        ? (
            ((latest.muscleMass - previous.muscleMass) / previous.muscleMass) *
            100
          ).toFixed(1)
        : null,
  };

  return {
    trend: "improving", // Simplified - could be more sophisticated
    changes,
    latest,
    previous,
  };
}

function calculateWellnessTrends(wellness) {
  if (wellness.length < 2) {
    return { trend: "insufficient_data", averages: null };
  }

  const sorted = wellness.sort(
    (a, b) => new Date(a.date || a.timestamp) - new Date(b.date || b.timestamp),
  );

  // Calculate averages for recent period (last 30% of data)
  const recentStart = Math.floor(sorted.length * 0.7);
  const recent = sorted.slice(recentStart);
  const earlier = sorted.slice(0, recentStart);

  const calculateAvg = (data, metric) => {
    const values = data.map((w) => w[metric]).filter((v) => v != null);
    return values.length > 0
      ? values.reduce((sum, v) => sum + v, 0) / values.length
      : null;
  };

  const metrics = ["sleep", "energy", "stress", "soreness", "motivation"];
  const trends = {};

  metrics.forEach((metric) => {
    const recentAvg = calculateAvg(recent, metric);
    const earlierAvg = calculateAvg(earlier, metric);

    if (recentAvg !== null && earlierAvg !== null) {
      trends[metric] = {
        change: (((recentAvg - earlierAvg) / earlierAvg) * 100).toFixed(1),
        recent: recentAvg.toFixed(1),
        earlier: earlierAvg.toFixed(1),
      };
    }
  });

  return {
    trend: "stable", // Simplified
    trends,
    recentAverage: {
      sleep: calculateAvg(recent, "sleep"),
      energy: calculateAvg(recent, "energy"),
      stress: calculateAvg(recent, "stress"),
    },
  };
}
