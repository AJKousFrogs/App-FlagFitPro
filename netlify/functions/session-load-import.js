import { baseHandler } from "./utils/base-handler.js";
import {
  createSuccessResponse,
  createErrorResponse,
} from "./utils/error-handler.js";
import { tryParseJsonObjectBody } from "./utils/input-validator.js";
import { runSessionLoadImport } from "./utils/session-load-import-core.js";

// Netlify Function: Session-load Import (JSON)
// Endpoint: /api/session-load-import   (POST)
//
// Accepts a provider export { provider, rows[] } as a JSON body and runs it
// through the shared import core (utils/session-load-import-core.js) — same
// adapters, same device<->athlete pairing, same callerWritableAthletes()
// gate, same idempotent upsert as the CSV entry point
// (session-load-import-csv.js). Every failed/partial row is surfaced in
// `failed[]` — the import never silently advances.

const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "session-load-import",
    allowedMethods: ["POST"],
    rateLimitType: "CREATE",
    requireAuth: true,
    handler: async (evt, _ctx, { userId }) => {
      let body;
      const parsedBody = tryParseJsonObjectBody(evt.body);
      if (!parsedBody.ok) {
        return parsedBody.error;
      }
      body = parsedBody.data;
      const provider = String(body.provider ?? "").trim();
      const rows = Array.isArray(body.rows) ? body.rows : null;
      if (!rows) {
        return createErrorResponse(
          "rows[] is required",
          422,
          "validation_error",
        );
      }

      const result = await runSessionLoadImport(userId, provider, rows);
      if (!result.ok) {
        const status = result.code === "unsupported_provider" ? 422 : 500;
        return createErrorResponse(result.message, status, result.code);
      }

      return createSuccessResponse(
        result.data,
        200,
        result.data.partial
          ? "Import completed with surfaced failures"
          : "Import complete",
      );
    },
  });
};

export const testHandler = handler;
export { handler };
