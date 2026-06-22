import { supabaseAdmin } from "./supabase-client.js";
import { baseHandler } from "./utils/base-handler.js";
import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";
import { getUserRole } from "./utils/authorization-guard.js";
import { ACWR_RISK_ZONES, computeAcwrAt, computeSessionLoad } from "./utils/acwr.js";
import { tryParseJsonObjectBody } from "./utils/input-validator.js";
import { createLogger } from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.smart-training-recommendations" });

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

// ACWR risk zones (with injury-risk multipliers) — canonical, from utils/acwr.js.
const ACWR_ZONES = ACWR_RISK_ZONES;

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

const COACH_ROLES = new Set(["coach", "head_coach", "assistant_coach", "admin"]);

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Calculate ACWR from training sessions using the canonical EWMA engine
 * (Williams 2017 / Gabbett 2016 uncoupled ACWR — utils/acwr.js is the single
 * source of truth). Replaces the prior simple 7d/28d sum ratio that diverged
 * from the authoritative implementation in load-management.js.
 */
async function calculateACWR(userId, date) {
  const endDate = new Date(date);
  // 5-week lookback gives EWMA chronic window (21d) + 7d acute + warmup buffer
  const since = new Date(endDate);
  since.setDate(since.getDate() - 35);

  const { data: sessions } = await supabaseAdmin
    .from("training_sessions")
    .select("session_date, workload, duration_minutes, rpe, intensity_level")
    .eq("user_id", userId)
    .gte("session_date", since.toISOString().split("T")[0])
    .lte("session_date", endDate.toISOString().split("T")[0])
    .in("status", ["completed", "in_progress"]);

  if (!sessions || sessions.length === 0) {
    return { acwr: 0, riskZone: "insufficient_data", acuteLoad: 0, chronicLoad: 0 };
  }

  // Build daily-load Map: canonical computeSessionLoad handles workload/rpe/duration
  const dailyLoads = new Map();
  for (const s of sessions) {
    const load = computeSessionLoad(s);
    if (load > 0) {
      const prev = dailyLoads.get(s.session_date) ?? 0;
      dailyLoads.set(s.session_date, prev + load);
    }
  }

  const result = computeAcwrAt(dailyLoads, endDate);

  if (result.acwr === null) {
    return {
      acwr: 0,
      riskZone: "insufficient_data",
      acuteLoad: Math.round(result.acuteLoad),
      chronicLoad: Math.round(result.chronicLoad),
    };
  }

  let riskZone = "safe";
  for (const [zone, config] of Object.entries(ACWR_ZONES)) {
    if (result.acwr >= config.min && result.acwr < config.max) {
      riskZone = zone;
      break;
    }
  }

  return {
    acwr: result.acwr,
    riskZone,
    acuteLoad: Math.round(result.acuteLoad),
    chronicLoad: Math.round(result.chronicLoad),
    injuryRiskMultiplier: ACWR_ZONES[riskZone]?.risk || 1.0,
    lowConfidence: result.lowConfidence,
  };
}

/**
 * Get upcoming tournaments for the user's team
 */
async function getUpcomingTournaments(userId, daysAhead = 30) {
  const today = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + daysAhead);

  // Upcoming competition events from the schedule spine (per-athlete union across teams).
  const { data: events } = await supabaseAdmin
    .from("v_athlete_schedule")
    .select(
      "id, label, competition_name, competition_level, starts_at, expected_game_count",
    )
    .eq("user_id", userId)
    .gte("starts_at", today.toISOString())
    .lte("starts_at", endDate.toISOString())
    .order("starts_at", { ascending: true });

  if (!events || events.length === 0) {
    return [];
  }

  return events.map((e) => {
    const startDate = new Date(e.starts_at);
    const daysUntil = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));
    const importance =
      TOURNAMENT_IMPORTANCE[e.competition_level] ||
      TOURNAMENT_IMPORTANCE.regional;

    return {
      id: e.id,
      name: e.label || e.competition_name,
      start_date: e.starts_at,
      competition_level: e.competition_level,
      expected_game_count: e.expected_game_count,
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
    // v_injuries_unified surfaces the clinical athlete_injuries rows with injury_grade
    // mapped to the numeric 1-10 severity this module's math (worstInjury.severity / 2,
    // >= 7, >= 4) depends on. { ascending: false } so injuries[0] is the WORST injury —
    // postgrest ignores the prior { descending: true }, so it was keying safety cuts off
    // the mildest active injury and under-warning athletes carrying a more severe one.
    .from("v_injuries_unified")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["active", "recovering", "monitoring"])
    .order("severity", { ascending: false });

  return injuries || [];
}

/**
 * Get latest wellness data
 */
async function getWellnessData(userId, date) {
  const { data: wellness } = await supabaseAdmin
    .from("daily_wellness_checkin")
    .select("*")
    .eq("user_id", userId)
    .lte("checkin_date", date.toISOString().split("T")[0])
    .order("checkin_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!wellness) {
    return wellness;
  }

  // Normalize to the field names this module's consumers read.
  return {
    ...wellness,
    soreness: wellness.muscle_soreness,
    energy: wellness.energy_level,
  };
}

/**
 * Get current training phase
 */
async function getCurrentPhase(userId, date) {
  const dateStr = date.toISOString().split("T")[0];

  // Resolve the athlete's OWN program assignment via player_programs —
  // never a globally-active training_programs row, which would leak one
  // program's phase into every athlete's plan across all teams.
  const { data: assignments } = await supabaseAdmin
    .from("player_programs")
    .select(
      `
      current_phase_id,
      training_programs (
        id, name,
        training_phases (
          id, name, description, start_date, end_date, phase_order, focus_areas
        )
      )
    `,
    )
    .eq("user_id", userId)
    .eq("is_active", true)
    .lte("start_date", dateStr)
    .or(`end_date.is.null,end_date.gte.${dateStr}`)
    .order("start_date", { ascending: false })
    .limit(1);

  const assignment = assignments?.[0];
  const phases = assignment?.training_programs?.training_phases;
  if (!phases || phases.length === 0) {
    return null;
  }

  // Prefer the explicitly tracked phase, else match by date.
  const currentPhase =
    (assignment.current_phase_id &&
      phases.find((phase) => phase.id === assignment.current_phase_id)) ||
    phases.find(
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
    .eq("user_id", userId)
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

const handler = async (event, context) => {
  const rateLimitType = event.httpMethod === "GET" ? "READ" : "UPDATE";
  return baseHandler(event, context, {
    functionName: "smart-training-recommendations",
    allowedMethods: ["GET", "POST"],
    rateLimitType,
    requireAuth: true,
    handler: async (event, _context, { userId, requestId }) => {
      try {
    
        // Parse request
        let athleteId = userId;
        let targetDate = new Date();

        if (event.httpMethod === "POST") {
          const parsedBody = tryParseJsonObjectBody(event.body);
          if (!parsedBody.ok) {
            return parsedBody.error;
          }
          const body = parsedBody.data;
          if (body.athleteId) {
            ({ athleteId } = body);
          }
          if (body.date) {
            targetDate = new Date(body.date);
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

        if (typeof athleteId !== "string" || athleteId.trim().length === 0) {
          return createErrorResponse(
            "athleteId must be a non-empty string",
            400,
            "validation_error",
            requestId,
          );
        }

        if (Number.isNaN(targetDate.getTime())) {
          return createErrorResponse(
            "date must be a valid date",
            400,
            "validation_error",
            requestId,
          );
        }

        if (athleteId !== userId) {
          const role = await getUserRole(userId);
          if (!COACH_ROLES.has(role)) {
            return createErrorResponse(
              "Not authorized to view another athlete's recommendations",
              403,
              "authorization_error",
              requestId,
            );
          }

          const { data: actorTeamMemberships, error: actorTeamsError } =
            await supabaseAdmin
              .from("team_members")
              .select("team_id")
              .eq("user_id", userId)
              .eq("status", "active")
              .in("role", [...COACH_ROLES]);
          if (actorTeamsError) {
            throw actorTeamsError;
          }

          const actorTeamIds = (actorTeamMemberships || [])
            .map((m) => m.team_id)
            .filter(Boolean);
          if (actorTeamIds.length === 0) {
            return createErrorResponse(
              "Not authorized to view another athlete's recommendations",
              403,
              "authorization_error",
              requestId,
            );
          }

          const { data: targetMembership, error: targetMembershipError } =
            await supabaseAdmin
              .from("team_members")
              .select("team_id")
              .eq("user_id", athleteId)
              .eq("status", "active")
              .in("team_id", actorTeamIds)
              .limit(1);
          if (targetMembershipError) {
            throw targetMembershipError;
          }
          if (!targetMembership || targetMembership.length === 0) {
            return createErrorResponse(
              "Not authorized to view another athlete's recommendations",
              403,
              "authorization_error",
              requestId,
            );
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
        logger.error("smart_training_recommendations_handler_error", error, {});
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

export const testHandler = handler;
export { handler };
