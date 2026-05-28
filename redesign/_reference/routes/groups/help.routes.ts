import { Routes } from "@angular/router";

export const helpRoutes: Routes = [
  {
    path: "help",
    loadComponent: () =>
      import("../../../features/help/help-center.component").then(
        (m) => m.HelpCenterComponent,
      ),
    data: { preload: false, entry: "internal", headerPreset: "default" }, // On-demand
  },
  // Topic-specific routes all go to help center (component handles routing)
  {
    path: "help/:topic",
    loadComponent: () =>
      import("../../../features/help/help-center.component").then(
        (m) => m.HelpCenterComponent,
      ),
    data: { preload: false, entry: "deeplink", headerPreset: "default" },
  },
];
