/**
 * Knowledge Base Routes
 * Handles knowledge base search and retrieval endpoints
 *
 * @module routes/knowledge
 * @version 1.0.0
 */

import express from "express";
import { optionalAuth } from "./middleware/auth.middleware.js";
import { supabase } from "./utils/database.js";
import { createHealthCheckHandler } from "./utils/health-check.js";
import { rateLimit } from "./utils/rate-limiter.js";
import { serverLogger } from "./utils/server-logger.js";
import { sendError, sendSuccess } from "./utils/validation.js";

const router = express.Router();
const ROUTE_NAME = "knowledge";

// =============================================================================
// HEALTH CHECK
// =============================================================================

router.get("/health", createHealthCheckHandler(ROUTE_NAME, "1.0.0"));

// =============================================================================
// KNOWLEDGE BASE ENDPOINTS
// =============================================================================

/**
 * GET /search
 * Search knowledge base entries
 */
router.get(
  "/search",
  rateLimit("READ"),
  optionalAuth,
  async (req, res) => {
    if (!supabase) {
      return sendError(res, "Database not configured", "DB_ERROR", 503);
    }

    try {
      const { query, topic, category, limit = 10 } = req.query;

      let dbQuery = supabase
        .from("knowledge_base_entries")
        .select(
          "id, title, content, category, subcategory, source_type, evidence_grade",
        )
        .eq("is_active", true);

      if (query) {
        dbQuery = dbQuery.or(`title.ilike.%${query}%,content.ilike.%${query}%`);
      }
      if (topic) {
        dbQuery = dbQuery.ilike("title", `%${topic}%`);
      }
      if (category) {
        dbQuery = dbQuery.eq("category", category);
      }

      const { data: entries, error } = await dbQuery
        .order("source_quality_score", { ascending: false, nullsFirst: false })
        .limit(parseInt(limit));

      if (error) {
        throw error;
      }

      return sendSuccess(res, entries || []);
    } catch (error) {
      serverLogger.error(`[${ROUTE_NAME}] Search error:`, error);
      return sendSuccess(res, [], "No data available");
    }
  },
);

export default router;
