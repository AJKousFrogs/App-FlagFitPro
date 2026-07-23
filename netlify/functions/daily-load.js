import { supabaseAdmin } from "./supabase-client.js";
import { baseHandler } from "./utils/base-handler.js";
import { successObjectResponse } from "./utils/response-helper.js";
import { createErrorResponse } from "./utils/error-handler.js";
import { computeSessionLoad } from "./utils/acwr.js";
import { getEntitlement, historyCutoffISO } from "./utils/entitlements.js";
import { createLogger } from "./utils/structured-logger.js";

// Netlify Function: Daily Training Load
// Endpoint: /api/daily-load
//
// The athlete's OWN daily internal-load (session-RPE AU) series for a rolling
// window, for the load-calendar heatmap. Self only — the caller's userId is the
// athlete; a coach viewing another athlete would need the consent path (see
// SOURCE_OF_TRUTH §6 "coach athlete-detail trend parity"), which this is not.
//
// Load is the CANONICAL `computeSessionLoad` (utils/acwr.js) summed by calendar
// day — the AU formula is never re-derived here or on the client (§4). NOTE:
// v1 is training-session load only; past-game estimated load (which ACWR folds
// in via calc-readiness.fetchPastGameLoads) is not yet included here.

const logger = createLogger({ service: "netlify.daily-load" });
const WINDOW_DAYS = 35; // 5 weeks — a full calendar grid

/**
 * Sum canonical session load (session-RPE AU) by calendar day. Pure — the AU
 * formula lives once in `computeSessionLoad`; this only aggregates + sorts.
 */
function aggregateDailyLoad(sessions) {
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
        const entitlementCutoff = historyCutoffISO(entitlement);

        const end = new Date();
        const start = new Date(end);
        start.setDate(start.getDate() - (WINDOW_DAYS - 1));
        let startKey = start.toISOString().slice(0, 10);
        const endKey = end.toISOString().slice(0, 10);

        // Free-tier history floor applies here too — a free user's daily-load
        // heatmap only ever shows the last historyDays, not the full 35-day
        // window, even though 35 > 30 (see utils/entitlements.js).
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

        const series = aggregateDailyLoad(sessions);
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
