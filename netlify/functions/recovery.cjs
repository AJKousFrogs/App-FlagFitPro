// Netlify Function: Recovery API
// Handles recovery metrics, protocols, sessions, and insights

const { baseHandler } = require("./utils/base-handler.cjs");
const {
  createSuccessResponse,
  createErrorResponse,
} = require("./utils/error-handler.cjs");
const { supabaseAdmin } = require("./supabase-client.cjs");

/**
 * Get user's current recovery metrics
 */
async function getRecoveryMetrics(userId) {
  try {
    // Get recent training sessions to calculate recovery needs
    const { data: sessions } = await supabaseAdmin
      .from("training_sessions")
      .select("session_date, duration_minutes, intensity_level, completed_at")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })
      .limit(7);

    // Get wellness data if available
    const { data: wellness } = await supabaseAdmin
      .from("wellness_logs")
      .select("sleep_hours, stress_level, fatigue_level, timestamp")
      .eq("user_id", userId)
      .order("timestamp", { ascending: false })
      .limit(7)
      .single();

    // Calculate recovery score (0-100)
    let recoveryScore = 75; // Default

    if (wellness) {
      const sleepScore = Math.min(100, ((wellness.sleep_hours || 7) / 8) * 100);
      const stressScore = 100 - ((wellness.stress_level || 5) / 10) * 100;
      const fatigueScore = 100 - ((wellness.fatigue_level || 5) / 10) * 100;

      recoveryScore = Math.round((sleepScore + stressScore + fatigueScore) / 3);
    }

    // Check training load
    const recentLoad = (sessions || []).reduce((sum, s) => {
      return (
        sum +
        (s.duration_minutes || 0) *
          (s.intensity_level === "high"
            ? 1.5
            : s.intensity_level === "medium"
              ? 1
              : 0.5)
      );
    }, 0);

    const needsRecovery = recentLoad > 300; // High load threshold

    return {
      recoveryScore,
      sleepHours: wellness?.sleep_hours || 7,
      stressLevel: wellness?.stress_level || 5,
      fatigueLevel: wellness?.fatigue_level || 5,
      recentTrainingLoad: Math.round(recentLoad),
      needsRecovery,
      lastUpdated: wellness?.timestamp || new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error getting recovery metrics:", error);
    // Return default metrics
    return {
      recoveryScore: 75,
      sleepHours: 7,
      stressLevel: 5,
      fatigueLevel: 5,
      recentTrainingLoad: 0,
      needsRecovery: false,
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Get recommended recovery protocols
 */
async function getRecoveryProtocols(userId) {
  const metrics = await getRecoveryMetrics(userId);

  const protocols = [
    {
      id: "active-recovery",
      name: "Active Recovery",
      description: "Light movement to promote blood flow and reduce soreness",
      duration: 30,
      type: "movement",
      suitable: metrics.recoveryScore >= 60,
      benefits: [
        "Reduces muscle soreness",
        "Improves circulation",
        "Maintains mobility",
      ],
    },
    {
      id: "foam-rolling",
      name: "Foam Rolling",
      description: "Self-myofascial release to improve tissue quality",
      duration: 20,
      type: "manual-therapy",
      suitable: metrics.fatigueLevel >= 6,
      benefits: [
        "Reduces muscle tension",
        "Improves flexibility",
        "Decreases soreness",
      ],
    },
    {
      id: "stretching",
      name: "Static Stretching",
      description: "Gentle stretching to improve flexibility and relaxation",
      duration: 15,
      type: "flexibility",
      suitable: true,
      benefits: [
        "Improves flexibility",
        "Reduces tension",
        "Promotes relaxation",
      ],
    },
    {
      id: "ice-bath",
      name: "Cold Therapy",
      description: "Cold water immersion to reduce inflammation",
      duration: 10,
      type: "cryotherapy",
      suitable: metrics.recentTrainingLoad > 300,
      benefits: [
        "Reduces inflammation",
        "Speeds recovery",
        "Decreases soreness",
      ],
    },
    {
      id: "meditation",
      name: "Meditation & Breathing",
      description: "Mindfulness practice to reduce stress and improve recovery",
      duration: 15,
      type: "mental-recovery",
      suitable: metrics.stressLevel >= 6,
      benefits: ["Reduces stress", "Improves sleep", "Enhances focus"],
    },
    {
      id: "sleep-optimization",
      name: "Sleep Optimization",
      description: "Guidelines for improving sleep quality",
      duration: 0, // Ongoing
      type: "lifestyle",
      suitable: metrics.sleepHours < 7,
      benefits: [
        "Improves recovery",
        "Enhances performance",
        "Reduces fatigue",
      ],
    },
  ];

  // Filter and prioritize based on user metrics
  return protocols
    .filter((p) => p.suitable)
    .sort((a, _b) => {
      // Prioritize protocols that address current needs
      if (metrics.needsRecovery && a.type === "cryotherapy") {
        return -1;
      }
      if (metrics.stressLevel >= 6 && a.type === "mental-recovery") {
        return -1;
      }
      return 0;
    });
}

/**
 * Start a recovery session
 */
async function startRecoverySession(userId, protocolId) {
  try {
    const { data, error } = await supabaseAdmin
      .from("recovery_sessions")
      .insert({
        user_id: userId,
        protocol_id: protocolId,
        start_time: new Date().toISOString(),
        status: "in_progress",
      })
      .select()
      .single();

    if (error) {
      console.error("Error starting recovery session:", error);
      return null;
    }

    return {
      id: data.id,
      protocolId: protocolId,
      startTime: new Date(data.start_time),
      status: "in_progress",
    };
  } catch (error) {
    console.error("Error in startRecoverySession:", error);
    return null;
  }
}

/**
 * Complete current recovery session
 */
async function completeRecoverySession(userId) {
  try {
    // Find active session
    const { data: activeSession } = await supabaseAdmin
      .from("recovery_sessions")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "in_progress")
      .order("start_time", { ascending: false })
      .limit(1)
      .single();

    if (!activeSession) {
      return false;
    }

    const { error } = await supabaseAdmin
      .from("recovery_sessions")
      .update({
        status: "completed",
        end_time: new Date().toISOString(),
      })
      .eq("id", activeSession.id);

    return !error;
  } catch (error) {
    console.error("Error completing recovery session:", error);
    return false;
  }
}

/**
 * Stop current recovery session
 */
async function stopRecoverySession(userId) {
  try {
    const { data: activeSession } = await supabaseAdmin
      .from("recovery_sessions")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "in_progress")
      .order("start_time", { ascending: false })
      .limit(1)
      .single();

    if (!activeSession) {
      return false;
    }

    const { error } = await supabaseAdmin
      .from("recovery_sessions")
      .update({
        status: "stopped",
        end_time: new Date().toISOString(),
      })
      .eq("id", activeSession.id);

    return !error;
  } catch (error) {
    console.error("Error stopping recovery session:", error);
    return false;
  }
}

/**
 * Get research insights about recovery
 */
async function getResearchInsights() {
  // Return research-based insights
  return [
    {
      title: "Sleep Quality Matters",
      summary:
        "Research shows that 7-9 hours of quality sleep is crucial for recovery and performance.",
      source: "Journal of Sports Sciences",
      relevance: "high",
    },
    {
      title: "Active Recovery Benefits",
      summary:
        "Light exercise on rest days can improve recovery more than complete rest.",
      source: "Sports Medicine Research",
      relevance: "medium",
    },
    {
      title: "Cold Therapy Timing",
      summary:
        "Cold water immersion is most effective when done within 1 hour post-workout.",
      source: "Recovery Science Review",
      relevance: "medium",
    },
    {
      title: "Stress and Recovery",
      summary:
        "High stress levels can significantly impair recovery, even with adequate sleep.",
      source: "Exercise Physiology Journal",
      relevance: "high",
    },
  ];
}

/**
 * Get weekly recovery trends
 */
async function getWeeklyRecoveryTrends(userId) {
  try {
    const { data: wellness } = await supabaseAdmin
      .from("wellness_logs")
      .select("recovery_score, timestamp")
      .eq("user_id", userId)
      .order("timestamp", { ascending: false })
      .limit(7);

    if (wellness && wellness.length > 0) {
      return wellness.map((w) => w.recovery_score || 75).reverse();
    }

    // Return default trend if no data
    return [75, 78, 72, 85, 80, 77, 82];
  } catch (error) {
    console.error("Error getting recovery trends:", error);
    return [75, 78, 72, 85, 80, 77, 82];
  }
}

/**
 * Get protocol effectiveness data
 */
async function getProtocolEffectiveness(userId) {
  try {
    const { data: sessions } = await supabaseAdmin
      .from("recovery_sessions")
      .select("protocol_id, status, user_feedback")
      .eq("user_id", userId)
      .eq("status", "completed");

    // Calculate effectiveness by protocol
    const effectiveness = {};

    (sessions || []).forEach((session) => {
      const protocolId = session.protocol_id || "unknown";
      if (!effectiveness[protocolId]) {
        effectiveness[protocolId] = { count: 0, totalFeedback: 0 };
      }
      effectiveness[protocolId].count++;
      if (session.user_feedback) {
        effectiveness[protocolId].totalFeedback += session.user_feedback;
      }
    });

    // Convert to percentages
    const result = {};
    Object.keys(effectiveness).forEach((protocolId) => {
      const data = effectiveness[protocolId];
      result[protocolId] =
        data.count > 0
          ? Math.round((data.totalFeedback / data.count) * 10)
          : 75; // Default effectiveness
    });

    return result;
  } catch (error) {
    console.error("Error getting protocol effectiveness:", error);
    return {};
  }
}

/**
 * Main handler function
 */
async function handleRequest(event, context, { userId }) {
  const { path, httpMethod, queryStringParameters, body } = event;

  // Extract endpoint from path
  let endpoint = null;

  // Method 1: Check if path contains /api/recovery/ (original path preserved)
  const apiRecoveryMatch = path.match(/\/api\/recovery\/([^\/\?]+)/);
  if (apiRecoveryMatch) {
    endpoint = apiRecoveryMatch[1];
  }

  // Method 2: Extract from path segments if recovery is in path
  if (!endpoint) {
    const pathSegments = path.split("/").filter(Boolean);
    const recoveryIndex = pathSegments.indexOf("recovery");
    if (recoveryIndex >= 0 && pathSegments.length > recoveryIndex + 1) {
      endpoint = pathSegments[recoveryIndex + 1];
    }
  }

  // Method 3: Use query parameter as fallback
  if (!endpoint) {
    endpoint = queryStringParameters?.endpoint || null;
  }

  try {
    let requestBody = {};
    if (body) {
      try {
        requestBody = JSON.parse(body);
      } catch (_e) {
        // Body might not be JSON
      }
    }

    switch (endpoint) {
      case "metrics":
        if (httpMethod !== "GET") {
          return createErrorResponse("Method not allowed", 405);
        }
        const metrics = await getRecoveryMetrics(userId);
        return createSuccessResponse(metrics);

      case "protocols":
        if (httpMethod !== "GET") {
          return createErrorResponse("Method not allowed", 405);
        }
        const protocols = await getRecoveryProtocols(userId);
        return createSuccessResponse(protocols);

      case "start-session":
        if (httpMethod !== "POST") {
          return createErrorResponse("Method not allowed", 405);
        }
        const session = await startRecoverySession(
          userId,
          requestBody.protocolId,
        );
        return createSuccessResponse(session);

      case "complete-session":
        if (httpMethod !== "POST") {
          return createErrorResponse("Method not allowed", 405);
        }
        const completed = await completeRecoverySession(userId);
        return createSuccessResponse(completed);

      case "stop-session":
        if (httpMethod !== "POST") {
          return createErrorResponse("Method not allowed", 405);
        }
        const stopped = await stopRecoverySession(userId);
        return createSuccessResponse(stopped);

      case "research-insights":
        if (httpMethod !== "GET") {
          return createErrorResponse("Method not allowed", 405);
        }
        const insights = await getResearchInsights();
        return createSuccessResponse(insights);

      case "weekly-trends":
        if (httpMethod !== "GET") {
          return createErrorResponse("Method not allowed", 405);
        }
        const trends = await getWeeklyRecoveryTrends(userId);
        return createSuccessResponse(trends);

      case "protocol-effectiveness":
        if (httpMethod !== "GET") {
          return createErrorResponse("Method not allowed", 405);
        }
        const effectiveness = await getProtocolEffectiveness(userId);
        return createSuccessResponse(effectiveness);

      default:
        return createErrorResponse(`Endpoint not found: ${endpoint}`, 404);
    }
  } catch (error) {
    console.error("Error in recovery handler:", error);
    throw error;
  }
}

exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "Recovery",
    allowedMethods: ["GET", "POST"],
    rateLimitType: "READ",
    requireAuth: true,
    handler: handleRequest,
  });
};
