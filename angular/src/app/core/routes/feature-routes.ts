/**
 * Feature Route Groups
 *
 * Groups routes by feature area for better code splitting and organization
 * Each group can be lazy loaded as a unit, reducing bundle size
 */

import { Routes } from "@angular/router";
import { authGuard } from "../guards/auth.guard";
import { superadminGuard } from "../guards/superadmin.guard";
import { headerConfigGuard } from "../guards/header-config.guard";
import { analyticsPrefetchResolver } from "../resolvers/analytics-prefetch.resolver";
import { gameTrackerPrefetchResolver } from "../resolvers/game-tracker-prefetch.resolver";

/**
 * Public Routes (No Authentication Required)
 */
export const publicRoutes: Routes = [
  {
    path: "",
    loadComponent: () =>
      import("../../features/landing/landing.component").then(
        (m) => m.LandingComponent,
      ),
    data: { preload: true }, // Preload landing page
  },
  {
    path: "login",
    loadComponent: () =>
      import("../../features/auth/login/login.component").then(
        (m) => m.LoginComponent,
      ),
  },
  {
    path: "register",
    loadComponent: () =>
      import("../../features/auth/register/register.component").then(
        (m) => m.RegisterComponent,
      ),
  },
  {
    path: "reset-password",
    loadComponent: () =>
      import("../../features/auth/reset-password/reset-password.component").then(
        (m) => m.ResetPasswordComponent,
      ),
  },
  {
    path: "update-password",
    loadComponent: () =>
      import("../../features/auth/update-password/update-password.component").then(
        (m) => m.UpdatePasswordComponent,
      ),
  },
  {
    path: "verify-email",
    loadComponent: () =>
      import("../../features/auth/verify-email/verify-email.component").then(
        (m) => m.VerifyEmailComponent,
      ),
  },
  {
    path: "auth/callback",
    loadComponent: () =>
      import("../../features/auth/auth-callback/auth-callback.component").then(
        (m) => m.AuthCallbackComponent,
      ),
  },
  {
    path: "onboarding",
    loadComponent: () =>
      import("../../features/onboarding/onboarding.component").then(
        (m) => m.OnboardingComponent,
      ),
  },
  {
    path: "accept-invitation",
    loadComponent: () =>
      import("../../features/team/accept-invitation/accept-invitation.component").then(
        (m) => m.AcceptInvitationComponent,
      ),
  },
];

/**
 * Dashboard Routes (High Priority - Preload Immediately)
 */
export const dashboardRoutes: Routes = [
  {
    path: "dashboard",
    loadComponent: () =>
      import("../../features/dashboard/dashboard.component").then(
        (m) => m.DashboardComponent,
      ),
    canActivate: [authGuard, headerConfigGuard],
    data: { preload: true, priority: "high" },
  },
];

/**
 * Training Routes (High Priority)
 */
export const trainingRoutes: Routes = [
  {
    path: "training",
    loadComponent: () =>
      import("../../features/training/training.component").then(
        (m) => m.TrainingComponent,
      ),
    canActivate: [authGuard, headerConfigGuard],
    data: { preload: true, priority: "high" },
  },
  {
    path: "training/daily",
    loadComponent: () =>
      import("../../features/training/daily-training/daily-training.component").then(
        (m) => m.DailyTrainingComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "high" },
  },
  {
    path: "workout",
    loadComponent: () =>
      import("../../features/workout/workout.component").then(
        (m) => m.WorkoutComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: "exercise-library",
    loadComponent: () =>
      import("../../features/exercise-library/exercise-library.component").then(
        (m) => m.ExerciseLibraryComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: "training/schedule",
    loadComponent: () =>
      import("../../features/training/training-schedule/training-schedule.component").then(
        (m) => m.TrainingScheduleComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: "training/qb/schedule",
    loadComponent: () =>
      import("../../features/training/qb-training-schedule/qb-training-schedule.component").then(
        (m) => m.QbTrainingScheduleComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: "training/qb/throwing",
    loadComponent: () =>
      import("../../features/training/qb-throwing-tracker/qb-throwing-tracker.component").then(
        (m) => m.QbThrowingTrackerComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: "training/qb/assessment",
    loadComponent: () =>
      import("../../features/training/qb-assessment-tools/qb-assessment-tools.component").then(
        (m) => m.QbAssessmentToolsComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: "training/ai-scheduler",
    loadComponent: () =>
      import("../../features/training/ai-training-scheduler/ai-training-scheduler.component").then(
        (m) => m.AiTrainingSchedulerComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: "training/log",
    loadComponent: () =>
      import("../../features/training/training-log/training-log.component").then(
        (m) => m.TrainingLogComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: "training/safety",
    loadComponent: () =>
      import("../../features/training/training-safety/training-safety.component").then(
        (m) => m.TrainingSafetyComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: "training/smart-form",
    loadComponent: () =>
      import("../../features/training/smart-training-form/smart-training-form.component").then(
        (m) => m.SmartTrainingFormComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: "training/session/:id",
    loadComponent: () =>
      import("../../features/training/training-schedule/training-schedule.component").then(
        (m) => m.TrainingScheduleComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: "training/videos",
    loadComponent: () =>
      import("../../features/training/video-feed/video-feed.component").then(
        (m) => m.VideoFeedComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "high" },
  },
  {
    path: "training/videos/curation",
    loadComponent: () =>
      import("../../features/training/video-curation/video-curation.component").then(
        (m) => m.VideoCurationComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: "training/videos/suggest",
    loadComponent: () =>
      import("../../features/training/video-suggestion/video-suggestion.component").then(
        (m) => m.VideoSuggestionComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "medium" },
  },
  // === NEW ROUTES: Previously orphaned training components ===
  {
    path: "training/ai-companion",
    loadComponent: () =>
      import("../../features/training/ai-training-companion.component").then(
        (m) => m.AITrainingCompanionComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false }, // AI features load on demand
  },
  {
    path: "training/load-analysis",
    loadComponent: () =>
      import("../../features/training/flag-load.component").then(
        (m) => m.FlagLoadComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: "training/goal-planner",
    loadComponent: () =>
      import("../../features/training/goal-based-planner.component").then(
        (m) => m.GoalBasedPlannerComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: "training/microcycle",
    loadComponent: () =>
      import("../../features/training/microcycle-planner.component").then(
        (m) => m.MicrocyclePlannerComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: "training/import",
    loadComponent: () =>
      import("../../features/training/import-dataset.component").then(
        (m) => m.ImportDatasetComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: "training/periodization",
    loadComponent: () =>
      import("../../features/training/components/periodization-dashboard/periodization-dashboard.component").then(
        (m) => m.PeriodizationDashboardComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "medium" },
  },
];

/**
 * Analytics Routes (High Priority with Prefetch)
 */
export const analyticsRoutes: Routes = [
  {
    path: "analytics",
    loadComponent: () =>
      import("../../features/analytics/analytics.component").then(
        (m) => m.AnalyticsComponent,
      ),
    canActivate: [authGuard, headerConfigGuard],
    resolve: { prefetch: analyticsPrefetchResolver },
    data: { preload: true, priority: "high" },
  },
  {
    path: "analytics/enhanced",
    loadComponent: () =>
      import("../../features/analytics/enhanced-analytics/enhanced-analytics.component").then(
        (m) => m.EnhancedAnalyticsComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: "performance-tracking",
    loadComponent: () =>
      import("../../features/performance-tracking/performance-tracking.component").then(
        (m) => m.PerformanceTrackingComponent,
      ),
    canActivate: [authGuard],
  },
];

/**
 * Team Management Routes
 */
export const teamRoutes: Routes = [
  {
    path: "roster",
    loadComponent: () =>
      import("../../features/roster/roster.component").then(
        (m) => m.RosterComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "high" },
  },
  {
    path: "coach",
    loadComponent: () =>
      import("../../features/coach/coach.component").then(
        (m) => m.CoachComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: "coach/dashboard",
    loadComponent: () =>
      import("../../features/dashboard/coach-dashboard.component").then(
        (m) => m.CoachDashboardComponent,
      ),
    canActivate: [authGuard],
  },
  // === NEW ROUTE: Coach Activity Feed ===
  {
    path: "coach/activity",
    loadComponent: () =>
      import("../../features/coach/coach-activity-feed.component").then(
        (m) => m.CoachActivityFeedComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "medium" }, // Important for coach workflow
  },
  {
    path: "team/create",
    loadComponent: () =>
      import("../../features/team/team-create/team-create.component").then(
        (m) => m.TeamCreateComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: "attendance",
    loadComponent: () =>
      import("../../features/attendance/attendance.component").then(
        (m) => m.AttendanceComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: "depth-chart",
    loadComponent: () =>
      import("../../features/depth-chart/depth-chart.component").then(
        (m) => m.DepthChartComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: "equipment",
    loadComponent: () =>
      import("../../features/equipment/equipment.component").then(
        (m) => m.EquipmentComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: "officials",
    loadComponent: () =>
      import("../../features/officials/officials.component").then(
        (m) => m.OfficialsComponent,
      ),
    canActivate: [authGuard],
  },
];

/**
 * Game & Competition Routes
 */
export const gameRoutes: Routes = [
  {
    path: "game/readiness",
    loadComponent: () =>
      import("../../features/game/game-day-readiness/game-day-readiness.component").then(
        (m) => m.GameDayReadinessComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "high" }, // Critical for game days
  },
  {
    path: "game/nutrition",
    loadComponent: () =>
      import("../../features/game/tournament-nutrition/tournament-nutrition.component").then(
        (m) => m.TournamentNutritionComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "high" }, // Critical for tournament days
  },
  {
    path: "travel/recovery",
    loadComponent: () =>
      import("../../features/travel/travel-recovery/travel-recovery.component").then(
        (m) => m.TravelRecoveryComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "high" }, // Critical for Olympic travel planning
  },
  {
    path: "game-tracker",
    loadComponent: () =>
      import("../../features/game-tracker/game-tracker.component").then(
        (m) => m.GameTrackerComponent,
      ),
    canActivate: [authGuard],
    resolve: { prefetch: gameTrackerPrefetchResolver },
    data: { preload: false }, // Heavy component, don't preload
  },
  {
    path: "tournaments",
    loadComponent: () =>
      import("../../features/tournaments/tournaments.component").then(
        (m) => m.TournamentsComponent,
      ),
    canActivate: [authGuard],
  },
  // === NEW ROUTE: Live Game Tracker ===
  {
    path: "game-tracker/live",
    loadComponent: () =>
      import("../../features/game-tracker/live-game-tracker.component").then(
        (m) => m.LiveGameTrackerComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false }, // Heavy real-time component
  },
];

/**
 * Wellness & Health Routes
 */
export const wellnessRoutes: Routes = [
  {
    path: "wellness",
    loadComponent: () =>
      import("../../features/wellness/wellness.component").then(
        (m) => m.WellnessComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: "acwr",
    loadComponent: () =>
      import("../../features/acwr-dashboard/acwr-dashboard.component").then(
        (m) => m.AcwrDashboardComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: "load-monitoring",
    redirectTo: "acwr",
  },
  {
    path: "injury-prevention",
    redirectTo: "acwr",
  },
];

/**
 * Social & Community Routes
 */
export const socialRoutes: Routes = [
  {
    path: "community",
    loadComponent: () =>
      import("../../features/community/community.component").then(
        (m) => m.CommunityComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: "chat",
    loadComponent: () =>
      import("../../features/chat/chat.component").then((m) => m.ChatComponent),
    canActivate: [authGuard],
  },
];

/**
 * User Profile Routes
 */
export const profileRoutes: Routes = [
  {
    path: "profile",
    loadComponent: () =>
      import("../../features/profile/profile.component").then(
        (m) => m.ProfileComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: "settings",
    loadComponent: () =>
      import("../../features/settings/settings.component").then(
        (m) => m.SettingsComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: "settings/profile",
    loadComponent: () =>
      import("../../features/settings/settings.component").then(
        (m) => m.SettingsComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: "settings/privacy",
    loadComponent: () =>
      import("../../features/settings/privacy-controls/privacy-controls.component").then(
        (m) => m.PrivacyControlsComponent,
      ),
    canActivate: [authGuard],
    title: "Privacy Controls - FlagFit Pro",
  },
];

/**
 * Superadmin Routes (Protected - Only for superadmins)
 * Separate dashboard and settings for platform administration
 */
export const superadminRoutes: Routes = [
  {
    path: "superadmin",
    loadComponent: () =>
      import("../../features/superadmin/superadmin-dashboard.component").then(
        (m) => m.SuperadminDashboardComponent,
      ),
    canActivate: [superadminGuard],
    data: { preload: false }, // Don't preload admin routes
  },
  {
    path: "superadmin/settings",
    loadComponent: () =>
      import("../../features/superadmin/superadmin-settings.component").then(
        (m) => m.SuperadminSettingsComponent,
      ),
    canActivate: [superadminGuard],
  },
  {
    path: "superadmin/teams",
    loadComponent: () =>
      import("../../features/superadmin/superadmin-dashboard.component").then(
        (m) => m.SuperadminDashboardComponent,
      ),
    canActivate: [superadminGuard],
  },
  {
    path: "superadmin/users",
    loadComponent: () =>
      import("../../features/superadmin/superadmin-dashboard.component").then(
        (m) => m.SuperadminDashboardComponent,
      ),
    canActivate: [superadminGuard],
  },
];

/**
 * Combined Feature Routes
 * Organized by priority and feature area
 */
export const featureRoutes: Routes = [
  ...publicRoutes,
  ...superadminRoutes, // Superadmin routes first (most specific)
  ...dashboardRoutes,
  ...trainingRoutes,
  ...analyticsRoutes,
  ...teamRoutes,
  ...gameRoutes,
  ...wellnessRoutes,
  ...socialRoutes,
  ...profileRoutes,
  {
    path: "**",
    loadComponent: () =>
      import("../../features/not-found/not-found.component").then(
        (m) => m.NotFoundComponent,
      ),
  },
];
