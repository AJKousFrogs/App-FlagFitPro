/**
 * Password Leak Check Utility
 * Checks passwords against Have I Been Pwned database via Supabase Edge Function
 */

/**
 * Check if a password has been leaked using the Supabase Edge Function
 * @param {string} password - Password to check
 * @param {string} supabaseUrl - Supabase project URL
 * @param {string} supabaseToken - Supabase auth token (optional, for authenticated requests)
 * @returns {Promise<{leaked: boolean, message: string}>}
 */
export async function checkPasswordLeaked(password, supabaseUrl, supabaseToken = null) {
  if (!password || typeof password !== 'string') {
    return {
      leaked: false,
      message: 'Password is required',
    };
  }

  if (!supabaseUrl) {
    console.warn('[Password Leak Check] Supabase URL not provided, skipping check');
    return {
      leaked: false,
      message: 'Password leak check unavailable',
    };
  }

  try {
    const functionUrl = `${supabaseUrl}/functions/v1/enable-leaked-password-protection`;
    
    const headers = {
      'Content-Type': 'application/json',
    };

    // Add auth token if provided
    if (supabaseToken) {
      headers['Authorization'] = `Bearer ${supabaseToken}`;
    }

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'check',
        password: password,
      }),
    });

    if (!response.ok) {
      // If function is unavailable or returns error, fail open (allow password)
      console.warn('[Password Leak Check] Function unavailable:', response.status);
      return {
        leaked: false,
        message: 'Password leak check unavailable',
      };
    }

    const result = await response.json();
    return {
      leaked: result.leaked || false,
      message: result.message || (result.leaked 
        ? 'This password has been found in data breaches. Please choose a different password.'
        : 'Password is safe to use.'),
    };
  } catch (error) {
    // Fail open - if there's an error, allow password (but log it)
    console.error('[Password Leak Check] Error:', error);
    return {
      leaked: false,
      message: 'Password leak check unavailable',
    };
  }
}

/**
 * Check password leak with automatic Supabase configuration detection
 * @param {string} password - Password to check
 * @returns {Promise<{leaked: boolean, message: string}>}
 */
export async function checkPasswordLeakedAuto(password) {
  // Get Supabase configuration from window._env or environment
  const supabaseUrl = 
    (typeof window !== 'undefined' && window._env?.SUPABASE_URL) ||
    (typeof window !== 'undefined' && window._env?.VITE_SUPABASE_URL) ||
    null;

  // Try to get auth token from Supabase client if available
  let supabaseToken = null;
  try {
    const { getSupabase } = await import('../services/supabase-client.js');
    const supabase = getSupabase();
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        supabaseToken = session.access_token;
      }
    }
  } catch (error) {
    // Token not available, continue without it
    // The function will still work but may require authentication
  }

  return checkPasswordLeaked(password, supabaseUrl, supabaseToken);
}

