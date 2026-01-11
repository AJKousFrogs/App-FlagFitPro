/**
 * Player Programs Routes
 * Handles player program assignments and management
 *
 * @module routes/player-programs
 * @version 1.0.0
 */

import express from "express";
import { authenticateToken } from "./middleware/auth.middleware.js";
import { supabase } from "./utils/database.js";
import { createHealthCheckHandler } from "./utils/health-check.js";
import { rateLimit } from "./utils/rate-limiter.js";
import { serverLogger } from "./utils/server-logger.js";
import { isValidUUID, sendError, sendSuccess } from "./utils/validation.js";

const router = express.Router();
const ROUTE_NAME = "player-programs";

// =============================================================================
// HEALTH CHECK
// =============================================================================

router.get("/health", createHealthCheckHandler(ROUTE_NAME, "1.0.0"));

// =============================================================================
// PLAYER PROGRAMS ENDPOINTS
// =============================================================================

/**
 * GET /me
 * Get current active program assignment for authenticated user
 */
router.get(
  "/me",
  rateLimit("READ"),
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.userId;

      // Get active assignment
      const { data, error } = await supabase
        .from("player_programs")
        .select(
          `
          id,
          player_id,
          program_id,
          status,
          start_date,
          end_date,
          current_week,
          current_phase_id,
          completion_percentage,
          modifications,
          notes,
          created_at,
          updated_at,
          training_programs!inner (
            id,
            name
          )
        `,
        )
        .eq("player_id", userId)
        .eq("status", "active")
        .maybeSingle();

      if (error) {
        serverLogger.error("[player-programs] Error fetching assignment:", error);
        return sendError(res, error.message, "FETCH_ERROR", 500);
      }

      if (!data) {
        return sendSuccess(res, {
          assignment: null,
        }, "No active program assigned");
      }

      // Transform to expected shape
      const assignment = {
        id: data.id,
        player_id: data.player_id,
        program_id: data.program_id,
        status: data.status,
        start_date: data.start_date,
        end_date: data.end_date,
        current_week: data.current_week,
        current_phase_id: data.current_phase_id,
        completion_percentage: data.completion_percentage,
        modifications: data.modifications,
        notes: data.notes,
        created_at: data.created_at,
        updated_at: data.updated_at,
        program: {
          id: data.training_programs.id,
          name: data.training_programs.name,
        },
      };

      return sendSuccess(res, { assignment });
    } catch (error) {
      serverLogger.error("[player-programs] Error:", error);
      return sendError(res, error.message || "Internal server error", "SERVER_ERROR", 500);
    }
  },
);

/**
 * POST /
 * Assign user to a training program
 * Supports force flag to switch from existing active program
 */
router.post(
  "/",
  rateLimit("WRITE"),
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.userId;
      const { program_id, start_date, status = "active", force = false } =
        req.body;

      // Validation
      if (!program_id) {
        return sendError(res, "program_id is required", "VALIDATION_ERROR", 400);
      }

      if (!isValidUUID(program_id)) {
        return sendError(res, "Invalid program_id format", "VALIDATION_ERROR", 400);
      }

      // Check if program exists
      const { data: programExists, error: programError } = await supabase
        .from("training_programs")
        .select("id, name")
        .eq("id", program_id)
        .single();

      if (programError || !programExists) {
        return sendError(res, "Training program not found", "NOT_FOUND", 404);
      }

      // Check for existing active assignment
      const { data: existingAssignment } = await supabase
        .from("player_programs")
        .select(
          `
          id,
          program_id,
          training_programs!inner (id, name)
        `,
        )
        .eq("player_id", userId)
        .eq("status", "active")
        .maybeSingle();

      if (existingAssignment) {
        // Same program - idempotent success
        if (existingAssignment.program_id === program_id) {
          const { data: fullAssignment } = await supabase
            .from("player_programs")
            .select(
              `
              id,
              player_id,
              program_id,
              status,
              start_date,
              end_date,
              current_week,
              current_phase_id,
              completion_percentage,
              modifications,
              notes,
              created_at,
              updated_at,
              training_programs!inner (id, name)
            `,
            )
            .eq("id", existingAssignment.id)
            .single();

          return sendSuccess(
            res,
            {
              assignment: {
                ...fullAssignment,
                program: {
                  id: fullAssignment.training_programs.id,
                  name: fullAssignment.training_programs.name,
                },
              },
            },
            "Program already assigned",
          );
        }

        // Different program - check force flag
        if (!force) {
          return sendError(
            res,
            `User already has active program "${existingAssignment.training_programs.name}". Use force=true to switch programs.`,
            "CONFLICT",
            409,
          );
        }

        // Force switch: inactivate previous
        const today = new Date().toISOString().split("T")[0];
        await supabase
          .from("player_programs")
          .update({
            status: "inactive",
            end_date: today,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingAssignment.id);
      }

      // Create new assignment
      const newAssignment = {
        player_id: userId,
        program_id,
        status,
        start_date: start_date || new Date().toISOString().split("T")[0],
        current_week: 1,
        completion_percentage: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: created, error: createError } = await supabase
        .from("player_programs")
        .insert(newAssignment)
        .select(
          `
          id,
          player_id,
          program_id,
          status,
          start_date,
          end_date,
          current_week,
          current_phase_id,
          completion_percentage,
          modifications,
          notes,
          created_at,
          updated_at,
          training_programs!inner (id, name)
        `,
        )
        .single();

      if (createError) {
        serverLogger.error(
          "[player-programs] Error creating assignment:",
          createError,
        );
        return sendError(res, createError.message, "CREATE_ERROR", 500);
      }

      return sendSuccess(
        res,
        {
          assignment: {
            ...created,
            program: {
              id: created.training_programs.id,
              name: created.training_programs.name,
            },
          },
        },
        "Program assigned successfully",
      );
    } catch (error) {
      serverLogger.error("[player-programs] Error:", error);
      return sendError(res, error.message || "Internal server error", "SERVER_ERROR", 500);
    }
  },
);

export default router;
