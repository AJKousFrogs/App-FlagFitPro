import { Routes } from "@angular/router";
import { ShellComponent } from "../../shell/shell.component";
import { staffGuard, homeRedirectGuard } from "../guards/staff.guard";
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
    loadComponent: () =>
      import("../../landing/landing.component").then((m) => m.LandingComponent),
    title: "FlagFit Pro",
  },
  {
    path: "login",
    loadComponent: () =>
      import("../../landing/landing.component").then((m) => m.LandingComponent),
    title: "Sign in · FlagFit",
  },
  {
    path: "onboarding",
    loadComponent: () =>
      import("../../onboarding/onboarding.component").then(
        (m) => m.OnboardingComponent,
      ),
    title: "Get started · FlagFit",
  },
  {
    path: "verify-email",
    loadComponent: () =>
      import("../../verify-email/verify-email.component").then(
        (m) => m.VerifyEmailComponent,
      ),
    title: "Verify email · FlagFit",
  },
  {
    path: "reset-password",
    loadComponent: () =>
      import("../../reset-password/reset-password.component").then(
        (m) => m.ResetPasswordComponent,
      ),
    title: "Reset password · FlagFit",
  },
  {
    path: "update-password",
    loadComponent: () =>
      import("../../update-password/update-password.component").then(
        (m) => m.UpdatePasswordComponent,
      ),
    title: "Set new password · FlagFit",
  },
  {
    path: "accept-invitation",
    loadComponent: () =>
      import("../../accept-invitation/accept-invitation.component").then(
        (m) => m.AcceptInvitationComponent,
      ),
    title: "Team invitation · FlagFit",
  },
  // Staff track (coach / physio / nutritionist / psychologist) — auth + role guarded.
  {
    path: "staff",
    canActivate: [authGuard, staffGuard],
    loadComponent: () =>
      import("../../staff/staff-shell.component").then(
        (m) => m.StaffShellComponent,
      ),
    children: [
      { path: "", pathMatch: "full", redirectTo: "roster" },
      {
        path: "roster",
        loadComponent: () =>
          import("../../staff/roster/roster.component").then(
            (m) => m.RosterComponent,
          ),
        title: "Roster · FlagFit",
      },
      {
        path: "athlete/:id",
        loadComponent: () =>
          import("../../staff/athlete-detail/athlete-detail.component").then(
            (m) => m.AthleteDetailComponent,
          ),
        title: "Athlete · FlagFit",
      },
      {
        // Single-athlete monitoring report + squad table, hosted INSIDE the staff
        // shell so staff keep their nav/context (previously these linked to the
        // athlete-shell copies and stranded staff there — 2026-07-10 E2E audit).
        path: "monitoring/:id",
        loadComponent: () =>
          import("../../monitoring-report/monitoring-report.component").then(
            (m) => m.MonitoringReportComponent,
          ),
        title: "Monitoring · FlagFit",
      },
      {
        path: "team-monitoring",
        loadComponent: () =>
          import("../../team-monitoring/team-monitoring.component").then(
            (m) => m.TeamMonitoringComponent,
          ),
        title: "Squad monitoring · FlagFit",
      },
      {
        path: "alerts",
        loadComponent: () =>
          import("../../staff/alerts/alerts.component").then(
            (m) => m.AlertsComponent,
          ),
        title: "Alerts · FlagFit",
      },
      {
        path: "library",
        loadComponent: () =>
          import("../../staff/library/library.component").then(
            (m) => m.StaffLibraryComponent,
          ),
        title: "Library · FlagFit",
      },
      {
        path: "events",
        loadComponent: () =>
          import("../../staff/events/events.component").then(
            (m) => m.StaffEventsComponent,
          ),
        title: "Events · FlagFit",
      },
      {
        path: "more",
        loadComponent: () =>
          import("../../staff/staff-more/staff-more.component").then(
            (m) => m.StaffMoreComponent,
          ),
        title: "More · FlagFit",
      },
    ],
  },
  // Bare root: send staff to the staff shell, everyone else to the athlete app.
  // Full-match so only "/" hits this — /today, /training, … fall through to the
  // athlete shell below. Role lives in team_members, hence a guard not a static
  // redirect (see homeRedirectGuard).
  {
    path: "",
    pathMatch: "full",
    canActivate: [authGuard, homeRedirectGuard],
    children: [],
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
          import("../../training/training.component").then(
            (m) => m.TrainingComponent,
          ),
        title: "Training · FlagFit",
      },
      {
        path: "wellness",
        loadComponent: () =>
          import("../../wellness/wellness.component").then(
            (m) => m.WellnessComponent,
          ),
        title: "Wellness · FlagFit",
      },
      {
        path: "stats",
        loadComponent: () =>
          import("../../stats/stats.component").then((m) => m.StatsComponent),
        title: "Stats · FlagFit",
      },
      {
        path: "monitoring",
        loadComponent: () =>
          import("../../monitoring-report/monitoring-report.component").then(
            (m) => m.MonitoringReportComponent,
          ),
        title: "Monitoring · FlagFit",
      },
      {
        path: "monitoring/:id",
        loadComponent: () =>
          import("../../monitoring-report/monitoring-report.component").then(
            (m) => m.MonitoringReportComponent,
          ),
        title: "Monitoring · FlagFit",
      },
      {
        path: "team-monitoring",
        loadComponent: () =>
          import("../../team-monitoring/team-monitoring.component").then(
            (m) => m.TeamMonitoringComponent,
          ),
        title: "Squad monitoring · FlagFit",
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
          import("../../supplements/supplements.component").then(
            (m) => m.SupplementsComponent,
          ),
        title: "Supplements · FlagFit",
      },
      {
        path: "settings",
        loadComponent: () =>
          import("../../settings/settings.component").then(
            (m) => m.SettingsComponent,
          ),
        title: "Settings · FlagFit",
      },
      {
        path: "achievements",
        loadComponent: () =>
          import("../../achievements/achievements.component").then(
            (m) => m.AchievementsComponent,
          ),
        title: "Achievements · FlagFit",
      },
      {
        path: "notifications",
        loadComponent: () =>
          import("../../notifications/notifications.component").then(
            (m) => m.NotificationsComponent,
          ),
        title: "Notifications · FlagFit",
      },
      {
        path: "acwr",
        loadComponent: () =>
          import("../../acwr/acwr.component").then((m) => m.AcwrComponent),
        title: "Load · FlagFit",
      },
      {
        path: "return-to-play",
        loadComponent: () =>
          import("../../return-to-play/return-to-play.component").then(
            (m) => m.ReturnToPlayComponent,
          ),
        title: "Return to play · FlagFit",
      },
      {
        path: "sleep-debt",
        loadComponent: () =>
          import("../../sleep-debt/sleep-debt.component").then(
            (m) => m.SleepDebtComponent,
          ),
        title: "Sleep debt · FlagFit",
      },
      {
        path: "nutrition",
        loadComponent: () =>
          import("../../nutrition/nutrition.component").then(
            (m) => m.NutritionComponent,
          ),
        title: "Fuel plan · FlagFit",
      },
      {
        path: "roster",
        loadComponent: () =>
          import("../../roster/roster.component").then(
            (m) => m.RosterComponent,
          ),
        title: "Roster · FlagFit",
      },
      {
        path: "knowledge",
        loadComponent: () =>
          import("../../knowledge/knowledge.component").then(
            (m) => m.KnowledgeComponent,
          ),
        title: "Knowledge · FlagFit",
      },
      {
        path: "reports",
        loadComponent: () =>
          import("../../reports/reports.component").then(
            (m) => m.ReportsComponent,
          ),
        title: "Reports · FlagFit",
      },
      {
        // Built and routable, but deliberately not surfaced in nav — the team
        // uses WhatsApp. Flip the More "Team chat" row to routerLink="/team-chat"
        // to expose it.
        path: "team-chat",
        loadComponent: () =>
          import("../../team-chat/team-chat.component").then(
            (m) => m.TeamChatComponent,
          ),
        title: "Team chat · FlagFit",
      },
      {
        path: "profile",
        loadComponent: () =>
          import("../../profile/profile.component").then(
            (m) => m.ProfileComponent,
          ),
        title: "Profile · FlagFit",
      },
      {
        path: "profile/edit",
        loadComponent: () =>
          import("../../profile/profile-edit.component").then(
            (m) => m.ProfileEditComponent,
          ),
        title: "Edit profile · FlagFit",
      },
      {
        path: "schedule",
        loadComponent: () =>
          import("../../schedule/schedule.component").then(
            (m) => m.ScheduleComponent,
          ),
        title: "Schedule · FlagFit",
      },
      {
        path: "competition",
        loadComponent: () =>
          import("../../competition/competition.component").then(
            (m) => m.CompetitionComponent,
          ),
        title: "Competition · FlagFit",
      },
      {
        path: "gameday",
        loadComponent: () =>
          import("../../gameday/gameday.component").then(
            (m) => m.GamedayComponent,
          ),
        title: "Game day · FlagFit",
      },
      {
        path: "chat",
        loadComponent: () =>
          import("../../chat/chat.component").then((m) => m.ChatComponent),
        title: "Merlin · FlagFit",
      },
      {
        // Design-system gallery — intentionally not linked from any nav.
        // Access via direct URL (/gallery) only; used for component review.
        path: "gallery",
        loadComponent: () =>
          import("../../gallery/gallery.component").then(
            (m) => m.GalleryComponent,
          ),
        title: "Design System · FlagFit",
      },
      // Unknown sub-path inside the shell → home, instead of an uncaught
      // NG04002. (e.g. a stale deep link or a bad in-app navigation target.)
      { path: "**", redirectTo: "today" },
    ],
  },
  // Catch-all for anything outside the shell (bad top-level deep links) → home.
  { path: "**", redirectTo: "today" },
];
