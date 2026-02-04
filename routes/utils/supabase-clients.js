/**
 * Supabase Clients (Server-Only)
 * Centralized creation of admin + anon Supabase clients with validation.
 *
 * IMPORTANT:
 * - Admin client uses SERVICE_ROLE key (server-only).
 * - Anon client uses ANON key (safe for limited operations).
 * - This module must never be imported from frontend code.
 */

import { createClient } from "@supabase/supabase-js";
import { serverLogger } from "./server-logger.js";

const assertServerOnly = () => {
  if (typeof window !== "undefined") {
    throw new Error(
      "[SupabaseClients] Server-only module imported in browser context.",
    );
  }
  if (!process?.versions?.node) {
    throw new Error(
      "[SupabaseClients] Node.js runtime required for server-only module.",
    );
  }
};

assertServerOnly();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

export const assertSupabaseServerConfig = ({
  requireAdmin = false,
  requireAnon = false,
} = {}) => {
  const missing = [];
  if (!SUPABASE_URL) missing.push("SUPABASE_URL");
  if (requireAdmin && !SUPABASE_SERVICE_ROLE_KEY) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  }
  if (requireAnon && !SUPABASE_ANON_KEY) {
    missing.push("SUPABASE_ANON_KEY");
  }

  if (missing.length > 0) {
    throw new Error(
      `[SupabaseClients] Missing required env vars: ${missing.join(", ")}`,
    );
  }
};

const createServerClient = (key, label) => {
  if (!SUPABASE_URL || !key) return null;
  try {
    return createClient(SUPABASE_URL, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  } catch (error) {
    serverLogger.error(`[SupabaseClients] Failed to init ${label} client`, error);
    return null;
  }
};

export const supabaseAdmin = createServerClient(
  SUPABASE_SERVICE_ROLE_KEY,
  "admin",
);
export const supabaseAnon = createServerClient(SUPABASE_ANON_KEY, "anon");

export const isSupabaseAdminConfigured = () => !!supabaseAdmin;
export const isSupabaseAnonConfigured = () => !!supabaseAnon;

export const getSupabaseAdmin = () => supabaseAdmin;
export const getSupabaseAnon = () => supabaseAnon;
