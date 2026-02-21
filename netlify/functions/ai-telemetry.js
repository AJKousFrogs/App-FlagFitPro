import { supabaseAdmin } from "./supabase-client.js";
import { baseHandler } from "./utils/base-handler.js";
import {
  createErrorResponse,
  createSuccessResponse,
} from "./utils/error-handler.js";
import { requireRole } from "./utils/authorization-guard.js";

const STAFF_ROLES = ["coach", "admin", "superadmin"];

function parseBoundedInt(value, fieldName, min, max) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const normalized = String(value).trim();
  if (!/^-?\d+$/.test(normalized)) {
    throw new Error(`${fieldName} must be an integer between ${min} and ${max}`);
  }

  const parsed = Number.parseInt(normalized, 10);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${fieldName} must be an integer between ${min} and ${max}`);
  }
  return parsed;
}

async function getCoachTeamIds(userId) {
  const { data, error } = await supabaseAdmin
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId)
    .eq("role", "coach");

  if (error) {
    throw error;
  }

  return (data || []).map((row) => row.team_id).filter(Boolean);
}

function buildRates(total, numerator) {
  if (!total) {
    return 0;
  }
  return Number(((numerator / total) * 100).toFixed(2));
}

export const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "ai-telemetry",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: true,
    handler: async (event, _context, { userId, requestId }) => {
      const access = await requireRole(userId, STAFF_ROLES);
      if (!access.authorized) {
        return createErrorResponse(
          "Coach/admin access required",
          403,
          "authorization_error",
          requestId,
        );
      }

      const query = event.queryStringParameters || {};
      const teamId = query.team_id || null;

      let days = 30;
      try {
        days = parseBoundedInt(query.days, "days", 1, 90) ?? 30;
      } catch (error) {
        return createErrorResponse(
          error.message,
          422,
          "validation_error",
          requestId,
        );
      }

      let permittedTeamIds = null;
      if (access.role === "coach") {
        permittedTeamIds = await getCoachTeamIds(userId);
        if (teamId && !permittedTeamIds.includes(teamId)) {
          return createErrorResponse(
            "Not authorized to access telemetry for this team",
            403,
            "authorization_error",
            requestId,
          );
        }
      }

      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 19);

      let sessionQuery = supabaseAdmin
        .from("ai_chat_sessions")
        .select("id, user_id, team_id, started_at")
        .gte("started_at", since);

      if (teamId) {
        sessionQuery = sessionQuery.eq("team_id", teamId);
      } else if (Array.isArray(permittedTeamIds)) {
        if (permittedTeamIds.length === 0) {
          return createSuccessResponse(
            {
              window_days: days,
              since,
              team_scope: teamId || "coach_teams",
              sessions: {
                total: 0,
                unique_users: 0,
              },
              messages: {
                total: 0,
                assistant: 0,
                risk: { high: 0, medium: 0, low: 0, unknown: 0 },
                fallback_rate_pct: 0,
                no_citation_rate_pct: 0,
              },
              recommendations: {
                total: 0,
                accepted: 0,
                completed: 0,
                acceptance_rate_pct: 0,
                completion_rate_pct: 0,
              },
              knowledge_base: {
                total_entries: 0,
                by_type: {},
              },
            },
            requestId,
          );
        }
        sessionQuery = sessionQuery.in("team_id", permittedTeamIds);
      }

      const { data: sessions, error: sessionsError } = await sessionQuery;
      if (sessionsError) {
        return createErrorResponse(
          "Failed to fetch AI session telemetry",
          500,
          "database_error",
          requestId,
        );
      }

      const sessionIds = (sessions || []).map((s) => s.id);
      const uniqueUsers = new Set((sessions || []).map((s) => s.user_id)).size;

      if (sessionIds.length === 0) {
        return createSuccessResponse(
          {
            window_days: days,
            since,
            team_scope: teamId || (permittedTeamIds ? "coach_teams" : "all"),
            sessions: {
              total: 0,
              unique_users: 0,
            },
            messages: {
              total: 0,
              assistant: 0,
              risk: { high: 0, medium: 0, low: 0, unknown: 0 },
              fallback_rate_pct: 0,
              no_citation_rate_pct: 0,
            },
            recommendations: {
              total: 0,
              accepted: 0,
              completed: 0,
              acceptance_rate_pct: 0,
              completion_rate_pct: 0,
            },
            knowledge_base: {
              total_entries: 0,
              by_type: {},
            },
          },
          requestId,
        );
      }

      const [
        { data: messages, error: messagesError },
        { data: recommendations, error: recommendationsError },
        { data: kbEntries, error: kbError },
        { count: pendingKbCount, error: pendingKbError },
      ] = await Promise.all([
        supabaseAdmin
          .from("ai_messages")
          .select("id, role, risk_level, citations, metadata")
          .in("session_id", sessionIds)
          .gte("created_at", since),
        supabaseAdmin
          .from("ai_recommendations")
          .select("id, status, created_at")
          .in("chat_session_id", sessionIds)
          .gte("created_at", since),
        supabaseAdmin
          .from("knowledge_base_entries")
          .select("id, entry_type")
          .eq("is_merlin_approved", true),
        supabaseAdmin
          .from("knowledge_base_entries")
          .select("id", { count: "exact", head: true })
          .eq("merlin_approval_status", "pending"),
      ]);

      if (messagesError || recommendationsError || kbError || pendingKbError) {
        return createErrorResponse(
          "Failed to fetch AI telemetry details",
          500,
          "database_error",
          requestId,
        );
      }

      const allMessages = messages || [];
      const assistantMessages = allMessages.filter((m) => m.role === "assistant");
      const risk = { high: 0, medium: 0, low: 0, unknown: 0 };
      let fallbackCount = 0;
      let noCitationCount = 0;

      for (const message of assistantMessages) {
        const level = `${message.risk_level || ""}`.toLowerCase();
        if (level === "high" || level === "medium" || level === "low") {
          risk[level] += 1;
        } else {
          risk.unknown += 1;
        }

        if (message.metadata?.source === "fallback") {
          fallbackCount += 1;
        }

        if (!Array.isArray(message.citations) || message.citations.length === 0) {
          noCitationCount += 1;
        }
      }

      const recs = recommendations || [];
      const accepted = recs.filter((r) => r.status === "accepted").length;
      const completed = recs.filter((r) => r.status === "completed").length;

      const kbByType = {};
      for (const entry of kbEntries || []) {
        const key = entry.entry_type || "unknown";
        kbByType[key] = (kbByType[key] || 0) + 1;
      }

      return createSuccessResponse(
        {
          window_days: days,
          since,
          team_scope: teamId || (permittedTeamIds ? "coach_teams" : "all"),
          sessions: {
            total: sessionIds.length,
            unique_users: uniqueUsers,
          },
          messages: {
            total: allMessages.length,
            assistant: assistantMessages.length,
            risk,
            fallback_rate_pct: buildRates(assistantMessages.length, fallbackCount),
            no_citation_rate_pct: buildRates(assistantMessages.length, noCitationCount),
          },
          recommendations: {
            total: recs.length,
            accepted,
            completed,
            acceptance_rate_pct: buildRates(recs.length, accepted),
            completion_rate_pct: buildRates(recs.length, completed),
          },
          knowledge_base: {
            total_entries: (kbEntries || []).length,
            by_type: kbByType,
            pending_entries: pendingKbCount || 0,
          },
        },
        requestId,
      );
    },
  });
