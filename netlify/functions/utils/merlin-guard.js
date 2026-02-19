import { createClient } from "@supabase/supabase-js";
const TRAINING_SESSIONS_TABLE = "training_sessions";

/**
 * Merlin AI Guard - Hard Technical Enforcement
 * Contract: Merlin AI Authority & Refusal Contract v1
 * NO PROMPT RELIANCE - All enforcement is technical
 */

/**
 * Check if request is from Merlin AI
 * HARD ENFORCEMENT: Checks token itself, not just headers
 * Identifies Merlin by:
 * 1. Authorization header token matches MERLIN_READONLY_KEY exactly
 * 2. Token is a JWT with role='merlin_readonly' in claims
 * 3. User agent header (secondary check)
 */
function isMerlinRequest(headers, userMetadata, token = null) {
  const authHeader = headers["authorization"] || headers["Authorization"] || "";
  const merlinKey = process.env.MERLIN_READONLY_KEY;

  // Primary check: Authorization header token matches Merlin readonly key exactly
  if (merlinKey && authHeader) {
    const tokenFromHeader = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (tokenFromHeader === merlinKey) {
      return true;
    }
  }

  // Secondary check: If token provided, verify it's Merlin readonly JWT
  if (token) {
    try {
      // Decode JWT without verification (we just need to check claims)
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
        if (
          payload.role === "merlin_readonly" ||
          payload.aud === "merlin_readonly"
        ) {
          return true;
        }
      }
    } catch (e) {
      // Not a JWT or invalid, continue with other checks
    }
  }

  const userAgent = headers["user-agent"] || "";

  // Check user agent (less reliable, but additional signal)
  if (userAgent.includes("Merlin-AI") || userAgent.includes("merlin")) {
    return true;
  }

  // Check role metadata (if available from authenticated user)
  if (
    userMetadata?.role === "merlin" ||
    userMetadata?.role === "ai" ||
    userMetadata?.role === "merlin_readonly"
  ) {
    return true;
  }

  return false;
}

/**
 * Deny-list of mutation endpoints Merlin MUST NOT call
 */
const MERLIN_DENY_LIST = [
  "PUT /api/training-sessions/:id",
  "POST /api/training-sessions",
  "DELETE /api/training-sessions/:id",
  "PUT /api/wellness-checkins/:id",
  "POST /api/wellness-checkins",
  "PUT /api/readiness/:id",
  "POST /api/coach-modifications",
  "PUT /api/coach-modifications/:id",
  "DELETE /api/coach-modifications/:id",
  "POST /api/execution-logs",
  "PUT /api/execution-logs/:id",
  "POST /api/consent-settings",
  "PUT /api/consent-settings/:id",
];

/**
 * Check if endpoint is mutation endpoint
 */
function isMutationEndpoint(method, path) {
  const normalizedPath = path.replace(/\/\d+/g, "/:id"); // Normalize IDs
  const endpoint = `${method} ${normalizedPath}`;

  return (
    MERLIN_DENY_LIST.includes(endpoint) ||
    (method !== "GET" && method !== "HEAD" && method !== "OPTIONS")
  );
}

/**
 * Guard middleware for Merlin requests
 * HARD ENFORCEMENT: Blocks ALL mutations regardless of payload, route, or prompt
 * MUST be called BEFORE baseHandler authentication
 * Returns error response if blocked, false if allowed
 */
function guardMerlinRequest(req, res, next) {
  const headers = req.headers || {};
  const userMetadata = req.user?.user_metadata || {};
  const authHeader = headers["authorization"] || headers["Authorization"] || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  // Check if this is a Merlin request
  if (!isMerlinRequest(headers, userMetadata, token)) {
    if (next) {
      return next();
    } // Not Merlin, proceed normally
    return false; // Not Merlin, allow
  }

  // Merlin request detected - HARD BLOCK on ALL mutations
  // This check happens BEFORE any handler logic, regardless of:
  // - Payload content
  // - Route path
  // - Prompt instructions
  // - Any other factor
  if (isMutationEndpoint(req.method, req.path)) {
    // Log violation IMMEDIATELY
    logMerlinViolation(req, "MUTATION_ATTEMPT").catch((err) => {
      console.error("[Merlin Guard] Failed to log violation:", err);
    });

    if (res && res.status) {
      return res.status(403).json({
        error: "MERLIN_WRITE_FORBIDDEN",
        code: "MERLIN_READ_ONLY",
        message:
          "Merlin AI has read-only database access. All mutation endpoints are technically forbidden at the database role level.",
        endpoint: `${req.method} ${req.path}`,
        contract: "Merlin AI Authority & Refusal Contract v1, Section 2.1",
        technical_note:
          "merlin_readonly role lacks INSERT, UPDATE, DELETE privileges",
      });
    }

    // Return error response object (for Netlify functions)
    return {
      statusCode: 403,
      body: JSON.stringify({
        error: "MERLIN_WRITE_FORBIDDEN",
        code: "MERLIN_READ_ONLY",
        message:
          "Merlin AI has read-only database access. All mutation endpoints are technically forbidden at the database role level.",
        endpoint: `${req.method} ${req.path}`,
        contract: "Merlin AI Authority & Refusal Contract v1, Section 2.1",
        technical_note:
          "merlin_readonly role lacks INSERT, UPDATE, DELETE privileges",
      }),
      headers: { "Content-Type": "application/json" },
    };
  }

  // Read-only request allowed
  if (next) {
    return next();
  }
  return false; // Allow
}

/**
 * Log Merlin violation attempt
 */
async function logMerlinViolation(req, violationType) {
  // Use read-only Supabase client (Merlin's own client)
  // This log goes to append-only audit table
  // CRITICAL: Do NOT fallback to service_role key - it has write access
  const merlinKey = process.env.MERLIN_READONLY_KEY;
  if (!merlinKey) {
    console.error(
      "[Merlin Guard] MERLIN_READONLY_KEY not configured - cannot log violation",
    );
    return; // Fail silently - don't use service_role as fallback
  }

  const supabaseReadOnly = createClient(process.env.SUPABASE_URL, merlinKey);

  // Create violation log table if it doesn't exist (via migration)
  await supabaseReadOnly
    .from("merlin_violation_log")
    .insert({
      violation_type: violationType,
      endpoint: `${req.method} ${req.path}`,
      request_body: req.body
        ? JSON.stringify(req.body).substring(0, 1000)
        : null,
      user_agent: req.headers["user-agent"],
      timestamp: new Date().toISOString(),
    })
    .catch(() => {
      // Table may not exist yet, log to console
      console.error("Merlin violation:", violationType, req.method, req.path);
    });
}

/**
 * Check coach_locked state before Merlin reads session
 * Merlin MUST refuse to help modify coach-locked sessions
 */
async function checkCoachLockedForMerlin(sessionId) {
  const merlinKey = process.env.MERLIN_READONLY_KEY;
  if (!merlinKey) {
    console.error("[Merlin Guard] MERLIN_READONLY_KEY not configured");
    return { locked: false, error: "MERLIN_READONLY_KEY not configured" };
  }

  const supabaseReadOnly = createClient(process.env.SUPABASE_URL, merlinKey);

  const { data: session, error } = await supabaseReadOnly
    .from(TRAINING_SESSIONS_TABLE)
    .select("coach_locked, modified_by_coach_id, session_state")
    .eq("id", sessionId)
    .single();

  if (error) {
    return { locked: false, error };
  }

  return {
    locked: session.coach_locked === true,
    coachId: session.modified_by_coach_id,
    state: session.session_state,
  };
}

export { isMerlinRequest,
  isMutationEndpoint,
  guardMerlinRequest,
  logMerlinViolation,
  checkCoachLockedForMerlin, };
