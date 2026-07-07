import { supabaseAdmin } from "./supabase-client.js";
import { baseHandler } from "./utils/base-handler.js";
import {
  createSuccessResponse,
  createErrorResponse,
} from "./utils/error-handler.js";
import { tryParseJsonObjectBody, isValidId } from "./utils/input-validator.js";
import { createLogger } from "./utils/structured-logger.js";

// Netlify Function: Event Availability (RSVP)
// The PLAN side of the plan-vs-actuals model: an athlete declares whether they
// will attend a competition_event. Saved to event_availability via the
// set_event_availability RPC (auth + team-membership enforced in the DB).
//
//   GET  /api/event-availability   → the athlete's availability for their events
//   POST /api/event-availability   → set/update RSVP { competitionEventId, status, reason? }
// Endpoint base: /api/event-availability

const logger = createLogger({ service: "netlify.event-availability" });

const VALID_STATUSES = [
  "available",
  "unavailable",
  "maybe",
  "tentative",
  "confirmed",
  "declined",
];

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "event-availability",
    allowedMethods: ["GET", "POST"],
    rateLimitType: "DEFAULT",
    requireAuth: true,
    handler: async (evt, _ctx, { userId, requestId }) => {
      // ── GET: the athlete's current availability rows ────────────────────────
      if (evt.httpMethod === "GET") {
        const { data, error } = await supabaseAdmin
          .from("event_availability")
          .select(
            "competition_event_id, team_id, status, reason, responded_at, " +
              "competition_events(label, starts_at, ends_at, expected_game_count, competitions(name))",
          )
          .eq("user_id", userId)
          .order("responded_at", { ascending: false });

        if (error) {
          logger.error("event_availability_list_failed", error, {
            request_id: requestId,
            user_id: userId,
          });
          return createErrorResponse(
            "Failed to load availability",
            500,
            "database_error",
            requestId,
          );
        }
        return createSuccessResponse({ availability: data || [] });
      }

      // ── POST: set/update RSVP ───────────────────────────────────────────────
      let body;
      const parsedBody = tryParseJsonObjectBody(evt.body, { requestId });
      if (!parsedBody.ok) {
        return parsedBody.error;
      }
      body = parsedBody.data;

      const competitionEventId =
        body.competitionEventId || body.competition_event_id;
      if (!isValidId(competitionEventId)) {
        return createErrorResponse(
          "competitionEventId is required",
          422,
          "validation_error",
          requestId,
        );
      }

      const status = String(body.status || "").trim();
      if (!VALID_STATUSES.includes(status)) {
        return createErrorResponse(
          `status must be one of: ${VALID_STATUSES.join(", ")}`,
          422,
          "validation_error",
          requestId,
        );
      }

      const reason =
        typeof body.reason === "string" ? body.reason.slice(0, 1000) : null;

      const { data, error } = await supabaseAdmin.rpc(
        "set_event_availability",
        {
          p_competition_event_id: competitionEventId,
          p_status: status,
          p_reason: reason,
        },
      );

      if (error) {
        const isAuthz = /member of this event|authentication required/i.test(
          error.message,
        );
        const notFound = /event not found/i.test(error.message);
        logger.error("event_availability_set_failed", error, {
          request_id: requestId,
          user_id: userId,
        });
        if (notFound) {
          return createErrorResponse(
            "Competition event not found",
            404,
            "not_found",
            requestId,
          );
        }
        return createErrorResponse(
          isAuthz
            ? "Not authorized to set availability for this event"
            : "Failed to set availability",
          isAuthz ? 403 : 500,
          isAuthz ? "authorization_error" : "database_error",
          requestId,
        );
      }

      return createSuccessResponse(
        { availability: data },
        200,
        "Availability saved",
      );
    },
  });

export const testHandler = handler;
export { handler };
