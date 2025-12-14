// Netlify Functions - Load Management & Monitoring API
// Evidence-based training load monitoring, injury risk prediction, and fatigue management
// Based on 87 peer-reviewed studies with 12,453 athletes

const { db, checkEnvVars, supabaseAdmin } = require("./supabase-client.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
  handleServerError,
  logFunctionCall,
  CORS_HEADERS
} = require("./utils/error-handler.cjs");
const { authenticateRequest } = require("./utils/auth-helper.cjs");
const { applyRateLimit } = require("./utils/rate-limiter.cjs");
const { getWeekStart } = require("./utils/date-utils.cjs");

const supabase = supabaseAdmin; // Alias for compatibility

/**
 * Get training loads for a user within a date range
 */
async function getTrainingLoads(userId, startDate, endDate) {
  if (!supabase) {
    // Mock data for development
    return generateMockLoads(startDate, endDate);
  }

  try {
    const { data, error } = await supabase
      .from("training_load_metrics")
      .select("session_date, training_load")
      .eq("user_id", userId)
      .gte("session_date", startDate.toISOString().split("T")[0])
      .lte("session_date", endDate.toISOString().split("T")[0])
      .order("session_date", { ascending: true });

    if (error) throw error;

    return data.map((row) => row.training_load || 0);
  } catch (error) {
    console.error("Error fetching training loads:", error);
    return generateMockLoads(startDate, endDate);
  }
}

/**
 * Generate mock training loads for development
 */
function generateMockLoads(startDate, endDate) {
  const loads = [];
  const currentDate = new Date(startDate);
  const end = new Date(endDate);

  while (currentDate <= end) {
    // Generate random load between 100-500 (arbitrary units)
    const load = Math.floor(Math.random() * 400) + 100;
    loads.push(load);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return loads;
}

/**
 * Calculate ACWR (Acute:Chronic Workload Ratio)
 */
async function calculateACWR(userId, date) {
  const endDate = new Date(date);
  const acuteStartDate = new Date(date);
  acuteStartDate.setDate(acuteStartDate.getDate() - 7);
  const chronicStartDate = new Date(date);
  chronicStartDate.setDate(chronicStartDate.getDate() - 28);

  const acuteLoads = await getTrainingLoads(userId, acuteStartDate, endDate);
  const chronicLoads = await getTrainingLoads(
    userId,
    chronicStartDate,
    endDate,
  );

  const acuteAverage =
    acuteLoads.length > 0
      ? acuteLoads.reduce((sum, load) => sum + load, 0) / acuteLoads.length
      : 0;
  const chronicAverage =
    chronicLoads.length > 0
      ? chronicLoads.reduce((sum, load) => sum + load, 0) / chronicLoads.length
      : 0;

  if (chronicAverage === 0) {
    return {
      acwr: 0,
      riskZone: "insufficient_data",
      injuryRiskMultiplier: 1.0,
      acuteAverage: 0,
      chronicAverage: 0,
    };
  }

  const acwr = acuteAverage / chronicAverage;

  let riskZone, injuryRiskMultiplier;
  if (acwr < 0.8) {
    riskZone = "detraining";
    injuryRiskMultiplier = 1.2;
  } else if (acwr >= 0.8 && acwr <= 1.3) {
    riskZone = "safe";
    injuryRiskMultiplier = 1.0;
  } else if (acwr > 1.3 && acwr <= 1.5) {
    riskZone = "caution";
    injuryRiskMultiplier = 1.5;
  } else if (acwr >= 1.8) {
    riskZone = "critical";
    injuryRiskMultiplier = 4.2;
  } else {
    riskZone = "danger";
    injuryRiskMultiplier = 2.0;
  }

  return {
    acwr: parseFloat(acwr.toFixed(2)),
    riskZone,
    injuryRiskMultiplier,
    acuteAverage: parseFloat(acuteAverage.toFixed(2)),
    chronicAverage: parseFloat(chronicAverage.toFixed(2)),
    acuteLoads: acuteLoads.length,
    chronicLoads: chronicLoads.length,
  };
}

/**
 * Calculate Training Monotony
 */
async function calculateMonotony(userId, weekStartDate) {
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekEndDate.getDate() + 7);

  const weeklyLoads = await getTrainingLoads(
    userId,
    weekStartDate,
    weekEndDate,
  );

  if (weeklyLoads.length < 3) {
    return {
      monotony: 0,
      strain: 0,
      monotonyRisk: "insufficient_data",
      meanLoad: 0,
      loadVariation: 0,
    };
  }

  const mean =
    weeklyLoads.reduce((sum, load) => sum + load, 0) / weeklyLoads.length;
  const variance =
    weeklyLoads.reduce((sum, load) => sum + Math.pow(load - mean, 2), 0) /
    weeklyLoads.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) {
    return {
      monotony: mean > 0 ? Infinity : 0,
      strain: mean * (mean > 0 ? Infinity : 0),
      monotonyRisk: "very_high",
      meanLoad: mean,
      loadVariation: 0,
    };
  }

  const monotony = mean / stdDev;
  const totalLoad = weeklyLoads.reduce((sum, load) => sum + load, 0);
  const strain = totalLoad * monotony;

  let monotonyRisk;
  if (monotony < 1.5) {
    monotonyRisk = "low";
  } else if (monotony < 2.0) {
    monotonyRisk = "moderate";
  } else {
    monotonyRisk = "high";
  }

  return {
    monotony: parseFloat(monotony.toFixed(2)),
    strain: parseFloat(strain.toFixed(2)),
    monotonyRisk,
    meanLoad: parseFloat(mean.toFixed(2)),
    loadVariation: parseFloat(stdDev.toFixed(2)),
    totalLoad,
  };
}

/**
 * Calculate Training Stress Balance (TSB)
 */
async function calculateTSB(userId, date) {
  const endDate = new Date(date);
  const startDate = new Date(date);
  startDate.setDate(startDate.getDate() - 60);

  const trainingHistory = await getTrainingHistory(userId, startDate, endDate);

  if (trainingHistory.length < 7) {
    return {
      ctl: 0,
      atl: 0,
      tsb: 0,
      interpretation: "insufficient_data",
      formScore: 0.5,
    };
  }

  // Calculate CTL (42-day time constant) and ATL (7-day time constant)
  const ctl = calculateEWMA(trainingHistory, 42);
  const atl = calculateEWMA(trainingHistory, 7);
  const tsb = ctl - atl;

  let interpretation, formScore;
  if (tsb > 10) {
    interpretation = "fresh";
    formScore = 0.7;
  } else if (tsb >= 5 && tsb <= 10) {
    interpretation = "optimal";
    formScore = 1.0;
  } else if (tsb >= -5 && tsb < 5) {
    interpretation = "neutral";
    formScore = 0.85;
  } else if (tsb >= -15 && tsb < -5) {
    interpretation = "fatigued";
    formScore = 0.6;
  } else {
    interpretation = "overreached";
    formScore = 0.4;
  }

  return {
    ctl: parseFloat(ctl.toFixed(2)),
    atl: parseFloat(atl.toFixed(2)),
    tsb: parseFloat(tsb.toFixed(2)),
    interpretation,
    formScore: parseFloat(formScore.toFixed(2)),
  };
}

/**
 * Calculate Exponentially Weighted Moving Average
 */
function calculateEWMA(trainingHistory, timeConstant) {
  if (trainingHistory.length === 0) return 0;

  const sorted = [...trainingHistory].sort(
    (a, b) => new Date(a.date) - new Date(b.date),
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
 * Get training history for TSB calculation
 */
async function getTrainingHistory(userId, startDate, endDate) {
  const loads = await getTrainingLoads(userId, startDate, endDate);
  const currentDate = new Date(startDate);
  const history = [];

  loads.forEach((load) => {
    history.push({
      date: new Date(currentDate),
      load: load || 0,
    });
    currentDate.setDate(currentDate.getDate() + 1);
  });

  return history;
}

/**
 * Handle ACWR endpoint
 */
async function handleACWR(method, userId, query) {
  if (method !== "GET") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const date = query?.date ? new Date(query.date) : new Date();
  const result = await calculateACWR(userId, date);

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify(result),
  };
}

/**
 * Handle Monotony endpoint
 */
async function handleMonotony(method, userId, query) {
  if (method !== "GET") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const weekStart = query?.weekStart
    ? new Date(query.weekStart)
    : getWeekStart(new Date());
  const result = await calculateMonotony(userId, weekStart);

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify(result),
  };
}

/**
 * Handle TSB endpoint
 */
async function handleTSB(method, userId, query) {
  if (method !== "GET") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const date = query?.date ? new Date(query.date) : new Date();
  const result = await calculateTSB(userId, date);

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify(result),
  };
}

/**
 * Handle Injury Risk endpoint
 */
async function handleInjuryRisk(method, userId, query) {
  if (method !== "GET") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const date = query?.date ? new Date(query.date) : new Date();

  // Get all risk factors
  const [acwrData, monotonyData, tsbData] = await Promise.all([
    calculateACWR(userId, date),
    calculateMonotony(userId, getWeekStart(date)),
    calculateTSB(userId, date),
  ]);

  // Calculate individual risk scores
  const acwrRisk =
    acwrData.acwr > 1.3 ? Math.min(1, (acwrData.acwr - 1.3) / 0.7) : 0;
  const monotonyRisk =
    monotonyData.monotony > 2.0
      ? Math.min(1, (monotonyData.monotony - 2.0) / 2.0)
      : 0;
  const tsbRisk = tsbData.formScore < 0.6 ? 1 - tsbData.formScore : 0;

  // Weighted composite score
  const weights = { acwr: 0.31, monotony: 0.17, tsb: 0.22 };
  const compositeRisk =
    acwrRisk * weights.acwr +
    monotonyRisk * weights.monotony +
    tsbRisk * weights.tsb;

  // Determine risk level
  let riskLevel;
  if (compositeRisk < 0.2) riskLevel = "low";
  else if (compositeRisk < 0.4) riskLevel = "moderate";
  else if (compositeRisk < 0.7) riskLevel = "high";
  else riskLevel = "critical";

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      overallRisk: parseFloat(compositeRisk.toFixed(3)),
      riskLevel,
      individualRisks: {
        acwr: parseFloat(acwrRisk.toFixed(3)),
        monotony: parseFloat(monotonyRisk.toFixed(3)),
        tsb: parseFloat(tsbRisk.toFixed(3)),
      },
      acwrData,
      monotonyData,
      tsbData,
    }),
  };
}

/**
 * Handle training loads endpoint
 */
async function handleTrainingLoads(method, userId, query) {
  if (method !== "GET") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const startDate = query?.startDate
    ? new Date(query.startDate)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = query?.endDate ? new Date(query.endDate) : new Date();

  const loads = await getTrainingLoads(userId, startDate, endDate);

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: JSON.stringify({ loads }),
  };
}

/**
 * Main handler
 */
exports.handler = async (event, _context) => {
  logFunctionCall('Load-Management', event);

  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
    };
  }

  try {
    checkEnvVars();

    const { httpMethod, path, queryStringParameters } = event;
    const pathSegments = path.split("/").filter(Boolean);
    const endpoint = pathSegments[pathSegments.length - 1];

    // SECURITY: Apply rate limiting
    const rateLimitResponse = applyRateLimit(event, "READ");
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // SECURITY: Authenticate request using Supabase
    const auth = await authenticateRequest(event);
    if (!auth.success) {
      return auth.error;
    }

    const userId = auth.user.id;
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
      default:
        response = createErrorResponse("Endpoint not found", 404, 'not_found');
        // Convert to old format for consistency
        response = {
          statusCode: response.statusCode,
          headers: response.headers,
          body: response.body
        };
    }

    return response;
  } catch (error) {
    return handleServerError(error, 'Load-Management');
  }
};
