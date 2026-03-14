import { Routes } from "@angular/router";
import { authGuard } from "../../guards/auth.guard";
import { coachRoleGuard } from "../../guards/team-role.guard";

export const teamRoutes: Routes = [
  {
    path: "roster",
    loadComponent: () =>
      import("../../../features/roster/roster.component").then(
        (m) => m.RosterComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "high", entry: "internal" },
  },
  {
    path: "team/workspace",
    loadComponent: () =>
      import("../../../features/team/team-workspace/team-workspace.component").then(
        (m) => m.TeamWorkspaceComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "medium", entry: "internal" }, // Team hub
  },
  {
    path: "coach",
    redirectTo: "coach/dashboard",
    pathMatch: "full",
    data: { entry: "hub" },
  },
  {
    path: "coach/dashboard",
    loadComponent: () =>
      import("../../../features/dashboard/coach-dashboard.component").then(
        (m) => m.CoachDashboardComponent,
      ),
    canActivate: [authGuard, coachRoleGuard],
    data: { preload: true, priority: "high", entry: "internal" }, // Coach main dashboard
  },
  // === NEW ROUTE: Coach Activity Feed ===
  {
    path: "coach/activity",
    loadComponent: () =>
      import("../../../features/coach/coach-activity-feed.component").then(
        (m) => m.CoachActivityFeedComponent,
      ),
    canActivate: [authGuard, coachRoleGuard],
    data: { preload: false, entry: "internal" }, // Load on demand
  },
  {
    path: "coach/analytics",
    loadComponent: () =>
      import("../../../features/coach/coach-analytics/coach-analytics.component").then(
        (m) => m.CoachAnalyticsComponent,
      ),
    canActivate: [authGuard, coachRoleGuard],
    data: { preload: true, priority: "medium", entry: "internal" }, // Coach analytics
  },
  {
    path: "coach/inbox",
    loadComponent: () =>
      import("../../../features/coach/coach-inbox/coach-inbox.component").then(
        (m) => m.CoachInboxComponent,
      ),
    canActivate: [authGuard, coachRoleGuard],
    data: { preload: true, priority: "medium", entry: "internal" }, // Coach messaging
  },
  {
    path: "coach/team",
    loadComponent: () =>
      import("../../../features/coach/team-management/team-management.component").then(
        (m) => m.TeamManagementComponent,
      ),
    canActivate: [authGuard, coachRoleGuard],
    data: { preload: true, priority: "medium", entry: "internal" }, // Team management
  },
  {
    path: "coach/team-management",
    redirectTo: "coach/team",
    pathMatch: "full",
    data: { entry: "legacy" },
  },
  {
    path: "coach/programs",
    loadComponent: () =>
      import("../../../features/coach/program-builder/program-builder.component").then(
        (m) => m.ProgramBuilderComponent,
      ),
    canActivate: [authGuard, coachRoleGuard],
    data: { preload: false, entry: "internal" }, // Advanced feature
  },
  {
    path: "coach/practice",
    loadComponent: () =>
      import("../../../features/coach/practice-planner/practice-planner.component").then(
        (m) => m.PracticePlannerComponent,
      ),
    canActivate: [authGuard, coachRoleGuard],
    data: { preload: true, priority: "low", entry: "internal" }, // Planning feature
  },
  {
    path: "coach/injuries",
    loadComponent: () =>
      import("../../../features/coach/injury-management/injury-management.component").then(
        (m) => m.InjuryManagementComponent,
      ),
    canActivate: [authGuard, coachRoleGuard],
    data: { preload: false, entry: "internal" }, // On-demand
  },
  {
    path: "coach/playbook",
    loadComponent: () =>
      import("../../../features/coach/playbook-manager/playbook-manager.component").then(
        (m) => m.PlaybookManagerComponent,
      ),
    canActivate: [authGuard, coachRoleGuard],
    data: { preload: false, entry: "internal" }, // On-demand
  },
  {
    path: "coach/development",
    loadComponent: () =>
      import("../../../features/coach/player-development/player-development.component").then(
        (m) => m.PlayerDevelopmentComponent,
      ),
    canActivate: [authGuard, coachRoleGuard],
    data: { preload: false, entry: "internal" }, // On-demand
  },
  {
    path: "coach/tournaments",
    loadComponent: () =>
      import("../../../features/coach/tournament-management/tournament-management.component").then(
        (m) => m.TournamentManagementComponent,
      ),
    canActivate: [authGuard, coachRoleGuard],
    data: { preload: false, entry: "internal" }, // Seasonal feature
  },
  {
    path: "coach/payments",
    loadComponent: () =>
      import("../../../features/coach/payment-management/payment-management.component").then(
        (m) => m.PaymentManagementComponent,
      ),
    canActivate: [authGuard, coachRoleGuard],
    data: { preload: false, entry: "internal" }, // Admin feature
  },
  {
    path: "coach/ai-scheduler",
    loadComponent: () =>
      import("../../../features/coach/ai-scheduler/ai-scheduler.component").then(
        (m) => m.AiSchedulerComponent,
      ),
    canActivate: [authGuard, coachRoleGuard],
    data: { preload: false, entry: "internal" }, // Advanced feature
  },
  {
    path: "knowledge",
    loadComponent: () =>
      import("../../../features/coach/knowledge-base/knowledge-base.component").then(
        (m) => m.KnowledgeBaseComponent,
      ),
    canActivate: [authGuard, coachRoleGuard],
    data: { preload: false, entry: "internal" }, // Reference feature
  },
  {
    path: "coach/knowledge",
    redirectTo: "knowledge",
    pathMatch: "full",
    data: { entry: "internal" },
  },
  {
    path: "knowledge-base",
    redirectTo: "knowledge",
    pathMatch: "full",
    data: { entry: "internal" },
  },
  {
    path: "coach/film",
    loadComponent: () =>
      import("../../../features/coach/film-room/film-room-coach.component").then(
        (m) => m.FilmRoomCoachComponent,
      ),
    canActivate: [authGuard, coachRoleGuard],
    data: { preload: false, entry: "internal" }, // Heavy component
  },
  {
    path: "coach/calendar",
    loadComponent: () =>
      import("../../../features/coach/calendar/calendar-coach.component").then(
        (m) => m.CalendarCoachComponent,
      ),
    canActivate: [authGuard, coachRoleGuard],
    data: { preload: true, priority: "low", entry: "internal" }, // Planning feature
  },
  {
    path: "coach/scouting",
    loadComponent: () =>
      import("../../../features/coach/scouting/scouting-reports.component").then(
        (m) => m.ScoutingReportsComponent,
      ),
    canActivate: [authGuard, coachRoleGuard],
    data: { preload: false, entry: "internal" }, // On-demand
  },
  {
    path: "admin",
    redirectTo: "superadmin",
    pathMatch: "full",
    data: { entry: "internal" },
  },
  {
    path: "team/create",
    loadComponent: () =>
      import("../../../features/team/team-create/team-create.component").then(
        (m) => m.TeamCreateComponent,
      ),
    canActivate: [authGuard, coachRoleGuard],
    data: { preload: false, entry: "internal" }, // One-time use
  },
  {
    path: "attendance",
    loadComponent: () =>
      import("../../../features/attendance/attendance.component").then(
        (m) => m.AttendanceComponent,
      ),
    canActivate: [authGuard, coachRoleGuard],
    data: { preload: true, priority: "low", entry: "internal" }, // Team feature
  },
  {
    path: "depth-chart",
    loadComponent: () =>
      import("../../../features/depth-chart/depth-chart.component").then(
        (m) => m.DepthChartComponent,
      ),
    canActivate: [authGuard, coachRoleGuard],
    data: { preload: false, entry: "internal" }, // Coach feature
  },
  {
    path: "equipment",
    loadComponent: () =>
      import("../../../features/equipment/equipment.component").then(
        (m) => m.EquipmentComponent,
      ),
    canActivate: [authGuard, coachRoleGuard],
    data: { preload: false, entry: "internal" }, // Admin feature
  },
  {
    path: "officials",
    loadComponent: () =>
      import("../../../features/officials/officials.component").then(
        (m) => m.OfficialsComponent,
      ),
    canActivate: [authGuard, coachRoleGuard],
    data: { preload: false, entry: "internal" }, // Game day feature
  },
];
