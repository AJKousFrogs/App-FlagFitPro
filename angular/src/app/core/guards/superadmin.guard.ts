import { inject } from "@angular/core";
import { Router, CanActivateFn } from "@angular/router";
import { SuperadminService } from "../services/superadmin.service";
import { SupabaseService } from "../services/supabase.service";

/**
 * Guard to protect superadmin-only routes
 * Only allows access if user is authenticated AND is a superadmin
 */
export const superadminGuard: CanActivateFn = async (route, state) => {
  const superadminService = inject(SuperadminService);
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);

  // CRITICAL: Wait for Supabase auth to initialize before checking
  await supabaseService.waitForInit();

  // First check if authenticated
  const hasSession = !!supabaseService.session();
  if (!hasSession) {
    return router.createUrlTree(["/login"], {
      queryParams: { returnUrl: state.url },
    });
  }

  // Check superadmin status
  const isSuperadmin = await superadminService.checkSuperadminStatus();

  if (!isSuperadmin) {
    // Redirect to regular dashboard if not superadmin
    return router.createUrlTree(["/dashboard"]);
  }

  return true;
};
