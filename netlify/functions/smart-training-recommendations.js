import { supabaseAdmin, checkEnvVars } from "./supabase-client.js";
import { baseHandler } from "./utils/base-handler.js";
import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";

// Netlify Function: Smart Training Recommendations
// Integrates tournaments, ACWR, RPE, injuries, and periodization
// to provide intelligent training recommendations
//
// Evidence-Based Framework:
// - ACWR (Acute:Chronic Workload Ratio): Gabbett 2016
// - Tapering protocols: Bosquet et al. 2007, Mujika & Padilla 2003
// - Injury risk factors: Hulin 2016, Milewski 2014
// - Recovery metrics: Saw et al. 2016

// =====================================================
// CONSTANTS & CONFIGURATIONS
// =====================================================

/**
 * Tournament importance levels for taper differentiation
 */
const TOURNAMENT_IMPORTANCE = {
  world: { taperDays: 14, volumeReduction: 0.5, label: "World Championship" },
  european: {
    taperDays: 12,
    volumeReduction: 0.45,
    label: "European Championship",
  },
  qualifier: { taperDays: 10, volumeReduction: 0.4, label: "World Qualifier" },
  regional: {
    taperDays: 7,
    volumeReduction: 0.35,
    label: "Regional Championship",
  },
  national: {
    taperDays: 7,
    volumeReduction: 0.35,
    label: "National Championship",
  },
  friendly: { taperDays: 3, volumeReduction: 0.2, label: "Friendly" },
};

/**
 * ACWR risk zones with injury risk multipliers
 */
const ACWR_ZONES = {
  detraining: { min: 0, max: 0.8, risk: 1.2, action: "increase_load" },
  safe: { min: 0.8, max: 1.3, risk: 1.0, action: "maintain" },
  caution: { min: 1.3, max: 1.5, risk: 1.5, action: "reduce_slightly" },
  danger: { min: 1.5, max: 1.8, risk: 2.0, action: "reduce_significantly" },
  critical: { min: 1.8, max: Infinity, risk: 4.2, action: "rest" },
};

/**
 * Injury severity impact on training
 */
const INJURY_IMPACT = {
  1: { volumeModifier: 1.0, intensityModifier: 1.0, description: "No impact" },
  2: {
    volumeModifier: 0.9,
    intensityModifier: 0.9,
    description: "Slight modification",
  },
  3: {
    volumeModifier: 0.7,
    intensityModifier: 0.7,
    description: "Significant modification",
  },
  4: {
    volumeModifier: 0.4,
    intensityModifier: 0.5,
    description: "Limited training",
  },
  5: { volumeModifier: 0, intensityModifier: 0, description: "Rest required" },
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Calculate ACWR from training sessions
 */
async function calculateACWR(userId, date) {
  const endDate = new Date(date);
  const acuteStart = new Date(date);
  acuteStart.setDate(acuteStart.getDate() - 7);
  const chronicStart = new Date(date);
  chronicStart.setDate(chronicStart.getDate() - 28);

  // Get training sessions
  const { data: sessions } = await supabaseAdmin
    .from("training_sessions")
    .select("session_date, duration_minutes, rpe, intensity_level")
    .eq("athlete_id", userId)
    .gte("session_date", chronicStart.toISOString().split("T")[0])
    .lte("session_date", endDate.toISOString().split("T")[0])
    .in("status", ["completed", "in_progress"]);

  if (!sessions || sessions.length === 0) {
    return {
      acwr: 0,
      riskZone: "insufficient_data",
      acuteLoad: 0,
      chronicLoad: 0,
    };
  }

  // Calculate loads (session-RPE = duration × RPE)
  const calculateLoad = (s) => {
    const duration = s.duration_minutes || 60;
    const rpe = s.rpe || s.intensity_level || 5;
    return duration * rpe;
  };

  const acuteSessions = sessions.filter(
    (s) => s.session_date >= acuteStart.toISOString().split("T")[0],
  );
  const acuteLoad = acuteSessions.reduce((sum, s) => sum + calculateLoad(s), 0);
  const chronicLoad =
    sessions.reduce((sum, s) => sum + calculateLoad(s), 0) / 4; // Weekly average

  if (chronicLoad === 0) {
    return { acwr: 0, riskZone: "insufficient_data", acuteLoad, chronicLoad };
  }

  const acwr = acuteLoad / chronicLoad;

  // Determine risk zone
  let riskZone = "safe";
  for (const [zone, config] of Object.entries(ACWR_ZONES)) {
    if (acwr >= config.min && acwr < config.max) {
      riskZone = zone;
      break;
    }
  }

  return {
    acwr: Math.round(acwr * 100) / 100,
    riskZone,
    acuteLoad: Math.round(acuteLoad),
    chronicLoad: Math.round(chronicLoad),
    injuryRiskMultiplier: ACWR_ZONES[riskZone]?.risk || 1.0,
  };
}

/**
 * Get upcoming tournaments for the user's team
 */
async function getUpcomingTournaments(userId, daysAhead = 30) {
  const today = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + daysAhead);

  // Get tournaments from database
  const { data: tournaments } = await supabaseAdmin
    .from("tournaments")
    .select("*")
    .gte("start_date", today.toISOString().split("T")[0])
    .lte("start_date", endDate.toISOString().split("T")[0])
    .order("start_date", { ascending: true });

  if (!tournaments || tournaments.length === 0) {
    return [];
  }

  return tournaments.map((t) => {
    const startDate = new Date(t.start_date);
    const daysUntil = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));
    const importance =
      TOURNAMENT_IMPORTANCE[t.competition_level] ||
      TOURNAMENT_IMPORTANCE.regional;

    return {
      ...t,
      daysUntil,
      importance,
      inTaperWindow: daysUntil <= importance.taperDays,
      taperDay: importance.taperDays - daysUntil,
    };
  });
}

/**
 * Get active injuries for the user
 */
async function getActiveInjuries(userId) {
  const { data: injuries } = await supabaseAdmin
    .from("injuries")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["active", "recovering", "monitoring"])
    .order("severity", { descending: true });

  return injuries || [];
}

/**
 * Get latest wellness data
 */
async function getWellnessData(userId, date) {
  const { data: wellness } = await supabaseAdmin
    .from("wellness_logs")
    .select("*")
    .eq("athlete_id", userId)
    .lte("log_date", date.toISOString().split("T")[0])
    .order("log_date", { descending: true })
    .limit(1)
    .maybeSingle();

  return wellness;
}

/**
 * Get current training phase
 */
async function getCurrentPhase(userId, date) {
  const dateStr = date.toISOString().split("T")[0];

  // Get active training program
  const { data: program } = await supabaseAdmin
    .from("training_programs")
    .select(
      `
      id, name,
      training_phases (
        id, name, description, start_date, end_date, phase_order, focus_areas
      )
    `,
    )
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!program || !program.training_phases) {
    return null;
  }

  // Find current phase
  const currentPhase = program.training_phases.find(
    (phase) => phase.start_date <= dateStr && phase.end_date >= dateStr,
  );

  return currentPhase || null;
}

/**
 * Calculate training monotony (variation in training load)
 */
async function calculateMonotony(userId, date) {
  const weekStart = new Date(date);
  weekStart.setDate(weekStart.getDate() - 7);

  const { data: sessions } = await supabaseAdmin
    .from("training_sessions")
    .select("session_date, duration_minutes, rpe, intensity_level")
    .eq("athlete_id", userId)
    .gte("session_date", weekStart.toISOString().split("T")[0])
    .lte("session_date", date.toISOString().split("T")[0])
    .in("status", ["completed", "in_progress"]);

  if (!sessions || sessions.length < 3) {
    return { monotony: 0, strain: 0, message: "Insufficient data" };
  }

  // Calculate daily loads
  const dailyLoads = sessions.map((s) => {
    const duration = s.duration_minutes || 60;
    const rpe = s.rpe || s.intensity_level || 5;
    return duration * rpe;
  });

  const mean = dailyLoads.reduce((a, b) => a + b, 0) / dailyLoads.length;
  const variance =
    dailyLoads.reduce((sum, load) => sum + (load - mean) ** 2, 0) /
    dailyLoads.length;
  const stdDev = Math.sqrt(variance);

  const monotony = stdDev > 0 ? mean / stdDev : 0;
  const weeklyLoad = dailyLoads.reduce((a, b) => a + b, 0);
  const strain = weeklyLoad * monotony;

  return {
    monotony: Math.round(monotony * 100) / 100,
    strain: Math.round(strain),
    weeklyLoad: Math.round(weeklyLoad),
    riskLevel: monotony > 2.0 ? "high" : monotony > 1.5 ? "moderate" : "low",
  };
}

/**
 * Generate smart training recommendations
 */
function generateRecommendations(data) {
  const {
    acwr,
    tournaments,
    injuries,
    wellness,
    phase,
    monotony,
    date: _date,
  } = data;

  const recommendations = {
    overallStatus: "normal",
    volumeModifier: 1.0,
    intensityModifier: 1.0,
    sessionType: "normal",
    focusAreas: [],
    warnings: [],
    suggestions: [],
    restrictions: [],
  };

  // 1. Tournament-based adjustments (TAPER)
  const upcomingTournament = tournaments.find((t) => t.inTaperWindow);
  if (upcomingTournament) {
    const taperProgress =
      upcomingTournament.taperDay / upcomingTournament.importance.taperDays;

    // Progressive taper: reduce volume more as tournament approaches
    // But maintain intensity (evidence-based: Mujika & Padilla 2003)
    const volumeReduction =
      upcomingTournament.importance.volumeReduction * taperProgress;
    recommendations.volumeModifier = Math.max(0.4, 1 - volumeReduction);
    recommendations.intensityModifier = Math.max(
      0.85,
      1 - volumeReduction * 0.2,
    ); // Maintain ~85-100% intensity

    recommendations.overallStatus = "taper";
    recommendations.sessionType =
      upcomingTournament.daysUntil <= 2 ? "activation" : "taper";

    recommendations.suggestions.push(
      `🏆 ${upcomingTournament.name} in ${upcomingTournament.daysUntil} days`,
      `Reduce volume to ${Math.round(recommendations.volumeModifier * 100)}%`,
      `Maintain intensity at ${Math.round(recommendations.intensityModifier * 100)}%`,
      upcomingTournament.daysUntil <= 3
        ? "Focus on sharpness and activation"
        : "Focus on quality over quantity",
    );
  }

  // 2. ACWR-based adjustments
  if (acwr.riskZone === "critical" || acwr.riskZone === "danger") {
    recommendations.overallStatus = "caution";
    recommendations.volumeModifier *= 0.6;
    recommendations.intensityModifier *= 0.7;
    recommendations.warnings.push(
      `⚠️ ACWR at ${acwr.acwr} - ${acwr.riskZone.toUpperCase()} zone`,
      `Injury risk multiplier: ${acwr.injuryRiskMultiplier}x`,
      "Reduce training load immediately",
    );
  } else if (acwr.riskZone === "caution") {
    recommendations.volumeModifier *= 0.85;
    recommendations.suggestions.push(
      `ACWR at ${acwr.acwr} - monitor closely`,
      "Slight volume reduction recommended",
    );
  } else if (acwr.riskZone === "detraining") {
    recommendations.suggestions.push(
      `ACWR at ${acwr.acwr} - consider increasing load`,
      "Risk of detraining if load stays low",
    );
  }

  // 3. Injury-based adjustments
  if (injuries.length > 0) {
    const worstInjury = injuries[0]; // Already sorted by severity
    const impact =
      INJURY_IMPACT[Math.min(5, Math.ceil(worstInjury.severity / 2))];

    recommendations.volumeModifier *= impact.volumeModifier;
    recommendations.intensityModifier *= impact.intensityModifier;

    if (worstInjury.severity >= 7) {
      recommendations.overallStatus = "injured";
      recommendations.sessionType = "recovery";
      recommendations.warnings.push(
        `🚨 Active injury: ${worstInjury.type} (severity ${worstInjury.severity}/10)`,
        impact.description,
      );
    } else if (worstInjury.severity >= 4) {
      recommendations.warnings.push(
        `⚠️ Managing injury: ${worstInjury.type} (severity ${worstInjury.severity}/10)`,
        `Training modification: ${impact.description}`,
      );
    }

    // Add specific restrictions based on injury type
    const injuryType = worstInjury.type?.toLowerCase() || "";
    if (injuryType.includes("hamstring")) {
      recommendations.restrictions.push(
        "Avoid explosive sprints",
        "Limit hip hinge movements",
        "No Nordic curls",
      );
    } else if (injuryType.includes("ankle")) {
      recommendations.restrictions.push(
        "Avoid lateral movements",
        "No jumping/plyometrics",
        "Limited running",
      );
    } else if (injuryType.includes("knee")) {
      recommendations.restrictions.push(
        "Avoid deep squats",
        "No jumping",
        "Limited running volume",
      );
    } else if (injuryType.includes("shoulder")) {
      recommendations.restrictions.push(
        "No overhead pressing",
        "Limit pushing movements",
        "Focus on rehab exercises",
      );
    }
  }

  // 4. Wellness-based adjustments
  if (wellness) {
    const avgWellness =
      ((wellness.sleep_quality || 5) +
        (10 - (wellness.fatigue || 5)) +
        (10 - (wellness.soreness || 5)) +
        (wellness.mood || 5) +
        (wellness.energy || 5)) /
      5;

    if (avgWellness < 4) {
      recommendations.volumeModifier *= 0.7;
      recommendations.intensityModifier *= 0.8;
      recommendations.warnings.push(
        "⚠️ Low wellness scores detected",
        "Consider recovery-focused session",
      );
    } else if (avgWellness < 6) {
      recommendations.volumeModifier *= 0.85;
      recommendations.suggestions.push("Moderate wellness - adjust as needed");
    }

    // Sleep-specific
    if (wellness.sleep_quality && wellness.sleep_quality < 5) {
      recommendations.suggestions.push(
        "Poor sleep quality - prioritize recovery",
      );
    }
  }

  // 5. Monotony-based adjustments
  if (monotony.riskLevel === "high") {
    recommendations.warnings.push(
      `⚠️ High training monotony (${monotony.monotony})`,
      "Vary training stimulus to reduce injury risk",
    );
    recommendations.focusAreas.push("variety", "cross-training");
  }

  // 6. Phase-based focus areas
  if (phase) {
    recommendations.currentPhase = phase.name;
    recommendations.phaseDescription = phase.description;
    if (phase.focus_areas) {
      recommendations.focusAreas.push(...phase.focus_areas);
    }
  }

  // Calculate final modifiers (ensure minimums)
  recommendations.volumeModifier = Math.max(
    0.2,
    Math.round(recommendations.volumeModifier * 100) / 100,
  );
  recommendations.intensityModifier = Math.max(
    0.3,
    Math.round(recommendations.intensityModifier * 100) / 100,
  );

  // Generate session recommendation
  if (
    recommendations.overallStatus === "injured" &&
    recommendations.volumeModifier < 0.3
  ) {
    recommendations.sessionRecommendation =
      "Rest day or light mobility work only";
  } else if (
    recommendations.overallStatus === "taper" &&
    upcomingTournament?.daysUntil <= 1
  ) {
    recommendations.sessionRecommendation =
      "Light activation - prepare for competition";
  } else if (recommendations.overallStatus === "taper") {
    recommendations.sessionRecommendation = `Taper session: ${Math.round(recommendations.volumeModifier * 100)}% volume, ${Math.round(recommendations.intensityModifier * 100)}% intensity`;
  } else if (recommendations.overallStatus === "caution") {
    recommendations.sessionRecommendation =
      "Reduced load session - focus on technique and recovery";
  } else {
    recommendations.sessionRecommendation = `Normal training: ${phase?.name || "General"} phase focus`;
  }

  return recommendations;
}

// =====================================================
// MAIN HANDLER
// =====================================================

export const handler = async (event, context) => {
  const rateLimitType = event.httpMethod === "GET" ? "READ" : "UPDATE";
  return baseHandler(event, context, {
    functionName: "smart-training-recommendations",
    allowedMethods: ["GET", "POST"],
rateLimitType: rateLimitType,
    requireAuth: true,
    handler: async (event, _context, { userId, requestId }) => {
      try {
        checkEnvVars();

        // Parse request
        let athleteId = userId;
        let targetDate = new Date();

        if (event.httpMethod === "POST") {
          try {
            const body = JSON.parse(event.body || "{}");
            if (body.athleteId) {
              ({ athleteId } = body);
            }
            if (body.date) {
              targetDate = new Date(body.date);
            }
          } catch {
            // Use defaults
          }
        } else {
          const params = event.queryStringParameters || {};
          if (params.athleteId) {
            ({ athleteId } = params);
          }
          if (params.date) {
            targetDate = new Date(params.date);
          }
        }

        // Gather all data in parallel
        const [acwr, tournaments, injuries, wellness, phase, monotony] =
          await Promise.all([
            calculateACWR(athleteId, targetDate),
            getUpcomingTournaments(athleteId, 30),
            getActiveInjuries(athleteId),
            getWellnessData(athleteId, targetDate),
            getCurrentPhase(athleteId, targetDate),
            calculateMonotony(athleteId, targetDate),
          ]);

        // Generate recommendations
        const recommendations = generateRecommendations({
          acwr,
          tournaments,
          injuries,
          wellness,
          phase,
          monotony,
          date: targetDate,
        });

        return createSuccessResponse(
          {
            date: targetDate.toISOString().split("T")[0],
            athleteId,
            recommendations,
            metrics: {
              acwr,
              monotony,
              activeInjuries: injuries.length,
              upcomingTournaments: tournaments.length,
              nextTournament: tournaments[0] || null,
            },
            wellness: wellness
              ? {
                  sleepQuality: wellness.sleep_quality,
                  fatigue: wellness.fatigue,
                  soreness: wellness.soreness,
                  mood: wellness.mood,
                  energy: wellness.energy,
                }
              : null,
            phase: phase
              ? {
                  name: phase.name,
                  description: phase.description,
                  focusAreas: phase.focus_areas,
                }
              : null,
          },
          requestId,
        );
      } catch (error) {
        console.error(
          "[smart-training-recommendations] Unexpected handler error:",
          error,
        );
        return createErrorResponse(
          "Failed to generate training recommendations",
          500,
          "database_error",
          requestId,
        );
      }
    },
  });
};
