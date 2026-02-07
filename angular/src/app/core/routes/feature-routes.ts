/**
 * Feature Route Groups
 *
 * Groups routes by feature area for better code splitting and organization
 * Each group can be lazy loaded as a unit, reducing bundle size
 */

import { Routes } from "@angular/router";
import { authGuard } from "../guards/auth.guard";
import { femaleAthleteGuard } from "../guards/female-athlete.guard";
import { headerConfigGuard } from "../guards/header-config.guard";
import { superadminGuard } from "../guards/superadmin.guard";
import { analyticsPrefetchResolver } from "../resolvers/analytics-prefetch.resolver";
import { gameTrackerPrefetchResolver } from "../resolvers/game-tracker-prefetch.resolver";

/**
 * Preload Strategy Guide:
 * - priority: "high" = preload immediately after initial load
 * - priority: "medium" = preload after 2s delay
 * - priority: "low" = preload after 5s delay
 * - preload: false = never preload (load on demand only)
 *
 * Default (no data): preload: false (on-demand loading)
 */

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
    data: { preload: true, priority: "high", entry: "internal" }, // Landing page loads immediately
  },
  {
    path: "login",
    loadComponent: () =>
      import("../../features/auth/login/login.component").then(
        (m) => m.LoginComponent,
      ),
    data: { preload: true, priority: "medium", entry: "internal" }, // Auth pages preload after delay
  },
  {
    path: "register",
    loadComponent: () =>
      import("../../features/auth/register/register.component").then(
        (m) => m.RegisterComponent,
      ),
    data: { preload: true, priority: "medium", entry: "internal" },
  },
  {
    path: "reset-password",
    loadComponent: () =>
      import("../../features/auth/reset-password/reset-password.component").then(
        (m) => m.ResetPasswordComponent,
      ),
    data: { preload: false, entry: "deeplink" }, // On-demand - rarely accessed
  },
  {
    path: "update-password",
    loadComponent: () =>
      import("../../features/auth/update-password/update-password.component").then(
        (m) => m.UpdatePasswordComponent,
      ),
    data: { preload: false, entry: "deeplink" }, // On-demand - rarely accessed
  },
  {
    path: "verify-email",
    loadComponent: () =>
      import("../../features/auth/verify-email/verify-email.component").then(
        (m) => m.VerifyEmailComponent,
      ),
    data: { preload: false, entry: "deeplink" }, // On-demand - one-time use
  },
  {
    path: "auth/callback",
    loadComponent: () =>
      import("../../features/auth/auth-callback/auth-callback.component").then(
        (m) => m.AuthCallbackComponent,
      ),
    data: { preload: false, entry: "deeplink" }, // On-demand - OAuth callback
  },
  {
    path: "onboarding",
    loadComponent: () =>
      import("../../features/onboarding/onboarding.component").then(
        (m) => m.OnboardingComponent,
      ),
    data: { preload: false, entry: "internal" }, // On-demand - one-time use
  },
  {
    path: "accept-invitation",
    loadComponent: () =>
      import("../../features/team/accept-invitation/accept-invitation.component").then(
        (m) => m.AcceptInvitationComponent,
      ),
    data: { preload: false, entry: "deeplink" }, // On-demand - rarely accessed
  },
  {
    path: "terms",
    loadComponent: () =>
      import("../../features/legal/legal-doc.component").then(
        (m) => m.LegalDocComponent,
      ),
    data: { preload: false, legalDoc: "terms", entry: "internal" },
    title: "Terms of Use - FlagFit Pro",
  },
  {
    path: "privacy",
    loadComponent: () =>
      import("../../features/legal/legal-doc.component").then(
        (m) => m.LegalDocComponent,
      ),
    data: { preload: false, legalDoc: "privacy", entry: "internal" },
    title: "Privacy Policy - FlagFit Pro",
  },
  {
    path: "privacy-policy",
    loadComponent: () =>
      import("../../features/legal/legal-doc.component").then(
        (m) => m.LegalDocComponent,
      ),
    data: { preload: false, legalDoc: "privacy-policy", entry: "internal" },
    title: "Privacy Policy - FlagFit Pro",
  },
];

/**
 * Dashboard Routes (High Priority - Preload Immediately)
 */
export const dashboardRoutes: Routes = [
  {
    path: "todays-practice",
    loadComponent: () =>
      import("../../features/today/today.component").then(
        (m) => m.TodayComponent,
      ),
    canActivate: [authGuard, headerConfigGuard],
    data: { preload: true, priority: "high", entry: "internal" },
  },
  {
    path: "dashboard",
    redirectTo: "player-dashboard",
    pathMatch: "full",
    data: { entry: "internal" },
  },
  {
    path: "player-dashboard",
    loadComponent: () =>
      import("../../features/dashboard/player-dashboard.component").then(
        (m) => m.PlayerDashboardComponent,
      ),
    canActivate: [authGuard, headerConfigGuard],
    data: { preload: true, priority: "high", entry: "internal" },
  },
  {
    path: "athlete-dashboard",
    redirectTo: "player-dashboard",
    pathMatch: "full",
    data: { entry: "internal" },
  },
];

/**
 * Training Routes (High Priority)
 */
export const trainingRoutes: Routes = [
  // Main training page - monthly calendar view for managing/logging sessions
  {
    path: "training",
    loadComponent: () =>
      import("../../features/training/training-schedule/training-schedule.component").then(
        (m) => m.TrainingScheduleComponent,
      ),
    canActivate: [authGuard, headerConfigGuard],
    data: { preload: true, priority: "high", entry: "hub" },
  },
  {
    path: "training/builder",
    loadComponent: () =>
      import("../../features/training/training.component").then(
        (m) => m.TrainingComponent,
      ),
    canActivate: [authGuard, headerConfigGuard],
    data: { preload: false, entry: "internal" },
  },
  // Today's practice redirects to /todays-practice
  {
    path: "training/daily",
    redirectTo: "/todays-practice",
    pathMatch: "full",
    data: { entry: "deeplink" },
  },
  {
    path: "training/protocol",
    redirectTo: "/todays-practice",
    pathMatch: "full",
    data: { entry: "deeplink" },
  },
  {
    path: "training/protocol/:date",
    redirectTo: "/todays-practice",
    pathMatch: "full",
    data: { entry: "deeplink" },
  },
  // Keep advanced training routes under a consolidated workspace
  {
    path: "training/advanced",
    loadComponent: () =>
      import("../../features/training/advanced-training/advanced-training.component").then(
        (m) => m.AdvancedTrainingComponent,
      ),
    canActivate: [authGuard, headerConfigGuard],
    data: { preload: false, entry: "internal" },
  },
  // Sub-tools accessible via direct route but visually orphaned without hub
  {
    path: "workout",
    loadComponent: () =>
      import("../../features/workout/workout.component").then(
        (m) => m.WorkoutComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "medium", entry: "internal" }, // Frequently accessed
  },
  {
    path: "exercise-library",
    loadComponent: () =>
      import("../../features/exercise-library/exercise-library.component").then(
        (m) => m.ExerciseLibraryComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "low", entry: "internal" }, // Secondary feature
  },
  {
    path: "exercisedb",
    loadComponent: () =>
      import("../../features/exercisedb/exercisedb-manager.component").then(
        (m) => m.ExerciseDBManagerComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Coach-only feature, load on demand
  },
  // Redirect duplicate route to canonical /training
  {
    path: "training/schedule",
    redirectTo: "/training",
    pathMatch: "full",
    data: { entry: "internal" },
  },
  {
    path: "training/qb",
    loadComponent: () =>
      import("../../features/training/qb-hub/qb-hub.component").then(
        (m) => m.QbHubComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Position-specific
  },
  {
    path: "training/qb/schedule",
    redirectTo: "training/qb",
    pathMatch: "full",
    data: { entry: "internal" },
  },
  {
    path: "training/qb/throwing",
    redirectTo: "training/qb",
    pathMatch: "full",
    data: { entry: "internal" },
  },
  {
    path: "training/qb/assessment",
    redirectTo: "training/qb",
    pathMatch: "full",
    data: { entry: "internal" },
  },
  {
    path: "training/ai-scheduler",
    loadComponent: () =>
      import("../../features/training/ai-training-scheduler/ai-training-scheduler.component").then(
        (m) => m.AiTrainingSchedulerComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Advanced feature
  },
  {
    path: "training/log",
    loadComponent: () =>
      import("../../features/training/training-log/training-log.component").then(
        (m) => m.TrainingLogComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "medium", entry: "internal" }, // Frequently accessed
  },
  {
    path: "training/safety",
    loadComponent: () =>
      import("../../features/training/training-safety/training-safety.component").then(
        (m) => m.TrainingSafetyComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Safety feature - on demand
  },
  {
    path: "training/smart-form",
    loadComponent: () =>
      import("../../features/training/smart-training-form/smart-training-form.component").then(
        (m) => m.SmartTrainingFormComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Form feature - on demand
  },
  // Session detail route - shows session details
  {
    path: "training/session/:id",
    loadComponent: () =>
      import("../../features/training/training-session-detail/training-session-detail.component").then(
        (m) => m.TrainingSessionDetailComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "deeplink" },
  },
  {
    path: "training/videos",
    loadComponent: () =>
      import("../../features/training/video-feed/video-feed.component").then(
        (m) => m.VideoFeedComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Heavy component - load on demand
  },
  {
    path: "training/videos/curation",
    loadComponent: () =>
      import("../../features/training/video-curation/video-curation.component").then(
        (m) => m.VideoCurationComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Coach feature
  },
  {
    path: "training/videos/suggest",
    loadComponent: () =>
      import("../../features/training/video-suggestion/video-suggestion.component").then(
        (m) => m.VideoSuggestionComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Load on demand
  },
  // Advanced tool redirects - consolidate orphaned routes
  {
    path: "training/ai-companion",
    redirectTo: "training/advanced",
    pathMatch: "full",
    data: { entry: "internal" },
  },
  {
    path: "training/load-analysis",
    loadComponent: () =>
      import("../../features/training/flag-load.component").then(
        (m) => m.FlagLoadComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Advanced feature
  },
  {
    path: "training/goal-planner",
    loadComponent: () =>
      import("../../features/training/goal-based-planner.component").then(
        (m) => m.GoalBasedPlannerComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Advanced feature
  },
  {
    path: "goals",
    redirectTo: "training/goal-planner",
    pathMatch: "full",
    data: { entry: "internal" },
  },
  {
    path: "training/microcycle",
    loadComponent: () =>
      import("../../features/training/microcycle-planner.component").then(
        (m) => m.MicrocyclePlannerComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Advanced feature
  },
  {
    path: "training/import",
    loadComponent: () =>
      import("../../features/training/import-dataset.component").then(
        (m) => m.ImportDatasetComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Utility feature
  },
  {
    path: "training/periodization",
    loadComponent: () =>
      import("../../features/training/components/periodization-dashboard/periodization-dashboard.component").then(
        (m) => m.PeriodizationDashboardComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Advanced feature - load on demand
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
    data: { preload: true, priority: "high", entry: "hub" },
  },
  {
    path: "analytics/enhanced",
    loadComponent: () =>
      import("../../features/analytics/enhanced-analytics/enhanced-analytics.component").then(
        (m) => m.EnhancedAnalyticsComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Advanced analytics
  },
  {
    path: "performance-tracking",
    loadComponent: () =>
      import("../../features/performance-tracking/performance-tracking.component").then(
        (m) => m.PerformanceTrackingComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "medium", entry: "internal" }, // Commonly accessed
  },
  // Redirect /performance/body-composition to performance-tracking with body composition tab
  {
    path: "performance/body-composition",
    redirectTo: "performance-tracking",
    pathMatch: "full",
    data: { entry: "internal" },
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
    data: { preload: true, priority: "high", entry: "internal" },
  },
  {
    path: "team/workspace",
    loadComponent: () =>
      import("../../features/team/team-workspace/team-workspace.component").then(
        (m) => m.TeamWorkspaceComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "medium", entry: "internal" }, // Team hub
  },
  {
    path: "coach",
    loadComponent: () =>
      import("../../features/coach/coach.component").then(
        (m) => m.CoachComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "high", entry: "hub" },
  },
  {
    path: "coach/dashboard",
    loadComponent: () =>
      import("../../features/dashboard/coach-dashboard.component").then(
        (m) => m.CoachDashboardComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "high", entry: "internal" }, // Coach main dashboard
  },
  // === NEW ROUTE: Coach Activity Feed ===
  {
    path: "coach/activity",
    loadComponent: () =>
      import("../../features/coach/coach-activity-feed.component").then(
        (m) => m.CoachActivityFeedComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Load on demand
  },
  {
    path: "coach/analytics",
    loadComponent: () =>
      import("../../features/coach/coach-analytics/coach-analytics.component").then(
        (m) => m.CoachAnalyticsComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "medium", entry: "internal" }, // Coach analytics
  },
  {
    path: "coach/inbox",
    loadComponent: () =>
      import("../../features/coach/coach-inbox/coach-inbox.component").then(
        (m) => m.CoachInboxComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "medium", entry: "internal" }, // Coach messaging
  },
  {
    path: "coach/team",
    loadComponent: () =>
      import("../../features/coach/team-management/team-management.component").then(
        (m) => m.TeamManagementComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "medium", entry: "internal" }, // Team management
  },
  {
    path: "coach/programs",
    loadComponent: () =>
      import("../../features/coach/program-builder/program-builder.component").then(
        (m) => m.ProgramBuilderComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Advanced feature
  },
  {
    path: "coach/practice",
    loadComponent: () =>
      import("../../features/coach/practice-planner/practice-planner.component").then(
        (m) => m.PracticePlannerComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "low", entry: "internal" }, // Planning feature
  },
  {
    path: "coach/injuries",
    loadComponent: () =>
      import("../../features/coach/injury-management/injury-management.component").then(
        (m) => m.InjuryManagementComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // On-demand
  },
  {
    path: "coach/playbook",
    loadComponent: () =>
      import("../../features/coach/playbook-manager/playbook-manager.component").then(
        (m) => m.PlaybookManagerComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // On-demand
  },
  {
    path: "coach/development",
    loadComponent: () =>
      import("../../features/coach/player-development/player-development.component").then(
        (m) => m.PlayerDevelopmentComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // On-demand
  },
  {
    path: "coach/tournaments",
    loadComponent: () =>
      import("../../features/coach/tournament-management/tournament-management.component").then(
        (m) => m.TournamentManagementComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Seasonal feature
  },
  {
    path: "coach/payments",
    loadComponent: () =>
      import("../../features/coach/payment-management/payment-management.component").then(
        (m) => m.PaymentManagementComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Admin feature
  },
  {
    path: "coach/ai-scheduler",
    loadComponent: () =>
      import("../../features/coach/ai-scheduler/ai-scheduler.component").then(
        (m) => m.AiSchedulerComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Advanced feature
  },
  {
    path: "coach/knowledge",
    loadComponent: () =>
      import("../../features/coach/knowledge-base/knowledge-base.component").then(
        (m) => m.KnowledgeBaseComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Reference feature
  },
  {
    path: "coach/film",
    loadComponent: () =>
      import("../../features/coach/film-room/film-room-coach.component").then(
        (m) => m.FilmRoomCoachComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Heavy component
  },
  {
    path: "coach/calendar",
    loadComponent: () =>
      import("../../features/coach/calendar/calendar-coach.component").then(
        (m) => m.CalendarCoachComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "low", entry: "internal" }, // Planning feature
  },
  {
    path: "coach/scouting",
    loadComponent: () =>
      import("../../features/coach/scouting/scouting-reports.component").then(
        (m) => m.ScoutingReportsComponent,
      ),
    canActivate: [authGuard],
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
      import("../../features/team/team-create/team-create.component").then(
        (m) => m.TeamCreateComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // One-time use
  },
  {
    path: "attendance",
    loadComponent: () =>
      import("../../features/attendance/attendance.component").then(
        (m) => m.AttendanceComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "low", entry: "internal" }, // Team feature
  },
  {
    path: "depth-chart",
    loadComponent: () =>
      import("../../features/depth-chart/depth-chart.component").then(
        (m) => m.DepthChartComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Coach feature
  },
  {
    path: "equipment",
    loadComponent: () =>
      import("../../features/equipment/equipment.component").then(
        (m) => m.EquipmentComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Admin feature
  },
  {
    path: "officials",
    loadComponent: () =>
      import("../../features/officials/officials.component").then(
        (m) => m.OfficialsComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Game day feature
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
    data: { preload: false, entry: "internal" }, // Only needed on game days - load on demand
  },
  {
    path: "game/nutrition",
    loadComponent: () =>
      import("../../features/game/tournament-nutrition/tournament-nutrition.component").then(
        (m) => m.TournamentNutritionComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Only needed on tournament days - load on demand
  },
  {
    path: "travel/recovery",
    loadComponent: () =>
      import("../../features/travel/travel-recovery/travel-recovery.component").then(
        (m) => m.TravelRecoveryComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Only needed when traveling - load on demand
  },
  {
    path: "game-tracker",
    loadComponent: () =>
      import("../../features/game-tracker/game-tracker.component").then(
        (m) => m.GameTrackerComponent,
      ),
    canActivate: [authGuard],
    resolve: { prefetch: gameTrackerPrefetchResolver },
    data: { preload: false, entry: "internal" }, // Heavy component, don't preload
  },
  {
    path: "tournaments",
    loadComponent: () =>
      import("../../features/tournaments/tournaments.component").then(
        (m) => m.TournamentsComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Seasonal feature
  },
  // === NEW ROUTE: Live Game Tracker ===
  {
    path: "game-tracker/live",
    loadComponent: () =>
      import("../../features/game-tracker/live-game-tracker.component").then(
        (m) => m.LiveGameTrackerComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Heavy real-time component
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
    data: { preload: true, priority: "high", entry: "internal" }, // Daily feature
  },
  {
    path: "acwr",
    loadComponent: () =>
      import("../../features/acwr-dashboard/acwr-dashboard.component").then(
        (m) => m.AcwrDashboardComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "medium", entry: "internal" }, // Load monitoring
  },
  {
    path: "return-to-play",
    loadComponent: () =>
      import("../../features/return-to-play/return-to-play.component").then(
        (m) => m.ReturnToPlayComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Load on demand - not frequently accessed
  },
  {
    path: "cycle-tracking",
    loadComponent: () =>
      import("../../features/cycle-tracking/cycle-tracking.component").then(
        (m) => m.CycleTrackingComponent,
      ),
    canActivate: [authGuard, femaleAthleteGuard],
    data: { preload: false, entry: "internal" }, // Load on demand - female athletes only
  },
  {
    path: "sleep-debt",
    loadComponent: () =>
      import("../../features/sleep-debt/sleep-debt.component").then(
        (m) => m.SleepDebtComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Load on demand
  },
  {
    path: "achievements",
    loadComponent: () =>
      import("../../features/achievements/achievements.component").then(
        (m) => m.AchievementsComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Load on demand
  },
  {
    path: "playbook",
    loadComponent: () =>
      import("../../features/playbook/playbook.component").then(
        (m) => m.PlaybookComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Load on demand
  },
  {
    path: "film",
    loadComponent: () =>
      import("../../features/film-room/film-room.component").then(
        (m) => m.FilmRoomComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Load on demand
  },
  {
    path: "calendar",
    loadComponent: () =>
      import("../../features/team-calendar/team-calendar.component").then(
        (m) => m.TeamCalendarComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Load on demand
  },
  {
    path: "payments",
    loadComponent: () =>
      import("../../features/payments/payments.component").then(
        (m) => m.PaymentsComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Load on demand
  },
  {
    path: "import",
    loadComponent: () =>
      import("../../features/data-import/data-import.component").then(
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
    data: { preload: true, priority: "low", entry: "internal" }, // Social feature
  },
  // Merlin AI - Main chat interface
  {
    path: "chat",
    loadComponent: () =>
      import("../../features/ai-coach/ai-coach-chat.component").then(
        (m) => m.AiCoachChatComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "high", entry: "internal" }, // Merlin AI is frequently used
  },
  // Redirect old ai-coach path to new /chat
  {
    path: "ai-coach",
    redirectTo: "chat",
    pathMatch: "full",
    data: { entry: "internal" },
  },
  // Team Channels - moved to /team-chat
  {
    path: "team-chat",
    loadComponent: () =>
      import("../../features/chat/chat.component").then((m) => m.ChatComponent),
    canActivate: [authGuard],
    data: { preload: true, priority: "medium", entry: "internal" }, // Team communication
  },
];

/**
 * Staff Dashboard Routes (Nutritionist, Physiotherapist, Psychology)
 */
export const staffRoutes: Routes = [
  {
    path: "staff",
    loadComponent: () =>
      import("../../features/staff/staff-hub.component").then(
        (m) => m.StaffHubComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "hub" },
  },
  {
    path: "staff/nutritionist",
    loadComponent: () =>
      import("../../features/staff/nutritionist/nutritionist-dashboard.component").then(
        (m) => m.NutritionistDashboardComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" },
  },
  {
    path: "staff/physiotherapist",
    loadComponent: () =>
      import("../../features/staff/physiotherapist/physiotherapist-dashboard.component").then(
        (m) => m.PhysiotherapistDashboardComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" },
  },
  {
    path: "staff/psychology",
    loadComponent: () =>
      import("../../features/staff/psychology/psychology-reports.component").then(
        (m) => m.PsychologyReportsComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" },
  },
  {
    path: "staff/decisions",
    loadComponent: () =>
      import("../../features/staff/decisions/decision-ledger-dashboard.component").then(
        (m) => m.DecisionLedgerDashboardComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" },
  },
  {
    path: "staff/decisions/:id",
    loadComponent: () =>
      import("../../features/staff/decisions/decision-detail.component").then(
        (m) => m.DecisionDetailComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "deeplink" },
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
    data: { preload: true, priority: "low", entry: "internal" }, // User profile
  },
  {
    path: "settings",
    loadComponent: () =>
      import("../../features/settings/settings.component").then(
        (m) => m.SettingsComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Settings - on demand
  },
  {
    path: "settings/profile",
    loadComponent: () =>
      import("../../features/settings/settings.component").then(
        (m) => m.SettingsComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Settings - on demand
  },
  {
    path: "settings/privacy",
    loadComponent: () =>
      import("../../features/settings/privacy-controls/privacy-controls.component").then(
        (m) => m.PrivacyControlsComponent,
      ),
    canActivate: [authGuard],
    title: "Privacy Controls - FlagFit Pro",
    data: { entry: "internal" },
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
    data: { preload: false, entry: "hub" }, // Don't preload admin routes
  },
  {
    path: "superadmin/settings",
    loadComponent: () =>
      import("../../features/superadmin/superadmin-settings.component").then(
        (m) => m.SuperadminSettingsComponent,
      ),
    canActivate: [superadminGuard],
    data: { preload: false, entry: "internal" }, // Admin only
  },
  {
    path: "superadmin/teams",
    loadComponent: () =>
      import("../../features/superadmin/superadmin-teams.component").then(
        (m) => m.SuperadminTeamsComponent,
      ),
    canActivate: [superadminGuard],
    data: { preload: false, entry: "internal" }, // Admin only
  },
  {
    path: "superadmin/users",
    loadComponent: () =>
      import("../../features/superadmin/superadmin-users.component").then(
        (m) => m.SuperadminUsersComponent,
      ),
    canActivate: [superadminGuard],
    data: { preload: false, entry: "internal" }, // Admin only
  },
];

/**
 * Help Routes - Help Center with topic-specific anchors
 */
export const helpRoutes: Routes = [
  {
    path: "help",
    loadComponent: () =>
      import("../../features/help/help-center.component").then(
        (m) => m.HelpCenterComponent,
      ),
    data: { preload: false, entry: "internal" }, // On-demand
  },
  // Topic-specific routes all go to help center (component handles routing)
  {
    path: "help/:topic",
    loadComponent: () =>
      import("../../features/help/help-center.component").then(
        (m) => m.HelpCenterComponent,
      ),
    data: { preload: false, entry: "deeplink" },
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
  ...staffRoutes, // Staff dashboards (nutritionist, physio, psychology)
  ...profileRoutes,
  ...helpRoutes, // Help redirects before wildcard
  {
    path: "**",
    loadComponent: () =>
      import("../../features/not-found/not-found.component").then(
        (m) => m.NotFoundComponent,
      ),
  },
];
