/**
 * Authentication & Authorization Middleware
 * Centralized middleware for API route protection
 *
 * @module routes/middleware/auth
 * @version 1.0.0
 */

import { createClient } from "@supabase/supabase-js";
import { serverLogger } from "../utils/server-logger.js";

// Initialize Supabase client for auth
// CRITICAL: Backend MUST use SERVICE_ROLE_KEY for token validation
// Never use ANON_KEY on backend - it won't work for getUser() validation
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

let supabaseAuth = null;

if (supabaseUrl && supabaseServiceKey) {
  try {
    supabaseAuth = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    serverLogger.info(
      "[Auth Middleware] Supabase auth client initialized with SERVICE_ROLE_KEY",
    );
  } catch (error) {
    serverLogger.error("Failed to initialize Supabase auth client:", error);
  }
} else {
  serverLogger.error(
    "[Auth Middleware] CRITICAL: SUPABASE_SERVICE_ROLE_KEY not found! " +
      "Backend authentication will fail. Check environment variables:",
    {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      envVars: {
        SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey ? "SET" : "MISSING",
        SUPABASE_SERVICE_KEY: supabaseServiceKey ? "SET" : "MISSING",
        SUPABASE_URL: supabaseUrl ? "SET" : "MISSING",
        VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ? "SET" : "MISSING",
      },
    },
  );
}

/**
 * Authentication middleware - validates Bearer token via Supabase
 * Use for protected endpoints that require a logged-in user
 *
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Next middleware
 */
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "Access token required",
      code: "MISSING_TOKEN",
    });
  }

  if (!supabaseAuth) {
    return res.status(503).json({
      success: false,
      error: "Authentication service unavailable",
      code: "AUTH_SERVICE_ERROR",
    });
  }

  try {
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error,
    } = await supabaseAuth.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: "Invalid or expired token",
        code: "INVALID_TOKEN",
      });
    }

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || "player",
      name: user.user_metadata?.name || user.email,
    };
    req.userId = user.id;
    next();
  } catch (error) {
    serverLogger.error("[Auth Middleware] Error:", error);
    return res.status(401).json({
      success: false,
      error: "Authentication failed",
      code: "AUTH_ERROR",
    });
  }
}

/**
 * Authorization middleware - validates userId query/param matches authenticated user
 * Coaches/admins can access team members' data
 *
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Next middleware
 */
export async function authorizeUserAccess(req, res, next) {
  const requestedUserId = req.query.userId || req.params.userId;

  // If no userId requested, allow (will use authenticated user's ID)
  if (!requestedUserId) {
    return next();
  }

  // Users can always access their own data
  if (req.userId === requestedUserId) {
    return next();
  }

  // Coaches and admins can access team members' data
  if (req.user?.role === "coach" || req.user?.role === "admin") {
    if (supabaseAuth) {
      try {
        // Check if coach and requested user are on same team
        const { data: coachTeam } = await supabaseAuth
          .from("team_members")
          .select("team_id")
          .eq("user_id", req.userId)
          .single();

        if (coachTeam?.team_id) {
          const { data: playerTeam } = await supabaseAuth
            .from("team_members")
            .select("team_id")
            .eq("user_id", requestedUserId)
            .single();

          if (playerTeam?.team_id === coachTeam.team_id) {
            return next();
          }
        }
      } catch (error) {
        serverLogger.error("[Authorization] Team check error:", error);
      }
    }
  }

  return res.status(403).json({
    success: false,
    error: "You do not have permission to access this user's data",
    code: "UNAUTHORIZED_ACCESS",
  });
}

/**
 * Optional auth middleware - attaches user if token provided, but doesn't require it
 * Use for endpoints that have different behavior for authenticated vs anonymous users
 *
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Next middleware
 */
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ") || !supabaseAuth) {
    return next();
  }

  try {
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser(token);

    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || "player",
        name: user.user_metadata?.name || user.email,
      };
      req.userId = user.id;
    }
  } catch {
    // Ignore auth errors for optional auth
  }
  next();
}

/**
 * Role-based access control middleware factory
 *
 * @param {...string} roles - Allowed roles
 * @returns {Function} Express middleware
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
        code: "NOT_AUTHENTICATED",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `This action requires one of these roles: ${roles.join(", ")}`,
        code: "INSUFFICIENT_ROLE",
      });
    }

    next();
  };
}

export default {
  authenticateToken,
  authorizeUserAccess,
  optionalAuth,
  requireRole,
};
