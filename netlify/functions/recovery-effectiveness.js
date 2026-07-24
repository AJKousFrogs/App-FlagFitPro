import { getSupabaseClient } from "./utils/auth-helper.js";
import {
  createSuccessResponse,
  createErrorResponse,
  handleValidationError,
} from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";
import { tryParseJsonObjectBody } from "./utils/input-validator.js";
import {
  buildRequestLogContext,
  createLogger,
} from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.recovery-effectiveness" });

/**
 * Recovery Modality Effectiveness Endpoints
 * - GET /api/recovery-effectiveness?timeframe=4-week: Fetch modality effectiveness
 * - POST /api/recovery-effectiveness: Log recovery session
 *
 * Tracks athlete-specific effectiveness of recovery modalities (sleep, massage, etc.)
 * Helps personalize recovery protocols based on actual data.
 */

async function getRecoveryEffectiveness(
  supabase,
  athleteId,
  timeframe,
  requestLogger
) {
  try {
    const daysBack = timeframe === "1-week" ? 7 : timeframe === "2-week" ? 14 : 28;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const { data: logs, error: logsError } = await supabase
      .from("recovery_logs")
      .select(
        "modality_name, effectiveness_score, domain, created_at"
      )
      .eq("athlete_id", athleteId)
      .gte("created_at", cutoffDate.toISOString())
      .order("created_at", { ascending: false });

    if (logsError) {
      requestLogger.error("DB error fetching recovery logs", {
        code: logsError.code,
      });
      return createErrorResponse("Failed to fetch recovery data", 500);
    }

    // Aggregate modality effectiveness
    const modalityMap = {};
    const domainMap = {};

    (logs || []).forEach((log) => {
      const modality = log.modality_name;
      const score = log.effectiveness_score || 0;
      const domain = log.domain || "general";

      if (!modalityMap[modality]) {
        modalityMap[modality] = {
          modality_name: modality,
          usage_count: 0,
          scores: [],
          avg_effectiveness: 0,
        };
      }
      modalityMap[modality].usage_count += 1;
      modalityMap[modality].scores.push(score);

      if (!domainMap[domain]) {
        domainMap[domain] = {
          domain,
          modalities: {},
          avg_score: 0,
        };
      }
      if (!domainMap[domain].modalities[modality]) {
        domainMap[domain].modalities[modality] = [];
      }
      domainMap[domain].modalities[modality].push(score);
    });

    // Calculate averages and trends
    const modalities = Object.values(modalityMap).map((m) => {
      const avg =
        m.scores.length > 0
          ? Math.round(
              (m.scores.reduce((a, b) => a + b, 0) / m.scores.length) * 100
            ) / 100
          : 0;
      return {
        modality_name: m.modality_name,
        usage_count: m.usage_count,
        avg_effectiveness: avg,
        trend: m.scores.length > 1
          ? m.scores[0] > m.scores[Math.floor(m.scores.length / 2)] ? 1 : -1
          : 0,
      };
    });

    const domains = Object.values(domainMap).map((d) => {
      const topModality = Object.entries(d.modalities)
        .map(([name, scores]) => ({
          name,
          avg: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100,
        }))
        .sort((a, b) => b.avg - a.avg)[0];

      return {
        domain: d.domain,
        top_modality: topModality?.name || "N/A",
        avg_score: topModality?.avg || 0,
        trend: topModality?.avg >= 7 ? "improving" : "stable",
      };
    });

    return createSuccessResponse({
      success: true,
      timeframe,
      modalities: modalities.sort((a, b) => b.avg_effectiveness - a.avg_effectiveness),
      domains,
      count: logs?.length || 0,
    });
  } catch (err) {
    requestLogger.error("Unexpected error in getRecoveryEffectiveness", {
      error: err.message,
    });
    return createErrorResponse("Internal server error", 500);
  }
}

async function logRecoverySession(
  supabase,
  athleteId,
  payload,
  requestLogger
) {
  try {
    const { modality_name, effectiveness_1_10, domain, log_date } = payload;

    if (!modality_name || effectiveness_1_10 === undefined) {
      return handleValidationError("modality_name and effectiveness_1_10 required");
    }

    const { error: insertError } = await supabase
      .from("recovery_logs")
      .insert([
        {
          athlete_id: athleteId,
          modality_name,
          effectiveness_score: effectiveness_1_10,
          domain: domain || "general",
          created_at: log_date || new Date().toISOString(),
        },
      ]);

    if (insertError) {
      requestLogger.error("DB error inserting recovery log", {
        code: insertError.code,
      });
      return createErrorResponse("Failed to log recovery session", 500);
    }

    return createSuccessResponse({
      success: true,
      message: "Recovery session logged successfully",
    });
  } catch (err) {
    requestLogger.error("Unexpected error in logRecoverySession", {
      error: err.message,
    });
    return createErrorResponse("Internal server error", 500);
  }
}

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "recovery-effectiveness",
    allowedMethods: ["GET", "POST"],
    rateLimitType: event.httpMethod === "GET" ? "READ" : "CREATE",
    requireAuth: true,
    handler: async (event, _context, { userId }) => {
      const requestLogger = logger.child(buildRequestLogContext(event));
      const supabase = getSupabaseClient();

      if (event.httpMethod === "GET") {
        const queryString = event.rawQueryString || "";
        const params = new URLSearchParams(queryString);
        const timeframe = params.get("timeframe") || "4-week";

        return getRecoveryEffectiveness(
          supabase,
          userId,
          timeframe,
          requestLogger
        );
      }

      if (event.httpMethod === "POST") {
        const parsedBody = tryParseJsonObjectBody(event.body);
        if (!parsedBody.ok) {
          return parsedBody.error;
        }
        return logRecoverySession(
          supabase,
          userId,
          parsedBody.data,
          requestLogger
        );
      }

      return createErrorResponse("Method not allowed", 405);
    },
  });

export { handler };
