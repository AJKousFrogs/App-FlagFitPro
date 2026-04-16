import { baseHandler } from "./utils/base-handler.js";
import { createErrorResponse, createSuccessResponse } from "./utils/error-handler.js";
import { parseJsonObjectBody } from "./utils/input-validator.js";

function currentIsoDate() {
  return new Date().toISOString().split("T")[0];
}

function daysBetween(startDate, endDate = currentIsoDate()) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }
  return Math.max(1, Math.floor((end.getTime() - start.getTime()) / 86400000) + 1);
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

function deriveCycleLength(history) {
  if (history.length < 2) {
    return 28;
  }
  const lengths = [];
  for (let index = 0; index < history.length - 1; index += 1) {
    const length = daysBetween(
      history[index + 1].start_date,
      addDays(history[index].start_date, -1),
    );
    if (length) {
      lengths.push(length);
    }
  }
  if (lengths.length === 0) {
    return 28;
  }
  return Math.round(lengths.reduce((sum, value) => sum + value, 0) / lengths.length);
}

function derivePhase(day) {
  if (day <= 5) return "Menstrual";
  if (day <= 13) return "Follicular";
  if (day <= 16) return "Ovulation";
  if (day <= 23) return "Luteal Early";
  return "Luteal Late";
}

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "cycle-tracking",
    allowedMethods: ["GET", "POST", "DELETE"],
    rateLimitType: "UPDATE",
    requireAuth: true,
    handler: async (evt, _ctx, { userId, supabase }) => {
      const path = evt.path || "";
      const subPath = path.includes("/api/cycle-tracking")
        ? path.split("/api/cycle-tracking")[1] || ""
        : "";

      try {
        if (evt.httpMethod === "GET" && (subPath === "" || subPath === "/")) {
          const [entries, symptoms, acwr] = await Promise.all([
            supabase
              .from("cycle_tracking_entries")
              .select("*")
              .eq("user_id", userId)
              .order("start_date", { ascending: false })
              .limit(24),
            supabase
              .from("cycle_tracking_symptoms")
              .select("*")
              .eq("user_id", userId)
              .order("logged_date", { ascending: false })
              .limit(30),
            supabase.rpc("compute_acwr", { p_user_id: userId }),
          ]);

          if (entries.error) {
            throw entries.error;
          }
          if (symptoms.error) {
            throw symptoms.error;
          }

          const history = (entries.data || []).map((entry) => ({
            id: entry.id,
            startDate: entry.start_date,
            endDate: entry.end_date,
            length:
              entry.end_date != null
                ? daysBetween(entry.start_date, entry.end_date)
                : undefined,
            flowIntensity: entry.flow_intensity,
            symptoms: entry.symptoms || [],
            notes: entry.notes || "",
          }));

          const cycleLength = deriveCycleLength(entries.data || []);
          const latestStart = entries.data?.[0]?.start_date || currentIsoDate();
          const currentDay = daysBetween(latestStart) || 1;
          const nextPeriodDate = addDays(latestStart, cycleLength) || currentIsoDate();

          return createSuccessResponse({
            status: {
              currentDay,
              currentPhase: derivePhase(currentDay),
              nextPeriodDate,
              cycleLength,
              cyclesTracked: history.length,
            },
            history,
            acwr:
              acwr.error || acwr.data == null
                ? null
                : Array.isArray(acwr.data)
                  ? acwr.data[0]?.acwr ?? null
                  : acwr.data?.acwr ?? acwr.data ?? null,
            recentSymptoms: symptoms.data || [],
          });
        }

        if (evt.httpMethod === "POST" && subPath === "/period") {
          const body = parseJsonObjectBody(evt.body);
          const { data, error } = await supabase
            .from("cycle_tracking_entries")
            .insert({
              user_id: userId,
              start_date: body.startDate,
              end_date: body.endDate || null,
              flow_intensity: body.flowIntensity || "moderate",
              symptoms: Array.isArray(body.symptoms) ? body.symptoms : [],
              notes: typeof body.notes === "string" ? body.notes : null,
            })
            .select()
            .single();

          if (error) {
            throw error;
          }

          return createSuccessResponse(data, 201);
        }

        if (evt.httpMethod === "POST" && subPath === "/symptoms") {
          const body = parseJsonObjectBody(evt.body);
          const { data, error } = await supabase
            .from("cycle_tracking_symptoms")
            .upsert(
              {
                user_id: userId,
                logged_date: body.date || currentIsoDate(),
                symptoms: Array.isArray(body.symptoms) ? body.symptoms : [],
                severity: body.severity || "none",
              },
              { onConflict: "user_id,logged_date" },
            )
            .select()
            .single();

          if (error) {
            throw error;
          }

          return createSuccessResponse(data, 201);
        }

        if (evt.httpMethod === "DELETE" && subPath === "/all") {
          const [entryDelete, symptomDelete] = await Promise.all([
            supabase.from("cycle_tracking_entries").delete().eq("user_id", userId),
            supabase.from("cycle_tracking_symptoms").delete().eq("user_id", userId),
          ]);

          if (entryDelete.error) {
            throw entryDelete.error;
          }
          if (symptomDelete.error) {
            throw symptomDelete.error;
          }

          return createSuccessResponse({ ok: true });
        }

        return createErrorResponse("Endpoint not found", 404, "not_found");
      } catch (error) {
        console.error("[cycle-tracking] Request failed:", error);
        return createErrorResponse(
          error?.message || "Failed to process cycle tracking request",
          500,
          "server_error",
        );
      }
    },
  });

export const testHandler = handler;
export { handler };
