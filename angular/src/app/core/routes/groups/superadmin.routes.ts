import { Routes } from "@angular/router";
import { superadminGuard } from "../../guards/superadmin.guard";

export const superadminRoutes: Routes = [
  {
    path: "superadmin",
    loadComponent: () =>
      import("../../../features/superadmin/superadmin-dashboard.component").then(
        (m) => m.SuperadminDashboardComponent,
      ),
    canActivate: [superadminGuard],
    data: { preload: false, entry: "hub" }, // Don't preload admin routes
  },
  {
    path: "superadmin/settings",
    loadComponent: () =>
      import("../../../features/superadmin/superadmin-settings.component").then(
        (m) => m.SuperadminSettingsComponent,
      ),
    canActivate: [superadminGuard],
    data: { preload: false, entry: "internal" }, // Admin only
  },
  {
    path: "superadmin/teams",
    loadComponent: () =>
      import("../../../features/superadmin/superadmin-teams.component").then(
        (m) => m.SuperadminTeamsComponent,
      ),
    canActivate: [superadminGuard],
    data: { preload: false, entry: "internal" }, // Admin only
  },
  {
    path: "superadmin/users",
    loadComponent: () =>
      import("../../../features/superadmin/superadmin-users.component").then(
        (m) => m.SuperadminUsersComponent,
      ),
    canActivate: [superadminGuard],
    data: { preload: false, entry: "internal" }, // Admin only
  },
];
