import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { LoggerService } from "../services/logger.service";
import { SupabaseService } from "../services/supabase.service";

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);
  const logger = inject(LoggerService);

  // DEBUG: Log guard entry
  console.log("[AuthGuard] Checking access to:", state.url);

  // CRITICAL: Wait for Supabase auth to initialize before checking
  // This prevents false redirects to login on page refresh
  await supabaseService.waitForInit();

  // Check both the auth service signal AND the supabase session directly
  // This handles the race condition where the signal hasn't updated yet
  let hasSession = !!supabaseService.session();
  const isAuthenticated = authService.isAuthenticated();

  // DEBUG: Log initial state
  console.log("[AuthGuard] Initial state:", {
    hasSession,
    isAuthenticated,
    isInitialized: supabaseService.isInitialized(),
  });

  // If no session in signal but user should be authenticated, try to refresh from Supabase
  if (!hasSession && !isAuthenticated) {
    logger.debug(
      "[AuthGuard] No immediate session found, checking Supabase directly...",
    );
    console.log("[AuthGuard] No session in signals, checking Supabase directly...");

    try {
      const {
        data: { session },
        error,
      } = await supabaseService.client.auth.getSession();

      // DEBUG: Log direct check result
      console.log("[AuthGuard] Direct Supabase check:", {
        hasSession: !!session,
        error: error?.message,
        userId: session?.user?.id,
      });

      if (error) {
        logger.warn("[AuthGuard] Error getting session:", error.message);
      } else if (session) {
        logger.debug("[AuthGuard] Found session via direct check");
        hasSession = true;
      }
    } catch (err) {
      logger.error("[AuthGuard] Exception checking session:", err);
      console.error("[AuthGuard] Exception:", err);
    }
  }

  if (hasSession || isAuthenticated) {
    logger.debug(`[AuthGuard] Access granted to ${state.url}`);
    console.log("[AuthGuard] ✅ Access GRANTED to:", state.url);
    return true;
  }

  logger.info(`[AuthGuard] Redirecting to login, requested URL: ${state.url}`);
  console.log("[AuthGuard] ❌ Access DENIED - redirecting to login. Requested:", state.url);
  router.navigate(["/login"], { queryParams: { returnUrl: state.url } });
  return false;
};
