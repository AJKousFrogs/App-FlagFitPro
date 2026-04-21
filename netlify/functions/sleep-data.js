import { baseHandler } from "./utils/base-handler.js";
import { createErrorResponse, createSuccessResponse } from "./utils/error-handler.js";

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

function calculateAge(birthDate) {
  if (!birthDate) {
    return null;
  }
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) {
    return null;
  }
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birth.getDate())
  ) {
    age -= 1;
  }
  return age >= 0 ? age : null;
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

        if (sleepHistory.length === 0) {
          const legacySleep = await supabase
            .from("wellness_logs")
            .select("log_date, date, sleep, sleep_hours, sleep_quality")
            .or(`user_id.eq.${userId},athlete_id.eq.${userId}`)
            .order("log_date", { ascending: false })
            .limit(30);

          if (!legacySleep.error) {
            sleepHistory = (legacySleep.data || [])
              .map((row) => ({
                date: row.log_date || row.date || null,
                hoursSlept:
                  row.sleep_hours !== null && row.sleep_hours !== undefined
                    ? Number(row.sleep_hours)
                    : row.sleep !== null && row.sleep !== undefined
                      ? Number(row.sleep)
                      : 0,
                quality:
                  row.sleep_quality !== null && row.sleep_quality !== undefined
                    ? Number(row.sleep_quality)
                    : null,
              }))
              .filter(
                (row) =>
                  row.date &&
                  Number.isFinite(row.hoursSlept) &&
                  row.hoursSlept > 0,
              );
          } else if (!isOptionalSchemaError(legacySleep.error)) {
            throw legacySleep.error;
          }
        }

        return createSuccessResponse({
          sleepHistory,
          userAge: calculateAge(user?.birth_date || user?.date_of_birth),
        });
      } catch (error) {
        console.error("[sleep-data] Failed to load sleep data:", error);
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
