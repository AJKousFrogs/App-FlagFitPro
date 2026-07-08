import { createErrorResponse } from "./error-handler.js";

/**
 * Maps the two request-shape errors that many handlers' catch blocks translate
 * identically — a body that failed JSON parsing (`error.code === "invalid_json"`
 * → 400) and the parseBoundedInt / object-body validation throws (message
 * includes "must be an integer between" or "Request body must be an object" →
 * 422). Returns the ready error Response, or null if `error` is neither (so the
 * caller falls through to its own function-specific logging + 500).
 *
 * Extracted 2026-07-08 (reuse audit R3) from byte-identical catch chains. New
 * handlers should call this first; existing ones can adopt it incrementally
 * (the block still lives inline in a few functions whose surrounding catch
 * structure differs enough to warrant per-file care).
 */
export function mapKnownHandlerError(error, requestId) {
  if (error?.code === "invalid_json") {
    return createErrorResponse(
      "Invalid JSON in request body",
      400,
      "invalid_json",
      requestId,
    );
  }
  if (
    error?.message?.includes("must be an integer between") ||
    error?.message?.includes("Request body must be an object")
  ) {
    return createErrorResponse(
      error.message,
      422,
      "validation_error",
      requestId,
    );
  }
  return null;
}
