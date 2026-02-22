import { Routes } from "@angular/router";
import { authGuard } from "../../guards/auth.guard";
import { headerConfigGuard } from "../../guards/header-config.guard";

export const trainingRoutes: Routes = [
  // Main training page - monthly calendar view for managing/logging sessions
  {
    path: "training",
    loadComponent: () =>
      import("../../../features/training/training-schedule/training-schedule.component").then(
        (m) => m.TrainingScheduleComponent,
      ),
    canActivate: [authGuard, headerConfigGuard],
    data: { preload: true, priority: "high", entry: "hub" },
  },
  {
    path: "training/builder",
    loadComponent: () =>
      import("../../../features/training/training.component").then(
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
      import("../../../features/training/advanced-training/advanced-training.component").then(
        (m) => m.AdvancedTrainingComponent,
      ),
    canActivate: [authGuard, headerConfigGuard],
    data: { preload: false, entry: "internal" },
  },
  // Sub-tools accessible via direct route but visually orphaned without hub
  {
    path: "workout",
    loadComponent: () =>
      import("../../../features/workout/workout.component").then(
        (m) => m.WorkoutComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "medium", entry: "internal" }, // Frequently accessed
  },
  {
    path: "exercise-library",
    loadComponent: () =>
      import("../../../features/exercise-library/exercise-library.component").then(
        (m) => m.ExerciseLibraryComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "low", entry: "internal" }, // Secondary feature
  },
  {
    path: "exercisedb",
    loadComponent: () =>
      import("../../../features/exercisedb/exercisedb-manager.component").then(
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
      import("../../../features/training/qb-hub/qb-hub.component").then(
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
      import("../../../features/training/ai-training-scheduler/ai-training-scheduler.component").then(
        (m) => m.AiTrainingSchedulerComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Advanced feature
  },
  {
    path: "training/log",
    loadComponent: () =>
      import("../../../features/training/training-log/training-log.component").then(
        (m) => m.TrainingLogComponent,
      ),
    canActivate: [authGuard],
    data: { preload: true, priority: "medium", entry: "internal" }, // Frequently accessed
  },
  {
    path: "training/safety",
    loadComponent: () =>
      import("../../../features/training/training-safety/training-safety.component").then(
        (m) => m.TrainingSafetyComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Safety feature - on demand
  },
  {
    path: "training/smart-form",
    loadComponent: () =>
      import("../../../features/training/smart-training-form/smart-training-form.component").then(
        (m) => m.SmartTrainingFormComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Form feature - on demand
  },
  // Session detail route - shows session details
  {
    path: "training/session/:id",
    loadComponent: () =>
      import("../../../features/training/training-session-detail/training-session-detail.component").then(
        (m) => m.TrainingSessionDetailComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "deeplink" },
  },
  {
    path: "training/videos",
    loadComponent: () =>
      import("../../../features/training/video-feed/video-feed.component").then(
        (m) => m.VideoFeedComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Heavy component - load on demand
  },
  {
    path: "training/videos/curation",
    loadComponent: () =>
      import("../../../features/training/video-curation/video-curation.component").then(
        (m) => m.VideoCurationComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Coach feature
  },
  {
    path: "training/videos/suggest",
    loadComponent: () =>
      import("../../../features/training/video-suggestion/video-suggestion.component").then(
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
      import("../../../features/training/flag-load.component").then(
        (m) => m.FlagLoadComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Advanced feature
  },
  {
    path: "training/goal-planner",
    loadComponent: () =>
      import("../../../features/training/goal-based-planner.component").then(
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
      import("../../../features/training/microcycle-planner.component").then(
        (m) => m.MicrocyclePlannerComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Advanced feature
  },
  {
    path: "training/import",
    loadComponent: () =>
      import("../../../features/training/import-dataset.component").then(
        (m) => m.ImportDatasetComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Utility feature
  },
  {
    path: "training/periodization",
    loadComponent: () =>
      import("../../../features/training/components/periodization-dashboard/periodization-dashboard.component").then(
        (m) => m.PeriodizationDashboardComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Advanced feature - load on demand
  },
];
