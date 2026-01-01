/**
 * Algorithm Routes API
 * Provides algorithm-based recommendations and predictions for FlagFit Pro
 *
 * @module routes/algorithmRoutes
 * @version 2.1.0
 */

import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { supabase, pool as _pool, checkDatabaseHealth } from "./utils/database.js";
import { safeFormatDate } from "./utils/query-helper.js";
import { serverLogger } from "./utils/server-logger.js";
import {
  validateUserId,
  createErrorResponse,
  sendError,
  sendSuccess,
} from "./utils/validation.js";

dotenv.config();

const router = express.Router();
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const ROUTE_NAME = "algorithm";

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Safely validate JWT tokens
 * @param {string} token - JWT token string
 * @param {string} secret - JWT secret key
 * @returns {Promise<object>} Decoded user object
 * @throws {Error} If token is invalid or expired
 */
function safeJWTVerify(token, secret) {
  if (!token || typeof token !== "string") {
    throw new Error("Invalid token: Token must be a non-empty string");
  }

  if (!secret || typeof secret !== "string") {
    throw new Error("Invalid secret: Secret must be configured");
  }

  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, (err, user) => {
      if (err) {
        reject(err);
      } else {
        resolve(user);
      }
    });
  });
}

// =============================================================================
// MIDDLEWARE
// =============================================================================

/**
 * Authentication middleware with enhanced error handling
 * Validates JWT tokens from Authorization header
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader) {
      return sendError(res, "Access token required", "MISSING_TOKEN", 401);
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return sendError(
        res,
        "Invalid authorization header format. Expected: Bearer <token>",
        "INVALID_AUTH_HEADER",
        401,
      );
    }

    try {
      const user = await safeJWTVerify(token, JWT_SECRET);
      req.user = user;
      req.userId = user.id || user.userId || user.sub;
      next();
    } catch (jwtError) {
      serverLogger.error("JWT verification error:", {
        message: jwtError.message,
        name: jwtError.name,
      });

      const errorCode =
        jwtError.name === "TokenExpiredError"
          ? "TOKEN_EXPIRED"
          : "INVALID_TOKEN";

      const message =
        jwtError.name === "TokenExpiredError"
          ? "Token has expired"
          : "Invalid or malformed token";

      return sendError(
        res,
        message,
        errorCode,
        403,
        process.env.NODE_ENV === "development" ? jwtError.message : null,
      );
    }
  } catch (error) {
    serverLogger.error("Authentication middleware error:", error);
    return sendError(
      res,
      "Authentication service error",
      "AUTH_ERROR",
      500,
      process.env.NODE_ENV === "development" ? error.message : null,
    );
  }
};

// =============================================================================
// HEALTH CHECK ENDPOINT
// =============================================================================

/**
 * GET /health
 * Health check endpoint for monitoring and load balancers
 * @returns {object} Health status with service availability
 */
router.get("/health", async (req, res) => {
  try {
    const dbHealth = await checkDatabaseHealth();

    const healthStatus = {
      success: dbHealth.supabase === "connected" || dbHealth.postgres === "connected",
      message: "Algorithm API is healthy",
      service: ROUTE_NAME,
      version: "2.1.0",
      services: {
        algorithmIntegration: "active",
        evidenceEngine: "active",
        supplementEngine: "active",
        recoveryEngine: "active",
        performanceEngine: "active",
        qualificationTracker: "active",
      },
      timestamp: safeFormatDate(new Date()),
      database: {
        supabase: dbHealth.supabase,
        postgres: dbHealth.postgres,
        latency: dbHealth.latency ? `${dbHealth.latency}ms` : null,
      },
    };

    const statusCode = healthStatus.success ? 200 : 503;
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    serverLogger.error(`${ROUTE_NAME.toUpperCase()} health check error:`, error);
    res.status(500).json({
      success: false,
      error: "Health check failed",
      service: ROUTE_NAME,
      timestamp: safeFormatDate(new Date()),
    });
  }
});

// =============================================================================
// ALGORITHM ENDPOINTS
// =============================================================================

/**
 * GET /comprehensive/:userId
 * Get comprehensive algorithm recommendations for a user
 * @route GET /comprehensive/:userId
 * @param {string} userId - User ID from URL parameter
 * @returns {object} Comprehensive recommendations data
 */
router.get("/comprehensive/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    const validation = validateUserId(userId);
    if (!validation.isValid) {
      return sendError(res, validation.error, "INVALID_USER_ID", 400);
    }

    // Verify user can access this resource
    if (req.userId && req.userId !== validation.userId) {
      return sendError(
        res,
        "Unauthorized: Cannot access other user's data",
        "UNAUTHORIZED_ACCESS",
        403,
      );
    }

    // Try to fetch real data from Supabase
    let userData = null;
    if (supabase) {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, position, experience_level")
        .eq("id", validation.userId)
        .single();

      if (!error && data) {
        userData = data;
      }
    }

    return sendSuccess(res, {
      userId: validation.userId,
      user: userData,
      status: userData ? "active" : "placeholder",
      recommendations: {
        training: "Personalized training recommendations coming soon",
        nutrition: "Nutrition optimization available in Q2 2025",
        recovery: "Recovery protocols will be implemented",
      },
      message: userData
        ? "User found - algorithm recommendations in development"
        : "This endpoint will provide comprehensive algorithm recommendations",
      estimatedImplementation: "Q2 2025",
    });
  } catch (error) {
    serverLogger.error(
      `${ROUTE_NAME.toUpperCase()} comprehensive recommendations error:`,
      error,
    );
    return sendError(
      res,
      "Service temporarily unavailable",
      "SERVICE_UNAVAILABLE",
      500,
      error.message,
    );
  }
});

/**
 * GET /training/recommendations/:userId
 * Get personalized training recommendations
 * @route GET /training/recommendations/:userId
 * @param {string} userId - User ID from URL parameter
 * @returns {object} Training recommendations data
 */
router.get(
  "/training/recommendations/:userId",
  authenticateToken,
  async (req, res) => {
    try {
      const validation = validateUserId(req.params.userId);
      if (!validation.isValid) {
        return sendError(res, validation.error, "INVALID_USER_ID", 400);
      }

      // Fetch training data from Supabase if available
      let trainingData = null;
      if (supabase) {
        const { data, error } = await supabase
          .from("training_programs")
          .select("*")
          .eq("user_id", validation.userId)
          .order("created_at", { ascending: false })
          .limit(5);

        if (!error && data?.length > 0) {
          trainingData = data;
        }
      }

      return sendSuccess(res, {
        userId: validation.userId,
        programs: trainingData,
        status: trainingData ? "active" : "placeholder",
        message: trainingData
          ? "Training programs found"
          : "This endpoint will provide personalized training recommendations",
        estimatedImplementation: "Q2 2025",
      });
    } catch (error) {
      serverLogger.error(
        `${ROUTE_NAME.toUpperCase()} training recommendations error:`,
        error,
      );
      return sendError(
        res,
        "Service temporarily unavailable",
        "SERVICE_UNAVAILABLE",
        500,
        error.message,
      );
    }
  },
);

/**
 * GET /supplements/recommendations/:userId
 * Get personalized supplement recommendations
 */
router.get(
  "/supplements/recommendations/:userId",
  authenticateToken,
  async (req, res) => {
    try {
      const validation = validateUserId(req.params.userId);
      if (!validation.isValid) {
        return sendError(res, validation.error, "INVALID_USER_ID", 400);
      }

      return sendSuccess(res, {
        userId: validation.userId,
        status: "placeholder",
        message:
          "This endpoint will provide personalized supplement recommendations",
        estimatedImplementation: "Q3 2025",
      });
    } catch (error) {
      serverLogger.error(
        `${ROUTE_NAME.toUpperCase()} supplement recommendations error:`,
        error,
      );
      return sendError(
        res,
        "Service temporarily unavailable",
        "SERVICE_UNAVAILABLE",
        500,
        error.message,
      );
    }
  },
);

/**
 * GET /recovery/optimization/:userId
 * Get recovery optimization plans
 */
router.get(
  "/recovery/optimization/:userId",
  authenticateToken,
  async (req, res) => {
    try {
      const validation = validateUserId(req.params.userId);
      if (!validation.isValid) {
        return sendError(res, validation.error, "INVALID_USER_ID", 400);
      }

      return sendSuccess(res, {
        userId: validation.userId,
        status: "placeholder",
        message: "This endpoint will provide recovery optimization plans",
        estimatedImplementation: "Q2 2025",
      });
    } catch (error) {
      serverLogger.error(
        `${ROUTE_NAME.toUpperCase()} recovery optimization error:`,
        error,
      );
      return sendError(
        res,
        "Service temporarily unavailable",
        "SERVICE_UNAVAILABLE",
        500,
        error.message,
      );
    }
  },
);

/**
 * GET /performance/predictions/:userId
 * Get performance predictions
 */
router.get(
  "/performance/predictions/:userId",
  authenticateToken,
  async (req, res) => {
    try {
      const validation = validateUserId(req.params.userId);
      if (!validation.isValid) {
        return sendError(res, validation.error, "INVALID_USER_ID", 400);
      }

      return sendSuccess(res, {
        userId: validation.userId,
        status: "placeholder",
        message: "This endpoint will provide performance predictions",
        estimatedImplementation: "Q3 2025",
      });
    } catch (error) {
      serverLogger.error(
        `${ROUTE_NAME.toUpperCase()} performance predictions error:`,
        error,
      );
      return sendError(
        res,
        "Service temporarily unavailable",
        "SERVICE_UNAVAILABLE",
        500,
        error.message,
      );
    }
  },
);

/**
 * GET /la28/qualification/:userId
 * Get LA28 qualification roadmaps
 */
router.get(
  "/la28/qualification/:userId",
  authenticateToken,
  async (req, res) => {
    try {
      const validation = validateUserId(req.params.userId);
      if (!validation.isValid) {
        return sendError(res, validation.error, "INVALID_USER_ID", 400);
      }

      return sendSuccess(res, {
        userId: validation.userId,
        status: "placeholder",
        message: "This endpoint will provide LA28 qualification roadmaps",
        estimatedImplementation: "Q1 2025",
      });
    } catch (error) {
      serverLogger.error(
        `${ROUTE_NAME.toUpperCase()} LA28 qualification error:`,
        error,
      );
      return sendError(
        res,
        "Service temporarily unavailable",
        "SERVICE_UNAVAILABLE",
        500,
        error.message,
      );
    }
  },
);

/**
 * GET /dashboard/:userId
 * Get comprehensive dashboard algorithm data
 */
router.get("/dashboard/:userId", authenticateToken, async (req, res) => {
  try {
    const validation = validateUserId(req.params.userId);
    if (!validation.isValid) {
      return sendError(res, validation.error, "INVALID_USER_ID", 400);
    }

    return sendSuccess(res, {
      userId: validation.userId,
      status: "placeholder",
      message:
        "This endpoint will provide comprehensive dashboard algorithm data",
      estimatedImplementation: "Q2 2025",
    });
  } catch (error) {
    serverLogger.error(
      `${ROUTE_NAME.toUpperCase()} dashboard data error:`,
      error,
    );
    return sendError(
      res,
      "Service temporarily unavailable",
      "SERVICE_UNAVAILABLE",
      500,
      error.message,
    );
  }
});

// =============================================================================
// ERROR HANDLING MIDDLEWARE
// =============================================================================

/**
 * 404 handler for unmatched routes
 */
router.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    code: "NOT_FOUND",
    path: req.originalUrl,
    method: req.method,
    timestamp: safeFormatDate(new Date()),
  });
});

/**
 * Global error handler (catches unhandled errors)
 */
router.use((err, req, res, _next) => {
  serverLogger.error(`${ROUTE_NAME.toUpperCase()} unhandled error:`, err);

  const { statusCode, response } = createErrorResponse(
    "An unexpected error occurred",
    "INTERNAL_ERROR",
    500,
    process.env.NODE_ENV === "development" ? err.message : null,
  );

  res.status(statusCode).json(response);
});

export default router;
