import { Routes } from "@angular/router";
import { ShellComponent } from "../../shell/shell.component";

/**
 * Feature routes — rebuilt incrementally in Phase E from the approved static
 * design (redesign/ground-zero). Screens render inside the persistent
 * ShellComponent (each screen renders its own top bar; the bottom nav + FAB are
 * the shell). Original path→screen→guard mapping is preserved uncompiled in
 * redesign/_reference/routes/ and restored as each screen is ported.
 */
export const featureRoutes: Routes = [
  {
    path: "",
    component: ShellComponent,
    children: [
      { path: "", pathMatch: "full", redirectTo: "today" },
      {
        path: "today",
        loadComponent: () =>
          import("../../today/today.component").then((m) => m.TodayComponent),
        title: "Today · FlagFit",
      },
      {
        path: "wellness",
        loadComponent: () =>
          import("../../wellness/wellness.component").then((m) => m.WellnessComponent),
        title: "Wellness · FlagFit",
      },
      {
        path: "gallery",
        loadComponent: () =>
          import("../../gallery/gallery.component").then((m) => m.GalleryComponent),
        title: "Design System · FlagFit",
      },
    ],
  },
];
