import { baseHandler } from "./utils/base-handler.js";
import {
  createSuccessResponse,
  createErrorResponse,
} from "./utils/error-handler.js";
import { supabaseAdmin } from "./supabase-client.js";
import { tryParseJsonObjectBody } from "./utils/input-validator.js";
import { sessionWorkload } from "./utils/session-load.js";
import { createLogger } from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.weekend-games" });

/**
 * Weekend-game self-report (drives the Monday plan).
 *
 * On Monday the wellness flow asks "did you play games this weekend, and what
 * format?" (e.g. 2×20 min). We log that as a COMPLETED `competition` training
 * session so it flows into the canonical load pipeline: training_sessions.workload
 * is the ACWR acute-load source, so a heavy game weekend raises acute load → lowers
 * Monday readiness → the daily-protocol engine deloads automatically. No separate
 * "Monday math" — the existing engine does the calculating.
 *
 * Load model (Foster session-RPE): workload(AU) = total_minutes × sRPE.
 * total_minutes = gameCount × halves × minutesPerHalf. Default game sRPE = 8
 * (vigorous intermittent) when the athlete doesn't report one.
 *
 * Idempotent per (user, game date): re-submitting updates the same session rather
 * than stacking duplicate load.
 */

const DEFAULT_GAME_RPE = 8;
const MAX_TOTAL_MINUTES = 600; // a full tournament day; reject obvious garbage above

function toInt(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
}

const handler = async (event, context) =>
  baseHandler(event, context, {
    handler: async (evt, _ctx, meta) => {
      const userId = meta?.userId;
      if (!userId) {
        return createErrorResponse(
          "Authentication required",
          401,
          "auth_required",
        );
      }

      // ── GET: this weekend's logged game (for prefill) ──────────────────────
      if (evt.httpMethod === "GET") {
        const since = new Date(Date.now() - 4 * 86_400_000)
          .toISOString()
          .slice(0, 10);
        const { data, error } = await supabaseAdmin
          .from("training_sessions")
          .select("id, session_date, duration_minutes, rpe, workload, notes")
          .eq("user_id", userId)
          .eq("session_type", "competition")
          .gte("session_date", since)
          .order("session_date", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) {
          logger.error("weekend_games_fetch_failed", error, {});
          return createErrorResponse(
            "Failed to load weekend games",
            500,
            "database_error",
          );
        }
        return createSuccessResponse({ game: data ?? null });
      }

      if (evt.httpMethod !== "POST") {
        return createErrorResponse(
          "Method not allowed",
          405,
          "method_not_allowed",
        );
      }

      let body;
      const parsedBody = tryParseJsonObjectBody(evt.body);
      if (!parsedBody.ok) {
        return parsedBody.error;
      }
      body = parsedBody.data;

      // played:false clears any previously-logged weekend game (athlete corrected
      // themselves) so it stops inflating acute load.
      if (body.played === false) {
        const since = new Date(Date.now() - 4 * 86_400_000)
          .toISOString()
          .slice(0, 10);
        await supabaseAdmin
          .from("training_sessions")
          .delete()
          .eq("user_id", userId)
          .eq("session_type", "competition")
          .gte("session_date", since);
        return createSuccessResponse({ cleared: true });
      }

      const gameCount = toInt(body.gameCount) ?? 1;
      const halves = toInt(body.halves) ?? 2;
      const minutesPerHalf = toInt(body.minutesPerHalf);
      if (
        !minutesPerHalf ||
        minutesPerHalf <= 0 ||
        gameCount <= 0 ||
        halves <= 0
      ) {
        return createErrorResponse(
          "gameCount, halves and minutesPerHalf must be positive numbers",
          422,
          "validation_error",
        );
      }

      let rpe =
        body.avgRpe === null || body.avgRpe === undefined
          ? DEFAULT_GAME_RPE
          : Number(body.avgRpe);
      if (!Number.isFinite(rpe) || rpe < 1 || rpe > 10) {
        return createErrorResponse(
          "avgRpe must be between 1 and 10",
          422,
          "validation_error",
        );
      }

      const totalMinutes = gameCount * halves * minutesPerHalf;
      if (totalMinutes > MAX_TOTAL_MINUTES) {
        return createErrorResponse(
          `Total game minutes (${totalMinutes}) exceeds a plausible weekend`,
          422,
          "validation_error",
        );
      }
      const workload = sessionWorkload(totalMinutes, rpe); // Foster sRPE AU

      // Default the game date to the most recent Saturday (the typical game day);
      // accept an explicit ISO date if provided.
      let gameDate =
        typeof body.date === "string" ? body.date.slice(0, 10) : null;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(gameDate || "")) {
        const d = new Date();
        d.setDate(d.getDate() - ((d.getDay() + 1) % 7)); // back to last Saturday
        gameDate = d.toISOString().slice(0, 10);
      }

      const sessionRow = {
        user_id: userId,
        session_type: "competition",
        session_date: gameDate,
        duration_minutes: totalMinutes,
        rpe,
        workload,
        status: "completed",
        completed_at: new Date().toISOString(),
        title: "Weekend game",
        notes: `Weekend game: ${gameCount}× ${halves}×${minutesPerHalf} min (sRPE ${rpe})`,
      };

      // Idempotent per (user, date): update the existing competition session if one
      // was already logged for this game date, else insert. Avoids double-counting load.
      const { data: existing } = await supabaseAdmin
        .from("training_sessions")
        .select("id")
        .eq("user_id", userId)
        .eq("session_type", "competition")
        .eq("session_date", gameDate)
        .limit(1)
        .maybeSingle();

      let result;
      if (existing?.id) {
        result = await supabaseAdmin
          .from("training_sessions")
          .update(sessionRow)
          .eq("id", existing.id)
          .select("id")
          .single();
      } else {
        result = await supabaseAdmin
          .from("training_sessions")
          .insert(sessionRow)
          .select("id")
          .single();
      }
      if (result.error) {
        logger.error("weekend_games_log_failed", result.error, {});
        return createErrorResponse(
          "Failed to log weekend game",
          500,
          "database_error",
        );
      }

      logger.info("weekend_game_logged", { gameDate, totalMinutes, workload });
      return createSuccessResponse(
        { sessionId: result.data.id, totalMinutes, workload, gameDate },
        201,
        "Weekend game logged — your Monday plan will adjust to the load.",
      );
    },
  });

export const testHandler = handler;
export { handler };
