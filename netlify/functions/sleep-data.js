import { baseHandler } from "./utils/base-handler.js";
import { calculateAge } from "./utils/daily-protocol-context.js";
import { createErrorResponse, createSuccessResponse } from "./utils/error-handler.js";
import { createLogger } from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.sleep-data" });

function isOptionalSchemaError(error) {
  const code = error?.code;
  const message = `${error?.message || ""}`.toLowerCase();
  return (
    ["PGRST106", "PGRST116", "PGRST204", "42P01", "42703"].includes(code) ||
    message.includes("relation") ||
    message.includes("does not exist") ||
    message.includes("schema cache")
  );
}

function normalizeSleepRows(rows, dateKey, hoursKey, qualityKey) {
  return (rows || [])
    .map((row) => ({
      date: row?.[dateKey] || null,
      hoursSlept:
        typeof row?.[hoursKey] === "number"
          ? row[hoursKey]
          : Number(row?.[hoursKey] || 0),
      quality:
        typeof row?.[qualityKey] === "number"
          ? row[qualityKey]
          : row?.[qualityKey] !== null && row?.[qualityKey] !== undefined
            ? Number(row[qualityKey])
            : null,
    }))
    .filter((row) => row.date && Number.isFinite(row.hoursSlept) && row.hoursSlept > 0);
}

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "sleep-data",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: true,
    handler: async (_evt, _ctx, { userId, supabase }) => {
      try {
        const [{ data: user }, primarySleep] = await Promise.all([
          supabase
            .from("users")
            .select("birth_date, date_of_birth")
            .eq("id", userId)
            .maybeSingle(),
          supabase
            .from("daily_wellness_checkin")
            .select("checkin_date, sleep_hours, sleep_quality")
            .eq("user_id", userId)
            .not("sleep_hours", "is", null)
            .order("checkin_date", { ascending: false })
            .limit(30),
        ]);

        let sleepHistory = [];

        if (!primarySleep.error) {
          sleepHistory = normalizeSleepRows(
            primarySleep.data,
            "checkin_date",
            "sleep_hours",
            "sleep_quality",
          );
        } else if (!isOptionalSchemaError(primarySleep.error)) {
          throw primarySleep.error;
        }

        // daily_wellness_checkin is canonical for sleep; no legacy wellness_logs fallback.

        return createSuccessResponse({
          sleepHistory,
          userAge: calculateAge(user?.birth_date || user?.date_of_birth),
        });
      } catch (error) {
        logger.error("sleep_data_load_failed", error, { message: "[sleep-data] Failed to load sleep data" });
        return createErrorResponse(
          "Failed to load sleep data",
          500,
          "server_error",
        );
      }
    },
  });

export const testHandler = handler;
export { handler };
