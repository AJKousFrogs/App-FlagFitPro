/**
 * Feature Route Groups Composition
 *
 * Route groups are split by domain to keep each file small and maintainable.
 * They are flattened here so route matching happens against the concrete route
 * records directly instead of through multiple empty-path wrappers.
 */

import { Routes } from "@angular/router";
import { analyticsRoutes } from "./groups/analytics.routes";
import { dashboardRoutes } from "./groups/dashboard.routes";
import { gameRoutes } from "./groups/game.routes";
import { helpRoutes } from "./groups/help.routes";
import { profileRoutes } from "./groups/profile.routes";
import { publicRoutes } from "./groups/public.routes";
import { socialRoutes } from "./groups/social.routes";
import { staffRoutes } from "./groups/staff.routes";
import { superadminRoutes } from "./groups/superadmin.routes";
import { teamRoutes } from "./groups/team.routes";
import { trainingRoutes } from "./groups/training.routes";
import { wellnessRoutes } from "./groups/wellness.routes";

export const featureRoutes: Routes = [
  ...publicRoutes,
  ...superadminRoutes,
  ...dashboardRoutes,
  ...trainingRoutes,
  ...analyticsRoutes,
  ...teamRoutes,
  ...gameRoutes,
  ...wellnessRoutes,
  ...socialRoutes,
  ...staffRoutes,
  ...profileRoutes,
  ...helpRoutes,
  {
    path: "**",
    loadComponent: () =>
      import("../../features/not-found/not-found.component").then(
        (m) => m.NotFoundComponent,
      ),
  },
];
