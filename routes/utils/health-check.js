/**
 * Shared Health Check Utility for Express Routes
 * Provides consistent health check response format across all route files
 *
 * @module routes/utils/health-check
 * @version 1.1.0
 */

import { checkDatabaseHealth } from "./database.js";
import { safeFormatDate } from "./query-helper.js";
import { serverLogger } from "./server-logger.js";
import { getCacheStats } from "./cache.js";

/**
 * Create a health check handler for a specific route/service
 * @param {string} serviceName - Name of the service (e.g., 'algorithm', 'analytics', 'dashboard')
 * @param {string} version - Service version (default: '2.1.0')
 * @returns {function} Express route handler
 */
export function createHealthCheckHandler(serviceName, version = "2.1.0") {
  return async (req, res) => {
    try {
      const dbHealth = await checkDatabaseHealth();

      const cacheStats = getCacheStats();

      const healthStatus = {
        success:
          dbHealth.supabase === "connected" ||
          dbHealth.postgres === "connected",
        status:
          dbHealth.supabase === "connected" || dbHealth.postgres === "connected"
            ? "healthy"
            : "unhealthy",
        service: serviceName,
        version,
        timestamp: safeFormatDate(new Date()),
        database: {
          supabase: dbHealth.supabase,
          postgres: dbHealth.postgres,
          latency: dbHealth.latency ? `${dbHealth.latency}ms` : null,
        },
        cache: {
          size: cacheStats.size,
          hitRate: cacheStats.hitRate,
          hits: cacheStats.hits,
          misses: cacheStats.misses,
        },
      };

      const statusCode = healthStatus.success ? 200 : 503;
      res.status(statusCode).json(healthStatus);
    } catch (error) {
      serverLogger.error(
        `${serviceName.toUpperCase()} health check error:`,
        error,
      );
      res.status(503).json({
        success: false,
        status: "unhealthy",
        service: serviceName,
        message: "Health check failed",
        timestamp: safeFormatDate(new Date()),
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };
}

export default { createHealthCheckHandler };
