import { Routes } from "@angular/router";
import { authGuard } from "../../guards/auth.guard";

export const staffRoutes: Routes = [
  {
    path: "staff",
    loadComponent: () =>
      import("../../../features/staff/staff-hub.component").then(
        (m) => m.StaffHubComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "hub" },
  },
  {
    path: "staff/nutritionist",
    loadComponent: () =>
      import("../../../features/staff/nutritionist/nutritionist-dashboard.component").then(
        (m) => m.NutritionistDashboardComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" },
  },
  {
    path: "staff/physiotherapist",
    loadComponent: () =>
      import("../../../features/staff/physiotherapist/physiotherapist-dashboard.component").then(
        (m) => m.PhysiotherapistDashboardComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" },
  },
  {
    path: "staff/psychology",
    loadComponent: () =>
      import("../../../features/staff/psychology/psychology-reports.component").then(
        (m) => m.PsychologyReportsComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" },
  },
  {
    path: "staff/decisions",
    loadComponent: () =>
      import("../../../features/staff/decisions/decision-ledger-dashboard.component").then(
        (m) => m.DecisionLedgerDashboardComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" },
  },
  {
    path: "staff/decisions/:id",
    loadComponent: () =>
      import("../../../features/staff/decisions/decision-detail.component").then(
        (m) => m.DecisionDetailComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "deeplink" },
  },
];
