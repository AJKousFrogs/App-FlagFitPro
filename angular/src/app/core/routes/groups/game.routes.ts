import { Routes } from "@angular/router";
import { authGuard } from "../../guards/auth.guard";
import { gameTrackerPrefetchResolver } from "../../resolvers/game-tracker-prefetch.resolver";

export const gameRoutes: Routes = [
  {
    path: "game/readiness",
    loadComponent: () =>
      import("../../../features/game/game-day-readiness/game-day-readiness.component").then(
        (m) => m.GameDayReadinessComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Only needed on game days - load on demand
  },
  {
    path: "game/nutrition",
    loadComponent: () =>
      import("../../../features/game/tournament-nutrition/tournament-nutrition.component").then(
        (m) => m.TournamentNutritionComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Only needed on tournament days - load on demand
  },
  {
    path: "travel/recovery",
    loadComponent: () =>
      import("../../../features/travel/travel-recovery/travel-recovery.component").then(
        (m) => m.TravelRecoveryComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Only needed when traveling - load on demand
  },
  {
    path: "game-tracker",
    loadComponent: () =>
      import("../../../features/game-tracker/game-tracker.component").then(
        (m) => m.GameTrackerComponent,
      ),
    canActivate: [authGuard],
    resolve: { prefetch: gameTrackerPrefetchResolver },
    data: { preload: false, entry: "internal" }, // Heavy component, don't preload
  },
  {
    path: "tournaments",
    loadComponent: () =>
      import("../../../features/tournaments/tournaments.component").then(
        (m) => m.TournamentsComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Seasonal feature
  },
  // === NEW ROUTE: Live Game Tracker ===
  {
    path: "game-tracker/live",
    loadComponent: () =>
      import("../../../features/game-tracker/live-game-tracker.component").then(
        (m) => m.LiveGameTrackerComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal" }, // Heavy real-time component
  },
];
