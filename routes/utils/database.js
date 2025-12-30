/**
 * Shared Database Connection Module
 * Centralizes database connection management using Supabase
 *
 * @module routes/utils/database
 * @version 1.0.0
 */

import { createClient } from "@supabase/supabase-js";
import { Pool } from "pg";
import dotenv from "dotenv";
import { serverLogger } from "./server-logger.js";

dotenv.config();

// =============================================================================
// SUPABASE CLIENT (Preferred for most operations)
// =============================================================================

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;

if (supabaseUrl && supabaseServiceKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    serverLogger.success("Supabase client initialized successfully");
  } catch (error) {
    serverLogger.error("Failed to initialize Supabase client:", error);
  }
} else {
  serverLogger.warn(
    "Supabase credentials not configured - some features may be unavailable",
  );
}

// =============================================================================
// POSTGRES POOL (Fallback for raw SQL queries)
// =============================================================================

const connectionString =
  process.env.DATABASE_URL || process.env.VITE_DATABASE_URL;

let pool = null;

if (connectionString) {
  try {
    pool = new Pool({
      connectionString,
      ssl:
        process.env.NODE_ENV === "production"
          ? { rejectUnauthorized: false }
          : false,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 20,
      allowExitOnIdle: false,
    });

    pool.on("connect", () => {
      serverLogger.success("PostgreSQL pool connected successfully");
    });

    pool.on("error", (err) => {
      serverLogger.error("PostgreSQL pool error:", err);
      if (err.code === "ECONNREFUSED" || err.code === "ETIMEDOUT") {
        serverLogger.warn("Database connection lost - will retry on next query");
      }
    });
  } catch (error) {
    serverLogger.error("Failed to create PostgreSQL pool:", error);
  }
} else {
  serverLogger.warn(
    "DATABASE_URL not configured - raw SQL queries will be unavailable",
  );
}

// =============================================================================
// DATABASE HEALTH CHECK
// =============================================================================

/**
 * Check database connectivity and return health status
 * @returns {Promise<object>} Health status object
 */
export async function checkDatabaseHealth() {
  const health = {
    supabase: "not_configured",
    postgres: "not_configured",
    latency: null,
  };

  // Check Supabase
  if (supabase) {
    try {
      const startTime = Date.now();
      const { error } = await supabase.from("users").select("id").limit(1);
      health.latency = Date.now() - startTime;

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows found (OK)
        health.supabase = "error";
        health.supabaseError = error.message;
      } else {
        health.supabase = "connected";
      }
    } catch (error) {
      health.supabase = "error";
      health.supabaseError = error.message;
    }
  }

  // Check PostgreSQL pool
  if (pool) {
    try {
      const startTime = Date.now();
      await pool.query("SELECT 1");
      health.postgres = "connected";
      if (!health.latency) {
        health.latency = Date.now() - startTime;
      }
    } catch (error) {
      health.postgres = "error";
      health.postgresError = error.message;
    }
  }

  return health;
}

// =============================================================================
// EXPORTS
// =============================================================================

export { supabase, pool };
export default { supabase, pool, checkDatabaseHealth };




