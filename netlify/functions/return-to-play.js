import crypto from "node:crypto";
import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";
import { baseHandler } from "./utils/base-handler.js";
import { createErrorResponse, createSuccessResponse } from "./utils/error-handler.js";
import { parseJsonObjectBody } from "./utils/input-validator.js";

const TOTAL_STAGES = 7;

function parseMetadata(value) {
  if (!value || typeof value !== "string") {
    return {};
  }
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function serializeMetadata(metadata) {
  return JSON.stringify(metadata || {});
}

function isoDate(value) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString().split("T")[0];
}

function daysBetween(startDate, endDate = new Date()) {
  const start = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(start.getTime())) {
    return 0;
  }
  const diff = endDate.getTime() - start.getTime();
  return Math.max(1, Math.floor(diff / 86400000) + 1);
}

function mapProtocolRecord(record) {
  const metadata = parseMetadata(record?.phase_description);
  const currentStage = Math.max(1, Number(record?.current_phase) || 1);
  const stageStartedAt =
    metadata.stageStartedAt?.[String(currentStage)] ||
    record?.updated_at ||
    record?.start_date;
  return {
    id: record.id,
    injuryType: metadata.injuryType || "",
    injuryLocation: metadata.injuryLocation || "",
    severity: metadata.severity || "moderate",
    startDate: record.start_date,
    targetReturnDate: record.estimated_completion_date || "",
    currentStage,
    daysInRecovery: daysBetween(record.start_date),
    daysInCurrentStage: daysBetween(stageStartedAt),
    progressPercentage: Math.round((currentStage / TOTAL_STAGES) * 100),
    criteriaCompleted: metadata.criteriaCompleted || [],
    medicalNotes: metadata.medicalNotes || "",
  };
}

function mapCheckins(metadata) {
  return Array.isArray(metadata?.checkins) ? metadata.checkins : [];
}

function getSubPath(path) {
  const marker = "/api/return-to-play";
  const index = path?.indexOf(marker);
  if (index === -1) {
    return "";
  }
  return path.slice(index + marker.length) || "";
}

async function getActiveProtocol(supabase, userId) {
  return supabase
    .from("return_to_play_protocols")
    .select("*")
    .eq("athlete_id", userId)
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
}

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "return-to-play",
    allowedMethods: ["GET", "POST"],
    rateLimitType: "UPDATE",
    requireAuth: true,
    handler: async (evt, _ctx, { userId, supabase }) => {
      const subPath = getSubPath(evt.path || "");

      try {
        if (evt.httpMethod === "GET" && (subPath === "" || subPath === "/")) {
          const { data: protocol, error } = await getActiveProtocol(supabase, userId);
          if (error) {
            throw error;
          }

          if (!protocol) {
            return createSuccessResponse({
              activeProtocol: null,
              checkins: [],
            });
          }

          const metadata = parseMetadata(protocol.phase_description);
          return createSuccessResponse({
            activeProtocol: mapProtocolRecord(protocol),
            checkins: mapCheckins(metadata),
          });
        }

        let body;
        try {
          body = parseJsonObjectBody(evt.body);
        } catch {
          return createErrorResponse(
            "Request body must be a JSON object",
            422,
            "validation_error",
          );
        }

        if (evt.httpMethod !== "POST") {
          return createErrorResponse("Method not allowed", 405, "method_not_allowed");
        }

        if (subPath === "/start") {
          const startDate = isoDate(body.injuryDate) || new Date().toISOString().split("T")[0];
          const targetReturnDate =
            isoDate(body.targetReturnDate) ||
            isoDate(new Date(Date.now() + 14 * 86400000));
          const metadata = {
            injuryType: body.injuryType || "",
            injuryLocation: body.injuryLocation || "",
            severity: body.severity || "moderate",
            medicalNotes: body.medicalNotes || "",
            criteriaCompleted: [],
            stageStartedAt: { "1": startDate },
            checkins: [],
          };

          const { data, error } = await supabase
            .from("return_to_play_protocols")
            .insert({
              athlete_id: userId,
              status: "active",
              current_phase: 1,
              start_date: startDate,
              estimated_completion_date: targetReturnDate,
              phase_description: serializeMetadata(metadata),
            })
            .select("id")
            .single();

          if (error) {
            throw error;
          }

          return createSuccessResponse({ id: data.id }, 201);
        }

        const currentProtocol = await getActiveProtocol(supabase, userId);
        if (currentProtocol.error) {
          throw currentProtocol.error;
        }
        if (!currentProtocol.data) {
          return createErrorResponse(
            "No active return-to-play protocol found",
            404,
            "not_found",
          );
        }

        const protocol = currentProtocol.data;
        const metadata = parseMetadata(protocol.phase_description);

        if (subPath === "/criterion") {
          const criterionIndex = Number(body.criterionIndex);
          if (!Number.isInteger(criterionIndex) || criterionIndex < 0) {
            return createErrorResponse(
              "criterionIndex must be a non-negative integer",
              422,
              "validation_error",
            );
          }

          const criteriaCompleted = Array.isArray(metadata.criteriaCompleted)
            ? [...metadata.criteriaCompleted]
            : [];
          criteriaCompleted[criterionIndex] = body.completed === true;
          metadata.criteriaCompleted = criteriaCompleted;

          const { error } = await supabase
            .from("return_to_play_protocols")
            .update({
              phase_description: serializeMetadata(metadata),
              updated_at: new Date().toISOString(),
            })
            .eq("id", protocol.id)
            .eq("athlete_id", userId);

          if (error) {
            throw error;
          }

          return createSuccessResponse({ ok: true });
        }

        if (subPath === "/advance") {
          const nextPhase = Math.min(TOTAL_STAGES, (protocol.current_phase || 1) + 1);
          metadata.criteriaCompleted = [];
          metadata.stageStartedAt = {
            ...(metadata.stageStartedAt || {}),
            [String(nextPhase)]: new Date().toISOString().split("T")[0],
          };

          const { error } = await supabase
            .from("return_to_play_protocols")
            .update({
              current_phase: nextPhase,
              phase_description: serializeMetadata(metadata),
              updated_at: new Date().toISOString(),
            })
            .eq("id", protocol.id)
            .eq("athlete_id", userId);

          if (error) {
            throw error;
          }

          return createSuccessResponse({ ok: true, currentStage: nextPhase });
        }

        if (subPath === "/checkin") {
          const nextCheckin = {
            id: crypto.randomUUID?.() || `${Date.now()}`,
            date: new Date().toISOString().split("T")[0],
            painLevel: Number(body.painLevel) || 0,
            functionScore: Number(body.functionScore) || 0,
            confidenceLevel: Number(body.confidenceLevel) || 0,
            activitiesCompleted: Array.isArray(body.activitiesCompleted)
              ? body.activitiesCompleted.filter((value) => typeof value === "string")
              : [],
            notes: typeof body.notes === "string" ? body.notes : "",
          };
          metadata.checkins = [nextCheckin, ...mapCheckins(metadata)].slice(0, 30);

          const { error } = await supabase
            .from("return_to_play_protocols")
            .update({
              phase_description: serializeMetadata(metadata),
              updated_at: new Date().toISOString(),
            })
            .eq("id", protocol.id)
            .eq("athlete_id", userId);

          if (error) {
            throw error;
          }

          return createSuccessResponse(nextCheckin, 201);
        }

        return createErrorResponse("Endpoint not found", 404, "not_found");
      } catch (error) {
        console.error("[return-to-play] Request failed:", error);
        return createErrorResponse(
          error?.message || "Failed to process return-to-play request",
          500,
          "server_error",
        );
      }
    },
  });

export const testHandler = handler;
export { handler };
export default createRuntimeV2Handler(handler);
