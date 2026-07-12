import { baseHandler } from "./utils/base-handler.js";
import {
  createSuccessResponse,
  createErrorResponse,
} from "./utils/error-handler.js";
import { supabaseAdmin } from "./supabase-client.js";
import {
  tryParseJsonObjectBody,
  parseBoundedInt,
} from "./utils/input-validator.js";
import { createLogger } from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.supplements" });

// Netlify Function: Supplements API
// Handles supplement logging (read-only for AI - no dosing recommendations)

const NAME_MAX = 100;
const DOSAGE_MAX = 100;
const TIME_OF_DAY_MAX = 50;
const NOTES_MAX = 1000;
const MAX_ITEMS = 50;

const validationError = (message) => {
  const error = new Error(message);
  error.isValidation = true;
  return error;
};

// Normalize a single supplement payload (accepts both the daily-log shape
// {name, taken, dosage, timeOfDay} and the legacy /log shape {supplement, dose}).
function normalizeSupplementItem(raw) {
  if (!raw || typeof raw !== "object") {
    throw validationError("each supplement must be an object");
  }
  const name = (raw.name ?? raw.supplement)?.toString().trim();
  if (!name) {
    throw validationError("supplement name is required");
  }
  if (name.length > NAME_MAX) {
    throw validationError(
      `supplement name must be ${NAME_MAX} characters or less`,
    );
  }

  const dosageRaw = raw.dosage ?? raw.dose;
  let dosage = null;
  if (dosageRaw !== undefined && dosageRaw !== null && dosageRaw !== "") {
    dosage = String(dosageRaw).trim().slice(0, DOSAGE_MAX);
  }

  // taken defaults to true (a plain "I took X"); the daily toggle sends it explicitly
  const taken = raw.taken === undefined ? true : Boolean(raw.taken);

  let timeOfDay = raw.timeOfDay ?? raw.time_of_day ?? null;
  if (timeOfDay !== null && timeOfDay !== undefined) {
    timeOfDay = String(timeOfDay).trim().slice(0, TIME_OF_DAY_MAX) || null;
  }

  const notes = raw.notes ? String(raw.notes).slice(0, NOTES_MAX) : null;

  return { name, dosage, taken, timeOfDay, notes };
}

// Resolve the log date to a YYYY-MM-DD string (defaults to today).
function resolveLogDate(rawDate) {
  if (!rawDate) {
    return new Date().toISOString().split("T")[0];
  }
  let s = String(rawDate);
  // tolerate a full ISO timestamp (legacy takenAt) by taking the date part
  if (s.includes("T")) {
    s = s.split("T")[0];
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    throw validationError("date must be in YYYY-MM-DD format");
  }
  if (Number.isNaN(new Date(`${s}T00:00:00Z`).getTime())) {
    throw validationError("date is not a valid calendar date");
  }
  return s;
}

/**
 * Upsert one or more daily supplement logs.
 * POST /api/supplements  (daily check-in: { date?, supplements: [...] } or a single item)
 * Idempotent per (user_id, supplement_name, date) — toggling a switch on/off updates
 * the same row instead of accumulating duplicates.
 * Note: the athlete logs dose/timing; the engine/AI reads but never writes dosing.
 */
async function upsertSupplements(userId, items, rawDate) {
  const date = resolveLogDate(rawDate);
  const list = (Array.isArray(items) ? items : [items]).map(
    normalizeSupplementItem,
  );

  if (list.length === 0) {
    throw validationError("at least one supplement is required");
  }
  if (list.length > MAX_ITEMS) {
    throw validationError(
      `too many supplements in one request (max ${MAX_ITEMS})`,
    );
  }

  const rows = list.map((it) => ({
    user_id: userId,
    supplement_name: it.name,
    dosage: it.dosage,
    taken: it.taken,
    date,
    time_of_day: it.timeOfDay,
    notes: it.notes,
  }));

  const { data, error } = await supabaseAdmin
    .from("supplement_logs")
    .upsert(rows, { onConflict: "user_id,supplement_name,date" })
    .select();

  if (error) {
    logger.error("supplement_logs_upsert_failed", error, {});
    throw error;
  }

  return {
    date,
    logged: data.length,
    supplements: data.map((d) => ({
      id: d.id,
      supplement: d.supplement_name,
      dosage: d.dosage ?? null,
      taken: d.taken,
      date: d.date,
      timeOfDay: d.time_of_day ?? null,
      notes: d.notes ?? null,
    })),
  };
}

/**
 * Legacy single-log path. POST /api/supplements/log
 * Kept for backward compatibility; now upserts (idempotent) like the daily log.
 */
async function logSupplement(userId, supplementData) {
  const result = await upsertSupplements(
    userId,
    [supplementData],
    supplementData.date ?? supplementData.takenAt,
  );
  return result.supplements[0];
}

/**
 * Add or update a supplement in the athlete's own curated stack.
 * POST /api/supplements/stack  { name, dosage?, timing?, category?, active? }
 * Upserts on (user_id, name); set active:false to retire one. This is the user's
 * personal list — the engine/AI never writes dosing here.
 */
async function upsertUserSupplement(userId, data) {
  if (!data || typeof data !== "object") {
    throw validationError("request body must be an object");
  }
  const name = data.name?.toString().trim();
  if (!name) {
    throw validationError("supplement name is required");
  }
  if (name.length > NAME_MAX) {
    throw validationError(
      `supplement name must be ${NAME_MAX} characters or less`,
    );
  }

  const row = {
    user_id: userId,
    name,
    dosage:
      data.dosage !== undefined && data.dosage !== null && data.dosage !== ""
        ? String(data.dosage).trim().slice(0, DOSAGE_MAX)
        : null,
    timing: data.timing
      ? String(data.timing).trim().slice(0, TIME_OF_DAY_MAX)
      : "anytime",
    category: data.category
      ? String(data.category).trim().slice(0, 50)
      : "other",
    active: data.active === undefined ? true : Boolean(data.active),
    updated_at: new Date().toISOString(),
  };

  const { data: out, error } = await supabaseAdmin
    .from("user_supplements")
    .upsert(row, { onConflict: "user_id,name" })
    .select()
    .single();

  if (error) {
    logger.error("user_supplement_upsert_failed", error, {});
    throw error;
  }

  return {
    id: out.id,
    name: out.name,
    dosage: out.dosage ?? null,
    timing: out.timing,
    category: out.category,
    active: out.active,
  };
}

/**
 * Get supplement logs for user
 * GET /api/supplements/logs
 */
async function getSupplementLogs(userId, limit = 30) {
  try {
    const { data, error } = await supabaseAdmin
      .from("supplement_logs")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(limit);

    if (error) {
      logger.error("supplement_logs_fetch_failed", error, {});
      throw error;
    }

    return data || [];
  } catch (error) {
    logger.error("supplement_logs_fetch_failed", error, {});
    throw error;
  }
}

/**
 * Get recent supplement logs (last 7 days)
 * GET /api/supplements/recent
 */
async function getRecentSupplementLogs(userId) {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateStr = sevenDaysAgo.toISOString().split("T")[0];

    const { data, error } = await supabaseAdmin
      .from("supplement_logs")
      .select("*")
      .eq("user_id", userId)
      .gte("date", dateStr)
      .order("date", { ascending: false });

    if (error) {
      logger.error("recent_supplement_logs_fetch_failed", error, {});
      throw error;
    }

    return data || [];
  } catch (error) {
    logger.error("recent_supplement_logs_fetch_failed", error, {});
    throw error;
  }
}

// ── Supplement behaviour insights (GET /api/supplements/insights) ───────────
// Detects an established logging habit that stopped ("stock ran empty") and
// returns per-supplement usage stats the client renders education from. When a
// lapse is detected it also drops an in-app notification (deduped per
// supplement per cooldown window) with the partner restock offer.
//
// Partner promo is a PRODUCT decision (owner-set: 30% off at LaPrimaFit for
// app users); the discount code / landing URL are not final — update here.
const RESTOCK_PARTNER = { name: "LaPrimaFit", discountPercent: 30 };
const INSIGHT_WINDOW_DAYS = 45; // history window the insights look at
const LAPSE_GAP_DAYS = 7; // "quite some time": no logs in the last 7 days…
const HABIT_MIN_DAYS = 5; // …after ≥5 logged days in the 30 days before that
const NUDGE_COOLDOWN_DAYS = 14; // one notification per supplement per fortnight

/** Fold free-text supplement names into canonical buckets so "creatine",
 *  "Creatine Monohydrate" and "kreatin 5g" count as one habit. */
export function canonicalSupplementName(name) {
  const n = String(name || "").toLowerCase();
  if (n.includes("creatin") || n.includes("kreatin")) {
    return "creatine";
  }
  if (n.includes("beta")) {
    return "beta-alanine";
  }
  if (n.includes("caffeine") || n.includes("coffee")) {
    return "caffeine";
  }
  return n.trim();
}

/**
 * Pure lapse/usage computation over taken=true logs within the window.
 * habit  = ≥HABIT_MIN_DAYS logged days in the 30 days preceding the lapse gap;
 * lapsed = habit AND zero logged days within the last LAPSE_GAP_DAYS.
 */
export function computeSupplementInsights(logs, todayIso) {
  const today = new Date(`${todayIso}T00:00:00Z`).getTime();
  const daysAgo = (dateStr) =>
    Math.floor(
      (today - new Date(`${dateStr}T00:00:00Z`).getTime()) / 86_400_000,
    );

  const byName = new Map();
  for (const log of logs || []) {
    if (!log?.taken || !log.date) {
      continue;
    }
    const canonical = canonicalSupplementName(log.supplement_name);
    if (!canonical) {
      continue;
    }
    let entry = byName.get(canonical);
    if (!entry) {
      entry = {
        supplement: canonical,
        label: log.supplement_name,
        dates: new Set(),
      };
      byName.set(canonical, entry);
    }
    entry.dates.add(log.date);
  }

  return [...byName.values()].map((e) => {
    const dates = [...e.dates].sort();
    const lastDate = dates[dates.length - 1];
    const daysSinceLast = daysAgo(lastDate);
    const takenDaysLast7 = dates.filter(
      (d) => daysAgo(d) < LAPSE_GAP_DAYS,
    ).length;
    const priorHabitDays = dates.filter((d) => {
      const diff = daysAgo(d);
      return diff >= LAPSE_GAP_DAYS && diff < LAPSE_GAP_DAYS + 30;
    }).length;
    const habit = priorHabitDays >= HABIT_MIN_DAYS;
    return {
      supplement: e.supplement,
      label: e.label,
      firstDate: dates[0],
      lastDate,
      daysSinceLast,
      takenDaysLast7,
      priorHabitDays,
      totalDaysInWindow: dates.length,
      habit,
      lapsed: habit && takenDaysLast7 === 0,
    };
  });
}

async function getSupplementInsights(userId) {
  const since = new Date(Date.now() - INSIGHT_WINDOW_DAYS * 86_400_000)
    .toISOString()
    .split("T")[0];
  const { data, error } = await supabaseAdmin
    .from("supplement_logs")
    .select("supplement_name, date, taken")
    .eq("user_id", userId)
    .gte("date", since);
  if (error) {
    logger.error("supplement_insights_fetch_failed", error, {});
    throw error;
  }

  const todayIso = new Date().toISOString().split("T")[0];
  const insights = computeSupplementInsights(data || [], todayIso);
  const lapsed = insights.filter((i) => i.lapsed);
  const nudges = [];

  if (lapsed.length > 0) {
    const cooldownSince = new Date(
      Date.now() - NUDGE_COOLDOWN_DAYS * 86_400_000,
    ).toISOString();
    const { data: recentNudges, error: nudgeErr } = await supabaseAdmin
      .from("notifications")
      .select("id, data")
      .eq("user_id", userId)
      .eq("notification_type", "supplement_lapse")
      .gte("created_at", cooldownSince);
    if (nudgeErr) {
      logger.warn("supplement_lapse_dedupe_check_failed", {}, nudgeErr);
    }
    const alreadyNudged = new Set(
      (recentNudges || []).map((n) => n?.data?.supplement).filter(Boolean),
    );

    for (const i of lapsed) {
      const message =
        `You'd logged ${i.label} on ${i.priorHabitDays} of the previous 30 days, ` +
        `but nothing for ${i.daysSinceLast} days. Did your stock run empty? ` +
        `As a FlagFit athlete you get ${RESTOCK_PARTNER.discountPercent}% off ` +
        `restocking at ${RESTOCK_PARTNER.name}.`;
      nudges.push({
        supplement: i.supplement,
        label: i.label,
        daysSinceLast: i.daysSinceLast,
        message,
      });
      // Dedupe failure above fails OPEN (alreadyNudged empty → we might notify
      // again a fortnight early) — the harmless direction for a promo nudge.
      if (!alreadyNudged.has(i.supplement)) {
        const { error: insertErr } = await supabaseAdmin
          .from("notifications")
          .insert({
            user_id: userId,
            notification_type: "supplement_lapse",
            category: "nutrition",
            title: `Restock ${i.label}?`,
            message,
            priority: "low",
            data: {
              supplement: i.supplement,
              lastDate: i.lastDate,
              daysSinceLast: i.daysSinceLast,
              partner: RESTOCK_PARTNER.name,
              discountPercent: RESTOCK_PARTNER.discountPercent,
            },
            expires_at: new Date(
              Date.now() + NUDGE_COOLDOWN_DAYS * 86_400_000,
            ).toISOString(),
          });
        if (insertErr) {
          logger.warn(
            "supplement_lapse_notification_failed",
            { supplement: i.supplement },
            insertErr,
          );
        }
      }
    }
  }

  return { insights, nudges };
}

/**
 * Get user's supplement list with today's status
 * GET /api/supplements
 */
async function getUserSupplements(userId) {
  try {
    const today = new Date().toISOString().split("T")[0];

    // Get user's supplements (if they have a custom list)
    const { data: userSupplements } = await supabaseAdmin
      .from("user_supplements")
      .select("*")
      .eq("user_id", userId)
      .eq("active", true);

    // Get today's logs
    const { data: todayLogs } = await supabaseAdmin
      .from("supplement_logs")
      .select("*")
      .eq("user_id", userId)
      .eq("date", today);

    // If user has custom supplements, use those
    if (userSupplements && userSupplements.length > 0) {
      const supplements = userSupplements.map((s) => {
        const takenToday = todayLogs?.some(
          (log) => log.supplement_name?.toLowerCase() === s.name?.toLowerCase(),
        );
        return {
          id: s.id,
          name: s.name,
          dosage: s.dosage,
          timing: s.timing || "anytime",
          category: s.category || "other",
          taken: takenToday || false,
          takenAt: takenToday
            ? todayLogs.find(
                (log) =>
                  log.supplement_name?.toLowerCase() === s.name?.toLowerCase(),
              )?.created_at
            : null,
        };
      });

      return { supplements, todayLogs: todayLogs || [] };
    }

    // Return empty - frontend will use defaults
    return { supplements: [], todayLogs: todayLogs || [] };
  } catch (error) {
    logger.error("user_supplements_fetch_failed", error, {});
    return { supplements: [], todayLogs: [] };
  }
}

const handler = async (event, context) => {
  // Extract sub-path
  const path = event.path.replace("/.netlify/functions/supplements", "");

  return baseHandler(event, context, {
    functionName: "supplements",
    allowedMethods: ["GET", "POST"],
    rateLimitType: event.httpMethod === "POST" ? "CREATE" : "READ",
    requireAuth: true, // P0-009: Explicitly require authentication for supplement data
    handler: async (event, context, { userId }) => {
      try {
        if (event.httpMethod === "POST") {
          let body;
          const parsedBody = tryParseJsonObjectBody(event.body);
          if (!parsedBody.ok) {
            return parsedBody.error;
          }
          body = parsedBody.data;

          // POST /api/supplements/stack — manage the athlete's curated supplement list
          if (path.includes("/stack")) {
            const result = await upsertUserSupplement(userId, body);
            return createSuccessResponse(
              result,
              201,
              "Supplement saved to your stack",
            );
          }

          // POST /api/supplements/log — legacy single-log (now idempotent upsert)
          if (path.includes("/log") || path.endsWith("/log")) {
            const result = await logSupplement(userId, body);
            return createSuccessResponse(result, 201, "Supplement logged");
          }

          // POST /api/supplements — daily log: { date?, supplements: [...] } or a single item
          const items = Array.isArray(body.supplements)
            ? body.supplements
            : [body];
          const result = await upsertSupplements(userId, items, body.date);
          return createSuccessResponse(result, 200, "Supplements logged");
        }

        // Handle GET requests
        if (path.includes("/insights")) {
          const result = await getSupplementInsights(userId);
          return createSuccessResponse(result);
        }

        if (path.includes("/recent") || path.endsWith("/recent")) {
          const result = await getRecentSupplementLogs(userId);
          return createSuccessResponse({ logs: result });
        }

        if (path.includes("/logs") || path.endsWith("/logs")) {
          const queryLimit = event.queryStringParameters?.limit;
          const limit =
            queryLimit === undefined
              ? 30
              : parseBoundedInt(String(queryLimit), "limit", {
                  min: 1,
                  max: 200,
                });
          const result = await getSupplementLogs(userId, limit);
          return createSuccessResponse({ logs: result });
        }

        // Default: return user supplements with today's status
        const result = await getUserSupplements(userId);
        return createSuccessResponse(result);
      } catch (error) {
        if (
          error?.isValidation ||
          error?.message?.includes("must be an integer between")
        ) {
          return createErrorResponse(error.message, 422, "validation_error");
        }

        return createErrorResponse(
          "Failed to process supplements request",
          500,
          "internal_error",
        );
      }
    },
  });
};

export const testHandler = handler;
export { handler };
