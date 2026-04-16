import { baseHandler } from "./utils/base-handler.js";
import { createErrorResponse, createSuccessResponse } from "./utils/error-handler.js";
import { parseJsonObjectBody } from "./utils/input-validator.js";
import { buildRequestLogContext, createLogger } from "./utils/structured-logger.js";

const DEFAULT_DEVICES = [
  { id: "garmin", name: "Garmin", connected: false },
  { id: "polar", name: "Polar", connected: false },
  { id: "whoop", name: "WHOOP", connected: false },
  { id: "catapult", name: "Catapult", connected: false },
];

function getSubPath(path) {
  if (path.includes("/api/wearables/status")) {
    return "/wearables/status";
  }
  if (path.includes("/api/import/fetch-url")) {
    return "/import/fetch-url";
  }
  if (path.includes("/api/import/process")) {
    return "/import/process";
  }
  return "";
}

function buildMappedRow(row, mappings) {
  const mapped = {};
  for (const mapping of mappings || []) {
    if (!mapping?.fileField || !mapping?.mapsTo || mapping.mapsTo === "skip") {
      continue;
    }
    mapped[mapping.mapsTo] = row?.[mapping.fileField];
  }
  return mapped;
}

function normalizeDuration(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 45;
}

function normalizeRpe(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 10 ? parsed : 5;
}

async function persistMappedRows(supabase, userId, rows, mappings) {
  let imported = 0;
  const warnings = [];

  for (const rawRow of rows) {
    const row = buildMappedRow(rawRow, mappings);
    const duration = normalizeDuration(row.duration);
    const rpe = normalizeRpe(row.rpe);
    const sessionDate = `${row.date || ""}`.trim() || new Date().toISOString().split("T")[0];
    const sessionType = `${row.trainingType || "imported_session"}`.trim();
    const workload = Math.round(duration * rpe);

    const result = await supabase.rpc("log_training_session", {
      p_user_id: userId,
      p_session_date: sessionDate,
      p_session_type: sessionType,
      p_duration_minutes: duration,
      p_session_load: workload,
      p_status: "completed",
      p_notes: typeof row.notes === "string" ? row.notes : null,
      p_source: "manual_import",
    });

    if (result.error) {
      warnings.push(`Skipped row for ${sessionDate}: ${result.error.message}`);
      continue;
    }

    imported += 1;
  }

  return { imported, warnings };
}

const logger = createLogger({ service: "netlify.data-import" });

function createRequestLogger(event, meta = {}) {
  return logger.child(
    buildRequestLogContext(event, {
      request_id: meta.requestId,
      correlation_id: meta.correlationId,
      trace_id: meta.traceId ?? meta.correlationId,
    }),
  );
}

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "data-import",
    allowedMethods: ["GET", "POST"],
    rateLimitType: "UPDATE",
    requireAuth: true,
    handler: async (evt, _ctx, { userId, supabase, requestId, correlationId }) => {
      const requestLogger = createRequestLogger(evt, {
        requestId,
        correlationId,
      });
      const subPath = getSubPath(evt.path || "");

      try {
        if (evt.httpMethod === "GET" && subPath === "/wearables/status") {
          return createSuccessResponse({
            devices: DEFAULT_DEVICES.map((device) => ({
              ...device,
              lastSync: null,
            })),
          });
        }

        const body = parseJsonObjectBody(evt.body);

        if (evt.httpMethod === "POST" && subPath === "/import/fetch-url") {
          let parsedUrl;
          try {
            parsedUrl = new URL(body.url);
          } catch {
            return createErrorResponse("url must be a valid URL", 422, "validation_error");
          }

          return createSuccessResponse({
            accepted: true,
            source: parsedUrl.hostname,
            url: parsedUrl.toString(),
          });
        }

        if (evt.httpMethod === "POST" && subPath === "/import/process") {
          const rows = Array.isArray(body.data) ? body.data : [];
          const mappings = Array.isArray(body.mappings) ? body.mappings : [];
          const persisted = await persistMappedRows(supabase, userId, rows, mappings);

          return createSuccessResponse({
            success: true,
            message: `${persisted.imported} item(s) imported successfully`,
            itemsImported: persisted.imported,
            warnings: persisted.warnings,
            nextSteps: [
              "Imported sessions now contribute to ACWR and readiness calculations",
              "Training Metrics and Load Management use the imported workload",
            ],
          });
        }

        return createErrorResponse("Endpoint not found", 404, "not_found");
      } catch (error) {
        requestLogger.error("data_import_request_failed", error, {
          path: subPath,
          method: evt.httpMethod,
          user_id: userId,
        });
        return createErrorResponse(
          error?.message || "Failed to process data import request",
          500,
          "server_error",
        );
      }
    },
  });

export const testHandler = handler;
export { handler };
