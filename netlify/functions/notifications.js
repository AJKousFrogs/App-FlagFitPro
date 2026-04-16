/**
 * Notifications Domain Handler — Netlify Functions v2 (native, no adapter)
 *
 * Consolidates four legacy functions into one:
 *   • notifications.js          GET/PATCH/POST /api/notifications
 *   • notifications-count.js    GET /api/notifications/count
 *   • notifications-create.js   POST /api/notifications/create
 *   • notifications-preferences.js  GET/PUT /api/notifications/preferences
 *
 * Routes handled:
 *   GET    /api/notifications                 → list notifications (paginated)
 *   GET    /api/notifications/count           → unread count + last-opened timestamp
 *   GET    /api/notifications/preferences     → user notification preferences
 *   POST   /api/notifications                 → mark notification(s) as read
 *   POST   /api/notifications/create          → create a new notification
 *   PATCH  /api/notifications/last-opened     → update last-opened timestamp
 *   PUT    /api/notifications/preferences     → update user notification preferences
 *   POST   /api/notifications/preferences     → update user notification preferences
 */

import { db } from "./supabase-client.js";
import { authenticateRequest } from "./utils/auth-helper.js";
import { applyRateLimit } from "./utils/rate-limiter.js";
import { createLogger } from "./utils/structured-logger.js";

const logger = createLogger({ service: "netlify.notifications" });

// ─── Constants ──────────────────────────────────────────────────────────────

const MAX_MESSAGE_LENGTH = 2000;
const VALID_PRIORITIES = new Set(["low", "normal", "high"]);
const VALID_NOTIFICATION_TYPES = new Set([
  "training", "achievement", "team", "wellness", "general",
  "game", "tournament", "injury_risk", "weather",
]);
const VALID_CONFIG_KEYS = new Set(["muted", "pushEnabled", "inAppEnabled"]);

// ─── Shared response helpers ─────────────────────────────────────────────────

function corsHeaders(req) {
  const origin = req.headers.get("origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Request-Id, X-Correlation-Id",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
    "Content-Type": "application/json",
    Vary: "Origin",
  };
}

function ok(data, req, status = 200) {
  return Response.json({ success: true, data }, { status, headers: corsHeaders(req) });
}

function err(message, req, status = 400, code = "error") {
  return Response.json({ success: false, error: message, code }, { status, headers: corsHeaders(req) });
}

// ─── Validation helpers ──────────────────────────────────────────────────────

function parseStrictPositiveInt(raw, field, { min = 1, max = Infinity } = {}) {
  if (raw === undefined || raw === null || raw === "") return null;
  if (!/^\d+$/.test(String(raw))) throw new Error(`${field} must be a positive integer`);
  const parsed = parseInt(String(raw), 10);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(Number.isFinite(max)
      ? `${field} must be an integer between ${min} and ${max}`
      : `${field} must be an integer >= ${min}`);
  }
  return parsed;
}

function validateNotificationId(value, fieldName = "notificationId") {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${fieldName} must be a non-empty string`);
  }
  if (value.trim().length > 200) throw new Error(`${fieldName} is too long`);
  return value.trim();
}

function validatePreferencesPayload(preferences) {
  const errors = [];
  if (!preferences || typeof preferences !== "object" || Array.isArray(preferences)) {
    return ["preferences must be an object"];
  }
  for (const [type, config] of Object.entries(preferences)) {
    if (!VALID_NOTIFICATION_TYPES.has(type)) {
      errors.push(`Unknown notification type: ${type}`);
      continue;
    }
    if (!config || typeof config !== "object" || Array.isArray(config)) {
      errors.push(`${type}: config must be an object`);
      continue;
    }
    for (const key of Object.keys(config)) {
      if (!VALID_CONFIG_KEYS.has(key)) {
        errors.push(`${type}.${key}: unknown config key`);
      } else if (typeof config[key] !== "boolean") {
        errors.push(`${type}.${key} must be a boolean`);
      }
    }
  }
  return errors;
}

// ─── Auth + rate limit middleware ────────────────────────────────────────────

async function authenticate(req) {
  const fakeEvent = { headers: Object.fromEntries(req.headers) };
  return authenticateRequest(fakeEvent);
}

function checkRateLimit(req, userId, limitType) {
  const fakeEvent = {
    headers: Object.fromEntries(req.headers),
    httpMethod: req.method,
  };
  return applyRateLimit(fakeEvent, limitType, userId);
}

// ─── Route handlers ──────────────────────────────────────────────────────────

async function handleList(req, userId, url) {
  const rl = checkRateLimit(req, userId, "READ");
  if (rl) return Response.json(JSON.parse(rl.body), { status: rl.statusCode, headers: corsHeaders(req) });

  let limit = 20, page = 1, onlyUnread = false, lastOpenedAt = null;
  try {
    limit = parseStrictPositiveInt(url.searchParams.get("limit"), "limit", { min: 1, max: 100 }) ?? 20;
    page  = parseStrictPositiveInt(url.searchParams.get("page"), "page", { min: 1 }) ?? 1;
    const unreadParam = url.searchParams.get("onlyUnread");
    if (unreadParam !== null) {
      if (unreadParam !== "true" && unreadParam !== "false") throw new Error("onlyUnread must be true or false");
      onlyUnread = unreadParam === "true";
    }
    const laParam = url.searchParams.get("lastOpenedAt");
    if (laParam) {
      if (isNaN(new Date(laParam).getTime())) throw new Error("lastOpenedAt must be a valid date");
      lastOpenedAt = laParam;
    }
  } catch (ve) {
    return err(ve.message, req, 422, "validation_error");
  }

  try {
    const notifications = await db.notifications.getUserNotifications(userId, { limit, page, onlyUnread, lastOpenedAt });
    return ok(notifications, req);
  } catch (dbErr) {
    logger.error("notifications_list_query_failed", dbErr, { user_id: userId });
    return ok([], req); // degrade gracefully
  }
}

async function handleCount(req, userId) {
  const rl = checkRateLimit(req, userId, "READ");
  if (rl) return Response.json(JSON.parse(rl.body), { status: rl.statusCode, headers: corsHeaders(req) });

  try {
    const [rawCount, rawLastOpened] = await Promise.all([
      db.notifications.getUnreadCount(userId),
      db.notifications.getLastOpenedAt(userId),
    ]);
    const unreadCount = Math.max(0, Number.isInteger(rawCount) ? rawCount : 0);
    const lastOpenedAt = typeof rawLastOpened === "string" && !isNaN(new Date(rawLastOpened).getTime())
      ? rawLastOpened : null;
    return ok({ unreadCount, lastOpenedAt }, req);
  } catch (dbErr) {
    logger.error("notifications_count_query_failed", dbErr, { user_id: userId });
    return err("Failed to retrieve notification count", req, 500, "database_error");
  }
}

async function handleMarkRead(req, userId) {
  const rl = checkRateLimit(req, userId, "UPDATE");
  if (rl) return Response.json(JSON.parse(rl.body), { status: rl.statusCode, headers: corsHeaders(req) });

  let body;
  try {
    body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("body must be an object");
  } catch {
    return err("Request body must be a JSON object", req, 400, "invalid_json");
  }

  const { notificationId, ids } = body;

  if (notificationId === "all") {
    try {
      await db.notifications.markAllAsRead(userId);
      return ok(null, req, 200);
    } catch (dbErr) {
      logger.error("notifications_mark_all_failed", dbErr, { user_id: userId });
      return err("Failed to mark all notifications as read", req, 500, "database_error");
    }
  }

  if (Array.isArray(ids) && ids.length > 0) {
    const normalized = [];
    for (const id of ids) {
      try { normalized.push(validateNotificationId(id, "ids[]")); }
      catch (ve) { return err(ve.message, req, 422, "validation_error"); }
    }
    const unique = [...new Set(normalized)];
    if (unique.length === 0) return err("ids must contain at least one non-empty notification id", req, 422, "validation_error");
    if (unique.length > 100) return err("ids cannot contain more than 100 notification ids", req, 422, "validation_error");
    try {
      await db.notifications.markManyAsRead(userId, unique);
      return ok(null, req, 200);
    } catch (dbErr) {
      logger.error("notifications_mark_many_failed", dbErr, { user_id: userId, count: unique.length });
      return err("Failed to mark notifications as read", req, 500, "database_error");
    }
  }

  if (notificationId) {
    let nid;
    try { nid = validateNotificationId(notificationId); }
    catch (ve) { return err(ve.message, req, 422, "validation_error"); }
    try {
      await db.notifications.markAsRead(userId, nid);
      return ok(null, req, 200);
    } catch (dbErr) {
      logger.error("notifications_mark_one_failed", dbErr, { user_id: userId, notification_id: nid });
      return err("Failed to update notification", req, 500, "database_error");
    }
  }

  return err("notificationId or ids array is required", req, 422, "validation_error");
}

async function handleCreate(req, userId) {
  const rl = checkRateLimit(req, userId, "CREATE");
  if (rl) return Response.json(JSON.parse(rl.body), { status: rl.statusCode, headers: corsHeaders(req) });

  let body;
  try {
    body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
  } catch {
    return err("Request body must be a JSON object", req, 400, "invalid_json");
  }

  const { type, message, priority: rawPriority } = body;

  if (!type || typeof type !== "string" || !type.trim()) {
    return err("type is required", req, 422, "validation_error");
  }
  if (!message || typeof message !== "string" || !message.trim()) {
    return err("message is required", req, 422, "validation_error");
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return err(`message must not exceed ${MAX_MESSAGE_LENGTH} characters`, req, 422, "validation_error");
  }

  // Normalize priority aliases
  let priority = rawPriority;
  if (priority === "medium") priority = "normal";
  if (priority === "critical") priority = "urgent";
  if (priority !== undefined && !VALID_PRIORITIES.has(priority)) {
    return err(`priority must be one of: ${[...VALID_PRIORITIES].join(", ")}`, req, 422, "validation_error");
  }

  try {
    // Check if this type is muted in user preferences
    const prefs = await db.notifications.getUserPreferences(userId);
    const typePref = prefs?.[type.trim()];
    if (typePref?.muted === true) {
      const muted = await db.notifications.createNotification(userId, { type: type.trim(), message: message.trim(), priority });
      return ok({ ...muted, muted: true, mutedMessage: `Notifications of type "${type}" are muted in your preferences` }, req, 201);
    }

    const notification = await db.notifications.createNotification(userId, { type: type.trim(), message: message.trim(), priority });
    return ok(notification, req, 201);
  } catch (dbErr) {
    logger.error("notifications_create_failed", dbErr, { user_id: userId, type });
    if (dbErr?.code === "23514" || dbErr?.message?.includes("validation")) {
      return err(dbErr.message, req, 422, "validation_error");
    }
    return err("Failed to create notification", req, 500, "database_error");
  }
}

async function handleUpdateLastOpened(req, userId) {
  const rl = checkRateLimit(req, userId, "UPDATE");
  if (rl) return Response.json(JSON.parse(rl.body), { status: rl.statusCode, headers: corsHeaders(req) });

  try {
    await db.notifications.updateLastOpenedAt(userId);
    return ok(null, req, 200);
  } catch (dbErr) {
    logger.error("notifications_update_last_opened_failed", dbErr, { user_id: userId });
    return err("Failed to update last opened timestamp", req, 500, "database_error");
  }
}

async function handleGetPreferences(req, userId) {
  const rl = checkRateLimit(req, userId, "READ");
  if (rl) return Response.json(JSON.parse(rl.body), { status: rl.statusCode, headers: corsHeaders(req) });

  try {
    const prefs = await db.notifications.getUserPreferences(userId);
    return ok(prefs, req);
  } catch (dbErr) {
    logger.error("notifications_get_prefs_failed", dbErr, { user_id: userId });
    return err("Failed to retrieve notification preferences", req, 500, "database_error");
  }
}

async function handleUpdatePreferences(req, userId) {
  const rl = checkRateLimit(req, userId, "UPDATE");
  if (rl) return Response.json(JSON.parse(rl.body), { status: rl.statusCode, headers: corsHeaders(req) });

  let body;
  try {
    body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
  } catch {
    return err("Request body must be a JSON object", req, 400, "invalid_json");
  }

  const errors = validatePreferencesPayload(body.preferences);
  if (errors.length > 0) {
    return err(errors.join("; "), req, 422, "validation_error");
  }

  try {
    const updated = await db.notifications.updateUserPreferences(userId, body.preferences);
    return ok(updated, req);
  } catch (dbErr) {
    logger.error("notifications_update_prefs_failed", dbErr, { user_id: userId });
    return err("Failed to update notification preferences", req, 500, "database_error");
  }
}

// ─── Main router ─────────────────────────────────────────────────────────────

export default async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  const url = new URL(req.url);

  // Normalise path: strip Netlify function prefix and query string
  // Matches: /api/notifications, /api/notifications/count, etc.
  const rawPath = url.pathname;
  const segment = rawPath
    .replace(/^\/\.netlify\/functions\/notifications/, "")
    .replace(/^\/api\/notifications/, "")
    .replace(/\/$/, "") // trailing slash
    || "";

  // Auth (all routes require authentication)
  const authResult = await authenticate(req);
  if (!authResult.success) {
    return err("Authorization required", req, 401, "unauthorized");
  }
  const userId = authResult.user.id;

  const method = req.method.toUpperCase();

  // Route dispatch
  try {
    if (segment === "" || segment === "/") {
      if (method === "GET")   return handleList(req, userId, url);
      if (method === "POST")  return handleMarkRead(req, userId);
      if (method === "PATCH") return handleUpdateLastOpened(req, userId);
    }

    if (segment === "/count" && method === "GET") {
      return handleCount(req, userId);
    }

    if (segment === "/last-opened" && method === "PATCH") {
      return handleUpdateLastOpened(req, userId);
    }

    if (segment === "/create" && method === "POST") {
      return handleCreate(req, userId);
    }

    if (segment === "/preferences") {
      if (method === "GET") return handleGetPreferences(req, userId);
      if (method === "PUT" || method === "POST") return handleUpdatePreferences(req, userId);
    }

    return err(`Not found: ${method} /api/notifications${segment}`, req, 404, "not_found");
  } catch (unhandled) {
    logger.error("notifications_unhandled_error", unhandled, { user_id: userId, segment, method });
    return err("Internal server error", req, 500, "internal_error");
  }
};
