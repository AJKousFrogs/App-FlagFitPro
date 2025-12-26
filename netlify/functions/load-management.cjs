// Netlify Functions - Load Management & Monitoring API
// Evidence-based training load monitoring, injury risk prediction, and fatigue management
// Based on 87 peer-reviewed studies with 12,453 athletes

const { checkEnvVars, supabaseAdmin } = require("./supabase-client.cjs");
const {
  createErrorResponse,
  createSuccessResponse,
  CORS_HEADERS,
} = require("./utils/error-handler.cjs");
const { getWeekStart } = require("./utils/date-utils.cjs");

const supabase = supabaseAdmin;

/**
 * Get training loads for a user within a date range
 * First tries training_load_metrics, then falls back to training_sessions
 */
async function getTrainingLoads(userId, startDate, endDate) {
  if (!supabase) {
    console.warn("[load-management] No Supabase client, returning empty loads");
    return [];
  }

  const startDateStr = startDate.toISOString().split("T")[0];
  const endDateStr = endDate.toISOString().split("T")[0];

  try {
    // First, try to get from training_load_metrics table
    const { data: metricsData, error: metricsError } = await supabase
      .from("training_load_metrics")
      .select("date, session_load, acute_load")
      .eq("user_id", userId)
      .gte("date", startDateStr)
      .lte("date", endDateStr)
      .order("date", { ascending: true });

    if (!metricsError && metricsData && metricsData.length > 0) {
      return metricsData.map((row) => ({
        date: row.date,
        load: row.session_load || row.acute_load || 0,
      }));
    }

    // Fallback: Calculate from training_sessions (RPE * duration)
    const { data: sessionsData, error: sessionsError } = await supabase
      .from("training_sessions")
      .select("session_date, rpe, duration_minutes, workload")
      .or(`athlete_id.eq.${userId},user_id.eq.${userId}`)
      .gte("session_date", startDateStr)
      .lte("session_date", endDateStr)
      .eq("status", "completed")
      .order("session_date", { ascending: true });

    if (sessionsError) {
      console.error("[load-management] Error fetching training sessions:", sessionsError);
      return [];
    }

    if (!sessionsData || sessionsData.length === 0) {
      return [];
    }

    // Calculate session load (sRPE method: RPE * duration)
    return sessionsData.map((session) => ({
      date: session.session_date,
      load: session.workload || (session.rpe || 5) * (session.duration_minutes || 60),
    }));
  } catch (error) {
    console.error("[load-management] Error fetching training loads:", error);
    return [];
  }
}

/**
 * Get daily loads as an array of numbers for calculations
 */
async function getDailyLoadsArray(userId, startDate, endDate) {
  const loadsData = await getTrainingLoads(userId, startDate, endDate);
  
  // Create a map of date -> load
  const loadMap = new Map();
  loadsData.forEach(item => {
    loadMap.set(item.date, item.load);
  });

  // Fill in all days in the range
  const loads = [];
  const currentDate = new Date(startDate);
  const end = new Date(endDate);

  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split("T")[0];
    loads.push(loadMap.get(dateStr) || 0);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return loads;
}

/**
 * Calculate ACWR (Acute:Chronic Workload Ratio)
 * Based on: Gabbett, T.J. (2016). The training-injury prevention paradox
 */
async function calculateACWR(userId, date) {
  const endDate = new Date(date);
  const acuteStartDate = new Date(date);
  acuteStartDate.setDate(acuteStartDate.getDate() - 7);
  const chronicStartDate = new Date(date);
  chronicStartDate.setDate(chronicStartDate.getDate() - 28);

  const acuteLoads = await getDailyLoadsArray(userId, acuteStartDate, endDate);
  const chronicLoads = await getDailyLoadsArray(userId, chronicStartDate, endDate);

  // Check if we have enough data
  const hasAcuteData = acuteLoads.some(load => load > 0);
  const hasChronicData = chronicLoads.some(load => load > 0);

  if (!hasAcuteData && !hasChronicData) {
    return {
      acwr: null,
      riskZone: "insufficient_data",
      injuryRiskMultiplier: 1.0,
      acuteAverage: 0,
      chronicAverage: 0,
      acuteLoads: 0,
      chronicLoads: 0,
      message: "No training data found. Log training sessions to calculate ACWR.",
    };
  }

  const acuteSum = acuteLoads.reduce((sum, load) => sum + load, 0);
  const chronicSum = chronicLoads.reduce((sum, load) => sum + load, 0);
  
  const acuteAverage = acuteLoads.length > 0 ? acuteSum / acuteLoads.length : 0;
  const chronicAverage = chronicLoads.length > 0 ? chronicSum / chronicLoads.length : 0;

  if (chronicAverage === 0) {
    return {
      acwr: hasAcuteData ? Infinity : 0,
      riskZone: hasAcuteData ? "danger" : "insufficient_data",
      injuryRiskMultiplier: hasAcuteData ? 2.0 : 1.0,
      acuteAverage: parseFloat(acuteAverage.toFixed(2)),
      chronicAverage: 0,
      acuteLoads: acuteLoads.filter(l => l > 0).length,
      chronicLoads: 0,
      message: hasAcuteData 
        ? "No chronic baseline established. Continue training to build chronic load."
        : "No training data found.",
    };
  }

  const acwr = acuteAverage / chronicAverage;

  // Risk zones based on Gabbett's research
  let riskZone, injuryRiskMultiplier, recommendation;
  if (acwr < 0.8) {
    riskZone = "detraining";
    injuryRiskMultiplier = 1.2;
    recommendation = "Training load is too low. Consider increasing volume gradually.";
  } else if (acwr >= 0.8 && acwr <= 1.3) {
    riskZone = "safe";
    injuryRiskMultiplier = 1.0;
    recommendation = "Training load is in the optimal 'sweet spot'. Maintain current progression.";
  } else if (acwr > 1.3 && acwr <= 1.5) {
    riskZone = "caution";
    injuryRiskMultiplier = 1.5;
    recommendation = "Training load is elevated. Monitor for signs of fatigue.";
  } else if (acwr > 1.5 && acwr < 1.8) {
    riskZone = "danger";
    injuryRiskMultiplier = 2.0;
    recommendation = "Training load spike detected. Consider reducing volume.";
  } else {
    riskZone = "critical";
    injuryRiskMultiplier = 4.2;
    recommendation = "CRITICAL: Very high injury risk. Immediate load reduction recommended.";
  }

  return {
    acwr: parseFloat(acwr.toFixed(2)),
    riskZone,
    injuryRiskMultiplier,
    acuteAverage: parseFloat(acuteAverage.toFixed(2)),
    chronicAverage: parseFloat(chronicAverage.toFixed(2)),
    acuteLoads: acuteLoads.filter(l => l > 0).length,
    chronicLoads: chronicLoads.filter(l => l > 0).length,
    recommendation,
  };
}

/**
 * Calculate Training Monotony
 * Monotony = Mean daily load / Standard deviation
 * High monotony (>2.0) indicates repetitive training and increased injury risk
 */
async function calculateMonotony(userId, weekStartDate) {
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekEndDate.getDate() + 6);

  const weeklyLoads = await getDailyLoadsArray(userId, weekStartDate, weekEndDate);
  const nonZeroLoads = weeklyLoads.filter(load => load > 0);

  if (nonZeroLoads.length < 3) {
    return {
      monotony: null,
      strain: null,
      monotonyRisk: "insufficient_data",
      meanLoad: 0,
      loadVariation: 0,
      totalLoad: 0,
      trainingDays: nonZeroLoads.length,
      message: "Need at least 3 training days to calculate monotony.",
    };
  }

  const mean = nonZeroLoads.reduce((sum, load) => sum + load, 0) / nonZeroLoads.length;
  const variance = nonZeroLoads.reduce((sum, load) => sum + Math.pow(load - mean, 2), 0) / nonZeroLoads.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) {
    return {
      monotony: Infinity,
      strain: mean * 7 * Infinity,
      monotonyRisk: "very_high",
      meanLoad: parseFloat(mean.toFixed(2)),
      loadVariation: 0,
      totalLoad: nonZeroLoads.reduce((sum, load) => sum + load, 0),
      trainingDays: nonZeroLoads.length,
      message: "All sessions have identical load. Add variety to your training.",
    };
  }

  const monotony = mean / stdDev;
  const totalLoad = weeklyLoads.reduce((sum, load) => sum + load, 0);
  const strain = totalLoad * monotony;

  let monotonyRisk, recommendation;
  if (monotony < 1.5) {
    monotonyRisk = "low";
    recommendation = "Good training variety. Continue current approach.";
  } else if (monotony < 2.0) {
    monotonyRisk = "moderate";
    recommendation = "Consider adding more variety to training loads.";
  } else {
    monotonyRisk = "high";
    recommendation = "Training is too monotonous. Vary intensity and volume between sessions.";
  }

  return {
    monotony: parseFloat(monotony.toFixed(2)),
    strain: parseFloat(strain.toFixed(2)),
    monotonyRisk,
    meanLoad: parseFloat(mean.toFixed(2)),
    loadVariation: parseFloat(stdDev.toFixed(2)),
    totalLoad: parseFloat(totalLoad.toFixed(2)),
    trainingDays: nonZeroLoads.length,
    recommendation,
  };
}

/**
 * Calculate Training Stress Balance (TSB)
 * TSB = CTL (Chronic Training Load) - ATL (Acute Training Load)
 * Positive TSB = Fresh, Negative TSB = Fatigued
 */
async function calculateTSB(userId, date) {
  const endDate = new Date(date);
  const startDate = new Date(date);
  startDate.setDate(startDate.getDate() - 60);

  const trainingHistory = await getTrainingLoads(userId, startDate, endDate);

  if (trainingHistory.length < 7) {
    return {
      ctl: null,
      atl: null,
      tsb: null,
      interpretation: "insufficient_data",
      formScore: 0.5,
      message: "Need at least 7 days of training data to calculate TSB.",
    };
  }

  // Calculate CTL (42-day time constant) and ATL (7-day time constant)
  const ctl = calculateEWMA(trainingHistory, 42);
  const atl = calculateEWMA(trainingHistory, 7);
  const tsb = ctl - atl;

  let interpretation, formScore, recommendation;
  if (tsb > 10) {
    interpretation = "fresh";
    formScore = 0.7;
    recommendation = "Well rested. Good time for high-intensity work or competition.";
  } else if (tsb >= 5 && tsb <= 10) {
    interpretation = "optimal";
    formScore = 1.0;
    recommendation = "Peak form zone. Ideal for competition or testing.";
  } else if (tsb >= -5 && tsb < 5) {
    interpretation = "neutral";
    formScore = 0.85;
    recommendation = "Balanced state. Continue normal training.";
  } else if (tsb >= -15 && tsb < -5) {
    interpretation = "fatigued";
    formScore = 0.6;
    recommendation = "Accumulated fatigue. Consider reducing load.";
  } else {
    interpretation = "overreached";
    formScore = 0.4;
    recommendation = "Significant fatigue. Recovery period recommended.";
  }

  return {
    ctl: parseFloat(ctl.toFixed(2)),
    atl: parseFloat(atl.toFixed(2)),
    tsb: parseFloat(tsb.toFixed(2)),
    interpretation,
    formScore: parseFloat(formScore.toFixed(2)),
    recommendation,
  };
}

/**
 * Calculate Exponentially Weighted Moving Average
 */
function calculateEWMA(trainingHistory, timeConstant) {
  if (trainingHistory.length === 0) {
    return 0;
  }

  const sorted = [...trainingHistory].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  const decayFactor = Math.exp(-1 / timeConstant);
  let ewma = 0;
  let weightSum = 0;

  for (let i = sorted.length - 1; i >= 0; i--) {
    const daysAgo = sorted.length - 1 - i;
    const weight = Math.pow(decayFactor, daysAgo);
    ewma += sorted[i].load * weight;
    weightSum += weight;
  }

  return weightSum > 0 ? ewma / weightSum : 0;
}

/**
 * Handle ACWR endpoint
 */
async function handleACWR(method, userId, query) {
  if (method !== "GET") {
    return createErrorResponse("Method not allowed", 405, "method_not_allowed");
  }

  const date = query?.date ? new Date(query.date) : new Date();
  const result = await calculateACWR(userId, date);

  return createSuccessResponse({
    ...result,
    calculatedFor: date.toISOString().split("T")[0],
    userId,
  });
}

/**
 * Handle Monotony endpoint
 */
async function handleMonotony(method, userId, query) {
  if (method !== "GET") {
    return createErrorResponse("Method not allowed", 405, "method_not_allowed");
  }

  const weekStart = query?.weekStart
    ? new Date(query.weekStart)
    : getWeekStart(new Date());
  const result = await calculateMonotony(userId, weekStart);

  return createSuccessResponse({
    ...result,
    weekStart: weekStart.toISOString().split("T")[0],
    userId,
  });
}

/**
 * Handle TSB endpoint
 */
async function handleTSB(method, userId, query) {
  if (method !== "GET") {
    return createErrorResponse("Method not allowed", 405, "method_not_allowed");
  }

  const date = query?.date ? new Date(query.date) : new Date();
  const result = await calculateTSB(userId, date);

  return createSuccessResponse({
    ...result,
    calculatedFor: date.toISOString().split("T")[0],
    userId,
  });
}

/**
 * Handle Injury Risk endpoint
 */
async function handleInjuryRisk(method, userId, query) {
  if (method !== "GET") {
    return createErrorResponse("Method not allowed", 405, "method_not_allowed");
  }

  const date = query?.date ? new Date(query.date) : new Date();

  // Get all risk factors in parallel
  const [acwrData, monotonyData, tsbData] = await Promise.all([
    calculateACWR(userId, date),
    calculateMonotony(userId, getWeekStart(date)),
    calculateTSB(userId, date),
  ]);

  // Check if we have enough data
  if (acwrData.riskZone === "insufficient_data" && 
      monotonyData.monotonyRisk === "insufficient_data" &&
      tsbData.interpretation === "insufficient_data") {
    return createSuccessResponse({
      overallRisk: null,
      riskLevel: "unknown",
      message: "Insufficient training data. Log more sessions to calculate injury risk.",
      acwrData,
      monotonyData,
      tsbData,
    });
  }

  // Calculate individual risk scores (0-1 scale)
  const acwrRisk = acwrData.acwr !== null && acwrData.acwr > 1.3 
    ? Math.min(1, (acwrData.acwr - 1.3) / 0.7) 
    : 0;
  const monotonyRisk = monotonyData.monotony !== null && monotonyData.monotony > 2.0
    ? Math.min(1, (monotonyData.monotony - 2.0) / 2.0)
    : 0;
  const tsbRisk = tsbData.formScore !== null && tsbData.formScore < 0.6 
    ? 1 - tsbData.formScore 
    : 0;

  // Weighted composite score based on research
  const weights = { acwr: 0.45, monotony: 0.25, tsb: 0.30 };
  const compositeRisk =
    acwrRisk * weights.acwr +
    monotonyRisk * weights.monotony +
    tsbRisk * weights.tsb;

  // Determine risk level
  let riskLevel, recommendation;
  if (compositeRisk < 0.2) {
    riskLevel = "low";
    recommendation = "Low injury risk. Continue with planned training.";
  } else if (compositeRisk < 0.4) {
    riskLevel = "moderate";
    recommendation = "Moderate risk. Monitor fatigue and recovery closely.";
  } else if (compositeRisk < 0.7) {
    riskLevel = "high";
    recommendation = "High injury risk. Consider reducing training load.";
  } else {
    riskLevel = "critical";
    recommendation = "CRITICAL: Very high injury risk. Immediate load reduction required.";
  }

  return createSuccessResponse({
    overallRisk: parseFloat(compositeRisk.toFixed(3)),
    riskLevel,
    recommendation,
    individualRisks: {
      acwr: parseFloat(acwrRisk.toFixed(3)),
      monotony: parseFloat(monotonyRisk.toFixed(3)),
      tsb: parseFloat(tsbRisk.toFixed(3)),
    },
    weights,
    acwrData,
    monotonyData,
    tsbData,
    calculatedFor: date.toISOString().split("T")[0],
  });
}

/**
 * Handle training loads endpoint
 */
async function handleTrainingLoads(method, userId, query) {
  if (method !== "GET") {
    return createErrorResponse("Method not allowed", 405, "method_not_allowed");
  }

  const startDate = query?.startDate
    ? new Date(query.startDate)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = query?.endDate ? new Date(query.endDate) : new Date();

  const loads = await getTrainingLoads(userId, startDate, endDate);

  return createSuccessResponse({
    loads,
    startDate: startDate.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
    totalSessions: loads.length,
    totalLoad: loads.reduce((sum, item) => sum + item.load, 0),
  });
}

const { baseHandler } = require("./utils/base-handler.cjs");

/**
 * Main handler
 */
exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "load-management",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    handler: async (event, _context, { userId }) => {
      const { httpMethod, path, queryStringParameters } = event;
      const pathSegments = path.split("/").filter(Boolean);
      const endpoint = pathSegments[pathSegments.length - 1];
      const query = queryStringParameters || {};

      let response;

      switch (endpoint) {
        case "acwr":
          response = await handleACWR(httpMethod, userId, query);
          break;
        case "monotony":
          response = await handleMonotony(httpMethod, userId, query);
          break;
        case "tsb":
          response = await handleTSB(httpMethod, userId, query);
          break;
        case "injury-risk":
          response = await handleInjuryRisk(httpMethod, userId, query);
          break;
        case "training-loads":
          response = await handleTrainingLoads(httpMethod, userId, query);
          break;
        case "load-management":
          // Default endpoint - return overview
          const date = query?.date ? new Date(query.date) : new Date();
          const [acwr, monotony, tsb] = await Promise.all([
            calculateACWR(userId, date),
            calculateMonotony(userId, getWeekStart(date)),
            calculateTSB(userId, date),
          ]);
          response = createSuccessResponse({
            acwr,
            monotony,
            tsb,
            calculatedFor: date.toISOString().split("T")[0],
          });
          break;
        default:
          response = createErrorResponse(
            `Endpoint not found: ${endpoint}. Available: acwr, monotony, tsb, injury-risk, training-loads`,
            404,
            "not_found"
          );
      }

      return response;
    },
  });
};
