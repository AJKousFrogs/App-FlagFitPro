/**
 * Feature Route Groups Composition
 *
 * Route groups are split by domain to keep each file small and maintainable.
 */

import { Routes } from "@angular/router";

export const featureRoutes: Routes = [
  {
    path: "",
    loadChildren: () =>
      import("./groups/public.routes").then((m) => m.publicRoutes),
  },
  {
    path: "",
    loadChildren: () =>
      import("./groups/superadmin.routes").then((m) => m.superadminRoutes),
  }, // Superadmin routes first (most specific)
  {
    path: "",
    loadChildren: () =>
      import("./groups/dashboard.routes").then((m) => m.dashboardRoutes),
  },
  {
    path: "",
    loadChildren: () =>
      import("./groups/training.routes").then((m) => m.trainingRoutes),
  },
  {
    path: "",
    loadChildren: () =>
      import("./groups/analytics.routes").then((m) => m.analyticsRoutes),
  },
  {
    path: "",
    loadChildren: () => import("./groups/team.routes").then((m) => m.teamRoutes),
  },
  {
    path: "",
    loadChildren: () => import("./groups/game.routes").then((m) => m.gameRoutes),
  },
  {
    path: "",
    loadChildren: () =>
      import("./groups/wellness.routes").then((m) => m.wellnessRoutes),
  },
  {
    path: "",
    loadChildren: () =>
      import("./groups/social.routes").then((m) => m.socialRoutes),
  },
  {
    path: "",
    loadChildren: () =>
      import("./groups/staff.routes").then((m) => m.staffRoutes),
  },
  {
    path: "",
    loadChildren: () =>
      import("./groups/profile.routes").then((m) => m.profileRoutes),
  },
  {
    path: "",
    loadChildren: () => import("./groups/help.routes").then((m) => m.helpRoutes),
  }, // Help redirects before wildcard
  {
    path: "**",
    loadComponent: () =>
      import("../../features/not-found/not-found.component").then(
        (m) => m.NotFoundComponent,
      ),
  },
];
