import { baseHandler } from "./utils/base-handler.js";
import {
  createSuccessResponse,
  createErrorResponse,
} from "./utils/error-handler.js";
import {
  tryParseJsonObjectBody,
  parseBoundedInt,
} from "./utils/input-validator.js";
import { supabaseAdmin } from "./supabase-client.js";
import { createLogger } from "./utils/structured-logger.js";
import {
  RECOVERY_PROTOCOLS as RECOVERY_MODALITIES,
  RECOVERY_HEADLINE,
  ADAPTATION_BLUNTING,
} from "./utils/recovery-protocols.js";

const logger = createLogger({ service: "netlify.recovery-core" });

// Netlify Function: Recovery Protocol API
// Handles recovery recommendations, protocols, and athlete recovery profiles.
//
// SINGLE SOURCE OF EVIDENCE (2026-07-13): every modality fact this endpoint serves
// — dose, evidence tier, adaptation-blunting, "static stretching is NOT recovery",
// the debunked lactate-flush rationale — comes from `utils/recovery-protocols.js`,
// the one evidence-graded catalogue the daily-protocol recovery panel also reads.
// This file used to carry its own private `RECOVERY_PROTOCOLS` catalogue that had
// drifted from the evidence (it recommended static stretching as recovery and
// implied massage prevents injury); that copy was deleted here. What stays local is
// the SESSION-REACTIVE decision logic (given today's intensity/soreness/equipment,
// what to do) — a different intent from the module's day-type-driven
// `resolveRecoveryProtocols`, so the two engines are kept separate on purpose.
//
// =============================================================================

// =============================================================================
// RECOVERY TRIGGER THRESHOLDS (2026-07-08, reusability audit F6)
// Were hardcoded inline in the priority/next-day-recovery branches below —
// extracted to named constants so the trigger points are visible in one place
// instead of buried in `if` conditions. Same team-wide values for every athlete
// today (not yet team-configurable like monitoring_config's Hooper thresholds —
// that would be a product decision about whether coaches should be able to tune
// this, not a mechanical extraction, so it's flagged, not silently added here).
// =============================================================================
const RECOVERY_TRIGGERS = {
  // Session-priority classification (intensity/soreness 1-10 scale)
  HIGH_INTENSITY: 8,
  HIGH_INTENSITY_NEAR_NEXT_SESSION: 6,
  NEAR_NEXT_SESSION_DAYS: 1,
  CRITICAL_INTENSITY: 9,
  CRITICAL_SORENESS: 7,
  LOW_INTENSITY: 4,
  // Next-day active-recovery trigger
  NEXT_DAY_SORENESS: 5,
  NEXT_DAY_INTENSITY: 7,
  // Cold-water immersion is only offered above this session intensity
  COLD_THERAPY_INTENSITY: 7,
};

// Training types where the week's goal is ADAPTATION (strength/power/skill gains) —
// so cold-water immersion / contrast must be withheld or explicitly flagged, per
// Roberts 2015. Competition-type sessions (game/conditioning) have no adaptation to
// protect, so fast performance restoration wins there.
const ADAPTATION_TRAINING_TYPES = new Set([
  "strength",
  "speed",
  "agility",
  "power",
  "plyometric",
]);

const isValidIsoDateTime = (value) => {
  if (!value || typeof value !== "string") {
    return false;
  }
  return !Number.isNaN(new Date(value).getTime());
};

function validateRecommendPayload(payload = {}) {
  const errors = [];
  if (payload.intensity !== undefined) {
    const intensity = Number(payload.intensity);
    if (!Number.isFinite(intensity) || intensity < 1 || intensity > 10) {
      errors.push("intensity must be a number between 1 and 10");
    }
  }
  if (payload.soreness !== undefined) {
    const soreness = Number(payload.soreness);
    if (!Number.isFinite(soreness) || soreness < 0 || soreness > 10) {
      errors.push("soreness must be a number between 0 and 10");
    }
  }
  if (payload.daysUntilNextSession !== undefined) {
    const days = Number(payload.daysUntilNextSession);
    if (!Number.isInteger(days) || days < 0 || days > 30) {
      errors.push("daysUntilNextSession must be an integer between 0 and 30");
    }
  }
  if (
    payload.sleepQuality !== undefined &&
    !["poor", "fair", "good", "excellent"].includes(payload.sleepQuality)
  ) {
    errors.push("sleepQuality must be one of: poor, fair, good, excellent");
  }
  if (payload.timeAvailable !== undefined) {
    const minutes = Number(payload.timeAvailable);
    if (!Number.isFinite(minutes) || minutes < 0 || minutes > 600) {
      errors.push("timeAvailable must be a number between 0 and 600");
    }
  }
  if (
    payload.muscleGroups !== undefined &&
    !Array.isArray(payload.muscleGroups)
  ) {
    errors.push("muscleGroups must be an array when provided");
  }
  if (payload.equipment !== undefined && !Array.isArray(payload.equipment)) {
    errors.push("equipment must be an array when provided");
  }
  return errors;
}

function validateRecoveryLogPayload(payload = {}) {
  const errors = [];
  if (!payload.protocol_id || !String(payload.protocol_id).trim()) {
    errors.push("protocol_id is required");
  }
  if (!payload.protocol_name || !String(payload.protocol_name).trim()) {
    errors.push("protocol_name is required");
  }
  if (!payload.started_at || !isValidIsoDateTime(payload.started_at)) {
    errors.push("started_at must be a valid datetime");
  }
  if (
    payload.completed_at !== undefined &&
    payload.completed_at !== null &&
    !isValidIsoDateTime(payload.completed_at)
  ) {
    errors.push("completed_at must be a valid datetime when provided");
  }
  if (payload.duration_planned !== undefined) {
    const planned = Number(payload.duration_planned);
    if (!Number.isInteger(planned) || planned < 0 || planned > 480) {
      errors.push("duration_planned must be an integer between 0 and 480");
    }
  }
  if (payload.duration_actual !== undefined) {
    const actual = Number(payload.duration_actual);
    if (!Number.isInteger(actual) || actual < 0 || actual > 480) {
      errors.push("duration_actual must be an integer between 0 and 480");
    }
  }
  if (
    payload.status !== undefined &&
    !["in_progress", "completed", "stopped"].includes(payload.status)
  ) {
    errors.push("status must be one of: in_progress, completed, stopped");
  }
  return errors;
}

// =============================================================================
// RECOVERY RECOMMENDATION ENGINE
// =============================================================================

/**
 * Build a recommendation entry for a modality, sourcing every evidence fact
 * (name, dose, effect, cautions, tier) from the single-source catalogue so the
 * numbers here can never drift from the daily-protocol recovery panel.
 */
function modalityRec(key, { priority, reason, timing, focus } = {}) {
  const m = RECOVERY_MODALITIES[key];
  if (!m) {
    return null;
  }
  const entry = {
    protocol: key,
    technique: m.name,
    duration: m.dose?.durationText,
    priority: priority || "medium",
    tier: m.tier,
    reason: reason || m.effect,
  };
  if (timing || m.timing) {
    entry.timing = timing || m.timing;
  }
  if (Array.isArray(focus) && focus.length > 0) {
    entry.focus = focus;
  }
  if (Array.isArray(m.cautions) && m.cautions.length > 0) {
    entry.cautions = m.cautions;
  }
  if (ADAPTATION_BLUNTING.includes(key)) {
    entry.warning =
      "Blunts strength/power adaptation — only when adaptation is not this week's goal, and never within ~6 h of a lifting/sprint session.";
  }
  return entry;
}

/**
 * Generate personalized recovery recommendations based on today's session.
 * Session-reactive (intensity/soreness/equipment-driven) — distinct from the
 * module's day-type-driven resolveRecoveryProtocols. Modality facts are sourced
 * from the single evidence catalogue.
 */
function generateRecoveryRecommendations(params) {
  const {
    trainingType, // 'strength', 'speed', 'agility', 'game', 'conditioning'
    intensity, // 1-10 scale
    duration: _duration, // minutes
    muscleGroups = [], // ['legs', 'upper_body', 'core', 'full_body']
    timeAvailable, // minutes available for recovery
    equipment = [], // ['foam_roller', 'massage_gun', 'ice_bath', 'sauna', 'compression']
    soreness = 0, // current soreness level 1-10
    sleepQuality, // 'poor', 'fair', 'good', 'excellent'
    daysUntilNextSession = 1,
  } = params;

  const recommendations = {
    immediate: [], // Do right after training
    sameDay: [], // Later same day
    nextDay: [], // Following day
    ongoing: [], // General recommendations
    headline: RECOVERY_HEADLINE, // honest framing (Tier 1 dwarfs passive modalities)
    priority: "normal", // 'low', 'normal', 'high', 'critical'
  };

  // Determine recovery priority based on intensity and time until next session
  if (
    intensity >= RECOVERY_TRIGGERS.HIGH_INTENSITY ||
    (intensity >= RECOVERY_TRIGGERS.HIGH_INTENSITY_NEAR_NEXT_SESSION &&
      daysUntilNextSession <= RECOVERY_TRIGGERS.NEAR_NEXT_SESSION_DAYS)
  ) {
    recommendations.priority = "high";
  } else if (
    intensity >= RECOVERY_TRIGGERS.CRITICAL_INTENSITY ||
    soreness >= RECOVERY_TRIGGERS.CRITICAL_SORENESS
  ) {
    recommendations.priority = "critical";
  } else if (intensity <= RECOVERY_TRIGGERS.LOW_INTENSITY) {
    recommendations.priority = "low";
  }

  const isAdaptationSession = ADAPTATION_TRAINING_TYPES.has(trainingType);

  // ── Immediate (0-30 min post-training) — Tier 1 refuel first, then cheap wins ──
  recommendations.immediate.push(
    modalityRec("nutrition_refuel", {
      priority: "high",
      reason:
        "Optimal window for protein synthesis and glycogen replenishment — the highest-leverage post-session action.",
    }),
  );

  if (equipment.includes("foam_roller") || timeAvailable >= 10) {
    recommendations.immediate.push(
      modalityRec("foam_rolling", {
        priority: "medium",
        focus: muscleGroups,
        reason:
          "Reduces DOMS + improves ROM without impairing subsequent strength (unlike static stretching).",
      }),
    );
  }

  // Cold-water immersion: real, fast performance restoration — but it BLUNTS
  // adaptation. Offer it only when this session was NOT an adaptation session
  // (i.e. a game/conditioning day where restoring performance fast is the point).
  const hasCold =
    equipment.includes("ice_bath") || equipment.includes("cold_shower");
  if (intensity >= RECOVERY_TRIGGERS.COLD_THERAPY_INTENSITY && hasCold) {
    if (isAdaptationSession) {
      recommendations.ongoing.push({
        protocol: "cold_water_immersion",
        technique: RECOVERY_MODALITIES.cold_water_immersion.name,
        priority: "info",
        reason:
          "Skipped on purpose: after a strength/power session, cold-water immersion throws away the adaptation you just trained for (Roberts 2015). Use it on game days, not lifting days.",
      });
    } else {
      recommendations.immediate.push(
        modalityRec("cold_water_immersion", {
          priority: "medium",
          reason:
            "Competition day — restore performance fast for the next game. Adaptation is not this session's goal, so the blunting caveat does not apply.",
        }),
      );
    }
  }

  // ── Same day ──────────────────────────────────────────────────────────────
  if (timeAvailable >= 30) {
    recommendations.sameDay.push(
      modalityRec("active_recovery", {
        priority: "medium",
        reason: "Promote blood flow without adding training stress.",
      }),
    );
  }

  if (equipment.includes("compression")) {
    recommendations.sameDay.push(
      modalityRec("compression_garment", {
        priority: "low",
        reason: "Support venous return and reduce next-day soreness; wear overnight.",
      }),
    );
  }

  // Sauna/heat is low priority for a power/speed profile and can impair next-day
  // max output — only surface it well away from performance, never before a game.
  if (equipment.includes("sauna") && !isAdaptationSession && intensity <= 7) {
    recommendations.sameDay.push(
      modalityRec("sauna_heat", {
        priority: "low",
        timing: "Evening, 2+ hours after training — not before max efforts.",
      }),
    );
  }

  // NOTE: static stretching is deliberately NOT recommended as recovery — it has
  // no DOMS/performance benefit (Afonso 2021). A genuine ROM restriction is
  // handled by the warm-up / tightness triage, not here.

  if (sleepQuality === "poor" || sleepQuality === "fair") {
    recommendations.sameDay.push(
      modalityRec("sleep", {
        priority: "high",
        reason:
          "Poor sleep is the biggest recovery leak there is — protect tonight's sleep above every passive tool.",
      }),
    );
  }

  // ── Next day ────────────────────────────────────────────────────────────────
  if (
    soreness >= RECOVERY_TRIGGERS.NEXT_DAY_SORENESS ||
    intensity >= RECOVERY_TRIGGERS.NEXT_DAY_INTENSITY
  ) {
    recommendations.nextDay.push(
      modalityRec("active_recovery", {
        priority: "medium",
        reason:
          "Easy aerobic movement reduces DOMS more effectively than complete rest.",
      }),
    );
  }

  if (equipment.includes("massage_gun")) {
    recommendations.nextDay.push(
      modalityRec("percussion_gun", {
        priority: "medium",
        focus: muscleGroups,
        reason: "Acute ROM gain with no force decrement — good for a tight spot.",
      }),
    );
  }

  // ── Ongoing (the levers that actually matter) ────────────────────────────────
  recommendations.ongoing.push({
    protocol: "nutrition_refuel",
    technique: "Daily fuelling & hydration",
    priority: "high",
    tips: [
      "Protein with every meal (~0.3 g/kg per meal)",
      "Stay hydrated (aim for clear/light-yellow urine)",
      "Include anti-inflammatory foods (fish, berries, leafy greens)",
      "Limit alcohol — it measurably impairs recovery",
    ],
  });

  recommendations.ongoing.push({
    protocol: "sleep",
    technique: "Consistent sleep schedule",
    priority: "high",
    target: RECOVERY_MODALITIES.sleep.dose?.durationText,
    tips: [
      "Same bed/wake time daily (±30 min)",
      "Dark, cool room (18–20°C)",
      "No screens 1 h before bed; no caffeine after ~2 PM",
    ],
  });

  return recommendations;
}

/**
 * Get protocol details by modality key (single-source catalogue).
 */
function getProtocolDetails(key) {
  return RECOVERY_MODALITIES[key] || null;
}

/**
 * Get all protocols summary from the single-source evidence catalogue.
 */
function getAllProtocolsSummary() {
  return Object.values(RECOVERY_MODALITIES).map((m) => ({
    id: m.key,
    name: m.name,
    category: m.category,
    purpose: m.purpose,
    tier: m.tier,
    priority: m.priority,
    effect: m.effect,
    injuryPrevention: m.injuryPrevention,
  }));
}

// =============================================================================
// DATABASE OPERATIONS
// =============================================================================

/**
 * Log recovery session
 */
async function logRecoverySession(userId, sessionData) {
  const { data, error } = await supabaseAdmin
    .from("recovery_sessions")
    .insert({
      user_id: userId,
      ...sessionData,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw error;
  }
  return data;
}

/**
 * Get recovery history
 */
async function getRecoveryHistory(userId, limit = 30) {
  const { data, error } = await supabaseAdmin
    .from("recovery_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }
  return data || [];
}

/**
 * Get stored recovery protocols from database
 */
async function getStoredProtocols(filters = {}) {
  let query = supabaseAdmin
    .from("recovery_protocols")
    .select("*")
    .eq("is_active", true);

  if (filters.category) {
    query = query.eq("category", filters.category);
  }

  const { data, error } = await query.order("name");

  if (error) {
    throw error;
  }
  return data || [];
}

// =============================================================================
// REQUEST HANDLER
// =============================================================================

async function handleRequest(event, _context, { userId }) {
  const path =
    event.path
      .replace("/.netlify/functions/recovery", "")
      .replace(/^\/api\/recovery\/?/, "")
      .replace(/^\//, "") || "";

  let body = {};
  if (event.body && ["POST", "PUT"].includes(event.httpMethod)) {
    const parsedBody = tryParseJsonObjectBody(event.body);
    if (!parsedBody.ok) {
      return parsedBody.error;
    }
    body = parsedBody.data;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return createErrorResponse("Invalid JSON body", 400, "invalid_json");
    }
  }

  try {
    // Get all protocols summary
    if (event.httpMethod === "GET" && path === "protocols") {
      const summary = getAllProtocolsSummary();
      const stored = await getStoredProtocols();
      return createSuccessResponse({
        headline: RECOVERY_HEADLINE,
        builtIn: summary,
        custom: stored,
      });
    }

    // Get specific protocol details
    if (event.httpMethod === "GET" && path.startsWith("protocols/")) {
      const category = path.replace("protocols/", "");
      const protocol = getProtocolDetails(category);

      if (!protocol) {
        return createErrorResponse("Protocol not found", 404, "not_found");
      }

      return createSuccessResponse(protocol);
    }

    // Generate recovery recommendations
    if (event.httpMethod === "POST" && path === "recommend") {
      const errors = validateRecommendPayload(body);
      if (errors.length > 0) {
        return createErrorResponse(errors.join("; "), 422, "validation_error");
      }
      const recommendations = generateRecoveryRecommendations(body);
      return createSuccessResponse(recommendations);
    }

    // Log a recovery session
    if (event.httpMethod === "POST" && path === "log") {
      if (body.user_id !== undefined || body.athlete_id !== undefined) {
        return createErrorResponse(
          "log payload cannot include user_id or athlete_id",
          422,
          "validation_error",
        );
      }
      const errors = validateRecoveryLogPayload(body);
      if (errors.length > 0) {
        return createErrorResponse(errors.join("; "), 422, "validation_error");
      }
      const logged = await logRecoverySession(userId, body);
      return createSuccessResponse(logged, 201);
    }

    // Get recovery history
    if (event.httpMethod === "GET" && path === "history") {
      const params = event.queryStringParameters || {};
      let parsedLimit;
      try {
        parsedLimit = parseBoundedInt(params.limit, "limit", {
          min: 1,
          max: 200,
          fallback: 30,
        });
      } catch (validationError) {
        return createErrorResponse(
          validationError.message,
          422,
          "validation_error",
        );
      }
      const history = await getRecoveryHistory(userId, parsedLimit);
      return createSuccessResponse(history);
    }

    // Get recovery protocol by category from database
    if (event.httpMethod === "GET" && path === "stored") {
      const params = event.queryStringParameters || {};
      const protocols = await getStoredProtocols({ category: params.category });
      return createSuccessResponse(protocols);
    }

    return createErrorResponse("Endpoint not found", 404, "not_found");
  } catch (error) {
    logger.error("recovery_api_error", error, {});
    throw error;
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

const handler = async (event, context) => {
  const isPublicPath = event.path.includes("/protocols");
  if (!isPublicPath) {
    return baseHandler(event, context, {
      functionName: "recovery",
      allowedMethods: ["GET", "POST", "PUT"],
      rateLimitType: "DEFAULT",
      requireAuth: true,
      handler: handleRequest,
    });
  }
  return baseHandler(event, context, {
    functionName: "recovery",
    allowedMethods: ["GET", "POST", "PUT"],
    rateLimitType: "DEFAULT",
    requireAuth: false,
    handler: handleRequest,
  });
};

// ESM exports for use in other modules
export { generateRecoveryRecommendations };

export const testHandler = handler;
export { handler };
