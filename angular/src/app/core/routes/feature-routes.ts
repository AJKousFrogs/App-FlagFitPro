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
        path: "training",
        loadComponent: () =>
          import("../../training/training.component").then((m) => m.TrainingComponent),
        title: "Training · FlagFit",
      },
      {
        path: "wellness",
        loadComponent: () =>
          import("../../wellness/wellness.component").then((m) => m.WellnessComponent),
        title: "Wellness · FlagFit",
      },
      {
        path: "stats",
        loadComponent: () =>
          import("../../stats/stats.component").then((m) => m.StatsComponent),
        title: "Stats · FlagFit",
      },
      {
        path: "more",
        loadComponent: () =>
          import("../../more/more.component").then((m) => m.MoreComponent),
        title: "More · FlagFit",
      },
      {
        path: "supplements",
        loadComponent: () =>
          import("../../supplements/supplements.component").then((m) => m.SupplementsComponent),
        title: "Supplements · FlagFit",
      },
      {
        path: "settings",
        loadComponent: () =>
          import("../../settings/settings.component").then((m) => m.SettingsComponent),
        title: "Settings · FlagFit",
      },
      {
        path: "achievements",
        loadComponent: () =>
          import("../../achievements/achievements.component").then((m) => m.AchievementsComponent),
        title: "Achievements · FlagFit",
      },
      {
        path: "notifications",
        loadComponent: () =>
          import("../../notifications/notifications.component").then((m) => m.NotificationsComponent),
        title: "Notifications · FlagFit",
      },
      {
        path: "acwr",
        loadComponent: () =>
          import("../../acwr/acwr.component").then((m) => m.AcwrComponent),
        title: "Load · FlagFit",
      },
      {
        path: "profile",
        loadComponent: () =>
          import("../../profile/profile.component").then((m) => m.ProfileComponent),
        title: "Profile · FlagFit",
      },
      {
        path: "competition",
        loadComponent: () =>
          import("../../competition/competition.component").then((m) => m.CompetitionComponent),
        title: "Competition · FlagFit",
      },
      {
        path: "gameday",
        loadComponent: () =>
          import("../../gameday/gameday.component").then((m) => m.GamedayComponent),
        title: "Game day · FlagFit",
      },
      {
        path: "chat",
        loadComponent: () =>
          import("../../chat/chat.component").then((m) => m.ChatComponent),
        title: "Merlin · FlagFit",
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
