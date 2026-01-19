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
    data: { preload: true, priority: "high" }, // Landing page loads immediately
  },
  {
    path: "login",
    loadComponent: () =>
      import("../../features/auth/login/login.component").then(
        (m) => m.LoginComponent,
      ),
    data: { preload: true, priority: "medium" }, // Auth pages preload after delay
  },
  {
    path: "register",
    loadComponent: () =>
      import("../../features/auth/register/register.component").then(
        (m) => m.RegisterComponent,
      ),
    data: { preload: true, priority: "medium" },
  },
  {
    path: "reset-password",
    loadComponent: () =>
      import("../../features/auth/reset-password/reset-password.component").then(
        (m) => m.ResetPasswordComponent,
      ),
    data: { preload: false }, // On-demand - rarely accessed
  },
  {
    path: "update-password",
    loadComponent: () =>
      import("../../features/auth/update-password/update-password.component").then(
        (m) => m.UpdatePasswordComponent,
      ),
    data: { preload: false }, // On-demand - rarely accessed
  },
  {
    path: "verify-email",
    loadComponent: () =>
      import("../../features/auth/verify-email/verify-email.component").then(
        (m) => m.VerifyEmailComponent,
      ),
    data: { preload: false }, // On-demand - one-time use
  },
  {
    path: "auth/callback",
    loadComponent: () =>
      import("../../features/auth/auth-callback/auth-callback.component").then(
        (m) => m.AuthCallbackComponent,
      ),
    data: { preload: false }, // On-demand - OAuth callback
  },
  {
    path: "onboarding",
    loadComponent: () =>
      import("../../features/onboarding/onboarding.component").then(
        (m) => m.OnboardingComponent,
      ),
    data: { preload: false }, // On-demand - one-time use
  },
  {
    path: "accept-invitation",
    loadComponent: () =>
      import("../../features/team/accept-invitation/accept-invitation.component").then(
        (m) => m.AcceptInvitationComponent,
      ),
    data: { preload: false }, // On-demand - rarely accessed
  },
  {
    path: "terms",
    loadComponent: () =>
      import("../../features/legal/legal-doc.component").then(
        (m) => m.LegalDocComponent,
      ),
    data: { preload: false, legalDoc: "terms" },
    title: "Terms of Use - FlagFit Pro",
  },
  {
    path: "privacy",
    loadComponent: () =>
      import("../../features/legal/legal-doc.component").then(
        (m) => m.LegalDocComponent,
      ),
    data: { preload: false, legalDoc: "privacy" },
    title: "Privacy Policy - FlagFit Pro",
  },
  {
    path: "privacy-policy",
    loadComponent: () =>
      import("../../features/legal/legal-doc.component").then(
        (m) => m.LegalDocComponent,
      ),
    data: { preload: false, legalDoc: "privacy-policy" },
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
    data: { preload: true, priority: "high" },
  },
  {
    path: "dashboard",
    loadComponent: () =>
      import("../../features/dashboard/dashboard.component").then(
        (m) => m.DashboardComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "high" }, // Core dashboard
  },
  {
    path: "player-dashboard",
    loadComponent: () =>
      import("../../features/dashboard/player-dashboard.component").then(
        (m) => m.PlayerDashboardComponent,
      ),
    canActivate: [authGuard, headerConfigGuard],
    data: { preload: true, priority: "high" },
  },
  {
    path: "athlete-dashboard",
    redirectTo: "player-dashboard",
    pathMatch: "full",
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
    data: { preload: true, priority: "high" },
  },
  // Today's practice redirects to /todays-practice
  {
    path: "training/daily",
    redirectTo: "/todays-practice",
    pathMatch: "full",
  },
  {
    path: "training/protocol",
    redirectTo: "/todays-practice",
    pathMatch: "full",
  },
  {
    path: "training/protocol/:date",
    redirectTo: "/todays-practice",
    pathMatch: "full",
  },
  // Keep advanced training routes under a consolidated workspace
  {
    path: "training/advanced",
    loadComponent: () =>
      import("../../features/training/advanced-training/advanced-training.component").then(
        (m) => m.AdvancedTrainingComponent,
      ),
    canActivate: [authGuard, headerConfigGuard],
    data: { preload: false },
  },
  // Sub-tools accessible via direct route but visually orphaned without hub
  {
    path: "workout",
    loadComponent: () =>
      import("../../features/workout/workout.component").then(
        (m) => m.WorkoutComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "medium" }, // Frequently accessed
  },
  {
    path: "exercise-library",
    loadComponent: () =>
      import("../../features/exercise-library/exercise-library.component").then(
        (m) => m.ExerciseLibraryComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "low" }, // Secondary feature
  },
  {
    path: "exercisedb",
    loadComponent: () =>
      import("../../features/exercisedb/exercisedb-manager.component").then(
        (m) => m.ExerciseDBManagerComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false }, // Coach-only feature, load on demand
  },
  // Redirect duplicate route to canonical /training
  {
    path: "training/schedule",
    redirectTo: "/training",
    pathMatch: "full",
  },
  {
    path: "training/qb",
    loadComponent: () =>
      import("../../features/training/qb-hub/qb-hub.component").then(
        (m) => m.QbHubComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false }, // Position-specific
  },
  {
    path: "training/qb/schedule",
    redirectTo: "training/qb",
    pathMatch: "full",
  },
  {
    path: "training/qb/throwing",
    redirectTo: "training/qb",
    pathMatch: "full",
  },
  {
    path: "training/qb/assessment",
    redirectTo: "training/qb",
    pathMatch: "full",
  },
  {
    path: "training/ai-scheduler",
    loadComponent: () =>
      import("../../features/training/ai-training-scheduler/ai-training-scheduler.component").then(
        (m) => m.AiTrainingSchedulerComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false }, // Advanced feature
  },
  {
    path: "training/log",
    loadComponent: () =>
      import("../../features/training/training-log/training-log.component").then(
        (m) => m.TrainingLogComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "medium" }, // Frequently accessed
  },
  {
    path: "training/safety",
    loadComponent: () =>
      import("../../features/training/training-safety/training-safety.component").then(
        (m) => m.TrainingSafetyComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false }, // Safety feature - on demand
  },
  {
    path: "training/smart-form",
    loadComponent: () =>
      import("../../features/training/smart-training-form/smart-training-form.component").then(
        (m) => m.SmartTrainingFormComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false }, // Form feature - on demand
  },
  // Session detail route - redirects to training log with session context
  // TODO: Create dedicated TrainingSessionDetailComponent for better UX
  {
    path: "training/session/:id",
    redirectTo: "training/log",
    pathMatch: "full",
  },
  {
    path: "training/videos",
    loadComponent: () =>
      import("../../features/training/video-feed/video-feed.component").then(
        (m) => m.VideoFeedComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false }, // Heavy component - load on demand
  },
  {
    path: "training/videos/curation",
    loadComponent: () =>
      import("../../features/training/video-curation/video-curation.component").then(
        (m) => m.VideoCurationComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false }, // Coach feature
  },
  {
    path: "training/videos/suggest",
    loadComponent: () =>
      import("../../features/training/video-suggestion/video-suggestion.component").then(
        (m) => m.VideoSuggestionComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false }, // Load on demand
  },
  // Advanced tool redirects - consolidate orphaned routes
  {
    path: "training/ai-companion",
    redirectTo: "training/advanced",
    pathMatch: "full",
  },
  {
    path: "training/load-analysis",
    loadComponent: () =>
      import("../../features/training/flag-load.component").then(
        (m) => m.FlagLoadComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false }, // Advanced feature
  },
  {
    path: "training/goal-planner",
    loadComponent: () =>
      import("../../features/training/goal-based-planner.component").then(
        (m) => m.GoalBasedPlannerComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false }, // Advanced feature
  },
  {
    path: "goals",
    redirectTo: "training/goal-planner",
    pathMatch: "full",
  },
  {
    path: "training/microcycle",
    loadComponent: () =>
      import("../../features/training/microcycle-planner.component").then(
        (m) => m.MicrocyclePlannerComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false }, // Advanced feature
  },
  {
    path: "training/import",
    loadComponent: () =>
      import("../../features/training/import-dataset.component").then(
        (m) => m.ImportDatasetComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false }, // Utility feature
  },
  {
    path: "training/periodization",
    loadComponent: () =>
      import("../../features/training/components/periodization-dashboard/periodization-dashboard.component").then(
        (m) => m.PeriodizationDashboardComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false }, // Advanced feature - load on demand
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
    data: { preload: false }, // Advanced analytics
  },
  {
    path: "performance-tracking",
    loadComponent: () =>
      import("../../features/performance-tracking/performance-tracking.component").then(
        (m) => m.PerformanceTrackingComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "medium" }, // Commonly accessed
  },
  // Redirect /performance/body-composition to performance-tracking with body composition tab
  {
    path: "performance/body-composition",
    redirectTo: "performance-tracking",
    pathMatch: "full",
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
    path: "team/workspace",
    loadComponent: () =>
      import("../../features/team/team-workspace/team-workspace.component").then(
        (m) => m.TeamWorkspaceComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "medium" }, // Team hub
  },
  {
    path: "coach",
    redirectTo: "team/workspace",
    pathMatch: "full",
  },
  {
    path: "coach/dashboard",
    loadComponent: () =>
      import("../../features/dashboard/coach-dashboard.component").then(
        (m) => m.CoachDashboardComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "high" }, // Coach main dashboard
  },
  // === NEW ROUTE: Coach Activity Feed ===
  {
    path: "coach/activity",
    loadComponent: () =>
      import("../../features/coach/coach-activity-feed.component").then(
        (m) => m.CoachActivityFeedComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false }, // Load on demand
  },
  {
    path: "coach/analytics",
    loadComponent: () =>
      import("../../features/coach/coach-analytics/coach-analytics.component").then(
        (m) => m.CoachAnalyticsComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "medium" }, // Coach analytics
  },
  {
    path: "coach/inbox",
    loadComponent: () =>
      import("../../features/coach/coach-inbox/coach-inbox.component").then(
        (m) => m.CoachInboxComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "medium" }, // Coach messaging
  },
  {
    path: "coach/team",
    loadComponent: () =>
      import("../../features/coach/team-management/team-management.component").then(
        (m) => m.TeamManagementComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "medium" }, // Team management
  },
  {
    path: "coach/programs",
    loadComponent: () =>
      import("../../features/coach/program-builder/program-builder.component").then(
        (m) => m.ProgramBuilderComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false }, // Advanced feature
  },
  {
    path: "coach/practice",
    loadComponent: () =>
      import("../../features/coach/practice-planner/practice-planner.component").then(
        (m) => m.PracticePlannerComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "low" }, // Planning feature
  },
  {
    path: "coach/injuries",
    loadComponent: () =>
      import("../../features/coach/injury-management/injury-management.component").then(
        (m) => m.InjuryManagementComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false }, // On-demand
  },
  {
    path: "coach/playbook",
    loadComponent: () =>
      import("../../features/coach/playbook-manager/playbook-manager.component").then(
        (m) => m.PlaybookManagerComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false }, // On-demand
  },
  {
    path: "coach/development",
    loadComponent: () =>
      import("../../features/coach/player-development/player-development.component").then(
        (m) => m.PlayerDevelopmentComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false }, // On-demand
  },
  {
    path: "coach/tournaments",
    loadComponent: () =>
      import("../../features/coach/tournament-management/tournament-management.component").then(
        (m) => m.TournamentManagementComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false }, // Seasonal feature
  },
  {
    path: "coach/payments",
    loadComponent: () =>
      import("../../features/coach/payment-management/payment-management.component").then(
        (m) => m.PaymentManagementComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false }, // Admin feature
  },
  {
    path: "coach/ai-scheduler",
    loadComponent: () =>
      import("../../features/coach/ai-scheduler/ai-scheduler.component").then(
        (m) => m.AiSchedulerComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false }, // Advanced feature
  },
  {
    path: "coach/knowledge",
    loadComponent: () =>
      import("../../features/coach/knowledge-base/knowledge-base.component").then(
        (m) => m.KnowledgeBaseComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false }, // Reference feature
  },
  {
    path: "coach/film",
    loadComponent: () =>
      import("../../features/coach/film-room/film-room-coach.component").then(
        (m) => m.FilmRoomCoachComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false }, // Heavy component
  },
  {
    path: "coach/calendar",
    loadComponent: () =>
      import("../../features/coach/calendar/calendar-coach.component").then(
        (m) => m.CalendarCoachComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "low" }, // Planning feature
  },
  {
    path: "coach/scouting",
    loadComponent: () =>
      import("../../features/coach/scouting/scouting-reports.component").then(
        (m) => m.ScoutingReportsComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false }, // On-demand
  },
  {
    path: "admin",
    redirectTo: "superadmin",
    pathMatch: "full",
  },
  {
    path: "team/create",
    loadComponent: () =>
      import("../../features/team/team-create/team-create.component").then(
        (m) => m.TeamCreateComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false }, // One-time use
  },
  {
    path: "attendance",
    loadComponent: () =>
      import("../../features/attendance/attendance.component").then(
        (m) => m.AttendanceComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "low" }, // Team feature
  },
  {
    path: "depth-chart",
    loadComponent: () =>
      import("../../features/depth-chart/depth-chart.component").then(
        (m) => m.DepthChartComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false }, // Coach feature
  },
  {
    path: "equipment",
    loadComponent: () =>
      import("../../features/equipment/equipment.component").then(
        (m) => m.EquipmentComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false }, // Admin feature
  },
  {
    path: "officials",
    loadComponent: () =>
      import("../../features/officials/officials.component").then(
        (m) => m.OfficialsComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false }, // Game day feature
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
    data: { preload: false }, // Only needed on game days - load on demand
  },
  {
    path: "game/nutrition",
    loadComponent: () =>
      import("../../features/game/tournament-nutrition/tournament-nutrition.component").then(
        (m) => m.TournamentNutritionComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false }, // Only needed on tournament days - load on demand
  },
  {
    path: "travel/recovery",
    loadComponent: () =>
      import("../../features/travel/travel-recovery/travel-recovery.component").then(
        (m) => m.TravelRecoveryComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false }, // Only needed when traveling - load on demand
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
    data: { preload: false }, // Seasonal feature
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
    data: { preload: true, priority: "high" }, // Daily feature
  },
  {
    path: "acwr",
    loadComponent: () =>
      import("../../features/acwr-dashboard/acwr-dashboard.component").then(
        (m) => m.AcwrDashboardComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "medium" }, // Load monitoring
  },
  {
    path: "return-to-play",
    loadComponent: () =>
      import("../../features/return-to-play/return-to-play.component").then(
        (m) => m.ReturnToPlayComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false }, // Load on demand - not frequently accessed
  },
  {
    path: "cycle-tracking",
    loadComponent: () =>
      import("../../features/cycle-tracking/cycle-tracking.component").then(
        (m) => m.CycleTrackingComponent,
      ),
    canActivate: [authGuard, femaleAthleteGuard],
    data: { preload: false }, // Load on demand - female athletes only
  },
  {
    path: "sleep-debt",
    loadComponent: () =>
      import("../../features/sleep-debt/sleep-debt.component").then(
        (m) => m.SleepDebtComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false }, // Load on demand
  },
  {
    path: "achievements",
    loadComponent: () =>
      import("../../features/achievements/achievements.component").then(
        (m) => m.AchievementsComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false }, // Load on demand
  },
  {
    path: "playbook",
    loadComponent: () =>
      import("../../features/playbook/playbook.component").then(
        (m) => m.PlaybookComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false }, // Load on demand
  },
  {
    path: "film",
    loadComponent: () =>
      import("../../features/film-room/film-room.component").then(
        (m) => m.FilmRoomComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false }, // Load on demand
  },
  {
    path: "calendar",
    loadComponent: () =>
      import("../../features/team-calendar/team-calendar.component").then(
        (m) => m.TeamCalendarComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false }, // Load on demand
  },
  {
    path: "payments",
    loadComponent: () =>
      import("../../features/payments/payments.component").then(
        (m) => m.PaymentsComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false }, // Load on demand
  },
  {
    path: "import",
    loadComponent: () =>
      import("../../features/data-import/data-import.component").then(
        (m) => m.DataImportComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false }, // Load on demand
  },
  {
    path: "load-monitoring",
    redirectTo: "acwr",
    pathMatch: "full",
  },
  {
    path: "injury-prevention",
    redirectTo: "acwr",
    pathMatch: "full",
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
    data: { preload: true, priority: "low" }, // Social feature
  },
  // AI Coach Merlin - Main chat interface
  {
    path: "chat",
    loadComponent: () =>
      import("../../features/ai-coach/ai-coach-chat.component").then(
        (m) => m.AiCoachChatComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "high" }, // AI Coach is frequently used
  },
  // Redirect old ai-coach path to new /chat
  {
    path: "ai-coach",
    redirectTo: "chat",
    pathMatch: "full",
  },
  // Team Channels - moved to /team-chat
  {
    path: "team-chat",
    loadComponent: () =>
      import("../../features/chat/chat.component").then((m) => m.ChatComponent),
    canActivate: [authGuard],
    data: { preload: true, priority: "medium" }, // Team communication
  },
];

/**
 * Staff Dashboard Routes (Nutritionist, Physiotherapist, Psychology)
 */
export const staffRoutes: Routes = [
  {
    path: "staff/nutritionist",
    loadComponent: () =>
      import("../../features/staff/nutritionist/nutritionist-dashboard.component").then(
        (m) => m.NutritionistDashboardComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false },
  },
  {
    path: "staff/physiotherapist",
    loadComponent: () =>
      import("../../features/staff/physiotherapist/physiotherapist-dashboard.component").then(
        (m) => m.PhysiotherapistDashboardComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false },
  },
  {
    path: "staff/psychology",
    loadComponent: () =>
      import("../../features/staff/psychology/psychology-reports.component").then(
        (m) => m.PsychologyReportsComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false },
  },
  {
    path: "staff/decisions",
    loadComponent: () =>
      import("../../features/staff/decisions/decision-ledger-dashboard.component").then(
        (m) => m.DecisionLedgerDashboardComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false },
  },
  {
    path: "staff/decisions/:id",
    loadComponent: () =>
      import("../../features/staff/decisions/decision-detail.component").then(
        (m) => m.DecisionDetailComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false },
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
    data: { preload: true, priority: "low" }, // User profile
  },
  {
    path: "settings",
    loadComponent: () =>
      import("../../features/settings/settings.component").then(
        (m) => m.SettingsComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false }, // Settings - on demand
  },
  {
    path: "settings/profile",
    loadComponent: () =>
      import("../../features/settings/settings.component").then(
        (m) => m.SettingsComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false }, // Settings - on demand
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
    data: { preload: false }, // Admin only
  },
  {
    path: "superadmin/teams",
    loadComponent: () =>
      import("../../features/superadmin/superadmin-teams.component").then(
        (m) => m.SuperadminTeamsComponent,
      ),
    canActivate: [superadminGuard],
    data: { preload: false }, // Admin only
  },
  {
    path: "superadmin/users",
    loadComponent: () =>
      import("../../features/superadmin/superadmin-users.component").then(
        (m) => m.SuperadminUsersComponent,
      ),
    canActivate: [superadminGuard],
    data: { preload: false }, // Admin only
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
    data: { preload: false }, // On-demand
  },
  // Topic-specific routes all go to help center (component handles routing)
  {
    path: "help/:topic",
    loadComponent: () =>
      import("../../features/help/help-center.component").then(
        (m) => m.HelpCenterComponent,
      ),
    data: { preload: false },
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
