/**
 * Authentication Routes
 * Handles user authentication, registration, and session management
 *
 * @module routes/auth
 * @version 1.0.0
 */

import express from "express";
import { requireSupabase } from "./middleware/supabase-availability.middleware.js";
import { supabase } from "./utils/database.js";
import { createHealthCheckHandler } from "./utils/health-check.js";
import { rateLimit } from "./utils/rate-limiter.js";
import { serverLogger } from "./utils/server-logger.js";
import { sendError, sendSuccess } from "./utils/validation.js";

const router = express.Router();
const ROUTE_NAME = "auth";

// =============================================================================
// HEALTH CHECK
// =============================================================================

router.get("/health", createHealthCheckHandler(ROUTE_NAME, "1.0.0"));

// =============================================================================
// AUTHENTICATION ENDPOINTS
// =============================================================================

/**
 * POST /login
 * Authenticate user with email and password
 */
router.post("/login", rateLimit("AUTH"), requireSupabase, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(
        res,
        "Email and password are required",
        "VALIDATION_ERROR",
        400,
      );
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      serverLogger.error("[Auth] Login error:", error);
      return sendError(res, error.message, "AUTH_ERROR", 401);
    }

    return sendSuccess(res, {
      token: data.session.access_token,
      user: data.user,
    });
  } catch (error) {
    serverLogger.error("[Auth] Login error:", error);
    return sendError(res, error.message || "Login failed", "SERVER_ERROR", 500);
  }
});

/**
 * POST /register
 * Register a new user
 */
router.post(
  "/register",
  rateLimit("AUTH"),
  requireSupabase,
  async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return sendError(
        res,
        "Email and password are required",
        "VALIDATION_ERROR",
        400,
      );
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });

    if (error) {
      serverLogger.error("[Auth] Register error:", error);
      return sendError(res, error.message, "REGISTER_ERROR", 400);
    }

    return sendSuccess(res, {
      token: data.session?.access_token,
      user: data.user,
    });
  } catch (error) {
    serverLogger.error("[Auth] Register error:", error);
    return sendError(
      res,
      error.message || "Registration failed",
      "SERVER_ERROR",
      500,
    );
  }
  },
);

/**
 * GET /me
 * Get current authenticated user
 */
router.get("/me", rateLimit("READ"), requireSupabase, async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return sendError(res, "No token provided", "AUTH_ERROR", 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return sendError(
        res,
        error?.message || "User not found",
        "AUTH_ERROR",
        401,
      );
    }

    return sendSuccess(res, user);
  } catch (error) {
    serverLogger.error("[Auth] Me error:", error);
    return sendError(res, "Not authenticated", "AUTH_ERROR", 401);
  }
});

/**
 * POST /logout
 * Sign out current user
 */
router.post("/logout", rateLimit("WRITE"), async (req, res) => {
  if (supabase) {
    await supabase.auth.signOut();
  }
  return sendSuccess(res, null, "Logged out successfully");
});

export default router;
