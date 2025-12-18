/**
 * Feature Route Groups
 * 
 * Groups routes by feature area for better code splitting and organization
 * Each group can be lazy loaded as a unit, reducing bundle size
 */

import { Routes } from "@angular/router";
import { authGuard } from "../guards/auth.guard";
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
    data: { preload: true, priority: 'high' },
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
    data: { preload: true, priority: 'high' },
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
    data: { preload: true, priority: 'high' },
  },
  {
    path: "performance-tracking",
    loadComponent: () =>
      import(
        "../../features/performance-tracking/performance-tracking.component"
      ).then((m) => m.PerformanceTrackingComponent),
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
    data: { preload: true, priority: 'high' },
  },
  {
    path: "coach",
    loadComponent: () =>
      import("../../features/coach/coach.component").then((m) => m.CoachComponent),
    canActivate: [authGuard],
  },
];

/**
 * Game & Competition Routes
 */
export const gameRoutes: Routes = [
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
];

/**
 * Combined Feature Routes
 * Organized by priority and feature area
 */
export const featureRoutes: Routes = [
  ...publicRoutes,
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
    redirectTo: "",
  },
];

