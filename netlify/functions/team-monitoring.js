import { baseHandler } from "./utils/base-handler.js";
import {
  createErrorResponse,
  createSuccessResponse,
} from "./utils/error-handler.js";
import { getUserTeamId } from "./utils/auth-helper.js";
import { getUserRole } from "./utils/authorization-guard.js";
import { hasAnyRole, HEALTH_DATA_ACCESS_ROLES } from "./utils/role-sets.js";
import { canCoachViewWellness } from "./utils/consent-guard.js";
import { supabaseAdmin } from "./supabase-client.js";
import { createLogger } from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.team-monitoring" });

// Endpoint: GET /api/team-monitoring
// A squad-wide daily monitoring table for coaches / physios: one row per active
// athlete on the caller's team, with pre-session wellness, internal load (sRPE),
// ACWR and readiness flags + an action. TWO gates, both reusing already-vetted
// code so this exposes NOTHING new:
//   1. the caller must hold a HEALTH_DATA_ACCESS_ROLES role on the team, and
//   2. each athlete row is gated by canCoachViewWellness (the SAME per-athlete
//      consent check that protects the single-athlete monitoring report) —
//      no consent → the athlete appears by name only, with no health data.

function displayName(u, fallback = "Athlete") {
  return (
    u?.full_name ||
    u?.name ||
    [u?.first_name, u?.last_name].filter(Boolean).join(" ").trim() ||
    fallback
  );
}

// Readiness < 55 is the app's canonical "low" line (see periodization-engine
// READINESS_LOW). Flags are text tokens (never colour-only) matching the
// monitoring-report vocabulary.
function wellnessFlag(readiness) {
  if (!Number.isFinite(readiness)) {
    return "—";
  }
  return readiness < 55 ? "LOW" : "OK";
}
function loadFlag(acwr) {
  if (!Number.isFinite(acwr)) {
    return "—";
  }
  if (acwr > 1.5) {
    return "HIGH";
  }
  if (acwr > 1.3 || acwr < 0.8) {
    return "WATCH";
  }
  return "OK";
}
function actionFor(wFlag, lFlag) {
  if (wFlag === "LOW" || lFlag === "HIGH") {
    return "Individualise / review";
  }
  if (lFlag === "WATCH" || wFlag === "—" || lFlag === "—") {
    return "Monitor";
  }
  return "Full session";
}

async function rosterAthletes(teamId) {
  const { data, error } = await supabaseAdmin
    .from("team_members")
    .select(
      `user_id, jersey_number, position,
       users:user_id ( id, full_name, first_name, last_name, name )`,
    )
    .eq("team_id", teamId)
    .eq("role", "player")
    .eq("status", "active")
    .order("jersey_number", { ascending: true, nullsFirst: false });
  if (error) {
    throw error;
  }
  return (data || [])
    .map((m) => ({
      id: m.user_id || m.users?.id,
      name: displayName(m.users),
      jersey: m.jersey_number ?? null,
      position: m.position ?? "",
    }))
    .filter((a) => !!a.id);
}

async function buildRow(callerId, athlete) {
  // Per-athlete consent gate (reused verbatim from the single-athlete report).
  const consent = await canCoachViewWellness(callerId, athlete.id);
  if (!consent.allowed) {
    return {
      athleteId: athlete.id,
      name: athlete.name,
      jersey: athlete.jersey,
      position: athlete.position,
      consentPending: true,
    };
  }

  const [wellnessRes, sessionRes, readinessRes] = await Promise.all([
    supabaseAdmin
      .from("daily_wellness_checkin")
      .select(
        "checkin_date, sleep_quality, energy_level, stress_level, muscle_soreness, mood, readiness_score, calculated_readiness",
      )
      .eq("user_id", athlete.id)
      .order("checkin_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from("training_sessions")
      .select("rpe, duration_minutes, completed_at")
      .eq("user_id", athlete.id)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from("readiness_scores")
      .select("acwr, score, day")
      .eq("user_id", athlete.id)
      .order("day", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const w = wellnessRes.data;
  const s = sessionRes.data;
  const r = readinessRes.data;

  const readiness =
    w?.readiness_score ?? w?.calculated_readiness ?? r?.score ?? null;
  const rpe = typeof s?.rpe === "number" ? s.rpe : null;
  const durationMin =
    typeof s?.duration_minutes === "number" ? s.duration_minutes : null;
  const srpe =
    rpe !== null && durationMin !== null ? Math.round(rpe * durationMin) : null;
  const acwr =
    typeof r?.acwr === "number" ? Math.round(r.acwr * 100) / 100 : null;
  const wFlag = wellnessFlag(readiness);
  const lFlag = loadFlag(acwr);

  return {
    athleteId: athlete.id,
    name: athlete.name,
    jersey: athlete.jersey,
    position: athlete.position,
    consentPending: false,
    safetyOverride: consent.reason === "SAFETY_OVERRIDE",
    wellness: {
      sleep: w?.sleep_quality ?? null,
      energy: w?.energy_level ?? null,
      stress: w?.stress_level ?? null,
      soreness: w?.muscle_soreness ?? null,
      mood: w?.mood ?? null,
      readiness: readiness !== null ? Math.round(readiness) : null,
      date: w?.checkin_date ?? null,
    },
    load: { rpe, durationMin, srpe },
    acwr,
    flags: { wellness: wFlag, load: lFlag, action: actionFor(wFlag, lFlag) },
  };
}

// Column-wise mean across the rows that have data (consent-visible only).
function meanOf(rows) {
  const visible = rows.filter((r) => !r.consentPending);
  if (!visible.length) {
    return null;
  }
  const avg = (pick) => {
    const vals = visible.map(pick).filter((v) => typeof v === "number");
    if (!vals.length) {
      return null;
    }
    return (
      Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
    );
  };
  return {
    sleep: avg((r) => r.wellness?.sleep),
    energy: avg((r) => r.wellness?.energy),
    stress: avg((r) => r.wellness?.stress),
    soreness: avg((r) => r.wellness?.soreness),
    mood: avg((r) => r.wellness?.mood),
    readiness: avg((r) => r.wellness?.readiness),
    rpe: avg((r) => r.load?.rpe),
    durationMin: avg((r) => r.load?.durationMin),
    srpe: avg((r) => r.load?.srpe),
    acwr: avg((r) => r.acwr),
  };
}

const handler = async (event, context) =>
  baseHandler(event, context, {
    functionName: "team-monitoring",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: true,
    handler: async (_evt, _ctx, { userId }) => {
      const role = await getUserRole(userId);
      if (!hasAnyRole(role, HEALTH_DATA_ACCESS_ROLES)) {
        return createErrorResponse(
          "Squad monitoring is available to coaching and medical staff only.",
          403,
          "authorization_error",
        );
      }

      const teamId = await getUserTeamId(userId);
      if (!teamId) {
        return createSuccessResponse({
          rows: [],
          mean: null,
          role,
          teamId: null,
        });
      }

      try {
        const athletes = await rosterAthletes(teamId);
        const rows = await Promise.all(
          athletes.map((a) => buildRow(userId, a)),
        );
        return createSuccessResponse({
          rows,
          mean: meanOf(rows),
          role,
          teamId,
          visibleCount: rows.filter((r) => !r.consentPending).length,
        });
      } catch (error) {
        logger.error("team_monitoring_load_failed", error, { user_id: userId });
        return createErrorResponse(
          "Failed to load squad monitoring",
          500,
          "server_error",
        );
      }
    },
  });

export const __test__ = {
  wellnessFlag,
  loadFlag,
  actionFor,
  meanOf,
};
export { handler };
