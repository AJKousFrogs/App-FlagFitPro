/**
 * Supabase Availability Middleware
 * Ensures Supabase client is configured before route execution.
 *
 * @module routes/middleware/supabase-availability
 * @version 1.0.0
 */

import { supabase } from "../utils/database.js";
import { sendError } from "../utils/validation.js";

export const requireSupabase = (_req, res, next) => {
  if (!supabase) {
    return sendError(res, "Database not configured", "DB_ERROR", 503);
  }

  return next();
};
