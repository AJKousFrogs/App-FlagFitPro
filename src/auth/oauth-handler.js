/**
 * OAuth Authentication Handler
 * Handles OAuth provider authentication (Google, GitHub, etc.)
 * Extracted from auth-manager.js for better separation of concerns
 */

import { logger } from "../logger.js";

export class OAuthHandler {
  /**
   * Sign in with OAuth provider
   * @param {Object} supabase - Supabase client instance
   * @param {Function} safeSupabaseQuery - Safe query wrapper
   * @param {string} provider - OAuth provider (google, github, etc.)
   * @param {string} role - User role (player, coach, parent)
   * @returns {Promise<Object>} OAuth response
   */
  static async signInWithOAuth(supabase, safeSupabaseQuery, provider, role) {
    try {
      logger.debug(`[Auth] Starting OAuth flow with ${provider}`);

      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }

      // Store role in localStorage temporarily (will be added to user metadata on callback)
      localStorage.setItem("pending_oauth_role", role);

      // Redirect to OAuth provider
      const { data: _data, error } = await safeSupabaseQuery(
        supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            scopes: provider === "google" ? "email profile" : undefined,
          },
        }),
        "Auth:OAuth",
      );

      if (error) {
        localStorage.removeItem("pending_oauth_role");
        throw error;
      }

      return { success: true };
    } catch (error) {
      logger.error(`[Auth] OAuth sign-in failed:`, error);
      throw error;
    }
  }

  /**
   * Setup Supabase Auth State Listener
   * Monitors authentication state changes (sign in, sign out, token refresh)
   * @param {Object} supabase - Supabase client instance
   * @param {Function} safeSupabaseQuery - Safe query wrapper
   * @param {Function} onAuthChange - Callback for auth state changes
   * @returns {Promise<Function>} Cleanup function to remove listener
   */
  static setupAuthListener(supabase, safeSupabaseQuery, onAuthChange) {
    try {
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        logger.debug("[Auth] State changed:", event);

        if (event === "SIGNED_IN" && session) {
          const pendingRole = localStorage.getItem("pending_oauth_role");
          const isOAuth = session.user.app_metadata?.provider !== "email";
          const provider = session.user.app_metadata?.provider || "email";

          const userData = {
            id: session.user.id,
            email: session.user.email,
            role: session.user.user_metadata?.role || pendingRole || "player",
            name:
              session.user.user_metadata?.name ||
              session.user.user_metadata?.full_name ||
              session.user.email,
            email_verified: session.user.email_confirmed_at !== null || isOAuth,
            provider,
          };

          // If OAuth and role was pending, update user metadata
          if (isOAuth && pendingRole && !session.user.user_metadata?.role) {
            const { getSupabase, safeSupabaseQuery: safeQuery } =
              await import("../js/services/supabase-client.js");
            const supabaseUpdate = getSupabase();
            if (supabaseUpdate) {
              await safeQuery(
                supabaseUpdate.auth.updateUser({
                  data: { role: pendingRole },
                }),
                "Auth:UpdateUserMetadata",
              );
              logger.debug(
                `[Auth] Updated user metadata with role: ${pendingRole}`,
              );
            }
            localStorage.removeItem("pending_oauth_role");
          }

          // Call the auth change callback
          if (onAuthChange) {
            await onAuthChange(session.access_token, userData);
          }
        } else if (event === "SIGNED_OUT") {
          if (onAuthChange) {
            await onAuthChange(null, null);
          }
        } else if (event === "TOKEN_REFRESHED" && session) {
          logger.debug("[Auth] Token refreshed");
          if (onAuthChange && session.user) {
            const userData = {
              id: session.user.id,
              email: session.user.email,
              role: session.user.user_metadata?.role || "player",
              name:
                session.user.user_metadata?.name ||
                session.user.user_metadata?.full_name ||
                session.user.email,
              email_verified: session.user.email_confirmed_at !== null,
              provider: session.user.app_metadata?.provider || "email",
            };
            await onAuthChange(session.access_token, userData);
          }
        }
      });

      // Return cleanup function
      return () => {
        subscription?.unsubscribe();
        logger.debug("[Auth] Unsubscribed from auth state changes");
      };
    } catch (error) {
      logger.error("[Auth] Failed to setup auth listener:", error);
      throw error;
    }
  }

  /**
   * Get pending OAuth role from localStorage
   * @returns {string|null} Pending role or null
   */
  static getPendingRole() {
    return localStorage.getItem("pending_oauth_role");
  }

  /**
   * Clear pending OAuth role
   */
  static clearPendingRole() {
    localStorage.removeItem("pending_oauth_role");
  }
}
