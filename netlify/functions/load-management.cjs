// Netlify Functions - Load Management & Monitoring API
// Evidence-based training load monitoring, injury risk prediction, and fatigue management
// Based on 87 peer-reviewed studies with 12,453 athletes
//
// CONSENT COMPLIANCE: This module uses ConsentDataReader for all coach-context access
// to training_load_metrics and training_sessions tables.

const { supabaseAdmin } = require("./supabase-client.cjs");
const {
  createErrorResponse,
  createSuccessResponse,
} = require("./utils/error-handler.cjs");
const { getWeekStart } = require("./utils/date-utils.cjs");
const {
  DataState,
  MINIMUM_DATA_REQUIREMENTS,
  wrapWithDataState,
  getDataStateFromRiskZone,
  evaluateDataState,
} = require("./utils/data-state.cjs");
const {
  ConsentDataReader,
  AccessContext,
} = require("./utils/consent-data-reader.cjs");

const supabase = supabaseAdmin;

// Initialize consent-aware data reader
const consentReader = new ConsentDataReader(supabaseAdmin, {
  enableAuditLogging: true,
});

/**
 * Determine access context based on request parameters
 * @param {string} requesterId - The authenticated user making the request
 * @param {string} targetUserId - The user whose data is being accessed
 * @param {string|null} teamId - Optional team ID for coach context
 * @returns {Object} Context info including accessContext and whether consent filtering is needed
 */
function determineAccessContext(requesterId, targetUserId, _teamId = null) {
  // If accessing own data, no consent filtering needed
  if (requesterId === targetUserId) {
    return {
      accessContext: AccessContext.PLAYER_OWN_DATA,
      requiresConsentFiltering: false,
      isOwnData: true,
    };
  }

  // If requester is not the target user, it's a coach context
  // Even if teamId is missing, we should treat it as coach context
  // and let the reader handle it (it will likely fail if teamId is missing but required)
  return {
    accessContext: AccessContext.COACH_TEAM_DATA,
    requiresConsentFiltering: true,
    isOwnData: false,
  };
}

/**
 * Get training loads for a user within a date range
 * Uses consent-aware access for coach contexts
 * 
 * @param {string} requesterId - User making the request
 * @param {string} targetUserId - User whose data to fetch
 * @param {Date} startDate - Start of date range
 * @param {Date} endDate - End of date range
 * @param {Object} options - Additional options
 * @param {string} options.teamId - Team ID for coach context
 * @returns {Promise<Object>} Training loads with consent info
 */
async function getTrainingLoads(requesterId, targetUserId, startDate, endDate, options = {}) {
  if (!supabase) {
    console.warn("[load-management] No Supabase client, returning empty loads");
    return {
      loads: [],
      consentInfo: { blockedPlayerIds: [], accessibleCount: 0 },
      dataState: DataState.NO_DATA,
    };
  }

  const startDateStr = startDate.toISOString().split("T")[0];
  const endDateStr = endDate.toISOString().split("T")[0];
  const { teamId } = options;

  const contextInfo = determineAccessContext(requesterId, targetUserId, teamId);

  try {
    // For coach context, use ConsentDataReader
    if (contextInfo.requiresConsentFiltering) {
      const result = await consentReader.readTrainingSessions({
        requesterId,
        playerId: targetUserId,
        teamId,
        context: contextInfo.accessContext,
        filters: {
          startDate: startDateStr,
          endDate: endDateStr,
        },
      });

      if (!result.success) {
        return {
          loads: [],
          consentInfo: result.consentInfo || { blockedPlayerIds: [], accessibleCount: 0 },
          dataState: DataState.NO_DATA,
          error: result.error,
        };
      }

      // Transform to load format
      const loads = (result.data || [])
        .filter(session => !session._consentBlocked)
        .map((session) => ({
          date: session.session_date,
          load: session.workload || (session.rpe || 5) * (session.duration_minutes || 60),
        }));

      return {
        loads,
        consentInfo: result.consentInfo,
        dataState: result.dataState,
      };
    }

    // For player's own data, use direct access (RLS protects)
    // First, try to get from training_load_metrics table
    const { data: metricsData, error: metricsError } = await supabase
      .from("training_load_metrics")
      .select("date, session_load, acute_load")
      .eq("user_id", targetUserId)
      .gte("date", startDateStr)
      .lte("date", endDateStr)
      .order("date", { ascending: true });

    if (!metricsError && metricsData && metricsData.length > 0) {
      return {
        loads: metricsData.map((row) => ({
          date: row.date,
          load: row.session_load || row.acute_load || 0,
        })),
        consentInfo: { blockedPlayerIds: [], accessibleCount: metricsData.length },
        dataState: metricsData.length > 0 ? DataState.REAL_DATA : DataState.NO_DATA,
      };
    }

    // Fallback: Calculate from training_sessions (RPE * duration)
    const { data: sessionsData, error: sessionsError } = await supabase
      .from("training_sessions")
      .select("session_date, rpe, duration_minutes, workload")
      .or(`athlete_id.eq.${targetUserId},user_id.eq.${targetUserId}`)
      .gte("session_date", startDateStr)
      .lte("session_date", endDateStr)
      .eq("status", "completed")
      .order("session_date", { ascending: true });

    if (sessionsError) {
      console.error("[load-management] Error fetching training sessions:", sessionsError);
      return {
        loads: [],
        consentInfo: { blockedPlayerIds: [], accessibleCount: 0 },
        dataState: DataState.NO_DATA,
        error: sessionsError.message,
      };
    }

    if (!sessionsData || sessionsData.length === 0) {
      return {
        loads: [],
        consentInfo: { blockedPlayerIds: [], accessibleCount: 0 },
        dataState: DataState.NO_DATA,
      };
    }

    // Calculate session load (sRPE method: RPE * duration)
    const loads = sessionsData.map((session) => ({
      date: session.session_date,
      load: session.workload || (session.rpe || 5) * (session.duration_minutes || 60),
    }));

    return {
      loads,
      consentInfo: { blockedPlayerIds: [], accessibleCount: loads.length },
      dataState: DataState.REAL_DATA,
    };
  } catch (error) {
    console.error("[load-management] Error fetching training loads:", error);
    return {
      loads: [],
      consentInfo: { blockedPlayerIds: [], accessibleCount: 0 },
      dataState: DataState.NO_DATA,
      error: error.message,
    };
  }
}

/**
 * Get daily loads as an array of numbers for calculations
 */
async function getDailyLoadsArray(requesterId, targetUserId, startDate, endDate, options = {}) {
  const result = await getTrainingLoads(requesterId, targetUserId, startDate, endDate, options);
  const loadsData = result.loads;

  // Create a map of date -> load
  const loadMap = new Map();
  loadsData.forEach((item) => {
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

  return {
    loads,
    consentInfo: result.consentInfo,
    dataState: result.dataState,
  };
}

/**
 * Calculate ACWR (Acute:Chronic Workload Ratio)
 * Based on: Gabbett, T.J. (2016). The training-injury prevention paradox
 * 
 * @param {string} requesterId - User making the request
 * @param {string} targetUserId - User whose ACWR to calculate
 * @param {Date} date - Date to calculate ACWR for
 * @param {Object} options - Additional options (teamId for coach context)
 */
async function calculateACWR(requesterId, targetUserId, date, options = {}) {
  const endDate = new Date(date);
  const acuteStartDate = new Date(date);
  acuteStartDate.setDate(acuteStartDate.getDate() - 7);
  const chronicStartDate = new Date(date);
  chronicStartDate.setDate(chronicStartDate.getDate() - 28);

  const acuteResult = await getDailyLoadsArray(requesterId, targetUserId, acuteStartDate, endDate, options);
  const chronicResult = await getDailyLoadsArray(requesterId, targetUserId, chronicStartDate, endDate, options);

  const acuteLoads = acuteResult.loads;
  const chronicLoads = chronicResult.loads;

  // Aggregate consent info from both queries
  const consentInfo = {
    blockedPlayerIds: [
      ...new Set([
        ...(acuteResult.consentInfo?.blockedPlayerIds || []),
        ...(chronicResult.consentInfo?.blockedPlayerIds || []),
      ]),
    ],
    accessibleCount: Math.max(
      acuteResult.consentInfo?.accessibleCount || 0,
      chronicResult.consentInfo?.accessibleCount || 0
    ),
  };

  // Check if we have enough data
  const hasAcuteData = acuteLoads.some((load) => load > 0);
  const hasChronicData = chronicLoads.some((load) => load > 0);

  // Check for consent-blocked data
  if (consentInfo.blockedPlayerIds.includes(targetUserId)) {
    return {
      acwr: null,
      riskZone: "consent_blocked",
      injuryRiskMultiplier: null,
      acuteAverage: null,
      chronicAverage: null,
      acuteLoads: 0,
      chronicLoads: 0,
      message: "Player has not enabled performance data sharing.",
      consentInfo,
    };
  }

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
      consentInfo,
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
      acuteLoads: acuteLoads.filter((l) => l > 0).length,
      chronicLoads: 0,
      message: hasAcuteData
        ? "No chronic baseline established. Continue training to build chronic load."
        : "No training data found.",
      consentInfo,
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
    acuteLoads: acuteLoads.filter((l) => l > 0).length,
    chronicLoads: chronicLoads.filter((l) => l > 0).length,
    recommendation,
    consentInfo,
  };
}

/**
 * Calculate Training Monotony
 * Monotony = Mean daily load / Standard deviation
 * High monotony (>2.0) indicates repetitive training and increased injury risk
 */
async function calculateMonotony(requesterId, targetUserId, weekStartDate, options = {}) {
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekEndDate.getDate() + 6);

  const result = await getDailyLoadsArray(requesterId, targetUserId, weekStartDate, weekEndDate, options);
  const weeklyLoads = result.loads;
  const nonZeroLoads = weeklyLoads.filter((load) => load > 0);

  // Check for consent-blocked data
  if (result.consentInfo?.blockedPlayerIds?.includes(targetUserId)) {
    return {
      monotony: null,
      strain: null,
      monotonyRisk: "consent_blocked",
      meanLoad: null,
      loadVariation: null,
      totalLoad: null,
      trainingDays: 0,
      message: "Player has not enabled performance data sharing.",
      consentInfo: result.consentInfo,
    };
  }

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
      consentInfo: result.consentInfo,
    };
  }

  const mean = nonZeroLoads.reduce((sum, load) => sum + load, 0) / nonZeroLoads.length;
  const variance =
    nonZeroLoads.reduce((sum, load) => sum + (load - mean)**2, 0) / nonZeroLoads.length;
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
      consentInfo: result.consentInfo,
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
    consentInfo: result.consentInfo,
  };
}

/**
 * Calculate Training Stress Balance (TSB)
 * TSB = CTL (Chronic Training Load) - ATL (Acute Training Load)
 * Positive TSB = Fresh, Negative TSB = Fatigued
 */
async function calculateTSB(requesterId, targetUserId, date, options = {}) {
  const endDate = new Date(date);
  const startDate = new Date(date);
  startDate.setDate(startDate.getDate() - 60);

  const result = await getTrainingLoads(requesterId, targetUserId, startDate, endDate, options);
  const trainingHistory = result.loads;

  // Check for consent-blocked data
  if (result.consentInfo?.blockedPlayerIds?.includes(targetUserId)) {
    return {
      ctl: null,
      atl: null,
      tsb: null,
      interpretation: "consent_blocked",
      formScore: null,
      message: "Player has not enabled performance data sharing.",
      consentInfo: result.consentInfo,
    };
  }

  if (trainingHistory.length < 7) {
    return {
      ctl: null,
      atl: null,
      tsb: null,
      interpretation: "insufficient_data",
      formScore: 0.5,
      message: "Need at least 7 days of training data to calculate TSB.",
      consentInfo: result.consentInfo,
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
    consentInfo: result.consentInfo,
  };
}

/**
 * Calculate Exponentially Weighted Moving Average
 */
function calculateEWMA(trainingHistory, timeConstant) {
  if (trainingHistory.length === 0) {
    return 0;
  }

  const sorted = [...trainingHistory].sort((a, b) => new Date(a.date) - new Date(b.date));

  const decayFactor = Math.exp(-1 / timeConstant);
  let ewma = 0;
  let weightSum = 0;

  for (let i = sorted.length - 1; i >= 0; i--) {
    const daysAgo = sorted.length - 1 - i;
    const weight = decayFactor**daysAgo;
    ewma += sorted[i].load * weight;
    weightSum += weight;
  }

  return weightSum > 0 ? ewma / weightSum : 0;
}

/**
 * Build DataState response wrapper
 */
function buildDataStateResponse(result, metricType, currentDataPoints) {
  const dataState = result.riskZone === "consent_blocked"
    ? DataState.NO_DATA
    : getDataStateFromRiskZone(result.riskZone || result.monotonyRisk || result.interpretation);
  
  const requirement = MINIMUM_DATA_REQUIREMENTS[metricType] || { minimumDays: 7 };

  // Build warnings array
  const warnings = [];
  if (dataState === DataState.NO_DATA) {
    if (result.riskZone === "consent_blocked" || result.monotonyRisk === "consent_blocked") {
      warnings.push("Player has not enabled performance data sharing for this team.");
    } else {
      warnings.push("No training data available. Start logging sessions to see metrics.");
    }
  } else if (dataState === DataState.INSUFFICIENT_DATA) {
    const daysNeeded = requirement.minimumDays - currentDataPoints;
    warnings.push(
      `${requirement.description || `${requirement.minimumDays} days of data required`}. You have ${currentDataPoints} days, need ${daysNeeded} more.`
    );
  }

  // Add consent warnings
  if (result.consentInfo?.blockedPlayerIds?.length > 0) {
    warnings.push(
      `${result.consentInfo.blockedPlayerIds.length} player(s) have not enabled data sharing.`
    );
  }

  return {
    dataState,
    currentDataPoints,
    minimumRequiredDataPoints: requirement.minimumDays,
    warnings,
  };
}

/**
 * Handle ACWR endpoint
 * Now includes data state information for safety compliance
 */
async function handleACWR(method, requesterId, query) {
  if (method !== "GET") {
    return createErrorResponse("Method not allowed", 405, "method_not_allowed");
  }

  const date = query?.date ? new Date(query.date) : new Date();
  const targetUserId = query?.playerId || requesterId;
  const teamId = query?.teamId || null;

  const result = await calculateACWR(requesterId, targetUserId, date, { teamId });

  // Determine data state based on available data
  const currentDataPoints = result.chronicLoads || 0;
  const dataStateInfo = buildDataStateResponse(result, "acwr", currentDataPoints);

  // Return response with data state metadata
  return createSuccessResponse(
    wrapWithDataState(
      {
        ...result,
        calculatedFor: date.toISOString().split("T")[0],
        userId: targetUserId,
      },
      dataStateInfo
    )
  );
}

/**
 * Handle Monotony endpoint
 */
async function handleMonotony(method, requesterId, query) {
  if (method !== "GET") {
    return createErrorResponse("Method not allowed", 405, "method_not_allowed");
  }

  const weekStart = query?.weekStart ? new Date(query.weekStart) : getWeekStart(new Date());
  const targetUserId = query?.playerId || requesterId;
  const teamId = query?.teamId || null;

  const result = await calculateMonotony(requesterId, targetUserId, weekStart, { teamId });

  // Build data state info
  const currentDataPoints = result.trainingDays || 0;
  const dataStateInfo = buildDataStateResponse(result, "trainingMonotony", currentDataPoints);

  return createSuccessResponse(
    wrapWithDataState(
      {
        ...result,
        weekStart: weekStart.toISOString().split("T")[0],
        userId: targetUserId,
      },
      dataStateInfo
    )
  );
}

/**
 * Handle TSB endpoint
 */
async function handleTSB(method, requesterId, query) {
  if (method !== "GET") {
    return createErrorResponse("Method not allowed", 405, "method_not_allowed");
  }

  const date = query?.date ? new Date(query.date) : new Date();
  const targetUserId = query?.playerId || requesterId;
  const teamId = query?.teamId || null;

  const result = await calculateTSB(requesterId, targetUserId, date, { teamId });

  // Build data state info - TSB needs 42 days
  const currentDataPoints = result.ctl !== null ? 42 : 0;
  const dataStateInfo = buildDataStateResponse(result, "tsb", currentDataPoints);

  return createSuccessResponse(
    wrapWithDataState(
      {
        ...result,
        calculatedFor: date.toISOString().split("T")[0],
        userId: targetUserId,
      },
      dataStateInfo
    )
  );
}

/**
 * Handle Injury Risk endpoint
 */
async function handleInjuryRisk(method, requesterId, query) {
  if (method !== "GET") {
    return createErrorResponse("Method not allowed", 405, "method_not_allowed");
  }

  const date = query?.date ? new Date(query.date) : new Date();
  const targetUserId = query?.playerId || requesterId;
  const teamId = query?.teamId || null;

  // Get all risk factors in parallel
  const [acwrData, monotonyData, tsbData] = await Promise.all([
    calculateACWR(requesterId, targetUserId, date, { teamId }),
    calculateMonotony(requesterId, targetUserId, getWeekStart(date), { teamId }),
    calculateTSB(requesterId, targetUserId, date, { teamId }),
  ]);

  // Aggregate consent info
  const allBlockedPlayerIds = [
    ...new Set([
      ...(acwrData.consentInfo?.blockedPlayerIds || []),
      ...(monotonyData.consentInfo?.blockedPlayerIds || []),
      ...(tsbData.consentInfo?.blockedPlayerIds || []),
    ]),
  ];

  const consentInfo = {
    blockedPlayerIds: allBlockedPlayerIds,
    blockedCount: allBlockedPlayerIds.length,
  };

  // Check if data is consent-blocked
  if (allBlockedPlayerIds.includes(targetUserId)) {
    const dataStateInfo = {
      dataState: DataState.NO_DATA,
      currentDataPoints: 0,
      minimumRequiredDataPoints: 28,
      warnings: ["Player has not enabled performance data sharing for this team."],
    };

    return createSuccessResponse(
      wrapWithDataState(
        {
          overallRisk: null,
          riskLevel: "consent_blocked",
          message: "Player has not enabled performance data sharing.",
          consentInfo,
          acwrData,
          monotonyData,
          tsbData,
        },
        dataStateInfo
      )
    );
  }

  // Check if we have enough data
  if (
    acwrData.riskZone === "insufficient_data" &&
    monotonyData.monotonyRisk === "insufficient_data" &&
    tsbData.interpretation === "insufficient_data"
  ) {
    const dataStateInfo = {
      dataState: DataState.INSUFFICIENT_DATA,
      currentDataPoints: acwrData.chronicLoads || 0,
      minimumRequiredDataPoints: 28,
      warnings: ["Insufficient training data. Log more sessions to calculate injury risk."],
    };

    return createSuccessResponse(
      wrapWithDataState(
        {
          overallRisk: null,
          riskLevel: "unknown",
          message: "Insufficient training data. Log more sessions to calculate injury risk.",
          consentInfo,
          acwrData,
          monotonyData,
          tsbData,
        },
        dataStateInfo
      )
    );
  }

  // Calculate individual risk scores (0-1 scale)
  const acwrRisk =
    acwrData.acwr !== null && acwrData.acwr > 1.3
      ? Math.min(1, (acwrData.acwr - 1.3) / 0.7)
      : 0;
  const monotonyRisk =
    monotonyData.monotony !== null && monotonyData.monotony > 2.0
      ? Math.min(1, (monotonyData.monotony - 2.0) / 2.0)
      : 0;
  const tsbRisk =
    tsbData.formScore !== null && tsbData.formScore < 0.6 ? 1 - tsbData.formScore : 0;

  // Weighted composite score based on research
  const weights = { acwr: 0.45, monotony: 0.25, tsb: 0.3 };
  const compositeRisk =
    acwrRisk * weights.acwr + monotonyRisk * weights.monotony + tsbRisk * weights.tsb;

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

  const dataStateInfo = {
    dataState: DataState.REAL_DATA,
    currentDataPoints: acwrData.chronicLoads || 0,
    minimumRequiredDataPoints: 28,
    warnings: consentInfo.blockedCount > 0
      ? [`${consentInfo.blockedCount} player(s) have not enabled data sharing.`]
      : [],
  };

  return createSuccessResponse(
    wrapWithDataState(
      {
        overallRisk: parseFloat(compositeRisk.toFixed(3)),
        riskLevel,
        recommendation,
        individualRisks: {
          acwr: parseFloat(acwrRisk.toFixed(3)),
          monotony: parseFloat(monotonyRisk.toFixed(3)),
          tsb: parseFloat(tsbRisk.toFixed(3)),
        },
        weights,
        consentInfo,
        acwrData,
        monotonyData,
        tsbData,
        calculatedFor: date.toISOString().split("T")[0],
      },
      dataStateInfo
    )
  );
}

/**
 * Handle training loads endpoint
 */
async function handleTrainingLoads(method, requesterId, query) {
  if (method !== "GET") {
    return createErrorResponse("Method not allowed", 405, "method_not_allowed");
  }

  const startDate = query?.startDate
    ? new Date(query.startDate)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const endDate = query?.endDate ? new Date(query.endDate) : new Date();
  const targetUserId = query?.playerId || requesterId;
  const teamId = query?.teamId || null;

  const result = await getTrainingLoads(requesterId, targetUserId, startDate, endDate, { teamId });

  // Build data state info
  const currentDataPoints = result.loads.length;
  const dataState = result.consentInfo?.blockedPlayerIds?.includes(targetUserId)
    ? DataState.NO_DATA
    : currentDataPoints > 0
      ? DataState.REAL_DATA
      : DataState.NO_DATA;

  const warnings = [];
  if (result.consentInfo?.blockedPlayerIds?.includes(targetUserId)) {
    warnings.push("Player has not enabled performance data sharing for this team.");
  } else if (currentDataPoints === 0) {
    warnings.push("No training data found for the specified date range.");
  }

  const dataStateInfo = {
    dataState,
    currentDataPoints,
    minimumRequiredDataPoints: 7,
    warnings,
  };

  return createSuccessResponse(
    wrapWithDataState(
      {
        loads: result.loads,
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        totalSessions: result.loads.length,
        totalLoad: result.loads.reduce((sum, item) => sum + item.load, 0),
        consentInfo: result.consentInfo,
      },
      dataStateInfo
    )
  );
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
        case "load-management": {
          // Default endpoint - return overview
          const date = query?.date ? new Date(query.date) : new Date();
          const targetUserId = query?.playerId || userId;
          const teamId = query?.teamId || null;

          const [acwr, monotony, tsb] = await Promise.all([
            calculateACWR(userId, targetUserId, date, { teamId }),
            calculateMonotony(userId, targetUserId, getWeekStart(date), { teamId }),
            calculateTSB(userId, targetUserId, date, { teamId }),
          ]);

          // Aggregate consent info
          const allBlockedPlayerIds = [
            ...new Set([
              ...(acwr.consentInfo?.blockedPlayerIds || []),
              ...(monotony.consentInfo?.blockedPlayerIds || []),
              ...(tsb.consentInfo?.blockedPlayerIds || []),
            ]),
          ];

          const currentDataPoints = acwr.chronicLoads || 0;
          const dataState = allBlockedPlayerIds.includes(targetUserId)
            ? DataState.NO_DATA
            : evaluateDataState(currentDataPoints, "acwr");

          const warnings = [];
          if (allBlockedPlayerIds.includes(targetUserId)) {
            warnings.push("Player has not enabled performance data sharing.");
          } else if (dataState === DataState.NO_DATA) {
            warnings.push("No training data available. Start logging sessions.");
          } else if (dataState === DataState.INSUFFICIENT_DATA) {
            const daysNeeded = 28 - currentDataPoints;
            warnings.push(`Need ${daysNeeded} more days of data for reliable metrics.`);
          }

          if (allBlockedPlayerIds.length > 0 && !allBlockedPlayerIds.includes(targetUserId)) {
            warnings.push(`${allBlockedPlayerIds.length} player(s) have not enabled data sharing.`);
          }

          response = createSuccessResponse(
            wrapWithDataState(
              {
                acwr,
                monotony,
                tsb,
                calculatedFor: date.toISOString().split("T")[0],
                consentInfo: {
                  blockedPlayerIds: allBlockedPlayerIds,
                  blockedCount: allBlockedPlayerIds.length,
                },
              },
              {
                dataState,
                currentDataPoints,
                minimumRequiredDataPoints: 28,
                warnings,
              }
            )
          );
          break;
        }
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
