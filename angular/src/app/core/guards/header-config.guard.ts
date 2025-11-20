import { Injectable, inject } from "@angular/core";
import { CanActivateFn, ActivatedRouteSnapshot } from "@angular/router";
import { HeaderService } from "../services/header.service";

@Injectable({
  providedIn: "root",
})
export class HeaderConfigGuard {
  constructor(private headerService: HeaderService) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const routePath = route.routeConfig?.path;

    switch (routePath) {
      case "dashboard":
        this.headerService.setDashboardHeader();
        break;
      case "training":
      case "training/overview":
        this.headerService.setTrainingHeader();
        break;
      case "analytics":
        this.headerService.setAnalyticsHeader();
        break;
      default:
        // Default header config
        this.headerService.resetToDefault();
        break;
    }

    return true;
  }
}

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

