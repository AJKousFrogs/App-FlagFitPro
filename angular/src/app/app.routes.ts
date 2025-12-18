import { Routes } from "@angular/router";
import { featureRoutes } from "./core/routes/feature-routes";

/**
 * Application Routes
 * 
 * Uses feature-based route organization for better code splitting
 * Routes are grouped by feature area and lazy loaded
 * 
 * Preloading Strategy:
 * - High-priority routes (dashboard, training, analytics) preload immediately
 * - Other authenticated routes preload after 2s delay
 * - Public routes preload after 5s delay
 * - Routes with data.preload = false are never preloaded
 */
export const routes: Routes = featureRoutes;
