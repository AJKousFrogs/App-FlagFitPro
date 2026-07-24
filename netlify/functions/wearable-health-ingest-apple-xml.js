import { baseHandler } from "./utils/base-handler.js";
import {
  createSuccessResponse,
  createErrorResponse,
} from "./utils/error-handler.js";
import { supabaseAdmin } from "./supabase-client.js";
import { tryParseJsonObjectBody } from "./utils/input-validator.js";
import { parseAppleHealthExport } from "./utils/apple-health-xml.js";
import { ingestWearableReadings } from "./utils/wearable-health-ingest-core.js";

// Netlify Function: Apple Health Manual Export Ingest
// Endpoint: /api/wearable-health-ingest/apple-health-xml   (POST)
//
// Apple Health has no server-to-server API (deliberate Apple privacy design)
// — this is the manual-export path: the athlete exports their data from the
// Health app ("Export All Health Data"), unzips the resulting export.zip
// THEMSELVES (no ZIP-extraction dependency added here), and uploads the raw
// export.xml text. Parsed via utils/apple-health-xml.js (a small,
// dependency-free extractor — the format is simple/stable enough not to
// need a full XML-parsing library) and ingested through the same
// consent-gated core wearable-health-ingest.js and wearables-webhook.js
// share (source: "apple_health", already a seeded provider/consent key).
// See docs/gps_wearable_csv_import_proposal.md §3.

const MAX_XML_BYTES = 5 * 1024 * 1024; // 5MB — a full lifetime export can be
// far larger; a bigger export needs a chunked/background import this single
// request/response cycle doesn't support (a real, flagged, not-built gap).

const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "wearable-health-ingest-apple-xml",
    allowedMethods: ["POST"],
    rateLimitType: "CREATE",
    requireAuth: true,
    handler: async (evt, _ctx, { userId }) => {
      const parsedBody = tryParseJsonObjectBody(evt.body);
      if (!parsedBody.ok) {
        return parsedBody.error;
      }
      const xml = parsedBody.data.xml;

      if (typeof xml !== "string" || xml.trim().length === 0) {
        return createErrorResponse(
          "xml (raw Apple Health export.xml text) is required",
          422,
          "validation_error",
        );
      }

      const xmlBytes = Buffer.byteLength(xml, "utf8");
      if (xmlBytes > MAX_XML_BYTES) {
        return createErrorResponse(
          `xml exceeds the ${MAX_XML_BYTES} byte limit (got ${xmlBytes}) — export a shorter date range from the Health app`,
          422,
          "validation_error",
        );
      }

      const { readings, recordCount, skippedCount, truncated } =
        parseAppleHealthExport(xml);

      if (recordCount === 0) {
        return createErrorResponse(
          "No <Record> elements found — is this a real Apple Health export.xml?",
          422,
          "validation_error",
        );
      }
      if (readings.length === 0) {
        return createErrorResponse(
          `Found ${recordCount} records but none were an importable metric (category types like sleep analysis aren't supported yet)`,
          422,
          "no_importable_readings",
        );
      }

      const result = await ingestWearableReadings(
        supabaseAdmin,
        userId,
        "apple_health",
        readings,
        "Apple Health export",
      );
      if (!result.ok) {
        const status = result.code === "consent_required" ? 403 : 500;
        return createErrorResponse(result.message, status, result.code);
      }

      const data = { ...result.data, recordCount, skippedCount, truncated };
      return createSuccessResponse(
        data,
        200,
        data.partial || truncated
          ? "Import completed with surfaced failures"
          : "Import complete",
      );
    },
  });
};

export const testHandler = handler;
export { handler };
