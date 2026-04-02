import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { LoggerService } from "../services/logger.service";
import { SupabaseService } from "../services/supabase.service";
import { AuthFlowDataService } from "../../features/auth/services/auth-flow-data.service";

export const authGuard: CanActivateFn = async (route, state) => {
  const supabaseService = inject(SupabaseService);
  const authFlowDataService = inject(AuthFlowDataService);
  const router = inject(Router);
  const logger = inject(LoggerService);

  // CRITICAL: Wait for Supabase auth to initialize before checking
  // This prevents false redirects to login on page refresh
  await supabaseService.waitForInit();

  let session = supabaseService.session();

  logger.debug("[AuthGuard] Checking access", {
    url: state.url,
    hasSession: !!session,
    isInitialized: supabaseService.isInitialized(),
  });

  if (!session) {
    try {
      const {
        data: { session: refreshedSession },
        error,
      } = await supabaseService.client.auth.getSession();

      if (error) {
        logger.warn("[AuthGuard] Error getting session:", error.message);
      } else {
        session = refreshedSession;
      }
    } catch (err) {
      logger.error("[AuthGuard] Exception checking session:", err);
    }
  }

  const sessionUser = session?.user ?? supabaseService.currentUser();
  const emailConfirmed = !!sessionUser?.email_confirmed_at;

  if (session && !emailConfirmed) {
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
    return router.createUrlTree(["/verify-email"]);
  }

  if (session) {
    logger.debug(`[AuthGuard] Access granted to ${state.url}`);
    return true;
  }

  logger.info(`[AuthGuard] Redirecting to login, requested URL: ${state.url}`);
  return router.createUrlTree(["/login"], {
    queryParams: { returnUrl: state.url },
  });
};
