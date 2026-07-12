/**
 * Team Practice Plan API (coach-facing).
 *
 * Realizes the periodized team-practice block plan for a team + date. The INTENT
 * (framing / minutes / phase / taper daysOut / season phase) is computed by the
 * client's periodization engine — the same COMPOSE split as daily-protocol — and
 * passed in here; this endpoint shapes it into the time-boxed block plan and fills
 * each block with drills from the canonical `exercises` table. It never re-derives
 * the phase/taper (that stays the intent engine's single job).
 *
 * POST /api/team-practice-plan
 *   { teamId, date?, framing, minutes?, phase?, daysOut?, seasonPhase?, perBlock? }
 *
 * See netlify/functions/utils/team-practice-plan.js +
 * docs/ground-truth/team-practice-periodization.md.
 */

import { supabaseAdmin } from "./supabase-client.js";
import { baseHandler } from "./utils/base-handler.js";
import {
  createErrorResponse,
  createSuccessResponse,
  handleValidationError,
} from "./utils/error-handler.js";
import {
  isValidDateString,
  tryParseJsonObjectBody,
} from "./utils/input-validator.js";
import { isStaffOfTeam } from "./utils/team-scope.js";
import {
  buildPracticePlan,
  fetchPlanDrills,
} from "./utils/team-practice-plan.js";
import { createLogger } from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.team-practice-plan" });

const VALID_FRAMINGS = new Set(["own", "sharp", "recovery"]);
// Default total minutes per framing when the client omits one (mirrors the intent
// engine's PRACTICE_PHASE_MODIFIERS minutes: own 90, taper 60, recovery 30).
const DEFAULT_MINUTES = { own: 90, sharp: 60, recovery: 30 };

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "team-practice-plan",
    allowedMethods: ["POST"],
    rateLimitType: "READ",
    requireAuth: true,
    handler: async (evt, _ctx, { userId }) => {
      try {
        const parsed = tryParseJsonObjectBody(evt.body);
        if (!parsed.ok) {
          return parsed.error;
        }
        const {
          teamId,
          date = null,
          framing = "own",
          minutes,
          phase = null,
          daysOut = null,
          seasonPhase = null,
          perBlock = 6,
        } = parsed.data;

        if (typeof teamId !== "string" || teamId.trim().length === 0) {
          return handleValidationError("teamId is required");
        }
        if (date !== null && date !== undefined && !isValidDateString(date)) {
          return handleValidationError("date must be a valid date string");
        }
        if (!VALID_FRAMINGS.has(framing)) {
          return handleValidationError(
            "framing must be one of: own, sharp, recovery",
          );
        }
        if (
          minutes !== undefined &&
          (!Number.isFinite(minutes) || minutes < 10 || minutes > 240)
        ) {
          return handleValidationError("minutes must be between 10 and 240");
        }
        if (
          daysOut !== null &&
          daysOut !== undefined &&
          (!Number.isFinite(daysOut) || daysOut < 0)
        ) {
          return handleValidationError("daysOut must be a non-negative number");
        }
        if (!Number.isInteger(perBlock) || perBlock < 1 || perBlock > 12) {
          return handleValidationError(
            "perBlock must be an integer between 1 and 12",
          );
        }

        // Coach-facing: the requester must be active staff of the team.
        const authorized = await isStaffOfTeam(userId, teamId);
        if (!authorized) {
          return createErrorResponse(
            "You must be staff of this team to build its practice plan.",
            403,
            "forbidden",
          );
        }

        const plan = buildPracticePlan({
          framing,
          minutes: minutes ?? DEFAULT_MINUTES[framing],
          phase,
          daysOut,
          seasonPhase,
        });
        const filled = await fetchPlanDrills(supabaseAdmin, plan, { perBlock });

        return createSuccessResponse({
          teamId,
          date: date ?? new Date().toISOString().split("T")[0],
          ...filled,
        });
      } catch (err) {
        logger.error("team_practice_plan_error", err, {});
        return createErrorResponse(
          "Internal server error",
          500,
          "server_error",
        );
      }
    },
  });

export const testHandler = handler;
export { handler };
