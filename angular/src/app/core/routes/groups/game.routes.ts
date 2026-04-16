import { Routes } from "@angular/router";
import { authGuard } from "../../guards/auth.guard";

export const gameRoutes: Routes = [
  {
    path: "game/readiness",
    loadComponent: () =>
      import("../../../features/game/game-day-readiness/game-day-readiness.component").then(
        (m) => m.GameDayReadinessComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal", headerPreset: "analytics" }, // Only needed on game days - load on demand
  },
  {
    path: "game/nutrition",
    loadComponent: () =>
      import("../../../features/game/tournament-nutrition/tournament-nutrition.component").then(
        (m) => m.TournamentNutritionComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal", headerPreset: "analytics" },
  },
  {
    path: "travel/recovery",
    redirectTo: "wellness",
    pathMatch: "full",
    data: { entry: "legacy" },
  },
  {
    path: "game-tracker",
    redirectTo: "tournaments",
    pathMatch: "full",
    data: { entry: "legacy" },
  },
  {
    path: "tournaments",
    loadComponent: () =>
      import("../../../features/tournaments/tournaments.component").then(
        (m) => m.TournamentsComponent,
      ),
    canActivate: [authGuard],
    data: { preload: false, entry: "internal", headerPreset: "analytics" }, // Seasonal feature
  },
  // === NEW ROUTE: Live Game Tracker ===
  {
    path: "game-tracker/live",
    redirectTo: "tournaments",
    pathMatch: "full",
    data: { entry: "legacy" },
  },
];
