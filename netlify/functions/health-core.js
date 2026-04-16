
// Netlify Function: Health Check
// Provides system health status for monitoring and debugging
// Endpoint: /api/health
//
// This endpoint does NOT require authentication and is rate-limited separately

import { supabase, supabaseAdmin } from "./supabase-client.js";
import { lookup } from "node:dns/promises";

import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";
import { buildRequestLogContext, createLogger } from "./utils/structured-logger.js";

function isMissingResourceError(error) {
  const code = error?.code;
  const message = `${error?.message || ""}`.toLowerCase();
  return (
    ["PGRST106", "PGRST116", "PGRST204", "42P01", "42703"].includes(code) ||
    message.includes("relation") ||
    message.includes("schema cache") ||
    message.includes("does not exist")
  );
}

const logger = createLogger({ service: "netlify.health" });

function createRequestLogger(event, meta = {}) {
  return logger.child(
    buildRequestLogContext(event, {
      request_id: meta.requestId,
      correlation_id: meta.correlationId,
      trace_id: meta.traceId ?? meta.correlationId,
    }),
  );
}

// Check database connectivity
function getSupabaseConfigStatus() {
  return {
    hasUrl: !!process.env.SUPABASE_URL,
    hasServiceKey:
      !!process.env.SUPABASE_SERVICE_KEY ||
      !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasAnonKey:
      !!process.env.SUPABASE_ANON_KEY ||
      !!process.env.VITE_SUPABASE_ANON_KEY,
    hasAdminClient: !!supabaseAdmin,
    hasAnonClient: !!supabase,
  };
}

async function checkDatabase(log = logger) {
  try {
    const config = getSupabaseConfigStatus();
    if (!config.hasAdminClient) {
      return {
        status: "unhealthy",
        error: "Supabase admin client is not configured",
      };
    }

    const startTime = Date.now();
    let lastError = null;

    const probeTables = ["team_members", "users", "daily_wellness_checkin"];

    for (const table of probeTables) {
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        const { error } = await supabaseAdmin.from(table).select("*").limit(1);
        if (!error) {
          return {
            status: "healthy",
            latency: Date.now() - startTime,
            probeTable: table,
          };
        }

        lastError = error;
        if (isMissingResourceError(error)) {
          break;
        }

        const isTransientFetchError = error.message?.includes("fetch failed");
        if (!isTransientFetchError || attempt === 2) {
          break;
        }

        try {
          await lookup(new URL(process.env.SUPABASE_URL).hostname);
        } catch (_dnsError) {
          // Keep lastError from Supabase query for consistent response shape.
        }
      }
    }

    return {
      status: "unhealthy",
      latency: Date.now() - startTime,
      error: lastError?.message || "Database check failed",
    };
  } catch (error) {
    log.error("health_database_check_error", error, {
      step: "database_probe",
    });
    return {
      status: "unhealthy",
      error: "Database check failed",
    };
  }
}

// Check Supabase Auth service
async function checkAuth(log = logger) {
  try {
    const startTime = Date.now();
    // Just verify the auth client is configured
    const isConfigured = !!supabaseAdmin?.auth;
    const latency = Date.now() - startTime;

    return {
      status: isConfigured ? "healthy" : "unhealthy",
      latency,
    };
  } catch (error) {
    log.error("health_auth_check_error", error, {
      step: "auth_probe",
    });
    return {
      status: "unhealthy",
      error: "Auth check failed",
    };
  }
}

// Get system info
function getSystemInfo() {
  return {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    uptime: process.uptime(),
    memoryUsage: {
      heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
      rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)}MB`,
    },
    environment: process.env.NODE_ENV || "development",
  };
}

const handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "health",
    allowedMethods: ["GET", "HEAD"],
    rateLimitType: "READ",
    requireAuth: false, // Health checks should be public
    skipEnvCheck: true,
    handler: async (_event, _context, { requestId, correlationId }) => {
      const requestLogger = createRequestLogger(event, {
        requestId,
        correlationId,
      });
      try {
        const startTime = Date.now();

        // Run health checks in parallel
        const [dbHealth, authHealth] = await Promise.all([
          checkDatabase(requestLogger),
          checkAuth(requestLogger),
        ]);

        const totalLatency = Date.now() - startTime;

        // Determine overall status
        const overallStatus =
          dbHealth.status === "healthy" && authHealth.status === "healthy"
            ? "healthy"
            : "degraded";

        const response = {
          status: overallStatus,
          timestamp: new Date().toISOString(),
          version: "1.0.0",
          config: getSupabaseConfigStatus(),
          checks: {
            database: dbHealth,
            auth: authHealth,
          },
          system: getSystemInfo(),
          totalLatency,
        };

        // Use appropriate status code
        const statusCode = overallStatus === "healthy" ? 200 : 503;

        return createSuccessResponse(response, statusCode);
      } catch (error) {
        requestLogger.error("health_handler_error", error, {
          path: event.path,
        });
        return createErrorResponse(
          "Health check failed",
          500,
          "health_check_error",
          requestId,
        );
      }
    },
  });
};

export const testHandler = handler;
export { handler };
