// Netlify Function: Health Check
// Provides system health status for monitoring and debugging
// Endpoint: /api/health
//
// This endpoint does NOT require authentication and is rate-limited separately

const { supabaseAdmin } = require("./supabase-client.cjs");
const { createSuccessResponse } = require("./utils/error-handler.cjs");
const { baseHandler } = require("./utils/base-handler.cjs");

// Check database connectivity
async function checkDatabase() {
  try {
    const startTime = Date.now();
    const { error } = await supabaseAdmin
      .from("users")
      .select("id")
      .limit(1);
    
    const latency = Date.now() - startTime;
    
    if (error) {
      return {
        status: "unhealthy",
        latency,
        error: error.message,
      };
    }
    
    return {
      status: "healthy",
      latency,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      error: error.message,
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
    return {
      status: "unhealthy",
      error: error.message,
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
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + "MB",
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + "MB",
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + "MB",
    },
    environment: process.env.NODE_ENV || "development",
  };
}

exports.handler = async (event, context) => {
  return baseHandler(event, context, {
    functionName: "health",
    allowedMethods: ["GET"],
    rateLimitType: "READ",
    requireAuth: false, // Health checks should be public
    handler: async (event, _context, { requestId }) => {
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

      return createSuccessResponse(response, requestId, statusCode);
    },
  });
};

