import Papa from "papaparse";
import { baseHandler } from "./utils/base-handler.js";
import {
  createSuccessResponse,
  createErrorResponse,
} from "./utils/error-handler.js";
import { tryParseJsonObjectBody } from "./utils/input-validator.js";
import { runSessionLoadImport } from "./utils/session-load-import-core.js";

// Netlify Function: Session-load Import (CSV)
// Endpoint: /api/session-load-import/csv   (POST)
//
// Turns a vendor CSV export (or a coach's own manually-tracked spreadsheet,
// via provider: "manual") into rows[] and runs it through the exact same
// shared import core session-load-import.js uses (utils/session-load-import-
// core.js) — same adapters, same device<->athlete pairing, same
// callerWritableAthletes() gate, same idempotent upsert. Purely additive:
// POST /api/session-load-import (JSON) keeps working unchanged.
//
// Body: { provider: string, csv: string }. `csv` is raw CSV text in the JSON
// body (not multipart/form-data) — consistent with this codebase's existing
// base64-in-JSON file-upload convention rather than adding a multipart parser.

// A single serverless invocation shouldn't parse an arbitrarily large upload —
// bound both the raw text size and the resulting row count.
const MAX_CSV_BYTES = 2 * 1024 * 1024; // 2MB
const MAX_CSV_ROWS = 5000;

const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "session-load-import-csv",
    allowedMethods: ["POST"],
    rateLimitType: "CREATE",
    requireAuth: true,
    handler: async (evt, _ctx, { userId }) => {
      const parsedBody = tryParseJsonObjectBody(evt.body);
      if (!parsedBody.ok) {
        return parsedBody.error;
      }
      const body = parsedBody.data;
      const provider = String(body.provider ?? "").trim();
      const csv = body.csv;

      if (typeof csv !== "string" || csv.trim().length === 0) {
        return createErrorResponse(
          "csv (raw CSV text) is required",
          422,
          "validation_error",
        );
      }

      const csvBytes = Buffer.byteLength(csv, "utf8");
      if (csvBytes > MAX_CSV_BYTES) {
        return createErrorResponse(
          `csv exceeds the ${MAX_CSV_BYTES} byte limit (got ${csvBytes})`,
          422,
          "validation_error",
        );
      }

      const parsed = Papa.parse(csv, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim(),
      });

      if (!parsed.data || parsed.data.length === 0) {
        return createErrorResponse(
          "csv has no data rows (header row only, or empty)",
          422,
          "validation_error",
        );
      }

      if (parsed.data.length > MAX_CSV_ROWS) {
        return createErrorResponse(
          `csv has ${parsed.data.length} rows, exceeding the ${MAX_CSV_ROWS} row limit`,
          422,
          "validation_error",
        );
      }

      // Row-level CSV parse problems (e.g. a ragged row with too many/few
      // fields) surface alongside adapter-level failures below — never
      // silently dropped.
      const csvErrors = (parsed.errors || []).map((e) => ({
        index: e.row ?? null,
        reason: `CSV parse error: ${e.message}`,
      }));

      const result = await runSessionLoadImport(userId, provider, parsed.data);
      if (!result.ok) {
        const status = result.code === "unsupported_provider" ? 422 : 500;
        return createErrorResponse(result.message, status, result.code);
      }

      const failed = [...csvErrors, ...result.data.failed];
      const data = {
        ...result.data,
        failed,
        failedCount: failed.length,
        partial: failed.length > 0,
      };

      return createSuccessResponse(
        data,
        200,
        data.partial ? "Import completed with surfaced failures" : "Import complete",
      );
    },
  });
};

export const testHandler = handler;
export { handler };
