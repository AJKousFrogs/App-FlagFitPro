import { Routes } from "@angular/router";
import { authGuard } from "../../guards/auth.guard";
import { femaleAthleteGuard } from "../../guards/female-athlete.guard";

export const wellnessRoutes: Routes = [
  {
    path: "wellness",
    loadComponent: () =>
      import("../../../features/wellness/wellness.component").then(
        (m) => m.WellnessComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "high", entry: "internal" }, // Daily feature
  },
  {
    path: "acwr",
    loadComponent: () =>
      import("../../../features/acwr-dashboard/acwr-dashboard.component").then(
        (m) => m.AcwrDashboardComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "medium", entry: "internal" }, // Load monitoring
  },
  {
    path: "return-to-play",
    loadComponent: () =>
      import("../../../features/return-to-play/return-to-play.component").then(
        (m) => m.ReturnToPlayComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Load on demand - not frequently accessed
  },
  {
    path: "cycle-tracking",
    loadComponent: () =>
      import("../../../features/cycle-tracking/cycle-tracking.component").then(
        (m) => m.CycleTrackingComponent,
      ),
    canActivate: [authGuard, femaleAthleteGuard],
    data: { preload: false, entry: "internal" }, // Load on demand - female athletes only
  },
  {
    path: "sleep-debt",
    loadComponent: () =>
      import("../../../features/sleep-debt/sleep-debt.component").then(
        (m) => m.SleepDebtComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Load on demand
  },
  {
    path: "achievements",
    loadComponent: () =>
      import("../../../features/achievements/achievements.component").then(
        (m) => m.AchievementsComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Load on demand
  },
  {
    path: "playbook",
    loadComponent: () =>
      import("../../../features/playbook/playbook.component").then(
        (m) => m.PlaybookComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Load on demand
  },
  {
    path: "film",
    loadComponent: () =>
      import("../../../features/film-room/film-room.component").then(
        (m) => m.FilmRoomComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Load on demand
  },
  {
    path: "film-room",
    redirectTo: "film",
    pathMatch: "full",
    data: { entry: "internal" },
  },
  {
    path: "calendar",
    loadComponent: () =>
      import("../../../features/team-calendar/team-calendar.component").then(
        (m) => m.TeamCalendarComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Load on demand
  },
  {
    path: "payments",
    loadComponent: () =>
      import("../../../features/payments/payments.component").then(
        (m) => m.PaymentsComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Load on demand
  },
  {
    path: "import",
    loadComponent: () =>
      import("../../../features/data-import/data-import.component").then(
        (m) => m.DataImportComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Load on demand
  },
  {
    path: "load-monitoring",
    redirectTo: "acwr",
    pathMatch: "full",
    data: { entry: "internal" },
  },
  {
    path: "injury-prevention",
    redirectTo: "acwr",
    pathMatch: "full",
    data: { entry: "internal" },
  },
];
