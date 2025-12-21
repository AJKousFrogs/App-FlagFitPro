/**
 * Supabase Client Utility
 * Reusable Supabase client for server-side and Node.js contexts
 * 
 * Usage:
 *   import { getSupabaseClient, getSupabaseAdmin } from './utils/supabase-client.js';
 *   
 *   // For regular operations (uses anon key)
 *   const supabase = getSupabaseClient();
 *   
 *   // For admin operations (uses service key)
 *   const supabaseAdmin = getSupabaseAdmin();
 */

import { createClient } from '@supabase/supabase-js';

// Get Supabase configuration from environment variables
const supabaseUrl = process.env.SUPABASE_URL || 'https://pvziciccwxgftcielknm.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Client instances (singleton pattern)
let supabaseClient = null;
let supabaseAdminClient = null;

/**
 * Get Supabase client with anon key (for regular operations)
 * @returns {object} Supabase client instance
 */
export function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase configuration. Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.'
    );
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: false, // Server-side doesn't persist sessions
    },
  });

  return supabaseClient;
}

/**
 * Get Supabase client with service key (for admin operations)
 * WARNING: Service key bypasses Row Level Security (RLS)
 * Only use for admin operations or when RLS is not applicable
 * @returns {object} Supabase admin client instance
 */
export function getSupabaseAdmin() {
  if (supabaseAdminClient) {
    return supabaseAdminClient;
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase admin configuration. Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables.'
    );
  }

  supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseAdminClient;
}

/**
 * Create a Supabase client with a custom key
 * Useful for testing or special use cases
 * @param {string} key - Supabase API key (anon or service)
 * @param {object} options - Additional client options
 * @returns {object} Supabase client instance
 */
export function createSupabaseClient(key, options = {}) {
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL environment variable is required');
  }

  return createClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    ...options,
  });
}

// Export default client (anon key)
export default getSupabaseClient();

