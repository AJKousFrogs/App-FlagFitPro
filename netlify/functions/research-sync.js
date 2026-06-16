import { baseHandler } from "./utils/base-handler.js";
import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";
import { tryParseJsonObjectBody } from "./utils/input-validator.js";

export const handler = async (event, context) =>
  baseHandler(event, context, {
    handler: async (evt, _ctx, _meta) => {
      if (evt.httpMethod === "POST") {
        const parsed = tryParseJsonObjectBody(evt.body);
        if (!parsed.ok) {
          return parsed.error;
        }
        // Research sync not yet implemented — stub returns success
        return createSuccessResponse({ synced: true });
      }

      return createErrorResponse("Method not allowed", 405, "method_not_allowed");
    },
  });
