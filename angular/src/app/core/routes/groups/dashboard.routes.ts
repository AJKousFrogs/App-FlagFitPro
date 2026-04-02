import { Routes } from "@angular/router";
import { authGuard } from "../../guards/auth.guard";

export const dashboardRoutes: Routes = [
  {
    path: "todays-practice",
    loadComponent: () =>
      import("../../../features/today/today.component").then(
        (m) => m.TodayComponent,
      ),
    canActivate: [authGuard],
    data: {
      preload: true,
      priority: "high",
      entry: "internal",
      animation: "fade",
      headerPreset: "dashboard",
    },
  },
  {
    path: "dashboard",
    loadComponent: () =>
      import("../../../features/dashboard/dashboard.component").then(
        (m) => m.DashboardComponent,
      ),
    canActivate: [authGuard],
    data: {
      preload: true,
      priority: "high",
      entry: "internal",
      animation: "fade",
      headerPreset: "dashboard",
    },
  },
  {
    path: "elite-command-center",
    redirectTo: "coach/dashboard",
    pathMatch: "full",
    data: { entry: "legacy" },
  },
  {
    path: "player-dashboard",
    loadComponent: () =>
      import("../../../features/dashboard/player-dashboard.component").then(
        (m) => m.PlayerDashboardComponent,
      ),
    canActivate: [authGuard],
    data: {
      preload: true,
      priority: "high",
      entry: "internal",
      animation: "fade",
      headerPreset: "dashboard",
    },
  },
  {
    path: "athlete-dashboard",
    redirectTo: "player-dashboard",
    pathMatch: "full",
    data: { entry: "internal" },
  },
];
