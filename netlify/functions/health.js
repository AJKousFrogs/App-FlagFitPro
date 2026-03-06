import { createRuntimeV2Handler } from "./utils/runtime-v2-adapter.js";

// Netlify Function: Health Check
// Provides system health status for monitoring and debugging
// Endpoint: /api/health
//
// This endpoint does NOT require authentication and is rate-limited separately

import { supabaseAdmin } from "./utils/supabase-client.js";
import { lookup } from "node:dns/promises";

import { createSuccessResponse, createErrorResponse } from "./utils/error-handler.js";
import { baseHandler } from "./utils/base-handler.js";

// Check database connectivity
async function checkDatabase() {
  try {
    const startTime = Date.now();
    let lastError = null;

    for (let attempt = 1; attempt <= 2; attempt += 1) {
      const { error } = await supabaseAdmin.from("users").select("id").limit(1);
      if (!error) {
        return {
          status: "healthy",
          latency: Date.now() - startTime,
        };
      }

      lastError = error;
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

    return {
      status: "unhealthy",
      latency: Date.now() - startTime,
      error: "Database check failed",
    };
  } catch (error) {
    console.error("[health] Database health check error:", error);
    return {
      status: "unhealthy",
      error: "Database check failed",
    };
  }
}

// Check Supabase Auth service
async function checkAuth() {
  try {
    const startTime = Date.now();
    // Just verify the auth client is configured
    const isConfigured = !!supabaseAdmin.auth;
    const latency = Date.now() - startTime;

    return {
      status: isConfigured ? "healthy" : "unhealthy",
      latency,
    };
  } catch (error) {
    console.error("[health] Auth health check error:", error);
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
    handler: async (_event, _context, { requestId }) => {
      try {
        const startTime = Date.now();

        // Run health checks in parallel
        const [dbHealth, authHealth] = await Promise.all([
          checkDatabase(),
          checkAuth(),
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
        console.error("[health] Unexpected handler error:", error);
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
export default createRuntimeV2Handler(handler);
