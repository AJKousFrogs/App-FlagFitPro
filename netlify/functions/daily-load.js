import { supabaseAdmin } from "./supabase-client.js";
import { baseHandler } from "./utils/base-handler.js";
import { successObjectResponse } from "./utils/response-helper.js";
import { createErrorResponse } from "./utils/error-handler.js";
import { computeSessionLoad } from "./utils/acwr.js";
import { getEntitlement, historyCutoffISO } from "./utils/entitlements.js";
import { createLogger } from "./utils/structured-logger.js";
import { fetchPastGameLoads } from "./utils/game-load-estimator.js";

// Netlify Function: Daily Training Load
// Endpoint: /api/daily-load
//
// The athlete's OWN daily internal-load (session-RPE AU) series for a rolling
// window, for the load-calendar heatmap. Self only — the caller's userId is the
// athlete; a coach viewing another athlete would need the consent path (see
// SOURCE_OF_TRUTH §6 "coach athlete-detail trend parity"), which this is not.
//
// Load is the CANONICAL `computeSessionLoad` (utils/acwr.js) summed by calendar
// day — the AU formula is never re-derived here or on the client (§4).
// 2026-07-25: past-game estimated load is now folded in via the same
// `fetchPastGameLoads` (utils/game-load-estimator.js) calc-readiness.js uses for
// ACWR — single source of truth (§4) — so the calendar and the athlete's ACWR
// can no longer silently disagree about the same week (docs/SOURCE_OF_TRUTH.md
// §4a). Per calendar day: MAX(logged session load, game estimate) — mirrors
// calc-readiness.js exactly; a day with real logged load never gets diluted by
// a lower estimate, and a game day with no separately-logged session still
// shows its estimated load instead of reading as a rest day.

const logger = createLogger({ service: "netlify.daily-load" });
const WINDOW_DAYS = 35; // 5 weeks — a full calendar grid

/**
 * Sum canonical session load (session-RPE AU) by calendar day. Pure — the AU
 * formula lives once in `computeSessionLoad`; this only aggregates + sorts.
 * `gameLoadsByDay` (optional) is folded in as MAX(session, game) per day —
 * the same safe-direction rule calc-readiness.js applies.
 */
function aggregateDailyLoad(sessions, gameLoadsByDay) {
  const byDay = new Map();
  for (const s of sessions ?? []) {
    if (!s?.session_date) {
      continue;
    }
    const load = computeSessionLoad(s);
    if (load <= 0) {
      continue;
    }
    byDay.set(s.session_date, (byDay.get(s.session_date) || 0) + load);
  }
  if (gameLoadsByDay) {
    for (const [date, gameLoad] of gameLoadsByDay) {
      byDay.set(date, Math.max(byDay.get(date) || 0, gameLoad));
    }
  }
  return [...byDay.entries()]
    .map(([date, load]) => ({ date, load: Math.round(load * 100) / 100 }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "daily-load",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: true,
    handler: async (_event, _context, { userId }) => {
      try {
        const entitlement = await getEntitlement(userId, {
          client: supabaseAdmin,
        });
        if (entitlement.locked) {
          return createErrorResponse(
            "Your trial has ended — subscribe to keep using FlagFit Pro",
            402,
            "subscription_required",
          );
        }
        const entitlementCutoff = historyCutoffISO(entitlement);

        const end = new Date();
        const start = new Date(end);
        start.setDate(start.getDate() - (WINDOW_DAYS - 1));
        let startKey = start.toISOString().slice(0, 10);
        const endKey = end.toISOString().slice(0, 10);

        // The entitlement's history floor applies here too, for whichever
        // tier caps historyDays below the 35-day window (see
        // utils/entitlements.js) — an unlocked trial/paid user is unaffected
        // (historyDays: null = unlimited).
        if (entitlementCutoff) {
          const cutoffKey = entitlementCutoff.slice(0, 10);
          if (cutoffKey > startKey) {
            startKey = cutoffKey;
          }
        }

        const { data: sessions, error } = await supabaseAdmin
          .from("training_sessions")
          .select("session_date, workload, rpe, duration_minutes")
          .eq("user_id", userId)
          .gte("session_date", startKey)
          .lte("session_date", endKey);
        if (error) {
          logger.error("daily_load_fetch_failed", { error: error.message });
          return createErrorResponse(
            "Could not load daily training load",
            500,
            "database_error",
          );
        }

        // Fails safe to an empty map if the schedule spine is unavailable —
        // never blocks the calendar on a schedule-read failure.
        const gameLoadsByDay = await fetchPastGameLoads(
          userId,
          startKey,
          endKey,
        );

        const series = aggregateDailyLoad(sessions, gameLoadsByDay);
        const maxLoad = series.reduce((m, p) => Math.max(m, p.load), 0);

        return successObjectResponse({
          series,
          maxLoad,
          startDate: startKey,
          endDate: endKey,
          days: WINDOW_DAYS,
        });
      } catch (err) {
        logger.error("daily_load_unexpected_error", err, {});
        return createErrorResponse(
          "Could not load daily training load",
          500,
          "server_error",
        );
      }
    },
  });
};

export { handler };
export const __test__ = { aggregateDailyLoad };
