import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'training',
    loadComponent: () => import('./features/training/training.component').then(m => m.TrainingComponent),
    canActivate: [authGuard]
  },
  {
    path: 'analytics',
    loadComponent: () => import('./features/analytics/analytics.component').then(m => m.AnalyticsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'roster',
    loadComponent: () => import('./features/roster/roster.component').then(m => m.RosterComponent),
    canActivate: [authGuard]
  },
  {
    path: 'tournaments',
    loadComponent: () => import('./features/tournaments/tournaments.component').then(m => m.TournamentsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'community',
    loadComponent: () => import('./features/community/community.component').then(m => m.CommunityComponent),
    canActivate: [authGuard]
  },
  {
    path: 'chat',
    loadComponent: () => import('./features/chat/chat.component').then(m => m.ChatComponent),
    canActivate: [authGuard]
  },
  {
    path: 'coach',
    loadComponent: () => import('./features/coach/coach.component').then(m => m.CoachComponent),
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard]
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'wellness',
    loadComponent: () => import('./features/wellness/wellness.component').then(m => m.WellnessComponent),
    canActivate: [authGuard]
  },
  {
    path: 'performance-tracking',
    loadComponent: () => import('./features/performance-tracking/performance-tracking.component').then(m => m.PerformanceTrackingComponent),
    canActivate: [authGuard]
  },
  {
    path: 'game-tracker',
    loadComponent: () => import('./features/game-tracker/game-tracker.component').then(m => m.GameTrackerComponent),
    canActivate: [authGuard]
  },
  {
    path: 'exercise-library',
    loadComponent: () => import('./features/exercise-library/exercise-library.component').then(m => m.ExerciseLibraryComponent),
    canActivate: [authGuard]
  },
  {
    path: 'workout',
    loadComponent: () => import('./features/workout/workout.component').then(m => m.WorkoutComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];

