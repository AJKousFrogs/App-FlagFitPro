import { inject } from "@angular/core";
import { Router, CanActivateFn } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { SupabaseService } from "../services/supabase.service";

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);

  // Check both the auth service signal AND the supabase session directly
  // This handles the race condition where the signal hasn't updated yet
  const hasSession = !!supabaseService.session();
  const isAuthenticated = authService.isAuthenticated();
  
  if (hasSession || isAuthenticated) {
    return true;
  }

  router.navigate(["/login"], { queryParams: { returnUrl: state.url } });
  return false;
};
