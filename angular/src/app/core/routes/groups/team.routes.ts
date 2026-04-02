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
    data: {
      preload: true,
      priority: "high",
      entry: "internal",
      headerPreset: "dashboard",
    },
  },
  {
    path: "team/workspace",
    loadComponent: () =>
      import("../../../features/team/team-workspace/team-workspace.component").then(
        (m) => m.TeamWorkspaceComponent,
      ),
    canActivate: [authGuard],
    data: {
      preload: true,
      priority: "high",
      entry: "internal",
      headerPreset: "dashboard",
    }, // Core team hub in 2.0
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
    data: {
      preload: true,
      priority: "high",
      entry: "internal",
      headerPreset: "dashboard",
    }, // Coach main dashboard
  },
  // === NEW ROUTE: Coach Activity Feed ===
  {
    path: "coach/activity",
    redirectTo: "coach/dashboard",
    pathMatch: "full",
    data: { entry: "legacy" },
  },
  {
    path: "coach/analytics",
    loadComponent: () =>
      import("../../../features/coach/coach-analytics/coach-analytics.component").then(
        (m) => m.CoachAnalyticsComponent,
      ),
    canActivate: [authGuard, coachRoleGuard],
    data: {
      preload: true,
      priority: "high",
      entry: "internal",
      headerPreset: "analytics",
    }, // Core coach workflow
  },
  {
    path: "coach/planning",
    redirectTo: "coach/calendar",
    pathMatch: "full",
    data: { entry: "hub" },
  },
  {
    path: "coach/team-workspace",
    redirectTo: "team/workspace",
    pathMatch: "full",
    data: { entry: "hub" },
  },
  {
    path: "coach/inbox",
    redirectTo: "team-chat",
    pathMatch: "full",
    data: { entry: "legacy" },
  },
  {
    path: "coach/team",
    loadComponent: () =>
      import("../../../features/coach/team-management/team-management.component").then(
        (m) => m.TeamManagementComponent,
      ),
    canActivate: [authGuard, coachRoleGuard],
    data: { preload: false, entry: "internal", headerPreset: "dashboard" }, // Operational tool
  },
  {
    path: "coach/team-management",
    redirectTo: "coach/team",
    pathMatch: "full",
    data: { entry: "legacy" },
  },
  {
    path: "coach/programs",
    redirectTo: "coach/planning",
    pathMatch: "full",
    data: { entry: "legacy" },
  },
  {
    path: "coach/program-builder",
    redirectTo: "coach/planning",
    pathMatch: "full",
    data: { entry: "legacy" },
  },
  {
    path: "coach/practice",
    loadComponent: () =>
      import("../../../features/coach/practice-planner/practice-planner.component").then(
        (m) => m.PracticePlannerComponent,
      ),
    canActivate: [authGuard, coachRoleGuard],
    data: { preload: false, entry: "internal", headerPreset: "training" }, // Planning sub-tool
  },
  {
    path: "coach/practice-planner",
    redirectTo: "coach/planning",
    pathMatch: "full",
    data: { entry: "legacy" },
  },
  {
    path: "coach/injuries",
    redirectTo: "coach/analytics",
    pathMatch: "full",
    data: { entry: "legacy" },
  },
  {
    path: "coach/injury-management",
    redirectTo: "coach/analytics",
    pathMatch: "full",
    data: { entry: "legacy" },
  },
  {
    path: "coach/playbook",
    redirectTo: "coach/planning",
    pathMatch: "full",
    data: { entry: "legacy" },
  },
  {
    path: "coach/development",
    redirectTo: "coach/analytics",
    pathMatch: "full",
    data: { entry: "legacy" },
  },
  {
    path: "coach/player-development",
    redirectTo: "coach/analytics",
    pathMatch: "full",
    data: { entry: "legacy" },
  },
  {
    path: "coach/tournaments",
    loadComponent: () =>
      import("../../../features/coach/tournament-management/tournament-management.component").then(
        (m) => m.TournamentManagementComponent,
      ),
    canActivate: [authGuard, coachRoleGuard],
    data: { preload: false, entry: "internal", headerPreset: "dashboard" }, // Seasonal feature
  },
  {
    path: "coach/payments",
    redirectTo: "team/workspace",
    pathMatch: "full",
    data: { entry: "legacy" },
  },
  {
    path: "coach/ai-scheduler",
    redirectTo: "coach/planning",
    pathMatch: "full",
    data: { entry: "legacy" },
  },
  {
    path: "knowledge",
    loadComponent: () =>
      import("../../../features/coach/knowledge-base/knowledge-base.component").then(
        (m) => m.KnowledgeBaseComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal", headerPreset: "default" }, // Shared knowledge feature
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
    redirectTo: "coach/planning",
    pathMatch: "full",
    data: { entry: "legacy" },
  },
  {
    path: "coach/calendar",
    loadComponent: () =>
      import("../../../features/coach/calendar/calendar-coach.component").then(
        (m) => m.CalendarCoachComponent,
      ),
    canActivate: [authGuard, coachRoleGuard],
    data: { preload: false, entry: "internal", headerPreset: "training" }, // Planning sub-tool
  },
  {
    path: "coach/scouting",
    redirectTo: "coach/planning",
    pathMatch: "full",
    data: { entry: "legacy" },
  },
  {
    path: "admin",
    redirectTo: "superadmin",
    pathMatch: "full",
    data: { entry: "internal" },
  },
  {
    path: "team/create",
    redirectTo: "team/workspace",
    pathMatch: "full",
    data: { entry: "legacy" },
  },
  {
    path: "attendance",
    loadComponent: () =>
      import("../../../features/attendance/attendance.component").then(
        (m) => m.AttendanceComponent,
      ),
    canActivate: [authGuard, coachRoleGuard],
    data: { preload: false, entry: "internal", headerPreset: "dashboard" }, // Team operations tool
  },
  {
    path: "depth-chart",
    redirectTo: "team/workspace",
    pathMatch: "full",
    data: { entry: "legacy" },
  },
  {
    path: "equipment",
    redirectTo: "team/workspace",
    pathMatch: "full",
    data: { entry: "legacy" },
  },
  {
    path: "officials",
    redirectTo: "team/workspace",
    pathMatch: "full",
    data: { entry: "legacy" },
  },
];
