import { Routes } from "@angular/router";
import { ShellComponent } from "../../shell/shell.component";
import { staffGuard } from "../guards/staff.guard";
import { authGuard } from "../guards/auth.guard";

/**
 * Feature routes — rebuilt incrementally in Phase E from the approved static
 * design (redesign/ground-zero). Screens render inside the persistent
 * ShellComponent (each screen renders its own top bar; the bottom nav + FAB are
 * the shell). Original path→screen→guard mapping is preserved uncompiled in
 * redesign/_reference/routes/ and restored as each screen is ported.
 */
export const featureRoutes: Routes = [
  // Entry flow — outside the app shell (no bottom nav).
  {
    path: "landing",
    loadComponent: () => import("../../landing/landing.component").then((m) => m.LandingComponent),
    title: "FlagFit Pro",
  },
  {
    path: "login",
    loadComponent: () => import("../../landing/landing.component").then((m) => m.LandingComponent),
    title: "Sign in · FlagFit",
  },
  {
    path: "onboarding",
    loadComponent: () => import("../../onboarding/onboarding.component").then((m) => m.OnboardingComponent),
    title: "Get started · FlagFit",
  },
  {
    path: "verify-email",
    loadComponent: () => import("../../verify-email/verify-email.component").then((m) => m.VerifyEmailComponent),
    title: "Verify email · FlagFit",
  },
  // Staff track (coach / physio / nutritionist / psychologist) — auth + role guarded.
  {
    path: "staff",
    canActivate: [authGuard, staffGuard],
    loadComponent: () => import("../../staff/staff-shell.component").then((m) => m.StaffShellComponent),
    children: [
      { path: "", pathMatch: "full", redirectTo: "roster" },
      { path: "roster", loadComponent: () => import("../../staff/roster/roster.component").then((m) => m.RosterComponent), title: "Roster · FlagFit" },
      { path: "athlete/:id", loadComponent: () => import("../../staff/athlete-detail/athlete-detail.component").then((m) => m.AthleteDetailComponent), title: "Athlete · FlagFit" },
      { path: "alerts", loadComponent: () => import("../../staff/alerts/alerts.component").then((m) => m.AlertsComponent), title: "Alerts · FlagFit" },
      { path: "library", loadComponent: () => import("../../staff/library/library.component").then((m) => m.StaffLibraryComponent), title: "Library · FlagFit" },
      { path: "events", loadComponent: () => import("../../staff/events/events.component").then((m) => m.StaffEventsComponent), title: "Events · FlagFit" },
      { path: "more", loadComponent: () => import("../../staff/staff-more/staff-more.component").then((m) => m.StaffMoreComponent), title: "More · FlagFit" },
    ],
  },
  {
    path: "",
    component: ShellComponent,
    canActivate: [authGuard],
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
