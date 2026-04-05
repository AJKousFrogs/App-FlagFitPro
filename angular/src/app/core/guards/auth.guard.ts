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

  logger.debug("auth_guard_check", {
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
        logger.warn("auth_guard_session_error", { message: error.message });
      } else {
        session = refreshedSession;
      }
    } catch (err) {
      logger.error("auth_guard_session_exception", err);
    }
  }

  const sessionUser = session?.user ?? supabaseService.currentUser();
  const emailConfirmed = !!sessionUser?.email_confirmed_at;

  if (session && !emailConfirmed) {
    logger.info("auth_guard_block_unverified", {
      url: state.url,
      email: sessionUser?.email,
    });
    authFlowDataService.storePendingVerificationEmail(sessionUser?.email);
    try {
      await authFlowDataService.signOut();
    } catch (error) {
      logger.warn("auth_guard_unverified_signout_failed", {
        error,
      });
    }
    return router.createUrlTree(["/verify-email"]);
  }

  if (session) {
    logger.debug("auth_guard_access_granted", { url: state.url });
    return true;
  }

  logger.info("auth_guard_redirect_login", { returnUrl: state.url });
  return router.createUrlTree(["/login"], {
    queryParams: { returnUrl: state.url },
  });
};
