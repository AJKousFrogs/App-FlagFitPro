import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { LoggerService } from "../services/logger.service";
import { SupabaseService } from "../services/supabase.service";
import { AuthFlowDataService } from "../../features/auth/services/auth-flow-data.service";

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const supabaseService = inject(SupabaseService);
  const authFlowDataService = inject(AuthFlowDataService);
  const router = inject(Router);
  const logger = inject(LoggerService);

  // CRITICAL: Wait for Supabase auth to initialize before checking
  // This prevents false redirects to login on page refresh
  await supabaseService.waitForInit();

  // Check both the auth service signal AND the supabase session directly
  // This handles the race condition where the signal hasn't updated yet
  let hasSession = !!supabaseService.session();
  let isAuthenticated = authService.isAuthenticated();

  logger.debug("[AuthGuard] Checking access", {
    url: state.url,
    hasSession,
    isAuthenticated,
    isInitialized: supabaseService.isInitialized(),
  });

  // If no session found, try multiple methods to verify authentication
  if (!hasSession && !isAuthenticated) {
    logger.debug(
      "[AuthGuard] No immediate session found, checking Supabase directly...",
    );

    try {
      // Method 1: Try getSession() - checks localStorage and refreshes if needed
      const {
        data: { session },
        error,
      } = await supabaseService.client.auth.getSession();

      if (error) {
        logger.warn("[AuthGuard] Error getting session:", error.message);
      } else if (session) {
        logger.debug("[AuthGuard] Found session via getSession()");
        hasSession = true;
        isAuthenticated = true;
      } else {
        // Method 2: Try getUser() - validates current token
        const {
          data: { user },
          error: userError,
        } = await supabaseService.client.auth.getUser();

        if (!userError && user) {
          logger.debug(
            "[AuthGuard] Found user via getUser(), session may be expired but user exists",
          );
          // User exists but session might be expired - allow access for now
          // The app will handle token refresh automatically
          hasSession = true;
          isAuthenticated = true;
        }
      }
    } catch (err) {
      logger.error("[AuthGuard] Exception checking session:", err);
    }
  }

  const sessionUser =
    supabaseService.session()?.user ?? supabaseService.currentUser();
  const emailConfirmed = !!sessionUser?.email_confirmed_at;

  if ((hasSession || isAuthenticated) && !emailConfirmed) {
    logger.info("[AuthGuard] Blocking unverified session from app shell", {
      url: state.url,
      email: sessionUser?.email,
    });
    authFlowDataService.storePendingVerificationEmail(sessionUser?.email);
    try {
      await authFlowDataService.signOut();
    } catch (error) {
      logger.warn("[AuthGuard] Failed to clear unverified session cleanly", {
        error,
      });
    }
    router.navigate(["/verify-email"]);
    return false;
  }

  if (hasSession || isAuthenticated) {
    logger.debug(`[AuthGuard] Access granted to ${state.url}`);
    return true;
  }

  logger.info(`[AuthGuard] Redirecting to login, requested URL: ${state.url}`);
  router.navigate(["/login"], { queryParams: { returnUrl: state.url } });
  return false;
};
