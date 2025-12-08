import { inject } from "@angular/core";
import { CanActivateFn, ActivatedRouteSnapshot } from "@angular/router";
import { HeaderService } from "../services/header.service";

/**
 * Header Configuration Guard
 * Configures header settings based on the current route.
 * Uses functional guard pattern (Angular 19 best practice).
 */
export const headerConfigGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const headerService = inject(HeaderService);
  const routePath = route.routeConfig?.path;

  switch (routePath) {
    case "dashboard":
      headerService.setDashboardHeader();
      break;
    case "training":
    case "training/overview":
      headerService.setTrainingHeader();
      break;
    case "analytics":
      headerService.setAnalyticsHeader();
      break;
    default:
      // Default header config
      headerService.resetToDefault();
      break;
  }

  return true;
};

