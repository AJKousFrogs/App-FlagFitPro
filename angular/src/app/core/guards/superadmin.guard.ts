import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { SuperadminService } from '../services/superadmin.service';
import { AuthService } from '../services/auth.service';

/**
 * Guard to protect superadmin-only routes
 * Only allows access if user is authenticated AND is a superadmin
 */
export const superadminGuard: CanActivateFn = async (route, state) => {
  const superadminService = inject(SuperadminService);
  const authService = inject(AuthService);
  const router = inject(Router);

  // First check if authenticated
  if (!authService.isAuthenticated()) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // Check superadmin status
  const isSuperadmin = await superadminService.checkSuperadminStatus();
  
  if (!isSuperadmin) {
    // Redirect to regular dashboard if not superadmin
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
